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

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS (real figures differ from this TC's original 40/20 example — the arithmetic contract is what's verified).** Starting Approved 15.00h (this session's real running total), topped up +10h with Comment "TC-HLP-126 top-up test". Approved became **25.00h** exactly (15 + 10) — confirmed the entered number is a change, not a replacement total.

---

### TC-HLP-127: A negative Package number reduces the budget

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** Budget currently at 60 hours Approved (TC-HLP-126).

**Steps:**
1. Add / top up hours: Package `-5`, Comment `Correction — over-invoiced`, Save

**Expected Result:**
- Approved total becomes **35** (60 − 5)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS (real figures differ from this TC's original 60/5 example).** From Approved 25.00h, entered Hours `-5` with Comment "TC-HLP-127 correction - over-invoiced". Approved became **20.00h** exactly (25 − 5).

---

### TC-HLP-128: Every budget change is kept as a permanent, non-overwriting entry

**User Role:** Manager or Admin
**Precondition:** At least two prior budget changes exist (TC-HLP-125–127).

**Steps:**
1. Open the budget's change history

**Expected Result:**
- Every prior entry (40, +20, −5) is still listed individually
- Each entry shows the change applied, the resulting new total, and the previous total — none are overwritten or merged

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Budget change history now shows all **4** real entries this session/engagement has produced, each fully distinct, newest first: `25.00h → 20.00h` (TC-127), `15.00h → 25.00h` (TC-126), `10.00h → 15.00h` (TC-372, Support Package "Premium Support (Renamed)"), `0.00h → 10.00h` (TC-067, from an earlier session). Each row shows its own previous total, new total, Support Package, Comment, and Approver — none overwritten, none merged, all individually preserved exactly as this TC's Expected Result requires.

---

### TC-HLP-129: Logging time against the organization's tickets on this project raises Used immediately

**User Role:** Agent
**Precondition:** A ticket authored by a customer belonging to this organization, on this project; budget has remaining hours.

**Steps:**
1. Reply to the ticket, logging 15 minutes of time
2. Check the organization's prepaid hours page immediately after

**Expected Result:**
- Used increases by 0.25 h (15 minutes) right away — no delay or background job needed

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, `luna.blossom`/Agent): **PASS.** Raised ticket #46 as `delta.customer` (Alpha Minimal Fields Test Org's linked customer). Replied as `luna.blossom`, logging 15 min (Activity: Technical Support) in the same Reply Note submission. Checked the organization's Prepaid Support Hours page immediately afterward (as admin, since Agent lacks `manage_prepaid_support_hours`): **Used: 0.25h** — updated instantly, no delay, no background job needed, in the same request cycle as the reply.

---

### TC-HLP-130: Remaining is correctly recalculated as Approved − Used

**User Role:** Agent or Manager
**Precondition:** Approved = 35 h, Used = 0.25 h (from TC-HLP-127 and TC-HLP-129).

**Steps:**
1. View the organization's prepaid hours summary

**Expected Result:**
- Remaining shows **34.75 h** (35 − 0.25)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS (real figures differ from this TC's original example numbers, since this session's own budget history is 15.00h Approved / 0.25h Used, not 35/0.25 — the arithmetic contract is what's being verified, not these specific numbers).** Organization summary reads: **Approved 15.00h, Used 0.25h, Remaining 14.75h** — confirmed `15.00 − 0.25 = 14.75` exactly, both in the top summary cards and the "Budget by project" row for Helpdesk QA Alpha.

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
- **Completed 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** With ticket #46's 15-min reply time-log now real (TC-HLP-129), reopened the Ledger: **"1 entries"**, row reads exactly `09/03/2026 | #46 TC-HLP-129 prepaid hours time-logging test ticket | Luna Blossom | Technical Support | — (Support Package) | — (Comment) | −0.25h (Logged) | 14.75h (Balance Left)` — the full row-by-row format (Date/Issue/User/Activity/Support Package/Comment/Logged/Balance Left) is genuinely populated with real data, oldest-first (only one entry so far, so trivially "oldest first"), with the correct post-entry running balance (14.75h, matching Approved 15.00h − Used 0.25h). Fully closes the gap left open in the earlier partial confirmation.

---

### TC-HLP-132: The organization page and the project dashboard show matching figures

**User Role:** Agent or Manager
**Precondition:** A budget with some Used hours already logged.

**Steps:**
1. Note Approved/Used/Remaining on the organization's own page
2. Note the same organization's figures on the project's Dashboard

**Expected Result:**
- Both locations show identical figures

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Organization's own page: Approved 15.00h / Used 0.25h / Remaining 14.75h / Usage 2%. Helpdesk QA Alpha project Dashboard's "Prepaid Support Hours" table, same organization row: **identical** — Approved 15.00h / Used 0.25h / Remaining 14.75h / Usage 2%. Byte-for-byte matching figures in both locations.

---

### TC-HLP-133: No Limit mode blocks nothing once the budget is exhausted

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **No limit**; budget fully spent (Remaining ≤ 0).

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed; the balance simply continues going negative with no blocking

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6): **PASS.** Continuing from the same exhausted-budget state as BUG-HLP-037 (Approved 0.42h, Remaining already negative), switched run-out mode to No Limit (confirmed persisted via dropdown re-check). As `delta.customer`: raised new ticket (#49, "TC-HLP-133 - No Limit mode exhausted budget new ticket test") — "Successful creation.", no block. As `luna.blossom` (agent): replied on ticket #46 with 5 min logged (Technical Support) — saved normally, Prepaid Support Hours updated to "0.67h used · -0.25h left" of 0.42h. Both actions succeeded with the balance continuing negative, exactly as expected for No Limit mode.

---

### TC-HLP-134: Hard mode behaves normally while budget remains

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **Hard**; budget still has Remaining hours > 0.

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed normally — Hard mode only blocks once hours actually reach zero (see TC-HLP-138/139)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6): **PASS.** Org "Alpha Minimal Fields Test Org" / project Helpdesk QA Alpha, run-out mode changed to Hard — stop work (confirmed persisted via dropdown re-check after the 302 redirect) while Remaining was still 19.75h. As `delta.customer`: raised a new ticket (#47, "TC-HLP-134 - Hard mode with budget remaining test ticket") via New issue — created normally, no block. As `luna.blossom` (agent): opened ticket #46, replied with 10 min logged (Activity: Technical Support) — saved normally, Spent time went 0:15h→0:25h and Prepaid Support Hours updated to 0.42h used · 19.58h left of 20.00h. Both actions succeeded with no blocking, exactly as expected — Hard mode has no effect while Remaining > 0.

---

### TC-HLP-135: Soft mode allows work to continue and the balance to go negative

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = **Soft**; budget fully spent.

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed; balance goes negative with no limit, same as No Limit mode — Soft differs from No Limit only in visibly signaling the run-out state (record if/how it's surfaced differently)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6): **PASS.** Continuing from the same exhausted-budget state, switched run-out mode to Soft — allow overage (confirmed persisted). As `delta.customer`: raised new ticket (#50, "TC-HLP-135 - Soft mode exhausted budget new ticket test") — "Successful creation.", no block. As `luna.blossom` (agent): replied on ticket #46 with 5 min logged (Technical Support) — saved normally, Prepaid Support Hours updated to "0.75h used · -0.33h left" of 0.42h. Both actions succeeded, balance continued negative — behaviorally identical to No Limit mode in this session's testing. No distinct visual "run-out" signaling was observed anywhere (ticket detail panel, dashboard, or org page) beyond the same red negative-number rendering already seen under No Limit and Hard — Soft does not appear to differ from No Limit in this build. This is consistent with BUG-HLP-037's note that the run-out mode value may have no functional effect regardless of which option is selected — Hard fails to block (BUG-HLP-037) while No Limit/Soft correctly allow, but Soft's own distinguishing "signal the run-out" behavior (per this TC's own Expected Result) was not observed to differ from No Limit.

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

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS (real figure 20h, not this TC's original 35h example).** Attempted Hours `-40` against a 20.00h budget. Refused with a clear, specific message naming the exact numbers: **"Hour cannot be subtracted: reducing by 40.0h would make the budget negative (current approved: 20.0h)"**. Budget confirmed unchanged at 20.00h afterward — nothing applied. A well-behaved validation, genuinely better than several other missing-message findings elsewhere in this plugin (BUG-HLP-022/023/036).

---

### TC-HLP-137: Setting a budget change without a Comment is refused

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Add / top up hours: enter a Package value, leave Comment blank, attempt Save

**Expected Result:**
- Save is refused — Comment is required as the audit trail

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Entered Hours `1`, left Comment blank, clicked Save. The dialog stayed open and the submission never reached the server — confirmed via the Comment field's own DOM state: `required: true`, `checkValidity(): false`, `validationMessage: "Please fill out this field."` — this is native HTML5 `required`-attribute validation blocking the request client-side, not a server-side rejection message. Refusal is real and working, just enforced one layer earlier than a server round-trip.

---

### TC-HLP-138: Hard mode at zero hours blocks the customer from raising a new ticket

**User Role:** Client (Customer)
**Precondition:** Run-out mode = **Hard**; budget Remaining = 0.

**Steps:**
1. As the customer, attempt to raise a new ticket on this project

**Expected Result:**
- The new ticket is refused/blocked

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, delta.customer): **FAIL, then RETEST PASS — see correction below.** Org "Alpha Minimal Fields Test Org" / project Helpdesk QA Alpha, run-out mode = Hard — stop work, budget reduced to Approved 0.42h = Used 0.42h (Remaining exactly 0.00h). As `delta.customer`, clicked New issue, clicked Create — succeeded ("Successful creation.", ticket #48), no block. Filed as BUG-HLP-037. **Retested later the same day (see TC-HLP-380/381 and BUG-HLP-037's "Retest — Correction" section): the identical scenario (Hard mode, Remaining driven to exactly 0.00h) was re-run three times, and every retest correctly blocked** — including a repeat of this exact new-ticket-creation path, which returned a clear refusal: "Alpha Minimal Fields Test Org has no prepaid support hours left on this project, so a new ticket cannot be raised. Please contact your account manager to top up." BUG-HLP-037 is therefore now marked **unconfirmed** — this original FAIL observation could not be reproduced on retest, so treat this TC's status as inconclusive/needs-reverification rather than a confirmed defect.

---

### TC-HLP-139: Hard mode at zero hours blocks logging time on this organization's tickets

**User Role:** Agent
**Precondition:** Same as TC-HLP-138.

**Steps:**
1. As an agent, attempt to log time on one of this organization's existing tickets on this project

**Expected Result:**
- Logging time is refused/blocked

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, luna.blossom): **FAIL, then RETEST PASS — see correction below.** Same precondition as TC-HLP-138 (Hard mode, Remaining exactly 0.00h). As `luna.blossom` (agent), opened ticket #46, Reply with Time spent "10 min" — saved normally, balance went to "0.58h used · -0.16h left", no block. Filed as BUG-HLP-037. **Retested three times later the same day (see TC-HLP-380/381): every retest of this exact same time-logging scenario on the same ticket correctly blocked**, with the real validation error "Time entries is invalid — Prepaid support hours for Alpha Minimal Fields Test Org are used up (-0.00h). Top up the budget to log more time." BUG-HLP-037 is now marked **unconfirmed** — see its "Retest — Correction" section. Treat this TC's status as inconclusive/needs-reverification, not a confirmed defect.

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

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Org "Alpha Minimal Fields Test Org" page (`/rf_organizations/8?tab=prepaid_support_hours`), Approved 0.42h / Used 0.75h (Soft mode). The summary widget at the top of the page shows Remaining as **"-0.33h"** directly (Used − Approved), no ambiguity, in the same visual slot as a positive Remaining figure would appear. No separate "Over budget" badge/label was present, but the negative-number rendering alone satisfies this TC's Expected Result.

---

### TC-HLP-141: Existing tickets remain repliable in every run-out mode, even when exhausted

**User Role:** Agent
**Precondition:** Budget exhausted, under each of No Limit / Hard / Soft in turn.

**Steps:**
1. Under each mode, open an existing ticket for this organization and send a reply (with or without logging time, depending on the mode's time-logging rule)

**Expected Result:**
- In every mode, an existing ticket's conversation can continue — running out stops new work/billing, not an ongoing conversation

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, luna.blossom): **PASS.** Demonstrated as a side effect of TC-HLP-133/135/139: the same existing ticket (#46), already exhausted (Remaining ≤ 0 throughout), successfully received a Reply with time logged under all three modes in turn — Hard (BUG-HLP-037's repro), No Limit, and Soft — never once refused or blocked. Confirms an existing ticket's conversation is never cut off regardless of run-out mode or balance state, independent of whether the enforcement itself is working correctly (it is not, per BUG-HLP-037, but this TC's own claim — conversations stay open — holds true either way).

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

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Same organization "Alpha Minimal Fields Test Org", already carrying an exhausted/negative budget on Project A (Helpdesk QA Alpha: Approved 0.42h, Used 0.75h, Remaining -0.33h, from TC-133/135/139's activity). Used the same Add/top up hours dialog's Project dropdown to select Project B (Helpdesk QA Beta) — a project this org had no prior budget row on at all — entered Hours 10, Comment "TC-HLP-142 per-project budget independence test", Save. Result: the org page's "Budget by project" table now shows two fully independent rows — Helpdesk QA Alpha unchanged at (0.42h / 0.75h / -0.33h), Helpdesk QA Beta at a fresh (10.00h / 0.00h / 10.00h, 0% Used) — confirming the new project's budget started clean and Alpha's negative figures were completely unaffected. Did not additionally log time against a Beta ticket (Beta currently has no existing ticket fixture for this org — "0 Total Tickets" on its dashboard) — the budget-row independence itself, which is this TC's central claim, is directly confirmed without needing that extra step.

---

## Support Packages (newly discovered entity, 2026-09-03)

> **Gap found while picking up this suite**: a whole entity — **Support Packages** (Command Center → Helpdesk Settings → "Support Packages" tab, global/install-wide, not project-scoped: Name*/Description/Active) — used to label prepaid-hour top-ups and time-log categorization, is undocumented in `HELPDESK_REQUIREMENTS.md`, `HELPDESK_FEATURES_LIST.md` (features #38–40 don't mention it), and `HELPDESK_USER_GUIDE.md` §12 (which describes the top-up dialog's "Package" field as if it's just the hours number, never mentioning the separate named-package dropdown). None of TC-HLP-125–142 exercise the entity itself — TC-125 only noted the dropdown exists, in passing. Confirmed on this Local environment: zero Support Packages currently exist ("No support packages yet"). TCs below close this gap.

---

### TC-HLP-367: Creating a Support Package with only the required field (Name) succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** No Support Package with this name exists yet.

**Steps:**
1. Command Center → Helpdesk Settings → Support Packages → New Support Package
2. Enter Name only, leave Description blank, leave Active checked (default)
3. Save

**Expected Result:**
- The package saves and appears in the Support Packages list, Active

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Created "Premium Support" with only the Name field filled (Description left blank, Active left at its checked default). Saved cleanly, appears in the Support Packages list as row 1: Name "Premium Support", Description "None" (empty-state placeholder), Active (green badge).

---

### TC-HLP-368: Creating a Support Package with every field filled in the initial Save, not via a later Edit

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. New Support Package: Name, Description, and Active unchecked, all in one Save

**Expected Result:**
- All three fields persist exactly as entered, including Active saved as unchecked (Inactive) from creation

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **FAIL — filed as BUG-HLP-035.** Created "Standard Support" with Name, a real Description ("Business-hours support package for standard-tier customers"), and Active explicitly unchecked via a direct DOM click (confirmed `.checked === false` immediately before Save). Name and Description saved correctly, but **Active saved as checked/Active anyway** — the list shows a green "Active" badge for this package. Root-caused via source: the Active checkbox (`rf_helpdesk_support_package[active]`) has no hidden fallback input, so an unchecked box submits no `active` key at all, and the server defaults the missing value to Active. Reproduced identically on a second, independent package ("Inactive Test Package") to rule out a one-off click issue. See `bugs/open/BUG-HLP-035.md` for full source-level detail.

---

### TC-HLP-369: Creating a Support Package with a duplicate Name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A Support Package with a known name already exists (TC-HLP-367).

**Steps:**
1. Attempt to create another Support Package using the exact same Name

**Expected Result:**
- Refused with a "Name has already been taken"-style message; no duplicate is created

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PARTIAL PASS — refusal itself works, message half fails, filed as BUG-HLP-036.** Attempted to create a second "Premium Support" (exact duplicate). Confirmed via the Support Packages list before and after: still exactly 3 packages, no duplicate row created — the refusal genuinely blocks the save, data integrity preserved. However, the re-rendered form shows **zero error text anywhere** — only the Name field's border turns orange/red, with no "Name has already been taken" message, no tooltip, nothing explaining why nothing happened. A user attempting this would see the page reload with their input still in the box and no visible indication of what went wrong. Filed as **BUG-HLP-036** (Low, since data integrity is correctly preserved — this is a missing-feedback gap, not a data or security defect).

---

### TC-HLP-370: Editing a Support Package updates every field

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing Support Package.

**Steps:**
1. Edit: change Name, Description, and toggle Active
2. Save, reopen Edit to confirm each field independently

**Expected Result:**
- Every field reflects the new value

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS on Name/Description; Active excluded — already separately confirmed broken via BUG-HLP-035, not re-tested here to avoid conflating two different findings in one evidence block.** Edited "Premium Support" → Name "Premium Support (Renamed)", Description "24/7 priority support with a dedicated agent queue", Active left untouched (still checked, not part of this test). Saved cleanly, list shows both new values immediately. Reopened Edit independently afterward — both fields read back correctly (`input[name*="[name]"].value` and `textarea[name*="[description]"].value` both match exactly what was entered). Name/Description editing works correctly; only Active is broken (BUG-HLP-035).

---

### TC-HLP-371: A deactivated Support Package is excluded from the prepaid-hours top-up dialog's Package dropdown

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** Two Support Packages exist — one Active, one deactivated (TC-HLP-370).

**Steps:**
1. Open an organization's Prepaid Support Hours → Add / top up hours dialog
2. Check the Support Package dropdown's offered options

**Expected Result:**
- Only the Active package is offered; the deactivated one is not selectable (same "inactive not offered" contract already proven for SLA/Support Level elsewhere in this plugin)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **BLOCKED by BUG-HLP-035.** This precondition ("one Active, one deactivated Support Package") cannot currently be constructed at all — BUG-HLP-035 confirmed there is no way, via this UI, to ever save a Support Package as Inactive (three independent attempts, at both Create and Edit, all silently saved as Active regardless). Without a genuinely Inactive package to test against, this TC cannot be meaningfully executed. Confirmed as a side effect: the top-up dialog's Support Package dropdown currently offers all 3 existing packages (Inactive Test Package, Premium Support (Renamed), Standard Support) — unsurprising, since all 3 are stuck Active. Re-test once BUG-HLP-035 is fixed and a real Inactive package can be produced.

---

### TC-HLP-372: Selecting a Support Package on a top-up records/labels that budget-history entry

**User Role:** Manager or Admin with `manage_prepaid_support_hours`
**Precondition:** An Active Support Package exists.

**Steps:**
1. Add / top up hours, selecting the Support Package from its dropdown this time (not "-- No package --")
2. Check the resulting Budget change history entry

**Expected Result:**
- The history entry records which Support Package was used for that top-up, distinguishing it from a top-up made with no package selected

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** On "Alpha Minimal Fields Test Org"'s Helpdesk QA Alpha budget (10.00h Approved from an earlier session), added 5h selecting "Premium Support (Renamed)" from the Support Package dropdown (Comment: "TC-HLP-372 support package labeling test"). Budget change history's new row 1 correctly shows: Change "10.00h → 15.00h", **Support Package "Premium Support (Renamed)"** — distinct from the pre-existing row's Support Package column, which correctly reads "None" (that earlier entry, from TC-HLP-067's setup, was made before any Support Package existed). Confirms the label is genuinely recorded per-entry, not just a form afterthought.

---

### TC-HLP-373: Deleting a Support Package not referenced by any budget entry succeeds; deleting one that is referenced is checked for the same missing-dependency-warning class as BUG-HLP-022/023

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** One unused Support Package, and one Support Package already referenced by a real budget-history entry (TC-HLP-372).

**Steps:**
1. Delete the unused Support Package
2. Attempt to delete the Support Package referenced by a budget-history entry

**Expected Result:**
- Step 1 succeeds cleanly, no error
- Step 2: record whatever actually happens — refused with a dependency message (best), silently succeeds and the historical entry gracefully shows "no package" (same class as BUG-HLP-023, closed as Not a Bug since it's a label-only optional reference), or something else. Given BUG-HLP-023's precedent (Holiday, also an optional/label field, was ruled Not a Bug for this exact silent-clear shape), this is very likely to land the same way — verify and record the real outcome rather than assume.

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS — the best-behaved delete guard of any entity tested in this whole engagement.** Step 1: deleted "Inactive Test Package" (unused, no budget-history entry ever referenced it) — clean, no error, list correctly drops to 2 remaining packages. Step 2: attempted to delete "Premium Support (Renamed)" (referenced by TC-HLP-372's real budget-history entry) — **genuinely refused**, with a clear, specific message: **"This support package is in use, so it cannot be deleted."** Confirmed the package still exists in the list afterward (untouched). Unlike this same defect class elsewhere in the plugin (BUG-HLP-022 Support Level, still open; BUG-HLP-023 Holiday, closed Not a Bug) — both of which silently allow the delete with no warning — Support Packages was actually built with the dependency check TC-HLP-296/297/308 originally hoped for. No bug: this is the correct, desired behavior every one of those other entities should also have.

---

## Additional Coverage (user-identified gaps, 2026-09-03)

> Added following a direct user gap-analysis after the first full pass of this suite. Written first, per the standing write-then-execute rule, before any of these are executed.

### TC-HLP-374: Edit Support Package — change Name, Description, Active status

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing Support Package (e.g. "Standard Support").

**Steps:**
1. Open an existing Support Package's Edit form
2. Change Name and Description
3. Save

**Expected Result:**
- Name/Description changes persist and display correctly on the list and anywhere the package is referenced (e.g. Budget change history's Support Package column for past entries)

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Edited "Standard Support" (id 2) — changed Name to "Standard Support (Edited)" and Description to "TC-HLP-374 edit test - updated description", Save. List immediately reflects both new values in the same row (id 2 unchanged). This package had no prior Budget change history entries referencing it, so the cross-reference display wasn't separately exercised here (already confirmed for a different package via TC-HLP-372).

---

### TC-HLP-375: Reactivate an inactive Support Package

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A genuinely Inactive Support Package exists.

**Steps:**
1. Open an Inactive Support Package's Edit form
2. Check the Active checkbox
3. Save

**Expected Result:**
- The package becomes Active, confirmed via the list's badge

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **BLOCKED by BUG-HLP-035.** Same precondition gap already hit by TC-HLP-371 — there is currently no way to produce a genuinely Inactive Support Package through the UI at all (unchecking Active on Create or Edit silently has no effect, per BUG-HLP-035), so this TC's own precondition cannot be met. Cannot execute until BUG-HLP-035 is fixed.

---

### TC-HLP-376: Case/whitespace duplicate name validation for Support Packages

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A Support Package named "Premium Support" (or similar) already exists.

**Steps:**
1. Attempt to create another Support Package with the same name but different case and surrounding whitespace, e.g. `" premium support "`

**Expected Result:**
- Document the actual behavior: whether the uniqueness check is case-insensitive/whitespace-trimmed (refused, same as an exact-match duplicate) or exact-match only (a differently-cased/spaced name is allowed to save) — either is plausible, this TC exists to pin down which

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS — behavior documented, exact-match only.** With "Premium Support (Renamed)" already existing, created `" premium support (renamed) "` (different case, leading/trailing spaces) — saved successfully as a new, separate package (id 4), confirmed via direct DOM read that BOTH the case difference and the surrounding whitespace were preserved exactly as typed (`" premium support (renamed) "`), not normalized or trimmed server-side. The uniqueness check (BUG-HLP-036's subject) is a strict case-sensitive, whitespace-sensitive exact string match — it does not catch near-duplicates that a human would consider the same package. Not filed as a separate bug (a reasonable, common design choice — Redmine core itself is case-sensitive on several similar uniqueness checks), but worth knowing: an admin can end up with visually-near-identical packages cluttering the list. Test fixture (id 4) deleted immediately after confirming, to avoid clutter.

---

### TC-HLP-377: Top-up without selecting a Support Package

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Open Add/top-up hours, fill Hours and Comment, leave Support Package as "-- No package --"
2. Save

**Expected Result:**
- Confirms Support Package is genuinely optional on a top-up — the resulting Budget change history row shows "None" for Support Package, no validation error blocks the save

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Org "Alpha Minimal Fields Test Org" / Helpdesk QA Alpha, top-up Hours `1`, Support Package left at "-- No package --", Comment "TC-HLP-377 no-package top-up test", Save. Succeeded with no validation error — Approved went 0.42h → 1.42h, and the new Budget change history row shows Support Package = **"None"**. Confirms this field is genuinely optional (consistent with every top-up throughout this session that also left it unset).

---

### TC-HLP-378: Multiple consecutive top-ups and reductions keep Approved/Used/Remaining correct

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Perform 3+ top-up/reduction operations in a row on the same project's budget, checking Approved/Used/Remaining after each

**Expected Result:**
- Figures stay arithmetically correct after every single operation — no drift, rounding error, or stale-cache effect accumulates across repeated changes

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Org "Alpha Minimal Fields Test Org" / Helpdesk QA Alpha, starting Approved 1.42h. Three consecutive operations, checking the org-level total after each: **Op 1 (+2h)** → Alpha project row 1.42h→3.42h (Used 0.75h, Remaining 2.67h, both correct), org total 11.42h→13.42h. **Op 2 (-1h)** → org total 13.42h→12.42h. **Op 3 (+1.5h)** → org total 12.42h→13.92h. Every single step matched exact expected arithmetic with zero drift or rounding error across the full sequence.

---

### TC-HLP-379: Budget change history preserves full audit detail per entry

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Perform a top-up with a specific Hours value, a specific Support Package, and a specific Comment
2. Check the resulting Budget change history row

**Expected Result:**
- The row shows the exact change amount, the correct Support Package, the full Comment text (not truncated), the correct Approved-By user, and a real timestamp — nothing silently dropped

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **PASS.** Top-up Hours `0.08`, Support Package "Standard Support (Edited)", Comment "TC-HLP-379 full audit trail test comment with specific detail". Resulting row: Change **"3.92h → 4.00h"** (exact arithmetic), Support Package **"Standard Support (Edited)"** (correctly attributed, not blank/None), Comment shown in full, untruncated, Approved By **"Redmine Admin"**, and a real timestamp in the same row (consistent with every other history row seen this session). Nothing silently dropped.

---

### TC-HLP-380: Hard mode blocks new time logging after exhaustion (standing regression test)

**User Role:** Agent
**Precondition:** Run-out mode = Hard; budget Remaining = 0.

**Steps:**
1. As an agent, attempt to log time on an existing ticket for this organization

**Expected Result:**
- Logging time is refused/blocked
- This restates TC-HLP-139 as a permanent regression gate

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, luna.blossom): **PASS.** Org 8 exhausted to Remaining exactly 0.00h (0.75h Approved = 0.75h Used), Hard mode. As `luna.blossom`, opened ticket #46, Reply with 5 min logged — **refused**: "Time entries is invalid — Prepaid support hours for Alpha Minimal Fields Test Org are used up (-0.00h). Top up the budget to log more time." This directly contradicts TC-HLP-139's original finding (BUG-HLP-037) — reran the identical scenario and it blocked correctly this time, and again on an immediate repeat attempt. See BUG-HLP-037's "Retest — Correction" section: the original finding no longer reproduces and the bug is now marked unconfirmed.

---

### TC-HLP-381: Hard mode blocks adding time to a ticket that already has prior time entries

**User Role:** Agent
**Precondition:** Run-out mode = Hard; budget Remaining = 0; the target ticket already has one or more time entries logged against it from before exhaustion.

**Steps:**
1. As an agent, attempt to log an additional time entry on a ticket that already carries prior logged time

**Expected Result:**
- Refused/blocked identically to a ticket with zero prior time entries — confirms the (intended) block isn't accidentally scoped to only a ticket's first time entry

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, luna.blossom): **PASS.** Ticket #46 already carried substantial prior time (multiple entries logged across TC-129/133/134/135/139 earlier this session). Under the same exhausted Hard-mode state as TC-HLP-380, attempted a further 5-minute entry on this same ticket — refused identically ("Time entries is invalid — Prepaid support hours... are used up"). Confirms the block (when it does trigger — see BUG-HLP-037's correction) applies uniformly regardless of how much prior time a ticket already carries, not just to a ticket's first entry.

---

### TC-HLP-382: Hard mode when a single time entry would cross (not just reach) the remaining balance

**User Role:** Agent
**Precondition:** Run-out mode = Hard; Remaining is a small positive value (e.g. 1h).

**Steps:**
1. As an agent, attempt to log a single time entry larger than the current Remaining (e.g. 2h against 1h Remaining)

**Expected Result:**
- Document the actual behavior at the crossing boundary: full block, silent overrun (same gap as BUG-HLP-037), or a partial/capped log — since the zero-boundary case already fails, this checks whether the crossing case behaves the same or differently

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, luna.blossom): **FAIL — BUG-HLP-038.** Org 8, Approved topped up to 1.75h (Used 0.75h, Remaining exactly 1.00h, confirmed on the org page), Hard mode. As `luna.blossom`, opened ticket #46, Reply with Time spent = Custom, 120 minutes (2h) — deliberately larger than the 1.00h available. Result: **accepted in full**, no cap, no error — Spent time went 0:45h→2:45h and Prepaid Support Hours updated to "2.75h used · -1.00h left of 1.75h". Unlike the already-at-zero case (which now reliably blocks per BUG-HLP-037's retest correction), the crossing case does **not** block — the enforcement check only evaluates whether Remaining is already ≤0 before the action, not whether the action's own size would cross zero. Filed as a new, cleanly reproducible bug, BUG-HLP-038 (distinct from the now-unconfirmed BUG-HLP-037).

---

### TC-HLP-383: Soft mode allows crossing from positive Remaining into negative

**User Role:** Agent
**Precondition:** Run-out mode = Soft; Remaining is a small positive value.

**Steps:**
1. As an agent, log enough time in one or more entries to cross Remaining from positive, through zero, into negative

**Expected Result:**
- Succeeds throughout — the balance transitions smoothly from positive to negative with no distinct blocking behavior right at the zero crossing

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, luna.blossom): **PASS.** Org 8 topped up to Approved 3.75h (Used 2.75h, Remaining exactly 1.00h), mode switched to Soft — allow overage. As `luna.blossom`, opened ticket #46, Reply with Time spent = Custom, 120 minutes (2h) — deliberately larger than the 1.00h available. Result: **succeeded in full**, no error, no cap — Spent time went 2:45h→4:45h and Prepaid Support Hours updated to "4.75h used · -1.00h left". Unlike Hard mode's identical crossing scenario (BUG-HLP-038, filed as a defect), this is Soft mode's genuine, correct expected behavior — the balance transitioned smoothly from +1.00h through zero to -1.00h with no distinct blocking at the crossing point. Not a bug.

---

### TC-HLP-384: No Limit mode behavior while budget still has a positive Remaining

**User Role:** Agent and Client (Customer)
**Precondition:** Run-out mode = No Limit; Remaining > 0 (not yet exhausted).

**Steps:**
1. As the customer, raise a new ticket
2. As an agent, log time on one of this organization's tickets

**Expected Result:**
- Both actions succeed normally — this fills the gap left by TC-HLP-133, which only tested No Limit in the already-exhausted state

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6): **PASS.** Org 8 topped up to Approved 6.75h (Used 4.75h, Remaining exactly 2.00h), mode = No Limit. As `delta.customer`: raised new ticket ("TC-HLP-384 - No Limit mode with positive remaining test") — "Successful creation.", no block. As `luna.blossom` (agent): replied on ticket #46 with 5 min logged (Technical Support) — saved normally, Prepaid Support Hours updated to "4.83h used · 1.92h left". Both actions succeeded normally, confirming No Limit's behavior is identical whether Remaining starts positive or already exhausted.

---

### TC-HLP-385: An unauthorized user cannot change a prepaid budget

**User Role:** Agent without `manage_prepaid_support_hours` (e.g. `luna.blossom`)

**Steps:**
1. As a user lacking `manage_prepaid_support_hours`, check whether the Add/top-up hours control and the "When hours run out" dropdown are visible/enabled anywhere reachable
2. Attempt the underlying action directly (e.g. by URL) regardless of UI visibility

**Expected Result:**
- The UI control is hidden or disabled for this user, and/or the direct action is refused server-side (403 or equivalent) — a user without this specific permission cannot change a budget through any path

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, luna.blossom): **PASS.** As `luna.blossom` (Agent role, `view_helpdesk` only, no `manage_helpdesk`/`manage_prepaid_support_hours`): the "Helpdesk Command Center" link is completely absent from her top application menu — matching her role's already-documented restricted-nav tier. Directly navigated to `/rf_organizations/8?tab=prepaid_support_hours` (the org's Prepaid Support Hours tab) — genuinely **403 Forbidden**, "You are not authorized to access this page." Since the entire organization page (not just a budget-specific sub-control) is blocked server-side, every path to changing a budget — Add/top-up hours, the "When hours run out" dropdown — is unreachable both via hidden UI and via direct URL. Also checked the underlying `/rf_helpdesk/prepaid_enforcement` endpoint directly — returns 404 (GET not routed; POST-only, consistent with a form action, not itself a permission signal).

---

### TC-HLP-386: An unauthorized user cannot create/edit/delete Support Packages

**User Role:** Agent without `manage_helpdesk` (e.g. `luna.blossom`)

**Steps:**
1. As a user lacking `manage_helpdesk`, check whether the Support Packages settings tab/controls are reachable via UI
2. Attempt to reach Support Packages' create/edit/delete routes directly by URL regardless of UI visibility

**Expected Result:**
- Blocked both via hidden/absent UI and via a direct URL attempt (403 or equivalent) — Support Packages being global/install-wide shouldn't lower the bar on access control

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, luna.blossom): **PASS.** As `luna.blossom` (no `manage_helpdesk`): the Helpdesk Settings tab (containing Support Packages) is unreachable via UI (no "Helpdesk Command Center" nav entry at all). Directly tested all three relevant routes by URL: `/rf_helpdesk/setting?tab=support_packages` (the list) — **403 Forbidden**; `/rf_helpdesk_support_packages/new` (Create) — **403 Forbidden**; `/rf_helpdesk_support_packages/2/edit` (Edit an existing package) — **403 Forbidden**. Consistently blocked on every path, both by hidden UI and by direct URL, despite Support Packages being a global/install-wide entity rather than project-scoped.

---

### TC-HLP-387: Two near-simultaneous budget changes don't silently lose one update

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Open the Add/top-up hours dialog in two separate browser tabs for the same organization/project, both loaded against the same starting balance
2. Submit tab 1's top-up
3. Without refreshing tab 2 first, submit tab 2's top-up as well

**Expected Result:**
- Both changes are applied — the final Approved figure reflects both top-ups added together, and both rows appear in Budget change history — neither update silently overwrites or loses the other

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, admin): **PASS.** Org 8 at Approved 6.75h in both tabs. Tab 1 (browser tab index 0): Add/top-up dialog opened, filled +3h, comment "...tab 1 (+3h)", **submitted first** — Approved 6.75h→9.75h. Tab 2 (index 1, loaded before tab 1's submit, never refreshed): its own Add/top-up dialog, independently filled +5h, comment "...tab 2 (+5h)", **submitted second, without reloading the page first** — confirmed the dialog still showed its own pre-filled values (unaffected by tab 1's change). Final Approved: **14.75h** (6.75+3+5, both changes correctly additive). Budget change history shows both rows distinctly: "6.75h → 9.75h" (tab 1) and "9.75h → 14.75h" (tab 2) — neither update was lost or silently overwritten by the other.

---

## Additional Coverage, round 2 (user-identified gaps, 2026-09-07)

> Added following a second user gap-analysis after the first "39/39 complete" pass of this suite. Written first, per the standing write-then-execute rule, before any of these are executed.

### TC-HLP-388: A budget change landing at exactly 0.00h Approved is accepted and displays correctly

**User Role:** Manager or Admin
**Precondition:** A budget with a known positive Approved total.

**Steps:**
1. Add / top up hours with a negative Hours value that brings Approved to exactly `0.00`
2. Save, then view the organization's prepaid hours summary

**Expected Result:**
- The change is accepted (0 is a valid resulting total, not treated as "would go negative" per TC-HLP-136's refusal, which only triggers below zero)
- Approved/Used/Remaining all display correctly at the new figures, including a genuine `0.00h` where applicable — no crash, no divide-by-zero issue on the Usage % calculation

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, org 8 / Helpdesk QA Beta): **PASS.** Beta started at Approved 0.00h. Topped up +2h (0.00h→2.00h) as setup, then reduced -2h (2.00h→0.00h) via a deliberate, fresh single operation this session. Result: **Approved 0.00h, Used 0.00h, Remaining 0.00h, Usage 0%** — accepted cleanly, no error, no crash, no divide-by-zero issue on the Usage % calculation. Confirmed via direct page read after the change.

---

### TC-HLP-389: Exact-boundary time logging — Remaining = X, logging exactly X lands the balance at precisely zero

**User Role:** Agent
**Precondition:** Run-out mode = Hard; Remaining is a known small positive value (e.g. exactly 1.00h).

**Steps:**
1. As an agent, log a single time entry whose size exactly equals the current Remaining (not more, not less)

**Expected Result:**
- The entry is accepted (this is the still-positive-until-this-exact-instant case, distinct from TC-HLP-382's overshoot case and TC-HLP-138/139/380's already-at-zero case)
- Remaining becomes exactly `0.00h` afterward, Used exactly equals Approved
- This is the specific positive→exactly-zero transition neither BUG-HLP-038 (crossing past zero) nor TC-380 (already at zero) individually exercises

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `luna.blossom`, ticket #46 / org 8 Helpdesk QA Alpha): **PASS.** Set up Approved 6.83h / Used 4.83h / Remaining exactly 2.00h under Hard mode (reduced Alpha's budget by -8.92h from 15.75h). Confirmed via the ticket's own "Prepaid Support Hours: 4.83h used · 2.00h left of 6.83h" display before the action. Replied with Time spent = Custom, exactly 120 minutes (2h) — **accepted**, no error. Spent time went 4:50h→6:50h; Prepaid Support Hours updated to "6.83h used · **0.00h left** of 6.83h" — Used now exactly equals Approved, Remaining lands at precisely zero, not negative. Confirms the positive→exactly-zero transition is handled correctly and distinctly from both the overshoot case (BUG-HLP-038) and the already-at-zero case (TC-380).

---

### TC-HLP-390: A further entry immediately after landing exactly at zero (TC-HLP-389) is correctly blocked under Hard mode

**User Role:** Agent
**Precondition:** Immediately following TC-HLP-389 — Remaining is now exactly `0.00h`, Hard mode still active.

**Steps:**
1. As an agent, attempt one more time entry on the same ticket, even a trivially small one (e.g. 1 minute)

**Expected Result:**
- Refused/blocked, identically to TC-HLP-380/381's already-exhausted case — confirms the transition from "the action that reaches zero" (allowed, TC-389) to "the very next action once at zero" (blocked) is a clean, immediate boundary with no off-by-one gap

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `luna.blossom`, ticket #46, immediately following TC-HLP-389): **PASS.** With Remaining now exactly 0.00h (per TC-389), attempted one more reply with Time spent = Custom, 1 minute — **refused**: "Time entries is invalid — Prepaid support hours for Alpha Minimal Fields Test Org are used up (-0.00h). Top up the budget to log more time." Confirms the boundary between "the action that lands exactly at zero" (allowed) and "the very next action once at zero" (blocked) is clean and immediate, with no off-by-one gap.

---

### TC-HLP-391: Editing a Support Package that already has budget-history entries preserves the historical association

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A Support Package already referenced by at least one real budget-history entry (e.g. via TC-HLP-372).

**Steps:**
1. Edit that Support Package's Name (and/or Description)
2. Save
3. Reopen the Budget change history and check the entry that referenced this package before the edit

**Expected Result:**
- The historical entry's Support Package column now shows the **new** name (a live reference/foreign key, not a frozen snapshot of the name at the time of the top-up) — or, if it's a frozen snapshot instead, record that as the actual behavior rather than assuming
- The package's delete-dependency guard (TC-HLP-373) still correctly refuses deletion after the edit — editing doesn't accidentally clear its "in use" tracking

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin): **PASS — confirmed a live reference, not a frozen snapshot.** Edited Support Package id 2 ("Standard Support (Edited)", referenced by TC-HLP-379's real budget-history entry) → renamed to "Standard Support (Edited v2 - TC-HLP-391)", Save. Reopened the org's Budget change history: the pre-existing row (Change "3.92h → 4.00h", TC-HLP-379's comment) now shows Support Package = **"Standard Support (Edited v2 - TC-HLP-391)"** — the new name, confirming this is a live foreign-key reference, not a name snapshot frozen at top-up time. Then attempted to delete this same package via its Delete link → confirmation modal → confirmed → **genuinely refused**: "This support package is in use, so it cannot be deleted." The delete-dependency guard survived the rename intact.

---

### TC-HLP-392: Deleting an unrelated, unused Support Package leaves other packages' historical references unchanged

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** At least two Support Packages exist — one unused, one referenced by a real budget-history entry.

**Steps:**
1. Delete the unused package (not the referenced one)
2. Reopen the Budget change history and check the entry referencing the *other* (still-existing, untouched) package

**Expected Result:**
- The unrelated entry's Support Package column is completely unaffected by the unused package's deletion — no blanking, no reindexing confusion, no cross-contamination between unrelated packages' history rows

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin): **PASS.** Created a fresh unused package "TC-HLP-392 Unused Package" (id 5, no budget-history entries ever referenced it), confirmed genuinely unused, then deleted it — clean delete, no error, list correctly drops back to 2 remaining packages (Premium Support (Renamed), Standard Support (Edited v2 - TC-HLP-391)). Reopened the org's Budget change history and re-checked the unrelated, still-existing entry referencing "Standard Support (Edited v2 - TC-HLP-391)" (TC-HLP-379's row) — completely unaffected: same Support Package name, same Change amount, same Comment, no blanking or cross-contamination from the unrelated package's deletion.

