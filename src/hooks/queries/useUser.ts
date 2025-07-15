import { useQuery } from '@tanstack/react-query';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUserProfile(userId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId, // Only execute if userId exists
  });
}

export function useCurrentUserProfile() {
  const { user } = useUser();
  const { profile, loading } = useSupabaseUser();
  
  return useQuery({
    queryKey: ['user', 'profile', 'current', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      return profile;
    },
    enabled: !loading && !!user?.id,
    initialData: profile,
  });
}