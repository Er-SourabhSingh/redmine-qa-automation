# Test Cases — Redmineflux Platform — Entity CRUD & Field Validation

> Source: `docs/plugin-source/PLATFORM_PLUGIN_TESTER_GUIDE.md` §7 "Suggested test areas" (the plugin's own dev-written test guidance), plus testing-promt.md §3/§4 (complete CRUD + field-functionality testing). Added 2026-09-30 — this suite covers per-entity CRUD/validation/list behavior that no prior suite in this cycle addressed (the other 6 suites are scoped to migration integrity, cross-plugin consistency, vocabulary, and known gaps, not raw field-level CRUD correctness on Platform's own screens).
>
> Applies to Platform's own list/create/edit screens for its shared entities: Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts. Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — List Behavior (search, sort, pagination)

---

### TC-PLT-113: Search finds a record by name on every list screen; a non-matching search shows an explanation and a way to clear it

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. On each of Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts lists, search for an existing record's exact name.
2. Then search for a term matching nothing.

**Expected Result:**
- Step 1: the matching record(s) appear. Step 2: a clear "no results" message is shown, with an obvious way to clear the search (not just a blank table with no explanation).

**Status:** **EXECUTED 2026-09-30 — MIXED: PASS for Teams, Holiday Schemes, Holidays, Leave Types, Organizations; FAIL for Contacts (BUG-PLT-017) and Leaves (BUG-PLT-018).**
- **Teams, Holiday Schemes, Holidays, Leave Types, Organizations** — all PASS. Exact-name search returns the correct row(s) (`(1-1/1)` or `(1-2/2)` as appropriate), and a non-matching search shows a clear "Nothing matched — No record matches "<term>". Try a shorter term, or clear the search." message with 2 separate ways to clear (a "Clear" link by the search box, and a "Clear search" link in the empty state).
- **Contacts — FAIL.** Searching the exact name shown in the list ("PLT-BASELINE-Jane Doe") returns "No record matches", even though the record is visibly in the unfiltered list. Narrowed down: `Jane` alone, `Doe` alone, `PLT-BASELINE` alone, and `PLT-BASELINE-Jane` (first name only) all match — only the full first+last name together fails. Root cause confirmed from source: `rf_searchable_on :first_name, :last_name, :company_name, :email` builds an OR across each column independently, never against the concatenated display name. Filed as **BUG-PLT-017**.
- **Leaves — FAIL, more severe.** No search box exists on the page at all (confirmed via full-page inspection, not a quick look). Manually appending `?search=fixture` (matching a real fixture leave's Reason field) still returned all 7 records unfiltered — the backend doesn't filter either. Root cause confirmed from source: the `leaves` entry in `shared_entities.rb` never sets a `search:` key, so `Entry#searchable?` is `false` and `Entry#search` always returns the relation unchanged, regardless of `params[:search]` — even though `Leave` does declare `rf_searchable_on :reason` at the model level; it was just never wired into the entity config. Filed as **BUG-PLT-018**.

---

### TC-PLT-114: A `%` typed into a search box is treated as literal text, not a SQL wildcard

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. On any list screen with search, type a search term containing `%` (e.g. `%`) that matches no real record name.

**Expected Result:**
- Returns no rows (literal match), not every row (which would indicate the `%` was passed straight into a `LIKE` clause unescaped).

**Status:** **EXECUTED 2026-09-30 — PASS** for every entity with working search (Teams, Holiday Schemes, Holidays, Leave Types, Organizations, Contacts). Tested `%` directly on Teams and Contacts — both correctly returned "Nothing matched" / "No record matches "%"" (0 rows), not every row. Confirmed via source this is uniform across all 6: the shared `Searchable` concern (`lib/redmineflux_platform/concerns/searchable.rb`) explicitly runs the term through `ActiveRecord::Base.sanitize_sql_like` before building the `LIKE` pattern — the concern's own header comment documents this was a deliberate fix after measuring `%` matching every row pre-fix. Not applicable to Leaves (no search at all — BUG-PLT-018).

---

### TC-PLT-115: Sorting by column header works on each list screen

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. At least 3 records exist per entity.

**Steps:**
1. Click each sortable column header on Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts lists.

**Expected Result:**
- Rows re-sort correctly ascending/descending, indicator shown on the active sort column.

**Status:** **EXECUTED 2026-09-30 — MIXED: PASS for Teams only; FAIL for all 6 other entities (BUG-PLT-019).** Teams: clicking "Team name" correctly reversed the list order (`?sort=name:desc`), with a visible chevron sort indicator confirmed via screenshot. Inspected the full column-header row of Holiday Schemes, Holidays, Leave Types, Organizations, and Contacts — **none of them have a single clickable column header**, just plain text. (Leaves also has no sortable headers, additional to having no search — BUG-PLT-018.) Root cause confirmed from source: `TeamsController` is the only controller in the plugin that wires up `sort_init`/`sort_clause`, and `teams/index.html.erb` is the only view calling `sort_link`/`sort_header_tag` (confirmed via a plugin-wide grep — exactly one match). The shared `EntitiesController`, used by all 6 other entities, has no sort support at all. Filed as **BUG-PLT-019**.

---

### TC-PLT-116: Pagination's S.No. column continues counting across pages, not restarting at 1

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. At least 30 records exist for one entity (create disposable test records if needed, tagged clearly and cleaned up after).

**Steps:**
1. Page to page 2 of a list with 25+ per-page rows.
2. Check the S.No. column's starting value.

**Expected Result:**
- Page 2 starts at 26 (or whatever the real page size is), not 1.

**Status:** **EXECUTED 2026-09-30 — PASS.** Confirmed default page size is 25 (`Setting.per_page_options_array.first`, per the shared `Paginatable` concern's source). Created 21 disposable `PLT-PAGE-Scheme-NN` Holiday Schemes (26 total) to cross into page 2. Page 1: "(1-25/26)". Page 2 (`?page=2`): exactly 1 row, S.No. = **26**, "(26-26/26)" — correctly continues the count, does not restart at 1. All 21 fixtures deleted immediately after (confirmed via DB: back to the original 5 schemes). This is the same shared `rf_paginate` helper (confirmed via source) used identically by all 7 entities' controllers — its own header comment documents the `@offset + index + 1` S.No. numbering as the exact behavior being verified here, so this result generalizes across every entity without needing to repeat the 26-record fixture build for each one.

---

### TC-PLT-117: An empty list shows a useful empty state, and a "create" control appears only for an authorized user

**User Role:** Admin, and a non-manage user for comparison.
**Precondition:** An entity with zero records (or a filtered view producing zero rows).

**Steps:**
1. As Admin, view an empty (or emptied-by-filter) list.
2. As a user without `manage_rf_platform_<entity>`, view the same.

**Expected Result:**
- Useful empty-state messaging in both cases; the "New <Entity>" create control appears for the Admin but not for the unauthorized user.

**Status:** **EXECUTED 2026-09-30 — PASS.** Filtered Organizations to a non-matching search as Admin: "Nothing matched — No record matches..." shown, with "New Organization" still present and clickable (create is independent of the list being non-empty). For the unauthorized-user half, reused the extensive evidence already gathered in `PLATFORM_PERMISSIONS_AND_ACCESS.md` (TC-138, TC-204–209): a user without `manage_rf_platform_<entity>` never sees the "New <Entity>" control on any of the 7 entity lists, filtered or not — confirmed live for all 7 entities in that suite, not re-derived here.

---

## Functional Cases — Create/Edit/Delete Validation

---

### TC-PLT-118: Required field left blank on create is refused, with the specific field marked

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. On each entity's create form, submit with a required field left blank.

**Expected Result:**
- Submission refused; the specific blank required field is visibly marked/highlighted, not just a generic error banner.

**Status:** **EXECUTED 2026-09-30 — PASS.** Spot-checked Holiday Schemes (Name only) and Contacts (multiple required fields: First Name, Email, Contact Type). Both use the browser's native HTML5 `required` validation: submitting with the required field(s) blank keeps the form open (no record created — Holiday Schemes count stayed at 5), and the browser shows its native "Please fill out this field." tooltip anchored directly on the first blank required field with a blue focus ring — confirmed via screenshot for both. This is a real per-field marking, not a generic error banner.

---

### TC-PLT-119: Duplicate name is refused with a message, inside the dialogue, with the typed value retained

**User Role:** Admin.
**Precondition:** An existing named record (e.g. a Team) to collide with.

**Steps:**
1. Attempt to create a second Team (or Holiday Scheme, Leave Type, Organization) with the exact same name as an existing one.

**Expected Result:**
- Refused with a clear duplicate-name message, shown inside the create dialogue/page (not a redirect losing the input), with everything already typed still present so the user doesn't have to re-enter it.

**Status:** **EXECUTED 2026-09-30 — PASS.** Attempted to create a Holiday Scheme named exactly `PLT-BASELINE-Holiday Scheme` (an existing scheme). Refused inside the same dialogue (no redirect) with "One field needs attention — Name has already been taken", the specific Name field outlined with its own inline "has already been taken" text, and the typed value still present in the field afterward.

---

### TC-PLT-120: Delete confirmation names the specific record in the question, not a generic "are you sure?"

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Click Delete on a named record for each entity.

**Expected Result:**
- The confirmation heading/question names the actual record (e.g. "Delete PLT-BASELINE-QA Squad?"), matching the pattern already confirmed for Teams — verify it holds for every other entity too.

**Status:** **EXECUTED 2026-09-30 — PASS, all entities.** Already confirmed dozens of times this session across every entity type during CRUD/permission testing (not re-derived, citing the existing evidence): "Delete PLT-PERM-TC139-Team-RENAMED?" (Team, `PLATFORM_PERMISSIONS_AND_ACCESS.md` TC-139), "Delete PLT-PERM-TC204-Scheme?" (Holiday Scheme, TC-204), "Delete PLT-BASELINE-QA Squad?" (Team, TC-150), and equivalent named-record confirmations for Holiday, Leave Type, Organization, and Contact deletes (TC-205/206/208/209). Every single delete this session across all 7 entities showed the specific record's name in the confirmation heading, never a generic "Are you sure?".

---

### TC-PLT-121: Cancel really cancels — nothing is saved, for both popup and full-page forms

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Start editing a record (both a popup-style form like Team, and a full-page form like Organization), change a field, click Cancel instead of Save.
2. Reload the record.

**Expected Result:**
- The change was not persisted, for both form styles.

**Status:** **EXECUTED 2026-09-30 — PASS, both form styles.** Team (popup): edited team 1's name to "PLT-BASELINE-QA Squad-SHOULD-NOT-SAVE" in the popup form, clicked Cancel. DB confirms `name` still "PLT-BASELINE-QA Squad", unchanged. Organization (full-page): edited org 1's name to "PLT-BASELINE-Acme Corp-SHOULD-NOT-SAVE" on the full-page edit form, clicked the Cancel link. DB confirms `name` still "PLT-BASELINE-Acme Corp", unchanged.

---

## Functional Cases — Teams & Members

---

### TC-PLT-122: Adding several members at once — the user picker filters as typed and shows chips for each chosen user

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open "Add members" on a team, type a partial name, and select 3+ users.

**Expected Result:**
- Picker filters live as typed; each selected user appears as a removable chip before submitting.

**Status:** **EXECUTED 2026-09-30 — MIXED: FAIL for live filtering (BUG-PLT-020); PASS for chips.** Typed `Sel` and separately `zzznomatch123` into the picker's "Search users" box — the option list never narrowed in either case; for the no-match term, a "No user matches that search." message appeared (and Select all/Clear correctly disabled) but the full unfiltered 21-user list stayed visible and scrollable directly above it, confirmed via screenshot. Filed as **BUG-PLT-020**. Selected 3 users (Aurora Wren, Autumn Grace, Briar Sunset) and confirmed all 3 render as individual chips in the collapsed combobox header, each with its own "Remove <name>" × button — the chip half of this TC genuinely works.

---

### TC-PLT-123: Per-member permission checkboxes (Manage workload / Approve leave) show correctly on the member's row after save

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Add a member with "Manage workload" checked and "Approve leave" unchecked (or vice versa).
2. Reload the team's member list.

**Expected Result:**
- The row shows exactly the permissions set at add-time, correctly reflecting Yes/No for each.

**Status:** **EXECUTED 2026-09-30 — PASS.** Already directly confirmed in `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-203: added Isla Moon to a Platform-origin team with "Manage workload" checked and "Approve leave" checked in the same Add-members submission. Reloaded the team's member list — the row correctly showed "Yes"/"Yes" for both columns, matching exactly what was set at add time (not defaults). Same evidence also covers the inverse (a member added with both left unchecked shows "No"/"No" — confirmed for every other member added this session without those boxes ticked, e.g. TC-142's Aurora Wren/Autumn Grace).

---

### TC-PLT-124: Submitting "Add members" with nobody selected is refused with a specific message

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open "Add members", select nobody, submit.

**Expected Result:**
- Refused with "Select at least one user." (or equivalent), not a silent no-op or a generic error.

**Status:** **EXECUTED 2026-09-30 — PASS.** Opened "Add members" on team 1, submitted with no user selected. Refused with the exact message "Select at least one user." — not a silent no-op.

---

### TC-PLT-125: Removing a team member; removing the last member produces an empty state

**User Role:** Admin/Manager.
**Precondition:** A team with exactly 1 member (or reduce one to 1 first).

**Steps:**
1. Remove that last member.

**Expected Result:**
- Team shows a correct "0 members"/empty state, not an error, and remains otherwise intact (not auto-deleted).

**Status:** **EXECUTED 2026-09-30 — PASS.** Already directly confirmed in `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-202: removed the sole member from 3 separate teams (Workload/Timesheet/Shift-Management-origin, teams 4/5/6) via each origin's own remove-member control. All 3 correctly showed "0 members"/empty-state messaging afterward, no error, and DB confirmed the teams themselves still existed (`rf_teams` rows intact) with only their membership rows cleared (`rf_team_memberships` count 0) — not auto-deleted.

---

### TC-PLT-126: Bulk delete — header checkbox selects all rows, confirmation names the bulk action

**User Role:** Admin.
**Precondition:** Multiple disposable test teams exist.

**Steps:**
1. On the Teams list, click the header checkbox, then "Delete selected".

**Expected Result:**
- All rows selected by the header checkbox; confirmation clearly names it as a bulk/multi-record delete (not phrased as if deleting one record).

**Status:** **EXECUTED 2026-09-30 — PASS.** Created 3 disposable teams (`PLT-BULK-Team-01/02/03`). Confirmed "Check all" correctly ticks every row checkbox (9/9 at the time). Selected just the 3 disposable rows individually, clicked "Delete selected" — confirmation read "Delete the selected teams? — Every ticked team is removed along with its memberships. A team that cannot be deleted is reported and left alone.", clearly phrased as bulk, not singular. Confirmed: team count dropped from 9 to 6, all 3 disposable teams gone, the other 6 untouched.

---

## Functional Cases — Leaves

---

### TC-PLT-127: Approve/Reject/Cancel actions on a leave appear only while it's still pending

**User Role:** Admin/Manager.
**Precondition:** A pending leave request exists.

**Steps:**
1. View the pending leave's available actions.
2. Approve or reject it, then re-view.

**Expected Result:**
- Approve/Reject/Cancel available while pending; gone once decided (see TC-PLT-129).

**Status:** **EXECUTED 2026-09-30 — PASS.** Created a fresh pending leave request (id 10, Aurora Wren, 2027-07-01). While Pending: Approve, Reject, and "Cancel request" all present. Approved it (with confirmation dialog "Approve...? The dates are reserved..."). Status changed to Approved; Approve and Reject both disappeared, only "Cancel request" remains.

---

### TC-PLT-128: Rejecting a leave requires a reason — empty reason is refused, and the reason appears on the record afterward

**User Role:** Admin/Manager.
**Precondition:** A pending leave request exists.

**Steps:**
1. Attempt to reject with an empty reason box.
2. Reject again with a real reason filled in.

**Expected Result:**
- Step 1 refused, reason field outlined/focused. Step 2 succeeds, and the entered reason is visible on the leave's record afterward.

**Status:** **EXECUTED 2026-09-30 — PASS.** Created a fresh pending leave (id 11, Aurora Wren, 2027-08-02 — note: an earlier attempt at 2027-08-01 was correctly refused with "The selected dates contain no working days — they are all weekends or holidays," a separate validation confirmed working). Clicked Reject, submitted the confirm dialog with the reason box empty: refused, status stayed Pending, reason textbox marked `[invalid]`/focused (native required validation). Filled in a real reason and resubmitted: succeeded, status changed to Rejected, and "Rejection Reason: PLT-PERM-TC128 test rejection reason" is visible on the record afterward.

---

### TC-PLT-129: A decided (approved/rejected) leave request no longer offers Approve

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-127 executed (a leave has already been approved or rejected).

**Steps:**
1. View the now-decided leave's available actions.

**Expected Result:**
- Approve (and Reject) no longer offered; only whatever the "already decided" state legitimately allows (e.g. viewing, or Cancel per business rules) is shown.

**Status:** **EXECUTED 2026-09-30 — PASS.** Same evidence as TC-127: after approving leave id 10, its detail page shows only "Cancel request" — Approve and Reject are both gone, exactly matching this TC's expectation.

---

## Functional Cases — Audit Trail

---

### TC-PLT-130: Every create/update/delete on a shared entity appears in the audit trail with who and when

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create, then update, then delete a disposable Team (or another audited entity).
2. Check the Audit events list for all three actions.

**Expected Result:**
- All three actions present, each attributed to the acting user with a timestamp.

**Status:** **EXECUTED 2026-09-30 — PASS (literal requirement), with a related finding filed as BUG-PLT-021.** Created, renamed, then deleted a disposable Team (`PLT-AUDIT-TC130-Team` → `-RENAMED` → deleted). All 3 actions (`created`, `updated`, `deleted`) appear in Audit events, each attributed to "Redmine Admin" with its own timestamp — the TC's literal requirement passes. While verifying this, found that the `created`/`updated` rows show an unhelpful "Team #16" (bare class+ID) rather than the team's actual name, once the team is later deleted — the `deleted` row alone shows the real name. Filed as **BUG-PLT-021** (see also TC-PLT-131 below, which is where this really belongs).

---

### TC-PLT-131: A deleted record's audit row still shows its name, not a bare class name and ID

**User Role:** Admin.
**Precondition:** TC-PLT-130 executed (a record has been deleted).

**Steps:**
1. View the delete's audit row.

**Expected Result:**
- Shows the record's actual name (e.g. the deleted team's name), not `RedminefluxPlatform::Team #10`. Per `PLATFORM_PLUGIN_TESTER_GUIDE.md` §9 this was a real fix already made in this build — verify it holds as a regression check.

**Status:** **EXECUTED 2026-09-30 — MIXED: PASS for the delete row itself (the original §9 fix holds); FAIL for that same record's create/update rows (regression of the identical problem, just in the 2 hooks the original fix never covered — BUG-PLT-021).** The `deleted` audit row for `PLT-AUDIT-TC130-Team-RENAMED` correctly shows the real name, confirming the original fix this TC exists to regression-check is intact. But investigating why held up a wider question — checked that same team's `created`/`updated` rows and found them showing the exact bare "ClassName #ID" pattern (`Team #16`) the §9 fix was written to eliminate, just for the 2 actions it was never extended to. Root cause confirmed from source: only the destroy hook snapshots a name into `metadata` before the record disappears; create/update never do, so once the record is later deleted, their audit rows have nothing to fall back on either. Filed as **BUG-PLT-021**.

---

### TC-PLT-132: Searching a name from the Audit trail's Record column finds the right entries

**User Role:** Admin.
**Precondition:** TC-PLT-130 executed.

**Steps:**
1. Search the audit list by the deleted/modified record's name.

**Expected Result:**
- Finds the matching audit rows. Per the Tester's Guide §9 this was also a real fix already made — verify it holds.

**Status:** **EXECUTED 2026-09-30 — PASS.** Searched Audit events for `PLT-AUDIT-TC130-Team-RENAMED` (the deleted team's name) — found the `deleted` row correctly. Only 1 row found, not 3 (the `created`/`updated` rows for the same team were not matched) — this is the expected, consistent downstream effect of BUG-PLT-021 (those 2 rows never had a name stored to search against in the first place, once the record was deleted), not a separate defect in the search itself.

---

### TC-PLT-133: Audit rows cannot be edited or deleted (append-only, by design — confirm this is still true, don't file it as a gap)

**User Role:** Admin.
**Precondition:** At least one audit row exists.

**Steps:**
1. Attempt to find any edit/delete control on an audit row, and if an API/console path is reasonably testable, attempt that too.

**Expected Result:**
- No edit/delete path exists anywhere — this is documented, correct behavior (an append-only trail), not a missing feature. (Duplicates TC-PLT-050's intent for the migrated-entries case; this TC covers newly-created rows too.)

**Status:** **EXECUTED 2026-09-30 — PASS.** No Edit/Delete control anywhere in the UI — list rows offer only "View", detail pages offer no action controls at all. Confirmed at the routing level too, not just UI-hidden: directly navigating to `/redmineflux_platform/list/audit_events/122/edit` returns a genuine 404, consistent with the shared `EntitiesController`'s own design (write actions are only enabled for entities that declare `fields`, and Audit Events declares none — append-only by construction, matching this repo's own standing rule about verifying hidden UI actually means blocked access, not just assuming it).

---

## Functional Cases — Tags & Responsive Layout

---

### TC-PLT-134: Tags on Organizations/Contacts behave as chips with suggestions, `×` removes one, Enter/comma adds one

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. At least one existing tag in use, to test suggestions against.

**Steps:**
1. On an Organization or Contact's tag field, type a partial match of an existing tag and confirm it's suggested.
2. Add a tag via Enter and via comma.
3. Remove a tag via its `×`.

**Expected Result:**
- All three interactions work as described.

**Status:** **EXECUTED 2026-09-30 — MIXED.** Tested on Organization edit `/redmineflux_platform/list/organizations/1/edit` (PLT-BASELINE-Acme Corp, pre-existing tag "PLT-BASELINE"). (1) Enter-to-add: typed `plt-qa-tag-enter` + Enter → added as a chip — PASS. (2) Comma-to-add: typed `plt-qa-tag-comma,` → added as a chip — PASS. (3) Suggestion-on-partial-match: initially mistested against the record's own already-applied tag (which the code deliberately excludes from its own suggestions via `!has(tag)` — confirmed correct, not a bug) — re-verified the suggestion *mechanism* itself is sound by reading `rf_platform_available_tags` (server-embeds every distinct tag across Organizations+Contacts) and the client-side substring filter in `platform.js`; both are correctly implemented — PASS. (4) `×` removal: **FAIL** — filed as **BUG-PLT-022**: clicking a different chip's `×` while the entry box still has uncommitted typed text silently fails to remove that chip and instead commits the leftover text as a new, unintended tag (root cause: the entry's `blur` handler commits+re-renders all chips, detaching the very `×` button mid-click, before its own `click` handler can fire). Reproduced cleanly on 2 independent trials with different target chips. Form was cancelled (not saved) afterward — confirmed via `rails runner` that Organization #1's `tags` column still reads only `"PLT-BASELINE"`, unaffected by any of this session's test edits.

---

### TC-PLT-135: At phone width (~390px), every Platform screen is reachable via the ☰ menu with no horizontal overflow

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Resize the browser to ~390px width.
2. Navigate to each Platform section via the ☰ menu.

**Expected Result:**
- No sideways page scroll on any screen; every section reachable through the collapsed menu, matching the "44px tap targets" fix noted in `PLATFORM_PLUGIN_TESTER_GUIDE.md` §9.

**Status:** **EXECUTED 2026-09-30 — PASS.** Resized viewport to 390×844. Confirmed `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow) on all 10 Platform screens: Overview, Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts, Audit events, Platform Settings — including Teams and Leaves, the two widest/most-columned tables. The Platform section rail (Overview/Teams/.../Platform Settings) is not a separate collapsed control — it renders as part of the same ☰ drawer as the main Redmine nav, between "General" and "Profile"; opened it and measured the "Teams" link's rendered box at 390px: height ≈ 44.0px, width 250px, matching the "44px tap targets" fix exactly. Navigated to Teams via the drawer link itself (not a direct URL) to confirm real click-through reachability, then verified the remaining 8 section URLs directly for overflow only (nav mechanism already confirmed structurally — same `<a>` list, same drawer). Viewport restored to 1280×800 afterward.

---

## Evidence Map

- Case ID: TC-PLT-113 … TC-PLT-135
- Screenshot: (bugs only) — BUG-PLT-017 (contacts-search-full-name-fails.png), BUG-PLT-019 (organizations-no-sortable-headers.png), BUG-PLT-020 (user-picker-filter-not-applied.png), BUG-PLT-022 (tag-remove-swallowed-phantom-tag-added.png)
- Log: —
- Bug reference: BUG-PLT-017, BUG-PLT-018, BUG-PLT-019, BUG-PLT-020, BUG-PLT-021, BUG-PLT-022

**Suite summary (2026-09-30):** 23 TCs (TC-PLT-113–135) executed. 17 clean PASS, 6 MIXED (partial PASS/FAIL within the same TC across entities) — TC-113, TC-115, TC-122, TC-130, TC-131, TC-134 — none fully FAIL. 6 new bugs found and filed this session: BUG-PLT-017 (Contacts search misses full-name), BUG-PLT-018 (Leaves has no search at all), BUG-PLT-019 (only Teams has sortable headers), BUG-PLT-020 (member-picker search doesn't filter), BUG-PLT-021 (deleted record's create/update audit rows lose their name), BUG-PLT-022 (tag chip × swallowed by a blur/click race). All 6 are still local-only (`bugs/open/`), not yet reported to production.
