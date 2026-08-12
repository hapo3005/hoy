import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const js=fs.readFileSync('admin-activation-2.21.js','utf8');

test('activation queue reads live-hours but does not mutate restaurant or sales records',()=>{
  expect(js).toContain("sb.from('restaurant_live_hours').select");
  expect(js).not.toContain("sb.from('restaurants').update");
  expect(js).not.toContain("sb.from('venue_sales_pipeline').update");
  expect(js).not.toContain("send_authorized_at");
});

test('only evidence-backed DE/EN signals drive the international first wave',()=>{
  expect(js).toContain('preferred_outreach_language');
  expect(js).toContain('language_fit');
  expect(js).toContain('international_fit');
  expect(js).not.toContain('working_language');
});
