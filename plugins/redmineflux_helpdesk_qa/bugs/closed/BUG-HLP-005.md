# Bug Report Template

- Bug ID: BUG-HLP-005
- Production Redmine Issue ID: 119557
- Title: SLA and Support Level can be created via unlinked global routes that bypass the intended project-scoped navigation — for SLA this produces a permanently orphaned, unmanageable record
- Redmine version: (see QA_CREDENTIALS_FORGE.md — Forge, flux-fudbk2hlu49)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Forge (https://flux-fudbk2hlu49.forge.zehntech.com/)
- Browser: Chromium (Playwright MCP)
- User role: Administrator (admin)
- Date: 2026-08-24

## Steps to reproduce

**Intended/expected navigation** (both confirmed to exist and work correctly):
- SLA: Project → **Helpdesk** menu → **Helpdesk SLA** tab (`/projects/:id/helpdesk/sla`) → "New SLA" → `/rf_slas/new?project_id=X`
- Support Level: Project → **Helpdesk** menu → **Settings** → **Support Level** tab (`/projects/:id/helpdesk/settings?tab=support_levels`) → "New Support Level" → `/rf_support_levels/new?project_id=X`

**The bug — bypass routes that skip project context entirely:**

1. Log in as admin.
2. Navigate directly to `/rf_slas` (global list). Note: this URL is not linked from anywhere in the product's discoverable UI — not from the global "Helpdesk Command Center" nav (which links Dashboard/Tickets/Reports/Organization/Customers/Products/Settings, but never SLA or Support Level), and not from any project page other than the two proper tabs above.
3. On this global list page, click its own **"New SLA"** button — it links to bare `/rf_slas/new` (no `project_id` query param at all, confirmed via `href`).
4. Inspect the resulting form's DOM (`document.querySelectorAll('form')`): the SLA form has no `project_id` field anywhere — no hidden input, no visible dropdown. Fill it out (Name, response/resolution times, working hours/days) and submit.
5. Separately, navigate directly to `/rf_support_levels` (global list, also unlinked from any discoverable nav) and click its own **"New Support Level"** button — it links to bare `/rf_support_levels/new` (no `project_id`).
6. Inspect this form's Project dropdown (`select[name="support_level[project_id]"]`): it lists **every project on the instance** — including projects where the Helpdesk module is not even enabled (e.g. "Education and training3", "Flux Gantt Project", "Marketing campaign4" on this environment).

## Expected result

- SLA and Support Level management should only be reachable through their intended project-scoped navigation (the two paths above). The global `/rf_slas` and `/rf_support_levels` routes, if they exist at all, should either redirect into a project-scoped flow, require a valid `project_id`, or not expose their own unscoped "New" action.
- An SLA should never be creatable without a project association — every SLA should be reachable from at least one project's own Helpdesk SLA tab.
- A Support Level's Project dropdown should only offer projects that actually have the Helpdesk module enabled, matching the entity's real purpose (support levels only make sense for projects using Helpdesk).

## Actual result

- **SLA (more severe):** Creating an SLA via bare `/rf_slas/new` produces a completely orphaned record — no `project_id` at all. It never appears on any project's Helpdesk SLA tab (confirmed empty on both "Helpdesk Service Desk" and "Agile Board Project" in an earlier session), so there is no UI path to ever find, edit, or delete it from within a project again. Yet it is fully functional elsewhere: it appears in the unfiltered global `/rf_slas` list, and it is offered as a selectable option in the Customer creation form's SLA dropdown — a customer can be assigned an SLA that no project's staff can see or manage.
- **Support Level (less severe, still incorrect):** Creating one via bare `/rf_support_levels/new` does not orphan it (the Project field is a real, required, visible dropdown), but that dropdown offers projects that have no Helpdesk capability at all, letting an admin create a support level for a project that can never generate a helpdesk ticket to use it.
- **Both routes are discoverable only by directly typing/guessing the URL** — there is no link to either `/rf_slas` or `/rf_support_levels` (nor their `/new` actions) anywhere in the global "Helpdesk Command Center" nav or in any project page outside their own correct tabs. Once reached, though, the global list pages present a completely normal-looking "New SLA" / "New Support Level" button that silently produces incorrectly-scoped data — this isn't just a hand-crafted-URL edge case, it's one click away once someone lands on the unlinked list page.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-005/global-sla-list-new-sla-button.png)

