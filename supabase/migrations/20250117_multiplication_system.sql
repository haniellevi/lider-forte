-- Criar ENUM para status do processo de multiplicação
CREATE TYPE multiplication_process_status AS ENUM (
  'draft',           -- Rascunho sendo preparado
  'member_selection', -- Selecionando membros
  'leader_assignment', -- Atribuindo novo líder
  'plan_review',     -- Revisão do plano
  'pending_approval', -- Aguardando aprovação
  'approved',        -- Aprovado para execução
  'in_progress',     -- Em processo de execução
  'completed',       -- Concluído com sucesso
  'cancelled',       -- Cancelado
  'rejected'         -- Rejeitado na aprovação
);

-- Criar ENUM para tipo de atribuição
CREATE TYPE assignment_type AS ENUM (
  'stays_source',    -- Permanece na célula original
  'moves_new',       -- Vai para nova célula
  'new_leader',      -- Será o novo líder
  'undecided'        -- Ainda não decidido
);

-- Criar ENUM para tipo de template
CREATE TYPE template_type AS ENUM (
  'balanced',        -- Divisão equilibrada
  'growth_focused',  -- Foco no crescimento
  'leadership_dev',  -- Desenvolvimento de liderança
  'geographic',      -- Divisão geográfica
  'custom'          -- Personalizado
);

-- Tabela principal de processos de multiplicação
CREATE TABLE multiplication_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  new_cell_id UUID REFERENCES cells(id) ON DELETE SET NULL,
  status multiplication_process_status DEFAULT 'draft',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 6,
  initiated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  new_leader_id UUID REFERENCES profiles(id),
  multiplication_plan JSONB NOT NULL DEFAULT '{}',
  member_distribution JSONB DEFAULT '{}',
  approval_notes TEXT,
  completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atribuições de membros
CREATE TABLE multiplication_member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  multiplication_id UUID REFERENCES multiplication_processes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_type assignment_type NOT NULL,
  role_in_new_cell TEXT DEFAULT 'member',
  priority_score NUMERIC(5,2) DEFAULT 0,
  auto_suggested BOOLEAN DEFAULT false,
  manually_adjusted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de multiplicação
CREATE TABLE multiplication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  template_type template_type DEFAULT 'balanced',
  member_split_strategy JSONB NOT NULL,
  leader_selection_criteria JSONB NOT NULL,
  default_new_cell_settings JSONB DEFAULT '{}',
  success_rate NUMERIC(5,2) DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_multiplication_processes_church_id ON multiplication_processes(church_id);
CREATE INDEX idx_multiplication_processes_source_cell_id ON multiplication_processes(source_cell_id);
CREATE INDEX idx_multiplication_processes_status ON multiplication_processes(status);
CREATE INDEX idx_multiplication_member_assignments_multiplication_id ON multiplication_member_assignments(multiplication_id);
CREATE INDEX idx_multiplication_member_assignments_member_id ON multiplication_member_assignments(member_id);
CREATE INDEX idx_multiplication_templates_church_id ON multiplication_templates(church_id);
CREATE INDEX idx_multiplication_templates_template_type ON multiplication_templates(template_type);

-- RLS Policies
ALTER TABLE multiplication_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplication_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplication_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para multiplication_processes
CREATE POLICY "Users can view multiplication processes of their church"
  ON multiplication_processes FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders and supervisors can create multiplication processes"
  ON multiplication_processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cells c
      WHERE c.id = source_cell_id
        AND (c.leader_id = auth.uid() OR c.supervisor_id = auth.uid())
    )
  );

CREATE POLICY "Leaders and supervisors can update their multiplication processes"
  ON multiplication_processes FOR UPDATE
  USING (
    initiated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM cells c
      WHERE c.id = source_cell_id
        AND (c.leader_id = auth.uid() OR c.supervisor_id = auth.uid())
    )
  );

