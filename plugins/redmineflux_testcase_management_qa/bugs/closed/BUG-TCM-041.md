# BUG-TCM-041

> **CLOSED — 2026-10-07.** Production #122097 (https://flux.zehntech.com/issues/122097) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

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

---

## Production history (synced from #122097 on 2026-10-08)

### 2026-10-06 09:24 UTC — Vaishnavi Bhawsar

Fixed. The underlying behavior of get_testcase/edit_testcase/delete_testcase was already correct (confirmed in the ticket itself) — the problem was API.md describing a response shape these routes don't actually produce, since they pass straight through to Redmine's own issue actions. The documentation now says what actually comes back: an empty-bodied 404 for a missing test case, and a 204 No Content (no echoed body) for a successful edit or delete, with a note on the list endpoint's 401/WWW-Authenticate behavior as well.

For QA: Re-read the "Get Test Case by ID", "Edit Test Case", "Delete Test Case", and "List Test Cases" sections of API.md and confirm they now match the real responses shown in this ticket's own repro steps (404 empty body / 204 No Content / 401 with WWW-Authenticate note). No code behavior changed, so no functional retest is needed beyond a docs read-through.

### 2026-10-06 13:57 UTC — Sourabh Singh

Reopened 2026-10-06 — retested against master 67631e0. GET /get_testcase/999999 still returns 404 with a completely empty body, identical to the original symptom. No commit in this pull touches issues_controller.rb or this route. Not fixed.

### 2026-10-07 05:10 UTC — Vaishnavi Bhawsar

Fixed now — this is a real code change, not just a documentation update.

Earlier, these three test case links (view, save changes, delete) were borrowing Redmine's own built-in page-opening behaviour behind the scenes. That meant if you tried to open a test case that didn't exist, the page just came back empty instead of telling you anything. Save and delete had the same problem — they completed silently with no confirmation message.

Now each of the three gives a clear response:
- Opening a test case that doesn't exist says "Test case not found." instead of coming back blank.
- Opening one that exists shows its full details.
- Saving changes confirms the updated details.
- Deleting one confirms "Issue deleted successfully."

Who is allowed to view, edit, or delete a test case has not changed at all — only the response you get back.

For QA:
1. Try opening a test case id that does not exist (e.g. get_testcase/999999) — you should see a clear "Test case not found." message, not a blank page.
2. Open a real, existing test case the same way — you should see its full details.
3. Edit a test case through this link and confirm you get back a confirmation showing the updated details.
4. Delete a test case through this link and confirm you get back a "deleted successfully" message.
5. Confirm permissions are unchanged — a user without edit/delete rights still cannot edit or delete through these links.

### 2026-10-07 05:51 UTC — Sourabh Singh

Retested on master `9958491` (commit `7cd5704`, which cites this bug by name in its own code comment). All three endpoints now run real plugin actions (issue_testcase#api_show/api_update/api_destroy) instead of aliasing into Redmine core, and match the documented contract exactly: get_testcase returns {"error":"Test case not found."} on a 404 (was empty-bodied), edit_testcase returns 200 + the echoed issue JSON and the edit genuinely persisted (verified via follow-up GET), and delete_testcase returns 200 + {"message":"Issue deleted successfully"} and the issue was genuinely removed (verified via follow-up GET returning 404). Also confirmed authorization is still correctly enforced on edit/delete (403 JSON error for an unprivileged user), matching the commit's claim of not changing who can view/edit/delete. Closing.
