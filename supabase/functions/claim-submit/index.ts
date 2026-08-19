import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

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

  const body = await req.json().catch(() => null)
  const restaurantId = Number(body?.restaurant_id)
  const contactName = String(body?.contact_name || '').trim()
  const businessEmail = String(body?.business_email || '').trim().toLowerCase()
  const contactRole = body?.contact_role ? String(body.contact_role).trim() : null
  const evidence = body?.evidence && typeof body.evidence === 'object' ? body.evidence : {}

  if (!Number.isInteger(restaurantId) || restaurantId < 1 || !contactName || !businessEmail || !businessEmail.includes('@')) {
    return json({ error: 'invalid_fields' }, 400)
  }

  const { data: restaurant, error: restaurantError } = await userClient
    .from('restaurants')
    .select('id,name,is_published')
    .eq('id', restaurantId)
    .eq('is_published', true)
    .maybeSingle()
  if (restaurantError) return json({ error: 'restaurant_lookup_failed' }, 400)
  if (!restaurant) return json({ error: 'restaurant_not_found' }, 404)

  const { data: existing } = await userClient
    .from('business_claims')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('user_id', user.id)
    .in('status', ['pending', 'verified'])
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return json({ claim: existing, status: existing.status, reused: true })

  const { data: claim, error: insertError } = await userClient
    .from('business_claims')
    .insert({
      restaurant_id: restaurantId,
      user_id: user.id,
      contact_name: contactName,
      contact_role: contactRole,
      business_email: businessEmail,
      status: 'pending',
      verification_method: 'business_email',
      evidence,
    })
    .select()
    .single()

  if (insertError) return json({ error: insertError.message }, 400)

  await adminClient.from('audit_logs').insert({
    restaurant_id: restaurantId,
    actor_user_id: user.id,
    action: 'claim_submitted',
    entity_type: 'business_claim',
    entity_id: claim.id,
    after_data: {
      status: claim.status,
      business_email: businessEmail,
      contact_role: contactRole,
    },
  })

  return json({ claim, status: 'pending', reused: false })
})
