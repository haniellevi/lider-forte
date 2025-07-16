import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface CandidatesRequest {
  member_ids: string[]
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

    const { member_ids }: CandidatesRequest = await request.json()

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json(
        { error: 'member_ids array is required' },
        { status: 400 }
      )
    }

    // Buscar dados detalhados dos candidatos
    const { data: candidates, error: candidatesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        age,
        leadership_pipeline (
          leadership_score,
          potential_level,
          development_status
        ),
        cell_members!inner (
          success_ladder_score,
          is_timoteo,
          joined_at
        )
      `)
      .in('id', member_ids)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json(
        { error: 'Failed to fetch candidate data' },
        { status: 500 }
      )
    }

    // Buscar histórico de multiplicações para cada candidato
    const { data: multiplicationHistory, error: historyError } = await supabase
      .from('multiplication_processes')
      .select('new_leader_id, status')
      .in('new_leader_id', member_ids)
      .eq('status', 'completed')

    if (historyError) {
      console.error('Error fetching multiplication history:', historyError)
    }

    // Processar dados dos candidatos
    const processedCandidates = candidates?.map(candidate => {
      const cellMember = candidate.cell_members[0] || {}
      const pipeline = candidate.leadership_pipeline?.[0] || {}
      const multiplications = multiplicationHistory?.filter(m => m.new_leader_id === candidate.id) || []
      
      const monthsInCell = cellMember.joined_at ? 
        Math.floor((Date.now() - new Date(cellMember.joined_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0

      return {
        id: candidate.id,
        full_name: candidate.full_name,
        age: candidate.age,
        leadership_score: pipeline.leadership_score || 0,
        ladder_score: cellMember.success_ladder_score || 0,
        is_timoteo: cellMember.is_timoteo || false,
        months_in_cell: monthsInCell,
        potential_level: pipeline.potential_level || 'low',
        leadership_experience: pipeline.leadership_score >= 60,
        total_multiplications: multiplications.length
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: processedCandidates
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}