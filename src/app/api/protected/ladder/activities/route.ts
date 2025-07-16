import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for query parameters
const querySchema = z.object({
  category: z.enum(['attendance', 'events', 'courses', 'service', 'consistency']).optional(),
  is_active: z.enum(['true', 'false']).optional().default('true'),
  limit: z.string().regex(/^\d+$/).optional().default('50'),
  offset: z.string().regex(/^\d+$/).optional().default('0')
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      category: searchParams.get('category'),
      is_active: searchParams.get('is_active'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    // Obter ID da igreja do usuário
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.church_id) {
      return NextResponse.json(
        { error: 'Usuário não está associado a uma igreja' },
        { status: 400 }
      );
    }

    // Construir query base
    let query = supabase
      .from('success_ladder_activities')
      .select(`
        id,
        name,
        points,
        category,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('church_id', userProfile.church_id);

    // Aplicar filtros
    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.is_active === 'true') {
      query = query.eq('is_active', true);
    } else if (params.is_active === 'false') {
      query = query.eq('is_active', false);
    }

    // Aplicar paginação e ordenação
    query = query
      .order('category')
      .order('points', { ascending: false })
      .range(parseInt(params.offset), parseInt(params.offset) + parseInt(params.limit) - 1);

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar atividades' },
        { status: 500 }
      );
    }

    // Agrupar atividades por categoria para melhor organização
    const groupedActivities = activities?.reduce((acc, activity) => {
      if (!acc[activity.category]) {
        acc[activity.category] = [];
      }
      acc[activity.category].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return NextResponse.json({
      data: activities,
      grouped: groupedActivities,
      pagination: {
        total: count,
        offset: parseInt(params.offset),
        limit: parseInt(params.limit),
        hasMore: count ? (parseInt(params.offset) + parseInt(params.limit)) < count : false
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro ao buscar atividades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Schema for creating new activity
const createActivitySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  points: z.number().int().min(1, 'Pontos devem ser positivos').max(1000, 'Máximo 1000 pontos'),
  category: z.enum(['attendance', 'events', 'courses', 'service', 'consistency']),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas líderes ou superiores podem criar atividades)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, church_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['leader', 'supervisor', 'pastor'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar atividades' },
        { status: 403 }
      );
    }

    // Validar dados de entrada
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    // Criar nova atividade
    const { data: newActivity, error: createError } = await supabase
      .from('success_ladder_activities')
      .insert({
        ...validatedData,
        church_id: userProfile.church_id
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar atividade:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar atividade' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Atividade criada com sucesso',
      data: newActivity
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}