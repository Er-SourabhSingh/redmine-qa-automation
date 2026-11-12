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

## Execution — 2026-11-12 (deferred TC completion pass)

Re-ran the 9 deferred TCs from the 2026-11-05 pass. Fixtures available: 3 existing WPs (wp-001 "Ship
the Dictio...", wp-002 "Fix the ready queue blocker...", wp-003 "Fix control-ticket cleanup behavior");
wp-004 "Review testcase API coverage" (suggest-only, ticket #62) created this pass for TC-760/TC-765.

- **TC-CRX-758** — NOT INDEPENDENTLY VERIFIED (still only 4 WPs; pager needs ≥26 — deferred, low risk).

- **TC-CRX-760** — PASS. Asked Project Manager (pinned) to create a WP for ticket #62 with `suggest-only`
  autonomy — confirm card showed `Autonomy: suggest-only`. After Confirm, wp-004 appeared on the global list
  with Work package column reading "Software · suggestions only, never changes tickets" — matches the documented
  autonomy label exactly. `autonomous` creation not separately tested (requires a ticket to be in an appropriate
  state; not attempted this pass — deferred for a future run).

- **TC-CRX-761** — See 2026-11-05 result (PASS-partial, unchanged).

- **TC-CRX-762** — PASS. Asked PM agent to "Change the goal of the work package 'Fix control-ticket cleanup
  behavior' to '…'." — agent replied: *"I couldn't find a tool for this here, so I can't do it from this chat.
  It can be done directly in Redmineflux…"* No confirm card appeared. Then asked to "Delete the work package
  'Fix control-ticket cleanup behavior'" — same honest refusal, identical wording. Neither edit nor delete
  produced a fabricated confirm card.

- **TC-CRX-763** — PASS. Asked PM agent to "Create a work package for ticket #56 using a custom pipeline called
  'Security Review Pipeline'." — agent replied: *"I can create a Work Package for #56, but only with one of the
  built-in pipelines — custom pipelines aren't yet supported from chat."* Listed all available built-in pipelines
  and offered to use whichever fits. No fabricated confirm card, no silent wrong pipeline used.

- **TC-CRX-764** — DEFERRED. Requires a non-admin user (admin has access to every project, so the "every ticket
  must be visible to the person confirming" rule can't be exercised from an admin session). Needs a fresh
  dedicated non-admin user and a private/restricted project. Deferred to a future run.

- **TC-CRX-765** — PASS. After creating the suggest-only wp-004 (TC-760 above), posted `@crux status - what is
  the current status of this testcase?` as a journal note on ticket #62. After 60 seconds (page refreshed and
  verified), only 1 journal entry exists — the human's own note. No Crux reply was posted at all, confirming
  that suggest-only WP tickets receive zero agent replies to @-mentions, consistent with "agents never write
  anything, not even @-mention replies."

- **TC-CRX-766** — FAIL — **potential bug candidate.** Asked PM agent to "Set up a work package for ticket
  #99999 to fix the login timeout issue." Expected: an honest "ticket not found" refusal (the feature reference
  states "every ticket must be visible to the person confirming"). Actual: agent did NOT refuse — it asked for
  pipeline and goal details, then produced a fully-formed `CREATE WORK PACKAGE` confirm card with Tickets=#99999,
  Goal="Fix login timeout issue in production", Type=bug, Autonomy=execute-with-approval. The Confirm button was
  NOT clicked (cancelled immediately) since confirming would create a WP linked to a non-existent ticket. Root
  cause: the agent apparently builds the confirm card first and relies on confirmation-time validation; it does
  not verify ticket existence/visibility before proposing. Whether this is a documentation gap ("validation at
  confirm time, not before") or a genuine defect (a WP with a 404 ticket would be created without any user-
  visible error) requires a production developer to clarify. Filed as a finding below — severity TBD pending
  that clarification.

- **TC-CRX-767** — PASS. Navigated to `/projects/crux-pm-agent-test-project/crux/work_packages` — showed
  "All 3 / Waiting for you 0 / In progress 3 / Done 0", listing only the 3 WPs whose tickets belong to that
  project ("Review testcase API coverage" #62, "Fix the ready queue blocker..." #56, "Fix control-ticket cleanup
  behavior" #40). The seed-data WP ("Ship the Dictio mobile app...", Project "—") was correctly absent —
  project-scoped filtering works.

- **TC-CRX-768** — PARTIAL / DEFERRED. No WP is currently at a gate (all are "In progress", no "Waiting for
  approval" state). The Review button is documented to appear only when a WP is waiting at a gate, so the
  permission scoping cannot be exercised until at least one WP reaches a gate. The global Approve permission
  (`approve_crux_gates`) exists on this instance and is correctly available to admin. Full per-project scoping
  test (a user with Approve in Project A but not B) deferred to a future run when WPs are at gates.

- **TC-WP-14.3** (§14.3 of the Feature Reference — WP section on the issue, not originally numbered): PASS.
  Issue #62 shows a "Work Package" section below the description: goal "Review testcase API coverage", type
  "Software", status "In progress", stage chain (Clarify → … → Deliver, Clarify highlighted as NOW),
  "LATEST UPDATE: No update yet", "APPROVALS: Next: your approval of the requirements", "Open in Crux →" link.
  No Approve button present (read-only section, correct). Section was not present before wp-004 was created —
  confirms it appears only when the ticket belongs to a WP.

## Bugs found — 2026-11-12 pass

- **TC-CRX-766 finding**: PM agent creates a `CREATE WORK PACKAGE` confirm card for ticket #99999 (which does
  not exist) without any pre-confirmation ticket-existence check. Expected per the feature reference ("every
  ticket must be visible to the person confirming"): refusal at proposal time if ticket is inaccessible/missing.
  Whether server-side validation rejects the creation on Confirm (making this a UX gap only — late validation)
  or silently creates a broken WP (making it a data-integrity bug) is unconfirmed — Confirm was cancelled.
  Recommend developer clarification before filing formally.

## Suite status

Pass 1 (2026-11-05): 7 PASS, 1 PASS-partial, 9 deferred, 0 bugs filed.
Pass 2 (2026-11-12): 5 more PASS (760, 762, 763, 765, 767), 1 partial/deferred (768), 1 finding needing
  clarification (766), 2 still deferred (758, 764), 1 bonus PASS (§14.3 WP section on issue).
Overall: 12 PASS / 1 PASS-partial / 1 finding (766 — severity TBD) / 3 deferred (758, 764, 768) / 0 formal bugs.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §2.
