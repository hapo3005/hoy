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
  if (userError || !user?.email || !user.email_confirmed_at) return json({ error: 'unauthorized' }, 401)

  const email = user.email.toLowerCase()
  const { data: adminRow, error: adminError } = await adminClient
    .from('hoy_admin_accounts')
    .select('email,user_id,active')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle()
  if (adminError) return json({ error: 'admin_lookup_failed' }, 500)
  if (!adminRow) return json({ error: 'forbidden' }, 403)

  if (!adminRow.user_id) {
    const { error: bindError } = await adminClient.from('hoy_admin_accounts')
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq('email', email)
      .is('user_id', null)
    if (bindError) return json({ error: 'admin_bind_failed' }, 500)
  } else if (adminRow.user_id !== user.id) {
    return json({ error: 'admin_identity_mismatch' }, 403)
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || 'session')
  if (action === 'session') return json({ admin: true, email, user_id: user.id })

  if (action === 'review_claim') {
    const claimId = String(body?.claim_id || '')
    const decision = String(body?.decision || '')
    const rejectionReason = body?.rejection_reason ? String(body.rejection_reason).trim() : null
    if (!claimId || !['verified', 'rejected'].includes(decision)) return json({ error: 'invalid_fields' }, 400)
    if (decision === 'rejected' && !rejectionReason) return json({ error: 'rejection_reason_required' }, 400)

    const { data, error } = await adminClient.rpc('admin_review_claim_internal', {
      p_claim_id: claimId,
      p_decision: decision,
      p_reviewer: user.id,
      p_rejection_reason: rejectionReason,
    })
    if (error) return json({ error: error.message }, 400)
    return json(data || { ok: true, claim_id: claimId, status: decision })
  }

  if (action === 'set_plan') {
    const restaurantId = Number(body?.restaurant_id)
    const plan = String(body?.plan || '')
    if (!Number.isInteger(restaurantId) || !['free','pro','business'].includes(plan)) return json({ error: 'invalid_fields' }, 400)

    const { data, error } = await adminClient.rpc('admin_set_plan_internal', {
      p_restaurant_id: restaurantId,
      p_plan: plan,
      p_reviewer: user.id,
    })
    if (error) return json({ error: error.message }, 400)
    return json(data || { ok: true, restaurant_id: restaurantId, plan })
  }

  return json({ error: 'unknown_action' }, 400)
})
