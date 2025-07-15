"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  BackupConfiguration,
  BackupRecord,
  RestoreOperation,
  BackupStatistics,
  BackupConfigurationFilters,
  BackupRecordFilters,
  RestoreOperationFilters,
  CreateBackupConfigurationRequest,
  UpdateBackupConfigurationRequest,
  CreateBackupRequest,
  CreateRestoreRequest
} from '@/types/backup';

// Query keys factory
export const backupKeys = {
  all: ['backup'] as const,
  configurations: () => [...backupKeys.all, 'configurations'] as const,
  configurationsList: (filters: BackupConfigurationFilters) => [...backupKeys.configurations(), 'list', filters] as const,
  records: () => [...backupKeys.all, 'records'] as const,
  recordsList: (filters: BackupRecordFilters) => [...backupKeys.records(), 'list', filters] as const,
  restores: () => [...backupKeys.all, 'restores'] as const,
  restoresList: (filters: RestoreOperationFilters) => [...backupKeys.restores(), 'list', filters] as const,
  statistics: () => [...backupKeys.all, 'statistics'] as const,
};

// Hook para listar configurações de backup
export function useBackupConfigurations(filters?: BackupConfigurationFilters) {
  return useQuery({
    queryKey: backupKeys.configurationsList(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.is_active !== undefined) {
        params.set('is_active', filters.is_active.toString());
      }
      if (filters?.frequency) {
        params.set('frequency', filters.frequency);
      }
      if (filters?.backup_type) {
        params.set('backup_type', filters.backup_type);
      }
      if (filters?.search) {
        params.set('search', filters.search);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.set('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/protected/backup/configurations?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar configurações de backup');
      }
      
      return response.json();
    },
  });
}

// Hook para criar configuração de backup
export function useCreateBackupConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBackupConfigurationRequest) => {
      const response = await fetch('/api/protected/backup/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar configuração de backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para atualizar configuração de backup
export function useUpdateBackupConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateBackupConfigurationRequest) => {
      const response = await fetch(`/api/protected/backup/configurations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar configuração de backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para deletar configuração de backup
export function useDeleteBackupConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/protected/backup/configurations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar configuração de backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para listar registros de backup
export function useBackupRecords(filters?: BackupRecordFilters) {
  return useQuery({
    queryKey: backupKeys.recordsList(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) {
        params.set('status', filters.status);
      }
      if (filters?.backup_type) {
        params.set('backup_type', filters.backup_type);
      }
      if (filters?.configuration_id) {
        params.set('configuration_id', filters.configuration_id);
      }
      if (filters?.start_date) {
        params.set('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.set('end_date', filters.end_date);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.set('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/protected/backup/records?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar registros de backup');
      }
      
      return response.json();
    },
    refetchInterval: (data) => {
      // Refetch mais frequentemente se há backups em execução
      const hasRunningBackups = data?.records?.some((record: BackupRecord) => 
        ['pending', 'running'].includes(record.status)
      );
      return hasRunningBackups ? 5000 : 30000; // 5s se executando, 30s se não
    },
  });
}

// Hook para criar backup
export function useCreateBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBackupRequest) => {
      const response = await fetch('/api/protected/backup/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.records() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para cancelar backup
export function useCancelBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/protected/backup/records/${backupId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao cancelar backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.records() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para deletar backup
export function useDeleteBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/protected/backup/records/${backupId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.records() });
      queryClient.invalidateQueries({ queryKey: backupKeys.statistics() });
    },
  });
}

// Hook para listar operações de restore
export function useRestoreOperations(filters?: RestoreOperationFilters) {
  return useQuery({
    queryKey: backupKeys.restoresList(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) {
        params.set('status', filters.status);
      }
      if (filters?.restore_type) {
        params.set('restore_type', filters.restore_type);
      }
      if (filters?.start_date) {
        params.set('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.set('end_date', filters.end_date);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.set('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/protected/backup/restores?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar operações de restore');
      }
      
      return response.json();
    },
    refetchInterval: (data) => {
      // Refetch mais frequentemente se há restores em execução
      const hasRunningRestores = data?.operations?.some((op: RestoreOperation) => 
        ['pending', 'running'].includes(op.status)
      );
      return hasRunningRestores ? 2000 : 30000; // 2s se executando, 30s se não
    },
  });
}

// Hook para criar restore
export function useCreateRestore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateRestoreRequest) => {
      const response = await fetch('/api/protected/backup/restores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao iniciar restore');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.restores() });
    },
  });
}

// Hook para cancelar restore
export function useCancelRestore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (restoreId: string) => {
      const response = await fetch(`/api/protected/backup/restores/${restoreId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao cancelar restore');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.restores() });
    },
  });
}

// Hook para estatísticas de backup
export function useBackupStatistics() {
  return useQuery({
    queryKey: backupKeys.statistics(),
    queryFn: async () => {
      const response = await fetch('/api/protected/backup/statistics');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar estatísticas de backup');
      }
      
      return response.json() as Promise<BackupStatistics & { 
        additional_info: any;
        recent_backups: BackupRecord[];
        expiring_soon: BackupRecord[];
      }>;
    },
    refetchInterval: 60000, // Refetch a cada minuto
  });
}

// Hook para download de backup
export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/protected/backup/records/${backupId}/download`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao baixar backup');
      }
      
      // Retornar a URL de download ou iniciar download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${backupId}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
}

// Hook para verificar integridade de backup
export function useVerifyBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/protected/backup/records/${backupId}/verify`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao verificar backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.records() });
    },
  });
}