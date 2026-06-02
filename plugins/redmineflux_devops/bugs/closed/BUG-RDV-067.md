# Bug Report

- Bug ID: BUG-RDV-067
- Title: Deployment correlation override creates no timeline or audit entry
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (timeline count unchanged after PATCH)

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_incidents/6`.
2. Set the "Related Deployment" field and click "Save Correlation".
3. Check the incident timeline for a new entry.

## Expected result

Timeline entry created: "Deployment correlation updated — Deployment #X linked by [user] at [timestamp]".

## Actual result

Related Deployment field updates but no timeline entry is created. Retest 2026-05-29: timeline entries before PATCH = 2, after PATCH = 2 (**no new entry**).

## Evidence

![BUG-RDV-067 — Deployment correlation saved with no timeline entry](../../screenshots/TC-RDV-433/tc-rdv-433-fail.png)

## Duplicate check

- Duplicate found: No
