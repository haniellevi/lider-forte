"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMassCommunication } from '@/hooks/queries/useNotifications';
import { useCells } from '@/hooks/queries/useCells';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { 
  X, 
  Send, 
  Calendar,
  Users,
  MessageSquare,
  Settings
} from 'lucide-react';
import { CreateMassCommunicationRequest } from '@/types/notifications';

interface CreateCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createCommunicationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  target_type: z.enum(['all', 'role', 'cell', 'custom']),
  target_criteria: z.record(z.any()).optional().default({}),
  delivery_method: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).optional(),
  scheduled_for: z.string().optional(),
});

type CreateCommunicationForm = z.infer<typeof createCommunicationSchema>;

export function CreateCommunicationModal({ isOpen, onClose }: CreateCommunicationModalProps) {
  const t = useTranslations('Communications');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['in_app']);

  const { data: cellsData } = useCells();
  const createMutation = useCreateMassCommunication();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateCommunicationForm>({
    resolver: zodResolver(createCommunicationSchema) as any,
    defaultValues: {
      target_type: 'all',
      target_criteria: {},
      delivery_method: ['in_app']
    }
  });

  const targetType = watch('target_type');

  const handleClose = () => {
    reset();
    setSelectedRoles([]);
    setSelectedCells([]);
    setSelectedMethods(['in_app']);
    onClose();
  };

  const onSubmit = async (data: CreateCommunicationForm) => {
    try {
      let targetCriteria = {};
      
      if (data.target_type === 'role') {
        targetCriteria = { roles: selectedRoles };
      } else if (data.target_type === 'cell') {
        targetCriteria = { cell_ids: selectedCells };
      }

      const communicationData: CreateMassCommunicationRequest = {
        ...data,
        target_criteria: targetCriteria,
        delivery_method: selectedMethods as any[],
        ...(data.scheduled_for && { scheduled_for: new Date(data.scheduled_for).toISOString() })
      };

      await createMutation.mutateAsync(communicationData);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar comunicação:', error);
    }
  };

  const handleRoleToggle = (role: string) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(newRoles);
  };

  const handleCellToggle = (cellId: string) => {
    const newCells = selectedCells.includes(cellId)
      ? selectedCells.filter(c => c !== cellId)
      : [...selectedCells, cellId];
    setSelectedCells(newCells);
  };

  const handleMethodToggle = (method: string) => {
    const newMethods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    setSelectedMethods(newMethods);
  };

  const availableRoles = [
    { value: 'member', label: t('roles.member') },
    { value: 'leader', label: t('roles.leader') },
    { value: 'supervisor', label: t('roles.supervisor') },
    { value: 'pastor', label: t('roles.pastor') }
  ];

  const deliveryMethods = [
    { value: 'in_app', label: t('deliveryMethods.in_app'), icon: MessageSquare },
    { value: 'email', label: t('deliveryMethods.email'), icon: MessageSquare },
    { value: 'sms', label: t('deliveryMethods.sms'), icon: MessageSquare },
    { value: 'push', label: t('deliveryMethods.push'), icon: MessageSquare }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('createTitle')}
          </h2>
          <Button
            type="button"
            onClick={handleClose}
            variant="ghost"
            size="small"
            icon={<X className="h-4 w-4" />}
          />
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.title')} *
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.message')} *
            </label>
            <textarea
              {...register('message')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('form.messagePlaceholder')}
            />
            {errors.message && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.message.message}
              </p>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{t('form.targetAudience')}</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.targetType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: t('targetType.all') },
                { value: 'role', label: t('targetType.role') },
                { value: 'cell', label: t('targetType.cell') },
                { value: 'custom', label: t('targetType.custom') }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('target_type')}
                    type="radio"
                    value={option.value}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          {targetType === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('form.selectRoles')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <label key={role.value} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {role.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Cell Selection */}
          {targetType === 'cell' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('form.selectCells')}
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                {cellsData?.data?.map((cell: any) => (
                  <label key={cell.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCells.includes(cell.id)}
                      onChange={() => handleCellToggle(cell.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {cell.name}
                    </span>
                  </label>
                )) || (
                  <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('form.noCells')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('form.deliveryMethods')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {deliveryMethods.map((method) => (
              <label key={method.value} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={selectedMethods.includes(method.value)}
                  onChange={() => handleMethodToggle(method.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <method.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {method.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{t('form.scheduling')}</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.scheduledFor')} ({t('form.optional')})
            </label>
            <input
              {...register('scheduled_for')}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('form.schedulingHelp')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={handleClose}
            variant="outlineDark"
            disabled={isSubmitting}
          >
            {t('form.cancel')}
          </Button>
          
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            icon={<Send className="h-4 w-4" />}
          >
            {isSubmitting ? t('form.creating') : t('form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}