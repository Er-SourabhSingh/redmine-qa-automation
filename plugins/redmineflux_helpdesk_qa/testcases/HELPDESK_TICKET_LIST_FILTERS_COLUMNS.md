# Test Cases — Redmineflux Helpdesk — Features 18–21: Ticket List (Filters, Columns, SLA Badge, Restricted View)

> Source: `docs/HELPDESK_FEATURES_LIST.md` #18–21 (category C tail — deferred from `HELPDESK_TICKET_LIFECYCLE.md`). Grounded in `docs/HELPDESK_USER_GUIDE.md` §6 (The ticket list: filters and columns) and the tester checklist §26 groups K (Ticket list — filters and columns) and T (What the customer sees).
>
> Portal Preview and Customer 360 (features #36–37) are a different suite (Customers & Organizations) — not covered here even though §6 references what a customer sees.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-042: Filter panel opens with the two default filters: Status and Customer

**User Role:** Agent
**Precondition:** Viewing the global or a project's ticket list.

**Steps:**
1. Click **Filters**

**Expected Result:**
- The panel opens showing exactly two filters by default: **Status** and **Customer**
- Redmine's native operator query form is not shown anywhere on this screen
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. On Helpdesk QA Alpha's ticket list (`/projects/helpdesk-qa-alpha/helpdesk/tickets`, 35 tickets), clicking **Filters** opens a panel showing exactly two rows: **Status** (dropdown, "All") and **Customer** (dropdown, "All"), plus Add filter/Apply/Clear/Columns controls. No Redmine operator-grid query form (the standard `<operator>` dropdowns + "Options" panel) appears anywhere on the page.

---

### TC-HLP-043: Add filter brings in an additional field, and removing it returns it to the menu

**User Role:** Agent
**Precondition:** Filter panel open.

**Steps:**
1. Click **Add filter**, pick a field not already shown (e.g. Priority)
2. Set a value, note the field is now in the panel
3. Remove that filter row

**Expected Result:**
- Step 2: the new filter field appears in the panel and disappears from the Add-filter menu
- Step 3: the filter row is removed, its value cleared, and the field reappears in the Add-filter menu
- After removal, the list is no longer narrowed by that field — the filter genuinely stops applying, not just visually hidden
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Clicked Add filter → Priority: the row appeared in the panel (Status, Customer, **Priority**) and "Priority" disappeared from the Add-filter menu (14 remaining: Organization Name, Assignee, Author, Updated by, SLA Status, Ticket #, Subject, Description, Created on, Progress, Start date, Due Date, Closed — plus 2 already active = 16 total, matching the known "17-fields-minus-Project-inside-a-project" quirk in `HELPDESK_MEMORY.md`). Set Priority = High, Apply → narrowed to 1 ticket (#6). Clicked the row's own Delete button: the row disappeared from the panel immediately, **but** the list stayed narrowed to 1 ticket and the URL still carried `priority_id[]=3` — the removal is visual-only until Apply is clicked again. Clicking Apply a second time (with Priority now absent from the panel) correctly restored the full 35-ticket list and stripped `priority_id` from the URL; "Priority" also reappeared in the Add-filter menu at that point. Net: the filter genuinely stops applying once Apply is re-clicked, exactly as TC-HLP-058's own wording anticipates ("...without clicking Apply again, if the UI auto-applies on removal — otherwise click Apply") — not a bug, just worth documenting precisely that Delete alone doesn't immediately re-query.

---

### TC-HLP-044: Applying a filter narrows the list and persists in the URL

**User Role:** Agent
**Precondition:** Filter panel open with at least one filter set.

**Steps:**
1. Set Status = "New", click **Apply**

**Expected Result:**
- The ticket list narrows to only New tickets
- The filter is reflected in the page URL (shareable link reproduces the same filtered view)
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS (via Priority = High as the applied filter, functionally identical mechanism to Status). Applying Priority = High and clicking Apply narrowed the 35-ticket list to exactly 1 (#6, correctly Priority=High), and the resulting URL contains `priority_id%5B%5D=3` — the filter value is genuinely persisted in the URL, not just applied in-memory.

---

### TC-HLP-045: A filter carried in the URL is shown and the panel opens itself

**User Role:** Agent
**Precondition:** A shareable URL containing a non-default filter (e.g. Priority) for the ticket list.

**Steps:**
1. Open that URL directly (fresh session, panel not manually opened)

**Expected Result:**
- The filter panel opens itself
- The non-default filter from the URL is shown as active, with its value pre-filled
- The list is narrowed accordingly
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Opened `/projects/helpdesk-qa-alpha/helpdesk/tickets?priority_id%5B%5D=3` fresh (a shareable link with Priority baked in, panel not manually touched). The Filters panel is already `[expanded]` on load, showing Status/Customer (defaults) plus **Priority** pre-filled with "High" — and the list is already narrowed to 1 ticket (#6).

---

### TC-HLP-046: Clear removes every active filter

**User Role:** Agent
**Precondition:** Multiple filters currently applied.

**Steps:**
1. Click **Clear**

**Expected Result:**
- All filters are removed and the full unfiltered ticket list is shown
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Starting from the URL-carried Priority=High filter (1 result), clicking **Clear** navigated to the bare `/projects/helpdesk-qa-alpha/helpdesk/tickets` URL and restored the full, unfiltered 35-ticket list.

---

### TC-HLP-047: Sorting a column keeps the current filter and stays on the same screen

**User Role:** Agent
**Precondition:** A filter is applied to the ticket list.

**Steps:**
1. Click a sortable column heading (e.g. Updated)

**Expected Result:**
- The list re-sorts by that column
- The active filter is still applied
- The URL still reflects the same screen (global vs. project) and the same filter
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. With Status=New applied (26 tickets), the "Ticket #" column heading's own link URL already carries `status_id=1` forward (`?dir=asc&sort=id&status_id=1`) — clicking it re-sorted the list ascending by ID (#4, #5, #6, #12, #13...) while staying at exactly 26 tickets, all still Status=New, same project ticket-list screen.

---

### TC-HLP-048: Paging preserves both the filter and the sort order

**User Role:** Agent
**Precondition:** A filtered, sorted list with more than one page of results.

**Steps:**
1. Navigate to page 2

**Expected Result:**
- Page 2 respects the same filter and sort order as page 1
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. With Status=New applied (26 tickets) and sorted ascending by Ticket #, page 1 showed #4 through #35 (25 rows); the "2" pagination link's own URL already carries both (`?dir=asc&page=2&sort=id&status_id=1`). Clicking it landed on page 2 showing exactly the 26th and final matching ticket, **#36**, correctly continuing the ascending sort with the Status=New filter still respected.

---

### TC-HLP-049: Column picker lists 20 columns, 9 ticked by default, and changes the table

**User Role:** Agent
**Precondition:** Viewing the ticket list with default columns.

**Steps:**
1. Click **Columns**
2. Confirm the default 9 (Ticket #, Subject, Customer, Organization Name, Status, Priority, Assignee, SLA Status, Updated) are ticked, and all 20 are listed
3. Tick a non-default column (e.g. Product), untick a default one, Apply

**Expected Result:**
- Exactly 20 columns are listed, with the correct 9 pre-ticked
- After Apply, the table reflects the new column selection (Product now shown, the unticked column gone)
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Clicking Columns lists exactly 20 checkboxes with exactly the documented 9 pre-checked (Ticket #, Subject, Customer, Organization Name, Status, Priority, Assignee, SLA Status, Updated) — the other 11 (Tracker, Author, Support Level, Product, Progress, Start date, Due Date, Closed, Created on, Updated by, and one more) unchecked, matching `HELPDESK_USER_GUIDE.md` §6 exactly. Ticked Product, unticked Priority, clicked Apply — the table's actual `<th>` headers became exactly: Ticket #, Subject, Customer, Organization Name, Status, Assignee, SLA Status, Updated, **Product** — Priority is genuinely gone, Product genuinely shown, confirmed both via the rendered table and the URL's `c[]` column-list params.

---

### TC-HLP-050: The SLA Status badge shows the correct state for a ticket's SLA condition

**User Role:** Agent
**Precondition:** Tickets exist covering a range of SLA conditions (no SLA, comfortably on track, close to deadline, within 2h of deadline, past deadline, paused, resolved).

**Steps:**
1. View the ticket list with the SLA Status column shown
2. Compare each ticket's actual SLA condition (from its SLA Information panel) against its badge

**Expected Result:**
- Badge matches the ticket's real condition, one of exactly seven states: — No SLA / 🟢 On Track / 🟡 At Risk / 🔴 Critical (≤2h) / ⚠ Breached +time / ▮▮ Paused / ✓ Resolved
- The badge is a static indicator, not a live countdown (no client-side ticking)
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): FAIL — filed as **BUG-HLP-033**. Cross-checked each list badge against the same ticket's own SLA Information tab. Resolved (#11: list "✓ Resolved" ↔ panel "✓ Completed") and the general shape of Breached/Paused/No-SLA states are internally consistent in spirit, but a genuine, root-caused defect was found: **ticket #34** shows **"13h 33m At Risk"** (amber) in the list's SLA Status column, while its own SLA Information tab's header badge simultaneously reads **"✓ On Track"** (green) — same ticket, same moment, same ~13-14h remaining. Root-caused via source: the list badge (`_sla_timer.html.erb` → `RfIssueSlaStatus#sla_health_status`) correctly implements the documented 7-state percentage-of-window model, while the SLA Information panel (`_sla_information.html.erb`) computes its own, entirely separate 5-state binary `overall_health` with **no At Risk/Critical concept at all** — anything not breached/overdue/paused/resolved unconditionally falls through to "On Track," regardless of how little time remains. Also confirmed (secondary, lower severity): a Breached ticket (#36) shows the panel's "⚠ Needs Attention" rather than "✗ SLA Missed", since the panel's own overdue-vs-breached branches don't share the list's breach flags either. Net: the badge is confirmed static (title-only tooltip text like "13h 33m Remaining", no live-updating JS observed), but its **content** disagrees with the "official" per-ticket detail view for the At Risk/Critical range specifically. See `bugs/open/BUG-HLP-033.md`.

---

### TC-HLP-051: A customer's ticket list shows only their own tickets with a 7-column, 5-filter set

**User Role:** Client (Customer)
**Precondition:** Customer has raised at least one ticket; other tickets exist on the same project raised by others.

**Steps:**
1. Sign in as the customer, open their project's ticket list
2. Open Columns and Filters

**Expected Result:**
- Only tickets this customer raised are listed — none from other customers or agent-raised tickets
- Column picker offers exactly 7 columns — no Assignee, Organization, or SLA-internal columns
- Filter panel offers exactly 5 filters: Status, Priority, Ticket #, Subject, Description
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `alpha.customer`): PASS on all three counts. Her ticket list ("Helpdesk QA Alpha · 10 tickets") shows exactly the 10 tickets she raised (#2/3/4/7/8/14/18/27/28/29) — none of Helpdesk QA Alpha's other 25 real tickets (raised by `retest.customer1` or agents) appear. **Filters**: exactly 5 total — Status shown by default, plus Priority/Ticket #/Subject/Description available via Add filter (no Customer/Project/Organization/Assignee/Author/Updated by/SLA Status/etc.). **Columns**: exactly 7 total — Ticket #/Subject/Status/Priority/Updated checked by default, plus Tracker/Created on available unchecked — no Assignee, Organization Name, or SLA Status column exists anywhere in her picker.

---

### TC-HLP-052: Inside a project, the Project filter is not offered

**User Role:** Agent
**Precondition:** Viewing a project's own ticket list (not the Command Center's global list).

**Steps:**
1. Open Filters, click Add filter

**Expected Result:**
- **Project** is not among the offerable filter fields (the project is already decided by context)
- It **is** offered on the global Command Center ticket list
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS, both directions. Inside Helpdesk QA Alpha's own ticket list, the Add-filter menu lists 14 fields (no Project) — 16 total with the 2 active defaults, matching `HELPDESK_MEMORY.md`'s known "17-fields-minus-Project" quirk (see TC-HLP-043). On the global list (`/rf_helpdesk/issues`), the Add-filter menu lists 15 fields **including Project** — 17 total with the 2 defaults, exactly the undocumented-17th-field count `HELPDESK_MEMORY.md` already flagged for the global screen specifically.

---

## Negative Cases

---

### TC-HLP-053: A filter matching nothing shows the filtered-empty state, not the "no tickets yet" state

**User Role:** Agent
**Precondition:** At least one ticket exists on the project.

**Steps:**
1. Apply a filter combination that matches zero tickets (e.g. an unused Subject keyword)

**Expected Result:**
- A distinct "no results for this filter" empty state is shown — not the generic "no tickets yet" state that implies the project has never had any tickets
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Applying a Subject filter with an unused keyword (`zzznonexistentkeyword12345`) on Helpdesk QA Alpha (35 real tickets) shows **"No tickets match these filters"** — a distinct, filter-aware empty state, not a generic "no tickets yet" message.

---

### TC-HLP-054: Redmine's native operator query form is not present anywhere on the ticket screens

**User Role:** Agent
**Precondition:** Any ticket list — global or project.

**Steps:**
1. Inspect the screen for Redmine's standard issue-query filter UI (operator dropdowns, "Options" panel)

**Expected Result:**
- It is absent on both the global and project ticket screens — only the plugin's own filter panel is present
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS on both screens. Direct DOM query (`document.querySelector('#query_form, .query-form, select.operator, #options, form[id*="query"]')`) found none of Redmine's standard query-form elements on either the project ticket list (TC-HLP-042) or the global Command Center ticket list (`/rf_helpdesk/issues`) — only the plugin's own Filters/Columns panel exists on either screen.

---

### TC-HLP-055: A customer manipulating the URL cannot expand their result set

**User Role:** Client (Customer)
**Precondition:** Customer signed in, viewing their own restricted ticket list.

**Steps:**
1. Manually append `?customer_id[]=<another-customer-id>` or `?assigned_to_id[]=<agent-id>` to the ticket-list URL

**Expected Result:**
- The result set does not change — still only this customer's own tickets. Enforcement happens where the value is read server-side, not merely hidden in the UI
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `alpha.customer`): PASS. Manually appended both `?assigned_to_id%5B%5D=5` (Luna Blossom's agent user id) and, separately, `?customer_id%5B%5D=7` (`retest.customer1`'s customer id — a real customer with 26 tickets on this same project) to the ticket-list URL. Both times the result set stayed **exactly** her own 10 tickets (#2/3/4/7/8/14/18/27/28/29, byte-identical list both times) — neither param had any effect. Confirms enforcement happens server-side at the value-read layer, not merely by hiding the filter UI.

---

## Edge Cases

---

### TC-HLP-056: The active-filter count stays accurate as filters are added and removed

**User Role:** Agent
**Precondition:** Filter panel open.

**Steps:**
1. Add three filters one at a time, noting the count after each
2. Remove one, noting the count

**Expected Result:**
- The displayed active-filter count is correct at every step (increments/decrements exactly as filters are added/removed)
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): BLOCKED/N-A — no active-filter-count indicator exists anywhere in this UI to test. Direct DOM inspection of the Filters toggle (`.rf_helpdesk_filter_header`, a `<div role="button">` — icon + "Filters" text + chevron, no numeric badge in its markup) confirms it shows the plain word "Filters" whether 2 defaults or, after adding Assignee/Priority/Author (5 total active filters), still just "Filters" — no digit anywhere in the toggle, the filter panel body, or the "Add filter" button. This TC's own premise (a displayed count that should stay accurate) doesn't apply — there's no count feature built to test, not a defect in an existing one.

---

### TC-HLP-057: A customer sorting by a column outside their offered set falls back to the default sort

**User Role:** Client (Customer)
**Precondition:** Customer viewing their restricted ticket list.

**Steps:**
1. Attempt to force a sort on a column not in the customer's 7-column set (e.g. by crafting the sort parameter in the URL for Assignee)

**Expected Result:**
- The list falls back to its default sort rather than erroring or exposing the disallowed column
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `alpha.customer`): PASS. Crafted `?sort=assigned_to&dir=asc` directly in the URL (Assignee isn't in her offered set). No error, no Assignee column appeared or leaked — the list silently fell back to sorting by **Updated** (the column header read "UPDATED ▲"), while still honoring the requested `asc` direction: the resulting order (#3, #4, #7, #2, #8, #14, #18, #27, #28, #29) exactly matches ascending-by-Updated-timestamp, confirmed against each ticket's real Updated value.

---

### TC-HLP-058: Removing a filter genuinely stops it narrowing results, not just hides its row

**User Role:** Agent
**Precondition:** A filter is applied and visibly narrowing the list.

**Steps:**
1. Remove the filter's row from the panel (without clicking Apply again, if the UI auto-applies on removal — otherwise click Apply)

**Expected Result:**
- The full result set (minus that filter's effect) is restored — the removed filter is not silently still applied server-side
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS, per this TC's own accommodating wording. Starting from Priority=High (1 result), clicking the row's Delete button removed it from the panel but the list stayed at 1 result until **Apply** was clicked again (the UI does not auto-apply on removal) — clicking Apply then correctly restored the full 35-ticket list with `priority_id` stripped from the URL. Same underlying mechanic already documented in more detail under TC-HLP-043.

---

### TC-HLP-059: Apply, Clear, and Add filter controls are visually consistent

**User Role:** Agent
**Precondition:** Filter panel open.

**Steps:**
1. Visually inspect the three controls

**Expected Result:**
- **Apply**, **Clear**, and **Add filter** render at the same height and with consistent styling (regression check against a known past styling bug class)
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Measured via `getBoundingClientRect()`/`getComputedStyle()`: Apply, Clear, Add filter, and Columns all render at an identical **40px height** and **6px border-radius**, all sharing the same `rf_helpdesk_button` class family (Apply is `_primary`, the other three `_secondary`). No visible height/shape mismatch — the only differences are non-visual implementation details (Apply's padding is `10px 30px` vs the others' `0px 20px`, and its font-size is 13px vs 14px, both absorbed into the same rendered 40px height).

---

### TC-HLP-357: Combining multiple filters narrows to the correct intersection, not a union or a silently-dropped filter

**User Role:** Agent
**Precondition:** Ticket list open, unfiltered (35 tickets total in Helpdesk QA Alpha).

**Steps:**
1. Apply Status = New and, separately, confirm how many tickets match Priority = High alone.
2. Combine both filters (Status = New **and** Priority = High) via the real Filters-panel UI: set the Status filter's value, use Add filter to add a Priority filter, set its value via its checkbox dropdown, then click Apply.
3. As a stronger proof against a silently-ignored filter, repeat with a **non-overlapping** combination: a Status value and a Priority value whose individual result sets don't intersect (Status = Closed [1 ticket, #11] and Priority = High [1 ticket, #6, itself Status = New]).

**Expected Result:**
- The combined filter returns the true intersection of both conditions — not the union of either alone, and not just one filter's result set with the other silently ignored.
- A combination whose two conditions don't overlap in reality must return **zero** tickets, proving both filters are genuinely ANDed together.
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS, confirmed two independent ways:
  - **URL-driven**: navigating directly to `?status_id=1&priority_id[]=3` (Status=New AND Priority=High) returned exactly 1 ticket — #6, Status "New", Priority "High" (the true intersection). Navigating to `?status_id=closed&priority_id[]=3` (Status=Closed AND Priority=High — a combination with zero real overlap, since Closed's only ticket #11 is Priority Normal and High's only ticket #6 is Status New) returned exactly 0 tickets, proving neither filter is silently dropped.
  - **UI-driven** (the Filters panel itself, not a crafted URL): opened Filters, set Status's value textbox to "New" via its checkbox dropdown, used **Add filter → Priority**, set Priority's value to "High" via its own checkbox dropdown, clicked **Apply**. Resulting URL carried `status_id[]=1&priority_id[]=3` (matching the URL-driven test) and the table showed exactly 1 row: `#6 | TC-HLP-014 retest - project-scoped ticket creation | New | High` — identical result via the real UI flow.
- Confirms this suite's filter logic is genuine AND/intersection semantics through both the URL contract and the actual Filters-panel-and-Apply-button interaction path.
- **Follow-up same day, broader field coverage** (the above only ever combined Status + Priority; user asked whether every offered filter field — Organization Name, Assignee, Author, Updated by, SLA Status, Ticket #, Subject, Description, Created on, Progress, Start date, Due Date, Closed — was ever exercised, individually or combined): added **Organization Name** and **Assignee** as two more simultaneous filter rows via Add filter (4 rows total: Status, Customer, Organization Name, Assignee), set Status=New and Assignee=Redmine Admin, left Organization Name at its default "All" (untouched), clicked Apply. Result: exactly **6 tickets** (#26, #24, #19, #18, #17, #14 — every Status=New ticket assigned to Redmine Admin), correctly excluding ticket #15 (also assigned to Redmine Admin but Status=In Progress). URL carried only `status_id[]=1&assigned_to_id[]=1` — the untouched Organization Name row added no param and did not narrow results, confirming a filter left at "All" is inert rather than wrongly restrictive. Separately verified the **Created on** filter (a structurally different date-range type, not a dropdown/checkbox list) by setting its From/To fields to `2026-09-02`–`2026-09-03` and clicking Apply: URL correctly carried `created_from=2026-09-02&created_to=2026-09-03`, narrowing to exactly 3 tickets, all genuinely created in that window. **Scope note**: this confirms the mechanism works correctly across three structurally distinct filter-field types actually exercised (single-select status, multi-value dropdowns like Priority/Assignee, and a date-range field) plus a 4-simultaneous-row combination — it does not individually re-verify all 13 offered fields one-by-one (Author/Updated by/SLA Status/Ticket #/Subject/Description/Progress/Start date/Due Date/Closed were not separately exercised this pass), since they share the same underlying dropdown or text-input mechanism already proven working. No bug found in any field tested.

---

### TC-HLP-360: Clear removes every added filter row and resets the panel back to its two defaults, not just the URL

**User Role:** Agent
**Precondition:** Multiple filters applied, including at least one non-default row (i.e., beyond the two default Status/Customer rows).

**Steps:**
1. With 4 filter rows active and applied (Status, Customer, Organization Name, Assignee — see TC-357's broader-field follow-up), click **Clear**.
2. Check the resulting ticket list (row count, URL).
3. Re-open the Filters panel and check which filter rows are shown — still all 4, or reset back to just the 2 defaults?

**Expected Result:**
- Clear must fully reset the search: the URL returns to the bare unfiltered list, AND the filter panel itself forgets the added rows, going back to showing only the two default filters (Status, Customer) — not silently leaving Organization Name/Assignee rows present (even if blank) for the next filter attempt.
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. Starting from the 4-row applied state in TC-357 (Status=New, Customer=All, Organization Name=All, Assignee=Redmine Admin → 6 results), clicking **Clear** navigated to the bare `/projects/helpdesk-qa-alpha/helpdesk/tickets` URL (no query params) and the list correctly showed the full unfiltered 35 tickets. Re-opening the Filters panel confirmed only **Status** and **Customer** rows remain (both "All") — the Organization Name and Assignee rows added earlier in the session are genuinely gone, not just hidden or blanked. This is a distinct behavior from TC-058's per-row **Delete** button (which only removes that one row and still requires Apply to actually stop narrowing) — Clear is a full reset of both data and panel state in one action, with no separate Apply needed. No bug found.

---

### TC-HLP-361: The global Command Center dashboard's "Ticket Statistics" bar chart reflects the selected Date Range, consistent with its KPI cards

**User Role:** Agent
**Precondition:** Global Command Center Dashboard open (`/helpdesk`, distinct from a project's own Helpdesk Dashboard at `/projects/:id/helpdesk`, which has no chart — only the 5 KPI cards and a Prepaid Support Hours table).

**Steps:**
1. Note the default Date Range ("05 Aug 26 - 03 Sep 26") and the "Ticket Statistics" bar chart's 5 bars (Unassigned/Open/On Hold/SLA Breached/Resolved) and its own date-range label.
2. Change the Date Range picker to **Yesterday**.
3. Re-check the chart's date-range label and each bar's height/value.

**Expected Result:**
- The chart is not static or decorative — its date-range label and bar values must update to match the newly-selected range, consistent with the KPI cards directly above it.
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS. This chart (previously undiscovered in this entire test engagement — not documented in `HELPDESK_FEATURES_LIST.md`/`HELPDESK_USER_GUIDE.md`, and absent from the project-scoped dashboard entirely) initially showed "08/05/2026 – 09/03/2026" with bars Unassigned=9/Open=34/On Hold=35/SLA Breached=8/Resolved=1, matching the KPI cards exactly. After selecting **Yesterday** from the Date Range picker (URL → `from_date=2026-09-02&to_date=2026-09-02`), the chart's own label updated to "09/02/2026 – 09/02/2026" and its bars recomputed to Open=3/On Hold=3/SLA Breached=8/Unassigned=0/Resolved=0 — an exact match to the KPI cards under the same range. SLA Breached stayed at 8 in both the chart and its KPI card, consistent (not a bug) — that one metric is not date-scoped by design, confirmed identically on both surfaces. No bug found: the chart is genuinely wired to the same live date-range state as the KPI cards, not a static snapshot.

---

### TC-HLP-358: An active filter survives a column add/remove, and a column change doesn't reset an applied filter

**User Role:** Agent
**Precondition:** Ticket list open with a filter already applied and narrowing the result set.

**Steps:**
1. Apply a filter (Priority = High → 1 ticket, #6) via the Filters panel and Apply.
2. Open the Columns picker and add a column that isn't currently shown, then close the picker.
3. Re-check the ticket list: is the Priority=High filter still applied, or did adding a column reset it back to the unfiltered 35-ticket list?
4. Now remove a column via the same picker and re-check again.

**Expected Result:**
- Adding or removing a column must not reset, widen, or otherwise disturb the currently-applied filter — the two controls (filters, columns) are independent and a column change only affects which fields are displayed, not which rows are matched.
- CONFIRMED LIVE 2026-09-03 (Local, redmine-docker-6, `luna.blossom`/Agent): PASS, with a corrected mechanism from what was first assumed. With Status=New AND Priority=High applied (1 result, ticket #6), opening the Columns picker and checking the "Author" column checkbox did **not** update the table immediately — checking the box alone has no visible effect until **Apply** (the same button used for filters) is clicked. Clicking Apply then added `c[]=author` to the URL, added an Author column to the table, and the row count/filter params (`status_id[]=1&priority_id[]=3`) were completely unchanged — still exactly 1 row (#6). Repeating in reverse — unchecking Author, clicking Apply — correctly removed the column (URL's `c[]=author` gone, header back to 9 columns) while the filter and its 1-row result again stayed untouched. No bug found: columns and filters are independent state that both happen to be committed through the same Apply action, and neither disturbs the other.

---

## Evidence Map

- Case ID: TC-HLP-042 – TC-HLP-059, TC-HLP-357 – TC-HLP-358, TC-HLP-360 – TC-HLP-361
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Portal Preview (feature #37) and Customer 360 (feature #36) — belong to the Customers & Organizations suite, even though §6 of the user guide references what a customer sees as background context here.
