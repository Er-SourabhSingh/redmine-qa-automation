# Test Cases — Redmineflux Helpdesk — Features 5–8: Navigation & Workspaces

> Source: `docs/HELPDESK_FEATURES_LIST.md` #5–8 (category B: Command Center, project-level Helpdesk tab, Dashboard, Global search). Grounded in `docs/HELPDESK_USER_GUIDE.md` §4 (The two workspaces), §21 (Every screen and its URL), and tester checklist §26 group B (Navigation and chrome).

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-147: "Helpdesk" appears in the top menu for an agent and opens the Command Center

**User Role:** Agent
**Precondition:** Agent has `view_helpdesk` and `manage_helpdesk` on at least one project.

**Steps:**
1. Log in and look at Redmine's top application menu
2. Click **Helpdesk**

**Expected Result:**
- **Helpdesk** is present in the top menu
- Clicking it opens the Helpdesk Command Center

- **Revision History (2026-09-02):** Precondition corrected from "`view_helpdesk` **or** `manage_helpdesk`" to "`view_helpdesk` **and** `manage_helpdesk`" per explicit user correction — `manage_helpdesk` is the real, deliberate gate on the top-menu link (confirmed via `init.rb` source, see below), so this TC now tests the combination that's actually meant to succeed, rather than conflating it with the `view_helpdesk`-only case.
- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test` — real fixture with both `view_helpdesk` and `manage_helpdesk` via a genuine project Membership, not admin): **PASS.** Logged in fresh — top menu shows "Helpdesk Command Center" correctly, clicking it opens the Command Center Dashboard (7-item icon rail, KPI cards). Confirms the corrected precondition is what the plugin actually requires: `manage_helpdesk` is the permission the top-menu `if:` condition checks (`User.current.allowed_to?(:manage_helpdesk, nil, global: true)`, confirmed via `init.rb`), and it's paired with `view_helpdesk` on every real Agent-tier fixture that has it, not held alone.
- **Note — the `view_helpdesk`-only case (not this TC's scope under the corrected precondition)**: `luna.blossom` (a real active Agent fixture with `view_helpdesk` only, no `manage_helpdesk`) does NOT see "Helpdesk" in her top menu at all — identical to a zero-permission user (`zero.perm.user`, created for side-by-side comparison). Her project-level access is unaffected (`/projects/helpdesk-qa-alpha`'s own Helpdesk tab still works). This was originally tested as this TC's main scenario under the "or" precondition and filed as **BUG-HLP-027** — with the precondition now corrected to "and", that finding no longer describes a failure of this TC, since `view_helpdesk` alone was never meant to satisfy it. **Resolved same day: BUG-HLP-027 retracted as Not a Bug** per explicit user direction — this is confirmed-deliberate `manage_helpdesk` gating, not a defect (see `bugs/closed/BUG-HLP-027.md`).

---

### TC-HLP-148: The Command Center hides Redmine's application menu and shows its own header

**User Role:** Agent
**Precondition:** Command Center open.

**Steps:**
1. Observe the page chrome — top menu and header

**Expected Result:**
- Redmine's normal application menu is hidden
- The header reads **Helpdesk** *(corrected 2026-09-02, per Product Owner request — previously documented as "Helpdesk Support", now outdated wording)*

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test` — real `manage_helpdesk` via a genuine project Membership, not admin): **PASS, both halves.** Direct DOM inspection (`browser_evaluate`, not just the accessibility snapshot), enumerating every `<ul>` on the page: `<h1>` reads `"Helpdesk"` — matches the corrected Expected Result above (the "Helpdesk Support" wording was outdated documentation, confirmed by the Product Owner; see `bugs/closed/BUG-HLP-028.md`, Rejected/Not a Bug). Redmine's real `:application_menu` (the bar that reads Projects/Activity/Issues/Spent time/Gantt/Calendar/News on a plain `/projects` page, or a project's own tab bar when inside one) has **no matching `<ul>` anywhere in the Command Center's DOM at all** — genuinely, completely absent, correctly replaced by the Helpdesk icon rail (`<ul class="rf_helpdesk_sidebar_nav">`). (An earlier pass had wrongly checked the always-present `<ul class="scarlet-topmenu-managed">` — Redmine's `:top_menu`, not `:application_menu` — and concluded the app menu wasn't hidden; corrected same day.) The icon rail itself is present and correctly functions as the primary navigation (see TC-HLP-149).

---

### TC-HLP-149: The Command Center icon rail reaches all seven sections

**User Role:** Agent
**Precondition:** Command Center open.

**Steps:**
1. Inspect the left icon rail
2. Click each entry: Dashboard, Tickets, Reports, Organizations, Customers, Products, Settings

**Expected Result:**
- All seven are present in the rail
- Each navigates to its corresponding screen without leaving the Command Center chrome

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test` — real `manage_helpdesk`): **PASS.** All 7 rail entries present (Helpdesk Dashboard, Helpdesk Tickets, Reports, Organization, Customers, Products, Helpdesk Settings) and each was clicked in turn — Dashboard (`/helpdesk`), Reports (`/rf_helpdesk/reports/tickets`, 5 sub-report tabs), Organization (`/rf_organizations`), Customers (`/rf_helpdesk/customers`), Products (`/rf_products`), Helpdesk Settings (`/rf_helpdesk/setting`, 5 sub-tabs: Holiday/Products/Email Configuration/Canned Responses/Support Packages). Every screen rendered with the same 7-item rail still present in its own chrome — none of them dropped to a project-scoped or plain-Redmine view. Cross-reference: a `view_helpdesk`-only Agent (`luna.blossom`) sees only 2 of these 7 items (Dashboard, Tickets) when reaching `/helpdesk` by direct URL — this is deliberate, correct `manage_helpdesk` gating, not a defect (see TC-HLP-152 below and BUG-HLP-027's Closed section, retracted as Not a Bug 2026-09-02).

---

### TC-HLP-150: SLAs and Support Levels are reachable directly by URL despite no rail icon

**User Role:** Agent
**Precondition:** Command Center open; agent has access to at least one project's SLAs/support levels.

**Steps:**
1. Confirm neither **SLAs** nor **Support Levels** appears in the Command Center icon rail
2. Navigate directly to `/rf_slas`
3. Navigate directly to `/rf_support_levels`

**Expected Result:**
- Neither has a rail icon (by design — both are reached from inside a project's own tabs instead)
- Both direct URLs load their respective lists correctly regardless

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS on Step 1, FAIL on Steps 2–3 as literally written — but this is a superseded TC, not a regression.** Neither SLAs nor Support Levels appears in the Command Center rail (confirmed against TC-HLP-149's full 7-item enumeration above). `/rf_slas` and `/rf_support_levels` both now return a genuine HTTP 404, not their list pages. **This is the intended, already-shipped fix for BUG-HLP-005** (closed 2026-08-31): those two bare/unscoped global routes were the exact bypass BUG-HLP-005 flagged (unlinked from any nav, capable of creating an orphaned SLA with no project association) — the fix removed the routes entirely rather than just hiding them, which is stronger than what the bug asked for but means this TC's own Step 2/3 instructions now describe removed functionality. SLA/Support Level ARE still fully reachable and correctly project-scoped via each project's own SLA tab and Settings → Support Levels (confirmed separately via `HELPDESK_SLA_ESCALATION.md`'s CRUD test cases). **Revision History**: Expected Result should read "both bare global URLs now return 404 — SLA/Support Level are reachable only via a project's own tabs" instead of "both direct URLs load their respective lists correctly". Not re-filing as a new bug — this is `bugs/closed/BUG-HLP-005.md`'s own fix working as intended, just not yet reflected in this TC's wording.

---

### TC-HLP-151: A project's Helpdesk tab keeps Redmine's normal project chrome

**User Role:** Agent
**Precondition:** Viewing a project's Helpdesk tab.

**Steps:**
1. Open a project, click its **Helpdesk** tab

**Expected Result:**
- Redmine's normal project menu and the project's name/header remain visible (unlike the Command Center, which hides them)
- The same underlying screens (Dashboard, Tickets, etc.) render, just scoped to this project

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `luna.blossom`): **PASS.** Opened `/projects/helpdesk-qa-alpha` as a real Agent — Redmine's normal project tab bar (Overview/Activity/Issues/Spent time/Gantt/Calendar/News/Documents/Wiki/Files/**Helpdesk**) and the project heading "Helpdesk QA Alpha" both remain fully visible. This project tab bar **is** Redmine's real `:application_menu` in its project-scoped form — the same menu that's completely absent (not just the universal top bar) on the Command Center, confirmed via DOM inspection under TC-HLP-148.

---

### TC-HLP-152: Project-level Helpdesk exposes the correct six tabs

**User Role:** Agent
**Precondition:** Viewing a project's Helpdesk tab.

**Steps:**
1. Inspect the sub-navigation within the project's Helpdesk area

**Expected Result:**
- Exactly these six are present: Dashboard, Tickets, SLA, Organization, Knowledgebase, Settings

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test` — real `manage_helpdesk`): **PASS (order differs from the guide, already a known quirk, not a new gap).** All 6 tabs present: Helpdesk Dashboard, Helpdesk Tickets, Knowledgebase, Helpdesk SLA, Organization, Settings — rendered in the order Dashboard/Tickets/**Knowledgebase**/SLA/Organization/Settings, not the guide's documented Dashboard/Tickets/**SLA**/Organization/Knowledgebase/Settings (same Knowledgebase-position discrepancy already noted in `HELPDESK_MEMORY.md`'s Known Quirks, not new). **Important permission-tier finding**: a `view_helpdesk`-only Agent (`luna.blossom`) sees only **3** of these 6 (Dashboard/Tickets/Knowledgebase) — SLA/Organization/Settings are missing entirely for her, and a direct URL to the SLA tab (`/projects/helpdesk-qa-alpha/helpdesk/sla`) returns a genuine 403. **Root cause confirmed via source**: `RfProjectHelpdeskController` has `before_action :require_manage_permission, only: [:organization, :products, :sla, :settings]` — an explicit, deliberate gate matching the guide's own permissions table ("`manage_helpdesk`: Everything in view, plus managing the desk's configuration"). **Not a bug** — this is the same deliberate `manage_helpdesk` requirement confirmed via TC-HLP-147/BUG-HLP-027 (retracted as Not a Bug 2026-09-02 once the user corrected the real precondition to "`view_helpdesk` **and** `manage_helpdesk`"); `HELPDESK_USER_GUIDE.md` §4 has been corrected accordingly. Precondition note: this TC's own wording ("Viewing a project's Helpdesk tab") doesn't specify which permission tier, so both outcomes (3 tabs for view_helpdesk-only, 6 for manage_helpdesk) are individually correct depending on which Agent variant is being tested — the 6-tab outcome is what a real "Agent" per the corrected guide definition should see.

