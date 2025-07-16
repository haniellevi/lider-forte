import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for ranking query parameters
const rankingQuerySchema = z.object({
  type: z.enum(['cell', 'church']).default('church'),
  cell_id: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('all')
});

export async function GET(request: NextRequest) {
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

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const params = rankingQuerySchema.parse({
      type: searchParams.get('type'),
      cell_id: searchParams.get('cell_id'),
      limit: searchParams.get('limit'),
      period: searchParams.get('period')
    });

    // Obter perfil do usuário
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile?.church_id) {
      return NextResponse.json(
        { error: 'Usuário não está associado a uma igreja' },
        { status: 400 }
      );
    }

    let rankingData;

    if (params.type === 'cell') {
      // Ranking por célula
      let cellId = params.cell_id;

      // Se não foi especificada célula, buscar a célula do usuário (se for líder)
      if (!cellId && userProfile.role === 'leader') {
        const { data: userCell } = await supabase
          .from('cells')
          .select('id')
          .eq('leader_id', user.id)
          .single();
        
        cellId = userCell?.id;
      }

      if (!cellId) {
        return NextResponse.json(
          { error: 'ID da célula é obrigatório para ranking de célula' },
          { status: 400 }
        );
      }

      // Verificar se a célula pertence à igreja do usuário
      const { data: cell } = await supabase
        .from('cells')
        .select('id, name, church_id')
        .eq('id', cellId)
        .eq('church_id', userProfile.church_id)
        .single();

      if (!cell) {
        return NextResponse.json(
          { error: 'Célula não encontrada ou não pertence à sua igreja' },
          { status: 404 }
        );
      }

      // Obter ranking da célula
      const { data: cellRanking } = await supabase
        .rpc('get_cell_ladder_ranking', { cell_id: cellId });

      rankingData = {
        type: 'cell',
        cell: {
          id: cell.id,
          name: cell.name
        },
        ranking: cellRanking?.slice(0, parseInt(params.limit)) || []
      };

    } else {
      // Ranking da igreja
      const { data: churchRanking } = await supabase
        .rpc('get_church_ladder_ranking', { church_id: userProfile.church_id });

      rankingData = {
        type: 'church',
        ranking: churchRanking?.slice(0, parseInt(params.limit)) || []
      };
    }

    // Se for um período específico, filtrar por data
    if (params.period !== 'all') {
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      };

      const daysBack = periodDays[params.period];
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysBack);

      // Para períodos específicos, calcular pontuação baseada apenas nas atividades do período
      const profileIds = rankingData.ranking.map((member: any) => member.profile_id);
      
      const { data: periodActivities } = await supabase
        .from('member_activity_log')
        .select('profile_id, points_earned')
        .in('profile_id', profileIds)
        .gte('activity_date', dateLimit.toISOString().split('T')[0]);

      // Recalcular pontuações para o período
      const periodScores = periodActivities?.reduce((acc: Record<string, number>, activity) => {
        acc[activity.profile_id] = (acc[activity.profile_id] || 0) + activity.points_earned;
        return acc;
      }, {}) || {};

      // Atualizar ranking com pontuações do período
      rankingData.ranking = rankingData.ranking
        .map((member: any) => ({
          ...member,
          period_score: periodScores[member.profile_id] || 0
        }))
        .sort((a: any, b: any) => b.period_score - a.period_score)
        .map((member: any, index: number) => ({
          ...member,
          period_rank: index + 1
        }));
    }

    // Adicionar informações estatísticas
    const totalMembers = rankingData.ranking.length;
    const topScore = rankingData.ranking[0]?.success_ladder_score || 0;
    const averageScore = totalMembers > 0 
      ? Math.round(rankingData.ranking.reduce((sum: number, member: any) => 
          sum + member.success_ladder_score, 0) / totalMembers)
      : 0;

    // Encontrar posição do usuário atual no ranking
    const userPosition = rankingData.ranking.findIndex((member: any) => 
      member.profile_id === user.id) + 1;

    return NextResponse.json({
      ...rankingData,
      period: params.period,
      statistics: {
        total_members: totalMembers,
        top_score: topScore,
        average_score: averageScore,
        user_position: userPosition || null
      },
      generated_at: new Date().toISOString()
    });

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

    console.error('Erro ao buscar ranking:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}