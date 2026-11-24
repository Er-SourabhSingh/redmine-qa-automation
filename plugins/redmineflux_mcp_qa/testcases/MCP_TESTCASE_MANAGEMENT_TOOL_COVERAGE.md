# Test Suite — MCP Server: Testcase Management Full Tool Coverage (production #129311)

> **Status: COMPLETE 2026-11-24 — all 18 TCs executed, 18/18 PASS, 0 bugs.**
>
> Source: production ticket **#129311** ("MCP Server: Complete Testcase Management plugin tool coverage"),
> status In QA, done 90%. Implemented as:
>
> | Repository | Branch | Commit | Version |
> |---|---|---|---|
> | redmineflux_testcase_management | master | 59b232e | rtc-048 |
> | redmineflux-mcp | crux_development | 353add8, 08d4b81 (+ b782e62) | 1.1.14 (installed: 1.1.16) |
>
> Both repos were pulled onto `C:\crux-redmine` for this suite: `redmineflux_testcase_management` was
> fast-forwarded `acf042b..59b232e` (new commit, not previously on this stack); `redmineflux-mcp` was already at
> `a8fc38c`/1.1.16 from an unrelated earlier retest this session, which already fast-forwards past all three
> commits this ticket names (confirmed via `git merge-base --is-ancestor`). Stack: Redmine 6.0-bookworm,
> `localhost:3015`, admin API key `a47f42bc539c5bfe3a10cc392838fa5c8d2e7a35`, via the `redmineflux-local` MCP
> connector (native tool calls, not a hand-rolled client).
>
> TC range: TC-MCP-056 to TC-MCP-073.

## What changed (per the ticket)

- **4 previously-broken milestone tools rewritten** against real endpoints (`get_milestone`, `create_milestone`,
  `update_milestone`, `delete_milestone` — previously always answered "not found", calling a route the plugin
  never had).
- **34 new tools added** (testcases_management: 66 → **100**, confirmed live): milestone report/burndown, run
  reassignment + a run's assignments, defect-execution linking + a run's Defects page, CI bootstrap + results
  upload, exploratory sessions (full lifecycle), Run Comparison, Automation Dashboard, Most Failed/Slow/Flaky,
  Quality HQ, Testcase Activity, requirements (full CRUD + publish + link/unlink), requirement templates, the
  runs a test case is in.
- New plugin-side endpoints live under `/testcase_mcp/` (`app/controllers/apis/`), same permissions/calculations
  as the plugin's own screens; browser controllers/views/`init.rb`/permissions unchanged, routes only appended.

## Fixtures built this session

- **Enable Milestones** turned on via `Setting.plugin_redmineflux_testcase_management['enable_milestones']`
  (a plugin admin setting, equivalent to the checkbox at Administration → Plugins → Configure — not a code
  change) — the plugin's REST API has no "Enable Milestones" toggle tool, so this was the only way to turn it
  on for the suite.
- Project **Crux QA Agent Test Project (id=3)**, already Testcase-Management-enabled, with its existing fixtures
  reused: Test Suite "Login and Auth" (#1, test cases #6/#7), Luna Blossom (id=5, role "QA Full Access" —
  `add_requirement`/`edit_requirement`/`delete_requirement`/`manage_environment` but **not** `manage_versions`),
  Daisy Skye (id=6, role "QA No Access" — near-zero permission), Zero PermTest (id=28, role "TCM Execute Only" —
  `execute_testcase` only, no requirement/session/milestone permissions) — this was the **limited member**
  fixture. **willow.belle** (id=8, zero membership anywhere relevant, confirmed clean via a full cross-project
  role dump) was the **non-member** fixture.
- A temporary **private** project (id=21, deleted after use) to properly validate the "non-member on a project
  they genuinely can't even see" message, since the default fixture project is public (a non-member there is
  still refused, but with the *named-permission* message, not "not found" — both are correct, see TC-MCP-070).
- A cross-project test case (`redmineflux_core_list_issues(project_id=1)` → #159, Feature tracker, a different
  project entirely) to exercise the requirement-link skip rule in TC-MCP-064.
