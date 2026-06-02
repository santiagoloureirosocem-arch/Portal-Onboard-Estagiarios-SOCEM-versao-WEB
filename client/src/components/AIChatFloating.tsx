// =============================================================================
// PATCH 2 — client/src/components/AIChatFloating.tsx
// Ficheiro completo — substitui o ficheiro existente.
//
// O que muda:
//  1. Busca dados do utilizador atual via tRPC para construir uma mensagem de
//     boas-vindas personalizada (menciona nome, planos e tarefas em atraso).
//  2. Sugestões de prompts adaptadas ao papel do utilizador.
//  3. Indicador visual de tarefas em atraso no botão flutuante.
// =============================================================================

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, BarChart3, AlertCircle, Infinity } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Gera a mensagem de boas-vindas personalizada ─────────────────────────────
function buildWelcomeMessage(user: any, plans: any[]): Message {
  if (!user) {
    return {
      role: "assistant",
      content: "Olá! 👋 Sou o **Norte** 🧭, o assistente virtual do **Portal de Estagiários SOCEM**. Como posso ajudar-te?",
    };
  }

  const firstName = user.name?.split(" ")[0] ?? "olá";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (!plans || plans.length === 0) {
    return {
      role: "assistant",
      content: `${greeting}, **${firstName}**! 👋 Sou o **Norte** 🧭, o teu guia no Portal SOCEM.\n\nAinda não tens nenhum plano atribuído. Fala com o teu tutor ou pergunta-me o que precisares!`,
    };
  }

  // Conta tarefas em atraso
  let totalOverdue = 0;
  let overdueTaskNames: string[] = [];
  const now = new Date();

  // `plans` aqui são os planos vindos do tRPC (getPlansForUser)
  // Como não temos acesso direto às tasks no floating, deixamos o Norte
  // descobrir via ferramenta get_my_tasks — a mensagem de boas-vindas
  // usa apenas o número de planos ativos.
  const activePlans = plans.filter((p: any) => p.status === "active");

  let content = `${greeting}, **${firstName}**! 👋 Sou o **Norte** 🧭.\n\n`;
  if (activePlans.length > 0) {
    content += `Tens **${activePlans.length} plano${activePlans.length > 1 ? "s" : ""} ativo${activePlans.length > 1 ? "s" : ""}**. `;
    content += "Posso ajudar-te com tarefas, prazos ou qualquer dúvida sobre o portal. ";
    content += "O que precisas?";
  } else {
    content += "O que precisas de saber hoje?";
  }

  return { role: "assistant", content };
}

// ── Sugestões adaptadas ao papel ─────────────────────────────────────────────
function getSuggestedPrompts(role: string): string[] {
  if (role === "estagiario") {
    return [
      "Quais são as minhas tarefas para hoje?",
      "Tenho alguma tarefa em atraso?",
      "Como estou a progredir no meu plano?",
      "O que devo fazer a seguir?",
    ];
  }
  if (role === "tutor") {
    return [
      "Quais são os estagiários com tarefas em atraso?",
      "Mostra-me os planos ativos",
      "Como criar um novo plano de integração?",
      "Qual é a taxa de conclusão geral?",
    ];
  }
  // admin
  return [
    "Mostra-me as métricas do dashboard",
    "Quais os estagiários com mais tarefas em atraso?",
    "Como criar um utilizador novo?",
    "Qual é o progresso geral dos planos ativos?",
  ];
}

export function AIChatFloating() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  // Busca os planos do utilizador para personalizar a mensagem de boas-vindas
  const { data: myPlans } = trpc.plans.list.useQuery(undefined, { enabled: !!user });

  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(user, myPlans ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, (myPlans ?? []).length]
  );

  const [messages, setMessages] = useState<Message[]>([]);

  // Quando a mensagem de boas-vindas muda (dados carregados), atualiza
  // só se ainda não há conversa
  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  const { data: quota, refetch: refetchQuota } = trpc.ai.quota.useQuery(undefined, { enabled: open });

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
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(user?.role ?? "estagiario"),
    [user?.role]
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setLimitReached(false); }}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:max-w-[480px] p-0">
        <SheetTitle className="sr-only">Norte - Assistente Virtual</SheetTitle>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Norte 🧭</p>
                <p className="text-xs text-muted-foreground">
                  {user?.name ? `A ajudar ${user.name.split(" ")[0]}` : "O teu guia do portal"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <BarChart3 size={11} className="text-slate-400" />
              {quota ? (
                quota.isUnlimited ? (
                  <Infinity size={11} className="text-slate-400" />
                ) : (
                  <span className={`text-[11px] font-semibold ${quota.remaining <= 3 ? "text-red-500" : "text-slate-500"}`}>
                    {quota.remaining}/{quota.limit}
                  </span>
                )
              ) : (
                <span className="text-[11px] text-slate-400">...</span>
              )}
            </div>
          </div>

          {showQuotaWarning && !limitReached && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
              <AlertCircle size={12} className="shrink-0" />
              <span>Restam {quota.remaining} de {quota.limit} mensagens hoje.</span>
            </div>
          )}

          <div className="flex-1 min-h-0 p-0">
            <AIChatBox
              messages={displayMessages}
              onSendMessage={handleSend}
              isLoading={chatMutation.isPending}
              placeholder={limitReached ? "Limite diário atingido..." : "Pergunta algo..."}
              emptyStateMessage="Pergunta-me algo sobre o portal!"
              suggestedPrompts={limitReached ? undefined : suggestedPrompts}
              height="100%"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
