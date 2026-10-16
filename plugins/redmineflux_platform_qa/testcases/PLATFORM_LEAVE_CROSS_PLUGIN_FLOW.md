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

## Full Module Coverage — Apply / Cancel / Approve / Leave Type CRUD / Policy Band CRUD / Band Assignment (2026-10-16)

> At the user's explicit request ("leave wal me 4 section he usme leave apply, cancel own leave, approve leave,
> leave type crud, policy band crud and assignee policy band, please check proper scenarios then check flow
> after assigning policy band to user — test leave is visible and calculation is proper in workload, shift
> management"), every area of the Leave module was exercised live, plus the one case no prior session had ever
> tried: a user who **does** have a Policy Band assigned (direct inverse of TC-PLT-319/`BUG-PLT-053`'s zero-band
> case).

### TC-PLT-320 — Leave Policy Band: Create

1. As admin, open `/redmineflux_platform/list/leave_policy_bands` → "New Leave policy band".
2. Create `QA-Band-EmergencyOnly`: set a day-value only for "Emergency Leave", leave "Comp-Off" blank, Active checked.

**Expected/Actual:** Confirmed — created cleanly, detail page shows "Leave types and days: Emergency Leave: 5
days" only, Comp-Off correctly excluded from the list entirely (not shown as "0 days" — simply absent, matching
the form's own stated rule "Leave a box empty and the band does not allow that type at all"). **Status: PASS.**

### TC-PLT-321 — Leave Policy Band: Edit

1. Edit `QA-Band-EmergencyOnly`, add a day-value for "Comp-Off" too, Save.
2. Re-edit, clear the "Comp-Off" value back to empty, Save.

**Expected/Actual:** Confirmed both directions — adding a value correctly adds "Comp-Off: 2 days" to the
detail page's list; clearing it back to empty correctly removes it from the list again (not left as "0 days").
**Status: PASS.**

### TC-PLT-322 — Leave Policy Band: Assign to a user (Create)

1. Open `/redmineflux_platform/list/user_band_assignments/new`. Assign `QA-Band-EmergencyOnly` to `aurora.wren`,
   Year 2026.

**Expected/Actual:** Confirmed — assignment created cleanly (id 3, later recreated as id 4 after the Delete test
below), shows on the Leave band assignments list with User/Band/Year columns and working View/Edit/Delete
actions. **Status: PASS.**

### TC-PLT-323 — Leave Policy Band assignment: Edit (reassign year)

1. Edit the assignment created above, change Year 2026 → 2027, Save. Re-edit, change back 2027 → 2026, Save.

**Expected/Actual:** Confirmed both directions — Year updates correctly each time, title/breadcrumb and detail
page reflect the new year immediately. **Status: PASS.**

### TC-PLT-324 — Leave Policy Band assignment: Delete (unassign)

