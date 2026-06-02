# Portal de Estagiários SOCEM — Funcionalidades Completas

## 1. Autenticação e Contas

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 1.1 | **Login OAuth** | Autenticação via OAuth (Manus/deploy) com callback |
| 1.2 | **Login Local** | Login com username/password para desenvolvimento local |
| 1.3 | **Logout** | Término de sessão com limpeza de cookie |
| 1.4 | **Recuperação de Password** | Sistema de reset de password com token por email |
| 1.5 | **Roles de Utilizador** | Três níveis: `admin` (acesso total), `tutor` (gestão de planos/tarefas), `estagiario` (apenas o seu plano) |
| 1.6 | **Sessão Persistente** | Cookie de sessão JWT com refresh automático |
| 1.7 | **Proteção de Rotas** | Acesso restrito por role com redirect para login |

## 2. Dashboard

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 2.1 | **Visão Geral (Admin/Tutor)** | Métricas: estagiários ativos, planos em curso, tarefas pendentes, taxa de conclusão |
| 2.2 | **Planos Recentes** | Lista dos últimos planos criados com acesso rápido |
| 2.3 | **Utilizadores Recentes** | Lista dos últimos utilizadores com role e presença |
| 2.4 | **Progresso Geral** | Barra de progresso global com percentagem de conclusão |
| 2.5 | **Dashboard do Estagiário** | Saudação personalizada com nome, data, progresso global |
| 2.6 | **O Que Fazer Hoje** | Tarefas em atraso e com prazo hoje, com indicadores de urgência |
| 2.7 | **Tarefas Sem Prazo** | Lista de tarefas sem data definida |
| 2.8 | **Check-in Diário** | Registo de humor (ótimo/bom/ok/mau/terrível) com nota opcional |
| 2.9 | **Sequência (Streak)** | Contagem de dias consecutivos de check-in |
| 2.10 | **Distintivos (Badges)** | Badges por conquistas (7 dias, 30 dias de streak) |
| 2.11 | **Próximas Tarefas** | Tarefas dos próximos dias ordenadas por data |
| 2.12 | **Linha do Tempo** | Barras de progresso temporal dos planos atribuídos |
| 2.13 | **Os Meus Planos** | Lista de planos atribuídos ao estagiário |
| 2.14 | **Atalhos Rápidos** | Acesso rápido a Mensagens, Calendário, Tarefas, Norte (IA) |

## 3. Gestão de Utilizadores (Admin/Tutor)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 3.1 | **Listar Utilizadores** | Tabela com todos os utilizadores ativos, filtros por nome/role |
| 3.2 | **Criar Utilizador** | Formulário com nome, email, username, password, role, departamento, cargo |
| 3.3 | **Editar Utilizador** | Edição de dados, role, password |
| 3.4 | **Desativar Conta** | Desativação lógica (isActive = false) |
| 3.5 | **Avatar** | Upload de foto de perfil |
| 3.6 | **Presença** | Estado online/ausente/offline visível nos perfis |
| 3.7 | **Mudar Password** | Alteração de password com confirmação da atual |

## 4. Planos de Integração

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 4.1 | **Listar Planos** | Todos os planos com status, progresso, datas |
| 4.2 | **Criar Plano** | Formulário com título, descrição (Markdown), datas de início/fim, atribuição a utilizador |
| 4.3 | **Editar Plano** | Edição de dados, status (draft/active/completed/archived) |
| 4.4 | **Eliminar Plano** | Eliminação permanente (admin/tutor) |
| 4.5 | **Detalhe do Plano** | Página com tasks, progresso, estagiários atribuídos |
| 4.6 | **Atribuir Plano** | Associação de plano a estagiário com data de início e fim esperado |
| 4.7 | **Progresso do Plano** | Barra de progresso com contagem de tarefas concluídas/pendentes/em progresso |
| 4.8 | **Auto-complete** | Plano marcado como concluído automaticamente quando todas as tarefas estão completas |
| 4.9 | **Texto Markdown** | Descrição dos planos suporta formatação Markdown |

