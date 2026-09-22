# BUG-HLP-047

- Bug ID: BUG-HLP-047
- Production Redmine Issue ID: #120379 (ztflux)
- Title: The same email account (incoming and/or outgoing) can be configured on two different projects with no warning — incoming reuse causes silent misrouting, outgoing reuse causes silent sender-identity confusion
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-09)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP) + Roundcube webmail (`http://127.0.0.1:8081`)
- User role: Admin (configuration) / Client (Customer, via email — the actual sender)
- Date: 2026-09-09

## Steps to reproduce

1. Note Helpdesk QA Alpha's own working incoming mailbox (`alpha.support@test.local`), already configured and polled.
2. Open Helpdesk QA Beta's Email Configuration and set its own **incoming Mail Username** to the exact same address (`alpha.support@test.local`), reusing Alpha's credentials — leave everything else (Beta's own outgoing SMTP, keywords, etc.) unchanged.
3. Click Save.
4. Send one qualifying email (containing a configured identifier keyword) to `alpha.support@test.local`.
5. Manually trigger the email poller (or wait for the scheduled run) and observe which project's ticket list the resulting ticket appears in.

## Expected result

Per this suite's own precondition framing (`HELPDESK_EMAIL.md` TC-HLP-079): since one real-world mailbox can only sensibly be polled by one project's checker, Save should either be refused with a validation naming the conflict, or — if silently allowed — the real-world outcome should be deterministic and documented, not a silent single-winner race with no indication anything is wrong.

## Actual result

**Save succeeds completely silently — no validation, no warning, no error of any kind.** Confirmed live:

- Set Beta's `Mail Username`/`Mail Password` to `alpha.support@test.local` / `Test@12345` (Alpha's own real, already-configured mailbox), left Beta's outgoing SMTP as its own (`beta.support@test.local`). Clicked Save: `"Successful update"` banner, no conflict named anywhere.
- As `alpha.customer`, sent a real qualifying email (subject "TC-HLP-079 shared mailbox test - ticket keyword", body containing "ticket") to `alpha.support@test.local`.
- Manually invoked `Helpdesk::EmailPollerWorker`. Server log shows the real mechanism: the worker iterates projects in a fixed order (Alpha, then Beta). Alpha's turn ran first — `"Found 1 unread message(s) in INBOX"` — and it fully processed and consumed the email (`MailHandler: issue #66 created by Alpha Customer`, `Created ticket #66`). Because IMAP `\Seen` is a mailbox-wide flag, not project-scoped, by the time Beta's turn came moments later on the *identical* mailbox, it found `"Found 0 unread message(s) in INBOX"` — nothing left to process, silently.
- Confirmed live: ticket **#66** was created under **Helpdesk QA Alpha** (page title: *"Support #66: ... - Helpdesk QA Alpha - Redmine"*) — despite Beta now also being configured to poll that exact mailbox. Beta received nothing: no ticket, no error, no log line indicating a conflict.

