# BUG-RDV-042 — Deployments list has no per-environment current-version summary row

- Bug ID: BUG-RDV-042
- Title: Deployments list has no per-environment current-version summary row
- Redmine version: 6.0.9 (Local)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker — http://localhost:3008
- Browser: Playwright MCP
- User role: Admin
- Date: 2026-05-26

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Observe the top section of the page above the deployments table.

## Expected result

- A summary section shows each environment's current version and last deployment date (e.g., "dev: v2.3.2 | staging: v2.3.1 | production: v2.3.0").
- This gives a quick at-a-glance status of all environments without scrolling.

## Actual result

- No per-environment summary row exists above the deployments table.
- Only a flat list of individual deployment records is shown.
- Users must manually filter or scroll to find the current version per environment.

## Evidence

- Screenshot path: screenshots/TC-RDV-151/
- Confirmed via: TC-RDV-151 FAIL on 2026-05-26

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to `/projects/agileboard/devops_deployments`. A per-environment current-version summary row is displayed at the top of the deployments list, showing each environment's current version and last deployment date. Bug closed.
