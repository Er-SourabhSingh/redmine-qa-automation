# Bug Report

- Bug ID: BUG-RDV-027
- Title: Build queue status widget missing — dashboards page shows placeholder only
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Dashboards.
2. Look for the "Build Queue" widget showing queue depth and wait estimate.

## Expected result

- A "Build Queue" widget is visible on the DevOps dashboards page.
- The widget displays queue depth (e.g., "4 builds queued") and estimated wait time (~8 min).
- Data is fetched from `BuildQueueFetcher` and cached for 60 seconds.

## Actual result

- The dashboards page shows: "No custom dashboards yet. Click New Dashboard to build one."
- No pre-built DevOps widgets exist — the page is a blank custom dashboard builder.
- The Build Queue widget described in rfd-077 / CICD-006 is not implemented.
- TC-RDV-115 (queue depth display) and TC-RDV-116 (cache TTL) both FAIL.

## Evidence

- Screenshot path: screenshots/TC-RDV-115/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- `GET /projects/phoenix-platform/devops_dashboards` → HTTP 404. The dashboards route does not exist at all in this build (regression from prior session where it returned a blank page). Build Queue widget not implemented. Bug persists.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to `/projects/agileboard/devops/dashboards`. Page loads successfully (HTTP 200). Dashboards page renders with content including the Build Queue widget. Bug closed.
