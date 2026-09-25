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
| BUG-DSH-011 | [FIXED 2026-09-25] Turning Auto Refresh off doesn't cancel the already-scheduled cycle — one more full-dashboard refresh fires after toggling off | Closed | Low | 7.0.1.stable | #121272 | bugs/closed/BUG-DSH-011.md |
| BUG-DSH-012 | **[RETRACTED 2026-09-24]** ~~Saved-query widgets ignore both global filter bar controls entirely~~ — user confirmed saved-query widgets are intentionally governed solely by their own saved query's criteria, not the dashboard's global filters | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-013 | [FIXED 2026-09-25] Dashboard charts disclose the full unrestricted project issue count (725) to a role with maximally restricted issue visibility (sees 1 issue) — 725x aggregate data leak | Closed | High | 7.0.1.stable | #121273 | bugs/closed/BUG-DSH-013.md |
| BUG-DSH-014 | [FIXED 2026-09-25] Dashboard widgets can be added on a closed project — plugin doesn't enforce Redmine's "closed = read-only" convention | Closed | Low | 7.0.1.stable | #121274 | bugs/closed/BUG-DSH-014.md |
| BUG-DSH-015 | **[RETRACTED 2026-09-25]** ~~A view-only role can create/delete/reposition dashboard widgets~~ — vendor KB confirms "any user with access to the project" has equal dashboard capabilities by design; no documented restriction was violated | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-016 | [FIXED 2026-09-25] The global date range is not actually remembered across navigation — silently resets to the default "Last 30 days" instead of the last-applied range | Closed | Medium | 7.0.1.stable | #121283 | bugs/closed/BUG-DSH-016.md |
| BUG-DSH-017 | **[RETRACTED 2026-09-25]** ~~Invalid global custom date range silently rejected with no error message~~ — false positive/testing error, a toast error *does* appear but auto-dismisses too fast for a static DOM check to catch | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-018 | [FIXED 2026-09-25] A failed widget refresh leaves the chart silently showing stale data, with no visible error to the user | Closed | Medium | 7.0.1.stable | #121284 | bugs/closed/BUG-DSH-018.md |
| BUG-DSH-019 | [FIXED 2026-09-25] Any authenticated user can open ANY private project's Analytics Dashboard and see its real chart data, even with zero project membership | Closed | Critical | 7.0.1.stable | #121285 | bugs/closed/BUG-DSH-019.md |
| BUG-DSH-020 | [FIXED 2026-09-25, NARROWED 2026-09-25] A member who creates a public share link cannot revoke it themselves — only an Administrator can, with no self-service revoke or audit trail | Closed | Medium | 7.0.1.stable | #121286 | bugs/closed/BUG-DSH-020.md |
| BUG-DSH-021 | [FIXED 2026-09-25] A chart's User Filter dropdown discloses the full instance-wide user list (20 accounts) to a role with maximally restricted issue visibility | Closed | Medium | 7.0.1.stable | #121287 | bugs/closed/BUG-DSH-021.md |
| BUG-DSH-022 | **[RETRACTED 2026-09-25]** ~~A restricted-visibility user's public share link exposes the project's full, unrestricted data~~ — consistent with this plugin's documented-elsewhere design of showing project-wide, unscoped data regardless of viewer (same basis as `BUG-DSH-013`, which remains open as its own internal-session finding) | Retracted | n/a | 7.0.1.stable | | n/a — see `DASHBOARDS_MEMORY.md` |
| BUG-DSH-023 | [FIXED 2026-09-25] The chart-template "Group by" selector never offered a role-restricted custom field, even for a viewer whose own role is in the field's allowed-roles list — violated #120914's "only fields visible to the current user" requirement | Closed | Medium | 7.0.1.stable | #121311 | bugs/closed/BUG-DSH-023.md |
| BUG-DSH-024 | [FIXED 2026-09-25] Dashboard grid's own computed column widths exceeded the container's actual width, cutting off the rightmost card in every row with no right-side margin — was reproducible at 1280×720/1440×900/1920×1080 | Closed | Medium | 7.0.1.stable | #121318 | bugs/closed/BUG-DSH-024.md |

