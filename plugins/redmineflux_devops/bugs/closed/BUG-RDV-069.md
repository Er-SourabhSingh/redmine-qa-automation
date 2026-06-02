# Bug Report

- Bug ID: BUG-RDV-069
- Title: No journal or timeline entry created after sending communication template
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (not yet re-verified via full comms send)

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_incidents/1`.
2. Open the communication template modal.
3. Select "SEV1 Stakeholder Update" template, click Preview, then "Send Update".
4. Check the incident timeline for a new entry.

## Expected result

Timeline/journal entry: "Communication sent — Template '[name]' sent by [user] at [timestamp]".

## Actual result

No new timeline entry appears after sending. Communication action is invisible in incident audit history. Retest 2026-05-29: incident 11 timeline shows existing entries only — no comms send entry present.

## Evidence

![BUG-RDV-069 — Incident detail with no journal after communication sent](../../screenshots/BUG-RDV-069/bug-rdv-069-no-journal-after-comms.png)

## Duplicate check

- Duplicate found: No
