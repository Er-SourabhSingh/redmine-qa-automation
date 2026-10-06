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

---

### RFTC009-F3: Caller without `:create_run` rejected

**User Role:** Developer (`developer`, temporarily granted zero relevant permissions for this test)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` as a project member lacking `:create_run`.
**Expected Result:** HTTP 403; no run created.
**Actual Result:** PASS. `{"error":"Unauthorized access"}`; confirmed nothing created.

---

### RFTC009-F12 (SACRED): Caller with `:create_run`+`:create_test_suite` but NOT `:execute_testcase` rejected

**User Role:** Developer (temporarily granted `create_run`+`create_test_suite` only)
**Priority:** P1 — closes the exact bypass the spec worried about (bootstrap-then-become-default-assignee)
**Steps:** `POST bootstrap_run.json` creating a brand-new suite, as this user.
**Expected Result:** HTTP 403; no run, no suite created — even though both other permissions are present.
**Actual Result:** PASS functionally (403, nothing created). **Note:** same error-message reuse issue as
BUG-TCM-045 — the body says "you are not the assignee," which describes a different check. Folded into that
existing bug as an additional occurrence, not filed separately.

---

### RFTC009-F4 (SACRED): Caller with `:create_run`+`:execute_testcase` but NOT `:create_test_suite` fails closed when a NEW suite would be created

**User Role:** Developer (temporarily granted `create_run`+`execute_testcase` only)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` naming a suite that does NOT yet exist, as this user.
**Expected Result:** HTTP 422/403; **neither** the suite nor the run is created (fail closed, transactional).
**Actual Result:** PASS, with a genuinely clean message this time:
`{"status":"error","errors":["Permission denied: create_test_suite is required to create a suite in project 'QA
Demo'."]}`. Confirmed zero orphan suite or run.

---

### RFTC009-F5: Same user, but the named suite ALREADY EXISTS — no `:create_test_suite` needed

**User Role:** Developer (same permissions as RFTC009-F4)
**Priority:** P2
**Steps:** `POST bootstrap_run.json` naming an EXISTING suite, as the same restricted user.
**Expected Result:** HTTP 201; run created (no suite-create permission needed when nothing is actually created).
**Actual Result:** PASS. Run #21 created successfully; default assignee correctly defaulted to this user's own
id.

---

### RFTC009-F6 (SACRED): Explicit non-member `assignee_id` rejected

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` with `run_assignments: [{environment: "CI", assignee_id: <a user who is not
a project member>}]`.
**Expected Result:** HTTP 422, clear "must be a project member who can execute" message; no run created.
**Actual Result:** PASS. Clean message, confirmed zero orphan run.

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

---

### RFTC009-Test14 (SACRED, IDOR): Cross-project `testcase_ids` rejected

**User Role:** Admin (`admin`)
**Priority:** P1
**Steps:** `POST bootstrap_run.json` with `testcase_selection: "ids"`, `testcase_ids` including one id from a
DIFFERENT project.
**Expected Result:** HTTP 422; no run created; the foreign id is never pulled in.
**Actual Result:** PASS. `{"...one or more testcase_ids are not valid test cases in this project (wrong project,
tracker, visibility, or not in any suite)."}`; confirmed zero orphan run.

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

## Not Executed (impractical at this scale, not security-relevant)

- **Test 17 / SI-13 (DoS cap, 2000-testcase ceiling)** — would require creating 2000+ real test case issues;
  skipped given the low additional confidence versus setup cost. The equivalent cap on `link_defect` (500) WAS
  tested and passed (see rftc-008's `RFTC008-Edge9`), giving reasonable confidence the same pattern holds here.
- **Test 14 functional / concurrent-duplicate-name race** — true concurrent-request timing is impractical to
  simulate meaningfully via sequential tool calls; the idempotency mechanics (reuse/error/suffix) were otherwise
  fully verified (RFTC009-U5/U6/U7).
