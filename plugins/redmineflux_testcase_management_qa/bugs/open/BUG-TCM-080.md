# BUG-TCM-080

- Bug ID: BUG-TCM-080
- Production Redmine Issue ID: #124159 (https://flux.zehntech.com/issues/124159) — assigned to Vaishnavi Bhawsar, priority Urgent, Defect Type Functional / Defect Severity Critical / Defect priority Urgent, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123977 (Slow Tests export formats) and #123984 (Most Failed Tests export formats) in Run #612, environment Win + Chrome + Ver6.
- Title: Emailed PDF attachments now contain the raw HTML/CSS/JavaScript page source as literal visible text instead of a rendered document — a regression in the mailer's PDF-generation pipeline
- Severity: Critical
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.1.0, post plugin-code pull on 2026-10-21)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1` / `redmine6-sidekiq-1`), project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-21

## Summary

Found while retesting `BUG-TCM-077` and `BUG-TCM-078` against freshly-pulled plugin code (`C:\redmine v6\plugins`,
restarted via `docker compose restart redmine sidekiq`). Every "Email the report as PDF attachment" report now
produces a PDF whose content is the **literal, unrendered HTML/CSS/`<script>` source of the report page**,
printed as plain text — not a genuine rendered document. The PDF opens and is a valid PDF file (confirmed via
`file`/`pdftotext`), but instead of showing the report's title, chart, and table as a human-readable page, it
shows the raw markup: `<meta charset="utf-8"><script src="...">`, full `<style>`/`<link>` tags, the complete
table markup (`<table>`, `<tr>`, `<td>` as literal text rather than a rendered grid), and ends with the page's
own commented-out JavaScript source, verbatim. The report's actual data values ARE present somewhere inside this
text dump (e.g. the ranked failure rows for Most Failed Tests, or the slow-test rows for Slow Tests), but a
recipient opening the PDF would see an unreadable wall of markup, not a report.

This supersedes/compounds the PDF-specific symptoms already tracked in `BUG-TCM-077` (data-correctness — now
fixed) and `BUG-TCM-078` (menu-leak/missing-chart/mojibake — two of three symptoms still open): even once those
are fully fixed, the PDF as a whole is currently unusable for any report type, because the fundamental rendering
step (visiting the page in a headless browser and printing *what is displayed*, not *what the source contains*)
appears to not be happening at all for the PDF path.

## Steps to reproduce

1. Log in as Administrator, open project `RFTC-016 CI Ingest QA` (or any project).
2. Go to **Reports** → **+ New report** → any **Select type** (confirmed on both `Most Failed Tests` and
   `Slow Tests`).
3. Enter a **Name**, check **Notify me by email**, enter a real/checkable mailbox, leave **Email the report as
   PDF attachment** selected, leave **Right now**, click **Create**.
4. Open the recipient mailbox, open the delivered email's PDF attachment.
5. Observe: instead of a formatted report page, the PDF's text content is the page's raw HTML source — `<meta
   charset="utf-8"><script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>` etc. — followed by the
   literal table markup and ending in the page's own `<script>` block, including commented-out JS lines.

## Expected result

- The emailed PDF attachment should be a genuinely rendered document — the same visual layout (title, chart,
  table, footer) a user sees when opening the report in a browser or using "Download PDF" — never the page's raw
  HTML/CSS/JavaScript source as visible text.

## Actual result

- Confirmed on two separate reports, both created fresh against this session's restarted stack:
  - Report #26 "Retest verify - Most Failed PDF post-pull" (Most Failed Tests, PDF attachment) — `pdftotext
    -layout` on the downloaded attachment shows `<meta charset="utf-8"><script
    src="https://cdn.jsdelivr.net/npm/apexcharts"></script>` as the very first line, followed by every
    `<script>`/`<link>` tag the page loads, then the literal `<table>`/`<tr>`/`<td>` markup (340 lines of raw
    source total for a 5-page PDF), ending in the page's own `document.addEventListener('DOMContentLoaded', ...)`
    script, including commented-out download-loader JS.
  - Report #28 "Retest verify - Slow Tests PDF post-pull" (Slow Tests, PDF attachment) — identical symptom: raw
    source text throughout, same script tags, same ending pattern.
- No embedded chart image, no rendered table grid, no page styling of any kind — this is not a CSS/layout defect
  on top of a rendered page, it is the complete absence of rendering: the PDF generator appears to have printed
  the response body's raw text/HTML string directly into the PDF rather than opening it in a browser context
  (Puppeteer/Grover) and capturing the rendered output.
- The report's real data values are still findable inside the dumped markup (e.g. `#24 Apply valid discount code
  at checkout`, `#26 Checkout flow renders correctly`), which is how `BUG-TCM-077`'s data-correctness fix could
  still be confirmed despite this defect — but this is incidental; the PDF is not fit for its purpose as
  delivered.

## Root cause (inferred)

Likely a regression introduced alongside whatever change fixed `BUG-TCM-077`'s empty-data defect and
`BUG-TCM-078`'s mojibake — possibly the PDF-generation call was changed to pass the page's HTML string into a
plain text-to-PDF conversion (or a misconfigured Puppeteer `page.setContent()`/`page.goto()` call that never
actually triggers a render, e.g. missing `waitUntil`, or the generator reading the raw ERB/HTML response buffer
and writing it as PDF text content instead of handing it to a headless browser for rendering). This is
consistent with `BUG-TCM-078`'s existing root-cause note that the PDF pipeline uses Puppeteer/Grover — something
in that call appears to have stopped invoking an actual browser render step.

## Evidence

Raw downloaded files attached alongside this bug file:
- `screenshots/BUG-TCM-077/retest-2026-10-21-most-failed-pdf.pdf` (Most Failed Tests, report #26)
- `screenshots/BUG-TCM-078/retest-2026-10-21-slow-tests-pdf.pdf` (Slow Tests, report #28)

`pdftotext -layout` excerpt (first lines, Most Failed Tests PDF):
```
<meta charset="utf-8"><script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<link rel="stylesheet"
href="https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.8.0/dist/themes/classic.min.css">
<script src="https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.8.0/dist/pickr.min.js"></script>
...
<div class="rf_testcase_management_page_header" id="parent_name_export">
   <div class="rf_testcase_management_page_header_main">
         <h3 class="rf_testcase_management_page_title">Most Failed Tests</h3>
   </div>
```

Tail excerpt (same PDF, literal JavaScript as the last visible lines):
```
// if (link && loader) {
// link.addEventListener('click', async function (event) {
//         event.preventDefault();
...
});
</script>
```

## Test case coverage

Found during this session's retest of `BUG-TCM-077`/`BUG-TCM-078` against freshly-pulled plugin code. Not yet
mapped to an automation TC — "emailed PDF is a genuinely rendered document, not raw source text" is not currently
covered in `testcases/`; should be added as a dedicated TC once this is fixed (Traceability Matrix gap, same
pattern as BUG-TCM-075/076/077/078).

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers a raw-source-text PDF (a
  complete absence of rendering). `BUG-TCM-077` (empty data) and `BUG-TCM-078` (menu-leak/missing-chart/mojibake)
  both describe defects *within* an otherwise-rendered PDF; this bug is the PDF never actually being rendered in
  the first place, discovered only because the retest for those two bugs required opening the PDFs directly.
  Not a duplicate of either.

## Production report

Reported 2026-10-21 as issue #124159 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user approval.
Linked to production Testcase #123977 and #123984 in Run #612 via `report_defect`.
