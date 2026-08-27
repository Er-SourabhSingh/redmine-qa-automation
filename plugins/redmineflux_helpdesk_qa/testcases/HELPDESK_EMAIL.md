# Test Cases — Redmineflux Helpdesk — Features 41–44: Email (In and Out)

> Source: `docs/HELPDESK_FEATURES_LIST.md` #41–44 (category G). Grounded in `docs/HELPDESK_USER_GUIDE.md` §3.6 (Configure email), §13 (Email: in and out), §19 (background jobs), and tester checklist §26 groups O (Email — incoming) and P (Email — outgoing).
>
> Email-creates-a-ticket behavior (registered vs. unregistered sender, identifier keywords, email prefix, thread-reply-becomes-note, Email History on creation) is already covered in `HELPDESK_TICKET_LIFECYCLE.md` (TC-HLP-016, 017, 026, 027) — not repeated here. This suite covers what's still untested: email configuration access control, outgoing SMTP behavior and fallback, full Email History content, and auto-close.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-143: An administrator can save a project's email configuration

**User Role:** Administrator
**Precondition:** A project with the Helpdesk module enabled.

**Steps:**
1. Helpdesk › Settings › Email Configuration, pick the project
2. Fill in outgoing (SMTP) and/or incoming (mailbox) settings
3. Save

**Expected Result:**
- The form is shown and saves successfully — this screen is admin-only regardless of the signed-in user's helpdesk role/permissions

---

### TC-HLP-144: A project with its own SMTP settings sends from its configured address

**User Role:** N/A (system-driven, verified via a received email)
**Precondition:** Project A has SMTP settings configured with **Email from** = `support@acme.example`.

**Steps:**
1. Trigger an outgoing email from Project A (e.g. an agent reply)
2. Inspect the received email's From address

**Expected Result:**
- The email is sent from `support@acme.example`, using Project A's own SMTP settings

---

### TC-HLP-145: A project without SMTP settings falls back to Redmine's global mail settings

**User Role:** N/A (system-driven)
**Precondition:** Project B has no SMTP fields configured.

**Steps:**
1. Trigger an outgoing email from Project B

**Expected Result:**
- The email is sent using Redmine's global mail configuration, not a per-project one

---

### TC-HLP-146: Two projects with different SMTP settings send as two distinct senders

**User Role:** N/A (system-driven)
**Precondition:** Project A configured as `support@acme.example`; Project C configured as `help@othercorp.example`.

**Steps:**
1. Trigger an outgoing email from each project
2. Compare the From addresses of the two received emails

**Expected Result:**
- Each email carries its own project's configured sender address — the two are visibly different companies from the recipient's point of view

---

### TC-HLP-147: Outgoing mail fires on all four documented trigger events

**User Role:** Agent (verified via Email History / received mail)
**Precondition:** A project with outgoing mail configured (or falling back to global).

**Steps:**
1. Create a ticket by email or observe the creation acknowledgement (already covered elsewhere — confirm mail fired)
2. Have an agent reply
3. Let an SLA breach or escalate on a ticket
4. Let a ticket auto-close

**Expected Result:**
- An outgoing email is sent for each of the four events: ticket created, agent reply, SLA breach/escalation, and auto-close

---

### TC-HLP-148: Email History shows full detail for every message

**User Role:** Agent
**Precondition:** A ticket with at least one inbound and one outbound message recorded.

**Steps:**
1. Open the ticket's **Email History** tab

**Expected Result:**
- Each entry shows direction (in/out), sender, recipient, subject, body, and timestamp

---

### TC-HLP-286: An agent's Reply Note is logged in the Helpdesk Conversion tab, correctly attributed

**User Role:** Agent
**Precondition:** An existing ticket (any origin).

**Steps:**
1. Open the ticket, click **Reply**, select **Reply Note**, enter text, Save
2. Open the **Helpdesk Conversion** tab

