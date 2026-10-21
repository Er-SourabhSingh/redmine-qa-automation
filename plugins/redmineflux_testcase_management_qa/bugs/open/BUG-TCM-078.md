# BUG-TCM-078

- Bug ID: BUG-TCM-078
- Production Redmine Issue ID: #124109 (https://flux.zehntech.com/issues/124109) — assigned to Vaishnavi Bhawsar, priority Medium, Defect Type Functional / Defect Severity Medium-severity / Defect priority Medium, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123977 and #123984 in Run #612, environment Win + Chrome + Ver6.
- Title: Emailed report attachments (PDF and HTML) leak the page's "Download HTML/PDF/Excel" navigation menu into the report content, omit the bar chart, and (PDF only) mis-encode non-ASCII punctuation
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3000` (`redmine6-redmine-1` / `redmine6-sidekiq-1`), project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-21

## Summary

Once a report is emailed (via "Notify me by email" at report-creation time, in either PDF or HTML attachment
format), the attachment is generated through a different pipeline than the "Download HTML/PDF/Excel" buttons on
the report's own live page — and that pipeline has three distinct rendering-fidelity defects, all confirmed on a
**Slow Tests** report (#22, "Email Verify - Slow Tests PDF v3") whose underlying data is otherwise correct and
complete in the email (see "Not affected" below — this bug is scoped to presentation, not data):

1. **The live page's "Download HTML / Download PDF / Download Excel" dropdown menu text leaks into the emailed
   report content itself**, rendered as a bullet list directly above the report title — on *both* the PDF and
   HTML emailed attachments. This is page chrome that has no business being in an exported report.
2. **The bar chart is completely missing** from both the emailed PDF and the emailed HTML attachment, even
   though the report's data is present and the table renders correctly — the same *symptom* as BUG-TCM-076, but
   via a different generation pathway (the mailer/Puppeteer pipeline, not the "Download PDF" button's controller
   export), so filed separately.
3. **PDF only:** the non-ASCII middle-dot character "·" (used in "Slow-test threshold: 5.0 s (Slow = p95 >
   slow-test threshold). · No timing data yet: 8") renders as the mojibake sequence "Â·" — a character-encoding
   defect specific to the PDF attachment (the HTML attachment does not show this, so it is isolated to the PDF
   generation step, not the underlying text).

## Steps to reproduce

1. Log in as Administrator, open project `RFTC-016 CI Ingest QA`.
2. Go to **Reports** → **+ New report** → **Select type** = `Slow Tests` (any report type with a bar chart
   reproduces #1 and #2; #3 needs any report whose footer/body text contains a "·" character, which Slow Tests
   has).
3. Enter a **Name**, check **Notify me by email**, enter a real/checkable mailbox, leave **Email the report as
   PDF attachment** selected, leave **Right now**, click **Create**.
4. Open the recipient mailbox, open the delivered email's PDF attachment.
5. Observe: a bullet list reading "Download HTML / Download PDF / Download Excel" appears directly above the
   report's own title; no bar chart appears anywhere in the document; the footer line's "·" character is garbled.
6. Repeat steps 2–4 with **Email the report as HTML attachment** selected instead — observe the same menu-leak
   and missing-chart symptoms in the HTML attachment (the encoding issue does not reproduce in HTML, confirming
   it is PDF-specific).

## Expected result

- The emailed report (PDF or HTML) should contain only the report's own content — title, chart, table, footer —
  with no page navigation/chrome elements such as the Download menu.
- The bar chart should render in the emailed attachment exactly as it does on the live page and in the
  "Download HTML"/"Download PDF" button exports.
- All text, including non-ASCII punctuation, should render correctly in the PDF (no mojibake).

## Actual result

- Both PDF and HTML emailed attachments open with a stray bullet list — "Download HTML", "Download PDF",
  "Download Excel" — rendered as literal list items directly under the "Slow Tests" page heading, before the
  report's own title ("Email Verify - Slow Tests PDF v3").
- Neither the emailed PDF nor the emailed HTML attachment contains any chart markup: the PDF has no chart image
  at all (confirmed by reading the PDF directly — only the title, stray menu list, and data table are present);
  the HTML attachment has **zero** `<svg>` elements (`grep -c svg` → 0) versus the live/"Download HTML"-button
  export's 104 `<svg>` elements for the same report type — i.e. the ApexCharts chart never renders in the
  email's HTML either, even though the `apexcharts` script tag and the chart's render-trigger script are both
  present in the markup (the chart's `<script>` likely never fires inside the mailer's headless/offscreen
  rendering context, or fires too late before the page is captured).
- In the PDF only, the footer text "Slow-test threshold: 5.0 s (Slow = p95 > slow-test threshold). · No timing
  data yet: 8" renders with "·" replaced by "Â·" — a classic UTF-8-interpreted-as-Latin-1 double-encoding
  artifact, isolated to the PDF text layer.

## Not affected (confirmed correct in the same emails)

- **Table data is complete and correct** in both the PDF and HTML emailed attachments for this Slow Tests report:
  all 8 ranked rows (Rank/Test Case/Samples/Avg/Max/p95/Flag), matching the live page's data at the time of
  sending.
- **The footer text itself is present** in both formats (unlike the "Download PDF" button export, which drops
  this footer line entirely per `BUG-TCM-075`'s evidence — the mailer's PDF pipeline is actually *more* complete
  than the button export in this one respect, just mis-encoded).

## Root cause (inferred)

The mailer's PDF/HTML generation (Puppeteer/Grover for PDF, a server-rendered page fetch for HTML) appears to
capture the **entire report page's DOM as a logged-in user would see it**, including the page-chrome elements
(the Download dropdown menu) that a real browser view keeps visually hidden/collapsed via CSS
(`style="display:none"` on `#download-menu` in the raw markup — see BUG-TCM-077's evidence for the exact HTML)
until the user clicks to open it. A full offscreen/headless capture that doesn't honor the same
collapsed/hidden state, or extracts text content regardless of CSS display state, would explain this leak
directly (`display:none` elements do still have accessible text content when a PDF tool walks the DOM directly
rather than rendering it visually and rasterizing). The missing chart is consistent with the same client-side
JavaScript (ApexCharts' `render()` call, which only fires on `DOMContentLoaded` inside a `<script>` at the bottom
of the page) not completing before the capture happens — likely a race between the headless page load event and
the capture trigger, with no explicit wait for the chart's async render to finish. The PDF-only mojibake is a
separate, likely unrelated encoding-declaration issue in whatever converts the captured HTML to PDF bytes (e.g.
missing an explicit UTF-8 charset meta/header in the intermediate document Grover hands to the PDF converter).

