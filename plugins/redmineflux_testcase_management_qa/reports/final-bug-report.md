# Final Bug Report — Redmineflux Testcase Management

> Generated from bugs/open/. PDF only on explicit user request.
> Last generated: 2026-09-11

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 2 | 0 | 1 | 0 | 1 |

## Open Bugs

### BUG-TCM-003 — High

**Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call**

Selecting two or more test cases inside a test run and using **Bulk Update Result** never saves anything.
`POST /testcase_status_results/bulk_create.json` is answered with **401 Unauthorized** even though the user is
fully logged in and the same session is accepted everywhere else in the same tab. The route is declared with
`defaults: { format: 'json' }`, so Redmine core's `api_request?` is true and `find_current_user` skips session
lookup entirely — `User.current` is `anonymous` and core's `check_if_login_required` halts the chain before the
plugin's own `restore_session_user_for_api` filter can run.

Independent of environment, status, execution notes, and selection size. The endpoint's own logic is sound —
the same payload with HTTP Basic (API) auth returns `201 Created`. Single-test-case **Add Result**, which posts
to a non-`.json` route, works normally. Feature is unusable from the UI for every role.

The same `.json` + `defaults` pattern is used on four sibling routes (`routes.rb:163, 167, 168, 175`) that should
be checked for the identical defect.

File: `bugs/open/BUG-TCM-003.md`

### BUG-TCM-004 — Low

**Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line**

The line renders literally as `Apply to <strong>2</strong> testcase(s).` — a markup-bearing locale string
(`en.yml:927`) rendered through escaping `<%= %>`. Cosmetic; does not block the bulk update.

File: `bugs/open/BUG-TCM-004.md`

## Closed Bugs

| Bug ID | Title | Severity | Closed | Verification |
|---|---|---|---|---|
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing whitespace | Medium | 2026-09-11 | Retest PASS (case #1014 before → #1023 after) + full CSV Import suite regression, 16/16 PASS |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with no warning | Medium | 2026-09-11 | Retest PASS (explicit duplicate-header warning now shown before confirm; case #1024) + same regression |

## Environment

- Redmine Version: 7.0.0
- Plugin Version: 7.0.0
- Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`, project `test-project`)
- Test Date: 2026-09-11