1. Delete the assignment (confirm dialog: "This record will be removed permanently. If another module still
   depends on it, nothing is deleted and you are told why.").

**Expected/Actual:** Confirmed — deleted cleanly with no dependency guard triggered (a Band assignment has no
FK from `Leave`, which references `leave_type_id` directly, not the band), removed from the list. Recreated
immediately afterward (as assignment id 4) to restore the fixture for future regression retesting of
TC-PLT-325 below. **Status: PASS.**

### TC-PLT-325 — Leave apply, WITH a Policy Band assigned: disallowed type rejected, allowed type succeeds

**Preconditions:** `aurora.wren` now assigned to `QA-Band-EmergencyOnly` (allows only "Emergency Leave", not
"Comp-Off") for 2026.

1. Log in as `aurora.wren`, open `/redmineflux_platform/list/leaves/new`.
2. Observe the Leave Type dropdown still lists BOTH "Comp-Off" and "Emergency Leave" unfiltered on initial load
   (same cosmetic gap already present for the zero-band case in TC-PLT-319).
3. Select "Comp-Off" (not allowed by this band), fill dates/reason, click Create.
4. Observe the result, then correct the Leave Type to "Emergency Leave" (the only option the form now offers
   after the error) and resubmit.

**Expected:** Per the form's own stated rule and the already-fixed predecessor screens, a disallowed type should
be rejected for a banded user; an allowed type should succeed.

**Actual:** Confirmed, and this **refines** `BUG-PLT-053`'s original finding — the gate DOES work correctly at
the server-side validation layer for a banded user:
- Submitting "Comp-Off" is rejected with an explicit inline error: *"Leave Type is not one your leave policy
  band (QA-Band-EmergencyOnly) allows"*, and the re-rendered form correctly narrows the dropdown to just
  "Emergency Leave".
- Submitting "Emergency Leave" succeeds (Leave #10 created, Status Pending, later Approved in TC-PLT-326).
- The dropdown's lack of pre-filtering on initial load (step 2) is confirmed real for a banded user too, not
  just the zero-band case, but is cosmetic here since the server-side check still catches a wrong choice at
  submit time.

**Status: PASS for the actual enforcement** (disallowed rejected, allowed accepted) — but this result required
`BUG-PLT-053`'s write-up to be corrected, since its original title ("zero Leave Policy Band enforcement")
overstated the defect to cover the banded case too, when only the zero-band case and the dropdown's cosmetic
pre-filtering are actually broken. See `BUG-PLT-053.md`'s own "Correction (2026-10-16)" section.

### TC-PLT-326 — Approved Leave: visible and capacity-correct in Workload

**Preconditions:** Leave #10 (`aurora.wren`, Emergency Leave, 10/22/2026) approved by admin from
`/redmineflux_platform/list/leaves/10` (confirm dialog: "The dates are reserved and the employee's available
capacity is reduced accordingly.").

1. Open Workload #3 ("TC-258 Aurora Workload", Team-Retest, Oct 15–30 2026, a window that covers both Leave #9
   Pending Oct 20 and Leave #10 Approved Oct 22) at `/rf_teams/19/rf_workloads/3`.
2. Inspect the Workload Gantt Chart and Aurora's Team Capacity card.

**Expected:** The Approved leave (Oct 22) should show as "on leave" on the Gantt and should be excluded from
Aurora's available working days/capacity. The still-Pending leave (Oct 20) should NOT yet affect capacity —
only approval is supposed to do that, per the Leave detail page's own tooltip ("Approving it is what takes
those days out of their capacity").

**Actual:** Mixed. The Approved leave (Oct 22) correctly shows "L" on the Gantt — that half of this TC
**PASSes**. But the still-**Pending** leave (Oct 20) ALSO shows "L" on the Gantt, identically, with no visual
distinction, and direct service-level verification (`rails runner`, calling
`RfWorkloadGanttDataService#fetch_user_leaves`/`#count_working_days`) confirms this is not just a display
quirk — the Pending leave is already excluded from Aurora's available working days for this workload (10
working days counted with Pending included vs. 11 if only the Approved leave is counted — a full day's
capacity, 8h, deducted before any approval decision). **Status: FAIL (for the Pending-leave half) — filed
`BUG-WKL-003`** against `redmineflux_workload` (the defect is in that plugin's own
`rf_workload_gantt_data_service.rb`, not Platform's Leave model).

### TC-PLT-327 — Same Leave data, cross-checked on Shift Management's own calendar

1. With the same two leave records (Pending Oct 20, Approved Oct 22) in place, open Shift Management's own
   `/shift_management/calendar` for October 2026 and find Aurora Wren's row.

**Expected/Actual:** Confirmed correct — the calendar shows "Emerg..." (On Leave, Emergency Leave) only on Oct
22 (the Approved date); Oct 20 (the Pending date) shows no marker at all, identical to any ordinary working day.
This is the **correct** behavior per the leave-approval tooltip, and it directly proves `BUG-WKL-003` is a real,
fixable defect specific to Workload's own Gantt service — the identical underlying data is handled correctly
elsewhere in the very same codebase. Shift Management's own dashboard "Pending Approvals" widget also correctly
surfaced the Oct 20 Pending request with working Approve/Reject buttons, confirming the cross-plugin approval
surface consolidation (`BUG-PLT-045`) still holds for this entry point too. **Status: PASS.**

## Permission Checks — Leave approve/view authorization (2026-10-16)

> At the user's explicit request ("leave wala permission ke sath check kr lo" — check Leave together with
> permissions), checked the Leave module's authorization model directly, beyond the view-vs-decide split already
> confirmed in TC-PLT-207. Found that Shift Management's own, separately-listed "Approve / Reject Leave"
> permission on the Permissions report is not a leftover `BUG-PLT-047`-style dead duplicate — it is a live,
> deliberately-honoured alternate authorization path.

### TC-PLT-328 — Shift Management's legacy global `approve_leave` permission is honoured by Platform's own Leave authorization, by design

**Preconditions:** Created role `PLT-LeaveApprovalLegacyOnly` with **only** the Shift Management "Approve /
Reject Leave" permission checked (no Platform "File and decide leave requests", no team membership of any
kind), assigned it to `willow.belle` on `PLT-DelCheck-Project` (a project unrelated to Aurora Wren's own team).

1. Log in as `willow.belle`, open Aurora Wren's still-Pending Leave #9 (`/redmineflux_platform/list/leaves/9`).
2. Observe whether Approve/Reject controls appear, and whether clicking Approve actually succeeds server-side
   (not just a visible-but-blocked button).

**Expected:** Unclear going in — could go either way: a genuine `BUG-PLT-047`-style dead leftover permission
(no effect), or a real but undocumented access-control gap (should require Platform's own permission or a team
relationship, per TC-PLT-207's documented 2-layer model).

**Actual:** Approve succeeded — "Decided By: Willow Belle" recorded on Aurora's leave, Status → Approved — despite
zero Platform Leave permission and zero team relationship to Aurora. **Confirmed via source this is intentional,
not a bug**: `RedminefluxPlatform::Leave#can_be_approved_by?`/`#visible?` and `TeamService.approves_leave_globally?`
explicitly call `user.allowed_to?(:approve_leave, nil, global: true)` — Shift Management's own legacy permission
symbol — as a deliberate second, equally-valid path alongside the team-approver mechanism. The model's own code
comment states the rationale directly: *"A user can hold the global permission with no approver membership, or
the reverse, and each grants access somebody relies on today — so both are honoured. Dropping either here would
silently revoke live access."* This exact design is also the subject of a dedicated ADR,
`doc/adr/0002-union-not-narrowest-permission.md` ("union not narrowest permission"). **Status: PASS (confirmed
working as designed) — not a bug, no defect filed.**

**One documentation/UX observation worth a future look, not filed as a defect**: the check is a true Redmine
*global* permission (`global: true` in both the registration and the `allowed_to?` call) — holding "Approve /
Reject Leave" via a role on **any single project** grants approval authority over **every** employee's leave
company-wide, not scoped to that project or the approver's own team. The Permissions report's own checkbox for
this permission carries no hint of that company-wide scope, unlike Platform's Leave Policy Band form which does
spell out its own scope in helper text. An administrator skimming the Permissions report could reasonably assume
a Shift-Management-grouped permission only affects shift-related data for the project it's granted on.

### TC-PLT-329 — The other two legacy Shift Management Leave permissions, checked for the same pattern

1. Check source for `:view_leave` ("View Leave Applications") and `:manage_leave_balances` ("Manage Leave
   Balances") — the two other Leave-adjacent permissions still listed separately under Shift Management on the
   Permissions report, alongside `:approve_leave`.

**Actual:**
- `:manage_leave_balances` genuinely, correctly gates a still-active, Shift-Management-owned `LeaveBalances`
  controller (index/show/new/create/edit/update/destroy/bulk_assign/bulk_create) — the same "Leave Balance"
  feature visible (currently empty) on Shift Management's own Dashboard widget. **Not dead, not a duplicate** —
  this is a feature Platform has never claimed ownership of.
- `:view_leave` gates Shift Management's own `LeaveController#index`/`#show`/`#my_leaves` — but all three actions
  are now pure one-line redirects to Platform's own Leave screens (confirmed in source,
  `app/controllers/leave_controller.rb`), a leftover of `BUG-PLT-045`'s consolidation. Since Platform's own Leave
  screen is itself `open_to_all` (any logged-in user, confirmed in `BUG-PLT-052`'s investigation), gating this
  redirect has no real security effect either way — a user denied `:view_leave` simply can't reach Platform's
  screen *through this one old URL*, but can reach the identical data by navigating to
  `/redmineflux_platform/list/leaves` directly. **Low-impact redundant gate, not worth filing** — unlike
  `BUG-PLT-047`'s five retired permissions, this one still technically does something (blocks one specific old
  URL), it just doesn't block the data itself.

**Status: PASS (both confirmed intentional/harmless, not duplicates needing retirement) — no defect filed.**

### TC-PLT-330 — Does Platform's OWN "File and decide leave requests" permission (`manage_rf_platform_leaves`) actually gate anything?

**Preconditions:** `marigold.rayne`, confirmed zero `rf_platform` permissions (same account as `BUG-PLT-052`).
Confirmed via `rails runner`: `marigold.rayne.allowed_to?(:manage_rf_platform_leaves, nil, global: true)` → `false`.

1. Log in as `marigold.rayne`, navigate directly to `/redmineflux_platform/list/leaves/new`.
2. Fill out and submit the form.

**Expected:** Per the Permissions report's own presentation of "File and decide leave requests" as a normal,
independently-togglable permission, a user without it should not be able to reach or submit this form.

**Actual:** Regression/gap confirmed — the form opens with no 403, and submission succeeds outright (Leave #12
created, "Marigold Rayne 10/26/2026", Emergency Leave, Pending). Root cause confirmed in source: `Entry#manage?`
(`lib/redmineflux_platform/shared_entities.rb`) returns `true` unconditionally once `@open_to_all == true` —
which `leaves` is — **before it ever consults `manage_permission` at all**. Confirmed via direct service call:
`entry.manage?(marigold_rayne)` → `true` despite her confirmed-false permission. This is the exact same defect
shape as `BUG-PLT-052` (there, `visible_to?` bypassed by `open_to_all: :view`; here, `manage?` bypassed by
`open_to_all: true`), just for a different entity/permission pair. **Status: FAIL — filed `BUG-PLT-054`.**

Scope note carried into the bug file: this is distinct from `can_be_approved_by?` (TC-PLT-328's subject, acting
on *someone else's* leave) — this is specifically about the gate for filing *your own* leave at all, which this
plugin's own source comment says is intentionally open to everyone ("Every employee files their own leave"). If
that is genuinely the intended end state, the Permissions report checkbox should not exist implying otherwise —
the same user-facing contradiction already flagged for Holiday Schemes/Holidays in `BUG-PLT-052`.

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
| TC-PLT-319 | FAIL (2026-10-16) | BUG-PLT-053 (Open, scope corrected) | `screenshots/BUG-PLT-053/BUG-PLT-053-zero-band-assignments.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-leave-type-dropdown-unrestricted.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-form-filled-before-submit.png`, `screenshots/BUG-PLT-053/BUG-PLT-053-leave-created-no-band-gate.png` |
| TC-PLT-320 | PASS (2026-10-16) | — | — |
| TC-PLT-321 | PASS (2026-10-16) | — | — |
| TC-PLT-322 | PASS (2026-10-16) | — | — |
| TC-PLT-323 | PASS (2026-10-16) | — | — |
| TC-PLT-324 | PASS (2026-10-16) | — | — |
| TC-PLT-325 | PASS (2026-10-16) | — (refines BUG-PLT-053's scope) | `screenshots/BUG-PLT-053/TC-PLT-323-banded-user-disallowed-type-rejected.png`, `screenshots/BUG-PLT-053/TC-PLT-323-banded-user-allowed-type-succeeds.png` |
| TC-PLT-326 | FAIL (Pending-leave half only, 2026-10-16) | BUG-WKL-003 (Open) | `screenshots/BUG-PLT-053/TC-PLT-324-workload-gantt-leave-marker.png` |
| TC-PLT-327 | PASS (2026-10-16) | — (contrast evidence for BUG-WKL-003) | `screenshots/BUG-PLT-053/TC-PLT-325-shift-calendar-leave-visibility.png` |
| TC-PLT-328 | PASS (confirmed working as designed, 2026-10-16) | — | — |
| TC-PLT-329 | PASS (confirmed intentional/harmless, 2026-10-16) | — | — |
| TC-PLT-330 | FAIL (2026-10-16) | BUG-PLT-054 (Open) | `screenshots/BUG-PLT-052/BUG-PLT-052-leave-manage-permission-bypassed.png` |

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

## Summary addendum 2 (2026-10-16, same day — full module pass: Apply/Cancel/Approve/Leave Type CRUD/Policy Band CRUD/Band Assignment, plus Workload/Shift Management cross-check)

At the user's explicit request, every area of the Leave module was exercised live in one pass (TC-PLT-320–327),
including the one scenario no prior session had tried: a user who **does** have a Policy Band assigned. Net
result: **7 of 8 new cases PASS**, 1 partial FAIL, with one important correction to an existing bug and one
genuinely new bug found:

- **Policy Band CRUD (Create/Edit) and Band Assignment CRUD (Create/Edit-reassign/Delete-unassign) all PASS
  cleanly** (TC-PLT-320–324) — no defects in any of these, including the Delete action's dependency-guard
  message (correctly not triggered here, since a Band assignment has no FK relationship *from* `Leave`).
- **`BUG-PLT-053` corrected, not retracted** (TC-PLT-325): testing the assigned-band case for the first time
  revealed the Policy Band gate genuinely works at the server-side validation layer — a disallowed type is
  rejected with a clear error, an allowed type succeeds. The bug's title overstated "zero enforcement"; the
  real, still-valid defect is narrower — only a **zero-band** user bypasses validation entirely, and the
  dropdown's lack of pre-filtering (present for both zero-band and banded users) is a separate, more cosmetic
  gap since the server-side check still catches a banded user's wrong choice.
- **New bug found in `redmineflux_workload`, not Platform** (TC-PLT-326, contrasted against TC-PLT-327): the
  per-workload Gantt/capacity service (`rf_workload_gantt_data_service.rb`) treats a still-**Pending**
  (unapproved) leave identically to an **Approved** one, reducing a member's available capacity and blocking
  scheduling before any approval decision — confirmed with hard service-level evidence (10 vs. 11 working days)
  and directly contrasted against Shift Management's own calendar, which correctly shows "On Leave" for the
  Approved date only. Filed as `BUG-WKL-003`.
- **Lesson reinforced**: as with `BUG-PLT-053`'s own correction, don't generalize a finding from testing only
  one edge of a condition (zero-band only; approved-leave-only) — the opposite edge (banded; pending) can behave
  completely differently, and testing it either narrows an overstated bug or surfaces a real one that the first
  pass never would have found.

## Summary addendum 3 (2026-10-16, same day — Leave authorization/permission checks, TC-PLT-328/329)

At the user's explicit follow-up request to check Leave specifically together with its permission model, tested
whether Shift Management's own, separately-listed "Approve / Reject Leave" permission (visible on the
Permissions report under Shift Management, distinct from Platform's own "File and decide leave requests") is
another `BUG-PLT-047`-style dead leftover, or something still live. It is live, and deliberately so: a brand-new
test role holding **only** that one legacy permission — no Platform Leave permission, no team relationship to the
leave's owner — successfully approved another employee's Pending leave. Source confirms this is intentional,
backed by a dedicated architecture decision record (`doc/adr/0002-union-not-narrowest-permission.md`) and explicit
code comments explaining the rationale (dropping either path "would silently revoke live access" for whoever
already relies on it). **Not filed as a bug.** The two sibling legacy permissions ("View Leave Applications",
"Manage Leave Balances") were checked the same way and are also confirmed not duplicates needing retirement —
one gates a still-genuinely-Shift-Management-owned Leave Balances feature, the other gates a now-pure-redirect
action with no real security effect either way (Leave is `open_to_all` regardless).

**Lesson**: not every two permissions that look alike, or that sit in two different plugins' sections of the
Permissions report, are the `BUG-PLT-047` duplication pattern — sometimes a second-looking permission is a
deliberately-preserved alternate authorization path with its own ADR, and the way to tell the difference is
the same way every time: read the model/service source directly rather than assuming from the UI grouping.

## Summary addendum 4 (2026-10-16, same day — the user's own follow-up catches a real gap: `manage_rf_platform_leaves` is dead too)

Immediately after Summary addendum 3 concluded "the Leave permission model is fine, nothing more to find here,"
the user asked directly whether Platform's **own** leave permissions had actually been verified working — not
just the Shift Management legacy ones. They had not: the investigation above (TC-PLT-328/329) only tested the
*approve/decide* authorization path (`can_be_approved_by?`), never the *file your own leave* gate
(`manage_rf_platform_leaves`, "File and decide leave requests") that the user's question specifically asked
about. Checking it (TC-PLT-330) found it is exactly as inert as `BUG-PLT-052`'s Holiday Schemes/Holidays
finding — `Entry#manage?` returns `true` unconditionally for any logged-in user once `open_to_all == true`,
before the permission itself is ever consulted. Confirmed with a genuinely zero-permission user successfully
creating a real leave record. Filed as `BUG-PLT-054`.

**Lesson, worth remembering specifically**: concluding "the permission model is fine" after checking one
authorization path (here, *deciding* a leave) does not mean every OTHER permission touching the same entity is
also fine — Leave has at least two independent gates (`manage?` for filing, `can_be_approved_by?` for deciding),
and this session tested only one of them until asked directly about the other. When a user asks "did you check
X is working," the honest answer requires having actually exercised X's specific code path, not a related one
that merely sits near it on the same screen.
