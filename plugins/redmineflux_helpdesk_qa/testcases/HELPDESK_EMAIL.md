# Test Cases — Redmineflux Helpdesk — Features 41–44: Email (In and Out)

> Source: `docs/HELPDESK_FEATURES_LIST.md` #41–44 (category G). Grounded in `docs/HELPDESK_USER_GUIDE.md` §3.6 (Configure email), §13 (Email: in and out), §19 (background jobs), and tester checklist §26 groups O (Email — incoming) and P (Email — outgoing).
>
> Email-creates-a-ticket behavior (registered vs. unregistered sender, identifier keywords, email prefix, thread-reply-becomes-note, Email History on creation) is already covered in `HELPDESK_TICKET_LIFECYCLE.md` (TC-HLP-368, 017, 026, 027) — not repeated here. This suite covers what's still untested: email configuration access control, outgoing SMTP behavior and fallback, full Email History content, and auto-close.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-067: An administrator can save a project's email configuration

**User Role:** Administrator
**Priority:** High
**Precondition:** A project with the Helpdesk module enabled.

**Steps:**
1. Helpdesk › Settings › Email Configuration, pick the project
2. Fill in outgoing (SMTP) and/or incoming (mailbox) settings
3. Save

**Expected Result:**
- The form is shown and saves successfully — this screen is admin-only regardless of the signed-in user's helpdesk role/permissions

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin): **PASS.** Helpdesk → Settings → Email Configuration → Helpdesk QA Alpha: form rendered fully populated with Alpha's real SMTP/IMAP/Ticket Settings values. Clicked Save (values unchanged). Result: "Successful update" banner shown, form redisplayed with all values intact. Confirms an administrator can open and save a project's email configuration. (Contrast with TC-HLP-080/212 below — the identical screen refuses to render any form fields at all for a non-admin `manage_helpdesk` user.)

---

### TC-HLP-068: A project with its own SMTP settings sends from its configured address

**User Role:** N/A (system-driven, verified via a received email)
**Priority:** High
**Precondition:** Project A has SMTP settings configured with **Email from** = `support@acme.example`.

**Steps:**
1. Trigger an outgoing email from Project A (e.g. an agent reply)
2. Inspect the received email's From address

**Expected Result:**
- The email is sent from `support@acme.example`, using Project A's own SMTP settings

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, Helpdesk QA Alpha, `alpha.support@test.local`): **PASS.** Auto-close notification for ticket #55 (fired during TC-150's execution earlier this session) confirmed via Roundcube (`admin@test.local` inbox): From `alpha.support@test.local` — Alpha's own configured Email From Address, not a global/shared one. See TC-HLP-070 for the same confirmed against Beta's distinct address in the same session.

---

### TC-HLP-069: A project without SMTP settings falls back to Redmine's global mail settings

**User Role:** N/A (system-driven)
**Priority:** High
**Precondition:** Project B has no SMTP fields configured.

**Steps:**
1. Trigger an outgoing email from Project B

**Expected Result:**
- The email is sent using Redmine's global mail configuration, not a per-project one

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, Helpdesk QA Gamma — new fixture project, Helpdesk module + Support tracker enabled, zero Email Configuration ever saved): **PASS.** Created ticket #64 (Support tracker) in Gamma, added a Reply Note as the agent. Server log confirmed `send_customer_reply_email` fired and queued a real `Mailer::DeliveryJob`. Checked the actual received email via Roundcube webmail (`admin@test.local`, the ticket's only recipient since Gamma has no registered customer): From address is exactly `redmine@example.net` — Redmine's own global "Emission email address" (Administration → Settings → Email notifications), confirmed identical via direct comparison. Confirms a project with zero SMTP configuration falls back to Redmine's global mail settings, not a blocked/failed send.

---

### TC-HLP-070: Two projects with different SMTP settings send as two distinct senders

**User Role:** N/A (system-driven)
**Priority:** Medium
**Precondition:** Project A configured as `support@acme.example`; Project C configured as `help@othercorp.example`.

**Steps:**
1. Trigger an outgoing email from each project
2. Compare the From addresses of the two received emails

**Expected Result:**
- Each email carries its own project's configured sender address — the two are visibly different companies from the recipient's point of view

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, Helpdesk QA Alpha vs Helpdesk QA Beta): **PASS.** Two independent pieces of evidence from the same session: (1) Alpha's auto-close notification for ticket #55 — From `alpha.support@test.local` (confirmed via Roundcube, `admin@test.local` inbox). (2) An agent Reply Note on Beta ticket #63 (customer `beta.customer`) — server log confirmed `HelpdeskMailer: Using project-specific SMTP (mail:587, user: beta.support@test.local)`, and the actual received email (confirmed via Roundcube, `beta.customer@test.local` inbox) shows From `beta.support@test.local`. The two sender addresses are distinct and each matches its own project's configured account — confirms no cross-project leakage.

---

### TC-HLP-071: Outgoing mail fires on all four documented trigger events

**User Role:** Agent (verified via Email History / received mail)
**Priority:** High
**Precondition:** A project with outgoing mail configured (or falling back to global).

