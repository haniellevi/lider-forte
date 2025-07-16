"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

// Types
export interface Church {
  id: string;
  name: string;
  cnpj: string | null;
  address: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  founded_date: string | null;
  vision: string | null;
  mission: string | null;
  values: string[] | null;
  created_at: string;
  updated_at: string;
  // Campos calculados
  profiles_count?: number;
  cells_count?: number;
  pastors?: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  }>;
}

export interface ChurchFilters {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
}

export interface ChurchesResponse {
  data: Church[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Enhanced error handling
interface ApiError extends Error {
  status?: number;
  code?: string;
}

function createApiError(message: string, status?: number, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Erro na requisição';
    let errorCode = 'UNKNOWN_ERROR';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      // If we can't parse the error response, use status-based messages
      switch (response.status) {
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'Acesso negado. Você não tem permissão para esta ação.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          errorCode = 'NOT_FOUND';
          break;
        case 422:
          errorMessage = 'Dados inválidos enviados.';
          errorCode = 'VALIDATION_ERROR';
          break;
        case 429:
          errorMessage = 'Muitas requisições. Tente novamente em alguns instantes.';
          errorCode = 'RATE_LIMITED';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          errorCode = 'INTERNAL_ERROR';
          break;
        default:
          errorMessage = `Erro HTTP ${response.status}`;
      }
    }
    
    throw createApiError(errorMessage, response.status, errorCode);
  }
  
  return response.json();
}

// API functions with enhanced error handling
async function fetchChurches(filters: ChurchFilters = {}): Promise<ChurchesResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.state) queryParams.append('state', filters.state);

    const response = await fetch(`/api/protected/churches?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await handleApiResponse<ChurchesResponse>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError('Erro inesperado ao buscar igrejas');
  }
}

async function fetchChurch(id: string): Promise<Church> {
  try {
    const response = await fetch(`/api/protected/churches/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleApiResponse<{ data: Church }>(response);
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError('Erro inesperado ao buscar igreja');
  }
}

