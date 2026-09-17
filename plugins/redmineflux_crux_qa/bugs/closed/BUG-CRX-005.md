# Bug Report Template

- Bug ID: BUG-CRX-005
- Production Redmine Issue ID: #120576 (ztflux, flux.zehntech.com — reported 2026-09-14, linked to testcase #120481 in run #569 "Crux QA Run 1")
- Title: "Show the Crux/Agents entry in the top menu" admin settings are purely cosmetic — disabling them hides the link but leaves the page (and all its data) fully reachable to any logged-in user
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP) + manual (user's browser)
- User role: Administrator (setting owner) / any logged-in user (unaffected by the toggle)
- Date: 2026-09-14

## Steps to reproduce

1. As Administrator, go to the Crux Settings page (`/crux/admin/settings`) and uncheck both "Show the Crux entry in the top menu" and "Show the Agents entry in the top menu". Save.
2. Confirm the top menu no longer shows "Crux" or "Agents" for any user.
3. As any logged-in user (any role, even zero Crux permissions), navigate directly to `http://localhost:3014/crux` and `http://localhost:3014/crux/agents`.

## Expected result

- An admin-facing setting literally named "Show the Crux/Agents entry in the top menu" should be reasonably understood as controlling that feature's visibility/availability to users — at minimum, an admin who disables it should not be surprised that the page is still fully reachable and functional for everyone, with no diminished behavior at all.

## Actual result

- Both pages load completely normally — full dashboard with live KPI/agent/run data (`/crux`), full agent fleet table with cost/capability/health data (`/crux/agents`) — for **any** logged-in user, exactly as if the setting were still enabled. The setting only removes the link from the menu; it has zero effect on `CruxDashboardController` or `CruxAgentsController`, neither of which checks these settings at all (only `before_action :require_login`).
- This is functionally consistent with the plugin's existing "login-only" access design for these two pages (already documented via TC-CRX-002/003/010 for the *permission*-based case) — but this bug is about a **different** thing: an admin's own explicit on/off control for the feature's visibility does not do what its label implies. An admin who unchecks "Show the Agents entry" specifically because they don't want most users browsing agent cost/health data would reasonably expect that to have some effect — it has none beyond cosmetics.
- Compounding this: during this session, both settings were found to have somehow reset to disabled ("0") between test sessions (see `docs/CRUX_HANDOFF.md`'s 2026-09-14 entry — the reset itself could not be reproduced through normal save actions), which means this cosmetic-only toggle can end up in the "off" state unexpectedly, silently giving admins false confidence that a feature is hidden when it never was and isn't now.

## Evidence

### Screenshot

Not captured — behavioral/access-control finding, not a rendering defect.

### Console / log

- With `Setting.plugin_redmineflux_crux['nav_top_crux']` and `['nav_top_agents']` both `"0"` (confirmed via Rails console) and the top menu showing no "Crux"/"Agents" links at all: direct navigation to `/crux` and `/crux/agents` both returned `200`, full page content, no degraded behavior.

## Duplicate check

- Duplicate found: No (related to, but distinct from, TC-CRX-002/003/010's already-accepted "login-only, not permission-gated" design finding — this bug is specifically about the admin-facing toggle's own effectiveness, not role permissions)
- Existing bug reference (if duplicate): —

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `crux_admin_settings_controller.rb`, `index.html.erb`, and `_redmineflux_crux.html.erb` — exactly the labeling fix requested below, not a behavior change (which this bug's own triage note said was acceptable: "at minimum, the setting's label/description should be corrected").

**Retest:** As admin, navigated via UI (Crux → Settings) to `/crux/admin/settings`. Both checkboxes now show the exact clarifying text:
- Crux entry: *"Only hides the top-menu shortcut. Any logged-in user can still open /crux directly (e.g. via a bookmark or a link from elsewhere in Crux) — this is not an access control."*
- Agents entry: *"Only hides the top-menu shortcut. The Agents page is always reachable from the Crux sidebar rail regardless of this setting, and any logged-in user can open /crux/agents directly — this is not an access control."*

**Verdict: FIXED.** Admins can no longer be misled about what these toggles do.

## Note for triage

Not necessarily asking for these pages to become access-restricted (that may be a larger design decision) — at minimum, the setting's label/description should be corrected if it's intentionally cosmetic-only (e.g. "Show the Crux entry in the top menu (does not restrict access — the page remains reachable by direct URL to any logged-in user)"), so admins aren't misled about what the control actually does.

Reported to production 2026-09-14 as issue **#120576** in `ztflux`, via `redmineflux_testcases_management_report_defect` (user approval obtained). Linked to testcase #120481, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120481 marked Failed. This bug MD file attached to #120576 (2026-09-14, via `upload_file` + `update_issue`).

Assigned to **Prashant Chaurasia** (user id 410) on production, 2026-09-15.
