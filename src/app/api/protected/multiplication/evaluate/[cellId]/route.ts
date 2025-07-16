import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cellId: string } }
) {
  try {
    const supabase = await createServerClient();
    const { cellId } = params;
    
    if (!cellId) {
      return NextResponse.json({ error: 'ID da célula é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário atual tem permissão para avaliar esta célula
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se a célula pertence à igreja do usuário
    const { data: cellData, error: cellError } = await supabase
      .from('cells')
      .select('church_id, leader_id')
      .eq('id', cellId)
      .single();

    if (cellError || !cellData) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
    }

    if (cellData.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Sem permissão para avaliar esta célula' }, { status: 403 });
    }

    // Executar a função de avaliação
    const { data: evaluationData, error: evaluationError } = await supabase
      .rpc('evaluate_multiplication_criteria', { p_cell_id: cellId });

    if (evaluationError) {
      console.error('Supabase evaluation error:', evaluationError);
      return NextResponse.json({ error: 'Erro ao avaliar célula' }, { status: 500 });
    }

    if (!evaluationData || evaluationData.length === 0) {
      return NextResponse.json({ error: 'Nenhum resultado de avaliação encontrado' }, { status: 404 });
    }

    const result = evaluationData[0];

    // Inserir ou atualizar resultado na tabela multiplication_readiness
    const { data: readinessData, error: readinessError } = await supabase
      .from('multiplication_readiness')
      .upsert({
        cell_id: cellId,
        readiness_score: result.readiness_score,
        status: result.status,
        criteria_results: result.criteria_results,
        projected_date: result.projected_date,
        confidence_level: result.confidence_level,
        recommendations: result.recommendations,
        blocking_factors: result.blocking_factors,
        last_evaluated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (readinessError) {
      console.error('Supabase readiness error:', readinessError);
      return NextResponse.json({ error: 'Erro ao salvar resultado da avaliação' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: {
        evaluation: result,
        readiness: readinessData
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { cellId: string } }
) {
  try {
    const supabase = await createServerClient();
    const { cellId } = params;
    
    if (!cellId) {
      return NextResponse.json({ error: 'ID da célula é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário atual tem permissão para re-avaliar esta célula
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se a célula pertence à igreja do usuário
    const { data: cellData, error: cellError } = await supabase
      .from('cells')
      .select('church_id, leader_id')
      .eq('id', cellId)
      .single();

    if (cellError || !cellData) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
    }

    if (cellData.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Sem permissão para avaliar esta célula' }, { status: 403 });
    }

    // Forçar reavaliação executando a função
    const { data: evaluationData, error: evaluationError } = await supabase
      .rpc('evaluate_multiplication_criteria', { p_cell_id: cellId });

    if (evaluationError) {
      console.error('Supabase evaluation error:', evaluationError);
      return NextResponse.json({ error: 'Erro ao reavaliar célula' }, { status: 500 });
    }

    if (!evaluationData || evaluationData.length === 0) {
      return NextResponse.json({ error: 'Nenhum resultado de avaliação encontrado' }, { status: 404 });
    }

    const result = evaluationData[0];

    // Atualizar resultado na tabela multiplication_readiness
    const { data: readinessData, error: readinessError } = await supabase
      .from('multiplication_readiness')
      .upsert({
        cell_id: cellId,
        readiness_score: result.readiness_score,
        status: result.status,
        criteria_results: result.criteria_results,
        projected_date: result.projected_date,
        confidence_level: result.confidence_level,
        recommendations: result.recommendations,
        blocking_factors: result.blocking_factors,
        last_evaluated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (readinessError) {
      console.error('Supabase readiness error:', readinessError);
      return NextResponse.json({ error: 'Erro ao salvar resultado da reavaliação' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: {
        evaluation: result,
        readiness: readinessData,
        message: 'Célula reavaliada com sucesso'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}