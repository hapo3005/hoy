#!/usr/bin/env bash
set -euo pipefail

# HOY RT-004 contributor/author audit.
# Run from a trusted local clone after fetching all refs/tags.
# This script is read-only: it never changes repository history.

repo_name="$(basename "$(git rev-parse --show-toplevel)")"
mkdir -p investor-ready-audit

# Make sure the operator has explicitly fetched all refs before treating output as exhaustive.
git for-each-ref --format='%(refname)' refs/heads refs/remotes refs/tags \
  > "investor-ready-audit/${repo_name}-refs.txt"

# Every author identity observed across all reachable commits.
git log --all --format='%aN%x09%aE' \
  | sort -fu \
  > "investor-ready-audit/${repo_name}-authors.tsv"

# Committer identities are recorded separately because web-flow/bots may commit a human-authored change.
git log --all --format='%cN%x09%cE' \
  | sort -fu \
  > "investor-ready-audit/${repo_name}-committers.tsv"

# Co-author trailers can reveal contributors that ordinary top-author lists miss.
git log --all --format='%H%x09%B%x1e' \
  | awk -v RS='\036' 'BEGIN{IGNORECASE=1} /Co-authored-by:/ {gsub(/\n/," | "); print}' \
  > "investor-ready-audit/${repo_name}-coauthor-commits.txt"

# Full chronological audit trail for counsel / DD review.
git log --all --reverse --date=iso-strict \
  --format='%H%x09%aN%x09%aE%x09%aI%x09%cN%x09%cE%x09%cI%x09%s' \
  > "investor-ready-audit/${repo_name}-commit-history.tsv"

# Potential imported/submodule/vendor boundaries that need OSS/third-party review.
find . -maxdepth 5 -type f \( \
  -name 'package.json' -o -name 'package-lock.json' -o -name 'pnpm-lock.yaml' -o -name 'yarn.lock' -o \
  -name 'requirements.txt' -o -name 'poetry.lock' -o -name 'Cargo.toml' -o -name 'Cargo.lock' -o \
  -name 'go.mod' -o -name 'go.sum' -o -name 'LICENSE*' -o -name 'COPYING*' -o -name '.gitmodules' \
\) -print | sort \
  > "investor-ready-audit/${repo_name}-dependency-rights-files.txt"

printf 'RT-004 audit complete for %s\n' "$repo_name"
printf 'Review generated files under investor-ready-audit/ and map every human author to the signed rights register.\n'
printf 'IMPORTANT: output is exhaustive only if all relevant refs/remotes/tags were fetched before execution.\n'