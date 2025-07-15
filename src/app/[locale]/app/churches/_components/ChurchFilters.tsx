"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, X } from 'lucide-react';
import { type ChurchFilters } from '@/hooks/queries/useChurches';

interface ChurchFiltersProps {
  onFiltersChange?: (filters: ChurchFilters) => void;
  initialFilters?: ChurchFilters;
}

export default function ChurchFilters({ onFiltersChange, initialFilters = {} }: ChurchFiltersProps) {
  const t = useTranslations('ChurchesPage');
  const [filters, setFilters] = useState<ChurchFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange?.(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleCityChange = (value: string) => {
    setFilters(prev => ({ ...prev, city: value || undefined }));
  };

  const handleStateChange = (value: string) => {
    setFilters(prev => ({ ...prev, state: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  // Estados brasileiros para o select
  const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];

  return (
    <div className="rounded-lg bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Search Bar */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-stroke bg-transparent py-2 pl-10 pr-4 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-primary text-white'
                : 'border border-stroke bg-white text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark/20'
            }`}
          >
            <Filter className="h-4 w-4" />
            {t('filters.advanced')}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-md border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark/20"
            >
              <X className="h-4 w-4" />
              {t('filters.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-stroke pt-4 dark:border-dark-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* City Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {t('filters.city')}
              </label>
              <input
                type="text"
                placeholder={t('filters.cityPlaceholder')}
                value={filters.city || ''}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full rounded-md border border-stroke bg-transparent py-2 px-3 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            {/* State Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {t('filters.state')}
              </label>
              <select
                value={filters.state || ''}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full rounded-md border border-stroke bg-transparent py-2 px-3 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              >
                <option value="">{t('filters.allStates')}</option>
                {brazilianStates.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-end">
              <div className="flex w-full gap-2">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, city: 'São Paulo' }));
                  }}
                  className="flex-1 rounded-md border border-stroke bg-white px-3 py-2 text-sm text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark/20"
                >
                  São Paulo
                </button>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, city: 'Rio de Janeiro' }));
                  }}
                  className="flex-1 rounded-md border border-stroke bg-white px-3 py-2 text-sm text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark/20"
                >
                  Rio de Janeiro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          <span className="text-sm font-medium text-dark dark:text-white">
            {t('filters.active')}:
          </span>
          
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {t('filters.searchLabel')}: &ldquo;{filters.search}&rdquo;
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.city && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {t('filters.cityLabel')}: {filters.city}
              <button
                onClick={() => handleCityChange('')}
                className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.state && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-300">
              {t('filters.stateLabel')}: {brazilianStates.find(s => s.value === filters.state)?.label}
              <button
                onClick={() => handleStateChange('')}
                className="ml-1 hover:text-green-600 dark:hover:text-green-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}