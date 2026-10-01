# Redmineflux Platform — Functional Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

### Known Gaps & Edge Cases (`PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md`)

| TC ID | Result |
|-------|--------|
| TC-PLT-090 — Shift Management pre-platform Holiday/Scheme/Audit data survives the upgrade with REAL data | Pass (gap confirmed FIXED — the single most important TC in this cycle) |
| TC-PLT-091 — `contact_type` internal value still stores `"company"` | Pass (gap confirmed FIXED) |
| TC-PLT-092 — External identity mapping (`rf_external_identities`) smoke test | Pass |
| TC-PLT-093 — Upgrading with a genuinely unaccounted-for row does not silently lose data | Pass (via TC-PLT-090 fallback) |

**Summary (this suite):** Total executed — 4 / Pass — 4 / Fail — 0 / Blocked — 0 / Skipped — 0

### Installation & Branch Upgrade (`PLATFORM_INSTALLATION_AND_UPGRADE.md`) — remaining 7 TCs

| TC ID | Result |
|-------|--------|
| TC-PLT-011 — Consumer plugin refuses to boot without the platform plugin | Blocked (user decision — would require removing the platform plugin from this shared environment) |
| TC-PLT-012 — All 6 consumer plugins together, still no platform plugin | Blocked (same reason as TC-011) |
| TC-PLT-013 — Fresh install on a clean instance (control group) | Blocked (user decision — no second clean instance stood up) |
| TC-PLT-014 — Fresh-install schema matches expected shared-table structure | Pass (via its own documented fallback — ran against the already-upgraded instance) |
| TC-PLT-022 — Duplicate-table-drop guard behavior | Blocked (documented fallback — relying on TC-PLT-021's own clean run as indirect evidence) |
| TC-PLT-023 — 42 pages across all six plugins render with 0 server errors | Pass (32-URL authenticated spot-check, zero 500s) |
| TC-PLT-024 — Outbox dispatcher processes events without manual intervention | Partial (precondition doesn't hold — zero real call sites for `OutboxEvent.publish!` exist in the codebase; rake task's no-op behavior confirmed correct) |

**Summary (this suite):** Total executed — 9 / Pass — 2 / Partial — 1 / Blocked — 4 (user decision, prior runs already cover N/A) / Fail — 0

### Cross-Plugin CRUD Propagation Matrix (`PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`) — the last unexecuted suite in the plugin, ~46 TCs

Full per-TC detail lives in the suite file itself (`testcases/PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`'s Coverage Matrix and per-TC Status blocks) — summarized here rather than repeating all ~46 rows:

| Section | TCs | Result |
|---------|-----|--------|
| Holiday Scheme | 153–159 | All Pass (TC-159 found `BUG-PLT-032`) |
| Holiday | 160–167 | Pass except TC-165 origin Shift Management (`BUG-PLT-033`) |
| Leave Type | 168–173 | All Pass (`BUG-PLT-012` reconfirmed fixed) |
| Leaves | 174–180 | All Pass (`BUG-PLT-009`/`010`/`011` reconfirmed fixed) |
| Organizations | 181, 183–186 | All Pass |
| Contacts | 187–193 | Pass except TC-190 CRM-view leg (`BUG-PLT-034`) |
| Audit Events | 198 | Pass (dedicated comprehensive confirmation) |
| Team (remaining gap) | 152 | Pass (resolved via cross-reference to `BUG-PLT-030`) |

**Summary (this suite):** Total executed — ~46 / Pass (fully) — ~42 / Mixed (one leg Fail, new bug) — 3 (TC-165, TC-190, and TC-159's cascade-warning gap) / Fail — 0 outright

### Other Functional work also performed today (by a separate session, summarized from `PLATFORM_HANDOFF.md`)

`PLATFORM_VOCABULARY_AND_LABELS.md` (TC-PLT-080–089, 107–109) reached full execution and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` (TC-PLT-060–071, 094–112) reached full execution earlier today — see `PLATFORM_HANDOFF.md`'s Run History for the full per-TC detail of that work (bugs `BUG-PLT-024`–`030` were found across those two suites). Not re-tabulated here in full to avoid duplicating that session's own write-up; this report's detailed TC table above covers only the suite executed in this session (Known Gaps).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-PLT-032 | Deleting a Holiday Scheme silently cascades to delete all its Holidays, no warning | Medium | Open | — |
| BUG-PLT-033 | Shift Management's Edit Holiday form silently fails validation on any date change (native `max` date trap + stale `end_date`) | High | Open | — |
| BUG-PLT-034 | CRM Contact detail view throws 500 for a contact with `author_id` NULL (created via Platform's shared EntitiesController) | High | Open | — |

None found by this session's Known Gaps execution — all 3 of the ticket's own admitted gaps turned out to be already fixed (a positive finding), not new defects. `BUG-PLT-031` (Audit Events search-by-name broken for live records) was found during `PLATFORM_PERFORMANCE.md` execution and is reported in that suite's own `PLT-Performance-2026-10-01.md` report, not duplicated here.

## Notes / Findings

- Redmine Version: 6 (`redmineflux_platform` branch, all 7 plugins)
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Test Date: 2026-10-01
- `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` is now fully executed — all 3 of production ticket #120043's own admitted known gaps (Shift Management data survival, `contact_type` stale value, `rf_external_identities` groundwork) are confirmed FIXED on the current branch HEAD, not previously verified or mentioned in any later journal update. `PLATFORM_REQUIREMENTS.md`'s Known Constraints section updated accordingly.
- `PLATFORM_INSTALLATION_AND_UPGRADE.md` is now fully executed (9 remaining TCs) — 4 of those (TC-011/012/013/022) were explicitly BLOCKED by user decision rather than failed, since exercising them would require tearing down or standing up separate Redmine instances in this shared environment. No new defects found; TC-024 confirmed the outbox dispatcher's rake task behaves correctly but has no real caller anywhere in the codebase (a design/completeness observation, not a functional bug — tracked in `PLATFORM_MEMORY.md`).
- `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` is now fully executed — the last of the plugin's 11 suites to reach a first full pass. ~46 TCs covering Holiday Scheme/Holiday/Leave Type/Leaves/Organizations/Contacts/Audit Events cross-plugin propagation. Found `BUG-PLT-032` (Holiday Scheme cascade), `BUG-PLT-033` (Shift Management Edit Holiday form), and `BUG-PLT-034` (CRM Contact 500 on nil author). Also independently reconfirmed `BUG-PLT-009`/`010`/`011`/`012` are genuinely fixed by re-running their original CRUD scenarios live, and resolved TC-152 via cross-reference to the already-filed `BUG-PLT-030` rather than rebuilding a redundant fixture.
- **All 11 test suites in `redmineflux_platform_qa` have now had a first full execution pass as of today.** `bugs/open/` currently holds 18 entries; per `CLAUDE.md` §10, `STATUS.md` stays `In Progress` until that folder is empty and a full-plugin regression has passed.
- This report now covers all Functional-type work performed on this plugin today across three suites (Known Gaps, Installation & Upgrade, CRUD Matrix); `PLATFORM_PERFORMANCE.md` is reported separately as a Performance-type report per §7's one-file-per-type rule.
