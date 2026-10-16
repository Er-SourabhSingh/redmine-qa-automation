# Redmineflux Platform — Security Testing Report — 2026-10-16

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> This is a follow-up Security pass, run at the user's explicit request immediately after `BUG-PLT-052`,
> `BUG-PLT-053`, and `BUG-PLT-054` were fixed and synced on production the same day — per
> `SENIOR_QA_STANDARDS.md` §28's own rule, the newly-enforced permission was checked at every entry point that
> reaches the same model, not re-derived from the web UI retest alone.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-PLT-354 | **FAIL — `manage_rf_platform_leaves` is completely unenforced on two separate REST API endpoints (Workload's and Shift Management's own leave-creation routes), confirmed live** |
| TC-PLT-355 | PASS — free-text filter parameters resist SQL injection |
| TC-PLT-356 | PASS — private-record isolation unaffected by the `open_to_all` removal |

**Summary:** Total executed — 2 Pass / 1 Fail / 0 Blocked / 0 Skipped (3 of 3 new TCs executed).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-WKL-004 | `POST /api/workload/leaves` never checks `manage_rf_platform_leaves` — a zero-permission user can create their own leave via this REST API endpoint | Medium | Open | Not yet reported |
| BUG-SFM-003 | `POST /shift_management/api/v1/leave` never checks `manage_rf_platform_leaves` — identical bypass via Shift Management's own REST API endpoint | Medium | Open | Not yet reported |

## Notes / Findings

- **Redmine Version:** 6 (Rails 7.2.3.1)
- **Environment:** `redmine6platform-redmine-1`, `localhost:3013`
- **Test Date:** 2026-10-16

### Why this pass exists

`BUG-PLT-052`/`BUG-PLT-054` were just confirmed fixed and closed on production the same day, based on a web-UI
retest (a zero-permission user correctly 403s on the Platform web form). `SENIOR_QA_STANDARDS.md` §28 explicitly
warns against stopping there: *"a hidden button/menu link is not evidence access is actually blocked — always
send the request directly too."* This pass applied that rule specifically to the just-fixed permission, checking
every other known entry point into the same `Leave` model rather than trusting that a single web-form retest
proved the defect class was gone everywhere.

### The finding

Both `redmineflux_workload`'s `/api/workload/leaves` and `redmineflux_shift_management`'s
`/shift_management/api/v1/leave` POST endpoints build and save a `RedminefluxPlatform::Leave` record directly,
with no check of `manage_rf_platform_leaves` (or any Platform permission) for a user filing their own leave —
only `before_action :require_login` (or equivalent) gates them. A user with zero `rf_platform` permissions,
confirmed via `rails runner`, successfully created a real Leave record through **both** endpoints once a Policy
Band was present (the already-fixed `BUG-PLT-053` band check does correctly fire regardless of entry point,
proving it is genuinely model-level — the gap is specific to the permission check, which is controller-level and
was only ever added to Platform's own `EntitiesController`).

**This means `BUG-PLT-054`'s fix is real but incomplete**: it closes the gap on the web form, the only surface
the original bug report tested, but the same permission remains fully bypassable through either consumer
plugin's own REST API. Filed as two separate bugs (`BUG-WKL-004`, `BUG-SFM-003`) since the broken code lives in
each consumer plugin's own controller, not in Platform itself — same root cause, same day, not reported to
production yet pending the user's decision on how to track this against the already-closed `BUG-PLT-054`.

### Coverage performed, per `SENIOR_QA_STANDARDS.md` §28's minimum bar (this session's additions)

- **Authorization/permission enforcement at the endpoint, not just the UI** — TC-PLT-354, the exact gap this
  rule exists to catch; found by sending the request directly to two REST API controllers instead of trusting
  the web-form retest.
- **Input sanitization (SQL)** — TC-PLT-355, extended to a free-text-backed `:select` filter param added this
  cycle (`organization_contact_links`' `role` filter), not just the pre-existing `search` box.
- **Cross-tenant / private-record isolation regression check** — TC-PLT-356, confirms the `open_to_all` removal
  did not loosen Organizations'/Contacts' pre-existing (and separate) private-record visibility rule.

### Relationship to the full `PLATFORM_SECURITY.md` suite

TC-PLT-210–222 (13 TCs, 2026-10-01) are not re-executed here — see that day's own report
(`PLT-Security-2026-10-01.md`) for the full original pass. This report covers only the 3 new TCs added
2026-10-16 as a direct, targeted follow-up to the same day's permission fixes.
