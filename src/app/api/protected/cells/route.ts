import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CellCreateSchema = z.object({
  name: z.string().min(1, 'Nome da célula é obrigatório'),
  leader_id: z.string().uuid('ID do líder deve ser um UUID válido'),
  supervisor_id: z.string().uuid('ID do supervisor deve ser um UUID válido').optional(),
  parent_id: z.string().uuid('ID da célula pai deve ser um UUID válido').optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('Brasil'),
  }).optional(),
  meeting_day: z.number().int().min(0).max(6).optional(), // 0 = Domingo, 6 = Sábado
  meeting_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM').optional(),
});

const CellUpdateSchema = CellCreateSchema.partial();

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const leader_id = searchParams.get('leader_id');
    const supervisor_id = searchParams.get('supervisor_id');
    const parent_id = searchParams.get('parent_id');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('cells')
      .select(`
        *,
        leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
        supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
        parent_cell:cells!cells_parent_id_fkey(id, name),
        members:cell_members(count)
      `, { count: 'exact' });

    // Filtros
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (leader_id) {
      query = query.eq('leader_id', leader_id);
    }
    
    if (supervisor_id) {
      query = query.eq('supervisor_id', supervisor_id);
    }
    
    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    }

    // Paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar células' }, { status: 500 });
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
    
    const validatedData = CellCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para criar células
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se o líder pertence à mesma igreja
    const { data: leaderProfile, error: leaderError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', validatedData.leader_id)
      .single();

    if (leaderError || !leaderProfile) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 400 });
    }

    if (leaderProfile.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Líder deve pertencer à mesma igreja' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cells')
      .insert({
        church_id: userProfile.church_id,
        name: validatedData.name,
        leader_id: validatedData.leader_id,
        supervisor_id: validatedData.supervisor_id,
        parent_id: validatedData.parent_id,
        address: validatedData.address,
        meeting_day: validatedData.meeting_day,
        meeting_time: validatedData.meeting_time,
      })
      .select(`
        *,
        leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
        supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
        parent_cell:cells!cells_parent_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Célula já existe' }, { status: 409 });
      }
      
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Líder, supervisor ou célula pai não encontrados' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Erro ao criar célula' }, { status: 500 });
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