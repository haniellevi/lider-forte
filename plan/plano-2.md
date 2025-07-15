# Plano 2 - Fase 2: Interface de Usuário e Dashboard (Semanas 4-6)

## 📋 Status Atual
- ✅ **Plano 1 CONCLUÍDO**: APIs backend implementadas (igrejas, usuários, convites)
- ✅ **Infraestrutura**: Clerk + Supabase + validações brasileiras funcionando
- ✅ **Correções**: Props de redirect e singleton Supabase implementados

## 🎯 Objetivos da Fase 2
Implementar interfaces de usuário para administração do sistema, seguindo os padrões do projeto e utilizando os agents disponíveis.

---

## 📅 Semana 4: Páginas de Gestão de Igrejas

### 4.1 Página de Listagem de Igrejas
**Agent:** `frontend-page.md`
**Localização:** `/src/app/[locale]/app/churches/page.tsx`

**Funcionalidades:**
- [ ] Tabela responsiva com dados das igrejas
- [ ] Filtros: nome, cidade, estado
- [ ] Paginação automática
- [ ] Botões de ação: visualizar, editar, excluir
- [ ] Indicadores: número de membros, células
- [ ] Breadcrumb de navegação

**Componentes necessários:**
- [ ] `ChurchesTable` - tabela principal
- [ ] `ChurchFilters` - filtros de busca
- [ ] `ChurchCard` - card resumo para mobile

### 4.2 Formulário de Igreja
**Agent:** `frontend-form.md`
**Localização:** `/src/app/[locale]/app/churches/[id]/page.tsx`

**Funcionalidades:**
- [ ] Formulário completo com validação Zod
- [ ] Campos: nome, CNPJ, endereço (com CEP automático), contato
- [ ] Validações brasileiras integradas
- [ ] Estados de loading/success/error
- [ ] Modo criação e edição
- [ ] Upload de logo da igreja (futuro)

**Schemas de validação:**
- [ ] Reutilizar `ChurchCreateSchema` do backend
- [ ] Integrar com `addressSchema` e `cnpjSchema`

### 4.3 Hook de Gestão de Igrejas
**Agent:** `frontend-hook.md`
**Localização:** `/src/hooks/queries/useChurches.ts`

**Funcionalidades:**
- [ ] `useChurches()` - listagem com filtros
- [ ] `useChurch(id)` - dados de igreja específica
- [ ] `useCreateChurch()` - criação com optimistic update
- [ ] `useUpdateChurch()` - atualização
- [ ] `useDeleteChurch()` - exclusão com confirmação
- [ ] Integração com TanStack Query
- [ ] Cache automático e invalidação

---

## 📅 Semana 5: Gestão de Usuários e Sistema de Convites

### 5.1 Página de Gestão de Usuários
**Agent:** `frontend-page.md`
**Localização:** `/src/app/[locale]/app/users/page.tsx`

**Funcionalidades:**
- [ ] Tabela de usuários com filtros avançados
- [ ] Filtros: nome, email, role, igreja, status
- [ ] Indicadores de células e hierarquia
- [ ] Ações em massa: convitar, transferir, inativar
- [ ] Modal de detalhes do usuário
- [ ] Exportação de dados (CSV)

### 5.2 Formulário de Usuário
**Agent:** `frontend-form.md`
**Localização:** `/src/app/[locale]/app/users/[id]/page.tsx`

**Funcionalidades:**
- [ ] Formulário completo de perfil
- [ ] Campos: dados pessoais, endereço, contato emergência
- [ ] Validação CPF, telefone brasileiro
- [ ] Seleção de igreja e role
- [ ] Upload de foto de perfil
- [ ] Histórico de atividades

### 5.3 Sistema de Convites
**Agent:** `frontend-component.md`
**Localização:** `/src/components/Invites/`

**Componentes:**
- [ ] `InviteModal` - modal para criar convites
- [ ] `InvitesList` - lista de convites pendentes
- [ ] `InviteCard` - card individual de convite
- [ ] `InviteStatusBadge` - badge de status

**Funcionalidades:**
- [ ] Criar convites com email e role
- [ ] Acompanhar status dos convites
- [ ] Reenviar convites expirados
- [ ] Cancelar convites pendentes

### 5.4 Hooks de Usuários e Convites
**Agent:** `frontend-hook.md`
**Localizações:** 
- `/src/hooks/queries/useUsers.ts`
- `/src/hooks/queries/useInvites.ts`

**Funcionalidades:**
- [ ] CRUD completo de usuários
- [ ] Gestão de convites
- [ ] Filtros e paginação
- [ ] Optimistic updates
- [ ] Sincronização com Clerk

