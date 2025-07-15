"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useShowToast } from '@/store';
import { useClerkSupabaseClient } from '@/lib/supabase/client';

/**
 * Test component for enhanced notification system
 * This component allows testing both Zustand toasts and Supabase notifications
 */
export function NotificationTester() {
  const { user } = useUser();
  const showToast = useShowToast();
  const supabase = useClerkSupabaseClient();
  const [isCreating, setIsCreating] = useState(false);

  const testToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    showToast({
      type,
      title: `Test ${type} toast`,
      message: `This is a test ${type} toast notification`,
      duration: 3000,
    });
  };

  const createTestNotification = async (type: 'success' | 'error' | 'warning' | 'info') => {
    if (!user?.id) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to create notifications',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
          message: `This is a test ${type} notification created at ${new Date().toLocaleTimeString()}`,
          type,
          read: false,
          sender_name: 'Test System',
          sender_avatar: '/api/placeholder/32/32',
        });

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Notification Created',
        message: 'Test notification created successfully!',
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create test notification',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Please sign in to test the notification system.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🔔 Notification System Tester
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Toast Notifications (Zustand UI Store)
          </h4>
          <div className="flex gap-2 flex-wrap">
            {(['success', 'error', 'warning', 'info'] as const).map((type) => (
              <button
                key={type}
                onClick={() => testToast(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  type === 'success'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                    : type === 'error'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                    : type === 'warning'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Toast
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Create Persistent Notifications (Supabase + Real-time)
          </h4>
          <div className="flex gap-2 flex-wrap">
            {(['success', 'error', 'warning', 'info'] as const).map((type) => (
              <button
                key={type}
                onClick={() => createTestNotification(type)}
                disabled={isCreating}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'success'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                    : type === 'error'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                    : type === 'warning'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                }`}
              >
                {isCreating ? 'Creating...' : `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
          <p><strong>Toasts:</strong> Temporary UI feedback using Zustand UI store and Sonner</p>
          <p><strong>Notifications:</strong> Persistent notifications stored in Supabase with real-time updates</p>
          <p><strong>Integration:</strong> Both systems work together following the state management guidelines</p>
        </div>
      </div>
    </div>
  );
}