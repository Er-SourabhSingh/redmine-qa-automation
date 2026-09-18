# BUG-HLP-046

- Bug ID: BUG-HLP-046
- Production Redmine Issue ID: #120378 (ztflux)
- Title: The "Email History" tab (Helpdesk Conversion) never shows recipient, subject, or an explicit direction field for any entry — only sender, timestamp, and body
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-09)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (viewing as agent-equivalent)
- Date: 2026-09-09

## Steps to reproduce

1. Open any ticket with at least one inbound and one outbound message recorded (e.g. one created by email, then replied to by an agent).
2. Open its **Helpdesk Conversion** / Email History tab.
3. Inspect each entry for direction, sender, recipient, subject, body, and timestamp.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §13, "Email History" section (lines 852-856): *"Every ticket has an **Email History** tab: each message in and out, with sender, recipient, subject, body and timestamp."* Every entry should show all six pieces of information.

## Actual result

Confirmed live on ticket #63 (Helpdesk QA Beta, 3 real Email History entries — one inbound customer email, one system-generated ticket-creation acknowledgement, one agent Reply Note):

- **Sender**: shown for every entry (e.g. "Beta Customer", "Redmine Admin (via Reply Note)").
- **Timestamp**: shown for every entry.
- **Body**: shown for every entry (full content, not truncated).
- **Direction**: only *implied* via label text ("Customer replied to Support" vs "(via Reply Note)") — there is no explicit "Inbound"/"Outbound" or "in"/"out" field anywhere.
- **Recipient**: never shown anywhere in the tab, for any entry. Confirmed via a full-page DOM search (`document.body.innerHTML`) for the word "recipient" or a "To:" label — zero matches.
- **Subject**: never shown as a distinct field. The literal string "Subject:" appears only incidentally, embedded inside the ticket-creation acknowledgement's own body template ("Subject: TC-HLP-402b control...") — this is the *ticket's* subject baked into that one email's content, not a per-entry email-header field. The inbound customer-reply entry and the agent-reply entry have no "Subject:" line at all.

So 3 of the 6 documented pieces of information (recipient, subject, an explicit direction field) are absent from every entry in this tab — the actual recipient and subject of each individual email are not recoverable from this screen at all; a user must go to the real mailbox (e.g. Roundcube) to see them.

## Evidence

### Screenshot

![Helpdesk Conversion tab on ticket #63 — 3 entries, each showing sender/timestamp/body only, no recipient or subject field for any entry](../../screenshots/BUG-HLP-046/email-history-missing-recipient-subject-direction.png)

### Console / log

- DOM check via `browser_evaluate` on the ticket's full page: `hasRecipientWord: false`, `hasToColon: false`, `hasSubjectColon: 3` (all 3 matches traced to the ticket-creation acknowledgement's own embedded body text, not a structured per-entry field), `bodyLength: 110276`.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` — no existing bug about Email History's field completeness; BUG-HLP-008, the only prior bug about this tab, was about missing/duplicate *entries*, not missing *fields* within an entry).
- Existing bug reference (if duplicate): None.

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120378 checked in)

**CONFIRMED FIXED.** Root-caused via source (`app/views/rf_email_histories/_index.html.erb`), with an explicit `BUG-HLP-046` comment: the partial now renders a `direction-badge` showing literal "Inbound"/"Outbound" text (not just implied via label wording), plus a `Subject:` line and a `To:` (recipient) line whenever either is present.

Live-verified on ticket #63 (5 real Helpdesk Conversion entries, a genuine mix of customer and agent messages): `Array.from(document.querySelectorAll('.direction-badge'))` returned explicit "Inbound"/"Outbound" text for all 5 entries, matching their real direction; every entry now shows a real `To:` recipient address (`beta.support@test.local`, `beta.customer@test.local`); every entry shows a real `Subject:` line distinct from the ticket-creation-acknowledgement's own embedded body text. All 3 originally-missing pieces (recipient, subject, explicit direction) are now genuinely present, per-entry, matching `HELPDESK_USER_GUIDE.md` §13's documented promise.

## Notes

- Found while executing `HELPDESK_EMAIL.md` TC-HLP-148 ("Email History shows full detail for every message"), part of a full sweep of this suite's previously-unexecuted TCs.
- Severity judged **Medium**: no data-integrity or security impact, and the missing information (recipient, subject) is still recoverable by the admin via the real mailbox — but it's a genuine, direct contradiction of a specific, explicit documented promise (`HELPDESK_USER_GUIDE.md` §13), not a testcase author's assumption, and undermines the tab's own stated purpose ("the record of what the customer was actually told").
