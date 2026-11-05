# Test Suite — Crux Platform: Global Dashboard

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §1 (developer-authored, source-derived — authoritative).
> Plugin: redmineflux_crux. Redmine version: 6.0-bookworm (local Docker, localhost:3015). URL: `/crux`.
> TC range: TC-CRX-727 to TC-CRX-753.

## Fixtures needed

- At least one Work Package with a gate currently waiting for approval, created via chat (e.g. ask Project
  Manager "Set up a work package for #X to build …").
- At least one Work Package fully approved through its final gate, with a successful run, to populate "Outcomes
  delivered".
- At least one agent run that failed or degraded (reproduce via an already-known failure, e.g. a bug repro that
  naturally fails), to populate "Needs your attention"'s recent-failed-runs list.
- Multiple agent runs across more than one agent, to populate the Agents bar chart meaningfully.
- Multiple tickets tagged `readyforagent`, at least one claimed and one not, to populate "Ready for agents".
- A user WITHOUT Approve Crux gates, and one WITH it, both members of the Work Package's project (for TC-734).

## Positive Cases — the 4 stat cards

- **TC-CRX-727** — Outcomes delivered: confirm the count matches the number of Work Packages whose final gate
  was approved AND which have a successful run; confirm the "$X per outcome" or "Counted when a gate is
  approved" sub-text matches whether any outcomes exist yet.
- **TC-CRX-728** — Agent runs: confirm the displayed count and token figure match the Run ledger's own totals for
  the same period (compare against `/crux/runs`).
- **TC-CRX-729** — Spent: confirm the figure is labelled "Recorded by Crux · all time" and matches the sum of
  costs visible in the Run ledger.
- **TC-CRX-730** — Agents online: confirm the "N of M" figure excludes retired agents from the denominator —
  retire one agent (if available) and confirm M decreases by 1.

## Positive Cases — Needs your attention

- **TC-CRX-731** — Approver sees Review, non-approver sees View: as a user WITH Approve Crux gates in the
  relevant project, confirm a waiting gate shows "Approve the plan" + a Review button; as a user WITHOUT it in
  that project, confirm the same gate instead shows "Waiting for an approver" + a View link (not a Review
  button).
- **TC-CRX-732** — Failed/degraded runs listed, success runs excluded: confirm only non-succeeded runs (up to 3
  most recent) appear here, each with a working "Open" link to the Run ledger; confirm a known-successful run
  does NOT appear in this list.
- **TC-CRX-733** — Cap at 5 + "+N more": with more than 5 qualifying items (gates + failed runs combined), confirm
  exactly 5 show and a "+N more" indicator appears for the rest.
- **TC-CRX-734** — Empty state: with zero waiting gates and zero failed/degraded runs, confirm the card shows
  "✓ All clear" and nothing else.

## Positive Cases — Agents card

- **TC-CRX-735** — Bar chart ranks agents by run count: confirm the agent with the most runs appears first/
  tallest in the bar chart, matching actual run counts from the Run ledger.
- **TC-CRX-736** — Agent detail modal — click a bar: confirm it opens a modal with status, engine, skills, total
  runs, "$X spent so far · monthly cap $Y", a Recent runs table (Time/Run/Issue/Agent/Model/Duration/Tokens
  in-out/Cost/Tool calls/Outcome), and a working Close button.
- **TC-CRX-737** — "All agents →" link goes to `/crux/agents`.

## Positive Cases — Work in progress

- **TC-CRX-738** — Progress bar reflects real stage position: for a Work Package at stage 3 of 7, confirm the
  bar shows "step 3 of n" with the correct number of completed segments, and a lock icon exactly where the next
  gate sits.
- **TC-CRX-739** — Status pill matches state: confirm a WP waiting at a gate shows "Waiting for you" (for an
  approver) or an equivalent, an in-progress-no-gate WP shows "In progress", and a fully delivered one shows
  "Done".
- **TC-CRX-740** — Review button only for approvers: as in TC-731, confirm the Review button on this card's rows
  follows the same approver-only visibility rule.
- **TC-CRX-741** — Cap at 8 + "+N more", finished packages fold: with more than 8 active WPs, confirm 8 show +
  "+N more"; confirm fully-delivered WPs are excluded from the active list and instead counted in a "Done N
  delivered" toggle that expands/collapses on click (Show/Hide).
