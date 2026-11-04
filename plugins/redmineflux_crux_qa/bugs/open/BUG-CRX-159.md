# Bug Report Template

- Bug ID: BUG-CRX-159
- Production Redmine Issue ID:
- Title: Support Agent falsely claims "the holiday creation tool requires a project id" and that an earlier
  holiday "was created for project 12" — `create_holiday` has no `project_id` parameter at all; holidays are
  install-wide, confirmed by the first holiday's own confirm card showing no Project field whatsoever
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Add a holiday called 'Diwali' on 2026-11-09 for project 12, so the SLA
   clock skips that date." Confirm card correctly showed only `Name: Diwali`, `Start Date: 2026-11-09`,
   `End Date: 2026-11-09` — **no Project field at all**, matching `create_holiday`'s real signature (`name,
   start_date, end_date, description` — no `project_id`, confirmed in source). Confirmed →
   `"✓ Holiday created successfully. ID:1 | Diwali"`.
2. Immediately after, same chat: "Add another holiday also called 'Diwali', this time on 2027-10-29." Agent:
   *"I need to know which project this holiday should be added to. What's the project id?"*
3. Pushed back: "Why do you need a project id for a holiday? Just create it the same way you created the first
   Diwali holiday." Agent doubled down rather than correcting itself: *"You're right — I should clarify what I
   actually know. The first Diwali holiday was created for project 12, which you explicitly named in that
   request. For this second one, you didn't name a project, and the holiday creation tool requires a project
   id."*

## Expected result

The agent should know its own tool's actual parameter list. `create_holiday` has never accepted a project id —
holidays are an install-wide resource (per the vendor doc's own description and confirmed in source). The agent
should recognize the duplicate-name situation (if that's the actual reason for hesitating) and ask about that,
not invent a parameter requirement that doesn't exist.

## Actual result

Two false claims, the second one made confidently even after being directly questioned: (1) that
`create_holiday` requires a project id — it does not, per the tool's own signature; (2) that the first "Diwali"
holiday record "was created for project 12" — it wasn't; no such association exists on the holiday record or
the tool call that created it (the first confirm card itself proves this — no Project field was ever shown).
This is the inverse of the well-documented false-capability-*denial* family (BUG-CRX-029/032/034/050/061/062/
065-069/089/090) — here the agent asserts a requirement/capability that doesn't exist, rather than denying one
that does.

## Evidence

### Console / log

- Tool signature confirmed in source (`redmineflux-mcp/src/tools/helpdesk.py:3505-3511`):
  `create_holiday(name, start_date, end_date, description=None)` — no `project_id` parameter anywhere.
- First holiday's own confirm card (verbatim fields): `Name: Diwali`, `Start Date: 2026-11-09`,
  `End Date: 2026-11-09` — no Project row.
- Agent's false claim (verbatim): *"The first Diwali holiday was created for project 12... the holiday creation
  tool requires a project id."*

## Duplicate check

- Duplicate found: No. First finding of a false-capability-*requirement* claim (inventing a parameter the real
  tool doesn't have) on this agent — the inverse of the extensively-documented false-capability-*denial* family.
  Not a duplicate of BUG-CRX-157 (a real, model-enforced required field the tool's own docs under-documented) —
  here the opposite happened: the agent invented a requirement that doesn't exist anywhere, tool or model.
