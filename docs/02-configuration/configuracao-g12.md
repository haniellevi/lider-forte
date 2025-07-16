# Configuração do Sistema G12

Este guia explica como configurar o sistema Líder Forte para sua igreja, incluindo hierarquia, metas, modos de célula e personalizações específicas da Visão G12.

## 🏗️ Configuração Inicial da Igreja

### **1. Criando sua Igreja no Sistema**

```typescript
// Exemplo de configuração inicial
const churchConfig = {
  name: "Igreja Vida Nova",
  pastor: "Pr. João Silva",
  vision: "Ganhar, Consolidar, Discipular e Enviar",
  foundedAt: "2010-03-15",
  address: {
    street: "Rua da Fé, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310-100"
  },
  goals: {
    annualCells: 60,
    annualMembers: 800,
    annualLeaders: 65,
    multiplicationRate: 25
  }
};
```

### **2. Configurações Básicas**

**Informações da Igreja:**
- Nome oficial da igreja
- Pastor principal
- Visão e missão
- Data de fundação
- Endereço principal
- Contatos (telefone, email, site)

**Metas Organizacionais:**
- Número de células desejado
- Quantidade de membros alvo
- Líderes a serem formados
- Taxa de multiplicação anual

## 👥 Configuração de Hierarquia

### **1. Estrutura Hierárquica**

```typescript
// Exemplo de estrutura hierárquica
const hierarchyConfig = {
  pastorPrincipal: {
    maxG12Pastorals: 12,
    directReports: ["g12-pastoral-1", "g12-pastoral-2"]
  },
  g12Pastoral: {
    maxLeaders: 12,
    maxCells: 24,
    supervisionLevel: 2
  },
  liderCelula: {
    maxMembers: 15,
    maxTimoteos: 3,
    multiplicationThreshold: 12
  }
};
```

### **2. Níveis de Acesso**

**Pastor Principal:**
- Acesso total ao sistema
- Configurações organizacionais
- Relatórios executivos
- Gestão de permissões

**G12 Pastoral:**
- Supervisão de sua rede
- Relatórios de crescimento
- Aprovação de multiplicações
- Mentoria de líderes

**Líder de Célula:**
- Gestão da célula
- Acompanhamento de membros
- Relatórios de presença
- Desenvolvimento de Timóteos

**Timóteo:**
- Acesso progressivo
- Ferramentas de aprendizado
- Métricas de desenvolvimento
- Preparação para liderança

## 🎯 Configuração de Modos de Célula

### **1. Definindo Estratégias por Modo**

```typescript
const cellModeConfig = {
  ganhar: {
    duration: 6, // semanas
    activities: [
      "Campanhas de convite",
      "Eventos evangelísticos",
      "Testemunhos pessoais",
      "Ações sociais"
    ],
    metrics: [
      "visitorsCount",
      "conversionsCount", 
      "invitationsSent",
      "evangelisticEvents"
    ],
    goals: {
      minVisitors: 3,
      targetConversions: 1
    }
  },
  consolidar: {
    duration: 4,
    activities: [
      "Acompanhamento pessoal",
      "Curso de novos convertidos",
      "Integração social",
      "Mentoria espiritual"
    ],
    metrics: [
      "retentionRate",
      "courseCompletion",
      "mentoringHours",
      "spiritualGrowth"
    ],
    goals: {
      minRetention: 80,
      courseCompletion: 100
    }
  }
};
```

### **2. Rotação de Modos**

**Configurações de Rotação:**
- Duração padrão por modo
- Critérios para mudança
- Aprovação necessária
- Métricas de sucesso

**Flexibilidade:**
- Adaptação conforme necessidade
- Extensão de período
- Mudança antecipada
- Modos customizados

## 🏆 Configuração da Escada do Sucesso

### **1. Níveis e Pontuação**

```typescript
const ladderConfig = {
  levels: [
    {
      id: 1,
      name: "Presença na Célula",
      points: 10,
      requirements: ["Regular attendance"],
      badge: "Membro Fiel"
    },
    {
      id: 2,
      name: "Encontro com Deus",
      points: 100,
      requirements: ["Retreat participation"],
      badge: "Encontrou com Deus"
    },
    {
      id: 3,
      name: "Universidade da Vida",
      points: 150,
      requirements: ["Course completion"],
      badge: "Estudante da Palavra"
    }
  ],
  pointsConfig: {
    cellAttendance: 10,
    eventParticipation: 25,
    courseCompletion: 50,
    ministryService: 30,
    leadership: 100
  }
};
```

### **2. Sistema de Badges**

**Categorias de Badges:**
- Presença e constância
- Evangelismo e crescimento
- Estudo e conhecimento
- Serviço e ministério
- Liderança e multiplicação

**Critérios de Conquista:**
- Atividades específicas
- Tempo de engajamento
- Qualidade de performance
- Impacto nos resultados

## 📊 Configuração de Métricas

### **1. KPIs Principais**

```typescript
const metricsConfig = {
  church: {
    totalCells: { target: 60, current: 45 },
    totalMembers: { target: 800, current: 520 },
    monthlyGrowth: { target: 5, current: 3.2 },
    multiplicationRate: { target: 25, current: 15 }
  },
  cells: {
    averageSize: { target: 12, min: 8, max: 15 },
    attendance: { target: 85, min: 70 },
    visitors: { target: 2, min: 1 },
    health: { target: 80, min: 60 }
  },
  leaders: {
    development: { target: 12, current: 8 },
    readiness: { target: 80, min: 60 },
    retention: { target: 90, min: 80 },
    multiplication: { target: 6, current: 3 }
  }
};
```

### **2. Alertas e Notificações**

**Configuração de Alertas:**
- Células em risco (saúde < 60)
- Oportunidades de multiplicação
- Líderes prontos para promoção
- Metas não atingidas

**Tipos de Notificação:**
- Email automático
- Notificação no sistema
- Relatório semanal
- Dashboard em tempo real

## 🔄 Configuração de Multiplicação

### **1. Critérios de Multiplicação**

```typescript
const multiplicationConfig = {
  criteria: {
    minMembers: 12,
    maxMembers: 15,
    attendanceRate: 80,
    healthScore: 75,
    leaderReady: true,
    supervisorApproval: true
  },
  process: {
    preparation: 30, // dias
    execution: 7,    // dias
    followUp: 90     // dias
  },
  approval: {
    autoApprove: false,
    requireSupervisor: true,
    requirePastor: true
  }
};
```

### **2. Processo de Multiplicação**

**Fases do Processo:**
1. **Identificação**: Sistema detecta critérios
2. **Preparação**: Planejamento da divisão
3. **Aprovação**: Cadeia hierárquica
4. **Execução**: Criação da nova célula
5. **Acompanhamento**: Primeiros 90 dias

**Configurações Específicas:**
- Divisão de membros
- Escolha do novo líder
- Local da nova célula
- Cronograma de implementação

## 🎨 Personalização Visual

### **1. Identidade da Igreja**

```typescript
const visualConfig = {
  branding: {
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6", 
    accentColor: "#60a5fa",
    logo: "/images/church-logo.png",
    favicon: "/favicon-church.ico"
  },
  theme: {
    fontFamily: "Inter, sans-serif",
    borderRadius: "8px",
    shadows: "subtle"
  }
};
```

### **2. Customização de Interface**

**Elementos Personalizáveis:**
- Cores primárias e secundárias
- Logo da igreja
- Fonte tipográfica
- Estilo de botões
- Layout dos dashboards

**Configurações Avançadas:**
- Modo escuro personalizado
- Animações e transições
- Ícones customizados
- Layout responsivo

## 📱 Configuração Mobile

### **1. App Mobile (PWA)**

```typescript
const mobileConfig = {
  pwa: {
    enabled: true,
    name: "Igreja Vida Nova",
    shortName: "Vida Nova",
    description: "Sistema G12 Mobile",
    themeColor: "#1e40af",
    backgroundColor: "#ffffff",
    icon: "/images/pwa-icon.png"
  },
  notifications: {
    enabled: true,
    vapidKey: "your-vapid-key",
    types: ["reuniao", "multiplicacao", "meta"]
  }
};
```

### **2. Notificações Push**

**Tipos de Notificação:**
- Lembretes de reunião
- Alertas de multiplicação
- Novos membros
- Metas atingidas
- Eventos importantes

**Configurações:**
- Horários permitidos
- Frequência máxima
- Personalização por usuário
- Opt-in/opt-out

## 🔧 Configurações Técnicas

### **1. Variáveis de Ambiente**

```bash
# .env.local
# Configurações G12
G12_MAX_CELL_SIZE=15
G12_MIN_MULTIPLICATION_SIZE=12
G12_DEFAULT_MODE_DURATION=6
G12_HEALTH_THRESHOLD=70

# Configurações da Igreja
CHURCH_NAME="Igreja Vida Nova"
CHURCH_PASTOR="Pr. João Silva"
CHURCH_TIMEZONE="America/Sao_Paulo"
CHURCH_LOCALE="pt-BR"

# Métricas e Metas
ANNUAL_CELL_TARGET=60
ANNUAL_MEMBER_TARGET=800
MULTIPLICATION_RATE_TARGET=25
```

### **2. Configurações de Performance**

**Otimizações:**
- Cache de dados frequentes
- Lazy loading de componentes
- Compressão de imagens
- CDN para assets estáticos

**Monitoramento:**
- Métricas de performance
- Alertas de lentidão
- Logs de erro
- Analytics de uso

## 📋 Checklist de Configuração

### **Configuração Inicial**
- [ ] Informações básicas da igreja
- [ ] Estrutura hierárquica
- [ ] Metas organizacionais
- [ ] Configuração de usuários

### **Personalização**
- [ ] Logo e cores da igreja
- [ ] Configuração de modos
- [ ] Escada do sucesso
- [ ] Sistema de badges

### **Operacional**
- [ ] Critérios de multiplicação
- [ ] Alertas e notificações
- [ ] Métricas e KPIs
- [ ] Relatórios personalizados

### **Técnico**
- [ ] Variáveis de ambiente
- [ ] Configurações de performance
- [ ] Backup e segurança
- [ ] Monitoramento

## 🎯 Próximos Passos

1. **Complete a configuração inicial** usando este guia
2. **Importe dados existentes** da sua igreja
3. **Configure usuários e permissões** para sua equipe
4. **Personalize métricas e metas** específicas
5. **Treine sua equipe** no uso do sistema

## 📞 Suporte

Para dúvidas na configuração:
- **Email**: configuracao@liderforte.com.br
- **WhatsApp**: +55 (11) 99999-9999
- **Documentação**: [docs.liderforte.com.br/configuracao](https://docs.liderforte.com.br/configuracao)

---

*Configuração completa é essencial para maximizar os benefícios do sistema G12!*