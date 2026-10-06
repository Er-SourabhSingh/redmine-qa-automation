> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121875** ("rftc-008 — Defect ↔ execution many-to-one linking"),
> whose own spec lives in the **product repository**
> (`backlog/planning/rftc-008-feature-defect-execution-linking.md`), **not** in this QA repo. This feature is
> **not part of** `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s 202-case scope either — it was tested separately, on
> explicit user request, directly against its own spec's embedded "Test Cases" tables (Unit/Functional/Edge,
> numbered `U1`–`U17`, `F1`–`F15`, `Edge 1`–`9`) and its "QA Test Plan" section.
>
> **ID prefix**: every case here is `RFTC008-<original-spec-number>` (e.g. `RFTC008-F2`, `RFTC008-U3`,
> `RFTC008-Edge4`) — the `RFTC008-` prefix exists because the spec's own `U1`/`F1`/`Edge 1` numbering is reused
> verbatim by the **sibling** spec rftc-009 (see `RFTC-009_EXTERNAL_SPEC_CI_BOOTSTRAP_RUN.md`) — without the
> prefix, "F1" would be ambiguous between the two files.
>
> **Executed**: 2026-10-06, against Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`).
> Results companion: `reports/RFTC-008_EXTERNAL_SPEC_RESULTS.md`. Bugs found: **BUG-TCM-044** (Critical),
> **BUG-TCM-045** (Low) — see `bugs/_index.md`.

# Test Cases — Redmineflux Testcase Management — rftc-008: Defect ↔ Execution Many-to-One Linking

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.1.0
- Redmine version: 6.x (Docker `localhost:3015`)
- Path: plugins/redmineflux_testcase_management_qa
- Production ticket: #121875 (ztflux)

## Feature summary

A failed/blocked execution can be linked to an **existing** defect (not just a newly-created one); many
executions can link to the **same** defect (many-to-one); a bulk-link action links a whole selection in one
all-or-nothing transaction; every link/unlink keeps the legacy `defect_ids` CSV and `IssueRelation` in sync; a
reverse "Linked Test Executions" panel on the defect's own issue page lists every execution linked to it. Backed
by three new JSON endpoints on `IssueStatusResultsController`: `link_defect`, `unlink_defect`,
`defect_executions`.

---

## Core Functional Cases

---

### RFTC008-F1: Link a single failed execution to an existing defect

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. Identify a Failed `IssueStatusResult` with no existing defect link.
2. `POST /testcase_status_results/link_defect.json` with `{project_id, defect_issue_id, execution_ids: [<id>]}`.

**Expected Result:**
- HTTP 201; response lists the new link (`execution_id`, `defect_issue_id`, `link_id`); an `ExecutionDefect` join
  row is created; the execution's `defect_ids` CSV is recomputed to include the defect; an
  `IssueRelation(relation_type: 'defect')` testcase→defect is created.

**Actual Result:** PASS. 201; join row created; `defect_ids` recomputed correctly; `IssueRelation` created.

---

### RFTC008-F2 / U3: Bulk-link many executions to the SAME one defect (the core many-to-one claim)

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. Create 2 more clean Failed/Blocked executions (different testcases, can span different runs).
2. `POST link_defect.json` with `execution_ids` containing both, same `defect_issue_id` as RFTC008-F1.
3. `GET /defects/<id>/executions.json` for that defect.

**Expected Result:**
- HTTP 201 for the bulk call; the reverse view now lists **all three** executions (the one from F1 + these two),
  across both a Failed and a Blocked status, across 2 different runs, all pointing at the one defect.

**Actual Result:** PASS. Confirmed 3 distinct executions (2 different runs, one Failed + one Blocked status) all
linked to the same one defect; reverse view correctly lists all 3 with full run/suite/environment/status
context.

---

### RFTC008-F4 (SACRED): Bulk link is all-or-nothing — one invalid row rejects the WHOLE batch

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — security/data-integrity invariant
**Steps:**
1. `POST link_defect.json` with `execution_ids` containing one genuinely valid Failed execution **and** one
   Passed execution, same `defect_issue_id`.

