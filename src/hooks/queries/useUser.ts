import { useQuery } from '@tanstack/react-query';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUserProfile(userId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn('useUserProfile: Invalid userId provided:', userId);
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('useUserProfile: Profile not found for userId:', userId);
            return null;
          }
          console.error('useUserProfile: Database error:', error);
          throw error;
        }
        
        // Ensure essential fields have safe defaults
        if (data) {
          return {
            ...data,
            full_name: data.full_name || 'Usuário',
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
    enabled: !!userId && typeof userId === 'string', // Only execute if userId is valid
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or permission errors
      if (error?.code === 'PGRST116' || error?.message?.includes('RLS')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCurrentUserProfile() {
  const { user } = useUser();
  const { profile, loading } = useSupabaseUser();
  
  return useQuery({
    queryKey: ['user', 'profile', 'current', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) {
        console.warn('useCurrentUserProfile: No authenticated user');
        return null;
      }
      
      // Return the profile with null safety
      if (profile && typeof profile === 'object') {
        return {
          ...profile,
          full_name: profile.full_name || user.fullName || 'Usuário',
          email: profile.email || user.emailAddresses?.[0]?.emailAddress || '',
          role: profile.role || 'member',
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString(),
        };
      }
      
      return null;
    },
    enabled: !loading && !!user?.id,
    initialData: profile || null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry for current user profile
  });
}