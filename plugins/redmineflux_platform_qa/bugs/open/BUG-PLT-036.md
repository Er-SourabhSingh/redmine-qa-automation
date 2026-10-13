# Bug Report Template

- Bug ID: BUG-PLT-036
- Production Redmine Issue ID: #122728
- Title: A user with no Leave Policy Band assigned can apply for any of the 6 leave types, instead of being blocked
- Redmine version: 6 (Rails 7.2.3.1) at filing; re-verified by dev on Redmine 7 (`redmine-700-redmine-1`, `localhost:8091`)
- Plugin name: redmineflux_shift_management (gate) / redmineflux_workload (confirmed out of scope by design, see below)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Browser: Chromium (Playwright)
- User role: Test User (non-admin, no Leave Policy Band assignment)
- Date: 2026-10-07

## Preconditions

- Shift Management's Leave Policy Bands feature is live; admin's own "Assign Leave Band" screen shows **1 Assigned / 21 Unassigned / 22 Total Users** for the current year.

## Steps to reproduce

1. As Admin, open Shift Management's Leave → Assign Leave Band tab (`/shift_management/leave?tab=assign`). Confirm the environment's actual state: 1 Assigned / 21 Unassigned / 22 Total Users — the screen itself flags "Unassigned" in red as a problem state.
2. Log in as any one of the 21 unassigned users (e.g. `luna.blossom`, id 5 — confirmed via DB to have no `RfUserBandAssignment` row for the current year).
3. Go to Shift Management's own Leave → Apply Leave screen (`/shift_management/leave`).
4. Open the Leave Type dropdown.

## Expected result

- A user with no Policy Band assigned should not be able to pick ANY leave type (should be blocked from applying / see no selectable types) — the Policy Band is what is supposed to govern which leave types an employee may use at all.
- A user who DOES have a Policy Band assigned should only ever be able to apply for the leave type(s) that band actually contains — confirmed this half already works correctly: the one assigned user (id 15, band "fresher") sees only 1 leave type, "Comp-Off".

## Actual result

- The unassigned user's Leave Type dropdown shows **all 6 active leave types** — i.e. *less* restriction than the one properly-governed user, not more.
- Confirmed this isn't just a UI display issue — the submission itself succeeds. Live-tested as `luna.blossom` (no band): applied for "Emergency Leave" via Shift Management (id 288) and separately for "Sick Leave" via Workload's own Request Leave (id 289). Both cancelled afterward and confirmed `status: cancelled` in DB; no leftover fixtures.
- `LeaveEngine#deduct_on_submit` silently no-ops when there's no `RfLeaveBalance` row for the user, so an unassigned user's leave is also never deducted against any balance — accepted with zero balance governance.
- Workload (`/rf_leaves`) has no band-awareness whatsoever by design (documented scope — Workload has no accrual equivalent), so it always shows all 6 types to everyone; the defect here is specifically Shift Management's fallback, since that's the one plugin where the Policy Band feature exists and is supposed to be the gate.

### Root cause (confirmed from source)

`app/controllers/leave_controller.rb#leave_types_for_user`: when no `RfUserBandAssignment` exists for the user, the `else` branch falls back to *every* active leave type rather than an empty list / a blocked state — a fallback that defeats the Policy Band feature's entire purpose for 21 of the 22 users on this environment, which per the admin's own "Unassigned" count is the overwhelming majority of the user base right now, not an edge case.

## Evidence

### Screenshot

N/A — reproduced and confirmed via live UI apply + DB verification (leave ids 288/289, confirmed cancelled afterward); no screenshot captured this session.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-036/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — both submissions returned success ("Leave application submitted successfully" / "Leave request submitted successfully"), which is itself the defect: an ungoverned leave was accepted, not rejected.

## Duplicate check

- Duplicate found: No.
- Existing bug reference (if duplicate): —

## Fix Verification — pending QA retest

Dev fixed on `redmineflux_shift_management` branch, commit `d943ef5` ("Move leave accounting onto the record; fix BUG-PLT-036"), 2026-10-12:

1. **Dropdown**: `leave_types_for_user`'s `else` branch now returns `[[], nil]` once at least one `RfLeavePolicyBand` exists in the installation — `return [[], nil] if leave_bands_in_use?`.
2. **Server-side gate** (the half that actually mattered, since the original report showed the raw POST succeeding regardless of the dropdown): `leave_type_permitted?`/`refuse_leave_type` now enforce the same rule on create and update, including the REST API path (`shift_management_api/v1/leave_controller.rb`).
3. **Gate is conditional, on purpose**: it only activates once at least one Policy Band exists, so a fresh install with zero bands is not locked out of applying for leave on day one. `leave_bands_in_use?` rescues to `false` so a plugin mid-migration cannot take the apply screen down.
4. **Balance accounting also fixed** in the same commit, beyond the dropdown/gate: leave accounting now runs off the record's own `after_*_commit` transitions instead of from the two controllers, since `rf_leaves` is shared across Shift Management, Workload and the platform's own screen.
5. **Deliberately left outside this fix**: Workload's Request Leave (`rf_leaves_controller`) still has no band awareness — matches the report's own stated scope ("Workload has no band-awareness whatsoever — by design"), but the dev flagged that if the Policy Band is meant to be the gate *everywhere*, that belongs on the shared model, not just Shift Management's screens.

Dev's own re-verification (2026-10-12, against Redmine 7 — a different environment from this report's Redmine 6) used probe data exercised directly against the controller's methods, not a full UI click-through as `luna.blossom`:

| Scenario | Leave types offered | Server-side permit |
|---|---|---|
| No policy band exists in the installation | 5 (all active) | allowed |
| Band exists, user *is* assigned | 1 — only the band's own type | allowed |
| Band exists, user is *not* assigned | 0 | refused |

Moved to **In QA** rather than closed by the dev specifically because the original scenario was driven through the UI as `luna.blossom`, and that re-run is explicitly left for QA to do.

**Status on production (as of 2026-10-13): In QA, 90% done. QA retest against the original UI repro (log in as `luna.blossom`, confirm the dropdown and a raw POST are both blocked) has not yet been performed.**

## Production report

Reported to production `ztflux` as **#122728** on 2026-10-07 by Sourabh Singh. Priority: High; Defect custom fields: Type=Functional, Severity=High-severity, Priority=High. Assigned to Prashant Chaurasia.