-- Políticas para multiplication_member_assignments
CREATE POLICY "Users can view member assignments of their church"
  ON multiplication_member_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multiplication_processes mp
      WHERE mp.id = multiplication_id
        AND mp.church_id IN (
          SELECT church_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Leaders can manage member assignments"
  ON multiplication_member_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM multiplication_processes mp
      JOIN cells c ON c.id = mp.source_cell_id
      WHERE mp.id = multiplication_id
        AND (c.leader_id = auth.uid() OR c.supervisor_id = auth.uid())
    )
  );

-- Políticas para multiplication_templates
CREATE POLICY "Users can view templates of their church"
  ON multiplication_templates FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Church admins can manage templates"
  ON multiplication_templates FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Popular templates padrão
INSERT INTO multiplication_templates (church_id, name, description, template_type, member_split_strategy, leader_selection_criteria, default_new_cell_settings)
SELECT 
  c.id,
  'Divisão Equilibrada',
  'Divisão meio-a-meio mantendo equilíbrio de perfis',
  'balanced'::template_type,
  '{
    "strategy": "balanced_split",
    "target_ratio": 0.5,
    "preserve_families": true,
    "maintain_age_balance": true,
    "keep_core_members": true
  }'::jsonb,
  '{
    "min_leadership_score": 70,
    "min_ladder_score": 600,
    "leadership_experience": true,
    "timoteo_status": "preferred"
  }'::jsonb,
  '{
    "initial_mode": "CONSOLIDAR",
    "meeting_frequency": "weekly",
    "initial_duration_weeks": 8
  }'::jsonb
FROM churches c

UNION ALL

SELECT 
  c.id,
  'Foco no Crescimento',
  'Maximiza potencial de crescimento de ambas as células',
  'growth_focused'::template_type,
  '{
    "strategy": "growth_optimized",
    "evangelistic_members_ratio": 0.6,
    "new_converts_stay_source": true,
    "experienced_members_to_new": true
  }'::jsonb,
  '{
    "min_leadership_score": 75,
    "evangelistic_gift": "preferred",
    "multiplication_experience": true
  }'::jsonb,
  '{
    "initial_mode": "GANHAR",
    "meeting_frequency": "weekly", 
    "evangelistic_focus": true
  }'::jsonb
FROM churches c

UNION ALL

SELECT 
  c.id,
  'Desenvolvimento de Liderança',
  'Prioriza desenvolvimento de novos líderes',
  'leadership_dev'::template_type,
  '{
    "strategy": "leadership_development",
    "send_experienced_leaders": true,
    "timoteos_to_new_cell": 0.7,
    "mentorship_pairs": true
  }'::jsonb,
  '{
    "timoteo_status": "required",
    "mentoring_experience": true,
    "development_potential": "high"
  }'::jsonb,
  '{
    "initial_mode": "DISCIPULAR",
    "leadership_training": true,
    "mentorship_program": true
  }'::jsonb
FROM churches c;

