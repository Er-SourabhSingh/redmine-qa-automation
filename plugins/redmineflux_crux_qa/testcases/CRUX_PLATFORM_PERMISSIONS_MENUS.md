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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §0.
