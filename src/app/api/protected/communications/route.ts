import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { CreateMassCommunicationRequest, MassCommunicationFilters } from '@/types/notifications';
import { z } from 'zod';

// Schema de validação para criação de comunicações em massa
const createMassCommunicationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título deve ter no máximo 255 caracteres'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  target_type: z.enum(['all', 'role', 'cell', 'custom']),
  target_criteria: z.record(z.any()).default({}),
  delivery_method: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).optional().default(['in_app']),
  scheduled_for: z.string().datetime().optional(),
});

// Schema para filtros
const massCommunicationFiltersSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).optional(),
  sender_id: z.string().optional(),
  target_type: z.enum(['all', 'role', 'cell', 'custom']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de consulta
    const filters = massCommunicationFiltersSchema.parse(Object.fromEntries(searchParams));
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Construir query
    let query = supabase
      .from('mass_communications')
      .select(`
        *,
        sender_profile:profiles!mass_communications_sender_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('church_id', profile.church_id);

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.sender_id) {
      query = query.eq('sender_id', filters.sender_id);
    }
    
    if (filters.target_type) {
      query = query.eq('target_type', filters.target_type);
    }
    
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Aplicar paginação
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: communications, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar comunicações:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      communications: communications || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });

  } catch (error) {
    console.error('Erro na API de comunicações:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const communicationData = createMassCommunicationSchema.parse(body);

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id e verificar permissões
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores e supervisores podem criar comunicações em massa)
    if (!['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem criar comunicações em massa' 
      }, { status: 403 });
    }

    // Criar a comunicação
    const { data: newCommunication, error: insertError } = await supabase
      .from('mass_communications')
      .insert({
        church_id: profile.church_id,
        sender_id: userId,
        ...communicationData,
      })
      .select(`
        *,
        sender_profile:profiles!mass_communications_sender_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Erro ao criar comunicação:', insertError);
      return NextResponse.json({ error: 'Erro ao criar comunicação' }, { status: 500 });
    }

    return NextResponse.json(newCommunication, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de comunicação:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}