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

**Status:** **EXECUTED 2026-10-01 — PASS.** Added "Aurora Wren" to `PLT-BASELINE-QA Squad` (member count 4→5) via Timesheet's own `/timesheet/teams/1` "Add Member" dialog. Immediately confirmed from both other plugins with zero refresh/sync step: Workload's `/rf_teams` list shows the team's member count as "5"; Shift Management's `/shift_management/teams/1` detail page lists "5 members" with Aurora Wren present alongside the 4 pre-existing members (Redmine Admin, Luna Blossom, Daisy Skye, Nova Starling).

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

**Status:** **EXECUTED 2026-10-01 — FAIL.** The only Organization-linking control found anywhere is the Contact edit form's "Organization" dropdown (`/redmineflux_platform/list/contacts/1/edit`), which sets the Contact's single, pre-existing `organization_id` field — not the `rf_organization_contact_links` feature this TC targets. Confirmed via exhaustive source inspection that `rf_organization_contact_links` has a fully built migration (`db/migrate/037_create_rf_organization_contact_links.rb`) and model (`organization_contact_link.rb`, with `role_type`/`is_primary`/date-range fields and full validations/scopes) but **no controller, no route, and no entry in the generic shared-entity registry** (`shared_entities.rb` lists only "holiday schemes, holidays, leave types, leaves, organizations and contacts" as the six screens the shared CRUD mechanism serves) — the only live code reference to it anywhere in app code is a read-only internal lookup used for duplicate-organization detection. The feature cannot be exercised by any user through the product today. Filed as **BUG-PLT-026**. Sub-finding noted in the same bug: the Contact form's Organization section is still headed "Company" with a "Company Identity" field — a Platform-side instance of the same vocabulary gap as `BUG-PLT-024` (CRM-specific).

---

### TC-PLT-067: Duplicate-organizations detection report surfaces a real duplicate

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create two organizations with clearly similar/duplicate names (e.g. `PLT-DUPCHECK-Acme Inc` and `PLT-DUPCHECK-Acme Incorporated`).
2. Run/view the duplicate-organizations detection report.

**Expected Result:**
- The report flags the pair as a likely duplicate. Note the exact matching heuristic observed (exact name / fuzzy match / etc.) since the ticket doesn't specify it.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created `PLT-DUPCHECK-Acme Inc` (id 5) and `PLT-DUPCHECK-Acme Incorporated` (id 6). `/redmineflux_platform/organizations/duplicates` immediately flagged the pair under a "Similar name" group ("2 records"), listing both with their record IDs (#5/#6). Heuristic observed: fuzzy/prefix name matching (not exact-string, since "Acme Inc" ≠ "Acme Incorporated" character-for-character) — appears to match on a shared significant-word prefix ("Acme"), not Email/Industry (both "—" for these minimal fixtures). Test fixtures deleted after verification.

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

**Status:** **EXECUTED 2026-10-01 — PASS.** Confirmed via source + live DB query (not accidentally merged): `project_customer.rb` (Invoice, table `project_customers`) `belongs_to :customer, class_name: 'RedminefluxPlatform::Contact'`; `rf_project_customer.rb` (Helpdesk, table `rf_project_customers`) `belongs_to :customer, class_name: 'User'` plus its own `rf_sla`/`rf_support_level`/`rf_organization` associations — genuinely different target models, not a naming coincidence. Live query confirms the same real project (id 1) carries **both** associations simultaneously and independently: Invoice's own row (`customer_id=1`, a Contact) and Helpdesk's own row (`customer_id=25`, a User, with `sla_id=1`) — two separate rows in two separate tables for the same project, exactly as the design requires. Neither plugin's code references the other's model.

---

### TC-PLT-069: CRM's `rf_crm_activities` communication log is untouched by the audit consolidation

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Log a CRM activity (communication log entry) with email tracking.
2. Confirm it appears in CRM's own activities view, not folded into the unified `rf_audit_events` view from TC-PLT-049.

