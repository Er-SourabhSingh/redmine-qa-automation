# Test Cases — Redmineflux Testcase Management — Reports, Emailing & Scheduling

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 9 and the vendor KB "Reporting & Analytics" section.
>
> **Status: authored 2026-09-14, fully regressed 2026-10-23.** TC-TCM-098 – 526 carry live evidence from the
> 2026-09-14 session (BUG-TCM-005). Every TC in this suite (TC-TCM-078–111, 274, 316–317) was regressed against
> build HEAD `d4f960b` on 2026-10-23 (report creation + all 3 download formats + HTML/PDF emailing + scheduling +
> full CRUD, for all 8 report types) — see inline "RETESTED 2026-10-23" notes and the Evidence Map below. This
> suite is now the plugin's most heavily-populated single source of 2026-10-23 defects: 7 open bugs
> (BUG-TCM-105–111, including the Critical BUG-TCM-111) found this pass, plus BUG-TCM-075 confirmed fixed.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Reach reports through the project's **TestCases** tab → **Reports** sidebar icon. Verify emailed output in a real,
checkable mailbox (local Docker mail server, Roundcube at `127.0.0.1:8081`) — never infer delivery from the UI.

**Preconditions:** ≥1 run with executed results; ≥1 requirement with linked cases; ≥1 defect;
**Redis + Sidekiq running**; for PDF attachment cases, **Node.js + Puppeteer + Chromium installed**
(Installation step 6) — otherwise TC-TCM-100/525 fail for environment reasons, not product reasons.

---

## Functional Cases — Report creation and viewing

---

### TC-TCM-078: Create a Testcase Summary report

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Reports** → **+ New report** → **Select Type** = `Testcase Summary`.
2. Enter a **Name**; leave Advanced Options at "Include all test run"; **Right now**; **Create**.
3. Open the created report.

**Expected Result:**
- The report is listed and opens, showing testcase totals by status consistent with the run grids.

---

### TC-TCM-079: Create a Defect Summary report

**User Role:** QA
**Priority:** High
**Steps:**
1. As above with **Select Type** = `Defect Summary`; open it.