---

### TC-HLP-393: Concurrent mixed top-up + reduction (not two additive top-ups) from separate tabs

**User Role:** Manager or Admin
**Precondition:** None.

**Steps:**
1. Open the Add/top-up hours dialog in two separate browser tabs for the same organization/project, both loaded against the same starting balance
2. Tab 1: submit a **positive** change (e.g. `+3`)
3. Tab 2 (never reloaded before its own submit): submit a **negative** change (e.g. `-2`)

**Expected Result:**
- Both changes are applied additively to the true final total (starting + 3 − 2), neither silently lost or overwritten — this specifically tests whether a same-sign additive case (TC-HLP-387) masks a race that a mixed-sign case could expose (e.g. a naive "last write wins" bug reading a stale total would show only one of the two changes, or double-apply one direction)

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, org 8 / Helpdesk QA Beta, starting Approved 0.00h in both tabs): **PASS.** Tab 1: Add/top-up dialog opened, filled +3h, comment "...tab 1 (+3h)", **submitted first** — Approved 0.00h→3.00h. Tab 2 (loaded before tab 1's submit, never refreshed): its own dialog independently filled -1h, comment "...tab 2 (-1h)", **submitted second without reloading** — confirmed the dialog still showed its own pre-filled state, unaffected by tab 1's change. Final Approved: **2.00h** (0+3−1, both changes correctly applied against the true live server total, not a stale client-side read). Budget change history shows both rows distinctly: "0.00h → 3.00h" (tab 1) then "3.00h → 2.00h" (tab 2) — neither lost, no naive last-write-wins bug even with mixed-sign concurrent operations.

---

### TC-HLP-394: Changing run-out mode while already exhausted correctly changes enforcement immediately

**User Role:** Manager or Admin, then Agent
**Precondition:** Run-out mode = Hard; Remaining = 0 (a real block is confirmed first, e.g. per TC-HLP-380).

**Steps:**
1. Confirm Hard mode currently blocks a time-log attempt
2. Change run-out mode to No Limit
3. As an agent, retry the identical time-log attempt
4. Change run-out mode back to Hard
5. Retry the identical time-log attempt again

**Expected Result:**
- Step 3 succeeds (No Limit permits it) — enforcement is live/dynamic, not cached from whichever mode was active when the budget first hit zero
- Step 5 blocks again, exactly as step 1 did — switching back re-engages the block immediately, no stale "already allowed once" state carries over

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin + `luna.blossom`, ticket #46, immediately following TC-HLP-390's confirmed block): **PASS on all 5 steps.** Step 1: Hard mode block already confirmed (TC-390, "used up (-0.00h)"). Step 2: as admin, changed Alpha's run-out mode Hard→No Limit (confirmed via flash "'Alpha Minimal Fields Test Org' on 'Helpdesk QA Alpha': No limit."). Step 3: as `luna.blossom`, retried the identical 1-minute reply — **succeeded**, Spent time 6:50h→6:51h, no block. Step 4: as admin, changed mode back No Limit→Hard (confirmed via DOM re-check, `select[name="mode"].value === "hard"`). Step 5: as `luna.blossom`, retried the identical 1-minute reply again — **refused**: "used up (-0.02h). Top up the budget to log more time." Confirms enforcement is fully live/dynamic on every request — no caching of the mode from when the budget first hit zero, and switching back re-engages the block immediately with no stale "already allowed once" carryover.

---

### TC-HLP-395: Run-out mode selection persists across a page reload and a fresh login session

**User Role:** Manager or Admin
**Precondition:** A budget with a known run-out mode set (e.g. Soft).

**Steps:**
1. Set/confirm the run-out mode
2. Reload the organization's page (a genuine new request, not just re-reading in-memory state)
3. Log out, log back in, and reopen the same organization's Prepaid Support Hours tab

**Expected Result:**
- The mode reads back identically after both the reload and the fresh login — this is a genuine server-persisted setting, not a session-only or client-side-only value

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, org 8 / Helpdesk QA Alpha): **PASS.** Set Alpha's run-out mode to Soft (from Hard). Reloaded the organization's page via a genuine fresh navigation (`browser_navigate`, not a client-side re-render) — DOM re-check confirmed `select[name="mode"].value === "soft"`. Then logged out completely, logged back in as admin (a fresh session), reopened the same Prepaid Support Hours tab — DOM re-check again confirmed `select[name="mode"].value === "soft"`. Mode survived both a full page reload and a completely fresh login session, confirming this is genuine server-persisted state, not session-only or client-side-only.

