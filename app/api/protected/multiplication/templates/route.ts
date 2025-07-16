import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar igreja do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.church_id) {
      return NextResponse.json(
        { error: 'User church not found' },
        { status: 404 }
      )
    }

    // Buscar templates da igreja
    const { data: templates, error: templatesError } = await supabase
      .from('multiplication_templates')
      .select(`
        *,
        created_by_profile:profiles!created_by(
          id,
          full_name
        )
      `)
      .eq('church_id', userProfile.church_id)
      .eq('is_active', true)
      .order('times_used', { ascending: false })

    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: templates || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const templateData = await request.json()

    // Buscar igreja do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.church_id) {
      return NextResponse.json(
        { error: 'User church not found' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão para criar templates
    const { data: churchMember } = await supabase
      .from('church_members')
      .select('role')
      .eq('church_id', userProfile.church_id)
      .eq('profile_id', user.id)
      .single()

    if (!churchMember || !['admin', 'pastor'].includes(churchMember.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only church admins can create templates.' },
        { status: 403 }
      )
    }

    // Criar template
    const { data: template, error: createError } = await supabase
      .from('multiplication_templates')
      .insert({
        ...templateData,
        church_id: userProfile.church_id,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating template:', createError)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}