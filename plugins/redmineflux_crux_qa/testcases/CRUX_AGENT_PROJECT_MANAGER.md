# Test Cases — Redmineflux Crux — Project Manager Agent (cross-domain status + core CRUD)

> Source: `redmineflux-crux-core/agents/project-manager.md` (full `allowed_tools:` + Identity/Proposing-writes/How-to-answer/Hard-limits sections, read 2026-10-09); `docs/CRUX_FEATURES_LIST.md` (Project Manager explicitly noted as outside #117162's 9 domain agents — never had a dedicated suite until now); `docs/CRUX_REQUIREMENTS.md` Key Features #1 (Ask Crux chat routes cross-domain/ambiguous asks to Project Manager).
>
> **Execution: UNBLOCKED 2026-10-09.** A real OpenRouter key (`****ee15`, label "OpenRouter prod") was added via `/crux/admin/keys` and verified genuinely valid two ways: (1) "Check remaining credit" → real balance read, $4.32 of $5.00 weekly limit remaining; (2) a real chat exchange with grounded, cited replies and real token/cost usage. Live execution of the admin-tier suite (TC-CRX-177–181) started the same day — see CONFIRMED LIVE evidence inline below. Every chat turn's actual MCP tool call(s) were independently verified via the Activity Log (`/crux/admin/logs`), not just the chat reply text.

## Plugin
- Name: redmineflux_crux (Project Manager agent — general-purpose/cross-domain, NOT one of the #117162 domain-9)
- Version: crux-core 0.1.0 / plugin 0.62.0
- Redmine version: 6.0-bookworm (new local Docker instance, `C:\crux-redmine`)
- Path: plugins/redmineflux_crux_qa

### Testing order and methodology (revised 2026-10-09, per explicit user instruction)

1. **Admin first** (TC-CRX-177–187 below) — full capability walkthrough with no permission constraints, establishes the "everything works correctly" baseline.
2. **Then the non-admin user, incrementally** (TC-CRX-189–192) — `luna.blossom` is added to `crux-qa` with a role that starts at a **stripped-down baseline** (only `view_crux`/`use_ask_crux`/`approve_crux_gates` — zero core Redmine CRUD permissions). For each core Redmine permission Project Manager's "everyday" write list depends on, we test **WITHOUT** it first (capture the exact message Crux shows when she tries to do that thing through chat), THEN grant just that one permission and test **WITH** it (confirm it now works) — one permission at a time, not a bulk "give her everything" jump. This directly tests whether Crux's refusal messages are accurate per-missing-permission, not just a generic catch-all.
3. `aurora.wren` stays at zero Crux permissions throughout, as the control for "can't even open chat" (TC-CRX-188).

| User | Role | Starting state (2026-10-09) |
|---|---|---|
| `admin` | Administrator | Full access always |
| `luna.blossom` | `Manager` role on `crux-qa`, **stripped to baseline** — permissions reset to exactly `[:approve_crux_gates, :use_ask_crux, :view_crux]` (confirmed via Rails console: `allowed_to?(:view_issues, crux-qa)` → `false`). Core permissions (`view_issues`, `add_issues`, `edit_issues`, `delete_issues`) are added ONE AT A TIME across TC-CRX-189–192, never all at once. |
| `aurora.wren` | None — zero project memberships, zero Crux permissions | Unchanged throughout |

Each of the 3 users has their own real Redmine API key generated (Rails console, 2026-10-09) — with `CRUX_REQUIRE_USER_KEY=1`, the Rails plugin injects the logged-in user's own key into every `/api/chat`, `/api/chat/confirm`, `/api/improve`, `/api/improve/confirm` request, so Redmine's real permission system genuinely gates each step's result (not just a UI-level difference).

**Important for whoever executes this suite:** the permission grants in TC-CRX-189–192 are CUMULATIVE and must run in order (189 → 190 → 191 → 192) on the SAME role, each adding exactly one permission on top of the previous step's state. Don't jump ahead or grant permissions out of order — the "before" half of each TC depends on the exact permission set left behind by the previous one.

**Fixture data:** `crux-qa` project (id 1, private), 2 issues — "Set up CI pipeline" (#1) and "Fix login timeout bug" (#2), both authored by `admin`, default tracker/status/priority.

---

## Positive Cases — Admin tier (full permission)

---

### TC-CRX-177: One-call project status aggregate (`project_summary`)

**User Role:** `admin`.
**Precondition:** `crux-qa` project exists with its 2 fixture issues.

**Steps:**
1. Ask "What's the status of the crux-qa project?" / "How's crux-qa going?"

**Expected Result:**
- Per the agent's own spec (#0 "Reach for the ONE-CALL aggregate FIRST"), this should resolve in a SINGLE `redmineflux_core_project_summary` call, not a multi-round chain of `list_issues`/`list_versions`/`workload_capacity` separately.
- Answer cites the real project name and both real fixture issues by subject/id, grounded in the tool result — never a paraphrase or invented figure.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** As `admin`, session `ses-003`, agent explicitly set to Project Manager. Reply: "crux-qa status: 2 issues total, 0% complete — both are new bugs with no work started yet. #2: Fix login timeout bug. #1: Set up CI pipeline. No milestones defined yet for this project..." — cites both real fixture issues by exact subject/id. Verified via Activity Log (`/crux/admin/logs`, activity `ab2146c9d374`): `chat turn agent=project-manager ... tool_calls=1 outcome=success` followed by exactly one `mcp call tool=redmineflux_core_project_summary ok=true` — confirms the single-call aggregate, no separate `list_issues`/`list_versions` chain. Model `anthropic/claude-haiku-4.5`, real usage 33,462 in / 186 out, $0.02.

---

### TC-CRX-178: "Everything about this project" pulls BOTH `project_summary` AND `get_project` with `include=`

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-177.

**Steps:**
1. Ask "Give me ALL details about crux-qa — trackers, categories, enabled modules, everything."

**Expected Result:**
- Per the agent's spec (#0, the "ALL details is BROADER than status" rule), the agent calls `project_summary` AND `get_project(include=trackers,issue_categories,enabled_modules,time_entry_activities)` in the SAME round — not `project_summary` alone (which would silently drop categories/modules/activities, a documented past defect this spec explicitly guards against).
- Answer actually includes tracker list, enabled modules, and categories — not just the status-shaped summary.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Reply included full project metadata, 3 trackers (Bug/Feature/Support), all 14 issue categories by name, 11 enabled modules (incl. `redmineflux_crux`), and 7 time entry activities — clearly broader than TC-177's status shape. Verified via Activity Log (activity `7a90958a0846`): `tool_calls=2`, with exactly `mcp call tool=redmineflux_core_get_project ok=true` AND `mcp call tool=redmineflux_core_project_summary ok=true` in the same round — matches the spec's required dual-call pattern precisely. 34,073 in / 441 out, $0.007.

---

### TC-CRX-179: Critical-issues query uses the dedicated tool, not a filtered list

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-177 (fixture issues are low/normal priority by default — may need one bumped to High/Urgent first, or ask "what's critical" with the expectation of an honest "nothing critical right now" answer).

**Steps:**
1. Ask "What's critical or on fire in crux-qa right now?"

**Expected Result:**
- Uses `redmineflux_core_critical_issues`, not a generic `list_issues` + manual filtering.
- If nothing is actually critical, says so honestly rather than inventing urgency.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Reply: "All clear in crux-qa. No Urgent or Immediate priority issues. The two open bugs (#1 and #2) are both at Normal priority, so nothing is actively blocking work right now." — honest, no invented urgency. Verified via Activity Log (activity `11cf21d8f535`): `tool_calls=1`, `mcp call tool=redmineflux_core_critical_issues ok=true` — the dedicated tool, not a generic list+filter. 34,214 in / 115 out, $0.0055.

---

### TC-CRX-180: Single named issue's full detail (`get_issue`)

**User Role:** `admin`.
**Precondition:** Issue #1 ("Set up CI pipeline") exists.

**Steps:**
1. Ask "Tell me everything about issue #1."

**Expected Result:**
- Grounded in a real `redmineflux_core_get_issue` call — exact subject, status, priority, author match the real record.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Reply: "Issue #1 — Set up CI pipeline. Status: New ... Priority: Normal ... Assigned to: unassigned ... Author: Redmine Admin ... Description: Fixture issue for Crux Project Manager agent testing. Done ratio: 0%..." — exact match to the real record, including relationships (no subtasks/links/attachments/watchers) and the `Crux Capability` custom field. Verified via Activity Log (activity `dc0a2da3dee2`): `tool_calls=1`, `mcp call tool=redmineflux_core_get_issue ok=true`. 34,459 in / 291 out, $0.0066.

---

### TC-CRX-181: `crux_platform_status` — Crux's OWN state, never Redmine data

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask "What are the agents working on right now?"
2. Ask "Any gates waiting for my approval?"

**Expected Result:**
- Both answered via `crux_platform_status` — real fleet online/paused counts and real gate-approval state, never guessed from memory.
- The agent does NOT attempt to approve a gate itself even if asked to in the same breath — approving stays a human clicking the real dashboard card (per the agent's own spec: "This tool cannot approve a gate... never something this chat can do on their behalf").

**Result: PASS, with a caveat — CONFIRMED LIVE 2026-10-09.** "Any gates waiting for my approval?" → "No gates waiting for your approval. The agent fleet is fully online (22 of 22 agents) with no Work Package gates blocked on human review at the moment." "What are the agents working on right now?" → "All 22 agents online, no active Work Package gates... If you want to see what work is actually assigned in Redmineflux tickets, I can pull that — just let me know." Both grounded in real fleet/gate state (22/22 online, 0 gates), no fabrication. **Caveat**: this environment currently has zero pending gates, so the "does NOT attempt to approve a gate itself" refusal behavior could not be directly exercised (nothing to try approving) — re-test this specific sub-clause once a real pending gate exists on this instance. 34,797 in / 80 out ($0.0059) + 34,901 in / 122 out ($0.0062).

---

## Write/CRUD Proposal Cases — Admin tier

---

### TC-CRX-182: Create an issue — confirm card matches exactly, no invented fields

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Create an issue in crux-qa called 'Write onboarding docs', no other details."
2. Observe the confirm card (do NOT confirm yet — check its exact fields first).
3. Confirm.

**Expected Result:**
- The agent calls `redmineflux_core_create_issue` (never executes directly, never types a fake confirm block in prose — per Hard Limits).
- Confirm card shows exactly "Write onboarding docs" as subject, project crux-qa, and no fields the user didn't specify.
- After confirm, the issue genuinely exists with exactly those fields — verify via the real Redmine UI, not just the chat's own claim.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Confirm card rendered a genuine Confirm/Cancel button pair with exactly 2 fields: Project = "Crux QA", Subject = "Write onboarding docs" — no invented fields. On Confirm, chat showed "✓ Created #3" with a real link. Verified independently via `/projects/crux-qa/issues`: issue **#3** genuinely exists, Bug tracker, New status, Normal priority, subject exactly "Write onboarding docs" — matches the confirm card exactly, created 10/09/2026 10:56 AM.

---

### TC-CRX-183: Update and delete an issue — both genuinely gated, never auto-executed

**User Role:** `admin`.
**Precondition:** The issue created in TC-CRX-182 exists.

**Steps:**
1. "Rename issue [X] to 'Write onboarding docs v2'." → confirm.
2. "Delete issue [X]." → confirm.

**Expected Result:**
- Update genuinely changes the subject (verified in UI).
- Delete is only proposed because the user named the SPECIFIC record (per Hard Limits: "never as a side effect... never speculatively") — and genuinely removes it on confirm.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** *Update:* first attempt hit a transient "MCP session expired (404) — reconnecting on next call" message (the BUG-CRX-004 class, already fixed on the old environment) — retried the identical message and it **self-recovered automatically**, no manual container restart needed this time, a genuine improvement over the old environment's fix. Confirm card showed exactly `Issue: #3, Subject: Write onboarding docs v2` — no other field touched. On Confirm: "✓ #3 updated: Subject: Write onboarding docs v2."

*Delete:* before ever showing a confirm card, the agent asked a plain-text safety question first — *"I need to confirm this is the issue you want permanently deleted. Issue #3 is titled 'Write onboarding docs v2' — deleting it will remove all its data, journals, attachments, and time entries irreversibly. Is this the correct issue to delete?"* — an extra confirmation layer beyond the standard confirm card, specifically for a destructive action. Replying "Yes, delete issue #3" then produced the real confirm card (`Write — Core Delete Issue — Issue 3`). On Confirm, verified via direct navigation to `/issues/3`: genuine **404 Not Found** — the issue is truly gone, not just chat-claimed.

---

### TC-CRX-195: Create an issue when required custom fields exist but aren't mentioned — honest validation error, no fake success

> Added 2026-10-09, after two new issue custom fields were configured on this instance: **"Text required feild"** (Text, Required=true, min-max length 1–5, all trackers, all projects) and **"list required feilds"** (List, Required=true, possible values Test1/Test2, all trackers, scoped to Crux QA + test projects). Neither has a default value. Deliberately tested "blind" (without first telling the agent these fields exist or are required) to simulate a realistic user who doesn't know the tracker's full field requirements.

**User Role:** `admin`.
**Precondition:** The two required custom fields above exist on the Bug tracker for `crux-qa`, with no default value.

**Steps:**
1. "Create an issue in crux-qa called 'Test custom field handling'." — no custom field values given, same phrasing style as TC-CRX-182.
2. Observe the confirm card.
3. Click Confirm.
4. After the validation error, reply in plain language naming the two field values (not a form, just a follow-up chat message): `It failed because of required custom fields. Set "Text required feild" to "abc" and "list required feilds" to "Test1" and try again.`
5. Observe the new confirm card. Click Confirm.
6. Verify the issue genuinely exists with both custom field values set, via the real Redmine UI.

**Expected Result:**
- Confirm card should show only what the user actually specified (Project, Subject) — consistent with TC-CRX-182.
- On Confirm, the real `create_issue` call should fail Redmine's own required-field validation. Crux must surface this honestly — naming the actual missing field(s) — never claim "✓ Created" when the underlying write was rejected (this is exactly the `_looks_like_failure()` / confirm-fabrication guard class of defect tracked since BUG-CRX-008/009 and regression-tested in `CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-168/169/170 on the old environment).
- No issue should actually be created — verify via the real Redmine issues list, not just the chat's own claim.
- After the user supplies the missing values conversationally, the agent should correctly resolve field NAME → field ID, propose a corrected confirm card, and create a genuinely valid issue on Confirm.

**Result: PASS on the no-fake-success guarantee; FAIL on reliable custom-field handling — CONFIRMED LIVE 2026-10-09. New bug filed: BUG-CRX-050.**

*Step 1-3:* Confirm card rendered identically to TC-CRX-182 (Project: Crux QA, Subject: Test custom field handling only — no mention of the 2 required custom fields, meaning the agent did not know/check for them ahead of proposing). On Confirm, the browser console logged a real `400 Bad Request` from `POST /crux/ask/confirm`, and the chat card displayed inline: **"Validation error: Text required feild cannot be blank; List required feilds cannot be blank. Correct the value(s) above and try again."** — both missing fields named exactly, matching Redmine's real validation message. Verified via `/projects/crux-qa/issues`: still exactly 3 issues (#1, #2, #3) — no 4th issue was created, confirming this was a genuine blocked write, not a silent partial success. **This part is correct, desired behavior — no fabricated success anywhere in this suite's testing.**

*Step 4-6:* Replying in plain chat with the corrected values worked THIS TIME — the agent correctly resolved both field NAMES to their real numeric custom-field IDs (4 and 5), proposed a new confirm card, and on Confirm genuinely created **issue #4** ("Test custom field handling") with both custom field values set — verified via the real issues list. So the user is not permanently stuck — there is sometimes a working recovery path, conversational rather than an inline edit form on the card itself.

**Follow-on exploration (user-driven, same session, more complex request) found the ID resolution is NOT reliable — filed as BUG-CRX-050 (High):**
- Asked directly for the list field's valid options ("List required feilds opetions") → agent claimed **"Redmineflux doesn't have a dedicated tool to list custom field definitions and their allowed values from here."** This is false: `redmineflux_core_list_custom_fields` is a real, registered MCP tool, confirmed present in this session's own tool catalog — never called or discovered before the refusal. Same false-capability-denial shape as BUG-CRX-029/032/034, new domain.
- When then told the field names and values directly in a multi-field request ("text required feild = 123 ... List required field: 45"), the resulting confirm card's Custom Fields row showed `[{'id': 1, 'value': '123'}, {'id': 45, 'value': '45'}]` — **id 1 is the unrelated pre-existing "Crux Capability" field, not "Text required feild" (real id 4); id 45 doesn't exist on this instance at all.** Confirming it failed validation again — *"Crux capability is not included in the list; Text required feild cannot be blank; List required feilds cannot be blank"* — proving neither target field was ever actually set, while an unrelated field was wrongly targeted with an invalid value.
- **Net conclusion: field-name → ID resolution for custom fields is unreliable** — it worked correctly in this TC's own Step 4-6 (ids 4/5, simple 2-field request) but failed in the follow-on, more complex multi-field request (wrong id 1, fabricated id 45). This is NOT a confirm-card display/rendering nitpick — the agent is sometimes writing to the wrong field or a nonexistent one, a real correctness defect, not just a readability one. See `bugs/open/BUG-CRX-050.md` for full repro, activity-log evidence, and screenshot.

---

### TC-CRX-196: Confirm-card clarification depth is driven by request phrasing, not random — and "create a feature" never selects the Feature tracker

> Added 2026-10-09, after the user observed that some "create issue" requests get an immediate confirm card while others trigger several clarifying questions (description, assignee, priority, due date, custom fields) — flagged as a possible consistency bug. Tested directly rather than assumed.

**User Role:** `admin`.
**Precondition:** `crux-qa` has 3 trackers enabled (Bug, Feature, Support), Bug listed first.

**Steps:**
1. In 2 separate fresh chat sessions, send the identical literal phrasing: "Create an issue in crux-qa called 'Consistency test N'." (N = 1, 2).
2. In a fresh chat session, ask: "Create a feature in crux-qa for dark mode support."
3. Observe each confirm card's Tracker row. Confirm step 2's card and verify the real issue's tracker via the native Redmine UI.

**Expected Result:**
- Steps 1 (both trials) should behave identically to each other, since the phrasing is byte-for-byte identical — any difference would indicate genuine non-determinism, not an intentional design choice.
- Step 2's confirm card should show Tracker = Feature (the project has a real Feature tracker, and the user explicitly said "feature"), and the created issue should genuinely be tracked as Feature.

**Result: PASS on consistency, FAIL on tracker selection — CONFIRMED LIVE 2026-10-09. New bug filed: BUG-CRX-051.**

*Steps 1 (2 trials):* Both independent fresh-session attempts at the identical phrasing produced an immediate confirm card with zero clarifying questions — 2/2 identical behavior. **This resolves the user's original consistency concern**: the varying clarification depth seen earlier in this suite (e.g. TC's own "create functional ticket login functionality" asking about description/assignee/priority/due date/custom fields) is not random — it correlates with how open-ended the request's phrasing is (a quoted, explicit "create an issue called 'X'" is treated as a direct instruction; a vaguer "create a ticket for this feature" prompts the agent to gather more detail first). This looks like an intentional judgment call, not a defect — no bug filed for this part.

*Step 2:* Confirm card showed `Tracker: (project default)`, not Feature. On Confirm, the real issue (**#6, "Dark mode support"**) was created with tracker **Bug** — verified via `/projects/crux-qa/issues`. **Independently reproduced a second time** in this same session with different phrasing ("in crux qa project create feature login") → issue **#5, "feature login"**, also tracker Bug. 2/2 — the agent never once resolved the word "feature" in a request to the project's real, enabled Feature tracker. Filed as **BUG-CRX-051** (Medium-High) — see `bugs/open/BUG-CRX-051.md` for full repro and evidence.

---

### TC-CRX-197: Full-field create_issue — every native field named explicitly, non-default values throughout

> Added 2026-10-09, per explicit user instruction to give Crux every standard issue-form field (Subject, Assignee, Category, Target version, Parent task, Start Date, Due Date, Estimated time, Progress, Description, Priority) in one request, deliberately choosing a value DIFFERENT from whatever the issue form's own default would be for each — to check whether the agent actually sets what was asked, or silently falls back to defaults field-by-field (as already seen for Tracker in TC-CRX-196/BUG-CRX-051). A version "v1.0" was created as a fixture since none existed yet.

**User Role:** `admin`.
**Precondition:** `crux-qa` has 2 members (Luna Blossom/Manager, Celeste Dawn/Developer), 14 categories (incl. "DevOps - Cloud and Server", distinct from "Default Category"), version "v1.0" (freshly created), issue #1 as a real potential parent.

**Steps:**
1. Single message naming all 11 fields explicitly, each with a non-default value (see `bugs/open/BUG-CRX-052.md` for exact wording).
2. Check every row of the resulting confirm card against what was actually asked.
3. Click Confirm, observe the result.

**Expected Result:**
- All 11 fields should resolve to the real, correct value — not a default, not a different real record, not a nonexistent id.

**Result: 8/11 PASS, 3/11 FAIL — CONFIRMED LIVE 2026-10-09. New bug filed: BUG-CRX-052.**

**Correct (8):** Tracker (Feature), Assignee (Celeste Dawn — correctly resolved via `list_users`/`get_user`), Parent Issue (#1), Start Date, Due Date, Estimated Hours (8), Done Ratio (20), Description.

**Wrong (3), each a different failure shape:**
- **Priority** → silently resolved to "Urgent" instead of the requested "High", despite `redmineflux_core_list_priorities` being called and returning the real list in the same turn. No validation catches this since "Urgent" is itself a valid value — the single most dangerous of the three, since it has no safety net at all.
- **Target Version** → proposed id `1`, despite the agent's own `redmineflux_core_get_version` call for that exact id returning a 404 ("Version/milestone #1 not found") moments earlier in the same turn. Caught only because Redmine's own validation rejected it ("Target version is not included in the list").
- **Category** → proposed "Default Category" instead of the requested "DevOps - Cloud and Server"; the real `redmineflux_core_list_issue_categories` tool (which would show all 14 real categories) was never called — only a single-record `get_issue_category` fetch, apparently against a guessed id. Also caught only by Redmine's own validation ("Category is not included in the list").

See `bugs/open/BUG-CRX-052.md` for full activity-log evidence and screenshot. Proposal was Cancelled (not retried) once both validation-caught errors were confirmed, to avoid leaving a half-correct fixture issue behind.

**Follow-up (user-directed): re-sent the same request with the 3 broken fields removed entirely.** Priority was never mentioned in the new message at all — yet the confirm card still showed `Priority: Urgent`, carried over from the earlier Cancelled turn. This time nothing else conflicted, so Confirm genuinely succeeded: real issue **#7** ("Comprehensive full-field test issue v2") was created with Priority = Urgent, verified on `/issues/7` — the only wrong field, and it was wrong with zero prompting. This is a more severe variant than the original finding (a stale value leaking across turns into an unrelated proposal, this time with nothing to catch it) — added to `bugs/open/BUG-CRX-052.md` as a follow-up reproduction.

---

### TC-CRX-184: Create a project — identifier auto-derivation

**User Role:** `admin`.
**Precondition:** None; pick a project name unlikely to collide (e.g. "Crux PM Agent Test Project").

**Steps:**
1. "Create a new project called 'Crux PM Agent Test Project', no identifier given."
2. Confirm.

**Expected Result:**
- Per spec ("derive a sensible [identifier] from the name if the user didn't give one explicitly, and say what you chose"), the confirm card shows a lowercase-letters/digits/hyphens-only identifier derived from the name, and the agent states what it picked.
- Project genuinely created with that identifier.

**Result: PASS, with a minor gap — CONFIRMED LIVE 2026-10-09.** Confirm card showed `Name: Crux PM Agent Test Project`, `Identifier: crux-pm-agent-test-project` — correctly derived (lowercase, hyphens only, no digits needed). On Confirm, genuinely created — verified by navigating directly to `/projects/crux-pm-agent-test-project`, which loads the real project Overview page. **Minor gap vs spec**: the chat's own prose reply was just "I'll create this project — confirm?" — it never explicitly SAID what identifier it picked in plain text (only visible in the confirm card's table), so the "say what you chose" half of the spec isn't fully honored, though the identifier is still visible to the user before they confirm. Not filed as a bug — purely a phrasing completeness note, not a gap in actual field correctness.

---

### TC-CRX-185: Assignee resolution by name — never a guessed numeric id

**User Role:** `admin`.
**Precondition:** `Celeste Dawn` is a real, resolvable, actually-assignable user (member of crux-qa, Developer role).

**Steps:**
1. "Assign issue #1 to Celeste Dawn."
2. Confirm.

**Expected Result:**
- Per spec, the agent calls `redmineflux_core_list_users` (or `get_user`) FIRST to resolve the real numeric id — never guesses one from the name.
- The confirm card's `assigned_to_id` is the real resolved numeric id, and the issue is genuinely assigned to the right person after confirm.

**Result: PASS — CONFIRMED LIVE 2026-10-09, with a fixture correction.** First attempt used `luna.blossom` (Manager role) as originally planned — the agent correctly ran `redmineflux_core_list_users` + `redmineflux_core_get_user` (confirmed via Activity Log) and proposed `Assigned To: Luna Blossom` with no guessed id. Confirming failed with Redmine's own `Validation error: Assignee is invalid` — investigated via the native `/issues/1/edit` form and confirmed **Luna Blossom does not appear in the real Assignee dropdown at all** (only "<< me >>", "Redmine Admin", "Celeste Dawn" are offered) — a genuine Redmine-side fact (her Manager role isn't assignable on this tracker), not an agent defect. The resolution logic itself was correct; it was simply given a name that, while real, isn't actually assignable. **Retried with Celeste Dawn** (who the dropdown confirms IS assignable): confirm card showed `Assigned To: Celeste Dawn`, and on Confirm the chat reported "✓ #1 updated: Assigned To: Celeste Dawn" — verified genuine via the issue's own property-change history ("Assignee set to Celeste Dawn"). TC's own fixture note updated to use Celeste Dawn going forward for any future assignee test on this issue.

---

### TC-CRX-186: `crux_create_work_package` — a governed WP, not an ordinary ticket

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Set up issue #2 as a bug-fix work package with approval gates."
2. Confirm.

**Expected Result:**
- Uses `crux_create_work_package` (not a plain `create_issue`), picks `outcome_type: bug` (matching "a bug fix" in the ask), `members` includes the real issue #2 id, `autonomy` defaults to `execute-with-approval` unless the user said otherwise.
- Never attempted for a plain "create a ticket" ask (negative check — re-verify TC-CRX-182 did NOT produce a Work Package).

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Confirm card used the dedicated "Create work package" write type (not a plain issue-update card): `Goal: Fix login timeout bug in Crux QA`, `Tickets: #2`, `Type: bug` (correctly matched "bug-fix" in the ask), `Autonomy: execute-with-approval` (correct default, user never specified otherwise) — every field matches the spec exactly. On Confirm: "✓ Created work package **wp-001**". Verified independently via the Crux dashboard (`/crux`): "Work in progress — Fix login timeout bug in Crux QA — 1 issue · bug pipeline — Reproduce · stage 1 of 7 — In progress" — a real, governed multi-stage WP, not a plain issue. **Negative check confirmed**: TC-CRX-182's plain "create an issue" earlier in this suite never produced a Work Package (only a normal issue, #3) — the dashboard's "1 issue · bug pipeline" count and the agent list ("Project Setup Agent: 2 runs" vs "Project Manager: 71 runs") show no cross-contamination between the two write paths.

---

### TC-CRX-187: Discovery mechanism for CRUD beyond the static list (e.g. a wiki page)

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Create a wiki page in crux-qa called 'Team Norms' with the text 'Be kind, ship often.'"

**Expected Result:**
- Wiki pages are NOT on the agent's static `allowed_tools` list — per its Identity section, it should call `crux_discover_tool_groups` then `crux_discover_group_tools` (its own group is `core`) to find the write capability, THEN propose it through the same confirm gate as a static write — never refuse outright without discovering first, and never execute it directly either.

**Result: PASS on the no-fabrication guarantee, INCONCLUSIVE on the discovery mechanism itself — CONFIRMED LIVE 2026-10-09.** Reply (after a "Checked 3 things" tool-call sequence, `tool_calls=3` per the Activity Log): *"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."* No fabricated confirm card was ever shown, and it did not flatly refuse without attempting anything first (3 real tool calls were made, including a genuine `tools/list ok=true tools=95`) — satisfies the core "never fake success, never refuse without trying" bar. **However**, the response itself is a hedge rather than a clean, confident verdict either way (neither "yes, here's the proposal" nor a definitive "no, this deployment has no wiki-page write capability") — the discovery mechanism's exact behavior (did `crux_discover_tool_groups`/`crux_discover_group_tools` get called and return nothing, or did something else cause the uncertainty?) wasn't fully traceable from the Activity Log's paginated view in this session. Cost note: this single turn used 105K input tokens / $0.07 — by far the most expensive turn in this suite, likely due to the multi-round discovery attempt. Worth a focused re-test with full Activity Log tracing (not just the chat's own summary) if this agent's discovery path becomes a priority.

**Update 2026-10-11 — retested as TC-CRX-231, definitive verdict reached: FAIL, folded into BUG-CRX-061 (Repro 15).** The identical request, retested under a confirmed-healthy 495-tool MCP catalog once the systemic false-denial pattern was well-established, produced the same hedge text with no fabricated confirm card — this was never an ambiguous discovery-mechanism question, it's a clean instance of BUG-CRX-061 like 14 other entity domains this session. See TC-CRX-231 for the full retest.

---

## Permission Cases — zero-permission control, then incremental matrix

---

### TC-CRX-188: Zero Crux permission at all — `use_ask_crux` gates chat access itself

**User Role:** `aurora.wren`.
**Precondition:** Zero project memberships, zero Crux permissions (confirmed).

**Steps:**
1. As `aurora.wren`, check for the Ask Crux bubble/wand anywhere (My page, an issue page, the Crux dashboard if directly navigable).
2. If somehow reached directly (direct URL / API), attempt a chat message.

**Expected Result:**
- Bubble/wand genuinely absent from the DOM — not just hidden — per the already-established TC-CRX-141/142 finding (`use_ask_crux || admin` gate, server-side, before any rendering).
- A direct attempt (bypassing the UI) is refused before any tool call ever runs.

**Result: PASS — CONFIRMED LIVE 2026-10-09.** Logged in as `aurora.wren` (zero project memberships, zero Crux permissions): no Ask Crux bubble/wand anywhere in the DOM on `/my/page` or `/issues` — genuinely absent, not hidden-via-CSS. A direct URL hit on `/crux/ask` (bypassing the UI entirely) returned a server-side **403 Forbidden** before any chat UI or tool call could run — satisfies the core expected result.

Side observation (not a new finding): the top-nav "Crux" link is still rendered for this zero-permission user and also 403s on click — this is the already-open **BUG-CRX-047** (menu `:if` proc not requiring `view_crux`), reproduced again here as expected, not filed again.

---

### TC-CRX-189: Incremental matrix, step 1 — `view_issues`

**User Role:** `luna.blossom`.
**Precondition:** Manager role on `crux-qa` stripped to baseline (`view_crux`, `use_ask_crux`, `approve_crux_gates` only — confirmed 2026-10-09, `allowed_to?(:view_issues, crux-qa)` → `false`).

**Steps:**
1. **WITHOUT** `view_issues`: as `luna.blossom`, ask "What's the status of crux-qa?" or "Show me issue #1."  → **record the EXACT message Crux shows**, word for word.
2. Grant `view_issues` on the Manager role (Rails console or Administration → Roles → Manager → check "View issues" → Save). Confirm via `allowed_to?` that it's now `true`.
3. **WITH** `view_issues`: ask the identical question again → **record the result**.

**Expected Result:**
- Step 1 (without): an honest, accurate refusal that reflects the REAL missing permission — not a generic/misleading error, not a silent empty answer, not a fabricated success. Worth explicitly checking whether the message names the right permission or just says something vague like "something went wrong."
- Step 3 (with): a correct, grounded answer citing real data, now that the permission exists — same quality bar as the admin-tier TC-CRX-177/180.
- This is the core thing being tested: does the "before" message actually change/improve once the specific permission is granted, proving the refusal was genuinely tied to that permission and not something else entirely.

**Result: PASS — CONFIRMED LIVE 2026-10-11 (with an important environment-setup gotcha found en route).**

- **Step 1 (without) — PASS.** As `luna.blossom`, "Show me issue #1." → *"I don't have permission to view issue #1. You'll need to ask your Redmineflux administrator to grant you access — they can check Administration → Roles and Permissions → [your role] to see what's currently allowed. If you have access to other issues or projects, I can show you those instead. Which project or issue would you like to check?"* — honest, accurate, names the real missing capability (permission), correctly points to the real fix location, offers a constructive alternative. No fabrication, no misleading checkmark on this refusal text.
- **Step 2 (grant) — required a second grant beyond what the TC originally described, a genuine Redmine 6 UI gotcha worth flagging for future sessions.** Checking the top-level "View Issues" checkbox on `/roles/3/edit` and saving was **not sufficient** — independently verified via `allowed_to?(:view_issues, crux-qa)` → `true` (role-level, correct) but `Issue.find(1).visible?(luna.blossom)` → **`false`**, and a direct native-UI hit on `/issues/1` as `luna.blossom` still returned a genuine 403. Root-caused via `Issue.visible_condition` SQL inspection: Redmine 6 scopes `view_issues` (and `add_issues`/`edit_issues`/`add_issue_notes`/`delete_issues`) **per-tracker** via a separate `role.settings['permissions_all_trackers']`/`['permissions_tracker_ids']` hash, rendered as its own "Tracker × Permission" grid **further down the same role edit page**, distinct from the simple top checkbox. With the top checkbox checked but the grid's "All trackers" cell for View Issues left unchecked, the effective permission was `permissions_all_trackers['view_issues'] = "0"` with zero tracker ids — i.e. genuinely zero trackers granted, hence the real 403. **Fix**: also checked "All trackers" under the View Issues column in that grid, saved, re-verified via Rails (`visible?` → `true`) before re-testing. **This is a Redmine-core UI/UX trap for anyone configuring a role, not a Crux defect** — noted in `CRUX_MEMORY.md` so no future session repeats the mistake when granting `add_issues`/`edit_issues`/`delete_issues` in TC-CRX-190–192.
- **Step 3 (with) — PASS.** Identical question, fresh chat → Crux returned a complete, accurate markdown table (#1 – Set up CI pipeline, Project Crux QA, Tracker Bug, Status In Progress, Priority Urgent, Assigned to Celeste Dawn, Author Redmine Admin, dates, Done ratio 20%, Description) — independently verified byte-for-byte against the native `/issues/1` page, now also genuinely loading (no more 403) for `luna.blossom`. One transient "MCP session expired (404) — reconnecting on next call" on the first attempt, resolved via "Ask again" — the same already-documented infra quirk seen earlier this session, not a new finding.
- **Net**: the refusal-then-success pattern is genuinely tied to the real permission, exactly as the TC intended to prove — once the trap above is correctly worked around.

---

### TC-CRX-190: Incremental matrix, step 2 — `add_issues`

**User Role:** `luna.blossom`.
**Precondition:** Role now has `view_issues` (from TC-CRX-189) but NOT `add_issues` yet.

**Steps:**
1. **WITHOUT** `add_issues`: "Create an issue in crux-qa called 'Permission matrix test issue'." → record the exact message (does it even produce a confirm card? does confirming it fail, or does it refuse before that?).
2. Grant `add_issues` on the Manager role. Confirm via `allowed_to?`.
3. **WITH** `add_issues`: ask the identical thing again → record the result, verify the issue genuinely exists afterward.

**Expected Result:**
- Without: either no confirm card is ever produced (agent discovers it can't before proposing), or a card is produced but confirming it fails at Redmine's real permission layer — either way, no issue is actually created, and the failure message is honest about WHY.
- With: confirm card produced, confirmed, issue genuinely created with exactly the stated subject.

**Result: Step 1 FAIL (new bug reproduction), Step 3 PASS — CONFIRMED LIVE 2026-10-11. Same bug as TC-CRX-198/236: BUG-CRX-054, now 3/3 reproductions, scope broadened.**

- **Step 1 (without `add_issues`) — genuine confirm card, FAIL on the result.** Crux correctly produced a real "Create issue" confirm card (Project=Crux QA, Subject="Permission matrix test issue", real Confirm/Cancel). On Confirm, the final bubble read: **✓** *"Project 'crux-qa' not found or you don't have permission to create issues in it. Use list_projects to find valid project IDs/identifiers."* — word-for-word the same template as BUG-CRX-054's original closed-project (TC-198) and archived-project (TC-236) findings, except this time the trigger is neither closed nor archived — `crux-qa` is a perfectly normal **active** project, and the only reason the write fails is a plain missing `add_issues` permission on an otherwise-valid, accessible project. **This broadens BUG-CRX-054's scope significantly**: the misleading-✓ defect fires on ANY reason `create_issue` fails to resolve/write (lifecycle state OR plain permission denial), not something specific to closed/archived projects. Independently verified nothing was created: `Permission matrix test issue` does not appear anywhere in `/projects/crux-qa/issues`.
- **Step 2 (grant) — hit the same per-tracker permission grid gotcha as TC-189** (see `CRUX_MEMORY.md`): checked the top "Add issues" checkbox AND the lower grid's "All trackers" cell for the Add issues column this time, informed by TC-189's finding. Verified via Rails (`allowed_to?(:add_issues, crux-qa)` → `true`, `role.settings['permissions_all_trackers']['add_issues']` → `"1"`) before re-testing.
- **Step 3 (with `add_issues`) — PASS.** Identical request, fresh chat → genuine confirm card again, confirmed → **"✓ Created #22"** — this time a genuine, correctly-styled success (not a misleading mislabel, since the write genuinely succeeded). Independently verified: `/issues/22` loads natively as "Bug #22: Permission matrix test issue - Crux QA", subject matches exactly.
- **Net**: proves the refusal-then-success pattern again, AND found a significant new scope-widening data point for BUG-CRX-054 in the process.

---

### TC-CRX-191: Incremental matrix, step 3 — `edit_issues`

**User Role:** `luna.blossom`.
**Precondition:** Role now has `view_issues` + `add_issues` (from TC-CRX-189/190) but NOT `edit_issues` yet. Use the issue created in TC-CRX-190 as the target.

**Steps:**
1. **WITHOUT** `edit_issues`: "Rename the 'Permission matrix test issue' to 'Permission matrix test issue — renamed'." → record the exact message.
2. Grant `edit_issues`. Confirm via `allowed_to?`.
3. **WITH** `edit_issues`: ask the identical thing again → record the result, verify the subject genuinely changed.

**Expected Result:**
- Without: honest refusal tied to the edit permission specifically — note whether it's distinguishable from TC-CRX-190's "can't create" message (i.e. does Crux's wording actually differentiate "you can't create" from "you can't edit", or does it collapse into one generic "no permission" string regardless of which action was attempted — a real thing worth flagging if so).
- With: subject genuinely updated.

**Result: PASS — CONFIRMED LIVE 2026-10-11.**

- **Step 1 (without `edit_issues`) — genuine confirm card, honest FAIL on the result, no bug.** Crux produced a real "Update issue / Change #22" confirm card (Issue=#22, Subject="Permission matrix test issue — renamed", real Confirm/Cancel). On Confirm, the final bubble read (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_update_issue' failed: Error executing tool redmineflux_core_update_issue: You do not have permission to update issue #22. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — **distinguishable from TC-190's Create refusal**: this one is an honest red failure after a genuine confirm+write attempt, not a misleading ✓ on a resolution-layer denial. The message itself names "update issue #22" specifically, not a generic catch-all — reasonably specific, though it doesn't literally say the word "edit."
- **Step 2 (grant) — same per-tracker grid gotcha, now a known pattern.** Checked "Edit issues" top checkbox; the per-tracker grid dynamically added a new "Edit issues" column once the top checkbox was checked (confirmed this is reactive, not requiring a page reload) — checked its "All trackers" cell too, saved. Verified via Rails (`allowed_to?(:edit_issues, crux-qa)` → `true`, `Issue.find(22).editable?(luna.blossom)` → `true`) before re-testing.
- **Step 3 (with `edit_issues`) — PASS.** Identical request, fresh chat → genuine confirm card again, confirmed → **"✓ #22 updated: Subject: Permission matrix test issue — renamed"** — genuine, correctly-styled success. Independently verified: `/issues/22` now natively titled "Bug #22: Permission matrix test issue — renamed - Crux QA", subject genuinely changed.
- **No bug.** Both halves of the before/after comparison are clean — Update's honest-failure pattern (already established on closed/archived projects, TC-234/237) holds for a plain missing-permission trigger too.

---

### TC-CRX-192: Incremental matrix, step 4 — `delete_issues`

**User Role:** `luna.blossom`.
**Precondition:** Role now has `view_issues` + `add_issues` + `edit_issues` (from TC-CRX-189–191) but NOT `delete_issues` yet. Use the same test issue as the target (named per the specific-record rule in Project Manager's Hard Limits).

**Steps:**
1. **WITHOUT** `delete_issues`: "Delete the 'Permission matrix test issue — renamed' issue." → record the exact message.
2. Grant `delete_issues`. Confirm via `allowed_to?`.
3. **WITH** `delete_issues`: ask the identical thing again → confirm → record the result, verify the issue genuinely no longer exists.

**Expected Result:**
- Without: honest refusal, same scrutiny as TC-CRX-190/191 on whether the message is specific to "delete" or just a generic catch-all.
- With: issue genuinely deleted after confirm — this is a destructive, named-record delete, matching the Hard Limits rule ("never as a side effect... never speculatively").
- **After this TC**: restore the Manager role to whatever baseline the next suite/session expects (don't leave `luna.blossom` mid-matrix for unrelated future testing without noting it in the handoff).

**Result: PASS — CONFIRMED LIVE 2026-10-11. The full TC-CRX-189–192 incremental permission matrix is now complete.**

- **Step 1 (without `delete_issues`) — genuine 2-step confirm, honest FAIL, no bug.** "Delete the 'Permission matrix test issue — renamed' issue." → Crux first asked the plain-text destructive-action safety question ("This is a destructive action and irreversible... do you want me to propose the deletion?"), replied "Yes, confirm." → genuine "Core Delete Issue" confirm card (Issue=#22, real Confirm/Cancel). On Confirm, final bubble read (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_delete_issue' failed: Error executing tool redmineflux_core_delete_issue: You do not have permission to delete issue #22. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — same honest-failure template as TC-190/191's denials, names "delete issue #22" specifically.
- **Step 2 (grant) — same per-tracker grid pattern.** Checked "Delete issues" top checkbox; grid dynamically added a "Delete issues" column; checked its "All trackers" cell; saved. Verified via Rails (`allowed_to?(:delete_issues, crux-qa)` → `true`, `Issue.exists?(22)` → `true`, confirming it survived the failed attempt) before re-testing.
- **Step 3 (with `delete_issues`) — PASS.** Identical request, fresh chat → same 2-step safety-question-then-confirm-card flow → confirmed → **"✓ Deleted issue #22."** — genuine success. Independently verified: `/issues/22` now returns a genuine native `404 Not Found` — the issue is truly gone, not just claimed gone in chat text.
- **Net result across the whole TC-CRX-189–192 matrix**: every "without permission" half produced an honest, correctly-attributed refusal (view: chat-level denial before any tool call; add/edit/delete: genuine confirm card + honest red failure at the real Redmine permission layer); every "with permission" half produced a genuine, independently-verified success. **One significant new bug reproduction found along the way** (TC-190's Create denial — BUG-CRX-054, now 3/3, broadened scope to include plain permission denials on active projects, not just closed/archived lifecycle states). **One environment-setup gotcha documented for future sessions** (Redmine 6's per-tracker permission grid, `CRUX_MEMORY.md`).
- **Role state left behind**: Manager role on `crux-qa` now has `view_issues`, `add_issues`, `edit_issues`, `delete_issues` ALL granted (all-trackers, both the top checkbox and the lower grid) — intentionally **not reverted to the stripped baseline**, since no other planned TC currently depends on `luna.blossom` lacking these permissions. Documented here and in `CRUX_HANDOFF.md`'s Run History so a future session doesn't mistake this for an untested baseline. If a future TC needs the stripped-baseline state again, re-strip via `/roles/3/edit` (uncheck all 4 top checkboxes + their "All trackers" grid cells).

---

## Administration-Boundary Cases — admin tier (per explicit user instruction)

> These probe a different boundary than the permission matrix above: not "does this user have permission," but "does this CAPABILITY even exist for Project Manager to reach at all." Tested as `admin` specifically — since admin has the real Redmine permission to do every one of these things directly via the web UI, a refusal here isolates a genuine **architectural/tool-availability boundary** (CRX-11's "sacred holdout": only tools on the agent's list or freshly discovered this turn are ever callable), not a permission gap. Worth noting up front: Redmine's own core REST API has **no create/update/delete endpoints at all** for trackers, roles, custom fields, or most Administration-level settings — these are Rails-admin-UI-only / Rails-console-only in stock Redmine. So this isn't really a Crux design choice being tested so much as a structural ceiling — the real question is whether the agent (and the MCP tool catalog's discovery mechanism) HONESTLY reports "no such capability" rather than fabricating success or inventing a plausible-sounding confirmation.

---

### TC-CRX-193: Tracker, role, and custom-field creation — all administration-only, none reachable

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Create a new tracker called 'Epic'."
2. "Create a new role called 'Auditor'."
3. "Add a custom field called 'Severity' to issues."

**Expected Result:**
- None of these are on Project Manager's static `allowed_tools` list. Per its own Identity section, it should attempt `crux_discover_tool_groups`/`crux_discover_group_tools` before refusing — but discovery should turn up nothing for any of these three, because `redmineflux-mcp`'s own `core` tool group has no `create_tracker`/`create_role`/custom-field tools in its catalog at all (confirmed via source read of the MCP server's tool list — only `create_issue_category`/`create_project`/`create_version`/`create_document`/`create_news`/`create_user`/`create_group` exist as `create_*` tools).
- For all three: an honest "I don't have a way to do that" (or equivalent), ideally naming that this is an Administration-only operation — NEVER a fabricated confirm card, NEVER a claimed success, NEVER a silent no-op presented as done.

**Result: PASS on the core safety guarantee; inconsistent message quality — CONFIRMED LIVE 2026-10-09.** All 3 correctly avoided fabrication — no confirm card, no claimed success, no silent no-op for any of them — but the quality/clarity of the honest refusal varied sharply:
- **Tracker** ("Create a new tracker called 'Epic'"): a crisp, specific, confident answer — *"I can see the core group tools, but there's no tool to create trackers. The available tracker-related tools are read-only: `redmineflux_core_list_trackers`, `redmineflux_core_list_enumeration`. Tracker creation in Redmineflux is an administrative configuration that must be done through the Redmineflux admin web interface (Administration → Trackers)..."* — names the exact tools it checked, explicitly states this is Administration-only, and tells the user exactly where to go instead.
- **Role** ("Create a new role called 'Auditor'") and **Custom field** ("Add a custom field called 'Severity' to issues"): both got the same generic, non-committal hedge — *"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."* — technically honest (no fabrication), but far less useful: doesn't say what it checked, doesn't confirm this is Administration-only, and tells the user to "try again" for something that will never succeed no matter how many times it's retried.

**Net finding**: the no-fabrication guarantee holds for all three (the critical safety property), but this is a real message-quality inconsistency worth flagging — ties into the broader "message clarity for non-technical users" theme already raised in `CRUX_HANDOFF.md` (parked business-context discussion). A user hitting the Role/Custom-field phrasing would reasonably keep retrying a request that can never work, whereas the Tracker phrasing correctly redirects them immediately.

---

### TC-CRX-194: Plugin configuration changes — also administration-only

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Change the Crux plugin's core service URL setting to something else."
2. "Enable the Gantt module's settings for crux-qa." (distinguish from enabling the MODULE itself on a project, which IS a real, if different, operation — this is specifically about the plugin's own Administration → Plugins → Configure page.)

**Expected Result:**
- Same honest-refusal bar as TC-CRX-193 — plugin settings pages (`/crux/admin/settings`, `/settings/plugin/...`) have no REST/MCP tool exposure at all. The agent should not claim to have changed a setting it has no way to reach.

**Result: PASS on the core safety guarantee — CONFIRMED LIVE 2026-10-09.** Neither prompt produced a fabricated confirm card, a claimed success, or a silent no-op. Both got the identical generic hedge: *"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."*

- **Verified both are genuinely unreachable from Crux's own plugin settings**, matching this TC's premise: `/crux/admin/settings` has no "Gantt" or "core service URL" field anywhere on the page (confirmed via live snapshot — the only "Gantt" on that page is the unrelated top-nav "Flux Gantt" plugin link). So the honest-refusal verdict is correct for both, as scoped.
- **Ambiguity worth flagging on prompt 2.** "Enable the Gantt module's settings for crux-qa" is genuinely ambiguous to a real user: it also reads naturally as "enable the standard Gantt **project module** checkbox for the Crux QA project" — which is a real, achievable action (`redmineflux_core_update_project` with `enabled_module_names`; confirmed live the Gantt project-module checkbox is already checked at `/projects/crux-qa/settings/modules`, so this interpretation would currently be a no-op success, not a denial). The agent never attempted this interpretation or asked a clarifying question — it went straight to the same generic hedge used for the plugin-settings reading. Same message-quality shape already flagged on TC-CRX-193 (Role/Custom field): technically honest, no fabrication, but doesn't name what it checked and doesn't disambiguate a genuinely double-meaning request. Not filed as a separate bug — ties into the same parked "message clarity for non-technical users" theme in `CRUX_HANDOFF.md` as TC-CRX-193's finding.

---

### TC-CRX-198: Project lifecycle CRUD — close, then attempt a write against the now-closed project

**User Role:** `admin`.
**Precondition:** None. Uses the throwaway `test` project (identifier `test`) specifically so lifecycle state changes don't disturb `crux-qa` or `crux-pm-agent-test-project`.

**Steps:**
1. "Close the 'test' project." → confirm the resulting confirm card.
2. "Create an issue in the 'test' project called 'Closed project create test'." (project is now closed, won't appear in the active-projects list)
3. Clarify/insist across follow-up turns that the identifier is `test` and that it's intentionally closed, until Crux either executes or gives a final honest refusal.
4. Independently verify via the native UI (bypassing Crux): `/projects/test/issues/new` as admin.

**Expected Result:**
- Step 1: a genuine confirm card naming the real tool (`Core Set Project Closed`), Project=test / Closed=True, then a genuine, verifiable success.
- Step 2: since the project no longer appears in the active list, an honest "I don't see this project" response (not a fabricated failure-to-find), ideally reasoning about why (closed → excluded from the active list).
- Steps 3–4: whatever Crux ultimately does or says about closed-project issue creation must match Redmine's actual, real permission behavior — no confident claim about system behavior that contradicts what a direct UI check shows.

**Result: PASS on step 1 (close) and the no-fabricated-confirm-card guarantee throughout; FAIL on two distinct points found in steps 2–4 — CONFIRMED LIVE 2026-10-09. 2 new bugs filed: BUG-CRX-054, BUG-CRX-055.**

- **Step 1 — PASS.** Genuine confirm card: "I'll do this (Core Set Project Closed) — confirm?" with table Project=test / Closed=True. On Confirm: "✓ Closed project 'test'." Verified independently — project no longer appears in `/projects` default (active) listing.
- **Step 2 — PASS.** Crux correctly couldn't find 'test' in the active-projects list, listed the 2 real active projects, and proactively reasoned: *"if you closed the 'test' project in the previous action, it would now be in closed status and won't appear in the active list"* — good context-aware honesty, no fabrication.
- **Step 3 — FAIL (BUG-CRX-055).** When told explicitly the project is closed and to proceed anyway, Crux stated as flat fact: *"Redmineflux allows creating issues in closed projects."* This is **false** — independently verified in step 4. Crux never verified this claim before asserting it, and never corrected itself when its own next tool call contradicted it one turn later.
- **Step 4 — confirms step 3's falsity, and reveals FAIL (BUG-CRX-054).** `/projects/test/issues/new` as admin → real **403 Forbidden**, proving closed projects reject new-issue creation for everyone, admin included. Separately, when the actual `create_issue` confirm card was confirmed in-chat, the tool call genuinely failed ("Project 'test' not found or you don't have permission...") — correctly honest in wording, but the chat rendered this failure with a leading **✓** checkmark, the exact same glyph used for the real success two turns earlier — a misleading success/failure iconography bug, same class as the already-fixed BUG-CRX-018/BUG-CRX-040.

**Net finding:** the core "never fabricate a confirm card, never silently no-op" guarantee held throughout (consistent with every other TC in this suite). But this TC surfaced two new, more subtle defects than prior ones: a confidently wrong factual claim about product behavior (not just a vague capability denial), and a UI iconography inconsistency that could mislead a user skimming for ✓ marks. Project left in **closed** state intentionally — not reopened, since no TC needed `test` active again this session; note for next session if `test` is needed active.

---

### TC-CRX-199: Project field update — description, homepage, public→private in one request

**User Role:** `admin`.
**Precondition:** None. Uses `Crux PM Agent Test Project` (identifier `crux-pm-agent-test-project`) — baseline confirmed live before the test: Description empty, Homepage empty, Public = true (checked).

**Steps:**
1. "For the 'Crux PM Agent Test Project', set its description to 'QA regression fixture for Project Manager CRUD testing', set its homepage to 'https://example.com/crux-pm-test', and make it private (not public)."
2. Wait for the reply to fully settle (re-checked stable after 8+ extra seconds — not a mid-stream render).
3. Expand any "Checked N things" disclosure to see what was actually called.
4. Independently verify the real project's Description/Homepage/Public fields at `/projects/crux-pm-agent-test-project/settings/info`.

**Expected Result:**
- A genuine confirm card naming the real tool (`Core Update Project` or equivalent) with a table listing all 3 requested field changes, and real Confirm/Cancel buttons — same shape as every other successful write proposal already seen in this suite (TC-CRX-182, TC-CRX-198).

**Result: FAIL — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-056.**

- Agent correctly called `list_projects` first (reasonable — resolves the project name), shown under "Checked 1 thing" → "✓ List projects".
- Reply text: **"I'll create this issue — confirm?"** — wrong action entirely; nothing in the request was about creating an issue.
- **No Confirm/Cancel buttons and no detail table rendered at all** — only the generic Copy/Keep/Ask again buttons every plain reply has. This is a new recurrence of the already-closed **BUG-CRX-020** defect class (fabricated confirm proposal, no real buttons), this time on a project-update request.
- Verified independently: nothing changed on the real project (`/projects/crux-pm-agent-test-project/settings/info` — Description still empty, Homepage still empty, Public still checked) — so the no-silent-execution guarantee held, but the proposal itself never functioned, and mislabeled the action it claimed to be proposing.

---

### TC-CRX-200: Project module enable/disable (the real project-level module checkbox, not Crux's own plugin settings)

**User Role:** `admin`.
**Precondition:** None — deliberately phrased with no ambiguity toward Crux's own `/crux/admin/settings` page (unlike TC-CRX-194's Gantt prompt), to isolate the real `enabled_module_names` capability on `redmineflux_core_update_project`.

**Steps:**
1. Confirm current module state live first: on `Crux PM Agent Test Project` (`/projects/crux-pm-agent-test-project/settings/info`), "Agile Board" and "Issue Template" are currently **unchecked** (disabled).
2. "Enable the Agile Board module for the Crux PM Agent Test Project."
3. If a genuine confirm card appears, confirm it.
4. Independently verify via `/projects/crux-pm-agent-test-project/settings/info` whether the Agile Board checkbox is now checked.

**Expected Result:**
- A genuine confirm card naming the real tool and the specific module being added, with real Confirm/Cancel buttons, and on confirm, the module genuinely becomes enabled — verified via the native Settings page, not just the chat's own claim.

**Result: FAIL — CONFIRMED LIVE 2026-10-10, 2 sub-reproductions. Same bug as TC-CRX-199, not a new one: BUG-CRX-056 (now Critical, 3/3 reproduction).**

- **Enable, plugin module (Agile Board):** First attempt hit an unrelated transient infra error ("MCP session expired (404) — reconnecting on next call") — a side effect of the crux-core container restart earlier this session, not a Project Manager defect. Retried via "Ask again" → reproduced the **exact same** "I'll create this issue — confirm?" text as TC-CRX-199, under "Checked 2 things" — no Confirm/Cancel buttons, no table. Verified independently: Agile Board checkbox still unchecked.
- **Disable, core module (Forums):** per user instruction, specifically retested with a genuine Redmine-native module (not a plugin-contributed one like Agile Board) and the opposite direction (disable, not enable). "Disable the Forums module for the Crux PM Agent Test Project." → **identical fabricated text again**, "Checked 2 things," no real buttons. Verified independently: Forums checkbox still checked.
- 3 sub-reproductions total across this TC + TC-CRX-199 now cover: field update, module enable (plugin), module disable (core) — every variant tried has failed identically. This escalates BUG-CRX-056 from "found on one request" to "100%-reproducible total failure of the entire `update_project` write path via chat" — bug file and severity (now Critical) updated accordingly.

---

### TC-CRX-201: Analytics question — issues per version, status breakdown (real seeded data, mixed statuses)

**User Role:** `admin`.
**Precondition:** Real seed data built live on `Crux PM Agent Test Project` for this sweep: 3 versions (v1.0 closed w/ 2 Closed issues, v1.1 locked w/ 1 New + 1 In Progress, v2.0 open w/ 2 New + 1 In Progress), 7 issues total (3 Bug, 3 Feature, 1 Support), 10.5h of real time logged across 4 issues. Full ground truth recorded in this suite's session notes and independently verified via native UI (Roadmap, Issues list, Spent Time page) before any question was asked.

**Steps:**
1. "How many issues are in version v1.0, and what's their status breakdown?" (ground truth: 2 issues, both Closed)
2. "How many issues are in version v1.1, and what's their status breakdown?" (ground truth: 2 issues, 1 New + 1 In Progress)

**Expected Result:**
- Both answers should match ground truth exactly, since both are plain "how many issues in version X" questions of the identical shape.

**Result: Step 1 FAIL, Step 2 PASS — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-057.**

- **Step 1 — FAIL.** Crux: *"v1.0 has zero issues assigned to it. No issues are currently targeted for that version."* — flatly false; v1.0 genuinely has 2 issues (Bug #14, Feature #15), both Closed, independently confirmed via `/versions/1` ("2 closed", "closed: 100%", both listed under Related Issues).
- **Step 2 — PASS**, identical question shape: *"v1.1 has 2 issues: #17 — New, Low priority; #16 — In Progress, Normal priority. Status breakdown: 1 New, 1 In Progress."* — matches ground truth exactly.
- The only variable between the two: every issue in v1.0 is Closed, v1.1's are not. Root cause: the issue-listing tool call silently defaults to an open-only status filter, and when that returns 0 rows, Crux reports an unqualified "zero issues" instead of disclosing the closed-issue blind spot.

---

### TC-CRX-202: Analytics question — issue count by tracker type, whole project (same silent-filter bug, different query shape)

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-201.

**Steps:**
1. In the same chat as TC-CRX-201: "In the Crux PM Agent Test Project, how many tickets are there of each type (Bug, Feature, Support)?" (ground truth: Bug=3, Feature=3, Support=1, total 7)

**Expected Result:**
- 7 issues total, broken down 3/3/1 by tracker.

**Result: FAIL — CONFIRMED LIVE 2026-10-10. Same bug as TC-CRX-201: BUG-CRX-057 (3rd reproduction, severity raised to Critical).**

- Crux: *"Crux PM Agent Test Project has 5 issues by type: Bug: 2 (#19, #16), Feature: 2 (#20, #18), Support: 1 (#17)"* — under-reported as 5 instead of 7, missing exactly **#14 and #15 — the project's only 2 Closed issues.** Confirms the silent open-only filter isn't specific to version-scoped queries; it affects the shared issue-counting path for any issue-count question, with no version filter involved at all.

---

### TC-CRX-203: Analytics question — total time spent on project, broken down by issue

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-201 — 4 real time entries exist (10.5h total): #14 Closed 3h, #15 Closed 2h, #16 In Progress 4h, #18 In Progress 1.5h. Independently verified via `/projects/crux-pm-agent-test-project/time_entries`.

**Steps:**
1. In the same chat: "How much total time has been logged on the Crux PM Agent Test Project, and can you break it down by issue?"

**Expected Result:**
- 10.5h total, broken down across the 4 issues with logged time.

**Result: FAIL — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-058 (same fabricated-absence family as BUG-CRX-057, but a distinct, more severe failure).**

- Crux: *"No time entries logged. The Crux PM Agent Test Project has no recorded time entries — either no work has been logged yet, or time tracking is not enabled for this project."* Both halves false — the entries exist, and time tracking is plainly enabled (used all session). Unlike TC-CRX-201/202, the 4 real entries here span **both** Closed issues (#14/#15) **and** non-closed issues (#16/#18) — yet Crux found **zero** of either kind, worse than the partial under-count seen on issue-counting. Activity trail shows only "Checked 1 thing" — a single tool call, no retry, before confidently (and wrongly) speculating the feature itself might be disabled.

**Net finding across TC-CRX-201–203:** this session's analytics-question sweep surfaced a previously-untested but significant defect class — Crux's read/reporting path silently and confidently fabricates absence (zero issues, zero time) in multiple distinct query shapes whenever Closed-status data is involved, without ever disclosing the scope it actually checked. This is the same family as the already-known BUG-CRX-026/044 pattern but is the first evidence it also affects the Project Manager agent's core issue/time analytics, not just Scrum/Time agent summaries.

---

### TC-CRX-204: Project lifecycle CRUD — Reopen a closed project

**User Role:** `admin`.
**Precondition:** The `test` project (identifier `test`) is currently closed — set via TC-CRX-198 and left that way deliberately. Independently confirmed via `/projects?status=5` (closed-projects filter) before this TC ran.

**Steps:**
1. In a fresh Ask Crux chat: "Reopen the 'test' project — it's currently closed."

**Expected Result:**
- A genuine confirm card naming the real tool (`Core Set Project Closed`, with `Closed: False` — the same tool as TC-CRX-198's close action, just inverted), with real Confirm/Cancel buttons, and on confirm, the project genuinely becomes active again.

**Result: PASS on the core action (genuine confirm, genuine success, genuinely persisted); FAIL on message clarity — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-059.**

- Genuine confirm card: "I'll do this (Core Set Project Closed) — confirm?" with table Project=test / Closed=False, real Confirm/Cancel buttons.
- On Confirm: "✓ Reopened project 'test'." — and this time the ✓ is honest (unlike BUG-CRX-054's misleading-✓-on-failure finding from TC-CRX-198, since this action genuinely succeeded).
- Verified independently: `test` project now appears again in the default active-projects listing (`/projects`, default open-status filter) — confirms the reopen genuinely persisted, not just a chat-text claim.
- **FAIL (BUG-CRX-059), caught on review of the confirm-card screenshot**: the headline text — "I'll do this (Core Set Project Closed) — confirm?" — is **word-for-word identical** to TC-CRX-198's close-action headline. Only the detail table underneath (`Closed: True` in TC-198 vs `Closed: False` here) actually distinguishes close from reopen; the bold headline a user reads first gives no indication of direction, and for Reopen specifically reads as if the project is about to be closed, not reopened.
- This closes out the Close/Reopen pair of TC-CRX-198/204 — the underlying action is correct and genuine both directions, but the headline-clarity gap is a real, reproducible finding worth fixing. Still untested on the Project entity itself: Delete, Archive, Unarchive (see Evidence Map note).

---

### TC-CRX-205: Project lifecycle CRUD — Archive a project

**User Role:** `admin`.
**Precondition:** The `test` project is active (reopened via TC-CRX-204). Independently confirmed via `/admin/projects` default (active) filter before this TC ran — `test` listed, clickable.

**Steps:**
1. In a fresh Ask Crux chat: "Archive the 'test' project."
2. Review the confirm card for a genuine tool name, real detail table, and real Confirm/Cancel buttons (distinct from the fabricated-confirm pattern seen in BUG-CRX-056).
3. Confirm the action.
4. Independently verify via native UI: `/admin/projects` with Status filter set to "archived" (not just absence from the default/active view, which alone would be inconclusive).

**Expected Result:**
- Genuine confirm card naming a real archive-specific tool, with a real detail table and real Confirm/Cancel buttons.
- On confirm, a genuine success message, and the project becomes genuinely archived — confirmed by it appearing under the explicit "archived" status filter (not just missing from "active"), with its name no longer a clickable link (expected Redmine behavior for archived projects).

**Result: PASS — CONFIRMED LIVE 2026-10-10.**

- Genuine confirm card: "I'll do this (Core Archive Project) — confirm?" with table `Project: test`, real Confirm/Cancel buttons — correctly distinct tool name from the Close/Reopen tool (no repeat of BUG-CRX-059's headline-reuse issue here).
- On Confirm: "✓ Archived project 'test'."
- Verified independently: `/admin/projects` default (active) filter dropped from 3 projects to 2 (`test` no longer listed). Then explicitly set Status filter to "archived" and clicked Apply — `test` appears alone under that filter (`1-1/1`), rendered as plain text (not a link), matching Redmine's native behavior for archived projects (not independently accessible).
- No bug — this is the first Project-entity lifecycle action tested this session with a clean PASS on both the write path and the message clarity (no close/reopen-style headline ambiguity, since Archive and Unarchive use distinctly-named tools).

---

### TC-CRX-206: Project lifecycle CRUD — Unarchive a project

**User Role:** `admin`.
**Precondition:** The `test` project is archived (via TC-CRX-205). Independently confirmed via the "archived" status filter on `/admin/projects` before this TC ran.

**Steps:**
1. In a fresh Ask Crux chat: "Unarchive the 'test' project."
2. Review the confirm card for a genuine tool name, real detail table, and real Confirm/Cancel buttons.
3. Confirm the action.
4. Independently verify via native UI: `/admin/projects` default (active) filter shows `test` again as a clickable link.

**Expected Result:**
- Genuine confirm card naming a real unarchive-specific tool, with a real detail table and real Confirm/Cancel buttons.
- On confirm, a genuine success message, and the project becomes genuinely active again — confirmed via the default active-projects listing, not just the chat reply text.

**Result: PASS — CONFIRMED LIVE 2026-10-10.**

- Genuine confirm card: "I'll do this (Core Unarchive Project) — confirm?" with table `Project: test`, real Confirm/Cancel buttons.
- On Confirm: "✓ Unarchived project 'test'."
- Verified independently: navigated to `/admin/projects` (default active filter) — count back to `1-3/3`, with `test` listed again as a clickable link to `/projects/test`.
- No bug — clean PASS, same as TC-CRX-205. **Archive/Unarchive round-trip complete: both directions genuine confirm cards, genuine execution, genuine native-UI-independent verification, no message-clarity ambiguity (unlike the Close/Reopen pair's BUG-CRX-059).**

---

## Positive/Negative Cases — Project Settings → Members tab CRUD (admin tier)

> First coverage of the Members tab via chat, per explicit user request to test every Project Settings tab's CRUD, not just the Project tab. `luna.blossom` used as the test member throughout (already has her own fixture role history from TC-CRX-189-192's permission matrix, unrelated to this).

### TC-CRX-207: Members CRUD — Create (add a member)

**User Role:** `admin`.
**Precondition:** `luna.blossom` is not currently a member of "Crux PM Agent Test Project". Confirmed via `/projects/crux-pm-agent-test-project/settings/members` → "No data".

**Steps:**
1. In a fresh Ask Crux chat: "Add luna.blossom as a Developer to the Crux PM Agent Test Project."
2. If the reply stalls or cuts off, click "Ask again" once to check whether it's a one-off or reproducible.

**Expected Result:**
- A genuine confirm card proposing a real member-creation tool, with a detail table (project, user, role) and real Confirm/Cancel buttons.

**Result: FAIL, 2/2 reproduction — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-060 (High).**

- Attempt 1: reply cuts off mid-sentence — *"Great — the core group has 37 write tools. Let me load them to find the `create_project_membership` tool:(Stopped: this turn's token budget was reached...)"*
- Attempt 2 ("Ask again"): identical stall on a different sentence — *"Now let me load the core group write tools:(Stopped: this turn's token budget was reached...)"*
- crux-core log confirms both turns burn their entire per-turn budget (`tool_calls=7`, 6 LLM round-trips each) without ever reaching `create_project_membership` — only `list_projects`/`list_users` actually executed.
- Verified independently: Members tab still shows "No data" after both attempts — no stray write, but also zero usable outcome. The Members-tab Create path via chat is completely non-functional.

---

### TC-CRX-208: Members CRUD — Read (list members + roles)

**User Role:** `admin`.
**Precondition:** `luna.blossom` added as **Reporter** to "Crux PM Agent Test Project" via native UI (membership id=3) — required as a fixture since TC-CRX-207 proved Create via chat doesn't work.

**Steps:**
1. In a fresh Ask Crux chat: "Who are the members of the Crux PM Agent Test Project and what are their roles?"

**Expected Result:**
- Crux correctly reports Luna Blossom as a member with the Reporter role, matching the native UI exactly.

**Result: PASS — CONFIRMED LIVE 2026-10-10.**

- Crux: *"## Crux PM Agent Test Project Membership — **1 member assigned to the project:** | Member | Type | Role(s) | | Luna Blossom | User | Reporter |"* — exact match to native UI. No bug.

---

### TC-CRX-209: Members CRUD — Update (change a member's role)

**User Role:** `admin`.
**Precondition:** `luna.blossom` is Reporter on "Crux PM Agent Test Project" (membership id=3, from TC-CRX-208's fixture).

**Steps:**
1. In a fresh Ask Crux chat: "Change luna.blossom's role on the Crux PM Agent Test Project from Reporter to Developer."

**Expected Result:**
- Since the exact membership id and target role are both unambiguous, a genuine confirm card for `Core Update Project Membership` (or equivalent), with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-061 (High).**

- Crux's tool trace (crux-core log) shows it successfully called `list_users`, `list_projects`, `list_project_memberships` (resolving membership id=3), and `list_roles` (resolving Developer's role id) — i.e., it gathered everything the real `redmineflux_core_update_project_membership` tool needs.
- Then it replied: *"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."*
- Independently confirmed via MCP server source (`core.py:2129`) that `redmineflux_core_update_project_membership(membership_id, role_ids)` is fully implemented and registered — this is a **false capability denial**, not an honest architectural gap.
- Verified independently: `/memberships/3/edit` still shows "Reporter" — no write occurred, consistent with the refusal, but the refusal's stated reason is false.

---

### TC-CRX-210: Members CRUD — Delete (remove a member)

**User Role:** `admin`.
**Precondition:** `luna.blossom` is still Reporter on "Crux PM Agent Test Project" (membership id=3, role update blocked by BUG-CRX-061 above, so role is unchanged from TC-CRX-208).

**Steps:**
1. In a fresh Ask Crux chat: "Remove luna.blossom from the Crux PM Agent Test Project."

**Expected Result:**
- Since Crux can resolve the exact membership id, a genuine confirm card for `Core Delete Project Membership` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-10. New bug filed: BUG-CRX-062 (High).**

- Crux correctly found "Luna Blossom in the project as a Reporter (membership id=3)" — then stated: *"However, **removing a user from a project membership is not yet supported through this chat interface**. The available tools cover reading project memberships and creating new ones, but deletion of an existing membership requires direct Redmineflux admin access or a different interface."* — followed by manual native-UI steps.
- Independently confirmed via MCP source (`core.py:2156`) that `redmineflux_core_delete_project_membership` is fully implemented — this claim is false.
- The same reply is also wrong on its second half: it claims membership *creation* works via chat ("creating new ones"), directly contradicted by this session's own TC-CRX-207/BUG-CRX-060 finding that creation doesn't work either.
- Verified independently: Members tab still lists Luna Blossom as Reporter — no write occurred.

**Net finding across TC-CRX-207–210 (Members tab CRUD): 1/4 PASS (Read only). Create stalls on a token-budget ceiling (BUG-CRX-060); Update and Delete both get a confident but false "not available" denial despite the real tools existing and being one call away (BUG-CRX-061/062). The Members tab's entire write surface is non-functional via chat, for three distinct reasons.**

---

## Positive/Negative Cases — Project Settings → Issue tracking tab (admin tier)

### TC-CRX-211: Issue tracking tab — enable a tracker

**User Role:** `admin`.
**Precondition:** "Testcase" tracker is unchecked for "Crux PM Agent Test Project" (confirmed via `/projects/crux-pm-agent-test-project/settings/issues`).

**Steps:**
1. In a fresh Ask Crux chat: "Enable the Testcase tracker for the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card naming a real update tool, with a detail table and real Confirm/Cancel buttons.

**Result: FAIL — 4th reproduction of BUG-CRX-056, CONFIRMED LIVE 2026-10-10.**

- Identical fabricated "I'll create this issue — confirm?" text, no real Confirm/Cancel buttons, no table — under "Checked 3 things."
- Verified independently: `/projects/crux-pm-agent-test-project/settings/issues` — "Testcase" checkbox still unchecked.
- This confirms BUG-CRX-056 isn't scoped to the Project/Info sub-tab alone — the Issue tracking sub-tab's tracker list hits the exact same failure, since both map to the same underlying `update_project` write. No new bug filed; BUG-CRX-056 updated to 4/4 reproductions and its title/severity note broadened accordingly.

---

### TC-CRX-221: Issue tracking tab — remove a tracker (reverse direction of TC-CRX-211)

> Per explicit user clarification: the Issue tracking tab's tracker list is an include/exclude toggle on the project, not tracker creation — TC-CRX-211 only tested the include (enable) direction; this TC covers remove (exclude) to complete the pair, the same way Close/Reopen and Archive/Unarchive were each tested both directions earlier in this suite.

**User Role:** `admin`.
**Precondition:** "Support" tracker is enabled (checked) for "Crux PM Agent Test Project", alongside Bug and Feature — confirmed via `/projects/crux-pm-agent-test-project/settings/issues`.

**Steps:**
1. In a fresh Ask Crux chat: "Remove the Support tracker from the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card naming a real update tool, with a detail table and real Confirm/Cancel buttons.

**Result: FAIL — 6th reproduction of BUG-CRX-056, CONFIRMED LIVE 2026-10-11.**

- Identical fabricated "I'll create this issue — confirm?" text, no real Confirm/Cancel buttons, no table — under "Checked 2 things."
- Verified independently: `/projects/crux-pm-agent-test-project/settings/issues` — "Support" checkbox still checked.
- Combined with TC-CRX-211, this confirms the Issue tracking tab's tracker toggle fails identically in **both** directions (include and remove) — no new bug filed; BUG-CRX-056 updated to 6/6 reproductions.

---

### TC-CRX-224: Issue tracking tab — custom field enable + defaults (combined)

> Added per explicit user follow-up to finish the Issue tracking tab's remaining fields: custom-field enable/disable and default version/assignee/query.

**User Role:** `admin`.
**Precondition:** "Issue Category" custom field is unchecked; Default version and Default assignee are both "None" for "Crux PM Agent Test Project".

**Steps:**
1. In a fresh Ask Crux chat: "For the Crux PM Agent Test Project, enable the Issue Category custom field on issue tracking, set the default version to v2.0, and set the default assignee to admin."

**Expected Result:**
- A genuine confirm card for `Core Update Project` listing all 3 changes, with real Confirm/Cancel buttons.

**Result: FAIL — 7th reproduction of BUG-CRX-056, CONFIRMED LIVE 2026-10-11.**

- Identical fabricated "I'll create this issue — confirm?" text, no real Confirm/Cancel buttons, no table — under "Checked 5 things."
- Verified independently: "Issue Category" checkbox still unchecked, Default version still "None", Default assignee still "None". This completes coverage of every field on the Issue tracking sub-tab — no new bug filed; BUG-CRX-056 updated to 7/7 reproductions.

**Net finding across TC-CRX-211, 221, 224 (Issue tracking tab, every field): 0/3 PASS — trackers (both directions), custom fields, and defaults all fail identically via BUG-CRX-056. This sub-tab has zero functional write capability via chat.**

---

## Positive/Negative Cases — Project Settings → Versions tab CRUD (admin tier)

> Session note: partway through this sub-suite, `tools/list` was found returning only 95 tools (vs. the normal ~495) because `mcp-1` had started before Redmine was reachable that morning and never retried its plugin-detection pass — filed as **BUG-CRX-063**. `mcp-1` was restarted once Redmine was confirmed healthy (recovered to 498 tools, 13/14 plugins). TC-CRX-213's first attempt happened during the degraded window; it was deliberately re-run afterward (see its Result) once the catalog was confirmed healthy, to separate the two defects cleanly.

### TC-CRX-212: Versions CRUD — Read (list versions, statuses, due dates)

**User Role:** `admin`.
**Precondition:** 3 versions exist on "Crux PM Agent Test Project": v1.0 (closed, due 09/01/2026), v1.1 (locked, due 10/01/2026), v2.0 (open, due 12/01/2026).

**Steps:**
1. In a fresh Ask Crux chat: "What versions exist for the Crux PM Agent Test Project and what are their statuses and due dates?"

**Expected Result:**
- Accurate listing of all 3 versions with correct status and due date for each.

**Result: PASS — CONFIRMED LIVE 2026-10-11.**

- Crux: "1. v1.0 — closed, due 2026-09-01. 2. v1.1 — locked, due 2026-10-01. 3. v2.0 — open, due 2026-12-01." — verified via screenshot, exact match to native UI on all 3 versions/statuses/dates. (An accessibility-snapshot text dump initially made the dates look garbled, e.g. "2026-09-012" — a false alarm caused by ordered-list numbers gluing onto the preceding text in the a11y tree, not a real rendering bug; a full-page screenshot confirmed the actual displayed text is correct.) No bug.

---

### TC-CRX-213: Versions CRUD — Create

**User Role:** `admin`.
**Precondition:** No "v3.0" or "v4.0" version exists yet.

**Steps:**
1. In a fresh Ask Crux chat: "Create a new version called v3.0 for the Crux PM Agent Test Project, due date 2027-03-01."

**Expected Result:**
- A genuine confirm card naming a real version-creation tool, with a detail table and real Confirm/Cancel buttons.

**Result: FAIL, 2/2 reproduction — CONFIRMED LIVE 2026-10-10/11. Folded into BUG-CRX-061 (Repro 2 and Repro 5).**

- First attempt (2026-10-10, during the morning's since-fixed MCP degraded window — see session note above): *"I couldn't confirm whether this action is actually available here..."*, later followed in the same chat by an explicit *"Version creation is not in my available tools."* Confounded by BUG-CRX-063 at the time.
- Re-run the next day with a confirmed-healthy, freshly-restarted 495-tool MCP catalog (different version name, v4.0, to avoid any duplicate-name ambiguity): **identical** false denial text. This confirms the Create failure is a real, standalone defect independent of the degraded-MCP issue.
- Verified independently both times: native UI shows neither v3.0 nor v4.0 was ever created.

---

### TC-CRX-214: Versions CRUD — Update (change due date)

**User Role:** `admin`.
**Precondition:** v2.0 due date is 12/01/2026, confirmed via native UI. MCP freshly restarted and confirmed healthy (498 tools, 13/14 plugins) before this TC.

**Steps:**
1. In a fresh Ask Crux chat: "Change the due date of version v2.0 on the Crux PM Agent Test Project to 2027-06-01." (First reply was a transient "MCP session expired (404)" — expected right after the container restart; retried via "Ask again.")

**Expected Result:**
- Since the agent can resolve the exact version via its own List call, a genuine confirm card for `Core Update Version` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Folded into BUG-CRX-061 (Repro 3) — the decisive reproduction that rules out BUG-CRX-063 as the explanation.**

- Log confirms `tools=495`, successful `list_projects` and `list_versions` calls (so v2.0 was genuinely found), then the identical false denial text — `update_version` never called.
- Verified independently: v2.0's due date is still 12/01/2026, unchanged.

---

### TC-CRX-215: Versions CRUD — Delete

**User Role:** `admin`.
**Precondition:** Disposable fixture version "v9.9-delete-me" created via native UI. Same healthy MCP session as TC-CRX-214.

**Steps:**
1. In a fresh Ask Crux chat: "Delete version v9.9-delete-me from the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for `Core Delete Version` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 4).**

- Log confirms `tools=495`, successful `list_projects` and `list_versions` calls, then the identical false denial text — `delete_version` never called.
- Verified independently: "v9.9-delete-me" is still listed, unchanged.

**Net finding across TC-CRX-212–215 (Versions tab CRUD): 1/4 PASS (Read only) — same exact failure shape as the Members tab's Update/Delete (BUG-CRX-061), now also covering Create, confirmed under a known-healthy tool catalog so it can't be dismissed as an infra artifact.**

---

## Positive/Negative Cases — Project Settings → Issue categories tab CRUD (admin tier)

**Precondition for this sub-suite:** "Crux PM Agent Test Project" already has 13 pre-existing issue categories (a fixture set from earlier project creation — DevOps, Development ×7, Digital Marketing, Project Management ×2, UI/UX), confirmed via `/projects/crux-pm-agent-test-project/settings/categories`.

### TC-CRX-216: Issue categories CRUD — Create

**User Role:** `admin`.
**Precondition:** No "Security Testing" category exists.

**Steps:**
1. In a fresh Ask Crux chat: "Create a new issue category called 'Security Testing' for the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for `Core Create Issue Category` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Folded into BUG-CRX-061 (Repro 6) — a third entity domain for the same systemic defect.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, ending in the identical false denial text — `create_issue_category` never called despite being implemented (`core.py:1711`).
- Verified independently: no "Security Testing" category exists; the 13 pre-existing categories are unaffected.

---

### TC-CRX-217: Issue categories CRUD — Read

**User Role:** `admin`.

**Steps:**
1. In a fresh Ask Crux chat: "What issue categories exist for the Crux PM Agent Test Project?"

**Expected Result:**
- Accurate listing of all 13 existing categories.

**Result: PASS — CONFIRMED LIVE 2026-10-11.**

- Crux listed all 13 categories by exact name, matching native UI 1:1 (DevOps - Cloud and Server, Development ×7, Digital Marketing - SEO and SMO, Project Management ×2, UI/UX - Design & Prototype). No bug.

---

### TC-CRX-222: Issue categories CRUD — Update (rename)

> Added per explicit user follow-up asking whether category Update and Delete had been tested — they had not; only Create (TC-216) and Read (TC-217) were covered initially.

**User Role:** `admin`.
**Precondition:** Category "Development - Chrome Extention" exists (note the pre-existing typo in its name, part of the fixture set).

**Steps:**
1. In a fresh Ask Crux chat: "Rename the issue category 'Development - Chrome Extention' to 'Development - Chrome Extension' for the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for `Core Update Issue Category` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Folded into BUG-CRX-061 (Repro 8) — completing Create+Update coverage for this entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, ending in the identical false denial text — `update_issue_category` never called despite being implemented (`core.py:1741`).
- Verified independently: category name is still "Development - Chrome Extention" (typo intact) — unchanged.

---

### TC-CRX-223: Issue categories CRUD — Delete

**User Role:** `admin`.
**Precondition:** Disposable fixture category "zz-delete-me-category" created via native UI.

**Steps:**
1. In a fresh Ask Crux chat: "Delete the issue category 'zz-delete-me-category' from the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for `Core Delete Issue Category` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 9) — completes the full CRUD failure set for this entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, ending in the identical false denial text — `delete_issue_category` never called despite being implemented (`core.py:1776`).
- Verified independently: "zz-delete-me-category" is still listed — unchanged.

**Net finding across TC-CRX-216–217, 222–223 (Issue categories full CRUD): 1/4 PASS (Read only) — Create, Update, and Delete all fail identically with BUG-CRX-061's false denial. Issue Categories is now the only entity domain this session where every single CRUD operation has been independently tested and confirmed broken.**

---

## Positive/Negative Cases — Project Settings → Repositories tab (admin tier)

### TC-CRX-218: Repositories tab — attempt to add a repository link

**User Role:** `admin`.
**Precondition:** No MCP tool exists anywhere in the codebase for creating/managing a project's Repository entity (confirmed via source: only `redmineflux_devops_list_repositories`, a read-only DevOps-domain listing tool, exists — nothing for the Repositories project-settings sub-tab itself).

**Steps:**
1. In a fresh Ask Crux chat: "Add a repository link for the Crux PM Agent Test Project."
2. Crux asked a reasonable clarifying question (the repository URL), noting it would propose adding it to the project's homepage or a dedicated repository field if no native tool exists. Replied with a URL: `https://github.com/zehntech/crux-pm-test`.

**Expected Result:**
- Either a genuine confirm card (if some tool handles this) or an honest, clear refusal explaining no such capability exists.

**Result: FAIL — the clarifying-question step was reasonable, but the follow-through hit the same fabricated-confirm defect as BUG-CRX-056 (5th reproduction) rather than either a genuine confirm or an honest refusal.**

- Once given a URL, Crux silently decided to route the request through an `update_project` homepage-field write (a reasonable substitution choice) — but that path produces the identical fabricated "I'll create this issue — confirm?" text with no real buttons, same as every other `update_project`-shaped write this session.
- Verified independently: `/projects/crux-pm-agent-test-project/settings/info` Homepage field is still empty.
- Folded into BUG-CRX-056 rather than filed separately, since it's the same root defect (`update_project` write path), not a new one.

---

## Positive/Negative Cases — Project Settings → Forums tab (admin tier)

### TC-CRX-219: Forums tab — attempt to create a forum

**User Role:** `admin`.
**Precondition:** No MCP tool exists anywhere in the codebase for Redmine's Forums/message-boards entity (confirmed via source — zero `board`/`forum` tool definitions in any `tools/*.py` file).

**Steps:**
1. In a fresh Ask Crux chat: "Create a new forum called 'General Discussion' for the Crux PM Agent Test Project."

**Expected Result:**
- An honest, clear refusal, since this capability genuinely doesn't exist in the current tool catalog.

**Result: PASS — CONFIRMED LIVE 2026-10-11. This is the correct, honest behavior the false-denial bugs above should also be producing.**

- Crux: *"Forum creation doesn't appear in any of the discovered groups. The closest candidates would be: **helpdesk** (35 read, 42 write)..., **kb** (knowledge base...)..., **core** (31 read, 37 write)... To create a forum, you would likely need to: 1. Use the Redmineflux web UI directly (Administration → Forums...), or 2. Ask your Redmineflux admin..."* — transparent about which tool groups it checked, correctly concludes none fit, and suggests legitimate alternatives. No fabrication, no false "couldn't confirm available" denial.
- Verified independently: `/projects/crux-pm-agent-test-project/settings/boards` shows "No data" — no forum created, as expected (nothing should have been attempted).
- **This PASS is important context for BUG-CRX-061**: it proves Crux is capable of a correct, well-reasoned "genuinely not available" response — the false-denial pattern specifically affects entity types that *do* have real tools (Versions, Memberships, Issue Categories, Time Tracking Activities), which points to a resolution-logic defect rather than an intentional restriction.

---

## Positive/Negative Cases — Project Settings → Time tracking tab (admin tier)

### TC-CRX-220: Time tracking tab — disable an activity

**User Role:** `admin`.
**Precondition:** All 7 time-entry activities (Design, Development, Customer Call, Remote Support, Technical Support, Email Support, Live Chat Support) are enabled for "Crux PM Agent Test Project".

**Steps:**
1. In a fresh Ask Crux chat: "Disable the Design time-tracking activity for the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for the relevant update tool, with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Initially folded into BUG-CRX-061 as Repro 7, but see TC-CRX-225's correction below — this was later re-filed as its own issue, BUG-CRX-064.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, ending in the generic false-denial text.
- Verified independently: "Design" activity is still checked/enabled, unchanged.

**Net finding across TC-CRX-216–220 (Issue categories, Repositories, Forums, Time tracking): Issue categories Read and Forums PASS (2/5); Issue categories Create, the Repositories workaround, and Time tracking disable all FAIL — folded into the known systemic bugs (BUG-CRX-056 for `update_project`-shaped writes, BUG-CRX-061 for the generic false-denial pattern on existing tools) rather than new bugs, since each is a clean reproduction of an already-documented root cause on a new trigger path.**

**Approved Hours tab is explicitly deferred to the Budget Audit plugin's own QA scope per the user's standing instruction ("Approved hours ye plugin se related he isse ham bad me krnge") — not tested this session.**

---

### TC-CRX-225: Time tracking tab — enable an activity (reverse direction of TC-CRX-220, important correction)

**User Role:** `admin`.
**Precondition:** "Live Chat Support" activity disabled via native UI (Design/Development/Customer Call/Remote Support/Technical Support/Email Support left enabled).

**Steps:**
1. In a fresh Ask Crux chat: "Enable the Live Chat Support time-tracking activity for the Crux PM Agent Test Project."

**Expected Result:**
- Since TC-CRX-220's "disable" got a generic false denial, "enable" was expected to fail the same way.

**Result: Unexpected PASS (on honesty, not on capability) — CONFIRMED LIVE 2026-10-11, and it corrects TC-CRX-220's classification.**

- Crux gave a detailed, accurate, well-reasoned reply instead of the vague text TC-220 got: it named the real tool it has (`redmineflux_core_list_time_entry_activities`), correctly explained time-entry activities are a system-wide Redmine enumeration rather than a per-project setting, separated "what I can do" from "what requires manual action," and gave precise native-UI steps.
- **This forced a re-investigation of TC-CRX-220**: MCP source confirms no tool exists anywhere for toggling a project-level time-entry-activity override (only `list_time_entry_activities`/`get_activity` exist; `update_project`'s full parameter list has no activity field). So TC-220's "disable" failure was **not** a false denial of an existing tool like the other BUG-CRX-061 repros — the capability is genuinely absent in both directions. The real defect is that the *same* genuinely-missing capability gets a vague, misleading "try again" non-answer for one phrasing and a clear, honest explanation for the other.
- **Re-filed as a new, distinct bug: BUG-CRX-064** (Medium — no data-integrity impact, but a real user-facing inconsistency). TC-CRX-220's result above and BUG-CRX-061's Repro 7 were both corrected/annotated to reflect this reclassification rather than silently rewritten, so the investigation trail stays visible.
- No write occurred either way — native UI confirms "Live Chat Support" is still disabled.

---

## Positive/Negative Cases — Project overview tabs (Spent time, News, Documents, Wiki, Files, Gantt)

> Per explicit user request to cover every tab shown on the project navigation bar, not just Project Settings sub-tabs. Precondition for this sub-suite: "Crux PM Agent Test Project" has 4 existing time entries (10.5h total, the TC-CRX-201–203 fixture), 0 news posts, 0 documents, an empty wiki (no pages beyond the default home), and 0 uploaded files.

### TC-CRX-226: Spent time — Create (log time)

**User Role:** `admin`.

**Steps:**
1. In a fresh Ask Crux chat: "Log 2 hours of Development time on issue #16 in the Crux PM Agent Test Project, dated today, with a comment 'testing time log via chat'."

**Expected Result:**
- A genuine confirm card for `Core Log Time` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Folded into BUG-CRX-061 (Repro 10) — a 4th entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, ending in the identical false denial text (chip `#16`, confirming the issue was resolved).
- Verified independently: `/projects/crux-pm-agent-test-project/time_entries` still shows exactly 4 entries, 10.5h total — no new entry created.

---

### TC-CRX-227: Spent time — Update (edit a time entry's comment)

**User Role:** `admin`.
**Precondition:** Time entry #4 (1:30h, Design, issue #18) has an empty Comment field.

**Steps:**
1. In a fresh Ask Crux chat: "Change the comment on time entry #4 in the Crux PM Agent Test Project to 'updated via chat test'."

**Expected Result:**
- A genuine confirm card for `Core Update Time Entry` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 11).**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, same false denial text (chip `#4`).
- Verified independently: `/time_entries/4/edit` — Comment field still empty, Hours/Issue unchanged.

---

### TC-CRX-228: Spent time — Delete

**User Role:** `admin`.
**Precondition:** Disposable fixture time entry #5 (0:30h, Development, issue #16, comment "disposable fixture for delete test") created via native UI.

**Steps:**
1. In a fresh Ask Crux chat: "Delete time entry #5 from the Crux PM Agent Test Project."

**Expected Result:**
- A genuine confirm card for `Core Delete Time Entry` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 12) — completes the full CRUD failure set for this entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, same false denial text (chip `#5`).
- Verified independently: time entry #5 still listed, unchanged.

**Net finding across TC-CRX-226–228 (Spent time CRUD): 0/3 PASS on write — Create/Update/Delete all fail identically. Read was already confirmed working via TC-CRX-203's analytics question (though that one separately hit BUG-CRX-058's fabricated-absence defect on certain phrasings — a distinct issue from this one).**

---

### TC-CRX-268: Spent time — Log time, non-admin WITHOUT `log_time` permission

> First non-admin permission-matrix coverage of the Spent time domain — TC-CRX-226–228 above were admin-only. Added 2026-10-26 to close this specific coverage gap, raised directly by the user ("kya humne spent time log test kiya hai admin se, without/with permission?").

**User Role:** `luna.blossom` (Manager role on `Crux PM Agent Test Project`, `log_time` permission explicitly removed from the role — confirmed via exact-match DB check: `:log_time` absent from `roles.permissions`, only the unrelated `:log_time_for_other_users` remains).
**Precondition:** Fixture issue #1 ("Fixture issue for time-tracking permission TC") created on `Crux PM Agent Test Project`. This instance's global activity list doesn't include "Development" (only Customer Call/Remote Support/Technical Support/Email Support/Live Chat Support) — substituted "Technical Support" throughout.

**Steps:**
1. As `luna.blossom`, in a fresh Ask Crux chat (Project Manager agent): "Log 2 hours of Technical Support time on issue #1 in the Crux PM Agent Test Project, dated today, with a comment 'testing time log via chat'."

**Expected Result:**
- An honest, correctly-scoped permission refusal (she genuinely lacks `log_time`) — not a generic tool-discovery denial that gives no indication the real blocker is a missing permission.

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* — the same generic false-denial text as BUG-CRX-061's reworded family, not an honest "you lack the log_time permission" message. The agent never distinguishes "genuinely missing permission" from "can't find the tool at all."
- Independently verified via native UI (`/projects/crux-pm-agent-test-project/time_entries`): "No data" — no write occurred.
- Folded into **BUG-CRX-061** as a new entity-domain-non-admin-without-permission data point.

---

### TC-CRX-269: Spent time — Log time, non-admin WITH `log_time` permission

**User Role:** `luna.blossom`, same project, `log_time` permission then genuinely granted back on the Manager role (confirmed via exact-match DB check: `:log_time` now present).
**Precondition:** Same fixture issue #1, fresh chat session.

**Steps:**
1. Identical request, fresh chat, immediately after granting the permission: "Log 2 hours of Technical Support time on issue #1 in the Crux PM Agent Test Project, dated today, with a comment 'testing time log via chat'."

**Expected Result:**
- A genuine confirm card for `Core Log Time`, since the agent now has both the real tool and the real permission.

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"Time entry creation should be in the `core` group's write tools. Let me load those.(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — the exact per-turn token-budget stall shape, not the false-denial shape from TC-268. Granting the real permission changed the failure mode entirely rather than fixing anything.
- Independently verified via native UI: still "No data" — no write occurred either way.
- Folded into **BUG-CRX-060** as a new entity-domain-non-admin-with-permission data point.

**Net finding across TC-CRX-268–269: Spent time / log_time is now confirmed permission-independent, joining Members (BUG-CRX-060/062), Version (BUG-CRX-060/061), and Wiki (BUG-CRX-061) as entity domains where granting the specific relevant permission makes no difference to the outcome — it just shifts which of the two shared failure modes (false denial vs. token-budget stall) fires.**

---

### TC-CRX-270: Members CRUD — Create, non-admin WITHOUT `manage_members` permission

> Per explicit user follow-up asking whether every remaining admin-only domain (Members, Issue Categories, Versions Update/Delete, News, Documents, Files) had ever been tested non-admin with/without permission — it had not, only Create was spot-checked for Version/Wiki (TC-243/244). Systematically closing these gaps, domain by domain.

**User Role:** `luna.blossom` (Manager role on `Crux PM Agent Test Project`, `manage_members` explicitly removed — confirmed via exact-match DB check).
**Note:** first attempts named the target user by login ("daisy.skye", then "Redmine Admin") and both got sidetracked on an unrelated confound — `luna.blossom`'s `view_users` scope ("Members of visible projects") can't resolve a user outside her own shared projects, and `list_users`/search found nothing for either name. Re-sent with the exact login ("admin") to isolate the real target permission.

**Steps:**
1. As `luna.blossom`, in a fresh Ask Crux chat (Project Manager agent): "The login is "admin". Add them as a Reporter to the Crux PM Agent Test Project."

**Expected Result:**
- An honest refusal naming the missing `manage_members` permission, OR a genuine confirm card if the agent considers this a read-then-propose operation it can still attempt (then correctly refused server-side).

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"Let me check the actual group names:(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — the same per-turn token-budget stall as BUG-CRX-060, not an honest permission refusal.
- Independently verified via native UI (`/projects/crux-pm-agent-test-project/settings/members`, as admin): still only Luna Blossom listed — no "Redmine Admin" membership was created.
- Folded into **BUG-CRX-060** as a new non-admin-without-permission data point (previously only ever reproduced as admin for Members Create, TC-CRX-207).

---

### TC-CRX-271: Members CRUD — Create, non-admin WITH `manage_members` permission

**User Role:** `luna.blossom`, same project, `manage_members` then genuinely granted back (confirmed via exact-match DB check).

**Steps:**
1. Identical request, fresh chat, immediately after granting the permission: "The admin user's numeric ID is 1. Add them as a Reporter to the Crux PM Agent Test Project." (numeric ID given directly this time, having already established `view_users` is the real blocker on name resolution, not the target `manage_members` permission under test.)

**Expected Result:**
- A genuine confirm card for `Core Create Project Membership`.

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* — BUG-CRX-061's false-denial shape this time, a DIFFERENT failure mode than the "without permission" half (TC-270) hit, even though both are the identical underlying write attempt.
- Independently verified via native UI: still only Luna Blossom listed — no membership created either way.
- Folded into **BUG-CRX-061** as a new non-admin-with-permission data point.

**Net finding across TC-CRX-270–271: Members Create is now also confirmed permission-independent — and notably, the without/with halves hit *opposite* failure shapes compared to the Spent Time pair (TC-268/269 was without=denial, with=stall; this pair is without=stall, with=denial). This rules out any theory that one specific shape is reserved for "missing permission" and the other for "permission present" — which shape fires looks effectively non-deterministic per attempt, not keyed to the permission state at all.**

---

### TC-CRX-272: Issue Categories CRUD — Create, non-admin WITHOUT `manage_categories` permission

**User Role:** `luna.blossom` (Manager role, `manage_categories` explicitly removed — confirmed via exact-match DB check).

**Steps:**
1. In a fresh Ask Crux chat: "Create a new issue category called 'Permission Test Category' for the Crux PM Agent Test Project."

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"Good — the `core` group has 37 write tools. Let me load it to find the issue category creation tool.(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — BUG-CRX-060's stall shape.
- Independently verified via native UI (`/projects/crux-pm-agent-test-project/settings/categories`, as admin): still exactly the original 13 categories — no "Permission Test Category" created.
- Folded into **BUG-CRX-060** as a new non-admin-without-permission data point (Issue Categories had previously only ever been tested as admin, TC-CRX-216).

---

### TC-CRX-273: Issue Categories CRUD — Create, non-admin WITH `manage_categories` permission

**User Role:** `luna.blossom`, `manage_categories` then genuinely granted back (confirmed via exact-match DB check).

**Steps:**
1. Identical request, fresh chat: "Create a new issue category called 'Permission Test Category' for the Crux PM Agent Test Project."

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* — BUG-CRX-061's false-denial shape, the opposite of the "without" half (TC-272).
- Independently verified via native UI: still the original 13 categories, no write occurred either way.
- Folded into **BUG-CRX-061** as a new non-admin-with-permission data point.

**Net finding across TC-CRX-272–273: Issue Categories Create is also confirmed permission-independent, with the without/with halves again landing on opposite shapes (stall-then-denial, matching the Members pattern rather than the Spent Time pattern) — consistent with the shape being effectively random per attempt, not tied to permission state.**

---

### TC-CRX-274: News — Create, non-admin WITHOUT `manage_news` permission

**User Role:** `luna.blossom` (Manager role, `manage_news` explicitly removed — confirmed via exact-match DB check).

**Steps:**
1. In a fresh Ask Crux chat: "Create a news post in the Crux PM Agent Test Project titled 'Permission Test News' with the text 'Testing non-admin news create.'"

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."*
- Independently verified via native UI (`/projects/crux-pm-agent-test-project/news`): "No data" — no write occurred.
- Folded into **BUG-CRX-061** (News had previously only ever been tested as admin, TC-CRX-229).

---

### TC-CRX-275: News — Create, non-admin WITH `manage_news` permission

**User Role:** `luna.blossom`, `manage_news` then genuinely granted back (confirmed via exact-match DB check).

**Steps:**
1. Identical request, fresh chat.

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"News creation is not currently supported from this chat interface. The available tools on my list cover reading news items (list_news, get_news) but not creating them... This is a limitation of the current chat interface, not a permission issue."* — a 4th distinct wording of this false-denial family, and notably explicit (and wrong) about ruling out a permission cause, when `redmineflux_core_create_news` is confirmed to genuinely exist (`core.py:2885`, per BUG-CRX-061's Repro 13).
- Independently verified: still "No data", no write occurred either way.
- Folded into **BUG-CRX-061** as a new non-admin-with-permission data point.

**Net finding across TC-CRX-274–275: News Create is also permission-independent — both halves hit a false-denial text (not the token-budget stall), but with meaningfully different, sometimes self-contradictory wording (TC-275 explicitly denies a permission cause while asserting "not yet supported" for a tool that genuinely exists).**

---

### TC-CRX-276: Documents — Create, non-admin WITHOUT `add_documents` permission

**User Role:** `luna.blossom` (Manager role, `add_documents` explicitly removed — confirmed via exact-match DB check).

**Steps:**
1. In a fresh Ask Crux chat: "Create a document in the Crux PM Agent Test Project titled 'Permission Test Document' with description 'Testing non-admin document create.'"

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"Great. The core group has 37 write tools. Let me load those tools:(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — BUG-CRX-060's stall shape.
- Independently verified via native UI (`/projects/crux-pm-agent-test-project/documents`): "No data" — no write occurred.
- Folded into **BUG-CRX-060** (Documents had previously only ever been tested as admin, TC-CRX-230).

---

### TC-CRX-277: Documents — Create, non-admin WITH `add_documents` permission

**User Role:** `luna.blossom`, `add_documents` then genuinely granted back (confirmed via exact-match DB check).

**Steps:**
1. Identical request, fresh chat.

**Result: FAIL — CONFIRMED LIVE 2026-10-26.**

- Reply: *"I don't see a `create_document` tool in the discovered `core` group. The available document tools are `list_documents` and `get_document` (reads only). Document creation is not yet supported through the chat interface..."* — same false-capability-denial family as the News result, again contradicted by the real, genuinely-registered `redmineflux_core_create_document` tool (`core.py:3728`, per BUG-CRX-061's Repro 14).
- Independently verified: still "No data", no write occurred either way.
- Folded into **BUG-CRX-061** as a new non-admin-with-permission data point.

**Net finding across TC-CRX-276–277: Documents Create is also permission-independent, with the without/with halves landing on opposite shapes (stall-then-denial, same pattern as Members and Issue Categories).**

**Overall summary of this permission-matrix audit (TC-CRX-268–277, 2026-10-26): every entity domain checked — Spent Time, Members, Issue Categories, News, Documents — is confirmed permission-independent. 8 of 10 without/with pairs land on opposite shapes (stall↔denial); 2 of 10 (News) land on the same shape (denial↔denial) but with different wording each time. No domain tested shows the real permission making any difference to the outcome. Still NOT covered by this audit (deliberately deprioritized, flagged for a future session if wanted): Versions Update/Delete (only Create has a non-admin spot-check, TC-CRX-243), Files Read (now-fixed via BUG-CRX-065, lower priority since it's a read not a write), Time-tracking-activity toggle (BUG-CRX-064 — N/A, no tool exists at all regardless of permission), Gantt reschedule (uses the same `edit_issues` permission already exhaustively matrixed in TC-CRX-189-192), and the Closed/Archived-project issue CRUD matrix as non-admin (TC-CRX-234-238 are admin-only; combining project-state with permission-state multiplies the matrix considerably).**

---

### TC-CRX-229: News — Create

**User Role:** `admin`.
**Precondition:** No news posts exist for "Crux PM Agent Test Project".

**Steps:**
1. In a fresh Ask Crux chat: "Create a news post in the Crux PM Agent Test Project titled 'Sprint kickoff' with the text 'We are starting the new sprint today.'"

**Expected Result:**
- A genuine confirm card for `Core Create News` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. Folded into BUG-CRX-061 (Repro 13) — a 5th entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, same false denial text.
- Verified independently: `/projects/crux-pm-agent-test-project/news` shows "No data" — no post created.

---

### TC-CRX-230: Documents — Create

**User Role:** `admin`.
**Precondition:** No documents exist for "Crux PM Agent Test Project".

**Steps:**
1. In a fresh Ask Crux chat: "Create a document in the Crux PM Agent Test Project titled 'Project Charter' with description 'Initial scope document'."

**Expected Result:**
- A genuine confirm card for `Core Create Document` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 14) — a 6th entity domain.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, same false denial text.
- Verified independently: `/projects/crux-pm-agent-test-project/documents` shows "No data" — no document created.

---

### TC-CRX-231: Wiki — Create (retest of TC-CRX-187)

> TC-CRX-187 (2026-10-09) tried the identical request and got the same hedge text, but at the time the discovery mechanism's exact behavior "wasn't fully traceable" and the result was recorded as inconclusive. Retested now that the systemic false-denial pattern (BUG-CRX-061) is well-established, to get a definitive verdict.

**User Role:** `admin`.
**Precondition:** No wiki pages exist for "Crux PM Agent Test Project" beyond the default empty home.

**Steps:**
1. In a fresh Ask Crux chat: "Create a wiki page in the Crux PM Agent Test Project called 'Team Norms' with the text 'Be kind, ship often.'"

**Expected Result:**
- A genuine confirm card for `Core Create Or Update Wiki Page` with real Confirm/Cancel buttons.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under the same verified-healthy MCP. Folded into BUG-CRX-061 (Repro 15) — a 7th entity domain. Supersedes TC-CRX-187's inconclusive verdict.**

- Log confirms `tools=495`, `tool_calls=2 outcome=success`, same false denial text.
- Verified independently: `/projects/crux-pm-agent-test-project/wiki` shows only the default empty wiki-home editor — no "Team Norms" page exists.

---

### TC-CRX-232: Files — Read (list uploaded files)

**User Role:** `admin`.
**Precondition:** No files uploaded to "Crux PM Agent Test Project" (confirmed via `/projects/crux-pm-agent-test-project/files` — empty table).

**Steps:**
1. In a fresh Ask Crux chat: "What files are uploaded to the Crux PM Agent Test Project?"

**Expected Result:**
- A single call to `redmineflux_core_list_project_files` and a correct, honest "no files uploaded" answer.

**Result: FAIL — CONFIRMED LIVE 2026-10-11, under a verified-healthy 495-tool MCP. New bug filed: BUG-CRX-065 (High).**

- Crux burned **10 tool calls** (`list_projects`, `list_issues`, then `get_issue` ×8 — one per issue in the project, checking each individually for inline attachment data) and never once called `redmineflux_core_list_project_files` — the tool whose own docstring names this exact question as its use case.
- Final answer falsely claimed: *"the core Redmineflux tools available to me don't have a dedicated endpoint to list ALL project-level attachments..."* — false, confirmed via MCP source.
- Verified independently: `/projects/crux-pm-agent-test-project/files` genuinely has zero files — the correct, cheap, one-call answer (`list_project_files` would have returned "No files found") was available the whole time.
- **Note on Files — Create**: `redmineflux_core_create_project_file` requires a `token` from a prior `redmineflux_core_upload_file` call (i.e. real file bytes) — not achievable from a plain chat text message without a file-attach mechanism in the Ask Crux UI, so Create/Update/Delete on this domain weren't tested this session; Read was the only operation practically testable via chat alone.

---

### TC-CRX-233: Gantt — Reschedule an issue's dates

**User Role:** `admin`.
**Precondition:** Issue #16 has Start Date 10/10/2026, no Due Date set.

**Steps:**
1. In a fresh Ask Crux chat: "Reschedule issue #16 in the Crux PM Agent Test Project to start 2026-11-01 and due 2026-11-10 using the Gantt tool."
2. Confirm the resulting card.
3. Independently verify via `/issues/16` and the Gantt view.

**Expected Result:**
- A genuine confirm card with real Issue/Start Date/Due Date fields and real Confirm/Cancel buttons, and on confirm, the issue's dates genuinely change.

**Result: PASS — CONFIRMED LIVE 2026-10-11.**

- Genuine confirm card: "I'll change #16 — confirm?" with a real table (`Issue: #16`, `Start Date: 2026-11-01`, `Due Date: 2026-11-10`) and real Confirm/Cancel buttons — labeled "Update issue / Change #16" (resolved via the standard `update_issue` tool's date fields rather than a dedicated Gantt-specific tool, but functionally correct either way).
- On Confirm: "✓ #16 updated: Start Date: 2026-11-01, Due Date: 2026-11-10."
- Verified independently: `/issues/16` now shows Start Date 11/01/2026, Due Date 11/10/2026 (Due in 30 days) — genuinely persisted, not just a chat-text claim.
- No bug — clean PASS. This is a useful positive contrast alongside TC-CRX-205/206 (Archive/Unarchive) and TC-CRX-219 (Forums honest refusal): the write-proposal pipeline clearly *can* work correctly for some entity types/tools, which continues to support BUG-CRX-061 being a resolution-logic defect scoped to specific tools, not a platform-wide outage.

**Net finding across TC-CRX-226–233 (project overview tabs): 1/8 PASS (Gantt only). Spent time, News, Documents, and Wiki all fail identically via BUG-CRX-061 (now spanning 7 entity domains total); Files-Read hits a new, distinct false-denial bug (BUG-CRX-065, 10 wasted tool calls); Files-Create/Update/Delete weren't testable via chat text alone.**

---

## Positive/Negative Cases — Closed/archived project write-matrix (Update/Delete, plus a second Create repro on archived)

> Prompted by an explicit user follow-up asking whether Update/Create/Delete had been checked against both a **closed** and an **archived** project — until this sweep, only closed-project Create had been tested (TC-CRX-198). This section fills the remaining 5 cells of the 2×3 (closed/archived × Create/Update/Delete) matrix, using `Crux PM Agent Test Project` (identifier `crux-pm-agent-test-project`) as a second throwaway fixture so `test` (already left closed by TC-CRX-198) didn't need disturbing.

### TC-CRX-234: Closed-project write matrix — Update an issue in a closed project

**User Role:** `admin`.
**Precondition:** `Crux PM Agent Test Project` closed via Ask Crux ("Close the Crux PM Agent Test Project.") — genuine confirm card, genuine "✓ Closed project 'crux-pm-agent-test-project'." success. Issue #16 exists in the project from earlier session seeding.

**Steps:**
1. In a fresh Ask Crux chat: "Rename issue #16 to 'Closed project update test'."
2. Review the confirm card for a genuine tool name, real detail table, and real Confirm/Cancel buttons.
3. Confirm the action.
4. Observe the resulting chat bubble's icon and text together (specifically checking for the misleading-✓ pattern already found on closed-project Create, BUG-CRX-054).

**Expected Result:**
- Since the project is closed, the update should genuinely fail at the Redmine permission layer, and the failure should be rendered honestly — no checkmark on a failure message.

**Result: PASS (genuine confirm, genuine honest failure, no misleading icon) — CONFIRMED LIVE 2026-10-11.**

- Genuine update confirm card shown before any write.
- On Confirm, final bubble reads (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_update_issue' failed: Error executing tool redmineflux_core_update_issue: You do not have permission to update issue #16. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"*
- No bug — this is the **first honest failure rendering** found on a closed-project write this session, in direct contrast to Create's misleading ✓ on the identical trigger condition (BUG-CRX-054). Confirms the misleading-checkmark defect is isolated to Create's error path, not shared by Update's.

---

### TC-CRX-235: Closed-project write matrix — Delete an issue in a closed project

**User Role:** `admin`.
**Precondition:** Same closed `Crux PM Agent Test Project` as TC-CRX-234. Issue #16 still exists (the TC-CRX-234 update genuinely failed, so no rename took effect).

**Steps:**
1. In the same or a fresh Ask Crux chat: "Delete issue #16 from project crux-pm-agent-test-project."
2. Crux first asks a plain-text safety confirmation (delete-specific extra gate, distinct from the standard write-confirm card) — reply "Yes, confirm."
3. Review the resulting genuine confirm card (real tool name "Core Delete Issue", real table, real Confirm/Cancel buttons).
4. Confirm the action.
5. Observe the resulting chat bubble's icon and text together.

**Expected Result:**
- Delete should genuinely fail at the Redmine permission layer (same as Update), rendered honestly with no misleading checkmark.

**Result: PASS (genuine two-step confirm, genuine honest failure, no misleading icon) — CONFIRMED LIVE 2026-10-11.**

- Plain-text delete safety question shown first, as expected for any delete (irreversibility warning), distinct from and in addition to the standard write-confirm card.
- Genuine "Core Delete Issue" confirm card shown next, with a real Issue=16 table and real Confirm/Cancel buttons.
- On Confirm, final bubble reads (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_delete_issue' failed: Error executing tool redmineflux_core_delete_issue: You do not have permission to delete issue #16."* (same role/permission guidance as TC-CRX-234).
- No bug — Delete's failure path on a closed project is also honestly rendered, matching Update (TC-CRX-234) and contrasting with Create (BUG-CRX-054).

---

### TC-CRX-236: Archived-project write matrix — Create an issue in an archived project (BUG-CRX-054, Repro 2)

**User Role:** `admin`.
**Precondition:** `Crux PM Agent Test Project` archived via Ask Crux. Since the project was already closed (not in Crux's active-project list), the first archive attempt got an honest "I don't see a project named..." response rather than a fabrication — resolved by explicitly supplying "It's closed right now, identifier crux-pm-agent-test-project. Archive it anyway.", after which Crux produced a genuine archive confirm card ("Core Archive Project") and, on confirm, "✓ Archived project 'crux-pm-agent-test-project'." Independently verified via `/admin/projects?status=9` (archived-status filter) — listed, name not a clickable link.

**Steps:**
1. In a fresh Ask Crux chat: "Create an issue in the crux-pm-agent-test-project project called 'Archived project create test'."
2. Review the confirm card for a genuine tool name, real detail table, and real Confirm/Cancel buttons.
3. Confirm the action.
4. Observe the resulting chat bubble's icon and text together.
5. Independently verify via native UI that archived is more restrictive than closed: `/issues/16` as admin.

**Expected Result:**
- The create should genuinely fail (archived is more restrictive than closed), and the failure should be rendered honestly — no misleading checkmark.

**Result: FAIL — CONFIRMED LIVE 2026-10-11. Same bug as TC-CRX-198: BUG-CRX-054, now 2/2 reproductions.**

- Genuine create-issue confirm card shown before any write (real tool, real table, real Confirm/Cancel) — no fabricated-confirm issue here.
- On Confirm, final bubble reads: **✓** *"Project 'crux-pm-agent-test-project' not found or you don't have permission to create issues in it. Use list_projects to find valid project IDs/identifiers."* — **word-for-word identical template** to BUG-CRX-054's original closed-project finding (TC-CRX-198), just a different project identifier. The leading ✓ is the same misleading success glyph on a genuine failure.
- Independently verified archived is strictly more restrictive than closed: `/issues/16` as admin returns a genuine native **403 Forbidden** — a closed project's issues remain viewable (only writes blocked), but an archived project blocks even admin reads.
- Not a new bug — folded into BUG-CRX-054 as Repro 2, since the exact same error-rendering code path fires regardless of *why* the project is inaccessible (closed vs. archived). Bug file, `bugs/_index.md`, and `bugs/_duplicates.md` updated to reflect 2/2.

---

### TC-CRX-237: Archived-project write matrix — Update an issue in an archived project

**User Role:** `admin`.
**Precondition:** Same archived `Crux PM Agent Test Project` as TC-CRX-236. Issue #16 still resolvable by ID despite the project being archived (Crux's own project-level lookup is what fails in TC-CRX-236, not issue-ID resolution).

**Steps:**
1. In a fresh Ask Crux chat: "Rename issue #16 to 'Archived project update test'."
2. Review the confirm card for a genuine tool name, real detail table, and real Confirm/Cancel buttons.
3. Confirm the action.
4. Observe the resulting chat bubble's icon and text together.

**Expected Result:**
- Same as the closed-project case (TC-CRX-234): genuine honest failure, no misleading checkmark.

**Result: PASS (genuine confirm, genuine honest failure, no misleading icon) — CONFIRMED LIVE 2026-10-11.**

- Genuine update confirm card shown before any write.
- On Confirm, final bubble reads (red failure text, no checkmark) — same wording pattern as TC-CRX-234's closed-project Update failure: permission-denied on issue #16, with the same administrator-guidance footer.
- No bug — confirms Update's honest-failure rendering holds for archived projects too, not just closed ones. BUG-CRX-054 remains isolated to Create.

---

### TC-CRX-238: Archived-project write matrix — Delete an issue in an archived project

**User Role:** `admin`.
**Precondition:** Same archived `Crux PM Agent Test Project` as TC-CRX-236/237. Issue #16 still exists (TC-CRX-237's rename genuinely failed).

**Steps:**
1. In a fresh Ask Crux chat: "Delete issue #16 from project crux-pm-agent-test-project."
2. Crux first asks the plain-text delete safety confirmation — reply "Yes, confirm."
3. Review the resulting genuine "Core Delete Issue" confirm card.
4. Confirm the action.
5. Observe the resulting chat bubble's icon and text together.

**Expected Result:**
- Same as the closed-project case (TC-CRX-235): genuine honest failure, no misleading checkmark.

**Result: PASS (genuine two-step confirm, genuine honest failure, no misleading icon) — CONFIRMED LIVE 2026-10-11.**

- Plain-text delete safety question shown first, same as TC-CRX-235.
- Genuine "Core Delete Issue" confirm card shown next, real Issue=16 table, real Confirm/Cancel buttons.
- On Confirm, final bubble reads (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_delete_issue' failed: Error executing tool redmineflux_core_delete_issue: You do not have permission to delete issue #16."* — identical wording to TC-CRX-235's closed-project Delete failure.
- No bug — Delete's honest-failure rendering holds for archived projects too. **Closed/archived × Create/Update/Delete matrix now fully covered: Create fails with a misleading ✓ on both trigger states (BUG-CRX-054, 2/2); Update and Delete fail honestly on both trigger states (4/4 clean, no bug).**
- **Cleanup:** `Crux PM Agent Test Project` was restored to active state immediately after this TC — unarchived via native UI (`/admin/projects?status=9` → Actions → Unarchive, since Crux's own project list couldn't resolve a closed-then-archived project by name for a reopen request) and reopened via Ask Crux ("Reopen the Crux PM Agent Test Project... It is currently closed." → genuine "Core Set Project Closed" / Closed=False confirm card → "✓ Reopened project 'crux-pm-agent-test-project'."). Independently verified back in the default active-projects listing (`/admin/projects`, count `1-3/3`) before ending this sweep.

---

## Non-Admin Cases — Project entity itself (close_project / delete_project permissions)

> Extends the `luna.blossom` incremental permission matrix (TC-CRX-189–192, which covered issue-level permissions only) to the **project entity's own** lifecycle/destructive actions. Fills a gap explicitly called out as "still pending" across multiple prior Evidence Map notes: **Project entity Delete had never been tested at all, by admin or non-admin, until this pair of TCs.** Uses a dedicated throwaway project (`Crux PM Non-Admin Lifecycle Test`, identifier `crux-pm-nonadmin-lifecycle-test`) created specifically for this so no shared fixture is disturbed — this project is consumed (deleted) by TC-CRX-240, so it does not persist.

### TC-CRX-239: Non-admin project lifecycle — `close_project` permission, without

**User Role:** `luna.blossom`.
**Precondition:** New throwaway project `Crux PM Non-Admin Lifecycle Test` (identifier `crux-pm-nonadmin-lifecycle-test`) created via native UI; `luna.blossom` added as a member with the Manager role (same role used in TC-CRX-189–192, which by this point already has full issue CRUD granted — irrelevant here since this TC tests project-level permissions, a separate permission set). Confirmed via Rails console: `allowed_to?(:close_project, project)` → `false`, `allowed_to?(:delete_project, project)` → `false`, `allowed_to?(:edit_project, project)` → `false`.

**Steps:**
1. In a fresh Ask Crux chat: "Close the 'Crux PM Non-Admin Lifecycle Test' project."
2. Crux resolves the project and asks a plain confirmation question (not the destructive-delete-specific safety gate, since Close is reversible) — reply "Yes, close it."
3. Review the resulting genuine confirm card (real tool name "Core Set Project Closed", real table Project/Closed=True, real Confirm/Cancel).
4. Confirm the action.
5. Observe the resulting chat bubble's icon and text together.

**Expected Result:**
- Since `close_project` is not granted, the write should genuinely fail at Redmine's real permission layer, rendered honestly (no misleading checkmark) — consistent with the Update/Delete-shaped honest-failure pattern already established on issues (TC-234/235/237/238) and should extend to the Project entity's own writes too.

**Result: PASS (genuine confirm, genuine honest failure, no misleading icon) — CONFIRMED LIVE 2026-10-11.**

- Crux correctly resolved the project by name, asked a reasonable pre-confirmation question, then produced a genuine "Core Set Project Closed" confirm card (Project="Crux PM Non-Admin Lifecycle Test", Closed=True, real Confirm/Cancel).
- On Confirm, final bubble reads (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_set_project_closed' failed: Error executing tool redmineflux_core_set_project_closed: You do not have permission to update project 'crux-pm-nonadmin-lifecycle-test'. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"*
- No bug — confirms the honest-failure pattern (already seen on issue Update/Delete) also holds for a Project-entity-level write (`set_project_closed`), using the exact same `update_project`-shaped error template wording as the issue-level denials.
- Not retested "with" `close_project` granted — the project was consumed by TC-CRX-240's delete (with-permission success already independently established 5 times over on issue-level permissions in TC-189–192, so the marginal value of a 6th repro was judged lower priority than completing the Delete gap below, given a tight remaining OpenRouter weekly budget).

---

### TC-CRX-240: Non-admin project lifecycle — `delete_project` permission, without and with (fills the "Project entity Delete — never tested" gap)

**User Role:** `luna.blossom`.
**Precondition:** Same throwaway project as TC-CRX-239 (still active — TC-239's close attempt genuinely failed). `delete_project` not yet granted — confirmed `false` via Rails console.

**Steps:**
1. **WITHOUT** `delete_project`: in the same chat, "Delete the 'Crux PM Non-Admin Lifecycle Test' project." → Crux reasonably notices a pending close proposal from TC-239 and asks for disambiguation (cancel the close and delete instead, or keep the close) → reply "Cancel the close, delete it permanently instead." → review the resulting genuine "Core Delete Project" confirm card → confirm → record the result.
2. Grant `delete_project` on the Manager role (top-level checkbox only — confirmed via Rails this permission is NOT per-tracker-scoped, unlike the 5 issue-level permissions found in TC-189). Verify via `allowed_to?`.
3. **WITH** `delete_project`: ask the identical request again → review the confirm card → confirm → record the result → independently verify via native UI that the project is genuinely gone (`404`).

**Expected Result:**
- Without: genuine confirm card, then an honest failure at Redmine's real permission layer (no misleading checkmark) — matching the Project-entity Update pattern from TC-239.
- With: issue — rather, project — genuinely deleted after confirm, independently verified via a native `404` on the project's own URL, not just the chat's own claim. This is a destructive, named-record delete, matching the Hard Limits rule.

**Result: PASS on both halves — CONFIRMED LIVE 2026-10-11. The Project-entity Delete gap (flagged as "still pending" across several prior sessions) is now closed.**

- **Step 1 (without `delete_project`) — genuine confirm card, honest FAIL, no bug.** Crux's disambiguation question was a reasonable, context-aware touch (correctly remembered the still-pending Close proposal from the prior turn and asked which action to actually take, rather than silently picking one). The resulting "Core Delete Project" confirm card was genuine (Project="Crux PM Non-Admin Lifecycle Test", real Confirm/Cancel). On Confirm, final bubble read (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_delete_project' failed: Error executing tool redmineflux_core_delete_project: You do not have permission to delete project 'crux-pm-nonadmin-lifecycle-test'. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — same honest-failure template family as every other Update/Delete-shaped denial this session.
- **Step 2 (grant) — no per-tracker grid gotcha this time.** `close_project`/`delete_project` are plain top-level checkboxes with no lower per-tracker grid equivalent (confirmed via Rails: `Redmine::AccessControl` lists them as ordinary project-scoped permissions, not part of the 5-permission tracker-scoped set found in TC-189). Checked "Delete the project" on the Manager role, saved, verified `allowed_to?(:delete_project, project)` → `true`.
- **Step 3 (with `delete_project`) — PASS.** Identical request in the same chat → genuine confirm card again, confirmed → **"✓ Deleted project 'crux-pm-nonadmin-lifecycle-test'."** — genuine success. Independently verified: `/projects/crux-pm-nonadmin-lifecycle-test` now returns a genuine native `404 Not Found` — the project is truly gone, not just claimed gone in chat text.
- **No bug.** Both halves clean — the Project entity's own Update (`close_project`, TC-239) and Delete (`delete_project`, this TC) honest-failure/genuine-success pattern matches the issue-level pattern exactly. **Project-entity CRUD status is now fully complete across every dimension tested this suite**: Create ❌ (BUG-CRX-054, 3/3, on `create_issue` — note this is Issue Create, not Project Create; see TC-CRX-241 below for the Project entity's own Create), Read ✅, Update ✅ (honest on permission denial, closed, and archived triggers), Close/Reopen ✅, Archive/Unarchive ✅, **Delete ✅ (genuinely tested for the first time, both halves clean)**.

---

## Non-Admin Cases — Project entity's own Create and Update (`add_project`, `edit_project`)

> Per explicit user follow-up asking whether Project **Create** and general field **Update** had also been tested non-admin without/with permission (only `close_project`/`delete_project` had been covered in TC-239–240; Create had only ever been tested as admin, TC-184; general field Update had only been tested as admin and already found broken there via BUG-CRX-056).

### TC-CRX-241: Non-admin project lifecycle — `add_project` permission (global), without and with

**User Role:** `luna.blossom`.
**Precondition:** Manager role confirmed via Rails to have `add_project` (a global permission, not project-scoped) set to `false`.

**Steps:**
1. **WITHOUT** `add_project`: in a fresh Ask Crux chat: "Create a new project called 'Luna Permission Test Project'." → review the confirm card → confirm → record the result.
2. Grant `add_project` on the Manager role (top-level "Create project" checkbox — confirmed via Rails this permission is NOT part of the per-tracker-scoped set found in TC-189, same as `close_project`/`delete_project`). Verify via `allowed_to?(:add_project, nil, global: true)`.
3. **WITH** `add_project`: ask the identical request again → review the confirm card → confirm → record the result → independently verify via native UI.

**Expected Result:**
- Without: a genuine confirm card (project creation doesn't need a pre-existing project context to propose), then an honest failure at Redmine's real permission layer when confirmed.
- With: project genuinely created, verified via a real native page load (not just the chat's own claim).

**Result: PASS on both halves — CONFIRMED LIVE 2026-10-12.**

- **Step 1 (without `add_project`) — genuine confirm card, honest FAIL, no bug.** Crux produced a real "Create project" confirm card (Name="Luna Permission Test Project", Identifier auto-derived as "luna-permission-test-project", real Confirm/Cancel). On Confirm, final bubble read (red failure text, no checkmark): *"write failed: tool 'redmineflux_core_create_project' failed: Error executing tool redmineflux_core_create_project: You do not have permission to create or submit project. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — independently verified nothing was created (`/projects/luna-permission-test-project` → native `404`).
- **Step 2 (grant) — no per-tracker grid gotcha, same as `close_project`/`delete_project`.** Checked "Create project" top-level checkbox on the Manager role, saved. Verified via Rails (`allowed_to?(:add_project, nil, global: true)` → `true`) before re-testing.
- **Step 3 (with `add_project`) — PASS.** Identical request, fresh chat → genuine confirm card again, confirmed → **"✓ Created project"** with a real link to `luna-permission-test-project`. Independently verified: the URL loads a genuine native Overview page. Also confirmed via Rails that Redmine auto-added `luna.blossom` as a member of her own newly-created project (standard Redmine behavior, not Crux-specific) — but notably still **without** `edit_project` on it, setting up a clean precondition for TC-CRX-242.
- **No bug.** Project Create's honest-failure/genuine-success pattern for non-admin matches every other Project-entity permission tested this suite (`close_project`, `delete_project`) — the already-known misleading-✓ defect (BUG-CRX-054) is specific to `create_issue`, and does not extend to `create_project`.

---

### TC-CRX-242: Non-admin project lifecycle — `edit_project` permission (field update), without AND with (confirms BUG-CRX-056 fires regardless of permission state)

**User Role:** `luna.blossom`.
**Precondition:** `luna.blossom` is a member of her own "Luna Permission Test Project" (auto-added on creation, TC-241) but does NOT have `edit_project` on it — confirmed via Rails (`allowed_to?(:edit_project, project)` → `false`).

**Steps:**
1. **WITHOUT** `edit_project`: in a fresh Ask Crux chat: "Set the description of the Luna Permission Test Project to 'Updated via chat permission test'." → observe the result.
2. Independently verify via native UI whether the description actually changed.
3. Grant `edit_project` on the Manager role (top-level "Edit project" checkbox — confirmed via Rails this is NOT part of the per-tracker-scoped permission set found in TC-189). Verify via `allowed_to?(:edit_project, project)`.
4. **WITH** `edit_project`: ask the identical request again, same chat → observe the result.
5. Independently verify via native UI whether the description changed this time.

**Expected Result:**
- Without `edit_project`: should genuinely fail at Redmine's permission layer with an honest refusal, consistent with the Update-permission pattern already established for `close_project`/`delete_project`/issue-level permissions.
- With `edit_project`: if the underlying write path genuinely works, the description should be genuinely set.

**Result: Both halves confirm BUG-CRX-056 fires unconditionally — permission state makes no difference at all. Not a new bug; this is a definitive scope-extension finding for an already-tracked one.**

- **Step 1 (without `edit_project`)** — the request never reached a genuine permission check at all: Crux produced the fabricated **"I'll create this issue — confirm?"** text (no real Confirm/Cancel buttons, no detail table) already documented for every `update_project`-shaped write on this suite (BUG-CRX-056, 7/7 reproductions as admin) — the first reproduction of BUG-CRX-056 as a non-admin user.
- **Step 2** — independently verified nothing changed: `/projects/luna-permission-test-project` Overview shows no description; `/projects/luna-permission-test-project/settings/info` as `luna.blossom` correctly 403s (she can't view Settings without `edit_project`, consistent with Redmine's own access rules).
- **Step 3 (grant)** — no per-tracker grid gotcha, same as `close_project`/`delete_project`/`add_project`. Checked "Edit project" top-level checkbox, saved. Verified via Rails (`allowed_to?(:edit_project, project)` → `true`).
- **Step 4 (with `edit_project`)** — **the identical fabricated "I'll create this issue — confirm?" text appeared again, word-for-word**, still no real Confirm/Cancel buttons, still no detail table. Granting the permission made zero observable difference to the agent's behavior — it never got far enough in its own reasoning to even reach a point where a permission check would matter.
- **Step 5** — independently verified via native UI (now accessible to `luna.blossom`, since she has `edit_project`): `/projects/luna-permission-test-project/settings/info`'s Description field is still genuinely empty (checked via DOM evaluation of the form field's value) — confirms no silent write occurred even with full permission.
- **This is the most direct, decisive evidence yet that BUG-CRX-056 is a pure write-proposal-pipeline defect, completely unrelated to Redmine's permission system** — not a permission-dependent bug that happens to also fail for non-admins, but a defect that fires identically for admin, non-admin-without-permission, and non-admin-with-permission alike. **A genuine "honest refusal when permission is missing" test is structurally impossible for this write path** until BUG-CRX-056 itself is fixed — there is no permission state that reaches far enough into the real tool-call path to be checked. Bug file (`BUG-CRX-056.md`) updated with this as a new, decisive repro.
- **Project-entity CRUD × non-admin matrix is now as complete as it can be given the two known upstream bugs**: Create ✅ (TC-241, clean both halves), Close ✅ (TC-239), Delete ✅ (TC-240), Update — confirmed blocked by BUG-CRX-056 for every user and every permission state (TC-242, both halves tested, not a gap in test coverage).

---

## Non-Admin Spot-Checks — other entity domains (Versions, Wiki), without and with permission

> Per explicit user follow-up asking whether the remaining entity domains (Members, Versions, Issue Categories, Time Entries, News, Documents, Wiki — all already confirmed broken for admin via BUG-CRX-060/061/062) should also be tested non-admin without/with permission. Rather than exhaustively re-running all ~11 permission combinations across 7 domains (each already known to fail as admin regardless), 2 representative spot-checks were run to confirm whether the same permission-independence pattern just proven for BUG-CRX-056 (TC-242) also holds for BUG-CRX-060's and BUG-CRX-061's failure shapes: **Versions** (a single-permission domain, `manage_versions`) and **Wiki** (`edit_wiki_pages`). Both run on the same dedicated throwaway project as TC-241/242 ("Luna Permission Test Project").

### TC-CRX-243: Non-admin spot-check — Version create (`manage_versions`), without and with

**User Role:** `luna.blossom`.
**Precondition:** `manage_versions` confirmed `false` via Rails before Step 1; granted and reconfirmed `true` via Rails before Step 3.

**Steps:**
1. **WITHOUT** `manage_versions`: in a fresh Ask Crux chat: "Create a new version called v1.0 for the Luna Permission Test Project, due date 2027-01-01." → observe the result, retry via "Ask again" if it stalls.
2. Independently verify via native UI (`/projects/luna-permission-test-project/settings/versions`) whether anything was created.
3. Grant `manage_versions` on the Manager role. Verify via `allowed_to?`.
4. **WITH** `manage_versions`: identical request, fresh chat → observe the result, retry via "Ask again" if it stalls.
5. Independently verify again via native UI.

**Expected Result:**
- Given admin already gets BUG-CRX-061's quick false-denial for this exact request (`CRUX_AGENT_PROJECT_MANAGER.md`'s earlier Version-create repros), the baseline expectation was the same quick false denial for non-admin too, regardless of permission.

**Result: Both halves stall instead (4/4 total) — a DIFFERENT failure shape than expected, extends BUG-CRX-060 to a new entity domain, not BUG-CRX-061 as predicted.**

- **Step 1 (without, attempt 1)** — stalled mid-sentence: *"Good — the `core` group has 37 write tools. Let me load them.(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — the exact same symptom shape as BUG-CRX-060 (originally found on Members Create), not BUG-CRX-061's quick false denial that admin gets for this identical request.
- **Step 1 (without, attempt 2, "Ask again")** — stalled again, different sentence, same outcome: *"Now let me load the core group's 37 write tools.(Stopped...)"* — 2/2 without permission.
- **Step 2** — independently verified: `/projects/luna-permission-test-project/settings/versions` → "No data", nothing created.
- **Step 3 (grant)** — no per-tracker grid gotcha (same as the other project/version-level permissions tested this suite). Verified via Rails `allowed_to?(:manage_versions, project)` → `true`.
- **Step 4 (with, attempt 1)** — stalled again: *"Now let me load the core group tools to access version creation.(Stopped...)"*
- **Step 4 (with, attempt 2, "Ask again")** — stalled a 4th time: *"Let me get the full group list first:(Stopped...)"* — 2/2 with permission, 4/4 total across both states.
- **Step 5** — independently verified: still "No data" on the native Versions settings page.
- **Significant finding, not a new bug — extends BUG-CRX-060's scope.** BUG-CRX-060 was originally found and scoped to Members Create only. This proves the identical token-budget-exhaustion-during-tool-discovery symptom also fires for Version Create when the caller is non-admin — and, notably, **the SAME request gets a completely different failure shape depending on who's asking**: admin gets BUG-CRX-061's quick 1-2-tool-call false denial (per this suite's earlier admin-tier Version-create repros), while non-admin burns the entire turn budget on tool discovery before ever reaching either a real tool call or a false-denial conclusion. This suggests non-admin requests carry additional permission-scoping/context overhead in the agent's own reasoning that pushes otherwise-already-broken requests over the token budget entirely — a plausible root-cause link between BUG-CRX-060 and BUG-CRX-061 worth flagging to the dev team. Confirmed permission-independent (4/4, both states) — same conclusion as TC-242's BUG-CRX-056 finding, different bug.

---

### TC-CRX-244: Non-admin spot-check — Wiki page create (`edit_wiki_pages`), without and with

**User Role:** `luna.blossom`.
**Precondition:** `edit_wiki_pages` confirmed `false` via Rails before Step 1; granted and reconfirmed `true` via Rails before Step 3.

**Steps:**
1. **WITHOUT** `edit_wiki_pages`: in a fresh Ask Crux chat: "Create a wiki page in the Luna Permission Test Project called 'Team Norms' with the text 'Be kind, ship often.'" → observe the result.
2. Independently verify via native UI (`/projects/luna-permission-test-project/wiki`, as admin — `luna.blossom` herself 403s on the wiki index without the separate `view_wiki_pages` permission, an unrelated and correctly-behaving Redmine access rule) whether anything was created.
3. Grant `edit_wiki_pages` on the Manager role. Verify via `allowed_to?`.
4. **WITH** `edit_wiki_pages`: identical request, fresh chat → observe the result.
5. Independently verify again via native UI (as admin).

**Expected Result:**
- Consistent with admin's own Wiki-create repro (BUG-CRX-061 Repro 15), expected the same quick false-denial text regardless of permission state.

**Result: PASS on the expectation — BUG-CRX-061's false denial confirmed permission-independent, 2/2.**

- **Step 1 (without)** — Crux replied: *"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."* — the exact BUG-CRX-061 text, matching admin's own Wiki-create repro exactly.
- **Step 2** — independently verified (as admin, since `luna.blossom` can't view the wiki index without `view_wiki_pages`): no "Team Norms" page exists.
- **Step 3 (grant)** — verified via Rails `allowed_to?(:edit_wiki_pages, project)` → `true`.
- **Step 4 (with)** — **the identical false-denial text appeared again, word-for-word**, despite the real permission now genuinely present.
- **Step 5** — independently verified (as admin): still no "Team Norms" page.
- **Not a new bug — confirms BUG-CRX-061 is also permission-independent, same conclusion as BUG-CRX-056's decisive TC-242 finding.** Granting `edit_wiki_pages` made zero observable difference, same as Versions (TC-243) and Project Update (TC-242). **Together, TC-242/243/244 establish a pattern across 3 separate bugs (BUG-CRX-056, 060, 061) and 3 entity domains (Project, Version, Wiki): none of this suite's write-pipeline defects are permission-dependent — they all fire identically regardless of what the calling user is or isn't allowed to do, strongly suggesting a single shared upstream defect in how the write-proposal pipeline resolves a request to a tool, before any permission check is ever reached.** Given this, the remaining ~9 untested permission combinations (Members, Issue Categories, Time Entries, News, Documents — each already confirmed broken for admin via BUG-CRX-060/061/062) are very unlikely to produce new signal if spot-checked the same way — not pursued further on this basis.

---

## Real-User-Prompt & Tabular-Format Audit — Calendar, Issues, Spent Time (2026-10-26)

> Per explicit user request: test with casual, real-user-style phrasing (not clean/structured prompts), and separately check whether list-shaped answers (issues with assignees, spent time entries) render as an actual table or plain text. Fixture: 3 real issues on `Crux PM Agent Test Project` (#1 unassigned, start 10/26; #2 "Fix login page styling" assigned Luna Blossom, start 10/26, due 10/30; #3 "Write release notes for v1.1" assigned Redmine Admin, start 10/26, due 11/05), 2 real time entries (3h Redmine Admin on #1, 1.5h Luna Blossom on #2), Approved Hours (40h, "Development - Web Application - Backend") + matching Issue Category set on #1/#2 as the documented precondition for `log_time` to actually persist.

### TC-CRX-278: Calendar tab — "what's coming up this month" (never tested before this session)

**User Role:** `admin`.

**Steps:**
1. In a fresh Ask Crux chat, casual phrasing: "what's coming up on the calendar for the crux pm agent test project this month?"
2. Independently check the native Calendar view (`/projects/crux-pm-agent-test-project/issues/calendar`) for ground truth.

**Expected Result:**
- Issue #2's real due date (10/30) falls in the current month and should be surfaced; Redmine's Calendar plots any issue with a start/due date in the shown month, with no dependency on versions/milestones.

**Result: FAIL — CONFIRMED LIVE 2026-10-26. New bug filed: BUG-CRX-075.**

- Reply: *"The Crux PM Agent Test Project has no versions (milestones) defined yet. There's nothing on the calendar for this month—or any month—until you create some versions and assign issues to them."* — confidently, specifically wrong on both the underlying mechanism (versions have nothing to do with the Calendar) and the actual data (independently confirmed via native UI that all 3 issues genuinely show this month — day 26 for all 3 start dates, day 30 again for #2's due date).
- See `bugs/open/BUG-CRX-075.md` for full evidence.

---

### TC-CRX-279: Issues overview — real-user "who's working on what" phrasing silently drops assignees

**User Role:** `admin`.

**Steps:**
1. Casual phrasing, fresh chat: "hey who's working on what right now in the crux pm agent test project?"
2. Same chat, explicit follow-up: "and who's each one assigned to?"
3. Same chat, second follow-up: "can you show that as a table please"

**Expected Result:**
- Since the question itself asks "who," the first reply should name each issue's assignee (or "unassigned").

**Result: FAIL (first reply) — CONFIRMED LIVE 2026-10-26. New bug filed: BUG-CRX-074.**

- First reply lists all 3 issues by number/title/status/priority but never mentions assignees at all — not even "unassigned."
- Second reply (explicit follow-up) correctly resolves all 3 real assignees (`#1 → unassigned`, `#2 → Luna Blossom`, `#3 → Redmine Admin`) — proving the data was available the whole time.
- Third follow-up ("show that as a table") correctly rendered a genuine HTML table with `Issue | Title | Assignee` columns — table rendering works when explicitly asked, but is never used by default for this question shape, even though the underlying data (3 records × 3 fields) is naturally tabular.
- See `bugs/open/BUG-CRX-074.md` for full evidence.

---

### TC-CRX-280: Spent Time overview — real-user "how much time has everyone logged" phrasing

**User Role:** `admin`.
**Precondition:** 2 real time entries exist this session (3h Redmine Admin/#1, 1.5h Luna Blossom/#2) — see audit intro above for the Approved-Hours+Category setup this required.

**Steps:**
1. Casual phrasing, fresh chat: "how much time has everyone logged on the crux pm agent test project so far?"

**Expected Result:**
- A correct per-person breakdown totaling 4.5h.

**Result: PASS — CONFIRMED LIVE 2026-10-26, no bug.**

- Reply correctly states "Total time logged: 4.5 hours," breaks it down accurately per person (`Luna Blossom: 1.5 hours on #2`, `Redmine Admin: 3.0 hours on #1`, including the real comment text), and correctly notes both are from today. This is the identical question shape BUG-CRX-058 was originally filed against (and already closed/fixed) — **confirmed still fixed** with real multi-person data this session.
- Tabular-format note: rendered as a plain bullet list in this attempt. A separate live spot-check of the same question (run directly by the user, not part of this TC's own transcript) got a genuine HTML table by default (`Date | Hours | Issue | User | Comment` columns, with a correct `4.5h total` footer row) for the identical underlying data. This confirms table-vs-list formatting is non-deterministic per attempt for this question shape too, consistent with TC-CRX-279's finding — not filed as its own bug (no correctness impact), but documented in `BUG-CRX-074.md`'s evidence section since it's the same underlying formatting inconsistency.

**Net finding across TC-CRX-278–280: 2 new bugs found via real-user-style (not clean/structured) prompts — BUG-CRX-074 (Issues "who" silently dropped) and BUG-CRX-075 (Calendar false "no versions = nothing" claim). Calendar had literally never been tested via chat before this session. Spent Time's previously-fixed BUG-CRX-058 is confirmed still fixed. Table rendering is confirmed non-deterministic across both Issues and Spent Time question shapes — present in some attempts, absent in others, for the identical question and identical underlying data.**

---

## Closing the remaining CRUD gaps — News/Documents/Wiki Update+Delete (admin, 2026-10-26)

> Per explicit user follow-up: close the remaining admin-tier CRUD gaps — News/Documents/Wiki had previously only ever had Create tested (TC-229/230/231). All phrased casually, real-user style.

### TC-CRX-281: News — Update (admin)

**User Role:** `admin`. **Precondition:** real news post "Sprint kickoff" created via native UI (chat Create is already known-broken, BUG-CRX-061 Repro 13).

**Steps:** "can you update the 'Sprint kickoff' news post in crux pm agent test project, change the text to say the sprint actually starts tomorrow"

**Result: FAIL — stalled on BUG-CRX-060's token-budget shape** (*"Good — the `core` group has write tools. Let me load them:(Stopped...)"*). Verified via native UI: post text unchanged. Folded into **BUG-CRX-060** as a new entity domain.

---

### TC-CRX-282: News — Delete (admin)

**User Role:** `admin`, same fixture post.

**Steps:** "can you delete that sprint kickoff news post in crux pm agent test project, we don't need it anymore"

**Result: FAIL — stalled identically** (*"Let me check the available groups again:(Stopped...)"*). Verified via native UI: post still present. Folded into **BUG-CRX-060**.

---

### TC-CRX-283: Documents — Update (admin)

**User Role:** `admin`. **Precondition:** real document "Project Charter" created via native UI — this required first creating a Document Category enumeration, since the fresh instance had none at all (a real environment-setup gap, not a Crux bug, now documented in `CRUX_MEMORY.md`).

**Steps:** "quick thing - can you rename the project charter doc in crux pm agent test project to 'Project Charter v2'?"

**Result: FAIL — 3 distinct wrong behaviors across attempts, documented fully in BUG-CRX-076:**
1. First attempt never considered Documents as the entity at all — searched the project's issues for a "project charter" issue/attachment instead, despite the user's own word "doc."
2. "Ask again" stalled on BUG-CRX-060's shape while still chasing the wrong (issue-attachment) theory.
3. A more explicit rephrasing ("in the Documents tab... there's a document called 'Project Charter'") got a confident false claim that *"The Documents module isn't enabled for the Crux PM Agent Test Project"* — independently confirmed FALSE via DOM inspection (`#project_enabled_module_names_documents` is genuinely `checked`).

Verified via native UI: document untouched throughout. **New bug filed: BUG-CRX-076.**

---

### TC-CRX-284: Documents — Delete (admin)

**User Role:** `admin`, same fixture document.

**Steps:** "can you delete the 'Project Charter' document from crux pm agent test project? it's outdated"

**Result: FAIL — identical false "Documents module isn't enabled" claim**, with full (incorrect) step-by-step instructions to enable it. Verified via native UI: document still present. Folded into **BUG-CRX-076**.

---

### TC-CRX-285: Wiki — Update (admin)

**User Role:** `admin`. **Precondition:** real wiki page "Team Norms" created via native UI (content: "Be kind, ship often.").

**Steps:** "hey can you add a line to the team norms wiki page on crux pm agent test project saying 'review PRs within 24 hours'?"

**Result: FAIL — stalled on BUG-CRX-060's shape** (*"Let me list the actual available groups:(Stopped...)"*). Verified via native UI (`/wiki/Team_Norms/history`): still only 1 revision, content unchanged. Folded into **BUG-CRX-060** as a new entity domain (Wiki previously only had Create tested, TC-231/244).

---

### TC-CRX-286: Wiki — Delete (admin)

**User Role:** `admin`, same fixture page.

**Steps:** "can you remove the team norms wiki page from crux pm agent test project, we don't need it anymore"

**Result: FAIL — false denial** (*"I couldn't find a tool for this here, so I can't do it from this chat..."*) — confirmed FALSE via source grep, `redmineflux_core_delete_wiki_page` genuinely exists (`core.py:2817`). Verified via native UI: page still exists. Folded into **BUG-CRX-061** as a new entity domain (Wiki Delete).

**Net finding across TC-CRX-281–286: News, Documents, and Wiki now all have their full CRUD set (Create/Update/Delete) independently confirmed broken, joining Members, Issue Categories, and Time Entries as entity domains where every write operation fails. Documents (TC-283/284) additionally surfaced a new, distinct bug (BUG-CRX-076) — a confident false "module isn't enabled" claim, plus a failure to even recognize "document" as the right entity type on the first attempt, a resolution failure one level earlier than this suite's usual "found the right tool, falsely denied it" pattern.**

---

## Evidence Map

- LLM-key blocker resolved 2026-10-09 — see header note. TC-CRX-177–182, 195–225 executed and recorded inline above. TC-CRX-183–187 executed earlier. This session also executed TC-CRX-188 (zero-permission control, aurora.wren — PASS), TC-CRX-193–194 (administration-boundary — PASS on core safety), and TC-CRX-198 (project close lifecycle — PASS on close, 2 bugs found). **TC-CRX-199, TC-CRX-200, TC-CRX-211, TC-CRX-218, TC-CRX-221, TC-CRX-224 all FAILED — same bug, BUG-CRX-056, now Critical, 7/7 reproduction** (field update, plugin-module enable, core-module disable, tracker enable, a Repositories-tab request resolved to a homepage-field write, tracker remove, and the Issue tracking tab's remaining fields — custom-field enable + default version/assignee, combined — every `update_project`-shaped write tried has produced the identical fabricated "I'll create this issue — confirm?" text with no real Confirm/Cancel button; the Issue tracking sub-tab's entire field set is now covered and fails identically). **TC-CRX-201 and TC-CRX-202 both FAILED — BUG-CRX-057, now Critical** (issue-count/listing questions silently exclude Closed issues, 3/3 reproduction incl. a whole-project type breakdown). **TC-CRX-203 FAILED — BUG-CRX-058, Critical** (time-spent question falsely claims zero entries + wrongly speculates time tracking is disabled, despite 10.5h of real logged time spanning open AND closed issues). **TC-CRX-204 PASS on the core action, FAIL on message clarity — BUG-CRX-059** (Reopen's confirm-card headline is word-for-word identical to Close's). **TC-CRX-205 and TC-CRX-206 both PASS, no bugs** (Archive and Unarchive, correctly distinct tool names, genuine execution, native-UI-independent verification). **TC-CRX-209, 213, 214, 215, 216, 222, 223 all FAILED with the same generic false denial — BUG-CRX-061, now Critical, 8/8 reproduction across 3 entity domains with confirmed genuinely-existing tools** (Membership role-update, Version create/update/delete, Issue Category create/update/delete — TC-213 contributes 2 of the 8 repros, a first confounded attempt and a later clean retry), **6 of the 8 confirmed under a freshly-restarted, verified-healthy 495-tool MCP catalog** (TC-CRX-207 and TC-CRX-210 are explicitly NOT part of this bucket — they got different, distinctly-worded failures, BUG-CRX-060 and BUG-CRX-062 respectively, as their own TC write-ups describe) — ruling out the morning's separately-filed MCP degraded-state issue (**BUG-CRX-063**, also found and fixed this session: the MCP server never retries its plugin-detection pass after a slow Redmine boot, silently serving only 98/498 tools for 0/14 plugins until manually restarted) as the explanation. **Issue Categories is now the first entity domain with its entire CRUD set (Create/Update/Delete) independently confirmed broken** — per explicit user follow-up asking whether category Update/Delete had been tested (they had not initially; only Create and Read were covered in the first pass). **TC-CRX-210 (Members Delete) got an even sharper, unhedged false "not yet supported" claim — BUG-CRX-062** — which also wrongly asserted Create works, contradicted by BUG-CRX-060 (Members Create stalling on a per-turn token-budget ceiling, 2/2, never reaching a confirm card). **TC-CRX-220 (Time tracking "disable") was initially filed as BUG-CRX-061's Repro 7, then corrected after TC-CRX-225 (Time tracking "enable," the reverse direction) got a completely different, detailed, honest reply for the same genuinely-nonexistent capability** — MCP source confirmed no project-level activity-toggle tool exists at all, so TC-220's failure wasn't a false denial of a real tool like the other BUG-CRX-061 repros; **re-filed as its own new bug, BUG-CRX-064** (Medium — same missing capability gets a vague "try again" non-answer in one phrasing and a correct detailed explanation in the other). **TC-CRX-208, 212, 217, 219 all PASS** — Read operations (Members, Versions, Issue Categories) all matched native UI exactly, and the Forums-tab request (TC-219) got a genuinely honest, well-reasoned refusal (names the tool groups checked, correctly concludes none fit, suggests native UI/admin) — proving Crux *can* produce a correct "truly not available" response, which argues BUG-CRX-061's false denials are a resolution-logic defect, not a deliberate restriction. **Project-entity CRUD status after this session**: Create ✅, Read ✅, Update ❌ (BUG-CRX-056), Close ✅, Reopen ✅ (message-clarity bug noted), Archive ✅, Unarchive ✅, Delete — untested as of this point in the session (later closed by TC-CRX-240, see below). **Project Settings sub-tab CRUD status, now complete except Approved Hours**: Members (1/4 PASS — Read only), Issue tracking (every field tested — trackers, custom fields, defaults — all FAIL, BUG-CRX-056, 7/7 repro), Versions (1/4 PASS — Read only), Issue categories (1/4 PASS — Read only, full CRUD confirmed broken), Repositories (FAILs via BUG-CRX-056's homepage substitution), Forums (PASS — honest refusal), Time tracking (disable gets a vague non-answer, enable gets a detailed honest one — BUG-CRX-064; the underlying per-project activity toggle genuinely doesn't exist either way), Approved Hours (explicitly deferred to Budget Audit plugin's own scope, not tested). **TC-CRX-189–192 (the luna.blossom incremental permission matrix) completed 2026-10-11** — see its own bullet below. **Project entity Delete also completed 2026-10-11 — see TC-CRX-239–240's bullet.**
- **Session extended further into the project's overview tabs** (Spent time, News, Documents, Wiki, Files, Gantt — per explicit user request to cover every tab on the project nav bar, not just Project Settings). **TC-CRX-226–228 (Spent time CRUD): 0/3 PASS on write** — Create (`log_time`), Update, and Delete all fail identically, folded into **BUG-CRX-061 as Repros 10-12**, making Time Entries the second entity domain (after Issue Categories) with its entire write surface confirmed broken. **TC-CRX-229 (News create), TC-CRX-230 (Documents create), and TC-CRX-231 (Wiki create, a retest of the earlier-inconclusive TC-CRX-187) all FAILED identically — folded into BUG-CRX-061 as Repros 13-15**, bringing the bug to **15/15 reproductions across 7 entity domains** (Membership, Version, Issue Category, Time Entry, News, Document, Wiki) — effectively every "list-then-write" entity type tried this session has failed via this one shared defect. **TC-CRX-232 (Files — list uploaded files) surfaced a new, distinct bug: BUG-CRX-065** — Crux burned **10 tool calls** (fetching all 8 project issues individually looking for attachments) without ever calling `redmineflux_core_list_project_files`, the tool purpose-built for exactly this question, then falsely claimed no such capability exists; the real, cheap, one-call answer ("no files uploaded," confirmed via native UI) was available the whole time — a read-path false denial, distinct from BUG-CRX-061's write-path pattern, and unusually costly before giving up. **TC-CRX-233 (Gantt — reschedule an issue's dates) PASSED cleanly** — genuine confirm card, genuine execution, genuinely persisted dates — an important positive data point alongside Archive/Unarchive and the Forums honest-refusal, confirming the write pipeline *can* work correctly for some tools. **Files Create/Update/Delete weren't testable via chat text alone** (the real tool requires a `token` from a prior file-upload call, i.e. actual file bytes, which plain chat text can't provide). **2 new/updated bugs this extension: BUG-CRX-061 (grown from 9 to 15 reproductions across 3 new domains) and BUG-CRX-065 (new)** — none yet reported to production.
- **Closed/archived project write-matrix sweep (2026-10-11), prompted by explicit user follow-up** ("did we check Update/Create/Delete by closing/archiving the project?"): **TC-CRX-234–238 cover the remaining 5 cells of the 2×3 (closed/archived × Create/Update/Delete) matrix**, using `Crux PM Agent Test Project` as a second throwaway fixture. **TC-CRX-236 (archived + Create) FAILED — folded into BUG-CRX-054 as Repro 2** (word-for-word identical misleading-✓-on-failure template as the original closed-project finding, TC-CRX-198, just a different project identifier — confirms the defect is a shared Create error-rendering path triggered by any non-active project state, not closed-specific). **TC-CRX-234, 235, 237, 238 (closed+Update, closed+Delete, archived+Update, archived+Delete) all PASSED clean, no bug** — all 4 render genuine confirm cards and then **honest, correctly-styled red failure text with no checkmark** on the inevitable permission-denied result, in direct contrast to Create's misleading ✓ on the identical trigger conditions. This is a useful scoping result: the misleading-checkmark defect (BUG-CRX-054) is isolated to `create_issue`'s specific error-rendering code, not a platform-wide issue affecting every write tool's failure path. Also independently confirmed archived is strictly more restrictive than closed: a closed project's issues remain viewable by admin (only writes blocked), while an archived project returns a genuine native 403 Forbidden on any page, reads included. **Project-entity CRUD status, closed/archived dimension now fully covered**: Create ❌ (BUG-CRX-054, 2/2 — closed and archived), Update ✅ (honest failure, both states), Delete ✅ (honest failure, both states). `Crux PM Agent Test Project` was restored to active (unarchive via native UI, reopen via Ask Crux) before ending this sweep — independently verified back in the default active listing.
- **TC-CRX-189–192 — the `luna.blossom` incremental non-admin permission matrix, completed 2026-10-11** (first non-admin testing this suite had done; everything before this was admin-tier). Each of `view_issues`/`add_issues`/`edit_issues`/`delete_issues` tested WITHOUT then WITH, cumulatively, on the Manager role (baseline: only `view_crux`/`use_ask_crux`/`approve_crux_gates`). **All 8 halves (4 permissions × before/after) behaved correctly** — every "without" half was an honest, correctly-scoped refusal (a plain chat-level denial for `view_issues`, genuine confirm-card-then-honest-red-failure for the 3 write permissions), and every "with" half was a genuine, independently-verified success (native UI re-checked after every single step, never trusting chat text alone). **One significant new finding: TC-190's "without `add_issues`" step reproduced BUG-CRX-054 (misleading ✓ on a genuine Create failure) for a 3rd time — and this repro is the most important one yet**, since `crux-qa` is a completely normal active project with no lifecycle-state restriction at all; the only failure cause is a plain missing permission. This proves the defect isn't scoped to "project is closed/archived" (Repro 1/2) but to Create's shared error-rendering path for ANY failure reason — bug file, `_index.md`, `_duplicates.md` all updated to 3/3. **A significant environment-setup gotcha was also found and documented** (`CRUX_MEMORY.md`): Redmine 6 scopes `view_issues`/`add_issues`/`edit_issues`/`add_issue_notes`/`delete_issues` through a SECOND, separate per-tracker permission grid further down the role edit page — checking the simple top-level checkbox alone leaves the permission at zero effective trackers (silently still blocking, even though `allowed_to?` alone misleadingly reports `true`). Lost roughly 20 minutes chasing this as a suspected Crux bug (genuine native-UI 403 despite a "granted" permission) before root-causing it via `Issue.visible_condition` SQL inspection — worth any future session reading the memory note first to avoid repeating the loss. **Role state intentionally left granted** (Manager role on `crux-qa` now has all 4 permissions, not reverted to baseline) since no further TC currently depends on the stripped state.
- Screenshots: `screenshots/TC-CRX-<NNN>/` per CLAUDE.md §6 (bug evidence only) — this session's bug screenshots are filed under `screenshots/BUG-CRX-<NNN>/` instead, per the bug template's own convention. TC-CRX-205/206/208/212/217/219/233/234/235/237/238/189/191/192 are clean PASSes with no bug, so per §6 no screenshots were taken for them (TC-189/191/192 did capture a bug-adjacent screenshot only for the TC-190 Create failure, since that's the actual bug). TC-CRX-236's screenshot filed as `screenshots/BUG-CRX-054/misleading-checkmark-on-failure-archived-project.png`; TC-CRX-190's as `screenshots/BUG-CRX-054/misleading-checkmark-on-failure-permission-denial.png`.
- **TC-CRX-239–240 — Project entity's own lifecycle/destructive permissions (`close_project`, `delete_project`), tested non-admin, 2026-10-11.** Extends the issue-level permission matrix (TC-189–192) to the Project entity itself, using a dedicated throwaway project. **Both PASS, no new bug**: `close_project` without → genuine confirm card, honest red failure (no checkmark); `delete_project` without → same honest-failure pattern, with → genuine confirm card, confirmed, **"✓ Deleted project..."**, independently verified via a real native 404. **This closes the single most-repeated "still pending" item across this suite's Evidence Map history: Project entity Delete had never been tested by anyone, admin or non-admin, until now.** Also confirmed `close_project`/`delete_project` are ordinary top-level-checkbox permissions with no per-tracker grid equivalent (unlike the 5 issue-level permissions from TC-189's finding) — one less thing to trip over in future role setup.
- **TC-CRX-241–242 — Project entity's own Create and Update (`add_project`, `edit_project`), tested non-admin, 2026-10-12.** Per explicit user follow-up asking whether Project Create/Update (not just Close/Delete, TC-239–240) had been checked non-admin, and a direct follow-up question ("after giving permission have you tested?") that caught an un-tested assumption and triggered the decisive half below. **TC-241 (Create) PASS on both halves, no bug** — honest refusal without `add_project`, genuine create-and-verify with it; confirms BUG-CRX-054's misleading-✓ defect is specific to `create_issue` and does not extend to `create_project`. **TC-242 (Update) — both without AND with `edit_project` tested, both produce the identical fabricated BUG-CRX-056 text.** Granting the permission made zero observable difference; independently verified via DOM-level field inspection that the description genuinely never changed either time. **This is the most decisive repro of BUG-CRX-056 yet** — definitive proof it's a pure write-proposal-pipeline defect with no dependency on Redmine's permission system at all, not merely "also fails for non-admin." A genuine honest-refusal test for this write path is structurally impossible until BUG-CRX-056 itself is fixed. **This completes the Project-entity CRUD × non-admin matrix** as far as the two known upstream bugs (BUG-CRX-054 on Create-issue, BUG-CRX-056 on Update-project) allow: Create ✅, Close ✅, Delete ✅ all clean; Update confirmed blocked for every user and every permission state, not a coverage gap.
- **TC-CRX-243–244 — non-admin spot-checks on Versions and Wiki, without AND with permission, 2026-10-12.** Extends the permission-independence finding from TC-242 (BUG-CRX-056) to 2 more entity domains. **TC-243 (Version create) found a DIFFERENT and unexpected failure shape**: 4/4 stalls (token-budget exhaustion mid tool-discovery, BUG-CRX-060's shape — originally scoped to Members only) instead of BUG-CRX-061's quick false denial that admin gets for the identical request — a genuinely new data point suggesting non-admin requests carry extra reasoning overhead that can push an already-broken request from "fails fast" to "never finishes," and a plausible root-cause link between BUG-CRX-060 and BUG-CRX-061. **TC-244 (Wiki create) confirmed the expected pattern**: 2/2 identical BUG-CRX-061 false-denial text, permission-independent, matching TC-242's conclusion for BUG-CRX-056. **With 3 bugs now confirmed permission-independent across 3 domains (Project/BUG-056, Version/BUG-060, Wiki/BUG-061), the remaining ~9 untested non-admin permission combinations (Members, Categories, Time Entries, News, Documents) were not pursued further** — the pattern is well-established and further spot-checks are very unlikely to add new signal.
- Bug references so far: BUG-CRX-050 through BUG-CRX-065 — all reported to production as of 2026-10-12, see `bugs/_index.md`. BUG-CRX-054 updated 2026-10-11 to 3/3 reproductions (closed, archived, and plain permission denial); BUG-CRX-056 reconfirmed 2026-10-12 to also affect non-admin users (TC-242), not just admin; BUG-CRX-060 extended 2026-10-12 to a second entity domain (Versions, TC-243); BUG-CRX-061 reconfirmed 2026-10-12 as permission-independent on Wiki (TC-244).

---

## Closing the remaining Members/Versions/Issue-Categories non-admin permission-matrix gaps (2026-10-26)

> Per explicit user instruction to continue closing out the permission-matrix for Project Manager (CRM's matrix was already done thoroughly on the old laptop). Uses `luna.blossom` (Manager role) against "Crux PM Agent Test Project", with `aurora.wren` (user id 15, Reporter) as the target member for the Members tests.

### TC-CRX-287: Members — Update (role change), non-admin, WITHOUT `manage_members`

**User Role:** `luna.blossom` (Manager role, `manage_members` removed and verified absent via `grep -w` exact-match on the role's DB permissions before this test).

**Steps:** Fresh chat, Project Manager agent, on "Crux PM Agent Test Project": "can you bump aurora wren up to developer on the crux pm agent test project? she's doing more than reporting now" — followed by 2 expected `view_users`-scoping clarification turns (not part of this bug: provided login `aurora.wren`, then numeric user ID `15` after DB lookup, since luna's `view_users` scope can't resolve a name/login outside her shared-project visibility).

**Result: FAIL — new bug, BUG-CRX-077.** Instead of either a genuine Membership-Update confirm card or an honest BUG-CRX-061-shaped false denial, Crux produced a **fabricated "I'll change this project's settings — confirm?" card** with a "Write" action labeled "Change project crux-pm-agent-test-project" and a one-row detail table showing only `Project: Crux PM Agent Test Project` — no mention of Aurora Wren, Developer, or any membership field. This is the same defect class as the already-closed BUG-CRX-056 (fabricated wrong-action confirm card), recurring on a new trigger path (`update_project_membership`-shaped request) that was never part of BUG-056's original scope. Clicked **Cancel** rather than Confirm out of caution. Independently verified via native UI (admin): `/projects/crux-pm-agent-test-project/settings/members` — Aurora Wren still Reporter, not Developer; `/projects/crux-pm-agent-test-project/settings/info` — all project fields/modules unchanged. No unintended write occurred; the card was both mislabeled and non-functional. Filed as **BUG-CRX-077**.

### TC-CRX-287 (continued): Members — Update (role change), non-admin, WITH `manage_members`

**User Role:** `luna.blossom`, `manage_members` genuinely re-granted on the Manager role and DB-verified present (`grep -w "manage_members"` on `roles.permissions`).

**Steps:** Fresh chat (session `ses-042`), single message with every fact supplied up front (per the cost-efficiency standing instruction, to avoid forcing extra clarification round-trips): "hey can you bump aurora wren (user id 15) up to developer on the crux pm agent test project? she's doing more than reporting now"

**Result: FAIL — a *different* failure shape than the WITHOUT-permission half, folded into BUG-CRX-061 as a new repro.** Got the generic false denial: *"I couldn't find a tool for this here, so I can't do it from this chat..."* — confirmed false, `redmineflux_core_update_project_membership` genuinely exists (`core.py:2129`). Verified via native UI: Aurora Wren still Reporter, no change. **Members Update now has two distinct broken failure modes depending on permission state** — WITHOUT `manage_members` gets BUG-CRX-056's fabricated-card shape (BUG-CRX-077); WITH `manage_members` gets BUG-CRX-061's false-denial shape — neither reaches a genuine working confirm card either way.

**Separately — cost-inefficiency flag on this same turn:** the turn cost **$0.1187** (6 LLM calls for only 4 tool calls, `tool_calls=4 outcome=success`), roughly **10-40x** this session's typical per-turn cost ($0.003-$0.01), with 3 of those 6 calls being full cache-misses within the single turn (`cache_write` 19,425 → 25,377 → 35,459, each strictly larger, `cache_read=0` each time) instead of reusing the session's warm cache. Filed as a new, separate bug per the cost-efficiency standing instruction: **BUG-CRX-078**.

### TC-CRX-288: Members — Delete, non-admin, WITHOUT then WITH `manage_members`

**User Role:** `luna.blossom`. Target: Aurora Wren (user id 15, Reporter). All facts (name, user ID, project) supplied in the opening message both times, per the cost-efficiency standing instruction.

**Steps (without permission):** `manage_members` removed and DB-verified absent. Fresh chat: "aurora wren (user id 15) isn't working on the crux pm agent test project anymore, can you remove her from the project members?"

**Result: FAIL — stalled on BUG-CRX-060's shape.** *"Good— `core` has 37 write tools. Let me load them.(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — **$0.08, 167,684 input tokens** for a turn that never reached an answer. Verified via native UI: Aurora Wren still listed as Reporter. Folded into **BUG-CRX-060** as a new entity-domain repro (Members Delete).

**Steps (with permission):** `manage_members` re-granted and DB-verified present. Fresh chat, identical request.

**Result: FAIL — different shape, a false denial matching BUG-CRX-061.** *"I couldn't find a tool for this here, so I can't do it from this chat..."* — confirmed false via source grep, `redmineflux_core_delete_project_membership` genuinely exists (`core.py:2182`). **$0.06, 146,480 input tokens** for this turn — again far above this session's typical per-turn cost, consistent with BUG-CRX-078's pattern. Verified via DB (`members`/`member_roles` join) that Aurora Wren's membership is unchanged (still Reporter, id=3). Folded into **BUG-CRX-061** as a new repro.

**Net finding: Members Delete now mirrors Members Update (TC-287) exactly** — WITHOUT permission stalls (BUG-060), WITH permission gets a false denial (BUG-061), and both halves ran at unusually high cost (BUG-078's pattern, not yet filed as additional repro count but consistent with it).

### TC-CRX-289: Versions — Update (due date change), non-admin, WITHOUT then WITH `manage_versions`

**User Role:** `luna.blossom`. **Precondition:** real version "v1.0" created via native UI (required BOTH Start Date and Due date filled — a first attempt leaving both blank silently failed to persist, caught via DB verification before it could be mistaken for a Crux bug; see `CRUX_MEMORY.md`). Confirmed via DB: due date 2026-12-31.

**Steps (without permission):** `manage_versions` removed and DB-verified absent. Fresh chat: "can you push the v1.0 version's due date on crux pm agent test project out to 2027-03-31? we're slipping a bit"

**Result: FAIL — standard false denial, folded into BUG-CRX-061.** *"I couldn't find a tool for this here, so I can't do it from this chat..."* ($0.09, 145,578 input tokens — another high-cost turn). Verified via DB: due date unchanged.

**Steps (with permission):** `manage_versions` re-granted and DB-verified present. Fresh chat, identical request.

**Result: FAIL — a more specific, equally false denial, also folded into BUG-CRX-061.** *"I'm unable to update version due dates from this chat interface. The tools available to me don't include an `update_version` function..."* — explicitly denies a named tool, `redmineflux_core_update_version`, confirmed to genuinely exist (`core.py:1290`). Notably the reply correctly read back the real current state ("v1.0 exists... currently open with a 2026-12-31 due date") — the read/resolution path works, only the write path falsely denies itself. Verified via DB: due date still unchanged (2026-12-31). This extends BUG-CRX-061's permission-independence finding to Versions Update (previously only Versions Create had this confirmed, TC-CRX-243).

### TC-CRX-290: Versions — Delete, non-admin, WITHOUT then WITH `manage_versions`

**User Role:** `luna.blossom`, same "v1.0" fixture.

**Steps (without permission):** `manage_versions` removed and DB-verified absent. Fresh chat: "we're scrapping the v1.0 version on crux pm agent test project, can you delete it?"

**Result: FAIL — false denial, folded into BUG-CRX-061.** *"I don't see a `delete_version` tool in the available core tools..."* — confirmed false, `redmineflux_core_delete_version` genuinely exists (`core.py:1363`); the reply correctly identified the real version first. Verified via DB: v1.0 still exists.

**Steps (with permission):** `manage_versions` re-granted and DB-verified present. Fresh chat, identical request.

**Result: FAIL — a different shape, the standard stall, folded into BUG-CRX-060.** *"Now let me load the core group's write tools:(Stopped: this turn's token budget was reached...)"* ($0.03, 166,913 input tokens). Verified via DB: v1.0 still exists, unchanged.

**Net finding: Versions Delete flips shape by permission state exactly like Members Update/Delete did** — WITHOUT permission gets a false denial (BUG-061), WITH permission stalls (BUG-060) — the opposite pairing from Versions Update (TC-289, where WITHOUT also got a false denial but WITH got a *different*, more specific false denial rather than a stall). Either way, every Versions write operation (Create, Update, Delete) is now confirmed broken regardless of permission state.

### TC-CRX-291: Issue Categories — Update (rename), non-admin, WITHOUT then WITH `manage_categories`

**User Role:** `luna.blossom`. **Precondition:** disposable fixture category "zz-delete-me-category" (id=27) already present.

**Steps (without permission):** `manage_categories` removed and DB-verified absent. Fresh chat: "can you rename the 'zz-delete-me-category' issue category on crux pm agent test project to 'QA Scratch Category'? the old name was just a placeholder"

**Result: FAIL — false denial, folded into BUG-CRX-061.** *"I don't see an `update_issue_category` tool in the discovered core group..."* ($0.07, 86,845 input tokens).

**Steps (with permission):** `manage_categories` re-granted and DB-verified present. Fresh chat, identical request.

**Result: FAIL — the same false claim, reworded slightly, also folded into BUG-CRX-061.** *"I don't see an `update_issue_category` tool in the core group... that's an admin/settings-level operation..."* ($0.02, 107,405 input tokens). Both confirmed false via source grep — `redmineflux_core_update_issue_category` genuinely exists (`core.py:1767`). Both halves verified via DB that the category name never changed. Extends BUG-CRX-061's permission-independence finding to Issue Categories Update.

### TC-CRX-292: Issue Categories — Delete, non-admin, WITH then WITHOUT `manage_categories`

**User Role:** `luna.blossom`, same "zz-delete-me-category" fixture (id=27).

**Steps (with permission):** `manage_categories` genuinely granted and DB-verified present. Fresh chat: "we don't need the 'zz-delete-me-category' issue category on crux pm agent test project anymore, can you get rid of it?"

**Result: FAIL — the standard stall, folded into BUG-CRX-060.** *"Good — the `core` group has 37 write tools. Let me load them:(Stopped: this turn's token budget was reached...)"* ($0.03, 166,505 input tokens). Verified via DB: category still exists.

**Steps (without permission):** `manage_categories` removed and DB-verified absent. Fresh chat, identical request.

**Result: FAIL — a false denial, folded into BUG-CRX-061.** *"I checked the available tools, and there isn't a delete operation for issue categories in Redmineflux..."* — confirmed false, `redmineflux_core_delete_issue_category` genuinely exists (`core.py:1802`) ($0.01, 86,855 input tokens). Verified via DB: category still exists.

**Net finding: completes Issue Categories' full CRUD set (Create/Update/Delete) as confirmed broken under both permission states** — like Members and Versions, the specific failure shape flips with permission (stall when granted, false denial when not, for this operation), but the write never succeeds either way.


