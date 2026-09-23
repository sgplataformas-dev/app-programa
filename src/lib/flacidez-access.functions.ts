import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verifica se o usuário logado comprou o "Flacidez Nunca Mais".
 * Fontes consultadas:
 *  - purchases — compra ativa com nome do produto, dados brutos ou acesso manual
 *  - base externa: tabelas de vendas (sales / vendas_aprovacao / vendas_payt)
 * Admins têm acesso liberado.
 */
export const hasFlacidezAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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

    const FLACIDEZ_MATCHER = /flacidez|col[aá]geno|pele|nunca/i;
    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    const isActiveStatus = (value: unknown) => !REFUND_STATUSES.has(normalize(value));
    const includesFlacidez = (value: unknown) => FLACIDEZ_MATCHER.test(String(value ?? ""));

    const email = String((context.claims as any)?.email ?? "").trim().toLowerCase();
    if (!email) return { hasAccess: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Revogação manual (bloqueia mesmo com compra ativa)
    const { data: denied } = await supabaseAdmin
      .from("flacidez_denylist")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (denied) return { hasAccess: false as const };

    // Admin sempre tem acesso
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if ((roles ?? []).some((r: any) => r.role === "admin")) {
      return { hasAccess: true as const };
    }

    // 1) Base principal
    const { data: purchases, error } = await supabaseAdmin
      .from("purchases")
      .select("product_name, payment_status, raw_payload")
      .eq("email", email);
    if (error) console.error("[flacidez-access] purchases error", error);

    const localRows = purchases ?? [];
    const hasLocalActive = localRows.some((p: any) => isActiveStatus(p.payment_status));
    const hasNamedLocalFlacidez = localRows.some((p: any) => {
      if (!isActiveStatus(p.payment_status)) return false;
      const raw = p.raw_payload as any;
      return [
        p.product_name,
        raw?.product?.name,
        raw?.product?.title,
        raw?.product?.code,
        raw?.link?.title,
        raw?.body?.product?.name,
        raw?.body?.product?.title,
        raw?.body?.product?.code,
        raw?.body?.link?.title,
      ].some(includesFlacidez);
    });
    if (hasNamedLocalFlacidez) return { hasAccess: true as const };

    // 2) Bases externas de vendas
    const externalUrl = process.env.EXTERNAL_SUPABASE_URL;
    const externalKey = process.env.EXTERNAL_SUPABASE_ANON_KEY;
    let hasExternalActive = false;
    if (externalUrl && externalKey) {
      const headers = {
        apikey: externalKey,
        Authorization: `Bearer ${externalKey}`,
      };
      const encoded = encodeURIComponent(email);
      const sources: Array<{ table: string; emailColumn: string; productColumn: string }> = [
        { table: "sales", emailColumn: "email", productColumn: "produto" },
        { table: "sales", emailColumn: "email", productColumn: "product_name" },
        { table: "sales", emailColumn: "customer_email", productColumn: "products_name" },
        { table: "vendas_aprovacao", emailColumn: "email", productColumn: "produto" },
        { table: "vendas_payt", emailColumn: "customer_email", productColumn: "products_name" },
      ];
      for (const src of sources) {
        try {
          const res = await fetch(
            `${externalUrl}/rest/v1/${src.table}?select=${src.productColumn}&${src.emailColumn}=eq.${encoded}`,
            { headers },
          );
          if (!res.ok) continue;
          const rows = (await res.json()) as any[];
          if (!Array.isArray(rows) || rows.length === 0) continue;
          hasExternalActive = true;
          if (rows.some((r) => includesFlacidez(r?.[src.productColumn]))) {
            return { hasAccess: true as const };
          }
        } catch (err) {
          console.error(`[flacidez-access] ${src.table} fetch error`, err);
        }
      }
    }

    // Antes liberávamos qualquer compra ativa quando o nome do produto não vinha
    // preenchido — isso dava acesso ao Flacidez para quem comprou só o Programa
    // Active. Agora exigimos que o produto comprado seja de fato o Flacidez.
    void hasLocalActive;
    void hasExternalActive;

    return { hasAccess: false as const };
  });