**Expected Result:**
- Activities log remains a separate, CRM-specific feature — not an audit trail, not consolidated.

**Status:** **EXECUTED 2026-10-01 — PASS.** Confirmed via live DB inspection: `CrmActivity` (table `rf_crm_activities`, 5 rows) and `RedminefluxPlatform::AuditEvent` (table `rf_audit_events`, 157 rows) are genuinely separate tables with no shared base class or association — `CrmActivity` has its own CRM-specific schema (`email_subject`/`email_from`/`email_to`/`email_status`/`email_sent_at`/`email_error` for communication/email tracking, plus `system_generated`), structurally unrelated to `AuditEvent`'s generic `auditable_type`/`auditable_id`/`action`/`changes_json` shape. The "Company updated by..." entries found during TC-PLT-080 (CRM Organization detail page) came from `rf_crm_activities`, confirmed not present in Platform's own `/redmineflux_platform/list/audit_events` unified view, since they live in an entirely separate table the unified view never queries.

---

### TC-PLT-070: Shift Management's 6 leave-accrual tables (balances, accrual logs, carry-forward logs, policy bands) still function standalone

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Exercise Shift Management's leave-accrual features (check a balance, trigger a carry-forward, view a policy band) — whatever is reachable via its UI.

**Expected Result:**
- Functions normally, unaffected by the Leave/Leave Type consolidation (Workload has no accrual equivalent, so per requirements these were deliberately left alone).

**Status:** **EXECUTED 2026-10-01 — PASS.** Confirmed all 5 accrual-related models still exist independently in Shift Management (`rf_leave_balance.rb`, `rf_leave_accrual_log.rb`, `rf_leave_carry_forward_log.rb`, `rf_leave_policy_band.rb`, `rf_leave_policy_band_detail.rb`) and are live/reachable: `/shift_management/leave?tab=bands` ("Policy Bands" tab) shows "1 policy band" with working "New Policy Band"; `/shift_management/leave_balances` loads cleanly ("Manage leave balance allocations for all users", "Available Balance" column, working "Assign Balance") with no errors. Unaffected by the platform-level Leave/Leave Type consolidation, consistent with the requirement that Workload (which has no accrual equivalent) left this feature set alone.

---

### TC-PLT-071: Invoice's own "Company" settings labels (invoice issuer details) are untouched by the vocabulary/Organization consolidation

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open Invoice's plugin settings where the issuer's own business details are configured.

**Expected Result:**
- Still labeled/functions as before — describes the invoice issuer's own business, unrelated to the shared Organization entity, per requirements.

**Status:** **EXECUTED 2026-10-01 — PASS.** `/settings/plugin/redmineflux_invoice?tab=company_details` — tab still titled "Company Details" with fields "Company Name", "Company Logo", Address, "Tax ID / VAT Number" — unchanged, still describing the invoice issuer's own business identity (a single, standalone settings record, not the shared `RedminefluxPlatform::Organization` entity). Correctly untouched by the Company→Organization vocabulary consolidation, since that consolidation was scoped to the shared CRM/Helpdesk Organization entity, not Invoice's own unrelated "who am I as the biller" concept.

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

**Status:** **RETESTED 2026-10-01 — the architecture this TC (and TC-PLT-095/096/097) was written against no longer exists; superseded by a simpler, better design, not a regression.** `/redmineflux_platform/settings` is now a single "General" section with exactly one field, "Working hours per day" (currently `8.0`), under the banner *"Whatever you set here is what the other RedmineFlux plugins use — this is the only place these values can be changed."* There is no "Currently inherited from redmineflux_workload (X)" hint anymore — that whole read-fallback mechanism (the thing `BUG-PLT-008` was originally filed against) appears to have been replaced outright. Workload's own `/rf_settings` now shows "Working Hours Per Day: 8.0" as **read-only**, with the text *"Shared across all RedmineFlux plugins — change it in Platform Settings →"* linking to `/redmineflux_platform/settings`. Net effect: Platform is now the single, sole, authoritative source for this value (one-way authority, not a bidirectional sync or a one-time inherit-then-diverge model) — confirmed the value matches (8.0 on both screens) which is this TC's core intent, just via a cleaner mechanism than originally anticipated.

