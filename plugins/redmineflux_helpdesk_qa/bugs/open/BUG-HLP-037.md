# BUG-HLP-037

- Bug ID: BUG-HLP-037
- Production Redmine Issue ID: 120076
- Title: [UNCONFIRMED — see Retest Correction below] Hard mode ("stop work") appeared once to not stop anything at zero remaining hours, but three subsequent identical-methodology retests all correctly blocked — original finding likely a one-off anomaly, not a reliably reproducible defect
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-03)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Client (Customer) for part 1, Agent for part 2
- Date: 2026-09-03

## Steps to reproduce

**Setup (Admin):** Organization "Alpha Minimal Fields Test Org", project Helpdesk QA Alpha. Set "When hours run out" = **Hard — stop work** (confirmed persisted via dropdown re-check after the server round-trip). Reduced the budget via Add/top up hours (-19.58h) so Approved = 0.42h = Used = 0.42h, i.e. **Remaining = 0.00h exactly** — confirmed on the org page, the Helpdesk Command Center dashboard's Prepaid Support Hours widget, and the customer's own project dashboard, all showing 0.00h Remaining simultaneously.

**Part 1 — customer raises a new ticket:**
1. As `delta.customer`, from the Helpdesk QA Alpha dashboard, click New issue.
2. Fill Subject "TC-HLP-138 - Hard mode at zero hours new ticket test", click Create.

**Part 2 — agent logs time on an existing ticket:**
3. As `luna.blossom` (agent), open ticket #46 (already belongs to this organization/project), click Reply.
4. Enter a note, set Time spent = 10 min, Activity = Technical Support, click Save.

## Expected result

Per `HELPDESK_USER_GUIDE.md` (line 827, restated in the checklist at line 1463): **"Hard: Once hours reach zero: the customer cannot raise a new ticket, and nobody can log time on their tickets."** Both actions above should be refused/blocked.

## Actual result

Neither action was blocked:

1. **Part 1:** The new ticket was created normally — flash message **"Successful creation."**, ticket **#48** appeared in the tickets list with no warning, no error, no block of any kind.
2. **Part 2:** The time log was saved normally — the ticket's own "Spent time" field went from 0:25h to 0:35h, and its "Prepaid Support Hours" line updated to **"0.58h used · -0.16h left of 0.42h"** (the negative figure rendered in red) — the balance was silently allowed to go negative, which is exactly the **documented behavior of No Limit / Soft** mode, not Hard.

Hard mode's "stop work" enforcement appears to have **no effect at all** in either direction it is documented to control. The mode value itself does persist correctly in the UI (confirmed separately in TC-HLP-134's evidence) — the dropdown reads "Hard — stop work" throughout this repro — so this is not a UI/persistence bug, it is the enforcement logic itself never checking the mode (or never being wired to the ticket-creation and time-entry code paths at all).

## Evidence

### Screenshot

