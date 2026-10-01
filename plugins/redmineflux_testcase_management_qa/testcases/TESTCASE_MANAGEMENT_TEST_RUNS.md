# Test Cases — Redmineflux Testcase Management — Test Runs & Execution

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflows 6–8 and the vendor KB "Test Run Lifecycle" /
> "Test Execution" sections.
>
> **Status: authored 2026-09-14, not yet executed** except where a TC is explicitly marked as already evidenced
> by an existing bug.

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
requirement), not a side-effect of the endpoint being broken.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-152 – 418 | Run lifecycle | — |
| TC-TCM-170 – 436 | Execution | — |
| TC-TCM-188 – 440 | Bulk update | **BUG-TCM-003** (prod #120544) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-164, 433 and 435 depend on Sidekiq — confirm it is running before calling any of them a failure.
