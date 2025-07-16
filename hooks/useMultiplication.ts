'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface MultiplicationProcess {
  id: string
  source_cell_id: string
  church_id: string
  status: string
  current_step: number
  total_steps: number
  multiplication_plan: any
  member_distribution: any
  new_leader_id?: string
  created_at: string
  updated_at: string
}

interface Template {
  id: string
  name: string
  description: string
  template_type: string
  member_split_strategy: any
  leader_selection_criteria: any
  success_rate: number
  times_used: number
}

interface Assignment {
  id?: string
  member_id: string
  assignment_type: 'stays_source' | 'moves_new' | 'new_leader' | 'undecided'
  role_in_new_cell: string
  notes?: string
  member?: {
    id: string
    full_name: string
    age: number
  }
}

export function useMultiplication(cellId?: string) {
  const [processes, setProcesses] = useState<MultiplicationProcess[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar templates disponíveis
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/protected/multiplication/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('Erro ao carregar templates')
    }
  }

  // Carregar processos de multiplicação
  const loadProcesses = async (cellId?: string) => {
    if (!cellId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/protected/cells/${cellId}/multiplication-processes`)
      if (response.ok) {
        const data = await response.json()
        setProcesses(data.data || [])
      }
    } catch (error) {
      console.error('Error loading processes:', error)
      setError('Erro ao carregar processos de multiplicação')
    } finally {
      setIsLoading(false)
    }
  }

  // Iniciar novo processo de multiplicação
  const startMultiplication = async (cellId: string, basicInfo: any) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/protected/multiplication/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_cell_id: cellId,
          multiplication_plan: basicInfo
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Processo de multiplicação iniciado com sucesso!')
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao iniciar multiplicação')
      }
    } catch (error: any) {
      console.error('Error starting multiplication:', error)
      setError(error.message)
      toast.error('Erro ao iniciar processo de multiplicação')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Gerar sugestões de distribuição
  const generateSuggestions = async (processId: string, templateId?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/protected/multiplication/suggest-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          multiplication_id: processId,
          template_id: templateId
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Sugestões geradas com sucesso!')
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar sugestões')
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error)
      setError(error.message)
      toast.error('Erro ao gerar sugestões de distribuição')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar atribuições de membros
  const updateAssignments = async (processId: string, assignments: Assignment[]) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/protected/multiplication/update-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          multiplication_id: processId,
          assignments: assignments.map(a => ({
            member_id: a.member_id,
            assignment_type: a.assignment_type,
            role_in_new_cell: a.role_in_new_cell,
            notes: a.notes
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Atribuições atualizadas com sucesso!')
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar atribuições')
      }
    } catch (error: any) {
      console.error('Error updating assignments:', error)
      setError(error.message)
      toast.error('Erro ao atualizar atribuições')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar processo
  const updateProcess = async (processId: string, updateData: any) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/protected/multiplication/process/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const data = await response.json()
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar processo')
      }
    } catch (error: any) {
      console.error('Error updating process:', error)
      setError(error.message)
      toast.error('Erro ao atualizar processo')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Executar multiplicação
  const executeMultiplication = async (processId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/protected/multiplication/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          multiplication_id: processId
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Multiplicação executada com sucesso!')
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao executar multiplicação')
      }
    } catch (error: any) {
      console.error('Error executing multiplication:', error)
      setError(error.message)
      toast.error('Erro ao executar multiplicação')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar detalhes de um processo
  const getProcessDetails = async (processId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/protected/multiplication/process/${processId}`)
      if (response.ok) {
        const data = await response.json()
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao buscar detalhes do processo')
      }
    } catch (error: any) {
      console.error('Error fetching process details:', error)
      setError(error.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se célula pode ser multiplicada
  const checkMultiplicationEligibility = async (cellId: string) => {
    try {
      const response = await fetch(`/api/protected/cells/${cellId}/multiplication-eligibility`)
      if (response.ok) {
        const data = await response.json()
        return data.data
      }
    } catch (error) {
      console.error('Error checking multiplication eligibility:', error)
    }
    return null
  }

  useEffect(() => {
    loadTemplates()
    if (cellId) {
      loadProcesses(cellId)
    }
  }, [cellId])

  return {
    // Estado
    processes,
    templates,
    isLoading,
    error,
    
    // Ações
    startMultiplication,
    generateSuggestions,
    updateAssignments,
    updateProcess,
    executeMultiplication,
    getProcessDetails,
    checkMultiplicationEligibility,
    loadProcesses,
    loadTemplates,
    
    // Utilitários
    clearError: () => setError(null)
  }
}