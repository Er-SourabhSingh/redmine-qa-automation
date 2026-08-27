# Redmineflux Helpdesk — User Guide

A complete, step-by-step guide to running a support desk on this plugin: what to
set up, in what order, and how each feature behaves once it is running.

**Redmine:** 6.x · **Plugin:** redmineflux_helpdesk

---

## What this plugin gives you

A support desk built on Redmine issues. A ticket **is** an issue on the Support
tracker, so everything Redmine already does — history, attachments, watchers,
time tracking, permissions — still applies. What this plugin adds is the
customer, the promise you made them, and the clock that holds you to it.

### Tickets and the working day

| Feature | What it does | Where |
|---|---|---|
| Support tickets | Raised by an agent, by a customer, or by email | [§5](#5-tickets-end-to-end) |
| Purpose-built filter panel | Filter on 16 fields — customer, organization, SLA state, assignee, dates — instead of Redmine's operator grid | [§6](#6-the-ticket-list-filters-and-columns) |
| Column picker | 20 columns, 9 on by default as a triage set | [§6](#6-the-ticket-list-filters-and-columns) |
| Reply to customer | Emails the customer, moves the ticket to *Waiting for Customer Response*, pauses the SLA | [§7.1](#71-replying-to-the-customer) |
| Internal notes | Team-only notes that never reach the customer and never touch the clock | [§7.2](#72-writing-an-internal-note) |
| Reply time log | Log the minutes a reply took from inside the reply box — presets or a custom value | [§8](#8-logging-the-time-a-reply-took) |
| Merge duplicates | Fold one ticket into another, keeping notes and history | [§7.4](#74-merging-duplicates) |
| Automatic status flow | Agent replies → waiting on customer. Customer replies → back in progress | [§9](#9-slas-how-the-clock-actually-works) |

### Service levels

| Feature | What it does | Where |
|---|---|---|
| SLA policies | Response and resolution targets, working hours, working days, holidays | [§3.2](#32-create-an-sla) |
| Working-hours clock | Time only counts inside the SLA's hours, days and non-holidays | [§9](#9-slas-how-the-clock-actually-works) |
| Pause and resume | The clock stops while you wait on the customer, or while unassigned | [§9](#9-slas-how-the-clock-actually-works) |
| Breach tracking | Records what breached and when, with a live badge on every ticket | [§6](#6-the-ticket-list-filters-and-columns) |
| Support levels | An L1 → L2 → L3 ladder per project, with named assignees at each tier | [§10](#10-support-levels-and-escalation) |
| Automatic escalation | A breach moves the ticket up the ladder, reassigns it and notifies the new tier | [§10](#10-support-levels-and-escalation) |
| SLA history | Every policy change and every escalation, with a field-level diff | [§9](#9-slas-how-the-clock-actually-works) |
| Holiday calendars | Days the clock skips entirely | [§16](#16-holidays) |

### Customers

| Feature | What it does | Where |
|---|---|---|
| Customer records | A Redmine user flagged as a helpdesk customer, created in one form | [§3.5](#35-create-a-customer) |
| Project entitlements | Which projects a customer may raise tickets on, and the SLA, support level and organization that apply | [§3.5](#35-create-a-customer) |
| Organizations | Company records that group customers and carry prepaid budgets | [§3.4](#34-create-an-organization) |
| Customer 360 | One page with a customer's identity, KPIs, entitlements and recent tickets | [§11](#11-customers-and-the-portal) |
| Portal preview | See the desk exactly as one customer sees it, read-only | [§11](#11-customers-and-the-portal) |
| Restricted customer view | Customers see only their own tickets, with a trimmed column and filter set | [§6](#6-the-ticket-list-filters-and-columns) |

### Billing prepaid time

| Feature | What it does | Where |
|---|---|---|
| Prepaid hour budgets | Hours bought up front, per organization per project, as an audit trail | [§12](#12-prepaid-support-hours) |
| Consumption ledger | Every time entry that spent the budget, with the running balance | [§12](#12-prepaid-support-hours) |
| Run-out enforcement | Choose per customer: no limit, hard stop, or let the balance go negative | [§12](#12-prepaid-support-hours) |

### Email

| Feature | What it does | Where |
|---|---|---|
| Email to ticket | A registered customer's mail becomes a ticket, with keyword gating and a subject prefix | [§5.1](#51-three-ways-a-ticket-is-born) |
| Per-project sending | Each project mails from its own SMTP account and address | [§13](#13-email-in-and-out) |
| Email history | Every message in and out, per ticket | [§13](#13-email-in-and-out) |
| Auto-close | Close resolved tickets after a set period of silence | [§3.6](#36-configure-email) |

### Content and templates

| Feature | What it does | Where |
|---|---|---|
| Canned responses | Reply templates with nine macros filled in per ticket | [§14](#14-canned-responses) |
| Products | Say which product a ticket is about, and report by it | [§15](#15-products) |
| Knowledgebase | Per-project articles with nesting, versions, attachments, search, sharing and PDF export | [§17](#17-knowledgebase) |

### Reporting and automation

| Feature | What it does | Where |
|---|---|---|
| Five reports | Ticket summary, SLA analytics, agent performance, organizations, projects | [§18](#18-reports) |
| Export | Any report as CSV, Excel or PDF | [§18](#18-reports) |
| Background jobs | SLA monitoring every 2 minutes, mail polling every 5, auto-close every 2 | [§19](#19-what-runs-in-the-background) |
| REST API | Every entity above, with interactive Swagger documentation | [§22](#22-rest-api) |
| Demo data | One command fills a project with realistic customers, SLAs and tickets | [§23](#23-rake-tasks) |

### Six behaviours worth knowing before you start

These are the ones that surprise people. Each is deliberate, and each is
explained where you would meet it.

1. **The SLA clock starts on first assignment, not on creation.** An unassigned
   ticket has no clock running.
2. **A customer with no SLA gets no SLA** — there is no fallback for customers,
   so nobody is held to a policy they were never sold. Agent-raised tickets do
   fall back to a project or global SLA.
3. **The resolution deadline only starts after the first response**, so a ticket
   that sat in a queue over a weekend does not count against you twice.
4. **Replying to a customer pauses the clock** until they answer.
5. **Holiday names are unique across the whole install** — prefix them if you
   keep more than one calendar.
6. **A customer can hold multiple project-access rows at once** — confirmed live on two separate environments (Forge and Local, 2026-08-27) that adding a second row without removing the first persists both correctly across a reload, each with its own SLA/support level/organization. (This entry previously said the opposite — "one row at a time" — which was never actually true; see TC-HLP-122 in `testcases/HELPDESK_CUSTOMERS_ORGANIZATIONS.md`.)

---

## Contents

**Getting started**
1. [Who does what](#1-who-does-what)
2. [Before you begin](#2-before-you-begin)
3. [Setup, in order](#3-setup-in-order)

**Daily use**
4. [The two workspaces](#4-the-two-workspaces)
5. [Tickets, end to end](#5-tickets-end-to-end)
6. [The ticket list: filters and columns](#6-the-ticket-list-filters-and-columns)
7. [Working a ticket](#7-working-a-ticket)
8. [Logging the time a reply took](#8-logging-the-time-a-reply-took)

**The engine room**
9. [SLAs: how the clock actually works](#9-slas-how-the-clock-actually-works)
10. [Support levels and escalation](#10-support-levels-and-escalation)
11. [Customers and the portal](#11-customers-and-the-portal)
12. [Prepaid support hours](#12-prepaid-support-hours)
13. [Email: in and out](#13-email-in-and-out)

**Everything else**
14. [Canned responses](#14-canned-responses)
15. [Products](#15-products)
16. [Holidays](#16-holidays)
17. [Knowledgebase](#17-knowledgebase)
18. [Reports](#18-reports)
19. [What runs in the background](#19-what-runs-in-the-background)

**Reference**
20. [Permissions](#20-permissions)
21. [Every screen and its URL](#21-every-screen-and-its-url)
22. [REST API](#22-rest-api)
23. [Rake tasks](#23-rake-tasks)
24. [Troubleshooting](#24-troubleshooting)
25. [Frequently asked questions](#25-frequently-asked-questions)
26. [Feature checklist for testers](#26-feature-checklist-for-testers)

---

## 1. Who does what

Three kinds of people use this plugin, and the screens change for each.

| | Who they are | What they see |
|---|---|---|
| **Administrator** | Redmine admin | Everything, plus the only person who can save a project's email configuration |
| **Agent** | A member with `manage_helpdesk` (or `view_helpdesk`) on a helpdesk project | The full desk: tickets, SLAs, customers, reports |
| **Customer** | A Redmine user flagged as a helpdesk customer | Only their own tickets, with a trimmed set of columns and filters |

A **customer** is not a separate account type in Redmine. It is an ordinary user
with the helpdesk-customer flag set, which the plugin sets for you when you
create the customer from the Customers screen. That flag is what every
customer-facing screen keys off.

---

## 2. Before you begin

### 2.1 Supported Redmine versions

| Redmine | Supported |
|---|:---:|
| 5.0.x | yes |
| 5.1.x | yes |
| 6.0.x | yes |
| 6.1.x | yes |

### 2.2 Installing the plugin

1. Unzip the archive and copy the plugin folder into `redmine/plugins/`.
   **Do not rename the folder** — Redmine identifies a plugin by its directory
   name and the plugin registers itself as `redmineflux_helpdesk`.
2. Install the gems:
   ```bash
   bundle install
   ```
3. **Load Redmine's default data first, if this is a fresh install.** See the
   note at the end of this section — doing it after the plugin migration is not
   possible.
   ```bash
   RAILS_ENV=production bundle exec rake redmine:load_default_data
   ```
4. Run the plugin migrations:
   ```bash
   RAILS_ENV=production bundle exec rake redmine:plugins:migrate
   ```
5. Install and start Redis, which Sidekiq needs:
   ```bash
   # Debian / Ubuntu
   sudo apt update && sudo apt install redis-server
   sudo service redis-server start

   # macOS
   brew install redis && brew services start redis
   ```
6. Start Sidekiq, which runs the SLA monitor, the email poller and auto-close:
   ```bash
   bundle exec sidekiq
   ```
7. Restart Redmine.

To upgrade, replace the folder, run `bundle install` and
`rake redmine:plugins:migrate` again, then restart.

### 2.3 What must be true before the desk works

Four things. Check them first — most "nothing happens" problems trace back to
one of these.

| Requirement | Where to check | Why |
|---|---|---|
| A tracker named **Support** exists | Administration › Trackers | Every helpdesk ticket is an issue on this tracker. The plugin identifies tickets by tracker name |
| The **Helpdesk** module is on the project | Project › Settings › Modules | Without it the project has no Helpdesk tab and no helpdesk screens |
| The Support tracker is enabled on the project | Project › Settings › Issue tracking | Otherwise you cannot raise a ticket there |
| Redis and Sidekiq are running | your server | SLA monitoring, email polling and auto-close are background jobs. Without Sidekiq nothing escalates and no mail is fetched |

Optional but usually wanted:

- **Time tracking module** on the project — needed for logging time on a reply
  and for prepaid support hours to mean anything.
- **A default time-entry activity** (Administration › Enumerations › Activities,
  tick *Default*). Without one, an agent has to pick an activity every time they
  log time on a reply.

> **Fresh installs:** if you install this plugin and then run
> `rake redmine:load_default_data`, Redmine will refuse with *"Some
> configuration data is already loaded"*. The plugin's migration creates the
> **Waiting for Customer Response** status, and Redmine's loader only runs when
> there are no statuses at all. Load Redmine's default data **first**, then
> migrate the plugin.

---

## 3. Setup, in order

The order matters. A ticket can only attach to an SLA if the customer already
has one, and a customer can only be given an SLA that already exists. Work down
this list once, and the desk is ready.

| # | Step | Where | Notes |
|---|---|---|---|
| 1 | Turn on the Helpdesk module | Project › Settings › Modules | |
| 2 | Add holidays | Helpdesk Settings › Holidays | Only needed if an SLA should skip them |
| 3 | Create SLAs | Project › Helpdesk › SLA | Response and resolution times, working hours, working days |
| 4 | Create support levels | Project › Helpdesk › Settings › Support Levels | L1 → L2 → L3, per project |
| 5 | Create organizations | Helpdesk › Organizations | Optional. Groups customers, and prepaid budgets attach here |
| 6 | Create customers | Helpdesk › Customers | Give each one project access with an SLA + support level |
| 7 | Add products | Helpdesk Settings › Products | Optional. Lets a ticket say what it is about |
| 8 | Write canned responses | Helpdesk Settings › Canned Responses | Optional but saves a lot of typing |
| 9 | Configure email | Helpdesk Settings › Email Configuration | Per project. Admin only |
| 10 | Set prepaid budgets | Organization page › Prepaid Support Hours | Optional |

### 3.1 Enable the module

1. Open the project.
2. **Settings › Modules**.
3. Tick **Helpdesk** (and **Time tracking**, if you want time logging).
4. Save.

A **Helpdesk** tab appears in the project menu.

### 3.2 Create an SLA

**Project › Helpdesk › SLA tab › New SLA**

> SLAs have no entry in the Command Center's icon rail. You reach the list from
> a project's own SLA tab. The list itself lives at `/rf_slas` if you want to
> bookmark it.

| Field | What it means |
|---|---|
| Name | Shown wherever the SLA is referenced. Must be unique |
| First response time | How long the team has to reply the first time |
| Response time unit | Minutes or hours |
| Resolution time | How long until the ticket should be resolved |
| Resolution time unit | Minutes or hours |
| Working hours start / end | The clock only runs inside these hours |
| Working days | The clock only runs on these days |
| Holidays | Days the clock skips entirely |
| Project | Leave blank for an SLA any project can use |
| Active | Inactive SLAs are not offered when linking a customer |

Two SLAs cover most desks — a business-hours one and a 24/7 one:

- **Standard** — 4 hours response, 24 hours resolution, 09:00–18:00, Mon–Fri, public holidays excluded.
- **Premium** — 60 minutes response, 8 hours resolution, 00:00–23:59, all seven days, no holidays.

### 3.3 Create support levels

**Project › Helpdesk › Settings › Support Levels › New Support Level**

> Like SLAs, support levels have no icon in the rail. The list lives at
> `/rf_support_levels`.

| Field | What it means |
|---|---|
| Name | Must be unique across the install |
| Project | Support levels are per project |
| Level order | 1, 2, 3 … lowest is the front line |
| Support assignees | Who sits at this level. At least one is required |
| Escalates to | The level above. Leave blank on the top level |
| Active | Inactive levels are not offered and are not escalated into |

Build the chain bottom-up: create L1, L2 and L3 first, then edit L1 to escalate
to L2 and L2 to escalate to L3.

**Note:** the assignee dropdown only offers members of the project you picked,
minus anyone already on another level in the same project.

### 3.4 Create an organization

**Helpdesk › Organizations › New Organization**

Name is required and must be unique. Everything else — website, phone, address,
employee count, billing info, notes — is optional and appears on the
organization page.

Organizations do two jobs: they group customers so a report can total by
company, and they are what a **prepaid support-hours budget** attaches to.

### 3.5 Create a customer

**Helpdesk › Customers › New Customer**

Fill in the person's name, login and email as you would for any Redmine user.
Then, in the same form, use **Project access** to say which projects they can
raise tickets against:

1. Click **Add project**.
2. Pick the project.
3. Pick the **SLA** that applies to them there.
4. Pick the **Support level** they enter at.
5. Optionally pick their **Organization**.
6. Repeat for each project. Save.

This is the whole registration — there is no second step inside the project.

> **This matters more than it looks.** A customer with no SLA on a project gets
> **no SLA at all** on tickets they raise there — the plugin does not fall back
> to a project default for customers, on purpose, so nobody is silently held to
> a policy they were never sold. (Tickets raised by *agents* do fall back to a
> project or global SLA.)

> **Corrected 2026-08-27 — this was wrong.** A customer can hold **multiple** project-access rows at once, not just one. Use **Add project** on the customer's Edit form to give the same person access to a second (or third) project — each row keeps its own SLA, support level, and organization independently, and all rows survive a reload. Confirmed live on both Forge and Local; see TC-HLP-122 in `testcases/HELPDESK_CUSTOMERS_ORGANIZATIONS.md` for the repro.

### 3.6 Configure email

**Helpdesk › Settings › Email Configuration**

Pick the project from the dropdown, then fill in the form. One configuration per
project. **Only an administrator can save this** — a non-admin manager sees the
picker and a note instead of the form.

**Outgoing**

| Field | Notes |
|---|---|
| SMTP server | Required for this project to send from its own address |
| SMTP port | 587 for STARTTLS, 465 for SSL |
| SMTP authentication | none / plain / login / cram_md5 |
| SMTP username / password | Stored as entered |
| Email from | The address customers see. Falls back to Redmine's global setting if blank |

**Incoming**

| Field | Notes |
|---|---|
| Mail protocol | IMAP (recommended) or POP3 |
| Mail server | Hostname, not an email address |
| Mail port | 993 for IMAP over SSL, 995 for POP3 over SSL |
| Mail username / password | The mailbox the desk reads |

**Ticket handling**

| Field | Notes |
|---|---|
| Identifier keywords | Comma-separated. If set, an incoming mail must contain one of them or no ticket is created |
| Email prefix | Prepended to the subject of a ticket raised by email, e.g. `[TICKET]` |
| Default tracker | Support |
| Auto-close days | Close a resolved ticket after this many days of silence. Blank or 0 turns it off |

Leave the SMTP fields blank and the project simply uses Redmine's global mail
settings. Leave the incoming fields blank and no mailbox is polled.

---

## 4. The two workspaces

The plugin gives you the same desk from two angles. Which one to use depends on
whether you are looking at one customer's project or across all of them.

### Helpdesk Command Center — across every project

Reached from **Helpdesk** in the top menu. This is a product in its own right:
Redmine's application menu is hidden here and the header reads *Helpdesk
Support*, because the icon rail on the left is how you move around.

| Icon rail | What it is |
|---|---|
| Dashboard | KPI cards, recent tickets, charts |
| Tickets | Every helpdesk ticket, from every project |
| Reports | Five report tabs |
| Organizations | Company records |
| Customers | Customer records, and the portal preview |
| Products | Product catalogue |
| Settings | Holidays · Products · Email Configuration · Canned Responses |

**SLAs** and **Support Levels** have no icon in this rail. You reach them from
inside a project — the SLA tab and Settings › Support Levels respectively —
though both lists are also reachable directly at `/rf_slas` and
`/rf_support_levels`.

### Project helpdesk — inside one project

Reached from the **Helpdesk** tab in the project menu. Same screens, narrowed to
this project, with Redmine's normal project chrome around them.

| Tab | What it is |
|---|---|
| Dashboard | This project's KPIs, prepaid hours per organization, charts |
| Tickets | This project's tickets |
| SLA | SLAs that apply here |
| Organization | Organizations with customers here |
| Knowledgebase | Articles for this project |
| Settings | Holidays · Products · Support Levels |

---

## 5. Tickets, end to end

A helpdesk ticket **is** a Redmine issue on the Support tracker. Everything
Redmine can do to an issue still applies; the plugin adds the customer, the SLA
clock, the conversation and the mail trail.

### 5.1 Three ways a ticket is born

**An agent raises it**

1. Helpdesk › Tickets (or the project's Helpdesk › Tickets).
2. **+ New issue**.
3. Fill in subject, description, priority, product; assign it.
4. Save.

**A customer raises it**

The customer signs in and uses the same New issue button on their project's
helpdesk. They only see their own tickets afterwards.

**A customer emails in**

If incoming mail is configured, the poller checks the mailbox every five
minutes. For a mail to become a ticket:

1. The sender's address must belong to a **registered helpdesk customer** —
   otherwise the mail is rejected and the sender gets a notification saying so.
2. If the project has **identifier keywords**, the subject or body must contain
   one of them.
3. The ticket is created on the Support tracker, with the default priority, and
   the customer as author.
4. If an **email prefix** is configured, it is added to the subject.
5. An acknowledgement goes back out, and both mails are recorded in the ticket's
   Email History.

A reply to an existing ticket's mail thread lands as a note on that ticket
rather than a new one.

### 5.2 Ticket statuses and what they mean

| Status | Meaning |
|---|---|
| New | Raised, not yet picked up |
| In Progress | Being worked. Also set automatically when a customer replies |
| Waiting for Customer Response | Set automatically after an agent replies. **The SLA clock is paused here** |
| Resolved | Fixed, awaiting confirmation |
| Feedback | Needs discussion |
| Closed | Done |
| Rejected | Not actionable |

The two automatic ones are the heart of the workflow — see
[section 9](#9-slas-how-the-clock-actually-works).

---

## 6. The ticket list: filters and columns

Both ticket screens use the plugin's own filter panel, not Redmine's operator
grid. It is built for the questions a support agent actually asks.

### Using it

1. Click **Filters** to open the panel.
2. It opens with two filters: **Status** and **Customer**.
3. Click **Add filter** to bring in any of the others.
4. Set your values and click **Apply**.
5. **Clear** removes everything.

A filter you set stays visible even if it is not one of the defaults, and the
panel opens itself when the URL carries a filter — so a shared link always shows
what is narrowing the list.

### What you can filter on

Status · Customer · Project · Organization · Assignee · Priority · Author ·
Updated by · SLA Status · Ticket # · Subject · Description · % Done · Start date
· Due date · Closed date

Inside a project the **Project** filter is not offered — the project is already
decided.

### Choosing columns

Click **Columns**, tick what you want, Apply. Twenty columns are available; nine
are on by default — a triage set:

Ticket # · Subject · Customer · Organization Name · Status · Priority ·
Assignee · SLA Status · Updated

The rest: Project, Tracker, Author, Support level, Product, % Done, Start date,
Due date, Closed, Created, Updated by.

Click any sortable heading to sort; your filters travel with it, and so does
pagination.

### The SLA Status column

This is a badge, not a countdown — it shows one of seven states:

| Badge | Meaning |
|---|---|
| — No SLA | No SLA applies to this ticket |
| 🟢 *time* On Track | Comfortably inside the deadline |
| 🟡 *time* At Risk | Getting close |
| 🔴 *time* Critical | Two hours or less |
| ⚠ Breached +*time* ago | Past the deadline |
| ▮▮ Paused | Clock stopped — waiting for the customer, or unassigned |
| ✓ Resolved | Met |

### What a customer sees

A customer opening the same screen gets a deliberately smaller one:

| | Agent | Customer |
|---|---|---|
| Tickets | All they can see in the project | **Only tickets they raised** |
| Columns | 20 available | 7 available (no assignee, no organization, no SLA internals) |
| Filters | 15–16 | 5 (Status, Priority, Ticket #, Subject, Description) |

This is enforced where the value is read, not after the query — so a filter typed
directly into the address bar does nothing.

---

## 7. Working a ticket

Open a ticket and you get Redmine's issue page plus the helpdesk additions: the
SLA panel, the customer's organization, the product, and the reply box.

### 7.1 Replying to the customer

1. Click **Reply**.
2. Type your message.
3. Leave **Reply Note** selected.
4. Optionally insert a canned response, and optionally log your time.
5. **Save**.

What happens: the customer is emailed, the status becomes **Waiting for Customer
Response**, the SLA clock **pauses**, and the ticket is assigned to you if it
was unassigned.

### 7.2 Writing an internal note

Same box, but choose **Internal Note**. It is saved as a private note — visible
to your team, never emailed to the customer, and it does not change the status
or pause the clock.

### 7.3 Inserting a canned response

In the reply box, pick a template from **Canned Response**. Its text is appended
to whatever you have typed, with the macros already filled in for this ticket
(see [section 14](#14-canned-responses)).

### 7.4 Merging duplicates

If the same problem arrives twice, open one ticket and use **Merge** to fold it
into the other. Notes and history come across.

---

## 8. Logging the time a reply took

Writing a reply is work, and it is the work most often left unlogged. The reply
box lets you record it without leaving the ticket.

Inside the reply box, above Save/Cancel:

```
Time spent   [5m] [10m] [15m] [20m] [ min ]
Activity *   [ Development ▾ ]
```

1. Click a preset — **5m, 10m, 15m** or **20m** — or type minutes into the box.
2. Pick an **Activity**.
3. Save. The reply and the time entry are saved together.

**How it behaves**

- Optional. Leave it empty and the reply posts with no time logged.
- One value at a time. Clicking another chip switches; clicking the active chip
  clears it; typing in the custom box clears the chips and vice versa.
- The custom box is in **minutes**. Type `35`, not `0.58`.
- Activity is required — a time entry cannot exist without one. If your Redmine
  has a default activity marked, it is pre-selected.
- A **Comment** field appears only if Administration › Settings › Time tracking
  › Required fields asks for it.
- Works on Redmine's own issue page and on the plugin's ticket page.
- Only visible to someone who may log time on the project.

The time lands as an ordinary Redmine time entry, so it shows up in Spent time
reports — and it comes off the organization's prepaid balance automatically.

---

## 9. SLAs: how the clock actually works

This is the part most worth reading properly, because the clock does not simply
count down from the moment a ticket arrives.

### When the clock starts

**On first assignment — not on creation.**

A ticket sitting unassigned has no SLA running. The moment someone is assigned,
the SLA attaches and the response deadline is calculated.

Which SLA attaches:

- Ticket raised by a **customer** → the SLA on their project-access row. If they
  have none, the ticket gets **no SLA**.
- Ticket raised by an **agent or admin** → the first active SLA for this project,
  or a global one.

### The two deadlines

| Deadline | Set when | Met by |
|---|---|---|
| **Response** | The clock starts | The first reply to the customer |
| **Resolution** | Only after the first response is given | Moving the ticket to Resolved |

Resolution is deliberately deferred: measuring it from creation would punish a
team for a ticket that sat in a queue over a weekend.

### Working hours, days and holidays

The clock only advances inside the SLA's working window. A 4-hour response SLA on
09:00–18:00 Mon–Fri, on a ticket assigned at 17:00 on Friday, is due at 12:00 on
Monday — not 21:00 Friday. Configured holidays are skipped the same way.

### When the clock pauses and resumes

| Event | Effect |
|---|---|
| Agent replies to the customer | Status → **Waiting for Customer Response**, clock **pauses** |
| Customer replies | Status → **In Progress**, clock **resumes** |
| Ticket is unassigned | Clock **pauses** |
| Ticket is reassigned | Clock **resumes** — unless it is waiting for the customer |
| Ticket is closed | Clock stops |

Paused time is excluded, so a customer taking three days to answer does not
breach your SLA.

### Breach

When a deadline passes with the clock running, the SLA is marked breached, the
breach time is recorded, notifications go out, and the ticket becomes a candidate
for escalation. The background monitor checks this every two minutes.

### Seeing it on a ticket

The ticket page carries an **SLA Information** panel: which SLA applies, when it
started, both deadlines, whether either is breached, paused time, the current
support level, and the escalation count. **SLA History** shows every change.

---

## 10. Support levels and escalation

Support levels are the ladder a ticket climbs when it is not being resolved.

```
L1  (jessica.wang, ryan.oconnor)
 ↓  escalates to
L2  (natalie.brooks, sneha.patil)
 ↓  escalates to
L3  (claire.dubois, james.harrison)
```

A ticket enters at the level on its customer's project-access row. When the SLA
breaches, the background monitor escalates it: the current level moves up the
chain, the ticket is reassigned to someone at the new level, the escalation count
increases, and a notification goes to the new level's assignees.

A level with no **Escalates to** is the top — a breach there notifies but cannot
climb further.

### What the new assignee is told

The escalation email carries:

- Ticket ID and subject
- Project name and current status
- The previous level and the new level
- The SLA name and which deadline was breached — response or resolution
- How many times this ticket has been escalated
- A direct link to the ticket

If a breach happens at the **top** level, there is nowhere to climb: the
notification still goes out, and administrators receive a critical breach alert.

### Escalation history

Every escalation is recorded and shown on the ticket, under the SLA section:

- From level → to level
- From assignee → to assignee
- The deadlines before and after
- Which breach caused it
- When it happened

Deadlines are **recalculated at each step**, using the working hours, working
days and holidays of the SLA on the ticket — so escalating at 17:55 on a Friday
does not hand the next level an already-expired deadline.

---

## 11. Customers and the portal

### The customer list

**Helpdesk › Customers** lists every customer with their organization, project
count and open ticket count. Search by name, login or email; filter by
organization.

### The customer page (Customer 360)

Click a customer's name — or the eye icon — for everything about them on one
page:

- Identity: login, email, organization, customer since, last login
- KPIs: total tickets, open, waiting on them, breached, resolved
- **Projects & entitlements** — one row per project with its SLA, support level,
  organization and open count
- Recent tickets with their SLA badges

### Portal Preview

The **View portal** button shows you the desk **as that customer sees it** —
their projects, their tickets, nothing else. It is strictly read-only: you cannot
act as them, only look.

Use it when a customer says "I can't see my ticket" — the preview answers whether
that is true in one click.

### What a customer actually gets

Signed in, a customer sees only the projects they have access to, only tickets
they raised, the trimmed column and filter set from
[section 6](#6-the-ticket-list-filters-and-columns), no internal notes, and no
Canned Response or Internal Note controls in the reply box.

---

## 12. Prepaid support hours

For customers who buy a block of support time up front.

A budget belongs to an **organization on one project**. Every change is a
permanent audit entry — nothing is ever overwritten.

### Setting a budget

**Helpdesk › Organizations › [organization] › Prepaid Support Hours › Add / top up hours**

| Field | Notes |
|---|---|
| Project | Which project this budget covers |
| Package | The hours to add. A **negative** number reduces the budget |
| Comment | Required — this is the audit trail |

The number is a **change**, not a new total. On a 40-hour budget, entering `20`
makes it 60; entering `-5` makes it 35. The budget cannot go below zero — an
attempt is refused with a message naming the current total.

### Reading the numbers

| | Meaning |
|---|---|
| **Approved** | Hours bought, the running total of every entry |
| **Used** | Time logged against this organization's tickets on this project |
| **Remaining** | Approved − Used |
| **Over budget** | Used exceeds Approved |

**Used** comes from Redmine time entries, resolved through the ticket author's
organization. So logging 15 minutes on a reply
([section 8](#8-logging-the-time-a-reply-took)) moves this number immediately.

The **Ledger** shows every time entry that made up Used, oldest first, with the
running balance after each — so "where did the 40 hours go" has an answer.

### What happens when hours run out

Set per organization per project, from the **When hours run out** column on the
organization page:

| Mode | Effect |
|---|---|
| **No limit** (default) | Nothing is blocked. The balance simply goes negative |
| **Hard** | Once hours reach zero: the customer cannot raise a new ticket, and nobody can log time on their tickets |
| **Soft** | Both allowed; the balance goes negative with no limit |

All modes leave existing tickets open to replies. Running out stops new work
being started and billed, not a conversation already under way.

---

## 13. Email: in and out

### Outgoing

If a project has SMTP settings, its mail goes out through them, from its own
**Email from** address. If not, Redmine's global mail settings are used. This is
per project, so two desks on one Redmine can mail as two different companies.

Mail is sent when a ticket is created, when an agent replies, when an SLA
breaches or escalates, and when a ticket is auto-closed.

### Incoming

Every five minutes the poller opens each configured mailbox and processes what it
finds — see [section 5.1](#51-three-ways-a-ticket-is-born) for the rules a mail
must pass.

### Email History

Every ticket has an **Email History** tab: each message in and out, with sender,
recipient, subject, body and timestamp. This is the record of what the customer
was actually told.

---

## 14. Canned responses

Reusable reply templates, shared across every project.

**Helpdesk › Settings › Canned Responses › New**

Give it a name (unique) and the body. Use macros and they are filled in when the
template is inserted:

| Macro | Becomes |
|---|---|
| `{{customer_name}}` | The ticket author's name |
| `{{customer_email}}` | Their email |
| `{{ticket_id}}` | `#1042` |
| `{{ticket_subject}}` | The subject |
| `{{project_name}}` | The project |
| `{{assignee_name}}` | Who it is assigned to |
| `{{current_user}}` | You |
| `{{current_date}}` | Today |
| `{{current_time}}` | Now |

Deactivate a response instead of deleting it and it stops being offered while its
history stays intact.

A useful starting set: *Acknowledge receipt*, *Request more information*,
*Resolution confirmation*, *Escalation notice*, *Closure with survey link*.

---

## 15. Products

Products let a ticket say which part of your offering it is about, so reports can
group by it.

**Helpdesk › Settings › Products › New Product**

| Field | Notes |
|---|---|
| Name | Required, unique |
| Code | Required, unique. A short identifier like `PHX-CORE` |
| Category | Free text for grouping |
| Project | Products belong to one project |
| Active | Inactive products are not offered on new tickets |

Pick the product on the ticket form. A product already linked to tickets cannot
be deleted — deactivate it instead.

---

## 16. Holidays

Days an SLA clock should skip.

**Helpdesk › Settings › Holidays › New Holiday** — name, description, start date,
end date. A multi-day closure is one entry with a date range.

Attach them to an SLA in the SLA's **Holidays** field.

> **Names are global and must be unique.** A generic name like *Christmas Day*
> can only exist once across the whole install. If you keep more than one
> calendar, prefix them — `US Federal 2026 - Christmas Day`,
> `India 2026 - Diwali` — or the second calendar cannot be created.

---

## 17. Knowledgebase

Per-project articles, for answers you give more than once.

| Task | How |
|---|---|
| Create | Project › Helpdesk › Knowledgebase › New article. Title and rich-text body |
| Nest | Create the child from the parent article, giving a tree |
| Edit | Open and edit in place. Every save keeps a version |
| Version history | Compare versions and restore an older one |
| Attachments | Add and remove files on an article |
| Search | Search box across titles and content |
| Share | Generate a link to send a customer |
| Export | Download an article as PDF |

Controlled by three permissions — `add_kb_page`, `edit_kb_page`,
`delete_kb_page` — so you can let agents write while only leads delete.

---

## 18. Reports

**Helpdesk › Reports** — five tabs, each with a date range and filters for
assignee, status, priority and project.

| Tab | Answers |
|---|---|
| **Ticket Summary** | Volume, status mix, priority mix, trend over time |
| **SLA Analytics** | Overall compliance %, response vs resolution compliance, total breaches, breaches by priority and project, weekly compliance trend, recent breached tickets |
| **Agent Performance** | Per agent: total, resolved, open, average response and resolution time, breaches, breach rate, escalations, plus a workload chart |
| **Organizations** | The same figures grouped by customer company |
| **Projects** | The same figures grouped by project |

Set the range and filters, click **Apply**, then **Export** — **CSV**, **Excel**
or **PDF**. Exporting needs the `export_helpdesk_reports` permission.

---

## 19. What runs in the background

Three scheduled jobs, run by Sidekiq. **Without Sidekiq running, none of this
happens** — no escalation, no incoming mail, no auto-close.

| Job | Every | What it does |
|---|---|---|
| SLA monitor | 2 minutes | Checks deadlines, marks breaches, sends notifications, escalates to the next support level |
| Email poller | 5 minutes | Opens each project's mailbox and turns new mail into tickets or replies |
| Auto-close | 2 minutes | Closes resolved tickets that have been silent longer than the project's *Auto-close days* |

You can run any of them by hand — see [section 23](#23-rake-tasks).

---

## 20. Permissions

Set per role at **Administration › Roles and permissions**, under *Helpdesk*.

| Permission | Grants |
|---|---|
| `view_helpdesk` | See the helpdesk screens, tickets and reports; create and edit tickets |
| `manage_helpdesk` | Everything in view, plus managing the desk's configuration and exporting reports |
| `export_helpdesk_reports` | Export reports to CSV/Excel |
| `manage_prepaid_support_hours` | Set and adjust prepaid budgets, and choose what happens when they run out |
| `add_kb_page` | Create knowledgebase articles |
| `edit_kb_page` | Edit them |
| `delete_kb_page` | Delete them and their attachments |

Two things are **administrator-only** regardless of role: saving a project's
email configuration, and the API documentation page.

Logging time on a reply follows Redmine's own `log_time` permission.

---

## 21. Every screen and its URL

**Global — Helpdesk Command Center**

| Screen | URL |
|---|---|
| Dashboard | `/rf_helpdesk` |
| Tickets | `/rf_helpdesk/issues` |
| Settings | `/rf_helpdesk/setting` |
| Organizations | `/rf_organizations` |
| Customers | `/rf_customers` |
| Customer page | `/rf_customers/:id` |
| Portal preview | `/rf_customers/:id/portal` |
| Products | `/rf_products` |
| SLAs | `/rf_slas` |
| SLA history | `/rf_slas/:id/history` |
| Support levels | `/rf_support_levels` |
| Holidays | `/rf_helpdesk_holidays` |
| Canned responses | `/rf_canned_responses` |

**Reports**

| Report | URL |
|---|---|
| Ticket summary | `/rf_helpdesk/reports/tickets` |
| SLA analytics | `/rf_helpdesk/reports/sla` |
| Agent performance | `/rf_helpdesk/reports/agents` |
| Organizations | `/rf_helpdesk/reports/organizations` |
| Projects | `/rf_helpdesk/reports/projects` |

**Per project**

| Screen | URL |
|---|---|
| Dashboard | `/projects/:id/helpdesk` |
| Tickets | `/projects/:id/helpdesk/tickets` |
| SLA | `/projects/:id/helpdesk/sla` |
| Organization | `/projects/:id/helpdesk/organization` |
| Knowledgebase | `/projects/:id/helpdesk/knowledgebase` |
| Settings | `/projects/:id/helpdesk/settings` |
| New ticket | `/projects/:id/helpdesk/new` |
| Ticket | `/projects/:id/helpdesk/issues/:ticket_id` |

**Per ticket**

| | URL |
|---|---|
| Email history | `/issues/:id/email_history` |

---

## 22. REST API

Base path `/helpdesk/api/v1/`, JSON only. Authenticate with an
`X-Redmine-API-Key` header (or `?key=`). Enable the REST API first at
Administration › Settings › API.

Interactive documentation — try any endpoint from the browser — is at
**`/helpdesk/swagger`** (administrators only).

What is available:

| Area | Endpoints |
|---|---|
| Tickets | list, show, create, update, delete, merge |
| Conversations | list and add replies on a ticket |
| Email histories | the mail thread for a ticket |
| SLA status | show, pause, resume, escalate |
| Organizations | full CRUD, toggle active |
| Customers | full CRUD |
| Project customers | full CRUD, scoped to a project |
| Prepaid support hours | list, show, create |
| Email config | show, create, update — one per project |
| SLAs | full CRUD, history, toggle active |
| Support levels | full CRUD, toggle active |
| Products | full CRUD, toggle active |
| Holidays | full CRUD |
| Canned responses | full CRUD, process macros |
| SLA analytics | the SLA report as JSON |

---

## 23. Rake tasks

Run from your Redmine root.

| Task | What it does |
|---|---|
| `rake redmineflux_helpdesk:check_sla` | Run the SLA monitor once — deadlines, breaches, escalations |
| `rake redmineflux_helpdesk:check_emails` | Poll every configured mailbox once |
| `rake redmineflux_helpdesk:auto_close_tickets` | Run the auto-close pass once |
| `rake redmineflux_helpdesk:seed_demo_data` | Create a *Helpdesk Support* project full of realistic demo data |
| `rake redmineflux_helpdesk:seed_reports` | Seed data for exercising the reports |

The demo seeder is safe to run on an instance that already has data: it only
adds, never modifies or deletes what it did not create, and running it twice
creates nothing twice. `TICKETS=50` changes how many tickets it makes.

---

## 24. Troubleshooting

**A ticket shows "No SLA"**

The customer has no SLA on their project-access row. Open
Helpdesk › Customers › [customer] and set one. Remember that customers get no
fallback on purpose.

**The SLA clock is not moving**

Check three things, in order: is the ticket **assigned** (the clock starts on
first assignment); is it **Waiting for Customer Response** (paused by design); is
it inside the SLA's **working hours and days**.

**Nothing escalates, and no mail arrives**

Sidekiq is not running. Check it, then run `rake redmineflux_helpdesk:check_sla`
by hand to confirm the logic works.

**A customer emails in and no ticket appears**

In order: is the sender a **registered helpdesk customer** with that exact
address; does the project have **identifier keywords** the mail does not contain;
are the incoming mail settings correct and the mailbox reachable; is Sidekiq
running.

**A customer says they cannot see their ticket**

Open their customer page and click **View portal**. That shows exactly what they
see. Usually the ticket is in a project they have no access row for.

**The reply box has no time-spent section**

You lack `log_time` on the project, or the Time tracking module is off, or the
ticket is closed and Redmine's *Accept time logs on closed issues* setting is
off.

**Cannot save a time entry — "Activity can't be blank"**

No default activity is marked. Either pick one in the reply box each time, or
mark one default at Administration › Enumerations › Activities.

**"Package" on the top-up form asks for a name but wants a number**

It takes a number of hours — the label was renamed but the field is unchanged.
Enter `20`, or `-5` to reduce.

**Cannot create a holiday — name already taken**

Holiday names are unique across the whole install. Prefix yours with the calendar
it belongs to.

**The Helpdesk tab is not visible in a project**

The Helpdesk module is off (Project › Settings › Modules), or your role has
neither `view_helpdesk` nor `manage_helpdesk`.

**An organization or customer is missing from a dropdown**

Check it is marked **Active**. Inactive records are deliberately not offered on
new work, so that retiring one does not break its history.

**"Waiting for Customer Response" is not being set automatically**

Three things to check: the reply was a **public** reply, not an internal note —
only public replies move the status; the **Waiting for Customer Response** status
exists in Administration › Issue statuses; and that status is reachable in the
workflow for the Support tracker and your role.

**Escalation emails are not arriving**

In order: is Sidekiq running; is Redis reachable; does the Sidekiq log show
`SlaMonitorWorker` failing; does the support level have an **Escalates to**
level; is the SLA **Active**; is the ticket **assigned** (an unassigned ticket
has a paused clock and cannot breach).

**A report shows no data**

The date range may not cover any activity. Otherwise: does your role have
`view_helpdesk` on the projects in question, and do the tickets actually have
SLAs attached — a ticket whose customer has no SLA contributes nothing to SLA
figures.

**The Knowledgebase tab is not visible**

The Helpdesk module is off on the project, or your role lacks `view_helpdesk`.

**A customer cannot see a Knowledgebase article**

Check the article is published rather than a draft, and that the customer's role
can view KB pages on that project.

**A customer cannot sign in**

Their Redmine account may not be active — check Administration › Users. Then
check they have a **project access** row: open Helpdesk › Customers › the
customer and look at *Projects & entitlements*. Without a row they can sign in
but see nothing.

**An internal note appeared to the customer**

Confirm **Internal Note** was selected before saving — an internal note is
stored as a Redmine private note. Then confirm the customer's role does **not**
have `view_private_notes`, which would let them read every private note.

**The SLA Information panel is missing from a ticket**

Three causes: the ticket is not on the **Support** tracker; the customer has no
SLA on their project-access row; or the SLA is inactive.

**A new install has no trackers, priorities or roles**

Redmine's default data was never loaded, and the plugin now blocks the loader.
See the note at the end of [section 2](#2-before-you-begin).

---

## 25. Frequently asked questions

**Who can use the helpdesk?**
Administrators, and any project member whose role has `view_helpdesk` or
`manage_helpdesk`. There is no special "agent" account type — it is a role
permission.

**How does an SLA get onto a ticket?**
From the **customer's project-access row** — the SLA you chose when you gave
them access to that project. Not from their organization, which is only used for
grouping and for prepaid budgets. It attaches when the ticket is **first
assigned**.

**Can a customer raise a ticket without signing in?**
Yes, by email, if incoming mail is configured for the project. The sender's
address must belong to a registered helpdesk customer.

**How do escalations decide where to go?**
By the support-level chain, not by priority. On an SLA breach the ticket moves
from its current level to that level's **Escalates to** level and is reassigned
to someone there.

**Does the SLA clock pause when an agent replies?**
Yes. The ticket moves to **Waiting for Customer Response** and the clock stops
until the customer replies.

**What if a customer replies to a resolved ticket?**
It moves back to **In Progress** and the clock resumes.

**Who is told about a breach?**
The assignees at the next support level. At the top level, where there is no
next, administrators get a critical breach alert.

**Can reports be exported?**
Yes — all five, as CSV, Excel or PDF. Needs `export_helpdesk_reports`.

**Can customers read internal notes?**
No, provided their role does not have Redmine's `view_private_notes`. An
internal note is a Redmine private note, so that permission is what governs it.

**Where do I see a ticket's full SLA story?**
The **SLA Information** panel on the ticket: deadlines, breaches, paused time,
current level, and every escalation in order.

**Can I see who changed an SLA policy?**
Yes. Open the SLA and click **History** — each change is logged with the action,
the user, the time and what changed.

**Do Knowledgebase share links work without signing in?**
No. The share link resolves to the article's normal URL, which sits behind
Redmine's usual authentication. Anyone you send it to still needs an account
with access to that project.

---

## 26. Feature checklist for testers

Every feature, as something to do and something to expect. Walk it top to
bottom: the later groups assume the earlier ones passed.

Two accounts make this much faster — an **agent** (a project member with
`manage_helpdesk`) and a **customer**. Keep both signed in, in separate
browsers.

### A. Setup and prerequisites

- [ ] A tracker named **Support** exists in Administration › Trackers
- [ ] Turning on the **Helpdesk** module adds a Helpdesk tab to the project menu
- [ ] Turning it off removes the tab and makes the helpdesk URLs inaccessible
- [ ] The Support tracker is enabled on the project, and appears on the new-ticket form
- [ ] Sidekiq and Redis are running (nothing below in group N, O or V works otherwise)

### B. Navigation and chrome

- [ ] **Helpdesk** appears in the top menu for an agent
- [ ] The Command Center hides Redmine's application menu, and the header reads *Helpdesk Support*
- [ ] The icon rail reaches Dashboard, Tickets, Reports, Organizations, Customers, Products, Settings
- [ ] A project's Helpdesk tab keeps Redmine's normal project menu and the project name
- [ ] Opening a product from the **global** Products list stays in the Command Center — it does not switch to project chrome
- [ ] Every list screen has a search box, and the search survives paging to page 2

### C. Organizations

- [ ] Create an organization — name is required
- [ ] A duplicate name is refused
- [ ] Website, phone, address, employee count, billing info and notes all save and display
- [ ] Deactivating one stops it being offered on new work but keeps its history
- [ ] An organization linked to customers cannot be deleted silently — you get a clear message

### D. Customers and entitlements

- [ ] Create a customer — the account is created and flagged as a helpdesk customer
- [ ] **Project access**: add a project with an SLA, support level and organization
- [ ] Add a second row, save, and both survive a reload
- [ ] Removing a row removes only that project's access
- [ ] The **support level** dropdown only offers members of the project you picked
- [ ] Saving as a manager who administers only project A does not disturb the customer's access to project B
- [ ] The customer list shows organization, project count and open-ticket count
- [ ] The **eye icon** opens the customer's detail page, not the portal
- [ ] Customer 360 shows identity, KPIs, *Projects & entitlements* and recent tickets
- [ ] Its open-ticket count matches the number on the customer list

### E. SLAs

- [ ] Create an SLA — name required, and unique
- [ ] Response and resolution times save with their units (minutes / hours)
- [ ] Working hours, working days and holidays all save
- [ ] Leaving **Project** blank makes it available to every project
- [ ] Deactivating one stops it being offered when linking a customer
- [ ] **History** shows each change with the action, the user, the time and what changed

### F. Support levels and escalation

- [ ] Create L1, L2 and L3 for one project — each needs at least one assignee
- [ ] A duplicate name is refused
- [ ] Set L1 → L2 and L2 → L3; L3 has no *Escalates to*
- [ ] A user already on one level is not offered on another level in the same project
- [ ] Create levels in a **second** project — the assignee dropdown is populated there too
- [ ] Deactivating a level stops it being offered and stops it being escalated into

### G. Holidays

- [ ] Create a holiday with a name, start date and end date
- [ ] A multi-day closure saves as one entry with a range
- [ ] A **duplicate name is refused** — names are unique across the whole install
- [ ] Attaching holidays to an SLA saves, and they show on the SLA

### H. Products

- [ ] Create a product — name and code both required and unique
- [ ] Category and description save
- [ ] Deactivating one stops it appearing on new tickets
- [ ] A product linked to tickets cannot be deleted — you get a clear message, not a crash
- [ ] Picking a product on a ticket saves and displays on the ticket

### I. Canned responses

- [ ] Create one with a unique name and body
- [ ] All nine macros render on a real ticket: `{{customer_name}}`, `{{customer_email}}`, `{{ticket_id}}`, `{{ticket_subject}}`, `{{project_name}}`, `{{assignee_name}}`, `{{current_user}}`, `{{current_date}}`, `{{current_time}}`
- [ ] Selecting a template **appends** to what you already typed rather than replacing it
- [ ] Deactivating one removes it from the reply box dropdown
- [ ] A **customer** sees no Canned Response dropdown at all

### J. Tickets — creation

- [ ] An agent can raise a ticket from the global Tickets screen
- [ ] An agent can raise one from the project's Tickets screen
- [ ] A **customer** can raise one, and it is authored by them
- [ ] The ticket lands on the Support tracker
- [ ] A ticket raised by a customer with an SLA gets one; one raised by a customer **without** an SLA gets **No SLA**

### K. Ticket list — filters and columns

- [ ] Redmine's operator query form is **gone** from both ticket screens
- [ ] The panel opens with two filters: Status and Customer
- [ ] **Add filter** reveals a filter and removes it from the menu
- [ ] Removing a filter clears its value and returns it to the menu
- [ ] A removed filter genuinely stops narrowing the results
- [ ] A filter set in the URL is shown even though it is not a default, and the panel opens itself
- [ ] The active-filter count is correct
- [ ] **Apply** narrows the list and the filter survives in the URL
- [ ] **Clear** removes every filter
- [ ] A filter matching nothing shows the filtered empty state, not the "no tickets yet" one
- [ ] Inside a project, **no Project filter is offered**
- [ ] Sorting a column keeps the current filter, and stays on the same screen's URL
- [ ] Paging keeps filters and sort
- [ ] The column picker lists 20 columns with 9 ticked
- [ ] Choosing columns changes the table
- [ ] Apply / Clear / Add filter are the same height and properly styled

### L. Working a ticket

- [ ] **Reply** opens the reply box
- [ ] A reply emails the customer and appears in Email History
- [ ] After an agent reply the status becomes **Waiting for Customer Response**
- [ ] An **Internal Note** is saved private, is not emailed, and does **not** change the status
- [ ] A customer cannot see an internal note
- [ ] An unassigned ticket becomes assigned to whoever replies
- [ ] **Cancel** clears the box, including the time controls
- [ ] Merging one ticket into another carries notes and history across

### M. Reply time log

- [ ] The **Time spent** block appears above Save/Cancel, on both Redmine's issue page and the plugin's ticket page
- [ ] Chips are pill-shaped and styled — not raw square buttons (proves the stylesheet reached the page)
- [ ] Four presets: 5m, 10m, 15m, 20m
- [ ] Clicking a second chip switches to it; the first clears
- [ ] Clicking the active chip clears it
- [ ] Typing in the custom box clears the chips, and clicking a chip clears the box
- [ ] Saving with **10m** creates a time entry of 0.17 h — ten minutes, **not ten hours**
- [ ] A custom **35** creates 0.58 h
- [ ] Saving with no time selected creates no time entry
- [ ] Choosing time with **no activity** is refused with a message, and nothing is submitted
- [ ] A non-numeric custom value is refused
- [ ] The Comment field appears **only** when Administration › Settings › Time tracking › Required fields asks for it
- [ ] A user without `log_time` does not see the block at all
- [ ] A **customer** does not see the block

### N. SLA behaviour — the clock

- [ ] A **new unassigned** ticket has no clock running
- [ ] **Assigning** it starts the SLA and sets a response deadline
- [ ] The SLA Information panel shows the SLA name, start, both deadlines, level and escalation count
- [ ] The resolution deadline is **not** set until the first response is given
- [ ] Replying to the customer **pauses** the clock, and the badge reads Paused
- [ ] The customer replying **resumes** it and moves the ticket to In Progress
- [ ] **Unassigning** pauses the clock; reassigning resumes it
- [ ] A ticket outside working hours does not consume SLA time
- [ ] A ticket over a configured holiday does not consume SLA time
- [ ] Letting a deadline pass marks it breached, with the breach time recorded
- [ ] The SLA Status badge shows the right state: On Track / At Risk / Critical / Breached / Paused / Resolved / No SLA
- [ ] On breach the ticket escalates to the next level and is reassigned there
- [ ] The new assignee is emailed, and the mail names the old and new level, the SLA and the breach type
- [ ] A breach at the **top** level notifies but does not escalate further
- [ ] Escalation history records from/to level, from/to assignee, old and new deadlines, and the reason
- [ ] Deadlines are recalculated at each escalation using the SLA's working hours

### O. Email — incoming

- [ ] Configure a mailbox on a project (admin only — a non-admin manager sees a note instead of the form)
- [ ] Mail from a **registered customer** becomes a ticket
- [ ] Mail from an **unknown** sender does not, and the sender is told so
- [ ] With **identifier keywords** set, mail containing one becomes a ticket
- [ ] Mail **not** containing one does not
- [ ] With an **email prefix** set, the new ticket's subject carries it — check the ticket in the list, not just the log
- [ ] A reply to the thread lands as a note on the same ticket, not a new one
- [ ] Both the inbound mail and the acknowledgement appear in Email History

### P. Email — outgoing

- [ ] A project with SMTP settings sends from its own address
- [ ] A project **without** them falls back to Redmine's global mail settings
- [ ] Two projects with different settings mail as two different senders
- [ ] Email History shows direction, addresses, subject, body and timestamp

### Q. Prepaid support hours

- [ ] Set a budget for an organization on a project — comment is required
- [ ] Entering a **positive** number increases the approved total
- [ ] Entering a **negative** number decreases it
- [ ] An attempt to go **below zero** is refused, naming the current total, and nothing changes
- [ ] Every entry is kept — the history shows the change, the new total and the previous total
- [ ] **Used** rises when time is logged on that organization's tickets
- [ ] **Remaining** is Approved − Used, and goes negative when over budget
- [ ] The **Ledger** lists each time entry with the running balance after it
- [ ] The organization page and the project dashboard show the same figures
- [ ] **No limit** mode blocks nothing
- [ ] **Hard** mode, at zero hours: the customer cannot raise a new ticket, and nobody can log time on their tickets
- [ ] **Soft** mode allows both and lets the balance go negative
- [ ] In every mode, existing tickets can still be replied to

### R. Knowledgebase

- [ ] Create an article with a title and rich-text body
- [ ] Create a child article — the tree renders
- [ ] Editing keeps a version; version history lists them
- [ ] An older version can be compared and restored
- [ ] Attachments can be added and removed
- [ ] Search finds an article by title and by body text
- [ ] Share generates a link — and that link still requires signing in
- [ ] Export produces a PDF
- [ ] A role without `add_kb_page` cannot create; without `edit_kb_page` cannot edit; without `delete_kb_page` cannot delete
- [ ] A **customer** cannot create, edit or delete an article

### S. Reports

- [ ] All five tabs load: Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects
- [ ] The date range filters the figures
- [ ] Assignee, status, priority and project filters all narrow the results
- [ ] SLA Analytics shows compliance %, response vs resolution, total breaches, breaches by priority and project
- [ ] The breached-tickets list matches the tickets you actually breached in group N
- [ ] Agent Performance shows per-agent totals, response and resolution times, breach rate and escalations
- [ ] Charts render with no load animation
- [ ] Export produces CSV, Excel and PDF
- [ ] A role **without** `export_helpdesk_reports` cannot export

### T. What the customer sees

- [ ] A customer signing in sees only their entitled projects
- [ ] They see **only tickets they raised** — not a colleague's, not an agent's
- [ ] Their column picker offers 7 columns, with no assignee, organization or SLA internals
- [ ] Their filter panel offers 5 filters, with no customer, organization, assignee, author or updated-by
- [ ] Typing `?customer_id[]=…` or `?assigned_to_id[]=…` into their URL changes nothing
- [ ] Sorting by a column they are not offered falls back to the default
- [ ] They cannot see internal notes
- [ ] The reply box shows them no Canned Response, no Internal Note and no time log
- [ ] **Portal Preview** from Customer 360 shows exactly this, and is read-only
- [ ] Previewing a project the customer is not linked to is refused

### U. Permissions

- [ ] `view_helpdesk` alone: can see screens, tickets and reports
- [ ] `manage_helpdesk`: can also manage configuration and export
- [ ] Neither: the Helpdesk tab is absent and the URLs are refused
- [ ] `export_helpdesk_reports` controls the Export button
- [ ] `manage_prepaid_support_hours` controls setting a budget and the run-out mode
- [ ] Saving a project's email configuration is **admin only**
- [ ] The Swagger page at `/helpdesk/swagger` is **admin only**

### V. Background jobs

- [ ] With Sidekiq stopped, a breach does not escalate
- [ ] With it running, the SLA monitor picks the breach up within two minutes
- [ ] The email poller collects new mail within five minutes
- [ ] Auto-close closes a resolved ticket after the project's *Auto-close days* of silence
- [ ] Blank or 0 auto-close days turns auto-close off
- [ ] Each job can be run by hand with its rake task and does the same thing

### W. REST API

- [ ] `/helpdesk/api/v1/` responds with an API key and refuses without one
- [ ] Tickets: list, show, create, update, delete, merge
- [ ] Conversations: list and create on a ticket
- [ ] SLA status: show, pause, resume, escalate
- [ ] Organizations, customers, project customers, SLAs, support levels, products, holidays, canned responses: full CRUD
- [ ] Prepaid support hours: list, show, create
- [ ] Email config: show, create, update — one per project
- [ ] `process_macros` substitutes against a real ticket
- [ ] `sla_analytics` returns the SLA report as JSON
- [ ] `/helpdesk/swagger` loads and its **Try it out** works

### X. Rake tasks

- [ ] `check_sla` runs the monitor once and does what the scheduled job does
- [ ] `check_emails` polls the mailboxes once
- [ ] `auto_close_tickets` runs the auto-close pass once
- [ ] `seed_demo_data` creates a *Helpdesk Support* project with customers, SLAs, levels, products and tickets
- [ ] Running it twice creates nothing twice
- [ ] It reports which existing records it reused, and leaves them unmodified
- [ ] Seeded tickets are spread over past dates, not all stamped now
- [ ] Seeded tickets show a spread of SLA states, not all the same

---

*Every behaviour described here was read from the code, not assumed. Where the
plugin does something surprising — the SLA starting on assignment rather than
creation, customers getting no SLA fallback, holiday names being global — it is
called out where you would meet it.*
