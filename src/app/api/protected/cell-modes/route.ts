import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('church_id')

    if (!churchId) {
      return NextResponse.json(
        { error: 'church_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar templates de modo disponíveis
    const { data: templates, error: templatesError } = await supabase
      .from('mode_templates')
      .select('*')
      .order('mode')

    if (templatesError) {
      console.error('Erro ao buscar templates:', templatesError)
      return NextResponse.json(
        { error: 'Erro ao buscar templates de modo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Erro no endpoint cell-modes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}