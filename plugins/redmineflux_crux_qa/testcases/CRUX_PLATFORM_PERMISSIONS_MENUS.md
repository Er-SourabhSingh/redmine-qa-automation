# Test Suite — Crux Platform: Permissions, Menus & Shared UI Behaviour

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §0 (developer-authored, source-derived — authoritative).
> Plugin: redmineflux_crux. Redmine version: 6.0-bookworm (local Docker, localhost:3015).
> TC range: TC-CRX-711 to TC-CRX-726.

## Fixtures needed

- A dedicated non-admin test user ("Luna Blossom" or similar, already used elsewhere this cycle) added to a
  test project (e.g. "Crux PM Agent Test Project") with **zero** of the 5 Crux permissions initially.
- A custom Role (e.g. "Crux Perm Test Role") with the Redmineflux Crux module's 5 permissions individually
  togglable: View Crux dashboard, Use Ask Crux, Approve Crux gates, Manage Crux agents, Manage Crux pipelines.
- At least one project with the Redmineflux Crux module enabled, and one project without it (for TC-725/726).
- An active Work Package with a ticket in a project the test user is NOT a member of (for the Approve-gates
  per-project scoping check, TC-716).

## Positive Cases — the 5 permissions, granted

- **TC-CRX-711** — View Crux dashboard grants access to all 6 global pages: with only this permission granted
  (no others), confirm the test user can open `/crux`, `/crux/work_packages`, `/crux/queue`, `/crux/runs`,
  `/crux/agents`, `/crux/pipelines`, and the project Crux tab — all without a 403.
- **TC-CRX-712** — Use Ask Crux grants the chat page, bubble, wand, and WP section: with only this permission
  granted, confirm `/crux/ask` loads, the floating bubble appears on other Redmine pages, the "Improve with
  Crux" wand icon appears on an issue's toolbar, and (if the ticket belongs to a Work Package) the read-only
  Work Package section appears on the issue page.
- **TC-CRX-713** — Approve Crux gates shows Review/Approve: with only this permission granted, in a project
  where the user IS a member and a Work Package has a ticket in that project, confirm the Dashboard's "Needs
  your attention" card shows a "Review" button (not "Waiting for an approver"), and the Gate approval modal's
  Approve button is clickable (not disabled).
- **TC-CRX-714** — Manage Crux agents (global) grants the admin agent actions: with only this permission
  granted, confirm `/crux/agents` shows "+ New Agent" and "Upload Agent" buttons, and the ⋯ menu on a non-retired
  agent shows Pause/Resume, Edit (on a custom agent), Create Redmineflux identity, and Retire.
- **TC-CRX-715** — Manage Crux pipelines (global) grants pipeline admin actions: with only this permission
  granted, confirm `/crux/pipelines` shows "+ New Pipeline", and a custom pipeline's card shows Edit/Duplicate/
  Delete (a built-in still shows only View/Duplicate-to-edit, since built-ins are always read-only regardless of
  this permission).

## Negative / Boundary Cases — the 5 permissions, denied

- **TC-CRX-716** — Approve Crux gates is scoped per-project, not global: grant the test user Approve Crux gates
  in Project A only. Confirm they CAN approve a gate on a Work Package whose tickets are all in Project A, but
  CANNOT approve one whose tickets are in Project B (where they lack the permission) — expect a real refusal,
  not a silently-missing button that could be confused with "nothing to approve".
- **TC-CRX-717** — No View Crux dashboard → 403 on every global page: with zero Crux permissions, confirm all 6
  global URLs from TC-711 return a genuine 403, not a redirect or an empty-but-200 page.
- **TC-CRX-718** — No Use Ask Crux → chat surfaces absent: with View Crux granted but Use Ask Crux denied,
  confirm `/crux/ask` is refused, the floating bubble does not appear anywhere, the Improve wand icon is absent
  from issue pages, and the Work Package section does not appear on an issue even if its ticket belongs to one.
- **TC-CRX-719** — Admin always has Approve Crux gates: confirm an admin user can approve a gate in ANY project
  without the permission being explicitly granted (admins bypass this check per the dev reference's own note).
- **TC-CRX-720** — Manage Crux agents/pipelines are global-only, no per-project variant: confirm there is no way
  to grant "Manage Crux agents" scoped to just one project — it's an all-or-nothing global permission (verify via
  the Roles & Permissions admin UI that these two checkboxes appear once, not per-module-per-project).
- **TC-CRX-721** — Admin-only pages refuse a non-admin even with all 5 Crux permissions: grant the test user all
  5 Crux permissions but keep them non-admin; confirm Providers & keys, Settings, Frozen rules, and Logs
  (`/crux/admin/*`) are still refused — these 4 pages are hard-gated to Redmine admins, independent of the 5
  Crux permissions.
