"use client";

import { useDashboard } from '@/hooks/queries/useReports';
import { MetricCard } from './MetricCard';
import { LineChart, BarChart, PieChart } from './Charts';
import { 
  Users, 
  Building, 
  UserCheck, 
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export function DashboardOverview() {
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          Erro ao carregar dados do dashboard
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Nenhum dado disponível
        </p>
      </div>
    );
  }

  // Preparar dados para gráficos
  const growthChartData = dashboard.growth_trends.find(
    trend => trend.metric_type === 'member_count'
  )?.periods || [];

  const roleDistribution = [
    { name: 'Pastores', value: dashboard.church_stats.total_supervisors },
    { name: 'Líderes', value: dashboard.church_stats.total_leaders },
    { name: 'Membros', value: dashboard.church_stats.total_members - dashboard.church_stats.total_leaders - dashboard.church_stats.total_supervisors },
  ].filter(item => item.value > 0);

  const topCellsData = dashboard.top_performing_cells.slice(0, 5).map(cell => ({
    name: cell.cell_name.length > 15 ? cell.cell_name.substring(0, 15) + '...' : cell.cell_name,
    members: cell.member_count,
    timoteos: cell.timoteo_count,
  }));

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Membros"
          value={dashboard.church_stats.total_members}
          change={dashboard.church_stats.new_members_30d}
          changeType="absolute"
          icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          description={`+${dashboard.church_stats.new_members_30d} novos membros`}
        />
        
        <MetricCard
          title="Total de Células"
          value={dashboard.church_stats.total_cells}
          change={dashboard.church_stats.new_cells_30d}
          changeType="absolute"
          icon={<Building className="h-5 w-5 text-green-600 dark:text-green-400" />}
          description={`+${dashboard.church_stats.new_cells_30d} novas células`}
        />
        
        <MetricCard
          title="Líderes Ativos"
          value={dashboard.church_stats.total_leaders}
          icon={<UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          description="Líderes de células"
        />
        
        <MetricCard
          title="Média por Célula"
          value={Math.round(dashboard.church_stats.avg_members_per_cell || 0)}
          icon={<Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          description="Membros por célula"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Crescimento */}
        <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crescimento de Membros
          </h3>
          {growthChartData.length > 0 ? (
            <LineChart
              data={growthChartData}
              xAxisKey="period"
              lines={[
                {
                  dataKey: "value",
                  color: "#3b82f6",
                  name: "Membros"
                }
              ]}
              height={300}
              formatTooltip={(value, name) => [
                new Intl.NumberFormat('pt-BR').format(Number(value)),
                'Membros'
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Dados insuficientes para exibir o gráfico
            </div>
          )}
        </div>

        {/* Distribuição de Papéis */}
        <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição de Papéis
          </h3>
          {roleDistribution.length > 0 ? (
            <PieChart
              data={roleDistribution}
              height={300}
              innerRadius={60}
              formatTooltip={(value, name) => [
                new Intl.NumberFormat('pt-BR').format(Number(value)),
                name
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      {/* Top Células e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Células */}
        <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Células com Melhor Performance
          </h3>
          {topCellsData.length > 0 ? (
            <BarChart
              data={topCellsData}
              xAxisKey="name"
              bars={[
                {
                  dataKey: "members",
                  color: "#10b981",
                  name: "Membros"
                },
                {
                  dataKey: "timoteos",
                  color: "#f59e0b",
                  name: "Timóteos"
                }
              ]}
              height={300}
              layout="vertical"
              formatTooltip={(value, name) => [
                new Intl.NumberFormat('pt-BR').format(Number(value)),
                name
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Nenhuma célula encontrada
            </div>
          )}
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividades Recentes
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {dashboard.recent_events.slice(0, 10).map((event, index) => (
              <div 
                key={event.id || index}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getEventDescription(event.event_type)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {dashboard.recent_events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma atividade recente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function para descrições de eventos
function getEventDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    'member_created': 'Novo membro adicionado',
    'cell_created': 'Nova célula criada',
    'member_role_changed': 'Papel de membro alterado',
    'cell_leader_changed': 'Líder de célula alterado',
  };
  
  return descriptions[eventType] || eventType;
}