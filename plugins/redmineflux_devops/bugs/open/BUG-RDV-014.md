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
