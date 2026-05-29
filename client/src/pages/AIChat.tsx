// =============================================================================
// PATCH 3 — client/src/pages/AIChat.tsx
// Ficheiro completo — substitui o ficheiro existente.
//
// O que muda:
//  1. Mensagem de boas-vindas personalizada (igual ao floating, mas com mais
//     detalhe por ser a página dedicada).
//  2. Sugestões de prompts adaptadas ao papel.
//  3. Secção "Estado atual" visível para estagiários (planos + progresso)
//     com botões de atalho para perguntas comuns.
// =============================================================================

import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { AlertCircle, BarChart3, Infinity, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Sugestões por papel ───────────────────────────────────────────────────────
function getSuggestedPrompts(role: string): string[] {
  if (role === "estagiario") {
    return [
      "Quais são as minhas tarefas para hoje?",
      "Tenho alguma tarefa em atraso?",
      "Como estou a progredir no meu plano?",
      "O que devo fazer a seguir no meu onboarding?",
      "Como marco uma tarefa como concluída?",
    ];
  }
  if (role === "tutor") {
    return [
      "Quais os estagiários com tarefas em atraso?",
      "Mostra-me os planos ativos",
      "Como criar um novo plano de integração?",
      "Como atribuir um plano a um estagiário?",
      "Qual é a taxa de conclusão geral?",
    ];
  }
  return [
    "Mostra-me as métricas do dashboard",
    "Quais os estagiários com mais tarefas em atraso?",
    "Como criar um utilizador novo?",
    "Mostra-me todos os planos ativos",
    "Qual é o progresso geral dos planos?",
  ];
}

// ── Mensagem de boas-vindas completa (página dedicada) ────────────────────────
function buildWelcomeMessage(user: any, plans: any[]): Message {
  if (!user) {
    return {
      role: "assistant",
      content: "Olá! 👋 Sou o **Norte** 🧭, o assistente virtual do **Portal de Estagiários SOCEM**.\n\nPergunta-me sobre:\n- As tuas tarefas e prazos\n- Como navegar na aplicação\n- Progresso no onboarding\n- Qualquer dúvida sobre o portal",
    };
  }

  const firstName = user.name?.split(" ")[0] ?? "olá";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (user.role === "estagiario") {
    const activePlans = (plans ?? []).filter((p: any) => p.status === "active");
    let content = `${greeting}, **${firstName}**! 👋 Sou o **Norte** 🧭, o teu guia no Portal SOCEM.\n\n`;

    if (activePlans.length > 0) {
      content += `Estás inscrito em **${activePlans.length} plano${activePlans.length > 1 ? "s" : ""} ativo${activePlans.length > 1 ? "s" : ""}**. `;
      content += "Podes perguntar-me:\n";
      content += "- Quais são as minhas tarefas?\n";
      content += "- Tenho tarefas em atraso?\n";
      content += "- Como está o meu progresso?\n";
      content += "- O que devo fazer a seguir?\n\n";
      content += "O que queres saber?";
    } else {
      content += "Ainda não tens nenhum plano atribuído. Fala com o teu tutor para que te atribua um plano de integração.\n\nPodes perguntar-me qualquer coisa sobre como funciona o portal!";
    }

    return { role: "assistant", content };
  }

  if (user.role === "tutor") {
    return {
      role: "assistant",
      content: `${greeting}, **${firstName}**! 👋 Sou o **Norte** 🧭.\n\nComo tutor, posso ajudar-te a:\n- Ver o progresso dos teus estagiários\n- Identificar tarefas em atraso\n- Criar e gerir planos de integração\n- Consultar métricas e relatórios\n\nO que precisas?`,
    };
  }

  return {
    role: "assistant",
    content: `${greeting}, **${firstName}**! 👋 Sou o **Norte** 🧭.\n\nComo administrador, tens acesso a todos os dados do sistema. Posso ajudar-te a:\n- Consultar métricas globais\n- Verificar estado dos planos e estagiários\n- Navegar nas funcionalidades de gestão\n\nO que queres saber?`,
  };
}

export default function AIChat() {
  const { user } = useAuth();
  const [limitReached, setLimitReached] = useState(false);

  const { data: myPlans } = trpc.plans.list.useQuery(undefined, { enabled: !!user });

  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(user, myPlans ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, user?.role, (myPlans ?? []).length]
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  const { data: quota, refetch: refetchQuota } = trpc.ai.quota.useQuery();

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
      refetchQuota();
      if ((response as any).quota?.remaining === 0) {
        setLimitReached(true);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpa, ocorreu um erro ao contactar o assistente. Tenta novamente mais tarde.",
        },
      ]);
    },
  });

  const handleSend = (content: string) => {
    if (limitReached) return;
    const userMessage: Message = { role: "user", content };
    const base = messages.length === 0 ? [welcomeMessage] : messages;
    const updated = [...base, userMessage];
    setMessages(updated);

    chatMutation.mutate({
      messages: updated.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const showQuotaWarning = quota && !quota.isUnlimited && quota.remaining <= 5;
  const showQuotaLow = quota && !quota.isUnlimited && quota.remaining <= 3;
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(user?.role ?? "estagiario"),
    [user?.role]
  );

  // Atalhos rápidos para estagiários (painel lateral à esquerda do chat)
  const quickActions = user?.role === "estagiario" ? [
    { label: "As minhas tarefas", prompt: "Quais são as minhas tarefas pendentes?", icon: Clock },
    { label: "Tarefas em atraso", prompt: "Tenho alguma tarefa em atraso?", icon: AlertTriangle },
    { label: "O meu progresso", prompt: "Como estou a progredir no meu plano de integração?", icon: CheckCircle2 },
  ] : [];

  return (
    <DashboardLayout title="Norte - Assistente Virtual | Portal de Estagiários SOCEM">
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Norte 🧭
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {user?.role === "estagiario"
                  ? "O teu assistente pessoal de onboarding — conhece o teu plano e as tuas tarefas"
                  : "Assistente do Portal SOCEM — consulta dados e gere o onboarding"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <BarChart3 size={14} className="text-slate-400" />
              {quota ? (
                quota.isUnlimited ? (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Infinity size={12} /> Ilimitado
                  </span>
                ) : (
                  <span className={`text-xs font-semibold ${showQuotaLow ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                    {quota.remaining}/{quota.limit}
                  </span>
                )
              ) : (
                <span className="text-xs text-slate-400">...</span>
              )}
            </div>
          </div>

          {showQuotaWarning && !limitReached && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              showQuotaLow
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
            }`}>
              <AlertCircle size={14} className="shrink-0" />
              <span>{showQuotaLow
                ? `Restam apenas ${quota.remaining} mensagens hoje. O limite é reposto à meia-noite.`
                : `Restam ${quota.remaining} mensagens hoje.`}
              </span>
            </div>
          )}

          {limitReached && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              <span>Limite diário atingido. O limite é reposto à meia-noite. Contacta o teu tutor se precisares de ajuda urgente.</span>
            </div>
          )}
        </div>

        {/* Layout: atalhos rápidos (estagiário) + chat */}
        <div className={`flex flex-1 min-h-0 gap-4 ${quickActions.length > 0 ? "flex-row" : "flex-col"}`}>
          {/* Atalhos rápidos — apenas para estagiários */}
          {quickActions.length > 0 && (
            <div className="flex flex-col gap-2 w-44 shrink-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Atalhos</p>
              {quickActions.map(({ label, prompt, icon: Icon }) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={limitReached || chatMutation.isPending}
                  className="flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 min-h-0 min-w-0">
            <AIChatBox
              messages={displayMessages}
              onSendMessage={handleSend}
              isLoading={chatMutation.isPending}
              placeholder={limitReached ? "Limite diário atingido..." : "Pergunta algo sobre o portal ou o teu plano..."}
              emptyStateMessage="Pergunta-me algo sobre o portal!"
              suggestedPrompts={limitReached ? undefined : suggestedPrompts}
              height="100%"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
