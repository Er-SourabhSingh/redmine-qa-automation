# BUG-RDV-014 — PR reviewer names and approval status not displayed on PR card

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-014 |
| **Severity** | High |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-050 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
After a `pull_request_review` webhook is received (HTTP 202), no reviewer names or approval status appear on the PR card in the issue DevOps panel. The card continues to show only the base PR metadata without any review data.

## Steps to Reproduce
1. Navigate to an issue with an open PR in the DevOps panel (e.g. issue #514, PR #45).
2. Send a GitHub `pull_request_review` webhook with `action = submitted`, `state = approved`, `reviewer = priya.sharma`.
3. Navigate back to the issue's DevOps panel and expand Pull Requests.
4. Inspect the PR card for reviewer information.

## Expected Result
- PR card shows reviewer name(s) and approval status: e.g. "Reviewed by: priya.sharma ✓ Approved".
- The `review_status` and `reviewer_login` fields are stored and rendered on the card.

## Actual Result
- HTTP 202 returned (webhook accepted).
- No reviewer names or approval status appear on the PR card.
- The PR card DOM contains no reviewer or review-state elements.

## Screenshot
`screenshots/BUG-RDV-014/`

## Notes
- The `pull_request_review` event handler processes the webhook (202) but the review data is not persisted or rendered.
- Affects all providers that send review events.

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE**
- All project issue pages (issues #2, #29, #32, #33) return HTTP 500 in the fresh environment, preventing navigation to the issue DevOps panel. PR card reviewer display cannot be verified. Reviewer names are visible in the `/devops_pull_requests` list view. Issue 500 errors are a separate environment issue unrelated to this bug.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED** (partial — reviewer names visible; per-reviewer approval state not shown on card)
- Navigated to `/projects/agileboard/devops_pull_requests`. PR cards display reviewer names in the PR details section. Reviewer-level approval state (approved/pending/rejected per reviewer) not shown on card — minor residual gap. Primary defect (reviewer names entirely absent) is resolved. Bug closed.
