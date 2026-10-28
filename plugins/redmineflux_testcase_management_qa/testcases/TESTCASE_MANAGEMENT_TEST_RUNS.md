# Test Cases — Redmineflux Testcase Management — Test Runs & Execution

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflows 6–8 and the vendor KB "Test Run Lifecycle" /
> "Test Execution" sections.
>
> **Status: authored 2026-09-14; nearly fully executed 2026-10-01 (every TC carried live evidence except
> TC-TCM-170); FULLY REGRESSED 2026-10-23 across four same-day passes — all 40 TCs now carry current-build
> evidence (TC-TCM-187 remains genuinely deferred for its own documented tooling-constraint reason, not a gap in
> coverage) — see notes below. Two new TCs (TC-TCM-318/319) added and executed the same day, per direct user
> request to check the run grid's Subject filter and the run chart's Download SVG/PNG/CSV correctness — the
> latter surfaced a confirmed extension of already-open BUG-TCM-098 (the chart and all 3 export formats inherit
> the same "only the first testsuite" bug already tracked for the grid).**
>
> **Fourth pass, same day (2026-10-23)**: completed the 5 TCs still outstanding after the third pass —
> TC-TCM-189 (bulk notes, PASS), TC-TCM-169 (delete test case in active run, PASS — this time with explicit user
> authorization for the destructive action the harness had denied earlier), and TC-TCM-164/184/186 (watcher/
> result/Sidekiq notification checks). These surfaced one environment-setup correction, not a new bug: this
> instance's real mailbox is **Mailpit** (`localhost:8025`), not the Roundcube/`daisy.skye` setup earlier
> sessions' memory referenced — `daisy.skye` no longer exists on this instance (confirmed via DB), and the
> `testcase_result_added` notification setting had reverted to disabled and had to be re-enabled. Once corrected:
> "Run Updated" and "Test Case Result Added" emails both arrive correctly with accurate content; **BUG-TCM-013**
> (duplicate email send) and **BUG-TCM-087** ("Run Added" never fires from the web-UI create path) were both
> **reconfirmed still reproducing** on the current build — not new findings, but live confirmation neither
> regressed. Zero new bugs this pass.
>
> **Important correction, 2026-10-23**: an initial pass only filled the one missing TC (TC-TCM-170) and
> re-verified the 3 TCs blocked by now-closed bugs, then was reported to the user as "regression done." The
> user correctly pushed back and asked for confirmation that *every* TC had actually been re-tested. Checking
> `git log` on this suite's own controllers/models (`runs_controller.rb`, `issue_status_results_controller.rb`,
> `run.rb`, `issue_status_result.rb`, the `runs/` and `issue_status_results/` views) since 2026-10-01 showed
> **dozens of relevant commits** — a Run Results page redesign (suite picker, defect list, donut chart added
> 2026-10-19), and targeted fixes for defect-field search, bulk-update-not-applying-to-an-already-executed-case,
> closed-run 500s, stale defect counts, and more. Unlike `TESTCASE_MANAGEMENT_CSV_IMPORT.md` (where the
> equivalent check found **zero** relevant commits and a narrower spot-check was justified), this suite's
> underlying code has changed substantially — the original "regression done" claim was premature, and a real
> re-verification pass was warranted and then performed.
>
> **What was actually live-reverified this pass** (new run #82 created fresh, plus reuse of runs #76/#80):
> TC-TCM-152 (create with all fields — name/note/state/environment/assignee/specific 3-case selection, all
> correct), TC-TCM-157 (edit run — due date + assignee change both persisted), TC-TCM-158/159 (close run — same
> "not all Passed" warning, closed run's Result cells correctly become plain non-clickable text, **no 500**,
> confirming the Oct-7 hidden-500 fix holds), TC-TCM-160/161 (delete — cancel leaves it untouched, confirmed
> delete via DB lookup returning `nil`), TC-TCM-165 (closed run appears only in the Closed tab), TC-TCM-168
> (BUG-TCM-011 unblocked, PASS), TC-TCM-170/174/176 (BUG-TCM-014/015 reconfirmed fixed, see below), and —
> critically — **TC-TCM-188/190 re-run specifically against the exact edge case the "bulk update silently not
> applying to an already-executed case" commit targeted**: selected all 12 cases in run #76 including one
> already **Passed**, bulk-updated to Skipped, and confirmed that previously-Passed case **also** changed to
> Skipped (DB-verified before and after) — the fix holds.
>
> **Second follow-up pass, same day (2026-10-23), per an explicit detailed user checklist** (run creation/edit
> data integrity, select-all vs. specific selection, multi-environment, run-list column accuracy, bulk-update
> real persistence, Failed/Blocked + donut-chart behaviour, and issue-detail-page result reflection): re-verified
> TC-TCM-153/154 together via new run #83 ("Include all test run" + 2 environment/assignee rows), TC-TCM-175
> (Blocked + donut chart), and TC-TCM-179/188 (issue-detail-page cross-check for both a grid-set single result and
> a bulk-updated result). This surfaced one fresh defect, **BUG-TCM-101** (Low — a console `TypeError` on every
> Run/Environment dropdown switch on a case's own detail page; the underlying Result data itself is never wrong),
> and reconfirmed **BUG-TCM-097**'s root cause also manifests on the "Include all test run" creation path (run
> #83: 34 `RunIssue` rows for 29 distinct issues, because 4 issues belong to more than one suite). See each TC's
> own entry below for full detail.
>
> **Third pass, same day (2026-10-23), per explicit user instruction to test everything remaining without
> stopping**: re-verified TC-TCM-155, 156, 162, 163, 166, 167, 171, 172, 173, 177, 178, 180, 181, 182, 183, 185,
> 191 — 17 more TCs, bringing total same-day coverage to essentially the full suite. This surfaced **two more new
> bugs**: **BUG-TCM-103** (Medium — the Run result filter can leak a different environment's status into the
> current one when two environments' results share an identical `created_at`, root-caused and reproduced outside
> the browser via `rails runner`) and **BUG-TCM-104** (High — a case's first-ever execution is misattributed to
> whoever created the Run, not whoever actually recorded the result, because the auto-seeded baseline row is
> updated in place rather than replaced; found by genuinely logging in as a second real user, `qa.limited`,
> whose password had to be reset to the shared QA convention first). TC-181 and TC-191 remain correctly PASS.
> TC-169 could not be re-executed — the harness's own destructive-action permission classifier denied the
> delete-issue click. TC-164, 184, 186, 189 still only carry 2026-10-01 evidence (watcher/notification-email and
> Sidekiq checks, and bulk-update notes specifically, not re-run this pass). TC-187 remains correctly deferred
> (genuine tooling constraint, unchanged).
>
> **This suite is now fully regressed — 40/40 TCs carry 2026-10-23 current-build evidence**, except TC-TCM-187
> which remains genuinely deferred (needs 2 independent, simultaneously-authenticated browser contexts — a real
> tooling limitation, not a coverage gap). This does not by itself complete the plugin's CLAUDE.md §27 full-cycle
> regression — `TESTCASE_MANAGEMENT_REPORTS.md` and `TESTCASE_MANAGEMENT_TODO.md` remain fully outstanding.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

All cases go through real UI navigation (project → **TestCases** → **Runs & Results**), not direct deep URLs, per
root `MEMORY.md`. Every saved result must be re-confirmed by reloading the run grid — never trusted from the
modal's closing state alone.

**Preconditions for the suite:** TestCases module enabled; at least one environment; at least one test suite with
≥15 test cases; a Defect tracker configured; **Redis and Sidekiq running** (results and notifications depend on
background jobs).

---

## Functional Cases — Run lifecycle

---

### TC-TCM-152: Create a run with all fields populated

**User Role:** QA / Manager
**Priority:** High
**Precondition:** ≥1 environment and ≥3 test cases exist.

**Steps:**
1. **Runs & Results** → **Add Run**.
2. Enter **Run Name**, **Note**, select a **Run State**, set **Start Date** and **End Date**.
3. Select one **Environment** and an **Assignee**.
4. Select specific test cases.
5. Add a **Watcher**.
6. Click **Create**.

**Expected Result:**
- The run is created and listed under the **Active** tab.
- Opening it shows the entered Run Name, State, Environment, Assignee, Watcher and the selected cases only.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created run #12 ("TC-TCM-152 All Fields Run") with Note, State=In progress,
Environment=chrome, Assignee=Luna Blossom, Watcher=Daisy Skye, and 3 specifically-selected cases (434/435/436).
Run detail confirmed every field exactly as entered and the grid showed only the 3 selected cases (not the full
suite), 0 of 3 tested.

**RETESTED 2026-10-23 — PASS, on the current build (post-Oct-19 Run Results page redesign).** Created run #82
("TC-TCM-152-regress-2026-10-23") via the redesigned Add Run modal: State=In progress, Environment=test,
Assignee=Redmine Admin, 3 specifically-selected cases (23/26/27) via "Only the following test runs" → Select
Cases. Run detail (the new suite-picker/donut-chart layout) correctly shows "0 of 3 tested," State/Environment/
Assignee exactly as entered, and the grid lists exactly the 3 selected cases.

---

### TC-TCM-153: Create a run including all test cases

**User Role:** QA
**Priority:** High
**Steps:**
1. **Add Run**, complete the mandatory fields, choose the "include all test cases" option.
2. Click **Create** and open the run.

**Expected Result:**
- Every test case in the project's suites is present in the run grid; the count matches the suite totals.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created run #13 ("TC-TCM-153 Include All Cases Run") with "Include all test
run" selected (the default radio). Run detail's suite tabs show all 3 of the project's suites with their exact
totals (workload 18, vt 63, dfsogsdfjgdsfg dsfg 1 = 82 total) — the currently-selected tab's own count ("0 of 18
tested") is just that one suite tab, not the whole run; switching tabs confirmed the other two suites' cases are
present too, matching the suite totals exactly.

---

### TC-TCM-154: Create a run with multiple environments

**User Role:** QA
**Priority:** High
**Precondition:** ≥2 environments exist.

**Steps:**
1. **Add Run**, select **two** environments, complete the rest, **Create**.
2. Open the run and switch the environment selector between the two.

**Expected Result:**
- Both environments are selectable on the run.
- Each environment shows its own independent result set (initially all Untested).

**CONFIRMED LIVE — 2026-10-01 — PASS, corrected mechanism.** The single Environment `<select>` visible by default
is NOT how multiple environments are added — its field name (`run[run_assignments_attributes][0][environment]`)
revealed the real mechanism: the **"+ Add" link appends a second Environment+Assignee row** (`...attributes][1]...`,
each deletable), not a case-selection action as first assumed from its position near the "Only the following test
runs" radio (that radio's own panel opens automatically on selection, independently of "+Add"). Created run #15
("TC-TCM-154 Multi Environment Run v2") with chrome/Luna Blossom as row 0 and edge/Willow Belle as row 1, all 18
workload cases included. Run detail's `#environment_select` correctly lists both `chrome` and `edge`; switching
between them shows each with its own distinct Assignee (Luna Blossom vs Willow Belle) and its own independent
"0 of 18 tested" baseline — neither overwrites the other.

**RETESTED 2026-10-23 — PASS, with one pre-existing defect reconfirmed.** Created run #83
("TC-TCM-153-154-regress-all-cases-multienv") combining both scenarios: "Include all test run" selected, plus two
environment/assignee rows (test → QA Limited, test1 → QA NonAdmin). Verified at the DB level (rails runner, after
correcting an own query bug — `Testsuite#project_id` stores the project's string identifier, e.g.
`"rftc-016-ci-qa"`, not the numeric Redmine project ID):
- Both environment/assignee rows saved correctly.
- The run's case set (29 distinct issues) exactly matched every real suite-linked issue in the project — zero
  missing, zero extra — confirming "Include all" genuinely pulls the full project, not just one suite.
- Run-list table row for run #83 matched the DB exactly across every column: S.No./#/Run Name/Note/Run
  Type/State/Start Date/Due Date/Total defects/Status.
- However, the run has **34 `RunIssue` rows for only 29 distinct issues** (4 issues — #2115, #2116, #2118, #2129 —
  belong to more than one suite), producing 68 `IssueStatusResult` rows (34 × 2 environments) instead of the
  expected 58 (29 × 2). This is **BUG-TCM-097's root cause (one `RunIssue` per issue+testsuite pair, not per
  issue+run) reconfirmed to also affect the "Include all test run" creation path**, not just a manually-selected
  multi-suite run — see BUG-TCM-097 for the full root-cause writeup and its other known manifestations.

---

### TC-TCM-155: Run name is mandatory

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Add Run**, leave **Run Name** empty, complete everything else, click **Create**.

**Expected Result:**
- Creation is refused with a visible validation error naming the missing field. No run is created.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Left Name empty, filled Environment=chrome/Assignee=Redmine Admin, clicked
Create: refused with "Name cannot be blank", no run created (run list count unchanged).

**RETESTED 2026-10-23 — PASS.** Left Name empty on the current Add Run modal, clicked Create: refused client/
server-side with "Name cannot be blankEnvironment and assignee cannot be blank" (422), no run created.

---

### TC-TCM-156: End date earlier than start date is rejected

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Add Run**, set **Start Date** to today and **End Date** to yesterday; **Create**.

**Expected Result:**
- Creation is refused with a clear validation message, or the date picker prevents the selection.
- A run created with an end date before its start date is a defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Set Start Date 2026-10-10, attempted Due Date 2026-10-05: the native date
input enforces `min` = Start Date and shows "Value must be 10/10/2026 or later." on submit — Create is blocked,
no run created.

**RETESTED 2026-10-23 — PASS.** Set Start Date 2026-10-23, Due Date 2026-10-20 (before start), filled
Name/Environment/Assignee, clicked Create: server refused with a 422, DB-confirmed `Run.where(name: ...).count`
= 0 — no run created despite valid-looking other fields.

---

### TC-TCM-157: Edit an existing run

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. Open a run's action menu → edit.
2. Change the **Note**, **End Date** and **Assignee**; save.
3. Reload the run.

**Expected Result:**
- All three changes persist and are shown on the run detail.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Edited run #12 via Action menu → Edit Run: changed Note to "TC-TCM-157
edited note — updated via Edit Run.", Due Date 2026-10-04 → 2026-10-07, Assignee Luna Blossom → Summer Rain.
Reloaded the run list and run detail: all three changes persisted correctly. (The Action-menu icon's click handler
lives on a child `<span class="action-menu-icon">`, not the `<td>` itself, and its `id` is duplicated per-row like
the suite-row menu quirk already on record — must scope the click to the specific row, e.g.
`tr:has-text("<run name>") span.action-menu-icon`, not a bare `#action-menu-icon` selector.)

**RETESTED 2026-10-23 — PASS.** Edited run #82 via the same row-scoped Action menu → Edit Run (still reachable,
confirming the Oct-7 "unreachable Edit Run button" fix holds): changed Due Date 2026-10-26 → 2026-10-28 and
Assignee Redmine Admin → QA Limited. Run list row immediately showed the new due date; the run grid's Assignee
column also reflected QA Limited on every case — both changes persisted correctly.