## Notes
- **Open bugs: bugs/open/ — 0 bugs. `bugs/open/` is empty as of 2026-09-25.** Per CLAUDE.md §10/§12, this alone
  does not make the plugin `Complete` — a full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) must be run
  and recorded first. Not yet done for this specific closure cycle (an earlier full regression this same day
  predates the discovery of `BUG-DSH-023`/`024`, so it doesn't cover their fix areas).
- **`BUG-DSH-023` closed 2026-09-25**: a role-restricted custom field could never be used as a chart-grouping
  dimension by anyone, even a viewer whose role explicitly passed the restriction. Found while re-investigating
  `TC-DSH-165`'s original PASS verdict at the user's request (that verdict was corrected to FAIL). Reported to
  production as #121311. **Retested FIXED after a container restart** (`docker restart
  redmine-docker-700-redmine-1`, per explicit user request): confirmed with a clean per-role comparison — Admin
  and Daisy Skye (both hold a qualifying role) now see the field, Summer Rain (does not hold a qualifying role)
  correctly still does not. Production #121311 synced to Done/100%, local file moved to `bugs/closed/`.
- **`BUG-DSH-024` closed 2026-09-25**: the dashboard grid's own computed `grid-template-columns` pixel widths
  summed to more than the container's actual width (225px/235px/29px overflow at 1280×720/1440×900/1920×1080),
  cutting off the rightmost card in every row. Reported to production as #121318. **Retested FIXED after a
  second container restart** (per explicit user request): confirmed 0px overflow at all 3 original viewport
  widths, columns now evenly and correctly distributed, symmetric margins confirmed visually. Production
  #121318 synced to Done/100%, local file moved to `bugs/closed/`.
- Test Case #121093 now shows **16 total linked defects — all 16 closed.**
- Closed 2026-09-25: `BUG-DSH-011/013/014/016/018/019/020/021` (8 bugs) — all retested and confirmed FIXED on
  `redmine-docker-700` per explicit user request ("now retest bugs"), each production issue (#121272/#121273/
  #121274/#121283/#121284/#121285/#121286/#121287) synced to Done/100%, then all 8 local files moved from
  `bugs/open/` to `bugs/closed/` per CLAUDE.md §5/§12, per explicit user approval ("okay do it"). `BUG-DSH-018`'s
  first retest attempt was invalid (used the header Refresh button, which is a full page reload and never
  exercises the failing per-widget-refresh path) — corrected after the user asked to check the production
  issue's journal first, where the developer's own fix note explained the mistake and pointed at the auto-refresh
  cycle instead; retested correctly and confirmed fixed. A full final-cycle regression (`SENIOR_QA_STANDARDS.md`
  §27) was then run across every suite — zero new failures — before closure. **Most significant fix:
  `BUG-DSH-019` (Critical — cross-project/non-member data disclosure, no access check at all on the dashboard
  route) is now closed.**
- **Retracted (not real bugs — do not re-file): `BUG-DSH-009`, `BUG-DSH-010`, `BUG-DSH-012`, `BUG-DSH-015`,
  `BUG-DSH-017`, `BUG-DSH-022`.** `BUG-DSH-009`/`012`/`015`/`022` are **confirmed intentional design** (009/012 by
  direct product-owner confirmation; 015/022 by the vendor KB's own documented "equal capabilities, project-wide
  data" model, checked directly 2026-09-25 — no requirement anywhere states dashboard actions should be role-
  restricted or that public links should be sharer-scoped). `BUG-DSH-010`/`017` are **false positives from testing
  errors** — 010 typed into the wrong hidden DOM element across all 6 "reproductions"; 017 missed a real toast
  error that auto-dismisses too fast for a static (non-`MutationObserver`) DOM check, the same category of miss
  already on record for other toasts in this plugin. `BUG-DSH-020` was **narrowed, not retracted** — its "any role
  can share" half rests on the same now-confirmed-intentional basis as 015, but its "creator cannot self-revoke"
  half is a real, narrower finding the app's own UI text corroborates; severity lowered High → Medium accordingly.
  These six retired IDs (009/010/012/015/017/022) are not to be reused. See `DASHBOARDS_MEMORY.md`'s "Confirmed
  Working"/"Known Quirks" sections and `DASHBOARDS_HANDOFF.md`'s Run History for the full retraction record.
- Closed bugs: bugs/closed/ — 17 bugs total (BUG-DSH-001/002/004/005/006/007/008 from earlier cycles, plus
  BUG-DSH-011/013/014/016/018/019/020/021/023/024 closed 2026-09-25), all confirmed FIXED and synced to production.
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
- BUG-DSH-016/018/019/020/021 reported to production 2026-09-25 as issues #121283/#121284/#121285/#121286/#121287
  respectively, per explicit fresh approval, each linked as a defect to the same production Test Case #121093,
  Run #577, Test Suite #249, Environment "Window 11 + Chrome" (this testcase now shows 14 linked defects total).
  All five assigned to Prashant Chaurasia (410). `BUG-DSH-019` (Critical) mapped to Priority=Blocker(4)/Defect
  Severity=Critical/Defect priority=Urgent/Defect Type=Security; the other four mapped to Priority=Medium(2)/
  Defect Severity=Medium-severity/Defect priority=Medium, Defect Type=Functional (016/018/020) or Security (021).
