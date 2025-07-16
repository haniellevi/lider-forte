'use client';

import React, { useState } from 'react';
import { useSuccessLadderRankings } from '@/hooks/queries/useSuccessLadder';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface SuccessLadderRankingProps {
  cellId?: string;
  type?: 'cell' | 'church';
  limit?: number;
  showPeriodFilter?: boolean;
}

const periodLabels = {
  all: 'Todo período',
  year: 'Último ano',
  quarter: 'Último trimestre',
  month: 'Último mês',
  week: 'Última semana'
};

export function SuccessLadderRanking({ 
  cellId, 
  type = 'church', 
  limit = 20,
  showPeriodFilter = true 
}: SuccessLadderRankingProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('all');
  
  const { data: ranking, isLoading, error } = useSuccessLadderRankings({
    type,
    cell_id: cellId,
    limit,
    period
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Carregando ranking...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar ranking: {error.message}</p>
      </div>
    );
  }

  if (!ranking?.ranking.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">Nenhum membro encontrado no ranking.</p>
      </div>
    );
  }

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}º`;
    }
  };

  const getScoreToShow = (member: any) => {
    return period !== 'all' && member.period_score !== undefined 
      ? member.period_score 
      : member.success_ladder_score;
  };

  const getRankToShow = (member: any) => {
    return period !== 'all' && member.period_rank !== undefined 
      ? member.period_rank 
      : member.rank;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ranking da Escada do Sucesso
            </h3>
            <p className="text-sm text-gray-600">
              {ranking.type === 'cell' && ranking.cell
                ? `Célula: ${ranking.cell.name}`
                : 'Ranking Geral da Igreja'
              }
            </p>
          </div>
          
          {showPeriodFilter && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(periodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Total de Membros
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {ranking.statistics.total_members}
            </p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Maior Pontuação
            </p>
            <p className="text-2xl font-bold text-green-900">
              {ranking.statistics.top_score}
            </p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
              Média de Pontos
            </p>
            <p className="text-2xl font-bold text-yellow-900">
              {ranking.statistics.average_score}
            </p>
          </div>
          
          {ranking.statistics.user_position && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                Sua Posição
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {ranking.statistics.user_position}º
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ranking List */}
      <div className="p-6">
        <div className="space-y-3">
          {ranking.ranking.map((member, index) => {
            const position = getRankToShow(member);
            const score = getScoreToShow(member);
            const isTopThree = position <= 3;
            
            return (
              <div
                key={member.profile_id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isTopThree 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Position */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    isTopThree
                      ? 'bg-yellow-100 text-yellow-800 text-lg'
                      : 'bg-white text-gray-600 border'
                  }`}>
                    {getRankingIcon(position)}
                  </div>

                  {/* Member Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {member.full_name}
                    </h4>
                    {ranking.type === 'church' && member.cell_name && (
                      <p className="text-sm text-gray-600">
                        Célula: {member.cell_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={isTopThree ? 'default' : 'secondary'}
                      className={isTopThree ? 'bg-yellow-500 text-white' : ''}
                    >
                      {score} pontos
                    </Badge>
                  </div>
                  
                  {period !== 'all' && member.success_ladder_score !== score && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {member.success_ladder_score} pontos
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Ranking atualizado em {new Date(ranking.generated_at).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Período: {periodLabels[period]}
          </p>
        </div>
      </div>
    </div>
  );
}