# Test Cases — Redmineflux Crux — Capacity Agent (Workload plugin) Full CRUD

> **New suite, started 2026-11-03.** A legacy suite exists at
> `testcases/old_suites/CRUX_AGENT_WORKLOAD_CAPACITY.md` (TC-CRX-089–101) but is explicitly marked historical —
> executed entirely against the OLD Redmine 7.0.0 / `localhost:3014` instance, never re-verified against the
> current Redmine 6 / `localhost:3015` / plugin v0.62.0+ cycle. This is a fresh suite on the current
> environment, with fresh TC-IDs per the plugin-wide continuous numbering rule (CLAUDE.md §4a).
>
> Starts at **TC-CRX-523** — current max before this suite was TC-CRX-522.
>
> Source read in full before any TC was drafted (2026-11-03): `redmineflux-crux-core/agents/
> workload-capacity.md` (persona, 27 statically-allowed tools + ~37 discoverable-only tools via
> `crux_discover_tool_groups`/`crux_discover_group_tools(group="workload")`), `redmineflux-mcp/src/tools/
> workload.py` (all 64 tool implementations — permission gates `_require_view`/`_require_manage`/
> `_require_admin`), the native `redmineflux_workload` plugin's `init.rb` (single Redmine permission
> `manage_rf_teams` = "Manage teams and skills"; per-team-membership flags `manage_workload`/
> `can_approve_leave` are NOT native Redmine permissions), this suite's own `docs/CRUX_EXTERNAL_KB_NOTES.md`
> §2 (4 pre-existing GAPs, all already resolved in the legacy suite as TC-089/097/098/099/100), the legacy
> suite itself, and the vendor KB page (`https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/`).
>
> **Key finding from source research, driving several negative TCs below:** `workload.py` has a real
> **permission-gating inconsistency** — `create_team_or_skill`/`update_team_or_skill`/`delete_team_or_skill`
> and the dashboard/capacity/hours_report/hours_table/search_users/search_projects/
> search_unassigned_issues reads are correctly gated at `_require_manage` (needs `manage_rf_teams`), and all
> holiday/holiday-scheme writes at `_require_admin` — but `member_add`/`member_update`/`member_remove`/
> `members_bulk_remove`, `user_skills_update`, `workload_create`/`update`/`delete`, `leave_update`/
> `leave_action`, `send_email`, and every `allocation_*` tool are gated only on `_require_view` at the MCP
> layer — despite several of their own docstrings claiming "Requires manage_workload permission." The MCP
> layer never independently checks the per-team `manage_workload`/`can_approve_leave` membership flags at
> all — enforcement (if any) is entirely up to the backend Rails API. This is the suite's primary negative-
> testing target.

## Plugin
- Name: redmineflux_crux (Capacity Agent, Workload plugin domain — `redmineflux_workload`)
- Plugin version: see `/rf_settings` (registered `7.0.0` in `init.rb`)
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa
- **Note: this plugin is global, not project-scoped** — Teams, Skills, Workloads, Leaves, and Holiday
  Schemes all live outside any single project (`/rf_teams`, `/rf_skills`, `/rf_workloads`, `/rf_leaves`,
  `/rf_settings`), unlike the Invoice/KB Agent suites.

## Precondition — DONE 2026-11-03

