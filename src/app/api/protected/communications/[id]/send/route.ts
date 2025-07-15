import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da comunicação é obrigatório' }, { status: 400 });
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

    // Verificar se a comunicação existe e se o usuário tem permissão
    const { data: communication, error: fetchError } = await supabase
      .from('mass_communications')
      .select('*')
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Comunicação não encontrada' }, { status: 404 });
      }
      console.error('Erro ao buscar comunicação:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Verificar permissões
    const canSend = communication.sender_id === userId || 
                   ['pastor', 'supervisor'].includes(profile.role);
    
    if (!canSend) {
      return NextResponse.json({ error: 'Sem permissão para enviar esta comunicação' }, { status: 403 });
    }

    // Verificar se a comunicação pode ser enviada
    if (communication.status !== 'draft' && communication.status !== 'scheduled') {
      return NextResponse.json({ 
        error: `Comunicação não pode ser enviada. Status atual: ${communication.status}` 
      }, { status: 400 });
    }

    // Usar a função do banco para enviar a comunicação
    const { error: sendError } = await supabase.rpc('send_mass_communication', {
      communication_id: id
    });

    if (sendError) {
      console.error('Erro ao enviar comunicação:', sendError);
      return NextResponse.json({ error: 'Erro ao enviar comunicação' }, { status: 500 });
    }

    // Buscar a comunicação atualizada
    const { data: updatedCommunication, error: updateFetchError } = await supabase
      .from('mass_communications')
      .select(`
        *,
        sender_profile:profiles!mass_communications_sender_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (updateFetchError) {
      console.error('Erro ao buscar comunicação atualizada:', updateFetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Comunicação enviada com sucesso',
      communication: updatedCommunication
    });

  } catch (error) {
    console.error('Erro no envio de comunicação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}