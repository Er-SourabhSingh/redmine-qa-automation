> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121883** ("rftc-021 — Most-failed-tests metric"), part of
> **Testcase Management plugin Release 7.2.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC021-<n>`.
>
> **Executed**: 2026-10-19, same environment as `RFTC-020` (see that file's header for setup detail).

# Test Cases — Redmineflux Testcase Management — rftc-021: Most-Failed-Tests Metric

## Plugin
- Name: Redmineflux Testcase Management
- Version: master (post-7.1.0, pre-7.2.0)
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Production ticket: #121883 (ztflux), done ratio 90%, status "In QA"

## Feature summary

A "Most Failed Tests" report ranks test cases by cross-run failure frequency. Failure is matched via
`CaseStatus#is_failure?` by default; an explicit "criteria" toggle (`failed` vs `failed_blocked`) optionally also
counts Blocked executions. Ranked by failure count, secondary by rate. Project- and `Issue.visible`-scoped — must
never leak another project's (or an invisible issue's) failure data.

---

### RFTC021-1: Report ranks test cases by real cross-run failure count

**Priority:** P1
**Steps:** Create a "Most Failed Tests" report (default criteria = Failed-only, Include all test run).
**Expected Result:** Every test case with ≥1 Failed execution across the project's runs appears, ranked by
failure count, with Failures/Executed/Failure Rate/Failing Runs columns.
**Actual Result:** PASS. `#24` (3 failures / 3 executed / 100%) ranked above `#26` (1 failure / 1 executed /
100%) — both real CI-ingested failures from earlier sessions, not synthetic.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — existing report #160 re-viewed live: `#24` (now 7 failures/9 executed/77.78%, grown from accumulated testing) still ranks above lower-failure cases, ranked correctly by real CI-ingested data. Still working as designed.

---

### RFTC021-2 (SACRED): Failed-only (default) criteria correctly excludes Blocked executions

