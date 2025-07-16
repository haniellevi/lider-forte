"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Settings,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface MultiplicationCriteria {
  id: string;
  name: string;
  description: string | null;
  criteria_type: string;
  threshold_value: number;
  weight: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MultiplicationCriteriaManagerProps {
  churchId?: string;
  onCriteriaChange?: () => void;
}

const CRITERIA_TYPES = [
  { value: 'member_count', label: 'Número de Membros' },
  { value: 'meeting_frequency', label: 'Frequência de Reuniões (%)' },
  { value: 'average_attendance', label: 'Presença Média (%)' },
  { value: 'potential_leaders', label: 'Líderes em Potencial' },
  { value: 'cell_age_months', label: 'Idade da Célula (meses)' },
  { value: 'leader_maturity', label: 'Maturidade do Líder (pontos)' },
  { value: 'growth_rate', label: 'Taxa de Crescimento (%)' },
  { value: 'stability_score', label: 'Score de Estabilidade' }
];

export function MultiplicationCriteriaManager({ 
  churchId, 
  onCriteriaChange 
}: MultiplicationCriteriaManagerProps) {
  const [criteria, setCriteria] = useState<MultiplicationCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria_type: '',
    threshold_value: 0,
    weight: 0.1,
    is_required: true,
    is_active: true
  });

  const fetchCriteria = async () => {
    try {
      const params = new URLSearchParams();
      if (churchId) {
        params.append('church_id', churchId);
      }

      const response = await fetch(`/api/protected/multiplication/criteria?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar critérios');
      }

      const result = await response.json();
      setCriteria(result.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const saveCriteria = async (data: any, isEdit = false) => {
    try {
      const url = '/api/protected/multiplication/criteria';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar critério');
      }

      await fetchCriteria();
      onCriteriaChange?.();
      setEditingId(null);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const deleteCriteria = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este critério?')) {
      return;
    }

    try {
      const response = await fetch(`/api/protected/multiplication/criteria?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir critério');
      }

      await fetchCriteria();
      onCriteriaChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria_type: '',
      threshold_value: 0,
      weight: 0.1,
      is_required: true,
      is_active: true
    });
  };

  const startEdit = (criteria: MultiplicationCriteria) => {
    setFormData({
      name: criteria.name,
      description: criteria.description || '',
      criteria_type: criteria.criteria_type,
      threshold_value: criteria.threshold_value,
      weight: criteria.weight,
      is_required: criteria.is_required,
      is_active: criteria.is_active
    });
    setEditingId(criteria.id);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      saveCriteria({ id: editingId, ...formData }, true);
    } else {
      saveCriteria(formData);
    }
  };

  const getTotalWeight = () => {
    return criteria
      .filter(c => c.is_active)
      .reduce((sum, c) => sum + c.weight, 0);
  };

  useEffect(() => {
    fetchCriteria();
  }, [churchId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isWeightValid = getTotalWeight() <= 1.0;

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
      {/* Header */}
      <div className="p-6 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Critérios de Multiplicação
            </h2>
          </div>
          
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Critério</span>
          </button>
        </div>

        {/* Weight Warning */}
        <div className="mt-4">
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            isWeightValid 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            {isWeightValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">
              Peso total dos critérios: {getTotalWeight().toFixed(2)} / 1.00
              {!isWeightValid && ' - Atenção: peso total excede 1.0'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="p-6 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Critério
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Critério
                </label>
                <select
                  value={formData.criteria_type}
                  onChange={(e) => setFormData({ ...formData, criteria_type: e.target.value })}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark"
                  required
                >
                  <option value="">Selecione um tipo</option>
                  {CRITERIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Limite
                </label>
                <input
                  type="number"
                  value={formData.threshold_value}
                  onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso (0.01 - 1.00)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark"
                  step="0.01"
                  min="0.01"
                  max="1.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded border-stroke"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Obrigatório</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-stroke"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ativo</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{editingId ? 'Atualizar' : 'Salvar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Criteria List */}
      <div className="divide-y divide-stroke dark:divide-strokedark">
        {criteria.length === 0 ? (
          <div className="p-6 text-center">
            <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum critério configurado
            </p>
          </div>
        ) : (
          criteria.map((criterion) => (
            <div key={criterion.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {criterion.name}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      {criterion.is_required && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          Obrigatório
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        criterion.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {criterion.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Tipo:</span> {
                        CRITERIA_TYPES.find(t => t.value === criterion.criteria_type)?.label || criterion.criteria_type
                      }
                    </div>
                    <div>
                      <span className="font-medium">Limite:</span> {criterion.threshold_value}
                    </div>
                    <div>
                      <span className="font-medium">Peso:</span> {(criterion.weight * 100).toFixed(1)}%
                    </div>
                  </div>

                  {criterion.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {criterion.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(criterion)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Editar critério"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => deleteCriteria(criterion.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir critério"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}