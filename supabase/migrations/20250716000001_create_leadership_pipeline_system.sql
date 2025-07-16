-- Supabase Migration: Sistema de Pipeline de Liderança com IA
-- Plataforma de Gestão G12 - Identificação Automática de Potencial de Liderança
-- Version: 1.0
-- Date: 16 de Julho de 2025
-- This script creates the AI-powered leadership identification system for the G12 Vision

-- 1. CUSTOM TYPES
-- Define enum for leadership levels
CREATE TYPE public.leadership_level AS ENUM (
  'member',
  'timoteo',
  'leader_potential',
  'leader_ready',
  'supervisor_potential'
);

-- Define enum for factor categories
CREATE TYPE public.factor_category AS ENUM (
  'attendance',
  'growth',
  'engagement', 
  'influence',
  'service',
  'learning',
  'leadership_traits'
);

-- Define enum for assessment types
CREATE TYPE public.assessment_type AS ENUM (
  'supervisor_feedback',
  'peer_review',
  'self_assessment',
  'behavioral_observation'
);

-- 2. TABLES

-- Table for Leadership Pipeline tracking
CREATE TABLE public.leadership_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  leadership_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (leadership_score >= 0 AND leadership_score <= 100),
  potential_level public.leadership_level DEFAULT 'member',
  confidence_score NUMERIC(5,2) DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  factors JSONB NOT NULL DEFAULT '{}',
  recommendations TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id) -- One record per member
);
COMMENT ON TABLE public.leadership_pipeline IS 'Tracks leadership potential scores and recommendations for members';

-- Table for Leadership Factors configuration
CREATE TABLE public.leadership_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  category public.factor_category NOT NULL,
  weight NUMERIC(3,2) NOT NULL CHECK (weight >= 0.01 AND weight <= 1.00),
  calculation_method TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.leadership_factors IS 'Configuration of factors used in leadership score calculation';

-- Table for Leadership Assessments
CREATE TABLE public.leadership_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES public.profiles(id),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  assessment_type public.assessment_type DEFAULT 'supervisor_feedback',
  scores JSONB NOT NULL, -- {"communication": 8, "leadership": 7, ...}
  comments TEXT,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.leadership_assessments IS 'Manual assessments by supervisors and peers for leadership evaluation';

-- 3. INDEXES
-- Create indexes for performance on frequently queried columns
CREATE INDEX idx_leadership_pipeline_profile_id ON public.leadership_pipeline(profile_id);
CREATE INDEX idx_leadership_pipeline_church_id ON public.leadership_pipeline(church_id);
CREATE INDEX idx_leadership_pipeline_potential_level ON public.leadership_pipeline(potential_level);
CREATE INDEX idx_leadership_pipeline_leadership_score ON public.leadership_pipeline(leadership_score DESC);
CREATE INDEX idx_leadership_pipeline_last_calculated ON public.leadership_pipeline(last_calculated_at);

CREATE INDEX idx_leadership_factors_category ON public.leadership_factors(category);
CREATE INDEX idx_leadership_factors_is_active ON public.leadership_factors(is_active);

CREATE INDEX idx_leadership_assessments_profile_id ON public.leadership_assessments(profile_id);
CREATE INDEX idx_leadership_assessments_assessor_id ON public.leadership_assessments(assessor_id);
CREATE INDEX idx_leadership_assessments_church_id ON public.leadership_assessments(church_id);
CREATE INDEX idx_leadership_assessments_assessment_date ON public.leadership_assessments(assessment_date);
CREATE INDEX idx_leadership_assessments_is_validated ON public.leadership_assessments(is_validated);

-- 4. TRIGGERS FOR UPDATED_AT
-- Add triggers for automatic updated_at timestamp updates
CREATE TRIGGER on_leadership_pipeline_update 
  BEFORE UPDATE ON public.leadership_pipeline 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_leadership_factors_update 
  BEFORE UPDATE ON public.leadership_factors 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_leadership_assessments_update 
  BEFORE UPDATE ON public.leadership_assessments 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS for all new tables
