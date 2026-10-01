# Handoff — Redmineflux Testcase Management

## Last Session

- Date: 2026-10-01
- Redmine Version: 7.0.0
- Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`), plugin v7.0.0

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
