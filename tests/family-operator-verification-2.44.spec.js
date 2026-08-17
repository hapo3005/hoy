const {test,expect}=require('@playwright/test');
const C='./data/family-operator-verification-contract-2026-08-17.json';
const I='./data/family-operator-response-intake-schema-2026-08-17.json';
const A='./data/family-resolution-audit-2026-08-17.json';
const O='./data/family-operator-outreach-2026-08-17.json';
const SLUGS=['restaurante-bamboo-la-manga','chiringuito-calisto','aquarium-la-manga-club-resort','la-tap-pizzella','la-vaca-gallega','venta-el-sabinar'];

test('2.44 follows the six unresolved profiles without automatic promotion',async({request})=>{
  const c=await (await request.get(C)).json();
  const a=await (await request.get(A)).json();
  expect(c.production_import_allowed).toBe(false);
  expect(c.automatic_runtime_mutation_allowed).toBe(false);
  expect(c.automatic_status_promotion_allowed).toBe(false);
  expect(c.profiles.map(x=>x.slug)).toEqual(SLUGS);
  expect(a.outcomes.map(x=>x.slug)).toEqual(SLUGS);
  const bySlug=new Map(a.outcomes.map(x=>[x.slug,x]));
  for(const p of c.profiles){
    expect(p.baseline_status).toBe(bySlug.get(p.slug).status_after);
    expect(p.status_gate.length).toBeGreaterThan(0);
  }
  expect(c.authority_policy.not_sufficient_alone).toContain('directory');
  expect(c.authority_policy.not_sufficient_alone).toContain('majority_vote');
  expect(c.review_policy.no_reply).toBe('no_status_change');
  expect(c.review_policy.contradiction).toBe('conflict_review');
  expect(c.review_policy.all_required_gates_confirmed).toBe('eligible_for_release_review_only');
});

test('Family eligibility fails closed',async({request})=>{
  const c=await (await request.get(C)).json();
  for(const p of c.profiles.filter(x=>x.family_gate.length)){
    expect(p.family_gate.some(x=>x.includes('customer_access'))).toBe(true);
    expect(p.negative_family_rule).toContain('remove_from_family_candidate_review');
  }
  expect(c.review_policy.family_gate_unanswered).toBe('no_family_promotion');
  expect(c.review_policy.family_gate_confirmed_false).toBe('remove_from_family_candidate_review');
});

test('response intake is privacy-minimized for the public repo',async({request})=>{
  const i=await (await request.get(I)).json();
  expect(i.production_import_allowed).toBe(false);
  expect(i.automatic_runtime_mutation_allowed).toBe(false);
  expect(i.privacy_policy.public_repo_safe).toBe(true);
  expect(i.privacy_policy.raw_message_content_allowed).toBe(false);
  expect(i.privacy_policy.personal_name_allowed).toBe(false);
  expect(i.privacy_policy.private_phone_or_email_from_reply_allowed).toBe(false);
  expect(i.privacy_policy.attachments_allowed).toBe(false);
  expect(i.responses).toEqual([]);
});

test('outreach remains deferred',async({request})=>{
  const o=await (await request.get(O)).json();
  const c=await (await request.get(C)).json();
  expect(o.outreach_status).toBe('deferred_until_final_outreach_stage');
  expect(o.sending_allowed).toBe(false);
  expect(o.contacts.map(x=>x.slug)).toEqual(c.profiles.map(x=>x.slug));
  expect(o.contacts.every(x=>x.send_state==='deferred'&&x.sent_at===null)).toBe(true);
});
