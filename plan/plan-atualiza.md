# Plano de Atualização - Migração do Starter Kit para Sistema G12

**Data:** 16 de Julho de 2025  
**Objetivo:** Remover elementos desnecessários do AI Coders Starter Kit e focar exclusivamente no sistema de gestão G12

---

## 📋 RESUMO EXECUTIVO

Após análise do PRD (Product Requirements Document) e do código atual, identificamos vários elementos do starter kit original que não são relevantes para o sistema de gestão G12. Este plano detalha as atualizações necessárias para transformar completamente o projeto em uma plataforma especializada na Visão G12.

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. **Referência ao Ecommerce no Dashboard**
- **Localização:** `src/hooks/useNavigation.ts:20-22`
- **Problema:** Ainda existe um item "ecommerce" no menu principal
- **Impacto:** Confunde usuários e não faz sentido para gestão eclesiástica

### 2. **Identidade da Aplicação Incorreta**
- **Localização:** 
  - `package.json` - nome: "ai-coders-starter-kit"
  - `src/config/app.ts` - nome: "AI Coders - Starter Kit"
- **Problema:** Mantém branding do starter kit original
- **Impacto:** Não reflete a identidade do sistema G12

### 3. **Configurações Irrelevantes**
- **Localização:** `src/config/app.ts`
- **Problema:** Configurações sociais e empresariais do AI Coders
- **Impacto:** Informações incorretas para o contexto eclesiástico

---

## 🚨 ELEMENTOS PARA REVISAR E ADAPTAR

### **Componentes Úteis para Landing Page (Manter e Adaptar):**

1. **Widget WhatsApp para Captura de Leads**
   - Localização: `src/app/[locale]/_components/whatsapp-float.tsx`
   - **Estratégia:** Manter para landing page, adaptar para contexto G12
   - **Uso:** Captura leads de igrejas interessadas no sistema

2. **Seções de Marketing/Landing Page (Manter e Personalizar)**
   - `src/app/[locale]/_components/hero-section.tsx` ✅ **Manter** - Hero para G12
   - `src/app/[locale]/_components/features-section.tsx` ✅ **Manter** - Funcionalidades G12
   - `src/app/[locale]/_components/cta-section.tsx` ✅ **Manter** - Call-to-action para demo
   - `src/app/[locale]/_components/pricing-section.tsx` ✅ **Manter** - Planos SaaS G12
   - `src/app/[locale]/_components/testimonials-section.tsx` ✅ **Manter** - Depoimentos de igrejas
   - `src/app/[locale]/_components/stats-section.tsx` ✅ **Manter** - Estatísticas de crescimento
   - `src/app/[locale]/_components/footer.tsx` ✅ **Manter** - Footer da landing
   - `src/app/[locale]/_components/navbar.tsx` ✅ **Manter** - Navegação da landing

3. **Analytics Comerciais (Manter para Landing Page)**
   - Meta Pixel, GTM para marketing ✅ **Manter**
   - **Motivo:** Necessário para campanhas de aquisição de clientes B2B

### **Componentes para Remover ou Adaptar:**

1. **Seções Técnicas Desnecessárias**
   - `src/app/[locale]/_components/tech-stack-section.tsx` ❌ **Remover/Simplificar**
   - `src/app/[locale]/_components/components-showcase-section.tsx` ❌ **Remover**
   - `src/app/[locale]/_components/documentation-section.tsx` ❌ **Adaptar** para docs G12

4. **Documentação do Starter Kit**
   - Pasta `docs/` completa com documentação do template
   - Motivo: Deve ser substituída por docs específicos do G12

5. **Dados Demo Genéricos**
   - `src/config/demo-data.ts`
   - Motivo: Deve conter dados específicos do contexto G12

6. **Páginas de Demonstração**
   - Formulários de exemplo
   - Componentes showcase
   - TanStack Query demos
   - Motivo: Sistema real não precisa de demos

---

## 📋 PLANO DE ATUALIZAÇÃO DETALHADO

### **FASE 1: Limpeza de Identidade (1-2 dias)**

#### 1.1 Atualizar package.json
```json
{
  "name": "lider-forte-g12",
  "version": "1.0.0", 
  "author": "Líder Forte",
  "description": "Plataforma de Gestão G12 - Sistema operacional para igrejas que seguem a Visão G12"
}
```

