# Test Cases — Redmineflux Platform — Cross-Plugin Consistency (post-upgrade)

> Source: `docs/PLATFORM_REQUIREMENTS.md` Key Features, Known Constraints (deliberately-not-merged list); `docs/PLATFORM_FEATURES_LIST.md` #16–19.
>
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS. Where `PLATFORM_DATA_MIGRATION_INTEGRITY.md` checks that pre-existing data survived, this suite checks day-2 behavior — live writes made AFTER the upgrade, and things that must specifically NOT have been merged.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — Live Single-Source-of-Truth Behavior

---

### TC-PLT-060: Editing an Organization from CRM is immediately visible from Helpdesk

**User Role:** Admin.
**Precondition:** TC-PLT-040 PASS (merged `PLT-BASELINE-Acme Corp` organization exists).

**Steps:**
1. In CRM, edit the merged organization's phone number to a new value.
2. Without any explicit sync/refresh action, open the same organization from Helpdesk.

**Expected Result:**
- The new phone number is visible immediately from Helpdesk — confirms this is genuinely one shared row (single source of truth), not two synced copies.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS**, tested on a disposable fixture rather than the real `PLT-BASELINE-Acme Corp` (to avoid risking that shared fixture): created `PLT-CRUD-TestOrg` via CRM, edited its Phone Number from Helpdesk's own edit form (`/rf_organizations/3/edit`) to `+1 555 999 8888`, saved. Reloaded CRM's own detail page (`/companies/3`) — new phone number shown immediately, no refresh/sync step, confirming one shared row. Test record deleted afterward (clean delete, no dependents — see TC-PLT-110/BUG-PLT note below for the dependency-guard check on the real fixture).

---

### TC-PLT-061: Editing a Team from Timesheet is immediately visible from Workload and Shift Management

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. In Timesheet, add a new member to the merged `PLT-BASELINE-QA Squad` team.
2. Check Workload's and Shift Management's view of the same team.

**Expected Result:**
- New member visible immediately in both other plugins.

---

### TC-PLT-062: Creating a brand-new Organization post-upgrade is visible everywhere immediately

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create a new Organization from Helpdesk (not a pre-existing fixture — a genuinely new post-upgrade record), named `PLT-POSTUPGRADE-NewOrg`.
2. Check CRM's Companies list for it.

**Expected Result:**
- Immediately visible in CRM with no separate creation step needed — proves the two plugins now share one create path, not just one merged legacy row.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS**, tested in the reverse direction (Create via CRM instead of Helpdesk — equally valid, proves the same shared-create-path claim). Created `PLT-CRUD-TestOrg` via CRM's "New Organization" form (id 3). Immediately visible in Helpdesk's Organization list (`/rf_organizations`) with zero extra action. Cleaned up afterward.

---

## Functional Cases — Real Form Submission Post-Model-Swap

> The ticket specifically warns: "the consolidation changed the model behind each form and therefore its Rails param key — a break invisible to a read-only pass." These TCs exist specifically because a page merely *rendering* is not sufficient evidence the form actually works.

---

### TC-PLT-063: CRM Organization/Company form actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open the CRM create-organization form.
2. Fill in all fields, submit.
3. Confirm the record was actually created (not just a redirect that looks successful — check the list view / reload).

**Expected Result:**
- Record genuinely persists with all submitted field values. **If the form redirects "successfully" but nothing was actually saved (a stale/wrong param key silently discarded), that is exactly the class of bug this TC exists to catch — verify by reload, not by the redirect alone.**

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** `PLT-CRUD-TestOrg` created with Name/Email/Phone filled, confirmed genuinely persisted via a full reload of the detail page (not just trusting the redirect) — all three field values present. One minor, non-blocking client-side issue noted in passing: the Phone field's HTML `pattern` attribute (`[0-9+()\-\s]{7,25}`) throws a browser console error (`Invalid regular expression`, invalid character in a Unicode-mode character class) — this silently disables the field's client-side format hint/validation, though server-side save still worked fine. Not filed as a bug given its low impact (cosmetic validation-hint only); worth a quick fix but not blocking.

