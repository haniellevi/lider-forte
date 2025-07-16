'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Split, 
  Users, 
  Crown, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'

interface MultiplicationButtonProps {
  cellId: string
  cellName: string
  memberCount: number
  hasQualifiedLeaders: boolean
  canInitiateMultiplication: boolean
  userRole: 'leader' | 'supervisor' | 'member'
}

export function MultiplicationButton({
  cellId,
  cellName,
  memberCount,
  hasQualifiedLeaders,
  canInitiateMultiplication,
  userRole
}: MultiplicationButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const requirements = [
    {
      id: 'memberCount',
      label: 'Mínimo de 12 membros',
      met: memberCount >= 12,
      current: memberCount,
      icon: Users
    },
    {
      id: 'qualifiedLeaders',
      label: 'Líderes qualificados disponíveis',
      met: hasQualifiedLeaders,
      current: hasQualifiedLeaders ? 'Sim' : 'Não',
      icon: Crown
    },
    {
      id: 'userPermission',
      label: 'Permissão para iniciar multiplicação',
      met: canInitiateMultiplication,
      current: canInitiateMultiplication ? 'Sim' : 'Não',
      icon: CheckCircle
    }
  ]

  const allRequirementsMet = requirements.every(req => req.met)

  const handleStartMultiplication = () => {
    setIsDialogOpen(false)
    router.push(`/cells/${cellId}/multiply`)
  }

  if (!canInitiateMultiplication) {
    return null
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={allRequirementsMet ? "default" : "outline"} 
          className="gap-2"
          disabled={!allRequirementsMet}
        >
          <Split className="h-4 w-4" />
          Multiplicar Célula
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Multiplicação da Célula
          </DialogTitle>
          <DialogDescription>
            Iniciar o processo de multiplicação para: <strong>{cellName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status dos Requisitos */}
          <div>
            <h4 className="font-medium mb-3">Requisitos para Multiplicação</h4>
            <div className="space-y-3">
              {requirements.map((requirement) => {
                const Icon = requirement.icon
                return (
                  <div
                    key={requirement.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      requirement.met 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${
                        requirement.met ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className="font-medium">{requirement.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {requirement.current}
                      </span>
                      {requirement.met ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Informações sobre o Processo */}
          <div>
            <h4 className="font-medium mb-3">Sobre o Processo de Multiplicação</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span><strong>Duração:</strong> O wizard leva cerca de 15-20 minutos para ser concluído</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span><strong>Processo:</strong> 6 passos guiados com sugestões automáticas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span><strong>Aprovação:</strong> Requer aprovação de supervisores antes da execução</span>
                </div>
              </div>
            </div>
          </div>

          {/* Etapas do Wizard */}
          <div>
            <h4 className="font-medium mb-3">Etapas do Wizard</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                <span>Informações Básicas</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                <span>Seleção de Template</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                <span>Distribuição de Membros</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
                <span>Seleção do Líder</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
                <span>Revisão do Plano</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">6</Badge>
                <span>Submissão para Aprovação</span>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {!allRequirementsMet && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Requisitos não atendidos:</strong> Alguns critérios para multiplicação 
                ainda não foram atendidos. Trabalhe no desenvolvimento da célula para 
                atender todos os requisitos.
              </AlertDescription>
            </Alert>
          )}

          {allRequirementsMet && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pronto para multiplicar:</strong> Todos os requisitos foram atendidos. 
                Sua célula está pronta para o processo de multiplicação!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleStartMultiplication}
            disabled={!allRequirementsMet}
            className="gap-2"
          >
            <Split className="h-4 w-4" />
            Iniciar Wizard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}