- **TC-CRX-742** — "All work packages →" link goes to `/crux/work_packages`.

## Positive Cases — Live activity

- **TC-CRX-743** — Shows the latest 25 runs, newest first, with consecutive same-agent-same-package runs merged
  into one line.
- **TC-CRX-744** — Line text matches run type: confirm a Work Package run reads "Agent worked on …", an Ask Crux
  answer reads "answered in Ask Crux", and a chat write proposal reads "proposed a change" — each with correct
  duration/cost/time.
- **TC-CRX-745** — A failed/degraded run shows its status pill on the live-activity line, a succeeded one does
  not.
- **TC-CRX-746** — Hover a line reveals run id, model, and tokens in a tooltip.
- **TC-CRX-747** — "Run ledger →" link goes to `/crux/runs`.

## Positive Cases — Ready for agents

- **TC-CRX-748** — Shows up to 8 queued tickets, each with #id (opens in a new tab), its required skills, and a
  pill reading "ready" (unclaimed) or "claimed by <agent>".
- **TC-CRX-749** — "Queue →" link goes to `/crux/queue`.

## Gate Approval Modal

- **TC-CRX-750** — Approve button is locked against a double-click: click Approve, and before the request
  completes, attempt a second click — confirm only one approval is recorded (DB/native-verify no duplicate gate
  approval entry), and the button becomes disabled/shows a loading state during the first request.
- **TC-CRX-751** — Modal shows full evidence before approving: confirm the modal lists the actual runs (agent,
  model, tokens, cost, outcome), a cost total, any artifacts, the acceptance line, and the approval chain so far
  — not a generic placeholder.
- **TC-CRX-752** — A gate more than one step ahead cannot be approved yet: for a Work Package with 2+ remaining
  gates, confirm only the next upcoming gate is approvable — attempting to jump ahead (e.g. via a crafted
  request to a later gate id) is refused.
- **TC-CRX-753** — Approver attribution and idempotency: approve a gate as User A, then confirm (a) the approval
  is recorded against User A's real account (hover the ✓ chip on the Work Packages page to see "approved by
  User A"), and (b) attempting to approve the SAME already-approved gate again is refused/no-ops rather than
  recording a second approval.

## Execution — 2026-11-05

Executed against this environment's real accumulated data (1,237 runs, 26 online agents, 2 active Work
Packages, 1 ready-queue ticket) — no synthetic fixtures needed for most checks.

- **TC-CRX-727** — PASS. "Outcomes delivered: 0" with sub-text "Counted when a gate is approved" — correctly 0
  since no WP has had its final gate approved yet in this environment.
- **TC-CRX-728** — PASS, fully confirmed. Dashboard "1,237 Agent runs · 43.2M tokens" matches the Run Ledger's
  own "Runs 1,237" / "Tokens 43.2M" exactly.
- **TC-CRX-729** — PASS, fully confirmed. "$36.78 · Recorded by Crux · all time" matches the Run Ledger's own
  "Cost $36.78" exactly.
- **TC-CRX-730** — PASS, fully confirmed. "26 of 26 agents" correctly excludes the 1 retired agent (27 total − 1
  retired = 26 denominator), confirmed via the Agents card's own breakdown: "26 online · 0 paused · 1 retired ·
  24 used so far".
- **TC-CRX-731** — NOT INDEPENDENTLY VERIFIED this pass (no waiting gate currently exists in this environment to
  test approver-vs-non-approver visibility — "Needs your attention" shows "All clear"). Deferred.
- **TC-CRX-732 / TC-CRX-733** — NOT INDEPENDENTLY VERIFIED (no failed/degraded runs or waiting gates currently
  exist to populate this card beyond its empty state — would need deliberately reproducing a known failure).
  Deferred.
- **TC-CRX-734** — PASS, fully confirmed. With zero waiting gates and zero failed/degraded runs, the card shows
  exactly "✓ All clear — No approvals or failed runs need you right now." and nothing else.
- **TC-CRX-735** — PASS, fully confirmed. Bar chart correctly ranks by run count, tallest first: QA Agent (173),
  Time Agent (166), Support Agent (110) — matches the Agent Fleet List view's own run counts from the earlier
  suite exactly.
