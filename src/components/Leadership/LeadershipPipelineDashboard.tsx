'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { 
  useLeadershipPipeline, 
  useRecalculateLeadershipPipeline,
  getLeadershipLevelColor,
  getLeadershipLevelLabel,
  type LeadershipLevel
} from '@/hooks/queries/useLeadershipPipeline';
import { RefreshCw, Users, TrendingUp, Award, Filter } from 'lucide-react';

interface LeadershipPipelineDashboardProps {
  onMemberSelect?: (memberId: string) => void;
}

export default function LeadershipPipelineDashboard({ onMemberSelect }: LeadershipPipelineDashboardProps) {
  const [filters, setFilters] = useState({
    potential_level: undefined as LeadershipLevel | undefined,
    min_score: 0,
    limit: 50
  });

  const { data, isLoading, error, refetch } = useLeadershipPipeline(filters);
  const recalculateMutation = useRecalculateLeadershipPipeline();

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync();
      refetch();
    } catch (error) {
      console.error('Error recalculating pipeline:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="w-8 h-8" />
        <span className="ml-2">Carregando pipeline de liderança...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <span>Erro ao carregar pipeline de liderança: {error.message}</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potenciais Líderes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.summary.by_level?.leader_potential || 0) + 
               (data?.summary.by_level?.leader_ready || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisores Potenciais</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.by_level?.supervisor_potential || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timóteos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.by_level?.timoteo || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Ações
            </CardTitle>
            <Button
              onClick={handleRecalculate}
              disabled={recalculateMutation.isPending}
              variant="outline"
              size="sm"
            >
              {recalculateMutation.isPending ? (
                <Spinner className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Recalcular Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Nível Mínimo</label>
              <select
                value={filters.potential_level || ''}
                onChange={(e) => handleFilterChange('potential_level', e.target.value || undefined)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Todos os níveis</option>
                <option value="timoteo">Timóteo</option>
                <option value="leader_potential">Potencial Líder</option>
                <option value="leader_ready">Pronto para Liderança</option>
                <option value="supervisor_potential">Potencial Supervisor</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Score Mínimo</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.min_score}
                onChange={(e) => handleFilterChange('min_score', Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm w-24"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Limite</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value={25}>25 resultados</option>
                <option value={50}>50 resultados</option>
                <option value={100}>100 resultados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Liderança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Membro</th>
                  <th className="text-left p-3">Célula</th>
                  <th className="text-left p-3">Score de Liderança</th>
                  <th className="text-left p-3">Nível Potencial</th>
                  <th className="text-left p-3">Confiança</th>
                  <th className="text-left p-3">Avaliações</th>
                  <th className="text-left p-3">Última Atualização</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.pipeline.map((member) => (
                  <tr key={member.profile_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        {member.profiles.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt={member.profiles.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.profiles.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{member.profiles.full_name}</div>
                          <div className="text-sm text-gray-500 capitalize">{member.profiles.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {member.cell?.name || 'Sem célula'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(member.leadership_score, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {member.leadership_score.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getLeadershipLevelColor(member.potential_level)}>
                        {getLeadershipLevelLabel(member.potential_level)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {member.confidence_score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {member.assessment_count}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-500">
                        {new Date(member.last_calculated_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button
                        onClick={() => onMemberSelect?.(member.profile_id)}
                        variant="outline"
                        size="sm"
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.pipeline.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum membro encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations Summary */}
      {data?.pipeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">Prontos para Liderança</h4>
                <p className="text-sm text-gray-600">
                  {data.pipeline.filter(m => m.potential_level === 'leader_ready').length} membros
                </p>
                <p className="text-xs text-gray-500">
                  Considere oferecer treinamento formal de liderança e oportunidades de prática.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-700">Em Desenvolvimento</h4>
                <p className="text-sm text-gray-600">
                  {data.pipeline.filter(m => 
                    m.potential_level === 'leader_potential' || m.potential_level === 'timoteo'
                  ).length} membros
                </p>
                <p className="text-xs text-gray-500">
                  Foque em mentoria individual e desenvolvimento de habilidades específicas.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700">Potenciais Supervisores</h4>
                <p className="text-sm text-gray-600">
                  {data.pipeline.filter(m => m.potential_level === 'supervisor_potential').length} membros
                </p>
                <p className="text-xs text-gray-500">
                  Prepare para responsabilidades de supervisão e multiplicação de células.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}