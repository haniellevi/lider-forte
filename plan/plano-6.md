# 🚀 PLANO 6: CORREÇÃO EXPRESS + EXECUÇÃO ESTRUTURADA

**Data:** 16/07/2025  
**Baseado em:** error.md + análise de agentes especializados  
**Objetivo:** Corrigir 21 erros identificados usando agentes AI especializados  
**Tempo Total:** 12-17 horas (erros) + 12 semanas (funcionalidades PRD)

---

## 📋 **RESUMO EXECUTIVO**

### **Situação Atual**
- ✅ **Dependências UI críticas resolvidas** (Radix UI)
- ✅ **Infraestrutura sólida** (Clerk + Supabase + Next.js 15)
- ✅ **65% das funcionalidades básicas implementadas**
- ⚠️ **21 erros de código** (vs 50+ anteriores)
- ⚠️ **5 funcionalidades críticas PRD pendentes**

### **Meta do Plano 6**
- **Semana 1**: Eliminar 100% dos erros críticos
- **Semanas 2-13**: Implementar funcionalidades diferenciadoras PRD
- **Resultado**: 95% implementação PRD + sistema estável

---

## 🎯 **MAPEAMENTO ERRO → AGENTE ESPECIALIZADO**

### **🔴 ERROS CRÍTICOS (1-7) - 6-8 horas**

| # | Erro | Arquivo | Agente | Tempo |
|---|------|---------|---------|--------|
| 1 | AddMemberModal Schema Zod | `src/components/Cells/AddMemberModal.tsx:53` | `frontend-form.md` | 30 min |
| 2 | Hook useProfile tipagem | `src/hooks/mutations/useProfile.ts:31,67-68` | `frontend-hook.md` | 45 min |
| 3 | Componente Upload conflito | `src/components/ui/upload.tsx:5` | `frontend-component.md` | 15 min |
| 4 | Demo Data propriedades | `src/config/demo-data.ts` | `code-review.md` | 30 min |
| 5 | AlertDescription export | `src/components/ui/alert/Alert.tsx` | `frontend-component.md` | 30 min |
| 6 | API Routes tipos implícitos | `src/app/api/protected/*` | `backend-api-endpoint.md` | 45 min |
| 7 | API Ladder Member array | `src/app/api/protected/ladder/member/[id]/route.ts` | `backend-api-endpoint.md` | 30 min |

### **🟠 ALTA SEVERIDADE (8-13) - 4-6 horas**

| # | Erro | Arquivo | Agente | Tempo |
|---|------|---------|---------|--------|
| 8 | Hook useDashboard estrutura | `src/hooks/queries/useDashboard.ts:181,224` | `tanstack-query-integration.md` | 1 hora |
| 9 | Hook useUser propriedade | `src/hooks/queries/useUser.ts:81` | `frontend-hook.md` | 20 min |
| 10 | UserManagementTable comparação | `src/components/Tables/UserManagementTable.tsx:182` | `frontend-component.md` | 30 min |
| 11 | Hook useBackup queries | `src/hooks/queries/useBackup.ts:188,309` | `backend-database-integration.md` | 1 hora |
| 12 | Hook useUsers null safety | `src/hooks/queries/useUsers.ts:571` | `frontend-hook.md` | 30 min |
| 13 | Padronização user.name | Múltiplos arquivos | `code-review.md` | 1 hora |

### **🔵 PROBLEMAS MÉDIOS (19-21) - 2-3 horas**

| # | Erro | Descrição | Agente | Tempo |
|---|------|-----------|---------|--------|
| 19 | Imports inconsistentes | Mistura relativos/absolutos | `code-review.md` | 1 hora |
| 20 | Componentes multiplication | Localização incorreta | `code-review.md` | 30 min |
| 21 | Otimizações performance | Falta memoização | `frontend-component.md` | 1 hora |

---

## 🚀 **CRONOGRAMA DE EXECUÇÃO**

### **📅 SEMANA 1: CORREÇÃO EXPRESS**

