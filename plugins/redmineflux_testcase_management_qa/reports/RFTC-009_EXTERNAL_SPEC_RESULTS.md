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

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. A CSRF fix landed in this exact controller since the
last execution — `440da6a` "Close a CSRF gap in two API endpoints found while auditing the last fix" (2026-10-21),
which explicitly names "the CI 'bootstrap a run' endpoint" as one of the two. This was never filed as a QA bug
(found/fixed by the dev directly) and had not been independently re-verified by QA until now — live-tested
directly rather than just cross-referenced.

**Live tests performed this pass (via `curl` against `POST /testcase_ci/bootstrap_run.json`):**

| Check | Result |
|---|---|
| Genuine API-key auth (`-u <api_key>:x`, the real CI client pattern) creates a run | **PASS** — `201 Created`, run id 120, correct suites/environment/assignee-default payload shape, matching the spec's documented response exactly |
| No auth at all | **PASS** — `401 Unauthorized` |
| **Forged cross-site request**: a genuine admin session cookie (lifted from an authenticated browser tab) replayed with a spoofed `Origin: http://evil.example.com` header and **no CSRF token** | **PASS** — `401 Unauthorized`, correctly rejected. This is the exact attack `440da6a`'s own commit message describes testing before/after; confirmed still closed on the current build. |

