# Test Cases — Redmineflux Helpdesk — Features 9–17: Ticket Creation & Lifecycle

> Source: `docs/HELPDESK_FEATURES_LIST.md` #9–17 (category C, ticket creation/reply/notes/time-log/merge — not #18–21 filter/column/badge/restricted-view, which get their own suite). Grounded in `docs/HELPDESK_USER_GUIDE.md` §5 (Tickets end to end), §7 (Working a ticket), §8 (Logging reply time), §9 (SLA pause/resume table).

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

## Navigation methodology (applies to every TC below, not just ones that spell it out)

Wherever a step says to "open the ticket" (to verify fields after creation, to reply, to check status, etc.), reach it by clicking the ticket's own **Ticket #** or **Subject** link in whatever list/page is currently displayed — never a typed/direct URL, and never assume the branded and core routes are interchangeable (they render/behave differently for several known reasons, e.g. BUG-HLP-007's branded-route-only crash). This applies to every role (Agent, Customer, Admin), including when you already know the ticket ID from having just created it.

---

## Positive Cases

---

### TC-HLP-365: Agent raises a ticket from the global Tickets screen

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
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, fully rebuilt environment — all fixtures above no longer exist post-DB-reset, this is a from-scratch re-run): precondition correction still holds. As `luna.blossom` (Agent, `view_helpdesk` only): no Command Center nav item, no "More" dropdown entry. As `admin` (definitely `manage_helpdesk`-tier): Command Center → New issue (`/issue_helpdesks/new`) → created ticket **#5**, appeared correctly in the global list (`/rf_helpdesk/issues`) immediately after. PASS, same shape as the original finding.

---

### TC-HLP-366: Agent raises a ticket from a project's Tickets screen

**User Role:** Agent
**Precondition:** Same as TC-HLP-365, working inside one project's Helpdesk tab.

**Steps:**
1. Open the project's Helpdesk › Tickets
2. Click **+ New issue**, fill in the fields, assign, Save
3. To verify the created ticket's fields, open it by clicking its **Ticket #** or **Subject** link in the list the Save redirected to — never a typed/direct URL, even as the agent who just created it

**Expected Result:**
- Ticket is created scoped to this project, same as via the Command Center
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. As `luna.blossom` (Agent, `view_helpdesk`, Alpha member), used the project's own Helpdesk Dashboard "New issue" link (`/projects/helpdesk-qa-alpha/helpdesk/new`) — created ticket **#71**, Subject/Description/Priority=High all saved correctly, Status started as **New** (also confirms TC-HLP-371), assignee `<< me >>` resolved to Luna Blossom, SLA auto-applied (Alpha Standard SLA, "3h 59m On Track" — consistent with TC-HLP-293's documented agent-raised-ticket SLA fallback). Appeared correctly in the project's own Tickets list and (separately confirmed) in the global list too.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, fully rebuilt environment, from-scratch re-run): PASS on the core claim. Clicked through Projects → Helpdesk QA Alpha → Helpdesk tab → New issue, created ticket **#6** (Priority=High). Verified via genuine click-through only (Helpdesk Tickets list → click Subject link, landing on the core `/issues/6` route) — Status **New** (also reconfirms TC-HLP-371), Priority **High**, correctly appeared in the project's own Tickets list. **One deviation from the original evidence**: Assignee stayed **"-"** (unassigned) rather than auto-resolving to `<< me >>` — the New issue form on this build has no visible Assignee field to set in the first place (only Subject/Description/Priority/Product), so there was nothing to select "assign to me" from; not filed as a bug since the TC's own core expected result (project-scoped creation) is unaffected, but worth a follow-up look at whether an Assignee field is supposed to be on this form.

---

### TC-HLP-367: Customer raises a ticket and sees only their own afterward

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
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, full PASS — regression check for closed BUG-HLP-014): As `alpha.customer`, clicked through My Helpdesk → View Helpdesk QA Alpha → New issue, filled Subject/Description, clicked Create → "Successful creation," ticket **#7** genuinely created (author alpha.customer). Redirect landed on `/projects/helpdesk-qa-alpha/helpdesk/tickets`, which correctly showed **"4 tickets" / (1-4/4)**: the new #7, plus her three pre-existing tickets #2, #3, #4 — no zero-count regression, no missing rows, no tickets belonging to other users (e.g. admin's #5 or luna.blossom's #6 were correctly absent). BUG-HLP-014's original defect does not reproduce; the fix holds.

---

### TC-HLP-368: A qualifying customer email creates a ticket correctly

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
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, ticket #67, "Email History" = the Helpdesk Conversion tab): PASS, with exact content confirmed, not just "both appear" — entry #1 is the customer's original inbound email verbatim (labeled "Customer replied to Support"), entry #2 is the system's own "Ticket Created Successfully" confirmation (Ticket Number/Subject/Status/Priority/Created On block). Both render with their real content, not placeholders. See `HELPDESK_EMAIL.md` TC-HLP-073/287/288 for the same tab's behavior on later replies (agent/customer-portal/customer-email).
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, full PASS): Sent a real email as `alpha.customer` via Roundcube webmail (`http://127.0.0.1:8081/`) to `alpha.support@test.local`, subject `Ticket: TC-HLP-368 fresh email creates a new ticket` (contains the configured identifier keyword "ticket" — confirmed beforehand via Helpdesk Settings → Email Configuration → Helpdesk QA Alpha: Identifier Keywords = `ticket, issue, request`, Email Subject Prefix = blank, so no prefix was expected on this run). Triggered `Helpdesk::EmailPollerWorker.new.perform` manually via `rails runner` instead of waiting on Sidekiq's cron. Server log confirms clean processing: registered customer recognized, keyword match, ticket **#8** created (Support tracker, Priority Normal, Author Alpha Customer), confirmation email queued. Verified via genuine click-through (Helpdesk Command Center → Helpdesk Tickets → ticket #8): Status New, Customer "Alpha Customer" linked correctly, Description matches the sent email body. Helpdesk Conversion (2) tab shows exactly the same two-entry shape as the original 2026-08-26 evidence — entry #1 "Customer replied to Support #1" (the inbound email), entry #2 "Ticket Created Successfully" with Subject/Status/Priority/Created On block, both with real content.

---

### TC-HLP-369: A reply to an existing ticket's mail thread lands as a note, not a new ticket

