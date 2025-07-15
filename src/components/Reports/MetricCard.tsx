"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  icon?: ReactNode;
  className?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'currency' | 'percentage';
}

export function MetricCard({
  title,
  value,
  previousValue,
  change,
  changeType = 'percentage',
  icon,
  className,
  description,
  trend,
  format = 'number'
}: MetricCardProps) {
  // Calcular a mudança se não foi fornecida
  const calculatedChange = change !== undefined ? change : 
    (previousValue && typeof value === 'number' && typeof previousValue === 'number') ?
      ((value - previousValue) / previousValue) * 100 : undefined;

  // Determinar a tendência se não foi fornecida
  const calculatedTrend = trend || 
    (calculatedChange !== undefined ? 
      (calculatedChange > 0 ? 'up' : calculatedChange < 0 ? 'down' : 'stable') : 
      undefined);

  // Formatar o valor
  const formatValue = (val: string | number) => {
    if (typeof val !== 'number') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  // Formatar a mudança
  const formatChange = (changeValue: number) => {
    if (changeType === 'percentage') {
      return `${Math.abs(changeValue).toFixed(1)}%`;
    }
    return new Intl.NumberFormat('pt-BR').format(Math.abs(changeValue));
  };

  const getTrendColor = (trendType?: string) => {
    switch (trendType) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trendType?: string) => {
    switch (trendType) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      "bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(value)}
            </p>
            
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {calculatedChange !== undefined && (
          <div className={cn(
            "flex items-center space-x-1 text-sm",
            getTrendColor(calculatedTrend)
          )}>
            {getTrendIcon(calculatedTrend)}
            <span className="font-medium">
              {formatChange(calculatedChange)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}