# BUG-TCM-032

- Bug ID: BUG-TCM-032
- Production Redmine Issue ID: #122074
- Title: The documented "one-command automation runner" (`run-demo-tests.sh`) always fails at Step 4 — it parses for a `RUN_ID=` line the current client tool no longer prints
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management / redmineflux-tcm-ci
- Plugin version: 7.1.0 (TCM) / current `redmineflux-tcm-ci` master
- Environment: Docker `localhost:3015` (project `qa-demo`, adapted from the documented `:3093`/`alpha-web` per
  `TCM_BASE_URL`/`TCM_PROJECT_IDENT`/`TCM_PROJECT_ID`/`V2_CONTAINER` env overrides, which the script itself
  supports) — this bug is **not** environment-specific; it reproduces from the script's own internal logic
  regardless of target server.
- Browser: N/A (shell script + Python CLI)
- User role: N/A
- Date: 2026-10-05

## Summary

`redmineflux-tcm-ci/run-demo-tests.sh` — the script the Starter Kit and `docs/AUTOMATION-FOR-QA.html` present as
"the whole job... type this one thing" — reliably fails at Step 4 ("sending the results into the Test Case
Management app") with `✗ Could not create a test run.`, even though the underlying bootstrap call to TCM
**succeeds** (confirmed server-side: a real Run is created, HTTP 201). The script's own output-parsing is broken:
it greps the bootstrap subprocess's stdout for a line starting with `RUN_ID=`, but the currently-shipped `client`
module prints `Run created: id=N suites=[...] reused=False` instead — a format that has no `RUN_ID=` line at all.
Likely a regression from the recent `client` → `redmineflux_tcm` package migration (the PR that replaced most of
`client/__main__.py`) not being matched by an update to this script's parsing logic.

## Steps to reproduce

1. With a reachable TCM instance and a valid API key obtainable for the configured `TCM_LOGIN`, run:
   `./run-demo-tests.sh` (or with env overrides, e.g. `TCM_BASE_URL=... TCM_PROJECT_IDENT=... V2_CONTAINER=...
   ./run-demo-tests.sh`).
2. Observe Steps 1–3 complete successfully (tools ready, connected, demo store's pytest suite runs: 4 passed, 1
   failed on purpose, 1 skipped).
3. Observe Step 4.

## Expected result

- Per `run-demo-tests.sh`'s own `cat <<EOF` block and the Starter Kit/automation guide, Step 4 should print
  `✓ Ingested N results (N matched, M unmatched)` and a final run URL to open.

## Actual result

- Step 4 instead prints `✗ Could not create a test run. See the messages above.` and exits 1 — **even though the
  bootstrap call it just made genuinely succeeded.**
- Direct reproduction of the exact subprocess call the script makes:
  ```
  $ .venv/bin/python -m client --base-url http://localhost:3015 bootstrap --project 1 --name "diag check 2" --suites Authentication "Shopping Cart & Checkout"
  DeprecationWarning: `client` is deprecated; use `redmineflux-tcm` / `python -m redmineflux_tcm` (removed in 0.2.0).
  INFO httpx: HTTP Request: POST http://localhost:3015/testcase_ci/bootstrap_run.json "HTTP/1.1 201 Created"
  Run created: id=9 suites=[1, 2] reused=False
  ```
  — a genuine Run (id=9) was created (confirmed in the TCM UI). But `run-demo-tests.sh`'s parsing line,
  `RUN_ID="$(printf '%s\n' "$BOOT_OUT" | sed -n 's/^RUN_ID=//p' | tail -n1)"`, finds nothing matching `^RUN_ID=`
  in this output, so `RUN_ID` is empty and the script treats a successful bootstrap as a failure.
- Manually completing the equivalent of Step 4b with the real run id confirms the rest of the pipeline **does**
  work once this parsing gap is bridged: `python -m client ... ingest --run 9 ...` → `Ingested 6 results (6
  matched, 0 unmatched)`, and the expected auto-defect (`CI failure: test_apply_discount_code [...]`, issue #22)
  was created exactly as documented.
- Two further issues were hit and resolved while isolating this (both genuine deployment/environment gaps, not
  code defects, and not the subject of this bug): (a) the TCM container needed restarting to pick up a routes.rb
  change after a `git pull`, since Rails does not hot-reload routes in `RAILS_ENV=production`; (b) a pending
  plugin migration (`20261003000000_add_duration_ms_to_issue_status_results.rb`) had never been run on this
  container, causing the ingest endpoint to 500 with `ActiveModel::UnknownAttributeError: unknown attribute
  'duration_ms'` until `rake redmine:plugins:migrate` was run.

## Evidence

### Screenshot

![Run #9 showing ingested results (Passed/Skipped/Untested) and Defect Count: 1, proving the underlying bootstrap+ingest pipeline works once the script's RUN_ID parsing is bridged manually](../../screenshots/BUG-TCM-032/ci-ingest-result-run-9.png)

### Console / log

```
Step 2 of 4 — connecting to the Test Case Management app
   ✓ connected to http://localhost:3015

Step 3 of 4 — running the demo store's automated tests
   (some tests pass, one fails on purpose — that is expected)
....Fs    [100%]
1 failed, 4 passed, 1 skipped in 0.32s
   ✓ tests finished, results saved

Step 4 of 4 — sending the results into the Test Case Management app
DeprecationWarning: `client` is deprecated; use `redmineflux-tcm` / `python -m redmineflux_tcm` (removed in 0.2.0).
INFO httpx: HTTP Request: POST http://localhost:3015/testcase_ci/bootstrap_run.json "HTTP/1.1 201 Created"
   Run created: id=8 suites=[1, 2] reused=False

✗ Could not create a test run. See the messages above.
```

## Test case coverage

Found while executing step 5 of the overall handoff ask ("try the automation: the one-command runner"), outside
the `docs/qa/V1-TEST-CYCLE-7.1.0.md` 202-case cycle (this corresponds to area **CI**, deferred to the Oct 21 V2
cycle, but was tested now per explicit direction to cover it alongside the 202-case cycle).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the automation runner script.

## Production report

Reported to production 2026-10-05 as **#122074** (`ztflux`), tracker Bug, Priority High, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity High-severity, Defect
priority High. Per explicit user instruction, not linked to any production Test Case/Run.
