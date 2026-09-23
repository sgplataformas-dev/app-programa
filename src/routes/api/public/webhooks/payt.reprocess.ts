// Reprocessa eventos Payt que ficaram pela metade (código 28 / 0 na Payt:
// a requisição chega, mas a resposta 200 não volta a tempo e o processamento
// é cortado). Roda via pg_cron a cada 5 minutos e também pode ser chamado
// manualmente pelo painel admin.

import { createFileRoute } from '@tanstack/react-router'
import { APPROVED_STATUSES, provisionAccess } from '@/lib/payt-provision.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase()

function authorized(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const webhookSecret = process.env.PAYT_WEBHOOK_SECRET ?? ''
  if (!token) return false
  return (
    (!!serviceKey && token === serviceKey) ||
    (!!webhookSecret && token === webhookSecret)
  )
}

async function runReprocess(limit: number) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: events, error } = await supabaseAdmin
    .from('webhook_events')
    .select('id, event_id, payload, status, error_message, received_at')
    .eq('provider', 'payt')
    .in('status', ['received', 'error'])
    .gte('received_at', since)
    .order('received_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[payt-reprocess] load events error', error)
    return { ok: false, error: error.message }
  }

  const results: Array<Record<string, unknown>> = []

  for (const event of events ?? []) {
    const payload = (event as any).payload ?? {}
    const raw = payload?.body ?? payload
    const body = raw?.body ?? raw
    const status = norm(body?.status)
    const email = norm(body?.customer?.email)
    const cartId = String(body?.cart_id ?? raw?.cart_id ?? raw?.id ?? '')

    if (body?.test === true) {
      await supabaseAdmin
        .from('webhook_events')
        .update({ status: 'test_ok', processed_at: new Date().toISOString() })
        .eq('id', (event as any).id)
      continue
    }

    if (!APPROVED_STATUSES.has(status)) {
      // Reembolsos/ignorados não criam conta; apenas encerra o evento.
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'ignored',
          error_message: `reprocess: status=${status || 'desconhecido'}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', (event as any).id)
      continue
    }

    if (!email) {
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'error',
          error_message: 'reprocess: email ausente',
          processed_at: new Date().toISOString(),
        })
        .eq('id', (event as any).id)
      continue
    }

    // Garante que a compra existe (o corte pode ter acontecido antes do upsert).
    if (cartId) {
      const amount =
        typeof body?.product?.price === 'number'
          ? Number((body.product.price / 100).toFixed(2))
          : null
      await supabaseAdmin.from('purchases').upsert(
        {
          email,
          payt_order_id: cartId,
          product_name: body?.product?.name ?? null,
          amount,
          payment_status: status,
          purchase_date:
            body?.updated_at ?? body?.started_at ?? (event as any).received_at,
          raw_payload: raw as any,
        },
        { onConflict: 'payt_order_id' },
      )
    }

    const result = await provisionAccess(supabaseAdmin, {
      email,
      nome: body?.customer?.name ?? '',
      telefone: body?.customer?.phone ?? null,
      cartId,
    })

    if (result.userId) {
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'processed',
          error_message: null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', (event as any).id)
    } else {
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'received',
          error_message: `provision_pending: ${result.error ?? 'desconhecido'}`,
        })
        .eq('id', (event as any).id)
    }

    results.push({
      event_id: (event as any).event_id,
      email,
      cart_id: cartId,
      user_id: result.userId,
      created: result.created,
      error: result.error ?? null,
    })
  }

  const provisioned = results.filter((r) => r['user_id']).length
  console.log(
    `[payt-reprocess] eventos=${events?.length ?? 0} provisionados=${provisioned}`,
  )

  return {
    ok: true,
    scanned: events?.length ?? 0,
    provisioned,
    failed: results.length - provisioned,
    results,
  }
}

export const Route = createFileRoute('/api/public/webhooks/payt/reprocess')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        if (!authorized(request)) {
          return json({ ok: false, error: 'unauthorized' }, 401)
        }
        let limit = 50
        try {
          const body = await request.json()
          if (typeof body?.limit === 'number') {
            limit = Math.min(Math.max(1, body.limit), 200)
          }
        } catch {
          // corpo vazio é válido
        }
        const result = await runReprocess(limit)
        return json(result, result.ok ? 200 : 500)
      },
    },
  },
})
