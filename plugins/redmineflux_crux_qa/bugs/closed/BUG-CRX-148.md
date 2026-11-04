# Bug Report Template

- Bug ID: BUG-CRX-148
- Production Redmine Issue ID: #127553
- Title: Capacity Agent's `member_update` fabricates a plausible-looking but WRONG role id when asked to set a
  member's role by name alone ("Developer") — proposed role id 2 ("Anonymous," a built-in system role), not
  the real Developer role (id 3) — instead of looking up the real mapping or honestly asking
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. Confirm natively via Administration → Roles that role ids on this instance are: `1=Non member`,
   `2=Anonymous`, `3=Developer`, `4=Manager`, `5=Reporter`, `6=QA Full Access`, `7=QA No Access`.
2. As admin, Capacity Agent pinned, fresh chat: "Change Daisy Skye's role on the Crux Capacity Agent Test Team
   to Developer." — a plain, natural request using only names (team, member, role) — exactly how a real user
   would phrase it, with no numeric id supplied anywhere.
3. Inspect the resulting `Workload Member Update` confirm card's `Role` field before confirming.

## Expected result

Since the user supplied only the role *name* ("Developer"), the agent should either genuinely look up the
real Developer role id (3) via a roles-listing tool, or — if no such tool is available to it — honestly ask
the user for the id rather than silently proposing a specific, wrong, plausible-looking number.

## Actual result

The confirm card showed `Team: Crux Capacity Agent Test Team`, `Membership: Daisy Skye`, **`Role: 2`** — but
role id 2 is genuinely **"Anonymous"**, a built-in system role completely unrelated to "Developer" (the real
Developer role is id 3). The agent fabricated a specific, wrong numeric value with no indication of
uncertainty, rather than either resolving it correctly or asking. Cancelled before confirming — no write
occurred.

**Notable inconsistency on retry**: the identical request, retried in a fresh chat, this time correctly
recognized it didn't actually know the real numeric id and asked the user directly: *"I need to know the
Developer role's ID in your Redmine system to make the change... Could you provide the role ID for
'Developer'?"* — i.e. the agent is capable of honestly flagging this gap, but did not do so consistently; one
attempt silently fabricated a wrong value instead.

## Evidence

### Console / log

- Native confirmation, Administration → Roles: role ids are `1=Non member`, `2=Anonymous`, `3=Developer`,
  `4=Manager`, `5=Reporter`, `6=QA Full Access`, `7=QA No Access`.
- Attempt 1 (verbatim confirm card): `Team: Crux Capacity Agent Test Team`, `Membership: Daisy Skye (now
  Reporter)`, `Role: 2`. Cancelled — native-verified Daisy's role column still genuinely shows `-` (unchanged)
  afterward.
- Attempt 2, identical request, fresh chat (verbatim): *"I need to know the Developer role's ID in your
  Redmine system to make the change. The `member_update` tool requires a `role_id` (a numeric Redmine role
  ID, not just the name). Could you provide the role ID for 'Developer'?"* — the honest, correct behavior,
  not reproduced on attempt 1.

## Duplicate check

- Duplicate found: No. First finding of a fabricated-wrong-value defect specifically on the `role_id`
  parameter of `member_update`. Related in general shape to the KB Agent's BUG-CRX-140 (fabricated/corrupted
  identifier on a confirm card) and this suite's own BUG-CRX-145 (wrong member resolved) — but this is a
  distinct parameter (role, not project/team/member identity) and a distinct, inconsistent behavior (the
  agent sometimes honestly asks instead of guessing, proving it CAN recognize the gap but doesn't always).

## Retest — 2026-11-04 (FIXED)

Developer pulled `redmineflux-crux-core`→`b6867e8`, `redmineflux-mcp`(`crux_development`)→`93d479c`,
`redmineflux_crux` plugin→`7751dc8`, `redmineflux_workload`→`0b304a3` (retest guide round 31). Migrations run,
all services restarted.

Retested the exact check: "Change Luna Blossom's role to Developer." (name-only, no id supplied). Confirm card
correctly showed `Role Name: Developer` — the real role **name**, not a guessed numeric id. Confirmed → `"✓
Member updated: Luna Blossom (user #5, membership #1) | Role: Developer | manage_workload=False,
can_approve_leave=False."` Native-verified: Luna Blossom's role genuinely shows "Developer" on the team page,
and her `Can approve leave`/`Manage workload` flags stayed as they were (both correctly unaffected by the role
change). **Status: FIXED.** Moved to `bugs/closed/`.
