# Bug Index — Redmineflux Platform

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-PLT-003 | Upgrade migration `004_create_rf_organizations.rb` crashes and cancels all later migrations when Helpdesk's pre-existing `rf_organizations` table already exists | Closed | High | 6 | #121479 | bugs/closed/BUG-PLT-003.md |
| BUG-PLT-004 | App cannot boot at all in `RAILS_ENV=production` — `pagination_renderer.rb` bypasses init.rb's `will_paginate` guard via Zeitwerk eager loading | Closed | Critical | 6 | #121480 | bugs/closed/BUG-PLT-004.md |
| BUG-PLT-005 | Migration `019_align_organizations_active_not_null.rb` crashes on MySQL — `execute(...).cmd_tuples` is PostgreSQL-only, blocks every migration after it | Closed | High | 6 | #121512 | bugs/closed/BUG-PLT-005.md |
| BUG-PLT-006 | Organization/Company merge doesn't actually merge same-named records — migration 011 only avoids ID collisions, creating a duplicate `rf_organizations` row instead | Open | High | 6 | #121543 | bugs/open/BUG-PLT-006.md |
| BUG-PLT-007 | Team screens don't match the rest of the product — garbled "RedmineRedmineflux Shift Management" header text and undersized delete-confirmation modal buttons | Open | Low | 6 | #121548 | bugs/open/BUG-PLT-007.md |
| BUG-PLT-008 | Platform Settings' "inherited" fields are not synced in either direction — Platform never picks up the source plugin's value, and editing Platform's own field never writes back | Open | High | 6 | #121551 | bugs/open/BUG-PLT-008.md |
| BUG-PLT-009 | Shift Management's "Apply Leave" is completely broken — every submission fails with a 400 (`ActionController::ParameterMissing: rf_leave_application`) since the controller still expects the pre-consolidation param key | Open | Critical | 6 | #121556 | bugs/open/BUG-PLT-009.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