### Console / log

- No console errors. This is a routing/access-scoping gap, not a JS exception — confirmed via direct DOM inspection of each form's field set (`document.querySelectorAll('form')`), not visual inspection alone.

## Duplicate check

- Duplicate found: No, this is the primary bug.
- Existing bug reference (if duplicate): —

## Related

- **This is the root cause of BUG-HLP-002.** Confirmed 2026-08-24 by controlled comparison: reaching `/rf_support_levels/new` via the proper project-scoped link (`?project_id=X`, Project field locked as a hidden input) correctly scopes the "Escalation To" dropdown; reaching the same form via this bug's bypass route (bare `/rf_support_levels/new`, Project as a free-choice visible dropdown) leaves "Escalation To" completely unfiltered regardless of which project is picked. Fixing this bug (removing/blocking the bypass route, or forcing it to always carry/lock a valid `project_id`) should resolve BUG-HLP-002 as a side effect — include BUG-HLP-002's repro steps in this bug's retest instead of retesting it independently.

## Retest — 2026-08-31, Local (redmine-docker-6)

- **Bypass routes checked directly** (this is admin backdoor-route testing, not customer/agent journey simulation, so direct URL navigation to these specific routes is the correct way to test whether the bypass still exists): `GET /rf_slas`, `GET /rf_slas/new`, `GET /rf_support_levels`, `GET /rf_support_levels/new` — **all four now return a genuine HTTP 404**, confirmed via `page.goto()`'s reported HTTP status, not just a redirect or empty list. Confirmed the app itself is up and the admin session is valid at the same time (base `/` loads normally, "Logged in as admin" visible) — this isn't a broader outage being mistaken for a fix. Screenshot: `retest-2026-08-31-global-rf_slas-404.png`.
- **Proper project-scoped flow re-verified working and now uses a cleaner route shape**: clicking "New SLA" from Helpdesk QA Alpha's own Helpdesk SLA tab now navigates to `/projects/1/rf_slas/new` (project ID as a URL **path** segment) rather than the old `/rf_slas/new?project_id=X` (query param) — same for Support Level: `/projects/1/rf_support_levels/new`. DOM-inspected the Support Level form: **no `project_id` input field exists anywhere in the form at all** (neither hidden nor visible dropdown) — the project association is now carried entirely by the URL path, so there's no field left for a bypass route to omit or a user to tamper with.
- **BUG-HLP-002 side effect confirmed, as predicted**: on this properly-scoped `/projects/1/rf_support_levels/new` form, the Escalation To dropdown only lists `None (Last Level)` and `L1 (Order: 1)` — Alpha's own support level — correctly excluding Beta's `AB-L1`. Matches the original prediction exactly: removing the bypass route resolves BUG-HLP-002 as a side effect.
- Did not submit either form (navigated away without creating a duplicate SLA/Support Level for Alpha).
- **Verdict: RETEST PASS.** This is a stronger fix than the bug's own "Expected result" asked for (redirect, or require project_id, or hide the New button) — the routes were removed from the router entirely. BUG-HLP-002 is resolved as a confirmed side effect of this fix, exactly as this bug's own "Related" note predicted.

## Closed — 2026-08-31

- Closed per explicit user confirmation, following the clean retest above (all four bypass routes now 404; proper project-scoped flow unaffected).
- If any unscoped/unlinked global route for SLA or Support Level reappears (this one or a new one), file a new bug rather than reopening this one.
