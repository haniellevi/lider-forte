'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Send, 
  Clock, 
  Users, 
  Shield,
  AlertTriangle,
  FileCheck,
  MessageSquare
} from 'lucide-react'

interface ApprovalSubmissionStepProps {
  processId: string
  onSubmit: () => void
}

export function ApprovalSubmissionStep({ processId, onSubmit }: ApprovalSubmissionStepProps) {
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/protected/multiplication/process/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending_approval',
          approval_notes: submissionNotes || null,
          current_step: 6
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Plano enviado para aprovação com sucesso!')
        
        // Chamar callback após pequeno delay para mostrar o sucesso
        setTimeout(() => {
          onSubmit()
        }, 2000)
      } else {
        throw new Error('Failed to submit for approval')
      }
    } catch (error) {
      console.error('Error submitting for approval:', error)
      toast.error('Erro ao enviar plano para aprovação')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">
            Plano Enviado para Aprovação!
          </h3>
          <p className="text-green-700">
            Seu plano de multiplicação foi enviado com sucesso para aprovação hierárquica.
          </p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-800">
                <Clock className="h-4 w-4" />
                <span>Status: Aguardando Aprovação</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="h-4 w-4" />
                <span>Enviado para supervisores e administradores da igreja</span>
              </div>
              <div className="flex items-center gap-2 text-green-800">
                <FileCheck className="h-4 w-4" />
                <span>Você receberá notificações sobre o status da aprovação</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-sm">
          Redirecionando para a página da célula...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Submissão para Aprovação</h3>
        <p className="text-muted-foreground">
          Envie seu plano de multiplicação para aprovação hierárquica
        </p>
      </div>

      {/* Informações sobre o processo de aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Processo de Aprovação
          </CardTitle>
          <CardDescription>
            Como funciona a aprovação de multiplicações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                1
              </div>
              <div>
                <h4 className="font-medium">Revisão Automática</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema verifica automaticamente se todos os critérios são atendidos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium">Análise Ministerial</h4>
                <p className="text-sm text-muted-foreground">
                  Supervisores e líderes ministeriais analisam o plano proposto
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                3
              </div>
              <div>
                <h4 className="font-medium">Decisão Final</h4>
                <p className="text-sm text-muted-foreground">
                  Aprovação ou solicitação de ajustes com feedback detalhado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quem irá avaliar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Responsáveis pela Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span><strong>Supervisores de Célula:</strong> Análise da viabilidade e estratégia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span><strong>Pastores:</strong> Aprovação ministerial e alinhamento com visão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span><strong>Administradores:</strong> Validação de recursos e logística</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campo para observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observações para Aprovação
          </CardTitle>
          <CardDescription>
            Adicione informações relevantes para os aprovadores (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="submission-notes">
              Contexto adicional, justificativas ou informações importantes
            </Label>
            <Textarea
              id="submission-notes"
              placeholder="Ex: Esta multiplicação atende a uma demanda geográfica específica, onde muitos membros moram longe do local atual de reunião..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Estas observações serão enviadas junto com o plano para contextualizar a solicitação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aviso sobre tempo de aprovação */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tempo de Resposta:</strong> O processo de aprovação pode levar de 3 a 7 dias úteis. 
          Você receberá notificações por e-mail sobre atualizações no status. Durante este período, 
          o plano não pode ser editado.
        </AlertDescription>
      </Alert>

      {/* Botão de submissão */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar para Aprovação
            </>
          )}
        </Button>
      </div>

      {/* Informações finais */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Após a Aprovação</h4>
              <p className="text-sm text-blue-800 mt-1">
                Uma vez aprovado, o sistema executará automaticamente a multiplicação:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Nova célula será criada com as configurações definidas</li>
                <li>• Membros serão transferidos automaticamente</li>
                <li>• Novo líder assumirá a liderança</li>
                <li>• Modo inicial da célula será ativado</li>
                <li>• Todos os envolvidos receberão notificações</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}