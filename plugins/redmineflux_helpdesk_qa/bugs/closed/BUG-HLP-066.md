# BUG-HLP-066

- Bug ID: BUG-HLP-066
- Production Redmine Issue ID: 121405
- Title: Opening a project's Knowledgebase tab throws up a native browser "Sign in" (HTTP Basic Auth) prompt and hangs the whole tab, even for an already logged-in user
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP), and Chrome per the reporting user's own screenshot (Incognito)
- User role: Admin (this session); reported by the user as reproducing for a logged-in user generally
- Severity: High
- Date: 2026-09-28

## Steps to reproduce

1. Log in (any role).
2. Navigate to a project's Helpdesk → Knowledgebase tab (`/projects/<project>/helpdesk/knowledgebase`), e.g. `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase`.

## Expected result

The Knowledgebase tab opens directly for a user who is already logged in — the same as every other Helpdesk tab (Dashboard, Tickets, Reports, Settings). No login prompt of any kind should appear.

## Actual result

A **native browser "Sign in" dialog** (HTTP Basic Auth — the browser's own chrome-level credential prompt, not a page popup) appears over the page, asking for a Username and Password for `http://localhost:3012`. This is not Redmine's own login form; it's the browser intercepting a request that returned a `401` with a `WWW-Authenticate: Basic` header.

Reproduced live via Playwright MCP as an already-authenticated `admin` session:
- Navigating to the project's Helpdesk dashboard (`/projects/helpdesk-qa-alpha/helpdesk`) and then to the Knowledgebase tab left the page permanently on **"Loading http://localhost:3012/projects/helpdesk-qa-alpha/helpdesk"** — the tab never finished loading.
- Every further command against that tab (navigate, snapshot, keyboard input) timed out. The tab was completely unusable until abandoned.
- A **fresh tab**, still on the same authenticated session (cookies intact), navigated directly to `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase` and hit the **identical hang** — confirming this is not a one-off, and not caused by stale session state from the first tab.
- Pressing Escape and other page-level interactions had no effect, and Playwright's own dialog-handling tool (`browser_handle_dialog`) reported **no dialog present** — because this is a browser-chrome-level HTTP Basic Auth challenge, not a page-level JS dialog. Nothing at the page level can dismiss it.

This matches the user's own screenshot exactly: same URL shape (`localhost:3012/projects/helpdesk-qa-alpha/helpdesk/knowledgebase`), same native "Sign in" dialog reading `http://localhost:3012`.

**Impact:** since this is a genuine browser-level auth challenge, not a page dialog, a real user has no way to dismiss it from the page itself — the only way out is closing the tab or entering credentials the plugin never told them to expect. It effectively locks the tab.

## Evidence

### Screenshot

Per the reporting user's own screenshot: a native browser "Sign in" dialog reading `http://localhost:3012`, with blank Username/Password fields, over a blacked-out `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase` page, in an Incognito window.

### Console / log

- `browser_network_requests` on the hung tab showed only the initial `[GET] http://localhost:3012/projects/helpdesk-qa-alpha/helpdesk => [200] OK` — the request that actually triggers the `401`/Basic-Auth challenge (most likely a Knowledgebase asset, image, or an API call the Knowledgebase view makes) never completed and so never appeared in the request list.
- `browser_handle_dialog` → `"Error: The tool can only be used when there is related modal state present."` — confirms this is not a JS `alert()`/`confirm()`, but a lower-level HTTP auth prompt.
- Root cause not yet pinned to a specific request/asset; this needs a source-level check (e.g. an embedded image or API call inside the Knowledgebase view pointed at a Basic-Auth-protected endpoint or a misconfigured absolute URL) rather than further black-box probing, since every further live attempt just re-hangs the browser.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-066/retest-yyyy-mm-dd-pass.png)

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 6611697)

**CONFIRMED FIXED — core symptom resolved, but a real regression was found and is tracked separately (BUG-HLP-068).**

- Confirmed in source: every one of the 19 AJAX URLs in `rf_knowledgebase.js` had its `.json` extension removed (only 1 remaining match, a code comment referencing an old bug, not a live URL).
- Live: `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase` loads cleanly on the very first visit, no native Basic-Auth dialog, no hang. Reproduced clean on a second fresh navigation.
- Created a real article through the UI (title "BUG-HLP-066 retest 2026-09-28 - Knowledgebase Basic Auth fix") — creation succeeded (`201`), and its content loads correctly by direct URL (`?page_id=25`), confirmed via `rails runner` that the record genuinely persisted (7 real pages for this project, including the new one).
- **New regression found while retesting, not present in the original bug report**: the page-list endpoint (`GET /rf_knowledgebase_pages?project_id=1`) now returns `204 No Content` instead of the real JSON array, so the sidebar tree never populates — confirmed via `browser_network_requests` on every fresh load, and root-caused in source: `RfKnowledgebasePagesController#index` has both `format.html` (bare, no template) and `format.json`; without the `.json` URL suffix and with the JS's plain `$.ajax` call not forcing `dataType`/`Accept`, Rails resolves the request to `:html`, finds no template, and — because it's an XHR request — Rails' `ImplicitRender` silently returns `204` instead of erroring. `#show` (single-page content) still works because its own JS call is one of the two calls in the file that does set `dataType` explicitly. Filed as **BUG-HLP-068**, since this is a new defect the fix itself introduced, not the original symptom.

Moving to `bugs/closed/` — the specific bug reported here (native Basic-Auth dialog hanging the tab) is genuinely fixed. The new list-endpoint regression is tracked on its own ticket.

## Duplicate check

- Duplicate found: No.
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121405** (`ztflux`), tracker Bug, Priority High, Category Helpdesk Plugin, assigned to **Vaishnavi Bhawsar** (id 192). Defect Type / Severity / priority: Functional / Medium-severity / Medium (defaults; not adjusted to match High). Attached to Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") via `report_defect`, testcase result Failed. The testcase now shows `defects:[121399, 121400, 121402, 121403, 121405]`. All fields checked via `get_issue`.

**Closed on production 2026-09-28**: #121405 → Status **Done**, % Done → **100**, per explicit user instruction, with a retest-summary note (including a pointer to the new BUG-HLP-068 regression found during this retest). Confirmed via `get_issue`.
