import { useUser } from '@clerk/nextjs'
import { useCreateNotification } from './mutations/useNotificationMutations'
import type { NotificationInsert } from './api/notifications'

/**
 * Helper hook for creating notifications
 * Provides a simple API for other parts of the app to create notifications
 * 
 * Usage:
 * ```tsx
 * const { createNotification } = useNotificationCreator()
 * 
 * const handleOrderComplete = async (order) => {
 *   await createNotification({
 *     title: 'Order Confirmed!',
 *     message: `Your order #${order.id} has been confirmed`,
 *     type: 'success',
 *     action_url: `/orders/${order.id}`,
 *     sender_name: 'Store System',
 *   })
 * }
 * ```
 */
export function useNotificationCreator() {
  const { user } = useUser()
  const createNotificationMutation = useCreateNotification()

  /**
   * Create a notification for the current user
   */
  const createNotification = async (
    notification: Omit<NotificationInsert, 'user_id'>
  ): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to create notifications')
    }

    await createNotificationMutation.mutateAsync({
      ...notification,
      user_id: user.id,
    })
  }

  /**
   * Create a notification for a specific user (admin/system use)
   */
  const createNotificationForUser = async (
    userId: string,
    notification: Omit<NotificationInsert, 'user_id'>
  ): Promise<void> => {
    await createNotificationMutation.mutateAsync({
      ...notification,
      user_id: userId,
    })
  }

  /**
   * Quick helper functions for common notification types
   */
  const helpers = {
    /**
     * Create a success notification
     */
    success: (title: string, message: string, options?: Partial<NotificationInsert>) =>
      createNotification({
        title,
        message,
        type: 'success',
        ...options,
      }),

    /**
     * Create an error notification
     */
    error: (title: string, message: string, options?: Partial<NotificationInsert>) =>
      createNotification({
        title,
        message,
        type: 'error',
        ...options,
      }),

    /**
     * Create a warning notification
     */
    warning: (title: string, message: string, options?: Partial<NotificationInsert>) =>
      createNotification({
        title,
        message,
        type: 'warning',
        ...options,
      }),

    /**
     * Create an info notification
     */
    info: (title: string, message: string, options?: Partial<NotificationInsert>) =>
      createNotification({
        title,
        message,
        type: 'info',
        ...options,
      }),

    /**
     * Create a system notification (from app/admin)
     */
    system: (title: string, message: string, options?: Partial<NotificationInsert>) =>
      createNotification({
        title,
        message,
        type: 'info',
        sender_name: 'System',
        icon: 'system',
        ...options,
      }),

    /**
     * Create an order-related notification
     */
    order: (
      orderId: string,
      title: string,
      message: string,
      type: 'success' | 'error' | 'warning' | 'info' = 'info',
      options?: Partial<NotificationInsert>
    ) =>
      createNotification({
        title,
        message,
        type,
        action_url: `/orders/${orderId}`,
        sender_name: 'Order System',
        icon: 'order',
        ...options,
      }),

    /**
     * Create a user-related notification (profile updates, etc.)
     */
    profile: (
      title: string,
      message: string,
      type: 'success' | 'error' | 'warning' | 'info' = 'info',
      options?: Partial<NotificationInsert>
    ) =>
      createNotification({
        title,
        message,
        type,
        action_url: '/profile',
        sender_name: 'Profile System',
        icon: 'user',
        ...options,
      }),
  }

  return {
    createNotification,
    createNotificationForUser,
    isCreating: createNotificationMutation.isPending,
    mutationError: createNotificationMutation.error,
    
    // Helper functions
    ...helpers,
  }
}

/**
 * Legacy compatibility - maintains the useNotificationSync name
 */
export const useNotificationSync = useNotificationCreator