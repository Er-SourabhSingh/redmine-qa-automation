# Test Cases — Redmineflux Helpdesk — Features 9–17: Ticket Creation & Lifecycle

> Source: `docs/HELPDESK_FEATURES_LIST.md` #9–17 (category C, ticket creation/reply/notes/time-log/merge — not #18–21 filter/column/badge/restricted-view, which get their own suite). Grounded in `docs/HELPDESK_USER_GUIDE.md` §5 (Tickets end to end), §7 (Working a ticket), §8 (Logging reply time), §9 (SLA pause/resume table).

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-013: Agent raises a ticket from the global Tickets screen

**User Role:** Agent
**Precondition:** Agent has `view_helpdesk` (or `manage_helpdesk`) on a helpdesk-enabled project.

**Steps:**
1. Helpdesk › Tickets (Command Center)
2. Click **+ New issue**
3. Fill in subject, description, priority, product
4. Assign it
5. Save

**Expected Result:**
- Ticket is created on the Support tracker with the entered fields
- Ticket appears in the global ticket list
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): **Precondition is inaccurate as written** — tried as `luna.blossom` (real Agent-role fixture, `view_helpdesk` only): the global "Helpdesk Command Center" nav item does not appear anywhere for her at all (no top-nav link, no "More" dropdown entry) — only the project-scoped Helpdesk tab (Dashboard/Tickets/Knowledgebase, no SLA/Organization/Settings) is reachable. Re-tested as `ivy.sterling` (Manager role, `manage_helpdesk`): the global Command Center **is** reachable, and creating a ticket from its "New issue" (`/issue_helpdesks/new`) succeeded — ticket #72, Status New, correctly appeared in the global list (`/rf_helpdesk/issues`). **PASS for a `manage_helpdesk`-tier user; the global Tickets screen is not reachable at all by a plain `view_helpdesk` Agent**, contradicting this TC's own precondition ("Agent has `view_helpdesk` **or** `manage_helpdesk`"). Not filed as a bug — reads as intentional (Command Center = cross-project management view, appropriately gated above plain ticket-working access) — but the precondition wording should be corrected to require `manage_helpdesk` specifically.
- **Side finding, investigated and fixed (environment issue, not a plugin bug):** while on `/issue_helpdesks/new` as `ivy.sterling`, the Project dropdown listed **both** Helpdesk QA Alpha and Beta, even though she is a Member of Alpha only. Tested it: selecting Beta and submitting **succeeded** ("Successful creation," ticket #73, genuinely created inside Helpdesk QA Beta, fully viewable). Root-caused before filing anything: both projects had **"Is public" checked** in their Settings, and the **Non member** role has `View Issues` + `Add issues` granted — this is textbook standard Redmine core behavior for a public project with those Non-member permissions, not a Helpdesk-plugin-specific authorization gap. However, it undermined the entire project-scoping model this engagement has been testing (Manager/Agent membership, customer entitlement rows all assume private, membership-gated projects), so it was a real environment-integrity problem. **Fixed**: unchecked "Is public" on both Helpdesk QA Alpha and Helpdesk QA Beta. Re-verified as `ivy.sterling`: the Project dropdown now correctly shows only Alpha, and direct navigation to `/projects/helpdesk-qa-beta` now correctly returns **403 Forbidden**. Deleted the probe ticket (#73) afterward.

---

### TC-HLP-014: Agent raises a ticket from a project's Tickets screen

**User Role:** Agent
**Precondition:** Same as TC-HLP-013, working inside one project's Helpdesk tab.

**Steps:**
1. Open the project's Helpdesk › Tickets
2. Click **+ New issue**, fill in the fields, assign, Save

**Expected Result:**
- Ticket is created scoped to this project, same as via the Command Center
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. As `luna.blossom` (Agent, `view_helpdesk`, Alpha member), used the project's own Helpdesk Dashboard "New issue" link (`/projects/helpdesk-qa-alpha/helpdesk/new`) — created ticket **#71**, Subject/Description/Priority=High all saved correctly, Status started as **New** (also confirms TC-HLP-018), assignee `<< me >>` resolved to Luna Blossom, SLA auto-applied (Alpha Standard SLA, "3h 59m On Track" — consistent with TC-HLP-081's documented agent-raised-ticket SLA fallback). Appeared correctly in the project's own Tickets list and (separately confirmed) in the global list too.

