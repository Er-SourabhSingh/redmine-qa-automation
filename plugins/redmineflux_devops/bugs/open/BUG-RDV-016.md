# BUG-RDV-016 — PR Review Dashboard shows all statuses (not just open) and sorts by updated date instead of age

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-016 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-065 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
The PR Review Dashboard at `/projects/<id>/devops_pull_requests` displays all PR statuses (merged, closed, draft, open) instead of only open PRs, and sorts them by "Updated" timestamp descending instead of oldest-first by age.

## Steps to Reproduce
1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_pull_requests`.
2. Observe the PR rows shown.

## Expected Result
- Only open (and draft) PRs are displayed.
- Merged and closed PRs are excluded from this view.
- Rows are sorted ascending by PR age (oldest first).
- Each row shows: PR title, author, age (e.g. "10 days ago"), reviewer names, CI check status badge.

## Actual Result
- All PR statuses displayed: merged, closed, draft, open.
- Sort order is by "Updated" timestamp descending (most recently updated first).
- No age column — only "Updated" column.
- No reviewer names column visible.

## Screenshot
`screenshots/TC-RDV-065/tc-rdv-065-fail.png`

## Notes
- Stale PR threshold configuration (TC-RDV-066) is also absent from DevOps settings — no `stale_pr_threshold_days` field exists.
