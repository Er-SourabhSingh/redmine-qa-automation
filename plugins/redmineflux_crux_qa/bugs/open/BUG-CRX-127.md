# Bug Report Template

- Bug ID: BUG-CRX-127
- Production Redmine Issue ID: #126734
- Title: Time Agent's "Core Update/Delete Time Entry" paths show a misleading, generic "you do not have permission... ask admin to grant a role" error when the real block is the approval-lock or past-date-lock business rule — while the sibling "Core Log Time" (create) path correctly names the real rule for the identical condition
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `luna.blossom` (Manager — non-admin)
- Date: 2026-10-30

## Steps to reproduce

1. As `luna.blossom`, a genuine member with time-logging permission on "Crux PM Agent Test Project" (proven by successfully proposing new time-log writes there via the Time Agent in this same session), with a real time entry she owns (Time Entry #2: 2026-10-26, "Customer Call" activity, 1.5h, issue #2) in a week ("Retest Squad" team's Week 44) whose timesheet is now fully Approved.
2. In a chat pinned to the Time Agent, ask: "Please update my time entry on 2026-10-26 for the Crux PM Agent Test Project, issue #2, Customer Call activity (1.5 hours) to 2 hours instead." Confirm the proposed `Core Update Time Entry` write (this time correctly resolved to Time Entry #2 once the issue number was included in the description).
3. Separately, attempt `Core Log Time` (creating a brand-new entry) for a date in the same approved week, and compare the two error messages.

## Expected result

- Both the Update and the Log Time (Create) paths should surface the same, accurate reason for the block — the real business rule (the week's timesheet is approved/locked, or the past-date cutoff has passed) — not a generic, misleading "you lack a role/permission" message that points the user toward the wrong fix.

## Actual result

- **Core Update Time Entry** (confirmed, reproduced 3/3 across this and earlier testing — entry #8 edit, entry #8 delete, entry #2 edit, all in approved/locked periods): *"You do not have permission to update time entry #2. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"* — this message is misleading: `luna.blossom` already has genuine time-logging permission on this project (proven moments earlier in the same session), and no role/permission grant would ever resolve this block, since the real blocker is the approval-lock business rule, not RBAC.
- **Core Log Time** (create), same project, same approved week: *"Validation error: This time entry cannot be modified because the timesheet for the week of 26 Oct 2026 has been approved and is locked for editing. Contact your manager if a correction is needed."* — this message correctly and specifically names the real rule and gives the right next step (contact your manager about the approval, not an administrator about roles).
- The underlying native Redmine error, confirmed independently via the native UI, matches the Log Time wording: *"You cannot add or edit timelog after timesheet approval."* — so the Update/Delete tool paths are the ones with the inaccurate message, not Log Time.
- Net effect: a user hitting this block via Update or Delete will follow the wrong remediation path (asking an admin for a permission grant that doesn't exist and won't help) instead of the correct one (asking their manager to reconsider the approval or unlock the period).

## Evidence

### Console / log

- Update confirm-table error (reproduced identically across 3 separate attempts on 2 different entries): *"You do not have permission to update time entry #2/#8. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"*
- Delete confirm-table error (entry #8): *"You do not have permission to delete time entry #8. To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]"*
- Log Time (create) confirm-table error, same user/project/week: *"Validation error: This time entry cannot be modified because the timesheet for the week of 26 Oct 2026 has been approved and is locked for editing. Contact your manager if a correction is needed."*
- Native UI, attempting to add time in the same approved week via `/timesheets/weekly`: *"You cannot add or edit timelog after timesheet approval."*

## Duplicate check

- Duplicate found: No — distinct from BUG-CRX-126 (that bug is about wrong time-entry ID resolution on Update; this bug is about the error MESSAGE shown once the correct entry is targeted and genuinely blocked). Both affect the same `Core Update Time Entry` tool but are independent defects with independent fixes.
