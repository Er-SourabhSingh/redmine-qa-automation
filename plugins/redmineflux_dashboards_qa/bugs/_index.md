# Bug Index — Redmineflux Dashboards

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-DSH-001 | [FIXED 2026-09-09] Entire plugin UI (dashboard shell, Add Chart modal, chart card controls, all 3 Settings panel sections, toasts, validation error, tooltip, delete dialog, Share modal, and the public Share view incl. LIVE badge + date ranges) confirmed fully translated to German | Closed | Low | 7.0.1.stable | | bugs/closed/BUG-DSH-001.md |
| BUG-DSH-002 | Chart-template query widget grouped by a custom field is missing Legend Position and Data Labels controls (standard-field grouping is unaffected) | Open | Medium | 7.0.1.stable | #121131 | bugs/open/BUG-DSH-002.md |
| BUG-DSH-004 | Grouping-dimension selector offers a true multi-select custom field, which #120914 explicitly excludes from scope | Open | Low | 7.0.1.stable | #121132 | bugs/open/BUG-DSH-004.md |
| BUG-DSH-005 | Saving Chart Settings on any chart-template query widget breaks live rendering to "No Data Available", resets accent colour, and Data Filters section should not exist | Open | High | 7.0.1.stable | #121133 | bugs/open/BUG-DSH-005.md |
| BUG-DSH-006 | Chart Settings panel for a saved-query widget has no way to change Display as (template) or Group by after creation | Open | Medium | 7.0.1.stable | #121134 | bugs/open/BUG-DSH-006.md |
| BUG-DSH-007 | Bar and Line chart-template widgets show the query name in the legend instead of the grouped category label (Doughnut/Pie are correct) | Open | Medium | 7.0.1.stable | #121135 | bugs/open/BUG-DSH-007.md |
| BUG-DSH-008 | Drill-down silently returns the entire query instead of the clicked segment when grouped by a custom field without Redmine's "Used as a filter" enabled | Open | High | 7.0.1.stable | #121136 | bugs/open/BUG-DSH-008.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
- BUG-DSH-002/004/005/006/007/008 all linked as defects to production Test Case #121093 ("Custom Dashboard: Sanity check — chart templates and custom field grouping for saved queries (#120914)"), Run #577, Test Suite #249, Environment "Window 11 + Chrome" — 2026-09-23. All assigned to Prashant Chaurasia.
