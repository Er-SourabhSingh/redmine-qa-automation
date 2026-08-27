# Test Cases — Redmineflux Helpdesk — Features 38–40: Prepaid Support Hours

> Source: `docs/HELPDESK_FEATURES_LIST.md` #38–40 (category F). Grounded in `docs/HELPDESK_USER_GUIDE.md` §12 (Prepaid support hours) and tester checklist §26 group Q.
>
> Reply time logging debiting the budget (feature #16) is already covered in `HELPDESK_TICKET_LIFECYCLE.md` (TC-HLP-024) — not repeated here, only exercised as a means to move Used. The Dashboard showing prepaid hours per organization (feature #7) is already covered in `HELPDESK_NAVIGATION_WORKSPACES.md` (TC-HLP-067).

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-125: Setting an initial budget increases the Approved total, with a required Comment

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** An organization with no existing prepaid budget on a given project.

**Steps:**
1. Helpdesk › Organizations › [organization] › Prepaid Support Hours › Add / top up hours
2. Project: pick the target project; Package: `40`; Comment: `Initial purchase`
3. Save

**Expected Result:**
- Approved total becomes 40 hours
- The entry is recorded with its comment
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, Alpha Org / Helpdesk QA Alpha project): PASS. Real dialog fields: Project (`#prepaid_project_id`), Hours (`#prepaid_hour`, number input), Support Package (`#prepaid_support_package_id`, optional — "-- No package --" default since no Support Packages exist locally), Comment (`#prepaid_comment`, required). Summary cards showed exactly 40.00h/0.00h/40.00h (Approved/Used/Remaining); Budget change history logged "0.00h → 40.00h" with the comment and "Redmine Admin" as Approved By. No "Run-out mode" field exists in this dialog — it's a separate inline dropdown per project row in the "Budget by project" table (`select[name="mode"]`, options "No limit"/"Hard — stop work"/"Soft — allow overage"). Locators added to `HelpdeskOrganizationPage.ts`.

---

### TC-HLP-126: Topping up an existing budget adds to the current total, not replaces it

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** Budget currently at 40 hours Approved (TC-HLP-125).

**Steps:**
1. Add / top up hours: Package `20`, Comment `Top-up`, Save

**Expected Result:**
- Approved total becomes **60** (40 + 20) — the number entered is a change, not a new total

---

### TC-HLP-127: A negative Package number reduces the budget

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** Budget currently at 60 hours Approved (TC-HLP-126).

**Steps:**
1. Add / top up hours: Package `-5`, Comment `Correction — over-invoiced`, Save

**Expected Result:**
- Approved total becomes **35** (60 − 5)

---

### TC-HLP-128: Every budget change is kept as a permanent, non-overwriting entry

**User Role:** Manager or Admin
**Precondition:** At least two prior budget changes exist (TC-HLP-125–127).

**Steps:**
1. Open the budget's change history

**Expected Result:**
- Every prior entry (40, +20, −5) is still listed individually
- Each entry shows the change applied, the resulting new total, and the previous total — none are overwritten or merged

---

### TC-HLP-129: Logging time against the organization's tickets on this project raises Used immediately

**User Role:** Agent
**Precondition:** A ticket authored by a customer belonging to this organization, on this project; budget has remaining hours.

**Steps:**
1. Reply to the ticket, logging 15 minutes of time
2. Check the organization's prepaid hours page immediately after

**Expected Result:**
- Used increases by 0.25 h (15 minutes) right away — no delay or background job needed

---

### TC-HLP-130: Remaining is correctly recalculated as Approved − Used

**User Role:** Agent or Manager
**Precondition:** Approved = 35 h, Used = 0.25 h (from TC-HLP-127 and TC-HLP-129).

**Steps:**
1. View the organization's prepaid hours summary

**Expected Result:**
- Remaining shows **34.75 h** (35 − 0.25)

---

### TC-HLP-131: The Ledger lists every contributing time entry, oldest first, with running balance

**User Role:** Manager or Admin
**Precondition:** Multiple time entries have been logged against this organization's tickets over time.

**Steps:**
1. Open the organization's prepaid hours Ledger

