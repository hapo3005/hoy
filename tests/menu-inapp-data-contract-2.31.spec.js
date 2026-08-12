const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('Soul Kitchen reference seed contains twelve in-app pages and resolves by slug',()=>{
  const sql=fs.readFileSync('supabase/seed/menu-inapp-2.31-soul-kitchen.sql','utf8');
  expect((sql.match(/jsonb_build_object\('section'/g)||[]).length).toBe(12);
  expect(sql).toContain("where slug='soul-kitchen'");
  expect(sql).not.toMatch(/restaurant_id\s*=\s*234/);
});
