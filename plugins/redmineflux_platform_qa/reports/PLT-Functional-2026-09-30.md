# Redmineflux Platform — Functional Testing Report — 2026-09-30

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

### Cross-Plugin CRUD Matrix — Team section (`PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`)

| TC ID | Result |
|-------|--------|
| TC-PLT-142 — Create from Platform → verify in Workload/Timesheet/Shift Mgmt/DB | Pass |
| TC-PLT-143 — Create from Workload → verify everywhere/DB | Pass |
| TC-PLT-144 — Create from Timesheet → verify everywhere/DB | Pass |
| TC-PLT-145 — Create from Shift Management → verify everywhere/DB | Pass |
| TC-PLT-146 — Update (rename) from Platform → verify everywhere/DB | Pass |
| TC-PLT-147 — Update (membership) from Workload → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-148 — Update (membership) from Timesheet → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-149 — Update (membership) from Shift Management → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-199 — Edit an existing member's role from Workload → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-200 — Edit an existing member's role from Timesheet → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-201 — Remove a single member from Platform → verify everywhere/DB | Pass (control case — audit trail also correct) |
| TC-PLT-202 — Remove a single member from Workload/Timesheet/Shift Mgmt → verify everywhere/DB | Pass functionally / Fail audit trail — BUG-PLT-013 |
| TC-PLT-150 — Delete from Platform (no dependents) → verify removal everywhere/DB | Pass, including audit trail |
| TC-PLT-151 — Delete from Workload/Timesheet/Shift Mgmt (no dependents) → verify removal everywhere/DB | Pass, including audit trail |
| TC-PLT-152 — Delete with real dependents — refused or orphans data? | Deferred (fixture setup not built) |
| TC-PLT-203 — Add a member with non-default Role/flags set at creation → verify propagation | Mixed: Pass for Platform/Workload/Timesheet, Fail for Shift Management — BUG-PLT-014 |

### Entity CRUD and Field Validation (`PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`)

