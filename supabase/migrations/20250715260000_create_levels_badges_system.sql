-- Supabase Migration: Sistema de Níveis e Badges
-- Plataforma de Gestão G12 - Sistema de Gamificação com Níveis e Badges
-- Version: 1.0
-- Date: 15 de Julho de 2025
-- This script creates the levels and badges system to complement the Success Ladder

-- 1. CUSTOM TYPES

-- Define enum for badge categories
CREATE TYPE public.badge_category AS ENUM (
  'frequency',
  'leadership', 
  'learning',
  'service',
  'special'
);

-- Define enum for badge rarity levels
CREATE TYPE public.badge_rarity AS ENUM (
  'common',
  'rare', 
  'epic',
  'legendary'
);

-- 2. TABLES

-- Table for Success Ladder Levels
-- This table defines the hierarchical levels in the G12 Success Ladder
CREATE TABLE public.ladder_levels (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL,
  color VARCHAR(7) NOT NULL, -- hex color
  icon VARCHAR(50),
  description TEXT,
  unlocks_features TEXT[], -- array of features unlocked at this level
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.ladder_levels IS 'Defines the hierarchical levels for the G12 Success Ladder system';

-- Table for Badges
-- This table defines the achievement badges that members can earn
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category public.badge_category NOT NULL,
  criteria JSONB NOT NULL, -- criteria for unlocking the badge
  points_required INTEGER,
  rarity public.badge_rarity DEFAULT 'common',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.badges IS 'Defines achievement badges for member gamification';

-- Table for Member Badges
-- This table tracks which badges each member has earned
CREATE TABLE public.member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  criteria_met JSONB, -- data that led to the badge unlock
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(profile_id, badge_id)
);
COMMENT ON TABLE public.member_badges IS 'Tracks which badges each member has earned';

-- 3. INDEXES
-- Create indexes for performance on frequently queried columns

-- Indexes for ladder_levels
CREATE INDEX idx_ladder_levels_order_index ON public.ladder_levels(order_index);
CREATE INDEX idx_ladder_levels_is_active ON public.ladder_levels(is_active);
CREATE INDEX idx_ladder_levels_points_range ON public.ladder_levels(min_points, max_points);

-- Indexes for badges
CREATE INDEX idx_badges_category ON public.badges(category);
CREATE INDEX idx_badges_rarity ON public.badges(rarity);
CREATE INDEX idx_badges_is_active ON public.badges(is_active);

-- Indexes for member_badges
CREATE INDEX idx_member_badges_profile_id ON public.member_badges(profile_id);
CREATE INDEX idx_member_badges_badge_id ON public.member_badges(badge_id);
CREATE INDEX idx_member_badges_earned_at ON public.member_badges(earned_at);
CREATE INDEX idx_member_badges_is_featured ON public.member_badges(is_featured);

-- 4. ROW LEVEL SECURITY (RLS)
-- Enable RLS for all new tables
ALTER TABLE public.ladder_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

-- Policies for ladder_levels
-- All authenticated users can view levels (they are global)
CREATE POLICY "Authenticated users can view ladder levels" ON public.ladder_levels
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only system admins can manage levels (implementation specific)
CREATE POLICY "System admins can manage ladder levels" ON public.ladder_levels
  FOR ALL
  USING (public.get_my_role() = 'pastor'::public.user_role)
  WITH CHECK (public.get_my_role() = 'pastor'::public.user_role);

-- Policies for badges
-- All authenticated users can view active badges
CREATE POLICY "Authenticated users can view active badges" ON public.badges
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Only pastors can manage badges
CREATE POLICY "Pastors can manage badges" ON public.badges
  FOR ALL
  USING (public.get_my_role() = 'pastor'::public.user_role)
  WITH CHECK (public.get_my_role() = 'pastor'::public.user_role);

-- Policies for member_badges
-- Users can view badges from their church
CREATE POLICY "Users can view badges from their church" ON public.member_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = member_badges.profile_id 
      AND p.church_id = public.get_my_church_id()
    )
  );

-- Users can view their own badges
CREATE POLICY "Users can view their own badges" ON public.member_badges
  FOR SELECT
  USING (profile_id = auth.uid());

-- Leaders and above can award badges to members in their church
CREATE POLICY "Leaders can award badges to church members" ON public.member_badges
  FOR INSERT
  WITH CHECK (
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = member_badges.profile_id 
      AND p.church_id = public.get_my_church_id()
    )
  );

