'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface Member {
  member_id: string
  name: string
  current_role: string
  suggestion: 'stays_source' | 'moves_new' | 'new_leader' | 'undecided'
  role_in_new: string
  priority_score: number
  reasoning: string
  leadership_score: number
  ladder_score: number
  is_timoteo: boolean
  months_in_cell: number
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

interface MemberDistributionStepProps {
  processId: string
  templateId?: string
  assignments: Assignment[]
  onAssignmentsChange: (assignments: Assignment[]) => void
  onLeaderSelect: (leaderId: string) => void
}

const assignmentTypeLabels = {
  stays_source: 'Permanece na célula original',
  moves_new: 'Vai para nova célula',
  new_leader: 'Novo líder',
  undecided: 'Não decidido'
}

const assignmentTypeColors = {
  stays_source: 'bg-blue-50 text-blue-700 border-blue-200',
  moves_new: 'bg-green-50 text-green-700 border-green-200',
  new_leader: 'bg-purple-50 text-purple-700 border-purple-200',
  undecided: 'bg-gray-50 text-gray-700 border-gray-200'
}

export function MemberDistributionStep({ 
  processId, 
  templateId, 
  assignments, 
  onAssignmentsChange,
  onLeaderSelect 
}: MemberDistributionStepProps) {
  const [suggestedDistribution, setSuggestedDistribution] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    if (templateId && processId) {
      generateSuggestions()
    }
  }, [templateId, processId])

  const generateSuggestions = async () => {
    setIsGenerating(true)
    try {
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
        setSuggestedDistribution(data.data)
        setMembers(data.data.members || [])
        
        // Converter sugestões para assignments
        const newAssignments = data.data.members?.map((member: Member) => ({
          member_id: member.member_id,
          assignment_type: member.suggestion,
          role_in_new_cell: member.role_in_new,
          notes: member.reasoning,
          member: {
            id: member.member_id,
            full_name: member.name,
            age: 0
          }
        })) || []
        
        onAssignmentsChange(newAssignments)
        
        // Definir líder automaticamente
        const newLeader = newAssignments.find(a => a.assignment_type === 'new_leader')
        if (newLeader) {
          onLeaderSelect(newLeader.member_id)
        }
        
        toast.success('Sugestões geradas com sucesso!')
      } else {
        throw new Error('Failed to generate suggestions')
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error('Erro ao gerar sugestões de distribuição')
    } finally {
      setIsGenerating(false)
    }
  }

  const updateAssignment = async (memberId: string, newAssignment: any) => {
    const updatedAssignments = assignments.map(assignment => 
      assignment.member_id === memberId ? { ...assignment, ...newAssignment } : assignment
    )
    
    // Garantir que apenas um membro seja líder
    if (newAssignment.assignment_type === 'new_leader') {
      updatedAssignments.forEach(assignment => {
        if (assignment.member_id !== memberId && assignment.assignment_type === 'new_leader') {
          assignment.assignment_type = 'moves_new'
        }
      })
      onLeaderSelect(memberId)
    }
    
    onAssignmentsChange(updatedAssignments)
    
    // Salvar no backend
    try {
      await fetch('/api/protected/multiplication/update-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          multiplication_id: processId,
          assignments: updatedAssignments.map(a => ({
            member_id: a.member_id,
            assignment_type: a.assignment_type,
            role_in_new_cell: a.role_in_new_cell,
            notes: a.notes
          }))
        })
      })
    } catch (error) {
      console.error('Error saving assignments:', error)
      toast.error('Erro ao salvar alterações')
    }
  }

  const getMemberData = (memberId: string) => {
    return members.find(m => m.member_id === memberId)
  }

  const getDistributionSummary = () => {
    const summary = assignments.reduce((acc, assignment) => {
      acc[assignment.assignment_type] = (acc[assignment.assignment_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return summary
  }

  const validateDistribution = () => {
    const newLeaders = assignments.filter(a => a.assignment_type === 'new_leader')
    const movingMembers = assignments.filter(a => a.assignment_type === 'moves_new')
    
    return {
      hasLeader: newLeaders.length === 1,
      hasMembers: movingMembers.length > 0,
      isBalanced: movingMembers.length >= 3 && movingMembers.length <= assignments.length * 0.7
    }
  }

  const validation = validateDistribution()
  const summary = getDistributionSummary()

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Permanecem</p>
                <p className="text-lg font-bold text-blue-600">{summary.stays_source || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Nova Célula</p>
                <p className="text-lg font-bold text-green-600">{summary.moves_new || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Novo Líder</p>
                <p className="text-lg font-bold text-purple-600">{summary.new_leader || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Não decididos</p>
                <p className="text-lg font-bold text-gray-600">{summary.undecided || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de gerar sugestões */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Distribuição de Membros</h3>
          <p className="text-muted-foreground">
            Defina quais membros irão para a nova célula
          </p>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating || !templateId}
          variant="outline"
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Regerar Sugestões
        </Button>
      </div>

      {/* Validação */}
      <Card className={`border-2 ${
        validation.hasLeader && validation.hasMembers 
          ? 'border-green-200 bg-green-50' 
          : 'border-amber-200 bg-amber-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {validation.hasLeader && validation.hasMembers ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium ${
                validation.hasLeader && validation.hasMembers 
                  ? 'text-green-900' 
                  : 'text-amber-900'
              }`}>
                Status da Distribuição
              </h4>
              <ul className={`text-sm mt-1 space-y-1 ${
                validation.hasLeader && validation.hasMembers 
                  ? 'text-green-800' 
                  : 'text-amber-800'
              }`}>
                <li className="flex items-center gap-2">
                  {validation.hasLeader ? '✓' : '✗'} Novo líder selecionado
                </li>
                <li className="flex items-center gap-2">
                  {validation.hasMembers ? '✓' : '✗'} Membros para nova célula definidos
                </li>
                <li className="flex items-center gap-2">
                  {validation.isBalanced ? '✓' : '!'} Distribuição equilibrada
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de membros */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const memberData = getMemberData(assignment.member_id)
          
          return (
            <Card key={assignment.member_id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{assignment.member?.full_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Papel atual: {memberData?.current_role || 'Membro'}</span>
                        {memberData?.is_timoteo && (
                          <Badge variant="secondary" className="text-xs">Timóteo</Badge>
                        )}
                      </div>
                      
                      {memberData && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Liderança: {memberData.leadership_score}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Escada: {memberData.ladder_score}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {Math.round(memberData.months_in_cell)} meses
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={assignmentTypeColors[assignment.assignment_type]}
                    >
                      {assignmentTypeLabels[assignment.assignment_type]}
                    </Badge>
                    
                    <Select
                      value={assignment.assignment_type}
                      onValueChange={(value) => updateAssignment(assignment.member_id, {
                        assignment_type: value,
                        role_in_new_cell: value === 'new_leader' ? 'leader' : 'member'
                      })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stays_source">Permanece na original</SelectItem>
                        <SelectItem value="moves_new">Vai para nova célula</SelectItem>
                        <SelectItem value="new_leader">Novo líder</SelectItem>
                        <SelectItem value="undecided">Não decidido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {assignment.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Observação:</strong> {assignment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {assignments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Nenhuma sugestão gerada</h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Regerar Sugestões" para obter recomendações automáticas
              baseadas no template selecionado.
            </p>
            <Button onClick={generateSuggestions} disabled={isGenerating || !templateId}>
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Gerar Sugestões
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}