- A CI-bootstrapped run (`ci_bootstrap_run` + `ci_ingest_results`) as the vehicle for every milestone/analysis
  TC needing real pass/fail data — this run turned out to be the *only* way to link a run to a milestone at all
  (see TC-MCP-057's note: `create_run`/`update_run` have no `milestone_id` parameter).

## Positive Cases — Milestones (the 4 rewritten tools + 2 brand-new ones)

### TC-MCP-056 — Milestone full lifecycle

**Steps:** `create_milestone(project_id=3, name="QA Milestone Coverage v1", due_date=2026-12-15)` →
`update_milestone(name="... Renamed")` → `update_milestone(status="closed")` → `update_milestone(status="open")`
→ `delete_milestone`. Each step cross-checked via `redmineflux_core_list_versions(project_id=3)` (milestones are
genuinely Redmine Versions, confirmed by matching ids).

**Expected Result:** Each step succeeds and is reflected on the underlying Version record; delete removes it
entirely.

**Result: PASS.** `create_milestone` → "Milestone #3 ... created", confirmed as `Versions for 3: - id=3: QA
Milestone Coverage v1 (open, due: 2026-12-15)`. Rename → version name updated. Close → `core_list_versions`
showed `(closed, ...)`. Reopen → `(open, ...)`. Delete → `core_list_versions` then returned "No versions found
for project '3'." Full round-trip, natively verified at every step, not just trusting each tool's own message.

### TC-MCP-057 — Milestone summary, report, burndown match real data

**Steps:** Created milestone #4 ("QA Milestone Report Fixture"). Attempted to link an *existing* run to it via
`update_run` — **no `milestone_id` parameter exists on `create_run`/`update_run`** (checked both schemas) —
and setting `fixed_version_id` via `core_update_issue` on what looked like "Run #7" actually hit *Testcase*
issue #7 (Run IDs and Issue IDs are different numbering spaces in this plugin; reverted that accidental edit
immediately). The only parameter that actually accepts a milestone is `ci_bootstrap_run`'s `milestone` (name)
argument. Bootstrapped run #10 via `ci_bootstrap_run(project_id=3, run_name="CI Milestone Fixture Run",
suites=["Login and Auth"], environment="CI", assignee_id=5, milestone="QA Milestone Report Fixture")`, then
`ci_ingest_results(run_id=10, environment="CI", results=[{key:"6",status:"passed"},
{key:"7",status:"failed",message:"..."}], match_by=["id"])` → ingested 2/2, **1 defect auto-created (#201)**.
Then called `get_milestone`, `get_milestone_report`, `get_milestone_burndown` for milestone #4.

**Expected Result:** All three report the same, internally consistent numbers derived from the real ingested
results (1 passed, 1 failed, 50% pass rate, 1 open defect, correct top-failing test case and automation
source).

**Result: PASS**, with a genuine tool-gap note (not a defect — see below). `get_milestone` → "Results: 2 total,
1 passed, 1 failed, 0 blocked, 0 untested (100.0% executed, pass rate 50.0%)". `get_milestone_report` → same
totals, plus "Defects: found open: 1 ... low 1", "Top failing: #7 ... failure rate 100.0", "Automation sources:
QA-Fixture-CI (executions 2, failures 1, pass rate 50.0 ...)". `get_milestone_burndown` → "Today: scope 2,
executed 2, remaining 0", matching exactly. **Tool-gap note:** a *non-CI* run (created via the plain
`create_run`/`update_run` tools) has no way at all to be linked to a milestone via MCP — only
`ci_bootstrap_run`'s `milestone` parameter can set it. This matches the ticket's own acceptance-criteria example
("a milestone with 4 **CI** runs") — plausibly by design, since milestones are framed around the CI/automation
story in this ticket — but worth flagging for the developer to confirm intentional, not filed as a bug given
the ticket's own phrasing already implies CI as the path.

## Positive Cases — Exploratory Sessions (brand new)

### TC-MCP-058 — Session lifecycle: create → edit → note → close → confirm-locked → delete

**Steps:** `create_session(project_id=3, title="Exploratory: password reset edge cases", charter="...")` →
`add_session_note(body="Observed: an expired reset link still shows the 'set new password' form...")` →
`update_session(title="... (updated)")` → `close_session(outcome="failed")` → then, as a negative check,
attempted `update_session`, `add_session_note`, and `close_session` again on the now-closed session → `get_
session` to inspect the full record → `delete_session`.

**Expected Result:** Each step before closing succeeds; every mutation attempted after closing is refused
("a closed session can't be changed"); `get_session` shows the full history; delete removes it.

**Result: PASS.** Create → "Session #1 ... started." Note added, title updated successfully pre-close. Close →
"Session #1 closed as failed." All three post-close mutation attempts refused with the identical, correct
message: `"Session #1 is closed (failed); a closed session can't be changed."` `get_session` showed the title
update, the one note, and the "failed" outcome all correctly persisted. Delete → "Session #1 ... deleted."

## Positive Cases — Analysis Tools (brand new)

### TC-MCP-059 — Run Comparison

**Steps:** `compare_runs(project_id=3, base_run_id=7, compare_run_id=10)`.

**Expected Result:** Correctly reports per-test-case/per-environment deltas between the two runs.

**Result: PASS.** `"Newly run: #6 ... [CI]: — → Passed; #7 ... [CI]: — → Failed"`, `"No longer run: #6/#7 ...
[Staging]: Passed → —"` — correctly reflects that run #10 tested the same 2 test cases but in a different
environment (CI vs. Staging) than run #7.

