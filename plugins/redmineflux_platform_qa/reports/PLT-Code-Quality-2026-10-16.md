# Redmineflux Platform — Code Quality Testing Report — 2026-10-16

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> Per `SENIOR_QA_STANDARDS.md` §30, code quality review is not a separate TC suite — it is folded into
> root-cause investigations where plugin source is actually read. This report documents the review performed
> while retesting `BUG-PLT-052`/`053`/`054` (commit `d8a224d`) and `BUG-WKL-003` (commit `1fcc816`), plus the
> investigation that found `BUG-WKL-004`/`BUG-SFM-003`.

## Source reviewed this session

| File | Reason read |
|---|---|
| `lib/redmineflux_platform/shared_entities.rb` (diff `3e9fc42..d8a224d`) | Confirming `BUG-PLT-052`/`054`'s fix — the `open_to_all`/`open_to_all?` mechanism's removal |
| `app/models/redmineflux_platform/leave.rb` (diff `3e9fc42..d8a224d`) | Confirming `BUG-PLT-053`'s fix — `leave_type_is_one_the_band_permits` now refusing a zero-band submission |
| `db/migrate/048_grant_calendar_and_leave_permissions_to_working_roles.rb` (full file) | Understanding how the permission fix avoids breaking existing working roles |
| `app/services/rf_workload_gantt_data_service.rb`, `app/services/rf_workload_capacity_calculator.rb` (`redmineflux_workload`) | Confirming `BUG-WKL-003`'s fix — both now deferring to the new shared `Leave.taking_time_off` scope |
| `app/controllers/apis/workload_leaves_controller.rb`, `app/controllers/apis/workload_base_controller.rb` (`redmineflux_workload`) | Root-cause investigation for the `BUG-WKL-004` finding |
| `app/controllers/shift_management_api/v1/leave_controller.rb` (`redmineflux_shift_management`) | Root-cause investigation for the `BUG-SFM-003` finding |
| Full `open_to_all` grep across `redmineflux_platform`'s entire source tree | Dead-code check — confirming no orphaned reference to the removed mechanism remained anywhere in application code |

## Findings

| Finding | Category (§30) | Severity | Bug reference |
|---|---|---|---|
| `manage_rf_platform_leaves` is enforced in exactly one of three code paths that can create a `Leave` record (Platform's own `EntitiesController`) — Workload's and Shift Management's own REST API controllers call `RedminefluxPlatform::Leave.new(...).save` directly with no equivalent check | Consistent validation — "the same rule... enforced identically in the UI and at the API/endpoint level" (§30's own named example) | Medium | `BUG-WKL-004`, `BUG-SFM-003` |

No other defects from the §30 checklist were found in the files reviewed this session:

- **Error handling** — `Leave.no_band_message` defensively handles a `person` argument that might not respond to
  `.name` (`person.respond_to?(:name) ? person.name : person.to_s`), so the new error path cannot itself raise.
  No unhandled exceptions or raw 500s were observed anywhere in this session's retesting.
- **Dead/orphaned code** — a full grep for `open_to_all` across the entire `redmineflux_platform` source tree
  (excluding `test/`) found exactly one remaining match, a code *comment* explaining the historical context
  directly above the new, correctly-rewritten access-control comment block — not a dead code path, a flag nobody
  reads, or leftover branch logic. The removal was clean.
- **Defensive handling of external dependencies** — not directly exercised this session (no mail server/Redis/PDF
  dependency involved in the files reviewed); `Mailer::DeliveryJob` for the new leave-creation notification was
  observed enqueueing and completing successfully via `Async(mailers)` during live fixture creation, with no
  failure path exercised.
- **Migration safety** — `048_grant_calendar_and_leave_permissions_to_working_roles.rb` reviewed in full and
  confirmed to follow every safety property its own header documents: ADD-ONLY (`held + additions`, never a
  removal), idempotent (`additions = additions.uniq - held`, re-running grants nothing a second time), uses
  `update_column` rather than `save` specifically so a role's current permission set is never re-validated against
  today's `Redmine::AccessControl` registry (avoiding the exact "plugin upgrade order decides whether a migration
  can run" trap `PLATFORM_MEMORY.md` already documents from an earlier incident), and explicitly, correctly
  irreversible (`down` is a no-op with a stated reason: an added permission can't be distinguished from one an
  administrator granted by hand afterward). Verified live: all 14 non-builtin roles on this environment received
  exactly the permissions the migration's own `calendar_reader?`/`leave_filer?` criteria predict, confirmed via a
  direct `Role#allowed_to?` sweep — no role received more or fewer permissions than its existing permission set
  should have earned it.

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-WKL-004 | `POST /api/workload/leaves` never checks `manage_rf_platform_leaves` | Medium | Open | Not yet reported |
| BUG-SFM-003 | `POST /shift_management/api/v1/leave` never checks `manage_rf_platform_leaves` | Medium | Open | Not yet reported |

## Notes / Findings

- **Redmine Version:** 6 (Rails 7.2.3.1)
- **Environment:** `redmine6platform-redmine-1`, `localhost:3013`
- **Test Date:** 2026-10-16
- This report intentionally does not duplicate the full reproduction/evidence detail already in
  `BUG-WKL-004.md`/`BUG-SFM-003.md` and `reports/PLT-Security-2026-10-16.md` — it records the code-quality angle
  (which §30 checklist item this is, and why the model-level fix couldn't have caught it) as the distinct value
  this review type adds beyond the black-box finding.
- Recommended fix direction (not yet confirmed with the dev): either route both REST controllers' `create`
  actions through `RedminefluxPlatform::SharedEntities.find('leaves').manage?(User.current)` the same way
  Platform's own `EntitiesController` does, or — if these two endpoints are meant to remain architecturally
  independent of the `Entry` abstraction — add an explicit, equivalent `manage_rf_platform_leaves` check to each
  controller's own `create` action. The model-level band validation already proves the second, narrower pattern
  (duplicate the specific check, not the whole abstraction) is viable here, since the band rule lives on the
  model and is therefore already shared by all three callers for free — the permission check is the one piece
  that was never added anywhere outside the web controller.
