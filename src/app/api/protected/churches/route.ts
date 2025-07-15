import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cnpjSchema, addressSchema } from '@/lib/validations/brazilian';

const ChurchCreateSchema = z.object({
  name: z.string().min(1, 'Nome da igreja é obrigatório'),
  cnpj: cnpjSchema.optional(),
  address: addressSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  founded_date: z.string().datetime().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
});

const ChurchUpdateSchema = ChurchCreateSchema.partial();

// Schema para filtros de busca
const ChurchSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de busca
    const validatedParams = ChurchSearchSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
    });

    const { page, limit, search, city, state } = validatedParams;
    const offset = (page - 1) * limit;

    // Verificar se o usuário atual tem permissão para listar igrejas
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Construir query baseada nas permissões
    let query = supabase
      .from('churches')
      .select(`
        *,
        profiles_count:profiles(count),
        cells_count:cells(count),
        pastors:profiles!inner(id, full_name, avatar_url)
      `, { count: 'exact' });

    // Filtrar por igreja se não for admin global
    if (currentUser.role !== 'admin') {
      query = query.eq('id', currentUser.church_id);
    }

    // Aplicar filtros
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (city) {
      query = query.contains('address', { city });
    }
    
    if (state) {
      query = query.contains('address', { state });
    }

    // Aplicar paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: churches, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar igrejas' }, { status: 500 });
    }

    return NextResponse.json({
      data: churches || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = ChurchCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para criar igrejas
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Apenas admin global ou usuários sem igreja podem criar igrejas
    if (currentUser.role !== 'admin' && currentUser.church_id) {
      return NextResponse.json({ error: 'Sem permissão para criar igrejas' }, { status: 403 });
    }

    // Verificar se já existe uma igreja com mesmo nome ou CNPJ
    if (validatedData.cnpj) {
      const { data: existingChurch, error: existingChurchError } = await supabase
        .from('churches')
        .select('id')
        .eq('cnpj', validatedData.cnpj)
        .maybeSingle();

      if (existingChurchError) {
        console.error('Error checking existing church:', existingChurchError);
        return NextResponse.json({ error: 'Erro ao verificar igreja existente' }, { status: 500 });
      }

      if (existingChurch) {
        return NextResponse.json({ error: 'Já existe uma igreja com este CNPJ' }, { status: 409 });
      }
    }

    // Criar nova igreja
    const { data: newChurch, error: createError } = await supabase
      .from('churches')
      .insert({
        name: validatedData.name,
        cnpj: validatedData.cnpj,
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website,
        description: validatedData.description,
        founded_date: validatedData.founded_date,
        vision: validatedData.vision,
        mission: validatedData.mission,
        values: validatedData.values,
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error:', createError);
      
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Igreja já existe' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao criar igreja' }, { status: 500 });
    }

    // Se o usuário que criou a igreja não tem igreja, associá-lo como pastor
    if (!currentUser.church_id) {
      const { error: updateUserError } = await supabase
        .from('profiles')
        .update({
          church_id: newChurch.id,
          role: 'pastor',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('Error updating user church:', updateUserError);
        // Não falhar a criação da igreja por causa disso
      }
    }

    return NextResponse.json({ 
      data: newChurch,
      message: 'Igreja criada com sucesso'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}