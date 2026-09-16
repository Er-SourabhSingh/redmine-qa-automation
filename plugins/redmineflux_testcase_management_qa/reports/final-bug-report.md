# Final Bug Report — Redmineflux Testcase Management

> Generated from bugs/open/. PDF only on explicit user request.
> Last generated: 2026-09-15

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 3 | 0 | 1 | 1 | 1 |

## Open Bugs

### BUG-TCM-006 — Medium

**Failed PDF generation still sends an email whose body promises an attachment that is not there, with nothing surfaced in the UI**

When a report is emailed as PDF and PDF generation **fails for any reason**, the `rescue` in `run_mailer.rb` logs
the error and then calls `mail(...)` anyway — delivering a bare `text/html` message (1,767 bytes) with no
attachment MIME part, whose body still reads *"Please find the attached Testcase Report"*. The report is created
and listed as though it had succeeded; the only trace is one Sidekiq log line an end user never sees.

**Split out of BUG-TCM-005 on 2026-09-15.** That bug tracked the customer-reported missing attachment, which was an
incomplete installation and is now fixed and closed. This is the distinct error-handling defect that remains on a
**correctly installed** server — a Puppeteer timeout, render crash or OOM in production reproduces it.

Confirmed by inducing a *different* failure cause than the original (`PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`
rather than `node` absent), proving the defect is in the error handling, not in any one cause. Affects all six
report types, which share the single `send_report` method.

**Format scope:** the misleading body line lives in `send_report.html.erb`, a template **shared by both formats** —
so a fix that only patches the `rescue` leaves the text one change away from resurfacing. In practice only the PDF
branch manifests the defect: the HTML branch has **no `begin`/`rescue`**, so a failure there raises and no email is
sent. HTML was verified working normally (TC-TCM-521, all six types) and not regressed by the install; HTML
**under a forced failure** remains untested, and matters more once the proposed HTML-fallback fix lands.

**Cannot be reproduced from the browser alone** — needs shell access to break PDF generation. A browser-only
retest on a healthy instance yields a false pass.

Development reports a fix (`dee611e` — HTML fallback plus a conditional body; `58c68d2` / `9e82662` — dependency
validation), **unpushed and unverified by QA**. Existing unit coverage stubs Grover, so it is not a real render.

Retest vehicle: **TC-TCM-524**. Found on Docker `localhost:3012` (Redmine 6.1.3). Production: **#120658**.
File: `bugs/open/BUG-TCM-006.md`

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
| BUG-TCM-005 | Report emailed as PDF arrives with no attachment at all, while the body still says "Please find the attached Testcase Report" | High | 2026-09-15 | Retest PASS 2026-09-14 (TC-TCM-523): after completing Installation step 6, PDF email delivers 74,652 B `multipart/mixed` with a valid 53,446-byte attachment, 9/9 streams inflate. Root cause was an **incomplete installation**, not a code defect. Reports-suite partial regression: TC-TCM-521, 523, 525 PASS. Residual finding split to **BUG-TCM-006**. Production **#120588** to sync Done / 100% |

## Environment

- Redmine Version: 7.0.0
- Plugin Version: 7.0.0
- Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`, project `test-project`) — BUG-TCM-001 … BUG-TCM-004
- Environment: Docker `localhost:3012` (container `redmine-docker-6-redmine-1`, Redmine 6.1.3, project `test`) — BUG-TCM-005
- Test Date: 2026-09-11 (TCM-001…004), 2026-09-14 (TCM-005)