-- Função de seleção automática de membros
CREATE OR REPLACE FUNCTION suggest_member_distribution(
  p_multiplication_id UUID,
  p_template_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  mult_process RECORD;
  template_data RECORD;
  member_record RECORD;
  total_members INTEGER;
  target_new_cell_size INTEGER;
  suggested_distribution JSONB := '{}';
  members_array JSONB := '[]';
  potential_leaders JSONB := '[]';
  strategy_config JSONB;
BEGIN
  -- Buscar processo de multiplicação
  SELECT * INTO mult_process FROM multiplication_processes WHERE id = p_multiplication_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processo de multiplicação não encontrado';
  END IF;

  -- Buscar template se especificado
  IF p_template_id IS NOT NULL THEN
    SELECT * INTO template_data FROM multiplication_templates WHERE id = p_template_id;
    strategy_config := template_data.member_split_strategy;
  ELSE
    -- Usar template padrão (balanced)
    SELECT * INTO template_data 
    FROM multiplication_templates 
    WHERE church_id = mult_process.church_id 
      AND template_type = 'balanced' 
      AND is_active = true
    LIMIT 1;
    strategy_config := template_data.member_split_strategy;
  END IF;

  -- Contar membros da célula
  SELECT COUNT(*) INTO total_members
  FROM cell_members
  WHERE cell_id = mult_process.source_cell_id;

  -- Calcular tamanho alvo da nova célula
  target_new_cell_size := CASE 
    WHEN strategy_config->>'strategy' = 'balanced_split' THEN
      (total_members * (strategy_config->>'target_ratio')::NUMERIC)::INTEGER
    WHEN strategy_config->>'strategy' = 'growth_optimized' THEN
      GREATEST(6, total_members * 0.4)::INTEGER
    WHEN strategy_config->>'strategy' = 'leadership_development' THEN
      LEAST(8, total_members * 0.6)::INTEGER
    ELSE
      (total_members * 0.5)::INTEGER
  END;

  -- Analisar cada membro da célula
  FOR member_record IN
    SELECT 
      cm.profile_id,
      CASE 
        WHEN c.leader_id = cm.profile_id THEN 'leader'
        WHEN c.supervisor_id = cm.profile_id THEN 'supervisor'
        ELSE 'member'
      END as role,
      cm.success_ladder_score,
      cm.is_timoteo,
      p.full_name,
      p.age,
      lp.leadership_score,
      lp.potential_level,
      EXTRACT(months FROM age(NOW(), cm.joined_at)) as months_in_cell
    FROM cell_members cm
    JOIN profiles p ON cm.profile_id = p.id
    JOIN cells c ON c.id = cm.cell_id
    LEFT JOIN leadership_pipeline lp ON p.id = lp.profile_id
    WHERE cm.cell_id = mult_process.source_cell_id
  LOOP
    DECLARE
      suggestion assignment_type;
      priority_score NUMERIC := 0;
      role_in_new TEXT := 'member';
      reasoning TEXT := '';
    BEGIN
      -- Calcular priority score baseado em múltiplos fatores
      priority_score := priority_score + COALESCE(member_record.leadership_score, 0) * 0.3;
      priority_score := priority_score + member_record.success_ladder_score * 0.2;
      priority_score := priority_score + member_record.months_in_cell * 2;
      
      IF member_record.is_timoteo THEN
        priority_score := priority_score + 20;
      END IF;
      
      IF member_record.role IN ('leader', 'supervisor') THEN
        priority_score := priority_score + 30;
      END IF;

      -- Lógica de sugestão baseada na estratégia
      CASE strategy_config->>'strategy'
        WHEN 'balanced_split' THEN
          IF member_record.role = 'leader' THEN
            suggestion := 'stays_source';
            reasoning := 'Líder permanece na célula original';
          ELSIF member_record.is_timoteo AND COALESCE(member_record.leadership_score, 0) >= 70 THEN
            suggestion := 'new_leader';
            role_in_new := 'leader';
            reasoning := 'Timóteo com alto potencial para liderar nova célula';
          ELSIF priority_score >= 60 THEN
            suggestion := 'moves_new';
            reasoning := 'Membro experiente para fortalecer nova célula';
          ELSE
            suggestion := 'stays_source';
            reasoning := 'Membro permanece para estabilidade da célula original';
          END IF;
          
        WHEN 'growth_optimized' THEN
          IF member_record.role = 'leader' THEN
            suggestion := 'stays_source';
          ELSIF member_record.is_timoteo THEN
            suggestion := 'new_leader';
            role_in_new := 'leader';
          ELSIF member_record.months_in_cell <= 6 THEN
            suggestion := 'stays_source';
            reasoning := 'Novo convertido permanece para consolidação';
          ELSE
            suggestion := 'moves_new';
          END IF;
          
        WHEN 'leadership_development' THEN
          IF member_record.is_timoteo OR COALESCE(member_record.leadership_score, 0) >= 60 THEN
            suggestion := 'moves_new';
            IF COALESCE(member_record.leadership_score, 0) >= 75 THEN
              role_in_new := 'leader';
              suggestion := 'new_leader';
            END IF;
          ELSE
            suggestion := 'stays_source';
          END IF;
      END CASE;

      -- Adicionar membro à distribuição sugerida
      members_array := members_array || jsonb_build_object(
        'member_id', member_record.profile_id,
        'name', member_record.full_name,
        'current_role', member_record.role,
        'suggestion', suggestion,
        'role_in_new', role_in_new,
        'priority_score', priority_score,
        'reasoning', reasoning,
        'leadership_score', COALESCE(member_record.leadership_score, 0),
        'ladder_score', member_record.success_ladder_score,
        'is_timoteo', member_record.is_timoteo,
        'months_in_cell', member_record.months_in_cell
      );

      -- Coletar potenciais líderes
      IF suggestion IN ('new_leader', 'moves_new') AND 
         (member_record.is_timoteo OR COALESCE(member_record.leadership_score, 0) >= 65) THEN
        potential_leaders := potential_leaders || jsonb_build_object(
          'member_id', member_record.profile_id,
          'name', member_record.full_name,
          'leadership_score', COALESCE(member_record.leadership_score, 0),
          'reasoning', 'Candidato a liderança baseado em score e experiência'
        );
      END IF;
    END;
  END LOOP;

  -- Montar resultado final
  suggested_distribution := jsonb_build_object(
    'template_used', template_data.name,
    'strategy', strategy_config->>'strategy',
    'total_members', total_members,
    'target_new_cell_size', target_new_cell_size,
    'members', members_array,
    'potential_leaders', potential_leaders,
    'summary', jsonb_build_object(
      'stays_source', (SELECT COUNT(*) FROM jsonb_array_elements(members_array) WHERE value->>'suggestion' = 'stays_source'),
      'moves_new', (SELECT COUNT(*) FROM jsonb_array_elements(members_array) WHERE value->>'suggestion' = 'moves_new'),
      'new_leaders', (SELECT COUNT(*) FROM jsonb_array_elements(members_array) WHERE value->>'suggestion' = 'new_leader'),
      'undecided', (SELECT COUNT(*) FROM jsonb_array_elements(members_array) WHERE value->>'suggestion' = 'undecided')
    )
  );

  RETURN suggested_distribution;
END;
$$ LANGUAGE plpgsql;

-- Função de criação da nova célula
CREATE OR REPLACE FUNCTION execute_multiplication(p_multiplication_id UUID)
RETURNS UUID AS $$
DECLARE
  mult_process RECORD;
  new_cell_id UUID;
  assignment_record RECORD;
  new_cell_settings JSONB;
BEGIN
  -- Buscar processo de multiplicação
  SELECT * INTO mult_process 
  FROM multiplication_processes 
  WHERE id = p_multiplication_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processo de multiplicação não encontrado ou não aprovado';
  END IF;

  -- Buscar configurações da nova célula
  SELECT default_new_cell_settings INTO new_cell_settings
  FROM multiplication_templates
  WHERE church_id = mult_process.church_id
    AND template_type = (mult_process.multiplication_plan->>'template_type')::template_type;

  -- Criar nova célula
  INSERT INTO cells (
    church_id,
    name,
    leader_id,
    supervisor_id,
    meeting_day,
    meeting_time,
    address,
    city,
    state,
    zip_code
  )
  SELECT 
    mult_process.church_id,
    (mult_process.multiplication_plan->>'new_cell_name')::VARCHAR,
    mult_process.new_leader_id,
    (SELECT supervisor_id FROM cells WHERE id = mult_process.source_cell_id),
    COALESCE((mult_process.multiplication_plan->>'meeting_day')::TEXT, 'wednesday'),
    COALESCE((mult_process.multiplication_plan->>'meeting_time')::TIME, '19:30:00'),
    mult_process.multiplication_plan->>'address',
    mult_process.multiplication_plan->>'city',
    mult_process.multiplication_plan->>'state',
    mult_process.multiplication_plan->>'zip_code'
  RETURNING id INTO new_cell_id;

  -- Mover membros conforme planejado
  FOR assignment_record IN
    SELECT * FROM multiplication_member_assignments
    WHERE multiplication_id = p_multiplication_id
      AND assignment_type = 'moves_new'
  LOOP
    -- Remover da célula original
    DELETE FROM cell_members 
    WHERE cell_id = mult_process.source_cell_id 
      AND profile_id = assignment_record.member_id;
    
    -- Adicionar na nova célula
    INSERT INTO cell_members (
      cell_id, profile_id, success_ladder_score, is_timoteo
    )
    SELECT 
      new_cell_id,
      assignment_record.member_id,
      cm.success_ladder_score,
      cm.is_timoteo
    FROM cell_members cm
    WHERE cm.profile_id = assignment_record.member_id
    LIMIT 1;
  END LOOP;

  -- Atualizar status do processo
  UPDATE multiplication_processes 
  SET 
    status = 'completed',
    new_cell_id = new_cell_id,
    completion_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_multiplication_id;

  -- Ativar modo inicial da nova célula
  IF new_cell_settings->>'initial_mode' IS NOT NULL THEN
    INSERT INTO cell_modes (
      cell_id, mode, start_date, end_date, goal_description, created_by
    ) VALUES (
      new_cell_id,
      (new_cell_settings->>'initial_mode')::TEXT,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '4 weeks',
      'Modo inicial pós-multiplicação',
      mult_process.new_leader_id
    );
  END IF;

  -- Registrar evento
  INSERT INTO events (church_id, cell_id, profile_id, event_type, event_data)
  VALUES (
    mult_process.church_id,
    mult_process.source_cell_id,
    mult_process.initiated_by,
    'cell_multiplication_completed',
    jsonb_build_object(
      'new_cell_id', new_cell_id,
      'new_leader_id', mult_process.new_leader_id,
      'members_moved', (SELECT COUNT(*) FROM multiplication_member_assignments 
                       WHERE multiplication_id = p_multiplication_id 
                       AND assignment_type = 'moves_new')
    )
  );

  RETURN new_cell_id;
END;
$$ LANGUAGE plpgsql;

-- Função para definir passos do wizard
CREATE OR REPLACE FUNCTION get_multiplication_wizard_steps()
RETURNS JSONB AS $$
BEGIN
  RETURN '[
    {
      "step": 1,
      "name": "Informações Básicas", 
      "description": "Definir nome e configurações da nova célula",
      "required_fields": ["new_cell_name", "meeting_day", "meeting_time", "address"]
    },
    {
      "step": 2,
      "name": "Seleção de Template",
      "description": "Escolher estratégia de multiplicação",
      "required_fields": ["template_id"]
    },
    {
      "step": 3,
      "name": "Distribuição de Membros",
      "description": "Definir quais membros irão para nova célula",
      "required_fields": ["member_assignments"]
    },
    {
      "step": 4,
      "name": "Novo Líder",
      "description": "Selecionar e confirmar o novo líder",
      "required_fields": ["new_leader_id"]
    },
    {
      "step": 5,
      "name": "Revisão do Plano",
      "description": "Revisar todas as configurações antes da aprovação",
      "required_fields": ["plan_confirmation"]
    },
    {
      "step": 6,
      "name": "Submissão para Aprovação",
      "description": "Enviar para aprovação hierárquica",
      "required_fields": ["approval_request"]
    }
  ]'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_multiplication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multiplication_processes_updated_at
  BEFORE UPDATE ON multiplication_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_multiplication_updated_at();