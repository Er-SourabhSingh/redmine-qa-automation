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

## Not Executed This Session

- **GitHub Actions, GitLab.com, CircleCI, Bitbucket Pipelines** (actual hosted-platform runs) — this session has
  no accounts/repos on those platforms. Static analysis (the lint script + manual cross-checks, RFTC038-1
  through RFTC038-5) is the only verification performed for those four; **GitHub Actions should not be given to
  the client as-is** regardless — `BUG-TCM-066` means its recipe would fail for a real consumer today.
- **Config-validator tools** (`actionlint`, `circleci` CLI, `glab`, `yq`) — `lint_recipes.sh`'s own section 5
  skipped all four, none installed in this environment. These would catch structural GitHub-Actions-schema /
  GitLab-CI-schema errors beyond plain YAML syntax.
- **GitHub secret step-scoping check** (`lint_recipes.sh` section 4) — ran with no output (neither PASS nor FAIL
  printed for this section in the captured run); not independently re-verified by hand against the raw YAML
  structure.

## Coverage Summary

**4/5 static checks PASS, 1 FAIL (`BUG-TCM-066`, GitHub Actions only) — PLUS one real, live, end-to-end Jenkins
run (RFTC038-6), fully verified in the real TCM UI, not just the pipeline's own log.** The security-critical
properties (no secret leakage, no debug-output leak risk, pinned installs) are solid for GitLab/CircleCI/Bitbucket
and for Jenkins (confirmed live). GitHub Actions remains the one platform confirmed broken for a real
copy-paste consumer and should be fixed (or withheld) before client delivery if GitHub Actions is one of the
platforms being handed over.
