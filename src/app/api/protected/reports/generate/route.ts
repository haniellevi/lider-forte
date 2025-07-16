import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ReportGenerationRequest, ReportGenerationResponse } from '@/types/reports';
import { z } from 'zod';

// Schema para geração de relatórios
const generateReportSchema = z.object({
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ]),
  filters: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    cell_ids: z.array(z.string().uuid()).optional(),
    leader_ids: z.array(z.string().uuid()).optional(),
    metric_types: z.array(z.enum([
      'member_count',
      'cell_count', 
      'conversion_rate',
      'attendance_rate',
      'growth_rate',
      'retention_rate',
      'engagement_score',
      'leadership_ratio'
    ])).optional(),
    period_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  }),
  format: z.enum(['json', 'pdf', 'excel']).optional().default('json'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { report_type, filters, format } = generateReportSchema.parse(body);

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Gerar relatório baseado no tipo
    let reportData: Record<string, any> = {};

    switch (report_type) {
      case 'church_overview':
        reportData = await generateChurchOverview(supabase, profile.church_id, filters);
        break;
      
      case 'cell_performance':
        reportData = await generateCellPerformance(supabase, profile.church_id, filters);
        break;
      
      case 'member_growth':
        reportData = await generateMemberGrowth(supabase, profile.church_id, filters);
        break;
      
      case 'leadership_development':
        reportData = await generateLeadershipDevelopment(supabase, profile.church_id, filters);
        break;
      
      default:
        return NextResponse.json({ 
          error: `Tipo de relatório '${report_type}' ainda não implementado` 
        }, { status: 400 });
    }

    const response: ReportGenerationResponse = {
      id: `report_${Date.now()}`,
      data: reportData,
      generated_at: new Date().toISOString(),
      filters_applied: filters,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na geração de relatório:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para gerar relatório de visão geral da igreja
async function generateChurchOverview(supabase: any, churchId: string, filters: any) {
  const data: Record<string, any> = {};

  // Estatísticas gerais
  const { data: stats } = await supabase
    .from('church_stats')
    .select('*')
    .eq('church_id', churchId)
    .single();

  data.general_stats = stats;

  // Métricas por período
  let metricsQuery = supabase
    .from('metrics')
    .select('*')
    .eq('church_id', churchId);

  if (filters.start_date) {
    metricsQuery = metricsQuery.gte('period_start', filters.start_date);
  }
  if (filters.end_date) {
    metricsQuery = metricsQuery.lte('period_end', filters.end_date);
  }
  if (filters.period_type) {
    metricsQuery = metricsQuery.eq('period_type', filters.period_type);
  }

  const { data: metrics } = await metricsQuery
    .order('period_start', { ascending: false })
    .limit(100);

  data.metrics_history = metrics;

  // Eventos recentes
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false })
    .limit(50);

  data.recent_events = events;

  return data;
}

// Função para gerar relatório de performance de células
async function generateCellPerformance(supabase: any, churchId: string, filters: any) {
  const data: Record<string, any> = {};

  // Performance de todas as células
  let cellsQuery = supabase
    .from('cell_performance')
    .select('*')
    .eq('church_id', churchId);

  if (filters.cell_ids && filters.cell_ids.length > 0) {
    cellsQuery = cellsQuery.in('cell_id', filters.cell_ids);
  }

  const { data: cellsPerformance } = await cellsQuery
    .order('member_count', { ascending: false });

  data.cells_performance = cellsPerformance;

  // Ranking de células por membros
  data.top_cells_by_members = cellsPerformance?.slice(0, 10) || [];

  // Células com mais crescimento recente
  data.fastest_growing_cells = cellsPerformance?.filter((cell: any) => 
    cell.new_members_30d > 0
  ).sort((a: any, b: any) => b.new_members_30d - a.new_members_30d).slice(0, 10) || [];

  // Estatísticas de liderança
  const leaderStats = cellsPerformance?.reduce((acc: any, cell: any) => {
    if (!acc[cell.leader_role]) {
      acc[cell.leader_role] = { count: 0, total_members: 0 };
    }
    acc[cell.leader_role].count++;
    acc[cell.leader_role].total_members += cell.member_count;
    return acc;
  }, {} as Record<string, any>);

  data.leadership_stats = leaderStats;

  return data;
}

// Função para gerar relatório de crescimento de membros
async function generateMemberGrowth(supabase: any, churchId: string, filters: any) {
  const data: Record<string, any> = {};

  // Métricas de crescimento
  let growthQuery = supabase
    .from('metrics')
    .select('*')
    .eq('church_id', churchId)
    .in('metric_type', ['member_count', 'growth_rate']);

  if (filters.start_date) {
    growthQuery = growthQuery.gte('period_start', filters.start_date);
  }
  if (filters.end_date) {
    growthQuery = growthQuery.lte('period_end', filters.end_date);
  }

  const { data: growthMetrics } = await growthQuery
    .order('period_start', { ascending: true });

  data.growth_metrics = growthMetrics;

  // Novos membros por período
  const { data: newMembers } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .eq('event_type', 'member_created')
    .gte('created_at', filters.start_date || '2024-01-01')
    .order('created_at', { ascending: true });

  data.new_members_timeline = newMembers;

  // Crescimento por célula
  const { data: cellGrowth } = await supabase
    .from('cell_performance')
    .select('cell_id, cell_name, new_members_30d, member_count')
    .eq('church_id', churchId)
    .order('new_members_30d', { ascending: false });

  data.growth_by_cell = cellGrowth;

  return data;
}

// Função para gerar relatório de desenvolvimento de liderança
async function generateLeadershipDevelopment(supabase: any, churchId: string, filters: any) {
  const data: Record<string, any> = {};

  // Estatísticas de liderança
  const { data: leadershipStats } = await supabase
    .from('profiles')
    .select('role')
    .eq('church_id', churchId);

  const roleDistribution = leadershipStats?.reduce((acc: any, profile: any) => {
    acc[profile.role] = (acc[profile.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  data.role_distribution = roleDistribution;

  // Desenvolvimento de Timóteos
  const { data: timoteoStats } = await supabase
    .from('cell_members')
    .select(`
      *,
      cell:cells(name, church_id)
    `)
    .eq('is_timoteo', true)
    .eq('cell.church_id', churchId);

  data.timoteo_development = {
    total_timoteos: timoteoStats?.length || 0,
    avg_success_score: timoteoStats?.reduce((sum: any, member: any) => 
      sum + (member.success_ladder_score || 0), 0
    ) / (timoteoStats?.length || 1),
    timoteos_by_cell: timoteoStats?.reduce((acc: any, member: any) => {
      const cellName = member.cell?.name || 'Célula sem nome';
      acc[cellName] = (acc[cellName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Eventos de mudança de papel
  const { data: roleChanges } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .eq('event_type', 'member_role_changed')
    .order('created_at', { ascending: false })
    .limit(100);

  data.recent_role_changes = roleChanges;

  return data;
}