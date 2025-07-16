# Sistema de Critérios Automáticos de Multiplicação - Visão G12

## Visão Geral

O Sistema de Critérios Automáticos de Multiplicação é uma solução inteligente que avalia automaticamente quando uma célula G12 está pronta para multiplicar, baseado em critérios específicos e configúveis. O sistema utiliza algoritmos de análise de dados para fornecer insights precisos e recomendações para líderes e pastores.

## Arquitetura do Sistema

### 1. **Banco de Dados**

#### Tabelas Principais:
- **`multiplication_criteria`**: Configuração dos critérios de avaliação
- **`multiplication_readiness`**: Resultados das avaliações de prontidão
- **`cell_meetings`**: Registro de reuniões das células

#### Tipos de Dados (Enums):
- **`criteria_type`**: Tipos de critérios (member_count, meeting_frequency, etc.)
- **`multiplication_status`**: Status de prontidão (not_ready, preparing, ready, optimal, overdue)
- **`meeting_type`**: Tipos de reunião (regular, special, training, etc.)
- **`alert_type`**: Tipos de alerta (ready_for_multiplication, slow_growth, etc.)

### 2. **Funções de Banco de Dados**

#### Funções Auxiliares:
- `calculate_meeting_frequency()`: Calcula percentual de reuniões realizadas
- `calculate_average_attendance()`: Calcula presença média nas reuniões
- `get_potential_leaders_count()`: Conta líderes em potencial
- `get_cell_age_months()`: Calcula idade da célula em meses
- `get_leader_maturity_score()`: Obtém score de maturidade do líder

#### Função Principal:
- `evaluate_multiplication_criteria()`: Avalia todos os critérios e retorna score de prontidão

#### Funções de Dashboard:
- `get_multiplication_dashboard()`: Dados consolidados do dashboard
- `generate_multiplication_alerts()`: Gera alertas automáticos
- `update_all_cells_readiness()`: Atualiza prontidão de todas as células

### 3. **Sistema de Triggers Automáticos**

Os triggers garantem que as avaliações sejam atualizadas automaticamente quando:
- Membros são adicionados/removidos de células
- Reuniões são registradas
- Pipeline de liderança é atualizado

## Critérios de Avaliação Padrão

### Critérios Implementados:

1. **Número de Membros** (Peso: 25%)
   - Mínimo: 12 membros ativos
   - Verifica: Quantidade de membros na célula

2. **Frequência de Reuniões** (Peso: 20%)
   - Mínimo: 80% das reuniões planejadas
   - Verifica: Consistência das reuniões

3. **Presença Média** (Peso: 20%)
   - Mínimo: 75% dos membros presentes
   - Verifica: Engajamento dos membros

4. **Líderes em Potencial** (Peso: 15%)
   - Mínimo: 2 líderes identificados
   - Verifica: Pipeline de liderança

5. **Idade da Célula** (Peso: 10%)
   - Mínimo: 6 meses de existência
   - Verifica: Maturidade da célula

6. **Maturidade do Líder** (Peso: 10%)
   - Mínimo: 800 pontos na Escada do Sucesso
   - Verifica: Preparação do líder atual

## Sistema de Pontuação

### Cálculo do Score:
- Cada critério recebe uma pontuação de 0-100
- O score é ponderado pelo peso do critério
- Score final normalizado para 0-100%

### Status de Prontidão:
- **Ótima (90-100%)**: Momento ideal para multiplicar
- **Pronta (75-89%)**: Pode multiplicar
- **Preparando (60-74%)**: Em desenvolvimento
- **Não Pronta (<60%)**: Precisa melhorar
- **Atrasada**: Deveria ter multiplicado

## Endpoints de API

### Critérios:
- `GET /api/protected/multiplication/criteria` - Listar critérios
- `POST /api/protected/multiplication/criteria` - Criar critério
- `PUT /api/protected/multiplication/criteria` - Atualizar critério
- `DELETE /api/protected/multiplication/criteria` - Excluir critério

### Avaliação:
- `GET /api/protected/multiplication/evaluate/[cellId]` - Avaliar célula
- `POST /api/protected/multiplication/evaluate/[cellId]` - Reavaliar célula

### Dashboard:
- `GET /api/protected/multiplication/dashboard` - Dados do dashboard
- `GET /api/protected/multiplication/readiness` - Lista de prontidão
- `POST /api/protected/multiplication/readiness` - Atualizar todas as células

### Alertas:
- `GET /api/protected/multiplication/alerts` - Alertas automáticos
- `GET /api/protected/multiplication/details/[cellId]` - Detalhes da célula

## Componentes React

