const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('Bonobo first-party publisher is hash-pinned and narrowly scoped',()=>{
  const cfg=JSON.parse(fs.readFileSync('config/menu-image-publish-targets.json','utf8'));
  const script=fs.readFileSync('scripts/publish-menu-images.py','utf8');
  const workflow=fs.readFileSync('.github/workflows/menu-image-publish.yml','utf8');
  expect(cfg.targets).toHaveLength(1);
  const target=cfg.targets[0];
  expect(target).toMatchObject({restaurant_id:4,allowed_host:'www.bonoboplaya.com',bundle:'f9653f87c69d'});
  expect(target.pages).toHaveLength(3);
  for(const page of target.pages){expect(page.url).toMatch(/^https:\/\/www\.bonoboplaya\.com\/wp-content\/uploads\/2026\//);expect(page.sha256).toMatch(/^[a-f0-9]{64}$/)}
  expect(script).toContain("hashlib.sha256(data).hexdigest()");
  expect(script).toContain('new visual review required');
  expect(script).toContain("Path('menu-pages')/str(rid)/bundle");
  expect(script).not.toMatch(/SUPABASE|menu_sources|menu_items|POST|PATCH|DELETE/);
  expect(workflow).toContain('permissions:\n  contents: write');
  expect(workflow).toContain('git add -- menu-pages/4/f9653f87c69d');
  expect(workflow).toContain('git status --porcelain --untracked-files=all');
  expect(workflow).toContain("grep -v '^menu-pages/4/f9653f87c69d/'");
  expect(workflow).toContain("grep -v '^menu-image-publish-output/'");
  expect(workflow).not.toMatch(/git add\s+\.|git add\s+-A/);
});