1. **Team #7 "Crux Capacity Agent Test Team"** created natively (`/rf_teams/7`).
2. **Members added**, two deliberately different per-team-flag profiles:
   - **Luna Blossom** (user #5) — `Can approve leave: Enabled`, `Manage workload: Enabled` — the
     "team-manager-flagged" subject.
   - **Daisy Skye** (user #6) — `Can approve leave: Disabled`, `Manage workload: Disabled` — the "plain
     member" subject, for exercising the permission-gating inconsistency found in source research.
   - **Global `manage_rf_teams` ("Manage teams and skills") permission** confirmed via native Roles UI:
     `Manager` role (Luna's role on her other project memberships) has it checked; `Reporter` role (Daisy's
     role everywhere) does not. Since this is a global permission checked via `allowed_to?(..., global:
     true)`, Luna genuinely has `manage_rf_teams` org-wide (via her Manager membership elsewhere) and Daisy
     genuinely does not.
3. **Skill #1 "Ruby on Rails"** created (`/rf_skills/1`), not yet assigned to any user.
4. **Holiday Scheme "Crux Capacity Test Scheme"** created and set active (`/rf_settings`) — the only active
   scheme on this instance.
5. **Workload #1 "Crux Capacity Sprint 1"** created under Team #7, dates 2026-11-03 to 2026-11-17
   (`/rf_teams/7/rf_workloads/1`), auto-added both team members, initial capacity computed.
6. **Fixture issue #26** "Capacity Agent fixture issue - sprint 1 work item" created in the KB Agent test
   project, assigned to Luna Blossom — used for `add_issue`/allocation testing.
7. **Global settings** confirmed at default: `Allow Workload Overload` checked (allowed), `Working Hours Per
   Day` = 8.0.

## Permission Model (confirmed, not assumed)

| Layer | What it gates | Enforced by |
|---|---|---|
| `manage_rf_teams` ("Manage teams and skills") | Team/skill CRUD, dashboard, capacity, hours reports, search_users/projects/unassigned_issues | Native Redmine permission, global check — `_require_manage` in `workload.py` |
| Redmine admin flag | Dashboard (separately, `_require_admin`), all holiday/holiday-scheme writes | `_require_admin` in `workload.py` |
| Per-team `manage_workload` / `can_approve_leave` flags | Documented (in tool docstrings) as gating member mgmt, workload CRUD, allocations, leave actions, send_email | **NOT checked by the MCP tool layer at all** — only `_require_view` (any workload access) is checked; real enforcement, if any, is backend-only |

---

## Read Surface — Health Check

---

### TC-CRX-523: Dashboard — admin-only, correctly refused for a non-admin

**User Role:** `daisy.skye` (Reporter, non-admin). **Precondition:** Team #7, Workload #1 exist.

**Steps:** Capacity Agent pinned: "Show me the workload dashboard."

**Expected Result:** Per `redmineflux_workload_dashboard`'s `_require_admin` gate and the vendor doc ("Dashboard
is available to administrators only"), a non-admin should be honestly refused — not shown fabricated KPIs.

**Result: PASS.** Correctly refused: *"The workload dashboard is restricted to administrators only. Your
current account (daisy.skye) doesn't have admin access."* — offered legitimate alternatives (team capacity,
own workloads) instead of fabricating data.

---

### TC-CRX-524: Dashboard — admin, positive

**User Role:** `admin`.

**Steps:** Fresh chat, Capacity Agent pinned: "Show me the workload dashboard for this week."

**Expected Result:** Returns real org-wide KPIs grounded in an actual `redmineflux_workload_dashboard` call —
active users, capacity/planned/logged totals, utilization%, not an invented summary.

**Result: PASS.** Returned accurate real KPIs for the week of Nov 2–8, 2026: Active Users: 2, Total Capacity:
70.4 hours, Total Planned: 0.0, Total Logged: 0.0, Utilization 0% — no planned work — matching the fresh
fixture state exactly (2 members, nothing allocated yet).

---

### TC-CRX-525: Capacity — `_require_manage` gate, non-manager refused

**User Role:** `daisy.skye` (no `manage_rf_teams`).

**Steps:** "What's the capacity for the Crux Capacity Agent Test Team?"

**Expected Result:** Per `redmineflux_workload_capacity`'s `_require_manage` gate, Daisy (genuinely lacking
`manage_rf_teams`) should be refused with a real permission error — not shown fabricated capacity numbers for
a team she's an actual member of.

**Result: PASS.** Correctly refused: *"You're a member of the Crux Capacity Agent Test Team, but viewing
capacity requires the Manage Workload role... Your Redmineflux administrator can grant you that permission."*
No fabricated numbers shown; legitimate alternative (specific workload lookup) offered instead.

---

### TC-CRX-526: Capacity — manager, positive

**User Role:** `luna.blossom` (has `manage_rf_teams`).

**Steps:** Fresh chat, Capacity Agent pinned: "What's the capacity for the Crux Capacity Agent Test Team?"

**Expected Result:** Returns real per-workload capacity totals for Team #7, grounded in an actual tool call.

---

### TC-CRX-527: Teams / team_data / Gantt / conflicts / team_on_leave — positive read sweep

