# Bug Report Template

- Bug ID: BUG-CRX-206
- Production Redmine Issue ID: #128968 (reported 2026-11-18 as a standalone issue — no dedicated production test case exists for the Test Author agent's own suite, assigned to Prashant Chaurasia, category Crux Plugin)
- Title: Test Author Agent creates real testcases in a project with the Testcase Management module disabled, instead of the documented text-only fallback — the plugin's own MCP API has no module-enabled check at all
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Test Author agent) + redmineflux_testcase_management (native plugin, root cause)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-630 (deferred pending a module-disabled fixture; found one already existing — "Crux No
Module Test," project #13, confirmed natively via `/projects/crux-no-module-test/settings/modules`: the
"Redmineflux Testcase Management" checkbox is unticked):

1. Created a plain issue (#147, "Export button on Reports page should download a CSV," with 3 explicit
   acceptance criteria) in project #13.
2. Test Author pinned, fresh chat: "Test Author, write test cases for issue #147." → correctly wrote 7
   text-only cases grouped by 3 criteria, then asked whether to create them and whether the Testcase
   Management plugin is active for that project (reasonable so far).
3. "Please create those as real test cases." → the agent called `list_test_suites`/`list_testcases`
   (genuine tool calls, "Checked 4 things"), then produced a real, structured confirm card: "I'll do 7
   things — confirm?" with 7 `Testcases Management Create Testcase` entries, each `Project: Crux No Module
   Test`.
4. Confirmed → **"✓ Created 7 of 7"** — all 7 testcases (#148–154) genuinely created as real issue records
   in project #13.

## Expected result

Per `redmineflux-crux-core/agents/test-author.md` (persona file, read in full as part of this retest, "How
you work" step 4):

> "Create them only when asked, and only through the Testcase Management plugin... Never create test cases
> as ordinary issues. **Without the plugin, give the cases as text and say they can be added once Testcase
> Management is installed.**"

Since project #13 genuinely does not have the Testcase Management module enabled (confirmed natively), the
agent should have recognized this and given the text-only fallback with the documented disclosure — not
silently created 7 real testcase records in a project where the module is off.

## Actual result

- All 7 testcases were genuinely created (native-verified via
  `redmineflux_testcases_management_list_testcases(project_id=13, tracker_id=4)` — all 7, #148–154, listed
  as real records alongside the 6 pre-existing ones already mistakenly in this project from BUG-CRX-187).
- **Root cause confirmed via direct source review**: `redmineflux_testcase_management`'s own
  `app/controllers/apis/mcp_testcase_controller.rb` (the controller every `redmineflux_testcases_management_*`
  MCP tool calls into) has `before_action` guards only for login and specific
  **permission** checks (`rftc_require_any_permission!`) — there is no `before_action` or inline check
  anywhere in the file for whether the project has the Testcase Management module enabled at all. The API
  has no module-gating whatsoever; it is purely permission-gated.
- This means the Test Author agent's documented "without the plugin, give cases as text" rule can never
  actually fire for a user who holds the right Testcase Management permission on a paper — the underlying
  tool calls it relies on to detect "no plugin here" (`list_test_suites`/`list_testcases`) simply succeed
  regardless of the project's own module checkbox, because the real API was never taught to check it
  either. The agent isn't lying or guessing here — it asked a reasonable discovery question and got a
  "yes, this works" answer from tools that should have said no.
- Native note: the created records are genuinely functional Redmine issues (`/issues/148` renders fine,
  and the project's own Issues list with `tracker_id=4` shows them) — this isn't a half-broken/orphaned
  write, it's a fully real, fully reachable testcase that simply shouldn't have been creatable here at all.

## Evidence

### Console / log

- Confirm card (verbatim, first entry): `Project: Crux No Module Test`, `Subject: TC1.1 — Export button
  downloads CSV file`, plus Priority/Description/Step 1/Step 2 fields — a genuine, well-formed testcase
  proposal, not a fabricated or malformed one.
- Chat response: `"✓ Created 7 of 7"` followed by 7 `"✓ Testcase created: ... (tracker #4, project #13)"`
  lines.
- Native verification: `redmineflux_testcases_management_list_testcases(project_id=13, tracker_id=4)` →
  13 total records in the project, including the 7 new ones (#148–154).
- Source: `redmineflux_testcase_management/app/controllers/apis/mcp_testcase_controller.rb`, lines 19–35 —
  full list of `before_action` guards, none referencing module enablement.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Distinct from BUG-CRX-187 (wrong-project resolution for a *different* reason —
  that bug landed testcases in this same project by mistaking it for the right one; this bug is about the
  module-enablement gap itself, which would recur in project #13 or any other module-disabled project
  regardless of which project was intended). Not a recurrence of any closed bug — first finding on the
  Testcase Management plugin's own module-gating (or lack of it) at the API layer, surfaced via the Test
  Author agent's documented fallback behavior never getting a chance to trigger.

## Retest — 2026-11-18 (FIXED — developer marked "In QA", production #128968)

Developer moved 12 bugs to "In QA." Pulled latest code, rebuilt crux-core/mcp, restarted redmine (full infra
details in BUG-CRX-204's Retest section). Built a fresh fixture issue (#162) in "Crux No Module Test"
(module still genuinely disabled, confirmed via Settings -> Modules) and repeated the exact original repro:

1. "Test Author, write test cases for issue #162." -> correct text-only cases, as before.
2. "Please create those as real test cases." -> now refuses with the documented fallback message naming
   that a project manager must enable the Testcase Management module in Settings -> Modules first.

Native-verified via list_testcases(project_id=13, tracker_id=1): "No testcases found for project #13" --
zero real testcases created, confirming the module-enabled check now genuinely exists at this layer.

Conclusion: FIXED. Moved to bugs/closed/, production #128968 synced In QA -> Done.
