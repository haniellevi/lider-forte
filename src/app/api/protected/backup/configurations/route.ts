import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { BackupConfigurationFilters, CreateBackupConfigurationRequest } from '@/types/backup';
import { z } from 'zod';

// Schema de validação para criação de configurações de backup
const createBackupConfigurationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'manual']),
  backup_type: z.enum(['full', 'incremental', 'differential']),
  include_tables: z.array(z.string()).optional().default(['*']),
  exclude_tables: z.array(z.string()).optional().default([]),
  retention_days: z.number().min(1).max(365).optional().default(30),
  is_active: z.boolean().optional().default(true),
});

// Schema para filtros
const backupConfigurationFiltersSchema = z.object({
  is_active: z.coerce.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional(),
  backup_type: z.enum(['full', 'incremental', 'differential']).optional(),
  search: z.string().optional(),
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
    const filters = backupConfigurationFiltersSchema.parse(Object.fromEntries(searchParams));
    
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
      .from('backup_configurations')
      .select(`
        *,
        created_by_profile:profiles!backup_configurations_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('church_id', profile.church_id);

    // Aplicar filtros
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    if (filters.frequency) {
      query = query.eq('frequency', filters.frequency);
    }
    
    if (filters.backup_type) {
      query = query.eq('backup_type', filters.backup_type);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: configurations, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar configurações de backup:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      configurations: configurations || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });

  } catch (error) {
    console.error('Erro na API de configurações de backup:', error);
    
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
    const configurationData = createBackupConfigurationSchema.parse(body);

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

    // Verificar permissões (apenas pastores e supervisores podem gerenciar backups)
    if (!['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem gerenciar configurações de backup' 
      }, { status: 403 });
    }

    // Calcular próximo backup se não for manual
    let nextBackupAt = null;
    if (configurationData.frequency !== 'manual') {
      const { data: nextBackup } = await supabase.rpc('calculate_next_backup_time', {
        frequency_param: configurationData.frequency
      });
      nextBackupAt = nextBackup;
    }

    // Criar a configuração
    const { data: newConfiguration, error: insertError } = await supabase
      .from('backup_configurations')
      .insert({
        church_id: profile.church_id,
        created_by: userId,
        next_backup_at: nextBackupAt,
        ...configurationData,
      })
      .select(`
        *,
        created_by_profile:profiles!backup_configurations_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Erro ao criar configuração de backup:', insertError);
      return NextResponse.json({ error: 'Erro ao criar configuração de backup' }, { status: 500 });
    }

    return NextResponse.json(newConfiguration, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de configuração de backup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}