# Test Cases — Redmineflux Crux — Navigation, Entry Points & Permission Matrix

> Source: `docs/CRUX_REQUIREMENTS.md` Permissions Matrix, `docs/CRUX_USER_GUIDE.md` Getting Started/Key Screens, `docs/CRUX_FEATURES_LIST.md` #11, #13, #14, #17, #18, #19.
>
> **Scope note:** this suite is deliberately the first one written because it is fully executable today on the local QA stack (`C:\Crux-Redmine-Docker`, `crux-redmine` on `localhost:3014`) without either of the two current blockers — no LLM provider key is needed (nothing here depends on a real chat reply), and no second restricted-privilege test user is needed (role/permission setup can use existing or newly-created roles). Suites that need a real Ask Crux chat response (CRX-46 wand content, CRM/Workload/etc. write proposals) or the CRX-12 fail-closed per-user key path wait on those two environment items — see `docs/CRUX_HANDOFF.md`.
>
> `docs/CRUX_USER_GUIDE.md` and the Permissions Matrix in `docs/CRUX_REQUIREMENTS.md` were drafted from source code (`init.rb`), not a live walkthrough — every TC below exists partly to confirm or correct that draft. Update both docs immediately once a TC's evidence contradicts them.

## Plugin
- Name: redmineflux_crux
- Version: 0.39.0 (plugin, per `VERSION` in `C:\Crux-Redmine-Docker\redmineflux_crux`) / crux-core 0.92.0
- Redmine version: 7.0.0 (Docker, `crux-redmine` container)
- Path: plugins/redmineflux_crux_qa
- Environment: Local — `http://localhost:3014` (Redmine), crux-core `http://localhost:8787`, MCP via nginx `http://localhost:8082`

---

## Positive Cases

---

### TC-CRX-001: Ask Crux chat bubble appears for a user with `use_ask_crux`, no dedicated menu entry exists

**User Role:** A logged-in user whose role grants `use_ask_crux` (or an Administrator).
**CORRECTED 2026-09-11 (source review):** the original draft of this TC said the bubble "is not permission-gated" — that was wrong. `lib/redmineflux_crux/hooks/view_hooks.rb#view_layouts_base_body_bottom` explicitly checks `return '' unless user.allowed_to_globally?(:use_ask_crux) || user.admin?` before rendering anything — the bubble is entirely ABSENT from the DOM (not CSS-hidden) for any user lacking `use_ask_crux`, server-side, on every page. See TC-CRX-139 for the negative case this corrects.
**Precondition:** `redmineflux_crux` plugin installed and crux-core reachable.

**Steps:**
1. Log in as any user with at least one Crux permission granted on their role.
2. Observe the page for a floating chat bubble (default position: bottom-right).
3. Check the top-menu bar for any entry literally labeled "Ask Crux".
4. Click the bubble.

**Expected Result:**
- A floating chat bubble is visible, showing the configured greeting ("Hello! I'm Crux...") and starter prompts.
- No "Ask Crux" top-menu entry exists — this is by design (CRX-21), not a missing feature; do not file as a bug.
- Clicking the bubble opens a compact chat panel with an "Open full view" (or equivalent) option reaching `/crux/ask`.

- **CONFIRMED LIVE 2026-09-11** (Local, `crux-redmine` localhost:3014, admin): PASS. Logged in, floating "Ask Crux" bubble bottom-right, clicked it — panel opened with exact greeting text "Hello! I'm Crux. Ask me about your projects, or what the agents are up to." and 3 starter prompts ("What are the agents working on?", "Any gates waiting for my approval?", "Summarize this page for me"). "Open full view" link present, points to `/crux/ask`. No "Ask Crux" top-menu entry — confirmed absent by design. Sent a real message ("What are the agents working on?") — got a genuine grounded reply routed through the Project Manager, citing real fleet/gate data (27 agents online, 11 gates across 6 Work Packages, real wp-ids), with real model attribution (`anthropic/claude-haiku-4.5 · 66,964 in / 317 out · $0.0548 (est.)`) — confirms chat is genuinely live, not echo fallback.

---

### TC-CRX-002: Top-menu "Crux" entry opens the dashboard

**User Role:** Logged-in user with `view_crux` on at least one role.
**Precondition:** None.

**Steps:**
1. Log in.
2. Locate the top-menu entry (caption admin-configurable, default likely "Crux").
3. Click it.

