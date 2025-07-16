'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CellMode } from '@/types/cell-modes'
import { MODE_COLORS, MODE_ICONS } from '@/types/cell-modes'

interface ModeBadgeProps {
  mode: CellMode
  status?: 'Ativo' | 'Expirado' | 'Indefinido' | 'Hoje'
  showIcon?: boolean
  className?: string
}

export function ModeBadge({ 
  mode, 
  status = 'Ativo',
  showIcon = true,
  className 
}: ModeBadgeProps) {
  const color = MODE_COLORS[mode]
  const icon = MODE_ICONS[mode]
  
  const statusColors = {
    'Ativo': 'bg-green-100 text-green-800 border-green-200',
    'Expirado': 'bg-red-100 text-red-800 border-red-200', 
    'Indefinido': 'bg-gray-100 text-gray-800 border-gray-200',
    'Hoje': 'bg-orange-100 text-orange-800 border-orange-200'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        style={{ 
          backgroundColor: `${color}15`,
          borderColor: color,
          color: color
        }}
        className="font-medium"
      >
        {showIcon && <span className="mr-1">{icon}</span>}
        {mode}
      </Badge>
      
      {status !== 'Ativo' && (
        <Badge variant="outline" className={statusColors[status]}>
          {status}
        </Badge>
      )}
    </div>
  )
}