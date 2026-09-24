# Bug Index — Redmineflux Dashboards

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-DSH-001 | [FIXED 2026-09-09] Entire plugin UI (dashboard shell, Add Chart modal, chart card controls, all 3 Settings panel sections, toasts, validation error, tooltip, delete dialog, Share modal, and the public Share view incl. LIVE badge + date ranges) confirmed fully translated to German | Closed | Low | 7.0.1.stable | | bugs/closed/BUG-DSH-001.md |
| BUG-DSH-002 | [FIXED 2026-09-24] Chart-template query widget grouped by a custom field is missing Legend Position and Data Labels controls (standard-field grouping is unaffected) | Closed | Medium | 7.0.1.stable | #121131 | bugs/closed/BUG-DSH-002.md |
| BUG-DSH-004 | [FIXED 2026-09-24] Grouping-dimension selector offers a true multi-select custom field, which #120914 explicitly excludes from scope | Closed | Low | 7.0.1.stable | #121132 | bugs/closed/BUG-DSH-004.md |
| BUG-DSH-005 | [FIXED 2026-09-24] Saving Chart Settings on any chart-template query widget breaks live rendering to "No Data Available", resets accent colour, and Data Filters section should not exist | Closed | High | 7.0.1.stable | #121133 | bugs/closed/BUG-DSH-005.md |
| BUG-DSH-006 | [FIXED 2026-09-24] Chart Settings panel for a saved-query widget has no way to change Display as (template) or Group by after creation | Closed | Medium | 7.0.1.stable | #121134 | bugs/closed/BUG-DSH-006.md |
| BUG-DSH-007 | [FIXED 2026-09-24] Bar and Line chart-template widgets show the query name in the legend instead of the grouped category label (Doughnut/Pie are correct) | Closed | Medium | 7.0.1.stable | #121135 | bugs/closed/BUG-DSH-007.md |
| BUG-DSH-008 | [FIXED 2026-09-24] Drill-down silently returns the entire query instead of the clicked segment when grouped by a custom field without Redmine's "Used as a filter" enabled | Closed | High | 7.0.1.stable | #121136 | bugs/closed/BUG-DSH-008.md |
| BUG-DSH-009 | **[RETRACTED 2026-09-24]** ~~Project Progress (Gauge) widget ignores the global date-range filter~~ — user confirmed the Gauge is intentionally an all-time metric, not date-filtered | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-010 | **[RETRACTED 2026-09-24]** ~~"Our Queries" tab — a custom Chart Title typed in Add Chart is silently discarded~~ — false positive, the original test targeted the wrong DOM element (`#chartTitleInput`, a hidden Settings-panel field) instead of the real create-time field (`#chartTitle`); the feature works correctly | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-011 | Turning Auto Refresh off doesn't cancel the already-scheduled cycle — one more full-dashboard refresh fires after toggling off | Open | Low | 7.0.1.stable | #121272 | bugs/open/BUG-DSH-011.md |
| BUG-DSH-012 | **[RETRACTED 2026-09-24]** ~~Saved-query widgets ignore both global filter bar controls entirely~~ — user confirmed saved-query widgets are intentionally governed solely by their own saved query's criteria, not the dashboard's global filters | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-013 | Dashboard charts disclose the full unrestricted project issue count (725) to a role with maximally restricted issue visibility (sees 1 issue) — 725x aggregate data leak | Open | High | 7.0.1.stable | #121273 | bugs/open/BUG-DSH-013.md |
| BUG-DSH-014 | Dashboard widgets can be added on a closed project — plugin doesn't enforce Redmine's "closed = read-only" convention | Open | Low | 7.0.1.stable | #121274 | bugs/open/BUG-DSH-014.md |

## Notes
- Open bugs: bugs/open/ — 3 bugs (BUG-DSH-011/013/014), found during the 2026-09-24 full final-cycle
  regression (CLAUDE.md §27). Most significant: `BUG-DSH-013` (High, data-visibility leak).
- **Retracted (not real bugs — do not re-file): `BUG-DSH-009`, `BUG-DSH-010`, `BUG-DSH-012`.** All three were
  filed 2026-09-24 during the final-cycle regression, then retracted the same day. `BUG-DSH-009` and
  `BUG-DSH-012`: the user (product owner) confirmed both are intentional design — the Project Progress Gauge is
  deliberately an all-time metric, not scoped to the date-range filter; saved-query widgets are deliberately
  governed solely by their own saved query's own criteria, not by the dashboard's global filter bar.
  `BUG-DSH-010`: a **false positive caused by a testing error, not a product defect or a design question** — the
  original investigation targeted the wrong DOM element (`#chartTitleInput`, a hidden Settings-panel field that
  happens to share a similar id) instead of the real create-time title field (`#chartTitle`); once targeted
  correctly, the feature works exactly as expected. Their `.md` files and screenshots were deleted (none were
  real defects); these three IDs are now retired, same pattern as the pre-existing `BUG-DSH-003` gap in this
  plugin's numbering — do not reuse 009, 010, or 012 for a future bug. See `DASHBOARDS_MEMORY.md`'s "Confirmed
  Working" section and "Known Quirks" (for the `#chartTitleInput` vs `#chartTitle` selector trap specifically),
  and `DASHBOARDS_HANDOFF.md`'s Run History for the full retraction record.
- Closed bugs: bugs/closed/ — 8 bugs (BUG-DSH-001–002/004–008), all confirmed FIXED and synced to production.
- Screenshots: screenshots/<BUG-ID>/
- BUG-DSH-002/004/005/006/007/008 all linked as defects to production Test Case #121093 ("Custom Dashboard: Sanity check — chart templates and custom field grouping for saved queries (#120914)"), Run #577, Test Suite #249, Environment "Window 11 + Chrome" — 2026-09-23. All assigned to Prashant Chaurasia.
- All 6 (002/004/005/006/007/008) retested and confirmed FIXED on `redmine-docker-700` (localhost:3010) on 2026-09-24 — see each bug's own "Retest — 2026-09-24" section. Closed 2026-09-24: each linked production issue (#121131–#121136) synced to status Done / 100% done, then all 6 local files moved from `bugs/open/` to `bugs/closed/` per CLAUDE.md §5/§12, per explicit user approval.
- BUG-DSH-011/013/014 found 2026-09-24 during the full final-cycle regression pass (triggered when `bugs/open/` went
  empty after the above closures). Reported to production 2026-09-24 as issues #121272/#121273/#121274 respectively,
  each linked as a defect to the same production Test Case #121093, Run #577, Test Suite #249, Environment
  "Window 11 + Chrome" used for the earlier 002/004/005/006/007/008 batch (that testcase already had 6 defects
  linked from the earlier session; these 3 append to the same list). All three assigned to Prashant Chaurasia
  (410). Note: none of the three was actually found via TC #121093's own #120914-scope steps (BUG-DSH-011 is an
  auto-refresh timing defect, BUG-DSH-013 cites TC-DSH-095/096 in the Permissions suite, BUG-DSH-014 cites
  TC-DSH-106 in the Installation/Access suite) — linking them to #121093 anyway was an explicit user instruction
  after being asked to confirm the mismatch, not an inferred/assumed match.