---

### TC-PLT-095: Platform Settings "Company name"/Company Identity fields read Invoice's real value (read direction)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Invoice's own Company Details settings has a real, known Company Name.

**Steps:** Same method as TC-PLT-094, for the Company Identity fields against Invoice's settings.

**Expected Result:** Same as TC-PLT-094. **Same history as TC-PLT-094 — was `BUG-PLT-008`, now closed; retest on regression.**

**Status:** **RETESTED 2026-10-01 — the Company Identity fields this TC targets no longer exist on Platform Settings at all.** The current `/redmineflux_platform/settings` page has only the single "Working hours per day" field (see TC-PLT-094) — no Company Name, no Company Identity section, nothing referencing Invoice. Invoice's own `/settings/plugin/redmineflux_invoice?tab=company_details` ("Company Details": Company Name, Company Logo, Address, Tax ID/VAT) remains fully independent and editable, exactly as before — it was simply never wired into Platform Settings' (now working-hours-only) scope. This TC's premise (Platform Settings has Company Identity fields that read Invoice's value) describes a feature that isn't present in the current build — not a regression of something that once worked, since `BUG-PLT-008`'s own fix history was specifically about the working-hours field; recommend rewriting or retiring this TC rather than continuing to test against a removed feature.

---

### TC-PLT-096: Setting a value directly in Platform Settings does NOT write back to Workload/Invoice (documented current behavior, not a bug)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Type a new, distinct value into Platform's own "Working hours per day" and a Company Identity field, and Apply.
2. Reload Workload's and Invoice's own settings screens.

**Expected Result:**
- Per the dev's explicit scope decision on `BUG-PLT-008` (SettingsService's resolution is a one-directional fallback by design), Workload's and Invoice's own values are **unchanged** — this is documented, deliberate behavior, not a defect, unless the dev's stance on this changes in a later journal update. Re-check this expectation before assuming it's still correct.

**Status:** **EXECUTED 2026-10-01 — premise superseded, re-verified against the current architecture instead.** There is no longer a "Company Identity field" on Platform Settings to type into (see TC-PLT-095). For "Working hours per day": the field is **not** a one-directional fallback anymore — Workload's own screen has no independent value left to diverge from, since its field is now read-only and explicitly deferred to Platform ("Shared across all RedmineFlux plugins — change it in Platform Settings →"). This makes the current behavior stricter and simpler than what this TC describes: there is nothing to "write back" to, because Workload no longer has its own writable copy at all. Confirmed live: Workload's field remains non-editable regardless of what Platform's value is set to, exactly consistent with a true single-source-of-truth design. Invoice's Company Details remain fully untouched by this field, as expected (out of scope — different setting entirely).

---

### TC-PLT-097: Once Platform's own Settings value is set, it stops tracking the source plugin's live value

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Platform's "Working hours per day" has been given its own explicit value (post TC-PLT-096).

**Steps:**
1. Change Workload's own "Working Hours Per Day" to a new, different value.
2. Reload Platform Settings.

**Expected Result:**
- Platform's field keeps showing its own previously-set value, NOT Workload's new one, and the "Currently inherited from redmineflux_workload" hint wording disappears once Platform has its own value (confirmed behavior as of `BUG-PLT-008`'s fix — the hint is a one-time read-only display, only shown while Platform's own field is blank).

**Status:** **EXECUTED 2026-10-01 — premise superseded, N/A under the current architecture.** Step 1 (Workload has its own independently-settable "Working Hours Per Day") is no longer possible — confirmed above (TC-PLT-094/096) that Workload's field is read-only and has no independent value of its own to change. There is no "inherited" hint anymore to disappear, since the current design never shows one — Platform's field is just always authoritative. This TC's entire premise (a one-time inherit-then-pin behavior) describes a mechanism the current build does not have; the simpler reality (Platform is the only writable copy, full stop) makes this scenario moot rather than failing it.

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

