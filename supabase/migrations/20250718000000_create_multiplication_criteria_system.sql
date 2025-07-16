-- Supabase Migration: Sistema de Critérios Automáticos de Multiplicação
-- Plataforma de Gestão G12 - Sistema Inteligente de Avaliação de Multiplicação
-- Version: 1.0
-- Date: 18 de Julho de 2025
-- This script creates the automatic multiplication criteria system for the G12 Vision

-- 1. CUSTOM TYPES
-- Define enums for multiplication criteria and status

CREATE TYPE public.criteria_type AS ENUM (
  'member_count',
  'meeting_frequency',
  'average_attendance',
  'potential_leaders',
  'cell_age_months',
  'leader_maturity',
  'growth_rate',
  'stability_score'
);

CREATE TYPE public.multiplication_status AS ENUM (
  'not_ready',
  'preparing',
  'ready',
  'optimal',
  'overdue'
);

CREATE TYPE public.meeting_type AS ENUM (
  'regular',
  'special',
  'training',
  'evangelistic',
  'fellowship'
);

CREATE TYPE public.alert_type AS ENUM (
  'ready_for_multiplication',
  'slow_growth',
  'missing_leader',
  'low_attendance'
);

-- 2. TABLES

-- Table for multiplication criteria configuration
CREATE TABLE public.multiplication_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  criteria_type public.criteria_type NOT NULL,
  threshold_value NUMERIC NOT NULL,
  weight NUMERIC(3,2) DEFAULT 1.0 CHECK (weight >= 0.01 AND weight <= 1.00),
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.multiplication_criteria IS 'Configuration of criteria used to evaluate cell multiplication readiness';

-- Table for multiplication readiness tracking
CREATE TABLE public.multiplication_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
  readiness_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  status public.multiplication_status DEFAULT 'not_ready',
  criteria_results JSONB NOT NULL DEFAULT '{}',
  projected_date DATE,
  confidence_level NUMERIC(3,2) DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  recommendations TEXT[],
  blocking_factors TEXT[],
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cell_id) -- One readiness record per cell
);
COMMENT ON TABLE public.multiplication_readiness IS 'Tracks multiplication readiness scores and recommendations for cells';

-- Table for cell meetings tracking
CREATE TABLE public.cell_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  planned_attendees INTEGER,
  actual_attendees INTEGER,
  duration_minutes INTEGER,
  meeting_type public.meeting_type DEFAULT 'regular',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.cell_meetings IS 'Records of cell meetings for attendance and frequency tracking';

-- 3. INDEXES
-- Create indexes for performance on frequently queried columns

CREATE INDEX idx_multiplication_criteria_church_id ON public.multiplication_criteria(church_id);
CREATE INDEX idx_multiplication_criteria_criteria_type ON public.multiplication_criteria(criteria_type);
CREATE INDEX idx_multiplication_criteria_is_active ON public.multiplication_criteria(is_active);

CREATE INDEX idx_multiplication_readiness_cell_id ON public.multiplication_readiness(cell_id);
CREATE INDEX idx_multiplication_readiness_status ON public.multiplication_readiness(status);
CREATE INDEX idx_multiplication_readiness_readiness_score ON public.multiplication_readiness(readiness_score DESC);
CREATE INDEX idx_multiplication_readiness_last_evaluated ON public.multiplication_readiness(last_evaluated_at);

CREATE INDEX idx_cell_meetings_cell_id ON public.cell_meetings(cell_id);
CREATE INDEX idx_cell_meetings_meeting_date ON public.cell_meetings(meeting_date DESC);
CREATE INDEX idx_cell_meetings_created_by ON public.cell_meetings(created_by);

-- 4. TRIGGERS FOR UPDATED_AT
-- Add triggers for automatic updated_at timestamp updates

CREATE TRIGGER on_multiplication_criteria_update 
  BEFORE UPDATE ON public.multiplication_criteria 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_multiplication_readiness_update 
  BEFORE UPDATE ON public.multiplication_readiness 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS for all new tables

ALTER TABLE public.multiplication_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplication_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_meetings ENABLE ROW LEVEL SECURITY;

-- Policies for multiplication_criteria
-- Users can view criteria from their church
CREATE POLICY "Users can view multiplication criteria from their church" ON public.multiplication_criteria
  FOR SELECT 
  USING (church_id = public.get_my_church_id());

-- Leaders and above can manage criteria in their church
CREATE POLICY "Leaders can manage multiplication criteria in their church" ON public.multiplication_criteria
  FOR ALL
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
  )
  WITH CHECK (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
  );

-- Policies for multiplication_readiness
-- Users can view readiness data for cells in their church
CREATE POLICY "Users can view multiplication readiness from their church" ON public.multiplication_readiness
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = multiplication_readiness.cell_id 
      AND c.church_id = public.get_my_church_id()
    )
  );

-- Leaders can manage readiness data for cells in their church
CREATE POLICY "Leaders can manage multiplication readiness in their church" ON public.multiplication_readiness
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = multiplication_readiness.cell_id 
      AND c.church_id = public.get_my_church_id()
      AND (
        c.leader_id = auth.uid() OR
        public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = multiplication_readiness.cell_id 
      AND c.church_id = public.get_my_church_id()
      AND (
        c.leader_id = auth.uid() OR
        public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
      )
    )
  );

-- Policies for cell_meetings
-- Users can view meetings for cells in their church
CREATE POLICY "Users can view cell meetings from their church" ON public.cell_meetings
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = cell_meetings.cell_id 
      AND c.church_id = public.get_my_church_id()
    )
  );

