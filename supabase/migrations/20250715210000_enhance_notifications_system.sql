-- Aprimoramento do Sistema de Notificações
-- Semana 11-12: Funcionalidades Avançadas e Polimento

-- 1. ATUALIZAÇÕES NA TABELA DE NOTIFICAÇÕES
-- Adicionar campos específicos para o contexto de igreja
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS entity_type TEXT, -- 'cell', 'member', 'report', 'meeting', etc
ADD COLUMN IF NOT EXISTS entity_id uuid,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_method TEXT[] DEFAULT ARRAY['in_app'] CHECK (delivery_method <@ ARRAY['in_app', 'email', 'sms', 'push']);

-- 2. CRIAR TABELA DE TEMPLATES DE NOTIFICAÇÃO
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- Código único para identificar o template
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  delivery_method TEXT[] DEFAULT ARRAY['in_app'],
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '{}', -- Variáveis disponíveis no template
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id, code)
);

-- 3. CRIAR TABELA DE PREFERÊNCIAS DE NOTIFICAÇÃO
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  delivery_method TEXT[] DEFAULT ARRAY['in_app'],
  is_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, church_id, notification_type)
);

-- 4. CRIAR TABELA DE COMUNICAÇÕES EM MASSA
CREATE TABLE IF NOT EXISTS public.mass_communications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'role', 'cell', 'custom')),
  target_criteria JSONB DEFAULT '{}',
  delivery_method TEXT[] DEFAULT ARRAY['in_app'],
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAR TABELA DE LOG DE ENTREGAS
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  mass_communication_id uuid REFERENCES public.mass_communications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notifications_church_id ON public.notifications(church_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON public.notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_templates_church_code ON public.notification_templates(church_id, code);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_church ON public.notification_preferences(user_id, church_id);
CREATE INDEX IF NOT EXISTS idx_mass_communications_church_status ON public.mass_communications(church_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);

-- 7. TRIGGERS E FUNÇÕES UTILITÁRIAS

-- Função para criar notificação a partir de template
CREATE OR REPLACE FUNCTION public.create_notification_from_template(
  template_code TEXT,
  recipient_user_id TEXT,
  template_variables JSONB DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  template_record notification_templates%ROWTYPE;
  notification_id uuid;
  final_title TEXT;
  final_message TEXT;
  variable_key TEXT;
  variable_value TEXT;
BEGIN
  -- Buscar template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE code = template_code AND is_active = true 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template não encontrado: %', template_code;
  END IF;
  
  -- Processar variáveis no título e mensagem
  final_title := template_record.title_template;
  final_message := template_record.message_template;
  
  -- Substituir variáveis
  FOR variable_key, variable_value IN SELECT * FROM jsonb_each_text(template_variables) LOOP
    final_title := REPLACE(final_title, '{{' || variable_key || '}}', variable_value);
    final_message := REPLACE(final_message, '{{' || variable_key || '}}', variable_value);
  END LOOP;
  
  -- Criar notificação
  INSERT INTO notifications (
    user_id, 
    church_id, 
    title, 
    message, 
    type, 
    priority, 
    delivery_method,
    metadata
  ) VALUES (
    recipient_user_id,
    template_record.church_id,
    final_title,
    final_message,
    template_record.type,
    template_record.priority,
    template_record.delivery_method,
    jsonb_build_object('template_code', template_code, 'variables', template_variables)
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para enviar comunicação em massa
CREATE OR REPLACE FUNCTION public.send_mass_communication(
  communication_id uuid
) RETURNS void AS $$
DECLARE
  comm_record mass_communications%ROWTYPE;
  recipient_record RECORD;
  notification_id uuid;
  recipient_count INTEGER := 0;
BEGIN
  -- Buscar comunicação
  SELECT * INTO comm_record FROM mass_communications WHERE id = communication_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comunicação não encontrada: %', communication_id;
  END IF;
  
  -- Verificar se pode ser enviada
  IF comm_record.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Comunicação não pode ser enviada. Status atual: %', comm_record.status;
  END IF;
  
  -- Atualizar status para 'sending'
  UPDATE mass_communications SET status = 'sending', sent_at = NOW() WHERE id = communication_id;
  
  -- Determinar destinatários baseado no target_type
  FOR recipient_record IN
    SELECT DISTINCT p.id as user_id
    FROM profiles p
    WHERE p.church_id = comm_record.church_id
    AND (
      comm_record.target_type = 'all' OR
      (comm_record.target_type = 'role' AND p.role = (comm_record.target_criteria->>'role')) OR
      (comm_record.target_type = 'cell' AND EXISTS (
        SELECT 1 FROM cell_members cm 
        WHERE cm.profile_id = p.id 
        AND cm.cell_id = (comm_record.target_criteria->>'cell_id')::uuid
      ))
    )
  LOOP
    -- Criar notificação para cada destinatário
    INSERT INTO notifications (
      user_id,
      church_id,
      title,
      message,
      type,
      delivery_method,
      sender_id,
      metadata
    ) VALUES (
      recipient_record.user_id,
      comm_record.church_id,
      comm_record.title,
      comm_record.message,
      'message',
      comm_record.delivery_method,
      comm_record.sender_id,
      jsonb_build_object('mass_communication_id', communication_id)
    );
    
    recipient_count := recipient_count + 1;
  END LOOP;
  
  -- Atualizar contadores e status
  UPDATE mass_communications 
  SET 
    status = 'sent',
    total_recipients = recipient_count,
    sent_count = recipient_count
  WHERE id = communication_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TEMPLATES PADRÃO PARA IGREJAS
INSERT INTO notification_templates (church_id, name, code, title_template, message_template, type, priority, delivery_method, variables) VALUES
(NULL, 'Novo Membro na Célula', 'new_cell_member', 'Novo membro adicionado', '{{member_name}} foi adicionado à célula {{cell_name}}.', 'info', 'normal', ARRAY['in_app'], '{"member_name": "Nome do membro", "cell_name": "Nome da célula"}'),
(NULL, 'Reunião de Célula Agendada', 'cell_meeting_scheduled', 'Reunião agendada', 'Reunião da célula {{cell_name}} agendada para {{meeting_date}} às {{meeting_time}}.', 'reminder', 'normal', ARRAY['in_app'], '{"cell_name": "Nome da célula", "meeting_date": "Data da reunião", "meeting_time": "Horário da reunião"}'),
(NULL, 'Novo Líder de Célula', 'new_cell_leader', 'Novo líder designado', '{{leader_name}} foi designado como líder da célula {{cell_name}}.', 'info', 'high', ARRAY['in_app'], '{"leader_name": "Nome do líder", "cell_name": "Nome da célula"}'),
(NULL, 'Relatório Gerado', 'report_generated', 'Relatório disponível', 'O relatório {{report_name}} foi gerado e está disponível para visualização.', 'info', 'normal', ARRAY['in_app'], '{"report_name": "Nome do relatório"}'),
(NULL, 'Meta de Crescimento Atingida', 'growth_goal_achieved', 'Meta atingida!', 'Parabéns! A célula {{cell_name}} atingiu {{members_count}} membros.', 'success', 'high', ARRAY['in_app'], '{"cell_name": "Nome da célula", "members_count": "Número de membros"}');

-- 9. RLS POLICIES PARA NOVAS TABELAS

-- Notification Templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their church" ON public.notification_templates
  FOR SELECT USING (
    church_id IS NULL OR 
    church_id IN (SELECT church_id FROM profiles WHERE id = (auth.jwt() ->> 'sub')::uuid)
  );

CREATE POLICY "Pastors can manage templates" ON public.notification_templates
  FOR ALL USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = (auth.jwt() ->> 'sub')::uuid AND role = 'pastor'
    )
  );

-- Notification Preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- Mass Communications
ALTER TABLE public.mass_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communications from their church" ON public.mass_communications
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = (auth.jwt() ->> 'sub')::uuid)
  );

CREATE POLICY "Pastors and supervisors can manage communications" ON public.mass_communications
  FOR ALL USING (
    church_id IN (
      SELECT church_id FROM profiles 
      WHERE id = (auth.jwt() ->> 'sub')::uuid AND role IN ('pastor', 'supervisor')
    )
  );

-- Notification Deliveries
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries" ON public.notification_deliveries
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- 10. ATUALIZAR RLS DA TABELA NOTIFICATIONS ORIGINAL
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- 11. GRANTS
GRANT ALL ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.mass_communications TO authenticated;
GRANT ALL ON public.notification_deliveries TO authenticated;

-- 12. COMENTÁRIOS
COMMENT ON TABLE public.notification_templates IS 'Templates para notificações automáticas';
COMMENT ON TABLE public.notification_preferences IS 'Preferências de notificação dos usuários';
COMMENT ON TABLE public.mass_communications IS 'Comunicações em massa para grupos específicos';
COMMENT ON TABLE public.notification_deliveries IS 'Log de entregas de notificações';
COMMENT ON FUNCTION public.create_notification_from_template IS 'Cria notificação baseada em template';
COMMENT ON FUNCTION public.send_mass_communication IS 'Envia comunicação em massa para destinatários';