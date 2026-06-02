# Bug Report

- Bug ID: BUG-RDV-082
- Title: "Deployment is disabled — this environment is locked." tooltip not translated in any locale; Create Post-Mortem button tooltip absent
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN (German tooltip still English)

## Steps to reproduce

1. Change language to German (de).
2. Navigate to `/projects/phoenix-platform/devops_environments`.
3. Hover over the disabled Deploy button on a locked environment.

## Expected result

Tooltip translated: "Deployment deaktiviert — diese Umgebung ist gesperrt."

## Actual result

Tooltip reads "Deployment is disabled — this environment is locked." in English in all tested non-English locales (de, fr). Retest 2026-05-29: tooltip "Deployment is disabled — this environment is locked." **still English**.

Post-Mortem button on incident detail has NO tooltip attribute at all in any language.

## Evidence

![BUG-RDV-082 — German environments: locked tooltip in English](../../screenshots/BUG-RDV-082/bug-rdv-082-de-environments-locked-tooltip.png)

## Duplicate check

- Duplicate found: No
