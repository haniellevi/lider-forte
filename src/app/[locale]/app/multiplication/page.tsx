"use client";

import { useState } from "react";
import { 
  MultiplicationDashboard, 
  MultiplicationCriteriaManager 
} from "@/components/Multiplication";
import { 
  useMultiplicationPage, 
  useUpdateAllCellsReadiness 
} from "@/hooks/queries/useMultiplication";
import { 
  RefreshCw, 
  Settings, 
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function MultiplicationPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'criteria'>('dashboard');
  const [selectedChurchId, setSelectedChurchId] = useState<string | undefined>();
  
  const { dashboard, alerts, criteria, isLoading, error, refetchAll } = useMultiplicationPage(selectedChurchId);
  const updateAllCells = useUpdateAllCellsReadiness();

  const handleUpdateAllCells = async () => {
    try {
      await updateAllCells.mutateAsync(selectedChurchId);
      refetchAll();
    } catch (error) {
      console.error('Erro ao atualizar células:', error);
    }
  };

  const handleCriteriaChange = () => {
    refetchAll();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Erro ao carregar sistema de multiplicação
              </h3>
            </div>
            <p className="text-red-600 dark:text-red-300 mt-2">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <button
              onClick={refetchAll}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sistema de Multiplicação G12
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Avaliação automática de critérios para multiplicação de células
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpdateAllCells}
                disabled={updateAllCells.isPending}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${updateAllCells.isPending ? 'animate-spin' : ''}`} />
                <span>
                  {updateAllCells.isPending ? 'Atualizando...' : 'Atualizar Todas'}
                </span>
              </button>

              <button
                onClick={refetchAll}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recarregar</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('criteria')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'criteria'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Critérios</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {/* Loading Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <MultiplicationDashboard 
                churchId={selectedChurchId}
                refreshInterval={5 * 60 * 1000} // 5 minutos
              />
            )}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="space-y-6">
            <MultiplicationCriteriaManager
              churchId={selectedChurchId}
              onCriteriaChange={handleCriteriaChange}
            />

            {/* Criteria Summary */}
            {criteria.data && criteria.data.length > 0 && (
              <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumo dos Critérios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {criteria.data.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total de Critérios
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {criteria.data.filter(c => c.is_active).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Critérios Ativos
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {criteria.data.filter(c => c.is_required).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Critérios Obrigatórios
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Como funciona a avaliação:
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Cada critério possui um peso que define sua importância no cálculo final</li>
                    <li>• Critérios obrigatórios devem ser atendidos para que a célula seja considerada "pronta"</li>
                    <li>• O score final é calculado automaticamente baseado no desempenho de cada critério</li>
                    <li>• Células são reavaliadas automaticamente quando dados relevantes são atualizados</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}