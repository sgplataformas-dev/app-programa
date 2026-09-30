import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasActiveAccess } from "@/lib/purchase-access";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Verifica se há alguma compra associada ao e-mail
    const { data: purchases, error: purchasesErr } = await supabaseAdmin
      .from("programa_active_purchases")
      .select("payment_status, payt_order_id, product_name, updated_at, purchase_date, created_at")
      .eq("email", email);

    if (purchasesErr) {
      console.error("[password-reset] purchases query error", purchasesErr);
      return { ok: false, reason: "server_error" as const };
    }

    if (!purchases || purchases.length === 0) {
      return { ok: false, reason: "no_purchase" as const };
    }

    if (!hasActiveAccess(purchases as any)) {
      return { ok: false, reason: "refunded" as const };
    }

    // 2) Localiza ou cria o usuário (compra antiga importada pode não ter user ainda)
    let userId: string | null = null;
    {
      // listUsers não filtra por email diretamente; iteramos páginas até encontrar
      let page = 1;
      while (true) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (listErr) {
          console.error("[password-reset] listUsers error", listErr);
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
    }

    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        console.error("[password-reset] createUser error", createErr);
        return { ok: false, reason: "server_error" as const };
      }
      userId = created.user.id;
    }

    // 3) Dispara o e-mail de recovery
    const origin =
      process.env.PUBLIC_APP_URL ??
      process.env.SITE_URL ??
      "https://app-programa.vercel.app";
    const redirectTo = `${origin}/reset-password`;

    const { error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      console.error("[password-reset] generateLink error", linkErr);
      return { ok: false, reason: "server_error" as const };
    }

    return { ok: true as const };
  });
