import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface StartMultiplicationRequest {
  source_cell_id: string
  multiplication_plan: {
    new_cell_name: string
    meeting_day: string
    meeting_time: string
    address: string
    city: string
    state: string
    zip_code: string
    template_id?: string
  }
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

    const { source_cell_id, multiplication_plan }: StartMultiplicationRequest = await request.json()

    if (!source_cell_id || !multiplication_plan) {
      return NextResponse.json(
        { error: 'source_cell_id and multiplication_plan are required' },
        { status: 400 }
      )
    }

    // Verificar se o usuário pode iniciar multiplicação da célula
    const { data: cellMember, error: cellError } = await supabase
      .from('cell_members')
      .select('role, cell_id')
      .eq('cell_id', source_cell_id)
      .eq('profile_id', user.id)
      .single()

    if (cellError || !cellMember || !['leader', 'supervisor'].includes(cellMember.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only leaders and supervisors can start multiplication.' },
        { status: 403 }
      )
    }

    // Buscar igreja da célula
    const { data: cell, error: getCellError } = await supabase
      .from('cells')
      .select('church_id')
      .eq('id', source_cell_id)
      .single()

    if (getCellError || !cell) {
      return NextResponse.json(
        { error: 'Cell not found' },
        { status: 404 }
      )
    }

    // Criar processo de multiplicação
    const { data: multiplicationProcess, error: createError } = await supabase
      .from('multiplication_processes')
      .insert({
        source_cell_id,
        church_id: cell.church_id,
        initiated_by: user.id,
        status: 'draft',
        current_step: 1,
        multiplication_plan
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating multiplication process:', createError)
      return NextResponse.json(
        { error: 'Failed to create multiplication process' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: multiplicationProcess
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}