async function createChurch(data: Partial<Church>): Promise<Church> {
  try {
    const response = await fetch('/api/protected/churches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleApiResponse<{ data: Church }>(response);
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError('Erro inesperado ao criar igreja');
  }
}

async function updateChurch(id: string, data: Partial<Church>): Promise<Church> {
  try {
    const response = await fetch(`/api/protected/churches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleApiResponse<{ data: Church }>(response);
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError('Erro inesperado ao atualizar igreja');
  }
}

async function deleteChurch(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/protected/churches/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    await handleApiResponse<void>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError('Erro inesperado ao excluir igreja');
  }
}

// Query hooks
export function useChurches(filters: ChurchFilters = {}) {
  const { isSignedIn } = useAuth();
  
  return useQuery({
    queryKey: ['churches', filters],
    queryFn: () => fetchChurches(filters),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useChurch(id: string) {
  const { isSignedIn } = useAuth();
  
  return useQuery({
    queryKey: ['church', id],
    queryFn: () => fetchChurch(id),
    enabled: isSignedIn && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (single church data is more stable)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Utility hooks for cache management
export function useInvalidateChurches() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['churches'] }),
    invalidateChurch: (id: string) => queryClient.invalidateQueries({ queryKey: ['church', id] }),
    refetchAll: () => queryClient.refetchQueries({ queryKey: ['churches'] }),
    refetchChurch: (id: string) => queryClient.refetchQueries({ queryKey: ['church', id] }),
  };
}

export function usePrefetchChurch() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['church', id],
      queryFn: () => fetchChurch(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

// Mutation hooks
export function useCreateChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createChurch,
    onMutate: async (newChurch) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['churches'] });

      // Snapshot the previous value
      const previousChurches = queryClient.getQueriesData({ queryKey: ['churches'] });

      // Optimistically update all church queries with null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        // Ensure data array exists
        const oldData = Array.isArray(old.data) ? old.data : [];
        const oldPagination = old.pagination || { total: 0 };
        
        // Create optimistic church with temporary ID and safe defaults
        const optimisticChurch: Church = {
          id: `temp-${Date.now()}`,
          name: newChurch?.name || 'Nova Igreja',
          cnpj: newChurch?.cnpj || null,
          address: newChurch?.address || null,
          phone: newChurch?.phone || null,
          email: newChurch?.email || null,
          website: newChurch?.website || null,
          description: newChurch?.description || null,
          founded_date: newChurch?.founded_date || null,
          vision: newChurch?.vision || null,
          mission: newChurch?.mission || null,
          values: Array.isArray(newChurch?.values) ? newChurch.values : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profiles_count: 0,
          cells_count: 0,
          pastors: [],
        };

        return {
          ...old,
          data: [optimisticChurch, ...oldData],
          pagination: {
            ...oldPagination,
            total: (oldPagination.total || 0) + 1,
          },
        };
      });

      return { previousChurches };
    },
    onError: (err, newChurch, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousChurches) {
        context.previousChurches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (newChurch) => {
      // Update cache with real church data
      queryClient.setQueryData(['church', newChurch.id], newChurch);
      
      // Update all church queries with real data and null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        const oldData = Array.isArray(old.data) ? old.data : [];
        
        return {
          ...old,
          data: oldData.map((church: Church) =>
            church?.id?.startsWith('temp-') ? newChurch : church
          ),
        };
      });
      
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
  });
}

export function useUpdateChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Church> }) => 
      updateChurch(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['church', id] });
      await queryClient.cancelQueries({ queryKey: ['churches'] });

      // Snapshot the previous value
      const previousChurch = queryClient.getQueryData(['church', id]);
      const previousChurches = queryClient.getQueriesData({ queryKey: ['churches'] });

      // Optimistically update the specific church
      queryClient.setQueryData(['church', id], (old: Church | undefined) => {
        if (!old) return old;
        return { ...old, ...data, updated_at: new Date().toISOString() };
      });

      // Optimistically update churches in lists with null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        const oldData = Array.isArray(old.data) ? old.data : [];
        
        return {
          ...old,
          data: oldData.map((church: Church) =>
            church?.id === id
              ? { ...church, ...data, updated_at: new Date().toISOString() }
              : church
          ),
        };
      });

      return { previousChurch, previousChurches };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousChurch) {
        queryClient.setQueryData(['church', id], context.previousChurch);
      }
      if (context?.previousChurches) {
        context.previousChurches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedChurch) => {
      // Update with real data from server
      queryClient.setQueryData(['church', updatedChurch.id], updatedChurch);
      
      // Update churches lists with real data and null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        const oldData = Array.isArray(old.data) ? old.data : [];
        
        return {
          ...old,
          data: oldData.map((church: Church) =>
            church?.id === updatedChurch.id ? updatedChurch : church
          ),
        };
      });
    },
    onSettled: (data, error, { id }) => {
      // Ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['church', id] });
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
  });
}

export function useDeleteChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteChurch,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['church', deletedId] });
      await queryClient.cancelQueries({ queryKey: ['churches'] });

      // Snapshot the previous values
      const previousChurch = queryClient.getQueryData(['church', deletedId]);
      const previousChurches = queryClient.getQueriesData({ queryKey: ['churches'] });

      // Optimistically remove the church from all queries with null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        const oldData = Array.isArray(old.data) ? old.data : [];
        const oldPagination = old.pagination || { total: 0 };
        
        return {
          ...old,
          data: oldData.filter((church: Church) => church?.id !== deletedId),
          pagination: {
            ...oldPagination,
            total: Math.max(0, (oldPagination.total || 0) - 1),
          },
        };
      });

      // Remove the specific church query
      queryClient.removeQueries({ queryKey: ['church', deletedId] });

      return { previousChurch, previousChurches };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousChurch) {
        queryClient.setQueryData(['church', deletedId], context.previousChurch);
      }
      if (context?.previousChurches) {
        context.previousChurches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, deletedId) => {
      // Ensure the church is removed from cache
      queryClient.removeQueries({ queryKey: ['church', deletedId] });
      
      // Update all church queries to remove the deleted church with null safety
      queryClient.setQueriesData({ queryKey: ['churches'] }, (old: any) => {
        if (!old || typeof old !== 'object') return old;
        
        const oldData = Array.isArray(old.data) ? old.data : [];
        
        return {
          ...old,
          data: oldData.filter((church: Church) => church?.id !== deletedId),
        };
      });
    },
    onSettled: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
  });
}

// Helper hook for deleting with confirmation
export function useDeleteChurchWithConfirmation() {
  const deleteChurch = useDeleteChurch();
  
  return {
    ...deleteChurch,
    deleteWithConfirmation: async (churchId: string, churchName: string) => {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir a igreja "${churchName}"? Esta ação não pode ser desfeita.`
      );
      
      if (confirmed) {
        return deleteChurch.mutateAsync(churchId);
      }
      
      throw new Error('Operação cancelada pelo usuário');
    },
  };
}

