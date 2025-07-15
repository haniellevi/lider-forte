import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const AddMemberSchema = z.object({
  profile_id: z.string().uuid('ID do perfil deve ser um UUID válido'),
  success_ladder_score: z.number().int().min(0).max(100).default(0),
  is_timoteo: z.boolean().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const resolvedParams = await params;
    
    const { data, error } = await supabase
      .from('cell_members')
      .select(`
        id,
        joined_at,
        success_ladder_score,
        is_timoteo,
        profile:profiles(
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('cell_id', resolvedParams.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar membros da célula' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const resolvedParams = await params;
    
    const validatedData = AddMemberSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se a célula existe e pertence à mesma igreja
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select('church_id')
      .eq('id', resolvedParams.id)
      .single();

    if (cellError || !cell) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
    }

    if (cell.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Célula não pertence à sua igreja' }, { status: 403 });
    }

    // Verificar se o perfil existe e pertence à mesma igreja
    const { data: memberProfile, error: memberError } = await supabase
      .from('profiles')
      .select('church_id, full_name')
      .eq('id', validatedData.profile_id)
      .single();

    if (memberError || !memberProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 400 });
    }

    if (memberProfile.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Perfil deve pertencer à mesma igreja' }, { status: 400 });
    }

    // Verificar se o membro já está na célula
    const { data: existingMember, error: existingError } = await supabase
      .from('cell_members')
      .select('id')
      .eq('cell_id', resolvedParams.id)
      .eq('profile_id', validatedData.profile_id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'Membro já está nesta célula' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('cell_members')
      .insert({
        cell_id: resolvedParams.id,
        profile_id: validatedData.profile_id,
        success_ladder_score: validatedData.success_ladder_score,
        is_timoteo: validatedData.is_timoteo,
      })
      .select(`
        id,
        joined_at,
        success_ladder_score,
        is_timoteo,
        profile:profiles(
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Membro já está na célula' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao adicionar membro à célula' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const resolvedParams = await params;
    
    const profileId = searchParams.get('profile_id');
    
    if (!profileId) {
      return NextResponse.json({ error: 'ID do perfil é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário atual tem permissão
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Verificar se a célula existe e pertence à mesma igreja
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select('church_id, leader_id')
      .eq('id', resolvedParams.id)
      .single();

    if (cellError || !cell) {
      return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
    }

    if (cell.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Célula não pertence à sua igreja' }, { status: 403 });
    }

    // Não permitir remover o líder da célula
    if (cell.leader_id === profileId) {
      return NextResponse.json({ error: 'Não é possível remover o líder da célula' }, { status: 409 });
    }

    const { error } = await supabase
      .from('cell_members')
      .delete()
      .eq('cell_id', resolvedParams.id)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membro não encontrado na célula' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao remover membro da célula' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Membro removido da célula com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}