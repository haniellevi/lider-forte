import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import type { Database } from '@/lib/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export function usePosts() {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      // RLS automatically filters posts based on policy:
      // - Published posts are visible to all
      // - Own posts always visible (even unpublished)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Posts only published (for public area)
export function usePublishedPosts() {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['posts', 'published'],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Posts from authenticated user (uses Clerk directly)
export function useMyPosts() {
  const { user } = useUser(); // Clerk hook
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['posts', 'my', user?.id],
    queryFn: async (): Promise<Post[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // RLS automatically filters for logged user posts
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id, // Only execute when user is authenticated
  });
}

// Posts from a specific user (public)
export function useUserPosts(userId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async (): Promise<Post[]> => {
      // Only returns published posts from other users
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Single post
export function usePost(postId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['posts', postId],
    queryFn: async (): Promise<Post> => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
}