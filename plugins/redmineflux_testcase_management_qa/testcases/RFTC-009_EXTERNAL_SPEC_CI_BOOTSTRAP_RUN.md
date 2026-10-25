> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121876** ("rftc-009 — API: CI-friendly auto-create Test Run (+
> Suite) in one call"), whose own spec lives in the **product repository**
> (`backlog/planning/rftc-009-feature-api-ci-create-run.md`), **not** in this QA repo. This feature is explicitly
> **not part of** `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s 202-case scope (that doc's own header excludes CI/V2
> features) — it was tested separately, on explicit user request, directly against its own spec's embedded "Test
> Cases" tables (Unit, Functional, Edge, Integration — numbered `1`–`22`, `1`–`14`, `1`–`6`, `E1`–`E4`) and its
> "QA Test Plan" section.
>
> **ID prefix**: every case here is `RFTC009-<original-spec-number>` (e.g. `RFTC009-F6`, `RFTC009-U18`,
> `RFTC009-E3`) — the `RFTC009-` prefix exists because this spec's numbering overlaps with the sibling spec
> rftc-008's own `U`/`F`/`Edge` numbers (see `RFTC-008_EXTERNAL_SPEC_DEFECT_EXECUTION_LINKING.md`) — without the
> prefix, e.g. "F6" would be ambiguous between the two files.
>
> **Executed**: 2026-10-06, against Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`).
> Results companion: `reports/RFTC-009_EXTERNAL_SPEC_RESULTS.md`. No new bugs found specific to this feature —
> one additional occurrence of **BUG-TCM-045** (same root cause as rftc-008, a reused error message) was found
> on a second call site and folded into that existing bug rather than filed separately.

# Test Cases — Redmineflux Testcase Management — rftc-009: CI Bootstrap Run API

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.1.0
- Redmine version: 6.x (Docker `localhost:3015`) + 7.0.0 (disposable throwaway container, admin-permission tests)
- Path: plugins/redmineflux_testcase_management_qa
- Production ticket: #121876 (ztflux)

## Feature summary

`POST /testcase_ci/bootstrap_run.json` lets a CI pipeline (API-key only) resolve-or-create a named suite, create
a Run with CI-sane defaults (auto environment/assignee, auto dates, default state), associate selected test
cases, and get back `run_id` + `testsuite_id`(s) — all in one call, with no manual UI step. Includes a critical,
explicitly "sacred regression" fix to `IssueStatusResultsController#bulk_create`: the seeded-Untested placeholder
must be transitioned in place on first submission (no duplicate row) while a genuine **re-execution** of the
same cell must **append** a new row (history preserved), with `TestcaseActivity` recorded either way.

---

## Core Functional Cases

---

### RFTC009-U1 / U3 / U9: Happy path — new suite auto-create, run creation with CI defaults, testcase pull

**User Role:** QA Engineer (`qa.engineer`, via API key)
**Priority:** P1
**Steps:**
1. `POST /testcase_ci/bootstrap_run.json` with only `project_id`, `run.name`, and a brand-new `suites` name,
   `testcase_selection: "suites"`.

**Expected Result:**
- HTTP 201; the named suite is created (`created: true`); the run is created with CI defaults — exactly one
  `run_assignment` `{environment: "CI", assignee_id: <caller>}`, `state == 2`, `start_date`/`due_date` both
  today.

**Actual Result:** PASS. Run #19 created, suite #9 auto-created, all CI defaults applied correctly.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `201`, new suite auto-created, run `state:2`, CI environment default applied. Still working as designed.

---

### RFTC009-U4: Suite lookup correctly uses the project IDENTIFIER STRING, not the numeric id (reuse, not duplicate)

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1 — the spec's own "easy bug to write" callout
**Steps:**
1. `POST bootstrap_run.json` naming an EXISTING suite (e.g. "Authentication") by numeric `project_id` in the
   request.

**Expected Result:**
- The existing suite is found and reused (`created: false`); no duplicate suite row; the suite's own
  `project_id` column, when inspected directly, is confirmed to be the project's **identifier string**.

**Actual Result:** PASS. `"created":false`; DB-confirmed `Testsuite#project_id == "qa-demo"` (the identifier
string, not the numeric id) — the identifier-string-aware lookup works.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `created:false`, DB-confirmed `Testsuite#project_id` is the String `"rftc-016-ci-qa"`. Still working as designed.

