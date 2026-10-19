# BUG-TCM-069

- Bug ID: BUG-TCM-069
- Production Redmine Issue ID: #123980 (https://flux.zehntech.com/issues/123980) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123950 ("CI ingest unmatched and validation handling") in Run #612, environment Win + Chrome + Ver6.
- Title: CI ingest's `on_unmatched: "skip"` option is accepted but never implemented — produces an identical response to `"report"`, contradicting its own documented behavior
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-7.1.0, pre-7.2.0 — rftc-016/017/020/021/038/042/043/044 merged)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2)
- Browser: N/A (API endpoint, verified via curl)
- User role: Admin
- Date: 2026-10-19

## Steps to reproduce

1. `POST /testcase_ci/ingest_results.json` with one matched result and one unmatched `key`, `on_unmatched:
   "report"` (the default).
2. Repeat the exact same payload, only changing `on_unmatched` to `"skip"`.
3. Diff the two responses byte-for-byte.

## Expected result

Per the feature's own spec (`backlog/planning/rftc-016-feature-ci-results-ingest.md`, Implementation Notes
"`on_unmatched` semantics" and Edge Case 2): `"skip"` should behave differently from `"report"` — *"unmatched are
omitted from the response's error accounting (logged only)"* — i.e. the unmatched entries should not appear in
the response's `unmatched` array / `counts.unmatched` the same way `"report"` shows them; the pipeline opted in
to treating those keys as "not tracked in TCM, don't flag them."

## Actual result

`"skip"` produces a **byte-for-byte identical response** to `"report"` — same `unmatched` array, same
`counts.unmatched` value, same `message` text. The option is accepted (it passes the value whitelist) but has
zero observable effect anywhere in the response.

Confirmed via direct comparison, same payload, only `on_unmatched` changed:

```
$ curl ... -d '{"run_id":6,"environment":"CI","match_by":["id"],"on_unmatched":"report","results":[{"key":"24","status":"passed"},{"key":"999999","status":"failed"}]}'
{"status":"success","message":"Ingested 2 results (1 matched, 1 unmatched)", ...,
 "counts":{"passed":1,...,"unmatched":1}, "unmatched":[{"key":"999999","status":"failed","reason":"no_match"}], ...}

$ curl ... -d '{"run_id":6,"environment":"CI","match_by":["id"],"on_unmatched":"skip","results":[{"key":"24","status":"passed"},{"key":"999999","status":"failed"}]}'
{"status":"success","message":"Ingested 2 results (1 matched, 1 unmatched)", ...,
 "counts":{"passed":1,...,"unmatched":1}, "unmatched":[{"key":"999999","status":"failed","reason":"no_match"}], ...}
```

Identical in every field.

## Root cause

`app/services/ci_result_ingest_service.rb`:
- `normalize_on_unmatched` (line 126) whitelists `%w[report error skip]`, so `"skip"` is accepted and stored in
  `@on_unmatched`.
- The ONLY place `@on_unmatched` is actually read again is line 88: `if @on_unmatched == 'error' && @unmatched.any?`.
- `success_payload` (line 466) unconditionally sets `counts['unmatched'] = @unmatched.size` (line 470) and
  `unmatched: @unmatched` (line 489) in the response — there is **no branch anywhere checking for
  `@on_unmatched == 'skip'`** to omit or alter this.

In short: `"skip"` is parsed and stored, but the only consumer of `@on_unmatched` in the entire service is the
`"error"` check. The `"skip"` codepath that should change `success_payload`'s output was never written.

## Suggested fix

In `success_payload` (or the matching pass that populates `@unmatched`), branch on `@on_unmatched == 'skip'` to
either omit matched-nothing entries from the response's `unmatched` array / `counts.unmatched` entirely, or at
minimum mark them distinctly (e.g. a `skipped_unmatched` count/array) so a pipeline can tell the two modes apart
— per the spec's own wording, these entries should be "logged only," not surfaced in the response the same way
`"report"` surfaces them.

## Evidence

### Console / log

See the two side-by-side `curl` responses above — identical except for input `on_unmatched` value, proving no
behavioral branch exists for `"skip"`.

Code references:
- `app/services/ci_result_ingest_service.rb:126` — `normalize_on_unmatched` accepts `"skip"` into the whitelist
- `app/services/ci_result_ingest_service.rb:88` — the only other place `@on_unmatched` is read (only checks `'error'`)
- `app/services/ci_result_ingest_service.rb:466-491` — `success_payload`, which unconditionally includes
  `unmatched`/`counts.unmatched` with no `skip`-mode branch

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers `on_unmatched` behavior for this
  endpoint.
