import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';

const root=process.cwd();

test('IR-02E public runtime boundary builds fail-closed and deterministically', async () => {
  const output=execFileSync(process.execPath,['scripts/check-ir02e-public-runtime.mjs'],{
    cwd:root,encoding:'utf8'
  });
  expect(output).toContain('"ok": true');
  expect(output).toContain('"deterministicManifest": true');
});

test('IR-02E policy excludes diligence/source surfaces and only allows explicit Platform Core runtime files', async () => {
  const policy=JSON.parse(fs.readFileSync(path.join(root,'deploy/public-runtime-policy.json'),'utf8'));
  expect(policy.mode).toBe('allowlist_fail_closed');
  for(const dir of ['docs','data','scripts','supabase','tests','.github'])expect(policy.never_publish_directories).toContain(dir);
  expect(policy.public_optional_files).toEqual([
    'platform-core/hoy-platform-core-v1.js',
    'platform-core/gastro-adapter-v1.js'
  ]);
  expect(policy.public_directories).not.toContain('platform-core');
  expect(policy.secret_patterns).toContain('HOY_SUPABASE_SECRET_KEY');
  expect(policy.secret_patterns).toContain('OPENAI_API_KEY');
  expect(policy.secret_patterns).toContain('sb_secret_');
});
