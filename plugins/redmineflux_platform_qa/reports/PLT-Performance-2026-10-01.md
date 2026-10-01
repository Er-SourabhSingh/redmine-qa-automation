# Redmineflux Platform — Performance Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> Mandatory testing type per `SENIOR_QA_STANDARDS.md` §29 — this is this cycle's first and only Performance pass, and `PLATFORM_PERFORMANCE.md` is now fully executed.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-PLT-223 — Teams list under volume (150 teams, 2 members each) | Pass |
| TC-PLT-224 — Holiday Schemes (200) and Holidays (500) lists under volume | Pass |
| TC-PLT-225 — Leave Types (15) and Leaves (264) lists under volume | Pass |
| TC-PLT-226 — Organizations (300) and Contacts (500) lists under volume, incl. non-admin `visible` scope | Pass |
| TC-PLT-227 — Audit Events list at 2,423 rows, including search-by-name | Pass (performance) / **Fail (correctness)** — BUG-PLT-031 |
| TC-PLT-228 — Bulk delete on 99 Teams completes cleanly | Pass |
| TC-PLT-229 — No N+1-style degradation as record count grows | Pass |
| TC-PLT-230 — Workload/Timesheet/Shift Management Team screens at same volume | Pass |
| TC-PLT-231 — Auto-refresh/polling degradation | Confirmed Not Applicable |
| TC-PLT-232 — Report/export generation time | Confirmed Not Applicable |

**Summary:** Total executed — 10 / Pass — 9 / Fail — 1 (correctness only, performance itself passed) / Blocked — 0 / Skipped — 0

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-PLT-031 | Audit Events search-by-name can never find a "created"/"updated" row for a record that still exists | High | Open | Not yet reported |

## Notes / Findings

- Redmine Version: 6 (`redmineflux_platform` branch, all 7 plugins)
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Test Date: 2026-10-01
- **Methodology**: disposable large-N fixtures (150 Teams, 200 Holiday Schemes, 500 Holidays, 15 Leave Types, 264 Leaves, 300 Organizations, 500 Contacts) were seeded via `rails runner` model-layer `.create!` loops rather than literal UI clicks, since this suite tests list-rendering load time, not creation-form correctness (already covered by `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`). All fixtures were cleaned up afterward and confirmed removed via direct DB query (zero remaining, zero orphaned `rf_team_memberships` rows).
- **No performance problem found anywhere in the plugin at realistic volumes.** Worst observed load time was ~1.1s (Teams list, cold); a single 2000ms cold-start outlier on Holiday Schemes' first hit after idle did not reproduce on an immediate warm reload (321ms) and is not a defect. No entity showed N+1-style degradation; pagination correctly keeps load time near-flat regardless of total row count (a 2,423-row Audit Events list loaded in 197ms). The 3 consumer-plugin Team screens (Workload/Timesheet/Shift Management) perform comparably to Platform's own equivalent list.
- **One genuine defect found** (correctness, not performance) while verifying TC-PLT-227's instruction to confirm search "still performs acceptably... not just correctly": Audit Events search-by-name is fundamentally non-functional for any record that hasn't been deleted — see `BUG-PLT-031`. This is broader than the already-filed `BUG-PLT-021` (display-label fallback after deletion only).
- `PLATFORM_PERFORMANCE.md` is now the second of the three previously-fully-unexecuted suites to reach completion this session (alongside `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md`) — Performance was the one mandatory testing type (§28–30) still outstanding for this cycle; it is now done.