**Expected Result:**
- The entry is visible for a logged-in user (per `init.rb`: `if: proc { User.current.logged? && Setting...['nav_top_crux'] != '0' }` — on by default).
- Clicking it opens the Crux dashboard (`crux_dashboard#index`) without error.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS. Top-menu "Crux" entry visible after login, clicked it, landed on `/crux` — dashboard rendered with real live data (KPI tiles: 3 outcomes delivered, $9.4 cost/outcome, 18,952,339 tokens, $28.19 cost, 515 runs, 27 agents online; Agent Fleet table with 6 rows + "View All"; Ready Queue; Work Packages pipeline view with 10 real WPs incl. live approve-gate buttons; Run Ledger table with real rows through run-517). No errors.

---

### TC-CRX-003: Top-menu "Agents" entry is hidden by default

**User Role:** Logged-in user.
**Precondition:** Plugin setting `nav_top_agents` left at its default (not explicitly set to `"1"`).

**Steps:**
1. Log in without any prior change to the Crux plugin settings.
2. Check the top menu for an "Agents" entry.

**Expected Result:**
- No "Agents" top-menu entry is visible by default (`init.rb`: `if: ... Setting...['nav_top_agents'] == '1'` — opt-in, not opt-out).
- Then, as Administrator, enable `nav_top_agents` in the plugin settings and reload — the "Agents" entry should now appear and open the agent roster (`crux_agents#index`).

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS. Confirmed default-hidden state first — the TC-CRX-002 nav snapshot (fresh login, before any settings change) had no "Agents" entry. Opened Crux nav rail → Settings (`/crux/admin/settings`) — confirmed "Show the Crux entry in the top menu" checked, "Show the Agents entry in the top menu" unchecked (matches default). Checked the Agents checkbox, clicked Save, navigated to `/crux` — top menu now shows "Agents" → `/crux/agents`. Clicked it — opened `/crux/agents` (`crux_agents#index`, page titled "Crux — agent fleet") without error, "Fleet" section present with Upload Agent / + New Agent buttons.

---

### TC-CRX-004: Project-level "Crux" tab appears per-project, gated by `view_crux`

**User Role:** (a) Project member with `view_crux` on their project role; (b) project member without `view_crux`.
**Precondition:** A project exists with the Crux module enabled (project → Settings → Modules).

**Steps:**
1. As user (a), open the project and look for a "Crux" tab.
2. Click it.
3. As user (b) (same project, role without `view_crux`), repeat.

**Expected Result:**
- User (a) sees the "Crux" project tab; clicking it opens the per-project work graph (`crux_project#index`) without error.
- User (b) does not see the "Crux" tab (or is blocked if navigated to directly).

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. **Environment setup note:** the `crux-qa` project had the "Redmineflux Crux" module disabled entirely (and no non-admin users existed at all) — a standing local-env gap. Enabled the module (+ Issue tracking) in project Settings, and created two new local test users: `luna.blossom` (added as project member with role "Manager", which has all 5 Crux permissions incl. `view_crux`) and `daisy.skye` (added as project member with role "Reporter", which has zero Crux permissions). As `luna.blossom`: "Crux" project tab visible in the project menu, clicked it, opened `/projects/crux-qa/crux` without error (honest empty state — 0 outcomes/runs/agents, "No work packages yet.", since this project has no seeded data of its own). As `daisy.skye`: "Crux" project tab absent from the project menu; direct navigation to `/projects/crux-qa/crux` returned a genuine 403 Forbidden — confirms server-side enforcement, not just UI hiding. These two users remain available for the rest of this suite's membership/permission TCs.
- **Full permission-matrix pass (2026-09-14, prompted follow-up):** the checks above cover UI-element navigation AND direct-URL access for both the positive (`luna.blossom`) and negative (`daisy.skye`) side — this TC was fully covered on first pass, unlike several others below that initially skipped one side (now filled in, see their own CONFIRMED LIVE blocks).

---

### TC-CRX-005: `approve_crux_gates` on the GLOBAL dashboard does NOT actually require membership of the WP's own project — `require: :member` in `init.rb` is not what enforces this action

**User Role:** A user who holds `approve_crux_gates` via membership of some project, attempting to approve a gate on a Work Package that is not evidently tied to any project they are a member of.
**CORRECTED 2026-09-14 (live-confirmed, contradicts original TC premise):** the original TC expected `require: :member` in `init.rb` to mean the user must be a member of the *specific project the WP belongs to*. Live testing disproves this for the global dashboard's `approve_gate` action — see evidence below. `CruxDashboardController#authorize_gate_approval` (the actual enforcement, per source review) is `User.current.admin? || User.current.allowed_to_globally?(:approve_crux_gates)` — this checks whether the permission is granted via *any* of the user's project memberships, not membership in the WP's own project specifically. `init.rb`'s `require: :member` only controls whether the permission appears in the per-project vs. global section of the Roles admin UI — it does not, by itself, enforce project-scoped authorization; that's down to what the controller actually checks.
**Precondition:** A pending gate exists on a Work Package not tied to any project the test user belongs to.

