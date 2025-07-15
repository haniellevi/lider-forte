// Tipos para o sistema de relatórios e analytics
export type ReportType = 
  | 'church_overview'
  | 'cell_performance' 
  | 'member_growth'
  | 'leadership_development'
  | 'financial_summary'
  | 'attendance_tracking'
  | 'event_statistics';

export type MetricType = 
  | 'member_count'
  | 'cell_count' 
  | 'conversion_rate'
  | 'attendance_rate'
  | 'growth_rate'
  | 'retention_rate'
  | 'engagement_score'
  | 'leadership_ratio';

export type PeriodType = 
  | 'daily'
  | 'weekly' 
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Metric {
  id: string;
  church_id: string;
  metric_type: MetricType;
  value: number;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  report_type: ReportType;
  parameters?: Record<string, any>;
  data?: Record<string, any>;
  created_by: string;
  is_public: boolean;
  scheduled_frequency?: PeriodType;
  last_generated_at?: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Event {
  id: string;
  church_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  data?: Record<string, any>;
  created_at: string;
}

export interface ChurchStats {
  church_id: string;
  church_name: string;
  total_members: number;
  total_cells: number;
  total_leaders: number;
  total_supervisors: number;
  new_members_30d: number;
  new_cells_30d: number;
  avg_members_per_cell: number;
  church_created_at: string;
}

export interface CellPerformance {
  cell_id: string;
  cell_name: string;
  church_id: string;
  member_count: number;
  new_members_30d: number;
  leader_name: string;
  leader_role: string;
  child_cells_count: number;
  avg_success_score: number;
  timoteo_count: number;
  cell_created_at: string;
}

// Tipos para parâmetros de relatórios
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  cell_ids?: string[];
  leader_ids?: string[];
  metric_types?: MetricType[];
  period_type?: PeriodType;
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  report_type: ReportType;
  parameters?: Record<string, any>;
  is_public?: boolean;
  scheduled_frequency?: PeriodType;
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  id: string;
}

// Tipos para dashboard e analytics
export interface DashboardMetrics {
  church_stats: ChurchStats;
  recent_metrics: Metric[];
  top_performing_cells: CellPerformance[];
  growth_trends: {
    metric_type: MetricType;
    periods: Array<{
      period: string;
      value: number;
    }>;
  }[];
  recent_events: Event[];
}

export interface ReportGenerationRequest {
  report_type: ReportType;
  filters: ReportFilters;
  format?: 'json' | 'pdf' | 'excel';
}

export interface ReportGenerationResponse {
  id: string;
  data: Record<string, any>;
  generated_at: string;
  filters_applied: ReportFilters;
}

// Tipos para gráficos
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface MetricTrend {
  metric_type: MetricType;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  chart_data: ChartData;
}

// Enums exportados como constantes para facilitar uso
export const REPORT_TYPES = {
  CHURCH_OVERVIEW: 'church_overview' as const,
  CELL_PERFORMANCE: 'cell_performance' as const,
  MEMBER_GROWTH: 'member_growth' as const,
  LEADERSHIP_DEVELOPMENT: 'leadership_development' as const,
  FINANCIAL_SUMMARY: 'financial_summary' as const,
  ATTENDANCE_TRACKING: 'attendance_tracking' as const,
  EVENT_STATISTICS: 'event_statistics' as const,
} as const;

export const METRIC_TYPES = {
  MEMBER_COUNT: 'member_count' as const,
  CELL_COUNT: 'cell_count' as const,
  CONVERSION_RATE: 'conversion_rate' as const,
  ATTENDANCE_RATE: 'attendance_rate' as const,
  GROWTH_RATE: 'growth_rate' as const,
  RETENTION_RATE: 'retention_rate' as const,
  ENGAGEMENT_SCORE: 'engagement_score' as const,
  LEADERSHIP_RATIO: 'leadership_ratio' as const,
} as const;

export const PERIOD_TYPES = {
  DAILY: 'daily' as const,
  WEEKLY: 'weekly' as const,
  MONTHLY: 'monthly' as const,
  QUARTERLY: 'quarterly' as const,
  YEARLY: 'yearly' as const,
} as const;