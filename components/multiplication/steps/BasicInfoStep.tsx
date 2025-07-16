'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Clock, Users } from 'lucide-react'

interface BasicInfoData {
  new_cell_name: string
  meeting_day: string
  meeting_time: string
  address: string
  city: string
  state: string
  zip_code: string
}

interface BasicInfoStepProps {
  data: BasicInfoData
  onChange: (data: BasicInfoData) => void
  cellId: string
}

const daysOfWeek = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export function BasicInfoStep({ data, onChange, cellId }: BasicInfoStepProps) {
  const [sourceCell, setSourceCell] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSourceCell = async () => {
      try {
        const response = await fetch(`/api/protected/cells/${cellId}`)
        if (response.ok) {
          const cellData = await response.json()
          setSourceCell(cellData.data)
          
          // Pré-preencher alguns campos baseados na célula original
          if (!data.city && cellData.data.city) {
            onChange({
              ...data,
              city: cellData.data.city,
              state: cellData.data.state || '',
              meeting_day: cellData.data.meeting_day || 'wednesday',
              meeting_time: cellData.data.meeting_time || '19:30'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching source cell:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSourceCell()
  }, [cellId])

  const handleChange = (field: keyof BasicInfoData, value: string) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  const generateCellName = () => {
    if (sourceCell?.name) {
      const suggestions = [
        `${sourceCell.name} - Filha`,
        `Nova ${sourceCell.name}`,
        `${sourceCell.name} 2`,
        `Célula ${sourceCell.name.split(' ')[0]} Multiplicada`
      ]
      
      const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      handleChange('new_cell_name', suggestion)
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
      {/* Informações da Célula Original */}
      {sourceCell && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Célula Original
            </CardTitle>
            <CardDescription>
              Informações da célula que será multiplicada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <p className="text-sm text-muted-foreground">{sourceCell.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Líder</Label>
                <p className="text-sm text-muted-foreground">
                  {sourceCell.leader?.full_name || 'Não definido'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Dia da Reunião</Label>
                <p className="text-sm text-muted-foreground">
                  {daysOfWeek.find(d => d.value === sourceCell.meeting_day)?.label || sourceCell.meeting_day}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Horário</Label>
                <p className="text-sm text-muted-foreground">{sourceCell.meeting_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações da Nova Célula */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nova Célula
          </CardTitle>
          <CardDescription>
            Defina as informações básicas para a nova célula
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome da Nova Célula */}
          <div className="space-y-2">
            <Label htmlFor="new_cell_name">Nome da Nova Célula *</Label>
            <div className="flex gap-2">
              <Input
                id="new_cell_name"
                placeholder="Digite o nome da nova célula"
                value={data.new_cell_name}
                onChange={(e) => handleChange('new_cell_name', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCellName}
                disabled={!sourceCell}
              >
                Sugerir
              </Button>
            </div>
          </div>

          {/* Configurações de Reunião */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_day">Dia da Reunião *</Label>
              <Select
                value={data.meeting_day}
                onValueChange={(value) => handleChange('meeting_day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_time">Horário da Reunião *</Label>
              <Input
                id="meeting_time"
                type="time"
                value={data.meeting_time}
                onChange={(e) => handleChange('meeting_time', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização da Nova Célula
          </CardTitle>
          <CardDescription>
            Onde a nova célula se reunirá
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              placeholder="Rua, número, bairro"
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={data.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                placeholder="UF"
                maxLength={2}
                value={data.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                placeholder="00000-000"
                value={data.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Validação */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Dicas Importantes</h4>
              <ul className="text-sm text-amber-800 mt-2 space-y-1">
                <li>• Escolha um nome que reflita a identidade da nova célula</li>
                <li>• Considere a disponibilidade dos membros para o dia/horário</li>
                <li>• O local deve ser acessível para os membros que irão participar</li>
                <li>• Você poderá ajustar essas informações após a aprovação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}