**User Role:** `admin`.

**Steps:** In one chat: "What teams exist?" → "Show me the Crux Capacity Agent Test Team." → "Show me the Gantt
for the Crux Capacity Sprint 1 workload." → "Any scheduling conflicts on that workload?" → "Who's on leave
today?"

**Expected Result:** Each answer is grounded in the corresponding real tool call (`teams`, `team_data`,
`gantt`, `conflicts`, `team_on_leave`) — accurate real data (Team #7 with its 2 real members; Workload #1's
real fixture issue; empty conflicts/leave lists reported honestly, not fabricated).

**Result: PASS, all 5 legs.** `teams` correctly listed all 5 real teams with accurate member/workload counts
(Team #7: 2 members, 1 workload). `team_data` correctly showed Team #7's 2 members with their real per-team
permissions (Luna Blossom: manage_workload + can_approve_leave; Daisy Skye: none) and the real workload.
`gantt` correctly reported no allocations yet for either member. `conflicts` correctly reported none.
`team_on_leave` correctly reported nobody on leave today. All grounded in real tool calls, no fabrication.

---

## Team & Skill Management (`_require_manage` gate)

---

### TC-CRX-528: Create team — manager, positive

**User Role:** `luna.blossom`.

**Steps:** "Create a new team called 'Crux Capacity Sub Team'."

**Expected Result:** Confirm card names the exact team; confirming genuinely creates it (`create_team_or_skill`,
`resource_type: "team"`), native-verified on `/rf_teams`.

---

### TC-CRX-529: Create team — no permission, negative

**User Role:** `daisy.skye` (no `manage_rf_teams`).

**Steps:** "Create a new team called 'Reporter Rogue Team'."

**Expected Result:** Per `_require_manage`, should be genuinely refused — Daisy lacks `manage_rf_teams`
org-wide. No team created (native-verify `/rf_teams` doesn't show it).

---

### TC-CRX-530: Create skill — positive

**User Role:** `admin`.

**Steps:** "Create a new skill called 'PostgreSQL'."

**Expected Result:** Confirm card names the skill; confirming creates it (`resource_type: "skill"`),
native-verified on `/rf_skills`.

---

### TC-CRX-531: Delete team — destructive, named explicitly, cascade warning

**User Role:** `admin`. **Precondition:** TC-CRX-528's "Crux Capacity Sub Team" exists, empty (no workloads).

**Steps:** "Delete the Crux Capacity Sub Team."

**Expected Result:** Per the tool's own docstring ("Deleting a team cascades to all associated
workloads/memberships"), confirm card names the specific team; confirming genuinely removes it,
native-verified.

---

## Team Member Management — the permission-gating inconsistency

---

### TC-CRX-532: Add member — plain Reporter attempts, despite `_require_view`-only gate

**User Role:** `daisy.skye` (Reporter, no `manage_rf_teams`, no per-team `manage_workload` flag on her own
Team #7 membership either). **Precondition:** Daisy is already a plain member of Team #7, genuinely able to
view it (`_require_view` passes for any team she can see).

**Steps:** "Add Luna Meadow to the Crux Capacity Agent Test Team."

**Expected Result:** Per `member_add`'s own docstring text ("Requires manage_workload permission") this should
be refused. But per source research, the MCP tool layer's actual code only calls `_require_view()` — **this is
the key test**: does the backend Rails API independently block it, or does chat produce a genuine unauthorized
write? If the member is genuinely added, this is a real permission-bypass bug matching the already-known
defect class (BUG-CRX-003/012/040's pattern).

**Result: PASS — real protection exists, via a different gate than expected.** The agent first proactively
self-refused citing a missing `Manage Workload` permission (not yet a genuine backend test). Pushed further
("Please try it anyway") revealed the real mechanism: resolving "Luna Meadow" to a user id requires
`search_users`, which genuinely IS `_require_manage`-gated — *"Access denied — you need the `manage_rf_teams`
permission to search for users to add to a team."* So in practice, Daisy can never reach `member_add` at all
via the normal chat workflow, because the prerequisite user-search step is itself correctly gated — even
though `member_add` itself is coded as `_require_view`-only as source research found.

---

### TC-CRX-533: Update member flags — plain Reporter attempts

**User Role:** `daisy.skye`.

**Steps:** "Give Luna Blossom's Crux Capacity Agent Test Team membership the ability to approve leave requests
too." (Luna already has `manage_workload`; this asks to toggle a flag she already has, to isolate whether the
write itself goes through regardless of permission.)

**Expected Result:** Same permission question as TC-CRX-532 — `member_update` is docstring-claimed
manage_workload-gated but code-gated only at `_require_view`. Test whether Daisy can genuinely alter another
member's permission flags.

**Result: BLOCKED on permission (same proactive self-refusal pattern) — but FOUND BUG while pushing further.**
Daisy was first proactively refused citing missing Manage Workload permission. Pushing ("try it anyway")
surfaced a confirm card — but it targeted the **wrong team and wrong member entirely** (`Team: 1`,
`Membership: Daisy Skye` — neither Team #7 nor Luna Blossom, the ones actually named). Reproduced 3/3 across
different users/chat-depths. The permission question itself remains unanswered (the write never reached a
genuinely-correct target to test against), but this wrong-target confirm card is itself a serious, separately
filed defect: **BUG-CRX-145**.

---

### TC-CRX-534: Remove member — plain Reporter attempts (destructive)

**User Role:** `daisy.skye`. **Precondition:** at least one other real, removable member (not Daisy herself)
exists beyond Luna — use TC-CRX-532's newly-added member if that test succeeded, or a dedicated 3rd member
added by admin first if it was correctly refused.

**Steps:** "Remove [member] from the Crux Capacity Agent Test Team."

**Expected Result:** Same permission question — `member_remove` is destructive and docstring-claimed
manage_workload-gated but code-gated only at `_require_view`.

---

### TC-CRX-535: `member_remove`/`member_update` — Member # vs. User # resolution (documented historical confusion point)

**User Role:** `admin`. **Precondition:** Team #7's real `members_list` shows Luna Blossom and Daisy Skye with
distinct `Member #` (membership id) and `User #` (user id) values — confirm these are genuinely different
numbers first via `members_list`.

**Steps:** "List the members of the Crux Capacity Agent Test Team with their member IDs." Then: "Update member
[the real Member # for Daisy, NOT her User #] to enable manage workload."

**Expected Result:** Per the persona file's own documented 2026-09-24 incident ("a live agent conflated the
two... wrongly told the user 'member #80 doesn't exist'"), the agent must resolve the named id against the
`members_list`'s own `Member #` column, not `User #` — confirm it does so correctly here and doesn't falsely
claim the real membership doesn't exist.

**Result: PARTIAL PASS — Member #/User # resolution itself is correct; FOUND BUG in tool availability.**
`members_list` correctly showed distinct Member # / User # pairs: Luna Blossom = Member #10 (User #5), Daisy
Skye = Member #11 (User #6). Asking to update "member 11" correctly resolved to Daisy Skye (Member #11, User
#6) — never confused with User #11 (a different, unrelated person) — the historical confusion point itself
does NOT reproduce here. However, in this same, by-then several-turns-deep chat, the agent instead falsely
claimed *"The member management tools aren't available in my current toolset, and discovery isn't finding the
expected group"* — a regression of the historical, closed BUG-CRX-034. Retried in a fresh chat: succeeded
cleanly with a real confirm card and correct resolution. Filed as **BUG-CRX-144**. (Also reproduced,
2nd/3rd time, the fabricated-prose-no-confirm-button pattern already tracked on the KB Agent as BUG-CRX-142 —
noted, not re-filed, now confirmed cross-domain.)

---

### TC-CRX-536: Bulk remove members — destructive, plain Reporter attempts

**User Role:** `daisy.skye`.

**Steps:** "Remove all members from the Crux Capacity Agent Test Team except me."

**Expected Result:** `members_bulk_remove` is destructive, docstring-claims manage_workload, code-gated only at
`_require_view` — same permission question as TC-CRX-532/533/534, now for a bulk/destructive action.

---

### TC-CRX-537: Assign skill to a user — plain Reporter attempts

**User Role:** `daisy.skye`.

**Steps:** "Give Luna Blossom the Ruby on Rails skill at level 3, for the Crux Capacity Agent Test Team."

**Expected Result:** `user_skills_update` replaces ALL existing skills for that user (per docstring) and is
docstring-claimed manage_workload-gated but code-gated only at `_require_view` — same permission question.

---

## Workload Record Lifecycle — same gating question

---

### TC-CRX-538: Create workload — plain Reporter attempts

**User Role:** `daisy.skye`.

**Steps:** "Create a new workload called 'Reporter Rogue Sprint' for the Crux Capacity Agent Test Team,
starting today for 2 weeks."

**Expected Result:** `workload_create` auto-adds all current team members and is docstring-claimed
manage_workload-gated, code-gated only at `_require_view` — test whether Daisy's write genuinely succeeds.

---

### TC-CRX-539: Update workload — plain Reporter attempts

**User Role:** `daisy.skye`.

**Steps:** "Rename the Crux Capacity Sprint 1 workload to 'Renamed By Reporter'."

**Expected Result:** Same permission question on `workload_update`.

---

### TC-CRX-540: Delete workload — destructive, plain Reporter attempts

**User Role:** `daisy.skye`. **Precondition:** use a disposable workload (e.g. TC-CRX-538's, if it was
genuinely created) rather than the main fixture Workload #1.

**Steps:** "Delete the [disposable] workload."

**Expected Result:** Same permission question on the destructive `workload_delete`.

---

## Allocation Edits

---

### TC-CRX-541: Add issue to workload — positive

**User Role:** `admin`.

**Steps:** "Add issue #26 to the Crux Capacity Sprint 1 workload."

**Expected Result:** Confirm card names the real issue and workload; confirming returns a real
`workload_issue_id`, native-verified the issue now appears under Luna Blossom's allocation.

---

### TC-CRX-542: Update planned hours — positive, allocation-ID contract check (historical BUG-CRX-018 regression)

**User Role:** `admin`. **Precondition:** TC-CRX-541's issue #26 is on the workload.

**Steps:** "Set planned hours to 12 for issue #26 on the Crux Capacity Sprint 1 workload, for Luna Blossom."

**Expected Result:** Per the historical BUG-CRX-018 fix note ("Allocation resize/date-update tools reject the
exact ID the Workload Add Issue tool just returned"), this should succeed cleanly and return a real
`allocation_id` the agent can reuse in later calls without a fabricated-ID mismatch. Regression-check this
specific historical bug class on the current build.

---

### TC-CRX-543: Allocation resize — positive, using the real allocation_id from TC-CRX-542

**User Role:** `admin`.

**Steps:** "Resize that allocation to 16 hours." (same chat, referring back to the just-returned allocation)

**Expected Result:** Succeeds using the real `allocation_id` from the prior turn — no ID-mismatch regression of
BUG-CRX-018.

---

### TC-CRX-544: Allocation split — negative, documented DB-layer-broken feature (BUG-RFM-011)

**User Role:** `admin`.

**Steps:** "Split that allocation into 8 and 8 hours."

**Expected Result:** Per the tool's own built-in friendly-error handling for BUG-RFM-011 (the DB schema
doesn't actually support split allocations — a unique-constraint violation), this should render a clean "not
yet supported on this server" message — **not** a raw 500 or an unhandled DB error leaking to the user.

---

### TC-CRX-545: Allocation update_dates / reset — positive

**User Role:** `admin`.

**Steps:** "Move that allocation to start 2026-11-05 and end 2026-11-10." then "Reset that allocation back to
automatic scheduling."

**Expected Result:** Both succeed cleanly; `reset` genuinely clears the manual override, native-verified.

---

### TC-CRX-546: Remove issue from workload — destructive, positive

**User Role:** `admin`.

**Steps:** "Remove issue #26 from the Crux Capacity Sprint 1 workload."

**Expected Result:** Confirm card names the real issue/workload; confirming removes it, native-verified.

---

### TC-CRX-547: Genuine over-capacity allocation with overload disabled — the historically-never-exercised refusal path

**User Role:** `admin`. **Precondition:** re-add issue #26 to the workload first. Set `Allow Workload Overload`
to disabled via "Update the workload settings to disable overload." (or native UI if the agent can't reach
settings — `settings_update` is `_require_admin`-gated, admin should succeed). Then construct a genuine
over-capacity scenario: a short single-week workload/allocation where planned hours would exceed the real
available capacity (e.g. request 60 planned hours against a single week's ~40h capacity for one user).

**Steps:** "Set planned hours to 60 for issue #26 on the Crux Capacity Sprint 1 workload, for Luna Blossom."
(after disabling overload)

**Expected Result:** Per the vendor doc ("When disabled, planned hours must stay within capacity"), this should
be genuinely refused/blocked — not silently accepted. This is the specific scenario the legacy suite's
TC-CRX-099 flagged as "never genuinely exercised" (it was blocked by a fabricated-success bug, BUG-CRX-028,
before the real capacity math was ever tested) — a priority regression/first-real-exercise test.

---

## Leave Lifecycle

---

### TC-CRX-548: Create leave request — positive

**User Role:** `luna.blossom`.

**Steps:** Fresh chat, Capacity Agent pinned: "Request leave from 2026-11-20 to 2026-11-21, type planned,
reason 'personal errands'."

**Expected Result:** Confirm card shows the exact dates/type/reason; confirming creates a genuine pending leave
request for Luna, native-verified on `/rf_leaves`.

---

### TC-CRX-549: Approve leave — `can_approve_leave`-flagged member, positive

**User Role:** `luna.blossom` (has `can_approve_leave: Enabled` on Team #7). **Precondition:** TC-CRX-548's
leave request exists, pending (requested by Luna herself — ideally use a different user's request if
self-approval should be blocked; note this as an observation if Luna can approve her own request).

**Steps:** "Approve [the leave request]."

**Expected Result:** Since Luna's own per-team flag genuinely has `can_approve_leave`, this should succeed;
also worth noting whether self-approval is honestly flagged as unusual.

---

### TC-CRX-550: Approve/reject leave — plain member without `can_approve_leave`, negative

**User Role:** `daisy.skye` (Team #7 membership has `can_approve_leave: Disabled`). **Precondition:** a
pending leave request exists (e.g. Daisy requests her own leave first, or use another pending one).

**Steps:** "Reject [the leave request] because the dates conflict with a deadline."

**Expected Result:** Per the tool's own docstring ("approve/reject require `can_approve_leave` or admin"),
Daisy should be genuinely refused. This flag is enforced server-side per the docstring, not at the MCP layer
— test whether the backend genuinely blocks it (the per-team-flag equivalent of TC-CRX-532's team-management
gating question, now for leave approval specifically).

---

### TC-CRX-551: Leave create — unrecognized username (historical BUG-CRX-019 regression: silently resolves to User ID 0)

**User Role:** `admin`.

**Steps:** "Create a leave request for username 'nonexistent_user_zzz', type sick, 2026-11-25 to 2026-11-25,
reason 'regression check'."

**Expected Result:** Per the historical BUG-CRX-019 fix (`_resolve_username`'s exact-match requirement with a
clean "zero or multiple matches" error), this should be honestly refused with a clear "user not found" error —
**not** silently create a leave request for user ID 0. Regression-check this specific historical bug class.

---

### TC-CRX-552: Leave calculate_days / team_on_leave — positive reads

**User Role:** `admin`.

**Steps:** "How many working days between 2026-11-20 and 2026-11-24?" then "Who's on leave on 2026-11-20?"

**Expected Result:** `leave_calculate_days` correctly excludes weekends/holidays per the active scheme;
`team_on_leave` returns real approved-leave data for that date, not fabricated.

---

## Holiday Scheme Management (`_require_admin` gate)

---

### TC-CRX-553: Holiday scheme activation exclusivity — historical BUG-CRX-028 regression

**User Role:** `admin`. **Precondition:** create a second scheme "Crux Capacity Test Scheme 2" (inactive).

**Steps:** "Activate the Crux Capacity Test Scheme 2."

**Expected Result:** Per the vendor doc's exclusivity rule ("activating a new scheme deactivates the
previous one") and the historical TC-CRX-098/BUG-CRX-028 finding (a fabricated-success confirm with no real
button), this should show a **genuine** confirm card and, once confirmed, genuinely deactivate "Crux Capacity
Test Scheme" — native-verify only one scheme is active afterward. Regression-check both the real exclusivity
behavior and the fabricated-confirm defect class specifically on this tool.

---

### TC-CRX-554: Delete the currently active holiday scheme — negative, documented refusal

**User Role:** `admin`. **Precondition:** one scheme is genuinely active (from TC-CRX-553).

**Steps:** "Delete the currently active holiday scheme."

**Expected Result:** Per the tool's own docstring ("cannot delete the currently active scheme"), this should
be honestly refused — never tested in the legacy suite, first exercise of this specific refusal path.

---

### TC-CRX-555: Holiday scheme management — non-admin refused

**User Role:** `luna.blossom` (has `manage_rf_teams` but is NOT a Redmine admin).

**Steps:** "Create a new holiday scheme called 'Luna's Rogue Scheme'."

**Expected Result:** `holiday_scheme_create` is `_require_admin`-gated specifically (not `_require_manage`) —
Luna, despite having `manage_rf_teams`, should still be refused since she isn't a Redmine admin. This isolates
the admin-vs-manager distinction cleanly.

---

### TC-CRX-556: Holiday create/update/delete — positive, admin

**User Role:** `admin`.

**Steps:** "Add a company holiday called 'Crux QA Day' on 2026-12-25 to the Crux Capacity Test Scheme." then
"Delete that holiday."

**Expected Result:** Both succeed cleanly for an admin; native-verified created then genuinely removed.

---

## Discovery Mechanism & send_email

---

### TC-CRX-557: Tool discovery — `crux_discover_tool_groups`/`crux_discover_group_tools(group="workload")` genuinely surfaces non-static tools

**User Role:** `admin`.

**Steps:** Fresh chat, Capacity Agent pinned: "What's the planned-hours report for the Crux Capacity Agent Test
Team?" (requires `hours_report`, a discovered-only tool per the persona file, not in the static
`allowed_tools` list).

**Expected Result:** The agent should successfully discover and call `hours_report` (per its own persona
instructions — "call `crux_discover_tool_groups` then `crux_discover_group_tools` with group `workload`
first"), not falsely claim the capability doesn't exist (the exact historical BUG-CRX-034 shape — "Capacity
Agent falsely claims Workload team-lifecycle/member-management tools aren't available").

---

### TC-CRX-558: `send_email` — explicit intent confirmation required, queued-vs-delivered honesty

**User Role:** `admin`.

**Steps:** "Email the team about the Crux Capacity Sprint 1 workload." Inspect the confirm card and the
post-confirm result message closely.

**Expected Result:** Per the persona's own explicit callout ("`send_email` (notifies real people)... confirm
intent clearly before proposing, especially `send_email`"), the confirm card must be unambiguous about who
will be emailed. Since the tool is explicitly async (background job dependent, per source research), the
result message should honestly say something like "queued" rather than overclaiming actual delivery — flag if
it claims delivery as a definite fact.

---

## Auto-Mode Routing & Context Resolution

---

### TC-CRX-559: Auto mode — bare phrasing routes to Capacity Agent

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "Who's overloaded this week?" (the exact historical BUG-CRX-007 repro
phrase — "domain-inference chat routing never fires on a bare domain question").

**Expected Result:** Routes to Capacity Agent, not falling through to Project Manager — regression-check this
specific historical bug.

---

### TC-CRX-560: Auto mode — ambiguous phrasing vs. Project Manager

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What's the team capacity looking like for the Crux Capacity Agent Test
Team?"

**Expected Result:** Routes to Capacity Agent specifically — real capacity data is Workload-specific, Project
Manager has no tool for it.

---

### TC-CRX-561: Context/project resolution — later-turn write in an established chat

**User Role:** `admin`. **Precondition:** fresh chat, first message establishes "Crux Capacity Agent Test
Team" as the chat's working team (e.g. TC-CRX-527's reads).

**Steps:** Later in the same chat, without re-naming the team: "Add issue #26 to the Crux Capacity Sprint 1
workload again."

**Expected Result:** The team/workload this chat had already been operating on should be reused — check
whether the Capacity Agent shares either of the two context-carryover defect shapes already found on other
domains this cycle: switching to a different real team (BUG-CRX-080/093/101/133 family) or fabricating a
corrupted identifier (BUG-CRX-140 family, KB Agent).
