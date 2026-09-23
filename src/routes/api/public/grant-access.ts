// Liberação manual de acesso para agentes de suporte.
// POST { "email": "cliente@exemplo.com" } com header Authorization: Bearer <SUPPORT_AGENT_SHARED_SECRET>
// Reutiliza exatamente o mesmo provisionAccess() usado pelo webhook da Payt.

import { createFileRoute } from '@tanstack/react-router'
import { hasActiveAccess, INACTIVE_STATUSES } from '@/lib/purchase-access'
import { findUserIdByEmail, provisionAccess } from '@/lib/payt-provision.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function authorized(request: Request) {
  const secret = process.env.SUPPORT_AGENT_SHARED_SECRET ?? ''
  if (!secret) return false
  const token = (request.headers.get('authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  return !!token && timingSafeEqual(token, secret)
}

export const Route = createFileRoute('/api/public/grant-access')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        if (!authorized(request)) return json({ ok: false, error: 'unauthorized' }, 401)

        let email = ''
        try {
          const body = (await request.json()) as { email?: unknown }
          email = String(body?.email ?? '').trim().toLowerCase()
        } catch {
          return json({ ok: false, error: 'invalid_json' }, 400)
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ ok: false, error: 'invalid_email' }, 400)
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const { data: purchases, error } = await supabaseAdmin
          .from('purchases')
          .select('payment_status, payt_order_id, updated_at, purchase_date, created_at, raw_payload')
          .eq('email', email)

        if (error) {
          console.error('[grant-access] purchases error', error)
          return json({ ok: false, error: 'server_error' }, 500)
        }

        const rows = purchases ?? []

        let userId: string | null = null
        try {
          userId = await findUserIdByEmail(supabaseAdmin, email)
        } catch (err) {
          console.error('[grant-access] find user error', err)
        }

        if (rows.length === 0 && !userId) {
          return json({ ok: false, error: 'not_found' })
        }

        const active = hasActiveAccess(rows as any)

        if (rows.length > 0 && !active) {
          return json({ ok: false, error: 'no_active_purchase' })
        }

        // Conta já existe e a compra está ativa: no-op seguro.
        if (active && userId) {
          const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId)
          const banned = (user?.user as any)?.banned_until
            ? new Date((user!.user as any).banned_until).getTime() > Date.now()
            : false
          if (!banned) return json({ ok: true, already_had_access: true })
        }

        const activePurchase = (rows as any[]).find(
          (p) => !INACTIVE_STATUSES.has(String(p.payment_status ?? '').trim().toLowerCase()),
        )
        const cartId = activePurchase?.payt_order_id ?? `manual-${Date.now()}`
        const raw = activePurchase?.raw_payload ?? null
        const nome =
          raw?.body?.customer?.name ?? raw?.customer?.name ?? raw?.raw_webhook?.customer?.name ?? null
        const telefone =
          raw?.body?.customer?.phone ?? raw?.customer?.phone ?? raw?.raw_webhook?.customer?.phone ?? null

        const result = await provisionAccess(supabaseAdmin, { email, nome, telefone, cartId })

        if (!result.userId) {
          return json({ ok: false, error: result.error ?? 'provision_failed' }, 500)
        }

        return json({ ok: true, already_had_access: false })
      },
    },
  },
})
