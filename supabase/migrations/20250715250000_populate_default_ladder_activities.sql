-- Supabase Migration: Popular Atividades Padrão da Escada do Sucesso
-- Plataforma de Gestão G12 - Sistema de Gamificação
-- Version: 1.0
-- Date: 15 de Julho de 2025
-- This script populates default Success Ladder activities for all churches

-- Function to populate default activities for a church
CREATE OR REPLACE FUNCTION public.populate_default_ladder_activities(target_church_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert default Success Ladder activities
  INSERT INTO public.success_ladder_activities (name, points, category, description, church_id) VALUES
  
  -- ATTENDANCE ACTIVITIES
  ('Presença em Célula', 10, 'attendance', 'Participação em reunião de célula semanal'),
  ('Presença no Culto Domingo', 15, 'attendance', 'Participação no culto de domingo'),
  ('Presença na EBD', 10, 'attendance', 'Participação na Escola Bíblica Dominical'),
  ('Presença em Reunião de Oração', 12, 'attendance', 'Participação em reunião de oração'),
  
  -- EVENTS ACTIVITIES  
  ('Participação no Encontro', 100, 'events', 'Participação no evento Encontro - marco fundamental'),
  ('Participação no Reencontro', 150, 'events', 'Participação no evento Reencontro'),
  ('Participação na Escola de Líderes', 200, 'events', 'Participação na Escola de Líderes'),
  ('Participação no Seminário de Cura Interior', 120, 'events', 'Participação no seminário de cura interior e libertação'),
  ('Participação em Retiro Espiritual', 80, 'events', 'Participação em retiros e acampamentos'),
  ('Participação em Evento Evangelístico', 60, 'events', 'Participação em eventos de evangelização'),
  
  -- COURSES ACTIVITIES
  ('Módulo Universidade da Vida - Básico', 50, 'courses', 'Conclusão de módulo básico da Universidade da Vida'),
  ('Módulo Universidade da Vida - Intermediário', 75, 'courses', 'Conclusão de módulo intermediário da Universidade da Vida'),
  ('Módulo Universidade da Vida - Avançado', 100, 'courses', 'Conclusão de módulo avançado da Universidade da Vida'),
  ('Capacitação Destino', 200, 'courses', 'Participação na capacitação Destino - formação de líderes'),
  ('Curso de Consolidação', 80, 'courses', 'Participação no curso de consolidação de novos convertidos'),
  ('Seminário de Dons Espirituais', 60, 'courses', 'Participação no seminário sobre dons espirituais'),
  ('Curso de Discipulado', 120, 'courses', 'Participação no curso de discipulado cristão'),
  
  -- SERVICE ACTIVITIES
  ('Serviço na Recepção', 25, 'service', 'Participação no ministério de recepção'),
  ('Serviço no Louvor', 30, 'service', 'Participação no ministério de louvor e adoração'),
  ('Serviço na Intercessão', 25, 'service', 'Participação no ministério de intercessão'),
  ('Serviço de Diaconia', 25, 'service', 'Participação em serviços diaconais'),
  ('Serviço de Ensino', 40, 'service', 'Participação no ministério de ensino'),
  ('Serviço de Evangelização', 35, 'service', 'Participação em atividades evangelísticas'),
  ('Serviço em Eventos', 20, 'service', 'Participação na organização e execução de eventos'),
  ('Mentoria de Novo Convertido', 50, 'service', 'Mentoria e acompanhamento de novo convertido'),
  ('Liderança de Célula', 100, 'service', 'Atuação como líder de célula'),
  ('Coordenação de Ministério', 75, 'service', 'Coordenação de ministério específico'),
  
  -- CONSISTENCY ACTIVITIES (Automatic bonuses)
  ('Consistência Mensal', 50, 'consistency', 'Bônus por presença superior a 80% no mês'),
  ('Consistência Trimestral', 150, 'consistency', 'Bônus por presença superior a 85% no trimestre'),
  ('Consistência Semestral', 300, 'consistency', 'Bônus por presença superior a 90% no semestre'),
  ('Consistência Anual', 500, 'consistency', 'Bônus por presença superior a 95% no ano'),
  ('Pontualidade Mensal', 25, 'consistency', 'Bônus por pontualidade nas reuniões durante o mês'),
  ('Participação Integral', 40, 'consistency', 'Bônus por participação integral em eventos (início ao fim)')

  ON CONFLICT DO NOTHING; -- Avoid duplicates if already populated
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically populate activities for new churches
CREATE OR REPLACE FUNCTION public.auto_populate_activities_for_new_church()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate default activities for the new church
  PERFORM public.populate_default_ladder_activities(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically populate activities when a new church is created
CREATE TRIGGER trigger_auto_populate_activities
  AFTER INSERT ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_activities_for_new_church();

-- Populate activities for existing churches (if any)
DO $$
DECLARE
  church_record RECORD;
BEGIN
  FOR church_record IN SELECT id FROM public.churches
  LOOP
    PERFORM public.populate_default_ladder_activities(church_record.id);
  END LOOP;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION public.populate_default_ladder_activities(UUID) IS 'Populates default Success Ladder activities for a specific church';
COMMENT ON FUNCTION public.auto_populate_activities_for_new_church() IS 'Automatically populates default activities when a new church is created';