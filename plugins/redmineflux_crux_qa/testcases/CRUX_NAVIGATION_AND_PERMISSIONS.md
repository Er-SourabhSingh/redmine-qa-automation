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

---

### TC-CRX-005: `approve_crux_gates` requires actual project membership

**User Role:** A user whose *global* role grants `approve_crux_gates`, but who is **not** a member of the target project.
**Precondition:** At least one project exists that this user is not a member of. A pending gate exists on that project's Work Package if possible (else confirm via the controller-level requirement alone).

**Steps:**
1. As this user, attempt to reach the gate-approval action for that project (via the dashboard's approve control, or the underlying `crux_dashboard#approve_gate` action if navigated to directly).

**Expected Result:**
- The approve action is refused/unavailable — `approve_crux_gates` is declared `require: :member` in `init.rb`, so having the permission on a role is not sufficient; the user must actually be a member of that specific project.
- Compare against the same user added as a project member with the same permission — the approve action should then work.

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

---

### TC-CRX-008: Admin-only Crux pages are Administrator-gated regardless of Crux role permissions

**User Role:** A non-admin user granted **all five** Crux permissions (`view_crux`, `approve_crux_gates`, `use_ask_crux`, `manage_crux_agents`, `manage_crux_pipelines`).
**Precondition:** Confirm this user's account is not flagged as Redmine Administrator.

**Steps:**
1. As this user, attempt to reach each of: Administration → Crux — providers & keys; Administration → Crux — logs; Administration → Crux — frozen rules (via the admin menu if visible, or by direct navigation to confirm server-side enforcement).

**Expected Result:**
- None of the three pages are reachable — each controller is protected by `require_admin` directly (per `init.rb` comments), independent of any Crux-specific role permission. Having all five Crux permissions does not grant access.
- As an actual Administrator, the same three pages load successfully.

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

---

### TC-CRX-141: `crux/gate_evidence` requires the exact same permission as `approve_gate`

**User Role:** (a) A project member with `approve_crux_gates`; (b) a user with `approve_crux_gates` on a global role but not a member of the target project.
**Precondition:** A pending gate with evidence exists on a Work Package.

**Steps:**
1. As user (a), call `GET /crux/gate_evidence?wp_id=...&gate_id=...` for that gate.
2. As user (b), attempt the same call.

**Expected Result:**
- User (a) succeeds — the endpoint shares `CruxDashboardController#authorize_gate_approval` with `approve_gate` (`before_action ..., only: [:approve_gate, :gate_evidence]`), so it's correctly member + `approve_crux_gates` gated, not a separate/looser check.
- User (b) is refused (403) — same membership requirement as TC-CRX-005/029, now confirmed for the evidence-viewing endpoint specifically, not just inferred from the approve endpoint.

---

## Evidence Map

- Case IDs: TC-CRX-001 through TC-CRX-010, TC-CRX-139 through TC-CRX-141
- Screenshots: not required per session default (bugs only, per `CLAUDE.md` §6) — capture only if a case fails and becomes a bug.
- Log: —
- Bug reference: —
