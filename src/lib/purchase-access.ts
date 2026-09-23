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
 * Regra de acesso: vale o evento de pagamento mais recente.
 * Se o último evento real for reembolso/chargeback, o acesso é negado —
 * mesmo que existam registros aprovados anteriores (ou cópias legadas).
 */
export function hasActiveAccess(rows: PurchaseRow[] | null | undefined): boolean {
  const list = rows ?? [];
  if (list.length === 0) return false;

  const real = list.filter((r) => !isLegacyImport(r));
  const refunds = real.filter((r) => REFUND_STATUSES.has(norm(r.payment_status)));

  if (refunds.length === 0) {
    // Sem estorno: basta uma compra que não esteja cancelada/expirada.
    return list.some((r) => !INACTIVE_STATUSES.has(norm(r.payment_status)));
  }

  const lastRefund = Math.max(...refunds.map(rowTime));
  const lastActive = Math.max(
    0,
    ...real
      .filter((r) => !INACTIVE_STATUSES.has(norm(r.payment_status)))
      .map(rowTime),
  );

  return lastActive > lastRefund;
}