**User Role:** Client (Customer, via email)
**Precondition:** A ticket already exists that was created by email (TC-HLP-368).

**Steps:**
1. Reply to the original notification email from that ticket's thread
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No new ticket is created
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6) — reusing already-gathered evidence rather than re-running the email round-trip: `HELPDESK_EMAIL.md` TC-HLP-075 performed exactly this action on the same ticket (#67, itself created by email per TC-HLP-368) — customer replied by real email to the ticket's outbound notification, poller processed it. **PASS on this TC's core claim**: no new ticket was created, and the reply landed as a Journal entry under the existing ticket #67's **Notes** tab (correct content, correctly attributed to the customer) — confirmed via direct DB-adjacent evidence (Notes tab inspection), not inference. **However, the second half of this TC's expected result ("recorded in its Email History") FAILS** — TC-288 found the reply does NOT appear in the Helpdesk Conversion tab (this plugin's actual "Email History" per TC-HLP-368's established mapping) at all; already tracked as **BUG-HLP-008** Part A, no new bug needed here.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, full PASS on BOTH halves — regression check for closed BUG-HLP-008): Replied by real threaded email as `alpha.customer` (via Roundcube, clicked the ticket #8 confirmation email's own **Reply** button, so headers/References/In-Reply-To are genuine, not hand-typed) to the outbound "Ticket Created Successfully" notification from TC-HLP-368. Triggered the poller manually. Server log this time shows a clean sequence — `MailHandler: issue #8 updated by Alpha Customer` → `Successfully saved email history for issue #8` → `Added reply to ticket #8` — with **no** `MailHandler returned unexpected result: Journal` warning (the exact symptom closed BUG-HLP-008 was about). Verified via UI: still only ticket #8 (no new ticket created), Status auto-transitioned New → In Progress (bonus confirmation of TC-HLP-374's own behavior), the reply appears as Journal #1 on the History tab, and — the previously-failing half — **Helpdesk Conversion now shows (3)** entries: #1 original inbound mail, #2 "Ticket Created Successfully" confirmation, #3 this new reply ("Customer replied to Support #3", correct content, correctly attributed). BUG-HLP-008's original defect does not reproduce; the fix holds.
- The reply is added as a note on the existing ticket, and recorded in its Email History

---

### TC-HLP-370: An email-created ticket lands under the correct project for a customer entitled to multiple projects (added 2026-09-09, user-identified gap)

**User Role:** Client (Customer, via email)
**Precondition:** A customer with project-access rows on **two** different Helpdesk-enabled projects (e.g. Helpdesk QA Alpha and Helpdesk QA Beta), each project with its own distinct, working incoming mailbox configured. The customer's Alpha and Beta rows may carry different SLA/Support Level/Organization values, but both must be real, valid entitlements — not one blocked/missing.

**Steps:**
1. As the customer, send a qualifying email specifically to **Beta's** configured incoming mailbox (not Alpha's)
2. Wait for the poller / trigger `check_emails`
3. Once a ticket is created, check which **project** it was actually created under

**Expected Result:**
- The ticket is created under **Helpdesk QA Beta** — the project whose mailbox actually received the email — not Alpha, regardless of the customer's own project-access rows or which project she has more/first entitlement to.

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, `beta.customer` via Roundcube webmail, `Helpdesk::EmailPollerWorker`, real per-project mailboxes): **FAIL — filed as BUG-HLP-045.** Built the missing infrastructure first: gave Helpdesk QA Beta a real, working Email Configuration (SMTP+IMAP via `beta.support@test.local`, matching Alpha's existing setup — Beta previously had zero email config at all), and registered a new customer `beta.customer` with **two** project-access rows — Alpha created first (Alpha Standard SLA / L1 / Alpha Minimal Fields Test Org), Beta created second (Beta Standard SLA / AB-L1). As `beta.customer`, sent a qualifying email specifically to `beta.support@test.local` (Beta's own mailbox, not Alpha's). Server log confirmed the poller correctly identified Beta's mailbox (`Checking emails for project [helpdesk-qa-beta]`) but `MailHandler` then substituted Alpha anyway (`Found helpdesk project [helpdesk-qa-alpha] for customer [beta.customer]`). First attempt was additionally blocked by an unrelated, coincidental prepaid-hours-exhausted condition on Alpha (leftover from earlier same-day testing) — topped up Alpha's budget via the real UI and resent, ruling out that confound: the ticket (**#62**) was created cleanly, and is confirmed live under **Helpdesk QA Alpha** (page title, Organization field, and outbound SMTP account all show Alpha) despite never having been sent to Alpha's mailbox at all. Root-caused via source: `mail_handler_patch.rb#target_project_with_helpdesk` takes the customer's **first** `RfProjectCustomer` row unconditionally, discarding the poller's own correct signal of which project's mailbox was actually being checked. New reusable fixtures: Beta's Email Configuration and customer `beta.customer` (id 32) — see `HELPDESK_USERS_AND_CUSTOMERS.md` for full detail.

**Follow-up control, same day**: user asked directly whether a **Beta-only** customer (no Alpha entitlement at all) emailing Beta's mailbox correctly lands on Beta — isolating whether the bug is specific to multi-project entitlement, or whether it's a more fundamental "always defaults to Alpha" defect. Temporarily removed `beta.customer`'s Alpha row (leaving her Beta-only), sent a fresh email to `beta.support@test.local`. Server log this time: `MailHandler: Found helpdesk project [helpdesk-qa-beta] for customer [beta.customer]` — correct. Ticket **#63** confirmed live under **Helpdesk QA Beta** (page title, outbound confirmation via Beta's own SMTP). **Confirms the defect is specifically about multi-project entitlement** — a single-project customer routes correctly (trivially, since her only row is also her "first" row); the bug only manifests once a customer has 2+ project-access rows and the mailbox actually polled isn't whichever one happens to be first. Restored `beta.customer`'s Alpha row afterward (both rows now present again, though — worth noting for anyone reusing this fixture — Beta is now her lower-ID/first-created row, Alpha the newly re-added second, the reverse of the original 2026-09-09 setup; see `HELPDESK_USERS_AND_CUSTOMERS.md`).

---

### TC-HLP-371: A newly raised ticket starts in status "New"

**User Role:** Agent
**Precondition:** None beyond a working helpdesk project.

