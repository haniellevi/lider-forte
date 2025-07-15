import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useShowToast } from '@/store';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import type { Database } from '@/lib/supabase/types';

type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostUpdate = Database['public']['Tables']['posts']['Update'];
type Post = Database['public']['Tables']['posts']['Row'];

export function useCreatePost() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (newPost: Omit<PostInsert, 'user_id'>): Promise<Post> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // RLS automatically validates insertion permission
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...newPost,
          user_id: user.id, // Always use Clerk user ID
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newPost) => {
      if (!user?.id) return;
      
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['posts', 'my'] });
      
      // Snapshot previous values
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousMyPosts = queryClient.getQueryData(['posts', 'my', user.id]);
      
      // Create optimistic post
      const optimisticPost: Post = {
        id: 'temp-' + Date.now(),
        user_id: user.id,
        title: newPost.title || '',
        content: newPost.content || null,
        published: newPost.published || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Optimistic update
      queryClient.setQueryData(['posts'], (old: Post[] = []) => [optimisticPost, ...old]);
      queryClient.setQueryData(['posts', 'my', user.id], (old: Post[] = []) => [optimisticPost, ...old]);
      
      return { previousPosts, previousMyPosts };
    },
    onError: (error, newPost, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      if (context?.previousMyPosts && user?.id) {
        queryClient.setQueryData(['posts', 'my', user.id], context.previousMyPosts);
      }
      
      showToast({
        type: 'error',
        message: error.message || 'Falha ao criar post'
      });
    },
    onSuccess: (createdPost) => {
      showToast({
        type: 'success',
        message: 'Post criado com sucesso!'
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: PostUpdate }): Promise<Post> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // RLS automatically validates that only own posts can be updated
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPost) => {
      // Update specific post cache
      queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
      
      // Update post in lists
      queryClient.setQueryData(['posts'], (old: Post[] = []) =>
        old.map(post => post.id === updatedPost.id ? updatedPost : post)
      );
      queryClient.setQueryData(['posts', 'my', user?.id], (old: Post[] = []) =>
        old.map(post => post.id === updatedPost.id ? updatedPost : post)
      );
      
      showToast({
        type: 'success',
        message: 'Post atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        message: error.message || 'Falha ao atualizar post'
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // RLS automatically validates that only own posts can be deleted
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onMutate: async (postId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      // Snapshot previous data
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousMyPosts = queryClient.getQueryData(['posts', 'my', user?.id]);
      
      // Optimistic removal
      queryClient.setQueryData(['posts'], (old: Post[] = []) =>
        old.filter(post => post.id !== postId)
      );
      queryClient.setQueryData(['posts', 'my', user?.id], (old: Post[] = []) =>
        old.filter(post => post.id !== postId)
      );
      
      return { previousPosts, previousMyPosts, postId };
    },
    onError: (error, postId, context) => {
      // Rollback
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      if (context?.previousMyPosts && user?.id) {
        queryClient.setQueryData(['posts', 'my', user.id], context.previousMyPosts);
      }
      
      showToast({
        type: 'error',
        message: error.message || 'Falha ao deletar post'
      });
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        message: 'Post deletado com sucesso!'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}