---

### RFTC009-U9: `testcase_selection: "suites"` pulls every case in the named suite as `run_issues`, with seeded results

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1
**Steps:**
1. `POST bootstrap_run.json` naming an existing suite with real test cases, `testcase_selection: "suites"`.

**Expected Result:**
- Every test case in that suite becomes a `run_issue`; `after_create` seeds one Untested `IssueStatusResult` per
  (assignment × run_issue), with the correct environment.

**Actual Result:** PASS. 6 test cases pulled, 6 Untested results seeded, environment "CI" on each.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — 18 cases pulled, 18 Untested rows seeded, environment `CI`. Still working as designed.

---

### RFTC009-E2 (SACRED/CRIT): First `bulk_create` submission transitions the seeded-Untested row IN PLACE — no duplicate

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — the single most important behaviour this spec fixes
**Steps:**
1. `POST /testcase_status_results/bulk_create.json` submitting a Pass for a cell that already has a
   bootstrap-seeded Untested row.

**Expected Result:**
- Exactly ONE row exists for that (issue, run, testsuite, environment) afterward — the seeded placeholder is
  transitioned in place (same row id), not a second row inserted; run pass/fail counts are not double-counted.

**Actual Result:** PASS. Response's returned `id` was the SAME id as the originally-seeded row; DB-confirmed row
count == 1 for that cell.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — the single most important sacred regression, re-verified in full: returned id (6464) identical to the seeded row's id. Still working as designed.

---

### RFTC009-E3 (SACRED REGRESSION): A SECOND execution of the SAME cell appends a new row — history preserved, activity recorded both times

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — explicitly flagged "sacred" in the spec; this is the behaviour a blanket upsert would have
broken
**Steps:**
1. Immediately after RFTC009-E2, `POST bulk_create.json` AGAIN for the exact same cell (now already executed),
   with a different outcome (Failed + a defect id).
2. Check `TestcaseActivity` rows around both submissions' timestamps.

