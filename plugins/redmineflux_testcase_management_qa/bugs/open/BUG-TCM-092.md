# BUG-TCM-092

- Bug ID: BUG-TCM-092
- Production Redmine Issue ID: #124347
- Title: Test Suites page (`/test_suites?project_id=<id>`) with NO `testsuite_id` param crashes with a 500
  Internal Server Error for every user — `ArgumentError (comparison of NilClass with 0 failed)` in
  `test_suites/index.html.erb`'s `sort_by`
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright MCP)
- User role: Reproduced as `qa.limited` (Manager, full permissions) — not permission-related, affects every
  user who reaches this specific code path
- Date: 2026-10-22 (found incidentally while executing `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-231, XSS
  rendering check)

## Summary

`GET /test_suites?project_id=rftc-016-ci-qa` — the bare URL with **no `testsuite_id` param**, which is exactly
what the "TestCases" project nav tab and the "Test Cases" sidebar link both actually link to — crashes with a
full 500 page for every user, every time. Requesting the same page **with** an explicit `testsuite_id` (e.g.
`&testsuite_id=3` or `&testsuite_id=5`) works correctly; the crash is specific to the no-suite-selected /
"all suites" default path.

Server log:

```
ActionView::Template::Error (comparison of NilClass with 0 failed):
Causes:
ArgumentError (comparison of NilClass with 0 failed)
    273:       <% end %>
    274:       <% if  @is_present || User.current.admin? %>
    275:         <% query_issues_order = @query.issues.each_with_index.to_h { |issue, index| [issue.id, index] } %>
    276:         <% @issues = @issues.sort_by { |issue| query_issues_order[issue.id] } %>
    277:         <%= render partial: 'issues/list', locals: { issues: @issues, query: @query } %>

plugins/redmineflux_testcase_management/app/views/test_suites/index.html.erb:276:in `sort_by'
```

Root cause: `@issues` (built in `test_suites_controller.rb#index`) and `@query.issues` (a separate, full
re-execution of the Redmine `IssueQuery` built from the same request's params) are **two independently
computed result sets** that are expected to contain the same issues, just used for different purposes (one is
the actual rendered list, the other only exists to derive a sort order via `query_issues_order`). When
`@issues` contains at least one issue that `@query.issues` does **not** return, `query_issues_order[issue.id]`
is `nil` for that issue, and Ruby's `sort_by` raises `ArgumentError` the moment it tries to compare that `nil`
against a real integer index from another issue in the same array.

When no `testsuite_id` is given, `test_suites_controller.rb#index` takes its "no suite selected" branch:

```ruby
@issues = @project.issues.where(tracker_id: selected_tracker_id).where.not(id: IssueTestSuite.select(:issue_id))
```

i.e. every Testcase-tracker issue in the project that is **not** linked to any suite at all (8 such issues
confirmed present on `rftc-016-ci-qa` at the time of this report — all ordinary, non-private, status "New"
fixtures from earlier testing sessions, e.g. "XSS test fixture", "Edge8 rollback fixture"). Whatever
`@query.issues` is actually filtering on internally evidently excludes at least one of these — confirmed by the
fact that supplying ANY `testsuite_id` (which takes the other controller branch, scoping `@issues` by suite
membership instead) avoids the crash entirely. Not yet pinned down to the exact single excluded issue/filter
interaction, but the "no suite selected, some unassigned issues present" precondition reproduces the crash
100% of the time on this project.

## Steps to reproduce

1. On a project with the Testcase Management module enabled and at least one Testcase-tracker issue that is
   **not** linked to any test suite (the normal state for any freshly-created test case before it's dragged
   into a suite).
2. Navigate to `/test_suites?project_id=<project>` with **no** `testsuite_id` param — exactly what the
   top-level "Test Cases"/"TestCases" nav links point to by default.

## Expected result

- The page renders normally, listing the project's unassigned test cases (or an appropriate empty state).

## Actual result

- A full Rails 500 error page (`Redmine 500 error` / `ActionView::Template::Error`), reproduced 3/3 times in
  this session across repeated fresh page loads.

## Evidence

### Screenshot

(Not captured as a separate file — the error is a full-page Rails 500 error page, confirmed via Playwright's
own page-title capture ("Redmine 500 error") and the exact server-log stack trace quoted above, which is more
precise evidence than a screenshot for this kind of server-side exception.)

### Console / log

```
# Reproduced 3/3 times via Playwright, fresh navigation each time:
GET /test_suites?project_id=rftc-016-ci-qa -> HTTP 500, page title "Redmine 500 error"

# Same project, explicit testsuite_id -> works correctly both times:
GET /test_suites?project_id=rftc-016-ci-qa&testsuite_id=3 -> 200 OK, renders normally
GET /test_suites?project_id=rftc-016-ci-qa&testsuite_id=5 -> 200 OK, renders normally

# Server log (docker logs redmine6-redmine-1):
F, [...] FATAL -- : [...] ActionView::Template::Error (comparison of NilClass with 0 failed):
Causes:
ArgumentError (comparison of NilClass with 0 failed)
plugins/redmineflux_testcase_management/app/views/test_suites/index.html.erb:276:in `sort_by'
```

## Suggested fix

In `test_suites/index.html.erb` around line 275-276, don't assume every issue in `@issues` is present in
`@query.issues`'s index map — guard the sort with a fallback (e.g.
`query_issues_order[issue.id] || Float::INFINITY`) so an issue missing from that secondary lookup sorts to the
end instead of crashing the whole page. Separately, it's worth reconciling why `@issues` and `@query.issues`
can disagree at all for the exact same request's params — if that's unintentional, the two result sets should
probably be unified into one query rather than computed twice.

## Verdict

**Confirmed, High.** A plain, unauthenticated-by-nothing-special 500 crash that blocks the default "Test
Cases"/"TestCases" entry point entirely for any project that happens to have at least one suite-less test case
— not a permission or security bypass in the classic sense, but found during the Security suite's XSS pass
(TC-TCM-231) and severe enough (complete page outage, not a cosmetic defect) to report immediately rather than
deferring to a later functional suite.

## Duplicate check

- Duplicate found: No — distinct from BUG-TCM-091 (confirmed no orphaned/cross-project `IssueTestSuite` rows
  are involved; this crash reproduces on a clean, unrelated set of ordinary same-project unassigned issues).
- Existing bug reference (if duplicate): n/a

## Production report

Reported to production `ztflux` as **#124347** on 2026-10-22, per explicit user instruction ("bugs report kr do
production pe"). Tracker Bug, Priority High, Category "Testcase Management Plugin", Target version "Testcase
Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link (matching the BUG-TCM-087/088/089/090/091 pattern). Custom fields (Defect Type/Severity/
priority) left at project defaults — `list_custom_fields` returns a permission error for this account.
