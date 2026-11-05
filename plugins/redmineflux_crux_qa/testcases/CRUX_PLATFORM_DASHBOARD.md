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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §1.