**Real-world impact**: whichever project happens to iterate first in the worker's project loop wins every single email sent to a shared mailbox, deterministically and silently, for as long as both configs exist. The "loser" project's real customers could email its own configured address (which happens to coincide with another project's) and simply never get a ticket, with no signal to anyone that misconfiguration is the cause. Restored Beta's `Mail Username` back to `beta.support@test.local` immediately after this test.

**Follow-up, same day — outgoing reuse tested too, per direct user question ("did you test the same email configuration for outgoing").** Reset Beta's incoming to its own account first, then separately set Beta's **outgoing SMTP Username and Email From Address** to Alpha's own account (`alpha.support@test.local`), leaving Beta's incoming untouched. Save again succeeded completely silently. Replied on a real Beta ticket (#63) as an agent — the outgoing email sent successfully with no crash or error (server log: `HelpdeskMailer: Using project-specific SMTP (mail:587, user: alpha.support@test.local)`, `Email sent!`). **Confirmed via the actual received email** (Roundcube, `beta.customer@test.local`'s inbox): the notification for this Beta ticket shows `From: alpha.support@test.local`, not Beta's own address — a Beta customer would see their ticket's replies arriving from what looks like a different company/desk's address. Unlike the incoming case, this doesn't cause data loss or misrouting (the email reaches the right customer, about the right ticket) — it's a silent sender-identity/branding confusion instead, but shares the identical root cause (zero uniqueness validation on account reuse across projects). Restored Beta's outgoing SMTP Username/Email From Address back to `beta.support@test.local` immediately after, confirmed via direct query.

## Evidence

### Screenshot

![Ticket #66's page title shows "Helpdesk QA Alpha" despite Beta also being configured to poll the exact same mailbox that received this email](../../screenshots/BUG-HLP-047/ticket-66-created-under-alpha-shared-mailbox.png)

### Console / log

```
Helpdesk::EmailPollerWorker: Checking emails for project [helpdesk-qa-alpha]
Helpdesk::EmailPollerWorker: Found 1 unread message(s) in INBOX
MailHandler: Email from registered customer [alpha.customer@test.local] - proceeding with ticket creation
MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [alpha.customer]
MailHandler: issue #66 created by Alpha Customer
Helpdesk::EmailPollerWorker: Created ticket #66 - TC-HLP-079 shared mailbox test - ticket keyword
...
Helpdesk::EmailPollerWorker: Checking emails for project [helpdesk-qa-beta]
Helpdesk::EmailPollerWorker: Found 0 unread message(s) in INBOX
```

- Live UI confirmation: ticket #66 page title reads `Support #66: TC-HLP-079 shared mailbox test - ticket keyword - Helpdesk QA Alpha - Redmine`.
- Save confirmation: "Successful update" banner shown on Beta's Email Configuration form immediately after entering Alpha's mailbox credentials — no validation error of any kind.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` — no existing bug about mailbox reuse across projects; distinct from BUG-HLP-045, which is about a *registered customer's* project routing, not a *shared incoming mailbox address* configuration gap).
- Existing bug reference (if duplicate): None.

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120379 checked in)

**CONFIRMED FIXED, both directions.** Root-caused via source (`app/models/rf_helpdesk_email_config.rb`): two new validations, `validate :incoming_account_not_used_by_another_project` and `validate :outgoing_account_not_used_by_another_project`, checking `mail_server`+`mail_username` for incoming and `smtp_server`+`smtp_username` / `email_from` for outgoing against every other project's config row.

Live-verified exactly as originally reproduced: set Beta's incoming Mail Username to Alpha's own mailbox (`alpha.support@test.local`) and clicked Save — refused with `"Failed to save email configuration: Mail username This mailbox is already the incoming account for project \"Helpdesk QA Alpha\". Two projects can't poll the same mailbox - one of them would silently stop receiving emails."`, and the field reverted to Beta's own value (save genuinely rejected, not just a client-side warning). Then set Beta's outgoing SMTP Username to Alpha's account and Saved again — refused with `"Failed to save email configuration: Smtp username This account is already the outgoing account for project \"Helpdesk QA Alpha\"."`. Both messages name the conflicting project by name, matching this bug's own Recommend section (mirroring the BUG-HLP-010 Website/Phone precedent).

## Notes

- Found while executing `HELPDESK_EMAIL.md` TC-HLP-079, a previously-unexecuted negative case explicitly flagged in the suite as "not yet executed — this is a real data-integrity risk, not just a UX gap" if misrouting/duplication is observed.
- Severity judged **Medium**: no security exposure and no crash, but a real, silent, deterministic data-loss-adjacent risk for any admin who reuses a mailbox address across two projects (e.g. during setup/copy-paste error) — the second project's own customers' emails vanish into the first project's queue with zero indication of what happened.
- Recommend: add a uniqueness validation on both the incoming Mail Username/Server combination AND the outgoing SMTP Username/Email From Address across `RfHelpdeskEmailConfig` rows, refusing Save with a clear message naming the conflicting project — mirroring how Organization Website/Phone duplicates were fixed in BUG-HLP-010.