#### 1.2 Atualizar src/config/app.ts
- Alterar nome para "Líder Forte - Sistema G12"
- Remover informações do AI Coders
- Configurar dados da organização G12
- Atualizar SEO para contexto eclesiástico

#### 1.3 Corrigir Navegação
- Remover item "ecommerce" do dashboard
- Renomear para "Visão Geral" ou "Dashboard Principal"
- Focar nos módulos G12: Células, Líderes, Relatórios

### **FASE 2: Separação Landing Page vs Sistema Interno (2-3 dias)**

#### 2.1 Organizar Componentes da Landing Page
- [ ] **Manter** `hero-section.tsx` - Adaptar para G12
- [ ] **Manter** `features-section.tsx` - Funcionalidades G12
- [ ] **Manter** `cta-section.tsx` - Call-to-action para demo
- [ ] **Manter** `pricing-section.tsx` - Planos SaaS G12
- [ ] **Manter** `testimonials-section.tsx` - Depoimentos de igrejas
- [ ] **Manter** `stats-section.tsx` - Estatísticas de crescimento
- [ ] **Manter** `whatsapp-float.tsx` - Captura leads igrejas
- [ ] **Remover** `tech-stack-section.tsx` - Simplificar
- [ ] **Remover** `components-showcase-section.tsx` - Desnecessário
- [ ] **Adaptar** `documentation-section.tsx` - Docs G12

#### 2.2 Configurar Analytics Estratégicos
- [ ] **Manter** Meta Pixel para campanhas B2B
- [ ] **Manter** GTM para tracking de conversões
- [ ] **Manter** Google Analytics para métricas de marketing
- [ ] **Configurar** LogRocket para sistema interno (pós-login)

#### 2.3 Remover Páginas Demo
- [ ] Avaliar quais páginas são realmente demo vs funcionais
- [ ] Manter apenas estruturas necessárias para G12
- [ ] Remover showcases de componentes

### **FASE 3: Especialização G12 (3-5 dias)**

#### 3.1 Atualizar Dados Demo
- [ ] Substituir por dados contextuais G12
- [ ] Criar exemplos de células, líderes, membros
- [ ] Configurar hierarchy samples

#### 3.2 Personalizar Componentes
- [ ] Adaptar dashboards para métricas G12
- [ ] Personalizar formulários para contexto eclesiástico
- [ ] Ajustar terminologias (célula, líder, discípulo, etc.)

#### 3.3 Configurar Funcionalidades Específicas
- [ ] Validações brasileiras (manter CPF, CEP)
- [ ] Sistemas de hierarquia G12
- [ ] Métricas específicas da visão

### **FASE 4: Documentação Especializada (2 dias)**

#### 4.1 Criar Nova Documentação
- [ ] Substituir docs do starter kit
- [ ] Criar guias específicos G12
- [ ] Documentar fluxos de trabalho da visão

#### 4.2 README Atualizado
- [ ] Reescrever foco no sistema G12
- [ ] Remover referências ao starter kit
- [ ] Adicionar instruções específicas

---

## 🔧 TAREFAS TÉCNICAS PRIORITÁRIAS

### **CRÍTICO (Fazer Primeiro)**
1. ✅ Corrigir item "ecommerce" na navegação
2. ✅ Atualizar package.json com nome correto
3. ✅ Atualizar app.ts com identidade G12
4. ✅ Remover links sociais do AI Coders

### **ALTO (Próximos Passos)**
1. Remover componentes de marketing
2. Limpar páginas demo desnecessárias
3. Atualizar README principal
4. Configurar dados demo G12

### **MÉDIO (Pode Aguardar)**
1. Documentação completa
2. Analytics específicos
3. Otimizações de performance
4. Testes específicos G12

---

