'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, 
  User, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  Calendar,
  MessageCircle,
  AlertTriangle,
  Award
} from 'lucide-react'

interface PotentialLeader {
  member_id: string
  assignment_type: string
  member?: {
    id: string
    full_name: string
    age: number
  }
  priority_score?: number
  notes?: string
}

interface LeaderProfile {
  id: string
  full_name: string
  leadership_score: number
  ladder_score: number
  is_timoteo: boolean
  months_in_cell: number
  potential_level: string
  leadership_experience: boolean
  total_multiplications: number
}

interface LeaderSelectionStepProps {
  processId: string
  selectedLeader: string
  onLeaderSelect: (leaderId: string) => void
  potentialLeaders: PotentialLeader[]
}

export function LeaderSelectionStep({
  processId,
  selectedLeader,
  onLeaderSelect,
  potentialLeaders
}: LeaderSelectionStepProps) {
  const [leaderProfiles, setLeaderProfiles] = useState<LeaderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [leaderNotes, setLeaderNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchLeaderProfiles = async () => {
      try {
        // Buscar dados detalhados dos potenciais líderes
        const memberIds = potentialLeaders.map(pl => pl.member?.id).filter(Boolean)
        
        if (memberIds.length === 0) {
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/protected/leadership-pipeline/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_ids: memberIds })
        })

        if (response.ok) {
          const data = await response.json()
          setLeaderProfiles(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching leader profiles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderProfiles()
  }, [potentialLeaders])

  const getLeaderScore = (profile: LeaderProfile) => {
    let score = 0
    
    // Score base da liderança
    score += profile.leadership_score * 0.4
    
    // Score da escada do sucesso
    score += (profile.ladder_score / 10) * 0.2
    
    // Bônus Timóteo
    if (profile.is_timoteo) score += 20
    
    // Experiência na célula
    score += Math.min(profile.months_in_cell * 0.5, 20)
    
    // Experiência em multiplicações
    score += profile.total_multiplications * 5
    
    return Math.round(score)
  }

  const getRecommendationLevel = (score: number) => {
    if (score >= 85) return { level: 'Excelente', color: 'text-green-600', bg: 'bg-green-50' }
    if (score >= 70) return { level: 'Muito Bom', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (score >= 55) return { level: 'Bom', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { level: 'Precisa Desenvolvimento', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const getExperienceDetails = (profile: LeaderProfile) => {
    const details = []
    
    if (profile.is_timoteo) {
      details.push('Timóteo ativo no ministério')
    }
    
    if (profile.leadership_experience) {
      details.push('Experiência prévia em liderança')
    }
    
    if (profile.total_multiplications > 0) {
      details.push(`${profile.total_multiplications} multiplicação(ões) anteriores`)
    }
    
    if (profile.months_in_cell >= 12) {
      details.push(`${Math.round(profile.months_in_cell)} meses na célula`)
    }
    
    return details
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (potentialLeaders.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="font-medium text-amber-900 mb-2">
            Nenhum Candidato a Líder Identificado
          </h3>
          <p className="text-amber-800 mb-4">
            Não foram encontrados membros elegíveis para liderar a nova célula. 
            Você pode voltar ao passo anterior e ajustar a distribuição de membros.
          </p>
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-2">Sugestões:</p>
            <ul className="text-left space-y-1">
              <li>• Selecione Timóteos para a nova célula</li>
              <li>• Inclua membros com pontuação de liderança alta</li>
              <li>• Considere membros com experiência ministerial</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Seleção do Novo Líder</h3>
        <p className="text-muted-foreground">
          Escolha quem liderará a nova célula entre os candidatos qualificados
        </p>
      </div>

      <RadioGroup
        value={selectedLeader}
        onValueChange={onLeaderSelect}
      >
        <div className="space-y-4">
          {potentialLeaders.map((candidate) => {
            const profile = leaderProfiles.find(p => p.id === candidate.member?.id)
            const score = profile ? getLeaderScore(profile) : 0
            const recommendation = getRecommendationLevel(score)
            const experienceDetails = profile ? getExperienceDetails(profile) : []
            const isSelected = selectedLeader === candidate.member?.id

            return (
              <div key={candidate.member?.id}>
                <Label 
                  htmlFor={candidate.member?.id} 
                  className="cursor-pointer"
                >
                  <Card className={`transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary shadow-md' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem 
                            value={candidate.member?.id || ''} 
                            id={candidate.member?.id} 
                          />
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Crown className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {candidate.member?.full_name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={`${recommendation.bg} ${recommendation.color} border-0`}
                              >
                                {recommendation.level}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Score: {score}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>

                    {profile && (
                      <CardContent className="pt-0">
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Métricas de Liderança */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Métricas de Liderança</h4>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3" />
                                  Score de Liderança
                                </span>
                                <span className="font-medium">{profile.leadership_score}/100</span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <Star className="h-3 w-3" />
                                  Escada do Sucesso
                                </span>
                                <span className="font-medium">{profile.ladder_score} pontos</span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Tempo na Célula
                                </span>
                                <span className="font-medium">
                                  {Math.round(profile.months_in_cell)} meses
                                </span>
                              </div>

                              {profile.total_multiplications > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    <Award className="h-3 w-3" />
                                    Multiplicações
                                  </span>
                                  <span className="font-medium">{profile.total_multiplications}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Experiência e Qualificações */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Qualificações</h4>
                            
                            <div className="space-y-2">
                              {profile.is_timoteo && (
                                <Badge variant="secondary" className="text-xs">
                                  ✓ Timóteo Ativo
                                </Badge>
                              )}
                              
                              {profile.potential_level && (
                                <Badge variant="outline" className="text-xs">
                                  Potencial: {profile.potential_level}
                                </Badge>
                              )}
                            </div>

                            {experienceDetails.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1">Experiência:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {experienceDetails.map((detail, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-primary rounded-full" />
                                      {detail}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Observações */}
                        {candidate.notes && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-start gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Observação do Sistema:</p>
                                <p className="text-sm text-muted-foreground">{candidate.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </Label>

                {/* Campo para observações adicionais */}
                {isSelected && (
                  <Card className="mt-3 border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <Label htmlFor="leader-notes" className="text-sm font-medium">
                        Observações sobre a seleção (opcional)
                      </Label>
                      <Textarea
                        id="leader-notes"
                        placeholder="Adicione observações sobre por que este líder foi escolhido..."
                        value={leaderNotes[candidate.member?.id || ''] || ''}
                        onChange={(e) => setLeaderNotes(prev => ({
                          ...prev,
                          [candidate.member?.id || '']: e.target.value
                        }))}
                        className="mt-2"
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </RadioGroup>

      {selectedLeader && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Líder Selecionado</h4>
                <p className="text-sm text-green-800 mt-1">
                  {potentialLeaders.find(pl => pl.member?.id === selectedLeader)?.member?.full_name} 
                  foi selecionado(a) para liderar a nova célula.
                </p>
                <p className="text-sm text-green-700 mt-2">
                  O próximo passo será revisar todo o plano de multiplicação antes da submissão 
                  para aprovação hierárquica.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}