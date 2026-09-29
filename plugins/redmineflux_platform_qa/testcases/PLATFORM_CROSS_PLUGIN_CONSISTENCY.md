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

---

### TC-PLT-064: Helpdesk Organization form actually submits and saves

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-063, for Helpdesk's organization create/edit form.

**Expected Result:** Same as TC-PLT-063.

---

### TC-PLT-065: Shift Management form(s) for consolidated entities actually submit and save

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-063, applied to Shift Management's Team, Holiday, and Leave forms (whichever now point at platform-owned models).

**Expected Result:** Same as TC-PLT-063, for each form.

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

## Evidence Map

- Case ID: TC-PLT-060 … TC-PLT-071
- Screenshot: (bugs only)
- Log: —
- Bug reference: —
