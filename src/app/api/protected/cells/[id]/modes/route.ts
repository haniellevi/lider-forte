import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const cellId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { mode, duration_weeks, goal_description, custom_metrics } = body

    if (!mode) {
      return NextResponse.json(
        { error: 'Modo é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se o modo é válido
    const validModes = ['GANHAR', 'CONSOLIDAR', 'DISCIPULAR', 'ENVIAR']
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Modo inválido' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar a célula
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select(`
        id,
        name,
        church_id,
        leader_id,
        supervisor_id,
        profiles!inner (
          id,
          church_id,
          role
        )
      `)
      .eq('id', cellId)
      .eq('profiles.id', user.id)
      .single()

    if (cellError || !cell) {
      return NextResponse.json(
        { error: 'Célula não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem role adequado
    const userProfile = cell.profiles
    const allowedRoles = ['pastor', 'supervisor', 'leader']
    const isLeaderOfCell = cell.leader_id === user.id
    const isSupervisorOfCell = cell.supervisor_id === user.id

    if (!allowedRoles.includes(userProfile.role) && !isLeaderOfCell && !isSupervisorOfCell) {
      return NextResponse.json(
        { error: 'Sem permissão para gerenciar modos desta célula' },
        { status: 403 }
      )
    }

    // Ativar novo modo usando a função SQL
    const { data, error } = await supabase.rpc('activate_cell_mode', {
      p_cell_id: cellId,
      p_mode: mode,
      p_duration_weeks: duration_weeks || 4,
      p_goal_description: goal_description || null,
      p_custom_metrics: custom_metrics || null,
      p_created_by: user.id
    })

    if (error) {
      console.error('Erro ao ativar modo:', error)
      return NextResponse.json(
        { error: 'Erro ao ativar modo da célula' },
        { status: 500 }
      )
    }

    // Buscar dados do modo criado
    const { data: newMode, error: modeError } = await supabase
      .from('cell_modes')
      .select(`
        *,
        mode_templates!inner (
          name,
          color,
          icon,
          suggested_activities
        )
      `)
      .eq('id', data)
      .single()

    if (modeError) {
      console.error('Erro ao buscar modo criado:', modeError)
      return NextResponse.json(
        { error: 'Modo criado mas erro ao buscar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Modo ativado com sucesso',
      mode: newMode
    })
  } catch (error) {
    console.error('Erro no endpoint de ativação de modo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const cellId = params.id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (action === 'current') {
      // Buscar modo atual usando a função SQL
      const { data: currentMode, error } = await supabase.rpc(
        'get_current_cell_mode',
        { p_cell_id: cellId }
      )

      if (error) {
        console.error('Erro ao buscar modo atual:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar modo atual' },
          { status: 500 }
        )
      }

      const mode = currentMode?.[0] || null

      if (mode) {
        // Buscar informações do template
        const { data: template, error: templateError } = await supabase
          .from('mode_templates')
          .select('name, color, icon, suggested_activities')
          .eq('mode', mode.mode)
          .eq('is_default', true)
          .single()

        if (!templateError && template) {
          mode.template = template
        }
      }

      return NextResponse.json({ current_mode: mode })
    }

    if (action === 'recommend') {
      // Buscar recomendação de modo
      const { data: recommendation, error } = await supabase.rpc(
        'recommend_cell_mode',
        { p_cell_id: cellId }
      )

      if (error) {
        console.error('Erro ao buscar recomendação:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar recomendação' },
          { status: 500 }
        )
      }

      const rec = recommendation?.[0] || null

      if (rec) {
        // Buscar informações do template recomendado
        const { data: template, error: templateError } = await supabase
          .from('mode_templates')
          .select('*')
          .eq('mode', rec.recommended_mode)
          .eq('is_default', true)
          .single()

        if (!templateError && template) {
          rec.template = template
        }
      }

      return NextResponse.json({ recommendation: rec })
    }

    // Buscar histórico de modos
    const { data: modes, error } = await supabase
      .from('cell_modes')
      .select(`
        *,
        mode_templates!inner (
          name,
          color,
          icon
        )
      `)
      .eq('cell_id', cellId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico de modos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar histórico de modos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ modes })
  } catch (error) {
    console.error('Erro no endpoint de modos da célula:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}