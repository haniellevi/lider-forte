"use client";

import { FC, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Activity, getActivityIcon } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export const ActivityFeed: FC<ActivityFeedProps> = ({
  activities = [],
  className,
  maxItems = 10,
  showFilters = true,
  showLoadMore = false,
  onLoadMore,
  isLoading = false
}) => {
  const t = useTranslations('SuccessLadder');
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filtro por categoria
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    // Filtro por período
    const now = new Date();
    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        
        switch (selectedPeriod) {
          case 'today':
            return activityDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return activityDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return activityDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered.slice(0, maxItems);
  }, [activities, selectedCategory, selectedPeriod, maxItems]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(activities.map(a => a.category))];
    return [
      { key: 'ALL', name: t('filters.all'), icon: '📋' },
      ...uniqueCategories.map(cat => ({
        key: cat,
        name: t(`categories.${cat.toLowerCase()}`, { fallback: cat }),
        icon: getActivityIcon(cat)
      }))
    ];
  }, [activities, t]);

  const periods = [
    { key: 'all' as const, name: t('periods.all') },
    { key: 'today' as const, name: t('periods.today') },
    { key: 'week' as const, name: t('periods.week') },
    { key: 'month' as const, name: t('periods.month') }
  ];

  const totalPoints = filteredActivities.reduce((sum, activity) => sum + activity.points, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-dark dark:text-white">
            {t('activity.title')}
          </h3>
          <p className="text-sm text-body-color dark:text-body-color-dark">
            {t('activity.subtitle', { count: filteredActivities.length })}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            <AnimatedCounter value={totalPoints} suffix=" pts" />
          </div>
          <div className="text-xs text-body-color dark:text-body-color-dark">
            {t('activity.totalPoints')}
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="space-y-3">
          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.key)}
                className={cn(
                  "flex items-center space-x-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedCategory === category.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Filtro por período */}
          <div className="flex gap-2">
            {periods.map((period) => (
              <motion.button
                key={period.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPeriod(period.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedPeriod === period.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                {period.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de atividades */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((activity, index) => (
            <ActivityItem
              key={`${activity.id}-${index}`}
              activity={activity}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 rounded-lg bg-white dark:bg-gray-dark p-4 border border-stroke dark:border-dark-3 animate-pulse"
              >
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

        {/* Empty state */}
        {!isLoading && filteredActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-4">📋</div>
            <p className="text-body-color dark:text-body-color-dark">
              {t('activity.noActivities')}
            </p>
          </motion.div>
        )}

        {/* Load more button */}
        {showLoadMore && !isLoading && filteredActivities.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            className="w-full rounded-lg border-2 border-dashed border-stroke dark:border-dark-3 py-4 text-body-color dark:text-body-color-dark hover:border-primary hover:text-primary transition-colors"
          >
            {t('activity.loadMore')}
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Componente individual de atividade
interface ActivityItemProps {
  activity: Activity;
  index: number;
}

const ActivityItem: FC<ActivityItemProps> = ({ activity, index }) => {
  const t = useTranslations('SuccessLadder');

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('time.minutesAgo', { minutes: diffMins });
    } else if (diffHours < 24) {
      return t('time.hoursAgo', { hours: diffHours });
    } else if (diffDays < 7) {
      return t('time.daysAgo', { days: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
      className="flex items-center space-x-3 rounded-lg bg-white dark:bg-gray-dark p-4 border border-stroke dark:border-dark-3 transition-all"
    >
      {/* Ícone da atividade */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1 }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl"
      >
        {getActivityIcon(activity.category)}
      </motion.div>

      {/* Detalhes da atividade */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-dark dark:text-white truncate">
            {activity.name}
          </h4>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          )}>
            {t(`categories.${activity.category.toLowerCase()}`, { fallback: activity.category })}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            {formatTime(new Date(activity.timestamp))}
          </p>
          
          {activity.metadata && (
            <div className="flex items-center space-x-1 text-xs text-body-color dark:text-body-color-dark">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <span key={key} className="bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pontos ganhos */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.2 }}
        className="text-right"
      >
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-primary">
            +{activity.points}
          </span>
          <span className="text-xs text-body-color dark:text-body-color-dark">
            pts
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente compacto para widgets
interface CompactActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
}

export const CompactActivityFeed: FC<CompactActivityFeedProps> = ({
  activities,
  maxItems = 5,
  className
}) => {
  const t = useTranslations('SuccessLadder');
  const recentActivities = activities.slice(0, maxItems);

  if (recentActivities.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <div className="text-2xl mb-2">📋</div>
        <p className="text-sm text-body-color dark:text-body-color-dark">
          {t('activity.noRecentActivities')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {recentActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              {getActivityIcon(activity.category)}
            </div>
            <div>
              <p className="text-sm font-medium text-dark dark:text-white truncate">
                {activity.name}
              </p>
              <p className="text-xs text-body-color dark:text-body-color-dark">
                {new Date(activity.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-sm font-bold text-primary">
              +{activity.points}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};