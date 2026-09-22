# BUG-HLP-045

- Bug ID: BUG-HLP-045
- Production Redmine Issue ID: #120377 (ztflux)
- Title: An email sent to one project's own mailbox is routed to a different project's ticket list — a registered customer entitled to multiple projects always gets her *first* project-access row, never the project whose mailbox actually received the email
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-09)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP) + Roundcube webmail (`http://127.0.0.1:8081`)
- User role: Client (Customer, via email)
- Date: 2026-09-09

## Steps to reproduce

1. Configure two Helpdesk-enabled projects (A and B), each with its own working, distinct incoming mailbox (own IMAP account, own SMTP).
2. Register a customer with **two** project-access rows: one on Project A (created first) and one on Project B (created second).
3. As that customer, send a qualifying email (contains a configured identifier keyword) **specifically to Project B's own mailbox address** — not Project A's.
4. Let the poller process it (scheduled, or manually triggered).
5. Check which project the resulting ticket was actually created under.

## Expected result

The ticket should be created under **Project B** — the project whose mailbox genuinely received and was polled for the email — regardless of which project-access row the customer happens to have created first, or how many other projects she is entitled to.

## Actual result

**The ticket is created under Project A — the customer's first project-access row — every time, regardless of which project's mailbox the email was actually sent to.** Confirmed live, twice:

