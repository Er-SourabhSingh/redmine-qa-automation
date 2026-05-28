# BUG-RDV-038 — Environment cards not ordered by environment type (dev→staging→production)

- Bug ID: BUG-RDV-038
- Title: Environments list does not sort by type hierarchy (dev → staging → uat → production)
- Severity: Low
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Configure multiple environments for a project: production, uat, dev, staging (in any creation order).
2. Navigate to `/projects/phoenix-platform/devops_environments`.
3. Observe the order of environment cards.

## Expected result

- Environments should be displayed in logical pipeline order: dev → staging → uat → production.
- This mirrors the typical software delivery lifecycle and helps users understand the deployment flow at a glance.

## Actual result

- Environments are displayed in the order they appear in the database (likely creation order or position field).
- Observed order: production, uat, dev, staging (does not follow the expected pipeline hierarchy).
- The dropdown filter on the deployments list follows the same incorrect order.

## Evidence

- Screenshot path: screenshots/TC-RDV-151/ (FAIL — environments list order mismatch)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Navigated to `/projects/phoenix-platform/devops_environments`. Environment card order: dev → staging → qa → uat → production. Environments are now displayed in logical pipeline order. Bug no longer reproduces.
