# Bug Report

- Bug ID: BUG-RDV-048
- Title: Test coverage tracking feature not implemented — no coverage page, webhook, or trend widget
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: current (local Docker 2026-05-28)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28

## Steps to reproduce

1. Authenticate with a valid admin API key
2. Send `POST /devops/webhook/codecov/phoenix-platform` with payload `{"coverage":81.5,"build_id":1,"commit_sha":"abc123ef"}`
3. Attempt to navigate to `/projects/phoenix-platform/devops/coverage`
4. Check `GET /projects/phoenix-platform/devops/coverage.json`

## Expected result

- Coverage webhook (`codecov` provider) accepted with HTTP 202; coverage percentage stored in `redmineflux_devops_coverage_reports` table
- A dedicated Coverage page (or widget on the project DevOps dashboard) shows the current coverage %, a trend arrow, and an SVG sparkline over recent builds
- When no coverage data exists, the widget renders an empty state: "No coverage data available"

## Actual result

- `POST /devops/webhook/codecov/phoenix-platform` → HTTP 404 `{"error":"provider not found"}` — `codecov` is not in SUPPORTED_PROVIDERS
- All coverage URL patterns return 404:
  - `/projects/phoenix-platform/devops/coverage`
  - `/projects/phoenix-platform/devops_coverage`
  - `/projects/phoenix-platform/devops/coverage.json`
  - `/projects/phoenix-platform/devops_coverage_reports`
  - `/devops/coverage_reports/phoenix-platform`
- Alternate coverage provider names (`coveralls`, `coverage`, `code_coverage`) also return 404
- The DevOps navigation bar has no "Coverage" tab; no coverage widget exists on any DevOps page
- The Code Quality page (`/devops/code_quality`) has a "Coverage" column in its table but it is part of code scanner results (SonarQube), not the standalone coverage tracking feature (rfd-021)

## Evidence

![BUG-RDV-048 — No coverage page in DevOps navigation](../../screenshots/BUG-RDV-048/bug-rdv-048-no-coverage-page.png)
![BUG-RDV-048 — Codecov webhook endpoint returns 404](../../screenshots/BUG-RDV-048/bug-rdv-048-codecov-webhook-404.png)

## Affected test cases

- TC-RDV-262 (BLOCKED) — Coverage trend widget shows % with trend arrow and sparkline
- TC-RDV-263 (FAIL) — Coverage reports table populated from webhook data
- TC-RDV-279 (BLOCKED) — Coverage trend shows down arrow when coverage declines
- TC-RDV-287 (BLOCKED) — Coverage widget shows "No Data" when no builds with coverage exist

## Duplicate check

- Duplicate found: No
- Existing bug reference: None (distinct from BUG-RDV-009 DORA route missing; this is the Test Coverage Tracking feature, rfd-021)
