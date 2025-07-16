'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, TrendingUp, Users, Clock, Target, AlertTriangle } from 'lucide-react'
import { useModeDashboard } from '@/hooks/use-cell-modes'
import { ModeBadge } from './mode-badge'
import { ModeSelector } from './mode-selector'
import type { CellMode, CellModeDashboardItem } from '@/types/cell-modes'
import { MODE_COLORS, MODE_NAMES } from '@/types/cell-modes'

interface ModeDashboardProps {
  churchId: string
  supervisorId?: string
  userRole?: string
}

export function ModeDashboard({ 
  churchId, 
  supervisorId,
  userRole = 'pastor'
}: ModeDashboardProps) {
  const [selectedMode, setSelectedMode] = useState<CellMode | null>(null)
  const { dashboard, loading, fetchDashboard } = useModeDashboard(churchId)

  useEffect(() => {
    fetchDashboard(supervisorId, selectedMode || undefined)
  }, [supervisorId, selectedMode])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-8 text-gray-500">
        Erro ao carregar dashboard de modos
      </div>
    )
  }

  const { statistics, dashboard: cells, cells_without_mode, recommendations } = dashboard

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Células</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_cells}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.active_modes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modos Expirados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.expired_modes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Modo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {cells_without_mode.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Modo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Modo</CardTitle>
          <CardDescription>
            Quantidade de células em cada modo estratégico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statistics.modes_distribution).map(([mode, count]) => (
              <div
                key={mode}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedMode === mode ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMode(selectedMode === mode ? null : mode as CellMode)}
              >
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: MODE_COLORS[mode as CellMode] }}
                  >
                    {count}
                  </div>
                  <ModeBadge mode={mode as CellMode} showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Células sem Modo Ativo */}
      {cells_without_mode.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Células sem Modo Ativo
            </CardTitle>
            <CardDescription>
              Células que precisam definir um modo estratégico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cells_without_mode.map((cell) => {
                const rec = recommendations.find(r => r.cell_id === cell.id)
                return (
                  <div key={cell.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{cell.name}</h4>
                      <p className="text-sm text-gray-600">
                        Líder: {cell.profiles?.full_name || 'Não definido'}
                      </p>
                      {rec && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Recomendado: {rec.recommended_mode}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                        </div>
                      )}
                    </div>
                    <ModeSelector
                      cellId={cell.id}
                      churchId={churchId}
                      onModeActivated={() => fetchDashboard(supervisorId, selectedMode || undefined)}
                      trigger={
                        <Button variant="outline" size="sm">
                          Definir Modo
                        </Button>
                      }
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Células com Modos */}
      <Card>
        <CardHeader>
          <CardTitle>Células e seus Modos</CardTitle>
          <CardDescription>
            Status atual dos modos estratégicos por célula
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cells.map((cell) => (
              <CellModeCard 
                key={cell.cell_id} 
                cell={cell}
                churchId={churchId}
                onModeUpdated={() => fetchDashboard(supervisorId, selectedMode || undefined)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CellModeCardProps {
  cell: CellModeDashboardItem
  churchId: string
  onModeUpdated: () => void
}

function CellModeCard({ cell, churchId, onModeUpdated }: CellModeCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{cell.cell_name}</h4>
          <p className="text-sm text-gray-600">
            Líder: {cell.leader_name || 'Não definido'} • 
            Membros: {cell.member_count}
          </p>
        </div>
        
        {cell.current_mode ? (
          <ModeBadge 
            mode={cell.current_mode} 
            status={cell.status as any}
          />
        ) : (
          <ModeSelector
            cellId={cell.cell_id}
            churchId={churchId}
            onModeActivated={onModeUpdated}
            trigger={
              <Button variant="outline" size="sm">
                Definir Modo
              </Button>
            }
          />
        )}
      </div>

      {cell.current_mode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso do Modo</span>
            <span>{cell.progress_percentage}%</span>
          </div>
          <Progress value={cell.progress_percentage} className="h-2" />
          
          {cell.days_remaining !== null && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {cell.days_remaining > 0 
                  ? `${cell.days_remaining} dias restantes`
                  : cell.days_remaining === 0
                  ? 'Termina hoje'
                  : `Expirado há ${Math.abs(cell.days_remaining)} dias`
                }
              </span>
            </div>
          )}

          {cell.goal_description && (
            <p className="text-sm text-gray-600 italic">
              &quot;{cell.goal_description}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  )
}