import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardMetrics } from '@/types/reports';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Buscar estatísticas gerais da igreja
    const { data: churchStats, error: statsError } = await supabase
      .from('church_stats')
      .select('*')
      .eq('church_id', profile.church_id)
      .single();

    if (statsError) {
      console.error('Erro ao buscar estatísticas da igreja:', statsError);
    }

    // Buscar métricas recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentMetrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('church_id', profile.church_id)
      .gte('period_start', thirtyDaysAgo.toISOString())
      .order('period_start', { ascending: false })
      .limit(50);

    if (metricsError) {
      console.error('Erro ao buscar métricas recentes:', metricsError);
    }

    // Buscar células com melhor performance
    const { data: topCells, error: cellsError } = await supabase
      .from('cell_performance')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('member_count', { ascending: false })
      .limit(10);

    if (cellsError) {
      console.error('Erro ao buscar células top:', cellsError);
    }

    // Buscar eventos recentes
    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error('Erro ao buscar eventos recentes:', eventsError);
    }

    // Processar tendências de crescimento
    const growthTrends = [];
    
    if (recentMetrics) {
      // Agrupar métricas por tipo
      const metricsByType = recentMetrics.reduce((acc, metric) => {
        if (!acc[metric.metric_type]) {
          acc[metric.metric_type] = [];
        }
        acc[metric.metric_type].push(metric);
        return acc;
      }, {} as Record<string, any[]>);

      // Criar tendências para cada tipo de métrica
      Object.entries(metricsByType).forEach(([metricType, metrics]) => {
        const sortedMetrics = metrics.sort((a, b) => 
          new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
        );

        growthTrends.push({
          metric_type: metricType,
          periods: sortedMetrics.map(metric => ({
            period: metric.period_start.split('T')[0], // Data sem horário
            value: Number(metric.value),
          })),
        });
      });
    }

    const dashboardData: DashboardMetrics = {
      church_stats: churchStats || {
        church_id: profile.church_id,
        church_name: 'Igreja',
        total_members: 0,
        total_cells: 0,
        total_leaders: 0,
        total_supervisors: 0,
        new_members_30d: 0,
        new_cells_30d: 0,
        avg_members_per_cell: 0,
        church_created_at: new Date().toISOString(),
      },
      recent_metrics: recentMetrics || [],
      top_performing_cells: topCells || [],
      growth_trends: growthTrends,
      recent_events: recentEvents || [],
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}