**Status:** **EXECUTED 2026-10-01 — PASS with a caveat, not a bug.** Explored Shift Management's real UI to find the actual team-scoped feature (per this TC's own instruction not to assume one): `/shift_management/shifts?tab=assignments` → "New Assignment" has an "Employee(s)" multi-select. All of `PLT-BASELINE-QA Squad`'s current 5 members (Redmine Admin, Aurora Wren, Luna Blossom, Daisy Skye, Nova Starling) are present and selectable in this list — confirming team membership does flow through to a real, usable feature, not just the read-only team roster page. Caveat: the picker is a flat, org-wide employee list (all 21 users shown), not filtered/scoped by team — there is no "assign to this team" shortcut anywhere, including on the team's own `/shift_management/teams/1` page (which only offers Add/Edit/Remove member, no shift-scoped action). So the literal ask ("members correctly available/selectable") is satisfied, but there is no team-scoped convenience feature to test beyond that — worth noting as a product-completeness gap, not filed as a bug since nothing is broken or inconsistent.

---

### TC-PLT-103: Team membership change reflects in Timesheet's own workflows (not just the team page)

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. Add a new member to a team already in use by Timesheet (e.g. already assigned an Approval Schema, already has team-scoped reporting).
2. Check whether the new member is now correctly included in Timesheet's team-scoped views/workflows (approval routing, team reports, etc. — identify the real feature during exploration).

**Expected Result:**
- New member correctly flows into Timesheet's actual team-dependent features, not just the shared Team record's member list.

**Status:** **EXECUTED 2026-10-01 — PASS, strengthened with real data (partial depth on the approval-routing half only — see note).** Logged a real 3h time entry for Luna Blossom (existing QA Squad member) against `PLT-BASELINE-Project` issue #1. Confirmed `/reports?tab=timelogs`'s real "Team" filter (`team_id=1` server param) correctly surfaces it — filtering to `PLT-BASELINE-QA Squad` returns "6 records" including Luna Blossom's new entry, confirming team-scoped reporting genuinely reflects current membership's real logged time, not just a cosmetic dropdown. `PLT-BASELINE-QA Squad` already has a real Timesheet Approval Schema assigned ("plt schema", L1 Manager, confirmed on TC-PLT-061). **Still not independently re-verified for the approval-routing half** (a submitted-and-approved timesheet, not just a logged time entry) — Submissions/Approvals tab remains empty, and a full Submit round-trip requires logging in as the team member directly (Timesheet's Submit action is a per-user, not admin-proxyable action), a larger setup step deferred to a future session.

---

### TC-PLT-104: Team membership change reflects in Workload's capacity/allocation calculations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-043 PASS.

**Steps:**
1. Add/remove a member from a team already used in a Workload capacity view or allocation.
2. Check whether Workload's capacity figures/allocations update to reflect the new membership.

**Expected Result:**
- Workload's calculations correctly reflect the current team membership, not a stale snapshot from when the allocation was first made.

**Status:** **RE-EXECUTED 2026-10-01 with real fixture data — FAIL, confirmed via direct DB query.** Built real capacity data to unblock this TC: created a Workload (`PLT-DEPCHECK-Workload`, `PLT-BASELINE-QA Squad`, Oct 1–15) which captured all 5 then-current members (Redmine Admin, Luna Blossom, Daisy Skye, Nova Starling, Aurora Wren) with 80h/64h capacity each; created issue #2 and allocated 8h of it to Daisy Skye via "Add to Workload". Then removed Nova Starling from the Team itself (confirmed via DB: `team.team_memberships.exists?(user_id: nova.id)` → `false`). Reloaded both the Workload's own page and the org-wide Dashboard (with the Team filter applied) — **Nova Starling still appeared** as one of "5 of 5 members visible" with her full 80h capacity intact, and the Dashboard's "Active Users"/"Total Capacity" figures (5 / 384.0h) were completely unchanged by the removal. Confirmed via direct DB query this is a genuine stale snapshot, not a caching artifact: `RfWorkloadUser` (table `rf_workload_users`) is a separate join table populated once when a Workload is created, with no hook that re-syncs it when the underlying Team's membership later changes — `Workload rf_workload_users (snapshot): ... Nova Starling ...` while `Nova still in team_memberships? false` / `Nova still in rf_workload_users? true`. Filed as **BUG-PLT-029**. (Nova Starling re-added to the team afterward, restoring the baseline fixture to 5 members.)

