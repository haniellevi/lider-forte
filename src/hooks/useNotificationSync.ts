import { useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/supabase/client'
import { useShowToast, useAddNotification } from '@/store'
import { Tables } from '@/lib/supabase/types'

type SupabaseNotification = Tables<'notifications'>

/**
 * Hook to sync Supabase notifications with Zustand state management
 * Follows the guidelines from @docs/ and @agents/:
 * - Uses Zustand for UI state (toasts, app notifications)
 * - Uses Supabase for persistent server state
 * - Provides real-time updates with proper state management
 */
export function useNotificationSync() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  
  // Zustand store actions following the state management guidelines
  const showToast = useShowToast()
  const addNotification = useAddNotification()

  // Handle new notifications from real-time subscription
  const handleNewNotification = useCallback((notification: SupabaseNotification) => {
    // Show immediate toast feedback (ephemeral UI state)
    showToast({
      type: notification.type as 'success' | 'error' | 'warning' | 'info',
      title: notification.title,
      message: notification.message,
      duration: 5000,
    })
    
    // Add to Zustand app store for persistent UI state
    addNotification({
      type: notification.type as 'success' | 'error' | 'warning' | 'info',
      title: notification.title,
      message: notification.message,
    })
  }, [showToast, addNotification])

  // Handle notification errors with proper state management
  const handleError = useCallback((error: string, operation: string) => {
    console.error(`Notification ${operation} error:`, error)
    
    showToast({
      type: 'error',
      title: 'Notification Error',
      message: `Failed to ${operation}`,
      duration: 4000,
    })
  }, [showToast])

  // Set up real-time subscription following Zustand patterns
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as SupabaseNotification
          handleNewNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Handle notification updates (like marking as read)
          const updatedNotification = payload.new as SupabaseNotification
          
          if (updatedNotification.read && !payload.old?.read) {
            // Notification was marked as read
            showToast({
              type: 'info',
              title: 'Notification Updated',
              message: 'Marked as read',
              duration: 2000,
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Notification real-time subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          handleError('Real-time subscription failed', 'connect to real-time updates')
        }
      })

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, handleNewNotification, handleError, showToast])

  // Create notification helper following Zustand action patterns
  const createNotification = useCallback(async (
    notification: Omit<SupabaseNotification, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'read'>
  ) => {
    if (!user?.id) {
      handleError('User not authenticated', 'create notification')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: false,
          sender_name: notification.sender_name,
          sender_avatar: notification.sender_avatar,
          sender_id: notification.sender_id,
          action_url: notification.action_url,
          icon: notification.icon,
        })
        .select()
        .single()

      if (error) throw error

      // Show success feedback
      showToast({
        type: 'success',
        title: 'Notification Created',
        message: 'Notification sent successfully',
        duration: 3000,
      })

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      handleError(errorMessage, 'create notification')
      return null
    }
  }, [user?.id, supabase, showToast, handleError])

  return {
    createNotification,
    // Expose error handler for external use
    handleError,
  }
}