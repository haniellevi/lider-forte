"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  useNotificationsQuery, 
  useUnreadNotificationsCount,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useUpdateNotification 
} from '@/hooks/queries/useNotifications';
import { Button } from '@/components/ui/Button';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck,
  Trash2, 
  Filter,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationFilters } from '@/types/notifications';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const t = useTranslations('Notifications');
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20
  });
  const [showFilters, setShowFilters] = useState(false);

  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error 
  } = useNotificationsQuery();
  
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const updateNotificationMutation = useUpdateNotification();

  const handleMarkAsRead = async (notificationId: string) => {
    await updateNotificationMutation.mutateAsync({
      id: notificationId,
      read: true
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllReadMutation.mutateAsync();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      await deleteNotificationMutation.mutateAsync(notificationId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low':
      default:
        return 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-boxdark shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="small"
                icon={<Filter className="h-4 w-4" />}
              />
              
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllReadMutation.isPending}
                  variant="ghost"
                  size="small"
                  icon={<CheckCheck className="h-4 w-4" />}
                  title={t('markAllRead')}
                />
              )}
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="small"
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-b border-stroke dark:border-strokedark p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('filters.status')}
                  </label>
                  <select
                    value={filters.read === undefined ? 'all' : filters.read ? 'read' : 'unread'}
                    onChange={(e) => setFilters({
                      ...filters,
                      read: e.target.value === 'all' ? undefined : e.target.value === 'read'
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.all')}</option>
                    <option value="unread">{t('filters.unread')}</option>
                    <option value="read">{t('filters.read')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('filters.priority')}
                  </label>
                  <select
                    value={filters.priority || 'all'}
                    onChange={(e) => setFilters({
                      ...filters,
                      priority: e.target.value === 'all' ? undefined : e.target.value as any
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.all')}</option>
                    <option value="high">{t('priority.high')}</option>
                    <option value="medium">{t('priority.medium')}</option>
                    <option value="low">{t('priority.low')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">
                  {t('loadError')}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <BellOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('noNotifications')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${
                              notification.read 
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </h3>
                            
                            <p className={`text-sm mt-1 ${
                              notification.read
                                ? 'text-gray-500 dark:text-gray-500'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {!notification.read && (
                                  <Button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={updateNotificationMutation.isPending}
                                    variant="ghost"
                                    size="small"
                                    icon={<Check className="h-3 w-3" />}
                                    title={t('markAsRead')}
                                  />
                                )}
                                
                                <Button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  disabled={deleteNotificationMutation.isPending}
                                  variant="ghost"
                                  size="small"
                                  icon={<Trash2 className="h-3 w-3" />}
                                  title={t('delete')}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}