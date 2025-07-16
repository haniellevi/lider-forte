'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Target, Edit, TrendingUp, Award } from 'lucide-react'
import { useModeMetrics } from '@/hooks/use-cell-modes'
import { ModeBadge } from './mode-badge'
import type { MetricProgress, UpdateMetricsRequest } from '@/types/cell-modes'

interface ModeMetricsProps {
  modeId: string
  editable?: boolean
}

export function ModeMetrics({ modeId, editable = true }: ModeMetricsProps) {
  const { mode, loading, updateMetrics } = useModeMetrics(modeId)
  const [editingMetrics, setEditingMetrics] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="text-center py-8 text-gray-500">
        Modo não encontrado
      </div>
    )
  }

  const handleEditMetrics = () => {
    setEditingMetrics(mode.actual_metrics || {})
    setShowEditDialog(true)
  }

  const handleSaveMetrics = async () => {
    try {
      setSaving(true)
      const request: UpdateMetricsRequest = {
        metrics: editingMetrics
      }
      await updateMetrics(request)
      setShowEditDialog(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setSaving(false)
    }
  }

  const metricsProgress = mode.metrics_progress || []
  const overallProgress = metricsProgress.length > 0 
    ? Math.round(metricsProgress.reduce((sum, m) => sum + m.percentage, 0) / metricsProgress.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Modo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ModeBadge mode={mode.mode} />
                Métricas do Modo
              </CardTitle>
              <CardDescription>
                {mode.goal_description || mode.mode_templates?.description}
              </CardDescription>
            </div>
            
            {editable && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleEditMetrics}>
                    <Edit className="h-4 w-4 mr-2" />
                    Atualizar Métricas
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Métricas</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {metricsProgress.map((metric) => (
                      <div key={metric.key}>
                        <Label htmlFor={metric.key}>{metric.description}</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id={metric.key}
                            type="number"
                            min="0"
                            value={editingMetrics[metric.key] || 0}
                            onChange={(e) => setEditingMetrics(prev => ({
                              ...prev,
                              [metric.key]: Number(e.target.value)
                            }))}
                          />
                          <Badge variant="outline">
                            Meta: {metric.target}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveMetrics}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-gray-600">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-blue-500" />
                <span>Início: {new Date(mode.start_date).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {mode.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-red-500" />
                  <span>Fim: {new Date(mode.end_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Individuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsProgress.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      {/* Resumo de Performance */}
      {metricsProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metricsProgress.filter(m => m.percentage >= 100).length}
                </div>
                <div className="text-sm text-gray-600">Metas Alcançadas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {metricsProgress.filter(m => m.percentage >= 50 && m.percentage < 100).length}
                </div>
                <div className="text-sm text-gray-600">Em Progresso</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {metricsProgress.filter(m => m.percentage < 50).length}
                </div>
                <div className="text-sm text-gray-600">Precisam Atenção</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MetricCardProps {
  metric: MetricProgress
}

function MetricCard({ metric }: MetricCardProps) {
  const getColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          {metric.description}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold ${getColor(metric.percentage)}`}>
              {metric.actual}
            </span>
            <span className="text-sm text-gray-500 mb-1">
              / {metric.target}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span className={getColor(metric.percentage)}>
                {metric.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metric.percentage)}`}
                style={{ width: `${Math.min(100, metric.percentage)}%` }}
              />
            </div>
          </div>
          
          {metric.percentage >= 100 && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Meta Alcançada!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}