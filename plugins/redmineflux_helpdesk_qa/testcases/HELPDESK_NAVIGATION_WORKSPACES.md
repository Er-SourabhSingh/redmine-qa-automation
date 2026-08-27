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

### TC-HLP-060: "Helpdesk" appears in the top menu for an agent and opens the Command Center

**User Role:** Agent
**Precondition:** Agent has `view_helpdesk` or `manage_helpdesk` on at least one project.

**Steps:**
1. Log in and look at Redmine's top application menu
2. Click **Helpdesk**

**Expected Result:**
- **Helpdesk** is present in the top menu
- Clicking it opens the Helpdesk Command Center

---

### TC-HLP-061: The Command Center hides Redmine's application menu and shows its own header

**User Role:** Agent
**Precondition:** Command Center open.

**Steps:**
1. Observe the page chrome — top menu and header

**Expected Result:**
- Redmine's normal application menu is hidden
- The header reads **Helpdesk Support**

---

### TC-HLP-062: The Command Center icon rail reaches all seven sections

**User Role:** Agent
**Precondition:** Command Center open.

**Steps:**
1. Inspect the left icon rail
2. Click each entry: Dashboard, Tickets, Reports, Organizations, Customers, Products, Settings

**Expected Result:**
- All seven are present in the rail
- Each navigates to its corresponding screen without leaving the Command Center chrome

---

### TC-HLP-063: SLAs and Support Levels are reachable directly by URL despite no rail icon

**User Role:** Agent
**Precondition:** Command Center open; agent has access to at least one project's SLAs/support levels.

**Steps:**
1. Confirm neither **SLAs** nor **Support Levels** appears in the Command Center icon rail
2. Navigate directly to `/rf_slas`
3. Navigate directly to `/rf_support_levels`

**Expected Result:**
- Neither has a rail icon (by design — both are reached from inside a project's own tabs instead)
- Both direct URLs load their respective lists correctly regardless

---

### TC-HLP-064: A project's Helpdesk tab keeps Redmine's normal project chrome

**User Role:** Agent
**Precondition:** Viewing a project's Helpdesk tab.

**Steps:**
1. Open a project, click its **Helpdesk** tab

**Expected Result:**
- Redmine's normal project menu and the project's name/header remain visible (unlike the Command Center, which hides them)
- The same underlying screens (Dashboard, Tickets, etc.) render, just scoped to this project

---

### TC-HLP-065: Project-level Helpdesk exposes the correct six tabs

**User Role:** Agent
**Precondition:** Viewing a project's Helpdesk tab.

**Steps:**
1. Inspect the sub-navigation within the project's Helpdesk area

**Expected Result:**
- Exactly these six are present: Dashboard, Tickets, SLA, Organization, Knowledgebase, Settings

---

### TC-HLP-066: Command Center Dashboard shows KPI cards, recent tickets, and charts

**User Role:** Agent
**Precondition:** Some tickets exist across at least one project.

**Steps:**
1. Open Helpdesk → Dashboard (Command Center)

**Expected Result:**
- KPI cards, a recent-tickets list, and charts render, aggregated across every project the agent can see

---

### TC-HLP-067: Project Dashboard shows this project's KPIs and prepaid hours per organization

**User Role:** Agent
**Precondition:** Project has tickets and at least one organization with a prepaid-hours budget.

**Steps:**
1. Open the project's Helpdesk → Dashboard

**Expected Result:**
- KPI cards and charts scoped to this project only
- Prepaid support hours are broken out per organization on this project's dashboard

---

### TC-HLP-274: Command Center Dashboard's KPI "View all" links navigate with the correct filter already applied

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
- The URL reflects the applied filter (shareable, consistent with TC-HLP-044's URL-persistence behavior for the ticket list generally)

---

### TC-HLP-275: Project Dashboard's KPI "View all" links apply the same filter, scoped to that project only

**User Role:** Agent
**Precondition:** A project's own Helpdesk Dashboard open, with tickets covering a range of statuses.

**Steps:**
1. Click **View all** on each KPI card (Unassigned, Open, On Hold, SLA Breached, Resolved) in turn, as in TC-HLP-274

**Expected Result:**
- Each link lands on **this project's** ticket list (not the global Command Center list) with the matching filter pre-applied
- Counts and filter behavior otherwise match TC-HLP-274, just scoped to the one project

---

### TC-HLP-068: Search on a list screen finds matching records and survives paging

**User Role:** Agent
**Precondition:** A list screen (e.g. Customers, Organizations, Products) with enough records to paginate.

**Steps:**
1. Type a search term matching a known record's name
2. Confirm it's found
3. Go to page 2 of the (now-filtered) results

**Expected Result:**
- The matching record(s) are returned
- The search term still applies on page 2 — it is not reset by paging

---

### TC-HLP-069: Opening a product from the global Products list stays in Command Center chrome

**User Role:** Agent
**Precondition:** At least one product exists.

**Steps:**
1. From the Command Center's Settings → Products (global list), click into a product

**Expected Result:**
- The product's detail/edit view still renders inside the Command Center chrome — it does not switch to a project-scoped view

---

## Negative Cases

---

### TC-HLP-070: "Helpdesk" does not appear in the top menu for a user with no helpdesk permission anywhere

**User Role:** Redmine user who is not a member of any helpdesk-enabled project, or is a member but with neither `view_helpdesk` nor `manage_helpdesk` on any project
**Precondition:** As above.

**Steps:**
1. Log in and inspect the top application menu

**Expected Result:**
- **Helpdesk** is absent from the top menu entirely

---

### TC-HLP-071: Searching for a term matching no records shows a clean empty state

**User Role:** Agent
**Precondition:** Any list screen with search.

**Steps:**
1. Search for a term guaranteed not to match anything

**Expected Result:**
- A clear "no results" state is shown — no error, no stale data left over from a prior search

---

## Edge Cases

---

### TC-HLP-072: Deep-linking directly to a Command Center URL works without navigating via the menu

**User Role:** Agent
**Precondition:** Agent has an active session but has not clicked through the Helpdesk menu this session.

**Steps:**
1. Paste `/rf_helpdesk` directly into the address bar and load it

**Expected Result:**
- The Command Center Dashboard renders correctly, with the same hidden-app-menu chrome as if reached via the menu

---

### TC-HLP-073: Switching between Command Center and a project's Helpdesk tab does not bleed chrome between modes

**User Role:** Agent
**Precondition:** Access to both the Command Center and at least one project's Helpdesk tab.

**Steps:**
1. Open the Command Center
2. Navigate into a project's Helpdesk tab
3. Navigate back to the Command Center

**Expected Result:**
- Each transition shows the correct chrome for that mode (app menu hidden only in the Command Center) — no leftover project menu in the Command Center, and no missing project menu when back in the project

---

### TC-HLP-074: Clearing a search term resets the list to its unfiltered state on the current page

**User Role:** Agent
**Precondition:** A search is active on page 2 of a filtered list (per TC-HLP-068).

**Steps:**
1. Clear the search box

**Expected Result:**
- The list returns to its full unfiltered contents; the page does not stay stuck on a now out-of-range page number if the unfiltered set has fewer pages than where the search left off

---

## Evidence Map

- Case ID: TC-HLP-060 – TC-HLP-074, plus TC-HLP-274–275 (Dashboard KPI "View all" links, added 2026-08-24)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
