# Bug Report

- Bug ID: BUG-RDV-031
- Title: Build run duration not stored or displayed — webhook run_duration_ms field silently ignored
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Send a `workflow_run` completed webhook with `run_duration_ms: 187000` (3 minutes 7 seconds) to `/devops/webhook/github/phoenix-platform`.
2. Navigate to the Builds list page for phoenix-platform.
3. Check the "Duration" column for the build.
4. Navigate to the issue linked to that build and check the DevOps panel badge.
5. Check the "Duration" column in the Builds (N) table inside the DevOps panel.

## Expected result

- The Duration column on the Builds list shows "3m 7s" or equivalent human-readable format.
- The build detail page shows "DURATION: 3m 7s".
- The DevOps issue panel badge shows "Build #513 passed (3m 7s)".
- The stats bar shows a non-zero average duration.

## Actual result

- The builds list Duration column shows "-" for all builds, including those sent with `run_duration_ms: 187000`.
- The build detail page shows "DURATION: N/A".
- The issue panel badge shows "Build #513 success" with no duration.
- The stats bar shows "0s avg duration".
- The `run_duration_ms` field from the GitHub `workflow_run` webhook payload is silently ignored by the background job.
- TC-RDV-134 (relative duration bars) and TC-RDV-150 (duration in badge) both FAIL.

## Evidence

- Screenshot path: screenshots/TC-RDV-134/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- Navigated to `/projects/phoenix-platform/devops_builds`. Duration column exists but all values show "-" for all builds. Duration is not stored or displayed. Bug persists.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to builds list for agileboard. Duration column displays formatted values (e.g., "2m 15s", "45s") for completed builds. `run_duration_ms` is stored and displayed correctly. Bug closed.
