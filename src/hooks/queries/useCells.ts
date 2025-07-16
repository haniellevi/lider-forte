import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/nextjs';
import { useShowToast } from '@/store';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

type Cell = Tables<'cells'>;
type CellInsert = TablesInsert<'cells'>;
type CellUpdate = TablesUpdate<'cells'>;
type CellMember = Tables<'cell_members'>;

interface CellWithDetails extends Cell {
  leader?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  supervisor?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  parent_cell?: {
    id: string;
    name: string;
  };
  members?: CellMember[];
  child_cells?: {
    id: string;
    name: string;
    created_at: string;
  }[];
}

interface CellMemberWithProfile extends CellMember {
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface CellMeeting {
  id: string;
  cell_id: string;
  date: string;
  attendees_count: number;
  notes?: string;
  next_meeting_date?: string;
  created_at: string;
  updated_at: string;
}

interface CellFilters {
  search?: string;
  leader_id?: string;
  supervisor_id?: string;
  parent_id?: string;
  page?: number;
  limit?: number;
}

export function useCells(filters: CellFilters = {}) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['cells', user?.id, filters],
    queryFn: async (): Promise<{ data: CellWithDetails[]; pagination: any }> => {
      if (!user?.id) {
        console.warn('useCells: No authenticated user');
        return { data: [], pagination: null };
      }
      
      try {
        const params = new URLSearchParams();
        
        // Safe parameter handling with validation
        if (filters?.search && typeof filters.search === 'string' && filters.search.trim()) {
          params.append('search', filters.search.trim());
        }
        if (filters?.leader_id && typeof filters.leader_id === 'string') {
          params.append('leader_id', filters.leader_id);
        }
        if (filters?.supervisor_id && typeof filters.supervisor_id === 'string') {
          params.append('supervisor_id', filters.supervisor_id);
        }
        if (filters?.parent_id && typeof filters.parent_id === 'string') {
          params.append('parent_id', filters.parent_id);
        }
        if (filters?.page && typeof filters.page === 'number' && filters.page > 0) {
          params.append('page', Math.floor(filters.page).toString());
        }
        if (filters?.limit && typeof filters.limit === 'number' && filters.limit > 0) {
          params.append('limit', Math.min(100, Math.floor(filters.limit)).toString());
        }
        
        const response = await fetch(`/api/protected/cells?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `Erro ao buscar células (${response.status})`;
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Validate response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format');
        }
        
        return {
          data: Array.isArray(result.data) ? result.data : [],
          pagination: result.pagination || null
        };
      } catch (error: any) {
        console.error('useCells: Error fetching cells:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCell(cellId: string) {
  const supabase = useSupabase();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['cell', cellId],
    queryFn: async (): Promise<CellWithDetails | null> => {
      if (!user?.id) {
        console.warn('useCell: No authenticated user');
        throw new Error('Usuário não autenticado');
      }
      
      if (!cellId || typeof cellId !== 'string' || cellId.trim() === '') {
        console.warn('useCell: Invalid cellId provided:', cellId);
        throw new Error('ID da célula inválido');
      }
      
      try {
        const response = await fetch(`/api/protected/cells/${encodeURIComponent(cellId)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `Erro ao buscar célula (${response.status})`;
          
          if (response.status === 404) {
            throw new Error('Célula não encontrada');
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Validate response structure
        if (!result?.data || typeof result.data !== 'object') {
          throw new Error('Formato de resposta inválido');
        }
        
        // Ensure required fields have defaults
        return {
          ...result.data,
          name: result.data.name || 'Célula sem nome',
          created_at: result.data.created_at || new Date().toISOString(),
          updated_at: result.data.updated_at || new Date().toISOString(),
          members: Array.isArray(result.data.members) ? result.data.members : [],
          child_cells: Array.isArray(result.data.child_cells) ? result.data.child_cells : [],
        };
      } catch (error: any) {
        console.error('useCell: Error fetching cell:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!cellId && typeof cellId === 'string',
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('404') || error?.message?.includes('não encontrada')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCellHierarchy(cellId: string, direction: 'descendants' | 'ancestors' = 'descendants', maxDepth: number = 5) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['cell-hierarchy', cellId, direction, maxDepth],
    queryFn: async () => {
      if (!user?.id || !cellId) throw new Error('Usuário ou célula não especificado');
      
      const params = new URLSearchParams({
        direction,
        maxDepth: maxDepth.toString(),
      });
      
      const response = await fetch(`/api/protected/cells/${cellId}/hierarchy?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar hierarquia da célula');
      }
      
      const result = await response.json();
      return result.data;
    },
    enabled: !!user?.id && !!cellId,
  });
}

export function useCreateCell() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (cellData: Omit<CellInsert, 'church_id'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch('/api/protected/cells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cellData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar célula');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] });
      showToast({ type: 'success', message: 'Célula criada com sucesso!' });
    },
    onError: (error) => {
      console.error('Error creating cell:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}

export function useUpdateCell() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async ({ cellId, updates }: { cellId: string; updates: CellUpdate }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch(`/api/protected/cells/${cellId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar célula');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cells'] });
      queryClient.invalidateQueries({ queryKey: ['cell', variables.cellId] });
      showToast({ type: 'success', message: 'Célula atualizada com sucesso!' });
    },
    onError: (error) => {
      console.error('Error updating cell:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}

export function useDeleteCell() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (cellId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch(`/api/protected/cells/${cellId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir célula');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] });
      showToast({ type: 'success', message: 'Célula excluída com sucesso!' });
    },
    onError: (error) => {
      console.error('Error deleting cell:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}

export function useCellMembers(cellId: string) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['cell-members', cellId],
    queryFn: async (): Promise<CellMemberWithProfile[]> => {
      if (!user?.id) {
        console.warn('useCellMembers: No authenticated user');
        return [];
      }
      
      if (!cellId || typeof cellId !== 'string' || cellId.trim() === '') {
        console.warn('useCellMembers: Invalid cellId provided:', cellId);
        return [];
      }
      
      try {
        const response = await fetch(`/api/protected/cells/${encodeURIComponent(cellId)}/members`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `Erro ao buscar membros da célula (${response.status})`;
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Validate response and ensure array
        if (!result?.data || !Array.isArray(result.data)) {
          console.warn('useCellMembers: Invalid response format');
          return [];
        }
        
        // Ensure each member has safe defaults
        return result.data.map((member: any) => ({
          ...member,
          joined_at: member?.joined_at || new Date().toISOString(),
          is_active: member?.is_active ?? true,
          profile: member?.profile ? {
            id: member.profile.id || '',
            full_name: member.profile.full_name || 'Membro sem nome',
            avatar_url: member.profile.avatar_url || null,
            role: member.profile.role || 'member',
          } : null,
        }));
      } catch (error: any) {
        console.error('useCellMembers: Error fetching members:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!cellId && typeof cellId === 'string',
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddCellMember() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async ({ cellId, memberData }: { 
      cellId: string; 
      memberData: {
        profile_id: string;
        success_ladder_score?: number;
        is_timoteo?: boolean;
      }
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch(`/api/protected/cells/${cellId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar membro à célula');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cell-members', variables.cellId] });
      queryClient.invalidateQueries({ queryKey: ['cell', variables.cellId] });
      queryClient.invalidateQueries({ queryKey: ['cells'] });
      showToast({ type: 'success', message: 'Membro adicionado à célula com sucesso!' });
    },
    onError: (error) => {
      console.error('Error adding cell member:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}

export function useRemoveCellMember() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async ({ cellId, profileId }: { cellId: string; profileId: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch(`/api/protected/cells/${cellId}/members?profile_id=${profileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover membro da célula');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cell-members', variables.cellId] });
      queryClient.invalidateQueries({ queryKey: ['cell', variables.cellId] });
      queryClient.invalidateQueries({ queryKey: ['cells'] });
      showToast({ type: 'success', message: 'Membro removido da célula com sucesso!' });
    },
    onError: (error) => {
      console.error('Error removing cell member:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}

export function useCellMeetings(cellId: string, page: number = 1, limit: number = 10) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['cell-meetings', cellId, page, limit],
    queryFn: async (): Promise<{ data: CellMeeting[]; pagination: any }> => {
      if (!user?.id || !cellId) throw new Error('Usuário ou célula não especificado');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await fetch(`/api/protected/cells/${cellId}/meetings?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar reuniões da célula');
      }
      
      return response.json();
    },
    enabled: !!user?.id && !!cellId,
  });
}

export function useCreateCellMeeting() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async ({ cellId, meetingData }: { 
      cellId: string; 
      meetingData: {
        date: string;
        attendees_count: number;
        notes?: string;
        next_meeting_date?: string;
      }
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const response = await fetch(`/api/protected/cells/${cellId}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar reunião');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cell-meetings', variables.cellId] });
      queryClient.invalidateQueries({ queryKey: ['cell', variables.cellId] });
      showToast({ type: 'success', message: 'Reunião registrada com sucesso!' });
    },
    onError: (error) => {
      console.error('Error creating cell meeting:', error);
      showToast({ type: 'error', message: error.message });
    },
  });
}