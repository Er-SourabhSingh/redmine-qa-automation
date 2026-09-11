# BUG-HLP-029

- Bug ID: BUG-HLP-029
- Production Redmine Issue ID: 119855
- Title: The global Command Center Dashboard's "Recent Tickets" list leaks real ticket subjects, project names, assignee names, and SLA breach status to ANY logged-in user, regardless of project membership or helpdesk permission
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-02)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: A Redmine user with zero project memberships and zero helpdesk permission anywhere (`zero.perm.user`)
- Date: 2026-09-02

## Steps to reproduce

1. Log in as a user who is not a member of any project and holds no helpdesk permission at all (confirmed via `zero.perm.user`, a disposable fixture with no project memberships ever added).
2. Navigate directly to `/helpdesk` (the global Command Center Dashboard — reachable by URL even though its top-menu link correctly does not render for this user, see the now-retracted BUG-HLP-027 investigation).
3. Observe the "Recent Tickets" section.
4. For contrast, click one of the listed ticket links.

## Expected result

A user with no project membership and no helpdesk permission should see no real helpdesk data at all on `/helpdesk` — at minimum, the same visibility rules that correctly protect every other Command Center screen (Reports, Organizations, Customers, Products, Settings all correctly 403 for this user) and the individual ticket page itself (also correctly 403) should apply to the dashboard's own "Recent Tickets" list and its KPI cards.

## Actual result

The "Recent Tickets" table renders **8 real tickets** from Helpdesk QA Alpha — a project this user is not a member of and has no visibility into by any other route — showing genuine subject lines (e.g. "TC-HLP-356 holiday adjacency restricted-days test ticket"), the real project name, priority, status, assignee names (Luna Blossom, Autumn Grace — real agents), SLA status (including "Breached"), and relative creation time. Clicking through to any of these tickets (`/issues/36`, etc.) correctly returns a 403 — so the underlying ticket object is properly protected, but its list-row metadata is not.

**Interesting contrast**: the 5 KPI cards above the list (Unassigned/Open/On Hold/SLA Breached/Resolved) all correctly show **0** for this user — so *some* part of the dashboard is properly scoped by visibility, just not the "Recent Tickets" section next to it.

**Root cause confirmed by reading the plugin source** (`rf_helpdesk_controller.rb`):

```ruby
before_action :require_login
# #index and #issues stay open to any logged-in user: #index is also the
# customer's own "My Helpdesk" landing page ... and #issues is scoped by
# the query.
before_action :require_admin_or_manage_helpdesk, only: [:customers, :organization, :setting]

def index
  ...
  @helpdesk_project_ids = EnabledModule.where(name: 'helpdesk').pluck(:project_id)
  issues = Issue.where(project_id: @helpdesk_project_ids)
                .where("created_on >= ? AND created_on <= ?", from_date.beginning_of_day, to_date.end_of_day)
  issues = issues.where(tracker_id: support_tracker.id) if support_tracker

  @cards = RedminefluxHelpdesk::DashboardCards.resolve_all(user: User.current, from: from_date, to: to_date)
  prepare_graph_data
  prepare_dashboard_details(issues)   # <-- receives the raw, unscoped `issues`
end

def prepare_dashboard_details(issues)
  ...
  @recent_tickets = issues.includes(:project, :status, :priority, :assigned_to, :author)
                          .order(created_on: :desc)
                          .limit(DASHBOARD_LIST_LIMIT)
                          .to_a
  ...
end
```

`issues` is built purely from `Issue.where(project_id: @helpdesk_project_ids)` — every helpdesk-enabled project on the whole install, no `.visible(User.current)` call, no permission check, no reference to `User.current` at all. It is passed straight into `prepare_dashboard_details`, which builds `@recent_tickets` (and the priority/status/organization breakdowns beneath it) directly from that same unscoped relation. By contrast, `@cards` is built via `DashboardCards.resolve_all(user: User.current, ...)`, which evidently does apply real visibility scoping (its cards correctly read 0 for this user) — the two halves of the same dashboard use two different data paths, and only one of them checks who's asking.

The controller's own top-of-file comment explains *why* `#index` has no `before_action` guard at all — it doubles as the customer's "My Helpdesk" portal landing page — but that reasoning only justifies letting any logged-in user *reach* the action, not letting the staff-dashboard branch render real cross-project data to someone who isn't a customer, an agent, or a project member of any kind.

## Evidence

### Screenshot

![zero.perm.user (0 project memberships, 0 helpdesk permission) — logged in as zero.perm.user, top-left; "Recent Tickets" table shows 8 real Helpdesk QA Alpha tickets with real subjects/assignees/SLA status; KPI cards above correctly all read 0](../../screenshots/BUG-HLP-029/zero-perm-user-sees-real-tickets-on-command-center.png)

![Clicking into one of those listed tickets (#36) correctly returns 403 — the object itself is protected, only the list-row metadata leaked](../../screenshots/BUG-HLP-029/ticket-detail-correctly-403-list-metadata-leaked.png)

### Console / log

- N/A — not a runtime error, a data-scoping omission. Confirmed via direct source read (`rf_helpdesk_controller.rb`) rather than a log/exception.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- **Real-world severity**: rated High, not Critical — full ticket descriptions, attachments, and conversation history remain correctly protected (confirmed via the working 403 on the issue detail route), so this is a metadata/summary leak, not a full-content breach. But ticket subject lines are frequently self-descriptive of the underlying issue (as seen here — real subjects describing what each ticket is about), and assignee names plus SLA breach status are internal operational data that should not be visible to an unauthenticated-for-helpdesk-purposes user. Any authenticated Redmine user on the instance — including one with zero project memberships anywhere — can see this, not just a misconfigured but otherwise-legitimate helpdesk user.
- Confirmed this is specific to the **global** `/helpdesk` dashboard, not the project-level equivalent: `/projects/helpdesk-qa-alpha/helpdesk` (the project dashboard) correctly returns a 403 for this same user — so the project-scoped controller (`RfProjectHelpdeskController`) does gate its own dashboard correctly; only the global one (`RfHelpdeskController#index`) has this gap.
- Confirmed the other 5 Command Center rail screens (Reports, Organizations, Customers, Products, Settings) all correctly return 403 for this user — this is not a wholesale authorization failure across the Command Center, it's isolated to the dashboard action's "Recent Tickets"/breakdown data specifically.
- Suggested fix direction (not prescriptive): scope the `issues` relation built in `#index` the same way `DashboardCards.resolve_all` already does for the KPI cards — presumably via `Issue.visible(User.current)` or an equivalent membership/permission check — before passing it into `prepare_graph_data` and `prepare_dashboard_details`, so the "Recent Tickets" list, priority/status breakdowns, and organization counts all respect the same visibility the KPI cards already do.
- Found while directly investigating a user question about whether the `view_helpdesk`-only and no-permission cases are also blocked from navigating via direct URL (not just missing the top-menu link) — confirmed the no-permission case for the other 5 rail screens and the project-level dashboard is correctly blocked, but this dashboard action itself was not.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119855 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Logged in as `zero.perm.user` (same fixture as the original finding — zero project memberships, zero helpdesk permission anywhere) and navigated directly to `/helpdesk`. **Result: clean 403** — "You are not authorized to access this page." No "Recent Tickets" table, no KPI cards, no leaked ticket subjects/assignees/SLA status of any kind. The action now gates the same way the other 5 Command Center rail screens and the project-level dashboard already did.
- Production issue #119855 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
