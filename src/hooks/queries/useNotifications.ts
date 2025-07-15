import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useMemo } from 'react'
import { notificationsApi, type Notification } from '../api/notifications'
import { useShowToast, useAddNotification } from '@/store'

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

  // Main query for notifications
  const query = useQuery({
    queryKey: notificationKeys.list(user?.id || ''),
    queryFn: () => notificationsApi.getNotifications(supabase, user!.id),
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
            
            // Update TanStack Query cache optimistically
            queryClient.setQueryData(queryKey, (old: Notification[] = []) => [
              newNotification,
              ...old.slice(0, 49) // Keep max 50 notifications
            ])
            
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
            // Update specific notification in cache
            queryClient.setQueryData(queryKey, (old: Notification[] = []) =>
              old.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            )
            
          } else if (payload.eventType === 'DELETE') {
            // Remove notification from cache
            queryClient.setQueryData(queryKey, (old: Notification[] = []) =>
              old.filter(n => n.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient, supabase, showToast, addNotification])

  // Derived data with memoization for performance
  const derivedData = useMemo(() => {
    const notifications = query.data || []
    
    return {
      notifications,
      recentNotifications: notifications.slice(0, 10),
      unreadCount: notifications.filter(n => !n.read).length,
      unreadNotifications: notifications.filter(n => !n.read),
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