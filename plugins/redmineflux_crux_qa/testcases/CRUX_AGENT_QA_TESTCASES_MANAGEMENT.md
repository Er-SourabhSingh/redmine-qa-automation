# Test Cases — Redmineflux Crux — QA Agent (Test Case Management plugin) Full CRUD

> New suite, Redmine 6 cycle (`localhost:3015`, plugin v7.2.0). Supersedes the historical `testcases/old_suites/CRUX_AGENT_QA_TESTCASES.md` (Redmine 7.0.0, never re-verified against this stack) — that suite's TC-CRX-053–120 numbers are NOT reused here; this suite starts fresh at TC-CRX-294 per the plugin-wide continuous numbering rule (CLAUDE.md §4a).
>
> Source: `http://localhost:3015/testcase_help?project_id=crux-pm-agent-test-project` (full plugin documentation, read 2026-10-26) + `redmineflux-crux-core/agents/testcases-qa.md`.

## Plugin
- Name: redmineflux_crux (QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition (done 2026-10-26)

- Plugin tracker configuration set via Administration → Plugins → Redmineflux Testcase Management Plugin → Configure: **Select Tracker As Testcase = Testcase**, **Select Tracker As Defect = Bug**, **Select Tracker As Feature = Feature**. (This stack had no Redis/Sidekiq service at all, which made the Configuration page's "Apply" 500 the first time — fixed by adding a `redis` service to `docker-compose.yml`; see `CRUX_MEMORY.md`.)
- Fixture project: **Crux QA Agent Test Project** (`crux-qa-agent-test-project`, id=3), Testcase Management + Crux modules enabled. All 4 trackers (Bug, Feature, support, Testcase) enabled by default.
- Two roles created for the admin/non-admin CRUD matrix:
  - **QA Full Access** — all Testcase Management plugin permissions (create/edit/delete test suite, create/edit/delete/close run, execute testcase, view/create/edit/delete report, view all to-dos, add/edit/delete requirement) + Redmine `Add issues`/`Edit issues`/`Import issues` (including the per-tracker "All trackers" grid cells — Redmine 6's known scoping gotcha) + `Use Ask Crux` + `Log spent time`. Assigned to `luna.blossom`.
  - **QA No Access** — only the defaults (`View Issues`, public `test_suites` permission) + `Use Ask Crux`. No Testcase Management plugin permission at all. Assigned to `daisy.skye`.
- Per the plugin's own documentation: **"Environments are not guarded — no permission controls the Environment page. Any user who can open it can add, edit and delete the project's environments, whatever their role."** — so Environment CRUD is expected to work the same for both roles; a permission-based block there would itself be a documentation/behavior mismatch worth investigating, not an expected negative-path result.
- Real-user-phrasing note: per explicit user instruction, test suite/environment/requirement IDs are **never** supplied in chat prompts (only their **names**) — the plugin's own UI only ever shows a Testcase ID or a Run ID, never a suite/environment/requirement ID, so a real user has no way to know the latter. Only testcase IDs and run IDs may be used naturally in phrasing once the agent (or a prior turn) has surfaced them.

## Scope (per explicit user request, 2026-10-26)

CRUD coverage requested, admin (`luna.blossom`/QA Full Access) and non-admin (`daisy.skye`/QA No Access), Create/Read/Update — both with every field filled and with only required fields:

1. **Test cases** — standalone create/read/update, with all fields vs. required-only fields.
2. **Test suites** — create, create sub-test-suite, create a test case directly inside a suite, move/copy/remove a test case from a suite, perform suite actions without ever supplying a suite ID (name only).
3. **Environments** — create/read/update/delete (unguarded per docs — expected to work for both roles).
4. **Requirements** — create/read/update/delete, plus linking/unlinking a requirement to/from a test case (two-way link).
5. **Reports** — create/read/update/delete, plus scheduling (Every day/week/month) and cancelling a schedule.
6. **Runs** — create/read/update/delete, plus including/excluding specific test suites and test cases when planning a run (vs. "Include all").

---

## Positive & Negative Cases

---

### TC-CRX-294: Test case — Create, admin, with all fields (subject, description, priority, steps)

**User Role:** `luna.blossom` (QA Full Access — all Testcase Management permissions + Add/Edit issues genuinely granted).

**Steps:** Fresh chat, QA Agent: "in the crux qa agent test project, can you create a test case titled 'Verify login with valid credentials' with description '...', priority High, and two steps: step 1 '...' expected '...', step 2 '...' expected '...'?"

**Result: FAIL — new bug, BUG-CRX-079.** Got a genuine confirm card (`Testcases Management Create Testcase`) with every field correctly filled — Project, Subject, Description, Steps array all exactly as requested — **except Priority, shown as the raw ID `3`** instead of a resolved value. Clicking Confirm genuinely attempted the write and failed: *"Error: priority_id 3 not found. Valid IDs: [6, 7, 8, 9]. Use list_enumeration(kind='priorities') to see names."* Retried Confirm a second time — identical failure, no self-correction. Verified via DB: no test case was created (honest failure, not silent). Real priority enumeration on this instance: `6=low, 7=medium, 8=high, 9=immediate` — the agent assumed the "classic" `3=High` ID scheme instead of ever calling the lookup tool. Filed as **BUG-CRX-079** (same wrong-ID-hallucination class as BUG-CRX-015/019/038/043/050/052, first instance on this agent/domain).

---
