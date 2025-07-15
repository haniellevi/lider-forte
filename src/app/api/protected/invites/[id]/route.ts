import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema para atualização de convite
const InviteUpdateSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  message: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const resolvedParams = await params;
    
    // Verificar se o usuário atual tem permissão para ver convites
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores e supervisores podem ver convites)
    if (!['pastor', 'supervisor'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão para ver convites' }, { status: 403 });
    }

    // Buscar convite
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        created_by_profile:profiles!invites_created_by_fkey(id, full_name, role),
        church:churches(id, name)
      `)
      .eq('id', resolvedParams.id)
      .eq('church_id', currentUser.church_id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar convite' }, { status: 500 });
    }

    return NextResponse.json({ data: invite });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const body = await request.json();
    const resolvedParams = await params;
    
    // Validar dados de entrada
    const validatedData = InviteUpdateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para atualizar convites
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores e supervisores podem atualizar convites)
    if (!['pastor', 'supervisor'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sem permissão para atualizar convites' }, { status: 403 });
    }

    // Buscar convite existente
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('invites')
      .select('id, status, church_id, created_by')
      .eq('id', resolvedParams.id)
      .single();

    if (existingInviteError) {
      console.error('Existing invite error:', existingInviteError);
      
      if (existingInviteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar convite' }, { status: 500 });
    }

    // Verificar se o convite pertence à igreja do usuário
    if (existingInvite.church_id !== currentUser.church_id) {
      return NextResponse.json({ error: 'Convite não pertence à sua igreja' }, { status: 403 });
    }

    // Verificar se o convite já foi aceito ou rejeitado
    if (existingInvite.status === 'accepted') {
      return NextResponse.json({ error: 'Convite já foi aceito' }, { status: 409 });
    }

    if (existingInvite.status === 'rejected') {
      return NextResponse.json({ error: 'Convite já foi rejeitado' }, { status: 409 });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (validatedData.status) {
      updateData.status = validatedData.status;
      updateData.updated_at = new Date().toISOString();
      
      // Se está sendo aceito ou rejeitado, registrar quando
      if (validatedData.status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (validatedData.status === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
      }
    }
    
    if (validatedData.message) updateData.message = validatedData.message;
    if (validatedData.expires_at) updateData.expires_at = validatedData.expires_at;

    // Atualizar convite
    const { data: updatedInvite, error: updateError } = await supabase
      .from('invites')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        created_by_profile:profiles!invites_created_by_fkey(id, full_name, role),
        church:churches(id, name)
      `)
      .single();

    if (updateError) {
      console.error('Supabase error:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao atualizar convite' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedInvite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const resolvedParams = await params;
    
    // Verificar se o usuário atual tem permissão para deletar convites
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas pastores podem deletar convites)
    if (currentUser.role !== 'pastor') {
      return NextResponse.json({ error: 'Apenas pastores podem deletar convites' }, { status: 403 });
    }

    // Buscar convite para verificar se existe e pertence à igreja
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('invites')
      .select('id, church_id, status')
      .eq('id', resolvedParams.id)
      .single();

    if (existingInviteError) {
      console.error('Existing invite error:', existingInviteError);
      
      if (existingInviteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar convite' }, { status: 500 });
    }

    // Verificar se o convite pertence à igreja do usuário
    if (existingInvite.church_id !== currentUser.church_id) {
      return NextResponse.json({ error: 'Convite não pertence à sua igreja' }, { status: 403 });
    }

    // Não permitir deletar convites já aceitos
    if (existingInvite.status === 'accepted') {
      return NextResponse.json({ error: 'Não é possível deletar convite já aceito' }, { status: 409 });
    }

    // Deletar convite
    const { error: deleteError } = await supabase
      .from('invites')
      .delete()
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('Supabase error:', deleteError);
      
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao deletar convite' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Convite deletado com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}