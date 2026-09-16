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

### TC-TCM-401: Create a run with all fields populated

**User Role:** QA / Manager
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

---

### TC-TCM-402: Create a run including all test cases

**User Role:** QA
**Steps:**
1. **Add Run**, complete the mandatory fields, choose the "include all test cases" option.
2. Click **Create** and open the run.

**Expected Result:**
- Every test case in the project's suites is present in the run grid; the count matches the suite totals.

---

### TC-TCM-403: Create a run with multiple environments

**User Role:** QA
**Precondition:** ≥2 environments exist.

**Steps:**
1. **Add Run**, select **two** environments, complete the rest, **Create**.
2. Open the run and switch the environment selector between the two.

**Expected Result:**
- Both environments are selectable on the run.
- Each environment shows its own independent result set (initially all Untested).

---

### TC-TCM-404: Run name is mandatory

**User Role:** QA
**Steps:**
1. **Add Run**, leave **Run Name** empty, complete everything else, click **Create**.

**Expected Result:**
- Creation is refused with a visible validation error naming the missing field. No run is created.

---

### TC-TCM-405: End date earlier than start date is rejected

**User Role:** QA
**Steps:**
1. **Add Run**, set **Start Date** to today and **End Date** to yesterday; **Create**.

**Expected Result:**
- Creation is refused with a clear validation message, or the date picker prevents the selection.
- A run created with an end date before its start date is a defect.

---

### TC-TCM-406: Edit an existing run

**User Role:** QA / Manager
**Steps:**
1. Open a run's action menu → edit.
2. Change the **Note**, **End Date** and **Assignee**; save.
3. Reload the run.

**Expected Result:**
- All three changes persist and are shown on the run detail.

---

### TC-TCM-407: Close a run

**User Role:** QA / Manager
**Steps:**
1. **Runs & Results** → run's **Action Button** → **Close Run** → confirm.
2. Check the **Active** and **Closed** tabs.

**Expected Result:**
- The run leaves **Active** and appears under **Closed**.

---

### TC-TCM-408: A closed run cannot be executed against

**User Role:** QA
**Steps:**
1. Open the run closed in TC-TCM-407 from the **Closed** tab.
2. Attempt to set a result on any test case.

**Expected Result:**
- Execution is not possible — the Result control is disabled/absent, or the attempt is refused with a message.
- Record the behaviour; being able to record new results into a closed run would be a workflow defect.

---

### TC-TCM-409: Delete a run

**User Role:** Manager / Admin
**Steps:**
1. Delete a run via its action menu; confirm the prompt.
2. Check both tabs.

**Expected Result:**
- The run is gone from **Active** and **Closed**.

---

### TC-TCM-410: Cancelling the delete prompt does not delete

**User Role:** Manager
**Steps:**
1. Start the delete, then **cancel** at the confirmation prompt.
2. Reload the run list.

**Expected Result:**
- The run is still present and unchanged.

---

### TC-TCM-411: Run state values persist and display

**User Role:** QA
**Steps:**
1. Create runs covering each available **Run State**.
2. Inspect the State column on the Runs & Results list.

**Expected Result:**
- Each run shows the state it was created with; no state is blank or defaulted incorrectly.

---

### TC-TCM-412: Overdue run is flagged

**User Role:** QA
**Steps:**
1. Create a run whose **End Date** is in the past and whose cases are not all executed.
2. Open the run and the run list.

**Expected Result:**
- The run is visibly flagged as overdue (e.g. an "Overdue" badge) and is picked up by the Overdue Run Summary report.

---

### TC-TCM-413: Watchers receive run notifications

**User Role:** QA (creator), plus a watcher account with a real mailbox
**Precondition:** Sidekiq running; **Run Added** / **Run Updated** notifications enabled.

**Steps:**
1. Create a run adding the watcher account.
2. Check the watcher's mailbox.
3. Edit the run; check the mailbox again.

**Expected Result:**
- A "Run Added" notification arrives on creation and a "Run Updated" notification on edit.
- Links inside the email resolve to the correct host (verify **Settings → General → Host name and path** first,
  per root `MEMORY.md`).

---

### TC-TCM-414: Active and Closed tabs partition runs correctly

**User Role:** QA
**Steps:**
1. With ≥2 active and ≥2 closed runs, inspect each tab.

**Expected Result:**
- Every run appears in exactly one tab, matching its closed state. No run appears in both or neither.

---

### TC-TCM-415: Search a run by name and by ID

**User Role:** QA
**Steps:**
1. Use **Search by run name or ID** with a full name, a partial name, and the numeric run ID.

**Expected Result:**
- Each search returns the matching run; a non-matching term returns an empty result rather than the full list.