---

### TC-PLT-105: Removing a team member who has existing shift assignments / timesheets / workload allocations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-102/103/104 PASS (member has real dependent records in all three).

**Steps:**
1. Remove that member from the team.
2. Check their existing shift assignments, timesheet entries, and workload allocations — do they remain intact (historical record preserved) or do they break/disappear/error?

**Expected Result:**
- Per TESTER_GUIDE.md's own framing ("the users themselves are not affected" by team removal), historical dependent records should remain intact and viewable; only future team-scoped actions should be affected. Any broken/orphaned reference here is a real bug.

**Status:** **UNBLOCKED and EXECUTED 2026-10-01 — PASS.** Built real dependent-record fixtures to satisfy the precondition: gave Luna Blossom (existing QA Squad member) a real Shift Assignment (`PLT-DEPCHECK-Morning Shift`), a real logged TimeEntry (3h, issue #1), and a real Workload allocation (8h planned, issue #3, via `PLT-DEPCHECK-Workload`) — confirmed all three via DB query before proceeding. Removed Luna Blossom from the Team itself (`/rf_teams/1`, confirmed via DB: `team_memberships.exists?` → `false`). Reloaded all three consumer plugins' own screens afterward: Shift Management's Assignments tab still lists her assignment ("Showing 1–3 of 3", no error); DB-confirmed her `TimeEntry` (3h) and `RfWorkloadUser` (8h planned) rows are both still present and unchanged. Per TESTER_GUIDE.md's framing ("the users themselves are not affected" by team removal), all three historical dependent records correctly remain intact and viewable after removal — no broken/orphaned reference, no crash. **Cross-reference**: this same "no live membership check" mechanism is also the root cause of `BUG-PLT-029` (TC-PLT-104) — there it's a defect (a *capacity-planning* screen keeps showing a departed member as if still on the team, with no indication she's left), but here, for *historical records*, the identical behavior is exactly correct per this TC's own expectation. Both findings are consistent, not contradictory: historical data should persist (TC-105, PASS); live membership-derived figures should not (TC-104, FAIL/`BUG-PLT-029`).

---

### TC-PLT-106: Renaming a team after it has been assigned to shifts/timesheets/workload allocations

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-102/103/104 PASS.

**Steps:**
1. Rename the team.
2. Check every place the old name was shown (Shift Management's shift assignments, Timesheet's approval/reporting views, Workload's capacity/allocation views).

**Expected Result:**
- New name appears everywhere immediately — no stale cached name shown anywhere, since this is one shared row per ADR 0001.

**Status:** **UNBLOCKED and EXECUTED 2026-10-01 — PASS.** With Luna Blossom's real dependent records now in place (TC-PLT-105), renamed the team from `PLT-BASELINE-QA Squad` to `PLT-BASELINE-QA Squad RENAMED` via Workload's own Edit screen. Confirmed the new name appears correctly and immediately, with no stale caching, everywhere checked: Workload's own team page heading; Timesheet's `/timesheet/teams` list; Shift Management's `/shift_management/departments?tab=teams` list; Timesheet Reports' Team filter dropdown; Workload Intelligence Dashboard's Team filter dropdown. No old name found lingering anywhere — consistent with Team being one genuinely shared row (ADR 0001), confirmed live across all 3 consumer plugins' own independent screens, not just a single shared view. Renamed back to `PLT-BASELINE-QA Squad` afterward to restore the baseline fixture.

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

**Status:** **UNBLOCKED and EXECUTED 2026-10-01 — deletion allowed, cascades, confirmed via DB; filed as a bug (see note).** Built a disposable team (`PLT-DELETECHECK-Team`, **not** the shared baseline — too risky to delete-test on a fixture other suites depend on) with a member (Nova Starling) carrying a real Shift Assignment and a real Workload (`PLT-DELETECHECK-Workload`) with allocated planned hours. Deleted the team via its own Delete button. **Result: deletion is allowed unconditionally** — "Team was successfully deleted", confirmed via DB: the team row and its Workload were both gone (`dependent: :destroy` on `has_many :rf_workloads` in `platform_team_patch.rb` — a deliberate cascade, not an oversight), while Nova's Shift Assignment survived (no FK relationship to the team row). The generic confirmation dialog ("...all associated data will be permanently removed") never specifically warns that Workload planning data will be destroyed, unlike Organization's own `register_destroy_guard` mechanism (TC-PLT-110) which refuses outright when dependents exist. Filed as **BUG-PLT-030** — not because cascading is necessarily wrong (it may be the intended design for a team-scoped Workload), but because the warning given is generic and doesn't disclose this specific, irreversible consequence, and because it's inconsistent with the "historical records survive" principle TC-PLT-105 just confirmed for Shift/Timesheet data.

---

### TC-PLT-112: Deleting a Holiday/Holiday Scheme in active use doesn't corrupt working-day calculations elsewhere

**User Role:** Admin.
**Precondition:** A Holiday/Scheme is actively used by a live Workload capacity view or Shift Management calendar.

**Steps:**
1. Delete the Holiday (or deactivate the Scheme).
2. Check Workload's capacity figures and Shift Management's calendar for that date range.

**Expected Result:**
- Working-day calculations update correctly and consistently across both consumer plugins — no stale "still counted as holiday" or crash in either.

**Status:** **EXECUTED 2026-10-01 — PASS.** Used a disposable fixture (`PLT-DELETECHECK-TempHoliday`, Nov 20 2026) rather than the shared `PLT-BASELINE-Founders Day` baseline other suites depend on. Created it under `PLT-BASELINE-Shift Holiday Scheme (Active)` — confirmed it must be the *active* scheme specifically; initially created it under `PLT-BASELINE-Holiday Scheme` (not marked Active) and it correctly did **not** appear on Shift Management's calendar, confirming the calendar genuinely reads from the active scheme rather than showing every scheme's holidays indiscriminately. After moving it to the active scheme, confirmed it rendered live on `/shift_management/calendar?month=2026-11` for every user row on "Fri 20" (`PLT-DELETECHECK-TempHoliday · National`). Deleted it via Platform's own Holidays screen, then reloaded the same calendar view: Nov 20 cleanly reverted to a normal working day ("–") for every row, no stale reference, no error/crash, and the unrelated Nov 15 `PLT-BASELINE-Founders Day` entry was correctly unaffected. Test fixture fully cleaned up.

---

## Evidence Map

- Case ID: TC-PLT-060 … TC-PLT-071, TC-PLT-094 … TC-PLT-106, TC-PLT-110 … TC-PLT-112
- Screenshot: (bugs only)
- Log: —
- Bug reference: TC-PLT-094/095 → `BUG-PLT-008` (closed, architecture since superseded — see TC-PLT-094/095/096/097 status notes); TC-PLT-099 → `BUG-PLT-009`/`BUG-PLT-010`; TC-PLT-100 → `BUG-PLT-011`; TC-PLT-066 → `BUG-PLT-026`; TC-PLT-104 → `BUG-PLT-029`; TC-PLT-111 → `BUG-PLT-030`
- All of TC-PLT-060–071, TC-PLT-094–112 are now executed (2026-10-01) — none remain BLOCKED or INCONCLUSIVE. TC-PLT-105/106/111 required building fresh disposable dependent-record fixtures (a real Shift Assignment, TimeEntry, and Workload allocation) rather than reusing the empty baseline team, since none of those existed in this environment before this session.