**Expected Result:**
- HTTP 422; the Passed execution is named in the `errors` array; **the valid Failed execution is also NOT
  linked** — zero rows committed for the whole batch (diverges deliberately from `bulk_create`'s legacy
  partial-commit behaviour).

**Actual Result:** PASS. 422; confirmed via DB that the otherwise-valid execution has no join row after the
call — true all-or-nothing, not partial commit.

---

### RFTC008-F5 (SACRED): Duplicate link is a no-op, not an error

**User Role:** QA Manager (`qa.manager`)
**Priority:** P2
**Steps:**
1. `POST link_defect.json` for an (execution, defect) pair already linked (from RFTC008-F1).

**Expected Result:**
- Second call does not create a second join row; still exactly one; non-error response.

**Actual Result:** PASS. Returned the same `link_id` as the first call; no duplicate row.

---

### RFTC008-F6 (SACRED): Linking a Passed execution is rejected

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. `POST link_defect.json` targeting a Passed (not Failed/Blocked) execution.

**Expected Result:**
- HTTP 422 `error_execution_not_failed_or_blocked`-style message; no join row created.

**Actual Result:** PASS. 422, clean error naming the failure/blocked gate requirement.

---

### RFTC008-F7 / U8 / U9 / U10: Unlink removes the join, recomputes the CSV, and retains/removes the relation correctly

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. `POST unlink_defect.json` for one of the linked (execution, defect) pairs from RFTC008-F1, where that
   testcase has no OTHER execution still linking the same defect.

**Expected Result:**
- 200; the join row is gone; `defect_ids` CSV recomputed (to empty, since it was the only link); the
  `IssueRelation` testcase→defect is also removed, since no other execution of that testcase still links it.

**Actual Result:** PASS. Join row gone; `defect_ids` recomputed to `""`; `IssueRelation` correctly removed.

---

### RFTC008-F10 (SACRED/CRIT-1 half): `bulk_create` (the legacy write path) writes the join automatically

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — central design decision
**Steps:**
1. `POST /testcase_status_results/bulk_create.json` for a Failed result, including a `defect_ids` field pointing
   at an existing defect — **not** via the new `link_defect` endpoint at all.

**Expected Result:**
- The result saves normally **and** an `ExecutionDefect` join row is created automatically (the
  `after_save :reconcile_execution_defects` hook), plus the matching `IssueRelation`.

**Actual Result:** PASS. Join row and `IssueRelation` both created automatically from the legacy `bulk_create`
path, with zero changes needed to that controller's own calling code.

---

### RFTC008-F11 / U6 (SI-8): Reverse view answers from the indexed join

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. `GET /defects/<id>/executions.json` for a defect with 3 linked executions.

**Expected Result:**
- 200; JSON lists all 3 executions with run/suite/environment/status, served from the `ExecutionDefect` join
  (never a `defect_ids` CSV `LIKE` scan).

**Actual Result:** PASS. Also separately confirmed: a `report_defect` call from a completely different
controller (`Apis::McpTestcaseController`, earlier in this same session) had already produced a real
`ExecutionDefect` join row automatically — direct, real-data proof of CRIT-1 (see RFTC008-F14).

---

### RFTC008-F14 (SACRED/CRIT-1): A `report_defect` link (a different controller entirely) shows up in the reverse view

**User Role:** QA Engineer (`qa.engineer`, via API key)
**Priority:** P1 — this is the feature's central design decision
**Steps:**
1. Use the pre-existing, un-refactored `report_defect` flow (`Apis::McpTestcaseController`, a completely
   different controller from the one hosting the new `link_defect` code) to create a new defect and link it to a
   failed execution.
2. `GET /defects/<that id>/executions.json`.