**Steps:**
1. Raise a ticket (any method)
2. Check its status immediately after creation

**Expected Result:**
- Status is **New**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS, evidenced by TC-HLP-366's execution — ticket #71 showed Status "New" immediately after creation via the project-scoped New Issue form, and ticket #72 (TC-HLP-365) likewise. No separate repro needed.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset): PASS, evidenced by this session's own re-runs — ticket #5 (TC-HLP-365, global Command Center), #6 (TC-HLP-366, project-scoped form), and #8 (TC-HLP-368, created by email) all showed Status "New" immediately after creation, across all three creation methods. No separate repro needed.

---

### TC-HLP-372: An agent's reply automatically moves the ticket to "Waiting for Customer Response"

**User Role:** Agent
**Precondition:** An assigned, in-progress ticket.

**Steps:**
1. Open the ticket and send a public reply to the customer

**Expected Result:**
- Status automatically becomes **Waiting for Customer Response**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #71): PASS. As `luna.blossom`, reached the ticket via real click-through (Helpdesk Tickets list → click the ticket row) rather than a typed URL — the list's own link landed on the **core** `/issues/71` route, not the branded one. Clicked **Reply**, selected Reply Note (default), typed a message, Save. Status changed New → Waiting for Customer Response, confirmed both in the ticket header and its own journal entry ("Status changed from New to Waiting for Customer Response"). (An earlier pass at this same check used a typed branded-route URL directly instead of clicking through — per user correction, that methodology violation means its result isn't counted as this TC's evidence, even though the same transition was observed there too; this entry reflects only the properly-navigated confirmation.)
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #8, In Progress → Waiting for Customer Response): PASS. As `luna.blossom`, reached the ticket via full genuine click-through (Projects → Helpdesk QA Alpha → Helpdesk tab → Helpdesk Tickets → click the ticket's own Subject link), landing on the core `/issues/8` route. Clicked **Reply**, Reply Note was already selected by default, typed a message, Save. Ticket header now shows Status **Waiting for Customer Response**. As previously established (BUG-HLP-009/BUG-HLP-015 retests), a Reply Note does not itself appear in the core History/Notes tab — it's correctly logged only in **Helpdesk Conversion**, which went (3)→(4) with the new entry "Luna Blossom (via Reply Note) ... A new note has been added" carrying the exact reply text. Same transition, same tab-split behavior as the original 2026-08-27 evidence.

---

### TC-HLP-373: A note added via the standard Edit form should not auto-transition status, since it produces no customer-facing communication

**User Role:** Agent (adding the note); Client (Customer) viewing the result
**Precondition:** A ticket in status **New** (or any pre-"Waiting for Customer Response" status).

**Steps:**
1. As the agent, open the ticket via the real in-app ticket list (landing on the core `/issues/:id` route)
2. Click the top-level **Edit** link (not **Reply**)
3. Enter text in the **Notes** field, leave **Private notes** unchecked, leave **Status** untouched, Submit
4. As the customer, open the same ticket and check its **Helpdesk Conversion** tab (the customer-facing channel — Notes is never customer-facing, see TC-HLP-376/addendum #5)

**Expected Result:**
- The Notes tab is correctly not customer-visible either way (matches Reply Note's own behavior — never shown inline in Notes, only via Helpdesk Conversion). Status should only auto-transition to **Waiting for Customer Response** when a genuine Reply happens through the plugin's own mechanism (TC-HLP-372/021: real email sent, Helpdesk Conversion entry logged) — plain Edit-form notes aren't a Helpdesk "reply" and shouldn't trigger it
- **CONFIRMED LIVE 2026-08-26** (Local, ticket #70): FAIL — status auto-transitions to Waiting for Customer Response anyway, but **no Helpdesk Conversion entry is created at all** (the tab itself is entirely absent — zero entries) and no email was sent. The ticket falsely claims a reply happened when nothing was communicated to the customer through any channel. Tracked as **BUG-HLP-009** (High) — likely related to BUG-HLP-007/008's branded-vs-core route pattern, see `HELPDESK_MEMORY.md` and `bugs/open/BUG-HLP-009.md`.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset): **PASS — reusing this session's own BUG-HLP-009 retest as this TC's re-execution** (same action, same claim): fresh ticket #4 (Status New), `luna.blossom` opened it via genuine click-through, clicked the top-level **Edit** link (not Reply), added a non-private note, left Status untouched, Submit. Status correctly stayed **New** — confirmed 3 independent ways: the ticket page itself, the total absence of a "Property changes" tab (zero field changes fired at all), and a clean contrast against ticket #3's genuine Reply Note in the same Activity feed. BUG-HLP-009 closed on this evidence; see `bugs/closed/BUG-HLP-009.md`. One non-bug side note carried over from that retest: unlike the original 2026-08-26 repro, the Edit-form note is now visible in the customer's own Notes tab (normal core-Redmine visibility for a non-private note) — separately tracked as part of **BUG-HLP-015** (Notes tab customer-visibility), not this TC's concern.

---

### TC-HLP-374: A customer's reply automatically moves the ticket back to "In Progress"

**User Role:** Client (Customer)
**Precondition:** A ticket currently in **Waiting for Customer Response**.

**Steps:**
1. As the customer, reply to the ticket (via the portal or by email)

**Expected Result:**
- Status automatically becomes **In Progress**
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS. Reached the ticket via the genuine customer path — logged into `alpha.customer`'s real Roundcube inbox, opened the agent's reply notification email, clicked its own **View Ticket** link (with the Redmine browser session correctly switched to `alpha.customer` first, not left on an agent's session) — landed on the branded route as a real customer navigation would. Clicked **Reply**, typed a message, Save — "Successful update." Re-checked as admin via the global Tickets list: Status now **In Progress** (was Waiting for Customer Response), SLA resumed to **"23h 59m On Track"** (was paused). Also confirms the SLA-resume-on-customer-reply mechanism already noted in `HELPDESK_MEMORY.md` from earlier sessions.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #8, via the portal rather than email this time): PASS. Ticket #8 was already in Waiting for Customer Response (from this session's own TC-HLP-372 re-run). As `alpha.customer`, clicked through My Helpdesk → View → Helpdesk Tickets → ticket's own Subject link (landed on the branded `/projects/helpdesk-qa-alpha/helpdesk/issues/8` route, consistent with the customer's real in-app path), clicked **Reply**, typed a message, Save — "Successful update." The customer's own branded view has no visible Status field (confirms the stripped-down customer variant noted elsewhere), so re-checked as `luna.blossom` via genuine click-through to the Helpdesk Tickets list: Status now shows **In Progress** (was Waiting for Customer Response). Helpdesk Conversion also went (4)→(5), confirming the portal reply is logged there too.

---

### TC-HLP-375: Replying to the customer emails them, pauses the SLA, and auto-assigns an unassigned ticket

**User Role:** Agent
**Precondition:** An unassigned ticket with an active SLA.

**Steps:**
1. Open the ticket, click **Reply**
2. Type a message, leave **Reply Note** selected, Save

**Expected Result:**
- The customer receives an email with the reply
- Status becomes **Waiting for Customer Response**; the SLA clock **pauses**
- The ticket is now assigned to the replying agent
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #75): PASS on the three mechanically-verifiable parts. Created a fresh unassigned ticket in Helpdesk QA Alpha as `luna.blossom` (Assigned to left blank), then reached it via real click-through from the Tickets list (core `/issues/75` route, not a typed URL). Clicked **Reply**, Reply Note, Save. Confirmed: Assignee changed from "-" to **Luna Blossom** (auto-assigned to the replying agent), Status → **Waiting for Customer Response**, SLA Information tab shows **"⏸ Paused — the clock is not running. Paused since 08/27/2026 09:19 AM (UTC)."** The "customer receives an email" part isn't independently re-verified here (this ticket is agent-authored, no real customer to email) — already established via real email round-trips elsewhere this engagement (TC-HLP-042/294, TC-HLP-073–288), not re-tested redundantly.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset): **FAIL — regression on 2 of 3 parts.** Reproduced twice independently: on pre-existing unassigned ticket #7 (customer-authored) and on a fresh agent-created unassigned ticket #9 (matching the original repro's method exactly — `luna.blossom`, Assigned to left blank). Both times: Reply Note → Save → Status correctly auto-transitions to **Waiting for Customer Response** (PASS), but **Assignee stays "-"** (FAIL — was "Luna Blossom" in the original evidence) and **no SLA Information tab ever appears** (FAIL — was "Paused" in the original evidence), even though "Alpha Standard SLA" still exists and is confirmed Active for this project. Server log shows a genuine contradiction on the very same request: `[Helpdesk] Ticket #9 auto-assigned to luna.blossom on reply` immediately followed by `[SLA Debug] assigned_to_id changed (before_save capture)? false` — the assignment logic computes and logs success, but the field never actually persists. Filed as **BUG-HLP-016** (High) — see `bugs/open/BUG-HLP-016.md` for full root-cause diagnosis (points at `Issue#safe_attributes=` silently dropping `assigned_to_id`, most likely a workflow field-permission gate, since Status's own `update_column` write on the same save bypasses that filtering and succeeds).
- **RE-CONFIRMED LIVE 2026-08-31, same day, after a permission fix — PASS, all 3 parts.** Root cause of the regression above: the Agent role's per-tracker "Issue tracking" permission matrix (Administration → Roles and permissions → Agent) had the **Support** tracker's own **Edit issues** permission not actually granted (this session's earlier environment rebuild had only used "All trackers", which turned out not to cover the Support-tracker-specific row) — corrected directly by the user. Retested on a fresh unassigned ticket **#10**: Reply Note → Save → Assignee changed from "-" to **Luna Blossom**, Status → **Waiting for Customer Response**, and a new **SLA Information** tab appeared showing **"⏸ Paused — the clock is not running. Paused since 08/31/2026 09:25 AM (UTC)"** — matching the original 2026-08-27 evidence exactly. BUG-HLP-016 updated with this retest, pending explicit user confirmation to close.

---

### TC-HLP-376: An internal note stays private and does not touch status or the SLA clock

**User Role:** Agent
**Precondition:** An in-progress ticket with an active (unpaused) SLA.

**Steps:**
1. Open the ticket, click **Reply**
2. Type a note, choose **Internal Note**, Save

**Expected Result:**
- Note is saved and visible to the team, but never emailed to the customer
- Ticket status is unchanged; the SLA clock keeps running (not paused)
- The customer cannot see this note anywhere they have access
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS. As `luna.blossom`, reached the ticket via genuine click-through (Tickets list → row → core `/issues/74` route). Ticket was In Progress with an active ("On Track") SLA going in. Clicked Reply, selected **Internal Note**, Save — "Successful update," no crash (confirms this ticket's Internal Note submission is fine on the core route, consistent with BUG-HLP-007's finding that the crash is branded-route-specific). Status stayed **In Progress** (no auto-transition), SLA Information tab still shows **"✓ On Track"** (clock kept running, not paused). Checked the Helpdesk Conversion tab directly: it still shows exactly the two prior Reply Note entries (agent + customer from TC-HLP-372/020) — the Internal Note's text does not appear there at all, confirming it's excluded from the customer-facing channel, not just hidden by session/role.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #11): PASS. Built a fresh precondition since ticket #11 was just created (no Reply history yet): assigned it to `luna.blossom` and set Status → In Progress via the plain **Edit** form (not Reply — per BUG-HLP-009's established distinction, this doesn't touch SLA/status-transition machinery), confirmed SLA Information already showed **"✓ On Track"** before the Internal Note. Clicked **Reply**, selected **Internal Note**, typed a message, Save. Status stayed **In Progress**, SLA Information still shows **"✓ On Track"** (unpaused). No **Helpdesk Conversion** tab exists on this ticket at all (zero customer-facing entries, consistent with the note never being communicated outward). Confirmed on the **Notes** tab: the entry is correctly tagged **"Private"** and contains the exact note text — this ticket has no linked Customer (agent-created), so "the customer cannot see this note" is verified via Redmine's own Private-note mechanism rather than a live customer-session check, consistent with TC-HLP-396's own framing of internal notes as ordinary Redmine private notes.

---

### TC-HLP-377: Logging reply time with a preset chip creates the correct time entry

**User Role:** Agent
**Precondition:** Time tracking module enabled on the project; agent has `log_time`.

**Steps:**
1. Open the reply box, type a reply
2. Click the **10m** preset chip
3. Pick an Activity, Save

**Expected Result:**
- The reply and a time entry are saved together
- The time entry is **0.17 h** (ten minutes) — not ten hours
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS on the substance, one terminology correction. The real "Time spent" control is a **plain `<select>` dropdown** with options `-- None --/5 min/10 min/15 min/20 min/Custom` — not clickable "chip" buttons as this TC's steps describe (worth flagging for TC-HLP-391 too, which assumes chip-specific toggle behavior a native select can't do). Selected "10 min", picked Activity "Technical Support", Save — reply and time entry saved together. Time entry shows **"0:10"** both on the ticket (`Spent time: 0:10 h`) and on its own Edit page (`Hours *` = `0:10`, h:mm format) — genuinely ten minutes (≈0.17h decimal), not ten hours.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #11): PASS. Same dropdown shape confirmed again (`-- None --/5/10/15/20 min/Custom`). Typed a reply, selected **"10 min"**, Activity **"Technical Support"**, Save. Ticket now shows **"Spent time: 0:10 h"** — genuinely ten minutes, not ten hours.

---

### TC-HLP-378: Logging a custom reply time value creates the correct time entry

**User Role:** Agent
**Precondition:** Same as TC-HLP-377.

**Steps:**
1. Open the reply box, type a reply
2. Type `35` into the custom minutes box (no chip selected)
3. Pick an Activity, Save

**Expected Result:**
- Time entry is **0.58 h** (35 minutes)
- The entry shows up in Redmine's Spent Time reports
- If the ticket's customer has an organization with a prepaid budget, its Used hours increase by this amount
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — first live execution of this TC. Typed a reply, selected **Custom** in the Time spent dropdown, typed `35` into the resulting "Custom minutes" textbox, picked Activity **Customer Call**, Save. Confirmed via the project's own **Spent time** report (`/projects/helpdesk-qa-alpha/time_entries?issue_id=~11`): a distinct row shows **Activity "Customer Call", Hours "0:35"** — genuinely 35 minutes (0.58h decimal), not 35 hours. The ticket's own "Spent time" summary correctly shows the *cumulative* total across both this entry and TC-HLP-377's prior 10-minute entry (**0:45 h**), not a per-reply figure — the report page is what isolates this TC's own entry. Ticket has no linked Customer (agent-created), so the prepaid-budget half of this Expected Result isn't applicable/verifiable on this fixture — out of scope for this repro, see `HELPDESK_PREPAID_HOURS.md` for that mechanism's own dedicated coverage.

---

### TC-HLP-379: Merging a duplicate ticket carries its notes and history into the surviving ticket — SUPERSEDED, see revision note

**User Role:** Agent
**Precondition:** Two open tickets describing the same issue.

**Steps:**
1. Open one of the two tickets
2. Use **Merge** and select the other ticket as the target (or source, per the UI's actual direction)
3. Confirm

**Expected Result (original, now superseded):**
- The merged-away ticket's notes and history appear on the surviving ticket
- No data from either ticket is lost
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6): **FAIL — cannot execute steps as written.** Created two genuine duplicate tickets (#12 "printer not connecting to network", #13 "printer offline on office network"). Step 2 cannot be performed: no **Merge** control exists anywhere. Checked ticket #12's own page in full (only per-ticket action menu is "Actions" → "Copy link", nothing else) and the core Issues list's multi-select context menu for both tickets selected together (`/issues/context_menu?ids[]=12&ids[]=13`) — its complete contents are Bulk edit/Status/Tracker/Priority/Assignee/Progress/Issue Category/Watch/Filter/Copy link/Copy/Delete issues/Remove All Testcase, no Merge option. Filed as **BUG-HLP-017** (Medium) — see `bugs/open/BUG-HLP-017.md`. Tickets #12/#13 left in place as ready-made fixtures for retesting once fixed.

**Revision 2026-09-10 — Not a bug, feature intentionally not built:** Per the developer's note on production issue #119713, the team decided **not** to build a Merge control — duplicate tickets are expected to be rare because a customer's reply auto-matches to its original ticket, and a genuine duplicate is handled by closing the newer ticket with a note referencing the older one, not by merging. `HELPDESK_USER_GUIDE.md` §7.4 was rewritten to match (no longer promises a Merge button) and this TC's original Expected Result is retired along with it. Re-verified live on two fresh open tickets (#81, #82): still no Merge control anywhere (ticket page Actions menu, or the multi-select context menu) — this is now the confirmed, correct, by-design behavior, not a defect. **BUG-HLP-017 closed** as resolved-by-design, not as a fixed technical defect. This TC is superseded and should be considered out of scope going forward (no Merge feature exists to test); TC-HLP-393 and TC-HLP-397, which depended on this one's precondition, are superseded for the same reason.

---

## Negative Cases

---

### TC-HLP-380: Email from an unregistered sender does not create a ticket

**User Role:** N/A (external sender)
**Precondition:** Incoming mail configured for the project; sender's address is **not** a registered helpdesk customer.

**Steps:**
1. Send an email to the configured mailbox from an address with no matching customer record
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created
- The sender receives a notification that their message was not accepted

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6) — first live execution of this TC. Sent a real qualifying email (subject contained "Ticket:") as `qa@test.local` (a spare mailbox, not registered as any helpdesk customer) to `alpha.support@test.local`, then triggered the poller. Server log: `MailHandler: Email from unregistered customer [qa@test.local] - ticket creation blocked` → `Sending unregistered user notification to qa@test.local` → `Unregistered user notification sent`. No ticket created (no `Created ticket #` line for this message). Both halves of the expected result confirmed.

---

### TC-HLP-381: A registered customer without a project-access row for the target project cannot create a ticket there by email

**User Role:** N/A (external sender — a real, registered helpdesk customer, just not for this project)
**Precondition:** The sender's address belongs to a genuine Customer record whose only project-access row is on **Project A**. Incoming mail is configured on **Project B**, which this customer has no entitlement row for.

**Steps:**
1. From that same customer's real email address, send a qualifying email (correct identifier keywords if configured) to Project B's configured mailbox
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created on Project B — being a registered customer on some project does not grant email-based ticket creation rights on a project they have no project-access row for
- **Distinct from TC-HLP-380** (sender has no Customer record anywhere in the system at all — the broader/simpler case) and **TC-HLP-386** (the same "no entitlement" rule, but tested via the portal UI, not the email channel) — this is the narrower, more realistic scenario a real multi-project instance would actually hit: an existing customer of one project mistakenly (or deliberately) emailing a different project's support address. Not yet executed — flagged from a direct question about this exact gap; TC-HLP-368's precondition ("sender's address belongs to a registered helpdesk customer") does not specify per-project, so it's untested whether the poller's customer lookup is scoped to the polled project or checks for any Customer record install-wide.
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6) — first live execution, resolving the exact open question above. `beta.customer` (registered only for Helpdesk QA Beta) sent a real qualifying email to `alpha.support@test.local` (Project A = Alpha, her project-access is on Beta only). Server log: `MailHandler: Email from unregistered customer [beta.customer@test.local] - ticket creation blocked` → unregistered-user notification sent. **This answers the open question directly: the poller's customer lookup IS scoped per-project** — `beta.customer` is a genuine Customer record install-wide, but relative to Alpha's mailbox she is treated identically to a total stranger (same code path and same log message as TC-HLP-380's fully-unregistered sender), not given any special "registered elsewhere" handling. No ticket created on Alpha.

---

### TC-HLP-382: Email missing a required identifier keyword does not create a ticket

**User Role:** Client (Customer, via email)
**Precondition:** The project has identifier keywords configured; sender is a registered customer.

**Steps:**
1. Send an email whose subject and body contain none of the configured keywords
2. Wait for the poller / trigger `check_emails`

**Expected Result:**
- No ticket is created from this email

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6) — first live execution of this TC. Sent an email as `alpha.customer` (a genuinely registered customer on Alpha) with subject and body deliberately worded to contain none of the configured keywords (`ticket, issue, request`). Server log: `MailHandler: Email does not contain required keywords ["ticket", "issue", "request"] - ticket creation skipped` → `Required keywords not found in email`. No ticket created — a distinct rejection code path from the unregistered-sender cases above (correctly reached "is this a registered customer" first, then separately failed the keyword check), confirming the two gates are independent checks, not conflated into one generic rejection.

---

### TC-HLP-383: Logging time with no Activity selected is refused

**User Role:** Agent
**Precondition:** No default Activity marked in Administration › Enumerations.

**Steps:**
1. Open the reply box, type a reply
2. Select a time preset or type a custom value, but leave Activity unselected
3. Attempt to Save

**Expected Result:**
- Save is refused with a message that Activity is required
- Nothing is submitted — no reply and no time entry are created

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — first live execution of this TC. Typed a reply, selected **"5 min"** in the Time spent dropdown, left Activity at its default "-- Please select --", clicked Save. A client-side alert appeared: **"Choose an activity for the time you are logging."** — clear, on-point message. Dismissed it and reloaded the ticket: **Spent time stayed "0:45 h"** (unchanged from before the attempt — no new time entry), and no new journal/note entry exists beyond the two that already existed. Confirms both halves of the expected result: refused with a clear message, and nothing was submitted.

---

### TC-HLP-384: A non-numeric custom time value is refused

**User Role:** Agent
**Precondition:** Same as TC-HLP-377.

**Steps:**
1. Open the reply box, type a reply
2. Type a non-numeric value (e.g. `abc`) into the custom minutes box
3. Attempt to Save

**Expected Result:**
- The value is refused/rejected client-side or server-side; no invalid time entry is created

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — first live execution of this TC. Typed a reply, selected **Custom**, typed **`abc`** into the Custom minutes box, and — to isolate this specific validation from TC-028's Activity-required check — also picked Activity **Design**. Clicked Save. A client-side alert appeared: **"Enter the time spent as a whole number of minutes."** Dismissed it: the reply form remained open with the same unsaved content, **Spent time stayed "0:45 h"** (unchanged), and no new journal/note entry was created. Refused client-side with a clear, specific message; nothing was submitted.

---

### TC-HLP-385: An agent without helpdesk permission cannot create a ticket

**User Role:** Project member with neither `view_helpdesk` nor `manage_helpdesk`
**Precondition:** User is a member of a helpdesk-enabled project but has neither permission on their role.

**Steps:**
1. Attempt to open the project's Helpdesk tab
2. Attempt to navigate directly to the new-ticket URL for that project

**Expected Result:**
- The Helpdesk tab is absent from the project menu
- Direct navigation to the helpdesk/new-ticket URL is refused
- No ticket can be created via this path

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6) — first live execution of this TC; no existing fixture had this exact permission shape, so created a fresh minimal user (`no.perm.reporter`) and added them as a Member of Helpdesk QA Alpha with Redmine's built-in **Reporter** role, first confirming via Administration → Roles and permissions that Reporter has zero helpdesk-related permissions checked (View helpdesk, Manage helpdesk, Export helpdesk reports, etc. all unchecked). Signed in as this user: the project's own menu shows Overview/Activity/Issues/Spent time/Gantt/Calendar/News/Documents/Wiki/Files — **no "Helpdesk" tab anywhere**. Direct navigation to `/projects/helpdesk-qa-alpha/helpdesk/new` returns a genuine **HTTP 403 Forbidden**. Both halves of the expected result confirmed; no ticket could be created via this path.

---

### TC-HLP-386: A customer with no project-access row cannot raise or see a ticket on that project

**User Role:** Client (Customer) — has a project-access row for Project A only
**Precondition:** A second project (Project B) exists that this customer has no entitlement row for.

**Steps:**
1. Sign in as the customer
2. Attempt to open Project B's helpdesk and raise a ticket there

**Expected Result:**
- The customer cannot access Project B's helpdesk (no entitlement)
- No ticket can be raised by them on Project B

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6) — first live execution of this TC. `alpha.customer` has a project-access row for Helpdesk QA Alpha only; Helpdesk QA Beta exists as a real second project she has no entitlement to. Her own "My Helpdesk" dashboard lists only **Helpdesk QA Alpha** — Beta doesn't appear at all, so there's no legitimate click path to attempt raising a ticket there in the first place (this negative test necessarily checks the underlying route directly, the same way earlier scope-boundary bugs like BUG-HLP-005/013 did). Both `/projects/helpdesk-qa-beta/helpdesk` and `/projects/helpdesk-qa-beta/helpdesk/new` return a genuine **HTTP 403 Forbidden** for her session. Matches both halves of the expected result.

---

### TC-HLP-387: A customer cannot merge tickets

**User Role:** Client (Customer)
**Precondition:** The customer has two of their own tickets describing the same issue.

