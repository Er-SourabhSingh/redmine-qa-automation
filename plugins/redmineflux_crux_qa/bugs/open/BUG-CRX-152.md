# Bug Report Template

- Bug ID: BUG-CRX-152
- Production Redmine Issue ID:
- Title: Helpdesk Customers API (`/helpdesk/api/v1/customers.json?q=...`) crashes with a 500 on every
  non-empty search query, because the SQL filter references a `mail` column that doesn't exist on
  `users` — the Support Agent's customer-by-name/login lookup is universally broken
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Fixture: Customer `willow2.belle` ("Willow2 Belle2") genuinely exists (Redmine user id 25,
   `is_helpdesk_customer: true`), linked to project #12 with SLA + Support Level, and is trivially findable on
   the native Customers page (`/rf_customers?search=willow2` returns exactly 1 row).
2. As admin, Support Agent pinned, in a chat that had already established project 12 as context (via "What
   tickets are open in project 12?"): "Create another ticket for a different customer issue: 'VPN disconnects
   every 10 minutes'." — agent correctly asked for the customer name/ID (no fabrication).
3. Replied: "Customer is willow2.belle. No extra description needed." — agent: *"The customer lookup hit a
   server error. Can you provide the numeric customer ID for `willow2.belle`, or do you know their full name so
   I can try another search?"*
4. Retried with the full display name instead of the login: "The customer's full name is Willow2 Belle2." —
   same failure again: *"The customer lookup is hitting a server error... Please contact your Redmineflux
   administrator — the server is returning 500 errors on customer queries."* The agent correctly refused to
   guess a numeric ID rather than risk creating the ticket under the wrong person.
5. Confirmed server-side via `docker logs crux-redmine6-redmine-1`: both attempts produced
   `GET /helpdesk/api/v1/customers.json?...&q=...` → `Completed 500 Internal Server Error` →
   `ActiveRecord::StatementInvalid (PG::UndefinedColumn: ERROR: column "mail" does not exist ...)`.
6. Root-caused in source: `plugins/redmineflux_helpdesk/app/controllers/api/v1/customers_controller.rb`
   line 25 — `scope.where('login LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR mail LIKE ?', q, q, q, q)`.
   `User` has no raw `mail` table column in this Redmine version (confirmed via `\d users` on the Postgres
   container — no such column); email now lives in a separate `email_addresses` table/association, accessed
   through a `mail` **method**, not a column. Every call with a `q` param hits this OR clause and fails. The
   `begin/rescue` wrapped around the `.where(...)` call at lines 23-28 never catches it, because ActiveRecord
   scopes are lazy — the exception only fires later, when the scope is evaluated (`scope.map` on line 34),
   outside the rescue block, so it surfaces as an unhandled 500 every time.

## Expected result

Searching helpdesk customers by name or login (whether via the native UI, which works, or via this API/the
Support Agent's lookup, which shares the same underlying `q`-filtered endpoint) should return matching
customers without error, letting the agent resolve a named customer to proceed with ticket creation.

## Actual result

`/helpdesk/api/v1/customers.json` 500s on **every** non-empty `q` value — not just `willow2.belle` — because the
OR clause unconditionally references a nonexistent `mail` column regardless of what's being searched. This
completely blocks the Support Agent's documented ability to create a ticket for a customer identified by name
or login (the only path offered when a numeric ID isn't known), for every customer, not just one specific
fixture. The agent's own handling of the failure (declining to guess an ID, telling the user to contact an
administrator) was correct and not itself a bug — the defect is entirely server-side.

## Evidence

### Console / log

```
GET "/helpdesk/api/v1/customers.json?page=1&per_page=25&q=Willow2+Belle2"
Processing by Api::V1::CustomersController#index as JSON
Completed 500 Internal Server Error in 10ms (ActiveRecord: 3.5ms (5 queries, 0 cached) | GC: 0.0ms)
FATAL -- : ActiveRecord::StatementInvalid (PG::UndefinedColumn: ERROR:  column "mail" does not exist
LINE 1: ...KE $4 OR firstname LIKE $5 OR lastname LIKE $6 OR mail LIKE ...
                                                             ^
):
```

- Identical failure shape reproduced twice: once searching by login (`willow2.belle`), once by full display
  name (`Willow2 Belle2`) — confirms it's not specific to the search term, it's unconditional on any `q`.
- Native customer search (`/rf_customers?search=willow2`, a separate controller/code path) works correctly and
  returns the customer — confirming the customer data itself is fine and this is isolated to the
  `Api::V1::CustomersController#index` code path the agent's tool calls.
- Source: `plugins/redmineflux_helpdesk/app/controllers/api/v1/customers_controller.rb:25`.
- Verified no `mail` column exists on `users` via `docker exec crux-redmine6-db-1 psql -U postgres -d redmine -c
  "\d users"`.

## Duplicate check

- Duplicate found: No. First finding on the Support Agent / Helpdesk plugin domain's customer-search path.
  Not related in mechanism to BUG-CRX-151 (SLA-pause gap on `add_conversation`) — this is a hard backend crash
  on a completely different tool/endpoint (customer lookup), not a half-implemented business rule.