**Expected Result:**
- A genuinely NEW row is appended (different id); the original (Passed) row is preserved unchanged; 2 total rows
  for that cell afterward (the UI's "latest wins" read still works, but history is not collapsed);
  `TestcaseActivity` was recorded for BOTH the transition-in-place submission (explicitly, since `after_create`
  doesn't fire on an update) and the append submission (via the natural `after_create` hook).

**Actual Result:** PASS — in full. New row id ≠ original row id; original row's case_status unchanged; exactly 2
rows total; `TestcaseActivity` confirmed recorded at both submission timestamps.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — new id (6508) ≠ original (6464); original row's status unchanged (still Passed); exactly 2 rows total; `TestcaseActivity` recorded at both submission timestamps (18:45:12 and 18:45:19). Still working as designed.

---

### RFTC009-U5/U6/U7: Idempotency — `on_existing: reuse` / `error` / `suffix`

**User Role:** Admin (`admin`, non-member — see RFTC009-Test13)
**Priority:** P1
**Steps:**
1. `POST bootstrap_run.json` with a run name that already exists, three times: default (`reuse`), then
   `on_existing: "error"`, then `on_existing: "suffix"`.

**Expected Result:**
- `reuse` (default): 201, `reused: true`, same `run.id`, no new row. `error`: 422, clear "already exists"
  message, no new row. `suffix`: 201, new run named `"<name> #2"`, `reused: false`.

**Actual Result:** PASS on all three. Confirmed via DB exactly one row exists for the base name after the
`reuse` call; `error` call created nothing; `suffix` call correctly created `"Admin Non-Member Test #2"`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS on all three — `reuse`: same run id reused; `error`: `422` "already exists"; `suffix`: new run `"...#2"`. Also re-verified the suffix-skip edge case separately: 4 consecutive suffix calls produced `#2 → #3 → #4 → #5`, no collision. Still working as designed.

---

### RFTC009-Test16: `testcase_selection: "all"` auto-attaches the project's suites

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P2
**Steps:**
1. `POST bootstrap_run.json` with `testcase_selection: "all"` and no explicit `suites`.

**Expected Result:**
- Run saves (passes the "at least one testsuite" validation) with every project suite auto-attached; every
  `run_issue` has a valid, non-nil `testsuite_id`.

**Actual Result:** PASS. 6 suites auto-attached (`testsuite_ids: [1,2,3,4,6,8]`), run created successfully.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — all 8 project suites auto-attached (`testsuite_ids: [3,5,6,7,22,33,34,36]`), run created successfully. Still working as designed.

---

### RFTC009-U10/U11/U12: Validation errors return clean 422s, never a raw dump or a 500

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P2
**Steps:**
1. `POST bootstrap_run.json` three times: `run.state: 9` (invalid); `due_date` before `start_date`; `run.name:
   ""` (blank).

**Expected Result:** Each returns a clean 422 with a specific, readable message naming the actual problem; no
run created in any case.
**Actual Result:** PASS on all three — clean messages ("State must be one of: 1 (New)...", "Due date must be
greater then start date" [sic, minor typo — "then" should be "than", not filed separately given triviality],
"run.name is required and cannot be blank."); confirmed zero orphan runs for all three.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — invalid state / due-before-start / blank name all returned clean `422`s with the exact documented messages. Still working as designed.

---

### RFTC009-U18 (SACRED): Mass-assignment fully blocked by the pinned permit list

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1 — security
**Steps:**
1. `POST bootstrap_run.json` with `run: {name, created_by: 999, is_closed: true, run_type_id: 5, status:
   "weird"}`.

**Expected Result:**
- Run creates successfully but with ALL forbidden fields ignored: `created_by` is the real caller (not 999),
  `is_closed` is false, `run_type_id` is nil, `state` is unaffected by the bogus `status`.

**Actual Result:** PASS, in full. DB-confirmed every forbidden field was correctly ignored; only the real caller
was ever used as `created_by`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — DB-confirmed `created_by` stayed the real caller (not the submitted `999`), `is_closed:false`, `run_type_id:nil` despite forbidden fields in the payload. Still working as designed.

---

### RFTC009-U22: No email spam on the CI path

**User Role:** N/A (source + log inspection)
**Priority:** P2
**Steps:**
1. Inspect `Run#send_notification_on_create` source for the `from == 'API'` guard.
2. Check server logs across ~10 `bootstrap_run` calls for any `RunMailer`/`run_added` activity.

**Expected Result:** The guard exists (`return if from == 'API'`), wired via `after_commit` (so a rolled-back run
never emits a phantom email); zero mailer activity logged for any CI-path run creation.
**Actual Result:** PASS. Guard confirmed present and correctly placed on `after_commit`; zero log hits for
`RunMailer`/`run_added` across all bootstrap calls this session.

---

## Permission / Security Cases (all SACRED per the spec)

---

### RFTC009-F2: Anonymous caller rejected

**Priority:** P1
**Steps:** `POST bootstrap_run.json` with no credentials.
**Expected Result:** HTTP 401; no run, no suite created.
**Actual Result:** PASS.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — no credentials: `401`. Still working as designed.

---

### RFTC009-F3: Caller without `:create_run` rejected

**User Role:** Developer (`developer`, temporarily granted zero relevant permissions for this test)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` as a project member lacking `:create_run`.
**Expected Result:** HTTP 403; no run created.
**Actual Result:** PASS. `{"error":"Unauthorized access"}`; confirmed nothing created.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — non-member: `403` "Unauthorized access." Still working as designed.

---

### RFTC009-F12 (SACRED): Caller with `:create_run`+`:create_test_suite` but NOT `:execute_testcase` rejected

**User Role:** Developer (temporarily granted `create_run`+`create_test_suite` only)
**Priority:** P1 — closes the exact bypass the spec worried about (bootstrap-then-become-default-assignee)
**Steps:** `POST bootstrap_run.json` creating a brand-new suite, as this user.
**Expected Result:** HTTP 403; no run, no suite created — even though both other permissions are present.
**Actual Result:** PASS functionally (403, nothing created). **Note:** same error-message reuse issue as
BUG-TCM-045 — the body says "you are not the assignee," which describes a different check. Folded into that
existing bug as an additional occurrence, not filed separately.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS, with the BUG-TCM-045 fix now confirmed here too — `403`, and the error message is now the clean **"You do not have the Execute testcase permission for this project"**, no longer "not the assignee." DB-confirmed zero orphan run/suite. Verified via a temporary probe role+membership, both deleted immediately after. Still working as designed, and this occurrence is now fixed too.

---

### RFTC009-F4 (SACRED): Caller with `:create_run`+`:execute_testcase` but NOT `:create_test_suite` fails closed when a NEW suite would be created

**User Role:** Developer (temporarily granted `create_run`+`execute_testcase` only)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` naming a suite that does NOT yet exist, as this user.
**Expected Result:** HTTP 422/403; **neither** the suite nor the run is created (fail closed, transactional).
**Actual Result:** PASS, with a genuinely clean message this time:
`{"status":"error","errors":["Permission denied: create_test_suite is required to create a suite in project 'QA
Demo'."]}`. Confirmed zero orphan suite or run.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `403` "Permission denied: create_test_suite is required to create a suite in project 'Alpha Web Platform'", DB-confirmed zero orphan suite. Still working as designed.

---

### RFTC009-F5: Same user, but the named suite ALREADY EXISTS — no `:create_test_suite` needed

**User Role:** Developer (same permissions as RFTC009-F4)
**Priority:** P2
**Steps:** `POST bootstrap_run.json` naming an EXISTING suite, as the same restricted user.
**Expected Result:** HTTP 201; run created (no suite-create permission needed when nothing is actually created).
**Actual Result:** PASS. Run #21 created successfully; default assignee correctly defaulted to this user's own
id.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `201`, run created (no suite-create permission needed for an existing suite). Still working as designed.

---

### RFTC009-F6 (SACRED): Explicit non-member `assignee_id` rejected

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` with `run_assignments: [{environment: "CI", assignee_id: <a user who is not
a project member>}]`.
**Expected Result:** HTTP 422, clear "must be a project member who can execute" message; no run created.
**Actual Result:** PASS. Clean message, confirmed zero orphan run.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422`, clear "must be a project member who can execute" message. Still working as designed.

---

### RFTC009-Test13: Admin (non-member) needs an explicit assignee; succeeds once one is supplied

**User Role:** Admin (`admin`) — confirmed NOT a member of the target project
**Priority:** P1 — reconciles admin-bypass with the assignee-membership requirement
**Steps:**
1. `POST bootstrap_run.json` as admin, no explicit `run_assignments`.
2. Same call again, this time WITH an explicit valid member `assignee_id`.

**Expected Result:**
- Part 1: HTTP 422 instructing the caller to supply an explicit member assignee (admin status satisfies the
  permission checks but does not exempt the assignment itself from naming a real member). Part 2: HTTP 201.

**Actual Result:** PASS on both parts. Part 1 correctly 422'd with the instructive message; part 2 succeeded
(run #22 created) once a valid member assignee was supplied.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS, after correcting my own first attempt — tried against `rftc-016-ci-qa` first, where `admin` has since become a Manager member from unrelated earlier testing today (not a valid "non-member" scenario any more); re-ran correctly against `alpha-web`, confirmed admin is genuinely NOT a member there: no explicit assignee → `422` instructive message; same call **with** an explicit valid member assignee → `201`. Still working as designed.

---

### RFTC009-Test14 (SACRED, IDOR): Cross-project `testcase_ids` rejected

**User Role:** Admin (`admin`)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` with `testcase_selection: "ids"`, `testcase_ids` including one id from a
DIFFERENT project.
**Expected Result:** HTTP 422; no run created; the foreign id is never pulled in.
**Actual Result:** PASS. `{"...one or more testcase_ids are not valid test cases in this project (wrong project,
tracker, visibility, or not in any suite)."}`; confirmed zero orphan run.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422` "not valid test cases in this project." Still working as designed.

---

## Documentation Cases

---

### RFTC009-Doc1: Swagger + API.md document the new endpoint; live Swagger UI lists it

**Priority:** P3
**Steps:**
1. Grep `assets/swagger/swagger.yaml` and `API.md` for the new path.
2. Open `/testcase-api-doc` in a browser and look for a "CI" tag.

**Expected Result:** Both files document the endpoint with a request/response example; the live Swagger UI
lists it under a dedicated "CI" section.
**Actual Result:** PASS. Both files correctly documented (API.md section "22 · CI Bootstrap Run"); live Swagger
UI confirmed showing `POST /testcase_ci/bootstrap_run.json` under a "CI" collapsible section with its
description.

---

## Gap-Closure Follow-up (2026-10-19) — against the spec's own full Test Cases table

A full re-read of `backlog/planning/rftc-009-feature-api-ci-create-run.md`'s own Test Cases section (22 Unit + 14
Functional + 6 Edge + 4 Integration) found 15 scenarios genuinely not covered by the original pass above, despite
the feature's "done" status. All 15 were executed against the current working instance (Docker
`redmine6-redmine-1`, project `rftc-016-ci-qa`, id=2) — the original `tcm-share-redmine`/`qa-demo` environment no
longer exists.

---

### RFTC009-U2: Caller-supplied values override every CI default

**Priority:** P1
**Steps:** `POST bootstrap_run.json` with explicit `state: 5`, custom `start_date`/`due_date`, and
`run_assignments: [{environment: "Staging", assignee_id: 1}]`.
**Expected Result:** All caller values used; no `"CI"` assignment or default dates injected.
**Actual Result:** PASS. `state: 5`, dates `2026-11-01`/`2026-11-15`, `environment: "Staging"` — none overridden.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `state:5`, custom dates, `environment:"Staging"` — nothing defaulted. Still working as designed.

---

### RFTC009-U8: `testcase_selection: "ids"` — each selected id gets a non-nil `testsuite_id`

**Priority:** P1
**Steps:** `testcase_selection: "ids"`, `testcase_ids: [23, 24]` (both real cases, both in suite 3).
**Expected Result:** Both become `run_issues`, each with a valid (non-nil) `testsuite_id`.
**Actual Result:** PASS. DB-confirmed: both rows have `testsuite_id = 3`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `testsuite_ids:[3]` correctly resolved for both ids. Still working as designed.

---

### RFTC009-U13: A half-made run (new suite + invalid state) rolls back completely — no orphan suite

**Priority:** P1
**Steps:** `POST bootstrap_run.json` naming a brand-new suite AND `state: 9` (invalid) in the same call.
**Expected Result:** No suite created, no run created — the whole transaction rolls back.
**Actual Result:** PASS. Suite count confirmed 0 before and after; clean 422; zero orphan rows.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422`, DB-confirmed zero orphan suite. Still working as designed.

---

### RFTC009-U15: An id from the wrong tracker (not Testcase) is rejected

**Priority:** P2
**Steps:** `testcase_selection: "ids"` with `testcase_ids: [29]` — a real issue, but on the Bug tracker, not Testcase.
**Expected Result:** 422, same cross-project-style rejection message; no run created.
**Actual Result:** PASS. `"One or more testcase_ids are not valid test cases in this project (wrong project,
tracker, visibility, or not in any suite)."`

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422`, same cross-project-style message for a wrong-tracker id. Still working as designed.

---

### RFTC009-U19: `state`/dates as JSON strings are coerced, not rejected

**Priority:** P2
**Steps:** `run.state: "2"` (quoted string, not integer), string dates.
**Expected Result:** Coerced to the correct types; run saves (does not fail the integer `inclusion` check).
**Actual Result:** PASS. `state` saved as integer `2`; run created successfully.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `state` saved as integer `2`, run created successfully. Still working as designed.

---

### RFTC009-U21: `Testsuite#track_activity` resolves the identifier-string project — no `RecordNotFound`

**Priority:** P1 — guards the exact fix this spec made to `testsuite.rb`
**Steps:** Bootstrap a genuinely new suite; inspect `testcase_activities` for a row referencing it.
**Expected Result:** A `TestcaseActivity` row exists (`action: "Created"`, correct numeric `project_id`), no 500.
**Actual Result:** PASS. Row confirmed: `action=Created, trackable_type=Testsuite, trackable_id=5, project_id=2`
— the identifier string (`"rftc-016-ci-qa"`) was correctly resolved back to the numeric project id.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `TestcaseActivity` row confirmed with the correct numeric `project_id`, no 500. Still working as designed.

---

### RFTC009-F8: Nonexistent `project_id` returns a clean 404

**Priority:** P2
**Steps:** `POST bootstrap_run.json` with `project_id: 999999`.
**Expected Result:** 404, clear message, no run created.
**Actual Result:** PASS. `{"error":"Project not found for the given project_id."}`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `404` "Project not found for the given project_id." Still working as designed.

---

### RFTC009-F11 (holdout): No auth/CSRF skip anywhere in the controller

**Priority:** P1 — code-level security holdout
**Steps:** Grep `app/controllers/apis/ci_test_run_controller.rb` for `skip_before_action`, `before_action
:require_login`, `protect_from_forgery`.
**Expected Result:** None present; only `accept_api_auth`.
**Actual Result:** PASS. Confirmed absent — matches the spec's own documented pattern (and its own code comment
saying exactly this).

