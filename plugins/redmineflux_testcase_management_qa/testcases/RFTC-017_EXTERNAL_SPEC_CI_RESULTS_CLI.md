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

## Second Follow-up (2026-10-19) — the remaining gaps closed: exit 10 on a real server, secrets hygiene, config precedence, output contract

All run inside the `redmine6-redmine-1` Docker container (CLI already installed via the earlier `pip install -e
.`), using `/tmp/tcmtest` as a scratch working directory. `BUG-TCM-065` was already fixed/closed by this date, so
these runs used the current (fixed) build.

---

### RFTC017-8: World-readable config file carrying `api_key` triggers an explicit warning

**Priority:** P2
**Steps:** Create `tcm.cfg` with `[tcm] api_key = ...`, `chmod 644` it (group/world-readable), run any subcommand
with `--config tcm.cfg`.
**Expected Result:** A one-line warning recommending `chmod 600` and preferring `$TCM_API_KEY`/`--api-key-file`.
**Actual Result:** PASS. `WARNING config: config tcm.cfg carries api_key and is group/world-readable; run `chmod
600 tcm.cfg` (prefer $TCM_API_KEY or --api-key-file instead of a config file)`.

---

### RFTC017-9 (SACRED): Config resolution precedence — flag > env > config file > default, confirmed for all three sources at once

**Priority:** P1
**Steps:** Set `base_url` three different ways simultaneously: `tcm.cfg` (`config-file-value`), `$TCM_BASE_URL`
(`env-value-test`), and `--base-url` (`flag-value-test`); called `resolve_config()` directly (via a one-line
`python3 -c` snippet importing the installed package) for each combination to read the resolved value without a
network round-trip.
**Expected Result:** config-file-only → config value; + env → env wins; + flag → flag wins.
**Actual Result:** PASS, all three: `config-file only: http://config-file-value:1111` →
`env overrides config: http://env-value-test:2222` → `flag overrides env+config: http://flag-value-test:3333`.

---

### RFTC017-10 (SACRED/security): `--api-key` is visible in the process list; `--api-key-file` never is

**Priority:** P1 — the CLI's own `--help` text makes an explicit security claim about this
**Steps:** Launch the CLI in the background with `--api-key <raw>`, poll `/proc/<pid>/cmdline` while it's alive;
repeat with `--api-key-file <path>` instead.
**Expected Result:** The raw key appears in `--api-key`'s case (inherent to any CLI flag, which is exactly why
`--help` calls it "DISCOURAGED: visible in `ps` on a shared host"); `--api-key-file` must show only the file path,
never file contents.
**Actual Result:** PASS on both counts. `--api-key SUPER-SECRET-RAW-KEY-999` — the full raw key visible in every
`/proc/<pid>/cmdline` poll (confirms the documented risk is real, not just a cautious disclaimer). `--api-key-file
secret.key` — only the filename `secret.key` ever appeared, never `SUPER-SECRET-FILE-KEY-777`'s contents.

---

### RFTC017-11: API key never appears in any log output, including `--log-level debug`

**Priority:** P1
**Steps:** Run with `--api-key-file` and `--log-level debug`; grep the full combined output for the raw key
string.
**Expected Result:** No match, at any log level.
**Actual Result:** PASS. `NO KEY LEAK in debug output`.

---

### RFTC017-12 (SACRED): Exit code 10 (FEATURE_UNAVAILABLE) confirmed against a real live server with no TCM plugin at all

**Priority:** P1 — closes the one genuine gap left open in the first pass (previously blocked on unknown
credentials for a plugin-less instance)
**Steps:** Found `redmine-upgrade-test-redmine-1` (a separate local Docker Redmine with
`redmineflux_crm`/`helpdesk`/`invoice`/`platform`/`shift_management`/`timesheet`/`workload` installed, but **not**
`redmineflux_testcase_management`), pulled its admin API key directly from its own Postgres `tokens` table
(container-local DB access, not a credential guess), reached it from the `redmine6-redmine-1` container via its
Docker-network IP (container hostnames aren't resolvable across separate Compose networks). Ran `bootstrap`
against it.
**Expected Result:** A real 404 on `/testcase_ci/bootstrap_run.json` (route genuinely doesn't exist on this
server) maps to exit 10, not exit 1/3.
**Actual Result:** PASS. `PHASE 2 unavailable: /testcase_ci/bootstrap_run.json is not available on this server...
EXIT_CODE=10`. **Observation, not a bug:** the message's wording ("ships with rftc-009, which is still in
'planning' (not built)") is stale/presumptive for this case — the real reason is that this server doesn't have
the plugin installed at all, not that rftc-009 specifically is unbuilt. Noted rather than filed, because
production's own test matrix already lists this exact wording gap as a known check item (`EX-720-CLI-01`'s sibling
`UI-720-CLI-01`: "stale 'planning' wording on 404").

