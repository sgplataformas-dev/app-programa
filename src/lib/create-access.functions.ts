import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const REFUND_STATUSES = new Set([
  "refunded",
  "refund",
  "chargeback",
  "charged_back",
  "reversed",
  "disputed",
  "canceled",
  "cancelled",
]);

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha não pode ter mais de 72 caracteres.")
    .regex(/[a-z]/, "A senha precisa ter pelo menos uma letra minúscula.")
    .regex(/[A-Z]/, "A senha precisa ter pelo menos uma letra maiúscula.")
    .regex(/\d/, "A senha precisa ter pelo menos um número.")
    .regex(/[^A-Za-z0-9]/, "A senha precisa ter pelo menos um caractere especial."),
});

function isWeakPasswordError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const authError = error as {
    code?: string;
    name?: string;
    message?: string;
    reasons?: string[];
  };

  return (
    authError.code === "weak_password" ||
    authError.name === "AuthWeakPasswordError" ||
    authError.reasons?.includes("pwned") ||
    authError.message?.toLowerCase().includes("weak") ||
    false
  );
}

export const createAccessWithPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, password } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Verifica compra aprovada
    const { data: purchases, error: purchasesErr } = await supabaseAdmin
      .from("programa_active_purchases")
      .select("payment_status")
      .eq("email", email);

    if (purchasesErr) {
      console.error("[create-access] purchases query error", purchasesErr);
      return { ok: false as const, reason: "server_error" as const };
    }

    if (!purchases || purchases.length === 0) {
      return { ok: false as const, reason: "no_purchase" as const };
    }

    const hasActive = purchases.some(
      (p) => !REFUND_STATUSES.has(String(p.payment_status ?? "").toLowerCase()),
    );
    if (!hasActive) {
      return { ok: false as const, reason: "refunded" as const };
    }

    // 2) Localiza usuário existente
    let userId: string | null = null;
    {
      let page = 1;
      while (true) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (listErr) {
          console.error("[create-access] listUsers error", listErr);
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

    // 3) Cria apenas se a conta ainda não existir. Para contas existentes,
    //    NUNCA sobrescrevemos a senha por esta rota não autenticada — isso
    //    permitiria takeover de qualquer e-mail que tenha compra. O usuário
    //    deve usar o fluxo "Esqueci minha senha" (recovery por e-mail).
    if (userId) {
      return { ok: false as const, reason: "account_exists" as const };
    }

    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) {
      console.error("[create-access] createUser error", createErr);
      if (isWeakPasswordError(createErr)) {
        return { ok: false as const, reason: "weak_password" as const };
      }
      return { ok: false as const, reason: "server_error" as const };
    }

    return { ok: true as const };
  });

