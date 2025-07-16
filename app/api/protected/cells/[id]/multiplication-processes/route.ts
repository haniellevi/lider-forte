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

    // Buscar processos de multiplicação da célula
    const { data: processes, error: processesError } = await supabase
      .from('multiplication_processes')
      .select(`
        id,
        status,
        current_step,
        total_steps,
        multiplication_plan,
        completion_date,
        created_at,
        updated_at,
        initiated_by_profile:profiles!initiated_by(
          id,
          full_name
        ),
        new_leader:profiles!new_leader_id(
          id,
          full_name
        ),
        new_cell:cells!new_cell_id(
          id,
          name
        )
      `)
      .eq('source_cell_id', cellId)
      .order('created_at', { ascending: false })

    if (processesError) {
      console.error('Error fetching multiplication processes:', processesError)
      return NextResponse.json(
        { error: 'Failed to fetch multiplication processes' },
        { status: 500 }
      )
    }

    // Enriquecer dados dos processos
    const enrichedProcesses = await Promise.all(
      (processes || []).map(async (process) => {
        // Buscar contagem de membros atribuídos se o processo estiver em andamento
        let memberAssignments = null
        if (['member_selection', 'leader_assignment', 'plan_review', 'pending_approval'].includes(process.status)) {
          const { data: assignments } = await supabase
            .from('multiplication_member_assignments')
            .select('assignment_type')
            .eq('multiplication_id', process.id)

          if (assignments) {
            memberAssignments = assignments.reduce((acc, assignment) => {
              acc[assignment.assignment_type] = (acc[assignment.assignment_type] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          }
        }

        return {
          ...process,
          member_assignments: memberAssignments,
          progress_percentage: Math.round((process.current_step / process.total_steps) * 100)
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedProcesses
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}