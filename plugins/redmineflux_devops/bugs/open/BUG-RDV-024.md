# Bug Report

- Bug ID: BUG-RDV-024
- Title: Build history date filter has no custom date range — only preset period dropdown
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Observe the filter form above the build list.
3. Look for date range input fields (date_from / date_to date pickers).

## Expected result

- The filter form includes two date picker fields: "From date" and "To date" (or equivalent `date_from` / `date_to` inputs).
- Users can specify any arbitrary date range to filter builds.
- Custom date range and preset period dropdowns may coexist, but custom date inputs must be present.

## Actual result

- The filter form contains only a "Period" preset dropdown: "Last 7 days", "Last 30 days", "Last 90 days", "All time".
- No custom date picker fields (`date_from` / `date_to`) are present.
- Users cannot filter builds for a specific custom date range (e.g., May 1–15 only).

## Evidence

- Screenshot path: screenshots/TC-RDV-100/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
