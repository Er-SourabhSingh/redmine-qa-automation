# Bug Report

- Bug ID: BUG-RDV-086
- Title: "In-app" notification channel column header not translated on /my/devops_notifications
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Low
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN ("In-app" English in German)

## Steps to reproduce

1. Change language to German (de).
2. Navigate to `/my/devops_notifications`.
3. Observe the notification matrix column headers.

## Expected result

"In-app" column translated: German "In der App", French "Dans l'application", Dutch "In de app".

## Actual result

"In-app" displays as English "In-App" in de, "In-app" in fr/nl. Retest 2026-05-29: column headers: Event | Email | **In-app** | Slack | Teams. "In-app" English: **true**.

## Evidence

![BUG-RDV-086 — German notifications: In-app header in English](../../screenshots/BUG-RDV-086/bug-rdv-086-de-notifications.png)

## Duplicate check

- Duplicate found: No
