-- Criação do sistema de auditoria e logs avançados
-- Esta migração cria as tabelas e funções necessárias para auditoria completa

-- Tabela principal de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255), -- ID da sessão do usuário
  ip_address INET, -- Endereço IP do usuário
  user_agent TEXT, -- User Agent do navegador
  action VARCHAR(100) NOT NULL, -- Ação realizada (create, update, delete, login, etc.)
  entity_type VARCHAR(100) NOT NULL, -- Tipo da entidade (user, cell, member, etc.)
  entity_id UUID, -- ID da entidade afetada
  old_values JSONB, -- Valores anteriores (para updates)
  new_values JSONB, -- Valores novos (para creates/updates)
  metadata JSONB DEFAULT '{}'::jsonb, -- Metadados adicionais
  success BOOLEAN NOT NULL DEFAULT true, -- Se a ação foi bem-sucedida
  error_message TEXT, -- Mensagem de erro se falhou
  duration_ms INTEGER, -- Duração da operação em milissegundos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para logs de login/logout
CREATE TABLE IF NOT EXISTS authentication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email VARCHAR(255),
  action VARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'password_reset', 'password_change')),
  ip_address INET,
  user_agent TEXT,
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para logs de segurança e eventos suspeitos
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- suspicious_activity, permission_denied, rate_limit, etc.
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para logs de acesso a dados sensíveis
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'export', 'bulk_access')),
  query_type VARCHAR(50), -- select, export_csv, bulk_download, etc.
  record_count INTEGER DEFAULT 1,
  filters_applied JSONB, -- Filtros aplicados na consulta
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para logs de performance e sistema
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  endpoint VARCHAR(255), -- API endpoint ou página acessada
  method VARCHAR(10), -- GET, POST, PUT, DELETE
  status_code INTEGER,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb DECIMAL(10,2),
  db_queries_count INTEGER,
  db_queries_duration_ms INTEGER,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para configurações de auditoria
