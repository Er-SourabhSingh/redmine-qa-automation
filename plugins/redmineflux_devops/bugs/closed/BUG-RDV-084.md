# Bug Report

- Bug ID: BUG-RDV-084
- Title: "On-Call" widget section header not translated on Project Overview in any locale
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN ("On-Call" English in German)

## Steps to reproduce

1. Change language to any non-English locale (e.g., German).
2. Navigate to `/projects/phoenix-platform`.
3. Find the "On-Call" widget section on the project overview.

## Expected result

"On-Call" header translated (German: "Bereitschaft", French: "Astreinte", Japanese: "オンコール").

## Actual result

"On-Call" header shows as English in all 10 tested non-English locales. Retest 2026-05-29: "On-Call" English: **true**, no translated equivalent found.

Also: "Trend" column header untranslated in de/nl/pl; "Provider" column untranslated in nl.

## Evidence

![BUG-RDV-084 — German project overview: On-Call in English](../../screenshots/BUG-RDV-084/bug-rdv-084-de-overview-oncall.png)

## Duplicate check

- Duplicate found: No