---

### TC-TCM-416: Run list paginates correctly

**User Role:** QA
**Precondition:** More runs than one page holds.

**Steps:**
1. Page through the run list and note the count indicator.

**Expected Result:**
- The count matches the real total; no run is duplicated or skipped across pages.

---

### TC-TCM-417: Test case added to a suite after run creation

**User Role:** QA
**Steps:**
1. Create a run selecting specific cases.
2. Add a new test case to a suite covered by that run.
3. Reopen the run.

**Expected Result:**
- Behaviour is consistent and documented — the run's case list either stays fixed at creation time (expected for
  a specific selection) or picks up the new case (expected for "include all").
- Record which; an inconsistent mix is a defect.

---

### TC-TCM-418: Deleting a test case that belongs to an active run

**User Role:** Admin
**Steps:**
1. Delete a test case that is part of an active run.
2. Open that run.

**Expected Result:**
- The run renders without error; the deleted case is either removed from the grid or shown in a clearly handled
  state. A 500 error or a broken row is a defect.

---

## Functional Cases — Execution

---

### TC-TCM-419: Record a Passed result

**User Role:** QA
**Steps:**
1. Open a run, select an **Environment**, click the **Result** field of a case.
2. Choose **Passed**, add a note, click **Save**.
3. Reload the run grid.

**Expected Result:**
- The grid shows **Passed** for that case in that environment, and the note is retained in its history.

---

### TC-TCM-420: Record each of the six statuses

**User Role:** QA
**Steps:**
1. On six different cases, record **Untested**, **Passed**, **Failed**, **Retest**, **Blocked** and **Skipped**
   respectively (supplying a defect where required).
2. Reload the grid.

**Expected Result:**
- Each case shows the status chosen; the dashboard pie chart and pass-percentage update to match.

---

### TC-TCM-421: Failed result requires a defect

**User Role:** QA
**Steps:**
1. Set a case's result to **Failed** without reporting or linking a defect; attempt to save.

**Expected Result:**
- The save is refused with a clear message requiring a defect, consistent with the documented behaviour that
  Failed/Blocked carry a defect.
- Record the behaviour if the save is instead allowed.

---

### TC-TCM-422: Report a new bug from a failed execution

**User Role:** QA
**Precondition:** Defect Tracker configured.

**Steps:**
1. Set a case to **Failed**, click **Report Bug**, complete the bug form, save.
2. Open the created issue, and reopen the test case.

**Expected Result:**
- A new issue is created on the **Defect** tracker, linked to the test case.
- The run grid's **Defect ID's** column shows the new defect for that case.

---

### TC-TCM-423: Link an existing defect to a failed execution

**User Role:** QA
**Steps:**
1. Set a case to **Failed** and link an existing issue instead of creating one.
2. Reload the run grid.

**Expected Result:**
- The existing issue is associated; the Defect ID's column shows it; no duplicate issue is created.

---

### TC-TCM-424: Blocked result behaves like Failed for defect handling

**User Role:** QA
**Steps:**
1. Set a case to **Blocked** and repeat TC-TCM-421 / TC-TCM-422.

**Expected Result:**
- Defect handling matches the Failed behaviour documented above.

---

### TC-TCM-425: Attach a file to an execution result

**User Role:** QA
**Steps:**
1. While recording a result, attach a file; save.
2. Reopen the result from execution history.

**Expected Result:**
- The attachment is stored against that result and is downloadable with its original filename and size.

---

### TC-TCM-426: Results are independent per environment

**User Role:** QA
**Precondition:** A run with two environments.

**Steps:**
1. Set case X to **Passed** in environment A.
2. Switch to environment B and inspect case X.
3. Set case X to **Failed** in environment B, then switch back to A.

**Expected Result:**
- In B the case starts **Untested**, not Passed.
- After both are set, A shows **Passed** and B shows **Failed** — neither overwrites the other.

---

### TC-TCM-427: Re-executing a case updates the current result and keeps history

**User Role:** QA
**Steps:**
1. Set a case to **Failed**, then set the same case to **Passed**.
2. Open the case's execution history.

**Expected Result:**
- The grid shows the latest result (**Passed**); the history retains both entries with timestamps and authors.

---

### TC-TCM-428: Execute from the test case detail page

**User Role:** QA
**Steps:**
1. Open a test case issue that belongs to a run.
2. Record a result from the case detail page rather than from the run grid.
3. Return to the run grid.

**Expected Result:**
- The result recorded from the detail page is reflected in the run grid for the matching run and environment.

---

### TC-TCM-429: Execution history shows author, timestamp and environment