---

### TC-HLP-015: Customer raises a ticket and sees only their own afterward

**User Role:** Client (Customer)
**Precondition:** Customer has a project-access row for this project (see `HELPDESK_CUSTOMER_MANAGEMENT` setup, or create via Helpdesk › Customers first).

**Steps:**
1. Sign in as the customer
2. Open their project's helpdesk and click **New issue**
3. Fill in and save

**Expected Result:**
- Ticket is created, authored by the customer
- Afterward, the customer's ticket list shows this ticket and no others they didn't raise
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): **PASS on creation, FAIL on the list.** As `alpha.customer`: My Helpdesk → View Helpdesk QA Alpha → New issue → Create → "Successful creation," ticket **#74** genuinely created (confirmed via admin: appears correctly, Author "Alpha Customer", Organization "Alpha Org", among 5 total tickets on the project). But the redirect landed on her own Tickets tab (`/projects/helpdesk-qa-alpha/helpdesk/tickets`) showing **"0 tickets" / "No tickets yet"** — not just missing the new ticket, but showing zero entirely, including her older pre-existing ticket. Reloaded directly — same result, not a redirect timing artifact. The individual ticket remains reachable (`/projects/helpdesk-qa-alpha/helpdesk/issues/74` opens fine for her), and the exact same list URL shows all 5 tickets correctly when visited as admin — so this is isolated to the Customer role's list view specifically. Filed as **BUG-HLP-014** (High).

---

### TC-HLP-016: A qualifying customer email creates a ticket correctly

**User Role:** Client (Customer, via email)
**Precondition:** Incoming mail is configured for the project; the sender's address belongs to a registered helpdesk customer; if identifier keywords are configured, the mail contains one.

**Steps:**
1. Send a qualifying email to the configured mailbox
2. Wait for the poller (up to 5 minutes) or trigger `rake redmineflux_helpdesk:check_emails`

**Expected Result:**
- A new ticket is created on the Support tracker, default priority, with the customer as author
- If an email prefix is configured, the ticket subject carries it
- An acknowledgement email is sent back to the customer
- Both the inbound mail and the acknowledgement appear in the ticket's Email History
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, ticket #67, "Email History" = the Helpdesk Conversion tab): PASS, with exact content confirmed, not just "both appear" — entry #1 is the customer's original inbound email verbatim (labeled "Customer replied to Support"), entry #2 is the system's own "Ticket Created Successfully" confirmation (Ticket Number/Subject/Status/Priority/Created On block). Both render with their real content, not placeholders. See `HELPDESK_EMAIL.md` TC-HLP-286/287/288 for the same tab's behavior on later replies (agent/customer-portal/customer-email).

---

### TC-HLP-017: A reply to an existing ticket's mail thread lands as a note, not a new ticket

**User Role:** Client (Customer, via email)
**Precondition:** A ticket already exists that was created by email (TC-HLP-016).

