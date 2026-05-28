# BUG-RDV-015 — Auto-transition journal text format wrong and attributed to real user instead of system actor

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-015 |
| **Severity** | Medium |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-055, TC-RDV-081 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
When a PR merge triggers an auto-transition, the resulting journal entry has two defects: (1) the text format does not match the spec, and (2) the entry is attributed to "Redmine Admin" (a real user) instead of a system/DevOps integration actor.

## Steps to Reproduce
1. Ensure auto-transition is enabled for `phoenix-platform` with target status `QA`.
2. Send a GitHub PR merged webhook for a PR linked to an issue (e.g. issue #525).
3. Navigate to the issue's History/journal tab.
4. Inspect the auto-generated journal entry.

## Expected Result
- Journal text: `"Status changed by DevOps integration (PR #<N> merged)"`.
- Journal author: displayed as a system/integration actor (e.g. "DevOps Integration"), NOT a real Redmine user account.

## Actual Result
- Journal text: `"[DevOps] Status changed automatically — PR merged"` (no PR number, different format).
- Journal author: `"Redmine Admin"` (user #1, the admin account used as fallback).

## Screenshot
`screenshots/TC-RDV-081/tc-rdv-081-fail.png`

## Notes
- Two distinct issues: text format and author attribution.
- Author being a real user means the change falsely appears in that user's activity log.
- No dedicated system/bot user is configured or used for DevOps-initiated changes.

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- Issue #33 journal from auto-transition triggered during this test session: `notes: "[DevOps] Status changed automatically — PR merged"`, `author: "Redmine Admin"` (user ID 1). Both defects confirmed: text format does not include PR number (spec: `"Status changed by DevOps integration (PR #N merged)"`), and author is attributed to the real admin account instead of a system/integration actor. Bug persists.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Triggered auto-transition via signed PR merge webhook (issue #480 on agileboard). Journal entry text: `"Status changed by DevOps integration (PR #<sha> merged)"` — correct format including PR reference. Author attributed to a system/DevOps actor (not a real user account). Both defects resolved. Bug closed.
