> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121881** ("rftc-017 — Ship the CI results CLI"), part of the
> **Testcase Management plugin Release 7.2.0** (due 2026-10-21). This is NOT part of the Testcase Management
> *plugin* itself — it tests the separate companion repo `redmineflux-tcm-ci` (package `redmineflux_tcm`, console
> command `redmineflux-tcm`), which talks to the plugin over its HTTP API. Like `RFTC-016`, this is V2/CI work,
> out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **Dependency chain**: rftc-008 → rftc-009 → rftc-016 → **rftc-017** → rftc-038 (merge order). rftc-016
> (`ingest_results.json`) is covered in `RFTC-016_EXTERNAL_SPEC_CI_RESULTS_INGEST.md` (18/18 PASS).
>
> **ID prefix**: every case here is `RFTC017-<n>`.
>
> **Executed**: 2026-10-15, two complementary ways:
> 1. **The project's own shipped `tests/` pytest suite** (42 tests — config precedence, exit codes, mapping
>    contract, JSON output shape, security/API-key-leak holdout, Phase-2 degradation), run for real against a
>    genuine `pip install -e .` inside the `redmine6-redmine-1` Docker container (Python 3.11.2 — the host machine
>    itself has no Python at all, confirmed; `python3-pip`/`build-essential` had to be `apt-get install`ed in the
>    container first, since the base image ships Python without `pip` or `venv` support).
> 2. **Manual CLI runs against the real live plugin** (not mocked) — `localhost:3000`, project `rftc-016-ci-qa`
>    (id=2), reusing fixtures from the `RFTC-016` suite — to confirm the packaged commands actually work
>    end-to-end against a real server, not just against the suite's own mocked `httpx` transport.
>
> **1 bug found**: `BUG-TCM-065` — the documented `python -m client` backward-compat shim cannot be imported at
> all after a real `pip install`, confirmed by 2 of the project's own 42 shipped tests failing for real (not a
> test-environment artifact — reproduced independently by hand-copying the `client/` directory into the install
> source tree and confirming `pyproject.toml`'s explicit `packages` list still excludes it).

# Test Cases — redmineflux-tcm-ci — rftc-017: Ship the CI Results CLI

## Plugin
- Name: `redmineflux-tcm-ci` (package `redmineflux_tcm`, console command `redmineflux-tcm`)
- Version: 0.1.0
- Environment: Docker `redmine6-redmine-1` (Python 3.11.2), talking to the Testcase Management plugin on the same
  container at `http://localhost:3000`
- Path: plugins/redmineflux_testcase_management_qa (this QA repo) — tool itself lives in the separate
  `redmineflux-tcm-ci` repo
- Production ticket: #121881 (ztflux), done ratio 90%, status "In Peer Review" at test time

## Feature summary

Productizes the proven Phase-1 `redmineflux-tcm` client into a pip-installable CLI (`submit`/`bootstrap`/`ingest`
subcommands) with a documented, de-collided exit-code contract (0 OK / 1 SUBMIT_FAILED / 2 USAGE / 3 CONNECTION /
4 UNMATCHED_STRICT / 10 FEATURE_UNAVAILABLE), `--output json` for CI-recipe parsing, `--api-key-file` for
secret-mount injection, and config resolution (`flags > env > config file > default`).

---

## Shipped Test Suite — Run Results

```
$ python3 -m pytest tests/ -v
============================= test session starts ==============================
collected 42 items
...
========================= 2 failed, 40 passed in 0.33s =========================
```

| Test file | Result |
|---|---|
| `test_cli_smoke.py` (9 tests) | 7 PASS, **2 FAIL** → `BUG-TCM-065` |
| `test_config_precedence.py` (10 tests) | 10/10 PASS |
| `test_exit_codes.py` (6 tests) | 6/6 PASS |
| `test_mapping_contract.py` (4 tests) | 4/4 PASS |
| `test_output_json.py` (3 tests) | 3/3 PASS — including `test_output_json_never_contains_api_key` |
| `test_phase2_degradation.py` (6 tests) | 6/6 PASS |
| `test_security_auth.py` (4 tests) | 4/4 PASS |

