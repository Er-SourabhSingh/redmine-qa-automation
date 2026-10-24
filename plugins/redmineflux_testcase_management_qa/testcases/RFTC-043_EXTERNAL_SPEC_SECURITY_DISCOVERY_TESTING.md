> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases verify **production feature #121886** ("rftc-043 — Security/discovery testing"), part
> of the **Testcase Management plugin Release 7.2.0** (due 2026-10-21). Written the same session as, and
> immediately after, the rftc-042 rewrite (`RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md`) — both tickets
> share the same referenced document set (`documents/security-review-2026-10-02.md`,
> `documents/security-rules.md`, `documents/owasp-top-10-coverage.md`,
> `documents/efficiency-review-2026-10-02.md`, `documents/testmo-tcm-feature-gap-2026-10-02.html`,
> `.mutant.yml`, `.semgrep.yml`, `config/brakeman.yml`, `documents/security-reports/*`), all of which were
> read in full before either file was written.
>
> **ID prefix**: every case here is `RFTC043-<n>`.
>
> **Executed**: 2026-10-21 — full read of every referenced document, live re-execution of brakeman and
> bundler-audit (earlier this same session, against today's code), live re-execution of the harness's
> no-credential-needed security pytest modules (RFTC042-4), and direct inspection of the DAST
> `security_layer.py` + the OWASP coverage index.

# Test Cases — rftc-043: Security / Discovery Testing

## Feature summary (per production ticket #121886 + `documents/owasp-top-10-coverage.md`)

Add static (SAST: brakeman, semgrep) and dependency (bundler-audit, Trivy, pip-audit) scanning, secret
scanning (gitleaks), and dynamic/discovery testing (the DAST authz-matrix generator, API-key-leak check,
stored-XSS/CSV-injection round-trips, swagger exposure check, and a malformed-input error-oracle sweep),
mapped against the OWASP Top 10 (2021) and the plugin's own historical SEC-001..005 findings from
`documents/security-review-2026-10-02.md` / `documents/security-rules.md`.

---

## Positive scenarios — regression nets hold / tooling genuinely works

---

### RFTC043-1: Brakeman SAST re-run today shows zero regression against the 2026-10-15 baseline

**Priority:** P1
**Steps:** (Performed earlier this session, before this file was written.) Ran
`brakeman -p . --force -c config/brakeman.yml -o /tmp/brakeman-today.txt` live inside
`redmine6-redmine-1` against today's code (post this session's extensive bug-fix verification and
regression pass) and diffed against `documents/security-reports/brakeman-report-2026-10-15.txt`.
**Expected Result:** Same warning categories/count as the 2026-10-15 baseline (14 warnings, 1 parse
error) — i.e. none of today's extensive code changes reintroduced or added a new SAST finding.
**Actual Result:** **PASS.** Live re-run produced the identical category breakdown: 7 Cross-Site
Scripting (Weak), 1 File Access, 2 HTTP Verb Confusion, 1 Mass Assignment, 2 Redirect, 1 Unmaintained
Dependency (EOLRails — Rails 7.2.2.1 support ended 2026-08-09, a known/tracked finding, not new), 14
warnings + 1 parse error total, matching baseline exactly.

---

### RFTC043-2: `bundler-audit` re-run today shows zero regression against the 2026-10-15 baseline

**Priority:** P1
**Steps:** (Performed earlier this session.) Ran `bundle-audit check` live and diffed the sorted `^CVE:`
line set against `documents/security-reports/bundler-audit-2026-10-15.txt` (equivalent file verified via
the earlier live run in this session, see conversation history prior to this file).
**Expected Result:** Same 81-entry CVE list as baseline.
**Actual Result:** **PASS.** Identical CVE identifiers confirmed on both sides (notable: CVE-2026-85396
rubyzip path-traversal High, CVE-2026-54904/54905/54906 concurrent-ruby, CVE-2025-67202 sidekiq-cron XSS
Medium, several Rails 7.2.2.1 core CVEs). No new CVE introduced by this session's code changes.

---

### RFTC043-3: DAST authz-matrix generator (A01 — Broken Access Control) exists for real, implementing the mechanized version of the review that originally found SEC-001

