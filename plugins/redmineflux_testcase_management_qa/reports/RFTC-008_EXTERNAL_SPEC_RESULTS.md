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
