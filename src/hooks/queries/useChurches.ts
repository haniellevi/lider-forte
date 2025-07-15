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

// API functions
async function fetchChurches(filters: ChurchFilters = {}): Promise<ChurchesResponse> {
  const queryParams = new URLSearchParams();
  
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.city) queryParams.append('city', filters.city);
  if (filters.state) queryParams.append('state', filters.state);

  const response = await fetch(`/api/protected/churches?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar igrejas');
  }
  
  return response.json();
}

async function fetchChurch(id: string): Promise<Church> {
  const response = await fetch(`/api/protected/churches/${id}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar igreja');
  }
  
  const result = await response.json();
  return result.data;
}

async function createChurch(data: Partial<Church>): Promise<Church> {
  const response = await fetch('/api/protected/churches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar igreja');
  }
  
  const result = await response.json();
  return result.data;
}

async function updateChurch(id: string, data: Partial<Church>): Promise<Church> {
  const response = await fetch(`/api/protected/churches/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar igreja');
  }
  
  const result = await response.json();
  return result.data;
}

async function deleteChurch(id: string): Promise<void> {
  const response = await fetch(`/api/protected/churches/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir igreja');
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
  });
}

export function useChurch(id: string) {
  const { isSignedIn } = useAuth();
  
  return useQuery({
    queryKey: ['church', id],
    queryFn: () => fetchChurch(id),
    enabled: isSignedIn && !!id,
  });
}

// Mutation hooks
export function useCreateChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createChurch,
    onSuccess: (newChurch) => {
      // Invalidate churches list
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      
      // Add to cache
      queryClient.setQueryData(['church', newChurch.id], newChurch);
    },
  });
}

export function useUpdateChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Church> }) => 
      updateChurch(id, data),
    onSuccess: (updatedChurch) => {
      // Update specific church in cache
      queryClient.setQueryData(['church', updatedChurch.id], updatedChurch);
      
      // Invalidate churches list
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
  });
}

export function useDeleteChurch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteChurch,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['church', deletedId] });
      
      // Invalidate churches list
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
  });
}

