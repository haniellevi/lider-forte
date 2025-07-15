import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Marcar todas as notificações não lidas como lidas
    const { data: updatedNotifications, error: updateError } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (updateError) {
      console.error('Erro ao marcar notificações como lidas:', updateError);
      return NextResponse.json({ error: 'Erro ao marcar notificações como lidas' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Todas as notificações foram marcadas como lidas',
      updated_count: updatedNotifications?.length || 0
    });

  } catch (error) {
    console.error('Erro na marcação de notificações como lidas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}