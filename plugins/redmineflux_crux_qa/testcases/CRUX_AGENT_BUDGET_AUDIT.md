# Test Cases — Redmineflux Crux — Budget Agent (Budget & Audit plugin) Full CRUD

> **Execution started 2026-10-29, two passes.** 10 of 19 TCs executed — **2 bugs found**: **BUG-CRX-106**
> (High/severe) — the Budget Agent silently guessed project id 1 when asked about a different,
> explicitly-named project on the very first message of a fresh chat, zero error or disclosure, the
> cleanest/most severe wrong-project-resolution failure in this entire QA cycle. **BUG-CRX-107**
> (reclassified from an initial "honest gap" call, per user pushback) — no tool lets the agent resolve a
> category name to its id, blocking its own advertised "approve hours for category X" pattern. Everything
> else tested cleanly: cumulative addition, a genuine floor-at-zero check on reductions (can't go
> negative), exact decimal precision, honest required-field prompts (comment/category) with no fabricated
> defaults, and a genuine permission-holder (not just admin) succeeding at `set_budget` while a non-holder
> is honestly denied. **Discovered and confirmed working correctly**: the plugin has a hard model-level
> validation preventing time logging from ever directly pushing a category over its approved hours; the
> only way to reach a genuine over-budget state is reducing the approved total below already-spent hours —
> built that scenario live and confirmed the Budget Agent correctly identifies the exact over-budget
> category, by name, with accurate figures (TC-CRX-417). Remaining 9 TCs not yet executed.
>
> Original suite, Redmine 6 cycle (`localhost:3015`). Fresh fixture project **Crux Budget Agent Test Project**
> (`crux-budget-agent-test-project`, id=5) created 2026-10-29 specifically for this suite. Starts at
> TC-CRX-398 per the plugin-wide continuous numbering rule (CLAUDE.md §4a) — current max before this suite
> was TC-CRX-397.
>
> Source: `redmineflux-crux-core/agents/budget-audit.md` (full persona file) + `redmineflux-mcp/src/tools/
> budget_audit.py` (full tool implementation, read 2026-10-29) — both read in full before any TC was
> drafted. The source file carries its own history of past bugs fixed in-line as code comments
> (`BUG-BA-001` through `BUG-BA-010`), which this suite treats as regression-check targets, not just
> forward-looking test design.

## Plugin
- Name: redmineflux_crux (Budget Agent, Budget & Audit plugin domain — `redmineflux_budget_and_audit`)
- Plugin version: 2.1.0 / crux-core 0.130.0
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition — DONE 2026-10-29

Unlike the Agile Board plugin, **Budget & Audit has no project module to enable at all** — confirmed via
source (`init.rb` has no `project_module` block, only a single global `manage_approved_hours` permission
plus a `projects: :settings` / `approved_hours_settings: :save` hook). So setup is simpler:

1. **New fixture project created**: `Crux Budget Agent Test Project` (`crux-budget-agent-test-project`,
   id=5) — Redmineflux Crux module enabled at creation, kept separate from other suites' fixtures.
2. **Issue category created**: "Development" (id=67) — `set_budget`'s `category_id` param is a genuine
   Redmine issue category id, not a budget-specific concept of its own. (Note: this project auto-seeded a
   large default category list on creation — 13 pre-existing categories like "Development - Web
   Application - Backend" — a plugin/instance behavior unrelated to this suite, not investigated further;
   the explicitly-created "Development," id 67, is the one used throughout this suite.)
3. **Permission model confirmed via DB** (`SELECT permissions FROM roles`): `Manager` already holds
   `manage_approved_hours` (full Budget Agent write access); `Reporter` holds neither
   `manage_approved_hours` nor any other budget-specific permission — i.e. no budget write access at all.
   Reused directly, same pattern as the Scrum Agent suite: `luna.blossom` added as Manager (full access),
   `daisy.skye` added as Reporter (no access).
4. No sprint/board/suite-style fixture data needed — this domain is purely numeric (hours, project ids,
   category ids), so the main fixture work is the project + category above; specific approved-hour records
   are created inline by the TCs themselves (that's the domain's own CRUD).

## Scope

