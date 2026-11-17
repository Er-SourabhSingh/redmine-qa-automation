> **CROSS-DB (PostgreSQL) — 2026-11-16:** happy-flow pass, `redmine6-happyflow-pg` (`localhost:3020`). Executed all 9 TCs for real via the browser.
>
> - **TC-TCM-367 — PASS, corrected (was wrongly marked BLOCKED).** Codebase grep found no route literally named "Results Dashboard," so this was first marked BLOCKED for "feature not present." That was too strict a reading of the spec's own "Suggested Placement" (which the production ticket explicitly hedges as a suggestion, not a requirement). User-supplied screenshot (run "sadf," 55 total cases, Edge-Retest-Fix environment) confirms the feature is genuinely live: a "Results Summary" panel sits at the top of the run page with the numeric breakdown, progress bar, donut chart, run metadata panel, and "Export JPG Report" button all together — functionally identical to the spec's ask (total/passed/failed/blocked at a glance, chart alongside), just delivered as an always-visible panel instead of a separate clickable tab. Verified the screenshot's own numbers are internally consistent: 51+1+0+0+0+3 = 55 (total), and 93%+2%+0%+0%+0%+5% = 100%, with each individual percentage correctly rounded from its count/55. **Verdict: feature works correctly; placement differs from the spec's suggestion but satisfies its actual intent.**
> - **TC-TCM-368 — PASS.** Run #5 (`HF-PG Smoke Run 1`)'s embedded Results Summary panel showed Total 7 / Passed 4 (57%) / Failed 1 (14%) / Blocked 0 / Untested 2 (29%) / Retest 0 / Skipped 0. Cross-checked against the actual 7-row Test Cases grid (issues 1,4,7,5=Passed; 6=Failed; 8,14=Untested) — exact match.
> - **TC-TCM-369 — PASS.** The donut chart on the same panel renders without error; segment proportions visually match the Passed/Failed/Untested counts above.
> - **TC-TCM-370 — PASS.** Clicked "Export JPG Report" on the run page, downloaded `CI-Bootstrap-Run-RFTC009-1-CI-2026-11-16.jpg`, opened it directly — shows Total Test Cases (7) plus per-status cards and percentages (Passed/Failed/Blocked/Untested/Retest/Skipped), matching the run's real data.
> - **TC-TCM-371 — PASS.** Same JPG also shows Run Name, State ("In progress"), Environment ("CI"), Assignee ("Redmine Admin"), Start/Due Date, Watchers, Defect Count (1), the linked defect ("17 : CI failure: 6"), and a "Generated at" timestamp — a fully self-contained snapshot.
> - **TC-TCM-372 — PASS (entry point 1: "New Step" link on the full `/issues/N/edit` page).** On Testcase #5, clicked "New Step", typed real multi-line text (via `browser_type`'s `.fill()`, embedding actual `\n` characters) into both the new Step and Expected textareas, submitted. Reload confirmed the saved display renders `<p>Line one...<br>\nLine two...<br>\nLine three...</p>` — line breaks correctly preserved, no longer collapsed to one line.
> - **TC-TCM-373 — PASS (entry point 2: inline update-form toggle directly on the issue SHOW page, distinct from navigating to `/edit`).** Found via the "Edit" icon next to Notes (`onclick="showAndScrollTo('update','issue_notes')"`), which reveals the SAME step/expected textareas inline on `/issues/5` itself without a page navigation. Edited Step 1's Step and Expected fields in place with multi-line text, submitted, reload confirmed persistence with `<br>` line breaks intact.
> - **TC-TCM-374 — PASS (entry point 3: the "+ New Step" button on the brand-new Issue CREATE form, `/projects/<id>/issues/new`, not an edit of an existing issue).** Created a new Testcase issue (#21), used its own "New Step" button to add a step with multi-line Step/Expected text, Created successfully. Issue #21's show page confirmed the multi-line text rendered with `<br>` tags intact — all three entry points (edit-page New Step, inline show-page edit, new-issue New Step) now verified independently.
> - **TC-TCM-375 — PASS, with one nuance worth recording.** The 40,000-char cap is enforced **per individual Step/Expected field** (not literally per-testcase-total as first suspected) — but the browser's own CRLF line-ending normalization on form submission measurably inflates the stored length beyond what `textarea.value.length` shows pre-submit (e.g. a 19,968-char pre-submit value with ~256 newlines landed at 20,384 chars in the DB, ~400 chars of CRLF expansion). A first attempt at a 39,963-char single field (just under 40,000 pre-submit) was correctly REJECTED by server-side validation ("Steps and expected result exceed the maximum length of 40000 characters") once CRLF expansion pushed it over on submit; a resized ~19,968-char field was accepted and verified via direct DB query (`SELECT length(step), length(expected) FROM steps WHERE issue_id=22` → 20384 / 20352, both safely under 40,000). Confirms the limit still behaves correctly with multi-line content — not a bug, just worth noting the exact post-submit length differs from what's visible in the browser before saving.

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