---

## 📅 Semana 6: Dashboard Administrativo

### 6.1 Dashboard Principal
**Agent:** `frontend-page.md`
**Localização:** `/src/app/[locale]/app/page.tsx`

**Widgets do Dashboard:**
- [ ] Resumo geral: total de igrejas, usuários, células
- [ ] Gráfico de crescimento mensal
- [ ] Lista de atividades recentes
- [ ] Convites pendentes
- [ ] Métricas de engajamento
- [ ] Links rápidos para ações

### 6.2 Componentes de Dashboard
**Agent:** `frontend-component.md`
**Localização:** `/src/components/Dashboard/`

**Componentes:**
- [ ] `StatsCard` - cards de estatísticas
- [ ] `GrowthChart` - gráfico de crescimento
- [ ] `RecentActivity` - atividades recentes
- [ ] `QuickActions` - ações rápidas
- [ ] `PendingInvites` - convites pendentes

### 6.3 Sistema de Configurações da Igreja
**Agent:** `frontend-form.md`
**Localização:** `/src/app/[locale]/app/settings/church/page.tsx`

**Funcionalidades:**
- [ ] Configurações da igreja atual
- [ ] Dados institucionais
- [ ] Preferências do sistema
- [ ] Configurações de notificações
- [ ] Tema e personalização

---

## 🔧 Tarefas Técnicas Transversais

### Navegação e Layout
**Agent:** `frontend-component.md`

- [ ] Atualizar sidebar com novas rotas
- [ ] Implementar breadcrumbs dinâmicos
- [ ] Adicionar indicadores de navegação ativa
- [ ] Configurar permissões de acesso por role

### Estados e Feedback
**Agent:** `frontend-state-management.md`

- [ ] Estados de loading em todas as páginas
- [ ] Tratamento de erros padronizado
- [ ] Toasts de sucesso/erro
- [ ] Skeletons para carregamento
- [ ] Estados vazios (empty states)

### Responsividade
- [ ] Layout mobile-first em todas as páginas
- [ ] Tabelas responsivas com scroll horizontal
- [ ] Modais adaptáveis para mobile
- [ ] Navegação mobile otimizada

### Performance
- [ ] Lazy loading de componentes pesados
- [ ] Paginação virtual para listas grandes
- [ ] Otimização de imagens
- [ ] Code splitting por rota

---

## 📚 Padrões e Convenções

### Estrutura de Arquivos
```
src/app/[locale]/app/
├── churches/
│   ├── page.tsx (listagem)
│   ├── new/page.tsx (criação)
│   └── [id]/page.tsx (edição)
├── users/
│   ├── page.tsx (listagem)
│   ├── new/page.tsx (criação)
│   └── [id]/page.tsx (edição)
├── settings/
│   └── church/page.tsx
└── page.tsx (dashboard)
```

### Convenções de Nomenclatura
- **Páginas**: `PascalCase` + `Page` (ex: `ChurchesPage`)
- **Componentes**: `PascalCase` (ex: `ChurchCard`)
- **Hooks**: `camelCase` + `use` (ex: `useChurches`)
- **Tipos**: `PascalCase` + sufixo específico

### Integração com APIs
- Usar hooks do TanStack Query
- Implementar error boundaries
- Cache automático com invalidação
- Optimistic updates para melhor UX

---

## ✅ Critérios de Conclusão

### Funcionalidades Obrigatórias
- [ ] CRUD completo de igrejas via interface
- [ ] Gestão de usuários com filtros avançados
- [ ] Sistema de convites funcionando
- [ ] Dashboard com métricas básicas
- [ ] Navegação completa e responsiva

### Qualidade de Código
- [ ] Todos os componentes tipados com TypeScript
- [ ] Testes de integração das páginas principais
- [ ] Validação de formulários funcionando
- [ ] Error handling implementado
- [ ] Performance otimizada

### Experiência do Usuário
- [ ] Interface responsiva em todos os dispositivos
- [ ] Feedback visual adequado (loading, success, error)
- [ ] Navegação intuitiva
- [ ] Acessibilidade básica implementada

---

## 🚀 Próximos Passos Após Conclusão

Após concluir o **Plano 2**, o projeto estará pronto para:

1. **Semana 7-8**: Sistema de Células e Hierarquia
2. **Semana 9-10**: Relatórios e Analytics
3. **Semana 11-12**: Funcionalidades Avançadas e Polimento

O **Plano 2** estabelece a base completa para administração do sistema, permitindo que pastores gerenciem suas igrejas, usuários e convites através de uma interface moderna e eficiente.