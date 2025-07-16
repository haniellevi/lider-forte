'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/FormElements/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  MapPin, 
  Clock, 
  Crown, 
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react'

interface BasicInfo {
  new_cell_name: string
  meeting_day: string
  meeting_time: string
  address: string
  city: string
  state: string
  zip_code: string
}

interface Template {
  id: string
  name: string
  description: string
  template_type: string
}

interface Assignment {
  member_id: string
  assignment_type: 'stays_source' | 'moves_new' | 'new_leader' | 'undecided'
  role_in_new_cell: string
  member?: {
    full_name: string
  }
}

interface PlanReviewStepProps {
  basicInfo: BasicInfo
  template: Template | null
  assignments: Assignment[]
  leaderId: string
  onConfirm: (confirmed: boolean) => void
}

const daysOfWeek = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira', 
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

const assignmentTypeLabels = {
  stays_source: 'Permanece na célula original',
  moves_new: 'Vai para nova célula', 
  new_leader: 'Novo líder',
  undecided: 'Não decidido'
}

export function PlanReviewStep({
  basicInfo,
  template,
  assignments,
  leaderId,
  onConfirm
}: PlanReviewStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const handleCheckItem = (itemId: string, checked: boolean) => {
    const newCheckedItems = { ...checkedItems, [itemId]: checked }
    setCheckedItems(newCheckedItems)
    
    // Verificar se todos os itens obrigatórios estão marcados
    const requiredItems = [
      'basic_info',
      'template',
      'member_distribution', 
      'leader_selection',
      'final_confirmation'
    ]
    
    const allChecked = requiredItems.every(item => newCheckedItems[item])
    setIsConfirmed(allChecked)
    onConfirm(allChecked)
  }

  const getDistributionSummary = () => {
    return assignments.reduce((acc, assignment) => {
      acc[assignment.assignment_type] = (acc[assignment.assignment_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const getLeaderName = () => {
    const leader = assignments.find(a => a.member_id === leaderId)
    return leader?.member?.full_name || 'Não encontrado'
  }

  const validatePlan = () => {
    const issues = []
    
    if (!basicInfo.new_cell_name) {
      issues.push('Nome da nova célula não definido')
    }
    
    if (!basicInfo.address) {
      issues.push('Endereço da nova célula não definido')
    }
    
    if (!template) {
      issues.push('Template de multiplicação não selecionado')
    }
    
    const summary = getDistributionSummary()
    if (!summary.new_leader || summary.new_leader !== 1) {
      issues.push('Novo líder não selecionado ou múltiplos líderes')
    }
    
    if (!summary.moves_new || summary.moves_new < 3) {
      issues.push('Poucos membros selecionados para nova célula (mínimo 3)')
    }
    
    if (summary.undecided && summary.undecided > 0) {
      issues.push(`${summary.undecided} membro(s) ainda não tem atribuição definida`)
    }
    
    return issues
  }

  const validationIssues = validatePlan()
  const summary = getDistributionSummary()
  const isValid = validationIssues.length === 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Revisão do Plano de Multiplicação</h3>
        <p className="text-muted-foreground">
          Revise cuidadosamente todas as configurações antes de enviar para aprovação
        </p>
      </div>

      {/* Status de Validação */}
      <Card className={`border-2 ${
        isValid ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium ${isValid ? 'text-green-900' : 'text-amber-900'}`}>
                {isValid ? 'Plano Válido' : 'Atenção - Problemas Identificados'}
              </h4>
              {!isValid && (
                <ul className="text-sm text-amber-800 mt-2 space-y-1">
                  {validationIssues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              )}
              {isValid && (
                <p className="text-sm text-green-800 mt-1">
                  Todas as configurações estão corretas e o plano está pronto para aprovação.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Revisão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist de Revisão
          </CardTitle>
          <CardDescription>
            Marque cada item após revisar cuidadosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. Informações Básicas */}
          <div className="flex items-start gap-3">
            <Checkbox
              label="Informações Básicas da Nova Célula"
              onChange={(e) => handleCheckItem('basic_info', e.target.checked)}
            />
            <div className="flex-1">
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>Nome: <strong>{basicInfo.new_cell_name}</strong></div>
                  <div>
                    Reunião: <strong>
                      {daysOfWeek[basicInfo.meeting_day as keyof typeof daysOfWeek]} às {basicInfo.meeting_time}
                    </strong>
                  </div>
                  <div className="md:col-span-2">
                    Endereço: <strong>
                      {basicInfo.address}, {basicInfo.city} - {basicInfo.state}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 2. Template Selecionado */}
          <div className="flex items-start gap-3">
            <Checkbox
              label="Estratégia de Multiplicação"
              onChange={(e) => handleCheckItem('template', e.target.checked)}
            />
            <div className="flex-1">
              <div className="mt-2 text-sm text-muted-foreground">
                {template ? (
                  <div>
                    <strong>{template.name}</strong> - {template.description}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {template.template_type}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-red-600">Nenhum template selecionado</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 3. Distribuição de Membros */}
          <div className="flex items-start gap-3">
            <Checkbox
              label="Distribuição de Membros"
              onChange={(e) => handleCheckItem('member_distribution', e.target.checked)}
            />
            <div className="flex-1">
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>Permanecem: <strong>{summary.stays_source || 0}</strong></div>
                  <div>Nova célula: <strong>{summary.moves_new || 0}</strong></div>
                  <div>Novo líder: <strong>{summary.new_leader || 0}</strong></div>
                  <div>Não decididos: <strong>{summary.undecided || 0}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 4. Seleção do Líder */}
          <div className="flex items-start gap-3">
            <Checkbox
              label="Novo Líder Selecionado"
              onChange={(e) => handleCheckItem('leader_selection', e.target.checked)}
            />
            <div className="flex-1">
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <strong>{getLeaderName()}</strong>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 5. Confirmação Final */}
          <div className="flex items-start gap-3">
            <Checkbox
              label="Confirmação Final"
              onChange={(e) => handleCheckItem('final_confirmation', e.target.checked)}
            />
            <div className="flex-1">
              <div className="mt-2 text-sm text-muted-foreground">
                Confirmo que revisei todas as informações e estou pronto para submeter 
                este plano para aprovação hierárquica.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes dos Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detalhes da Distribuição de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              assignments.reduce((acc, assignment) => {
                if (!acc[assignment.assignment_type]) {
                  acc[assignment.assignment_type] = []
                }
                acc[assignment.assignment_type].push(assignment)
                return acc
              }, {} as Record<string, Assignment[]>)
            ).map(([type, members]) => (
              <div key={type}>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  {type === 'new_leader' && <Crown className="h-4 w-4 text-purple-600" />}
                  {assignmentTypeLabels[type as keyof typeof assignmentTypeLabels]} 
                  <Badge variant="outline">{members.length}</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {members.map((member) => (
                    <div key={member.member_id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      {member.member?.full_name}
                      {member.assignment_type === 'new_leader' && (
                        <Badge variant="secondary" className="text-xs">Líder</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {type !== 'undecided' && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status da Confirmação */}
      {isConfirmed && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Plano Revisado e Confirmado</h4>
                <p className="text-sm text-green-800 mt-1">
                  Todas as verificações foram concluídas. O plano está pronto para ser 
                  enviado para aprovação hierárquica no próximo passo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}