**Steps:**
1. Create a ticket by email or observe the creation acknowledgement (already covered elsewhere — confirm mail fired)
2. Have an agent reply
3. Let an SLA breach or escalate on a ticket
4. Let a ticket auto-close

**Expected Result:**
- An outgoing email is sent for each of the four events: ticket created, agent reply, SLA breach/escalation, and auto-close

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, cross-referencing real evidence gathered across this session and earlier ones, all on this same environment): **PASS**, all 4 events fire real outgoing mail.
1. **Ticket created**: TC-HLP-368's evidence (ticket #8) and this session's TC-HLP-084/406/407 (tickets #59-61) all confirm a real acknowledgement email, server log "confirmation email queued"/"Created ticket #NN".
2. **Agent reply**: this session's TC-HLP-069/146 replies (tickets #64, #63) both confirmed via Roundcube — real emails received, correct per-project sender.
3. **SLA breach/escalation**: confirmed via a real, pre-existing "[CRITICAL] SLA Breach Alert - L3 - Issue #36" email (`admin@test.local` inbox, dated 2026-09-03, from earlier SLA Escalation suite testing on this same environment) — From `redmine@example.net`, full detail (Issue/SLA Information/Final Escalation Level blocks), confirming this trigger fires independently.
4. **Auto-close**: this session's TC-HLP-071/150 evidence — ticket #55's "Ticket #55 automatically closed due to inactivity" email, confirmed via Roundcube, From `alpha.support@test.local`.

All 4 documented trigger events independently confirmed to fire real outgoing mail.

---

### TC-HLP-072: Email History shows full detail for every message

**User Role:** Agent
**Priority:** Medium
**Precondition:** A ticket with at least one inbound and one outbound message recorded.

**Steps:**
1. Open the ticket's **Email History** tab

**Expected Result:**
- Each entry shows direction (in/out), sender, recipient, subject, body, and timestamp

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, ticket #63 — Helpdesk QA Beta, 3 real Email History entries): **FAIL — filed as BUG-HLP-046.** Sender, timestamp, and body are shown for every entry. Direction is only implied via label text ("Customer replied to Support" vs "(via Reply Note)"), never an explicit field. Recipient is never shown anywhere — confirmed via a full-page DOM search (`browser_evaluate`) for "recipient" or a "To:" label: zero matches. Subject is never shown as a distinct per-entry field — the literal text "Subject:" appears 3 times in the page, but all 3 traced to one email's own embedded acknowledgement-template body ("Subject: TC-HLP-370b control..."), not a structured header repeated per entry; the other two entries have no "Subject:" text at all. 3 of the 6 documented fields (recipient, subject, explicit direction) are absent.

---

### TC-HLP-073: An agent's Reply Note is logged in the Helpdesk Conversion tab, correctly attributed

**User Role:** Agent
**Priority:** Medium
**Precondition:** An existing ticket (any origin).

**Steps:**
1. Open the ticket, click **Reply**, select **Reply Note**, enter text, Save
2. Open the **Helpdesk Conversion** tab

**Expected Result:**
- A new entry appears, labeled with the agent's own name (e.g. "Aurora Wren (via Reply Note)") and the reply text, correctly attributed — not to the customer
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #67): PASS — entry correctly labeled and attributed. One caveat found in the same pass: on that ticket, a **second, duplicate** entry also appeared immediately after the correctly-labeled one — same body text, but mislabeled as an inbound "Customer replied to Support" message with a fabricated `From: <customer>` line. Not reproduced on a cleaner single-reply ticket (#69) — condition for the duplicate isn't isolated yet. Tracked as **BUG-HLP-008**, Part B, not a failure of this TC's core expectation.

---

### TC-HLP-074: A customer's portal Reply is logged in the Helpdesk Conversion tab, correctly attributed

**User Role:** Client (Customer)
**Priority:** Medium
**Precondition:** An existing ticket the customer can open (see BUG-HLP-006 for when this is blocked).

**Steps:**
1. As the customer, open the ticket, click **Reply**, enter text, Save
2. Open the **Helpdesk Conversion** tab

**Expected Result:**
- A new entry appears, labeled with the customer's own name (e.g. "Beta Customer (via Reply Note)") and the reply text, correctly attributed
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #69, portal-created fixture): PASS — entry correctly attributed, no mislabeling (contrast with TC-HLP-073's caveat above). No separate "Notes" tab appeared either, since Reply Note content only ever surfaces via Helpdesk Conversion, matching the agent-side behavior.

---

### TC-HLP-075: A customer's real inbound-email reply to an existing ticket is NOT logged in the Helpdesk Conversion tab

**User Role:** Client (Customer), replying by real email — verified from the Agent side
**Priority:** Medium
**Precondition:** A ticket that already has at least one agent reply (so an outbound notification email exists for the customer to reply to).

**Steps:**
1. Customer replies by real email (threaded) to the ticket's outbound notification
2. Wait for the next poller cron tick to process it
3. Open the ticket's **Notes** tab, then separately open its **Helpdesk Conversion** tab

**Expected Result:**
- The reply appears as a Journal entry under Notes **and** as a correctly-attributed inbound entry under Helpdesk Conversion, consistent with TC-HLP-073/287 above — Helpdesk Conversion should be a complete audit trail of all correspondence regardless of which channel a reply came in through
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #67): FAIL — the reply appears under Notes only (correct content, correctly attributed to the customer). The Helpdesk Conversion tab's count does not increment; the email reply is absent from it entirely. Tracked as **BUG-HLP-008**, Part A. Likely shared root cause with the `Helpdesk::EmailPollerWorker`'s `MailHandler returned unexpected result: Journal` warning — see `HELPDESK_MEMORY.md` and `bugs/open/BUG-HLP-008.md`.

---

### TC-HLP-076: Leaving incoming mail settings blank means no mailbox is polled for that project

**User Role:** N/A (system-driven)
**Priority:** Medium
**Precondition:** A project's email configuration has all incoming (mailbox) fields left blank.

**Steps:**
1. Send a qualifying email addressed toward what would be this project's mailbox, if it had one configured
2. Wait past a normal poller interval

**Expected Result:**
- No ticket is created — this project simply isn't polled

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::EmailPollerWorker`, Helpdesk QA Gamma — new fixture project, Helpdesk module enabled, zero Email Configuration ever saved): **PASS.** Confirmed via the Email Configuration UI first that Gamma's form renders fully blank (all incoming/outgoing fields empty, never saved). Manually invoked the real poller worker directly. Server log shows exactly two "Checking emails for project [...]" lines — `helpdesk-qa-alpha` and `helpdesk-qa-beta` — with **no line for `helpdesk-qa-gamma` at all**; the worker's project loop skips it silently before attempting any IMAP connection. Confirms leaving incoming mail settings entirely blank means the project is never polled, not merely polled-and-finding-nothing.

---

### TC-HLP-077: A resolved ticket auto-closes after the configured silent period

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** Project's Auto-close days = 2; a ticket set to Resolved and left untouched.

**Steps:**
1. Leave the Resolved ticket silent for longer than 2 days (or the environment's equivalent test window)
2. Check its status after the next auto-close job run (≤ 2 minutes once due)

**Expected Result:**
- The ticket is automatically moved to **Closed**

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, Helpdesk QA Alpha): **PASS.** Set Auto Close Ticket (Days) = 1 via Email Configuration. Created ticket #55 (Support tracker), set Status = Resolved, backdated `updated_on` to 2 days ago (test-setup only, to avoid a real multi-day wait — the actual worker invocation and result check were both real). Manually invoked the real Sidekiq worker directly (`Helpdesk::AutoCloseTicketsWorker.new.perform` via `rails runner` — the sidekiq-cron scheduler poller is still broken per the standing environment quirk, so this is the same "manually trigger the real background job" methodology used throughout this engagement for SLA-timing TCs). Result: ticket #55 correctly moved to **Closed**, with a journal note "This ticket was automatically closed due to 1 days of inactivity." Confirmed via the real ticket UI afterward. See TC-HLP-081 below for a critical, closely-related finding from the same worker invocation.

---

### TC-HLP-078: Auto-close days blank or 0 disables auto-close for that project

**User Role:** Admin
**Priority:** Medium
**Precondition:** Auto-close days set to blank (or `0`) on the project's email configuration.

**Steps:**
1. Resolve a ticket and leave it silent well past what would otherwise be a closing window

**Expected Result:**
- The ticket stays Resolved — it is never auto-closed while the setting is blank/0

CONFIRMED via source review 2026-09-09 (not independently re-executed live this round — see note): `Helpdesk::AutoCloseTicketsWorker#perform` (`app/workers/helpdesk/auto_close_tickets_worker.rb`) reads `auto_close_days = RfHelpdeskEmailConfig.for_project(project)&.auto_close_days` and unconditionally does `next if auto_close_days.nil? || auto_close_days <= 0` before any issue is even queried — a blank or `0` value skips the entire project with no exceptions. **PASS**, confirmed unambiguous at the source level. Not independently re-run live this session: TC-150/153 (same worker, same run) just closed 44 pre-existing fixture tickets across other suites as an unintended side effect of leaving Auto Close Ticket Days = 1 set on Helpdesk QA Alpha for even a few minutes — given that real blast-radius risk on a shared environment full of old tickets, a second live invocation just to re-confirm the disabled-state code path (already unambiguous from source) was judged not worth repeating. Auto Close Ticket Days on Helpdesk QA Alpha has been set back to blank since (confirmed via `RfHelpdeskEmailConfig.for_project(...).auto_close_days == nil`).

**CONFIRMED LIVE 2026-09-10** (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`): **PASS — actually executed live this round, closing the gap left by the source-only verdict above.** Before invoking anything, checked every project's `RfHelpdeskEmailConfig` directly: Helpdesk QA Alpha and Beta both have `auto_close_days == nil`, and Helpdesk QA Gamma has no config row at all — a genuine zero-risk dry-run confirming the worker could not sweep any other ticket on this environment. Created a fresh, dedicated ticket **#87** ("TC-HLP-078 auto-close disabled test - Auto Close Ticket Days blank") on Helpdesk QA Alpha, set Status = Resolved, then backdated `updated_on` to 5 days ago (test-setup only, via `rails runner` — same established methodology as TC-150). Manually invoked the real `Helpdesk::AutoCloseTicketsWorker.new.perform` directly (the sidekiq-cron scheduler poller is still broken per the standing environment quirk). Worker's own log: `[Auto-Close] Job completed. Total tickets closed: 0`. Reopened ticket #87 afterward: **Status still "Resolved"**, "Updated 5 days ago" preserved, only journal entry is the original "Status changed from New to Resolved" — no auto-close entry, exactly as expected. Confirms the blank/0-disables-auto-close contract live, not just at the source level, closing the gap this suite's own 2026-09-10 completeness audit found (this TC previously had a source-only verdict, not a live one). Ticket #87 left in place as a reusable disabled-state fixture.

---

## Negative Cases

---

### TC-HLP-079: The same mailbox/SMTP address configured on two different projects — determine whether it's blocked or silently allowed

**User Role:** Admin
**Priority:** Medium
**Precondition:** Project A's Email Configuration already has a working incoming mailbox and/or outgoing SMTP account (e.g. `alpha.support@test.local`).

**Steps:**
1. Open Project B's Email Configuration (Helpdesk › Settings › Email Configuration, pick Project B)
2. Enter the exact same mailbox address/credentials Project A already uses, for incoming and/or outgoing
3. Attempt Save
4. If Save succeeds: send one qualifying email to that shared mailbox address and observe which project (if either, or both) actually creates a ticket from it

**Expected Result — record whichever actually happens, not documented anywhere in `HELPDESK_REQUIREMENTS.md`/`HELPDESK_USER_GUIDE.md`/`HELPDESK_FEATURES_LIST.md`:**
- Either Save is refused with a validation naming the conflict (the correct, safe behavior — since one real-world mailbox can only sensibly be polled by one project's `email_checker`), or Save silently succeeds. If it silently succeeds, step 4 determines the real-world impact: does the email create a ticket on both projects (duplicate), on whichever project's poller runs first (non-deterministic/silent misrouting), or does Redmine's own IMAP `\Seen` marking mean only one project ever sees it depending on poll timing (a race, not a rule)? **This is not yet executed** — flagged from a direct question about this exact gap; not covered by TC-HLP-070, which only tests two projects with *different* SMTP configs (a positive case), never the same one reused. If Save silently succeeds and any misrouting/duplication is observed, file as a bug — this is a real data-integrity risk, not just a UX gap.

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin config + `alpha.customer`/`beta.customer` via Roundcube + `Helpdesk::EmailPollerWorker`): **FAIL — filed as BUG-HLP-047, both incoming and outgoing directions tested.**

**Incoming**: Set Beta's incoming Mail Username to Alpha's own already-configured mailbox (`alpha.support@test.local`). Save succeeded silently — "Successful update", no conflict named. Sent one real qualifying email to that address, manually triggered the poller. Result: **no duplicate, but a silent single-winner race** — the worker processes Alpha before Beta in its project loop; Alpha found and consumed the one unread message via IMAP (marking it Seen), creating ticket #66 under Alpha; Beta's subsequent check on the identical mailbox found 0 unread messages and silently created nothing. Confirmed via ticket #66's own page title ("...- Helpdesk QA Alpha - Redmine"). Beta's Mail Username restored to `beta.support@test.local` immediately after.

**Outgoing** (tested separately, per direct user follow-up question): reset incoming first, then set Beta's outgoing SMTP Username + Email From Address to Alpha's own account. Save again succeeded silently. Replied on a real Beta ticket (#63) — email sent successfully, no crash (server log: `Using project-specific SMTP (mail:587, user: alpha.support@test.local)`). Confirmed via the actual received email (Roundcube, `beta.customer@test.local`): shows `From: alpha.support@test.local`, not Beta's own address, despite being a genuine Beta ticket. Unlike the incoming case this causes no data loss or misrouting — the right customer gets the right ticket's update — but it's a silent sender-identity/branding confusion sharing the same root cause. Beta's outgoing SMTP restored to `beta.support@test.local` immediately after, confirmed via direct query.

This is exactly the "silent misrouting/confusion depending on which side is reused" scenario this TC was written to check for — a real data-integrity/identity risk either way: whichever project happens to iterate first wins every email sent to a shared incoming mailbox, deterministically and silently; a shared outgoing account silently mislabels the sender on every email regardless of iteration order.

---

### TC-HLP-080: A non-admin manager cannot save a project's email configuration

**User Role:** Manager with `manage_helpdesk` but not an administrator
**Priority:** High
**Precondition:** Viewing Helpdesk › Settings › Email Configuration.

**Steps:**
1. Pick a project from the dropdown

**Expected Result:**
- Instead of the editable form, a note is shown explaining this is admin-only — no save is possible

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, `manage.helpdesk.test` — `manage_helpdesk` permission, not an administrator): **PASS.** Logged in fresh as `manage.helpdesk.test`, navigated Helpdesk Command Center → Helpdesk Settings → Email Configuration → selected Helpdesk QA Alpha. No form rendered — page showed exactly "Only an administrator can change a project's email configuration." Confirms the gate is hardcoded to `User#admin?`, not the `manage_helpdesk` permission — same mechanism and identical wording as TC-HLP-174 in `HELPDESK_PERMISSIONS.md` (re-verified live this same session, not just cited).

---

### TC-HLP-081: Auto-close never affects a ticket that isn't Resolved

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket in In Progress (or New, Feedback, Waiting for Customer Response) left silent well past the project's Auto-close days.

**Steps:**
1. Leave the ticket silent past the auto-close threshold without ever setting it to Resolved
2. Check its status after the auto-close job would have run

**Expected Result:**
- The ticket's status is unchanged — auto-close only ever acts on tickets already in **Resolved**

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, Helpdesk QA Alpha): **FAIL — filed as BUG-HLP-043 (Medium).** Created ticket #56 (Support tracker, Status = **New**, never Resolved), backdated `updated_on` to 2 days ago, Auto Close Ticket (Days) = 1. Manually invoked the real Sidekiq worker (`Helpdesk::AutoCloseTicketsWorker.new.perform`, same run as TC-150). Result: ticket #56 was **closed anyway** — "Status changed from New to Closed", "This ticket was automatically closed due to 1 days of inactivity" — despite never having been Resolved. Root-caused via source: the worker's query is `project.issues.open.where('updated_on < ?', cutoff_date)` — `.open` is Redmine's standard scope for "any status with `is_closed: false`" (New, In Progress, Feedback, Waiting for Customer Response, **and** Resolved all qualify), not a Resolved-only filter. This directly contradicts the documented contract in `HELPDESK_USER_GUIDE.md` §19/§3.6 ("closes **resolved** tickets") and the Email Configuration form's own field hint ("Automatically close **resolved** tickets after specified days"). **A second, independent defect was discovered investigating this one** — see Notes below and BUG-HLP-044.

---

## Edge Cases

---

### TC-HLP-082: Auto-close only ever affects Support-tracker tickets, never Bug/Feature tickets in the same project (added 2026-09-09, user-identified gap)

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** Project's Auto Close Ticket Days set to a real value; a **Bug** (or Feature) tracker ticket in the same project, left silent well past that threshold.

**Steps:**
1. Create a Bug-tracker ticket in the project, leave it untouched past the Auto Close Ticket Days threshold
2. Let the auto-close job run (scheduled, or manually invoked)
3. Check the Bug ticket's status afterward

**Expected Result:**
- The Bug ticket's status is unchanged — auto-close only ever acts on **Support**-tracker tickets, per its own `Tracker.find_by(name: 'Support')` scoping.

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, Helpdesk QA Alpha): **PASS.** Created a Bug-tracker ticket (#57, "TC-HLP-082 auto-close tracker-scope control — Bug tracker, should NOT close"), backdated `updated_on` to 2 days ago. Set Auto Close Ticket Days = 1 on Helpdesk QA Alpha (re-confirmed via a dry-run eligibility count first, per the lesson from TC-150/151/153's incident: only 2 tickets matched the `.open` + silence-threshold query at the moment of the run — the Bug ticket #57 and one fresh Support-tracker control ticket #58 created alongside it — confirming the earlier 44-ticket sweep genuinely will not recur, since those tickets are now Closed and no longer match `.open`). Invoked the real worker directly. Result: Support-tracker ticket #58 closed correctly; **Bug-tracker ticket #57 was left completely untouched** — still status New, no journal entry added. Confirms the worker's `Tracker.find_by(name: 'Support')` scoping works exactly as source suggested. Auto Close Ticket Days reset to blank on Helpdesk QA Alpha immediately after this run.

---

### TC-HLP-083: Auto-close only affects the project it's configured for — tickets in a project with no (or different) auto-close configuration are untouched (added 2026-09-09, user-identified gap)

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** Project A has Auto Close Ticket Days set to a real value; Project B has no auto-close configuration at all (or a different one). Both projects have an eligible (open-status, silent-past-threshold) ticket.

**Steps:**
1. Create an eligible Support-tracker ticket in Project B (no auto-close config)
2. Let the auto-close job run against Project A's configuration
3. Check Project B's ticket status afterward

**Expected Result:**
- Project B's ticket is untouched — auto-close is strictly per-project, driven by each project's own `RfHelpdeskEmailConfig`, never applied globally or leaked from one project's configuration to another's tickets.

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, same run as TC-HLP-082): **PASS.** Confirmed via direct query immediately before the run: Helpdesk QA Beta has **zero** `RfHelpdeskEmailConfig` row at all (`RfHelpdeskEmailConfig.for_project(beta) == nil`), so the worker's own `next if auto_close_days.nil? || auto_close_days <= 0` guard skips it outright — confirmed via the worker's own log output, which shows a "Processing project: Helpdesk QA Alpha" line but **no corresponding line for Helpdesk QA Beta at all** (the project loop's `next` skips it silently before that log line, exactly as source predicted). Cross-checked a genuinely old, silent Beta ticket (from an earlier session's Prepaid Hours fixture set) — confirmed still open/untouched after the run, no journal entry added, no status change. Project-level isolation holds.