**Expected Result:**
- Every time entry that contributed to Used is listed, oldest first
- Each row shows the running balance immediately after that entry — the full "where did the hours go" trail is reconstructable
- **Partially confirmed live 2026-08-26** (Local): the Ledger view itself is real and reachable via a per-project-row "Ledger" link (`?ledger_project_id=N&tab=prepaid_support_hours`), with its own Approved/Used/Remaining summary, an "Export as CSV" link (`/rf_organizations/:id/prepaid_ledger_export?project_id=N`), and empty state "No hours logged yet." Not yet exercised with actual logged time (needs a customer ticket + reply time-log on the same project) — the row-by-row content/running-balance format itself remains unverified. `openLedger()` added to `HelpdeskOrganizationPage.ts`.

---

### TC-HLP-132: The organization page and the project dashboard show matching figures

**User Role:** Agent or Manager
**Precondition:** A budget with some Used hours already logged.

**Steps:**
1. Note Approved/Used/Remaining on the organization's own page
2. Note the same organization's figures on the project's Dashboard

**Expected Result:**
- Both locations show identical figures

---

### TC-HLP-133: No Limit mode blocks nothing once the budget is exhausted

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **No limit**; budget fully spent (Remaining ≤ 0).

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed; the balance simply continues going negative with no blocking

---

### TC-HLP-134: Hard mode behaves normally while budget remains

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **Hard**; budget still has Remaining hours > 0.

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed normally — Hard mode only blocks once hours actually reach zero (see TC-HLP-138/139)

---

### TC-HLP-135: Soft mode allows work to continue and the balance to go negative

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **Soft**; budget fully spent.

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed; balance goes negative with no limit, same as No Limit mode — Soft differs from No Limit only in visibly signaling the run-out state (record if/how it's surfaced differently)

---

## Negative Cases

---

### TC-HLP-136: Reducing a budget below zero is refused, naming the current total

**User Role:** Manager or Admin
**Precondition:** Budget currently at 35 h Approved.

**Steps:**
1. Attempt Add / top up hours with Package `-40`, Comment `Test`, Save

**Expected Result:**
- The change is refused with a message naming the current total (35 h)
- The budget remains unchanged at 35 h — nothing is applied

---

### TC-HLP-137: Setting a budget change without a Comment is refused

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Add / top up hours: enter a Package value, leave Comment blank, attempt Save

**Expected Result:**
- Save is refused — Comment is required as the audit trail

---

### TC-HLP-138: Hard mode at zero hours blocks the customer from raising a new ticket

**User Role:** Client (Customer)
**Precondition:** Run-out mode = **Hard**; budget Remaining = 0.

**Steps:**
1. As the customer, attempt to raise a new ticket on this project

**Expected Result:**
- The new ticket is refused/blocked

---

### TC-HLP-139: Hard mode at zero hours blocks logging time on this organization's tickets

**User Role:** Agent
**Precondition:** Same as TC-HLP-138.

**Steps:**
1. As an agent, attempt to log time on one of this organization's existing tickets on this project

**Expected Result:**
- Logging time is refused/blocked

---

## Edge Cases

---

### TC-HLP-140: An over-budget state is correctly shown as negative Remaining

**User Role:** Agent or Manager
**Precondition:** Run-out mode allows going negative (No Limit or Soft); Used has exceeded Approved.

**Steps:**
1. View the organization's prepaid hours summary

**Expected Result:**
- Remaining is shown as a negative number (Used − Approved), and/or an "Over budget" indicator is shown

---

### TC-HLP-141: Existing tickets remain repliable in every run-out mode, even when exhausted

**User Role:** Agent
**Precondition:** Budget exhausted, under each of No Limit / Hard / Soft in turn.

**Steps:**
1. Under each mode, open an existing ticket for this organization and send a reply (with or without logging time, depending on the mode's time-logging rule)

**Expected Result:**
- In every mode, an existing ticket's conversation can continue — running out stops new work/billing, not an ongoing conversation

---

### TC-HLP-142: A budget is scoped to one organization on one project, tracked independently per project

**User Role:** Manager or Admin
**Precondition:** The same organization has entitlements/tickets on two different projects.

**Steps:**
1. Set a budget for the organization on Project A
2. Set a separate budget for the same organization on Project B
3. Log time against tickets on each project

**Expected Result:**
- Project A's and Project B's budgets track Approved/Used/Remaining completely independently — activity on one never affects the other's figures

---

## Evidence Map

- Case ID: TC-HLP-125 – TC-HLP-142
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
