import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateAssignmentsRequest {
  multiplication_id: string
  assignments: Array<{
    member_id: string
    assignment_type: 'stays_source' | 'moves_new' | 'new_leader' | 'undecided'
    role_in_new_cell?: 'member' | 'leader' | 'supervisor'
    notes?: string
  }>
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { multiplication_id, assignments }: UpdateAssignmentsRequest = await request.json()

    if (!multiplication_id || !assignments) {
      return NextResponse.json(
        { error: 'multiplication_id and assignments are required' },
        { status: 400 }
      )
    }

    // Verificar se o processo existe e o usuário tem permissão
    const { data: process, error: processError } = await supabase
      .from('multiplication_processes')
      .select('church_id, initiated_by, source_cell_id')
      .eq('id', multiplication_id)
      .single()

    if (processError || !process) {
      return NextResponse.json(
        { error: 'Multiplication process not found' },
        { status: 404 }
      )
    }

    // Verificar permissão
    const isInitiator = process.initiated_by === user.id
    
    const { data: cellMember } = await supabase
      .from('cell_members')
      .select('role')
      .eq('cell_id', process.source_cell_id)
      .eq('profile_id', user.id)
      .single()

    const isLeaderOrSupervisor = cellMember && ['leader', 'supervisor'].includes(cellMember.role)

    if (!isInitiator && !isLeaderOrSupervisor) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Validar que existe apenas um líder para a nova célula
    const newLeaders = assignments.filter(a => a.assignment_type === 'new_leader')
    if (newLeaders.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one member must be assigned as new leader' },
        { status: 400 }
      )
    }

    // Atualizar atribuições de membros
    const updatePromises = assignments.map(async (assignment) => {
      const { data: existingAssignment } = await supabase
        .from('multiplication_member_assignments')
        .select('id')
        .eq('multiplication_id', multiplication_id)
        .eq('member_id', assignment.member_id)
        .single()

      if (existingAssignment) {
        // Atualizar existente
        return supabase
          .from('multiplication_member_assignments')
          .update({
            assignment_type: assignment.assignment_type,
            role_in_new_cell: assignment.role_in_new_cell || 'member',
            manually_adjusted: true,
            notes: assignment.notes
          })
          .eq('id', existingAssignment.id)
      } else {
        // Inserir novo
        return supabase
          .from('multiplication_member_assignments')
          .insert({
            multiplication_id,
            member_id: assignment.member_id,
            assignment_type: assignment.assignment_type,
            role_in_new_cell: assignment.role_in_new_cell || 'member',
            manually_adjusted: true,
            notes: assignment.notes
          })
      }
    })

    const results = await Promise.all(updatePromises)
    const errors = results.filter(result => result.error)

    if (errors.length > 0) {
      console.error('Error updating assignments:', errors)
      return NextResponse.json(
        { error: 'Failed to update some assignments' },
        { status: 500 }
      )
    }

    // Atualizar o líder no processo principal
    const newLeaderId = newLeaders[0].member_id
    const { error: updateProcessError } = await supabase
      .from('multiplication_processes')
      .update({
        new_leader_id: newLeaderId,
        current_step: 4,
        status: 'leader_assignment'
      })
      .eq('id', multiplication_id)

    if (updateProcessError) {
      console.error('Error updating process:', updateProcessError)
    }

    // Buscar atribuições atualizadas
    const { data: updatedAssignments, error: fetchError } = await supabase
      .from('multiplication_member_assignments')
      .select(`
        *,
        member:profiles!member_id(
          id,
          full_name,
          age
        )
      `)
      .eq('multiplication_id', multiplication_id)

    if (fetchError) {
      console.error('Error fetching updated assignments:', fetchError)
    }

    return NextResponse.json({
      success: true,
      data: updatedAssignments || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}