---

### TC-HLP-084: Ticket creation from email with both Identifier Keywords and Email Subject Prefix left blank (added 2026-09-09, user-identified gap)

**User Role:** Client (Customer, via email)
**Priority:** Medium
**Precondition:** A project's Email Configuration has a real, working incoming mailbox, but both **Identifier Keywords** and **Email Subject Prefix** are left blank (distinct from TC-HLP-076, which tests the *entire incoming section* left blank — here the mailbox itself is fully configured and polled, only these two specific fields are empty).

**Steps:**
1. Clear both Identifier Keywords and Email Subject Prefix on a project's Email Configuration, Save
2. Send any qualifying-looking email (no special keyword needed) to that project's configured mailbox
3. Wait for the poller / trigger `check_emails`

**Expected Result:**
- A ticket is created regardless of the email's content — with no keywords configured, there is nothing to gate on, so every inbound email to a configured, polled mailbox creates a ticket
- The ticket's subject carries no added prefix, exactly matching the original email's subject verbatim

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, `alpha.customer` via Roundcube webmail, `Helpdesk::EmailPollerWorker`, Helpdesk QA Alpha): **PASS.** Cleared both Identifier Keywords and Email Subject Prefix on Alpha's Email Configuration (SMTP/incoming mailbox itself left fully configured and working). Sent a real email, subject "TC-HLP-084 both fields blank test", body deliberately containing no keyword at all. Manually triggered the poller (several passes, since this shared mailbox has a large backlog of old test emails from earlier sessions that the poller processes in batches). Result: ticket **#59** created, subject exactly "TC-HLP-084 both fields blank test" verbatim (no prefix added, none configured), author correctly `Alpha Customer`. Confirms with no keywords configured there's nothing to gate on — every inbound email to a configured, polled mailbox creates a ticket.