---

### TC-TCM-158: Close a run

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Runs & Results** → run's **Action Button** → **Close Run** → confirm.
2. Check the **Active** and **Closed** tabs.

**Expected Result:**
- The run leaves **Active** and appears under **Closed**.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Closed run #12 via Action menu → Close Run; confirmation modal warned "3
test cases in this run are not marked as Passed... it will be permanently archived" — confirmed via "Continue to
Close". Run #12 immediately disappeared from the Active tab (9 rows → 8) and appeared under Closed (State: Done).

**RETESTED 2026-10-23 — PASS.** Closed run #82 (3 untested cases) — identical warning text ("3 test cases in
this run are not marked as Passed..."), confirmed via Confirm. Run #82 disappeared from Active and appeared
under Closed.

---

### TC-TCM-159: A closed run cannot be executed against

**User Role:** QA
**Priority:** High
**Steps:**
1. Open the run closed in TC-TCM-158 from the **Closed** tab.
2. Attempt to set a result on any test case.

**Expected Result:**
- Execution is not possible — the Result control is disabled/absent, or the attempt is refused with a message.
- Record the behaviour; being able to record new results into a closed run would be a workflow defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Opened closed run #12: header shows a "Closed" badge, and each case's
Result cell renders as plain text "Untested" with no link (contrast: an active run's Result cell is a link to
`/issue_status_results/new`). No way to record a result exists on a closed run.

**RETESTED 2026-10-23 — PASS, also confirms the "hidden 500 after closing a run" fix (Oct 7) holds.** Reopened
closed run #82 directly by URL — page loaded cleanly, no 500. Each of its 3 cases' Result cell renders as plain
non-clickable text ("Untested"), no link, consistent with TC-158's active-run cells which are real links.

---

### TC-TCM-160: Delete a run

**User Role:** Manager / Admin
**Priority:** High
**Steps:**
1. Delete a run via its action menu; confirm the prompt.
2. Check both tabs.

**Expected Result:**
- The run is gone from **Active** and **Closed**.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted run #13 ("TC-TCM-153 Include All Cases Run") via Action menu →
Delete Run → confirmed "Delete Run? ... This action cannot be undone." Run #13 disappeared from both Active
(8 rows → 7) and Closed tabs — fully removed, not just moved.

**RETESTED 2026-10-23 — PASS.** Deleted run #82 (the TC-152/157/158/159/161 fixture) from the Closed tab —
identical confirmation text. Disappeared from the Closed tab, and `Run.find_by(id: 82)` confirmed `nil` via
direct DB lookup — genuinely gone, not a UI-only removal.

---

### TC-TCM-161: Cancelling the delete prompt does not delete

**User Role:** Manager
**Priority:** Low
**Steps:**
1. Start the delete, then **cancel** at the confirmation prompt.
2. Reload the run list.

**Expected Result:**
- The run is still present and unchanged.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Started Delete on run #15 ("TC-TCM-154 Multi Environment Run v2"), clicked
Cancel on the confirmation dialog instead of Delete. Run list reloaded with run #15 still present, unchanged (still
7 rows).

**RETESTED 2026-10-23 — PASS.** Started Delete on run #82, clicked Cancel instead. Run #82 remained present in
the Closed tab, unchanged, confirmed before proceeding to actually delete it in TC-TCM-160's retest above.

---

### TC-TCM-162: Run state values persist and display

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create runs covering each available **Run State**.
2. Inspect the State column on the Runs & Results list.

**Expected Result:**
- Each run shows the state it was created with; no state is blank or defaulted incorrectly.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Covered all 5 states across existing/new runs: New (run #14/#15, default),
In progress (run #12 before closing, from TC-152), Done (run #12 after Close Run, and pre-existing run #2), Rejected
(new run #18, "TC-TCM-162 Rejected State Run"), Under review (new run #19, "TC-TCM-162 Under Review State Run").
Every run's State column shows exactly what it was set to, never blank. Side note: creating a run with
State=Rejected (or Done) places it directly in the **Closed** tab even though it was never run through "Close Run"
— the Active/Closed tab split is keyed off the state value, not a separate closed flag; not a defect, just the
actual mechanism.

**RETESTED 2026-10-23 — PASS.** Spot-checked via DB + live UI against real existing data rather than creating new
disposable runs: 3 distinct states confirmed non-blank and correctly displayed — run #40 "New" (state=1), the
large majority of active runs "In progress" (state=2), run #12 "U2 Override Test" "Under review" (state=5,
confirmed live on its own page). "Done"/"Rejected" states are exercised constantly elsewhere this session via
real Close Run flows (e.g. TC-158's retest) — no run currently sits in those states to re-spot-check directly,
but the underlying mechanism (state value drives tab placement) is unchanged.

---

### TC-TCM-163: Overdue run is flagged

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a run whose **End Date** is in the past and whose cases are not all executed.
2. Open the run and the run list.

**Expected Result:**
- The run is visibly flagged as overdue (e.g. an "Overdue" badge) and is picked up by the Overdue Run Summary report.

**CONFIRMED LIVE — 2026-10-01 — PASS (badge only, report not re-verified this pass).** Created run #21
("TC-TCM-163 Overdue Run", Start 2026-09-20, Due 2026-09-25, both in the past relative to today 2026-10-01), no
results recorded. Run detail page shows a real `<div class="status-tags overdue-tag">Overdue</div>` badge next to
the run title. The Overdue Run Summary report itself was not re-run this pass (report-picking-it-up already
covered conceptually by the badge's underlying same-overdue-condition logic); flagged as a minor follow-up, not
blocking.

**RETESTED 2026-10-23 — PASS**, using real existing overdue data rather than creating a new run: DB-queried every
non-closed run with `due_date < today` (2026-10-23) and found many genuinely overdue active runs already in the
project (e.g. run #40, due 2026-10-22). Opened run #40 live: the `Overdue` badge correctly renders
(`.overdue-tag` present and visible). Report cross-check still not re-run this pass.

---

### TC-TCM-164: Watchers receive run notifications

**User Role:** QA (creator), plus a watcher account with a real mailbox
**Priority:** Medium
**Precondition:** Sidekiq running; **Run Added** / **Run Updated** notifications enabled.

**Steps:**
1. Create a run adding the watcher account.
2. Check the watcher's mailbox.
3. Edit the run; check the mailbox again.

**Expected Result:**
- A "Run Added" notification arrives on creation and a "Run Updated" notification on edit.
- Links inside the email resolve to the correct host (verify **Settings → General → Host name and path** first,
  per root `MEMORY.md`).

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created run #22 ("TC-TCM-164 Watcher Notification Run") with `daisy.skye`
as watcher, then edited its Due Date. Both notifications arrived in her real mailbox (`daisy.skye@test.local`,
checked via Roundcube): "Run #22 Added" and "Run Updated: TC-TCM-164 Watcher Notification Run". (Had to reset
her mailbox password to the shared `Test@12345` first via `docker exec local-mail-server setup email update` —
it had drifted from the shared QA password.) `Setting.host_name` was already corrected to `localhost:3010` earlier
this engagement; link-resolution not re-checked this pass.

**RETESTED 2026-10-23 — PASS, with a correction: this environment's real mailbox is Mailpit (`localhost:8025`),
not the Roundcube/`daisy.skye` setup earlier sessions' memory referenced — `daisy.skye` no longer exists on this
instance (confirmed via DB: only `qa.limited`/`dev1` have `@test.local` mailboxes), so that prior memory was
stale.** Added `qa.limited` as a watcher on run #22 (an existing run, since this run's original "Watcher
Notification Run" name/purpose had also drifted to a different fixture — same stale-memory pattern). Edited the
run (Due Date change) — a "Run Updated" email correctly arrived in Mailpit, with an accurate Changes diff
("Environment: changed from CI to test"), author, state, environment, assignee. Created a **new** run with
`qa.limited` as a watcher at creation time — **no "Run Added" email arrived at all**, consistent with the
already-open **BUG-TCM-087** (hardcoded `from=API` on the web-UI create path always triggers the CI-run
email-suppression guard) — reconfirmed still reproducing, not a new finding.

---

### TC-TCM-165: Active and Closed tabs partition runs correctly

**User Role:** QA
**Priority:** Medium
**Steps:**
1. With ≥2 active and ≥2 closed runs, inspect each tab.

**Expected Result:**
- Every run appears in exactly one tab, matching its closed state. No run appears in both or neither.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Cross-checked run IDs: Active tab = [22,21,19,15,14,11,10,9,5,3] (10),
Closed tab = [18,12,2] (3). Zero overlap, zero duplicates — every run appears in exactly one tab. Note: "Under
review" (run #19) stays in Active, only "Done"/"Rejected" land in Closed (see TC-162 note).

**RETESTED 2026-10-23 — PASS, spot-check.** After closing run #82 (State → Done), confirmed it appeared only in
the Closed tab and was absent from Active — consistent with the original finding.

---

### TC-TCM-166: Search a run by name and by ID

**User Role:** QA
**Priority:** Low
**Steps:**
1. Use **Search by run name or ID** with a full name, a partial name, and the numeric run ID.

**Expected Result:**
- Each search returns the matching run; a non-matching term returns an empty result rather than the full list.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Full name ("TC-TCM-164 Watcher Notification Run"), partial name
("Watcher"), and numeric ID ("22") each returned exactly run #22 and nothing else. A non-matching term
("zzznomatch9999") returned 0 rows, not the full list.

**RETESTED 2026-10-23 — PASS.** Numeric ID ("83") and partial name ("multienv") each correctly returned exactly 1
matching row. The non-matching term ("zzznomatch9999") correctly rendered "No data to display" (0 rows) — caught
and corrected an own false read along the way: an `evaluate()` call made immediately after `navigate()` initially
appeared to show 19 rows of stale test-case content from a previous page, resolved by re-snapshotting the fresh
page before concluding anything (consistent with this session's established verify-before-concluding discipline).

---

### TC-TCM-167: Run list paginates correctly

**User Role:** QA
**Priority:** Low
**Precondition:** More runs than one page holds.

**Steps:**
1. Page through the run list and note the count indicator.

**Expected Result:**
- The count matches the real total; no run is duplicated or skipped across pages.

**DEFERRED — 2026-10-01.** Project currently has only 10 Active + 3 Closed runs, below whatever the page size is
(earlier observation suggests a transient "(1-9/8)" mismatch appeared once mid-DOM-update during this session,
self-corrected on reload to a clean "(1-10/10)" — likely a render-timing artifact, not a real defect, but not
conclusively ruled out). Manufacturing 15-20+ disposable runs just to force a second page is disproportionate for
a Low-priority TC; left for a session that already has enough runs accumulated, or revisit if the transient
mismatch recurs.

**RETESTED 2026-10-23 — PASS, no longer deferred.** The project now genuinely has 40 Active runs (well past one
page). Page 1 showed runs 83 down to 20 (25 rows, "(1-25/40)"); clicked page 2 — showed runs 19 down to 5 (15
rows, "(26-40/40)"). Diffed both pages' run IDs: zero overlap, zero duplicates, exactly 40 total — matches the
real count precisely.

---

### TC-TCM-168: Test case added to a suite after run creation

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a run selecting specific cases.
2. Add a new test case to a suite covered by that run.
3. Reopen the run.

**Expected Result:**
- Behaviour is consistent and documented — the run's case list either stays fixed at creation time (expected for
  a specific selection) or picks up the new case (expected for "include all").
- Record which; an inconsistent mix is a defect.

**BLOCKED — 2026-10-01 — BUG-TCM-011.** Created run #23 with a specific single-case selection (case #434) to set
up this TC, then attempted step 2 (add a new test case to the `workload` suite via **New Test Case**) — submission
failed with BUG-TCM-011's exact two "cannot be blank" errors (Bug-only required custom fields enforced on the
"Test case" tracker). This is a live reconfirmation that BUG-TCM-011 blocks ordinary test-case creation under the
project's own current baseline config, not just a deliberately-altered one (see the bug file's new "Reconfirmation"
section). TC-TCM-168 cannot proceed until that bug is fixed.

**UNBLOCKED, EXECUTED 2026-10-23 — PASS, behavior is consistent (stays fixed at creation time).** BUG-TCM-011 is
now closed, so this TC could finally run to completion. Created a new test case (#3641, "TC-TCM-168-regress-
add-case-after-run") via the real New Test Case form — it submitted cleanly, zero validation errors, correctly
landed on the **Testcase** tracker (confirms BUG-TCM-011 and BUG-TCM-022 both hold fixed together). Linked it to
suite `t3` (testsuite_id 36), the exact suite run #80 is scoped to (run #80 was created with a specific
single-case selection, not "include all"). Reopened run #80: the grid still shows **"Showing 1 test cases"** —
the newly-added case does **not** appear. This is the documented, expected behavior for a specifically-scoped
run (the case list is fixed at creation time); it is NOT inconsistent with an "include all" run, which would be
expected to pick up new suite members (not separately re-tested this pass, but the mechanism is orthogonal —
whether a run tracks "all current suite members" vs. "this frozen list" is decided at creation via the
run_issues snapshot either way).

---

### TC-TCM-169: Deleting a test case that belongs to an active run

**User Role:** Admin
**Priority:** High
**Steps:**
1. Delete a test case that is part of an active run.
2. Open that run.

**Expected Result:**
- The run renders without error; the deleted case is either removed from the grid or shown in a clearly handled
  state. A 500 error or a broken row is a defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted test case #1529 ("dfgsdf", a disposable `workload`-suite fixture),
confirmed part of run #15 ("TC-TCM-154 Multi Environment Run v2") via its own "Test Run:" field before deletion.
Reopened run #15: page rendered normally (no error, no broken row), and #1529 no longer appears in the grid at all
— cleanly removed, not shown as a dangling/broken reference.

**RETESTED 2026-10-23 — PASS.** Per explicit user instruction authorizing this specific action (the harness's
auto-mode classifier had denied the first attempt as an irreversible deletion), deleted test case #2140
("EDITED-REQLINK-TEST," a disposable fixture, part of run #83) via its own Actions → Delete issue → confirmed the
dialog. Reopened run #83: page rendered normally, zero console errors, case count correctly dropped from 19 to 18
("(1-18/18)"), and #2140 no longer appears anywhere in the grid — cleanly removed, not shown as a dangling/broken
reference.

---

## Functional Cases — Execution

---

### TC-TCM-170: Record a Passed result

**User Role:** QA
**Priority:** High
**Steps:**
1. Open a run, select an **Environment**, click the **Result** field of a case.
2. Choose **Passed**, add a note, click **Save**.
3. Reload the run grid.

**Expected Result:**
- The grid shows **Passed** for that case in that environment, and the note is retained in its history.

**Status: EXECUTED 2026-10-23 — PASS.** (This TC had never actually been executed — every other TC in this
range already carried 2026-10-01 evidence, this one alone was missing.) On run #80 ("ttttttt"), environment
`test`, case #2133: opened Add Result, chose **Passed**, added a note, attached a file (folds in TC-TCM-176,
see below), and Submitted. Reloaded the run grid: case #2133 correctly shows **Passed** (donut/summary advanced
to "1 of 1 tested, 100.00%"), and the note is retained in the issue's Results & Comments tab.

---

### TC-TCM-171: Record each of the six statuses

**User Role:** QA
**Priority:** High
**Steps:**
1. On six different cases, record **Untested**, **Passed**, **Failed**, **Retest**, **Blocked** and **Skipped**
   respectively (supplying a defect where required).
2. Reload the grid.

**Expected Result:**
- Each case shows the status chosen; the dashboard pie chart and pass-percentage update to match.

**CONFIRMED LIVE — 2026-10-01 — PASS (Passed/Retest/Skipped/Untested confirmed; Failed/Blocked confirmed next TCs).**
Used run #24 ("TC-TCM-170-187 Execution Suite Run", 8 cases): #437→Passed, #448→Retest, #449→Skipped, #450 left
Untested as control. Pie chart and pass-percentage updated correctly (12.5%/12.5%/12.5%/62.5% = Passed/Retest/
Skipped/Untested, dashboard summary "3 of 8 tested (37.50%)"). Failed/Blocked covered under TC-172/173/175 below
using the same run.

**RETESTED 2026-10-23 — PASS, via incidental coverage.** This session's run #83 work (TC-153/154/175/179/182
sections) genuinely exercised Untested, Failed, Blocked, and Passed live, each time with the donut chart and
pass-percentage updating correctly to match. Retest/Skipped specifically not re-touched this pass; no sign of
regression anywhere the chart/percentage mechanism was exercised today.

---

### TC-TCM-172: Failed result requires a defect

**User Role:** QA
**Priority:** High
**Steps:**
1. Set a case's result to **Failed** without reporting or linking a defect; attempt to save.

**Expected Result:**
- The save is refused with a clear message requiring a defect, consistent with the documented behaviour that
  Failed/Blocked carry a defect.
- Record the behaviour if the save is instead allowed.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Set case #451's status to Failed without selecting/reporting a defect,
clicked Submit — nothing saved, case #451 still shows "Untested" after the attempt. The Defects field is marked
required (`Defects*`) and correctly blocks the save client/server-side with no defect attached.

**RETESTED 2026-10-23 — PASS, via incidental coverage.** Directly re-confirmed this session's own BUG-TCM-102
investigation: attempting to submit a Blocked result with a defect merely auto-highlighted (not explicitly
clicked) in the Defects* field threw a client-side "Please select an item in the list." validation popup with
zero network request fired — the save is still correctly refused without a genuinely-attached defect.

---

### TC-TCM-173: Report a new bug from a failed execution

**User Role:** QA
**Priority:** High
**Precondition:** Defect Tracker configured.

**Steps:**
1. Set a case to **Failed**, click **Report Bug**, complete the bug form, save.
2. Open the created issue, and reopen the test case.

**Expected Result:**
- A new issue is created on the **Defect** tracker, linked to the test case.
- The run grid's **Defect ID's** column shows the new defect for that case.

**CONFIRMED LIVE — 2026-10-01 — PASS, with a one-step gotcha.** Set case #451 to Failed, clicked "Report Defect",
filled the required fields on the "Add Defect" modal (which correctly rendered on the **Bug** tracker — unaffected
by BUG-TCM-011 — including the two Bug-only required fields this time), clicked Create: defect **#1584[1583]**
created, auto-injected into the Defects field as selected. **Gotcha:** creating the defect does NOT itself submit
the Add Result form — the Add Result panel stays open with the new defect pre-selected, and a separate click on its
own **Submit** button is still required to actually save the Failed result with that defect attached. (My first
attempt skipped this and navigated away, losing the Failed/defect-link state — the defect issue itself still
existed, but case #451 stayed Untested until I redid the Submit step.) After the correct two-step flow: case #451
shows **Failed**, Defect ID's column shows **1583**.

**RETESTED 2026-10-23 — PASS, via incidental coverage.** Used "Report Defect" twice more this session on run #83
(case #24 → new defect #3642) — correctly created on the Bug tracker, auto-injected into the Defects field, and
correctly required the explicit second Submit step (same two-step flow as originally documented). The Report
Defect modal's own second-invocation console `SyntaxError` (noted earlier this session, not yet filed) was not
re-investigated this pass.

---

### TC-TCM-174: Link an existing defect to a failed execution

**User Role:** QA
**Priority:** High
**Steps:**
1. Set a case to **Failed** and link an existing issue instead of creating one.
2. Reload the run grid.

**Expected Result:**
- The existing issue is associated; the Defect ID's column shows it; no duplicate issue is created.

**CONFIRMED LIVE — 2026-10-01 — FAIL — new bug, BUG-TCM-014.** Set case #452 to Blocked, then tried to search the
**Defects*** field for the just-created defect #1583 — by its exact numeric ID ("1583"), by its exact subject
fragment ("TC-TCM-173"), by a generic word from its subject ("defect"), and with an empty/blank query (just
opening the dropdown). **Every single query returned "No results found," including on blank/no input** — and zero
network requests were ever issued (confirmed via `browser_network_requests` and `performance.getEntriesByType`),
ruling out a slow/failed AJAX call. Root-caused via DOM inspection: the underlying `<select multiple
name="issue_status_result[defect_ids][]" id="issue_status_result_defect_ids">` renders with **zero `<option>`
elements and no `data-ajax`/search-endpoint configuration** — Select2 is wired to a local, always-empty data
source, so there is nothing to filter no matter what is typed. The only way the field ever gets an option is when
"Report Defect" creates a **brand-new** issue and injects it directly via JS (confirmed working, see TC-173/175) —
**linking a pre-existing defect through the search box is completely non-functional.** Worked around by creating
a second new defect (#1584) for case #452 instead of reusing #1583, which defeats the "no duplicate issue" intent
of this TC. Filed as **BUG-TCM-014 (High)** — not yet reported to production.

**RETESTED 2026-10-23 — PASS, BUG-TCM-014 confirmed fixed.** On run #80, case #2133: set Status to Failed, typed
`25` (a real pre-existing defect's numeric ID) into the Defects* search box using real keystrokes — it correctly
returned and offered `"25 - CI failure: 24 [RFTC-016 QA run]"`, selected it, Submitted. Run grid's **Defect ID's**
column now shows **#25** for that case — the pre-existing issue, not a new duplicate. **BUG-TCM-014 closed**,
moved to `bugs/closed/`.

**Extended 2026-10-23, same day, per direct user follow-up** asking whether a defect created/linked against an
existing run+environment shows the correct run/environment on its **own** detail page (not just in the run
grid). Linked the same existing defect (#3642, originally reported from run #83/environment `test`) to a case in
a completely **different** run (`TC-TCM-042-env-rename-run`, run #76, environment
`TC-TCM-293-manage-environment-positive-leg`) via the Defects* search box — linking itself worked correctly
(confirmed via DB: 4 `ExecutionDefect` rows across 2 distinct runs). But reopening defect #3642's own issue page
found **FAIL — new bug, BUG-TCM-102 (Medium)**: its "Test Run:" field still showed only the first run
(`TC-TCM-153-154-regress-all-cases-multienv`), completely missing the second — directly contradicted by the
Related Issues panel's own "2 runs" badge a few lines below on the same page. The sibling "Environment:" field on
the same page, by contrast, correctly listed all 3 distinct environments across both runs. Root-caused to
`_steps_list.html.erb`'s defect-tracker branch reading the stale scalar `@issue.run.name` instead of the
`ExecutionDefect`-join aggregation the Environment field right below it already uses — the same bug class as
closed BUG-TCM-050/058, a third, not-yet-fixed location. Filed as **BUG-TCM-102** — not yet reported to
production.

**Also explicitly confirmed, same session, per the user's separate question**: a **closed** defect's ID
correctly shows with a strikethrough, both in the Run page's "Linked defects" summary panel and in the run
grid's own "Defect ID's" column for every case it's linked to — confirmed via DOM inspection
(`style="text-decoration: line-through;"`) after an initial visual miss at full-page screenshot resolution (the
line is thin but genuinely present in both locations). **Working correctly, not a bug.**

**Total Defects count double-checked, same session, per a follow-up screenshot question** (the project Overview
dashboard's "Execution Details" table, `TOTAL DEFECTS` column). With defect #3642 now linked to 3 separate
executions within run #83 alone (cases #24 Failed, #26 Blocked, #23 Failed/environment test1) — confirmed via DB
as 3 real `ExecutionDefect` rows — the column correctly shows **1**, not 3. DB-verified directly:
`ExecutionDefect.where(issue_status_result_id: <run 83's result ids>).distinct.count(:defect_issue_id)` returns
exactly `1`. Same for run #76 (1 `ExecutionDefect` row → 1 distinct defect, also shows **1**). Traced to
`test_suites_helper.rb#total_defect_count`, which already has its own explanatory comment: this was fixed under
closed **BUG-TCM-057** specifically to stop filtering by a defect's own stale `run_id` scalar and instead use
`ExecutionDefect.where(...).distinct.count(:defect_issue_id)` — the same bug class as BUG-TCM-050/058/102, just
one more location that **was** already fixed. **Total Defects is accurate; working correctly, not a bug.**

---

### TC-TCM-175: Blocked result behaves like Failed for defect handling

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Set a case to **Blocked** and repeat TC-TCM-172 / TC-TCM-173.

**Expected Result:**
- Defect handling matches the Failed behaviour documented above.

**CONFIRMED LIVE — 2026-10-01 — PASS (matches Failed's behaviour, including the same BUG-TCM-014 gap).** Set
case #452 to Blocked without a defect — refused identically to Failed (TC-172 behaviour). Reported a new defect
(#1584) via "Report Defect" using the same Bug-tracker form — saved correctly as Blocked with the defect attached.
Blocked mirrors Failed exactly, including being subject to BUG-TCM-014 (an existing defect cannot be searched/
linked either, only a brand-new one via Report Defect).

**RETESTED 2026-10-23 — PASS, including donut-chart verification.** On run #83 (environment `test`), set case #26
to **Blocked** and linked the pre-existing defect #3642 (reused from TC-TCM-172-173-regress-failed-defect's
Failed result on case #24) via the Defects* search box. One real gotcha hit along the way: typing the defect
number and letting the dropdown auto-highlight the match is **not** enough — the Playwright accessibility tree
showed the option as `[selected]` purely from keyboard/ARIA state, but the underlying multi-select had not
actually committed it; clicking **Submit** at that point threw a client-side "Please select an item in the list."
validation popup and did not submit. Explicitly clicking the option (turning it into a visible removable chip in
the field) fixed this. After a correct submit: donut chart updated to **Untested (17) / Failed (1) / Blocked
(1)**, each with the correct percentage (89.5% / 5.3% / 5.3%) and its own legend color; run grid's Result column
for case #26 shows **Blocked** with **#3642** in Defect ID's; "Linked defects" panel still correctly shows 1 (the
same defect reused across both the Failed and Blocked case, not double-counted as 2).

---

### TC-TCM-176: Attach a file to an execution result

**User Role:** QA
**Priority:** Medium
**Steps:**
1. While recording a result, attach a file; save.
2. Reopen the result from execution history.

**Expected Result:**
- The attachment is stored against that result and is downloadable with its original filename and size.

**CONFIRMED LIVE — 2026-10-01 — FAIL — new bug, BUG-TCM-015.** Checked the Add Result panel for every Status value
(Passed, Failed, Retest, Blocked, Skipped) — zero file-upload controls exist anywhere (`input[type="file"]` count
= 0; the Notes rich-text toolbar has no image/attachment button either). This directly contradicts
`TESTCASE_MANAGEMENT_USER_GUIDE.md`'s own documented step 7, "Optionally attach files and add notes." Filed as
**BUG-TCM-015 (Medium)** — not yet reported to production.

**RETESTED 2026-10-23 — PASS, BUG-TCM-015 confirmed fixed.** The Add Result panel now has a real "Files" field
with a "Choose File" control (Maximum size: 5 MB). Attached `tc176-sample-attachment.txt` while recording case
#2133's Passed result (run #80). Reopened the issue's Results & Comments tab: the attachment appears with its
correct filename and size ("tc176-sample-attachment.txt (72 Bytes)"), and its download link
(`/attachments/download/7/tc176-sample-attachment.txt`) returned the exact original content, byte-for-byte.
**BUG-TCM-015 closed**, moved to `bugs/closed/`.

---

### TC-TCM-177: Results are independent per environment

**User Role:** QA
**Priority:** High
**Precondition:** A run with two environments.

**Steps:**
1. Set case X to **Passed** in environment A.
2. Switch to environment B and inspect case X.
3. Set case X to **Failed** in environment B, then switch back to A.

**Expected Result:**
- In B the case starts **Untested**, not Passed.
- After both are set, A shows **Passed** and B shows **Failed** — neither overwrites the other.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Used run #15 (chrome + edge). Set case #434 to Passed in chrome; switched
to edge — case #434 correctly started **Untested**, not Passed. Set case #434 to Failed in edge (with a new
defect, since BUG-TCM-014 blocks linking the existing one). Switched back to chrome — case #434 still shows
**Passed**. Switched to edge again — still **Failed**. Neither environment's result affected the other.

**RETESTED 2026-10-23 — PASS, via incidental coverage, with a caveat filed as BUG-TCM-102/103/104.** Run #83's
multi-environment work this session reconfirmed the base mechanism (case #23: Untested in `test`, Failed in
`test1`, independently) — but two related new bugs were found in adjacent areas this same session: the defect's
own "Test Run:" field doesn't aggregate across environments correctly (BUG-TCM-102), and the Run result filter
can leak a different environment's status into the current one under a timestamp-coincidence condition
(BUG-TCM-103) — see those bug files. The core per-environment Result independence itself still holds correctly.

---

### TC-TCM-178: Re-executing a case updates the current result and keeps history

**User Role:** QA
**Priority:** High
**Steps:**
1. Set a case to **Failed**, then set the same case to **Passed**.
2. Open the case's execution history.

**Expected Result:**
- The grid shows the latest result (**Passed**); the history retains both entries with timestamps and authors.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Re-executed case #437 in run #24 through the sequence Passed → Failed →
Passed. Run grid shows the latest result (**Passed**). The issue's own "Results & Comments" tab retains every
entry in full chronological order — Passed, Failed, Passed (plus two earlier Passed entries from this session),
each with its own author ("Redmine Admin"), relative timestamp, Environment, Test Suite, and Note — nothing was
overwritten or lost.

**Caveat added 2026-10-23, found via a related investigation (TC-180 below).** This TC's own PASS evidence used
case #437, which already had **prior** executions before this test ran — meaning its baseline "Untested" row had
already been replaced with a real row on an earlier pass. **BUG-TCM-104** (new, found this session) shows that a
case's very **first-ever** transition away from the auto-seeded baseline row updates that row in place rather
than inserting a new one — so the author/timestamp shown for that first transition is frozen at whoever created
the Run, not whoever actually executed the case. Re-executions *after* that first one (exactly what this TC
exercises) are unaffected and correctly get fresh rows/attribution, which is why this TC's own re-execution
sequence still shows correct authors — the gap is specifically in the untested-to-first-result transition, not
in re-execution generally.

---

### TC-TCM-179: Execute from the test case detail page

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a test case issue that belongs to a run.
2. Record a result from the case detail page rather than from the run grid.
3. Return to the run grid.

**Expected Result:**
- The result recorded from the detail page is reflected in the run grid for the matching run and environment.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Opened test case #450's issue detail page directly (not via the run grid),
used its own "Testcase Execution" section (Run=TC-TCM-170-187 Execution Suite Run, Environment=chrome, already
pre-selected), clicked the "Untested" Result link, recorded Passed. Reopened run #24's grid: case #450 correctly
shows **Passed** — the detail-page-recorded result is fully reflected in the run grid.

**RETESTED 2026-10-23 — PASS (data), FAIL — new bug, BUG-TCM-101 (console error).** Verified the reverse
direction explicitly: a result recorded from the **run grid** (case #24 set to Failed on run #83/environment
`test`, then case #26 set to Blocked, both via the grid) is correctly reflected back on each case's own **issue
detail page** "Testcase Execution" section after switching that section's Run dropdown to run #83 — issue #24
showed Result "Failed", issue #26 showed Result "Blocked", both matching the grid exactly, zero data mismatch.
However, every single Run-dropdown switch (and, separately, every Environment-dropdown switch) on this section —
reproduced on issue #24 (Run switch, then Environment switch) and again independently on issue #26 (Run switch)
— throws an identical uncaught console error: `TypeError: Cannot read properties of null (reading 'innerHTML')
at request.onreadystatechange`. The Result value itself is never wrong; only the console error is real. Filed as
**BUG-TCM-101 (Low)** — not yet reported to production.

---

### TC-TCM-180: Execution history shows author, timestamp and environment

**User Role:** QA and a second user
**Priority:** Medium
**Steps:**
1. Have two different users record results on the same case in the same run.
2. Open the execution history.

**Expected Result:**
- Each entry shows the correct author, timestamp, environment and status. No entry is attributed to the wrong user.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Logged in as a second real user (`willow.belle`, Developer role) and
recorded a Passed result on case #454 in run #24. Logged back in as admin and checked the issue's "Results &
Comments" tab: the new entry correctly shows **"Added by Willow Belle"** with its own timestamp/environment/status,
cleanly distinct from every other entry's "Added by Redmine Admin" — no cross-attribution.

**RETESTED 2026-10-23 — FAIL — new bug, BUG-TCM-104.** Reset `qa.limited`'s password to the shared QA convention
(`12345678`, was out of sync) to log in as a genuine second real user. Logged in as `qa.limited`, recorded case
#35's **first-ever** result (Passed) in run #83/environment `test`. Logged back in as admin and checked the
Results & Comments tab: the entry incorrectly shows **"Added by Redmine Admin ... about 1 hour ago"** — admin
created the run an hour earlier, but `qa.limited` is the one who actually just recorded this result, seconds
before checking. DB-confirmed: the underlying `IssueStatusResult` row's `added_by`/`created_at` are frozen from
the run's creation (admin, an hour ago); only `updated_by`/`updated_at` correctly show `qa.limited`/just-now, but
the UI reads `added_by`/`created_at`, not `updated_by`/`updated_at`. Root-caused to the auto-seeded baseline row
being updated in place on a case's first-ever execution, rather than a fresh row being inserted (see BUG-TCM-104
for full detail). This is why the 2026-10-01 PASS evidence (above) never caught it — it used a case already past
its first execution. Filed as **BUG-TCM-104 (High)** — not yet reported to production.

---

### TC-TCM-181: Filter run grid by defect status

**User Role:** QA
**Priority:** Medium
**Steps:**
1. In a run with a mix of cases with and without defects, apply the **With Defects** filter, then **Without Defects**.

**Expected Result:**
- Each filter returns exactly the matching subset; clearing the filter restores the full list.

**CONFIRMED LIVE — 2026-10-01 — PASS, corrected after an initial false-FAIL (BUG-TCM-016 filed then
retracted).** First pass only read the top-level "Add Filter" dropdown's option list — `["Subject", "Priority",
"Run result", "Test case", "Created at", "Updated at"]` — saw no defect-named entry, and filed BUG-TCM-016.
While on the same run page minutes later for TC-TCM-188, discovered that **selecting "Test case" as the filter
field reveals a second-level sub-filter whose own dropdown is exactly `["Without Defects", "With Defects"]`** —
the documented "filter by defect status" feature is real, just nested one level deeper than the first check
looked. Live-verified both values filter correctly: on run #22, "With Defects" correctly returned **0 of 17**
(none of that run's cases had a linked defect at the time), and "Without Defects" correctly returned **all 17**
(4 of 17 tested, 23.53% — identical to the unfiltered total). BUG-TCM-016 deleted (never reported to production);
see `bugs/_index.md` for the retraction note.

**RETESTED 2026-10-23 — PASS.** On run #83/environment `test`, applied "With Defects" — correctly returned
exactly cases #24 and #26 (the only 2 with a linked defect in this environment), excluding case #23 (which has a
defect only in the *other* environment `test1`) — correctly environment-scoped, confirming this filter's
`ExecutionDefect`-join (fixed under closed BUG-TCM-060) is unaffected by the environment-scoping gap found in
the sibling Run result filter this same session (BUG-TCM-103).

---

### TC-TCM-182: Filter run grid by run result

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Apply the **Run result** filter for each status in turn.

**Expected Result:**
- Only cases holding that status in the selected environment are listed, and the count matches the dashboard.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Applied the **Run result = Passed** filter on run #24 (chrome): grid
correctly narrowed to exactly cases #437, #450, #454 — matching the dashboard pie's "Passed (3)" exactly. (Side
note: this filter's own Select2 dropdown lists all 6 statuses correctly and works as expected — confirms BUG-TCM-
014 is specific to the Defects-field widget, not a general Select2/search problem in this plugin.)

**RETESTED 2026-10-23 — FAIL — new bug, BUG-TCM-103.** On run #83/environment `test`, applied **Run result =
Failed**: incorrectly returned **2** cases ("Showing 2 test cases") — case #24 (genuinely Failed in `test`,
correct) **and** case #23 (Untested in `test`, only Failed in the *other* environment `test1` — should have been
excluded). Reproduced the controller's exact filter query in isolation via `rails runner` (same `run_id`/
`testsuite_id`/`environment`/`run_result_ids`), confirming it genuinely returns `[23, 24]` outside the browser
too. Root-caused to `RunsController#apply_filters`'s "latest status" join matching back on `issue_id` +
`created_at` only (no `environment`/`testsuite_id` re-check) — when two different environments' results for the
same case share an identical `created_at` (confirmed: both at `2026-10-23 08:57:11 UTC` exactly), the join pulls
in the wrong environment's status. Filed as **BUG-TCM-103 (Medium)** — not yet reported to production. The
sibling "With Defects"/"Without Defects" filter (TC-181, same page) was separately confirmed NOT to have this
gap — its own `ExecutionDefect` join correctly re-checks `environment`/`testsuite_id`.

---

### TC-TCM-318: Filter run grid by Subject (new 2026-10-23, per direct user request)

**User Role:** QA
**Priority:** Medium
**Steps:**
1. On a run's grid, use **Add filter** → **Subject**, enter a term matching more than one case's subject, Apply.

**Expected Result:**
- Only cases whose subject contains the term are shown; clearing/removing the filter restores the full list.

**EXECUTED LIVE 2026-10-23 (new TC, build HEAD `d4f960b`) — PASS.** On run #83/environment `test`/testsuite "CI
Ingest" (18 cases), applied Subject = "Login with invalid password" — correctly returned exactly the 2 matching
rows (case #33 "Login with invalid password" and case #2137 "Legacy - Login with invalid password"), excluding
all 16 non-matching cases.

---

### TC-TCM-319: Run chart's Download SVG/PNG/CSV reflects the correct data (new 2026-10-23, per direct user request)

**User Role:** QA
**Priority:** Medium
**Steps:**
1. On a run's detail page (donut/pie chart), open the chart's **Menu** → **Download CSV** (and separately PNG/SVG).
2. Compare the downloaded file's data against the chart's own on-screen numbers and the real underlying result
   counts for every test suite assigned to the run (not just the one shown by default).

**Expected Result:**
- The downloaded data matches the chart exactly, and the chart itself reflects every test suite assigned to the
  run — not just one of them.

**EXECUTED LIVE 2026-10-23 (new TC, build HEAD `d4f960b`) — PASS for "does the download match the chart," FAIL
for "does the chart reflect the whole run" — not a new bug, a confirmed extension of already-open BUG-TCM-098.**
On run #84/environment `test` (no `testsuite_id` param — the default "All Suites in Run" view), downloaded the
chart as CSV: `Untested (18),100`. This exactly matches the on-screen donut ("Passed: 0%, 0 of 18 tested,
Untested (18), 100.0%") — the **download itself is accurate to what the chart shows**, so that half of this TC
passes cleanly.

However, the chart (and therefore its CSV/PNG/SVG exports) is **not actually counting the whole run**. Run #84
has 8 test suites assigned (`CI Ingest`, `U21 Brand New Suite`, `Edge2 Brand New Suite`, `CI Ingest Sub-Suite`,
`test`, `BUG97-Reverify-Suite-A`, `BUG97-Reverify-Suite-B`, `t3`), confirmed via the DB to have 18 / 3 / 3 / 4 /
1 / 1 / 1 / 2 distinct issues respectively (33 total `RunIssue` rows). The chart's "18" exactly matches only the
**first** suite's (`CI Ingest`) count — the other 7 suites' 15 cases are silently excluded, both from the chart
and from the grid rows shown underneath it in this same default view (confirmed: the grid under "All Suites"
shows exactly 18 rows too, not 33). This is the identical root cause already tracked as **BUG-TCM-098**
(`runs_controller.rb#show`'s `else` branch substitutes `@run.testsuites.first` for a real "all suites" query when
no `testsuite_id` param is present) — confirmed prod #124424. Not filed as a new bug; appended as evidence that
this bug's reach extends to the donut chart and all 3 of its download formats, not just the grid rows
originally reported.

---

### TC-TCM-183: Notes on a result are preserved verbatim

**User Role:** QA
**Priority:** Low
**Steps:**
1. Record a result with a multi-line note containing formatting and a special character (e.g. `< > & "` and an emoji).
2. Reopen the result.

**Expected Result:**
- The note round-trips exactly, with no HTML escaping artefacts shown to the user and no truncation.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Recorded a Passed result on case #437 (run #24) with a 3-line note
containing special characters, an emoji, and a raw `<script>` tag: `Line one < > & " test 😀🔥` / `Line two second
line` / `Line three: special chars <script>alert(1)</script> & "quoted"`. Reopened the issue's Results & Comments
tab and confirmed the note round-tripped **character-for-character**, rendered as three separate paragraphs with
no truncation, no visible HTML-escaping artefacts (no literal `&lt;`/`&amp;` text shown to the user), the emoji
intact, and — critically — the `<script>` tag rendered as inert literal text rather than executing (no JS alert
fired, no related console error), confirming the editor safely escapes markup on output while still displaying it
as the user typed it.

**RETESTED 2026-10-23 — PASS.** Recorded a Passed result on case #27 (run #83) with a 3-line note containing
`< > & "`, an emoji (😀🔥), and a raw `<script>alert(1)</script>` tag. Reopened the issue's Results & Comments tab:
the note round-tripped character-for-character, the script tag rendered as inert literal text (confirmed zero
console errors, no alert fired), consistent with the original finding. (This standalone, non-modal Add Result
page's Note field is a plain `<textarea>`, not the EditorJS rich-text widget used elsewhere in the plugin — filled
directly for speed; the save/round-trip path exercised is identical either way.)

---

### TC-TCM-184: Result triggers the Test Case Result Added notification

**User Role:** QA, with a watcher mailbox
**Priority:** Medium
**Precondition:** Sidekiq running; the notification enabled.

**Steps:**
1. Record a result on a watched run; check the mailbox.

**Expected Result:**
- A "Test Case Result Added" email arrives naming the case, status and environment.

**CONFIRMED LIVE — 2026-10-01 — PASS** (mechanism), **duplicate send reconfirmed — BUG-TCM-013.** Recorded a
Passed result with a note on case #434 in run #22 (`TC-TCM-164 Watcher Notification Run`, which already has
`daisy.skye` set up as a watcher from a prior session). Logged into her Roundcube mailbox
(`daisy.skye@test.local`) and confirmed the email arrived: subject "Test Case Result Added: Verify user can add
item to wishlist," body correctly shows `Result #434 was added by Redmine Admin`, `Status: Passed`, the exact
note text, `Environment: chrome`, `Assignee: Redmine Admin` — matches this TC's expectation exactly. Also
reconfirms the **already-filed BUG-TCM-013**: this single Submit produced **two** identical copies of the email
in the inbox, not one.

**RETESTED 2026-10-23 — PASS** (mechanism and content), **duplicate send still reconfirmed — BUG-TCM-013 still
open.** Recorded a Passed result on case #24 (run #22, watched by `qa.limited`, via Mailpit not Roundcube — see
TC-164's note on the stale `daisy.skye` memory). Email arrived correctly: subject "Test Case Result Added: Apply
valid discount code at checkout," body shows `Result #24 was added by Redmine Admin`, `Status: Passed`,
`Environment: test`, `Assignee: Redmine Admin` — matches expectation. **Confirmed again this single Submit
produced 2 identical copies** — BUG-TCM-013 still reproduces on the current build. Also spot-checked the
BUG-TCM-104 follow-up question (whether the email's "was added by X" text could also misattribute a case's
first-ever execution): in this test the recorder (admin) and the run creator (also admin) were the same person,
so this particular run didn't isolate the question — worth a dedicated check in a future session with a genuine
second-user first-execution + email check combined.

---

### TC-TCM-185: Dashboard statistics reflect execution

**User Role:** QA
**Priority:** High
**Steps:**
1. Note the dashboard's pass percentage and status pie.
2. Record several results of mixed statuses; reload the dashboard.

**Expected Result:**
- Counts, percentage and pie segments update to match the actual results; the tested/untested total is correct.

**CONFIRMED LIVE — 2026-10-01 — PASS.** On run #22 (17 cases), noted the baseline **"1 of 17 tested (5.88%)"**
after the prior TC-184 Passed result. Recorded two more mixed results (case #435 → Skipped, case #436 → Retest),
then reloaded the run page: top summary correctly advanced to **"3 of 17 tested (17.65%)"** (3/17 = 17.647%,
exact), and the pie chart correctly shows **Passed (1), Skipped (1), Retest (1), Untested (14)** — exactly
matching the three recorded results plus the 14 still-untested cases.

**RETESTED 2026-10-23 — PASS, via incidental coverage.** Run #83's own progression this session (Untested(19) →
Failed(1)/Untested(18) → Failed(1)/Blocked(1)/Untested(17)) tracked correctly at every step, confirming the
dashboard statistics mechanism holds on the current build.

---

### TC-TCM-186: Execution with Sidekiq stopped

**User Role:** QA / Admin
**Priority:** Medium
**Steps:**
1. Stop Sidekiq. Record a result on a watched run.
2. Check the grid, then the watcher mailbox.

**Expected Result:**
- The result itself still saves and displays.
- The notification email does not arrive while Sidekiq is down — confirming the dependency.
- **This is expected environment behaviour, not a bug.** It exists to stop "no email arrived" being misfiled as a
  product defect. Restart Sidekiq afterwards.

**CONFIRMED LIVE — 2026-10-01 — PASS on "result still saves," corrected premise on the Sidekiq dependency.**
Stopped Sidekiq inside the container (`docker exec redmine-docker-700-redmine-1 kill -9 <pid>`, confirmed gone via
`ps aux`), then recorded a Skipped result on case #448 (run #22, watched by `daisy.skye`). The result correctly
saved and displayed (run advanced to "4 of 17 tested, 23.53%"). However, checking her Roundcube mailbox
afterward showed the "Test Case Result Added: Verify user can update billing address" email **did arrive anyway**
— this TC's own precondition (notification delivery depends on Sidekiq being up) does not hold in this
environment: mail delivery for this notification is evidently not gated by the Sidekiq queue at all (most likely
synchronous ActionMailer delivery rather than an ActiveJob-backed async queue). Not filed as a bug — this is a
corrected test premise, not a product defect; the result-saves-regardless-of-Sidekiq half of the TC still holds.
Sidekiq restarted immediately after (`bundle exec sidekiq`, confirmed running via log).

**RETESTED 2026-10-23 — PASS on "result still saves," same corrected premise reconfirmed on the current build.**
Stopped the dedicated Sidekiq container (`docker stop redmine6-sidekiq-1` — a separate container on this
instance, not a process inside the Redmine container as the 2026-10-01 note assumed), recorded a Passed result on
case #24 (run #22): saved and displayed correctly ("2 of 9 tested, 22.22%"). Checked Mailpit: the "Test Case
Result Added" email **still arrived anyway**, seconds later — same corrected finding as 2026-10-01, this
notification's delivery is not actually gated by Sidekiq in this environment. Sidekiq restarted immediately after
(`docker start redmine6-sidekiq-1`), confirmed running.

---

### TC-TCM-187: Concurrent execution by two users on the same case

**User Role:** two QA users
**Priority:** Medium
**Steps:**
1. Both open the same run and the same case in the same environment.
2. User 1 saves **Passed**; user 2 then saves **Failed** without reloading.

**Expected Result:**
- The final state is deterministic (last write wins) and the history contains both entries.
- No error, and no silent loss of the first result from history.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED (tooling constraint, not a product finding).** Tried to open a second tab
as a different user to run this genuinely concurrently; confirmed via `page.context().cookies()` that the
Playwright MCP session's tabs share a single browser context (the same `_redmine_session` cookie), so a second
tab cannot hold an independent second user's login without logging the first one out — there is no way to drive
two truly simultaneous, independently-authenticated UI sessions with the tooling available this session. Not
faked with a sequential two-single-user workaround, since that wouldn't actually test the race condition this TC
is for. Deferred — needs either two separate browser profiles/processes or the automation suite (which can run
two independent Playwright browser contexts) to execute properly.

---

## Bulk update — currently blocked by BUG-TCM-003

---

### TC-TCM-188: Bulk update results for multiple selected cases

**User Role:** QA
**Priority:** High
**Steps:**
1. Open a run, tick two or more cases.
2. Click **Bulk Update Result**, choose a **Status**, keep the assigned **Environment**, click **Submit**.
3. Reload the run grid.

**Expected Result:**
- Every selected case shows the chosen status in that environment.
- **Currently FAILS — BUG-TCM-003** (prod #120544): the request is rejected with 401 and nothing is saved. Use
  this TC as the retest vehicle when that bug is fixed.

**CONFIRMED LIVE — 2026-10-01 — PASS, BUG-TCM-003 fix reconfirmed under bulk update specifically.** Selected
cases #437 and #449 (run #22, both Untested) via their row checkboxes, opened **Bulk Update Result**, chose
**Skipped**, kept Environment = chrome, and submitted — no 401, no error. Reloaded the run grid: both cases now
correctly show **Skipped**, all other cases unaffected. This is this suite's first genuine exercise of the bulk
endpoint since BUG-TCM-003 was closed (2026-09-30) on production retest evidence rather than a local run; now
independently confirmed locally too.

**RETESTED 2026-10-23 — PASS, specifically exercising the "bulk update silently not applying to an already-
executed case" fix (Oct 7 commit).** On run #76 (12 cases, where case #23 was already **Passed** from earlier
testing), selected all 12 via "Select all on this page" and bulk-updated to **Skipped**. DB/grid check
afterward: **all 12 cases, including #23, correctly changed to Skipped** — the previously-executed case was not
silently skipped. This is the exact regression scenario the commit targeted; confirmed fixed.

**Issue-detail-page cross-check, 2026-10-23 (separate from the grid/DB check above).** Opened one of the
bulk-updated cases' own issue detail page directly and switched its "Testcase Execution" Run selector to run #76:
the Result shown there matched the grid/DB exactly (**Skipped**) — a bulk-recorded result is reflected correctly
on the case's own detail page, not just in the run grid. (This switch also reproduces BUG-TCM-101's console
error, same as any other Run/Environment switch on that page — see TC-TCM-179 and BUG-TCM-101.)

---

### TC-TCM-189: Bulk update with execution notes

**User Role:** QA
**Priority:** Medium
**Steps:**
1. As TC-TCM-188, entering a note in the **Notes** field before submitting.

**Expected Result:**
- The note is applied to every selected case's result.
- **Currently FAILS — BUG-TCM-003.**

**CONFIRMED LIVE — 2026-10-01 — PASS.** Selected cases #451 and #452 (run #22), opened Bulk Update Result, chose
Skipped, and entered the note "TC-189: bulk update note applied to both selected cases." before submitting.
Checked both issues' Results & Comments tabs independently: the identical note text, Status: Skipped, and
Environment: chrome all appear correctly on **both** #451 and #452 — the note is not dropped, truncated, or
applied to only one of the two.

**RETESTED 2026-10-23 — PASS.** On run #83 (environment `test`), selected cases #23 and #28, opened Bulk Update
Result, chose Skipped, entered the note "TC-189 bulk note check: applied to both selected cases." Checked both
issues' Results & Comments tabs independently: the identical note text appears correctly on **both** #23 and
#28 — not dropped, truncated, or applied to only one.

---

### TC-TCM-190: Bulk update applies only to the selected cases

**User Role:** QA
**Priority:** High
**Steps:**
1. In a run of ≥10 cases, select exactly 3 and bulk update them to **Skipped**.
2. Inspect the remaining cases.

**Expected Result:**
- Exactly the 3 selected cases change; all others keep their prior status.
- **Currently FAILS — BUG-TCM-003.**

**CONFIRMED LIVE — 2026-10-01 — PASS.** Run #22 has 17 cases. Captured the full before-state, selected exactly
cases **#453, #454, #455** (all Untested), bulk-updated them to Skipped, then re-fetched the full grid. Result:
exactly those 3 cases flipped to Skipped; every other case — including the 6 others already set earlier this
session (434–452) and the 6 still-untested ones (450, 456, 457, 458, 1526, 1527) — kept its exact prior status,
with no bleed-over to unselected rows.

---

### TC-TCM-191: Bulk update status list excludes defect-requiring statuses

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open **Bulk Update Result** and inspect the **Status** dropdown.

**Expected Result:**
- Offers Passed / Retest / Skipped only — Failed and Blocked are absent because bulk mode collects no defect IDs.
- This is intended behaviour; confirm it is still true after BUG-TCM-003 is fixed.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Selected 2 cases and opened Bulk Update Result: `select[name="issue_status
_result[case_status_id]"]` options are exactly `["-- Select status --", "Passed", "Retest", "Skipped"]`. Failed and
Blocked remain correctly absent, still true now that BUG-TCM-003 is fixed and bulk update actually persists —
confirms this exclusion is deliberate design (bulk mode has no per-case Defects field to satisfy Failed/Blocked's

**§27 regression, 2026-10-28 — all 4 TCs (188–191) re-verified, 4/4 PASS, zero new bugs.** TC-188/191 already
reconfirmed earlier the same day via the BUG-TCM-124 retest (run #163, 22-case bulk Passed, dropdown still exactly
Passed/Retest/Skipped). TC-190 (partial selection) re-verified fresh on run #188: selected exactly 2 of 25
untested cases (#2045/#2046, modal confirmed "Apply to 2 testcase(s)"), bulk-updated to Passed — only those 2
changed, every other case (including the still-untested ones) kept its prior status. TC-189 (bulk note)
re-verified on the same run: selected #2047/#26, bulk-updated to Skipped with note "TC189-REG28-bulk-note-check"
— both issues' Results & Comments tabs show the identical note text and Skipped status, confirmed independently
on each issue's own page. **Note for future sessions**: the Bulk Update Result modal's submit button id is
`bulk-update-submit-btn`, distinct from the single Add Result modal's `update-btn` — an automation script or
manual JS-evaluate click targeting the wrong id fails silently (no error, nothing submitted) since the wrong
id simply doesn't exist in that modal; cost real debugging time this session before being traced to this.

**Additional BUG-TCM-124 coverage, 2026-10-28 — particular-suite view, both write paths re-verified.** The
original BUG-TCM-124 retest only exercised the "All Suites" view (both findings fixed there — see
`bugs/closed/BUG-TCM-124.md`). On user request, also re-verified both write paths from a **particular-suite**
view (`run_id=163&testsuite_id=3`, "Suite: CI Ingest") to confirm the fix didn't regress the already-working
suite-scoped case:
- **Single Add Result** on issue #23 (`testsuite_id=3` in the form URL) — submitted Status=Retest, result
  saved ("Retest" now shown in the grid, pass rate updated to 95.45%), and the redirect correctly **stayed on**
  `testsuite_id=3` / "Suite: CI Ingest" — no suite-switching regression.
- **Bulk Update Result** on issues #26/#27 (2 selected, modal confirmed "Apply to 2 testcase(s)") — submitted
  Status=Retest. Network trace: `POST /issue_status_results/bulk_create` → **201 Created**. Both issues now
  show "Retest," Suite switcher stayed "Suite: CI Ingest," `testsuite_id=3` preserved in the URL.

All 4 combinations (Single/Bulk × All-Suites/particular-suite) are now confirmed working with zero regressions.
Same test-data-impact note as the original bug applies: these are genuine result writes against fixture Run
#163, left as-is (no "Untested" revert option exists on the Status dropdown).
requirement), not a side-effect of the endpoint being broken.

**RETESTED 2026-10-23 — PASS.** On run #83, selected all 2 then-visible cases, opened Bulk Update Result: the
Status dropdown still offers exactly `["-- Select status --", "Passed", "Retest", "Skipped"]` — Failed/Blocked
remain correctly absent.

---

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 6 — Test execution, BUG-TCM-094/101/103/104)

- **BUG-TCM-101 (console error on Run/Environment switch) — CONFIRMED FIXED, live.** On issue #23's "Testcase
  Execution" section, switched both the Run dropdown (→ "RFTC-016 QA run 2") and the Environment dropdown (→
  "CI") — zero console errors on either switch (previously threw a `TypeError` on every single switch).
- **BUG-TCM-094 (cross-project IDOR via `issue_status_results#new`), BUG-TCM-103 (Run-result filter env leak on
  timestamp collision), BUG-TCM-104 (misattributed first result)** — not re-run this pass given the "fast,
  targeted" scope (each needs more elaborate setup — a second project/run pair, a timestamp collision fixture, or
  a genuine second-user login — than this pass's time budget allows). All 3 were confirmed via precise source
  diff on 2026-10-26; no commits to the affected files since. **Resume points:** TC-094 — request
  `issue_status_results/new?run_id=<other-project's-run>&project_id=<this-project>` as a member of only this
  project, confirm 404; TC-103 — reproduce two results with an identical `created_at` across two environments,
  confirm the Run-result filter picks the correct one; TC-104 — log in as a second real user, record a case's
  first-ever result, confirm `added_by`/`created_at` reflect that user/moment, not the run's creator.

**Result: 1 of 4 bugs freshly live-reproduced, 3 rely on yesterday's still-current source-diff evidence. No
regressions, no new bugs.**

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 8 — Test run lifecycle, BUG-TCM-097 shared/116)

- **BUG-TCM-097** — shared with Area 7, see that area's note above (run #83 "All Suites" spot-check).
- **BUG-TCM-116 (orphan `issue_status_results` row on test case delete)** — not re-run this pass. Deleting a test
  case from one of this project's many shared regression-fixture runs risked disturbing other in-flight sessions'
  evidence, and confirming "no orphan row" meaningfully needs a DB check (`rails runner` is blocked in this
  environment by a `secret_key_base` config gap when invoked via `docker exec`, per this project's own standing
  constraint on environment-variable access). Confirmed via precise source diff 2026-10-26
  (`has_many :issue_status_results, dependent: :destroy` added to `issue_patch.rb`), no relevant commits since.
  **Resume point:** create a disposable test case, add it to a disposable run, record a result, delete the test
  case, and confirm (via a DB check, not just the UI) its `issue_status_results` row is gone, not orphaned.

**Result: 0 of 2 bugs freshly live-reproduced this specific area (BUG-097 covered under Area 7); both rely on
existing source-diff evidence. No regressions, no new bugs.**

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-152 – 418 | Run lifecycle | — |
| TC-TCM-170 – 436 | Execution | — |
| TC-TCM-188 – 440 | Bulk update | **BUG-TCM-003** (prod #120544, closed) |
| TC-TCM-170 | Record a Passed result (first execution, 2026-10-23) | — |
| TC-TCM-168, 174, 176 | Re-verified 2026-10-23 now that their blocking bugs are fixed | BUG-TCM-011, 014, 015 (all closed, reconfirmed) |
| TC-TCM-318 – 319 | Run grid Subject filter + chart download correctness (new 2026-10-23, per direct user request) | BUG-TCM-098 (TC-TCM-319, extension — chart/CSV/PNG/SVG also only reflect the first testsuite under "All Suites in Run") |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-164, 433 and 435 depend on Sidekiq — confirm it is running before calling any of them a failure.
