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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §2.
