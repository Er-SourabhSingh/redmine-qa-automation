# Bug Report Template

- Bug ID: BUG-CRX-018
- Production Redmine Issue ID: #120705
- Title: Allocation resize/date-update tools reject the exact ID the Workload Add Issue tool just returned — "workload_issue_id" is not a valid "allocation_id", with no working chat path to set hours on a newly-added issue
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Capacity Agent, Workload plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-16

## Steps to reproduce

1. Create a workload via chat (e.g. "Workload, create workload name 'Platform Engineering Sprint 1', team id 1, start date 2026-09-16, end date 2026-10-16, working hours per day 8.") — succeeds.
2. Add a real issue to that workload via chat (e.g. "Workload, add issue 9 to workload 1.") — succeeds, and the confirmation message reads: `✓ Issue added: #9 ... → Workload #1 (workload_issue_id: 1)`.
3. Using the exact ID the tool just gave ("1"), ask to resize the allocation's hours: "Workload, resize allocation 1 to 27.5 hours."
4. Observe the response.
5. Separately, try to set exact dates on the same allocation: "Workload, update the dates on allocation 1 to start 2026-09-20 and end 2026-09-25." (and a rephrased retry).

## Expected result

- Since the agent's own `Workload Add Issue` confirmation explicitly surfaces `workload_issue_id: 1` as the identifier for the just-created allocation, using that same "1" for a follow-up `Workload Allocation Resize` or `Workload Allocation Update Dates` call should succeed against the same record.
- A genuine failure response should never be prefixed with a "✓" success marker.
- An agent describing "current state" (e.g. Gantt read) must not fabricate a claim that contradicts the session's own prior, already-executed and already-confirmed action.

## Actual result

