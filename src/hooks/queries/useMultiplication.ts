import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
interface MultiplicationCriteria {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  criteria_type: string;
  threshold_value: number;
  weight: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MultiplicationReadiness {
  id: string;
  cell_id: string;
  readiness_score: number;
  status: 'not_ready' | 'preparing' | 'ready' | 'optimal' | 'overdue';
  criteria_results: any;
  projected_date: string | null;
  confidence_level: number;
  recommendations: string[];
  blocking_factors: string[];
  last_evaluated_at: string;
  created_at: string;
  updated_at: string;
}

interface MultiplicationDashboard {
  total_cells: number;
  ready_cells: number;
  preparing_cells: number;
  not_ready_cells: number;
  average_readiness_score: number;
  cells_details: any[];
  alerts: any[];
  status_distribution: Record<string, number>;
  last_updated: string;
}

interface MultiplicationAlert {
  cell_id: string;
  cell_name: string;
  alert_type: string;
  message: string;
  priority: number;
  cell_info?: any;
  readiness_info?: any;
  created_at: string;
}

// Query Keys
export const multiplicationKeys = {
  all: ['multiplication'] as const,
  criteria: () => [...multiplicationKeys.all, 'criteria'] as const,
  criteriaByChurch: (churchId: string) => [...multiplicationKeys.criteria(), churchId] as const,
  readiness: () => [...multiplicationKeys.all, 'readiness'] as const,
  readinessFiltered: (filters: Record<string, any>) => [...multiplicationKeys.readiness(), filters] as const,
  dashboard: () => [...multiplicationKeys.all, 'dashboard'] as const,
  dashboardByChurch: (churchId: string) => [...multiplicationKeys.dashboard(), churchId] as const,
  alerts: () => [...multiplicationKeys.all, 'alerts'] as const,
  alertsFiltered: (filters: Record<string, any>) => [...multiplicationKeys.alerts(), filters] as const,
  cellDetails: (cellId: string) => [...multiplicationKeys.all, 'cell-details', cellId] as const,
  evaluation: (cellId: string) => [...multiplicationKeys.all, 'evaluation', cellId] as const,
};

// Fetch Functions
const fetchCriteria = async (params?: Record<string, string>): Promise<MultiplicationCriteria[]> => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/protected/multiplication/criteria?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar critérios de multiplicação');
  }
  
  const data = await response.json();
  return data.data;
};

const fetchReadiness = async (params?: Record<string, string>): Promise<{
  data: MultiplicationReadiness[];
  pagination: any;
}> => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/protected/multiplication/readiness?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar dados de prontidão');
  }
  
  return response.json();
};

const fetchDashboard = async (churchId?: string): Promise<MultiplicationDashboard> => {
  const params = new URLSearchParams();
  if (churchId) {
    params.append('church_id', churchId);
  }
  
  const response = await fetch(`/api/protected/multiplication/dashboard?${params}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar dados do dashboard');
  }
  
  const data = await response.json();
  return data.data;
};

const fetchAlerts = async (params?: Record<string, string>): Promise<{
  data: MultiplicationAlert[];
  summary: any;
}> => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/protected/multiplication/alerts?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar alertas');
  }
  
  return response.json();
};

const fetchCellDetails = async (cellId: string): Promise<any> => {
  const response = await fetch(`/api/protected/multiplication/details/${cellId}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar detalhes da célula');
  }
  
  const data = await response.json();
  return data.data;
};

const evaluateCell = async (cellId: string): Promise<any> => {
  const response = await fetch(`/api/protected/multiplication/evaluate/${cellId}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Erro ao avaliar célula');
  }
  
  const data = await response.json();
  return data.data;
};

// Custom Hooks

// Criteria Hooks
export const useMultiplicationCriteria = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: multiplicationKeys.criteria(),
    queryFn: () => fetchCriteria(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<MultiplicationCriteria>) => {
      const response = await fetch('/api/protected/multiplication/criteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar critério');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.criteria() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.dashboard() });
    },
  });
};

export const useUpdateCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<MultiplicationCriteria> & { id: string }) => {
      const response = await fetch('/api/protected/multiplication/criteria', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar critério');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.criteria() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.readiness() });
    },
  });
};

export const useDeleteCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/protected/multiplication/criteria?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir critério');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.criteria() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.dashboard() });
    },
  });
};

// Readiness Hooks
export const useMultiplicationReadiness = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: multiplicationKeys.readinessFiltered(params || {}),
    queryFn: () => fetchReadiness(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useUpdateAllCellsReadiness = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (churchId?: string) => {
      const response = await fetch('/api/protected/multiplication/readiness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ church_id: churchId }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar prontidão das células');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.readiness() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.alerts() });
    },
  });
};

// Dashboard Hook
export const useMultiplicationDashboard = (churchId?: string, refreshInterval?: number) => {
  return useQuery({
    queryKey: churchId ? multiplicationKeys.dashboardByChurch(churchId) : multiplicationKeys.dashboard(),
    queryFn: () => fetchDashboard(churchId),
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: refreshInterval || 5 * 60 * 1000, // 5 minutos por padrão
  });
};

// Alerts Hook
export const useMultiplicationAlerts = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: multiplicationKeys.alertsFiltered(params || {}),
    queryFn: () => fetchAlerts(params),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });
};

// Cell Details Hook
export const useCellMultiplicationDetails = (cellId: string) => {
  return useQuery({
    queryKey: multiplicationKeys.cellDetails(cellId),
    queryFn: () => fetchCellDetails(cellId),
    enabled: !!cellId,
    staleTime: 60 * 1000, // 1 minuto
  });
};

// Cell Evaluation Hook
export const useEvaluateCell = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: evaluateCell,
    onSuccess: (data, cellId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.cellDetails(cellId) });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.readiness() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: multiplicationKeys.alerts() });
      
      // Atualizar dados específicos da célula
      queryClient.setQueryData(
        multiplicationKeys.evaluation(cellId),
        data
      );
    },
  });
};

// Combined Hook for Dashboard Page
export const useMultiplicationPage = (churchId?: string) => {
  const dashboard = useMultiplicationDashboard(churchId);
  const alerts = useMultiplicationAlerts({ limit: '10' });
  const criteria = useMultiplicationCriteria({ is_active: 'true' });
  
  return {
    dashboard,
    alerts,
    criteria,
    isLoading: dashboard.isLoading || alerts.isLoading || criteria.isLoading,
    error: dashboard.error || alerts.error || criteria.error,
    refetchAll: () => {
      dashboard.refetch();
      alerts.refetch();
      criteria.refetch();
    },
  };
};