# BUG-TCM-052

> **CLOSED — 2026-10-07.** Production #122691 (https://flux.zehntech.com/issues/122691) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-052
- Production Redmine Issue ID: #122691 (https://flux.zehntech.com/issues/122691) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: Bulk-assigning a Requirement from the Test Cases list's right-click context menu 404s -- the link reaches the server as a GET instead of the POST its route requires
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Medium
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

On the Test Cases list page, selecting one or more test cases and right-clicking opens Redmine's standard context menu, which includes a "Requirements" submenu (added by this plugin) listing the project's requirements -- clicking one is supposed to bulk-assign that requirement to every selected test case. Clicking it instead navigates the whole page to a 404 error ("The page you were trying to access doesn't exist or has been removed."), with the attempted assignment never happening.

## Root cause

The route is registered POST-only:

```
post 'requirement_issues/assign_requirement', to: 'test_suites#assign_requirement', as: 'assign_requirement_to_issues'
```

and the context menu's own link is built correctly, requesting a POST via Redmine's standard `context_menu_link`/`link_to ..., method: :post` mechanism (Rails UJS). But the browser's address bar after clicking shows the request actually reached the server as a **GET**, with every parameter serialized into the query string -- exactly what a plain `<a href>` navigation looks like, not a UJS-intercepted POST.

Confirmed mechanically that the route itself is genuinely POST-only and not simply broken generally:

```
GET  /requirement_issues/assign_requirement           -> 404 (route doesn't exist for GET)
POST /requirement_issues/assign_requirement (no auth) -> 422 (route exists, hits CSRF/param validation next)
```

So Rails' own `data-method="post"` click-rewrite (rails-ujs, confirmed present as a compiled asset) is not firing for this specific link -- the browser just follows the raw `href` as a native GET. This context menu's "Requirements" entry is nested one level deeper than Redmine's other `context_menu_link` items (inside a `<li class="folder"><a class="submenu">Requirements</a><ul>...</ul></li>` flyout structure this plugin adds), which is a different DOM shape than the flat top-level items Redmine's own context menu normally uses -- this is likely relevant to why UJS doesn't intercept the click here specifically.

## Steps to reproduce

1. On a project's Test Cases list page, select one or more test cases via their checkboxes.
1. Right-click to open the context menu.
1. Hover/click "Requirements" to open its submenu, then click any listed requirement.

## Expected result

The selected test case(s) should be bulk-assigned to the clicked requirement, with the context menu closing and the list reloading or showing confirmation -- no page-level 404.

## Actual result

The entire page navigates to a Redmine 404 error page, with the attempted assignment never happening. Confirmed on two separate attempts, both showing the same 404 at the same URL shape.

## Evidence

```
$ curl -o /dev/null -w "%{http_code}" "http://localhost:3015/requirement_issues/assign_requirement?ids[]=109&back_url=%2Ftest_suites"
404

$ curl -X POST -o /dev/null -w "%{http_code}" "http://localhost:3015/requirement_issues/assign_requirement"
422   (route exists for POST -- fails on CSRF/params next, not routing)
```

## Environment

- Redmine version: 6.x (Docker)
- Plugin version: 7.1.0
- Environment: Docker localhost:3015 (project compat-fresh-project)
- User role: Administrator

---

## Production history (synced from #122691 on 2026-10-08)

### 2026-10-07 06:37 UTC — Vaishnavi Bhawsar

Fixed — and the real cause turned out to be different from what it looked like from the browser.

It wasn't actually about GET vs POST under the hood — the right-click menu was sending the correct request type all along. The real problem was on the receiving end: this action was being checked against the wrong thing (as if it belonged to a single test suite), which it never did, so the permission check always rejected it and sent back a plain "page not found" — every single time, for everyone, regardless of what was clicked. It's now checked against the right thing (the project itself), and succeeds normally.

Screenshot attached: the test case's own page now shows the bulk-assigned requirement under its Requirements field, confirming the assignment went through and was saved for real.

For QA:
1. On the Test Cases list, select one or more test cases, right-click, open "Requirements", and click any listed requirement.
2. Confirm it no longer goes to a "page not found" error, and instead returns you to the list with a success message.
3. Open one of the selected test cases and confirm the requirement now shows under its Requirements field.

### 2026-10-07 07:25 UTC — Sourabh Singh

Retested on master `c43c588` (commit 852b127, which cites this bug by name). Root cause confirmed: assign_requirement bulk-links by project_id alone and never touches a single test suite, but was gated by an authorization check requiring a test_suite_id this action never sends -- so it always 404'd regardless of anything else. Fixed with a correctly-scoped authorization check. Retested with the exact numeric project_id the real context-menu link sends: got a 302 redirect (no more 404) and confirmed a genuine RequirementIssue row was created. Closing.
