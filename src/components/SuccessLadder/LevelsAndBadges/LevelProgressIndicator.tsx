'use client';

import React from 'react';
import { AnimatedCounter } from '../AnimatedCounter';
import type { MemberLevelData } from '@/hooks/queries/useLevels';

interface LevelProgressIndicatorProps {
  memberLevel: MemberLevelData;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LevelProgressIndicator: React.FC<LevelProgressIndicatorProps> = ({
  memberLevel,
  showDetails = true,
  size = 'md',
  className = '',
}) => {
  const { current_score, level } = memberLevel;
  const { name, color, icon, progress_percentage, points_to_next } = level;

  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 'h-8 w-8 text-lg',
      title: 'text-sm',
      score: 'text-lg',
      progress: 'h-2',
    },
    md: {
      container: 'p-4',
      icon: 'h-10 w-10 text-xl',
      title: 'text-base',
      score: 'text-xl',
      progress: 'h-3',
    },
    lg: {
      container: 'p-6',
      icon: 'h-12 w-12 text-2xl',
      title: 'text-lg',
      score: 'text-2xl',
      progress: 'h-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${classes.container} ${className}`}>
      {/* Level Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            flex items-center justify-center rounded-full text-white font-bold
            ${classes.icon}
          `}
          style={{ backgroundColor: color }}
        >
          {icon || '🎯'}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 ${classes.title}`}>
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <AnimatedCounter 
              value={current_score} 
              className={`font-bold text-primary ${classes.score}`}
            />
            <span className="text-gray-600 text-sm">pontos</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progresso</span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round(progress_percentage)}%
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full ${classes.progress}`}>
          <div
            className={`bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ${classes.progress}`}
            style={{ 
              width: `${Math.min(progress_percentage, 100)}%`,
              backgroundColor: color 
            }}
          />
        </div>
      </div>

      {/* Progress Details */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          {points_to_next > 0 ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Para o próximo nível:</span>
                <span className="font-medium text-gray-900">
                  <AnimatedCounter value={points_to_next} /> pontos
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Continue participando das atividades para subir de nível!
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-600 font-medium">
                <span>👑</span>
                <span>Nível Máximo Alcançado!</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Parabéns! Você atingiu o mais alto nível da Escada do Sucesso.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LevelProgressIndicator;