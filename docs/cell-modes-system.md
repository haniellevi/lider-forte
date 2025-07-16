# Sistema de Modos Estratégicos da Visão G12

## Visão Geral

O Sistema de Modos Estratégicos implementa os 4 modos da Visão G12 (GANHAR, CONSOLIDAR, DISCIPULAR, ENVIAR) para orientar o foco semanal das células da igreja. Cada modo tem uma cor específica, atividades sugeridas e métricas de acompanhamento.

## Estrutura do Sistema

### 1. Banco de Dados

#### Tabelas Criadas:

- **`mode_templates`**: Templates dos 4 modos com configurações padrão
- **`cell_modes`**: Modos ativos/histórico por célula
- **`mode_activities`**: Atividades planejadas/realizadas por modo

#### ENUMs:

- **`cell_mode`**: GANHAR, CONSOLIDAR, DISCIPULAR, ENVIAR
- **`activity_type`**: meeting, outreach, training, service, fellowship, mentoring

### 2. Funcionalidades Principais

#### Modos Estratégicos:

1. **GANHAR (Vermelho - #DC2626)**
   - Foco: Evangelismo e alcance
   - Duração padrão: 4 semanas
   - Ícone: 🎯
   - Métricas: Novos visitantes, conversões, atividades de convite

2. **CONSOLIDAR (Verde - #059669)**
   - Foco: Cuidado pastoral e integração
   - Duração padrão: 3 semanas
   - Ícone: 🤲
   - Métricas: Visitas pastorais, integração de membros, retenção

3. **DISCIPULAR (Azul - #2563EB)**
   - Foco: Ensino e crescimento espiritual
   - Duração padrão: 6 semanas
   - Ícone: 📚
   - Métricas: Estudos bíblicos, cursos concluídos, crescimento espiritual

4. **ENVIAR (Amarelo - #D97706)**
   - Foco: Multiplicação e liderança
   - Duração padrão: 8 semanas
   - Ícone: 🚀
   - Métricas: Líderes treinados, Timóteos desenvolvidos, prontidão para multiplicação

### 3. Funcionalidades SQL

#### Funções Principais:

- **`activate_cell_mode()`**: Ativa um modo para uma célula
- **`get_current_cell_mode()`**: Obtém o modo atual de uma célula
- **`update_mode_metrics()`**: Atualiza métricas de um modo
- **`recommend_cell_mode()`**: Recomenda o próximo modo baseado no contexto

#### Views:

- **`cell_modes_dashboard`**: Dashboard com visão geral dos modos por célula

### 4. APIs (Endpoints)

#### Endpoints Implementados:

```
GET /api/protected/cell-modes
POST /api/protected/cells/{id}/modes
GET /api/protected/cells/{id}/modes/current
GET /api/protected/cells/{id}/modes?action=recommend
PUT /api/protected/cell-modes/{id}/metrics
GET /api/protected/church/{id}/modes/dashboard
POST /api/protected/cell-modes/{id}/activities
PUT /api/protected/mode-activities/{id}
DELETE /api/protected/mode-activities/{id}
```

### 5. Componentes React

#### Componentes Principais:

- **`ModeBadge`**: Badge visual do modo com cor e ícone
- **`ModeSelector`**: Modal para seleção e ativação de modos
- **`ModeDashboard`**: Dashboard geral dos modos da igreja
- **`ModeMetrics`**: Componente para visualizar e atualizar métricas
- **`ModeWidget`**: Widget compacto para exibir em células

#### Hooks Customizados:

- **`useCellModes()`**: Gerencia templates de modo
- **`useCellMode()`**: Gerencia modo atual de uma célula específica
- **`useModeMetrics()`**: Gerencia métricas de um modo
- **`useModeActivities()`**: Gerencia atividades de um modo
- **`useModeDashboard()`**: Dashboard de modos da igreja

### 6. Sistema de Recomendações

O sistema inclui inteligência para recomendar o próximo modo baseado em:

- Número de membros da célula
- Tempo desde a última multiplicação
- Taxa de novos membros
- Histórico de modos anteriores
- Contexto atual da célula

#### Lógica de Recomendação:

1. **Células maduras (>12 membros, >12 meses)** → ENVIAR
2. **Alto fluxo de novos membros** → CONSOLIDAR
3. **Células pequenas (<8 membros)** → GANHAR
4. **Tempo sem discipulado** → DISCIPULAR
5. **Progressão cíclica padrão** → Próximo no ciclo

### 7. Métricas e KPIs

Cada modo possui métricas específicas para acompanhamento:

#### Exemplos de Métricas:

- **GANHAR**: Novos visitantes, conversões, convites realizados
- **CONSOLIDAR**: Visitas pastorais, novos membros integrados, taxa de retenção
- **DISCIPULAR**: Estudos realizados, cursos concluídos, crescimento espiritual
- **ENVIAR**: Líderes treinados, Timóteos desenvolvidos, prontidão multiplicação

### 8. Internacionalização

Sistema totalmente traduzido para português brasileiro com namespace `CellModes` incluindo:

- Nomes e descrições dos modos
- Status e ações
- Mensagens de feedback
- Formulários e interfaces

### 9. Segurança (RLS)

Políticas de segurança implementadas:

- Usuários só veem modos de células da sua igreja
- Apenas líderes, supervisores e pastores podem ativar/editar modos
- Controle de acesso baseado em roles e hierarquia

### 10. Navegação

Nova rota adicionada ao sistema:

- **Menu**: Gestão → Modos Estratégicos
- **URL**: `/app/cell-modes`
- **Ícone**: Target (🎯)

## Como Usar

### 1. Ativar um Modo para Célula

```typescript
// Usando o hook
const { activateMode } = useCellMode(cellId)

await activateMode({
  mode: 'GANHAR',
  duration_weeks: 4,
  goal_description: 'Focar em evangelismo este mês'
})
```

### 2. Atualizar Métricas

```typescript
// Usando o hook
const { updateMetrics } = useModeMetrics(modeId)

await updateMetrics({
  metrics: {
    new_visitors: 5,
    conversions: 2,
    invitation_activities: 3
  }
})
```

### 3. Visualizar Dashboard

O dashboard mostra uma visão geral de todos os modos ativos na igreja, células sem modo ativo e recomendações automáticas.

## Próximos Passos

1. **Integração com Reuniões**: Conectar atividades dos modos com o sistema de reuniões
2. **Notificações**: Alertas quando modos estão expirando ou métricas não estão sendo atingidas
3. **Relatórios**: Relatórios específicos por modo com análise de performance
4. **Automação**: Sugestão automática de transição entre modos
5. **Gamificação**: Pontuação da Escada do Sucesso baseada no cumprimento de modos

## Arquivos Principais

### Migração:
- `supabase/migrations/20250717000000_cell_modes_system.sql`

### APIs:
- `src/app/api/protected/cell-modes/`
- `src/app/api/protected/cells/[id]/modes/`

### Componentes:
- `src/components/cells/mode-*.tsx`

### Hooks:
- `src/hooks/use-cell-modes.ts`

### Tipos:
- `src/types/cell-modes.ts`

### Páginas:
- `src/app/[locale]/(protected)/cell-modes/page.tsx`

### Traduções:
- `messages/pt-BR.json` (namespace `CellModes`)

Este sistema fornece uma base sólida para gerenciar os modos estratégicos da Visão G12, permitindo que as células mantenham foco direcionado e acompanhem seu progresso através de métricas específicas.