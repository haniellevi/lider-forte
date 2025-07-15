2. Estágio Atual do Projeto e Próximos Passos
Após uma análise detalhada do PRD, o projeto concluiu com sucesso a Fase 1: Fundação Técnica (Semanas 1-2). A infraestrutura está pronta e a base de dados preparada.

Agora, o projeto está iniciando a Fase 2: Módulos Core (Semanas 3-6).

Próximos Passos Imediatos: Implementação da Semana 3
O foco para a próxima sprint de desenvolvimento é a Gestão de Igrejas e Usuários.

Funcionalidades a serem implementadas (conforme PRD, seção 6.3):

CRUD de Igrejas: Permitir que o administrador principal crie e gerencie os dados da igreja.
Gestão de Usuários: CRUD avançado de usuários, incluindo validações para dados brasileiros (CPF, CEP, etc.).
Sistema de Convites: Funcionalidade para convidar novos usuários para a plataforma.
Dashboard Administrativo: Uma visão inicial para o Pastor Principal com métricas básicas.
Para executar estas tarefas, as seguintes ações devem ser tomadas, seguindo os padrões dos agents:

Ações de Desenvolvimento (Semana 3):

1. Backend (API Endpoints)
Guia do Agente: Usar agents/feature-crud.md e agents/backend-api-endpoint.md.
Tarefa: Criar os seguintes endpoints de API na pasta /src/app/api/protected/:
churches/route.ts: Endpoint para CRUD de Igrejas.
users/route.ts: Endpoint para CRUD de Usuários.
invites/route.ts: Endpoint para criar e gerenciar convites.
Validação: Implementar a validação dos dados de entrada usando Zod, especialmente para os campos com formatos brasileiros.

Você disse que os Próximos passos recomendados são:

  1. Testes de Integração - Validar APIs e RLS
  2. Frontend Components - Criar interfaces para as APIs
  3. Gamificação - Implementar Escada do Sucesso
  4. Relatórios - Dashboard executivo
  5. Multiplicação - Algoritmos automáticos

Compare com esses passos abaixo e verifique se seu plano pode ser melhorado. Verifica isso lendo o arquivo @README.md e o @agents/README.md

2. Frontend (Páginas e Componentes)
Guia do Agente: Usar agents/frontend-page.md e agents/frontend-form.md.
Tarefa: Criar as páginas na pasta /src/app/[locale]/app/:
settings/church/page.tsx: Página com o formulário de configuração da igreja (ChurchSetupForm).
users/page.tsx: Página para listar e gerenciar usuários, utilizando um componente UserManagementTable.
Componentes:
Desenvolver o ChurchSetupForm com validação em tempo real.
Desenvolver a UserManagementTable com busca e filtros.
Criar um InviteUserModal para o envio de convites.
Estado do Servidor: Utilizar o TanStack Query (conforme agents/tanstack-query-integration.md) para buscar e atualizar os dados das igrejas e usuários, garantindo cache e sincronização automática