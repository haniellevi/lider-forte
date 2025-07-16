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

// Hook para buscar lista de relatórios com null safety
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.list(filters),
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams();
        
        // Safe parameter handling
        if (filters && typeof filters === 'object') {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value) && value.length > 0) {
                searchParams.append(key, value.filter(v => v != null).join(','));
              } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                searchParams.append(key, String(value));
              }
            }
          });
        }

        const response = await fetch(`/api/protected/reports?${searchParams}`);
        
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || `Erro ao buscar relatórios (${response.status})`);
        }
        
        const data = await response.json();
        
        // Ensure we return a valid structure
        return {
          data: Array.isArray(data?.data) ? data.data : [],
          pagination: data?.pagination || null,
        };
      } catch (error: any) {
        console.error('useReports: Error fetching reports:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Hook para buscar um relatório específico com null safety
export function useReport(reportId: string) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.detail(reportId),
    queryFn: async (): Promise<Report | null> => {
      if (!reportId || typeof reportId !== 'string' || reportId.trim() === '') {
        console.warn('useReport: Invalid reportId provided:', reportId);
        return null;
      }
      
      try {
        const response = await fetch(`/api/protected/reports/${encodeURIComponent(reportId)}`);
        
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          
          if (response.status === 404) {
            throw new Error('Relatório não encontrado');
          }
          
          throw new Error(error?.error || `Erro ao buscar relatório (${response.status})`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Formato de resposta inválido');
        }
        
        // Ensure required fields have defaults
        return {
          ...data,
          title: data.title || 'Relatório sem título',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          report_type: data.report_type || 'custom',
          status: data.status || 'draft',
          data: data.data || {},
        } as Report;
      } catch (error: any) {
        console.error('useReport: Error fetching report:', error);
        throw error;
      }
    },
    enabled: !!reportId && typeof reportId === 'string',
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('404') || error?.message?.includes('não encontrado')) {
        return false;
      }
      return failureCount < 2;
    },
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
      try {
        // Invalidar lista de relatórios
        queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.lists() });
        
        // Adicionar ao cache com null safety
        if (newReport?.id) {
          queryClient.setQueryData(REPORTS_QUERY_KEYS.detail(newReport.id), newReport);
        }
        
        toast.success('Relatório criado com sucesso!');
      } catch (error) {
        console.error('useCreateReport: onSuccess error:', error);
      }
    },
    onError: (error: any) => {
      console.error('useCreateReport: Mutation error:', error);
      toast.error(error?.message || 'Erro ao criar relatório');
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

// Hook para buscar dados do dashboard com null safety
export function useDashboard() {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.dashboard(),
    queryFn: async (): Promise<DashboardMetrics> => {
      try {
        const response = await fetch('/api/protected/analytics/dashboard');
        
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || `Erro ao buscar dados do dashboard (${response.status})`);
        }
        
        const data = await response.json();
        
        // Ensure valid structure with defaults
        return {
          totalUsers: data?.totalUsers || 0,
          totalCells: data?.totalCells || 0,
          totalChurches: data?.totalChurches || 0,
          totalReports: data?.totalReports || 0,
          growthMetrics: data?.growthMetrics || {
            users: { current: 0, previous: 0, percentageChange: 0 },
            cells: { current: 0, previous: 0, percentageChange: 0 },
            churches: { current: 0, previous: 0, percentageChange: 0 },
          },
          recentActivities: Array.isArray(data?.recentActivities) ? data.recentActivities : [],
          ...data,
        } as DashboardMetrics;
      } catch (error: any) {
        console.error('useDashboard: Error fetching dashboard:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
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