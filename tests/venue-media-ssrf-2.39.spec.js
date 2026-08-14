const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

const FILE='supabase/functions/venue-media-approve/index.ts';

function source(){return fs.readFileSync(FILE,'utf8')}

test('venue media ingestion rejects private and reserved network targets',()=>{
  const code=source();
  expect(code).toContain('h==="localhost"');
  expect(code).toContain('h.endsWith(".local")');
  expect(code).toContain('h.endsWith(".internal")');
  expect(code).toContain('function private4');
  expect(code).toContain('function private6');
  expect(code).toContain('a===10');
  expect(code).toContain('a===127');
  expect(code).toContain('a===192&&b===168');
  expect(code).toContain('a===198&&b===51&&c===100');
  expect(code).toContain('a===203&&b===0&&c===113');
  expect(code).toContain('h.startsWith("::ffff:")');
  expect(code).toContain('h.startsWith("ff")');
  expect(code).toContain('h.startsWith("2001:db8:")');
});

test('venue media ingestion resolves DNS and fails closed on private or unresolved answers',()=>{
  const code=source();
  expect(code).toContain('Deno.resolveDns(h,"A")');
  expect(code).toContain('Deno.resolveDns(h,"AAAA")');
  expect(code).toContain('if(!ips.length)throw new Error("dns_unresolved")');
  expect(code).toContain('throw new Error("private_dns_target")');
});

test('every redirect is manually revalidated before another fetch',()=>{
  const code=source();
  expect(code).toContain('redirect:"manual"');
  expect(code).toContain('MAX_REDIRECTS=4');
  expect(code).toContain('u=await publicHttps(new URL(location,u).href)');
  expect(code).toContain('throw new Error("too_many_redirects")');
  expect(code).not.toContain('redirect:"follow"');
});

test('remote image downloads stay bounded by type, time and bytes',()=>{
  const code=source();
  expect(code).toContain('MAX_IMAGE_BYTES=10*1024*1024');
  expect(code).toContain('FETCH_TIMEOUT_MS=18000');
  expect(code).toContain('AbortSignal.timeout(FETCH_TIMEOUT_MS)');
  expect(code).toContain('response.headers.get("content-length")');
  expect(code).toContain('image/jpeg');
  expect(code).toContain('image/png');
  expect(code).toContain('image/webp');
  expect(code).toContain('if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)');
});
