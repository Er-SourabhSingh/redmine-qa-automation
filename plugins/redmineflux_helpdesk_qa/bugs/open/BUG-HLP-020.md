# BUG-HLP-020

- Bug ID: BUG-HLP-020
- Production Redmine Issue ID: 119752
- Title: Reassigning an unassigned ticket resumes the SLA clock without extending the deadline by the paused duration — unlike the Waiting-for-Customer-Response pause/resume, which does extend it correctly
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (performed the unassign/reassign as part of `HELPDESK_SLA_ESCALATION.md` TC-HLP-086)
- Date: 2026-09-01

## Steps to reproduce

1. Ticket #15 ("TC-HLP-091 mid-level entry test"), on Helpdesk QA Alpha, running "Alpha Escalation Test SLA" (1-minute targets) at Support Level L2, assigned to Autumn Grace, Status "In Progress" (not Waiting for Customer Response). Resolution deadline: 09/01/2026 08:35 AM (UTC), clock running ("✓ On Track").
2. Unassign the ticket (Edit → Assigned to → blank → Submit) at ~08:36 AM UTC. SLA Information tab immediately shows **"⏸ Paused" — "Paused since 09/01/2026 08:36 AM (UTC)"**.
3. Reassign the ticket back to Autumn Grace (Edit → Assigned to → Autumn Grace → Submit) at ~08:36:40 AM UTC, while Status remained "In Progress" throughout (never entered Waiting for Customer Response, so TC-HLP-086's "stays paused" exception does not apply — this should be a normal resume).
4. Check the SLA Information tab immediately after reassignment.
5. Trigger the SLA monitor (`Helpdesk::SlaMonitorWorker.new.perform`) and observe the result.

## Expected result

Per this session's own confirmed behavior for the equivalent Waiting-for-Customer-Response pause/resume cycle (TC-HLP-085 — customer's reply resumed the clock and the Resolution deadline was pushed from 08:34 AM to 08:35 AM, crediting back the ~1 minute the ticket sat paused), reassigning after an unassign-pause should likewise **extend the deadline by the duration the ticket sat unassigned** — the paused window should not count against the SLA. The ticket should not become instantly overdue the moment it's reassigned.

## Actual result

The Resolution deadline **never moved from 09/01/2026 08:35 AM (UTC)** — the exact same value it held before the unassign — through the entire unassign → reassign cycle. The SLA Information tab's own Activity Log recorded **zero events** for either the unassign-pause or the reassign-resume (only the original "SLA Started" and "First Response Given" entries from before this cycle are present — compare to TC-HLP-085's cycle, which did leave a clean audit trail). Because real wall-clock time (~08:36:40 reassignment, ~08:37:50 monitor run) had already passed the un-extended 08:35 deadline, the very next SLA monitor cycle found the ticket resolution-breached:

```
[SLA][BREACH]    SLA Level : L2
[SLA][BREACH]    Assignee  : autumn.grace (autumn.grace@test.local)
[SLA][BREACH]    Deadline  : 2026-09-01T08:35:12Z (3 min overdue)
[SLA][STATE] Ticket #15 | resolution_breached = true | breached_at: 2026-09-01T08:37:50Z
[SLA][ESCALATION] PATH A: Escalating to next level ... L2 → L3
```

The ticket was escalated to L3 (reassigned to Willow Belle) and an escalation email sent — a real, customer-facing consequence, not just a cosmetic display glitch. The unassign period (~40 seconds in this repro) was effectively **not credited back** to the ticket at all, even though the SLA panel itself displayed "Paused" during that exact window, implying the pause should have been honored.

## Evidence

### Screenshot

![SLA Information tab after reassignment — Resolution deadline frozen at 08:35 AM (unchanged since before the unassign), now flagged "⚠ Overdue 2 minutes", header "⚠ Needs Attention"](../../screenshots/BUG-HLP-020/bug-hlp-020-unassign-reassign-deadline-not-extended.png)

### Console / log

- Full SLA monitor cycle output showing the breach and L2→L3 escalation is quoted above (Actual result section) — matches the live `rails runner Helpdesk::SlaMonitorWorker.new.perform` output captured at 08:37:50Z.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-086 (2026-09-01), immediately after confirming the sibling TC-HLP-085 (Waiting-for-Customer-Response pause/resume) works correctly and *does* extend the deadline — the direct side-by-side contrast between the two pause mechanisms is what makes this a confident, non-ambiguous finding rather than a timing coincidence.
- Severity judged Medium: this is a real, reproducible SLA-accuracy defect with a genuine customer-facing consequence (an unwarranted escalation + notification email), but it requires a fairly specific sequence (unassign, then real wall-clock time crossing the original deadline before reassignment) to trigger, and doesn't affect tickets that are reassigned quickly.
- TC-HLP-086 itself: recorded as FAIL against this bug — see `HELPDESK_SLA_ESCALATION.md`.