**Expected Result:**
- Defects raised from executions are summarised; counts match the defects actually linked to results.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, report #137, defect #3642, BUG-TCM-097's run #83):**
**FAIL — new bug, filed as BUG-TCM-105 (High).** When a defect is linked to more than one test case within the
same environment, the report shows only 1 row for that defect in that environment (losing the extra linked
testcase entirely) and that row's "Testcase ID" column always shows the **first-ever-linked** testcase (24)
instead of the one actually relevant to the environment section being rendered — confirmed wrong for the "test1"
environment section, which should show 23, not 24. Reproduced identically across all 3 download formats
(HTML/PDF/Excel). Root cause confirmed in `app/controllers/testcase_reports_controller.rb`'s Excel-export code:
`IssueRelation.where(relation_type: 'defect', issue_to_id: issue.id).first` is not scoped by run or environment,
so it always returns the same first-created relation regardless of which environment table is being rendered. See
`bugs/open/BUG-TCM-105.md`.
**Separately, BUG-TCM-097 (duplicate RunIssue rows) propagates into this report type too** (not a new bug —
logged as an extension of BUG-TCM-097, not filed separately): the same inflated-count pattern already tracked on
the Run page and issue detail page also inflates Testcase Summary (#136), Activity Summary (#138), Tester
Scorecard (#139, "33 testcases" instead of the real count), and Requirement Coverage (#140, 5+ identical repeated
rows for the same requirement/testcase pair).

---

### TC-TCM-080: Create an Activity Summary report with a date range

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Select Type** = `Activity Summary`; set **Activity Date Range** start and end; **Create**; open it.

**Expected Result:**
- The report is created and covers only activity within the supplied range.

---

### TC-TCM-081: Activity Summary requires a date range

**User Role:** QA
**Priority:** Low
**Steps:**
1. **Select Type** = `Activity Summary`, leave **Activity Date Range** empty, **Create**.

**Expected Result:**
- Creation is refused with visible errors "Start date cannot be blank" and "End date cannot be blank"; no report
  is created. **This is intended behaviour, not a defect.**
- Note for automation: the date fields only render after the report-type change event fires.

---

### TC-TCM-082: Create a Tester Scorecard report

**User Role:** QA
**Priority:** Medium
**Precondition:** Results recorded by ≥2 different users.

**Steps:**
1. **Select Type** = `Tester Scorecard`; **Create**; open it.

**Expected Result:**
- Execution counts are broken down per tester and match the per-user history.

---

### TC-TCM-083: Create a Requirement Coverage report

**User Role:** QA
**Priority:** High
**Precondition:** ≥1 requirement with linked test cases.

**Steps:**
1. **Select Type** = `Requirement Coverage`; choose a **Requirement**; **Create**; open it.

**Expected Result:**
- Coverage of that requirement is shown — tested vs untested linked cases.

---

### TC-TCM-084: Requirement Coverage requires a requirement

**User Role:** QA
**Priority:** Low
**Steps:**
1. **Select Type** = `Requirement Coverage`, leave **Select Requirement** at "Please select", **Create**.

**Expected Result:**
- Creation is refused with a validation message; no report created.

---

### TC-TCM-085: Create an Overdue Run Summary report

**User Role:** QA
**Priority:** Medium
**Precondition:** ≥1 run past its End Date with unexecuted cases.

**Steps:**
1. **Select Type** = `Overdue Run Summary`; **Create**; open it.

**Expected Result:**
- The overdue run appears; runs that are not overdue do not.

---

### TC-TCM-316: Create a Slow Tests report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Select Type** = `Slow Tests`; **Create**; open it.

**Expected Result:**
- Test cases are ranked by execution-time percentile (p95) against the configured slow-test threshold; cases with
  no recorded timing data are reported separately as "No timing data yet", not silently omitted.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`):** PASS on live page and HTML download — report #142
correctly showed "Slow-test threshold: 5.0 s" and "No timing data yet: 28" (this instance records no per-step
timing, so every case falls in the no-data bucket — expected for this environment). Excel download also correct
(same threshold/no-data text, plus the full `Rank/Test Case/Samples/Avg/Max/p95/Flag` column header row). **PDF
download is broken: see BUG-TCM-107.**

---

### TC-TCM-317: Create a Most Failed Tests report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Select Type** = `Most Failed Tests`; **Create**; open it.

**Expected Result:**
- Test cases are ranked by failure count/rate across executed runs; the "Failing Runs" list stays legible (no
  column overflow) in every download format.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`):** PASS across all three download formats (HTML/PDF/Excel,
report #143) — content matched the live page exactly, and the "Failing Runs" column spillover previously tracked
under BUG-TCM-076/077/081 does not reproduce on this build (consistent with fix commit `a48b2a4`, 2026-10-21).

---

### TC-TCM-086: Report name is mandatory

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create any report type leaving **Name** empty; **Create**.

**Expected Result:**
- Refused with a validation message on the Name field; no report created.

---

### TC-TCM-087: Restrict a report to specific test runs

**User Role:** QA
**Priority:** Medium
**Precondition:** ≥2 runs with different results.

**Steps:**
1. Create a report choosing **Only the following test runs** and ticking exactly one run.
2. Open the report.

**Expected Result:**
- Only the selected run's data is included; the other run's results are absent.

---

### TC-TCM-088: Edit a report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Edit an existing report (pencil icon): change its **Name** and **Description**; save; reload the list.

**Expected Result:**
- The new name and description persist in the list and on the report detail.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`) — PASS.** Edited report #136's Name (added `-EDITED`
suffix) and Description (real rich-text content via the Quill editor); both persisted correctly — confirmed via
direct DB read (`name`/`description` columns both show the new values) and on the report's own detail page and
the list view.

---

### TC-TCM-089: Delete a report

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a report (bin icon) and confirm; reload the list.

**Expected Result:**
- The report is removed from the list.

**RETESTED 2026-10-23 — PASS.** Deleted report #136 (the one just edited in TC-TCM-088) via the bin icon +
confirmation; correctly removed from the list and confirmed `nil` via a direct DB lookup afterward.

---

### TC-TCM-090: Cancelling report deletion does not delete

**User Role:** Manager
**Priority:** Low
**Steps:**
1. Start deletion, cancel at the prompt, reload.

**Expected Result:**
- The report is still listed.

**RETESTED 2026-10-23 — PASS.** Opened the delete confirmation for report #136, clicked Cancel instead of
Delete; the report remained listed, unaffected, confirmed by reloading the list.

---

### TC-TCM-091: Report reflects data added after creation

**User Role:** QA
**Priority:** High
**Steps:**
1. Open a Testcase Summary report and note the totals.
2. Record additional results in a covered run.
3. Reopen the report.

**Expected Result:**
- Behaviour is consistent and documented — either the report is a live view that now includes the new results, or
  a snapshot fixed at creation time. Record which; an inconsistent partial refresh is a defect.

---

### TC-TCM-092: Download report as HTML

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a report → download menu → **Download HTML**.
2. Open the downloaded file.

**Expected Result:**
- A file downloads and opens showing the report content, including its tables.

**Status: EXECUTED 2026-10-20 — PASS.** Verified across all 6 report types (Testcase Summary, Defect Summary,
Activity Summary, Tester Scorecard, Requirement Coverage, Overdue Run Summary) against a real run (`RFTC-074
Reports Regression Run`, environment `Win + Chrome`). All produced correctly-populated HTML matching the live
page's data, charts, and the `Run Name (Environment)` heading.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, run #83):** PASS across all **8** report types (the
original pass only covered 6 — Slow Tests and Most Failed Tests are new since then, see TC-TCM-316/317). HTML
downloads for reports #136–143 all grep-matched their live-page figures exactly, including the BUG-TCM-097
duplicate-row inflation propagating identically into both the live page and the HTML download (expected —
confirms the export reads the same inflated dataset, not a separate export-only bug). One escaping check added
this pass: a testcase titled `<img src=x onerror=alert('export-xss')> export check` renders fully HTML-escaped
(`&lt;img ...`) in both the live page and the downloaded HTML — no stored-XSS risk in the report HTML export.

---

### TC-TCM-093: Download report as PDF (in-app, client-side)

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a report → download menu → **Download PDF**.
2. Open the downloaded file.

**Expected Result:**
- A valid PDF downloads and renders the report.
- **Note:** this path renders in the browser (html2pdf.js/jsPDF) and does **not** depend on Node/Puppeteer, so it
  is expected to work even where emailed PDF fails (BUG-TCM-005).

**Status: EXECUTED 2026-10-20 — PASS for table data/charts, FAIL for the Run Name/Environment heading — filed as
BUG-TCM-075 (Medium).** The PDF downloads cleanly and its table data/charts match the live page for all 6 report
types. However, text-extracting the PDF (`pdftotext -layout`) shows the `Run Name (Environment)` heading that the
live page and HTML export both render is **dropped** in the PDF: completely missing for Testcase Summary,
Activity Summary and Overdue Run Summary (the latter also losing its "Overdue by N day(s)" text); only the
`(Environment)` suffix is dropped for Defect Summary. Tester Scorecard is unaffected (Run Name/Environment are
separate table columns there, not this heading). See the dedicated assertion in TC-TCM-274 and
`bugs/open/BUG-TCM-075.md` for full per-report-type evidence.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, run #83, reports #136/#138/#140/#141 re-checked via
`pdftotext -layout`):** BUG-TCM-075's heading/environment-suffix drop is **now FIXED** for Testcase Summary,
Activity Summary, Defect Summary and Overdue Run Summary — headings and "Overdue by N days" text all present and
correct, consistent with fix commit `a48b2a4` (2026-10-21, "Fix a PDF-email regression and three residual pieces
from earlier fixes"). Moving BUG-TCM-075 to `bugs/closed/`.
**New PDF-only defect found this pass, filed as BUG-TCM-107 (Medium):** the Slow Tests report's PDF download
(#142) drops its entire body below the report-name heading — no column headers, no "Slow-test threshold" line, no
"No timing data yet: N" text — while the same report's HTML and Excel downloads both render that content
correctly. See `bugs/open/BUG-TCM-107.md`.
**Ambiguous, not filed:** the Overdue Run Summary PDF's row/column text, extracted via `pdftotext -layout`, looks
column-misaligned on a 29-row table; plain `pdftotext` (no `-layout`) shows the same data cleanly in stream order,
so this is more likely a text-extraction heuristic limitation than a real rendering defect. No PDF-to-image tool
(`pdftoppm` etc.) was available this session to visually confirm either way — flagged for a future session with
one available, not filed as a bug.

---

### TC-TCM-094: Download report as Excel

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a report → download menu → **Download Excel**; open the file.

**Expected Result:**
- A valid `.xlsx` downloads and opens with the report's tabular data intact.

**Status: EXECUTED 2026-10-20 — PASS, including the Run Name/Environment heading.** Verified across all 6 report
types by unzipping each `.xlsx` and reading its raw `xl/worksheets/sheet1.xml` (these exports use inline strings,
no `sharedStrings.xml`) — every report's heading/Run/Environment data is present and correct, including the
`Overdue by N days` text for Overdue Run Summary that the PDF (TC-TCM-093 / BUG-TCM-075) drops. Excel is **not**
affected by BUG-TCM-075 at all. One pre-existing cosmetic naming inconsistency noted (not a defect): Requirement
Coverage's Excel downloads as `requirement_coverage.xlsx` instead of the `report_<id>.xlsx` pattern every other
report type uses.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, run #83, all 8 report types, reports #136–143):**
Excel content verified by unzipping each `.xlsx` and reading `xl/worksheets/sheet1.xml` directly.
- Testcase Summary (#136), Defect Summary (#137, see BUG-TCM-105 for its own data-accuracy bug), Tester Scorecard
  (#139), Overdue Run Summary (#141), Slow Tests (#142), Most Failed Tests (#143): all PASS — data matches the
  live page exactly.
- **Requirement Coverage (#140): FAIL — new bug, filed as BUG-TCM-106 (High).** The Excel download's entire sheet
  body is replaced with `Unknown Report Type` / `The report type 'requirement' is not recognized.` — a total data
  loss for this report type's Excel export, while its HTML and PDF exports both render the real coverage table
  correctly. See `bugs/open/BUG-TCM-106.md`.
- **Activity Summary (#138): a real but lower-severity content gap, noted but not filed as a separate bug** — the
  Excel export carries the full per-run issue tables (matches HTML/live for every row), but drops the "Overall
  Pass/Fail %" and "Requirement Coverage %" summary blocks that both HTML and the live page show above those
  tables. Recorded here for visibility in case a future session wants to raise it formally; not blocking because
  the underlying row data is otherwise complete and correct.

---

### TC-TCM-274: PDF export shows the same Run Name (Environment) heading as the live page and HTML export

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a run with a non-blank Environment, with at least one executed test case result.
2. Create each of the 6 report types against that run.
3. For each report type that shows a `<h3 id="report_run_name">` heading on its live page, download the PDF and
   check the same heading (run name + environment, and for Overdue Run Summary the "Overdue by N day(s)" text) is
   present.

**Expected Result:**
- The PDF shows the identical Run Name (Environment) heading that the live page and HTML export both show, for
  every report type that has one.

**Status: EXECUTED 2026-10-20 — FAIL, filed as BUG-TCM-075 (Medium).** Testcase Summary, Activity Summary and
Overdue Run Summary PDFs drop the heading entirely; Defect Summary's PDF keeps the run name but drops the
`(Environment)` suffix. Tester Scorecard and Requirement Coverage are not applicable (different layout / no such
heading). Underlying data is correct — this is a PDF-rendering-pipeline-specific gap, not a data defect; HTML and
Excel exports of the same reports are both unaffected (TC-TCM-092, TC-TCM-094). See `bugs/open/BUG-TCM-075.md`.

---

### TC-TCM-095: Report with no data renders cleanly

**User Role:** QA
**Priority:** Low
**Precondition:** A project with the module enabled but no runs or results.

**Steps:**
1. Create each report type in that empty project and open each.

**Expected Result:**
- Each renders an explicit empty state. No blank page, no error, no `NaN`/`undefined` in figures.

---

### TC-TCM-096: Report list paginates and sorts

**User Role:** QA
**Priority:** Low
**Precondition:** More reports than fit on one page.

**Steps:**
1. Page through the report list and sort by the available columns.

**Expected Result:**
- Counts are correct, no report is duplicated or skipped, sort order is applied consistently.

---

### TC-TCM-097: Report respects project scope

**User Role:** QA
**Priority:** High
**Steps:**
1. Create reports in Project A and Project B; open Project A's report list.

**Expected Result:**
- Only Project A's reports are listed, and Project A's report content contains no Project B data.

---

## Functional Cases — Emailing

---

### TC-TCM-098: Email a report as an HTML attachment

**User Role:** QA
**Priority:** High
**Precondition:** Sidekiq running; a real checkable mailbox.

**Steps:**
1. Create a report, tick **Notify me by email**, enter the mailbox address.
2. Select **Email the report as HTML attachment**; **Right now**; **Create**.
3. Open the mailbox.

**Expected Result:**
- An email "Testcase Report: `<name>`" arrives as `multipart/mixed` carrying a `<name>.html` attachment whose
  content is the rendered report.
- **CONFIRMED PASS 2026-09-14** on `localhost:3012` across all six report types (14–25 KB attachments).

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, Mailpit `localhost:8025`, mailbox `qa.limited@test.local`,
run #83/project `rftc-016-ci-qa`):** emailed all **8** report types as HTML — Testcase Summary, Defect Summary,
Activity Summary, Requirement Coverage, Overdue Run Summary, Slow Tests, Most Failed Tests all arrived correctly
(`multipart/mixed`, 1 attachment each, confirmed via the Mailpit API). **Tester Scorecard under "Include all test
run" FAILED — no email ever arrived**, filed as **BUG-TCM-108 (High)**: the background mailer job crashes with the
same `NoMethodError` that crashes the report's own `show` page under that scope (see TC-TCM-274a below / bug file
for full root cause). Retested Tester Scorecard scoped to a single run instead — email arrived correctly. Separate
**cosmetic bug found in all 8 emails' body text**, filed as **BUG-TCM-109 (Low)**: the "Report Type:" line reads
"Default Text" instead of the real type name for Slow Tests and Most Failed Tests specifically (root-caused to a
`report_type_texts` lookup hash in `run_mailer.rb` never updated for these two newer types) — the other 6 types'
emails show the correct type name.

**REGRESSION — 2026-10-27 (post BUG-TCM-108/111 fixes, triggered by BUG-TCM-111's Critical severity per
`SENIOR_QA_STANDARDS.md` §26).** Live-verified against `localhost:3000`, plugin 7.2.0, project `rftc-016-ci-qa`.
**BUG-TCM-108's crash — CONFIRMED FIXED on the UI side.** Created `REG-TC108-TesterScorecard-AllRuns-20261027`
(report id 177) as Tester Scorecard, "Include all test run" scope — the exact previously-crashing configuration
— and opened it: no 500, no `NoMethodError`, a real per-assignee scorecard table rendered (Completion
Rate/Pass Rate/Efficiency Score columns, 3 assignees). This confirms the underlying data-access bug that crashed
both the page and the mailer job is resolved. **Emailing half — CONFIRMED FIXED, same day (second pass).**
Created `REG-TC108-Email-AllRuns-20261027` (report id 180) as Tester Scorecard, "Include all test run", "Right
now", "Notify me by email" to `admin@example.net` — Mailpit confirmed delivery within seconds: "Testcase Report:
REG-TC108-Email-AllRuns-20261027", 1 attachment (HTML, since PDF generation isn't available in this environment —
a separate, unrelated Puppeteer/Node gap, not this bug). The email that previously could never arrive for this
exact scope now genuinely does. Cleanup: deleted reports 177, 180 (and a throwaway Testcase-Summary-typed report,
id 176, created while getting the report-type `<select>`'s correct option value)
after confirming.

---

### TC-TCM-099: Emailed HTML attachment content matches the in-app report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open the attachment from TC-TCM-098 and compare against the in-app report.

**Expected Result:**
- Same figures, same tables, same report type heading.

---

### TC-TCM-100: Email a report as a PDF attachment

**User Role:** QA
**Priority:** High
**Precondition:** Sidekiq running **and Node.js + Puppeteer + Chromium installed** (Installation step 6).

**Steps:**
1. As TC-TCM-098 but selecting **Email the report as PDF attachment**.
2. Open the mailbox.

**Expected Result:**
- An email arrives as `multipart/mixed` carrying a valid `<name>.pdf` attachment that opens and renders the report.
- **CONFIRMED PASS 2026-09-14** on `localhost:3012` after completing Installation step 6 — 74,652 B
  `multipart/mixed`, attachment `RETEST-BUG005-PDF-AfterInstall.pdf`, 53,446 bytes, `%PDF-1.4` header, `%%EOF`
  trailer, **9 of 9 compressed streams decompress cleanly**. Mail job duration 6,070 ms (Chromium actually
  rendering) vs ~200 ms when it was silently failing.
- **Retest vehicle for BUG-TCM-005** (prod #120588), now **closed as fixed**. Earlier result: on an instance where
  step 6 was **not** completed, the email arrived as bare `text/html` with no attachment. That was an incomplete
  installation, not a code defect — hence this TC's precondition.
- Note the precondition is load-bearing: run this on a server without Node.js/Puppeteer and it will fail for
  environment reasons. Check `node -v` and the **Sidekiq worker's** `PUPPETEER_EXECUTABLE_PATH` first.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, Mailpit, run #83):** emailed all 8 report types as PDF —
**7 arrived correctly** (Testcase Summary spot-checked in full: downloaded the real attachment via the Mailpit
API, confirmed `PDF document, version 1.4, 8 page(s)`, valid `%PDF-1.4` header and `%%EOF` trailer, 1,399,933
bytes, `pdftotext` extraction showing correct report data). Tester Scorecard under "Include all test run" again
failed to send (BUG-TCM-108, same as the HTML retest above); scoped to run 83 only instead, its PDF email
delivered correctly. Same BUG-TCM-109 "Report Type: Default Text" cosmetic defect reproduces in the PDF emails'
body text for Slow Tests/Most Failed Tests too (format-independent, as expected since it's the email body, not
the attachment, that's affected).

---

### TC-TCM-101: PDF failure must not produce a misleading email

**User Role:** QA / Admin
**Priority:** High
**Precondition:** Node.js + Puppeteer + Chromium **installed and working** (verify TC-TCM-100 passes first), plus
**shell access** to restart Sidekiq. This TC cannot be executed from the browser alone.

**Steps:**
1. Verify TC-TCM-100 passes — a normal PDF email delivers a valid attachment. This rules out the environment cause.
2. Break PDF generation deliberately: restart Sidekiq with
   `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome GROVER_NO_SANDBOX=true`.
3. Email a report as PDF.
4. Observe the UI after submitting, then read the delivered email — `Content-Type`, MIME parts, body text.
5. Repeat with a **second** failure cause (induced Puppeteer timeout or OOM) to confirm the behaviour is not
   specific to a missing binary.
6. **Check the HTML format for the same defect** — email a report as HTML with HTML generation made to fail. The
   HTML branch of `send_report` has **no `begin`/`rescue`**, so the expected behaviour is that the Sidekiq job
   raises and **no email is sent at all**. Confirm that, rather than assuming it from the code.

**Expected Result:**
- Either no email is sent and the failure is surfaced in the UI, or an email arrives that **plainly states the PDF
  could not be generated**.
- In no failure mode does a delivered email claim an attachment it does not carry.
- An HTML fallback is acceptable provided the body says so.
- **CONFIRMED FAIL 2026-09-14 — BUG-TCM-006:** with `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`, the delivered
  email was 1,767 B bare `text/html` with **no attachment MIME part**, body still reading *"Please find the
  attached Testcase Report:"*, and nothing surfaced in the UI. Retest vehicle for that bug.
- **CONFIRMED PASS 2026-09-30** on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0, git HEAD `97449b9` — includes
  fix commits `dee611e`/`58c68d2`/`9e82662`). Step 1 baseline: genuine 1,001,291 B PDF, valid `%PDF-1.4`/`%%EOF`,
  32/32 streams inflate cleanly (report #7). Step 2/5 — **two independent failure causes**, both correctly falling
  back: (a) `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome` → exact documented error reproduced
  (`Tried to find the browser at the configured path...`), delivered email carries a real `.html` attachment and a
  red warning banner *"The PDF version of this report could not be generated, so an HTML version is attached
  instead."* (report #8); (b) a missing `--no-sandbox` flag (`GROVER_NO_SANDBOX` unset) → Chromium's
  `No usable sandbox!` error, same correct fallback+warning observed incidentally before cause (a) was deliberately
  induced. Spot-checked a second report type (Defect Summary, report #9) under cause (a) — identical correct
  behaviour. HTML-format regression check (report #10) — unaffected, no warning, real `.html` attachment, normal
  body. **Acceptance criterion met: in no observed failure mode does a delivered email claim an attachment it does
  not carry.**
- **Step 6 (HTML fallback itself failing) is STILL NOT EXECUTED.** This is the fallback's own failure mode — HTML
  generation failing *while* PDF has already failed — and remains an honest gap, not assumed safe.

> **Do not confuse this with TC-TCM-100 / BUG-TCM-005.** That pair asserts the PDF is generated and attached on a
> working server (closed, fixed by completing Installation step 6). This TC asserts a *failed* PDF must not produce
> a misleading email — a separate defect that only appears once PDF generation is deliberately broken. Running this
> TC on a server that has no Node.js at all tests neither assertion cleanly.

---

### TC-TCM-102: Report type does not affect emailing behaviour

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Email all six report types in both HTML and PDF to the same mailbox.
2. Compare the delivered messages.

**Expected Result:**
- Behaviour is identical across types for a given format — the format decides the outcome, not the type.
- **CONFIRMED 2026-09-14:** HTML succeeded for all six; PDF failed for all six pre-install (BUG-TCM-005, since
  fixed by completing Installation step 6). All six share the single `send_report` method, so the format branch —
  not the report type — decides the outcome.

**RETESTED 2026-10-23, now 8 report types — assumption partially FALSIFIED.** Report type now *does* affect
emailing behaviour in two ways this TC's original premise didn't anticipate: (1) **Tester Scorecard under
"Include all test run" cannot be emailed at all** regardless of format (BUG-TCM-108) — a report-type ×
Advanced-Options-scope interaction, not a format difference; (2) the email body's "Report Type:" label is wrong
specifically for Slow Tests/Most Failed Tests, in both formats (BUG-TCM-109). The *attachment itself* still
behaves consistently per-format for every type that can be created at all — that narrower claim holds — but
"report type never affects emailing" as originally stated is no longer accurate. See BUG-TCM-108/109.

---

### TC-TCM-103: Multiple recipients, one address per line

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Enter two different mailbox addresses on separate lines; email the report as HTML.
2. Check both mailboxes.

**Expected Result:**
- Both recipients receive the email with the attachment. Neither address is dropped or concatenated.

---

### TC-TCM-104: Invalid email address is rejected or reported

**User Role:** QA
**Priority:** Low
**Steps:**
1. Enter a malformed address (e.g. `not-an-address`) and create the report.

**Expected Result:**
- Either validation refuses it at creation, or the failure is surfaced afterwards.
- Silently accepting and never delivering, with no feedback anywhere, is a defect.

---

### TC-TCM-105: Emailing without "Notify me by email" sends nothing

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a report leaving **Notify me by email** unticked; check the mailbox.

**Expected Result:**
- The report is created; no email is sent.

---

### TC-TCM-106: Report email with Sidekiq stopped

**User Role:** Admin / QA
**Priority:** Medium
**Steps:**
1. Stop Sidekiq; create a report with email enabled; check the mailbox and the report list.

**Expected Result:**
- The report is created but **no email is sent in either format** while Sidekiq is down.
- Expected environment behaviour — recorded so "no email arrived" is not misfiled as a product bug. Restart
  Sidekiq afterwards.

---

## Functional Cases — Scheduling

---

### TC-TCM-107: Schedule a daily report

**User Role:** QA
**Priority:** High
**Steps:**
1. Create a report choosing **Schedule this report**, **Every day**, at a time a few minutes ahead (UTC).
2. Check the **Scheduled Reports** section, then the mailbox after the scheduled time.

**Expected Result:**
- The schedule is listed with the correct interval and time; the email arrives at that time.

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`):** PASS for the listing half — scheduled for 11:20 UTC,
`Scheduled Reports` correctly showed "Daily at 11:20:00 / Daily". **FAIL for delivery — filed as BUG-TCM-111
(Critical)**: the email never arrived, even 6+ minutes past the scheduled time (confirmed via a Mailpit API
search returning 0 results). Root-caused to Sidekiq's own core scheduled-job poller thread crashing at every
boot (`ArgumentError` in `connection_pool`, a version mismatch baked into this build's `Gemfile.lock`) —
independently confirmed by the plugin's own `ReminderWorker` cron job (meant to run every minute) not having run
once in over 2 hours. See `bugs/open/BUG-TCM-111.md` for full evidence; this affects every scheduled report,
regardless of interval or format, project-wide.

---

### TC-TCM-108: Schedule a weekly report on a chosen weekday

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a scheduled report with **Every week** and a specific weekday; inspect Scheduled Reports.

**Expected Result:**
- The schedule records the correct weekday and time and is displayed accurately.

**RETESTED 2026-10-23:** PASS for listing — scheduled "Every week" / Wednesday / 14:30; `Scheduled Reports`
correctly showed "Weekly on Wednesday at 14:30:00 / Weekly". Delivery itself not separately waited for (next
Wednesday is days away) but affected by the same BUG-TCM-111 poller crash as TC-TCM-107 — there is no reason to
expect this interval to behave differently; the crash is in the shared scheduled-job poller, not interval-specific
logic.

---

### TC-TCM-109: Schedule a monthly report on a chosen day

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a scheduled report with **Every month** and a day-of-month; inspect Scheduled Reports.

**Expected Result:**
- The schedule records the correct day and time.
- Check behaviour for day 29–31 in short months and record it.

**RETESTED 2026-10-23:** PASS for listing — scheduled "Every month" / day 29 / 09:00; `Scheduled Reports`
correctly showed "Monthly on the 29th at 09:00:00 / Monthly", accepted without error (day 29 exists in every
month, so this doesn't exercise the short-month edge case; day 30/31 in February would be the sharper test —
deferred, not yet executed). Same BUG-TCM-111 delivery-poller crash applies here too.

---

### TC-TCM-110: Cancel a scheduled report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Cancel the scheduling of an existing scheduled report.
2. Check the Scheduled Reports section and the mailbox after the previously scheduled time.

**Expected Result:**
- The schedule is removed from the list and no further emails arrive.

**RETESTED 2026-10-23 — FAIL, filed as BUG-TCM-110 (High).** Clicking the Scheduled Reports section's own Delete
icon and confirming always ends in a full 404 page, for every user including Administrator — the schedule is
never removed. Server log shows the request correctly reaches `TestcaseReportsController#cancel_scheduling` as a
real DELETE, but `rftc_authorize_report_schedule` halts the chain with a 404, root-caused to that filter looking
up the project via `Project.find_by(id: params[:project_id])` — the wrong lookup for a string-identifier project
— instead of falling back to `identifier:` like its sibling method 3 lines away in the same file correctly does.
Reproduced twice. No workaround exists (a schedule-only report has no row in the main Reports table to delete
instead). See `bugs/open/BUG-TCM-110.md`.

**REGRESSION — 2026-10-27 (post BUG-TCM-110 fix) — CONFIRMED FIXED LIVE, same day (second pass).** Found the
Scheduled Reports section's real Cancel action: it's a **separate table below the main Reports list** on
`/projects/<id>/testcase_reports` (own heading "Scheduled Reports", own Delete icon per row calling
`confirmDeleteScheduleReport(id, name)`), distinct from the main table's Edit/Delete icons — not something the
2026-10-23 original evidence's methodology surfaced either, since it called the route directly rather than using
this UI. Created a scheduled report (`REG-TC110-CancelUI-20261027`, `ScheduledReport` id 7), clicked its real
Cancel/Delete icon in that section, confirmed the "Are you sure?" modal, and submitted — **redirected cleanly
back to the reports list, no 404**, and the scheduled report was genuinely gone from the Scheduled Reports table
on reload. This directly confirms the documented source fix
(`Project.find_by(id: params[:project_id]) || Project.find_by(identifier: params[:project_id])`) holds in
practice, not just in the diff.

**Data-hygiene note found during cleanup (not a new bug, just worth recording):** deleting a `TestcaseReport` row
via the main table's own Delete icon does **not** cascade-delete its associated `ScheduledReport` row — the
schedule row from this session's earlier first-pass test (`REG-TC110-ScheduleCancel-20261027`, scheduled_report
id 6) was still present in the Scheduled Reports table even though its parent `TestcaseReport` (id 178) had
already been deleted via the main list. Cancelled it the same way (now that the Cancel action is confirmed
working) to clean it up. Cleanup: deleted `ScheduledReport` ids 6 and 7 via the Scheduled Reports section's Cancel
action, and `TestcaseReport` id 179 via the main list's Delete action.

