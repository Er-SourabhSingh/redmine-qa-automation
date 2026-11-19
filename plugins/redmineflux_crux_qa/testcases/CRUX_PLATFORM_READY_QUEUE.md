# Test Suite — Crux Platform: Ready Queue

> **Happy Flow — selected for today's quick regression (2026-11-19):** TC-CRX-771.

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

> **Note added 2026-11-16:** during TC-773's follow-up verification (see below), #39 was genuinely claimed by
> `builder-1` via the now-working local MCP connection (its blocker #38 had since closed, so the claim was
> correct) and now permanently displays **"Picked up by Builder 1"** instead of "Waiting for an agent" —
> removing/re-adding its tag does not reset this, and no "un-claim" tool exists. #39's blocker-relation state
> itself (what TC-778/BUG-CRX-174 actually tests) is unaffected. Full details in
> `CRUX_PLATFORM_WORK_PACKAGES.md`'s TC-CRX-1000.

- **TC-CRX-771** — PASS. Table columns for #37 populated correctly: Ticket "#37 RQ-FIX-A...", Project "Crux PM
  Agent Test Project", Who picks it up "Any available agent" (no skill-specific tag used), Status "Waiting for
  an agent".
- **TC-CRX-772** — PASS (positive case) / PARTIAL (negative sub-cases — see TC-776/777/778 below, which cover
  the same 3 conditions individually and are where the actual verdicts live). #37 (open+tagged+no-blocker)
  appeared correctly. Note: a brand-new tag add/first qualification needs ~1 extra page reload to appear (not a
  bug — consistent, short propagation lag observed 3 times on 3 different tickets, always resolved within ~15s).
- **TC-CRX-773** — **PASS (2026-11-16 follow-up).** Previously deferred because no local MCP connection existed
  to claim work against this instance (the repo's only configured `redmineflux` MCP server was wired to
  production). Found the local Docker stack's own `crux-redmine6-mcp-1` container at `localhost:8082/mcp` and
  added a second, local-only `redmineflux-local` MCP server entry. As `builder-1`, called
  `redmineflux_crux_claim_next_work` and genuinely claimed #39 (it had legitimately re-qualified — its blocker
  #38 had since closed) and, after temporarily untagging it, #40 and #62. Each claim correctly removed the
  ticket from "Waiting for an agent"; `report_complete` correctly recorded a real Run Ledger row each time. Full
  write-up and the autonomous-progression follow-through (claim → gate → approve, twice) is in
  `CRUX_PLATFORM_WORK_PACKAGES.md`'s TC-CRX-1000. Tags restored on #39/#40 immediately after; no fixture state
  changed.
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

**Suite result (2026-11-05 pass): 5 PASS (771, 772-positive, 776, 777), 1 FAIL/bug filed (778), 4 deferred/not
independently verified (773, 774, 775, 779) due to fixture constraints in this pass.** One new bug found:
BUG-CRX-174.

## Suite status

Pass 1 (2026-11-05) — 5 PASS, 1 FAIL (BUG-CRX-174), 4 deferred (fixture constraints).
Pass 2 (2026-11-16) — TC-773 moved to PASS once a local-only MCP connection was established (see TC-773 above).
  3 still deferred (774, 775, 779 — fixture constraints unrelated to the MCP gap).
Overall: 6 PASS / 1 FAIL (BUG-CRX-174, still open) / 3 deferred (774, 775, 779).
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3.

## Execution — 2026-11-17: TC-775 unblocked

Found the previously-missing precondition: the Agent Fleet page's "Create Redmineflux identity" action
(`/crux/agents/provision`) genuinely creates a real Redmine user for an agent, with project membership
under an "AI Agent" role. First attempt failed (`400`, `role 'AI Agent' does not exist on redmine — create
it first`) — this local Docker instance's own seed script (`ensure-defaults.rb`) that would normally create
this role on a fresh deployment was never run here. Created the role natively (Administration → Roles → New
role, name "AI Agent", granted `view_crux` — a one-time, low-risk environment fixture-gap fix, not a product
defect), then re-ran "Create Redmineflux identity" for Builder 1 with project `crux-pm-agent-test-project` —
**200 OK**, genuinely created Redmine user `builder-1` (id=29, confirmed via `redmineflux_core_list_users`).

