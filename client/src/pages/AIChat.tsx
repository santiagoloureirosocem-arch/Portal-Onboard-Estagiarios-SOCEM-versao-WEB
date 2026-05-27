import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o assistente virtual do **Portal de Estagiários SOCEM**. Como posso ajudar-te?\n\nPergunta-me sobre:\n- Como criar um plano de integração\n- Gerir utilizadores e permissões\n- Acompanhar tarefas e progresso\n- Navegar na aplicação\n- Qualquer dúvida sobre o funcionamento do portal",
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

    // Send only user + assistant messages (not system) to the server
    chatMutation.mutate({
      messages: updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  return (
    <DashboardLayout title="Assistente IA - Portal de Estagiários SOCEM">
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Assistente IA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tira dúvidas sobre o funcionamento do Portal de Estagiários SOCEM
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSend}
            isLoading={chatMutation.isPending}
            placeholder="Pergunta algo sobre a aplicação..."
            emptyStateMessage="Pergunta-me algo sobre o portal!"
            suggestedPrompts={SUGGESTED_PROMPTS}
            height="100%"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
