-- Criação do sistema de backup e recuperação
-- Esta migração cria as tabelas e funções necessárias para o sistema de backup

-- Tabela para armazenar configurações de backup
CREATE TABLE IF NOT EXISTS backup_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'manual')),
  backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  include_tables TEXT[] NOT NULL DEFAULT ARRAY['*'], -- ['*'] significa todas as tabelas
  exclude_tables TEXT[] DEFAULT ARRAY[]::TEXT[],
  retention_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_backup_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para registrar backups realizados
CREATE TABLE IF NOT EXISTS backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  configuration_id UUID REFERENCES backup_configurations(id) ON DELETE SET NULL,
  backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential', 'manual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  file_path TEXT,
  file_size_bytes BIGINT,
  compressed_size_bytes BIGINT,
  checksum VARCHAR(64),
  tables_included TEXT[] NOT NULL,
  records_count JSONB, -- { "table_name": count, ... }
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela para logs de backup e recovery
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  backup_record_id UUID REFERENCES backup_records(id) ON DELETE CASCADE,
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('backup', 'restore', 'verify', 'cleanup')),
  level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para operações de restore
CREATE TABLE IF NOT EXISTS restore_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  backup_record_id UUID NOT NULL REFERENCES backup_records(id),
  restore_type VARCHAR(20) NOT NULL CHECK (restore_type IN ('full', 'partial', 'table_specific')),
  target_tables TEXT[], -- NULL significa todas as tabelas do backup
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0,
  records_restored JSONB, -- { "table_name": count, ... }
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_configurations_church_id ON backup_configurations(church_id);
CREATE INDEX IF NOT EXISTS idx_backup_configurations_active ON backup_configurations(church_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_backup_configurations_next_backup ON backup_configurations(next_backup_at) WHERE is_active = true AND next_backup_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_backup_records_church_id ON backup_records(church_id);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(church_id, status);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_expires_at ON backup_records(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_backup_logs_church_id ON backup_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_record ON backup_logs(backup_record_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_operation_type ON backup_logs(church_id, operation_type);

CREATE INDEX IF NOT EXISTS idx_restore_operations_church_id ON restore_operations(church_id);
CREATE INDEX IF NOT EXISTS idx_restore_operations_status ON restore_operations(church_id, status);
CREATE INDEX IF NOT EXISTS idx_restore_operations_backup_record ON restore_operations(backup_record_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_backup_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backup_configurations_updated_at
  BEFORE UPDATE ON backup_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_configurations_updated_at();

-- Função para calcular próximo backup
CREATE OR REPLACE FUNCTION calculate_next_backup_time(
  frequency_param TEXT,
  base_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE frequency_param
    WHEN 'daily' THEN
      RETURN base_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN base_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN base_time + INTERVAL '1 month';
    ELSE
      RETURN NULL; -- manual backups don't have next_backup_at
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para criar um backup record
CREATE OR REPLACE FUNCTION create_backup_record(
  p_church_id UUID,
  p_configuration_id UUID,
  p_backup_type TEXT,
  p_tables_included TEXT[],
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_retention_days INTEGER;
BEGIN
  -- Buscar retention_days da configuração
  SELECT retention_days INTO v_retention_days
  FROM backup_configurations
  WHERE id = p_configuration_id AND church_id = p_church_id;
  
  IF NOT FOUND THEN
    v_retention_days := 30; -- default
  END IF;
  
  v_expires_at := NOW() + (v_retention_days || ' days')::INTERVAL;
  
  INSERT INTO backup_records (
    church_id,
    configuration_id,
    backup_type,
    status,
    tables_included,
    expires_at,
    created_by
  ) VALUES (
    p_church_id,
    p_configuration_id,
    p_backup_type,
    'pending',
    p_tables_included,
    v_expires_at,
    p_created_by
  ) RETURNING id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- Função para logging de backup
CREATE OR REPLACE FUNCTION log_backup_operation(
  p_church_id UUID,
  p_backup_record_id UUID,
  p_operation_type TEXT,
  p_level TEXT,
  p_message TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO backup_logs (
    church_id,
    backup_record_id,
    operation_type,
    level,
    message,
    details
  ) VALUES (
    p_church_id,
    p_backup_record_id,
    p_operation_type,
    p_level,
    p_message,
    p_details
  );
END;
$$ LANGUAGE plpgsql;

-- Função para limpar backups expirados
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_backup_record RECORD;
BEGIN
  -- Buscar backups expirados
  FOR v_backup_record IN
    SELECT id, church_id, file_path
    FROM backup_records
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW()
      AND status = 'completed'
  LOOP
    -- Log da operação de limpeza
    PERFORM log_backup_operation(
      v_backup_record.church_id,
      v_backup_record.id,
      'cleanup',
      'info',
      'Backup expirado removido automaticamente',
      jsonb_build_object('file_path', v_backup_record.file_path)
    );
    
    -- Marcar backup como removido
    UPDATE backup_records
    SET status = 'expired'
    WHERE id = v_backup_record.id;
    
    v_deleted_count := v_deleted_count + 1;
  END LOOP;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar próximo backup
CREATE OR REPLACE FUNCTION update_next_backup_schedule()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_config RECORD;
BEGIN
  FOR v_config IN
    SELECT id, frequency
    FROM backup_configurations
    WHERE is_active = true
      AND frequency != 'manual'
      AND (next_backup_at IS NULL OR next_backup_at <= NOW())
  LOOP
    UPDATE backup_configurations
    SET next_backup_at = calculate_next_backup_time(v_config.frequency)
    WHERE id = v_config.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de backup
CREATE OR REPLACE FUNCTION get_backup_statistics(p_church_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_backups', COUNT(*),
    'successful_backups', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_backups', COUNT(*) FILTER (WHERE status = 'failed'),
    'pending_backups', COUNT(*) FILTER (WHERE status IN ('pending', 'running')),
    'total_size_bytes', COALESCE(SUM(file_size_bytes) FILTER (WHERE status = 'completed'), 0),
    'compressed_size_bytes', COALESCE(SUM(compressed_size_bytes) FILTER (WHERE status = 'completed'), 0),
    'last_successful_backup', MAX(completed_at) FILTER (WHERE status = 'completed'),
    'oldest_backup', MIN(started_at) FILTER (WHERE status = 'completed'),
    'average_backup_size', COALESCE(AVG(file_size_bytes) FILTER (WHERE status = 'completed'), 0)
  )
  INTO v_stats
  FROM backup_records
  WHERE church_id = p_church_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE backup_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_operations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para backup_configurations
CREATE POLICY "backup_configurations_church_isolation" ON backup_configurations
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para backup_records
CREATE POLICY "backup_records_church_isolation" ON backup_records
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para backup_logs
CREATE POLICY "backup_logs_church_isolation" ON backup_logs
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para restore_operations
CREATE POLICY "restore_operations_church_isolation" ON restore_operations
  USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON backup_configurations TO authenticated;
GRANT ALL ON backup_records TO authenticated;
GRANT ALL ON backup_logs TO authenticated;
GRANT ALL ON restore_operations TO authenticated;

-- Inserir configuração padrão de backup para igrejas existentes
INSERT INTO backup_configurations (
  church_id,
  name,
  description,
  frequency,
  backup_type,
  retention_days,
  created_by,
  next_backup_at
)
SELECT 
  c.id,
  'Backup Diário Automático',
  'Backup completo diário automático de todos os dados da igreja',
  'daily',
  'full',
  30,
  p.id,
  calculate_next_backup_time('daily')
FROM churches c
INNER JOIN profiles p ON p.church_id = c.id AND p.role = 'pastor'
WHERE NOT EXISTS (
  SELECT 1 FROM backup_configurations bc 
  WHERE bc.church_id = c.id
);

-- Comentários nas tabelas
COMMENT ON TABLE backup_configurations IS 'Configurações de backup automático por igreja';
COMMENT ON TABLE backup_records IS 'Registro de todos os backups realizados';
COMMENT ON TABLE backup_logs IS 'Logs detalhados das operações de backup e restore';
COMMENT ON TABLE restore_operations IS 'Operações de restauração de dados';

COMMENT ON COLUMN backup_configurations.include_tables IS 'Tabelas a incluir no backup. ["*"] = todas as tabelas';
COMMENT ON COLUMN backup_configurations.exclude_tables IS 'Tabelas a excluir do backup';
COMMENT ON COLUMN backup_records.records_count IS 'Contagem de registros por tabela no backup';
COMMENT ON COLUMN backup_records.checksum IS 'Checksum MD5 do arquivo de backup para verificação de integridade';