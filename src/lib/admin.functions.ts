import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ADMIN_EMAILS = new Set([
  "sgequipeacessos@gmail.com",
  "sarasuporte@gmail.com",
  
  "fernandojardim.r7@gmail.com",
  "axagentes@gmail.com",
  "sawara_alvim@hotmail.com",
  "sawara.araujo@gmail.com",
]);

async function logDenied(
  userId: string | null,
  claimEmail: string | null,
  reason: string,
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: (userId ?? null) as any,
      admin_email: claimEmail,
      action: "admin_access_denied",
      target_user_id: null,
      target_email: null,
      details: { reason } as any,
    });
  } catch {
    // não bloqueia a resposta de Forbidden se o log falhar
  }
}

async function ensureAdmin(context: { supabase: any; userId: string; claims: any }) {
  const userId = context.userId;
  const claimEmail = String(context.claims?.email ?? "").toLowerCase() || null;

  if (!userId) {
    await logDenied(null, claimEmail, "no_user_id");
    throw new Error("Forbidden");
  }

  // 1) Checa email das claims do JWT contra whitelist (defesa rápida)
  if (!claimEmail || !ADMIN_EMAILS.has(claimEmail)) {
    await logDenied(userId, claimEmail, "claim_email_not_in_whitelist");
    throw new Error("Forbidden");
  }

  // 2) Re-busca o usuário canônico via Auth Admin para não confiar só no JWT
  //    (cobre casos de token antigo, email trocado depois do login, conta banida etc.)
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user) {
    await logDenied(userId, claimEmail, "auth_user_not_found");
    throw new Error("Forbidden");
  }
  const canonicalEmail = (authUser.user.email ?? "").toLowerCase();
  if (!canonicalEmail || !ADMIN_EMAILS.has(canonicalEmail)) {
    await logDenied(userId, claimEmail, "canonical_email_not_in_whitelist");
    throw new Error("Forbidden");
  }
  const bannedUntil = (authUser.user as any).banned_until;
  if (bannedUntil && new Date(bannedUntil) > new Date()) {
    await logDenied(userId, claimEmail, "user_banned");
    throw new Error("Forbidden");
  }

  // 3) Confirma role admin na tabela user_roles (terceira camada)
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) {
    const { data: rows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
    if (!rows || rows.length === 0) {
      await logDenied(userId, claimEmail, "missing_admin_role");
      throw new Error("Forbidden");
    }
  }
}

async function audit(
  admin: { id: string; email: string | null },
  action: string,
  target: { id?: string | null; email?: string | null },
  details: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: admin.id,
    admin_email: admin.email,
    action,
    target_user_id: target.id ?? null,
    target_email: target.email ?? null,
    details: details as any,
  });
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await ensureAdmin(context);
      return { isAdmin: true as const };
    } catch {
      return { isAdmin: false as const };
    }
  });

