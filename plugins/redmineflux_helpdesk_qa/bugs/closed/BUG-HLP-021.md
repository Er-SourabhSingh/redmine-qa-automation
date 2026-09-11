# BUG-HLP-021

- Bug ID: BUG-HLP-021
- Production Redmine Issue ID: 119754
- Title: A ticket escalates INTO a deactivated Support Level — the level's Active flag is not checked by the escalation logic
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: N/A (system-driven, verified by Admin)
- Date: 2026-09-01

## Steps to reproduce

1. On Helpdesk QA Alpha, a chain L1 (Luna Blossom) → L2 (Autumn Grace, Briar Sunset) → L3 (Willow Belle) exists, using "Alpha Escalation Test SLA" (1-minute Response/Resolution Time).
2. Create a ticket, assign it to Luna Blossom (L1) — SLA starts at L1.
3. Before the ticket's deadline passes, **deactivate L2** via Project → Helpdesk → Settings → Support Level → uncheck L2's Active checkbox. Confirmed via the list reload: checkbox shows unchecked (screenshot 2).
4. Confirmed L2 is genuinely excluded from the New Customer form's Support Level dropdown at this point (per TC-HLP-105 Step 2 — the deactivation itself is real and takes effect immediately for that path).
5. Let the ticket's L1 deadline pass, then trigger the SLA monitor (`Helpdesk::SlaMonitorWorker.new.perform`).

## Expected result

Per `HELPDESK_USER_GUIDE.md`, Support Level table, "Active" row: **"Inactive levels are not offered and are not escalated into."** The ticket should not land on L2 while it is deactivated — it should either escalate past L2 to the next active level (L3), stay stuck at L1 with some other documented fallback, or otherwise avoid assigning the ticket to a level currently marked inactive.

## Actual result

The ticket escalated normally straight into the deactivated L2, exactly as if L2 were still active. Sidekiq log:

```
[SLA][ESCALATION] ┌─ PATH A: Escalating to next level
[SLA][ESCALATION] │  Ticket        : #19 — TC-HLP-105 deactivate-L2-mid-escalation test ticket
[SLA][ESCALATION] │  From Level    : L1
[SLA][ESCALATION] │  To Level      : L2
[SLA][ESCALATION] │  Prev Assignee : luna.blossom (luna.blossom@test.local)
[SLA][ESCALATION] Ticket #19 | L1 → L2 | Assignee: luna.blossom → autumn.grace | New response DL: 2026-09-01T10:19:42Z
[SLA][EMAIL] │  Recipient     : autumn.grace (autumn.grace@test.local)
[SLA][EMAIL] └─ STATUS: SUCCESS — Escalation Notification delivered to autumn.grace (autumn.grace@test.local)
```

Confirmed on the ticket's own SLA Information tab afterward: Support Level "L2", Current Assignee "Autumn Grace", Activity Log shows "↑ Escalated → L2", escalation count incremented to 1 — a real, full escalation into the inactive level, including a real notification email delivered to L2's own assignee. L2's Active checkbox was re-verified still unchecked at the moment this happened (screenshot 2, taken immediately after).

## Evidence

### Screenshot

![Ticket #19's SLA Information tab after escalation — Support Level: L2, Current Assignee: Autumn Grace, Activity Log shows "Escalated → L2"](../../screenshots/BUG-HLP-021/bug-hlp-021-escalated-into-deactivated-l2.png)

![Support Level list at the same time, confirming L2's Active checkbox is genuinely unchecked](../../screenshots/BUG-HLP-021/bug-hlp-021-l2-still-inactive-at-time-of-escalation.png)

### Console / log

Full Sidekiq monitor cycle output quoted above (Actual result section).

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-105 (2026-09-01) — that TC's own Expected Result anticipated needing to "record whatever actually happens, since the guide does not specify the exact fallback." It turns out the guide *does* specify the expected fallback explicitly (Support Level table, Active row) — this was checked directly before filing, per this engagement's standing rule to verify any bug claim against the actual documentation rather than assumption.
- Severity judged Medium: this is a real, clearly-documented behavior violation with a genuine customer-facing consequence (a ticket lands on an agent who is supposed to have been taken off escalation duty, and that agent gets a real notification), but it requires the specific sequence of deactivating a mid-chain level while a ticket is actively counting down toward breaching into it — not the most common operational scenario.
- L2 was left deactivated after this test — re-check whether it should be reactivated before further chain-dependent testing in later sessions (Autumn Grace/Briar Sunset's L2 currently won't be offered on new customer project-access rows or Support Level Escalation To dropdowns while inactive, even though escalation *into* it still works per this bug).

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119754 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Setup: found Redis/Sidekiq were not running in `redmine-docker-6-redmine-1` (only Puma auto-restarts with the container, per standing memory note) — restarted both, since SLA first-assignment / escalation logic depends on them.
- Created a fresh ticket as `alpha.customer` (whose entitlement is Helpdesk QA Alpha / Alpha Escalation Test SLA / L1, 1-minute Response & Resolution Time), then assigned it to `luna.blossom` (L1) as admin to start the SLA clock (`start_sla_for_first_assignment` fires on first assignment, not on ticket creation).
- Deactivated L2 (Autumn Grace, Briar Sunset) via Support Level settings before the 1-minute Response deadline passed.
- Waited for the deadline to pass, then triggered `Helpdesk::SlaMonitorWorker.new.perform`.
- **Result**: the worker log showed `[SLA][ADMIN] PATH B: Admin fallback — no further escalation level`, NOT an escalation into L2. Verified via `rf_issue_sla_status`: `current_support_level_id` remained `1` (L1) and `escalation_count` stayed `0` — the ticket was never assigned to the deactivated L2. Instead it was reassigned to `admin` via the documented Admin-fallback path, and a Critical Breach Alert email was sent to admin.
- This satisfies `HELPDESK_USER_GUIDE.md`'s Support Level "Active" row contract ("Inactive levels are not offered and are not escalated into") — the fix does not skip past L2 to the next active level (L3); instead it refuses to escalate into an inactive level and falls back to Admin, which is a valid way to honor the same contract.
- L2 was reactivated immediately after the retest to restore its original Active state.
- Production issue #119754 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
