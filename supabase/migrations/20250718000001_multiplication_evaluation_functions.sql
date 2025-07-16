-- Supabase Migration: Funções de Avaliação de Multiplicação
-- Plataforma de Gestão G12 - Sistema de Avaliação e Alertas
-- Version: 1.0
-- Date: 18 de Julho de 2025
-- This script adds the main evaluation functions and alert system

-- 1. MAIN EVALUATION FUNCTION
-- Function to evaluate multiplication criteria for a cell
CREATE OR REPLACE FUNCTION public.evaluate_multiplication_criteria(p_cell_id UUID)
RETURNS TABLE (
  readiness_score NUMERIC,
  status public.multiplication_status,
  criteria_results JSONB,
  projected_date DATE,
  confidence_level NUMERIC,
  recommendations TEXT[],
  blocking_factors TEXT[]
) AS $$
DECLARE
  criteria_record RECORD;
  cell_info RECORD;
  total_score NUMERIC := 0;
  max_possible_score NUMERIC := 0;
  criteria_json JSONB := '{}';
  recommendations_array TEXT[] := '{}';
  blocking_array TEXT[] := '{}';
  current_status public.multiplication_status;
  confidence NUMERIC := 0;
  projected DATE;
BEGIN
  -- Get cell information
  SELECT 
    c.*,
    COALESCE(cm_leader.success_ladder_score, 0) as leader_score,
    p.full_name as leader_name,
    EXTRACT(months FROM age(NOW(), c.created_at)) as cell_age_months
  INTO cell_info
  FROM public.cells c
  LEFT JOIN public.cell_members cm_leader ON c.leader_id = cm_leader.profile_id AND cm_leader.cell_id = c.id
  LEFT JOIN public.profiles p ON c.leader_id = p.id
  WHERE c.id = p_cell_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Célula não encontrada: %', p_cell_id;
  END IF;

  -- Evaluate each criterion
  FOR criteria_record IN 
    SELECT * FROM public.multiplication_criteria 
    WHERE church_id = cell_info.church_id AND is_active = true
    ORDER BY criteria_type
  LOOP
    DECLARE
      criteria_score NUMERIC := 0;
      criteria_met BOOLEAN := false;
      actual_value NUMERIC := 0;
    BEGIN
      -- Calculate actual value based on criteria type
      CASE criteria_record.criteria_type
        WHEN 'member_count' THEN
          SELECT COUNT(*) INTO actual_value
          FROM public.cell_members 
          WHERE cell_id = p_cell_id;
          
        WHEN 'meeting_frequency' THEN
          -- Calculate % of meetings held in last 3 months
          SELECT public.calculate_meeting_frequency(p_cell_id, 90) INTO actual_value;
          
        WHEN 'average_attendance' THEN
          -- Calculate average attendance % in last 2 months
          SELECT public.calculate_average_attendance(p_cell_id, 60) INTO actual_value;
          
        WHEN 'potential_leaders' THEN
          -- Count potential leaders in the cell
          SELECT public.get_potential_leaders_count(p_cell_id) INTO actual_value;
            
        WHEN 'cell_age_months' THEN
          actual_value := cell_info.cell_age_months;
          
        WHEN 'leader_maturity' THEN
          actual_value := COALESCE(cell_info.leader_score, 0);
          
        WHEN 'growth_rate' THEN
          -- Calculate growth rate based on member addition in last 6 months
          SELECT 
            CASE 
              WHEN COUNT(*) > 0 THEN
                (COUNT(CASE WHEN joined_at >= CURRENT_DATE - INTERVAL '6 months' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
              ELSE 0
            END INTO actual_value
          FROM public.cell_members
          WHERE cell_id = p_cell_id;
          
        WHEN 'stability_score' THEN
          -- Basic stability score (could be enhanced)
          actual_value := 75; -- Default stability score
          
        ELSE
          actual_value := 0;
      END CASE;
      
      -- Check if criterion is met
      criteria_met := actual_value >= criteria_record.threshold_value;
      
      -- Calculate score (0-100 based on how well it meets the criterion)
      IF criteria_met THEN
        criteria_score := 100;
      ELSE
        -- Proportional score (minimum 0, maximum 100)
        criteria_score := LEAST(100, (actual_value / criteria_record.threshold_value) * 100);
      END IF;
      
      -- Apply criterion weight
      total_score := total_score + (criteria_score * criteria_record.weight);
      max_possible_score := max_possible_score + (100 * criteria_record.weight);
      
      -- Add to JSON results
      criteria_json := criteria_json || jsonb_build_object(
        criteria_record.criteria_type::text,
        jsonb_build_object(
          'name', criteria_record.name,
          'threshold', criteria_record.threshold_value,
          'actual', actual_value,
          'score', criteria_score,
          'weight', criteria_record.weight,
          'met', criteria_met,
          'required', criteria_record.is_required
        )
      );
      
      -- Add recommendations or blocking factors
      IF NOT criteria_met THEN
        IF criteria_record.is_required THEN
          blocking_array := array_append(blocking_array, 
            criteria_record.name || ': ' || actual_value || ' (mín: ' || criteria_record.threshold_value || ')'
          );
        ELSE
          recommendations_array := array_append(recommendations_array,
            'Melhorar ' || criteria_record.name || ' para otimizar multiplicação'
          );
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with score 0
      criteria_score := 0;
      criteria_json := criteria_json || jsonb_build_object(
        criteria_record.criteria_type::text,
        jsonb_build_object(
          'name', criteria_record.name,
          'threshold', criteria_record.threshold_value,
          'actual', 0,
          'score', 0,
          'weight', criteria_record.weight,
          'met', false,
          'required', criteria_record.is_required,
          'error', 'calculation_failed'
        )
      );
    END;
  END LOOP;

  -- Calculate final normalized score (0-100)
  IF max_possible_score > 0 THEN
    total_score := (total_score / max_possible_score) * 100;
  END IF;
  
  -- Determine status based on score
  current_status := CASE
    WHEN total_score >= 90 THEN 'optimal'::public.multiplication_status
    WHEN total_score >= 75 THEN 'ready'::public.multiplication_status
    WHEN total_score >= 60 THEN 'preparing'::public.multiplication_status
    ELSE 'not_ready'::public.multiplication_status
  END;
  
  -- Calculate confidence level (based on criteria met percentage)
  SELECT 
    (COUNT(CASE WHEN (value->>'met')::boolean THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
  INTO confidence
  FROM jsonb_each(criteria_json);
  
  -- Project multiplication date
  IF current_status IN ('ready', 'optimal') THEN
    projected := CURRENT_DATE + INTERVAL '2 weeks';
  ELSIF current_status = 'preparing' THEN
    projected := CURRENT_DATE + INTERVAL '6 weeks';
  ELSE
    projected := CURRENT_DATE + INTERVAL '3 months';
  END IF;
  
  -- Add general recommendations
  IF current_status = 'ready' OR current_status = 'optimal' THEN
    recommendations_array := array_append(recommendations_array, 'Célula pronta para multiplicação!');
    recommendations_array := array_append(recommendations_array, 'Iniciar processo de seleção de membros');
    recommendations_array := array_append(recommendations_array, 'Identificar e treinar novo líder');
  ELSIF current_status = 'preparing' THEN
    recommendations_array := array_append(recommendations_array, 'Acelerar desenvolvimento de líderes');
    recommendations_array := array_append(recommendations_array, 'Focar em evangelismo para aumentar membros');
  ELSE
    recommendations_array := array_append(recommendations_array, 'Fortalecer base da célula');
    recommendations_array := array_append(recommendations_array, 'Implementar treinamento de liderança');
  END IF;
  
  RETURN QUERY SELECT 
    total_score,
    current_status,
    criteria_json,
    projected,
    confidence,
    recommendations_array,
    blocking_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BULK EVALUATION FUNCTIONS

-- Function to update multiplication readiness for all cells in a church
CREATE OR REPLACE FUNCTION public.update_all_cells_readiness(p_church_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cell_record RECORD;
  evaluation_result RECORD;
  cells_updated INTEGER := 0;
BEGIN
  FOR cell_record IN 
    SELECT id FROM public.cells WHERE church_id = p_church_id
  LOOP
    -- Evaluate cell
    SELECT * INTO evaluation_result 
    FROM public.evaluate_multiplication_criteria(cell_record.id);
    
    -- Insert or update result
    INSERT INTO public.multiplication_readiness (
      cell_id, readiness_score, status, criteria_results,
      projected_date, confidence_level, recommendations, blocking_factors
    ) VALUES (
      cell_record.id,
      evaluation_result.readiness_score,
      evaluation_result.status,
      evaluation_result.criteria_results,
      evaluation_result.projected_date,
      evaluation_result.confidence_level,
      evaluation_result.recommendations,
      evaluation_result.blocking_factors
    )
    ON CONFLICT (cell_id) DO UPDATE SET
      readiness_score = EXCLUDED.readiness_score,
      status = EXCLUDED.status,
      criteria_results = EXCLUDED.criteria_results,
      projected_date = EXCLUDED.projected_date,
      confidence_level = EXCLUDED.confidence_level,
      recommendations = EXCLUDED.recommendations,
      blocking_factors = EXCLUDED.blocking_factors,
      last_evaluated_at = NOW(),
      updated_at = NOW();
    
    cells_updated := cells_updated + 1;
  END LOOP;
  
  RETURN cells_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ALERT SYSTEM FUNCTIONS

-- Function to generate multiplication alerts
CREATE OR REPLACE FUNCTION public.generate_multiplication_alerts()
RETURNS TABLE (
  cell_id UUID,
  cell_name VARCHAR,
  alert_type public.alert_type,
  message TEXT,
  priority INTEGER,
  supervisor_id UUID,
  pastor_id UUID
) AS $$
BEGIN
  RETURN QUERY
  -- Cells ready for multiplication
  SELECT 
    c.id,
    c.name,
    'ready_for_multiplication'::public.alert_type,
    'Célula ' || c.name || ' está pronta para multiplicação (Score: ' || ROUND(mr.readiness_score, 1) || '%)',
    1, -- High priority
    c.supervisor_id,
    (SELECT p.id FROM public.profiles p WHERE p.church_id = c.church_id AND p.role = 'pastor' LIMIT 1)
  FROM public.cells c
  JOIN public.multiplication_readiness mr ON c.id = mr.cell_id
  WHERE mr.status IN ('ready', 'optimal')
    AND mr.last_evaluated_at >= CURRENT_DATE - INTERVAL '1 day'
  
  UNION ALL
  
  -- Cells with slow growth
  SELECT 
    c.id,
    c.name,
    'slow_growth'::public.alert_type,
    'Célula ' || c.name || ' pode precisar de atenção (Score: ' || ROUND(mr.readiness_score, 1) || '%)',
    2, -- Medium priority
    c.supervisor_id,
    (SELECT p.id FROM public.profiles p WHERE p.church_id = c.church_id AND p.role = 'pastor' LIMIT 1)
  FROM public.cells c
  JOIN public.multiplication_readiness mr ON c.id = mr.cell_id
  WHERE mr.status = 'not_ready'
    AND EXTRACT(months FROM age(NOW(), c.created_at)) >= 12
    AND mr.last_evaluated_at >= CURRENT_DATE - INTERVAL '1 day'
    
  UNION ALL
  
  -- Cells with low attendance
  SELECT 
    c.id,
    c.name,
    'low_attendance'::public.alert_type,
    'Célula ' || c.name || ' tem baixa frequência nas reuniões',
    2, -- Medium priority
    c.supervisor_id,
    (SELECT p.id FROM public.profiles p WHERE p.church_id = c.church_id AND p.role = 'pastor' LIMIT 1)
  FROM public.cells c
  JOIN public.multiplication_readiness mr ON c.id = mr.cell_id
  WHERE (mr.criteria_results->'meeting_frequency'->>'score')::NUMERIC < 60
    AND mr.last_evaluated_at >= CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. QUERY FUNCTIONS FOR API

-- Function to get multiplication dashboard data for a church
CREATE OR REPLACE FUNCTION public.get_multiplication_dashboard(p_church_id UUID)
RETURNS TABLE (
  total_cells INTEGER,
  ready_cells INTEGER,
  preparing_cells INTEGER,
  not_ready_cells INTEGER,
  average_readiness_score NUMERIC,
  cells_details JSONB
) AS $$
DECLARE
  dashboard_data JSONB;
BEGIN
  -- Build detailed cells data
  SELECT jsonb_agg(
    jsonb_build_object(
      'cell_id', c.id,
      'cell_name', c.name,
      'leader_name', p.full_name,
      'readiness_score', COALESCE(mr.readiness_score, 0),
      'status', COALESCE(mr.status, 'not_ready'),
      'projected_date', mr.projected_date,
      'member_count', (
        SELECT COUNT(*) FROM public.cell_members cm WHERE cm.cell_id = c.id
      ),
      'last_evaluated', mr.last_evaluated_at
    )
  ) INTO dashboard_data
  FROM public.cells c
  LEFT JOIN public.profiles p ON c.leader_id = p.id
  LEFT JOIN public.multiplication_readiness mr ON c.id = mr.cell_id
  WHERE c.church_id = p_church_id;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.cells WHERE church_id = p_church_id) as total_cells,
    (SELECT COUNT(*)::INTEGER FROM public.cells c 
     JOIN public.multiplication_readiness mr ON c.id = mr.cell_id 
     WHERE c.church_id = p_church_id AND mr.status IN ('ready', 'optimal')) as ready_cells,
    (SELECT COUNT(*)::INTEGER FROM public.cells c 
     JOIN public.multiplication_readiness mr ON c.id = mr.cell_id 
     WHERE c.church_id = p_church_id AND mr.status = 'preparing') as preparing_cells,
    (SELECT COUNT(*)::INTEGER FROM public.cells c 
     LEFT JOIN public.multiplication_readiness mr ON c.id = mr.cell_id 
     WHERE c.church_id = p_church_id AND (mr.status IS NULL OR mr.status = 'not_ready')) as not_ready_cells,
    (SELECT COALESCE(AVG(mr.readiness_score), 0) FROM public.cells c 
     JOIN public.multiplication_readiness mr ON c.id = mr.cell_id 
     WHERE c.church_id = p_church_id) as average_readiness_score,
    dashboard_data as cells_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed cell readiness
CREATE OR REPLACE FUNCTION public.get_cell_multiplication_details(p_cell_id UUID)
RETURNS TABLE (
  cell_id UUID,
  cell_name VARCHAR,
  leader_name TEXT,
  readiness_score NUMERIC,
  status public.multiplication_status,
  criteria_results JSONB,
  recommendations TEXT[],
  blocking_factors TEXT[],
  projected_date DATE,
  confidence_level NUMERIC,
  member_count INTEGER,
  potential_leaders INTEGER,
  recent_meetings INTEGER,
  last_evaluated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    p.full_name,
    COALESCE(mr.readiness_score, 0),
    COALESCE(mr.status, 'not_ready'::public.multiplication_status),
    COALESCE(mr.criteria_results, '{}'::JSONB),
    COALESCE(mr.recommendations, ARRAY[]::TEXT[]),
    COALESCE(mr.blocking_factors, ARRAY[]::TEXT[]),
    mr.projected_date,
    COALESCE(mr.confidence_level, 0),
    (SELECT COUNT(*)::INTEGER FROM public.cell_members cm WHERE cm.cell_id = c.id),
    public.get_potential_leaders_count(c.id),
    (SELECT COUNT(*)::INTEGER FROM public.cell_meetings cm WHERE cm.cell_id = c.id AND cm.meeting_date >= CURRENT_DATE - INTERVAL '30 days'),
    mr.last_evaluated_at
  FROM public.cells c
  LEFT JOIN public.profiles p ON c.leader_id = p.id
  LEFT JOIN public.multiplication_readiness mr ON c.id = mr.cell_id
  WHERE c.id = p_cell_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGERS FOR AUTOMATIC EVALUATION

-- Function to trigger multiplication evaluation
CREATE OR REPLACE FUNCTION public.trigger_multiplication_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  target_cell_id UUID;
BEGIN
  -- Determine which cell to evaluate based on the triggering table
  IF TG_TABLE_NAME = 'cell_members' THEN
    target_cell_id := COALESCE(NEW.cell_id, OLD.cell_id);
  ELSIF TG_TABLE_NAME = 'cell_meetings' THEN
    target_cell_id := NEW.cell_id;
  ELSIF TG_TABLE_NAME = 'leadership_pipeline' THEN
    -- Find cells where this person is a member
    FOR target_cell_id IN 
      SELECT cm.cell_id FROM public.cell_members cm WHERE cm.profile_id = NEW.profile_id
    LOOP
      -- Evaluate each cell this person belongs to
      PERFORM public.evaluate_multiplication_criteria(target_cell_id);
    END LOOP;
    RETURN NEW;
  END IF;
  
  -- Evaluate the specific cell
  IF target_cell_id IS NOT NULL THEN
    PERFORM public.evaluate_multiplication_criteria(target_cell_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic evaluation
CREATE TRIGGER trigger_evaluate_on_member_change
  AFTER INSERT OR DELETE OR UPDATE ON public.cell_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_multiplication_evaluation();

CREATE TRIGGER trigger_evaluate_on_meeting
  AFTER INSERT OR UPDATE ON public.cell_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_multiplication_evaluation();

CREATE TRIGGER trigger_evaluate_on_leadership_change
  AFTER UPDATE ON public.leadership_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_multiplication_evaluation();