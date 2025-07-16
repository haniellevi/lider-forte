import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import type { Database } from '@/lib/supabase/types';

type Badge = Database['public']['Tables']['badges']['Row'];
type BadgeInsert = Database['public']['Tables']['badges']['Insert'];
type BadgeUpdate = Database['public']['Tables']['badges']['Update'];
type BadgeCategory = Database['public']['Enums']['badge_category'];
type BadgeRarity = Database['public']['Enums']['badge_rarity'];

export interface BadgeFilters {
  category?: BadgeCategory;
  rarity?: BadgeRarity;
}

export interface MemberBadge {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  earned_at: string;
  is_featured: boolean;
}

// Hook to fetch all badges
export const useBadges = (filters?: BadgeFilters) => {
  return useQuery({
    queryKey: ['badges', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.rarity) params.append('rarity', filters.rarity);

      const response = await fetch(`/api/protected/ladder/badges?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      const data = await response.json();
      return data.badges as Badge[];
    },
  });
};

// Hook to fetch member badges
export const useMemberBadges = (memberId: string) => {
  return useQuery({
    queryKey: ['member-badges', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/protected/ladder/member/${memberId}/badges`);
      if (!response.ok) {
        throw new Error('Failed to fetch member badges');
      }
      const data = await response.json();
      return data.badges as MemberBadge[];
    },
    enabled: !!memberId,
  });
};

// Hook to create a badge
export const useCreateBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badge: BadgeInsert) => {
      const response = await fetch('/api/protected/ladder/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badge),
      });

      if (!response.ok) {
        throw new Error('Failed to create badge');
      }

      const data = await response.json();
      return data.badge as Badge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
};

// Hook to update a badge
export const useUpdateBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: BadgeUpdate & { id: string }) => {
      const response = await fetch('/api/protected/ladder/badges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updateData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update badge');
      }

      const data = await response.json();
      return data.badge as Badge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
};

// Hook to delete a badge
export const useDeleteBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const response = await fetch(`/api/protected/ladder/badges?id=${badgeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete badge');
      }

      return { id: badgeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
};

// Hook to award a badge to a member
export const useAwardBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      badgeId, 
      reason 
    }: { 
      memberId: string; 
      badgeId: string; 
      reason?: string; 
    }) => {
      const response = await fetch(`/api/protected/ladder/member/${memberId}/badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badge_id: badgeId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award badge');
      }

      return await response.json();
    },
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-badges', memberId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// Hook to get badge categories and rarities
export const useBadgeMetadata = () => {
  return {
    categories: [
      { value: 'frequency', label: 'Frequência' },
      { value: 'leadership', label: 'Liderança' },
      { value: 'learning', label: 'Aprendizado' },
      { value: 'service', label: 'Serviço' },
      { value: 'special', label: 'Especial' },
    ] as const,
    rarities: [
      { value: 'common', label: 'Comum', color: '#9CA3AF' },
      { value: 'rare', label: 'Raro', color: '#3B82F6' },
      { value: 'epic', label: 'Épico', color: '#8B5CF6' },
      { value: 'legendary', label: 'Lendário', color: '#F59E0B' },
    ] as const,
  };
};