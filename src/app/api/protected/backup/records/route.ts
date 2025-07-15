import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { BackupRecordFilters, CreateBackupRequest } from '@/types/backup';
import { z } from 'zod';

// Schema de validação para criação de backups
const createBackupSchema = z.object({
  configuration_id: z.string().uuid().optional(),
  backup_type: z.enum(['full', 'incremental', 'differential']),
  tables_included: z.array(z.string()).optional().default(['*']),
});

// Schema para filtros
const backupRecordFiltersSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'expired']).optional(),
  backup_type: z.enum(['full', 'incremental', 'differential']).optional(),
  configuration_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
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
    const filters = backupRecordFiltersSchema.parse(Object.fromEntries(searchParams));
    
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
      .from('backup_records')
      .select(`
        *,
        configuration:backup_configurations(
          id,
          name,
          frequency,
          backup_type
        ),
        created_by_profile:profiles!backup_records_created_by_fkey(
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
    
    if (filters.backup_type) {
      query = query.eq('backup_type', filters.backup_type);
    }
    
    if (filters.configuration_id) {
      query = query.eq('configuration_id', filters.configuration_id);
    }
    
    if (filters.start_date) {
      query = query.gte('started_at', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('started_at', filters.end_date);
    }

    // Aplicar paginação
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    
    query = query
      .order('started_at', { ascending: false })
      .range(from, to);

    const { data: records, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar registros de backup:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      records: records || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });

  } catch (error) {
    console.error('Erro na API de registros de backup:', error);
    
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
    const backupData = createBackupSchema.parse(body);

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

    // Verificar permissões (apenas pastores e supervisores podem iniciar backups)
    if (!['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem iniciar backups' 
      }, { status: 403 });
    }

    // Validar configuração se fornecida
    if (backupData.configuration_id) {
      const { data: configuration, error: configError } = await supabase
        .from('backup_configurations')
        .select('id, name, is_active')
        .eq('id', backupData.configuration_id)
        .eq('church_id', profile.church_id)
        .single();

      if (configError || !configuration) {
        return NextResponse.json({ error: 'Configuração de backup não encontrada' }, { status: 404 });
      }

      if (!configuration.is_active) {
        return NextResponse.json({ error: 'Configuração de backup está inativa' }, { status: 400 });
      }
    }

    // Verificar se não há backup em execução
    const { data: runningBackups, error: runningError } = await supabase
      .from('backup_records')
      .select('id')
      .eq('church_id', profile.church_id)
      .in('status', ['pending', 'running']);

    if (runningError) {
      console.error('Erro ao verificar backups em execução:', runningError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    if (runningBackups && runningBackups.length > 0) {
      return NextResponse.json({ 
        error: 'Já existe um backup em execução. Aguarde a conclusão antes de iniciar outro.' 
      }, { status: 409 });
    }

    // Criar o registro de backup usando a função do banco
    const { data: backupId, error: createError } = await supabase.rpc('create_backup_record', {
      p_church_id: profile.church_id,
      p_configuration_id: backupData.configuration_id,
      p_backup_type: backupData.backup_type,
      p_tables_included: backupData.tables_included,
      p_created_by: userId
    });

    if (createError) {
      console.error('Erro ao criar registro de backup:', createError);
      return NextResponse.json({ error: 'Erro ao criar backup' }, { status: 500 });
    }

    // Log da criação do backup
    await supabase.rpc('log_backup_operation', {
      p_church_id: profile.church_id,
      p_backup_record_id: backupId,
      p_operation_type: 'backup',
      p_level: 'info',
      p_message: 'Backup manual iniciado pelo usuário',
      p_details: {
        backup_type: backupData.backup_type,
        tables_included: backupData.tables_included,
        configuration_id: backupData.configuration_id
      }
    });

    // Buscar o registro criado para retornar
    const { data: newBackup, error: fetchError } = await supabase
      .from('backup_records')
      .select(`
        *,
        configuration:backup_configurations(
          id,
          name,
          frequency,
          backup_type
        ),
        created_by_profile:profiles!backup_records_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', backupId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar backup criado:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Backup iniciado com sucesso',
      backup: newBackup
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de backup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}