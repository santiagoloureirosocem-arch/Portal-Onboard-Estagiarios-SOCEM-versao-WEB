import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, BarChart3, AlertCircle, Infinity } from "lucide-react";
import { useState } from "react";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o **Norte** 🧭, o assistente virtual do **Portal de Estagiários SOCEM**. Como posso ajudar-te?",
};

export function AIChatFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [limitReached, setLimitReached] = useState(false);

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
                <p className="text-xs text-muted-foreground">O teu guia do portal</p>
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
              messages={messages}
              onSendMessage={handleSend}
              isLoading={chatMutation.isPending}
              placeholder={limitReached ? "Limite diário atingido..." : "Pergunta algo sobre a aplicação..."}
              emptyStateMessage="Pergunta-me algo sobre o portal!"
              height="100%"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
