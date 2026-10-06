# BUG-TCM-041

- Bug ID: BUG-TCM-041
- Production Redmine Issue ID: #122097
- Title: `get_testcase`/`edit_testcase`/`delete_testcase` all diverge from `API.md`'s documented response shape — they alias straight into Redmine core and inherit core's REST conventions (204/empty-404) instead of the plugin's own JSON contract
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: N/A (direct API call)
- User role: QA Engineer (`qa.engineer`, via API key)
- Date: 2026-10-06

## Summary

`API.md` documents this endpoint's 404 case as returning a JSON error body (the Common Error Schema,
`{"error": "..."}`), matching the plugin's own `rftc_error_handling`-style JSON 404s used elsewhere in the
plugin. In reality, `GET /get_testcase/:testcase_id` returns `HTTP 404` with `content-type: application/json`
but `content-length: 0` — a genuinely empty body, not `{}` or `{"error": "..."}`.

Root-caused via `config/routes.rb`: this route does not go through any plugin controller at all — it aliases
straight into Redmine **core**'s unmodified `IssuesController#show` via a routing-constraint side effect:
```ruby
get 'get_testcase/:testcase_id', to: 'issues#show', via: :get,
      constraints: lambda { |req| req.params['id'] = req.params['testcase_id'] },
      defaults: { format: :json }
```
(`edit_testcase/:testcase_id` and `delete_testcase/:testcase_id` use the identical pattern, aliasing to core
`issues#update`/`issues#destroy`.) Confirmed this is genuine stock Redmine behavior, not a plugin regression, by
hitting core's own native route for the same non-existent id and getting an identical empty-bodied 404:
```
GET /issues/999999999.json  ->  404, content-type: application/json, content-length: 0
```
So the documented error contract in `API.md` is simply inaccurate for these three aliased-to-core routes — they
were never changed to emit the plugin's own JSON error shape, because they never run any plugin controller code
at all.

## Steps to reproduce

1. `curl -i -H "X-Redmine-API-Key: <key>" "http://localhost:3015/get_testcase/999999999"` (non-existent id).
2. `curl -i -X PUT -H "X-Redmine-API-Key: <key>" -H "Content-Type: application/json" -d '{"issue":{"subject":"x"}}' "http://localhost:3015/edit_testcase/<valid id>"`.
3. `curl -i -X DELETE -H "X-Redmine-API-Key: <key>" "http://localhost:3015/delete_testcase/<valid id>"`.

## Expected result

Per `API.md`:
- Step 1: HTTP 404 with a JSON error body, e.g. `{"error": "..."}`.
- Step 2: HTTP 200 with body `{"issue": {..., "subject": "x", ...}}`.
- Step 3: HTTP 200 with body `{"message": "Issue deleted successfully"}`.

## Actual result

All three underlying operations work CORRECTLY (confirmed via follow-up GETs — the edit persists, the delete
actually removes the issue) but every response shape diverges from the documented contract:
- Step 1: HTTP 404, `content-type: application/json`, **`content-length: 0`** — no body at all. An API client
  parsing the body as JSON to extract an error message gets an empty-string parse failure instead.
- Step 2: **HTTP 204 No Content**, no body — not the documented `200` + echoed issue JSON. A client relying on
  the documented response to confirm the new subject (rather than re-fetching) gets nothing to read.
- Step 3: **HTTP 204 No Content**, no body — not the documented `200` + `{"message": "..."}`.

All three match Redmine **core**'s own native stock behavior for the same operations exactly (verified: `GET
/issues/999999999.json` also returns an empty 404; core's JSON `update`/`destroy` return 204 by Rails/Redmine
REST convention) — confirming this isn't a plugin regression, just `API.md` documenting a contract these three
routes never actually implement.

**Extended 2026-10-06 (TC-API-08-02):** the pattern generalizes to a 4th core-aliased route,
`get_testcase.json` (`to: 'issues#index'`). An unauthenticated request correctly returns `401` (not 500,
confirming auth is enforced), but again with `content-length: 0` — no JSON error body, same as the other three.
This response also carries `www-authenticate: Basic realm="Redmine API"`, which could mislead an API client into
believing HTTP Basic is the only accepted auth scheme, when `X-Redmine-API-Key` (confirmed working throughout
this entire API test area) and a `?key=` query param both also work — this header is just Rails/Redmine's
standard default 401 challenge, unrelated to which schemes are actually accepted, but worth correcting in
`API.md` if it doesn't already call this out.

## Evidence

### Console / log

```
$ curl -i -H "X-Redmine-API-Key: $KEY" "http://localhost:3015/get_testcase/999999999"
HTTP/1.1 404 Not Found
content-type: application/json
content-length: 0

$ curl -i -H "X-Redmine-API-Key: $KEY" "http://localhost:3015/issues/999999999.json"
HTTP/1.1 404 Not Found
content-type: application/json
content-length: 0
(identical — confirms this is core Redmine's render_404, not a plugin-introduced regression)
```

## Test case coverage

Found while executing TC-API-01-03 (P1), confirmed to generalize while executing TC-API-02-02 (edit, P2) and
TC-API-02-04 (delete, P2) — all three in `docs/qa/V1-TEST-CYCLE-7.1.0.md`. Each TC's own documented expected
result does not match this group of three endpoints' actual (core-inherited) behavior.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `get_testcase`/empty 404 bodies.

## Production report

Reported to production `ztflux` as #122097 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
