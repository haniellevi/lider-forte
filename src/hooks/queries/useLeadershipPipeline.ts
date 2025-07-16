import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { Database } from '@/lib/supabase/types';

type LeadershipLevel = Database['public']['Enums']['leadership_level'];
type FactorCategory = Database['public']['Enums']['factor_category'];
type AssessmentType = Database['public']['Enums']['assessment_type'];

export interface LeadershipPipelineItem {
  profile_id: string;
  profiles: {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
  };
  leadership_score: number;
  potential_level: LeadershipLevel;
  confidence_score: number;
  last_calculated_at: string;
  recommendations: string[];
  factors: Record<string, any>;
  cell?: {
    id: string;
    name: string;
  } | null;
  success_ladder_score: number;
  assessment_count: number;
}

export interface LeadershipPipelineResponse {
  pipeline: LeadershipPipelineItem[];
  summary: {
    total: number;
    by_level: Record<string, number>;
  };
  total: number;
}

export interface LeadershipPipelineFilters {
  limit?: number;
  potential_level?: LeadershipLevel;
  min_score?: number;
}

export interface MemberLeadershipProfile {
  profile_id: string;
  full_name: string;
  leadership_score: number;
  potential_level: LeadershipLevel;
  confidence_score: number;
  factors: Record<string, any>;
  recommendations: string[];
  assessment_count: number;
  last_calculated_at: string;
  is_calculated: boolean;
  member_info: {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    created_at: string;
  };
  cell?: {
    id: string;
    name: string;
    leader_id: string;
    profiles: {
      full_name: string;
    };
  } | null;
  cell_membership?: {
    joined_at: string;
    success_ladder_score: number;
    is_timoteo: boolean;
  } | null;
  recent_assessments: any[];
  activity_history: any[];
  growth_trend: Record<string, number>;
}

export interface LeadershipAssessment {
  id: string;
  profile_id: string;
  assessment_type: AssessmentType;
  scores: Record<string, number>;
  comments: string | null;
  assessment_date: string;
  is_validated: boolean;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  assessor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface LeadershipRecommendations {
  member: {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
  };
  leadership_score: number;
  potential_level: LeadershipLevel;
  confidence_score: number;
  recommendations: string[];
  factor_insights: Array<{
    name: string;
    score: number;
    weight: number;
    weighted_score: number;
    category: FactorCategory;
    status: 'good' | 'moderate' | 'needs_improvement';
  }>;
  action_plans: Array<{
    factor: string;
    category: FactorCategory;
    current_score: number;
    target_score: number;
    priority: 'high' | 'medium' | 'low';
    actions: string[];
    timeline: string;
  }>;
  next_steps: string[];
  last_calculated_at: string;
  is_calculated: boolean;
}

// Hook para buscar pipeline de liderança
export function useLeadershipPipeline(filters: LeadershipPipelineFilters = {}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['leadership-pipeline', filters],
    queryFn: async (): Promise<LeadershipPipelineResponse> => {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.potential_level) params.append('potential_level', filters.potential_level);
      if (filters.min_score) params.append('min_score', filters.min_score.toString());

      const response = await fetch(`/api/protected/leadership/pipeline?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leadership pipeline');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook para buscar perfil de liderança de um membro específico
export function useMemberLeadershipProfile(memberId: string) {
  return useQuery({
    queryKey: ['member-leadership-profile', memberId],
    queryFn: async (): Promise<MemberLeadershipProfile> => {
      const response = await fetch(`/api/protected/leadership/member/${memberId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch member leadership profile');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook para buscar recomendações detalhadas
export function useLeadershipRecommendations(memberId: string) {
  return useQuery({
    queryKey: ['leadership-recommendations', memberId],
    queryFn: async (): Promise<LeadershipRecommendations> => {
      const response = await fetch(`/api/protected/leadership/recommendations/${memberId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leadership recommendations');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook para buscar avaliações
export function useLeadershipAssessments(filters: {
  profile_id?: string;
  assessment_type?: AssessmentType;
  limit?: number;
  validated?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['leadership-assessments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.profile_id) params.append('profile_id', filters.profile_id);
      if (filters.assessment_type) params.append('assessment_type', filters.assessment_type);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.validated !== undefined) params.append('validated', filters.validated.toString());

      const response = await fetch(`/api/protected/leadership/assessment?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leadership assessments');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutation para recalcular scores do pipeline
export function useRecalculateLeadershipPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/protected/leadership/pipeline', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate leadership pipeline');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch pipeline data
      queryClient.invalidateQueries({ queryKey: ['leadership-pipeline'] });
    },
  });
}

// Mutation para recalcular score de um membro específico
export function useRecalculateMemberScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/protected/leadership/member/${memberId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate member score');
      }

      return response.json();
    },
    onSuccess: (data, memberId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['member-leadership-profile', memberId] });
      queryClient.invalidateQueries({ queryKey: ['leadership-recommendations', memberId] });
      queryClient.invalidateQueries({ queryKey: ['leadership-pipeline'] });
    },
  });
}

// Mutation para submeter avaliação
export function useSubmitLeadershipAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessment: {
      profile_id: string;
      assessment_type: AssessmentType;
      scores: Record<string, number>;
      comments?: string;
    }) => {
      const response = await fetch('/api/protected/leadership/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit assessment');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leadership-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['member-leadership-profile', variables.profile_id] });
      queryClient.invalidateQueries({ queryKey: ['leadership-recommendations', variables.profile_id] });
      queryClient.invalidateQueries({ queryKey: ['leadership-pipeline'] });
    },
  });
}

// Mutation para atualizar recomendações personalizadas
export function useUpdateLeadershipRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      custom_recommendations,
      notes
    }: {
      memberId: string;
      custom_recommendations: string[];
      notes?: string;
    }) => {
      const response = await fetch(`/api/protected/leadership/recommendations/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ custom_recommendations, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recommendations');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leadership-recommendations', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-leadership-profile', variables.memberId] });
    },
  });
}

// Utility function para mapear níveis de liderança para cores
export function getLeadershipLevelColor(level: LeadershipLevel): string {
  const colors = {
    member: 'bg-gray-100 text-gray-800',
    timoteo: 'bg-blue-100 text-blue-800',
    leader_potential: 'bg-yellow-100 text-yellow-800',
    leader_ready: 'bg-orange-100 text-orange-800',
    supervisor_potential: 'bg-purple-100 text-purple-800'
  };
  
  return colors[level] || colors.member;
}

// Utility function para obter rótulos de níveis de liderança
export function getLeadershipLevelLabel(level: LeadershipLevel): string {
  const labels = {
    member: 'Membro',
    timoteo: 'Timóteo',
    leader_potential: 'Potencial Líder',
    leader_ready: 'Pronto para Liderança',
    supervisor_potential: 'Potencial Supervisor'
  };
  
  return labels[level] || 'Membro';
}

// Utility function para mapear categorias de fatores
export function getFactorCategoryLabel(category: FactorCategory): string {
  const labels = {
    attendance: 'Frequência',
    growth: 'Crescimento',
    engagement: 'Engajamento',
    influence: 'Influência',
    service: 'Serviço',
    learning: 'Aprendizado',
    leadership_traits: 'Características de Liderança'
  };
  
  return labels[category] || category;
}