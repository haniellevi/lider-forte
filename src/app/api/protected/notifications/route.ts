import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { CreateNotificationRequest, NotificationFilters } from '@/types/notifications';
import { z } from 'zod';

// Schema de validação para criação de notificações
const createNotificationSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título deve ter no máximo 255 caracteres'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['info', 'success', 'warning', 'error', 'message', 'alert', 'reminder', 'update']).optional().default('info'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  action_url: z.string().url().optional(),
  icon: z.string().optional(),
  sender_id: z.string().optional(),
  sender_name: z.string().optional(),
  sender_avatar: z.string().url().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  scheduled_for: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  delivery_method: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).optional().default(['in_app']),
  metadata: z.record(z.any()).optional().default({}),
});

// Schema para filtros de notificações
const notificationFiltersSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error', 'message', 'alert', 'reminder', 'update']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  read: z.coerce.boolean().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
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
    const filters = notificationFiltersSchema.parse(Object.fromEntries(searchParams));

    // Construir query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    // Aplicar filtros
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    
    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
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

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });

  } catch (error) {
    console.error('Erro na API de notificações:', error);
    
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
    const notificationData = createNotificationSchema.parse(body);

    const supabase = await createClient();
    
    // Verificar se o usuário tem permissão para criar notificações para outros usuários
    if (notificationData.user_id !== userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !['pastor', 'supervisor'].includes(profile?.role)) {
        return NextResponse.json({ 
          error: 'Sem permissão para criar notificações para outros usuários' 
        }, { status: 403 });
      }
    }

    // Criar a notificação
    const { data: newNotification, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar notificação:', insertError);
      return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 });
    }

    return NextResponse.json(newNotification, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de notificação:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}