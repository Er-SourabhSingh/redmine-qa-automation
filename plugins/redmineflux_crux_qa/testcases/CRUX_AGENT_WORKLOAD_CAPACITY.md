# Test Cases — Redmineflux Crux — Capacity Agent (Workload) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/workload-capacity.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added.

## Plugin
- Name: redmineflux_crux (Capacity Agent, Workload plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-093: Read surface — dashboard, capacity, teams, gantt, conflicts, leave

**User Role:** Logged-in user with `use_ask_crux` and Workload plugin access.
**Precondition:** Workload plugin installed with real teams/allocations.

**Steps:**
1. "How's the team doing?" (dashboard/capacity).
2. "Show the Gantt for team [X]."
3. "Any scheduling conflicts this month?"
4. "Who's out on leave this week?"

**Expected Result:**
- Each grounded in a real tool call, citing real team/member/date data.

---

### TC-CRX-094: Allocation writes — add/remove issue, resize, update dates/hours

**User Role:** Same as TC-CRX-093.
**Precondition:** A named issue and a named workload.

**Steps:**
1. "Add issue #[N] to [user]'s workload."
2. "Resize [user]'s allocation on issue #[N] to [X] hours."
3. "Update the dates on that allocation to [start]–[end]."
4. Confirm each; verify.

**Expected Result:**
- Exact dates/hours as specified — no rounding or estimation (explicit "must never" rule). Each change persists and is visible on the Gantt/workload view.

---

### TC-CRX-095: Leave lifecycle — create, approve, reject, cancel

**User Role:** Same as TC-CRX-093.
**Precondition:** A named user for the leave request.

**Steps:**
1. "Create a leave request for [user] from [date] to [date]."
2. Confirm.
3. "Approve [user]'s leave request for [dates]."
4. Separately, create another and "reject" it, then create a third and "cancel" it.

**Expected Result:**
- Each named leave action targets the correct, specific request — never an ambiguous/unnamed one. All four lifecycle actions work and reflect correctly in `leaves_list`/`team_on_leave`.

---

### TC-CRX-096: Team/member/skill management, including bulk removal

**User Role:** Same as TC-CRX-093.
**Precondition:** None.

**Steps:**
1. "Create a team called [X]."
2. "Add [user] to team [X] as a member."
3. "Create a skill called [Y] and assign it to [user]."
4. "Remove [user] and [user2] from team [X]" (bulk removal).

**Expected Result:**
- Each write succeeds and targets exactly the named team/member/skill. Bulk removal removes exactly the named members, no more/fewer.

---

### TC-CRX-097: Holidays and holiday schemes — full lifecycle

**User Role:** Same as TC-CRX-093.
**Precondition:** None.

**Steps:**
1. "Create a holiday scheme called [X]."
2. "Add [date] as a holiday to scheme [X]."
3. "Activate scheme [X]."
4. "Clone scheme [X] as [X-copy]."

**Expected Result:**
- Each action succeeds with exact dates/names — "never approximate" is an explicit spec rule here.

---

### TC-CRX-098: `refresh_gantt`/`recalculate` are explicit-ask-only, not read-side-effects

**User Role:** Same as TC-CRX-093.
**Precondition:** None.

**Steps:**
1. Ask a plain read question about the Gantt (e.g. "show me the Gantt for team X").
2. Separately, explicitly ask "refresh/recalculate the numbers for team X."

**Expected Result:**
- Step 1 does NOT trigger a `refresh_gantt`/`recalculate` write as a side effect of the read — per the agent's own spec ("use them when the user explicitly asks... not as a side effect of a read"). Step 2 does trigger it, confirmed.

---

## Negative Cases

---

### TC-CRX-099: `send_email` requires clear, explicit intent before proposing

**User Role:** Same as TC-CRX-093.
**Precondition:** None.

**Steps:**
1. Ask an ambiguous question that mentions notifying someone in passing, without clearly asking for an email to be sent.
2. Separately, explicitly: "send [user] an email about their overload this week."

**Expected Result:**
- Step 1 does not produce a `send_email` proposal — the spec calls this out specifically as needing "confirm intent clearly before proposing, especially `send_email`" since it notifies real people. Step 2 does produce one, confirmed before actually sending.

---

### TC-CRX-100: Delete (team/member/workload/skill/holiday scheme) requires the specific record named

**User Role:** Same as TC-CRX-093.
**Precondition:** A named test team.

**Steps:**
1. Ask something broad, e.g. "clean up unused teams."
2. Explicitly: "delete team [X]."

**Expected Result:**
- Step 1 produces no delete proposal. Step 2 produces a correctly-targeted one, confirmed only on explicit click.

---

## Evidence Map

- Case IDs: TC-CRX-093 through TC-CRX-100
- Screenshots: bugs only.
- Log: —
- Bug reference: —
