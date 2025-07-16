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

    const { id } = params

    // Buscar processo de multiplicação com detalhes
    const { data: process, error: processError } = await supabase
      .from('multiplication_processes')
      .select(`
        *,
        source_cell:cells!source_cell_id(
          id,
          name,
          church_id
        ),
        new_cell:cells!new_cell_id(
          id,
          name
        ),
        initiated_by_profile:profiles!initiated_by(
          id,
          full_name
        ),
        new_leader:profiles!new_leader_id(
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (processError || !process) {
      return NextResponse.json(
        { error: 'Multiplication process not found' },
        { status: 404 }
      )
    }

    // Verificar permissão de acesso
    const { data: userChurch } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!userChurch || userChurch.church_id !== process.church_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Buscar atribuições de membros
    const { data: memberAssignments, error: assignmentsError } = await supabase
      .from('multiplication_member_assignments')
      .select(`
        *,
        member:profiles!member_id(
          id,
          full_name,
          age
        )
      `)
      .eq('multiplication_id', id)

    if (assignmentsError) {
      console.error('Error fetching member assignments:', assignmentsError)
    }

    // Buscar passos do wizard
    const { data: wizardSteps, error: stepsError } = await supabase
      .rpc('get_multiplication_wizard_steps')

    if (stepsError) {
      console.error('Error fetching wizard steps:', stepsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        process,
        member_assignments: memberAssignments || [],
        wizard_steps: wizardSteps || []
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id } = params
    const updateData = await request.json()

    // Verificar permissão para atualizar
    const { data: process, error: processError } = await supabase
      .from('multiplication_processes')
      .select('church_id, initiated_by, source_cell_id')
      .eq('id', id)
      .single()

    if (processError || !process) {
      return NextResponse.json(
        { error: 'Multiplication process not found' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão
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

    // Atualizar processo
    const { data: updatedProcess, error: updateError } = await supabase
      .from('multiplication_processes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating multiplication process:', updateError)
      return NextResponse.json(
        { error: 'Failed to update multiplication process' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedProcess
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}