**Steps:**
1. Sign in as the customer and open one of the tickets

**Expected Result:**
- No **Merge** control is available to the customer anywhere on the ticket

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #8): PASS. As `alpha.customer`, a full-page case-insensitive check for "merge" on her own ticket view found zero matches — no Merge control anywhere. (Independent of **BUG-HLP-017**'s finding that Agents also have no discoverable Merge control anywhere — this TC's own claim holds regardless of that bug's outcome, since a customer correctly having zero access to a feature that may or may not currently exist for agents is not itself contingent on the feature being fixed.)

---

### TC-HLP-388: A customer's "Edit" action on their own ticket only allows editing the Subject — nothing else

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
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #8): PASS. Same shape exactly — `alpha.customer` clicked Edit, only the Subject heading became an inline `#issue_subject` textbox with ✓/✗; Priority ("Normal"), Organization ("-"), and Description all remained plain text with no edit control anywhere on the page. Changed the subject to add `(subject-edit test)`, confirmed via ✓ — page title/heading updated immediately. Re-opened Edit, reverted to the original subject, confirmed again — saved cleanly.

---

### TC-HLP-389: A user without `log_time` does not see the reply time-log block at all

**User Role:** Project member with `view_helpdesk` but without Redmine's `log_time` permission on the project
**Precondition:** Time tracking module is enabled on the project.