export const listUsersAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional().default(""),
        page: z.number().int().min(1).max(1000).optional().default(1),
        perPage: z.number().int().min(10).max(200).optional().default(50),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Lista usuários do Auth (paginação nativa)
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: data.page,
      perPage: data.perPage,
    });
    if (listErr) throw listErr;

    let users = list?.users ?? [];
    const term = data.search.toLowerCase();
    if (term) {
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(term) ||
          (u.user_metadata?.nome ?? "").toString().toLowerCase().includes(term),
      );
    }

    const ids = users.map((u) => u.id);
    const emails = users.map((u) => (u.email ?? "").toLowerCase()).filter(Boolean);

    const [{ data: profiles }, { data: purchases }] = await Promise.all([
      ids.length
        ? supabaseAdmin.from("profiles").select("id, nome, telefone, ativo").in("id", ids)
        : Promise.resolve({ data: [] as any[] }),
      emails.length
        ? supabaseAdmin
            .from("purchases")
            .select("email, payment_status, purchase_date, product_name, payt_order_id")
            .in("email", emails)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
    const purchasesByEmail = new Map<string, any[]>();
    for (const p of purchases ?? []) {
      const key = (p.email ?? "").toLowerCase();
      const arr = purchasesByEmail.get(key) ?? [];
      arr.push(p);
      purchasesByEmail.set(key, arr);
    }

    const REFUND = new Set([
      "refunded",
      "refund",
      "chargeback",
      "charged_back",
      "reversed",
      "disputed",
      "canceled",
      "cancelled",
    ]);

    const rows = users.map((u) => {
      const email = (u.email ?? "").toLowerCase();
      const profile = profileById.get(u.id);
      const userPurchases = purchasesByEmail.get(email) ?? [];
      const hasActive = userPurchases.some(
        (p) => !REFUND.has(String(p.payment_status ?? "").toLowerCase()),
      );
      const lastPurchase = userPurchases
        .map((p) => p.purchase_date)
        .filter(Boolean)
        .sort()
        .at(-1);
      const banned = (u as any).banned_until && new Date((u as any).banned_until) > new Date();
      return {
        id: u.id,
        email: u.email ?? "",
        nome: profile?.nome ?? u.user_metadata?.nome ?? "",
        telefone: profile?.telefone ?? u.user_metadata?.telefone ?? null,
        criado_em: u.created_at,
        ultimo_login: u.last_sign_in_at,
        email_confirmado: !!u.email_confirmed_at,
        acesso_enviado: !!u.invited_at || !!u.last_sign_in_at,
        banido: !!banned,
        ativo: profile?.ativo ?? true,
        compra_ativa: hasActive,
        ultima_compra: lastPurchase ?? null,
        produto: userPurchases[0]?.product_name ?? null,
        total_compras: userPurchases.length,
      };
    });

    // Página 1: também inclui compradores que ainda não criaram conta no Auth
    // (lead pago aguardando convite/criação de acesso). Assim a CS vê todos
    // os leads que entraram via webhook, mesmo sem login.
    let pendingLeads: typeof rows = [];
    if (data.page === 1) {
      const knownEmails = new Set(users.map((u) => (u.email ?? "").toLowerCase()));
      const { data: orphanPurchases } = await supabaseAdmin
        .from("purchases")
        .select("email, product_name, purchase_date, payment_status, payt_order_id, raw_payload")
        .order("purchase_date", { ascending: false })
        .limit(500);

      const seen = new Set<string>();
      for (const p of orphanPurchases ?? []) {
        const email = (p.email ?? "").toLowerCase();
        if (!email || knownEmails.has(email) || seen.has(email)) continue;
        if (REFUND.has(String(p.payment_status ?? "").toLowerCase())) continue;
        seen.add(email);
        const meta = (p.raw_payload as any)?.body?.customer ?? {};
        pendingLeads.push({
          id: `lead:${email}`,
          email,
          nome: meta.name ?? "",
          telefone: meta.phone ?? null,
          criado_em: p.purchase_date ?? new Date().toISOString(),
          ultimo_login: undefined as any,
          email_confirmado: false,
          acesso_enviado: false,
          banido: false,
          ativo: true,
          compra_ativa: true,
          ultima_compra: p.purchase_date,
          produto: p.product_name ?? null,
          total_compras: 1,
        });
      }
    }

    const merged = [...pendingLeads, ...rows].sort((a, b) => {
      const da = new Date(a.criado_em ?? 0).getTime();
      const db = new Date(b.criado_em ?? 0).getTime();
      return db - da;
    });
    return {
      rows: merged,
      page: data.page,
      perPage: data.perPage,
      hasMore: users.length >= data.perPage,
    };
  });

export const grantAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email(),
        nome: z.string().trim().max(120).optional(),
        telefone: z.string().trim().max(40).optional(),
        password: z.string().min(8).max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const adminEmail = (context.claims?.email as string | undefined) ?? null;

    // Procura usuário existente
    let userId: string | null = null;
    {
      let page = 1;
      while (true) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        const u = list?.users?.find((x) => x.email?.toLowerCase() === data.email);
        if (u) {
          userId = u.id;
          break;
        }
        if (!list?.users || list.users.length < 1000) break;
        page++;
      }
    }

    const origin = process.env.SITE_URL ?? "https://programa-active.com";
    const redirectTo = `${origin}/reset-password`;

    if (!userId) {
      if (data.password) {
        // Cria a conta já com a senha definida — acesso imediato, sem convite.
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { nome: data.nome ?? "", telefone: data.telefone ?? null },
        });
        if (error) throw error;
        userId = created?.user?.id ?? null;
      } else {
        const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
          data: { nome: data.nome ?? "", telefone: data.telefone ?? null },
          redirectTo,
        });
        if (error) throw error;
        userId = invited?.user?.id ?? null;
      }
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "none" } as any);
      if (data.password) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.password,
        } as any);
        if (error) throw error;
      } else {
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: data.email,
          options: { redirectTo },
        });
      }
    }

    await audit({ id: context.userId, email: adminEmail }, "grant_access", {
      id: userId,
      email: data.email,
    }, data.password ? { password_set: true } : undefined);

    return { ok: true as const, userId };
  });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), email: z.string().email() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = process.env.SITE_URL ?? "https://programa-active.com";
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: `${origin}/reset-password` },
    });
    if (error) throw error;
    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "password_reset",
      { id: data.userId, email: data.email },
    );
    return { ok: true as const };
  });

