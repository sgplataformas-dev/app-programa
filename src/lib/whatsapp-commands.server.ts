import { hasActiveAccess, INACTIVE_STATUSES } from "@/lib/purchase-access";
import { findUserIdByEmail, provisionAccess } from "@/lib/payt-provision.server";

export type WhatsAppCommandContext = {
  supabaseAdmin: any;
  phone: string;
  name: string | null;
};

export type CommandResult = {
  reply: string;
  status?: "ok" | "error" | "not_found";
};

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type SaleData = {
  cartId?: string | null;
  productName?: string | null;
  amount?: number | null;
  nome?: string | null;
  telefone?: string | null;
  status?: string | null;
  raw?: any;
};

export async function handleLiberar(
  { supabaseAdmin }: CommandContext,
  email: string,
  sale?: SaleData | null,
): Promise<CommandResult> {
  if (!isValidEmail(email)) {
    return { reply: "E-mail inválido. Use: liberar email@exemplo.com", status: "error" };
  }

  const loadPurchases = async () =>
    await supabaseAdmin
      .from("programa_active_purchases")
      .select("id, payment_status, payt_order_id, updated_at, purchase_date, created_at, raw_payload")
      .eq("email", email);

  let { data: purchases, error } = await loadPurchases();

  if (error) {
    console.error("[whatsapp-commands] liberar query error", error);
    return { reply: "Erro ao consultar compras. Tente novamente.", status: "error" };
  }

  // Se a Payt não entregou o webhook, mas o payload da venda veio junto
  // (n8n), registramos a compra aqui para não travar a liberação.
  if ((!purchases || purchases.length === 0) && sale?.cartId) {
    const { error: upsertErr } = await supabaseAdmin.from("programa_active_purchases").upsert(
      {
        email,
        payt_order_id: String(sale.cartId),
        product_name: sale.productName ?? null,
        amount: sale.amount ?? null,
        payment_status: sale.status ?? "paid",
        purchase_date: new Date().toISOString(),
        raw_payload: (sale.raw ?? null) as any,
      },
      { onConflict: "payt_order_id" },
    );

    if (upsertErr) {
      console.error("[whatsapp-commands] liberar upsert purchase error", upsertErr);
    } else {
      const reloaded = await loadPurchases();
      purchases = reloaded.data;
    }
  }

  if (!purchases || purchases.length === 0) {
    return {
      reply: `Nenhuma compra encontrada para ${email}. Verifique o e-mail ou aguarde o webhook da Payt.`,
      status: "not_found",
    };
  }

  if (!hasActiveAccess(purchases)) {
    return {
      reply: `A compra de ${email} não está ativa (reembolso/cancelamento). Não é possível liberar.`,
      status: "error",
    };
  }

  const activePurchase = purchases.find(
    (p: any) => !INACTIVE_STATUSES.has(String(p.payment_status ?? "").trim().toLowerCase()),
  );
  const cartId = activePurchase?.payt_order_id ?? `manual-${Date.now()}`;

  const nome =
    activePurchase?.raw_payload?.body?.customer?.name ??
    activePurchase?.raw_payload?.customer?.name ??
    activePurchase?.raw_payload?.raw_webhook?.customer?.name ??
    sale?.nome ??
    null;
  const telefone =
    activePurchase?.raw_payload?.body?.customer?.phone ??
    activePurchase?.raw_payload?.customer?.phone ??
    activePurchase?.raw_payload?.raw_webhook?.customer?.phone ??
    sale?.telefone ??
    null;

  const result = await provisionAccess(supabaseAdmin, {
    email,
    nome,
    telefone,
    cartId,
  });

  if (!result.userId) {
    return {
      reply: `Não consegui criar a conta para ${email}. Erro: ${result.error ?? "desconhecido"}`,
      status: "error",
    };
  }

  if (result.created) {
    return {
      reply: `✅ Acesso liberado para ${email}\nSenha padrão: Active@123`,
      status: "ok",
    };
  }

  return {
    reply: `✅ Conta já existia para ${email}. Acesso garantido e compras vinculadas.`,
    status: "ok",
  };
}

export async function handleRevogar(
  { supabaseAdmin }: CommandContext,
  email: string,
): Promise<CommandResult> {
  if (!isValidEmail(email)) {
    return { reply: "E-mail inválido. Use: revogar email@exemplo.com", status: "error" };
  }

  const userId = await findUserIdByEmail(supabaseAdmin, email);
  if (!userId) {
    return { reply: `Nenhuma conta encontrada para ${email}.`, status: "not_found" };
  }

  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "876000h" } as any);
    await supabaseAdmin.auth.admin.signOut(userId);
    return { reply: `🚫 Acesso revogado para ${email}.`, status: "ok" };
  } catch (err: any) {
    console.error("[whatsapp-commands] revogar error", err);
    return { reply: "Erro ao revogar acesso. Tente novamente.", status: "error" };
  }
}

export async function handleStatus(
  { supabaseAdmin }: CommandContext,
  email: string,
): Promise<CommandResult> {
  if (!isValidEmail(email)) {
    return { reply: "E-mail inválido. Use: status email@exemplo.com", status: "error" };
  }

  const [userId, purchases] = await Promise.all([
    findUserIdByEmail(supabaseAdmin, email),
    supabaseAdmin
      .from("programa_active_purchases")
      .select("payment_status, updated_at, purchase_date, created_at")
      .eq("email", email)
      .then((r: any) => r.data),
  ]);

  const hasAccess = hasActiveAccess(purchases);
  const accountStatus = userId ? "conta existe" : "sem conta";

  if (!purchases || purchases.length === 0) {
    return {
      reply: `${email}: nenhuma compra encontrada (${accountStatus}).`,
      status: "not_found",
    };
  }

  const lastStatus = purchases
    .map((p: any) => String(p.payment_status ?? "desconhecido"))
    .join(", ");

  return {
    reply: `📊 ${email}\nConta: ${accountStatus}\nCompras: ${lastStatus}\nAcesso ativo: ${hasAccess ? "sim ✅" : "não ❌"}`,
    status: "ok",
  };
}

export const HELP_TEXT = `Comandos disponíveis:
• liberar [email]
• revogar [email]
• status [email]
• ajuda`;

type CommandContext = {
  supabaseAdmin: any;
};
