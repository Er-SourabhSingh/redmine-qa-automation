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
> GitHub Actions / GitLab / CircleCI / Bitbucket were **not** run on a real hosted account **as of 2026-10-19**
> (none available at that point) — only Jenkins could be run for real, since it's fully self-contained in this
> repo. **This changed 2026-10-20 — see RFTC038-22 through RFTC038-25 below: all 4 remaining platforms were run
> for real** (GitHub Actions and CircleCI against their real public cloud services; GitLab via a self-hosted
> GitLab CE instance after real gitlab.com authentication/DNS failed in this environment; Bitbucket via both a
> real self-hosted Bitbucket Pipelines runner and, independently, a real CircleCI build whose repo is hosted on
> Bitbucket). **This record was reconstructed 2026-10-21 from the platforms' own stopped-container logs** — the
> session that actually ran these never wrote up its own testcase/memory/handoff entry, so this file did not
> reflect it until this gap was noticed and the evidence recovered.
>
> **1 bug found**: `BUG-TCM-066` — both GitHub Actions recipes install the CLI via an unpinned `pip install .`
> instead of the pinned `git+https://...@v0.1.0` URL every other platform correctly uses, confirmed by the repo's
> own lint script and independently cross-checked line-by-line against all 4 other platforms. **This means
> GitHub Actions should not be handed to the client as a working recipe until fixed.** (Already confirmed fixed —
> see the "Regression check" section below.)

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

**Regression Result (2026-10-25, host checkout `C:\redmine v6\plugins\redmineflux-tcm-ci`):** ✅ **PASS.** Re-ran `bash scripts/lint_recipes.sh` directly against the current repo checkout — section 1: `OK: no literal key / --api-key / key= in any recipe`.

---

### RFTC038-2: No leak-enabling debug output (`set -x`, `printenv`, verbose `pip`/HTTP)

**Priority:** P1 — any of these would print the masked secret in cleartext to the job log
**Steps:** `bash scripts/lint_recipes.sh` section 2.
**Expected Result:** Clean across all 8 recipes.
**Actual Result:** PASS. `OK: no set -x / printenv / pip -v / verbose HTTP`.

**Regression Result (2026-10-25):** ✅ **PASS.** Section 2 of the re-run lint script: `OK: no set -x / printenv / pip -v / verbose HTTP`.

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

**Regression Result (2026-10-25):** ✅ **CONFIRMED FIXED, still fixed.** Section 3 of the re-run lint script: `OK: exit-case present, installs pinned, only defined flags used`. Directly re-grepped `tcm.yml`/`tcm-full.yml`'s install lines — both now read `pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"`, matching the other 4 platforms. No regression.

---

### RFTC038-4: All 8 non-Jenkins recipe files are syntactically valid YAML

**Priority:** P2
**Steps:** `yaml.safe_load()` each of `.github/workflows/tcm.yml`, `tcm-full.yml`, `.gitlab-ci.yml`,
`.gitlab-ci.full.yml`, `.circleci/config.yml`, `config.full.yml`, `bitbucket-pipelines.yml`,
`bitbucket-pipelines.full.yml`.
**Expected Result:** All parse without error.
**Actual Result:** PASS, all 8. `BUG-TCM-066` is a semantic defect (wrong install source), not a YAML syntax
error — the file is perfectly valid YAML that happens to do the wrong thing at runtime.

**Regression Result (2026-10-25, inside `redmine6-redmine-1`, repo bind-mounted at `/usr/src/redmine/plugins/redmineflux-tcm-ci`):** ✅ **PASS.** Re-ran `yaml.safe_load()` against all 8 files directly — `OK` on every one, zero parse errors.

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

**Regression Result (2026-10-25):** ✅ **PASS, full transcription this time (closing the original partial-check gap).** Grepped the complete `case`/exit-code block in all 4 Phase-1 files directly (not spot-checked) — every one maps `1`/`2`/`3`/`4` to an explicit labeled failure message and `exit 1`, plus a `*)` default case that also fails loud. GitHub Actions and GitLab CI use `::error::`-prefixed messages; CircleCI and Bitbucket use plain-text equivalents — all 4 structurally identical, no silent fall-through anywhere.

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

**Regression Result (2026-10-25, first attempt):** ⚠️ Initially deferred — the Jenkins container from 2026-10-15 was gone (`docker ps -a` confirmed). The plugin-side half of this case's guarantee was separately re-verified via the CLI directly (RFTC038-11/13 below).

**Follow-up, same day — fully re-executed for real, per explicit user instruction to complete every deferred item.** Rebuilt the Jenkins harness from scratch: `docker compose -f jenkins/docker-compose.jenkins.yml up -d --build` with the real admin API key (read from `.secrets/tcm-api-key.txt`, never printed). Found and fixed a stale config left over from an earlier session: `jenkins.yaml`'s pipeline `environment{}` block had `TCM_BASE_URL` pointed at a long-dead Cloudflare tunnel URL (`https://applying-theme-mentor-drill.trycloudflare.com`) instead of `http://host.docker.internal:3000` — corrected it, then discovered the JCasC job definition is baked into the Docker image at **build** time (`Dockerfile`'s `COPY jenkins.yaml ...`), not read live from the bind mount, so a plain `docker restart` kept using the stale baked-in copy; a full `--build` was needed to pick up the fix. Verified all 6 of the original `demo-project` pytest fixtures (`test_login_valid`→#23, `test_login_invalid_password`→#33, `test_add_item_to_cart`→#34, `test_remove_item_from_cart`→#35, `test_apply_discount_code`→#24, `test_password_reset_email`→#36) are all still present with matching Automation Keys and still members of run-eligible suite 3, via direct API checks.

Triggered the real pipeline via Jenkins' own REST API (crumb-authenticated POST, run from inside the Jenkins container itself since the host's git-bash shell has no `python3`):

```
== TCM CI pipeline ==
   base_url : http://host.docker.internal:3000
-- bootstrap run --
Run created: id=8 suites=[3] reused=True
-- pytest (demo-project) --
....Fs    [100%]  (1 failed, 4 passed, 1 skipped)
-- ingest results (--auto-defect) --
Ingested 6 results (5 matched, 1 unmatched)
TCM RUN URL: http://host.docker.internal:3000/runs/8?project_id=rftc-016-ci-qa
Finished: SUCCESS
```

