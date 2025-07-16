'use client';

import React, { useState } from 'react';
import { useSuccessLadderActivities, useRegisterActivity } from '@/hooks/queries/useSuccessLadder';
import { Database } from '@/lib/supabase/types';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

type ActivityCategory = Database['public']['Enums']['activity_category'];

interface ActivityRegistrationFormProps {
  profileId: string;
  profileName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categoryLabels: Record<ActivityCategory, string> = {
  attendance: 'Presença',
  events: 'Eventos',
  courses: 'Cursos',
  service: 'Serviço',
  consistency: 'Consistência'
};

const categoryColors: Record<ActivityCategory, string> = {
  attendance: 'bg-blue-100 text-blue-800',
  events: 'bg-purple-100 text-purple-800',
  courses: 'bg-green-100 text-green-800',
  service: 'bg-orange-100 text-orange-800',
  consistency: 'bg-yellow-100 text-yellow-800'
};

export function ActivityRegistrationForm({ 
  profileId, 
  profileName,
  onSuccess,
  onCancel 
}: ActivityRegistrationFormProps) {
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | ''>('');

  const { data: activitiesData, isLoading: loadingActivities } = useSuccessLadderActivities({
    is_active: true,
    limit: 100
  });

  const registerActivity = useRegisterActivity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedActivityId || !activityDate) {
      return;
    }

    try {
      await registerActivity.mutateAsync({
        profile_id: profileId,
        activity_id: selectedActivityId,
        activity_date: activityDate,
        metadata: {
          registered_via: 'form',
          registered_at: new Date().toISOString()
        }
      });

      onSuccess?.();
      
      // Reset form
      setSelectedActivityId('');
      setActivityDate(new Date().toISOString().split('T')[0]);
      setSelectedCategory('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getFilteredActivities = () => {
    if (!activitiesData?.data) return [];
    
    return selectedCategory 
      ? activitiesData.data.filter(activity => activity.category === selectedCategory)
      : activitiesData.data;
  };

  const getSelectedActivity = () => {
    return activitiesData?.data.find(activity => activity.id === selectedActivityId);
  };

  if (loadingActivities) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
        <span className="ml-2">Carregando atividades...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Registrar Atividade
        </h3>
        {profileName && (
          <p className="text-sm text-gray-600 mt-1">
            Para: {profileName}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria (filtro)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === '' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {Object.entries(categoryLabels).map(([category, label]) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category as ActivityCategory)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category 
                    ? categoryColors[category as ActivityCategory]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Selection */}
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
            Atividade *
          </label>
          <select
            id="activity"
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Selecione uma atividade</option>
            {getFilteredActivities().map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name} ({activity.points} pontos)
              </option>
            ))}
          </select>
        </div>

        {/* Activity Details */}
        {getSelectedActivity() && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">
                {getSelectedActivity()?.name}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                categoryColors[getSelectedActivity()?.category as ActivityCategory]
              }`}>
                {categoryLabels[getSelectedActivity()?.category as ActivityCategory]}
              </span>
            </div>
            {getSelectedActivity()?.description && (
              <p className="text-sm text-gray-600 mb-2">
                {getSelectedActivity()?.description}
              </p>
            )}
            <p className="text-sm font-medium text-green-600">
              +{getSelectedActivity()?.points} pontos
            </p>
          </div>
        )}

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Data da Atividade *
          </label>
          <input
            type="date"
            id="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Error Message */}
        {registerActivity.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {registerActivity.error.message}
            </p>
          </div>
        )}

        {/* Success Message */}
        {registerActivity.isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">
              Atividade registrada com sucesso!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={registerActivity.isPending}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={!selectedActivityId || !activityDate || registerActivity.isPending}
            className="min-w-[120px]"
          >
            {registerActivity.isPending ? (
              <div className="flex items-center">
                <Spinner className="h-4 w-4 mr-2" />
                Registrando...
              </div>
            ) : (
              'Registrar'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}