export const revokeAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), email: z.string().email() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "876000h",
    } as any);
    try {
      await supabaseAdmin.auth.admin.signOut(data.userId);
    } catch (err) {
      console.error("[admin] signOut error", err);
    }

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "revoke_access",
      { id: data.userId, email: data.email },
    );
    return { ok: true as const };
  });

export const reactivateAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), email: z.string().email() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "none" } as any);
    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "reactivate_access",
      { id: data.userId, email: data.email },
    );
    return { ok: true as const };
  });

export const updateUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        email: z.string().trim().toLowerCase().email().optional(),
        nome: z.string().trim().max(120).optional(),
        telefone: z.string().trim().max(40).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authPatch: Record<string, unknown> = {};
    if (data.email) authPatch.email = data.email;
    const meta: Record<string, unknown> = {};
    if (data.nome !== undefined) meta.nome = data.nome;
    if (data.telefone !== undefined) meta.telefone = data.telefone;
    if (Object.keys(meta).length) authPatch.user_metadata = meta;

    if (Object.keys(authPatch).length) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, authPatch as any);
      if (error) throw error;
    }

    const profilePatch: Record<string, unknown> = {};
    if (data.nome !== undefined) profilePatch.nome = data.nome;
    if (data.telefone !== undefined) profilePatch.telefone = data.telefone;
    if (Object.keys(profilePatch).length) {
      await supabaseAdmin.from("profiles").update(profilePatch as any).eq("id", data.userId);
    }

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "update_user",
      { id: data.userId, email: data.email ?? null },
      { changes: { ...data, userId: undefined } },
    );
    return { ok: true as const };
  });

export const setUserPasswordAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        email: z.string().email(),
        password: z.string().min(8).max(200),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    } as any);
    if (error) throw error;

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "set_user_password",
      { id: data.userId, email: data.email },
    );
    return { ok: true as const };
  });

/**
 * Provisiona em lote os leads importados (planilhas Huskyapp / vendas Payt).
 * Para cada compra sem user_id, cria/garante a conta no Auth com e-mail confirmado
 * e senha aleatória (o usuário acessa via "Esqueci minha senha"). Não envia e-mail
 * automático para não estourar limites de SMTP.
 *
 * Retorna { processed, created, linked, remaining } — o front chama em loop
 * até remaining === 0.
 */
export const bulkProvisionPendingLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ limit: z.number().int().min(1).max(50).optional().default(25) })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pending, error: pendErr } = await supabaseAdmin
      .from("purchases")
      .select("id, email, payt_order_id, raw_payload, purchase_date")
      .is("user_id", null)
      .order("purchase_date", { ascending: false })
      .limit(data.limit);
    if (pendErr) throw pendErr;

    let created = 0;
    let linked = 0;
    const errors: { email: string; error: string }[] = [];

    // Cache para evitar buscar a mesma página de auth.users várias vezes
    let authCache: Map<string, string> | null = null;
    async function loadAuthCache() {
      if (authCache) return authCache;
      authCache = new Map();
      let page = 1;
      while (true) {
        const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) break;
        for (const u of list?.users ?? []) {
          if (u.email) authCache.set(u.email.toLowerCase(), u.id);
        }
        if (!list?.users || list.users.length < 1000) break;
        page++;
      }
      return authCache;
    }

    for (const row of pending ?? []) {
      const email = (row.email ?? "").toLowerCase();
      if (!email) continue;
      const meta = (row.raw_payload as any)?.body?.customer ?? {};
      const nome = String(meta.name ?? "");
      const telefone = meta.phone ? String(meta.phone) : null;

      try {
        const cache = await loadAuthCache();
        let userId = cache.get(email) ?? null;

        if (!userId) {
          const randomPw =
            crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "") + "Aa1!";
          const { data: createRes, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: randomPw,
              email_confirm: true,
              user_metadata: { nome, telefone, imported: true },
            });
          if (createErr) {
            const msg = createErr.message?.toLowerCase() ?? "";
            if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
              // Outra requisição criou em paralelo — recarrega cache
              authCache = null;
              const c2 = await loadAuthCache();
              userId = c2.get(email) ?? null;
            } else {
              throw createErr;
            }
          } else {
            userId = createRes?.user?.id ?? null;
            if (userId) {
              cache.set(email, userId);
              created++;
            }
          }
        }

        if (userId) {
          await supabaseAdmin
            .from("purchases")
            .update({ user_id: userId })
            .eq("id", row.id);
          linked++;
        }
      } catch (e: any) {
        errors.push({ email, error: e?.message ?? String(e) });
      }
    }

    const { count: remaining } = await supabaseAdmin
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .is("user_id", null);

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "bulk_provision_leads",
      {},
      { processed: pending?.length ?? 0, created, linked, remaining, errors: errors.slice(0, 5) },
    );

    return {
      processed: pending?.length ?? 0,
      created,
      linked,
      remaining: remaining ?? 0,
      errors,
    };
  });