## 5. Tarefas

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 5.1 | **Lista de Tarefas** | Vista em lista agrupada por plano |
| 5.2 | **Kanban Board** | Vista em colunas (Pendente / Em Progresso / Concluída) com drag-and-drop |
| 5.3 | **Criar Tarefa** | Formulário com título, descrição, data de início, data de fim, responsável |
| 5.4 | **Editar Tarefa** | Alteração de título, descrição, status, datas, ordem |
| 5.5 | **Eliminar Tarefa** | Eliminação com confirmação |
| 5.6 | **Mudar Estado** | Ciclo Pendente → Em Progresso → Concluída (com permissions) |
| 5.7 | **Drag-and-Drop** | Arrastar tarefas entre colunas Kanban para mudar estado |
| 5.8 | **Reordenação** | Arrastar tarefas dentro da mesma coluna para reordenar |
| 5.9 | **Filtro por Estado** | Filtrar por Todas / Pendentes / Em Progresso / Concluídas |
| 5.10 | **Painel Lateral** | Detalhes da tarefa com comentários e anexos |
| 5.11 | **Comentários** | Adicionar/eliminar comentários em cada tarefa |
| 5.12 | **Anexos** | Upload de ficheiros (PDF, imagens, documentos) por tarefa |
| 5.13 | **Indicador de Urgência** | Cores e labels: "Em atraso!", "Hoje", "Amanhã", X dias |
| 5.14 | **Data de Início** | Campo opcional startDate nas tarefas |
| 5.15 | **Data de Fim** | Campo opcional dueDate nas tarefas |

## 6. Calendário

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 6.1 | **Vista Mensal** | Grid de calendário com navegação entre meses |
| 6.2 | **Marcadores de Tarefas** | Marcadores coloridos nos dias com tarefas (dueDate = cor primária, startDate = teal) |
| 6.3 | **Marcadores de Planos** | Marcadores verdes (início do plano) e roxos (fim do plano) |
| 6.4 | **Dia Hoje** | Destaque visual no dia atual |
| 6.5 | **Dia Selecionado** | Destaque visual no dia clicado |
| 6.6 | **Painel Lateral** | Tarefas e eventos do dia selecionado |
| 6.7 | **Agendar Tarefa** | Modal para criar tarefa diretamente no calendário |
| 6.8 | **Ver Tarefas Agendadas** | Modal com lista de todas as tarefas com data |
| 6.9 | **Os Meus Planos** | Sidebar com planos ativos e acesso rápido |
| 6.10 | **Resumo** | Contagem de planos, tarefas agendadas, concluídas, pendentes |
| 6.11 | **Botão Hoje** | Voltar ao mês/dia atual |
| 6.12 | **Contagem de Agendadas** | Badge com número de tarefas com data |

## 7. Mensagens

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 7.1 | **Lista de Conversas** | Contactos disponíveis com última mensagem |
| 7.2 | **Chat em Tempo Real** | Conversa com histórico cronológico |
| 7.3 | **Envio de Ficheiros** | Anexar ficheiros nas mensagens |
| 7.4 | **Indicador de Leitura** | Mensagens lidas/não lidas |
| 7.5 | **Contagem de Não Lidas** | Badge por conversa |
| 7.6 | **Marcar como Lidas** | Automático ao abrir conversa |

## 8. Relatórios (Admin/Tutor)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 8.1 | **Taxa de Conclusão Global** | Percentagem geral de tarefas concluídas |
| 8.2 | **Planos Concluídos** | Número de planos finalizados |
| 8.3 | **Tempo Médio de Onboarding** | Dias médios para conclusão dos planos |
| 8.4 | **Progresso por Departamento** | Métricas agregadas por departamento |
| 8.5 | **Estatísticas Mensais** | Gráfico de novos estagiários por mês |
| 8.6 | **Exportar PDF** | Download de relatório em PDF |
| 8.7 | **Exportar Excel** | Download de relatório em Excel (.xlsx) |

