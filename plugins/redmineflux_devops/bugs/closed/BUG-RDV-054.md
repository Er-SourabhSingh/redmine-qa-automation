# Bug Report

- Bug ID: BUG-RDV-054
- Title: On-call schedule feature not implemented — no widget on any DevOps page
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Navigate to any DevOps page.
2. Search for an on-call schedule widget.

## Expected result

On-call schedule sidebar widget showing current on-call person's name and shift end time. Configurable for PagerDuty/Opsgenie.

## Actual result

No on-call widget on any DevOps sub-nav page. HTML contains no reference to "on-call", "pagerduty", or "opsgenie". Feature entirely absent. Retest 2026-05-29 confirmed: on-call widget still absent from all DevOps pages.

Note: "On-Call" section DOES appear on the Project Overview page as a widget header — but with no content (empty widget). The full feature (PagerDuty/Opsgenie integration) is not implemented.

## Evidence

![BUG-RDV-054 — Alerts page with no on-call schedule widget](../../screenshots/BUG-RDV-054/bug-rdv-054-no-on-call-schedule-widget.png)

## Duplicate check

- Duplicate found: No
