'use client';

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/lib/supabase/types';

type BadgeCategory = Database['public']['Enums']['badge_category'];
type BadgeRarity = Database['public']['Enums']['badge_rarity'];

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
}

interface MemberBadge extends Badge {
  earned_at: string;
  is_featured: boolean;
}

interface BadgeCardProps {
  badge: Badge | MemberBadge;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showCategory?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  earned = false,
  earnedAt,
  size = 'md',
  showCategory = true,
  className = '',
  onClick,
}) => {
  const isEarned = earned || ('earned_at' in badge);
  const displayEarnedAt = earnedAt || ('earned_at' in badge ? badge.earned_at : null);

  const getRarityColor = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common':
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
      case 'rare':
        return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' };
      case 'epic':
        return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' };
      case 'legendary':
        return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
    }
  };

  const getCategoryLabel = (category: BadgeCategory) => {
    switch (category) {
      case 'frequency':
        return 'Frequência';
      case 'leadership':
        return 'Liderança';
      case 'learning':
        return 'Aprendizado';
      case 'service':
        return 'Serviço';
      case 'special':
        return 'Especial';
      default:
        return category;
    }
  };

  const getRarityLabel = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common':
        return 'Comum';
      case 'rare':
        return 'Raro';
      case 'epic':
        return 'Épico';
      case 'legendary':
        return 'Lendário';
      default:
        return rarity;
    }
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'text-2xl h-8 w-8',
    md: 'text-3xl h-10 w-10',
    lg: 'text-4xl h-12 w-12',
  };

  const rarityColors = getRarityColor(badge.rarity);

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border transition-all duration-200
        ${isEarned 
          ? `${rarityColors.bg} ${rarityColors.border} shadow-md` 
          : 'bg-gray-50 border-gray-200 opacity-60'
        }
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <span className={`
          inline-block px-2 py-1 text-xs font-medium rounded-full
          ${rarityColors.bg} ${rarityColors.text} border ${rarityColors.border}
        `}>
          {getRarityLabel(badge.rarity)}
        </span>
      </div>

      {/* Badge Icon */}
      <div className="flex justify-center mb-3">
        <div className={`
          flex items-center justify-center rounded-full
          ${isEarned ? 'bg-white shadow-sm' : 'bg-gray-200'}
          ${iconSizes[size]}
        `}>
          <span className={iconSizes[size]}>
            {badge.icon}
          </span>
        </div>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className={`
          font-semibold mb-1
          ${isEarned ? rarityColors.text : 'text-gray-500'}
          ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}
        `}>
          {badge.name}
        </h3>
        
        <p className={`
          text-sm mb-2 line-clamp-2
          ${isEarned ? 'text-gray-700' : 'text-gray-400'}
        `}>
          {badge.description}
        </p>

        {/* Category */}
        {showCategory && (
          <div className="mb-2">
            <span className={`
              inline-block px-2 py-1 text-xs rounded
              ${isEarned ? 'bg-white/50 text-gray-700' : 'bg-gray-300 text-gray-500'}
            `}>
              {getCategoryLabel(badge.category)}
            </span>
          </div>
        )}

        {/* Earned Date */}
        {isEarned && displayEarnedAt && (
          <div className="text-xs text-gray-600">
            Conquistado em {format(new Date(displayEarnedAt), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        )}

        {/* Featured Badge */}
        {'is_featured' in badge && badge.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="text-yellow-500 text-lg">⭐</span>
          </div>
        )}
      </div>

      {/* Earned Overlay */}
      {isEarned && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-full h-full">
            <div className={`
              w-full h-full rounded-lg border-2 border-dashed opacity-30
              ${rarityColors.border}
            `} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeCard;