# Test Cases — Redmineflux Crux — Time Agent (Timesheet) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/timesheet.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added.

## Plugin
- Name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-121: Read surface — list, report, approval dashboard, audit log

**User Role:** Logged-in user with `use_ask_crux` and Timesheet plugin access.
**Precondition:** Timesheet plugin installed with real submitted timesheets.

**Steps:**
1. "Whose timesheets are pending approval?"
2. "Show me hours logged on project [X] this week."
3. "Who changed [user]'s timesheet and when?" (audit log).
4. "Export the audit log."

**Expected Result:**
- Each grounded in a real tool call. Per the agent's own spec, `audit_log_export` "confirms a matching row count and returns a CSV download link — it cannot hand back file content directly" — verify the agent doesn't claim to paste file contents inline.

---

### TC-CRX-122: Submit, approve, reject, withdraw — each naming the exact timesheet/user/period

**User Role:** Same as TC-CRX-121.
**Precondition:** A named user/period.

**Steps:**
1. "Submit [user]'s timesheet for [period]."
2. "Approve [user]'s timesheet for [period]."
3. Separately, create another and "reject" it with a reason.
4. Separately, "withdraw [user]'s timesheet for [period]" — and "withdraw all of [team]'s timesheets" (withdraw_teams).

**Expected Result:**
- Each action targets the exact named timesheet/user/period/team — verify state changes correctly (submitted → approved/rejected/withdrawn) and persists.

---

### TC-CRX-123: Deadline lock/unlock for a specific period

**User Role:** Same as TC-CRX-121.
**Precondition:** None.

**Steps:**
1. "Lock the deadline for [period]."
2. Attempt to edit a timesheet in that period via the normal Redmine UI (not chat) to confirm the lock is real.
3. "Unlock the deadline for [period]."

**Expected Result:**
- Locking genuinely prevents edits outside chat too (a real, enforced lock, not chat-only cosmetic). Unlock restores editability.

---

### TC-CRX-124: Schema and team management — full lifecycle including assign/unassign

**User Role:** Same as TC-CRX-121.
**Precondition:** None.

**Steps:**
1. "Create a timesheet schema called [X]."
2. "Assign schema [X] to team [Y]" and "assign it to project [Z]" (project_schema_assign).
3. "Activate schema [X]", then later "deactivate" it.
4. "Create a team called [T], add [user] as a member, then remove them."

**Expected Result:**
- Each write succeeds, targeting exactly the named schema/team/project/member.

---

## Negative Cases

---

### TC-CRX-125: `delete` (timesheet) requires the user to name the specific one

**User Role:** Same as TC-CRX-121.
**Precondition:** None.

**Steps:**
1. Ask vaguely, e.g. "clean up old timesheets."

**Expected Result:**
- No delete proposal for any specific timesheet is generated without explicit naming.

---

### TC-CRX-126: `settings_update` (plugin-wide) requires clear confirmation of intent

**User Role:** Same as TC-CRX-121.
**Precondition:** None.

**Steps:**
1. Ask something tangential that could imply a settings change without clearly requesting one.
2. Separately, explicitly request a specific settings change.

**Expected Result:**
- Step 1 produces no settings-change proposal. Step 2 does, confirmed before applying — per the agent's own "confirm this is really what the user wants" rule, since it's plugin-wide (affects everyone, not just one timesheet).

---

## Evidence Map

- Case IDs: TC-CRX-121 through TC-CRX-126
- Screenshots: bugs only.
- Log: —
- Bug reference: —
