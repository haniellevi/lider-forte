'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { 
  useMemberLeadershipProfile,
  useLeadershipRecommendations,
  useRecalculateMemberScore,
  getLeadershipLevelColor,
  getLeadershipLevelLabel,
  getFactorCategoryLabel
} from '@/hooks/queries/useLeadershipPipeline';
import { 
  RefreshCw, 
  TrendingUp, 
  Award, 
  Calendar,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MemberLeadershipProfileProps {
  memberId: string;
  onBack?: () => void;
}

export default function MemberLeadershipProfile({ memberId, onBack }: MemberLeadershipProfileProps) {
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  const { data: profile, isLoading: profileLoading, error: profileError } = useMemberLeadershipProfile(memberId);
  const { data: recommendations, isLoading: recLoading } = useLeadershipRecommendations(memberId);
  const recalculateMutation = useRecalculateMemberScore();

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync(memberId);
    } catch (error) {
      console.error('Error recalculating member score:', error);
    }
  };

  if (profileLoading || recLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="w-8 h-8" />
        <span className="ml-2">Carregando perfil de liderança...</span>
      </div>
    );
  }

  if (profileError) {
    return (
      <Alert variant="destructive">
        <span>Erro ao carregar perfil: {profileError.message}</span>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <span>Perfil não encontrado.</span>
      </Alert>
    );
  }

  // Preparar dados do gráfico de crescimento
  const growthData = profile.growth_trend ? Object.entries(profile.growth_trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Últimos 6 meses
    : [];

  const chartData = {
    labels: growthData.map(([month]) => {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Pontos Ganhos',
        data: growthData.map(([, points]) => points),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tendência de Crescimento (Últimos 6 Meses)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Extrair insights dos fatores
  const factors = profile.factors ? Object.entries(profile.factors).map(([name, data]: [string, any]) => ({
    name,
    score: data.score || 0,
    weight: data.weight || 0,
    weighted_score: data.weighted_score || 0,
    category: data.category || 'other',
    status: data.score >= 70 ? 'good' : data.score >= 50 ? 'moderate' : 'needs_improvement'
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              ← Voltar
            </Button>
          )}
          <div className="flex items-center space-x-3">
            {profile.member_info.avatar_url ? (
              <img
                src={profile.member_info.avatar_url}
                alt={profile.member_info.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-medium">
                  {profile.member_info.full_name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.member_info.full_name}</h1>
              <p className="text-gray-600 capitalize">{profile.member_info.role}</p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleRecalculate}
          disabled={recalculateMutation.isPending}
          variant="outline"
        >
          {recalculateMutation.isPending ? (
            <Spinner className="w-4 h-4 mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Recalcular
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Liderança</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.leadership_score.toFixed(1)}</div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${Math.min(profile.leadership_score, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Potencial</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getLeadershipLevelColor(profile.potential_level)}>
              {getLeadershipLevelLabel(profile.potential_level)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.confidence_score.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.assessment_count}</div>
            <p className="text-xs text-muted-foreground">últimos 6 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factors Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise de Fatores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {factors.map((factor) => (
                <div key={factor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{factor.score.toFixed(1)}</span>
                      {factor.status === 'good' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {factor.status === 'moderate' && <Clock className="w-4 h-4 text-yellow-500" />}
                      {factor.status === 'needs_improvement' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        factor.status === 'good' ? 'bg-green-500' :
                        factor.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(factor.score, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{getFactorCategoryLabel(factor.category)}</span>
                    <span>Peso: {(factor.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cell Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações da Célula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.cell ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Célula</label>
                    <p className="font-medium">{profile.cell.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Líder</label>
                    <p className="font-medium">{profile.cell.profiles.full_name}</p>
                  </div>
                  {profile.cell_membership && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Membro desde</label>
                        <p className="font-medium">
                          {new Date(profile.cell_membership.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Score na Escada</label>
                        <p className="font-medium">{profile.cell_membership.success_ladder_score} pontos</p>
                      </div>
                      {profile.cell_membership.is_timoteo && (
                        <Badge variant="secondary">Timóteo</Badge>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Não está em nenhuma célula</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      {growthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recomendações e Plano de Ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Recommendations */}
              <div>
                <h4 className="font-medium mb-3">Recomendações Atuais</h4>
                <ul className="space-y-2">
                  {recommendations.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plans */}
              {recommendations.action_plans && recommendations.action_plans.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Planos de Ação Específicos</h4>
                  <div className="space-y-4">
                    {recommendations.action_plans.map((plan, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{plan.factor}</h5>
                          <Badge 
                            variant={plan.priority === 'high' ? 'destructive' : 
                                   plan.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {plan.priority === 'high' ? 'Alta' :
                             plan.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Score atual: {plan.current_score.toFixed(1)} → Meta: {plan.target_score.toFixed(1)}
                        </div>
                        <ul className="space-y-1">
                          {plan.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="text-sm flex items-start space-x-2">
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-xs text-gray-500 mt-2">
                          Timeline: {plan.timeline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {recommendations.next_steps && recommendations.next_steps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Próximos Passos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.next_steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-500 mt-1">{index + 1}.</span>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Assessments */}
      {profile.recent_assessments && profile.recent_assessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.recent_assessments.slice(0, 5).map((assessment: any) => (
                <div key={assessment.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {assessment.assessment_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(assessment.assessment_date).toLocaleDateString()}
                    </span>
                  </div>
                  {assessment.profiles && (
                    <p className="text-sm text-gray-600">
                      Avaliador: {assessment.profiles.full_name}
                    </p>
                  )}
                  {assessment.comments && (
                    <p className="text-sm mt-2 italic">"{assessment.comments}"</p>
                  )}
                  {assessment.is_validated && (
                    <Badge variant="secondary" className="mt-2">Validada</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        {profile.is_calculated ? (
          <span>Dados calculados em tempo real</span>
        ) : (
          <span>
            Última atualização: {new Date(profile.last_calculated_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}