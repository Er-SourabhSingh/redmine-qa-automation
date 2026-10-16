# Leave — Cross-Plugin Flow (Platform / Workload / Shift Management)

> Same purpose as `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md`, this time for the Leave entity: tests Leave Types,
> Leave requests (`rf_leaves`), and Leave Policy Bands as experienced from each plugin that touches them —
> Platform (owner), Workload, and Shift Management — per the product owner's 2026-10-13 audit request.
> Helpdesk and Timesheet were checked and confirmed to have **zero** Leave-related screens — out of scope for
> this suite.
>
> Reviewed first, per the audit's own instruction: `BUG-PLT-011`, `013`, `014`, `016`, `036` (all closed) —
> these establish that `rf_leaves` is a genuinely shared model across Shift Management/Workload/Platform, and
> that Shift Management's own Policy Band gate (`BUG-PLT-036`) was fixed correctly but deliberately scoped to
> exclude Workload.

## Functional Cases — Leave Types (mostly consolidated)

### TC-PLT-264 — Shift Management's "Leave Types" tab defers New/Edit to Platform

1. Open Shift Management → Leave → "Leave Types" tab (`/shift_management/leave?tab=types`).
2. Click "New Leave Type" and, separately, "Edit" on an existing row.

**Expected:** Same standard as Team — a consumer plugin's list may render its own copy, but create/edit
actions should defer to Platform's own canonical screen.

**Actual:** Confirmed — both "New Leave Type" and "Edit" links point to
`/redmineflux_platform/list/leave_types/.../new` and `/edit` (with `back_url` set). Same partial-mitigation
pattern already found for Team (`BUG-PLT-040`): duplicate list, correctly-deferred writes. **Status: PASS**
(positive finding, not filed).

### TC-PLT-265 — Helpdesk and Timesheet have no Leave screens at all

1. Open Helpdesk (`/helpdesk`) and inspect its full nav: Dashboard, Tickets, Reports, Organization, Customers,
   Products, Settings.
2. Open Timesheet (`/timesheets/weekly`) and inspect its full nav.

**Expected/Actual:** Confirmed — neither plugin has any Leave-related screen, link, or mention anywhere in
their nav. **Status: PASS** (scope confirmation — these two plugins are excluded from the rest of this suite).

## Functional Cases — Leave requests (`rf_leaves`): shared data, duplicate UI

### TC-PLT-266 — A leave created via Workload is visible, with the correct ID, on Platform's own Leaves list

1. As a team member, submit a leave request via Workload's own "+ Request Leave" (`/rf_leaves/new`).
2. Open Platform's own Leaves list (`/redmineflux_platform/list/leaves`) and find the same record.

**Expected/Actual:** Confirmed — the record created via Workload (id 2, "Emergency Leave", Aurora Wren)
appeared correctly on Platform's own list with matching details. **Status: PASS** — `rf_leaves` is genuinely a
shared model at the data layer, which is exactly why the duplicate-UI findings below matter (the data is
right, but three different UIs can each enforce different rules against it).

### TC-PLT-267 — Three independent Apply Leave screens exist, none deferring to another

1. Open Platform's own Leaves screen (`/redmineflux_platform/list/leaves`) → "New Leave Request".
2. Open Workload's own Leave Management (`/rf_leaves`) → "+ Request Leave".
3. Open Shift Management's own Leave screen (`/shift_management/leave`) → "Apply Leave".

**Expected:** Per the consolidation direction (and unlike Team, where Timesheet's/Workload's own "Teams" nav
links already correctly defer to Platform — see `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md` TC-PLT-238/239), a
consumer plugin's "Apply Leave" entry point should link to Platform's own screen rather than open its own
independent form.

**Actual:** Confirmed — all three are complete, independently-implemented forms with no deferral between any
of them. **Status: FAIL — filed `BUG-PLT-045`.**

**Retest 2026-10-15 — PASS.** Both `/shift_management/leave` and `/rf_leaves` now redirect entirely to Platform's own `/redmineflux_platform/list/leaves`. `BUG-PLT-045` confirmed fixed, closed.

### TC-PLT-268 — Three independent approval surfaces exist for the same shared records

1. Open Platform's own Leaves list and note its Status filter (Approved/Rejected/Cancelled).
2. Open Workload's own "Team Approvals" tab (within `/rf_leaves`).
3. Open Shift Management's own "Applications" tab (within `/shift_management/leave`, with Status/Employee/Leave
   Type filters).

