# BUG-RDV-019 — PR linked to multiple issues via "refs #N" in title only updates first referenced issue

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-019 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-079 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
When a PR title contains references to multiple issues (e.g. "Fixes #518 and refs #519"), only the first referenced issue (#518 via "Fixes") gets the PR card in its DevOps panel. The second reference (#519 via "refs") is silently ignored.

## Steps to Reproduce
1. Send a GitHub `pull_request` opened webhook with title `"Fixes #518 and refs #519 — combined auth fix"`.
2. Navigate to issue #518 DevOps panel > Pull Requests.
3. Navigate to issue #519 DevOps panel > Pull Requests.

## Expected Result
- PR card appears on BOTH issue #518 and issue #519 DevOps panels.
- Two records created in `redmineflux_devops_pull_requests` (one per linked issue).

## Actual Result
- PR card appears on issue #518 only (`has518PR: true`).
- Issue #519 DevOps panel shows 0 PRs (`prRowCount: 0`).

## Screenshot
No dedicated screenshot — verified via fetch response and issue #519 panel DOM inspection.

## Notes
- The issue reference parser likely only processes the first match from the PR title/body.
- The spec states "Supports multiple PRs per issue" and multi-issue PR linking should work in both directions.
- PR body (`"Fixes #518 and refs #519"`) was also included in the payload — neither the body nor title parsed the second reference.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Sent signed PR merge webhook with body: `"fixes #479, refs #478, closes #477"`. Auto-transition enabled (target: Resolved). Issues #479, #478, and #477 all transitioned to Resolved status. Multi-issue PR reference parsing now works correctly for all referenced issues. Bug closed.

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE**
- Issues #518 and #519 from the original test environment do not exist in the fresh instance. Project issues in the fresh env are numbered 6–33 (28 total). Re-testing requires sending a PR webhook referencing two valid issue IDs. Not re-executed in this retest cycle due to environment mismatch.