---

### TC-HLP-085: Ticket creation from email with only Email Subject Prefix configured (Identifier Keywords blank) (added 2026-09-09, user-identified gap)

**User Role:** Client (Customer, via email)
**Priority:** Medium
**Precondition:** A project's Email Configuration has Identifier Keywords blank, Email Subject Prefix set to a real value (e.g. `[TICKET]`).

**Steps:**
1. Set Email Subject Prefix, leave Identifier Keywords blank, Save
2. Send an email with no special keyword in it to the configured mailbox
3. Wait for the poller / trigger `check_emails`

**Expected Result:**
- A ticket is still created (keyword gating is off since no keywords are configured — the prefix field alone does not gate creation, since it's a subject-rewrite step applied only after an issue already exists)
- The created ticket's subject carries the configured prefix, confirming the prefix is applied independently of whether any keyword gating is active

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, `alpha.customer` via Roundcube webmail, `Helpdesk::EmailPollerWorker`, Helpdesk QA Alpha): **PASS.** Set Email Subject Prefix = `[TICKET]`, left Identifier Keywords blank. Sent a real email, subject "TC-HLP-085 prefix only test", body deliberately containing no keyword. Triggered the poller. Server log confirmed: `MailHandler: issue #60 created by Alpha Customer` → `Helpdesk::EmailPollerWorker: Created ticket #60 - [TICKET] TC-HLP-085 prefix only test`. Ticket created despite zero keyword gating being active, and its subject genuinely carries the prefix — confirms the prefix mechanism operates entirely independently of keyword gating.