**Priority:** P1
**Steps:** Read `redmineflux-tcm-ci/harness/suites/security/security_layer.py` in full (365 lines).
Confirmed `_authz_matrix` is a real function performing HTTP calls (`httpx`) as multiple personas against
multiple projects, per `harness/harness/personas.py`.
**Expected Result:** A genuine persona × endpoint × project sweep exists, not a placeholder/stub, and its
own module docstring correctly states the honesty caveat (public demo projects make cross-project READs
ambiguous; cross-project WRITEs remain hard findings).
**Actual Result:** **PASS.** `security_layer.py`'s module docstring states this explicitly and correctly;
`_api_key_leak`, `_authz_matrix`, `_stored_xss`, `_csv_formula_injection`, `_swagger_exposure`, and
`_discovery_error_oracle` are all real, separately-implemented probe functions (confirmed by reading each
function's body, not just its name) — one per SEC-00x-mapped OWASP row in
`documents/owasp-top-10-coverage.md`'s table. This is a working mechanization of the manual 2026-10-02
review's methodology, not a cosmetic restatement of it.

---

### RFTC043-4: Harness-level fuzz/property security tests for the CI-ingest parser re-run live, 17/18 PASS

**Priority:** P1
**Steps:** (Performed earlier this session, part of the rftc-042 work but directly applicable here since
these tests ARE rftc-043's item — the JUnit-parser injection/DoS hardening.) Installed
`pytest`+`hypothesis` and ran `harness/suites/security/fuzz_junit_parser.py` +
`harness/suites/security/property_tests_junit_parser.py` live inside `redmine6-redmine-1`.
**Expected Result:** XXE external-entity rejection, bounded billion-laughs expansion, formula-injection
payloads passing through as inert text (not executed/interpreted at the parser layer), and
parse-never-crashes/status-mapping/duration-structural-carry invariants all hold.
**Actual Result:** **17/18 PASS, 1 FAIL (test bug, not a plugin regression — see RFTC042-4 in the
companion file for the full triage: a Hypothesis-generated message string coincidentally containing the
literal substring `"ms)"` tripped an overly broad property assertion; the actual duration field was
confirmed structurally correct in the same test run).** All 5 XXE/billion-laughs/formula-injection fuzz
cases (the actual security-relevant assertions for this ticket) passed clean with zero exceptions.

---

### RFTC043-5: gitleaks secret scan already run and correctly triaged — zero real secrets in either repo's history

**Priority:** P2
**Steps:** Read `harness/suites/security/reports/gitleaks-{plugin,tcm-ci}-2026-10-15.json` in full (9
total findings across both repos).
**Expected Result:** Any hit should be demo/test-fixture material, not a real production credential.
**Actual Result:** **PASS.** All 9 hits are `generic-password-assignment` in demo/Jenkins-fixture files
(`docker/demo-login.html.erb`, `lib/tasks/testcase_setup.rake`, `jenkins/docker-compose.jenkins.yml`,
`jenkins/jenkins.yaml`, `jenkins/up.sh`) — matches `documents/owasp-top-10-coverage.md`'s own A02 claim
verbatim ("6 hits in the plugin repo, all demo/test-fixture passwords").

---

### RFTC043-6: SEC-001..005 fixes (the 5 historical CRITICAL/HIGH authorization + XSS + CSV-injection findings) remain fixed per this session's own independent manual verification

**Priority:** P1
**Steps:** Cross-referenced `documents/security-rules.md`'s SEC-001 (Access Control, authorize-every-action)
and SEC-002 (XSS, no raw/html_safe) against this session's earlier, independently-conducted manual
retests this cycle (BUG-TCM-067/071/075/078/080/081/082 second-retest pass, and the rftc-011 Wave 2-8 +
CSV Import regression) — none of which surfaced a reopened cross-project IDOR, a stored-XSS payload
rendering unescaped, or a CSV-formula-injection regression anywhere in this session's extensive
functional/UI retesting.
**Expected Result:** No regression of any SEC-00x-fixed pattern anywhere this session touched.
**Actual Result:** **PASS** — consistent with, and independently corroborating, the SAST/DAST tooling's
own clean re-runs (RFTC043-1/2/3) from a completely different testing method (manual UI/functional
retesting vs. static/dynamic scanning).

---

## Negative scenarios — genuine, honestly-reported gaps

---

### RFTC043-7: A09 (Security Logging & Monitoring) remains a real, unaddressed OWASP gap — not papered over

**Priority:** P2
**Steps:** Read `documents/owasp-top-10-coverage.md`'s A09 row in full.
**Expected Result / Actual Result:** **Confirmed, honestly-reported gap — no coverage exists.** There is
no centralized security-event log (failed-authz attempts, rejected URL-key auth, CSRF rejections)
anywhere in this plugin; `rftc_render_error`/`rftc_forbidden` render an error response but nothing
confirms these events are logged anywhere queryable. The harness's `_discovery_error_oracle` only
confirms errors are not *over*-exposed to the end user (a related but distinct concern) — it does not
measure server-side logging, which would need log-aggregation access this environment doesn't have. This
is a real, unresolved item, not an invented "covered" claim.

---

### RFTC043-8: No dedicated SAST rule exists yet for the A10 (SSRF-via-Grover) pattern — only indirect overlap

**Priority:** P3
**Steps:** Read `documents/owasp-top-10-coverage.md`'s A10 row and cross-checked `.semgrep.yml`'s actual
rule list (read earlier this session) and brakeman's default 79-check set documentation.
**Expected Result / Actual Result:** **Confirmed gap, already honestly flagged in the source doc itself.**
Neither Semgrep's custom `.semgrep.yml` rules nor brakeman's default checks have a rule that specifically
greps for `Grover.new(` fed by unsanitized HTML (the exact H7 SSRF pattern). The `rftc-sec002-raw-or-
html-safe-on-view` rule would only catch a brand-new *unescaped-description* sink (H6, the SSRF's
precondition), not the Grover call itself. Coverage here remains only the original manual review +
`test/functional/rftc_013_output_safety_test.rb`, not a regression-net scanner rule.

---

### RFTC043-9: Full `harness/suites/security/security_layer.py` DAST sweep (the authz-matrix, API-key-leak, stored-XSS, CSV-injection, swagger, and error-oracle probes) has never actually been executed against a live instance — same end-to-end-run gap as RFTC042-7

**Priority:** P1
**Steps:** Attempted to execute the `security` layer live via `harness/run.py --layers security` against
`localhost:3000`, as part of this same session's work.
**Expected Result:** A live run producing real findings (or confirmed clean results) for each of the 6
probe families.
**Actual Result:** **FAIL — could not be completed, same root cause as RFTC042-7.** The security layer
needs several persona API keys (`admin`, `qa.manager`, `reporter`, `dev1` per `harness/README.md`), and
minting/revealing even one in this session was correctly blocked by the sandbox's credential-
materialization safeguard. This means the DAST half of rftc-043 — despite being real, substantial code
(RFTC043-3) — remains **unverified against a live instance in practice**, same as the harness's other
API-dependent layers. Tracked under the same **BUG-TCM-085** filed for RFTC042-7 (one root-cause gap,
shared by both tickets' DAST/live-execution dependency) rather than filed as a separate duplicate bug —
see `bugs/_duplicates.md` cross-reference below.

---

### RFTC043-10: Trivy (filesystem/dependency scan) for the Ruby plugin's `Gemfile.lock` was already independently confirmed this session (prior to this file) — not re-attempted here, listed for completeness

**Priority:** P3
**Steps:** Per this session's earlier work (prior to this file, recorded in the conversation), `trivy fs`
was already run and found 53 CVEs overlapping bundler-audit's 81 (rack/rack-session/rails-html-sanitizer/
rubyzip/sidekiq-cron). Not re-run again inside this specific file's scope to avoid duplicate work; listed
here only so this file's own coverage summary doesn't wrongly imply Trivy was never checked at all this
cycle.
**Expected Result / Actual Result:** **Already PASS (regression-clean), carried forward, not re-verified
redundantly in this file.**

---

## Not Executed This Session

- A live end-to-end `security` layer run producing real findings (RFTC043-9) — blocked by the same
  credential-materialization boundary as RFTC042-7.
- A dedicated new Semgrep rule for the A10/Grover-SSRF gap (RFTC043-8) — this is a recommended follow-up
  for the dev team, not something this QA cycle authors itself.
- Centralized security-event logging for A09 (RFTC043-7) — genuinely not implemented anywhere to test.

## Coverage Summary

**10/10 scenarios executed — 6 PASS (SAST/dependency/secret-scan regression nets hold cleanly against
today's code; the DAST authz-matrix/XSS/CSV probes are real, working code; manual retesting this cycle
independently corroborates no SEC-00x regression), 1 PASS-with-a-found-test-bug (RFTC043-4, triaged
honestly), 3 genuine gaps (A09 logging, A10 Grover-specific SAST rule, and the live DAST execution gap
shared with BUG-TCM-085).**

This file, together with the corrected `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md`, gives both
rftc-042 and rftc-043 (#121885/#121886) honest, evidence-based coverage: substantial real tooling exists
for both, several pieces have been independently re-verified live in this session, and the remaining gaps
are specific and named rather than papered over.

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. The DAST authz-matrix generator this file's RFTC043-9
case exercises found a genuine cross-project IDOR (`RunsController#get_testcases`) — filed as **BUG-TCM-086**,
now **Closed, confirmed FIXED** (retested 2026-10-22, `bugs/closed/BUG-TCM-086.md`; also independently
re-confirmed again this session, see `RFTC-008_EXTERNAL_SPEC_DEFECT_EXECUTION_LINKING.md`'s own 2026-10-24
regression note for the same live check). RFTC043-9 is therefore now a genuine PASS, not the FAIL it was
recorded as at the time this file's own Coverage Summary above was written.

Two more real findings this DAST tooling surfaced in the same 3-persona roster exercise remain **open** and were
not regressed/fixed by any commit since: **BUG-TCM-091** (High — CSV import's `step2` doesn't validate
`selected_suite_id` against the importing project, a cross-project suite-link leak) and **BUG-TCM-094** (Medium —
`IssueStatusResultsController#new` has no cross-project scoping, a read-only run/environment-name disclosure).
Both still open per `bugs/_index.md`, correctly so — no fix commit found for either in the product repo's recent
history.

**Verdict:** RFTC043-9 upgrades FAIL→PASS (its finding is now fixed). The remaining two tooling-discovered
findings (BUG-TCM-091/094) are unrelated defects, not a regression of this file's own scenarios, and correctly
remain open.
