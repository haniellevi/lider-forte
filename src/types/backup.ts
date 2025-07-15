// Tipos para o sistema de backup e recuperação

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';
export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'expired';
export type RestoreStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type OperationType = 'backup' | 'restore' | 'verify' | 'cleanup';
export type RestoreType = 'full' | 'partial' | 'table_specific';

export interface BackupConfiguration {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  frequency: BackupFrequency;
  backup_type: BackupType;
  include_tables: string[];
  exclude_tables: string[];
  retention_days: number;
  is_active: boolean;
  next_backup_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface BackupRecord {
  id: string;
  church_id: string;
  configuration_id?: string;
  backup_type: BackupType;
  status: BackupStatus;
  file_path?: string;
  file_size_bytes?: number;
  compressed_size_bytes?: number;
  checksum?: string;
  tables_included: string[];
  records_count?: Record<string, number>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  expires_at?: string;
  created_by: string;
  metadata?: Record<string, any>;
  configuration?: BackupConfiguration;
  created_by_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface BackupLog {
  id: string;
  church_id: string;
  backup_record_id?: string;
  operation_type: OperationType;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface RestoreOperation {
  id: string;
  church_id: string;
  backup_record_id: string;
  restore_type: RestoreType;
  target_tables?: string[];
  status: RestoreStatus;
  progress_percentage: number;
  records_restored?: Record<string, number>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  created_by: string;
  metadata?: Record<string, any>;
  backup_record?: BackupRecord;
  created_by_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface BackupStatistics {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  pending_backups: number;
  total_size_bytes: number;
  compressed_size_bytes: number;
  last_successful_backup?: string;
  oldest_backup?: string;
  average_backup_size: number;
}

// Tipos para requests/filters
export interface BackupConfigurationFilters {
  is_active?: boolean;
  frequency?: BackupFrequency;
  backup_type?: BackupType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BackupRecordFilters {
  status?: BackupStatus;
  backup_type?: BackupType;
  configuration_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface RestoreOperationFilters {
  status?: RestoreStatus;
  restore_type?: RestoreType;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface BackupLogFilters {
  operation_type?: OperationType;
  level?: LogLevel;
  backup_record_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface CreateBackupConfigurationRequest {
  name: string;
  description?: string;
  frequency: BackupFrequency;
  backup_type: BackupType;
  include_tables?: string[];
  exclude_tables?: string[];
  retention_days?: number;
  is_active?: boolean;
}

export interface UpdateBackupConfigurationRequest extends Partial<CreateBackupConfigurationRequest> {
  id: string;
}

export interface CreateBackupRequest {
  configuration_id?: string;
  backup_type: BackupType;
  tables_included?: string[];
}

export interface CreateRestoreRequest {
  backup_record_id: string;
  restore_type: RestoreType;
  target_tables?: string[];
}

// Tipos para respostas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BackupConfigurationsResponse extends PaginatedResponse<BackupConfiguration> {}
export interface BackupRecordsResponse extends PaginatedResponse<BackupRecord> {}
export interface RestoreOperationsResponse extends PaginatedResponse<RestoreOperation> {}
export interface BackupLogsResponse extends PaginatedResponse<BackupLog> {}

// Constantes para facilitar uso
export const BACKUP_FREQUENCIES = {
  DAILY: 'daily' as const,
  WEEKLY: 'weekly' as const,
  MONTHLY: 'monthly' as const,
  MANUAL: 'manual' as const,
} as const;

export const BACKUP_TYPES = {
  FULL: 'full' as const,
  INCREMENTAL: 'incremental' as const,
  DIFFERENTIAL: 'differential' as const,
} as const;

export const BACKUP_STATUSES = {
  PENDING: 'pending' as const,
  RUNNING: 'running' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  EXPIRED: 'expired' as const,
} as const;

export const RESTORE_STATUSES = {
  PENDING: 'pending' as const,
  RUNNING: 'running' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
} as const;

export const LOG_LEVELS = {
  INFO: 'info' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  DEBUG: 'debug' as const,
} as const;

export const OPERATION_TYPES = {
  BACKUP: 'backup' as const,
  RESTORE: 'restore' as const,
  VERIFY: 'verify' as const,
  CLEANUP: 'cleanup' as const,
} as const;

export const RESTORE_TYPES = {
  FULL: 'full' as const,
  PARTIAL: 'partial' as const,
  TABLE_SPECIFIC: 'table_specific' as const,
} as const;

// Utilitários
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

export function getBackupStatusColor(status: BackupStatus): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
    case 'expired':
      return 'red';
    case 'running':
      return 'blue';
    case 'pending':
      return 'yellow';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

export function getRestoreStatusColor(status: RestoreStatus): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'running':
      return 'blue';
    case 'pending':
      return 'yellow';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}