---

### TC-HLP-153: Command Center Dashboard shows KPI cards, recent tickets, and charts

**User Role:** Agent
**Precondition:** Some tickets exist across at least one project.

**Steps:**
1. Open Helpdesk → Dashboard (Command Center)

**Expected Result:**
- KPI cards, a recent-tickets list, and charts render, aggregated across every project the agent can see

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS.** `/helpdesk` (Command Center Dashboard) shows all 5 KPI cards (9 Unassigned / 34 Open / 35 On Hold / 8 SLA Breached / 1 Resolved, each a clickable "View All" link), a "Recent Tickets" section with a search box and an 8-row table (Subject/Project/Priority/Status/Assignee/SLA Status/Created on), and a "Ticket Statistics" heading with its date-range subtitle — all aggregated across both Helpdesk QA Alpha and Beta (tickets from Alpha visible; the KPI counts reflect more than a single project's worth of data). Chart canvas itself not accessibility-tree-readable, consistent with prior sessions' notes.

---

### TC-HLP-154: Project Dashboard shows this project's KPIs and prepaid hours per organization

**User Role:** Agent
**Precondition:** Project has tickets and at least one organization with a prepaid-hours budget.

**Steps:**
1. Open the project's Helpdesk → Dashboard

**Expected Result:**
- KPI cards and charts scoped to this project only
- Prepaid support hours are broken out per organization on this project's dashboard

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** No organization on Helpdesk QA Alpha had a prepaid budget yet, so a real one was added first (Organization → Alpha Minimal Fields Test Org → Prepaid Support Hours → Add/top up hours, 10h on Helpdesk QA Alpha). Reloading the project's Helpdesk Dashboard confirms: the 5 KPI cards (9/34/35/8/1) are scoped to this project only (matching TC-HLP-156's counts exactly), and a "Prepaid Support Hours" table now appears with Organization/Approved/Used/Remaining/Usage/Action columns, correctly showing "Alpha Minimal Fields Test Org — 10.00h Approved / 0.00h Used / 10.00h Remaining / 0% Used" and a working "Ledger" link. Confirms the section genuinely renders per-organization once real budget data exists — it was absent before only because no organization had a budget yet, not a plugin defect.