**Expected Result:**
- A new entry appears, labeled with the agent's own name (e.g. "Aurora Wren (via Reply Note)") and the reply text, correctly attributed — not to the customer
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #67): PASS — entry correctly labeled and attributed. One caveat found in the same pass: on that ticket, a **second, duplicate** entry also appeared immediately after the correctly-labeled one — same body text, but mislabeled as an inbound "Customer replied to Support" message with a fabricated `From: <customer>` line. Not reproduced on a cleaner single-reply ticket (#69) — condition for the duplicate isn't isolated yet. Tracked as **BUG-HLP-008**, Part B, not a failure of this TC's core expectation.

---

### TC-HLP-287: A customer's portal Reply is logged in the Helpdesk Conversion tab, correctly attributed

**User Role:** Client (Customer)
**Precondition:** An existing ticket the customer can open (see BUG-HLP-006 for when this is blocked).

**Steps:**
1. As the customer, open the ticket, click **Reply**, enter text, Save
2. Open the **Helpdesk Conversion** tab

**Expected Result:**
- A new entry appears, labeled with the customer's own name (e.g. "Beta Customer (via Reply Note)") and the reply text, correctly attributed
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #69, portal-created fixture): PASS — entry correctly attributed, no mislabeling (contrast with TC-HLP-286's caveat above). No separate "Notes" tab appeared either, since Reply Note content only ever surfaces via Helpdesk Conversion, matching the agent-side behavior.

---

### TC-HLP-288: A customer's real inbound-email reply to an existing ticket is NOT logged in the Helpdesk Conversion tab

**User Role:** Client (Customer), replying by real email — verified from the Agent side
**Precondition:** A ticket that already has at least one agent reply (so an outbound notification email exists for the customer to reply to).

**Steps:**
1. Customer replies by real email (threaded) to the ticket's outbound notification
2. Wait for the next poller cron tick to process it
3. Open the ticket's **Notes** tab, then separately open its **Helpdesk Conversion** tab

**Expected Result:**
- The reply appears as a Journal entry under Notes **and** as a correctly-attributed inbound entry under Helpdesk Conversion, consistent with TC-HLP-286/287 above — Helpdesk Conversion should be a complete audit trail of all correspondence regardless of which channel a reply came in through
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #67): FAIL — the reply appears under Notes only (correct content, correctly attributed to the customer). The Helpdesk Conversion tab's count does not increment; the email reply is absent from it entirely. Tracked as **BUG-HLP-008**, Part A. Likely shared root cause with the `Helpdesk::EmailPollerWorker`'s `MailHandler returned unexpected result: Journal` warning — see `HELPDESK_MEMORY.md` and `bugs/open/BUG-HLP-008.md`.

---

### TC-HLP-149: Leaving incoming mail settings blank means no mailbox is polled for that project

**User Role:** N/A (system-driven)
**Precondition:** A project's email configuration has all incoming (mailbox) fields left blank.

**Steps:**
1. Send a qualifying email addressed toward what would be this project's mailbox, if it had one configured
2. Wait past a normal poller interval

**Expected Result:**
- No ticket is created — this project simply isn't polled

---

### TC-HLP-150: A resolved ticket auto-closes after the configured silent period

**User Role:** N/A (system-driven, verified by Agent)
**Precondition:** Project's Auto-close days = 2; a ticket set to Resolved and left untouched.