- Built a real second mailbox for Helpdesk QA Beta (`beta.support@test.local`, SMTP+IMAP) via the real Email Configuration UI, matching Alpha's existing setup.
- Registered a new customer, `beta.customer`, with two project-access rows: **Alpha first** (Alpha Standard SLA / L1 / Alpha Minimal Fields Test Org), **Beta second** (Beta Standard SLA / AB-L1).
- **First attempt**: sent a qualifying email as `beta.customer` specifically to `beta.support@test.local`. Server log: `Helpdesk::EmailPollerWorker: Checking emails for project [helpdesk-qa-beta]` (confirming the poller correctly identified Beta's own mailbox) immediately followed by `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [beta.customer]` (the routing decision ignores which mailbox was polled, and picks Alpha instead). Ticket creation was then additionally blocked by an unrelated, coincidental condition — Alpha's own prepaid-hours budget happened to be negative from earlier same-day testing (`Alpha Minimal Fields Test Org is out of prepaid hours ... ticket creation blocked`) — so no ticket was created on this attempt, but the log already proves the wrong project was selected before that block ever triggered.
- **Second attempt, to rule out the prepaid block masking the real result**: topped up Alpha's budget to a healthy positive value via the real Prepaid Support Hours UI, then sent a second qualifying email, again specifically to `beta.support@test.local`. Server log: `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [beta.customer]` → `MailHandler: issue #62 created by Beta Customer`. **Ticket #62 was created under Helpdesk QA Alpha** — confirmed directly in the browser: the page title reads *"Support #62: ... - Helpdesk QA Alpha - Redmine"*, the ticket's own Organization field reads "Alpha Minimal Fields Test Org" (Alpha's org, not Beta's), and its outbound confirmation email was sent via `alpha.support@test.local`'s SMTP, not Beta's — despite the customer never having emailed Alpha's mailbox at all in this test.

Root-caused via source (`mail_handler_patch.rb`, `target_project_with_helpdesk`): for a registered helpdesk-customer sender, the target project is derived from `RfProjectCustomer.where(customer_id: @user.id)` and takes the **first** result — with no ordering tied to which mailbox the poller actually polled. The poller does pass the correct project along (confirmed in the log: it explicitly says which project's mailbox is being checked), but `MailHandler` discards that signal for any customer with an existing project-access row, substituting her first one instead.

## Evidence

### Screenshot

![Ticket #62's page title and Organization field both show Helpdesk QA Alpha, despite the email being sent specifically to Beta's own mailbox](../../screenshots/BUG-HLP-045/ticket-misrouted-to-alpha-instead-of-beta.png)

### Console / log

- Poller log (first attempt): `Helpdesk::EmailPollerWorker: Checking emails for project [helpdesk-qa-beta]` → `MailHandler: Email from registered customer [beta.customer@test.local] - proceeding with ticket creation` → `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [beta.customer]` → `MailHandler: Alpha Minimal Fields Test Org is out of prepaid hours on Helpdesk QA Alpha (-2.996666679084301h) - ticket creation blocked`.
- Poller log (second attempt, Alpha budget positive): `MailHandler: Processing email from helpdesk customer [beta.customer]` → `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [beta.customer]` → `MailHandler: Email contains required keyword - proceeding with ticket creation` → `MailHandler: issue #62 created by Beta Customer` → `HelpdeskMailer: Using project-specific SMTP (mail:587, user: alpha.support@test.local)` → `Helpdesk::EmailPollerWorker: Created ticket #62`.
- Live UI confirmation on ticket #62 (`/issues/62`): page title `Support #62: ... - Helpdesk QA Alpha - Redmine`; "Organization:" field reads `Alpha Minimal Fields Test Org`; "Customer:" field correctly links to `Beta Customer` (the real sender, correctly attributed as author — only the project itself is wrong); "Prepaid Support Hours:" reads against Alpha's own budget ("14.67h used · 7.00h left of 21.67h", the exact figures for Alpha after the top-up), not Beta's.
- Source: `mail_handler_patch.rb#target_project_with_helpdesk` — `RfProjectCustomer.where(customer_id: @user.id)` with no scoping to the polled project, `.first` taken unconditionally.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; this scenario, a customer entitled to multiple projects emailing a specific one's mailbox, was never previously tested — confirmed via a project-wide grep for "custom field"-adjacent and email-routing terms before writing TC-HLP-370)
- Existing bug reference (if duplicate): None. Unrelated to BUG-HLP-006/007 (those are about which core-vs-branded *route* a link points to, not which *project* an email-created ticket lands under).

## Follow-up control test (same day)

To isolate whether this is specific to multi-project entitlement, or a more fundamental "always routes to Alpha" defect, temporarily removed `beta.customer`'s Alpha row (leaving her entitled to Beta only) and resent a fresh email to `beta.support@test.local`. This time the log correctly showed `MailHandler: Found helpdesk project [helpdesk-qa-beta] for customer [beta.customer]`, and the resulting ticket (#63) was confirmed live under Helpdesk QA Beta (page title, outbound confirmation via Beta's own SMTP). **This confirms the defect is specific to multi-project entitlement**: a customer with only one project-access row routes correctly (trivially — her only row is also her "first" row); the bug requires 2+ rows, and only manifests when the mailbox actually polled isn't whichever row happens to be first. `beta.customer`'s Alpha row was restored afterward for future reuse.

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120377 checked in)

**CONFIRMED FIXED.** Root-caused via source (`lib/redmineflux_helpdesk/patches/mail_handler_patch.rb#target_project_with_helpdesk`): now checks `handler_options.dig(:issue, :project)` (the project whose mailbox the poller actually polled) FIRST, resolving it via `Project.find_by_identifier` and returning it immediately — only falling back to the customer's-first-row guess if that's absent. Carries an explicit `BUG-HLP-045` comment matching this bug's own Recommend section exactly.

Live-verified end-to-end: gave `alpha.customer` a genuine second project-access row (Alpha first, Beta second, matching the original repro's customer shape), sent a real qualifying email to `beta.support@test.local`, and ran the real scheduled `Helpdesk::EmailPollerWorker` directly. Log now reads `MailHandler: Using project [helpdesk-qa-beta] the email's own mailbox was polled from` (three times across the request, once per internal `target_project` call) — the routing decision is now unconditionally correct, a complete reversal from the original `Found helpdesk project [helpdesk-qa-alpha]` misroute.

**Methodology note**: the rake task's own `check_emails` (`lib/tasks/helpdesk.rake`) turned out to be a dead end for retesting this specific bug — it calls `Redmine::IMAP.check(imap_options) { |message| ... }` with a block, but this Redmine version's actual `Redmine::IMAP.check(imap_options={}, options={})` signature never yields to a block at all (it calls `MailHandler.safe_receive` internally using its own second positional `options` argument, which the rake task never passes) — so the block, and the per-project routing options it was meant to build, are silently dead code. This reliably reproduced the *original* misrouting symptom by accident (options genuinely empty, not just a stale value), which is why several attempts via the rake task path kept "failing" this retest before switching to the real worker (which implements its own direct `Net::IMAP` handling, unaffected by this signature mismatch) — a separate, deeper defect in the rake task worth its own future bug report, not filed here since it's outside this bug's scope.

Ticket persistence itself failed on the final routing-confirmed run with `Validation failed: Test cannot be blank` — a pre-existing required custom field ("test") from earlier field-validation testing that blocks any programmatic/email ticket creation on this instance, unrelated to routing; the routing decision (this bug's actual subject) had already succeeded before that failure.

## Notes

- Found while executing `HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-370, written after the user asked directly whether email-to-project routing was covered for a customer entitled to multiple projects. Initially left BLOCKED pending new test infrastructure (a working Beta mailbox, a multi-project customer fixture) — the user then asked to build that infrastructure and verify properly, which surfaced this bug.
- New reusable fixtures created this session, kept for future use: **Helpdesk QA Beta now has a real, working Email Configuration** (SMTP+IMAP via `beta.support@test.local` / `Test@12345`, Identifier Keywords `ticket, issue, request`) — previously Beta had zero email configuration at all. **`beta.customer`** (Redmine customer id 32, login `beta.customer` / `Test@12345`) is a new, genuine multi-project customer: Alpha (Alpha Standard SLA / L1 / Alpha Minimal Fields Test Org, her first row) + Beta (Beta Standard SLA / AB-L1, her second row) — reusable for any future cross-project routing/entitlement testing. `delta.customer` also independently gained a second project-access row on Beta during initial troubleshooting (before discovering she has no real mailbox account, unlike `beta.customer`) — left in place as a harmless secondary multi-project fixture, though not the one used for the actual repro.
- Severity judged **Medium**: no security exposure (the customer's own identity/authorship on the ticket is correctly attributed, and she can only ever be misrouted to a project she is *already* entitled to, not an arbitrary one) but a real, silent data-integrity/organization defect — support staff monitoring Project B's queue would never see this ticket at all, it would silently appear in Project A's queue instead, against Project A's own SLA/prepaid-budget/organization context rather than the one the customer actually intended by choosing which address to email.
- Recommend: have `target_project_with_helpdesk` prefer the project the poller identifies as the one being checked (the project whose mailbox actually received the message) when the customer has a matching `RfProjectCustomer` row for that specific project, falling back to her first row only if she has no access to the polled project at all (in which case the existing entitlement-check/rejection path should apply, not a silent reroute).
