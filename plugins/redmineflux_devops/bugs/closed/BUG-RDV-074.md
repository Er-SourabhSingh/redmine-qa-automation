# Bug Report

- Bug ID: BUG-RDV-074
- Title: Admin has no "Override Freeze" option — active deployment freeze blocks Admin unconditionally
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Ensure an active deployment freeze exists.
2. Log in as Admin and navigate to Project → DevOps → Environments.
3. Try to deploy to a frozen environment.

## Expected result

Admin sees "Override Freeze" option with mandatory reason field. Override recorded in audit log.

## Actual result

No "Override Freeze" option presented to Admin. Deploy button disabled. API returns HTTP 423. No override path exists. Retest 2026-05-29: no "override" or "Override" text found on environments page.

## Evidence

![BUG-RDV-074 — Deploy modal with no Override Freeze option](../../screenshots/BUG-RDV-074/bug-rdv-074-deploy-modal-no-override-option.png)

## Duplicate check

- Duplicate found: No
