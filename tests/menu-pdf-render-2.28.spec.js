const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('PDF renderer is allowlisted, bounded and hash-pinned before publication',()=>{
  const py=fs.readFileSync('scripts/render-menu-pdfs.py','utf8');
  const wf=fs.readFileSync('.github/workflows/menu-pdf-render.yml','utf8');
  expect(py).toContain('ALLOWED_HOST_SUFFIXES');
  expect(py).toContain('MAX_BYTES = 30 * 1024 * 1024');
  expect(py).toContain('MAX_PAGES = 12');
  expect(py).toContain("parsed.scheme != 'https'");
  expect(py).toContain("target.read_bytes()[:5] != b'%PDF-'");
  expect(py).toContain('expected_source_sha256');
  expect(py).toContain('Review required before publication');
  expect(wf).toContain('permissions:\n  contents: write');
  expect(wf).not.toMatch(/SUPABASE|service_role|menu_sources.*update/i);
  expect(wf).toContain('git add -- menu-pages');
  expect(wf).not.toMatch(/git add\s+\.|git add\s+-A/);
});

test('initial reviewed targets pin the exact PDF bytes already visually checked',()=>{
  const cfg=JSON.parse(fs.readFileSync('config/menu-pdf-render-targets.json','utf8'));
  expect(cfg.targets.map(x=>x.restaurant_id).sort((a,b)=>a-b)).toEqual([9,111]);
  expect(cfg.targets.every(x=>/^https:\/\/.+\.pdf$/i.test(x.source_url))).toBeTruthy();
  expect(cfg.targets.every(x=>/^[0-9a-f]{64}$/.test(x.expected_source_sha256))).toBeTruthy();
});

test('renderer emits JPEG pages into a dedicated public asset tree, never source PDFs',()=>{
  const py=fs.readFileSync('scripts/render-menu-pdfs.py','utf8');
  expect(py).toContain("'pdftoppm', '-jpeg'");
  expect(py).toContain("PUBLISH = pathlib.Path('menu-pages')");
  expect(py).toContain("OUT / 'manifest.json'");
  expect(py).toContain("pdf.unlink(missing_ok=True)");
});
