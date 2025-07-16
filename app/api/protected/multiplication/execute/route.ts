import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface ExecuteMultiplicationRequest {
  multiplication_id: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { multiplication_id }: ExecuteMultiplicationRequest = await request.json()

    if (!multiplication_id) {
      return NextResponse.json(
        { error: 'multiplication_id is required' },
        { status: 400 }
      )
    }

    // Verificar se o processo existe e está aprovado
    const { data: process, error: processError } = await supabase
      .from('multiplication_processes')
      .select('*')
      .eq('id', multiplication_id)
      .single()

    if (processError || !process) {
      return NextResponse.json(
        { error: 'Multiplication process not found' },
        { status: 404 }
      )
    }

    if (process.status !== 'approved') {
      return NextResponse.json(
        { error: 'Process must be approved before execution' },
        { status: 400 }
      )
    }

    // Verificar permissão (apenas admins da igreja ou supervisores podem executar)
    const { data: churchMember } = await supabase
      .from('church_members')
      .select('role')
      .eq('church_id', process.church_id)
      .eq('profile_id', user.id)
      .single()

    const { data: cellMember } = await supabase
      .from('cell_members')
      .select('role')
      .eq('cell_id', process.source_cell_id)
      .eq('profile_id', user.id)
      .single()

    const canExecute = 
      (churchMember && ['admin', 'pastor'].includes(churchMember.role)) ||
      (cellMember && cellMember.role === 'supervisor')

    if (!canExecute) {
      return NextResponse.json(
        { error: 'Permission denied. Only church admins or supervisors can execute multiplication.' },
        { status: 403 }
      )
    }

    // Executar a multiplicação
    const { data: newCellId, error: executeError } = await supabase
      .rpc('execute_multiplication', {
        p_multiplication_id: multiplication_id
      })

    if (executeError) {
      console.error('Error executing multiplication:', executeError)
      return NextResponse.json(
        { error: 'Failed to execute multiplication' },
        { status: 500 }
      )
    }

    // Buscar detalhes da nova célula criada
    const { data: newCell, error: newCellError } = await supabase
      .from('cells')
      .select(`
        *,
        leader:profiles!leader_id(
          id,
          full_name
        ),
        supervisor:profiles!supervisor_id(
          id,
          full_name
        )
      `)
      .eq('id', newCellId)
      .single()

    if (newCellError) {
      console.error('Error fetching new cell details:', newCellError)
    }

    // Buscar processo atualizado
    const { data: updatedProcess, error: fetchProcessError } = await supabase
      .from('multiplication_processes')
      .select('*')
      .eq('id', multiplication_id)
      .single()

    if (fetchProcessError) {
      console.error('Error fetching updated process:', fetchProcessError)
    }

    return NextResponse.json({
      success: true,
      data: {
        new_cell_id: newCellId,
        new_cell: newCell,
        process: updatedProcess
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