import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase/types';

type LadderLevel = Database['public']['Tables']['ladder_levels']['Row'];
type LadderLevelInsert = Database['public']['Tables']['ladder_levels']['Insert'];
type LadderLevelUpdate = Database['public']['Tables']['ladder_levels']['Update'];

export interface MemberLevel {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  progress_percentage: number;
  points_to_next: number;
}

export interface MemberLevelData {
  member_id: string;
  current_score: number;
  level: MemberLevel;
}

export interface LeaderboardEntry {
  profile_id: string;
  full_name: string;
  success_ladder_score: number;
  level_name: string;
  level_color: string;
  level_icon: string;
  badge_count: number;
  rank: number;
  avatar_url?: string | null;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  total_members: number;
  church_id: string;
}

// Hook to fetch all ladder levels
export const useLadderLevels = () => {
  return useQuery({
    queryKey: ['ladder-levels'],
    queryFn: async () => {
      const response = await fetch('/api/protected/ladder/levels');
      if (!response.ok) {
        throw new Error('Failed to fetch ladder levels');
      }
      const data = await response.json();
      return data.levels as LadderLevel[];
    },
  });
};

// Hook to fetch member's current level
export const useMemberLevel = (memberId: string) => {
  return useQuery({
    queryKey: ['member-level', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/protected/ladder/member/${memberId}/level`);
      if (!response.ok) {
        throw new Error('Failed to fetch member level');
      }
      const data = await response.json();
      return data as MemberLevelData;
    },
    enabled: !!memberId,
  });
};

// Hook to fetch church leaderboard with levels
export const useLeaderboard = (churchId?: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['leaderboard', churchId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (churchId) params.append('church_id', churchId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/protected/ladder/leaderboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      return data as LeaderboardData;
    },
  });
};

// Hook to create a ladder level
export const useCreateLadderLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: LadderLevelInsert) => {
      const response = await fetch('/api/protected/ladder/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(level),
      });

      if (!response.ok) {
        throw new Error('Failed to create ladder level');
      }

      const data = await response.json();
      return data.level as LadderLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ladder-levels'] });
    },
  });
};

// Hook to update a ladder level
export const useUpdateLadderLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: LadderLevelUpdate & { id: number }) => {
      const response = await fetch('/api/protected/ladder/levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updateData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ladder level');
      }

      const data = await response.json();
      return data.level as LadderLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ladder-levels'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// Hook to get level by score (utility function)
export const useLevelByScore = (score: number, levels?: LadderLevel[]) => {
  if (!levels) return null;

  for (const level of levels) {
    if (score >= level.min_points && score <= level.max_points) {
      return level;
    }
  }

  // Return the first level if no match found
  return levels[0] || null;
};

// Hook to calculate level progress
export const useLevelProgress = (currentScore: number, levels?: LadderLevel[]) => {
  if (!levels) return { progress: 0, pointsToNext: 0, nextLevel: null };

  const currentLevel = useLevelByScore(currentScore, levels);
  if (!currentLevel) return { progress: 0, pointsToNext: 0, nextLevel: null };

  const nextLevel = levels.find(level => level.order_index === currentLevel.order_index + 1);
  
  if (!nextLevel) {
    // Already at max level
    return { progress: 100, pointsToNext: 0, nextLevel: null };
  }

  const pointsInCurrentLevel = currentScore - currentLevel.min_points;
  const pointsNeededForNext = nextLevel.min_points - currentLevel.min_points;
  const progress = Math.min((pointsInCurrentLevel / pointsNeededForNext) * 100, 100);
  const pointsToNext = nextLevel.min_points - currentScore;

  return {
    progress: Math.round(progress * 100) / 100,
    pointsToNext: Math.max(pointsToNext, 0),
    nextLevel,
  };
};

// Hook to get level statistics
export const useLevelStatistics = () => {
  const { data: levels } = useLadderLevels();
  const { data: leaderboard } = useLeaderboard();

  return useQuery({
    queryKey: ['level-statistics', levels, leaderboard],
    queryFn: () => {
      if (!levels || !leaderboard) return null;

      const statistics = levels.map(level => {
        const membersInLevel = leaderboard.leaderboard.filter(member => {
          const score = member.success_ladder_score;
          return score >= level.min_points && score <= level.max_points;
        });

        return {
          level,
          memberCount: membersInLevel.length,
          percentage: leaderboard.total_members > 0 
            ? Math.round((membersInLevel.length / leaderboard.total_members) * 100)
            : 0,
        };
      });

      return statistics;
    },
    enabled: !!(levels && leaderboard),
  });
};