---

### TC-HLP-086: Ticket creation from email with both Identifier Keywords and Email Subject Prefix configured together (added 2026-09-09, user-identified gap)

**User Role:** Client (Customer, via email)
**Priority:** Medium
**Precondition:** A project's Email Configuration has both Identifier Keywords (e.g. `ticket, issue, request`) and Email Subject Prefix (e.g. `[TICKET]`) set to real values.

**Steps:**
1. Set both fields, Save
2. Send a qualifying email (containing one of the configured keywords) to the configured mailbox
3. Wait for the poller / trigger `check_emails`
4. Open the created ticket and inspect its actual Subject field

**Expected Result:**
- A ticket is created (keyword matched)
- The ticket's Subject genuinely carries the configured prefix (e.g. `[TICKET] <original subject>`) — this specific assertion (the prefix actually appearing on a real created ticket's subject) has never been directly confirmed in this suite before; every prior keyword-gating TC (TC-HLP-368/027) was run with the prefix field left blank specifically, so "no prefix expected" was never actually a positive confirmation that the prefix mechanism itself works when both fields are populated together.

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, `alpha.customer` via Roundcube webmail, `Helpdesk::EmailPollerWorker`, Helpdesk QA Alpha): **PASS.** Restored Identifier Keywords = `ticket, issue, request`, kept Email Subject Prefix = `[TICKET]` — both configured together. Sent a real email, subject "TC-HLP-086 ticket both fields test", body deliberately containing the keyword "ticket". Triggered the poller. Server log: `MailHandler: Processing email from helpdesk customer [alpha.customer]` → `MailHandler: issue #61 created by Alpha Customer` → `MailHandler: Added email prefix '[TICKET]' to issue #61 subject` → `Helpdesk::EmailPollerWorker: Created ticket #61 - [TICKET] TC-HLP-086 ticket both fields test`. Confirms — for the first time in this suite with direct evidence — that the prefix mechanism genuinely rewrites a real created ticket's subject when both keyword gating and the prefix are active together, closing the previously-unconfirmed gap left by every earlier TC always running with the prefix field blank. Restored Alpha's Email Configuration to its exact original state afterward (Identifier Keywords = `ticket, issue, request`, Email Subject Prefix = blank — confirmed via direct query).