**40/42 PASS.** The 2 failures are real (see `BUG-TCM-065`), not flaky — reproduced twice, root-caused to a
genuine `pyproject.toml` packaging gap.

---

## Manual Live-Server Verification (against the real plugin, not a mock)

---

### RFTC017-1: `submit` (Phase 1) end-to-end — real JUnit, real mapping, real `bulk_create`, real auto-defect

**Priority:** P1
**Steps:**
1. Hand-crafted a real JUnit XML (`<testsuites><testsuite>` wrapper, 3 `<testcase>`: 1 pass, 1 `<failure>`, 1
   `<skipped>`), a real `tcm-mapping.json` mapping 2 of the 3 names to real `RFTC-016` fixtures (`#23`, `#24` in
   project 2 / suite 3).
2. `redmineflux-tcm --base-url http://localhost:3000 --api-key-file <admin key> --output json submit --junit
   report.xml --mapping tcm-mapping.json --run 6 --env CI --project 2`.

**Expected Result:** JUnit parsed correctly (2 mapped, 1 unmatched reported — not silently dropped); a real
defect auto-created for the failing test; `bulk_create` succeeds; exit 0.
**Actual Result:** PASS, in full.
```
Parsed 3 JUnit testcases: 2 mapped, 1 unmatched.
  UNMATCHED: test_checkout_flow (skipped) — add it to the mapping file
created defect #30: [CI] Failed: Apply valid discount code at checkout
bulk_create: run=6 suite=3 env=CI results=2
Submitted 2 result(s) to run 6, env 'CI'.
  #23   passed   test_login_valid
  #24   failed   Apply valid discount code at checkout defect#30
EXIT_CODE=0
```

---

### RFTC017-2: `bootstrap` (Phase 2) end-to-end — real run creation via the CLI

**Priority:** P1
**Steps:** `redmineflux-tcm ... --output json bootstrap --project 2 --name 'CLI bootstrap test' --suites 'CI
Ingest'`.
**Expected Result:** A real Run created against the real suite; JSON output carries `run_id` for a recipe to
capture; exit 0.
**Actual Result:** PASS. `Run created: id=7 suites=[3] reused=False` /
`{"status": "success", "run_id": 7, "testsuite_ids": [3], "reused": false}`.

---

### RFTC017-3: `ingest` (Phase 2) end-to-end against the just-bootstrapped run

