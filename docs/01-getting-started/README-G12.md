# Guia de Introdução - Líder Forte Sistema G12

Bem-vindo ao **Líder Forte**, a plataforma completa de gestão para igrejas que seguem a Visão G12. Este guia apresenta os conceitos fundamentais e como começar a usar o sistema.

## 🎯 O que é o Líder Forte?

O **Líder Forte** é um sistema operacional especializado que acelera o crescimento, multiplica células e desenvolve líderes através de tecnologia de ponta projetada especificamente para o contexto eclesiástico G12.

### ⛪ Especialização na Visão G12

Nossa plataforma foi desenvolvida exclusivamente para igrejas que seguem a Visão G12, incorporando:

- **Terminologias específicas** da Visão G12
- **Fluxos de trabalho** baseados nos 4 pilares: Ganhar, Consolidar, Discipular, Enviar
- **Hierarquia G12** com Pastor Principal, G12 Pastoral, Líderes de Célula e Timóteos
- **Métricas especializadas** para crescimento eclesiástico

## 🚀 Funcionalidades Principais

### 📊 **Dashboard G12**
- Visão panorâmica da igreja em tempo real
- Métricas de crescimento específicas G12
- Indicadores de saúde das células
- Alertas de multiplicação

### ⛪ **Gestão de Células**
- CRUD completo com hierarquia G12
- Sistema de multiplicação automatizada
- Modos estratégicos (Ganhar, Consolidar, Discipular, Enviar)
- Acompanhamento de reuniões e presença

### 👥 **Pipeline de Líderes**
- IA para identificação de potenciais líderes
- Acompanhamento de desenvolvimento
- Sistema de mentoria estruturada
- Métricas preditivas de liderança

### 🏆 **Escada do Sucesso**
- Gamificação do crescimento espiritual
- Pontuação baseada em atividades G12
- Badges e conquistas
- Acompanhamento de progresso individual

### 📈 **Relatórios Especializados**
- Analytics específicos para crescimento eclesiástico
- Relatórios de multiplicação
- Análise de saúde das células
- Projeções de crescimento

## 🔧 Configuração Inicial

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Clerk (autenticação)
- Conta no Supabase (banco de dados)
- Git instalado

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/lider-forte/lider-forte-g12.git
cd lider-forte-g12
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Configure Clerk e Supabase**
- Siga o guia de [configuração de autenticação](../02-configuration/autenticacao.md)
- Configure o banco de dados com [Supabase](../02-configuration/supabase.md)

5. **Execute o projeto**
```bash
npm run dev
```

## 🏗️ Arquitetura do Sistema

### **Tecnologias Utilizadas**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Autenticação**: Clerk (multi-tenant)
- **Banco de Dados**: Supabase (PostgreSQL)
- **UI/UX**: Tailwind CSS, Radix UI
- **Estado**: Zustand + TanStack Query
- **Formulários**: React Hook Form + Zod
- **Internacionalização**: next-intl

### **Estrutura de Pastas**

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── [locale]/
│   │   ├── page.tsx        # Landing Page
│   │   ├── app/            # Sistema interno (pós-login)
│   │   │   ├── dashboard/  # Dashboard G12
│   │   │   ├── cells/      # Gestão de Células
│   │   │   ├── leadership/ # Pipeline de Líderes
│   │   │   ├── reports/    # Relatórios
│   │   │   └── settings/   # Configurações
│   │   └── auth/           # Autenticação
│   └── api/                # APIs do sistema
├── components/             # Componentes React
│   ├── G12/               # Componentes específicos G12
│   ├── Dashboard/         # Dashboards especializados
│   └── Common/            # Componentes compartilhados
├── config/                # Configurações
│   ├── app.ts            # Config da aplicação
│   └── demo-g12-data.ts  # Dados demo G12
└── hooks/                 # Hooks customizados
```

## 🎭 Roles e Hierarquia G12

### **Pastor Principal**
- Acesso completo ao sistema
- Visão panorâmica da igreja
- Configurações organizacionais
- Relatórios executivos

### **G12 Pastoral**
- Supervisão de sua rede específica
- Acompanhamento de líderes diretos
- Relatórios de crescimento
- Mentoria e desenvolvimento

### **Líder de Célula**
- Gestão de sua célula
- Acompanhamento de membros
- Relatórios de presença
- Preparação de reuniões

### **Timóteo**
- Auxiliar do líder de célula
- Acesso progressivo às funcionalidades
- Desenvolvimento de liderança
- Mentoria estruturada

## 🎯 Modos de Célula

### 🔴 **Modo GANHAR**
- Foco em evangelismo
- Ferramentas de convite
- Métricas de visitantes
- Estratégias de atração

### 🟢 **Modo CONSOLIDAR**
- Cuidado com novos convertidos
- Acompanhamento personalizado
- Ferramentas de integração
- Métricas de retenção

### 🔵 **Modo DISCIPULAR**
- Ensino e aprofundamento
- Conteúdo educacional
- Acompanhamento de crescimento
- Métricas de maturidade

### 🟡 **Modo ENVIAR**
- Treinamento de líderes
- Preparação para multiplicação
- Identificação de potenciais líderes
- Métricas de prontidão

## 📊 Métricas G12

### **Crescimento**
- Número de células ativas
- Total de membros
- Crescimento mensal
- Taxa de multiplicação

### **Saúde das Células**
- Presença média
- Número de visitantes
- Conversões registradas
- Pontuação de saúde

### **Desenvolvimento de Liderança**
- Líderes em formação
- Progresso na Escada do Sucesso
- Tempo para multiplicação
- Taxa de retenção de líderes

## 🚀 Próximos Passos

1. **Configure seu ambiente** seguindo o [guia de instalação](../02-configuration/configuracoes.md)
2. **Explore os componentes** no [guia de desenvolvimento](../03-development/guia-desenvolvimento.md)
3. **Entenda a Visão G12** no [guia conceitual](./visao-g12-conceitos.md)
4. **Personalize para sua igreja** no [guia de customização](../04-customization/personalizacao.md)

## 📞 Suporte

- **Email**: suporte@liderforte.com.br
- **Documentação**: [docs.liderforte.com.br](https://docs.liderforte.com.br)
- **Comunidade**: [discord.gg/liderforte](https://discord.gg/liderforte)

---

**Transforme sua igreja com o poder da tecnologia G12!** 🚀⛪