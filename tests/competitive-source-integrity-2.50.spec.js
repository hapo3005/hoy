const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

test('Escuela menu source integrity candidate is exact-guarded and not self-authorizing',async()=>{
  const sql=fs.readFileSync(path.join(__dirname,'..','scripts','competitive','menu-source-integrity-escuela-de-pieter-candidate.sql'),'utf8');
  expect(sql).toContain("current_setting('hoy.menu_source_integrity_apply_authorized', true)");
  expect(sql).toContain("EXPLICIT_REVIEWED_APPLY");
  expect(sql).toContain("dfe86203-3d7e-496c-bbed-13b8bb1790d3");
  expect(sql).toContain("restaurant_id = 7");
  expect(sql).toContain("https://escueladepieter5818.live-website.com/carta/");
  expect(sql).toContain("source_authority = 'first_party'");
  expect(sql).toContain("coverage_scope = 'full_menu'");
  expect(sql).toContain("completeness_status = 'invalid'");
  expect(sql).toContain("escuela_menu_source_before_state_drift");
  expect(sql).toContain("escuela_menu_source_unexpected_row_count");
  expect(sql).toContain("source_authority = 'unknown'");
  expect(sql).toContain("coverage_scope = 'unknown'");
  expect(sql).not.toContain("SET LOCAL hoy.menu_source_integrity_apply_authorized = 'EXPLICIT_REVIEWED_APPLY';\nBEGIN;");
});

test('competitive queue keeps third-party ingestion fail closed',async()=>{
  const queue=JSON.parse(fs.readFileSync(path.join(__dirname,'..','docs','competitive','region1-menu-gap-queue-2026-08-20.json'),'utf8'));
  expect(queue.count).toBe(18);
  expect(queue.production_mutation_performed).toBe(false);
  expect(queue.rights_rule).toContain('No third-party menu content is copied into HOY');
  const escuela=queue.rows.find(row=>row.restaurant_id===7);
  expect(escuela.source_class).toBe('SOURCE_INTEGRITY_BLOCKED');

  const soul=queue.rows.find(row=>row.restaurant_id===234);
  expect(soul.source_class).toBe('STRUCTURED_EDITORIAL_CANDIDATE');
  expect(soul.evidence_status).toContain('162 unique positions');
  expect(soul.evidence_status).toContain('30 assistant-draft translation rows require human review');
  expect(soul.next_action).toContain('human/editor review');
  expect(soul.next_action).toContain('no Production apply without explicit authorization');

  for(const id of [210,199]){
    const row=queue.rows.find(x=>x.restaurant_id===id);
    expect(row.source_class).toBe('THIRD_PARTY_REFERENCE');
    expect(row.next_action.toLowerCase()).toContain('do not copy');
  }

  for(const row of queue.rows.filter(row=>['THIRD_PARTY_REFERENCE','TRANSACTIONAL_THIRD_PARTY'].includes(row.source_class))){
    expect(row.next_action.toLowerCase()).toContain('do not copy');
  }
});