---

### TC-TCM-111: Scheduled time is interpreted as UTC

**User Role:** QA
**Priority:** Low
**Steps:**
1. Schedule a report for a specific UTC time; note the server and local timezone.
2. Observe actual delivery time.

**Expected Result:**
- Delivery matches the scheduled **UTC** time as labelled in the form, not the local timezone.

**PARTIALLY RETESTED 2026-10-23 — storage is correct, delivery itself can't be verified (BUG-TCM-111 blocks all
delivery).** Confirmed via direct DB inspection (`ScheduledReport.scheduled_time`) that entering `11:20` in the
form stores exactly `Fri, 23 Oct 2026 11:20:00 UTC` — correctly interpreted as UTC with no timezone drift, and
Sidekiq's own `ScheduledSet` entry shows the identical `at=2026-10-23 11:20:00 UTC`. So the **storage/labelling**
half of this TC genuinely passes. The **delivery-timing** half cannot be verified at all right now — no
scheduled report ever delivers, in any timezone, per BUG-TCM-111 — so "does delivery match UTC" is currently
unanswerable and should be re-run once that bug is fixed.

**REGRESSION — 2026-10-27 (post BUG-TCM-111 fix, Critical severity, §26 full-suite-plus-related-suites scope).**
BUG-TCM-111's actual root cause (`connection_pool`/`sidekiq` gem version mismatch crashing Sidekiq's scheduled-job
poller at every boot) **confirmed genuinely fixed**: `docker logs redmine6-sidekiq-1` shows a clean boot with
"Schedules Loaded" and no `ArgumentError`/`TimedStack` crash signature anywhere in the log (previously crashed on
every single boot); `docker exec redmine6-sidekiq-1 bundle list` shows `connection_pool (2.5.5)` now — a version
actually compatible with `sidekiq (7.3.9)`, not the old mismatched `3.0.2`. This is the real gem-level fix, not
an incidental non-repro. **The delivery-timing half is now live-confirmed indirectly, same day (second pass):**
creating a report with "Right now" + "Notify me by email" caused Mailpit's total message count to jump from 7 to
100 within seconds of the report-creation request — the plugin's own `ReminderWorker` cron job (which depends on
the exact same Sidekiq scheduled-job poller BUG-TCM-111 broke) fired a large backlog of overdue test-run reminder
emails that had been queued/due for a long time but could never previously be dequeued. This is strong live
evidence the poller itself is now genuinely running jobs, not just booting cleanly. A precise "report scheduled
for exactly HH:MM UTC delivers at exactly that UTC time" timing check was not performed this pass (would need to
schedule ~2 minutes out and wait) — **resume point:** schedule a report for a specific near-future UTC time and
confirm exact delivery timestamp in Mailpit matches.

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 9 — Reporting, BUG-TCM-102/105/106/107/114; BUG-TCM-108 already covered above)

