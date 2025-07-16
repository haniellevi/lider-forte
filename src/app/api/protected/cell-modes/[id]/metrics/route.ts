import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const modeId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { metrics } = body

    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json(
        { error: 'Métricas são obrigatórias e devem ser um objeto' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem permissão para editar este modo
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
      .eq('church_id', mode.cells.church_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este modo' },
        { status: 403 }
      )
    }

    const allowedRoles = ['pastor', 'supervisor', 'leader']
    const isLeaderOfCell = mode.cells.leader_id === user.id
    const isSupervisorOfCell = mode.cells.supervisor_id === user.id

    if (!allowedRoles.includes(userProfile.role) && !isLeaderOfCell && !isSupervisorOfCell) {
      return NextResponse.json(
        { error: 'Sem permissão para editar métricas desta célula' },
        { status: 403 }
      )
    }

    // Atualizar métricas individualmente usando a função SQL
    const updatePromises = Object.entries(metrics).map(([key, value]) => 
      supabase.rpc('update_mode_metrics', {
        p_mode_id: modeId,
        p_metric_key: key,
        p_metric_value: Number(value)
      })
    )

    const results = await Promise.all(updatePromises)
    
    // Verificar se alguma atualização falhou
    const failedUpdates = results.filter(result => result.error)
    if (failedUpdates.length > 0) {
      console.error('Algumas métricas falharam ao atualizar:', failedUpdates)
      return NextResponse.json(
        { error: 'Erro ao atualizar algumas métricas' },
        { status: 500 }
      )
    }

    // Buscar o modo atualizado
    const { data: updatedMode, error: fetchError } = await supabase
      .from('cell_modes')
      .select(`
        *,
        mode_templates!inner (
          name,
          color,
          icon
        )
      `)
      .eq('id', modeId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar modo atualizado:', fetchError)
      return NextResponse.json(
        { error: 'Métricas atualizadas mas erro ao buscar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Métricas atualizadas com sucesso',
      mode: updatedMode
    })
  } catch (error) {
    console.error('Erro no endpoint de atualização de métricas:', error)
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
    const modeId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar modo com métricas
    const { data: mode, error } = await supabase
      .from('cell_modes')
      .select(`
        *,
        mode_templates!inner (
          name,
          color,
          icon,
          target_metrics_template
        ),
        cells!inner (
          id,
          name,
          church_id
        )
      `)
      .eq('id', modeId)
      .single()

    if (error || !mode) {
      return NextResponse.json(
        { error: 'Modo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso a esta igreja
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .eq('church_id', mode.cells.church_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este modo' },
        { status: 403 }
      )
    }

    // Calcular progresso das métricas
    const targetMetrics = mode.target_metrics || {}
    const actualMetrics = mode.actual_metrics || {}
    
    const metricsProgress = Object.keys(targetMetrics).map(key => {
      const target = targetMetrics[key]?.target || 0
      const actual = actualMetrics[key] || 0
      const percentage = target > 0 ? Math.min(100, (actual / target) * 100) : 0
      
      return {
        key,
        description: targetMetrics[key]?.description || key,
        target,
        actual,
        percentage: Math.round(percentage)
      }
    })

    return NextResponse.json({
      mode: {
        ...mode,
        metrics_progress: metricsProgress
      }
    })
  } catch (error) {
    console.error('Erro no endpoint de métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}