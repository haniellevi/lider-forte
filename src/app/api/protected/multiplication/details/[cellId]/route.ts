import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cellId: string } }
) {
  try {
    const supabase = await createServerClient();
    const { cellId } = params;
    
    if (!cellId) {
      return NextResponse.json({ error: 'ID da célula é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário atual tem permissão para ver detalhes desta célula
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role, id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se a célula pertence à igreja do usuário
    const { data: cellData, error: cellError } = await supabase
      .from('cells')
      .select('church_id, leader_id, supervisor_id')
      .eq('id', cellId)
      .single();

    if (cellError || !cellData) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
    }

    if (cellData.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Sem permissão para acessar esta célula' }, { status: 403 });
    }

    // Verificar permissões específicas por role
    if (userProfile.role === 'leader' && 
        cellData.leader_id !== userProfile.id && 
        cellData.supervisor_id !== userProfile.id) {
      return NextResponse.json({ error: 'Sem permissão para ver detalhes desta célula' }, { status: 403 });
    }

    // Executar função para obter detalhes completos da célula
    const { data: detailsData, error: detailsError } = await supabase
      .rpc('get_cell_multiplication_details', { p_cell_id: cellId });

    if (detailsError) {
      console.error('Supabase details error:', detailsError);
      return NextResponse.json({ error: 'Erro ao buscar detalhes da célula' }, { status: 500 });
    }

    if (!detailsData || detailsData.length === 0) {
      return NextResponse.json({ error: 'Detalhes da célula não encontrados' }, { status: 404 });
    }

    const cellDetails = detailsData[0];

    // Buscar informações adicionais
    
    // 1. Histórico de reuniões recentes
    const { data: recentMeetings, error: meetingsError } = await supabase
      .from('cell_meetings')
      .select('*')
      .eq('cell_id', cellId)
      .order('meeting_date', { ascending: false })
      .limit(10);

    // 2. Membros da célula
    const { data: members, error: membersError } = await supabase
      .from('cell_members')
      .select(`
        *,
        profile:profiles!cell_members_profile_id_fkey(
          id, full_name, avatar_url, role
        ),
        leadership_info:leadership_pipeline!leadership_pipeline_profile_id_fkey(
          leadership_score, potential_level, confidence_score
        )
      `)
      .eq('cell_id', cellId)
      .order('joined_at', { ascending: true });

    // 3. Critérios de multiplicação configurados
    const { data: criteria, error: criteriaError } = await supabase
      .from('multiplication_criteria')
      .select('*')
      .eq('church_id', cellData.church_id)
      .eq('is_active', true)
      .order('criteria_type');

    // 4. Histórico de avaliações
    const { data: evaluationHistory, error: historyError } = await supabase
      .from('multiplication_readiness')
      .select('readiness_score, status, last_evaluated_at, confidence_level')
      .eq('cell_id', cellId)
      .order('last_evaluated_at', { ascending: false })
      .limit(5);

    // Calcular estatísticas de frequência de reuniões
    let meetingStats = {
      total_meetings_last_30_days: 0,
      average_attendance_last_30_days: 0,
      attendance_trend: 'stable' as 'growing' | 'stable' | 'declining'
    };

    if (!meetingsError && recentMeetings) {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentMeetingsData = recentMeetings.filter(
        meeting => new Date(meeting.meeting_date) >= last30Days
      );
      
      meetingStats.total_meetings_last_30_days = recentMeetingsData.length;
      
      if (recentMeetingsData.length > 0) {
        const totalAttendance = recentMeetingsData.reduce(
          (sum, meeting) => sum + (meeting.actual_attendees || 0), 0
        );
        meetingStats.average_attendance_last_30_days = 
          Math.round(totalAttendance / recentMeetingsData.length);
        
        // Calcular tendência (comparar primeiras 3 com últimas 3 reuniões)
        if (recentMeetingsData.length >= 6) {
          const firstThree = recentMeetingsData.slice(-3).reduce(
            (sum, m) => sum + (m.actual_attendees || 0), 0
          ) / 3;
          const lastThree = recentMeetingsData.slice(0, 3).reduce(
            (sum, m) => sum + (m.actual_attendees || 0), 0
          ) / 3;
          
          if (lastThree > firstThree * 1.1) {
            meetingStats.attendance_trend = 'growing';
          } else if (lastThree < firstThree * 0.9) {
            meetingStats.attendance_trend = 'declining';
          }
        }
      }
    }

    return NextResponse.json({
      data: {
        cell_details: cellDetails,
        recent_meetings: recentMeetings || [],
        members: members || [],
        criteria: criteria || [],
        evaluation_history: evaluationHistory || [],
        meeting_stats: meetingStats,
        permissions: {
          can_edit: userProfile.role === 'pastor' || 
                   cellData.leader_id === userProfile.id ||
                   cellData.supervisor_id === userProfile.id,
          can_evaluate: true,
          can_add_meetings: cellData.leader_id === userProfile.id ||
                          userProfile.role === 'supervisor' ||
                          userProfile.role === 'pastor'
        }
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}