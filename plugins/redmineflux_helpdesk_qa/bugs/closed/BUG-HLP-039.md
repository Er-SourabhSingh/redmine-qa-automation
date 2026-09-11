# BUG-HLP-039

- Bug ID: BUG-HLP-039
- Production Redmine Issue ID: 120082
- Title: Canned Response management is hardcoded admin-only (`before_action :require_admin`), directly contradicting `HELPDESK_REQUIREMENTS.md`'s own Permissions Matrix, which explicitly promises `manage_helpdesk` grants it
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-07)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Custom role "Agent ManageHelpdesk Test" (`manage_helpdesk` granted, not an admin)
- Date: 2026-09-07

## Steps to reproduce

1. As a non-admin user holding a role with `manage_helpdesk` granted (confirmed via the role's own Edit page: "Manage helpdesk" checkbox checked, "Export helpdesk reports" and "Manage prepaid support hours" both unchecked — an otherwise-clean `manage_helpdesk`-only role), successfully create an SLA, a Support Level, an Organization, a Product, and a Holiday (all succeed — see TC-HLP-205 evidence).
2. As the same user, navigate to Command Center → Helpdesk Settings → Canned Responses → New Canned Response.

## Expected result

Per `HELPDESK_REQUIREMENTS.md` line 40's Permissions Matrix: **"Manage desk configuration (SLAs, support levels, organizations, products, canned responses, holidays) | Yes | Yes, if granted `manage_helpdesk`"** — a Manager/Agent-tier role holding `manage_helpdesk` should be able to manage Canned Responses, exactly like the other five configuration entities in the same documented row.

## Actual result

**Genuine 403 Forbidden** — "You are not authorized to access this page." The same `manage_helpdesk`-holding user who had just successfully created an SLA, Support Level, Organization, Product, and Holiday moments earlier in the same session was refused on the Canned Responses `new` route alone.

Root-caused via source (`app/controllers/rf_canned_responses_controller.rb`):

```ruby
class RfCannedResponsesController < ApplicationController
  before_action :require_admin, except: [:process_macros]
```

Every action on this controller (`index`, `new`, `create`, `edit`, `update`, `destroy`) requires `require_admin` — Redmine's literal "is this user a system administrator" check — with no `manage_helpdesk` (or any other helpdesk permission) fallback at all. This is not a permission-check bug in the sense of a wrong permission key being checked; it's a **hardcoded admin-only gate that ignores the entire helpdesk permission system**, unlike every sibling configuration entity (SLA, Support Level, Organization, Product, Holiday), which all correctly gate on `manage_helpdesk`.

## Evidence

### Console / log

- Role "Agent ManageHelpdesk Test" (id 8) confirmed via its own Edit page: `checkbox "Manage helpdesk" [checked]`, `checkbox "Export helpdesk reports"` (unchecked), `checkbox "Manage prepaid support hours"` (unchecked) — a clean, otherwise-minimal `manage_helpdesk` grant.
- Same session, same user (`manage.helpdesk.test`): SLA "TC-HLP-205 Permission Test SLA" created successfully (redirect to SLA list, "Successful creation."); Support Level "TC-HLP-205 Permission Test Level" created successfully; Organization "TC-HLP-205 Permission Test Org" created successfully; Product "TC-HLP-205 Permission Test Product" created successfully; Holiday "TC-HLP-205 Permission Test Holiday" created successfully.
- Immediately after, navigating to `/rf_canned_responses/new` as the same user, same session: **`Page Title: 403 - Redmine`, `HTTP status: 403 Forbidden`**, page body: "You are not authorized to access this page."
- `HELPDESK_REQUIREMENTS.md` line 40 (Permissions Matrix, "Manage desk configuration" row) explicitly lists canned responses alongside SLAs/support levels/organizations/products/holidays as `manage_helpdesk`-grantable — this is the exact row this bug's finding contradicts for one of its six named entities.
- Source: `plugins/redmineflux_helpdesk/app/controllers/rf_canned_responses_controller.rb` line 6: `before_action :require_admin, except: [:process_macros]` — no `manage_helpdesk` permission check exists anywhere in this controller.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): Same *shape* of finding as the already-known Email Configuration / Swagger admin-only gates (`HELPDESK_PERMISSIONS.md` TC-HLP-212/214, `HELPDESK_EMAIL.md` TC-HLP-152, `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-200) — but those are **not** bugs, because nothing in the requirements docs promises `manage_helpdesk` grants them. Canned Responses is different: `HELPDESK_REQUIREMENTS.md` explicitly documents it as `manage_helpdesk`-grantable, and that documented promise is what's violated here. Not a duplicate of those.

## Notes

- Found while executing `HELPDESK_PERMISSIONS.md` TC-HLP-205 (2026-09-07).
- Severity judged **Medium**: this doesn't expose data or break functionality for the admin who can still use it — it's a genuine access-control/documentation mismatch that would confuse any Manager/team-lead-tier role who was told (by the plugin's own requirements doc) that `manage_helpdesk` was sufficient to manage canned responses, only to be silently blocked with a generic 403.
- Two possible fixes, either is reasonable: (a) change `rf_canned_responses_controller.rb` to check `manage_helpdesk` instead of `require_admin`, matching its five sibling entities and making the documented promise true, or (b) if hardcoded admin-only is actually the intended design (perhaps canned responses are considered more sensitive since they're global/install-wide, not project-scoped), correct `HELPDESK_REQUIREMENTS.md` line 40 to split canned responses out of that row into its own admin-only row, matching how Email Configuration and Swagger are already correctly documented elsewhere. Given the other five entities in the same row are all genuinely `manage_helpdesk`-gated with no admin requirement, and canned responses are the only global/install-wide entity among them (Support Packages, another global entity discovered in `HELPDESK_PREPAID_HOURS.md`, is *also* only `manage_helpdesk`-gated, not admin-only — confirmed during that suite's execution), there's no obvious architectural reason Canned Responses specifically needs to be stricter than Support Packages. Recommend (a) as the more consistent fix, but either resolves the documentation contradiction.
- TC-HLP-205 in `HELPDESK_PREPAID_HOURS.md`'s sibling suite already established Support Packages (also global/install-wide) is `manage_helpdesk`-gated correctly, not admin-only — worth cross-referencing when this bug is triaged, since it undercuts an "all global entities are admin-only by design" defense.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #120082 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Logged in as `manage.helpdesk.test` (the same "Agent ManageHelpdesk Test" role/user as the original repro — `manage_helpdesk` granted, not an admin) and navigated to `/rf_canned_responses/new`. **Result: the New Canned Response form rendered correctly** — no 403. Completed the full create flow (Name + Content) — "Successful creation.", the new canned response appeared in the list correctly attributed to "ManageHelpdesk TestAgent".
- Deleted the disposable canned response afterward to leave the fixture list clean.
- Production issue #120082 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
