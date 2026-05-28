# BUG-RDV-043 — Deployments history list has no date range filter

- Bug ID: BUG-RDV-043
- Title: Deployments history list has no date range filter
- Redmine version: 6.0.9 (Local)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker — http://localhost:3008
- Browser: Playwright MCP
- User role: Admin
- Date: 2026-05-26

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Look for a date range filter (From / To date pickers or a period dropdown).

## Expected result

- A date range filter is present on the Deployments list page.
- Users can filter deployments by a custom "From" and "To" date range.
- Filtering produces a scoped list showing only deployments within the selected range.

## Actual result

- No date range filter controls appear on the Deployments page.
- The page shows a flat list of all deployment records with no temporal filtering.
- The only available filter is by environment (dropdown), not by date.

## Evidence

- Screenshot path: screenshots/TC-RDV-154/
- Confirmed via: TC-RDV-154 FAIL on 2026-05-26

## Duplicate check

- Duplicate found: No (BUG-RDV-024 covers build history date filter — different module)
- Existing bug reference: BUG-RDV-024 (builds, not deployments)

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to `/projects/agileboard/devops_deployments`. Date range filter controls (From / To date pickers) are present above the deployments table. Users can filter by custom date range. Bug closed.
