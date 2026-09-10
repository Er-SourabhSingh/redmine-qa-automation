# BUG-HLP-008

- Bug ID: BUG-HLP-008
- Production Redmine Issue ID: 119636
- Title: "Helpdesk Conversion" tab is an incomplete/inaccurate email audit trail — a customer's real inbound-email reply to an existing ticket is never logged there (only visible under Notes), and one outbound agent-reply entry is duplicate-logged mislabeled as an inbound "Customer replied to Support" message
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-26)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`aurora.wren`) viewing the ticket; Customer (`beta.customer`) as the email sender
- Date: 2026-08-26

## Steps to reproduce

**Part A — missing entry for a customer's real reply email**

1. Customer emails the project's support inbox with a ticket-triggering subject (reproduced: `beta.customer@test.local` → `beta.support@test.local`, ticket **#67** created).
2. Open the ticket's **Helpdesk Conversion** tab — confirm entry **#1** is the original inbound email (correct).
3. Agent replies via the ticket's web UI **Reply** → **Reply Note** (reproduced: `aurora.wren`, "Hi Beta Customer, thanks for reaching out...") — outbound notification sent. Helpdesk Conversion tab now shows entries **#2** (system "Ticket Created Successfully" confirmation) and **#3** (the agent's reply, correctly labeled "Aurora Wren (via Reply Note)").
4. Customer replies **for real, by email** (threaded `Re: ...` to the notification from step 3) — Sidekiq's `email_checker` cron / `Helpdesk::EmailPollerWorker` correctly converts it into a Journal/Note on the ticket (confirmed: visible under the **Notes** tab, correct content, correctly attributed to Beta Customer).
5. Reload the **Helpdesk Conversion** tab and check its count.

**Part B — duplicate/mislabeled entry**

1. Same ticket, same Helpdesk Conversion tab from step 3 above — inspect entries #3 and #4 side by side.

## Expected result

- The Helpdesk Conversion tab should be a complete, accurate log of every real email exchanged on the ticket — every inbound customer email (both the one that created the ticket and any later reply) and every outbound system/agent email — each correctly attributed to who actually sent it.

## Actual result

