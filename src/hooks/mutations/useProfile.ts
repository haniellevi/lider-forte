import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useShowToast } from '@/store';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import type { Database } from '@/lib/supabase/types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (updates: ProfileUpdate): Promise<Profile> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // RLS automatically validates that only own profile can be updated
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProfile) => {
      // Update profile cache
      queryClient.setQueryData(['user', 'profile', updatedProfile.user_id], updatedProfile);
      queryClient.setQueryData(['user', 'profile', 'current', user?.id], updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Success toast via Zustand
      showToast({
        type: 'success',
        message: 'Perfil atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        message: error.message || 'Falha ao atualizar perfil'
      });
    },
  });
}