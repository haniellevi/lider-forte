"use client";

import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LeaderboardEntry, getCurrentLevel } from './types';
import { AnimatedCounter, CompactLevelProgress } from './AnimatedCounter';

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
  title?: string;
  showPeriodFilter?: boolean;
  maxEntries?: number;
  showLevels?: boolean;
  type?: 'cell' | 'church';
}

export const LeaderboardWidget: FC<LeaderboardWidgetProps> = ({
  entries = [],
  currentUserId,
  className,
  title,
  showPeriodFilter = false,
  maxEntries = 10,
  showLevels = true,
  type = 'cell'
}) => {
  const t = useTranslations('SuccessLadder');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('all');

  const periods = [
    { key: 'week' as const, name: t('periods.week'), icon: '📅' },
    { key: 'month' as const, name: t('periods.month'), icon: '📊' },
    { key: 'quarter' as const, name: t('periods.quarter'), icon: '📈' },
    { key: 'all' as const, name: t('periods.allTime'), icon: '🏆' }
  ];

  const displayEntries = entries.slice(0, maxEntries);
  const currentUserEntry = entries.find(entry => entry.id === currentUserId);
  const currentUserRank = currentUserEntry?.rank || null;

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 2: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      case 3: return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-dark dark:text-white">
            {title || t(`leaderboard.${type}.title`)}
          </h3>
          <p className="text-sm text-body-color dark:text-body-color-dark">
            {t('leaderboard.subtitle', { count: entries.length })}
          </p>
        </div>

        {showPeriodFilter && (
          <div className="flex gap-1">
            {periods.map((period) => (
              <motion.button
                key={period.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPeriod(period.key)}
                className={cn(
                  "flex items-center space-x-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                  selectedPeriod === period.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <span>{period.icon}</span>
                <span className="hidden sm:inline">{period.name}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Posição do usuário atual (se não estiver no top) */}
      {currentUserEntry && currentUserRank && currentUserRank > maxEntries && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-primary/5 border border-primary/20 p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">
              {t('leaderboard.yourPosition')}
            </p>
            <span className="text-sm font-bold text-primary">
              #{currentUserRank}
            </span>
          </div>
          <UserRankingCard
            entry={currentUserEntry}
            isCurrentUser={true}
            showLevel={showLevels}
            compact={true}
          />
        </motion.div>
      )}

      {/* Lista do ranking */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayEntries.map((entry, index) => (
            <UserRankingCard
              key={entry.id}
              entry={entry}
              index={index}
              isCurrentUser={entry.id === currentUserId}
              showLevel={showLevels}
            />
          ))}
        </AnimatePresence>

        {/* Loading skeleton */}
        {displayEntries.length === 0 && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 rounded-lg bg-white dark:bg-gray-dark p-4 border border-stroke dark:border-dark-3 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {displayEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-body-color dark:text-body-color-dark">
            {t('leaderboard.noData')}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Componente individual de entrada no ranking
interface UserRankingCardProps {
  entry: LeaderboardEntry;
  index?: number;
  isCurrentUser: boolean;
  showLevel: boolean;
  compact?: boolean;
}

const UserRankingCard: FC<UserRankingCardProps> = ({
  entry,
  index = 0,
  isCurrentUser,
  showLevel,
  compact = false
}) => {
  const t = useTranslations('SuccessLadder');

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 2: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      case 3: return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "flex items-center space-x-3 rounded-lg p-3 transition-all",
        "bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3",
        isCurrentUser && "bg-primary/5 border-primary/20",
        compact ? "p-2" : "p-4"
      )}
    >
      {/* Posição no ranking */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1 }}
        className={cn(
          "flex items-center justify-center rounded-full font-bold",
          getRankColor(entry.rank),
          compact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
        )}
      >
        {entry.rank <= 3 ? getTrophyIcon(entry.rank) : `#${entry.rank}`}
      </motion.div>

      {/* Avatar/Inicial */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.2 }}
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-white font-bold",
          compact ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg"
        )}
      >
        {entry.avatar ? (
          <img
            src={entry.avatar}
            alt={entry.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          entry.name.charAt(0).toUpperCase()
        )}
      </motion.div>

      {/* Informações do usuário */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className={cn(
            "font-medium text-dark dark:text-white truncate",
            isCurrentUser && "text-primary",
            compact ? "text-sm" : "text-base"
          )}>
            {entry.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-primary">
                ({t('leaderboard.you')})
              </span>
            )}
          </h4>
        </div>

        {showLevel && !compact && (
          <div className="mt-1">
            <CompactLevelProgress 
              currentPoints={entry.score}
              showText={false}
            />
            <p className="text-xs text-body-color dark:text-body-color-dark mt-1">
              {entry.level.name}
            </p>
          </div>
        )}

        {showLevel && compact && (
          <p className="text-xs text-body-color dark:text-body-color-dark">
            {entry.level.name}
          </p>
        )}
      </div>

      {/* Pontuação */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 + 0.3 }}
        className="text-right"
      >
        <div className={cn(
          "font-bold text-primary",
          compact ? "text-sm" : "text-lg"
        )}>
          <AnimatedCounter
            value={entry.score}
            duration={0.5}
            separator="."
          />
        </div>
        <div className={cn(
          "text-body-color dark:text-body-color-dark",
          compact ? "text-xs" : "text-sm"
        )}>
          {t('points')}
        </div>
      </motion.div>

      {/* Indicador de posição atual do usuário */}
      {isCurrentUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-primary text-sm"
        >
          👤
        </motion.div>
      )}
    </motion.div>
  );
};

