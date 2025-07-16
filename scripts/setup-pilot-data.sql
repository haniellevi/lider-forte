-- ================================================
-- SCRIPT DE CONFIGURAÇÃO DE DADOS PILOTO
-- Sistema LIDER-FORTE - Plataforma de Gestão G12
-- ================================================

-- IMPORTANTE: Este script deve ser executado APÓS todas as migrações
-- Execute via: psql -h <host> -U <user> -d <database> -f setup-pilot-data.sql

-- 1. CRIAR IGREJA PILOTO
INSERT INTO churches (
  id,
  name,
  address,
  city,
  state,
  zip_code,
  phone,
  email,
  website,
  settings
) VALUES (
  'pilot-church-001',
  'Igreja Renascer Piloto',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  '(11) 98765-4321',
  'contato@renascerpiloto.com.br',
  'https://renascerpiloto.com.br',
  '{
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "language": "pt-BR",
    "features": {
      "success_ladder": true,
      "leadership_pipeline": true,
      "cell_modes": true,
      "gamification": true
    }
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 2. CRIAR PERFIS PILOTO
INSERT INTO profiles (
  id,
  church_id,
  clerk_id,
  email,
  full_name,
  role,
  phone,
  cpf,
  success_ladder_score,
  is_timoteo,
  settings
) VALUES 
-- Pastor Principal
(
  'pastor-001',
  'pilot-church-001',
  'clerk_pastor_001',
  'pastor@renascerpiloto.com.br',
  'Pastor João Silva',
  'pastor',
  '(11) 99999-0001',
  '12345678901',
  2500,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Supervisor 1
(
  'supervisor-001',
  'pilot-church-001',
  'clerk_supervisor_001',
  'supervisor1@renascerpiloto.com.br',
  'Maria Santos Silva',
  'supervisor',
  '(11) 99999-0002',
  '12345678902',
  1800,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Supervisor 2
(
  'supervisor-002',
  'pilot-church-001',
  'clerk_supervisor_002',
  'supervisor2@renascerpiloto.com.br',
  'Carlos Eduardo Costa',
  'supervisor',
  '(11) 99999-0003',
  '12345678903',
  1650,
  false,
  '{"notifications": {"email": true, "push": false}}'::jsonb
),
-- Líder 1
(
  'leader-001',
  'pilot-church-001',
  'clerk_leader_001',
  'leader1@renascerpiloto.com.br',
  'Ana Paula Oliveira',
  'leader',
  '(11) 99999-0004',
  '12345678904',
  850,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Líder 2
(
  'leader-002',
  'pilot-church-001',
  'clerk_leader_002',
  'leader2@renascerpiloto.com.br',
  'Pedro Henrique Lima',
  'leader',
  '(11) 99999-0005',
  '12345678905',
  920,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Líder 3
(
  'leader-003',
  'pilot-church-001',
  'clerk_leader_003',
  'leader3@renascerpiloto.com.br',
  'Fernanda Alves Pereira',
  'leader',
  '(11) 99999-0006',
  '12345678906',
  780,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Timóteos
(
  'timoteo-001',
  'pilot-church-001',
  'clerk_timoteo_001',
  'timoteo1@renascerpiloto.com.br',
  'Lucas Roberto Santos',
  'timoteo',
  '(11) 99999-0007',
  '12345678907',
  650,
  true,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
(
  'timoteo-002',
  'pilot-church-001',
  'clerk_timoteo_002',
  'timoteo2@renascerpiloto.com.br',
  'Juliana Martins Silva',
  'timoteo',
  '(11) 99999-0008',
  '12345678908',
  720,
  true,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
-- Membros
(
  'member-001',
  'pilot-church-001',
  'clerk_member_001',
  'member1@renascerpiloto.com.br',
  'Roberto Carlos Ferreira',
  'member',
  '(11) 99999-0009',
  '12345678909',
  350,
  false,
  '{"notifications": {"email": false, "push": true}}'::jsonb
),
(
  'member-002',
  'pilot-church-001',
  'clerk_member_002',
  'member2@renascerpiloto.com.br',
  'Mariana Costa Lima',
  'member',
  '(11) 99999-0010',
  '12345678910',
  280,
  false,
  '{"notifications": {"email": true, "push": false}}'::jsonb
),
(
  'member-003',
  'pilot-church-001',
  'clerk_member_003',
  'member3@renascerpiloto.com.br',
  'João Pedro Souza',
  'member',
  '(11) 99999-0011',
  '12345678911',
  420,
  false,
  '{"notifications": {"email": true, "push": true}}'::jsonb
),
(
  'member-004',
  'pilot-church-001',
  'clerk_member_004',
  'member4@renascerpiloto.com.br',
  'Camila Rodrigues',
  'member',
  '(11) 99999-0012',
  '12345678912',
  180,
  false,
  '{"notifications": {"email": false, "push": false}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 3. CRIAR ESTRUTURA DE CÉLULAS
INSERT INTO cells (
  id,
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
) VALUES 
-- Célula Principal (Supervisor 1)
(
  'cell-001',
  'pilot-church-001',
  'Célula Vitória',
  'leader-001',
  'supervisor-001',
  'wednesday',
  '19:30:00',
  'Rua das Palmeiras, 456',
  'São Paulo',
  'SP',
  '01234-567'
),
-- Célula 2 (Supervisor 1)
(
  'cell-002',
  'pilot-church-001',
  'Célula Esperança',
  'leader-002',
  'supervisor-001',
  'thursday',
  '20:00:00',
  'Av. Paulista, 1000',
  'São Paulo',
  'SP',
  '01310-100'
),
-- Célula 3 (Supervisor 2)
(
  'cell-003',
  'pilot-church-001',
  'Célula Fé',
  'leader-003',
  'supervisor-002',
  'tuesday',
  '19:00:00',
  'Rua Augusta, 789',
  'São Paulo',
  'SP',
  '01305-000'
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 4. ADICIONAR MEMBROS ÀS CÉLULAS
INSERT INTO cell_members (
  cell_id,
  profile_id,
  role,
  success_ladder_score,
  is_timoteo,
  joined_at
) VALUES 
-- Célula Vitória
('cell-001', 'leader-001', 'leader', 850, false, NOW() - INTERVAL '6 months'),
('cell-001', 'timoteo-001', 'timoteo', 650, true, NOW() - INTERVAL '4 months'),
('cell-001', 'member-001', 'member', 350, false, NOW() - INTERVAL '3 months'),
('cell-001', 'member-002', 'member', 280, false, NOW() - INTERVAL '2 months'),

-- Célula Esperança  
('cell-002', 'leader-002', 'leader', 920, false, NOW() - INTERVAL '8 months'),
('cell-002', 'timoteo-002', 'timoteo', 720, true, NOW() - INTERVAL '5 months'),
('cell-002', 'member-003', 'member', 420, false, NOW() - INTERVAL '4 months'),

-- Célula Fé
('cell-003', 'leader-003', 'leader', 780, false, NOW() - INTERVAL '7 months'),
('cell-003', 'member-004', 'member', 180, false, NOW() - INTERVAL '1 month')
ON CONFLICT (cell_id, profile_id) DO UPDATE SET
  updated_at = NOW();

-- 5. ADICIONAR ATIVIDADES PARA HISTÓRICO DA ESCADA DO SUCESSO
INSERT INTO member_activity_log (
  profile_id,
  activity_id,
  points_earned,
  activity_date,
  metadata
) 
SELECT 
  p.id,
  sla.id,
  sla.points,
  CURRENT_DATE - (random() * 90)::integer,
  '{"source": "pilot_setup", "church": "pilot-church-001"}'::jsonb
FROM profiles p
CROSS JOIN success_ladder_activities sla
WHERE p.church_id = 'pilot-church-001'
  AND random() > 0.3 -- 70% chance de ter feito cada atividade
ON CONFLICT DO NOTHING;

-- 6. CONFIGURAR MODOS ATIVOS PARA CÉLULAS
INSERT INTO cell_modes (
  cell_id,
  mode,
  start_date,
  end_date,
  goal_description,
  target_metrics,
  actual_metrics,
  created_by
) VALUES 
(
  'cell-001',
  'GANHAR',
  CURRENT_DATE - INTERVAL '1 week',
  CURRENT_DATE + INTERVAL '3 weeks',
  'Foco em evangelismo e alcance de novos visitantes',
  '{"new_visitors": {"target": 4}, "conversions": {"target": 2}, "invitation_activities": {"target": 3}}'::jsonb,
  '{"new_visitors": {"actual": 2}, "invitation_activities": {"actual": 1}}'::jsonb,
  'leader-001'
),
(
  'cell-002',
  'DISCIPULAR',
  CURRENT_DATE - INTERVAL '2 weeks',
  CURRENT_DATE + INTERVAL '4 weeks',
  'Período de estudos intensivos da Palavra',
  '{"bible_studies": {"target": 6}, "course_completions": {"target": 2}, "spiritual_growth": {"target": 80}}'::jsonb,
  '{"bible_studies": {"actual": 3}, "course_completions": {"actual": 1}}'::jsonb,
  'leader-002'
),
(
  'cell-003',
  'CONSOLIDAR',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 weeks',
  'Cuidado pastoral e integração de novos membros',
  '{"pastoral_visits": {"target": 3}, "new_member_integration": {"target": 1}, "member_retention": {"target": 95}}'::jsonb,
  '{"pastoral_visits": {"actual": 1}}'::jsonb,
  'leader-003'
)
ON CONFLICT DO NOTHING;

-- 7. GERAR DADOS PARA PIPELINE DE LIDERANÇA
-- Isso será calculado automaticamente pelas funções SQL implementadas
-- quando atividades forem registradas

-- 8. ADICIONAR ALGUNS BADGES CONQUISTADOS
-- Os badges serão automaticamente atribuídos pelos triggers quando as condições forem atendidas

-- 9. CRIAR ALGUNS RELATÓRIOS DE EXEMPLO
INSERT INTO reports (
  church_id,
  name,
  description,
  report_type,
  parameters,
  created_by,
  is_public
) VALUES 
(
  'pilot-church-001',
  'Crescimento Mensal da Igreja',
  'Relatório de crescimento de membros e células',
  'member_growth',
  '{"period": "monthly", "include_cells": true}'::jsonb,
  'pastor-001',
  true
),
(
  'pilot-church-001',
  'Performance das Células',
  'Análise de performance das células ativas',
  'cell_performance',
  '{"period": "quarterly", "metrics": ["attendance", "growth", "multiplication"]}'::jsonb,
  'supervisor-001',
  false
)
ON CONFLICT DO NOTHING;

-- 10. ADICIONAR EVENTOS DE EXEMPLO
INSERT INTO events (
  church_id,
  profile_id,
  cell_id,
  event_type,
  event_data,
  created_at
) VALUES 
('pilot-church-001', 'leader-001', 'cell-001', 'cell_mode_activated', '{"mode": "GANHAR", "duration": 4}'::jsonb, NOW() - INTERVAL '1 week'),
('pilot-church-001', 'member-001', 'cell-001', 'member_added_to_cell', '{"previous_cell": null}'::jsonb, NOW() - INTERVAL '3 months'),
('pilot-church-001', 'timoteo-001', 'cell-001', 'member_role_changed', '{"from": "member", "to": "timoteo"}'::jsonb, NOW() - INTERVAL '1 month'),
('pilot-church-001', 'leader-002', 'cell-002', 'cell_mode_activated', '{"mode": "DISCIPULAR", "duration": 6}'::jsonb, NOW() - INTERVAL '2 weeks'),
('pilot-church-001', 'member-003', 'cell-002', 'member_added_to_cell', '{"previous_cell": null}'::jsonb, NOW() - INTERVAL '4 months')
ON CONFLICT DO NOTHING;

-- ================================================
-- VERIFICAÇÕES E RELATÓRIOS FINAIS
-- ================================================

-- Verificar estrutura criada
SELECT 
  'IGREJAS' as tipo,
  COUNT(*) as total
FROM churches 
WHERE id = 'pilot-church-001'

UNION ALL

SELECT 
  'PERFIS' as tipo,
  COUNT(*) as total
FROM profiles 
WHERE church_id = 'pilot-church-001'

UNION ALL

SELECT 
  'CÉLULAS' as tipo,
  COUNT(*) as total
FROM cells 
WHERE church_id = 'pilot-church-001'

UNION ALL

SELECT 
  'MEMBROS EM CÉLULAS' as tipo,
  COUNT(*) as total
FROM cell_members cm
JOIN cells c ON cm.cell_id = c.id
WHERE c.church_id = 'pilot-church-001'

UNION ALL

SELECT 
  'ATIVIDADES REGISTRADAS' as tipo,
  COUNT(*) as total
FROM member_activity_log mal
JOIN profiles p ON mal.profile_id = p.id
WHERE p.church_id = 'pilot-church-001'

UNION ALL

SELECT 
  'MODOS ATIVOS' as tipo,
  COUNT(*) as total
FROM cell_modes cm
JOIN cells c ON cm.cell_id = c.id
WHERE c.church_id = 'pilot-church-001' AND cm.is_active = true;

-- Mostrar hierarquia criada
SELECT 
  c.name as celula,
  p_leader.full_name as lider,
  p_supervisor.full_name as supervisor,
  COUNT(cm.profile_id) as total_membros,
  AVG(cm.success_ladder_score) as pontuacao_media
FROM cells c
LEFT JOIN profiles p_leader ON c.leader_id = p_leader.id
LEFT JOIN profiles p_supervisor ON c.supervisor_id = p_supervisor.id
LEFT JOIN cell_members cm ON c.id = cm.cell_id
WHERE c.church_id = 'pilot-church-001'
GROUP BY c.id, c.name, p_leader.full_name, p_supervisor.full_name
ORDER BY c.name;

-- ================================================
-- DADOS PILOTO CONFIGURADOS COM SUCESSO!
-- ================================================

COMMIT;