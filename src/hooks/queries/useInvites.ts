import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import { useShowToast } from '@/store';
import { Database } from '@/lib/supabase/types';

// Temporary type definition based on migration until types are regenerated
interface Invite {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Database['public']['Enums']['user_role'];
  message: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  church_id: string;
  created_by: string;
  accepted_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InviteInsert {
  id?: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role?: Database['public']['Enums']['user_role'];
  message?: string | null;
  token?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  church_id: string;
  created_by: string;
  accepted_by?: string | null;
  expires_at?: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface InviteUpdate {
  id?: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
  role?: Database['public']['Enums']['user_role'];
  message?: string | null;
  token?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  church_id?: string;
  created_by?: string;
  accepted_by?: string | null;
  expires_at?: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

interface InviteWithChurch extends Invite {
  church?: {
    id: string;
    name: string;
  };
  invited_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useChurchInvites(params: {
  status?: InviteStatus;
  page?: number;
  limit?: number;
}) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['church-invites', user?.id, params],
    queryFn: async (): Promise<InviteWithChurch[]> => {
      if (!user?.id) return [];
      
      // Buscar o perfil do usuário para obter o church_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile?.church_id) {
        return [];
      }
      
      let query = supabase
        .from('invites')
        .select(`
          *,
          church:churches(id, name),
          invited_by_user:profiles!invites_invited_by_fkey(id, name, email)
        `)
        .eq('church_id', profile.church_id);
      
      if (params.status) {
        query = query.eq('status', params.status);
      }
      
      const limit = params.limit || 10;
      const offset = ((params.page || 1) - 1) * limit;
      
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useUserInvites() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['user-invites', user?.emailAddresses?.[0]?.emailAddress],
    queryFn: async (): Promise<InviteWithChurch[]> => {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (!email) return [];
      
      const { data, error } = await supabase
        .from('invites')
        .select(`
          *,
          church:churches(id, name),
          invited_by_user:profiles!invites_invited_by_fkey(id, name, email)
        `)
        .eq('email', email)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user?.emailAddresses?.[0]?.emailAddress,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (params: {
      email: string;
      role: Database['public']['Enums']['user_role'];
      message?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Buscar o perfil do usuário para obter o church_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id, name')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile?.church_id) {
        throw new Error('Church not found');
      }
      
      // Verificar se já existe um convite pendente para este email
      const { data: existingInvite, error: existingError } = await supabase
        .from('invites')
        .select('id, status')
        .eq('email', params.email)
        .eq('church_id', profile.church_id)
        .eq('status', 'pending')
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }
      
      if (existingInvite) {
        throw new Error('Pending invite already exists for this email');
      }
      
      // Verificar se o usuário já existe e pertence a uma igreja
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, church_id')
        .eq('email', params.email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser?.church_id) {
        throw new Error('User already belongs to a church');
      }
      
      // Criar o convite
      const { data, error } = await supabase
        .from('invites')
        .insert({
          email: params.email,
          role: params.role,
          church_id: profile.church_id,
          invited_by: user.id,
          message: params.message,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-invites'] });
      showToast({ type: 'success', message: 'Convite criado com sucesso!' });
    },
    onError: (error) => {
      console.error('Error creating invite:', error);
      let message = 'Erro ao criar convite';
      
      if (error.message === 'Pending invite already exists for this email') {
        message = 'Já existe um convite pendente para este email';
      } else if (error.message === 'User already belongs to a church') {
        message = 'Este usuário já pertence a uma igreja';
      }
      
      showToast({ type: 'error', message });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Buscar o convite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('id', inviteId)
        .eq('email', user.emailAddresses?.[0]?.emailAddress)
        .eq('status', 'pending')
        .single();
      
      if (inviteError || !invite) {
        throw new Error('Invite not found or not valid');
      }
      
      // Verificar se o convite expirou
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite has expired');
      }
      
      // Atualizar o perfil do usuário com a igreja e role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          church_id: invite.church_id,
          role: invite.role,
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Marcar o convite como aceito
      const { data, error } = await supabase
        .from('invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      showToast({ type: 'success', message: 'Convite aceito com sucesso!' });
    },
    onError: (error) => {
      console.error('Error accepting invite:', error);
      let message = 'Erro ao aceitar convite';
      
      if (error.message === 'Invite has expired') {
        message = 'Este convite expirou';
      } else if (error.message === 'Invite not found or not valid') {
        message = 'Convite não encontrado ou inválido';
      }
      
      showToast({ type: 'error', message });
    },
  });
}

export function useRejectInvite() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('invites')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .eq('email', user.emailAddresses?.[0]?.emailAddress)
        .eq('status', 'pending')
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      showToast({ type: 'success', message: 'Convite rejeitado' });
    },
    onError: (error) => {
      console.error('Error rejecting invite:', error);
      showToast({ type: 'error', message: 'Erro ao rejeitar convite' });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)
        .eq('invited_by', user.id)
        .eq('status', 'pending')
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-invites'] });
      showToast({ type: 'success', message: 'Convite cancelado' });
    },
    onError: (error) => {
      console.error('Error canceling invite:', error);
      showToast({ type: 'error', message: 'Erro ao cancelar convite' });
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Atualizar a data de expiração para 7 dias a partir de agora
      const { data, error } = await supabase
        .from('invites')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .eq('invited_by', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-invites'] });
      showToast({ type: 'success', message: 'Convite reenviado com sucesso!' });
    },
    onError: (error) => {
      console.error('Error resending invite:', error);
      showToast({ type: 'error', message: 'Erro ao reenviar convite' });
    },
  });
}