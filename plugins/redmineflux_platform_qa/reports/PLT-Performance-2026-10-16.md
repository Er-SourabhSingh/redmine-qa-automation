# Redmineflux Platform — Performance Testing Report — 2026-10-16

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> This is a follow-up Performance pass, run at the user's explicit request to confirm the new 32-filter
> `PLATFORM_FILTERS.md` suite (added the same cycle) introduced no regression at the environment's current data
> volume. It does not re-run the 2026-10-01 large-N (150–2,423 row) stress test, which remains valid.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-PLT-357 | PASS — no performance regression from the 32 new filters at current data volume |

**Summary:** Total executed — 1 Pass / 0 Fail / 0 Blocked / 0 Skipped (1 of 1 new TC executed).

## Bugs / Defects Found

None.

## Notes / Findings

- **Redmine Version:** 6 (Rails 7.2.3.1)
- **Environment:** `redmine6platform-redmine-1`, `localhost:3013`
- **Test Date:** 2026-10-16

### What was checked

- Holidays' heaviest filter combination (5 filters at once — `scheme`+`year`+`holiday_type`+`recurring`+`status`):
  **122ms** load time.
- Audit Events at `per_page=100` (the largest dataset on this plugin, 175 rows total): **320ms** load time.

Both are plain single-table `WHERE` clauses (`Entry#apply_filters` reduces one lambda per declared filter over
the relation — no joins, no N+1-prone association loading), so there was no architectural reason to expect a
regression; this pass confirms that expectation held in practice.

### Why this is a spot-check, not a fresh stress test

The 2026-10-01 Performance report (`PLT-Performance-2026-10-01.md`) already established the real ceiling for this
plugin — list screens stayed responsive up to 2,423 rows across all 7 original entities, with bulk fixtures
seeded via `rails runner` specifically for that purpose. Current live data volumes (max 175 rows, Audit Events)
remain far below that ceiling, so re-running a full large-N stress test today would not add new information — the
open question this cycle was narrower and more specific: *did adding 32 new filters introduce a query pattern
(an N+1, a missing index, an unindexed `LIKE`) that degrades performance even at today's modest volume?* The
answer, confirmed above, is no.

**Recommendation for a future cycle**: if/when this environment's live data volume grows substantially (hundreds
of Organizations, Contacts, or Audit Events from real usage rather than disposable test fixtures), re-run a large-N
stress test specifically against the Filters suite's heaviest combinations (Holidays' 5-way, Contacts' 5-way) to
confirm the same headroom holds once there's enough real data for a `WHERE` clause with no supporting index to
start showing a cost.
