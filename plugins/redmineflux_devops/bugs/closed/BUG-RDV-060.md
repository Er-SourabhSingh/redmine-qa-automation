# Bug Report

- Bug ID: BUG-RDV-060
- Title: Incident creation form deviates from INC-001 — no standalone Title field; affected_service is sole identifier
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_incidents/new`.
2. Observe the form fields.

## Expected result

Form contains a standalone **Title** field (required, per INC-001) separate from Affected Service.

## Actual result

Form fields (retest 2026-05-29): Severity | Status | Affected service | Started at | Linked issue | Root cause | Also create a Redmine issue. **No Title field present.** The `affected_service` value is used as the incident heading.

## Evidence

![BUG-RDV-060 — New Incident form with no Title field](../../screenshots/TC-RDV-421/tc-rdv-421-fail.png)

## Duplicate check

- Duplicate found: No
