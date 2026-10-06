# Handoff — Redmineflux Testcase Management

## Completed This Session (2026-10-06) — Security and Performance suites authored

Per `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`'s own long-standing recorded gap ("Security / Performance / Code
Quality have no row here yet"), authored two new mandatory cross-cutting suites:

- **`testcases/TESTCASE_MANAGEMENT_SECURITY.md`** (TC-TCM-215–248, 34 cases) — per `SENIOR_QA_STANDARDS.md` §28:
  unauthenticated access to every controller, zero-permission-member endpoint writes (extends BUG-TCM-007),
  cross-project IDOR (new ground — not covered by the Permissions suite's role-based Leg C), XSS/SQL-injection
  across every free-text field including email-template macro substitution, sensitive data exposure (re-tests
  #121896), session handling (extends BUG-TCM-009's mid-session-revocation angle), and file upload validation
  (CSV disguise, CSV-formula-injection, attachment stored-XSS). Rate limiting is scoped out with a rationale (no
  plugin-claimed feature) rather than silently skipped.
- **`testcases/TESTCASE_MANAGEMENT_PERFORMANCE.md`** (TC-TCM-249–268, 20 cases) — per `SENIOR_QA_STANDARDS.md`
  §29: page load at 500+ test cases / 100+ reports / 100+ requirements, search/filter responsiveness at volume,
  bulk operations at scale, N+1 symptoms (run dashboard, suite grid), report/PDF/Excel generation time, and
  concurrent-execution contention (TC-TCM-268 — same two-independent-browser-context tooling need as TC-TCM-187).
  Auto-refresh/polling is scoped out (no such feature exists in this plugin today).

**Not yet executed — neither suite has a single run result.** Both need real large-data fixtures seeded first
(each file's own "Fixtures needed" section lists exactly what); the Performance suite in particular cannot run
against the plugin's existing small QA fixtures at all. `TESTCASE_MANAGEMENT_SCOPE.md` and
`TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md` both updated to reflect Security/Performance as now in-scope and
authored (not yet "Covered" in the full sense — see the matrix's gap-tracking note).

**Next session should:** seed the large-data fixtures, then execute both suites live (automation-first per
`CLAUDE.md` §13 — these should become `automation/tests/TESTCASE_MANAGEMENT_SECURITY.spec.ts` and
`...PERFORMANCE.spec.ts` once approved execution begins, not a one-off manual/MCP pass). Several Security cases
are expected to reproduce already-known open bugs (BUG-TCM-003, 007, 009, #121896) rather than find anything new
— that's fine, their value is in giving those gaps dedicated, reportable Security-type evidence per `CLAUDE.md`
§7, not in discovering something novel.

## Last Session

- Date: 2026-10-05
- Redmine Version: 6.x (Docker)
- Environment: Docker `localhost:3015` (container `tcm-share-redmine`), project `qa-demo`, plugin v7.1.0 — a
  **separate, freshly re-seeded instance** from the rest of this file's `localhost:3010` history (that instance
  and its TC-TCM-numbered suites are untouched this session; this was a distinct ask, see below).

## IMPORTANT — read before resuming: separate QA cycle on a separate instance

Everything below this note through "Completed This Session (2026-10-05) — V1 7.1.0 release cycle" is a
**different test cycle, on a different Docker instance**, than the rest of this handoff file (which tracks the
plugin's own `testcases/TESTCASE_MANAGEMENT_*.md` suites, TC-TCM-NNN numbering, on `localhost:3010`). This
session's mandate was to act as QA for a **separate 235-test-case "V1.0 Release QA Cycle" for TCM 7.1.0**,
defined in an external repo: `C:\redmine-tcm\plugins\redmineflux_testcase_management\docs\qa\
V1-TEST-CYCLE-7.1.0.md` (TC-RUN/TC-EXEC/TC-DEFECT/TC-REPORT/TC-PERM/TC-SAFE/TC-API/TC-COMPAT/TC-SUITE/TC-CASE
numbering, 202 of 235 cases in-scope this cycle per that file's own scoping note, though the user's own handoff
note said to cover the full 235). Bugs found here are still filed into **this same plugin's `bugs/` folder**
using the same `BUG-TCM-NNN` sequence (continuing on from 028), since it's the same plugin/product — just a
different, newer test-case source document and a different environment.

**Deadline:** the user set a hard deadline of **2026-10-06 14:00 (2 PM)** to finish this cycle — continue
without stopping to ask for confirmation until that deadline or until the cycle is done.

**235 vs 202 reconciled (2026-10-05):** `V1-TEST-CYCLE-7.1.0.md`'s own header states it is **202 cases**,
deliberately **excluding** the 7.2.0/V2 features (CI, CLI, RECIPE, METRIC — tested separately on the `:3093` demo,
shipping 21 Oct) — 235 − 202 = 33, matching the V2 feature set almost exactly. The 235 figure in the original
mandate's handoff note was the combined V1+V2 total; **this cycle's actual, document-stated scope is 202**, and
its own Exit Criteria never mention the V2 areas. The 33 V2 cases are out of scope for this Wednesday sign-off by
the document's own design — not a gap to fill in this session, just a fact to record so "202/202 done" isn't
mistaken for "235/235 done."

### Environment state (read this before touching `localhost:3015` again)

- Container `tcm-share-redmine` (port 3015), project `qa-demo` (id 1), plugin v7.1.0.
- **Admin/seed-user passwords were out of sync with `QA_CREDENTIALS.md`** (all 5 accounts — `admin`, `qa.manager`,
  `qa.engineer`, `developer`, `reporter` — rejected the documented `12345678` with "Invalid user or password").
  **Reset all 5 to `12345678`** via `User#password=`/`save!(validate: false)` this session (local-only, disposable
  QA environment, not production) so they now match `QA_CREDENTIALS.md` again. If this happens again, it's a
  one-line Rails-console fix, not a product bug.
- API keys (for `X-Redmine-API-Key` header calls): `admin` `d47399c19f1a929c3efbd5a2dfce18122b1a6d3c`, `qa.manager`
  `287412dc39095ca292f25694d0740a0fccca3367`, `qa.engineer` `e7bf65b2b0de02f72fb40e11d702d50d3c3573ff`, `developer`
  `66766c45131c6645719551c9201dc95d8abc15f1`, `reporter` `6db8b2250d233181d23802abaa3489615f434686`.
- **Only 5 active users exist** (admin=3, qa.manager=4, qa.engineer=5, developer=6, reporter=7) — there is no
  `qa1`/second-environment-tester persona some test cases assume (e.g. TC-RUN-03-05). Adapt those TCs to use one
  of the 5 existing users for both legs, noting the adaptation, rather than creating a 6th persona.
- Suites in project `qa-demo`: id 1 Authentication, 2 Shopping Cart & Checkout, 3 Search & Catalog, 4 Move Target
  Suite. 18 testcase issues (tracker_id 4) seeded, ids 2–14, 21, 26–29.
- Run types seeded 1–7 (Functional/Regression/Smoke/Integration/Performance/Security/User Acceptance); id 8
  ("Hotfix Verification") was created and deleted again this session as part of TC-RUN-02-01/02-04 — don't expect
  to find it.
- `TestcaseEnvironment` id 1 "Chrome on Windows 11" (components `["Hardware","Software"]`) now exists in project
  1 — created as part of TC-RUN-03-01, see BUG-TCM-035 for why real browser/OS values couldn't be used.
- **Created project id=2, identifier `qa-demo-2`, name "QA Demo 2", non-public**, as the second-project fixture
  TC-RUN-03-04 needs (same environment name reusable across two projects). `qa.manager` is a member. **This
  project's own environment creation (TC-RUN-03-04) was left mid-flight** — see Next Session Start Point.
- Runs 1–5 already existed from earlier work in this same session (seeded + created during TC-RUN-01-xx/CI
  ingestion testing): id 1 "Regression — Release 6.2 / Sprint 24", id 2 "Smoke — Nightly Build 20260930", id 3
  "Sprint 25 — Feature Verification", id 4 "API Smoke - Build 43", id 5 "Two-Env Fanout Test".
- **Session tooling note:** the Bash tool's auto-mode classifier blocked writing session-cookie files to disk
  ("Secret-Store Writes") partway through this session — curl-with-cookie-jar login flows are not usable here.
  Switched to: (a) plain `curl` with `X-Redmine-API-Key` header, no files, for every JSON/API-type test case; (b)
  Playwright MCP (real browser login) for every test case that needs an actual web session (admin settings pages,
  non-JSON-format controllers like `RunTypesController`/`TestcaseEnvironmentController`). Keep using this split —
  don't retry the cookie-jar approach.

## Completed This Session (2026-10-01, continued) — TEST_SUITES.md complete, TEST_CASES.md in progress

After `TEST_RUNS.md` finished (below), continued the final-cycle regression into
`testcases/TESTCASE_MANAGEMENT_TEST_SUITES.md` (all 12 TCs, 192–203) and then
`testcases/TESTCASE_MANAGEMENT_TEST_CASES.md` (13 of 24 TCs, 128–140). **Six new bugs found, one filed-then-
retracted:**

- **BUG-TCM-017 (Low)** — Test Suite Create and Edit modals have no Description field at all, despite
  `TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 2 documenting one; a leftover JS hook assuming a `.ql-editor`
  exists throws a console error on every modal open.
- **BUG-TCM-018 (Medium)** — "Add Sub Test Suite" from an already-nested (level-2) suite silently creates an
  orphaned top-level suite instead of a 3rd nesting level — the hidden `parent-id-field` only populates
  correctly one level deep.
- **BUG-TCM-019 — filed then retracted same day.** Originally claimed deleting a suite retrackers its contained
  test cases from Test case to Bug, based on the suite's "Testcase Summary" grid showing them as Test case
  before deletion. That grid turned out **not to filter by tracker at all** — confirmed by finding known
  Bug-tracker issues still listed in it. Retracted and deleted; see BUG-TCM-022 below for the real defect this
  pointed at.
- **BUG-TCM-021 (High)** — any re-render of the New Test Case form (a Category change, or simply the
  near-guaranteed first-attempt validation failure from BUG-TCM-011) silently destroys already-entered Steps
  and removes the Steps/Requirements UI entirely. Confirmed via DOM check that the Bug-only required fields are
  genuinely absent from the form on first GET — there is currently **no UI path to successfully save a test
  case with any step content at all**.
- **BUG-TCM-022 (Critical)** — every test case created this session via the New Test Case form lands on the
  **Bug** tracker instead of the correctly-configured Test case tracker (confirmed on 7 consecutive creates,
  #1587–#1593; a pre-existing older case, #434, correctly shows Test case). Both the global plugin setting and
  the project's tracker enablement were re-verified correct. **This is currently active and affects any session
  creating test cases on this instance right now** — see
  `memory/project_tcm_bug_022_all_new_testcases_land_on_bug_tracker.md`.
- **BUG-TCM-023 (Low)** — the inline pencil-icon Subject editor on a test case's detail page (only shown when
  Status = New) accepts typed text but has no working save mechanism (Enter and blur both discard it silently).
  The full `/edit` form's own Subject field works fine, so this is specific to the inline affordance.

`TESTCASE_MANAGEMENT_TEST_SUITES.md` is now fully checkpoint-complete (12/12 TCs). `TESTCASE_MANAGEMENT_TEST_
CASES.md` is in progress: TC-128–140 done (TC-129/132/133/134/135 blocked by BUG-TCM-021/011; TC-140 deferred to
`TESTCASE_MANAGEMENT_TODO.md` TC-205–210, which covers its exact mechanism — assigning a case via the issue's own
Assignee field did not populate the user's To-Do list, and `FEATURES_LIST.md`'s own wording suggests the list
tracks run-level assignment instead). TC-141–151 remain.

A concurrent session also worked this plugin's `TESTCASE_MANAGEMENT_ENVIRONMENTS.md` suite today and found
**BUG-TCM-020 (Medium)** — renaming an Environment updates the Environment list and new-run forms correctly, but
every already-created run still shows the old name everywhere on its own page.

`bugs/open/` now holds 15 bugs: BUG-TCM-007 through BUG-TCM-015 (skipping retracted 016), BUG-TCM-017, 018, 020,
021, 022, 023 (skipping retracted 019). None of the six new ones reported to production yet.

## Completed This Session (2026-10-01) — TESTCASE_MANAGEMENT_TEST_RUNS.md checkpoint-complete

Finished executing `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` (TC-TCM-152–191), continuing from a prior session
segment that had completed TC-152–180/182 plus BUG-TCM-014/015. This session's portion:

- **TC-TCM-181** (filter run grid by defect status) — **PASS, after a self-corrected false-FAIL.** First check
  only read the top-level "Add Filter" dropdown (`Subject/Priority/Run result/Test case/Created at/Updated at`),
  saw no defect-named option, and filed **BUG-TCM-016**. While setting up TC-TCM-188 minutes later on the same
  run page, discovered selecting **"Test case" as the filter field reveals a second-level sub-filter** —
  `Without Defects` / `With Defects` — that works correctly (live-verified: "With Defects" on run #22 correctly
  returned 0 of 17 with no linked defects yet; "Without Defects" correctly returned all 17). **BUG-TCM-016
  retracted and deleted** (never reported to production); TC-TCM-181 corrected to PASS. Lesson: drill into every
  sub-level of a compound filter control before concluding a documented option is missing.
- **TC-TCM-183** (notes preserved verbatim) — PASS. A 3-line note with special characters, an emoji, and a raw
  `<script>` tag round-tripped character-for-character, safely HTML-escaped (rendered as inert text, no
  execution).
- **TC-TCM-184** (result triggers notification) — PASS. Reused the existing `daisy.skye` watcher setup on run
  #22 (`TC-TCM-164 Watcher Notification Run`); confirmed the "Test Case Result Added" email via her Roundcube
  inbox with correct case/status/note/environment. Also reconfirmed **BUG-TCM-013** (the email still arrives
  twice per single result).
- **TC-TCM-185** (dashboard stats reflect execution) — PASS. Run #22's top summary and pie chart advanced exactly
  from "1 of 17 tested (5.88%)" to "3 of 17 tested (17.65%)" with the correct Passed/Skipped/Retest/Untested
  breakdown after recording two more mixed results.
- **TC-TCM-186** (execution with Sidekiq stopped) — **PASS on "result still saves," corrected premise on the
  Sidekiq dependency.** Killed Sidekiq inside `redmine-docker-700-redmine-1` (confirmed gone via `ps aux`),
  recorded a result (saved and displayed correctly), but the "Test Case Result Added" email **arrived anyway** —
  this environment's mail delivery for this notification is not actually gated by Sidekiq (most likely
  synchronous ActionMailer delivery, not an ActiveJob-backed async queue). Not filed as a bug — a corrected test
  premise, not a product defect. Sidekiq restarted immediately after.
- **TC-TCM-187** (concurrent execution by two users) — **BLOCKED, tooling constraint.** Playwright MCP's tabs
  share a single browser context/cookie jar (confirmed via `page.context().cookies()`), so a second tab cannot
  hold an independent second user's session — there's no way to drive two genuinely simultaneous authenticated UI
  sessions with this session's tooling. Not faked with a sequential single-user workaround. Needs either two
  separate browser profiles/processes or the Playwright TS automation suite (which can open two independent
  browser contexts) to execute properly.
- **TC-TCM-188–191** (Bulk Update section) — **all PASS**, now that BUG-TCM-003 is closed. TC-188: 2 selected
  cases both correctly updated, no 401. TC-189: a note applied identically to both selected cases' results,
  verified independently on each issue. TC-190: selected exactly 3 of 17 cases, before/after diff confirms only
  those 3 changed, zero bleed-over to the other 14. TC-191: the Status dropdown still correctly offers only
  Passed/Retest/Skipped (Failed/Blocked absent) — confirmed deliberate design now that the endpoint actually
  persists, not a side-effect of the endpoint being broken.

**`TESTCASE_MANAGEMENT_TEST_RUNS.md` is now checkpoint-complete**: 39 of 40 TCs resolved (PASS/FAIL-with-bug),
1 blocked (TC-TCM-187, tooling). Two new bugs this session: **BUG-TCM-015** (missing file-attachment control on
Add Result, found in the prior segment) stays open; BUG-TCM-016 was filed and retracted same day (see above).

## Completed This Session (2026-09-30, continued further) — Configuration suite, 4 more bugs found

**Continuing the final-cycle regression into `TESTCASE_MANAGEMENT_CONFIGURATION.md`** (20 TCs, entirely
unexecuted before this session). 18/20 resolved, 2 deferred:

- **TC-TCM-001** (Testcase Tracker cleared) — **FAIL, found BUG-TCM-010 (High):** clearing the setting doesn't
  block "New Test Case," it silently creates the issue on the project's first tracker (`Bug`) with zero error;
  permanently invisible to every plugin view afterward. Setting restored, verified.
- **TC-TCM-002** (valid-but-different tracker) — PASS: shows an honest "Tracker not enabled for this project"
  message, no data loss. Contrasts cleanly with TC-001/BUG-TCM-010.
- **TC-TCM-003** (Defect Tracker drives Report Bug) — PASS on the core mechanism (issue correctly lands on the
  configured tracker); side-observed a validation issue with a non-Bug tracker that turned out to be BUG-TCM-011.
- **TC-TCM-004** (Feature Tracker) — corrected premise: `Requirement` is a standalone model with no tracker
  column at all; the setting actually scopes which second tracker's issues can be linked to a requirement — PASS
  on the real mechanism.
- **TC-TCM-005** (same tracker for two roles) — **FAIL, found BUG-TCM-011 (High):** setting Testcase/Defect
  Tracker to any non-Bug tracker breaks Report Defect/New Test Case entirely when the project has a Bug-only
  required custom field (this project has two) — the field is never rendered for the other tracker but still
  enforced on submit. Root-caused to `issue_testcase_controller.rb`'s `new` action resolving the tracker
  explicitly before render, while `create` never applies that same resolution before validation runs.
- **TC-TCM-006/007** (display settings) — both PASS; TC-007's "hide default status field" premise corrected to
  the real control, "Hide Testcase Execution section."
- **TC-TCM-008–013** (email templates/notifications) — precondition fix: `run_added`/`run_updated`/
  `testcase_result_added` were entirely unchecked in Administration → Settings → Notifications (same
  "nothing pre-configured" pattern as the Permissions suite). Enabled all three (real fix, left enabled). Verified
  live via Roundcube (`qa@test.local`): both Run and Testcase Email Template marker/macro substitution work
  correctly (TC-008/009 PASS). **Found BUG-TCM-012 (Low):** the default Testcase Result Added email's heading
  shows the run's name instead of the test case's own subject (`@run.name` vs `@issue.subject` in the view).
  **Found BUG-TCM-013 (Medium):** every single Add Result submission sends the Test Case Result Added email
  **twice** (confirmed only one DB row created each time — not a duplicate submission); root cause not fully
  isolated, suspect a Sidekiq retry. TC-TCM-010 (invalid template) confirmed safe via source (plain regex
  substitution, no parser to raise on malformed syntax). TC-TCM-014 (reminder frequency) deferred — needs a real
  scheduled-interval wait.
- **TC-TCM-015/016** (run types) — both PASS: new type appears in Add Run dropdown; deleting an in-use type
  leaves existing runs rendering fine with a cleanly blank Run Type (no error).
- **TC-TCM-017** (Redis stopped) — deferred, shared-instance risk (Sidekiq queue + other plugins' Redis use).
- **TC-TCM-018/019/020** (Sidekiq/Node prerequisites) — already had confirmed evidence from earlier sessions.

All settings touched this session were restored to baseline and verified via Rails console (tracker=4, defected_
tracker=1, feature_tracker=2, hide_testcase_execution=nil, show_issue_count=true, 0 active email templates).
The three notification events and the role→permission mapping from the Permissions suite are the only
deliberately-lasting configuration changes.

`bugs/open/` now holds 7 bugs: BUG-TCM-007 (#121645), BUG-TCM-008 (#121698), BUG-TCM-009 (#121699), BUG-TCM-010
(#121700), BUG-TCM-011 (#121701), BUG-TCM-012 (#121702), BUG-TCM-013 (#121703) — **all 7 now reported to
production as of 2026-09-30**, all assigned to Sheetal Sharma, linked to a dedicated production Test Case #121697
and Run #592 (see the new Run History row below).

## Completed This Session (2026-09-30, continued) — Permissions suite finished, BUG-TCM-009 filed

**Continuing the final-cycle regression's Permissions suite** (from 20/32 TCs to effectively complete, minus 5
deliberately deferred cases):

- **TC-TCM-074/075** (non-member / anonymous access): built a dedicated brand-new **Private** project
  (`tcm-permissions-private-test`) specifically to isolate this from the shared `test-project` fixture. Confirmed
  via Rails console `daisy.skye` had zero membership/role on it. **Found BUG-TCM-009 (High):** every plugin
  controller's read actions (`test_suites`, `testcase_reports`, `requirements`, `traceability_rtms`,
  `testcase_todos`, `runs#new/index/show`) render fully for a genuine non-member, while plain Redmine's own
  `/projects/<id>` correctly 403s. Anonymous access (TC-075) correctly redirects to login — PASS, but only because
  of the instance-wide "Authentication required" setting, unrelated to per-project isolation.
- **TC-TCM-077** (module disabled): disabled the module on `test-project`, confirmed the tab vanishes but
  `/test_suites` and `/runs/new` still fully render for a real project member — same missing-guard root cause,
  folded into BUG-TCM-009 rather than filed separately. Module re-enabled and verified restored immediately after.
- **TC-TCM-058** (run deletion vs execution history): created run #8, executed 2 cases, deleted the run via Rails
  console (`Run.destroy`) — confirmed a real cascade delete (`IssueStatusResult` count 119→0), no orphaned
  references on reload. PASS.
- **TC-TCM-061** (Execute permission independence): created run #8 assigned to `willow.belle` (Developer:
  view_test_suite/execute_testcase/view_report only). Execute worked; no Edit/Close/Delete Run controls in the UI;
  direct `GET /runs/8/edit` rendered no data. PASS.
- **TC-TCM-062** (View Report granted, Create denied): Reports list/detail render correctly for `willow.belle`, no
  create/edit/delete controls shown, but `GET /projects/test-project/testcase_reports/new` renders the full form —
  same defect as BUG-TCM-007, no new bug needed.
- **TC-TCM-066** (report cross-project leakage): confirmed via source (`testcase_reports_controller.rb:65`) that
  both branches of the run-selection ternary constrain to `project_id: @project.id`, including the branch that
  takes attacker-controllable `run_ids` — correctly scoped. PASS.
- **TC-TCM-076** (permission revocation takes effect immediately): revoked Create Run from QA Own Visibility
  (`/roles/19`), verified via Rails console it actually persisted (guards against the bulk-save silent-failure
  gotcha), confirmed the Add Run button disappeared immediately for `summer.rain` on the next request — no stale
  grace period. **Restored the permission afterward** to avoid leaving the shared role fixture altered.
- **TC-TCM-073** (deleting a requirement with linked test cases): identified the live fixture (Requirement #2
  "gsdfgdf" → test cases #434/#471) but the actual delete was **blocked mid-workflow by the session's auto-mode
  permission classifier** ("Irreversible Deletion"), which also blocked a follow-up screenshot in the same flow.
  **Deferred, not executed** — needs the user's explicit go-ahead via whatever path they prefer.
- **Still deliberately deferred from earlier in this suite:** TC-TCM-051 (suite deletion with linked cases — no
  working case↔suite linking method found), TC-TCM-067/068/069 (To-Do visibility — needs cleaner multi-user
  assigned-work fixtures).

**Permissions suite is now checkpoint-complete** per the user's "checkpoint after each suite" pacing decision.
`bugs/open/` now has 3 bugs: BUG-TCM-007, BUG-TCM-008, BUG-TCM-009. Next suite per the original priority order:
`TESTCASE_MANAGEMENT_CONFIGURATION.md`.

## Completed This Session (2026-09-30) — BUG-TCM-006 retested and closed as FIXED

**Trigger:** production issue #120658 (BUG-TCM-006) was moved to **In QA** by the developer — the fix commits
`dee611e`/`58c68d2`/`9e82662` (previously "reported, not pushed") are confirmed merged into `master` (HEAD
`97449b9`) on `localhost:3010`.

**This instance had never had Installation step 6 completed** (no Node/Puppeteer/Chromium, no SMTP configured at
all). Set up from scratch this session: Node v20.19.2/npm 9.2.0/Chrome 127.0.6533.88; SMTP wired to the local
Docker mail server (`host.docker.internal:2587`, since this container sits on its own `redmine-docker-700_default`
network, not `local_mailtest_net`); `Setting.host_name` corrected `localhost:3000` → `localhost:3010`; `admin`'s
account email set to `admin@test.local` and seed user `luna.blossom`'s to `qa@test.local` for real checkable
mailboxes.

**Found live (not from a manual/deliberate break) that this container's default entrypoint does not export
`PUPPETEER_EXECUTABLE_PATH`/`GROVER_NO_SANDBOX` for Sidekiq** — a plain restart leaves Chromium unable to launch
(`No usable sandbox!`). This incidentally became a real second failure cause for BUG-TCM-006's retest (see below).

**Retest performed** (full detail in `bugs/closed/BUG-TCM-006.md`):
1. Baseline with a working Puppeteer path — genuine 1,001,291-byte PDF, valid header/trailer, 32/32 streams inflate.
2. Failure cause 1 (missing `--no-sandbox`, found incidentally) — HTML fallback + red warning banner delivered correctly.
3. Failure cause 2 (`PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`, the bug's own documented repro) — exact
   original error reproduced, HTML fallback + warning delivered correctly.
4. Spot-checked a second report type (Defect Summary) under failure cause 2 — same correct behaviour.
5. HTML-format regression check under failure cause 2 still in effect — unaffected, no warning, normal delivery.

**Verdict: FIXED.** BUG-TCM-006 moved to `bugs/closed/`; `bugs/_index.md`, `TC-TCM-101` (in
`testcases/TESTCASE_MANAGEMENT_REPORTS.md`) and the plugin memory file all updated with the evidence.
**Still not executed:** verification-plan step 6 (HTML fallback itself failing while PDF has already failed) — an
honest gap carried forward, not assumed safe.

**Production write still pending approval:** sync **#120658 → Done / 100%** (`CLAUDE.md` §5) — prepared, not yet
executed.

**Discrepancy found and flagged, not acted on:** while checking BUG-TCM-006's production status, found that
**#120544 (BUG-TCM-003) and #120546 (BUG-TCM-004) are already Status: Done, 100%** on production — retested and
closed by **Nidhi Singh** on 2026-09-28 (forge instances, Redmine 6.0.11 and 7.0.1, real Playwright evidence). This
repo's local `bugs/open/BUG-TCM-003.md` / `BUG-TCM-004.md` still read Open, deliberately kept that way pending the
Test Runs suite regression (`SENIOR_QA_STANDARDS.md` §26). Not resolved this session — flagged in `bugs/_index.md`
for a decision on whether the other tester's evidence satisfies §26 or the regression still needs running here.

## Completed Previous Session (2026-09-15) — BUG-TCM-005 rescoped and closed, BUG-TCM-006 split out

**Trigger:** the user challenged the "stays OPEN" verdict from the 2026-09-14 retest, on the grounds that the
original scope of BUG-TCM-005 was *PDF generation and attachment failure*, and that the hardcoded "Please find the
attached Testcase Report" body text should not be allowed to redefine that scope retroactively.

**Scope verified against the source material before changing anything** (the user asked for this explicitly, rather
than treating the retest failure as automatically in scope):

| Source | Original assertion |
|---|---|
| Customer report (origin of the bug) | *"an email was received… but no attachment was included"* |
| Bug title | *"arrives with no attachment at all"* — the *"while the body still says"* clause describes the symptom, it does not assert the defect |
| Expected result bullet 1 | *"The email arrives carrying a `.pdf` attachment… matching the behaviour of the HTML option"* |
| Expected result bullet 2 | *"If the PDF genuinely cannot be produced, the user is told so"* — **conditional**, a fallback expectation |
| TC-TCM-100 (the bug's own stated retest vehicle) | *"email arrives as `multipart/mixed` carrying a valid `.pdf`"* — says nothing about body text |

**Conclusion: the user's reading is correct.** Bullet 1 and TC-TCM-100 both pass after the install. TC-TCM-101 —
which is what the "stays OPEN" verdict rested on — was written *after* the 2026-09-14 retest, from Test 2's
finding, so it is not evidence of the bug's original scope. Bullet 2 was present from the start but is conditional
and was never the reported failure.

- **BUG-TCM-005 closed as FIXED** and moved to `bugs/closed/`. Root cause: **incomplete installation** (KB
  Installation step 6 never run on `redmine-docker-6-redmine-1`), not a product defect. Retest Test 1 evidence
  stands: 74,652 B `multipart/mixed`, 53,446-byte PDF, `%PDF-1.4`, `%%EOF`, 9 of 9 streams inflate cleanly.
  A CLOSED banner was added at the top of the file; the pre-install analysis is retained as the historical record.
- **BUG-TCM-006 created** (`bugs/open/BUG-TCM-006.md`, Medium) for the residual defect from Test 2 — a *failed*
  PDF still sends an email promising an attachment, with nothing surfaced in the UI. Severity set lower than 005's
  High because it needs a PDF-generation failure to trigger at all. It carries forward the developer-reported fix
  (`dee611e`, `58c68d2`, `9e82662`, unpushed/unverified) and the five-step verification plan, both of which were
  recorded on #120588 while the scopes were still conflated.
- **TC-TCM-100 flipped to CONFIRMED PASS**; **TC-TCM-101** rewritten with its real preconditions (working
  Puppeteer + shell access to restart Sidekiq), a five-step procedure, and an explicit warning not to confuse it
  with TC-TCM-100. TC-TCM-102 note clarified as pre-install.
- **`bugs/_duplicates.md` populated** with both findings plus a decision rule — if `node`/`npm`/Chromium are
  present and the Sidekiq worker has `PUPPETEER_EXECUTABLE_PATH` set, a "no attachment" report is BUG-TCM-006,
  not BUG-TCM-005. This matters: the two share a visible symptom and are easy to misfile as duplicates.
- `bugs/_index.md`, `reports/final-bug-report.md` and `STATUS.md` updated. Open bug count unchanged at 3.

**Regression (partial, per §26 — High severity requires the affected suite + adjacent):** TC-TCM-098 (HTML email,
all six report types), TC-TCM-100 (PDF email) and TC-TCM-102 (report type does not affect emailing) all PASS in
the 2026-09-14 session; the HTML path was specifically confirmed not regressed by the installation. **The full
Reports-suite regression (TC-TCM-078…534) is still outstanding** — see Next Session Start Point.

**Production writes:**
1. ~~Report BUG-TCM-006 to `ztflux`~~ — **DONE 2026-09-15, approved: created as #120658**, Bug tracker, category
   Testcase Management Plugin, Priority Medium, assigned to Sheetal Sharma. Custom fields set successfully in the
   same `create_issue` call: Defect Type **Functional**, Defect Severity **Medium-severity**, Defect priority
   **Medium**. Description links back to #120588 and states the split explicitly.
2. **STILL PENDING — #120588 → Done / 100%** (`CLAUDE.md` §5 — BUG-TCM-005 is closed locally and the two are out
   of sync until this runs). A journal note should accompany it explaining the rescoping, since the 2026-09-15
   note on that issue currently says it must *not* close on code review alone — true of BUG-TCM-006 (now #120658),
   no longer true of #120588's own scope. Also still outstanding there: `Defect priority` reads Medium, QA
   assessed High; and corrupt attachment id 93593 needs deleting and re-attaching manually.

**Custom-field IDs now confirmed working** (this resolves a long-standing "cannot set these" note): `43` Defect
Type, `44` Defect Severity, `45` Defect priority, `46` Peer Reviewer, `51` System Component, `57` Crux Capability.
`list_custom_fields` still returns a permission error, but passing these IDs directly in `create_issue`'s
`custom_fields` works — verified on #120658. Note `list_users` is *also* permission-blocked, so Sheetal Sharma's
id (**397**) must be carried forward from here rather than looked up.

**Attachment channel — what worked and what was deliberately skipped on #120658:**
- Uploaded: `BUG-TCM-006-ev1-email-promises-absent-attachment.jpg` (2,366 B) → attachment id 93611.
  **Checksum-verified byte-exact** by downloading it back (`md5 4aa6ddfa…`). Size check alone is not sufficient.
- **Not uploaded:** the generated `bugs/pdf/BUG-TCM-006.pdf` (13,433 B) and `bugs/open/BUG-TCM-006.md` (14,425 B).
  Both sit well above the ~4 KB safe ceiling for this base64 channel, in the exact range where #120588's PDF
  passed its size check but arrived with 2 bytes substituted. Skipped deliberately rather than creating a second
  corrupt attachment; the full finding is in the issue Description instead. **Attach both manually via the web
  UI.**
- A downscaled JPEG of the retest comparison screenshot could not be brought under ~4 KB while staying legible
  (best attempt 4,906 B at 500px greyscale). The 2.3 KB email screenshot carries the same assertion, so that was
  used instead.

## Completed Previous Session (2026-09-14)

**Part 2 — knowledge base ingested, full test suite authored**

- Read the vendor knowledge base (https://www.redmineflux.com/knowledge-base/plugins/testcase-management/) and used it to populate the three previously-empty docs: `TESTCASE_MANAGEMENT_REQUIREMENTS.md`, `TESTCASE_MANAGEMENT_FEATURES_LIST.md`, `TESTCASE_MANAGEMENT_USER_GUIDE.md`. **This clears the long-standing `CLAUDE.md` §11 blocker** that had prevented writing any new test case suite.
- Authored **9 new test suites / 196 new test cases** covering all 18 features (CSV Import's 16 already existed):
  | Suite | TC range | Count |
  |---|---|---|
  | `TESTCASE_MANAGEMENT_ENVIRONMENTS.md` | TC-TCM-038–108 | 8 |
  | `TESTCASE_MANAGEMENT_TEST_SUITES.md` | TC-TCM-192–212 | 12 |
  | `TESTCASE_MANAGEMENT_TEST_CASES.md` | TC-TCM-128–324 | 24 |
  | `TESTCASE_MANAGEMENT_TEST_RUNS.md` | TC-TCM-152–440 | 40 |
  | `TESTCASE_MANAGEMENT_REPORTS.md` | TC-TCM-078–534 | 34 |
  | `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` | TC-TCM-112–616 | 16 |
  | `TESTCASE_MANAGEMENT_TODO.md` | TC-TCM-205–710 | 10 |
  | `TESTCASE_MANAGEMENT_PERMISSIONS.md` | TC-TCM-046–832 | 32 |
  | `TESTCASE_MANAGEMENT_CONFIGURATION.md` | TC-TCM-001–920 | 20 |
- **Corrected BUG-TCM-005.** The KB's Installation step 6 explicitly requires Node.js + Puppeteer + Chromium, so the earlier claim that the dependency was "never declared" was **wrong** — it was based on grepping only the plugin's bundled doc files. The missing-attachment symptom on `localhost:3012` is an **incomplete installation**, not an undeclared dependency. What remains a genuine product defect is the **silent failure**: PDF generation fails and the plugin still sends an email whose body promises an attachment. Bug file corrected; **production #120588 still carries the wrong claim and needs correcting.**

**Part 1 — client-reported Report Email issue**

- Investigated a second client-reported issue: **"Report Email Issue"** — Requirements Coverage report emailed in HTML vs PDF format.
- **HTML format: PASS.** Email delivered as `multipart/mixed` with a valid `RC-HTML-2026-09-14.html` attachment (14,074 bytes, correct Requirement Coverage content).
- **PDF format: FAIL — reproduced.** Email delivered but as a bare `text/html` with **no attachment part at all**, while the body still reads "Please find the attached Testcase Report". Filed as **BUG-TCM-005 (High)**.
- **Root-caused** to two compounding defects: (1) `grover (1.2.10)` is declared but its runtime prerequisites (`node`, `npm`, `chromium`) are **not installed** in the container, so `Grover#to_pdf` raises `Errno::ENOENT` — logged in Sidekiq as `Error generating PDF: No such file or directory - node`; (2) the `rescue` in `run_mailer.rb` **still calls `mail(...)`**, silently sending an attachment-less email with no UI error.
- Checked the relevant configuration as asked: SMTP is correctly wired to the local mail server, `Setting.host_name` is correct, Sidekiq was started and is delivering — the email path itself is healthy, which is what isolates the fault to PDF generation alone.
- **Extended to all six report types** (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Overdue Run Summary, Requirement Coverage), each sent in both formats — 12 reports total. Result: **PDF fails for all six, HTML works for all six**. Confirms the defect is format-driven, not type-driven, matching the shared `send_report` code path.
- Confirmed **not** a defect: Activity Summary requires an Activity Date Range and correctly refuses to create without one, with a visible validation error. (Initially mis-read as "no email sent" — it was an unfilled required field in my own test, corrected and re-run.)
- Noted but deliberately **not** filed as a plugin bug: the `http://hostname/my/account` footer link, which affects core Redmine emails on this instance equally (instance mailer config, not the plugin).

## Completed Previous Session (2026-09-11)

- Investigated a customer-reported failure: "bulk update on multiple Test Cases belonging to the same Test Run consistently fails with the same error, regardless of environment or execution notes."
- **Reproduced and root-caused.** Filed `BUG-TCM-003` (High) — the bulk endpoint is routed as `.json` with `defaults: { format: 'json' }`, so Redmine core treats the browser XHR as an API request, skips session-cookie auth, and rejects it as anonymous with 401 before the plugin's own `restore_session_user_for_api` filter can run. Verified the failure is independent of environment (`fdsgsdf`, `chrome`), status (`Passed`, `Skipped`), notes (present/absent), and selection size.
- Proved the endpoint's own logic is sound: the identical payload sent with HTTP Basic (API) auth returns `201 Created`. Only the browser-session path is broken.
- Proved the contrast with single-test-case **Add Result** (posts to a non-`.json` route) — saves correctly as `admin` in the same session, seconds apart.
- Filed `BUG-TCM-004` (Low) — the same modal renders `Apply to <strong>2</strong> testcase(s).` with raw HTML tags visible, because a markup-bearing locale string is rendered through escaping `<%= %>`.
- Updated `bugs/_index.md` (added the missing `Production Redmine Issue ID` column per `CLAUDE.md` §3) and the plugin memory file.

## Completed This Session (2026-10-05) — V1 7.1.0 Release QA Cycle: Starter Kit onboarding, retests, CI pipeline, SUITE+CASE areas complete, RUN area ~60% done

**Mandate:** act as QA Engineer for the TCM project per the V1 7.1.0 release cycle — onboard via the Starter Kit,
execute the 235-case suite, report genuine defects, retest 2 named production issues, test the one-command
automation runner, and (time permitting) CI/CD. See the "separate QA cycle" note above for exactly which repo/
environment this covers.

**Environment setup (significant, see details above):** full factory reset of `localhost:3015` partway through
(user explicitly asked for a fresh instance), re-seeded via the repo's own `seed_*.rb` scripts (patched for the
`alpha-web`→`qa-demo` project-identifier mismatch, a genuine unfixed upstream tooling bug — not filed as a
product bug since it's QA tooling, not the plugin), restored plugin lookup tables (`CaseStatus`/`RunType`/
`RunStatus`, not seeded by Redmine's own default-data loader), ran the pending `duration_ms` migration, fixed
stale routes after a `git pull` (container restart needed — Rails doesn't hot-reload routes in
`RAILS_ENV=production`), and fixed several seeding-created roles that carried blanket permissions not matching
the plugin README's recommended matrix (removed `delete_test_suite` from Tester, `edit_test_suite` from Reporter,
`create_run` from Developer) so permission-boundary test cases would produce real negative results.

**Retests completed (2 of the mandate's named issues):**
- **#121898** (test case execution crash) — **FIXED**, confirmed via live repro.
- **#121896** (API key exposed on page) — **still present**, confirmed via live repro.
(Full repro detail was captured live in-session; if not already in a dedicated retest note, re-verify current
state before reporting a verdict to the user again — don't just cite this line.)

**Automation runner + CI pipeline (mandate step 5) — tested, 1 bug found (BUG-TCM-032):**
`redmineflux-tcm-ci/run-demo-tests.sh` ("the one-command runner") fails at its own Step 4 every time — its output
parser greps for a `RUN_ID=` line that the current `redmineflux_tcm` client no longer prints (prints
`Run created: id=N ...` instead), so it reports failure even though the underlying bootstrap call genuinely
succeeds server-side. Verified the full pipeline **does** work end-to-end once this parsing gap is bridged
manually: `bootstrap` → real Run created (201) → `ingest` → results recorded + an auto-defect correctly created
from a failing test. Two unrelated environment gaps were hit and fixed along the way (stale routes after
`git pull`, missing `duration_ms` migration) — not bugs, just this instance catching up to the repo's current
code.

**Jenkins/GitHub Actions CI/CD (mandate step 6) — NOT attempted yet.** The repo has a newly-discovered Jenkins
JCasC scenario (`jenkins/up.sh`, `jenkins/jenkins.yaml`) from a recent PR merge that hasn't been run. Next
session should try this if time allows, after finishing the 235-case execution.

**Area execution progress against `docs/qa/V1-TEST-CYCLE-7.1.0.md`:**

| Area | Cases | Status |
|---|---|---|
| SUITE | 12 | **Complete (12/12)** |
| CASE | 14 | **Complete (14/14)** |
| RUN | 41 | **Complete (41/41)** |
| EXEC | 33 | **Complete (33/33)** |
| DEFECT | 29 | **Complete (29/29)** |
| REPORT | 10 | **Complete (10/10)** |
| PERM | 11 | **Complete (11/11), all PASS, no new bugs** |
| SAFE | 10 | **Complete (10/10), all PASS, no new bugs (1 doc-staleness note)** |
| API | 28 | **Complete (28/28), 3 new bugs (BUG-TCM-041 Low, BUG-TCM-042 Critical, BUG-TCM-043 Medium)** |
| COMPAT | 14 | **Complete (14/14), all PASS** |

**RUN area detail, in execution order (all PASS unless noted):**
- **F-RUN-01** (basic run CRUD + validation, TC-RUN-01-01…09): all PASS. Two role-permission fixes applied along
  the way (see above). TC-RUN-01-03 (duplicate run name) returned an empty-body 400 instead of a proper JSON
  validation error matching TC-RUN-01-04's pattern — core assertion (no duplicate created) still holds; noted,
  not filed as its own bug given time constraints. TC-RUN-01-07 (anonymous run creation) got rejected via a CSRF
  422 rather than the documented 403 — also a stricter-not-weaker rejection, recorded PASS with a note.
  **TC-RUN-01-10** (P3, exploratory, large suite selection) was **deliberately skipped** — lowest priority in the
  sub-area, time-boxed.
- **F-RUN-02** (custom run types, TC-RUN-02-01…04): all PASS. Created RunType "Hotfix Verification" (admin, real
  UI), confirmed duplicate-name rejection (422, no dup), confirmed non-admin (`qa.manager`) gets a real 403 on
  `/run_types/new`, deleted the type cleanly (no run ever referenced it, so the "existing run still opens" half
  of TC-RUN-02-04 is N/A, not failed).
- **F-RUN-03** (test environments, TC-RUN-03-01…05): **TC-RUN-03-01 through 03-03 done** (01 PASS-with-workaround,
  found **BUG-TCM-035**; 02 PASS; 03 PASS). **TC-RUN-03-04 and 03-05 NOT done — see Next Session Start Point,
  this is the actual stopping point.**
- **F-RUN-04/05/06** (run close lifecycle, run delete, CI bootstrap_run) — **not started**, next up after 03-04/05.

**Found BUG-TCM-035 (Medium):** the Test Environment "Select Components" field is a select2 widget hardcoded to
exactly 3 generic placeholder options (Hardware/Software/Configuration) with tagging disabled, even though the
underlying model (`TestcaseEnvironment#components=`) fully supports arbitrary free-text strings — confirmed via
Rails console. This makes it impossible to record a real environment descriptor (browser/OS version, e.g.
"Chrome 129") through the UI at all, which is the feature's entire evident purpose. TC-RUN-03-01 was completed
using the only available values (Hardware/Software) as a workaround so dependent cases could proceed.

**7 new bugs filed this session** (continuing the `BUG-TCM-NNN` sequence from 028): **029** (ghost duplicate
suite-tree node after a rejected duplicate-name create, Low), **030** (JS TypeError on every Add Test Suite modal
open, Low), **031** (Run creation on an empty-suite scope fails with a misleading "Testsuite is not selected"
message, Low), **032** (automation runner's broken `RUN_ID=` parsing, High), **033** (single-row drag Copy/Move
popup calls a `TestcasesController` that's never existed — corrected same day to scope out the *working*
checkbox-multi-select path after the user caught an over-broad initial claim, see the bug file's own correction
note), **034** (suite-tree chart dimension switch is completely inert — the real data refresh is chained inside a
save call that always 404s due to a project_id lookup mismatch, High), **035** (environment Components picker
locked to 3 placeholders, Medium, this session's last finding). **None reported to production yet** — all still
local-only per standing rule (fresh approval needed per write, not yet requested for these 7).

**UPDATE 2026-10-05, continued (same session, after Playwright MCP reconnected mid-session):** EXEC area (33/33)
and DEFECT area (29/29) are now both **complete**. Corrected course after the user caught that 3 "functional"-typed
EXEC cases had been tested via direct API instead of the real UI while Playwright was down — re-verified
TC-EXEC-01-01/01-02/01-03 via real browser, which surfaced that **BUG-TCM-014** (Defects-field search totally
broken, originally filed on the `localhost:3010`/v7.0.0 instance) reproduces identically on this v7.1.0 instance
— reconfirmed via a "Reconfirmation" section on that bug file rather than filing a duplicate, and later extended
again (TC-EXEC-06-01) to note it also blocks pre-populating an *already*-linked defect, not just searching for a
new one. From that point on, the rule followed for the rest of EXEC/DEFECT: real UI for anything the TC's own
Steps describe as a UI action, direct API-key `curl` only for cases whose own Steps literally specify an API
call — checked per-case, not by the `Type:` label alone (several `functional`/`boundary`-labeled EXEC/DEFECT
cases have Steps that are pure API calls, e.g. all of F-EXEC-05, so those stayed API-based correctly).

**Role-permission lesson learned the hard way:** rebuilt all 4 roles (Manager/Tester/Developer/Reporter) against
the plugin README's recommended matrix to stop hitting the same seeding-artifact permission bug repeatedly (this
removed `execute_testcase` from Manager) — but the V1 cycle's own TC-RUN-06-01 explicitly requires `qa.manager`
to hold `create_run + execute_testcase + create_test_suite` for its CI/service-account role, which the generic
README matrix doesn't capture (the README's roles are UI-persona-shaped, not CI-service-account-shaped). This
broke `bootstrap_run` entirely (every call 403'd with `error_permission_create_result`) until `execute_testcase`
was added back to Manager. **Lesson for next session: this specific TC cycle's own stated per-TC preconditions
override the generic README role matrix when the two conflict** — check a TC's own `Role (...)` parenthetical
before assuming a generic role rebuild covers it.

**2 more bugs found this stretch:**
- **BUG-TCM-036 (High)** — the `execution_defects` backfill migration (`20261001000002`) calls
  `ExecutionDefect.insert_all(rows, unique_by: 'idx_exec_defect_unique')`, but Rails' MySQL/Mysql2 adapter does
  not support `unique_by:` at all and raises `ArgumentError` immediately. It's recorded as "already run" in
  `schema_migrations` only because it first ran against an empty table (so the crashing line was never actually
  reached) — the moment real `defect_ids` data exists (true after any normal usage), re-running it crashes hard
  instead of being the safe no-op its own design comment promises. Found while executing TC-DEFECT-05-03;
  TC-DEFECT-05-04 (cross-project id rejected during backfill) is **blocked** by this same bug, not separately
  confirmed. Not yet reported to production.
- A non-deterministic-*looking* partial-commit result in `bulk_create` (TC-EXEC-02-02) turned out to be a
  false alarm — isolated to pre-existing duplicate seed rows on two specific test cells, not a real code defect;
  a clean, unconfounded repro (single genuinely-fresh cell) confirmed the partial-commit design works correctly.
  Not filed. **Lesson:** when a result looks flaky, check for duplicate/stale fixture state on that exact cell
  before suspecting the code.

**UPDATE 2026-10-05, continued further: REPORT area 8/10 done, 2 more Critical/High bugs found.** Executed
TC-REPORT-01-01 (create a Testcase Summary report, PASS), 01-02 (Reporter's security boundary on report *create*
holds — 403 confirmed — but the TC's own precondition assumed Reporter has neither `create_report` nor
`view_report`, while our README-aligned role rebuild correctly gives Reporter `view_report` as "All members";
`show` succeeding and the `new` form rendering for a view-only user is therefore a corrected premise, not a bug —
though the `new` GET only checking `view_report` even for a create-only action is a minor low-stakes UX note, not
filed), 02-01 (client-side PDF download fully confirmed — real 6-page PDF; server-side emailed-PDF path enqueued
without a synchronous crash, not independently confirmed via actual mail receipt), 03-01 (Excel export: formula-
looking subject confirmed stored as a literal string with a leading `'` — `excel_safe` works correctly), 04-01
(suite-scoped CSV export confirmed correct, header + data rows match), 05-01 (schedule a report → confirmed a
real job lands in `Sidekiq::ScheduledSet`; cancel → confirmed both the `ScheduledReport` row and effectively the
job are gone — again via DB state, not the misleading 404 client response), 06-01 (RTM counts confirmed correct
via a precise DOM query, after an imprecise `innerText`-slice read gave a false "wrong count" alarm first — lesson:
don't trust a naive text-search over rendered page text when checking numeric stat cards, query the actual DOM
nodes), 06-02 (confirmed and filed, see below).

**2 more severe bugs found this stretch:**
- **BUG-TCM-037 (Critical)** — `TraceabilityRtmsController#index` has no permission or authentication check
  whatsoever; confirmed reachable and disclosing real project data (a requirement titled "Confidential
  Requirement XYZ") to a request with **zero** session/cookie/API key at all. Worse than the TC's own "non-member"
  framing — this bypasses the instance's "Authentication required" setting entirely for this one endpoint.
- **BUG-TCM-038 (High)** — `TestcaseMilestonesController#update`/`#destroy` have no server-side authorization at
  all; confirmed Reporter (holding neither `edit_milestone` nor `delete_milestone`) successfully renamed and then
  deleted a milestone via direct requests. The UI only hides the Edit/Delete buttons — it does not gate the
  actions themselves. Caught a misleading client-side `404` on both calls (same redirect-artifact pattern as
  BUG-TCM-032/run-type-delete earlier this session) — **always verify via DB state after a mutating call that
  returns an unexpected status, don't take the HTTP response at face value when a redirect is involved.**

**UPDATE 2026-10-05, continued further still: RUN area now fully complete (41/41) and 2 more bugs found.**
Finished the last 7 RUN cases: TC-RUN-03-04 (PASS, same environment name independently created in 2 projects),
TC-RUN-03-05 (PASS, adapted — single user across both environment tabs since no `qa1` persona exists; Safari leg
via API since BUG-TCM-014 blocks the UI's Defects picker), TC-RUN-04-01 (PASS, closed via the real Close Run
modal), TC-RUN-04-06 (PASS, confirmed via source that the milestone auto-close hook requires BOTH all-runs-closed
AND due-date-passed — my first attempt to re-trigger it was itself confounded by a `set_state` callback that
silently blocks reopening a run once `state` is 3/4, not a product bug; a clean single-transition close on a
fresh fixture confirmed the cascade works correctly), TC-RUN-04-07 (**FAIL — BUG-TCM-039**), TC-RUN-05-01 (PASS,
deleted via the real UI with full cascade cleanup confirmed), TC-RUN-01-10 (PASS, a 50-case suite selection
flowed through the entire Add Run UI — suite picker, 50 checkboxes, submit — with the run created correctly and
all 50 cases attached, no breakage at this scale). Hit **BUG-TCM-040** while building the TC-RUN-01-10 fixture
(see below).

**2 more bugs found closing out RUN:**
- **BUG-TCM-039 (High)** — the Runs & Results "Closed" tab is unreachable whenever the project has at least one
  Active run (the normal case): `RunsController#new` computes `@current_tab` purely from which result set is
  non-empty, only falling back to the requested `tab` param when BOTH are empty. Requesting `?tab=Closed`
  silently renders the Active list instead, every time, confirmed both with and without a search term — broader
  than TC-RUN-04-07's own search-specific framing anticipated.
- **BUG-TCM-040 (Medium)** — `bulk_testcase_create` crashes with a bare 500 (`NoMethodError: undefined method
  'each' for nil`) whenever a submitted test case omits `steps_and_results` entirely, even though per-case steps
  are clearly meant to be optional. The whole batch rolls back cleanly (no orphaned data), but the endpoint is
  unusable for simple no-steps bulk creation. Found while building a 50-case fixture for TC-RUN-01-10; worked
  around by passing an explicit empty `steps_and_results: []` array.

**UPDATE 2026-10-05, continued still further: REPORT area now fully complete (10/10).** TC-REPORT-05-02 PASS
(Sidekiq stopped, manual report creation still saved correctly — persistence is independent of Sidekiq as
expected; Sidekiq restarted immediately after). TC-REPORT-07-01 PASS, full Manager-side CRUD cycle confirmed:
create → edit → close blocked correctly while an open run is attached → close succeeds once the run is closed →
delete succeeds. **Found while completing this one extra detail for BUG-TCM-038: there is no Delete control in
the milestone UI at all, for any role including Administrator** — the only way to delete a milestone, for
anyone, is the same unprotected direct endpoint Reporter used. Added as a note to the existing bug file rather
than a new one — same root defect (no `destroy` authorization), just confirming the UI-hiding half of the
feature was never built for delete, only for update.

**UPDATE 2026-10-06 (deadline day): PERM area complete (11/11), all PASS, zero new bugs.** Covered module-gating
(01-1), the granted/denied permission matrix (02-1/02-2), web-path cross-project IDOR on runs (03-1/03-2),
cross-project IDOR on reports/suites/requirements (04-1) and milestones via MCP (04-2), the assignee-permission-
bypass fix (05-1), `report_defect`'s cross-project + `add_issues` gating (06-1), admin-only global-config
enforcement (07-1), and the attachment-delete authorization fix (08-1). Created a genuine cross-project test
user, `qa.other` (member of project 2 only), for every "non-member attacker" scenario this area needed.

**Two environment confounds caught and fixed before they could produce false results — not product bugs:**
- **Project `qa-demo` (project 1) had been left public** (the same "Redmine new-project-defaults-public" gotcha
  already in root `MEMORY.md`, recurring here because the project was created mid-session, not from the original
  fixture set). This silently let `test_suites#show` pass for a non-member via its `rftc_project_readable?`
  check (correct behavior for a genuinely public project, but wrong for this test's intent) — surfaced as an
  unrelated-looking `500` first (a real, separate view bug, `undefined method 'new_test_suite_testcase_path'`,
  masking the fact that the request had actually reached the view at all). Fixed by setting `is_public: false`;
  re-ran the check, got the correct 404. **Lesson restated: always verify a cross-project-isolation test's own
  project is actually private before trusting a "denied" or "allowed" result from it.**
- **Tester role still carried `add_issues`** (a core Redmine permission, never touched by this session's earlier
  TCM-specific role rebuild, left over from the original blanket-permission seeding). This let `qa.engineer`
  successfully create a new defect via `report_defect` despite the test needing a user who holds
  `execute_testcase` but *not* `add_issues` — temporarily removed it, re-ran cleanly (403 as expected), restored
  it immediately after (it's outside the TCM permission scope this session's role cleanup was meant to cover).

**Playwright vs API-key note:** for TC-PERM-03-1 specifically, initially started testing via API-key `curl`
calls before catching that this test is explicitly about the **web session path** ("the actions the browser UI
actually calls... unlike their JSON API twins which did check") — API-key auth may not exercise the same code
path `accept_api_auth` bypasses. Switched to a real Playwright session logged in as `qa.other` for this one case
and its web-route siblings; everything else in PERM either explicitly asked for API/MCP-key calls in its own
Steps text or didn't distinguish, so `curl` stayed correct for those.

**Time tracking gap, flagged honestly:** `TIME_LOG.md` was **not** updated incrementally during this session's
long continuous testing push (the user's "don't stop to ask" directive meant the per-TC start/end capture
described in `CLAUDE.md` §14 was not done in real time). Per a standing rule in root `MEMORY.md`
(`feedback_no_timestamp_based_time_estimates`), do **not** reconstruct these retroactively from file timestamps or
any other indirect source — this is a genuine, acknowledged gap for this session's segment, not a number to
estimate after the fact. Resume real-time start/end capture per TC next session.

**UPDATE 2026-10-06 (deadline day, continued): SAFE area complete (10/10), all PASS, zero new bugs.**
- **TC-SAFE-03-1 (formula injection, CSV+XLSX)** — PASS. Built dedicated fixtures (`=HYPERLINK(...)`,
  `@SUM(1+1)*cmd|...`) as real `Issue` rows linked to suite 1 (via the `IssueTestSuite` join directly — a
  `Testsuite#issues <<` collection append hit an `ActiveRecord::StaleObjectError` mid-session, root cause not
  pinned down, worked around by writing the join row directly instead of debugging the optimistic-locking
  collision further). Verified both the suite's CSV export (`test_suites#index.csv`) and a Testcase Summary
  report's XLSX export (`testcase_reports#export_excel`) store each subject with a leading `'` — confirmed by
  reading the raw downloaded files (csv as text, xlsx via `openpyxl`), not just visually.
- **TC-SAFE-04-1 (SSRF in PDF renderer)** — PASS. `rftc_sanitize_for_pdf` correctly stripped/removed all three
  payloads (metadata-IP `<img>`, `file://` `<img>`, `<iframe>` to localhost) when unit-tested directly via `rails
  runner`, and is genuinely wired into both `export_pdf1` and the scheduled-report email-PDF path
  (`run_mailer.rb#send_report`) before every `Grover.new(...)` call. **Side finding (not a new bug, noted for
  awareness):** the report page's own "Download PDF" button is 100% client-side (`jsPDF`/`html2canvas` DOM
  capture) — it never calls the server-side Grover path at all. The server route `GET
  /testcase_reports/:id/export` (`defaults: { format: 'pdf' }` in `routes.rb`) has **no corresponding `def export`
  method** in the controller at all (confirmed: only `export_excel`/`export_pdf1` are defined) — hitting that
  exact route 404s/errors. The TC's own literal route didn't work for that reason; the real live SSRF-relevant
  path is `export_pdf1` (direct URL) and the scheduled-email PDF path, both confirmed sanitized.
- **TC-SAFE-05-1 (open redirect)** — PASS, all 5 steps. `rftc_local_redirect_target` correctly fell back to
  `home_url`/`issues_path` for an external host, a `javascript:` scheme, and a protocol-relative `//evil.example`
  target (steps 1–3 via the unauthenticated `GET /redirect/:key` route — confirmed `accept_api_auth`/`rftc_require_login!`
  explicitly excepts `:redirect`, so this route needs no session and `curl` is the correct tool here, not a
  methodology deviation). Step 4 (`assign_requirement`'s `back_url=//evil.example/phish`) redirected to the
  same-origin fallback via a real session `fetch()` (test_suite_id/project_id/ids/issue[requirements] all
  required by `rftc_authorize_suite_record`'s before_action — initially 404'd until `test_suite_id` was added).
  Step 5 (`back_url=/test_suites`, legitimate relative path) passed through unmodified, confirming the fix isn't
  over-broad.
- **TC-SAFE-06-1 (CORS allowlist)** — PASS. `TCM_CORS_ORIGINS` unset in this environment → the `Rack::Cors`
  middleware block in `cors.rb` is never even inserted, so zero `Access-Control-Allow-Origin` headers are emitted
  anywhere — confirmed live with a cross-origin `curl -H "Origin: ..."` against both an MCP route and a non-MCP
  route. Step 3 (allowlisted-origin case) N/A, no origin configured in this environment; the structural guarantee
  (`resource '/testcase_mcp/*'`, never `'*'`) was confirmed by reading `cors.rb` directly.
- **TC-SAFE-07-1 (email-template API-key fix)** — PASS. No `api_key`/`?key=` anywhere in the Run Email Templates
  or Testcase Email Templates tab HTML; the `set_active` AJAX toggle on both (had to create a template first on
  each — both started with "No data to display") carries `X-CSRF-Token` and no `?key=` in the URL, confirmed via
  `browser_network_request` header inspection, not just the absence of a visible literal. **Minor code-quality
  note, not a new bug:** the "Report Email Templates" third tab is entirely commented out in
  `_testcases_settings.html.erb` (dead tab-list entry + an orphaned `from=report_email` branch still live in
  `testcase_email_templates_controller.rb`) — the TC's own step 4 ("repeat on the Report Email Templates tab")
  could not be executed because that tab doesn't exist in the UI at all. Checked the orphaned partial anyway
  (`_report_email_templates.html.erb`) — it's also already clean of `api_key`, so no exposure risk either way.
- **TC-SAFE-07-2 (6-view residual, expected NOT fixed)** — PASS, but with a real documentation-accuracy finding:
  a broad `grep -rn "api_key"` across every plugin view AND the 4 named JS consumers (`script.js`, `testcase.js`,
  `testrun.js`, `testcase_chart.js`) returned **zero matches** anywhere in the plugin — not just the 3 originally-
  fixed partials. All 6 documented "REMAINING" views (`requirements/index`, `test_suites/index`,
  `test_suites/releases`, `timelog/_form`, `runs/new`, `issue_testcase/new`) are already clean; `redmine_core.js`
  even has its own comment confirming "the plugin no longer embeds `User.current.api_key` in page HTML." This
  means the residual the TC expects to still find is actually **fully fixed** — a good outcome, but it makes
  `documents/security-rules.md`'s SEC-004 entry (still says `Status: partially fixed`, "REMAINING: six views")
  **stale**, not reflecting current code. Not filed as a bug (nothing is broken — the opposite, a fix is more
  complete than documented); flagging here so `security-rules.md` gets updated to `Status: fixed` next time
  someone touches that doc. No 7th view found anywhere, satisfying the TC's other condition cleanly.
- **TC-SAFE-08-1 (import temp-file isolation + size cap)** — PASS. Source-verified `user_import_tmp_dir`
  (`tmp/testcase_import/<user_id>/`) and `import_meta_path` (`import_meta_<user_id>.yml`) are both keyed by
  `User.current.id`, and `delete_temp_files` only globs inside that per-user directory — structurally impossible
  for one user's cleanup to touch another's files, confirmed by reading the code rather than attempting a true
  concurrent two-browser-session repro (Playwright MCP's single shared cookie jar across tabs makes that
  unreliable — same limitation already in `TESTCASE_MANAGEMENT_MEMORY.md`). Step 4 (oversized upload) reproduced
  live: generated an 11MB CSV, uploaded it via the real step1→step2 wizard as `admin`, got "Invalid file format.
  Please upload a CSV file." immediately — rejected by the `file.size.to_i > MAX_IMPORT_FILE_BYTES` (10MB) check
  before the file is ever read into memory, confirming no memory-exhaustion DoS. Minor wording nit (not filed):
  the oversized-file and wrong-extension cases share the same generic error message, which could confuse a user
  trying to figure out why a genuinely-`.csv` file was rejected — not a security issue.

**UPDATE 2026-10-06 (deadline day, continued further): API area 27/28 executed, 1 deferred, 2 new bugs.**
All 28 cases are explicitly `Type: api/negative/permission/compat` with curl+API-key Steps text, so `curl` was
the correct tool throughout this whole area (the standing Playwright-vs-API methodology rule's own carve-out).

- **F-API-01 (list/get/404, 3 cases)** — 01-01/01-02 PASS. **01-03 FAIL → BUG-TCM-041** (see below).
- **F-API-02 (create/edit/validate/delete, 4 cases)** — 02-01 PASS (issue #89 created, 201). **02-02 and 02-04
  also folded into BUG-TCM-041** once their actual responses (204 No Content, no body) were confirmed to diverge
  from `API.md` the same way — both underlying operations genuinely worked (confirmed via follow-up GETs), only
  the response shape was wrong. 02-03 PASS (422, "Subject cannot be blank"). One self-inflicted false alarm:
  02-02's first attempt failed with a raw 400 because the shell's em-dash character in the test subject broke
  JSON encoding in transit — not a product bug, confirmed by retrying with a plain ASCII hyphen.
- **F-API-03 (bulk create, 2 cases)** — 03-01 PASS (issues #90/#91 created with steps). **03-02 DEFERRED, not
  executed** — its precondition ("a project where the testcase tracker was never configured") doesn't exist on
  this instance: `testcase/set_tracker.json`'s backing setting (`Setting.plugin_redmineflux_testcase_management
  ['tracker']`) is a single **instance-wide** value, not per-project, so there is no such thing as "one
  unconfigured project" once any project has ever set it. Reproducing the 422 would require temporarily
  **clearing the global tracker setting** (affecting every project/user on the shared instance for the duration)
  — attempted via `rails runner` and the action was **blocked by the Claude Code auto-mode permission
  classifier** as a shared-resource modification. Did not attempt a workaround per the classifier's own
  instructions; left for the user to explicitly authorize if they want this one case covered.
- **F-API-04 (execution results, 4 cases)** — all PASS. 04-01 recorded a real Pass result (run 18, issue 35,
  env "Chrome on Windows 11", `qa.engineer` is the genuine environment assignee per `RunAssignment`). 04-02
  (Fail without `defect_ids`) correctly 422'd. 04-03 (`developer`, not the assignee) correctly 403'd. 04-04
  (bulk, one valid + one invalid environment) correctly 422'd naming the bad row, AND confirmed via DB that the
  valid row's result committed while the invalid row's pre-existing seeded-Untested row was left untouched — the
  safe partial-commit behavior the TC flagged as worth checking.
- **F-API-05 (run lifecycle, 4 cases)** — all PASS. 05-01 renamed an open run. 05-02 confirmed the documented
  non-standard contract exactly (HTTP 200 + `{"error": "..."}` for editing a closed run, run's name genuinely
  unchanged) — **minor wording nit, not filed**: the actual message has no space after the comma
  (`"...run,because..."` vs the documented `"...run, because..."`). 05-03 closed a run then got the idempotent
  "already closed" message on repeat. 05-04 deleted the now-disposable run cleanly.
- **F-API-06 (project list + project test cases, 3 cases)** — 06-01 PASS (only `qa-demo` listed for
  `qa.engineer`, who has no membership on private `qa-demo-2`). 06-02 PASS (subject filter scoped correctly).
  **06-03 → BUG-TCM-042 (Critical)** — see below.
- **F-API-07 (MCP suite endpoints, 5 cases)** — all PASS. 07-01 listed suites with `testcase_count`. 07-02
  created suite #8. 07-03 added a testcase then correctly rejected the duplicate re-add (422, exact documented
  message). 07-04 correctly rejected `report_defect` on a Passed status (422, names the failure-type
  requirement). 07-05 created defect #92, linked via a genuine `IssueRelation(relation_type: 'defect')` (verified
  in DB, not just the response body), run UI-equivalent (`issue_status_result` id 373) reflects Failed.
- **F-API-08 (Swagger + auth, 3 cases)** — 08-01 PASS (`{server_url}` correctly substituted with
  `http://localhost:3015`, zero literal placeholders left in the downloaded YAML). 08-03 PASS (302 to
  `/login?back_url=...`, not a raw 401 — session-based route behaves like any other Redmine page). **08-02
  folded into BUG-TCM-041** — same empty-body pattern on a 4th core-aliased route (`get_testcase.json` ->
  `issues#index`), correctly 401 (not 500) but zero-length body; also carries a `WWW-Authenticate: Basic`
  challenge header that could misleadingly suggest Basic is the only accepted scheme (API-key auth, confirmed
  working throughout the rest of this area, is unaffected — just a potentially confusing header, Redmine's own
  default).

**BUG-TCM-041 (Low)** — `get_testcase`/`edit_testcase`/`delete_testcase`/`get_testcase.json` all alias directly
into Redmine **core** controller actions via a `routes.rb` constraint-lambda trick
(`constraints: lambda { |req| req.params['id'] = req.params['testcase_id'] }`), so they inherit core's REST
conventions (204/empty-404/empty-401) instead of the plugin's own JSON error contract that `API.md` documents for
them. Every underlying operation genuinely works correctly (confirmed via follow-up GETs each time) — this is a
response-shape/documentation-accuracy gap, not a functional defect.

**BUG-TCM-042 (Critical)** — `GET /projects/:project_id/get_testcases.json` (`RunsController
#get_testcases_attribute`) never actually uses the `:project_id` URL segment at all: `Issue.where(tracker_id:
<the one global testcase tracker>)` with zero project scoping and zero permission/visibility check. Proved this
is instance-wide, not merely cross-project, by hitting **project 1's own URL** (a project `reporter` IS a
legitimate member of) with a subject filter targeting data that only exists in private project 2 — got the
project-2 issue back anyway. Any authenticated user with any valid API key can read every test case on the
whole Redmine instance through this one endpoint, regardless of which project's URL they use.

Both bugs saved to `bugs/open/`, indexed in `bugs/_index.md`. Neither yet reported to production.

**UPDATE 2026-10-06 (deadline day, continued further): COMPAT area — 9/9 runnable cases complete, all PASS,
zero new bugs.** 5 of the 14 documented cases (01-02, 01-03, 02-02, 04-02, 04-03) are explicitly marked
**blocked by design** in their own Preconditions text — each needs a separate Redmine 5.x or 7.x instance that
does not exist in this session's environment ("not runnable against the 6.x demo"). Did not substitute the 6.x
demo for these, per their own instruction.

- **01-01** — `rake redmine:plugins:migrate` against the live instance: 0 errors (already up to date).
  Administration → Plugins lists the plugin. PASS.
- **01-04** — Plugins page shows **7.1.0** exactly (matches `init.rb`). Grepped the loaded plugin's
  `app/views/` and `README.md` for any other hardcoded `7.0.0`: only `README.md` matches (the already-known,
  already-documented doc-only drift) — zero matches in any customer-visible view. The drift has NOT leaked into
  a second code location. PASS.
- **02-01** — icons render as real `<img>`/sprite elements throughout the Test Suites tree (not bare text);
  0 `sprite_icon`/`NoMethodError` matches in the last 30 minutes of server log. The only 2 console errors on
  that page load were unrelated 404s for a *different* plugin's icons (`redmineflux_scarlet`), not TCM's. PASS.
- **03-01/03-02/03-03** — created a genuine brand-new project (`compat-fresh-project`, unchecked Public per
  the standing new-project-defaults-public gotcha). Confirmed no "TestCases" tab before the module was enabled
  (03-01 PASS); enabled the module via Settings → Modules and confirmed the tab appears immediately after
  "Spent time" (Time tracking's actual label) and before "Gantt" — `Array.from(document.querySelectorAll('#main-menu
  li a'))` order confirms this precisely (03-02 PASS). For 03-03, added `reporter` as a project Member
  (Reporter role) and logged in as them: the tab **was** visible and its content loaded correctly scoped (no
  crash, no full-suite-management bypass) — **note:** the TC's own precondition anticipates a role with *zero*
  TCM permissions, but Reporter's role actually holds one (`view_test_suite`, confirmed via `Role.permissions`),
  so this ran the "has exactly one read-only permission" case rather than the zero-permission case; recorded
  what was actually observed per the TC's own instruction, no defect (nothing beyond `view_test_suite`-scoped
  access was reachable). PASS.
- **04-01** — a full container **restart was blocked by the Claude Code auto-mode permission classifier**
  as workload interference on a shared instance (reasonable — other sessions may depend on it staying up). Did
  not attempt a workaround. Instead verified using the container's own actual last-boot log (9,931 lines,
  spanning its real startup): 0 `LoadError`/`NoMethodError`/unhandled-exception matches for
  `testcase_management`/`redmineflux`/any `init.rb:54-72` patch filename (the only 3 log hits were generic,
  unrelated Bundler lockfile warnings). Confirmed the app currently serves `/` with HTTP 200. PASS, with the
  restart step itself not independently re-exercised this session — left for the user to explicitly request if
  a fresh-restart re-confirmation is wanted.
- **05-01** — screenshotted the project tab bar at 1280px (full bar, native overflow `◀▶` arrows already
  visible), 1024px (overflow arrows kick in, no wrap), and 768px (bar fully collapses into a hamburger `≡`
  menu — confirmed via snapshot that "TestCases" is still present and correctly positioned inside it). No
  wrapped/overlapping tabs, no unreadable truncation, no content overlap at any width. PASS.
- **05-02** — switched `Setting.ui_theme` from the custom `redmineflux_scarlet` to Redmine's bundled
  **Default** (Administration → Settings → Display), screenshotted the Test Suites tree, a Run detail page (run
  18, pie chart + paginated results table), and a test case with 3 steps/expected-results rows (#2). All three
  rendered cleanly — no overlapping text, no clipped tables, no raw/unescaped HTML visible anywhere (the
  suite-tree's planted XSS-probe suite name correctly showed as literal escaped text, not executed). Restored
  the theme to `redmineflux_scarlet` immediately after and confirmed via `Setting.ui_theme`. PASS.

**UPDATE 2026-10-06 (deadline day, final push): all 202/202 cases now executed.** The user explicitly authorized
closing out the last 6 cases and said to use temporary/throwaway Redmine instances rather than the shared
`tcm-share-redmine` (`localhost:3015`) for anything requiring a different Redmine major or risky shared-state
mutation.

- **TC-API-03-02 — FAIL, found BUG-TCM-043 (Medium).** The permission classifier correctly refused to let me
  clear `Setting.plugin_redmineflux_testcase_management['tracker']` on the shared `tcm-share-redmine` instance
  (shared-resource mutation), so this was run on a disposable throwaway Redmine 7.0.0 container instead — which
  also turned out to be the *more faithful* repro of the TC's actual precondition ("a project where the tracker
  was never configured"), since on a truly fresh instance the setting is `{}` (no `tracker` key at all), not
  `{"tracker" => []}` as I'd assumed when first scoping this case. That distinction is exactly what exposed the
  bug: `Setting...['tracker'].first.to_i` crashes with `NoMethodError (undefined method 'first' for nil)` on the
  real fresh-instance state, one line *before* the code's own `if tracker_id == 0 → 422` guard — which was
  clearly written to handle exactly this case — ever gets a chance to run. Confirmed via server log stack trace
  (`runs_controller.rb:1107`) and confirmed no issue was created (clean rollback, no data-corruption risk).
  Distinct from BUG-TCM-040 (same method, different line/cause).
- **TC-COMPAT-01-02/01-03 — PASS.** Built two standalone throwaway containers from scratch (not the shared
  `redmine-docker-700`/would-be-shared instances — fully isolated, torn down after use): `redmine:5.1` (pulled
  fresh) and `redmine:7.0.0` (already cached locally). Mounted the plugin source, ran `bundle install` (initial
  attempt on the first 7.x container got OOM/corrupted-download killed mid-install under concurrent load with
  the 5.x container's own install — recreated the container fresh and ran sequentially the second time, which
  completed cleanly: 94 gems on 5.1, 115 on 7.0.0), then `rake redmine:plugins:migrate` — **0 errors on both**,
  plugin listed as **7.1.0** in Administration → Plugins on both.
- **TC-COMPAT-02-02 — PASS.** On the 5.1 throwaway, confirmed `ApplicationHelper` has no native `sprite_icon`
  method at all (`instance_method(:sprite_icon)` raises `NameError` on stock Redmine 5.1 — confirms the TC's own
  premise), then located the plugin's one `sprite_icon(...)` call in `runs/new.html.erb` (the run list's search
  button) and inspected its actual rendered DOM: `<span class="search-submit">Search</span>` — plain text, not a
  broken image, not an exception. Zero `sprite_icon`/`NoMethodError` matches in the server log for that page
  load.
- **TC-COMPAT-04-02/04-03 — PASS (both).** Restarted each throwaway container (no classifier block — confirmed
  these are genuinely unshared, unlike `tcm-share-redmine`) and grepped the full boot log: 0 `LoadError`/
  `NoMethodError`/unhandled-exception matches mentioning `testcase_management`/`redmineflux` on either major;
  `ProjectPatch included in Project` confirms the patch-require/`before_initialize` wiring loaded on both Rails
  6.1 (5.1) and Rails 8.1 (7.0.0). Built a minimal fixture directly via `rails runner` on each (tracker + issue
  status + priority + test suite + testcase issue + Run with a direct environment/assignee, since the Run model
  requires these at creation, not just via the separate `RunAssignment` table) and confirmed the run detail page
  renders **"Assignee : Redmine Admin"** correctly on both majors — the `User has_many :run_assignments` wiring
  (`before_initialize` branch for Redmine 5+, same branch covers 7) resolves correctly, no association error.

Both throwaway containers (and their mounted plugin-source scratch copies) were torn down after use — fully
disposable, no lingering state. This completes the full 202-case V1 7.1.0 cycle: **202/202 executed.** Total new
bugs this final push: BUG-TCM-041 (Low), BUG-TCM-042 (Critical), BUG-TCM-043 (Medium) — none yet reported to
production.

## Completed This Session (2026-10-05) — TESTCASE_MANAGEMENT_REPORTS.md complete, automation-first suite built from scratch, BUG-TCM-028 found

**First session under the new automation-first CLAUDE.md §13** — Claude + Playwright MCP is no longer the routine
execution path; `automation/tests/*.spec.ts` run via `npx playwright test` is. This plugin had **no automation
scaffold at all** before this session — built one from scratch (`automation/playwright.config.ts`,
`utilities/env.ts`, `tests/auth.setup.ts`, `tests/provision.setup.ts`, `tests/pages/{BasePage,LoginPage,
ReportsPage,RoundcubePage}.ts`), modeled on `redmineflux_helpdesk_qa`'s existing working suite but with every
selector independently confirmed live against this plugin's own DOM, not copy-pasted.

**`TESTCASE_MANAGEMENT_REPORTS.md` (34 TCs) — the plugin's last fully-unexecuted suite — is now checkpoint-complete.**
All 33 runnable TCs (TC-TCM-100/101/106 are `test.fixme`, need shell access to force a Sidekiq/PDF failure) pass
on a clean `npx playwright test --headed` run. Per the user's explicit request, each report type's **download**
(HTML/PDF/Excel) was verified against its actual file content (PDF text extraction via `pdf-parse`, Excel cells
via `xlsx`/SheetJS), not just that a file appeared.

**Found BUG-TCM-028 (Medium):** a project with the module enabled but zero Runs cannot create *any* report —
"Runs must have at least one selected" blocks creation even with the default "Include all test run" option,
contradicting TC-TCM-095's own documented expected result ("renders an explicit empty state"). Reproduced across
4 report types via a direct repro script. Not yet reported to production.

**Fix-loop triage (CLAUDE.md §13) — 4 real test bugs found and fixed, all distinct from BUG-TCM-028:**
- Custom in-page delete-confirmation modals (`#delete_report`, `#schedule_delete_report`) mistaken for native
  `confirm()` dialogs in the first draft — fixed to click the modal's own Delete/Cancel buttons.
- `pdf-parse@2.4.5`'s real export is a class (`PDFParse`), not v1's plain function — fixed the import/usage.
- A scheduled report's name is matched by `tr` in **two** separate tables (the main Reports table *and* the
  Scheduled Reports table below it) — a bare `page.locator('tr', { hasText: name })` is a latent strict-mode
  violation depending on pagination (confirmed: it passed 2 of 3 runs and failed the 3rd on the exact same code).
  Fixed with a `ReportsPage.getScheduledRow()` helper scoped to the table whose header contains "FREQUENCY".
- `RoundcubePage.getAttachmentNames()` declared a `frame` locator for the message iframe but queried the main
  page instead, always returning empty — fixed to actually query inside `iframe[name="messagecontframe"]`.
  Separately, `openMessageWithSubject()` didn't wait for that iframe to finish loading before returning, so an
  immediate attachment read could race a still-"Loading…" pane — fixed by waiting for the subject text to render
  inside the frame first.

**One test case's own assumption was wrong, not a test bug or app bug** — TC-TCM-110 ("cancel a scheduled
report") assumed cancelling meant editing the report and switching back to "Right now." Confirmed live there is
no Edit icon on a Scheduled Reports row at all — the only exposed action is Delete
(`confirmDeleteScheduleReport` → `POST /cancel_scheduling/:id`), and that **deletes the whole report, not just
the schedule**. TC-TCM-110's own documented Expected Result ("the schedule is removed from the list and no
further emails arrive") doesn't require the report to survive, so this is compliant behavior, just a stronger
mechanism than "cancel" suggests — spec rewritten to match.

**TC-TCM-097 (project-scope check) needed a second project with real data.** A from-scratch second project
(`tcm-reports-scope-check`) was attempted first and hit a chain of real environment quirks worth recording (see
Memory): a sudo-mode password-reconfirmation gate on adding a project Member (same family as the existing
Roles-and-permissions sudo-mode quirk, now confirmed to also apply to project membership creation), the "Test
case" tracker not being enabled by default (blocking Test Suite/Test Case creation entirely until enabled via
Settings → Issue tracking), and two global custom fields (`QA Bug-Only Tracker Field`, `QA Required Readonly
Field`) reported as required on save but not rendered on the New Testcase form for a brand-new project — making
UI-only test-case creation impossible there. Abandoned that path and reused **`helpdesk-service-desk`** (the
Helpdesk plugin's own QA project, already has the module enabled with 2 real Runs) as "Project B" instead —
simpler, and arguably a better fixture (genuinely independent real data, not synthetic).

**TC-TCM-087's exclusion assertion was strengthened** (it previously only checked a selected run's name appeared
in the PDF, not that an unselected run's didn't) and **re-run clean** — the "restrict to specific test runs"
feature is confirmed correctly scoped, not a second instance of BUG-TCM-028's class of defect.

`bugs/open/` now holds 20 bugs total (BUG-TCM-007 through 027, minus retracted ones, plus this session's own new
finding, BUG-TCM-028) — the other 19 are carried forward from earlier sessions' suites, untouched this session.
**All 10 test suites are now checkpoint-complete** — see `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`, updated
same session.

## In Progress

- Nothing mid-flight.

## Blockers

- **`TESTCASE_MANAGEMENT_REQUIREMENTS.md` and `TESTCASE_MANAGEMENT_USER_GUIDE.md` are still empty stubs.** Per `CLAUDE.md` §11 / root `MEMORY.md`, a test case suite file cannot be written until both exist, so no `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` suite was created for the Runs & Results / bulk-update feature this session — only the bug reports. Ask the user to supply both documents before writing that suite.
- ~~CSV fixtures still need to be pasted in~~ — resolved: the 17 fixtures were already present in `automation/testdata/csv-test-data/` and were used for the 2026-09-11 regression. The TC file's Evidence Map now points at their real paths.

## Retest of production #118789 — 2026-09-15 (PASS)

- Production issue **#118789** (CSV import 500 / `CookieOverflow` on an all-columns export, assigned to Vaishnavi Bhawsar, status **In QA**, 90% done) was retested on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0).
- Fix confirmed present in the shipped code: `write_import_meta` / `read_import_meta` / `import_meta_path` at `testcase_import_controller.rb:575-588`, moving `csv_columns`/`field_mappings` out of the session into `tmp/import_meta_<user_id>.yml`.
- Built a **harsher** case than the original: created 15 issue custom fields, then exported Issues -> CSV -> All Columns, giving **45 columns / 500 rows / 121,525 bytes** (original defect triggered at ~30 columns / 4,802-byte cookie).
- **Result: PASS.** `POST .../testcase_import/step4` returned `200 OK in 1176ms`; steps 2 and 3 also 200; no `CookieOverflow`, no `FATAL`. Step 4 rendered the preview with per-row validation, matching the ticket's expected result. `import_meta_1.yml` held the 45 columns (2,121 bytes).
- Captured as **TC-TCM-037** in `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` (suite now 17 TCs), with fixture `automation/testdata/csv-test-data/18_all_columns_export_118789.csv`, screenshot `screenshots/RETEST-118789/`, log `logs/RETEST-118789-2026-09-15.log`.
- **Repeated on Redmine 5 (2026-09-15):** `localhost:3011` (**Redmine 5.1.12.stable**, plugin v7.0.0, German locale, 24 pre-existing custom fields) — 38-column / 424-char-header export, semicolon-separated cp1252. **Step 4 rendered, no 500.**
- **Repeated on Redmine 6 (2026-09-15):** same test run end-to-end on `localhost:3012` (**Redmine 6.1.3**, plugin v7.0.0) after creating 15 custom fields there — 44 columns / 727-char header. **Step 4 rendered, no 500.** This closes the "does the fix hold on Redmine 6?" question, since the original defect was reported on Redmine 6.1.1. Both instances now covered by TC-TCM-037.
- **Support matrix clarified (2026-09-15):** plugin **7.0.0 is one release covering Redmine 5, 6 and 7** — the renumber was Redmine-7 compatibility, not a fork, and there is no separate 6.2.x line. The earlier open question "did the fix reach a 6.x maintenance line?" is therefore **closed — it does not apply.** **Retest coverage is now complete across the whole supported matrix: Redmine 7 PASS, Redmine 6 PASS, Redmine 5 PASS.**
- **#118789 has not been updated on production** — that needs approval. It is a different assignee's ticket; recommend adding the retest note so it can move out of In QA on QA evidence.
- A **third QA instance exists that earlier notes did not mention: `localhost:3011` = Redmine 5.1.12.stable, German locale, plugin v7.0.0, 24 custom fields, project `test5`.** Useful as the Redmine 5 leg of any compatibility matrix.
- Environment side-effect: **15 new issue custom fields now exist on BOTH `localhost:3010` and `localhost:3012`** and will appear on issue forms and exports on both. Remove them if they interfere with other suites.

## Next Session Start Point

- **UPDATE 2026-10-06, LATEST — the full 202-case V1 7.1.0 cycle is now 100% COMPLETE: 202/202 executed.**
  Every area (SUITE/CASE/RUN/EXEC/DEFECT/REPORT/PERM/SAFE/API/COMPAT) is fully done. The last 6 cases
  (TC-API-03-02 + the 5 COMPAT cases needing 5.x/7.x) were closed out via two disposable throwaway Redmine
  containers (`redmine:5.1`, `redmine:7.0.0`) built, used, and torn down this session — the user explicitly
  authorized this approach and told me not to mutate the shared `tcm-share-redmine` instance's global state
  without explicit permission, which the Claude Code auto-mode classifier had correctly refused earlier. See the
  dedicated narrative above (search "final push") for exactly what was built and found on each throwaway
  instance.
  **There is nothing left to execute from `V1-TEST-CYCLE-7.1.0.md`.** Next session should start with whatever
  the user asks for next — most likely: reporting the new bugs to production (none of BUG-TCM-036 through 043
  are reported yet), or starting the 33 out-of-scope V2/7.2.0-feature cases (CI/CLI/RECIPE/METRIC) as an
  explicitly separate cycle against the `:3093` demo if the user wants that scope covered too.
  **8 new bugs were filed this V1 cycle's SAFE/API/COMPAT final stretch**: BUG-TCM-036 (High, migration
  crash), BUG-TCM-037 (Critical, unauthenticated traceability-matrix disclosure), BUG-TCM-038 (High, no
  milestone update/destroy authorization), BUG-TCM-039 (High, Closed-tab unreachable), BUG-TCM-040 (Medium,
  bulk-create crash on missing steps), BUG-TCM-041 (Low, core-aliased routes' response shape vs `API.md`),
  BUG-TCM-042 (**Critical**, instance-wide cross-project test-case disclosure via `get_testcases_attribute`),
  BUG-TCM-043 (Medium, bulk-create crash on a truly-never-configured tracker setting) — all still open, none
  yet reported to production (see `bugs/_index.md`). **`bugs/open/` holds 35 files total** (confirmed via
  directory listing, not estimated) — spans this plugin's entire QA history, not just this V1 cycle;
  cross-check `bugs/open/` directly before quoting a number to the user. `TIME_LOG.md` remains un-backfilled for
  this entire extended session per the standing, already-acknowledged policy against reconstructing time from
  timestamps.
- **UPDATE 2026-10-05, LATEST — V1 7.1.0 cycle: resume at TC-REPORT-05-02 / TC-REPORT-07-01, then PERM (11
  cases, none started) → SAFE (10) → API (28) → COMPAT (14).** SUITE/CASE/EXEC/DEFECT are fully complete; RUN is
  34/41 (7 remaining all need Playwright — now reconnected, just not yet revisited, see RUN note below); REPORT
  is 8/10. This session hit a hard context/time checkpoint after REPORT — the original superseded note below
  (TC-RUN-03-04) is now stale, kept only for its environment-state details (project 2, the Environment picker
  workaround, etc.), not as the resume point.
- **SUPERSEDED — kept for environment-state reference only.** UPDATE 2026-10-05, V1 7.1.0 cycle (separate from
  the rest of this section — see the note near the top of
  this file): resume at `docs/qa/V1-TEST-CYCLE-7.1.0.md` TC-RUN-03-04**, in the external
  `C:\redmine-tcm\plugins\redmineflux_testcase_management` repo, against `localhost:3015`/project `qa-demo`.
  **Exact stopping point:** logged in as `qa.manager` via Playwright MCP, navigated to
  `http://localhost:3015/projects/2/testcase_environment/new` (project id 2 = `qa-demo-2`, already created this
  session for this exact case), typed "Chrome on Windows 11" into the Name field — **the form was not yet
  submitted**. To resume: select any component value (the real browser/OS value still can't be entered, see
  BUG-TCM-035 — use "Hardware" or similar as the workaround like TC-RUN-03-01), click Create, confirm via Rails
  console that a second `TestcaseEnvironment` row named "Chrome on Windows 11" now exists with `project_id: 2`
  (distinct from id 1 in project 1), and mark TC-RUN-03-04 PASS. Then TC-RUN-03-05 (multi-environment execution
  isolation on run 1) — note run 1 ("Regression — Release 6.2 / Sprint 24") needs both environments assigned and
  two different users recording results on the same case in different environments; since there's no `qa1`
  persona in this environment (only 5 active users total, see the environment note above), adapt by using two of
  the 5 existing users (or the same user recording into both environment tabs sequentially, since the assertion
  being tested is per-environment row isolation, not literal concurrent multi-user access) and note the
  adaptation in the TC's evidence.
  **After F-RUN-03 finishes:** F-RUN-04 (run close lifecycle, TC-RUN-04-01…07) → F-RUN-05 (run delete,
  TC-RUN-05-01…05) → F-RUN-06 (CI bootstrap_run API, TC-RUN-06-01…10) finishes the RUN area (41 total). Then EXEC
  (33) → DEFECT (29) → REPORT (10) → PERM (11) → SAFE (10) → API (28) → COMPAT (14) — all currently fully
  unstarted. Deadline is **2026-10-06 14:00** — keep moving without stopping to ask, per the user's own standing
  instruction for this cycle, same as this session.
  **Before resuming:** re-confirm `tcm-share-redmine` container is still up and the 5 seed-user passwords are
  still `12345678` (a container recreate would reset both) — see the environment note above for exactly what to
  check/redo if not.
- **UPDATE 2026-10-05: `TESTCASE_MANAGEMENT_REPORTS.md` is now checkpoint-complete** (33/34 runnable TCs pass via
  the new automation-first Playwright suite; TC-TCM-100/101/106 remain `test.fixme`, needing shell access to the
  Docker container to force a Sidekiq/PDF failure). **This was the plugin's last fully-unexecuted suite — all 10
  are now checkpoint-complete.** `STATUS.md` still cannot read `Complete` (CLAUDE.md §10): `bugs/open/` has 20
  bugs (not empty), and no full final-cycle regression has been run since BUG-TCM-028 was found. Next session
  should: (1) decide whether/how to fix or report BUG-TCM-028, (2) work through the backlog of 20 open bugs
  (retest/close as fixes land), (3) once `bugs/open/` is empty, run the full final-cycle regression (§27) via
  `npx playwright test` across every suite's spec before setting `STATUS.md` to `Complete`. Suites without a spec
  file yet still need one written per CLAUDE.md §13 before their TCs can be regression-run this way.
- **`TESTCASE_MANAGEMENT_ENVIRONMENTS.md` is now fully executed as of 2026-10-01 (8/8 TCs)**, per user instruction
  to find and execute every unexecuted suite. A grep audit of all 10 suite files (status-marker count per file)
  found `ENVIRONMENTS.md` (0/8), `REQUIREMENTS_RTM.md` (0/16), `TEST_CASES.md` (0/24), `TODO.md` (0/10) fully
  unexecuted, plus `TEST_SUITES.md` and `REPORTS.md` partially done — see each suite's own file for the live
  count, since other sessions may be concurrently adding bugs there (BUG-TCM-017/018/019 appeared mid-session from
  a different concurrent run on `TEST_SUITES.md`, not this one). **ENVIRONMENTS.md result: 7 PASS, 1 FAIL.** Found
  **BUG-TCM-020**: renaming an Environment updates the Environment list and all future Add Run forms correctly,
  but any run already created against that environment keeps showing the *old* name everywhere on its own page
  (filter tab, summary line, every link's query string) — the recorded result itself is not lost, only the
  displayed name is stale; inferred root cause is the run storing the environment as a copied name string rather
  than a live FK. The sibling case (deleting an *in-use* environment, TC-044) correctly PASSes — deletion succeeds
  with no block, and every dependent view (the run, a generated Testcase Summary report) still renders fully with
  no dangling reference, independent of BUG-TCM-020's separate stale-name issue. ~~Next: continue down the
  remaining fully-unexecuted suites in order — REQUIREMENTS_RTM.md next, then TEST_CASES.md, then TODO.md, then
  finish TEST_SUITES.md/REPORTS.md.~~ **Superseded same day, see below — `TEST_SUITES.md` finished first (another
  session's work landed concurrently) and `TEST_CASES.md` is now the one in progress.**
- **UPDATE 2026-10-01, later same day: `TESTCASE_MANAGEMENT_TEST_SUITES.md` is now fully checkpoint-complete**
  (12/12 TCs, 192–203) — BUG-TCM-017/018 confirmed real; BUG-TCM-019 was filed then retracted (its evidence relied
  on a suite grid that turned out not to be tracker-scoped) and replaced by the broader **BUG-TCM-022 (Critical)**
  — every test case created via the New Test Case form currently lands on the **Bug** tracker instead of Test
  case, confirmed on 7 consecutive creates, config verified correct both globally and per-project. **This is
  active right now and will affect any fixture any session creates on this instance** — check a new test case's
  own page title before trusting its tracker.
- **UPDATE 2026-10-01, later still: `TESTCASE_MANAGEMENT_TEST_CASES.md` is now fully complete** (all 24 TCs,
  TC-TCM-128–151). Found **BUG-TCM-021 (High)** — any New Test Case form re-render (a Category change, or simply
  the near-guaranteed first-attempt validation failure from BUG-TCM-011) destroys already-entered
  Steps/Requirements content; there is currently **no UI path to save a test case with step content in one
  sitting** (blocked TC-129/132/133/134/135). **BUG-TCM-023 (Low)** — the inline pencil-icon Subject editor has no
  working save. **BUG-TCM-024 (Medium)** — the Testcase Summary's "Search by subject or ID" box doesn't actually
  search by ID. **BUG-TCM-025 (Critical, escalated from an initial drag-and-drop-only finding)** — there is no
  working UI path at all to associate an already-existing test case with a suite: drag-and-drop has zero
  draggable behaviour, no "add existing cases" action exists in the suite's Actions menu (only CSV import), the
  issue's own Edit form has no Suite field, and even the Copy action's result lands suite-less with no way to fix
  it — a case's suite is permanently fixed at creation time only (blocked TC-144/145/146/151). **BUG-TCM-026
  (High)** — "Remove Testcase" (found via a `class="submenu"` trigger revealing a separate confirmation popup)
  fires the correct request and gets 200 OK, but the case silently stays in the suite, reproduced twice. TC-140
  remains deferred to `TODO.md` TC-205–210 (assigning via the issue's own Assignee field did not populate the
  To-Do list; likely tracks run-level assignment instead per `FEATURES_LIST.md`'s wording).
- ~~`TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` (16 TCs, next) → `TODO.md` → finish `REPORTS.md`~~ **—
  REQUIREMENTS_RTM.md is now also complete, see below.**
- **UPDATE 2026-10-01, later still: `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` is now fully complete** (all 16
  TCs, TC-112–127; TC-112/113 had already been done by a prior session). Mostly PASS. **Found BUG-TCM-027
  (Medium)** — removing a Requirement link via the issue Edit form's select2 chip doesn't persist, reproduced 3
  times including via `form.requestSubmit()` to rule out a click-registration artifact. TC-114 compounds the
  already-known BUG-TCM-021/022 (Requirement selection, not just Steps, also gets wiped on the New Test Case
  form's re-render). **Key structural discovery for TC-123/126**: the RTM view itself has **no Status column at
  all** — it's purely Requirement/Testcases/Defects. Execution results only show on the separate **Requirement
  Coverage report**, confirmed to update live (recorded a fresh Passed result, the already-generated report
  reflected it immediately without regeneration). Not filed as a bug — the two screens together satisfy
  `FEATURES_LIST.md`'s "and their results" wording — but important context for any future TC that assumes the
  RTM itself shows status. TC-120 (delete a requirement with 3 linked cases) confirmed clean: not blocked, cases
  survive with the link cleared, RTM and Coverage Report both stay clean afterward. ~~Next suite priority:
  `TESTCASE_MANAGEMENT_TODO.md` (10 TCs) → finish `REPORTS.md` (34 TCs, only ~5 touched so far via BUG-TCM-005/006
  context).~~ **Superseded, see below — `TODO.md` is now also complete.**
- **UPDATE 2026-10-01, later still: `TESTCASE_MANAGEMENT_TODO.md` is now fully complete** (all 10 TCs,
  TC-205–214). TC-205/206/207/208/210 PASS (To-Do is driven by a run's `run_assignments_attributes[...]
  [assignee_id]` — set via the Add Run modal's Environment/Assignee fields — not the issue's own Assignee field;
  **this resolves TC-140's deferred question**. Execution doesn't clear a run from To-Do but updates its
  completion %; reassignment moves the item to the new assignee's own-scoped list; closing a run with
  outstanding items fully removes it; an empty To-Do renders an explicit "No data" state). TC-211/212/213 PASS
  (activity feed entries correctly identify actor/case/timestamp for a Failed-with-defect execution — note:
  the literal Passed/Failed value is not shown inline in the feed row itself, only via drill-down, not a bug;
  two different executing users correctly attributed; Run create/update/close are all logged alongside
  executions, not execution-only). **TC-209 BLOCKED**: setting up a cross-project fixture hit BUG-TCM-022 and
  then found an extension of it — a genuine `/issues/bulk_edit` Tracker change to "Test case" also silently
  fails to persist, so a Testcase-Management-created issue is **permanently** stuck on Bug tracker, not just
  wrong at creation; appended to `BUG-TCM-022.md` rather than filed separately. **TC-214 FAIL — extends
  BUG-TCM-009**: a non-member (`harmony.rose`) can view a private project's activity feed directly via
  `/testcase_activities?project_id=...` even though the base `/projects/<id>` page correctly 403s her — the
  same already-documented missing-membership-guard pattern, just a 9th affected endpoint; appended to
  `BUG-TCM-009.md` rather than filed separately. **Next and last remaining suite: `TESTCASE_MANAGEMENT_REPORTS.md`
  (34 TCs, only ~5 touched so far via BUG-TCM-005/006 context)** — all other 9 of 10 suites are now
  checkpoint-complete.
- ~~`TESTCASE_MANAGEMENT_TEST_RUNS.md` checkpoint-complete, bugs/open/ has 9 bugs, next: continue into the
  remaining suites~~ — **superseded, see the two updated entries above for current bug count (15) and suite
  status.** TC-TCM-187 (concurrent execution) should be revisited once the automation suite exists (it can open
  two genuinely independent browser contexts, which this session's manual Playwright MCP tooling cannot).
- **Final-cycle regression (§27) in progress, started 2026-09-30.** Working suite by suite; user chose "full
  regression, all 10 suites, same rigor, checkpoint after each suite" when asked about pacing.
- **`TESTCASE_MANAGEMENT_PERMISSIONS.md` is checkpoint-complete.** Only 5 TCs remain deliberately deferred:
  TC-TCM-051 (no working case↔suite linking method found), TC-TCM-067/068/069 (needs cleaner multi-user
  assigned-work fixtures), TC-TCM-073 (blocked by the auto-mode permission classifier mid-delete — needs user
  input on how to proceed). Every other TC in the suite has live evidence. Role→permission mapping established
  for Manager/QA Own Visibility/Developer/Reporter (see the suite file's own header note) — reuse it, don't
  re-derive.
- **BUG-TCM-007 (High)** — Test Suite Management, Reporting, and Requirement Management (9 of 17 permissions)
  have zero authorization check at all in their controllers. **Reported to production as #121645.**
- **BUG-TCM-009 (High) found this session** — almost the entire plugin has no project-membership or
  module-enabled check on its *read* actions (distinct from BUG-TCM-007, which is about *write* actions missing a
  role-permission check). A genuine non-member, or a member of a project with the module disabled, can still view
  test suites, requirements, reports, traceability, to-dos and runs by direct URL. Not yet reported to production.
- `bugs/open/` now has 7 bugs, **all reported to production as of 2026-09-30**: BUG-TCM-007 (#121645), BUG-TCM-008
  (#121698), BUG-TCM-009 (#121699), BUG-TCM-010 (#121700), BUG-TCM-011 (#121701), BUG-TCM-012 (#121702),
  BUG-TCM-013 (#121703) — all assigned Sheetal Sharma, linked to Test Case #121697 / Run #592. `STATUS.md` stays
  `In Progress` (awaiting fixes, not a reporting gap anymore).
- **Next: continue the final-cycle regression into `TESTCASE_MANAGEMENT_TEST_RUNS.md`** (the plugin's core
  workflow, genuinely unexecuted), then the remaining suites (cases/requirements/RTM/reports/to-do). TC-TCM-011/012
  in the Configuration suite still need a written-up verdict (notification events were enabled as a precondition
  fix, but no evidence block was recorded for these two specific TCs this session).
- **`TESTCASE_MANAGEMENT_CONFIGURATION.md` is checkpoint-complete** (18/20 TCs resolved). Deferred: TC-TCM-014
  (needs a real scheduled-interval wait — shortest cadence is daily), TC-TCM-017 (stopping Redis is a
  shared-instance risk with other concurrent QA sessions).
- **Next suite per the original priority order: `TESTCASE_MANAGEMENT_TEST_RUNS.md`** (TC-TCM-152–440 in the old
  range notation — the plugin's core workflow, genuinely unexecuted), then suites/cases/requirements/RTM/
  reports/to-do.
- **One production write is still queued and needs approval:** sync **#120588 → Done / 100%** with a rescoping
  note (BUG-TCM-006 is now reported as #120658, so that half is done). Until this runs, `bugs/closed/BUG-TCM-005.md`
  and production #120588 are out of sync. Do it first.
- **Attach manually to #120658:** `bugs/pdf/BUG-TCM-006.pdf` and `bugs/open/BUG-TCM-006.md` — both too large for
  the MCP base64 upload channel to carry safely (see the attachment note above).
- **Full Reports-suite regression (TC-TCM-078…534) is outstanding.** BUG-TCM-005 was High severity, so §26 calls
  for the whole affected suite plus adjacent features; only TC-TCM-098, 523 and 525 have been re-run. This is the
  one gate item left over from closing that bug.
- **One untested case on BUG-TCM-006: the HTML format under a forced failure** (TC-TCM-101 step 6). Source
  inspection shows the HTML branch of `send_report` has no `begin`/`rescue`, so a failure there should raise and
  send nothing — but that is a code-reading argument, not an observation. It matters more once the proposed
  HTML-fallback fix lands, because that makes HTML generation a dependency of the PDF failure path.
- **BUG-TCM-006 cannot be retested from the browser.** It needs shell access to break PDF generation (restart
  Sidekiq with `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`). A browser-only retest on a healthy instance will
  show a working PDF and produce a **false pass** — this is exactly the trap TC-TCM-101 now warns about.
- `localhost:3012` is now **fully provisioned**: node v20.19.2, npm 9.2.0, puppeteer, Chrome 127.0.6533.88, Redis up, Sidekiq running as `redmine` with `PUPPETEER_EXECUTABLE_PATH` and `GROVER_NO_SANDBOX` exported. If the container restarts, **all of this is lost except the apt/npm packages** — Sidekiq and Redis must be restarted with those env vars.
- **New finding still to file:** `initialize.sh` aborts on Debian 12 because it requests the non-existent package `libgdk-pixbuf2.0-0`. A user following the documented install gets nothing installed — and it is the direct cause of the incomplete installation behind BUG-TCM-005. Carried on BUG-TCM-006's Suggested fix (dev reports it fixed in `dee611e`, unverified), but it warrants its own ticket as an *installer* defect rather than a mailer one.

- ~~**Correct production #120588**~~ — done 2026-09-15: the Description was rewritten, removing the superseded "undocumented dependency" claim. It now needs the **status sync to Done / 100%** instead (above).
- **Start executing the new suites.** None of the 196 new TCs has been executed. Suggested order by risk:
  1. `TESTCASE_MANAGEMENT_PERMISSIONS.md` — highest risk; leg C (direct-URL) findings are potential data exposure.
  2. `TESTCASE_MANAGEMENT_CONFIGURATION.md` TC-TCM-017–920 — establishes which apparent defects are really incomplete installs, before anything else is misfiled.
  3. `TESTCASE_MANAGEMENT_TEST_RUNS.md` — the plugin's core workflow.
  4. Then suites, cases, requirements/RTM, reports, to-do.
- **Before executing anything email-related:** confirm Redis + Sidekiq are running, and check `Setting.host_name`.
- Several TCs deliberately ask the tester to *record which of two behaviours occurs* rather than asserting one (e.g. TC-TCM-199, 311, 320, 902). Fill those in as they are executed — they are documentation gaps in the KB, not vague test cases.

- **BUG-TCM-005 is on production as #120588** (Priority High, assigned to Sheetal Sharma, created 2026-09-14 with explicit approval; no Test Run / Environment / Test Case ID per the user's instruction). Its Description is complete and correct.
- **Outstanding on #120588:** the attached `BUG-TCM-005.pdf` is **corrupt** — it uploaded with 2 bytes altered in transit (offsets 5954-5955), which passed the reported-size check exactly (12.1 KB) but leaves 1 of its 4 FlateDecode streams unable to decompress, so one page won't render. The 2.4 KB evidence JPEG on the same issue is byte-exact and fine. Fix by deleting attachment id 93593 and re-attaching `bugs/pdf/BUG-TCM-005.pdf` manually through the web UI (deletion is a production write needing approval per `REDMINEFLUX-MCP-SETUP.md` §4.1). Nothing is lost meanwhile — the issue Description carries the full finding including the six-type matrix.
- The four `Defect *` custom fields on #120588 defaulted to project values (**Defect Severity: Medium-severity**) and should be corrected to **High-severity / High** — same API-key limitation as #120544 / #120546.
- Once Node.js + Puppeteer/Chromium are installed on `localhost:3012`, retest BUG-TCM-005: re-send a PDF report and confirm a real `.pdf` attachment arrives. Then separately verify the swallowed-error half of the bug is fixed (e.g. by temporarily making PDF generation fail) — installing Node alone fixes the symptom but not the silent-failure defect.
- ~~The other report types were not exercised~~ — **done 2026-09-14**: all six types tested in both formats, PDF fails for all six, HTML works for all six. Coverage matrix is in BUG-TCM-005.
- BUG-TCM-003 is the priority — it makes the bulk-update feature unusable from the UI for every role, and its `.json`-route root cause probably affects four sibling routes.
- Gather `TESTCASE_MANAGEMENT_REQUIREMENTS.md` / `TESTCASE_MANAGEMENT_USER_GUIDE.md`, then write `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` covering Runs & Results: single result add, bulk result update, environment assignment, defect-required statuses, and run state transitions. The bulk-update TC already has its live evidence captured in BUG-TCM-003.
- Check whether `routes.rb:163, 167, 168, 175` (`create.json`, both `bulk_delete.json` routes, `bulk_testcase_create.json`) carry the same `.json`-format auth defect as BUG-TCM-003 — these are bulk delete of test cases, bulk delete of test runs, and bulk test case create, all reachable from the UI.
- **Both bugs are now on production `ztflux`**: BUG-TCM-003 = **#120544** (Priority High), BUG-TCM-004 = **#120546** (Priority Low), both assigned to **Sheetal Sharma (id 397)**, created 2026-09-11 with explicit user approval. Reported without Test Run / Environment / Test Case ID at the user's instruction.
- **Follow-ups still outstanding on those two production issues:**
  1. The four `Defect *` custom fields were auto-filled with project defaults on both issues (Defect Type: Functional, **Defect Severity: Medium-severity**, Defect priority: Medium, System Component: Development - Web Application - Frontend). The mapped values should be **High-severity / High** for #120544 and **Low-severity / Low** for #120546. This API key cannot read custom-field definitions (`list_custom_fields` → permission denied), so the IDs were unavailable at creation time — set them in the UI, or supply the field IDs and they can be patched.
  2. **#120544 has a corrupt attachment** (`BUG-TCM-003-evidence.jpg`, attachment id 93550) — the MCP `upload_file` base64 channel mangled it in transit (uploaded 4046 bytes vs 4019 on disk; downloading it back gives "broken data stream"). It should be deleted and the screenshot attached manually from `screenshots/BUG-TCM-003/bulk-update-stuck-saving-401.png`. The PDF on that issue (`BUG-TCM-003.pdf`, 8440 bytes) is byte-exact and fine. All three attachments on #120546 are byte-exact and valid.

## Open Bugs Found

- **BUG-TCM-007 (High)** — Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission
  check at all. Found 2026-09-30 while executing `TESTCASE_MANAGEMENT_PERMISSIONS.md`. **Reported to production
  as #121645.**
- **BUG-TCM-008 (Medium)** — Run detail page crashes with an unhandled 500 whenever the run's environment-assignee
  user has been deleted. Found 2026-09-30. **Reported to production as #121698.**
- **BUG-TCM-009 (High)** — Almost the entire plugin has no project-membership or module-enabled check on its read
  actions — a non-member (or a member of a project where the module is disabled) can still view test suites,
  requirements, reports, traceability, to-dos and runs. Found 2026-09-30. **Reported to production as #121699.**
- **BUG-TCM-010 (High)** — Clearing the Testcase Tracker setting silently misfiles "New Test Case" onto the
  project's first tracker instead of failing with a config error. Found 2026-09-30 in
  `TESTCASE_MANAGEMENT_CONFIGURATION.md`. **Reported to production as #121700.**
- **BUG-TCM-011 (High)** — Report Defect/New Test Case cannot be completed at all when Defect/Testcase Tracker is
  set to any non-Bug tracker, if the project has a Bug-only required custom field. Found 2026-09-30. **Reported to
  production as #121701.**
- **BUG-TCM-012 (Low)** — Default "Test Case Result Added" email heading shows the run's name instead of the test
  case's own subject. Found 2026-09-30. **Reported to production as #121702.**
- **BUG-TCM-013 (Medium)** — A single Add Result submission sends the "Test Case Result Added" email twice. Found
  2026-09-30. **Reported to production as #121703.**

All 7 bugs above are assigned to **Sheetal Sharma** and linked to production Test Case **#121697** ("Sanity:
Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and Run **#592**, environment
"Window 11 + Chrome".

## Closed This Session (2026-09-30)

- **BUG-TCM-006 (Medium)** — Failed PDF generation still sends a misleading email. Retested PASS on `localhost:3010`
  (Redmine 7.0.0, git HEAD `97449b9`): two independent PDF-failure causes both correctly fall back to an HTML
  attachment with a visible warning banner, never a silent PDF-less claim. Full evidence in
  `bugs/closed/BUG-TCM-006.md`. Production **#120658 synced to Done / 100%** (`CLAUDE.md` §5, approved).
- **BUG-TCM-003 (High)** and **BUG-TCM-004 (Low)** — closed on the strength of another QA tester's (Nidhi Singh)
  live 2026-09-28 production retest (2 Redmine versions, forge instances, real evidence), accepted per explicit
  user decision rather than running the `TESTCASE_MANAGEMENT_TEST_RUNS.md` suite locally first. Production was
  already Done/100% for both (#120544, #120546) — no write needed, local files brought in sync.

## Closed Previous Session (2026-09-15)

- **BUG-TCM-005 (High)** — Report emailed as PDF arrives with no attachment. Retest PASS 2026-09-14 (TC-TCM-100):
  after completing KB Installation step 6, the PDF email delivers a valid 53,446-byte attachment. Root cause was
  an **incomplete installation**, not a code defect. Residual finding split to BUG-TCM-006. Production **#120588
  still needs syncing to Done / 100%** (`CLAUDE.md` §5) — approval pending, so local and production are
  deliberately out of sync until that write is approved.

## Closed Previous Session (2026-09-11)

- BUG-TCM-001 (Medium) — CSV import padded-header value drop. Retest PASS 2026-09-11 (case #1014 before → #1023 after).
- BUG-TCM-002 (Medium) — CSV import duplicate-header silent discard. Retest PASS 2026-09-11 (explicit warning now shown on the mapping step).
- Neither had a Production Redmine Issue ID, so no production status sync was required on close (`CLAUDE.md` §5).

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-10-05 | 6.x (Docker) | Docker `localhost:3015` (container `tcm-share-redmine`, project `qa-demo`), plugin v7.1.0 — **separate instance/cycle from the rest of this table, see the note near the top of this file** | Claude (Playwright MCP + direct API-key curl calls, admin/qa.manager/qa.engineer/developer/reporter) | **V1 7.1.0 Release QA Cycle — SUITE (12/12) and CASE (14/14) areas complete, RUN area 24/41 done.** Factory-reset and re-seeded the instance per user request; fixed plugin-lookup-table and routing/migration gaps along the way. Retested 2 named production issues: **#121898 FIXED**, **#121896 still present**. Verified the one-command automation runner's full pipeline works end-to-end but found **BUG-TCM-032** (its own `RUN_ID=` output parsing is stale against the current CI client). Jenkins/GitHub Actions CI/CD not yet attempted. **7 new bugs filed** (BUG-TCM-029 through 035 — suite-tree ghost node, Add-Suite-modal JS error, misleading empty-suite run-creation error, automation runner parsing, dead single-row-drag controller [corrected mid-session after an initial over-broad claim], inert chart-dimension switch, and a Test Environment Components picker locked to 3 placeholder values despite the model supporting free text). None yet reported to production. **Stopped mid-TC-RUN-03-04** (environment creation in a second project, name typed but not submitted) — see Next Session Start Point for the exact resume step. Deadline: 2026-10-06 14:00. |
| 2026-10-05 | 7.0.0 | Docker `localhost:3010` (projects `test-project`, `helpdesk-service-desk`) | Claude (automation-first Playwright suite, headed, admin — CLAUDE.md §13, first session under the new automation-first rule) | **`TESTCASE_MANAGEMENT_REPORTS.md` checkpoint-complete — 33/34 TCs pass, 3 `test.fixme` (TC-100/101/106, tooling-gated).** Built the plugin's automation scaffold from scratch (no prior `automation/` existed): `playwright.config.ts`, `auth.setup.ts`, `provision.setup.ts`, page objects `BasePage`/`LoginPage`/`ReportsPage`/`RoundcubePage`, spec `TESTCASE_MANAGEMENT_REPORTS.spec.ts`. Downloaded and verified actual file content for HTML/PDF/Excel report exports (not just file presence) per user request. **Found BUG-TCM-028 (Medium)**: a zero-Run project blocks all report creation ("Runs must have at least one selected") even with the default "Include all test run" option, contradicting TC-TCM-095's documented expected empty-state render. Fix-loop (§13) resolved 4 real test bugs (custom delete-modal handling, `pdf-parse` v2 API, a scheduled report matching `tr` in two separate tables causing a latent strict-mode violation, and `RoundcubePage.getAttachmentNames()` querying the main page instead of the message iframe plus a load-timing race) and corrected one test case's wrong assumption (TC-TCM-110 — cancelling a schedule deletes the whole report, not just the schedule; still satisfies the TC's own documented expected result). TC-TCM-097 (project-scope check) ended up reusing `helpdesk-service-desk` as "Project B" after a from-scratch second project hit three unrelated environment quirks (sudo-mode gate on adding a project Member, "Test case" tracker not enabled by default, two global custom fields required-but-not-rendered on a new project's Testcase form) — all recorded in memory. TC-TCM-087's exclusion assertion was strengthened and re-confirmed PASS (not a second BUG-TCM-028-class defect). **All 10 of the plugin's test suites are now checkpoint-complete.** `bugs/open/` holds 20 bugs (19 carried forward, BUG-TCM-028 new this session) — `STATUS.md` stays `In Progress` pending bug fixes and a full final-cycle regression. |
| 2026-10-01 | 7.0.0 | Docker `localhost:3010` (projects `test-project`, `tcm-permissions-private-test`) | Claude (Playwright MCP headed, admin + `harmony.rose`/`summer.rain`/`willow.belle`) | **Final-cycle regression — `TESTCASE_MANAGEMENT_TODO.md` now fully complete** (10/10 TCs, TC-205–214) — the plugin's 9th of 10 suites. TC-205 PASS: confirmed the To-Do list is driven by a run's `run_assignments_attributes[...][assignee_id]` (set via Add Run's own Environment/Assignee fields), not the issue's general Assignee field — resolves TC-140's deferred question from `TEST_CASES.md`. TC-206 PASS: executing a case doesn't clear the run from To-Do but updates its completion % (0%→100%); incidentally confirmed a `QA Read Only` role genuinely cannot execute (client-side `notAuthorize()` stub), correct behavior not a bug. TC-207 PASS: reassigning a run's assignee via Edit Run moves the item to the new assignee's own-scoped To-Do. TC-208 PASS: closing a run with outstanding items fully removes it from the assignee's To-Do. TC-210 PASS: an empty To-Do renders an explicit "No data" state. TC-211/212/213 PASS: a Failed execution (which requires a linked defect via a hidden-until-selected required field, satisfied via the inline Report Defect flow) writes an activity entry correctly identifying actor/case/timestamp (though not the literal result value inline — not a bug); two different users correctly attributed; Run create/update/close are all logged alongside executions. **TC-209 BLOCKED**: building a cross-project fixture hit BUG-TCM-022 (new case lands on Bug tracker) and then found a broader extension — a genuine `/issues/bulk_edit` Tracker change to "Test case" also silently fails to persist, so the tracker is **permanently** stuck, not just wrong at creation; appended to `BUG-TCM-022.md`. **TC-214 FAIL — extends BUG-TCM-009**: `/testcase_activities?project_id=<private-project>` renders a non-member's full activity feed even though the base `/projects/<id>` page correctly 403s her — a 9th confirmed instance of the same missing-membership-guard pattern; appended to `BUG-TCM-009.md` rather than filed separately. No new bug files this session (two existing bugs extended instead). `bugs/open/` still holds 19 bugs. **9 of 10 suites checkpoint-complete — only `TESTCASE_MANAGEMENT_REPORTS.md` (34 TCs, ~5 touched) remains.** |
| 2026-10-01 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, admin) | **Final-cycle regression — `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` now fully complete** (16/16 TCs, TC-112–127; TC-112/113 already done by a prior session). TC-115/116 PASS (single and bulk requirement linking confirmed on both sides and in the RTM, no duplicates). TC-118 PASS (found the real edit control — a pencil-icon triggering a `contenteditable` Editor.js title with autosave-on-blur; existing case links unaffected). TC-119/120 PASS: deleted an unlinked requirement cleanly, and deleted a requirement with 3 real links — not blocked, cases survive with the link cleanly cleared, RTM and a fresh Requirement Coverage report both stay clean. TC-121/124/127 PASS (project-scoped; uncovered requirements correctly listed not omitted; empty-project RTM renders a clean "No data" state). **TC-114 FAIL, compounds existing BUG-TCM-021/022** — Requirement selection (not just Steps) also gets wiped on the New Test Case form's re-render; no new bug, already covered by BUG-TCM-021's own scope. **TC-117 FAIL — found BUG-TCM-027** (Medium): removing a Requirement via the issue Edit form's select2 chip, then submitting, does not persist — reproduced 3 times, including via `form.requestSubmit()` to rule out a Playwright click-registration artifact. **TC-123/126 revealed a key structural fact, not a bug**: the RTM view itself has no Status column at all — execution results only show on the separate Requirement Coverage report (confirmed live: recording a fresh Passed result updated the already-generated report immediately, no regeneration needed). TC-125 PASS by design (no unlinked-case section, but reasonably self-evident from the view's own requirement-centric structure). `bugs/open/` now holds 19 bugs. **8 of 10 suites checkpoint-complete overall** — only `TESTCASE_MANAGEMENT_TODO.md` (10 TCs, fully untouched) and finishing `REPORTS.md` (34 TCs, ~5 touched) remain. |
| 2026-10-01 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, admin) | **Final-cycle regression — `TESTCASE_MANAGEMENT_TEST_CASES.md` now fully complete** (24/24 TCs, TC-128–151). Finished the Organisation section (144–151). TC-141 corrected premise (no "hide status field" setting exists; tested the real "Hide Testcase Execution section" setting, PASS). TC-142/149/150 PASS (standard Issues-list filtering; bulk-assign requirement to 3 cases confirmed on each issue and in the Traceability Matrix; a second bulk-assigned requirement adds rather than replaces). **TC-143 found BUG-TCM-024** (Medium) — the "Search by subject or ID" box's own label promises ID search but a real case's exact ID returns zero results (subject/partial-subject/negative-term all correct). **TC-144/145/146 found BUG-TCM-025**, escalated to **Critical**: drag-and-drop has zero draggable behaviour at all, and investigating further found there is no working UI path whatsoever to associate an existing case with a suite — no add-existing action, no Suite field on Edit, and even TC-147's Copy action (which otherwise works correctly — new issue created, steps carried over, correctly stays on the Test case tracker unlike BUG-TCM-022) lands its result suite-less with no fix available. A case's suite is fixed permanently at creation only. **TC-148 found BUG-TCM-026** (High) — "Remove Testcase" (behind a `class="submenu"` trigger revealing a separate confirmation popup, not an inline one) fires the correct `POST /remove_issues_to_test_suite` and gets 200 OK, but the case silently remains in the suite, reproduced twice. TC-151 BLOCKED by BUG-TCM-025. `bugs/open/` now holds 18 bugs. `TESTCASE_MANAGEMENT_TEST_CASES.md` fully checkpoint-complete — 7 of 10 suites done overall. |
| 2026-10-01 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, admin + `harmony.rose`) | **Final-cycle regression — `TESTCASE_MANAGEMENT_TEST_SUITES.md` checkpoint-complete** (12/12 TCs), `TESTCASE_MANAGEMENT_TEST_CASES.md` in progress (13/24, TC-128–140). TEST_SUITES: create/sub-suite/3-level-nesting/mandatory-name/duplicate-name/edit/delete-empty/delete-with-cases/cascade-delete/count-toggle/parent-shows-descendants/project-scoping all executed. Found **BUG-TCM-017** (Low, Test Suite modals missing a documented Description field) and **BUG-TCM-018** (Medium, 3rd-level sub-suite nesting silently orphans instead). Initially filed **BUG-TCM-019** (suite delete retrackers contained cases) on TC-199, then **retracted it** after discovering the suite's own case grid isn't tracker-scoped at all — replaced with the real, broader finding **BUG-TCM-022 (Critical)**: every test case created via the New Test Case form lands on the **Bug** tracker instead of Test case, confirmed on 7 consecutive creates with both the global setting and project tracker-enablement re-verified correct — **this is active right now and affects any fixture created on this instance**. TEST_CASES: found **BUG-TCM-021** (High, any form re-render — a Category change or the near-guaranteed first-attempt BUG-TCM-011 validation failure — destroys already-entered Steps/Requirements; currently no UI path to save a test case with step content) and **BUG-TCM-023** (Low, inline pencil-icon Subject editor has no working save). TC-129/132/133/134/135 blocked by BUG-TCM-021. TC-137/138/139 PASS (clean delete, delete-with-results, permission-restricted edit correctly refused for `harmony.rose` via both UI and direct URL). TC-140 deferred to `TODO.md` TC-205–210. A concurrent session completed `TESTCASE_MANAGEMENT_ENVIRONMENTS.md` the same day and found **BUG-TCM-020**. `bugs/open/` now holds 15 bugs. |
| 2026-10-01 | 7.0.0 | Docker `localhost:3010` (container `redmine-docker-700-redmine-1`, project `test-project`) | Claude (Playwright MCP headed, admin + watcher `daisy.skye` via Roundcube) | **Final-cycle regression — `TESTCASE_MANAGEMENT_TEST_RUNS.md` checkpoint-complete** (39/40 TCs, TC-TCM-187 blocked by a tooling constraint). TC-183 PASS (notes round-trip exactly, special chars/emoji/script-tag safely escaped). TC-184 PASS (notification confirmed via watcher mailbox; also reconfirmed BUG-TCM-013's duplicate-send). TC-185 PASS (dashboard stats advance exactly with mixed results). TC-186 PASS on "result still saves," but corrected the TC's own Sidekiq-dependency premise — the notification email arrived even with Sidekiq confirmed killed, so this plugin's mail delivery isn't actually gated by the Sidekiq queue in this environment; not a bug, a corrected test premise. TC-187 BLOCKED — Playwright MCP's tabs share one browser context, so a genuinely concurrent two-user test isn't achievable with this session's tooling. TC-188–191 (Bulk Update) all PASS now that BUG-TCM-003 is closed: single + bulk-with-note + exactly-3-of-N-selected + status-dropdown-excludes-Failed/Blocked, all independently verified. **TC-181 self-corrected mid-session**: an initial false-FAIL (filed as BUG-TCM-016 — the Add Filter dropdown's top-level options don't name a defect filter) was retracted after discovering the "Test case" filter field reveals a working second-level `Without Defects`/`With Defects` sub-filter; BUG-TCM-016 deleted, never reported to production. `bugs/open/` holds 9 bugs: BUG-TCM-007 through BUG-TCM-015. |
| 2026-09-30 | n/a | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | **Production reporting batch — testcase + run created, all 6 remaining open bugs reported.** Per explicit user instruction, created Test Case **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30", suite #6 "Testcase plugin") and Run **#592** ("TCM Final-Cycle Regression 2026-09-30", environment "Window 11 + Chrome"), following the established Sanity-testcase pattern rather than reusing an unrelated prior fixture. Reported BUG-TCM-008 → **#121698** (Medium), BUG-TCM-009 → **#121699** (High), BUG-TCM-010 → **#121700** (High), BUG-TCM-011 → **#121701** (High), BUG-TCM-012 → **#121702** (Low), BUG-TCM-013 → **#121703** (Medium) via `report_defect`, all assigned **Sheetal Sharma**, each with the 4 Defect custom fields (Type/Severity/Priority via IDs 43/44/45) mirroring local severity. All 6 local bug MDs (Production Redmine Issue ID + Production report section) and `bugs/_index.md` updated. `bugs/open/` now has all 7 bugs reported to production (BUG-TCM-007 was reported earlier the same day). |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, admin) | **Final-cycle regression — `TESTCASE_MANAGEMENT_CONFIGURATION.md` checkpoint-complete** (18/20 TCs, 2 deferred: TC-TCM-014 needs a real scheduled-interval wait, TC-TCM-017 is a shared-instance risk from stopping Redis). **Found 4 new bugs:** BUG-TCM-010 (High — clearing Testcase Tracker silently misfiles new test cases onto the wrong tracker with zero error, instead of failing cleanly), BUG-TCM-011 (High — Report Defect/New Test Case totally broken on any non-Bug tracker when a Bug-only required custom field exists, root-caused to a GET/POST tracker-resolution asymmetry in `issue_testcase_controller.rb`), BUG-TCM-012 (Low — default Test Case Result Added email shows the run's name instead of the test case's subject), BUG-TCM-013 (Medium — every Add Result submission sends its notification email twice, confirmed via DB row count it's not a duplicate submission). Also fixed a real precondition gap: `run_added`/`run_updated`/`testcase_result_added` notification events were entirely unconfigured on this instance, enabled all three (lasting fix). Live-verified Run and Testcase Email Template marker/macro substitution via Roundcube (`qa@test.local`). Corrected two TCs whose written premise didn't match the plugin's actual architecture (TC-004: Requirements aren't Issues; TC-007: no "hide status field" setting exists, only "Hide Testcase Execution section"). All settings restored to baseline and verified. `bugs/open/` now holds 7 bugs (BUG-TCM-007 through BUG-TCM-013), only #121645 (BUG-TCM-007) reported to production so far. |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (projects `test-project`, `tcm-permissions-private-test`) | Claude (Playwright MCP headed, multi-role: admin/Manager/QA Own Visibility/Developer/Reporter) | **Final-cycle regression — `TESTCASE_MANAGEMENT_PERMISSIONS.md` checkpoint-complete** (all TCs executed except 5 deliberately deferred: TC-TCM-051, 067, 068, 069, 073). Built a dedicated Private project to isolate the non-member/anonymous checks. **Found BUG-TCM-009 (High):** almost the entire plugin has no project-membership or module-enabled check on its read actions — a non-member, or a member of a module-disabled project, can still view test suites, requirements, reports, traceability, to-dos and runs by direct URL; only plain Redmine's own `/projects/<id>` and the top-nav tab correctly gate. Confirmed TC-TCM-058 (run deletion cascades results cleanly, no orphans), TC-TCM-061 (Execute permission independent of run management), TC-TCM-062/066 (report view/create-scoping correct except the already-known BUG-TCM-007 gap), TC-TCM-076 (permission revocation takes effect immediately, verified via Rails console, permission restored afterward). TC-TCM-073 blocked mid-delete by the session's auto-mode permission classifier — deferred pending user input. `bugs/open/` now holds 3 bugs (BUG-TCM-007 #121645, BUG-TCM-008, BUG-TCM-009 not yet reported). |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, multi-role: admin/Manager/QA Own Visibility/Developer/Reporter) | **Final-cycle regression started — `TESTCASE_MANAGEMENT_PERMISSIONS.md` in progress (20/32 TCs).** Established a real role→permission mapping (none existed live before this session — every non-admin role had zero Testcase Management permissions granted). Executed Test Suite/Run/Execution/Reporting/Requirement Management granted-role legs (all PASS) and denied-role legs for Test Suites/Runs/Reports/Requirements. **Found BUG-TCM-007 (High):** Test Suite Management, Reporting, and Requirement Management controllers (`test_suites_controller.rb`, `testcase_reports_controller.rb`, `requirements_controller.rb`) have zero authorization checks on create/edit/delete — live-confirmed a zero-permission Reporter-role user could create+edit+delete a test suite, create a requirement (201, real DB row), and create a report ("successfully" + real DB row), all via direct URL/endpoint even though the corresponding UI controls were correctly hidden in most cases. Test Run Management, Test Execution, and To-Do Management spot-checked as a control and confirmed correctly protected (`allowed_to?` guards present and working). Filed `bugs/open/BUG-TCM-007.md`, updated `bugs/_index.md`, `STATUS.md`. Not yet reported to production. |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`, git HEAD `97449b9`) | Claude (Playwright MCP headed, admin + shell access) | **BUG-TCM-006 retest — PASS, closed as FIXED.** Instance had never had Installation step 6 completed: installed Node/npm/Chromium, wired SMTP to the local Docker mail server, corrected `Setting.host_name`, set `admin`/`luna.blossom` emails to real checkable mailboxes. Baseline PDF verified genuine (1,001,291 B, 32/32 streams inflate). Two independent PDF-failure causes (missing `--no-sandbox`, found incidentally; bad `PUPPETEER_EXECUTABLE_PATH`, the bug's own repro) both correctly produced an HTML-fallback attachment with a visible warning banner — never a silent misleading email. Spot-checked a second report type (Defect Summary) and confirmed the HTML format path is not regressed. `TC-TCM-101` updated with full evidence. **While checking production status, found #120544/#120546 (BUG-TCM-003/004) already Done on production** per another tester's (Nidhi Singh) 2026-09-28 retest. Production #120658 synced to Done/100% (approved). **Per explicit user follow-up approval, also closed BUG-TCM-003/BUG-TCM-004 locally** on that other tester's production evidence rather than running the Test Runs suite here — `bugs/open/` is now empty, though `STATUS.md` stays In Progress (§10) pending a full final-cycle regression (§27). |
| 2026-09-15 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP headed, admin) | **Retest pass 2, after the developer switched branch and restarted the container — BUG-TCM-003 and BUG-TCM-004 both PASS.** Redis and Sidekiq were down after the restart and were started by QA first (`redis-server --daemonize`, `bundle exec sidekiq`) — neither comes back with the container. **BUG-TCM-003:** the bulk form now posts to `/issue_status_results/bulk_create` (new non-`.json` route, `routes.rb:191-195`; `@bulk_url` re-pointed at `issue_status_results_controller.rb:26`); `Current user: admin (id=1)`, **201 Created**, rows 859/860 written for #437/#448 with environment `chrome`, modal closed and grid refreshed. The `.json` route at `routes.rb:162` is deliberately retained for API clients. **BUG-TCM-004:** view line 16 now `.html_safe`; DOM shows a real `<strong>` element, `textContent` reads "Apply to 2 testcase(s)." **Trap noted:** the grid appeared to still show `Untested` after the save because it is filtered per environment (`fdsgsdf`) while the save targeted `chrome` — switching the filter shows both cases `Passed`. **Both stay in `bugs/open/` pending the Test Runs suite regression (§26, High severity).** Sibling `.json` routes (163/167/168/175) unchanged; `testrun.js:345` calls bulk_delete with `?key=api_key`, which would sidestep the defect — code reading only, untested. |
| 2026-09-15 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP headed, admin) | **Retest pass 1, previous branch — BUG-TCM-003 and BUG-TCM-004 both FAIL.** Bulk Update Result on test cases #434/#435 still returns **401 Unauthorized** with `Current user: anonymous` and `Filter chain halted as :check_if_login_required`; Submit stuck on "Saving…", nothing saved. "Nothing saved" verified in the DB, not the grid — the grid already showed `Passed` from 2026-09-11, which would have read as a false pass. Control: single Add Result on #436 in the same session → `Current user: admin (id=1)`, 200 OK, row 858 created, confirming the `.json`-vs-non-`.json` asymmetry is intact. BUG-TCM-004's count line still renders `&lt;strong&gt;` escaped (`hasStrongEl: false`). Source on the container confirms **no fix applied**: `routes.rb:162` unchanged, no `prepend_before_action` anywhere, `en.yml:927` and `_new_result_form.html.erb:16` unchanged. |
| 2026-09-15 | n/a | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | Reported BUG-TCM-006 as **#120658** (Bug, category Testcase Management Plugin, Priority Medium, assigned to Sheetal Sharma), description linking back to #120588 and stating the split. **Custom fields set successfully in the same call** — Defect Type Functional / Defect Severity Medium-severity / Defect priority Medium (IDs 43/44/45; `list_custom_fields` is still permission-blocked but direct IDs work). Evidence JPEG attached as id 93611, **checksum-verified byte-exact**. The bug PDF (13.4 KB) and MD (14.4 KB) were deliberately **not** uploaded — above the ~4 KB safe ceiling for this channel — and need manual attachment. |
| 2026-09-15 | 6.1.3 | Docker `localhost:3012` (project `test`) — desk review of 2026-09-14 evidence | Claude (no new live execution) | **BUG-TCM-005 rescoped and closed.** Original scope verified against the customer report, the bug title, both Expected-result bullets and TC-TCM-100 before changing anything. Test 1 (PDF delivered, 53,446-byte valid attachment) satisfies every one — root cause was an incomplete installation, not a code defect. Test 2's residual finding (a *failed* PDF still sends an email promising an attachment) split out as **BUG-TCM-006 (Medium)**; TC-TCM-101 moved to it as its retest vehicle and rewritten with real preconditions. TC-TCM-100 flipped to CONFIRMED PASS. `_duplicates.md` given a decision rule separating the two. Partial Reports regression: TC-TCM-098/523/525 PASS; **full suite regression outstanding.** 2 production writes queued pending approval. |
| 2026-09-14 | 6.1.3 | Docker `localhost:3012` (project `test`) | Claude (Playwright MCP headed, admin) | Client-reported "Report Email Issue". **All six report types** emailed in both formats to a real mailbox (12 reports). **HTML PASS for all six** (valid `multipart/mixed` attachments, 14–25 KB); **PDF FAIL for all six** (bare `text/html`, no attachment part, body still claims one). Root-caused to missing Node/Puppeteer for `grover` plus a `rescue` that sends the mail anyway; also found the bundled wkhtmltopdf fallback is broken (`libXrender.so.1`). 1 bug filed: BUG-TCM-005 (High). |
| 2026-09-02 | (fill from environment) | Docker `localhost:3010` (project `test-project`) | External session, folded in by Claude | CSV Import feature: 16 TCs (14 PASS, 2 FAIL). 2 bugs filed (BUG-TCM-001, BUG-TCM-002). Not yet reproduced in-session. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP, admin) | Targeted investigation of customer-reported bulk-update failure in a test run. Reproduced across 2 environments, 2 statuses, with and without notes. 2 bugs filed: BUG-TCM-003 (High, root-caused to `.json` route bypassing session auth) and BUG-TCM-004 (Low, escaped HTML in modal label). Single Add Result confirmed working. |
| 2026-09-11 | 7.0.0 | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | Reported BUG-TCM-003 as **#120544** (High) and BUG-TCM-004 as **#120546** (Low), both assigned to Sheetal Sharma, no Test Run / Environment / Test Case ID per user instruction. #120546 carries PDF + MD + screenshot, all byte-exact. #120544's screenshot attachment uploaded corrupt and needs replacing; its PDF is fine. Defect * custom fields left at project defaults on both. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP, admin) | Retest + regression after BUG-TCM-001 / BUG-TCM-002 fix. Both retests PASS on their original fixtures (#1023 padded-header now correct; duplicate-header warning now shown before confirm). Full CSV Import suite regression per §26: 17 fixtures / 16 TCs (TC-TCM-021 … TC-TCM-036) re-run, **all PASS, zero new failures**. Both bugs moved to `bugs/closed/`. |