## 📁 ESTRUTURA IDEAL PÓS-LIMPEZA

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                # 🏠 LANDING PAGE (Marketing)
│   │   ├── _components/            # Componentes da Landing
│   │   │   ├── hero-section.tsx        # ✅ Hero G12
│   │   │   ├── features-section.tsx    # ✅ Funcionalidades G12
│   │   │   ├── pricing-section.tsx     # ✅ Planos SaaS
│   │   │   ├── testimonials-section.tsx# ✅ Depoimentos igrejas
│   │   │   ├── stats-section.tsx       # ✅ Estatísticas crescimento
│   │   │   ├── cta-section.tsx         # ✅ Call-to-action demo
│   │   │   ├── whatsapp-float.tsx      # ✅ Captura leads
│   │   │   ├── navbar.tsx              # ✅ Nav landing
│   │   │   └── footer.tsx              # ✅ Footer landing
│   │   ├── app/                    # 🔒 SISTEMA INTERNO (Pós-login)
│   │   │   ├── (home)/                 # Dashboard principal G12
│   │   │   ├── cells/                  # Gestão de Células  
│   │   │   ├── leadership/             # Pipeline de Líderes
│   │   │   ├── levels-badges/          # Sistema de Níveis/Badges
│   │   │   ├── reports/                # Relatórios G12
│   │   │   ├── settings/               # Configurações
│   │   │   └── churches/               # Gestão de Igrejas
│   │   └── auth/                   # Autenticação
│   └── api/                        # APIs especializadas G12
├── components/
│   ├── G12/                        # Componentes específicos G12
│   ├── Dashboard/                  # Dashboards especializados  
│   ├── Landing/                    # Componentes da landing
│   ├── Forms/                      # Formulários eclesiásticos
│   └── Common/                     # Componentes compartilhados
└── config/
    ├── g12.ts                      # Configurações G12
    ├── app.ts                      # App config atualizado
    └── demo-g12-data.ts           # Dados demo G12
```

### **Separação Clara:**
- **🏠 Landing Page:** Marketing, captação, demonstração (público)
- **🔒 Sistema Interno:** Gestão G12 completa (usuários autenticados)

---

## ⚠️ CUIDADOS E CONSIDERAÇÕES

### **Não Remover (Manter do Starter Kit):**
- Sistema de autenticação Clerk
- Internacionalização (i18n) 
- Validações brasileiras (CPF, CNPJ, CEP)
- Sistema de formulários (Zod + React Hook Form)
- Gerenciamento de estado (Zustand)
- Estrutura base do Next.js 15
- Configuração Supabase
- TanStack Query (útil para cache)

### **Adaptar (Não Remover Completamente):**
- Dashboard principal (remover ecommerce, focar G12)
- Analytics (manter GA4, remover marketing)
- Configurações (adaptar para contexto G12)
- Temas (manter funcionalidade, adaptar cores)

---

## 🚀 CRONOGRAMA SUGERIDO

| Fase | Duração | Prioridade | Status |
|------|---------|------------|---------|
| Fase 1: Identidade | 1-2 dias | 🔴 Crítica | ⏳ Pendente |
| Fase 2: Limpeza | 2-3 dias | 🟡 Alta | ⏳ Pendente |
| Fase 3: Especialização | 3-5 dias | 🟡 Alta | ⏳ Pendente |
| Fase 4: Documentação | 2 dias | 🟢 Média | ⏳ Pendente |

**Total Estimado:** 8-12 dias de trabalho

---

## ✅ CRITÉRIOS DE SUCESSO

- [ ] Zero referências ao "AI Coders" ou "Starter Kit"
- [ ] Zero elementos de marketing/ecommerce
- [ ] Navegação 100% focada em funcionalidades G12
- [ ] Identidade visual e textual alinhada com visão G12
- [ ] Componentes demo substituídos por exemplos G12
- [ ] Documentação específica para o sistema G12
- [ ] README que explica o sistema G12, não o starter kit

---

## 📊 IMPACTO ESPERADO

### **Benefícios:**
- ✅ Sistema focado 100% na Visão G12
- ✅ Landing page otimizada para captação B2B eclesiástica
- ✅ Separação clara: marketing (público) vs sistema (privado)
- ✅ Analytics estratégicos para funil de vendas
- ✅ Melhor experiência para usuários eclesiásticos  
- ✅ Código mais limpo e especializado
- ✅ Identidade de marca consistente
- ✅ Performance otimizada

### **Riscos:**
- ⚠️ Remoção acidental de funcionalidades úteis
- ⚠️ Quebra de dependências entre componentes
- ⚠️ Tempo de desenvolvimento para especialização

---

**Documento preparado por:** Sistema de Análise  
**Próxima revisão:** Após conclusão da Fase 1  
**Responsável pela execução:** Equipe de desenvolvimento

---

*Este plano deve ser executado de forma iterativa, validando cada fase antes de prosseguir para a próxima.*