ALTER TABLE public.leadership_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_assessments ENABLE ROW LEVEL SECURITY;

-- Policies for leadership_pipeline
-- Users can view pipeline data from their church
CREATE POLICY "Users can view leadership pipeline from their church" ON public.leadership_pipeline
  FOR SELECT 
  USING (church_id = public.get_my_church_id());

-- Leaders and above can view all pipeline data in their church
CREATE POLICY "Leaders can manage leadership pipeline in their church" ON public.leadership_pipeline
  FOR ALL
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
  )
  WITH CHECK (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
  );

-- Users can view their own pipeline data
CREATE POLICY "Users can view their own leadership pipeline" ON public.leadership_pipeline
  FOR SELECT
  USING (profile_id = auth.uid());

-- Policies for leadership_factors
-- Everyone can view factors (they are global configuration)
CREATE POLICY "Users can view leadership factors" ON public.leadership_factors
  FOR SELECT 
  USING (true);

-- Only pastors can manage factors
CREATE POLICY "Pastors can manage leadership factors" ON public.leadership_factors
  FOR ALL
  USING (public.get_my_role() = 'pastor'::public.user_role)
  WITH CHECK (public.get_my_role() = 'pastor'::public.user_role);

-- Policies for leadership_assessments
-- Users can view assessments from their church
CREATE POLICY "Users can view assessments from their church" ON public.leadership_assessments
  FOR SELECT 
  USING (church_id = public.get_my_church_id());

-- Leaders can create assessments for members in their cells
CREATE POLICY "Leaders can create assessments for their cell members" ON public.leadership_assessments
  FOR INSERT
  WITH CHECK (
    church_id = public.get_my_church_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.cell_members cm
        JOIN public.cells c ON cm.cell_id = c.id
        WHERE cm.profile_id = leadership_assessments.profile_id
        AND c.leader_id = auth.uid()
      )
      OR public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
    )
  );

-- Assessors can update their own assessments
CREATE POLICY "Assessors can update their own assessments" ON public.leadership_assessments
  FOR UPDATE
  USING (assessor_id = auth.uid())
  WITH CHECK (assessor_id = auth.uid());

-- Users can view their own assessments
CREATE POLICY "Users can view their own assessments" ON public.leadership_assessments
  FOR SELECT
  USING (profile_id = auth.uid());

-- 6. POPULATE DEFAULT LEADERSHIP FACTORS
-- Insert the default leadership factors with their weights and calculation methods
INSERT INTO public.leadership_factors (name, category, weight, calculation_method, description) VALUES
-- Frequência e Consistência (peso total: ~25%)
('Consistência de Presença', 'attendance', 0.15, 'attendance_consistency_3m', 'Presença regular nas últimas 12 semanas'),
('Pontualidade', 'attendance', 0.10, 'punctuality_score', 'Chega no horário para reuniões'),

-- Crescimento na Escada do Sucesso (peso: ~25%)
('Progresso na Escada', 'growth', 0.20, 'ladder_progress_rate', 'Velocidade de crescimento na pontuação'),
('Nível Atual', 'growth', 0.05, 'current_ladder_level', 'Nível atual na Escada do Sucesso'),

-- Engajamento e Participação (peso: ~20%)
('Participação Ativa', 'engagement', 0.10, 'participation_score', 'Participação em discussões e atividades'),
('Iniciativa Própria', 'engagement', 0.10, 'initiative_count', 'Toma iniciativa em situações'),

-- Capacidade de Influência (peso: ~15%)
('Influência Positiva', 'influence', 0.08, 'positive_influence_score', 'Influencia outros positivamente'),
('Capacidade de Comunicação', 'influence', 0.07, 'communication_rating', 'Qualidade da comunicação'),

-- Serviço e Ministério (peso: ~15%)
('Histórico de Serviços', 'service', 0.08, 'service_history_score', 'Participação em serviços voluntários'),
('Responsabilidade', 'service', 0.07, 'responsibility_score', 'Cumprimento de responsabilidades'),

