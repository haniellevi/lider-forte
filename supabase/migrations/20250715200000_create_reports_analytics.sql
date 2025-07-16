-- Sistema de Relatórios e Analytics
-- Data: 15 de Julho de 2025
-- Semana 9-10: Sistema de Relatórios e Analytics

-- 1. ENUMS PARA TIPOS DE RELATÓRIOS
create type public.report_type as enum (
  'church_overview',
  'cell_performance', 
  'member_growth',
  'leadership_development',
  'financial_summary',
  'attendance_tracking',
  'event_statistics'
);

create type public.metric_type as enum (
  'member_count',
  'cell_count', 
  'conversion_rate',
  'attendance_rate',
  'growth_rate',
  'retention_rate',
  'engagement_score',
  'leadership_ratio'
);

create type public.period_type as enum (
  'daily',
  'weekly', 
  'monthly',
  'quarterly',
  'yearly'
);

-- 2. TABELA DE MÉTRICAS HISTÓRICAS
create table public.metrics (
  id uuid not null primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  metric_type public.metric_type not null,
  value numeric not null,
  period_type public.period_type not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index idx_metrics_church_id on public.metrics(church_id);
create index idx_metrics_type_period on public.metrics(metric_type, period_type);
create index idx_metrics_period_start on public.metrics(period_start);
create unique index idx_metrics_unique on public.metrics(church_id, metric_type, period_type, period_start);

comment on table public.metrics is 'Métricas históricas da igreja por período';

-- 3. TABELA DE RELATÓRIOS SALVOS
create table public.reports (
  id uuid not null primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  report_type public.report_type not null,
  parameters jsonb default '{}',
  data jsonb default '{}',
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  scheduled_frequency public.period_type,
  last_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index idx_reports_church_id on public.reports(church_id);
create index idx_reports_type on public.reports(report_type);
create index idx_reports_created_by on public.reports(created_by);

comment on table public.reports is 'Relatórios salvos e configurações de relatórios';

-- 4. TABELA DE EVENTOS PARA TRACKING
create table public.events (
  id uuid not null primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_type text not null,
  entity_type text not null, -- 'cell', 'member', 'meeting', etc
  entity_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  data jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Índices para performance
create index idx_events_church_id on public.events(church_id);
create index idx_events_type on public.events(event_type);
create index idx_events_entity on public.events(entity_type, entity_id);
create index idx_events_created_at on public.events(created_at);

comment on table public.events is 'Log de eventos para analytics e tracking';

-- 5. VIEWS PARA MÉTRICAS EM TEMPO REAL

-- View de estatísticas gerais da igreja
create view public.church_stats as
select 
  c.id as church_id,
  c.name as church_name,
  
  -- Contadores básicos
  (select count(*) from public.profiles p where p.church_id = c.id) as total_members,
  (select count(*) from public.cells ce where ce.church_id = c.id) as total_cells,
  (select count(*) from public.profiles p where p.church_id = c.id and p.role = 'leader') as total_leaders,
  (select count(*) from public.profiles p where p.church_id = c.id and p.role = 'supervisor') as total_supervisors,
  
  -- Crescimento no último mês
  (select count(*) from public.profiles p where p.church_id = c.id and p.created_at >= now() - interval '30 days') as new_members_30d,
  (select count(*) from public.cells ce where ce.church_id = c.id and ce.created_at >= now() - interval '30 days') as new_cells_30d,
  
  -- Células com mais membros
  (select avg(member_count) from (
    select count(*) as member_count 
    from public.cell_members cm 
    join public.cells ce on cm.cell_id = ce.id 
    where ce.church_id = c.id 
    group by cm.cell_id
  ) as cell_stats) as avg_members_per_cell,
  
  c.created_at as church_created_at
from public.churches c;

comment on view public.church_stats is 'Estatísticas gerais da igreja em tempo real';

-- View de performance de células
create view public.cell_performance as
select 
  ce.id as cell_id,
  ce.name as cell_name,
  ce.church_id,
  
  -- Contadores de membros
  (select count(*) from public.cell_members cm where cm.cell_id = ce.id) as member_count,
  (select count(*) from public.cell_members cm where cm.cell_id = ce.id and cm.created_at >= now() - interval '30 days') as new_members_30d,
  
  -- Performance do líder
  p.full_name as leader_name,
  p.role as leader_role,
  
  -- Células filhas
  (select count(*) from public.cells child where child.parent_id = ce.id) as child_cells_count,
  
  -- Score médio da escada do sucesso
  (select avg(success_ladder_score) from public.cell_members cm where cm.cell_id = ce.id) as avg_success_score,
  
  -- Contagem de Timóteos
  (select count(*) from public.cell_members cm where cm.cell_id = ce.id and cm.is_timoteo = true) as timoteo_count,
  
  ce.created_at as cell_created_at
from public.cells ce
join public.profiles p on ce.leader_id = p.id;

comment on view public.cell_performance is 'Métricas de performance das células';

-- 6. FUNCTIONS PARA CÁLCULO DE MÉTRICAS

-- Função para calcular taxa de crescimento
create or replace function public.calculate_growth_rate(
  church_id_param uuid,
  metric_type_param public.metric_type,
  period_days integer default 30
) returns numeric as $$
declare
  current_value numeric;
  previous_value numeric;
  growth_rate numeric;
begin
  -- Valor atual
  case metric_type_param
    when 'member_count' then
      select count(*) into current_value 
      from public.profiles 
      where church_id = church_id_param;
    when 'cell_count' then
      select count(*) into current_value 
      from public.cells 
      where church_id = church_id_param;
    else
      current_value := 0;
  end case;
  
  -- Valor anterior (considerando criações antes do período)
  case metric_type_param
    when 'member_count' then
      select count(*) into previous_value 
      from public.profiles 
      where church_id = church_id_param 
      and created_at <= now() - interval '1 day' * period_days;
    when 'cell_count' then
      select count(*) into previous_value 
      from public.cells 
      where church_id = church_id_param 
      and created_at <= now() - interval '1 day' * period_days;
    else
      previous_value := 0;
  end case;
  
  -- Calcular taxa de crescimento
  if previous_value > 0 then
    growth_rate := ((current_value - previous_value) / previous_value) * 100;
  else
    growth_rate := 0;
  end if;
  
  return coalesce(growth_rate, 0);
end;
$$ language plpgsql security definer;

-- Função para gerar métricas automáticas
create or replace function public.generate_daily_metrics()
returns void as $$
declare
  church_record record;
begin
  -- Para cada igreja, gerar métricas diárias
  for church_record in select id from public.churches loop
    
    -- Inserir métrica de contagem de membros
    insert into public.metrics (church_id, metric_type, value, period_type, period_start, period_end)
    values (
      church_record.id,
      'member_count',
      (select count(*) from public.profiles where church_id = church_record.id),
      'daily',
      date_trunc('day', now()),
      date_trunc('day', now()) + interval '1 day' - interval '1 second'
    ) on conflict (church_id, metric_type, period_type, period_start) do update
    set value = excluded.value, updated_at = now();
    
    -- Inserir métrica de contagem de células
    insert into public.metrics (church_id, metric_type, value, period_type, period_start, period_end)
    values (
      church_record.id,
      'cell_count',
      (select count(*) from public.cells where church_id = church_record.id),
      'daily',
      date_trunc('day', now()),
      date_trunc('day', now()) + interval '1 day' - interval '1 second'
    ) on conflict (church_id, metric_type, period_type, period_start) do update
    set value = excluded.value, updated_at = now();
    
    -- Taxa de crescimento de membros (30 dias)
    insert into public.metrics (church_id, metric_type, value, period_type, period_start, period_end)
    values (
      church_record.id,
      'growth_rate',
      public.calculate_growth_rate(church_record.id, 'member_count', 30),
      'daily',
      date_trunc('day', now()),
      date_trunc('day', now()) + interval '1 day' - interval '1 second'
    ) on conflict (church_id, metric_type, period_type, period_start) do update
    set value = excluded.value, updated_at = now();
    
  end loop;
end;
$$ language plpgsql security definer;

-- 7. TRIGGERS PARA LOGGING DE EVENTOS

-- Trigger para logar eventos de criação de membros
create or replace function public.log_member_events()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.events (church_id, event_type, entity_type, entity_id, user_id, data)
    values (
      NEW.church_id,
      'member_created',
      'profile',
      NEW.id,
      NEW.id,
      jsonb_build_object('role', NEW.role, 'full_name', NEW.full_name)
    );
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.role != NEW.role then
      insert into public.events (church_id, event_type, entity_type, entity_id, user_id, data)
      values (
        NEW.church_id,
        'member_role_changed',
        'profile',
        NEW.id,
        NEW.id,
        jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
      );
    end if;
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trigger_log_member_events
  after insert or update on public.profiles
  for each row execute function public.log_member_events();

-- Trigger para logar eventos de células
create or replace function public.log_cell_events()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.events (church_id, event_type, entity_type, entity_id, data)
    values (
      NEW.church_id,
      'cell_created',
      'cell',
      NEW.id,
      jsonb_build_object('name', NEW.name, 'leader_id', NEW.leader_id)
    );
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.leader_id != NEW.leader_id then
      insert into public.events (church_id, event_type, entity_type, entity_id, data)
      values (
        NEW.church_id,
        'cell_leader_changed',
        'cell',
        NEW.id,
        jsonb_build_object('old_leader_id', OLD.leader_id, 'new_leader_id', NEW.leader_id)
      );
    end if;
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trigger_log_cell_events
  after insert or update on public.cells
  for each row execute function public.log_cell_events();

-- 8. RLS POLICIES PARA AS NOVAS TABELAS

-- Policies para metrics
alter table public.metrics enable row level security;

create policy "Users can view metrics from their church" on public.metrics
  for select using (
    church_id in (
      select church_id from public.profiles where id = auth.uid()
    )
  );

create policy "Pastors and supervisors can manage metrics" on public.metrics
  for all using (
    church_id in (
      select church_id from public.profiles 
      where id = auth.uid() and role in ('pastor', 'supervisor')
    )
  );

-- Policies para reports
alter table public.reports enable row level security;

create policy "Users can view reports from their church" on public.reports
  for select using (
    church_id in (
      select church_id from public.profiles where id = auth.uid()
    ) and (is_public = true or created_by = auth.uid())
  );

create policy "Users can manage their own reports" on public.reports
  for all using (created_by = auth.uid());

create policy "Pastors can manage all reports in their church" on public.reports
  for all using (
    church_id in (
      select church_id from public.profiles 
      where id = auth.uid() and role = 'pastor'
    )
  );

-- Policies para events  
alter table public.events enable row level security;

create policy "Users can view events from their church" on public.events
  for select using (
    church_id in (
      select church_id from public.profiles where id = auth.uid()
    )
  );

create policy "System can insert events" on public.events
  for insert with check (true);

-- 9. GRANTS DE PERMISSÕES
grant usage on schema public to anon, authenticated;
grant all on public.metrics to authenticated;
grant all on public.reports to authenticated;  
grant all on public.events to authenticated;
grant select on public.church_stats to authenticated;
grant select on public.cell_performance to authenticated;

-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
comment on type public.report_type is 'Tipos de relatórios disponíveis no sistema';
comment on type public.metric_type is 'Tipos de métricas coletadas automaticamente';
comment on type public.period_type is 'Períodos de tempo para métricas e relatórios';
comment on function public.calculate_growth_rate is 'Calcula taxa de crescimento para métricas específicas';
comment on function public.generate_daily_metrics is 'Gera métricas diárias automaticamente';