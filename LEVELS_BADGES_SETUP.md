# Sistema de Níveis e Badges - Guia de Implementação

Este documento fornece as instruções para implementar completamente o sistema de níveis e badges para complementar a Escada do Sucesso G12.

## 📋 Resumo da Implementação

O sistema foi implementado seguindo as especificações fornecidas, incluindo:

### 🗄️ Estrutura de Banco de Dados
- **Tabela `ladder_levels`**: Define os níveis hierárquicos da Escada do Sucesso
- **Tabela `badges`**: Define os badges de conquista disponíveis
- **Tabela `member_badges`**: Rastreia os badges conquistados por cada membro

### 🎯 Funcionalidades Implementadas
- Sistema de níveis hierárquicos (10 níveis da Visão G12)
- Sistema de badges por categoria (frequência, liderança, aprendizado, serviço, especial)
- Verificação automática de badges baseada em critérios
- Ranking com níveis e badges
- Interface completa para visualização e gerenciamento

## 🚀 Passos para Ativação

### 1. Executar a Migração

Execute a migração para criar as tabelas e funções necessárias:

```bash
# No diretório do projeto
cd supabase

# Execute a migração específica
npx supabase db push --include-all

# Ou execute especificamente:
npx supabase db reset --debug
```

### 2. Verificar as Tabelas Criadas

Após a migração, verifique se as seguintes tabelas foram criadas:
- `ladder_levels` (com 10 níveis pré-populados)
- `badges` (com badges padrão por categoria)
- `member_badges` (inicialmente vazia)

### 3. Testar os Endpoints

Os seguintes endpoints foram criados e devem estar funcionais:

```bash
# Listar níveis
GET /api/protected/ladder/levels

# Listar badges
GET /api/protected/ladder/badges

# Obter badges de um membro
GET /api/protected/ladder/member/{id}/badges

# Obter nível atual de um membro
GET /api/protected/ladder/member/{id}/level

# Ranking com níveis
GET /api/protected/ladder/leaderboard

# Conceder badge manualmente
POST /api/protected/ladder/member/{id}/badges
```

### 4. Acessar a Interface

Acesse a nova página de níveis e badges:
```
http://localhost:3000/app/levels-badges
```

## 📊 Dados Pré-populados

### Níveis da Escada do Sucesso (10 níveis)
1. **Visitante** (0-49 pts) - Conhecendo a igreja e a Visão G12
2. **Membro** (50-149 pts) - Membro ativo da igreja
3. **Consolidado** (150-299 pts) - Passou pelo Encontro e está consolidado
4. **Discípulo** (300-599 pts) - Em processo de discipulado ativo
5. **Timóteo** (600-999 pts) - Líder em formação, auxiliar direto
6. **Líder Potencial** (1000-1999 pts) - Pronto para liderar célula
7. **Líder** (2000-3999 pts) - Liderando célula ativa
8. **Supervisor** (4000-7999 pts) - Supervisionando múltiplas células
9. **Pastor** (8000-15999 pts) - Liderança pastoral da igreja
10. **Líder Sênior** (16000+ pts) - Máximo nível de liderança

### Badges por Categoria

#### 🎯 Frequência
- Mês Perfeito (100% presença mensal)
- Consistência Trimestral (90%+ presença trimestral)
- Guerreiro Anual (80%+ presença anual)
- Frequentador Fiel (70%+ presença mensal)

#### 👑 Liderança
- Primeiro Timóteo
- Mentor (treinar 3 Timóteos)
- Multiplicador (primeira multiplicação)
- Líder Nato
- Supervisor Experiente

#### 📚 Aprendizado
- Estudante Dedicado (5 módulos)
- Graduado da Vida
- Mestre do Destino
- Aprendiz Consistente (3 cursos)
- Sábio da Palavra (10 módulos)

#### 🤝 Serviço
- Voluntário Dedicado (10 serviços)
- Servo Fiel (50 serviços)
- Ministro Ativo
- Primeiro Serviço
- Coração de Servo (25 serviços)

#### ⭐ Especial
- Pioneiro
- Aniversariante
- Veterano (5 anos)
- Fundador

## 🔧 Funcionalidades Automáticas

### Verificação Automática de Badges
O sistema inclui triggers que automaticamente:
- Verificam se membros merecem novos badges quando pontos são atualizados
- Concedem badges automaticamente baseado em critérios
- Criam notificações quando badges são conquistados

### Cálculo de Níveis
- Função `get_member_level()` calcula automaticamente o nível baseado na pontuação
- Calcula progresso percentual para o próximo nível
- Determina pontos necessários para avançar

### Ranking Aprimorado
- Função `get_church_leaderboard_with_levels()` inclui informações de nível e badges
- Ordenação por pontuação com detalhes visuais de nível
- Contagem de badges por membro

## 🎨 Componentes React Criados

### Componentes Principais
- `LevelCard` - Exibe informações de um nível
- `BadgeCard` - Exibe um badge (conquistado ou não)
- `LevelProgressIndicator` - Mostra progresso atual do membro
- `BadgeCollection` - Coleção completa de badges
- `EnhancedLeaderboard` - Ranking com níveis e badges

### Hooks Personalizados
- `useBadges` - Gerenciamento de badges
- `useLevels` - Gerenciamento de níveis
- `useMemberLevel` - Nível específico de um membro
- `useLeaderboard` - Ranking aprimorado

## 🔒 Segurança e Permissões

### RLS (Row Level Security)
- Políticas de acesso baseadas em igreja (church_id)
- Usuários só veem dados de sua própria igreja
- Líderes podem gerenciar badges de membros em suas células
- Pastores têm acesso completo de administração

### Validações
- Prevenção de badges duplicados
- Validação de critérios antes de conceder badges
- Verificação de permissões para operações administrativas

## 🚦 Próximos Passos Recomendados

### 1. Testar em Desenvolvimento
- Execute a migração em ambiente local
- Teste todos os endpoints
- Verifique a interface na página `/app/levels-badges`

### 2. Configurar Critérios Personalizados
- Ajuste os critérios dos badges conforme necessário
- Adicione novos badges específicos para sua igreja
- Configure atividades que concedem pontos automaticamente

### 3. Integrar com Sistema Existente
- Conecte com o sistema de presença para badges de frequência
- Integre com cursos/treinamentos para badges de aprendizado
- Configure eventos de serviço para badges de voluntariado

### 4. Deploy para Produção
- Execute migrações no ambiente de produção
- Configure monitoramento dos triggers automáticos
- Teste performance com dados reais

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase para erros de migração
2. Teste os endpoints individualmente
3. Consulte a documentação dos componentes React
4. Verifique as políticas RLS se houver problemas de acesso

---

**Status**: ✅ Implementação Completa
**Versão**: 1.0
**Data**: 15 de Julho de 2025