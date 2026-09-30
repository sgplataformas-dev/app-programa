export const REFUND_STATUSES = new Set([
  "refunded",
  "refund",
  "chargeback",
  "charged_back",
  "reversed",
  "disputed",
]);

// "canceled"/"cancelled" = PIX/boleto expirado (carrinho abandonado).
// Não é reembolso, mas também não libera acesso sozinho.
export const INACTIVE_STATUSES = new Set([
  ...REFUND_STATUSES,
  "canceled",
  "cancelled",
]);

export type PurchaseRow = {
  payment_status?: string | null;
  payt_order_id?: string | null;
  updated_at?: string | null;
  purchase_date?: string | null;
  created_at?: string | null;
  product_name?: string | null;
};

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

function rowTime(row: PurchaseRow) {
  const t = row.updated_at ?? row.purchase_date ?? row.created_at;
  const ms = t ? Date.parse(t) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

// Linhas importadas em lote (legacy-payt-*) são cópias de pedidos antigos e não
// refletem estornos posteriores — não podem reativar quem pediu reembolso.
function isLegacyImport(row: PurchaseRow) {
  return (
    norm(row.payt_order_id).startsWith("legacy-") || norm(row.payment_status) === "imported"
  );
}

/**
 * Regra de acesso: vale o evento de pagamento mais recente — mas avaliado
 * POR PRODUTO, nunca misturando produtos diferentes. Reembolso/chargeback de
 * um produto (ex.: Flacidez Nunca Mais) nunca derruba o login de quem ainda
 * tem outro produto (ex.: Programa Active) com pagamento ativo — cada
 * produto entra numa "família" separada e basta UMA família ativa pra manter
 * o acesso à plataforma. O gate de conteúdo específico de cada produto
 * (ex.: hasFlacidezAccess) continua responsável por checar aquele produto
 * sozinho.
 */
export function hasActiveAccess(rows: PurchaseRow[] | null | undefined): boolean {
  const list = rows ?? [];
  if (list.length === 0) return false;

  const real = list.filter((r) => !isLegacyImport(r));
  if (real.length === 0) {
    // só linhas legadas (importação) — comportamento anterior: qualquer uma
    // não cancelada/expirada já basta.
    return list.some((r) => !INACTIVE_STATUSES.has(norm(r.payment_status)));
  }

  const groups = new Map<string, PurchaseRow[]>();
  for (const r of real) {
    const key = norm(r.product_name) || "__sem_produto__";
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  for (const groupRows of groups.values()) {
    const refunds = groupRows.filter((r) => REFUND_STATUSES.has(norm(r.payment_status)));

    if (refunds.length === 0) {
      // Esse produto nunca teve estorno: basta uma compra ativa dele.
      if (groupRows.some((r) => !INACTIVE_STATUSES.has(norm(r.payment_status)))) return true;
      continue;
    }

    const lastRefund = Math.max(...refunds.map(rowTime));
    const lastActive = Math.max(
      0,
      ...groupRows.filter((r) => !INACTIVE_STATUSES.has(norm(r.payment_status))).map(rowTime),
    );
    if (lastActive > lastRefund) return true;
  }

  return false;
}
