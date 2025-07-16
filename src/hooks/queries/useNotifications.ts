import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useMemo } from 'react'
import { notificationsApi, type Notification } from '../api/notifications'
import { useShowToast, useAddNotification } from '@/store'
import { 
  NotificationFilters, 
  CreateNotificationRequest,
  UpdateNotificationRequest,
  MassCommunication,
  CreateMassCommunicationRequest,
  MassCommunicationFilters
} from '@/types/notifications'

/**
 * Query key factory for notifications
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (userId: string) => [...notificationKeys.lists(), userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
}

/**
 * Main notifications query with real-time subscriptions
 * Replaces the old useRealtimeNotifications hook with TanStack Query
 */
export function useNotificationsQuery() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const supabase = useClerkSupabaseClient()
  const showToast = useShowToast()
  const addNotification = useAddNotification()

  // Main query for notifications with null safety
  const query = useQuery({
    queryKey: notificationKeys.list(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        console.warn('useNotificationsQuery: No authenticated user');
        return [];
      }
      
      try {
        const notifications = await notificationsApi.getNotifications(supabase, user.id);
        return Array.isArray(notifications) ? notifications : [];
      } catch (error) {
        console.error('useNotificationsQuery: Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - notifications are dynamic
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  })

  // Real-time subscription effect
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const queryKey = notificationKeys.list(user.id)

          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            
            // Update TanStack Query cache optimistically with null safety
            queryClient.setQueryData(queryKey, (old: any) => {
              const safeOld = Array.isArray(old) ? old : [];
              return [
                newNotification,
                ...safeOld.slice(0, 49) // Keep max 50 notifications
              ];
            })
            
            // Show toast for real-time feedback
            showToast({
              type: newNotification.type as 'success' | 'error' | 'warning' | 'info',
              title: newNotification.title,
              message: newNotification.message,
              duration: 5000,
            })
            
            // Add to Zustand for UI state management
            addNotification({
              type: newNotification.type as 'success' | 'error' | 'warning' | 'info',
              title: newNotification.title,
              message: newNotification.message,
            })
            
          } else if (payload.eventType === 'UPDATE') {
            // Update specific notification in cache with null safety
            queryClient.setQueryData(queryKey, (old: any) => {
              const safeOld = Array.isArray(old) ? old : [];
              return safeOld.map(n => 
                n?.id === payload.new?.id ? payload.new as Notification : n
              );
            })
            
          } else if (payload.eventType === 'DELETE') {
            // Remove notification from cache with null safety
            queryClient.setQueryData(queryKey, (old: any) => {
              const safeOld = Array.isArray(old) ? old : [];
              return safeOld.filter(n => n?.id !== payload.old?.id);
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient, supabase, showToast, addNotification])

  // Derived data with memoization for performance and null safety
  const derivedData = useMemo(() => {
    const notifications = Array.isArray(query.data) ? query.data : []
    
    return {
      notifications,
      recentNotifications: notifications.slice(0, 10),
      unreadCount: notifications.filter(n => n && !n.read).length,
      unreadNotifications: notifications.filter(n => n && !n.read),
    }
  }, [query.data])

  return {
    ...query,
    ...derivedData,
  }
}

/**
 * Specific query for unread notifications count
 * Useful for badge indicators without fetching all notifications
 */
export function useUnreadNotificationsCount() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  
  return useQuery({
    queryKey: notificationKeys.unread(user?.id || ''),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false)
      
      if (error) throw error
      return count || 0
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds for count queries
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

// Hook para listar notificações com filtros
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', 'filtered', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.read !== undefined) {
        params.set('read', filters.read.toString());
      }
      if (filters?.priority) {
        params.set('priority', filters.priority);
      }
      if (filters?.type) {
        params.set('type', filters.type);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.set('limit', filters.limit.toString());
      }
      if (filters?.start_date) {
        params.set('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.set('end_date', filters.end_date);
      }

      const response = await fetch(`/api/protected/notifications?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar notificações');
      }
      
      return response.json();
    },
  });
}

// Hook para criar notificação
export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateNotificationRequest) => {
      const response = await fetch('/api/protected/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar notificação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Hook para atualizar notificação
export function useUpdateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateNotificationRequest) => {
      const response = await fetch(`/api/protected/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar notificação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Hook para deletar notificação
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/protected/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar notificação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Hook para marcar todas as notificações como lidas
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/protected/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao marcar notificações como lidas');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Hook para listar comunicações em massa
export function useMassCommunications(filters?: MassCommunicationFilters) {
  return useQuery({
    queryKey: ['mass-communications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) {
        params.set('status', filters.status);
      }
      if (filters?.sender_id) {
        params.set('sender_id', filters.sender_id);
      }
      if (filters?.target_type) {
        params.set('target_type', filters.target_type);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.set('limit', filters.limit.toString());
      }
      if (filters?.start_date) {
        params.set('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.set('end_date', filters.end_date);
      }

      const response = await fetch(`/api/protected/communications?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar comunicações');
      }
      
      return response.json();
    },
  });
}

// Hook para criar comunicação em massa
export function useCreateMassCommunication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateMassCommunicationRequest) => {
      const response = await fetch('/api/protected/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar comunicação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-communications'] });
    },
  });
}

// Hook para enviar comunicação em massa
export function useSendMassCommunication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/protected/communications/${id}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar comunicação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-communications'] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}