---

### TC-HLP-087: A ticket resolved just before the silence window elapses is not closed early

**User Role:** Agent
**Priority:** Medium
**Precondition:** Auto-close days = 2; a ticket resolved a few minutes before the 2-day mark would be reached.

**Steps:**
1. Check the ticket's status right at/just after the 2-day mark from resolution

**Expected Result:**
- The ticket is not closed before the full silent period (measured from the Resolved transition) has actually elapsed

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, Helpdesk QA Alpha): **PASS.** Created ticket #65 (Support tracker), transitioned to Resolved via a real Edit (no backdating — genuinely 0 elapsed days). Set Auto Close Ticket Days = 2. Dry-run eligibility count confirmed only 2 old, unrelated Bug-tracker tickets (#37/#38) matched the raw `.open` + silence filter — #65 correctly excluded. Invoked the real worker directly: "Closed 0 tickets". Confirmed via the ticket UI: still Resolved, no auto-close journal entry. Auto Close Ticket Days reset to blank on Alpha afterward.

---

### TC-HLP-088: Whether a reply during the silence countdown resets the auto-close clock

**User Role:** Agent then Client (Customer)
**Priority:** Medium
**Precondition:** A Resolved ticket partway through its silence window.

**Steps:**
1. Have the customer (or agent) add a reply/note partway through the countdown
2. Observe whether the ticket auto-closes at the originally expected time, or a recalculated later time

