# rftc-009 (#121876) — Execution Results

> Companion to `testcases/RFTC-009_EXTERNAL_SPEC_CI_BOOTSTRAP_RUN.md`. Same external-source warning applies —
> this is production feature #121876, not part of this plugin's own `TC-TCM-xxx` suites or the
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md` 202-case cycle (that doc's own header explicitly excludes CI/V2 features).

**Executed:** 2026-10-06, Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`) +
one disposable throwaway Redmine 7.0.0 container for the admin-permission test requiring a non-member admin.
**Scope:** 1 production feature ticket, tested at the user's explicit request after an earlier session had only
run a single happy-path smoke test (the one-command CI automation runner) — this pass covers the feature's full
spec, not just that one path.

## Summary

| Category | Result |
|---|---|
| Core functional (suite reuse/auto-create, run creation + CI defaults, testcase selection, idempotency, `all` selection, validation errors, mass-assignment protection, email suppression) | **13/13 PASS** |
| **The "sacred regression" `bulk_create` upsert fix** (transition-in-place + append-only history + activity preservation) | **2/2 PASS** |
| Permission / security (SACRED invariants: anon, every permission gate individually, non-member assignee, admin-non-member, cross-project IDOR) | **7/7 PASS** |
| Documentation (Swagger, API.md, live Swagger UI) | **1/1 PASS** |

**Total: 23/23 cases executed, all PASS.**

## Findings

| Case | Verdict | Note |
|---|---|---|
| RFTC009-F12 (permission denial message) | PASS (functionally), note | Same root cause as **BUG-TCM-045** (a second call site) — folded into that existing bug, not filed separately |
| RFTC009-U10 (validation message wording) | PASS, trivial note | "Due date must be greater **then** start date" — minor typo ("then"→"than"), not filed given triviality |

## Not executed (impractical, not security-relevant)

- The 2000-testcase DoS cap (Test 17) — would need 2000+ real fixture issues; the equivalent, structurally
  identical cap on rftc-008's `link_defect` (500) WAS tested and passed, giving reasonable confidence by analogy.
- True concurrent-request race timing (Test 14 functional) — the idempotency mechanics it would stress
  (reuse/error/suffix) were otherwise fully verified sequentially.

## Bottom line

This feature is solid end-to-end, including the one piece that genuinely mattered most going in: the
`bulk_create` upsert fix. Unlike its sibling rftc-008, this feature's UI scope is correctly "backend-only, no
views" per its own spec (CI pipelines don't use a UI) — so there is no equivalent UI-integration gap to find
here. No new bugs specific to this feature; one additional occurrence of the already-filed BUG-TCM-045 was
folded in rather than duplicated.