| TC ID | Result |
|-------|--------|
| TC-PLT-113 — Search finds a record by name on every list screen | Mixed: Pass (Teams/Holiday Schemes/Holidays/Leave Types/Organizations), Fail (Contacts — BUG-PLT-017; Leaves — BUG-PLT-018) |
| TC-PLT-114 — `%` treated as a literal character in search | Pass |
| TC-PLT-115 — Sorting by column header works on each list screen | Mixed: Pass (Teams only), Fail (6 other entities — BUG-PLT-019) |
| TC-PLT-116 — Pagination S.No. numbering correct across pages | Pass |
| TC-PLT-117 — Empty state + create-control authorization | Pass |
| TC-PLT-118 — Required field validation (native HTML5) | Pass |
| TC-PLT-119 — Duplicate name rejected inline, value retained | Pass |
| TC-PLT-120 — Delete confirmation names the record | Pass |
| TC-PLT-121 — Cancel discards changes (popup and full-page forms) | Pass |
| TC-PLT-122 — Member picker filters as typed, chips display correctly | Mixed: Fail (live filtering — BUG-PLT-020), Pass (chip display) |
| TC-PLT-123 — Per-member permission checkboxes persist | Pass |
| TC-PLT-124 — Empty Add-members submission refused | Pass |
| TC-PLT-125 — Removing the last member shows empty state | Pass |
| TC-PLT-126 — Bulk delete (Teams) | Pass |
| TC-PLT-127 — Approve/Reject/Cancel only available while a leave is pending | Pass |
| TC-PLT-128 — Reject requires a reason | Pass |
| TC-PLT-129 — A decided leave loses the Approve action | Pass |
| TC-PLT-130 — Audit trail shows create/update/delete with who/when | Pass (literal requirement) — surfaced BUG-PLT-021 |
| TC-PLT-131 — A deleted record's audit row shows its name, not class+ID | Mixed: Pass (the delete row itself), Fail (that record's own create/update rows — BUG-PLT-021) |
| TC-PLT-132 — Audit trail searchable by record name | Pass (consistent with BUG-PLT-021's known effect) |
| TC-PLT-133 — Audit rows are append-only (no edit/delete) | Pass |
| TC-PLT-134 — Tags: chips, Enter/comma to add, suggestions, × to remove | Mixed: Pass (add via Enter/comma, suggestion logic correct), Fail (× removal — BUG-PLT-022) |
| TC-PLT-135 — Responsive layout at ~390px, reachable via ☰, no horizontal overflow | Pass — all 10 Platform screens, ~44px tap targets confirmed |

**Summary:** Total executed — 37 (15 CRUD Matrix + 22 Entity CRUD/Field Validation of 23; TC-PLT-152 deferred) / Pass (full) 20 / Pass-with-finding (mixed) 15 / Fail 0 outright / Blocked 0 / Skipped 0 / Deferred 1

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-PLT-012 | Shift Management's Leave Type Create and Update both fail with a 400 (`ActionController::ParameterMissing: rf_leave_type`) — same stale-param-key defect class as BUG-PLT-009/011, third occurrence | Critical | Open | #121621 |
| BUG-PLT-013 | Adding, editing, or removing a team member from Workload, Timesheet, or Shift Management never creates an Audit Event | Medium | Open | #121622 |
| BUG-PLT-014 | Team member "Role" is two disconnected columns — Shift Management's Member/Lead vs. everyone else's Redmine-role dropdown | Medium | Open | #121623 |
| BUG-PLT-015 | Platform's own Teams screen (and Shift Management's) has no way to edit an existing member's role after adding them | Low | Open | #121624 |
| BUG-PLT-016 | Every shared entity Platform manages is independently re-implemented in 2–4 consumer plugins — recommends consolidating onto Platform | Medium | Open | #121629 |
| BUG-PLT-017 | Contacts search returns "No record matches" for the exact full name shown in the list | Medium | Open | #121707 |
| BUG-PLT-018 | Leaves list has no search at all — UI and server-side parameter both silently no-op | Low | Open | #121708 |
| BUG-PLT-019 | Column-header sorting works only on Teams — 6 other entities have no sortable headers | Low | Open | #121709 |
| BUG-PLT-020 | The "Add members" user picker's search box never actually filters the option list | Low | Open | #121710 |
| BUG-PLT-021 | A deleted record's created/updated audit rows permanently lose their name, regress to "ClassName #ID" | Medium | Open | #121711 |
| BUG-PLT-022 | Tags field: clicking a different chip's × while text is uncommitted swallows the removal, adds a phantom tag | Low | Open | #121712 |

10 of 11 bugs were found directly through today's TC execution and are cross-referenced against the specific TC above; BUG-PLT-012 was found incidentally during the same Cross-Plugin CRUD Matrix session (Shift Management Leave Type creation/update), not tied to one specific TC in this suite.

## Notes / Findings

- Redmine Version: 6 (Rails 7.2.3.1)
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Test Date: 2026-09-30
- Sources: `plugins/redmineflux_platform_qa/testcases/PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` (Team section), `plugins/redmineflux_platform_qa/testcases/PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md` (fully executed, TC-PLT-113–135)
- `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` execution is **paused** past the Team section by explicit user decision — BUG-PLT-016's architectural recommendation (consolidate every entity onto Platform) could invalidate/require-rewriting the remaining not-yet-executed TCs (Holiday Scheme Update/Delete, and all of Holiday/Leave Type/Leaves/Organizations/Contacts/Audit Events) if acted on. Do not resume without checking back with the user first.
- Production testcase/run gap found and closed today: 3 of this plugin's 9 local test suites (Cross-Plugin CRUD Matrix, Permissions and Access, Entity CRUD and Field Validation) had no corresponding production testcase in suite #397, and their defects had been landing on a mismatched testcase (`#121476` "Cross-Plugin Consistency"). Created testcases `#121704`/`#121705`/`#121706` and confirmed Run #586 now tracks all 9. BUG-PLT-017–022 are correctly linked to the new `#121706`; BUG-PLT-009–016 remain on the old mismatched link pending a decision on whether to retroactively re-link them.