- Step 3 (resize) produced: `✓ Workload allocation #1 not found. Possible reasons: • The ID or identifier you provided does not exist • You don't have permission to see it (Redmine returns 404 for both cases) • The record was deleted...` — note the response is prefixed with the same "✓" checkmark used for genuine successes throughout this entire session, even though the underlying result is a 404/failure.
- The real, underlying allocation record DOES exist — independently confirmed on the real `/rf_teams/1/rf_workloads/1` page: the Issues panel shows issue #9 as "In Workload" with a live "Planned Hours" input (currently 0.00h) and a "Remove" button. So the allocation is real, but "1" (the exact ID the add-issue tool advertised) is not accepted by the resize tool as its ID.
- `workload_show` (workload 1) does not expose any allocation ID at all in its issues list, and the agent proactively acknowledged this gap when asked directly, offering to check the Gantt view instead.
- Following that offer ("Yes, please retrieve the Gantt timeline view..."), the request silently mis-routed to **"the Project Manager"** (further evidence for BUG-CRX-014, reproduced a third time on a read/lookup intent), which then falsely claimed: *"This suggests the allocation may not have been persisted, or the add-issue operation is still pending confirmation... You have a pending confirmation card for 'add issue 9 to workload 1'... Would you like to confirm that pending allocation now?"* — this is factually false: that exact write was already confirmed and had already returned a real success message (`✓ Issue added: #9 ... workload_issue_id: 1`) many turns earlier in the same session. The agent hallucinated a "pending confirmation" that does not exist, directly contradicting the session's own visible transcript.
- Step 5 (update dates) never even reached a confirm card — both the initial attempt and a rephrased retry produced the standard BUG-CRX-013 self-contradiction ("I described a change without actually proposing it..."), 2/2, with no successful retry found in this session.
- **Net effect**: there is currently no working chat path to set exact planned hours or exact dates on a newly-created allocation. `Workload Add Issue` succeeds, but its own advertised follow-up ID is rejected by the very next tool in the natural workflow, and the one available `list_*`-style workaround (workload_show / Gantt) either omits the ID entirely or mis-routes and then fabricates an incorrect explanation.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against the real `/rf_workloads/1` page (Issues panel, Planned Hours input showing 0.00h for issue #9) and the real Gantt chart (0.00h planned / 184.00h available for Redmine Admin).

### Console / log

```
C: Workload, add issue 9 to workload 1.
-> asking the Capacity Agent...
I'll do this (Workload Add Issue) -- confirm?
[confirmed] Issue added: #9 TC-CRX-090 Allocation Write Test Issue -> Workload #1 (workload_issue_id: 1)

C: Workload, resize allocation 1 to 27.5 hours.
-> asking the Capacity Agent...
I'll do this (Workload Allocation Resize) -- confirm?
[confirmed] Workload allocation #1 not found.
Possible reasons:
  - The ID or identifier you provided does not exist
  - You don't have permission to see it (Redmine returns 404 for both cases)
  - The record was deleted
Try: verify the ID with the corresponding list_* tool, or ask your administrator.

C: Workload, show me the full details of workload 1 including the allocation ID for issue 9.
-> asking the Capacity Agent...
[workload_show output -- Planned: 0.0h for issue #9, no allocation_id field anywhere]
Note: The workload_show response does not include allocation IDs in the issues list...
Would you like me to retrieve the Gantt timeline view, which may expose allocation IDs?

C: Yes, please retrieve the Gantt timeline view for workload 1's team to find the allocation ID.
-> asking the Project Manager...    [mis-routed -- no "Workload," prefix on this follow-up]
The Gantt view shows no allocations for Redmine Admin in workload 1, despite issue #9 being in the
workload. This suggests the allocation may not have been persisted, or the add-issue operation is
still pending confirmation... You have a pending confirmation card for "add issue 9 to workload 1"
... Would you like to confirm that pending allocation now?    [FALSE -- that write was already
confirmed and succeeded several turns earlier in this same session]

C: Workload, update the dates on allocation 1 to start 2026-09-20 and end 2026-09-25.
-> asking the Capacity Agent...
I described a change without actually proposing it, so there's nothing to confirm yet...

C: Workload, please set allocation ID 1's start date to 2026-09-20 and end date to 2026-09-25 now.
-> asking the Capacity Agent...
I described a change without actually proposing it, so there's nothing to confirm yet...
```

Real `/rf_teams/1/rf_workloads/1` page at time of investigation: Issues panel shows `#9 TC-CRX-090 Allocation Write Test Issue | Normal | In Workload`, Planned Hours input = `0.00`, with `data-issue-id="9"` (the UI itself keys the allocation by issue ID, not by any "allocation_id" ever exposed to the user) — confirming a real allocation record exists but remains at 0 hours because no chat path successfully resized it.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, BUG-CRX-013 (the self-contradiction reproduced again here for `update_dates`) and BUG-CRX-014 (the mis-routing reproduced again here for the Gantt lookup) — this bug's core, novel defect is the broken ID contract between `Workload Add Issue` and `Workload Allocation Resize`/`Update Dates`, compounded by a misleading "✓"-prefixed failure message and a hallucinated false claim about prior session state)

## 2026-09-16 retest — STILL REPRODUCES, not fixed

Not part of today's `CHANGES.md` — no Workload/Capacity agent or tool files were touched.

**Retest (exact original repro):** Created a fresh workload (#2 "Retest Sprint"), added issue #9 to it — confirmed `✓ Issue added: #9 ... → Workload #2 (workload_issue_id: 2)`. Using that exact ID, `Workload, please resize allocation ID 2 to exactly 27.5 hours now.` produced a real `Workload Allocation Resize` proposal (Allocation: 2, Planned Hours: 27.5). Confirmed it.

**Result:** `"✓ Workload allocation #2 not found. Possible reasons: • The ID or identifier you provided does not exist..."` — the exact same broken ID contract as the original bug, with the same misleading ✓-prefix on a genuine failure. (Also reproduced the BUG-CRX-013 self-contradiction as an intermediate step on the first phrasing attempt, consistent with that bug's own documented pattern.)

**Verdict: NOT FIXED.** No change needed to this bug's status; remains open.

## 2026-09-16 (continued) — supplementary evidence: same misleading "✓"-prefix defect confirmed on a completely different failure trigger

While building a live per-domain-agent permission matrix (no-permission/with-permission/admin), reproduced the same "✓" prefix on a genuine failure via an entirely different path than the ID-contract 404 above — this time a real Redmine **permission** refusal, not a not-found error:

- As `luna.blossom` (Manager role, does **not** have the Workload plugin's `manage_rf_teams` permission — confirmed via Administration → Roles → Permissions report), sent: `Capacity Agent, create a team called "Permission Matrix Test Team".`
- A real `Workload Team Create` proposal rendered with a genuine Confirm/Cancel button (expected — the pre-confirm stage has no permission check, consistent with the known `write_policy` gap this session already tracks separately for BUG-CRX-008).
- On Confirm, Redmine's real permission layer correctly refused the write: `"✓ Access denied: Requires 'manage_rf_teams' permission or admin. Ask your Redmine administrator to grant the Manage Workload role."` — screenshot confirms the "✓" renders in the same green success-styling used for real `✓ Created`/`✓ Issue added` messages throughout this engagement.
- No team was actually created (confirmed no new team appears in Workloads → Teams afterward) — this is a **display-only** defect, not a security bypass. The refusal itself is correct and honest; only its visual framing is wrong.

This confirms the "✓"-prefix-on-failure defect this bug already documents (see "Expected result" #2 above) is **not scoped to the specific allocation-resize/date-update 404 case** — it's a systemic rendering behavior applied to *any* Capacity Agent write-tool failure result, regardless of failure type (404-not-found here, permission-denied now). Not filed as a separate bug per this engagement's own retest-scope discipline (same root cause, same agent, same UI element) — folded in here as broader evidence of the same defect's real blast radius, which may matter for how the dev prioritizes/scopes the eventual fix (a rendering-layer fix, not a tool-specific one).

## 2026-09-17 (continued) — fourth confirmation, now on a THIRD domain agent (KB Agent) — a fourth failure type

While executing TC-CRX-052 (KB Agent permission-matrix probe): as `luna.blossom` (has `view_knowledgebase`, lacks `manage_knowledgebase_pages`), asked the KB Agent to create a page. Real proposal rendered with genuine Confirm/Cancel buttons (2 real `<button>` elements, DOM-verified). On Confirm, Redmine's real permission layer correctly refused the write — verified no page was actually created (Documentation space unchanged at "1 Pages · 0 Folders") — but the response was: `"✓ You do not have permission to manage knowledgebase pages. To fix this, ask your Redmine administrator to: Grant you the required role/permission for this action..."` — the same misleading "✓" prefix, now confirmed on a **fourth failure type** (a plain Redmine `permission?` check failure, distinct from the 404-not-found, admin-permission-denied, and 403-Forbidden types already documented above) and a **third domain agent** (KB Agent, alongside Capacity/Workload and Sales/CRM). Further confirms this is a shared rendering component applied unconditionally across the whole platform, not an agent- or failure-type-specific defect.

## 2026-09-17 (continued) — third confirmation, now on a DIFFERENT domain agent (Sales Agent/CRM) — this is a shared component, not per-agent

While testing TC-CRX-018 (CRM activity-deletion authorship rule): as `daisy.skye` (temp-granted CRM permissions, not the author of the target activity), asked the Sales Agent to delete an activity `luna.blossom` had logged. Real proposal rendered, confirmed. Real Redmine-layer refusal followed — correct behavior, the authorship rule held — but the response was: `"✓ Forbidden\nTo fix this, ask your Redmine administrator to: Grant you the required role/permission for this action..."` — the same misleading "✓" prefix, now confirmed on a **third** failure type (403 Forbidden) and a **second, entirely different domain agent** (Sales Agent, not Capacity Agent). This rules out an agent-specific or tool-specific root cause — it's almost certainly a shared frontend/backend rendering component used by every domain agent's write-confirm flow, unconditionally prefixing the outcome text with "✓" regardless of whether `execute()` returned success or an error. Worth flagging to the dev as a single shared-component fix rather than something to chase agent-by-agent.

## 2026-09-17 (continued) — fifth confirmation, now on a FOURTH domain agent (Scrum Agent/Agile)

While executing TC-CRX-009 (Scrum Agent permission-matrix probe, core `Edit issues` gate): as `daisy.skye` (temp-granted `use_ask_crux` + `view_agile_board` only, still lacking `Edit issues`), asked the Scrum Agent to move a card. Real proposal rendered with genuine Confirm/Cancel buttons. On Confirm, Redmine's real core permission layer correctly refused the write — verified no move actually happened (board unchanged: New still 14, In Progress still 0) — but the response was: `"✓ You do not have permission to edit this issue. To fix this, ask your Redmine administrator to: Grant you the required role/permission for this action..."` — the same misleading "✓" prefix, now confirmed on a **fourth domain agent** (Scrum/Agile, alongside Capacity/Workload, Sales/CRM, and KB). Further confirms this is a shared, systemic rendering component, not scoped to any specific agent or plugin domain.

## 2026-09-25 first retest attempt — false negative, see correction below

Reused the existing "Retest Sprint" workload fixture (workload #2, team "Retest Squad") from the 2026-09-16 retest. Asked: "Workload, please resize allocation ID 2 to exactly 27.5 hours now." → real `Workload Allocation Resize` proposal rendered (Allocation: 2, Planned Hours: 27.5, real Confirm/Cancel buttons). Confirmed it.

**Result:** `"✓ Allocation not found (If you expected this workload allocation #2 to exist, verify the ID with the corresponding list_* tool.)"` — reloaded `/rf_teams/2/rf_workloads/2`: Planned Hours still reads **0h**, unchanged.

**This was a testing-methodology error, not a real repro.** Reading the production issue's dev journal (#120705) afterward revealed the actual fix: `add_issue`'s `workload_issue_id` was never meant to be used for resize — the real allocation only gets created *lazily* via `update_planned_hours`, which now returns the genuine `allocation_id`. "2" (the stale `workload_issue_id` from the original 2026-09-16 fixture) was never a valid allocation ID under the fixed workflow either — this retest used the wrong ID source, not the dev's actual fixed path. See the corrected retest immediately below.

## 2026-09-25 corrected retest — FIXED, live-confirmed

Same fixture (workload #2, issue #9, still 0h planned at this point). Followed the dev's actual fixed workflow this time:

1. "Workload, show me the full details of workload 2 including allocations for its issues." → confirmed no allocation exists yet (0.0h planned, "no allocations assigned yet").
2. "Workload, set planned hours for issue 9 to 27.5 hours for Crux Manager in workload 2." → real `Workload Update Planned Hours` proposal (Workload 2, Issue 9, Workload User 3, Planned Hours 27.5). Confirmed.
3. **Result:** `"✓ Planned hours updated (allocation_id: 1)"` — a real, genuine allocation ID (1), distinct from the old `workload_issue_id` (2) that never worked. Verified against the real page: Planned Hours went from 0h → **28h** (27.5 rounded), Gantt chart shows Crux Manager at 27.50h with issue #9 attached to that row.
4. Using the **real** ID: "Workload, resize allocation 1 to 35 hours." → hit the pre-existing, separately-tracked BUG-CRX-013 self-contradiction fallback twice ("I described a change without actually proposing it") — not this bug's defect, a known adjacent pattern. Third rephrasing ("Workload, propose a resize of allocation ID 1 to 35 hours and show me a confirm card for it.") produced a real proposal (Allocation: 1, Planned Hours: 35). Confirmed.
5. **Result:** `"✓ Allocation resized"` — no 404, no misleading checkmark-on-failure. Verified against the real page: Planned Hours genuinely changed **28h → 35h**.

**Verdict: FIXED, live-confirmed.** The ID-contract defect (the core, novel defect this bug reports) is resolved — `update_planned_hours` now returns a real, working `allocation_id` that `resize` correctly accepts. Ready to close pending user approval (production sync required).

## Production report

Reported to production as issue **#120705** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Found via TC-CRX-090 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`) — testcase marked Failed.