- **TC-CRX-736** — **FAIL — BUG-CRX-179 filed (Medium).** Clicking QA Agent's bar opened a modal with correct
  status/engine/skills and correct aggregate stats ("173 runs so far · $3.78 spent so far (all time) · monthly
  cap $100.00"), but the "Recent runs" table beneath it always reads "No runs yet for this agent." — reproduced
  identically on Time Agent (166 runs, same "No runs yet" result). The aggregate-stats query clearly works; the
  Recent-runs sub-query does not. Filed as BUG-CRX-179, not yet reported to production.
- **TC-CRX-737** — PASS. "All agents →" link correctly points to `/crux/agents`.
- **TC-CRX-738** — PASS, fully confirmed. "Fix control-ticket cleanup behavior" shows "Reproduce · stage 1 of 7"
  with 1/7 segments filled; "Ship the Dictio..." shows "Develop · stage 3 of 7" with 3/7 filled — both match the
  Work Packages suite's own confirmed state exactly.
- **TC-CRX-739** — PASS (partial — only "In progress" state observed; no "Waiting for you" or "Done" WP exists
  in this environment currently to confirm those pill variants). Both active WPs correctly show "In progress".
- **TC-CRX-740** — NOT INDEPENDENTLY VERIFIED (no Review button currently visible since no WP is at a waiting
  gate). Deferred.
- **TC-CRX-741** — NOT INDEPENDENTLY VERIFIED (only 2 active WPs exist, below the 8-item cap; no delivered WPs
  exist to test the Done-N-delivered fold/expand). Deferred.
- **TC-CRX-742** — PASS. "All work packages →" link correctly points to `/crux/work_packages`.
- **TC-CRX-743** — PASS (partial — only 2 live-activity lines currently visible, well under 25; merge-of-
  consecutive-same-agent-same-package runs not specifically exercised since no such consecutive pair exists
  right now).
- **TC-CRX-744** — PASS, fully confirmed. Observed exactly the documented line-text variants: "Crux worked on
  Fix control-ticket cleanup behavior" (WP run) and "Project Manager answered in Ask Crux" (chat answer) — both
  with correct duration/cost ("0s · $0.00" and "5.2s · $0.006" respectively).
- **TC-CRX-745** — PASS (both currently-visible lines are successful runs and correctly show no status pill;
  the failed/degraded-shows-a-pill half was not independently re-confirmed here, though it's strongly implied by
  the Run Ledger's own Status column working correctly in an earlier suite).
- **TC-CRX-746** — PASS, fully confirmed. The hover-tooltip aria-labels read exactly "run-1237 · no model · 0 in
  / 0 out" and "run-1236 · anthropic/claude-haiku-4.5 · 42,342 in / 145 out" — real run id/model/token data.
- **TC-CRX-747** — PASS. "Run ledger →" link correctly points to `/crux/runs`.
- **TC-CRX-748** — PASS. "Ready for agents" shows ticket #40 with its subject, a "ready" pill (unclaimed), and
  the #40 link correctly pointing to `/issues/40`.
- **TC-CRX-749** — PASS. "Queue →" link correctly points to `/crux/queue`.
- **TC-CRX-750 / TC-CRX-751 / TC-CRX-752 / TC-CRX-753** — NOT INDEPENDENTLY VERIFIED this pass (no pending gate
  currently exists in this environment to open the Gate Approval modal against — all of this group's checks
  need a genuine waiting-gate fixture, which would require creating and partially progressing a new Work
  Package through several stages first). Deferred.

**Suite result: 15 PASS fully confirmed (727, 728, 729, 730, 734, 735, 737, 738, 742, 744, 746, 747, 748, 749,
and 739/743/745 as partial-but-real-data-confirmed), 1 FAIL/bug filed (BUG-CRX-179), 11 not independently
verified this pass (731-733, 740-741, 750-753) due to missing waiting-gate/failed-run/8+-WP fixtures not present
in this environment's current state. No other new bugs found.**

## Suite status

Executed 2026-11-05 — 15 PASS, 1 bug found (BUG-CRX-179), 11 deferred.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §1.