-- Cell leaders can manage meetings for their cells
CREATE POLICY "Cell leaders can manage meetings for their cells" ON public.cell_meetings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = cell_meetings.cell_id 
      AND (
        c.leader_id = auth.uid() OR
        public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cells c 
      WHERE c.id = cell_meetings.cell_id 
      AND (
        c.leader_id = auth.uid() OR
        public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
      )
    )
  );

-- 6. POPULATE DEFAULT MULTIPLICATION CRITERIA
-- Insert default criteria for all existing churches

INSERT INTO public.multiplication_criteria (church_id, name, description, criteria_type, threshold_value, weight, is_required) 
SELECT 
  c.id,
  'Número Mínimo de Membros',
  'Célula deve ter pelo menos 12 membros ativos',
  'member_count'::criteria_type,
  12,
  0.25,
  true
FROM public.churches c

UNION ALL

SELECT 
  c.id,
  'Frequência de Reuniões',
  'Pelo menos 80% das reuniões planejadas realizadas',
  'meeting_frequency'::criteria_type,
  80,
  0.20,
  true
FROM public.churches c

UNION ALL

SELECT 
  c.id,
  'Presença Média',
  'Presença média de 75% dos membros nas reuniões',
  'average_attendance'::criteria_type,
  75,
  0.20,
  true
FROM public.churches c

UNION ALL

SELECT 
  c.id,
  'Líderes em Potencial',
  'Pelo menos 2 líderes em potencial identificados',
  'potential_leaders'::criteria_type,
  2,
  0.15,
  true
FROM public.churches c

UNION ALL

SELECT 
  c.id,
  'Tempo de Vida da Célula',
  'Célula deve existir há pelo menos 6 meses',
  'cell_age_months'::criteria_type,
  6,
  0.10,
  true
FROM public.churches c

UNION ALL

SELECT 
  c.id,
  'Maturidade do Líder',
  'Líder deve ter pontuação mínima na Escada do Sucesso',
  'leader_maturity'::criteria_type,
  800,
  0.10,
  false
FROM public.churches c;

-- 7. HELPER FUNCTIONS FOR MULTIPLICATION CRITERIA

-- Function to calculate meeting frequency percentage
CREATE OR REPLACE FUNCTION public.calculate_meeting_frequency(p_cell_id UUID, days_back INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  expected_meetings INTEGER;
  actual_meetings INTEGER;
  frequency_percentage NUMERIC;
BEGIN
  -- Calculate expected meetings (assuming weekly meetings)
  expected_meetings := (days_back / 7)::INTEGER;
  
  -- Count actual meetings in the period
  SELECT COUNT(*) INTO actual_meetings
  FROM public.cell_meetings
  WHERE cell_id = p_cell_id
    AND meeting_date >= CURRENT_DATE - days_back;
  
  IF expected_meetings > 0 THEN
    frequency_percentage := (actual_meetings::NUMERIC / expected_meetings::NUMERIC) * 100;
  ELSE
    frequency_percentage := 0;
  END IF;
  
  RETURN LEAST(100, frequency_percentage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate average attendance percentage
CREATE OR REPLACE FUNCTION public.calculate_average_attendance(p_cell_id UUID, days_back INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  avg_attendance NUMERIC;
  member_count INTEGER;
  attendance_percentage NUMERIC;
BEGIN
  -- Get average attendance from meetings
  SELECT 
    AVG(actual_attendees) INTO avg_attendance
  FROM public.cell_meetings
  WHERE cell_id = p_cell_id
    AND meeting_date >= CURRENT_DATE - days_back
    AND actual_attendees IS NOT NULL;
  
  -- Get current member count
  SELECT COUNT(*) INTO member_count
  FROM public.cell_members
  WHERE cell_id = p_cell_id;
  
  IF member_count > 0 AND avg_attendance IS NOT NULL THEN
    attendance_percentage := (avg_attendance / member_count) * 100;
  ELSE
    attendance_percentage := 0;
  END IF;
  
  RETURN LEAST(100, attendance_percentage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get potential leaders count
CREATE OR REPLACE FUNCTION public.get_potential_leaders_count(p_cell_id UUID)
RETURNS INTEGER AS $$
DECLARE
  potential_count INTEGER := 0;
BEGIN
  -- Count members with leadership potential (score >= 70 in leadership pipeline)
  SELECT COUNT(*) INTO potential_count
  FROM public.leadership_pipeline lp
  JOIN public.cell_members cm ON lp.profile_id = cm.profile_id
  WHERE cm.cell_id = p_cell_id 
    AND lp.leadership_score >= 70
    AND lp.is_active = true;
    
  RETURN potential_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate cell age in months
CREATE OR REPLACE FUNCTION public.get_cell_age_months(p_cell_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  age_months NUMERIC;
BEGIN
  SELECT 
    EXTRACT(months FROM age(NOW(), created_at)) INTO age_months
  FROM public.cells 
  WHERE id = p_cell_id;
  
  RETURN COALESCE(age_months, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leader maturity score
CREATE OR REPLACE FUNCTION public.get_leader_maturity_score(p_cell_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  maturity_score NUMERIC := 0;
BEGIN
  -- Get leader's success ladder score
  SELECT COALESCE(cm.success_ladder_score, 0) INTO maturity_score
  FROM public.cells c
  JOIN public.cell_members cm ON c.leader_id = cm.profile_id
  WHERE c.id = p_cell_id
  LIMIT 1;
  
  RETURN maturity_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;