---

### TC-HLP-155: Command Center Dashboard's KPI "View all" links navigate with the correct filter already applied

**User Role:** Agent
**Precondition:** Command Center Dashboard open, with tickets covering a range of statuses (Unassigned, Open, On Hold, SLA Breached, Resolved).

**Steps:**
1. Note each KPI card's count (Unassigned, Open, On Hold, SLA Breached, Resolved)
2. Click **View all** on the **Unassigned** card
3. Go back to the Dashboard, click **View all** on the **Open** card
4. Repeat for **On Hold**, **SLA Breached**, and **Resolved**

**Expected Result:**
- Each click navigates to the global ticket list with the matching filter already applied automatically — no manual filter setup needed
- The filter panel shows the correct field(s)/value(s) pre-filled for that KPI (e.g. Unassigned carries an `assigned_to_id=none` + open-status filter; Resolved carries a closed-status filter)
- The resulting list's row count matches the KPI count noted in step 1 (accounting for the KPI's own date range, if one is shown on the Dashboard)
- The URL reflects the applied filter (shareable, consistent with TC-HLP-400's URL-persistence behavior for the ticket list generally)

- **CONFIRMED LIVE 2026-08-25** (backfilled into this file 2026-09-02 — evidence previously sat only in `HELPDESK_MEMORY.md`'s addendum #4, never copied here): **PASS.** Clicked the global Command Center Dashboard's "Unassigned" KPI card — landed on the global ticket list (`/rf_helpdesk/issues`) with the filter panel correctly pre-filled (Status = Any open status, Assignee = Nobody (unassigned)), and the resulting ticket count matched the KPI's own count exactly. **Re-confirmed again live 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): same mechanic, same-session KPI count (9 Unassigned) matched the resulting list's count exactly, URL carries the applied filter as query params (`assigned_to_id[]=none&status_id[]=open&created_from=...&created_to=...`), consistent with TC-HLP-156's project-scoped equivalent below.

---

### TC-HLP-156: Project Dashboard's KPI "View all" links apply the same filter, scoped to that project only

**User Role:** Agent
**Precondition:** A project's own Helpdesk Dashboard open, with tickets covering a range of statuses.

**Steps:**
1. Click **View all** on each KPI card (Unassigned, Open, On Hold, SLA Breached, Resolved) in turn, as in TC-HLP-155

**Expected Result:**
- Each link lands on **this project's** ticket list (not the global Command Center list) with the matching filter pre-applied
- Counts and filter behavior otherwise match TC-HLP-155, just scoped to the one project

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS.** Opened Helpdesk QA Alpha's own Helpdesk Dashboard (`/projects/helpdesk-qa-alpha/helpdesk`, 5 KPI cards: 9 Unassigned/34 Open/35 On Hold/8 SLA Breached/1 Resolved). Clicked "View All" on the Unassigned card — landed on `/projects/helpdesk-qa-alpha/helpdesk/tickets` (the project-scoped list, not `/rf_helpdesk/issues`), with Status = "Any open status" and Assignee = "Nobody (unassigned)" correctly pre-filled in the filter panel, heading reading "Helpdesk QA Alpha · 9 tickets" and the paginator confirming "(1-9/9)" — the resulting count matches the KPI's own count exactly, same behavior as TC-HLP-155 just correctly scoped to this one project instead of the global list.

---

### TC-HLP-157: Changing the Dashboard's Date Range (not just accepting the default) carries the new range into a KPI's "View all" redirect

**User Role:** Agent
**Precondition:** A project's own Helpdesk Dashboard open. TC-HLP-155/275 only ever exercised the page's *default* date range (`created_from`/`created_to` reflecting whatever the Date Range picker showed on load) — this TC exercises a range the user deliberately changes.

**Steps:**
1. Note the Dashboard's default Date Range button value and each KPI card's count under it (e.g. "05 Aug 26 - 03 Sep 26": 9 Unassigned/34 Open/35 On Hold/8 SLA Breached/1 Resolved).
2. Click the **Date Range** button, and pick a different preset from its dropdown (Today/Yesterday/Last 7 Days/Last 30 Days/This Month/Last Month/Custom Range) — one that clearly narrows the window, e.g. **Yesterday**.
3. Confirm the KPI cards' counts update for the new range.
4. Click **View all** on a KPI card (e.g. Open) and confirm the resulting ticket list's URL and result count reflect the newly-chosen range, not the page's original default.

**Expected Result:**
- Changing the Date Range preset updates the KPI counts on the Dashboard itself.
- The KPI's "View all" link is built from the **currently-selected** range at click time, not a stale copy of the range that was active when the page first loaded.
- The redirected ticket list's row count matches the updated KPI count, and its `created_from`/`created_to` URL params equal the newly-picked range.
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Default Date Range showed "05 Aug 26 - 03 Sep 26" with Open = 34. Clicked the Date Range button, selected **Yesterday** from the preset dropdown — URL updated to `?from_date=2026-09-02&to_date=2026-09-02` and the Open KPI count dropped live to **3** (Unassigned 0, On Hold 3, Resolved 0; SLA Breached stayed 8, since that card's own "View all" link — `?sla=breached` — carries no date params at all, confirmed unaffected by the picker both before and after the change). Clicked "Open View all" — landed on `/projects/helpdesk-qa-alpha/helpdesk/tickets?created_from=2026-09-02&created_to=2026-09-02&status_id[]=open`, i.e. the just-picked Yesterday range, **not** the page's original `2026-08-05`–`2026-09-03` default. The resulting table showed exactly 3 rows (#34, #35, #36 — all with an Updated/Created timestamp of 09/02/2026), matching the updated KPI count exactly. Confirms the "View all" links are computed from live picker state at click time, not fixed to the page's initial load — the gap this TC was written to close (TC-HLP-155/275 never exercised anything but the default range). No bug found.

---

### TC-HLP-158: Search on a list screen finds matching records and survives paging

**User Role:** Agent
**Precondition:** A list screen (e.g. Customers, Organizations, Products) with enough records to paginate.

**Steps:**
1. Type a search term matching a known record's name
2. Confirm it's found
3. Go to page 2 of the (now-filtered) results

**Expected Result:**
- The matching record(s) are returned
- The search term still applies on page 2 — it is not reset by paging

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS on Step 1 (search matching); Step 2 (page 2) BLOCKED — insufficient real data.** Searched "Delta" on the Customers list (`/rf_helpdesk/customers`) — correctly narrowed from 3 to 1 matching row (`delta.customer`), same mechanic confirmed for Organizations (2 rows) and Products (1 row) elsewhere in this session. **None of Customers/Organizations/Products currently has more than 3 real records** on this environment — none can reach a page 2 at the standard page size, so the "search term survives paging" half of this TC cannot be genuinely exercised without fabricating dozens of throwaway records solely to force pagination, which wasn't done. Documented honestly as not independently re-verified for the paging-specific claim, rather than assumed to pass by analogy with the ticket list (a materially different, filter-based list that already has its own paging coverage in `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md`).

---

### TC-HLP-159: Opening a product from the global Products list stays in Command Center chrome

**User Role:** Agent
**Precondition:** At least one product exists.

**Steps:**
1. From the Command Center's Settings → Products (global list), click into a product

**Expected Result:**
- The product's detail/edit view still renders inside the Command Center chrome — it does not switch to a project-scoped view

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS.** No product existed yet on this environment, so created a fresh one ("Nav Test Product", NAVTEST, Helpdesk QA Alpha) via the Command Center's own Settings → Products → New Product, then clicked it from the global Products list (`/rf_products`). Its detail view (`/rf_products/1`) renders with the same 7-item Command Center rail still present — it did not switch to a project-scoped view or drop any chrome.

---

## Negative Cases

---

### TC-HLP-160: "Helpdesk" does not appear in the top menu for a user with no helpdesk permission anywhere

**User Role:** Redmine user who is not a member of any helpdesk-enabled project, or is a member but with neither `view_helpdesk` nor `manage_helpdesk` on any project
**Precondition:** As above.

**Steps:**
1. Log in and inspect the top application menu

**Expected Result:**
- **Helpdesk** is absent from the top menu entirely

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin — fixture `zero.perm.user`): **PASS.** Created a disposable user with zero project memberships anywhere (Administration → New user, no membership ever added), logged in as them — top menu shows only Home/My page/Projects/Time Tracker/Workloads/Help, no "Helpdesk" entry. Also incidentally confirmed the anonymous (logged-out) state shows no Helpdesk entry either. Cross-reference: this same absent-menu signature also appears for `luna.blossom`, a real Agent with `view_helpdesk` only (no `manage_helpdesk`) — this is expected, not a defect: per TC-HLP-147's corrected precondition (`view_helpdesk` **and** `manage_helpdesk`), a `view_helpdesk`-only member is not yet a full "Agent" for top-menu purposes, so matching this negative case is intended (see TC-HLP-147 and BUG-HLP-027's Closed/Not-a-Bug section).

- **Follow-up verification, same day, per direct user question: does a hidden menu link also mean the URLs themselves are blocked, for both the no-permission and partial-permission (`view_helpdesk`-only) cases?** Tested every Command Center rail URL directly (not just the menu) for both tiers:

  | Screen (direct URL) | `zero.perm.user` (0 permission) | `luna.blossom` (`view_helpdesk` only) |
  |---|---|---|
  | `/rf_helpdesk/reports/tickets` | 403 | 403 |
  | `/rf_organizations` | 403 | 403 |
  | `/rf_helpdesk/customers` | 403 | 403 |
  | `/rf_products` | 403 | 403 |
  | `/rf_helpdesk/setting` | 403 | 403 |
  | `/projects/helpdesk-qa-alpha/helpdesk` (project dashboard) | 403 (not a member) | Loads (she IS a member) — 3-tab reduced sub-nav |
  | `/projects/helpdesk-qa-alpha/helpdesk/sla` \| `/organization` \| `/settings` | not applicable (already 403'd above her) | 403 (confirmed under TC-HLP-152) |
  | `/helpdesk` (**global** dashboard) | **Loads — and leaks real cross-project ticket data. See BUG-HLP-029.** | Loads, reduced 2-item rail, shows her own projects' real tickets (legitimate — she IS a member of both projects that currently exist) |

  **Every rail screen except the global dashboard itself correctly blocks direct URL access for both tiers** — hiding the menu link is backed by a real server-side check everywhere except one place. The one exception: `/helpdesk`'s own "Recent Tickets" list has no visibility scoping at all (confirmed via source — `Issue.where(project_id: @helpdesk_project_ids)` with no `.visible(User.current)` or permission filter), so it renders real ticket subjects/project/assignee/SLA-breach data to `zero.perm.user` despite her having zero access anywhere — while the same dashboard's own KPI cards correctly read 0 for her, proving the leak is specific to one code path, not the whole action. Filed as **BUG-HLP-029** (High). This was NOT exercised by `luna.blossom`'s test above, since she's a legitimate member of both projects that exist on this environment — her seeing her own projects' tickets there is correct, not a symptom of the same bug; the leak was proven specifically with a user who has zero legitimate access anywhere.

---

### TC-HLP-161: Searching for a term matching no records shows a clean empty state

**User Role:** Agent
**Precondition:** Any list screen with search.

**Steps:**
1. Search for a term guaranteed not to match anything

**Expected Result:**
- A clear "no results" state is shown — no error, no stale data left over from a prior search

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** Searched "zzznonexistentcustomer99" (guaranteed no match) on the Customers list — a clean "Nothing matched / No records match your search or filters. Clear them to see everything again." empty state rendered, no error, no stale table rows left over from the prior "Delta" search.

---

## Edge Cases

---

### TC-HLP-162: Deep-linking directly to a Command Center URL works without navigating via the menu

**User Role:** Agent
**Precondition:** Agent has an active session but has not clicked through the Helpdesk menu this session.

**Steps:**
1. Paste `/rf_helpdesk` directly into the address bar and load it

**Expected Result:**
- The Command Center Dashboard renders correctly, with the same hidden-app-menu chrome as if reached via the menu

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS.** Pasted `/helpdesk` directly into the address bar without having clicked the top-menu link this session — the Command Center Dashboard rendered correctly and identically to reaching it via the menu click (same rail, same KPI cards, same Recent Tickets, Redmine's real `:application_menu` equally absent — confirmed under TC-HLP-148). Chrome matches the (corrected) guide either way it's reached — including the header text, which reads "Helpdesk" as intended (`bugs/closed/BUG-HLP-028.md`, Rejected/Not a Bug).

---

### TC-HLP-163: Switching between Command Center and a project's Helpdesk tab does not bleed chrome between modes

**User Role:** Agent
**Precondition:** Access to both the Command Center and at least one project's Helpdesk tab.

**Steps:**
1. Open the Command Center
2. Navigate into a project's Helpdesk tab
3. Navigate back to the Command Center

**Expected Result:**
- Each transition shows the correct chrome for that mode (app menu hidden only in the Command Center) — no leftover project menu in the Command Center, and no missing project menu when back in the project

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, Agent `manage.helpdesk.test`): **PASS, both halves.** Opened the Command Center (7-item rail, Redmine's real `:application_menu` completely absent from the DOM — confirmed under TC-HLP-148) → navigated into Helpdesk QA Alpha's project Helpdesk tab (project heading "Helpdesk QA Alpha" + the project's own tab bar, which IS that same `:application_menu` in its project-scoped form, correctly reappeared, 6-tab Helpdesk sub-nav) → navigated back to the Command Center via the top-menu link (7-item rail correctly restored, `:application_menu`/project tab bar correctly gone again, no leftover Alpha-specific content). No bleed in either direction — each mode shows exactly the chrome it should, matching "app menu hidden only in the Command Center" precisely once "app menu" is correctly identified as Redmine's `:application_menu`, not the always-present `:top_menu`.

---

### TC-HLP-164: Clearing a search term resets the list to its unfiltered state on the current page

**User Role:** Agent
**Precondition:** A search is active on page 2 of a filtered list (per TC-HLP-158).

**Steps:**
1. Clear the search box

**Expected Result:**
- The list returns to its full unfiltered contents; the page does not stay stuck on a now out-of-range page number if the unfiltered set has fewer pages than where the search left off

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS on the clear-resets-to-unfiltered half; the page-2/out-of-range half is BLOCKED for the same reason as TC-HLP-158 (insufficient real records to ever reach page 2).** After searching "zzznonexistentcustomer99" (0 results) and then clicking **Clear**, the Customers list correctly returned to its full unfiltered 3-row contents (`alpha.customer`/`delta.customer`/`retest.customer1`), search box emptied, no stale filter state. The out-of-range-page-number scenario specifically requires a list that both paginates AND has a search narrow enough to leave fewer pages than the current one — not constructible on Customers/Organizations/Products with their current real record counts (all under 4 rows). Not fabricating bulk dummy data solely to force this edge case.

---

## Evidence Map

- Case ID: TC-HLP-147 – TC-HLP-164, plus TC-HLP-155–275 (Dashboard KPI "View all" links, added 2026-08-24), plus TC-HLP-157 (Dashboard KPI "View all" with a manually-changed Date Range, added 2026-09-03)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
