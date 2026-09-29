# BUG-HLP-068

- Bug ID: BUG-HLP-068
- Production Redmine Issue ID: 121459
- Title: Knowledgebase page-list endpoint returns 204 No Content instead of real data, so the sidebar tree never shows any articles — a regression introduced by the BUG-HLP-066 fix
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: branch `helpdesk_budget`, commit 6611697 (the BUG-HLP-066 fix commit)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Severity: High
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Open any project's Helpdesk → Knowledgebase tab that has at least one real article (e.g. `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase`, which has 7 real pages).
3. Inspect the sidebar article tree and the network request it makes.

## Expected result

The sidebar lists every article that exists for the project (as it did before the plugin gained any of today's Basic-Auth fixes).

## Actual result

The sidebar tree is empty (just "Knowledgebase +", no rows), even though real articles exist. `GET /rf_knowledgebase_pages?project_id=1` returns **`204 No Content`** — no body at all — instead of `200` with a JSON array. Confirmed via `rails runner` that the underlying data is real: 7 pages exist for this project, including one created live during this session (`id=25`).

Individual pages still load fine by direct URL (`?page_id=25` shows the real content), so this isn't a data problem — it's specific to the "list all pages" call.

## Root cause

`RfKnowledgebasePagesController#index`:

```ruby
respond_to do |format|
  format.html
  format.json { render json: @pages }
end
```

This has both a `format.html` branch (bare, with no corresponding view template) and `format.json`. The JS that calls this endpoint (`getAllPages()` in `rf_knowledgebase.js`) issues a plain `jQuery.ajax({ type: "GET", url: ".../rf_knowledgebase_pages?project_id=..." })` with no `dataType` and no explicit `Accept` header — it relied entirely on the URL's `.json` suffix to tell Rails which format to render.

BUG-HLP-066's fix removed that `.json` suffix from every AJAX call in the file (correctly — it's what caused the browser's native Basic-Auth popup). But without the URL extension, and without the JS forcing JSON via `dataType`/`Accept`, Rails' format negotiation falls back to `:html`. Since there's no `index.html.erb` template and the request is XHR, Rails' `ImplicitRender` doesn't raise — it silently does `head :no_content` (204). The JS's `success` callback receives an empty response and renders zero rows.

This does **not** affect every one of the other 18 URLs that lost their `.json` suffix — `#show` (single-page content), for example, has *only* `format.json` (no html branch at all), so if it hit the same fallback it would loudly 406 instead of silently 204; live testing confirms it still works, meaning its own JS call is one of the two calls in this file that already sets `dataType` explicitly. `getAllPages()` is not.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-068/knowledgebase-empty-tree.png)

### Console / log

```
GET http://localhost:3012/rf_knowledgebase_pages?project_id=1 => [204] No Content
```

`rails runner` confirming real data exists:
```
pages for project 1: 7
  id=3 title=Resetting your password
  id=4 title=TC-HLP-163 Child Article - Common reset issues
  id=5 title=TC-HLP-163 Real Child Test
  id=6 title=TC-HLP-179 Draft Article Not Published
  id=7 title=TC-HLP editor block types test
  id=13 title=BUG-HLP-048 retest - real nesting test child
  id=25 title=BUG-HLP-066 retest 2026-09-28 - Knowledgebase Basic Auth fix
```

`RfKnowledgebasePagesController#index`, current source (post-BUG-HLP-066-fix):
```ruby
def index
  @project = Project.find(params[:project_id])
  @pages   = RfKnowledgebasePage.where(project_id: @project.id)
  ...
  respond_to do |format|
    format.html
    format.json { render json: @pages }
  end
end
```

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-068/retest-yyyy-mm-dd-pass.png)

## Notes

- Found while retesting BUG-HLP-066 (2026-09-28) — not present in that bug's own original report; a genuine new regression from its fix, not the original symptom recurring.
- Likely fix: either add `dataType: "json"` (or an explicit `Accept: application/json` header) to `getAllPages()`'s `$.ajax` call, matching whichever of the other two calls in the file already does this correctly, or remove the bare `format.html` branch from `#index` so a format mismatch fails loudly instead of silently. The first is more surgical and lower-risk.
- Worth a broader check once fixed: grep every other AJAX call in this file for the same "no explicit dataType, relies on URL extension" pattern, in case any of the other 18 share this exact risk and just haven't been triggered by this session's specific retest steps.

## Duplicate check

- Duplicate found: No.
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121459** (`ztflux`), tracker Bug, Priority High, Category Helpdesk Plugin, assigned to **Vaishnavi Bhawsar** (id 192). Attached to Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") via `report_defect`, testcase result Failed. All fields checked via `get_issue`.
