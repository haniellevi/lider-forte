import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema para filtros de métricas
const metricsFilterSchema = z.object({
  metric_types: z.string().optional(),
  period_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
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
    const filters = metricsFilterSchema.parse(Object.fromEntries(searchParams));
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Construir query para métricas
    let query = supabase
      .from('metrics')
      .select('*')
      .eq('church_id', profile.church_id);

    // Aplicar filtros
    if (filters.metric_types) {
      const metricTypes = filters.metric_types.split(',');
      query = query.in('metric_type', metricTypes);
    }

    if (filters.period_type) {
      query = query.eq('period_type', filters.period_type);
    }

    if (filters.start_date) {
      query = query.gte('period_start', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('period_end', filters.end_date);
    }

    // Ordenar por data mais recente
    query = query
      .order('period_start', { ascending: false })
      .limit(filters.limit);

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      metrics: metrics || [],
      filters_applied: filters,
    });

  } catch (error) {
    console.error('Erro na API de métricas:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}