**User Role:** QA and a second user
**Steps:**
1. Have two different users record results on the same case in the same run.
2. Open the execution history.

**Expected Result:**
- Each entry shows the correct author, timestamp, environment and status. No entry is attributed to the wrong user.

---

### TC-TCM-430: Filter run grid by defect status

**User Role:** QA
**Steps:**
1. In a run with a mix of cases with and without defects, apply the **With Defects** filter, then **Without Defects**.

**Expected Result:**
- Each filter returns exactly the matching subset; clearing the filter restores the full list.

---

### TC-TCM-431: Filter run grid by run result

**User Role:** QA
**Steps:**
1. Apply the **Run result** filter for each status in turn.

**Expected Result:**
- Only cases holding that status in the selected environment are listed, and the count matches the dashboard.

---

### TC-TCM-432: Notes on a result are preserved verbatim

**User Role:** QA
**Steps:**
1. Record a result with a multi-line note containing formatting and a special character (e.g. `< > & "` and an emoji).
2. Reopen the result.

**Expected Result:**
- The note round-trips exactly, with no HTML escaping artefacts shown to the user and no truncation.

---

### TC-TCM-433: Result triggers the Test Case Result Added notification

**User Role:** QA, with a watcher mailbox
**Precondition:** Sidekiq running; the notification enabled.

**Steps:**
1. Record a result on a watched run; check the mailbox.

**Expected Result:**
- A "Test Case Result Added" email arrives naming the case, status and environment.

---

### TC-TCM-434: Dashboard statistics reflect execution

**User Role:** QA
**Steps:**
1. Note the dashboard's pass percentage and status pie.
2. Record several results of mixed statuses; reload the dashboard.

**Expected Result:**
- Counts, percentage and pie segments update to match the actual results; the tested/untested total is correct.

---

### TC-TCM-435: Execution with Sidekiq stopped

**User Role:** QA / Admin
**Steps:**
1. Stop Sidekiq. Record a result on a watched run.
2. Check the grid, then the watcher mailbox.

**Expected Result:**
- The result itself still saves and displays.
- The notification email does not arrive while Sidekiq is down — confirming the dependency.
- **This is expected environment behaviour, not a bug.** It exists to stop "no email arrived" being misfiled as a
  product defect. Restart Sidekiq afterwards.

---

### TC-TCM-436: Concurrent execution by two users on the same case

**User Role:** two QA users
**Steps:**
1. Both open the same run and the same case in the same environment.
2. User 1 saves **Passed**; user 2 then saves **Failed** without reloading.

**Expected Result:**
- The final state is deterministic (last write wins) and the history contains both entries.
- No error, and no silent loss of the first result from history.

---

## Bulk update — currently blocked by BUG-TCM-003

---

### TC-TCM-437: Bulk update results for multiple selected cases

**User Role:** QA
**Steps:**
1. Open a run, tick two or more cases.
2. Click **Bulk Update Result**, choose a **Status**, keep the assigned **Environment**, click **Submit**.
3. Reload the run grid.

**Expected Result:**
- Every selected case shows the chosen status in that environment.
- **Currently FAILS — BUG-TCM-003** (prod #120544): the request is rejected with 401 and nothing is saved. Use
  this TC as the retest vehicle when that bug is fixed.

---

### TC-TCM-438: Bulk update with execution notes

**User Role:** QA
**Steps:**
1. As TC-TCM-437, entering a note in the **Notes** field before submitting.

**Expected Result:**
- The note is applied to every selected case's result.
- **Currently FAILS — BUG-TCM-003.**

---

### TC-TCM-439: Bulk update applies only to the selected cases

**User Role:** QA
**Steps:**
1. In a run of ≥10 cases, select exactly 3 and bulk update them to **Skipped**.
2. Inspect the remaining cases.

**Expected Result:**
- Exactly the 3 selected cases change; all others keep their prior status.
- **Currently FAILS — BUG-TCM-003.**

---

### TC-TCM-440: Bulk update status list excludes defect-requiring statuses

**User Role:** QA
**Steps:**
1. Open **Bulk Update Result** and inspect the **Status** dropdown.

**Expected Result:**
- Offers Passed / Retest / Skipped only — Failed and Blocked are absent because bulk mode collects no defect IDs.
- This is intended behaviour; confirm it is still true after BUG-TCM-003 is fixed.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-401 – 418 | Run lifecycle | — |
| TC-TCM-419 – 436 | Execution | — |
| TC-TCM-437 – 440 | Bulk update | **BUG-TCM-003** (prod #120544) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-413, 433 and 435 depend on Sidekiq — confirm it is running before calling any of them a failure.
