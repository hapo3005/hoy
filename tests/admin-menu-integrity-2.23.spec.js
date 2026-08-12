const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

const read=f=>fs.readFileSync(f,'utf8');

test('HOY Control 2.23 menu-integrity assets are wired',()=>{
  const html=read('admin.html');
  expect(html).toContain('HOY Control Center · 2.23.0');
  expect(html).toContain('admin-menu-integrity-2.23.css?v=2.23.0');
  expect(html).toContain('admin-menu-integrity-2.23.js?v=2.23.0');
});

test('menu integrity queue covers complete, partial, source-only and unavailable states',()=>{
  const js=read('admin-menu-integrity-2.23.js');
  for(const state of ['complete','image_complete','partial','source_only','insufficient','invalid','missing'])expect(js).toContain(`'${state}'`);
  expect(js).toContain('expected_sections');
  expect(js).toContain('imported_sections');
  expect(js).toContain('Positionen zählen reicht nicht.');
  expect(js).toContain('Nur Ergänzungen');
});

test('menu queue is read-only and does not create a menu or outreach write path',()=>{
  const js=read('admin-menu-integrity-2.23.js');
  expect(js).not.toMatch(/\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.upsert\s*\(/);
  expect(js).not.toMatch(/send_authorized_at|send_lock\s*:|sendEmail|send_email|mailgun|sendgrid/i);
  expect(js).not.toMatch(/adminOp\s*\(/);
  expect(js).toContain('data-edit');
});

test('old quality score no longer treats any menu source as sufficient',()=>{
  const js=read('admin-menu-integrity-2.23.js');
  expect(js).toContain('const baseQualityInfo223=qualityInfo');
  expect(js).toContain("['complete','image_complete'].includes(i.key)");
  expect(js).toContain("'Speisekarte vollständig'");
});