**Expected:** Same as TC-PLT-267 — one canonical approval surface, not three independently-implemented
queues over the same data.

**Actual:** Confirmed — each of the three renders its own full approval queue (Workload's shows its own
Pending/Approved counts; Shift Management's has its own filter set). **Status: FAIL — filed `BUG-PLT-045`**
(same bug as TC-PLT-267 — apply and approve are two halves of the one duplication finding).

**Retest 2026-10-15 — PASS.** Same fix as TC-PLT-267 — both consumer plugins now redirect to Platform's one canonical screen. `BUG-PLT-045` confirmed fixed, closed.

## Functional Cases — Leave Policy Bands (zero Platform ownership)

### TC-PLT-269 — Policy Bands and Assign Leave Band have no Platform screen at all

1. Open Platform's own nav (`/redmineflux_platform`) and check every entry for anything Policy-Band-related.
2. Open Shift Management → Leave → "Policy Bands" tab (`/shift_management/leave?tab=bands`) and → "Assign
   Leave Band" tab (`?tab=assign`) — check whether "New Policy Band" / "Edit" / "Assign Band to Users" link
   out to Platform or stay fully in-plugin.

**Expected:** Per the standard already applied to Team/Organizations/Holiday Schemes (and even Leave Types'
partial deferral), Policy Band — which governs a cross-plugin rule (which leave types a user may use) —
should be at least consumable from, if not owned by, Platform.

**Actual:** Confirmed — no "Policy Bands" entry anywhere in Platform's nav, and Shift Management's own "New
Policy Band"/Edit/Delete/"Assign Band to Users" are all genuine in-page modals with zero link to any Platform
URL. Worse than Department's gap (`BUG-PLT-041`), where Platform at least consumed the data via a dropdown —
here Platform has no awareness of Policy Bands existing at all. **Status: FAIL — filed `BUG-PLT-044`.**

**Retest 2026-10-15 — PASS.** Platform now has a unified Leave section with "Leave policy bands" and "Assign leave band" tabs, both genuine Platform URLs. `BUG-PLT-044` confirmed fixed, closed.

### TC-PLT-270 — Shift Management's own Apply Leave correctly enforces the Policy Band gate (contrast case)

**Preconditions:** A Policy Band exists; the test user holds no assignment to it.

1. Log in as the unassigned user and open Shift Management's own Apply Leave (`/shift_management/leave`).
2. Open the Leave Type dropdown.

**Expected/Actual:** Confirmed — per `BUG-PLT-036`'s already-verified fix, the dropdown shows 0 selectable
types and a banner reads "No leave band assigned yet. Please contact your HR/Admin." **Status: PASS** —
included here as the contrast case against TC-PLT-271, to make the inconsistency concrete rather than assumed.

### TC-PLT-271 — Workload's Apply Leave does NOT enforce the same Policy Band gate

**Preconditions:** Same unassigned user and Policy Band state as TC-PLT-270.

1. Log in as the same unassigned user (`aurora.wren`, confirmed "Unassigned" on Shift Management's own Assign
   Leave Band screen) and open Workload's own "+ Request Leave" (`/rf_leaves/new`).
2. Select "Emergency Leave" (not covered by any band this user could hold), fill dates and reason, submit.

**Expected:** Per the architecture already enforced in Shift Management (TC-PLT-270), this submission should
be refused the same way.

**Actual:** Confirmed — the submission succeeds, status "Pending", with no Policy Band check anywhere. This is
exactly the gap `BUG-PLT-036`'s own closure notes flagged as deliberately out of scope ("Workload has no
band-awareness whatsoever — by design"), confirmed still the live, current state. **Status: FAIL — filed
`BUG-PLT-043`** (not a reopen of `BUG-PLT-036`, whose own scope is genuinely fixed). Fixture leave cancelled
after verification.

**Retest 2026-10-15 — PASS.** Submission as the same unassigned user (Aurora Wren) is now server-side REJECTED with an explicit no-policy-band error. `BUG-PLT-043` confirmed fixed, closed.

## Regression Cases — Consolidated form (post-`BUG-PLT-045`)

### TC-PLT-319 — Consolidated "New Leave Request" form re-checked for the Policy Band gate after consolidation

**Preconditions:** `BUG-PLT-045` closed — Shift Management's and Workload's own Apply Leave screens now both
redirect to Platform's single `/redmineflux_platform/list/leaves/new`. Environment currently has **zero** Leave
band assignments at all (confirmed via `/redmineflux_platform/list/user_band_assignments` showing "0").

1. Log in as `aurora.wren` (zero Policy Band assignment, confirmed).
2. Open the single consolidated `/redmineflux_platform/list/leaves/new`.
3. Open the "Leave Type *" dropdown (helper text: "Only the types their band allows are listed.").
4. Select "Emergency Leave", fill Start/End Date and Reason, click Create.

**Expected:** Per the same rule already confirmed fixed on both predecessor screens (TC-PLT-270's Shift
Management contrast case and TC-PLT-271's now-closed Workload fix), a zero-band user should see no selectable
Leave Types, or be blocked from submitting.

**Actual:** Regression confirmed — the dropdown lists every Active Leave Type unfiltered, and submission
succeeds outright (Leave #9 created, Status Pending, Leave Type "Emergency Leave", no error). The Policy Band
gate that both `BUG-PLT-036` (Shift Management) and `BUG-PLT-043` (Workload) fixed independently, each inside
its own now-retired form, was not carried over into the single form `BUG-PLT-045`'s consolidation introduced in
its place. **Status: FAIL — filed `BUG-PLT-053`.**

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-264 | PASS | — | — |
| TC-PLT-265 | PASS | — | — |
| TC-PLT-266 | PASS | — | — |
| TC-PLT-267 | PASS (Retest 2026-10-15) | BUG-PLT-045 (Closed) | `screenshots/BUG-PLT-045/platform-own-leaves-screen.png`, `screenshots/BUG-PLT-045/workload-own-leave-management-screen.png`, `screenshots/BUG-PLT-045/shift-management-own-applications-screen.png` |
| TC-PLT-268 | PASS (Retest 2026-10-15) | BUG-PLT-045 (Closed) | (same as TC-PLT-267) |
| TC-PLT-269 | PASS (Retest 2026-10-15) | BUG-PLT-044 (Closed) | `screenshots/BUG-PLT-044/shift-management-policy-bands-no-platform-equivalent.png`, `screenshots/BUG-PLT-044/platform-nav-no-policy-band-entry.png` |
| TC-PLT-270 | PASS | — | — |
| TC-PLT-271 | PASS (Retest 2026-10-15) | BUG-PLT-043 (Closed) | `screenshots/BUG-PLT-043/workload-apply-leave-bypasses-policy-band.png` |
| TC-PLT-319 | FAIL (2026-10-16) | BUG-PLT-053 (Open) | `screenshots/BUG-PLT-053/BUG-PLT-053-zero-band-assignments.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-leave-type-dropdown-unrestricted.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-form-filled-before-submit.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-leave-created-no-band-gate.png` |

## Summary (2026-10-13)

Of 8 cases: 5 PASS, 3 FAIL. The PASSes confirm `rf_leaves` and Leave Types are genuinely shared at the data
layer, and that Shift Management's own Policy Band gate (`BUG-PLT-036`) still works correctly in isolation.
The FAILs show the same architectural pattern already found for Team: a shared entity whose **data** is
consolidated but whose **UI, approval workflow, and governance rules** are independently re-implemented per
consumer plugin, with no enforcement guarantee that a rule added to one (Shift Management's Policy Band gate)
reaches the others (Workload's Apply Leave, confirmed live to bypass it entirely).

## Summary addendum (2026-10-16 — regression found on the consolidated form)

Re-tested at the user's request, now that `BUG-PLT-045`'s consolidation (closed 2026-10-15) has replaced all
three independent Apply Leave forms with the single `/redmineflux_platform/list/leaves/new`. TC-PLT-319 found
that this single remaining form has **lost** the Policy Band gate entirely — a regression against both
`BUG-PLT-036` (Shift Management, closed) and `BUG-PLT-043` (Workload, closed), neither of which had this
coverage carried forward into the consolidated path. Filed as `BUG-PLT-053`. This is a cautionary example for
future consolidation work in this plugin: merging duplicate UI/forms (the right fix for `BUG-PLT-045`'s own
finding) must also re-verify that every per-form business rule the old forms enforced independently was ported
into the single replacement — consolidation closed the duplication gap but silently reopened the enforcement
gap it had separately fixed.