#### **Segunda-feira (Erros Críticos 1-3)**
- **09:00-09:30**: Erro 1 - AddMemberModal Schema Zod
- **09:30-10:15**: Erro 2 - Hook useProfile tipagem  
- **10:15-10:30**: Erro 3 - Componente Upload conflito
- **10:30-11:00**: Teste e validação

#### **Terça-feira (Erros Críticos 4-5)**
- **09:00-09:30**: Erro 4 - Demo Data propriedades
- **09:30-10:00**: Erro 5 - AlertDescription export
- **10:00-10:30**: Teste e validação

#### **Quarta-feira (Erros Críticos 6-7)**
- **09:00-09:45**: Erro 6 - API Routes tipos
- **09:45-10:15**: Erro 7 - API Ladder Member
- **10:15-11:00**: Teste e validação

#### **Quinta-feira (Alta Severidade 8-10)**
- **09:00-10:00**: Erro 8 - Hook useDashboard
- **10:00-10:20**: Erro 9 - Hook useUser
- **10:20-10:50**: Erro 10 - UserManagementTable
- **10:50-11:30**: Teste e validação

#### **Sexta-feira (Finalização Semana 1)**
- **09:00-10:00**: Erro 11 - Hook useBackup
- **10:00-10:30**: Erro 12 - Hook useUsers
- **10:30-11:30**: Erro 13 - Padronização user.name
- **11:30-12:00**: Teste final e build

---

## 📚 **INSTRUÇÕES DETALHADAS POR AGENTE**

### **🔧 frontend-form.md**
**Usado para:** Erro 1 (AddMemberModal Schema Zod)
**Contexto:** Validação de formulário com Zod
**Solução:** Alterar `z.number().default(0)` para `z.number().min(0).max(100)`

### **🔧 frontend-hook.md**
**Usado para:** Erros 2, 9, 12 (Hooks useProfile, useUser, useUsers)
**Contexto:** Custom hooks com TanStack Query
**Foco:** Tipagem TypeScript e null safety

### **🔧 frontend-component.md**
**Usado para:** Erros 3, 5, 10, 21 (Upload, Alert, Table, Performance)
**Contexto:** Componentes React com TypeScript
**Padrão:** Radix UI + Tailwind CSS

### **🔧 backend-api-endpoint.md**
**Usado para:** Erros 6, 7 (API Routes, Ladder Member)
**Contexto:** Next.js 15 App Router APIs
**Foco:** Tipagem TypeScript e Supabase integration

### **🔧 tanstack-query-integration.md**
**Usado para:** Erro 8 (useDashboard)
**Contexto:** Server state management
**Foco:** Estrutura de dados e cache

### **🔧 backend-database-integration.md**
**Usado para:** Erro 11 (useBackup)
**Contexto:** Supabase queries e operações
**Foco:** Database operations e tipagem

### **🔧 code-review.md**
**Usado para:** Erros 4, 13, 19, 20 (Padrões e consistência)
**Contexto:** Code quality e conventions
**Foco:** Padronização e best practices

---

## 🎯 **FUNCIONALIDADES PRD PENDENTES (Semanas 2-13)**

### **🟡 Semanas 2-4: Escada do Sucesso (20% → 100%)**
- **Status:** 20% implementado
- **Agente:** `feature-crud.md`
- **Entregáveis:**
  - Algoritmo de pontuação automática
  - Interface gamificada com badges
  - Dashboard de progressão
  - Sistema de níveis e conquistas

### **🟡 Semanas 5-7: Pipeline de Líderes IA (10% → 100%)**
- **Status:** 10% implementado
- **Agente:** `integration-external-api.md`
- **Entregáveis:**
  - Algoritmo de ML para identificação
  - Dashboard de pipeline
  - Sistema de recomendações
  - Interface de acompanhamento

### **🟡 Semanas 8-10: Sistema Multiplicação (30% → 100%)**
- **Status:** 30% implementado
- **Agente:** `feature-crud.md`
- **Entregáveis:**
  - Critérios automáticos de multiplicação
  - Workflow de aprovação hierárquica
  - Interface de gestão
  - Relatórios de multiplicação

