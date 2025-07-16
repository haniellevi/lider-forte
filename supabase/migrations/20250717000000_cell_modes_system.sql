-- Create ENUM types for cell modes and activity types
CREATE TYPE cell_mode AS ENUM (
  'GANHAR',      -- Vermelho - Foco em evangelismo
  'CONSOLIDAR',  -- Verde - Foco em cuidado pastoral
  'DISCIPULAR',  -- Azul - Foco em ensino/crescimento
  'ENVIAR'       -- Amarelo - Foco em multiplicação
);

CREATE TYPE activity_type AS ENUM (
  'meeting',
  'outreach',
  'training',
  'service',
  'fellowship',
  'mentoring'
);

-- Create mode_templates table
CREATE TABLE mode_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode cell_mode NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Cor hex
  icon VARCHAR(50),
  default_duration_weeks INTEGER DEFAULT 4,
  suggested_activities TEXT[],
  target_metrics_template JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cell_modes table
CREATE TABLE cell_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
  mode cell_mode NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = indefinido
  goal_description TEXT,
  target_metrics JSONB, -- Métricas específicas para o modo
  actual_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mode_activities table
CREATE TABLE mode_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_mode_id UUID REFERENCES cell_modes(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  planned_date DATE,
  completed_date DATE,
  participants_expected INTEGER,
  participants_actual INTEGER,
  results JSONB,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Popular templates dos 4 modos
INSERT INTO mode_templates (mode, name, description, color, icon, default_duration_weeks, suggested_activities, target_metrics_template, is_default) VALUES
(
  'GANHAR', 
  'Modo Ganhar - Evangelismo',
  'Foco em alcançar novos visitantes e conversões',
  '#DC2626', -- Vermelho
  '🎯',
  4,
  ARRAY[
    'Convidar amigos para célula',
    'Reunião evangelística',
    'Testemunhos pessoais',
    'Oração por não-convertidos',
    'Ação social comunitária'
  ],
  '{
    "new_visitors": {"target": 3, "description": "Novos visitantes"},
    "conversions": {"target": 1, "description": "Conversões esperadas"},
    "invitation_activities": {"target": 2, "description": "Atividades de convite"},
    "follow_up_visits": {"target": 5, "description": "Visitas de acompanhamento"}
  }'::jsonb,
  true
),
(
  'CONSOLIDAR',
  'Modo Consolidar - Cuidado Pastoral', 
  'Foco em cuidar e integrar novos membros',
  '#059669', -- Verde
  '🤲',
  3,
  ARRAY[
    'Visitas pastorais',
    'Acompanhamento de novos convertidos',
    'Oração pelos membros',
    'Ministração específica',
    'Integração à igreja'
  ],
  '{
    "pastoral_visits": {"target": 4, "description": "Visitas pastorais"},
    "new_member_integration": {"target": 2, "description": "Novos membros integrados"},
    "prayer_requests": {"target": 8, "description": "Pedidos de oração atendidos"},
    "member_retention": {"target": 95, "description": "Taxa de retenção (%)"}
  }'::jsonb,
  true
),
(
  'DISCIPULAR',
  'Modo Discipular - Ensino e Crescimento',
  'Foco no crescimento espiritual e educação',
  '#2563EB', -- Azul
  '📚',
  6,
  ARRAY[
    'Estudos bíblicos profundos',
    'Universidade da Vida',
    'Mentoria individual',
    'Desenvolvimento de Timóteos',
    'Leitura dirigida'
  ],
  '{
    "bible_studies": {"target": 6, "description": "Estudos bíblicos realizados"},
    "course_completions": {"target": 3, "description": "Cursos concluídos"},
    "mentoring_sessions": {"target": 8, "description": "Sessões de mentoria"},
    "spiritual_growth": {"target": 75, "description": "Crescimento espiritual médio (%)"}
  }'::jsonb,
  true
),
(
  'ENVIAR',
  'Modo Enviar - Multiplicação e Liderança',
  'Foco em treinar líderes e preparar multiplicação',
  '#D97706', -- Amarelo/Laranja
  '🚀',
  8,
  ARRAY[
    'Treinamento de Timóteos',
    'Capacitação de liderança',
    'Planejamento de multiplicação',
    'Escola de Líderes',
    'Mentoria intensiva'
  ],
  '{
    "leaders_trained": {"target": 2, "description": "Líderes treinados"},
    "timoteos_developed": {"target": 3, "description": "Timóteos desenvolvidos"},
    "multiplication_readiness": {"target": 80, "description": "Prontidão para multiplicação (%)"},
    "leadership_skills": {"target": 85, "description": "Nível de habilidades de liderança (%)"}
  }'::jsonb,
  true
);

