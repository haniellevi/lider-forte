'use client';

import React, { useState } from 'react';
import { AnimatedCounter } from '../AnimatedCounter';
import { useLeaderboard } from '@/hooks/queries/useLevels';
import type { LeaderboardEntry } from '@/hooks/queries/useLevels';

interface EnhancedLeaderboardProps {
  churchId?: string;
  limit?: number;
  showBadges?: boolean;
  className?: string;
}

export const EnhancedLeaderboard: React.FC<EnhancedLeaderboardProps> = ({
  churchId,
  limit = 10,
  showBadges = true,
  className = '',
}) => {
  const [selectedView, setSelectedView] = useState<'top' | 'all'>('top');
  const { data: leaderboardData, isLoading, error } = useLeaderboard(churchId, limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-50';
      case 2:
        return 'text-gray-600 bg-gray-50';
      case 3:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-700 bg-white';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Erro ao carregar ranking</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData?.leaderboard.length) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <p>Nenhum membro encontrado no ranking</p>
        </div>
      </div>
    );
  }

  const { leaderboard, total_members } = leaderboardData;

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🏆 Ranking da Escada do Sucesso
          </h3>
          <div className="text-sm text-gray-600">
            {total_members} {total_members === 1 ? 'membro' : 'membros'}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedView('top')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'top'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Top {limit}
          </button>
          <button
            onClick={() => setSelectedView('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-100">
        {leaderboard.map((member: LeaderboardEntry, index) => (
          <div
            key={member.profile_id}
            className={`p-4 transition-colors hover:bg-gray-50 ${getRankColor(member.rank)}`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                {getRankIcon(member.rank) || (
                  <span className="text-sm font-semibold text-gray-600">
                    #{member.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {member.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {member.full_name}
                  </h4>
                  
                  {/* Level Badge */}
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: member.level_color }}
                  >
                    <span>{member.level_icon || '🎯'}</span>
                    <span>{member.level_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <AnimatedCounter value={member.success_ladder_score} />
                    <span>pts</span>
                  </div>

                  {/* Badges */}
                  {showBadges && member.badge_count > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🏅</span>
                      <span>{member.badge_count} {member.badge_count === 1 ? 'badge' : 'badges'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Points Display */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-gray-900">
                  <AnimatedCounter value={member.success_ladder_score} />
                </div>
                <div className="text-xs text-gray-500">pontos</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {leaderboard.length === limit && total_members > limit && (
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Mostrando top {limit} de {total_members} membros
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedLeaderboard;