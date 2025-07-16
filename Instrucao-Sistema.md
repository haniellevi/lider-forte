# Líder Forte - Sistema G12

**Líder Forte** é uma plataforma completa de gestão para igrejas que seguem a Visão G12. Sistema operacional especializado que acelera o crescimento, multiplica células e desenvolve líderes através de tecnologia de ponta projetada especificamente para o contexto eclesiástico G12.

## Funcionalidades G12

- ⛪ **Gestão de Células**: CRUD completo de células com hierarquia G12
- 👥 **Pipeline de Líderes**: IA para identificação e desenvolvimento de liderança
- 🏆 **Escada do Sucesso**: Sistema gamificado de crescimento espiritual
- 📊 **Modos de Célula**: Estratégias direcionadas (Ganhar, Consolidar, Discipular, Enviar)
- 🔄 **Multiplicação Automatizada**: Sistema inteligente de multiplicação celular
- 📈 **Relatórios G12**: Analytics específicos para crescimento eclesiástico
- 🎯 **Hierarquia Dinâmica**: Visualização em tempo real da estrutura organizacional
- 🔐 **Autenticação Eclesiástica**: Sistema multi-tenant para múltiplas igrejas
- 🌍 **Internacionalização**: Suporte multilíngue com terminologias G12
- 📱 **Mobile-First**: Interface otimizada para líderes em movimento
- 🇧🇷 **Validações Brasileiras**: CPF, CNPJ, CEP específicos para o contexto nacional
- 🔄 **Real-time**: Notificações e atualizações em tempo real
- 🚀 **Next.js 15**: Performance otimizada com SSR e SSG
- 🛡️ **TypeScript**: Segurança de tipos completa

**Líder Forte** fornece tudo que sua igreja precisa para implementar a Visão G12 com excelência tecnológica. Acelere o crescimento, multiplique células e desenvolva líderes com ferramentas especializadas no contexto eclesiástico.

## Instalação

> **⚠️ IMPORTANTE:** Este projeto usa Clerk para autenticação multi-tenant e Supabase para banco de dados. Configure ambos antes de executar a aplicação. Veja a [documentação de configuração](./docs/02-configuration/) para instruções detalhadas.

1. Faça o download/fork/clone do repositório e, uma vez no diretório correto, é hora de instalar todas as dependências necessárias. Você pode fazer isso digitando o seguinte comando:

```
npm install
```
Se você estiver usando **Yarn** como gerenciador de pacotes, o comando será:

```
yarn install
```

2. **Configure a autenticação e banco de dados**:
   - [Configuração do Clerk (autenticação)](./docs/02-configuration/autenticacao.md)
   - [Configuração do Supabase (banco de dados)](./docs/02-configuration/supabase.md)
   - [Configuração específica G12](./docs/02-configuration/configuracao-g12.md)

3. Pronto, você está quase lá. Agora tudo que você precisa fazer é iniciar o servidor de desenvolvimento. Se você estiver usando **npm**, o comando é:

```
npm run dev
```
E se você estiver usando **Yarn**, é:

```
yarn dev
```

E voilà! Agora você está pronto para começar a usar o sistema G12. **Transforme sua igreja!** ⛪

## 🎓 Primeiros Passos com G12

Após a instalação, siga estes passos para configurar sua igreja:

1. **Acesse o sistema**: `http://localhost:3000`
2. **Faça login** com sua conta Clerk
3. **Configure sua igreja**: Use o [guia de configuração G12](./docs/02-configuration/configuracao-g12.md)
4. **Importe dados existentes**: Células, líderes e membros atuais
5. **Defina metas**: Estabeleça objetivos de crescimento
6. **Treine sua equipe**: Use a [documentação G12](./docs/01-getting-started/README-G12.md)

## 📝 Formulários Especializados G12

O sistema inclui formulários específicos para o contexto eclesiástico com validações brasileiras:

### Funcionalidades dos Formulários:
- ✅ **Validações Eclesiásticas**: Campos específicos para líderes, células e membros
- ✅ **Validações Brasileiras**: CPF, CNPJ, CEP, telefone brasileiro  
- ✅ **Consulta CEP**: Preenchimento automático de endereços
- ✅ **Hierarquia G12**: Formulários que respeitam a estrutura G12
- ✅ **Tempo Real**: Validação em tempo real com feedback visual
- ✅ **TypeScript**: Segurança de tipos completa

### Formulários Disponíveis:
- **Cadastro de Igreja**: Informações completas da organização
- **Gestão de Células**: Criação e edição de células
- **Cadastro de Líderes**: Perfis de liderança com hierarquia
- **Gestão de Membros**: Informações de membros com Escada do Sucesso
- **Configuração G12**: Metas, modos e configurações específicas

## 🏪 Gerenciamento de Estado Global com Zustand

Este starter kit utiliza **Zustand** como solução principal para gerenciamento de estado global, oferecendo uma alternativa leve e TypeScript-friendly ao Redux ou Context API:

### Funcionalidades de Estado:
- ✅ **Estado Global Unificado**: Tema, idioma, sidebar, notificações
- ✅ **Sincronização Automática**: Integração com next-themes e next-intl
- ✅ **Performance Otimizada**: Seletores individuais para evitar re-renders
- ✅ **TypeScript Completo**: Tipagem forte em toda a aplicação
- ✅ **DevTools**: Integração com Redux DevTools para debugging
- ✅ **Persistência**: Estado importante salvo automaticamente

### Stores Disponíveis:
```typescript
// Estados principais
import { 
  useTheme, useSetTheme,            // Tema (claro/escuro/sistema)
  useSidebarOpen, useToggleSidebar, // Estado da sidebar
  useShowToast, useNotifications,   // Notificações e toasts
  useLocale, useSetLocale,          // Idioma/localização
  useUser, useIsSignedIn            // Usuário e autenticação
} from '@/store';
```

### Exemplo de Uso:
```typescript
function ThemeToggle() {
  const currentTheme = useTheme();
  const setTheme = useSetTheme();
  const showToast = useShowToast();

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    showToast({
      type: 'success',
      message: `Tema alterado para ${newTheme}`
    });
  };

  return <button onClick={toggleTheme}>🌙</button>;
}
```

### Demonstração Completa:
Acesse `/state-management` para ver todos os recursos funcionando, incluindo:
- Troca de tema em tempo real
- Mudança de idioma com navegação automática
- Controle de sidebar responsivo  
- Sistema de notificações e toasts
- Estado de usuário sincronizado com Clerk

📖 **Documentação completa**: `/docs/04-architecture/state-management.md`

## 📱 Widget WhatsApp para Captura de Leads

Este starter kit inclui um **widget WhatsApp flutuante** completamente funcional para captura de leads, com integração a webhooks externos:

### ✅ **Funcionalidades do Widget:**
- **Interface Conversacional**: Simula uma conversa do WhatsApp para captura de nome e telefone
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Integração com Webhooks**: Envia dados capturados para sistemas externos (CRMs, n8n, Zapier, Make.com)
- **Configuração Flexível**: Múltiplos formatos de payload e transformações
- **Analytics**: Integração opcional com LogRocket para tracking
- **Segurança**: Rate limiting e validação de dados

### 🎯 **Como Usar:**
```typescript
// Widget automaticamente ativo quando WHATSAPP_WEBHOOK_URL estiver configurado
// Captura: nome, telefone, timestamp, URL da página
// Envia via POST para webhook configurado

// Configuração no .env.local
WHATSAPP_WEBHOOK_URL=https://seu-webhook-url.com/webhook
WHATSAPP_PHONE_NUMBER=5511999999999  // Seu número do WhatsApp
```

### 🔗 **Casos de Uso:**
- Captura de leads em landing pages
- Suporte ao cliente via WhatsApp
- Integração com sistemas de CRM
- Automação de marketing com n8n/Zapier

**Demonstração**: O widget aparece automaticamente quando configurado  
📖 **Documentação completa**: `/docs/05-features/whatsapp-widget.md`

## 🔄 Gerenciamento de Estado do Servidor com TanStack Query

Este starter kit inclui **TanStack Query (React Query)** **totalmente implementado** para gerenciamento eficiente de estado do servidor, oferecendo cache inteligente, sincronização de dados e otimizações automáticas:

### ✅ **Implementação Completa e Funcional:**
- **QueryClient** configurado com otimizações inteligentes
- **Provider** integrado com DevTools para desenvolvimento
- **Hooks de Query** para buscar dados (perfil, posts, etc.)
- **Hooks de Mutation** para operações CRUD com optimistic updates
- **Integração total** com Supabase RLS + Clerk JWT + Zustand

### 🚀 **Funcionalidades Avançadas:**
```typescript
// Queries com cache automático e tipos seguros
const { data: profile, isLoading } = useCurrentUserProfile();
const { data: posts = [] } = useMyPosts();

// Mutations com optimistic updates e rollback automático
const createPost = useCreatePost();
const updatePost = useUpdatePost();

// Operações com feedback visual via toast (Zustand)
await createPost.mutateAsync({
  title: "Novo Post",
  content: "Conteúdo...",
  published: true
});
// ✅ Cache atualizado automaticamente + toast de sucesso
```

### 🎯 **Demonstração Prática:**
**Acesse `/tanstack-query`** para ver uma demonstração completa funcionando:
- CRUD de posts com optimistic updates
- Gestão de perfil de usuário
- Estados de loading e error
- Cache automático e invalidação
- DevTools para debug (modo desenvolvimento)

### 📚 **Padrões de Uso:**
- **Zustand**: Estado do cliente (UI, tema, preferências)
- **TanStack Query**: Estado do servidor (API, cache, sincronização)
- **Integração**: Toast notifications via Zustand + cache invalidation automático

📖 **Documentação completa**: `/docs/05-features/tanstack-query.md`

## ⚙️ Sistema de Configuração Central

O starter kit possui um sistema de configuração centralizado que facilita a manutenção e personalização da aplicação:

### Configurações Disponíveis:
- 🏢 **Informações da Aplicação**: Nome, versão, descrição, URLs
- 🏛️ **Dados da Empresa**: Nome, endereço, informações legais
- 📞 **Contato**: Email, telefone, website
- 🌐 **Redes Sociais**: Links, usernames, cores personalizadas
- 🎨 **Tema**: Cores primárias, secundárias, modo escuro/claro
- 🎛️ **Features**: Flags de funcionalidades, modo manutenção
- 🔍 **SEO**: Meta tags, Open Graph, Twitter Cards

### Como Usar:
```typescript
// Importar configurações
import { getAppName, getCompanyName, getSocialLinks } from '@/config';

// Usar hooks reativos
const { app, company, social } = useAppConfig();

// Verificar features
const isMaintenanceMode = useFeature('maintenanceMode');

// Branding components
const { appName, logo, colors } = useBranding();
```

### Arquivos de Configuração:
- `src/config/app.ts` - Configuração principal da aplicação
- `src/config/constants.ts` - Constantes e padrões
- `src/config/demo-data.ts` - Dados de demonstração
- `src/hooks/useAppConfig.ts` - Hooks para acesso reativo

Toda a aplicação utiliza essas configurações centralizadas, eliminando hardcoding e facilitando atualizações em produção.

## 📊 Sistema de Analytics Integrado

O starter kit inclui **integração completa com múltiplas plataformas de analytics** para monitoramento e análise de dados:

### 🎯 **Plataformas Suportadas:**
- **Google Analytics 4 (GA4)**: Análise de tráfego e comportamento
- **Google Tag Manager (GTM)**: Gerenciamento centralizado de tags
- **Meta Pixel (Facebook)**: Tracking para campanhas de marketing
- **LogRocket**: Gravações de sessão e debugging em produção

### ⚙️ **Configuração Simples:**
```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX  
NEXT_PUBLIC_META_PIXEL_ID=123456789
NEXT_PUBLIC_LOGROCKET_APP_ID=your-app-id/your-app
```

### ✅ **Funcionalidades Incluídas:**
- **Configuração Automática**: Scripts carregados automaticamente quando configurados
- **Eventos Personalizados**: Tracking de ações específicas da aplicação
- **GDPR Compliance**: Controle de consentimento e privacidade
- **Development Mode**: Desabilitado automaticamente em desenvolvimento
- **Performance**: Carregamento assíncrono sem impacto na performance

### 🔍 **Monitoramento em Produção:**
- Sessões de usuário com LogRocket
- Funis de conversão com GA4
- Campanhas de marketing com Meta Pixel
- Tags personalizadas via GTM

📖 **Documentação completa**: `/docs/02-configuration/analytics.md`

## Funcionalidades em Destaque
**Componentes e Templates Modernos de Dashboard Next.js** - inclui uma variedade de **elementos de UI, componentes, páginas e exemplos** pré-construídos com design de alta qualidade.
Além disso, apresenta **autenticação, internacionalização e funcionalidades extensas** de forma integrada.

- Uma biblioteca com mais de **200** componentes e elementos de UI profissionais para dashboard.
- Cinco variações distintas de dashboard, atendendo a diversos casos de uso.
- Um conjunto abrangente de páginas essenciais de dashboard e admin.
- Mais de **45** arquivos **Next.js** prontos para uso.
- Estilização facilitada por arquivos **Tailwind CSS**.
- Um design que ressoa qualidade premium e alta estética.
- Um kit de UI útil com assets.
- Mais de dez aplicações web completas com exemplos.
- Suporte para **modo escuro** e **modo claro**.
- Integrações essenciais incluindo - Autenticação (**Clerk**), Internacionalização (**next-intl**), Validação (**Zod + React Hook Form**), **Configuração Central**, **Widget WhatsApp**, **Analytics** (GA4, GTM, Meta Pixel, LogRocket) e componentes modernos.
- Documentação detalhada e amigável ao usuário.
- Plugins e add-ons customizáveis.
- Compatibilidade com **TypeScript**.
- E muito mais!

Todas essas funcionalidades e mais fazem do **AI Coders Starter Kit** uma solução robusta e completa para todas as suas necessidades de desenvolvimento de dashboard.