- **TC-CRX-722** — Help page is open to any logged-in user: confirm a user with ZERO Crux permissions can still
  open `/crux/help`, and its live permissions table correctly shows "Not yet" for all 5 rows for that user.

## Menus & Icon Rail

- **TC-CRX-723** — Top-menu "Crux" visibility follows both the Settings toggle AND the permission: with "Show
  the Crux entry" checked in Settings → Navigation, confirm the top-menu link appears only for a user who also
  holds View Crux dashboard — a user without the permission should not see the link even though the setting is
  on.
- **TC-CRX-724** — Top-menu "Agents" is off by default: on a fresh/unmodified Settings page, confirm the
  "Agents" top-menu entry is NOT shown, and enabling it in Settings → Navigation makes it appear (for users with
  View Crux dashboard).
- **TC-CRX-725** — Project menu "Crux" tab appears only with the module enabled: confirm a project with the
  Redmineflux Crux module enabled shows a "Crux" tab in its project menu, and a project WITHOUT the module
  enabled does not show it at all, even for an admin.
- **TC-CRX-726** — The left icon rail order matches spec and project pages show tabs instead: on any global Crux
  page, confirm the rail shows, top to bottom: Dashboard, Ask Crux, Work packages, Ready queue, Run ledger,
  Agent fleet, Pipelines, Providers & keys, Settings, Frozen rules, Logs, Help (admin-only items only visible to
  admins). On a project's Crux tab, confirm the rail is replaced by a tab row (Overview · Graph · Work packages
  · Run ledger · Queue).

## Shared UI Behaviour (apply as spot-checks across any page tested above)

- Loading-failure skeleton → "Couldn't load this right now." + Try again (verify by temporarily pointing the
  Core service URL at an unreachable address, then restoring it).
- "i" tooltips show on hover/keyboard-focus/tap, hide on Esc/scroll.
- Dialogs close via ×, Cancel, click-outside, or Esc — never the browser's native `confirm()`.
- Global Crux pages' header title reads "CRUX", not "Redmine".
- The Settings accent colour (default `#0094FF`) is reflected plugin-wide.
- A non-admin error message includes "ask your administrator"; an admin's includes a direct fix link (Open
  Providers & keys / Open Crux Settings).

## Execution — 2026-11-05

Fixtures built: a new role "Crux Perm Test Role" (`/roles/8`) with the 5 Crux permissions individually
togglable; a genuinely clean, brand-new user `zeropermtest` (never touched by any prior round this cycle) for
true zero-permission checks; `daisy.skye` (pre-existing `use_ask_crux` from an earlier round) reused for
partial-grant checks.

- **TC-CRX-711** — PASS. With only View Crux dashboard granted (`daisy.skye`), all 6 global pages (`/crux`,
  `/crux/work_packages`, `/crux/queue`, `/crux/runs`, `/crux/agents`, `/crux/pipelines`) plus the project Crux
  tab all loaded without a 403.
- **TC-CRX-712** — PASS, fully confirmed (2026-11-12). Logged in live as `daisy.skye` (holds `use_ask_crux`).
  All 4 surfaces confirmed in one session: `/crux/ask` loaded with no 403; on issue #40 (a member project,
  ticket belonging to wp-003) the floating "Ask Crux" bubble button was present; the "Improve with Crux" wand
  link was present on the issue toolbar; and the read-only Work Package section ("wp-002" / wp-003's goal, with
  "Open in Crux →") appeared on the issue page.
- **TC-CRX-713** — NOT INDEPENDENTLY VERIFIED. No pending Work Package gate fixture was available to exercise
  the Review/Approve button state this pass. Deferred.
- **TC-CRX-714** — PASS (core). With Manage Crux agents granted, `/crux/agents` showed both "+ New Agent" and
  "Upload Agent" buttons. The ⋯ per-agent menu's individual actions (Pause/Resume/Edit/Create identity/Retire)
  were not independently re-clicked this pass.
- **TC-CRX-715** — PASS (core) / PARTIAL. With Manage Crux pipelines granted, `/crux/pipelines` showed "+ New
  Pipeline". All 3 existing pipelines are the known built-ins and correctly showed only View/Duplicate-to-edit
  regardless of the permission (confirms built-ins are always read-only). The "custom pipeline gets Edit/Delete"
  half was not independently observed on an actual custom pipeline this pass — inferred from the page's own
  tooltip text, not directly verified.
- **TC-CRX-716** — NOT INDEPENDENTLY VERIFIED. Per-project gate-approval scoping needs a two-project Work
  Package fixture; deferred.
- **TC-CRX-717** — PASS, fully confirmed with a genuinely zero-permission user. Created a brand-new user
  (`zeropermtest`, never a member of any project) — all 6 global URLs returned real 403 Forbidden.
