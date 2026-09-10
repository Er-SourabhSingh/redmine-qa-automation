# Bug Report Template

- Bug ID: BUG-HLP-001
- Production Redmine Issue ID: 119555
- Title: New Customer form shows a permanently stuck "Login must be at least 2 characters long" validation message that does not reflect whether the account was actually created — misleading, not a hard functional block
- Redmine version: (Redmineflux, see QA_CREDENTIALS_FORGE.md — Forge instance)
- Plugin name: redmineflux_helpdesk
- Plugin version: 6.2.0
- Environment: Forge (`https://flux-fiqll6jza49.forge.zehntech.com/`)
- Browser: Chromium (Playwright MCP)
- User role: reproduced as both Administrator (`admin`) and Team Lead (`manage_helpdesk` granted, user `daisy.skye`)
- Date: 2026-08-21

## ⚠ Severity revised down from Critical to Medium — read "Retest" section before triaging

The first several attempts in this session appeared to show the Create button doing nothing at all (no navigation, customer absent from the list afterward). **A later retry with an equivalent, unremarkable form fill succeeded** — "Successful creation" message shown, and the new customer confirmed in the list — **despite the exact same stale error still visibly showing on screen at the moment Create was clicked.** So the bug is not "customer creation is blocked": it's "the Login field shows an incorrect, permanently-stuck validation error that does not track whether submission will actually succeed." That is still a real, user-facing bug (it will make real users think their submission failed, or hesitate to click Create believing the form is invalid) — but it is not the hard functional blocker originally reported. See "Retest" below for the full detail.

## Steps to reproduce (the misleading error itself — reproduces 100% of the time)

