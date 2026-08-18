#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${TARGET_BRANCH:?TARGET_BRANCH is required}"

export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# Generate and verify the reproducible QA dependency lock.
npm install --package-lock-only --ignore-scripts
npm ci --ignore-scripts
test -s package-lock.json
npm ls --all --json > /tmp/rt006-npm-tree.json

# Resolve every mutable external GitHub Action ref to the exact commit SHA
# currently addressed by that ref, then fail closed if any mutable ref remains.
python3 <<'PY'
import json, os, pathlib, re, urllib.error, urllib.parse, urllib.request

root = pathlib.Path('.github/workflows')
token = os.environ['GH_TOKEN']
api = 'https://api.github.com'
sha_re = re.compile(r'^[0-9a-fA-F]{40}$')
uses_re = re.compile(r'^(?P<prefix>\s*(?:-\s*)?uses:\s*)(?P<quote>[\"\']?)(?P<target>[^\"\'\s#]+)@(?P<ref>[^\"\'\s#]+)(?P=quote)(?P<trail>\s*(?:#.*)?)$')

def get_json(path):
    req = urllib.request.Request(
        api + path,
        headers={
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': f'Bearer {token}',
            'User-Agent': 'HOY-RT006-Supply-Chain-Materializer',
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def resolve(owner, repo, ref):
    enc = urllib.parse.quote(ref, safe='')
    try:
        data = get_json(f'/repos/{owner}/{repo}/git/ref/tags/{enc}')
        obj = data['object']
        while obj.get('type') == 'tag':
            obj = get_json(f"/repos/{owner}/{repo}/git/tags/{obj['sha']}")['object']
        if obj.get('type') == 'commit' and sha_re.fullmatch(obj['sha']):
            return obj['sha']
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
    data = get_json(f'/repos/{owner}/{repo}/commits/{enc}')
    sha = data['sha']
    if not sha_re.fullmatch(sha):
        raise RuntimeError(f'Could not resolve immutable SHA for {owner}/{repo}@{ref}')
    return sha

mapping = {}
changed_files = []
malformed = []

for path in sorted(list(root.glob('*.yml')) + list(root.glob('*.yaml'))):
    old = path.read_text(encoding='utf-8')
    out = []
    changed = False
    for line in old.splitlines():
        m = uses_re.match(line)
        if not m:
            out.append(line)
            continue
        target, ref = m.group('target'), m.group('ref')
        if target.startswith('./') or target.startswith('docker://'):
            out.append(line)
            continue
        parts = target.split('/')
        if len(parts) < 2:
            malformed.append(f'{path}: malformed external action {target}@{ref}')
            out.append(line)
            continue
        if sha_re.fullmatch(ref):
            out.append(line)
            continue
        owner, repo = parts[0], parts[1]
        sha = resolve(owner, repo, ref)
        mapping[f'{owner}/{repo}@{ref}'] = sha
        old_comment = m.group('trail').strip()
        if old_comment.startswith('#'):
            old_comment = old_comment[1:].strip()
        comment = f'# {ref}' + (f' | {old_comment}' if old_comment else '')
        newline = f"{m.group('prefix')}{m.group('quote')}{target}@{sha}{m.group('quote')} {comment}"
        out.append(newline)
        changed = changed or newline != line
    new = '\n'.join(out) + ('\n' if old.endswith('\n') else '')
    if changed:
        path.write_text(new, encoding='utf-8')
        changed_files.append(str(path))

if malformed:
    raise SystemExit('\n'.join(malformed))

failures=[]
for path in sorted(list(root.glob('*.yml')) + list(root.glob('*.yaml'))):
    for n,line in enumerate(path.read_text(encoding='utf-8').splitlines(),1):
        m=uses_re.match(line)
        if not m:
            continue
        target,ref=m.group('target'),m.group('ref')
        if target.startswith('./') or target.startswith('docker://'):
            continue
        if not sha_re.fullmatch(ref):
            failures.append(f'{path}:{n}: {target}@{ref}')
if failures:
    raise SystemExit('Unpinned external Actions remain:\n'+'\n'.join(failures))

pathlib.Path('/tmp/rt006-action-mapping.json').write_text(json.dumps(mapping, indent=2, sort_keys=True)+'\n',encoding='utf-8')
pathlib.Path('/tmp/rt006-action-files.txt').write_text('\n'.join(changed_files)+('\n' if changed_files else ''),encoding='utf-8')
print(f'Pinned {len(mapping)} unique mutable Action ref(s) across {len(changed_files)} workflow file(s).')
PY

mkdir -p docs/investor-ready
lock_sha="$(sha256sum package-lock.json | awk '{print $1}')"
action_count="$(python3 - <<'PY'
import json
print(len(json.load(open('/tmp/rt006-action-mapping.json'))))
PY
)"
workflow_count="$(wc -l < /tmp/rt006-action-files.txt | tr -d ' ')"

{
  echo '# RT-006 — Supply-Chain Hardening Evidence'
  echo
  echo 'Status: **materialized candidate; no Production deploy; no merge authorized**'
  echo
  echo "- Branch: \`${TARGET_BRANCH}\`"
  echo "- Materializer source SHA: \`${GITHUB_SHA:-unknown}\`"
  echo "- Node: \`$(node --version)\`"
  echo "- npm: \`$(npm --version)\`"
  echo "- package-lock SHA-256: \`${lock_sha}\`"
  echo "- Unique mutable external Action refs resolved: **${action_count}**"
  echo "- Workflow files changed by pinning: **${workflow_count}**"
  echo
  echo '## Action pin map'
  echo
  echo '| Mutable ref | Immutable commit SHA |'
  echo '|---|---|'
  python3 - <<'PY'
import json
for ref,sha in sorted(json.load(open('/tmp/rt006-action-mapping.json')).items()):
    print(f'| `{ref}` | `{sha}` |')
PY
  echo
  echo '## Verification'
  echo
  echo '- `npm ci --ignore-scripts` succeeds from committed package metadata.'
  echo '- Every external `uses:` reference in `.github/workflows` is a 40-character immutable commit SHA after materialization.'
  echo '- Product logic, database state and Production deployment are outside this candidate.'
  echo '- Final RT-006 close still requires repository QA and a fresh release-candidate SBOM/licence review.'
} > docs/investor-ready/rt006-supply-chain-evidence.md

# Final fail-closed verification after evidence generation.
python3 <<'PY'
import pathlib,re
sha=re.compile(r'^[0-9a-fA-F]{40}$')
pat=re.compile(r'\buses:\s*[\"\']?([^\"\'\s#]+)@([^\"\'\s#]+)')
bad=[]
for p in sorted(list(pathlib.Path('.github/workflows').glob('*.yml'))+list(pathlib.Path('.github/workflows').glob('*.yaml'))):
    for n,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        m=pat.search(line)
        if not m: continue
        target,ref=m.group(1),m.group(2)
        if target.startswith('./') or target.startswith('docker://'): continue
        if not sha.fullmatch(ref): bad.append(f'{p}:{n}: {target}@{ref}')
if bad: raise SystemExit('Mutable external Action refs remain:\n'+'\n'.join(bad))
print('All external GitHub Actions are immutable-SHA pinned.')
PY

if git diff --quiet -- package-lock.json .github/workflows docs/investor-ready/rt006-supply-chain-evidence.md; then
  echo 'No materialization changes required.'
  exit 0
fi

git config user.name 'HOY RT-006 Supply Chain'
git config user.email 'actions@users.noreply.github.com'
git add -- package-lock.json .github/workflows docs/investor-ready/rt006-supply-chain-evidence.md
git commit -m 'Materialize RT-006 supply-chain hardening'
git push origin "HEAD:${TARGET_BRANCH}"
