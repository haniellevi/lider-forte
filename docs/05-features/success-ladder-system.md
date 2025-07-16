# Sistema de Escada do Sucesso

O Sistema de Escada do Sucesso é um sistema de gamificação integrado à plataforma G12 que permite acompanhar e pontuar o progresso dos membros através de suas atividades na igreja.

## Visão Geral

O sistema funciona através de:
- **Atividades**: Ações que os membros podem realizar para ganhar pontos
- **Pontuação**: Sistema automático de cálculo de pontos baseado nas atividades
- **Rankings**: Classificação dos membros por pontuação
- **Categorias**: Organização das atividades em diferentes tipos

## Estrutura do Banco de Dados

### Tabelas Principais

#### `success_ladder_activities`
Define as atividades disponíveis para pontuação:
```sql
- id: UUID (PK)
- name: VARCHAR (nome da atividade)
- points: INTEGER (pontos concedidos)
- category: activity_category (categoria da atividade)
- description: TEXT (descrição opcional)
- is_active: BOOLEAN (se está ativa)
- church_id: UUID (igreja proprietária)
```

#### `member_activity_log`
Registra todas as atividades realizadas pelos membros:
```sql
- id: UUID (PK)
- profile_id: UUID (membro que realizou)
- activity_id: UUID (atividade realizada)
- points_earned: INTEGER (pontos ganhos)
- activity_date: DATE (data da atividade)
- metadata: JSONB (dados adicionais)
```

### Enum: `activity_category`
- `attendance`: Presenças (células, cultos, EBD)
- `events`: Eventos especiais (Encontro, Reencontro)
- `courses`: Cursos e capacitações
- `service`: Serviços voluntários
- `consistency`: Bônus de consistência

## API Endpoints

### 1. Listar Atividades
```http
GET /api/protected/ladder/activities
```

**Query Parameters:**
- `category`: Filtrar por categoria
- `is_active`: Apenas atividades ativas (default: true)
- `limit`: Número máximo de resultados (default: 50)
- `offset`: Paginação (default: 0)

**Response:**
```json
{
  "data": [...],
  "grouped": { "attendance": [...], "events": [...] },
  "pagination": { "total": 100, "hasMore": true }
}
```

### 2. Registrar Atividade
```http
POST /api/protected/ladder/activity
```

**Body:**
```json
{
  "profile_id": "uuid",
  "activity_id": "uuid",
  "activity_date": "2024-07-15",
  "metadata": {}
}
```

### 3. Obter Pontuação de Membro
```http
GET /api/protected/ladder/member/{id}
```

**Query Parameters:**
- `include_history`: Incluir histórico (default: false)
- `days`: Dias de histórico (default: 30)
- `category`: Filtrar histórico por categoria

### 4. Registro em Lote
```http
POST /api/protected/ladder/bulk-attendance
```

**Body:**
```json
{
  "cell_id": "uuid",
  "activity_id": "uuid", 
  "activity_date": "2024-07-15",
  "member_ids": ["uuid1", "uuid2"],
  "metadata": {}
}
```

### 5. Rankings
```http
GET /api/protected/ladder/rankings
```

**Query Parameters:**
- `type`: "cell" ou "church" (default: church)
- `cell_id`: ID da célula (obrigatório se type=cell)
- `limit`: Número de membros no ranking (default: 20)
- `period`: "week", "month", "quarter", "year", "all" (default: all)

## Componentes React

### 1. SuccessLadderRanking
Exibe o ranking de membros.

```tsx
import { SuccessLadderRanking } from '@/components/SuccessLadder';

<SuccessLadderRanking 
  type="church" 
  limit={20}
  showPeriodFilter={true}
/>
```

### 2. ActivityRegistrationForm
Formulário para registrar atividades.

```tsx
import { ActivityRegistrationForm } from '@/components/SuccessLadder';

<ActivityRegistrationForm
  profileId="uuid"
  profileName="João Silva"
  onSuccess={() => console.log('Registrado!')}
  onCancel={() => console.log('Cancelado')}
/>
```

### 3. MemberScoreProfile
Perfil detalhado de pontuação de um membro.

```tsx
import { MemberScoreProfile } from '@/components/SuccessLadder';

<MemberScoreProfile
  memberId="uuid"
  showHistory={true}
  historyDays={30}
/>
```

## Hooks Personalizados