/**
 * Reenvia o convite/acesso (e-mail de invite do Supabase Auth) para todos os
 * usuários com compra ativa e status "Não enviado" (nunca logaram).
 *
 * Modo dryRun apenas conta quantos seriam afetados, sem enviar.
 */
export const bulkResendAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        dryRun: z.boolean().optional().default(false),
        limit: z.number().int().min(1).max(5000).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const REFUND = new Set([
      "refunded",
      "refund",
      "chargeback",
      "charged_back",
      "reversed",
      "disputed",
      "canceled",
      "cancelled",
    ]);

    const activeEmails = new Set<string>();
    {
      let from = 0;
      const step = 1000;
      while (true) {
        const { data: rows, error } = await supabaseAdmin
          .from("purchases")
          .select("email, payment_status")
          .range(from, from + step - 1);
        if (error) throw error;
        if (!rows || rows.length === 0) break;
        for (const p of rows) {
          const email = (p.email ?? "").toLowerCase();
          if (!email) continue;
          if (!REFUND.has(String(p.payment_status ?? "").toLowerCase())) {
            activeEmails.add(email);
          }
        }
        if (rows.length < step) break;
        from += step;
      }
    }

    const targets: { id: string; email: string }[] = [];
    let page = 1;
    while (true) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) throw error;
      const users = list?.users ?? [];
      for (const u of users) {
        const email = (u.email ?? "").toLowerCase();
        if (!email) continue;
        if (!activeEmails.has(email)) continue;
        if (u.last_sign_in_at) continue;
        const bannedUntil = (u as any).banned_until;
        if (bannedUntil && new Date(bannedUntil) > new Date()) continue;
        targets.push({ id: u.id, email });
      }
      if (users.length < 1000) break;
      page++;
    }

    const capped = data.limit ? targets.slice(0, data.limit) : targets;

    if (data.dryRun) {
      return {
        processed: 0,
        invited: 0,
        skipped: 0,
        total: capped.length,
        dryRun: true as const,
        errors: [] as { email: string; error: string }[],
      };
    }

    let invited = 0;
    let skipped = 0;
    const errors: { email: string; error: string }[] = [];

    for (const t of capped) {
      try {
        const { error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          t.email,
        );
        if (invErr) {
          const msg = String(invErr.message ?? "").toLowerCase();
          if (msg.includes("already") || msg.includes("registered")) {
            skipped++;
          } else {
            errors.push({ email: t.email, error: invErr.message ?? String(invErr) });
          }
        } else {
          invited++;
        }
      } catch (e: any) {
        errors.push({ email: t.email, error: e?.message ?? String(e) });
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "bulk_resend_access",
      {},
      { processed: capped.length, invited, skipped, errors: errors.slice(0, 10) },
    );

    return {
      processed: capped.length,
      invited,
      skipped,
      total: targets.length,
      dryRun: false as const,
      errors,
    };
  });

/**
 * Cria acesso COMUM (aluno) para uma lista explícita de e-mails.
 * Não insere nada em `user_roles` — nenhum admin é concedido.
 * Se já existir conta no Auth, apenas pula. Se houver purchase órfã
 * (user_id NULL) para o e-mail, vincula ao user_id recém-criado.
 * Não envia e-mail — usuário entra via "Esqueci minha senha".
 */
