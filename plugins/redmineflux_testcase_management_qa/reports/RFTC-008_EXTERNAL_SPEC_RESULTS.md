# rftc-008 (#121875) — Execution Results

> Companion to `testcases/RFTC-008_EXTERNAL_SPEC_DEFECT_EXECUTION_LINKING.md`. Same external-source warning
> applies — this is production feature #121875, not part of this plugin's own `TC-TCM-xxx` suites or the
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md` 202-case cycle.

**Executed:** 2026-10-06, Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`).
**Scope:** 1 production feature ticket, tested at the user's explicit request after the standard V1 cycle
completed, cross-referenced against its own spec document in the product repo.

> **UPDATE 2026-10-08 — both findings below are now RESOLVED.** See "Retest — 2026-10-08" section at the bottom.
> The numbers immediately below (2/3 FAIL, release-blocking) reflect the **2026-10-06 state only** and are kept
> for history; they no longer describe the current build.

## Summary (as of 2026-10-06 — superseded, see retest)

| Category | Result |
|---|---|
| Core functional (many-to-one, bulk all-or-nothing, unlink, legacy-path reconcile, reverse view) | **9/9 PASS** |
| Permission / security (SACRED invariants: anon, no-perm, cross-project, not-visible, read-visibility, IDOR re-scope) | **6/6 PASS** |
| Edge cases (empty batch, self-link, SQL-injection-shaped input, oversize batch, cascade destroy) | **4/4 PASS** |
| UI integration | **2/3 FAIL** — see Findings |

**Total: 20/22 cases PASS; 2 FAIL (both folded into one bug, BUG-TCM-044).**

## Findings (2026-10-06 — both since fixed, see retest)

| Case | Verdict | Bug |
|---|---|---|
| RFTC008-UI2 (Link defect picker + bulk-link action) | **FAIL** → **FIXED 2026-10-08** | **BUG-TCM-044** (Critical, Done) — the entire forward-facing UI for this feature was never wired into the Run execution view; API-only at the time. Resolved not by adding the originally-requested Run-view picker, but by consolidating all linking into Add Result (confirmed working in retest). |
| RFTC008-UI3 (per-execution "Defect ID's" column) | **FAIL** (folded into BUG-TCM-044) → **FIXED 2026-10-08** | Column now renders correctly in the Run grid (comma-separated, verified in retest) |
| RFTC008-F3b (permission denial message) | PASS (functionally), note | **BUG-TCM-045** (Low, Done) — correct 403, but reused a misleading error string from a different check |

## Bottom line (2026-10-06 assessment — superseded)

The backend is thoroughly solid — every security invariant (SACRED row) in the spec holds, the central design
decision (legacy-write-path reconciliation, CRIT-1) is proven correct with real production data from earlier in
the same session, and the many-to-one core claim is directly verified. **But the feature as shipped has no
usable UI** — a QA engineer or developer cannot actually use it without calling the JSON API by hand. Given this
is INECO's #1-ranked customer request and ships imminently (target version 7.1.0), BUG-TCM-044 is
release-blocking as currently shipped.

**Production report:** Both bugs reported — #122104 (BUG-TCM-044), #122105 (BUG-TCM-045) — assigned Vaishnavi
Bhawsar, target version "Testcase Management plugin Release 7.1.0".

## Retest — 2026-10-08

**Environment:** `https://flux-fvqoa5yw149.forge.zehntech.com/` (Testcase Management Project, plugin v7.1.0), via
Playwright-driven browser, real UI flow (Testcase detail page → Testcase Execution → Add Result / Related Issues)
— not direct API/URL calls.

Per the developer's own note on #121875 (2026-10-08), the original UI gap was closed by a deliberate redesign:
*"Added a 'Link existing defect' bulk-action box + an unlink control directly on the run execution view —
later simplified: removed the separate reverse 'linked executions' panel in favor of Add Result as the one place
to link."* This retest verifies that consolidated design actually works end-to-end:

| Check | Result |
|---|---|
| Add Result's Defect field saves **multiple** picked defects (not just one) | **PASS** |
| Defects search finds an existing defect already linked to a **different, sibling** test case (whole-project search, not scoped to current test case) | **PASS** |
| Run grid displays multiple linked defects **comma-separated** | **PASS** |
| Run's Defect Count does **not** double-count the same defect linked across two test cases | **PASS** |
| Unlink via the issue detail page's "Related issues" → "Delete relation" removes the relation **cleanly** (no phantom link left in the Run grid) | **PASS** |

**Revised bottom line:** BUG-TCM-044 and BUG-TCM-045 are both fixed and confirmed working via the real UI (not
just the API). The original "no usable UI" / release-blocking assessment from 2026-10-06 no longer applies.
Full detail posted to #121875's production journal (2026-10-08 entry).

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0 (master, post-7.2.0 version bump + today's Redmine 7.0
Docker compat work). Scope: confirm the core many-to-one linking feature still holds after real intervening
code churn, not a full re-walk of all 22 original cases.

Relevant commit since last execution: `ad6437c` "Fix cross-project data leak in the run execution test-cases
API" (2026-10-21) — touches the same `RunsController`/run-execution-grid code path this feature's UI lives on.
That fix was independently found and retested as **BUG-TCM-086** (confirmed FIXED 2026-10-22, see
`bugs/closed/BUG-TCM-086.md`) during the plugin's own TC-TCM-NNN suite regression — not re-litigated here.

