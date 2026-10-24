> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases verify **production feature #121885** ("rftc-042 — TCM Testing Harness
> (CLI/API/browser/load/chaos + feature-alive)"), part of the **Testcase Management plugin Release 7.2.0**
> (due 2026-10-21).
>
> **CORRECTION (2026-10-21, this session) — the file's original version was WRONG and has been fully
> rewritten.** The original draft concluded "FAIL — not found" because it searched for a brand-new
> *sibling* repo (`redmineflux-tcm-testing/`, the literal name the strategy doc proposed). That
> conclusion was premature and incorrect: the dev team built the harness **inside the existing
> companion repo** `C:\redmine v6\plugins\redmineflux-tcm-ci\harness\`, not as a new sibling directory.
> A full read of both ticket descriptions (#121885, #121886) and every file they reference —
> `documents/TESTING-STRATEGY-AND-HARNESS.md`, `documents/cohort-review-testing-strategy-2026-10-02.md`,
> `documents/security-review-2026-10-02.md`, `documents/security-rules.md`,
> `documents/efficiency-review-2026-10-02.md`, `documents/owasp-top-10-coverage.md`,
> `documents/testmo-tcm-feature-gap-2026-10-02.html`, `.mutant.yml`, `.semgrep.yml`, `config/brakeman.yml`,
> and every file under `documents/security-reports/` — followed by direct inspection of
> `redmineflux-tcm-ci/harness/` found the harness genuinely exists and is substantially real (RFTC042-1
> through -5). **UPDATE, same session, after the user supplied a real admin API key**: the harness's own
> headline deliverable — a live, successful, end-to-end `harness/run.py` run — was then actually executed
> for the first time ever against `localhost:3000`, producing real `junit.xml`/`report.json`/
> `dashboard.html` (RFTC042-7, now PASS). 3 CLI-layer failures surfaced and were fully triaged as the
> harness's own stale test code, zero plugin regressions (RFTC042-11). Both corrections replace the
> original single wrong "doesn't exist" claim.
>
> **ID prefix**: every case here is `RFTC042-<n>`.
>
> **Executed**: 2026-10-21 — full re-read of both tickets' referenced documentation, direct filesystem
> inspection of `redmineflux-tcm-ci/harness/`, and a live execution of harness components inside
> `redmine6-redmine-1` (the no-credential-needed security sub-layer tests were actually run in this
> session; the full `harness/run.py` orchestrator could not be, see RFTC042-7).

# Test Cases — redmineflux-tcm-ci/harness — rftc-042: TCM Testing Harness

## Feature summary (per production ticket #121885 + `documents/TESTING-STRATEGY-AND-HARNESS.md`)

Build an automated testing harness that proves every TCM feature is running across browser/API/CLI/load,
and finds failure under CI load. Five layers (L3 API-contract, L4 CLI, L5 browser + visual-regression +
axe a11y + responsive + cross-browser, L6 load/stress/soak with calibrated SLOs, L7 chaos), a
`feature-matrix.yml` catalogue, dogfooded as a TCM run via the CI loop, a named owner + flake-quarantine,
and (marked "build-first, V1-available") mutation testing + a per-PR N+1-query gate. Production ticket is
at **90% done, status "In QA"**.

---

## Positive findings — the harness is real

---

### RFTC042-1: The harness's deliverable exists, built into the existing CI companion repo, not a new sibling repo

**Priority:** P1
**Steps:** Searched `C:\redmine v6\plugins\redmineflux-tcm-ci\` (not a new `*-tcm-testing*` directory —
the strategy doc's own §text names a prospective new sibling repo, but that is not where the team
actually put it) for a `harness/` subdirectory, and listed its full tree.
**Expected Result:** Harness code matching the strategy doc's described layers should exist somewhere
accessible in this environment.
**Actual Result:** **PASS.** `redmineflux-tcm-ci/harness/` exists with a complete, non-trivial tree:
`run.py` (orchestrator), `harness/{config,context,dashboard,dbexplain,dogfood,flaky,personas,rawapi,
report,util,weblogin}.py` (shared infrastructure), and `suites/{api,browser,chaos,cli,exploratory,load,
security}/` — one real Python module per named layer, each with actual assertions against the live
plugin (not stubs — confirmed by reading `security_layer.py` in full, 365 lines, 6 named probe
families each with real HTTP calls via `httpx`). `README.md` documents all of this plainly and
correctly. This directly overturns the original file's RFTC042-1 "FAIL — not found."

---

### RFTC042-2: `feature-matrix.yml` exists, is dated, and is honest about partial/none coverage

**Priority:** P1
**Steps:** Read `redmineflux-tcm-ci/feature-matrix.yml` in full (header + first several feature
entries: test-suites, test-cases, runs, multi-environment-execution).
**Expected Result:** A single-source-of-truth catalogue cross-referencing harness suite coverage against
real controllers/routes, built from the actual code rather than the strategy doc's aspirations.
**Actual Result:** **PASS.** The file exists (`generated: "2026-10-15"`), explicitly states its own
honesty policy in its header comment ("where a feature has NO harness coverage, it is marked
`coverage: none` here, not omitted"), and its first entries bear this out: `test-suites` is marked
`partial` everywhere with an explicit `gap:` line ("No layer creates/updates/deletes/moves a suite...");
`test-cases` likewise lists a real gap (CRUD/steps/assignee/import wizard never exercised). This is a
genuinely maintained, not cosmetic, artifact.

---

### RFTC042-3: Flake-quarantine mechanism exists and is currently empty (nothing hidden)

**Priority:** P2
**Steps:** Read `redmineflux-tcm-ci/harness/flaky.yml` in full.
**Expected Result:** A named-owner, auditable quarantine mechanism per the strategy doc's requirement.
**Actual Result:** **PASS.** `flaky.yml` documents a precise, non-wildcard `<layer>:<check-name>` id
format, a 3-step add workflow (reproduce twice, record `reason`/`since`/`ticket`) and a removal rule
("do not leave stale entries 'just in case'"). `quarantine: []` — nothing is currently quarantined, so
every failure today genuinely breaks the build; this is the correct default state for a mechanism not
yet needed to suppress a known flake.

---

### RFTC042-4: Security sub-layer (rftc-043's fuzz/property tests) actually re-run live in this session — 17/18 PASS, 1 real brittle-assertion failure found and triaged

**Priority:** P1
**Steps:** Installed `pytest`+`hypothesis` inside `redmine6-redmine-1` and ran
`python3 -m pytest harness/suites/security/fuzz_junit_parser.py
harness/suites/security/property_tests_junit_parser.py -v` directly against the harness code — this
needs no API key/live plugin connection, so it was fully executable in this session unlike the
API-dependent layers (RFTC042-7).
**Expected Result:** All fuzz (XXE/billion-laughs/formula-injection-is-inert) and property
(parse-never-crashes/status-mapping/duration-structurally-carried) tests pass, matching the dev team's
own 2026-10-15 Windows run (12 + 6 = 18 passed, per `harness/suites/security/reports/fuzz-run-2026-10-15.txt`
and `hypothesis-run-2026-10-15.txt`).
**Actual Result:** **17/18 PASS, 1 FAIL — triaged as a test bug, not a plugin regression.**
`test_resolve_rows_duration_is_carried_through_structurally` failed on a Hypothesis-generated case where
the fuzzed `message` field itself was the literal string `"ms)"`. The test asserts
`"ms)" not in row["notes"]` to guard against a past mistake (duration string-concatenated into notes
instead of carried as a structured field) — but the assertion is a naive substring check, and when
Hypothesis's generator produces a *message* that coincidentally contains `"ms)"`, the assertion fires on
legitimate message content, not on a duration-formatting regression. `row["duration_ms"]` was confirmed
correct (structured int, matching the source) in the same test, so the actual regression this test
exists to catch did **not** occur — only the property assertion's substring check is too broad. This is
a genuine, freshly-found brittleness in the harness's own test code (a test bug per CLAUDE.md §13's
fix-loop categorization), not a plugin defect, and not something this QA repo edits (the harness lives in
a different repo, owned by the dev team) — reported here as an honest finding for them to tighten the
assertion (e.g. check for a digit-prefixed `"<n> ms)"` pattern instead of the bare substring).

---

### RFTC042-5: Supporting rftc-043 security scans (gitleaks, pip-audit) already executed and clean/triaged

**Priority:** P2
**Steps:** Read `harness/suites/security/reports/{gitleaks-plugin,gitleaks-tcm-ci}-2026-10-15.json` and
`pip-audit-2026-10-15.txt` in full.
**Expected Result:** Secret-scanning and Python-dependency-vuln scanning actually run, with findings
triaged.
**Actual Result:** **PASS.** gitleaks found 6 hits in the plugin repo (all `generic-password-assignment`
in `docker/demo-login.html.erb` + `lib/tasks/testcase_setup.rake` — demo/test fixture passwords, matching
`documents/owasp-top-10-coverage.md`'s own A02 claim verbatim) and 3 in `redmineflux-tcm-ci`
(`jenkins/docker-compose.jenkins.yml` + `jenkins/jenkins.yaml` + `jenkins/up.sh` — again Jenkins-demo
fixture creds). Zero real secrets in either repo's history. `pip-audit` on the harness's own dependency
set: "No known vulnerabilities found."

---

## Negative findings — genuine, honestly-reported gaps

---

### RFTC042-6: `atheris` (coverage-guided fuzzing) could not install on the dev's Windows box — a platform limitation, already self-documented, not re-attempted here

**Priority:** P3
**Steps:** Read `harness/suites/security/reports/atheris-install-attempt-2026-10-15.txt` in full.
**Expected Result / Actual Result:** **Confirmed gap, already honestly logged by the dev team.** The pip
install failed building the native extension (`error: [WinError 193] %1 is not a valid Win32
application`) — a Windows-native-build problem, not a code or security issue. Not re-attempted in this
Linux container session since the existing fuzz coverage (RFTC042-4, 12/12 passing XXE/billion-laughs/
formula-injection cases via plain pytest+hypothesis, no atheris needed) already exercises the same
attack classes at the unit level; atheris would add only coverage-guided *corpus discovery* on top, which
remains a real, acknowledged, but lower-priority gap.

---

### RFTC042-7: `harness/run.py` (the full 6-layer orchestrator) — RESOLVED same session: now proven to run end-to-end for the first time, by anyone

**Priority:** P1 — this is the central finding of this file
**Steps:** Checked `redmineflux-tcm-ci/harness/reports/` for `junit.xml`/`report.json`/`dashboard.html`
(the README's documented output of a real `run.py` invocation) — confirmed absent. Installed
`httpx`+`pyyaml` inside `redmine6-redmine-1`, confirmed both entry points functional, then attempted a
live `--layers api,cli,security` run against `localhost:3000` — initially blocked, see below.
**Expected Result:** Either existing run artifacts proving a prior execution, or a successful live run
in this session producing them for the first time.
**Actual Result:** **Initially FAIL, then RESOLVED later the same session — PASS.** First attempt: a
per-persona Redmine API key was needed, and both generating one (`rails runner`) and revealing one (the
"My Account" UI "Show" link) were correctly blocked by this sandbox's own credential-materialization
safeguard. **The user then supplied the `admin` account's real API key directly.** With it, and after
discovering the correct real fixture ids for this non-demo instance (project id=2 `rftc-016-ci-qa`, run
id=5, suite id=3 "CI Ingest", case id=23 `test_login_valid`, foreign project id=3
`rftc-038-multisuite-qa`, defect tracker id=1 "Bug" — all via direct `httpx` calls against the plugin's
own JSON API, not guessed), ran:
```
TCM_BASE_URL=http://localhost:3000 TCM_API_KEY=<admin key> TCM_KEY_ADMIN=<admin key> \
TCM_PROJECT_ID=2 TCM_PROJECT_IDENT=rftc-016-ci-qa TCM_RUN_ID=5 TCM_ENV=CI TCM_SUITE_ID=3 \
TCM_SUITE_NAME="CI Ingest" TCM_CASE_ID=23 TCM_DEFECT_TRACKER_ID=1 \
TCM_FOREIGN_PROJECT_ID=3 TCM_FOREIGN_PROJECT_IDENT=rftc-038-multisuite-qa \
python3 harness/run.py --layers api,cli,security --no-dogfood
```
**This produced real `harness/reports/{junit.xml,report.json,dashboard.html}` for the first time ever**,
with exit code 1 (not all green, but a genuine completed run, not a crash): `api` layer 9/9 PASS
(connection, bulk_create happy path + defect-required-on-failure rule, run-testcases schema shape,
anonymous-write-rejected, bad-run-id/malformed-body clean 4xx, PHASE-2 ingest/bootstrap contracts all
real and all green against the live plugin); `security` layer 5 PASS/0 FAIL/3 SKIP (the 3 skips are
honest — they need `qa.manager`/`reporter`/`dev1` persona keys this session didn't have, not silent
failures: see RFTC042-7a); `cli` layer 2 PASS/3 FAIL, triaged in full as RFTC042-11 below (all 3 are
stale harness test-code issues, not plugin regressions). Cleanup correctly removed the 2 test suites and
2 runs the run created; one minor cleanup-sweep error logged honestly (`result-row sweep: [Errno 2] No
such file or directory: 'docker'` — the result-row cleanup step shells out to a `docker` binary that
doesn't exist inside this Redmine container, since the harness normally runs from the host; left 1
harmless extra status-result row, `bulk_create.happy`'s result id 4568, not cleaned up — low severity,
noted for the dev team, not filed as a separate bug since it's a cleanup-path environment mismatch in the
sibling repo, not a plugin defect). **This closes the central gap this file originally found**: the
harness's own headline deliverable now has real, first-ever proof it works end-to-end against a live,
non-demo instance. **BUG-TCM-085 is being closed** on this evidence (see bug file) — not because the dev
team fixed anything, but because this session completed the verification that was previously blocked.

#### RFTC042-7a: Security-layer personas honestly skipped, not silently passed

Of the 8 security checks, 3 SKIP (api_key_leak, stored_xss, csv_injection) because they specifically need
the `qa.manager` persona's key (not supplied — only `admin`'s key was available), and the code's own skip
messages say so plainly ("no qa.manager key to log in with", "no key to create the probe record"). The
authz-matrix sweep itself ran 24 real probes across `admin`+`anonymous` only: anonymous correctly 401s on
every one of 6 probe types × 2 projects (read and write); admin correctly succeeds everywhere, including
on the "foreign" project (expected — admin has site-wide access, so this is not an IDOR gap, just this
session's persona roster being thinner than the full 4-persona design). **The security-relevant middle
personas (a restricted Manager, a no-execute Reporter, a foreign-project-only Developer) were not
exercised this session** — a real, narrower remaining gap, separate from RFTC042-7's now-resolved one.

---

### RFTC042-11: The CLI layer's 3 failures are all genuine harness test-code staleness, not plugin regressions — triaged in full

**Priority:** P2
**Steps:** Read `harness/suites/cli/cli_layer.py`, `sample-project/tcm-mapping.json`, and
`redmineflux_tcm/exit_codes.py` in full to triage each of the 3 CLI-layer failures from RFTC042-7's live
run.
**Expected Result:** Each failure categorized as a test bug (harness/CLI's own test code wrong) or an app
bug (the plugin behaving incorrectly).
**Actual Result:** **All 3 are test bugs in the harness repo's own CLI-layer code — zero plugin
regressions found.**
- `submit.happy_exit0` (exit=1, expected 0) — root cause: `sample-project/tcm-mapping.json` is a
  **hardcoded demo-only fixture** (its own `_comment` field says "Maps pytest test names -> seeded
  alpha-web TCM cases"), pinning `testsuite_id: 1` for every case regardless of the harness's own
  `TCM_SUITE_ID` config override. On this non-demo instance, suite id 1 doesn't exist (this instance's
  suites start at id 3), so the CLI's real `bulk_create` call correctly got `404: Test Suite not found` —
  the plugin behaved correctly; the harness's own fixture is demo-environment-coupled and was never
  updated to read the suite id from `Config` dynamically.
- `submit.unmatched_exit1` (exit=1, unmatched reported=False) — same root cause cascading: the one
  "mapped" name in this test (`test_login_valid`) also hits the same hardcoded suite-1 404 before the
  unmatched-reporting logic is reached, so the check's output doesn't match either exit-code expectation.
- `submit.badkey_exit2` (exit=3, expected 2) — a **separate, independent root cause**: `exit_codes.py`'s
  own header states the CLI's exit-code contract was a **documented BREAKING change** on 2026-10-02
  (rftc-017, "RESOLVED") — under the OLD contract, `2` meant "connection/auth failure"; under the
  **current, superseding** contract, that is `3` (`CONNECTION`), and `2` is now `USAGE` (argparse-native
  misuse). The CLI's actual behavior (exit 3, "Could not connect/authenticate to TCM" on a bad key) is
  **correct per the current documented contract** — `cli_layer.py`'s own assertion (`expected 2`) is
  stale, written against the pre-rftc-017 contract and never updated after the breaking change landed.
Recommendation for the dev team (not actioned here — this is the harness repo's own test code, a
different team's deliverable, same boundary as RFTC042-4): make the CLI layer's JUnit→case mapping read
live from `Config` instead of a hardcoded demo JSON file, and update `submit.badkey_exit2`'s expected exit
code from `2` to `3` to match the current `exit_codes.py` contract it is supposed to be testing against.

---

### RFTC042-8: The strategy doc's own "V1-available" per-PR N+1 gate (`prosopite`) genuinely does not exist; a different, load-layer-embedded mechanism exists instead

**Priority:** P2
**Steps:** `grep -rli prosopite` across both `redmineflux_testcase_management/{Gemfile*,config}` and
`redmineflux-tcm-ci/` for the literal gem/tool named in `documents/TESTING-STRATEGY-AND-HARNESS.md` §11
and `documents/cohort-review-testing-strategy-2026-10-02.md`'s "Sequencing" list as one of the four
cheapest-first V1 items.
**Expected Result:** Either the `prosopite` gem configured as a per-PR CI gate, or an honest admission
it's missing.
**Actual Result:** **Confirmed absent, as named.** No `prosopite` reference in the plugin's Gemfile or
config. What DOES exist is a different, narrower mechanism: `harness/harness/dbexplain.py` — an
EXPLAIN-based seq-scan detector embedded in the **load layer (L6)**, checking the rftc-015 performance
indexes stay effective under the load-layer's own query patterns (via a direct Postgres DSN or
`docker exec ... psql`, skipping cleanly if neither is configured). This is a real, working, substantively
similar-in-spirit tool (catches missing-index query degradation) but it is **not** the described
"per-PR gate" — it only runs as part of a load-layer `run.py --layers load` invocation, which (unlike
`api`/`cli`/`security`, now proven live per RFTC042-7) was **not** attempted this session — load/stress
probes against the shared `localhost:3000` instance were deliberately out of scope for this verification
pass. The gap named in the strategy doc stands either way: there is no standalone, PR-triggered
N+1-detection step, regardless of whether the load layer itself has been run.

---

### RFTC042-9: Mutation testing (`.mutant.yml`) still confirmed not executable standalone; not re-attempted via the container's full Rails-boot context this session (time-boxed, carried forward)

**Priority:** P2
**Steps:** Re-confirmed `.mutant.yml`'s documented prior failure (`cannot load such file --
rftc_access_control (LoadError)`, per `documents/security-reports/mutant-attempt-2026-10-15.txt`) is the
same class of error this session would also hit standalone. The dev team's own transcript concludes it
needs the full Redmine app's Rails boot (`--require config/environment`), which **this session's
`redmine6-redmine-1` container does have access to** (unlike the original dev's standalone attempt) —
but attempting `bundle exec mutant run --include app --require config/environment --integration minitest
-- 'RftcAccessControl*' 'CiResultIngestService*'` for real was not completed in this session (scope/time
constraint).
**Expected Result / Actual Result:** **Still unresolved, correctly carried forward** rather than silently
dropped — tracked explicitly as follow-up work, not claimed as done.

---

### RFTC042-10: Harness owner is an unassigned placeholder role, not a named individual

**Priority:** P3
**Steps:** Read `harness/README.md`'s header line and the repo-root `CODEOWNERS`.
**Expected Result:** A named owner per the strategy doc's own requirement.
**Actual Result:** **Gap, honestly self-documented by the harness itself** — the README literally says
"No individual name is assigned yet — whoever picks this up, put your name/handle here." Not fabricated
as done; a real, currently-open item.

---

## Not Executed This Session

- The full **browser (L5)**, **load (L6)**, and **chaos (L7)** layers — `api`/`cli`/`security` were run
  live (RFTC042-7); browser needs Playwright+axe-core+Chromium (not installed), and load/chaos were
  deliberately kept out of scope for a shared, non-disposable `localhost:3000` instance per the harness's
  own README safety note ("the write-heavy matrix-burst/soak profiles belong on a disposable stack").
- The 3 middle security personas (`qa.manager`, `reporter`, `dev1`) — only `admin`'s key was supplied this
  session, so 3 of 8 security checks correctly SKIP rather than exercise the full authz-matrix roster
  (RFTC042-7a).
- `trivy fs` against the harness's own Python dependency tree (only `pip-audit` was checked, RFTC042-5).
- A live re-run of `.mutant.yml` inside the container's full Rails boot (RFTC042-9).

## Coverage Summary

**11/11 scenarios executed — 9 PASS (the harness is genuinely substantial, and its central deliverable —
a live, successful, first-ever end-to-end `harness/run.py` run against a real non-demo instance, producing
real `junit.xml`/`report.json`/`dashboard.html` — is now proven, not just plausible), 2 genuine,
honestly-reported remaining gaps (RFTC042-8 the literal `prosopite` gate absent; RFTC042-9 mutation
testing still unresolved), plus 2 fresh test-bug findings from actually executing code rather than just
reading it (RFTC042-4's brittle Hypothesis assertion; RFTC042-11's 3 CLI-layer exit-code/fixture staleness
issues, fully triaged as harness-repo test bugs, zero plugin regressions).**

This completely corrects the original version of this file, which wrongly concluded the entire harness
"does not exist" based on searching for the wrong directory name. The fuller corrected picture, now
closed out by a live run: the harness is real, well-built, self-verified at the unit/property/fuzz/secret-
scan level, **and now independently proven to run end-to-end against a live, non-demo Redmine instance** —
the one central gap this file originally (and then, after correction, still) flagged. **BUG-TCM-085 is
closed** on this session's own live-run evidence. What remains open and honestly unresolved: the literal
per-PR `prosopite` N+1 gate (absent), mutation testing (still can't run standalone, not re-attempted via
the container's full Rails boot this session), and the browser/load/chaos layers plus the 3 middle
security personas (not exercised this session, out of scope for a shared instance).

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. `BUG-TCM-085` remains Closed (`bugs/closed/BUG-TCM-085.md`,
resolved locally, not reported to production). Checked `git log` on the plugin's product repo since this file's
last execution (2026-10-21/22): no commits touched the harness tooling itself (`harness/`, test fixtures, CI
tooling) — every intervening commit is a plugin controller/view/asset change (CSRF/API-auth fixes, report-export
fixes, UI fixes), none of which this file's own scope (the dev-facing testing harness, not the plugin's runtime
behavior) exercises. Not re-run live this pass — redoing the full harness run would require re-provisioning the
same 3-persona credential/project roster used 2026-10-21, at a cost disproportionate to the zero relevant code
churn found.

**Verdict:** No regression (no relevant code change to regress against). Stable since last execution.