1. Sign in as any user with access to Helpdesk Customers (confirmed for both `admin` and `daisy.skye`)
2. Navigate to Helpdesk → Customers → New Customer (`/rf_customers/new`)
3. Observe: the error **"Login must be at least 2 characters long"** is already showing, before any field is touched
4. Type any valid login (tried: 12-character value, the field's own stated 2-character minimum, real sequential keystrokes, `.fill()`, waiting 3+ seconds afterward) — the message never updates or clears, regardless of interaction pattern
5. Fill the rest of the form normally and click **Create**

## Expected result

- The validation message should clear once the Login field contains 2+ characters, and should accurately reflect whether the form is actually submittable

## Actual result

- The message is frozen from initial render and never re-evaluates against the field's real content, for the whole session, regardless of what's typed — confirmed harmless, cosmetic desync (see Retest below), but still misleading to a real user
- **Confirmed NOT a data-formatting issue**: inspected the raw DOM value via `JSON.stringify(el.value)` after typing `janecustomer` — exactly `"janecustomer"`, `.length` 12, `.trim().length` also 12. No whitespace, no hidden characters.
- **Confirmed NOT caused by the "Project access" section**: reproduces identically whether or not the Project/SLA/Support Level/Organization dropdowns are touched.

## Retest — the actual functional impact is inconsistent, not a hard block

Multiple earlier attempts this session (`jane.customer`, `janecustomer`, `validusername123`) appeared to fail outright: clicking Create left the page on `/new` with the same stale error, and none of those logins ever appeared in the customer list afterward. Based on that, this bug was originally filed as **Critical — customer creation completely blocked**.

A later retry — same page, same stale error visibly present, same simple fill-and-click pattern (Login `retrytest01`, First name `Retry`, Last name `Test`, Email `retrytest01@example.com`, Generate password checked, Project access left untouched) — **succeeded**: the page navigated to `/rf_customers`, showed "Successful creation. Welcome email sent to customer successfully.", and `Retry Test` / `retrytest01` is confirmed present in the customer list.

This means:
- The stuck error message does **not** reliably predict or block the actual outcome
- Something about the earlier failed attempts differed from this successful one, but it is **not** the presence of the stale error (that was identical in both), and **not** the Project access section (untouched in both this retry and at least one earlier failed attempt)
- Whoever investigates should look for a genuine intermittent condition (timing/race on initial page load before the form is "ready", a stale request from a previous failed submit attempt still in flight, session/CSRF token staleness after repeated attempts on the same loaded page, etc.) rather than assuming the field validation logic itself is the root cause of failed submissions — it may be an unrelated, separate issue that happened to correlate with the same visibly-broken screen

## Evidence

### Screenshot (original — stuck error on fresh load)

![Bug evidence](../../screenshots/BUG-HLP-001/bug-hlp-001-login-validation-stuck.png)

### Evidence — successful creation despite the same stuck error

![Successful creation despite stale error](../../screenshots/BUG-HLP-001/retest-2026-08-21-customer-created-despite-stale-error.png)

### Console / log

- No JavaScript console errors observed on any attempt (only an unrelated verbose autocomplete-attribute suggestion)
- Earlier attempts: `browser_network_requests` filtered on "customer" showed no matching request after clicking Create — but given the later successful retry, this may have been checked against a stale/wrong browser tab (multiple tabs were open during this session) rather than proof the request never fired; not to be trusted as conclusive without a clean re-check in a single-tab session

## Additional diagnosis

- Reproduced identically (the visible error, not necessarily the failure) while signed in as `admin` and `daisy.skye` — rules out a role/permission-specific cause for the error display itself
- **Open question, not yet resolved:** `/rf_helpdesk/customers` also lists 2 customers ("s s" / `sourabhsingh2063@gmail.com` and "sourabh singh" / `er.sourabh.singh0601@gmail.com`) that predate this session and weren't created by any attempt made here. Combined with the inconsistent retry result above, this is consistent with the form generally working, with only some attempts failing for a reason not yet isolated.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (this is the first bug filed for this plugin; `bugs/_index.md` was empty)

## Retest — 2026-08-27, Local (redmine-docker-6), fresh rebuilt environment

- **Context**: Retested on Local's `alpha.customer`-fixture project (Helpdesk QA Alpha), on a fully rebuilt environment (see `bugs/closed/BUG-HLP-014.md` same-day rebuild notes) — zero shared history with the original Forge repro (`admin`/`daisy.skye` on `flux-fiqll6jza49`).
- **Fresh page load**: Navigated to Helpdesk → Customers → New Customer via genuine click-through. **No "Login must be at least 2 characters long" error, or any error, visible on initial render** — the original bug's defining symptom (stuck error before any field is touched) did not reproduce. Screenshot: `retest-2026-08-27-fresh-load-no-error.png`.
- **Typed a valid login** (`retest.customer1`, 17 characters): no error appeared at any point while typing or after.
- **Completed and submitted the form** (First name, Last name, Email, Password, Confirmation, Project access left untouched — matching the original bug's successful retry pattern): **succeeded on the first attempt** — "Successful creation. Welcome email sent to customer successfully.", customer confirmed present in the list immediately. No retry needed (unlike the original session, which needed multiple attempts before one succeeded). Screenshot: `retest-2026-08-27-first-try-success.png`.
- **Verdict: Does NOT reproduce on Local, first try, no retry needed.** This is consistent with this bug's own history — it also failed to reproduce across the last several sessions this engagement checked it (see `HELPDESK_HANDOFF.md`'s Open Bugs section, "has not reproduced across any of the last three sessions' customer creations"). However, the **original report was on Forge**, a materially different environment/build from Local, and the bug's own root-cause investigation was never completed (the "Additional diagnosis" section above explicitly flags the cause as unconfirmed, unlike e.g. BUG-HLP-014 which had a full source-level root cause). A clean Local retest does not by itself prove the Forge-side symptom is gone — recommend a dedicated Forge retest before closing, given the cause was never actually identified/fixed, only observed to stop reproducing.

## Closed — 2026-08-27

- **Closed per user explanation**: when a new Forge server is created, it pulls/updates from a fresh plugin clone — so whatever version-specific state caused this stuck-validation-message symptom on the original `flux-fiqll6jza49` instance does not carry forward to later Forge server instances. Combined with this session's clean Local retest (no repro, first-try success, no stuck error at any point), this is now considered resolved.
- **Process note (for the record):** the underlying root cause was never definitively identified in code (unlike e.g. BUG-HLP-014, which had a full source-level diagnosis) — this closure rests on consistent non-reproduction plus the user's explanation of why the original Forge instance's state doesn't persist, not on a confirmed code fix. If a stuck/incorrect Login validation message reappears on any environment, file a new bug rather than reopening this one.
