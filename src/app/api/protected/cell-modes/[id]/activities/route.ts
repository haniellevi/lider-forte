import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: modeId } = await params

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
      activity_type, 
      description, 
      planned_date, 
      participants_expected 
    } = body

    if (!activity_type || !description) {
      return NextResponse.json(
        { error: 'Tipo de atividade e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de atividade
    const validTypes = ['meeting', 'outreach', 'training', 'service', 'fellowship', 'mentoring']
    if (!validTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: 'Tipo de atividade inválido' },
        { status: 400 }
      )
    }

    // Verificar permissão para o modo
    const { data: mode, error: modeError } = await supabase
      .from('cell_modes')
      .select(`
        id,
        cell_id,
        cells!inner (
          id,
          church_id,
          leader_id,
          supervisor_id
        )
      `)
      .eq('id', modeId)
      .single()

    if (modeError || !mode) {
      return NextResponse.json(
        { error: 'Modo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, church_id')
      .eq('id', user.id)
      .eq('church_id', (mode.cells as any).church_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para criar atividades neste modo' },
        { status: 403 }
      )
    }

    const allowedRoles = ['pastor', 'supervisor', 'leader']
    const isLeaderOfCell = (mode.cells as any).leader_id === user.id
    const isSupervisorOfCell = (mode.cells as any).supervisor_id === user.id

    if (!allowedRoles.includes(userProfile.role) && !isLeaderOfCell && !isSupervisorOfCell) {
      return NextResponse.json(
        { error: 'Sem permissão para criar atividades nesta célula' },
        { status: 403 }
      )
    }

    // Criar atividade
    const { data: activity, error } = await supabase
      .from('mode_activities')
      .insert({
        cell_mode_id: modeId,
        activity_type,
        description,
        planned_date,
        participants_expected
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar atividade:', error)
      return NextResponse.json(
        { error: 'Erro ao criar atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Atividade criada com sucesso',
      activity
    })
  } catch (error) {
    console.error('Erro no endpoint de criação de atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: modeId } = await params
    const { searchParams } = new URL(request.url)
    const completed = searchParams.get('completed')

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Construir query
    let query = supabase
      .from('mode_activities')
      .select('*')
      .eq('cell_mode_id', modeId)
      .order('planned_date', { ascending: false })

    // Filtrar por status se especificado
    if (completed !== null) {
      query = query.eq('is_completed', completed === 'true')
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar atividades' },
        { status: 500 }
      )
    }

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Erro no endpoint de atividades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}