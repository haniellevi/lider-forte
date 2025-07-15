import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { 
  cpfSchema, 
  phoneSchema, 
  addressSchema,
  personSchema 
} from '@/lib/validations/brazilian';

// Schema para criação de usuário
const UserCreateSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: phoneSchema.optional(),
  cpf: cpfSchema.optional(),
  role: z.enum(['pastor', 'supervisor', 'leader', 'timoteo', 'member']).default('member'),
  church_id: z.string().uuid('ID da igreja deve ser um UUID válido'),
  address: addressSchema.optional(),
  birth_date: z.string().datetime().optional(),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  marital_status: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']).optional(),
  profession: z.string().optional(),
  emergency_contact: z.object({
    name: z.string(),
    phone: phoneSchema,
    relationship: z.string(),
  }).optional(),
});

// Schema para atualização de usuário
const UserUpdateSchema = UserCreateSchema.partial().omit({ church_id: true });

// Schema para filtros de busca
const UserSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  role: z.enum(['pastor', 'supervisor', 'leader', 'timoteo', 'member']).optional(),
  church_id: z.string().uuid().optional(),
  has_cell: z.coerce.boolean().optional(),
  is_active: z.coerce.boolean().optional(),
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
    const validatedParams = UserSearchSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      church_id: searchParams.get('church_id') || undefined,
      has_cell: searchParams.get('has_cell') || undefined,
      is_active: searchParams.get('is_active') || undefined,
    });

    const { page, limit, search, role, church_id, has_cell, is_active } = validatedParams;
    const offset = (page - 1) * limit;

    // Verificar se o usuário atual tem permissão para listar usuários
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
      .from('profiles')
      .select(`
        *,
        church:churches(id, name),
        led_cells:cells!cells_leader_id_fkey(id, name),
        supervised_cells:cells!cells_supervisor_id_fkey(id, name),
        cell_memberships:cell_members(
          id,
          cell:cells(id, name),
          success_ladder_score,
          is_timoteo,
          joined_at
        )
      `, { count: 'exact' });

    // Filtrar por igreja baseado no role
    if (currentUser.role === 'pastor') {
      // Pastor pode ver todos os usuários de sua igreja
      query = query.eq('church_id', currentUser.church_id);
    } else if (currentUser.role === 'supervisor') {
      // Supervisor pode ver usuários de sua rede
      query = query.eq('church_id', currentUser.church_id);
    } else if (currentUser.role === 'leader') {
      // Líder pode ver apenas membros de sua célula
      const { data: leaderCells } = await supabase
        .from('cells')
        .select('id')
        .eq('leader_id', userId);
      
      if (leaderCells && leaderCells.length > 0) {
        const cellIds = leaderCells.map(cell => cell.id);
        query = query.in('cell_memberships.cell_id', cellIds);
      } else {
        // Se não tem células, pode ver apenas a si mesmo
        query = query.eq('id', userId);
      }
    } else {
      // Membros podem ver apenas a si mesmos
      query = query.eq('id', userId);
    }

    // Aplicar filtros opcionais
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (church_id && currentUser.role === 'pastor') {
      query = query.eq('church_id', church_id);
    }
    
    if (has_cell !== undefined) {
      if (has_cell) {
        query = query.not('cell_memberships', 'is', null);
      } else {
        query = query.is('cell_memberships', null);
      }
    }
    
    if (is_active !== undefined) {
      // Assumindo que usuários ativos são aqueles que têm church_id
      if (is_active) {
        query = query.not('church_id', 'is', null);
      } else {
        query = query.is('church_id', null);
      }
    }

    // Aplicar paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
    }

    return NextResponse.json({
      data: users || [],
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
    const validatedData = UserCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para criar usuários
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões baseadas no role
    if (currentUser.role === 'member' || currentUser.role === 'timoteo') {
      return NextResponse.json({ error: 'Sem permissão para criar usuários' }, { status: 403 });
    }

    // Verificar se a igreja existe e se o usuário tem acesso a ela
    const { data: targetChurch, error: churchError } = await supabase
      .from('churches')
      .select('id')
      .eq('id', validatedData.church_id)
      .single();

    if (churchError || !targetChurch) {
      return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário tem permissão para criar usuários nesta igreja
    if (currentUser.church_id !== validatedData.church_id) {
      return NextResponse.json({ error: 'Sem permissão para criar usuários nesta igreja' }, { status: 403 });
    }

    // Verificar se já existe um usuário com o mesmo email
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .maybeSingle();

    if (existingUserError) {
      console.error('Error checking existing user:', existingUserError);
      return NextResponse.json({ error: 'Erro ao verificar usuário existente' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário com este email já existe' }, { status: 409 });
    }

    // Criar novo usuário
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(), // Gerar ID temporário (será substituído pelo Clerk)
        full_name: validatedData.full_name,
        email: validatedData.email,
        phone: validatedData.phone,
        cpf: validatedData.cpf,
        role: validatedData.role,
        church_id: validatedData.church_id,
        address: validatedData.address,
        birth_date: validatedData.birth_date,
        gender: validatedData.gender,
        marital_status: validatedData.marital_status,
        profession: validatedData.profession,
        emergency_contact: validatedData.emergency_contact,
      })
      .select(`
        *,
        church:churches(id, name)
      `)
      .single();

    if (createError) {
      console.error('Supabase error:', createError);
      
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }

    return NextResponse.json({ data: newUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}