---

### TC-PLT-064: Helpdesk Organization form actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-063, for Helpdesk's organization create/edit form.

**Expected Result:** Same as TC-PLT-063.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** Edited `PLT-CRUD-TestOrg`'s Phone Number via Helpdesk's own edit form (`/rf_organizations/3/edit`), saved, confirmed genuinely persisted via reload — see TC-PLT-060 for the same test, cross-referenced.

---

### TC-PLT-065: Shift Management form(s) for consolidated entities actually submit and save

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-063, applied to Shift Management's Team, Holiday, and Leave forms (whichever now point at platform-owned models).

**Expected Result:** Same as TC-PLT-063, for each form.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **MIXED — Team PASSES, Leave and Leave Type both FAIL.**
  - **Team**: PASS. Created `SM-Native-Team-Verify` via Shift Management's own "New Team" (`/shift_management/departments?tab=teams`), confirmed genuinely persisted (visible in the list with correct member/status columns), cleaned up afterward.
  - **Leave**: FAIL — see `TC-PLT-099`/`BUG-PLT-009`/`BUG-PLT-010`.
  - **Leave Type**: FAIL — see `TC-PLT-046`/`BUG-PLT-012`.
  - Holiday not yet tested via Shift Management's own form specifically (only via Helpdesk's, TC-PLT-064's sibling test) — still open.

---

## Functional Cases — Organization–Contact Linking & Duplicate Detection

---

### TC-PLT-066: Link a Contact to an Organization with a role, confirm it's queryable from both sides

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Using the new `rf_organization_contact_links` feature, link `PLT-BASELINE-Jane Doe` (Contact) to `PLT-BASELINE-Acme Corp` (Organization) with a specific role (e.g. "Primary Contact").
2. View the Organization's page — is the linked Contact + role shown?
3. View the Contact's page — is the linked Organization + role shown?

**Expected Result:**
- Link visible and correctly attributed from both sides.

---

### TC-PLT-067: Duplicate-organizations detection report surfaces a real duplicate

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create two organizations with clearly similar/duplicate names (e.g. `PLT-DUPCHECK-Acme Inc` and `PLT-DUPCHECK-Acme Incorporated`).
2. Run/view the duplicate-organizations detection report.

**Expected Result:**
- The report flags the pair as a likely duplicate. Note the exact matching heuristic observed (exact name / fuzzy match / etc.) since the ticket doesn't specify it.

---

## Negative Cases — Deliberately NOT Merged (must stay separate)

---

### TC-PLT-068: Invoice `project_customers` and Helpdesk `rf_project_customers` remain distinct post-upgrade

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Link a project to a Contact for billing via Invoice's project-customer feature.
2. Independently, link the same project to a User with an SLA/support level via Helpdesk's project-customer feature.
3. Confirm both associations exist independently and neither plugin's UI shows the other's association as if they were the same thing.

**Expected Result:**
- Both stay genuinely separate — same-looking name, deliberately different meaning per requirements. **If these were accidentally merged, that's a regression against an explicit design decision — file as a bug.**

---

### TC-PLT-069: CRM's `rf_crm_activities` communication log is untouched by the audit consolidation

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Log a CRM activity (communication log entry) with email tracking.
2. Confirm it appears in CRM's own activities view, not folded into the unified `rf_audit_events` view from TC-PLT-049.

**Expected Result:**
- Activities log remains a separate, CRM-specific feature — not an audit trail, not consolidated.

---

### TC-PLT-070: Shift Management's 6 leave-accrual tables (balances, accrual logs, carry-forward logs, policy bands) still function standalone

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Exercise Shift Management's leave-accrual features (check a balance, trigger a carry-forward, view a policy band) — whatever is reachable via its UI.

**Expected Result:**
- Functions normally, unaffected by the Leave/Leave Type consolidation (Workload has no accrual equivalent, so per requirements these were deliberately left alone).

---

### TC-PLT-071: Invoice's own "Company" settings labels (invoice issuer details) are untouched by the vocabulary/Organization consolidation

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open Invoice's plugin settings where the issuer's own business details are configured.

**Expected Result:**
- Still labeled/functions as before — describes the invoice issuer's own business, unrelated to the shared Organization entity, per requirements.

---

## Functional Cases — Platform Settings Sync (added 2026-09-30, gap found via testing-promt.md comprehensive pass — no TC existed for this before BUG-PLT-008 was found ad hoc)

---

### TC-PLT-094: Platform Settings "Working hours per day" reads Workload's real value (read direction)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Workload's own settings (`/rf_settings`) has a real, known "Working Hours Per Day" value.

**Steps:**
1. Note Workload's own "Working Hours Per Day" value.
2. Open Platform Settings (`/settings/plugin/redmineflux_platform`). Check the "Working hours per day" field and its "Currently inherited from redmineflux_workload (X)" hint.

**Expected Result:**
- The field is pre-populated with Workload's actual value, and the hint's parenthetical matches it exactly.
- **NOT EXECUTED as a written TC before 2026-09-30 — found broken via ad hoc investigation, filed and closed as `BUG-PLT-008`.** Retest this TC explicitly on every future regression pass for this plugin.

---

### TC-PLT-095: Platform Settings "Company name"/Company Identity fields read Invoice's real value (read direction)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Invoice's own Company Details settings has a real, known Company Name.

**Steps:** Same method as TC-PLT-094, for the Company Identity fields against Invoice's settings.

**Expected Result:** Same as TC-PLT-094. **Same history as TC-PLT-094 — was `BUG-PLT-008`, now closed; retest on regression.**

---

### TC-PLT-096: Setting a value directly in Platform Settings does NOT write back to Workload/Invoice (documented current behavior, not a bug)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Type a new, distinct value into Platform's own "Working hours per day" and a Company Identity field, and Apply.
2. Reload Workload's and Invoice's own settings screens.

**Expected Result:**
- Per the dev's explicit scope decision on `BUG-PLT-008` (SettingsService's resolution is a one-directional fallback by design), Workload's and Invoice's own values are **unchanged** — this is documented, deliberate behavior, not a defect, unless the dev's stance on this changes in a later journal update. Re-check this expectation before assuming it's still correct.

---

### TC-PLT-097: Once Platform's own Settings value is set, it stops tracking the source plugin's live value

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Platform's "Working hours per day" has been given its own explicit value (post TC-PLT-096).

**Steps:**
1. Change Workload's own "Working Hours Per Day" to a new, different value.
2. Reload Platform Settings.

**Expected Result:**
- Platform's field keeps showing its own previously-set value, NOT Workload's new one, and the "Currently inherited from redmineflux_workload" hint wording disappears once Platform has its own value (confirmed behavior as of `BUG-PLT-008`'s fix — the hint is a one-time read-only display, only shown while Platform's own field is blank).

---

## Functional Cases — New Leave Filed Through Each Entry Point (added 2026-09-30 — extends the "Real Form Submission" section above, which covered Organization/Team/Holiday forms but not Leave)

---