-- Características de Liderança
('Feedback de Líderes', 'leadership_traits', 0.15, 'leader_feedback_avg', 'Avaliação de supervisores'),
('Mentorias Realizadas', 'leadership_traits', 0.05, 'mentoring_count', 'Número de pessoas que mentora');

-- 7. HELPER FUNCTIONS FOR SCORE CALCULATION

-- Function to calculate attendance consistency
CREATE OR REPLACE FUNCTION public.calculate_attendance_consistency(member_id UUID, days_back INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total_meetings INTEGER;
  attended_meetings INTEGER;
  consistency_score NUMERIC;
BEGIN
  -- Count expected meetings and attended meetings in the last X days
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN mal.id IS NOT NULL THEN 1 END) as attended
  INTO total_meetings, attended_meetings
  FROM generate_series(
    CURRENT_DATE - days_back,
    CURRENT_DATE,
    '1 week'::interval
  ) AS expected_date
  LEFT JOIN public.member_activity_log mal ON 
    mal.profile_id = member_id AND
    mal.activity_date::date = expected_date::date AND
    EXISTS (
      SELECT 1 FROM public.success_ladder_activities sla 
      WHERE sla.id = mal.activity_id AND sla.category = 'attendance'
    );
  
  IF total_meetings > 0 THEN
    consistency_score := (attended_meetings::NUMERIC / total_meetings::NUMERIC) * 100;
  ELSE
    consistency_score := 0;
  END IF;
  
  RETURN LEAST(consistency_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate ladder progress rate
CREATE OR REPLACE FUNCTION public.calculate_ladder_progress_rate(member_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  score_30_days_ago INTEGER := 0;
  current_score INTEGER := 0;
  progress_rate NUMERIC;
BEGIN
  -- Get current score
  SELECT COALESCE(success_ladder_score, 0) INTO current_score 
  FROM public.cell_members 
  WHERE profile_id = member_id
  LIMIT 1;
  
  -- Calculate score from 30 days ago (approximate via activity logs)
  SELECT COALESCE(
    current_score - COALESCE(SUM(points_earned), 0), 0
  ) INTO score_30_days_ago
  FROM public.member_activity_log 
  WHERE profile_id = member_id 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate growth rate normalized to 0-100
  progress_rate := GREATEST(0, current_score - score_30_days_ago) * 2; -- *2 to normalize
  
  RETURN LEAST(progress_rate, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate participation score
CREATE OR REPLACE FUNCTION public.calculate_participation_score(member_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  activity_count INTEGER;
  participation_score NUMERIC;
BEGIN
  -- Count activities in the last 60 days
  SELECT COUNT(*) INTO activity_count
  FROM public.member_activity_log
  WHERE profile_id = member_id
    AND created_at >= CURRENT_DATE - INTERVAL '60 days';
  
  -- Normalize (assuming ~2 activities/week as 100%)
  participation_score := LEAST((activity_count::NUMERIC / 17.0) * 100, 100);
  
  RETURN participation_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate leader feedback average
CREATE OR REPLACE FUNCTION public.calculate_leader_feedback_average(member_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  -- Calculate average of recent assessments
  SELECT AVG((scores->>'leadership')::NUMERIC * 10) INTO avg_rating
  FROM public.leadership_assessments
  WHERE profile_id = member_id
    AND assessment_date >= CURRENT_DATE - INTERVAL '6 months'
    AND is_validated = true;
  
  RETURN COALESCE(avg_rating, 50);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate service score
CREATE OR REPLACE FUNCTION public.calculate_service_score(member_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  service_count INTEGER;
  service_score NUMERIC;
BEGIN
  -- Count service activities in the last 90 days
  SELECT COUNT(*) INTO service_count
  FROM public.member_activity_log mal
  JOIN public.success_ladder_activities sla ON mal.activity_id = sla.id
  WHERE mal.profile_id = member_id
    AND sla.category = 'service'
    AND mal.created_at >= CURRENT_DATE - INTERVAL '90 days';
  
  -- Normalize (assuming 1 service per month as 100%)
  service_score := LEAST((service_count::NUMERIC / 3.0) * 100, 100);
  
  RETURN service_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate leadership recommendations
CREATE OR REPLACE FUNCTION public.generate_leadership_recommendations(
  score NUMERIC, 
  factors JSONB
) RETURNS TEXT[] AS $$
DECLARE
  recommendations TEXT[] := '{}';
  attendance_score NUMERIC;
  participation_score NUMERIC;
  ladder_score NUMERIC;
  feedback_score NUMERIC;
BEGIN
  -- Extract specific scores
  attendance_score := COALESCE((factors->'Consistência de Presença'->>'score')::NUMERIC, 0);
  participation_score := COALESCE((factors->'Participação Ativa'->>'score')::NUMERIC, 0);
  ladder_score := COALESCE((factors->'Progresso na Escada'->>'score')::NUMERIC, 0);
  feedback_score := COALESCE((factors->'Feedback de Líderes'->>'score')::NUMERIC, 0);
  
  -- Generate recommendations based on weak points
  IF attendance_score < 70 THEN
    recommendations := array_append(recommendations, 'Melhorar consistência de presença em células');
  END IF;
  
  IF participation_score < 60 THEN
    recommendations := array_append(recommendations, 'Aumentar participação ativa em discussões');
  END IF;
  
  IF ladder_score < 50 THEN
    recommendations := array_append(recommendations, 'Focar no crescimento na Escada do Sucesso');
  END IF;
  
  IF feedback_score < 60 THEN
    recommendations := array_append(recommendations, 'Buscar mais feedback de líderes e supervisores');
  END IF;
  
  -- Recommendations for different levels
  IF score >= 70 THEN
    recommendations := array_append(recommendations, 'Pronto para mentorear outros membros');
    recommendations := array_append(recommendations, 'Considerar treinamento de liderança');
  ELSIF score >= 50 THEN
    recommendations := array_append(recommendations, 'Desenvolver habilidades de comunicação');
    recommendations := array_append(recommendations, 'Participar mais de serviços voluntários');
  ELSE
    recommendations := array_append(recommendations, 'Focar no crescimento pessoal primeiro');
    recommendations := array_append(recommendations, 'Buscar mentoria de um líder experiente');
  END IF;
  
  RETURN recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. MAIN LEADERSHIP SCORE CALCULATION FUNCTION
CREATE OR REPLACE FUNCTION public.calculate_leadership_score(member_id UUID)
RETURNS TABLE (
  leadership_score NUMERIC,
  confidence_score NUMERIC,
  factors JSONB,
  potential_level public.leadership_level,
  recommendations TEXT[]
) AS $$
DECLARE
  factor_record RECORD;
  total_score NUMERIC := 0;
  factor_count INTEGER := 0;
  factor_data JSONB := '{}';
  member_info RECORD;
  rec_array TEXT[] := '{}';
  calculated_confidence NUMERIC;
  calculated_level public.leadership_level;
BEGIN
  -- Get member information
  SELECT p.*, cm.role, cm.success_ladder_score 
  INTO member_info
  FROM public.profiles p
  LEFT JOIN public.cell_members cm ON p.id = cm.profile_id
  WHERE p.id = member_id;

  -- Calculate each factor
  FOR factor_record IN SELECT * FROM public.leadership_factors WHERE is_active = true LOOP
    DECLARE
      factor_score NUMERIC := 0;
    BEGIN
      -- Calculate score based on method
      CASE factor_record.calculation_method
        WHEN 'attendance_consistency_3m' THEN
          SELECT public.calculate_attendance_consistency(member_id, 90) INTO factor_score;
          
        WHEN 'punctuality_score' THEN
          -- Placeholder: could be implemented with check-in times
          factor_score := 75; -- Default score
          
        WHEN 'ladder_progress_rate' THEN
          SELECT public.calculate_ladder_progress_rate(member_id) INTO factor_score;
          
        WHEN 'current_ladder_level' THEN
          -- Normalize current level (0-100)
          factor_score := LEAST(COALESCE(member_info.success_ladder_score, 0) / 20.0, 100);
          
        WHEN 'participation_score' THEN
          SELECT public.calculate_participation_score(member_id) INTO factor_score;
          
        WHEN 'initiative_count' THEN
          -- Placeholder: could track initiatives taken
          factor_score := 60; -- Default score
          
        WHEN 'positive_influence_score' THEN
          -- Placeholder: could be based on peer assessments
          factor_score := 65; -- Default score
          
        WHEN 'communication_rating' THEN
          -- Average communication scores from assessments
          SELECT AVG((scores->>'communication')::NUMERIC * 10) INTO factor_score
          FROM public.leadership_assessments
          WHERE profile_id = member_id AND is_validated = true;
          factor_score := COALESCE(factor_score, 50);
          
        WHEN 'service_history_score' THEN
          SELECT public.calculate_service_score(member_id) INTO factor_score;
          
        WHEN 'responsibility_score' THEN
          -- Placeholder: could track responsibility fulfillment
          factor_score := 70; -- Default score
          
        WHEN 'leader_feedback_avg' THEN
          SELECT public.calculate_leader_feedback_average(member_id) INTO factor_score;
          
        WHEN 'mentoring_count' THEN
          -- Count people being mentored (cells led or direct mentees)
          SELECT COUNT(*) * 10 INTO factor_score
          FROM public.cells
          WHERE leader_id = member_id;
          factor_score := LEAST(factor_score, 100);
          
        ELSE
          factor_score := 50; -- Default score for unimplemented methods
      END CASE;
      
      -- Apply factor weight
      total_score := total_score + (factor_score * factor_record.weight);
      factor_count := factor_count + 1;
      
      -- Store factor in JSON
      factor_data := factor_data || jsonb_build_object(
        factor_record.name, 
        jsonb_build_object(
          'score', factor_score,
          'weight', factor_record.weight,
          'weighted_score', factor_score * factor_record.weight,
          'category', factor_record.category
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with score 0 for this factor
      factor_score := 0;
      factor_data := factor_data || jsonb_build_object(
        factor_record.name, 
        jsonb_build_object(
          'score', 0,
          'weight', factor_record.weight,
          'weighted_score', 0,
          'category', factor_record.category,
          'error', 'calculation_failed'
        )
      );
    END;
  END LOOP;

  -- Calculate final score (already weighted, normalize to 0-100)
  total_score := LEAST(total_score * 100, 100);
  
  -- Determine potential level
  calculated_level := CASE
    WHEN total_score >= 85 THEN 'supervisor_potential'::public.leadership_level
    WHEN total_score >= 70 THEN 'leader_ready'::public.leadership_level
    WHEN total_score >= 55 THEN 'leader_potential'::public.leadership_level
    WHEN total_score >= 40 THEN 'timoteo'::public.leadership_level
    ELSE 'member'::public.leadership_level
  END;
  
  -- Calculate confidence score (based on data availability and factor count)
  calculated_confidence := LEAST((factor_count * 8.0), 100);
  
  -- Generate recommendations
  rec_array := public.generate_leadership_recommendations(total_score, factor_data);
  
  RETURN QUERY SELECT total_score, calculated_confidence, factor_data, calculated_level, rec_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. TRIGGER FOR AUTOMATIC RECALCULATION
CREATE OR REPLACE FUNCTION public.trigger_recalculate_leadership()
RETURNS TRIGGER AS $$
DECLARE
  result_data RECORD;
BEGIN
  -- Recalculate leadership score
  SELECT * INTO result_data FROM public.calculate_leadership_score(NEW.profile_id);
  
  -- Insert or update in pipeline
  INSERT INTO public.leadership_pipeline (
    profile_id, church_id, leadership_score, confidence_score, 
    factors, potential_level, recommendations, last_calculated_at
  )
  SELECT 
    NEW.profile_id, p.church_id, result_data.leadership_score,
    result_data.confidence_score, result_data.factors,
    result_data.potential_level, result_data.recommendations, NOW()
  FROM public.profiles p WHERE p.id = NEW.profile_id
  ON CONFLICT (profile_id) DO UPDATE SET
    leadership_score = EXCLUDED.leadership_score,
    confidence_score = EXCLUDED.confidence_score,
    factors = EXCLUDED.factors,
    potential_level = EXCLUDED.potential_level,
    recommendations = EXCLUDED.recommendations,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic recalculation
CREATE TRIGGER trigger_leadership_recalc
  AFTER INSERT OR UPDATE ON public.member_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_leadership();

-- Trigger when assessments are updated
CREATE TRIGGER trigger_leadership_recalc_assessment
  AFTER INSERT OR UPDATE ON public.leadership_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_leadership();

-- 10. UTILITY FUNCTIONS

-- Function to manually recalculate all leadership scores for a church
CREATE OR REPLACE FUNCTION public.recalculate_church_leadership_scores(church_id UUID)
RETURNS INTEGER AS $$
DECLARE
  member_record RECORD;
  result_data RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all members in the church
  FOR member_record IN 
    SELECT DISTINCT p.id as profile_id
    FROM public.profiles p
    WHERE p.church_id = recalculate_church_leadership_scores.church_id
  LOOP
    -- Calculate leadership score
    SELECT * INTO result_data FROM public.calculate_leadership_score(member_record.profile_id);
    
    -- Update or insert pipeline record
    INSERT INTO public.leadership_pipeline (
      profile_id, church_id, leadership_score, confidence_score, 
      factors, potential_level, recommendations, last_calculated_at
    )
    VALUES (
      member_record.profile_id, recalculate_church_leadership_scores.church_id, 
      result_data.leadership_score, result_data.confidence_score, result_data.factors,
      result_data.potential_level, result_data.recommendations, NOW()
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      leadership_score = EXCLUDED.leadership_score,
      confidence_score = EXCLUDED.confidence_score,
      factors = EXCLUDED.factors,
      potential_level = EXCLUDED.potential_level,
      recommendations = EXCLUDED.recommendations,
      last_calculated_at = EXCLUDED.last_calculated_at,
      updated_at = NOW();
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leadership pipeline for a church
CREATE OR REPLACE FUNCTION public.get_church_leadership_pipeline(church_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  leadership_score NUMERIC,
  potential_level public.leadership_level,
  confidence_score NUMERIC,
  member_role TEXT,
  cell_name TEXT,
  last_calculated_at TIMESTAMPTZ,
  recommendations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.profile_id,
    p.full_name,
    lp.leadership_score,
    lp.potential_level,
    lp.confidence_score,
    p.role as member_role,
    c.name as cell_name,
    lp.last_calculated_at,
    lp.recommendations
  FROM public.leadership_pipeline lp
  JOIN public.profiles p ON lp.profile_id = p.id
  LEFT JOIN public.cell_members cm ON p.id = cm.profile_id
  LEFT JOIN public.cells c ON cm.cell_id = c.id
  WHERE lp.church_id = get_church_leadership_pipeline.church_id
    AND lp.is_active = true
  ORDER BY lp.leadership_score DESC, lp.confidence_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed member leadership profile
CREATE OR REPLACE FUNCTION public.get_member_leadership_profile(member_id UUID)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  leadership_score NUMERIC,
  potential_level public.leadership_level,
  confidence_score NUMERIC,
  factors JSONB,
  recommendations TEXT[],
  assessment_count INTEGER,
  last_calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.profile_id,
    p.full_name,
    lp.leadership_score,
    lp.potential_level,
    lp.confidence_score,
    lp.factors,
    lp.recommendations,
    (SELECT COUNT(*)::INTEGER FROM public.leadership_assessments la WHERE la.profile_id = member_id AND la.is_validated = true),
    lp.last_calculated_at
  FROM public.leadership_pipeline lp
  JOIN public.profiles p ON lp.profile_id = p.id
  WHERE lp.profile_id = member_id
    AND lp.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;