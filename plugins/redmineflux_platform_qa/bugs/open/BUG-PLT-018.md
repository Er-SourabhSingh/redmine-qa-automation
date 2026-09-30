# Bug Report Template

- Bug ID: BUG-PLT-018
- Production Redmine Issue ID: #121708
- Title: Leaves list has no search at all — no search box in the UI, and the search parameter is silently ignored server-side too, unlike every other entity
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to Redmineflux Platform → Teams (`/redmineflux_platform/teams`) — note the Search box present, top of the list.
2. Navigate to Redmineflux Platform → Leaves (`/redmineflux_platform/list/leaves`) — note there is **no search box anywhere on the page**, unlike Teams, Holiday Schemes, Holidays, Leave Types, Organizations, and Contacts, which all have one.
3. Manually append `?search=<any term that should match a real row>` to the Leaves list URL anyway.

## Expected result

- Per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s own testing guidance and this cycle's TC-PLT-113 ("Search finds a record by name on every list screen"), Leaves should have a working search box exactly like the other 6 entities Platform manages.

## Actual result

- The Leaves list (`/redmineflux_platform/list/leaves`) has **no search box in the UI at all** — confirmed by inspecting the full rendered page, not just a quick look.
- Manually adding `?search=fixture` to the URL (a term matching the Reason field of a real fixture leave request created during this session, "PLT-PERM-TC207 fixture leave request") still returned **all 7 leave records, unfiltered** ("Leaves 7", pagination "(1-7/7)") — the parameter is silently ignored, not just hidden from the UI.

### Root cause (confirmed from source)

Two separate gaps compound:

1. `RedminefluxPlatform::Leave` **does** declare `rf_searchable_on :reason` (`app/models/redmineflux_platform/leave.rb:71`) — the model-level search scope exists and presumably works if called directly.
2. But the `leaves` entry in `lib/redmineflux_platform/shared_entities.rb`'s `Entry.new(key: 'leaves', ...)` block **never sets a `search:` key** — every other entity (Teams, Holiday Schemes, Holidays, Leave Types, Organizations, Contacts) does. `EntitiesController#index` calls `@entry.search(scope, params[:search])`, which is defined as:

```ruby
def searchable?
  !@search.nil?
end

def search(relation, term)
  return relation unless searchable? && term.present?
  @search.call(relation, SharedEntities.like_term(term))
end
```

Since `leaves`' entry never sets `@search`, `searchable?` is `false`, so `search` always returns the relation completely unchanged — regardless of what `params[:search]` contains. This is also almost certainly why the view renders no search box for this entity: the search box partial is presumably conditioned on `@entry.searchable?`.

So the model-level search capability (`rf_searchable_on :reason`) was built but never connected to the shared entity configuration for Leaves — a wiring gap, not a broken implementation. The fix is a one-line addition to the `leaves` `Entry.new(...)` block (a `search:` lambda calling `Leave.rf_search(term)`, matching the pattern the other 6 entities already use), not a change to the model or controller.

## Evidence

### Screenshot

(No screenshot needed — the finding is the *absence* of a search box, confirmed by a full-page DOM/accessibility-tree inspection rather than a visual capture; see the retest screenshot slot below for use once fixed.)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-018/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — the `?search=` parameter is accepted and silently has no effect, not a crash.

## Duplicate check

- Duplicate found: No — related to BUG-PLT-017 (also a Contacts/Leaves search defect found in the same TC-PLT-113 pass) but a distinct root cause: BUG-PLT-017 is a working-but-imprecise OR-per-column search; this bug is the search never being wired up at all for this one entity.

## Production report

Reported to production 2026-09-30 as **#121708** (project `ztflux`, tracker Bug, Priority Low, Defect Type Functional, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121708 attached.