### **🟡 Semanas 11-12: Modos de Célula (0% → 100%)**
- **Status:** 0% implementado
- **Agente:** `frontend-state-management.md`
- **Entregáveis:**
  - Sistema GANHAR, CONSOLIDAR, DISCIPULAR, ENVIAR
  - Interface de seleção de modo
  - Métricas específicas por modo
  - Dashboard de acompanhamento

### **🟡 Semana 13: Biblioteca de Conteúdos (0% → 100%)**
- **Status:** 0% implementado
- **Agente:** `feature-crud.md`
- **Entregáveis:**
  - Sistema de gestão de conteúdo
  - Biblioteca de materiais
  - Sistema de tags e categorias
  - Interface de busca e filtros

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Semana 1 (Correção Express)**
- **Meta:** 0 erros de TypeScript
- **KPI:** Build successful + testes passando
- **Validação:** `npm run build && npm run test`

### **Semana 2-4 (Escada do Sucesso)**
- **Meta:** Sistema gamificado funcional
- **KPI:** 100% das funcionalidades de pontuação
- **Validação:** Testes unitários + interface completa

### **Semana 5-7 (Pipeline IA)**
- **Meta:** Algoritmo de recomendação ativo
- **KPI:** 95% precisão na identificação
- **Validação:** Testes de algoritmo + dashboard

### **Semana 8-10 (Multiplicação)**
- **Meta:** Processo automatizado completo
- **KPI:** 100% dos critérios implementados
- **Validação:** Workflow end-to-end funcionando

### **Semana 11-13 (Modos + Conteúdo)**
- **Meta:** Funcionalidades diferenciadoras ativas
- **KPI:** 4 modos + biblioteca funcionando
- **Validação:** Testes de usabilidade + performance

---

## 🔧 **COMANDOS E VALIDAÇÕES**

### **Comandos de Desenvolvimento**
```bash
# Antes de cada correção
npm run build
npm run typecheck
npm run lint

# Após cada correção
npm run test
npm run build
git add . && git commit -m "fix: correção erro #X"
```

### **Validações por Fase**
```bash
# Semana 1 - Correção Express
npm run build --verbose
npm run typecheck --strict
npm run test --coverage

# Semanas 2-13 - Funcionalidades
npm run test:e2e
npm run test:integration
npm run build:production
```

---

## 📈 **STATUS DE PROGRESSO**

### **Antes do Plano 6**
- **Implementação PRD:** 65%
- **Estabilidade Técnica:** 70%
- **Funcionalidades Diferenciadoras:** 15%
- **Erros de Código:** 21

### **Meta Pós Plano 6**
- **Implementação PRD:** 95%
- **Estabilidade Técnica:** 95%
- **Funcionalidades Diferenciadoras:** 90%
- **Erros de Código:** 0

---

## 🎯 **PRÓXIMOS PASSOS IMEDIATOS**

### **Passo 1: Preparação**
- [ ] Validar ambiente de desenvolvimento
- [ ] Backup do código atual
- [ ] Configurar ferramentas de teste

### **Passo 2: Execução Semana 1**
- [ ] Seguir cronograma diário
- [ ] Validar cada correção
- [ ] Documentar mudanças

### **Passo 3: Planejamento Semanas 2-13**
- [ ] Detalhar cada funcionalidade PRD
- [ ] Preparar agentes especializados
- [ ] Definir critérios de aceite

---

## 🚀 **CONCLUSÃO**

O **Plano 6** representa a execução estruturada e definitiva para transformar o LIDER-FORTE em líder de mercado:

✅ **Correção Express (Semana 1):** Eliminar 100% dos erros técnicos  
✅ **Funcionalidades Core (Semanas 2-13):** Implementar diferenciais únicos  
✅ **Resultado Final:** Sistema estável + 95% PRD implementado  

**Com este plano, o LIDER-FORTE estará pronto para dominar o mercado de gestão G12 em 14 semanas.**

---

**Autor:** Claude AI  
**Versão:** 1.0  
**Data:** 16/07/2025  
**Status:** ✅ PRONTO PARA EXECUÇÃO