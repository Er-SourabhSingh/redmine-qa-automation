# BUG-HLP-059

- Bug ID: BUG-HLP-059
- Production Redmine Issue ID: 120543
- Title: The REST API's own documented "existing Redmine browser session" authentication method never actually works — combined with Customer accounts having no self-service way to obtain an API key at all, this makes the Swagger spec's own documented "customers... restricted to their own tickets" API access completely unreachable in practice
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP) + `fetch`
- User role: Administrator and Customer (both tested)
- Date: 2026-09-11

## Steps to reproduce

1. Read `/helpdesk/swagger_spec`'s own `info.description`: it documents three equally-valid authentication methods for the whole API — `X-Redmine-API-Key` header, `key`/`api_key` query param, or "an existing Redmine browser session (already logged in)".
2. While logged in to the Redmine UI as **admin** (a real, active, valid session), call `GET /helpdesk/api/v1/tickets/301` via `fetch(url, {credentials:'include'})` — i.e. relying purely on the session cookie, no API key at all.
3. Separately, log in to the Redmine UI as a real Customer (`alpha.customer`), open `/my/account`, and look for the "API access key" section that every other role (Admin, Agent, the custom "Agent ManageHelpdesk Test" role) has.
4. Also try navigating directly to `/my/api_key` as `alpha.customer`.

## Expected result

Per the API's own documented contract: step 2 should succeed (a valid, logged-in admin session is one of three explicitly-listed valid auth methods) and return the ticket. Per the same spec's own explicit customer note ("Helpdesk customers... are restricted to their own tickets on the rest" — implying real, if restricted, access), a Customer should have some practical way to authenticate to the API to reach their own tickets.

## Actual result

**Session-cookie auth never works, for any role, on any data endpoint tested:**
- Admin's own real, active session (`credentials:'include'`, no API key, confirmed valid — `/my/account` returns 200) → `GET /tickets/301` → `401` `{"error":"Unauthorized. Provide a valid X-Redmine-API-Key header.", ...}`. Retried with an explicit `Accept: application/json` header and with a `.json` extension — same `401` both times.
- The same request with the header (`X-Redmine-API-Key`) or the `?key=` query param, using the same admin account, succeeds normally (`200`, real data) — confirming this is specifically the session-cookie method that is broken, not a general auth failure.
- The customer (`alpha.customer`) got the identical `401` on the same endpoint, using her own real logged-in session — so this isn't a customer-specific restriction either; the whole "session cookie" auth method is simply non-functional for every role on the actual `/helpdesk/api/v1/*` data endpoints.

**Separately, Customer accounts have no self-service path to the two auth methods that DO work:** `/my/account` for `alpha.customer` has no "API access key" section at all (present for Admin and for the Agent-role `manage.helpdesk.test`, confirmed side-by-side); navigating directly to `/my/api_key` as `alpha.customer` silently redirects to the homepage instead of showing/generating a key. No admin-side UI (`/users/6/edit`) exposes or lets an admin set another user's key either.

**Combined effect:** a Customer has no working path to the REST API at all — not via session (broken for everyone), and not via key (never obtainable for this role). The Swagger spec's own documented customer-access clause ("restricted to their own tickets on the rest") describes a capability that cannot be exercised by any real customer on this instance.

## Evidence

### Console / log

- Admin session only, no key: `fetch('/helpdesk/api/v1/tickets/301', {credentials:'include'})` → `401` `{"error":"Unauthorized. Provide a valid X-Redmine-API-Key header.","hint":"Obtain your key from My Account → API access key in Redmine."}`. Same with `Accept: application/json` header added, and with `/tickets/301.json` — both still `401`.
- Same admin, same ticket, `?key=429785a7c55b90eb6febc4cf5582f8387fc74c9c` → `200`, real ticket JSON. Proves the account/ticket/route are all fine; only the session-cookie method fails.
- `alpha.customer`'s own session (`credentials:'include'`, logged in via UI, confirmed via `/rf_helpdesk` loading normally) → `GET /tickets` (list) → `401` same error; `GET /tickets/301` → `401` same error; `GET /tickets/1` (her own ticket) → `401` same error.
- `/my/account` as `alpha.customer`: page renders Firstname/Lastname/Mail/Language/Two-factor only — no "Atom access key" or "API access key" section at all (both present for `admin` and for `manage.helpdesk.test`, an Agent-role account, confirmed on the same instance).
- `fetch('/my/api_key', {credentials:'include'})` as `alpha.customer` → resolves with `response.url` = the site root (silently redirected away), not the key-reveal page.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — distinct from BUG-HLP-058, which is about a reply's visibility after a successful authenticated call, not about authentication itself)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-199 (REST API customer data isolation) — that TC's own precondition anticipates customers having *some* API access to test isolation against; in practice there is none to test, for the reasons above.
- Severity judged **Medium**: this is not a data-exposure risk (the opposite — it's over-restrictive, blocking documented functionality rather than leaking anything), but it is a real contract mismatch between the Swagger spec's own stated authentication model and the actual implementation, and it makes the plugin's own documented customer-API-access feature completely dead/unreachable.
- Recommend: either implement real session-based authentication for the `/helpdesk/api/v1/*` controllers (so the documented third method actually works), or update the Swagger spec's `info.description` to remove the session-cookie claim; separately, decide whether Customer accounts are meant to have API access at all — if yes, give them a way to obtain a key (restore the "API access key" section on their `/my/account`); if no, update the spec's customer-access clause to say so plainly instead of describing a restricted-but-real access level that no customer can ever reach.
