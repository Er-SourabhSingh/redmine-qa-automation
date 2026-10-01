# Bug Report Template

- Bug ID: BUG-PLT-026
- Production Redmine Issue ID: #121859
- Title: The `rf_organization_contact_links` feature (Contact-to-Organization link with a role, e.g. "Primary Contact"/"Billing") has a fully built data model but zero UI, controller, or API to actually create/view/edit one — completely unreachable by any user
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Attempt to link `PLT-BASELINE-Jane Doe` (Contact) to `PLT-BASELINE-Acme Corp` (Organization) with a specific role (e.g. "Primary Contact"), per the plugin's own North-Star doc (§5.1: `account_contact_link(account, contact, role) — for the rarer case of a person spanning several accounts`).
2. Look anywhere in the UI — Organization detail page, Contact detail/edit page, Platform's generic entity list screens — for any control to create or manage this link.

## Expected result

- A way exists (even a simple one) to create a Contact↔Organization link with a `role_type`, since the ticket describes this as a real, distinct feature from the Contact's existing single `organization_id`/`company_id` field (meant for "the rarer case of a person spanning several accounts" — a consultant on retainer for three accounts, an auditor across a client's subsidiaries).

## Actual result

- No such control exists anywhere. The only Organization-linking control found is the Contact edit form's "Organization" dropdown (under a heading still labeled "Company" — see sub-finding below), which sets the Contact's single `company_id`-equivalent field — a completely different, pre-existing mechanism that cannot represent a contact holding multiple organization links with different roles.
- Confirmed by exhaustive source inspection that the feature is fully modeled but entirely unexposed:
  - **Migration** `db/migrate/037_create_rf_organization_contact_links.rb` — table `rf_organization_contact_links` with `organization_id`, `contact_id`, `role_type` (free-text, e.g. 'billing'/'technical'/'primary'/'requester'), `is_primary`, `start_date`/`end_date`, correct uniqueness index on `[organization_id, contact_id, role_type]`. A complete, well-designed schema.
  - **Model** `app/models/redmineflux_platform/organization_contact_link.rb` — full validations, `active`/`for_organization`/`for_contact`/`primary` scopes, `active?`, `to_s`. A complete, well-designed model.
  - **Controller**: none. `grep -rln 'OrganizationContactLink\|organization_contact_link' app/controllers/` returns nothing.
  - **Routes**: none. `grep -n 'contact_link\|organization_contact' config/routes.rb` returns nothing.
  - **Generic entity registry** (`lib/redmineflux_platform/shared_entities.rb`, the shared CRUD system covering "holiday schemes, holidays, leave types, leaves, organizations and contacts" per its own header comment): `OrganizationContactLink` is not one of the six registered entities, so it gets no create/update/delete screen from the shared mechanism either.
  - The **only** live reference to the association anywhere in app code is read-only and internal: `shared_entities.rb:1094`, `record.organization_contact_links.select(:organization_id)` — used purely as a convenience lookup for duplicate-organization detection, never to create or display a link with its role.
- Net effect: the feature exists in the database schema and in Ruby model code, and is fully unit-tested (`test/unit/organization_contact_link_test.rb`), but there is no way for an actual user — Admin or otherwise — to ever create one through the product.

### Sub-finding (same screen, same investigation, not a separate bug): leftover "Company" heading/field on Platform's own Contact form

The Contact edit form's Organization-selection section is headed **"Company"** (not "Organization") and contains a field literally labeled **"Company Identity"** (`for an employer that is not one of the organizations above`) — this is Platform's own screen, not CRM's, so it's a separate instance of the same vocabulary-consolidation gap already filed as `BUG-PLT-024` (which was scoped to CRM only). Worth fixing together since the root problem (leftover "Company" wording) is the same, but noting here since it's a different plugin/file than BUG-PLT-024's evidence.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-026/contact-edit-form-no-role-field-company-heading.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-026/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — this is a missing-feature-exposure gap, not a crash.

## Duplicate check

- Duplicate found: No — distinct from BUG-PLT-024 (which is CRM-screen-specific); this is Platform's own screen plus a separate, more significant missing-UI finding.

## Production report

Reported to production `ztflux` as **#121859** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121476 ("Cross-Plugin Consistency", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Medium (priority_id 2); Defect custom fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
