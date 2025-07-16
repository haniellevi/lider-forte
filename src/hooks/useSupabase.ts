"use client";

import { useEffect, useState } from 'react';
import { useClerkSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { useUser } from '@clerk/nextjs';

export function useSupabase() {
  return useClerkSupabaseClient();
}

export function useSupabaseUser() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const syncProfile = async () => {
      try {
        // Fetch existing profile with null safety
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          // Ensure profile has required fields with defaults
          const safeProfile = {
            ...existingProfile,
            full_name: existingProfile.full_name || user.fullName || user.firstName || 'Usuário',
            email: existingProfile.email || user.emailAddresses?.[0]?.emailAddress || '',
            avatar_url: existingProfile.avatar_url || user.imageUrl || null,
            role: existingProfile.role || 'member',
            created_at: existingProfile.created_at || new Date().toISOString(),
            updated_at: existingProfile.updated_at || new Date().toISOString(),
          };
          
          setProfile(safeProfile);
        } else if (fetchError?.code === 'PGRST116') {
          // Profile doesn't exist, create new one
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.fullName || user.firstName || 'Usuário',
              email: user.emailAddresses?.[0]?.emailAddress || '',
              avatar_url: user.imageUrl || null,
              role: 'member',
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
          } else {
            console.error('useSupabaseUser: Error creating profile:', insertError);
          }
        } else {
          console.error('useSupabaseUser: Error fetching profile:', fetchError);
        }
      } catch (error) {
        console.error('useSupabaseUser: Unexpected error syncing profile:', error);
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
  }, [user, isLoaded, supabase]);

  return { profile, loading, supabase };
}

export function useRealtimeQuery<T>(
  table: keyof Database['public']['Tables'],
  filters?: { column: string; value: any }[]
) {
  const supabase = useSupabase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!table || typeof table !== 'string') {
      setError(new Error('Invalid table name provided'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');
        
        // Apply filters with null safety
        if (filters && Array.isArray(filters)) {
          filters.forEach(filter => {
            if (filter && typeof filter.column === 'string' && filter.value != null) {
              query = query.eq(filter.column, filter.value);
            }
          });
        }

        const { data: result, error: queryError } = await query;

        if (queryError) {
          console.error('useRealtimeQuery: Query error:', queryError);
          throw queryError;
        }
        
        setData(Array.isArray(result) ? result : []);
        setError(null);
      } catch (err) {
        console.error('useRealtimeQuery: Fetch error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              setData(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                return [...safePrev, payload.new as T];
              });
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              setData(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                return safePrev.map(item => 
                  (item as any)?.id === payload.new?.id ? payload.new as T : item
                );
              });
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setData(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                return safePrev.filter(item => (item as any)?.id !== payload.old?.id);
              });
            }
          } catch (error) {
            console.error('useRealtimeQuery: Realtime event error:', error);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('useRealtimeQuery: Unsubscribe error:', error);
      }
    };
  }, [table, filters, supabase]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from(table).select('*');
      
      if (filters && Array.isArray(filters)) {
        filters.forEach(filter => {
          if (filter && typeof filter.column === 'string' && filter.value != null) {
            query = query.eq(filter.column, filter.value);
          }
        });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('useRealtimeQuery: Refetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}