**Priority:** P1 — the exact distinction the spec calls out ("match Failed by `is_failure?`, default Failed-only +
Blocked toggle")
**Steps:** Ingest a `blocked` result for a test case not previously in the ranking (`#34`, via
`ingest_results.json` against a run it belongs to, `auto_defect: true`); reload the **existing** Failed-only
report (no new report created).
**Expected Result:** `#34` does **not** appear in the Failed-only ranking.
**Actual Result:** PASS. Report unchanged — still only `#24` and `#26`, `#34` correctly absent.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — found a clean Blocked-only fixture (`#2051`, zero Failed results ever recorded): correctly absent from the Failed-only report #160. Still working as designed.

---

### RFTC021-3 (SACRED): `failed_blocked` criteria correctly includes Blocked executions

**Priority:** P1
**Steps:** Create a **second** Most Failed report with criteria = "failed_blocked" (the hidden `<select>` on the
New Report form that only appears once "Most Failed Tests" is selected as the type).
**Expected Result:** The same `#34` Blocked execution now appears in this report's ranking.
**Actual Result:** PASS. `#34` "Add item to cart" appeared at rank 3 (1 failure / 1 executed / 100%) — confirms
the toggle genuinely changes the underlying query, not just display.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — created a fresh "Failed + Blocked" report: the same `#2051` Blocked-only fixture now correctly appeared. Still working as designed.

---

### RFTC021-4 (SACRED/security): Cross-project isolation — a different project's Most Failed report shows zero leaked data

**Priority:** P1 — the dev's own claim: *"it can't leak data from another project or a private issue"*
**Steps:** Create a Most Failed report inside a **different** project (`bug-121896-retest`, id=1) that has no
failing executions of its own.
**Expected Result:** That project's report shows none of project `rftc-016-ci-qa`'s failures (`#24`, `#26`, `#34`
etc. must not appear) — a clean empty state, not a crash or a cross-project leak.
**Actual Result:** PASS. `"No failing test cases in the selected runs"` — clean, correct empty state; zero
cross-project data visible.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — created a fresh Most Failed report inside `bug-121896-retest`: identical "No failing test cases in the selected runs", zero leak of `rftc-016-ci-qa`'s data. Still working as designed.

---

## Second Follow-up (2026-10-19) — full 438-line source spec re-read, closing correctness/security gaps + a confirmed XSS

A full read of `backlog/planning/rftc-021-feature-most-failed-tests-metric.md` surfaced a critical through-
association dedup bug class, a determinism guarantee, the private-issue visibility boundary, and — critically —
a genuine, reproducible **XSS vulnerability in the report's bar chart**, found by directly executing the spec's
own Functional Test 5 security holdout (which the original pass never ran).

---

### RFTC021-5 (spec Unit 13, G1-1): A test case in TWO suites of the same run is counted ONCE, not twice

**Priority:** P1 — `run.issues` is a `has_many :through`, so without `.distinct` a multi-suite issue's failure
would be double-counted, corrupting the ranking
**Steps:** Added issue `#23` to a second suite within a run where it already belonged to another suite (so it has
2 `run_issue` rows in that one run); wrote one Failed result for it; created a Most Failed report scoped to only
that run.
**Expected Result:** `failed == 1`, not 2 — the `.distinct` on the issue scope must collapse the duplicate.
**Actual Result:** PASS. `#23: 1 failure / 1 executed / 100%`, with exactly one drill-down cell — confirms the
dedup guard works correctly.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh isolated fixture, added to 2 suites of the same run, 1 Failed result written: report shows `1 failure / 1 executed / 100%`, not 2. Dedup guard confirmed still working.

---

### RFTC021-6 (spec Unit 3): "Latest wins" — a cell whose history is Fail → Retest → Pass is NOT counted as a failure

**Priority:** P1 — proves the metric reads only the latest state per cell, never sums history
**Steps:** Wrote three sequential results for one fresh test case: Failed, then Retest, then Passed (same cell).
**Expected Result:** The case does not appear in the Most Failed ranking at all (latest state is Pass).
**Actual Result:** PASS. The fixture was absent from the ranking entirely, despite having a real Failed row in its
history — confirms latest-wins, not cumulative failure counting.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh fixture, Failed → Retest → Passed sequence: absent from the Most Failed ranking entirely, despite the real Failed row in its history. Latest-wins confirmed still working.

---

### RFTC021-7 (spec Functional 7, SEC-001-adjacent, SACRED): A private issue in the SAME project is excluded from a non-privileged viewer's ranking

**Priority:** P1 — cross-project isolation (RFTC021-4) is a different boundary than same-project private-issue
visibility; both must independently hold
**Steps:** Created a private (`is_private: true`) failing test case in the same project; logged in as a real
non-admin member (Reporter role, no special private-issue visibility) via a fresh session and fetched the same
Most Failed report.
**Expected Result:** The private issue's subject/count never appears for the non-admin viewer, while the other
(non-private) failing cases still do.
**Actual Result:** PASS. The non-admin session's response contained **zero** occurrences of the private issue's
subject, while all 4 other genuinely-failing cases were visible — `Issue.visible` scoping holds for the
same-project private-issue boundary, not just cross-project.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh private failing fixture; as `qanonadmin` temporarily switched to Reporter (no private-issue visibility): the private fixture was absent, other non-private failing cases remained visible. (Note: first tried `qa.limited`, who IS a Manager and — unlike Reporter — does have private-issue visibility by default, so saw the fixture; this is expected Redmine role behavior, not a defect, and doesn't contradict the test's own Reporter-role premise. Switched to a genuine Reporter-role user to match the original methodology.) Role reverted to Developer after.

---

### RFTC021-8 (spec Functional 11): The report-builder form shows the Failed/Failed+Blocked `criteria` control only for Most Failed Tests

**Priority:** P2
**Steps:** Opened the New Report form, selected "Most Failed Tests" as the type.
**Expected Result:** A "Count as failure" dropdown (Failed only / Failed + Blocked) appears.
**Actual Result:** PASS. The control appeared immediately on selecting the Most Failed Tests type, defaulting to
"Failed only" — confirms the toggle is reachable from the UI, not raw-param-only.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — the criteria dropdown (`Failed only` / `Failed + Blocked`) still appears immediately on selecting "Most Failed Tests". Still working as designed.

---

### RFTC021-9 (spec Functional 5, SACRED/CRITICAL) — **FAIL → BUG-TCM-070**: The bar chart executes injected HTML/script from a test case subject — a genuine, reproducible XSS

**Priority:** P1 — this is the exact "script-context sink" the spec's Gate 2 review flagged as a HIGH/MED finding
and built a dedicated holdout test for; running that holdout test for the first time this session immediately
caught a real vulnerability
**Steps:** Created a test case with subject `<img src=x onerror=alert(1)>`, a run with `<svg onload=alert(2)>` as
its name, and an environment named `<b onmouseover=alert(3)>`; recorded a Failed execution; opened a Most Failed
report scoped to that run.
**Expected Result:** All three fields render as inert, HTML-escaped text in both the ranked table and the bar
chart; the code's own comment claims "ApexCharts renders labels as SVG text (no HTML sink)."
**Actual Result:** **FAIL, confirmed exploitable.** The ranked **table** correctly escaped all three fields (the
raw HTTP response shows `&lt;img`/`&lt;svg`/`&lt;b ` with no live tags — table is safe). The **bar chart**,
however, genuinely executed the payload: opening the report triggered real `alert()` dialogs in the browser,
requiring repeated dismissal. Root-caused: the server-side encoding is actually correct (the chart's data is
JSON-encoded into a `data-mostfailed` attribute, exactly the safe pattern the spec prescribes), but the inline
`<script>` block `JSON.parse()`s that data back to the literal string and hands it to ApexCharts as an
`xaxis.categories` label — and this ApexCharts build/configuration renders that label as live HTML, not plain SVG
text, contradicting the code's own safety assumption. Filed as **BUG-TCM-070** (High — confirmed, reproducible
XSS, not a theoretical finding).

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ **CONFIRMED FIXED.** Loaded report #175 (contains the XSS-shaped `#35 <img src=x onerror=alert('export-xss')>` fixture, already in the live chart/table) with a dialog listener attached — zero `alert()` fired. Matches `bugs/closed/BUG-TCM-070.md`'s already-recorded fixed status. No longer FAIL.

