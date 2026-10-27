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

### TC-CRX-295: Test case — Create, admin, required fields only (Subject only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Fresh chat, QA Agent: "in the crux qa agent test project, can you create a test case titled 'Verify logout clears the session'?"

**Result: PASS.** Clean confirm card (`Project`, `Subject` only — no invented fields). Confirmed: *"✓ Testcase created: \"Verify logout clears the session\" (tracker #4, project #3)"*. Verified via DB: issue #4 genuinely created, correct subject/project/tracker.

---

### TC-CRX-296: Test case — Read

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Same chat: "what's test case #4 about?"

**Result: PASS.** *"Test case #4 is titled 'Verify logout clears the session' — it's currently in **Waiting for Customer Response** status with **low** priority."* (with a link to #4). Verified via DB: subject/status/priority all exactly match.

---

### TC-CRX-297: Test case — Update (priority + description together)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Same chat: "can you update test case #4 to set its priority to high and add the description '...'?"

**Result: FAIL — folded into BUG-CRX-079 as a new repro.** Confirm card showed `Priority: 5` (a *different* wrong guess than Create's `3`, still not one of the real IDs `[6,7,8,9]`) and a correctly-filled `Description`. Confirming produced: *"Validation error: Priority cannot be blank"* (Redmine's own FK validation silently drops the invalid id, and the Testcase tracker requires Priority). Verified via DB: neither field changed. Confirms the wrong-ID guess isn't shared/hardcoded identically between Create and Update — each path has its own independent, equally-wrong assumption.

---

### TC-CRX-298: Test suite — Create, admin, required fields only (Name only, suite ID never supplied)

**User Role:** `luna.blossom` (QA Full Access). Per the real-user-phrasing rule, only the project **name** is given, never an ID.

**Steps (attempt 1, long-running chat — 4 prior turns already in this session):** "in the crux qa agent test project, can you create a test suite called 'Authentication'?"

**Result: FAIL — new bug, BUG-CRX-080.** The confirm card showed **`Project: Crux PM Agent Test Project`** — the wrong project — despite 3 prior turns in the identical chat session correctly resolving "Crux QA Agent Test Project" from the same phrasing (TC-294/296/297). Clicked **Cancel**; verified via DB that no suite was created anywhere.

**Steps (attempt 2, brand-new chat session):** Identical message, fresh conversation.

**Result: PASS on retry.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Name: Authentication`. Confirmed: genuine success, verified via DB (`testsuites` id=1, correct `project_id`). Filed the wrong-project occurrence as **BUG-CRX-080** (1 of 1 repro in a long session, 0 of 1 in a fresh one — flagged as a priority investigation item given the severity of a silently-wrong write target, not yet treated as confirmed-deterministic).

---

## Fixture correction (2026-10-27)

Before continuing: found that the **QA Full Access** role was missing the `view_test_suite` permission (an oversight during fixture setup, not a Crux bug) — `luna.blossom`'s first Test Suite Update attempt got a correctly-honest-but-wrong-for-this-fixture denial: *"I don't have permission to view or manage test suites... grant the `view_test_suite` permission."* Verified the permission was genuinely absent via DB, granted it via native UI, re-verified present, then retried — see TC-CRX-299 below.

---

### TC-CRX-299: Test suite — Update (rename), admin

**User Role:** `luna.blossom` (QA Full Access, `view_test_suite` now granted).

**Steps:** Fresh chat, QA Agent: "in the crux qa agent test project, can you rename the 'Authentication' test suite to 'Login and Auth'?"

**Result: PASS.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Suite: 1`, `Name: Login and Auth`. Confirmed: genuine rename, verified via DB (`testsuites` id=1 now named "Login and Auth").

---

### TC-CRX-300: Test suite — Create sub-suite, admin (suite referenced by name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Same chat: "can you add a sub test suite called 'Password Reset' under the 'Login and Auth' test suite?"

**Result: PASS.** Confirm card correctly showed `Project`, `Name: Password Reset`, `Parent: 1` (correctly resolved from the name "Login and Auth", never asked for an ID). Confirmed: genuine sub-suite creation, verified via DB (`testsuites` id=2, `parent_id=1`).

---

### TC-CRX-301: Test suite — Create a test case directly inside a suite (by name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Same chat: "can you create a test case titled 'Reset password with valid email' inside the 'Password Reset' test suite?"

**Result: FAIL — new bug, BUG-CRX-081.** Confirm card showed only `Project` and `Subject` — no suite field at all. Confirming produced a plain *"✓ Testcase created..."* message with no mention of the suite. Verified via DB: the test case (issue #5) was genuinely created but **never linked to the suite** (`issue_test_suites` has 0 rows for it) — it sits unassigned, not inside "Password Reset" as requested. Confirmed via MCP source that `create_testcase` has no suite parameter at all, but a separate, genuinely-available tool (`add_testcases_to_suite`) exists to do this as a second step — the agent never called it, and never disclosed the limitation. Filed as **BUG-CRX-081**.

---

### TC-CRX-302: Test case — Move into an existing suite (suite referenced by name only)

**User Role:** `luna.blossom` (QA Full Access). Real suites on this project: `1=Login and Auth, 2=Password Reset` (confirmed via DB beforehand).

**Steps:** Same chat: "can you move test case #5 into the 'Password Reset' test suite?"

**Result: FAIL — two findings.** The confirm card (`Testcases Management Add Testcases To Suite`) showed `Suite: 3` — a nonexistent suite ID (only 1 and 2 exist) — resolved from the correctly-typed name "Password Reset." Confirming failed: *"✓ Test suite #3 not found. (If you expected this add testcases to suite to exist, verify the ID with the corresponding list_* tool.)"* Verified via DB: no link created, genuinely failed. **(1) The wrong suite-ID guess** folded into **BUG-CRX-079** as a 3rd field type hit by the same wrong-ID-hallucination pattern (after Priority and Project). **(2) The failure message is prefixed with a misleading "✓"** despite being a genuine failure — filed as new bug **BUG-CRX-082** (recurrence of the already-closed BUG-CRX-018 class, first instance on this agent/domain).

**Retry in a brand-new chat (no prior context):** identical message, no project named this time (resolved implicitly from the testcase ID alone) — confirm card correctly showed `Suite: 2`. Confirmed: genuine success, verified via DB (`issue_test_suites` row: issue 5, suite 2). This corroborates **BUG-CRX-079/080**'s pattern that this agent's ID-resolution reliability degrades as a chat session accumulates more turns/context, rather than being a flat, always-wrong defect.

---

### TC-CRX-303: Test suite — Remove a test case from a suite (suite referenced by name only)

**User Role:** `luna.blossom` (QA Full Access). Real suite: `2=Password Reset` (test case #5 currently linked, from TC-CRX-302's fresh-chat retry).

**Steps:** Fresh chat, QA Agent: "can you remove test case #5 from the 'Password Reset' test suite?" — agent first asked for the project name (reasonable, since suite names aren't guaranteed globally unique and no suite ID was ever given by the user) — replied "Crux QA Agent Test Project".

**Result: PASS.** Confirm card (`Testcases Management Remove Testcases From Suite`) correctly showed `Suite: 2`, `Testcase Ids: [5]` — both resolved correctly from the names/ID given, no ID ever requested from the user beyond the already-known testcase #5. Confirmed: *"✓ 1 testcase(s) removed from suite #2 'Password Reset'."* Verified via DB: `issue_test_suites` has 0 rows for issue 5 — genuine removal, correctly reflects the real success (no misleading-✓ issue here, unlike TC-CRX-302's failure case).

---

### TC-CRX-304: Test suite — Copy a test case into a suite (suite referenced by name only)

**User Role:** `luna.blossom` (QA Full Access). Test case #5 (now unassigned after TC-CRX-303's removal). Real suite: `1=Login and Auth`.

**Steps:** Fresh chat, QA Agent: "can you copy test case #5 into the 'Login and Auth' test suite in the Crux QA Agent Test Project?"

**Result: PASS.** Confirm card (`Testcases Management Copy Testcases To Suite`) correctly showed `Target Suite: 1`, `Testcase Ids: [5]`. Confirmed: *"✓ 1 testcase(s) copied to suite 'Login and Auth' (ID: 1). New #6 'Reset password with valid email' (copied from #5)."* Verified via DB: a genuinely **new** issue #6 was created (same subject as #5) and linked to `testsuite_id=1`; original #5 was left untouched/unassigned. Confirms this plugin's "Copy" semantics are "duplicate the testcase into the target suite," not "link the same testcase into a second suite" — the agent's behavior correctly matches the tool's real semantics.

---

### TC-CRX-305: Test suite — Delete, admin (suite referenced by name only)

**User Role:** `luna.blossom` (QA Full Access). Fixture suite `"zz-delete-me-suite"` (ID 3) created fresh for this test, then deleted.

**Steps:** Same chat — create: "in the Crux QA Agent Test Project, can you create a test suite called 'zz-delete-me-suite'?" → confirmed, `"✓ Test suite 'zz-delete-me-suite' created (ID: 3)..."`. Then: "in the Crux QA Agent Test Project, can you delete the 'zz-delete-me-suite' test suite?"

**Result: PASS.** Delete confirm card correctly showed `Project: Crux QA Agent Test Project`, `Suite: 3` (resolved from name only). Confirmed: *"✓ ... deleted"* (success message). Verified via DB: `testsuites` id=3 no longer exists — genuine deletion.

---

### TC-CRX-306: Test case — Create, non-admin (expected denial)

**User Role:** `daisy.skye` (QA No Access — no Testcase Management permission, no Add/Edit issues).

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you create a test case titled 'Verify invalid login shows error'?"

**Result: PASS (expected negative).** Confirm card correctly showed `Project`, `Subject` (resolution itself isn't permission-gated). Confirming produced a genuine, correctly-worded denial: *"Cannot create testcase in project #3: permission denied..."* Verified via DB: no issue with that subject exists — the denial is honest, not a silent partial write.

---

### TC-CRX-307: Test case — Read, non-admin (expected success — `View Issues` is granted)

**User Role:** `daisy.skye` (QA No Access).

**Steps:** Same chat: "what's test case #4 about?"

**Result: PASS.** *"Test case #4 is 'Verify logout clears the session' — it's a low-priority case currently in Waiting for Customer Response status..."* Correctly succeeded — `View Issues` is part of the QA No Access role's defaults, so Read is expected to work even with zero Testcase Management permissions.

---

### TC-CRX-308: Test case — Update, non-admin (expected denial)

**User Role:** `daisy.skye` (QA No Access).

**Steps:** Same chat: "can you update test case #4's description to 'Updated by daisy'?"

**Result: PASS (expected negative).** Confirm card showed `Testcase: 4`, `Description: Updated by daisy` (correctly resolved). Confirming produced a genuine denial: *"Unauthorized access. To fix this, ask your Redmineflux administrator to: Grant you the required role/permission for this action..."* Verified via DB: issue #4's description is still empty — the denial is honest.

---

### TC-CRX-309: Test suite — Create, non-admin (expected denial)

**User Role:** `daisy.skye` (QA No Access — no `create_test_suite` permission).

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you create a test suite called 'Daisy Attempt Suite'?"

**Result: PASS (expected negative).** Confirm card correctly showed `Project`, `Name` (name resolution isn't permission-gated). Confirming produced a genuine denial: *"Permission denied: you do not have create_test_suite permission in project 'Crux QA Agent Test Project'..."* Verified via DB: no suite named "Daisy Attempt Suite" exists — honest denial, matches the expected QA No Access behavior.

---