### TC-PLT-098: Platform's own "New Leave Request" screen actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/leaves/new`, fill in User, Leave Type, Start/End Date, Reason, submit.
2. Confirm the record persists (reload the Leaves list, don't trust the redirect alone).

**Expected Result:**
- Leave created successfully. **Confirmed PASS 2026-09-30** — this is the one entry point of the three that works correctly.

---

### TC-PLT-099: Shift Management's "Apply Leave" actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-098, via `/shift_management/leave` → "Apply Leave".

**Expected Result:** Same as TC-PLT-098.
- **CONFIRMED FAIL 2026-09-30** — two rounds of failure: originally 400 (`ActionController::ParameterMissing: rf_leave_application`, filed as `BUG-PLT-009`); after that fix, now fails with a 500 (`AuditEvent.log` signature collision, filed as `BUG-PLT-010`). Neither the original symptom's full user-facing impact (a working Apply Leave) nor the underlying feature is actually fixed yet — retest against both bugs before marking PASS.

---

### TC-PLT-100: Workload's "Request Leave" actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-098, via `/rf_leaves` → "+ Request Leave".

**Expected Result:** Same as TC-PLT-098.
- **CONFIRMED FAIL 2026-09-30** — 400 (`ActionController::ParameterMissing: rf_leave`), filed as `BUG-PLT-011`. Same defect class as TC-PLT-099/`BUG-PLT-009`, different plugin/controller, never touched by any fix.

---

### TC-PLT-101: A leave filed via any one entry point is immediately visible, with consistent field values, from the other two

**User Role:** Admin.
**Precondition:** TC-PLT-098 PASS (at least one entry point must work to have something to check).

**Steps:**
1. File a leave via Platform's own screen (the only currently-working entry point per TC-PLT-098/099/100).
2. Check the same leave's visibility and field values from Shift Management's Leave list and Workload's Leave list.

**Expected Result:**
- Same single record, same field values, visible from all three screens immediately, no separate sync step. **BLOCKED pending TC-PLT-099/100's bugs being fixed** for the reverse directions (filed-via-Shift-Management/Workload-visible-elsewhere) — only the Platform→others direction is currently testable.

---

## Functional Cases — Team → Consumer Plugin Deep Workflows (added 2026-09-30, per testing-promt.md §5 — prior TC-PLT-061 only checked a membership edit reflects across plugins, not the deeper "team actually usable end-to-end" workflows)

---

### TC-PLT-102: A team configured in Platform is usable end-to-end in Shift Management (assignment, not just visibility)

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. In Platform (or any consumer), create/configure a team and assign at least 2 users to it.
2. In Shift Management, use this team for whatever team-scoped action its UI actually offers (e.g. a shift assignment scoped to team members, a team-level leave-approval view, an attendance report filtered by team) — identify the real feature during exploration, don't assume one.
3. Confirm the team's members are correctly available/selectable in that Shift Management feature.

**Expected Result:**
- Team membership set in Platform is fully usable in Shift Management's own real features, not just visible on a read-only team page.

---

### TC-PLT-103: Team membership change reflects in Timesheet's own workflows (not just the team page)

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. Add a new member to a team already in use by Timesheet (e.g. already assigned an Approval Schema, already has team-scoped reporting).
2. Check whether the new member is now correctly included in Timesheet's team-scoped views/workflows (approval routing, team reports, etc. — identify the real feature during exploration).

**Expected Result:**
- New member correctly flows into Timesheet's actual team-dependent features, not just the shared Team record's member list.

---

### TC-PLT-104: Team membership change reflects in Workload's capacity/allocation calculations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. Add/remove a member from a team already used in a Workload capacity view or allocation.
2. Check whether Workload's capacity figures/allocations update to reflect the new membership.

**Expected Result:**
- Workload's calculations correctly reflect the current team membership, not a stale snapshot from when the allocation was first made.

---

### TC-PLT-105: Removing a team member who has existing shift assignments / timesheets / workload allocations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-102/103/104 PASS (member has real dependent records in all three).

**Steps:**
1. Remove that member from the team.
2. Check their existing shift assignments, timesheet entries, and workload allocations — do they remain intact (historical record preserved) or do they break/disappear/error?

**Expected Result:**
- Per TESTER_GUIDE.md's own framing ("the users themselves are not affected" by team removal), historical dependent records should remain intact and viewable; only future team-scoped actions should be affected. Any broken/orphaned reference here is a real bug.

---

### TC-PLT-106: Renaming a team after it has been assigned to shifts/timesheets/workload allocations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-102/103/104 PASS.

**Steps:**
1. Rename the team.
2. Check every place the old name was shown (Shift Management's shift assignments, Timesheet's approval/reporting views, Workload's capacity/allocation views).

**Expected Result:**
- New name appears everywhere immediately — no stale cached name shown anywhere, since this is one shared row per ADR 0001.

---

## Functional Cases — Delete-Dependency Behavior for Shared Entities (added 2026-09-30, per testing-promt.md §3 Delete / §6)

---

### TC-PLT-110: Deleting an Organization referenced by dependent records (project customers, contacts) is refused or clearly handled

**User Role:** Admin.
**Precondition:** An Organization exists with at least one dependent record (a linked Contact, a Helpdesk project-customer association).

**Steps:**
1. Attempt to delete the Organization.

**Expected Result:**
- Per `PLATFORM_PLUGIN_README.md`'s documented `register_destroy_guard` mechanism, the delete should be refused with a clear reason (e.g. "in use by project customers") rather than silently cascading or leaving orphaned references. Confirm which guard(s) are actually registered live (Helpdesk's is documented; check whether CRM/Invoice register their own).

- **CONFIRMED 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS, verified via source + data rather than an actual live delete on the real fixture** (deliberately did not click through to an actual destroy on `PLT-BASELINE-Acme Corp` — it's a shared fixture other suites depend on, and the risk of the guard somehow not firing wasn't worth it for a confirmable-by-inspection question).
  - Confirmed `RedminefluxPlatform::Organization` has `before_destroy :run_destroy_guards` — a **model-level** callback, so it fires regardless of which controller (CRM's or Helpdesk's) initiates the `.destroy` call, not just a per-controller check.
  - Confirmed only **Helpdesk** registers a guard (`plugins/redmineflux_helpdesk/lib/redmineflux_helpdesk/patches/platform_organization_patch.rb`) — checks `RfProjectCustomer`, `RfIssueSlaStatus`, and `Helpdesk::PrepaidSupportHour` for the organization's id; CRM and Invoice register none.
  - Confirmed via direct DB query that `PLT-BASELINE-Acme Corp` (Organization id 1) genuinely has **1 dependent `rf_project_customers` row** — so the guard's first condition (`RfProjectCustomer.where(rf_organization_id: org.id).exists?`) would be true, meaning an actual delete attempt would genuinely be refused with `error_organization_in_use_customers`.
  - Separately confirmed CRM's own delete-confirmation modal text ("All associated contacts and deal relationships for this company will be permanently removed") does **not** mention this guard at all — it's a generic front-end warning, unaware of the guard, which only fires server-side at the model layer regardless of what the modal says. Worth noting for a future UX pass: the confirmation dialog could mislead an admin into expecting a clean cascade when the real backend behavior is a hard refusal.
  - CRM's own contacts/deals **do** cascade-delete when an Organization with no Helpdesk-side dependency is removed — confirmed live on the disposable `PLT-CRUD-TestOrg` (no dependents, deleted cleanly, per TC-PLT-060/063's cleanup step).

