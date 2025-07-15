import { useNotificationsQuery } from './queries/useNotifications'
import { useNotificationActions } from './mutations/useNotificationMutations'
import { useNotifications as useZustandNotifications } from '@/store'

/**
 * Enhanced real-time notifications hook using TanStack Query
 * 
 * This replaces the old useRealtimeNotifications hook with better:
 * - Cache management
 * - Optimistic updates
 * - Loading states
 * - Error handling
 * - Consistent architecture with the rest of the app
 * 
 * Usage:
 * ```tsx
 * const {
 *   notifications,
 *   recentNotifications,
 *   unreadCount,
 *   isLoading,
 *   error,
 *   markAsRead,
 *   markAllAsRead,
 *   deleteNotification,
 *   clearAll,
 * } = useRealtimeNotificationsQuery()
 * ```
 */
export function useRealtimeNotificationsQuery() {
  // TanStack Query for server state
  const query = useNotificationsQuery()
  
  // Mutations for actions
  const actions = useNotificationActions()
  
  // Zustand for client UI state (for compatibility)
  const zustandNotifications = useZustandNotifications()

  return {
    // Server state (from TanStack Query)
    notifications: query.notifications,
    recentNotifications: query.recentNotifications,
    unreadCount: query.unreadCount,
    unreadNotifications: query.unreadNotifications,
    
    // Client state (from Zustand) - for UI toasts and temporary state
    zustandNotifications,
    
    // Loading and error states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
    
    // Actions with loading states
    markAsRead: actions.markAsRead,
    markAllAsRead: actions.markAllAsRead,
    deleteNotification: actions.deleteNotification,
    clearAll: actions.clearAll,
    
    // Async versions for more control
    markAsReadAsync: actions.markAsReadAsync,
    markAllAsReadAsync: actions.markAllAsReadAsync,
    deleteNotificationAsync: actions.deleteNotificationAsync,
    clearAllAsync: actions.clearAllAsync,
    
    // Action loading states
    isMarkingAsRead: actions.isMarkingAsRead,
    isMarkingAllAsRead: actions.isMarkingAllAsRead,
    isDeleting: actions.isDeleting,
    isClearing: actions.isClearing,
    
    // Utility functions
    refetch: query.refetch,
    invalidate: () => query.refetch(),
  }
}

/**
 * Legacy compatibility hook
 * Provides the same API as the old useRealtimeNotifications for easy migration
 */
export function useRealtimeNotifications() {
  const result = useRealtimeNotificationsQuery()
  
  return {
    notifications: result.notifications,
    recentNotifications: result.recentNotifications,
    zustandNotifications: result.zustandNotifications,
    loading: result.isLoading,
    error: result.error,
    unreadCount: result.unreadCount,
    markAsRead: result.markAsRead,
    markAllAsRead: result.markAllAsRead,
    deleteNotification: result.deleteNotification,
    clearAllNotifications: result.clearAll,
  }
}