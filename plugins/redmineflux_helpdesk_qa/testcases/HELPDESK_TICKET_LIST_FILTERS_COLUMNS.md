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

---

### TC-HLP-044: Applying a filter narrows the list and persists in the URL

**User Role:** Agent
**Precondition:** Filter panel open with at least one filter set.

**Steps:**
1. Set Status = "New", click **Apply**

**Expected Result:**
- The ticket list narrows to only New tickets
- The filter is reflected in the page URL (shareable link reproduces the same filtered view)

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

---

### TC-HLP-046: Clear removes every active filter

**User Role:** Agent
**Precondition:** Multiple filters currently applied.

**Steps:**
1. Click **Clear**

**Expected Result:**
- All filters are removed and the full unfiltered ticket list is shown

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

---

### TC-HLP-048: Paging preserves both the filter and the sort order

**User Role:** Agent
**Precondition:** A filtered, sorted list with more than one page of results.

**Steps:**
1. Navigate to page 2

**Expected Result:**
- Page 2 respects the same filter and sort order as page 1

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

---

### TC-HLP-052: Inside a project, the Project filter is not offered

**User Role:** Agent
**Precondition:** Viewing a project's own ticket list (not the Command Center's global list).

**Steps:**
1. Open Filters, click Add filter

**Expected Result:**
- **Project** is not among the offerable filter fields (the project is already decided by context)
- It **is** offered on the global Command Center ticket list

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

---

### TC-HLP-054: Redmine's native operator query form is not present anywhere on the ticket screens

**User Role:** Agent
**Precondition:** Any ticket list — global or project.

**Steps:**
1. Inspect the screen for Redmine's standard issue-query filter UI (operator dropdowns, "Options" panel)

**Expected Result:**
- It is absent on both the global and project ticket screens — only the plugin's own filter panel is present

---

### TC-HLP-055: A customer manipulating the URL cannot expand their result set

**User Role:** Client (Customer)
**Precondition:** Customer signed in, viewing their own restricted ticket list.

**Steps:**
1. Manually append `?customer_id[]=<another-customer-id>` or `?assigned_to_id[]=<agent-id>` to the ticket-list URL

**Expected Result:**
- The result set does not change — still only this customer's own tickets. Enforcement happens where the value is read server-side, not merely hidden in the UI

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

---

### TC-HLP-057: A customer sorting by a column outside their offered set falls back to the default sort

**User Role:** Client (Customer)
**Precondition:** Customer viewing their restricted ticket list.

**Steps:**
1. Attempt to force a sort on a column not in the customer's 7-column set (e.g. by crafting the sort parameter in the URL for Assignee)

**Expected Result:**
- The list falls back to its default sort rather than erroring or exposing the disallowed column

---

### TC-HLP-058: Removing a filter genuinely stops it narrowing results, not just hides its row

**User Role:** Agent
**Precondition:** A filter is applied and visibly narrowing the list.

**Steps:**
1. Remove the filter's row from the panel (without clicking Apply again, if the UI auto-applies on removal — otherwise click Apply)

**Expected Result:**
- The full result set (minus that filter's effect) is restored — the removed filter is not silently still applied server-side

---

### TC-HLP-059: Apply, Clear, and Add filter controls are visually consistent

**User Role:** Agent
**Precondition:** Filter panel open.

**Steps:**
1. Visually inspect the three controls

**Expected Result:**
- **Apply**, **Clear**, and **Add filter** render at the same height and with consistent styling (regression check against a known past styling bug class)

---

## Evidence Map

- Case ID: TC-HLP-042 – TC-HLP-059
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Portal Preview (feature #37) and Customer 360 (feature #36) — belong to the Customers & Organizations suite, even though §6 of the user guide references what a customer sees as background context here.
