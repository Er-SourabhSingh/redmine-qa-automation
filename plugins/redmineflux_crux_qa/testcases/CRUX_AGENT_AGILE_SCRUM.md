# Test Cases — Redmineflux Crux — Scrum Agent (Agile) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/agile-scrum.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added.

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

---

### TC-CRX-112: Create an issue directly from Agile context

**User Role:** Same as TC-CRX-108.
**Precondition:** None.

**Steps:**
1. "Create an issue titled [X] in project [Y] from the backlog."
2. Confirm; verify the issue exists with the exact fields described.

**Expected Result:**
- Every field filled precisely from what the tester described — no invented subject/description.

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

---

## Evidence Map

- Case IDs: TC-CRX-108 through TC-CRX-113
- Screenshots: bugs only.
- Log: —
- Bug reference: —
