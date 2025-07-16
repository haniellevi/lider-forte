'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  TrendingUp, 
  GraduationCap, 
  MapPin, 
  Settings,
  CheckCircle,
  Star,
  BarChart3
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  template_type: 'balanced' | 'growth_focused' | 'leadership_dev' | 'geographic' | 'custom'
  member_split_strategy: any
  leader_selection_criteria: any
  default_new_cell_settings: any
  success_rate: number
  times_used: number
  created_by_profile?: {
    full_name: string
  }
}

interface TemplateSelectionStepProps {
  selectedTemplate: Template | null
  onSelect: (template: Template) => void
}

const templateIcons = {
  balanced: Users,
  growth_focused: TrendingUp,
  leadership_dev: GraduationCap,
  geographic: MapPin,
  custom: Settings
}

const templateColors = {
  balanced: 'bg-blue-50 border-blue-200 text-blue-900',
  growth_focused: 'bg-green-50 border-green-200 text-green-900',
  leadership_dev: 'bg-purple-50 border-purple-200 text-purple-900',
  geographic: 'bg-orange-50 border-orange-200 text-orange-900',
  custom: 'bg-gray-50 border-gray-200 text-gray-900'
}

export function TemplateSelectionStep({ selectedTemplate, onSelect }: TemplateSelectionStepProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/protected/multiplication/templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const getTemplateDetails = (template: Template) => {
    const strategy = template.member_split_strategy
    const criteria = template.leader_selection_criteria

    switch (template.template_type) {
      case 'balanced':
        return {
          features: [
            'Divisão equilibrada (50/50)',
            'Preserva famílias juntas',
            'Mantém equilíbrio de idades',
            'Mantém membros centrais'
          ],
          bestFor: 'Células estáveis que querem crescer gradualmente'
        }
      case 'growth_focused':
        return {
          features: [
            'Foco em potencial evangelístico',
            'Novos convertidos ficam na célula original',
            'Membros experientes para nova célula',
            'Modo inicial: GANHAR'
          ],
          bestFor: 'Células com forte foco evangelístico'
        }
      case 'leadership_dev':
        return {
          features: [
            'Desenvolvimento de novos líderes',
            '70% dos Timóteos para nova célula',
            'Pares de mentoria',
            'Modo inicial: DISCIPULAR'
          ],
          bestFor: 'Células com muitos líderes em desenvolvimento'
        }
      case 'geographic':
        return {
          features: [
            'Divisão por proximidade geográfica',
            'Facilita participação',
            'Reduz tempo de deslocamento',
            'Foco comunitário'
          ],
          bestFor: 'Células geograficamente dispersas'
        }
      default:
        return {
          features: ['Template personalizado'],
          bestFor: 'Necessidades específicas'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Escolha a Estratégia de Multiplicação</h3>
        <p className="text-muted-foreground">
          Selecione o template que melhor se adequa aos objetivos da sua célula
        </p>
      </div>

      <RadioGroup
        value={selectedTemplate?.id || ''}
        onValueChange={(value) => {
          const template = templates.find(t => t.id === value)
          if (template) onSelect(template)
        }}
      >
        <div className="grid gap-4">
          {templates.map((template) => {
            const Icon = templateIcons[template.template_type]
            const details = getTemplateDetails(template)
            const isSelected = selectedTemplate?.id === template.id

            return (
              <div key={template.id}>
                <Label htmlFor={template.id} className="cursor-pointer">
                  <Card className={`transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary shadow-md' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={template.id} id={template.id} />
                          <div className={`p-2 rounded-lg ${templateColors[template.template_type]}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{template.success_rate}% sucesso</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>{template.times_used} vezes usado</span>
                        </div>
                        {template.created_by_profile && (
                          <span>por {template.created_by_profile.full_name}</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Características:</h4>
                          <ul className="space-y-1">
                            {details.features.map((feature, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Melhor para:</h4>
                          <p className="text-sm text-muted-foreground">{details.bestFor}</p>
                          
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {template.template_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>

      {selectedTemplate && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Template Selecionado</h4>
                <p className="text-sm text-green-800 mt-1">
                  <strong>{selectedTemplate.name}</strong> - {selectedTemplate.description}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Este template irá gerar automaticamente sugestões para a distribuição de membros 
                  no próximo passo, baseado na estratégia &quot;{selectedTemplate.template_type}&quot;.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="h-8 w-8 text-amber-600 mx-auto mb-3" />
              <h4 className="font-medium text-amber-900 mb-2">Nenhum Template Disponível</h4>
              <p className="text-sm text-amber-800">
                Não há templates de multiplicação configurados para sua igreja. 
                Entre em contato com a administração para criar templates personalizados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}