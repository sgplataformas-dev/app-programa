import { createFileRoute } from '@tanstack/react-router'
import { retry } from '@/lib/http-retry'
import { hasActiveAccess } from '@/lib/purchase-access'
import { findUserIdByEmail, provisionAccess } from '@/lib/payt-provision.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const APPROVED_STATUSES = new Set(['paid', 'approved', 'authorized', 'completed'])
const REFUND_STATUSES = new Set([
  'refunded',
  'refund',
  'chargeback',
  'charged_back',
  'reversed',
  'disputed',
  'canceled',
  'cancelled',
])
const FINAL_EVENT_STATUSES = new Set([
  'processed',
  'refunded',
  'ignored',
  'test_ok',
  'rejected',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

type PaytBody = {
  integration_key?: string
  status?: string
  test?: boolean
  cart_id?: string
  customer?: {
    email?: string
    name?: string
    phone?: string
    doc?: string
  }
  product?: {
    name?: string
    code?: string
    price?: number
  }
  updated_at?: string
  started_at?: string
}

function normalizeStatus(status: unknown) {
  return String(status ?? '').trim().toLowerCase()
}

function duplicateError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return error?.code === '23505' || message.includes('duplicate')
}

function getCartId(body: PaytBody, raw: any) {
  return body?.cart_id ?? raw?.cart_id ?? raw?.id ?? `payt-${Date.now()}`
}

function getEventId(cartId: unknown, body: PaytBody) {
  return `${cartId}-${body?.status ?? 'unknown'}-${body?.updated_at ?? Date.now()}`
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}




async function markEvent(
  supabaseAdmin: any,
  eventId: string,
  values: Record<string, unknown>,
) {
  await supabaseAdmin
    .from('webhook_events')
    .update({ ...values, processed_at: new Date().toISOString() })
    .eq('provider', 'payt')
    .eq('event_id', eventId)
}

export const Route = createFileRoute('/api/public/webhooks/payt')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async () => json({ ok: true, message: 'Payt webhook endpoint ativo' }),

      POST: async ({ request }) => {
        const rawBody = await request.text()
        const headers: Record<string, string> = {}
        request.headers.forEach((v, k) => {
          headers[k] = v
        })

        let raw: any = null
        try {
          raw = rawBody ? JSON.parse(rawBody) : null
        } catch {
          raw = { _raw: rawBody }
        }

        // Payt encapsula tudo em "body" no postback.
        const body: PaytBody = (raw?.body ?? raw) as PaytBody
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const cartId = getCartId(body, raw)
        const eventId = String(getEventId(cartId, body))

        const { error: insertErr } = await supabaseAdmin.from('webhook_events').insert({
          provider: 'payt',
          event_id: eventId,
          payload: { headers, body: raw } as any,
          status: 'received',
        })

        if (insertErr) {
          if (!duplicateError(insertErr)) {
            console.error('[payt-webhook] insert event error', insertErr)
          } else {
            const { data: existingEvent, error: existingErr } = await supabaseAdmin
              .from('webhook_events')
              .select('status')
              .eq('provider', 'payt')
              .eq('event_id', eventId)
              .maybeSingle()

            if (existingErr) {
              console.error('[payt-webhook] read duplicate event error', existingErr)
              return json({ ok: false, error: 'event_lookup_failed' }, 500)
            }

            const existingStatus = String(existingEvent?.status ?? '')
            if (FINAL_EVENT_STATUSES.has(existingStatus)) {
              return json({ ok: true, duplicate: true, status: existingStatus })
            }

            // Retries from Payt used to be ignored when the first attempt stopped
            // after logging the event. Keep processing non-final events so a retry
            // can release access instead of leaving the purchase stuck forever.
            await supabaseAdmin
              .from('webhook_events')
              .update({ payload: { headers, body: raw } as any, status: 'received' })
              .eq('provider', 'payt')
              .eq('event_id', eventId)
          }
        }

        try {
          const expected = process.env.PAYT_WEBHOOK_SECRET
          if (!expected) {
            await markEvent(supabaseAdmin, eventId, {
              status: 'error',
              error_message: 'PAYT_WEBHOOK_SECRET ausente',
            })
            return json({ ok: false, error: 'server_misconfigured' }, 500)
          }

          if (body?.integration_key !== expected) {
            await markEvent(supabaseAdmin, eventId, {
              status: 'rejected',
              error_message: 'integration_key inválida',
            })
            return json({ ok: false, error: 'invalid_integration_key' }, 401)
          }

          if (body?.test === true) {
            await markEvent(supabaseAdmin, eventId, { status: 'test_ok' })
            return json({ ok: true, test: true })
          }

          const status = normalizeStatus(body?.status)
          const email = body?.customer?.email?.trim().toLowerCase()

          if (REFUND_STATUSES.has(status)) {
            const refundCartId = String(cartId)
            const { data: updatedPurchases } = await retry(
              async () =>
                await supabaseAdmin
                  .from('purchases')
                  .update({
                    payment_status: status,
                    raw_payload: raw as any,
                  })
                  .eq('payt_order_id', refundCartId)
                  .select('user_id, email'),
              { retries: 3, label: 'payt-refund-update-purchases' },
            )

            let affectedUserId: string | null =
              updatedPurchases?.find((p: any) => p.user_id)?.user_id ?? null

            if (!affectedUserId && email) {
              affectedUserId = await findUserIdByEmail(supabaseAdmin, email)
            }

            if (email) {
              const { data: stillActive } = await retry(
                async () =>
                  await supabaseAdmin
                    .from('purchases')
                    .select('id, payment_status, payt_order_id, updated_at, purchase_date, created_at')
                    .eq('email', email),
                { retries: 3, label: 'payt-refund-check-active' },
              )

              const hasActive = hasActiveAccess(stillActive as any)

              if (!hasActive && affectedUserId) {
                try {
                  await retry(
                    () =>
                      supabaseAdmin.auth.admin.updateUserById(affectedUserId!, {
                        ban_duration: '876000h',
                      } as any),
                    { retries: 3, label: 'payt-refund-ban-user' },
                  )
                  await retry(
                    () => supabaseAdmin.auth.admin.signOut(affectedUserId!),
                    { retries: 3, label: 'payt-refund-signout' },
                  )
                } catch (err) {
                  console.error('[payt-webhook] revoke access error', err)
                }
              }
            }

            await markEvent(supabaseAdmin, eventId, {
              status: 'refunded',
              error_message: `status=${status}`,
            })
            return json({ ok: true, refunded: true, status })
          }


          if (!APPROVED_STATUSES.has(status)) {
            await markEvent(supabaseAdmin, eventId, {
              status: 'ignored',
              error_message: `status=${status}`,
            })
            return json({ ok: true, ignored: true, status })
          }

          if (!email) {
            await markEvent(supabaseAdmin, eventId, {
              status: 'error',
              error_message: 'email ausente',
            })
            return json({ ok: false, error: 'missing_email' }, 400)
          }

          const nome = body?.customer?.name ?? ''
          const telefone = body?.customer?.phone ?? null
          const productName = body?.product?.name ?? null
          const amount =
            typeof body?.product?.price === 'number'
              ? Number((body.product.price / 100).toFixed(2))
              : null
          const purchaseDate = body?.updated_at ?? body?.started_at ?? new Date().toISOString()

          // Registra a compra antes do envio/criação de usuário. Assim, mesmo que
          // o e-mail transacional ou Auth demore, o primeiro acesso já reconhece
          // a compra pelo e-mail e não bloqueia a pessoa pagante.
          const { error: initialPurchaseErr } = await retry(
            async () =>
              await supabaseAdmin
                .from('purchases')
                .upsert(
                  {
                    email,
                    payt_order_id: String(cartId),
                    product_name: productName,
                    amount,
                    payment_status: status,
                    purchase_date: purchaseDate,
                    raw_payload: raw as any,
                  },
                  { onConflict: 'payt_order_id' },
                ),
            { retries: 3, label: 'payt-upsert-purchase' },
          )

          if (initialPurchaseErr) {
            console.error('[payt-webhook] purchase upsert error', initialPurchaseErr)
            await markEvent(supabaseAdmin, eventId, {
              status: 'error',
              error_message: `purchase: ${initialPurchaseErr.message}`,
            })
            return json({ ok: false, error: 'purchase_failed' }, 500)
          }

          const provision = await provisionAccess(supabaseAdmin, {
            email,
            nome,
            telefone,
            cartId: String(cartId),
          })

          if (!provision.userId) {
            // Mantém como "received" para o reprocessador (cron a cada 5 min)
            // terminar de criar a conta mesmo se a Payt cortar a conexão (cód. 28).
            await supabaseAdmin
              .from('webhook_events')
              .update({
                status: 'received',
                error_message: `provision_pending: ${provision.error ?? 'desconhecido'}`,
              })
              .eq('provider', 'payt')
              .eq('event_id', eventId)
            return json({ ok: true, access_recorded: true, provision_pending: true })
          }



          await markEvent(supabaseAdmin, eventId, { status: 'processed' })
          return json({ ok: true, status })
        } catch (err: any) {
          console.error('[payt-webhook] unhandled error', err)
          await markEvent(supabaseAdmin, eventId, {
            status: 'error',
            error_message: `unhandled: ${err?.message ?? String(err)}`,
          })
          return json({ ok: false, error: 'internal_error' }, 500)
        }
      },
    },
  },
})
