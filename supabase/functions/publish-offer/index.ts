import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401, headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: cors })

  const body = await req.json().catch(() => null)
  const offerId = body?.offer_id
  if (!offerId) return Response.json({ error: 'missing_offer_id' }, { status: 400, headers: cors })

  const { data: offer } = await admin
    .from('offers')
    .select('id,restaurant_id,status,starts_at,ends_at')
    .eq('id', offerId)
    .single()
  if (!offer) return Response.json({ error: 'not_found' }, { status: 404, headers: cors })

  const { data: membership } = await admin
    .from('restaurant_memberships')
    .select('verified_at')
    .eq('restaurant_id', offer.restaurant_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership?.verified_at) return Response.json({ error: 'verified_membership_required' }, { status: 403, headers: cors })

  const { data: entitlement } = await admin
    .from('restaurant_entitlements')
    .select('operator_verified,active_plan')
    .eq('restaurant_id', offer.restaurant_id)
    .single()
  if (!entitlement?.operator_verified) return Response.json({ error: 'operator_not_verified' }, { status: 403, headers: cors })
  if (!['pro', 'business'].includes(entitlement.active_plan)) return Response.json({ error: 'paid_plan_required' }, { status: 402, headers: cors })

  if (offer.ends_at && offer.starts_at && new Date(offer.ends_at) <= new Date(offer.starts_at)) {
    return Response.json({ error: 'invalid_dates' }, { status: 400, headers: cors })
  }

  const now = new Date().toISOString()
  const { data, error } = await admin
    .from('offers')
    .update({ status: 'published', published_at: now, updated_at: now })
    .eq('id', offerId)
    .select()
    .single()
  if (error) return Response.json({ error: 'publish_failed' }, { status: 400, headers: cors })

  await admin.from('audit_logs').insert({
    restaurant_id: offer.restaurant_id,
    actor_user_id: user.id,
    action: 'offer_published',
    entity_type: 'offer',
    entity_id: String(offerId),
    after_data: { published_at: now },
  })

  return Response.json({ offer: data }, { headers: cors })
})