-- 5. FUNCTIONS

-- Function to get member's current level
CREATE OR REPLACE FUNCTION public.get_member_level(member_score INTEGER)
RETURNS TABLE (
  level_id INTEGER,
  name VARCHAR,
  color VARCHAR,
  icon VARCHAR,
  description TEXT,
  progress_percentage NUMERIC,
  points_to_next INTEGER
) AS $$
DECLARE
  current_level RECORD;
  next_level RECORD;
BEGIN
  -- Find current level
  SELECT * INTO current_level 
  FROM public.ladder_levels 
  WHERE member_score >= min_points AND member_score <= max_points
    AND is_active = true
  ORDER BY order_index DESC 
  LIMIT 1;
  
  -- If no level found, return the first level
  IF current_level.id IS NULL THEN
    SELECT * INTO current_level
    FROM public.ladder_levels
    WHERE is_active = true
    ORDER BY order_index ASC
    LIMIT 1;
  END IF;
  
  -- Find next level
  SELECT * INTO next_level
  FROM public.ladder_levels
  WHERE order_index = current_level.order_index + 1 AND is_active = true;
  
  RETURN QUERY SELECT
    current_level.id,
    current_level.name,
    current_level.color,
    current_level.icon,
    current_level.description,
    CASE 
      WHEN next_level.id IS NULL THEN 100.0
      ELSE ((member_score - current_level.min_points)::NUMERIC / 
            (next_level.min_points - current_level.min_points)::NUMERIC * 100)
    END,
    CASE
      WHEN next_level.id IS NULL THEN 0
      ELSE (next_level.min_points - member_score)
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if member deserves specific badges
CREATE OR REPLACE FUNCTION public.check_member_badges(member_id UUID)
RETURNS TABLE (badge_id UUID, criteria_met JSONB) AS $$
DECLARE
  badge_record RECORD;
  member_data RECORD;
  earned BOOLEAN;
  criteria_data JSONB;
BEGIN
  -- Get member data
  SELECT * INTO member_data FROM public.profiles WHERE id = member_id;
  
  -- Check each active badge
  FOR badge_record IN SELECT * FROM public.badges WHERE is_active = true LOOP
    earned := false;
    criteria_data := '{}';
    
    -- Check criteria based on type
    CASE badge_record.criteria->>'type'
      WHEN 'attendance' THEN
        earned := check_attendance_criteria(member_id, badge_record.criteria);
        
      WHEN 'role_change' THEN
        earned := member_data.role = (badge_record.criteria->>'to_role')::public.user_role;
        
      WHEN 'courses_completed' THEN
        earned := check_courses_criteria(member_id, badge_record.criteria);
        
      WHEN 'service_count' THEN
        earned := check_service_criteria(member_id, badge_record.criteria);
        
      WHEN 'cell_multiplication' THEN
        earned := check_multiplication_criteria(member_id, badge_record.criteria);
        
      WHEN 'mentor_count' THEN
        earned := check_mentor_criteria(member_id, badge_record.criteria);
        
      ELSE
        earned := false;
    END CASE;
    
    -- If deserves the badge and doesn't have it yet
    IF earned AND NOT EXISTS (
      SELECT 1 FROM public.member_badges 
      WHERE profile_id = member_id AND badge_id = badge_record.id
    ) THEN
      RETURN QUERY SELECT badge_record.id, criteria_data;
    END IF;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check attendance criteria