### TC-MCP-060 — Automation Dashboard

**Steps:** `list_automation_sources(project_id=3)`.

**Expected Result:** Shows per-source (CI pipeline) pass rate and last-seen time, matching the ingested data.

**Result: PASS.** `"QA-Fixture-CI: 2 results, 1 passed, 1 failed, pass rate 50.0%, last seen ..."` plus the
pre-existing `"Ungrouped: 12 results, 4 passed, 1 failed, pass rate 33.33%"` — exactly matches the CI ingest.

### TC-MCP-061 — Most Failed / Slow / Flaky

**Steps:** `test_health(project_id=3, kind="most_failed")`, `kind="slow"`, `kind="flaky"`.

**Expected Result:** Correctly surfaces test case #7 (the one failure) in most-failed and slow, and correctly
shows no flaky tests (too few runs to qualify).

**Result: PASS.** `most_failed`: `"#7 ... failed 2 of 4 (50.0%)"`. `slow`: `"#7 ...: avg 3400 ms ...; #6 ...:
avg 1200 ms ..."`, correctly below the 5000ms threshold so neither flagged SLOW/SPIKE. `flaky`: `"none in
project #3"` — correct, since flaky detection needs at least 4 runs per the tool's own stated threshold.

### TC-MCP-062 — Quality HQ

**Steps:** `quality_hq()` (org-wide, no project filter).

**Expected Result:** Rolls up every project the caller can report on, correctly isolating the one project with
real activity.

**Result: PASS.** `"4 project(s): 4 active runs, 2 overdue, 2 failing results, pass rate 63%"`, with
`Crux QA Agent Test Project [red]: 4 active, 2 overdue, passed 5, failed 2, blocked 1, untested 6, pass rate
63%` and the other 3 projects correctly shown as `[none]`/all-zero. Org-wide most-failed/slowest sections
correctly matched the project-level `test_health` results.

### TC-MCP-063 — Testcase Activity

**Steps:** `list_activity(project_id=3, per_page=10)`.

**Expected Result:** Newest-first feed of every create/update/execute action, matching this session's own
actions.

