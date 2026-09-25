# Test Case Report — Redmineflux Dashboards — 2026-09-25

> One consolidated report per testing cycle, per CLAUDE.md §7. Supersedes the earlier per-artifact reports
> (`final-bug-report.md`, `tc-report.html`, `defects-summary.html`), which are no longer maintained going forward.

## Testing Performed

- [x] Functional testing
- [x] Permission testing
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation
- [x] Regression testing (per-bug §26, and full final-cycle §27)
- [ ] Multi-language testing — German only; already closed under `BUG-DSH-001`, not re-executed this cycle

## Test Case Execution Summary

| Total TCs | Pass | Fail (historical, now fixed/retracted) | Blocked | Deferred (documented reason) |
|-----------|------|------------------------------------------|---------|-------------------------------|
| 188 | ~120 | ~13 | ~2 | ~16 |

**Note on these counts**: they are derived from grepping verdict markers (`**PASS`, `**FAIL`, `**BLOCKED`, `**NOT
EXECUTED`) across all 8 suite files under `testcases/`, not a fresh re-tally. Several of the historical `FAIL`
markers correspond to bugs that have since been retested and closed (see below) — the testcase files themselves
retain the original FAIL verdict text plus a correction note rather than being rewritten to PASS, except where a
verdict was actively corrected during a retraction pass (e.g. `TC-DSH-025/047/077` for `BUG-DSH-015`,
`TC-DSH-073` for `BUG-DSH-017`, `TC-DSH-104/107/120/121` for `BUG-DSH-020`/`022`). Deferred TCs each carry their
own specific blocker recorded inline (disposable-project needs, genuinely-concurrent-session needs, out-of-scope
load-testing tooling, or a safety-classifier block on a shared-fixture action) — see `DASHBOARDS_HANDOFF.md`'s
Next Session Start Point for the current list. Every suite has been either executed or deliberately deferred;
none remain in an untouched "not yet reached" state.

## Bugs / Defects Found

**All 17 bugs found across this plugin's testing history are now closed.**

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-DSH-001 | Near-total absence of German i18n across the plugin UI | Low (orig. High) | Closed | — |
| BUG-DSH-002 | Chart-template widget grouped by a custom field missing General section | Medium | Closed | #121131 |
| BUG-DSH-004 | Grouping selector offered a genuine multi-select custom field | Low | Closed | #121132 |
| BUG-DSH-005 | Save Settings broke live rendering to "No Data Available" | High | Closed | #121133 |
| BUG-DSH-006 | Settings panel had no Display as / Group by control | Medium | Closed | #121134 |
| BUG-DSH-007 | Bar/Line legends showed query name instead of category label | Medium | Closed | #121135 |
| BUG-DSH-008 | Drill-down returned entire query for a non-filterable custom field | High | Closed | #121136 |
| BUG-DSH-011 | Auto Refresh off didn't cancel the already-scheduled cycle | Low | Closed | #121272 |
| BUG-DSH-013 | Charts disclosed full unrestricted issue count (725) to a 1-issue-visible role | High | Closed | #121273 |
| BUG-DSH-014 | Widgets addable on a closed project | Low | Closed | #121274 |
| BUG-DSH-016 | Global date range not remembered across navigation | Medium | Closed | #121283 |
| BUG-DSH-018 | Failed widget refresh silently showed stale data, no error | Medium | Closed | #121284 |
| BUG-DSH-019 | Any authenticated user could open ANY private project's dashboard | **Critical** | Closed | #121285 |
| BUG-DSH-020 | Share-link creator couldn't revoke it themselves | Medium (narrowed) | Closed | #121286 |
| BUG-DSH-021 | User Filter disclosed full 20-account instance roster | Medium | Closed | #121287 |
| BUG-DSH-023 | Group by selector excluded a role-restricted custom field regardless of viewer role | Medium | Closed | #121311 |
| BUG-DSH-024 | Grid's computed column widths exceeded the container width, clipping the rightmost card | Medium | Closed | #121318 |

**Retracted (6 — not real bugs, retired IDs, do not reuse):** `BUG-DSH-009`/`BUG-DSH-012` (confirmed intentional
design by the product owner); `BUG-DSH-010` (false positive — testing error, wrong hidden DOM element targeted);
`BUG-DSH-015`/`BUG-DSH-022` (confirmed intentional design via the vendor KB / architectural-consistency argument);
`BUG-DSH-017` (false positive — a real toast error was missed by a static DOM check, caught on retest with a
`MutationObserver`). Full detail in `bugs/_duplicates.md` and `DASHBOARDS_MEMORY.md`.

## Fix Verification / Retesting

**2026-09-24 batch** — `BUG-DSH-002/004/005/006/007/008` (6 bugs, from the #120914 sanity-testing cycle):
retested against exact original repro steps, all confirmed FIXED, production-synced, closed same day.

**2026-09-25 batch** — `BUG-DSH-011/013/014/016/018/019/020/021` (8 bugs, from the 2026-09-24 full final-cycle
regression + "execute not-yet-executed TCs" pass): retested against exact original repro steps, per explicit user
request. 7 of 8 confirmed FIXED on the first retest pass. `BUG-DSH-018`'s first retest used an invalid method (the
header Refresh button, which performs a full page reload and never calls the per-widget refresh endpoint the bug
is actually about) — the user asked to check the production issue's journal before retesting again, and the
developer's own fix note there identified the mistake and pointed at the correct path (the auto-refresh cycle).
Retested correctly: also confirmed FIXED. **8 of 8 confirmed fixed.** Evidence for each is recorded in its own
bug file's "Retest — 2026-09-25" section (and a "Retest correction" section for `BUG-DSH-018`).

