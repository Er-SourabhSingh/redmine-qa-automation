# Bug Report

- Bug ID: BUG-RDV-050
- Title: QA Engineer role can access DORA Metrics page — role-based access control not enforced
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (200 for qa_user)

## Steps to reproduce

1. Authenticate as qa_user (QA Engineer role, password: TestPass123!).
2. Navigate to `/projects/phoenix-platform/devops_metrics`.
3. Observe HTTP response.

## Expected result

QA Engineer role does not have "View DORA Metrics" permission → HTTP 403.

## Actual result

HTTP 200. DORA metrics page fully accessible to qa_user. Single `view_devops` permission check used — no separate DORA metrics permission enforced. Retest 2026-05-29 via basic auth: still returns 200.

## Evidence

![BUG-RDV-050 — QA user can access DORA Metrics (should be 403)](../../screenshots/BUG-RDV-050/bug-rdv-050-qa-user-metrics-accessible.png)

## Duplicate check

- Duplicate found: No
