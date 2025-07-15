// Tipos para o sistema de notificações

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'message' 
  | 'alert' 
  | 'reminder' 
  | 'update';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryMethod = 'in_app' | 'email' | 'sms' | 'push';

export type MassCommunicationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export type TargetType = 'all' | 'role' | 'cell' | 'custom';

export interface Notification {
  id: string;
  user_id: string;
  church_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  created_at: string;
  updated_at: string;
  action_url?: string;
  icon?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  entity_type?: string;
  entity_id?: string;
  scheduled_for?: string;
  expires_at?: string;
  delivery_method: DeliveryMethod[];
  metadata: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  church_id?: string;
  name: string;
  code: string;
  title_template: string;
  message_template: string;
  type: NotificationType;
  priority: NotificationPriority;
  delivery_method: DeliveryMethod[];
  is_active: boolean;
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  church_id: string;
  notification_type: string;
  delivery_method: DeliveryMethod[];
  is_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface MassCommunication {
  id: string;
  church_id: string;
  sender_id: string;
  title: string;
  message: string;
  target_type: TargetType;
  target_criteria: Record<string, any>;
  delivery_method: DeliveryMethod[];
  scheduled_for?: string;
  sent_at?: string;
  status: MassCommunicationStatus;
  total_recipients: number;
  sent_count: number;
  error_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface NotificationDelivery {
  id: string;
  notification_id?: string;
  mass_communication_id?: string;
  user_id: string;
  delivery_method: DeliveryMethod;
  status: NotificationDeliveryStatus;
  error_message?: string;
  delivered_at?: string;
  read_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Tipos para criação e atualização
export interface CreateNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  action_url?: string;
  icon?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  entity_type?: string;
  entity_id?: string;
  scheduled_for?: string;
  expires_at?: string;
  delivery_method?: DeliveryMethod[];
  metadata?: Record<string, any>;
}

export interface CreateNotificationFromTemplateRequest {
  template_code: string;
  recipient_user_id: string;
  variables: Record<string, string>;
}

export interface CreateMassCommunicationRequest {
  title: string;
  message: string;
  target_type: TargetType;
  target_criteria: Record<string, any>;
  delivery_method?: DeliveryMethod[];
  scheduled_for?: string;
}

export interface UpdateNotificationRequest {
  read?: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  entity_type?: string;
  entity_id?: string;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export interface MassCommunicationFilters {
  status?: MassCommunicationStatus;
  sender_id?: string;
  target_type?: TargetType;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

// Tipos para estatísticas
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

// Constantes para facilitar o uso
export const NOTIFICATION_TYPES = {
  INFO: 'info' as const,
  SUCCESS: 'success' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  MESSAGE: 'message' as const,
  ALERT: 'alert' as const,
  REMINDER: 'reminder' as const,
  UPDATE: 'update' as const,
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low' as const,
  NORMAL: 'normal' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const,
} as const;

export const DELIVERY_METHODS = {
  IN_APP: 'in_app' as const,
  EMAIL: 'email' as const,
  SMS: 'sms' as const,
  PUSH: 'push' as const,
} as const;

export const TARGET_TYPES = {
  ALL: 'all' as const,
  ROLE: 'role' as const,
  CELL: 'cell' as const,
  CUSTOM: 'custom' as const,
} as const;