## 9. Registo de Atividade (Admin/Tutor)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 9.1 | **Feed de Atividades** | Log cronológico de ações (criação de planos, conclusão de tarefas, etc.) |
| 9.2 | **Filtro por Tipo** | Filtrar por task/plan/user/assignment |

## 10. Perfil do Estagiário

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 10.1 | **Cartão de Perfil** | Foto, nome, email, departamento, cargo, role |
| 10.2 | **Planos de Integração** | Lista de planos atribuídos com progresso |
| 10.3 | **Progresso por Plano** | Barra de progresso, tarefas concluídas/pendentes |
| 10.4 | **Datas dos Planos** | Início e fim esperado de cada plano |
| 10.5 | **Gráfico de Humor (30 dias)** | Bar chart com a evolução do humor dos últimos 30 dias |
| 10.6 | **Certificado de Conclusão** | Geração de PDF quando todos os planos estão concluídos |
| 10.7 | **Editar Perfil** | Redirecionamento para Definições |

## 11. Definições

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 11.1 | **Editar Perfil** | Nome, email |
| 11.2 | **Tema Claro/Escuro** | Alternância entre temas |
| 11.3 | **Notificações** | Lista de notificações recebidas |
| 11.4 | **Segurança** | Alteração de password |
| 11.5 | **Upload de Avatar** | Foto de perfil |

## 12. Ajuda / Tour Guiado

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 12.1 | **Guia de Utilização** | Página com documentação de cada secção |
| 12.2 | **Tour Interativo** | Overlay com spotlight e tooltips para cada página |
| 12.3 | **Passos por Role** | Tour adaptado ao role do utilizador |
| 12.4 | **Rever Tour** | Botão para reiniciar o tour a qualquer momento |
| 12.5 | **Navegação por Teclado** | Setas + Enter + ESC para navegar no tour |
| 12.6 | **Indicador de Progresso** | Bolinhas mostrando o passo atual no tour |

## 13. Norte — Assistente IA

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 13.1 | **Chat com IA** | Assistente virtual especializado no portal |
| 13.2 | **Quota Diária** | Limite de mensagens por role (estagiário: 20, tutor: 100, admin: ilimitado) |
| 13.3 | **Ferramentas (Tool Calling)** | Acesso a dados reais: users, plans, tasks, metrics |
| 13.4 | **Interface Flutuante** | Botão flutuante para acesso rápido ao chat |
| 13.5 | **Modal Dedicado** | Página `/ai-assist` com chat completo |

## 14. Notificações

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 14.1 | **Sino de Notificações** | Badge com contagem de não lidas na barra superior |
| 14.2 | **Dropdown de Notificações** | Lista das últimas 10 notificações |
| 14.3 | **Marcar como Lida** | Clique na notificação marca como lida |
| 14.4 | **Marcar Todas como Lidas** | Botão para limpar todas |
| 14.5 | **Notificações de Sistema** | Alertas de sistema, mensagens, tarefas |
| 14.6 | **Notificações de Badges** | Ao desbloquear distintivos |
| 14.7 | **Notificações de Tarefas em Atraso** | Job automático a cada 5 minutos que notifica quando dueDate passou |
| 14.8 | **Link nas Notificações** | Redirecionamento para página relevante ao clicar |

## 15. Barra de Pesquisa Global

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 15.1 | **Pesquisa por Utilizadores** | Procurar por nome |
| 15.2 | **Pesquisa por Planos** | Procurar por título |
| 15.3 | **Atalho Ctrl+K** | Abrir pesquisa global rapidamente |
| 15.4 | **Navegação por Setas** | Navegar resultados com teclado |

