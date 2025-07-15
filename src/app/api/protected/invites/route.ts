import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { phoneSchema } from '@/lib/validations/brazilian';

// Schema para criação de convite
const InviteCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: phoneSchema.optional(),
  role: z.enum(['pastor', 'supervisor', 'leader', 'timoteo', 'member']).default('member'),
  message: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

// Schema para atualização de convite
const InviteUpdateSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  message: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

// Schema para filtros de busca
const InviteSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  role: z.enum(['pastor', 'supervisor', 'leader', 'timoteo', 'member']).optional(),
  created_by: z.string().uuid().optional(),
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
    const validatedParams = InviteSearchSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      created_by: searchParams.get('created_by') || undefined,
    });

    const { page, limit, search, status, role, created_by } = validatedParams;
    const offset = (page - 1) * limit;

    // Verificar se o usuário atual tem permissão para listar convites
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores e supervisores podem ver convites)
    if (!['pastor', 'supervisor'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão para ver convites' }, { status: 403 });
    }

    // Construir query
    let query = supabase
      .from('invites')
      .select(`
        *,
        created_by_profile:profiles!invites_created_by_fkey(id, full_name, role),
        church:churches(id, name)
      `, { count: 'exact' })
      .eq('church_id', currentUser.church_id);

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    // Aplicar paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: invites, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar convites' }, { status: 500 });
    }

    return NextResponse.json({
      data: invites || [],
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
    const validatedData = InviteCreateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para criar convites
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores e supervisores podem criar convites)
    if (!['pastor', 'supervisor'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar convites' }, { status: 403 });
    }

    // Verificar se já existe um convite pendente para este email
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('invites')
      .select('id, status')
      .eq('email', validatedData.email)
      .eq('church_id', currentUser.church_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInviteError) {
      console.error('Error checking existing invite:', existingInviteError);
      return NextResponse.json({ error: 'Erro ao verificar convite existente' }, { status: 500 });
    }

    if (existingInvite) {
      return NextResponse.json({ error: 'Já existe um convite pendente para este email' }, { status: 409 });
    }

    // Verificar se já existe um usuário com este email
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
      return NextResponse.json({ error: 'Já existe um usuário com este email' }, { status: 409 });
    }

    // Definir data de expiração (padrão: 7 dias)
    const expiresAt = validatedData.expires_at || 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Gerar token único para o convite
    const inviteToken = crypto.randomUUID();

    // Criar convite
    const { data: newInvite, error: createError } = await supabase
      .from('invites')
      .insert({
        email: validatedData.email,
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        role: validatedData.role,
        message: validatedData.message,
        expires_at: expiresAt,
        token: inviteToken,
        church_id: currentUser.church_id,
        created_by: userId,
        status: 'pending',
      })
      .select(`
        *,
        created_by_profile:profiles!invites_created_by_fkey(id, full_name, role),
        church:churches(id, name)
      `)
      .single();

    if (createError) {
      console.error('Supabase error:', createError);
      
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Convite já existe' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 });
    }

    // TODO: Enviar email de convite
    // await sendInviteEmail(newInvite);

    return NextResponse.json({ 
      data: newInvite,
      message: 'Convite criado com sucesso'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}