---

## Third Follow-up (2026-10-19) — export formats were missing from both the original pass and the spec summary; now checked

A follow-up question ("did you check export reports and its data") surfaced that **none of the 9 scenarios above
ever exercised the report's own Download menu** (HTML/PDF/Excel) — not because export was out of scope, but
because it was simply never looked at. The on-screen ranked table/chart is not the only place this report's data
reaches a user.

### RFTC021-10 (ad hoc, prompted by the above question) — **FAIL → BUG-TCM-071**: Excel export doesn't recognize the Most Failed Tests report type at all; HTML and PDF exports are correct

**Priority:** P1 — the Download menu offers HTML/PDF/Excel identically for every report type, so a user has no
way to know in advance that Excel silently fails for this one
**Steps:** Created a fresh Most Failed Tests report (#13, "Export XSS Check", include-all-runs) containing a test
case (#35) whose subject carries the same XSS-shaped payload as RFTC021-9 (`<img src=x onerror=alert('export-xss')>
Remove item from cart`), confirmed it ranks correctly in the on-screen table/chart, then downloaded all three
formats (HTML, PDF, Excel) and inspected each file's actual contents (not just that a file arrived).
**Expected Result:** All three exports contain the same ranked data (Rank/Test Case/Failures/Executed/Failure
Rate/Failing Runs) as the on-screen report.
**Actual Result:** **HTML — PASS, and incidentally confirms BUG-TCM-070 doesn't propagate into this export.** The
downloaded HTML is a static DOM snapshot (zero `<script>` tags), so the `data-mostfailed` → `JSON.parse` →
ApexCharts re-render path that causes the live chart's XSS is entirely absent; the payload appears only as inert,
HTML-escaped text (`&lt;img src=x onerror=alert('export-xss'...`). **PDF — PASS**, payload renders as plain
unexecuted text (PDF viewers don't interpret HTML). **Excel — FAIL.** The entire worksheet is 5 cells: a generic
"Testcase Summary" header, the report name, a blank row, "Unknown Report Type", and "The report type 'most_failed'
is not recognized." No ranked data at all — not wrong/empty data like the already-filed BUG-TCM-068 (Slow Tests'
Excel export), but an explicit non-recognition of this report type by the Excel exporter. Filed as **BUG-TCM-071**
(High — same underlying gap class as BUG-TCM-068: a new rftc-020/021 report type wired into `show`/HTML/PDF but
not into the Excel exporter's type dispatch).

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ **CONFIRMED FIXED.** Downloaded and inspected report #175's `.xlsx` directly: real `Rank`/`Test Case`/`Failures`/`Executed`/`Failure Rate`/`Failing Runs` columns, all actual ranked data present and matching the live report exactly — no "Unknown Report Type" placeholder. Matches `bugs/closed/BUG-TCM-071.md`'s already-recorded fixed status. PDF export for this report type now fails via the separate, already-tracked **BUG-TCM-114** (plugin-wide `export_pdf1` 500) — not re-verified individually here, same root cause already confirmed in RFTC-020's regression.

## Not Executed

- **100-run cap** — not exercised; would require generating 100+ runs, impractical for this session (same
  low-risk judgment as other numeric DoS-shaped caps already accepted by inspection elsewhere in this release).
- **Secondary sort by rate** when failure counts tie — not exercised; no two test cases with tied failure counts
  were available this session.
- **Timestamp-tie determinism (Unit 14)** and **cross-project run-NAME leak specifically (Functional 6, distinct
  from RFTC021-4's issue-level check)** — not independently exercised; lower priority given RFTC021-4 and
  RFTC021-7 already cover the stronger/more directly testable forms of the visibility boundary.
- **Excel export's formula-injection escaping** (leading `=`, `+`, `-`, `@` in a test case subject) — moot for now
  since Excel export doesn't produce any data rows to inject into (BUG-TCM-071); re-test once that bug is fixed,
  alongside the equivalent still-blocked check on Slow Tests (RFTC020-17/BUG-TCM-068).

## Production Test Suite & Test Cases (created 2026-10-19)

Per explicit user approval, a production test suite and 4 consolidated test cases were created on `ztflux`
(`flux.zehntech.com`), mirroring the RFTC-020 suite's grouping convention (thematically consolidated, not one
testcase per granular scenario):

- Test Suite **#446** "RFTC-021 — Most Failed Tests Report (Release 7.2.0)" (parent: suite #6 "Testcase plugin")
- Test Case **#123981** "Most Failed Tests report core ranking, Failed/Failed+Blocked criteria toggle, and
  latest-wins semantics" — covers RFTC021-1, 2, 3, 6, 8
- Test Case **#123982** "Most Failed Tests report dedup guard and visibility boundaries (cross-project +
  private-issue scoping)" — covers RFTC021-4, 5, 7
- Test Case **#123983** "Most Failed Tests report bar chart must not execute injected HTML/script from ranked
  labels (XSS)" — covers RFTC021-9, linked to BUG-TCM-070
- Test Case **#123984** "Most Failed Tests report export formats: HTML, PDF and Excel" — covers RFTC021-10,
  linked to BUG-TCM-071

All 4 assigned to Sourabh Singh (id 683), status `New`, priority `High`.

**Run #612 linkage (2026-10-19):** all 4 testcases added to Run #612 (environment "Win + Chrome + Ver6", same run
as the sibling RFTC-016/017/020 suites). #123983 and #123984 marked Failed with their defects linked via
`report_defect`:

- **BUG-TCM-070 → production #123985** (https://flux.zehntech.com/issues/123985, assigned Vaishnavi Bhawsar,
  Security/High-severity/High), linked to testcase #123983.
- **BUG-TCM-071 → production #123986** (https://flux.zehntech.com/issues/123986, assigned Vaishnavi Bhawsar,
  Functional/High-severity/High), linked to testcase #123984.

**Pending-result gap closed (2026-10-26):** the user spotted #123981/#123982 still showing `[untested]` on
production run #612 (`runs/612?environment=Win+%2B+Chrome+%2B+Ver6&project_id=ztflux&testsuite_id=446`) while
reviewing the run page directly. Confirmed via this file's own Coverage Summary that both were genuinely executed
and PASS back on 2026-10-19 (10/10 executed scenarios, 8/10 PASS) — the result was simply never recorded against
the production run at the time. No re-execution was needed; recorded both as Passed via `create_status_result`
(result IDs 18218/18219) with notes explaining the retroactive fill-in, and confirmed via `get_run_testcases` that
run #612 now shows both as `[Passed]`.

## Coverage Summary

**10/10 executed scenarios — 8/10 PASS, 2 bugs found (BUG-TCM-070 High confirmed chart XSS; BUG-TCM-071 High Excel
export not recognizing the report type).** The core ranking logic (failure count, latest-wins, multi-suite dedup),
both visibility boundaries (cross-project AND same-project private-issue), the Failed/+Blocked toggle (including
its UI control), and the ranked table's own escaping are all correct. Of the two defects: one is isolated to the
chart partial's interaction with the ApexCharts library on the live page (does not propagate into the HTML or PDF
exports); the other is isolated to the Excel exporter never having been wired up for this report type at all
(HTML and PDF both work correctly, including correctly escaping the same XSS-shaped payload as inert text).

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. Both findings above are Closed, confirmed FIXED:

- **BUG-TCM-070** (ApexCharts bar-chart XSS) — `bugs/closed/BUG-TCM-070.md`.
- **BUG-TCM-071** (Excel export "Unknown Report Type") — `bugs/closed/BUG-TCM-071.md`, including the sheet-title
  cosmetic follow-up.

Also relevant and already independently retested: **BUG-TCM-077** (emailed report always said "No failing test
cases" — Closed, `bugs/closed/BUG-TCM-077.md`) and **BUG-TCM-078** (emailed PDF/HTML menu-leak + missing chart +
mojibake — Closed, `bugs/closed/BUG-TCM-078.md`). Two related items remain genuinely **open**: **BUG-TCM-109**
(Low — emailed report shows "Report Type: Default Text" instead of "Most Failed Tests") and the **new** BUG-TCM-114
below — neither regressed, both correctly still tracked open.

**Live spot-checks performed this pass** (report #160, "Most Failed Tests", project `rftc-016-ci-qa`):

| Check | Result |
|---|---|
| Live page (`show`) renders the ranked table + ApexCharts bar chart with real data, no XSS fired | **PASS** — confirms BUG-TCM-070 fix holds |
| Excel export downloads a real, named file (not a 5-row "Unknown Report Type" sheet) | **PASS** — confirms BUG-TCM-071 fix holds |
| PDF export (`GET /testcase_reports/160/export_pdf1`) | **FAIL — `HTTP 500`.** This is **BUG-TCM-114** (High, filed earlier the same day during this session's V1-cycle testing, currently **open**), not a new finding specific to this report — `export_pdf1` 500s identically for every report type on this build (`pdf_path` referenced before assignment). Cross-referenced, not re-filed. |

**Verdict:** Partial regression, same root cause as RFTC-020's. Chart/Excel/live-page correctness all hold; PDF
download is currently broken for this report type too, via the same plugin-wide BUG-TCM-114. HTML/Excel exports
and the live page are the reliable formats on this build until that bug is fixed.

## Full Re-Execution (Regression) — 2026-10-25, localhost:3000, plugin v7.2.0

**Literal, case-by-case re-execution of all 10 RFTC021 scenarios** (not the risk-based spot-check above) — see
each case's own inline `**Regression Result (2026-10-25...)**` line. **10/10 confirmed still working.**

| Case | Scenario | Result |
|---|---|---|
| RFTC021-1 | Ranking by failure count | ✅ PASS |
| RFTC021-2 | Failed-only vs Failed+Blocked criteria toggle | ✅ PASS |
| RFTC021-3 | Criteria UI control | ✅ PASS |
| RFTC021-4 | Cross-project isolation | ✅ PASS |
| RFTC021-5 | Dedup guard for multi-suite issues | ✅ PASS |
| RFTC021-6 | Latest-wins semantics | ✅ PASS |
| RFTC021-7 | Same-project private-issue visibility | ✅ PASS (required switching test persona from Manager-role `qa.limited` to genuine Reporter-role `qanonadmin` — Manager has private-issue visibility by default, not a defect) |
| RFTC021-8 | (core ranking, covered with RFTC021-1/2/6 in production TC #123981) | ✅ PASS |
| RFTC021-9 | Bar-chart XSS (BUG-TCM-070) | ✅ CONFIRMED FIXED |
| RFTC021-10 | Excel export (BUG-TCM-071) | ✅ CONFIRMED FIXED |

No new defects found in this pass. BUG-TCM-114 (plugin-wide `export_pdf1` 500) remains open and unrelated to this
report type specifically — already tracked, not re-filed.
