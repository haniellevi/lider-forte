"use client";

import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LadderLevel, Badge } from './types';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: LadderLevel;
  previousLevel?: LadderLevel;
  newBadges?: Badge[];
  totalPoints: number;
  pointsGained?: number;
  className?: string;
}

export const LevelUpModal: FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  newLevel,
  previousLevel,
  newBadges = [],
  totalPoints,
  pointsGained = 0,
  className
}) => {
  const t = useTranslations('SuccessLadder');
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowConfetti(true);
      
      // Sequence of animations
      const timer1 = setTimeout(() => setCurrentStep(1), 1000);
      const timer2 = setTimeout(() => setCurrentStep(2), 2000);
      const timer3 = setTimeout(() => setCurrentStep(3), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Confetti Animation */}
        {showConfetti && <ConfettiAnimation />}

        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-gray-dark shadow-2xl overflow-hidden",
            className
          )}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>

          {/* Background gradient */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${previousLevel?.color || '#666'}, ${newLevel.color})`
            }}
          />

          <div className="relative p-8 text-center space-y-6">
            {/* Step 0: Initial celebration */}
            <AnimatePresence mode="wait">
              {currentStep >= 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl"
                  >
                    🎉
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-dark dark:text-white"
                  >
                    {t('levelUp.congratulations')}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-body-color dark:text-body-color-dark"
                  >
                    {t('levelUp.newLevelReached')}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 1: Level progression */}
            <AnimatePresence>
              {currentStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center space-x-4">
                    {/* Previous level */}
                    {previousLevel && (
                      <>
                        <motion.div
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                        >
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                            style={{ backgroundColor: previousLevel.color }}
                          >
                            {previousLevel.id}
                          </div>
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            {previousLevel.name}
                          </p>
                        </motion.div>

                        {/* Arrow */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-2xl text-primary"
                        >
                          →
                        </motion.div>
                      </>
                    )}

                    {/* New level */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1.1 }}
                      transition={{ 
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0.7)",
                            "0 0 0 10px rgba(59, 130, 246, 0)",
                            "0 0 0 0 rgba(59, 130, 246, 0)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2"
                        style={{ backgroundColor: newLevel.color }}
                      >
                        {newLevel.id}
                      </motion.div>
                      <p className="font-bold text-lg text-dark dark:text-white">
                        {newLevel.name}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2: Points gained */}
            <AnimatePresence>
              {currentStep >= 2 && pointsGained > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                      {t('levelUp.pointsGained')}
                    </p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                    >
                      +{pointsGained} {t('points')}
                    </motion.p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t('levelUp.totalPoints', { total: totalPoints })}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: New badges */}
            <AnimatePresence>
              {currentStep >= 3 && newBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <h3 className="font-bold text-dark dark:text-white">
                    {t('levelUp.newBadges')}
                  </h3>
                  
                  <div className="flex justify-center space-x-3">
                    {newBadges.slice(0, 3).map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: index * 0.2,
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                        className="text-center"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-2xl mb-1 mx-auto border-2 border-yellow-400"
                        >
                          {badge.icon}
                        </motion.div>
                        <p className="text-xs font-medium text-dark dark:text-white">
                          {badge.name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  
                  {newBadges.length > 3 && (
                    <p className="text-xs text-body-color dark:text-body-color-dark">
                      {t('levelUp.andMoreBadges', { count: newBadges.length - 3 })}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
              className="space-y-3 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors"
              >
                {t('levelUp.continue')}
              </motion.button>
              
              <p className="text-xs text-body-color dark:text-body-color-dark">
                {t('levelUp.keepGoing')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente de animação de confetti
const ConfettiAnimation: FC = () => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 360,
            transition: {
              duration: Math.random() * 3 + 2,
              ease: "linear",
              repeat: 0
            }
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            left: Math.random() * 100 + '%'
          }}
        />
      ))}
    </div>
  );
};

// Hook para gerenciar o estado do modal de level up
export const useLevelUpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    newLevel: LadderLevel;
    previousLevel?: LadderLevel;
    newBadges?: Badge[];
    totalPoints: number;
    pointsGained?: number;
  } | null>(null);

  const showLevelUp = (data: {
    newLevel: LadderLevel;
    previousLevel?: LadderLevel;
    newBadges?: Badge[];
    totalPoints: number;
    pointsGained?: number;
  }) => {
    setModalData(data);
    setIsOpen(true);
  };

  const hideLevelUp = () => {
    setIsOpen(false);
    setModalData(null);
  };

  return {
    isOpen,
    modalData,
    showLevelUp,
    hideLevelUp
  };
};