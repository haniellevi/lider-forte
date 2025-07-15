import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/supabase/client'
import { useShowToast } from '@/store'
import { notificationsApi, type Notification, type NotificationInsert } from '../api/notifications'
import { notificationKeys } from '../queries/useNotifications'

/**
 * Mutation to create a new notification
 */
export function useCreateNotification() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const showToast = useShowToast()

  return useMutation({
    mutationFn: (notification: NotificationInsert) => 
      notificationsApi.createNotification(supabase, notification),
    
    onMutate: async (newNotification) => {
      if (!user?.id) return

      const queryKey = notificationKeys.list(user.id)
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey })
      
      // Get snapshot of previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(queryKey)
      
      // Optimistically update cache
      const optimisticNotification: Notification = {
        id: 'temp-' + Date.now(),
        user_id: user.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type || 'info',
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        action_url: newNotification.action_url || null,
        icon: newNotification.icon || null,
        sender_id: newNotification.sender_id || null,
        sender_name: newNotification.sender_name || null,
        sender_avatar: newNotification.sender_avatar || null,
      }
      
      queryClient.setQueryData(queryKey, (old: Notification[] = []) => [
        optimisticNotification,
        ...old
      ])
      
      return { previousNotifications }
    },
    
    onError: (error, newNotification, context) => {
      // Rollback on error
      if (context?.previousNotifications && user?.id) {
        queryClient.setQueryData(
          notificationKeys.list(user.id),
          context.previousNotifications
        )
      }
      
      showToast({
        type: 'error',
        title: 'Failed to create notification',
        message: error.message || 'Something went wrong',
      })
    },
    
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Notification created',
        message: 'Notification has been created successfully',
      })
    },
    
    onSettled: () => {
      // Refetch to ensure consistency
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.list(user.id) 
        })
      }
    },
  })
}

/**
 * Mutation to mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const showToast = useShowToast()

  return useMutation({
    mutationFn: (notificationId: string) => 
      notificationsApi.markAsRead(supabase, notificationId),
    
    onMutate: async (notificationId) => {
      if (!user?.id) return

      const queryKey = notificationKeys.list(user.id)
      await queryClient.cancelQueries({ queryKey })
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(queryKey)
      
      // Optimistic update
      queryClient.setQueryData(queryKey, (old: Notification[] = []) =>
        old.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      
      return { previousNotifications }
    },
    
    onError: (error, notificationId, context) => {
      if (context?.previousNotifications && user?.id) {
        queryClient.setQueryData(
          notificationKeys.list(user.id),
          context.previousNotifications
        )
      }
      
      showToast({
        type: 'error',
        title: 'Failed to mark as read',
        message: error.message || 'Could not mark notification as read',
      })
    },
  })
}

/**
 * Mutation to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const showToast = useShowToast()

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(supabase, user!.id),
    
    onMutate: async () => {
      if (!user?.id) return

      const queryKey = notificationKeys.list(user.id)
      await queryClient.cancelQueries({ queryKey })
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(queryKey)
      
      // Optimistic update - mark all as read
      queryClient.setQueryData(queryKey, (old: Notification[] = []) =>
        old.map(n => ({ ...n, read: true }))
      )
      
      return { previousNotifications }
    },
    
    onError: (error, variables, context) => {
      if (context?.previousNotifications && user?.id) {
        queryClient.setQueryData(
          notificationKeys.list(user.id),
          context.previousNotifications
        )
      }
      
      showToast({
        type: 'error',
        title: 'Failed to mark all as read',
        message: error.message || 'Could not mark all notifications as read',
      })
    },
    
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'All notifications marked as read',
        message: 'All your notifications have been marked as read',
      })
    },
  })
}

/**
 * Mutation to delete a notification
 */
export function useDeleteNotification() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const showToast = useShowToast()

  return useMutation({
    mutationFn: (notificationId: string) => 
      notificationsApi.deleteNotification(supabase, notificationId),
    
    onMutate: async (notificationId) => {
      if (!user?.id) return

      const queryKey = notificationKeys.list(user.id)
      await queryClient.cancelQueries({ queryKey })
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(queryKey)
      
      // Optimistic update - remove notification
      queryClient.setQueryData(queryKey, (old: Notification[] = []) =>
        old.filter(n => n.id !== notificationId)
      )
      
      return { previousNotifications }
    },
    
    onError: (error, notificationId, context) => {
      if (context?.previousNotifications && user?.id) {
        queryClient.setQueryData(
          notificationKeys.list(user.id),
          context.previousNotifications
        )
      }
      
      showToast({
        type: 'error',
        title: 'Failed to delete notification',
        message: error.message || 'Could not delete notification',
      })
    },
    
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Notification deleted',
        message: 'Notification has been deleted',
      })
    },
  })
}

/**
 * Mutation to clear all notifications
 */
export function useClearAllNotifications() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const showToast = useShowToast()

  return useMutation({
    mutationFn: () => notificationsApi.clearAllNotifications(supabase, user!.id),
    
    onMutate: async () => {
      if (!user?.id) return

      const queryKey = notificationKeys.list(user.id)
      await queryClient.cancelQueries({ queryKey })
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(queryKey)
      
      // Optimistic update - clear all notifications
      queryClient.setQueryData(queryKey, [])
      
      return { previousNotifications }
    },
    
    onError: (error, variables, context) => {
      if (context?.previousNotifications && user?.id) {
        queryClient.setQueryData(
          notificationKeys.list(user.id),
          context.previousNotifications
        )
      }
      
      showToast({
        type: 'error',
        title: 'Failed to clear notifications',
        message: error.message || 'Could not clear all notifications',
      })
    },
    
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'All notifications cleared',
        message: 'All notifications have been removed',
      })
    },
  })
}

/**
 * Convenience hook that combines all notification mutations
 */
export function useNotificationActions() {
  const createNotification = useCreateNotification()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()
  const clearAll = useClearAllNotifications()

  return {
    createNotification: createNotification.mutate,
    createNotificationAsync: createNotification.mutateAsync,
    markAsRead: markAsRead.mutate,
    markAsReadAsync: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutate,
    markAllAsReadAsync: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutate,
    deleteNotificationAsync: deleteNotification.mutateAsync,
    clearAll: clearAll.mutate,
    clearAllAsync: clearAll.mutateAsync,
    
    // Loading states
    isCreating: createNotification.isPending,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: deleteNotification.isPending,
    isClearing: clearAll.isPending,
  }
}