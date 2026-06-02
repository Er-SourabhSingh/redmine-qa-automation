# Bug Report

- Bug ID: BUG-RDV-080
- Title: Multiple UI strings missing from locale files — untranslated in all non-English languages
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN ("Add Rule" and "Trigger" still English in German)

## Steps to reproduce

1. Change language to German (de).
2. Navigate to DevOps Settings — observe "Add Rule" button, "Trigger"/"Source status"/"Target status" headers still English.
3. Navigate to Dashboards → Delete — observe "Delete Dashboard?" and "Cancel" still English.
4. Navigate to New Incident form — observe "Severity" and "Status" still English.
5. Navigate to Builds — observe "From:" and "To:" still English.

## Expected result

All UI labels, buttons, and column headers rendered in the active locale.

## Actual result

Confirmed across all 10 tested locales (de, fr, es, ja, ru, nl, pl, pt, pt-BR, zh):
- Settings auto-transition: "Add Rule", "Trigger", "Source status", "Target status" — English
- Dashboard delete modal: "Delete Dashboard?" and "Cancel" — English
- New Incident form: "Severity" and "Status" — English
- Date filters: "From:" and "To:" — English

Retest 2026-05-29 German: "Add Rule" still English: **true**. "Trigger" still English: **true**.

## Evidence

![BUG-RDV-080 — Settings page (German): Add Rule and Trigger in English](../../screenshots/BUG-RDV-080/bug-rdv-080-de-settings-add-rule.png)

![BUG-RDV-080 — New Incident form (German): Severity and Status in English](../../screenshots/BUG-RDV-080/bug-rdv-080-de-new-incident-severity.png)

## Duplicate check

- Duplicate found: No
