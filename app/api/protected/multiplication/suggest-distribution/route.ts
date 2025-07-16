import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface SuggestDistributionRequest {
  multiplication_id: string
  template_id?: string
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

    const { multiplication_id, template_id }: SuggestDistributionRequest = await request.json()

    if (!multiplication_id) {
      return NextResponse.json(
        { error: 'multiplication_id is required' },
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

    // Chamar função de sugestão automática
    const { data: suggestion, error: suggestionError } = await supabase
      .rpc('suggest_member_distribution', {
        p_multiplication_id: multiplication_id,
        p_template_id: template_id || null
      })

    if (suggestionError) {
      console.error('Error generating member distribution suggestion:', suggestionError)
      return NextResponse.json(
        { error: 'Failed to generate member distribution suggestion' },
        { status: 500 }
      )
    }

    // Salvar sugestões como atribuições iniciais
    if (suggestion?.members) {
      // Limpar atribuições existentes
      await supabase
        .from('multiplication_member_assignments')
        .delete()
        .eq('multiplication_id', multiplication_id)

      // Inserir novas atribuições
      const assignments = suggestion.members.map((member: any) => ({
        multiplication_id,
        member_id: member.member_id,
        assignment_type: member.suggestion,
        role_in_new_cell: member.role_in_new,
        priority_score: member.priority_score,
        auto_suggested: true,
        notes: member.reasoning
      }))

      const { error: insertError } = await supabase
        .from('multiplication_member_assignments')
        .insert(assignments)

      if (insertError) {
        console.error('Error saving member assignments:', insertError)
      }

      // Atualizar o processo com a distribuição de membros
      const { error: updateError } = await supabase
        .from('multiplication_processes')
        .update({
          member_distribution: suggestion,
          current_step: 3,
          status: 'member_selection'
        })
        .eq('id', multiplication_id)

      if (updateError) {
        console.error('Error updating process:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      data: suggestion
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}