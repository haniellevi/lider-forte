'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { TemplateSelectionStep } from './steps/TemplateSelectionStep'
import { MemberDistributionStep } from './steps/MemberDistributionStep'
import { LeaderSelectionStep } from './steps/LeaderSelectionStep'
import { PlanReviewStep } from './steps/PlanReviewStep'
import { ApprovalSubmissionStep } from './steps/ApprovalSubmissionStep'

interface WizardStep {
  step: number
  name: string
  description: string
  required_fields: string[]
}

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
}

interface MultiplicationWizardProps {
  cellId: string
  initialProcess?: MultiplicationProcess
}

export function MultiplicationWizard({ cellId, initialProcess }: MultiplicationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>([])
  const [process, setProcess] = useState<MultiplicationProcess | null>(initialProcess || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(!initialProcess)

  // Estado dos dados do wizard
  const [basicInfo, setBasicInfo] = useState({
    new_cell_name: '',
    meeting_day: 'wednesday',
    meeting_time: '19:30',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  })

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [memberAssignments, setMemberAssignments] = useState<any[]>([])
  const [selectedLeader, setSelectedLeader] = useState<string>('')
  const [planConfirmed, setPlanConfirmed] = useState(false)

  useEffect(() => {
    const initializeWizard = async () => {
      try {
        // Buscar passos do wizard
        const response = await fetch('/api/protected/multiplication/wizard-steps')
        if (response.ok) {
          const data = await response.json()
          setWizardSteps(data.steps || [])
        }

        // Se não há processo inicial, criar um novo
        if (!initialProcess) {
          await createInitialProcess()
        } else {
          // Carregar dados do processo existente
          await loadProcessData(initialProcess.id)
        }
      } catch (error) {
        console.error('Error initializing wizard:', error)
        toast.error('Erro ao inicializar wizard de multiplicação')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeWizard()
  }, [])

  const createInitialProcess = async () => {
    try {
      setIsLoading(true)
      
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
        setProcess(data.data)
        setCurrentStep(1)
      } else {
        throw new Error('Failed to create multiplication process')
      }
    } catch (error) {
      console.error('Error creating process:', error)
      toast.error('Erro ao criar processo de multiplicação')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProcessData = async (processId: string) => {
    try {
      const response = await fetch(`/api/protected/multiplication/process/${processId}`)
      if (response.ok) {
        const data = await response.json()
        const processData = data.data.process
        
        setProcess(processData)
        setCurrentStep(processData.current_step)
        
        // Carregar dados salvos
        if (processData.multiplication_plan) {
          setBasicInfo(processData.multiplication_plan)
        }
        
        if (data.data.member_assignments) {
          setMemberAssignments(data.data.member_assignments)
        }
        
        if (processData.new_leader_id) {
          setSelectedLeader(processData.new_leader_id)
        }
      }
    } catch (error) {
      console.error('Error loading process:', error)
      toast.error('Erro ao carregar dados do processo')
    }
  }

  const updateProcess = async (updateData: any) => {
    if (!process) return false

    try {
      const response = await fetch(`/api/protected/multiplication/process/${process.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const data = await response.json()
        setProcess(data.data)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating process:', error)
      return false
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(basicInfo.new_cell_name && basicInfo.meeting_day && 
                 basicInfo.meeting_time && basicInfo.address)
      case 2:
        return !!selectedTemplate
      case 3:
        return memberAssignments.length > 0 && 
               memberAssignments.some(a => a.assignment_type === 'new_leader')
      case 4:
        return !!selectedLeader
      case 5:
        return planConfirmed
      case 6:
        return true
      default:
        return false
    }
  }

  const nextStep = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)

    try {
      let updateData: any = {}

      switch (currentStep) {
        case 1:
          updateData = {
            multiplication_plan: basicInfo,
            current_step: 2
          }
          break
        case 2:
          updateData = {
            multiplication_plan: { ...basicInfo, template_id: selectedTemplate?.id },
            current_step: 3
          }
          break
        case 3:
          updateData = {
            current_step: 4,
            new_leader_id: selectedLeader
          }
          break
        case 4:
          updateData = {
            current_step: 5,
            status: 'plan_review'
          }
          break
        case 5:
          updateData = {
            current_step: 6,
            status: 'pending_approval'
          }
          break
      }

      const success = await updateProcess(updateData)
      if (success) {
        setCurrentStep(currentStep + 1)
      } else {
        toast.error('Erro ao avançar para próximo passo')
      }
    } catch (error) {
      console.error('Error advancing step:', error)
      toast.error('Erro ao avançar para próximo passo')
    } finally {
      setIsLoading(false)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={basicInfo}
            onChange={setBasicInfo}
            cellId={cellId}
          />
        )
      case 2:
        return (
          <TemplateSelectionStep
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        )
      case 3:
        return (
          <MemberDistributionStep
            processId={process?.id || ''}
            templateId={selectedTemplate?.id}
            assignments={memberAssignments}
            onAssignmentsChange={setMemberAssignments}
            onLeaderSelect={setSelectedLeader}
          />
        )
      case 4:
        return (
          <LeaderSelectionStep
            processId={process?.id || ''}
            selectedLeader={selectedLeader}
            onLeaderSelect={setSelectedLeader}
            potentialLeaders={memberAssignments.filter(a => 
              a.assignment_type === 'moves_new' && 
              (a.member.is_timoteo || a.priority_score >= 65)
            )}
          />
        )
      case 5:
        return (
          <PlanReviewStep
            basicInfo={basicInfo}
            template={selectedTemplate}
            assignments={memberAssignments}
            leaderId={selectedLeader}
            onConfirm={setPlanConfirmed}
          />
        )
      case 6:
        return (
          <ApprovalSubmissionStep
            processId={process?.id || ''}
            onSubmit={() => {
              toast.success('Processo enviado para aprovação!')
              router.push(`/cells/${cellId}`)
            }}
          />
        )
      default:
        return null
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Inicializando wizard de multiplicação...</p>
        </div>
      </div>
    )
  }

  const progress = (currentStep / 6) * 100
  const currentStepData = wizardSteps.find(s => s.step === currentStep)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wizard de Multiplicação de Célula</CardTitle>
              <CardDescription>
                {currentStepData ? 
                  `Passo ${currentStep}: ${currentStepData.name}` : 
                  `Passo ${currentStep} de 6`
                }
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {process?.status && (
                <div className="flex items-center gap-2">
                  {process.status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  Status: {process.status}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {wizardSteps.map((step) => (
                <div
                  key={step.step}
                  className={`text-center ${
                    step.step === currentStep
                      ? 'text-primary font-medium'
                      : step.step < currentStep
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.step < currentStep ? (
                    <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                  ) : (
                    <div className="h-4 w-4 mx-auto mb-1 rounded-full border-2 border-current" />
                  )}
                  <div className="text-xs">{step.name}</div>
                </div>
              ))}
            </div>
          </div>

          {currentStepData && (
            <p className="text-sm text-muted-foreground mt-4">
              {currentStepData.description}
            </p>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="p-6">
          {renderStep()}
        </CardContent>

        <Separator />

        <div className="p-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/cells/${cellId}`)}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              {currentStep < 6 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep) || isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    toast.success('Processo finalizado!')
                    router.push(`/cells/${cellId}`)
                  }}
                  disabled={isLoading}
                >
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}