## Evidence

Raw downloaded files attached alongside this bug file:
- `screenshots/BUG-TCM-078/email-slow-tests-pdf-menu-leak-no-chart.pdf`
- `screenshots/BUG-TCM-078/email-slow-tests-html-menu-leak-no-chart.html`

PDF text extraction (first lines):
```
Slow Tests
Download HTML
Download PDF
Download Excel
Email Verify - Slow Tests PDF v3
Rank Test Case Samples Avg Max p95 Flag
1 #26 Checkout flow renders correctly 3 4.0 s 5.0 s 5.0 s
...
Slow-test threshold: 5.0 s (Slow = p95 > slow-test threshold). Â· No timing data yet: 8
```

HTML attachment raw markup (menu leak, confirmed `display:none` on the real menu element — meaning the mailer's
capture does not respect this hidden state):
```html
<div class="rf_testcase_management_page_actions">
  <div class="download-options">
    <div id="download-dropdown" class="dropdown-toggle" style="display:none"></div>
    <ul id="download-menu" class="dropdown-menu" style="display:none">
      <li class="dropdown-item">Download HTML</li>
      <li class="dropdown-menu-separator"></li>
      <li class="dropdown-item">Download PDF</li>
      <li class="dropdown-menu-separator"></li>
      <li class="dropdown-item">Download Excel</li>
    </ul>
  </div>
</div>
```

