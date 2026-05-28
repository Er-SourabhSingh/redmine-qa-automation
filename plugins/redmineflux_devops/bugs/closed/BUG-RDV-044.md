# BUG-RDV-044 — Environment card relative timestamp duplicates the word "days"

- Bug ID: BUG-RDV-044
- Title: Environment card relative timestamp duplicates the word "days"
- Redmine version: 6.0.9 (Local)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker — http://localhost:3008
- Browser: Playwright MCP
- User role: Admin
- Date: 2026-05-26

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Observe the health status line on any environment card that was last deployed more than 1 day ago.

## Expected result

- Relative timestamp reads: "healthy · 8 days ago"

## Actual result

- Relative timestamp reads: "healthy · 8 days days ago"
- The word "days" is duplicated, producing grammatically incorrect output.

## Evidence

- Screenshot path: screenshots/TC-RDV-157/
- Confirmed text: "healthy · 8 days days ago" on dev environment card
- Confirmed via: TC-RDV-157 PARTIAL PASS on 2026-05-26

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Checked environment cards on `/projects/agileboard/devops_environments`. Relative timestamp reads correctly (e.g., "healthy · 8 days ago" — no duplication of "days"). Bug closed.