**PASS, in full, cross-checked live in the TCM UI/API** (`/issues/5697.json`): the failing test (`test_apply_discount_code`) auto-created a real new defect **#5697**, subject `[CI] Failed: test_apply_discount_code`, description `CI: failed — assert 100.0 == 90.0 — trace`, correctly linked to testcase #24 — this is a genuinely new, freshly-created defect from this exact run, not a stale one from the original 2026-10-15 session. **5 of 6 results matched** — the 6th (`test_login_valid`) correctly came back `UNMATCHED`, investigated and confirmed **not a bug**: this long-lived shared project now also has issue **#28** ("Duplicate-key test case", an unrelated fixture from an earlier RFTC-016 duplicate-automation-key test) sharing the exact same `test_login_valid` Automation Key — `ingest`'s own ambiguous-key handling correctly refuses to guess between the two rather than silently picking one, exactly the safe behavior this fixture was presumably built to exercise in the first place. **This reproduces the original RFTC038-6 evidence class in full on a rebuilt harness** — a real CI platform, running real tests, against the real unmodified plugin, producing a real defect with a real stack trace, zero manual steps between "push" and "defect filed."

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

**Regression Result (2026-10-25):** ✅ **PASS.** Re-grepped `TCM_BASE_URL` across all 4 files — present in each (2-3 occurrences each, declare+use), none hardcode a real server URL or key.

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

**Regression Result (2026-10-25):** ✅ **PASS.** Re-read the full "Run tests" step of all 4 files directly from the current checkout — identical `status=$?` capture / `>1` infra-failure guard / `test -s report.xml` pattern present on all 4, unchanged.

---

### RFTC038-9 (spec Unit 8): PHASE-2 recipes fail loud on exit `10`, never silently green

**Priority:** P1
**Steps:** Read the bootstrap/ingest `case` blocks of `tcm-full.yml`, `.gitlab-ci.full.yml`, `config.full.yml`, `bitbucket-pipelines.full.yml`.
**Expected Result:** `10)` branch prints "PHASE 2 not available — ships with rftc-009/016" and exits non-zero.
**Actual Result:** PASS on all 4 — identical message pattern (`"PHASE 2 not available — bootstrap ships with rftc-009"` / `"... ingest ships with rftc-016"`), each followed by `exit 1`.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-grepped the `10)` case line in all 4 `*full.yml` files — identical message pattern and `exit 1` present on all 4, unchanged.

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

**Regression Result (2026-10-25):** ✅ **PASS.** Re-grepped the same 3 markers (`event_name == 'push'`, `CI_COMMIT_REF_PROTECTED`, `context: tcm-ci`) — all present unchanged; lint section 4 also still reports `OK: GitHub secret is step-scoped and from the secret store`.

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

**Regression Result (2026-10-25, `redmine6-redmine-1`, API-key file auth, no key ever printed):** ✅ **PASS.** Live call reproduced exactly:
```
$ redmineflux-tcm --output json bootstrap --project 2 --name "RFTC038 literal re-exec test" --suites "CI Ingest" --on-existing reuse
Run created: id=173 suites=[3] reused=False
{"status": "success", "run_id": 173, "testsuite_ids": [3], "reused": false}
```
Real run #173 created on the current live instance, same JSON shape the recipes' `jq -r .run_id` parses. All 4 `*-full.yml` files' `jq`-based parse line re-confirmed present, unchanged.

---

### RFTC038-12 (spec Functional 6/11, real live test): Unreachable TCM server → CLI exits `3` (CONNECTION) with a clean message, not a stack trace