HTML attachment chart markup present but never rendered (0 `<svg>` elements anywhere in the file, versus the
"Download HTML" button export's 104 for the same report type):
```html
<div id="chartTarget" data-chart-series="..."></div>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    ...
    new ApexCharts(el, options).render();
  });
</script>
```

## Test case coverage

Found while verifying email delivery for Slow Tests and Most Failed Tests reports (explicit user request).
Not yet mapped to an automation TC — "emailed report rendering fidelity" is not currently covered in
`testcases/`; should be added as a dedicated TC once this is fixed (Traceability Matrix gap, same pattern as
BUG-TCM-075/076/077).

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers menu-leak or chart-omission in
  *emailed* reports specifically. BUG-TCM-076 is the "Download PDF" button's chart-omission (a different,
  controller-based export pipeline) — related symptom, different pipeline, kept separate per that bug's own
  scope note. BUG-TCM-075 is the "Download PDF" button's missing run-name heading — also a different pipeline.
  BUG-TCM-077 (filed alongside this one) is the Most Failed Tests emailed-report *data* being empty — a
  data-correctness defect, not a rendering-fidelity one; kept separate due to the difference in severity and
  nature.

## Retest — 2026-10-21 (STILL OPEN — partially fixed, 2 of 3 symptoms remain)

Retested against `localhost:3000` after the user pulled updated plugin code into `C:\redmine v6\plugins` and the
stack was restarted. Created a fresh Slow Tests report (#28 "Retest verify - Slow Tests PDF post-pull", PDF
attachment) and reused report #27's Most Failed Tests HTML attachment (created for `BUG-TCM-077`'s retest, same
"Download HTML/PDF/Excel" page chrome applies to every report type) to check all three symptoms:

| # | Symptom | Status |
|---|---|---|
| 1 | Download-menu chrome leaks into content | **STILL PRESENT** — `screenshots/BUG-TCM-078/retest-2026-10-21-slow-tests-pdf.pdf` and the HTML attachment reused from BUG-TCM-077's retest both still contain the literal `<li class="dropdown-item">Download HTML</li>` / `Download PDF` / `Download Excel` markup, same as originally reported. |
| 2 | Bar chart completely missing | **STILL PRESENT** — HTML attachment has 0 `<svg>` elements (confirmed via `grep -c svg`); the PDF has no chart image either (confirmed by `pdftotext` showing only the `data-slowtests="{...}"` div and `<script>` block, never any rendered chart content). |
| 3 | PDF-only mojibake ("·" → "Â·") | **FIXED** — the retest PDF's footer line now reads correctly: `Slow-test threshold: 5.0 s (Slow = p95 > slow-test threshold). · No timing data yet: 8`, with a genuine "·" character, confirmed via `pdftotext -layout` text extraction (no "Â·" anywhere in the output). |

**Verdict: NOT FIXED — 1 of 3 symptoms (the PDF encoding mojibake) is fixed, but the menu-leak and missing-chart
symptoms both remain exactly as originally reported.** Leaving `BUG-TCM-078` open; not moved to `bugs/closed/`.
Evidence file added: `screenshots/BUG-TCM-078/retest-2026-10-21-slow-tests-pdf.pdf`.

**Important caveat found during this same retest, filed separately as `BUG-TCM-080`:** the PDF attachment pipeline
has also regressed into a much more severe, distinct defect — the entire page's raw HTML/CSS/`<script>` source
text is now dumped as literal visible content in the PDF instead of a rendered page (confirmed in both this
report's PDF and `BUG-TCM-077`'s retest PDF). That is tracked separately in `BUG-TCM-080` since it is a
pipeline-wide rendering failure, not a continuation of this bug's three specific symptoms (which remain
individually identifiable and gradeable against the original report, as above, even though the PDF as a whole is
now also unusable for the new reason).

## Production report

Reported 2026-10-21 as issue #124109 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user approval.
Linked to production Testcase #123977 and #123984 in Run #612 via `report_defect`.
