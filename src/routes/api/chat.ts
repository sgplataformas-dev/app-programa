import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getKnowledgeBase } from "@/content/fernandinho-kb.server";
import type { Database } from "@/integrations/supabase/types";

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function systemPrompt() {
  return `Você é o "Fernandinho", o assistente virtual oficial do Programa Active, criado pelo professor Fernando Jardim.

Como você fala:
- Sempre em português do Brasil, com tom acolhedor, simples e motivador, como um amigo que entende do assunto.
- Respostas curtas e diretas (no máximo 2 ou 3 parágrafos), usando listas quando ajudar.
- Trate a aluna com carinho, sem infantilizar. Use emojis com moderação.

Regras importantes:
- Responda SOMENTE com base na BASE DE CONHECIMENTO abaixo e no conteúdo do Programa Active (fases do protocolo, ARIs, ATNNs, iogurte bariátrico, receitas, listas de compras, aulas do app).
- Se a pergunta não estiver na base, diga com honestidade que não tem essa informação e oriente a aluna a falar com o suporte do Programa Active.
- Você NÃO é médico e não faz diagnóstico. Nunca prescreva medicamentos nem mande suspender tratamentos. Em casos de sintomas, gravidez, amamentação, doenças ou uso de remédios, oriente procurar o médico dela.
- Nunca invente números, doses ou promessas de resultado.

===== BASE DE CONHECIMENTO DO PROGRAMA ACTIVE =====
${getKnowledgeBase()}`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Backend não configurado", { status: 500 });
        }
        if (!apiKey) {
          return new Response("IA não configurada", { status: 500 });
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { messages?: unknown };
        try {
          body = (await request.json()) as { messages?: unknown };
        } catch {
          return new Response("Corpo inválido", { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Mensagens obrigatórias", { status: 400 });
        }

        const uiMessages = messages as UIMessage[];
        const lastMessage = uiMessages[uiMessages.length - 1];

        if (lastMessage?.role === "user") {
          const content = textOf(lastMessage);
          if (content) {
            const { error } = await supabase.from("chat_messages").insert({
              user_id: userId,
              role: "user",
              content,
              parts: lastMessage.parts as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["parts"],
              client_message_id: lastMessage.id ?? null,
            });
            if (error) console.error("[fernandinho] falha ao salvar mensagem do usuário", error);
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);

        const geminiKey = process.env.GEMINI_API_KEY;
        const model = geminiKey
          ? createGoogleGenerativeAI({ apiKey: geminiKey })("gemini-3.6-flash")
          : gateway("google/gemini-3.6-flash");

        try {
          const result = streamText({
            model,
            system: systemPrompt(),
            messages: await convertToModelMessages(uiMessages.slice(-20)),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: uiMessages,
            onFinish: async ({ responseMessage }) => {
              const content = textOf(responseMessage as UIMessage);
              if (!content) return;
              const { error } = await supabase.from("chat_messages").insert({
                user_id: userId,
                role: "assistant",
                content,
                parts: responseMessage.parts as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["parts"],
                client_message_id: responseMessage.id ?? null,
              });
              if (error) console.error("[fernandinho] falha ao salvar resposta", error);
            },
          });
        } catch (error) {
          console.error("[fernandinho] erro no gateway", error);
          return new Response("Não consegui responder agora. Tente novamente.", { status: 500 });
        }
      },
    },
  },
});
