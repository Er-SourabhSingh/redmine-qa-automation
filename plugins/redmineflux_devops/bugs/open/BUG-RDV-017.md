# BUG-RDV-017 — PR Review Dashboard and Commits page return HTTP 200 to users without view_devops permission

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-017 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-067, TC-RDV-072 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
The PR Review Dashboard (`/devops_pull_requests`) and Commits list (`/devops_commits`) do not enforce project membership or `view_devops` permission. A non-member (`external_user`) and a user without `view_devops` (`reporter_user`) both receive HTTP 200 with full data instead of HTTP 403.

## Steps to Reproduce
**Non-member (TC-RDV-067):**
1. Make a fetch request to `/projects/phoenix-platform/devops_pull_requests` with `X-Redmine-Switch-User: external_user`.
2. Observe response code and body.

**Reporter without view_devops (TC-RDV-072):**
1. Make a fetch request to `/projects/phoenix-platform/devops_commits` with `X-Redmine-Switch-User: reporter_user`.
2. Observe response code and body.

## Expected Result
- HTTP 403 Forbidden in both cases.
- No PR or commit data returned.

## Actual Result
- HTTP 200 with full PR table and commit table data in both cases.
- `hasPRRows: true`, `hasCommitTable: true` confirmed in response body.

## Screenshot
`screenshots/TC-RDV-067/tc-rdv-067-fail.png`

## Notes
- Same root cause as BUG-RDV-011 (webhook log permission not enforced).
- Suggests the `:view_devops` before_action guard is missing from multiple DevOps controllers.
- Affects at minimum: `devops_pull_requests_controller`, `devops_commits_controller`.
