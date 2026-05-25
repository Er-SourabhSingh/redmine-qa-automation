# BUG-RDV-018 — Commit statistics route returns 404 — daily/weekly aggregation and top contributors not implemented

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-018 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-070, TC-RDV-071 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
The commit statistics page (`/projects/<id>/devops_commit_stats`) returns HTTP 404. No daily/weekly aggregation chart, time window selector, or top-10 contributors section exists in the plugin UI.

## Steps to Reproduce
1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_commit_stats`.
2. Observe the response.

## Expected Result
- A commit statistics page rendering a daily/weekly aggregation chart for the selected time window.
- A "Top Contributors" section listing top-10 authors by commit count, sorted descending.
- A time window selector (e.g. "Last 7 days", "Last 4 weeks").

## Actual Result
- HTTP 404 "Page not found" — route does not exist.
- The commits list page (`/devops_commits`) shows a flat table with no aggregation or stats.

## Screenshot
`screenshots/TC-RDV-070/tc-rdv-070-fail.png`

## Notes
- The `CommitStats` service is referenced in the spec (SCM-009 / rfd-106) but appears not to be implemented.
- TC-RDV-086 (weekly aggregation) is also blocked by this same missing route.
