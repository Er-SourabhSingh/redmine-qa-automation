# Bug Report Template

- Bug ID: BUG-CRX-022
- Production Redmine Issue ID: #120720
- Title: `/crux/agents` (Agent Fleet page) enforces no permission check at all — any authenticated Redmine user can view full agent spend/cap and provider/model data, the same defect class BUG-CRX-012 fixed on `/crux` but left untouched here
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Reporter role, with **zero** Redmineflux Crux permissions checked — same confirmed-empty role state as BUG-CRX-012's original reproduction)
- Date: 2026-09-16

## Steps to reproduce

1. Confirm the Reporter role has no Redmineflux Crux permissions at all (Administration → Roles → Reporter → Permissions → Redmineflux Crux group — all checkboxes unchecked, including "View Crux dashboard").
2. Log in as `daisy.skye` (Reporter).
3. Navigate directly to `/crux/agents` (the "Agent Fleet" page — reached via the dashboard's own "View All →" link, or the top-nav "Agents" link).
4. Observe the page content.

## Expected result

- Per the same "View Crux dashboard" permission that now correctly gates `/crux` (fixed 2026-09-16, see BUG-CRX-012), a user whose role does not grant it should be refused access to `/crux/agents` too — this page is reached directly from the dashboard and shows the same class of sensitive operational data.

## Actual result

- The full Agent Fleet page renders completely for `daisy.skye`, with **no permission check applied whatsoever**: all 23 agents' identity, capabilities, origin, provider/model, status, and **spend vs. cap in dollars** (e.g. real monthly spend figures per agent), plus health/run-count data.
- Confirmed in source: `crux_agents_controller.rb` has `before_action :require_login` and `before_action :require_manage_agents, only: [:create, :pause, :provision, :retire, :upload]` — the read action (`index`, which renders this page) has no `view_crux` (or any other) permission check at all, unlike its sibling `crux_dashboard_controller.rb`, which was fixed today (2026-09-16) to check exactly this.
- This was found while retesting BUG-CRX-012 (now closed) — the dashboard's own fix (`authorize_view_dashboard`, scoped to `crux_dashboard_controller.rb`'s actions only) does not extend to this sibling controller, which exposes materially the same category of sensitive data (real spend/cost figures, provider/model configuration) to any authenticated user regardless of role.

## Evidence

### Screenshot

Not captured — confirmed via the full rendered page content (agent table rows, real dollar spend/cap figures) matching live data, not a rendering defect.

### Console / log

- Administration → Roles → Reporter → Permissions confirmed: "View Crux dashboard" (and all other Redmineflux Crux permissions) unchecked.
- `daisy.skye` navigated directly to `/crux/agents`: full "Crux — agent fleet" page rendered, no 403, no redirect — 23-row agent table with real spend/cap dollar figures (e.g. "$0.53 of $50.00 this month" for Project Manager) and provider/model details (e.g. "anthropic / claude-opus-4-8").
- Contrast: the same user navigating to `/crux` (dashboard root) at the same time correctly received a `403 Forbidden` (per BUG-CRX-012's fix, confirmed working).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (same defect *class* as the now-fixed BUG-CRX-012 — missing `view_crux` permission enforcement — but a distinct code location: `crux_agents_controller.rb` vs. `crux_dashboard_controller.rb`. BUG-CRX-012's fix explicitly only touched the dashboard controller's `before_action` list, per `CHANGES.md`, so this is a genuinely separate gap, not a regression.)

## Note for triage

Suggested fix direction: apply the same `authorize_view_dashboard`-style `before_action` (checking `User.current.admin? || User.current.allowed_to_globally?(:view_crux)`) to `crux_agents_controller.rb`'s `index` action, mirroring the fix already shipped for `crux_dashboard_controller.rb` today. Worth checking whether any other sibling Crux controllers (pipelines, runs, etc.) share this same gap while addressing it.

## 2026-09-25 retest — FIXED, live-confirmed

Logged in as `daisy.skye` (Reporter, zero Crux permissions — same fixture as original), navigated directly to `/crux/agents`. **Result: `403 Forbidden`**, confirmed via HTTP status in the page load, not just visual absence of content. (Nav link itself is still visibly shown for this user — a separate, minor cosmetic matter; this bug's contract was about actual data access, which is now correctly blocked, matching the same `view_crux`-style enforcement BUG-CRX-012 already fixed on `/crux`.)

**Verdict: FIXED, live-confirmed.** Ready to close pending user approval (production sync required).

## Production report

Reported to production as issue **#120720** (`ztflux`, Tracker Bug, Priority **High**, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569 "Crux QA Run 1", testcase **#120487** (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, the same testcase BUG-CRX-011/012 were linked to — found while retesting BUG-CRX-012), Environment "Window 11 + Chrome" — testcase marked **Failed**.
