# BUG-HLP-055

- Bug ID: BUG-HLP-055
- Production Redmine Issue ID: 120508
- Title: `rake redmineflux_helpdesk:check_emails` is completely non-functional on every project, regardless of real mail configuration — identical dead-code pattern to the already-filed `auto_close_tickets` (BUG-HLP-044)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (server-side rake task)
- User role: System Administrator (server access)
- Date: 2026-09-11

## Steps to reproduce

1. Confirm at least one project (e.g. Helpdesk QA Alpha) has a real, currently-working incoming-mail configuration set via the real Email Configuration UI (`RfHelpdeskEmailConfig`) — this instance's Alpha/Beta already do, and the actual scheduled `EmailPollerWorker` correctly uses it (per this engagement's own prior email-flow testing).
2. Run `bundle exec rake redmineflux_helpdesk:check_emails` from the Redmine root.

## Expected result

Per `HELPDESK_RAKE_TASKS.md` TC-HLP-216 ("The mailbox is polled immediately, and the qualifying email produces a ticket exactly as the scheduled poller would") and `HELPDESK_USER_GUIDE.md` §23, the rake task should poll every project's real, currently-configured mailbox and behave identically to the scheduled `EmailPollerWorker`.

## Actual result

**The rake task never checks any project's mail, for any project, regardless of configuration.** Confirmed live — ran `bundle exec rake redmineflux_helpdesk:check_emails` with 4 helpdesk-enabled projects present (Alpha and Beta both carrying real, working `RfHelpdeskEmailConfig` rows):

```
Starting helpdesk email check at 2026-09-11 11:17:42 +0000
Found 4 project(s) with helpdesk module enabled

Checking emails for project: Helpdesk QA Alpha (helpdesk-qa-alpha)
  Incoming email disabled for this project, skipping...

Checking emails for project: Helpdesk QA Beta (helpdesk-qa-beta)
  Incoming email disabled for this project, skipping...

Checking emails for project: Helpdesk QA Gamma (helpdesk-qa-gamma)
  Incoming email disabled for this project, skipping...

Checking emails for project: Redmineflux Helpdesk (redmineflux-helpdesk)
  Incoming email disabled for this project, skipping...

Email check completed at 2026-09-11 11:17:42 +0000
```

Every single project — including Alpha and Beta, whose real incoming-mail settings are genuinely enabled and working via the actual scheduled poller — is reported as having incoming email "disabled." Root-caused via source (`lib/tasks/helpdesk.rake`, `check_emails` task):

```ruby
enable_incoming = project.custom_value_for(ProjectCustomField.find_by(name: 'helpdesk_enable_incoming_email'))&.value
unless enable_incoming == '1'
  puts "  Incoming email disabled for this project, skipping..."
  next
end
```

This reads a **legacy** `ProjectCustomField` named `helpdesk_enable_incoming_email` (and, further down, `helpdesk_mail_protocol`/`helpdesk_mail_server`/`helpdesk_mail_username`/`helpdesk_mail_password`/`helpdesk_mail_ssl`/`helpdesk_default_tracker_id` — six more legacy fields, none of them read anywhere else in this task ever get the chance to matter) — the exact same pre-migration configuration mechanism already confirmed dead for `auto_close_tickets` in BUG-HLP-044. The real, current config lives entirely in `RfHelpdeskEmailConfig` (used correctly by the real `EmailPollerWorker`). Confirmed previously via BUG-HLP-044's investigation that **zero `ProjectCustomField` rows exist on this instance at all** — so `enable_incoming` is always `nil`, never `'1'`, and every project is skipped unconditionally on every run, independent of any project's real Email Configuration.

## Evidence

### Console / log

- Full rake output above: all 4 helpdesk-enabled projects report "Incoming email disabled for this project, skipping..." — including Alpha/Beta, which have real, working incoming-mail configuration confirmed functional via the scheduled poller in earlier sessions of this engagement.
- Source (`helpdesk.rake`, `check_emails` task): reads `ProjectCustomField.find_by(name: 'helpdesk_enable_incoming_email')` and 6 sibling legacy fields — none read from `RfHelpdeskEmailConfig` anywhere in this task.

## Duplicate check

- Duplicate found: No new bug ID collision (checked `bugs/_index.md`/`bugs/_duplicates.md`) — but this is the **exact predicted follow-up** already flagged in BUG-HLP-044's own Notes section ("the identical dead-code migration-cleanup pattern already noted (but never filed) for the sibling `check_emails` rake task in `HELPDESK_MEMORY.md`... recommend auditing both together") and in `HELPDESK_MEMORY.md` itself. This is that audit, now confirmed live and filed as its own bug per that recommendation, rather than folded into BUG-HLP-044 (each task is independently broken code, in a different file, with its own distinct legacy-field set).
- Existing bug reference (if duplicate): Root-cause pattern shared with BUG-HLP-044 (`auto_close_tickets`) — see that bug for the sibling defect and the underlying `RfHelpdeskEmailConfig` migration context.

## Notes

- Found while executing `HELPDESK_RAKE_TASKS.md` TC-HLP-216 (`check_emails` run by hand) — this closes out the audit `HELPDESK_MEMORY.md` had already called for since BUG-HLP-044 was filed.
- Directly affects TC-HLP-223 in the same suite ("`check_emails` is a safe no-op when no mailbox is configured anywhere") — that TC's literal expected result (completes without error, no tickets created) technically still holds, but only because the task is unconditionally broken, not because it correctly detected an absence of configuration. See that TC's own evidence entry for the distinction.
- Severity judged **Medium**, matching BUG-HLP-044's precedent exactly: no data corruption or security impact, but a complete, silent functional failure of a documented, user-facing rake task, on every project, all the time.
- Recommend: same fix shape as BUG-HLP-044 — read `RfHelpdeskEmailConfig.for_project(project)` instead of the seven legacy `ProjectCustomField` lookups, or have this task simply invoke the real `EmailPollerWorker`'s logic directly so there is only one implementation to keep correct.
