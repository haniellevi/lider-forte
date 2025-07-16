import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for query parameters
const querySchema = z.object({
  include_history: z.enum(['true', 'false']).optional().default('false'),
  days: z.string().regex(/^\d+$/).optional().default('30'),
  category: z.enum(['attendance', 'events', 'courses', 'service', 'consistency']).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const memberId = params.id;

    // Validar UUID
    if (!z.string().uuid().safeParse(memberId).success) {
      return NextResponse.json(
        { error: 'ID do membro inválido' },
        { status: 400 }
      );
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
      include_history: searchParams.get('include_history'),
      days: searchParams.get('days'),
      category: searchParams.get('category')
    });

    // Verificar se o membro existe e se o usuário tem permissão para visualizar
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .single();

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, full_name, church_id')
      .eq('id', memberId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    const canView = memberId === user.id || // Próprio perfil
                   targetProfile.church_id === userProfile?.church_id; // Mesma igreja

    if (!canView) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar este membro' },
        { status: 403 }
      );
    }

    // Obter pontuação atual do membro
    const { data: currentScore } = await supabase
      .rpc('calculate_member_score', { member_id: memberId });

    // Obter informações da célula do membro
    const { data: cellInfo } = await supabase
      .from('cell_members')
      .select(`
        success_ladder_score,
        is_timoteo,
        cells (
          id,
          name,
          leader_id,
          profiles!cells_leader_id_fkey (
            full_name
          )
        )
      `)
      .eq('profile_id', memberId)
      .single();

    // Construir resposta base
    const response: any = {
      member: {
        id: targetProfile.id,
        full_name: targetProfile.full_name,
        current_score: currentScore || 0,
        stored_score: cellInfo?.success_ladder_score || 0,
        is_timoteo: cellInfo?.is_timoteo || false,
        cell: cellInfo?.cells ? {
          id: cellInfo.cells.id,
          name: cellInfo.cells.name,
          leader_name: cellInfo.cells.profiles?.full_name
        } : null
      }
    };

    // Se solicitado, incluir histórico de atividades
    if (queryParams.include_history === 'true') {
      const daysBack = parseInt(queryParams.days);
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysBack);

      let historyQuery = supabase
        .from('member_activity_log')
        .select(`
          id,
          points_earned,
          activity_date,
          metadata,
          success_ladder_activities (
            name,
            category,
            description
          )
        `)
        .eq('profile_id', memberId)
        .gte('activity_date', dateLimit.toISOString().split('T')[0])
        .order('activity_date', { ascending: false });

      // Filtrar por categoria se especificado
      if (queryParams.category) {
        historyQuery = historyQuery.eq('success_ladder_activities.category', queryParams.category);
      }

      const { data: activityHistory } = await historyQuery;

      // Agrupar por categoria e calcular estatísticas
      const categoryStats = activityHistory?.reduce((acc, activity) => {
        const category = activity.success_ladder_activities?.category;
        if (!category) return acc;
        
        if (!acc[category]) {
          acc[category] = {
            total_points: 0,
            activity_count: 0,
            activities: []
          };
        }
        
        acc[category].total_points += activity.points_earned;
        acc[category].activity_count += 1;
        acc[category].activities.push(activity);
        
        return acc;
      }, {} as Record<string, any>);

      response.history = {
        period_days: daysBack,
        total_activities: activityHistory?.length || 0,
        total_points_period: activityHistory?.reduce((sum, act) => sum + act.points_earned, 0) || 0,
        category_breakdown: categoryStats,
        recent_activities: activityHistory?.slice(0, 10) // Últimas 10 atividades
      };
    }

    // Obter ranking na célula se o membro pertence a uma célula
    if (cellInfo?.cells?.id) {
      const { data: cellRanking } = await supabase
        .rpc('get_cell_ladder_ranking', { cell_id: cellInfo.cells.id });

      const memberRank = cellRanking?.findIndex(member => member.profile_id === memberId) + 1;
      response.member.cell_ranking = {
        position: memberRank || null,
        total_members: cellRanking?.length || 0
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro ao buscar pontuação do membro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}