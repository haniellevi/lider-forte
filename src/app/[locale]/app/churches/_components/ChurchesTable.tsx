"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useChurches, useDeleteChurch, type Church, type ChurchFilters } from '@/hooks/queries/useChurches';
import { useRouter } from 'next/navigation';
import { useShowToast } from '@/store';
import { Eye, Edit, Trash2, MapPin, Users, Building, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChurchesTableProps {
  filters?: ChurchFilters;
}

export default function ChurchesTable({ filters = {} }: ChurchesTableProps) {
  const t = useTranslations('ChurchesPage');
  const router = useRouter();
  const showToast = useShowToast();
  const [currentPage, setCurrentPage] = useState(filters.page || 1);
  
  const { data, isLoading, error } = useChurches({
    ...filters,
    page: currentPage,
    limit: 10,
  });
  
  const deleteChurchMutation = useDeleteChurch();

  const handleView = (church: Church) => {
    router.push(`/app/churches/${church.id}`);
  };

  const handleEdit = (church: Church) => {
    router.push(`/app/churches/${church.id}/edit`);
  };

  const handleDelete = async (church: Church) => {
    if (!confirm(t('confirmDelete', { name: church.name }))) {
      return;
    }

    try {
      await deleteChurchMutation.mutateAsync(church.id);
      showToast({
        type: 'success',
        message: t('deleteSuccess', { name: church.name }),
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: t('deleteError'),
      });
    }
  };

  const formatAddress = (address: Church['address']) => {
    if (!address) return '-';
    const parts = [address.city, address.state].filter(Boolean);
    return parts.join(', ') || '-';
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 dark:text-red-400">
          {t('errorLoading')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Mobile Cards */}
      <div className="block md:hidden">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {data?.data.map((church) => (
              <div
                key={church.id}
                className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-dark-2"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-dark dark:text-white">
                      {church.name}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-dark-4 dark:text-dark-6">
                      <MapPin className="mr-1 h-3 w-3" />
                      {formatAddress(church.address)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleView(church)}
                      className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(church)}
                      className="rounded p-1.5 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(church)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      disabled={deleteChurchMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm text-dark-4 dark:text-dark-6">
                  <div className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    {church.profiles_count || 0} {t('members')}
                  </div>
                  <div className="flex items-center">
                    <Building className="mr-1 h-3 w-3" />
                    {church.cells_count || 0} {t('cells')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-dark-2">
                <th className="px-4 py-4 font-medium text-dark dark:text-white xl:pl-11">
                  {t('table.name')}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {t('table.location')}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {t('table.contact')}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {t('table.stats')}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {t('table.pastor')}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-4 py-5 xl:pl-11">
                      <div className="animate-pulse">
                        <div className="mb-1 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                data?.data.map((church) => (
                  <tr key={church.id} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-4 py-5 xl:pl-11">
                      <div>
                        <h5 className="font-medium text-dark dark:text-white">
                          {church.name}
                        </h5>
                        {church.cnpj && (
                          <p className="text-sm text-dark-4 dark:text-dark-6">
                            CNPJ: {church.cnpj}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-dark dark:text-white">
                        {formatAddress(church.address)}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="text-sm">
                        {church.email && (
                          <p className="text-dark dark:text-white">{church.email}</p>
                        )}
                        {church.phone && (
                          <p className="text-dark-4 dark:text-dark-6">{church.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="text-sm">
                        <p className="text-dark dark:text-white">
                          {church.profiles_count || 0} {t('members')}
                        </p>
                        <p className="text-dark-4 dark:text-dark-6">
                          {church.cells_count || 0} {t('cells')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="text-sm">
                        {church.pastors && church.pastors.length > 0 ? (
                          <p className="text-dark dark:text-white">
                            {church.pastors[0].full_name}
                          </p>
                        ) : (
                          <p className="text-dark-4 dark:text-dark-6">-</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(church)}
                          className="rounded p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title={t('actions.view')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(church)}
                          className="rounded p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                          title={t('actions.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(church)}
                          className="rounded p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title={t('actions.delete')}
                          disabled={deleteChurchMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stroke px-4 py-4 dark:border-dark-3">
          <div className="text-sm text-dark-4 dark:text-dark-6">
            {t('pagination.showing', {
              start: (data.pagination.page - 1) * data.pagination.limit + 1,
              end: Math.min(data.pagination.page * data.pagination.limit, data.pagination.total),
              total: data.pagination.total,
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded border border-stroke px-3 py-1.5 text-sm text-dark hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-dark-3 dark:text-white dark:hover:bg-dark/20"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </button>
            
            <span className="text-sm text-dark dark:text-white">
              {currentPage} / {data.pagination.totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= data.pagination.totalPages}
              className="flex items-center gap-1 rounded border border-stroke px-3 py-1.5 text-sm text-dark hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-dark-3 dark:text-white dark:hover:bg-dark/20"
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="py-12 text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-dark dark:text-white">
            {t('emptyState.title')}
          </h3>
          <p className="mt-2 text-dark-4 dark:text-dark-6">
            {t('emptyState.description')}
          </p>
          <button
            onClick={() => router.push('/app/churches/new')}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            {t('emptyState.action')}
          </button>
        </div>
      )}
    </div>
  );
}