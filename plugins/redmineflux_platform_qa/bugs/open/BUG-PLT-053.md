# Bug Report Template

- Bug ID: BUG-PLT-053
- Production Redmine Issue ID:
- Title: Consolidated "New Leave Request" form has zero Leave Policy Band enforcement — a user with no band assigned can submit any existing Leave Type, a regression on the single form that replaced BUG-PLT-036/BUG-PLT-043's fixes
- Redmine version: 6
- Plugin name: redmineflux_platform
- Plugin version: current (2026-10-16)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Non-admin test user (`aurora.wren`), zero Leave Policy Band assignment
- Date: 2026-10-16

## Steps to reproduce

1. Confirm the environment currently has **zero** `Leave band assignments` at all (`/redmineflux_platform/list/user_band_assignments` shows "0" / "No Leave band assignments yet") — so no user, including `aurora.wren`, is assigned to any Policy Band.
2. Log in as `aurora.wren` (a regular, non-admin user).
3. Navigate to `/redmineflux_platform/list/leaves/new` ("New Leave Request" — the single consolidated form that Platform's own screen now serves, with both Shift Management's `/shift_management/leave` and Workload's `/rf_leaves` redirecting to it since `BUG-PLT-045`'s fix).
4. Observe the "Leave Type *" dropdown: its own helper text reads "The kind of time off. Only the types their band allows are listed." It lists every currently-Active Leave Type in the system (`Comp-Off`, `Emergency Leave`) with no filtering — expected behavior for a zero-band user is either an empty list or a hard block, not the full unrestricted set.
5. Select "Emergency Leave", fill Start Date / End Date (`10/20/2026`) and Reason, and click **Create**.
6. Observe the submission succeeds outright — Leave #9 is created with Status **Pending**, Leave Type **Emergency Leave**, no error, no warning, no approval-time rejection.

## Expected result

- Per the form's own stated rule ("Only the types their band allows are listed") and the already-fixed, closed behavior on both predecessor screens (`BUG-PLT-036` for Shift Management, `BUG-PLT-043` for Workload), a user with **no** Leave Policy Band assigned should either see no selectable Leave Types, or be blocked from submitting any Leave Type at all, until a band is assigned.

## Actual result

- `aurora.wren`, with confirmed zero Leave Policy Band assignment (the entire environment currently has 0 band assignments of any kind), sees the full unrestricted list of Active Leave Types on the consolidated `/redmineflux_platform/list/leaves/new` form and successfully creates Leave #9 with "Emergency Leave" selected — no gate is enforced anywhere in the flow.
- Root cause (inferred from behavior — consistent with the fix history): `BUG-PLT-036` and `BUG-PLT-043` each fixed the Policy Band gate independently, inside the two old plugin-specific "Apply Leave" controllers/views (Shift Management's and Workload's). `BUG-PLT-045`'s consolidation replaced both of those forms with a single canonical one under Platform's own `EntitiesController`/Leave view — but the gate logic itself appears not to have been carried over into that new consolidated path, so the single remaining form has silently regressed back to the pre-fix behavior for every caller, not just one plugin.
- This is a more severe regression than either original bug: `BUG-PLT-036`/`BUG-PLT-043` each left one of three forms correctly gated at the time; this regression removes the gate from the one and only form that now exists.

## Evidence

### Screenshot

![Zero Leave band assignments exist anywhere in the environment](../../screenshots/BUG-PLT-053/BUG-PLT-053-zero-band-assignments.png)

![New Leave Request form's Leave Type dropdown lists every Leave Type unrestricted, for a zero-band user](../../screenshots/BUG-PLT-053/BUG-PLT-053-leave-type-dropdown-unrestricted.png)

![Form filled out as aurora.wren before submit](../../screenshots/BUG-PLT-053/BUG-PLT-053-form-filled-before-submit.png)

![Leave #9 created successfully, Status Pending, no Policy Band gate enforced](../../screenshots/BUG-PLT-053/BUG-PLT-053-leave-created-no-band-gate.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-053/retest-yyyy-mm-dd-pass.png)

### Console / log

- N/A — confirmed via live UI submission (200/redirect to the created record, Status "Pending"), cross-checked against the zero-band-assignment state of the environment and the form's own stated rule text.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Related to, but not a duplicate of, the closed `BUG-PLT-036` (Shift Management) and `BUG-PLT-043` (Workload) — both of those were fixed and confirmed closed on 2026-10-15, against the old per-plugin forms. This is a new regression on the single consolidated form that `BUG-PLT-045` introduced afterward.

## Production report

- Not yet reported — pending approval for which production Run/Testcase to link it to (likely Run #586, linked either to the "Leave Cross-Plugin Flow" testcase or "Permissions and Access", per the same workflow used for `BUG-PLT-052`).