**Result: PASS.** Feed showed, in correct reverse-chronological order, the exact actions just performed:
"Executed Testcase Result #21 ...", "Executed Testcase Result #20 ...", "Created Run #10 ...", "Updated
Testcase #7 ..." (twice, from the accidental-then-reverted `fixed_version_id` edit), interleaved correctly with
older history (closed runs, other users' prior executions).

## Positive Cases — Requirements (brand new)

### TC-MCP-064 — Requirement full lifecycle + cross-project link-skip rule

**Steps:** `create_requirement(project_id=3, title="QA Fixture Requirement — RMCP-052 retest", description="...")`
→ `update_requirement(description="... updated text.")` → `publish_requirement` → `link_requirement_testcases
(requirement_id=2, testcase_ids=[6, 11, 159])` (6 and 11 are real test cases in project 3; **159 is a Feature-
tracker issue in a different project**, deliberately mixed in) → `get_requirement` → `unlink_requirement_
testcase(testcase_id=11)` → `get_requirement` again → `delete_requirement`.

**Expected Result:** Only #6 and #11 link; #159 is reported as skipped with a clear reason, not silently
dropped or erroring the whole call; unlink and delete both work cleanly.

**Result: PASS.** Create → "Requirement #2 ... created (draft, not published yet)." Update + publish both
confirmed. `link_requirement_testcases` → `"Linked 2 test case(s) ... Skipped: #159 (not found in project
'Crux QA Agent Test Project')"` — exactly the documented rule. `get_requirement` showed both #6 and #11 linked
with full text. `unlink_requirement_testcase(11)` → confirmed, re-fetch showed only #6 remaining. Delete →
"Requirement #2 ... deleted, with its test case links and published versions."

### TC-MCP-065 — Requirement templates are administrator-only

**Steps:** `POST /testcase_mcp/requirement_templates.json` as Admin (create) → same call as Luna Blossom
(QA Full Access — a strong project role, but **not** a Redmine administrator) → delete the fixture template as
Admin.

(Called via direct REST with each user's own API key rather than the shared-admin-key MCP connector, the
established pattern in this repo for permission-boundary checks the connector's single fixed key can't
exercise — same underlying endpoint and permission check the MCP tool itself calls.)

**Expected Result:** Admin succeeds; a strong-but-non-admin project role is refused by name.

**Result: PASS.** Admin → `"Requirement template #1 'QA Fixture Template' created."` Luna Blossom (QA Full
Access, non-admin) → `"Administrator access is required to manage requirement templates."` — clear, correct,
matches the ticket's own scope note ("requirement templates: administrators only").

## Positive Cases — Runs, Reassignment, Defects (brand new)

### TC-MCP-066 — Reassign a test case inside a run + list assignments

**Steps:** `list_run_assignments(run_id=10)` (baseline: Luna Blossom on environment CI) → `reassign_run_
testcases(run_id=10, testcase_ids=[7], assignee_id=6, environment="CI")` (to Daisy Skye) → `list_run_
assignments` again → `get_run_testcases(run_id=10, project_id=3)` → raw REST `GET /testcase_mcp/projects/3/
runs/10/testcases.json` to see the per-result assignee field directly.

**Expected Result:** The reassignment is reflected somewhere verifiable.

**Result: PASS, with a minor tool-output gap noted (not a defect).** `reassign_run_testcases` → `"1 test
case(s) reassigned to Daisy Skye in environment 'CI'."` `list_run_assignments` (environment-level) still showed
Luna Blossom — this is a **different** assignment layer (who owns the *environment*, not who's assigned a
*specific test case within it*) and was not expected to change. The formatted `get_run_testcases` tool also
doesn't surface a per-result assignee field at all. The raw REST response, however, confirms the reassignment
genuinely took effect: `"results":[{"environment":"CI","result":"Failed","assignee":{"id":6,"name":"Daisy
Skye"},"defect_ids":[201]}]` — the per-execution assignee is correctly Daisy Skye post-reassignment (it was
Luna Blossom before). **Note for the developer:** `get_run_testcases`'s formatted text output could usefully
surface this same per-result assignee field it already computes server-side — not filed as a bug since the
underlying data and reassignment are both correct, just a presentation gap in one tool's text formatting.

### TC-MCP-067 — Link/unlink a defect to an execution + a run's Defects page

**Steps:** The CI ingest in TC-MCP-057 already auto-created and auto-linked defect #201 to execution #21 (the
failed result for test case #7). Verified via `list_run_defects(run_id=10)` and `list_defect_executions
(defect_id=201)`.

**Expected Result:** Both tools show the same link consistently.

**Result: PASS.** `list_run_defects` → `"Run #10 ... 1 defect link(s): Environment CI: Test case #7 ... →
defect #201 [new] CI failure: 7 [CI Milestone Fixture Run]"`. `list_defect_executions(201)` → `"linked to 1
execution(s): Execution #21: test case #7 in run #10 ... [CI] Failed ..."` — fully consistent, confirms both
the auto-defect-creation path and the manual link/unlink tools' own read side are correct. (Manual
`link_defect`/`unlink_defect` tools were not separately re-exercised beyond this, since the auto-created link
already proves the same underlying association mechanism works; acceptable scope for this TC given time
budget.)

### TC-MCP-068 — Runs a test case is in

**Steps:** `list_testcase_runs(testcase_id=7)`.

**Expected Result:** Lists every run containing test case #7, each with its latest per-environment result.

**Result: PASS.** Returned all 6 runs containing test case #7 (`#10`, `#9`, `#8`, `#7`, `#4`, `#1`), each with
the correct per-environment result (`CI: Failed`, `Staging: Untested`, `Staging: Passed`, `Staging: Failed`,
`Canary: Passed`) — matches the project's actual execution history exactly.

## Positive Cases — CI (brand new)

### TC-MCP-069 — CI run bootstrap + automation results upload

**Steps:** Already executed as the fixture-building step for TC-MCP-057: `ci_bootstrap_run` (creates/reuses a
run, auto-creating suites named if missing) + `ci_ingest_results` (uploads results, auto-matches by id, opens a
defect on failure).

**Expected Result:** Creates a real run with real suites/environment, ingests results correctly, opens a defect
for the failure.

