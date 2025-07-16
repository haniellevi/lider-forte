-- Supabase Migration: Sistema Escada do Sucesso
-- Plataforma de Gestão G12 - Sistema de Gamificação
-- Version: 1.0
-- Date: 15 de Julho de 2025
-- This script creates the success ladder scoring system for G12 Vision gamification

-- 1. CUSTOM TYPES
-- Define enum for activity categories
CREATE TYPE public.activity_category AS ENUM (
  'attendance', 
  'events', 
  'courses', 
  'service', 
  'consistency'
);

-- 2. TABLES

-- Table for Success Ladder Activities
-- This table defines the activities that members can participate in to earn points
CREATE TABLE public.success_ladder_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  points INTEGER NOT NULL,
  category public.activity_category NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.success_ladder_activities IS 'Defines activities for the Success Ladder scoring system';

-- Table for Member Activity Log
-- This table tracks all activities performed by members and points earned
CREATE TABLE public.member_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.success_ladder_activities(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  activity_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.member_activity_log IS 'Logs all member activities and points earned for Success Ladder';

-- 3. INDEXES
-- Create indexes for performance on frequently queried columns
CREATE INDEX idx_success_ladder_activities_church_id ON public.success_ladder_activities(church_id);
CREATE INDEX idx_success_ladder_activities_category ON public.success_ladder_activities(category);
CREATE INDEX idx_success_ladder_activities_is_active ON public.success_ladder_activities(is_active);

CREATE INDEX idx_member_activity_log_profile_id ON public.member_activity_log(profile_id);
CREATE INDEX idx_member_activity_log_activity_id ON public.member_activity_log(activity_id);
CREATE INDEX idx_member_activity_log_activity_date ON public.member_activity_log(activity_date);
CREATE INDEX idx_member_activity_log_profile_date ON public.member_activity_log(profile_id, activity_date);

-- 4. TRIGGERS FOR UPDATED_AT
-- Add triggers for automatic updated_at timestamp updates
CREATE TRIGGER on_success_ladder_activities_update 
  BEFORE UPDATE ON public.success_ladder_activities 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS for all new tables
ALTER TABLE public.success_ladder_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for success_ladder_activities
-- Users can view activities from their church
CREATE POLICY "Users can view activities from their church" ON public.success_ladder_activities
  FOR SELECT 
  USING (church_id = public.get_my_church_id());

-- Leaders and above can manage activities in their church
CREATE POLICY "Leaders can manage activities in their church" ON public.success_ladder_activities
  FOR ALL
  USING (church_id = public.get_my_church_id() AND public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role))
  WITH CHECK (church_id = public.get_my_church_id() AND public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role));

-- Policies for member_activity_log
-- Users can view activity logs from their church
CREATE POLICY "Users can view activity logs from their church" ON public.member_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = member_activity_log.profile_id 
      AND p.church_id = public.get_my_church_id()
    )
  );

-- Leaders can insert activity logs for members in their cells
CREATE POLICY "Leaders can create activity logs for their cell members" ON public.member_activity_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cell_members cm
      JOIN public.cells c ON cm.cell_id = c.id
      WHERE cm.profile_id = member_activity_log.profile_id
      AND c.leader_id = auth.uid()
    )
    OR public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
  );

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON public.member_activity_log
  FOR SELECT
  USING (profile_id = auth.uid());

-- 6. FUNCTIONS

-- Function to calculate member's total score
CREATE OR REPLACE FUNCTION public.calculate_member_score(member_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  consistency_bonus INTEGER := 0;
  monthly_attendance INTEGER := 0;
  quarterly_attendance INTEGER := 0;
BEGIN
  -- Sum direct points from activities
  SELECT COALESCE(SUM(points_earned), 0) INTO total_points
  FROM public.member_activity_log
  WHERE profile_id = member_id;

  -- Calculate attendance-based consistency bonuses
  -- Monthly consistency (last 30 days)
  SELECT COUNT(*) INTO monthly_attendance
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id 
    AND sla.category = 'attendance'
    AND mal.activity_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Quarterly consistency (last 90 days)
  SELECT COUNT(*) INTO quarterly_attendance
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id 
    AND sla.category = 'attendance'
    AND mal.activity_date >= CURRENT_DATE - INTERVAL '90 days';

  -- Calculate consistency bonuses
  IF quarterly_attendance >= 12 THEN -- ~85% attendance over 3 months
    consistency_bonus := 150;
  ELSIF monthly_attendance >= 4 THEN -- ~85% attendance in a month
    consistency_bonus := 50;
  END IF;

  RETURN total_points + consistency_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update member ladder score automatically
CREATE OR REPLACE FUNCTION public.update_member_ladder_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the score in cell_members table
  UPDATE public.cell_members 
  SET success_ladder_score = public.calculate_member_score(NEW.profile_id),
      updated_at = NOW()
  WHERE profile_id = NEW.profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update ladder scores when activities are logged
CREATE TRIGGER trigger_update_ladder_score
  AFTER INSERT ON public.member_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_ladder_score();

-- Function to get cell ladder ranking
CREATE OR REPLACE FUNCTION public.get_cell_ladder_ranking(cell_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  success_ladder_score INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    cm.success_ladder_score,
    ROW_NUMBER() OVER (ORDER BY cm.success_ladder_score DESC)::INTEGER
  FROM public.profiles p
  JOIN public.cell_members cm ON p.id = cm.profile_id
  WHERE cm.cell_id = get_cell_ladder_ranking.cell_id
  ORDER BY cm.success_ladder_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get church-wide ladder ranking
CREATE OR REPLACE FUNCTION public.get_church_ladder_ranking(church_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  success_ladder_score INTEGER,
  cell_name TEXT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    cm.success_ladder_score,
    c.name,
    ROW_NUMBER() OVER (ORDER BY cm.success_ladder_score DESC)::INTEGER
  FROM public.profiles p
  JOIN public.cell_members cm ON p.id = cm.profile_id
  JOIN public.cells c ON cm.cell_id = c.id
  WHERE p.church_id = get_church_ladder_ranking.church_id
  ORDER BY cm.success_ladder_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent duplicate activity logging on same day
CREATE OR REPLACE FUNCTION public.check_duplicate_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if member already logged this activity today
  IF EXISTS (
    SELECT 1 FROM public.member_activity_log
    WHERE profile_id = NEW.profile_id
    AND activity_id = NEW.activity_id
    AND activity_date = NEW.activity_date
  ) THEN
    RAISE EXCEPTION 'Member has already logged this activity for today';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicate activities
CREATE TRIGGER trigger_check_duplicate_activity
  BEFORE INSERT ON public.member_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_activity();

-- 7. AUDIT FUNCTIONS

-- Function to create audit log for score changes
CREATE OR REPLACE FUNCTION public.audit_score_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if score actually changed
  IF OLD.success_ladder_score != NEW.success_ladder_score THEN
    INSERT INTO public.member_activity_log (
      profile_id,
      activity_id,
      points_earned,
      activity_date,
      metadata
    ) VALUES (
      NEW.profile_id,
      NULL, -- Special case for automatic score updates
      NEW.success_ladder_score - OLD.success_ladder_score,
      CURRENT_DATE,
      jsonb_build_object(
        'type', 'score_update',
        'old_score', OLD.success_ladder_score,
        'new_score', NEW.success_ladder_score,
        'reason', 'automatic_recalculation'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trigger to cell_members table
CREATE TRIGGER trigger_audit_score_change
  AFTER UPDATE ON public.cell_members
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_score_change();