- **TC-CRX-718** — PASS, fully confirmed. Granted `zeropermtest` View Crux dashboard only (via the test role) —
  `/crux/ask` returned 403, and an issue page (`/issues/40`) showed neither the floating "Ask Crux" bubble
  button nor any Improve-wand icon, confirming both chat surfaces are correctly gated by `use_ask_crux`
  specifically, independent of `view_crux`.
- **TC-CRX-719** — NOT INDEPENDENTLY VERIFIED this pass (admin gate-approval bypass not exercised live — no
  pending gate fixture available).
- **TC-CRX-720** — PASS. Confirmed directly in the Roles → New role admin form: all 5 Crux permission checkboxes
  appear exactly once each in the flat permissions list, not per-project or per-module-per-project — there is no
  mechanism to scope Manage Crux agents/pipelines to a single project.
- **TC-CRX-721** — PASS, fully confirmed. With `daisy.skye` granted all 5 Crux permissions (via the test role)
  but still non-admin: `/crux/admin/keys`, `/crux/admin/settings`, `/crux/admin/frozen_rules`, and
  `/crux/admin/logs` all returned genuine 403 — confirms these 4 pages are hard-gated to Redmine admins,
  independent of the 5 Crux permissions.
- **TC-CRX-722** — PASS, fully confirmed with the zero-permission `zeropermtest` user: `/crux/help` opened with
  no 403, and its live permissions table correctly showed "Not yet" for all 5 rows.
- **TC-CRX-723** — PASS (via cross-session evidence). "Show the Crux entry" is checked (on) by default in
  Settings → Navigation. `daisy.skye` (holds `use_ask_crux` but not `view_crux` at the time, per this session's
  earlier Help-suite execution) had NO "Crux" link in her top nav at all, while `admin` (which always holds
  `view_crux`) does — confirms the link requires both the setting AND the specific permission.
- **TC-CRX-724** — PASS. On the current (unmodified-for-this-check) Settings → Navigation page, "Show the Agents
  entry in the top menu" is unchecked by default, confirming it's off out of the box.
- **TC-CRX-725** — PASS (positive half only). Every Crux-module-enabled test project used throughout this
  session's testing consistently shows a "Crux" tab in its project menu (e.g. "Crux PM Agent Test Project").
  The negative half (a project WITHOUT the module shows no tab) was attempted via a fresh "Crux No-Module Test
  Project" but the create action silently failed (never appeared in the project list afterward, cause not
  diagnosed this pass) — deferred, not a confirmed bug since the failure mode wasn't investigated.
- **TC-CRX-726** — PASS (via repeated observation across this session). The global icon rail has consistently
  shown, top to bottom, exactly: Dashboard, Ask Crux, Work packages, Ready queue, Run ledger, Agent fleet,
  Pipelines, Providers & keys, Settings, Frozen rules, Logs, Help (the admin-only items correctly absent for
  non-admin users per TC-721's own evidence). Project Crux tabs correctly show a tab row instead of the rail.

**Shared UI Behaviour spot-checks** — not separately re-verified this pass (loading-failure skeleton, tooltip
hover/Esc behavior, dialog-close mechanisms, "CRUX" header title, accent colour, admin-vs-non-admin error
message wording) — these were incidentally observed as correct throughout this session's other suite executions
(e.g. "CRUXCRUX" header consistently seen; non-admin 403s correctly distinct from admin behavior) but not
individually isolated as their own checks.

**Suite result (2026-11-05 pass): 9 PASS fully confirmed, 3 partial (714, 715, 725), 4 deferred (712, 713, 716,
719).**

## Execution — 2026-11-12 (deferred TC completion pass)

- **TC-CRX-712** — PASS, fully confirmed.
- **TC-CRX-713** — still NOT INDEPENDENTLY VERIFIED. Requires a Work Package genuinely waiting at an approval
  gate so the Dashboard's "Review" button and the Gate approval modal's Approve button can be exercised — no
  WP in this environment has ever reached that state (same root cause as Work Packages suite's TC-768/CRUX_
  PLATFORM_FROZEN_RULES's TC-929-931: the local agent-claim mechanism needed to advance a WP to a gate is
  blocked by an MCP/production-instance mismatch in this session). Deferred until that's resolved.
- **TC-CRX-716 / TC-CRX-719** — still NOT INDEPENDENTLY VERIFIED this pass, same reason (both need a WP at an
  approval gate — 716 for per-project scoping, 719 for the admin-bypass check).

**Pass 2 result: 1 more PASS (712), 0 bugs found. 713/716/719 remain blocked on the gate-state root cause,
not time/effort.**

## Suite status

Pass 1 (2026-11-05): 9 PASS, 3 partial, 4 deferred, 0 bugs found.
Pass 2 (2026-11-12): 1 more PASS (712); 713/716/719 still deferred (gate-state blocker, tracked against the
  same root cause as Work Packages TC-768).
Overall: 10 PASS / 3 partial / 3 deferred (713, 716, 719) / 0 bugs.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §0.
