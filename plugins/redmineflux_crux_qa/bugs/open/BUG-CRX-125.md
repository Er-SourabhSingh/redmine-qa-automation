# Bug Report Template

- Bug ID: BUG-CRX-125
- Production Redmine Issue ID: #126697
- Title: Time Agent falsely reports the Late Submission Unlock Queue as empty / the user's timesheet as "not deadline-locked," when the native Admin Dashboard shows a genuine, active overdue blocked submission requiring admin unlock
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. Set up a genuine overdue blocked submission: as `admin`, temporarily enable "Allow Past Date Timesheet" (`/settings/timesheet`) and set a time zone on the admin account (`/my/account`, required for past-date cutoff logic to work at all).
2. As `luna.blossom` (member of team "Retest Squad"), log 4 hours against 2026-10-24 (within the Oct 19–25 week, whose submission deadline of Monday Oct 26 has already passed relative to "today," 2026-10-30).
3. Attempt to submit that week's timesheet. Native result: a red error banner — **"Team submission failed: Retest Squad: Submission deadline has passed (Oct 26, 2026). Please contact an administrator to unlock late submission."**
4. As `admin`, confirm natively on `/admin_dashboard` that the "Late Submission Unlock Queue" now shows **"1 overdue blocked submission"**, with a table row: User=Luna Blossom, Context Type=Team, Context=Retest Squad, Period=Week 43 2026 (Oct 19–Oct 25), Deadline=Oct 26 2026, Overdue=4 days, Action=`Unlock Late Submission` button.
5. As `admin`, in a chat pinned to the Time Agent, ask: "Show me the Late Submission Unlock Queue - which users have overdue blocked timesheet submissions pending unlock?"
6. Separately, retry with a more targeted question: "Does Luna Blossom have an overdue, deadline-blocked timesheet submission for Retest Squad that needs admin unlock?"

## Expected result

- Both questions should surface the real, currently-pending overdue blocked submission (Luna Blossom / Retest Squad / Week 43 / 4 days overdue), matching the native Admin Dashboard.

## Actual result

- **Attempt 1**: the agent answered: *"the Late Submission Unlock Queue is currently empty — there are no users with overdue blocked submissions pending deadline unlock."* It then described an entirely different, correctly-submitted current-week timesheet (ID 3, Oct 26 – Nov 1, "within the current submission window, not deadline-locked") as if that were the only relevant record — completely missing the actual overdue entry.
- **Attempt 2** (reproduction, different phrasing): the agent explicitly answered **"No, Luna Blossom does not have an overdue, deadline-blocked timesheet for Retest Squad."** This time it did surface the correct submission (ID 4, 2026-10-19 → 2026-10-25, 4.0h) but mischaracterized its status as **"still in draft status, no approval or deadline block applied"** — this is factually wrong: a real submission attempt was made against this exact period and was explicitly rejected by the deadline rule, which is precisely why it now appears in the native Late Submission Unlock Queue requiring an admin's `Unlock Late Submission` action.
- Both answers are confident, well-formatted, and wrong — a user or admin relying on Crux to monitor this queue would never learn that a real team member is blocked and waiting on them, since the agent reports "all clear" both times, using two different false framings (no records at all / a record present but mischaracterized as unblocked draft).

## Evidence

### Console / log

- Native `/admin_dashboard` snapshot confirming "1 overdue blocked submission" with full row detail (quoted above) at the time both chat questions were asked — the queue was genuinely non-empty throughout this test.
- Attempt 1 full response text quoted above, 30,496 in / 352 out / $0.02.
- Attempt 2 full response text quoted above, 30,943 in / 349 out / $0.0073.

## Duplicate check

- Duplicate found: No — this is a new, previously untested capability (Late Submission Unlock Queue visibility) with its own distinct failure (false "all clear" read, not a wrong-ID write or a missing-tool refusal like prior bugs this session).
