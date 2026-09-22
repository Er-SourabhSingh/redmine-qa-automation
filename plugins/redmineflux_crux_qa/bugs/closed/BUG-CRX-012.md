# Bug Report Template

- Bug ID: BUG-CRX-012
- Production Redmine Issue ID: #120661
- Title: The `/crux` dashboard controller enforces no permission check at all — any authenticated Redmine user can view full fleet cost/spend data, the Work Package pipeline, and the Run Ledger, regardless of the "View Crux dashboard" role permission
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Reporter role, with **zero** Redmineflux Crux permissions checked — confirmed via Administration → Roles → Reporter → Permissions → Redmineflux Crux: "View Crux dashboard", "Use Ask Crux", "Approve Crux gates", "Manage Crux agents", "Manage Crux pipelines" all unchecked)
- Date: 2026-09-15

## Steps to reproduce

1. Confirm the Reporter role has no Redmineflux Crux permissions at all (Administration → Roles → Reporter → Permissions → Redmineflux Crux group — all 5 checkboxes unchecked, including "View Crux dashboard").
2. Log in as `daisy.skye` (Reporter).
3. Navigate directly to `/crux` (the Crux dashboard root — reached via the "Crux" top-nav link, which itself is still shown despite lacking the permission, a separate finding consistent with the already-filed BUG-CRX-005 "nav toggles are cosmetic").
4. Observe the page content.

## Expected result

- Per the existence of a dedicated "View Crux dashboard" permission checkbox in the role editor, a user whose role does not grant it should be refused access to `/crux` (403, or redirected) — the permission would otherwise be entirely meaningless.

## Actual result

- The full dashboard renders completely for `daisy.skye`, with **no permission check applied whatsoever**:
  - Top-line metrics: Outcomes delivered, Cost/outcome ($10.21), Tokens (21,944,984), total Cost ($30.63), Runs (596), Agents online (27).
  - **Agent Fleet** table: all agents' real-time status, run counts, and **spend vs. cap in dollars** (e.g. "Project Manager ... $25.63 / $50.00").
  - **Ready Queue**: every ready issue across the project, including issue **#1, "PRIVATE-MARKER-7f3a: cross-project isolation test fixture"** — a fixture specifically created to test that private/cross-project data does NOT leak (the same fixture family implicated in the already-disputed BUG-CRX-003).
  - **Work Packages — pipeline view**: full internal pipeline state for every WP (goal text, members, stage, autonomy, gate-approval history with real approver usernames).
  - **Run Ledger**: a live, detailed log of every agent run — issue, agent, model, duration, exact token counts, exact dollar cost, tool-call counts, outcome — for the entire instance.
- This was reached via a **plain, direct page navigation** — no chat session, no Share feature, no confirm dance involved. It is a raw, unauthenticated-by-permission read of the entire dashboard, available to literally any logged-in Redmine user regardless of role.
- This is broader and more fundamental than BUG-CRX-011 (shared-session write execution) and than TC-CRX-120's original framing (Share leaking owner-scoped data to a narrower-permission viewer via a chat session) — the dashboard itself needs no sharing step at all; the "View Crux dashboard" permission checkbox has zero effect on `/crux` access.

## Evidence

### Screenshot

Not captured — confirmed via the full rendered page content (table rows, dollar figures, issue titles) matching real live data, not a rendering defect.

### Console / log

- Administration → Roles → Reporter → Permissions confirmed: "View Crux dashboard" checkbox unchecked (along with all other Redmineflux Crux permissions) both before and after this test — no permission was granted at any point during this specific reproduction.
- `daisy.skye` navigated to `/crux` directly: full dashboard content rendered, including issue #1 "PRIVATE-MARKER-7f3a: cross-project isolation test fixture" in the Ready Queue, and real $ figures in the Agent Fleet and Run Ledger tables.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, BUG-CRX-005 — that bug is about the nav-link visibility toggle being cosmetic; this bug is about the dashboard controller's own access-control check being entirely absent, a strictly more severe data-exposure issue)

## 2026-09-16 retest — FIXED (original scope: `/crux` dashboard), confirmed live; new adjacent gap found in a different controller

Dev's `CHANGES.md` handoff added `before_action :authorize_view_dashboard, only: [:index, :data, :runs, :runs_data, :queue, :work_packages]` to `crux_dashboard_controller.rb`, checking `User.current.admin? || User.current.allowed_to_globally?(:view_crux)` — refusing with Redmine's standard `deny_access` (HTML) or a JSON `403` (JSON), exactly mirroring the sibling per-project controller's existing correct pattern.

**Retest (exact original repro):** Confirmed `daisy.skye` (Reporter) still has zero Redmineflux Crux permissions. Signed in as `daisy.skye`, clicked the (still cosmetically-shown, per BUG-CRX-005) "Crux" nav link to `/crux`.

**Result:** Playwright's own navigation result: **`HTTP status: 403 Forbidden`**, page title "403 - Redmine", body "You are not authorized to access this page." — the standard Redmine deny page, no dashboard content, no data of any kind rendered.

**Verdict: FIXED**, for the original scope (direct navigation to `/crux`).

**New finding (out of this bug's original scope, judged separately per [[feedback_retest_verdict_against_original_scope]]):** While re-verifying, also checked `/crux/agents` (the "Agent Fleet" page the dashboard links out to) as the same `daisy.skye` user — it rendered **completely unrestricted**, full fleet table with real spend/cap dollar figures and provider/model details for all 23 agents, no 403, no redirect. Confirmed in `crux_agents_controller.rb`: `before_action :require_login` and `before_action :require_manage_agents, only: [:create, :pause, :provision, :retire, :upload]` — the read action (`index`) has no `view_crux` (or equivalent) check at all. This is the same class of defect BUG-CRX-012 described, just in a sibling controller this fix didn't touch. Not folded into this bug (original repro never tested `/crux/agents`) — flagged to the user as a candidate new bug (BUG-CRX-022) rather than filed unilaterally.

## Production report

Reported to production as issue **#120661** (`ztflux`, Tracker Bug, Priority **Blocker** — mapped from local Critical severity, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120487** (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, where it was found via TC-CRX-120), Environment "Window 11 + Chrome" — testcase marked **Failed**. Attachments: `BUG-CRX-012.pdf` (5.3 KB) and this MD file (4.4 KB), both confirmed size-exact against production.
