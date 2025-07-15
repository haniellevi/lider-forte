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
    
    // Buscar perfil do usuário para verificar permissões
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar se tem permissão (pastor ou supervisor)
    if (!['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem gerar métricas manualmente' 
      }, { status: 403 });
    }

    // Executar função de geração de métricas
    const { error: generateError } = await supabase.rpc('generate_daily_metrics');

    if (generateError) {
      console.error('Erro ao gerar métricas:', generateError);
      return NextResponse.json({ error: 'Erro ao gerar métricas' }, { status: 500 });
    }

    // Buscar métricas recém geradas para retornar
    const today = new Date().toISOString().split('T')[0];
    const { data: generatedMetrics, error: fetchError } = await supabase
      .from('metrics')
      .select('*')
      .eq('church_id', profile.church_id)
      .gte('period_start', today)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erro ao buscar métricas geradas:', fetchError);
    }

    return NextResponse.json({
      message: 'Métricas geradas com sucesso',
      metrics_generated: generatedMetrics?.length || 0,
      metrics: generatedMetrics || []
    });

  } catch (error) {
    console.error('Erro na geração de métricas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}