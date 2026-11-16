# Test Cases — Redmineflux Testcase Management — Release 7.5.0 New Features

> Covers the 3 features shipped in **Testcase Management plugin Release 7.5.0** (production version id=2076):
> production #125998 (Results Dashboard tab), #125999 (JPG report — full run details), and #127458 (Step /
> Expected Result multi-line support — shipped slightly later but tracked against the same release cycle).
> #125998/#125999 were already developed+tested by Sheetal Sharma on production (status: Done) — these local TCs
> exist so the happy-flow cross-DB pass (`TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`) has its own positive-path
> coverage of them, not to re-run the full original QA cycle.
>
> All cases below are happy-path only — no edge/negative/security/performance cases, per the happy-flow scope.

---

## Results Dashboard tab (production #125998)

### TC-TCM-367: Results Dashboard tab appears on the test run page
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Open an existing Test Run with a mix of Passed/Failed/Blocked results.
2. Look for a **Results Dashboard** tab alongside Overview / Test Cases / Reports.
3. Click it.

**Expected Result:**
- A "Results Dashboard" tab is present on the run page and opens without error.

---

### TC-TCM-368: Results Dashboard shows correct numeric breakdown
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. From the same run, note the actual Passed/Failed/Blocked/Total counts from the Test Cases tab.
2. Open Results Dashboard.
3. Compare its numeric breakdown (e.g. "45 Passed / 12 Failed / 3 Blocked out of 60 total") against step 1.

**Expected Result:**
- Numbers match exactly; total equals the sum of all status counts and the run's total case count.

---

### TC-TCM-369: Results Dashboard visual chart reflects the same data
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA / Manager
**Priority:** Low
**Steps:**
1. On Results Dashboard, locate the chart/graphic breakdown alongside the numbers.
2. Confirm it renders without error and its proportions correspond to the numeric breakdown (TC-TCM-368).

**Expected Result:**
- Chart renders; segment sizes/labels are consistent with the numeric counts, so run health is assessable without opening the full test case list.

---

## JPG report — full run details (production #125999)

### TC-TCM-370: JPG export includes total/pass/fail/blocked counts
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Open a test run with a mix of results.
2. Download its JPG report.
3. Open the downloaded image.

**Expected Result:**
- The JPG shows the pass/fail graphic **plus** Total test cases and Pass/Fail/Blocked counts, matching the run's real data.

---

### TC-TCM-371: JPG export includes assignee, environment, execution date and run metadata
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** Run has an assignee, an environment, and at least one executed result (so an execution date exists).
**Steps:**
1. Download the same run's JPG report.
2. Inspect it for assignee name(s), environment details, and execution date (and any other run metadata present, e.g. run type/build/duration).

**Expected Result:**
- All of assignee, environment, and execution date appear correctly on the image, making it a self-contained snapshot shareable without logging into Redmine.

---

## Step / Expected Result multi-line support (production #127458)

### TC-TCM-372: Add Step form accepts and displays multi-line text
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a test case, use the **Add Step** form.
2. Enter a Step and an Expected Result each containing multiple lines (press Enter/newline mid-text).
3. Save.
4. Reload and view the saved step.

**Expected Result:**
- The multi-line input is accepted (no longer collapsed to single line), saved, and the line breaks are visibly preserved on display.

---

### TC-TCM-373: Inline edit on the issue accepts and displays multi-line text
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA
**Priority:** Medium
**Steps:**
1. On an existing test case's issue page, inline-edit an existing Step or Expected Result.
2. Enter multi-line text with line breaks.
3. Save; reload.

**Expected Result:**
- Line breaks entered via inline edit are accepted and persist/display correctly, consistent with TC-TCM-372.

---

### TC-TCM-374: New/Edit Issue form's "+ Add Step" accepts and displays multi-line text
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a new Testcase issue via the New Issue form (or edit an existing one via Edit Issue).
2. Use its **+ Add Step** button to add a step with multi-line Step/Expected Result text.
3. Save.

**Expected Result:**
- Multi-line text entered through this third entry point is accepted and saved/displayed with line breaks intact, same as the other two entry points.

---

### TC-TCM-375: 40,000-character limit still holds with multi-line text
> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**User Role:** QA
**Priority:** Low
**Steps:**
1. Enter a Step or Expected Result containing multiple line breaks whose total character count (including newline characters) is at or just under 40,000.
2. Save.

**Expected Result:**
- Saves successfully at/under the limit — confirms the existing 40,000-character cap still behaves correctly now that the field is multi-line, per the production ticket's own "quick check" requirement.

---

## Notes

- Source production tickets: #125998, #125999 (Testcase Management plugin Release 7.5.0, target version id=2076,
  both status Done / assigned Sheetal Sharma), #127458 (Step/Expected Result line breaks, status In QA, assigned
  Sheetal Sharma).
- These 9 TCs (TC-TCM-367–375) are all marked 🟢 HAPPY-FLOW and have been added to
  `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`'s list — per-engine cross-DB execution is the only pass planned
  for them right now, not a full separate QA cycle, since the underlying features were already QA'd on
  production by another tester.
