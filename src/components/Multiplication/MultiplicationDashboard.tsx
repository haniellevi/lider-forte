"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { MultiplicationReadinessCard } from "./MultiplicationReadinessCard";
import { MultiplicationAlertsPanel } from "./MultiplicationAlertsPanel";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target
} from "lucide-react";

interface MultiplicationDashboardData {
  total_cells: number;
  ready_cells: number;
  preparing_cells: number;
  not_ready_cells: number;
  average_readiness_score: number;
  cells_details: Array<{
    cell_id: string;
    cell_name: string;
    leader_name: string;
    readiness_score: number;
    status: 'not_ready' | 'preparing' | 'ready' | 'optimal' | 'overdue';
    projected_date: string | null;
    member_count: number;
    last_evaluated: string;
  }>;
  alerts: Array<{
    cell_id: string;
    cell_name: string;
    alert_type: string;
    message: string;
    priority: number;
  }>;
  status_distribution: {
    not_ready: number;
    preparing: number;
    ready: number;
    optimal: number;
    overdue: number;
  };
  last_updated: string;
}

interface MultiplicationDashboardProps {
  churchId?: string;
  refreshInterval?: number;
}

export function MultiplicationDashboard({ 
  churchId, 
  refreshInterval = 300000 // 5 minutos 
}: MultiplicationDashboardProps) {
  const [data, setData] = useState<MultiplicationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams();
      if (churchId) {
        params.append('church_id', churchId);
      }

      const response = await fetch(`/api/protected/multiplication/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Setup refresh interval
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [churchId, refreshInterval]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Erro ao carregar dashboard
          </h3>
        </div>
        <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      </div>
    );
  }

  // Calcular tendência (exemplo simples)
  const readyPercentage = data.total_cells > 0 ? (data.ready_cells / data.total_cells) * 100 : 0;
  const optimalCells = data.status_distribution.optimal || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Células"
          value={data.total_cells}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        
        <StatsCard
          title="Prontas para Multiplicar"
          value={data.ready_cells + optimalCells}
          icon={<CheckCircle className="h-5 w-5" />}
          trend={{
            value: readyPercentage,
            isPositive: readyPercentage > 25,
            label: `${readyPercentage.toFixed(1)}% do total`
          }}
          color="green"
        />
        
        <StatsCard
          title="Em Preparação"
          value={data.preparing_cells}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
        
        <StatsCard
          title="Score Médio"
          value={`${data.average_readiness_score.toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          trend={{
            value: data.average_readiness_score - 60, // Assume 60% como baseline
            isPositive: data.average_readiness_score > 60,
            label: data.average_readiness_score > 60 ? "Acima da média" : "Abaixo da média"
          }}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cells Readiness Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Prontidão das Células
            </h2>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.cells_details.map((cell) => (
              <MultiplicationReadinessCard
                key={cell.cell_id}
                cellId={cell.cell_id}
                cellName={cell.cell_name}
                leaderName={cell.leader_name}
                readinessScore={cell.readiness_score}
                status={cell.status}
                memberCount={cell.member_count}
                projectedDate={cell.projected_date}
                lastEvaluated={cell.last_evaluated}
              />
            ))}
          </div>
          
          {data.cells_details.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma célula encontrada
              </p>
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div>
          <MultiplicationAlertsPanel alerts={data.alerts} />
        </div>
      </div>

      {/* Status Distribution Chart */}
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribuição por Status
        </h3>
        
        <div className="space-y-3">
          {Object.entries(data.status_distribution).map(([status, count]) => {
            const percentage = data.total_cells > 0 ? (count / data.total_cells) * 100 : 0;
            const statusConfig = getStatusConfig(status as any);
            
            return (
              <div key={status} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {statusConfig.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${statusConfig.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Última atualização: {new Date(data.last_updated).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'optimal':
      return { label: 'Ótima', color: 'bg-emerald-500' };
    case 'ready':
      return { label: 'Pronta', color: 'bg-green-500' };
    case 'preparing':
      return { label: 'Preparando', color: 'bg-yellow-500' };
    case 'overdue':
      return { label: 'Atrasada', color: 'bg-red-500' };
    default:
      return { label: 'Não Pronta', color: 'bg-gray-500' };
  }
}