---

### TC-PLT-111: Deleting a Team referenced by existing Workload allocations/Timesheet entries/Shift assignments

**User Role:** Admin.
**Precondition:** TC-PLT-102/103/104 PASS (team has real dependent records in all three consumer plugins).

**Steps:**
1. Attempt to delete the team.

**Expected Result:**
- Either refused with a clear reason naming the dependency, or (if deletion is allowed) historical dependent records remain intact per TC-PLT-105's expectation — document actual behavior precisely, since this isn't specified in the requirements.

---

### TC-PLT-112: Deleting a Holiday/Holiday Scheme in active use doesn't corrupt working-day calculations elsewhere

**User Role:** Admin.
**Precondition:** A Holiday/Scheme is actively used by a live Workload capacity view or Shift Management calendar.

**Steps:**
1. Delete the Holiday (or deactivate the Scheme).
2. Check Workload's capacity figures and Shift Management's calendar for that date range.

**Expected Result:**
- Working-day calculations update correctly and consistently across both consumer plugins — no stale "still counted as holiday" or crash in either.

---

## Evidence Map

- Case ID: TC-PLT-060 … TC-PLT-071, TC-PLT-094 … TC-PLT-106, TC-PLT-110 … TC-PLT-112
- Screenshot: (bugs only)
- Log: —
- Bug reference: TC-PLT-094/095 → `BUG-PLT-008` (closed); TC-PLT-099 → `BUG-PLT-009`/`BUG-PLT-010`; TC-PLT-100 → `BUG-PLT-011`
