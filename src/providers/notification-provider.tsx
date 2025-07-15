"use client";

import { useEffect } from 'react'
import { useNotificationSync } from '@/hooks/useNotificationSync'
import { useStoreInitialization } from '@/store'

/**
 * Notification Provider that integrates Supabase notifications with Zustand state management
 * Following the patterns from the state management documentation:
 * - Initializes notification sync
 * - Handles real-time subscriptions
 * - Integrates with existing store patterns
 */
interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Initialize stores following the documented pattern
  useStoreInitialization()
  
  // Set up notification sync
  useNotificationSync()

  return <>{children}</>
}

/**
 * Enhanced hook for creating notifications with proper state management
 * Use this instead of direct API calls for notifications
 */
export { useNotificationSync as useCreateNotification } from '@/hooks/useNotificationSync'