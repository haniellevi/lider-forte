import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const AcceptInviteSchema = z.object({
  token: z.string().uuid('Token deve ser um UUID válido'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = AcceptInviteSchema.parse(body);
    
    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        *,
        church:churches(id, name)
      `)
      .eq('id', params.id)
      .eq('token', validatedData.token)
      .single();

    if (inviteError) {
      console.error('Invite error:', inviteError);
      
      if (inviteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado ou token inválido' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar convite' }, { status: 500 });
    }

    // Verificar se o convite ainda está pendente
    if (invite.status !== 'pending') {
      return NextResponse.json({ 
        error: `Convite já foi ${invite.status === 'accepted' ? 'aceito' : 'rejeitado'}` 
      }, { status: 409 });
    }

    // Verificar se o convite não expirou
    if (new Date(invite.expires_at) < new Date()) {
      // Marcar convite como expirado
      await supabase
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', params.id);
      
      return NextResponse.json({ error: 'Convite expirado' }, { status: 410 });
    }

    // Verificar se o usuário atual tem o mesmo email do convite
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('email, church_id')
      .eq('id', userId)
      .single();

    if (currentUserError) {
      console.error('Current user error:', currentUserError);
      return NextResponse.json({ error: 'Erro ao verificar usuário atual' }, { status: 500 });
    }

    if (currentUser.email !== invite.email) {
      return NextResponse.json({ 
        error: 'Este convite não foi enviado para o seu email' 
      }, { status: 403 });
    }

    // Verificar se o usuário já pertence a uma igreja
    if (currentUser.church_id) {
      return NextResponse.json({ 
        error: 'Você já pertence a uma igreja' 
      }, { status: 409 });
    }

    // Iniciar transação para aceitar convite
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('profiles')
      .update({
        church_id: invite.church_id,
        role: invite.role,
        full_name: invite.full_name,
        phone: invite.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(`
        *,
        church:churches(id, name)
      `)
      .single();

    if (updateUserError) {
      console.error('Update user error:', updateUserError);
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }

    // Marcar convite como aceito
    const { data: updatedInvite, error: updateInviteError } = await supabase
      .from('invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        created_by_profile:profiles!invites_created_by_fkey(id, full_name, role),
        church:churches(id, name)
      `)
      .single();

    if (updateInviteError) {
      console.error('Update invite error:', updateInviteError);
      // Reverter alteração no usuário
      await supabase
        .from('profiles')
        .update({
          church_id: null,
          role: 'member',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      return NextResponse.json({ error: 'Erro ao aceitar convite' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: {
        user: updatedUser,
        invite: updatedInvite,
      },
      message: 'Convite aceito com sucesso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Buscar convite público (sem autenticação)
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        expires_at,
        message,
        church:churches(id, name)
      `)
      .eq('id', params.id)
      .eq('token', token)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar convite' }, { status: 500 });
    }

    // Verificar se o convite não expirou
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Convite expirado',
        data: { ...invite, expired: true }
      }, { status: 410 });
    }

    return NextResponse.json({ data: invite });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}