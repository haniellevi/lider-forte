import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const TransferSchema = z.object({
  member_id: z.string().uuid('ID do membro deve ser um UUID válido'),
  new_cell_id: z.string().uuid('ID da nova célula deve ser um UUID válido'),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    
    const validatedData = TransferSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para transferir membros
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Buscar informações do membro atual
    const { data: currentMember, error: memberError } = await supabase
      .from('cell_members')
      .select(`
        *,
        profile:profiles(id, full_name, church_id),
        cell:cells(id, name, church_id)
      `)
      .eq('id', validatedData.member_id)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar se a nova célula existe e pertence à mesma igreja
    const { data: newCell, error: newCellError } = await supabase
      .from('cells')
      .select('id, name, church_id')
      .eq('id', validatedData.new_cell_id)
      .single();

    if (newCellError || !newCell) {
      return NextResponse.json({ error: 'Nova célula não encontrada' }, { status: 404 });
    }

    // Verificar se tudo pertence à mesma igreja
    if (currentMember.profile.church_id !== userProfile.church_id || 
        currentMember.cell.church_id !== userProfile.church_id ||
        newCell.church_id !== userProfile.church_id) {
      return NextResponse.json({ error: 'Transferência deve ser dentro da mesma igreja' }, { status: 400 });
    }

    // Verificar se não é a mesma célula
    if (currentMember.cell_id === validatedData.new_cell_id) {
      return NextResponse.json({ error: 'Membro já pertence a esta célula' }, { status: 400 });
    }

    // Verificar se já existe um membro com este perfil na nova célula
    const { data: existingMember, error: existingError } = await supabase
      .from('cell_members')
      .select('id')
      .eq('profile_id', currentMember.profile_id)
      .eq('cell_id', validatedData.new_cell_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing member:', existingError);
      return NextResponse.json({ error: 'Erro ao verificar membro existente' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ error: 'Membro já pertence à célula destino' }, { status: 409 });
    }

    // Realizar a transferência
    const { data: updatedMember, error: updateError } = await supabase
      .from('cell_members')
      .update({
        cell_id: validatedData.new_cell_id,
        joined_at: new Date().toISOString(),
      })
      .eq('id', validatedData.member_id)
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        cell:cells(
          id, 
          name, 
          leader_id,
          leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url)
        )
      `)
      .single();

    if (updateError) {
      console.error('Supabase error:', updateError);
      return NextResponse.json({ error: 'Erro ao realizar transferência' }, { status: 500 });
    }

    // Registrar histórico da transferência (se tiver tabela de histórico)
    // TODO: Implementar log de transferências quando a tabela for criada

    return NextResponse.json({ 
      data: updatedMember,
      message: `Membro transferido de "${currentMember.cell.name}" para "${newCell.name}" com sucesso`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}