1. **Part A — omission:** the customer's real inbound reply email (step 4) never appears in Helpdesk Conversion. The tab's count stayed at **"Helpdesk Conversion (4)"** — unchanged from before the reply — even though a genuine new inbound email was processed and did create a Journal elsewhere. The only place this content is visible is the standard **Notes** tab, which is not obviously "the email history" to anyone using the dedicated Helpdesk Conversion tab to audit correspondence — someone relying on it would see the ticket was created, a confirmation was sent, and the agent replied, but have **no visibility that the customer ever actually responded**.
2. **Part B — mislabeled duplicate:** entry **#4** in Helpdesk Conversion is a byte-for-byte duplicate of entry #3's body text ("Hi Beta Customer, thanks for reaching out...", the agent's own outbound reply) but its heading reads **"beta.support@test.local — Customer replied to Support"** and its body contains a fabricated `From: Beta Customer (Customer)` line — falsely presenting the agent's own message as if the customer had sent it. Both #3 and #4 share the identical timestamp (08/26/2026 09:17 AM UTC).
3. **Likely shared root cause with a previously-observed (not yet filed) finding:** `Helpdesk::EmailPollerWorker` logs a warning for every reply-to-existing-ticket email it processes — `MailHandler returned unexpected result: Journal - #<Journal id: ..., notes: "...">` / `Message N could not be processed` (see `HELPDESK_MEMORY.md`'s 2026-08-26 addendum). That warning implies the poller's success-handling branch expects an `Issue` return (the ticket-creation case) and does not recognize a `Journal` return (the reply-to-existing-ticket case) as success. If the same branch is also responsible for writing the Helpdesk Conversion entry, failing to recognize the `Journal` result would explain exactly why Part A's entry never gets written — the earlier assessment of that warning as "cosmetic/logging-only" checked only for duplicate-processing risk, not for this missing-audit-entry side effect. **Not confirmed via source inspection** (out of scope for black-box QA) — flagged here as a strong correlation for whoever fixes this to check.

## Evidence

### Screenshot

![Helpdesk Conversion tab showing the mislabeled duplicate entry #4](../../screenshots/BUG-HLP-008/helpdesk-conversion-tab-mislabel.png)
![Notes tab showing the customer's real reply exists as a Journal but has no Helpdesk Conversion counterpart](../../screenshots/BUG-HLP-008/notes-tab-has-reply-conversion-tab-missing.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-008/retest-yyyy-mm-dd-pass.png)

### Console / log

- Helpdesk Conversion tab URL: `http://localhost:3012/issues/67?tab=email-history` (core route; same tab is also reachable from the branded route).
- Entry #3 heading: "Aurora Wren (via Reply Note), 08/26/2026 09:17 AM (UTC)".
- Entry #4 heading: "beta.support@test.local, 08/26/2026 09:17 AM (UTC), Customer replied to Support" — body opens with "Customer Reply - Ticket #67 / From: Beta Customer (Customer) / Date: August 26, 2026 at 09:17 AM" followed by Aurora's own reply text verbatim.
- Notes tab entry (customer's real reply): "#2, Updated by Beta Customer" — "Hi Aurora, I'm using Chrome and I don't see any error message at all - the page is just completely blank white. It started right after I logged in this morning." — no corresponding Helpdesk Conversion entry exists for this.
- Related worker warning (from the Sidekiq/Rails combined log, same session, reply-to-existing-ticket emails): `MailHandler returned unexpected result: Journal - #<Journal id: ..., notes: "...">` followed by `Message N could not be processed`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-08-31, Local (redmine-docker-6), fresh rebuilt environment

- **Context**: full email round-trip rebuilt from scratch on Helpdesk QA Alpha (Email Configuration didn't exist post-DB-reset — created it fresh: SMTP `mail:587`, IMAP `mail:993`, sender/mailbox `alpha.support@test.local`). Also fixed a stale precondition found along the way: Settings → General → Host name and path was wrongly `localhost:3000` (should be `localhost:3012`) — corrected per the standing "Email Testing Preconditions" rule. Mail server mailboxes (`alpha.support@test.local`, `alpha.customer@test.local`, `luna.blossom@test.local`) survived the Redmine DB reset since the mail server is a separate container.
- **Steps, matching the original repro exactly**: (1) `alpha.customer` emailed `alpha.support@test.local` with a ticket-triggering subject → ticket #3 created (confirmed via manually-triggered `Helpdesk::EmailPollerWorker`, since Sidekiq's cron interval wasn't worth waiting on). (2) `luna.blossom` replied via the ticket's web UI Reply → Reply Note. (3) `alpha.customer` replied **for real, by email** (threaded reply to the agent's notification) — poller triggered again to process it.
- **Result — Part A (omission) does NOT reproduce**: Helpdesk Conversion tab went from "(3)" to **"(4)"** after the real email reply — entry #4 correctly shows "Alpha Customer, ... Customer replied to Support" with the actual reply body ("Hi Luna, I'm using Chrome and the portal login page shows a completely blank white screen..."), correctly attributed. The server log also reads differently from the original report: `MailHandler: issue #3 updated by Alpha Customer` → `Successfully saved email history for issue #3` → `Added reply to ticket #3` — **no `MailHandler returned unexpected result: Journal` warning this time**, consistent with the bug's own suspicion that this warning and the missing-entry defect shared a root cause.
- **Result — Part B (duplicate/mislabel) does NOT reproduce**: all 4 Helpdesk Conversion entries are unique, correctly labeled, correctly attributed, no duplicate timestamps, no fabricated "From: X (Customer)" content on an agent's own message. Full sequence: #1 original inbound email (Alpha Customer), #2 ticket-creation confirmation, #3 Luna Blossom's Reply Note, #4 the real customer email reply.
- Screenshot: `retest-2026-08-31-conversion-tab-complete-and-accurate.png`.
- **Verdict: RETEST PASS, both parts.** This is a genuine fix, not an artifact of the fresh environment — the original repro's exact steps (real inbound email → ticket → agent Reply Note → real threaded customer email reply) were followed verbatim and produced a complete, accurate Helpdesk Conversion log.

## Closed — 2026-08-31

- Closed per explicit user confirmation, following the clean retest above (both Part A and Part B no longer reproduce, verified with the exact original repro steps on a real email round-trip).
- If either the missing-entry or the duplicate/mislabel pattern reappears, file a new bug rather than reopening this one.

## Notes

- Found as a same-session follow-up while explaining to the user how Reply Note vs. customer email-reply content is split between the Helpdesk Conversion and Notes tabs. The user asked directly whether the reply not showing in Helpdesk Conversion, but appearing in Notes instead, constitutes the bug — this file is the result of verifying that hypothesis live rather than taking it at face value: the omission is real, but so is a second, independent mislabeling defect (Part B) discovered in the same pass.
- **Follow-up same session — full 3-way matrix confirmed and written up as formal test cases** in `testcases/HELPDESK_EMAIL.md` (TC-HLP-286/287/288), since these expected results had only existed inside this bug report until then: agent's Reply Note → correctly logged (TC-HLP-286, PASS, but with Part B's duplicate/mislabel caveat noted there); customer's **portal** Reply → correctly logged (TC-HLP-287, PASS, tested fresh on ticket #69, no mislabeling) — so Part A's omission is specific to the **email** channel only, not "customer replies" in general; customer's **real email** reply → not logged (TC-HLP-288, FAIL, this bug's Part A). Since Part B's duplicate/mislabel did NOT reproduce on #69's single clean reply, its trigger condition looks narrower than "any Reply Note" — possibly specific to the first reply immediately following an email-originated ticket — not yet isolated further.
- Ticket #67 (used for repro) has since accumulated unrelated test debris from an earlier BUG-HLP-007 retest pass in this same session (several throwaway Internal/Reply Notes with junk text like "test", "dsfgsdf", "dsaf", "46556") — none of that debris is part of this bug's repro or evidence; it's called out here only so a future session doesn't mistake it for something new.
- Recommend re-evaluating the severity of the previously-noted `EmailPollerWorker` warning (see `HELPDESK_MEMORY.md`) once this bug is triaged — if they share a root cause, filing them as one combined fix (rather than a separate low-severity BUG-HLP-009 for the log noise alone) may be more efficient.