-- Funções para gerenciamento de modos

-- Ativar modo para célula
CREATE OR REPLACE FUNCTION activate_cell_mode(
  p_cell_id UUID,
  p_mode cell_mode,
  p_duration_weeks INTEGER DEFAULT 4,
  p_goal_description TEXT DEFAULT NULL,
  p_custom_metrics JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_mode_id UUID;
  template_data RECORD;
  end_date DATE;
BEGIN
  -- Finalizar modo anterior se existir
  UPDATE cell_modes 
  SET is_active = false, end_date = CURRENT_DATE
  WHERE cell_id = p_cell_id AND is_active = true;
  
  -- Buscar template padrão
  SELECT * INTO template_data 
  FROM mode_templates 
  WHERE mode = p_mode AND is_default = true;
  
  -- Calcular data de fim
  end_date := CURRENT_DATE + (p_duration_weeks || ' weeks')::INTERVAL;
  
  -- Criar novo modo
  INSERT INTO cell_modes (
    cell_id, mode, start_date, end_date, goal_description,
    target_metrics, created_by
  ) VALUES (
    p_cell_id, 
    p_mode, 
    CURRENT_DATE,
    end_date,
    COALESCE(p_goal_description, template_data.description),
    COALESCE(p_custom_metrics, template_data.target_metrics_template),
    p_created_by
  ) RETURNING id INTO new_mode_id;
  
  -- Registrar evento
  INSERT INTO events (church_id, cell_id, profile_id, event_type, event_data)
  SELECT c.church_id, p_cell_id, p_created_by, 'cell_mode_activated',
         jsonb_build_object('mode', p_mode, 'duration_weeks', p_duration_weeks)
  FROM cells c WHERE c.id = p_cell_id;
  
  RETURN new_mode_id;
END;
$$ LANGUAGE plpgsql;

-- Obter modo atual da célula
CREATE OR REPLACE FUNCTION get_current_cell_mode(p_cell_id UUID)
RETURNS TABLE (
  mode_id UUID,
  mode cell_mode,
  start_date DATE,
  end_date DATE,
  days_remaining INTEGER,
  progress_percentage NUMERIC,
  target_metrics JSONB,
  actual_metrics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.mode,
    cm.start_date,
    cm.end_date,
    CASE 
      WHEN cm.end_date IS NULL THEN NULL
      ELSE (cm.end_date - CURRENT_DATE)::INTEGER
    END,
    CASE
      WHEN cm.end_date IS NULL THEN 0
      ELSE LEAST(100, 
        ((CURRENT_DATE - cm.start_date)::NUMERIC / 
         (cm.end_date - cm.start_date)::NUMERIC * 100)::NUMERIC(5,2)
      )
    END,
    cm.target_metrics,
    cm.actual_metrics
  FROM cell_modes cm
  WHERE cm.cell_id = p_cell_id 
    AND cm.is_active = true
  ORDER BY cm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Atualizar métricas do modo
CREATE OR REPLACE FUNCTION update_mode_metrics(
  p_mode_id UUID,
  p_metric_key TEXT,
  p_metric_value NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE cell_modes
  SET 
    actual_metrics = COALESCE(actual_metrics, '{}'::jsonb) || 
                    jsonb_build_object(p_metric_key, p_metric_value),
    updated_at = NOW()
  WHERE id = p_mode_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Primeiro, adicionar campo multiplication_date à tabela cells se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cells' AND column_name = 'multiplication_date') THEN
    ALTER TABLE cells ADD COLUMN multiplication_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cell_members' AND column_name = 'is_active') THEN
    ALTER TABLE cell_members ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Função para recomendar modo baseado no contexto da célula
CREATE OR REPLACE FUNCTION recommend_cell_mode(p_cell_id UUID)
RETURNS TABLE (
  recommended_mode cell_mode,
  reason TEXT,
  confidence_score NUMERIC
) AS $$
DECLARE
  cell_data RECORD;
  last_mode_data RECORD;
  months_since_multiplication INTEGER;
  avg_attendance_rate NUMERIC;
  new_member_rate NUMERIC;
BEGIN
  -- Obter dados da célula
  SELECT 
    c.*,
    COUNT(DISTINCT cm.id) as member_count,
    EXTRACT(MONTH FROM age(CURRENT_DATE, COALESCE(c.multiplication_date, c.created_at))) as months_since_mult
  INTO cell_data
  FROM cells c
  LEFT JOIN cell_members cm ON cm.cell_id = c.id AND COALESCE(cm.is_active, true) = true
  WHERE c.id = p_cell_id
  GROUP BY c.id;
  
  -- Obter último modo usado
  SELECT mode, end_date 
  INTO last_mode_data
  FROM cell_modes 
  WHERE cell_id = p_cell_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calcular métricas
  months_since_multiplication := COALESCE(cell_data.months_since_mult, 999);
  
  -- Calcular taxa de novos membros (últimos 3 meses)
  SELECT COUNT(*)::NUMERIC / 3.0 INTO new_member_rate
  FROM cell_members 
  WHERE cell_id = p_cell_id 
    AND created_at > CURRENT_DATE - INTERVAL '3 months';
  
  -- Lógica de recomendação
  IF months_since_multiplication > 12 AND cell_data.member_count >= 12 THEN
    RETURN QUERY SELECT 
      'ENVIAR'::cell_mode,
      'Célula madura com mais de 12 membros, pronta para multiplicação',
      0.9::NUMERIC;
  ELSIF new_member_rate > 2 THEN
    RETURN QUERY SELECT
      'CONSOLIDAR'::cell_mode,
      'Alto fluxo de novos membros que precisam ser consolidados',
      0.85::NUMERIC;
  ELSIF cell_data.member_count < 8 THEN
    RETURN QUERY SELECT
      'GANHAR'::cell_mode,
      'Célula com poucos membros, foco em evangelismo',
      0.8::NUMERIC;
  ELSIF last_mode_data.mode != 'DISCIPULAR' OR last_mode_data.end_date < CURRENT_DATE - INTERVAL '6 months' THEN
    RETURN QUERY SELECT
      'DISCIPULAR'::cell_mode,
      'Tempo de fortalecer o ensino e crescimento espiritual',
      0.75::NUMERIC;
  ELSE
    -- Ciclo padrão se nenhuma condição específica
    RETURN QUERY SELECT
      CASE 
        WHEN last_mode_data.mode = 'GANHAR' THEN 'CONSOLIDAR'::cell_mode
        WHEN last_mode_data.mode = 'CONSOLIDAR' THEN 'DISCIPULAR'::cell_mode
        WHEN last_mode_data.mode = 'DISCIPULAR' THEN 'ENVIAR'::cell_mode
        ELSE 'GANHAR'::cell_mode
      END,
      'Próximo modo no ciclo estratégico',
      0.7::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard de modos
CREATE VIEW cell_modes_dashboard AS
SELECT 
  c.id as cell_id,
  c.name as cell_name,
  c.church_id,
  cm.id as mode_id,
  cm.mode as current_mode,
  mt.name as mode_name,
  mt.color as mode_color,
  mt.icon as mode_icon,
  cm.start_date,
  cm.end_date,
  CASE 
    WHEN cm.end_date IS NULL THEN 'Indefinido'
    WHEN cm.end_date < CURRENT_DATE THEN 'Expirado'
    WHEN cm.end_date > CURRENT_DATE THEN 'Ativo'
    ELSE 'Hoje'
  END as status,
  CASE 
    WHEN cm.end_date IS NULL THEN NULL
    ELSE (cm.end_date - CURRENT_DATE)::INTEGER
  END as days_remaining,
  CASE
    WHEN cm.end_date IS NULL THEN 0
    ELSE LEAST(100, 
      ((CURRENT_DATE - cm.start_date)::NUMERIC / 
       NULLIF((cm.end_date - cm.start_date)::NUMERIC, 0) * 100)::NUMERIC(5,2)
    )
  END as progress_percentage,
  cm.target_metrics,
  cm.actual_metrics,
  cm.goal_description,
  p_leader.full_name as leader_name,
  p_supervisor.full_name as supervisor_name,
  (
    SELECT COUNT(*) 
    FROM cell_members 
    WHERE cell_id = c.id AND COALESCE(is_active, true) = true
  ) as member_count
FROM cells c
LEFT JOIN cell_modes cm ON c.id = cm.cell_id AND cm.is_active = true
LEFT JOIN mode_templates mt ON cm.mode = mt.mode AND mt.is_default = true
LEFT JOIN profiles p_leader ON c.leader_id = p_leader.id
LEFT JOIN profiles p_supervisor ON c.supervisor_id = p_supervisor.id;

-- RLS Policies
ALTER TABLE cell_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para cell_modes
CREATE POLICY "cell_modes_select" ON cell_modes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cells c 
    JOIN profiles p ON p.church_id = c.church_id
    WHERE c.id = cell_modes.cell_id 
      AND p.id = auth.uid()
  )
);

CREATE POLICY "cell_modes_insert" ON cell_modes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cells c
    JOIN profiles p ON p.church_id = c.church_id
    WHERE c.id = cell_modes.cell_id 
      AND p.id = auth.uid()
      AND p.role IN ('pastor', 'supervisor', 'leader')
  )
);

