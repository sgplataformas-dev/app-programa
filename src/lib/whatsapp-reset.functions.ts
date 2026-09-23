import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/http-retry";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const requestPasswordResetViaWhatsapp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email } = data;

    // Sempre retornamos ok:true para não vazar se o e-mail existe.
    const OK = { ok: true as const };

    const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL;
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!webhookUrl) {
      console.error("[whatsapp-reset] N8N_PASSWORD_RESET_WEBHOOK_URL não configurado");
      return OK;
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Localiza o usuário no auth.users
      let userId: string | null = null;
      let page = 1;
      while (true) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (listErr) {
          console.error("[whatsapp-reset] listUsers error", listErr);
          break;
        }
        const users = list?.users ?? [];
        if (users.length === 0) break;
        const found = users.find((u) => u.email?.toLowerCase() === email);
        if (found) {
          userId = found.id;
          break;
        }
        if (users.length < 1000) break;
        page++;
      }

      if (!userId) {
        // E-mail não cadastrado — não faz nada, mas retorna ok para não vazar.
        return OK;
      }

      const origin =
        process.env.PUBLIC_APP_URL ??
        process.env.SITE_URL ??
        "https://programa-active.com";
      const redirectTo = `${origin}/reset-password`;

      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

      if (linkErr || !linkData?.properties?.hashed_token) {
        console.error("[whatsapp-reset] generateLink error", linkErr);
        return OK;
      }

      // Não enviamos o link direto de verificação do backend no WhatsApp.
      // Apps de mensagem podem abrir o link para gerar prévia/segurança e consumir o token de uso único.
      // Enviamos primeiro para a página do app; o token só é validado após ação do cliente.
      const resetUrl = new URL(redirectTo);
      resetUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
      resetUrl.searchParams.set("type", "recovery");
      const resetLink = resetUrl.toString();

      // Envia para o webhook do n8n com retry (código 0/28 → nova tentativa até 3×)
      try {
        const res = await fetchWithRetry(
          webhookUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
            },
            body: JSON.stringify({ email, reset_link: resetLink }),
          },
          { retries: 3, timeoutMs: 10_000, label: "whatsapp-reset-webhook" },
        );
        if (!res.ok) {
          console.error("[whatsapp-reset] n8n webhook non-2xx", res.status, await res.text().catch(() => ""));
        }
      } catch (fetchErr) {
        console.error("[whatsapp-reset] n8n webhook fetch failed", fetchErr);
      }

      return OK;
    } catch (err) {
      console.error("[whatsapp-reset] unexpected error", err);
      return OK;
    }
  });
