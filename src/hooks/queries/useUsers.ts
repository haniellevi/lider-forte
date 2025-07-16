import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import { useShowToast } from '@/store';
import { Tables, TablesInsert, TablesUpdate, Database } from '@/lib/supabase/types';

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface ChurchUser extends Profile {
  joined_at: string;
  last_active: string | null;
}

export function useChurchUsers(params: {
  search?: string;
  role?: Database['public']['Enums']['user_role'];
  page?: number;
  limit?: number;
}) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['church-users', user?.id, params],
    queryFn: async (): Promise<ChurchUser[]> => {
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
        .from('profiles')
        .select('*')
        .eq('church_id', profile.church_id);
      
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }
      
      if (params.role) {
        query = query.eq('role', params.role);
      }
      
      const limit = params.limit || 10;
      const offset = ((params.page || 1) - 1) * limit;
      
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(user => ({
        ...user,
        role: user.role || 'member',
        joined_at: user.created_at,
        last_active: user.updated_at,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (params: { userId: string; role: Database['public']['Enums']['user_role'] }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: params.role })
        .eq('id', params.userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['church-users'] });
      showToast({ type: 'success', message: 'Papel do usuário atualizado com sucesso!' });
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      showToast({ type: 'error', message: 'Erro ao atualizar papel do usuário' });
    },
  });
}

export function useRemoveUserFromChurch() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ church_id: null, role: null })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-users'] });
      showToast({ type: 'success', message: 'Usuário removido da igreja com sucesso!' });
    },
    onError: (error) => {
      console.error('Error removing user from church:', error);
      showToast({ type: 'error', message: 'Erro ao remover usuário da igreja' });
    },
  });
}

export function useInviteUser() {
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
      
      // Verificar se o usuário já existe
      const { data: existingUser, error: existingError } = await supabase
        .from('profiles')
        .select('id, church_id')
        .eq('email', params.email)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }
      
      if (existingUser) {
        if (existingUser.church_id) {
          throw new Error('User already belongs to a church');
        }
        
        // Adicionar usuário existente à igreja
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            church_id: profile.church_id,
            role: params.role 
          })
          .eq('id', existingUser.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      // Criar convite para novo usuário
      const { data, error } = await supabase
        .from('invites')
        .insert({
          email: params.email,
          role: params.role,
          church_id: profile.church_id,
          invited_by: user.id,
          message: params.message,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Aqui você pode adicionar lógica para enviar email de convite
      // Por exemplo, chamar uma API route que envia o email
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-users'] });
      showToast({ type: 'success', message: 'Convite enviado com sucesso!' });
    },
    onError: (error) => {
      console.error('Error inviting user:', error);
      const message = error.message === 'User already belongs to a church' 
        ? 'Este usuário já pertence a uma igreja'
        : 'Erro ao enviar convite';
      showToast({ type: 'error', message });
    },
  });
}

export function useCurrentUserProfile() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUserProfile(userId: string) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!userId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (updates: Partial<ProfileUpdate> & { id?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const targetId = updates.id || user.id;
      const { id, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', targetId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const targetId = variables.id || user.id;
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['church-users'] });
      showToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      showToast({ type: 'error', message: 'Erro ao atualizar perfil' });
    },
  });
}