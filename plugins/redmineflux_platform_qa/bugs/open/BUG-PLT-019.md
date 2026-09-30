# Bug Report Template

- Bug ID: BUG-PLT-019
- Production Redmine Issue ID: #121709
- Title: Column-header sorting works only on Teams — Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, and Contacts have no sortable column headers at all
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to Redmineflux Platform → Teams (`/redmineflux_platform/teams`) — note "Team name" and "Created on" are clickable links that sort the list, with the URL changing to `?sort=name:desc` etc.
2. Navigate to Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, or Contacts — inspect every column header on each list.

## Expected result

- Per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s own testing guidance and this cycle's TC-PLT-115 ("Sorting by column header works on each list screen"), every one of Platform's 7 shared-entity list screens should support clicking a column header to sort — matching the pattern Teams already has.

## Actual result

Only Teams has sortable column headers. Confirmed by inspecting the full column-header row of every other entity's list — none of them contain a link element at all, just plain text headers:

- **Holiday Schemes**: `S.No. | Name | Status | Description | Created on | Actions` — none clickable.
- **Holidays**: `S.No. | Name | Date | Type | Holiday scheme | Recurring | Actions` — none clickable.
- **Leave Types**: `S.No. | Name | Code | Paid | Max Days / Year | Status | Actions` — none clickable.
- **Organizations**: `S.No. | Name | Industry | Email | Status | Actions` — none clickable.
- **Contacts**: `S.No. | Name | Email | Company Identity | Status | Actions` — none clickable.
- (Leaves also has no sortable headers, on top of having no search at all — see BUG-PLT-018.)

### Root cause (confirmed from source)

`TeamsController#index` explicitly wires up Redmine's standard sortable-list support:

```ruby
sort_init 'name', 'asc'
...
rf_paginate(scope.reorder(sort_clause), per_page: resolve_limit)
```

and `teams/index.html.erb` is the **only** view file in the entire plugin that calls `sort_link`/`sort_header_tag` (confirmed via `grep -rln "sort_link\|sort_header_tag"` across the whole plugin — exactly one match).

`EntitiesController` — the single shared controller handling all 6 other entities (Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts) — has **no `sort_init`, no `sort_clause`, and no equivalent**. Its `index` action is:

```ruby
def index
  scope = @entry.scope(User.current)
  scope = @entry.search(scope, params[:search])
  @records, @record_pages, @records_count = rf_paginate(scope, to_a: true)
  ...
end
```

`@entry.scope(User.current)` returns whichever fixed ordering that entity's `Entry.new(..., scope: -> (user) { ... .ordered })` lambda defines (e.g. `Organization.visible(user).ordered`), and there is no code path anywhere that reads `params[:sort]` for these 6 entities. The shared list view these 6 entities all render simply never emits a sort link for any column, consistent with the controller never supporting one.

This means Teams' sortable headers are not a shared platform capability at all — they are one-off code specific to `TeamsController`/`teams/index.html.erb`, never generalized to the shared `EntitiesController` that every other entity uses.

## Evidence

### Screenshot

![Organizations list — every column header is plain text, none are clickable sort links](../../screenshots/BUG-PLT-019/organizations-no-sortable-headers.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-019/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — this is a missing capability, not a crash.

## Duplicate check

- Duplicate found: No — related in spirit to BUG-PLT-018 (both are Leaves missing a standard list capability), and to BUG-PLT-016's broader observation (Team's own screen having more capability than the shared path other entities go through), but this is its own distinct, independently reproducible gap affecting 6 of 7 entities, not specific to any one of them.

## Production report

Reported to production 2026-09-30 as **#121709** (project `ztflux`, tracker Bug, Priority Low, Defect Type Functional, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121709 attached.
