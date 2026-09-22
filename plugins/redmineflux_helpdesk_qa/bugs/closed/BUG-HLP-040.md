# BUG-HLP-040

- Bug ID: BUG-HLP-040
- Title: A role granted only `manage_prepaid_support_hours` (without `manage_helpdesk`) has no reachable UI path to actually manage a budget — the prerequisite Organization page is gated on `manage_helpdesk` instead, making the standalone permission practically unusable
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-07)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Custom role "Permission Test Role" (`view_helpdesk` + `manage_prepaid_support_hours` granted, `manage_helpdesk` explicitly **not** granted)
- Date: 2026-09-07

## Steps to reproduce

1. Create a role with `view_helpdesk` and `manage_prepaid_support_hours` granted, but explicitly **without** `manage_helpdesk` (confirmed via the role's own Edit page).
2. As a user holding only this role on a project with a prepaid budget, sign in and attempt to reach anywhere the "Add / top up hours" control or the "When hours run out" dropdown would be reachable:
   - The project's Helpdesk Dashboard (no top-up control present there at all — the organization's name isn't even rendered as a link, just plain text)
   - Direct navigation to the organization's own page, `/rf_organizations/:id?tab=prepaid_support_hours`

## Expected result

Per `HELPDESK_PERMISSIONS.md` TC-HLP-168: a role granted `manage_prepaid_support_hours` (with `view_helpdesk`, without `manage_helpdesk`) should be able to top up the budget and change the run-out mode — "Both actions succeed even though this role lacks `manage_helpdesk`."

## Actual result

**There is no reachable UI path to the budget-management controls at all for this permission combination.** The organization page itself — the only place the "Add / top-up hours" button and "When hours run out" dropdown exist — returned a genuine **403 Forbidden** ("You are not authorized to access this page.") when accessed directly, and the project's own Helpdesk Dashboard renders the organization's Prepaid Support Hours row with the organization name as plain, unlinked text (no way to click through to it), unlike the same row for a `manage_helpdesk`-holding user, where it's a real link.

Root-caused via source (`app/controllers/rf_organizations_controller.rb`):

```ruby
before_action :require_admin_or_manage_helpdesk
...
def require_admin_or_manage_helpdesk
  return if User.current.admin? ||
            User.current.allowed_to?(:manage_helpdesk, nil, global: true)
```

This `before_action` gates **every** action on the controller, including `show` (which serves `?tab=prepaid_support_hours`), on `manage_helpdesk` specifically — with no `manage_prepaid_support_hours` fallback. The controller's own code comments (lines ~248-251) show the author was clearly aware of the intended split — *"reading a balance is `manage_helpdesk`, changing one is `manage_prepaid_support_hours`, and that is the permission the receiving controller enforces"* — and a separate helper (`load_prepaid_manageable_projects`) correctly scopes the top-up form's own project dropdown to `Project.allowed_to(User.current, :manage_prepaid_support_hours)`. The *write* action (the actual top-up submission) does appear to correctly check `manage_prepaid_support_hours` on its own. But that write action's **form** is only ever rendered inside the page this same controller's `show` action serves — and `show` itself requires `manage_helpdesk`, unconditionally. A user with `manage_prepaid_support_hours` alone can never reach the page that contains the button to open the very form whose submission would (correctly) accept their permission.

## Evidence

### Console / log

- Role "Permission Test Role" confirmed via its own Edit page: `checkbox "View helpdesk" [checked]`, `checkbox "Manage helpdesk"` (unchecked), `checkbox "Manage prepaid support hours" [checked]` — copied from the base "Agent" role plus this one addition, nothing else changed.
- As `perm.test.agent` (holding only this role): top application menu has no "Helpdesk Command Center" entry (expected, matches lacking `manage_helpdesk`). Project's own Helpdesk project-tab **is** present (matches `view_helpdesk`). Its Dashboard's "Prepaid Support Hours" table shows organization "Alpha Minimal Fields Test Org" as plain text, no link, no "Add / top up hours" control anywhere on the page (searched full page text for "top up" — zero matches).
- Direct navigation to `/rf_organizations/8?tab=prepaid_support_hours` as the same user: **`Page Title: 403 - Redmine`, `HTTP status: 403 Forbidden`**.
- Source: `plugins/redmineflux_helpdesk/app/controllers/rf_organizations_controller.rb` — `before_action :require_admin_or_manage_helpdesk` applies to all actions including `show`; `require_admin_or_manage_helpdesk` checks only `admin?` and `manage_helpdesk`, never `manage_prepaid_support_hours`.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): Related to BUG-HLP-039 (a different permission, `manage_helpdesk` itself, unexpectedly insufficient for Canned Responses) — the opposite shape of gap (there, a documented-sufficient permission is rejected; here, a documented-sufficient permission has no UI entry point at all) — not a duplicate.

