'use client';

import React, { useState } from 'react';
import { BadgeCard } from './BadgeCard';
import { useMemberBadges, useBadges, useBadgeMetadata } from '@/hooks/queries/useBadges';
import type { Database } from '@/lib/supabase/types';

type BadgeCategory = Database['public']['Enums']['badge_category'];
type BadgeRarity = Database['public']['Enums']['badge_rarity'];

interface BadgeCollectionProps {
  memberId: string;
  showAllBadges?: boolean;
  className?: string;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  memberId,
  showAllBadges = false,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'all'>('all');

  const { data: earnedBadges, isLoading: isLoadingEarned } = useMemberBadges(memberId);
  const { data: allBadges, isLoading: isLoadingAll } = useBadges();
  const { categories, rarities } = useBadgeMetadata();

  const isLoading = isLoadingEarned || (showAllBadges && isLoadingAll);

  // Create a map of earned badges for quick lookup
  const earnedBadgeIds = new Set(earnedBadges?.map(badge => badge.badge_id) || []);

  // Filter badges based on selection
  const filteredBadges = React.useMemo(() => {
    if (!showAllBadges || !allBadges) {
      return earnedBadges?.filter(badge => {
        const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
        const rarityMatch = selectedRarity === 'all' || badge.rarity === selectedRarity;
        return categoryMatch && rarityMatch;
      }) || [];
    }

    return allBadges.filter(badge => {
      const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
      const rarityMatch = selectedRarity === 'all' || badge.rarity === selectedRarity;
      return categoryMatch && rarityMatch;
    });
  }, [earnedBadges, allBadges, selectedCategory, selectedRarity, showAllBadges]);

  // Statistics
  const stats = React.useMemo(() => {
    if (!earnedBadges || !allBadges) return null;

    const totalBadges = allBadges.length;
    const earnedCount = earnedBadges.length;
    const progressPercentage = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

    const categoryStats = categories.map(category => {
      const categoryBadges = allBadges.filter(badge => badge.category === category.value);
      const earnedInCategory = earnedBadges.filter(badge => badge.category === category.value);
      return {
        category: category.label,
        total: categoryBadges.length,
        earned: earnedInCategory.length,
      };
    });

    const rarityStats = rarities.map(rarity => {
      const rarityBadges = allBadges.filter(badge => badge.rarity === rarity.value);
      const earnedInRarity = earnedBadges.filter(badge => badge.rarity === rarity.value);
      return {
        rarity: rarity.label,
        color: rarity.color,
        total: rarityBadges.length,
        earned: earnedInRarity.length,
      };
    });

    return {
      total: totalBadges,
      earned: earnedCount,
      progressPercentage,
      categoryStats,
      rarityStats,
    };
  }, [earnedBadges, allBadges, categories, rarities]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics (only show when viewing all badges) */}
      {showAllBadges && stats && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Progresso dos Badges</h3>
          
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Progresso Geral</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.earned}/{stats.total} ({Math.round(stats.progressPercentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Category Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {stats.categoryStats.map(stat => (
              <div key={stat.category} className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">{stat.category}</div>
                <div className="text-gray-600">{stat.earned}/{stat.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as BadgeCategory | 'all')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value as BadgeRarity | 'all')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Raridades</option>
          {rarities.map(rarity => (
            <option key={rarity.value} value={rarity.value}>
              {rarity.label}
            </option>
          ))}
        </select>
      </div>

      {/* Badge Grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={showAllBadges ? earnedBadgeIds.has(badge.id) : true}
              size="md"
              showCategory={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            {showAllBadges ? '🏆' : '🎯'}
          </div>
          <p className="text-gray-600">
            {showAllBadges 
              ? 'Nenhum badge encontrado com os filtros selecionados.'
              : 'Nenhum badge conquistado ainda. Continue participando das atividades!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;