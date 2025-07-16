'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  LevelCard,
  LevelProgressIndicator,
  BadgeCollection,
  EnhancedLeaderboard,
  useLadderLevels,
  useMemberLevel,
  useLevelStatistics
} from '@/components/SuccessLadder';

export default function LevelsAndBadgesPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'levels' | 'badges' | 'leaderboard'>('overview');

  const { data: levels, isLoading: levelsLoading } = useLadderLevels();
  const { data: memberLevel, isLoading: memberLevelLoading } = useMemberLevel(user?.id || '');
  const { data: levelStats } = useLevelStatistics();

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'levels', label: 'Níveis', icon: '🎯' },
    { id: 'badges', label: 'Badges', icon: '🏅' },
    { id: 'leaderboard', label: 'Ranking', icon: '🏆' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Níveis e Badges
        </h1>
        <p className="text-gray-600">
          Acompanhe seu progresso na Escada do Sucesso G12 e conquiste badges únicos.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Member Level Progress */}
            <div className="lg:col-span-2">
              {memberLevel && !memberLevelLoading ? (
                <LevelProgressIndicator
                  memberLevel={memberLevel}
                  showDetails={true}
                  size="lg"
                />
              ) : (
                <div className="bg-white rounded-lg border p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              {levelStats?.map((stat) => (
                <div key={stat.level.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: stat.level.color }}
                    >
                      {stat.level.icon || '🎯'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{stat.level.name}</h4>
                      <p className="text-sm text-gray-600">
                        {stat.memberCount} membros ({stat.percentage}%)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Badges */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Seus Badges Conquistados
              </h3>
              <BadgeCollection
                memberId={user.id}
                showAllBadges={false}
              />
            </div>
          </div>
        )}

        {/* Levels Tab */}
        {activeTab === 'levels' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Níveis da Escada do Sucesso
              </h2>
              <p className="text-gray-600">
                Explore todos os níveis disponíveis e veja o que você precisa para alcançar o próximo.
              </p>
            </div>

            {levels && !levelsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map((level) => {
                  const isCurrentLevel = memberLevel?.level.id === level.id;
                  const statsForLevel = levelStats?.find(stat => stat.level.id === level.id);
                  
                  return (
                    <LevelCard
                      key={level.id}
                      level={level}
                      isCurrentLevel={isCurrentLevel}
                      memberCount={statsForLevel?.memberCount}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border p-4">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Coleção de Badges
              </h2>
              <p className="text-gray-600">
                Explore todos os badges disponíveis e veja seu progresso em cada categoria.
              </p>
            </div>

            <BadgeCollection
              memberId={user.id}
              showAllBadges={true}
            />
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ranking da Igreja
              </h2>
              <p className="text-gray-600">
                Veja como você se compara com outros membros da sua igreja.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Leaderboard */}
              <div className="xl:col-span-2">
                <EnhancedLeaderboard
                  limit={20}
                  showBadges={true}
                />
              </div>

              {/* Side Stats */}
              <div className="space-y-6">
                {/* Your Position */}
                {memberLevel && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Sua Posição</h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {memberLevel.current_score}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">pontos totais</div>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-white font-medium"
                        style={{ backgroundColor: memberLevel.level.color }}
                      >
                        <span>{memberLevel.level.icon || '🎯'}</span>
                        <span>{memberLevel.level.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Level Distribution */}
                {levelStats && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Distribuição por Níveis
                    </h3>
                    <div className="space-y-3">
                      {levelStats.slice(0, 5).map((stat) => (
                        <div key={stat.level.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: stat.level.color }}
                            />
                            <span className="text-sm text-gray-700">
                              {stat.level.name}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {stat.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}