# BUG-HLP-015

- Bug ID: BUG-HLP-015
- Production Redmine Issue ID: #121073 (ztflux)
- Title: A customer's ticket view exposes the standard "Notes" tab (not just "Helpdesk Conversion") — and a customer's own real email reply is logged twice, once in Helpdesk Conversion and again as a plain Journal visible under Notes
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-31)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Client/Customer (`alpha.customer`) viewing the ticket; Agent (`luna.blossom`) cross-checked the same ticket
- Date: 2026-08-31

## Steps to reproduce

**Part A — Notes tab itself shouldn't be customer-facing at all**

1. As a customer with project access (`alpha.customer`), open any of your own tickets via genuine click-through (My Helpdesk → project → Helpdesk Tickets → ticket row), landing on the branded route.
2. Look at the tab list under the ticket's Description.

**Part B — a customer's real email reply is logged in two places**

1. Customer emails the project's support inbox with a ticket-triggering subject (reproduced: `alpha.customer@test.local` → `alpha.support@test.local`, ticket **#3** created).
2. Agent (`luna.blossom`) replies via the ticket's **Reply** → Reply Note.
3. Customer replies **for real, by email** (threaded reply to the agent's notification) — Sidekiq's `email_checker` / `Helpdesk::EmailPollerWorker` converts it into a Journal on the ticket.
4. As the **agent**, open the ticket's core route (`/issues/3?tab=notes`) and check the Notes tab content.
5. As the **customer**, open the same ticket's Helpdesk Conversion tab and compare.

## Expected result

- Per explicit user product-judgment direction: a customer session should only ever see the **Helpdesk Conversion** tab on their own ticket — the plain Redmine **Notes** tab is an internal/agent-facing view and should not be exposed to a customer session at all, regardless of what it currently contains.
- A given real communication (e.g. the customer's own email reply) should be represented once, in the customer-facing Helpdesk Conversion log — not duplicated into the separate internal Notes/Journal history as well.

## Actual result

- **Part A**: The customer's ticket view always renders a "Notes" tab, whether or not any Helpdesk Conversion entries exist yet. Confirmed on two tickets:
  - Ticket #4 (no email history at all yet): tab list shows only **"Notes"** — no Helpdesk Conversion tab exists yet, but Notes is still exposed and, in this case, actually contains content (see Part B/related finding below).
  - Ticket #3 (has a full email history): tab list shows **both "Notes" and "Helpdesk Conversion (4)"** side by side.
- **Part B**: The customer's real email reply on ticket #3 ("Hi Luna, I'm using Chrome and the portal login page shows a completely blank white screen...") is correctly logged as Helpdesk Conversion entry #4 (see `bugs/closed/BUG-HLP-008.md`) — but the same reply **also exists as a plain Journal note**, visible under the ticket's Notes tab when viewed by an agent (`/issues/3?tab=notes`). This is inconsistent with how an **agent's** Reply Note behaves on the same ticket: an agent's Reply Note is deliberately excluded from the Notes tab entirely (confirmed via TC-HLP-022 and this bug's own BUG-HLP-009 retest) and only ever appears via Helpdesk Conversion — but a **customer's** real email reply is not excluded the same way; it leaks into both channels.
- Note: the customer's *own* Notes tab view for ticket #3 does not show this journal (it renders empty for her) — the duplication is visible specifically from an **agent/admin** session's Notes tab, not the customer's own. This means the suppression logic that correctly hides Reply Notes and (for the customer) her own emailed reply from a customer's Notes view does exist, but does **not** extend to filtering the same content out of the agent-facing Notes tab, and does not extend to hiding the Notes *tab itself* from a customer session (Part A).

## Evidence

### Screenshot

![Agent's Notes tab shows the customer's real email reply as a plain Journal, duplicating Helpdesk Conversion entry #4](../../screenshots/BUG-HLP-015/agent-notes-tab-shows-customer-reply-journal.png)
![Customer session's ticket view exposes both "Notes" and "Helpdesk Conversion" tabs side by side](../../screenshots/BUG-HLP-015/customer-session-shows-both-notes-and-conversion-tabs.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-015/retest-yyyy-mm-dd-pass.png)

### Console / log

- Agent view: `GET /issues/3?tab=notes` renders a journal entry containing "Hi Luna, I'm using Chrome and the portal login page shows a completely blank white screen after I enter my password. No error message appears." — identical text to Helpdesk Conversion entry #4.
- Customer view: `GET /projects/helpdesk-qa-alpha/helpdesk/issues/3?tab=notes` renders zero journal entries for the same ticket — confirms the customer's own Notes view is filtered, but the Notes *tab itself* is still present and (on other tickets, e.g. #4) can show content depending on how the note was created.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md` (empty register) and the existing bug index — related to but distinct from BUG-HLP-008 (closed; Helpdesk Conversion completeness/accuracy) and BUG-HLP-009 (closed; false status auto-transition on a plain Edit-form note). Neither of those covers tab-level customer exposure or the Notes/Conversion duplication described here.
- Existing bug reference (if duplicate): —

## Notes

- Reported by the user from their own observation ("note tab also visible to customer, only helpdesk tab should be visible to customer" / "when customer replied from through mail his reply also appear in note section of ticket"), then verified live here before filing, per this engagement's established practice.
- Surfaced as a direct side effect of retesting BUG-HLP-008 and BUG-HLP-009 in this same session — both those retests used the same tickets (#3, #4) this bug's evidence comes from.
- Not yet determined: whether the correct fix is (a) hide the Notes tab entirely for customer sessions, (b) stop creating a duplicate plain Journal for a customer's real email reply in the first place (i.e. only the Helpdesk Conversion entry should exist), or (c) both. Recommend whoever triages this decide based on how deeply Notes/Journal is relied upon elsewhere (e.g. `journals` table is core Redmine data other features may depend on) versus how easy it is to just exclude the customer role from the Notes tab's rendering.

## Retest — 2026-09-22 (Local, `redmine-docker-6`) — NOT FIXED, both parts still reproduce; Part B is now visible to the customer too (worse than originally found)

**No Production Redmine Issue ID exists for this bug — never reported to production, so this is a fresh local retest, not a developer-checked-in-fix verification.**

- **Source check first**: `app/views/rf_project_helpdesk_issues/show.html.erb` (the customer-facing branded ticket view) has exactly one tab-filtering line for customer sessions: `history_tabs = history_tabs.reject { |tab| tab[:name] == 'time_entries' } if User.current.is_helpdesk_customer?` — only `time_entries` is excluded. There is no equivalent exclusion for `notes`, and a full-plugin grep for `BUG-HLP-015` found zero matches anywhere in the source — no fix has been attempted for either part of this bug.
- **Part A — live-verified, still reproduces exactly as originally found.** Logged in as `alpha.customer`, opened ticket #3 (`/projects/helpdesk-qa-alpha/helpdesk/issues/3`, the same ticket from the original repro) via genuine click-through. The tab list shows **History, Notes, Property changes, Helpdesk Conversion (4)** — the Notes tab is still fully present and clickable for a customer session, alongside Helpdesk Conversion. Confirmed via the raw tab markup (`<a id="tab-notes" ...>Notes</a>` present, not conditionally omitted).
- **Part B — live-verified, still reproduces, and is now visibly *worse* than the original finding.** Clicked into the customer's own Notes tab on ticket #3. It is **no longer empty** — it now shows the same 2 journal entries an agent sees: `change-3` (the customer's real 2026-08-31 email reply — "Hi Luna, I'm using Chrome and the portal login page shows a completely blank white screen after I enter my password. No error message appears.", the exact text also present as Helpdesk Conversion entry #4) and `change-99` (an auto-close system note). Cross-checked the identical content from an **agent session** (`/issues/3?tab=notes`, core route) — both journal entries render identically there too. The original finding explicitly noted "the customer's *own* Notes tab view for ticket #3 does not show this journal (it renders empty for her)" — **that partial mitigation is gone**: the customer can now see her own duplicated reply in the internal Notes tab too, not just an agent. Whether this is a regression from some unrelated change or simply a re-observation of flakier-than-realized original behavior was not determined, but the black-box result today is unambiguous and reproducible.
- **Verdict: NOT FIXED. Both parts of this bug still reproduce, and Part B's customer-facing exposure is now broader (both customer and agent see the duplicate) rather than narrower.** Recommend treating this as a real, currently-open defect needing the original triage decision (a)/(b)/(c) from the Notes section above — no code changes toward any of those options have been made yet.
- Reported to production 2026-09-22 as **#121073** (ztflux), status New, assigned to Vaishnavi Bhawsar, Priority Medium / Defect Severity Medium-severity / Defect priority Medium / Defect Type Functional, Category Helpdesk Plugin.
