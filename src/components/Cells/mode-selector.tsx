'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Target, Clock, Users, TrendingUp } from 'lucide-react'
import { useCellModes } from '@/hooks/use-cell-modes'
import type { CellMode, ModeTemplate, ActivateModeRequest } from '@/types/cell-modes'
import { MODE_COLORS, MODE_ICONS } from '@/types/cell-modes'

interface ModeSelectorProps {
  cellId: string
  churchId: string
  onModeActivated: () => void
  trigger?: React.ReactNode
}

export function ModeSelector({ 
  cellId, 
  churchId, 
  onModeActivated,
  trigger 
}: ModeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<CellMode | null>(null)
  const [durationWeeks, setDurationWeeks] = useState<number>(4)
  const [goalDescription, setGoalDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const { templates, loading, fetchTemplates } = useCellModes()

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && templates.length === 0) {
      fetchTemplates(churchId)
    }
    if (!newOpen) {
      setSelectedMode(null)
      setDurationWeeks(4)
      setGoalDescription('')
    }
  }

  const handleSubmit = async () => {
    if (!selectedMode) return

    try {
      setSubmitting(true)
      
      const template = templates.find(t => t.mode === selectedMode && t.is_default)
      
      const request: ActivateModeRequest = {
        mode: selectedMode,
        duration_weeks: durationWeeks,
        goal_description: goalDescription || template?.description || undefined
      }

      const response = await fetch(`/api/protected/cells/${cellId}/modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao ativar modo')
      }

      setOpen(false)
      onModeActivated()
    } catch (error) {
      console.error('Erro ao ativar modo:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = templates.find(t => t.mode === selectedMode && t.is_default)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Ativar Modo
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Modo Estratégico</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid de Modos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.filter(t => t.is_default).map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-colors hover:shadow-md ${
                    selectedMode === template.mode 
                      ? 'ring-2 ring-primary' 
                      : ''
                  }`}
                  onClick={() => setSelectedMode(template.mode)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span style={{ color: template.color }}>
                          {MODE_ICONS[template.mode]}
                        </span>
                        {template.mode}
                      </CardTitle>
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${template.color}15`,
                          borderColor: template.color,
                          color: template.color
                        }}
                      >
                        {template.default_duration_weeks} semanas
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium mb-2 text-sm text-gray-600">
                          Atividades Sugeridas:
                        </h5>
                        <ul className="text-sm space-y-1">
                          {template.suggested_activities.slice(0, 3).map((activity, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              {activity}
                            </li>
                          ))}
                          {template.suggested_activities.length > 3 && (
                            <li className="text-gray-500 text-xs">
                              +{template.suggested_activities.length - 3} mais...
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2 text-sm text-gray-600">
                          Métricas Principais:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(template.target_metrics_template || {}).slice(0, 2).map((key) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {template.target_metrics_template[key]?.description || key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Configurações do Modo Selecionado */}
            {selectedMode && selectedTemplate && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span style={{ color: selectedTemplate.color }}>
                    {MODE_ICONS[selectedMode]}
                  </span>
                  Configurar {selectedMode}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="duration">Duração (semanas)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="52"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="goal">Objetivo Específico (opcional)</Label>
                      <Textarea
                        id="goal"
                        placeholder={selectedTemplate.description}
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Métricas de Sucesso
                      </h5>
                      <div className="space-y-2">
                        {Object.entries(selectedTemplate.target_metrics_template || {}).map(([key, metric]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{metric.description}</span>
                            <Badge variant="outline">{metric.target}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Modo ativo por {durationWeeks} semana{durationWeeks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ backgroundColor: selectedTemplate.color }}
                    className="text-white hover:opacity-90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">{MODE_ICONS[selectedMode]}</span>
                        Ativar {selectedMode}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}