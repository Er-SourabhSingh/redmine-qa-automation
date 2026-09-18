# BUG-HLP-059

- Bug ID: BUG-HLP-059
- Production Redmine Issue ID: #120543 (ztflux) — reopened on production 2026-09-18 after retest (was In QA, moved to Reopen)
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

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120543 checked in)

**PARTIALLY FIXED — both originally-cited root causes are genuinely fixed, but a live end-to-end retest shows a Customer still cannot practically use the API, for two different, newly-surfaced reasons. Kept OPEN. Per explicit user instruction, production issue #120543 has been moved from In QA to Reopen, with a note detailing exactly what still fails and why — see the production issue's own journal for that note; summarized again below.**

**Both original root causes confirmed fixed via source (`app/controllers/api/v1/base_controller.rb`, `lib/redmineflux_helpdesk/patches/application_controller_patch.rb`), each with an explicit `BUG-HLP-059` comment:**
1. Session-cookie auth: the early `request.format = :json` prepend that was silently breaking `find_current_user`'s session-recognition branch for this controller family is removed, and `skip_before_action :check_if_login_required` was added (Redmine core's own login gate was pre-empting this controller's own, more complete `require_api_key_auth` check). Live-verified: `fetch('/helpdesk/api/v1/tickets/336', {credentials:'include'})` as **admin**, no API key at all, now returns a genuine `200` with real ticket data — a complete reversal of the original `401`.
2. Customer self-service API key: `application_controller_patch.rb`'s customer allowlist now includes `'my' => [..., 'show_api_key', 'reset_api_key']`. Live-verified: `alpha.customer` navigating to `/my/api_key` now shows a real key (`ba220d8c71ee...`) instead of silently redirecting away.

**But the bug's own stated "combined effect" — a customer having a working path to the API at all — still does not hold, for two different reasons found while verifying end-to-end:**
- **Session-based access for a customer specifically is blocked by an unrelated filter never updated for this fix**: `restrict_helpdesk_customer_access` (`application_controller_patch.rb`) runs on every request and redirects any already-logged-in customer to `home_path` unless the controller/action is on its explicit allowlist — `api/v1/*` was never added. Live-verified: with `alpha.customer` logged in (session cookie active) and using her own valid API key via header, `fetch('/helpdesk/api/v1/tickets/337', {headers:{'X-Redmine-API-Key':'...'}})` still redirected to `/` (this filter runs before `require_api_key_auth` even gets a chance, since `User.current.logged?` is already true from the session).
- **Key-only access (no session) reaches the API but sees zero tickets, including her own**: fully logged out, then calling the same endpoint with only the header, correctly bypasses the customer-redirect filter (no session means `User.current` is still Anonymous when that filter runs) and reaches the real controller — `GET /helpdesk/api/v1/tickets/337` → genuine `404 {"error":"Ticket not found."}`, and `GET /helpdesk/api/v1/tickets` (list) → `200 {"data":[],"meta":{"total_count":0,...}}`, despite ticket #337 being her own, genuinely-authored ticket (confirmed live via the UI minutes earlier). Likely the same root pattern as BUG-HLP-014 (customers have no real Redmine `Member` row, only `RfProjectCustomer`, so core visibility/scoping checks silently return empty for them) — not independently root-caused via source this session, flagged for follow-up.

**Resolved per explicit user instruction (2026-09-18)**: kept open and reopened on production rather than closed, since the practical customer-API-access outcome the bug was really about is still not resolved — the two new causes are folded into this same bug's scope going forward (not filed as separate bug IDs). Production issue #120543 moved In QA → Reopen with the full explanation (both original causes confirmed fixed; the `restrict_helpdesk_customer_access` allowlist gap and the zero-ticket-visibility gap are what's keeping this open now).

## Notes

- Found while executing `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-199 (REST API customer data isolation) — that TC's own precondition anticipates customers having *some* API access to test isolation against; in practice there is none to test, for the reasons above.
- Severity judged **Medium**: this is not a data-exposure risk (the opposite — it's over-restrictive, blocking documented functionality rather than leaking anything), but it is a real contract mismatch between the Swagger spec's own stated authentication model and the actual implementation, and it makes the plugin's own documented customer-API-access feature completely dead/unreachable.
- Recommend: either implement real session-based authentication for the `/helpdesk/api/v1/*` controllers (so the documented third method actually works), or update the Swagger spec's `info.description` to remove the session-cookie claim; separately, decide whether Customer accounts are meant to have API access at all — if yes, give them a way to obtain a key (restore the "API access key" section on their `/my/account`); if no, update the spec's customer-access clause to say so plainly instead of describing a restricted-but-real access level that no customer can ever reach.
