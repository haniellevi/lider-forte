"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  useMassCommunications,
  useCreateMassCommunication,
  useSendMassCommunication 
} from '@/hooks/queries/useNotifications';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Send,
  Filter,
  Search,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { MassCommunicationFilters } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateCommunicationModal } from './_components/CreateCommunicationModal';

export default function CommunicationsPage() {
  const t = useTranslations('Communications');
  const [filters, setFilters] = useState<MassCommunicationFilters>({
    page: 1,
    limit: 12
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<string | null>(null);

  // Aplicar busca aos filtros
  const appliedFilters: MassCommunicationFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
  };

  const { data: communicationsData, isLoading, error } = useMassCommunications(appliedFilters);
  const sendCommunicationMutation = useSendMassCommunication();

  const handleSendCommunication = async (id: string) => {
    if (window.confirm(t('confirmSend'))) {
      await sendCommunicationMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">{t('status.draft')}</Badge>;
      case 'scheduled':
        return <Badge variant="warning">{t('status.scheduled')}</Badge>;
      case 'sending':
        return <Badge variant="info">{t('status.sending')}</Badge>;
      case 'sent':
        return <Badge variant="success">{t('status.sent')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('status.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return t('targetType.all');
      case 'role':
        return t('targetType.role');
      case 'cell':
        return t('targetType.cell');
      case 'custom':
        return t('targetType.custom');
      default:
        return targetType;
    }
  };

  const communications = communicationsData?.communications || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="default"
          icon={<Plus className="h-4 w-4" />}
        >
          {t('create')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outlineDark"
            icon={<Filter className="h-4 w-4" />}
          >
            {t('filters')}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="draft">{t('status.draft')}</option>
                <option value="scheduled">{t('status.scheduled')}</option>
                <option value="sending">{t('status.sending')}</option>
                <option value="sent">{t('status.sent')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('targetType')}
              </label>
              <select
                value={filters.target_type || ''}
                onChange={(e) => setFilters({ ...filters, target_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('allTargets')}</option>
                <option value="all">{t('targetType.all')}</option>
                <option value="role">{t('targetType.role')}</option>
                <option value="cell">{t('targetType.cell')}</option>
                <option value="custom">{t('targetType.custom')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setFilters({ page: 1, limit: 12 })}
              variant="outlineDark"
              size="small"
            >
              {t('clearFilters')}
            </Button>
          </div>
        </div>
      )}

      {/* Communications Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-2">
            {t('loadError')}
          </p>
          <Button onClick={() => window.location.reload()} variant="outlineDark">
            {t('retry')}
          </Button>
        </div>
      ) : communications.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('noCommunications')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('noCommunicationsDescription')}
          </p>
          <Button onClick={() => setShowCreateModal(true)} variant="default">
            {t('createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communications.map((communication: any) => (
            <div
              key={communication.id}
              className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {communication.title}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusBadge(communication.status)}
                    <Badge variant="outline" className="text-xs">
                      {getTargetTypeLabel(communication.target_type)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {communication.message}
              </p>

              {/* Metadata */}
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span>{communication.sender_profile?.full_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(communication.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
                
                {communication.scheduled_for && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {t('scheduledFor')}: {new Date(communication.scheduled_for).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<Eye className="h-3 w-3" />}
                    title={t('view')}
                  />
                  
                  {(communication.status === 'draft' || communication.status === 'scheduled') && (
                    <Button
                      variant="ghost"
                      size="small"
                      icon={<Edit className="h-3 w-3" />}
                      title={t('edit')}
                    />
                  )}
                </div>
                
                {(communication.status === 'draft' || communication.status === 'scheduled') && (
                  <Button
                    onClick={() => handleSendCommunication(communication.id)}
                    disabled={sendCommunicationMutation.isPending}
                    variant="default"
                    size="small"
                    icon={<Send className="h-3 w-3" />}
                  >
                    {t('send')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {communicationsData?.pagination && communicationsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('showing')} {((communicationsData.pagination.page - 1) * communicationsData.pagination.limit) + 1} a{' '}
            {Math.min(communicationsData.pagination.page * communicationsData.pagination.limit, communicationsData.pagination.total)} {t('of')}{' '}
            {communicationsData.pagination.total} {t('results')}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
              disabled={(filters.page || 1) <= 1}
              variant="outlineDark"
              size="small"
            >
              {t('previous')}
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              disabled={(filters.page || 1) >= communicationsData.pagination.totalPages}
              variant="outlineDark"
              size="small"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCommunicationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}