- **BUG-TCM-106 (Requirement Coverage Excel export broken) — CONFIRMED FIXED, live.** Created
  `REG-TC106-ReqCoverage-20261027` (report id 181) as Requirement Coverage, requirement "requirement 2",
  "Include all test run", then hit its real `Download Excel` link
  (`/testcase_reports/181/export_excel?project_id=2`) — downloaded a genuine `.xlsx` file (`file` command confirms
  "Microsoft Excel 2007+", real `xl/worksheets/sheet1.xml` content), not the "Unknown Report Type" error text the
  bug described. Cleanup: deleted report 181.
- **BUG-TCM-107 (Slow Tests PDF drops body), BUG-TCM-114 (`export_pdf1` 500 crash)** — **cannot be meaningfully
  live-retested on this environment**: this instance's PDF generation (Puppeteer/Node/Chrome) is non-functional
  — confirmed earlier this same session when emailing a Tester Scorecard report as PDF silently fell back to
  HTML ("The PDF version of this report could not be generated"). This is a known, pre-existing environment gap
  (BUG-TCM-114's own 2026-10-26 retest separately confirmed the original `pdf_path` crash is gone, but hit a
  different Chrome crashpad-handler incompatibility trying to get further) — not a regression of either bug's
  fix. Both rely on their 2026-10-26 source-diff/partial-live confirmations.