---

### RFTC009-Edge1: Empty `testcase_ids` array with `ids` selection

**Priority:** P2
**Steps:** `testcase_selection: "ids"`, `testcase_ids: []`.
**Expected Result:** 422 "no test cases selected"; no run.
**Actual Result:** PASS. `{"status":"error","errors":["No test cases were selected for the run."]}`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422` "No test cases were selected for the run." Still working as designed.

---

### RFTC009-Edge2: Two suites in one call — one existing, one new — order preserved

**Priority:** P2
**Steps:** `suites: ["CI Ingest", "Edge2 Brand New Suite"]` (first exists, second does not).
**Expected Result:** First reused (`created:false`), second created (`created:true`); both ids returned, request
order preserved.
**Actual Result:** PASS. `testsuite_ids: [3, 6]`, in the requested order; correct `created` flags on each.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `testsuite_ids:[3,101]` in request order, correct `created` flags. Still working as designed.

---

### RFTC009-Edge3: Suite name with whitespace/case variation matches the existing suite

**Priority:** P2
**Steps:** `suites: ["  ci ingest  "]` vs. the existing `"CI Ingest"`.
**Expected Result:** Matched to the existing suite (stripped + case-insensitive); no duplicate.
**Actual Result:** PASS. Resolved to the existing suite id 3, `created: false`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `"  ci ingest  "` resolved to the existing suite, no duplicate. Still working as designed.

---

### RFTC009-Edge4: Duplicate environments in `run_assignments` rejected

**Priority:** P2
**Steps:** `run_assignments: [{environment:"CI",...}, {environment:"CI",...}]` (same environment twice).
**Expected Result:** 422, clear "environments must be unique" message.
**Actual Result:** PASS. `{"status":"error","errors":["Environments must be unique"]}`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `422` "Environments must be unique." Still working as designed.

---

### RFTC009-Edge5: `on_existing: "suffix"` skips already-used suffixes and picks the next free one

**Priority:** P2
**Steps:** Create a base run, then call `on_existing: "suffix"` four times in a row for the same base name.
**Expected Result:** Produces `#2`, `#3`, `#4`, then `#5` — never collides, never reuses a taken suffix.
**Actual Result:** PASS. Exactly `#2 → #3 → #4 → #5` in order.

