"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateReport } from '@/hooks/queries/useReports';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/modal';
import { X, Download, Zap } from 'lucide-react';
import { ReportGenerationRequest, ReportGenerationResponse } from '@/types/reports';

// Schema de validação
const generateReportSchema = z.object({
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ], { required_error: 'Tipo de relatório é obrigatório' }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  period_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  format: z.enum(['json', 'pdf', 'excel']).default('json'),
});

type GenerateFormData = z.infer<typeof generateReportSchema>;

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const t = useTranslations('Reports');
  const [generatedReport, setGeneratedReport] = useState<ReportGenerationResponse | null>(null);
  
  const generateMutation = useGenerateReport();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      report_type: 'church_overview',
      format: 'json',
    }
  });

  const selectedType = watch('report_type');
  const selectedFormat = watch('format');

  const onSubmit = async (data: GenerateFormData) => {
    try {
      const request: ReportGenerationRequest = {
        report_type: data.report_type,
        filters: {
          start_date: data.start_date,
          end_date: data.end_date,
          period_type: data.period_type,
        },
        format: data.format,
      };

      const result = await generateMutation.mutateAsync(request);
      setGeneratedReport(result);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setGeneratedReport(null);
  };

  const handleDownload = () => {
    if (!generatedReport) return;

    const dataStr = JSON.stringify(generatedReport.data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio_${generatedReport.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const reportTypeOptions = [
    { value: 'church_overview', label: t('types.church_overview') },
    { value: 'cell_performance', label: t('types.cell_performance') },
    { value: 'member_growth', label: t('types.member_growth') },
    { value: 'leadership_development', label: t('types.leadership_development') },
  ];

  const formatOptions = [
    { value: 'json', label: t('generate.formats.json') },
    { value: 'pdf', label: t('generate.formats.pdf') },
    { value: 'excel', label: t('generate.formats.excel') },
  ];

  const periodOptions = [
    { value: '', label: 'Todos os períodos' },
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
            {t('generate.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!generatedReport ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">
                {t('generate.subtitle')}
              </p>

              {/* Tipo de Relatório */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('generate.selectReportType')}
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

              {/* Filtros de Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('form.startDate')}
                  </label>
                  <input
                    type="date"
                    {...register('start_date')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('form.endDate')}
                  </label>
                  <input
                    type="date"
                    {...register('end_date')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.periodType')}
                </label>
                <select
                  {...register('period_type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('generate.selectFormat')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formatOptions.map(option => (
                    <label
                      key={option.value}
                      className={`relative flex cursor-pointer rounded-md border p-3 text-center text-sm font-medium ${
                        selectedFormat === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('format')}
                        value={option.value}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Descrição do Relatório */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {reportTypeOptions.find(opt => opt.value === selectedType)?.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getReportDescription(selectedType)}
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
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  icon={<Zap className="h-4 w-4" />}
                >
                  {isSubmitting ? t('generate.generating') : t('actions.generate')}
                </Button>
              </div>
            </form>
          ) : (
            // Resultado do Relatório
            <div className="space-y-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('generate.success')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('generate.downloadReady')}
                </p>
              </div>

              {/* Informações do Relatório */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
                    <dd className="text-sm text-gray-900 dark:text-white font-mono">
                      {generatedReport.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Gerado em
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(generatedReport.generated_at).toLocaleString('pt-BR')}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleClose}
                  variant="outlineDark"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                >
                  {t('actions.download')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Helper function para descrições de relatórios
function getReportDescription(reportType: string): string {
  const descriptions: Record<string, string> = {
    'church_overview': 'Visão geral completa da igreja incluindo estatísticas gerais, métricas de crescimento e atividades recentes.',
    'cell_performance': 'Análise detalhada da performance das células, ranking por membros e crescimento.',
    'member_growth': 'Relatório de crescimento de membros com tendências e análise por período.',
    'leadership_development': 'Acompanhamento do desenvolvimento de liderança e programa Timóteo.',
  };
  
  return descriptions[reportType] || 'Descrição não disponível.';
}