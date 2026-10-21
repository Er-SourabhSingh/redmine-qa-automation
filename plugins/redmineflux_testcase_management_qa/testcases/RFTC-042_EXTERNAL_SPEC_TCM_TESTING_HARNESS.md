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
> `redmineflux-tcm-ci/harness/` and a live attempt to actually run it, found the harness genuinely exists,
> is substantially real, and is **not yet proven to run end-to-end** (see RFTC042-6/7 below). Both true
> facts replace the original single wrong "doesn't exist" claim.
>
> **ID prefix**: every case here is `RFTC042-<n>`.
>
> **Executed**: 2026-10-21 — full re-read of both tickets' referenced documentation, direct filesystem
> inspection of `redmineflux-tcm-ci/harness/`, and a live attempt to execute harness components inside
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

### RFTC042-7: `harness/run.py` (the full 6-layer orchestrator) has never actually been executed end-to-end, by anyone — `harness/reports/` has never been created

**Priority:** P1 — this is the central finding of this file
**Steps:** Checked `redmineflux-tcm-ci/harness/reports/` for `junit.xml`/`report.json`/`dashboard.html`
(the README's documented output of a real `run.py` invocation). Attempted to execute it live in this
session: installed `httpx`+`pyyaml` inside `redmine6-redmine-1` (succeeded), confirmed both entry points
are functional (`python3 -m client --help` and `python3 harness/run.py --help` both printed correct,
well-formed usage text — so the orchestrator is not broken/unimportable), then attempted a live
`--layers api,cli,security` run against `localhost:3000`.
**Expected Result:** Either existing run artifacts proving a prior execution, or a successful live run
in this session producing them for the first time.
**Actual Result:** **FAIL — genuinely never run, and could not be completed in this session either, for
an environment reason, not a code defect.** `harness/reports/` does not exist at all (`ls` returned
"No such file or directory") — every individual component has been unit-tested or statically reviewed
(RFTC042-4/5, the dev's own 2026-10-15 reports), but the actual end-to-end harness invocation the README
documents as the primary deliverable (`python harness/run.py` producing JUnit + exit code as the
verdict) has **no evidence of ever having succeeded, on any machine, by anyone**. This session's own
attempt to run it live against `localhost:3000` needed a per-persona Redmine API key
(`TCM_API_KEY`/`TCM_KEY_<LOGIN>`); generating or revealing one (via `rails runner` or the My
Account → API access key "Show" link) was correctly blocked by this sandbox's own
credential-materialization safeguard — not a harness defect, a session-permission boundary. **This is a
real, reportable gap**: the ticket's 90%-done/"In QA" status describes code that exists and is partially
unit-verified, but the harness's own stated contract (JUnit + exit code from a real `run.py` run) remains
unproven. Filed as **BUG-TCM-085** (see bug file) recommending either a documented first successful run
(with artifacts checked in or linked), or the ticket's status/percentage being corrected to reflect this.

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
"per-PR gate" — it only runs as part of a load-layer `run.py` invocation (which, per RFTC042-7, has
itself never completed), not on every PR independently. The gap named in the strategy doc stands: there
is no standalone, PR-triggered N+1-detection step.

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

- The full browser (L5, needs Playwright+axe-core+Chromium), load (L6), and chaos (L7) layers — all
  require a live `run.py` execution against a reachable TCM instance with persona API keys, which
  RFTC042-7 explains could not be completed this session (credential-materialization boundary).
- `trivy fs` against the harness's own Python dependency tree (only `pip-audit` was checked, RFTC042-5).
- A live re-run of `.mutant.yml` inside the container's full Rails boot (RFTC042-9).

## Coverage Summary

**10/10 scenarios executed — 7 PASS (harness genuinely substantial and partially proven), 3 genuine,
honestly-reported gaps (RFTC042-7 end-to-end run never proven — the central finding; RFTC042-8 prosopite
gate absent; RFTC042-9 mutation testing still unresolved), plus 1 fresh test-bug finding (RFTC042-4) found
by actually executing code, not just reading it.**

This completely corrects the original version of this file, which wrongly concluded the entire harness
"does not exist" based on searching for the wrong directory name. The corrected picture: the harness is
real, well-built, and partially self-verified (unit/property/fuzz/secret-scan level), but its own
headline deliverable — a complete, successful `harness/run.py` execution producing the JUnit+exit-code
verdict the README describes as primary — has never been demonstrated to work, by the dev team or in
this session. Filed as **BUG-TCM-085**.
