# redmineflux_platform migrations

Read this before assuming a migration here is dead code.

The platform owns the tables that used to be duplicated across the RedminefluxFlux
plugins, so this directory contains two very different kinds of file, and they
must not be treated the same way.

## The four kinds

| Kind | What it is | Safe to delete? |
|---|---|---|
| **SCHEMA — live table** | Creates a table the platform owns. The only place that table is created. | **No.** Deleting it means a fresh install has no table. |
| **SCHEMA — top-up / fix** | Adds a column, index or constraint to a table that already existed on upgraded installs, where `create_table ... if_not_exists` was a no-op. | **No.** Without it, an upgraded install is missing what a fresh one has. |
| **DATA — one-time upgrade** | Moves rows out of a plugin's old private table into the shared one. | **Only** once no install can still be on a pre-platform version. See below. |
| **DROP — legacy cleanup** | Removes a table the platform superseded, guarded so it refuses while rows are unaccounted for. | **No.** Without it the old table lingers next to its replacement. |

## Index

```
001  SCHEMA  create_rf_platform_schema_info
002  SCHEMA  create_rf_teams                       <- workload + timesheet + shift
003  SCHEMA  create_rf_team_memberships            <- workload + timesheet + shift
004  SCHEMA  create_rf_organizations               <- crm + helpdesk
005  SCHEMA  create_rf_contacts                    <- crm + invoice
006  SCHEMA  create_rf_holiday_schemes             <- workload + shift
007  SCHEMA  create_rf_holidays                    <- workload + helpdesk + shift
008  SCHEMA  create_rf_audit_events                <- timesheet + shift
009  SCHEMA  create_rf_user_preferences
010  TOP-UP  add_platform_columns_to_existing_tables
011  DATA    data_merge_crm_companies              rf_crm_companies      -> rf_organizations
012  DATA    data_import_helpdesk_holidays         rf_helpdesk_holidays  -> rf_holidays
013  DATA    data_rename_stored_class_names        CrmCompany/CrmContact -> platform names
014  TOP-UP  add_ip_address_to_rf_audit_events
015  TOP-UP  add_active_to_rf_holidays
016  TOP-UP  add_shift_columns_to_shared_tables
017  DROP    drop_dead_can_approve_leaves          duplicate boolean column
018  TOP-UP  add_shared_foreign_keys
019  TOP-UP  align_organizations_active_not_null
020  TOP-UP  add_shared_indexes
021  DROP    drop_superseded_legacy_tables         6 tables the platform replaced
022  SCHEMA  create_rf_leave_types                 <- workload + shift
023  SCHEMA  create_rf_leaves                      <- workload + shift
024  TOP-UP  add_leave_columns_to_existing_tables
025  DATA    data_seed_leave_types                 workload's hard-coded 5 -> rows
026  DATA    data_migrate_leave_type_to_id         leave_type varchar    -> leave_type_id
027  DATA    data_merge_shift_leave_applications   rf_leave_applications -> rf_leaves
028  DROP    drop_rf_leave_applications
029  TOP-UP  align_leave_days_default
030  DATA    data_merge_timesheet_audit_logs       timesheet_audit_logs  -> rf_audit_events
031  DROP    drop_timesheet_audit_logs
```

## Why the DATA migrations still exist when their source tables are gone

They look like dead code, and on this machine they behave like it — every one
of them starts with a guard such as:

```ruby
return unless table_exists?(:rf_crm_companies) && table_exists?(:rf_organizations)
```

`rf_crm_companies` was dropped by migration 021, so 011 is now a no-op here.
That is exactly why the file reads as confusing.

It is not dead, because of one scenario: **an install that has not upgraded
yet.** A customer running a pre-platform release still has
`rf_crm_companies` with their real rows. When they install this bundle:

- 004 creates `rf_organizations` (empty)
- **011 moves their rows across** — this is the only step that does
- 021 then drops the now-empty old table, and only because 011 proved every
  row arrived

Delete 011 and that same customer gets an empty organization list, with their
data still sitting in a table nothing reads any more. The guard on 021 would
correctly refuse to drop it, so nothing is destroyed — but nothing is visible
either, which to the customer is the same thing.

The migration-local classes inside these files (`class Company <
ActiveRecord::Base; self.table_name = 'rf_crm_companies'; end`) exist for the
same reason. They are deliberately **not** the app's models: a migration has
to keep working forever, including on a fresh install where `CrmCompany` no
longer exists as a class at all. Referencing the real model would make the
migration raise `NameError` the moment that model was deleted.

## When these can be deleted

Once the product sets a floor — "you must be on version X before installing
this" — every install reaching this code has already run 011, 012, 013, 025,
026, 027 and 030, and all seven become genuinely inert. At that point delete
them together with the DROP migrations that depend on their trail columns
(021, 028, 031), and drop those trail columns:

```
rf_organizations.source_crm_company_id
rf_holidays.source_helpdesk_holiday_id
rf_leaves.source_leave_application_id
rf_audit_events.source_timesheet_audit_log_id
```

Until that floor is declared, they stay.
