# BUG-HLP-034

- Bug ID: BUG-HLP-034
- Production Redmine Issue ID: 120025
- Title: SLA escalation into a Support Level with 2+ configured agents always assigns the same one agent (lowest user ID) — the other configured agents never receive an escalated ticket under any circumstance
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-03)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: N/A (system-driven, verified by Admin)
- Date: 2026-09-03

## Steps to reproduce

1. Configure a Support Level with **two or more** Support Assignees — e.g. L3 on Helpdesk QA Alpha, configured with "Willow Belle" (User ID 11) and "Aurora Wren" (User ID 30).
2. Raise a customer ticket that enters at the level below (L2), leave it untouched so its SLA breaches, and let the real escalation monitor (`Helpdesk::SlaMonitorWorker`) escalate it into L3.
3. Repeat step 2 with a second, independent ticket into the same multi-agent L3.
4. Compare which agent each ticket was assigned to.

## Expected result

`HELPDESK_USER_GUIDE.md` §10's own canonical worked example illustrates **every** level of a chain with two named agents (`L1 (jessica.wang, ryan.oconnor)`, `L2 (natalie.brooks, sneha.patil)`, `L3 (claire.dubois, james.harrison)`) — multi-agent Support Levels are the documented normal case, not an edge case. A real helpdesk configured with multiple named agents at a level is reasonably expected to actually make use of all of them when escalating incoming work into that level — via round-robin, least-loaded/workload-based assignment, or at minimum some rotation — so that every configured agent is a genuine, reachable destination for escalated tickets over time.

## Actual result

Escalation always assigns the ticket to **whichever configured agent has the lowest Redmine user ID** — never any other agent on the level, no matter how many tickets escalate into it. Confirmed two ways:

**Source-level root cause** (`app/models/rf_issue_sla_status.rb`, method `escalate_to_next_level!`, line 222):

```ruby
new_assignee_id = next_level.support_assignees.any? ? next_level.support_assignees.first.id : nil
```

`support_assignees` (`app/models/rf_support_level.rb`) is defined as:

```ruby
def support_assignees
  return [] if support_assignee_ids.blank?
  User.where(id: support_assignee_array)
end
```

There is **no `.order()` clause anywhere** in this query, and no randomness, round-robin counter, or workload/least-loaded lookup anywhere in the escalation code path. `.first` on an unordered `WHERE id IN (...)` query returns rows in the database's natural order, which in practice (MySQL, primary-key index) is ascending **user ID** — meaning the escalation-assignee pick is a fixed, deterministic function of user ID, not any kind of distribution.

**Live confirmation, two independent tickets**: added a second agent, `aurora.wren` (User ID 30), to L3 alongside the pre-existing `willow.belle` (User ID 11). Raised ticket #44 and ticket #45 (both by `retest.customer1`, both entering at L2), both left to breach and escalate into L3 independently. Sidekiq log for the same monitor run:

```
[SLA][ESCALATION] Ticket #44 | L2 → L3 | Assignee: autumn.grace → willow.belle | New response DL: 2026-09-03T09:31:33Z
[SLA][ESCALATION] Ticket #45 | L2 → L3 | Assignee: autumn.grace → willow.belle | New response DL: 2026-09-03T09:31:33Z
```

**Both tickets landed on Willow Belle — never Aurora Wren.** Re-confirmed via each ticket's own SLA Information panel (`Current Assignee: Willow Belle`, screenshot below). This means: for as long as a Support Level's assignee roster doesn't change, every single escalation into it — no matter how many tickets, over any time period — will always route to the one lowest-ID agent. The other configured agents are, in practice, decorative: their presence in a level's Support Assignees list has zero effect on which tickets they ever receive via escalation, unless the lead agent is later locked or removed from the level.

## Evidence

### Screenshot

![Support Level list — L3 genuinely configured with 2 assignees, "Willow Belle, Aurora Wren"](../../screenshots/BUG-HLP-034/bug-hlp-034-l3-two-assignees-configured.png)

![Ticket #45's detail page after escalating into the 2-agent L3 — Assignee: Willow Belle (identical result to ticket #44)](../../screenshots/BUG-HLP-034/bug-hlp-034-ticket45-assigned-willow.png)

### Console / log

```
[SLA][ESCALATION] Ticket #44 | L2 → L3 | Assignee: autumn.grace → willow.belle | New response DL: 2026-09-03T09:31:33Z | New resolution DL: unchanged
[SLA][ESCALATION] Ticket #44 | REACHED FINAL LEVEL 'L3' — no further escalation path configured
[SLA][ESCALATION] Ticket #45 | L2 → L3 | Assignee: autumn.grace → willow.belle | New response DL: 2026-09-03T09:31:33Z | New resolution DL: unchanged
[SLA][ESCALATION] Ticket #45 | REACHED FINAL LEVEL 'L3' — no further escalation path configured
```

Source excerpt, `rf_issue_sla_status.rb#escalate_to_next_level!`:
```ruby
new_assignee_id = next_level.support_assignees.any? ? next_level.support_assignees.first.id : nil
```

Source excerpt, `rf_support_level.rb#support_assignees`:
```ruby
def support_assignees
  return [] if support_assignee_ids.blank?
  User.where(id: support_assignee_array)   # no .order() — returns lowest-ID-first in practice
end
```

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; TC-HLP-302 tested the same general "exactly one agent, notification follows that agent" shape on an L1→L2 hop but explicitly left the *rule itself* undetermined, treating "any pick" as acceptable — this bug is a distinct, sharper finding: not just "one agent is picked" but "it is always the *same* one, forever, with no distribution")
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-366 (2026-09-03), written specifically to determine the selection rule after the user asked directly whether escalation assignment is random, round-robin, workload-based, or priority-order-based, and pointed out this looked like a real gap.
- Severity judged **Medium**: this is not a crash or data-loss defect, and no documented contract in the strict sense promises round-robin/workload distribution — but the user guide's own canonical example treats multi-agent levels as the normal configuration, and a support level with 2+ named agents that in practice only ever routes to one of them defeats the visible purpose of configuring more than one assignee at all. This is a real functional/fairness gap a product owner would reasonably want fixed (workload distribution, round-robin, or at minimum some rotation), not a cosmetic issue.
- New reusable fixture created for this finding, kept for future regression: `aurora.wren` (User ID 30, Agent role, Support Level L3) — see `HELPDESK_USERS_AND_CUSTOMERS.md`'s 2026-09-03 fixture block. L3 is now genuinely 2-agent (Willow Belle + Aurora Wren) going forward.
