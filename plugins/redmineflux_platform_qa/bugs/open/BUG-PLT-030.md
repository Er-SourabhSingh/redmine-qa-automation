# Bug Report Template

- Bug ID: BUG-PLT-030
- Production Redmine Issue ID: #121863
- Title: Deleting a Team with active Workloads is completely unguarded and silently cascade-deletes all of its Workload planning data (allocations, planned hours) — the confirmation dialog never mentions this specific, irreversible consequence
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_workload (patches `RedminefluxPlatform::Team`)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create a Team with at least one member, and a Workload for that team (real capacity-planning data: allocated issues, planned hours).
2. Delete the Team.

## Expected result

- Per `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-111 ("isn't specified in the requirements... document actual behavior precisely"), either a clear refusal naming the dependency (the pattern Helpdesk's own `register_destroy_guard` uses for Organization deletes, confirmed in TC-PLT-110), or — if cascading deletion is the intended design — a confirmation that specifically warns the admin that all Workload planning data for this team will be permanently destroyed, not a generic one-liner.

## Actual result

Built a disposable team (`PLT-DELETECHECK-Team`) with a member (Nova Starling) and a real Workload (`PLT-DELETECHECK-Workload`, with allocated issue hours). Deleted the team via its own "Delete" button. The confirmation dialog reads only:

> "Are you sure you want to delete 'PLT-DELETECHECK-Team'? This action cannot be undone and all associated data will be permanently removed."

No mention of Workload specifically, no count of how many Workloads/allocations/planned-hours records will be destroyed, no distinction from a routine "just remove the membership list" delete. Clicking Delete succeeded immediately with no refusal of any kind — confirmed via direct DB query:

```
Team 20 still exists?     false
Workload still exists?    false   <- cascade-deleted along with the team
Nova's shift assignment still exists? true  <- survived, since it has no FK to the team
```

### Root cause (confirmed from source)

`redmineflux_workload/lib/redmineflux_workload/patches/platform_team_patch.rb`:
```ruby
klass.class_eval do
  has_many :rf_workloads, class_name: 'RfWorkload', foreign_key: 'team_id', dependent: :destroy
  has_many :rf_team_memberships, ..., dependent: :destroy
end
```
This is a deliberate `dependent: :destroy` — not an accidental oversight — so the cascading deletion itself is intentional design, consistent with a Workload being conceptually "owned by" its team. The gap is purely in the **UI warning**: unlike Organization (Helpdesk's `register_destroy_guard`, confirmed in TC-PLT-110, which refuses the delete outright when dependents exist), Team deletion has no guard mechanism and no Workload-specific warning at all — the same generic confirmation copy is shown whether or not the team has zero Workloads or ten Workloads full of real planning data.

This also creates a real inconsistency with `BUG-PLT-029`/TC-PLT-105's own established principle: historical dependent records in Shift Management and Timesheet correctly survive a team-level change (confirmed: Nova's shift assignment, and separately Luna Blossom's TimeEntry, both survived their respective team-membership changes) — but a team's own Workload records do **not** survive the team being deleted, with zero advance warning of that specific, irreversible data loss.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-030/team-delete-confirmation-no-workload-warning.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-030/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — this is a missing-warning / no-guard gap, not a crash. Confirmed via Rails-console DB query, not just UI observation.

## Duplicate check

- Duplicate found: No — related to but distinct from `BUG-PLT-029` (that's about a stale Workload-membership snapshot while the team still exists; this is about the team's own Workloads being silently destroyed when the team itself is deleted, with no specific warning).
- **Same pattern recurs on a different entity pair, see `BUG-PLT-032`** (Holiday Scheme → Holiday, found 2026-10-01 during `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-159): an identical unguarded `dependent: :destroy` cascade with only the generic confirmation text, no mention of the specific attached records that will be lost. Worth a wider sweep of every `dependent: :destroy` association in the plugin if more occurrences turn up.

## Production report

Reported to production `ztflux` as **#121863** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121476 ("Cross-Plugin Consistency", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Medium (priority_id 2); Defect custom fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