export const bulkCreateAccessByEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        emails: z.array(z.string().trim().toLowerCase().email()).min(1).max(100),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Cache de e-mails existentes no Auth
    const existing = new Map<string, string>();
    {
      let page = 1;
      while (true) {
        const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) throw error;
        for (const u of list?.users ?? []) {
          if (u.email) existing.set(u.email.toLowerCase(), u.id);
        }
        if (!list?.users || list.users.length < 1000) break;
        page++;
      }
    }

    let created = 0;
    let skipped = 0;
    let linkedPurchases = 0;
    const errors: { email: string; error: string }[] = [];
    const createdEmails: string[] = [];

    for (const rawEmail of data.emails) {
      const email = rawEmail.toLowerCase();
      try {
        let userId = existing.get(email) ?? null;

        if (userId) {
          skipped++;
        } else {
          const randomPw =
            crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "") + "Aa1!";
          const { data: createRes, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: randomPw,
              email_confirm: true,
              user_metadata: { imported: true, source: "bulk_create_access_by_emails" },
            });
          if (createErr) {
            const msg = (createErr.message ?? "").toLowerCase();
            if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
              skipped++;
            } else {
              throw createErr;
            }
          } else {
            userId = createRes?.user?.id ?? null;
            if (userId) {
              existing.set(email, userId);
              created++;
              createdEmails.push(email);
            }
          }
        }

        // Vincula purchases órfãs ao user_id
        if (userId) {
          const { data: linked, error: linkErr } = await supabaseAdmin
            .from("purchases")
            .update({ user_id: userId })
            .eq("email", email)
            .is("user_id", null)
            .select("id");
          if (linkErr) {
            errors.push({ email, error: `link_purchases: ${linkErr.message}` });
          } else if (linked) {
            linkedPurchases += linked.length;
          }
        }
      } catch (e: any) {
        errors.push({ email, error: e?.message ?? String(e) });
      }
    }

    await audit(
      { id: context.userId, email: (context.claims?.email as string | undefined) ?? null },
      "bulk_create_access_by_emails",
      {},
      {
        processed: data.emails.length,
        created,
        skipped,
        linkedPurchases,
        createdEmails,
        errors: errors.slice(0, 20),
      },
    );

    return {
      processed: data.emails.length,
      created,
      skipped,
      linkedPurchases,
      createdEmails,
      errors,
    };
  });


// ===================== Exportação de contatos para disparo (WhatsApp) =====================

export type ContactRow = {
  nome: string;
  telefone: string;
  email: string;
  ultimaCompra: string | null;
  aulas: number;
  pct: number;
};

function normalizePhone(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let d = digits;
  if (d.startsWith("00")) d = d.slice(2);
  // Números brasileiros vêm sem DDI na maioria dos registros da Payt
  if (!d.startsWith("55") && (d.length === 10 || d.length === 11)) d = `55${d}`;
  if (d.length < 12 || d.length > 15) return null;
  return `+${d}`;
}

export const exportWhatsappContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["low_engagement", "period"]),
        maxPct: z.number().min(0).max(100).optional().default(5),
        from: z.string().optional(),
        to: z.string().optional(),
        totalLessons: z.number().int().min(1).max(500).optional().default(39),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rpc =
      data.kind === "low_engagement"
        ? supabaseAdmin.rpc("wa_low_engagement" as any, {
            _total_lessons: data.totalLessons,
            _max_pct: data.maxPct,
          })
        : supabaseAdmin.rpc("wa_buyers_period" as any, {
            _from: data.from,
            _to: data.to,
            _total_lessons: data.totalLessons,
          });

    const { data: rows, error } = await rpc;
    if (error) throw error;

    const seen = new Set<string>();
    const contacts: ContactRow[] = [];
    let semTelefone = 0;

    for (const r of (rows ?? []) as any[]) {
      const phone = normalizePhone(r.telefone);
      if (!phone) {
        semTelefone++;
        continue;
      }
      if (seen.has(phone)) continue;
      seen.add(phone);
      contacts.push({
        nome: String(r.nome ?? "").trim(),
        telefone: phone,
        email: String(r.email ?? ""),
        ultimaCompra: r.last_purchase ?? null,
        aulas: Number(r.aulas ?? 0),
        pct: Number(r.pct ?? 0),
      });
    }

    return { contacts, total: (rows ?? []).length, semTelefone };
  });