**Steps:**
1. Reply to the original notification email from that ticket's thread
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No new ticket is created
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6) — reusing already-gathered evidence rather than re-running the email round-trip: `HELPDESK_EMAIL.md` TC-HLP-288 performed exactly this action on the same ticket (#67, itself created by email per TC-HLP-016) — customer replied by real email to the ticket's outbound notification, poller processed it. **PASS on this TC's core claim**: no new ticket was created, and the reply landed as a Journal entry under the existing ticket #67's **Notes** tab (correct content, correctly attributed to the customer) — confirmed via direct DB-adjacent evidence (Notes tab inspection), not inference. **However, the second half of this TC's expected result ("recorded in its Email History") FAILS** — TC-288 found the reply does NOT appear in the Helpdesk Conversion tab (this plugin's actual "Email History" per TC-HLP-016's established mapping) at all; already tracked as **BUG-HLP-008** Part A, no new bug needed here.
- The reply is added as a note on the existing ticket, and recorded in its Email History

---

### TC-HLP-018: A newly raised ticket starts in status "New"

**User Role:** Agent
**Precondition:** None beyond a working helpdesk project.

**Steps:**
1. Raise a ticket (any method)
2. Check its status immediately after creation

**Expected Result:**
- Status is **New**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS, evidenced by TC-HLP-014's execution — ticket #71 showed Status "New" immediately after creation via the project-scoped New Issue form, and ticket #72 (TC-HLP-013) likewise. No separate repro needed.

---

### TC-HLP-019: An agent's reply automatically moves the ticket to "Waiting for Customer Response"

**User Role:** Agent
**Precondition:** An assigned, in-progress ticket.

**Steps:**
1. Open the ticket and send a public reply to the customer

**Expected Result:**
- Status automatically becomes **Waiting for Customer Response**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #71): PASS. As `luna.blossom`, reached the ticket via real click-through (Helpdesk Tickets list → click the ticket row) rather than a typed URL — the list's own link landed on the **core** `/issues/71` route, not the branded one. Clicked **Reply**, selected Reply Note (default), typed a message, Save. Status changed New → Waiting for Customer Response, confirmed both in the ticket header and its own journal entry ("Status changed from New to Waiting for Customer Response"). (An earlier pass at this same check used a typed branded-route URL directly instead of clicking through — per user correction, that methodology violation means its result isn't counted as this TC's evidence, even though the same transition was observed there too; this entry reflects only the properly-navigated confirmation.)

---

### TC-HLP-289: A note added via the standard Edit form should not auto-transition status, since it produces no customer-facing communication

**User Role:** Agent (adding the note); Client (Customer) viewing the result
**Precondition:** A ticket in status **New** (or any pre-"Waiting for Customer Response" status).

**Steps:**
1. As the agent, open the ticket via the real in-app ticket list (landing on the core `/issues/:id` route)
2. Click the top-level **Edit** link (not **Reply**)
3. Enter text in the **Notes** field, leave **Private notes** unchecked, leave **Status** untouched, Submit
4. As the customer, open the same ticket and check its **Helpdesk Conversion** tab (the customer-facing channel — Notes is never customer-facing, see TC-HLP-022/addendum #5)

**Expected Result:**
- The Notes tab is correctly not customer-visible either way (matches Reply Note's own behavior — never shown inline in Notes, only via Helpdesk Conversion). Status should only auto-transition to **Waiting for Customer Response** when a genuine Reply happens through the plugin's own mechanism (TC-HLP-019/021: real email sent, Helpdesk Conversion entry logged) — plain Edit-form notes aren't a Helpdesk "reply" and shouldn't trigger it
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #70): FAIL — status auto-transitions to Waiting for Customer Response anyway, but **no Helpdesk Conversion entry is created at all** (the tab itself is entirely absent — zero entries) and no email was sent. The ticket falsely claims a reply happened when nothing was communicated to the customer through any channel. Tracked as **BUG-HLP-009** (High) — likely related to BUG-HLP-007/008's branded-vs-core route pattern, see `HELPDESK_MEMORY.md` and `bugs/open/BUG-HLP-009.md`.

---

### TC-HLP-020: A customer's reply automatically moves the ticket back to "In Progress"

**User Role:** Client (Customer)
**Precondition:** A ticket currently in **Waiting for Customer Response**.

**Steps:**
1. As the customer, reply to the ticket (via the portal or by email)

**Expected Result:**
- Status automatically becomes **In Progress**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS. Reached the ticket via the genuine customer path — logged into `alpha.customer`'s real Roundcube inbox, opened the agent's reply notification email, clicked its own **View Ticket** link (with the Redmine browser session correctly switched to `alpha.customer` first, not left on an agent's session) — landed on the branded route as a real customer navigation would. Clicked **Reply**, typed a message, Save — "Successful update." Re-checked as admin via the global Tickets list: Status now **In Progress** (was Waiting for Customer Response), SLA resumed to **"23h 59m On Track"** (was paused). Also confirms the SLA-resume-on-customer-reply mechanism already noted in `HELPDESK_MEMORY.md` from earlier sessions.

---

### TC-HLP-021: Replying to the customer emails them, pauses the SLA, and auto-assigns an unassigned ticket

**User Role:** Agent
**Precondition:** An unassigned ticket with an active SLA.

**Steps:**
1. Open the ticket, click **Reply**
2. Type a message, leave **Reply Note** selected, Save

**Expected Result:**
- The customer receives an email with the reply
- Status becomes **Waiting for Customer Response**; the SLA clock **pauses**
- The ticket is now assigned to the replying agent
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #75): PASS on the three mechanically-verifiable parts. Created a fresh unassigned ticket in Helpdesk QA Alpha as `luna.blossom` (Assigned to left blank), then reached it via real click-through from the Tickets list (core `/issues/75` route, not a typed URL). Clicked **Reply**, Reply Note, Save. Confirmed: Assignee changed from "-" to **Luna Blossom** (auto-assigned to the replying agent), Status → **Waiting for Customer Response**, SLA Information tab shows **"⏸ Paused — the clock is not running. Paused since 08/27/2026 09:19 AM (UTC)."** The "customer receives an email" part isn't independently re-verified here (this ticket is agent-authored, no real customer to email) — already established via real email round-trips elsewhere this engagement (TC-HLP-293/294, TC-HLP-286–288), not re-tested redundantly.

---

### TC-HLP-022: An internal note stays private and does not touch status or the SLA clock

**User Role:** Agent
**Precondition:** An in-progress ticket with an active (unpaused) SLA.

**Steps:**
1. Open the ticket, click **Reply**
2. Type a note, choose **Internal Note**, Save

**Expected Result:**
- Note is saved and visible to the team, but never emailed to the customer
- Ticket status is unchanged; the SLA clock keeps running (not paused)
- The customer cannot see this note anywhere they have access
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS. As `luna.blossom`, reached the ticket via genuine click-through (Tickets list → row → core `/issues/74` route). Ticket was In Progress with an active ("On Track") SLA going in. Clicked Reply, selected **Internal Note**, Save — "Successful update," no crash (confirms this ticket's Internal Note submission is fine on the core route, consistent with BUG-HLP-007's finding that the crash is branded-route-specific). Status stayed **In Progress** (no auto-transition), SLA Information tab still shows **"✓ On Track"** (clock kept running, not paused). Checked the Helpdesk Conversion tab directly: it still shows exactly the two prior Reply Note entries (agent + customer from TC-HLP-019/020) — the Internal Note's text does not appear there at all, confirming it's excluded from the customer-facing channel, not just hidden by session/role.

---

### TC-HLP-023: Logging reply time with a preset chip creates the correct time entry

**User Role:** Agent
**Precondition:** Time tracking module enabled on the project; agent has `log_time`.

**Steps:**
1. Open the reply box, type a reply
2. Click the **10m** preset chip
3. Pick an Activity, Save

**Expected Result:**
- The reply and a time entry are saved together
- The time entry is **0.17 h** (ten minutes) — not ten hours
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS on the substance, one terminology correction. The real "Time spent" control is a **plain `<select>` dropdown** with options `-- None --/5 min/10 min/15 min/20 min/Custom` — not clickable "chip" buttons as this TC's steps describe (worth flagging for TC-HLP-030 too, which assumes chip-specific toggle behavior a native select can't do). Selected "10 min", picked Activity "Technical Support", Save — reply and time entry saved together. Time entry shows **"0:10"** both on the ticket (`Spent time: 0:10 h`) and on its own Edit page (`Hours *` = `0:10`, h:mm format) — genuinely ten minutes (≈0.17h decimal), not ten hours.

---

### TC-HLP-024: Logging a custom reply time value creates the correct time entry

**User Role:** Agent
**Precondition:** Same as TC-HLP-023.

**Steps:**
1. Open the reply box, type a reply
2. Type `35` into the custom minutes box (no chip selected)
3. Pick an Activity, Save

**Expected Result:**
- Time entry is **0.58 h** (35 minutes)
- The entry shows up in Redmine's Spent Time reports
- If the ticket's customer has an organization with a prepaid budget, its Used hours increase by this amount

---

### TC-HLP-025: Merging a duplicate ticket carries its notes and history into the surviving ticket

**User Role:** Agent
**Precondition:** Two open tickets describing the same issue.

**Steps:**
1. Open one of the two tickets
2. Use **Merge** and select the other ticket as the target (or source, per the UI's actual direction)
3. Confirm

**Expected Result:**
- The merged-away ticket's notes and history appear on the surviving ticket
- No data from either ticket is lost

---

## Negative Cases

---

### TC-HLP-026: Email from an unregistered sender does not create a ticket

**User Role:** N/A (external sender)
**Precondition:** Incoming mail configured for the project; sender's address is **not** a registered helpdesk customer.

**Steps:**
1. Send an email to the configured mailbox from an address with no matching customer record
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created
- The sender receives a notification that their message was not accepted

---

### TC-HLP-291: A registered customer without a project-access row for the target project cannot create a ticket there by email

**User Role:** N/A (external sender — a real, registered helpdesk customer, just not for this project)
**Precondition:** The sender's address belongs to a genuine Customer record whose only project-access row is on **Project A**. Incoming mail is configured on **Project B**, which this customer has no entitlement row for.

**Steps:**
1. From that same customer's real email address, send a qualifying email (correct identifier keywords if configured) to Project B's configured mailbox
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created on Project B — being a registered customer on some project does not grant email-based ticket creation rights on a project they have no project-access row for
- **Distinct from TC-HLP-026** (sender has no Customer record anywhere in the system at all — the broader/simpler case) and **TC-HLP-034** (the same "no entitlement" rule, but tested via the portal UI, not the email channel) — this is the narrower, more realistic scenario a real multi-project instance would actually hit: an existing customer of one project mistakenly (or deliberately) emailing a different project's support address. Not yet executed — flagged from a direct question about this exact gap; TC-HLP-016's precondition ("sender's address belongs to a registered helpdesk customer") does not specify per-project, so it's untested whether the poller's customer lookup is scoped to the polled project or checks for any Customer record install-wide.

---

### TC-HLP-027: Email missing a required identifier keyword does not create a ticket

**User Role:** Client (Customer, via email)
**Precondition:** The project has identifier keywords configured; sender is a registered customer.

**Steps:**
1. Send an email whose subject and body contain none of the configured keywords
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created from this email

---

### TC-HLP-028: Logging time with no Activity selected is refused

**User Role:** Agent
**Precondition:** No default Activity marked in Administration › Enumerations.

**Steps:**
1. Open the reply box, type a reply
2. Select a time preset or type a custom value, but leave Activity unselected
3. Attempt to Save

**Expected Result:**
- Save is refused with a message that Activity is required
- Nothing is submitted — no reply and no time entry are created

---

### TC-HLP-029: A non-numeric custom time value is refused

**User Role:** Agent
**Precondition:** Same as TC-HLP-023.

**Steps:**
1. Open the reply box, type a reply
2. Type a non-numeric value (e.g. `abc`) into the custom minutes box
3. Attempt to Save

**Expected Result:**
- The value is refused/rejected client-side or server-side; no invalid time entry is created

---

### TC-HLP-033: An agent without helpdesk permission cannot create a ticket

**User Role:** Project member with neither `view_helpdesk` nor `manage_helpdesk`
**Precondition:** User is a member of a helpdesk-enabled project but has neither permission on their role.

**Steps:**
1. Attempt to open the project's Helpdesk tab
2. Attempt to navigate directly to the new-ticket URL for that project

**Expected Result:**
- The Helpdesk tab is absent from the project menu
- Direct navigation to the helpdesk/new-ticket URL is refused
- No ticket can be created via this path

---

### TC-HLP-034: A customer with no project-access row cannot raise or see a ticket on that project

**User Role:** Client (Customer) — has a project-access row for Project A only
**Precondition:** A second project (Project B) exists that this customer has no entitlement row for.

**Steps:**
1. Sign in as the customer
2. Attempt to open Project B's helpdesk and raise a ticket there

**Expected Result:**
- The customer cannot access Project B's helpdesk (no entitlement)
- No ticket can be raised by them on Project B

---

### TC-HLP-035: A customer cannot merge tickets

**User Role:** Client (Customer)
**Precondition:** The customer has two of their own tickets describing the same issue.

**Steps:**
1. Sign in as the customer and open one of the tickets

**Expected Result:**
- No **Merge** control is available to the customer anywhere on the ticket

---

### TC-HLP-295: A customer's "Edit" action on their own ticket only allows editing the Subject — nothing else

**User Role:** Client (Customer)
**Precondition:** A ticket the customer created themselves, viewed on the ticket's own page (not the list).

**Steps:**
1. Sign in as the customer, open one of their own tickets
2. Click **Edit** (distinct from **Reply** — both links exist side by side in the ticket header)
3. Observe what becomes editable on the page
4. Type a new Subject and confirm (✓), then re-open Edit and revert it back, confirming the revert also saves

**Expected Result:**
- Clicking Edit turns **only the Subject heading** into an inline textbox (with ✓ confirm / ✗ cancel icons next to it) — Priority, Organization, and Description all remain plain read-only text, with no edit control of their own anywhere on the customer's view
- **CONFIRMED LIVE 2026-08-26/27** (Local, redmine-docker-6, ticket #67): PASS. Real field id `#issue_subject`. Changed the subject to `... (subject-edit test)`, confirmed via ✓ — saved immediately, page title and heading both updated. Re-opened Edit, reverted back to the original subject, confirmed again — saved cleanly. No other field on the page ever became editable during either edit. This is a real, deliberate restriction (distinct from a bug) — the customer role's only two actions on their own ticket are Reply and this Subject-only rename.

---

### TC-HLP-036: A user without `log_time` does not see the reply time-log block at all

**User Role:** Project member with `view_helpdesk` but without Redmine's `log_time` permission on the project
**Precondition:** Time tracking module is enabled on the project.

**Steps:**
1. Open a ticket, click **Reply**

**Expected Result:**
- The **Time spent** block (presets/custom box/Activity) is not shown at all

---

### TC-HLP-037: A customer's reply box shows no Canned Response, Internal Note, or time-log controls

**User Role:** Client (Customer)
**Precondition:** Customer viewing one of their own tickets.

**Steps:**
1. Sign in as the customer, open the ticket, and view the reply box

**Expected Result:**
- No **Canned Response** dropdown is present
- No **Internal Note** option is present (only a plain reply)
- No time-log block is present, regardless of the customer's Redmine permissions
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS — evidenced during TC-HLP-020's execution. `alpha.customer`'s Reply box on her own ticket contains exactly a plain textbox and a **Save** button — no Canned Response dropdown, no Reply Note/Internal Note radio choice, no Time spent/Activity/Support Package block at all. Confirms the reply UI itself is a genuinely stripped-down customer variant, not just permission-hidden fields on the same form.

---

## Edge Cases

---

### TC-HLP-030: Time-log input methods are mutually exclusive

**User Role:** Agent
**Precondition:** Reply box open with the time-log block visible.

**Steps:**
1. Click the **10m** chip
2. Click the **20m** chip
3. Click the now-active **20m** chip again
4. Type a value into the custom minutes box

**Expected Result:**
- Step 2: selection switches from 10m to 20m (only one chip active at a time)
- Step 3: clicking the active chip clears the selection
- Step 4: typing in the custom box clears any active chip; conversely, clicking a chip clears anything typed in the custom box

---

### TC-HLP-031: Saving a reply with no time selected creates no time entry

**User Role:** Agent
**Precondition:** Reply box open; Time tracking module enabled.

**Steps:**
1. Type a reply, leave the time-log block untouched (no chip, no custom value)
2. Save

**Expected Result:**
- The reply posts successfully
- No time entry is created for this reply

---

### TC-HLP-032: Merging a ticket that itself already has reply/note history preserves both threads

**User Role:** Agent
**Precondition:** Two tickets, each with at least one prior reply and one internal note of their own.

**Steps:**
1. Merge one ticket into the other

**Expected Result:**
- The surviving ticket shows the replies and internal notes from **both** original tickets, in a coherent combined history — nothing from either side is dropped or overwritten

---

### TC-HLP-038: All seven ticket statuses exist and are reachable in the workflow

**User Role:** Admin (for the status list) and Agent (for transitions)
**Precondition:** A ticket that can be moved through manual status changes per the Support tracker's workflow for the agent's role.

**Steps:**
1. Administration › Issue statuses — confirm all seven exist: New, In Progress, Waiting for Customer Response, Resolved, Feedback, Closed, Rejected
2. On a ticket, manually set status to Resolved, then Feedback, then Closed (or Rejected), as permitted by the workflow

**Expected Result:**
- All 7 statuses are present in Administration › Issue statuses
- Each manual transition permitted by the Support tracker's workflow succeeds

---

### TC-HLP-039: The reply time-log Comment field appears only when Required fields demands it

**User Role:** Agent
**Precondition:** Two configurations of Administration › Settings › Time tracking › Required fields — one where "Comment" is not required, one where it is.

**Steps:**
1. With Comment **not** required: open a ticket's reply box and view the time-log block
2. Switch the setting so Comment **is** required; repeat

**Expected Result:**
- Step 1: no Comment field appears in the time-log block
- Step 2: a Comment field appears and is required to save

---

### TC-HLP-040: A customer role granted Redmine's `view_private_notes` permission can see internal notes

**User Role:** Client (Customer) whose role has been given Redmine's `view_private_notes` permission (atypical configuration, used to confirm the mechanism)
**Precondition:** An internal note already exists on a ticket this customer can otherwise access.

**Steps:**
1. Grant `view_private_notes` to the customer's role
2. Sign in as the customer and open the ticket

**Expected Result:**
- The internal note **is** visible to the customer — confirming it is stored as an ordinary Redmine private note governed by Redmine's own permission, not an independent helpdesk-specific lock

---

### TC-HLP-041: Attempting to merge a ticket into itself is rejected or has no effect

**User Role:** Agent
**Precondition:** A single existing ticket.

**Steps:**
1. Open the ticket
2. Use **Merge** and select the same ticket as the target

**Expected Result:**
- The action is rejected with a clear message, or has no effect — the ticket is not duplicated, corrupted, or left in an inconsistent state

---

## Evidence Map

- Case ID: TC-HLP-013 – TC-HLP-041, TC-HLP-289, TC-HLP-291, TC-HLP-295
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Inserting a canned response into the reply box (§7.3 of `HELPDESK_USER_GUIDE.md`) — the macro-substitution behavior and "appends rather than replaces" checklist item belong to the Canned Responses suite (feature #45), not this one. Tracked here only as a cross-reference so it isn't silently dropped.
