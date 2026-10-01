# Bug Report Template

- Bug ID: BUG-PLT-032
- Production Redmine Issue ID: #121865
- Title: Deleting a Holiday Scheme with holidays attached is completely unguarded and silently cascade-deletes all of its Holidays — the confirmation dialog never mentions this specific, irreversible consequence (same unguarded-cascade pattern as BUG-PLT-030, different entity pair)
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create a disposable Holiday Scheme (e.g. `PLT-CRUD-Scheme-DeleteCheck2`) with 1 Holiday attached to it.
2. Open the scheme's detail page on Platform's own screen (`/redmineflux_platform/list/holiday_schemes/<id>`) — note the "Holidays 1" section showing the attached holiday.
3. Click "Delete" on the scheme itself (not the holiday).

## Expected result

- Per `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-159's own framing, either the delete should be refused with a clear reason naming the attached holiday(s), or — if a clean cascade is the intended design — the confirmation dialog should specifically warn that deleting this scheme will also permanently delete its N attached holiday(s), the same standard already established for Team deletion by `BUG-PLT-030`.

## Actual result

The confirmation dialog shows only the generic text used for every entity in the plugin: **"This record will be removed permanently. Anything referring to it may be affected."** — no mention that this specific scheme has 1 attached Holiday that will also be permanently destroyed. Confirmed via source: `HolidayScheme` has `has_many :holidays, ..., dependent: :destroy` with no `before_destroy` guard of any kind (unlike `Organization`, which has `register_destroy_guard` protecting billed prepaid-hour history). Clicking Delete genuinely cascade-deletes both the scheme and its holiday in one action — confirmed via DB: both the scheme row and its holiday row were gone immediately afterward (no orphaned foreign key, but no warning either).

### Root cause (confirmed from source)

`app/models/redmineflux_platform/holiday_scheme.rb`:

```ruby
has_many :holidays,
         class_name: 'RedminefluxPlatform::Holiday',
         foreign_key: 'rf_holiday_scheme_id',
         dependent: :destroy
```

No guard exists anywhere in the class. This is the identical architectural gap already confirmed and filed for Team→Workload (`BUG-PLT-030`): a `dependent: :destroy` association with no specific warning in the generic delete-confirmation modal, and no refusal. Here the real-world consequence is losing an organization's holiday calendar data (which downstream affects Workload capacity calculations and Shift Management's calendar) rather than Workload planning data, but the defect shape is identical.

## Evidence

### Screenshot

![Generic delete confirmation, no mention of the 1 attached holiday that will be cascade-deleted](../../screenshots/BUG-PLT-032/generic-delete-confirm-no-holiday-mention.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-032/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — a silent, successful cascade, not a crash. Confirmed via DB before/after: scheme row and its one holiday row both present before Delete, both gone after (first reproduction, on a disposable `PLT-CRUD-Scheme-DeleteCheck` fixture, id 229/510 — deleted during the actual TC-PLT-159 execution before screenshot evidence was captured; this bug file's screenshot is from an identical second reproduction, id 230/511, which was then cancelled and cleaned up via `rails runner` instead of actually deleting it a second time).

## Duplicate check

- Duplicate found: No — same architectural pattern and same root-cause class as `BUG-PLT-030` (unguarded `dependent: :destroy` cascade with a generic-only confirmation), but a distinct entity pair (Holiday Scheme → Holiday, not Team → Workload) with its own real-world consequence. Not re-filing `BUG-PLT-030` itself; cross-referenced in both bug files.

## Production report

Reported to production `ztflux` as **#121865** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121704 ("Cross-Plugin CRUD Matrix", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Medium (priority_id 2); Defect custom fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
