export type CellMode = 'GANHAR' | 'CONSOLIDAR' | 'DISCIPULAR' | 'ENVIAR'

export type ActivityType = 
  | 'meeting'
  | 'outreach' 
  | 'training'
  | 'service'
  | 'fellowship'
  | 'mentoring'

export interface ModeTemplate {
  id: string
  mode: CellMode
  name: string
  description: string
  color: string
  icon: string
  default_duration_weeks: number
  suggested_activities: string[]
  target_metrics_template: Record<string, MetricTemplate>
  is_default: boolean
  created_at: string
}

export interface MetricTemplate {
  target: number
  description: string
}

export interface CellModeInstance {
  id: string
  cell_id: string
  mode: CellMode
  start_date: string
  end_date: string | null
  goal_description: string | null
  target_metrics: Record<string, MetricTemplate>
  actual_metrics: Record<string, number>
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  mode_templates?: ModeTemplate
}

export interface ModeActivity {
  id: string
  cell_mode_id: string
  activity_type: ActivityType
  description: string
  planned_date: string | null
  completed_date: string | null
  participants_expected: number | null
  participants_actual: number | null
  results: Record<string, any> | null
  is_completed: boolean
  created_at: string
}

export interface CurrentCellMode {
  mode_id: string
  mode: CellMode
  start_date: string
  end_date: string | null
  days_remaining: number | null
  progress_percentage: number
  target_metrics: Record<string, MetricTemplate>
  actual_metrics: Record<string, number>
  template?: Omit<ModeTemplate, 'id' | 'created_at'>
}

export interface ModeRecommendation {
  recommended_mode: CellMode
  reason: string
  confidence_score: number
  template?: ModeTemplate
}

export interface CellModeDashboardItem {
  cell_id: string
  cell_name: string
  church_id: string
  mode_id: string | null
  current_mode: CellMode | null
  mode_name: string | null
  mode_color: string | null
  mode_icon: string | null
  start_date: string | null
  end_date: string | null
  status: 'Indefinido' | 'Expirado' | 'Ativo' | 'Hoje'
  days_remaining: number | null
  progress_percentage: number
  target_metrics: Record<string, MetricTemplate>
  actual_metrics: Record<string, number>
  goal_description: string | null
  leader_name: string | null
  supervisor_name: string | null
  member_count: number
}

export interface ModeDashboardStats {
  total_cells: number
  active_modes: number
  expired_modes: number
  modes_distribution: Record<CellMode, number>
}

export interface ModeDashboard {
  dashboard: CellModeDashboardItem[]
  statistics: ModeDashboardStats
  cells_without_mode: Array<{
    id: string
    name: string
    leader_id: string | null
    supervisor_id: string | null
    profiles?: { full_name: string }
  }>
  recommendations: Array<ModeRecommendation & {
    cell_id: string
    cell_name: string
    leader_name?: string
  }>
}

export interface MetricProgress {
  key: string
  description: string
  target: number
  actual: number
  percentage: number
}

export interface ModeWithProgress extends CellModeInstance {
  metrics_progress: MetricProgress[]
}

// Request/Response types
export interface ActivateModeRequest {
  mode: CellMode
  duration_weeks?: number
  goal_description?: string
  custom_metrics?: Record<string, MetricTemplate>
}

export interface UpdateMetricsRequest {
  metrics: Record<string, number>
}

export interface CreateActivityRequest {
  activity_type: ActivityType
  description: string
  planned_date?: string
  participants_expected?: number
}

export interface UpdateActivityRequest {
  description?: string
  planned_date?: string
  completed_date?: string
  participants_expected?: number
  participants_actual?: number
  results?: Record<string, any>
  is_completed?: boolean
}

// Mode configuration constants
export const MODE_COLORS: Record<CellMode, string> = {
  GANHAR: '#DC2626',      // Vermelho
  CONSOLIDAR: '#059669',  // Verde
  DISCIPULAR: '#2563EB',  // Azul
  ENVIAR: '#D97706'       // Amarelo/Laranja
}

export const MODE_ICONS: Record<CellMode, string> = {
  GANHAR: '🎯',
  CONSOLIDAR: '🤲',
  DISCIPULAR: '📚',
  ENVIAR: '🚀'
}

export const MODE_NAMES: Record<CellMode, string> = {
  GANHAR: 'Modo Ganhar - Evangelismo',
  CONSOLIDAR: 'Modo Consolidar - Cuidado Pastoral',
  DISCIPULAR: 'Modo Discipular - Ensino e Crescimento',
  ENVIAR: 'Modo Enviar - Multiplicação e Liderança'
}

export const ACTIVITY_TYPE_NAMES: Record<ActivityType, string> = {
  meeting: 'Reunião',
  outreach: 'Evangelismo',
  training: 'Treinamento',
  service: 'Serviço',
  fellowship: 'Confraternização',
  mentoring: 'Mentoria'
}