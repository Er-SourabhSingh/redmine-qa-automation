# Test Cases — Redmineflux Crux — Scrum Agent (Agile Board plugin) Full CRUD

> **Execution started 2026-10-29.** Precondition completed same day: new fixture project **Crux Scrum
> Agent Test Project** (`crux-scrum-agent-test-project`, id=4) created, Agile Board + Crux modules
> enabled, board/backlog/sprint fixture data seeded (2 cards #15/#16, 1 active sprint "Scrum Sprint
> Fixture 1" id=1). Reused the existing `Manager`/`Reporter` roles for the admin/non-admin matrix instead
> of creating new ones — `Manager` already holds `view_agile_board`/`manage_agile_board_settings`/
> `manage_sprints` + core `edit_issues`, `Reporter` holds neither — so `luna.blossom` (Manager) and
> `daisy.skye` (Reporter) on this project give exactly the full-access/no-access split needed, no new role
> definitions required. `luna.blossom`/`daisy.skye` added as project members accordingly.
>
> 17 of 30 drafted TCs executed across seven passes (368, 371, 372, 373, 374, 375, 381, 383, 384, 387, 388,
> 390, 392, 394, 395, 396, 397 — see results inline below); **6 new bugs found**: BUG-CRX-100 (fake "epics" — the plugin's own
> `/epics` API has no real epic concept, labels every parentless issue of any tracker an epic), BUG-CRX-101
> (discovery-gated `create_column` silently targeted a stale project from an unrelated earlier suite
> instead of the project named in the message — caught before any write, blocked anyway by a lucky
> permission denial), BUG-CRX-102 (`create_issue`'s named-priority resolution picked id 4/"Blocker" for a
> request that said "Low", real id 1 — caught and cancelled before confirming), BUG-CRX-103 (High — a
> board config's `filters` are written in a shape that crashes the native board page with a 500 the moment
> it's ever opened — the entire Board Config feature is a dead end via chat), BUG-CRX-104 (a vague
> board-config-delete request falsely claimed the tools were unreachable, directly contradicted by the
> same chat's own immediately preceding successful calls), BUG-CRX-105 (High — no tool anywhere lets the
> Scrum Agent set Story Points on an issue, a core Scrum ceremony, not a peripheral field — contrast-tested
> against sprint assignment, TC-CRX-381, which works correctly). Auto-mode routing checked (TC-CRX-397) —
> unlike the QA Agent (BUG-CRX-094) and CRM/Sales Agent (BUG-CRX-096), no misrouting to Project Manager
> found on 2 ambiguous phrasings tested. Non-admin permission matrix (TC-CRX-388) checked across all 3 real
> Agile permissions (`view_agile_board`, `manage_agile_board_settings`, `manage_sprints`) with `daisy.skye`
> (Reporter, holds none) — all 3 PASS, clean honest denials, no misleading "✓" on any of them. Remaining 13
> TCs not yet executed — continuation planned next session.
>
> Original suite, Redmine 6 cycle (`localhost:3015`, plugin `agile_board` installed but **not yet enabled
> on any fixture project** as of 2026-10-29, now resolved — see above). Supersedes the historical
> `testcases/old_suites/CRUX_AGENT_AGILE_SCRUM.md` (Redmine 7.0.0, `localhost:3014`) — that suite's
> TC-CRX-001–009 numbers are NOT reused here; this suite starts fresh at TC-CRX-368 per the plugin-wide
> continuous numbering rule (CLAUDE.md §4a). The old suite's two confirmed findings (BUG-CRX-020 —
> fabricated-confirm cards with no real button, and BUG-CRX-031 — wrong workflow-status resolution) were
> both later confirmed FIXED against this exact plugin/core version during the round-22/23 retest batch
> (see `STATUS.md`'s 2026-10-28 entry) — this suite re-verifies the Agile domain specifically, since
> neither bug's fix was ever re-confirmed live against an actual Agile Board write on this Redmine 6
> stack (round-22/23 retested other agents' domains, not this one).
>
> Source: `redmineflux-crux-core/agents/agile-scrum.md` (full persona file, read 2026-10-29) —
> `allowed_tools` + "How you work"/"What you must never do" sections below are taken directly from it,
> not guessed from the plugin name.

## Plugin
- Name: redmineflux_crux (Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed, version not yet queried) / crux-core 0.130.0
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition — DONE 2026-10-29

Checked via DB (`enabled_modules` table) 2026-10-29: the `agile_board` plugin folder was present
(`/usr/src/redmine/plugins/agile_board` inside the `crux-redmine6-redmine-1` container), but no project on
this stack had the Agile module enabled yet. Resolved same day:

1. **New fixture project created**: `Crux Scrum Agent Test Project` (`crux-scrum-agent-test-project`,
   id=4) — Agile Board + Redmineflux Crux modules enabled at creation, kept separate from the PM suite's
   own fixtures.
2. **Fixture data seeded**: 2 issues (#15 "Scrum Fixture Card A - Login flow redesign," #16 "Scrum Fixture
   Card B - Checkout API integration," both default `Bug` tracker) created via the board's own "+ Create
   issue" boxes; 1 sprint ("Scrum Sprint Fixture 1," id=1, Active, 2026-10-29 → 2026-11-11) created via the
   Backlog page's "Create Sprint" link, with #15 assigned to it via the issue's own "Sprint" field (#16
   left in the unassigned backlog). Board uses the plugin's 5 default columns: `new`, `In progress`, `QA`,
   `Waiting for Customer Response`, `Done` — no custom columns needed for the base pass. No dedicated Epic
   tracker exists on this instance (only Bug/Feature/support/Testcase) and no invalid-workflow-transition
   fixture was built this round (deferred to the remaining TCs).
3. **Permission model confirmed via DB** (`SELECT permissions FROM roles`): the existing `Manager` role
   already holds `view_agile_board`, `manage_agile_board_settings`, `manage_sprints`, plus core
   `edit_issues`/`add_issues` — i.e. full Agile write access. The existing `Reporter` role holds neither
   Agile permission nor `edit_issues` — i.e. no Agile access at all. **The old suite's TC-CRX-009
   assumption (a dedicated `View Agile Board` permission separate from core `Edit issues`) is confirmed
   still accurate on this stack** — Agile Board does have its own permission group, distinct from core
   issue permissions.
4. **No new roles needed** — reused `Manager`/`Reporter` directly: `luna.blossom` added as Manager
   (full access), `daisy.skye` added as Reporter (no access), both via native UI project membership.

Both Playwright MCP/chat execution (the initial exploratory pass used here, consistent with how the
Project Manager/CRM/QA Agent suites began) and, once this becomes a committed suite, Playwright specs
under `automation/tests/` are expected per CLAUDE.md's automation-first rule.

## Scope

Full read/write CRUD coverage for the Scrum Agent, grounded in `agents/agile-scrum.md`'s actual
`allowed_tools` list plus its on-demand `agile` discovery group (board/column CONFIGURATION, moved off
the static list per the 2026-09-18 cost-accounting audit — still fully callable, just discovered first):

1. **Board reads** — project board (plain/grouped/grouped-cards), global board, my-page board, paging
   via `*_load_more`.
2. **Backlog and sprint reads** — ungroomed backlog, sprint list/detail, open epics.
3. **Card moves** — all three board-view variants (`move_issue` / `global_move_issue` /
   `my_page_move_issue`), plus field-level card/backlog-item updates.
4. **Sprint CRUD** — create/update/delete, assign-to-sprint.
5. **Discovery-gated board/column configuration** — column CRUD + reorder, board config CRUD, board
   settings update (one-time setup, not a daily ceremony — must be *discovered*, not refused as
   nonexistent).
6. **Create an issue from board context.**
7. **Project-id resolution honesty** — this plugin has no project-name lookup tool of its own; the agent
   must never guess a numeric project id from a display name alone.
8. **Negative/permission cases** — no sprint/column/board-config delete without the user naming the
   specific one; non-admin permission enforcement; honest refusal when Agile tools aren't reachable.

---

## Board Reads

---

### TC-CRX-368: Project board — plain, grouped, and grouped-cards views, all grounded in real tool calls

**User Role:** Admin or a Scrum-permission fixture user (TBD per Precondition #4).

**Steps:**
1. "Scrum Agent, show me the board for [fixture project]."
2. "Show me the board grouped by [assignee/priority — whatever grouping the plugin supports]."
3. Ask for just one group's cards if the UI/tool supports drilling into a single group.

**Expected Result:** Each response is grounded in a real `get_board` / `get_board_grouped` /
`get_board_group_cards` call — real column names and real card counts/subjects, not a plausible-sounding
guess. If the board is empty, the agent says so plainly rather than inventing cards.

**Result: PASS.** Asked "show me the board" with the project named only by display name, fresh chat —
agent correctly refused to guess a numeric project id and asked for the identifier (see TC-CRX-373).
Supplied the identifier `crux-scrum-agent-test-project`; the resulting board read was exact: `new` (1
issue, #15), `In progress` (1 issue, #16), `QA`/`Waiting for Customer Response`/`Done` (0 each) — matches
the real fixture exactly, DB-cross-checked.

---

### TC-CRX-369: Global board and My Page board, as distinct views from the project board

**User Role:** Same as TC-CRX-368.

**Steps:**
1. "Scrum Agent, show me the global board across all projects."
2. "Show me my page board."

**Expected Result:** Each call hits `get_global_board`/`get_global_board_group_cards` or
`get_my_page_board` respectively — genuinely different data/scope from the project-board call in
TC-CRX-368, not the same response reused.

**Result: Not yet executed.**

---

### TC-CRX-370: Long board/backlog list pages via `*_load_more`, not silent truncation

**User Role:** Same as TC-CRX-368. **Precondition:** a board or backlog with enough cards to require a
second page (the old suite's TC-CRX-001 could never exercise this — no data was ever large enough; seed
enough fixture cards this time specifically to force it).

**Steps:** "Scrum Agent, show me the full board/backlog" against the seeded large list.

**Expected Result:** The agent either pages through via `backlog_load_more`/`board_load_more` to give a
complete accounting, or explicitly says there's more beyond what it fetched — never silently drops items
past the first page without saying so.

**Result: Not yet executed.**

---

### TC-CRX-371: Backlog (ungroomed items) and open epics, read correctly

**User Role:** Same as TC-CRX-368.

**Steps:**
1. "Scrum Agent, what's in the backlog for [project]?"
2. "What epics are open?"

**Expected Result:** `get_backlog` and `list_epics` calls genuinely made; an honest "backlog is empty" /
"no open epics" if that's the real state, not a fabricated list.

**Result: PASS on backlog, FAIL on epics — new bug BUG-CRX-100.** Backlog correctly separated sprint-
assigned (#15, under "Sprint #1") from unassigned (#16) — DB-accurate. But "Open Epics" listed **both**
#15 and #16, plain `Bug`-tracker issues never designated an epic in any way, and the agent told the user
"Both cards are also tagged as epics." Root-caused via source: the plugin's own `/epics` API endpoint
(`Api::V1::BoardsController#epics`) has no real epic filter at all — it returns every issue with
`parent_id: nil`, regardless of tracker. The agent is honestly relaying a structurally broken backend
response, not hallucinating. Filed as **BUG-CRX-100**.

---

### TC-CRX-372: Sprint list and sprint detail

**User Role:** Same as TC-CRX-368.

**Steps:**
1. "Scrum Agent, what sprints exist for [project]?"
2. "What's in the current/named sprint — dates, cards, status?"

**Expected Result:** `list_sprints`/`get_sprint` grounded answers; the sprint's real date range and card
list, not an approximation.

**Result: PASS** (covered by the same turn as TC-CRX-371 above — the combined backlog/epics/sprints
question's "Sprints:" section correctly showed "Sprint #1 [active] – Scrum Sprint Fixture 1 |
2026-10-29 → 2026-11-11 | 1 issue assigned," matching DB exactly).

---

## Project-Id Resolution Honesty

---

### TC-CRX-373: A project named only by display name, with no id confirmed yet this chat, is NOT guessed

**User Role:** Same as TC-CRX-368. **Precondition:** fresh chat — no prior turn has established this
project's numeric id.

**Steps:** "Scrum Agent, what's in the current sprint for the [Fixture Project Display Name] project?" —
display name only, never a numeric id, and this is the first message in the chat.

**Expected Result:** Per the persona file's explicit rule (#1, "How you work"): *"this plugin's tools have
no project-name lookup of their own ... If the user names a project by display name only ... and you have
no confirmed id for it from this conversation, ask them for the id or exact identifier — never guess one
... a wrong id silently returns a DIFFERENT project's board."* The agent must ask for the id/identifier,
not silently call `get_board`/`list_sprints` with a guessed id. This is a distinct, Agile-specific rule
not seen on the other domain agents (QA Agent and CRM/Sales Agent both have real name→id lookup tools;
Scrum Agent explicitly does not) — worth testing in isolation since a wrong guess here returns a
plausible-looking but WRONG project's data, not an error.

**Result: PASS.** Fresh chat, "show me the board" for the project named by display name only — agent
replied *"I need the numeric project ID for the 'Crux Scrum Agent Test Project' ... Could you provide
that ID, or let me know the exact project identifier if it's not a numeric ID?"* — never guessed. Gave
the real identifier (`crux-scrum-agent-test-project`, not a numeric id, per this repo's real-user-phrasing
convention) and it resolved correctly on the next turn (see TC-CRX-368).

---

### TC-CRX-374: Once a project id IS established this chat (via identifier or a prior confirmed turn), it's reused correctly

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, what's in the sprint for project [exact identifier, e.g. `crux-pm-agent-test-project`]?" then a same-chat follow-up naming the project by display name only ("...and what's the backlog look like for that project?").

**Expected Result:** The follow-up correctly reuses the id established earlier in the same chat — contrast
with TC-CRX-373's fresh-chat case. (Also worth checking the reverse failure mode seen elsewhere in this
suite file's sibling suites: a *stale* id from an unrelated earlier turn being wrongly reused when the
current message actually names a *different* project — if time allows, add a variant.)

**Result: PASS on the plain-reuse case; the reverse (stale-id) failure mode DOES exist — see BUG-CRX-101
below.** Once project 4 was established, subsequent same-chat turns ("Move card #15...", "clean up old
sprints...") correctly stayed scoped to it with no re-naming needed. However, a later turn in the SAME
chat that invoked a *discovery-gated* write tool (`create_column`) silently substituted an entirely
unrelated project ("Crux PM Agent Test Project," never mentioned anywhere in this chat) despite the
current message explicitly re-naming "Crux Scrum Agent Test Project" — filed as **BUG-CRX-101** (see
TC-CRX-384). So: plain reuse of an already-established project across ordinary turns works correctly:
PASS for that half; the project-identity rule breaks specifically on discovery-gated tools: FAIL, covered
under TC-CRX-384/BUG-CRX-101 rather than re-filed here.

---

## Card Moves and Field Updates

---

### TC-CRX-375: Move a card on the project board — exact target column resolved correctly

**User Role:** Same as TC-CRX-368. **Precondition:** a named fixture card, and the board's real column
names confirmed via native UI first (regression check for the old suite's BUG-CRX-031 — wrong-status
resolution; confirm the exact, real column name before asserting PASS/FAIL).

**Steps:** "Scrum Agent, move card #[N] to the '[real column name]' column."

**Expected Result:** `move_issue` confirm card names the exact card and the exact, correct target column
— not a different, wrong-but-plausible column name (BUG-CRX-031's old failure shape). Confirming
genuinely moves it, verified via DB/native board.

**Result: PASS.** "Move card #15 to the QA column" → confirm card correctly showed `Issue #15`, `Column
Name: QA` — a genuine clickable Confirm/Cancel card (DOM-verified, regression-check for the old suite's
BUG-CRX-020, held fixed here). Confirmed; DB-verified `issues.status_id` for #15 changed to `4` (QA) —
matches BUG-CRX-031's old failure shape NOT recurring here (correct column resolved, not a wrong-but-
plausible one).

---

### TC-CRX-376: Move a card via the global board and my-page board variants (not just project board)

**User Role:** Same as TC-CRX-368.

**Steps:**
1. A move phrased in global-board context → expect `global_move_issue`.
2. A move phrased in my-page context → expect `my_page_move_issue`.

**Expected Result:** Each uses the correct variant tool for its context, not a mismatched one (e.g. using
the plain project `move_issue` when the user clearly meant the global or my-page view) — this was never
actually isolated in the old suite (TC-CRX-002 stopped after the base case hit BUG-CRX-020).

**Result: Not yet executed.**

---

### TC-CRX-377: Update a card's field via `update_card`, naming the board variant

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, update card #[N]'s [field] to [value] on the project board." (per the persona:
`update_card` takes a `board` param — `'project'`/`'global'`/`'my_page'`).

**Expected Result:** Confirm card shows the correct `board` value and the exact field/value — no silently
defaulted board scope.

**Result: Not yet executed.**

---

### TC-CRX-378: Update a backlog item's field via `update_backlog_issue`, distinct from a board card update

**User Role:** Same as TC-CRX-368. **Precondition:** a genuine ungroomed backlog item (not yet on any
sprint/board column).

**Steps:** "Scrum Agent, update the backlog item '[title]' to set [field] to [value]."

**Expected Result:** `update_backlog_issue` is used (not `update_card`, which is for board-placed cards) —
confirms the agent distinguishes backlog-scope vs. board-scope updates correctly.

**Result: Not yet executed.**

---

### TC-CRX-379: `update_issue_field` for a field-only edit from board/backlog context

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, set the priority on card #[N] to [value]" (a plain field edit, not a column move).

**Expected Result:** `update_issue_field` resolves the named value correctly (e.g. priority through its
own real ids, not a guessed one — same class of check as the QA Agent suite's "Getting the ids right"
rules, worth verifying Scrum Agent does the same even though its own persona file doesn't spell this out
explicitly).

**Result: Not yet executed.**

---

## Sprint Management

---

### TC-CRX-380: Create a sprint — exact dates and name, genuine confirm card

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, create a sprint called '[name]' starting [date] through [date] for [project]."

**Expected Result:** `create_sprint` confirm card with the exact name/dates — and, regression-checking the
old suite's BUG-CRX-020, a **genuine clickable Confirm/Cancel button** (DOM-verify, don't trust the
visual/text appearance of the message per `CRUX_MEMORY.md`'s standing note on this bug class). Confirming
genuinely creates it, verified via DB/native sprint list.

**Result: Not yet executed.**

---

### TC-CRX-381: Assign a card to the sprint just created

**User Role:** Same as TC-CRX-368. **Precondition:** TC-CRX-380's sprint exists.

**Steps:** "Scrum Agent, assign card #[N] to sprint '[name]'."

**Expected Result:** `assign_to_sprint` resolves the sprint by name correctly (no numeric sprint id ever
asked of the user — same real-user-phrasing principle applied throughout this QA repo, CLAUDE.md §4a).

**Result: PASS.** "Can you assign card #16 to the 'Scrum Sprint Fixture 1' sprint?" (card #16 was still
unassigned/backlog at this point) → confirm card correctly showed `Project: Crux Scrum Agent Test
Project`, `Issue: 16`, `Sprint: 1` — the real numeric id for "Scrum Sprint Fixture 1," resolved from the
name alone, never asked of the user. Confirmed (`Agile Assign To Sprint`); DB-verified `issues.
sprint_craft_id` for #16 changed `NULL → 1`. This also serves as the contrast case for BUG-CRX-105 (Story
Points gap) — proves the agent's write/confirm mechanics work correctly in general for genuine Scrum
ceremonies; the Story Points gap is specific to that one field, not a broader write defect.

---

### TC-CRX-382: Update a sprint's dates

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, update sprint '[name]''s end date to [new date]."

**Expected Result:** `update_sprint` confirm card shows only the changed field, the rest of the sprint's
existing state preserved — this QA repo has already found an "unmentioned field silently
altered/defaulted" defect class on a different domain agent (BUG-CRX-098, Run Update/assignee); worth
checking Scrum Agent's `update_sprint` doesn't have an equivalent (e.g. does changing the end date alone
ever touch the start date or sprint name unexpectedly?).

**Result: Not yet executed.**

---

### TC-CRX-383: Delete a sprint — only when named exactly, never inferred

**User Role:** Same as TC-CRX-368.

**Steps:**
1. Negative: "Scrum Agent, clean up old/finished sprints." (vague, no exact name)
2. Positive: "Scrum Agent, delete sprint '[exact name]'."

**Expected Result:** Step 1 produces **no delete proposal at all** — the agent asks which sprint
specifically, per the persona's explicit "never propose deleting a sprint ... without the user having
named the specific one" rule. Step 2, with the exact name given, produces a genuine confirm card and a
real deletion once confirmed.

**Result: PASS on the negative half; positive half not yet executed.** "Clean up old/finished sprints"
produced NO delete proposal — agent correctly replied it needed to know which sprint, listed the one real
sprint ("Sprint #1 [active]"), correctly noted it's not finished yet (today is 2026-10-29, sprint runs
through 2026-11-11), and offered to call `list_sprints` for the full picture rather than fabricating a
delete target. Positive half (delete a sprint named exactly) deferred to next session — doing so now would
destroy the one sprint fixture other TCs in this pass still needed.

---

## Discovery-Gated Board/Column Configuration

---

### TC-CRX-384: Column CRUD is genuinely reachable via discovery, not falsely denied

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, create a column called '[name]' for [project]'s board."

**Expected Result:** Per the persona: column CRUD/reorder is NOT on the static tool list — the agent must
call `crux_discover_tool_groups` then `crux_discover_group_tools` with group `agile` before it can act,
but it must NOT refuse this as "no tool exists" (the false-capability-denial shape already confirmed on
other domain agents — BUG-CRX-029/032/034/050 family). A correct response discovers the group first, then
produces a genuine `create_column` confirm card.

**Result: Mixed — discovery itself works (no false denial), but TWO new bugs found along the way.**
"Create a column called 'Blocked'" → agent correctly discovered the `agile` group (no "I don't have this
tool" denial) and asked a reasonable clarifying question (which status id should the column map to, since
`create_column` genuinely requires one). Supplied "Waiting for Customer Response" — confirm card resolved
it correctly to status id 1. Confirming hit a real, honest validation error: *"Wip limit must be greater
than 0"* — the confirm card never surfaces a WIP-limit field by default, so every `create_column` call
needs one supplied explicitly; this is a rough edge but an honestly-surfaced one, not filed as a bug.
Replying "set the WIP limit to 5" triggered the known self-contradiction pattern (BUG-CRX-085's shape —
*"I described a change without actually proposing it"* — not re-filed, already a documented recurring
class). A fully-explicit one-shot retry naming the project again produced a confirm card with `Wip Limit:
5` — but `Project: Crux PM Agent Test Project`, an entirely unrelated project never mentioned anywhere in
this chat, silently substituted for the "Crux Scrum Agent Test Project" named explicitly in that exact
message. Filed as **BUG-CRX-101**. Confirming this wrong-project card was itself rejected by a genuine
`manage_agile_board_settings` permission check — no column was created anywhere (DB-verified: both
projects' `rf_board_columns` show only their 5 original default columns) — a lucky accident, not a safety
net the fix should be credited for.

---

### TC-CRX-385: Reorder columns, delete a column — same discovery path, exact target named

**User Role:** Same as TC-CRX-368. **Precondition:** TC-CRX-384's column exists.

**Steps:**
1. "Scrum Agent, reorder the columns to put '[name]' first."
2. "Delete column '[name]'."

**Expected Result:** Both reachable via the same discovered `agile` group; the delete only proceeds
because the column was named exactly (same naming-discipline rule as sprint delete, TC-CRX-383).

**Result: Not yet executed.**

---

### TC-CRX-386: Board config CRUD and board settings update, also via discovery

**User Role:** Same as TC-CRX-368.

**Steps:**
1. "Scrum Agent, create a board config called '[name]' for [project]."
2. "What are the current board settings / column configs for this project?" (`get_board_config` /
   `list_board_configs` / `get_project_board_settings`)
3. "Update the board settings to [change]."
4. "Delete board config '[name]'."

**Expected Result:** All reachable via the `agile` discovery group (one call should restore every
board/column-setup tool per the persona file's own claim — verify this is genuinely true in one
discovery call, not requiring several retries/re-discoveries, which would itself be a cost/UX defect
worth flagging like the already-documented re-discovery-loop shapes on other agents).

**Result: Not yet executed.**

---

## Create Issue From Board Context

---

### TC-CRX-387: Create an issue directly from the board/backlog, every field filled precisely

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, create an issue titled '[title]' in [project] from the backlog, priority [X],
assigned to [Y]."

**Expected Result:** `create_issue` confirm card with every named field filled exactly as described — no
invented subject/description/defaults for fields the user specified. Regression-check against the old
suite's finding here too (BUG-CRX-020's fabricated-confirm shape was first conclusively proven on this
exact action).

**Result: FAIL — new bug BUG-CRX-102 (wrong-priority-id resolution); BUG-CRX-020 regression-check
PASSES.** "Create an issue titled 'Scrum Fixture Card C - Payment retries' from the backlog, priority
Low" (project named explicitly this time, avoiding BUG-CRX-101's trap) → agent asked a reasonable
clarifying question (Tracker? Sprint assignment?), answered "Tracker Bug, leave it unassigned." Confirm
card was genuine and clickable (BUG-CRX-020 regression-check: PASS, real button present) with `Project:
crux-scrum-agent-test[-project]` (correct this time), `Tracker: Bug`, `Subject` exact — but `Priority: 4`,
which is "Blocker" (the most severe priority on this instance), not "Low" (real id 1) as requested — the
exact opposite end of the scale. Cancelled before confirming; DB-verified no issue was created. Filed as
**BUG-CRX-102**.

---

## Negative / Permission Cases

---

### TC-CRX-388: Non-admin / no-Agile-permission user is honestly refused on a write attempt

**User Role:** The no-permission fixture user (Precondition #4). **Note:** do not assume the old suite's
"dedicated `View Agile Board` permission, separate from core `Edit issues`" finding still applies on this
stack/version — re-derive which permission actually gates access here first (Precondition #3), then
design this TC's exact precondition against the real current permission model rather than copying the old
assumption forward.

**Steps:** As the no-permission user, "Scrum Agent, move card #[N] to a different column."

**Expected Result:** A real confirm card may or may not render depending on where the permission check
sits (board-view-level vs. the underlying core `Edit issues`/plugin permission) — but confirming must be
genuinely refused server-side with an honest message, no silent success. Watch for the misleading
"✓"-prefix-on-failure pattern already confirmed on 4+ other domain agents (`CRUX_MEMORY.md`'s Recurring
Issues) — if it recurs here too, that's a 5th+ confirmed instance, not a new bug.

**Result: PASS on all 3 permissions, per explicit user request to check `View Agile Board`,
`Manage agile board settings`, and `Manage sprints` individually with `daisy.skye` (Reporter — DB-confirmed
to hold none of the 3).**

1. **View Agile Board** (board read): "show me the board" → honestly refused — *"The Agile Board module is
   not enabled for the Crux Scrum Agent Test Project, or I don't have permission to view it..."* No data
   leaked, no fabricated board shown.
2. **Manage sprints** (`create_sprint`): "create a sprint called 'Daisy Test Sprint'..." → genuine confirm
   card rendered (card resolution itself isn't permission-gated), but confirming was honestly refused —
   *"You do not have permission to perform this action..."* — DB-verified no sprint was created
   (`sprint_crafts` for project 4 still shows only the original fixture sprint).
3. **Manage agile board settings** (`update_column`'s WIP limit, discovery-gated): "set a WIP limit of 3 on
   column ID 1" → discovery worked even for daisy (the `agile` tool group itself isn't permission-gated,
   only the underlying write action is), genuine confirm card rendered, confirming honestly refused —
   *"You do not have permission to perform this action..."* — DB-verified column 1's `wip_limit` is still
   `NULL`, untouched.

**No misleading "✓"-prefix-on-failure recurred on any of the 3** — all three denials were clean, honest,
un-prefixed error text. A solid, clean negative result across the board for this permission matrix.

**Positive side also verified (per explicit user follow-up question — the earlier admin-based "positive"
checks don't actually prove the permission grants anything, since admin bypasses all permission checks
regardless): logged in as `luna.blossom` (Manager, DB-confirmed to hold all 3 permissions) and repeated all
3 actions.**

1. **View Agile Board**: "show me the board" → genuinely succeeded, correct real data (`new: 0, In
   progress: 1, QA: 1, Waiting for Customer Response: 0, Done: 0` — matches DB).
2. **Manage sprints** (`create_sprint`): "create a sprint called 'Luna Permission Test Sprint'..." →
   genuine confirm card, confirmed, genuinely created — *"✓ Sprint created: #2 'Luna Permission Test
   Sprint' 2026-11-01 → 2026-11-14 [open]."* DB-verified `sprint_crafts` now has 2 rows for project 4.
3. **Manage agile board settings** (`update_column`'s WIP limit): "set a WIP limit of 4 on column ID 2" →
   genuine confirm card, confirmed, genuinely applied — DB-verified column 2's `wip_limit` is now `4`.

**Full permission matrix now confirmed clean on both sides** — holder (`luna.blossom`) succeeds genuinely
on all 3 actions, non-holder (`daisy.skye`) is honestly denied on all 3, with no misleading "✓" anywhere
and no silent success/failure mismatch in either direction.

**Result: Not yet executed.**

---

### TC-CRX-389: Agile tools unreachable (if ever the case) is disclosed honestly, not papered over

**User Role:** Same as TC-CRX-368. **Precondition:** only meaningfully testable if the Agile plugin's
tools are ever genuinely unreachable (e.g. mid-deployment issue) — otherwise this is a documentation
placeholder, not a TC to force-fail.

**Steps:** N/A until a genuine unreachable-tools condition can be arranged or occurs naturally.

**Expected Result:** Per the persona's closing rule: *"If the Agile plugin's tools aren't reachable in
this deployment, say so plainly instead of answering from guesswork."* — an honest capability gap, not a
fabricated answer (the already-documented false-capability-denial family is the OPPOSITE failure mode —
claiming tools don't exist when they do — so this TC specifically checks the correct-and-honest version of
"tools genuinely aren't there," which is different from every bug this suite's sibling suites have found).

**Result: Not yet executed — deferred until a real precondition can be arranged.**

---

## Board Settings, Group-By, and Board Config (per explicit user request, 2026-10-29 — native UI explored first)

> Native UI exploration (`/projects/crux-scrum-agent-test-project/agile_board`) surfaced two **distinct**
> real features neither covered above nor previously tested via chat, both confirmed to have genuine MCP
> tool coverage (`redmineflux-mcp/src/tools/agile.py`, read 2026-10-29):
>
> 1. **Board Settings** (native "⚙️ Board Settings" panel) — live, per-viewer-saved board configuration:
>    Board Type (Kanban/Scrum toggle), per-column visibility + WIP limit (0-50) for each of the 5 real
>    columns, Visible Card Fields (Id/Subject/Tracker/Assignee required + 16 optional fields — Priority,
>    Author, Start/Due Date, Estimated time, Spent hours, Progress, Parent task, Children count,
>    Description, Last comment, Tags, Category, Target version, Journals count, Attachments count), Show
>    Totals (Estimation/Spent time), Column Reordering toggle. Maps to the discovered `agile` group's
>    `update_board_settings` tool.
> 2. **Board Config** — a genuinely separate, *named/saved* board definition with its own `group_by` and
>    `filters` dict (confirmed via source: `create_board_config`/`update_board_config` both accept
>    `group_by` and `filters` params, distinct from the live per-viewer Board Settings above). Maps to
>    `create_board_config`/`update_board_config`/`delete_board_config`/`list_board_configs`/
>    `get_board_config`.
> 3. **Group By** (toolbar button, not a modal) — real, immediate re-render of the board grouped by one of
>    10 valid server-side values confirmed via source (`_VALID_GROUP_BY` in `agile.py`): `none`,
>    `assignee`, `tracker`, `priority`, `project`, `category`, `fixed_version`, `done_ratio`, `is_private`,
>    `parent`, `author`. Maps to `get_board_grouped`/`get_board_group_cards` (group_by param) — **not**
>    part of Board Config, a live toolbar-level grouping independent of any saved config.
> 4. **Filters** (toolbar "More filters" panel) — a full Redmine-style filter builder with ~45 available
>    fields (Status, Tracker, Priority, Assignee, Sprint, Story Points, Requirement, TestSuite, Run, and
>    many more standard Redmine fields/relations). The persona's own tool catalog gives no indication any
>    static tool exposes arbitrary filter application beyond what `create_board_config`/`update_board_config`'s
>    `filters` dict can carry — this round only tests what's realistically reachable via chat (a board
>    config's saved filters), not the full 45-field native filter UI, which is out of a chat-shaped scope.

### TC-CRX-390: Board — read grouped by each of the 10 valid `group_by` values

**User Role:** Same as TC-CRX-368.

**Steps:** For each of `assignee`, `tracker`, `priority`, `project`, `category`, `fixed_version`,
`done_ratio`, `is_private`, `parent`, `author`: "Scrum Agent, show me the board for [project] grouped by
[value]."

**Expected Result:** Each produces a genuine `get_board_grouped` call with that exact `group_by` value,
real group names/counts matching DB — not a silently-defaulted grouping, and not a rejection of a value the
source confirms is valid.

**Result: PASS on 2 of 10 values sampled (assignee, priority); remaining 8 not yet executed.**
"Show me the board grouped by assignee" → correctly showed `Unassigned: 2 issues` (both fixture cards are
genuinely unassigned) with the other group headers at 0. "Now show it grouped by priority instead" →
correctly showed `Low: 2 issues` (both fixture cards are genuinely Low priority by default). Both DB-
accurate, no defaulting or rejection. `tracker`, `project`, `category`, `fixed_version`, `done_ratio`,
`is_private`, `parent`, `author` not yet sampled.

---

### TC-CRX-391: Board — drill into a single group's cards via `get_board_group_cards`

**User Role:** Same as TC-CRX-368. **Precondition:** TC-CRX-390's grouped-by-assignee view run first, to
have a real group id to drill into.

**Steps:** "Scrum Agent, just show me the cards in the '[group name]' group." (e.g. "Unassigned" if
grouped by assignee).

**Expected Result:** `get_board_group_cards` called with the correct `group_by` + `group_id`, returning
only that group's real cards — not the whole board re-listed.

**Result: Not yet executed.**

---

### TC-CRX-392: Board Settings — update via chat (WIP limit on a column), verify it's genuinely per-viewer

**User Role:** Same as TC-CRX-368. **Precondition:** native UI ground truth for the "QA" column's current
WIP limit (none set, per the Board Settings panel explored 2026-10-29 — all 5 columns show an empty WIP
spinbutton).

**Steps:** "Scrum Agent, can you set a WIP limit of 2 on the QA column for [project]'s board?"

**Expected Result:** Discovers the `agile` group (if not already), proposes `update_board_settings`
(or the equivalent column-level update) with the exact column and WIP value — genuine confirm card, no
guessed/defaulted other columns' settings changed. Verify via DB/native UI the OTHER 4 columns' settings
are untouched (same "don't silently touch unmentioned fields" check as BUG-CRX-098/BUG-CRX-082 elsewhere
in this repo).

**Result: PASS.** "Can you set a WIP limit of 2 on the QA column?" → confirm card correctly showed
`Project: Crux Scrum Agent Test Project` (correct — no BUG-CRX-101 recurrence this time), `Column: 3`
(the real id for "QA" on this board), `Wip Limit: 2`. Confirmed: genuine success (*"✓ Column #3 updated:
'QA.'"*), DB-verified `rf_board_columns` — QA's `wip_limit` is now `2`, all 4 other columns' `wip_limit`
remain `NULL` (untouched) — no BUG-CRX-098-style unmentioned-field defaulting.

---

### TC-CRX-393: Board Settings — toggle Board Type (Kanban → Scrum board)

**User Role:** Same as TC-CRX-368. **Precondition:** native ground truth — board type currently "Kanban
board" (confirmed via the Board Settings panel's own combobox, selected option).

**Steps:** "Scrum Agent, can you switch [project]'s board to a Scrum board?"

**Expected Result:** A genuine `update_board_settings` (or equivalent) proposal naming the exact field
change (`board_type` or similar) — confirm whether this is even a chat-reachable field at all (the
persona's own `update_board_settings` doc line only explicitly calls out "how a board itself is
configured, not its cards" without naming every field) — if genuinely unsupported, expect an honest
capability disclosure (matching the Run Type precedent, TC-CRX-364/BUG-CRX-099 in the sibling QA Agent
suite) rather than either a silent no-op or a fabricated wrong explanation.

**Result: Not yet executed.**

---

### TC-CRX-394: Board Config — create a named/saved board with a specific `group_by` and `filters`

**User Role:** Same as TC-CRX-368.

**Steps:** "Scrum Agent, can you create a saved board view called 'My Open Bugs' for [project], grouped by
priority, filtered to only show open Bug-tracker issues?"

**Expected Result:** `create_board_config` confirm card with `group_by: priority` and a `filters` dict that
genuinely encodes "tracker=Bug, status=open" (or the tool's real equivalent keys) — not an empty/guessed
filters dict, and not conflating this with the live Board Settings panel from TC-CRX-392/393 (a
genuinely different, named/saved concept per the source).

**Result: PASS on the write mechanics; CORRECTION — the config this created is actually unusable, see
BUG-CRX-103 under TC-CRX-395.** "Can you create a saved board view called 'My Open Bugs' ... grouped by
priority, filtered to only show open Bug-tracker issues?" → confirm card correctly showed `Project: Crux
Scrum Agent Test Project`, `Name: My Open Bugs`, `Group By: priority`, `Filters: {'status': 'open',
'tracker': 'Bug'}` — genuinely encoded, not empty/guessed. Confirmed; DB-verified `rf_board_configs` row:
`project_id=4`, `name='My Open Bugs'`, `group_by='priority'`, `filters={"status":"open","tracker":"Bug"}`
— exact match. **This TC only verified the write persisted — it never opened the resulting config, which
is the step that reveals BUG-CRX-103 (the `filters` shape this tool writes crashes the native board page
with a 500 the moment anyone actually opens this saved config).**

---

### TC-CRX-395: Board Config — list/read it back, then update and delete it, only when named exactly

**User Role:** Same as TC-CRX-368. **Precondition:** TC-CRX-394's board config exists.

**Steps:**
1. "What saved board configs exist for [project]?" (`list_board_configs`)
2. "Show me the 'My Open Bugs' config in detail." (`get_board_config`)
3. "Update 'My Open Bugs' to group by assignee instead." (`update_board_config`)
4. Negative: "Clean up unused board configs." (vague — expect no delete proposal, same naming-discipline
   rule as sprint/column delete elsewhere in this suite)
5. Positive: "Delete the 'My Open Bugs' board config." (`delete_board_config`)

**Expected Result:** Read-back matches what was created in TC-CRX-394 exactly; the update changes ONLY
`group_by`, leaving the saved `filters` untouched (same unmentioned-field-preservation check as
TC-CRX-392); step 4 produces no delete proposal; step 5, named exactly, genuinely deletes it — verified via
DB/`list_board_configs` afterward.

**Result: Mixed — update (step 3) PASS on write mechanics but surfaced a severe usability-breaking bug;
step 4 (vague negative) FAIL — new bug BUG-CRX-104; step 5 (positive delete) PASS.** Step 1 (list) not
separately exercised — step 5's delete flow itself found the config by name without a prior explicit list
call. Step 3: "update 'My Open Bugs' to group by assignee instead" → confirm card correctly showed
`Config: 1`, `Group By: assignee` only — confirmed (*"✓ Board config #1 updated"*), DB-verified `group_by`
changed to `assignee` with `filters` genuinely untouched (no BUG-CRX-098-style defaulting). **However,
opening that saved config via the native UI (`/projects/.../agile_board?board_config_id=1`, the real way
a user would ever use a saved board) crashes with a genuine HTTP 500** — root-caused via source: the
`filters` dict the Scrum Agent's `create_board_config`/`update_board_config` tools write is a flat
`{field: value}` shape, but `rf_boards_controller.rb`'s own filter-redirect logic (and the native config
form) require a nested `{field: {operator, values}}` shape — `filter_data[:operator]` on a flat string
throws `TypeError: no implicit conversion of Symbol into Integer`. Filed as **BUG-CRX-103** (High — the
entire Board Config feature is a dead end via chat; every config ever created/updated this way can never
actually be opened). Step 4: "clean up unused board configs" → agent falsely claimed *"I'm unable to load
the board configuration tools ... tool group lookup isn't resolving properly on this deployment"* —
directly contradicted by this exact chat's own immediately preceding successful create/update calls
through the identical tool group. Filed as **BUG-CRX-104** (false-capability-denial family, first
instance on Scrum Agent). Step 5, retried with a specific name immediately after: correctly found the
config, asked a plain-language confirmation, then produced a genuine `Agile Delete Board Config` confirm
card (`Config: 1`) — confirmed, DB-verified `rf_board_configs` now has 0 rows. Delete itself works
correctly once past the false denial.

---

## Story Points — admin enablement + chat update attempt (per explicit user request, 2026-10-29)

> User asked to check the Scrum board type and Story Points specifically: enable Story Points at the admin
> level, then try updating a sprint issue's story points via chat to see if it genuinely works.

### TC-CRX-396: Enable Story Points at Administration level, confirm it surfaces on the board, then attempt to set it via chat

**User Role:** Admin (for the Administration step); Scrum Agent (chat) for the update attempt.

**Precondition:** `Administration → Plugins → Redmineflux Agile Board → Configure` had "Enable Story
Points" **unchecked** by default on this stack. Enabled it and Applied — confirmed saved (checkbox stays
checked on reload). Board Settings panel then genuinely gained a "Story Points" option under both "Visible
Card Fields" and "Show Totals" (the latter pre-checked by default) — confirms the setting is real and
instance-wide, not a no-op. DB ground truth: `issues.story_points` is a real native column (not a custom
field), currently `NULL` for fixture card #15.

**Steps:** "In the Crux Scrum Agent Test Project, can you set the story points on card #15 to 5?"

**Expected Result:** Either a genuine `update_issue_field`/equivalent write that sets `story_points=5`
(DB-verifiable), or — if no tool actually supports it — an honest, accurate capability disclosure, not a
false "✓ updated" claim.

**Result: FAIL — new bug BUG-CRX-105 (reclassified from an initial "not a bug" call, per explicit user
pushback — see below).** Confirm card correctly resolved `Issue: #15`, `Project: Crux Scrum Agent Test
Project`, `Field: story_points`, `Value: 5` — looked completely legitimate. Confirming surfaced a genuine,
accurate server-side rejection: *"Error: field 'story_points' is not editable via this endpoint. Allowed
fields: assigned_to_id, category_id, done_ratio, fixed_version_id, is_private, priority_id,
sprint_craft_id, tracker_id or custom_field_N (e.g. custom_field_5)."* DB-verified no change occurred
(`issues.story_points` still `NULL`) — retested a second time after the admin "Story Point Values" field
was populated with a real Fibonacci list (`0, 1, 2, 3, 5, 8, 13, 21`), same exact error both times (that
admin field only drives the native issue-edit dropdown's options, not this tool's hardcoded whitelist).
**Root-caused via source** (`redmineflux_agile_update_issue_field` in `agile.py`): the tool's own hardcoded
`allowed` field set genuinely excludes `story_points` — checked the other two candidate write tools too:
`redmineflux_agile_update_card` only edits subject/description, `redmineflux_agile_update_backlog_issue`
only moves sprint/version. **No tool anywhere in the Scrum Agent's static or discoverable toolkit can set
an issue's story_points value at all**, even though it's a fully real, native, now-enabled column that
genuinely renders on cards and in board totals.

**Initial call corrected:** first recorded as "honest capability gap, not a bug" (reasoning: the agent's
own error message was 100% accurate, unlike BUG-CRX-099's fabricated-reasoning shape on the QA Agent). On
explicit user pushback — *"sprint ya story point ko update karna to possible hona chahiye na Crux ke
through, kyunki ye agile ka feature hai"* — reconsidered: Story Points is a core, defining Scrum ceremony
(sprint estimation), not a peripheral one-time-setup field like Run Type. A direct contrast test (same
chat, same tool family) confirmed the distinction holds: "assign card #16 to Scrum Sprint Fixture 1"
(`redmineflux_agile_update_backlog_issue`'s `sprint_id` param, TC-CRX-381) worked correctly end-to-end,
proving the agent's write mechanics are sound in general — Story Points specifically has no path at all.
Filed as **BUG-CRX-105**.

---

## Auto-mode routing check (per explicit user request, 2026-10-29)

> User asked whether Auto-mode routing (as already checked for the QA Agent/Testcase-Management domain —
> BUG-CRX-094 — and the CRM/Sales Agent domain — BUG-CRX-096, both misrouted to Project Manager on
> ambiguous phrasing) had been checked for the Scrum Agent/Agile domain. It had not, until now.

### TC-CRX-397: Auto mode routes ambiguously-phrased Agile/Scrum requests to the correct agent, not Project Manager

**User Role:** admin, Crux set to **Auto**.

**Steps:**
1. Fresh chat: "What's in the current sprint for the Crux Scrum Agent Test Project?" ("sprint" is a strong
   domain signal, included to check the easy case first).
2. Fresh chat: "In the Crux Scrum Agent Test Project, can you move item #15 to the Done column?" —
   deliberately avoided the words "card," "board," and "Agile"/"Scrum," using the more generic "item" and
   "column" instead, to probe the same ambiguous-phrasing misroute shape that broke QA Agent (BUG-CRX-094,
   "What's on my To Do list?") and CRM/Sales Agent (BUG-CRX-096, a deal-stage-move with no "CRM" word).

**Expected Result:** Both route to the Scrum Agent, not Project Manager — matching the correct-routing
baseline already established for lexically domain-named messages on the other two agents, and specifically
testing whether the SAME ambiguous-phrasing misroute defect class also exists here.

**Result: PASS, both attempts — no misrouting found.** Step 1 routed to Scrum Agent (confirmed via the
"Answering: Scrum Agent" indicator), which correctly asked for the numeric project id/identifier rather
than guessing (consistent with TC-CRX-373). Step 2 — the more deliberately ambiguous phrasing — also
routed to Scrum Agent, which again correctly asked for the project id rather than guessing, and correctly
cited issue #15 by its real link. **Unlike BUG-CRX-094/096, no misrouting to Project Manager occurred on
either attempt.** Not an exhaustive sweep (only 2 phrasings tested, both still contained an Agile-adjacent
word — "sprint" or "column" — rather than being maximally generic like "What's on my To Do list?" had no
QA-specific word at all), so this is a reasonably strong but not conclusive negative result; worth a
follow-up with an even more generic phrasing (e.g. "what am I working on right now in that project?") if a
misroute is still suspected.

---

## Evidence Map

- Case IDs: TC-CRX-368 through TC-CRX-389 (22 cases) — all drafted from `agents/agile-scrum.md`'s real
  tool catalog and behavioral rules, 2026-10-29.
- **Executed this pass (17 of 30):** TC-CRX-368 (PASS), 371 (PASS backlog / FAIL epics → BUG-CRX-100), 372
  (PASS), 373 (PASS), 374 (PASS plain reuse / FAIL discovery-gated reuse → BUG-CRX-101), 375 (PASS), 381
  (PASS — sprint assignment), 383 (PASS negative half), 384 (discovery PASS, but → BUG-CRX-101), 387 (FAIL
  → BUG-CRX-102), 388 (PASS — all 3 Agile permissions, clean honest denials), 390 (PASS, 2 of 10 group-by
  values sampled), 392 (PASS, WIP limit), 394 (PASS write / unusable config → BUG-CRX-103), 395 (update
  PASS / delete-negative FAIL → BUG-CRX-104 / delete-positive PASS), 396 (FAIL → BUG-CRX-105, reclassified
  from an initial "not a bug" call), 397 (PASS, Auto-mode routing — no misroute found).
- **Not yet executed (13 of 30):** TC-CRX-369, 370, 376, 377, 378, 379, 380, 382, 383 (positive half),
  385, 386, 389, 390 (8 remaining group-by values), 391, 393.
- **6 new bugs found, all filed:** BUG-CRX-100 (fake "epics," plugin API-level defect, not an AI
  hallucination), BUG-CRX-101 (discovery-gated `create_column` resolved the wrong project from an
  unrelated chat — caught by a lucky permission denial before any write), BUG-CRX-102 (`create_issue`
  resolved "Low" priority to id 4/"Blocker" instead of the real id 1 — caught and cancelled manually
  before confirming), BUG-CRX-103 (High — Board Config `filters` written in a shape that crashes the
  native board page with a 500 the moment the config is ever opened), BUG-CRX-104 (false capability
  denial on a vague board-config-delete request, contradicted by the same chat's own prior successful
  calls), BUG-CRX-105 (High — no tool lets the Scrum Agent set Story Points, a core Scrum ceremony;
  sprint assignment via the same tool family works correctly, TC-CRX-381, proving this is a
  field-specific gap not a broader write defect). Also regression-checked and confirmed still fixed:
  BUG-CRX-020 (fabricated-confirm, 2 distinct write actions both rendered genuine clickable buttons) and
  BUG-CRX-031 (wrong-status resolution — card move resolved the exact correct column both times).
- **Board Settings / Group-By / Board Config round (per explicit user request, native UI explored first):**
  confirmed via source that Board Settings (live per-viewer column visibility/WIP/card-fields/totals) and
  Board Config (named/saved board with its own `group_by`+`filters`) are two genuinely distinct features,
  both with real MCP tool coverage (`agile.py`), neither tested before this round. Sampled: group-by
  (assignee, priority — both PASS, DB-accurate), WIP-limit update (PASS, only the named column changed,
  others untouched), board-config create (PASS on write mechanics — DB-verified).
- **Board Config update/delete follow-up (per explicit user request — "update karke dekha, actual mein
  update ho raha nahi, or delete kr ke"):** the update itself genuinely DOES persist to the DB correctly
  (`group_by` changed, `filters` preserved) — but opening that saved config natively crashes with a real
  HTTP 500, because the Scrum Agent's tools write `filters` in a flat shape incompatible with what the
  plugin's own render path requires (**BUG-CRX-103**, High) — so the update "not seeming to work" is
  explained: the write succeeds, but the feature it's meant to power is unusable. Also found a false
  capability denial on a vague delete request, immediately contradicted by the same chat's own prior
  successful calls (**BUG-CRX-104**). The actual named delete, once past that false denial, genuinely
  works and is DB-verified. **2 new bugs this sub-round.**
- Next session: execute the remaining 15 TCs (global/my-page board variants, card field updates, sprint
  create/assign/update, column reorder/delete, non-admin permission matrix, remaining 8 group-by values,
  board-type toggle), then re-derive the real Agile permission model (TC-CRX-388's note) before relying on
  the old suite's assumption about a dedicated `View Agile Board` permission (confirmed still accurate
  this round via DB, but worth a live non-admin check too). Also worth flagging to the dev: **every board
  config created via the native UI should be spot-checked too** — BUG-CRX-103's crash may also be
  reachable from the native "New Board Config" form in edge cases (e.g. an "any"/"none" operator with no
  values), even though the mainline native path was confirmed to produce the correct nested shape.