CREATE POLICY "cell_modes_update" ON cell_modes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cells c
    JOIN profiles p ON p.church_id = c.church_id
    WHERE c.id = cell_modes.cell_id 
      AND p.id = auth.uid()
      AND p.role IN ('pastor', 'supervisor', 'leader')
  )
);

-- Políticas para mode_activities
CREATE POLICY "mode_activities_select" ON mode_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cell_modes cm
    JOIN cells c ON c.id = cm.cell_id
    JOIN profiles p ON p.church_id = c.church_id
    WHERE cm.id = mode_activities.cell_mode_id
      AND p.id = auth.uid()
  )
);

CREATE POLICY "mode_activities_insert" ON mode_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cell_modes cm
    JOIN cells c ON c.id = cm.cell_id
    JOIN profiles p ON p.church_id = c.church_id
    WHERE cm.id = mode_activities.cell_mode_id
      AND p.id = auth.uid()
      AND p.role IN ('pastor', 'supervisor', 'leader')
  )
);

CREATE POLICY "mode_activities_update" ON mode_activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cell_modes cm
    JOIN cells c ON c.id = cm.cell_id
    JOIN profiles p ON p.church_id = c.church_id
    WHERE cm.id = mode_activities.cell_mode_id
      AND p.id = auth.uid()
      AND p.role IN ('pastor', 'supervisor', 'leader')
  )
);

-- Índices para performance
CREATE INDEX idx_cell_modes_cell_active ON cell_modes(cell_id, is_active);
CREATE INDEX idx_cell_modes_date_range ON cell_modes(start_date, end_date);
CREATE INDEX idx_cell_modes_mode ON cell_modes(mode) WHERE is_active = true;
CREATE INDEX idx_mode_activities_cell_mode ON mode_activities(cell_mode_id);
CREATE INDEX idx_mode_activities_planned_date ON mode_activities(planned_date) WHERE NOT is_completed;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cell_modes_updated_at
  BEFORE UPDATE ON cell_modes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();