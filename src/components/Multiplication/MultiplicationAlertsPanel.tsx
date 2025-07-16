"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  UserX,
  Bell,
  X,
  ExternalLink,
  Filter
} from "lucide-react";

interface Alert {
  cell_id: string;
  cell_name: string;
  alert_type: 'ready_for_multiplication' | 'slow_growth' | 'missing_leader' | 'low_attendance';
  message: string;
  priority: number;
  cell_info?: {
    id: string;
    name: string;
    leader?: {
      full_name: string;
    };
  };
  readiness_info?: {
    readiness_score: number;
    status: string;
  };
  created_at: string;
}

interface MultiplicationAlertsPanelProps {
  alerts: Alert[];
  maxVisible?: number;
  showFilter?: boolean;
}

export function MultiplicationAlertsPanel({ 
  alerts, 
  maxVisible = 10,
  showFilter = true 
}: MultiplicationAlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getAlertConfig = (type: string, priority: number) => {
    const baseConfig = {
      ready_for_multiplication: {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-700',
        title: 'Pronta para Multiplicação'
      },
      slow_growth: {
        icon: <TrendingDown className="h-5 w-5" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-700',
        title: 'Crescimento Lento'
      },
      missing_leader: {
        icon: <UserX className="h-5 w-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-700',
        title: 'Líder em Falta'
      },
      low_attendance: {
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-700',
        title: 'Baixa Frequência'
      }
    };

    const config = baseConfig[type as keyof typeof baseConfig] || baseConfig.slow_growth;
    
    // Adjust colors based on priority
    if (priority === 1) {
      config.color = config.color.replace('600', '700');
      config.bgColor = config.bgColor.replace('50', '100').replace('900/20', '900/30');
    }

    return config;
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { label: 'Alta', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' };
      case 2: return { label: 'Média', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' };
      default: return { label: 'Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
    }
  };

  const dismissAlert = (alertKey: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertKey]));
  };

  const getAlertKey = (alert: Alert) => `${alert.cell_id}-${alert.alert_type}`;

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (dismissedAlerts.has(getAlertKey(alert))) return false;
    
    if (filterType !== 'all' && alert.alert_type !== filterType) return false;
    if (filterPriority !== 'all' && alert.priority.toString() !== filterPriority) return false;
    
    return true;
  });

  const visibleAlerts = filteredAlerts.slice(0, maxVisible);
  const hasMoreAlerts = filteredAlerts.length > maxVisible;

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
      {/* Header */}
      <div className="p-4 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas
            </h3>
            {filteredAlerts.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {filteredAlerts.length}
              </span>
            )}
          </div>
          
          {showFilter && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilter && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-stroke dark:border-strokedark rounded px-2 py-1 bg-white dark:bg-boxdark"
              >
                <option value="all">Todos os tipos</option>
                <option value="ready_for_multiplication">Prontas</option>
                <option value="slow_growth">Crescimento lento</option>
                <option value="low_attendance">Baixa frequência</option>
                <option value="missing_leader">Sem líder</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs border border-stroke dark:border-strokedark rounded px-2 py-1 bg-white dark:bg-boxdark"
              >
                <option value="all">Todas prioridades</option>
                <option value="1">Alta prioridade</option>
                <option value="2">Média prioridade</option>
                <option value="3">Baixa prioridade</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-stroke dark:divide-strokedark max-h-96 overflow-y-auto">
        {visibleAlerts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum alerta no momento
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const alertConfig = getAlertConfig(alert.alert_type, alert.priority);
            const priorityConfig = getPriorityLabel(alert.priority);
            const alertKey = getAlertKey(alert);

            return (
              <div
                key={alertKey}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${alertConfig.bgColor} border-l-4 ${alertConfig.borderColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={alertConfig.color}>
                        {alertConfig.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {alertConfig.title}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Célula: {alert.cell_name}
                      </span>
                      
                      {alert.readiness_info && (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Score: {alert.readiness_info.readiness_score.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    <button
                      onClick={() => window.open(`/app/cells/${alert.cell_id}`, '_blank')}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Ver célula"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => dismissAlert(alertKey)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Dispensar alerta"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {hasMoreAlerts && (
        <div className="p-3 border-t border-stroke dark:border-strokedark text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {visibleAlerts.length} de {filteredAlerts.length} alertas
          </p>
        </div>
      )}
    </div>
  );
}