**2026-09-25 second batch** — `BUG-DSH-023/024` (2 bugs, found during the broad drill-down/UI sweep later the
same day, after the first 8-bug batch had already closed): both reported to production (#121311, #121318),
container restarted, retested against exact original repro steps. `BUG-DSH-023` reconfirmed via a 3-way per-role
check (Admin and a legitimately-permitted role now see the role-restricted custom field in Group by; a role that
should NOT see it still correctly doesn't). `BUG-DSH-024` reconfirmed via direct DOM measurement
(`grid-template-columns` sum vs container width) at 1280×720, 1440×900 and 1920×1080 — 0px overflow at all three,
down from 225.5px/235px/29px overflow respectively before the fix. **Both confirmed FIXED**, production issues
updated to Done/100%, local bug files moved to `bugs/closed/`. Evidence in each bug file's own
"Retest — 2026-09-25" section.

## Regression Testing Results

**Per-bug regression (§26)**: implicitly covered by the retest evidence itself for each of the 8 bugs above — each
retest re-exercised the directly affected feature end-to-end (not just a status flag check).

**Full final-cycle regression (§27)**, run 2026-09-25 before closure since all 8 fixes emptied `bugs/open/`:

| Suite | Method | Result |
|---|---|---|
| Chart Widgets | Swept all 22+ built-in chart types via `Chart.getChart`, checked for console errors and sane totals | PASS — zero JS errors (one pre-existing unrelated 404 for a stale CSS asset), all totals numeric and sane |
| Chart Settings | Confirmed Settings modal opens with all 3 sections present | PASS (light touch — none of the 8 fixes touch filter/settings mechanics) |
| Global Filters/Layout | Date-range persistence and auto-refresh re-verified in depth as part of the `BUG-DSH-011`/`016` retests themselves | PASS |
| Permissions | Re-confirmed `BUG-DSH-013`/`019`/`021` fixes; contrast-checked a legitimate member (Daisy Skye) still gets normal 200 access and full Add Chart capability | PASS — `BUG-DSH-019` fix correctly targets non-members only |
| Public Sharing | Fresh share link generated and confirmed working publicly (200, no edit controls in DOM, read-only) | PASS |
| Installation/Access | Contrast-checked Add Chart still works normally on an *active* project | PASS — `BUG-DSH-014` fix correctly scoped to closed projects only |

**Zero new failures found.** All 8 fixes hold with no detected side effects elsewhere.

**Second full final-cycle regression (§27)**, run 2026-09-25 after `BUG-DSH-023`/`024` were found, reported,
fixed, and retested — `bugs/open/` emptied a second time, triggering another full-plugin pass:

| Suite | Method | Result |
|---|---|---|
| Chart Widgets | Re-swept all 50 unique widgets across test projects via `Chart.getChart`; checked console errors and totals | PASS — zero new JS errors (same one pre-existing unrelated stale-CSS 404 as before), all totals sane |
| Chart Settings | Live filter apply/clear on "Issues by Priority" (728 → 128 → reverted to 728) | PASS — `BUG-DSH-005` fix still holds |
| Global Filters/Layout | Date-range persistence reconfirmed (`last_7_days` survives navigation); auto-refresh toggle OFF→ON→OFF; `BUG-DSH-024`'s grid fix reconfirmed at a **new, previously-untested 1600px viewport** | PASS — 0px overflow at 1600px too; confirmed the fix applies dashboard-wide since there is only one shared `.charts-grid` container for all rows |
| Saved Queries/Drilldown | `BUG-DSH-023` fix reconfirmed post-restart (role-restricted field present for permitted roles, absent for the excluded role); existing boolean/single-select/status custom-field-grouped widgets re-verified rendering correctly | PASS — no regression from the fix |
| Permissions | Summer Rain's "Issues by Status" widget still correctly scoped to her real visible count (1), not the full total; her direct request to "QA Private Project" still 403s | PASS |
| Public Sharing | Fresh share link generated and verified publicly accessible (200) in a clean unauthenticated browser context | PASS |
| Installation/Access | Add Chart button still correctly absent on the closed "QA Closed Test Project" | PASS |
| Spot-check: `BUG-DSH-018` | Simulated failed auto-refresh cycle — 10 cards correctly marked `.chart-card--stale` with amber border/badge, cleared once unblocked | PASS — fix still holds under a fresh simulated failure |

**Zero new failures found.** Both fix batches (10 bugs total across the two regression cycles) hold with no
detected side effects. German Language was not re-executed either cycle (already closed under `BUG-DSH-001`,
unrelated to any of the 2026-09-25 fixes).

## Final Overall Testing Status

- Redmine Version: 7.0.1.stable
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Date: 2026-09-25 (two retest + regression + closure cycles, same day)
- Status: **Complete** — `bugs/open/` is empty (all 17 bugs found across this plugin's history are fixed and
  closed) and a passed full final-cycle regression is on record, run twice this cycle — once after the first
  8-bug batch closed, and again after `BUG-DSH-023`/`024` were found and closed (this report, and
  `DASHBOARDS_HANDOFF.md`'s Run History). Both CLAUDE.md §10 conditions for `Complete` are met. Production
  feature ticket #120914 was also updated to status Done / 100% done, with a closing note listing all 16 linked
  defect relations. `TC-DSH-138` (stacked-bar-chart drill-down) remains the one loose thread: very likely covered
  by the developer's confirmed "3 stacked-by variants not implemented by design" statement, but not explicitly
  confirmed against that exact TC — flagged in `DASHBOARDS_HANDOFF.md` for future reference, not blocking
  `Complete` status since it was never logged as a bug.