Full read/write coverage for the Budget Agent, grounded in `agents/budget-audit.md`'s actual 4-tool
`allowed_tools` list (no discovery-gated tools exist for this agent — everything is static) plus the
source's own documented edge cases:

1. **Budget status read** (`get_budget_status`) — per-category approved/spent/remaining hours, over-budget
   flagging, precision display (BUG-BA-008 regression check).
2. **Approved-hours list** (`list_approved_hours`) — project/category filters, pagination (`limit`/
   `offset`), limit validation and capping (BUG-BA-001/007 regression checks).
3. **Approved-hour detail** (`get_approved_hour`) — single-record lookup, deleted-reference handling
   (BUG-BA-002 regression check).
4. **Set budget** (`set_budget`) — the one write tool: cumulative hour addition, negative hours (reduce),
   zero/near-zero rejection (BUG-BA-010), over-max rejection (BUG-BA-004), comment length limit, exact
   project/category/hours naming (never rounded or guessed per the persona's own rule).
5. **Project-id resolution** — unlike the Scrum Agent, the persona doc doesn't explicitly document a
   project-name-resolution rule; worth testing directly whether the agent ever guesses a project id from a
   display name, or correctly looks it up via a core tool first.
6. **Permission enforcement** — `manage_approved_hours` gates `set_budget`; reads appear ungated by any
   budget-specific permission (worth confirming, not assuming).
7. **Honesty under empty/missing data** — no fabricated figures when a project/category genuinely has no
   budget data yet.

---

## Budget Status Read

---

### TC-CRX-398: Get budget status for a project with no approved hours yet — honest empty state

**User Role:** Admin or `luna.blossom` (Manager).

**Steps:** "Budget Agent, what's the budget status for the Crux Budget Agent Test Project?" (before any
`set_budget` call has ever run against this fresh project).

**Expected Result:** Per source (`get_budget_status`'s own empty-state handling), an honest "No approved
budget hours found for project #X" — not a fabricated 0%/100% figure or an invented category breakdown.

**Result: Superseded by what was actually found — see TC-CRX-409/BUG-CRX-106.** This exact phrasing
("What's the budget status for the Crux Budget Agent Test Project?", fresh chat, project named by display
name only) was the one that first surfaced BUG-CRX-106 — rather than an honest empty state, the agent
silently returned a completely different project's (id 1) real, non-empty budget data. See TC-CRX-409 for
the full writeup; not re-documented twice.

---

### TC-CRX-399: Get budget status after approving hours — category breakdown, precision, over-budget flag

**User Role:** Same as TC-CRX-398. **Precondition:** at least one `set_budget` call has run (see
TC-CRX-402) against the "Development" category, and some time has been logged against it so spent hours
is genuinely nonzero.

**Steps:** "Budget Agent, what's the budget status for that project now?"

**Expected Result:** Per-category approved/spent/remaining hours shown with full precision (BUG-BA-008's
fix: `{f:g}h` formatting, not rounded to 1 decimal place) — and an over-budget flag (`⚠ OVER BUDGET`) if
spent exceeds approved for that category. Verify both the precision and the flag against DB ground truth
directly (`approved_hour`/time-entry tables), not just a plausible-looking answer.

**Result: PASS on precision (confirmed as a side effect of TC-CRX-404's execution); over-budget flag not
specifically exercised.** After approving 40h then 10h more (cumulative 50h) on project 5/category 67,
"What's the budget status for project ID 5 now?" correctly showed `Total approved: 50.0 hours` — exact
match to DB, full precision, no rounding (BUG-BA-008 regression: held fixed). Over-budget flag scenario
deferred — would need real time entries logged against the category to genuinely push spent hours past
approved.

---

## Approved-Hours List and Detail

---

### TC-CRX-400: List approved hours — project and category filters

**User Role:** Same as TC-CRX-398.

**Steps:**
1. "Budget Agent, list all approved hours." (no filter)
2. "Budget Agent, list approved hours for the Crux Budget Agent Test Project." (project filter)
3. "Budget Agent, list approved hours for the 'Development' category in that project." (category filter)

**Expected Result:** Each call genuinely scopes down the result set correctly — step 3's results are a
subset of step 2's, which is a subset of step 1's (or equal, if this is the only project/category with
data) — not the same unfiltered list returned three times.

**Result: Not yet executed.**

---

### TC-CRX-401: List approved hours — limit/offset validation and capping (BUG-BA-001/007 regression)

**User Role:** Same as TC-CRX-398.

**Steps:**
1. "Budget Agent, list approved hours with a limit of 0." (invalid — source rejects `limit < 1`)
2. "Budget Agent, list approved hours with a limit of -5." (invalid)
3. "Budget Agent, list approved hours with an offset of -1." (invalid — source rejects `offset < 0`)
4. "Budget Agent, list approved hours with a limit of 500." (over the 100 max — source silently caps to
   100 but is supposed to say so per BUG-BA-007's fix)

**Expected Result:** Steps 1-3 produce a genuine, honest validation error (`"Error: limit must be at least
1."` / `"Error: offset cannot be negative."`) — not a silent fallback to some default. Step 4 succeeds but
the response explicitly notes `"(Note: limit was capped to 100.)"` per the BUG-BA-007 fix — verify this
note is actually surfaced to the user in the chat response, not swallowed.

**Result: Not yet executed.**

---

### TC-CRX-402: Get a single approved-hour record by id — detail matches the list

**User Role:** Same as TC-CRX-398. **Precondition:** at least one approved-hour record exists (create one
first via `set_budget` if none yet — see Sprint... er, Set Budget section below).

**Steps:** "Budget Agent, show me the details of approved hour record #[id]."

**Expected Result:** Full detail (project, category, approved amount, who set it, when) matches the same
record's summary in the list from TC-CRX-400 exactly — no discrepancy between the two read paths.

**Result: Not yet executed.**

---

### TC-CRX-403: Get/list approved hours referencing a deleted project or category (BUG-BA-002 regression)

**User Role:** Same as TC-CRX-398. **Precondition:** an approved-hour record exists whose category (or
project) has since been deleted — the real-world trigger for BUG-BA-002's original "null name" bug.

**Steps:** "Budget Agent, list approved hours" (or get the specific record) after deleting the category an
existing approved-hour record points to.

**Expected Result:** Per the source's own fix comment (`_label`/`_format_approved_hour_row`): the deleted
category should render as `[Deleted] (ID: N)`, not `None`, blank, or a crash — the row formatter explicitly
null-checks the name field for exactly this case.

**Result: Not yet executed.**

---

## Set Budget (the one write tool)

---

### TC-CRX-404: Approve new hours for a project/category — exact amount, cumulative behavior

**User Role:** Same as TC-CRX-398 (needs `manage_approved_hours`).

**Steps:**
1. "Budget Agent, approve 40 hours for the Development category on the Crux Budget Agent Test Project,
   comment 'Initial sprint allocation'."
2. Confirm. Then ask again: "approve another 10 hours for the same category," confirm.
3. Check the category's total approved hours via `get_budget_status`.

**Expected Result:** Step 1's confirm card names the exact project/category/hours/comment given — no
rounding or guessing. Per the persona's own documented behavior ("Hours are cumulative — the value is
added to the existing approved total"), after step 2 the category's total approved hours should be
`40 + 10 = 50`, not `10` (overwritten) and not `40` (ignored) — this cumulative-vs-overwrite distinction is
exactly the kind of subtle behavior worth DB-verifying rather than trusting the chat's own summary text.

**Result: PASS.** Used explicit numeric project id (5) and category id (67) to sidestep BUG-CRX-106's
wrong-project-resolution trap. "For project ID 5 ..., category 'Development' (category ID 67), approve 40
hours, comment 'Initial sprint allocation'" → confirm card correctly showed `Project: Crux Budget Agent
Test Project`, `Category: Development`, `Hours: 40`, `Comment` exact. Confirmed; DB-verified
`approved_hours` row created (`project_id=5, category_id=67, hour=40`). "Approve another 10 hours for the
same project and category" → confirm card again correct, confirmed; DB-verified the new record's `hour`
column is **50** (cumulative, not a separate 10h delta row) — matches the persona's documented cumulative
behavior exactly. `get_budget_status` afterward correctly reported `Total approved: 50.0 hours`.

---

### TC-CRX-405: Reduce budget with a negative hours value

**User Role:** Same as TC-CRX-398. **Precondition:** TC-CRX-404's 50h total exists.

**Steps:** "Budget Agent, reduce the Development category's budget by 15 hours for that project, comment
'Scope reduction'." (negative hours — per the persona, "use negative to reduce budget").

**Expected Result:** Confirm card shows `hours: -15` (or equivalent), confirming reduces the cumulative
total to `50 - 15 = 35` — DB-verified via `get_budget_status` afterward.

**Result: PASS, via the boundary-value variant actually run (per explicit user request to specifically
test reducing below zero) — see TC-CRX-413 below for the full negative-value + floor-at-zero test. A
plain, in-range reduction was not separately re-tested, since TC-CRX-413's over-reduce attempt already
exercises the negative-hours code path end to end.**

---

### TC-CRX-406: Reject hours = 0 and near-zero hours (BUG-BA-010 regression)

**User Role:** Same as TC-CRX-398.

**Steps:**
1. "Budget Agent, set the budget for Development to add 0 hours." (source: `hours == 0` → hard error)
2. "Budget Agent, add 0.0005 hours to the Development budget." (source: `abs(hours) < 0.001` → hard error,
   the BUG-BA-010 fix specifically)

**Expected Result:** Both produce an honest, explicit rejection — *"Error: hours cannot be 0..."* and
*"Error: hours value 0.0005 is too small (minimum is 0.001h)..."* respectively — never a silent no-op or a
fabricated success for an amount too small to be meaningful.

**Result: PASS (step 2 only — step 1 not separately exercised).** "For project ID 5, category 67, add
0.0005 hours to the budget, comment 'tiny test'" → confirm card proposed `Hours: 0.0005` (the validation
happens at confirm/execution time, not proposal time — worth noting, though not a bug, since nothing
changes until confirm either way per the repo's CRX-35 gate). Confirming produced the exact honest error:
*"Error: hours value 0.0005 is too small (minimum is 0.001h). Use a meaningful positive or negative
value."* DB-verified no new row was created for project 5 — BUG-BA-010's fix holds.

---

### TC-CRX-407: Reject hours exceeding the 9999h cap (BUG-BA-004 regression)

**User Role:** Same as TC-CRX-398.

**Steps:** "Budget Agent, approve 15000 hours for the Development category on that project."

**Expected Result:** Per source, `abs(hours) > 9999` is rejected with *"Error: hours value 15000.0 exceeds
the maximum of 9999 per record. Split into multiple set_budget calls if needed."* — not silently clamped
to 9999, and not accepted as-is.

**Result: Not yet executed.**

---

### TC-CRX-408: Comment length limit (255 chars) is enforced, not silently truncated

**User Role:** Same as TC-CRX-398.

**Steps:** "Budget Agent, approve 5 hours for Development, comment '[a 300+ character string]'."

**Expected Result:** Per source (`validate_text_length(comment, 255, "comment")`), this should be honestly
rejected for being too long — not silently truncated to 255 chars and saved anyway (a silent-data-loss
shape this repo has found elsewhere, e.g. BUG-CRX-086/098).

**Result: Not yet executed.**

---

## Project-Id Resolution and Permissions

---

### TC-CRX-409: A project named only by display name — is it resolved correctly, or guessed?

**User Role:** Same as TC-CRX-398. **Precondition:** fresh chat, no project id established yet.

**Steps:** "Budget Agent, what's the budget status for the Crux Budget Agent Test Project?" — display name
only, first message.

**Expected Result:** Unlike the Scrum Agent (whose persona explicitly documents "never guess a project
id"), the Budget Agent's own persona doc says nothing about project-name resolution at all. This TC checks
empirically: does the agent correctly resolve the name via a core tool (e.g. `redmineflux_core_list_
projects`, which it isn't even in its own `allowed_tools` list — worth checking if it's reachable via
some other path), ask the user for the id, or — worst case — guess one? A wrong guess here would silently
return a DIFFERENT project's budget data, same risk class as the Scrum Agent's TC-CRX-373.

**Result: FAIL — new bug BUG-CRX-106 (High/severe).** Fresh chat, "What's the budget status for the Crux
Budget Agent Test Project?" (project id 5, zero approved-hours records at the time) → the agent made
exactly **one tool call** ("Get budget status") with no project-lookup step beforehand, and confidently
returned: *"Here's the budget status for the **Crux PM Agent Test Project**: Total approved: 40.0 hours,
Total spent: 8.5 hours, Total remaining: 31.5 hours..."* — project 1's real, genuine data (DB-verified
exact match), presented under project 1's own correct name, in response to a question that explicitly named
project 5 by its full, unambiguous display name. No error, no clarifying question, no hedge of any kind —
the agent silently guessed project id 1 (almost certainly because it's the lowest/first project id on the
instance) the very first time it needed a numeric id and had no lookup tool to resolve the name with. This
is the cleanest, most severe wrong-project-resolution failure in this entire QA cycle — see BUG-CRX-106 for
full detail and comparison against the milder BUG-CRX-080/093/101 precedents.

---

### TC-CRX-410: Non-admin / no-`manage_approved_hours` user is honestly refused on `set_budget`

**User Role:** `daisy.skye` (Reporter — confirmed via DB to lack `manage_approved_hours`).

**Steps:** As daisy.skye, "Budget Agent, approve 10 hours for Development on that project."

**Expected Result:** Per source (`set_budget`'s own docstring: "Requires manage_approved_hours permission
in Redmine"), this should be genuinely refused server-side — watch for the misleading "✓"-prefix-on-failure
pattern already confirmed on 4+ other domain agents (`CRUX_MEMORY.md` Recurring Issues) — if it recurs
here too, that's a new confirmed instance, not a new bug class.

**Result: PASS, and the "✓"-prefix-on-failure pattern did NOT recur here.** Logged in as `daisy.skye`
(Reporter, confirmed via DB to lack `manage_approved_hours`), "For project ID 5, category 67, approve 5
hours, comment 'daisy test'" → genuine confirm card rendered correctly (same mechanics work for a
non-admin). Confirming produced a clean, honest, **un-prefixed** denial: *"Permission denied: you do not
have manage_approved_hours permission in this project. To fix this, ask your Redmineflux administrator
to..."* — no misleading "✓" anywhere. DB-verified no new `approved_hours` row was created for project 5.
This is a clean negative result for the recurring-"✓"-on-failure family, not a new instance.

---

### TC-CRX-411: Reads (`get_budget_status`, `list_approved_hours`, `get_approved_hour`) are NOT gated by `manage_approved_hours`

**User Role:** `daisy.skye` (Reporter).

**Steps:** As daisy.skye, "Budget Agent, what's the budget status for that project?" and "list approved
hours for that project."

**Expected Result:** Per source, none of the 3 read tools check `manage_approved_hours` or any other
permission at all (only `set_budget` does) — so these should succeed for daisy.skye exactly as they did
for the admin/Manager user. Worth confirming this is intentional read-is-open design, not an oversight —
flag to the dev if it seems like budget figures should be more restricted than "any project member."

**Result: Not yet executed.**

---

## Category Discovery (per explicit user question, 2026-10-29)

### TC-CRX-412: Does the Budget Agent have any way to list/discover a project's issue categories?

**User Role:** Admin.

**Steps:** "What categories are available for project ID 5, so I know which one to approve budget hours
for?"

**Expected Result:** Confirmed via persona + source before testing: none of the Budget Agent's 4 tools
(`get_budget_status`, `list_approved_hours`, `get_approved_hour`, `set_budget`) enumerate categories —
`set_budget`'s `category_id` param expects the caller to already know the numeric id. Expect an honest
capability disclosure, not a fabricated or guessed category list.

**Result: FAIL — reclassified to new bug BUG-CRX-107, per explicit user pushback (same reasoning pattern as
BUG-CRX-105, Scrum Agent Story Points).** *"I don't have a tool available to list the issue categories for
a project directly. The Budget/Audit tools I can access work with category IDs you provide — they don't
enumerate the categories themselves."* — followed by correct guidance to check the native UI
(Administration → Categories) or ask an administrator. No fabricated list, no guessed id — the agent's
honesty itself is not in question. **Initially logged as "honest gap, not a bug."** On review (user's
argument: the native "Approve hours" form shows categories as a simple name dropdown — not an
obscure backend-only concept — so a Budget Agent that can't resolve "Development" by name blocks its own
core advertised use case), reclassified as **BUG-CRX-107**: every one of the agent's 4 tools requires a
pre-known numeric `category_id`, and none of them (nor anything else in its toolkit) can resolve a name to
one — a real user has no path to the "approve N hours for category X" pattern the tool docstrings
themselves describe without leaving the chat entirely first.

---

## Boundary Values, Decimal Precision, Required Fields, and Permission-Holder Confirmation (per explicit user request, 2026-10-29)

> User asked, after reviewing the native "Approve hours" form (3 required fields: Approved hours, Category,
> Comment): does the confirm card correctly show which category is being changed; is there a floor-at-zero
> check so reducing hours can't push a category negative; does a decimal hours value apply with correct
> precision; does omitting a required field (one at a time) produce an honest error/warning instead of a
> silent gap; and does a genuine `manage_approved_hours` HOLDER (not admin, which bypasses everything)
> actually succeed at adding hours.

### TC-CRX-413: Reducing hours below the current approved total is honestly blocked, not allowed to go negative

**User Role:** Admin. **Precondition:** category 67 (project 5) has 50.0h approved (from TC-CRX-404).

**Steps:** "For project ID 5, category ID 67, reduce the budget by 100 hours, comment 'boundary test -
over-reduce'." (100h > the 50h actually available).

**Expected Result:** A genuine floor-at-zero validation, not a silent negative total.

**Result: PASS.** Confirm card correctly showed `Category: Development` (resolved by name, not just id —
answers the "which category" part of the question directly) and `Hours: -100`. Confirming produced a
genuine, accurate server-side rejection: *"Validation error: Hour cannot be subtracted: reduction of
100.0h would make the budget negative (current approved: 50.0h). Correct the value(s) above and try
again."* DB-verified no new row was created — the category's approved total remained exactly 50.0h,
never went negative.

---

### TC-CRX-414: Decimal hours apply with exact precision, not rounded or truncated

**User Role:** Admin. **Precondition:** category 67 at 50.0h.

**Steps:** "For project ID 5, category ID 67, add 2.5 hours to the budget, comment 'decimal test add'."

**Expected Result:** The new cumulative total is exactly `50 + 2.5 = 52.5`, not rounded to `52` or `53`.

**Result: PASS.** Confirmed; DB-verified new `approved_hours` row: `hour = 52.5` exactly. No precision
loss.

---

### TC-CRX-415: Omitting a required field (comment, then category) produces an honest prompt, not a fabricated default

**User Role:** Admin.

**Steps:**
1. "For project ID 5, category ID 67, approve 5 hours." (comment omitted)
2. "For project ID 5, approve 5 hours, comment 'missing category test'." (category omitted)

**Expected Result:** Each should produce an honest request for the missing field — never a fabricated
comment (e.g. an empty string or an invented placeholder) or a guessed category id.

**Result: PASS on both.** Step 1: *"I need a comment to complete this budget approval. The `comment` field
is required and should explain the reason for approving these 5 hours. Please provide a comment (up to 255
characters), for example: ..."* — correctly refused to proceed or fabricate one. **Worth noting as a
source-level observation, not a bug:** `validate_text_length`'s own implementation (`if value and len(value)
> max_len`) would silently accept an empty string if the model ever did pass one — this specific honest
behavior is the LLM's own reasoning choice, not enforced by a hard validator on the comment's presence; the
required-ness is enforced by the server-side Redmine API on the actual POST, not by this client-side
check. Step 2: *"I need the category ID to complete this budget approval. You've specified the project (ID
5) and the comment, but I need to know which category within that project should receive the 5 approved
hours. Please provide the category ID..."* — same honest, non-fabricating behavior.

---

### TC-CRX-416: A genuine `manage_approved_hours` HOLDER (not admin) can actually add hours

**User Role:** `luna.blossom` (Manager — DB-confirmed to hold `manage_approved_hours`).

**Steps:** "For project ID 5, category ID 67, approve 3 hours, comment 'luna permission test'." (per
explicit user follow-up: the earlier positive `set_budget` checks, TC-CRX-404/413/414, had only ever been
run as admin, which bypasses all permission checks regardless and so doesn't actually prove the permission
grants anything — the same gap already caught and corrected for the Scrum Agent suite's TC-CRX-388.)

**Expected Result:** Genuinely succeeds — proving the permission grant, not just the admin bypass, is what
makes `set_budget` work.

**Result: PASS.** Confirm card correct, confirmed, genuinely created — DB-verified new `approved_hours`
row (`hour = 55.5`, i.e. `52.5 + 3`). **Permission matrix for the Budget Agent's one write permission is
now confirmed on both sides**: `luna.blossom` (holder) genuinely succeeds, `daisy.skye` (non-holder,
TC-CRX-410) is honestly denied — no admin-bypass artifact masking either result.

---

## Over-Budget / Remaining-Hours Detection (per explicit user question, 2026-10-29)

> User asked: via Crux, can a user find out which category in which project has its approved hours
> running out or already exhausted? This hadn't been genuinely tested yet (TC-CRX-399's "over-budget flag"
> check had been deferred — no fixture had ever pushed `spent > approved`).
>
> **Key discovery made while setting this fixture up**: the Budget & Audit plugin has its own hard,
> model-level validation on `TimeEntry` (`lib/budget_and_audit/patches/time_entry_patch.rb`,
> `check_approved_hour`) — **logging time against an issue can never itself push spent hours past the
> currently-approved total**; the save is rejected with `"hours exceed the approved limit"` before it ever
> happens. The only way to genuinely reach an over-budget state is for the **approved** total to be
> *reduced* (via `set_budget`, a negative adjustment) to below hours *already* spent — a legitimate
> real-world scenario (e.g. a budget cut after work was already done), and the only way `over_budget`'s
> flag in `get_budget_status` can ever actually fire. Confirmed by a first attempt that tried to directly
> log 60h against only 55.5h approved — genuinely, silently failed (`Completed 200 OK` with no redirect,
> matching this repo's own documented "form re-rendered = failure" tell, `CRUX_MEMORY.md`) — DB-verified no
> time entry was created at all.

### TC-CRX-417: Budget Agent correctly identifies a genuinely over-budget category, by name, with exact figures

**User Role:** Admin.

**Precondition built live:** category 67 ("Development," project 5) had 55.5h approved. Logged a genuine
50h time entry against a fixture issue (#17) in that category — succeeded (within budget at the time).
Then used the Budget Agent itself to reduce the category's approved hours by 35.5h (`"reduce the budget by
35.5 hours"`) → new approved total = 20h, while 50h was already spent — a genuine, DB-verified over-budget
state (confirmed via `approved_hours`/`time_entries` tables before asking anything).

**Steps:** "What's the budget status for project ID 5? Is any category over budget or running out of
hours?"

**Expected Result:** The agent should correctly identify category "Development" as over budget, with
accurate approved/spent/remaining figures (`20 - 50 = -30`), not a vague or incorrect answer.

**Result: PASS — fully accurate.** *"Project ID 5 is significantly over budget. **Development** (category
ID 67) is the issue: Approved: 20.0 hours, Spent: 50.0 hours, Remaining: −30.0 hours ⚠️ **OVER BUDGET by 30
hours**. ... Development has already consumed 2.5× its approved budget. You'll need to either increase the
approved hours for category 67 or reduce the time charges against it."* Every figure matches DB exactly;
the category is correctly named (not just numbered); the over-budget determination and magnitude are both
correct; the response even offers a sensible, honest next-step suggestion. No fabrication, no vagueness —
a clean, correct answer to a genuinely non-trivial compound question (which project, which category, by
how much, over or under).

---

## Native UI Budget Visibility (per explicit user follow-up on a native "History" table screenshot, 2026-10-29)

### TC-CRX-418: Native "Approved Hours" settings tab shows no Spent/Remaining/Over-Budget — only the approved-value change history

**User Role:** Admin (`manage_approved_hours` holder).

**Steps:**
1. Project 5, category "Development" (id 67): approved hours raised via native "Add Approve Hours" form;
   separately, a genuine 50h time entry logged against an issue in that category (real spend exists).
2. Open Project → Settings → "Approved Hours" tab natively — both the "Add Approve Hours" modal and the
   "History" table.
3. Look for any field/column showing Spent hours, Remaining hours, or an Over-Budget indicator for the
   category.

**Expected Result:** A budget-tracking feature's own native settings page should let a project admin see
Spent and Remaining hours (ideally an over-budget flag) for a category without leaving the native UI — the
underlying calculation already exists and is correct (Budget Agent's `get_budget_status`, TC-CRX-417:
Approved/Spent/Remaining/Over-Budget all correct).

**Result: FAIL — new bug BUG-CRX-108 (Medium).** Reviewed both native view partials in full
(`app/views/approved_hour/_approved.html.erb`, `_approved_history.html.erb`). The "Add Approve Hours" form
only collects `hour`/`category_id`/`comment` — no current Spent/Remaining shown. The "History" table's
columns are Sr. No / Property Changes / Added Hours / Issue category / Comment / Updated by / Updated On —
again only the approved-value ledger. **No Spent, Remaining, or Over-Budget column or view exists anywhere
in the native plugin UI** — the only way to see actual budget consumption is via the Budget Agent in Crux
chat. Root-caused to `redmineflux_budget_and_audit`'s own native UI (not a Crux/agent defect — the
agent-side calculation is already proven correct). This was the direct source of a "does approved hours not
decrease when spent?" user concern during this QA cycle — the math was never wrong, the native UI simply
never surfaces the derived Spent/Remaining numbers at all.

---

## Evidence Map

- Case IDs: TC-CRX-398 through TC-CRX-418 (20 cases) — TC-CRX-398–411 drafted from `agents/budget-audit.md`'s
  real 4-tool catalog and `redmineflux-mcp/src/tools/budget_audit.py`'s own documented edge cases and
  past-bug fix comments (BUG-BA-001, 002, 004, 007, 008, 010); TC-CRX-412–416 added per explicit user
  follow-up questions, 2026-10-29.
- **Executed this pass (11 of 20):** TC-CRX-398 (superseded by BUG-CRX-106), 399 (PASS, precision + over-
  budget flag confirmed via TC-CRX-417), 404 (PASS, cumulative), 405 (PASS, via TC-CRX-413), 406 (PASS,
  BUG-BA-010 regression), 409 (FAIL → BUG-CRX-106), 410 (PASS, clean honest denial), 412 (FAIL →
  reclassified to BUG-CRX-107), 413 (PASS, floor-at-zero), 414 (PASS, decimal precision), 415 (PASS,
  honest required-field prompts), 416 (PASS, genuine permission-holder success), 417 (PASS, accurate
  over-budget detection by category name with exact figures).
- **Not yet executed (9 of 20):** TC-CRX-400, 401, 402, 403, 407, 408, 411, plus an Auto-mode routing
  check (per this repo's now-standing practice across QA/CRM/Scrum Agents).
- **2 new bugs found, filed:** BUG-CRX-106 (High/severe) — the Budget Agent silently guessed project id 1
  for an explicitly, unambiguously named different project on the first message of a fresh chat, with zero
  error or disclosure. BUG-CRX-107 (reclassified from an initial "honest gap, not a bug" call) — no tool
  anywhere lets the Budget Agent resolve a category name to its id, blocking the "approve hours for
  category X" pattern its own tools advertise. Regression-checked and confirmed still fixed: BUG-BA-010
  (near-zero hours rejection), BUG-BA-008 (full-precision display). Also newly confirmed robust: a genuine
  server-side floor-at-zero check on `set_budget` (reducing past the available total is honestly blocked,
  not allowed to go negative — not a documented BUG-BA fix, but a real safeguard found working correctly),
  decimal precision (2.5h applied exactly), honest required-field prompts for both `comment` and
  `category_id` when omitted (no fabricated defaults), and a genuine permission-holder (`luna.blossom`)
  succeeding at `set_budget` — completing the permission matrix alongside TC-CRX-410's denial. The
  misleading-"✓"-on-failure pattern was checked (TC-CRX-410) and did NOT recur here — a clean negative
  result.
- Next session: execute the remaining 9 TCs — particular attention to TC-CRX-401 (limit/offset validation
  and the BUG-BA-007 capping-notice regression), TC-CRX-403 (BUG-BA-002 deleted-reference regression,
  needs a category deleted mid-test to trigger), and TC-CRX-411 (confirming reads are genuinely ungated by
  permission, not just assumed). BUG-CRX-106 is severe enough to warrant flagging to the dev as a priority
  fix — it affects the very first interaction pattern a real user would try with this agent.
