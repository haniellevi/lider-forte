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
      // Enhanced null safety checks
      if (!user?.id) {
        console.error('useUpdateProfile: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update data provided');
      }
      
      // Filter out undefined values
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof ProfileUpdate] = value;
        }
        return acc;
      }, {} as ProfileUpdate);
      
      if (Object.keys(cleanUpdates).length === 0) {
        throw new Error('No valid fields to update');
      }
      
      try {
        // RLS automatically validates that only own profile can be updated
        const { data, error } = await supabase
          .from('profiles')
          .update(cleanUpdates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) {
          console.error('useUpdateProfile: Database error:', error);
          throw new Error(`Failed to update profile: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No data returned from update operation');
        }
        
        return data;
      } catch (error: any) {
        console.error('useUpdateProfile: Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: (updatedProfile) => {
      try {
        // Update profile cache with null safety
        if (updatedProfile?.user_id) {
          queryClient.setQueryData(['user', 'profile', updatedProfile.user_id], updatedProfile);
        }
        
        if (user?.id) {
          queryClient.setQueryData(['user', 'profile', 'current', user.id], updatedProfile);
        }
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        // Success toast via Zustand with null safety
        if (showToast) {
          showToast({
            type: 'success',
            message: 'Perfil atualizado com sucesso!'
          });
        }
      } catch (error) {
        console.error('useUpdateProfile: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useUpdateProfile: Mutation error:', error);
      
      let message = 'Falha ao atualizar perfil';
      
      if (error?.message) {
        if (error.message.includes('permission')) {
          message = 'Você não tem permissão para atualizar este perfil';
        } else if (error.message.includes('validation')) {
          message = 'Dados inválidos fornecidos';
        } else {
          message = error.message;
        }
      }
      
      if (showToast) {
        showToast({
          type: 'error',
          message
        });
      }
    },
  });
}