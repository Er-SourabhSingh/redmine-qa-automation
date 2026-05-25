# BUG-RDV-022 — Multi-commit push webhook (TC-RDV-089) stores no commits — background job silently fails

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-022 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-089 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
A GitHub push webhook containing 3 commits (two with issue references, one without) returns HTTP 202 but no commits are stored in `redmineflux_devops_commits`. The background job fails silently — same root cause as BUG-RDV-007 (ActiveRecord::RecordInvalid on commit processing). The total commit count in the project remains unchanged after the webhook.

## Steps to Reproduce
1. Send a GitHub `push` event with 3 commits (SHAs: `aaa001...`, `bbb002...`, `ccc003...`).
2. One commit references issue #517, one references issue #520, one has no issue reference.
3. Navigate to `/projects/phoenix-platform/devops_commits`.
4. Search for commit messages or SHAs from the payload.

## Expected Result
- All 3 commits stored in `redmineflux_devops_commits`.
- Issue #517 panel shows commit `aaa001`.
- Issue #520 panel shows commit `bbb002`.
- Commit `ccc003` stored but not linked to any issue.

## Actual Result
- HTTP 202 returned immediately.
- 0 of 3 commits found in commits list after webhook.
- Project commit count: 50 (unchanged).

## Screenshot
`screenshots/TC-RDV-089/tc-rdv-089-fail.png`

## Notes
- Root cause: same as BUG-RDV-007 — background job raises `ActiveRecord::RecordInvalid` and rolls back without storing commits.
- Multi-commit batches are not processed atomically — all 3 fail together.
- Single-commit pushes exhibit the same failure (none of our test-run webhooks stored commits).