**Expected Result:**
- The execution created via `report_defect` IS listed in the reverse view — the `after_save
  :reconcile_execution_defects` hook wrote the join even though `report_defect` never called the new `Linker`
  service at all. Proves the join cannot silently drift from a still-live legacy write path.

**Actual Result:** PASS. Confirmed with real data from earlier in this session (defect #92, created via
`report_defect` during TC-API-07-05): `ExecutionDefect` join row existed and the reverse view listed it
correctly, with zero extra action taken.

---

## Permission / Security Cases (all SACRED per the spec)

---

### RFTC008-F3a: Anonymous caller rejected

**User Role:** none (unauthenticated)
**Priority:** P1
**Steps:**
1. `POST link_defect.json` with no credentials at all.

**Expected Result:** HTTP 401; no join row.
**Actual Result:** PASS.

---

### RFTC008-F3b: Caller without `:execute_testcase` rejected

**User Role:** Reporter (`reporter`, lacks `:execute_testcase`)
**Priority:** P1
**Steps:**
1. `POST link_defect.json` as a project member who lacks `:execute_testcase`.

**Expected Result:** HTTP 403; no join row.
**Actual Result:** PASS functionally (403, nothing created). **Note (→ BUG-TCM-045, Low):** the error message
reused is `"You cannot create the result because you are not the assignee."` — borrowed from `bulk_create`'s
assignee-specific denial, misleading since this action performs no assignee check at all.

---

### RFTC008-F8 (IDOR): Cross-project execution id rejected

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1
**Steps:**
1. `POST link_defect.json` with `project_id: 1` but an `execution_id` belonging to a **different** project.

**Expected Result:** The foreign id does not resolve under the project-scoped query; reported in `errors`; no
join row; no cross-project data leak.
**Actual Result:** PASS. `{"error":"Execution not found in this project."}`; nothing committed.

---

### RFTC008-F9: Defect not visible / in another project rejected

**User Role:** QA Engineer (`qa.engineer`)
**Priority:** P1
**Steps:**
1. `POST link_defect.json` with a `defect_issue_id` belonging to another project the caller cannot see.

**Expected Result:** HTTP 422 `error_defect_not_visible`; no join row.
**Actual Result:** PASS.

---

### RFTC008-F12: `defect_executions` (reverse view) requires visibility to read

**User Role:** `qa.other` (member of a different project only)
**Priority:** P1
**Steps:**
1. `GET /defects/<id>/executions.json` for a defect in a project the caller cannot see.

**Expected Result:** HTTP 403; no execution data returned.
**Actual Result:** PASS. `{"error":"Unauthorized access"}`; zero data leaked.

---

### RFTC008-F15 (SACRED/SI-11, IDOR): Native issue move does not leak old-project executions

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — subtle, easy to get wrong
**Steps:**
1. With a defect linked to 2 executions in project A, move the defect issue to project B via a native Redmine
   project-id change (simulating the "Move" action) — this leaves `execution_defects.project_id` stale (still A).
2. `GET /defects/<id>/executions.json` as a user who can see project B.

**Expected Result:**
- The executions whose live project no longer matches the defect's **current** project (re-scoped at **read**
  time, never trusting the stored join `project_id`) are dropped from the list — empty result, no old-project
  leak.

**Actual Result:** PASS. Reverse view correctly returned an empty `executions` array after the move — the
stale-project rows were dropped, not leaked. Defect's project restored afterward.

---

## Edge Cases

---

### RFTC008-Edge1: Empty `execution_ids`

**Priority:** P3
**Steps:** `POST link_defect.json` with `execution_ids: []`.
**Expected Result:** HTTP 422 "no executions selected"; nothing written.
**Actual Result:** PASS. `{"error":"No executions selected."}`.

---

### RFTC008-Edge4 (SACRED/SI-12): Self-link rejected

**Priority:** P2
**Steps:** `POST link_defect.json` where `defect_issue_id` equals the execution's own testcase issue id.
**Expected Result:** Rejected with a clear "a test case cannot be its own defect" message; no join row.
**Actual Result:** PASS.

