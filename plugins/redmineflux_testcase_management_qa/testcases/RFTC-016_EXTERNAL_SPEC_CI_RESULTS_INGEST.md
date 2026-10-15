> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121880** ("rftc-016 — CI results ingest (JUnit → executions +
> auto-defect)"), part of the **Testcase Management plugin Release 7.2.0** (due 2026-10-21). This feature is
> **not part of** `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope — it is V2/CI work, tested separately on explicit
> user request. Sibling features in the same release: `RFTC-017` (CI results CLI) and `RFTC-038` (CI platform
> recipes) — not yet covered by their own suite files.
>
> **Dependency chain**: rftc-008 → rftc-009 → **rftc-016** → rftc-017 → rftc-038 (merge order). rftc-009
> (`bootstrap_run.json`) is already covered in `RFTC-009_EXTERNAL_SPEC_CI_BOOTSTRAP_RUN.md`.
>
> **ID prefix**: every case here is `RFTC016-<n>`.
>
> **Executed**: 2026-10-15, against Docker `localhost:3000` (container `redmine6-redmine-1`), after a `git pull`
> of the plugin's `master` branch which already has rftc-016/017/020/021 merged — confirmed via `git log` showing
> `feat(rftc-016): CI results ingest endpoint`, `fix(rftc-016): harden CI ingest`). The originally-planned V2 demo
> (`demo-v2/docker-compose.v2demo.yml`, `:3093`) could **not** be stood up on this machine — its compose file
> hardcodes the original developer's own macOS paths (`/Users/Mahen/project/redmineflux/...`) as bind mounts, and
> its base image (`redmineflux/redmine:6.0-demo`) is a private image that fails to pull. This is itself a known,
> previously unverified gap (matches production Test Case **"[EX-720-TOOL-04] Stand up the :3093 demo from
> demo-v2/ on a fresh machine"**, which is exactly this problem). Testing proceeded on the existing
> `redmine6-redmine-1` instance instead, which already has the merged plugin code and no portability issues.
>
> **Dedicated project, not reused from another bug's retest project**: a fresh project `RFTC-016 CI Ingest QA`
> (identifier `rftc-016-ci-qa`, id=2) was created specifically for this suite, with its own "CI Ingest" test
> suite (id=3) and 2 fixtures (`#23` "test_login_valid" with Automation Key `test_login_valid`, `#24` "Apply
> valid discount code at checkout", no key). Every scenario below was executed in THIS project — not mixed into
> `bug-121896-retest`, which was for an unrelated client retest. Admin had to be added as an explicit project
> member (Manager role) before `bootstrap_run` would accept it as a run assignee — a fresh project's creator is
> not automatically a member for this purpose (matches `RFTC-009`'s own documented "Admin (non-member) needs an
> explicit assignee" behaviour).
>
> **No bugs found this session** — every scenario behaved exactly per spec. (A separate client-reported issue
> about this same release's `issue_key`/`project_issue_number` collision on `copy_issues_to_test_suite` was
> investigated and confirmed fixed — see the session's retest note; that is a different endpoint, not
> `ingest_results`, and is not part of this suite.)

# Test Cases — Redmineflux Testcase Management — rftc-016: CI Results Ingest

## Plugin
- Name: Redmineflux Testcase Management
- Version: master (post Release 7.1.0, pre-7.2.0 — rftc-016/017/020/021 merged, not yet version-bumped in
  `init.rb` which still reads `7.1.0`)
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Path: plugins/redmineflux_testcase_management_qa
- Production ticket: #121880 (ztflux), done ratio 90%, status "In Peer Review" on production at test time

## Feature summary

`POST /testcase_ci/ingest_results.json` takes a normalized, format-agnostic results array
(`[{key, status, message?, duration_ms?}, ...]`) against an **existing** Run (created via rftc-009's
`bootstrap_run.json`), resolves each result's `key` to exactly one in-project visible test case (by
`automation_key` custom field, numeric `id`, or `subject` — in caller-specified priority order), writes the
execution through the same seeded-Untested upsert path `bulk_create` uses, and — by default — auto-creates or
reuses a defect per failed/blocked result, linked via rftc-008's `ExecutionDefects::Linker`, so the plugin's
mandatory-defect-on-failure rule is satisfied with zero manual steps. Unmatched results are reported, never
silently dropped. The plugin itself never parses JUnit/TAP/Newman — that is the CLI's (rftc-017) job; this
endpoint only accepts the already-normalized JSON.

---

## Core Functional Cases

---

### RFTC016-1: Happy path — automation_key match (Passed) + numeric id match (Failed), auto-defect created

**User Role:** Admin (via HTTP Basic auth, same auth path as `bulk_create`)
**Priority:** P1
**Preconditions:** Dedicated project `RFTC-016 CI Ingest QA` (id=2); admin added as an explicit Manager member
(see header note); Run #5 bootstrapped via `bootstrap_run.json` against suite "CI Ingest" (id=3, 2 test cases:
#23 "test_login_valid" with Automation Key `test_login_valid`, #24 "Apply valid discount code at checkout", no
key), environment `CI`.
**Steps:**
1. `POST /testcase_ci/ingest_results.json` with `match_by: ['automation_key', 'id']` and two results: `{key:
   'test_login_valid', status: 'passed'}`, `{key: '24', status: 'failed', message: '...SAVE10 discount...assert
   100.0 == 90.0'}`.

**Expected Result:**
- HTTP 200; both results matched (0 unmatched); `#23` resolved via `automation_key`, `#24` via `id`; the failed
  result auto-creates exactly one new defect and links it; counts reflect 1 passed / 1 failed.

**Actual Result:** PASS.
```json
{"status":"success","message":"Ingested 2 results (2 matched, 0 unmatched)","counts":{"passed":1,"failed":1,"skipped":0,"blocked":0,"unmatched":0},
 "matched":[{"key":"test_login_valid","issue_id":23,"matched_by":"automation_key","defect_id":null},
            {"key":"24","issue_id":24,"matched_by":"id","defect_id":25,"defect_reused":false}],
 "defects":{"created":[25],"reused":[]}}
```

---

### RFTC016-2 (SACRED): Re-ingesting the SAME failure is idempotent — defect reused, not duplicated

