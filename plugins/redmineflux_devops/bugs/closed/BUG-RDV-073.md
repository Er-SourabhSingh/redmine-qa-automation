# Bug Report

- Bug ID: BUG-RDV-073
- Title: No "Check Now" button for manual environment health status trigger
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_environments`.
2. Look for a "Check Now" button on any environment card.

## Expected result

Each environment card has a "Check Now" button. Clicking triggers AJAX health check without page reload.

## Actual result

No "Check Now" or "Check Health" button found on any environment card. Routes `/check_health` and `/health_check` return HTTP 404. Retest 2026-05-29 confirmed: no check-now/check-health buttons present.

## Evidence

![BUG-RDV-073 — Environments with no Check Now button](../../screenshots/BUG-RDV-073/bug-rdv-073-no-check-now-button.png)

## Duplicate check

- Duplicate found: No
