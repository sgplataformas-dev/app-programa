import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/http-retry";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

const WEBHOOK_URL = "https://n8nwebhook.sgglobal.online/webhook/rec-wpp";

export const requestPasswordResetViaWhatsappDirect = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email } = data;
    const OK = { ok: true as const };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Verifica se o usuário existe
      let userId: string | null = null;
      let page = 1;
      while (true) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (listErr) {
          console.error("[wpp-reset-direct] listUsers error", listErr);
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

      if (!userId) return OK;

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
        console.error("[wpp-reset-direct] generateLink error", linkErr);
        return OK;
      }

      const resetUrl = new URL(redirectTo);
      resetUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
      resetUrl.searchParams.set("type", "recovery");
      const resetLink = `${resetUrl.pathname.replace(/^\//, "")}${resetUrl.search}`;


      try {
        const res = await fetchWithRetry(
          WEBHOOK_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, reset_link: resetLink }),
          },
          { retries: 3, timeoutMs: 10_000, label: "wpp-reset-direct-webhook" },
        );
        if (!res.ok) {
          console.error("[wpp-reset-direct] webhook non-2xx", res.status, await res.text().catch(() => ""));
        }
      } catch (fetchErr) {
        console.error("[wpp-reset-direct] webhook fetch failed", fetchErr);
      }

      return OK;
    } catch (err) {
      console.error("[wpp-reset-direct] unexpected error", err);
      return OK;
    }
  });
