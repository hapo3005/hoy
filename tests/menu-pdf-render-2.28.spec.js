const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('PDF renderer is read-only, allowlisted and bounded',()=>{
  const py=fs.readFileSync('scripts/render-menu-pdfs.py','utf8');
  const wf=fs.readFileSync('.github/workflows/menu-pdf-render.yml','utf8');
  expect(py).toContain('ALLOWED_HOST_SUFFIXES');
  expect(py).toContain('MAX_BYTES = 30 * 1024 * 1024');
  expect(py).toContain('MAX_PAGES = 12');
  expect(py).toContain("parsed.scheme != 'https'");
  expect(py).toContain("target.read_bytes()[:5] != b'%PDF-'");
  expect(wf).toContain('permissions:\n  contents: read');
  expect(wf).not.toMatch(/SUPABASE|contents:\s*write|push.*generated/i);
});

test('initial targets are the two guest-visible raw PDF cases',()=>{
  const cfg=JSON.parse(fs.readFileSync('config/menu-pdf-render-targets.json','utf8'));
  expect(cfg.targets.map(x=>x.restaurant_id).sort((a,b)=>a-b)).toEqual([9,111]);
  expect(cfg.targets.every(x=>/^https:\/\/.+\.pdf$/i.test(x.source_url))).toBeTruthy();
});

test('renderer emits JPEG pages and a manifest, never source PDFs',()=>{
  const py=fs.readFileSync('scripts/render-menu-pdfs.py','utf8');
  expect(py).toContain("'pdftoppm', '-jpeg'");
  expect(py).toContain("OUT / 'manifest.json'");
  expect(py).toContain("pdf.unlink(missing_ok=True)");
});