- **BUG-TCM-102 (defect's "Test Run:" field doesn't aggregate), BUG-TCM-105 (Defect Summary wrong
  testcase/environment pairing)** — not re-run this pass given remaining time budget; both confirmed via precise
  source diff 2026-10-26, no relevant commits since. **Resume points:** TC-102 — link a defect to a 2nd run,
  confirm its "Test Run:" field now shows both, not just the first; TC-105 — generate a Defect Summary report on
  a multi-environment run, confirm each defect pairs with the correct testcase/environment, not an unscoped
  first-match.

**Result: 1 of 5 bugs freshly live-reproduced this area (BUG-108 already fully live-confirmed earlier in this
report), 2 are environment-blocked (PDF generation unavailable here, not a regression), 2 rely on yesterday's
still-current source-diff evidence. No regressions, no new bugs.**

---

## Regression — 2026-10-28 (§27 final-cycle, area 13/22)

`git log` since 2026-10-27 showed no new commits to `testcase_reports_controller.rb`/views (the 5 commits
touching reports code were all dated 2026-10-26, already accounted for by the 2026-10-27 fast pass above).
Rather than treat that as "nothing to check," closed one more gap the earlier passes left source-diff-only:

- **BUG-TCM-108 (Tester Scorecard 500 crash on never-executed pairs) — genuinely live-reproduced.** Created a
  real Tester Scorecard report ("REG28-TesterScorecard-Check", id 190), default "Include all test run" scope,
  against `rftc-016-ci-qa` — a project with dozens of runs that have zero executed cases. Opened the report
  directly: renders cleanly, no 500, with multiple rows correctly showing `0.0%` completion/pass rate for the
  never-executed runs (the exact condition that used to crash the whole report). Full write-up in
  `bugs/closed/BUG-TCM-108.md`'s 2026-10-28 retest section.

