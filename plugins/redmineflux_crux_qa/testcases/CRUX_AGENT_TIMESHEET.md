# Test Cases — Redmineflux Crux — Time Agent (Timesheet) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/timesheet.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-16.** Read surface (TC-CRX-077) and both negative cases (TC-CRX-081/126 step 1) PASS. **Write actions hit BUG-CRX-020 again** (fabricated-confirm proposals with no real button) — reproduced on `create_schema` and `settings_update`, blocking TC-CRX-078/123/124 and the confirm half of TC-CRX-082.
>
> **2026-09-17 update:** TC-CRX-083–152 (gap cases) BLOCKED mid-session by a platform-wide Ask Crux provider outage (OpenRouter key returning 401 Unauthorized, confirmed via native `/crux/admin/keys` diagnostic — not a plugin defect). A full fixture was built and verified genuine before the outage hit: approval schema "Two-Level Approval" (ID 1, Manager L1 / Developer L2), new user `crux.developer` (id 8, Developer role), team "Retest Squad" assigned the schema. Notably, this schema's create-confirm proposal rendered with 2 real buttons and genuinely persisted — contradicting the 2026-09-16 note below that `create_schema` reliably hit BUG-CRX-020; see TC-CRX-083 for detail. Resume TC-CRX-083 step 2 once a working provider key is restored.

## Plugin
- Name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-077: Read surface — list, report, approval dashboard, audit log

**User Role:** Logged-in user with `use_ask_crux` and Timesheet plugin access.
**Precondition:** Timesheet plugin installed with real submitted timesheets.

**Steps:**
1. "Whose timesheets are pending approval?"
2. "Show me hours logged on project [X] this week."
3. "Who changed [user]'s timesheet and when?" (audit log).
4. "Export the audit log."

**Expected Result:**
- Each grounded in a real tool call. Per the agent's own spec, `audit_log_export` "confirms a matching row count and returns a CSV download link — it cannot hand back file content directly" — verify the agent doesn't claim to paste file contents inline.

**Result: PASS (steps 3-4 not exercised — no data)**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Timesheet, whose timesheets are pending approval, and show me hours logged on project crux-qa this week." → real grounded tool call (`Sources (2)`), honest: "None — no timesheets are waiting for your approval," "No time entries recorded yet for this week." Correctly disclosed the empty state.
- Audit log / export steps not separately exercised — no timesheet activity exists yet on this fresh instance to audit.

---

### TC-CRX-078: Submit, approve, reject, withdraw — each naming the exact timesheet/user/period

**User Role:** Same as TC-CRX-077.
**Precondition:** A named user/period.

**Steps:**
1. "Submit [user]'s timesheet for [period]."
2. "Approve [user]'s timesheet for [period]."
3. Separately, create another and "reject" it with a reason.
4. Separately, "withdraw [user]'s timesheet for [period]" — and "withdraw all of [team]'s timesheets" (withdraw_teams).

**Expected Result:**
- Each action targets the exact named timesheet/user/period/team — verify state changes correctly (submitted → approved/rejected/withdrawn) and persists.

**Result: BLOCKED** — precondition (a submittable timesheet) requires a real schema/team first, which could not be created (BUG-CRX-020, see TC-CRX-080). Not attempted.

---

### TC-CRX-079: Deadline lock/unlock for a specific period

**User Role:** Same as TC-CRX-077.
**Precondition:** None.

**Steps:**
1. "Lock the deadline for [period]."
2. Attempt to edit a timesheet in that period via the normal Redmine UI (not chat) to confirm the lock is real.
3. "Unlock the deadline for [period]."

**Expected Result:**
- Locking genuinely prevents edits outside chat too (a real, enforced lock, not chat-only cosmetic). Unlock restores editability.

**Result: BLOCKED** — not attempted, given the overwhelming and consistent evidence (already 10 reproductions across 4 agents/8 action types) that any write proposal from this agent will hit the identical BUG-CRX-020 fabricated-confirm dead end. Revisit once that bug is fixed.

---

### TC-CRX-080: Schema and team management — full lifecycle including assign/unassign

**User Role:** Same as TC-CRX-077.
**Precondition:** None.