![Ticket #46 detail panel showing Spent time 0:35h and Prepaid Support Hours "0.58h used · -0.16h left of 0.42h" in red, immediately after an agent's time-log Reply succeeded under Hard mode with the budget already at zero](../../screenshots/BUG-HLP-037/bug-hlp-037-hard-mode-not-enforced-negative-balance.png)

### Console / log

- Org page ("Alpha Minimal Fields Test Org", `/rf_organizations/8?tab=prepaid_support_hours`) confirmed Approved 0.42h / Used 0.42h / Remaining 0.00h, "When hours run out" dropdown showing "Hard — stop work" selected, immediately before Part 1.
- Part 1: page navigation after clicking Create landed on the tickets list with flash text "Successful creation." and a new row for ticket #48, subject "TC-HLP-138 - Hard mode at zero hours new ticket test", no error/warning text anywhere on the page.
- Part 2: ticket #46's own Prepaid Support Hours line read "0.25h used · 19.75h left of 20.00h" before this session's earlier TC-HLP-134 pass, then updated correctly through legitimate top-ups/time-logs across TC-125–137, finally reaching "0.58h used · -0.16h left of 0.42h" right after this Reply — the delta (0.42h → 0.58h, exactly +0.167h ≈ 10 min) confirms the time entry really was accepted and billed against the budget, not merely displayed stale.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_PREPAID_HOURS.md` TC-HLP-138 and TC-HLP-139 (2026-09-03), both against the same precondition (Hard mode, Remaining exactly 0.00h) — filed as one bug since both symptoms share what looks like the same root cause: Hard-mode enforcement not being checked on either the ticket-creation path or the time-entry path.
- Originally judged **High** severity (see reasoning below), but see the **Retest — Correction** section: this no longer holds with confidence given the bug did not reproduce on retest.
- Contrast with `TC-HLP-136` (reducing budget below zero) and `TC-HLP-137` (Comment required) — both of those enforcement paths work correctly and are well-behaved.
- Retested (see below) under No Limit and Soft modes via TC-133/135 — both correctly allowed the exhausted-budget actions with the balance going negative, which is their genuine expected behavior (not a sign of the same defect).

## Retest — Correction (2026-09-03, same-day follow-up)

While executing the newly-added TC-HLP-380/381 (Hard-mode regression tests, added from a user gap-analysis), the exact same scenario — org 8 "Alpha Minimal Fields Test Org", Hard mode, ticket #46, Remaining driven to exactly 0.00h via a budget reduction — was retested **three separate times**, and **all three correctly blocked**:

1. **Retest 1** (Remaining reduced to 0.75h Approved = 0.75h Used via a single `-3.25h` reduction, reached after several prior top-up/reduction operations in the same session): attempting to log a 5-minute time entry on ticket #46 as `luna.blossom` was refused with a real validation error: **"Time entries is invalid — Prepaid support hours for Alpha Minimal Fields Test Org are used up (-0.00h). Top up the budget to log more time."**
2. **Retest 2** (same budget state, immediate repeat): blocked identically, same error message.
3. **Retest 3** (a fresh, isolated single-operation reduction: topped up +5h then reduced by exactly -5h in one operation, deliberately mirroring the original repro's "one direct reduction to exact zero" methodology as closely as possible): **also blocked**, both the time-log (same error as above) — and critically, **the new-ticket-creation path was also retested as `delta.customer` and also correctly blocked**, with a clear, well-worded message: **"Alpha Minimal Fields Test Org has no prepaid support hours left on this project, so a new ticket cannot be raised. Please contact your account manager to top up."**

**Investigation into why the original repro differed:** Checked whether Redis/Sidekiq (a known standing environment quirk on this container — see `feedback_redmine_docker_6_sidekiq_redis_not_auto_restart`) had been restarted between the original test and these retests, which could explain a stale-cache theory; both processes show continuous uptime since the container's morning start, with no restart evidence, weakening that theory. A "single operation vs. accumulated-through-many-operations" theory was also tested and ruled out — Retest 3 used a single, isolated reduction operation (the same shape as the original repro) and still blocked correctly. No definitive root cause for the original discrepancy was found despite deliberate effort to isolate it.

**Conclusion:** The original finding (Hard mode enforces nothing on either path) does not currently reproduce. Given three consecutive, methodologically-varied retests all show Hard mode's enforcement working correctly on both the new-ticket and time-log paths, this bug should be treated as **unconfirmed** rather than a reliably reproducible defect. It is being kept open (not closed) pending a maintainer/user decision, since a genuine one-off anomaly (a transient race condition, an eventual-consistency lag in some background recompute, or similar) *could* still represent a real, if intermittent and hard-to-reproduce, issue worth tracking — but it should **not** be treated as a solid, always-reproducing High-severity defect on the strength of the original single observation alone. Recommend downgrading pending further evidence, and re-opening this investigation only if the original symptom (successful over-budget action under Hard mode) is observed again.
