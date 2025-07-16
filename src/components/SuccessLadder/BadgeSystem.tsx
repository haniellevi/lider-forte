"use client";

import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge, BadgeCategory, BADGE_CATEGORIES, getAllBadges, getCategoryBadges } from './types';

interface BadgeSystemProps {
  unlockedBadges: string[]; // IDs dos badges desbloqueados
  className?: string;
  showCategories?: boolean;
  layout?: 'grid' | 'list';
}

export const BadgeSystem: FC<BadgeSystemProps> = ({
  unlockedBadges = [],
  className,
  showCategories = true,
  layout = 'grid'
}) => {
  const t = useTranslations('SuccessLadder');
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const allBadges = getAllBadges();
  const badgesWithStatus = allBadges.map(badge => ({
    ...badge,
    isUnlocked: unlockedBadges.includes(badge.id)
  }));

  const filteredBadges = selectedCategory === 'ALL' 
    ? badgesWithStatus 
    : badgesWithStatus.filter(badge => badge.category === selectedCategory);

  const categories = [
    { key: 'ALL' as const, name: t('categories.all'), icon: '🏆' },
    { key: 'FREQUENCY' as const, name: t('categories.frequency'), icon: '📅' },
    { key: 'LEADERSHIP' as const, name: t('categories.leadership'), icon: '👑' },
    { key: 'LEARNING' as const, name: t('categories.learning'), icon: '📚' },
    { key: 'SERVICE' as const, name: t('categories.service'), icon: '🤝' }
  ];

  const getUnlockedCount = (category: BadgeCategory) => {
    const categoryBadges = getCategoryBadges(category);
    return categoryBadges.filter(badge => unlockedBadges.includes(badge.id)).length;
  };

  const getTotalCount = (category: BadgeCategory) => {
    return getCategoryBadges(category).length;
  };

  const unlockedCount = badgesWithStatus.filter(b => b.isUnlocked).length;
  const totalCount = badgesWithStatus.length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white">
            {t('badges.title')}
          </h3>
          <p className="text-sm text-body-color dark:text-body-color-dark">
            {t('badges.progress', { unlocked: unlockedCount, total: totalCount })}
          </p>
        </div>
        
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-right"
        >
          <div className="text-2xl font-bold text-primary">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </div>
          <div className="text-xs text-body-color dark:text-body-color-dark">
            {t('badges.completion')}
          </div>
        </motion.div>
      </div>

      {/* Filtros por categoria */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.key;
            const categoryUnlocked = category.key === 'ALL' ? unlockedCount : getUnlockedCount(category.key);
            const categoryTotal = category.key === 'ALL' ? totalCount : getTotalCount(category.key);
            
            return (
              <motion.button
                key={category.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.key)}
                className={cn(
                  "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                {category.key !== 'ALL' && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    isSelected ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    {categoryUnlocked}/{categoryTotal}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Grid de badges */}
      <motion.div
        layout
        className={cn(
          layout === 'grid' 
            ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "space-y-3"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              layout={layout}
              isHovered={hoveredBadge === badge.id}
              onHover={() => setHoveredBadge(badge.id)}
              onLeave={() => setHoveredBadge(null)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredBadges.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-body-color dark:text-body-color-dark">
            {t('badges.noBadges')}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Componente individual de badge
interface BadgeCardProps {
  badge: Badge & { isUnlocked: boolean };
  layout: 'grid' | 'list';
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const BadgeCard: FC<BadgeCardProps> = ({
  badge,
  layout,
  isHovered,
  onHover,
  onLeave
}) => {
  const t = useTranslations('SuccessLadder');

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ scale: 1.02 }}
        onHoverStart={onHover}
        onHoverEnd={onLeave}
        className={cn(
          "flex items-center space-x-4 rounded-lg p-4 transition-all",
          "bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3",
          badge.isUnlocked 
            ? "shadow-md hover:shadow-lg" 
            : "opacity-60 grayscale hover:opacity-80 hover:grayscale-0"
        )}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
          badge.isUnlocked ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"
        )}>
          {badge.icon}
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-dark dark:text-white">
            {badge.name}
          </h4>
          <p className="text-sm text-body-color dark:text-body-color-dark">
            {badge.description}
          </p>
          <p className="text-xs text-body-color dark:text-body-color-dark mt-1">
            {badge.criteria}
          </p>
        </div>

        {badge.isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-500 text-xl"
          >
            ✓
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05, y: -5 }}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      className={cn(
        "relative rounded-lg p-4 text-center transition-all cursor-pointer",
        "bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3",
        badge.isUnlocked 
          ? "shadow-md hover:shadow-lg" 
          : "opacity-60 grayscale hover:opacity-80 hover:grayscale-0"
      )}
    >
      {/* Badge unlock animation */}
      {badge.isUnlocked && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
        >
          ✓
        </motion.div>
      )}

      {/* Badge icon */}
      <div className={cn(
        "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl",
        badge.isUnlocked ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"
      )}>
        {badge.icon}
      </div>

      {/* Badge name */}
      <h4 className="font-bold text-sm text-dark dark:text-white mb-1">
        {badge.name}
      </h4>

      {/* Badge description */}
      <p className="text-xs text-body-color dark:text-body-color-dark">
        {badge.description}
      </p>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
          >
            <div className="bg-dark dark:bg-white text-white dark:text-dark text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              {badge.criteria}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-dark dark:border-t-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Componente compacto para mostrar badges recentes
interface RecentBadgesProps {
  recentBadges: string[];
  className?: string;
  maxShow?: number;
}

export const RecentBadges: FC<RecentBadgesProps> = ({
  recentBadges,
  className,
  maxShow = 3
}) => {
  const t = useTranslations('SuccessLadder');
  const allBadges = getAllBadges();
  const badges = recentBadges
    .slice(0, maxShow)
    .map(id => allBadges.find(b => b.id === id))
    .filter(Boolean) as Badge[];

  if (badges.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-bold text-dark dark:text-white">
        {t('badges.recent')}
      </h4>
      
      <div className="flex -space-x-2">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg border-2 border-white dark:border-gray-dark">
              {badge.icon}
            </div>
            
            {/* Sparkle effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.5
              }}
              className="absolute inset-0 rounded-full bg-yellow-400/30"
            />
          </motion.div>
        ))}
      </div>
      
      {recentBadges.length > maxShow && (
        <p className="text-xs text-body-color dark:text-body-color-dark">
          {t('badges.andMore', { count: recentBadges.length - maxShow })}
        </p>
      )}
    </div>
  );
};