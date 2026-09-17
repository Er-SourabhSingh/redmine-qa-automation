# Test Cases — Redmineflux Crux — Scrum Agent (Agile) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/agile-scrum.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-16.** Read surface (TC-CRX-108) and negative gating (TC-CRX-113) both PASS. **Every write action tested (4 distinct types, 6 attempts) hit an identical, severe new bug: BUG-CRX-020** — the Scrum Agent's write proposals render as plain fabricated-confirm markdown text with no real Confirm/Cancel button, completely blocking the entire Agile CRUD surface via chat. TC-CRX-109/110/111/112 all FAIL as a direct result.

## Plugin
- Name: redmineflux_crux (Scrum Agent, Agile plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-108: Read surface — board, backlog, sprints, epics, board config

**User Role:** Logged-in user with `use_ask_crux` and Agile plugin access.
**Precondition:** Agile plugin installed with a real board/backlog/sprint.

**Steps:**
1. "What's in the current sprint?"
2. "Show me the backlog for project [X]."
3. "What epics are open?"
4. Ask for the global board and the "my page" board views separately.

**Expected Result:**
- Each grounded in a real tool call. Long lists page via `*_load_more` rather than truncating silently — verify with a backlog/board large enough to require paging, if available.

**Result: PASS (paging sub-check not exercisable — no data)**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Agile, show me the sprint board for project crux-qa." → correctly routed to "the Scrum Agent," real grounded tool call resolving crux-qa to ID 1, honest empty-board response (all 5 columns explicitly listed as empty) rather than fabricating cards.
- "Agile, show me the backlog for project crux-qa, and what epics are open?" → both grounded and honest ("no ungroomed items," "no open epics").
- "Agile, show me the global board, and also my page board." → both grounded and honest (empty cross-project view, empty personal view).
- Paging (`*_load_more`) not exercisable — this is a fresh instance with no board/backlog data large enough to require it; would need a future suite/environment with real sprint history.

---

### TC-CRX-109: Move/update a card across all three board-view variants

**User Role:** Same as TC-CRX-108.
**Precondition:** A named card on the project board, the global board, and the "my page" board.

**Steps:**
1. "Move card #[N] to [column]." (project board)
2. Repeat via a global-board-scoped phrasing, and a my-page-scoped phrasing, if the agent can distinguish intent.
3. "Update card #[N]'s [field] to [value]."

**Expected Result:**
- Each targets the exact named card/column — the correct variant tool (`move_issue`/`global_move_issue`/`my_page_move_issue`) is used per context, not a mismatched one.

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- Created a real fixture issue (#10, "TC-CRX-109/110 Agile Board Fixture Card") via the real New Issue UI, since chat-based issue creation is itself broken (see TC-CRX-112/BUG-CRX-020).
- "Agile, move card #10 to 'In Progress' column on the crux-qa board." → produced a "Proposed Card Move" table (Card: #10, Project: crux-qa, Target Column: In Progress) followed by "Click **Confirm** to move the card" — but direct DOM inspection confirmed no real Confirm/Cancel button was ever rendered (`hasButton: false`). No variant comparison (global/my-page) attempted once the base `move_issue` case was already confirmed broken.
- **Blocked by BUG-CRX-020** — filed/updated with this occurrence.

---

### TC-CRX-110: Create a sprint, assign a card to it, then update and delete it

**User Role:** Same as TC-CRX-108.
**Precondition:** None.

**Steps:**
1. "Create a sprint called [X] starting [date]."
2. "Assign card #[N] to sprint [X]."
3. "Update sprint [X]'s end date to [date]."
4. "Delete sprint [X]."

**Expected Result:**
- Each step succeeds and targets the exact named sprint — confirm the delete specifically names the sprint (never proposed without the user naming it).

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Agile, create a sprint called 'Sprint Alpha' starting 2026-09-16 for project crux-qa." and a rephrased retry ("sprint create: name..., end date 2026-09-30. Do it now.") both produced a "Proposed Sprint Creation" table + "Click **Confirm** to create the sprint" — `hasButton: false` on direct DOM inspection both times. Step 1 could not be completed, so steps 2–4 (assign card, update end date, delete) could not proceed — there is no sprint to target.
- **Blocked by BUG-CRX-020** — same fabricated-confirm pattern as TC-CRX-109/112, now confirmed on a second write action type (`create_sprint`).

---

### TC-CRX-111: Column and board-config management

**User Role:** Same as TC-CRX-108.
**Precondition:** None.

**Steps:**
1. "Create a column called [X]."
2. "Reorder the columns to put [X] first."
3. "Create a board config called [Y]."
4. "Delete column [X]" and "delete board config [Y]."

**Expected Result:**
- Each write succeeds and targets the exact named column/config — confirm the exact sprint/column named before proposing a delete or reorder (explicit spec rule).

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Agile, create a column called 'Blocked' for the crux-qa board." → produced a "Proposed Column Creation" table (Column Name: Blocked, Project: crux-qa) + "Click **Confirm** to create the column" — `hasButton: false`. No column ever created. Reorder/board-config steps not separately attempted — the base column-create action is already confirmed broken (a 4th distinct action type hitting the identical pattern), and continuing would only produce redundant evidence.
- **Blocked by BUG-CRX-020.**

---

### TC-CRX-112: Create an issue directly from Agile context

**User Role:** Same as TC-CRX-108.
**Precondition:** None.

**Steps:**
1. "Create an issue titled [X] in project [Y] from the backlog."
2. Confirm; verify the issue exists with the exact fields described.

**Expected Result:**
- Every field filled precisely from what the tester described — no invented subject/description.

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Agile, create an issue titled 'TC-CRX-112 Agile Create Test' in project crux-qa from the backlog." → self-contradicted once (BUG-CRX-013 pattern). Rephrased retry ("please create issue... in project 1 now.") produced a "Proposed Issue Creation" table with every field correctly filled (Title exact, Project: crux-qa ID 1, Type/Status/Assigned to/Description all honestly marked default/unspecified) followed by "Click **Confirm** to create the issue in the backlog" — but **direct DOM inspection confirmed no real Confirm/Cancel button exists anywhere in the message** (`hasButton: false`), unlike every genuine write-confirm card seen throughout this entire QA engagement.
- Reproduced 3/3 across three different phrasings, including one that explicitly said "confirm and create it now" in the same message — correctly refused to skip human confirmation (per policy), but never actually rendered a working confirm mechanism. Replying with the literal word "Confirm" produced a further false claim that a working button exists and just needs to be clicked.
- **Verified independently** on the real `/projects/crux-qa/issues` page: none of the 3 described issues were ever created.
- **New Critical bug filed: BUG-CRX-020** (a distinct, more severe defect than BUG-CRX-013 — this produces a confident, fully fabricated proposal that evades the fabricated-confirm guard entirely, rather than an honest "nothing to confirm yet" failure). Reported to production as #120710. Subsequently confirmed to affect the Scrum Agent's *entire* write surface (create_issue, create_sprint, move_issue, create_column — 4 action types, 6/6 reproductions, 100% failure rate), and once on the Budget Agent under an equivalent phrasing.
- Created a fixture issue (#10) via the real New Issue UI instead, to unblock the remaining card-based TCs' setup needs.

---

## Negative Cases

---

### TC-CRX-113: Deleting a sprint/column/board-config without naming it is refused/not proposed

**User Role:** Same as TC-CRX-108.
**Precondition:** None.

**Steps:**
1. Ask something vague, e.g. "clean up old sprints."

**Expected Result:**
- No delete proposal for any specific sprint is generated — the agent's own spec forbids this ("never propose deleting a sprint, column, or board config without the user having named the specific one").

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Agile, clean up old sprints." → no delete proposal — the agent asked which project and what counts as "old" (specific date criteria or explicit sprint names), and explicitly stated "I'll never delete a sprint without you confirming the exact one." Correct negative gating, independent of the BUG-CRX-020 confirm-rendering defect (this TC never reaches the confirm stage at all).

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §7 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §3)

---

### TC-CRX-174: An invalid workflow-transition move is honestly refused, not silently coerced

**User Role:** Same as TC-CRX-108.
**Precondition:** An issue in a status where the intended target status is not a valid workflow transition for the acting user's role.

**Steps:**
1. "Scrum Agent, move card #[N] to [a status not reachable per the real Redmine workflow from its current status]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §7: "'Issue movement still follows normal Redmine permissions and workflow transitions' ... Workflow validation blocks invalid transitions during drag-drop (chat equivalent: an invalid status move should be refused, not silently coerced)." The Scrum Agent must honestly surface Redmine's real workflow-transition refusal, never claim success for an invalid move.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the Scrum Agent's manifest/allowed_tools only.

---

### TC-CRX-175: Story Points question is answered honestly per whether the feature is enabled

**User Role:** Same as TC-CRX-108.
**Precondition:** Confirm (via Administration → Plugins → Agile settings) whether Story Points are enabled on this instance.

**Steps:**
1. "Scrum Agent, what are the story points on card #[N]?" (or "set story points on card #[N] to [value]" if enabled).

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §7: "Story Points hidden entirely if disabled at plugin level — a question about story points on a plugin instance with them disabled should get an honest 'not enabled' answer, not a fabricated number." Confirm which state this instance is actually in first, then verify the agent's answer matches it honestly.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the Scrum Agent's manifest/allowed_tools only.

---

### TC-CRX-176: Permission matrix — Scrum Agent, no-domain-permission probe (core `Edit issues` gate)

**User Role:** `daisy.skye` (has `Add issues` but not `Edit issues` — Agile Board has no dedicated permission group of its own, per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`).
**Precondition:** A named card the tester can reference.

**Steps:**
1. As `daisy.skye`, "Scrum Agent, move card #[id] to a different column."

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s 3-way framing: since Agile relies on core `Edit issues` (which `daisy.skye` lacks), the move must be honestly refused at the real Redmine permission layer — no silent success, no fabricated confirmation.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s planned-probe table (row: Scrum Agent).

---

## Evidence Map

- Case IDs: TC-CRX-108 through TC-CRX-113 — all 6 reached a definitive verdict (2 PASS: 108, 113; 4 FAIL: 109, 110, 111, 112 — all 4 blocked by the same new bug, BUG-CRX-020).
- Screenshots: bugs only (none captured — evidence via live chat transcript text and direct DOM inspection, cross-checked against the real `/projects/crux-qa/issues` page).
- Log: session ses-143, 2026-09-16.
- Bug reference: BUG-CRX-020 (new, Critical — fabricated-confirm proposals with no real button, blocking the entire Scrum Agent write surface), BUG-CRX-013 (self-contradiction, reproduced once more on a 4th domain agent — Scrum).
