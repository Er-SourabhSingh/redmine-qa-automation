# BUG-TCM-091

- Bug ID: BUG-TCM-091
- Production Redmine Issue ID: #124346
- Title: CSV Testcase Import never validates `selected_suite_id` against the importing project — a crafted
  step2 request can link a newly-imported (correctly project-scoped) test case issue into another project's
  test suite, and that cross-project issue id genuinely leaks into the foreign suite's test-case-id list for
  any real member of that other project
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, projects `rftc-016-ci-qa` (Project A, id=2) and
  `rftc-038-multisuite-qa` (Project B, id=3)
- Browser: curl (session + direct model-layer reproduction), confirmed via `rails runner` for the exact
  controller code path
- User role: Admin-equivalent console reproduction of the exact vulnerable code path; leak confirmed live as
  `dev1` (genuine Project B member, non-member of Project A)
- Date: 2026-10-22 (found while executing `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-230)

## Summary

`testcase_import_controller.rb#step2` sets `session[:selected_suite_id] = params[:selected_suite_id]` directly
from the raw, client-submitted param — with **zero check that this testsuite id actually belongs to the
project currently being imported into** (`@project`, resolved from the URL and the only thing the
`before_action :rftc_authorize_... (:add_issues, @project)` guard actually authorizes).

That unchecked value is later used, unchanged, in `import_one_row`:

```ruby
issue = Issue.new(data)
issue.project_id = @project.id   # correctly forced to the importing project -- the Issue itself is safe
...
if selected_suite_id.present?
  IssueTestSuite.find_or_create_by(
    issue_id: issue.id,
    testsuite_id: selected_suite_id   # <-- never checked against @project at all
  )
end
```

`IssueTestSuite` itself (the join model) has no project-scoping validation either — only a uniqueness
constraint on `(issue_id, testsuite_id)`:

```ruby
class IssueTestSuite < ActiveRecord::Base
  belongs_to :issue
  belongs_to :testsuite
  validates_uniqueness_of :issue_id, scope: :testsuite_id, ...
end
```

So a CSV import in Project A, with `selected_suite_id` tampered to point at a suite belonging to Project B,
genuinely creates a real link between Project A's new issue and Project B's suite.

**This link then leaks.** `test_suites_controller.rb` (and the shared `runs_controller.rb#get_test_cases`
endpoint the suite view's grid calls) resolve the suite's test case list purely by `testsuite_id`, with **no
additional project filter**:

```ruby
@issues = Issue.joins(:issue_test_suites).where(issue_test_suites: { testsuite_id: descendant_ids.uniq })
```

Confirmed live: as `dev1` (a genuine member of Project B, zero relationship to Project A), calling
`GET /get_test_cases?suite_id=<B's suite id>&project_id=rftc-038-multisuite-qa` returned
`{"testCaseIds":[2105]}` — the id of an issue that actually belongs to Project A. `dev1` separately confirmed
unable to view that issue's full content directly (`GET /issues/2105` → **403**, core Redmine's own issue-view
permission correctly holds) — so the leak is limited to the bare issue id being disclosed as "present in this
suite," not the issue's subject/description/custom fields. Still a genuine cross-project information
disclosure and a data-integrity defect (a suite's test-case membership should never include an issue from a
different project at all).

## Steps to reproduce

1. As a user with CSV import access (`add_issues`) in Project A only, start the import wizard normally through
   step1.
2. At step2, instead of submitting the real suite dropdown value, submit `selected_suite_id=<a real suite id
   belonging to Project B>` directly (bypassing the client-side dropdown, which only ever lists Project A's own
   suites — this is a server-side gap, not a UI one).
3. Complete steps 3–4 and run the import with at least one valid row.
4. As any genuine member of Project B, call `GET /get_test_cases?suite_id=<that Project B suite id>` (or open
   the suite in the Test Suites UI) and observe the newly-imported Project A issue id appears in the result.

## Expected result

- `step2` should reject a `selected_suite_id` that doesn't belong to `@project`, or `import_one_row` should
  re-validate it before creating the `IssueTestSuite` link.
- A test suite's test-case list should never include an issue belonging to a different project, regardless of
  how the link was created.

## Actual result

- `selected_suite_id` is accepted and stored in session with no project check.
- The resulting `IssueTestSuite` link is created unconditionally.
- The foreign issue id then appears in the target suite's test-case list for any member of the suite's own
  (different) project, confirmed live via `GET /get_test_cases`.

## Evidence

### Screenshot

(Not applicable — reproduced via direct model-layer replication of the controller's own code path plus a live
HTTP confirmation of the resulting leak; no UI screenshot captured since the finding is in a JSON data endpoint,
not a rendered page. Per `CLAUDE.md` §6, screenshots are for bug evidence — will add a UI screenshot of the
suite's rendered grid if requested, but the JSON response itself is clearer, direct evidence of the leak.)

### Console / log

```ruby
# Exact replication of testcase_import_controller.rb#import_one_row's vulnerable lines,
# run via `rails runner` against the real current build:
project_a = Project.find_by(identifier: 'rftc-016-ci-qa')
foreign_suite = Testsuite.where(project_id: 'rftc-038-multisuite-qa').first  # id=8, "Auth"
issue = Issue.new(subject: 'TC-TCM-230-crossproject-probe', project_id: project_a.id, tracker_id: <tcm tracker>, author_id: admin.id)
issue.save!   # => Issue #2105, project_id=2 (Project A) -- correctly scoped
IssueTestSuite.find_or_create_by(issue_id: issue.id, testsuite_id: foreign_suite.id)
# => persisted=true -- Issue #2105 (Project A) now linked to Testsuite #8 (Project B)

# Live leak confirmation, as dev1 (genuine Project B member, zero relationship to Project A):
$ curl -b <dev1 session> "http://localhost:3000/get_test_cases?suite_id=8&project_id=rftc-038-multisuite-qa"
{"testCaseIds":[2105]}

# Full-content access correctly still blocked by core Redmine:
$ curl -o /dev/null -w "%{http_code}" -b <dev1 session> "http://localhost:3000/issues/2105"
403
```

Probe `Issue #2105` and its `IssueTestSuite` link were deleted immediately after confirming the leak.

## Suggested fix

1. In `testcase_import_controller.rb#step2`, validate `params[:selected_suite_id]` against
   `Testsuite.where(project_id: @project.identifier, id: params[:selected_suite_id]).exists?` before storing it
   in session — reject (or silently clear) it otherwise, matching the pattern already used elsewhere in this
   controller for other param validation.
2. Defense in depth: add the same check in `import_one_row` immediately before the `IssueTestSuite.find_or_create_by`
   call, in case `session[:selected_suite_id]` is ever set through a different path in the future.
3. Consider adding a model-level safeguard on `IssueTestSuite` (e.g. a `before_validation` check that
   `issue.project_id` matches `testsuite.project_id`) so this class of bug can't recur via a different
   controller action later.

## Verdict

**Confirmed, High.** A real, reproducible cross-project data-integrity defect with a genuine (if limited)
information-disclosure consequence — a project member can learn that a specific issue id exists and is linked
to one of their own suites, even though they have no relationship to that issue's actual project, and core
Redmine's own issue-view permission is the only thing preventing a full content leak. Root cause is a single
missing validation in `testcase_import_controller.rb#step2`, with no defense-in-depth at the model layer either.

## Duplicate check

- Duplicate found: No — distinct from BUG-TCM-009 (page-level missing authorization on read actions) and
  BUG-TCM-089/090 (Requirements/Test-Suite-kebab permission gaps). This is specifically about CSV import's
  suite-selection step accepting an unvalidated cross-project foreign key, found while executing
  `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-230 (cross-project data isolation / IDOR section).
- Existing bug reference (if duplicate): n/a

## Production report

Reported to production `ztflux` as **#124346** on 2026-10-22, per explicit user instruction ("bugs report kr do
production pe"). Tracker Bug, Priority High, Category "Testcase Management Plugin", Target version "Testcase
Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link (matching the BUG-TCM-087/088/089/090 pattern). Custom fields (Defect Type/Severity/priority)
left at project defaults — `list_custom_fields` returns a permission error for this account.
