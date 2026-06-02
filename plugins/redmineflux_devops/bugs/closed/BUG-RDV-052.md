# Bug Report

- Bug ID: BUG-RDV-052
- Title: Auto-created incidents use "Bug" tracker instead of "Incident" tracker
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — UNCONFIRMED (could not verify linked issue tracker)

## Steps to reproduce

1. Send a critical Prometheus AlertManager webhook to `POST /devops/webhook/prometheus/phoenix-platform` with `X-DevOps-Token: MonitorToken123`.
2. Navigate to `/projects/phoenix-platform/devops_incidents`.
3. Click the linked Redmine issue number.
4. Inspect the Tracker field on the issue page.

## Expected result

Auto-created incident uses tracker = "Incident" (ID 3). Priority = "Urgent".

## Actual result

Original: Auto-created issues use tracker = "Bug" (ID 4). Retest 2026-05-29: Webhook returns 202 (accepted) but linked issue tracker could not be verified via API (no linked issue found in recent issues query). Status remains uncertain — marking OPEN pending verified retest.

## Evidence

![BUG-RDV-052 — Issues list showing [Incident] auto-created with Bug tracker](../../screenshots/BUG-RDV-052/bug-rdv-052-incident-issues-use-bug-tracker.png)

## Duplicate check

- Duplicate found: No
