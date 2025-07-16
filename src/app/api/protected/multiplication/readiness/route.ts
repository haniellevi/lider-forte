import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const cell_id = searchParams.get('cell_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const offset = (page - 1) * limit;

    // Verificar se o usuário atual tem permissão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    let query = supabase
      .from('multiplication_readiness')
      .select(`
        *,
        cell:cells!multiplication_readiness_cell_id_fkey(
          id,
          name,
          leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
          supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
          church_id
        )
      `, { count: 'exact' })
      .eq('cell.church_id', userProfile.church_id);

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }
    
    if (cell_id) {
      query = query.eq('cell_id', cell_id);
    }

    // Paginação e ordenação
    query = query
      .order('readiness_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados de prontidão' }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { church_id } = body;

    // Verificar se o usuário atual tem permissão para atualizar prontidão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Usar church_id do usuário se não fornecido ou se não for pastor
    const targetChurchId = (userProfile.role === 'pastor' && church_id) ? church_id : userProfile.church_id;

    if (targetChurchId !== userProfile.church_id && userProfile.role !== 'pastor') {
      return NextResponse.json({ error: 'Sem permissão para atualizar esta igreja' }, { status: 403 });
    }

    // Executar função para atualizar todas as células da igreja
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_all_cells_readiness', { p_church_id: targetChurchId });

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar prontidão das células' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: {
        cells_updated: updateResult,
        church_id: targetChurchId,
        message: `${updateResult} células foram atualizadas com sucesso`
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}