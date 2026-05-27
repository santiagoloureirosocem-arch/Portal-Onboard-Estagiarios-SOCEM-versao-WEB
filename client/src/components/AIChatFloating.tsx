import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o assistente virtual do **Portal de Estagiários SOCEM**. Como posso ajudar-te?",
};

export function AIChatFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
        <SheetTitle className="sr-only">Assistente IA</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-card">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Assistente IA</p>
              <p className="text-xs text-muted-foreground">Tira dúvidas sobre o portal</p>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0 p-0">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSend}
              isLoading={chatMutation.isPending}
              placeholder="Pergunta algo sobre a aplicação..."
              emptyStateMessage="Pergunta-me algo sobre o portal!"
              height="100%"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
