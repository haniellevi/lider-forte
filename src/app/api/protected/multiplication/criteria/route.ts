import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CriteriaCreateSchema = z.object({
  name: z.string().min(1, 'Nome do critério é obrigatório'),
  description: z.string().optional(),
  criteria_type: z.enum([
    'member_count', 
    'meeting_frequency', 
    'average_attendance', 
    'potential_leaders', 
    'cell_age_months', 
    'leader_maturity', 
    'growth_rate', 
    'stability_score'
  ]),
  threshold_value: z.number().min(0, 'Valor limite deve ser positivo'),
  weight: z.number().min(0.01).max(1.0, 'Peso deve estar entre 0.01 e 1.0'),
  is_required: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

const CriteriaUpdateSchema = CriteriaCreateSchema.partial();

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const is_active = searchParams.get('is_active');
    const criteria_type = searchParams.get('criteria_type');
    
    let query = supabase
      .from('multiplication_criteria')
      .select('*')
      .order('criteria_type', { ascending: true });

    // Filtros
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }
    
    if (criteria_type) {
      query = query.eq('criteria_type', criteria_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar critérios' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    
    const validatedData = CriteriaCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para criar critérios
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Apenas líderes, supervisores e pastores podem criar critérios
    if (!['leader', 'supervisor', 'pastor'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar critérios' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('multiplication_criteria')
      .insert({
        church_id: userProfile.church_id,
        name: validatedData.name,
        description: validatedData.description,
        criteria_type: validatedData.criteria_type,
        threshold_value: validatedData.threshold_value,
        weight: validatedData.weight,
        is_required: validatedData.is_required,
        is_active: validatedData.is_active,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Critério já existe' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao criar critério' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do critério é obrigatório' }, { status: 400 });
    }
    
    const validatedData = CriteriaUpdateSchema.parse(updateData);
    
    // Verificar se o usuário atual tem permissão para atualizar critérios
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Apenas líderes, supervisores e pastores podem atualizar critérios
    if (!['leader', 'supervisor', 'pastor'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Sem permissão para atualizar critérios' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('multiplication_criteria')
      .update(validatedData)
      .eq('id', id)
      .eq('church_id', userProfile.church_id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar critério' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Critério não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do critério é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o usuário atual tem permissão para deletar critérios
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Apenas pastores podem deletar critérios
    if (userProfile.role !== 'pastor') {
      return NextResponse.json({ error: 'Apenas pastores podem deletar critérios' }, { status: 403 });
    }

    const { error } = await supabase
      .from('multiplication_criteria')
      .delete()
      .eq('id', id)
      .eq('church_id', userProfile.church_id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao deletar critério' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Critério deletado com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}