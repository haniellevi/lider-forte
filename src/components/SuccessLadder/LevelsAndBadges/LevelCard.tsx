'use client';

import React from 'react';
import type { Database } from '@/lib/supabase/types';

type LadderLevel = Database['public']['Tables']['ladder_levels']['Row'];

interface LevelCardProps {
  level: LadderLevel;
  isCurrentLevel?: boolean;
  memberCount?: number;
  className?: string;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  isCurrentLevel = false,
  memberCount,
  className = '',
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border p-4 transition-all duration-200
        ${isCurrentLevel 
          ? 'border-2 border-primary bg-primary/5 shadow-lg' 
          : 'border-gray-200 bg-white hover:shadow-md'
        }
        ${className}
      `}
    >
      {/* Level Icon and Name */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className={`
            flex h-12 w-12 items-center justify-center rounded-full text-white text-xl font-bold
            ${isCurrentLevel ? 'ring-2 ring-primary ring-offset-2' : ''}
          `}
          style={{ backgroundColor: level.color }}
        >
          {level.icon || '🎯'}
        </div>
        <div>
          <h3 className={`font-semibold ${isCurrentLevel ? 'text-primary' : 'text-gray-900'}`}>
            {level.name}
          </h3>
          <p className="text-sm text-gray-600">
            {level.min_points} - {level.max_points === 999999 ? '∞' : level.max_points} pontos
          </p>
        </div>
      </div>

      {/* Description */}
      {level.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {level.description}
        </p>
      )}

      {/* Features Unlocked */}
      {level.unlocks_features && level.unlocks_features.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-600 mb-1">Recursos Desbloqueados:</h4>
          <div className="flex flex-wrap gap-1">
            {level.unlocks_features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {feature.replace(/_/g, ' ')}
              </span>
            ))}
            {level.unlocks_features.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{level.unlocks_features.length - 3} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Member Count */}
      {memberCount !== undefined && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Membros neste nível:</span>
          <span className={`font-semibold ${isCurrentLevel ? 'text-primary' : 'text-gray-900'}`}>
            {memberCount}
          </span>
        </div>
      )}

      {/* Current Level Indicator */}
      {isCurrentLevel && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
            <span>🎯</span>
            <span>Atual</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelCard;