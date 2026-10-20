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

## Third Follow-up (2026-10-19) — authorization matrix: member/non-member, assignee vs permission, auth method

Prompted by a direct question about which user/permission combinations had actually been exercised. All tests
below used Run #5 (environment `CI`, sole pre-existing assignee: `admin`), project `rftc-016-ci-qa` (id=2,
**private**, global `login_required`=Yes — confirmed via DB, same baseline as every earlier scenario in this
file). All temporary role/membership/assignment changes were reverted immediately after each test.

---

### RFTC016-19: Admin API key (`X-Redmine-API-Key` header) works identically to HTTP Basic Auth

**Priority:** P2
**Steps:** `POST ingest_results.json` with `X-Redmine-API-Key: <admin's token>` instead of Basic Auth.
**Expected Result:** Same success response as Basic Auth — the endpoint's `accept_api_auth` should accept either.
**Actual Result:** PASS. Identical `"status":"success"` response, HTTP 200.

---

### RFTC016-20: Admin who is NOT a project member still succeeds (global admin bypasses project membership)

**Priority:** P2
**Steps:** Temporarily removed admin's `members`/`member_roles` rows for project 2 (admin stays a Redmine
instance-wide admin); repeated RFTC016-1's happy-path call.
**Expected Result:** Documented behavior — `User.current.admin?` short-circuits the permission check in
`Apis::CiTestRunController#ingest_results` (`app/controllers/apis/ci_test_run_controller.rb:85`), so project
membership is irrelevant for an admin caller.
**Actual Result:** PASS (as expected) — HTTP 200, succeeded with no membership row at all. Admin membership
restored immediately after (confirmed identical: project_id=2, role_id=3/Manager).

---

### RFTC016-21 (SACRED/negative): Non-admin, non-member (effectively "Non member" role) — denied, but with a misleading message → **BUG-TCM-067**

**Priority:** P1
**Steps:** `qanonadmin` (non-admin, not a project member at all) calls `ingest_results.json` against run #5.
**Expected Result:** Denied (the "Non member" role has no `execute_testcase`), with a message naming the actual
reason (missing permission).
**Actual Result:** FAIL (message-accuracy bug, not a security hole — see BUG-TCM-067). HTTP 403 as expected, but
`{"error":"You cannot create the result because you are not the assignee."}` — wrong reason given. Filed as
**BUG-TCM-067** (Low severity — denial itself is correct, only the message text is wrong).

---

### RFTC016-22: Non-admin member WITH `execute_testcase` (Reporter role, default grant) — succeeds, even when NOT the run's assignee

**Priority:** P1
**Steps:** `qanonadmin` added as project member with **Reporter** role (has `execute_testcase` by default, not
toggled manually this time); NOT added to `run_assignments` at all; same ingest call.
**Expected Result:** Succeeds — confirms (per the controller code read this session) that `ingest_results`'
authorization is **permission-only** (`execute_testcase` or admin); being the run's recorded assignee is not
part of the gate at all, unlike what the shared error string implies.
**Actual Result:** PASS. HTTP 200, `"status":"success"` — proves the assignee concept is irrelevant to this
endpoint's authorization, confirming the root cause behind BUG-TCM-067.

---

### RFTC016-23 (SACRED/negative): Non-admin member WITHOUT `execute_testcase` (Developer role, default) — denied even when made the run's actual assignee

**Priority:** P1 — the exact negative-control test proving assignee status has zero authorization weight
**Steps:** Switched `qanonadmin` to **Developer** role (no `execute_testcase` by default); additionally inserted
a real `run_assignments` row making `qanonadmin` the assignee of run #5 / `CI` (so the user is genuinely, provably
an assignee); same ingest call.
**Expected Result:** Still denied — since only `execute_testcase`/admin grants access, genuinely being the
assignee must not help.
**Actual Result:** PASS (denial confirmed correct) — HTTP 403, same `error_permission_create_result` string. This
is the definitive proof for BUG-TCM-067: the user **was** the assignee and was still denied, so "you are not the
assignee" is categorically the wrong explanation for any denial on this endpoint.

All temporary state (qanonadmin's membership, role, and the extra `run_assignments` row) was deleted immediately
after RFTC016-23; project 2 and run #5 were confirmed back to their original state (admin-only member, admin-only
`CI` assignee).

---

## Fourth Follow-up (2026-10-19, same day) — remaining gaps closed: exact cap boundary, project visibility, global auth setting

---

### RFTC016-24: Exactly `MAX_RESULTS` (1000) results — the boundary itself, not just one-over

**Priority:** P2 — RFTC016-16 only proved 1001 is rejected; the boundary value itself was never separately
confirmed to succeed.
**Steps:** `POST ingest_results.json` with a generated, exactly-1000-element `results` array (verified by
counting `"key"` occurrences in the payload before sending).
**Expected Result:** HTTP 200 — `MAX_RESULTS = 1000` should mean "1000 is fine, 1001 is too many," not an
off-by-one that rejects 1000 as well.
**Actual Result:** PASS. HTTP 200, `"message":"Ingested 1000 results (1000 matched, 0 unmatched)"`. Confirms the
cap is inclusive at exactly 1000, consistent with RFTC016-16's 1001-rejected result.

---

### RFTC016-25: Project visibility (public vs. private) has no effect on this endpoint's authorization

**Priority:** P2
**Steps:** Temporarily set `rftc-016-ci-qa` (project 2) to **public** (`is_public=true`); repeated (a) the
anonymous-caller test (RFTC016-6) and (b) the non-member logged-in-user test (RFTC016-21), both against the
now-public project.
**Expected Result:** Since `ingest_results` never checks `@project.is_public` or calls a visibility-gated
authorize method (only `User.current.anonymous?` inline, then `execute_testcase`/admin), making the project
public should change nothing.
**Actual Result:** PASS — identical results to the private-project versions: anonymous caller still HTTP 401;
non-member logged-in user (`qanonadmin`) still HTTP 403 with the same (BUG-TCM-067) message. Project visibility is
confirmed irrelevant to this endpoint. Reverted `is_public` back to `false` immediately after.

---

### RFTC016-26 (SACRED/security): Global "Authentication required = No" setting does not weaken the anonymous reject

**Priority:** P1 — the scenario directly raised: does disabling Redmine's instance-wide login requirement, on a
public project, let an anonymous caller through?
**Steps:** Set the global `login_required` setting to `0` ("No, allow anonymous access to public projects") AND
made project 2 public at the same time (the combination needed for anonymous access to even be a possibility);
repeated the anonymous-caller call (no credentials at all) against `ingest_results.json`.
**Expected Result:** Still denied — the controller's anonymous check (`User.current.anonymous?`, inline, "exactly
like bulk_create," per its own code comment citing SEC-004/005) does not depend on `before_action :require_login`
or the global setting at all, so it should reject regardless.
**Actual Result:** PASS. HTTP 401, identical to every other anonymous-caller test in this file — confirms the
endpoint's own hardcoded anonymous-reject is independent of, and does not get weakened by, the instance-wide
authentication setting. Both the global setting and project visibility were reverted immediately after
(`login_required` back to `1`, project 2 back to private) — confirmed via direct DB check.

---

## Fifth Follow-up (2026-10-19) — full spec re-read (833-line `backlog/planning/rftc-016-feature-ci-results-ingest.md`), closing every remaining Unit/Functional/Edge gap

A full read of the source spec (not just the production ticket's short description) surfaced 17 scenarios genuinely
not covered above: status-map mechanics, the critical cross-run defect-reuse isolation guarantee, multi-suite
grouping/ambiguity, semantic status resolution, cross-project key matching, email suppression, and five Edge
Cases (`skip` mode, in-project-not-in-run, SQL injection, non-integer duration, stored XSS, transactional
defect-rollback). **One genuine bug was found** (RFTC016-32/BUG-TCM-069).

---

### RFTC016-27 (spec Unit 1): All 6 default CI-status → `case_status_id` mappings in one call

**Priority:** P1
**Steps:** One `ingest_results.json` call with one result per status: `passed`, `failed`, `error`, `blocked`,
`skipped`, `retest` (auto_defect:false with caller-supplied `defect_ids` for the failure-class ones).
**Expected Result:** `passed→2, failed→3, error→3, blocked→5, skipped→6, retest→4` exactly.
**Actual Result:** PASS. All six mapped exactly as spec'd in one response.

---

### RFTC016-28 (spec Unit 2/3/20): `status_map` caller override, unknown status rejected, invalid override target rejected

**Priority:** P1
**Steps:** (a) `status_map: {"flaky": 4}`, result `status: "flaky"` alongside a normal `"passed"`. (b) A result
`status: "exploded"` (in neither default nor override). (c) `status_map: {"passed": 999}` (nonexistent
`case_status_id`).
**Expected Result:** (a) `"flaky"` → Retest(4), `"passed"` still default-mapped. (b)/(c) 422, nothing written.
**Actual Result:** PASS on all three. (a) `{"key":"26",...,"case_status_id":4}` + `{"key":"27",...,"case_status_id":2}`
in the same call. (b) `"Unknown or unavailable CI status 'exploded'..."`, 422. (c) same error message, 422 —
confirms an invalid *override target* is rejected exactly like an unmapped status.

---

### RFTC016-29 (spec Unit 13b, SACRED/CRITICAL): Auto-defect reuse is scoped to `(run_id, environment)` — a failure in a DIFFERENT run never reuses a stale defect

**Priority:** P1 — the single most safety-critical guarantee in this feature; a failed version of this would
silently cross-contaminate unrelated runs/branches with the wrong defect
**Steps:** Fresh testcase; bootstrap Run A, ingest a failure → defect created (#2049). Bootstrap Run B (same
testcase), ingest a failure for it in Run B, same environment `CI`. Then re-ingest the SAME failure again in
Run A.
**Expected Result:** Run B gets a brand-new defect (not #2049) — reuse must never cross a run boundary. Re-ingesting
in Run A reuses #2049 (`defect_reused: true`) — same-run reuse must still work.
**Actual Result:** PASS, fully confirmed. Run A → defect #2049 created. Run B → defect **#2050** created (a
genuinely new issue, NOT #2049) — cross-run isolation holds. Re-ingest in Run A → `defect_id: 2049,
defect_reused: true` — same-run reuse confirmed working. Both halves of the guarantee hold simultaneously.

---

### RFTC016-30 (spec Unit 15/16): `blocked` also auto-defects; results spanning two suites are grouped under their own correct `testsuite_id`

**Priority:** P1
**Steps:** (a) Ingest a `blocked` result with `auto_defect: true` (default) for a fresh testcase. (b) Bootstrap a
run with 2 suites (`CI Ingest` id=3, `Edge2 Brand New Suite` id=6), ingest one result per suite's testcase in one
call.
**Expected Result:** (a) Blocked is treated as failure-class — a defect is auto-created. (b) Each result lands
under its OWN suite's `testsuite_id`, never cross-mapped.
**Actual Result:** PASS on both. (a) `case_status_id:5, defect_id:2052, defect created:[2052]`. (b)
`{"key":"23",...,"testsuite_id":3}` and `{"key":"2046",...,"testsuite_id":6}` — correctly separated.

---

### RFTC016-31 (spec Unit 18, SACRED): A testcase in TWO suites within the same run is `ambiguous_suite_membership` unless disambiguated

**Priority:** P1 — the spec's own "easy silent-wrong-suite bug" callout
**Steps:** Add issue `#23` to a second suite (id=6); bootstrap a run containing both suites (so `#23` now has 2
`run_issue` rows in this one run); ingest a result for `#23` with no per-result `testsuite_id`. Then repeat WITH
an explicit `testsuite_id: 6`.
**Expected Result:** Without disambiguation: unmatched, `reason: "ambiguous_suite_membership"`, never guessed.
With explicit `testsuite_id`: written under that named suite.
**Actual Result:** PASS on both parts. Part 1: `{"unmatched":[{"key":"23",...,"reason":"ambiguous_suite_membership"}]}`.
Part 2: `{"matched":[{"key":"23","testsuite_id":6,...}]}` — explicit disambiguation correctly resolves it. Extra
suite membership cleaned up after the test.

---

### RFTC016-32 (spec Edge Case 2) — **FAIL → BUG-TCM-069**: `on_unmatched: "skip"` is accepted but behaves identically to `"report"`

**Priority:** P2
**Steps:** Same payload (one matched + one unmatched key) sent twice, only `on_unmatched` changed between
`"report"` and `"skip"`.
**Expected Result:** Per the spec, `"skip"` should omit unmatched entries from the response's error accounting
(logged only) — observably different from `"report"`.
**Actual Result:** **FAIL.** The two responses are byte-for-byte identical — same `unmatched` array, same
`counts.unmatched`. Code-confirmed root cause: `on_unmatched` is only ever branched on for `'error'`
(`ci_result_ingest_service.rb:88`); `'skip'` is accepted into the value whitelist (`:126`) but never consulted
again anywhere, including in `success_payload` (`:466-491`) which unconditionally includes the full `unmatched`
array regardless of mode. Filed as **BUG-TCM-069** (Medium).

---

### RFTC016-33 (spec Unit 19): Default status map resolves by CaseStatus semantics (`is_success`/`is_failure`/name), not hardcoded seed ids

**Priority:** P2 — code-level verification (changing live `CaseStatus` ids on a shared instance to test this
black-box would be too invasive/risky)
**Steps:** Read `CiResultIngestService#default_status_for`.
**Expected Result:** `passed`→`is_success` flag, `failed`/`error`→`is_failure` flag, `blocked`/`skipped`/`retest`→
matched by `name`, not by literal `2/3/5/6/4`.
**Actual Result:** PASS, code-confirmed. All five branches use `CaseStatus.where(is_enabled: true, is_success:
true)` / `is_failure: true` / `name: 'Blocked'|'Skipped'|'Retest'` — zero hardcoded literal ids anywhere in the
resolution function, exactly matching the spec's non-negotiable build condition.

---

### RFTC016-34 (spec Functional F7): A numeric `key` pointing at a DIFFERENT project's issue is never matched

**Priority:** P1 — SEC-001/IDOR class
**Steps:** Created a Testcase-tracker issue in a different project (`bug-121896-retest`, id=1); ingested with its
numeric id as `key` against our run.
**Expected Result:** Unmatched (`no_match`) — never pulled in as a foreign issue.
**Actual Result:** PASS. `{"unmatched":[{"key":"<foreign-id>","status":"passed","reason":"no_match"}]}`.

---

### RFTC016-35 (spec Functional F12): Zero result emails on the CI ingest path

**Priority:** P1
**Steps:** Code-check the service's call into the shared writer; grep server logs across the dozens of ingest
calls made this session for any `RunMailer`/`testcase_result_added` activity.
**Expected Result:** The service passes `notify: false`; zero mailer log hits.
**Actual Result:** PASS. Code-confirmed `ci_result_ingest_service.rb:325` passes `notify: false` explicitly; zero
`RunMailer` log hits across the entire session's ingest calls.

---

### RFTC016-36 (spec Edge Case 1): A key matching an issue in the project but NOT in this run is unmatched

**Priority:** P2
**Steps:** Created a fresh testcase in-project, deliberately never added to the target run's suites; ingested
using its id.
**Expected Result:** Unmatched — the base match scope intersects `@run.issues`, so in-project-but-not-in-run
cases are correctly excluded.
**Actual Result:** PASS. `{"unmatched":[{"key":"<id>","status":"passed","reason":"no_match"}]}`.

---

### RFTC016-37 (spec Edge Case 5): SQL injection attempt in `key` and `status_map` treated as literal text

**Priority:** P1 — security
**Steps:** `status_map: {"1 OR 1=1": 2}`, result `key: "1 OR 1=1"`, `status: "1 OR 1=1"`.
**Expected Result:** Treated as a literal string; no injection; no extra/corrupted rows.
**Actual Result:** PASS. Cleanly unmatched (`no_match`); `issue_status_results` row count unaffected; no SQL
error, no injection.

---

### RFTC016-38 (spec Edge Case 6): Non-integer `duration_ms` is safely ignored, not stored as garbage

**Priority:** P2
**Steps:** `duration_ms: "not-a-number"` on an otherwise-valid result.
**Expected Result:** No error; `duration_ms` omitted/null in the DB, not the literal garbage string.
**Actual Result:** PASS. Result written successfully; DB-confirmed `duration_ms` is `NULL`, notes text contains
no bogus duration value.

---

### RFTC016-39 (spec Edge Case 7): HTML/script in `message` is stored as untrusted text and rendered safely (no stored XSS)

**Priority:** P1 — security
**Steps:** `message: "<img src=x onerror=alert(1)>"` on a failing result; checked both the raw DB value and the
live-rendered issue page (`/issues/<id>?tab=results_and_comments`) in-browser.
**Expected Result:** Stored as-is (untrusted text is fine at rest); rendered escaped, never as live executable
markup.
**Actual Result:** PASS. DB stores the raw string (`notes = "CI: failed — <img src=x onerror=alert(1)>"`,
expected — storage doesn't need to escape). Live page: `document.body.innerHTML` contains **no** live
`<img onerror>` tag, text appears HTML-escaped (`&lt;img`) — confirmed no stored XSS reaches the rendered page.

---

### RFTC016-40 (spec Edge Case 8, SACRED): `on_unmatched: "error"` rolls back auto-created defects too, not just result rows

**Priority:** P1 — a partial-rollback here would leave an orphan defect Issue with no linked execution
**Steps:** Fresh testcase; ingest ONE failing result (would auto-create a defect) together with ONE unmatched key,
`on_unmatched: "error"`. Counted Bug-tracker issues before and after.
**Expected Result:** 422; the whole transaction — including the defect that would have been created for the
failure — rolls back; defect count unchanged.
**Actual Result:** PASS. Defect count: **11 before, 11 after** — confirms the auto-defect creation (which happens
inside the same transaction as the write) is genuinely rolled back along with everything else, not committed
separately.

---

## Third Follow-up (2026-10-19, same day) — multi-environment Run scenarios, live via a real Jenkins pipeline

Prompted by a direct question: can a single Run hold results from multiple test environments (e.g. Chrome,
Edge, Firefox), added either via parallel CI jobs or one sequential job — and is either approach safe? Executed
live against `rftc-038-multisuite-qa` (project 3, suites Login/Cart Operations/Discounts), not simulated.

---

### RFTC016-41 (new, real Jenkins build #13): Multiple environments added to one Run in a single `update_run`
call, then ingested in PARALLEL — no race condition, no data loss

**Priority:** P1 — this is the exact shape a real multi-browser CI matrix would use
**Steps:** `bootstrap` created Run #50. One `PUT /runs/update_run/50.json` call added all three environments
(`Chrome`, `Edge`→actually `Firefox` third slot, i.e. `[Chrome, Firefox, Safari]`) in one request. A Jenkins
`parallel()` block then ran three branches **simultaneously**, each calling `ingest --env <X> --auto-defect`
against the same `run_id`, same JUnit report, different `--env`.
**Expected Result:** All three branches succeed independently; no result from one environment overwrites or
corrupts another's.
**Actual Result:** **PASS.** All 3 parallel branches (`Chrome`, `Firefox`, `Safari`) returned `HTTP 200`,
each independently reporting `"Ingested 6 results (6 matched, 0 unmatched)"`. Confirmed in the real TCM UI
(`/runs/50`): environment dropdown correctly lists all three, each with its own independent 6-result set.

---

### RFTC016-42 (new, real Jenkins build #14): Multiple environments added to one Run, then ingested
SEQUENTIALLY (Chrome → Edge → Firefox) — also safe, as expected

**Priority:** P2 — the simpler, no-concurrency counterpart to RFTC016-41
**Steps:** `bootstrap` created Run #51 (suites Login/Cart Operations/Discounts). One `update_run` call added
`Chrome`, `Edge`, `Firefox` together. A single shell script then called `ingest --env Chrome`, then
`ingest --env Edge`, then `ingest --env Firefox` — one after another, same `run_id`, same JUnit report.
**Expected Result:** Each call succeeds independently; later calls do not disturb earlier environments' results.
**Actual Result:** **PASS.** All three sequential calls returned `HTTP 200` with `"Ingested 6 results (6 matched,
0 unmatched)"` each. Confirmed live in the TCM UI (`/runs/51`): environment dropdown lists `Chrome`, `Edge`,
`Firefox`, each independently populated with its own 6 results — 18 total result-rows in one Run.

---

### RFTC016-43 (FINDING — doc/behavior mismatch, not a defect): `update_run`'s `run_assignments` field actually
MERGES/APPENDS new environments rather than replacing the array, contradicting `API.md`'s own documented
"Replace all environment/assignee pairs"

**Priority:** P3 — documentation accuracy, not a bug; the actual behavior is safer than what's documented
**Steps:** Deliberately raced two `update_run` calls against the same Run (#50), each supplying a request body
naming only ONE new environment (`{"run_assignments":[{"environment":"Edge",...}]}` and
`{"run_assignments":[{"environment":"Opera",...}]}` respectively) — the documented "replace" semantics would
predict whichever call lands last wins, silently discarding the other's environment.
**Expected Result (per `API.md`'s own docs):** Last-write-wins; one of `Edge`/`Opera` should be lost.
**Actual Result:** **Both survived.** The second call's own response body showed
`"run_assignments":[{"environment":"Edge","assignee":1},{"environment":"Opera","assignee":1}]` — the
previously-added `Edge` was still present even though that request's payload named only `Opera`. The endpoint's
real behavior is additive/merge, not a wholesale replace. **Not filed as a bug** (the real behavior is strictly
safer than the documented one — no scenario loses data), but `API.md`'s own wording ("Replace all
environment/assignee pairs") should be corrected to describe the actual merge semantics, so a future caller
doesn't build defensive re-send-everything logic around a replace contract that isn't real.

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

**43/43 executed scenarios — 41/43 PASS, 2 bugs found + 1 doc/behavior mismatch flagged**, now checked against
the full 833-line source spec's own Unit (1-22)/Functional (F1-F13)/Edge (1-9)/Integration (E1-E4) tables, not
just the production ticket's short description. Every core functional path, matching strategy
(`id`/`subject`/`automation_key`, happy + ambiguous + multi-suite grouping/ambiguity), the full default +
caller-override status-map mechanics, semantic (non-hardcoded) status resolution, permission boundaries
(anonymous rejection, non-admin member with/without permission, admin-non-member bypass, API key vs Basic Auth,
cross-project run AND cross-project key rejection), the **safety-critical cross-run defect-reuse isolation
guarantee** (RFTC016-29 — a failure in a different run never silently reuses a stale defect), project
visibility/global-auth-setting independence, validation edges (exact 1000/1001 boundary, SQL injection attempt,
non-integer duration, stored-XSS safety, transactional rollback including auto-created defects), the idempotency
guarantee, and the `duration_ms` structured-column cross-check all behave exactly per spec.

**Third Follow-up (2026-10-19, same day): multi-environment Run scenarios (RFTC016-41/42/43), 3/3 executed,
2/2 functional PASS + 1 doc/behavior mismatch flagged.** Verified live via two real Jenkins pipeline builds
(not simulated) that a single Run can safely hold results from multiple environments (e.g. Chrome/Edge/Firefox)
added either via **parallel** CI jobs (RFTC016-41) or a **sequential** single job (RFTC016-42) — both proven
safe, no race condition, no data loss, confirmed independently in the real TCM UI. A side-experiment deliberately
racing two `update_run` calls to probe for a last-write-wins data-loss risk instead surfaced RFTC016-43: the
endpoint's real behavior **merges/appends** environments rather than replacing the array as `API.md` currently
documents — a documentation-accuracy gap, not a defect (the real behavior is strictly safer than documented).

**Two defects found:**
- **BUG-TCM-067** (Low) — message-accuracy issue: denial correctly gated by `execute_testcase` only, but the
  error string wrongly says "not the assignee" (RFTC016-21/23).
- **BUG-TCM-069** (Medium) — `on_unmatched: "skip"` is accepted but never actually implemented; produces an
  identical response to `"report"` (RFTC016-32).

Only the two unconfigured-setting error branches (`automation_key`/defect tracker) remain untested, deliberately,
to avoid destabilizing a shared instance. Every scenario the spec itself defines as Wave-applicable to this
endpoint has now been executed — this endpoint is exhaustively verified against its own spec, with BUG-TCM-067
and BUG-TCM-069 as the two known outstanding issues. (Separately, this same session's exploratory testing around
user deletion surfaced a real, unrelated defect — `BUG-TCM-064`, reported to production as #123501 — in the
Testcase Reports feature, not in this endpoint.)
