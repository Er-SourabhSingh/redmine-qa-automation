# Bug Report Template

- Bug ID: BUG-HLP-014
- Production Redmine Issue ID: 119664
- Title: A customer's own Tickets list shows "0 tickets" / "No tickets yet" even when their tickets genuinely exist and are individually reachable — root cause: the list's query uses Redmine's native `Issue.visible(user)`, which requires real project Membership, while customers are (by design) linked only via `RfProjectCustomer`, not Membership
- Redmine version: (see QA_CREDENTIALS_LOCAL.md — Local, redmine-docker-6)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Local (http://localhost:3012, redmine-docker-6)
- Browser: Chromium (Playwright MCP)
- User role: Client (Customer) — `alpha.customer`, reproduced again with a brand-new customer `delta.customer` (see step 10 below)
- Date: 2026-08-27

## Steps to reproduce

1. Log in as `alpha.customer` (a real Customer with a project-access row on Helpdesk QA Alpha).
2. From "My Helpdesk" (`/helpdesk`), click **View** on Helpdesk QA Alpha, then **New issue**.
3. Fill in Subject/Description/Priority, click **Create**. Result: "Successful creation." — ticket #74 created (confirmed as admin: it's real, appears in the project's ticket list with 5 total tickets, Author "Alpha Customer", Organization "Alpha Org").
4. Redirected automatically to `/projects/helpdesk-qa-alpha/helpdesk/tickets` (her own project's Tickets tab). Observe: **"Helpdesk QA Alpha · 0 tickets"** and an empty state reading "No tickets yet — Tickets raised in the selected date range will appear here."
5. Reload the same URL directly — same result, "0 tickets", persists (not a one-time redirect artifact).
6. Click the **Filters** button on this page — only a **Status** filter is exposed ("All"). There is no Date Range control anywhere on this page for the customer, unlike the Admin/Agent Helpdesk Dashboard (which has a visible "Date Range" button) — yet the empty-state copy explicitly blames "the selected date range."
7. Confirm the ticket individually is reachable and correct: navigated directly to `/projects/helpdesk-qa-alpha/helpdesk/issues/74` (the branded per-project ticket route) as `alpha.customer` — opens correctly, full ticket content visible.
8. Confirm via admin: same URL (`/projects/helpdesk-qa-alpha/helpdesk/tickets`) as admin shows **"Helpdesk QA Alpha · 5 tickets"**, including ticket #74 with the exact subject/author from step 3.
9. **Re-reproduced fresh 2026-08-27, clean session**: logged out completely, logged back in as `alpha.customer`, navigated purely by clicking (My Helpdesk → **View** on Helpdesk QA Alpha → **Helpdesk Tickets** tab) — no typed URLs anywhere in the path. Same result: **"Helpdesk QA Alpha · 0 tickets" / "No tickets yet."** Notably, the **My Helpdesk landing page one click earlier correctly showed "2 open"** for this same project (she genuinely has tickets #68 and #74, both open) — so the aggregate ticket-count query is correct, but the actual Tickets list view still renders empty. This narrows the defect specifically to the list view's query/rendering, not the underlying count logic.
10. **Reproduced again with a brand-new customer 2026-08-27, to confirm this isn't specific to `alpha.customer`'s history.** Created `delta.customer` (id=19) from scratch via Helpdesk → Customers → New Customer, with a fresh Alpha project-access row (Alpha Standard SLA / L1). Signed in as her, clicked through My Helpdesk → View → New issue, created ticket **#77** ("Successful creation.") — then landed on her Tickets tab: **"Helpdesk QA Alpha · 0 tickets" / "No tickets yet,"** identical symptom on a customer with zero prior history. Confirmed at the query level via `rails runner`: `Issue.visible(delta_customer).where(project_id: 3).count = 0`, despite ticket #77 genuinely existing with her as author. This is the mechanism directly, not an inference — see Root Cause below.
11. **Confirmed the bug survives a full environment restart, ruling out any transient/caching explanation.** Restarted both `redmine-docker-6-redmine-1` and `redmine-docker-6-db-1`, re-started Redis and Sidekiq inside the app container (neither survives a container restart — Sidekiq re-registered its 3 cron jobs cleanly on boot), then did a completely fresh login as `delta.customer`. Result: identical — "My Helpdesk" landing page correctly showed "1 open" for Helpdesk QA Alpha, but the Tickets list still showed "Helpdesk QA Alpha · 0 tickets" / "No tickets yet." Confirms this is a deterministic, code-level authorization-scope issue (per Root Cause below), not anything dependent on server/session state.

## Expected result

- Per `HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-015: "the customer's ticket list shows this ticket and no others they didn't raise." The customer's own Tickets tab should show at least the ticket she just created (and her other pre-existing ticket, e.g. #68), not an empty list.

## Actual result

- The customer's own Tickets tab (`/projects/:id/helpdesk/tickets`) shows **zero** tickets for a customer who has at least two real, existing tickets on that exact project — one created literally seconds earlier in the same session, well within any plausible date-range default.
- The empty-state message references "the selected date range," but no date-range control is exposed anywhere on this customer-facing page — there's nothing for the customer to adjust, and no visible reason the list should be filtered at all.
- The same URL shows the correct, full ticket list (5 tickets) when visited as admin — confirming this is specific to the Customer role's view of this page, not a project-wide/data problem.
- Individual tickets remain reachable directly (`/projects/:id/helpdesk/issues/:id`), so this is isolated to the **list** query/view for the Customer role, not a total access break.
- This breaks a core self-service promise of the customer portal — a customer cannot see their own ticket history at all through the primary "Helpdesk Tickets" tab, only by knowing/guessing a direct ticket URL.

## Root cause (confirmed via plugin source + a Rails runner check, not inferred from the UI alone)

Inspected `RfProjectHelpdeskController#tickets` and the `RedminefluxHelpdesk::TicketFilter` class it delegates to (`/usr/src/redmine/plugins/redmineflux_helpdesk/lib/redmineflux_helpdesk/ticket_filter.rb` inside the container), then confirmed the actual data with `rails runner`:

```
User: alpha.customer (id=15), is_helpdesk_customer?=true
Redmine Memberships:
RfProjectCustomer rows:
  project_id=3 sla_id=1
```

**`alpha.customer` has zero real Redmine project Memberships.** She is linked to Helpdesk QA Alpha only through the plugin's own `RfProjectCustomer` table — by design, consistent with how customers work everywhere else in this plugin (see `HELPDESK_REQUIREMENTS.md` Known Constraints: customers are a global entity managed outside Redmine's normal Member/Role system).

That's fine everywhere else, because every other customer-facing check in this plugin correctly uses `RfProjectCustomer` for authorization instead of Redmine's native Member system:
- **Page access** (`authorize_helpdesk_access`) checks `RfProjectCustomer.exists?(project_id:, customer_id:)` directly — passes.
- **Individual ticket access** (the branded per-ticket route) similarly does not depend on Redmine Membership — she can open ticket #74 directly.
- **The Dashboard's ticket count** (`RfProjectHelpdeskController#index`) queries `@project.issues.where(...)` — a plain ActiveRecord scope with no Redmine permission check at all — which is exactly why "2 open" renders correctly on the My Helpdesk landing page.
- **The Tickets *list*** (`RfProjectHelpdeskController#tickets` → `TicketFilter#base_scope`) starts from **`Issue.visible(user)`** — Redmine's own native issue-visibility scope. `Issue.visible` requires the user to be an actual Redmine Member of the project with a Role granting `view_issues`; it has no knowledge of `RfProjectCustomer` at all. Since `alpha.customer` has zero Memberships, `Issue.visible(user)` returns **zero issues on this project, unconditionally** — before `author_id`, before any other filter, before pagination.

The `author_id: user.id` customer-scoping (`base_scope`'s `s = s.where(author_id: user.id) if customer_view?`) and the date-range filters were both checked and ruled out — `date_range` is provably a no-op for a customer session since `created_from`/`created_to` aren't in `CUSTOMER_FILTERS`, so `text_for` always returns `nil` for them regardless of what's in the query string. The empty-state copy blaming "the selected date range" is therefore misleading — it's inherited from the same partial the Admin/Agent Dashboard uses, not the actual cause.

**Fix direction**: `TicketFilter#base_scope` should authorize customers the same way the rest of the plugin does — via `RfProjectCustomer`, not `Issue.visible(user)` — for a customer-view request. The simplest correct fix is likely conditioning the base scope's Redmine-visibility check on `customer_view?`, e.g. skip `Issue.visible(user)` for a customer entirely (the `author_id: user.id` line already provides the real narrowing Redmine's own visibility check was meant to add here), or add a customer-eligible-project check in its place.

**Confirmed this is systemic, not specific to `alpha.customer`.** Created a brand-new customer (`delta.customer`, id=19) purely to test this, with zero prior history. Same result immediately: her own ticket #77 exists (author_id=19, project_id=3) but her Tickets list still shows zero. Confirmed directly at the query level: `Issue.visible(delta_customer).where(project_id: 3).count = 0`, and `delta.customer.memberships.count = 0` — identical shape to `alpha.customer`. Since every customer in this plugin is created the same way (an `RfProjectCustomer` row, never a Redmine Membership — this is the intended design, not an oversight specific to these two fixtures), **this affects every customer account in the system, on every project, with no exceptions** — it is not a data-quality issue with any particular fixture.

## Evidence

### Screenshot

![Customer ticket list shows zero](../../screenshots/BUG-HLP-014/customer-ticket-list-shows-zero.png)
![Re-reproduced fresh, clean session](../../screenshots/BUG-HLP-014/reproduced-2026-08-27-zero-tickets.png)
![Reproduced with a brand-new customer, delta.customer](../../screenshots/BUG-HLP-014/reproduced-new-customer-delta.png)
![Retest PASS - customer ticket list shows both tickets after fix](../../screenshots/BUG-HLP-014/retest-2026-08-27-pass.png)

### Console / log

- No console errors observed on this page — confirmed to be a server-side authorization-scope mismatch (`Issue.visible(user)` vs. the plugin's own `RfProjectCustomer` model), not a JS/rendering failure. See Root Cause above.

## Duplicate check

- Duplicate found: No. `bugs/_duplicates.md` checked — empty register. Distinct from BUG-HLP-006 (that bug is about the *link target* on a ticket a customer can already see being wrong — core `/issues/:id` vs branded route — and does not reproduce on Local at all per that bug's own notes). This is a different, Local-reproducible defect: the list itself renders empty regardless of link target.
- Existing bug reference (if duplicate): —

## Related

- Found while executing TC-HLP-015 (customer raises a ticket and sees only their own afterward) in `HELPDESK_TICKET_LIFECYCLE.md` — that TC **FAILS** as a direct result of this bug.

## Retest — 2026-08-27 (post-fix, full environment rebuild)

- **Context**: Between the original report and this retest, the Local database was fully reset (`db:drop`/`db:create`/`db:migrate` → `redmine:load_default_data` → `redmine:plugins:migrate`) at explicit user request, wiping all prior fixtures including the original `alpha.customer`/`delta.customer` used above. The environment was rebuilt from scratch purely through the UI as `admin`: new project **Helpdesk QA Alpha** (Is Public unchecked, Redmineflux Helpdesk module enabled), new user **luna.blossom**, new role **Agent** (workflow copied from Manager, `view_helpdesk` + core issue/time-tracking permissions), luna.blossom added as a project Member with the Agent role, new SLA **Alpha Standard SLA**, new Support Level **L1** (assignee luna.blossom), and a new customer **alpha.customer** (User ID 6, Customer ID 6) with project access to Helpdesk QA Alpha / Alpha Standard SLA / L1. This means the retest below is on a fixture with **zero shared history** with the original report — equivalent in rigor to the original `delta.customer` systemic-confirmation repro.
- **Steps**: Logged in as `alpha.customer` (genuine UI login, no direct URL navigation) → My Helpdesk → View → New issue → created ticket #1 ("Unable to access customer portal after password reset"). Redirected to the Tickets tab.
- **Result**: Tickets tab immediately showed **"Helpdesk QA Alpha · 1 tickets"** with ticket #1 listed (previously this would have shown "0 tickets" / "No tickets yet"). Confirmed the ticket link opens correctly (`/projects/helpdesk-qa-alpha/helpdesk/issues/1`) with no errors.
- **Restart check**: Restarted `redmine-docker-6-redmine-1` (Redis + Sidekiq manually restarted inside, both re-registered their 3 cron jobs), then re-logged in as `alpha.customer` from a clean session. Ticket #1 still correctly visible on the Tickets tab and on the My Helpdesk dashboard ("1 open") — confirms the fix is real (DB-level), not a caching artifact.
- **Second-ticket check**: Created a second ticket ("Second verification ticket for BUG-HLP-014 retest") as the same customer. Tickets tab correctly updated to **"Helpdesk QA Alpha · 2 tickets"**, both #1 and #2 listed — confirms the list reflects the true count, not a hardcoded/fluke single-row render.
- **Verdict: RETEST PASS.** The customer ticket-list defect described above no longer reproduces.
## Closed — 2026-08-27

- **Closed per explicit user direction**, immediately after the Retest PASS above.
- **Process note (for the record, not a reversal):** `SENIOR_QA_STANDARDS.md` §26 calls for a High-severity bug to have the full affected suite (`HELPDESK_TICKET_LIFECYCLE.md`, 32 TCs) + adjacent-feature regression run before closure, not just the single retest. That regression has **not** been run — the environment wipe invalidated the 14 TCs already done pre-wipe (013–023/037/289/295), so this suite still needs a from-scratch re-execution. The user chose to close this bug now rather than gate closure on that regression; the regression itself is still outstanding and tracked as the next step in `HELPDESK_HANDOFF.md`'s "Next Session Start Point" (it should still be run — as general suite coverage, even though it's no longer required specifically to keep this bug closed).
- If the customer ticket-list defect reappears during that regression (or any later session), do not reopen this bug ID — file a new one and cross-reference this one, per `SENIOR_QA_STANDARDS.md` §26 ("do not reopen the original closed bug for a new regression failure").
