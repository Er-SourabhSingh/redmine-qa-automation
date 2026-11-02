# BUG-TCM-131

- Bug ID: BUG-TCM-131
- Production Redmine Issue ID: #127377 — "BUG-TCM-131: Requirements page's \"get all testcases\" endpoint ignores its own limit parameter, freezing the UI", assigned Vaishnavi Bhawsar, Target Version "Testcase Management plugin Release 7.3.0"
- Title: Requirements page's "get all testcases" endpoint ignores its own `limit` parameter — fetches and synchronously serializes EVERY testcase/feature-tracker issue in the project on every page load, freezing the UI
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.2.0)
- Environment: Docker `localhost:3000`
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-11-02

## Steps to reproduce

1. Open a project with a large number of Testcase/Feature-tracker issues (this instance: `alpha-web` has 953, `rftc-perf-500` has 1,500, `rftc-016-ci-qa` has 98, `my-testcase-project` has 69 — every project with meaningful testcase coverage is affected, not just an extreme outlier).
2. Open `/requirements?project_id=<id>` (the Requirements page).
3. Watch the Network tab for the request to `/requirement/testcases?project_id=<id>&limit=100` and note its duration and response size.

## Expected result

- Per the frontend's own explicit `limit=100` query parameter (`assets/javascripts/script.js`'s `getAllIssues()` function), the endpoint should return at most 100 issues, keeping the request fast and the response small regardless of how many testcase-tracker issues the project actually has.

## Actual result

- The `limit` parameter is **silently ignored** — `RequirementsController#testcases` never references `params[:limit]` anywhere:
  ```ruby
  def testcases
    project = Project.find(params[:project_id])
    tracker = ...
    feature_tracker = ...
    issues = Issue.where(project_id: project.id, tracker_id: [tracker, feature_tracker]).order(created_on: :desc)
    respond_to do |format|
      format.json {render json: issues}
    end
  end
  ```
  No `.limit(...)` call exists in this action at all. On `rftc-perf-500` (1,500 matching issues), the real request measured **1,670 ms** server-side, with **1,498 ms of that in view/JSON-rendering time alone** (only 5 SQL queries, 160 ms — the bottleneck is serializing 1,500 full `Issue` objects to JSON, not the database). Confirmed independently via `bin/rails runner`: loading the 1,500 records takes 88 ms, but `.to_json` on them alone takes 423 ms (the live request's total was higher still, consistent with ActionController's additional JSON-rendering overhead).
- **This is made significantly worse by how the frontend calls it**: `getAllIssues()` in `assets/javascripts/script.js` issues this as a **synchronous** jQuery AJAX call (`async: false`) — meaning the entire browser tab's JS execution (and often visible UI interaction) freezes for the full duration of this unbounded request. This directly matches the user's report of "bhot loading" (heavy/long loading) when opening the Requirements section.
- This scales directly with a project's testcase count. `alpha-web`'s 953 matching issues and `rftc-perf-500`'s 1,500 both reproduce a multi-second freeze; even `rftc-016-ci-qa` (98) and `my-testcase-project` (69) are on the same unbounded code path and will get progressively worse as more test cases are added over the plugin's normal lifecycle — this is not a one-off caused by unusually large test data, it is the plugin's default, unthrottled behavior for any project with substantial testcase coverage.

## Evidence

### Console / log

Real Rails server log line for `/requirement/testcases?project_id=4&limit=100` on `rftc-perf-500` (1,500 matching issues):
```
Completed 200 OK in 1670ms (Views: 1498.4ms | ActiveRecord: 160.4ms (5 queries, 0 cached) | GC: 42.7ms)
```
Confirmed via `bin/rails runner` on the same dataset:
```
count=1500
load time=0.088435697...   # loading the AR relation
to_json time=0.423432174... # serializing it to JSON alone
```
Confirmed the frontend's own intent via source: `assets/javascripts/script.js`:
```js
function getAllIssues(allowAppend) {
  jQuery.ajax({
    type: "GET",
    url: `${url}/requirement/testcases?project_id=${projectId}&limit=100`,
    dataType: "json",
    crossDomain: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    async: false,
    ...
```
Confirmed via `bin/rails runner` that the real counts of affected projects' matching issues are not edge cases:
```
["rftc-perf-500", 1500]
["alpha-web", 953]
["my-testcase-project", 69]
["rftc-016-ci-qa", 98]
```
Confirmed `grep -n "limit" app/controllers/requirements_controller.rb` returns zero matches anywhere in the file.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
