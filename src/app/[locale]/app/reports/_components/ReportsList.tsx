"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReports, useDeleteReport } from '@/hooks/queries/useReports';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Share,
  Download,
  FileText,
  Clock,
  User,
  Globe,
  Lock
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { CreateReportModal } from './CreateReportModal';
import { ReportFilters } from '@/types/reports';

export function ReportsList() {
  const t = useTranslations('Reports');
  const [filters, setFilters] = useState<ReportFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);

  // Aplicar busca aos filtros
  const appliedFilters: ReportFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
  };

  const { data: reportsData, isLoading, error } = useReports(appliedFilters);
  const deleteReportMutation = useDeleteReport();

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      await deleteReportMutation.mutateAsync(reportId);
    }
  };

  const getReportTypeLabel = (type: string) => {
    return t(`types.${type}` as any) || type;
  };

  const getPeriodLabel = (period: string) => {
    return t(`periods.${period}` as any) || period;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-2">
          {t('messages.loadError')}
        </p>
        <Button onClick={() => window.location.reload()} variant="outlineDark">
          {t('retry')}
        </Button>
      </div>
    );
  }

  const reports = reportsData?.reports || [];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('list.searchPlaceholder')}
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
            {t('form.filters')}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.type')}
              </label>
              <select
                value={filters.report_type || ''}
                onChange={(e) => setFilters({ ...filters, report_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('list.allTypes')}</option>
                <option value="church_overview">{t('types.church_overview')}</option>
                <option value="cell_performance">{t('types.cell_performance')}</option>
                <option value="member_growth">{t('types.member_growth')}</option>
                <option value="leadership_development">{t('types.leadership_development')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibilidade
              </label>
              <select
                value={filters.is_public === undefined ? '' : filters.is_public ? 'true' : 'false'}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  is_public: e.target.value === '' ? undefined : e.target.value === 'true' 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">{t('list.showPublic')}</option>
                <option value="false">{t('list.showPrivate')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setFilters({})}
              variant="outlineDark"
              size="small"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('list.noReports')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('list.noReportsDescription')}
          </p>
          <Button onClick={() => setEditingReport('new')} variant="primary">
            {t('list.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {report.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {getReportTypeLabel(report.report_type)}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  {report.is_public ? (
                    <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                  
                  <div className="relative group">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>{t('actions.view')}</span>
                        </button>
                        <button 
                          onClick={() => setEditingReport(report.id)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>{t('actions.edit')}</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                          <Download className="h-4 w-4" />
                          <span>{t('actions.download')}</span>
                        </button>
                        {report.is_public && (
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                            <Share className="h-4 w-4" />
                            <span>{t('actions.share')}</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteReportMutation.isPending}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{t('actions.delete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {report.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {report.description}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span>{report.created_by_profile?.full_name || 'Usuário'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {t('list.createdAt')}: {new Date(report.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                {report.scheduled_frequency && (
                  <div className="flex items-center space-x-2">
                    <span>Frequência: {getPeriodLabel(report.scheduled_frequency)}</span>
                  </div>
                )}
                
                {report.last_generated_at && (
                  <div className="flex items-center space-x-2">
                    <span>
                      {t('list.lastGenerated')}: {new Date(report.last_generated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {reportsData?.pagination && reportsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('pagination.showing')} {((reportsData.pagination.page - 1) * reportsData.pagination.limit) + 1} a{' '}
            {Math.min(reportsData.pagination.page * reportsData.pagination.limit, reportsData.pagination.total)} {t('pagination.of')}{' '}
            {reportsData.pagination.total} {t('pagination.results')}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
              disabled={(filters.page || 1) <= 1}
              variant="outlineDark"
              size="small"
            >
              {t('pagination.previous')}
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              disabled={(filters.page || 1) >= reportsData.pagination.totalPages}
              variant="outlineDark"
              size="small"
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <CreateReportModal
          isOpen={true}
          onClose={() => setEditingReport(null)}
          reportId={editingReport === 'new' ? undefined : editingReport}
        />
      )}
    </div>
  );
}