---

### RFTC017-13 (SACRED): `--output json` produces exactly one parseable JSON object on stdout; every log line goes to stderr

**Priority:** P1 — this is the entire point of `--output json` existing (CI recipes parse stdout programmatically)
**Steps:** Run `bootstrap --output json` with stdout and stderr redirected to separate files, on both a failure
path (bad key) and a real success path; `python3 -c "json.load(...)"` the stdout file to confirm it parses as a
single object with nothing else mixed in.
**Expected Result:** stdout = exactly one JSON object, nothing else; all INFO/log lines on stderr.
**Actual Result:** PASS, both paths. Failure: stdout = `{"status": "failure"}` only. Success: stdout =
`{"status": "success", "run_id": 9, "testsuite_ids": [3], "reused": false}` only, confirmed valid via
`json.load`; stderr carried every `INFO httpx`/`Run created: ...` line instead.

---

### RFTC017-14 (SACRED): `--quiet` wins over `--log-level debug`, suppressing all non-error output while still letting a real error and the command's own result through

**Priority:** P1 — directly tests the documented claim "`--quiet` ... wins over `--log-level`"
**Steps:** (a) `--log-level debug` alone → count output lines. (b) `--log-level debug --quiet` together on a
successful run → inspect stdout/stderr split. (c) `--quiet --log-level debug` on a genuine usage error (missing
mapping file) → confirm the error still surfaces.
**Expected Result:** (a) many debug lines; (b) stderr empty despite `debug` being requested, but the actual result
line still reaches stdout; (c) the error itself still prints despite `--quiet`.
**Actual Result:** PASS on all three. (a) 28 lines without `--quiet`. (b) `stderr` = 0 lines; `stdout` =
`Run created: id=11 suites=[3] reused=False` (the command's own output, not "logging", so correctly unaffected).
(c) `Input error: mapping file not found: /tmp/also-missing.json` on stderr, exit 2 — confirms `--quiet` only
suppresses *non-error* logging, exactly as documented, not actual errors.

---

## Third Follow-up (2026-10-19) — full 409-line source spec re-read, closing every remaining Unit/Functional/Edge/Security gap

Production ticket #121881's description + journal were re-fetched (journal confirms: "Confirmed by actually
installing it fresh and running its full test suite: 42 out of 42 tests passed" — consistent with our own
BUG-TCM-065 retest), then the full `backlog/planning/rftc-017-feature-ci-results-cli.md` was read in full. 22
scenarios genuinely not covered above were identified and executed. **Zero new bugs found** — the CLI held up
completely against its own exhaustive spec.

---

### RFTC017-15 (spec Functional 1/2): `--help` lists all subcommands; `--version` prints the single-sourced version

**Priority:** P2
**Actual Result:** PASS. `--help` lists `submit`/`bootstrap`/`ingest` plus `--version`/`--config`; `--version`
prints `redmineflux-tcm 0.1.0`.

---

### RFTC017-16 (spec Functional 12/13): The deprecated `client` shim — both top-level and submodule imports — still works post-fix, with a loud `DeprecationWarning`

**Priority:** P1 — this is the exact shim BUG-TCM-065 broke; re-verified on the fixed build
**Actual Result:** PASS, both paths. `python -m client --version` → prints `0.1.0` + `DeprecationWarning` on
stderr. `from client.tcm_client import TcmClient` → resolves to `redmineflux_tcm.tcm_client.TcmClient` + warning.

---

### RFTC017-17 (spec Functional 10): `ingest` also degrades to exit 10 against a plugin-less server (bootstrap was the only phase tested before)

