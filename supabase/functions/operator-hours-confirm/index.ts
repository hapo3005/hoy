import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const
const LABELS: Record<string,string> = {mon:'Mo',tue:'Di',wed:'Mi',thu:'Do',fri:'Fr',sat:'Sa',sun:'So'}
const validStart = (v: unknown) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || ''))
const validEnd = (v: unknown) => /^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(String(v || ''))

function normalizeSchedule(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  const out: Record<string, string[][]> = {}
  let openIntervals = 0
  for (const day of DAYS) {
    const raw = input[day]
    if (!Array.isArray(raw)) return null
    const rows: string[][] = []
    for (const interval of raw.slice(0, 2)) {
      if (!Array.isArray(interval) || interval.length !== 2) return null
      const start = String(interval[0] || '').trim()
      const end = String(interval[1] || '').trim()
      if (!validStart(start) || !validEnd(end)) return null
      rows.push([start, end])
      openIntervals += 1
    }
    out[day] = rows
  }
  return openIntervals ? out : null
}

function scheduleText(schedule: Record<string,string[][]>) {
  return DAYS.map(day => {
    const rows = schedule[day] || []
    if (!rows.length) return `${LABELS[day]} geschlossen`
    return `${LABELS[day]} ${rows.map(row => `${row[0]}–${row[1]}`).join(' & ')}`
  }).join(' · ')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '')
  const restaurantId = Number(body?.restaurant_id)
  if (!Number.isInteger(restaurantId) || restaurantId < 1 || !['confirm','correct'].includes(action)) {
    return json({ error: 'invalid_fields' }, 400)
  }

  const [{ data: membership, error: membershipError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    admin.from('restaurant_memberships')
      .select('restaurant_id,user_id,verified_at')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', user.id)
      .maybeSingle(),
    admin.from('restaurant_entitlements')
      .select('restaurant_id,operator_verified,active_plan')
      .eq('restaurant_id', restaurantId)
      .maybeSingle(),
  ])
  if (membershipError || entitlementError) return json({ error: 'authorization_lookup_failed' }, 500)
  if (!membership?.verified_at || !entitlement?.operator_verified) {
    return json({ error: 'verified_operator_required' }, 403)
  }

  const { data: restaurant, error: restaurantError } = await admin.from('restaurants')
    .select('id,name,is_published,hours_weekly,hours_text')
    .eq('id', restaurantId)
    .eq('is_published', true)
    .maybeSingle()
  if (restaurantError) return json({ error: 'restaurant_lookup_failed' }, 500)
  if (!restaurant) return json({ error: 'restaurant_not_found' }, 404)

  const schedule = action === 'confirm'
    ? normalizeSchedule(restaurant.hours_weekly)
    : normalizeSchedule(body?.weekly_hours)
  if (!schedule) {
    return json({ error: action === 'confirm' ? 'no_prepared_schedule' : 'invalid_schedule' }, 400)
  }

  const displayText = action === 'confirm' && String(restaurant.hours_text || '').trim()
    ? String(restaurant.hours_text).trim()
    : scheduleText(schedule)
  const now = new Date().toISOString()

  const { data: before } = await admin.from('restaurant_live_hours')
    .select('restaurant_id,weekly_hours,display_text,confirmed_by,confirmed_at,updated_at')
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  const payload = {
    restaurant_id: restaurantId,
    timezone: 'Europe/Madrid',
    weekly_hours: schedule,
    display_text: displayText,
    confirmed_by: user.id,
    confirmed_at: now,
    updated_at: now,
  }
  const { data: liveHours, error: saveError } = await admin.from('restaurant_live_hours')
    .upsert(payload, { onConflict: 'restaurant_id' })
    .select('restaurant_id,timezone,weekly_hours,display_text,notice,notice_until,confirmed_at,updated_at')
    .single()
  if (saveError) return json({ error: 'hours_confirmation_failed' }, 400)

  const auditAction = action === 'confirm' ? 'operator_hours_confirmed_free' : 'operator_hours_corrected_free'
  const { error: auditError } = await admin.from('audit_logs').insert({
    restaurant_id: restaurantId,
    actor_user_id: user.id,
    action: auditAction,
    entity_type: 'restaurant_live_hours',
    entity_id: String(restaurantId),
    before_data: before || null,
    after_data: {
      weekly_hours: schedule,
      display_text: displayText,
      confirmed_at: now,
      confirmation_mode: action,
      plan_at_confirmation: entitlement.active_plan,
    },
  })
  if (auditError) return json({ error: 'hours_confirmation_audit_failed' }, 500)

  return json({ ok: true, action, live_hours: liveHours })
})
