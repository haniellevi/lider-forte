"use client";

import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LadderLevel, getCurrentLevel, getNextLevel, getProgressToNextLevel } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface LevelProgressBarProps {
  currentPoints: number;
  previousPoints?: number;
  className?: string;
  showLevelUpAnimation?: boolean;
  onLevelUp?: (newLevel: LadderLevel) => void;
}

export const LevelProgressBar: FC<LevelProgressBarProps> = ({
  currentPoints,
  previousPoints = 0,
  className,
  showLevelUpAnimation = true,
  onLevelUp
}) => {
  const t = useTranslations('SuccessLadder');
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const currentLevel = getCurrentLevel(currentPoints);
  const nextLevel = getNextLevel(currentLevel);
  const progressPercent = getProgressToNextLevel(currentPoints);
  
  const previousLevel = getCurrentLevel(previousPoints);
  const hasLeveledUp = currentLevel.id > previousLevel.id;

  useEffect(() => {
    if (hasLeveledUp && showLevelUpAnimation) {
      setShowLevelUp(true);
      onLevelUp?.(currentLevel);
      
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasLeveledUp, showLevelUpAnimation, currentLevel, onLevelUp]);

  const pointsInCurrentLevel = currentPoints - currentLevel.minPoints;
  const pointsNeededForLevel = currentLevel.maxPoints - currentLevel.minPoints + 1;
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - currentPoints : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="rounded-[20px] bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-center text-white shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">
                {t('levelUp')}
              </h2>
              <p className="text-xl">
                {t('achievedLevel', { level: currentLevel.name })}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Level Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold"
            style={{ backgroundColor: currentLevel.color }}
          >
            {currentLevel.id}
          </motion.div>
          <div>
            <h3 className="font-bold text-lg text-dark dark:text-white">
              {currentLevel.name}
            </h3>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <AnimatedCounter
                value={currentPoints}
                suffix=" pontos"
                className="font-medium"
              />
            </p>
          </div>
        </div>

        {nextLevel && (
          <div className="text-right">
            <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
              {t('nextLevel')}
            </p>
            <p className="font-bold text-dark dark:text-white">
              {nextLevel.name}
            </p>
            <p className="text-xs text-body-color dark:text-body-color-dark">
              {t('pointsNeeded', { points: pointsToNextLevel })}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-body-color dark:text-body-color-dark">
            {t('progress')}
          </span>
          <span className="font-medium text-dark dark:text-white">
            {progressPercent}%
          </span>
        </div>
        
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
          {/* Background gradient */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})`
            }}
          />
          
          {/* Progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ backgroundColor: currentLevel.color }}
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
          
          {/* Level markers */}
          {nextLevel && (
            <div className="absolute inset-0 flex items-center justify-end pr-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                className="w-2 h-2 rounded-full bg-white shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Points breakdown */}
        <div className="flex justify-between text-xs text-body-color dark:text-body-color-dark">
          <span>
            {currentLevel.minPoints} pts
          </span>
          {nextLevel && (
            <span>
              {nextLevel.minPoints} pts
            </span>
          )}
        </div>
      </div>

      {/* Level details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-4 text-center"
      >
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
            {t('currentLevelPoints')}
          </p>
          <p className="text-lg font-bold text-dark dark:text-white">
            <AnimatedCounter value={pointsInCurrentLevel} />
            <span className="text-sm text-body-color dark:text-body-color-dark">
              /{pointsNeededForLevel}
            </span>
          </p>
        </div>
        
        {nextLevel && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
              {t('pointsToNext')}
            </p>
            <p className="text-lg font-bold text-dark dark:text-white">
              <AnimatedCounter value={pointsToNextLevel} />
            </p>
          </div>
        )}
      </motion.div>

      {/* Max level reached */}
      {!nextLevel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
        >
          <div className="text-2xl mb-2">👑</div>
          <p className="font-bold">{t('maxLevelReached')}</p>
          <p className="text-sm opacity-90">{t('maxLevelDescription')}</p>
        </motion.div>
      )}
    </div>
  );
};

// Componente compacto para uso em cards
interface CompactLevelProgressProps {
  currentPoints: number;
  className?: string;
  showText?: boolean;
}

export const CompactLevelProgress: FC<CompactLevelProgressProps> = ({
  currentPoints,
  className,
  showText = true
}) => {
  const currentLevel = getCurrentLevel(currentPoints);
  const progressPercent = getProgressToNextLevel(currentPoints);

  return (
    <div className={cn("space-y-1", className)}>
      {showText && (
        <div className="flex justify-between text-xs">
          <span className="font-medium" style={{ color: currentLevel.color }}>
            {currentLevel.name}
          </span>
          <span className="text-body-color dark:text-body-color-dark">
            {progressPercent}%
          </span>
        </div>
      )}
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: currentLevel.color }}
        />
      </div>
    </div>
  );
};