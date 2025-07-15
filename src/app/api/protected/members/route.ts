import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MemberCreateSchema = z.object({
  profile_id: z.string().uuid('ID do perfil deve ser um UUID válido'),
  cell_id: z.string().uuid('ID da célula deve ser um UUID válido'),
  success_ladder_score: z.number().int().min(0).default(0),
  is_timoteo: z.boolean().default(false),
});

const MemberUpdateSchema = z.object({
  success_ladder_score: z.number().int().min(0).optional(),
  is_timoteo: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const cell_id = searchParams.get('cell_id');
    const is_timoteo = searchParams.get('is_timoteo');
    const min_score = searchParams.get('min_score');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('cell_members')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        cell:cells(id, name, leader_id)
      `, { count: 'exact' });

    // Filtros
    if (search) {
      query = query.or(`profile.full_name.ilike.%${search}%,cell.name.ilike.%${search}%`);
    }
    
    if (cell_id) {
      query = query.eq('cell_id', cell_id);
    }
    
    if (is_timoteo !== null) {
      query = query.eq('is_timoteo', is_timoteo === 'true');
    }
    
    if (min_score) {
      query = query.gte('success_ladder_score', parseInt(min_score));
    }

    // Paginação
    query = query
      .order('success_ladder_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    
    const validatedData = MemberCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para adicionar membros
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se o perfil e a célula pertencem à mesma igreja
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', validatedData.profile_id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 400 });
    }

    const { data: cellData, error: cellError } = await supabase
      .from('cells')
      .select('church_id')
      .eq('id', validatedData.cell_id)
      .single();

    if (cellError || !cellData) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 400 });
    }

    if (profileData.church_id !== userProfile.church_id || 
        cellData.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Perfil e célula devem pertencer à mesma igreja' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cell_members')
      .insert({
        profile_id: validatedData.profile_id,
        cell_id: validatedData.cell_id,
        success_ladder_score: validatedData.success_ladder_score,
        is_timoteo: validatedData.is_timoteo,
      })
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        cell:cells(id, name, leader_id)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Membro já pertence a esta célula' }, { status: 409 });
      }
      
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Perfil ou célula não encontrados' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
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