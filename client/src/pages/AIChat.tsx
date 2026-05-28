import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AlertCircle, BarChart3, Infinity } from "lucide-react";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o **Norte** 🧭, o assistente virtual do **Portal de Estagiários SOCEM**. Como posso ajudar-te?\n\nPergunta-me sobre:\n- Como criar um plano de integração\n- Gerir utilizadores e permissões\n- Acompanhar tarefas e progresso\n- Navegar na aplicação\n- Qualquer dúvida sobre o funcionamento do portal",
};

const SUGGESTED_PROMPTS = [
  "Como criar um novo plano de integração?",
  "Quais são os diferentes papéis de utilizador?",
  "Como atribuir um plano a um estagiário?",
  "Onde vejo o progresso dos estagiários?",
  "Como funciona o sistema de mensagens?",
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [limitReached, setLimitReached] = useState(false);

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
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    chatMutation.mutate({
      messages: updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const showQuotaWarning = quota && !quota.isUnlimited && quota.remaining <= 5;
  const showQuotaLow = quota && !quota.isUnlimited && quota.remaining <= 3;

  return (
    <DashboardLayout title="Norte - Assistente Virtual | Portal de Estagiários SOCEM">
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Norte 🧭
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                O teu guia para o Portal de Estagiários SOCEM — tira dúvidas sobre como usar a plataforma
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
                ? `Restam apenas ${quota.remaining} mensagens hoje. O limite será reposto amanhã.`
                : `Restam ${quota.remaining} mensagens hoje.`}
              </span>
            </div>
          )}

          {limitReached && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              <span>Limite diário atingido. Volta amanhã para mais conversas ou contacta o teu tutor se precisares de ajuda urgente.</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSend}
            isLoading={chatMutation.isPending}
            placeholder={limitReached ? "Limite diário atingido..." : "Pergunta algo sobre a aplicação..."}
            emptyStateMessage="Pergunta-me algo sobre o portal!"
            suggestedPrompts={limitReached ? undefined : SUGGESTED_PROMPTS}
            height="100%"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