### useSuccessLadderActivities
```tsx
const { data, isLoading } = useSuccessLadderActivities({
  category: 'attendance',
  is_active: true
});
```

### useMemberScore
```tsx
const { data, isLoading } = useMemberScore(memberId, {
  include_history: true,
  days: 30
});
```

### useRegisterActivity
```tsx
const registerActivity = useRegisterActivity();

await registerActivity.mutateAsync({
  profile_id: "uuid",
  activity_id: "uuid", 
  activity_date: "2024-07-15"
});
```

## Sistema de Pontuação

### Atividades Padrão

**Presença (10-15 pontos):**
- Presença em Célula: 10 pontos
- Presença no Culto: 15 pontos
- Presença na EBD: 10 pontos

**Eventos (60-200 pontos):**
- Encontro: 100 pontos
- Reencontro: 150 pontos
- Escola de Líderes: 200 pontos

**Cursos (50-200 pontos):**
- Universidade da Vida (Básico): 50 pontos
- Universidade da Vida (Avançado): 100 pontos
- Capacitação Destino: 200 pontos

**Serviços (20-100 pontos):**
- Serviços gerais: 20-40 pontos
- Liderança de Célula: 100 pontos

**Consistência (50-500 pontos):**
- Mensal (>80% presença): 50 pontos
- Trimestral (>85% presença): 150 pontos
- Anual (>95% presença): 500 pontos

### Cálculo Automático

O sistema calcula automaticamente:
1. **Pontos diretos**: Soma de todas as atividades realizadas
2. **Bônus de consistência**: Baseado na frequência de presenças
3. **Atualização em tempo real**: Triggers automáticos atualizam a pontuação

## Permissões

### Visualização
- **Todos**: Podem ver rankings da igreja
- **Membros**: Podem ver sua própria pontuação
- **Líderes**: Podem ver pontuação de membros de suas células

### Registro de Atividades
- **Próprio perfil**: Qualquer membro pode registrar suas atividades
- **Membros da célula**: Líderes podem registrar para seus membros
- **Supervisores/Pastores**: Podem registrar para qualquer membro da igreja

### Gestão de Atividades
- **Líderes e superiores**: Podem criar novas atividades
- **Pastores**: Controle total do sistema

## Funcionalidades Avançadas

### 1. Auditoria
- Todas as mudanças de pontuação são auditadas
- Logs detalhados de quem registrou cada atividade
- Histórico completo de atividades

### 2. Prevenção de Duplicatas
- Sistema impede registro da mesma atividade no mesmo dia
- Validações automáticas na inserção

### 3. Rankings Dinâmicos
- Rankings por período (semana, mês, trimestre, ano)
- Rankings por célula ou igreja inteira
- Estatísticas agregadas

### 4. Metadados Flexíveis
- Campo JSONB para dados adicionais
- Suporte a registros em lote
- Rastreamento de origem dos registros

## Exemplos de Uso

### Registrar Presença em Célula
```tsx
const registerAttendance = useRegisterActivity();

// Registrar presença individual
await registerAttendance.mutateAsync({
  profile_id: memberId,
  activity_id: attendanceActivityId,
  activity_date: today
});
```

### Registro em Lote de Presença
```tsx
const bulkRegister = useBulkAttendanceRegistration();

// Registrar presença de toda a célula
await bulkRegister.mutateAsync({
  cell_id: cellId,
  activity_id: attendanceActivityId,
  activity_date: today,
  member_ids: presentMemberIds
});
```

### Exibir Ranking da Célula
```tsx
<SuccessLadderRanking
  type="cell"
  cellId={cellId}
  limit={15}
  showPeriodFilter={true}
/>
```

## Considerações de Performance

1. **Indexes**: Criados automaticamente para consultas otimizadas
2. **Caching**: Queries com staleTime configurado
3. **Paginação**: Suporte nativo em todos os endpoints
4. **Batch Operations**: Registro em lote para operações múltiplas

## Segurança

1. **RLS**: Row Level Security em todas as tabelas
2. **Validação**: Múltiplas camadas de validação de dados
3. **Autorização**: Verificação de permissões em cada operação
4. **Auditoria**: Log completo de todas as ações

Este sistema proporciona uma experiência gamificada completa para motivar e acompanhar o crescimento espiritual dos membros da igreja através da metodologia G12.