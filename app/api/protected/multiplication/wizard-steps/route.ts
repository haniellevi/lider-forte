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

    // Buscar passos do wizard
    const { data: steps, error: stepsError } = await supabase
      .rpc('get_multiplication_wizard_steps')

    if (stepsError) {
      console.error('Error fetching wizard steps:', stepsError)
      return NextResponse.json(
        { error: 'Failed to fetch wizard steps' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      steps: steps || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}