## Notes

- Found while executing `HELPDESK_PERMISSIONS.md` TC-HLP-168 (2026-09-07).
- Severity judged **Medium**: the underlying write-permission enforcement for the top-up action itself appears architecturally correct per the controller's own comments (a real `manage_prepaid_support_hours`-only gate exists somewhere in the write path) — this is a **reachability** gap, not a security hole (nothing is being permitted that shouldn't be; if anything the practical effect is *more* restrictive than intended, not less). But it means `manage_prepaid_support_hours` as a standalone, `manage_helpdesk`-independent permission — exactly the scenario `HELPDESK_REQUIREMENTS.md`'s permissions model and this suite's own TC-HLP-168/210 pairing describe as a real, intentional distinction — is currently non-functional in practice: nobody can hold *only* this permission and actually use it.
- Recommend either: (a) add `manage_prepaid_support_hours` as an alternative to `manage_helpdesk` in `require_admin_or_manage_helpdesk` (at least for the `show` action / the `tab=prepaid_support_hours` view specifically, not necessarily the organization's other tabs like Overview), or (b) if organizations are meant to always require `manage_helpdesk` to view at all, correct `HELPDESK_REQUIREMENTS.md` and this TC to reflect that `manage_prepaid_support_hours` is only ever useful *in combination with* `manage_helpdesk`, never alone — matching how TC-HLP-172 (the negative case, `manage_helpdesk` without `manage_prepaid_support_hours`) is written, which would then need a symmetric note added.

## Closed — Not a Bug (option (b) above), 2026-09-07

**Retracted the same day it was filed, per explicit user clarification of the intended permission model.** This bug's own Expected Result (quoting TC-HLP-168's original wording) was itself the unverified assumption — see `feedback_verify_bug_claims_against_source_docs`. Checked against `HELPDESK_USER_GUIDE.md` directly: no sentence anywhere states that `manage_prepaid_support_hours` must work standalone, without `manage_helpdesk`. §20's permission table is silent on the dependency between the two permissions; the only indirect signal (that `manage_helpdesk`'s own row doesn't list prepaid budgets among what it grants) is consistent with either reading, not a stated contract.

The user then supplied the actual intended model directly:

> "`manage_helpdesk` is required to access the Organization management area. `manage_prepaid_support_hours` is required, in addition to `manage_helpdesk`, to modify prepaid support hours."

This is option (b) from this bug's own Notes section: `manage_prepaid_support_hours` is an **additive** permission on top of `manage_helpdesk`'s access grant, not a standalone substitute for it. The originally-observed behavior (a `manage_prepaid_support_hours`-only role, without `manage_helpdesk`, gets a 403 on the Organization page) is **exactly the intended, by-design behavior** under this clarified model, not a defect.

**Retest confirming the clarified model, both directions, 2026-09-07:**
- **Positive case** (`view_helpdesk`+`manage_helpdesk`+`manage_prepaid_support_hours`, `perm.test.agent`): Organization page opens, Prepaid Support Hours tab reachable, "Add / top up hours" succeeded (Approved 14.75h→15.75h, Remaining 9.92h→10.92h, ledger entry attributed correctly), "When hours run out" mode change succeeded (No limit → Soft), both changes confirmed persisted after a genuine page reload. See `HELPDESK_PERMISSIONS.md` TC-HLP-168 (rewritten to test this combination).
- **Negative case** (`view_helpdesk`+`manage_helpdesk`, explicitly without `manage_prepaid_support_hours`, `manage.helpdesk.test`): Organization page opens normally, Prepaid Support Hours figures fully visible (access/view genuinely works with `manage_helpdesk` alone) — but the "Add / top up hours" control is absent and "When hours run out" renders as plain non-editable text, not a live control. Modification is correctly blocked while access/viewing correctly isn't. See `HELPDESK_PERMISSIONS.md` TC-HLP-172 (reworded to make the access-vs-modify distinction explicit).

`HELPDESK_REQUIREMENTS.md`'s Permissions Matrix updated to state the two-permission dependency directly instead of citing this bug.

**Closed per explicit user direction** — not a defect, the code's actual behavior matches the plugin's intended permission model once that model was clarified.
