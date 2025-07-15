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
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    const syncProfile = async () => {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.fullName || '',
              avatar_url: user.imageUrl || ''
            })
            .select()
            .single();

          if (!error && newProfile) {
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('Error syncing profile:', error);
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
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');
        
        if (filters) {
          filters.forEach(filter => {
            query = query.eq(filter.column, filter.value);
          });
        }

        const { data: result, error: queryError } = await query;

        if (queryError) throw queryError;
        setData(result || []);
      } catch (err) {
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
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => 
              prev.map(item => 
                (item as any).id === payload.new.id ? payload.new as T : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev => 
              prev.filter(item => (item as any).id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, filters, supabase]);

  return { data, loading, error, refetch: () => window.location.reload() };
}