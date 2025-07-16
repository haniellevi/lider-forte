import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { Database } from '@/lib/supabase/types';

type SuccessLadderActivity = Database['public']['Tables']['success_ladder_activities']['Row'];
type ActivityCategory = Database['public']['Enums']['activity_category'];
type MemberActivityLog = Database['public']['Tables']['member_activity_log']['Row'];

// Tipos para as respostas da API
interface ActivityResponse {
  data: SuccessLadderActivity[];
  grouped: Record<ActivityCategory, SuccessLadderActivity[]>;
  pagination: {
    total: number | null;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface MemberScoreResponse {
  member: {
    id: string;
    full_name: string;
    current_score: number;
    stored_score: number;
    is_timoteo: boolean;
    cell: {
      id: string;
      name: string;
      leader_name: string;
    } | null;
    cell_ranking?: {
      position: number | null;
      total_members: number;
    };
  };
  history?: {
    period_days: number;
    total_activities: number;
    total_points_period: number;
    category_breakdown: Record<string, any>;
    recent_activities: any[];
  };
}

interface RankingResponse {
  type: 'cell' | 'church';
  cell?: {
    id: string;
    name: string;
  };
  ranking: Array<{
    profile_id: string;
    full_name: string;
    success_ladder_score: number;
    cell_name?: string;
    rank: number;
    period_score?: number;
    period_rank?: number;
  }>;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  statistics: {
    total_members: number;
    top_score: number;
    average_score: number;
    user_position: number | null;
  };
  generated_at: string;
}

// Hook para buscar atividades disponíveis
export function useSuccessLadderActivities(options?: {
  category?: ActivityCategory;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['success-ladder-activities', options],
    queryFn: async (): Promise<ActivityResponse> => {
      const params = new URLSearchParams();
      
      if (options?.category) params.append('category', options.category);
      if (options?.is_active !== undefined) params.append('is_active', String(options.is_active));
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));

      const response = await fetch(`/api/protected/ladder/activities?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar atividades');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar pontuação de um membro
export function useMemberScore(memberId: string, options?: {
  include_history?: boolean;
  days?: number;
  category?: ActivityCategory;
}) {
  return useQuery({
    queryKey: ['member-score', memberId, options],
    queryFn: async (): Promise<MemberScoreResponse> => {
      const params = new URLSearchParams();
      
      if (options?.include_history) params.append('include_history', 'true');
      if (options?.days) params.append('days', String(options.days));
      if (options?.category) params.append('category', options.category);

      const response = await fetch(`/api/protected/ladder/member/${memberId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pontuação do membro');
      }
      
      return response.json();
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar rankings
export function useSuccessLadderRankings(options?: {
  type?: 'cell' | 'church';
  cell_id?: string;
  limit?: number;
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}) {
  return useQuery({
    queryKey: ['success-ladder-rankings', options],
    queryFn: async (): Promise<RankingResponse> => {
      const params = new URLSearchParams();
      
      if (options?.type) params.append('type', options.type);
      if (options?.cell_id) params.append('cell_id', options.cell_id);
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.period) params.append('period', options.period);

      const response = await fetch(`/api/protected/ladder/rankings?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar rankings');
      }
      
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para registrar atividade
export function useRegisterActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profile_id: string;
      activity_id: string;
      activity_date: string;
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch('/api/protected/ladder/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar atividade');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['member-score', variables.profile_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['success-ladder-rankings']
      });
    },
  });
}

// Hook para registro em lote de presenças
export function useBulkAttendanceRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cell_id: string;
      activity_id: string;
      activity_date: string;
      member_ids: string[];
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch('/api/protected/ladder/bulk-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no registro em lote');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar queries para todos os membros afetados
      variables.member_ids.forEach(memberId => {
        queryClient.invalidateQueries({
          queryKey: ['member-score', memberId]
        });
      });
      
      queryClient.invalidateQueries({
        queryKey: ['success-ladder-rankings']
      });
    },
  });
}

// Hook para criar nova atividade (apenas para líderes)
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      points: number;
      category: ActivityCategory;
      description?: string;
      is_active?: boolean;
    }) => {
      const response = await fetch('/api/protected/ladder/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar atividade');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar lista de atividades
      queryClient.invalidateQueries({
        queryKey: ['success-ladder-activities']
      });
    },
  });
}

// Hook para obter estatísticas resumidas
export function useSuccessLadderStats() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['success-ladder-stats'],
    queryFn: async () => {
      // Buscar dados básicos de estatísticas
      const [activitiesRes, rankingsRes] = await Promise.all([
        fetch('/api/protected/ladder/activities?limit=1'),
        fetch('/api/protected/ladder/rankings?limit=5')
      ]);

      const activities = await activitiesRes.json();
      const rankings = await rankingsRes.json();

      return {
        total_activities: activities.pagination?.total || 0,
        active_activities: activities.data?.filter((a: any) => a.is_active).length || 0,
        top_members: rankings.ranking?.slice(0, 3) || [],
        average_score: rankings.statistics?.average_score || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}