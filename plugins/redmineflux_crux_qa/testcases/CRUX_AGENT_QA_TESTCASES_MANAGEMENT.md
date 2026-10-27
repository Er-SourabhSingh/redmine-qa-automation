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
- ~~Per the plugin's own documentation: "Environments are not guarded..."~~ **Correction (2026-10-27): this documentation is stale.** `TestcaseEnvironmentController` now has a real `before_action :authorize_manage_environment` check (its own code comment: `rftc-012 H3 (TCM-009): no auth check at all — read AND write actions ... were reachable by any logged-in non-member`) — i.e. the plugin was fixed to require the `manage_environment` permission since that doc was written. Neither fixture role had it granted (the same class of fixture-setup gap as `view_test_suite` below) — granted to **QA Full Access** via native UI, verified via DB. **QA No Access** intentionally still lacks it, so Environment CRUD is now expected to behave like every other permission-gated area: succeed for `luna.blossom`, denied for `daisy.skye`.
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

## Fixture correction (2026-10-27) — Environments are not actually unguarded

Attempted TC-CRX-310 (Environment Create, non-admin `daisy.skye`) first, expecting success per the suite's original precondition note ("Environments are not guarded"). Got a genuine `"Unauthorized access"` denial instead. Investigated via the plugin's own source (`testcase_environment_controller.rb`): a real `authorize_manage_environment` check now exists, added as a security fix (`rftc-012 H3`/`TCM-009`) after the "unguarded" documentation was written. Checked `QA Full Access`'s permissions via DB — `manage_environment` was genuinely absent (the same class of fixture-setup gap as `view_test_suite` earlier in this session). Granted it via native UI (Administration → Roles → QA Full Access → Manage environment), re-verified present via DB. The precondition section above has been corrected. `QA No Access` was left without it, since the correct expectation now is a permission-gated feature like every other Testcase Management area.

---

### TC-CRX-310: Environment — Create, admin (unexpected permission fix required; see above)

**User Role:** `luna.blossom` (QA Full Access, `manage_environment` now granted).

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you create a test environment called 'Staging'?" — the user never mentions "components".

**Result: PASS after 2 retries — new bugs filed.** Attempt 1 hit a one-off transient tool-discovery failure ("disconnect with the group discovery system", self-described, not reproduced again — noted in `CRUX_MEMORY.md`, not filed as a bug). Attempt 2 (confirm card `Components: []`) failed with `"✓ components must be a non-empty list."` — a genuine failure rendered with a misleading `✓`, folded into **BUG-CRX-082** as a new repro. Attempt 3 ("yes please create it", no new info from the user) self-corrected to `Components: ['Staging']` and succeeded, verified via DB (`testcase_environments` id=1, name='Staging', components='Staging', project_id=3). The underlying inconsistent/invalid `components` defaulting across 3 identical-intent calls is filed as **BUG-CRX-083**.

---

### TC-CRX-311: Environment — Create, non-admin (expected denial)

**User Role:** `daisy.skye` (QA No Access — no `manage_environment` permission).

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you create a test environment called 'Staging'?"

