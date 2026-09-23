import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasActiveAccess } from "@/lib/purchase-access";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

async function findUserIdByEmail(
  supabaseAdmin: any,
  email: string,
): Promise<string | null> {
  // Busca indexada (RPC) — paginar listUsers com milhares de contas estourava
  // o tempo limite e derrubava o login de quem comprou agora.
  try {
    const { data, error } = await supabaseAdmin.rpc("find_user_id_by_email", {
      _email: email,
    });
    if (error) {
      console.error("[email-only-login] rpc find_user_id_by_email error", error);
      return null;
    }
    return (data as string | null) ?? null;
  } catch (err) {
    console.error("[email-only-login] rpc find_user_id_by_email threw", err);
    return null;
  }
}

/**
 * Login apenas com e-mail (sem senha, sem verificação por link).
 * Fluxo:
 *  1) Confirma que existe uma compra aprovada e não reembolsada para o e-mail.
 *  2) Localiza ou cria o usuário no Auth.
 *  3) Gera um magiclink server-side (não envia e-mail) e devolve o token_hash
 *     para o cliente estabelecer sessão via supabase.auth.verifyOtp.
 */
export const signInWithEmailOnly = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Verifica compra aprovada na base principal
    const { data: purchases, error: purchasesErr } = await supabaseAdmin
      .from("purchases")
      .select("payment_status, payt_order_id, updated_at, purchase_date, created_at")
      .eq("email", email);

    if (purchasesErr) {
      console.error("[email-only-login] purchases query error", purchasesErr);
      return { ok: false as const, reason: "server_error" as const };
    }

    const refunded =
      (purchases ?? []).length > 0 && !hasActiveAccess(purchases as any);
    let hasActive = hasActiveAccess(purchases as any);

    // 1b) Fallback — consulta bases externas (vendas_payt / vendas_aprovacao)
    // Estorno/chargeback tem precedência: não consultamos bases externas,
    // senão um registro antigo de venda reativaria quem pediu reembolso.
    if (!hasActive && !refunded) {
      const externalUrl = process.env.EXTERNAL_SUPABASE_URL;
      const externalKey = process.env.EXTERNAL_SUPABASE_ANON_KEY;
      if (externalUrl && externalKey) {
        const headers = {
          apikey: externalKey,
          Authorization: `Bearer ${externalKey}`,
        };
        const encoded = encodeURIComponent(email);
        for (const table of ["vendas_payt", "vendas_aprovacao"]) {
          try {
            const res = await fetch(
              `${externalUrl}/rest/v1/${table}?select=email&email=eq.${encoded}&limit=1`,
              { headers },
            );
            if (res.ok) {
              const rows = (await res.json()) as any[];
              if (Array.isArray(rows) && rows.length > 0) {
                hasActive = true;
                break;
              }
            } else {
              console.error(`[email-only-login] ${table} lookup status`, res.status);
            }
          } catch (err) {
            console.error(`[email-only-login] ${table} fetch error`, err);
          }
        }
      }
    }

    if (!hasActive) {
      if (refunded) {
        // Garante que sessões ativas do reembolsado sejam encerradas.
        try {
          const uid = await findUserIdByEmail(supabaseAdmin, email);
          if (uid) {
            await supabaseAdmin.auth.admin.updateUserById(uid, {
              ban_duration: "876000h",
            } as any);
            await supabaseAdmin.auth.admin.signOut(uid);
          }
        } catch (err) {
          console.error("[email-only-login] revoke refunded error", err);
        }
        return { ok: false as const, reason: "refunded" as const };
      }
      if (!purchases || purchases.length === 0) {
        return { ok: false as const, reason: "no_purchase" as const };
      }
      return { ok: false as const, reason: "refunded" as const };
    }

    // 2) Localiza ou cria o usuário
    let userId = await findUserIdByEmail(supabaseAdmin, email);
    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr || !created?.user?.id) {
        console.error("[email-only-login] createUser error", createErr);
        return { ok: false as const, reason: "server_error" as const };
      }
      userId = created.user.id;
    } else {
      // Destrava se estava banido por reembolso anterior (já validamos que tem compra ativa)
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        } as any);
      } catch (err) {
        console.error("[email-only-login] unban error", err);
      }
    }

    // 3) Gera magiclink server-side — não enviamos e-mail, apenas usamos o token_hash
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("[email-only-login] generateLink error", linkErr);
      return { ok: false as const, reason: "server_error" as const };
    }

    return {
      ok: true as const,
      token_hash: linkData.properties.hashed_token,
    };
  });