**Expected Result — record whichever actually happens (not documented explicitly in the guide):**
- Either the clock resets from the new activity, or it doesn't — determine and record the real behavior in `HELPDESK_MEMORY.md`, since this affects how testers interpret "silence"

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, `Helpdesk::AutoCloseTicketsWorker`, Helpdesk QA Alpha, same ticket #65 as TC-154, Auto Close Ticket Days still = 2): **The clock DOES reset — real behavior determined.** Backdated ticket #65's `updated_on` to 1.5 days ago (partway through the 2-day window, still Resolved). Added a real agent Reply Note via the UI (bumped the ticket to "Waiting for Customer Response" as a side effect, per the plugin's own reply-status-transition rule — separately confirmed, not itself under test here) — confirmed via direct query the reply genuinely reset `updated_on` to the current timestamp. Dry-run eligibility count immediately after: only the same 2 unrelated old tickets (#37/#38), #65 correctly excluded. Invoked the real worker: "Closed 0 tickets" — ticket #65 untouched. Since the worker's query (`Issue.open.where('updated_on < cutoff')`, confirmed via source for BUG-HLP-043) is generically silence-based, not resolved-transition-based, **any** activity that bumps `updated_on` — not just a reply specifically — resets the countdown. Recorded for future testers: "silence" here means "no update of any kind to the issue," not "no reply since it was resolved."

---

### TC-HLP-089: Outgoing and incoming mail settings are configured and behave independently

**User Role:** Admin
**Priority:** Medium
**Precondition:** A project with SMTP (outgoing) settings filled in but incoming mailbox fields left blank.

**Steps:**
1. Trigger an outgoing email (e.g. agent reply) — expect it via this project's own SMTP
2. Send a qualifying inbound email toward this project

**Expected Result:**
- Outgoing mail uses this project's configured SMTP (not the global fallback)
- No ticket is created from the inbound email, since incoming settings are blank — the two directions are independently configurable, not all-or-nothing

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, admin, Helpdesk QA Gamma): **This precondition is actually unachievable via the real UI — TC revised, not a bug.** Attempted to fill only the Outgoing (SMTP) section on Gamma (SMTP Server/Username/Password/Email From, using a real new mailbox `gamma.support@test.local`) while leaving the entire Incoming section blank, then Save. The form silently did not submit and nothing persisted (confirmed via direct query: `RfHelpdeskEmailConfig.for_project(gamma)` still `nil` afterward). Root cause confirmed via DOM inspection (`browser_evaluate`, checking every `required` input): `project[mail_server]`, `project[mail_username]`, and `project[mail_password]` all carry HTML5 `required` — the same as every Outgoing field — so the browser's own native validation blocks submission whenever *either* section is incomplete. There is no way to save a project with only outgoing OR only incoming configured; the form is all-or-nothing at the HTML level, contradicting this TC's original precondition (written as an assumption, not sourced from a specific `HELPDESK_USER_GUIDE.md` quote — §13 only describes the fallback behavior for a project with **zero** configuration at all, already confirmed separately via TC-145/149, and never promises partial/one-sided configurability). Not filed as a bug — no documented contract is violated by requiring a complete configuration.