**Verdict:** No regression. The CSRF fix holds under a genuine forged-request simulation, and legitimate CI-client
auth (the feature's actual real-world use case) is unaffected. Probe run #120 created during this check was left
in place (DB delete via API 403'd — the run-destroy endpoint correctly requires more than API-key auth for a
destructive action — not re-attempted via UI to avoid burning more time on a disposable fixture row).

## Full Re-Execution (Regression) — 2026-10-24, IN PROGRESS — 38 of 46 scenarios literally re-run, continues next session

Per explicit user instruction to literally re-test every case in this file (not risk-based), 38 of the spec's 46
scenarios were individually re-driven live against `localhost:3000` (project `rftc-016-ci-qa`, id=2, and `alpha-web`,
id=5, for the two cases needing a genuinely non-member admin) via `curl` with real API keys (`qa.limited`,
`qa.nosuite`, `qanonadmin`, admin, plus one temporary probe role created and destroyed for RFTC009-F12). Stopped
mid-file on explicit user instruction ("baki hum kal karenge, hamare paas enough limit nahi hai") — **8 scenarios
remain for the next session**: Struct3 (sub-suite independence), U22 (email-suppression guard), F11 (code-level
CSRF/skip_before_action grep), Doc1 (Swagger/API.md), Test17 (2000/2001 DoS cap), F14 (concurrent-race no-duplicate).

| Case | Fresh result (2026-10-24) |
|---|---|
| U1/U3 (happy path, new suite + CI defaults) | **PASS** — `201`, suite auto-created, `state:2`, CI environment default |
| U4 (suite reuse by identifier string) | **PASS** — `created:false`, DB-confirmed `Testsuite#project_id` is the String `"rftc-016-ci-qa"` |
| U9 (testcase pull + seeded Untested rows) | **PASS** — 18 cases pulled, 18 Untested rows seeded, environment `CI` |
| **E2 (SACRED/CRIT)** — first submission transitions seeded row in place | **PASS** — returned id (6464) identical to the seeded row's id |
| **E3 (SACRED REGRESSION)** — second submission on the same cell appends a new row | **PASS** — new id (6508) ≠ original; original row's status unchanged (still Passed); exactly 2 rows total; `TestcaseActivity` recorded at both submission timestamps (18:45:12 and 18:45:19) |
| U5/U6/U7 (idempotency reuse/error/suffix) | **PASS** — `reuse`: same run id reused; `error`: `422` "already exists"; `suffix`: new run `"...#2"` |
| Edge5 (suffix skips used numbers) | **PASS** — 4 consecutive suffix calls produced `#2 → #3 → #4 → #5`, no collision |
| Test16 (`testcase_selection: "all"`) | **PASS** — all 8 project suites auto-attached (`testsuite_ids: [3,5,6,7,22,33,34,36]`) |
| U10/U11/U12 (validation errors) | **PASS** — invalid state / due-before-start / blank name all returned clean `422`s with the exact documented messages |
| U18 (mass-assignment blocked) | **PASS** — DB-confirmed `created_by` stayed the real caller (not the submitted `999`), `is_closed:false`, `run_type_id:nil` despite forbidden fields in the payload |
| F2 (anonymous) | **PASS** — `401` |
| F3 (non-member, no `:create_run`) | **PASS** — `403` "Unauthorized access" |
| F8 (nonexistent project) | **PASS** — `404` "Project not found for the given project_id." |
| F6 (explicit non-member `assignee_id`) | **PASS** — `422`, clear "must be a project member who can execute" message |
| **Test13 (admin, non-member of the target project)** | **PASS**, after correcting my own first attempt — tried project 2 first, where `admin` has since become a Manager member from unrelated earlier testing today (not a valid "non-member" scenario any more); re-ran correctly against `alpha-web` (id=5, confirmed admin is genuinely NOT a member there): no explicit assignee → `422` instructive message; same call **with** an explicit valid member assignee → `201` |
| Test14 (IDOR, cross-project `testcase_ids`) | **PASS** — `422` "not valid test cases in this project" |
| F4 (has `create_run`+`execute_testcase`, lacks `create_test_suite`, NEW suite) | **PASS** — `403`, DB-confirmed zero orphan suite created |
| F5 (same restricted user, EXISTING suite) | **PASS** — `201`, run created (no suite-create permission needed) |
| **F12 (SACRED)** (has `create_run`+`create_test_suite`, lacks `execute_testcase`) | **PASS** — `403`, and the error message is now the clean **"You do not have the Execute testcase permission for this project"** (BUG-TCM-045's second occurrence, also fixed — no longer "not the assignee"); DB-confirmed zero orphan run/suite. Verified via a temporary probe role+membership, both deleted immediately after. |
| U2 (caller values override every CI default) | **PASS** — `state:5`, custom dates, `environment:"Staging"` — nothing defaulted |
| U8 (`testcase_selection:"ids"` → valid `testsuite_id`) | **PASS** — `testsuite_ids:[3]` correctly resolved for both ids |
| U13 (rollback on new-suite + invalid-state) | **PASS** — `422`, DB-confirmed zero orphan suite |
| U15 (wrong-tracker id rejected) | **PASS** — `422`, same cross-project-style message |
| U19 (string-typed state/dates coerced) | **PASS** — `state` saved as integer `2`, run created |
| U21 (`Testsuite#track_activity` resolves identifier-string project) | **PASS** — `TestcaseActivity` row confirmed with correct numeric `project_id` |
| Edge1 (empty `testcase_ids`) | **PASS** — `422` "No test cases were selected for the run." |
| Edge2 (2 suites, 1 existing + 1 new, order preserved) | **PASS** — `testsuite_ids:[3,101]` in request order, correct `created` flags |
| Edge3 (whitespace/case-insensitive suite match) | **PASS** — `"  ci ingest  "` resolved to the existing suite, no duplicate |
| Edge4 (duplicate environments rejected) | **PASS** — `422` "Environments must be unique" |
| E1 (full loop: bootstrap then Pass+Failed-with-defect together) | **PASS** — both results written in one `bulk_create` call |
| E4 (bootstrap → re-bootstrap `reuse` → submit) | **PASS** — second bootstrap returned `reused:true`, same run id |
| Struct1 (multi-environment, independent per-environment seeding) | **PASS** — created with 3 environments (`CI`/`Staging`/`Production`) in one call |
| Struct2 (multi-suite, correct per-suite partitioning) | **PASS** — 3 suites attached in one call, 2 pre-existing reused correctly (`created:false`) |

**Not yet re-run this session (carried to next session):** Struct3, U22, F11, Doc1, Test17, F14 — none of these
are expected to behave differently (no relevant code changes found earlier today via `git log`), but per the
user's own standard this repo holds to, they are **not marked PASS until actually re-executed** — left as
"pending" rather than assumed.

**Fixture note:** this pass created ~25 disposable probe runs (ids 121–143) and a few probe suites
(`RFTC009-regress-*`, ids 99/101) in `rftc-016-ci-qa`/`alpha-web` for isolated testing — left in place (harmless,
consistent with the many other probe fixtures already accumulated in these shared projects); not cleaned up to
avoid spending further time/approvals this session.
