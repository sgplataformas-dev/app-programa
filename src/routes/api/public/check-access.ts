// Consulta de acesso para agentes de suporte.
// POST { "email": "cliente@exemplo.com" } com header Authorization: Bearer <SUPPORT_AGENT_SHARED_SECRET>
// Resposta: { found, has_access, email } ou { found: false }

import { createFileRoute } from '@tanstack/react-router'
import { hasActiveAccess } from '@/lib/purchase-access'

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

export const Route = createFileRoute('/api/public/check-access')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        if (!authorized(request)) {
          return json({ error: 'unauthorized' }, 401)
        }

        let email = ''
        try {
          const body = (await request.json()) as { email?: unknown }
          email = String(body?.email ?? '').trim().toLowerCase()
        } catch {
          return json({ error: 'invalid_json' }, 400)
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ error: 'invalid_email' }, 400)
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // Acesso à plataforma = existe compra e o último evento de pagamento não é estorno.
        const { data: purchases, error } = await supabaseAdmin
          .from('programa_active_purchases')
          .select('payment_status, payt_order_id, updated_at, purchase_date, created_at')
          .eq('email', email)

        if (error) {
          console.error('[check-access] purchases error', error)
          return json({ error: 'server_error' }, 500)
        }

        // Conta no Auth (cadastro existente mesmo sem compra)
        let hasAccount = false
        try {
          const { data: uid } = await supabaseAdmin.rpc('find_user_id_by_email', {
            _email: email,
          })
          hasAccount = !!uid
        } catch (err) {
          console.error('[check-access] rpc error', err)
        }

        const rows = purchases ?? []
        const found = rows.length > 0 || hasAccount
        if (!found) return json({ found: false })

        return json({
          found: true,
          has_access: hasActiveAccess(rows as any),
          email,
        })
      },
    },
  },
})
