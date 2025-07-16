# 🐛 Relatório de Erros do Sistema LIDER-FORTE

**Data da Análise:** 16/07/2025  
**Versão:** Commit ee5208c  
**Total de Erros Identificados:** 50+

---

## 🔴 **ERROS CRÍTICOS - TypeScript**

### 1. **Componentes de UI Faltando**
- **Arquivos Afetados:** 
  - `components/cells/MultiplicationButton.tsx`
  - `components/multiplication/steps/`
- **Problema:** Import de `AlertDescription` que não existe em `@/components/ui/alert`
- **Localização:** Linhas 15, 170-190, 198, 209
- **Impacto:** 🔴 Crítico - Componente não renderiza
- **Solução:** O componente Alert só exporta `Alert`, precisa implementar `AlertDescription`

### 2. **Variantes de Button Inconsistentes**
- **Arquivos Afetados:** Múltiplos componentes
- **Problema:** Variantes como `"outline"`, `"primary"`, `"secondary"` não existem no tipo Button
- **Localização:** Espalhado por vários arquivos
- **Impacto:** 🔴 Crítico - Erros de tipagem TypeScript
- **Variantes Válidas:** `"default" | "error" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "green" | "outlinePrimary" | "outlineDark"`

### 3. **Componentes Select Incompatíveis**
- **Arquivo:** `components/multiplication/steps/BasicInfoStep.tsx:7`
- **Problema:** Imports de `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` não existem
- **Impacto:** 🔴 Crítico - Componente quebrado
- **Solução:** Implementar os componentes Select necessários

### 4. **Módulos UI Faltando**
- **Arquivos Afetados:** Vários
- **Problemas:**
  - `@/components/ui/separator` não existe
  - `@/components/ui/radio-group` não existe
- **Impacto:** 🔴 Crítico - Imports quebrados

---

## 🟠 **ERROS DE TIPAGEM**

### 5. **Propriedades Inconsistentes em User**
- **Arquivo:** `src/components/Cells/CellForm.tsx:140,148`
- **Problema:** Uso de `user.name` quando deveria ser `user.full_name`
- **Impacto:** 🟠 Alto - Dados não exibidos corretamente
- **Código Problemático:**
```typescript
// ❌ Erro atual
label: user.name || user.email

// ✅ Correção necessária  
label: user.full_name || user.email
```

### 6. **Propriedades Faltando em Profile**
- **Arquivo:** `src/hooks/mutations/useProfile.ts:33`
- **Problema:** Propriedade `user_id` não existe no tipo Profile
- **Impacto:** 🟠 Alto - Falha na atualização de perfil

### 7. **Estrutura de Dados Incorreta**
- **Arquivo:** `src/hooks/queries/useDashboard.ts:163`
- **Problema:** Tipo `church` esperado como objeto, mas fornecido como array
- **Impacto:** 🟠 Alto - Dashboard quebrado

---

## 🟡 **ROTAS DE API QUEBRADAS**

### 8. **APIs de Multiplicação Deletadas**
- **Rotas Inexistentes:**
  - `/api/protected/multiplication/wizard-steps`
  - `/api/protected/multiplication/start`
  - `/api/protected/multiplication/process/[id]`
  - `/api/protected/multiplication/templates`
  - `/api/protected/multiplication/suggest-distribution`
  - `/api/protected/multiplication/update-assignments`
- **Impacto:** 🟡 Médio - Funcionalidade de multiplicação indisponível
- **Arquivos Afetados:** `components/multiplication/`

---

## 🔵 **PROBLEMAS DE IMPLEMENTAÇÃO**

### 9. **Hook useFormValidation com Imports Faltando**
- **Arquivo:** `src/hooks/useFormValidation.ts:11`
- **Problema:** Import de tipos de `../types/form-types` mas caminho pode estar incorreto
- **Impacto:** 🔵 Médio - Validação de formulários comprometida

### 10. **Queries com Propriedades Inexistentes**
- **Arquivo:** `src/hooks/queries/useBackup.ts`
- **Problemas:**
  - Linha 188: Propriedade `records` não existe
  - Linha 309: Propriedade `operations` não existe (deveria ser `options`)
