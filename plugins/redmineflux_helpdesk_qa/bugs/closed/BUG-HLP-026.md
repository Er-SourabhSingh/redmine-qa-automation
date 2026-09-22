# BUG-HLP-026

- Bug ID: BUG-HLP-026
- Production Redmine Issue ID: 119773
- Title: Locking an agent's Redmine account does not remove them from a Support Level's Support Assignees list — the level's configuration silently goes stale
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-01

## Steps to reproduce

1. On Helpdesk QA Alpha, Support Level L2 has two Support Assignees: `Autumn Grace` and `Briar Sunset`.
2. Lock `briar.sunset`'s Redmine account (Administration → Users → her row's Actions → **Lock**).
3. Re-open L2's Edit form (`/projects/1/rf_support_levels/4/edit`) and check the Support Assignees field.
4. Also check the Support Level list view (`/projects/helpdesk-qa-alpha/helpdesk/settings?tab=support_levels`), which shows assignees inline per row.

## Expected result

Once an agent's account is locked, the plugin should reflect that somewhere in the Support Level configuration — either by automatically removing the locked agent from the Support Assignees list, or at minimum by visibly flagging that one of the listed assignees is a locked/inactive account. An admin looking at the Support Level's configuration should not see a stale roster that silently no longer matches who can actually receive tickets.

## Actual result

Nothing changes anywhere in the Support Level configuration or its display:

- The Edit form's Support Assignees field still reads **"2 selected"**, and opening its dropdown shows both `Autumn Grace` and `Briar Sunset` still checked — no lock/inactive indicator next to her name, no visual difference from an active assignee at all.
- The Support Level list view's "Support Assignees" column still plainly reads **"Autumn Grace, Briar Sunset"** — again with no indication either name is now unreachable.
- This is despite the account being genuinely locked and actually excluded from ever receiving a ticket in practice (confirmed separately in `TC-HLP-353`: 3/3 real escalations into L2 correctly skipped her and picked `Autumn Grace`, and she is absent from every ticket's manual Assigned-to dropdown). The configuration display and the real, functional behavior have silently diverged — an admin has no way to tell, just from looking at the Support Level screens, that one of "her" two assignees can no longer actually do anything.

## Evidence

### Screenshot

![briar.sunset's account genuinely locked (Administration → Users) — action link reads "Unlock"](../../screenshots/BUG-HLP-026/bug-hlp-026-briar-sunset-locked-account.png)

![L2's Edit form still shows "2 selected" with both Autumn Grace and Briar Sunset checked, no lock indicator on either](../../screenshots/BUG-HLP-026/bug-hlp-026-support-level-still-lists-locked-agent.png)

![The Support Levels list view's own Support Assignees column still plainly reads "Autumn Grace, Briar Sunset" with no distinction shown](../../screenshots/BUG-HLP-026/bug-hlp-026-support-levels-list-still-shows-locked-agent.png)

### Console / log

- N/A — this is a configuration-display staleness gap, not a runtime error. The underlying escalation/assignment logic behaves correctly (see Notes); only the admin-facing Support Level screens fail to reflect the account's real status.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- **This is a configuration-consistency/visibility gap, not a functional/security defect.** Confirmed via `TC-HLP-353` before filing this: the locked agent can never actually be assigned a ticket, through either automated escalation (3/3 real escalations correctly skipped her) or manual assignment (she is entirely absent from the Assigned-to dropdown) — both paths correctly respect Redmine's standard active-user scoping. The bug is specifically that the Support Level's own configuration UI never reflects this — an admin reviewing "who covers L2" sees two names, when in reality only one can ever receive a ticket.
- Real-world consequence this could cause: an admin might believe L2 has 2x assignee coverage (e.g. for load-balancing or backup-coverage planning) when it effectively has only 1, with no on-screen signal to correct that assumption short of manually cross-checking each assignee's account status in Administration → Users.
- Suggested fix direction (not prescriptive): either (a) automatically uncheck/remove a user from a Support Level's assignee list when their account is locked, or (b) keep them listed but visually flag it (e.g. "Briar Sunset (locked)" or a greyed-out/warning treatment) in both the Edit form's dropdown and the list view's Support Assignees column.
- Filed per explicit user direction, after this was initially raised only as a low-impact observation (not a bug) in `TC-HLP-353`'s evidence — corrected the same session, matching this engagement's now-standing lesson (`feedback_ux_judgment_overrides_documented_contract_bar`): a "no functional harm" read is a starting point, not a reason to skip filing once the user judges it worth tracking.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119773 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Locked `briar.sunset`'s account again (Administration → Users → Actions → Lock). Reopened L2's Edit form (`/projects/1/rf_support_levels/4/edit`) and clicked into the Support Assignees dropdown: it now shows **"Briar Sunset (locked)"** next to her checked entry, distinguishing her from the unflagged "Autumn Grace".
- Checked the Support Levels list view (`/projects/1/helpdesk/settings?tab=support_levels`): the Support Assignees column for L2 now reads **"Autumn Grace, Briar Sunset (locked)"** — the same flag surfaces there too.
- Both previously-stale screens now correctly reflect the account's real status. Unlocked `briar.sunset`'s account afterward to restore original state.
- Production issue #119773 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