**Steps:**
1. As a user who is a member of exactly one project (with `approve_crux_gates` on their role there), attempt to approve a gate on a WP shown on the GLOBAL dashboard that has no evident connection to that project.

**Expected Result / Actual behavior:**
- The approve action **succeeds** — this is the live-confirmed actual behavior, not a hypothesis. Whether this is intended (mirrors the global-dashboard-is-login-only-for-viewing pattern of TC-CRX-064/068/142, extended to writes) or a genuine cross-project authorization gap is worth flagging to the dev team, since gate approval is a sensitive write action (CRX-9/CRX-35's whole premise is that no agent write executes without deliberate human confirmation) — if that confirmation can come from a human with no real relationship to the affected project, the "human in the loop" guarantee is weaker than the permission's `require: :member` declaration implies.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): Logged in as `luna.blossom` (member of `crux-qa` project ONLY, role "Manager" with `approve_crux_gates`). Global dashboard (`/crux`) listed `wp-013` ("Track this invoice dispute through to payment", issue `#999004` — a synthetic/seed ID not belonging to the `crux-qa` project, which currently has zero issues of its own). Clicked "approve" on wp-013's `send-approve` gate → confirmation dialog ("Approve gate 'send-approve' for WP #wp-013? Acceptance: a human confirms payment is received and reconciled") → clicked "Approve" → **succeeded**: toast "gate 'send-approve' approved by luna.blossom", pipeline row updated to show "✓ send-approve" attributed to `luna.blossom`, next gate `collect-approve` now active. No membership check on wp-013's own project was enforced. See `bugs/open/BUG-CRX-003.md` for the filed finding — reported to the user as a candidate bug, not yet sent to production pending user decision.
- **Correction (2026-09-14, caught on review after the user questioned whether this was just expected permission behavior):** `luna.blossom` legitimately holding `approve_crux_gates` is NOT in question — that's correct and expected. Investigated further: `wp-013`'s issue (`#999004`) returns `404` on this Redmine instance — it isn't a real record here at all, and neither are `#12`/`#34` (checked directly). None of this environment's seeded Work Packages map to a real Redmine project. So this TC did **not** prove a genuine cross-project leak with real data — it proved (via reading `authorize_gate_approval`'s source directly) that the controller has **zero project-scoping logic at all**, tested against a WP that has no real project to scope against in the first place. See the corrected `BUG-CRX-003.md` for the precise, non-overstated version of this finding.
- **Negative case, added 2026-09-14 (prompted follow-up — initial pass only covered the positive/bug side):** as `daisy.skye` (zero Crux permissions, no `approve_crux_gates` via any membership): navigated to `/crux` via the top-menu "Crux" UI link (not a direct URL) — the `collect-approve` gate on `wp-013` rendered as `🚦 collect-approve` with **no "approve" button at all** (contrast with `luna.blossom`'s identical row, which showed the button) — confirms the UI genuinely hides the control, not just disables it, for a user with zero holding of the permission. Then confirmed server-side enforcement too: `POST /crux/gate` (the actual route behind the button, from `routes.rb`: `post 'crux/gate', to: 'crux_dashboard#approve_gate'`) with `{wp_id: 'wp-013', gate_id: 'collect-approve'}` → `403`, `{"error":"approval requires the approve_crux_gates permission"}`. So: zero-permission is blocked both in the UI and at the endpoint; a permission-holder from an unrelated project is wrongly allowed through (the BUG-CRX-003 gap) — the negative case itself is correctly enforced, only the project-membership boundary is missing.

---

### TC-CRX-006: `use_ask_crux` does NOT require project membership (unlike `approve_crux_gates`)

**User Role:** A user whose role grants `use_ask_crux`, who is **not** a member of a specific project.
**Precondition:** A project this user is not a member of, containing some data (issues, etc.).

**Steps:**
1. As this user, open the Ask Crux chat bubble.
2. Ask a question that would require data from the project they are not a member of (e.g. "what issues are open in [project name]?").

**Expected Result:**
- The chat UI itself is usable — `use_ask_crux` only requires `:loggedin`, not project membership (confirmed via `init.rb`).
- **The key thing to verify:** does the agent's actual data access stay correctly scoped to what this user's own Redmine permissions allow (per CRX-12's "never more than the user's own Redmine permissions" invariant), even though the chat UI itself doesn't block non-members? If the agent successfully returns real data from a project this user has no Redmine access to, that is a security bug — file it immediately, Medium/High depending on data sensitivity exposed.
- (This TC may be partially blocked until an LLM key is added — with only the echo fallback active, a real per-project data query can't be meaningfully tested yet. Attempt what's possible now — e.g. HTTP-level testing of the underlying endpoint — and re-run fully once a key is added.)

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS — clean result, no data leak. **Setup:** created a second project "Crux QA Private" (`crux-qa-private`, made non-public after discovering new projects default to Public — a one-time env gotcha, not a plugin issue), added a marker issue there (`#1`, subject `PRIVATE-MARKER-7f3a...`). `luna.blossom` (member of `crux-qa` only) confirmed blocked from viewing `/issues/1` directly (genuine 403, proving real isolation). Asked the chat bubble "Is there an issue with subject containing PRIVATE-MARKER-7f3a? ...": Crux (routed through Project Manager) replied it found **no such issue** — correctly did not leak the private project's data. **Control check:** created a second marker issue (`#2`, `PUBLIC-MARKER-9c2e...`) in `crux-qa` itself (a project this user IS a member of, after fixing an unrelated env gap — the project had no trackers assigned, causing a Redmine-core 500 on new-issue, fixed via project Settings → Issue tracking → Trackers), then asked the same style of question — Crux correctly found and reported it ("Issue #2 ... is in the Crux QA ..."). This proves the earlier "not found" result was genuine permission-scoping (CRX-12's invariant holds), not a broken/limited search. Chat UI itself was fully usable in both cases regardless of membership, confirming `use_ask_crux` truly only requires `:loggedin`.
- **Re-executed 2026-09-14 (manual, guided) — hit and fixed a real infrastructure bug along the way (BUG-CRX-004):** during manual re-testing of both questions, every chat message failed with *"I couldn't reach the tool server: Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found"* — reproducible even in a brand-new chat session. Root-caused via `redmineflux-crux-core/crux_core/askcrux/mcp_client.py`: crux-core keeps one process-wide MCP connection singleton, reused by every user, and it never detects a `404` (expired `Mcp-Session-Id`) as "reconnect" — so one stale session (likely from the multi-day idle gap since the prior test session) broke Ask Crux for everyone until manually fixed. Fixed by restarting the `crux-core` container (clears its in-memory session cache) — confirmed via logs: `tools/list` succeeded immediately after (94 tools), followed by successful `redmineflux_core_search`/`redmineflux_core_get_issue` calls. Filed as `bugs/open/BUG-CRX-004.md` (High — full, self-inflicted, non-recovering outage of the chat feature for all users). **After the fix, both TC-CRX-006 questions were re-verified and matched the original evidence exactly:** the private-marker question got *"No issue found with that marker. The search returned no results for `PRIVATE-MARKER-7f3a`. This could mean: The issue doesn't exist in this Redmine instance / It's in a project you don't have access to / ..."* (honest, non-leaking, and transparently lists the true reason as one possibility) and the public-marker question got *"Issue #2 with the subject containing `PUBLIC-MARKER-9c2e` is in the Crux QA project. It's a Bug marked as 'New', unassigned, and created today as a control fixture for cross-project isolation testing."* (correct, matches the real record).

---

### TC-CRX-007: `manage_crux_agents` and `manage_crux_pipelines` are global permissions, not per-project

**User Role:** A user with `manage_crux_agents`/`manage_crux_pipelines` granted on a role, assigned globally (Administration → Roles → the global-permissions view), not via any specific project membership.
**Precondition:** None.

**Steps:**
1. Confirm in Administration → Roles that these two permissions appear under the role's **global** permissions (not the per-project permissions list) — per `init.rb`'s `global: true`.
2. As a user with the role, attempt to pause/create an agent and to save/delete a pipeline template, without being a member of any project.

**Expected Result:**
- Both permissions are listed/assignable as global permissions in the role admin UI.
- The user can perform agent-pause and pipeline-save/delete actions without needing project membership anywhere.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS for both permissions, as `luna.blossom` (member of `crux-qa` only). **Pipelines:** created a full custom pipeline ("QA Test Pipeline CRX-007", 2 stages) — a genuine client-side validation correctly blocked saving without a gate before the terminal stage ("a pipeline can never let a Work Package reach its terminal stage ... without a human-approved gate"), confirming CRX-9/35's write-safety invariant is enforced even at template-design time; added a gate, saved successfully, edited a stage name, then deleted it — full CRUD cycle worked with no project-scoping involved at all (pipelines have no project selector in the UI, confirming TC-CRX-067's "global template" design). **Agents:** created a custom agent ("QA Test Agent CRX-007") via "+ New Agent" as `luna.blossom` — saved successfully, confirming `manage_crux_agents` works without any project membership beyond `crux-qa`. (A second test agent was created while debugging the false-alarm below, that time as admin — not part of the permission-boundary evidence itself.) Both test agents rendered correctly in the Fleet table with full Pause/Edit/Retire actions and were retired cleanly at the end. Confirms `manage_crux_agents`/`manage_crux_pipelines` work as true global permissions. **Note:** initially suspected the new agents were invisible in the Fleet UI (missing from an accessibility snapshot taken immediately after creation) — verified via `browser_evaluate`/DOM inspection this was a snapshot-timing race (client-side JS re-renders the table asynchronously after a `/crux/agents.json` fetch) and a `textContent`-based search artifact (icon-only Pause/Edit/Retire buttons have no text content), not a real defect. No bug filed for this — see `[[feedback_verify_absent_field_via_dom_before_filing]]`.
- **Minor observation (not filed as a bug):** the Agent Fleet page fires a background fetch to `/crux/admin/keys/providers.json` (admin-only) even for non-admin sessions, producing a benign console 403 and leaving the "New Agent" dialog's Provider dropdown stuck on "providers unavailable — is crux-core running?" for non-admin users — cosmetic/DX rough edge, not a security issue (the 403 itself is correct enforcement, see TC-CRX-008).
- **Negative case, added 2026-09-14 (prompted follow-up — original pass had no negative-permission check at all):** as `daisy.skye` (zero Crux permissions, no `manage_crux_agents`/`manage_crux_pipelines`): navigated via UI (top-menu "Agents" and the Crux nav rail's "Pipelines" link) to both `/crux/agents` and `/crux/pipelines`. Both pages still render their full read-only tables (confirms viewing is login-only, consistent with TC-CRX-068's pattern) — but the entire management UI is gone: no "+ New Agent"/"Upload Agent" buttons and no "Actions" column at all on the agents table; no "+ New Pipeline" button and no "Actions" column on the pipelines table (not disabled buttons — genuinely absent elements). Confirmed server-side too, via the exact routes behind those forms: `POST /crux/agents` → `403 {"ok":false,"error":"You are not allowed to manage agents."}`; `POST /crux/pipelines` → `403 {"ok":false,"error":"You are not allowed to manage pipelines."}`. Both permissions are correctly enforced both in the UI and at the endpoint for a genuinely permission-less user.

---

### TC-CRX-008: Admin-only Crux pages are Administrator-gated regardless of Crux role permissions

**User Role:** A non-admin user granted **all five** Crux permissions (`view_crux`, `approve_crux_gates`, `use_ask_crux`, `manage_crux_agents`, `manage_crux_pipelines`).
**Precondition:** Confirm this user's account is not flagged as Redmine Administrator.

**Steps:**
1. As this user, attempt to reach each of: Administration → Crux — providers & keys; Administration → Crux — logs; Administration → Crux — frozen rules (via the admin menu if visible, or by direct navigation to confirm server-side enforcement).

**Expected Result:**
- None of the three pages are reachable — each controller is protected by `require_admin` directly (per `init.rb` comments), independent of any Crux-specific role permission. Having all five Crux permissions does not grant access.
- As an actual Administrator, the same three pages load successfully.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. As `luna.blossom` (all 5 Crux permissions via the Manager role, not a Redmine Administrator): direct navigation to `/crux/admin/keys`, `/crux/admin/logs`, and `/crux/admin/frozen_rules` all returned genuine `403 Forbidden` — confirms `require_admin` is enforced server-side regardless of Crux permissions held. The Crux nav rail itself also only showed Dashboard/Ask Crux/Agent fleet/Pipelines for this user (no Providers & keys/Logs/Frozen rules/Settings entries), matching the earlier admin session where all rail entries were visible.
- **Positive case, added 2026-09-14 (prompted follow-up — original pass inferred this from the rail entries being present, never actually clicked through):** as admin, from `/crux`, clicked the Crux nav rail's "Providers & keys" link → landed on `/crux/admin/keys` ("Crux — model providers & keys", real Providers/Keys sections rendered). Back to `/crux`, clicked "Logs" → `/crux/admin/logs` ("Crux — activity log", real log-line content). Back to `/crux`, clicked "Frozen rules" → `/crux/admin/frozen_rules` ("Crux — frozen rules" section rendered). All three genuinely open via real UI navigation clicks, not just inferred from the rail listing them.
- **Second negative-user pass, added 2026-09-14 (double-checked on explicit request):** the negative case above used `luna.blossom` (all 5 Crux permissions, still not admin) — the TC's own intent, to prove permissions don't imply admin. Additionally re-ran all three direct-URL checks as `daisy.skye` (zero Crux permissions at all, also not admin), for full belt-and-suspenders coverage: `/crux/admin/keys`, `/crux/admin/logs`, `/crux/admin/frozen_rules` all returned `403 Forbidden` for this user too. Every URL this suite touches now has a confirmed-blocked direct-URL result from at least one genuinely unauthorized user, and every admin-only URL specifically has been checked with both a permission-holding-but-non-admin user and a zero-permission user.

---

### TC-CRX-009: Crux settings page (core URL) is reachable outside Administration

**User Role:** Administrator (or whichever role the Crux nav rail settings entry actually requires — confirm during execution).
**Precondition:** None.

**Steps:**
1. Locate the Crux settings page via the in-app Crux nav rail (CRX-50 — explicitly not under the standard Administration → Plugins path per the plugin README).
2. View/edit the core service URL setting.

**Expected Result:**
- The settings page is reachable from the Crux nav rail itself, not only via Administration → Plugins → Redmineflux Crux → Configure.
- Saving a change merges into existing settings rather than replacing the whole settings object (per plugin README: "merge-not-replace").

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS. Reached `/crux/admin/settings` directly from the Crux nav rail's "Settings" link (confirmed requires Administrator — see TC-CRX-008, this rail entry was absent for `luna.blossom`). Changed only "Top-menu caption" to "Crux QA Test" and saved — reloaded the page and confirmed every other field (Greeting, Bubble position, Panel size, Accent color, Suggested prompts, Core service URL, Crux/Agents nav checkboxes) was untouched, and the top-menu link text changed to "Crux QA Test" live. Confirms merge-not-replace. Reverted the caption back to blank afterward. **Side note:** the retired test agents from TC-CRX-007 (`QA Test Agent CRX-007`/`-007b`) still appear as selectable options in the "Chat agents" picker list on this page despite being retired — cosmetic, not filed as a bug (retired agents may legitimately need to stay listed for existing picker configs referencing them; not investigated further).
- **Negative case, added 2026-09-14 (prompted follow-up — original pass tested only the positive/admin side):** as `daisy.skye` (zero Crux permissions, not an Administrator): direct navigation to `/crux/admin/settings` → genuine `403 Forbidden` — same `require_admin` enforcement as the other three admin pages in TC-CRX-008, now confirmed for the Settings page specifically too.

---

## Negative Cases

---

### TC-CRX-010: A user with no Crux permissions at all sees no Ask Crux bubble/wand, but CAN still see top-menu Crux/Agents and view the (global) dashboard

**User Role:** A user whose role has none of the five Crux permissions granted.
**CORRECTED 2026-09-11 (source review):** the original Expected Result speculated the bubble's absence was unconfirmed and that ALL Crux UI should vanish. Source review resolves this precisely — see the two different mechanisms below. Do not expect uniform "everything hidden" behavior; the two menu entries and the bubble/wand are gated completely differently.

**Steps:**
1. Log in as this user (zero Crux permissions, including no `use_ask_crux`).
2. Check for the chat bubble and the Improve wand on an issue page.
3. Check the top-menu for "Crux" and "Agents" entries (with `nav_top_agents` enabled).
4. Click the top-menu "Crux" entry if visible.

**Expected Result:**
- **Bubble and wand: ABSENT** — confirmed via `view_hooks.rb`, gated by `use_ask_crux || admin`, checked server-side before any rendering.
- **Top-menu "Crux"/"Agents" entries: STILL VISIBLE** — per `init.rb`, both menu items' `if:` proc only checks `User.current.logged?` (+ the relevant `nav_top_*` setting) — **no permission check at the menu-item level at all**.
- **Clicking through to the global dashboard: SUCCEEDS** — `CruxDashboardController` only has `before_action :require_login` for `index`/`data`; there is no `view_crux` enforcement at the global scope (see TC-CRX-142 in `CRUX_DASHBOARD_GRAPH_PIPELINE.md` for the full test of this — confirmed by the controller's own code, not an assumption).
- If any of this doesn't match live behavior (e.g. the menu entries turn out to actually be hidden, or the dashboard actually does block access), that's a real, reportable discrepancy between source and behavior — flag it, don't assume the TC's prediction was right.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS, matches the corrected prediction exactly. As `daisy.skye` (Reporter role, zero Crux permissions, member of `crux-qa`): no floating "Ask Crux" bubble button anywhere (checked on `/my/page`, the Crux dashboard, and an issue page) — genuinely absent, not just hidden. No "Improve with Crux" wand on the issue page either. Top-menu "Crux" and "Agents" entries were both visible and clickable — clicked "Crux" and the global dashboard loaded successfully with real data ("Crux — humans & agents, one board"), no 403/block of any kind. Confirms the two-different-mechanisms finding precisely: menu-item visibility and global-dashboard access are login-only, while the bubble/wand are genuinely `use_ask_crux`-gated server-side.

---

## Additional Cases (added 2026-09-11 after full controller/route source review)

---

### TC-CRX-139: Ask Crux bubble, Improve wand, mention-poll trigger, and WP badge are all absent from the DOM (not just disabled) without `use_ask_crux`

**User Role:** A logged-in user whose role lacks `use_ask_crux` (not an Administrator).
**Precondition:** An issue exists that this user can view.

**Steps:**
1. Load any Redmine page as this user — check page source/DOM for any bubble-related markup.
2. Open an issue's detail page — check for the wand, the (invisible) mention-poll trigger, and the WP badge partial in the DOM.

**Expected Result:**
- None of the four partials (`crux_hooks/bubble`, `crux_hooks/improve`, `crux_hooks/mentions_poll`, `crux_hooks/wp_badge`) are rendered into the page at all — confirmed via `view_hooks.rb`'s `return ''` guard before any `render_to_string` call. This is a genuine server-side absence, not a CSS `display:none` — inspect the raw HTML/DOM to confirm, not just visual appearance.
- As Administrator (or a user WITH `use_ask_crux`), all four render normally.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. On the same issue page (`/issues/2`), did a raw `document.documentElement.outerHTML` string search (not an accessibility-snapshot text search — deliberately avoided that trap per `[[feedback_verify_absent_field_via_dom_before_filing]]`) for markers of all four partials: `crux-bubble-root` (bubble), `Improve with Crux`/`crux-improve` (wand), `pollCruxMentionsOnce`/`/crux/mentions/poll` (mention-poll trigger's inline script — found only after first locating its exact marker via an admin-session comparison), `wp_badge`/`wp-badge`/`crux-wp-badge` (WP badge). As `daisy.skye` (zero Crux permissions): all four markers **absent** from the raw HTML. As admin on the identical page: all four **present** (bubbleRoot, improveWand, wpBadge, and the `pollCruxMentionsOnce`/`/crux/mentions/poll` inline script all found). Confirms genuine server-side non-rendering, not CSS hiding, for all four partials — not just the bubble/wand already covered by TC-CRX-001/010.

---

### TC-CRX-140: `crux_ask`'s page action and JSON actions fail differently when unauthorized

**User Role:** A logged-in user lacking `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Navigate directly to `/crux/ask` (the full-page chat client).
2. Separately, attempt a direct call to a JSON action (e.g. `POST /crux/ask.json`, or `/crux/ask/confirm`).

**Expected Result:**
- Step 1 renders Redmine's own standard "access denied" page (`deny_access`) — per `crux_ask_controller.rb`'s `authorize_ask_crux`, which special-cases `action_name == 'index'`.
- Step 2 instead returns a JSON `403 Forbidden` body `{"ok": false, "error": "You are not allowed to use Ask Crux."}` — the same underlying check, deliberately different response shape depending on whether the caller is a full-page load or an API call.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS, byte-for-byte match. As `daisy.skye` (no `use_ask_crux`): `GET /crux/ask` → `403` with Redmine's standard page ("You are not authorized to access this page."), same template as any other Redmine `deny_access`. `POST /crux/ask.json` (via authenticated in-page `fetch`, with a valid CSRF token) → `403`, `content-type: application/json`, body exactly `{"ok":false,"error":"You are not allowed to use Ask Crux."}` — matches the predicted string precisely.

---

### TC-CRX-141: `crux/gate_evidence` requires the exact same check as `approve_gate` — confirmed to be `allowed_to_globally?`, not target-project membership

**User Role:** (a) A user holding `approve_crux_gates` via membership of some project; (b) a user with no Crux permissions at all.
**CORRECTED 2026-09-14 (live-confirmed, consistent with TC-CRX-005/BUG-CRX-003):** the original TC's "member of target project" framing for user (b) is the same incorrect assumption corrected in TC-CRX-005 — `authorize_gate_approval` genuinely doesn't check the WP's own project membership, only `allowed_to_globally?(:approve_crux_gates)`. Rewritten as a clean permission-holder-vs-non-holder contrast instead.
**Precondition:** A gate with evidence exists on a Work Package (e.g. `wp-013`'s `send-approve`, approved during TC-CRX-005).

**Steps:**
1. As user (a), call `GET /crux/gate_evidence?wp_id=wp-013&gate_id=send-approve`.
2. As user (b), attempt the same call.

**Expected Result:**
- User (a) succeeds — the endpoint shares `CruxDashboardController#authorize_gate_approval` with `approve_gate` (`before_action ..., only: [:approve_gate, :gate_evidence]`), confirmed to be the exact same `allowed_to_globally?(:approve_crux_gates)` check, not a separate/looser one.
- User (b) is refused (403) with a clear JSON error.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. As `daisy.skye` (zero Crux permissions): `GET /crux/gate_evidence?wp_id=wp-013&gate_id=send-approve` → `403`, `{"error":"approval requires the approve_crux_gates permission"}`. As `luna.blossom` (has `approve_crux_gates` via `crux-qa` membership — see TC-CRX-005's correction: `wp-013`/issue `#999004` isn't a real Redmine record on this instance, so "not a member of that project" isn't strictly demonstrable here; the finding is that the check is global with no project lookup at all, not a proven cross-project leak): same call → `200`, full real evidence JSON returned (`{"ok":true,"wp_id":"wp-013","gate_id":"send-approve","runs":[],"artifacts":[],...,"chain":[{"id":"send-approve","approved_by":"luna.blossom","approved_at":"2026-09-14T06:58:31+00:00"}],...}`) — matches the exact gate `luna.blossom` itself approved in TC-CRX-005, confirming byte-for-byte that `gate_evidence` and `approve_gate` share the identical (global-only) authorization check.
- **UI-element check, added 2026-09-14 (prompted follow-up):** looked for a real clickable UI path to this endpoint on the global dashboard (rather than testing only via direct `fetch`). Inspected the approved gate's `✓ send-approve` marker directly in the DOM: it's a plain `<span class="crux-gate crux-gate-ok" title="by luna.blossom">✓ send-approve</span>` — `cursor: auto`, no `onclick` handler, not a link or button. **There is no discoverable UI element anywhere on the dashboard that triggers `gate_evidence`** — it's reachable only via direct API/URL call from this surface (possibly intended for a different UI, e.g. a future evidence-detail panel, or consumed by another agent rather than a human). Testing this TC via `fetch` was therefore the correct (only available) approach, not a shortcut around a UI path that exists.

---

## Evidence Map

- Case IDs: TC-CRX-001 through TC-CRX-010, TC-CRX-139 through TC-CRX-141 — **all 13 executed 2026-09-14, all PASS** (see CONFIRMED LIVE blocks inline above).
- Screenshots: not required per session default (bugs only, per `CLAUDE.md` §6) — none of these cases failed, so none were taken.
- Log: —
- Bug reference: BUG-CRX-003 (found during TC-CRX-005 — global gate approval doesn't verify target-project membership; local only, not yet reported to production).
- Local test fixtures created this session (kept for reuse by later suites): users `luna.blossom` (Manager role) / `daisy.skye` (Reporter role, zero Crux permissions) — both from the shared seed pool in `QA_CREDENTIALS.md`, password `12345678` — projects `crux-qa` (Crux + Issue tracking modules enabled, trackers assigned) and `crux-qa-private` (non-public, isolation-test fixture, contains issue #1 `PRIVATE-MARKER-7f3a`), plus issue #2 `PUBLIC-MARKER-9c2e` in `crux-qa`. Full registry (incl. the test agents/pipeline created+cleaned up in TC-CRX-007, and the seeded `wp-013` gate permanently consumed in TC-CRX-005) tracked in `automation/testdata/CRUX_TESTDATA_LOCAL.xlsx` per `CLAUDE.md` §13a.
- **Note (2026-09-14, corrected mid-session):** these two users were originally created with ad-hoc names (`crux_qa_manager`/`crux_qa_reporter`) and a custom password, violating `QA_CREDENTIALS.md` Authentication Rule #1 ("always use the existing configured users ... do not create random/ad hoc users"). Caught by the user and fixed: both accounts renamed in place (same underlying Redmine user, same test history) to `luna.blossom`/`daisy.skye` from the shared seed pool, password reset to the shared `12345678`, and every mention throughout this suite file (plus `BUG-CRX-003.md` and `CRUX_HANDOFF.md`) updated to match. Use the seed pool for any new fixture users going forward, on this or any other plugin's environment.
