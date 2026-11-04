# Bug Report Template

- Bug ID: BUG-CRX-161
- Production Redmine Issue ID: #127608
- Title: Support Agent's `create_customer` can never succeed — the tool has no `rf_organization_id` parameter
  at all, but the native `User` model unconditionally requires an organization for every helpdesk customer
  (`validates :rf_organization_id, presence: true, if: :is_helpdesk_customer?`), and no follow-up call can work
  around it since the record is never created in the first place
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Create a new helpdesk customer: login 'temp.deleteme', first name Temp,
   last name DeleteMe, email temp.deleteme@example.com." (deliberately using only the fields
   `redmineflux_helpdesk_create_customer`'s own docstring lists as required: login, firstname, lastname, mail).
2. Confirm card correctly showed exactly those 4 fields, matching the tool's documented parameter list.
   Confirmed → genuine server-side failure: *"Validation error: Rf organization cannot be blank. Correct the
   value(s) above and try again."*
3. Root-caused in source:
   - `redmineflux-mcp/src/tools/helpdesk.py:1378-1387` — `create_customer(login, firstname, lastname, mail,
     password=None, language=None, must_change_password=False, send_welcome_email=False)` — **no
     `rf_organization_id` parameter exists anywhere in the signature.**
   - `redmineflux_helpdesk/lib/redmineflux_helpdesk/patches/user_patch.rb:23` —
     `validates :rf_organization_id, presence: true, if: :is_helpdesk_customer?` — every helpdesk customer
     record requires an organization, unconditionally, with no exception.
4. Confirmed there is no workaround: `update_customer` does accept an optional `rf_organization_id` (line 1645),
   but that's irrelevant here since `create_customer` fails before any record exists to update — there's no
   customer id to call `update_customer` against.
5. Native-verified: `/rf_customers?search=temp.deleteme` returns zero results — no record was created.

## Expected result

`create_customer` should either accept an `rf_organization_id` parameter directly (letting the agent create a
fully-valid customer in one call, resolving the organization by name first like every other tool in this suite
does), or the tool's docstring should make clear that customer creation is fundamentally incomplete without a
second step this tool doesn't itself expose a path to.

## Actual result

Every `create_customer` call, regardless of phrasing, fails identically — this isn't a wrong-field or
under-documented-requirement issue (c.f. BUG-CRX-157 on products, BUG-CRX-159 on holidays, both of which have at
least one correct phrasing that works) — there is no way to satisfy this tool's real requirement at all via
chat. The Support Agent's documented "Customers — full CRUD" capability (per its own persona file's static
tool list) is not actually reachable for the Create half.

## Evidence

### Console / log

```
Validation error: Rf organization cannot be blank Correct the value(s) above and try again.
```

- Tool signature (`redmineflux-mcp/src/tools/helpdesk.py:1378-1387`): no `rf_organization_id` parameter.
- Model validation (`redmineflux_helpdesk/lib/redmineflux_helpdesk/patches/user_patch.rb:23`):
  `validates :rf_organization_id, presence: true, if: :is_helpdesk_customer?`.
- Native-verified: no customer record created (`/rf_customers?search=temp.deleteme` → 0 results).

## Duplicate check

- Duplicate found: No. Same general shape as BUG-CRX-157 (tool under-documents a real required field) but
  categorically worse — 157's gap has a working phrasing once the field is supplied manually; this tool has no
  parameter to supply at all, so the gap can never be closed through chat under any phrasing. First finding
  that a documented "full CRUD" capability's Create half is completely unreachable.
