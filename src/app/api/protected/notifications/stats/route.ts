import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationStats } from '@/types/notifications';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Buscar estatísticas básicas
    const { data: allNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('type, priority, read, created_at')
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('Erro ao buscar notificações para estatísticas:', notificationsError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    const notifications = allNotifications || [];

    // Calcular estatísticas
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;

    // Agrupar por tipo
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por prioridade
    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = notifications.filter(n => 
        n.created_at.startsWith(dateStr)
      ).length;
      
      recentActivity.push({
        date: dateStr,
        count
      });
    }

    const stats: NotificationStats = {
      total,
      unread,
      by_type: byType,
      by_priority: byPriority,
      recent_activity: recentActivity,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro na API de estatísticas de notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}