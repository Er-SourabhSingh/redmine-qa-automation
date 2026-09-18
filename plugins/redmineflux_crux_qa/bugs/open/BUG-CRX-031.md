# Bug Report Template

- Bug ID: BUG-CRX-031
- Production Redmine Issue ID: #120785
- Title: Scrum Agent's `move_issue` resolves a real, named board column ("Rejected") to the wrong underlying status, inconsistently, on every attempt
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Scrum Agent, Agile plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-17

## Steps to reproduce

1. Confirm the real Agile Board for project crux-qa has a distinct "REJECTED" column, separate from "CLOSED" (both visible on `/projects/crux-qa/agile_board`, each with its own issue count).
2. Ask the Scrum Agent: "Scrum Agent, move card #10 to Rejected." → observe the resulting write proposal's target status.
3. Cancel it, then ask again with slightly different wording: "Scrum Agent, move card #10 to the Rejected column." → observe the resulting write proposal's target status again.

## Expected result

Since the real Agile Board (confirmed via the native UI and via the Scrum Agent's own `get_board` response moments earlier in the same session) has a real, distinct "Rejected" column, asking to move a card there should resolve to the actual underlying Redmine status backing that column, consistently, every time.

## Actual result

Two consecutive attempts to move the same card (#10) to the same named column ("Rejected") produced two different, and both wrong, target statuses:

- Attempt 1: `"Proposal: Agile Move Issue ... Status: Closed"` — resolved to "Closed" instead of "Rejected" (two different, both real, columns on the same board).
- Attempt 2 (same card, same request, reworded): `"Proposal: Agile Move Issue ... Status: Waiting for Customer Response"` — a status that does not even appear as a column on this board at all (confirmed via the real board's 6 visible columns: New, In Progress, Resolved, Feedback, Closed, Rejected).

Both proposals were cancelled before confirming, to avoid corrupting the fixture card's real status with either wrong value. This is a genuine resolution defect (not a hallucinated response — a real `Agile Move Issue` write tool card rendered each time with a real, but wrong, status target) — the agent cannot reliably map the board's own real, visible "Rejected" column name to its correct backing status ID, and produces a different wrong answer on each attempt, suggesting it may be guessing/matching against an unrelated status list (e.g. a name-similarity match, or list_statuses' global status list, rather than the project's actual configured Agile Board columns).

## Evidence

### Screenshot

Not captured — evidence via live chat transcript text, cross-checked against the real Agile Board UI (`/projects/crux-qa/agile_board`, showing 6 real columns including a distinct "REJECTED" column with its own count) and `redmineflux_core_list_statuses` (showing this Redmine instance's real global status list, which does not even include "Closed", "Rejected", "Resolved", or "Feedback" as literal status names — meaning the Agile Board plugin's column labels are its own display-layer construct, and the Scrum Agent is failing to translate a column label back to the correct real status/ID both times).

### Console / log

```
C: Scrum Agent, show me the board for crux-qa.
-> asking the Scrum Agent...
[Real board: New(14), In Progress(0), Resolved(0), Feedback(0), Closed(1), Rejected(0) -- 6 real columns]

C: Scrum Agent, move card #10 to Rejected.
-> asking the Scrum Agent...
I'll do this (Agile Move Issue) -- confirm?
WRITE: Agile Move Issue | Project: Crux QA | Issue: 10 | Status: Closed
[Cancelled -- wrong status, would have corrupted the fixture]

C: Scrum Agent, move card #10 to the Rejected column.
-> asking the Scrum Agent...
I'll do this (Agile Move Issue) -- confirm?
WRITE: Agile Move Issue | Project: Crux QA | Issue: 10 | Status: Waiting for Customer Response
[Cancelled -- wrong status again, and "Waiting for Customer Response" isn't even a real column on this board]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Related in spirit to BUG-CRX-021 (wrong project ID resolution) and BUG-CRX-019 (unrecognized username silently resolved to user ID 0) — a recurring class of "the agent resolves a named entity to the wrong internal ID/value" defects, now confirmed a fourth time, on the Scrum Agent's status-name resolution specifically. Not folded into either of those (different agent, different entity type — status names, not project IDs or usernames).

## Production report

Reported to production as issue **#120785** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-17. Textile description, no attachments (per §4.3a policy).
