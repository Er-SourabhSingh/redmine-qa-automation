# Test Cases — Redmineflux Testcase Management — Reports, Emailing & Scheduling

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 9 and the vendor KB "Reporting & Analytics" section.
>
> **Status: authored 2026-09-14.** TC-TCM-098 – 526 already carry live evidence from the 2026-09-14 session
> (BUG-TCM-005); the rest are not yet executed.

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

---

### TC-TCM-089: Delete a report

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a report (bin icon) and confirm; reload the list.

**Expected Result:**
- The report is removed from the list.

---

### TC-TCM-090: Cancelling report deletion does not delete

**User Role:** Manager
**Priority:** Low
**Steps:**
1. Start deletion, cancel at the prompt, reload.

**Expected Result:**
- The report is still listed.

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

---

### TC-TCM-094: Download report as Excel

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a report → download menu → **Download Excel**; open the file.

**Expected Result:**
- A valid `.xlsx` downloads and opens with the report's tabular data intact.

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
- **Step 6 (HTML under failure) is NOT YET EXECUTED.** The body text lives in `send_report.html.erb`, which is
  shared by both formats, so the misleading line is not PDF-specific — only the swallowing `rescue` is. Verify,
  don't assume.

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

---

### TC-TCM-108: Schedule a weekly report on a chosen weekday

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a scheduled report with **Every week** and a specific weekday; inspect Scheduled Reports.

**Expected Result:**
- The schedule records the correct weekday and time and is displayed accurately.

---

### TC-TCM-109: Schedule a monthly report on a chosen day

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a scheduled report with **Every month** and a day-of-month; inspect Scheduled Reports.

**Expected Result:**
- The schedule records the correct day and time.
- Check behaviour for day 29–31 in short months and record it.

---

### TC-TCM-110: Cancel a scheduled report

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Cancel the scheduling of an existing scheduled report.
2. Check the Scheduled Reports section and the mailbox after the previously scheduled time.

**Expected Result:**
- The schedule is removed from the list and no further emails arrive.

---

### TC-TCM-111: Scheduled time is interpreted as UTC

**User Role:** QA
**Priority:** Low
**Steps:**
1. Schedule a report for a specific UTC time; note the server and local timezone.
2. Observe actual delivery time.

**Expected Result:**
- Delivery matches the scheduled **UTC** time as labelled in the form, not the local timezone.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-078 – 520 | Report creation, viewing, download | — |
| TC-TCM-098 – 529 | Emailing | **BUG-TCM-005** (prod #120588) — TC-TCM-100/524/525 |
| TC-TCM-107 – 534 | Scheduling | — |

- Existing evidence for TC-TCM-098/523/525: `screenshots/BUG-TCM-005/` and
  `logs/BUG-TCM-005-pdf-attachment-evidence.log`.
- TC-TCM-100 and TC-TCM-106 are **environment-sensitive** — verify Sidekiq and Installation step 6 before
  recording a failure against the product.