---

### RFTC008-Edge5 (SACRED/SI-9): SQL-injection-shaped input

**Priority:** P2
**Steps:** `POST link_defect.json` with `defect_issue_id: "1 OR 1=1"` and `execution_ids: ["1 OR 1=1"]`.
**Expected Result:** Coerced via `.to_i`/scoped `where(id:)`; treated as a literal; no injection, no crash.
**Actual Result:** PASS. Clean 422 (defect not found/visible) — the string was safely coerced, no SQL injection.

---

### RFTC008-Edge9 (SI-13, DoS cap): Oversize `execution_ids` batch

**Priority:** P2
**Steps:** `POST link_defect.json` with 501 ids (cap is 500, confirmed via `ExecutionDefects::Linker::MAX_BULK`).
**Expected Result:** HTTP 422 "batch too large" before any DB work; nothing written.
**Actual Result:** PASS. `{"error":"Too many executions in one request (maximum is 500)."}`.

---

### RFTC008-U7/U17: Destroying a linked execution doesn't raise a FK error, and cleans up correctly

**Priority:** P2 — data integrity
**Steps:**
1. Destroy an `IssueStatusResult` that has a linked `ExecutionDefect` row (and where that testcase has no other
   execution still linking the same defect).

**Expected Result:**
- No foreign-key constraint error (logical FK only, SI-7); the join row is gone (cascade `dependent: :destroy`);
  `before_destroy :cleanup_relation_and_csv` removes the now-orphaned `IssueRelation` too.

**Actual Result:** PASS. Destroy succeeded with no FK error; join row gone; `IssueRelation` correctly removed.

---

## UI Cases — where this feature falls short

---

### RFTC008-UI1: Reverse "Linked Test Executions" panel renders on the defect's own issue page

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1
**Steps:**
1. Open a defect issue (`/issues/<id>`) that has linked executions.

**Expected Result:** A "Linked Test Executions (N)" panel renders, listing each execution's testcase/run/
environment/status/date, each clickable.
**Actual Result:** PASS. Panel renders correctly, exact count, all fields present and correct.

---

### RFTC008-UI2: "Link defect" picker + bulk-link action on the Run execution view

**User Role:** QA Manager (`qa.manager`)
**Priority:** P1 — this is the feature's entire forward-facing user workflow
**Steps:**
1. Open a Run's execution view with Failed/Blocked rows.
2. Look for a "Link defect" control, an existing-defect picker, and a multi-select "link selected to one defect"
   bulk action.

**Expected Result:** All three UI pieces present and functional (per the spec's own UI deliverables:
`_defect_link_picker.html.erb`, `_linked_defects.html.erb`).
**Actual Result:** **FAIL → BUG-TCM-044 (Critical).** None of these controls exist anywhere in the Run execution
view. The partial files exist on disk but are never rendered by any view or referenced by any JS — confirmed via
`grep -rln "defect_link_picker\|linked_defects" app/views/ app/controllers/` (only the files' own self-reference)
and the same grep against `assets/javascripts/` (zero matches). The feature is reachable only via the raw JSON
API today.

---

### RFTC008-UI3: Per-execution "Defect ID's" column reflects a linked defect

**User Role:** QA Manager (`qa.manager`)
**Priority:** P2
**Steps:**
1. After successfully linking a defect to an execution (via the API, since RFTC008-UI2 found no UI path), reload
   the Run execution view and check that row's "Defect ID's" column.

**Expected Result:** The column shows the linked defect's id/link.
**Actual Result:** **FAIL (folded into BUG-TCM-044).** Shows "No defects" regardless — a **pre-existing**,
unrelated-to-rftc-008 broken helper (`TestcaseReportsController#defect_ids`) requires the defect issue's own
`run_id`/`environment` columns to match the viewed run, which no defect issue ever has set. Documented as
context inside BUG-TCM-044 rather than a separate bug, since it predates this feature.