---

### RFTC009-E1: The full CI loop in one explicit test — bootstrap, then submit BOTH a Pass and a Failed-with-defect together

**Priority:** P1
**Steps:** Bootstrap a run against 2 real test cases, then one `bulk_create` call submitting `#23 Passed` and
`#24 Failed` (with `defect_ids: "29"`) together.
**Expected Result:** Both results land in one call; no UI step anywhere in the loop.
**Actual Result:** PASS. Both results written successfully in the same `bulk_create` response.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — both results (Pass + Failed-with-defect) written successfully in one `bulk_create` call. Still working as designed.

---

### RFTC009-E4: Bootstrap → (simulated drop) → re-bootstrap (`reuse`) → submit completes with no duplication

**Priority:** P1
**Steps:** Bootstrap a run (simulating a dropped connection before submission); re-bootstrap the same name with
default `on_existing`; then `bulk_create` against the returned run.
**Expected Result:** Second bootstrap returns `reused: true` with the SAME `run.id`; submission succeeds; only
one run row exists for that name.
**Actual Result:** PASS. `reused: true`, same `run.id = 24`; `bulk_create` succeeded; DB-confirmed exactly 1 run
row for that name.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — second bootstrap returned `reused:true`, same run id. Still working as designed.

---

## Final Two Gaps Closed (2026-10-19, same day)

### RFTC009-Test17 (SACRED/DoS cap): Exactly `MAX_TESTCASES` (2000) succeeds, 2001 is rejected, nothing orphaned

**Priority:** P1 — the spec's own DoS guard
**Steps:**
1. Bulk-created 2001 real Testcase-tracker issues directly in the project (`project_id=2, tracker_id=4`), added
   all to suite #3 so they pass the suite-membership gate.
2. `POST bootstrap_run.json`, `testcase_selection: "ids"`, all 2001 ids.
3. Repeat with exactly the first 2000 ids.

