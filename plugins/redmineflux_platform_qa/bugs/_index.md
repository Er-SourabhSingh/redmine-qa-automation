# Bug Index — Redmineflux Platform

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-PLT-003 | Upgrade migration `004_create_rf_organizations.rb` crashes and cancels all later migrations when Helpdesk's pre-existing `rf_organizations` table already exists | Closed | High | 6 | #121479 | bugs/closed/BUG-PLT-003.md |
| BUG-PLT-004 | App cannot boot at all in `RAILS_ENV=production` — `pagination_renderer.rb` bypasses init.rb's `will_paginate` guard via Zeitwerk eager loading | Closed | Critical | 6 | #121480 | bugs/closed/BUG-PLT-004.md |
| BUG-PLT-005 | Migration `019_align_organizations_active_not_null.rb` crashes on MySQL — `execute(...).cmd_tuples` is PostgreSQL-only, blocks every migration after it | Closed | High | 6 | #121512 | bugs/closed/BUG-PLT-005.md |
| BUG-PLT-006 | Organization/Company merge doesn't actually merge same-named records — migration 011 only avoids ID collisions, creating a duplicate `rf_organizations` row instead | Closed | High | 6 | #121543 | bugs/closed/BUG-PLT-006.md |
| BUG-PLT-007 | Platform/Shift Management header text wrong or missing across pages, unwanted breadcrumb persists, and delete-confirmation modal buttons still undersized | Open (reopened after retest) | Low | 6 | #121548 | bugs/open/BUG-PLT-007.md |
| BUG-PLT-008 | Platform Settings' "inherited" fields are not synced in either direction — Platform never picks up the source plugin's value, and editing Platform's own field never writes back | Closed | High | 6 | #121551 | bugs/closed/BUG-PLT-008.md |
| BUG-PLT-009 | Shift Management's "Apply Leave" is completely broken — every submission fails with a 400 (`ActionController::ParameterMissing: rf_leave_application`) since the controller still expects the pre-consolidation param key | Open (original symptom fixed, feature still broken — see BUG-PLT-010) | Critical | 6 | #121556 | bugs/open/BUG-PLT-009.md |
| BUG-PLT-010 | `redmineflux_shift_management` and `redmineflux_timesheet` each monkey-patch `RedminefluxPlatform::AuditEvent.log` with incompatible signatures — whichever loads last breaks ~30 call sites in Shift Management | Open | Critical | 6 | #121588 | bugs/open/BUG-PLT-010.md |
| BUG-PLT-011 | Workload's "Request Leave" is completely broken — Create and Update both fail with a 400 (`ActionController::ParameterMissing: rf_leave`) since `RfLeavesController` still expects the pre-consolidation param key | Open | Critical | 6 | #121589 | bugs/open/BUG-PLT-011.md |
| BUG-PLT-012 | Shift Management's Leave Type Create and Update both fail with a 400 (`ActionController::ParameterMissing: rf_leave_type`) — same stale-param-key defect class as BUG-PLT-009/011, third occurrence | Open | Critical | 6 | #121621 | bugs/open/BUG-PLT-012.md |
| BUG-PLT-013 | Adding, editing, OR removing a team member from Workload, Timesheet, or Shift Management never creates an Audit Event — all three bypass the shared `TeamService`/`AuditService.log` methods that Platform's own screen uses for every one of these actions | Open | Medium | 6 | #121622 | bugs/open/BUG-PLT-013.md |
| BUG-PLT-014 | Team member "Role" is two disconnected columns — Shift Management's Member/Lead (`role`) and Platform/Workload/Timesheet's Redmine-role dropdown (`role_id`) never see each other's value | Open | Medium | 6 | #121623 | bugs/open/BUG-PLT-014.md |
| BUG-PLT-015 | Platform's own Teams screen (and Shift Management's) has no way to edit an existing member's role after adding them — only Remove, unlike Workload/Timesheet which both have a per-member Edit | Open | Low | 6 | #121624 | bugs/open/BUG-PLT-015.md |
| BUG-PLT-016 | Every shared entity Platform manages is independently re-implemented in 2–4 consumer plugins — Team already proves this drifts into real, silent bugs (BUG-PLT-013/014/015), and the same risk exists for Holiday Scheme, Holiday, Leaves, Organizations, Contacts | Open | Medium | 6 | #121629 | bugs/open/BUG-PLT-016.md |
| BUG-PLT-017 | Contacts search returns "No record matches" for the exact full name shown in the list — search checks First Name and Last Name as separate fields, never the concatenated display name | Open | Medium | 6 | #121707 | bugs/open/BUG-PLT-017.md |
| BUG-PLT-018 | Leaves list has no search at all — no search box in the UI, and the search parameter is silently ignored server-side too, unlike every other entity | Open | Low | 6 | #121708 | bugs/open/BUG-PLT-018.md |
| BUG-PLT-019 | Column-header sorting works only on Teams — Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, and Contacts have no sortable column headers at all | Open | Low | 6 | #121709 | bugs/open/BUG-PLT-019.md |
| BUG-PLT-020 | The "Add members" user picker's search box never actually filters the option list — the full unfiltered list stays visible above a "No user matches that search" message | Open | Low | 6 | #121710 | bugs/open/BUG-PLT-020.md |
| BUG-PLT-021 | A deleted record's "created"/"updated" audit rows permanently lose their human-readable name and regress to "ClassName #ID" — only the destroy hook snapshots a name, create/update never do | Open | Medium | 6 | #121711 | bugs/open/BUG-PLT-021.md |
| BUG-PLT-022 | Tags field: clicking a different chip's × while text is still uncommitted in the entry box silently fails to remove that chip and instead commits the leftover text as an unwanted new tag | Open | Low | 6 | #121712 | bugs/open/BUG-PLT-022.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
