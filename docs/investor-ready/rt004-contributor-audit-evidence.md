# RT-004 Contributor Audit Evidence — 2026-08-18

## Purpose
Durable diligence record for the repository contributor/author census covering the three HOY core repositories.

## Successful audit execution
- Workflow: `Investor Ready RT-004 Contributor Audit`
- GitHub Actions run ID: `32184547569`
- Head SHA: `b6d8a80136001c572ee1b7fed34a35b4a10fd8ff`
- Artifact name: `hoy-rt004-contributor-audit`
- Artifact ID: `9341958517`
- Artifact SHA-256: `e9d978c70150085bf6cce2b478c7f181d882b2fa7547235ac5bc4f7b6c028a76`
- Retention configured by workflow: 90 days

The workflow checks out each repository with full history, explicitly fetches every currently advertised branch and tag, then records refs, unique authors, unique committers, co-author trailers, full chronological commit history and dependency/licence-boundary files.

## Final census
| Repository | Founder identities | Platform/Bot identities | Review-required identities |
|---|---:|---:|---:|
| `hapo3005/hoy` | 1 | 3 | 0 |
| `hapo3005/hoy-lifestyle` | 1 | 1 | 0 |
| `hapo3005/hoy-works` | 1 | 0 | 0 |

**Total review-required identities: 0.**

## Identity register
### `hapo3005/hoy`
- `hapo3005 <jan.nikolic@web.de>` — FOUNDER
- `GitHub <noreply@github.com>` — PLATFORM_OR_BOT
- `HOY Menu Image Publisher <actions@users.noreply.github.com>` — PLATFORM_OR_BOT
- `HOY Menu Renderer <actions@users.noreply.github.com>` — PLATFORM_OR_BOT

### `hapo3005/hoy-lifestyle`
- `hapo3005 <jan.nikolic@web.de>` — FOUNDER
- `GitHub <noreply@github.com>` — PLATFORM_OR_BOT

### `hapo3005/hoy-works`
- `hapo3005 <jan.nikolic@web.de>` — FOUNDER

## Automation resolution evidence
### HOY Menu Image Publisher
Commit `8d9a27a06f1b3f4e6d5bb2055e9abb15bdae40af` is attributed by GitHub to account `actions` and adds only three JPG files under the reviewed Bonobo menu bundle. `.github/workflows/menu-image-publish.yml` explicitly configures:
- `git config user.name "HOY Menu Image Publisher"`
- `git config user.email "actions@users.noreply.github.com"`
- the exact commit message `HOY menu assets: publish reviewed Bonobo pages`
- staging restricted to `menu-pages/4/f9653f87c69d`

Classification: **verified repository automation, not a human contributor**.

### HOY Menu Renderer
Commit `7596779664beb4ef810faf3332c3a1e42b531ff3` is attributed by GitHub to account `actions` and adds only JPG render pages under `menu-pages`. `.github/workflows/menu-pdf-render.yml` explicitly configures:
- `git config user.name "HOY Menu Renderer"`
- `git config user.email "actions@users.noreply.github.com"`
- the exact commit message `HOY menu assets: publish reviewed PDF pages`
- staging restricted to `menu-pages`

Classification: **verified repository automation, not a human contributor**.

## Rights boundary
This technical conclusion addresses contributor/author identity only. It does **not** assert that restaurant menus, photos, PDFs, source data, third-party software or other imported/generated materials are founder-owned. Those rights remain governed by the dedicated OSS/SBOM/media/data-rights workstreams (RT-006 and RT-007).

## Scope limitation
The census covers all commits reachable from branches/tags advertised and fetched from the GitHub origins at runtime. A fresh remote clone cannot enumerate objects that are no longer reachable from any advertised ref. No stronger statement is made.

## DD conclusion
- No external human contributor is identified in the currently reachable repository history.
- No contributor-specific remediation agreement is presently indicated.
- Founder-to-HOY/Parent rights execution remains mandatory before investor release.
- Counsel should retain/accept the technical `NONE IDENTIFIED` contributor exception result as part of the final legal chain-of-title package.

This is a technical diligence record, not a legal opinion.