**Priority:** P1 — the exact concurrency/idempotency guarantee the service's own code comments call out as a
hardening fix ("two CI retries ingesting the same failed testcase+run+environment used to both create a
duplicate defect")
**Steps:**
1. Immediately after RFTC016-1, re-`POST ingest_results.json` for the SAME `{key: '24', status: 'failed', ...}`
   against the same run+environment.

**Expected Result:** HTTP 200; `defect_reused: true`; the SAME defect id (#25) returned; `defects.created` empty,
`defects.reused: [25]`.
**Actual Result:** PASS. Exact same defect #25 reused; zero new defects created.

---

### RFTC016-3: Unmatched result reported, not silently dropped (default `on_unmatched: report`)

**Priority:** P1
**Steps:**
1. `POST ingest_results.json` with a result whose `key` (`test_brand_new_feature`) matches nothing in the run.

**Expected Result:** HTTP 200 (a mapping gap is a warning, not a failure, in default mode); the result appears in
the `unmatched` array with `reason: "no_match"`; `counts.unmatched` reflects it.
**Actual Result:** PASS. `{"unmatched":[{"key":"test_brand_new_feature","status":"passed","reason":"no_match"}]}`.

---

### RFTC016-4: `on_unmatched: "error"` makes an unmatched result a hard failure

**Priority:** P2
**Steps:**
1. Same unmatched key as RFTC016-3, this time with `on_unmatched: "error"`.

**Expected Result:** HTTP 422; clean error naming the unmatched-results condition; the `unmatched` array is still
returned so the caller can see exactly what failed to map; nothing written.
**Actual Result:** PASS. `{"status":"error","errors":["One or more results did not match a test case
(on_unmatched=error); nothing was recorded."],"unmatched":[...]}`.

---

### RFTC016-5: Environment not configured on the run is rejected

**Priority:** P1 — same validation class as the pre-existing `bulk_create` guard documented in CLAUDE.md §13
("A result submitted with an environment name that isn't actually configured on that Run is rejected outright")
**Steps:**
1. `POST ingest_results.json` with `environment: "staging-not-configured"` against a run only configured for
   `CI`.

**Expected Result:** HTTP 422; clean message; nothing written.
**Actual Result:** PASS. `{"status":"error","errors":["environment must match one of the run's configured
environments."]}`.

---

## Permission / Security Cases

---

### RFTC016-6: Anonymous caller rejected

**Priority:** P1
**Steps:** `POST ingest_results.json` with no credentials at all.
**Expected Result:** HTTP 401; no body needed, just the rejection.
**Actual Result:** PASS. 401, empty body (matches the controller's inline anonymous-reject pattern, identical to
`bulk_create`).

---

### RFTC016-7 (SACRED/SEC-001): `project_id` is cross-checked against the run's OWN project, never trusted alone

**Priority:** P1 — the controller's own comment calls this out explicitly: "authorize on the run's OWN project
(derived from the record), never on the forgeable `params[:project_id]`"
**Steps:** `POST ingest_results.json` for run #5 (real project id 2) with `project_id: 999`.
**Expected Result:** HTTP 422 (not 403/404 — the run and its real project both resolve fine; only the caller's
cross-check value is wrong); clean message; nothing written.
**Actual Result:** PASS. `{"error":"The run does not belong to the given project_id."}`.

---

## Edge / Validation Cases

---

### RFTC016-8: Empty `results` array rejected before any work

**Priority:** P2
**Steps:** `POST ingest_results.json` with `results: []`.
**Expected Result:** HTTP 422; clean "results cannot be empty" message.
**Actual Result:** PASS. `{"status":"error","errors":["results cannot be empty."]}`.

---

### RFTC016-9: Nonexistent `run_id` returns a clean 404, not a 500

**Priority:** P2
**Steps:** `POST ingest_results.json` with `run_id: 99999` (does not exist).
**Expected Result:** HTTP 404; clean "run not found" message.
**Actual Result:** PASS. `{"error":"Run not found for the given run_id."}`.

---

## Gap Follow-up Session (2026-10-15, same day) — closing most of the original "Not Executed" list

Run #6 bootstrapped in the same project/suite with 3 more fixtures added for this pass: `#26`/`#27` ("Checkout
flow renders correctly" — same subject, deliberately duplicated), `#28` (Automation Key `test_login_valid` —
deliberately duplicated from `#23`), plus `#29` (a real Bug-tracker issue, for the caller-supplied-defect cases).

---

### RFTC016-10: `match_by: ['automation_key']` — two test cases sharing the same key → `ambiguous_key`, not a crash

**Priority:** P2
**Steps:** `POST ingest_results.json`, `match_by: ['automation_key']`, result `{key: 'test_login_valid', status:
'passed'}` where BOTH `#23` and `#28` carry that same Automation Key value.
**Expected Result:** HTTP 200; the result is reported unmatched with `reason: "ambiguous_key"` — never guesses
which of the two to write to.
**Actual Result:** PASS. `{"unmatched":[{"key":"test_login_valid","status":"passed","reason":"ambiguous_key"}]}`.

---

### RFTC016-11: `match_by: ['subject']` — two test cases sharing the same subject → `ambiguous_subject`

**Priority:** P2
**Steps:** `POST ingest_results.json`, `match_by: ['subject']`, result `{key: 'Checkout flow renders correctly',
status: 'passed'}` where both `#26` and `#27` share that exact subject.
**Expected Result:** HTTP 200; unmatched with `reason: "ambiguous_subject"`.
**Actual Result:** PASS. `{"unmatched":[{"key":"Checkout flow renders correctly","status":"passed","reason":"ambiguous_subject"}]}`.

---

### RFTC016-12: `match_by: ['subject']` happy path — a unique subject resolves cleanly

**Priority:** P2
**Steps:** `POST ingest_results.json`, `match_by: ['subject']`, result `{key: 'Apply valid discount code at
checkout', status: 'passed', duration_ms: 2500}` (`#24`'s subject, unique in the suite).
**Expected Result:** HTTP 200; matched via `subject`, resolves to `#24`.
**Actual Result:** PASS. `{"matched":[{"key":"Apply valid discount code at checkout","issue_id":24,"matched_by":"subject",...}]}`.

---

### RFTC016-13: `duration_ms` is actually persisted in the structured column, not just in the notes prose (rftc-020 cross-check)

**Priority:** P2
**Steps:** After RFTC016-12, query `issue_status_results` directly for that row.
**Expected Result:** `duration_ms` column holds the exact integer submitted (2500), alongside the human-readable
`notes` text.
**Actual Result:** PASS. `psql`: `id=14, issue_id=24, run_id=6, duration_ms=2500, notes='CI: passed — (2500 ms)'`
— both the structured column and the notes text agree.

---

### RFTC016-14: Caller-supplied `defect_ids` (`auto_defect: false`) with a real, visible defect — accepted, no new defect created

**Priority:** P2
**Steps:** `POST ingest_results.json`, `auto_defect: false`, result `{key: '26', status: 'failed', defect_ids:
'29'}` where `#29` is a real pre-existing Bug-tracker issue in-project.
**Expected Result:** HTTP 200; matched, `defect_id: 29`; `defects.created`/`defects.reused` both empty (this path
bypasses the create-or-reuse logic entirely — the writer's own CSV-reconcile builds the join from the supplied
id).
**Actual Result:** PASS. `{"matched":[{"key":"26","issue_id":26,"matched_by":"id","defect_id":29,"defect_reused":null}],"defects":{"created":[],"reused":[]}}`.

---

### RFTC016-15: Caller-supplied `defect_ids` omitted with `auto_defect: false` — a clean PER-ROW error, not a call-level failure

**Priority:** P2 — distinguishes a per-row skip from the call-level 4xx errors in RFTC016-4/5/7/8/9
**Steps:** Same as RFTC016-14 but no `defect_ids` supplied, for a different failed result (`#28`).
**Expected Result:** HTTP 200 overall (the call itself succeeded); that one row is NOT written and appears in the
top-level `errors` array with a clear message; `counts` show nothing recorded for it.
**Actual Result:** PASS. `{"status":"success",...,"errors":[{"key":"28","error":"A failed or blocked result
requires a defect. Enable auto_defect or supply defect_ids."}]}` — confirms the service distinguishes row-level
skips (reported, HTTP 200) from call-level validation failures (HTTP 4xx, nothing written at all).

---

### RFTC016-16 (SACRED/DoS cap): `MAX_RESULTS` — 1001 results in one call is rejected before any write

**Priority:** P1 — the exact DoS-shaped cap the service's own `MAX_RESULTS = 1000` constant exists for
**Steps:** `POST ingest_results.json` with a generated 1001-element `results` array.
**Expected Result:** HTTP 422; clean "too many results" message; nothing processed.
**Actual Result:** PASS. `{"status":"error","errors":["Too many results in one request (max 1000). Split the
payload."]}`.

---

## Second Follow-up (same day) — the test-account password turned out to be known, unblocking both remaining permission cases

The `test` user's password (`12345678`, same as `admin`'s) was confirmed by the user directly — the earlier
password-reset block was a non-issue once the existing credential was supplied. Both previously-blocked
permission scenarios were then executed for real.

---

### RFTC016-17: Non-admin, `:execute_testcase`-only caller — happy path succeeds (no `:create_run` needed to ingest)

**Priority:** P1
**Steps:** Temporarily enabled `execute_testcase` on the Developer role (kept `create_run` OFF); authenticated as
`test` (Developer member of this project, HTTP Basic); `POST ingest_results.json`, `match_by: ['id']`, `{key:
'23', status: 'passed'}`.
**Expected Result:** HTTP 200; written successfully — confirms the controller's permission gate is genuinely
`:execute_testcase` (or admin), not secretly requiring `:create_run` or admin for this endpoint.
**Actual Result:** PASS. `{"matched":[{"key":"23","issue_id":23,"matched_by":"id","case_status_id":2,...}]}`.

---

### RFTC016-18 (SACRED): `:add_issues` denied at the exact defect-create point — fails closed, nothing written

**Priority:** P1 — the controller's own comment: "`:add_issues` is enforced inside the service at the exact
defect-create point" (not pre-checked in the controller, so this specifically tests the service-level gate)
**Steps:** With `execute_testcase` still enabled but **all `add_issues` permissions removed** from the Developer
role; same `test` user; `POST ingest_results.json`, `{key: '23', status: 'failed', message: 'needs a fresh
defect'}` (requires auto-defect-create, since `#23` had no existing reusable defect).
**Expected Result:** HTTP 403; clean, specific message; the whole write rolls back (the `PermissionDenied`
exception is raised mid-transaction) — no `IssueStatusResult` row written for this attempt at all.
**Actual Result:** PASS. `{"status":"error","errors":["Permission denied: the Add issues permission is required
to auto-create a defect for a failure in this project."]}`. DB-confirmed: `issue_status_results` for
`(run_id=6, issue_id=23)` still shows only the one earlier Passed row (id=13) — the denied attempt wrote nothing.

Both role changes (Developer: `execute_testcase` on, `add_issues` off) were reverted immediately after, confirmed
back to the original `execute_testcase=false / add_issues=true(all trackers)` state.

---

## Still Not Executed (genuine tooling/environment blockers)

- **`automation_key` unconfigured** (`error_ci_ingest_automation_key_unconfigured`) and **defect tracker
  unconfigured** (`error_ci_ingest_defect_tracker_unconfigured`) — not exercised. Both require temporarily
  un-setting an instance-wide plugin setting (`automation_key_cf_id` / `defected_tracker`) that other suites on
  this same instance depend on being configured; doing so safely needs a dedicated throwaway instance rather than
  this shared one, to avoid any risk of leaving it misconfigured for other concurrent testing.
- **rftc-017 (CI results CLI) and rftc-038 (platform recipes)** — out of scope for this file; need their own
  `RFTC-017_...`/`RFTC-038_...` suites once this endpoint's coverage is considered sufficient.

## Coverage Summary

**18/18 executed scenarios — 18/18 PASS, zero bugs found** in `ingest_results.json` itself. Every core functional
path, matching strategy (`id`/`subject`/`automation_key`, happy + ambiguous), BOTH permission boundaries
(anonymous rejection AND the non-admin `:execute_testcase`/`:add_issues` split), validation edges, the
idempotency guarantee, the DoS cap, and the `duration_ms` structured-column cross-check all behave exactly per
spec. Only the two unconfigured-setting error branches remain untested, deliberately, to avoid destabilizing a
shared instance. (Separately, this same session's exploratory testing around user deletion surfaced a real,
unrelated defect — `BUG-TCM-064`, reported to production as #123501 — in the Testcase Reports feature, not in
this endpoint.)
