import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const churchId = params.id
    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get('supervisor_id')
    const mode = searchParams.get('mode')

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário pertence à igreja
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .eq('church_id', churchId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta igreja' },
        { status: 403 }
      )
    }

    // Construir query base
    let query = supabase
      .from('cell_modes_dashboard')
      .select('*')
      .eq('church_id', churchId)

    // Aplicar filtros
    if (supervisorId) {
      query = query.eq('supervisor_id', supervisorId)
    }

    if (mode) {
      query = query.eq('current_mode', mode)
    }

    // Filtrar por permissão do usuário
    if (userProfile.role === 'leader') {
      query = query.eq('leader_id', user.id)
    } else if (userProfile.role === 'supervisor') {
      query = query.eq('supervisor_id', user.id)
    }

    const { data: dashboard, error } = await query.order('cell_name')

    if (error) {
      console.error('Erro ao buscar dashboard:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dashboard de modos' },
        { status: 500 }
      )
    }

    // Buscar estatísticas gerais
    const { data: stats, error: statsError } = await supabase
      .from('cell_modes_dashboard')
      .select('current_mode, status')
      .eq('church_id', churchId)

    let statistics = {
      total_cells: 0,
      active_modes: 0,
      expired_modes: 0,
      modes_distribution: {} as Record<string, number>
    }

    if (!statsError && stats) {
      statistics.total_cells = stats.length
      statistics.active_modes = stats.filter(s => s.status === 'Ativo').length
      statistics.expired_modes = stats.filter(s => s.status === 'Expirado').length
      
      // Distribuição por modo
      stats.forEach(s => {
        if (s.current_mode) {
          statistics.modes_distribution[s.current_mode] = 
            (statistics.modes_distribution[s.current_mode] || 0) + 1
        }
      })
    }

    // Buscar células sem modo ativo
    const { data: cellsWithoutMode, error: cellsError } = await supabase
      .from('cells')
      .select(`
        id,
        name,
        leader_id,
        supervisor_id,
        profiles!cells_leader_id_fkey (
          full_name
        )
      `)
      .eq('church_id', churchId)
      .eq('is_active', true)
      .not('id', 'in', `(${dashboard?.map(d => d.cell_id).join(',') || 'null'})`)

    // Buscar recomendações para células sem modo
    const recommendations = []
    if (cellsWithoutMode && cellsWithoutMode.length > 0) {
      for (const cell of cellsWithoutMode) {
        const { data: rec, error: recError } = await supabase.rpc(
          'recommend_cell_mode',
          { p_cell_id: cell.id }
        )
        
        if (!recError && rec && rec[0]) {
          recommendations.push({
            cell_id: cell.id,
            cell_name: cell.name,
            leader_name: cell.profiles?.full_name,
            ...rec[0]
          })
        }
      }
    }

    return NextResponse.json({
      dashboard,
      statistics,
      cells_without_mode: cellsWithoutMode || [],
      recommendations
    })
  } catch (error) {
    console.error('Erro no endpoint dashboard de modos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}