const {test,expect}=require('@playwright/test');

const QUEUE_PATH='./data/family-operator-outreach-2026-08-17.json';
const AUDIT_PATH='./data/family-resolution-audit-2026-08-17.json';

const EXPECTED_ORDER=[
  'restaurante-bamboo-la-manga',
  'chiringuito-calisto',
  'aquarium-la-manga-club-resort',
  'la-tap-pizzella',
  'la-vaca-gallega',
  'venta-el-sabinar'
];

function collectKeys(value,keys=[]){
  if(Array.isArray(value)){ for(const row of value)collectKeys(row,keys); return keys; }
  if(value&&typeof value==='object'){
    for(const [key,row] of Object.entries(value)){ keys.push(key.toLowerCase()); collectKeys(row,keys); }
  }
  return keys;
}

test('2.43 outreach queue is complete, deferred and non-production',async({request})=>{
  const queue=await (await request.get(QUEUE_PATH)).json();

  expect(queue.schema_version).toBe(2);
  expect(queue.production_import_allowed).toBe(false);
  expect(queue.outreach_status).toBe('deferred_until_final_outreach_stage');
  expect(queue.sending_allowed).toBe(false);
  expect(queue.contacts).toHaveLength(6);
  expect(queue.contacts.map(x=>x.slug)).toEqual(EXPECTED_ORDER);
  expect(queue.contacts.map(x=>x.priority)).toEqual([1,2,3,4,5,6]);

  for(const row of queue.contacts){
    expect(row.send_state).toBe('deferred');
    expect(row.sent_at).toBeNull();
    expect(row.reply_state).toBe('not_requested');
    expect(row.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(row.subject.trim().length).toBeGreaterThan(20);
    expect(row.body).toContain('HOY');
    expect(row.body).toContain('Jan');
    expect(row.contact_authority).toBeTruthy();
    expect(row.contact_source_url).toMatch(/^https:\/\//);
    expect(row.contact_note.trim().length).toBeGreaterThan(40);
  }
});

test('outreach queue exactly covers the unresolved 2.43 audit and does not alter truth states',async({request})=>{
  const queue=await (await request.get(QUEUE_PATH)).json();
  const audit=await (await request.get(AUDIT_PATH)).json();

  expect(audit.production_import_allowed).toBe(false);
  expect(audit.outcomes.map(x=>x.slug)).toEqual(EXPECTED_ORDER);
  expect(queue.contacts.map(x=>x.slug)).toEqual(audit.next_action.order);

  for(const row of audit.outcomes){
    expect(row.status_changed).toBe(false);
    expect(row.status_before).toBe(row.status_after);
    expect(row.resolution).toBe('direct_confirmation_required');
  }
});

test('outreach data contains no session-specific authorization state or implicit send capability',async({request})=>{
  const queue=await (await request.get(QUEUE_PATH)).json();
  const keys=collectKeys(queue);
  const forbiddenKeyPatterns=[/gmail/,/oauth/,/consent/,/authorization/,/credential/,/token/,/account/,/send_attempt/,/send_error/];
  for(const key of keys){
    for(const pattern of forbiddenKeyPatterns)expect(key).not.toMatch(pattern);
  }

  const raw=JSON.stringify(queue).toLowerCase();
  expect(raw).not.toContain('ready_to_send');
  expect(raw).not.toMatch(/"sending_allowed"\s*:\s*true/);
  expect(raw).not.toMatch(/"sent_at"\s*:\s*"/);
});

test('contact provenance is explicit and does not masquerade as fact verification',async({request})=>{
  const queue=await (await request.get(QUEUE_PATH)).json();
  const bySlug=new Map(queue.contacts.map(x=>[x.slug,x]));

  expect(bySlug.get('aquarium-la-manga-club-resort').contact_authority).toBe('operator');
  expect(bySlug.get('la-vaca-gallega').contact_authority).toBe('official_host');
  expect(bySlug.get('restaurante-bamboo-la-manga').contact_note).toContain('does not resolve');
  expect(bySlug.get('chiringuito-calisto').contact_note).toContain('direct confirmation');
  expect(bySlug.get('venta-el-sabinar').contact_note).toContain('direct confirmation');
});
