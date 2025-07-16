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
} = {}) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['church-users', user?.id, params],
    queryFn: async (): Promise<ChurchUser[]> => {
      // Early return with null safety
      if (!user?.id) {
        console.warn('useChurchUsers: No authenticated user');
        return [];
      }
      
      try {
        // Buscar o perfil do usuário para obter o church_id com null safety
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('useChurchUsers: Profile fetch error:', profileError);
          return [];
        }
        
        if (!profile?.church_id) {
          console.warn('useChurchUsers: User has no church_id');
          return [];
        }
        
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('church_id', profile.church_id);
        
        // Safe search parameter handling
        if (params?.search && typeof params.search === 'string' && params.search.trim()) {
          const sanitizedSearch = params.search.trim().replace(/[%_]/g, '\\$&');
          query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
        }
        
        if (params?.role && typeof params.role === 'string') {
          query = query.eq('role', params.role);
        }
        
        const limit = Math.max(1, Math.min(params?.limit || 10, 100)); // Clamp between 1-100
        const page = Math.max(1, params?.page || 1);
        const offset = (page - 1) * limit;
        
        query = query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        const { data, error } = await query;
        
        if (error) {
          console.error('useChurchUsers: Query error:', error);
          throw error;
        }
        
        // Safe data mapping with null checks
        return (data || []).map(userProfile => ({
          ...userProfile,
          // Ensure required fields have defaults
          role: userProfile?.role || 'member',
          full_name: userProfile?.full_name || 'Usuário sem nome',
          email: userProfile?.email || 'email@example.com',
          joined_at: userProfile?.created_at || new Date().toISOString(),
          last_active: userProfile?.updated_at || null,
          // Add null safety for optional fields
          avatar_url: userProfile?.avatar_url || null,
          phone: userProfile?.phone || null,
        }));
      } catch (error) {
        console.error('useChurchUsers: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('RLS') || error?.message?.includes('permission')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (params: { userId: string; role: Database['public']['Enums']['user_role'] }) => {
      // Enhanced input validation
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      if (!params?.userId || typeof params.userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }
      
      if (!params?.role || typeof params.role !== 'string') {
        throw new Error('Invalid role provided');
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: params.role })
          .eq('id', params.userId)
          .select()
          .single();
        
        if (error) {
          console.error('useUpdateUserRole: Database error:', error);
          throw new Error(`Failed to update user role: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No data returned from update operation');
        }
        
        return data;
      } catch (error: any) {
        console.error('useUpdateUserRole: Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      try {
        // Safely invalidate queries
        queryClient.invalidateQueries({ queryKey: ['church-users'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile', updatedUser?.id] });
        
        const message = updatedUser?.full_name 
          ? `Papel de ${updatedUser.full_name} atualizado com sucesso!` 
          : 'Papel do usuário atualizado com sucesso!';
        
        showToast?.({ type: 'success', message });
      } catch (error) {
        console.error('useUpdateUserRole: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useUpdateUserRole: onError:', error);
      
      const message = error?.message?.includes('permission') 
        ? 'Você não tem permissão para alterar papéis de usuário'
        : error?.message || 'Erro ao atualizar papel do usuário';
      
      showToast?.({ type: 'error', message });
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
      // Enhanced input validation
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid user ID provided');
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ church_id: null, role: null })
          .eq('id', userId)
          .select()
          .single();
        
        if (error) {
          console.error('useRemoveUserFromChurch: Database error:', error);
          throw new Error(`Failed to remove user: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No data returned from update operation');
        }
        
        return data;
      } catch (error: any) {
        console.error('useRemoveUserFromChurch: Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['church-users'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile', data?.id] });
        
        const message = data?.full_name 
          ? `${data.full_name} foi removido da igreja com sucesso!`
          : 'Usuário removido da igreja com sucesso!';
        
        showToast?.({ type: 'success', message });
      } catch (error) {
        console.error('useRemoveUserFromChurch: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useRemoveUserFromChurch: onError:', error);
      
      const message = error?.message?.includes('permission')
        ? 'Você não tem permissão para remover usuários da igreja'
        : error?.message || 'Erro ao remover usuário da igreja';
      
      showToast?.({ type: 'error', message });
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
      // Enhanced input validation
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      if (!params?.email || typeof params.email !== 'string') {
        throw new Error('Valid email is required');
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email.trim())) {
        throw new Error('Invalid email format');
      }
      
      if (!params?.role || typeof params.role !== 'string') {
        throw new Error('Valid role is required');
      }
      
      try {
        // Buscar o perfil do usuário para obter o church_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('church_id, full_name')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('useInviteUser: Profile fetch error:', profileError);
          throw new Error('Failed to fetch your profile');
        }
        
        if (!profile?.church_id) {
          throw new Error('You must be associated with a church to invite users');
        }
        
        // Verificar se o usuário já existe com safe error handling
        const { data: existingUser, error: existingError } = await supabase
          .from('profiles')
          .select('id, church_id, email')
          .eq('email', params.email.trim().toLowerCase())
          .single();
        
        // Handle errors - PGRST116 means no rows found (expected for new users)
        if (existingError && existingError.code !== 'PGRST116') {
          console.error('useInviteUser: Existing user check error:', existingError);
          throw new Error('Failed to check existing user');
        }
        
        if (existingUser) {
          if (existingUser.church_id === profile.church_id) {
            throw new Error('User is already a member of your church');
          }
          
          if (existingUser.church_id) {
            throw new Error('User already belongs to another church');
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
          
          if (error) {
            console.error('useInviteUser: User update error:', error);
            throw new Error('Failed to add existing user to church');
          }
          
          return data;
        }
        
        // Check for existing pending invite
        const { data: existingInvite, error: inviteCheckError } = await supabase
          .from('invites')
          .select('id, status')
          .eq('email', params.email.trim().toLowerCase())
          .eq('church_id', profile.church_id)
          .eq('status', 'pending')
          .single();
        
        if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
          console.error('useInviteUser: Invite check error:', inviteCheckError);
        }
        
        if (existingInvite) {
          throw new Error('A pending invite already exists for this email');
        }
        
        // Criar convite para novo usuário
        const { data, error } = await supabase
          .from('invites')
          .insert({
            email: params.email.trim().toLowerCase(),
            role: params.role,
            church_id: profile.church_id,
            invited_by: user.id,
            message: params.message?.trim() || null,
            status: 'pending',
          })
          .select()
          .single();
        
        if (error) {
          console.error('useInviteUser: Invite creation error:', error);
          throw new Error('Failed to create invite');
        }
        
        if (!data) {
          throw new Error('No data returned from invite creation');
        }
        
        return data;
      } catch (error: any) {
        console.error('useInviteUser: Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['church-users'] });
        queryClient.invalidateQueries({ queryKey: ['invites'] });
        
        const message = data?.email 
          ? `Convite enviado para ${data.email} com sucesso!`
          : 'Convite enviado com sucesso!';
        
        showToast?.({ type: 'success', message });
      } catch (error) {
        console.error('useInviteUser: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useInviteUser: onError:', error);
      
      let message = 'Erro ao enviar convite';
      
      if (error?.message?.includes('already belongs to another church')) {
        message = 'Este usuário já pertence a outra igreja';
      } else if (error?.message?.includes('already a member')) {
        message = 'Este usuário já é membro da sua igreja';
      } else if (error?.message?.includes('pending invite')) {
        message = 'Já existe um convite pendente para este email';
      } else if (error?.message?.includes('Invalid email')) {
        message = 'Formato de email inválido';
      } else if (error?.message) {
        message = error.message;
      }
      
      showToast?.({ type: 'error', message });
    },
  });
}

