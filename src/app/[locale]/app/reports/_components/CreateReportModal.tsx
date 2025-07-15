"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateReport, useUpdateReport, useReport } from '@/hooks/queries/useReports';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/modal';
import { X } from 'lucide-react';
import { CreateReportRequest, UpdateReportRequest } from '@/types/reports';

// Schema de validação
const reportSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional(),
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ], { required_error: 'Tipo de relatório é obrigatório' }),
  is_public: z.boolean().default(false),
  scheduled_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string; // Para edição
}

export function CreateReportModal({ isOpen, onClose, reportId }: CreateReportModalProps) {
  const t = useTranslations('Reports');
  const isEditing = !!reportId;
  
  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const { data: existingReport, isLoading: isLoadingReport } = useReport(reportId || '');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: '',
      description: '',
      report_type: 'church_overview',
      is_public: false,
    }
  });

  // Carregar dados do relatório existente
  useEffect(() => {
    if (isEditing && existingReport && !isLoadingReport) {
      reset({
        name: existingReport.name,
        description: existingReport.description || '',
        report_type: existingReport.report_type,
        is_public: existingReport.is_public,
        scheduled_frequency: existingReport.scheduled_frequency,
      });
    }
  }, [existingReport, isEditing, isLoadingReport, reset]);

  const onSubmit = async (data: ReportFormData) => {
    try {
      if (isEditing && reportId) {
        const updateData: UpdateReportRequest = {
          id: reportId,
          ...data,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        const createData: CreateReportRequest = data;
        await createMutation.mutateAsync(createData);
      }
      
      onClose();
      reset();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const reportTypeOptions = [
    { value: 'church_overview', label: t('types.church_overview') },
    { value: 'cell_performance', label: t('types.cell_performance') },
    { value: 'member_growth', label: t('types.member_growth') },
    { value: 'leadership_development', label: t('types.leadership_development') },
    { value: 'financial_summary', label: t('types.financial_summary') },
    { value: 'attendance_tracking', label: t('types.attendance_tracking') },
    { value: 'event_statistics', label: t('types.event_statistics') },
  ];

  const frequencyOptions = [
    { value: '', label: t('form.noSchedule') },
    { value: 'daily', label: t('periods.daily') },
    { value: 'weekly', label: t('periods.weekly') },
    { value: 'monthly', label: t('periods.monthly') },
    { value: 'quarterly', label: t('periods.quarterly') },
    { value: 'yearly', label: t('periods.yearly') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.name')}
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder={t('form.namePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.description')}
            </label>
            <textarea
              {...register('description')}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.type')}
            </label>
            <select
              {...register('report_type')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.report_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.report_type.message}
              </p>
            )}
          </div>

          {/* Frequência de Atualização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.scheduledFrequency')}
            </label>
            <select
              {...register('scheduled_frequency')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Relatório Público */}
          <div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('is_public')}
                id="is_public"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.isPublic')}
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('form.isPublicDescription')}
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={handleClose}
              variant="outlineDark"
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isEditing ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}