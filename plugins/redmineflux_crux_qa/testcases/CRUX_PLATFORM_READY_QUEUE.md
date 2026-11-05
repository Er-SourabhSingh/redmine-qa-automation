# Test Suite — Crux Platform: Ready Queue

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/queue`.
> TC range: TC-CRX-771 to TC-CRX-779.

## Fixtures needed

- The Flux tags plugin installed and enabled (required for the `readyforagent` tag mechanism).
- Tickets in each of these states: open+tagged+no-blocker (should appear), closed+tagged (should NOT appear),
  open+tagged+has-an-open-blocker (should NOT appear), open+not-tagged (should NOT appear).
- A ticket assigned directly to an agent's own paired Redmine user, both with and without the `readyforagent`
  tag, to test the "assignment alone isn't enough" rule.
- A worker-claimable ticket (if Builder 1/2 workers are configured) for the claim-mechanism check.

## Positive Cases

- **TC-CRX-771** — Table columns populate correctly: Ticket, Project, "Who picks it up" (assigned agent / "An
  agent that can do X" / "Any available agent", plus the autonomy line), Status ("Waiting for an agent" /
  "Picked up by <agent>").
- **TC-CRX-772** — A ticket appears only when ALL 3 conditions hold: open, tagged `readyforagent`, no open
  blockers — verify each condition's absence individually removes the ticket from the list (test the 3 negative
  fixtures from above one at a time).
- **TC-CRX-773** — Claimed state updates the Status column: once an agent (or worker) claims a queued ticket,
  confirm the row updates from "Waiting for an agent" to "Picked up by <agent>" without a page reload needed
  (or on next refresh, whichever the real behavior is).
- **TC-CRX-774** — Pager shows 25 per page (only testable with ≥26 qualifying tickets).

## Negative / Boundary Cases

- **TC-CRX-775** — Assigning to an agent's user alone does NOT reserve it: assign a ticket in Redmine's native UI
  directly to an agent's paired user, WITHOUT the `readyforagent` tag — confirm it does NOT appear in the Ready
  queue at all (the tag is required regardless of assignment).
- **TC-CRX-776** — Removing the tag removes the ticket live: tag a ticket `readyforagent` (appears in queue), then
  remove the tag — confirm it disappears from the queue.
- **TC-CRX-777** — Closing a queued ticket removes it: close a ticket that's currently in the ready queue —
  confirm it's removed (closed tickets never qualify, per the "it is open" condition).
- **TC-CRX-778** — Adding a blocker removes it, resolving the blocker restores it: tag a genuinely blocker-free
  ticket (appears in queue), add a real "blocked by" relation to a still-open issue (disappears from queue), then
  close the blocking issue (reappears in queue).
- **TC-CRX-779** — "Any available agent" vs. a named skill match: for a ticket whose required skill matches
  exactly one agent, confirm the "Who picks it up" column names that specific agent class ("An agent that can do
  X"), not a generic "Any available agent" — and for a ticket with no specific skill requirement, confirm it
  correctly shows "Any available agent" instead.

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3.
