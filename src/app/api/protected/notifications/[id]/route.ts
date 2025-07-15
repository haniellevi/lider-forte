import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema de validação para atualização de notificações
const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();

    // Buscar a notificação
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }
      console.error('Erro ao buscar notificação:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Erro na API de notificação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const updateData = updateNotificationSchema.parse(body);

    const supabase = await createClient();

    // Verificar se a notificação existe e pertence ao usuário
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }
      console.error('Erro ao buscar notificação:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Atualizar a notificação
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar notificação:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 });
    }

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error('Erro na atualização de notificação:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    const supabase = await createClient();

    // Verificar se a notificação existe e pertence ao usuário
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }
      console.error('Erro ao buscar notificação:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Excluir a notificação
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao excluir notificação:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir notificação' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notificação excluída com sucesso' });

  } catch (error) {
    console.error('Erro na exclusão de notificação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}