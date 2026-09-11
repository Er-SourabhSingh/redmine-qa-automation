# BUG-HLP-057

- Bug ID: BUG-HLP-057
- Production Redmine Issue ID: 120539
- Title: `export_helpdesk_reports` is a completely non-functional permission — Reports access (and export) is gated purely by `manage_helpdesk`, so this documented, independently-listed permission can never grant anything on its own
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Custom test roles (see below)
- Date: 2026-09-11

## Steps to reproduce

1. Create (or reuse) a role with `view_helpdesk` and `export_helpdesk_reports` checked, but **not** `manage_helpdesk`.
2. Assign a user that role on a project with helpdesk data.
3. As that user, attempt to reach Reports — via the project's own Helpdesk sub-navigation, and directly at `/rf_helpdesk/reports/tickets`.
4. Separately, create a second role with only `view_helpdesk` + `manage_helpdesk` (no `export_helpdesk_reports`) and confirm what that user can do on the same Reports pages.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §20's own permissions table, `export_helpdesk_reports` is listed as its own, independent permission ("Export reports to CSV/Excel"), distinct from `manage_helpdesk`. A user granted `view_helpdesk` + `export_helpdesk_reports` should therefore be able to view a report and export it, even without `manage_helpdesk`.

## Actual result

Confirmed live with two contrasting role configurations:

- **`view_helpdesk` + `export_helpdesk_reports`, no `manage_helpdesk`** (reconfigured "Permission Test Role", user `perm.test.agent`): no "Reports" link appears anywhere in the UI (neither the global Helpdesk Command Center menu — entirely absent for this user — nor the project-level Helpdesk sub-navigation, which shows only Dashboard/Tickets/Knowledgebase). Confirmed this isn't just a hidden link: navigating directly to `/rf_helpdesk/reports/tickets` returns a genuine **403 Forbidden**. This permission cannot reach Reports at all, so its own stated purpose (exporting reports) is unreachable.
- **`view_helpdesk` + `manage_helpdesk`, no `export_helpdesk_reports`** ("Agent ManageHelpdesk Test" role, user `manage.helpdesk.test`): Reports load normally (all 5 tabs, confirmed live for TC-HLP-181/182/183/184), and **Export as CSV / Excel / PDF all worked successfully** — despite `export_helpdesk_reports` never being checked on this role at all. Verified via `browser_evaluate` reading the actual checked checkbox values on `/roles/8/edit`: only `view_helpdesk` and `manage_helpdesk` are checked.

Together these two results prove the Reports controller (view and export both) is gated purely by `manage_helpdesk` (or the admin bypass) — `export_helpdesk_reports` is checked nowhere in the actual authorization logic. It is a real permission entry in the Roles UI, and a real row in the plugin's own documented permissions table, but it has zero effect in either direction: granting it without `manage_helpdesk` grants nothing; granting `manage_helpdesk` without it already grants everything it was supposed to add.

## Evidence

### Console / log

- `/roles/8/edit` (Agent ManageHelpdesk Test): `document.querySelectorAll('input[type=checkbox]:checked')` mapped to `.value` → includes `view_helpdesk`, `manage_helpdesk`; does **not** include `export_helpdesk_reports`. This role's user (`manage.helpdesk.test`) successfully exported CSV (`helpdesk_tickets_...csv`, verified content matches applied filters), Excel (`.xls`, MSO HTML format, content verified), and PDF (`tickets_report.pdf`, verified rendered content matches applied filters).
- `/roles/9/edit` (Permission Test Role, reconfigured this session): `view_helpdesk` + `export_helpdesk_reports` checked, `manage_helpdesk` unchecked. This role's user (`perm.test.agent`) got a genuine `403 Forbidden` HTTP status navigating directly to `/rf_helpdesk/reports/tickets` — not just a hidden nav link.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — no prior coverage of `export_helpdesk_reports` specifically; distinct from the `manage_prepaid_support_hours`-requires-`manage_helpdesk` finding already resolved as by-design in BUG-HLP-040, since that one **is** genuinely deliberate per direct user confirmation — this one contradicts the User Guide's own permissions table with no such confirmation)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-197 ("Export refused for a role without `export_helpdesk_reports`") — that TC's own precondition assumes a role can view Reports but be refused Export specifically; no such tier exists, since viewing Reports at all already requires `manage_helpdesk`, which already includes export capability by itself.
- Also directly relevant to TC-HLP-181, whose own "Agent with `view_helpdesk`" precondition needed correcting for the same underlying reason (`view_helpdesk` alone cannot reach Reports either — see that TC's evidence).
- Severity judged **Medium**: no data exposure or corruption risk, but a documented, distinctly-named permission that silently does nothing, in either direction, which could easily mislead an administrator into thinking they've granted export-only access when they haven't granted any access at all.
- Recommend: either make the Reports controller's `before_action` accept `manage_helpdesk OR export_helpdesk_reports` for view access (gating the Export button/action specifically on `export_helpdesk_reports OR manage_helpdesk`), matching the documented intent — or, if `export_helpdesk_reports` is meant to be a no-op safety net that only matters bundled with `manage_helpdesk` (unlikely given the User Guide's phrasing), update `HELPDESK_USER_GUIDE.md` §20 to state it plainly rather than listing it as independently meaningful.
