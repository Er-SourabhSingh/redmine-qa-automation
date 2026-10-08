# BUG-TCM-032

> **CLOSED — 2026-10-07.** Production #122074 (https://flux.zehntech.com/issues/122074) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

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

---

## Production history (synced from #122074 on 2026-10-08)

### 2026-10-06 13:57 UTC — Sourabh Singh

Reopened 2026-10-06 — retested against the redmineflux-tcm-ci repo's current master. run-demo-tests.sh line 95 still does `sed -n 's/^RUN_ID=//p'`, the exact same stale pattern this bug describes — the current client tool prints "Run created: id=N ..." instead of a literal "RUN_ID=" line. Not fixed.

### 2026-10-07 05:18 UTC — Vaishnavi Bhawsar

Looked into this again and could not reproduce it on the current code.

The line the reopen note quotes (the old pattern that used to scrape a "RUN_ID=" line) is not in the script anymore — it was already replaced on 2026-10-05, before this was reopened. I re-ran the exact same check live just now, step by step, using the real demo login the script borrows: creating a run came back clean, and the script's own parsing step correctly picked up the new run's number from it — no manual intervention needed. I also double-checked permissions are not silently interfering: this only works when the person the script logs in as is genuinely allowed to execute test cases in that project, which is true for the demo's own login, so there is nothing extra to configure there either.

My best guess is the retest ran against an older copy of this repo rather than the latest one — the fix landed in two commits same-day (one for the actual parsing, one for a Windows/Linux line-ending issue that could silently break the whole script on some setups).

For QA: before retesting, please confirm your copy is fully up to date (a plain `git pull` on this repo, or a fresh clone, right before running `./run-demo-tests.sh`) — if you still see the old failure after that, let me know and I'll pair with you directly on your exact setup, since I cannot reproduce it on a current checkout.

### 2026-10-07 05:29 UTC — Vaishnavi Bhawsar

Moving this to QA with fresh proof it works end to end right now.

I ran the exact same automation step live just now: it created a brand new test run, and the screenshot attached shows that run sitting in the Test Case Management app — real name, real test cases listed under it, nothing mocked. That's the same step this bug said was broken.

For QA: please pull the latest copy of this repo fresh (or re-clone it) before retesting, then run the one-command demo (./run-demo-tests.sh) end to end. It should get all the way through Step 4 and print a working run link at the end, same as the run shown in the attached screenshot.

### 2026-10-07 05:51 UTC — Sourabh Singh

Thanks for the pointer -- confirmed the fix lives in the redmineflux-tcm-ci repo, not the TCM plugin itself. Pulled that repo fresh (7fdb1e0 -> 720815e) and verified the actual code change: run-demo-tests.sh now calls the CLI with --output json and parses the real run_id field, instead of scraping a RUN_ID= text line the CLI no longer prints. Ran the full one-command demo end to end against our test instance: all 4 steps completed with no manual intervention -- Run created: id=34, 6 results ingested, and the expected auto-defect was created. Verified via Rails console that the run and defect genuinely exist (not just a clean console log). Closing.
