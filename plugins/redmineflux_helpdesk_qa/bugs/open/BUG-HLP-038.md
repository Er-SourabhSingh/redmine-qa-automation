# BUG-HLP-038

- Bug ID: BUG-HLP-038
- Production Redmine Issue ID: 120077
- Title: Hard mode only gates on the balance *before* an action, not the balance the action would produce — a single time entry larger than the remaining budget is logged in full, pushing the balance deep into negative with no cap and no warning
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-03)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent
- Date: 2026-09-03

## Steps to reproduce

1. Organization "Alpha Minimal Fields Test Org", project Helpdesk QA Alpha, run-out mode = **Hard — stop work**.
2. Set the budget so Remaining is a small **positive** value: Approved 1.75h, Used 0.75h → Remaining **1.00h** (confirmed via the org page: "43% Used", dropdown showing "Hard — stop work" selected).
3. As `luna.blossom` (agent), open ticket #46 (existing ticket, already carries prior time), click Reply.
4. Set Time spent = Custom, enter **120 minutes (2h)** — deliberately larger than the 1.00h currently remaining — select Activity, Save.

## Expected result

Per `HELPDESK_USER_GUIDE.md` line 827/1463, Hard mode is described as "stop work" once hours reach zero. A reasonable reading of that contract is that Hard mode should prevent the budget from being driven *past* zero by a single action — i.e. either refuse the entry outright, or (at minimum) not allow one action to blow through the remaining balance and land far into negative territory unchecked.

## Actual result

The 2-hour entry was **accepted in full**, no error, no warning, no cap:

- Ticket #46's "Spent time" went from 0:45h to **2:45h** (the full 2h was logged, not capped at the 1h available).
- The ticket's own Prepaid Support Hours line updated to **"2.75h used · -1.00h left of 1.75h"** (the negative figure rendered in red).

This is a **different, more narrowly-scoped and reliably reproducible** gap than BUG-HLP-037 (which is now marked unconfirmed after failing to reproduce on retest — see that bug's "Retest — Correction" section). This one reproduced cleanly on the first attempt: **Hard mode's enforcement check evaluates only whether Remaining is *already* at or below zero *before* the incoming action — it does not evaluate whether the incoming action's own size would push Remaining below zero.** Since Remaining was a genuine positive 1.00h immediately before this action, the pre-check passed and the full 2h entry was allowed through uncapped, even though the action itself was knowably larger than the available budget at submission time.

## Evidence

### Screenshot

![Ticket #46 detail panel showing Spent time 2:45h and Prepaid Support Hours "2.75h used · -1.00h left of 1.75h" in red, immediately after a single 2-hour time entry was accepted in full against only 1.00h of remaining budget under Hard mode](../../screenshots/BUG-HLP-038/bug-hlp-038-crossing-boundary-negative.png)

### Console / log

- Org page confirmed immediately before this action: Approved 1.75h, Used 0.75h, Remaining 1.00h (43% Used), "When hours run out" = "Hard — stop work" selected.
- Reply form: Time spent set to Custom, 120 minutes, Activity "Technical Support", Comment "TC-HLP-382 crossing-boundary test - 2h entry against 1h remaining."
- Post-save: Spent time 0:45h → 2:45h (a clean +2:00h delta, confirming the full request was billed, not partially capped), Prepaid Support Hours "2.75h used · -1.00h left of 1.75h" (0.75h + 2.00h = 2.75h used, exactly matching).

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): Related to but distinct from BUG-HLP-037 (which covers the already-at-or-below-zero case and is currently unconfirmed pending further evidence) — noted as related in both files.

## Notes

- Found while executing `HELPDESK_PREPAID_HOURS.md` TC-HLP-382 (2026-09-03, added from a user gap-analysis of this suite's coverage).
- Severity judged **Medium**: unlike the (now-unconfirmed) BUG-HLP-037, this is cleanly and immediately reproducible on the first attempt, and represents a real, narrower enforcement gap — but the practical business impact is bounded to "one entry's worth" of overage per occurrence, rather than unlimited overage, since once Remaining is negative, BUG-HLP-037's (confirmed-working, per retest) already-negative-blocks-further-entries behavior takes over for any *subsequent* action.
- Recommend the fix (if made) evaluate `remaining - requested_hours < 0` as the gate condition, not `remaining <= 0` alone, so a single large entry can't slip through when Remaining is still positive but insufficient.
