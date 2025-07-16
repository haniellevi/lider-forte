import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type {
  CellMode,
  ModeTemplate,
  CurrentCellMode,
  ModeRecommendation,
  CellModeInstance,
  ModeDashboard,
  ModeWithProgress,
  ActivateModeRequest,
  UpdateMetricsRequest,
  ModeActivity,
  CreateActivityRequest,
  UpdateActivityRequest
} from '@/types/cell-modes'

export function useCellModes() {
  const [templates, setTemplates] = useState<ModeTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchTemplates = async (churchId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cell-modes?church_id=${churchId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar templates')
      }

      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates de modo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    templates,
    loading,
    fetchTemplates
  }
}

export function useCellMode(cellId: string) {
  const [currentMode, setCurrentMode] = useState<CurrentCellMode | null>(null)
  const [history, setHistory] = useState<CellModeInstance[]>([])
  const [recommendation, setRecommendation] = useState<ModeRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchCurrentMode = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cells/${cellId}/modes?action=current`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar modo atual')
      }

      const data = await response.json()
      setCurrentMode(data.current_mode)
    } catch (error) {
      console.error('Erro ao buscar modo atual:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar modo atual da célula',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/protected/cells/${cellId}/modes`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar histórico')
      }

      const data = await response.json()
      setHistory(data.modes)
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico de modos',
        variant: 'destructive'
      })
    }
  }

  const fetchRecommendation = async () => {
    try {
      const response = await fetch(`/api/protected/cells/${cellId}/modes?action=recommend`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar recomendação')
      }

      const data = await response.json()
      setRecommendation(data.recommendation)
    } catch (error) {
      console.error('Erro ao buscar recomendação:', error)
      // Não mostrar toast para erro de recomendação - é opcional
    }
  }

  const activateMode = async (request: ActivateModeRequest) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cells/${cellId}/modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao ativar modo')
      }

      const data = await response.json()
      
      toast({
        title: 'Sucesso',
        description: 'Modo ativado com sucesso'
      })

      // Atualizar dados
      await fetchCurrentMode()
      await fetchHistory()
      
      return data.mode
    } catch (error) {
      console.error('Erro ao ativar modo:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao ativar modo',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cellId) {
      fetchCurrentMode()
      fetchHistory()
      fetchRecommendation()
    }
  }, [cellId])

  return {
    currentMode,
    history,
    recommendation,
    loading,
    activateMode,
    fetchCurrentMode,
    fetchHistory,
    fetchRecommendation
  }
}

export function useModeMetrics(modeId: string) {
  const [mode, setMode] = useState<ModeWithProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cell-modes/${modeId}/metrics`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar métricas')
      }

      const data = await response.json()
      setMode(data.mode)
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar métricas do modo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateMetrics = async (request: UpdateMetricsRequest) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cell-modes/${modeId}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar métricas')
      }

      const data = await response.json()
      
      toast({
        title: 'Sucesso',
        description: 'Métricas atualizadas com sucesso'
      })

      // Atualizar dados locais
      await fetchMetrics()
      
      return data.mode
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar métricas',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (modeId) {
      fetchMetrics()
    }
  }, [modeId])

  return {
    mode,
    loading,
    updateMetrics,
    fetchMetrics
  }
}

export function useModeActivities(modeId: string) {
  const [activities, setActivities] = useState<ModeActivity[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchActivities = async (completed?: boolean) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (completed !== undefined) {
        params.set('completed', completed.toString())
      }
      
      const response = await fetch(`/api/protected/cell-modes/${modeId}/activities?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar atividades')
      }

      const data = await response.json()
      setActivities(data.activities)
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar atividades',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createActivity = async (request: CreateActivityRequest) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/cell-modes/${modeId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar atividade')
      }

      const data = await response.json()
      
      toast({
        title: 'Sucesso',
        description: 'Atividade criada com sucesso'
      })

      // Atualizar lista
      await fetchActivities()
      
      return data.activity
    } catch (error) {
      console.error('Erro ao criar atividade:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar atividade',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateActivity = async (activityId: string, request: UpdateActivityRequest) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/mode-activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar atividade')
      }

      const data = await response.json()
      
      toast({
        title: 'Sucesso',
        description: 'Atividade atualizada com sucesso'
      })

      // Atualizar lista
      await fetchActivities()
      
      return data.activity
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar atividade',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteActivity = async (activityId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/mode-activities/${activityId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir atividade')
      }
      
      toast({
        title: 'Sucesso',
        description: 'Atividade excluída com sucesso'
      })

      // Atualizar lista
      await fetchActivities()
    } catch (error) {
      console.error('Erro ao excluir atividade:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir atividade',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (modeId) {
      fetchActivities()
    }
  }, [modeId])

  return {
    activities,
    loading,
    createActivity,
    updateActivity,
    deleteActivity,
    fetchActivities
  }
}

export function useModeDashboard(churchId: string) {
  const [dashboard, setDashboard] = useState<ModeDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchDashboard = async (supervisorId?: string, mode?: CellMode) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (supervisorId) params.set('supervisor_id', supervisorId)
      if (mode) params.set('mode', mode)
      
      const response = await fetch(`/api/protected/church/${churchId}/modes/dashboard?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dashboard')
      }

      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dashboard de modos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (churchId) {
      fetchDashboard()
    }
  }, [churchId])

  return {
    dashboard,
    loading,
    fetchDashboard
  }
}