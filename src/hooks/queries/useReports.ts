import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Report, 
  CreateReportRequest, 
  UpdateReportRequest,
  ReportFilters,
  DashboardMetrics,
  Metric,
  ReportGenerationRequest,
  ReportGenerationResponse
} from '@/types/reports';

// Chaves de query para cache
export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  lists: () => [...REPORTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...REPORTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...REPORTS_QUERY_KEYS.details(), id] as const,
  analytics: ['analytics'] as const,
  dashboard: () => [...REPORTS_QUERY_KEYS.analytics, 'dashboard'] as const,
  metrics: (filters?: any) => [...REPORTS_QUERY_KEYS.analytics, 'metrics', filters] as const,
};

// Hook para buscar lista de relatórios
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.list(filters),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/protected/reports?${searchParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar relatórios');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar um relatório específico
export function useReport(reportId: string) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.detail(reportId),
    queryFn: async () => {
      const response = await fetch(`/api/protected/reports/${reportId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar relatório');
      }
      
      return response.json() as Promise<Report>;
    },
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para criar relatório
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReportRequest): Promise<Report> => {
      const response = await fetch('/api/protected/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar relatório');
      }

      return response.json();
    },
    onSuccess: (newReport) => {
      // Invalidar lista de relatórios
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.lists() });
      
      // Adicionar ao cache
      queryClient.setQueryData(REPORTS_QUERY_KEYS.detail(newReport.id), newReport);
      
      toast.success('Relatório criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar relatório');
    },
  });
}

// Hook para atualizar relatório
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateReportRequest): Promise<Report> => {
      const response = await fetch(`/api/protected/reports/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar relatório');
      }

      return response.json();
    },
    onSuccess: (updatedReport) => {
      // Invalidar e atualizar caches
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.lists() });
      queryClient.setQueryData(REPORTS_QUERY_KEYS.detail(updatedReport.id), updatedReport);
      
      toast.success('Relatório atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar relatório');
    },
  });
}

// Hook para excluir relatório
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string): Promise<void> => {
      const response = await fetch(`/api/protected/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir relatório');
      }
    },
    onSuccess: (_, reportId) => {
      // Invalidar lista e remover do cache
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: REPORTS_QUERY_KEYS.detail(reportId) });
      
      toast.success('Relatório excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir relatório');
    },
  });
}

// Hook para buscar dados do dashboard
export function useDashboard() {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.dashboard(),
    queryFn: async () => {
      const response = await fetch('/api/protected/analytics/dashboard');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar dados do dashboard');
      }
      
      return response.json() as Promise<DashboardMetrics>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

// Hook para buscar métricas
export function useMetrics(filters: any = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.metrics(filters),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/protected/analytics/metrics?${searchParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar métricas');
      }
      
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para gerar relatórios
export function useGenerateReport() {
  return useMutation({
    mutationFn: async (request: ReportGenerationRequest): Promise<ReportGenerationResponse> => {
      const response = await fetch('/api/protected/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Relatório gerado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao gerar relatório');
    },
  });
}

// Hook para buscar relatórios públicos
export function usePublicReports() {
  return useReports({ is_public: true });
}

// Hook para buscar meus relatórios
export function useMyReports() {
  // Não passamos created_by pois a API já filtra pelos relatórios do usuário
  return useReports({});
}

// Hook para buscar relatórios por tipo
export function useReportsByType(reportType: string) {
  return useReports({ report_type: reportType as any });
}