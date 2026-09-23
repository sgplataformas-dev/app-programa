// Provisionamento de contas Payt reutilizável pelo webhook e pelo reprocessador.
// Quando a Payt corta a conexão (código 28 / 0), o evento fica registrado como
// "received" ou com "provision_pending" — este módulo termina o trabalho.

import { retry } from "@/lib/http-retry";

export const APPROVED_STATUSES = new Set([
  "paid",
  "approved",
  "authorized",
  "completed",
]);

export const DEFAULT_PASSWORD = "Active@123";

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Busca o usuário direto no banco (índice em auth.users) em vez de paginar
// a Auth Admin API — era a origem principal dos timeouts.
export async function findUserIdByEmail(
  supabaseAdmin: any,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase().trim();

  try {
    const { data, error } = await supabaseAdmin.rpc("find_user_id_by_email", {
      _email: target,
    });
    if (!error) return (data as string | null) ?? null;
    console.error("[payt-provision] rpc find_user_id_by_email error", error);
  } catch (err) {
    console.error("[payt-provision] rpc find_user_id_by_email threw", err);
  }

  // Fallback: paginação da Auth Admin API.
  let page = 1;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) return null;
    const users = data?.users ?? [];
    if (users.length === 0) return null;
    const found = users.find((u: any) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (users.length < 1000) return null;
    page++;
  }
}

export type ProvisionInput = {
  email: string;
  nome?: string | null;
  telefone?: string | null;
  cartId: string;
};

export type ProvisionResult = {
  userId: string | null;
  created: boolean;
  error?: string;
};

// Garante conta ativa (cria se não existir, desbane se existia) e vincula a compra.
export async function provisionAccess(
  supabaseAdmin: any,
  { email, nome, telefone, cartId }: ProvisionInput,
): Promise<ProvisionResult> {
  const normalized = email.toLowerCase().trim();
  let userId: string | null = null;
  let created = false;

  try {
    const existingUserId = await retry(
      () =>
        withTimeout(
          findUserIdByEmail(supabaseAdmin, normalized),
          8_000,
          "findUserIdByEmail",
        ),
      { retries: 3, label: "payt-find-user" },
    );

    if (existingUserId) {
      userId = existingUserId;
      try {
        await retry(
          () =>
            supabaseAdmin.auth.admin.updateUserById(existingUserId, {
              user_metadata: { nome: nome ?? "", telefone: telefone ?? null },
              email_confirm: true,
              ban_duration: "none",
            } as any),
          { retries: 3, label: "payt-update-user" },
        );
      } catch (updErr) {
        console.error("[payt-provision] updateUserById error", updErr);
      }
    } else {
      const { data: createdUser, error: createErr } = (await retry(
        () =>
          withTimeout(
            supabaseAdmin.auth.admin.createUser({
              email: normalized,
              password: DEFAULT_PASSWORD,
              email_confirm: true,
              user_metadata: { nome: nome ?? "", telefone: telefone ?? null },
            }),
            10_000,
            "createUser",
          ),
        { retries: 3, label: "payt-create-user" },
      )) as { data?: any; error?: any };
      if (createErr) {
        // Corrida: outra tentativa criou a conta no meio do caminho.
        const raced = await findUserIdByEmail(supabaseAdmin, normalized);
        if (!raced) throw createErr;
        userId = raced;
      } else {
        userId = createdUser?.user?.id ?? null;
        created = true;
      }
    }
  } catch (err: any) {
    return { userId: null, created: false, error: err?.message ?? String(err) };
  }

  if (userId && cartId) {
    const { error: linkErr } = await retry(
      async () =>
        await supabaseAdmin
          .from("purchases")
          .update({ user_id: userId })
          .eq("payt_order_id", String(cartId)),
      { retries: 3, label: "payt-link-user" },
    );
    if (linkErr) console.error("[payt-provision] link purchase error", linkErr);
  }

  if (userId) {
    // Vincula também qualquer outra compra do mesmo e-mail que ficou órfã.
    await supabaseAdmin
      .from("purchases")
      .update({ user_id: userId })
      .eq("email", normalized)
      .is("user_id", null);
  }

  return { userId, created };
}
