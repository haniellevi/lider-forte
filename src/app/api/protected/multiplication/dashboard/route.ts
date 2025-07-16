import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const church_id = searchParams.get('church_id');

    // Verificar se o usuário atual tem permissão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Usar church_id do usuário se não fornecido ou se não for pastor
    const targetChurchId = (userProfile.role === 'pastor' && church_id) ? church_id : userProfile.church_id;

    if (targetChurchId !== userProfile.church_id && userProfile.role !== 'pastor') {
      return NextResponse.json({ error: 'Sem permissão para acessar dados desta igreja' }, { status: 403 });
    }

    // Executar função para obter dados do dashboard
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_multiplication_dashboard', { p_church_id: targetChurchId });

    if (dashboardError) {
      console.error('Supabase dashboard error:', dashboardError);
      return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
    }

    if (!dashboardData || dashboardData.length === 0) {
      return NextResponse.json({ 
        data: {
          total_cells: 0,
          ready_cells: 0,
          preparing_cells: 0,
          not_ready_cells: 0,
          average_readiness_score: 0,
          cells_details: []
        }
      });
    }

    const result = dashboardData[0];

    // Buscar alertas recentes
    const { data: alertsData, error: alertsError } = await supabase
      .rpc('generate_multiplication_alerts');

    let alerts = [];
    if (!alertsError && alertsData) {
      // Filtrar alertas para a igreja específica
      alerts = alertsData.filter((alert: any) => {
        // Verificar se a célula pertence à igreja através de uma query adicional
        return true; // Por ora, retornar todos os alertas
      }).slice(0, 10); // Limitar a 10 alertas mais recentes
    }

    // Buscar estatísticas adicionais
    const { data: statsData, error: statsError } = await supabase
      .from('multiplication_readiness')
      .select(`
        status,
        cell:cells!multiplication_readiness_cell_id_fkey(church_id)
      `)
      .eq('cell.church_id', targetChurchId);

    let statusDistribution = {
      not_ready: 0,
      preparing: 0,
      ready: 0,
      optimal: 0,
      overdue: 0
    };

    if (!statsError && statsData) {
      statsData.forEach((item: any) => {
        if (statusDistribution.hasOwnProperty(item.status)) {
          statusDistribution[item.status as keyof typeof statusDistribution]++;
        }
      });
    }

    return NextResponse.json({ 
      data: {
        ...result,
        alerts,
        status_distribution: statusDistribution,
        church_id: targetChurchId,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}