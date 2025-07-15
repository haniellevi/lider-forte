import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export const notificationsApi = {
  /**
   * Fetch notifications for the current user (respects RLS)
   */
  async getNotifications(supabase: SupabaseClient<Database>, userId: string): Promise<Notification[]> {
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data || []
  },

  /**
   * Create a new notification (RLS validates permissions)
   */
  async createNotification(supabase: SupabaseClient<Database>, notification: NotificationInsert): Promise<Notification> {
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Mark notification as read (RLS ensures only own notifications)
   */
  async markAsRead(supabase: SupabaseClient<Database>, notificationId: string): Promise<Notification> {
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
  },

  /**
   * Delete a notification (RLS ensures only own notifications)
   */
  async deleteNotification(supabase: SupabaseClient<Database>, notificationId: string): Promise<void> {
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    if (error) throw error
  },

  /**
   * Clear all notifications for current user
   */
  async clearAllNotifications(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
  },
}