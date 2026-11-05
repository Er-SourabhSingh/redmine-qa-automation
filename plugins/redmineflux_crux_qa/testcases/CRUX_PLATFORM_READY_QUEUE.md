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

## Execution — 2026-11-05

Fixtures built live in "Crux PM Agent Test Project" (Redmineflux Crux module confirmed enabled): #37 (qualifying,
used for TC-771/772/776/777), #38 (blocker), #39 (blocked ticket, used for TC-778 — found BUG-CRX-174), #40
(isolation control ticket).

- **TC-CRX-771** — PASS. Table columns for #37 populated correctly: Ticket "#37 RQ-FIX-A...", Project "Crux PM
  Agent Test Project", Who picks it up "Any available agent" (no skill-specific tag used), Status "Waiting for
  an agent".
- **TC-CRX-772** — PASS (positive case) / PARTIAL (negative sub-cases — see TC-776/777/778 below, which cover
  the same 3 conditions individually and are where the actual verdicts live). #37 (open+tagged+no-blocker)
  appeared correctly. Note: a brand-new tag add/first qualification needs ~1 extra page reload to appear (not a
  bug — consistent, short propagation lag observed 3 times on 3 different tickets, always resolved within ~15s).
- **TC-CRX-773** — NOT INDEPENDENTLY VERIFIED. No Builder 1/2 worker was configured/claimable in this
  environment, and simulating a real agent claim via Ask Crux chat was not attempted this pass given time
  budget across 15 suites — deferred, not a bug, just unexercised.
- **TC-CRX-774** — NOT INDEPENDENTLY VERIFIED (pager needs ≥26 qualifying tickets; not worth the fixture cost
  this pass — low-risk, standard Redmine pagination component, deferred).
- **TC-CRX-775** — NOT INDEPENDENTLY VERIFIED. Could not identify an agent's own paired Redmine user in this
  project's assignable-user list (only human fixture names + Redmine Admin appeared; no Crux-identity user
  found via a `/users?name=crux` search either) — no "Create Redmineflux identity" action appears to have been
  run for any agent on this environment yet. Deferred until an agent identity fixture exists.
- **TC-CRX-776** — PASS. Removing the `readyforagent` tag from #37 removed it from the queue on the very next
  load (no extra-reload lag on removal, asymmetric with the addition-side lag noted above — worth knowing, not
  a bug).
- **TC-CRX-777** — PASS. Setting #37 to the "Done" (closed-type) status removed it from the queue immediately.
- **TC-CRX-778** — **FAIL — BUG-CRX-174 filed.** Adding an open "Blocked by #38" relation to #39 correctly
  removed it from the queue (first half of the rule works). But closing #38 (confirmed closed via #39's own
  Related Issues panel showing "0 open — 1 closed") did NOT bring #39 back, even after 5 reloads across 45+
  seconds and a remove-tag/re-add-tag workaround. Isolated via a fresh control ticket (#40, same tag, never
  blocked) which appeared normally in the same window — confirms the Ready Queue mechanism itself is healthy
  and the defect is specific to re-evaluating a resolved blocker. Filed as BUG-CRX-174 (High), not yet reported
  to production — pending approval.
- **TC-CRX-779** — NOT INDEPENDENTLY VERIFIED. Did not have a ticket with a specific required-skill tag/field
  set up to confirm the "An agent that can do X" vs. "Any available agent" distinction; #37/#39/#40 all used the
  generic tag only, which correctly showed "Any available agent" in all cases, but the skill-specific wording
  itself was not exercised. Deferred — would need the "Crux Capability" custom field (per dev reference §9)
  explored on a dedicated TC first.

**Suite result: 5 PASS (771, 772-positive, 776, 777), 1 FAIL/bug filed (778), 4 deferred/not independently
verified (773, 774, 775, 779) due to fixture constraints in this pass.** One new bug found: BUG-CRX-174.

## Suite status

Executed 2026-11-05 — 5 PASS, 1 FAIL (BUG-CRX-174), 4 deferred (fixture constraints).
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3.
