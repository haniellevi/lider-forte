import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/supabase/client'
import { useNotifications as useZustandNotifications, useAddNotification, useShowToast } from '@/store'
import { Tables } from '@/lib/supabase/types'

export type SupabaseNotification = Tables<'notifications'>

/**
 * Comprehensive notification hook that combines Supabase real-time notifications
 * with Zustand state management following best practices
 */
export function useRealtimeNotifications() {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  
  // Use individual Zustand selectors to avoid infinite loops
  const zustandNotifications = useZustandNotifications()
  const addNotification = useAddNotification()
  const showToast = useShowToast()
  
  // Local state for Supabase notifications
  const [supabaseNotifications, setSupabaseNotifications] = useState<SupabaseNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setSupabaseNotifications(data || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications'
        setError(errorMessage)
        showToast({
          type: 'error',
          title: 'Notification Error',
          message: errorMessage,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user?.id, supabase, showToast])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as SupabaseNotification
            
            // Add to local state
            setSupabaseNotifications(prev => [newNotification, ...prev.slice(0, 49)])
            
            // Show toast for real-time notifications
            showToast({
              type: newNotification.type as 'success' | 'error' | 'warning' | 'info',
              title: newNotification.title,
              message: newNotification.message,
              duration: 5000,
            })
            
            // Add to Zustand for global notification management
            addNotification({
              type: newNotification.type as 'success' | 'error' | 'warning' | 'info',
              title: newNotification.title,
              message: newNotification.message,
            })
            
          } else if (payload.eventType === 'UPDATE') {
            setSupabaseNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as SupabaseNotification : n)
            )
          } else if (payload.eventType === 'DELETE') {
            setSupabaseNotifications(prev => prev.filter(n => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, showToast, addNotification])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      
      // Optimistic update
      setSupabaseNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read'
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      })
    }
  }, [supabase, showToast])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      
      // Optimistic update
      setSupabaseNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'All notifications marked as read',
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read'
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      })
    }
  }, [user?.id, supabase, showToast])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      
      // Optimistic update
      setSupabaseNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      showToast({
        type: 'success',
        title: 'Deleted',
        message: 'Notification removed',
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification'
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      })
    }
  }, [supabase, showToast])

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      
      setSupabaseNotifications([])
      
      showToast({
        type: 'success',
        title: 'Cleared',
        message: 'All notifications removed',
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear notifications'
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      })
    }
  }, [user?.id, supabase, showToast])

  // Get unread count
  const unreadCount = supabaseNotifications.filter(n => !n.read).length

  // Get recent notifications (last 10)
  const recentNotifications = supabaseNotifications.slice(0, 10)

  return {
    // Supabase notifications (persistent)
    notifications: supabaseNotifications,
    recentNotifications,
    
    // Zustand notifications (UI state)
    zustandNotifications,
    
    // State
    loading,
    error,
    unreadCount,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  }
}