**BUG-TCM-102 and BUG-TCM-105 remain source-diff-only** (unchanged — no commits touched their code since the
2026-10-26 fix), same resume points as recorded in the 2026-10-27 section above. BUG-TCM-107/114 remain
environment-blocked (PDF generation non-functional on this instance), not a regression.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-078 – 097 | Report creation, viewing, download | BUG-TCM-075 (closed 2026-10-23, see TC-TCM-093), BUG-TCM-105, BUG-TCM-106, BUG-TCM-107, BUG-TCM-108, BUG-TCM-097 (extension, not a new bug) |
| TC-TCM-098 – 106 | Emailing | **BUG-TCM-005** (prod #120588) — TC-TCM-100; BUG-TCM-108 (TC-TCM-098/100), BUG-TCM-109 (TC-TCM-098/100/102) — new 2026-10-23 |
| TC-TCM-107 – 111 | Scheduling | BUG-TCM-110 (TC-TCM-110), BUG-TCM-111 (TC-TCM-107/108/109/111) — new 2026-10-23 |
| TC-TCM-274 | PDF Run Name/Environment heading parity | BUG-TCM-075 (now fixed) |
| TC-TCM-316 – 317 | Slow Tests / Most Failed Tests creation (new 2026-10-23 — these two report types existed but had no creation TC) | BUG-TCM-107 (TC-TCM-316) |
| TC-TCM-088 – 090 | CRUD (Edit/Delete/Cancel delete) | None — all 3 PASS, zero new bugs, 2026-10-23 |

**2026-10-23 regression session (run #83, reports #136–143, all 8 report types, all 3 download formats each, plus
emailing all 8 types in both HTML and PDF):** confirmed BUG-TCM-075 fixed, found 6 new bugs — BUG-TCM-105 (Defect
Summary wrong/missing Testcase ID), BUG-TCM-106 (Requirement Coverage Excel export totally broken), BUG-TCM-107
(Slow Tests PDF export drops its body), BUG-TCM-108 (Tester Scorecard report crashes with a 500 and silently
fails to email under the default "Include all test run" scope), BUG-TCM-109 (emailed Slow Tests/Most Failed
Tests show "Report Type: Default Text" instead of their real name) — confirmed BUG-TCM-097 propagates into 4 more
report types (not separately filed), and added the 2 missing creation TCs for Slow Tests/Most Failed Tests.
**Scheduling (TC-TCM-107–111) also regressed 2026-10-23**: scheduling records correctly (interval/weekday/day/
time all accurate, UTC storage confirmed correct via DB), but cancelling a schedule always 404s — BUG-TCM-110
(High) — and, far more seriously, scheduled reports never actually deliver at all, ever, on this build —
BUG-TCM-111 (Critical), root-caused to Sidekiq's own core scheduled-job poller crashing at every boot on a
`connection_pool`/`sidekiq` gem version mismatch, independently confirmed by the plugin's own every-minute
`ReminderWorker` cron job not having run once in 2+ hours. **CRUD (TC-TCM-088–090) was also completed the same
session — Edit, Delete, and Cancel deletion all PASS, zero new bugs** (edited report #136's Name/Description,
both persisted correctly incl. real rich-text content; deleted it, confirmed removed from list and DB; separately
confirmed Cancel on the delete popup leaves the report untouched) — **making this the first complete, suite-wide
2026-10-23 regression of `TESTCASE_MANAGEMENT_REPORTS.md`, with every TC now carrying current-build evidence.**

- Existing evidence for TC-TCM-098/523/525: `screenshots/BUG-TCM-005/` and
  `logs/BUG-TCM-005-pdf-attachment-evidence.log`.
- TC-TCM-100 and TC-TCM-106 are **environment-sensitive** — verify Sidekiq and Installation step 6 before
  recording a failure against the product.