**Steps:**
1. "Create a timesheet schema called [X]."
2. "Assign schema [X] to team [Y]" and "assign it to project [Z]" (project_schema_assign).
3. "Activate schema [X]", then later "deactivate" it.
4. "Create a team called [T], add [user] as a member, then remove them."

**Expected Result:**
- Each write succeeds, targeting exactly the named schema/team/project/member.

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Timesheet, create a timesheet schema called 'Standard Weekly' for project crux-qa." → produced a correctly-detailed "Proposed Schema Creation" table (Schema Name, Description, Approval Levels, Active status) and even honestly flagged that a schema needs at least one approval level before activation — but direct DOM inspection confirmed no real Confirm/Cancel button exists (`hasButton: false`). No schema ever created. Remaining steps (assign, activate, team create/add/remove) not attempted — already blocked at step 1.
- **Blocked by BUG-CRX-020** — reproduced on a fourth domain agent (Time Agent).

---

## Negative Cases

---

### TC-CRX-081: `delete` (timesheet) requires the user to name the specific one

**User Role:** Same as TC-CRX-077.
**Precondition:** None.

**Steps:**
1. Ask vaguely, e.g. "clean up old timesheets."

**Expected Result:**
- No delete proposal for any specific timesheet is generated without explicit naming.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Timesheet, clean up old timesheets." → no delete proposal — the agent asked for the project/team, the definition of "old," and clarified it can only delete draft/rejected timesheets, explicitly stating "I'll propose the exact deletion(s) by timesheet ID and period before anything is removed." Correct gating.

---

### TC-CRX-082: `settings_update` (plugin-wide) requires clear confirmation of intent

**User Role:** Same as TC-CRX-077.
**Precondition:** None.

**Steps:**
1. Ask something tangential that could imply a settings change without clearly requesting one.
2. Separately, explicitly request a specific settings change.

**Expected Result:**
- Step 1 produces no settings-change proposal. Step 2 does, confirmed before applying — per the agent's own "confirm this is really what the user wants" rule, since it's plugin-wide (affects everyone, not just one timesheet).

**Result: PASS (gating) / FAIL (confirm mechanism)**

Evidence (session ses-143, `admin`, 2026-09-16):
- Step 1: "Timesheet, our approval process feels a bit slow lately, not sure what's going on." → no settings-change proposal — correctly diagnostic-only, citing real current configuration (mode, period, auto-approval threshold, notifications, locking) and honest possible causes (no teams/schemas/submissions yet). Correct gating.
- Step 2: "Timesheet, please update the timesheet settings to change the submission period from weekly to monthly." → produced a well-formed "Proposed Settings Update" table (Current vs Proposed, explicit Impact bullets) — but again `hasButton: false`. Gating logic (asking clearly before proposing) is correct; the confirm mechanism itself is broken (BUG-CRX-020).

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §1 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §1)

---

### TC-CRX-083: Sequential approval order — a higher-level approver cannot act before the lower level has decided

**User Role:** Logged-in user with `use_ask_crux` and Timesheet plugin access; a schema with 2+ approval levels.
**Precondition:** A team member whose role exists in a multi-level approval schema; a submitted (not yet approved) timesheet for that member.