### Dashboard Principal:
- **`MultiplicationDashboard`**: Dashboard completo com estatísticas
- **`MultiplicationReadinessCard`**: Card individual de cada célula
- **`MultiplicationAlertsPanel`**: Painel de alertas

### Gerenciamento:
- **`MultiplicationCriteriaManager`**: Interface para configurar critérios

### Hooks TanStack Query:
- `useMultiplicationDashboard()`: Dados do dashboard
- `useMultiplicationCriteria()`: Critérios configurados
- `useMultiplicationAlerts()`: Alertas do sistema
- `useEvaluateCell()`: Avaliação de células

## Sistema de Alertas

### Tipos de Alerta:
1. **Pronta para Multiplicação**: Célula atingiu critérios
2. **Crescimento Lento**: Célula antiga sem progressão
3. **Baixa Frequência**: Reuniões irregulares
4. **Líder em Falta**: Necessita novo líder

### Prioridades:
- **Alta (1)**: Requer ação imediata
- **Média (2)**: Atenção necessária
- **Baixa (3)**: Monitoramento

## Segurança e Permissões

### Row Level Security (RLS):
- Usuários só veem dados da própria igreja
- Líderes gerenciam suas próprias células
- Supervisores veem células supervisionadas
- Pastores têm acesso completo

### Permissões por Role:
- **Pastor**: Todas as funcionalidades
- **Supervisor**: Células supervisionadas + alertas
- **Líder**: Própria célula + avaliações
- **Membro**: Visualização limitada

## Performance e Otimização

### Índices Criados:
- Critérios por igreja e tipo
- Prontidão por célula e status
- Reuniões por célula e data

### Cache Strategy:
- Dados do dashboard: 1 minuto
- Critérios: 5 minutos
- Alertas: 30 segundos

## Como Usar o Sistema

### 1. **Configuração Inicial**:
```sql
-- As migrações já populam critérios padrão
-- Ajustar pesos conforme necessário
```

### 2. **Avaliação Automática**:
```typescript
// Triggerada automaticamente quando:
// - Membros são alterados
// - Reuniões são registradas
// - Pipeline de liderança atualizado
```

### 3. **Dashboard de Monitoramento**:
```tsx
import { MultiplicationDashboard } from '@/components/Multiplication';

<MultiplicationDashboard 
  churchId={churchId}
  refreshInterval={300000} // 5 minutos
/>
```

### 4. **Configuração de Critérios**:
```tsx
import { MultiplicationCriteriaManager } from '@/components/Multiplication';

<MultiplicationCriteriaManager
  churchId={churchId}
  onCriteriaChange={handleUpdate}
/>
```

## Fluxo de Multiplicação Recomendado

### 1. **Monitoramento Contínuo**
- Dashboard atualizado em tempo real
- Alertas automáticos para células prontas

### 2. **Avaliação Detalhada**
- Análise individual de cada critério
- Identificação de pontos de melhoria

### 3. **Preparação para Multiplicação**
- Treinamento de novos líderes
- Seleção de membros para nova célula

### 4. **Multiplicação**
- Execução do processo de divisão
- Acompanhamento das novas células

## Manutenção e Monitoramento

### Logs e Auditoria:
- Todas as avaliações são registradas
- Histórico de mudanças em critérios
- Tracking de multiplicações realizadas

### Métricas de Performance:
- Tempo médio para multiplicação
- Taxa de sucesso das novas células
- Evolução dos scores ao longo do tempo

## Extensibilidade

### Novos Critérios:
- Sistema permite adicionar critérios customizados
- Métodos de cálculo configuráveis
- Pesos ajustáveis por igreja

### Integrações Futuras:
- WhatsApp para alertas automáticos
- Email notifications
- Relatórios PDF automáticos
- Dashboard mobile

## Troubleshooting

### Problemas Comuns:

1. **Score não atualiza**:
   - Verificar se triggers estão ativos
   - Executar reavaliação manual

2. **Critérios não aparecem**:
   - Verificar permissões RLS
   - Confirmar church_id correto

3. **Performance lenta**:
   - Verificar índices
   - Otimizar consultas de reuniões

### Comandos Úteis:
```sql
-- Reavaliar todas as células
SELECT update_all_cells_readiness('church-uuid');

-- Verificar status de uma célula
SELECT * FROM get_cell_multiplication_details('cell-uuid');

-- Gerar alertas
SELECT * FROM generate_multiplication_alerts();
```

## Conclusão

O Sistema de Critérios Automáticos de Multiplicação fornece uma solução completa e inteligente para gerenciar o crescimento das células G12. Com avaliação automática, alertas em tempo real e interface intuitiva, o sistema otimiza o processo de multiplicação e garante o crescimento saudável da igreja.

Para suporte técnico ou customizações, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.