**Result: PASS (expected negative) — this is what surfaced the fixture gap above.** Confirm card showed `Project`, `Name: Staging`, `Components: ['Staging']` (reasonable auto-default here, unlike TC-CRX-310's later inconsistent attempts). Confirming produced a genuine denial: *"Unauthorized access. To fix this, ask your Redmineflux administrator to: Grant you the required role/permission for this action..."* Verified via DB: no environment named "Staging" exists at the time of this attempt — honest denial.

---

### TC-CRX-312: Environment — Read (list), admin

**User Role:** `luna.blossom` (QA Full Access, with TC-CRX-310's "Staging" environment now genuinely existing).

**Steps:** Same chat as TC-CRX-310: "what environments exist in the Crux QA Agent Test Project?"

**Result: PASS.** *"The Crux QA Agent Test Project has 1 environment: ID 1: Staging — with component 'Staging'."* Correct, verified against DB. (Note: this response surfaces the environment's numeric ID unprompted in a read-only answer — not the same as asking the user to supply one, so not flagged as a violation of the real-user-phrasing rule, but noted in `CRUX_MEMORY.md` as worth keeping an eye on.)

---

### TC-CRX-313: Environment — Update (rename), admin (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps (attempt 1, long-running chat):** "can you rename the 'Staging' environment to 'Staging-EU'?"

**Result: FAIL — new repro of BUG-CRX-080.** Confirm card showed `Project: Crux PM Agent Test Project` — the wrong, unrelated project — despite 2 prior turns in the identical chat correctly resolving "Crux QA Agent Test Project." Clicked Cancel; verified via DB no change occurred.

**Steps (attempt 2, brand-new chat, project named explicitly this time):** "in the Crux QA Agent Test Project, can you rename the 'Staging' environment to 'Staging-EU'?"

**Result: PASS on retry.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Environment: 1`, `Name: Staging-EU`. Confirmed: genuine rename, verified via DB. Folded into **BUG-CRX-080** as a 2nd tool hit by the same session-length-dependent wrong-project pattern (after Create Test Suite).

---

### TC-CRX-314: Environment — Delete, admin (name only)

**User Role:** `luna.blossom` (QA Full Access). Fresh chat.

**Steps:** "in the Crux QA Agent Test Project, can you delete the 'Staging-EU' environment?" — agent first asked a natural-language confirmation ("I found the 'Staging-EU' environment (ID: 1)... Is this correct?") before producing the actual confirm card; replied "yes, confirm."

**Result: PASS.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Environment: 1`. Confirmed: genuine deletion, verified via DB (`testcase_environments` table empty).

---

## Scope note (2026-10-27) — Requirements CRUD has no MCP tool support

Before writing any Requirements test cases, confirmed via MCP source inspection (`testcases_management.py`'s 64 `@mcp.tool` entries) that **there is no `create_requirement`/`list_requirements`/`get_requirement`/`update_requirement`/`delete_requirement` tool at all** — despite the plugin's own permission system genuinely having `add_requirement`/`edit_requirement`/`delete_requirement` as real, grantable permissions, and despite Requirements being a real, native-UI-only feature (page-based records at `/requirements?project_id=...`, stored in their own `requirements` table, linked to testcase issues via a separate `requirement_issues` join table — confirmed via DB, NOT Redmine issues themselves). The only requirement-related capability reachable via chat at all is the `requirement_ids: list[int]` parameter on `create_testcase`, which links at creation time only (no equivalent on `update_testcase`) and requires the caller to already know the numeric Requirement ID.

This means full Requirements CRUD (create/read/update/delete the requirement itself) and unlinking are **not testable via Ask Crux chat** — only the create-time linking path is. Created requirement #1 ("User must be able to reset password via email") via native UI as a fixture for the one testable path below.

---

### TC-CRX-315: Requirement — attempt standalone Create via chat (expected: no tool exists)

**User Role:** `luna.blossom` (QA Full Access, `add_requirement` genuinely granted).

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you add a requirement titled 'User must be able to reset password via email' with description '...'?"

**Result: PASS (expected — not a bug).** The agent correctly and honestly reported it has no tool for creating a standalone "requirement" record, offering to either create a test case instead or suggesting a different tracker — matches the confirmed absence of any requirement-creation MCP tool. No bug filed for this part; this is an honest capability disclosure, not a false denial.

---

### TC-CRX-316: Requirement — link to a test case by name at creation time

**User Role:** `luna.blossom` (QA Full Access). Fixture: requirement #1 ("User must be able to reset password via email") created via native UI.

**Steps:** Fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you create a test case titled 'Verify password reset email is sent' and link it to the 'User must be able to reset password via email' requirement?" — the user names the requirement by title only, per the real-user-phrasing rule (Requirements have no user-visible ID in this plugin's UI).

**Result: FAIL — new bug, BUG-CRX-084.** The agent never attempted to resolve the requirement by name and instead asked: *"What is the numeric issue ID of the 'User must be able to reset password via email' requirement?"* — exactly the "asks the user for an ID" violation this suite's precondition section was set up to catch. Root cause confirmed via MCP source: no requirement-lookup tool exists at all, so this isn't a case of the agent failing to call an available tool — the tool genuinely doesn't exist, making this an architectural gap rather than an agent misbehavior. Filed as **BUG-CRX-084**.

**Follow-up (same chat, supplying the ID manually to verify the one working path):** replied "The requirement's ID is 1." — confirm card correctly showed `Requirement Ids: [1]`. Confirmed: genuine success, verified via DB (issue #7 created, `requirement_issues` row: requirement 1 ↔ issue 7). Confirms the underlying create-time linking mechanism itself works correctly once given a numeric ID — the defect is purely the missing name-to-ID resolution path.

---

## Fixture note — Runs required before Reports

Attempting Report Create first hit "There are no test runs in the project yet." Rather than let the agent chain Run creation (burned ~$0.07 and hit a token-budget cutoff on a multi-step "create environment → create run → create report" request), created the fixtures directly via native UI: environment "Staging" (components: Software) and run "Sprint 1 Regression" (run #1, Include all test cases, environment Staging, assignee Luna Blossom).

---

### TC-CRX-317: Run — Read, admin (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Fresh chat, QA Agent: "can you tell me about the 'Sprint 1 Regression' test run?"

**Result: PASS.** Correctly reported Run ID #1, status (Open/New), duration, linked suite ("Login and Auth"), environment ("Staging"), and the 1 testcase in it (#6, "Reset password with valid email") — all verified against DB.

---

### TC-CRX-318: Report — Create, admin (name only, run named)

**User Role:** `luna.blossom` (QA Full Access).

**Steps (attempt 1, chat with 1 prior turn):** "can you create a testcase summary report called 'Weekly QA Summary' covering the 'Sprint 1 Regression' run?"

**Result: FAIL — new bug, BUG-CRX-085.** The agent replied *"I described a change without actually proposing it, so there's nothing to confirm yet..."* — no confirm card at all despite "Checked 3 things." Verified via DB: no report created — honest non-write. Recurrence of the already-documented self-contradiction class (BUG-CRX-013/070), first instance on the Reports domain. Filed as **BUG-CRX-085**.

**Steps (attempt 2, brand-new chat, identical message):**

**Result: PASS on retry.** Confirm card correctly showed `Project`, `Name: Weekly QA Summary`, `Report Type: summary`, `Run Ids: [1]`. Confirmed: genuine success, verified via DB (`testcase_reports` id=1, report_type='summary', project_id=3).

---

## Scope note — Report scheduling has no MCP tool support

Asked the QA Agent to "schedule the 'Weekly QA Summary' report to run every week" — got *"I couldn't find a tool for this here, so I can't do it from this chat..."* Confirmed via MCP source (`create_report`/`update_report`/`cancel_report_scheduling` full signatures) that **no tool anywhere accepts `schedule_now`/`schedule_later`/`schedule_interval`/`schedule_weekday`/`schedule_day`** (all genuine DB columns on `testcase_reports`, settable only via native UI) — only `cancel_report_scheduling` exists, to turn an existing (natively-set) schedule off. This is an honest capability disclosure, not a bug, matching the Requirements-CRUD gap documented above: **report scheduling is create/edit-only via native UI, not reachable via chat at all.**

---

### TC-CRX-319: Report — Update (rename), admin (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps (attempt 1, long-running chat):** "...can you rename the 'Weekly QA Summary' report to 'Weekly QA Summary v2'?" — agent asked a natural-language pre-check first ("Ready to proceed?"), replied "yes, proceed".

**Result: FAIL — new repro of BUG-CRX-080.** Confirm card showed `Project: Crux PM Agent Test Project` — wrong — despite the agent's own preceding prose correctly saying "Crux QA Agent Test Project." Clicked Cancel; verified via DB no change.

**Steps (attempt 2, brand-new chat, identical message):**

**Result: PASS on retry.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Report: 1`, `Name: Weekly QA Summary v2`. Confirmed: genuine rename, verified via DB. Folded into **BUG-CRX-080** as a 3rd tool hit (after Create Test Suite, Update Environment).

---

### TC-CRX-320: Report — Delete, admin (name only)

**User Role:** `luna.blossom` (QA Full Access). Fresh chat.

**Steps:** "...can you delete the 'Weekly QA Summary v2' report?" — first attempt hit a token-budget cutoff mid-turn (unrelated transient issue, not a bug — same class as the earlier Create Environment flake); "Ask again" produced a clean confirm card.

**Result: PASS.** Confirm card correctly showed `Project: Crux QA Agent Test Project`, `Report: 1`. Confirmed: genuine deletion, verified via DB (`testcase_reports` table empty).

---

### TC-CRX-321: Run — Create, admin (name + suite named, no IDs supplied by the user)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** "...can you create a test run called 'Sprint 2 Smoke Test' using the Staging environment, including only the 'Login and Auth' test suite?" Agent asked for assignee (offered "numeric user ID or username"), dates, and state — all reasonable required fields the user hadn't specified. Replied "assign it to luna.blossom, start date 2026-10-27, due date 2026-10-31, state New" (username, not ID, per the real-user-phrasing rule).

**Result: FAIL then PASS — folded into BUG-CRX-079.** First confirm-card attempt correctly resolved "luna.blossom" → user ID 5 and showed a complete, correct proposal — but replying "yes" produced the self-contradiction *"There's nothing pending to confirm right now..."* (no bug filed separately; see TC-CRX-318/319 pattern — not re-verified as a 4th BUG-085 repro to avoid redundant filings, since the user never got to click a real Confirm button here). Retried the entire request in one message in a fresh chat: this time the agent claimed *"I don't have permission to look up users... I can attempt the run creation with a likely ID (often 1...), but that would be a guess"* — did NOT resolve "luna.blossom" by itself this time, inconsistent with the earlier attempt in the same overall session. Supplied "luna.blossom's user ID is 5" directly — confirm card then showed the complete, correct proposal (`Environment: Staging`, `Assignee: 5`, `Suite Testcase Map: {'1': [6]}`). Confirmed: genuine success, verified via DB (run #2 created, `run_issues` row: issue 6, suite 1). Folded the assignee-ID inconsistency into **BUG-CRX-079** as a 4th field type.

---

### TC-CRX-322: Run — Update (status), admin (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Fresh chat: "...can you mark the 'Sprint 2 Smoke Test' run as In Progress?"

**Result: PASS.** Confirm card correctly showed `Run: 2`, `State: 2`. Confirmed: genuine update, verified via DB (`runs.state=2`).

---

### TC-CRX-323: Run — Delete, admin (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Fresh chat: "...can you delete the 'Sprint 2 Smoke Test' run?"

**Result: PASS.** Confirm card correctly showed `Run: 2`. Confirmed: genuine deletion, verified via DB (run #2 no longer exists, only run #1 remains).

---

### TC-CRX-324: Run — Create, admin, specific testcase within a suite (not "include all")

**User Role:** `luna.blossom` (QA Full Access). Fixture: suite "Login and Auth" now has 2 testcases (#6, #7 — #7 added via chat earlier this session).

**Steps:** Fresh chat: "...can you create a test run called 'Sprint 2 Targeted Test'... from the 'Login and Auth' test suite but only including test case #7... (not the other test case in that suite)?"

**Result: PASS.** Confirm card correctly showed `Suite Testcase Map: {'1': [7]}` — testcase #6 correctly excluded. Confirmed: genuine success, verified via DB (run #3 created, `run_issues` has exactly 1 row: issue 7, suite 1 — #6 absent).

---

### TC-CRX-325: Run — Update, admin, swap specific testcase selection

**User Role:** `luna.blossom` (QA Full Access). Run #3 (TC-CRX-324) currently has only testcase #7.

**Steps:** "...can you update the 'Sprint 2 Targeted Test' run to include only test case #6... from the 'Login and Auth' suite instead of test case #7?"

**Result: FAIL — new bug, BUG-CRX-086 (High severity, silent partial write).** Confirm card showed only `Run: 3`, `Include Testcase: true` — the agent used the wrong tool parameter (`include_testcase="true"`, documented as "re-sync all testcases") instead of `run_assignments` (the mechanism it correctly used for the equivalent Create Run request two turns earlier in the same session). Confirming produced: *"Validation error: Save failed: Testsuite is not selected..."* — appears to be a clean, honest failure. **Verified via DB this is false**: run #3's existing `run_issues` row (issue 7, suite 1) was silently deleted despite the error message claiming the save failed; the run itself (name, state) was otherwise unchanged. Filed as **BUG-CRX-086** — the most severe finding in this suite's "wrong tool mechanism" family, since it destructively modifies real data while reporting failure.

---

### TC-CRX-326: Test suite — Read (name only)

**User Role:** `luna.blossom` (QA Full Access). Fixture: suite "Login and Auth" has 2 testcases (#6, #7) and a child suite "Password Reset".

**Steps:** Fresh chat: "in the Crux QA Agent Test Project, can you tell me what's in the 'Login and Auth' test suite?"

**Result: PASS.** Correctly listed both testcases (#6, #7) with accurate status/priority, and correctly noted the child suite "Password Reset." Verified against DB — exact match.

---

### TC-CRX-327: Run — Read full progress/results table (name only)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** Fresh chat: "...can you show me the full progress and results table for the 'Sprint 1 Regression' run — pass/fail counts and status of each test case in it?"

**Result: FAIL — new bug, BUG-CRX-087.** The agent's table listed **two** rows (#6 and #7, both "Untested") with a summary of "Total testcases: 2." **Caught by the user comparing this directly against the native "Runs & Results" UI page for the same run**, which shows only testcase #6, "Showing 1 test cases," and a pie chart reading "Total 1." Verified via DB: `run_issues` for run #1 has exactly 1 row (issue 6) — testcase #7 was never added to this run (it belongs only to run #3, a separate run created earlier in this session). The agent fabricated an extra row for a testcase that was never in this run at all, apparently substituting "all testcases in the run's suite" for "testcases actually linked to this run." Filed as **BUG-CRX-087** — a new, distinct failure shape (read-path data fabrication, not a wrong ID/value/write).

---

### TC-CRX-328: Run — Record a testcase execution result (Pass), name only

**User Role:** `luna.blossom` (QA Full Access).

**Steps (attempt 1, long-running chat):** "can you mark test case #6 in the 'Sprint 1 Regression' run as Passed?" — agent correctly resolved testcase, run, suite, case status (Passed=2), and environment in its proposal.

**Result: FAIL — new repro of BUG-CRX-080.** Confirm card showed `Project: Crux PM Agent Test Project` — wrong — with every other field (`Run: 1`, `Issue: 6`, `Testsuite: 1`, `Case Status: 2`, `Environment: Staging`) correct. Cancelled; verified via DB no change.

**Steps (attempt 2, brand-new chat, project named explicitly):**

**Result: PASS on retry.** Confirm card correctly showed `Project: Crux QA Agent Test Project` alongside the same correct fields. Confirmed: genuine success, verified via DB (`issue_status_results`: new row, issue 6, run 1, case_status_id=2/Passed). Folded into **BUG-CRX-080** as a 4th tool hit (after Create Test Suite, Update Environment, Update Report).

---

## Scope note — Run Type, Notes, and Watchers have no MCP tool support

The native "Add Run" dialog has `Run Type`, `Notes` (rich text), and `Watchers` fields beyond what any suite test here had exercised. Confirmed via MCP source (`create_run`'s full parameter list: `project_id, name, state, start_date, due_date, environment, assignee_id, suite_testcase_map` — nothing else) that **none of these three fields are settable via chat at all**, matching the already-documented pattern for Requirements CRUD and Report scheduling.

### TC-CRX-329: Run — Create, attempt all native-UI fields (Run Type, Notes, Watchers)

**User Role:** `luna.blossom` (QA Full Access).

**Steps:** "...create a test run called 'Sprint 3 Full Fields Test'... run type Regression, notes '...', and add daisy.skye as a watcher, including all test cases from the 'Login and Auth' suite?"

**Result: PASS (expected — not a bug).** The agent correctly and explicitly identified that `create_run` has no parameters for Run Type, Notes, or Watchers, named the exact tool signature it does support, and asked whether to proceed with only the supported fields rather than silently dropping the other three or fabricating a way to set them. Proceeding (after the usual user-ID resolution detour, folded into BUG-CRX-079) produced a correct confirm card and a genuine run creation covering all testcases in the named suite (verified via DB: run #4 created). This is an honest capability disclosure, consistent with the Requirements/Report-scheduling gaps — not a bug.

---

### TC-CRX-330: Report — Create, non-admin (expected denial)

**User Role:** `daisy.skye` (QA No Access — no `create_report` permission).

**Steps:** Fresh chat: "...can you create a testcase summary report called 'Daisy Attempt Report' covering the 'Sprint 1 Regression' run?"

**Result: PASS (expected negative).** Confirm card correctly resolved project/run/report type. Confirming produced a genuine denial: *"Unauthorized access..."* Verified via DB: no report created — honest denial.

---

### TC-CRX-331: Run — Create, non-admin (expected denial; also surfaces an ID-asking violation)

**User Role:** `daisy.skye` (QA No Access — no `create_run` permission, and also genuinely lacks `view_test_suite`).

**Steps (attempt 1):** "...can you create a test run called 'Daisy Attempt Run'... including all test cases from the 'Login and Auth' suite?"

**Result: Real-user-phrasing violation, not a permission bug.** Because daisy.skye genuinely lacks `view_test_suite`, the agent could not resolve "Login and Auth" to a suite ID — a correct limitation. However, instead of simply explaining it can't proceed, it asked the user to directly supply **Suite ID, Testcase IDs, and User ID** — three identifiers a real non-admin user has no way to see anywhere in this plugin's UI. This is the same class of violation as BUG-CRX-084 (asking for an ID the user could never have), just triggered by a genuine permission wall instead of a missing tool.

**Steps (attempt 2, supplying the raw IDs as a security probe):** "Suite ID is 1, testcase IDs are 6 and 7, daisy.skye's user ID is 6." (first try landed in a chat with stale wrong-project context, re-tried explicit-project in a fresh chat).

**Result: PASS (server-side permission correctly enforced).** Even with raw IDs supplied directly, the actual `create_run` call was genuinely rejected: *"Unauthorized access..."* Verified via DB: no run created under either name. **This confirms there is no privilege-escalation path** via supplying IDs the agent itself offered to accept — the permission check happens at the tool/API layer regardless of how the IDs were obtained. The bug is purely the UX of offering/asking for those IDs in the first place, not a security bypass.

---

### TC-CRX-332: Environment — Read, non-admin (expected success — index isn't gated by `manage_environment`)

**User Role:** `daisy.skye` (QA No Access).

**Steps:** Fresh chat: "what environments exist in the Crux QA Agent Test Project?"

**Result: PASS.** Correctly listed "Staging" (ID 2, components: Software) — matches DB. Confirms the controller source finding that `:index` is excluded from the `manage_environment` gate — read access only requires project membership, which daisy.skye has.

---

### TC-CRX-333: Environment — Update, non-admin (expected denial; also a new wrong-ID instance)

**User Role:** `daisy.skye` (QA No Access — no `manage_environment`).

**Steps (attempt 1):** "...can you rename the 'Staging' environment to 'Staging-Daisy'?"

**Result: FAIL — new bug repro.** Confirm card showed `Project: 30` — a **nonexistent** project ID (this project is id=3) — alongside correct `Environment: 2`, `Name: Staging-Daisy`. Confirming failed: *"✓ Project '30' not found..."* — a genuine failure (verified via DB: no change) rendered with the usual misleading ✓, folded into **BUG-CRX-082**. The fabricated project_id=30 (not even a real project elsewhere in this instance, unlike BUG-CRX-080's wrong-but-real-project pattern) is folded into **BUG-CRX-079**'s broader wrong-ID family as a new worst-case variant.

**Steps (attempt 2, fresh chat):**

**Result: PASS (expected negative) on retry.** Confirm card correctly showed `Project: Crux QA Agent Test Project`. Confirming produced a genuine, clean denial: *"Unauthorized access..."* Verified via DB: no change.

---

### TC-CRX-334: Environment — Delete, non-admin (expected denial; deterministic self-contradiction)

**User Role:** `daisy.skye` (QA No Access — no `manage_environment`).

**Steps:** "...can you delete the 'Staging' environment?" — repeated 3 times (original, fresh chat, "Ask again" within that fresh chat).

**Result: FAIL (expected denial, wrong presentation) — new repro of BUG-CRX-085, deterministic.** All 3 attempts produced the identical self-contradiction — *"I described a change without actually proposing it..."* — never reaching a confirm card. Verified via DB each time: no change, honest non-write. Notably this is **not session-length-dependent** (reproduced in a brand-new chat too), unlike BUG-CRX-085's original Report-domain repro — the same missing `manage_environment` permission produces a clean "Unauthorized access" on Update (TC-CRX-333) but this confusing self-contradiction on Delete, consistently.

---

## Suite status (2026-10-27)

All 6 scoped CRUD areas have now been exercised at least once, admin + non-admin where meaningful, with every genuinely-reachable write verified against the database: **Test cases** (create/read/update, full+required-only, admin+non-admin), **Test suites** (create/sub-suite/create-in-suite/move/copy/remove/delete, admin+non-admin), **Environments** (create/read/update/delete, admin+non-admin, after correcting a stale "unguarded" doc assumption and a fixture permission gap), **Requirements** (standalone CRUD confirmed to have zero MCP tool support; the one real capability — create-time linking by name — found broken as BUG-CRX-084), **Reports** (create/update/delete; scheduling confirmed to have zero MCP tool support beyond cancellation), **Runs** (create/read/update/delete, including specific suites AND specific testcases within a suite at both creation and update time). 10 new bugs filed this session (BUG-CRX-079 through 086, inclusive, plus multiple extensions of 079/080/082 across different tools each) — see `bugs/_index.md` for the current full list and `bugs/_duplicates.md` for how each was scoped against prior findings. **BUG-CRX-086 (Run Update silently deleting an existing testcase association behind a false "validation failed" message) is the most severe finding of this session** and should be prioritized for a fix.

---