- **Impacto:** 🔵 Médio - Funcionalidade de backup comprometida

### 11. **Null/Undefined Safety**
- **Arquivo:** `src/hooks/queries/useUsers.ts:296`
- **Problema:** `user` pode ser null/undefined
- **Impacto:** 🔵 Médio - Potencial crash de aplicação

---

## 🟢 **PROBLEMAS MENORES**

### 12. **Inconsistências de Nomenclatura**
- **Problema:** Mistura entre `user.name` e `user.full_name`
- **Localização:** Múltiplos arquivos
- **Impacto:** 🟢 Baixo - Confusão de desenvolvimento

### 13. **Operador de Comparação**
- **Arquivo:** `src/components/ui/alert/Alert.tsx:65`
- **Problema:** Uso de `==` ao invés de `===`
- **Impacto:** 🟢 Baixo - Má prática, mas funcional

---

## 📋 **PROBLEMAS DE ESTRUTURA**

### 14. **Arquivos Deletados Mas Ainda Referenciados**
- **Arquivos Deletados:**
  - `app/(protected)/cells/[id]/multiply/page.tsx`
  - Todas as rotas de multiplicação em `app/api/protected/multiplication/`
  - `src/components/Multiplication/` (todo o diretório)
  - `src/hooks/queries/useMultiplication.ts`
- **Impacto:** 🟡 Médio - Referências quebradas

### 15. **Imports Não Utilizados**
- **Arquivo:** `CellDetailContent.tsx:19`
- **Problema:** Import de `Badge` sem uso
- **Impacto:** 🟢 Baixo - Limpeza de código

---

## 🔧 **PLANO DE CORREÇÃO**

### 🚨 **Prioridade ALTA (Crítico)**
1. **Implementar componentes UI faltando**
   - Criar `AlertDescription`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
   - Implementar `separator` e `radio-group`
   - **Tempo Estimado:** 4-6 horas

2. **Corrigir tipos de Button**
   - Atualizar todas as variantes para os tipos corretos
   - **Tempo Estimado:** 2-3 horas

3. **Padronizar propriedades User**
   - Substituir `user.name` por `user.full_name` em todos os arquivos
   - **Tempo Estimado:** 1-2 horas

### ⚠️ **Prioridade MÉDIA**
4. **Corrigir hooks com queries quebradas**
   - Corrigir `useBackup.ts` e `useDashboard.ts`
   - **Tempo Estimado:** 2-3 horas

5. **Adicionar null safety**
   - Especialmente em `useUsers.ts`
   - **Tempo Estimado:** 1-2 horas

6. **Decidir sobre APIs de multiplicação**
   - Reimplementar ou remover completamente
   - **Tempo Estimado:** 4-8 horas

### 📝 **Prioridade BAIXA**
7. **Limpeza geral**
   - Remover imports não utilizados
   - Padronizar operadores de comparação
   - **Tempo Estimado:** 1-2 horas

---

## 📊 **Estatísticas Finais**

| Categoria | Quantidade | Impacto |
|-----------|------------|---------|
| Erros Críticos | 15+ | 🔴 Alto |
| Problemas de Tipagem | 10+ | 🟠 Médio-Alto |
| APIs Quebradas | 8 | 🟡 Médio |
| Problemas Implementação | 5+ | 🔵 Médio |
| Problemas Menores | 10+ | 🟢 Baixo |

**Total de Horas para Correção:** 15-25 horas  
**Prioridade Crítica:** 7-11 horas  
**Status do Sistema:** ⚠️ Funcional com limitações significativas

---

## 📋 **Próximos Passos Recomendados**

1. **Implementar componentes UI críticos** (AlertDescription, Select components)
2. **Corrigir tipagem de Button** em todos os componentes
3. **Padronizar propriedades User** (`full_name` vs `name`)
4. **Revisar e corrigir hooks quebrados**
5. **Tomar decisão sobre sistema de multiplicação**
6. **Executar limpeza geral de código**

---

**Observação:** Este relatório deve ser revisado após cada correção para atualizar o status dos erros resolvidos.