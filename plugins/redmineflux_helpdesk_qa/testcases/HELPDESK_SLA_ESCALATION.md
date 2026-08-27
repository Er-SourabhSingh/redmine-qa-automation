# Test Cases — Redmineflux Helpdesk — Features 22–32: SLA Engine, Support Levels & Escalation, Holidays

> Source: `docs/HELPDESK_FEATURES_LIST.md` #22–32 (category D — the largest, most business-critical category). Grounded in `docs/HELPDESK_USER_GUIDE.md` §9 (SLAs: how the clock actually works), §10 (Support levels and escalation), §16 (Holidays), §3.2/§3.3 (SLA/support-level setup forms), and tester checklist §26 groups E (SLAs), F (Support levels and escalation), G (Holidays), N (SLA behaviour — the clock).
>
> The SLA Status **badge** (feature #20) is already covered in `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md` — not repeated here. The SLA Information **panel** (feature #28) is new to this suite.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-075: Creating an SLA saves name, response/resolution times, and units

**User Role:** Agent (with `manage_helpdesk`) or Admin
**Precondition:** None.

**Steps:**
1. Project › Helpdesk › SLA tab › New SLA
2. Name: `Standard`; First response time: `4`, unit `hours`; Resolution time: `24`, unit `hours`
3. Save

**Expected Result:**
- SLA saves successfully with the exact name, times, and units entered

---

### TC-HLP-076: Working hours, working days, and holidays attached to an SLA are respected by the clock

**User Role:** Agent or Admin
**Precondition:** An SLA configured 09:00–18:00, Mon–Fri, with at least one holiday attached.

**Steps:**
1. Save the SLA with these settings
2. Assign a ticket that uses this SLA outside working hours (e.g. weekend) and observe the deadline

**Expected Result:**
- Working hours/days/holidays all save on the SLA
- The clock only advances inside the configured window — see TC-HLP-083/084 for the specific calculation checks

---

### TC-HLP-077: Leaving Project blank on an SLA makes it available to every project

**User Role:** Admin
**Precondition:** None.

**Steps:**
1. Create an SLA, leave **Project** blank, Save
2. Attempt to select this SLA when creating a customer's project-access row on two different projects

**Expected Result:**
- The SLA is offered as an option on both projects

---

### TC-HLP-078: SLA History records every change

**User Role:** Agent or Admin
**Precondition:** An existing SLA.

**Steps:**
1. Edit the SLA — change its resolution time
2. Open its **History**

**Expected Result:**
- The change is logged with the action taken, the user who made it, the timestamp, and a field-level diff of what changed

---

### TC-HLP-079: A new unassigned ticket has no SLA clock running

**User Role:** Agent
**Precondition:** A newly raised ticket, not yet assigned.

**Steps:**
1. Open the ticket's SLA Information panel

**Expected Result:**
- No deadlines are shown / SLA reads as not started — the clock has not begun

---

### TC-HLP-080: Assigning a customer-raised ticket attaches the SLA from their project-access row

**User Role:** Agent
**Precondition:** A ticket raised by a customer whose project-access row specifies SLA "Standard".

**Steps:**
1. Assign the ticket to an agent

**Expected Result:**
- SLA "Standard" attaches to the ticket
- The response deadline is calculated from the moment of this assignment

---

### TC-HLP-081: Assigning an agent-raised ticket falls back to the project's (or global) active SLA

**User Role:** Agent
**Precondition:** A ticket raised by an agent (not a customer), on a project with an active project-specific SLA.

**Steps:**
1. Assign the ticket

**Expected Result:**
- The first active SLA for this project attaches (or a global SLA if none is project-specific)

---

### TC-HLP-082: The resolution deadline is not set until the first response is given

**User Role:** Agent
**Precondition:** A ticket just assigned, with its SLA attached and response deadline set.

**Steps:**
1. Check the SLA Information panel before any reply
2. Send the first reply to the customer
3. Check the panel again

**Expected Result:**
- Step 1: no resolution deadline is shown yet
- Step 3: the resolution deadline now appears, calculated from the time of this first response — not from ticket creation or assignment

---

### TC-HLP-083: The clock respects working hours across a weekend

**User Role:** Agent
**Precondition:** An SLA with a 4-hour response time, working hours 09:00–18:00, Mon–Fri.

**Steps:**
1. Assign a ticket using this SLA at 17:00 on a Friday

**Expected Result:**
- The response deadline is **12:00 the following Monday** — not 21:00 Friday

---

### TC-HLP-084: A configured holiday is skipped by the clock

**User Role:** Agent
**Precondition:** An SLA with a holiday attached that falls within the response window that would otherwise apply.

**Steps:**
1. Assign a ticket using this SLA such that the holiday falls inside the naive deadline window

**Expected Result:**
- The holiday's date(s) do not count toward the deadline — the deadline extends past the holiday accordingly

---

### TC-HLP-085: Replying pauses the clock; the customer's reply resumes it

**User Role:** Agent then Client (Customer)
**Precondition:** An assigned ticket with an active SLA.

**Steps:**
1. Agent replies to the customer
2. Check status and SLA panel — expect Waiting for Customer Response, clock paused
3. Customer replies
4. Check status and SLA panel again

**Expected Result:**
- Step 2: status is Waiting for Customer Response; clock is paused
- Step 4: status is In Progress; clock resumes counting from where it paused

---

### TC-HLP-086: Unassigning pauses the clock; reassigning resumes it

**User Role:** Agent
**Precondition:** An assigned ticket with a running SLA clock, not currently waiting on the customer.

**Steps:**
1. Unassign the ticket
2. Check the SLA panel
3. Reassign it

**Expected Result:**
- Step 2: clock is paused while unassigned
- Step 3: clock resumes (unless the ticket is still Waiting for Customer Response, in which case it stays paused)

---

### TC-HLP-087: Letting a deadline pass marks the ticket breached

**User Role:** Agent
**Precondition:** A ticket whose response or resolution deadline is allowed to pass with the clock running.

**Steps:**
1. Let the deadline pass without the qualifying action (reply, or resolution)
2. Check the ticket after the next SLA monitor run (≤ 2 minutes)

**Expected Result:**
- Ticket is marked breached, with the breach time recorded
- Notifications are sent
- The ticket becomes a candidate for escalation

---

### TC-HLP-088: The SLA Information panel shows the full SLA state

**User Role:** Agent
**Precondition:** A ticket with an SLA attached, at least one escalation having occurred.

**Steps:**
1. Open the ticket and view the SLA Information panel

**Expected Result:**
- Panel shows: which SLA applies, when it started, both deadlines, whether either is breached, paused time, current support level, and the escalation count

---

### TC-HLP-089: Creating a support-level chain L1 → L2 → L3

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A project with at least 3 distinct members available as assignees.

**Steps:**
1. Project › Helpdesk › Settings › Support Levels › New Support Level, create L1 with ≥1 assignee
2. Create L2, create L3
3. Edit L1: Escalates to → L2. Edit L2: Escalates to → L3. Leave L3's Escalates to blank

**Expected Result:**
- All three levels save correctly
- L3 (the top) correctly has no Escalates to target

---

### TC-HLP-090: The support-level assignee dropdown only offers this project's members

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Creating/editing a support level on Project A.

**Steps:**
1. Open the assignee dropdown while creating a level on Project A

**Expected Result:**
- Only members of Project A are offered — no members of other projects appear

---

### TC-HLP-091: A ticket enters at the support level on its customer's project-access row

**User Role:** Agent
**Precondition:** A customer whose project-access row specifies support level L2.

**Steps:**
1. That customer raises a ticket and it gets assigned

**Expected Result:**
- The ticket's current support level is L2, not the chain's starting level L1

---

### TC-HLP-092: An SLA breach escalates the ticket to the next support level

**User Role:** N/A (system-driven, verified by Agent)
**Precondition:** A ticket at L1 whose SLA has just breached; L1 escalates to L2.

**Steps:**
1. Wait for the next SLA monitor run (≤ 2 minutes) after the breach

**Expected Result:**
- Ticket's support level moves from L1 to L2
- Ticket is reassigned to an assignee at L2
- Its escalation count increments by 1
- L2's assignees are notified

---

### TC-HLP-093: The escalation notification email carries the documented content

**User Role:** N/A (system-driven, verified via mailbox/log)
**Precondition:** TC-HLP-092 just occurred.

**Steps:**
1. Inspect the escalation email sent to the new (L2) assignee

**Expected Result:**
- Email contains: ticket ID and subject, project name and current status, the previous level and the new level, the SLA name and which deadline was breached (response or resolution), how many times this ticket has been escalated, and a direct link to the ticket

---

### TC-HLP-094: A breach at the top support level notifies without escalating further

**User Role:** N/A (system-driven, verified by Admin/Agent)
**Precondition:** A ticket at the top level (no Escalates to) whose SLA breaches.

**Steps:**
1. Wait for the next SLA monitor run after the breach

**Expected Result:**
- The notification still goes out to the current (top) level
- The ticket does not climb further (there is nowhere to go)
- Administrators receive a critical breach alert

---

### TC-HLP-095: Escalation history records the full detail of each escalation

**User Role:** Agent or Admin
**Precondition:** A ticket that has escalated at least once (TC-HLP-092).

**Steps:**
1. Open the ticket's escalation history (under the SLA section)

**Expected Result:**
- Shows: from level → to level, from assignee → to assignee, the deadlines before and after, which breach caused it, and when it happened

---

### TC-HLP-096: Deadlines are recalculated at each escalation using the SLA's working hours

**User Role:** N/A (system-driven, verified by Agent)
**Precondition:** An SLA with working hours 09:00–18:00 Mon–Fri; a ticket escalating at 17:55 on a Friday.

**Steps:**
1. Trigger/observe an escalation happening at 17:55 on a Friday

**Expected Result:**
- The recalculated deadline after escalation is a valid future working-hours deadline (e.g. Monday morning onward) — **not** an already-expired timestamp a few minutes after 17:55

---

### TC-HLP-097: Creating a holiday — single day and multi-day range — and attaching it to an SLA

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk › Settings › Holidays › New Holiday — create a single-day holiday (start = end)
2. Create a second holiday with start date and end date several days apart
3. Attach both to an SLA's Holidays field, Save

**Expected Result:**
- The multi-day closure saves as **one** entry with a date range, not multiple entries
- Both holidays show correctly on the SLA after saving

---

### TC-HLP-276: SLA list search, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple SLAs exist, at least one Active and at least one Inactive (deactivated via the list-level toggle).

**Steps:**
1. Open the SLA list, type a known SLA's name into **Search SLAs...**, click **Apply Filters**
2. Clear the search box, instead set the **Status** dropdown to **Active only**, click **Apply Filters**
3. Repeat with **Inactive only**
4. Click **Clear**

**Expected Result:**
- Step 1: only the matching SLA(s) are shown
- Step 2: only Active SLAs are shown
- Step 3: only Inactive SLAs are shown
- Step 4: both the search box and Status dropdown reset, and the full unfiltered list returns
- Search and Status filter can be combined (e.g. a search term plus Active only) and both conditions apply together

---

### TC-HLP-277: Support Level list search, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple support levels exist on a project, at least one Active and at least one Inactive.

**Steps:**
1. Open a project's Helpdesk → Settings → Support Level tab
2. Search by a known level's name, click **Apply Filters**
3. Clear search, set **Status** to **Active only**, then **Inactive only**, applying each time
4. Click **Clear**

**Expected Result:**
- Same behavior as TC-HLP-276, scoped to this project's support levels only
- The list stays scoped to the current project throughout — no other project's support levels ever appear regardless of filter state

---

### TC-HLP-278: Holiday list search and Apply/Clear Filters work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple holidays exist (single-day and multi-day ranges).

**Steps:**
1. Open a project's Helpdesk → Settings → Holiday tab
2. Search by a known holiday's name, click **Apply Filters**
3. Click **Clear**

**Expected Result:**
- Search correctly narrows to the matching holiday(s)
- Clear resets the search box and restores the full unfiltered list
- **CONFIRMED LIVE 2026-08-24** (`flux-fudbk2hlu49`): Holiday's filter bar has **only** Search + Apply Filters + Clear — no Status (Active/Inactive) dropdown at all, unlike SLA/Support Level/Organization/Product. Consistent with Holiday having no Active/deactivate concept in this plugin.

---

## Negative Cases

---

### TC-HLP-098: A customer with no SLA on their project-access row gets no SLA at all

**User Role:** Agent
**Precondition:** A customer whose project-access row has no SLA selected.

**Steps:**
1. This customer raises a ticket; assign it

**Expected Result:**
- The ticket shows **No SLA** — there is no fallback to a project/global default for a customer-raised ticket (unlike agent-raised tickets, which do fall back)

---

### TC-HLP-099: Creating an SLA with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An SLA named "Standard" already exists.

**Steps:**
1. Attempt to create another SLA also named "Standard"

**Expected Result:**
- Save is refused with a clear duplicate-name message

---

### TC-HLP-100: Creating a support level with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A support level named "L1" already exists (names unique across the whole install).

**Steps:**
1. Attempt to create another support level also named "L1"

**Expected Result:**
- Save is refused with a clear duplicate-name message

---

### TC-HLP-101: Creating a support level with zero assignees is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create a new support level, leave Support assignees empty, attempt Save

**Expected Result:**
- Save is refused — at least one assignee is required

---

### TC-HLP-102: A user already on one support level cannot be added to another level in the same project

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** User X is an assignee on L1 of Project A.

**Steps:**
1. Create/edit L2 of Project A, open the assignee dropdown

**Expected Result:**
- User X is not offered — the dropdown excludes anyone already assigned to another level in the same project

---

### TC-HLP-103: Creating a holiday with a duplicate name is refused, even across different calendars

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A holiday named "Christmas Day" already exists.

**Steps:**
1. Attempt to create another holiday also named "Christmas Day" (e.g. intending it for a different calendar/year)

**Expected Result:**
- Save is refused — holiday names are unique across the **whole install**, not per calendar (must be disambiguated, e.g. "US Federal 2026 - Christmas Day")

---

## Edge Cases

---

### TC-HLP-104: Deactivating an SLA stops it being offered, but doesn't affect tickets already using it

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An SLA already in use on at least one ticket.

**Steps:**
1. Deactivate the SLA
2. Attempt to select it when creating a new customer project-access row
3. Check the existing ticket that already uses it

**Expected Result:**
- Step 2: the deactivated SLA is not offered
- Step 3: the existing ticket's SLA and deadlines are unaffected

---

### TC-HLP-105: Deactivating a support level stops it being offered and stops escalation into it

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** L2 in a chain L1→L2→L3, with L1 escalating to L2.

**Steps:**
1. Deactivate L2
2. Attempt to select L2 when creating/editing a customer's project-access row
3. Force an escalation scenario from L1

**Expected Result:**
- Step 2: L2 is not offered
- Step 3: escalation from L1 does not land on the deactivated L2 (behavior should be documented/observed precisely — record whatever actually happens, since the guide does not specify the exact fallback)

---

### TC-HLP-106: A second project's support-level assignee dropdown is independent of the first

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Support levels already created on Project A with their own assignees.

**Steps:**
1. Create a support level on Project B
2. Open its assignee dropdown

**Expected Result:**
- Project B's dropdown is populated with Project B's own members, entirely independent of Project A's assignments

---

### TC-HLP-107: A ticket outside SLA working hours/days does not consume SLA time

**User Role:** Agent
**Precondition:** An SLA with working hours 09:00–18:00 Mon–Fri; a ticket sitting assigned overnight or over a weekend with no action taken.

**Steps:**
1. Leave the ticket untouched from Friday 18:00 to Monday 09:00
2. Check the remaining time on the deadline at Monday 09:00

**Expected Result:**
- No SLA time was consumed during the non-working window — remaining time at Monday 09:00 equals remaining time at Friday 18:00

---

### TC-HLP-296: An SLA currently selected on a customer's project-access row cannot be silently deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer has a project-access row using this SLA (e.g. `alpha.customer` → Alpha Standard SLA).

**Steps:**
1. Go to the SLA list, attempt to delete the SLA that is currently selected on the customer's project-access row
2. If deletion is not blocked, re-open the customer's Edit form afterward and check the affected row

**Expected Result:**
- Deletion is refused (or requires explicit confirmation of consequences) with a clear message identifying the dependency — not a silent success or a crash
- If deletion is not blocked: the customer's project-access row should not be left pointing at a non-existent SLA with no indication anything changed

---

### TC-HLP-297: A Support Level currently selected on a customer's project-access row cannot be silently deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer has a project-access row using this Support Level (e.g. `beta.customer` → AB-L1).

**Steps:**
1. Go to the Support Level list, attempt to delete the Support Level that is currently selected on the customer's project-access row
2. If deletion is not blocked, re-open the customer's Edit form afterward and check the affected row

**Expected Result:**
- Deletion is refused (or requires explicit confirmation of consequences) with a clear message identifying the dependency — not a silent success or a crash
- If deletion is not blocked: the customer's project-access row should not be left pointing at a non-existent Support Level with no indication anything changed
- Also worth checking whether deleting a Support Level that other levels escalate into (per TC-HLP-092's chain) behaves the same way

---

## Evidence Map

- Case ID: TC-HLP-075 – TC-HLP-107, plus TC-HLP-276–278 (SLA/Support Level/Holiday list search & filter, added 2026-08-24), TC-HLP-296–297 (SLA/Support Level delete-while-linked-to-customer, added 2026-08-27 — mirrors TC-HLP-120's Organization version)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- SLA Status **badge** rendering (feature #20) — already covered in `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md`, not repeated here.