// Componente de pódio para top 3
interface PodiumProps {
  topThree: LeaderboardEntry[];
  className?: string;
}

export const Podium: FC<PodiumProps> = ({ topThree, className }) => {
  const t = useTranslations('SuccessLadder');

  // Reordenar para mostrar 2º, 1º, 3º (visual do pódio)
  const podiumOrder = [
    topThree[1], // 2º lugar (esquerda)
    topThree[0], // 1º lugar (centro)
    topThree[2]  // 3º lugar (direita)
  ].filter(Boolean);

  const podiumHeights = ['h-20', 'h-24', 'h-16']; // Alturas do pódio
  const positions = [2, 1, 3]; // Posições correspondentes

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <h3 className="text-lg font-bold text-dark dark:text-white">
          {t('leaderboard.podium.title')}
        </h3>
      </div>

      <div className="flex items-end justify-center space-x-4">
        {podiumOrder.map((entry, index) => {
          if (!entry) return null;
          
          const position = positions[index];
          const height = podiumHeights[index];
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="text-center"
            >
              {/* Avatar e nome */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mb-2"
              >
                <div className={cn(
                  "mx-auto mb-2 flex items-center justify-center rounded-full bg-primary text-white font-bold",
                  position === 1 ? "w-16 h-16 text-xl" : "w-12 h-12 text-lg"
                )}>
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                <p className={cn(
                  "font-medium text-dark dark:text-white truncate",
                  position === 1 ? "text-base" : "text-sm"
                )}>
                  {entry.name}
                </p>
                
                <p className="text-xs text-body-color dark:text-body-color-dark">
                  <AnimatedCounter value={entry.score} suffix=" pts" />
                </p>
              </motion.div>

              {/* Base do pódio */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.2 + 0.5, duration: 0.5 }}
                className={cn(
                  "w-20 rounded-t-lg flex items-center justify-center text-white font-bold text-2xl",
                  height,
                  position === 1 && "bg-yellow-500",
                  position === 2 && "bg-gray-400",
                  position === 3 && "bg-orange-500"
                )}
              >
                {position === 1 && '🥇'}
                {position === 2 && '🥈'}
                {position === 3 && '🥉'}
              </motion.div>
              
              <div className="text-xs text-body-color dark:text-body-color-dark mt-1">
                {position}º {t('leaderboard.place')}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};