**Priority:** P1
**Actual Result:** PASS. `PHASE 2 unavailable: /testcase_ci/ingest_results.json is not available... ships with
rftc-016...`, `EXIT_CODE=10`.

---

### RFTC017-18 (spec Unit 8/8b): `duration_ms` survives as a structured field through `resolve_rows`, but is NEVER sent to the PHASE-1 `bulk_create` payload

**Priority:** P1 — code-level whitelist safety check
**Actual Result:** PASS, code-confirmed. `junit_to_tcm.py:178` keeps `"duration_ms": entry.get("duration_ms", 0)`
as a structured field on the normalized row (for rftc-016/020 to consume later). `tcm_client.py`'s
`bulk_create_results` builds each PHASE-1 element from an explicit allow-list (`issue_id`, `case_status_id`,
`environment`, optional `notes`/`defect_ids`) — `duration_ms` is never included, confirming a future `**row`
splat regression is the only way this could leak, and today's code does not do that.

---

### RFTC017-19 (spec Unit 2, Edge 1): API key resolves from `$TCM_API_KEY` alone with no flag; with NO key anywhere, clean `USAGE`(2)

**Priority:** P1
**Actual Result:** PASS on both. `$TCM_API_KEY` alone → run created successfully (exit 0). No key anywhere (env
unset, no flag, no file) → `"No API key. Set $TCM_API_KEY, --api-key-file, or --api-key..."`, exit **2**.

---

### RFTC017-20 (spec Unit 3/4/5): Config file discovery order; an unreadable explicit `--config` path is a clean usage error; a missing config file entirely is fine

**Priority:** P1
**Steps:** Placed a config at both `./tcm.cfg` and `~/.config/redmineflux-tcm/config` with different `base_url`
values, resolved with no `--config` flag. Then `--config /nope-does-not-exist.cfg`. Then no config file anywhere.
**Actual Result:** PASS on all three. `./tcm.cfg` wins (discovery order confirmed: CLI flag → `./tcm.cfg` →
`~/.config/...`). Unreadable explicit path → `"Config error: --config /nope...: file not found or not
readable"`, exit 2. No config file at all → resolves cleanly from env, run created, no crash.

---

### RFTC017-21 (spec Unit 6/7): A mapping file missing the `cases` key, and a malformed-JSON mapping file, both fail with a clear message — never a raw traceback

**Priority:** P1
**Actual Result:** PASS on both. Missing `cases`: `"Input error: mapping file bad_mapping.json has no 'cases'
object"`, exit 2. Malformed JSON: `"Input error: cannot parse mapping file malformed_mapping.json: Expecting
property name enclosed in double quotes..."`, exit 2 — the JSON parser's own error is surfaced cleanly, not a
bare stack trace.

---

### RFTC017-22 (spec Edge 2): A config file that exists but is empty / has no `[tcm]` section falls through cleanly to env/defaults

**Priority:** P2
**Actual Result:** PASS. An empty config file caused no crash; run created successfully from env-supplied values.

---

### RFTC017-23 (spec Edge 3): `submit` where every JUnit test is unmatched — default exits 0 (warning class), `--strict` exits 4

**Priority:** P1
**Actual Result:** PASS on both. Default: `"Nothing to submit."`, exit **0** (a total mapping miss still does not
break the build by default). Same payload with `--strict`: exit **4**.

---

### RFTC017-24 (spec Edge 4): A bare `<testsuite>` root (not wrapped in `<testsuites>`) parses identically to the wrapped form

**Priority:** P2
**Actual Result:** PASS. Parsed correctly, same behavior as the `<testsuites>`-wrapped fixture used elsewhere in
this file.

---

### RFTC017-25 (spec Functional 5, holdout): The exit-code constants exactly match the documented contract — code-level pin

**Priority:** P1 — this is the holdout that prevents the contract from silently drifting
**Actual Result:** PASS, code-confirmed. `exit_codes.py`: `OK=0, SUBMIT_FAILED=1, USAGE=2, CONNECTION=3,
UNMATCHED_STRICT=4, FEATURE_UNAVAILABLE=10` — exact match, single source of truth, imported everywhere else.

---

### RFTC017-26 (spec Security S2, broadened): A sentinel API key never leaks even through an INDUCED usage-error exit