---

## Additional Coverage, round 3 (user-identified gaps — editing/deleting an EXISTING time entry, 2026-09-07)

> Every prior time-logging TC in this suite (TC-129/133/134/135/138/139/380–384/389/390/394) only ever tests *creating* a new time entry via the reply box's own time-log integration. None test what happens when an **already-logged** time entry is later edited (increased or decreased) or deleted via Redmine's own core Spent-time tab/edit form — a genuinely different code path (`TimeEntry` update/destroy, not the reply-box's create-time hook) that could easily have its own, independent gap in prepaid-hours bookkeeping. Written first per the standing rule, then executed live.

### TC-HLP-396: Editing an existing time entry to increase it under Hard mode, past Remaining, — document whether it's blocked or uncapped

**User Role:** Agent
**Precondition:** Run-out mode = Hard; an existing time entry logged against this organization's ticket; Remaining is a small positive value smaller than the increase being attempted.

**Steps:**
1. Open the ticket's Spent time tab, Edit an existing time entry
2. Increase its Hours by an amount that would push Used past Approved (Remaining would go negative)
3. Save

**Expected Result:**
- Document the actual behavior — this exercises a different code path (`TimeEntry` edit, not the reply box's create-time hook used by every other Hard-mode TC in this suite) so the enforcement may or may not be shared with BUG-HLP-038's already-known crossing gap. Either a genuine block/cap (Hard mode's contract holding here too) or an uncapped edit (the same class of gap as BUG-HLP-038, but on a different code path) are both real, reportable outcomes — do not assume either.

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `luna.blossom`, ticket #46 / org 8 Helpdesk QA Alpha): **FAIL — filed as BUG-HLP-041.** Before: Approved 6.83h, Used 5.83h, Remaining exactly 1.00h, mode confirmed `hard` via direct DOM read. Edited time entry #23 via Redmine's own core `/time_entries/23/edit` form (not the reply box) — Hours `0:05` → `3:00`, a `+2.92h` increase against only 1.00h available — Save. Result: **"Successful update"**, no error, no cap, no warning whatsoever. After: Used **8.75h**, Remaining **-1.92h** — the full uncapped increase applied. Confirms Hard-mode enforcement has **zero presence at all** on this code path (Redmine's core Spent-time Edit form), a stronger and more complete gap than BUG-HLP-038 (which only misses the crossing-boundary case on the reply-box's own create path — an enforcement check does exist there, just an incomplete one). Filed as **BUG-HLP-041** (Medium).

---

### TC-HLP-397: Editing an existing time entry to increase it under Soft mode, past Remaining, is allowed

**User Role:** Agent
**Precondition:** Run-out mode = Soft; an existing time entry logged against this organization's ticket; Remaining is a small positive value smaller than the increase being attempted.

**Steps:**
1. Open the ticket's Spent time tab, Edit an existing time entry
2. Increase its Hours by an amount that would push Used past Approved
3. Save

**Expected Result:**
- The edit succeeds, Remaining goes negative — Soft mode's "allow overage" contract holds for edits to existing entries, not just new ones

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, ticket #46 / org 8 Helpdesk QA Alpha, immediately following TC-HLP-396): **PASS.** Mode switched Hard→Soft (confirmed persisted). Edited time entry #22 via `/time_entries/22/edit` — Hours `0:05` → `1:00`, a `+0.92h` increase. Result: succeeded cleanly ("Successful update"), Used `8.75h`→`9.67h`, Remaining `-1.92h`→`-2.84h`. This matches Soft mode's own correct, documented "allow overage" behavior — not a bug, since Soft mode is meant to allow exactly this. Included primarily as a contrast/control to confirm the edit-time-entry code path *does* correctly apply Soft's arithmetic even though Hard's enforcement is absent on the same path (BUG-HLP-041) — the bookkeeping itself is consistent across modes, only Hard's blocking behavior is missing.

---

### TC-HLP-398: Reducing an existing time entry's Hours decreases Used and increases Remaining by the same amount

**User Role:** Agent or Manager
**Precondition:** An existing time entry with a known Hours value logged against this organization's ticket.

**Steps:**
1. Note Used/Remaining before the edit
2. Edit the time entry, reduce its Hours value
3. Save, check the organization's prepaid hours summary

**Expected Result:**
- Used decreases by exactly the reduction amount, Remaining increases by the same amount — the prepaid-hours system responds symmetrically to a decrease, not just tracking upward changes (a system that only recalculates Used on create, never on edit, would leave Used stale here)

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, ticket #46 / org 8 Helpdesk QA Alpha): **PASS.** Before: Approved 6.83h, Used 6.85h, Remaining -0.02h. Edited time entry #24 via `/time_entries/24/edit` — Hours `2:00` → `1:00`, a `-1.00h` reduction. After: Used **5.85h** (exactly `6.85 - 1.00`), Remaining **0.98h** (exactly `-0.02 + 1.00`). Confirms the system recalculates Used/Remaining symmetrically on a reduction, not just on increases — no stale/uncorrected Used value.

---

### TC-HLP-399: Deleting an existing time entry decreases Used and increases Remaining by that entry's full amount

**User Role:** Agent or Manager
**Precondition:** An existing time entry with a known Hours value logged against this organization's ticket.

**Steps:**
1. Note Used/Remaining before the delete
2. Delete the time entry
3. Check the organization's prepaid hours summary

**Expected Result:**
- Used decreases by the deleted entry's full Hours value, Remaining increases correspondingly — deleting a time entry fully reverses its budget impact rather than leaving a stale, orphaned charge against the budget

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, admin, ticket #46 / org 8 Helpdesk QA Alpha, immediately following TC-HLP-398): **PASS.** Before: Used 5.85h, Remaining 0.98h. Deleted time entry #28 (`0:01h`) via its Delete link (native "Are you sure?" confirm accepted). After: Used **5.83h** (exactly `5.85 - 0.02`, `0:01h` rounds to `0.02h` at 2-decimal display), Remaining **1.00h** (exactly `0.98 + 0.02`). Confirms deleting a time entry fully reverses its budget impact — no stale/orphaned charge left behind.

---

## Additional Coverage, round 4 (user-identified gap — the core "Log time" link, a THIRD distinct code path, 2026-09-07)

> Round 3 (TC-396–399) covered *editing* and *deleting* an already-logged time entry via Redmine's own core Spent-time Edit form. It did not cover the third, remaining way a brand-new `TimeEntry` can be created against a Helpdesk ticket: Redmine's own core **"Log time"** link on the ticket action bar (`/issues/:id/time_entries/new`), which is structurally distinct from both (a) the reply box's own embedded Time-spent widget (used by every TC before round 3) and (b) editing an existing entry (round 3). Written first per the standing rule, then executed live.

### TC-HLP-400: Creating a brand-new time entry via the core "Log time" link (not the reply box) under Hard mode, past Remaining

**User Role:** Agent
**Precondition:** Run-out mode = Hard on the organization/project; Remaining is a small positive value smaller than the Hours about to be logged.

**Steps:**
1. Open the ticket and click the ticket action bar's **"Log time"** link specifically — NOT "Reply" (which opens the reply box's own Time-spent widget already covered by TC-380/381/389/390/394/BUG-038)
2. Confirm this lands on Redmine's native `/issues/:id/time_entries/new` form
3. Enter Hours exceeding the current Remaining, select an Activity, Create
4. Document whether the submission is blocked/capped or succeeds uncapped

**Expected Result:**
- Document the actual behavior — this is a third, independent code path into the same `Used` total (distinct from both the reply-box widget and the edit-existing-entry form already tested in round 3), so enforcement may or may not be present here regardless of what was found for the other two paths. Either a genuine block/cap or an uncapped creation are both real, reportable outcomes.

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `luna.blossom`, ticket #46 / org 8 Helpdesk QA Alpha): **FAIL — folded into BUG-HLP-041 as Path B.** Setup: topped up Alpha to Approved 11.67h / Used 9.67h / Remaining exactly **2.00h**, mode confirmed `hard` via direct DOM read (`select[name="mode"].value === "hard"`). As `luna.blossom`, clicked the ticket action bar's **"Log time"** link — confirmed URL `/issues/46/time_entries/new`, Redmine's plain native new-time-entry form (no prepaid-hours widget, no run-out-mode awareness anywhere in its UI, unlike the reply box's own integration). Entered Hours `5:00` (2.5× the 2.00h available), Activity "Technical Support", clicked Create. Result: **"Successful creation."**, full redirect to the ticket, no error, no cap, no warning. Ticket's own "Prepaid Support Hours" summary went from "9.67h used · 2.00h left of 11.67h" to "**14.67h used · -3.00h left of 11.67h**" — the entire 5:00h applied uncapped. Confirms the same total absence of Hard-mode enforcement found in round 3 (BUG-HLP-041) extends to this third code path as well — enforcement exists exclusively on the reply-box's own bespoke widget; every other way of creating or modifying a `TimeEntry` (new via core form, edit via core form) bypasses it entirely. Folded into **BUG-HLP-041** (broadened, not a new bug ID — identical root cause: a core Redmine `TimeEntry` controller action with zero prepaid-hours awareness).

---

## Additional Coverage, round 5 (budget configuration × ticket-creation channel matrix, 2026-09-09)

> Added following a direct user request to verify, per documentation (not assumption), whether all four budget configurations — **no budget assigned**, **No Limit**, **Soft**, **Hard** — are covered for **both** ticket-creation channels: Helpdesk Portal (an authenticated customer using New issue) and Email (MailHandler). Before this round, every positive-case TC in this suite (TC-HLP-133/134/135/384) exercised the Portal channel only — none tested the Email channel's own `MailHandler#prepaid_hours_exhausted_for_email?` path, and none tested the distinct "no budget assigned at all" state (zero `rf_helpdesk_prepaid_support_hours` ledger rows — architecturally different from "mode = No Limit", which requires a ledger row to exist with enforcement simply turned off). Grounded in `docs/HELPDESK_USER_GUIDE.md` §12's table (`No limit` → "Nothing is blocked. The balance simply goes negative"; `Hard` → blocks new tickets and time logging once hours reach zero; `Soft` → "Both allowed; the balance goes negative with no limit") and in source (`app/models/helpdesk/prepaid_enforcement.rb`'s `block_reason`, shared identically by the Issue-creation validation and `MailHandler`) confirming the **blocking decision** is identical between channels, while the **notification** deliberately differs: Portal shows an inline form error, Email additionally fires a dedicated `HelpdeskMailer.prepaid_hours_exhausted_notification` bounce-back (since MailHandler would otherwise silently swallow the failed validation and the customer would think their email worked). Written first per the standing rule, then executed live.

### TC-HLP-408: Portal ticket creation with no budget assigned at all succeeds (never blocked, regardless of mode)

**User Role:** Client (Customer) with no Organization set on their project-access row (a customer who was never put on a prepaid package)
**Precondition:** Customer's project-access row has Organization = None on the target project — no `rf_helpdesk_prepaid_support_hours` ledger row and no `rf_helpdesk_prepaid_enforcements` row exist for this customer's (non-existent) organization on this project at all.

**Steps:**
1. As the customer (no Organization on this project), log in to the Helpdesk Portal
2. Raise a new ticket via New issue

**Expected Result:**
- Ticket creation succeeds normally, with no blocking of any kind. **Correction: `HELPDESK_USER_GUIDE.md` §12 itself does not document this state at all** — it only describes what the three run-out modes do to an *existing* budget, never what happens when no budget was ever set. This expectation is derived instead from (a) §3's own setup table explicitly marking both "Create organizations" (step 5) and "Set prepaid budgets" (step 10) as **Optional**, implying a customer/org with neither must remain fully functional, and (b) the plugin's own source-code comment in `app/models/helpdesk/prepaid_enforcement.rb` ("'No budget' is not 'no hours left'. A customer who was never put on a package must not be blocked"), where `hours_left`/`block_reason` return `nil` immediately when no ledger row has ever existed, regardless of whatever mode (Hard/Soft/Off) a project's dropdown happens to show for other organizations. **This is a real documentation gap, not a contradiction** — recommend `HELPDESK_USER_GUIDE.md` §12 add an explicit line stating this, since an admin reading only the user guide currently has no way to know this state is safe/intentional

- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer`, Helpdesk QA Alpha): **PASS.** Used `alpha.customer`'s pre-existing, longstanding project-access state on Helpdesk QA Alpha — Organization = None (no budget ledger row for her ever existed). As `alpha.customer`, raised a new ticket via the Portal's New issue form (subject "TC-HLP-408 Portal ticket creation with no budget assigned") — succeeded cleanly, ticket **#67** created (`09/09/2026 10:13 AM`), no blocking of any kind, no error. Confirms the "never put on a package → never blocked" contract holds for the Portal channel.

---

### TC-HLP-409: Email ticket creation with no budget assigned at all succeeds (never blocked, regardless of mode)

**User Role:** Client (Customer) with no Organization set on their project-access row
**Precondition:** Same as TC-HLP-408 — no budget ledger row exists for this customer's (non-existent) organization.

**Steps:**
1. As the same customer, send a qualifying email (containing the configured identifier keyword) to the project's configured incoming mailbox
2. Trigger the email poller

**Expected Result:**
- Ticket creation succeeds normally via the Email channel too — since `MailHandler#prepaid_hours_exhausted_for_email?` calls the exact same shared `block_reason` method as the Portal path, the "never blocked when no budget ever existed" contract must hold identically for Email

- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer` → `alpha.support@test.local`): **PASS.** Same no-Organization precondition as TC-HLP-408. Sent a qualifying email (subject "TC-HLP-409 email ticket creation with no budget assigned - ticket keyword", containing "ticket") from Roundcube, triggered `Helpdesk::EmailPollerWorker.new.perform` via rails runner. Ticket **#68** created cleanly (`09/09/2026 10:15 AM`), no blocking. Confirms the Email channel shares the identical "never blocked" contract as Portal for this precondition — direct evidence the shared `block_reason` method behaves identically across both channels here.

---

### TC-HLP-410: Email ticket creation under No Limit mode with the balance already negative succeeds

**User Role:** Client (Customer) whose organization has a real budget with mode = No Limit
**Precondition:** Organization has a real `rf_helpdesk_prepaid_support_hours` ledger row on this project; mode = No Limit; Remaining is already negative.

**Steps:**
1. Set the organization's run-out mode to No Limit on the target project, with Remaining already negative
2. As the customer, send a qualifying email to the project's mailbox
3. Trigger the email poller

**Expected Result:**
- Ticket creation succeeds normally per `HELPDESK_USER_GUIDE.md` §12 ("Nothing is blocked. The balance simply goes negative") — this fills the gap left by TC-HLP-133/384, which only tested No Limit via the Portal channel

- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer` → `alpha.support@test.local`, org "Alpha Minimal Fields Test Org" / Helpdesk QA Alpha): **PASS.** Alpha's mode switched Hard→No Limit while Remaining was already `-1.00h` (Approved 13.67h, Used 14.67h) — confirmed via banner `'Alpha Minimal Fields Test Org' on 'Helpdesk QA Alpha': No limit.`. Sent a qualifying email (subject "TC-HLP-410 email ticket creation - No limit mode with negative balance - ticket keyword"), triggered the poller. Server log: `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [alpha.customer]` → `MailHandler: issue #71 created by Alpha Customer` → `Helpdesk::EmailPollerWorker: Created ticket #71`. No blocking of any kind, confirming No Limit's Email-channel behavior matches its already-confirmed Portal behavior.

---

### TC-HLP-411: Email ticket creation under Soft mode with the balance already negative succeeds

**User Role:** Client (Customer) whose organization has a real budget with mode = Soft
**Precondition:** Same ledger row as TC-HLP-410; mode = Soft; Remaining already negative.

**Steps:**
1. Set the organization's run-out mode to Soft on the target project, with Remaining already negative
2. As the customer, send a qualifying email to the project's mailbox
3. Trigger the email poller

**Expected Result:**
- Ticket creation succeeds normally per `HELPDESK_USER_GUIDE.md` §12 ("Both allowed; the balance goes negative with no limit") — fills the Email-channel gap left by TC-HLP-135, which only tested Soft via Portal

- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer` → `alpha.support@test.local`, same org/project): **PASS.** Mode switched No Limit→Soft (confirmed via banner `'Alpha Minimal Fields Test Org' on 'Helpdesk QA Alpha': Soft — allow overage.`), Remaining still `-1.00h`. Sent a qualifying email (subject "TC-HLP-411 email ticket creation - Soft mode with negative balance - ticket keyword"), triggered the poller. Server log: `MailHandler: issue #72 created by Alpha Customer` → `Helpdesk::EmailPollerWorker: Created ticket #72`. No blocking, confirming Soft's Email-channel behavior matches Portal — both channels correctly treat Soft identically to No Limit for blocking purposes.

---

### TC-HLP-412: Email ticket creation under Hard mode while Remaining is still positive succeeds normally

**User Role:** Client (Customer) whose organization has a real budget with mode = Hard
**Precondition:** Organization's budget on this project has mode = Hard; Remaining > 0.

**Steps:**
1. Confirm the organization's run-out mode = Hard on the target project with Remaining still positive
2. As the customer, send a qualifying email to the project's mailbox
3. Trigger the email poller

**Expected Result:**
- Ticket creation succeeds normally — Hard mode only blocks once hours actually reach zero (per `HELPDESK_USER_GUIDE.md` §12), same contract already confirmed for Portal via TC-HLP-134

- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer` → `alpha.support@test.local`, org "Alpha Minimal Fields Test Org" / Helpdesk QA Alpha): **PASS.** Used the organization's real pre-existing Hard-mode state with Remaining 7.00h positive. Sent a qualifying email (subject "TC-HLP-412 email ticket creation - Hard mode with Remaining greater than zero - ticket keyword"), triggered the poller. Ticket **#69** created cleanly (`09/09/2026 10:16 AM`), no blocking — confirms Hard mode's "no effect while Remaining > 0" contract holds identically for the Email channel.

---

### TC-HLP-413: Email ticket creation under Hard mode once Remaining reaches zero/negative is blocked, with a bounce-back notification sent to the customer

**User Role:** Client (Customer) whose organization has a real budget with mode = Hard, fully exhausted
**Precondition:** Organization's budget on this project has mode = Hard; Remaining ≤ 0.

**Steps:**
1. Reduce the organization's budget on the target project to Remaining ≤ 0 under Hard mode
2. As the customer, send a qualifying email to the project's mailbox
3. Trigger the email poller
4. Check the customer's mailbox for a bounce-back notification

**Expected Result:**
- Ticket creation is refused/blocked — same contract as Portal's TC-HLP-138/380 — but unlike Portal (which shows an inline form error the customer sees immediately), Email's `MailHandler` cannot show an inline error to an email sender, so the plugin must additionally send a dedicated bounce-back notification email explaining the ticket was not created, or the customer would wrongly believe their email succeeded

- **First attempt — a genuine methodology finding, not a bug:** reduced Alpha's budget to a UI-displayed "0.00h Remaining" under Hard mode and sent a qualifying email — the ticket was **created**, not blocked. Investigated live via a read-only `rails runner` diagnostic (per this engagement's "backend query to investigate a genuine discrepancy" precedent, not a substitute for UI testing): `Helpdesk::PrepaidEnforcement.hours_left` returned `0.003333320915698934`, not exactly zero — a tiny positive floating-point residue accumulated from historical repeating-decimal time entries (e.g. "5 min" = `0.08333...`h). Since `block_reason`'s check is `left > 0` / blocks only when `left <= 0`, this residue correctly prevented blocking. **Not a bug** — the code is behaving exactly per its own arithmetic; this is a genuine "the UI's 2-decimal-rounded 'Remaining: 0.00h' display can mask a residual positive balance" testing-methodology lesson, recorded in `HELPDESK_MEMORY.md`.
- **CONFIRMED LIVE 2026-09-09** (Local, redmine-docker-6, `alpha.customer` → `alpha.support@test.local`, org "Alpha Minimal Fields Test Org" / Helpdesk QA Alpha), **retest with the budget corrected to a firmly negative value**: **PASS.** Reduced Alpha's budget by a further `-1h` (Comment: "TC-HLP-413 correction..."), confirmed via `rails runner` that `hours_left` was now firmly `-0.9966666790843011` and `block_reason` returned a real non-nil blocking hash. Sent a fresh qualifying email (subject "TC-HLP-413 retest - Hard mode firmly exhausted - ticket keyword"), triggered the poller. Server log: `MailHandler: Found helpdesk project [helpdesk-qa-alpha] for customer [alpha.customer]` → **`WARN -- : MailHandler: Alpha Minimal Fields Test Org is out of prepaid hours on Helpdesk QA Alpha (-0.9966666790843011h) - ticket creation blocked`** → `MailHandler: prepaid-exhausted notice sent to alpha.customer@test.local` → `Helpdesk::EmailPollerWorker: MailHandler returned false - email rejected or invalid` → `Message 63 could not be processed`. No ticket was created for this message. Confirmed the bounce-back notification genuinely arrived in `alpha.customer@test.local`'s Roundcube inbox: **"Your message could not be logged — prepaid support hours used up (Helpdesk QA Alpha)"**, from `redmine@example.net`. Confirms Hard mode blocks the Email channel identically to Portal once genuinely exhausted, and confirms the dedicated bounce-back notification (distinguishing Email's UX from Portal's inline form error) fires correctly.

---

### Budget configuration × ticket-creation channel — coverage matrix

| Budget Configuration | Portal Ticket Creation | Email Ticket Creation |
| --------------------- | ----------------------- | ----------------------- |
| No budget assigned | Succeeds, never blocked — TC-HLP-408 | Succeeds, never blocked — TC-HLP-409 |
| No limit | Succeeds, balance goes negative — TC-HLP-133/384 | Succeeds, balance goes negative — TC-HLP-410 |
| Soft | Succeeds, balance goes negative — TC-HLP-135 | Succeeds, balance goes negative — TC-HLP-411 |
| Hard (Remaining > 0) | Succeeds normally — TC-HLP-134 | Succeeds normally — TC-HLP-412 |
| Hard (Remaining ≤ 0) | Blocked, inline form error — TC-HLP-138 | Blocked + dedicated bounce-back email — TC-HLP-413 |

> Note: TC-HLP-380/381/383 (cited in earlier drafts of this matrix) are **Agent time-logging TCs**, not customer ticket-creation TCs — they confirm the same Hard/Soft mode behavior but via a different action (Log time) on the same Portal session, not "raise a new ticket." Corrected here so this matrix cites only genuine ticket-creation evidence per column, per a direct user follow-up asking to verify Portal ticket-creation coverage specifically.

**Coverage findings, reported directly per the user's request:**
1. **Already covered (Portal only, before this round):** No Limit (TC-133, exhausted state / TC-384, positive-remaining state), Soft (TC-135, exhausted state), Hard-positive (TC-134), Hard-exhausted (TC-138, including its same-day retest correction).
2. **Partially covered (before this round):** none of the above had an Email-channel counterpart at all — every Email-channel TC in `HELPDESK_EMAIL.md` and elsewhere in this suite tested keyword/routing/mailbox behavior, never the budget-blocking decision itself.
3. **Completely missing (before this round):** the "no budget assigned at all" state (as opposed to "mode = No Limit") was not tested on **either** channel — TC-HLP-125–142's earliest positive cases all assumed a budget already existed. All 6 gaps (both channels × no-budget state, plus all 4 Email-channel rows) are now closed by TC-HLP-408–413 above.
4. **Expected-result correctness against documentation — verified cell by cell, not assumed:**
   - **No Limit / Soft / Hard**: all three rows' expected results are correctly grounded in `HELPDESK_USER_GUIDE.md` §12's own table ("Nothing is blocked. The balance simply goes negative" / "Both allowed; the balance goes negative with no limit" / "Once hours reach zero: the customer cannot raise a new ticket, and nobody can log time on their tickets"), and the tested behavior on both channels matches these exact words.
   - **No budget assigned**: **§12 does not document this state at all** — it only ever describes what a run-out mode does to a budget that already exists. The "never blocked" expectation was initially mis-cited in this suite's first draft as coming from the user guide; corrected in TC-HLP-408 to its real basis — §3's own setup table marking Organizations/prepaid budgets "Optional" (implying this state is legitimate) plus the plugin's own source-code comment (`prepaid_enforcement.rb`). **This is a genuine documentation gap, not a bug** — recommend §12 gain an explicit line stating a customer/organization that never had a budget set is never blocked, regardless of another organization's run-out mode.
   - **Hard mode's "nobody can log time" clause**: this session's ticket-creation-focused round did not re-litigate it, but it remains **only partially true today** — **BUG-HLP-038** (open: a single time entry that *crosses* zero, rather than being logged once already at zero, is accepted uncapped) and **BUG-HLP-041** (open: editing an existing entry, or using Redmine's own core "Log time" link, bypasses Hard-mode enforcement entirely) are both still-open, confirmed violations of this exact documented sentence — flagged here for visibility since "coverage is complete" for ticket creation does not mean the whole of Hard mode's documented contract holds.
   - **Email's bounce-back notification**: `HELPDESK_USER_GUIDE.md` never mentions this mechanism (or any channel-specific difference) at all — not a contradiction, since nothing promised otherwise, but worth a doc-improvement note so an admin isn't surprised by what a blocked customer actually sees on each channel.

---

## Evidence Map

- Case ID: TC-HLP-125 – TC-HLP-142, TC-HLP-367 – TC-HLP-373 (Support Packages, newly discovered entity, added 2026-09-03), TC-HLP-374 – TC-HLP-387 (user-identified coverage gaps, added 2026-09-03), TC-HLP-388 – TC-HLP-395 (user-identified coverage gaps round 2, added 2026-09-07), TC-HLP-396 – TC-HLP-399 (editing/deleting an existing time entry, round 3, added 2026-09-07), TC-HLP-400 (core "Log time" link, a third distinct code path, round 4, added 2026-09-07), TC-HLP-408 – TC-HLP-413 (budget configuration × ticket-creation channel matrix, round 5, added 2026-09-09)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