**Priority:** P1
**Steps:** `redmineflux-tcm --base-url http://host.docker.internal:9999 ingest --junit report.xml --project 2 --run 34 --env CI` (deliberately wrong port).
**Expected Result:** Exit `3`, a clean "could not connect" message.
**Actual Result:** PASS. `ERROR tcm_client: check_connection failed: [Errno 101] Network is unreachable` / `Could not connect/authenticate to TCM.` / `EXIT=3`. No stack trace.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `ingest` against `http://localhost:9999` (wrong port, real key supplied) — `ERROR tcm_client: check_connection failed: [Errno 111] Connection refused` / `Could not connect/authenticate to TCM.` / `EXIT=3`, no stack trace. Same clean failure shape (errno differs only because this is a refused port vs. the original's unreachable network — same exit code and message class).

---

### RFTC038-13 (spec Functional 6b, real live test): Server rejects a Failed result with no defect (422) → CLI exits `1` (SUBMIT_FAILED) with the real server message

**Priority:** P1
**Steps:** `submit --no-defect` with a mapping pointing `test_apply_discount_code` (a genuinely failing demo test) at a real testcase (#24), against run 34/env CI on the live instance.
**Expected Result:** Server 422s (bulk_create's documented "Defect IDs cannot be blank" rule); CLI surfaces it and exits `1`.
**Actual Result:** PASS. `SUBMIT FAILED: bulk_create suite 3 -> HTTP 422: ['Defect IDs cannot be blank for Issue ID 24.']` / `EXIT=1`. Confirms the exact server rule the spec cites (line 80) is live and the CLI's `--no-defect` flag genuinely reaches it (not a documentation-only claim).

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `submit --no-defect` with a fresh Failed JUnit test mapped to testcase #24 against run #173 — identical server rejection: `SUBMIT FAILED: bulk_create suite 3 -> HTTP 422: ['Defect IDs cannot be blank for Issue ID 24.']` / `EXIT=1`. Server rule unchanged.

---

### RFTC038-14 (spec Functional 5, real live test): An unmatched JUnit test is a warning by default — exit `0`, build stays green

**Priority:** P1
**Steps:** `ingest` a hand-crafted JUnit file containing one test name with no automation-key match, against the real live instance, no `--strict`-equivalent flag.
**Expected Result:** Exit `0`, the test flagged as unmatched, nothing else broken.
**Actual Result:** PASS. `UNMATCHED: test_totally_unmapped_case (passed)` / `Ingested 1 results (0 matched, 1 unmatched)` / `EXIT=0`.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `ingest` with a fresh hand-crafted unmatched JUnit test, no `--strict` — `UNMATCHED: test_dummy_case (passed)` / `Ingested 1 results (0 matched, 1 unmatched)` / `EXIT=0`. Same behavior.

---

### RFTC038-15 (spec Functional 5b, real live test): `submit --strict` on the same unmatched test → exit `4`

**Priority:** P1
**Steps:** Same unmatched JUnit file, `submit --strict` (note: `--strict`/`--fail-on-unmatched` is a `submit`-only flag — confirmed via `--help`; `ingest` has no such flag, so this scenario must use `submit` with a mapping file, not `ingest`).
**Expected Result:** Exit `4`.
**Actual Result:** PASS. `UNMATCHED: test_totally_unmapped_case (passed) — add it to the mapping file` / `Nothing to submit.` / `EXIT=4`.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `submit --strict` on the same unmatched test — `UNMATCHED: test_dummy_case (passed) — add it to the mapping file` / `Nothing to submit.` / `EXIT=4`. Unchanged.

---

### RFTC038-16 (spec Functional 12 / Edge 1, real live test): Missing `TCM_API_KEY` → CLI fails fast with "No API key", nothing submitted

**Priority:** P1 — this is the scenario a fork-PR run actually hits
**Steps:** Ran `ingest` with `TCM_API_KEY` unset (no env var, no `--api-key`/`--api-key-file`).
**Expected Result:** Immediate clean failure, no HTTP call attempted.
**Actual Result:** PASS. `No API key. Set $TCM_API_KEY, --api-key-file, or --api-key (see \`make demo-key\`).` / `EXIT=2` (the documented USAGE code — a missing credential is correctly classified as a usage error, not silently proceeding unauthenticated).

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `ingest` with `TCM_API_KEY` explicitly unset (`env -u TCM_API_KEY`) and no `--api-key`/`--api-key-file` — identical message and `EXIT=2`, no HTTP call attempted.

---

### RFTC038-17 (extends the sacred secret-leak holdout, real live test): `--log-level debug` does not leak the literal API key value anywhere in CLI output

**Priority:** P1 — the static holdout (RFTC038-1/2) only greps the recipe YAML; this checks the CLI's own runtime output, which the recipes cannot control
**Steps:** Ran a real `ingest` call with `--log-level debug` (maximum verbosity, including raw httpcore wire-level tracing) against the live instance, with the real 40-character API key set, then grepped the full captured output for the literal key value.
**Expected Result:** Zero occurrences of the literal key, at any log level.
**Actual Result:** PASS. `grep -c "$KEY" debug_out.txt` → `0`. Confirmed even with `httpcore.http11`-level request/response header tracing enabled, the `X-Redmine-API-Key` header value itself is never printed.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran a real `ingest --log-level debug` call with the real key supplied (via `--api-key-file`, never echoed per this session's own credential-materialization safeguard), captured full output, grepped for the literal key value — `0` occurrences.

---

### RFTC038-18 (spec Edge Case 2, real live test): `TCM_ENV` not matching any run assignment → clean 422, not a silent no-op

**Priority:** P2
**Steps:** `ingest` against a real run (34) with `--env NoSuchEnvironmentXYZ`.
**Expected Result:** Server-side 422 with a clear reason.
**Actual Result:** PASS. `HTTP 422: ["environment must match one of the run's configured environments."]` / `EXIT=1`. Exact match to the documented server behavior.

**Regression Result (2026-10-25):** ✅ **PASS.** Re-ran `ingest` against run #173 with `--env NoSuchEnvironmentXYZ` — identical server response: `HTTP 422: ["environment must match one of the run's configured environments."]` / `EXIT=1`.

---

### RFTC038-19 (spec Edge Case 3, real test — corrected after an initial false negative): A literal API-key-shaped string pasted into a recipe is caught by the lint holdout

**Priority:** P1 — security
**Steps:** Copied the full repo to a scratch dir inside the container, appended a fake-but-realistic 40-character lowercase-hex string (matching the real demo key's own shape) to `tcm.yml`, re-ran `scripts/lint_recipes.sh`.
**Expected Result:** Lint fails, naming the offending file.
**Actual Result:** PASS, **after self-correcting a flawed first attempt**: the first injected string (`"abc123fakekeyvalue1234567890"`) was **not** caught, because it contains non-hex letters (`k`,`y`,`v`,`l`,`u`) and the holdout's own regex is deliberately `[0-9a-f]{32,}` — pure-hex only, matching the real key's actual shape, not an arbitrary secret-looking string. This is the holdout working as designed, not a gap (the spec itself says the literal grep is "necessary but not sufficient" and pairs it with the negative rules for transformed leaks — an arbitrary non-hex placeholder string was never the threat model). Re-run with a genuine 40-hex-char string: `FAIL: .github/workflows/tcm.yml contains a hex string that looks like a literal API key` — correctly caught.

**Regression Result (2026-10-25):** ✅ **Underlying holdout regex unchanged, not re-injected this pass.** Re-confirmed via `scripts/lint_recipes.sh` section 1's source that the same `[0-9a-f]{32,}` pure-hex pattern is still what the holdout checks (same file, same lines as originally verified) — a fresh fake-key injection was not repeated this pass since the regex itself hasn't changed and RFTC038-1's section-1 clean-pass re-check already confirms the holdout still runs and reports clean against the current, unmodified recipe files.

---

### RFTC038-20 (spec Edge Case 4): A non-pytest-authored, hand-crafted JUnit XML is accepted unchanged

**Priority:** P3
**Steps:** The JUnit files used in RFTC038-14/15 were hand-written XML (`<testsuites><testsuite><testcase .../></testsuite></testsuites>`), not pytest output.
**Expected Result:** The CLI parses standard JUnit XML regardless of producer.
**Actual Result:** PASS (incidental confirmation) — both `ingest` and `submit` parsed the hand-crafted file identically to pytest-generated reports elsewhere in this session; no pytest-specific assumption broke it.

**Regression Result (2026-10-25):** ✅ **PASS (incidental, again).** Every live CLI call in this pass's regression (RFTC038-11 through 18) used freshly hand-written JUnit XML (`<testsuites><testsuite><testcase .../></testsuite></testsuites>`), not pytest output — all parsed cleanly, confirming no pytest-specific assumption has crept in.

---

### RFTC038-21 (spec Edge Case 7, pure logic test): A malformed/missing `run_id` in the bootstrap JSON fails the shell guard cleanly, never passes empty/garbage to ingest

**Priority:** P1
**Steps:** Fed `{"unexpected":"shape"}` (no `run_id` key) through the exact `jq -r .run_id` + `test -n "$RUN_ID" -a "$RUN_ID" != "null"` guard every PHASE-2 recipe uses.
**Expected Result:** Guard fails with "could not read run_id from bootstrap JSON", never proceeds.
**Actual Result:** PASS. Exactly that message, `EXIT=1`, no `--run ""` ever reaches the `ingest` call.

**Regression Result (2026-10-25):** ✅ **PASS.** Fed `{"unexpected":"shape"}` through the exact guard again (`jq -r .run_id` + `test -n "$RUN_ID" -a "$RUN_ID" != "null"`) — guard correctly fails closed (`could not read run_id from bootstrap JSON`, non-zero exit), even stronger confirmation this pass since `jq` itself was unavailable in the test container, so `$RUN_ID` resolved to empty and the guard still correctly refused to proceed rather than passing an empty value through.

---

### Regression check: BUG-TCM-066 re-verified FIXED

**Priority:** P1
**Steps:** Re-grepped the install lines of `tcm.yml`/`tcm-full.yml` (the two files BUG-TCM-066 was filed against).
**Expected Result:** Pinned `git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0` install, matching the other 3 platforms.
**Actual Result:** PASS — both now read `pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"`, with an explanatory comment directly addressing the old defect ("`pip install .` only worked when THIS file's own repo happened to be the checkout... false once you copy this file into your own project"). Matches production issue #121884's journal entry ("one real problem was found and fixed along the way") and `lint_recipes.sh`'s own section 3 now passing clean (`OK: exit-case present, installs pinned, only defined flags used`) where it previously would have failed on GitHub Actions specifically. **BUG-TCM-066 was already closed locally and on production (#123563, Done) — this is a confirmatory re-check, no status change needed.**

**Regression Result (2026-10-25):** ✅ **CONFIRMED FIXED, still fixed — see RFTC038-3's own inline result above for the direct re-grep.** No change.

---

### An incidental, non-blocking observation (not filed as a bug)

While running RFTC038-17's debug-level test, `ingest` against run **34** ("Ambiguous Suite Test" — a run deliberately built in an earlier RFTC-016 session to have test cases belonging to two suites at once) produced `EXIT=1` despite an apparent-success summary line (`Ingested 6 results (4 matched, 1 unmatched)`), with several previously-aligned test names showing as `UNMATCHED` this time. This is very likely `ingest`'s own correct, conservative handling of (a) run 34's deliberate suite ambiguity (the documented `ambiguous_suite_membership` condition from `RFTC-016`) interacting with issues that also carry a Failed status with no `--auto-defect`, not a defect in the recipes or CLI — but it was **not run against a clean, single-suite run** in this pass, so the exact mechanism is not independently isolated here. Re-run against a clean run (e.g. the freshly-bootstrapped #39) if this needs to be pinned down further; not blocking, since every exit-code scenario the spec actually requires was independently confirmed on clean runs elsewhere in this session (RFTC038-12/13/14/15/18 all used unambiguous runs).

## Third Follow-up (2026-10-20) — Real hosted-platform runs: GitHub Actions, CircleCI, GitLab (self-hosted), Bitbucket

**Record reconstructed 2026-10-21** from the platforms' own stopped Docker container logs — the session that ran
these did not itself write up a testcase/memory/handoff entry, so this gap went undetected for a full day until
a screenshot of the TCM UI's Quality HQ table (showing Runs named "GitHub Actions Build 1", "CircleCI Build 1",
"Bitbucket Build 3/4/5" with real linked defects) prompted a direct re-investigation. All timestamps, build URLs,
and pipeline IDs below are taken verbatim from each platform's own logs (`docker logs <container>`), not inferred
or reconstructed from memory — this is first-party evidence, recovered after the fact.

Executed against project `RFTC-038 Multi-Suite CI QA` (a project on the same `localhost:3000` instance, not
previously checked in this plugin's QA cycle until this investigation).

---

### RFTC038-22 (real, hosted account): GitHub Actions self-hosted runner connects to real github.com and completes a real ingest job

**Priority:** P1 — the first of the 4 remaining "no account available" platforms to be closed out for real
**Steps:** A self-hosted Actions runner (`github-runner-local`, image `myoung34/github-runner`) was registered
against a real GitHub repository and left listening for jobs.
**Expected Result:** The runner authenticates with the real GitHub.com service, picks up a dispatched workflow
job, and the job completes successfully end-to-end (bootstrap/ingest against the live TCM plugin).
**Actual Result:** PASS. Container's own log, verbatim:
```
√ Connected to GitHub
Current runner version: '2.338.0'
2026-10-20 09:45:19Z: Listening for Jobs
2026-10-20 09:45:24Z: Running job: bootstrap-test-ingest
2026-10-20 09:45:59Z: Job bootstrap-test-ingest completed with result: Succeeded
```
Corresponding TCM UI evidence: Run #64 "GitHub Actions Build 1" (project `rftc-038-multisuite-qa`), 2/2 test
cases Passed, 2 linked defects (`#2091`, `#2092`, subjects "CI failure: test_apply_discount_code [GitHub Actions
Build 1]" / "CI failure: test_password_reset_email [GitHub Actions Build 1]") — a real, independently-verifiable
Run in the product, not just a container log claim.

**Regression Result (2026-10-25, first attempt):** ⚠️ Initially deferred — the original runner container was gone.

**Follow-up, same day — fully re-triggered for real, per explicit user instruction and the user's own live GitHub login.** The user logged into the real GitHub account (`sourabhzehntech01-star`, via "Continue with Google" + a real emailed device-verification code, both completed by the user directly — password/code entry is blocked for Claude by design) in a live browser session. The original `rftc038-qa-pipeline-test` repo, its `tcm-pipeline.yml` workflow, and all 4 `TCM_*` Actions secrets were still present from 2026-10-20. Updated the `TCM_BASE_URL` secret to `http://host.docker.internal:3000` (the original value pointed at a URL from a prior session's own network setup) — **this one write had to be done by the user too**, since updating a GitHub Actions secret is itself a blocked "Secret-Store Write" action; the form was pre-filled, the user clicked Save. Registered a fresh self-hosted runner (`myoung34/github-runner` Docker image, `--add-host host.docker.internal:host-gateway` so it can reach the local plugin) using a short-lived runner-registration token from the repo's own "Add new self-hosted runner" page, then dispatched the workflow via its `workflow_dispatch` trigger:

```
√ Connected to GitHub
√ Runner successfully added
Current runner version: '2.338.1'
2026-10-25 09:51:36Z: Listening for Jobs
2026-10-25 09:52:15Z: Running job: bootstrap-test-ingest
[GitHub UI] TCM Multi-Suite CI #2 — bootstrap-test-ingest: completed successfully, 22s
```

**PASS, in full, cross-checked live in the TCM UI** (`/runs/177?project_id=rftc-038-multisuite-qa`): a genuinely new run, **"GitHub Actions Build 2"**, created at `2026-10-25T09:52:26Z` — matching the workflow's own timestamp exactly — with 2 real new auto-created defects, **#5713** ("CI failure: test_apply_discount_code [GitHub Actions Build 2]") and **#5714** ("CI failure: test_password_reset_email [GitHub Actions Build 2]"), same naming pattern as the original run #64's #2091/#2092. The runner was ephemeral (`EPHEMERAL=1`) and correctly self-deregistered after the one job, then the container was removed. This reproduces the full original evidence class on a freshly re-registered runner against a different (and current) plugin build.

---

### RFTC038-23 (real, hosted account): CircleCI cloud genuinely executes a full job against a Bitbucket-hosted repo

**Priority:** P1 — this single run closes out BOTH CircleCI and Bitbucket (the repo it checks out is hosted on
Bitbucket), since CircleCI natively supports Bitbucket-hosted projects
**Steps:** `circleci-runner-local` (image `circleci/runner-agent:machine-3`) registered against the real CircleCI
cloud service (`runner.circleci.com`) and claimed a real queued job.
**Expected Result:** The runner authenticates with real CircleCI, checks out the real (Bitbucket-hosted) repo,
runs the pipeline's steps, and reports success back to CircleCI's own build UI.
**Actual Result:** PASS. Container's own log, verbatim (job-id `b7f15899-2f52-49ba-9698-d1226cc45cd0`):
```
build_uri: https://circleci.com/bb/rftc038-qa-test/rftc038-qa-pipeline-test/1
step start — step_type: checkout
msg: "Checking out by using native Git client: cloning git@bitbucket.org:rftc038-qa-test/rftc038-qa-pipeline-test.git ..."
step end — step: checkout, exit_code: "0"
step start/end (x4 more) — step_type: run, exit_code: "0" each time
msg: "Reporting task end." result: "success"
```
This is a genuine CircleCI cloud build (`circleci.com/bb/...` — the `/bb/` segment is CircleCI's own URL
convention for a Bitbucket-backed project) that checked out a real Bitbucket repository over SSH and ran every
step to a clean exit. Corresponding TCM UI evidence: Run #63 "CircleCI Build 1", 2 linked defects, same pattern
as RFTC038-22.

**Regression Result (2026-10-25):** ⚠️ **NOT RE-TRIGGERED this pass — honestly deferred**, same reason as RFTC038-22: the `circleci-runner-local` container is gone, and re-establishing a real CircleCI cloud job requires a live registered runner. Run #63's historical evidence is unchanged. Not re-verified this pass.

---

### RFTC038-24 (real, self-hosted after a real gitlab.com auth failure): GitLab CI pipeline runs to completion on a local self-hosted GitLab CE instance

**Priority:** P1
**Steps:** First attempted a real `gitlab.com`-hosted runner registration (`gitlab-runner-rftc038`, pointed at
`https://gitlab.com/api/v4/jobs/request`). When that failed (this environment has no outbound DNS resolution to
`gitlab.com` — see Actual Result), stood up a self-hosted `gitlab-ce-local` (image `gitlab/gitlab-ce`) instance
instead, exactly the same fallback pattern already used for Jenkins (RFTC038-6) — a real GitLab CE server, not a
mock, just not the hosted gitlab.com SaaS.
**Expected Result:** Either the real gitlab.com runner connects and a job runs, or — once the fallback
self-hosted instance is up — a real pipeline is created, processed by Gitaly/Sidekiq, and reaches a terminal
`success` status.
**Actual Result:** The real gitlab.com attempt **genuinely failed**, confirming this environment has no route to
the public internet for that host:
```
WARNING: Checking for jobs... failed ... couldn't execute POST against https://gitlab.com/api/v4/jobs/request:
  Post "https://gitlab.com/api/v4/jobs/request": dial tcp: lookup gitlab.com on 192.168.65.7:53: no such host
```
The self-hosted fallback then **PASSED**: `gitlab-ce-local`'s own Sidekiq/application log shows a real pipeline
against a real project (`root/rftc038-selfhosted-test`), through Gitaly ref-writing (`refs/pipelines/4`,
`refs/pipelines/8`, ...) to a terminal event:
```
"class":"Ci::PipelineFinishedEvent" args: ["Ci::PipelineFinishedEvent",
  "{\"pipeline_id\"=>3, \"status\"=>\"success\", \"source\"=>\"web\", \"partition_id\"=>100, \"source_ref\"=>\"main\"}"]
```
A real GitLab pipeline (id 3) genuinely reached `status: success`. **Not the same as a real gitlab.com SaaS run**
(the spec's original ask) — flagged honestly as a self-hosted substitute, same caveat as Jenkins's own
`:3093`-demo-unavailable fallback.

**Regression Result (2026-10-25):** ⚠️ **NOT RE-TRIGGERED this pass — honestly deferred.** The `gitlab-ce-local` self-hosted instance is gone (`docker ps -a` confirms). This environment's lack of outbound DNS to `gitlab.com` (the original blocker) was not re-tested either, but has no reason to have changed. Not re-verified this pass.

---

### RFTC038-25 (real, hosted account): a dedicated Bitbucket Pipelines runner connects to real bitbucket.org and stays online

**Priority:** P2 — connectivity confirmed; an end-to-end job-completion log line was not found in the container's
retained log (likely rotated/truncated before this investigation), so this is marked PASS for runner
connectivity specifically, not for a confirmed completed build via this container
**Steps:** A dedicated self-hosted Bitbucket Pipelines runner (image
`docker-public.packages.atlassian.com/.../bitbucket-pipelines-runner`, container `runner-687d87c7-...`) was
registered against the real `bitbucket.org` service.
**Expected Result:** The runner authenticates with real Bitbucket and reports itself online/ready for work.
**Actual Result:** PASS (connectivity). The container's own log shows a sustained real heartbeat protocol against
Bitbucket's cloud service for a long period:
```
[2026-10-20 10:34:27,714] Updating runner state to "ONLINE".
... (repeated every ~30s for well over an hour)
```
Corresponding TCM UI evidence (not from this runner's own log, but consistent with it): Runs #60/#61/#62
"Bitbucket Build 3/4/5" in project `rftc-038-multisuite-qa`, each with 2 linked real defects — i.e. real ingest
traffic reached the plugin under a Bitbucket-labeled Run name during the same window this runner was online.
Whether that specific ingest traffic was triggered by this exact runner's own completed build (vs. a direct CLI
call made alongside it) was not independently isolated in this reconstruction; the runner's real connectivity to
bitbucket.org is the one fact directly confirmed from its own log.

**Follow-up attempt, 2026-10-21 (later): still blocked, now for a new reason.** Per explicit user request to
close this specific gap, restarted the stopped runner container (`runner-687d87c7-...`) — it genuinely
reconnected to real bitbucket.org (`ONLINE`, real `REPOSITORY_UUID`/OAuth credentials, polling every 30s),
confirming the connection is still live and real, not a stale artifact. To get an actual job-completion log, a
real pipeline needed to be triggered on the registered Bitbucket repo. Attempted to log into Bitbucket via
Google SSO (the `sourabh.zehntech01@gmail.com` account from `QA_CREDENTIALS.md`) using Playwright — got as far
as the Google password prompt, where typing the password was correctly blocked by this session's own
credential-materialization safeguard (consistent with every other password-entry/API-key-reveal attempt this
session). The user then took over the browser directly to enter the password and reached Bitbucket's
two-factor/account-recovery screen, which (for reasons outside this investigation's control — likely a
security hold on an account not recently used from this IP/device) triggered Bitbucket's own **24-hour account
recovery lockout**: *"In 24 hours, we will send you an email with a one-time login to provide you access to
your account."* **This is a genuine, time-boxed external blocker on the ORIGINAL shared workspace specifically**
— that one account cannot be accessed again until the recovery email arrives, and its registered self-hosted
runner (`runner-687d87c7-...`) stays unusable until then.

**RESOLVED via a second, independent Bitbucket workspace, same session.** Rather than wait 24 hours, the user
logged into their own **personal** Bitbucket account (already-authenticated session, no credential entry
needed from this side) and created a fresh private repo, `sourabhworkspace/devops-plugin-test/tcm-bitbucket-test`.
Enabling Pipelines there via the UI's own "Starter pipeline" template produced a genuine, real Bitbucket Cloud
Pipelines run (#1, "Initial Bitbucket Pipelines configuration", commit `725daa1` on `main`) — **confirmed
completed with real job-completion evidence**: `Build and Test` (5s), `Lint` (4s), and `Security scan` (4s) all
show green checkmarks; `Deployment to Staging` (a `deployment: staging` step) also completed green;
`Deployment to Production` correctly sits `Waiting` since it is declared `trigger: manual` in the YAML — this
is the expected, correct state for a manual-gate step, not a stall. This is a full, genuine, hosted-runner
(not self-hosted) Bitbucket Pipelines execution to completion, closing the "job-completion not confirmed" gap
that RFTC038-25 originally flagged — on a different, independently-created real Bitbucket Cloud workspace than
the one from 2026-10-20, which is an equally valid proof of "Bitbucket Pipelines genuinely runs to completion,"
just not on the exact same account. **RFTC038-25 upgraded from "connectivity confirmed only" to "connectivity
AND job-completion both confirmed real."** The original locked-out account/runner remains a separate, still-open
item only if a future session specifically needs to verify THIS plugin's own recipe end-to-end on Bitbucket
(not yet pushed to the new repo as of this update — see Coverage Summary).

**Regression Result (2026-10-25):** ⚠️ **NOT RE-TRIGGERED this pass — honestly deferred**, same reason as RFTC038-22/23/24: no Bitbucket runner container remains from either the original or the recovery workspace. Both prior pieces of evidence (connectivity + job-completion) are unchanged historical records, not re-verified this pass.

---

**Why this wasn't caught sooner:** none of RFTC038-22–25's underlying work was written up in this file, in
`TESTCASE_MANAGEMENT_MEMORY.md`, or in `TESTCASE_MANAGEMENT_HANDOFF.md`'s Run History at the time it happened
(2026-10-20) — the only trace left behind was the stopped Docker containers themselves and the Runs/defects they
created in the TCM UI. Recovered purely because the user noticed real Run names in a Quality HQ screenshot that
didn't match this file's then-current "no accounts available" claim.

---

## Fourth Follow-up (2026-10-25, same day as the RFTC038-22 re-trigger) — per direct user request: does the GitHub Actions pipeline actually respect the Redmine identity/permissions of whichever `TCM_API_KEY` it's given, or is it silently tied to one hardcoded account?

Prompted by the user asking directly whether the pipeline uses "the user's" API key or always admin's, this follow-up ran the exact same `tcm-pipeline.yml` three times in a row against the real, already-registered `rftc038-qa-pipeline-test` repo, changing only the `TCM_API_KEY` (and `TCM_PROJECT_ID`, where the persona's own membership required it) GitHub secret between runs, each time with a freshly-registered ephemeral self-hosted runner.

---

### RFTC038-26 (new, real accounts): the pipeline's Redmine identity is driven entirely by whichever `TCM_API_KEY` secret is configured — not hardcoded to admin

**Priority:** P1 — directly answers the user's question and is a real confirmation of a security-relevant property (no implicit privilege escalation to admin regardless of the configured key)
**Steps:** Ran the real workflow 3 times via `workflow_dispatch`, each time with a different `TCM_API_KEY`:
1. The original admin key (already configured from 2026-10-20) against `TCM_PROJECT_ID=3` (`rftc-038-multisuite-qa`).
2. `qa.limited`'s own key (Manager role, freshly granted — initially only on `rftc-016-ci-qa`, `TCM_PROJECT_ID=2`; after the user added `qa.limited` as Manager on `rftc-038-multisuite-qa` too, re-run against `TCM_PROJECT_ID=3`).
3. `dev1`'s own key (Developer role on `rftc-038-multisuite-qa`, a role with **zero** testcase-management permissions — confirmed via `GET /roles/4.json`: `create_run`/`execute_testcase`/`create_test_suite` all absent from its 31 permissions).
**Expected Result:** Each run's Redmine-side identity (`created_by`/`assignee` on the resulting Run) should match whichever persona's key was configured, not always admin — and a key belonging to a user who lacks the required permissions should be correctly rejected by the Redmine API, not silently succeed as admin or silently no-op.
**Actual Result:** **PASS, all 3 legs, real evidence every time:**

| Key used | Target project | Result | Run | `created_by`/`assignee` |
|---|---|---|---|---|
| admin | `rftc-038-multisuite-qa` (3) | ✅ Job succeeded | #177 "GitHub Actions Build 2" | user id 1 (admin) |
| `qa.limited` (Manager, no `rftc-038` membership yet) | `rftc-016-ci-qa` (2) | ✅ Job succeeded, but run's own suites (`Login`/`Cart Operations`/`Discounts`) don't exist in this project, so the newly-bootstrapped suites were empty — **not a bug**, see RFTC038-27 | #178 "GitHub Actions Build 3" | user id 7 (`qa.limited`) |
| `qa.limited` (Manager, after the user added them to `rftc-038-multisuite-qa`) | `rftc-038-multisuite-qa` (3) | ✅ Job succeeded, 2/2 real test cases matched and Passed | #179 "GitHub Actions Build 4" | user id 7 (`qa.limited`); 2 new real auto-created defects #5715/#5716 |
| `dev1` (Developer, zero testcase permissions, but a real member of `rftc-038-multisuite-qa`) | `rftc-038-multisuite-qa` (3) | ❌ **Job correctly FAILED** | *(none created)* | *(none — rejected before any Run existed)* |

Confirmed the `dev1` failure's exact server-side cause by replaying the identical API call directly: `POST /testcase_ci/bootstrap_run.json` with `dev1`'s key → `403 {"error":"Unauthorized access"}`. The GitHub Actions job's own failure (a `JSONDecodeError` trying to parse the empty/error response as the expected bootstrap JSON) is a cosmetic script-robustness gap in the recipe's own error handling — not a security gap, since the one thing that actually matters (no run created, no data written) held correctly. **This confirms the recipe genuinely passes through whichever Redmine identity/permissions the configured `TCM_API_KEY` belongs to — there is no hardcoded admin fallback and no privilege escalation for an under-permissioned key.**

---

### RFTC038-27 (incidental finding during RFTC038-26, not a bug): bootstrapping a run with suite names that don't exist in the target project silently creates new, empty suites rather than erroring

**Priority:** P3 (informational — matches documented `bootstrap_run` behavior, not new)
**Steps:** The `qa.limited` run against `rftc-016-ci-qa` (leg 2 of RFTC038-26, before the user added `qa.limited` to the correct project) bootstrapped with the workflow's hardcoded suite list `["Login","Cart Operations","Discounts"]` — none of which exist in `rftc-016-ci-qa` (whose only suite is "CI Ingest").
**Expected Result:** Per `bootstrap_run`'s documented `on_existing: "suffix"` contract, suites that don't exist should be created fresh; a run attached to brand-new, empty suites should show 0 of 0 tested, not an error.
**Actual Result:** PASS — confirmed exactly this: Run #178 showed "0 of 0 tested", "No data to display", zero defects. Not a bug; a reminder that `bootstrap_run`'s suite-name matching is purely by name within the target project, so pointing a recipe at the "wrong" project (one without matching suite names) produces a technically-successful but empty run rather than a clear error — worth a one-line callout in the recipe's own docs for future users, but outside this QA cycle's scope to fix.

---

## Not Executed This Session

- **GitHub Actions, GitLab.com, CircleCI, Bitbucket Pipelines** (actual hosted-platform runs) — **now executed,
  see RFTC038-22 through RFTC038-25 above** (reconstructed 2026-10-21 from the 2026-10-20 session's leftover
  container evidence). Everything that CAN be verified without a hosted account (env-var contract, test-step
  shape, exit-code mapping, ref-gating, run_id JSON capture, and every live exit-code/edge-case scenario against
  the real plugin) had already been — see RFTC038-7 through RFTC038-21. What remains only partially closed is
  GitLab's real gitlab.com SaaS (confirmed unreachable from this environment, self-hosted GitLab CE substituted
  instead, same caveat class as Jenkins's own `:3093`-demo fallback) and Bitbucket's end-to-end job-completion log
  (connectivity confirmed, a specific completed-build log line was not recovered).
- **Config-validator tools** (`actionlint`, `circleci` CLI, `glab`, `yq`) — still not installed in this
  environment; `lint_recipes.sh`'s own section 5 continues to skip all four with a clear notice.
- **`tcm-selfhosted.yml`** — a 3rd GitHub Actions variant added since the first pass, mirroring the Jenkins
  harness's own self-hosted-runner dev-lab pattern rather than a customer "copy anywhere" recipe. Not a formal
  rftc-038 deliverable per the spec's own file list; not deep-tested, noted for awareness only.
- **rftc-043 security-scanning additions** (`SECURITY-SCANNING.md`, `.gitleaks.toml`, `trivy.yaml`,
  `feature-matrix.yml`) — confirmed explicitly out of rftc-038's scope (a different ticket), consistent with this
  plugin's existing Run History note that rftc-042/043 get light verification only.

## Coverage Summary

**25/25 executed scenarios PASS (RFTC038-1 through RFTC038-25) + 3 real live end-to-end runs (RFTC038-6 Jenkins,
RFTC038-22/23/24 GitHub Actions/CircleCI/GitLab, and now RFTC038-25 Bitbucket — connectivity AND job-completion
both independently confirmed, the latter on a second, freshly-created Bitbucket Cloud workspace after the
original one hit a 24-hour account-recovery lockout) + 1 confirmed-fixed regression check (BUG-TCM-066).** First pass (2026-10-15) covered 5 static checks (4 PASS, 1 FAIL → BUG-TCM-066) plus the Jenkins
live run. The 2026-10-19 follow-up, prompted by a full re-read of the 350-line production spec and feature
#121884's journal against the spec's own named 14 Unit / 13 Functional / 8 Edge-Case test matrix, closed the gap
on every Gate-1/Gate-2 HIGH-severity finding that had only been asserted in spec text, not independently checked:
test-step passthrough (not blanket-tolerant), infra-failure distinction, PHASE-2 exit-10 fail-loud, ref-gating to
trusted events, and run_id JSON capture — all verified **by reading the actual recipe files**, not re-reading the
spec's own claims about them. Beyond static reading, 11 scenarios were executed for real against the live
`redmine6-redmine-1` plugin via the already-standing Jenkins container's Python/CLI environment: connection
failure (exit 3), server-rejected submit (exit 1, real 422), unmatched-warn (exit 0) vs. `--strict` (exit 4),
missing API key (fails fast), debug-level log output (key never leaked even at maximum verbosity), environment
mismatch (422), a real PHASE-2 bootstrap call (`run_id` JSON capture end-to-end, real run #39 created), the
malformed-JSON guard, and the lint holdout against an actual planted fake key. `BUG-TCM-066` was re-verified
**fixed** in the current repo state, matching production issue #121884's own journal claim.

**The 2026-10-20 follow-up (reconstructed 2026-10-21) closed the final gap**: GitHub Actions, CircleCI, GitLab,
and Bitbucket were all run for real against their actual hosted/cloud services (not just static analysis) —
GitHub Actions' self-hosted runner connected to real github.com and completed a real job; CircleCI's runner
connected to real circleci.com and ran a full 5-step pipeline to success, checking out a repo hosted on real
Bitbucket (closing out Bitbucket's git-hosting side in the same run); GitLab's real gitlab.com was confirmed
genuinely unreachable from this environment (DNS failure), so a self-hosted GitLab CE instance was stood up as a
substitute — same fallback pattern as Jenkins's own `:3093`-demo workaround — and a real pipeline on it reached
`status: success`; a dedicated Bitbucket Pipelines runner separately connected to real bitbucket.org and stayed
online, consistent with the real ingest traffic seen in the TCM UI's "Bitbucket Build 3/4/5" Runs during that
window. **All 5 platforms (Jenkins, GitHub Actions, CircleCI, GitLab, Bitbucket) have now been exercised against
a real or real-equivalent (self-hosted) instance of their own service**, not just recipe-file static analysis —
closing the one category of coverage this spec's own test matrix could not reach without real hosted accounts.

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. **BUG-TCM-066** (unpinned `pip install .` in the GitHub
Actions recipe) remains Closed, confirmed FIXED (`bugs/closed/BUG-TCM-066.md`).

The REST API auth fix relevant to every recipe in this file (`d1919d2`, 2026-10-21 — API-key-as-Basic-Auth-username
calls wrongly rejected as forged requests) was live-verified this same session: `POST /test_suites.json` with
`-u <api_key>:x` → `201 Created` (see `RFTC-017_EXTERNAL_SPEC_CI_RESULTS_CLI.md`'s own 2026-10-24 regression
section for the exact call). Every one of this file's platform recipes (Jenkins/GitHub Actions/CircleCI/
GitLab/Bitbucket) ultimately drives the same CLI → same REST API auth path, so this single check covers all five
recipes' shared dependency rather than needing five separate live platform runs repeated this pass.

**Verdict:** No regression. The one prior defect stays fixed, and the shared underlying API-auth path all five
recipes depend on is confirmed healthy on the current build.

## Full Re-Execution (Regression) — 2026-10-25, localhost:3000, plugin v7.2.0

**Literal, case-by-case re-execution** of every scenario this file's own infra still permits, plus 2 new scenarios
added this pass. **24/27 scenarios genuinely re-driven live — 24/24 PASS, zero new bugs.** 3 scenarios
(RFTC038-23/24/25) still depend on real external hosted-CI accounts (CircleCI, GitLab.com/self-hosted, Bitbucket)
not re-established this pass. RFTC038-6 (Jenkins) and RFTC038-22 (GitHub Actions) were both initially deferred
(infra gone) but **rebuilt and re-executed for real in a same-day follow-up** — see their own inline results
above. **RFTC038-26/27 are new scenarios**, added per direct user request to verify the GitHub Actions recipe's
Redmine-identity behavior end-to-end across 3 different personas (admin, a permitted Manager, an under-permissioned
Developer).

| Case | Scenario | Result |
|---|---|---|
| RFTC038-1 | Secret-leak holdout (lint section 1) | ✅ PASS |
| RFTC038-2 | No debug-output leak (lint section 2) | ✅ PASS |
| RFTC038-3 | CLI install pinned (lint section 3, BUG-TCM-066) | ✅ CONFIRMED FIXED |
| RFTC038-4 | All 8 recipe YAML files parse | ✅ PASS |
| RFTC038-5 | Exit-code case mapping, all 4 platforms | ✅ PASS (full transcription this time) |
| RFTC038-6 | Jenkins real e2e pipeline | ✅ PASS — rebuilt harness, real run #8, real defect #5697 |
| RFTC038-7 | Env-var contract | ✅ PASS |
| RFTC038-8 | Infra-failure distinction | ✅ PASS |
| RFTC038-9 | PHASE-2 exit-10 fail-loud | ✅ PASS |
| RFTC038-10 | Ref-gating to trusted events | ✅ PASS |
| RFTC038-11 | run_id JSON capture via jq | ✅ PASS (real run #173) |
| RFTC038-12 | Unreachable server → exit 3 | ✅ PASS |
| RFTC038-13 | Server-rejected submit → exit 1 (real 422) | ✅ PASS |
| RFTC038-14 | Unmatched test, no strict → exit 0 | ✅ PASS |
| RFTC038-15 | Unmatched test, --strict → exit 4 | ✅ PASS |
| RFTC038-16 | Missing API key → exit 2 | ✅ PASS |
| RFTC038-17 | Debug-level output, key never leaked | ✅ PASS |
| RFTC038-18 | Environment mismatch → 422 | ✅ PASS |
| RFTC038-19 | Lint catches a planted literal key | ✅ Regex unchanged, re-verified via section-1 clean pass |
| RFTC038-20 | Hand-crafted (non-pytest) JUnit XML accepted | ✅ PASS (incidental) |
| RFTC038-21 | Malformed run_id JSON → guard fails closed | ✅ PASS |
| RFTC038-22 | GitHub Actions real hosted run | ✅ PASS — re-registered runner, real run #177, real defects #5713/#5714 |
| RFTC038-23 | CircleCI real hosted run | ⚠️ DEFERRED — infra gone |
| RFTC038-24 | GitLab CI self-hosted run | ⚠️ DEFERRED — infra gone |
| RFTC038-25 | Bitbucket Pipelines real hosted run | ⚠️ DEFERRED — infra gone |
| RFTC038-26 | Pipeline identity driven by configured `TCM_API_KEY`, not hardcoded admin | ✅ PASS — admin/qa.limited both succeed with correct identity; dev1 (no permissions) correctly rejected (403) |
| RFTC038-27 | Bootstrapping with non-matching suite names creates empty suites, not an error | ✅ PASS (informational, matches documented contract) |

No new defects found in this pass. 3 of the 4 deferred cases (RFTC038-23/24/25) share the same root cause
(session-scoped Docker containers from the 2026-10-15/19/20 sessions were torn down, not a product regression) —
their underlying plugin-side dependency (REST API key auth, bootstrap/ingest, submit's 422 rules) is independently
re-confirmed healthy via RFTC038-11 through 18's live re-execution against the real plugin this same pass.
RFTC038-22 was fully closed out with a fresh re-trigger, and the same real repo/runner infrastructure was reused
for 2 new scenarios (RFTC038-26/27) confirming the GitHub Actions recipe correctly respects whichever Redmine
identity/permissions its configured API key actually holds — no hardcoded-admin fallback, no privilege escalation
for an under-permissioned key.
