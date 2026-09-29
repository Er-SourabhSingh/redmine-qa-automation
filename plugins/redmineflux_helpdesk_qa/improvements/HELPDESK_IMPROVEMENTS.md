# Helpdesk Plugin — User-Friendliness Improvements

> This file is **not a bug list**. Everything below is working as coded — nothing here is a defect against the plugin's own documented behavior. These are usability/UX suggestions from a walkthrough of the plugin as an Admin, done 2026-09-28. Screenshots referenced below are in `screenshots/UX-REVIEW-2026-09-28/`.

---

## 1. Ticket lists wrap the Subject into 5–8 lines per row — the single biggest readability problem

**Where:** Helpdesk Tickets (`/rf_helpdesk/issues`), and the Dashboard's "Recent Tickets" widget.

**What it looks like today:** see `ticket-list.png`. The Subject column is narrow (roughly a fifth of the row's width) while Customer, Organization Name, Status, Priority and Assignee each get a fixed, generous column. A subject like "BUG-HLP-037 retest 2026-09-28 - Hard mode at zero hours new ticket test (rounding fix)" wraps across 6 lines. Every row on the page ends up 150–200px tall, so only 6–7 tickets are visible per screen on a 397-ticket list — an agent has to scroll constantly just to triage a queue.

**Why it matters:** Subject is the one column an agent actually reads to know what a ticket is about; everything else is a short badge or a name. Today the layout gives the least space to the thing that needs the most.

**Suggested fix:**
- Let the Subject column flex to fill remaining width, and truncate long subjects with an ellipsis + a native `title` tooltip (or a hover card) showing the full text, instead of wrapping.
- Where the real subject really is this long (a lot of this test data mirrors real support-ticket titles), a two-line clamp (`-webkit-line-clamp: 2`) reads far better than an unbounded wrap.
- Same fix applies to the Dashboard's "Recent Tickets" table, which has the identical layout.

---

## 2. A ticket's Helpdesk-specific fields (Organization, Customer, Prepaid Support Hours) sit at the very bottom of a long attribute list

**Where:** any ticket detail page. See `ticket-detail.png`.

**What it looks like today:** the attribute block on a ticket lists Status, Priority, Assignee, Start date, Due date, Progress, Estimated time, then every custom field configured on this tracker (many, on this instance), and only *after all of that* does Organization, Customer, and the "14.92h used · 6.75h left of 21.67h" Prepaid Support Hours line appear.

**Why it matters:** for a helpdesk agent, "which organization is this, and how much budget do they have left" is usually one of the first things worth knowing when opening a ticket — right up there with Priority and Assignee. Today it's the last thing on the page, below fields most tickets leave blank.

**Suggested fix:** move Organization / Customer / Prepaid Support Hours into their own small block directly under Status/Priority/Assignee, ahead of the generic custom-field list. Consider a compact one-line summary card at the very top of the ticket (next to the "OPEN" status badge) for the two things that matter most at a glance: SLA state and budget remaining.

---

## 3. SLA state isn't visible on the ticket itself — only in the list view or a separate tab

**Where:** ticket detail page.

**What it looks like today:** the Helpdesk Tickets list has an "SLA Status" column (Breached / At Risk / On Track / Paused / N/A), but once you actually open a ticket, that badge disappears — the only place to check SLA state is a separate "SLA Information" tab (Overview / Journey / Activity Log tables), which requires an extra click and a context switch away from the ticket's own description and replies.

**Why it matters:** the moment an agent is most likely to want SLA context is exactly when they're reading the ticket and about to reply — not one click removed from it.

**Suggested fix:** put the same badge already used in the list (Breached/At Risk/On Track/Paused) next to the ticket's status badge at the top of the detail page. The full SLA Information tab can stay as-is for the detailed journey/history view; this is just surfacing the one-word state that's already computed and shown elsewhere.

---

## 4. Dashboard "View All" link scoping — SLA Breached ignores the active date range

**Where:** Helpdesk Dashboard stat cards. See `dashboard.png`.

**What it looks like today:** the **SLA Breached** card's link (`?sla=breached`) drops the dashboard's own date-range filter entirely, while every other card's link keeps it — so its count and its "View All" click aren't necessarily describing the same date window.

**Why it matters:** an admin who trusts a stat card's number and clicks "View All" expecting exactly that filtered list can get a different, larger list than expected, without any indication that happened.

**Suggested fix:** every card's "View All" link should apply the exact filter that produced its own number, including the active date range.

> The dashboard's **"On Hold"** card was originally item #4 here, but turned out to be a correctness defect, not a UX suggestion — this instance has no "On Hold" status at all, and the card's count is just Open + Resolved (i.e. the total) under a false label. Filed as **BUG-HLP-067**.

---

## 5. Organizations list has no Active/Deactivated column, and no summary of what's inside each org

**Where:** `/rf_organizations`. See `organizations.png`.

**What it looks like today:** the list has a Status filter dropdown ("All Statuses") implying organizations can be Active or Deactivated, but the table itself has no Status column — you can't tell which orgs are deactivated without filtering for them or opening each one. The table also has no linked-customers count, linked-projects count, or budget summary (total remaining hours, or "budget exhausted" flag) — an admin scanning for "which organizations need attention" has to open every row individually.

**Suggested fix:** add a Status column (matching the filter that already exists), and consider a compact "Linked customers / projects" count and an "Any budget exhausted?" indicator, so the list itself answers the two questions an admin actually opens this page to ask.

---

## 6. Empty custom fields clutter the ticket attribute panel

**Where:** ticket detail page, when the tracker has many custom fields configured.

**What it looks like today:** on this instance, a ticket can show 15+ custom field labels with nothing next to them (e.g. "Documentation Update Required:", "Rollback Procedure Description:", "Escalation Contact Person Name:") before reaching any field that's actually filled in. This instance's own custom-field set is unusually large from months of QA work across many test suites, so this specific density won't match a typical production Helpdesk project — but the underlying pattern (Redmine shows every configured custom field, filled or not) applies to any project with more than a handful of them.

**Suggested fix:** a "hide empty fields" toggle (remembered per user, defaulting to on) on the ticket view would keep the panel readable regardless of how many custom fields a project accumulates over time.

---

## 7. Everything you learned across the Customer / Organization / Support Package / SLA setup flow is real friction, not just a data-model gap

The three bugs filed today (BUG-HLP-064, BUG-HLP-065, and the "no budget = unrestricted access" note added to BUG-HLP-064) are about *correctness* — data ending up in a contradictory state. But the same walkthrough surfaced pure usability friction worth listing here too, independent of whether those bugs get fixed:

- **Setting up one customer on one project currently means filling five separate dropdowns per row** (Project, Support Package, SLA Name, Support Level, Organization Name), several of which duplicate or contradict each other depending on what's picked elsewhere on the same row. Even without changing the underlying model, grouping "SLA Name" and "Support Level" together as a single "Service Level" concept in the UI, and moving "Organization Name" to render once at the top of the Project access section instead of once per row, would make the form far less repetitive to fill out for a customer with several projects.
- **The top-up dialog's Support Package field currently defaults to "-- No package --"** with no visual cue that this is unusual — a Comment field is required, but the package isn't, even though it decides the SLA. A required field reads as "this matters"; an optional one next to it reads as "this doesn't." Right now the more consequential field is the optional-looking one.
- **Support Package's "Default Support Level" dropdown lists every project's levels in one flat list** ("Helpdesk QA Alpha — L1", "Helpdesk QA Beta — AB-L1", "Redmineflux Helpdesk — L1 - Helpdesk Support", …) with the project name prefixed onto every option — a sign the field is trying to be project-aware inside a form that has no project context at all. That mismatch is itself a usability tell, independent of whether the field should exist there at all (see BUG-HLP-065's recommended fix).

---

## Open items not yet explored

This pass covered Admin's view of the Dashboard, Ticket list, a ticket detail page, Reports, and Organizations. Not yet reviewed with this same lens: the Customer-facing Portal (a customer's own dashboard/ticket view), Knowledgebase browsing, Canned Responses, and Helpdesk Settings' remaining tabs (Email Configuration, Holidays, Products). Worth a follow-up pass if useful.
