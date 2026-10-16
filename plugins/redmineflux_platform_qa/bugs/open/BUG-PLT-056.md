# Bug Report Template

- Bug ID: BUG-PLT-056
- Production Redmine Issue ID: <!-- filled after MCP report_defect/create_issue is approved and executed -->
- Title: "New Leave Request" form's Leave Type dropdown never pre-filters to the viewer's own Leave Policy Band — always lists every Active type, for both zero-band and banded users alike
- Redmine version: 6
- Plugin name: redmineflux_platform
- Plugin version: current (2026-10-16, after commit `d8a224d`)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Non-admin test user (`briar.sunset`), zero Leave Policy Band assignment, full `view`/`manage` leave permission
- Date: 2026-10-16

## Steps to reproduce

1. Confirm the environment has a real Leave Policy Band (`QA-Band-EmergencyOnly`, allows only "Emergency Leave")
   and that at least one Active Leave Type it does **not** allow exists (`Comp-Off`), plus a third type
   (`PLT-FilterTest-LeaveType-Unpaid`) it also doesn't allow.
2. Log in as a user with **zero** band assignment (`briar.sunset`, confirmed via
   `UserBandAssignment.pluck(:user_id).uniq` not containing her id) but full leave `view`/`manage` permission
   (role `QA Full Access`, so the permission layer alone doesn't explain what's observed).
3. Navigate to `/redmineflux_platform/list/leaves/new` ("New Leave Request").
4. Observe the "Leave Type *" dropdown on initial page load. Its own helper text reads "The kind of time off.
   Only the types their band allows are listed."
5. Submit the form with any Leave Type selected and observe the server correctly refuses it (per the now-fixed
   `BUG-PLT-053`) with "No leave band is assigned to Briar Sunset..." — but note the dropdown itself was never
   restricted before that refusal.
6. Separately, confirm the same unfiltered-dropdown behavior for a **banded** user choosing a type their band
   does *not* allow (`aurora.wren`, band `QA-Band-EmergencyOnly`) — the dropdown still lists `Comp-Off` even
   though her band only allows `Emergency Leave`; the server-side rejection on submit is what actually enforces
   it, confirmed already in `BUG-PLT-053`'s own Correction section (2026-10-16).

## Expected result

- Per the dropdown's own stated rule ("Only the types their band allows are listed"), the dropdown should already
  be narrowed to the viewer's own permitted types on page load — a zero-band user should see no selectable types
  (or a clear "no band assigned" state in place of the dropdown), and a banded user should see only the types
  their band allows, not the full Active list.

## Actual result

- The dropdown is never filtered on the server-rendered initial page for either a zero-band or a banded viewer —
  it always lists every Active Leave Type unconditionally. The restriction only becomes visible after a failed
  submit attempt, via the validation error message. This is purely a front-end/initial-render gap: the
  server-side enforcement itself (confirmed in `BUG-PLT-053`'s fix and Correction section) is correct, so no
  incorrect leave can actually be created this way — but the form's own copy promises a behavior the page does
  not deliver, costing every affected user an extra, confusing round-trip (fill the whole form, submit, get
  rejected, re-fill) instead of simply never offering the disallowed choice.
- Root cause (inferred, not yet confirmed from the view/controller source): the Leave Type `<select>` options in
  the New Leave Request form are populated from the full `LeaveType.active` list rather than being scoped through
  `UserBandAssignment.band_for(current_user.id, ...)`/`band.permitted_leave_types` the way the model-layer
  validation (`leave_type_is_one_the_band_permits`) already does.

## Evidence

### Screenshot

![Zero-band user's Leave Type dropdown lists every Active type unfiltered, including a type created purely as an unrelated filter-testing fixture](../../screenshots/BUG-PLT-056/BUG-PLT-056-leave-type-dropdown-not-prefiltered.png)

*(Screenshot carried over from `BUG-PLT-053`'s own evidence folder — the exact same unfiltered-dropdown behavior
was independently re-confirmed live during `BUG-PLT-053`'s 2026-10-16 retest, after its core enforcement gap was
fixed, so a fresh capture would show the identical state.)*

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-056/retest-yyyy-mm-dd-pass.png)

### Console / log

- N/A — confirmed via live UI inspection of the rendered `<select>` options on initial page load, cross-referenced
  against `UserBandAssignment.band_for`/`band.permitted_leave_types` (the exact scoping the model-layer validation
  already applies server-side).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Split out from `BUG-PLT-053`'s own 2026-10-16 Correction section, which
  explicitly documented this as a *separate*, lower-severity defect from the core zero-band enforcement gap.
  `BUG-PLT-053`'s core finding is now fixed and closed; this is the one remaining piece, filed on its own rather
  than re-opening a bug whose actual title defect no longer exists.

## Production report

Not yet reported to production — pending user approval per this repo's write-approval policy.
