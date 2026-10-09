# Test Cases — Redmineflux Crux — Project Manager Agent (cross-domain status + core CRUD)

> Source: `redmineflux-crux-core/agents/project-manager.md` (full `allowed_tools:` + Identity/Proposing-writes/How-to-answer/Hard-limits sections, read 2026-10-09); `docs/CRUX_FEATURES_LIST.md` (Project Manager explicitly noted as outside #117162's 9 domain agents — never had a dedicated suite until now); `docs/CRUX_REQUIREMENTS.md` Key Features #1 (Ask Crux chat routes cross-domain/ambiguous asks to Project Manager).
>
> **Execution readiness: BLOCKED — no LLM provider key configured yet.** Environment is otherwise fully set up on the new Redmine 6 instance (`localhost:3015`): `crux-qa` project created with 2 fixture issues, `CRUX_REQUIRE_USER_KEY=1` enabled so each tier's chat requests run under that user's OWN real Redmine API key (not a shared service key), and the 3 test-tier users are configured (see Plugin section below). Every TC below is written and ready to execute the moment a real provider key (OpenRouter, pending from the user) is added — until then, every chat call returns the canned "Crux isn't connected to an AI model yet" stub, which is not a meaningful result for any of these TCs.

## Plugin
- Name: redmineflux_crux (Project Manager agent — general-purpose/cross-domain, NOT one of the #117162 domain-9)
- Version: crux-core 0.1.0 / plugin 0.62.0
- Redmine version: 6.0-bookworm (new local Docker instance, `C:\crux-redmine`)
- Path: plugins/redmineflux_crux_qa

### The 3 permission tiers (set up 2026-10-09)

| Tier | User | Setup |
|---|---|---|
| **Admin — full permission** | `admin` | Redmine Administrator; sees/can do everything regardless of project membership |
| **Permitted — has the relevant permissions** | `luna.blossom` | Member of `crux-qa` with the `Manager` role, which has been granted `view_crux`, `use_ask_crux`, `approve_crux_gates` plus its existing standard issue/project CRUD permissions (view/add/edit/delete issues, add/edit project, etc.) |
| **No permission** | `aurora.wren` | Zero project memberships, zero Crux permissions (confirmed via Rails console: `allowed_to_globally?(:use_ask_crux)` → `false`) |

Each of the 3 users has their own real Redmine API key generated (Rails console, 2026-10-09) — with `CRUX_REQUIRE_USER_KEY=1`, the Rails plugin injects the logged-in user's own key into every `/api/chat`, `/api/chat/confirm`, `/api/improve`, `/api/improve/confirm` request, so Redmine's real permission system genuinely gates each tier's result (not just a UI-level difference).

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

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-178: "Everything about this project" pulls BOTH `project_summary` AND `get_project` with `include=`

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-177.

**Steps:**
1. Ask "Give me ALL details about crux-qa — trackers, categories, enabled modules, everything."

**Expected Result:**
- Per the agent's spec (#0, the "ALL details is BROADER than status" rule), the agent calls `project_summary` AND `get_project(include=trackers,issue_categories,enabled_modules,time_entry_activities)` in the SAME round — not `project_summary` alone (which would silently drop categories/modules/activities, a documented past defect this spec explicitly guards against).
- Answer actually includes tracker list, enabled modules, and categories — not just the status-shaped summary.

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-179: Critical-issues query uses the dedicated tool, not a filtered list

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-177 (fixture issues are low/normal priority by default — may need one bumped to High/Urgent first, or ask "what's critical" with the expectation of an honest "nothing critical right now" answer).

**Steps:**
1. Ask "What's critical or on fire in crux-qa right now?"

**Expected Result:**
- Uses `redmineflux_core_critical_issues`, not a generic `list_issues` + manual filtering.
- If nothing is actually critical, says so honestly rather than inventing urgency.

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-180: Single named issue's full detail (`get_issue`)

**User Role:** `admin`.
**Precondition:** Issue #1 ("Set up CI pipeline") exists.

**Steps:**
1. Ask "Tell me everything about issue #1."

**Expected Result:**
- Grounded in a real `redmineflux_core_get_issue` call — exact subject, status, priority, author match the real record.

**Result: PENDING — blocked on LLM provider key**

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

**Result: PENDING — blocked on LLM provider key**

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

**Result: PENDING — blocked on LLM provider key**

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

**Result: PENDING — blocked on LLM provider key**

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

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-185: Assignee resolution by name — never a guessed numeric id

**User Role:** `admin`.
**Precondition:** `luna.blossom` is a real, resolvable user (member of crux-qa).

**Steps:**
1. "Assign issue #1 to luna.blossom."
2. Confirm.

**Expected Result:**
- Per spec, the agent calls `redmineflux_core_list_users` (or `get_user`) FIRST to resolve the real numeric id — never guesses one from the name.
- The confirm card's `assigned_to_id` is the real resolved numeric id, and the issue is genuinely assigned to the right person after confirm.

**Result: PENDING — blocked on LLM provider key**

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

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-187: Discovery mechanism for CRUD beyond the static list (e.g. a wiki page)

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. "Create a wiki page in crux-qa called 'Team Norms' with the text 'Be kind, ship often.'"

**Expected Result:**
- Wiki pages are NOT on the agent's static `allowed_tools` list — per its Identity section, it should call `crux_discover_tool_groups` then `crux_discover_group_tools` (its own group is `core`) to find the write capability, THEN propose it through the same confirm gate as a static write — never refuse outright without discovering first, and never execute it directly either.

**Result: PENDING — blocked on LLM provider key**

---

## Permission-Tier Comparison Cases (admin vs. permitted vs. no-permission)

---

### TC-CRX-188: Same status question, 3 tiers — `use_ask_crux` gates chat access itself

**User Role:** All three: `admin`, `luna.blossom`, `aurora.wren`.
**Precondition:** 3-tier setup as described above.

**Steps:**
1. As `admin`: ask "What's the status of crux-qa?" — expect a full grounded answer.
2. As `luna.blossom`: ask the same question — expect a full grounded answer (she has `use_ask_crux` + is a real project member).
3. As `aurora.wren`: attempt to even open Ask Crux — expect the bubble/wand to be genuinely absent from the DOM (per the already-established TC-CRX-141/142 finding), not just a refused chat message. If somehow reached directly, expect a hard refusal before any tool call.

**Expected Result:**
- Admin and permitted tiers both get grounded, correct answers.
- No-permission tier never reaches the model at all — gated at the UI/server layer, consistent with prior findings.

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-189: Same write proposal, 3 tiers — Redmine's OWN permission enforces the ceiling under CRX-12

**User Role:** All three.
**Precondition:** `CRUX_REQUIRE_USER_KEY=1` is live (confirmed 2026-10-09).

**Steps:**
1. As `admin`: "Create an issue in crux-qa called 'Admin-created test issue'." → confirm → expect success.
2. As `luna.blossom` (Manager on crux-qa, has add_issues): same ask → confirm → expect success (her own key, own real permission).
3. As `aurora.wren`: cannot reach this step at all (blocked at TC-CRX-188's layer) — if directly testing the gated route with her own key via a raw HTTP call (bypassing the UI, mirroring TC-CRX-145's method), expect a clean 401/403, never a silent success.

**Expected Result:**
- Admin and permitted tiers' writes genuinely persist, attributed to the correct real user (check the issue's author/journal, not just the chat's own claim).
- No-permission tier's write is refused at the real Redmine layer if attempted directly — Crux never silently uses elevated access on her behalf (same principle as the already-confirmed TC-CRX-146 from the CRX-12 suite).

**Result: PENDING — blocked on LLM provider key**

---

### TC-CRX-190: A permitted user attempts something outside their OWN real Redmine permission

**User Role:** `luna.blossom`.
**Precondition:** Temporarily remove `delete_issue`/`add_project` (or similar) from the Manager role, OR use a second project `luna.blossom` is NOT a member of, to create a genuine "has use_ask_crux, lacks this specific permission" gap (the exact sub-case TC-CRX-146 in `CRUX_PER_USER_KEY_CRX12.md` flagged as not independently testable with the fixtures available at the time).

**Steps:**
1. As `luna.blossom`, ask Project Manager to do something requiring a permission she genuinely lacks (e.g. delete a project, or act on a project she's not a member of).
2. Confirm the resulting proposal (if one is even produced).

**Expected Result:**
- Either the agent proposes it and the confirm genuinely fails at Redmine's own permission layer (honest refusal, not a silent success) — or the agent discovers upfront that the capability isn't available to this user and says so plainly.
- This closes the exact gap TC-CRX-146 left open — first genuine "use_ask_crux granted, specific action forbidden" fixture for this plugin.

**Result: PENDING — blocked on LLM provider key**

---

## Evidence Map

- All TCs: pending real execution once an LLM provider key (OpenRouter) is added to this instance.
- Screenshots: `screenshots/TC-CRX-<NNN>/` per CLAUDE.md §6 (bug evidence only — pass/fail results recorded inline here, not screenshotted unless a bug is found).
- Bug references: none yet (no execution has happened).
