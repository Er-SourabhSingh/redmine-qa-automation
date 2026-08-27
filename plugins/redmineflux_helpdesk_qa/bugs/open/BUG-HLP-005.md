# Bug Report Template

- Bug ID: BUG-HLP-005
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