CREATE TABLE IF NOT EXISTS audit_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error')),
  log_authentication BOOLEAN NOT NULL DEFAULT true,
  log_data_access BOOLEAN NOT NULL DEFAULT true,
  log_security_events BOOLEAN NOT NULL DEFAULT true,
  log_performance BOOLEAN NOT NULL DEFAULT false,
  retention_days INTEGER NOT NULL DEFAULT 365,
  sensitive_tables TEXT[] DEFAULT ARRAY['profiles', 'members'], -- Tabelas consideradas sensíveis
  alert_on_suspicious BOOLEAN NOT NULL DEFAULT true,
  alert_recipients TEXT[] DEFAULT ARRAY[]::TEXT[], -- Emails para alertas
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_church_id ON audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(church_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(church_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(church_id, success) WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_authentication_logs_church_id ON authentication_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_authentication_logs_user_id ON authentication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_authentication_logs_action ON authentication_logs(action);
CREATE INDEX IF NOT EXISTS idx_authentication_logs_created_at ON authentication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_authentication_logs_failed ON authentication_logs(email, created_at DESC) WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_security_logs_church_id ON security_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_resolved ON security_logs(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_church_id ON data_access_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_table ON data_access_logs(church_id, table_name);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(church_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_audit_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_configurations_updated_at
  BEFORE UPDATE ON audit_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_configurations_updated_at();

-- Função para log de auditoria genérico
CREATE OR REPLACE FUNCTION log_audit_event(
  p_church_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_entity_type VARCHAR(100),
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_config RECORD;
BEGIN
  -- Verificar se a auditoria está habilitada
  SELECT * INTO v_config
  FROM audit_configurations
  WHERE church_id = p_church_id;
  
  IF NOT FOUND THEN
    -- Usar configuração padrão se não existe
    v_config.log_level := 'info';
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO audit_logs (
    church_id,
    user_id,
    session_id,
    ip_address,
    user_agent,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    success,
    error_message,
    duration_ms
  ) VALUES (
    p_church_id,
    p_user_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_metadata,
    p_success,
    p_error_message,
    p_duration_ms
  ) RETURNING id INTO v_audit_id;
  
  -- Se houve erro e alertas estão habilitados, criar evento de segurança
  IF NOT p_success AND v_config.alert_on_suspicious THEN
    INSERT INTO security_logs (
      church_id,
      user_id,
      event_type,
      severity,
      description,
      ip_address,
      user_agent,
      details
    ) VALUES (
      p_church_id,
      p_user_id,
      'operation_failed',
      'medium',
      format('Falha na operação %s em %s: %s', p_action, p_entity_type, p_error_message),
      p_ip_address,
      p_user_agent,
      jsonb_build_object(
        'audit_id', v_audit_id,
        'action', p_action,
        'entity_type', p_entity_type,
        'entity_id', p_entity_id
      )
    );
  END IF;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Função para log de autenticação
CREATE OR REPLACE FUNCTION log_authentication_event(
  p_church_id UUID,
  p_user_id UUID,
  p_email VARCHAR(255),
  p_action VARCHAR(20),
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO authentication_logs (
    church_id,
    user_id,
    email,
    action,
    ip_address,
    user_agent,
    success,
    failure_reason,
    session_id
  ) VALUES (
    p_church_id,
    p_user_id,
    p_email,
    p_action,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason,
    p_session_id
  ) RETURNING id INTO v_log_id;
  
  -- Se houve falha no login, verificar tentativas suspeitas
  IF p_action = 'failed_login' AND NOT p_success THEN
    PERFORM check_suspicious_login_attempts(p_email, p_ip_address);
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar tentativas suspeitas de login
CREATE OR REPLACE FUNCTION check_suspicious_login_attempts(
  p_email VARCHAR(255),
  p_ip_address INET
)
RETURNS VOID AS $$
DECLARE
  v_failed_attempts INTEGER;
  v_church_id UUID;
BEGIN
  -- Contar falhas de login nas últimas 15 minutos
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM authentication_logs
  WHERE email = p_email
    AND action = 'failed_login'
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Se mais de 5 tentativas falharam, criar alerta de segurança
  IF v_failed_attempts >= 5 THEN
    -- Buscar church_id do usuário
    SELECT church_id INTO v_church_id
    FROM profiles
    WHERE email = p_email;
    
    INSERT INTO security_logs (
      church_id,
      event_type,
      severity,
      description,
      ip_address,
      details
    ) VALUES (
      v_church_id,
      'brute_force_attempt',
      'high',
      format('Múltiplas tentativas de login falharam para %s em 15 minutos', p_email),
      p_ip_address,
      jsonb_build_object(
        'email', p_email,
        'failed_attempts', v_failed_attempts,
        'time_window', '15 minutes'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para log de acesso a dados sensíveis
CREATE OR REPLACE FUNCTION log_data_access(
  p_church_id UUID,
  p_user_id UUID,
  p_table_name VARCHAR(100),
  p_record_id UUID DEFAULT NULL,
  p_access_type VARCHAR(20) DEFAULT 'read',
  p_query_type VARCHAR(50) DEFAULT 'select',
  p_record_count INTEGER DEFAULT 1,
  p_filters_applied JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_config RECORD;
BEGIN
  -- Verificar se o log de acesso a dados está habilitado
  SELECT * INTO v_config
  FROM audit_configurations
  WHERE church_id = p_church_id;
  
  IF NOT FOUND OR NOT v_config.log_data_access THEN
    RETURN NULL;
  END IF;
  
  -- Verificar se a tabela é considerada sensível
  IF p_table_name = ANY(v_config.sensitive_tables) THEN
    INSERT INTO data_access_logs (
      church_id,
      user_id,
      table_name,
      record_id,
      access_type,
      query_type,
      record_count,
      filters_applied,
      ip_address
    ) VALUES (
      p_church_id,
      p_user_id,
      p_table_name,
      p_record_id,
      p_access_type,
      p_query_type,
      p_record_count,
      p_filters_applied,
      p_ip_address
    ) RETURNING id INTO v_log_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_total_deleted INTEGER := 0;
  v_church RECORD;
  v_retention_date TIMESTAMPTZ;
BEGIN
  FOR v_church IN
    SELECT church_id, retention_days
    FROM audit_configurations
  LOOP
    v_retention_date := NOW() - (v_church.retention_days || ' days')::INTERVAL;
    
    -- Limpar logs de auditoria
    DELETE FROM audit_logs
    WHERE church_id = v_church.church_id
      AND created_at < v_retention_date;
    
    v_total_deleted := v_total_deleted + (SELECT ROW_COUNT());
    
    -- Limpar logs de autenticação
    DELETE FROM authentication_logs
    WHERE church_id = v_church.church_id
      AND created_at < v_retention_date;
    
    v_total_deleted := v_total_deleted + (SELECT ROW_COUNT());
    
    -- Limpar logs de acesso a dados
    DELETE FROM data_access_logs
    WHERE church_id = v_church.church_id
      AND created_at < v_retention_date;
    
    v_total_deleted := v_total_deleted + (SELECT ROW_COUNT());
    
    -- Limpar logs de performance (manter apenas 30 dias)
    DELETE FROM performance_logs
    WHERE church_id = v_church.church_id
      AND created_at < NOW() - INTERVAL '30 days';
    
    v_total_deleted := v_total_deleted + (SELECT ROW_COUNT());
  END LOOP;
  
  RETURN v_total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Função para estatísticas de auditoria
CREATE OR REPLACE FUNCTION get_audit_statistics(
  p_church_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'successful_events', COUNT(*) FILTER (WHERE success = true),
    'failed_events', COUNT(*) FILTER (WHERE success = false),
    'unique_users', COUNT(DISTINCT user_id),
    'top_actions', (
      SELECT jsonb_agg(jsonb_build_object('action', action, 'count', count))
      FROM (
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE church_id = p_church_id
          AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      ) top_actions
    ),
    'events_by_day', (
      SELECT jsonb_agg(jsonb_build_object('date', date, 'count', count))
      FROM (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM audit_logs
        WHERE church_id = p_church_id
          AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
        ORDER BY date
      ) daily_stats
    ),
    'security_events', (
      SELECT COUNT(*)
      FROM security_logs
      WHERE church_id = p_church_id
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'unresolved_security_events', (
      SELECT COUNT(*)
      FROM security_logs
      WHERE church_id = p_church_id
        AND resolved = false
    )
  )
  INTO v_stats
  FROM audit_logs
  WHERE church_id = p_church_id
    AND created_at BETWEEN p_start_date AND p_end_date;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "audit_logs_church_isolation" ON audit_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "authentication_logs_church_isolation" ON authentication_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "security_logs_church_isolation" ON security_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "data_access_logs_church_isolation" ON data_access_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "performance_logs_church_isolation" ON performance_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    ) OR church_id IS NULL
  );

CREATE POLICY "audit_configurations_church_isolation" ON audit_configurations
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON authentication_logs TO authenticated;
GRANT ALL ON security_logs TO authenticated;
GRANT ALL ON data_access_logs TO authenticated;
GRANT ALL ON performance_logs TO authenticated;
GRANT ALL ON audit_configurations TO authenticated;

-- Inserir configuração padrão de auditoria para igrejas existentes
INSERT INTO audit_configurations (
  church_id,
  created_by
)
SELECT 
  c.id,
  p.id
FROM churches c
INNER JOIN profiles p ON p.church_id = c.id AND p.role = 'pastor'
WHERE NOT EXISTS (
  SELECT 1 FROM audit_configurations ac 
  WHERE ac.church_id = c.id
);

-- Comentários nas tabelas
COMMENT ON TABLE audit_logs IS 'Log completo de todas as ações realizadas no sistema';
COMMENT ON TABLE authentication_logs IS 'Log específico de eventos de autenticação';
COMMENT ON TABLE security_logs IS 'Log de eventos de segurança e atividades suspeitas';
COMMENT ON TABLE data_access_logs IS 'Log de acesso a dados sensíveis';
COMMENT ON TABLE performance_logs IS 'Log de performance e métricas do sistema';
COMMENT ON TABLE audit_configurations IS 'Configurações de auditoria por igreja';