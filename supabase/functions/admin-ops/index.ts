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

  if (action === 'review_profile_change') {
    const requestId = String(body?.request_id || '')
    const decision = String(body?.decision || '')
    const rejectionReason = body?.rejection_reason ? String(body.rejection_reason).trim() : null
    if (!requestId || !['approved', 'rejected'].includes(decision)) return json({ error: 'invalid_fields' }, 400)
    if (decision === 'rejected' && !rejectionReason) return json({ error: 'rejection_reason_required' }, 400)

    const { data, error } = await adminClient.rpc('admin_review_profile_change_internal', {
      p_request_id: requestId,
      p_decision: decision,
      p_reviewer: user.id,
      p_rejection_reason: rejectionReason,
    })
    if (error) return json({ error: error.message }, 400)
    return json(data || { ok: true, request_id: requestId, status: decision })
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

  if (action === 'review_event_promotion') {
    const promotionId = String(body?.promotion_id || '')
    const decision = String(body?.decision || '')
    const rejectionReason = body?.rejection_reason ? String(body.rejection_reason).trim() : null
    const rawPrice = body?.quoted_price_cents
    const quotedPriceCents = rawPrice === null || rawPrice === undefined || rawPrice === '' ? null : Number(rawPrice)
    const allowed = ['activate_paid','activate_comped','rejected','cancelled']
    if (!promotionId || !allowed.includes(decision)) return json({ error: 'invalid_fields' }, 400)
    if (decision === 'activate_paid' && (!Number.isInteger(quotedPriceCents) || Number(quotedPriceCents) <= 0)) return json({ error: 'positive_price_required' }, 400)
    if (decision === 'rejected' && !rejectionReason) return json({ error: 'rejection_reason_required' }, 400)

    const { data: promotion, error: promotionError } = await adminClient
      .from('event_promotions')
      .select('id,offer_id,restaurant_id,status,billing_status,starts_at,ends_at,quoted_price_cents,currency')
      .eq('id', promotionId)
      .maybeSingle()
    if (promotionError) return json({ error: 'promotion_lookup_failed' }, 500)
    if (!promotion) return json({ error: 'promotion_not_found' }, 404)

    const { data: offer, error: offerError } = await adminClient
      .from('offers')
      .select('id,restaurant_id,offer_type,status,title,starts_at,ends_at')
      .eq('id', promotion.offer_id)
      .eq('restaurant_id', promotion.restaurant_id)
      .maybeSingle()
    if (offerError) return json({ error: 'promotion_offer_lookup_failed' }, 500)
    if (!offer) return json({ error: 'promotion_offer_not_found' }, 404)

    const now = new Date()
    const activation = decision === 'activate_paid' || decision === 'activate_comped'
    if (activation) {
      if (promotion.status !== 'requested') return json({ error: 'promotion_not_pending' }, 409)
      if (offer.offer_type !== 'event' || offer.status !== 'published') return json({ error: 'published_event_required' }, 409)
      if (!offer.ends_at || new Date(offer.ends_at) <= now || new Date(promotion.ends_at) <= now) return json({ error: 'promotion_expired' }, 409)
      if (new Date(promotion.ends_at) > new Date(offer.ends_at)) return json({ error: 'promotion_window_invalid' }, 409)
    }
    if (decision === 'rejected' && promotion.status !== 'requested') return json({ error: 'promotion_not_pending' }, 409)
    if (decision === 'cancelled' && !['requested','active'].includes(promotion.status)) return json({ error: 'promotion_not_open' }, 409)

    const updatedAt = new Date().toISOString()
    const patch: Record<string, unknown> = { updated_at: updatedAt }
    if (decision === 'activate_paid') Object.assign(patch, {
      status: 'active', billing_status: 'paid', quoted_price_cents: quotedPriceCents,
      currency: 'EUR', approved_by: user.id, approved_at: updatedAt, rejection_reason: null,
    })
    if (decision === 'activate_comped') Object.assign(patch, {
      status: 'active', billing_status: 'comped', quoted_price_cents: 0,
      currency: 'EUR', approved_by: user.id, approved_at: updatedAt, rejection_reason: null,
    })
    if (decision === 'rejected') Object.assign(patch, {
      status: 'rejected', billing_status: 'cancelled', quoted_price_cents: null,
      approved_by: user.id, approved_at: updatedAt, rejection_reason: rejectionReason,
    })
    if (decision === 'cancelled') Object.assign(patch, {
      status: 'cancelled', billing_status: 'cancelled', approved_by: user.id,
      rejection_reason: rejectionReason || 'Von HOY beendet',
    })

    const { data: updated, error: updateError } = await adminClient
      .from('event_promotions')
      .update(patch)
      .eq('id', promotionId)
      .select('id,offer_id,restaurant_id,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,approved_at,rejection_reason')
      .single()
    if (updateError) return json({ error: updateError.message }, 400)

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      restaurant_id: promotion.restaurant_id,
      actor_user_id: user.id,
      action: 'admin_event_promotion_review',
      entity_type: 'event_promotion',
      entity_id: promotionId,
      before_data: promotion,
      after_data: { ...updated, decision, offer_title: offer.title },
    })
    if (auditError) return json({ error: 'promotion_audit_failed' }, 500)

    return json({ ok: true, promotion: updated })
  }

  return json({ error: 'unknown_action' }, 400)
})