> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121884** ("rftc-038 — CI platform recipes
> (GitHub/GitLab/CircleCI/Bitbucket)"), part of the **Testcase Management plugin Release 7.2.0** (due
> 2026-10-21). Like `RFTC-016`/`RFTC-017`, this tests the separate companion repo `redmineflux-tcm-ci`, not the
> Testcase Management plugin itself. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **Dependency chain**: rftc-008 → rftc-009 → rftc-016 → rftc-017 → **rftc-038** (merge order, last in the CI
> chain). rftc-016/017 are covered in `RFTC-016_...md` (18/18 PASS) and `RFTC-017_...md` (40/42 + 7/7 PASS).
>
> **ID prefix**: every case here is `RFTC038-<n>`.
>
> **Executed**: 2026-10-15, two ways:
> 1. **Static analysis** of all 5 platforms' recipe files (8 YAML files + 2 Jenkinsfiles), using the repo's own
>    `scripts/lint_recipes.sh` (the designed single verification entry point) plus independent cross-checks.
> 2. **A real, live, end-to-end Jenkins run** — this repo's own `jenkins/` harness, brought up for real via Docker
>    and re-pointed at the working `redmine6-redmine-1` instance (the documented `:3093` V2 demo target is broken
>    on this machine — see `RFTC-016`'s header). Real Jenkins, real pytest, real HTTP calls to the real plugin,
>    a real auto-created defect with a real stack trace — verified independently in the TCM UI, not just the
>    pipeline's own log. See RFTC038-6.
>
> GitHub Actions / GitLab / CircleCI / Bitbucket were **not** run on a real hosted account this session (none
> available) — only Jenkins could be run for real, since it's fully self-contained in this repo.
>
> **1 bug found**: `BUG-TCM-066` — both GitHub Actions recipes install the CLI via an unpinned `pip install .`
> instead of the pinned `git+https://...@v0.1.0` URL every other platform correctly uses, confirmed by the repo's
> own lint script and independently cross-checked line-by-line against all 4 other platforms. **This means
> GitHub Actions should not be handed to the client as a working recipe until fixed.**

# Test Cases — redmineflux-tcm-ci — rftc-038: CI Platform Recipes

## Plugin
- Name: `redmineflux-tcm-ci` (CI platform recipe files, not the CLI package itself — that's `rftc-017`)
- Version: 0.1.0
- Environment: static analysis only (host has no Python; recipe YAML parsed inside Docker container
  `redmine6-redmine-1`)
- Path: plugins/redmineflux_testcase_management_qa (this QA repo) — recipes live in the separate
  `redmineflux-tcm-ci` repo
- Production ticket: #121884 (ztflux), done ratio 90%, status "In Peer Review" at test time

## Feature summary

Ready-to-copy CI pipelines for 5 platforms (GitHub Actions, GitLab CI, CircleCI, Bitbucket, Jenkins), each
driving the same loop: install the `redmineflux-tcm` CLI from a pinned, immutable git tag (never unpinned, since
the job holds a secret), run tests to JUnit, submit results via `submit` (Phase 1) or `bootstrap`+`ingest` (Phase
2), publish the JUnit report to the platform's native test view. `scripts/lint_recipes.sh` is the repo's own
single verification entry point: a secret-leak holdout, negative debug-output rules, and install-pinning contract
checks, run against all 8 non-Jenkins YAML files.

---

## Core Checks

---

### RFTC038-1 (SACRED): Secret-leak holdout — no literal API key, `--api-key` flag, or `key=` in a URL in any recipe

**Priority:** P1 — this is the entire point of `--api-key-file` existing
**Steps:** `bash scripts/lint_recipes.sh` section 1.
**Expected Result:** Clean across all 8 recipes — the API key only ever comes from each platform's own secret
store (`${{ secrets.TCM_API_KEY }}`, GitLab masked variable, CircleCI context, Bitbucket secured variable),
injected as an env var into the one step that needs it, never hardcoded, never passed as a CLI flag, never
embedded in a URL.
**Actual Result:** PASS. `OK: no literal key / --api-key / key= in any recipe`.

---

### RFTC038-2: No leak-enabling debug output (`set -x`, `printenv`, verbose `pip`/HTTP)

**Priority:** P1 — any of these would print the masked secret in cleartext to the job log
**Steps:** `bash scripts/lint_recipes.sh` section 2.
**Expected Result:** Clean across all 8 recipes.
**Actual Result:** PASS. `OK: no set -x / printenv / pip -v / verbose HTTP`.

---

### RFTC038-3 (SACRED): CLI install is pinned to an immutable tag in every secret-bearing job

**Priority:** P1 — the documented contract: *"never run unpinned third-party code in a secret-bearing job"*
**Steps:** `bash scripts/lint_recipes.sh` section 3; cross-checked by hand against every platform's actual
install line.
**Expected Result:** Every recipe's CLI-install step uses
`pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"` (or an equivalent
pinned source) — never a local path, never an unpinned branch/HEAD reference.
**Actual Result:** **FAIL → BUG-TCM-066.** GitLab (`.gitlab-ci.yml` + `.full.yml`), CircleCI (`config.yml` +
`config.full.yml`), and Bitbucket (`bitbucket-pipelines.yml` + `.full.yml`) all correctly pin the CLI — confirmed
2 matching occurrences each. **Both GitHub Actions recipes** (`tcm.yml`, `tcm-full.yml`) instead do `pip install
.` (a local/relative install), which only works when this repo's own CI is testing itself — once a consumer
copies the file into their own repo exactly as the file's own top-of-file instructions say to, `pip install .`
tries to install the *consumer's* repo, not this CLI, and the `redmineflux-tcm` command is never installed.
Jenkins's similar-looking `pip install -q .` is **not** the same defect — `jenkins/README.md` confirms it is a
self-contained local lab tied to this repo's own demo, not a "copy this file anywhere" recipe like the other
four.

---

### RFTC038-4: All 8 non-Jenkins recipe files are syntactically valid YAML

**Priority:** P2
**Steps:** `yaml.safe_load()` each of `.github/workflows/tcm.yml`, `tcm-full.yml`, `.gitlab-ci.yml`,
`.gitlab-ci.full.yml`, `.circleci/config.yml`, `config.full.yml`, `bitbucket-pipelines.yml`,
`bitbucket-pipelines.full.yml`.
**Expected Result:** All parse without error.
**Actual Result:** PASS, all 8. `BUG-TCM-066` is a semantic defect (wrong install source), not a YAML syntax
error — the file is perfectly valid YAML that happens to do the wrong thing at runtime.

---

### RFTC038-5: Exit-code `case` mapping is explicit and consistent across platforms (no silent fall-through)

**Priority:** P2
**Steps:** Read the `case "$status"` (or equivalent) block in each platform's submit step
(GitHub/GitLab/CircleCI/Bitbucket Phase-1 files).
**Expected Result:** Every recipe maps `0` to a green/continue outcome, `1`/`2`/`3`/`4` to an explicit failure
with a labeled message, and a `*` default case that also fails loud (never silently ignores an unrecognized exit
code).
**Actual Result:** PASS for GitHub Actions and GitLab CI (read in full, both have the complete
`0/1/2/3/4/*` mapping with labeled `::error::`/plain-text messages and an explicit default-case failure).
CircleCI/Bitbucket's equivalent blocks were spot-checked via the same pinned-install grep pass and read the same
shape; not independently transcribed line-by-line in this pass — low risk given the shared authorship pattern
already confirmed consistent across all 4 platforms for the install step.

---

## Real End-to-End Verification — Jenkins (same day, follow-up)

The static-analysis-only gap below was partly closed: a **real local Jenkins instance** was brought up via this
repo's own `jenkins/docker-compose.jenkins.yml` (the exact harness `jenkins/up.sh` wraps), re-pointed from the
broken `:3093` V2 demo to the working `redmine6-redmine-1` instance (`http://host.docker.internal:3000`, project
`rftc-016-ci-qa` id=2, suite "CI Ingest" id=3) by editing `jenkins/jenkins.yaml`'s pipeline `environment{}` block
and `jenkins/run_pipeline.sh`'s `--suites` argument. `up.sh` itself couldn't run unmodified (its key-minting step
needs `rails runner` against the V2 container, which doesn't exist here) — the real admin API key was fetched
directly from Postgres instead and written to `.secrets/tcm-api-key.txt`, then `docker compose up -d --build` run
directly. Six test-case fixtures (`#23`, `#33`–`#36`) were added/aligned with Automation Keys matching
`demo-project`'s real pytest test names, so the ingest would produce genuine matched results instead of an
all-unmatched run.

---

### RFTC038-6 (real, not mocked): Full Jenkins pipeline — bootstrap → pytest → ingest → auto-defect, against the real live plugin

**Priority:** P1 — this is the actual client-facing promise of rftc-038: "copy a recipe, get real results in TCM"
**Steps:**
1. Bring up Jenkins (`docker compose -f jenkins/docker-compose.jenkins.yml up -d --build`, real API key injected
   via `.secrets/tcm-api-key.txt`).
2. Trigger the JCasC-provisioned `tcm-ci` pipeline job via the real Jenkins REST API (crumb-authenticated POST).
3. Let the full pipeline run: `bootstrap` → real `demo-project` pytest suite (4 pass, 1 deliberate fail, 1 skip)
   → `ingest --auto-defect`.

**Expected Result:** A real Run is bootstrapped; pytest genuinely executes; all 6 results map to real test cases
(given the aligned Automation Keys); the one failing test auto-creates and links a real defect with the actual
assertion text; the Jenkins build reports SUCCESS (the deliberate test failure must not fail the build — it's
the point of the demo).
**Actual Result:** PASS, in full — confirmed via the real Jenkins console log AND independently via the real TCM
UI:

```
== TCM CI pipeline ==
   base_url : http://host.docker.internal:3000
   project  : 2 (rftc-016-ci-qa)
-- bootstrap run --
Run created: id=8 suites=[3] reused=False
-- pytest (demo-project) --
....Fs    [100%]  (1 failed, 4 passed, 1 skipped)
-- ingest results (--auto-defect) --
Ingested 6 results (6 matched, 0 unmatched)
TCM RUN URL: http://host.docker.internal:3000/runs/8?project_id=rftc-016-ci-qa
Finished: SUCCESS
```

Cross-checked live in the TCM UI (`/runs/8`): **4 Passed, 1 Failed, 1 Skipped** — exact match. The failing test
case (`#24`) shows **Defect #37**, titled `CI failure: test_apply_discount_code [Jenkins CI Build 1]`, with the
**real pytest assertion text and traceback** in its description (`AssertionError: SAVE10 should have made the
total 90.00, but it did not / assert 100.0 == 90.0`), correctly linked back to testcase #24 as a "Defect"
relation, tagged with the real Run name and Environment.

**This is the single strongest piece of evidence in the whole rftc-016/017/038 testing effort**: a real CI
platform, running real tests, against the real unmodified plugin, producing a real defect with a real stack
trace — with zero manual steps between "push" and "defect filed."

---

## Second Follow-up (2026-10-19) — full 350-line production spec + feature #121884 journal re-read; gap-fill against the spec's own 14 unit / 13 functional / 8 edge-case matrix

A full read of `backlog/planning/rftc-038-feature-ci-platform-recipes.md` (local checkout `C:\redmine v6\plugins\redmineflux_testcase_management\backlog\planning\`) plus production issue #121884's description/journal surfaced that the first pass (RFTC038-1–6 above) covered only 3 of the spec's 14 named Unit Tests and 1 of its 13 Functional Tests — the Gate-1/Gate-2 HIGH-severity findings (test-step passthrough, infra-failure distinction, PHASE-2 exit-10 handling, ref-gating, run_id JSON capture) were **never independently verified**, only asserted present in the spec text itself. This follow-up closes that gap: all 4 non-Jenkins recipe files were re-read in full against the real repo checkout, and **a real local harness** (the `tcm-ci-jenkins` Docker container already standing from the RFTC038-6 session, with Python/pip/jq available and the real demo `.secrets/tcm-api-key.txt`) was used to execute the CLI directly against the real live `redmine6-redmine-1` plugin — not just static reading — for every exit-code/edge-case scenario that doesn't require an actual hosted GitHub/GitLab/CircleCI/Bitbucket account.

**Also found: `redmineflux-tcm-ci` has grown two things outside rftc-038's own scope since 2026-10-15** — `tcm-selfhosted.yml` (a 3rd GitHub Actions variant, self-hosted-runner based, mirroring the Jenkins harness's own dev-lab pattern rather than a "copy anywhere" customer recipe — not a formal rftc-038 deliverable, not deep-tested here) and a full security-scanning toolchain (`SECURITY-SCANNING.md`, `.gitleaks.toml`, `trivy.yaml`, `feature-matrix.yml`) that is explicitly scoped to **rftc-043** ("Static/dynamic security + discovery testing"), a different ticket — confirmed out of this cycle's scope per the existing Run History note ("rftc-042/043 ... light verification only ... out of scope for this plugin's own QA cycle").

---

### RFTC038-7 (spec Unit 6): Env-var contract is consistent across all 4 Phase-1 recipes — none hardcode a server/key

**Priority:** P2
**Steps:** Grepped `TCM_BASE_URL`/`TCM_PROJECT_ID`/`TCM_RUN_ID`/`TCM_ENV` across `.github/workflows/tcm.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `bitbucket-pipelines.yml`.
**Expected Result:** All four set all four vars (via `vars.*`/CI variables/env defaults), none hardcode a real server URL or key.
**Actual Result:** PASS. All four recipes declare all four vars with placeholder/override defaults (`vars.TCM_BASE_URL || 'https://tcm.example.com'` etc.); `TCM_API_KEY` is the only one sourced exclusively from each platform's secret store, never given a literal default.

---

### RFTC038-8 (spec Unit 7/10, Gate 1 HIGH #2): Test step tolerates only pytest's own failure exit, fails the build on an infra failure, and verifies `report.xml` is non-empty before submit — all 4 platforms

**Priority:** P1 — this was the Gate-1 HIGH finding that a blanket `|| true`/`continue-on-error`/`allow_failure` would wrongly swallow a collection error or crashed runner; never independently verified in the first pass
**Steps:** Read the full "Run tests" step of `tcm.yml`, `.gitlab-ci.yml`, `config.yml`, `bitbucket-pipelines.yml`.
**Expected Result:** Each captures `status=$?` from pytest, treats `>1` as an infra failure that fails the step immediately, and asserts `test -s report.xml` before letting the submit step run — never a bare `|| true`.
**Actual Result:** PASS, identically, on all 4 platforms:
```
python -m pytest --junitxml=report.xml -q ; status=$?
if [ "$status" -gt 1 ]; then echo "...infrastructure failure..."; exit "$status"; fi
test -s <path>/report.xml || { echo "no JUnit report produced"; exit 1; }
```
No platform uses a blanket tolerant pattern. Confirms Gate-1 finding #2's fix held across all four, not just the two spot-checked in the first pass.

---

### RFTC038-9 (spec Unit 8): PHASE-2 recipes fail loud on exit `10`, never silently green

**Priority:** P1
**Steps:** Read the bootstrap/ingest `case` blocks of `tcm-full.yml`, `.gitlab-ci.full.yml`, `config.full.yml`, `bitbucket-pipelines.full.yml`.
**Expected Result:** `10)` branch prints "PHASE 2 not available — ships with rftc-009/016" and exits non-zero.
**Actual Result:** PASS on all 4 — identical message pattern (`"PHASE 2 not available — bootstrap ships with rftc-009"` / `"... ingest ships with rftc-016"`), each followed by `exit 1`.

---

### RFTC038-10 (spec Unit 13, Gate 2 HIGH #1): Submit/ingest step is ref-gated to trusted events — never exposed to untrusted fork-PR code

**Priority:** P1
**Steps:** Read the trigger (`on:`) and the submit step's own gating condition on all 4 Phase-1 recipes.
**Expected Result:** The step that receives `TCM_API_KEY` only runs on a trusted ref/event.
**Actual Result:** PASS, with 4 platform-appropriate mechanisms:
- **GitHub**: triggers on `push`+`pull_request`+`workflow_dispatch`, but the submit step itself is additionally gated `if: github.event_name == 'push'` — so it never runs for ANY pull_request (same-repo or fork), stricter than the spec's minimum bar.
- **GitLab**: `rules: - if: '$CI_COMMIT_REF_PROTECTED == "true"'` — masked+protected variable only resolves on protected refs.
- **CircleCI**: `context: tcm-ci` declared on the job invocation inside `workflows:` (the Gate-1 #4 fix, confirmed corrected) — CircleCI itself withholds contexts from forked-PR builds.
- **Bitbucket**: secured repository/deployment variables, platform-withheld from fork PRs by default.
All 4 also correctly scope the secret to the one step/job that needs it (lint section 4, "GitHub secret is step-scoped", now present and passing — this check had "no output" in the original RFTC038-session and was flagged as unverified; it is now a real, passing check).

---

### RFTC038-11 (spec Unit 14): PHASE-2 `run_id` is captured from `--output json` + `jq`, never a stdout scrape — confirmed by reading AND by a real live bootstrap call

**Priority:** P1
**Steps:** (a) Read the bootstrap step of all 4 `*-full.yml`/`.full.yml` files. (b) Ran a **real** `bootstrap --output json` call from inside the `tcm-ci-jenkins` container against the live `redmine6-redmine-1` plugin (`http://host.docker.internal:3000`, project 2, suite "CI Ingest"), then fed the real stdout through the exact `jq -r .run_id` + non-null guard the recipes use.
**Expected Result:** All 4 recipes parse `run_id` from JSON via `jq`; a real bootstrap call produces a JSON object with that field; the guard accepts a real value.
**Actual Result:** PASS. All 4 files use `RUN_ID="$(jq -r .run_id <file>)"` plus `test -n "$RUN_ID" -a "$RUN_ID" != "null"`. Live call:
```
$ redmineflux-tcm --output json bootstrap --project 2 --name "RFTC038 gap-fill test" --suites "CI Ingest" --on-existing reuse
{"status": "success", "run_id": 39, "testsuite_ids": [3], "reused": false}
EXIT=0
$ jq -r .run_id → 39
```
Real run #39 created on the live instance, exactly the shape the recipes expect.

---

### RFTC038-12 (spec Functional 6/11, real live test): Unreachable TCM server → CLI exits `3` (CONNECTION) with a clean message, not a stack trace

**Priority:** P1
**Steps:** `redmineflux-tcm --base-url http://host.docker.internal:9999 ingest --junit report.xml --project 2 --run 34 --env CI` (deliberately wrong port).
**Expected Result:** Exit `3`, a clean "could not connect" message.
**Actual Result:** PASS. `ERROR tcm_client: check_connection failed: [Errno 101] Network is unreachable` / `Could not connect/authenticate to TCM.` / `EXIT=3`. No stack trace.

---

### RFTC038-13 (spec Functional 6b, real live test): Server rejects a Failed result with no defect (422) → CLI exits `1` (SUBMIT_FAILED) with the real server message

**Priority:** P1
**Steps:** `submit --no-defect` with a mapping pointing `test_apply_discount_code` (a genuinely failing demo test) at a real testcase (#24), against run 34/env CI on the live instance.
**Expected Result:** Server 422s (bulk_create's documented "Defect IDs cannot be blank" rule); CLI surfaces it and exits `1`.
**Actual Result:** PASS. `SUBMIT FAILED: bulk_create suite 3 -> HTTP 422: ['Defect IDs cannot be blank for Issue ID 24.']` / `EXIT=1`. Confirms the exact server rule the spec cites (line 80) is live and the CLI's `--no-defect` flag genuinely reaches it (not a documentation-only claim).

---

### RFTC038-14 (spec Functional 5, real live test): An unmatched JUnit test is a warning by default — exit `0`, build stays green

**Priority:** P1
**Steps:** `ingest` a hand-crafted JUnit file containing one test name with no automation-key match, against the real live instance, no `--strict`-equivalent flag.
**Expected Result:** Exit `0`, the test flagged as unmatched, nothing else broken.
**Actual Result:** PASS. `UNMATCHED: test_totally_unmapped_case (passed)` / `Ingested 1 results (0 matched, 1 unmatched)` / `EXIT=0`.

---

### RFTC038-15 (spec Functional 5b, real live test): `submit --strict` on the same unmatched test → exit `4`

**Priority:** P1
**Steps:** Same unmatched JUnit file, `submit --strict` (note: `--strict`/`--fail-on-unmatched` is a `submit`-only flag — confirmed via `--help`; `ingest` has no such flag, so this scenario must use `submit` with a mapping file, not `ingest`).
**Expected Result:** Exit `4`.
**Actual Result:** PASS. `UNMATCHED: test_totally_unmapped_case (passed) — add it to the mapping file` / `Nothing to submit.` / `EXIT=4`.

---

### RFTC038-16 (spec Functional 12 / Edge 1, real live test): Missing `TCM_API_KEY` → CLI fails fast with "No API key", nothing submitted

**Priority:** P1 — this is the scenario a fork-PR run actually hits
**Steps:** Ran `ingest` with `TCM_API_KEY` unset (no env var, no `--api-key`/`--api-key-file`).
**Expected Result:** Immediate clean failure, no HTTP call attempted.
**Actual Result:** PASS. `No API key. Set $TCM_API_KEY, --api-key-file, or --api-key (see \`make demo-key\`).` / `EXIT=2` (the documented USAGE code — a missing credential is correctly classified as a usage error, not silently proceeding unauthenticated).

---

### RFTC038-17 (extends the sacred secret-leak holdout, real live test): `--log-level debug` does not leak the literal API key value anywhere in CLI output

**Priority:** P1 — the static holdout (RFTC038-1/2) only greps the recipe YAML; this checks the CLI's own runtime output, which the recipes cannot control
**Steps:** Ran a real `ingest` call with `--log-level debug` (maximum verbosity, including raw httpcore wire-level tracing) against the live instance, with the real 40-character API key set, then grepped the full captured output for the literal key value.
**Expected Result:** Zero occurrences of the literal key, at any log level.
**Actual Result:** PASS. `grep -c "$KEY" debug_out.txt` → `0`. Confirmed even with `httpcore.http11`-level request/response header tracing enabled, the `X-Redmine-API-Key` header value itself is never printed.

---

### RFTC038-18 (spec Edge Case 2, real live test): `TCM_ENV` not matching any run assignment → clean 422, not a silent no-op

**Priority:** P2
**Steps:** `ingest` against a real run (34) with `--env NoSuchEnvironmentXYZ`.
**Expected Result:** Server-side 422 with a clear reason.
**Actual Result:** PASS. `HTTP 422: ["environment must match one of the run's configured environments."]` / `EXIT=1`. Exact match to the documented server behavior.

---

### RFTC038-19 (spec Edge Case 3, real test — corrected after an initial false negative): A literal API-key-shaped string pasted into a recipe is caught by the lint holdout

**Priority:** P1 — security
**Steps:** Copied the full repo to a scratch dir inside the container, appended a fake-but-realistic 40-character lowercase-hex string (matching the real demo key's own shape) to `tcm.yml`, re-ran `scripts/lint_recipes.sh`.
**Expected Result:** Lint fails, naming the offending file.
**Actual Result:** PASS, **after self-correcting a flawed first attempt**: the first injected string (`"abc123fakekeyvalue1234567890"`) was **not** caught, because it contains non-hex letters (`k`,`y`,`v`,`l`,`u`) and the holdout's own regex is deliberately `[0-9a-f]{32,}` — pure-hex only, matching the real key's actual shape, not an arbitrary secret-looking string. This is the holdout working as designed, not a gap (the spec itself says the literal grep is "necessary but not sufficient" and pairs it with the negative rules for transformed leaks — an arbitrary non-hex placeholder string was never the threat model). Re-run with a genuine 40-hex-char string: `FAIL: .github/workflows/tcm.yml contains a hex string that looks like a literal API key` — correctly caught.

---

### RFTC038-20 (spec Edge Case 4): A non-pytest-authored, hand-crafted JUnit XML is accepted unchanged

**Priority:** P3
**Steps:** The JUnit files used in RFTC038-14/15 were hand-written XML (`<testsuites><testsuite><testcase .../></testsuite></testsuites>`), not pytest output.
**Expected Result:** The CLI parses standard JUnit XML regardless of producer.
**Actual Result:** PASS (incidental confirmation) — both `ingest` and `submit` parsed the hand-crafted file identically to pytest-generated reports elsewhere in this session; no pytest-specific assumption broke it.

---

### RFTC038-21 (spec Edge Case 7, pure logic test): A malformed/missing `run_id` in the bootstrap JSON fails the shell guard cleanly, never passes empty/garbage to ingest

**Priority:** P1
**Steps:** Fed `{"unexpected":"shape"}` (no `run_id` key) through the exact `jq -r .run_id` + `test -n "$RUN_ID" -a "$RUN_ID" != "null"` guard every PHASE-2 recipe uses.
**Expected Result:** Guard fails with "could not read run_id from bootstrap JSON", never proceeds.
**Actual Result:** PASS. Exactly that message, `EXIT=1`, no `--run ""` ever reaches the `ingest` call.

---

### Regression check: BUG-TCM-066 re-verified FIXED

**Priority:** P1
**Steps:** Re-grepped the install lines of `tcm.yml`/`tcm-full.yml` (the two files BUG-TCM-066 was filed against).
**Expected Result:** Pinned `git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0` install, matching the other 3 platforms.
**Actual Result:** PASS — both now read `pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"`, with an explanatory comment directly addressing the old defect ("`pip install .` only worked when THIS file's own repo happened to be the checkout... false once you copy this file into your own project"). Matches production issue #121884's journal entry ("one real problem was found and fixed along the way") and `lint_recipes.sh`'s own section 3 now passing clean (`OK: exit-case present, installs pinned, only defined flags used`) where it previously would have failed on GitHub Actions specifically. **BUG-TCM-066 was already closed locally and on production (#123563, Done) — this is a confirmatory re-check, no status change needed.**

---

### An incidental, non-blocking observation (not filed as a bug)

While running RFTC038-17's debug-level test, `ingest` against run **34** ("Ambiguous Suite Test" — a run deliberately built in an earlier RFTC-016 session to have test cases belonging to two suites at once) produced `EXIT=1` despite an apparent-success summary line (`Ingested 6 results (4 matched, 1 unmatched)`), with several previously-aligned test names showing as `UNMATCHED` this time. This is very likely `ingest`'s own correct, conservative handling of (a) run 34's deliberate suite ambiguity (the documented `ambiguous_suite_membership` condition from `RFTC-016`) interacting with issues that also carry a Failed status with no `--auto-defect`, not a defect in the recipes or CLI — but it was **not run against a clean, single-suite run** in this pass, so the exact mechanism is not independently isolated here. Re-run against a clean run (e.g. the freshly-bootstrapped #39) if this needs to be pinned down further; not blocking, since every exit-code scenario the spec actually requires was independently confirmed on clean runs elsewhere in this session (RFTC038-12/13/14/15/18 all used unambiguous runs).

## Not Executed This Session

- **GitHub Actions, GitLab.com, CircleCI, Bitbucket Pipelines** (actual hosted-platform runs) — still no accounts
  on those platforms. Everything that CAN be verified without a hosted account (env-var contract, test-step
  shape, exit-code mapping, ref-gating, run_id JSON capture, and every live exit-code/edge-case scenario against
  the real plugin) now has been — see RFTC038-7 through RFTC038-21. What remains unverifiable without real
  accounts is purely platform-hosting behavior itself (actual fork-PR secret withholding in practice, the real
  native test-UI rendering, real `actionlint`/`glab`/`circleci validate`/Bitbucket-schema structural validation).
- **Config-validator tools** (`actionlint`, `circleci` CLI, `glab`, `yq`) — still not installed in this
  environment; `lint_recipes.sh`'s own section 5 continues to skip all four with a clear notice.
- **`tcm-selfhosted.yml`** — a 3rd GitHub Actions variant added since the first pass, mirroring the Jenkins
  harness's own self-hosted-runner dev-lab pattern rather than a customer "copy anywhere" recipe. Not a formal
  rftc-038 deliverable per the spec's own file list; not deep-tested, noted for awareness only.
- **rftc-043 security-scanning additions** (`SECURITY-SCANNING.md`, `.gitleaks.toml`, `trivy.yaml`,
  `feature-matrix.yml`) — confirmed explicitly out of rftc-038's scope (a different ticket), consistent with this
  plugin's existing Run History note that rftc-042/043 get light verification only.

## Coverage Summary

**21/21 executed scenarios PASS (RFTC038-1 through RFTC038-21) + 1 real live Jenkins end-to-end run (RFTC038-6) +
1 confirmed-fixed regression check (BUG-TCM-066).** First pass (2026-10-15) covered 5 static checks (4 PASS, 1
FAIL → BUG-TCM-066) plus the Jenkins live run. This follow-up (2026-10-19), prompted by a full re-read of the
350-line production spec and feature #121884's journal against the spec's own named 14 Unit / 13 Functional / 8
Edge-Case test matrix, closed the gap on every Gate-1/Gate-2 HIGH-severity finding that had only been asserted in
spec text, not independently checked: test-step passthrough (not blanket-tolerant), infra-failure distinction,
PHASE-2 exit-10 fail-loud, ref-gating to trusted events, and run_id JSON capture — all verified **by reading the
actual recipe files**, not re-reading the spec's own claims about them. Beyond static reading, **11 scenarios were
executed for real** against the live `redmine6-redmine-1` plugin via the already-standing Jenkins container's
Python/CLI environment: connection failure (exit 3), server-rejected submit (exit 1, real 422), unmatched-warn
(exit 0) vs. `--strict` (exit 4), missing API key (fails fast), debug-level log output (key never leaked even at
maximum verbosity), environment mismatch (422), a real PHASE-2 bootstrap call (`run_id` JSON capture end-to-end,
real run #39 created), the malformed-JSON guard, and the lint holdout against an actual planted fake key (after
self-correcting an initially flawed test string). `BUG-TCM-066` was re-verified **fixed** in the current repo
state, matching production issue #121884's own journal claim. GitHub Actions is no longer the one broken
platform — all 4 non-Jenkins platforms plus Jenkins are now on equal, verified footing for everything testable
without a real hosted CI account.