**Steps:**
1. Open a ticket, click **Reply**

**Expected Result:**
- The **Time spent** block (presets/custom box/Activity) is not shown at all

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — first live execution of this TC; no existing fixture had this exact permission split, so created a dedicated role **"Agent No LogTime"** (View helpdesk checked, Redmine's `Log spent time` left unchecked, default View/Add Issues + Add notes otherwise) and assigned it to the `no.perm.reporter` fixture user (reused from TC-HLP-385) on Helpdesk QA Alpha. Signed in as this user, opened ticket #11, clicked Reply: the form rendered fully — message textbox, Reply Note/Internal Note radios, Save button — but **no Time spent / Activity / Support Package block anywhere**, confirmed via a full-page search. The reply UI itself still works; only the time-log portion is gated behind `log_time`.

---

### TC-HLP-390: A customer's reply box shows no Canned Response, Internal Note, or time-log controls

**User Role:** Client (Customer)
**Precondition:** Customer viewing one of their own tickets.

**Steps:**
1. Sign in as the customer, open the ticket, and view the reply box

**Expected Result:**
- No **Canned Response** dropdown is present
- No **Internal Note** option is present (only a plain reply)
- No time-log block is present, regardless of the customer's Redmine permissions
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6, ticket #74): PASS — evidenced during TC-HLP-374's execution. `alpha.customer`'s Reply box on her own ticket contains exactly a plain textbox and a **Save** button — no Canned Response dropdown, no Reply Note/Internal Note radio choice, no Time spent/Activity/Support Package block at all. Confirms the reply UI itself is a genuinely stripped-down customer variant, not just permission-hidden fields on the same form.
- **RE-CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, post-DB-reset, ticket #8): PASS. Same exact shape — clicked Reply, the box contains only a plain textbox and a **Save** button, no other control anywhere.

---

## Edge Cases

---

### TC-HLP-391: Time-log input methods are mutually exclusive

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
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — as established in TC-HLP-377, the real control is a single native `<select>` (`-- None --/5/10/15/20 min/Custom`), not separate clickable chips, so steps 1–3 as written don't literally apply (there's no independently-clickable "20m chip" to click twice) — but the underlying mutual-exclusion property this TC is actually checking does hold, just via the select's own inherent single-choice nature: after typing `abc` into the Custom-minutes box (revealed only when "Custom" is the selected option) and then switching the same dropdown to **"10 min"**, the Custom-minutes textbox disappeared entirely from the form — confirming a preset and a custom value can never coexist, and selecting a different option always fully replaces whatever was previously chosen. No separate repro needed for "None" — the dropdown's own "-- None --" default option is exactly that state.

---

### TC-HLP-392: Saving a reply with no time selected creates no time entry

**User Role:** Agent
**Precondition:** Reply box open; Time tracking module enabled.

**Steps:**
1. Type a reply, leave the time-log block untouched (no chip, no custom value)
2. Save

**Expected Result:**
- The reply posts successfully
- No time entry is created for this reply

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11): PASS. Typed a reply, left Time spent at **"-- None --"**, Save. Reply posted successfully — Helpdesk Conversion went (2)→(3), same tab-split pattern as every other Reply Note this session. **Spent time stayed unchanged at "0:45 h"** — no new time entry was created.

---

### TC-HLP-393: Merging a ticket that itself already has reply/note history preserves both threads — SUPERSEDED, see revision note

**User Role:** Agent
**Precondition:** Two tickets, each with at least one prior reply and one internal note of their own.

**Steps:**
1. Merge one ticket into the other

**Expected Result (original, now superseded):**
- The surviving ticket shows the replies and internal notes from **both** original tickets, in a coherent combined history — nothing from either side is dropped or overwritten
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6): **BLOCKED — same root cause as TC-HLP-379.** No Merge control exists anywhere in the UI (checked both the individual ticket page and the multi-select context menu — see **BUG-HLP-017**), so this TC's own precondition can never be reached regardless of how much reply/note history the two source tickets have. Not independently re-verified with its own dedicated fixture since the blocking cause is already fully established; will retest once BUG-HLP-017 is fixed.

**Revision 2026-09-10 — Not a bug, feature intentionally not built:** Same product decision as TC-HLP-379 — see that TC's revision note. There is no Merge feature to test; this TC is superseded and out of scope going forward. **BUG-HLP-017 closed** as resolved-by-design.

---

### TC-HLP-394: All seven ticket statuses exist and are reachable in the workflow

**User Role:** Admin (for the status list) and Agent (for transitions)
**Precondition:** A ticket that can be moved through manual status changes per the Support tracker's workflow for the agent's role.

**Steps:**
1. Administration › Issue statuses — confirm all seven exist: New, In Progress, Waiting for Customer Response, Resolved, Feedback, Closed, Rejected
2. On a ticket, manually set status to Resolved, then Feedback, then Closed (or Rejected), as permitted by the workflow