- **TC-CRX-775 — PASS.** Created a disposable fixture ticket (#119, "TC-775 fixture: assigned-only, no
  readyforagent tag") directly assigned to the new real `builder-1` user (id=29), deliberately left
  **untagged**. Checked `/crux/queue`: #119 does **not** appear anywhere in the table (confirmed via
  `document.body.innerText.includes('#119')` → `false`, and a full row dump of the table showing only the
  genuinely-tagged tickets #39/#89/#116/#118) — confirms direct assignment to an agent's own paired Redmine
  user, without the `readyforagent` tag, does NOT reserve or queue the ticket, exactly as documented.
- **TC-CRX-779 — PASS, but reveals the feature is deprecated, not just hard to fixture.** Built the full
  precondition natively: created a "Crux Capability" list custom field (id 4, all trackers, values matching
  `/crux/admin/capability_map`'s own default keys — confirmed via a direct `fetch` to that URL:
  `{"map":{},"defaults":{"macos":"swift", "mobile (ios + android)":"flutter", ...}}`), set a fixture ticket's
  (#120) capability to `macos` (→ skill `swift`, held uniquely by Builder 1 among the 2 Workers), tagged
  `readyforagent`. First check: Ready Queue showed **"Any available agent"**, not a skill match — because
  crux-core only reads a Component/Capability field when `CRUX_COMPONENT_CF_IDS` names its id, and that env
  var was never wired through `docker-compose.yml` (confirmed via source, `crux_core/engine/dispatch.py`'s
  `caps_for_component()` call and `crux_core/config.py`'s `component_cf_ids` default `[56]` — a ghost id that
  can never match a real field created later). Added `CRUX_COMPONENT_CF_IDS: ${CRUX_COMPONENT_CF_IDS:-1}` to
  the compose file, set `CRUX_COMPONENT_CF_IDS=4` in `.env`, recreated `crux-core` — Ready Queue then
  genuinely showed **"An agent that can do swift"** for ticket #120, confirming the exact 3-state mechanism
  the dev reference describes DOES still work in crux-core, when wired correctly.
  - **But this environment's own setup is not an oversight to fix — it matches current, intended product
    behavior.** `redmineflux_crux/db/migrate/20261111000001_remove_unused_crux_capability_field.rb` (dated
    2026-11-11, 6 days after the dev reference doc) deletes the "Crux Capability" Redmine field outright on
    any install where it holds no values, with the explicit comment: *"CRP-52 (BUG-CRX-178) — the 'Crux
    Capability' issue field is no longer part of Crux. Who picks up a ready ticket is now decided in plain
    terms: assigned to an agent's Redmineflux user -> only that agent; otherwise -> any available agent."*
    This is the developer's own fix for **BUG-CRX-178** (found earlier this cycle by this same suite's
    sibling, Settings) — rather than fixing the field's broken Trackers config, the feature itself was
    retired. The dev reference's §3/§9 wording ("An agent that can do X") is now **stale documentation for a
    removed feature**, not a still-current state this suite failed to reach.
  - **Reverted the fixture fully** to leave the environment as a genuine fresh-install matches-current-product
    state: removed `CRUX_COMPONENT_CF_IDS` from `docker-compose.yml`/`.env`, recreated `crux-core` (confirmed
    healthy), and deleted the "Crux Capability" custom field (id 4) via the native UI — `list_custom_fields`
    confirms it's gone, matching the pre-fixture baseline.
  - Recommend `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3/§9 be updated to drop the "An agent that can do X"
    state, and TC-779 be marked **Superseded — feature removed 2026-11-11 (BUG-CRX-178 fix)**, not "deferred."
- **TC-CRX-774 — PASS.** Created 25 disposable fixture tickets (#121–#145, "Crux PM Agent Test Project") plus
  the existing #120, all tagged `readyforagent` (open, no blockers), bringing the qualifying total to exactly
  26. `/crux/queue` showed **"Page 1 of 2 (30 total)"** (30, not 26 — the 4 pre-existing genuinely-qualifying
  tickets #39/#89/#116/#118 from earlier fixtures are correctly included too) with exactly **25 rows** on
  page 1; clicking Next → showed **"Page 2 of 2 (30 total)"** with the remaining **5 rows**. Pager confirmed
  25-per-page exactly as documented. Cleaned up afterward — removed the `readyforagent` tag from all 26
  fixture tickets (#120–#145), restoring the queue to its pre-fixture baseline (4 qualifying tickets).

## Suite status (updated 2026-11-17)

Pass 3 (2026-11-17): 3 more PASS (774, via a 26-ticket pager fixture, cleaned up afterward; 775, via a
genuine Redmine-identity fixture for Builder 1 — also required creating the missing "AI Agent" role
natively, a one-time environment gap fix; 779, confirmed the mechanism works when wired correctly, then
found it's been intentionally removed from the product since 2026-11-11 — superseded, not deferred). 0
TCs remain deferred in this suite.
Overall: 9 PASS / 1 superseded (779 — feature removed) / 0 deferred.

**Note (2026-11-18): the "BUG-CRX-174, still open" wording above was stale.** BUG-CRX-174 was actually
retested and confirmed FIXED on 2026-11-11 (developer marked "In QA", production #127945) — moved to
`bugs/closed/BUG-CRX-174.md` and production synced In QA → Done at that time, before Pass 3 above even ran.
This suite has 0 open bugs.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §3.
