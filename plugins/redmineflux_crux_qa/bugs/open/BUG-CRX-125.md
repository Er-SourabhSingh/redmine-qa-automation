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

## Retest — 2026-11-02 — STILL OPEN (not fixed)

Developer commit `cff5cd7` (redmineflux_timesheet API — adds `late_unlock_queue` to `/api/admin_dashboard.json`),
MCP tool-layer commit `0fb02d7` (formats that field into the `admin_dashboard` tool's text output), and crux-core
commit `1e041a1` all pulled; `redmine`/`mcp`/`crux-core` containers restarted.

Recreated the fixture fresh (prior session's fixture had since been resolved): as `luna.blossom`, logged 4h on
2026-10-12 (Week 42) after temporarily raising `Allowed Past Days Timelog` 7→30 (admin), then attempted Submit —
native result: *"Team submission failed: Retest Squad: Submission deadline has passed (Oct 19, 2026)."* Verified
natively on `/admin_dashboard`: **1 overdue blocked submission**, Luna Blossom / Retest Squad, deadline Oct 19,
**14 days overdue**.

Asked the Time Agent (fresh chat, admin) the original repro question. Result improved but still wrong:
*"The admin dashboard shows there is 1 pending submission currently in the queue, but the queue health report
shows: Pending > 3 days: 0, Pending > 7 days: 0 ... This means there are no overdue blocked timesheet submissions
... The Late Submission Unlock Queue is currently empty."* — the agent now sees the real submission count (1,
up from the old "0 submissions" claim) but reads the wrong dashboard section (the generic "queue health" pending-
duration counters) instead of the new `late_unlock_queue` array the fix actually added, and still concludes "empty"
— still a false "all clear" against a genuinely non-empty queue. **Not fixed** — the underlying API data is now
correct, but the agent's reasoning still lands on the wrong field. Reverted `Allowed Past Days Timelog` back to 7
after this retest.

## Retest — 2026-11-03 (after discovering crux-core/mcp were running a stale image all this time) — FIXED

Round 2's retest above was against a stale image (`docker compose restart` never actually rebuilds `crux-core`/
`mcp`). After a genuine `docker compose up -d --build --force-recreate crux-core mcp`, re-verified the fixture:
native `/admin_dashboard` showed **2 overdue blocked submissions** still pending from prior sessions — Luna
Blossom/Retest Squad (Week 42, deadline 2026-10-19, 15 days overdue) and Daisy Skye/Crux PM Agent Test Project
(Week 44, deadline 2026-11-02, 1 day overdue).

Re-ran as `admin`, Time Agent pinned, fresh chat: "Show me the Late Submission Unlock Queue - which users have
overdue blocked timesheet submissions pending unlock?" — the agent now correctly reports: *"The Late Submission
Unlock Queue shows 2 overdue blocked submissions pending unlock: 1. Submission ID: 13 — Luna Blossom — Retest
Squad — Period: Week 42, 2026 — Deadline: 2026-10-19 (15 days overdue) — Status: Draft. 2. Submission ID: 1 —
Daisy Skye — Crux PM Agent Test Project — Period: Week 44, 2026 — Deadline: 2026-11-02 (1 day overdue) — Status:
Draft. Both submissions are deadline-locked (blocked from editing)..."* — this matches the native dashboard
exactly, both records and their overdue durations. **Confirmed fixed** — the agent now correctly reads the real
`late_unlock_queue` data instead of the unrelated queue-health counters.
