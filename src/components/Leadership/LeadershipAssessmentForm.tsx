'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useSubmitLeadershipAssessment } from '@/hooks/queries/useLeadershipPipeline';
import { useToast } from '@/hooks/use-toast';
import { Star, User, MessageSquare, Send } from 'lucide-react';

interface LeadershipAssessmentFormProps {
  profileId: string;
  memberName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface AssessmentScores {
  leadership: number;
  communication: number;
  reliability: number;
  initiative: number;
  teamwork: number;
  spiritual_growth: number;
  service_heart: number;
  teaching_ability: number;
}

const assessmentFields = [
  {
    key: 'leadership' as keyof AssessmentScores,
    label: 'Liderança',
    description: 'Capacidade de influenciar e guiar outros de forma positiva'
  },
  {
    key: 'communication' as keyof AssessmentScores,
    label: 'Comunicação',
    description: 'Habilidade de expressar ideias claramente e ouvir ativamente'
  },
  {
    key: 'reliability' as keyof AssessmentScores,
    label: 'Confiabilidade',
    description: 'Cumprimento consistente de compromissos e responsabilidades'
  },
  {
    key: 'initiative' as keyof AssessmentScores,
    label: 'Iniciativa',
    description: 'Proatividade em identificar e resolver problemas'
  },
  {
    key: 'teamwork' as keyof AssessmentScores,
    label: 'Trabalho em Equipe',
    description: 'Colaboração efetiva e apoio aos colegas'
  },
  {
    key: 'spiritual_growth' as keyof AssessmentScores,
    label: 'Crescimento Espiritual',
    description: 'Desenvolvimento na fé e aplicação de princípios cristãos'
  },
  {
    key: 'service_heart' as keyof AssessmentScores,
    label: 'Coração de Servo',
    description: 'Disposição para servir voluntariamente sem buscar reconhecimento'
  },
  {
    key: 'teaching_ability' as keyof AssessmentScores,
    label: 'Capacidade de Ensino',
    description: 'Habilidade para transmitir conhecimento e fazer discípulos'
  }
];

export default function LeadershipAssessmentForm({
  profileId,
  memberName,
  onSuccess,
  onCancel
}: LeadershipAssessmentFormProps) {
  const [scores, setScores] = useState<AssessmentScores>({
    leadership: 5,
    communication: 5,
    reliability: 5,
    initiative: 5,
    teamwork: 5,
    spiritual_growth: 5,
    service_heart: 5,
    teaching_ability: 5
  });

  const [assessmentType, setAssessmentType] = useState<'supervisor_feedback' | 'peer_review' | 'self_assessment'>('supervisor_feedback');
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const submitMutation = useSubmitLeadershipAssessment();
  const { toast } = useToast();

  const handleScoreChange = (field: keyof AssessmentScores, value: number) => {
    setScores(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any validation errors when user starts entering data
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    // Check if all scores are valid
    Object.entries(scores).forEach(([field, score]) => {
      if (score < 1 || score > 10) {
        newErrors.push(`Score para ${field} deve estar entre 1 e 10`);
      }
    });

    // Check if comments are provided for low scores
    const lowScores = Object.entries(scores).filter(([, score]) => score <= 3);
    if (lowScores.length > 0 && !comments.trim()) {
      newErrors.push('Comentários são obrigatórios quando há avaliações baixas (≤3)');
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await submitMutation.mutateAsync({
        profile_id: profileId,
        assessment_type: assessmentType,
        scores,
        comments: comments.trim() || undefined
      });

      toast({
        title: 'Avaliação enviada com sucesso',
        description: `A avaliação de ${memberName} foi registrada.`,
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar avaliação',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const renderStarRating = (field: keyof AssessmentScores, currentScore: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleScoreChange(field, star)}
            className={`p-1 transition-colors ${
              star <= currentScore
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star
              className="w-4 h-4"
              fill={star <= currentScore ? 'currentColor' : 'none'}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700 min-w-[20px]">
          {currentScore}
        </span>
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Avaliação de Liderança - {memberName}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Avalie cada aspecto em uma escala de 1 a 10, onde 1 é muito fraco e 10 é excelente.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Assessment Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Tipo de Avaliação</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="supervisor_feedback"
                  checked={assessmentType === 'supervisor_feedback'}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm">Feedback de Supervisor</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="peer_review"
                  checked={assessmentType === 'peer_review'}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm">Avaliação de Pares</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="self_assessment"
                  checked={assessmentType === 'self_assessment'}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm">Auto-Avaliação</span>
              </label>
            </div>
          </div>

          {/* Assessment Fields */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Critérios de Avaliação</h3>
            
            <div className="grid gap-6">
              {assessmentFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">{field.label}</label>
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                  {renderStarRating(field.key, scores[field.key])}
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários e Observações
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Forneça feedback específico, pontos fortes identificados, áreas de melhoria e recomendações..."
              className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {comments.length}/1000 caracteres
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Resumo da Avaliação</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Média Geral:</span>
                <span className="ml-2 font-medium">
                  {(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Pontos Fortes:</span>
                <span className="ml-2 font-medium">
                  {Object.entries(scores).filter(([, score]) => score >= 8).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Para Melhorar:</span>
                <span className="ml-2 font-medium">
                  {Object.entries(scores).filter(([, score]) => score <= 5).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Maior Score:</span>
                <span className="ml-2 font-medium">
                  {Math.max(...Object.values(scores))}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitMutation.isPending}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-w-[120px]"
            >
              {submitMutation.isPending ? (
                <Spinner className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}