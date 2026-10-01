# Bug Report Template

- Bug ID: BUG-CRX-040
- Production Redmine Issue ID: #121518
- Title: Time Agent's `settings_update` prefixes a genuine "Permission denied" failure with a misleading "✓" checkmark, for a non-admin user the native UI correctly hard-blocks with a real 403
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Crux Manager — non-admin, team role "Manager" with `view_timesheets`/`manage_timesheet`/`use_ask_crux` permissions, but not a Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. Log in as a non-admin user who is a genuine timesheet team member (with a role holding `view_timesheets`/`manage_timesheet`) but is **not** a Redmine Administrator.
2. Confirm the native `/settings/timesheet` page genuinely refuses this user with a real HTTP 403 (Settings is hard-gated to Administrators only, independent of team role — see `timesheets_controller.rb`'s admin-only guard).
3. In Ask Crux chat, ask the Time Agent to change a plugin-wide setting: "Time Agent, please update the timesheet plugin settings: change the Overtime Threshold from 8 to 11 hours per day. Nothing else."
4. Confirm the resulting proposal.
5. Observe the outcome message and independently verify whether the setting actually changed.

## Expected result

- The write should be honestly refused, with a clear message reflecting failure — never prefixed with a success-style "✓" checkmark. This is the same defect class as the already-closed BUG-CRX-018 (misleading "✓"-prefix-on-genuine-failure, previously confirmed across 4 domain agents/failure types: Workload team-create admin-permission denial, CRM/Sales 403 authorship-rule refusal, KB Agent permission refusal, Scrum Agent permission refusal) — that fix apparently didn't cover this Timesheet `settings_update` code path.

## Actual result

- The Time Agent did **not** pre-emptively refuse the request despite the user having no admin access — it produced a real, confirmable `Timesheet Settings Update` proposal (Overtime Threshold Hours: 11).
- Confirming it correctly failed the actual write server-side — **no security bypass**, independently verified: logged back in as admin afterward and confirmed Overtime Threshold was still `8.0`, unchanged.
- However, the failure message was: *"✓ Permission denied — To fix this, ask your Redmine administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — the leading "✓" checkmark visually presents a genuine permission-denial failure as if it were a success, the exact misleading pattern BUG-CRX-018 already documents across other agents/actions.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the real native Settings form (Overtime Threshold field value, unchanged at 8.0 after the attempt, confirmed while logged in as admin).

### Console / log

```
[As luna.blossom (Crux Manager, non-admin), confirmed /settings/timesheet returns real 403 Forbidden
 via direct navigation -- Settings genuinely admin-only regardless of team role]

C (luna.blossom): Time Agent, please update the timesheet plugin settings: change the Overtime
Threshold from 8 to 11 hours per day. Nothing else.
-> asking the Time Agent...
I'll do this (Timesheet Settings Update) -- confirm?
[Write] Overtime Threshold Hours: 11
[Confirm clicked]
"✓ Permission denied
To fix this, ask your Redmine administrator to:
• Grant you the required role/permission for this action
• Check: Administration -> Roles and Permissions -> [your role]"

[Verification, logged back in as admin]
/settings/timesheet -> Overtime Threshold Hours field value: 8.0 (unchanged) -- confirms the write
was genuinely blocked server-side, not just a display-layer refusal.
```

## Duplicate check

- Duplicate found: No (per explicit user instruction, filed as a new bug rather than reopening BUG-CRX-018, since that bug is already closed/production-synced and this is a fresh occurrence found afterward in a different plugin domain).
- Existing bug reference (if duplicate): BUG-CRX-018 (same defect *class* — misleading "✓" prefix on a genuine failure — closed 2026-09-25; this is the first confirmed instance in the Timesheet Agent's `settings_update` path, found after that closure).

## Production report

Reported to production 2026-09-29 as **#121518** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Usability, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 / environment "Window 11 + Chrome" — testcase result marked Failed with defect #121518 attached, confirmed via `get_issue`.

## 2026-10-01 retest — CONFIRMED FIXED (original scenario); narrower-than-expected fix scope flagged for dev awareness

Dev's fix (`redmineflux-crux-core`, branch `master`, commit `f6b2c44` — widened `proposals.py`'s `_looks_like_failure()` failure markers to include the literal phrases `"permission denied"` and `"you do not have permission"`; confirmed present in the local git checkout).

Re-ran the exact original repro as `luna.blossom` (non-admin, confirmed `/settings/timesheet` still genuinely 403s her): after a couple of BUG-CRX-013 self-contradiction retries (unrelated, already-known intermittent issue), got a real `Timesheet Settings Update` proposal (Overtime Threshold Hours: 11) and confirmed it. Result: *"Permission denied / To fix this, ask your Redmine administrator to: ..."* — **the exact original failure text, now genuinely free of the misleading "✓" prefix**, and the proposal correctly stayed pending/retryable (Confirm/Cancel buttons still shown) rather than being marked executed. Verified via `/settings/timesheet` logged back in as admin: Overtime Threshold Hours still `8.0` — no security bypass, consistent with the original finding. **Verdict: CONFIRMED FIXED for this exact scenario.**

**Dev-flagged scope note, worth watching**: the fix is intentionally scoped to exactly the two literal phrasings above (not a broad heuristic). While retesting BUG-CRX-039 in this same session, the *same* underlying ✓-on-refusal pattern recurred on the Time Agent's `submit` tool, refusing Admin's own submission with a *different* 403 message text ("The Administrator account cannot submit its own timesheet — ...") that doesn't contain either of the two fixed phrasings — and that refusal was still shown with a leading "✓". This is not a regression of this bug (BUG-CRX-040's own exact scenario is fixed) but confirms the dev's own caveat that other 403 message shapes elsewhere in the product can still hit the same display defect. Not filing a new bug for this per se — noted here and in `BUG-CRX-039.md` for the dev's awareness in case a broader fix (e.g. detecting HTTP 403 status directly rather than matching message text) is worth considering later.
