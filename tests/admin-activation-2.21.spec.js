import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const currentRelease=()=>JSON.parse(read('package.json')).version;

test('HOY Control 2.21 wires the activation queue after coverage',()=>{
  const html=read('admin.html');
  expect(html).toContain(`HOY Control Center · ${currentRelease()}`);
  expect(html).toContain('admin-activation-2.21.css?v=2.21.0');
  expect(html).toContain('admin-activation-2.21.js?v=2.21.0');
  expect(html.indexOf('admin-activation-2.21.js')).toBeGreaterThan(html.indexOf('admin-coverage-2.20.js'));
});

test('activation queue stays scoped to the La Manga and Cabo de Palos core',()=>{
  const js=read('admin-activation-2.21.js');
  expect(js).toContain("new Set(['La Manga del Mar Menor','Cabo de Palos'])");
  expect(js).toContain("r.is_published&&CORE_AREAS.has");
});

test('first-wave language signal never mistakes internal working language for venue language',()=>{
  const js=read('admin-activation-2.21.js');
  expect(js).toContain("s.preferred_outreach_language");
  expect(js).toContain("s.language_fit");
  expect(js).not.toContain('s.working_language');
});

test('queue is prioritization-only and cannot unlock or send outreach',()=>{
  const js=read('admin-activation-2.21.js');
  expect(js).toContain('send_lock');
  expect(js).toContain("badge('GESPERRT','good')");
  expect(js).not.toMatch(/venue_sales_pipeline['"]\)\.update/);
  expect(js).not.toMatch(/send_authorized_at\s*:/);
  expect(js).not.toMatch(/functions\.invoke\([^)]*(mail|email|outreach|send)/i);
});

test('unresolved hours plus direct contact outrank passive profile polish',()=>{
  const js=read('admin-activation-2.21.js');
  expect(js).toContain("if(hoursGap221(r))score+=30");
  expect(js).toContain("if(directContact221(r,s))score+=22");
  expect(js).toContain("if(firstWave221(s))score+=16");
  expect(js).toContain("if(st.key==='confirmed')return 0");
});
