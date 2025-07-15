import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Buscar estatísticas usando a função do banco
    const { data: statistics, error: statsError } = await supabase.rpc('get_backup_statistics', {
      p_church_id: profile.church_id
    });

    if (statsError) {
      console.error('Erro ao buscar estatísticas de backup:', statsError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar informações adicionais
    const [
      { data: activeConfigurations },
      { data: recentBackups },
      { data: nextScheduledBackup },
      { data: expiringSoonBackups }
    ] = await Promise.all([
      // Configurações ativas
      supabase
        .from('backup_configurations')
        .select('id, name, frequency, next_backup_at')
        .eq('church_id', profile.church_id)
        .eq('is_active', true),
      
      // Últimos 5 backups
      supabase
        .from('backup_records')
        .select(`
          id,
          backup_type,
          status,
          started_at,
          completed_at,
          file_size_bytes,
          configuration:backup_configurations(name)
        `)
        .eq('church_id', profile.church_id)
        .order('started_at', { ascending: false })
        .limit(5),
      
      // Próximo backup agendado
      supabase
        .from('backup_configurations')
        .select('id, name, next_backup_at')
        .eq('church_id', profile.church_id)
        .eq('is_active', true)
        .not('next_backup_at', 'is', null)
        .order('next_backup_at', { ascending: true })
        .limit(1),
      
      // Backups expirando em breve (próximos 7 dias)
      supabase
        .from('backup_records')
        .select('id, configuration:backup_configurations(name), expires_at')
        .eq('church_id', profile.church_id)
        .eq('status', 'completed')
        .gte('expires_at', new Date().toISOString())
        .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('expires_at', { ascending: true })
    ]);

    // Calcular tendências dos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trendsData } = await supabase
      .from('backup_records')
      .select('status, started_at, file_size_bytes')
      .eq('church_id', profile.church_id)
      .gte('started_at', thirtyDaysAgo);

    // Processar dados de tendência
    const trends = {
      success_rate: 0,
      avg_backup_time: 0,
      size_trend: 'stable' as 'up' | 'down' | 'stable',
      frequency_compliance: 0
    };

    if (trendsData && trendsData.length > 0) {
      const successfulBackups = trendsData.filter(b => b.status === 'completed');
      trends.success_rate = Math.round((successfulBackups.length / trendsData.length) * 100);
      
      // Tendência de tamanho (comparar primeira e segunda metade do período)
      const halfPoint = Math.floor(trendsData.length / 2);
      const firstHalf = trendsData.slice(0, halfPoint);
      const secondHalf = trendsData.slice(halfPoint);
      
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const avgSizeFirst = firstHalf.reduce((sum, b) => sum + (b.file_size_bytes || 0), 0) / firstHalf.length;
        const avgSizeSecond = secondHalf.reduce((sum, b) => sum + (b.file_size_bytes || 0), 0) / secondHalf.length;
        
        const sizeDiff = ((avgSizeSecond - avgSizeFirst) / avgSizeFirst) * 100;
        if (sizeDiff > 10) trends.size_trend = 'up';
        else if (sizeDiff < -10) trends.size_trend = 'down';
      }
    }

    const response = {
      ...statistics,
      additional_info: {
        active_configurations: activeConfigurations?.length || 0,
        next_scheduled_backup: nextScheduledBackup?.[0] || null,
        expiring_soon_count: expiringSoonBackups?.length || 0,
        trends
      },
      recent_backups: recentBackups || [],
      expiring_soon: expiringSoonBackups || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de estatísticas de backup:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}