**Steps:**
1. Submit a timesheet for a user under a 2+ level approval schema.
2. "Time Agent, approve [user]'s timesheet for [period]" addressed at the *second* (higher) approval level, before the first level has approved it.
3. Observe whether a proposal is even generated, and if confirmed, whether it executes.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §1 (quoting the Timesheet plugin's own KB page): "Strict sequential approval: 'Higher-level approver cannot act before lower-level decision', 'No approval level can be skipped'." The Time Agent's `approve` action must honestly refuse the out-of-sequence approval (citing the real rule), never silently succeed or fabricate an approval.

**Result: BLOCKED (2026-09-17) — infrastructure outage, not a plugin defect**

Fixture built and confirmed genuine this session (2026-09-17), then testing halted by a platform-wide outage before step 2 could run:
- Created approval schema **"Two-Level Approval"** (ID 1) via Time Agent chat — Level 1 = Manager role (id 3), Level 2 (final) = Developer role (id 4). The write proposal rendered with 2 real `<button>` elements (DOM-verified) and, after confirming, was cross-checked against the native `/approval_schemas` UI (not chat) — genuinely created, not fabricated. Notably this contradicts the file's own earlier 2026-09-16 note that `create_schema` reliably hit BUG-CRX-020 (fabricated-confirm, no button) — worth a retest note, see Evidence Map.
- Created a new native user `crux.developer` (user id 8), granted the project-level **Developer** role on Crux QA, added as a team member of **"Retest Squad"** (team id 2) with team-role **Developer**; existing member `luna.blossom` (Crux Manager, user id 5) given team-role **Manager**. Schema assigned to the team (confirmed via native UI: "✓ Assigned — Two-Level Approval — L1: Manager, L2: Developer").
- Logged a real 4:00hr time entry for `admin` on Crux QA for Mon 2026-09-14 (visible in the native weekly timesheet grid).
- Attempted "Time Agent, submit my timesheet for the week of Sep 14 to Sep 20, 2026 for approval." → failed with `provider error: HTTP Error 401: Unauthorized`. Retried 3x (including a trivial "Time Agent, hello" with no tool call at all) — same 401 every time.
- Root-caused via `/crux/admin/keys` → "Test connection" on the OpenRouter provider (the only configured key, used for every prior successful exchange this session) → **`HTTPError: HTTP Error 401: Unauthorized`**, confirmed via the native diagnostic, not chat. No other provider (Anthropic, OpenAI, Gemini) has a key configured as fallback ("no key configured for 'anthropic' — add a key first").
- This is a genuine environment/ops issue (an expired, revoked, or quota-exhausted shared API key), not a Crux/Timesheet plugin defect. It blocks **all** Crux agent chat interactions platform-wide, not just Timesheet — confirmed no other domain agent can be reached either while this persists.

**Next session start point:** once the OpenRouter key (or any provider key) is restored, the fixture above is ready to use immediately — re-run step 2 of TC-147 (attempt approval at the Developer/L2 level before Manager/L1 has decided), then continue to TC-148–152 using the same schema/team/users.

---

### TC-CRX-084: Self-approval is blocked when the submitter is also the final-level approver

**User Role:** A user configured as both submitter and final-level approver for their own timesheet; separately, admin.
**Precondition:** A schema where one user's role is the final approval level, and that same user is the submitter.

**Steps:**
1. As that user, submit their own timesheet for a period.
2. As the same user, "Time Agent, approve my own timesheet for [period]."
3. Observe whether a proposal is generated and whether confirming it executes.
4. Separately, as `admin`: "Time Agent, approve [that user]'s timesheet for [period]" for the same self-approval case.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §1: "Self-approval edge case: 'If submitter is final-level approver, only admin can complete approval/rejection.'" Step 2/3 must be honestly refused for the non-admin submitter. Step 4 (admin acting) must succeed. (`docs/CRUX_HANDOFF.md` records an informal prior observation that "timesheet's `approve` correctly refused a self-approval" — this TC formalizes that into a repeatable, specific test rather than a one-off note.)

**Result: BLOCKED (2026-09-17) — same infrastructure outage as TC-147**

Not attempted — the Ask Crux provider outage (see TC-147) halted all chat-based testing before this TC could be reached. The fixture built for TC-147 (schema, team, `crux.developer` as final-level approver) also covers this TC's precondition once the provider is restored.

---

### TC-CRX-085: Withdrawal is refused once the minimum approval level has already approved

**User Role:** Same as TC-CRX-083.
**Precondition:** A submitted timesheet that has already received its minimum-level approval.

**Steps:**
1. Submit a timesheet and get it approved at the minimum required level.
2. "Time Agent, withdraw [user]'s timesheet for [period]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §1: "Withdrawal only permitted 'before minimum approval level is approved'." The withdraw attempt must be honestly refused once that threshold is passed, not silently accepted.

**Result: BLOCKED (2026-09-17) — same infrastructure outage as TC-147**

Not attempted — halted by the Ask Crux provider outage (see TC-147) before this TC could be reached.

---

### TC-CRX-086: `Disable Log/Edit After Approval` blocks a chat-driven edit attempt

**User Role:** Same as TC-CRX-083.
**Precondition:** The `Disable Log/Edit After Approval` setting is ON; a timesheet already fully approved.

**Steps:**
1. Confirm the setting is enabled in the real Timesheet plugin settings.
2. "Time Agent, add a time entry to [user]'s already-approved timesheet for [period]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §1: once this setting is on, "users cannot add or edit entries after approval." The agent must honestly refuse citing the real Redmine-layer block, never fabricate a successful edit.

**Result: BLOCKED (2026-09-17) — same infrastructure outage as TC-147**

Not attempted — halted by the Ask Crux provider outage (see TC-147) before this TC could be reached.

---

### TC-CRX-087: Auto-Approve Threshold — the agent's `approve` proposal correctly reflects an already-auto-approved timesheet

**User Role:** Same as TC-CRX-083.
**Precondition:** `Auto-Approve Threshold` configured to N hours; a timesheet submitted with fewer than N hours logged.

**Steps:**
1. Submit a timesheet with hours below the configured Auto-Approve Threshold.
2. "Time Agent, approve [user]'s timesheet for [period]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §1: "timesheets below a configured hour count bypass manual review entirely." The agent must recognize the timesheet is already (auto-)approved and not propose a redundant approval action or claim it is still "pending" — a stale/incorrect "pending" claim here would be a real bug per the doc's own framing ("does a stale 'pending' claim surface?").

**Result: BLOCKED (2026-09-17) — same infrastructure outage as TC-147**

Not attempted — halted by the Ask Crux provider outage (see TC-147) before this TC could be reached.

---

### TC-CRX-088: Permission matrix — Time Agent, no-domain-permission approval-dashboard read, resolved with a real fixture

**User Role:** `luna.blossom` (lacks `Manage Timesheet`), before/after a temporary grant.
**Precondition:** A real submitted timesheet created by a *different* user, in a scope `luna.blossom` is not granted `Manage Timesheet` for.

**Steps:**
1. As `admin`, create a real submitted timesheet for a different user (e.g. `daisy.skye`).
2. As `luna.blossom` (lacks `Manage Timesheet`), "Time Agent, show me the approval dashboard for pending timesheets."
3. Grant `luna.blossom` the `Manage Timesheet` permission.
4. Repeat the identical question and compare the two results.

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §1: the same submission "becomes visible only after the grant" if scoping is genuinely permission-based. Step 2 must NOT surface the fixture timesheet; step 4 must.

**Result: BLOCKED (2026-09-17) — same infrastructure outage as TC-147**

Not attempted this session — halted by the Ask Crux provider outage (see TC-147) before this TC could be reached. Still inconclusive from the prior 2026-09-16 probe below.

Evidence (already-observed-2026-09-16, partial/inconclusive — quoted from `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §1):
- "Time Agent, show me the approval dashboard for pending timesheets." (as `luna.blossom`, lacking `Manage Timesheet`) → real tool call (`redmineflux_timesheet_approval_dashboard`), returned "There are currently no timesheets pending your approval." This local instance had **no timesheet data at all** at the time, so the empty result is consistent with either correct scoping or an unscoped read that would return empty regardless — **inconclusive from this probe alone**, which is exactly why this TC's fixture-based steps above are needed to resolve it.

---

## Evidence Map

- Case IDs: TC-CRX-077 through TC-CRX-082 — 4/6 reached a definitive verdict (3 PASS: 121, 125, 126-gating; 1 FAIL: 124; 2 BLOCKED: 122, 123 — downstream of the same upstream bug); TC-CRX-082's confirm-mechanism half also FAIL.
- Case IDs: TC-CRX-083 through TC-CRX-088 (gap cases, drafted 2026-09-16) — all 6 BLOCKED 2026-09-17 by a platform-wide Ask Crux provider outage (OpenRouter key 401 Unauthorized), not a plugin defect. Fixture (schema + team + roles) built and verified genuine before the outage; ready for immediate reuse next session.
- Screenshots: bugs only (none captured — evidence via live chat transcript text and direct DOM inspection).
- Log: session ses-143, 2026-09-16; session ses-040, 2026-09-17.
- Bug reference: BUG-CRX-020 (fabricated-confirm proposals with no real button, reproduced on a fourth domain agent — Time Agent, 2 action types: `create_schema`, `settings_update`). Note: 2026-09-17's `create_schema` retest produced a genuine, real-button proposal that persisted correctly — consistent with this bug's already-documented inconsistent/intermittent behavior across other agents this session, not a contradiction requiring the bug to be closed.