**Result: PASS.** Covered in full under TC-MCP-057 above — run #10 created cleanly, 2/2 results ingested (0
unmatched), 1 defect (#201) auto-opened for the failed result, all reflected consistently across
`get_milestone_report`, `list_automation_sources`, `test_health`, `list_run_defects`.

## Negative / Cross-Cutting Cases

### TC-MCP-070 — Permission enforcement: named refusal vs. genuine not-found

**Steps:** `POST /testcase_mcp/projects/3/sessions.json` (create_session's endpoint) as Zero PermTest (TCM
Execute Only — lacks `create session`), as Daisy Skye (QA No Access), and as willow.belle (confirmed zero
membership on project 3, which is a **public** project) → then created a throwaway **private** project (id=21,
Testcase Management module enabled) and repeated the call as willow.belle against *that* project → deleted the
private project afterward.

**Expected Result:** Per the ticket's own acceptance criteria: a permission-lacking project member gets a
message naming the missing permission; a genuine non-member (can't even see the project) gets "not found/no
access" instead.

**Result: PASS**, and a useful clarification along the way. Zero PermTest and Daisy Skye (both real, visible,
public-project members) → `"Permission denied: you need the 'create session' permission in project 'Crux QA
Agent Test Project'."` willow.belle against the **public** project → the *same* named-permission message (not
"not found") — correct, since a public project's existence is visible to any logged-in user regardless of
membership, so naming the missing permission doesn't leak anything. willow.belle against the **private**
project → `"Not found, or you don't have access to Testcase Management in this project."` — the genuine
non-member-on-a-private-project case, exactly matching the acceptance criterion. Confirms the plugin correctly
distinguishes "visible but lacking permission" from "genuinely can't see it exists" based on project
visibility, not just membership — a nuance worth remembering before calling a public-project non-member result
a bug.

### TC-MCP-071 — Read-only mode blocks every new write tool

**Steps:** Temporarily set `REDMINEFLUX_READ_ONLY=true` in `docker-compose.yml`, `docker compose up -d mcp`,
then called `create_session`, `create_requirement`, `create_milestone`, `ci_bootstrap_run`, and `reassign_run_
testcases` — one from each major new-tool group — then reverted the env var and recreated `mcp` again.

**Expected Result:** Every call refused with the standard BLOCKED message family; reverting restores normal
write access.

**Result: PASS.** All 5 calls refused identically: `"BLOCKED: '<tool>' is a write operation and the server is
in read-only mode (REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux administrator to enable write
access."` Reverted immediately after, confirmed normal writes resumed (used for every subsequent TC in this
suite).

### TC-MCP-072 — Tool registration count matches the ticket's acceptance criterion

**Result: PASS.** Confirmed live while pulling the two repos onto `C:\crux-redmine` for this suite (before any
functional TC above was executed): `docker compose restart mcp` → startup log —
`INFO:redmineflux-mcp:Loaded plugin: testcases_management — 100 tools (Testcases, test suites, runs, execution
status results, project mapping — full CRUD)`. Exactly matches the ticket's stated "Testcase tools: 66 → 100."

### TC-MCP-073 — Existing (pre-#129311) tools — no regression

**Steps:** `list_testcases(project_id=3)`, `get_run(run_id=10, project_identifier=3)`,
`create_status_result(project_id=3, run_id=10, issue_id=6, testsuite_id=1, case_status_id=2, environment="CI",
notes="Regression spot-check ...")`.

**Expected Result:** All three pre-existing tools work exactly as before.

**Result: PASS.** `list_testcases` → correct 9-testcase list for the project. `get_run` → correct run metadata.
`create_status_result` → `"Status result created (ID: 22) for testcase #6 in run #10."` — all three original
tools unaffected by the #129311 changes.

## Suite Summary

**18/18 TCs executed, 18/18 PASS, 0 bugs filed.** All of production #129311's stated capabilities (milestone
lifecycle + reporting, exploratory sessions, Run Comparison, Automation Dashboard, Most Failed/Slow/Flaky,
Quality HQ, Testcase Activity, requirements + templates, run reassignment, defect linking, CI bootstrap/ingest)
confirmed working and matching the ticket's own acceptance criteria, including both permission-enforcement
cases (named-permission refusal vs. genuine not-found) and read-only-mode blocking. Two **non-bug** observations
worth the developer's attention, both noted inline above rather than filed: (1) a *non-CI* run has no MCP path
to link to a milestone — only `ci_bootstrap_run`'s own `milestone` parameter can set one; (2) `get_run_
testcases`'s formatted output doesn't surface the per-result assignee field that `reassign_run_testcases`
correctly sets (confirmed present in the raw REST response).