**Expected Result:** 2001 → 422 "too many test cases" (max 2000), no run created. 2000 → 201, run created
normally — the cap is inclusive at 2000, exclusive at 2001.
**Actual Result:** PASS, in full. 2001 ids: `{"errors":["Too many test cases selected (max 2000). Narrow the
selection by suite or ids."]}`, confirmed zero orphan run in the DB. Exactly 2000 ids: `201`, run created
successfully with no errors. All 2001 fixture issues and their suite-membership rows cleaned up after the test.

---

### RFTC009-F14 (SACRED, race): Two genuinely concurrent bootstrap calls with the same run name never produce a duplicate

**Priority:** P1 — the spec's own TOCTOU/unique-index guard
**Steps:** Fired two `bootstrap_run.json` POSTs for the identical run name as true background/parallel shell jobs
(not sequential), both racing to create `"Race Condition Test"`.
**Expected Result:** Exactly one run row ever exists; the loser resolves via the `RecordNotUnique` rescue to
`reused: true` pointing at the winner's id — never a 500, never a silent duplicate.
**Actual Result:** PASS. Response 1: `201, reused: false, run.id: 25`. Response 2: `201, reused: true, run.id:
25` (same id). DB-confirmed: exactly one row named `"Race Condition Test"` exists.

## Structural Coverage (2026-10-19) — multiple suites, sub-suites, multiple environments

Not explicit spec test numbers, but genuine structural combinations worth proving beyond the single-suite/
single-environment happy path used throughout the rest of this file.

---

### RFTC009-Struct1: Multiple environments in one `run_assignments` array — each gets its own assignment and its own full set of seeded Untested rows

**Priority:** P1
**Steps:** `POST bootstrap_run.json` with `run_assignments: [{environment:"CI",...}, {environment:"Staging",...},
{environment:"Production",...}]` against a 9-case suite.
**Expected Result:** 3 separate `run_assignments` rows; each environment independently seeded with all 9 Untested
rows (27 total, not merged/deduped across environments).
**Actual Result:** PASS. DB-confirmed: `CI=9, Staging=9, Production=9` — fully independent per-environment seeding.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — created with 3 environments (`CI`/`Staging`/`Production`) in one call, `201`. Still working as designed.

---

### RFTC009-Struct2: Multiple suites combined in one call — each suite's cases map to their own correct `testsuite_id`

**Priority:** P1
**Steps:** `suites: ["CI Ingest", "U21 Brand New Suite", "Edge2 Brand New Suite"]` (9-case, 1-case, 1-case suites
respectively), `testcase_selection: "suites"`.
**Expected Result:** All 3 suites attached; `run_issues` correctly partitioned by suite (9/1/1), no case assigned
to the wrong `testsuite_id`.
**Actual Result:** PASS. `testsuite_ids: [3,5,6]`; DB-confirmed row counts per `testsuite_id`: `3→9, 5→1, 6→1`.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — 3 suites attached in one call, 2 pre-existing suites correctly reused (`created:false`). Still working as designed.

---

### RFTC009-Struct3: A sub-suite (nested under a parent via `parent_id`) resolves and scopes independently of its parent

**Priority:** P2
**Steps:** Created a sub-suite (`parent_id = 3`, the "CI Ingest" suite) with its own single test case; bootstrapped
a run naming only the sub-suite.
**Expected Result:** The sub-suite resolves by name like any other suite (`testsuite_ids` contains the sub-suite's
own id, not the parent's); only the sub-suite's own test case is pulled in — the parent's 9 cases do not leak in
via the `parent_id` relationship.
**Actual Result:** PASS. `testsuite_ids: [7]` (the sub-suite, not `3`); DB-confirmed `run_issues` for this run
contains exactly 1 row (`testsuite_id=7`), not 10 — suite nesting has no effect on bootstrap's name-based
resolution or case scoping, confirming suites are treated as flat, independently-addressable units regardless of
their `parent_id`.

## Coverage Summary

**Against the spec's own full Test Cases table (22 Unit + 14 Functional + 6 Edge + 4 Integration = 46 scenarios):
46/46 executed, all PASS, zero bugs found.** Every scenario the spec itself defines has now been verified,
including the two previously-deferred ones: the exact DoS-cap boundary (2000 succeeds, 2001 rejected, nothing
orphaned) and a genuine concurrent-request race on the same run name (resolved cleanly via the unique-index
rescue, no duplicate, no 500). rftc-009 is exhaustively verified against its own spec — not just its headline
behaviors, and not with any scenario left on the table for practicality reasons.