**Live spot-check performed this pass:** `GET /runs/83?project_id=rftc-016-ci-qa` — the run grid's "Defect ID's"
column and the run header's "Linked defects (1): 3642" both render correctly, exactly the shape BUG-TCM-044's fix
established. **PASS**, feature still works end-to-end on the current build.

**Verdict:** No regression. The one commit touching this feature's code path was already found, fixed, and
retested via BUG-TCM-086; this session's own live check confirms the display layer is unaffected.

## Full Re-Execution — 2026-10-24 (continued, same day) — all 23 cases literally re-run, not risk-based

Per explicit user follow-up ("sare testcase test kro dobara... ye feature still working he na"), every one of this
file's 23 cases was individually re-driven live against `localhost:3000` (project `alpha-web`, id=5) this pass —
API cases via `curl` with real API keys (`qa.manager`, `qa.engineer`, `reporter`, `qa.limited`, admin), UI cases
via Playwright. Real executions/defects used throughout (IDs 6397, 6060, 6056, 6074, 6075, 6418, 6462, 6463;
defects 3664/3665/3683), not synthetic placeholders.

| Case | Fresh result |
|---|---|
| F1 (link single) | **PASS** — unlinked exec 6397 first (clean slate), re-linked to defect 3665: `201`, `defect_ids` recomputed to `3665`, `IssueRelation` created |
| F2 (bulk-link same defect) | **PASS** — linked 6074 (Failed) + 6075 (Blocked) to the same defect: `201`, reverse view lists all linked executions across 2 runs |
| F4 (all-or-nothing) | **PASS** — batch with 1 valid (6060) + 1 Passed (6056): `422`, DB-confirmed the valid one was NOT committed either |
| F5 (duplicate no-op) | **PASS** — re-linking 6397→3665 returned the same `link_id: 112`, no second row |
| F6 (reject Passed) | **PASS** — linking 6056 (Passed) alone: `422` |
| F7 (unlink) | **PASS** — unlinked 6397 from 3665: `200`, confirmed clean |
| F10 (bulk_create legacy path) | **PASS** — `bulk_create` with `defect_ids` on a fresh result (issue 3660, run 104): join row + `IssueRelation` both auto-created |
| F11 (reverse view, indexed join) | **PASS** — `GET /defects/3665/executions.json` correctly lists all linked executions with full context |
| F14 (report_defect, different controller) | **PASS** — `POST /testcase_mcp/report_defect.json` created defect #3683 and it appeared in `/defects/3683/executions.json` immediately, zero extra action |
| F3a (anonymous) | **PASS** — no credentials: `401` |
| F3b (no `:execute_testcase`) | **PASS** — as `reporter`: `403`, and the error message is now correctly **"You do not have permission to link defects in this project"** (BUG-TCM-045's fix re-confirmed — no longer the misleading "not the assignee" text) |
| F8 (IDOR, cross-project execution) | **PASS** — foreign execution id: `422` "Execution not found in this project" |
| F9 (defect not visible) | **PASS** — cross-project `defect_issue_id`: `422` "defect issue was not found, is not visible to you, or is in another project" |
| F12 (reverse view visibility) | **PASS** — as `qa.limited` (not a member of `alpha-web`): `403` "Unauthorized access", zero data |
| F15 (project-move leak) | **PASS** — moved defect 3665 to project 2 temporarily: reverse view returned `executions: []` (stale-project rows dropped); restored to project 5 immediately after |
| Edge1 (empty ids) | **PASS** — `422` "No executions selected" |
| Edge4 (self-link) | **PASS** — `422` "A test case cannot be linked as its own defect" |
| Edge5 (SQLi-shaped) | **PASS** — `422`, safely coerced, no injection |
| Edge9 (501-id batch) | **PASS** — `422` "Too many executions in one request (maximum is 500)" |
| U7/U17 (destroy with join) | **PASS** — destroyed execution 6418 (had a join to defect 3674, no sibling link): no FK error, join cascaded, `IssueRelation` removed |
| UI1 (reverse panel on defect issue page) | **SUPERSEDED, not a fail.** The panel is **gone** — confirmed via `git log`: commit `c4abf28` ("Simplify defect display: just the ID in the run grid, no reverse panel on the defect"), dated **2026-10-06, the same day as this file's original test run** — the view-hook comment itself states *"the 'Linked Test Executions' reverse panel on a defect's own issue page is removed by product decision — the Run execution grid's own Defect ID's column (and Add Result) are the one place this relationship is shown."* Live-confirmed `/issues/3683` has no such panel anywhere on the page. This is a deliberate, same-day architecture simplification the original 2026-10-06 PASS predates, not a regression. |
| UI2 (Link defect picker + bulk-link in Run view) | **PASS** — opened the real "Add Result" modal (not the bare form route) for execution 6075: the modal correctly shows a **"Defects*"** multi-select (select2, pre-populated with the execution's existing linked defects as removable chips) plus a **"Report Defect"** link — exactly the consolidated design the 2026-10-08 retest described |
| UI3 (Defect ID's column) | **PASS** — Run #104's grid shows `#3664, #3665, #3673, #3683` in the Defect ID's column for issue 3660, and the run header shows `Linked defects (4)` listing all four by number and subject — matches the live link state exactly |

**Final tally: 23/23 cases re-confirmed working as designed.** Zero regressions. One case (UI1) updates from "PASS"
to "superseded by a same-day deliberate product change" — the underlying capability (defect↔execution visibility)
still exists, just relocated to the Run grid instead of the defect's own issue page, and that relocated location
was independently re-verified this same pass (UI2/UI3).
