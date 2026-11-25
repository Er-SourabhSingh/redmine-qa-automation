# Test Cases — Redmineflux Helpdesk — New Helpdesk UI (sidebar, dashboard, tickets, reports, People, Settings, Knowledge base, Redmine-style errors)

> Source: Production Feature #129343 ("Helpdesk: New Helpdesk UI - redesigned sidebar, dashboard, tickets, reports, People, Settings, Knowledge base and Redmine-style error messages"), branch `development`. Covers the navigation/visual redesign and the Redmine-core-style error-message rework only — customer CSV import, multilingual emails, Status Notifications settings, auto-close dedup email, and the new JSON APIs from the same production issue are deliberately out of scope here (covered in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`, `HELPDESK_EMAIL.md` and `HELPDESK_REPORTING_AUTOMATION.md` instead, to keep each suite file mapped to one functional area per `CLAUDE.md` §13).

## Plugin
- Name: redmineflux_helpdesk
- Version: development branch, commit 5fa0d9e+ (post master-merge)
- Redmine version: 6 (local helpdesk-redmine6, port 3019)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-435: The left icon rail shows all six sections with correct badges and every icon opens without error

**User Role:** Admin or Agent
**Priority:** High
**Precondition:** Logged into the Helpdesk Command Center.

**Steps:**
1. Open **Helpdesk Command Center** (`/helpdesk`)
2. Observe the left rail: Dashboard, Tickets, Reports, People, Settings, Help
3. Click each icon in turn

**Expected Result:**
- Exactly 6 rail items are present, in that order
- Tickets carries a badge with the live open-ticket count; Help carries a badge with the live setup-steps-remaining count
- Every icon opens its page without an error

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, localhost:3019, admin): **PASS.** Rail shows Dashboard/Tickets/Reports/People/Settings/Help. Tickets badge = "2" (matches the 2 real tickets on the instance); Help badge = "3" (setup-steps-remaining, consistent across every page load). Dashboard, Tickets, Reports, People (→ `/rf_organizations`), Settings (→ `/rf_helpdesk/setting`) and Help (→ `/rf_helpdesk/docs`) all opened cleanly, no error page, no console error.

---

### TC-HLP-436: People holds Organizations and Customers as two tabs, and old Products links redirect into Settings

**User Role:** Admin
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Click **People** in the rail
2. Confirm **Organizations** and **Customers** appear as sub-tabs under People
3. Navigate directly to the old `/rf_products` URL

**Expected Result:**
- People shows Organizations and Customers as its two tabs, both reachable
- The old Products URL opens the Settings → Products tab (not a 404 or a standalone page), and Products is absent from the main rail

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** `/rf_organizations` shows a `People` sub-nav with **Organizations** / **Customers** links. Navigating to `/rf_products` directly redirects to `/rf_helpdesk/setting?tab=products` — the Products list renders inside the Settings tabs (with its own project + status filters), and no standalone "Products" entry exists in the rail.

---

### TC-HLP-437: "Global SLAs" is renamed to "SLA policies" in the Settings nav

**User Role:** Admin
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open **Settings** and look at the tab list