CREATE OR REPLACE FUNCTION public.check_attendance_criteria(member_id UUID, criteria JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  required_percentage INTEGER;
  period_type TEXT;
  days_back INTEGER;
  actual_percentage NUMERIC;
  total_possible INTEGER;
  actual_attendance INTEGER;
BEGIN
  required_percentage := (criteria->>'percentage')::INTEGER;
  period_type := criteria->>'period';
  
  CASE period_type
    WHEN 'month' THEN days_back := 30;
    WHEN 'quarter' THEN days_back := 90;
    WHEN 'year' THEN days_back := 365;
    ELSE days_back := 30;
  END CASE;
  
  -- Count actual attendance
  SELECT COUNT(*) INTO actual_attendance
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id 
    AND sla.category = 'attendance'
    AND mal.activity_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  -- Calculate expected attendance (assuming weekly meetings)
  total_possible := days_back / 7;
  actual_percentage := (actual_attendance::NUMERIC / total_possible::NUMERIC) * 100;
  
  RETURN actual_percentage >= required_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check courses criteria
CREATE OR REPLACE FUNCTION public.check_courses_criteria(member_id UUID, criteria JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  actual_count INTEGER;
BEGIN
  required_count := (criteria->>'count')::INTEGER;
  
  -- Count completed courses (assuming courses are tracked in activity log)
  SELECT COUNT(DISTINCT activity_id) INTO actual_count
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id 
    AND sla.category = 'courses';
  
  RETURN actual_count >= required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check service criteria
CREATE OR REPLACE FUNCTION public.check_service_criteria(member_id UUID, criteria JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  actual_count INTEGER;
BEGIN
  required_count := (criteria->>'minimum')::INTEGER;
  
  -- Count service activities
  SELECT COUNT(*) INTO actual_count
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id 
    AND sla.category = 'service';
  
  RETURN actual_count >= required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check cell multiplication criteria
CREATE OR REPLACE FUNCTION public.check_multiplication_criteria(member_id UUID, criteria JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  actual_count INTEGER;
BEGIN
  required_count := (criteria->>'count')::INTEGER;
  
  -- Count cells where this member was the leader (simplified logic)
  SELECT COUNT(*) INTO actual_count
  FROM public.cells
  WHERE leader_id = member_id;
  
  RETURN actual_count >= required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check mentor criteria
CREATE OR REPLACE FUNCTION public.check_mentor_criteria(member_id UUID, criteria JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  actual_count INTEGER;
BEGIN
  required_count := (criteria->>'minimum')::INTEGER;
  
  -- Count members who have been mentored (simplified logic)
  -- This could be enhanced based on specific mentorship tracking
  SELECT COUNT(*) INTO actual_count
  FROM public.cell_members cm
  JOIN public.cells c ON cm.cell_id = c.id
  WHERE c.leader_id = member_id AND cm.is_timoteo = true;
  
  RETURN actual_count >= required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger badge checks when score changes
CREATE OR REPLACE FUNCTION public.trigger_check_badges()
RETURNS TRIGGER AS $$
DECLARE
  new_badge RECORD;
BEGIN
  -- Check for new badges for the member
  FOR new_badge IN SELECT * FROM public.check_member_badges(NEW.profile_id) LOOP
    INSERT INTO public.member_badges (profile_id, badge_id, criteria_met)
    VALUES (NEW.profile_id, new_badge.badge_id, new_badge.criteria_met);
    
    -- Create notification for badge earned (if notifications table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
      INSERT INTO public.notifications (user_id, title, message, type, icon)
      SELECT NEW.profile_id, 'Nova Conquista!', 
             'Você conquistou o badge: ' || b.name || '!',
             'badge_earned', b.icon
      FROM public.badges b WHERE b.id = new_badge.badge_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically check badges when scores change
CREATE TRIGGER trigger_badge_check
  AFTER UPDATE OF success_ladder_score ON public.cell_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_badges();

-- 6. POPULATE DEFAULT DATA

-- Insert Success Ladder Levels (G12 Hierarchy)
INSERT INTO public.ladder_levels (id, name, min_points, max_points, color, icon, description, order_index, unlocks_features) VALUES
(1, 'Visitante', 0, 49, '#94A3B8', '👋', 'Conhecendo a igreja e a Visão G12', 1, '{"basic_access"}'),
(2, 'Membro', 50, 149, '#10B981', '🙏', 'Membro ativo da igreja', 2, '{"cell_participation", "basic_features"}'),
(3, 'Consolidado', 150, 299, '#3B82F6', '🤝', 'Passou pelo Encontro e está consolidado', 3, '{"mentor_access", "advanced_features"}'),
(4, 'Discípulo', 300, 599, '#8B5CF6', '📖', 'Em processo de discipulado ativo', 4, '{"discipleship_tools", "learning_modules"}'),
(5, 'Timóteo', 600, 999, '#F59E0B', '🌱', 'Líder em formação, auxiliar direto', 5, '{"leadership_training", "assistant_tools"}'),
(6, 'Líder Potencial', 1000, 1999, '#EF4444', '⭐', 'Pronto para liderar célula', 6, '{"pre_leadership_tools", "cell_planning"}'),
(7, 'Líder', 2000, 3999, '#DC2626', '👑', 'Liderando célula ativa', 7, '{"cell_management", "member_tools", "reporting"}'),
(8, 'Supervisor', 4000, 7999, '#7C3AED', '🏆', 'Supervisionando múltiplas células', 8, '{"supervision_tools", "multi_cell_management", "advanced_analytics"}'),
(9, 'Pastor', 8000, 15999, '#1D4ED8', '⛪', 'Liderança pastoral da igreja', 9, '{"pastoral_tools", "church_management", "full_admin"}'),
(10, 'Líder Sênior', 16000, 999999, '#0F172A', '💎', 'Máximo nível de liderança', 10, '{"all_features", "system_admin", "global_access"}');

-- Insert Default Badges

-- Frequency Badges
INSERT INTO public.badges (name, description, icon, category, criteria, rarity) VALUES
('Mês Perfeito', '100% de presença em células durante 1 mês', '⭐', 'frequency', '{"type": "attendance", "period": "month", "percentage": 100}', 'rare'),
('Consistência Trimestral', '90%+ presença durante 3 meses consecutivos', '🔥', 'frequency', '{"type": "attendance", "period": "quarter", "percentage": 90}', 'epic'),
('Guerreiro Anual', '80%+ presença no ano', '🏆', 'frequency', '{"type": "attendance", "period": "year", "percentage": 80}', 'legendary'),
('Frequentador Fiel', '70%+ presença em um mês', '✨', 'frequency', '{"type": "attendance", "period": "month", "percentage": 70}', 'common');

-- Leadership Badges
INSERT INTO public.badges (name, description, icon, category, criteria, rarity) VALUES
('Primeiro Timóteo', 'Tornar-se Timóteo pela primeira vez', '🌱', 'leadership', '{"type": "role_change", "to_role": "timoteo"}', 'rare'),
('Mentor', 'Treinar 3 Timóteos com sucesso', '👨‍🏫', 'leadership', '{"type": "mentor_count", "minimum": 3}', 'epic'),
('Multiplicador', 'Liderar primeira multiplicação de célula', '🌟', 'leadership', '{"type": "cell_multiplication", "count": 1}', 'epic'),
('Líder Nato', 'Tornar-se líder de célula', '👑', 'leadership', '{"type": "role_change", "to_role": "leader"}', 'rare'),
('Supervisor Experiente', 'Alcançar o nível de supervisor', '🏆', 'leadership', '{"type": "role_change", "to_role": "supervisor"}', 'epic');

-- Learning Badges  
INSERT INTO public.badges (name, description, icon, category, criteria, rarity) VALUES
('Estudante Dedicado', 'Completar 5 módulos educacionais', '📚', 'learning', '{"type": "courses_completed", "count": 5}', 'common'),
('Graduado da Vida', 'Completar Universidade da Vida', '🎓', 'learning', '{"type": "course_completed", "course": "universidade_vida"}', 'rare'),
('Mestre do Destino', 'Completar Capacitação Destino', '👑', 'learning', '{"type": "course_completed", "course": "capacitacao_destino"}', 'epic'),
('Aprendiz Consistente', 'Completar 3 cursos diferentes', '📖', 'learning', '{"type": "courses_completed", "count": 3}', 'common'),
('Sábio da Palavra', 'Completar 10 módulos educacionais', '🧠', 'learning', '{"type": "courses_completed", "count": 10}', 'epic');

-- Service Badges
INSERT INTO public.badges (name, description, icon, category, criteria, rarity) VALUES
('Voluntário Dedicado', 'Participar de 10 serviços voluntários', '🤝', 'service', '{"type": "service_count", "minimum": 10}', 'common'),
('Servo Fiel', 'Participar de 50 serviços voluntários', '❤️', 'service', '{"type": "service_count", "minimum": 50}', 'rare'),
('Ministro Ativo', 'Liderar um ministério da igreja', '⚡', 'service', '{"type": "ministry_leader", "active": true}', 'epic'),
('Primeiro Serviço', 'Participar do primeiro serviço voluntário', '🌟', 'service', '{"type": "service_count", "minimum": 1}', 'common'),
('Coração de Servo', 'Participar de 25 serviços voluntários', '💝', 'service', '{"type": "service_count", "minimum": 25}', 'rare');

-- Special Badges
INSERT INTO public.badges (name, description, icon, category, criteria, rarity) VALUES
('Pioneiro', 'Entre os primeiros membros da plataforma', '🚀', 'special', '{"type": "early_adopter", "days": 30}', 'legendary'),
('Aniversariante', 'Recebido no aniversário de 1 ano na igreja', '🎂', 'special', '{"type": "anniversary", "years": 1}', 'common'),
('Veterano', 'Membro há mais de 5 anos', '🏅', 'special', '{"type": "anniversary", "years": 5}', 'epic'),
('Fundador', 'Membro fundador da célula', '🏗️', 'special', '{"type": "founding_member"}', 'legendary');

-- 7. ADDITIONAL HELPER FUNCTIONS

-- Function to get member's earned badges
CREATE OR REPLACE FUNCTION public.get_member_badges(member_id UUID)
RETURNS TABLE (
  badge_id UUID,
  name VARCHAR,
  description TEXT,
  icon VARCHAR,
  category public.badge_category,
  rarity public.badge_rarity,
  earned_at TIMESTAMPTZ,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.icon,
    b.category,
    b.rarity,
    mb.earned_at,
    mb.is_featured
  FROM public.member_badges mb
  JOIN public.badges b ON mb.badge_id = b.id
  WHERE mb.profile_id = member_id
  ORDER BY mb.earned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get church leaderboard with levels
CREATE OR REPLACE FUNCTION public.get_church_leaderboard_with_levels(church_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  success_ladder_score INTEGER,
  level_name VARCHAR,
  level_color VARCHAR,
  level_icon VARCHAR,
  badge_count INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH member_scores AS (
    SELECT 
      p.id,
      p.full_name,
      cm.success_ladder_score,
      ROW_NUMBER() OVER (ORDER BY cm.success_ladder_score DESC) as rank
    FROM public.profiles p
    JOIN public.cell_members cm ON p.id = cm.profile_id
    WHERE p.church_id = get_church_leaderboard_with_levels.church_id
  ),
  member_badges_count AS (
    SELECT 
      profile_id,
      COUNT(*) as badge_count
    FROM public.member_badges
    GROUP BY profile_id
  ),
  member_levels AS (
    SELECT 
      ms.*,
      ll.name as level_name,
      ll.color as level_color,
      ll.icon as level_icon
    FROM member_scores ms
    CROSS JOIN LATERAL (
      SELECT name, color, icon
      FROM public.get_member_level(ms.success_ladder_score)
      LIMIT 1
    ) ll
  )
  SELECT 
    ml.id,
    ml.full_name,
    ml.success_ladder_score,
    ml.level_name,
    ml.level_color,
    ml.level_icon,
    COALESCE(mbc.badge_count, 0)::INTEGER,
    ml.rank::INTEGER
  FROM member_levels ml
  LEFT JOIN member_badges_count mbc ON ml.id = mbc.profile_id
  ORDER BY ml.success_ladder_score DESC
  LIMIT get_church_leaderboard_with_levels.limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually award a badge to a member
CREATE OR REPLACE FUNCTION public.award_badge_to_member(
  member_id UUID,
  badge_id UUID,
  awarded_by UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  criteria_data JSONB;
BEGIN
  -- Check if member already has this badge
  IF EXISTS (
    SELECT 1 FROM public.member_badges 
    WHERE profile_id = member_id AND badge_id = award_badge_to_member.badge_id
  ) THEN
    RETURN FALSE; -- Already has badge
  END IF;
  
  -- Prepare criteria data for manual award
  criteria_data := jsonb_build_object(
    'type', 'manual_award',
    'awarded_by', awarded_by,
    'reason', COALESCE(reason, 'Awarded manually by leadership')
  );
  
  -- Award the badge
  INSERT INTO public.member_badges (profile_id, badge_id, criteria_met)
  VALUES (member_id, award_badge_to_member.badge_id, criteria_data);
  
  -- Create notification
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, title, message, type, icon)
    SELECT member_id, 'Nova Conquista!', 
           'Você foi premiado com o badge: ' || b.name || '!',
           'badge_earned', b.icon
    FROM public.badges b WHERE b.id = award_badge_to_member.badge_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;