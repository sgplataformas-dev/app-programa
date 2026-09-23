import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  handleLiberar,
  handleRevogar,
  handleStatus,
  HELP_TEXT,
} from "@/lib/whatsapp-commands.server";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
};

const inputSchema = z
  .object({
    from: z.string().optional(),
    text: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

type ExtractedRequest = {
  from: string;
  text: string;
  name: string | null;
  sale?: any;
};

function buildSale(item: any) {
  const rw = item?.raw_webhook ?? {};
  const cartId = rw?.cart_id ?? item?.transaction_id ?? rw?.transaction_id ?? null;
  if (!cartId) return null;
  const priceCents = rw?.product?.price;
  return {
    cartId: String(cartId),
    productName: rw?.product?.name ?? item?.produto ?? null,
    amount:
      typeof priceCents === "number"
        ? Number((priceCents / 100).toFixed(2))
        : typeof item?.valor === "number"
          ? item.valor
          : null,
    nome: rw?.customer?.name ?? item?.nome ?? null,
    telefone: rw?.customer?.phone ?? item?.telefone ?? null,
    status: String(rw?.status ?? item?.status ?? "paid").toLowerCase(),
    raw: item,
  };
}

// Aceita tanto {from,text,name} (WhatsApp) quanto payloads de venda (Payt/n8n).
function extractRequest(payload: any): ExtractedRequest | null {
  const item = Array.isArray(payload) ? payload[0] : payload;
  if (!item || typeof item !== "object") return null;

  const from = String(
    item.from ?? item.telefone ?? item.phone ?? item.raw_webhook?.customer?.phone ?? "",
  );
  const name =
    item.name ?? item.nome ?? item.raw_webhook?.customer?.name ?? null;

  if (typeof item.text === "string" && item.text.trim()) {
    return { from, text: item.text, name, sale: buildSale(item) };
  }

  const email = String(
    item.email ?? item.raw_webhook?.customer?.email ?? "",
  ).trim();
  const status = String(item.status ?? item.raw_webhook?.status ?? "").toLowerCase();

  if (!email) return null;

  const APPROVED = ["approved", "paid", "authorized", "completed"];
  const REFUND = ["refunded", "refund", "chargeback", "charged_back", "reversed", "disputed", "canceled", "cancelled"];

  const sale = buildSale(item);

  if (REFUND.includes(status)) return { from, text: `revogar ${email}`, name };
  if (!status || APPROVED.includes(status)) return { from, text: `liberar ${email}`, name, sale };

  return { from, text: `status ${email}`, name, sale };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^0/, "");
}

const COMMAND_WORDS: Record<string, string> = {
  liberar: "liberar",
  libera: "liberar",
  liberado: "liberar",
  liberação: "liberar",
  acesso: "liberar",
  comprovante: "liberar",
  comprovantes: "liberar",
  compra: "liberar",
  comprou: "liberar",
  pagamento: "liberar",
  pagou: "liberar",
  recibo: "liberar",
  revogar: "revogar",
  revoga: "revogar",
  bloquear: "revogar",
  bloqueia: "revogar",
  status: "status",
  consultar: "status",
  verificar: "status",
  ajuda: "ajuda",
  help: "ajuda",
};

// Aceita frases naturais: "Libera esse email para mim fulano@gmail.com"
function parseCommand(text: string) {
  const clean = text.trim();
  const words = clean.split(/\s+/);
  const emailMatch = clean.match(/[^\s@<>,;:"']+@[^\s@<>,;:"']+\.[^\s@<>,;:"']+/);

  let command = "ajuda";
  for (const w of words) {
    const key = w.toLowerCase().replace(/[^\wáéíóúãõâêôç]/gi, "");
    if (COMMAND_WORDS[key]) {
      command = COMMAND_WORDS[key];
      break;
    }
  }

  const args = emailMatch ? [emailMatch[0]] : [];

  // Mensagem com e-mail e sem comando explícito (ex.: comprovante enviado)
  // é tratada como pedido de liberação.
  if (command === "ajuda" && args.length > 0) {
    command = "liberar";
  }

  return { command, args };
}

export const Route = createFileRoute("/api/public/webhooks/whatsapp-commands")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async () =>
        json({ ok: true, message: "WhatsApp commands endpoint ativo" }),

      POST: async ({ request }) => {
        const expected = process.env.WHATSAPP_COMMANDS_WEBHOOK_SECRET;
        if (!expected) {
          return json({ ok: false, error: "server_misconfigured" }, 500);
        }

        const secret = request.headers.get("x-webhook-secret") ?? "";
        if (secret !== expected) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }

        let req: { from: string; text: string; name: string | null; sale?: any } | null = null;
        try {
          const raw = await request.json();
          inputSchema.parse(Array.isArray(raw) ? (raw[0] ?? {}) : raw);
          req = extractRequest(raw);
        } catch (err: any) {
          return json({ ok: false, error: "invalid_body", details: err?.message }, 400);
        }

        if (!req) {
          return json({ ok: false, error: "invalid_body", details: "sem texto ou e-mail" }, 400);
        }

        
        const phone = normalizePhone(req.from);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Se houver registros na whitelist, só permite números autorizados.
        const adminAny = supabaseAdmin as any;
        const { data: whitelist, error: whitelistErr } = await adminAny
          .from("whatsapp_command_whitelist")
          .select("id")
          .eq("phone", phone)
          .limit(1);

        if (whitelistErr) {
          console.error("[whatsapp-commands] whitelist error", whitelistErr);
        }

        const { count } = await adminAny
          .from("whatsapp_command_whitelist")
          .select("*", { count: "exact", head: true });

        const whitelistEnabled = (count ?? 0) > 0;
        if (phone && whitelistEnabled && (!Array.isArray(whitelist) || whitelist.length === 0)) {
          return json({ ok: false, reply: "Número não autorizado a enviar comandos." }, 403);
        }

        const { command, args } = parseCommand(req.text);
        const arg0 = args[0] ? normalizeEmail(args[0]) : "";

        let result: { reply: string; status?: string };
        const ctx = { supabaseAdmin };

        try {
          switch (command) {
            case "liberar":
            case "libera":
              result = await handleLiberar(ctx, arg0, req.sale ?? null);
              break;
            case "revogar":
            case "revoga":
              result = await handleRevogar(ctx, arg0);
              break;
            case "status":
              result = await handleStatus(ctx, arg0);
              break;
            case "ajuda":
            case "help":
            default:
              result = { reply: HELP_TEXT, status: "ok" };
          }
        } catch (err: any) {
          console.error("[whatsapp-commands] unhandled error", err);
          result = { reply: "Erro inesperado. Tente novamente.", status: "error" };
        }

        await adminAny.from("whatsapp_command_log").insert({
          phone,
          name: req.name ?? null,
          command,
          args: args as any,
          response: result.reply,
          status: result.status ?? "ok",
        });

        return json({ ok: true, reply: result.reply });
      },
    },
  },
});
