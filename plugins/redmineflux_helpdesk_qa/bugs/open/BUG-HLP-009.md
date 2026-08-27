# BUG-HLP-009

- Bug ID: BUG-HLP-009
- Title: Adding a note via the standard Redmine "Edit" form auto-transitions the ticket's status to "Waiting for Customer Response" even though nothing is actually communicated to the customer anywhere (no Notes visibility, no Helpdesk Conversion entry, no email)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-26)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`aurora.wren`) adding the note; Client/Customer (`beta.customer`) viewing the ticket
- Date: 2026-08-26

## Steps to reproduce

1. Customer creates a ticket via their own portal "New issue" form (reproduced: `beta.customer`, ticket **#70**, "Verify Edit-form public note visibility and auto-status-transition", Status: New).
2. Agent opens the same ticket via the real in-app **Helpdesk Tickets** list (reproduced: `aurora.wren`, landing on the core `/issues/70` route).
3. Agent clicks the top-level **Edit** link (`/issues/70/edit` — the standard Redmine issue-edit form, *not* the plugin's **Reply** button/Reply Note-Internal Note UI).
4. In the **Notes** field, enter text. Leave the **Private notes** checkbox **unchecked**. Leave **Status** untouched (still "New").
5. Click **Submit**.
6. As the agent, confirm the note appears inline on the ticket (not marked "Private") and check the ticket's Status.
7. Log out, log in as the customer (`beta.customer`), and open the same ticket via real click-through (My Helpdesk → project → Helpdesk Tickets → ticket row, landing on the branded `/projects/helpdesk-qa-beta/helpdesk/issues/70` route).
8. Check the ticket's **Notes** tab and its **Helpdesk Conversion** tab (if present).

## Expected result

- The Notes tab is **not** meant to be customer-facing at all — this matches the plugin's own established pattern (see `HELPDESK_MEMORY.md` addendum #5): even a genuine Reply Note's text never appears inline in Notes, only via the **Helpdesk Conversion** tab (the actual customer-facing correspondence log, backed by a real outbound email). So a note staying out of the customer's Notes tab is correct, not a defect.
- **Status should only auto-transition to "Waiting for Customer Response" when a real customer-facing reply happens** — i.e. when the plugin's own Reply mechanism fires, sends an actual email, and logs a Helpdesk Conversion entry (TC-HLP-019/021). Adding a note via the plain Redmine Edit form is not a Helpdesk "reply" — it produces no customer notification through any channel — so it should **not** trigger this status change at all.

## Actual result

- Status **incorrectly auto-transitions** to "Waiting for Customer Response" purely from submitting the Edit form's Notes field — confirmed via the resulting Property change entry ("Status changed from New to Waiting for Customer Response"), even though the Status dropdown itself was never touched and no genuine reply/notification mechanism was invoked.
- **No corresponding customer communication is produced through any channel**: the note doesn't appear in the customer's Notes tab (expected, per above) — but it *also* doesn't appear in Helpdesk Conversion, because no Helpdesk Conversion entry exists on this ticket at all (confirmed: the tab itself is entirely absent from the ticket's tab list, meaning zero entries — not even the "Ticket Created Successfully" system email one would expect). No outbound email was observed either.
- **Net effect**: the ticket's status falsely claims "we replied and are waiting on the customer" when nothing was actually sent to them through any channel — a misleading ticket state with no way for the customer to know what, if anything, they're expected to respond to. This can also distort SLA/reporting metrics that key off this status, since it implies a genuine agent response occurred.

## Evidence

### Screenshot

![Agent's view: note visible inline, not marked Private, Status auto-transitioned](../../screenshots/BUG-HLP-009/agent-view-note-and-status-visible.png)
![Customer's view: no Helpdesk Conversion tab exists at all — zero customer-facing entries despite the status change](../../screenshots/BUG-HLP-009/customer-notes-tab-empty.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-009/retest-yyyy-mm-dd-pass.png)

### Console / log

- Agent-side note submission: `PATCH /issues/70` (core `IssuesController#update`), `private_notes` left unchecked/absent.
- Agent-side rendering (Property changes tab): "Status changed from New to Waiting for Customer Response" followed by the note text, not tagged Private.
- Customer-side view (`/projects/helpdesk-qa-beta/helpdesk/issues/70`, branded route): tab list is **History / Notes / Property changes only — no "Helpdesk Conversion" tab present**, confirming zero entries exist there for this ticket.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Reported by the user from their own testing/observation, then verified live here on a clean, purpose-built fixture (ticket #70, created fresh specifically to isolate this from the debris on ticket #67) before filing.
- **Corrected scope, same session**: the first pass at this bug wrongly framed it as "the note should be visible to the customer but isn't." Per the user's correction, the Notes tab is never meant to be customer-facing at all (matches established Reply Note behavior) — the real defect is that the **status auto-transition fires without any accompanying customer-facing communication being produced through the one channel that matters, Helpdesk Conversion**. Rewritten above to reflect this.
- **Likely part of the same broader pattern as BUG-HLP-007/008**: the plugin's branded, customer-facing logic doesn't fully account for actions taken via Redmine's standard/core Edit form — here specifically, the status-auto-transition side effect appears to be wired to "any non-private note was added" rather than "a genuine Reply Note action occurred," so it fires on a path that never produces the actual customer notification the status implies.
- Not yet tested: whether the same gap exists for a note added via Edit by an **Admin** (as opposed to Agent) role — out of scope for this repro, worth a follow-up if this bug's fix needs broader verification.