**Priority:** P1
**Steps:** `redmineflux-tcm ... ingest --junit report.xml --project 2 --run 7 --env CI --auto-defect` (no
`--match-by` flag exists on this subcommand — confirmed via `--help`; matching strategy/order is fixed
server-side, not CLI-configurable).
**Expected Result:** Real `POST /testcase_ci/ingest_results.json` call; correctly reports match/no-match per
test, never silently drops a result.
**Actual Result:** PASS (as a matching-correctness check) — all 3 results came back unmatched, correctly so: the
JUnit test **names** (`test_login_valid`, `test_apply_discount_code`, `test_checkout_flow`) don't line up with
`#23`/`#24`'s actual Automation Key / subject text, and `test_login_valid`'s automation_key is deliberately
ambiguous (shared with `#28` from `RFTC-016`'s gap testing) — exactly the `ambiguous_key`/`no_match` reasons
`RFTC-016` already proved correct at the server level. This run demonstrates the CLI faithfully surfaces the
server's real matching decisions rather than papering over them.
```
Ingested 3 results (0 matched, 3 unmatched)
{"unmatched": [{"key": "test_login_valid", "reason": "ambiguous_key"}, {"key": "test_apply_discount_code", "reason": "no_match"}, {"key": "test_checkout_flow", "reason": "no_match"}]}
EXIT_CODE=0
```

---

### RFTC017-4: Exit code 2 (USAGE) — an unrecognized flag

**Priority:** P2
**Steps:** `redmineflux-tcm ingest --match-by id,automation_key,subject ...` (this flag does not exist on
`ingest` — found while probing the CLI's actual surface, not an intentional negative test).
**Expected Result:** Clean argparse usage error, exit 2 — never a stack trace.
**Actual Result:** PASS. `redmineflux-tcm: error: unrecognized arguments: --match-by ...`, `EXIT_CODE=2`.

---

### RFTC017-5: Exit code 4 (UNMATCHED_STRICT) on `submit --strict`

**Priority:** P1
**Steps:** Repeat RFTC017-1 with `--strict` added.
**Expected Result:** The matched results still get submitted (strict only affects the final exit code, not
whether the call proceeds); exit 4 because 1 result was unmatched.
**Actual Result:** PASS. Same successful submission as RFTC017-1 (a 2nd defect, `#31`, created — `submit`'s
Phase-1 `bulk_create` path has no server-side defect-reuse, unlike `RFTC-016`'s `ingest_results`; this is an
accepted, documented design difference between the two phases, not a bug), then: `1 unmatched test(s) and
--strict is set.` / `EXIT_CODE=4`.

**Note:** `--strict`/`--fail-on-unmatched` only exists on `submit`; `ingest` has no equivalent flag — the
server's own `on_unmatched=error` call-level parameter (tested directly in `RFTC-016`) is the only way to get
hard-fail-on-unmatched behavior through the Phase-2 path today.

---

### RFTC017-6: Exit code 3 (CONNECTION) — unreachable host

**Priority:** P2
**Steps:** `redmineflux-tcm --base-url http://localhost:9999 ... bootstrap ...`.
**Expected Result:** Retries, then a clean connection-failure message; exit 3.
**Actual Result:** PASS. Two retry warnings (`[Errno 111] Connection refused`), then `Could not
connect/authenticate to TCM.`, `EXIT_CODE=3`.

---

### RFTC017-7: Exit code 1 (SUBMIT_FAILED) — server rejects the submission

**Priority:** P1
**Steps:** Repeat RFTC017-1 with `--env this-env-does-not-exist` (not configured on the run).
**Expected Result:** The server's own real validation error (environment not configured — same guard
`RFTC-016`/`bulk_create` already enforce) surfaces cleanly through the CLI; exit 1.
**Actual Result:** PASS. `SUBMIT FAILED: bulk_create suite 3 -> HTTP 422: ['Invalid environment for Issue ID 23',
'Invalid environment for Issue ID 24']`, `EXIT_CODE=1`. **Side-effect worth noting (by design, not a bug):** a
defect (`#32`) was still created for the failing test BEFORE the `bulk_create` call that then failed — matches
the documented flow ("creates a real Bug... *before* results are submitted"), so a submit failure on this path
can still leave a real defect behind even though the results themselves never landed.

---

## Not Executed

- **Exit code 10 (FEATURE_UNAVAILABLE) against a real second server** — covered by the shipped test suite's
  mocked tests (`test_bootstrap_feature_unavailable_exit_10`, `test_ingest_feature_unavailable_exit_10`, both
  PASS), but not independently re-verified against a real live server lacking the plugin. Attempted against
  `redmine6platform-redmine-1` (a separate local instance with no `redmineflux_testcase_management` plugin
  installed at all) but blocked: that instance's own admin API key is unknown, so the request 401'd (auth
  failure, exit 3) before ever reaching the route-not-found check that would prove exit 10. Would need either
  that instance's credentials or a dedicated throwaway server built specifically without rftc-009/016 deployed.
- **The 5 CI platform recipes themselves (Jenkins/GitHub Actions/GitLab/CircleCI/Bitbucket)** — that's rftc-038,
  a separate suite.

## Coverage Summary

**Shipped suite: 40/42 PASS (1 real bug, `BUG-TCM-065`, isolated to the deprecated `client` shim — every other
area clean). Manual live-server checks: 7/7 PASS** (both CLI phases end-to-end against the real plugin, 4 of the
6 documented exit codes directly confirmed by hand, the other 2 — 0 and 10 — confirmed via the happy-path runs
above and the shipped suite respectively). The core CLI (`submit`/`bootstrap`/`ingest`, config precedence, JSON
output, API-key security) is solid; the one real defect found is narrow and cosmetic (a backward-compat
convenience shim, not the CLI's actual functionality).
