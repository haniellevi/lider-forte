import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { CreateReportRequest, ReportFilters } from '@/types/reports';
import { z } from 'zod';

// Schema de validação para criação de relatórios
const createReportSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional(),
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ]),
  parameters: z.record(z.any()).optional(),
  is_public: z.boolean().optional().default(false),
  scheduled_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

// Schema para filtros de busca
const reportsFilterSchema = z.object({
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ]).optional(),
  created_by: z.string().uuid().optional(),
  is_public: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
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
    const filters = reportsFilterSchema.parse(Object.fromEntries(searchParams));
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Construir query base
    let query = supabase
      .from('reports')
      .select(`
        *,
        created_by_profile:profiles!reports_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('church_id', profile.church_id);

    // Aplicar filtros
    if (filters.report_type) {
      query = query.eq('report_type', filters.report_type);
    }
    
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
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

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });

  } catch (error) {
    console.error('Erro na API de relatórios:', error);
    
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
    const reportData = createReportSchema.parse(body);

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

    // Verificar permissões para relatórios públicos
    if (reportData.is_public && !['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem criar relatórios públicos' 
      }, { status: 403 });
    }

    // Criar o relatório
    const { data: newReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        church_id: profile.church_id,
        created_by: userId,
        ...reportData,
      })
      .select(`
        *,
        created_by_profile:profiles!reports_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Erro ao criar relatório:', insertError);
      return NextResponse.json({ error: 'Erro ao criar relatório' }, { status: 500 });
    }

    return NextResponse.json(newReport, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de relatório:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}