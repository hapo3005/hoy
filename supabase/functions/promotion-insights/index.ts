import { createClient } from 'npm:@supabase/supabase-js@2.111.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

const ACTION_TYPES = new Set([
  'route_start',
  'service_open',
  'website_open',
  'reservation_start',
  'reservation_submit',
  'call_click',
  'menu_open',
])

const pct = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
const moneyPer = (priceCents: number | null, count: number) =>
  priceCents !== null && priceCents > 0 && count > 0 ? Math.round(priceCents / count) : null

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const promotionId = String(body?.promotion_id || '')
  if (!promotionId) return json({ error: 'promotion_id_required' }, 400)

  const { data: promotion, error: promotionError } = await adminClient
    .from('event_promotions')
    .select('id,offer_id,restaurant_id,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,approved_at,created_at')
    .eq('id', promotionId)
    .maybeSingle()
  if (promotionError) return json({ error: 'promotion_lookup_failed' }, 500)
  if (!promotion) return json({ error: 'promotion_not_found' }, 404)

  const { data: membership, error: membershipError } = await adminClient
    .from('restaurant_memberships')
    .select('restaurant_id')
    .eq('restaurant_id', promotion.restaurant_id)
    .eq('user_id', user.id)
    .not('verified_at', 'is', null)
    .maybeSingle()
  if (membershipError) return json({ error: 'membership_lookup_failed' }, 500)

  let admin = false
  if (!membership) {
    const email = String(user.email || '').toLowerCase()
    if (email) {
      const { data: adminRow } = await adminClient
        .from('hoy_admin_accounts')
        .select('user_id,active')
        .eq('email', email)
        .eq('active', true)
        .maybeSingle()
      admin = !!adminRow && (!adminRow.user_id || adminRow.user_id === user.id)
    }
  }
  if (!membership && !admin) return json({ error: 'forbidden' }, 403)

  const start = new Date(promotion.approved_at || promotion.starts_at || promotion.created_at)
  const endWithAttribution = new Date(new Date(promotion.ends_at).getTime() + 30 * 60_000)
  const until = new Date(Math.min(Date.now(), endWithAttribution.getTime()))

  const { data: rows, error: eventsError } = await adminClient
    .from('analytics_events')
    .select('id,event_type,session_id,metadata,occurred_at')
    .eq('restaurant_id', promotion.restaurant_id)
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', until.toISOString())
    .contains('metadata', { promotion_id: promotionId })
    .order('occurred_at', { ascending: true })
    .limit(10000)
  if (eventsError) return json({ error: 'analytics_lookup_failed' }, 500)

  const events = rows || []
  const sessionKey = (row: any) => row.session_id ? String(row.session_id) : `event:${row.id}`
  const impressionRows = events.filter((row: any) => row.event_type === 'promotion_impression')
  const openRows = events.filter((row: any) => row.event_type === 'promotion_open')
  const actionRows = events.filter((row: any) => ACTION_TYPES.has(String(row.event_type)))
  const reachSessions = new Set(impressionRows.map(sessionKey))
  const openSessions = new Set(openRows.map(sessionKey))
  const actionSessions = new Set(actionRows.map(sessionKey))
  const priceCents = Number.isInteger(Number(promotion.quoted_price_cents)) ? Number(promotion.quoted_price_cents) : null

  return json({
    promotion: {
      id: promotion.id,
      offer_id: promotion.offer_id,
      restaurant_id: promotion.restaurant_id,
      status: promotion.status,
      billing_status: promotion.billing_status,
      starts_at: promotion.starts_at,
      ends_at: promotion.ends_at,
      quoted_price_cents: priceCents,
      currency: promotion.currency,
    },
    metrics: {
      reached_sessions: reachSessions.size,
      profile_open_sessions: openSessions.size,
      qualified_action_sessions: actionSessions.size,
      profile_open_rate_pct: pct(openSessions.size, reachSessions.size),
      qualified_action_rate_pct: pct(actionSessions.size, reachSessions.size),
      cost_per_profile_open_cents: moneyPer(priceCents, openSessions.size),
      cost_per_qualified_action_cents: moneyPer(priceCents, actionSessions.size),
    },
    attribution: {
      model: 'sponsored_open_30m_same_venue',
      window_minutes: 30,
      privacy: 'aggregated_only',
    },
  })
})
