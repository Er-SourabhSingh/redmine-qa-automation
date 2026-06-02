# Bug Report

- Bug ID: BUG-RDV-085
- Title: Incident timeline event labels "Alert fired"/"Status change" and "Post-Mortem" heading not translated in any locale
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Change language to German (de).
2. Navigate to `/projects/phoenix-platform/devops_incidents/1`.
3. Scroll to the Timeline section.
4. Observe event type labels.

## Expected result

"Alert fired" → "Alert ausgelöst" (de). "Status change" → "Statusänderung" (de). "Post-Mortem" → "Postmortem" (de).

## Actual result

Retest 2026-05-29: "Alert fired" still English: **true**. "Status change" still English: **true**. "Post-Mortem" still English: **true**. Confirmed across all 10 non-English locales.

## Evidence

![BUG-RDV-085 — German incident detail: Alert fired and Status change in English](../../screenshots/BUG-RDV-085/bug-rdv-085-de-incident-timeline.png)

## Duplicate check

- Duplicate found: No