**Steps:**
1. Leave the Resolved ticket silent for longer than 2 days (or the environment's equivalent test window)
2. Check its status after the next auto-close job run (≤ 2 minutes once due)

**Expected Result:**
- The ticket is automatically moved to **Closed**

---

### TC-HLP-151: Auto-close days blank or 0 disables auto-close for that project

**User Role:** Admin
**Precondition:** Auto-close days set to blank (or `0`) on the project's email configuration.

**Steps:**
1. Resolve a ticket and leave it silent well past what would otherwise be a closing window

**Expected Result:**
- The ticket stays Resolved — it is never auto-closed while the setting is blank/0

---

## Negative Cases

---

### TC-HLP-290: The same mailbox/SMTP address configured on two different projects — determine whether it's blocked or silently allowed

**User Role:** Admin
**Precondition:** Project A's Email Configuration already has a working incoming mailbox and/or outgoing SMTP account (e.g. `alpha.support@test.local`).

**Steps:**
1. Open Project B's Email Configuration (Helpdesk › Settings › Email Configuration, pick Project B)
2. Enter the exact same mailbox address/credentials Project A already uses, for incoming and/or outgoing
3. Attempt Save
4. If Save succeeds: send one qualifying email to that shared mailbox address and observe which project (if either, or both) actually creates a ticket from it

**Expected Result — record whichever actually happens, not documented anywhere in `HELPDESK_REQUIREMENTS.md`/`HELPDESK_USER_GUIDE.md`/`HELPDESK_FEATURES_LIST.md`:**
- Either Save is refused with a validation naming the conflict (the correct, safe behavior — since one real-world mailbox can only sensibly be polled by one project's `email_checker`), or Save silently succeeds. If it silently succeeds, step 4 determines the real-world impact: does the email create a ticket on both projects (duplicate), on whichever project's poller runs first (non-deterministic/silent misrouting), or does Redmine's own IMAP `\Seen` marking mean only one project ever sees it depending on poll timing (a race, not a rule)? **This is not yet executed** — flagged from a direct question about this exact gap; not covered by TC-HLP-146, which only tests two projects with *different* SMTP configs (a positive case), never the same one reused. If Save silently succeeds and any misrouting/duplication is observed, file as a bug — this is a real data-integrity risk, not just a UX gap.

---

### TC-HLP-152: A non-admin manager cannot save a project's email configuration

**User Role:** Manager with `manage_helpdesk` but not an administrator
**Precondition:** Viewing Helpdesk › Settings › Email Configuration.

**Steps:**
1. Pick a project from the dropdown

**Expected Result:**
- Instead of the editable form, a note is shown explaining this is admin-only — no save is possible

---

### TC-HLP-153: Auto-close never affects a ticket that isn't Resolved

**User Role:** Agent
**Precondition:** A ticket in In Progress (or New, Feedback, Waiting for Customer Response) left silent well past the project's Auto-close days.

**Steps:**
1. Leave the ticket silent past the auto-close threshold without ever setting it to Resolved
2. Check its status after the auto-close job would have run

**Expected Result:**
- The ticket's status is unchanged — auto-close only ever acts on tickets already in **Resolved**

---

## Edge Cases

---

### TC-HLP-154: A ticket resolved just before the silence window elapses is not closed early

**User Role:** Agent
**Precondition:** Auto-close days = 2; a ticket resolved a few minutes before the 2-day mark would be reached.

**Steps:**
1. Check the ticket's status right at/just after the 2-day mark from resolution

**Expected Result:**
- The ticket is not closed before the full silent period (measured from the Resolved transition) has actually elapsed

---

### TC-HLP-155: Whether a reply during the silence countdown resets the auto-close clock

**User Role:** Agent then Client (Customer)
**Precondition:** A Resolved ticket partway through its silence window.

**Steps:**
1. Have the customer (or agent) add a reply/note partway through the countdown
2. Observe whether the ticket auto-closes at the originally expected time, or a recalculated later time

**Expected Result — record whichever actually happens (not documented explicitly in the guide):**
- Either the clock resets from the new activity, or it doesn't — determine and record the real behavior in `HELPDESK_MEMORY.md`, since this affects how testers interpret "silence"

---

### TC-HLP-156: Outgoing and incoming mail settings are configured and behave independently

**User Role:** Admin
**Precondition:** A project with SMTP (outgoing) settings filled in but incoming mailbox fields left blank.

**Steps:**
1. Trigger an outgoing email (e.g. agent reply) — expect it via this project's own SMTP
2. Send a qualifying inbound email toward this project

**Expected Result:**
- Outgoing mail uses this project's configured SMTP (not the global fallback)
- No ticket is created from the inbound email, since incoming settings are blank — the two directions are independently configurable, not all-or-nothing

---

## Evidence Map

- Case ID: TC-HLP-143 – TC-HLP-156, TC-HLP-286 – TC-HLP-288, TC-HLP-290
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Manually triggering `rake redmineflux_helpdesk:check_emails` / `auto_close_tickets` and confirming it matches the scheduled job's result — belongs to the Rake Tasks suite (feature #54), not repeated here.