export function useCurrentUserProfile() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) {
        console.warn('useCurrentUserProfile: No authenticated user');
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          // Handle specific error cases
          if (error.code === 'PGRST116') {
            console.warn('useCurrentUserProfile: Profile not found for user:', user.id);
            return null;
          }
          console.error('useCurrentUserProfile: Database error:', error);
          throw error;
        }
        
        // Validate essential profile data
        if (data && typeof data === 'object') {
          return {
            ...data,
            // Ensure required fields have safe defaults
            full_name: data.full_name || 'Usuário',
            email: data.email || user.emailAddresses?.[0]?.emailAddress || '',
            role: data.role || 'member',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
        }
        
        console.warn('useCurrentUserProfile: Invalid profile data received');
        return null;
      } catch (error: any) {
        console.error('useCurrentUserProfile: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      // Don't retry on certain errors
      if (error?.code === 'PGRST116' || error?.message?.includes('RLS')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUserProfile(userId: string) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) {
        console.warn('useUserProfile: No authenticated user');
        return null;
      }
      
      if (!userId || typeof userId !== 'string') {
        console.warn('useUserProfile: Invalid userId provided:', userId);
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('useUserProfile: Profile not found for userId:', userId);
            return null;
          }
          console.error('useUserProfile: Database error:', error);
          throw error;
        }
        
        // Validate and normalize profile data
        if (data && typeof data === 'object') {
          return {
            ...data,
            full_name: data.full_name || 'Usuário',
            email: data.email || '',
            role: data.role || 'member',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
        }
        
        return null;
      } catch (error: any) {
        console.error('useUserProfile: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!userId && typeof userId === 'string',
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116' || error?.message?.includes('RLS')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (updates: Partial<ProfileUpdate> & { id?: string }) => {
      // Enhanced validation
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update data provided');
      }
      
      const targetId = updates.id || user.id;
      const { id, ...updateData } = updates;
      
      // Validate targetId
      if (!targetId || typeof targetId !== 'string') {
        throw new Error('Invalid target user ID');
      }
      
      // Sanitize update data - remove undefined values
      const sanitizedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<ProfileUpdate>);
      
      if (Object.keys(sanitizedData).length === 0) {
        throw new Error('No valid fields to update');
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(sanitizedData)
          .eq('id', targetId)
          .select()
          .single();
        
        if (error) {
          console.error('useUpdateUserProfile: Database error:', error);
          throw new Error(`Failed to update profile: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No data returned from update operation');
        }
        
        return data;
      } catch (error: any) {
        console.error('useUpdateUserProfile: Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      try {
        const targetId = variables?.id || user?.id;
        
        if (targetId) {
          queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] });
        }
        queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['church-users'] });
        
        showToast?.({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      } catch (error) {
        console.error('useUpdateUserProfile: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useUpdateUserProfile: onError:', error);
      
      let message = 'Erro ao atualizar perfil';
      
      if (error?.message?.includes('permission')) {
        message = 'Você não tem permissão para atualizar este perfil';
      } else if (error?.message?.includes('validation')) {
        message = 'Dados inválidos fornecidos';
      } else if (error?.message) {
        message = error.message;
      }
      
      showToast?.({ type: 'error', message });
    },
  });
}