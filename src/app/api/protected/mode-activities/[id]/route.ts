import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const activityId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      description,
      planned_date,
      completed_date,
      participants_expected,
      participants_actual,
      results,
      is_completed
    } = body

    // Verificar se a atividade existe e se o usuário tem permissão
    const { data: activity, error: activityError } = await supabase
      .from('mode_activities')
      .select(`
        id,
        cell_mode_id,
        cell_modes!inner (
          id,
          cell_id,
          cells!inner (
            id,
            church_id,
            leader_id,
            supervisor_id
          )
        )
      `)
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão do usuário
    const cell = activity.cell_modes.cells
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, church_id')
      .eq('id', user.id)
      .eq('church_id', cell.church_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta atividade' },
        { status: 403 }
      )
    }

    const allowedRoles = ['pastor', 'supervisor', 'leader']
    const isLeaderOfCell = cell.leader_id === user.id
    const isSupervisorOfCell = cell.supervisor_id === user.id

    if (!allowedRoles.includes(userProfile.role) && !isLeaderOfCell && !isSupervisorOfCell) {
      return NextResponse.json(
        { error: 'Sem permissão para editar atividades desta célula' },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (description !== undefined) updateData.description = description
    if (planned_date !== undefined) updateData.planned_date = planned_date
    if (completed_date !== undefined) updateData.completed_date = completed_date
    if (participants_expected !== undefined) updateData.participants_expected = participants_expected
    if (participants_actual !== undefined) updateData.participants_actual = participants_actual
    if (results !== undefined) updateData.results = results
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
      // Se está marcando como completa e não tem data de conclusão, adicionar
      if (is_completed && !completed_date && !updateData.completed_date) {
        updateData.completed_date = new Date().toISOString().split('T')[0]
      }
    }

    // Atualizar atividade
    const { data: updatedActivity, error } = await supabase
      .from('mode_activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar atividade:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Atividade atualizada com sucesso',
      activity: updatedActivity
    })
  } catch (error) {
    console.error('Erro no endpoint de atualização de atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const activityId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a atividade existe e se o usuário tem permissão
    const { data: activity, error: activityError } = await supabase
      .from('mode_activities')
      .select(`
        id,
        cell_mode_id,
        cell_modes!inner (
          id,
          cell_id,
          cells!inner (
            id,
            church_id,
            leader_id,
            supervisor_id
          )
        )
      `)
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão do usuário
    const cell = activity.cell_modes.cells
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, church_id')
      .eq('id', user.id)
      .eq('church_id', cell.church_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta atividade' },
        { status: 403 }
      )
    }

    const allowedRoles = ['pastor', 'supervisor', 'leader']
    const isLeaderOfCell = cell.leader_id === user.id
    const isSupervisorOfCell = cell.supervisor_id === user.id

    if (!allowedRoles.includes(userProfile.role) && !isLeaderOfCell && !isSupervisorOfCell) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir atividades desta célula' },
        { status: 403 }
      )
    }

    // Excluir atividade
    const { error } = await supabase
      .from('mode_activities')
      .delete()
      .eq('id', activityId)

    if (error) {
      console.error('Erro ao excluir atividade:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Atividade excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro no endpoint de exclusão de atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}