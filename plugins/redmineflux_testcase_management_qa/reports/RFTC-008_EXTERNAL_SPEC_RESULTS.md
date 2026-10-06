# rftc-008 (#121875) — Execution Results

> Companion to `testcases/RFTC-008_EXTERNAL_SPEC_DEFECT_EXECUTION_LINKING.md`. Same external-source warning
> applies — this is production feature #121875, not part of this plugin's own `TC-TCM-xxx` suites or the
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md` 202-case cycle.

**Executed:** 2026-10-06, Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`).
**Scope:** 1 production feature ticket, tested at the user's explicit request after the standard V1 cycle
completed, cross-referenced against its own spec document in the product repo.

## Summary

| Category | Result |
|---|---|
| Core functional (many-to-one, bulk all-or-nothing, unlink, legacy-path reconcile, reverse view) | **9/9 PASS** |
| Permission / security (SACRED invariants: anon, no-perm, cross-project, not-visible, read-visibility, IDOR re-scope) | **6/6 PASS** |
| Edge cases (empty batch, self-link, SQL-injection-shaped input, oversize batch, cascade destroy) | **4/4 PASS** |
| UI integration | **2/3 FAIL** — see Findings |

**Total: 20/22 cases PASS; 2 FAIL (both folded into one bug, BUG-TCM-044).**

## Findings

| Case | Verdict | Bug |
|---|---|---|
| RFTC008-UI2 (Link defect picker + bulk-link action) | **FAIL** | **BUG-TCM-044** (Critical) — the entire forward-facing UI for this feature was never wired into the Run execution view; API-only today |
| RFTC008-UI3 (per-execution "Defect ID's" column) | **FAIL** (folded into BUG-TCM-044) | Pre-existing, unrelated-to-this-feature broken column helper, noted as context |
| RFTC008-F3b (permission denial message) | PASS (functionally), note | **BUG-TCM-045** (Low) — correct 403, but reuses a misleading error string from a different check |

## Bottom line

The backend is thoroughly solid — every security invariant (SACRED row) in the spec holds, the central design
decision (legacy-write-path reconciliation, CRIT-1) is proven correct with real production data from earlier in
the same session, and the many-to-one core claim is directly verified. **But the feature as shipped has no
usable UI** — a QA engineer or developer cannot actually use it without calling the JSON API by hand. Given this
is INECO's #1-ranked customer request and ships imminently (target version 7.1.0), BUG-TCM-044 is
release-blocking as currently shipped.

**Production report:** Both bugs reported — #122104 (BUG-TCM-044), #122105 (BUG-TCM-045) — assigned Vaishnavi
Bhawsar, target version "Testcase Management plugin Release 7.1.0".
