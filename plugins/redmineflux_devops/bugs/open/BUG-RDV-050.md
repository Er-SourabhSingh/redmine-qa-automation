# Bug Report

- Bug ID: BUG-RDV-050
- Title: QA Engineer role can access DORA Metrics page — role-based access control not enforced
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: QA Engineer (qa_user)
- Date: 2026-05-28
- Severity: High

## Steps to reproduce

1. Log in as a user with only the QA Engineer role on project "Phoenix Platform" (e.g., `qa_user`)
2. Navigate to `/projects/phoenix-platform/devops_metrics`
3. Observe the page response

## Expected result

- Per the requirements matrix, the QA role does NOT have "View DORA Metrics" permission
- The Metrics page should return HTTP 403 or redirect to a "Permission denied" page
- DORA metric data (Deployment Frequency, Lead Time, CFR, MTTR) should not be visible to QA Engineer role users

## Actual result

- The DORA Metrics page returns HTTP 200 for `qa_user` (QA Engineer role)
- All DORA metric cards are fully visible: Deployment Frequency (0.23), Lead Time (0h), CFR (66.7%), MTTR (0h)
- The plugin uses a single `view_devops` permission check for the metrics page — no separate "view DORA metrics" permission is enforced
- Affects TC-RDV-318

## Evidence

![BUG-RDV-050 — QA Engineer role can access DORA Metrics page (should be 403)](../../screenshots/BUG-RDV-050/bug-rdv-050-qa-user-metrics-accessible.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
