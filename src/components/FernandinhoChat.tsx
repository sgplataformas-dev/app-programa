import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getChatHistory } from "@/lib/fernandinho.functions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import fernandinho from "@/assets/fernandinho-sticker.jpeg";

const SUGESTOES = [
  "O que posso comer na Fase 1?",
  "Como faço o iogurte bariátrico?",
  "Quais alimentos devo evitar?",
];

export function FernandinhoChat() {
  const [open, setOpen] = useState(false);
  const fetchHistory = useServerFn(getChatHistory);

  const { data: history, isLoading } = useQuery({
    queryKey: ["fernandinho-history"],
    queryFn: () => fetchHistory(),
    enabled: open,
    staleTime: Infinity,
    retry: false,
  });

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Falar com o Fernandinho"
          className="fixed top-4 right-4 z-50 rounded-full bg-card p-1 shadow-lg ring-1 ring-border active:scale-95"
        >
          <img
            src={fernandinho}
            alt="Fernandinho"
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
          />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <img
              src={fernandinho}
              alt="Fernandinho"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Fernandinho</p>
              <p className="text-xs text-muted-foreground">Tire suas dúvidas do Programa Active</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="rounded-full p-2 text-muted-foreground active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Carregando conversa...
            </div>
          ) : (
            <ChatWindow initialMessages={(history ?? []) as unknown as UIMessage[]} />
          )}
        </div>
      )}
    </>
  );
}

function ChatWindow({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: "fernandinho",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, messages.length]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    await sendMessage({ text: value });
  }

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-md gap-4 px-4 py-4">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <img
                src={fernandinho}
                alt="Fernandinho"
                className="mx-auto h-28 w-28 rounded-2xl object-cover"
              />
              <p className="mt-4 text-base font-bold">Oi! Eu sou o Fernandinho 👋</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Posso te ajudar com as fases do protocolo, alimentos, receitas e o iogurte
                bariátrico.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-xl border border-border px-4 py-2.5 text-left text-sm active:scale-[0.99]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                <MessageResponse>
                  {message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("")}
                </MessageResponse>
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && <Shimmer>Fernandinho está pensando...</Shimmer>}

          {error && (
            <p className="text-sm text-destructive">
              Não consegui responder agora. Tente novamente em instantes.
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-card px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <PromptInput
          className="mx-auto w-full max-w-md"
          onSubmit={(_message, event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva sua dúvida..."
            autoFocus
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}

export default FernandinhoChat;
