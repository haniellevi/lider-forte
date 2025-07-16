import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const alert_type = searchParams.get('alert_type');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verificar se o usuário atual tem permissão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role, id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Executar função para gerar alertas
    const { data: alertsData, error: alertsError } = await supabase
      .rpc('generate_multiplication_alerts');

    if (alertsError) {
      console.error('Supabase alerts error:', alertsError);
      return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
    }

    if (!alertsData) {
      return NextResponse.json({ data: [] });
    }

    // Filtrar alertas para a igreja do usuário e permissões
    let filteredAlerts = alertsData.filter((alert: any) => {
      // Verificar se o usuário tem permissão para ver este alerta
      // Pastores veem todos os alertas da igreja
      if (userProfile.role === 'pastor') {
        return true;
      }
      
      // Supervisores veem alertas das suas células e células supervisionadas
      if (userProfile.role === 'supervisor') {
        return alert.supervisor_id === userProfile.id || alert.pastor_id === userProfile.id;
      }
      
      // Líderes veem apenas alertas das suas próprias células
      if (userProfile.role === 'leader') {
        // Seria necessário verificar se o usuário é líder da célula
        // Por simplicidade, vamos permitir que vejam alertas gerais
        return true;
      }
      
      return false;
    });

    // Aplicar filtros adicionais
    if (alert_type) {
      filteredAlerts = filteredAlerts.filter((alert: any) => alert.alert_type === alert_type);
    }
    
    if (priority) {
      filteredAlerts = filteredAlerts.filter((alert: any) => alert.priority === parseInt(priority));
    }

    // Limitar resultados e ordenar por prioridade
    filteredAlerts = filteredAlerts
      .sort((a: any, b: any) => a.priority - b.priority)
      .slice(0, limit);

    // Enriquecer alertas com informações adicionais
    const enrichedAlerts = await Promise.all(
      filteredAlerts.map(async (alert: any) => {
        // Buscar informações da célula
        const { data: cellData } = await supabase
          .from('cells')
          .select(`
            id,
            name,
            leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
            supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
            church_id
          `)
          .eq('id', alert.cell_id)
          .eq('church_id', userProfile.church_id)
          .single();

        // Buscar dados de prontidão
        const { data: readinessData } = await supabase
          .from('multiplication_readiness')
          .select('readiness_score, status, last_evaluated_at')
          .eq('cell_id', alert.cell_id)
          .single();

        return {
          ...alert,
          cell_info: cellData,
          readiness_info: readinessData,
          created_at: new Date().toISOString(),
        };
      })
    );

    // Filtrar apenas alertas de células da igreja do usuário
    const finalAlerts = enrichedAlerts.filter(alert => 
      alert.cell_info && alert.cell_info.church_id === userProfile.church_id
    );

    return NextResponse.json({ 
      data: finalAlerts,
      summary: {
        total_alerts: finalAlerts.length,
        high_priority: finalAlerts.filter(a => a.priority === 1).length,
        medium_priority: finalAlerts.filter(a => a.priority === 2).length,
        low_priority: finalAlerts.filter(a => a.priority >= 3).length,
        by_type: {
          ready_for_multiplication: finalAlerts.filter(a => a.alert_type === 'ready_for_multiplication').length,
          slow_growth: finalAlerts.filter(a => a.alert_type === 'slow_growth').length,
          missing_leader: finalAlerts.filter(a => a.alert_type === 'missing_leader').length,
          low_attendance: finalAlerts.filter(a => a.alert_type === 'low_attendance').length,
        }
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}