## 16. Check-in de Humor

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 16.1 | **Registo Diário** | Escolher humor entre 5 níveis (😄😃😐😟😢) |
| 16.2 | **Nota Opcional** | Texto livre sobre o dia |
| 16.3 | **Limite de Um por Dia** | Apenas um check-in por dia (CONFLICT se duplicado) |
| 16.4 | **Streak de Dias** | Contagem de dias consecutivos |
| 16.5 | **Badges por Streak** | 7 dias e 30 dias com notificação |
| 16.6 | **Recorde Pessoal** | Maior streak já alcançada |
| 16.7 | **Gráfico no Perfil** | Visualização dos últimos 30 dias de humor |

## 17. Interface e UX

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 17.1 | **Sidebar Redimensionável** | Arrastar borda para ajustar largura |
| 17.2 | **Sidebar Collapsible** | Colapsar/expandir com botão |
| 17.3 | **Tema Claro/Escuro** | Suporte completo com TailwindCSS |
| 17.4 | **Responsividade** | Adaptável a mobile/desktop |
| 17.5 | **Animações** | Transições suaves (framer-motion) |
| 17.6 | **Toast Notifications** | Feedback visual (sonner) |
| 17.7 | **Loading States** | Skeleton loading, spinners |
| 17.8 | **Empty States** | Mensagens amigáveis quando não há dados |
| 17.9 | **Aviso de Logout** | Modal ao fechar navegador com sessão ativa |

## 18. Base de Dados

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 18.1 | **MySQL via Drizzle ORM** | Schema tipado com migrations |
| 18.2 | **Fallback In-Memory** | Ficheiro JSON local quando não há BD (`data/local-db.json`) |
| 18.3 | **Migrations Automáticas** | Criação de tabelas + ALTER TABLE em init |
| 18.4 | **Tabelas:** users, onboarding_plans, onboarding_tasks, plan_assignments, task_completions, task_comments, task_attachments, direct_messages, notifications, daily_checkins, ai_usage |

## 19. Armazenamento de Ficheiros

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 19.1 | **Upload via API** | Endpoint `/api/storage/upload` |
| 19.2 | **AWS S3 Presigner** | Geração de URLs pré-assinadas para upload/download |
| 19.3 | **Proxy Local** | Fallback para armazenamento local |

## 20. API (tRPC)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 20.1 | **Auth** | me, logout, updateTheme, updateAvatar, updatePresence |
| 20.2 | **Users** | list, getById, create, update, deactivate, delete, updateSelf, changePassword |
| 20.3 | **Plans** | list, getById, create, update, delete |
| 20.4 | **Tasks** | listAll, getByPlanId, create, update, delete |
| 20.5 | **Assignments** | getByUserId, getByPlanId, assign, updateProgress |
| 20.6 | **Task Completions** | getByUserId, create, update |
| 20.7 | **Task Comments** | getByTaskId, create, delete |
| 20.8 | **Task Attachments** | getByTaskId, create, delete |
| 20.9 | **Messages** | getConversation, send, unreadCounts |
| 20.10 | **Notifications** | list, unreadCount, markAsRead, markAllAsRead |
| 20.11 | **Daily Checkins** | today, history, create |
| 20.12 | **AI** | quota, chat |
| 20.13 | **Dashboard** | metrics, activityLog, myProgress, myStreak, myBadges, certificateStatus |
| 20.14 | **System** | heartbeat (cron jobs) |

## 21. Outros

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 21.1 | **Novo Colaborador** | Página/popup de boas-vindas para novos utilizadores |
| 21.2 | **Portal Selector** | Seletor de portal/app |
| 21.3 | **Forgot Password** | Fluxo completo de recuperação de password |
| 21.4 | **Mapa** | Componente de mapa (Google Maps) |
| 21.5 | **Geração de Imagens** | Endpoint para geração de imagens via IA |
| 21.6 | **Transcrição de Voz** | Conversão de áudio para texto |
| 21.7 | **Email Colaborador** | Envio de email para novos colaboradores |
| 21.8 | **Activity Log** | Registo de ações com user, ação, descrição, entidade |
| 21.9 | **Certificado PDF** | Geração de certificado de conclusão com jsPDF |
| 21.10 | **Error Boundary** | Componente de fallback para erros React |
