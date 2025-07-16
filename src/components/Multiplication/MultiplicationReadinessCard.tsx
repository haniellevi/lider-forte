"use client";

import { useState } from "react";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  RefreshCw
} from "lucide-react";

interface MultiplicationReadinessCardProps {
  cellId: string;
  cellName: string;
  leaderName: string;
  readinessScore: number;
  status: 'not_ready' | 'preparing' | 'ready' | 'optimal' | 'overdue';
  memberCount: number;
  projectedDate: string | null;
  lastEvaluated: string;
  onEvaluate?: (cellId: string) => void;
  showDetails?: boolean;
}

export function MultiplicationReadinessCard({
  cellId,
  cellName,
  leaderName,
  readinessScore,
  status,
  memberCount,
  projectedDate,
  lastEvaluated,
  onEvaluate,
  showDetails = true
}: MultiplicationReadinessCardProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'optimal':
        return {
          label: 'Ótima',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-700',
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      case 'ready':
        return {
          label: 'Pronta',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      case 'preparing':
        return {
          label: 'Preparando',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-700',
          icon: <Clock className="h-4 w-4" />
        };
      case 'overdue':
        return {
          label: 'Atrasada',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-700',
          icon: <AlertCircle className="h-4 w-4" />
        };
      default:
        return {
          label: 'Não Pronta',
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-700',
          icon: <AlertCircle className="h-4 w-4" />
        };
    }
  };

  const handleEvaluate = async () => {
    if (isEvaluating) return;
    
    setIsEvaluating(true);
    try {
      if (onEvaluate) {
        onEvaluate(cellId);
      } else {
        // Default evaluation call
        const response = await fetch(`/api/protected/multiplication/evaluate/${cellId}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          // Trigger a page refresh or emit an event to refresh the dashboard
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Erro ao reavaliar célula:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const statusConfig = getStatusConfig();
  const lastEvaluatedDate = new Date(lastEvaluated);
  const isStale = Date.now() - lastEvaluatedDate.getTime() > 24 * 60 * 60 * 1000; // 24 horas

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border ${statusConfig.borderColor} p-4 hover:shadow-md transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {cellName}
            </h3>
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.textColor} ${statusConfig.bgColor}`}>
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Líder: {leaderName}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Reavaliar célula"
          >
            <RefreshCw className={`h-4 w-4 ${isEvaluating ? 'animate-spin' : ''}`} />
          </button>
          
          {showDetails && (
            <button
              onClick={() => window.open(`/app/cells/${cellId}`, '_blank')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Ver detalhes"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prontidão
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {readinessScore.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${statusConfig.color}`}
            style={{ width: `${Math.min(readinessScore, 100)}%` }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {memberCount} membros
          </span>
        </div>
        
        {projectedDate && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(projectedDate).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status === 'ready' || status === 'optimal' ? (
        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {status === 'optimal' ? 'Momento ideal para multiplicar!' : 'Pronta para multiplicação'}
          </span>
        </div>
      ) : status === 'overdue' ? (
        <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">
            Multiplicação atrasada - necessita atenção
          </span>
        </div>
      ) : null}

      {/* Last Evaluated Warning */}
      {isStale && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          <span>
            Última avaliação: {lastEvaluatedDate.toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  );
}