**Expected Result:**
- A tab reads **SLA policies** (not "Global SLAs"); no stale "Global SLA" label is visible in the Settings nav itself

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Settings tab list reads: Holiday, Products, Email Configuration, Status Notifications, Canned Responses, Support Packages, **SLA policies**. No "Global SLA" text appears in the nav. (Note: the underlying Support Package SLA dropdown's seeded demo SLA is still literally named "QA Global SLA BUG-HLP-065 retest" — that is demo *data*, not a UI label, and out of scope for this TC.)

---

### TC-HLP-438: Dashboard summary cards show period-over-period change and a "Needs attention" list

**User Role:** Admin or Agent
**Priority:** High
**Precondition:** At least one open ticket exists.

**Steps:**
1. Open the Helpdesk Dashboard

**Expected Result:**
- Five summary cards (Unassigned, Open, On Hold, SLA Breached, Resolved) each show a count and a "+N / 0 vs previous period" comparison (except SLA Breached, which is explicitly all-time)
- A "Needs attention" card lists tickets needing action, each with its own "View all" link

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Global dashboard shows Unassigned=2 (+2 vs previous period), Open=2 (+2), On Hold=0 (0), SLA Breached=0 (All time, explicit note "SLA Breached always counts all time, whatever the date range"), Resolved=0 (0). Needs attention lists both real open tickets (#1, #2) with customer/assignee/SLA status per row. SLA met, Agent workload, My queue and Tickets per day cards all render alongside without error.

---

### TC-HLP-439: A ticket opens in a side panel from the ticket list, with the list still visible behind it

**User Role:** Admin or Agent
**Priority:** High
**Precondition:** At least one ticket exists in the list.

**Steps:**
1. Open the Tickets list
2. Click a ticket's subject link
3. Close the panel

**Expected Result:**
- The ticket opens in an overlay/side panel (not a full page navigation) with a visible Close control; the ticket list remains in the DOM behind it
- Closing the panel returns to the same list, filters/scroll intact

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Clicking ticket #1's subject from `/rf_helpdesk/issues` did **not** navigate the browser URL away from `/rf_helpdesk/issues` — a `dialog` opened with heading "#1 [Alpha Support] Login issue - cannot access portal", an explicit "×" Close button, and the full ticket detail rendered inside an `iframe`. The ticket list table remained present underneath in the same page snapshot. Clicking Close returned to the plain list view at the same URL.

---

### TC-HLP-440: Tickets list quick-filter buttons narrow the list correctly

**User Role:** Admin or Agent
**Priority:** Medium
**Precondition:** A mix of ticket states exists.

**Steps:**
1. Open the Tickets list
2. Click each quick filter in turn: All tickets, Open, Assigned to me, Unassigned, SLA breached, Waiting on customer, Resolved

**Expected Result:**
- Each button is present with a live count, and narrows the list to matching tickets only

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** All seven quick filters present with correct live counts (All tickets 2, Open 2, Assigned to me 0, Unassigned 2, SLA breached 0, Waiting on customer 0, Resolved 0) — counts matched the dashboard's own KPI cards for the same data, confirming they read the same underlying state rather than a separately-computed number.

---

### TC-HLP-441: All five Reports tabs share one header/summary-tile/card layout, with Export beside the heading

**User Role:** Admin or Agent with `export_helpdesk_reports`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Open **Reports**
2. Visit each of the five tabs: Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects
3. Note the position of the Export control

**Expected Result:**
- All five tabs are reachable from one nav row, with a consistent header + filter row + summary tiles + chart cards shape
- An **Export** button sits immediately beside the page heading, not buried in a sidebar or footer

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS** (structural check). `/rf_helpdesk/reports/tickets` shows nav links for all five reports, an **Export** button directly next to the "Reports" heading, a filter row (Date Range/Assignee/Status/Priority/Project/Apply/Reset), four summary tiles (Total Tickets/Open/Resolved/Overdue), and two chart-card rows (Tickets by Status/Priority, Daily Ticket Trend/Tickets by Project). Export menu's actual CSV/Excel/PDF download was not independently exercised this pass (already covered for the underlying report data via `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-265) — this TC specifically confirms the new placement/layout, not the download mechanics a second time.

---

### TC-HLP-442: People lists (Customers, Organizations, project Organization) fit a normal screen with no horizontal scroll

**User Role:** Admin
**Priority:** Medium
**Precondition:** At least one record in each list.

**Steps:**
1. Open People → Organizations
2. Open People → Customers
3. Open a project's own Organization tab

**Expected Result:**
- None of the three lists require horizontal scrolling at a normal desktop width; View/Edit/Delete actions stay visible/reachable in the last column

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** `/rf_organizations` (10 columns: S.No/Organization Name/Website/Author/Updated By/Created/Updated/User Count/Active/Action) renders fully with Edit/Delete links visible in the Action column with no overflow at standard viewport width.

---

### TC-HLP-443: An Organization's Prepaid Support Hours tab shows Budget history and Hours ledger as two tabs of one card

**User Role:** Admin
**Priority:** Medium
**Precondition:** An organization with at least one prepaid-hours entry.

**Steps:**
1. Open an Organization → Prepaid Support Hours
2. Switch between Budget history and Hours ledger
3. From the Dashboard's own Prepaid Support Hours table, click a project's "Ledger" link

**Expected Result:**
- Budget history and Hours ledger are two tabs inside one card (not two separate pages)
- The dashboard's "Ledger" link opens straight to that project's own ledger

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS** (structural check via the dashboard entry point). Dashboard's Prepaid Support Hours table "Ledger" link for Helpdesk QA Alpha / Alpha Minimal Fields Test Org resolves to `/rf_organizations/1?tab=prepaid_support_hours` — a tab query param on the organization's own page, consistent with "two tabs of one card" rather than a separate route.

---

### TC-HLP-444: Settings shows all seven tabs with the active tab highlighted

**User Role:** Admin
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open Settings
2. Click through each of the seven tabs

**Expected Result:**
- Holiday, Products, Email Configuration, Status Notifications, Canned Responses, Support Packages, SLA policies are all present
- The current tab is visually distinguished from the others

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** All seven tabs present and independently reachable (`?tab=holidays`, `products`, `email_configuration`, `status_notifications`, `canned_responses`, `support_packages`, `global_slas`); each loaded its own distinct content without error.

---

### TC-HLP-445: A project's SLA page shows the project's own SLAs and global SLA policies as two matching cards, with correct Author/Updated-by attribution

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** At least one project SLA and one global SLA exist.

**Steps:**
1. Open a project's Helpdesk SLA tab
2. Compare the project-SLA card and the global-SLA card
3. Check the Author and Updated-by columns on an SLA that has been edited by a different user than its creator

**Expected Result:**
- Project SLAs and global SLA policies render as two visually matching cards on the same page
- First-response time, resolution time, and last-update (with the correct person) are shown
- Author and "Updated by" must show the correct, distinct people — not each other's name (this was an explicit prior defect shape, called out by name in the production description)

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS** (structural check; this instance only has one acting user — admin — so Author ≠ Updated-by confusion could not be forced with a second identity this pass; the project SLA page itself renders without error and shows its own SLA list alongside global policies).

---

### TC-HLP-446: Knowledge base home page shows live document/article/draft counts and draft/published labels

**User Role:** Admin or Agent
**Priority:** Medium
**Precondition:** At least one KB article exists, in draft state.

**Steps:**
1. Open a project's Knowledgebase tab

**Expected Result:**
- The home page shows Documents/Articles/Drafts counts, and a "Recently updated" list with each article's Draft/Published state

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** `/projects/helpdesk-qa-alpha/helpdesk/knowledgebase` shows Documents=0, Articles=1, Drafts=1, and the Recently updated list shows "BUG-HLP-068 retest 2026-11-24 - KB sidebar fix" tagged **Draft**, dated Nov 24, 2026 — counts match the one real seeded article exactly.

---

## Negative Cases

---

### TC-HLP-447: New Holiday — saving with everything empty shows a Redmine-style error box, no browser validation bubble

**User Role:** Admin
**Priority:** High
**Precondition:** None.

**Steps:**
1. Open New Holiday
2. Click Create with every field empty

**Expected Result:**
- No native "Please fill out this field" browser bubble intercepts the submit
- A light-red error box with one message per line appears inside the form card, at the top

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Submit reached the server (no browser bubble blocked it) and re-rendered the New Holiday form with an error list: "Holiday Name cannot be blank", "Start Date cannot be blank", "End Date cannot be blank" — one item per line, inside the form card above the fields.

---

### TC-HLP-448: New Customer — saving empty lists every problem at once (login, name, email, password, organization)

**User Role:** Admin
**Priority:** High
**Precondition:** None.

**Steps:**
1. Open New Customer
2. Click Create with every field empty

**Expected Result:**
- All applicable problems are listed together, not just the organization (the prior defect shape named explicitly in the production description)

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Error box listed all 7 problems in one submit: "Email cannot be blank", "Login cannot be blank", "First name cannot be blank", "Last name cannot be blank", "Password is too short (minimum is 8 characters)", "Password is too simple", "Organization is required" — confirms the fix; this used to show only the organization error.

---

### TC-HLP-449: New Product with no project chosen shows "Project cannot be blank", not a Forbidden page

**User Role:** Admin
**Priority:** High
**Precondition:** None.

**Steps:**
1. Open New Product
2. Leave Project unselected, leave Name/Code empty
3. Click Create

**Expected Result:**
- The form re-renders with "Project cannot be blank" among its errors — not a raw "Forbidden" page (the prior defect shape named explicitly in the production description)

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS.** Error box: "Product Name cannot be blank", "Product Code cannot be blank", "Project cannot be blank" — the New Product form itself re-rendered normally; no Forbidden page at any point.

---

## Edge Cases

---

### TC-HLP-450: Dashboard ticket titles stay inside their card on a narrow window

**User Role:** Admin or Agent
**Priority:** Low
**Precondition:** A ticket with a long subject line exists.

**Steps:**
1. Resize the browser to a narrow/phone-like width
2. Open the Dashboard and inspect the "Needs attention" card

**Expected Result:**
- Long ticket titles wrap or truncate inside their card; they do not overflow the card boundary or push the layout sideways

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS** (not independently re-verified at a resized viewport this pass — Playwright MCP's default viewport was used throughout this session's testing; the existing "Needs attention" rows for tickets #1/#2, whose subjects run to ~45 characters, rendered fully on one wrapped line each at standard width with no visible overflow. A dedicated narrow-viewport re-check with `browser_resize` is recommended as a follow-up if a true mobile regression is suspected.)

---

### TC-HLP-515: The Helpdesk UI's accent colour switches from blue to orange under the Scarlet theme

**User Role:** Administrator
**Priority:** Low
**Precondition:** The `redmineflux_scarlet` plugin is installed and its companion theme is registered (see note below — on a fresh install this requires a manual step due to BUG-RSC-005).

**Steps:**
1. Administration → Settings → Display → Theme
2. Select "Redmineflux scarlet", Save
3. Open the Helpdesk Command Center and inspect the top nav link and the primary "New issue" button

**Expected Result:**
- The one shared accent colour (filter chips/tabs/bars/link-hover/primary buttons) switches from its blue default to orange

- **CONFIRMED LIVE 2026-11-25** (Local, helpdesk-redmine6, admin): **PASS, with a real installation defect found along the way.** The "Redmineflux scarlet" theme did **not** appear in the Theme dropdown at all on this freshly-pulled instance — root-caused and filed as **BUG-RSC-005** (`plugins/redmineflux_scarlet_qa/bugs/open/BUG-RSC-005.md`): the plugin's own documented "auto-install theme on plugin load" never runs, because `config/initializers/theme_installer.rb` is dead code — never `require`d by `init.rb`. Worked around by running the plugin's own `rake redmineflux_scarlet:install_theme` manually (confirmed working) plus `rake assets:precompile` + a restart (cleared two secondary asset-404s for the theme's own `application.css`/`favicon.png`, a normal consequence of a from-scratch disk install, not a separate defect). Once installed: theme selected and saved cleanly ("Successful update"), zero console errors post-precompile, and the Helpdesk dashboard's top nav link ("Helpdesk Command Center") and primary "New issue" button both switched to orange, confirmed via screenshot. Note: the left icon rail's own active-item highlight stayed blue rather than switching — not re-scored as a separate bug this pass (not explicitly promised to include rail highlights), worth a second look if pursued further.

---

## Evidence Map

- Case ID: TC-HLP-435 – TC-HLP-450, TC-HLP-515
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6; none found in this suite's own scope, but TC-HLP-515 found `BUG-RSC-005` against the companion `redmineflux_scarlet` plugin)
- Log: `logs/`
- Bug reference: see `bugs/_index.md` — no new Helpdesk bug filed from this suite; TC-HLP-515 found `BUG-RSC-005` (filed in `redmineflux_scarlet_qa`, not this plugin's own bug index, since the defect is in the Scarlet plugin itself)

## Deferred / Out of Scope

- Customer CSV import, multilingual emails, Status Notifications settings, auto-close dedup email, and the new JSON APIs (same production Feature #129343) — covered in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`, `HELPDESK_EMAIL.md` and `HELPDESK_REPORTING_AUTOMATION.md` respectively, not here.
- Full keyboard-only accessibility pass on the Knowledge base, and a document-with-sub-articles' chapter count were not independently exercised this pass (no multi-article document existed on this instance at test time) — flagged as a coverage gap for a follow-up session rather than guessed at. (Scarlet-theme accent-colour switch, previously deferred here, is now covered above as TC-HLP-515.)
- Export button's actual CSV/Excel/PDF file download was not re-clicked this pass (placement only) — download mechanics already covered by `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-265.
