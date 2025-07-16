'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Target, TrendingUp } from 'lucide-react'
import { ModeBadge } from './mode-badge'
import { ModeSelector } from './mode-selector'
import type { CurrentCellMode } from '@/types/cell-modes'

interface ModeWidgetProps {
  cellId: string
  churchId: string
  currentMode?: CurrentCellMode | null
  onModeChanged?: () => void
  compact?: boolean
}

export function ModeWidget({ 
  cellId, 
  churchId, 
  currentMode, 
  onModeChanged,
  compact = false 
}: ModeWidgetProps) {
  if (!currentMode) {
    return (
      <Card className={compact ? 'h-fit' : ''}>
        <CardHeader className={compact ? 'pb-3' : ''}>
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>
            Modo Estratégico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Nenhum modo ativo
            </p>
            <ModeSelector
              cellId={cellId}
              churchId={churchId}
              onModeActivated={onModeChanged}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const daysRemainingText = currentMode.days_remaining !== null 
    ? currentMode.days_remaining > 0 
      ? `${currentMode.days_remaining} dias restantes`
      : currentMode.days_remaining === 0
      ? 'Termina hoje'
      : `Expirado há ${Math.abs(currentMode.days_remaining)} dias`
    : 'Duração indefinida'

  return (
    <Card className={compact ? 'h-fit' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>
            Modo Estratégico
          </CardTitle>
          <ModeSelector
            cellId={cellId}
            churchId={churchId}
            onModeActivated={onModeChanged}
            trigger={
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">
                Alterar
              </Badge>
            }
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <ModeBadge mode={currentMode.mode} />
          <Badge variant="outline">
            {Math.round(currentMode.progress_percentage)}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso</span>
            <span>{currentMode.progress_percentage}%</span>
          </div>
          <Progress value={currentMode.progress_percentage} className="h-2" />
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            <span>Início: {new Date(currentMode.start_date).toLocaleDateString('pt-BR')}</span>
          </div>
          
          {currentMode.end_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{daysRemainingText}</span>
            </div>
          )}
        </div>

        {!compact && currentMode.target_metrics && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Métricas Principais</h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(currentMode.target_metrics).slice(0, 4).map(([key, metric]) => {
                const actual = currentMode.actual_metrics?.[key] || 0
                const target = metric.target
                const percentage = target > 0 ? Math.min(100, (actual / target) * 100) : 0
                
                return (
                  <div key={key} className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600">{metric.description}</div>
                    <div className="text-sm font-medium">
                      {actual}/{target}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}