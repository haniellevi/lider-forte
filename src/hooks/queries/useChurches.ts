import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import { useShowToast } from '@/store';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

type Church = Tables<'churches'>;
type ChurchInsert = TablesInsert<'churches'>;
type ChurchUpdate = TablesUpdate<'churches'>;

export function useCurrentChurch() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['current-church', user?.id],
    queryFn: async (): Promise<Church | null> => {
      if (!user?.id) return null;
      
      // Buscar o perfil do usuário para obter o church_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile?.church_id) {
        return null;
      }
      
      // Buscar os dados da igreja
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('id', profile.church_id)
        .single();
      
      if (churchError) throw churchError;
      return church;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateChurch() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (updates: Partial<ChurchUpdate>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Buscar o perfil do usuário para obter o church_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile?.church_id) {
        throw new Error('Church not found');
      }
      
      const { data, error } = await supabase
        .from('churches')
        .update(updates)
        .eq('id', profile.church_id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedChurch) => {
      queryClient.invalidateQueries({ queryKey: ['current-church'] });
      showToast({ type: 'success', message: 'Configurações da igreja atualizadas com sucesso!' });
    },
    onError: (error) => {
      console.error('Error updating church:', error);
      showToast({ type: 'error', message: 'Erro ao atualizar configurações da igreja' });
    },
  });
}

export function useCreateChurch() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (newChurch: Omit<ChurchInsert, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('churches')
        .insert(newChurch)
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar o perfil do usuário com o church_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ church_id: data.id })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      return data;
    },
    onSuccess: (createdChurch) => {
      queryClient.invalidateQueries({ queryKey: ['current-church'] });
      showToast({ type: 'success', message: 'Igreja criada com sucesso!' });
    },
    onError: (error) => {
      console.error('Error creating church:', error);
      showToast({ type: 'error', message: 'Erro ao criar igreja' });
    },
  });
}

export function useSearchChurches() {
  const supabase = useSupabase();
  
  return useMutation({
    mutationFn: async (params: {
      search?: string;
      city?: string;
      state?: string;
      page?: number;
      limit?: number;
    }) => {
      let query = supabase
        .from('churches')
        .select('*');
      
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      
      if (params.city) {
        query = query.eq('address->city', params.city);
      }
      
      if (params.state) {
        query = query.eq('address->state', params.state);
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
  });
}