**Expected Result:**
- All 7 statuses are present in Administration › Issue statuses
- Each manual transition permitted by the Support tracker's workflow succeeds

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6): PASS on both parts. Step 1, as `admin`: Administration → Issue statuses lists all 7 — New, In Progress, Resolved, Feedback, Closed, Rejected, Waiting for Customer Response. Step 2, as `luna.blossom` (Agent, matching this TC's own role split): on ticket #11, manually walked the Edit form's Status dropdown through **Waiting for Customer Response → Resolved → Feedback → Closed**, one Submit per step, each one succeeding and correctly reflected on the ticket header afterward. The dropdown's own available options changed at each step per the Support tracker's real workflow for the Agent role (e.g. from Waiting for Customer Response only `In Progress/Resolved/Feedback/Closed` were offered, not `New`/`Rejected`) — confirms the workflow is genuinely gating transitions, not just displaying every status unconditionally.

---

### TC-HLP-395: The reply time-log Comment field appears only when Required fields demands it

**User Role:** Agent
**Precondition:** Two configurations of Administration › Settings › Time tracking › Required fields — one where "Comment" is not required, one where it is.

**Steps:**
1. With Comment **not** required: open a ticket's reply box and view the time-log block
2. Switch the setting so Comment **is** required; repeat

**Expected Result:**
- Step 1: no Comment field appears in the time-log block
- Step 2: a Comment field appears and is required to save

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6, ticket #11) — first live execution of this TC. **PASS on both steps.** Step 1 (Comment not required): Comment field is genuinely absent from the reply form, matching the expected result. Step 2 (Comment required): after checking "Comment" as Required in Administration → Settings → Time tracking, the **Comment \*** field is present and visible from the very first load of the reply form (confirmed both via a fresh snapshot and directly against the live DOM: real on-screen bounding rect, `display: block`, `opacity: 1`, genuinely interactive). Typed a reply, filled the Comment field, picked a Time spent preset and Activity, clicked Save — succeeded cleanly in one attempt, no alert, no retry (Spent time correctly went 0:55h → 1:05h). *(An initial pass at this TC mistakenly filed a bug — BUG-HLP-018 — claiming the Comment field was absent on first load; that finding turned out to be a false positive from an accessibility-snapshot text search that missed the real, rendered field on one capture, not an actual defect. Retested per the user's own manual check and closed as does-not-reproduce; see `bugs/closed/BUG-HLP-018.md`.)* Setting restored to its original (Comment not required) state afterward.

---

### TC-HLP-396: A customer's portal session can never see internal or private notes, under any configuration

**User Role:** Client (Customer) — authenticates through the plugin's own separate portal view (`RfProjectCustomer` entitlement), **not** a core Redmine project Member with a Role. A customer must never be added as a Member with a Role to test this — that isn't how customer access works in this plugin, and doing so doesn't reflect any real, supportable configuration.
**Precondition:** A ticket exists with both an **Internal Note** (agent-only) and, separately, any note Redmine's own **Private notes** checkbox has marked private.

**Steps:**
1. As the customer, open the ticket through her own real portal view (My Helpdesk → her project → her ticket) and check every tab available to her (Notes, Helpdesk Conversion, etc.) for the internal note's or any private note's content.
2. As a boundary check (not a supported configuration — this step exists only to prove the boundary is architectural, not permission-based): attempt to grant a Role `view_private_notes` and associate it with the customer's own underlying User account via a genuine project Membership, in addition to her existing Customer entitlement. Confirm this has no effect.

**Expected Result:**
- **No internal note and no privately-flagged note is ever visible to a customer, under any configuration** — this is an absolute boundary of the portal session itself, not something gated behind a Redmine permission that could be granted or withheld.
- Granting `view_private_notes` (or any other Role permission) to a customer's underlying account has **no effect**, because customer sessions never evaluate core Redmine Role permissions in the first place — a customer is not a Member with a Role, and giving her one via Step 2 does not change how her portal session behaves or unlock access to core issue routes.

- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6): PASS, evidenced by direct experiment. `alpha.customer` (a genuine underlying Redmine User, ID 6) was added as an actual project **Member** of Helpdesk QA Alpha with a custom role that had **View private notes** checked, on top of her existing Customer entitlement — i.e. given every mechanism a Role-based grant could offer. Result: her branded "My Helpdesk" ticket list still didn't surface ticket #11 (an agent-created ticket outside her own `RfProjectCustomer` scope) — the plugin's own customer-facing list is scoped by `RfProjectCustomer`/authorship, not by core Membership, so the Membership granted no additional visibility there. More decisively, navigating directly to the **core** `/issues/11` route (the only way to isolate the Role permission itself, since no click path exists to it) returned **"You are not authorized to access this page"** — flatly denied despite the granted permission. Confirms customer sessions are unconditionally blocked from core issue routes and never see internal/private notes, regardless of any Role/permission also held on the account. Cleaned up afterward: the diagnostic Membership was removed, restoring `alpha.customer` to her canonical Customer-only entitlement (confirmed back to "No data" on her Projects tab).

---

### TC-HLP-397: Attempting to merge a ticket into itself is rejected or has no effect — SUPERSEDED, see revision note

**User Role:** Agent
**Precondition:** A single existing ticket.

**Steps:**
1. Open the ticket
2. Use **Merge** and select the same ticket as the target

**Expected Result (original, now superseded):**
- The action is rejected with a clear message, or has no effect — the ticket is not duplicated, corrupted, or left in an inconsistent state
- **CONFIRMED LIVE 2026-08-31** (Local, redmine-docker-6): **BLOCKED — same root cause as TC-HLP-379.** No Merge control exists anywhere in the UI to even attempt selecting the same ticket as its own target — see **BUG-HLP-017**. Will retest once fixed.

**Revision 2026-09-10 — Not a bug, feature intentionally not built:** Same product decision as TC-HLP-379 — see that TC's revision note. There is no Merge feature to test; this TC is superseded and out of scope going forward. **BUG-HLP-017 closed** as resolved-by-design.

---

## Evidence Map

- Case ID: TC-HLP-365 – TC-HLP-397, TC-HLP-373, TC-HLP-381, TC-HLP-388
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Inserting a canned response into the reply box (§7.3 of `HELPDESK_USER_GUIDE.md`) — the macro-substitution behavior and "appends rather than replaces" checklist item belong to the Canned Responses suite (feature #45), not this one. Tracked here only as a cross-reference so it isn't silently dropped.