---

## Notes

- **Auto-close testing (TC-HLP-077/151/153), 2026-09-09 — 2 new bugs, real collateral-damage incident and recovery.** User asked directly for the auto-close condition and a test-case summary; live-testing TC-153 surfaced that the real background worker (`Helpdesk::AutoCloseTicketsWorker`) closes ANY open-status ticket past the silence window, not just Resolved ones — filed as **BUG-HLP-043**. Investigating why an initial attempt via `rake redmineflux_helpdesk:auto_close_tickets` closed nothing led to a second, independent discovery: the rake task reads `auto_close_days` from a legacy `ProjectCustomField` (`helpdesk_auto_close_days`) that no longer exists on this instance (zero `ProjectCustomField` rows exist at all) — so the rake task can never close a ticket regardless of any project's real configuration, set via the current `RfHelpdeskEmailConfig`-backed Email Configuration UI. This is the exact same dead-code pattern already noted (but never filed) for `check_emails` in this file's Deferred/Out of Scope section below — filed as **BUG-HLP-044** in `HELPDESK_RAKE_TASKS.md` (TC-HLP-250), since it's that suite's own feature under test.
- **Real, live incident during this testing**: setting Auto Close Ticket Days = 1 on Helpdesk QA Alpha and invoking the real worker directly (necessary since the rake task above turned out to be non-functional, and the sidekiq-cron scheduler poller is still broken per the standing environment quirk) closed **46 tickets** in that project in one pass, not just the 2 dedicated test tickets (#55/#56) — every pre-existing ticket across earlier sessions' SLA Escalation/Ticket Lifecycle/Prepaid Hours/Permissions fixtures that happened to be silent for over a day was swept up too. Recovered the exact prior status of all 44 collaterally-closed tickets from the journal entries Redmine itself recorded (each carried its own `old_value`/`value` status-change detail), reverted the one ticket with genuinely heavy, ongoing reliance (**#46**, referenced 20 times across `HELPDESK_PREPAID_HOURS.md` and confirmed live to be functionally restricted by its Closed state — its Checklist widget showed "Issue is closed, you cannot perform this action"), and removed the fabricated "auto closed" journal entry from it. The other 44 tickets were deliberately left Closed after checking reference counts per ticket — each was a single-use, already-fully-consumed piece of evidence for an already-completed TC/bug, not a suite anyone is expected to reuse by ticket number going forward. Auto Close Ticket Days was set back to blank on Helpdesk QA Alpha afterward (confirmed `nil` via direct query), and no other project has any auto-close configuration set.
- **Lesson for future sessions**: before triggering any background job that acts on "all issues past some age threshold" in a shared environment accumulated over many sessions, check how many issues would actually match first (a dry-run count query), not just how the two dedicated test fixtures will react — a query scoped only by "silent > N days" can match far more than intended once real fixture history piles up.
- **User-identified gap sweep, 2026-09-09 — 5 new TCs (TC-HLP-082–407), all PASS, 0 new bugs.** User asked directly whether auto-close's tracker scope, project scope, and the Identifier-Keywords/Email-Subject-Prefix combination space were covered — genuinely not, in any of the 5 combinations. Applied the dry-run-count lesson above before every worker invocation this round: TC-403/404 confirmed live (tracker scope: two pre-existing Bug-tracker tickets, #37/#38, were left completely untouched while a fresh Support-tracker control ticket, #57, closed correctly in the same run; project scope: a fresh Support-tracker ticket on Beta, #58, with no auto-close config on that project, was left completely untouched, confirmed via the worker's own log showing no "Processing project: Helpdesk QA Beta" line at all). TC-405/406/407 confirmed live via real emails sent through the local Docker mail server (Roundcube, as `alpha.customer`) against all 4 combinations of {Identifier Keywords, Email Subject Prefix} × {blank, filled} (the 4th combination, both-filled, was already partially covered by TC-016 but never with the prefix actually confirmed on a real created ticket's subject — now directly confirmed via ticket #61). Alpha's Email Configuration was restored to its exact original state after each config change and re-verified via direct query at the end. See `HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-370 for a related, still-BLOCKED scenario (email-to-project routing for a multi-project customer) surfaced in the same user question but requiring new Beta-mailbox infrastructure not yet built.

## Evidence Map

- Case ID: TC-HLP-067 – TC-HLP-089, TC-HLP-073 – TC-HLP-075, TC-HLP-079, TC-HLP-082 – TC-HLP-086 (added 2026-09-09)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Manually triggering `rake redmineflux_helpdesk:check_emails` / `auto_close_tickets` and confirming it matches the scheduled job's result — belongs to the Rake Tasks suite (feature #54); `auto_close_tickets` specifically was investigated anyway as part of TC-HLP-077/153 above (it turned out to be completely non-functional, see BUG-HLP-044) — full write-up lives in `HELPDESK_RAKE_TASKS.md` TC-HLP-250, not repeated here.
