import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cellId } = params

    // Verificar se a célula existe e o usuário tem acesso
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select('id, name, church_id')
      .eq('id', cellId)
      .single()

    if (cellError || !cell) {
      return NextResponse.json(
        { error: 'Cell not found' },
        { status: 404 }
      )
    }

    // Verificar se o usuário pertence à mesma igreja
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.church_id !== cell.church_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Contar membros da célula
    const { count: memberCount, error: memberCountError } = await supabase
      .from('cell_members')
      .select('*', { count: 'exact' })
      .eq('cell_id', cellId)

    if (memberCountError) {
      console.error('Error counting members:', memberCountError)
    }

    // Verificar líderes qualificados (Timóteos com score de liderança >= 60)
    const { data: qualifiedLeaders, error: leadersError } = await supabase
      .from('cell_members')
      .select(`
        profile_id,
        is_timoteo,
        profiles!inner(
          id,
          full_name,
          leadership_pipeline(
            leadership_score
          )
        )
      `)
      .eq('cell_id', cellId)
      .eq('is_timoteo', true)

    if (leadersError) {
      console.error('Error fetching qualified leaders:', leadersError)
    }

    // Filtrar líderes realmente qualificados
    const trulyQualified = qualifiedLeaders?.filter(leader => {
      const pipeline = leader.profiles?.leadership_pipeline?.[0]
      return pipeline?.leadership_score >= 60
    }) || []

    // Verificar permissão do usuário para iniciar multiplicação
    const { data: userCellMember } = await supabase
      .from('cell_members')
      .select('role')
      .eq('cell_id', cellId)
      .eq('profile_id', user.id)
      .single()

    const canInitiate = userCellMember && ['leader', 'supervisor'].includes(userCellMember.role)

    // Verificar se já existe processo ativo
    const { data: activeProcess } = await supabase
      .from('multiplication_processes')
      .select('id, status, current_step')
      .eq('source_cell_id', cellId)
      .in('status', ['draft', 'member_selection', 'leader_assignment', 'plan_review', 'pending_approval'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Calcular pontuação geral de elegibilidade
    const eligibilityScore = {
      memberCount: {
        score: Math.min((memberCount || 0) / 12 * 100, 100),
        weight: 0.4
      },
      qualifiedLeaders: {
        score: trulyQualified.length > 0 ? 100 : 0,
        weight: 0.3
      },
      cellStability: {
        score: 80, // Placeholder - poderia verificar tempo de existência da célula
        weight: 0.3
      }
    }

    const totalScore = Object.values(eligibilityScore).reduce(
      (total, criterion) => total + (criterion.score * criterion.weight),
      0
    )

    const eligibilityData = {
      cellId,
      cellName: cell.name,
      memberCount: memberCount || 0,
      qualifiedLeadersCount: trulyQualified.length,
      qualifiedLeaders: trulyQualified.map(leader => ({
        id: leader.profile_id,
        name: leader.profiles?.full_name,
        leadershipScore: leader.profiles?.leadership_pipeline?.[0]?.leadership_score || 0
      })),
      canInitiateMultiplication: canInitiate || false,
      userRole: userCellMember?.role || 'member',
      activeProcess: activeProcess || null,
      eligibilityScore: Math.round(totalScore),
      requirements: {
        minimumMembers: {
          required: 12,
          current: memberCount || 0,
          met: (memberCount || 0) >= 12
        },
        qualifiedLeaders: {
          required: 1,
          current: trulyQualified.length,
          met: trulyQualified.length > 0
        },
        userPermission: {
          required: 'leader or supervisor',
          current: userCellMember?.role || 'member',
          met: canInitiate || false
        },
        noActiveProcess: {
          required: 'no active process',
          current: activeProcess ? 'has active process' : 'no active process',
          met: !activeProcess
        }
      },
      recommendations: []
    }

    // Gerar recomendações baseadas nos critérios não atendidos
    if ((memberCount || 0) < 12) {
      eligibilityData.recommendations.push(
        `Recrute mais ${12 - (memberCount || 0)} membro(s) para atingir o mínimo de 12`
      )
    }

    if (trulyQualified.length === 0) {
      eligibilityData.recommendations.push(
        'Desenvolva líderes Timóteos com score de liderança acima de 60'
      )
    }

    if (!canInitiate) {
      eligibilityData.recommendations.push(
        'Apenas líderes e supervisores podem iniciar multiplicação'
      )
    }

    if (activeProcess) {
      eligibilityData.recommendations.push(
        `Conclua o processo ativo (${activeProcess.status}) antes de iniciar outro`
      )
    }

    return NextResponse.json({
      success: true,
      data: eligibilityData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}