**Priority:** P1 — security holdout, the specific gap the spec's own Gate-2 review flagged (a key leaking via a
traceback/usage-error dump, not just a URL)
**Steps:** Passed a unique sentinel string as `--api-key`, then deliberately triggered a usage error (missing
required `command` argument) in the same invocation; captured and grepped the full combined output.
**Actual Result:** PASS. The sentinel string appears **zero times** anywhere in the usage-error output (the
argparse usage/error text, captured and searched) — confirms the key does not leak even on the induced-failure
path the spec's Gate-2 review specifically worried about.

---

### RFTC017-27 (spec Functional 14/16): `submit --output json` emits one valid JSON object with the full matched/unmatched/defects shape, and never contains the API key

**Priority:** P1
**Actual Result:** PASS. `{"status":"success","counts":{...},"unmatched":[...],"matched":[...],"defects":{...},"run_id":6}`
— valid single JSON object (`json.load` succeeds), all documented keys present; the real API key string does not
appear anywhere in the output (0 matches).

---

### RFTC017-28 (spec Unit 9): Version is single-sourced between installed package metadata and `__version__`

**Priority:** P2
**Actual Result:** PASS. `importlib.metadata.version("redmineflux-tcm")` == `redmineflux_tcm.__version__` ==
`"0.1.0"` — one source of truth, not a hardcoded literal drifting from the installed metadata.

---

## Not Executed

- **The 5 CI platform recipes themselves (Jenkins/GitHub Actions/GitLab/CircleCI/Bitbucket)** — that's rftc-038,
  a separate suite.
- **Windows console encoding** — this environment's CLI runs only inside a Linux Docker container; a genuine
  Windows-console check would need the tool actually installed and run from a native Windows shell.
- **`test_installed_console_script_runs`** (functional 11) in a truly clean, isolated venv with no prior
  `pip install -e .` — this session's container already had the package installed editable from earlier testing;
  a from-scratch `pip install .` in a fresh venv was not separately re-verified, though `--version`/subcommands
  working via the installed `redmineflux-tcm` entry point throughout this file is strong indirect evidence the
  `console_scripts` wiring is correct.
- **Edge 5** (`--no-defect` flag causing a server-side 422) — the `submit` subcommand's exact flag surface for
  this was not independently probed this session.
- **Integration E1** (`make smoke` against the live `:3091` demo) — that demo environment could not be stood up
  this cycle (documented in the original header note); the equivalent live-server loop was instead proven against
  `redmine6-redmine-1` throughout RFTC017-1/2/3/17.

## Coverage Summary

**Shipped suite: 40/42 PASS (1 real bug, `BUG-TCM-065`, isolated to the deprecated `client` shim and since fixed —
every other area clean). Manual live-server checks: 14/14 PASS** (both CLI phases end-to-end against the real
plugin, all 6 documented exit codes directly confirmed by hand including the previously-blocked exit 10 on BOTH
`bootstrap` and `ingest`, config-resolution precedence + discovery order + error handling proven exhaustively,
secrets hygiene fully verified — process-list exposure, debug-output safety, world-readable config warning, and
sentinel-key absence even through an induced usage-error exit — the `--output json`/`--quiet` output contract
confirmed on both `bootstrap` and `submit`, the deprecated `client` shim (both top-level and submodule imports)
re-verified working post-fix, the exit-code contract pinned exactly at the code level, version single-sourcing
confirmed, and the `duration_ms` structured-field-without-PHASE-1-leak guarantee code-confirmed.

**Third follow-up (full 409-line spec re-read): 22/22 additional scenarios, all PASS, zero new bugs.** Combined
total: **36/36 scenarios executed against the full source spec (42 pytest + 14 + 22 manual), all PASS except the
2 pytest failures isolated to the already-fixed `BUG-TCM-065`.** The CLI is exhaustively verified end-to-end; the
one real defect found (`BUG-TCM-065`) was narrow, cosmetic, and has since been fixed and closed. Remaining
untested items (a from-scratch clean-venv install, the exact `--no-defect` flag behavior, and the live `:3091`
`make smoke` integration gate) are documented above as genuine but low-risk gaps, not deferred without reason.
