'use client';

import React, { useState } from 'react';
import { useMemberScore } from '@/hooks/queries/useSuccessLadder';
import { Database } from '@/lib/supabase/types';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

type ActivityCategory = Database['public']['Enums']['activity_category'];

interface MemberScoreProfileProps {
  memberId: string;
  showHistory?: boolean;
  historyDays?: number;
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

export function MemberScoreProfile({ 
  memberId, 
  showHistory = true, 
  historyDays = 30 
}: MemberScoreProfileProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(historyDays);
  
  const { data: memberData, isLoading, error } = useMemberScore(memberId, {
    include_history: showHistory,
    days: selectedPeriod
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Carregando perfil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar perfil: {error.message}</p>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">Membro não encontrado.</p>
      </div>
    );
  }

  const { member, history } = memberData;

  const getTimoteoStatus = () => {
    if (member.is_timoteo) {
      return (
        <Badge className="bg-purple-500 text-white">
          🎓 Timóteo
        </Badge>
      );
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {member.full_name}
            </h2>
            {member.cell && (
              <p className="text-sm text-gray-600 mt-1">
                Célula: {member.cell.name} | Líder: {member.cell.leader_name}
              </p>
            )}
          </div>
          <div className="text-right">
            {getTimoteoStatus()}
          </div>
        </div>

        {/* Score Display */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Pontuação Atual
            </p>
            <p className="text-3xl font-bold text-blue-900 mt-1">
              {member.current_score}
            </p>
            <p className="text-xs text-blue-600 mt-1">pontos</p>
          </div>

          {member.cell_ranking && (
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                Posição na Célula
              </p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {member.cell_ranking.position || '-'}º
              </p>
              <p className="text-xs text-green-600 mt-1">
                de {member.cell_ranking.total_members} membros
              </p>
            </div>
          )}

          {history && (
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
                Últimos {selectedPeriod} dias
              </p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {history.total_points_period}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {history.total_activities} atividades
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {showHistory && history && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico de Atividades
              </h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={365}>Último ano</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {/* Category Breakdown */}
            {Object.keys(history.category_breakdown).length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Por Categoria</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(history.category_breakdown).map(([category, data]: [string, any]) => (
                    <div
                      key={category}
                      className={`p-4 rounded-lg ${categoryColors[category as ActivityCategory]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">
                          {categoryLabels[category as ActivityCategory]}
                        </h5>
                        <span className="text-sm font-bold">
                          {data.total_points} pts
                        </span>
                      </div>
                      <p className="text-sm opacity-80">
                        {data.activity_count} atividade{data.activity_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recent Activities */}
                {history.recent_activities?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Atividades Recentes
                    </h4>
                    <div className="space-y-2">
                      {history.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {activity.success_ladder_activities?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(activity.activity_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                categoryColors[activity.success_ladder_activities?.category as ActivityCategory]
                              }
                            >
                              +{activity.points_earned} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Nenhuma atividade registrada nos últimos {selectedPeriod} dias.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}