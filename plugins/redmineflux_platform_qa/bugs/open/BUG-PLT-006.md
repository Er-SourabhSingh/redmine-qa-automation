# Bug Report Template

- Bug ID: BUG-PLT-006
- Production Redmine Issue ID: #121543
- Title: Organization/Company merge doesn't actually merge same-named records — migration 011 only avoids ID collisions, creating a duplicate `rf_organizations` row instead
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `5db0312`
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade — TC-PLT-021 confirmed PASS on this environment)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-29

## Steps to reproduce

1. Pre-upgrade, on `master`: create a CRM Company and an independent Helpdesk Organization with the **exact same name** (this repo's fixture: `PLT-BASELINE-Acme Corp`, CRM Company id `1`, Helpdesk Organization id `1` — each plugin had its own separate table pre-upgrade, so both could independently be id `1`). See `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-003.
2. Run the branch upgrade (switch all 6 consumer plugins + platform to `redmineflux_platform`, run `rake redmine:plugins:migrate`) — per `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021, now confirmed PASS on this environment.
3. Post-upgrade, navigate to CRM's Organizations list (`/companies`) or Helpdesk's Organization list (`/rf_organizations`) and look for `PLT-BASELINE-Acme Corp`.

## Expected result

- Per the ticket's own stated design ("CRM's 'Company' and Helpdesk's 'Organization' were the same record under two names → `rf_organizations`, existing IDs preserved, no FK rewrite needed"), the two same-named pre-existing records should merge into **one** `rf_organizations` row.

## Actual result

**Two separate `rf_organizations` rows exist, both named exactly `PLT-BASELINE-Acme Corp` — no merge happened.**

- `/companies/1` (CRM's own "Organizations" view, formerly "Companies") resolves to `rf_organizations` id **1** — but this row holds **Helpdesk's** field values, not CRM's: Phone `+44 20 7946 0958`, Website `https://acme-helpdesk.example.net`, Employee Count `500`, Address `42 Helpdesk Fixture Lane, London, UK`, Notes = Helpdesk's fixture note. CRM's own Email/Industry/Assigned To are all blank (`—`).
- `/companies/2` resolves to a **second, separate** `rf_organizations` row holding CRM's original values: Email `acme-crm@example.com`, Phone `+1 415 555 2671`, Website `https://acme-crm-fixture.example.com`, Industry `Technology`, Employee Count `250`, Assigned To `Redmine Admin`, Address `100 CRM Fixture Ave, San Francisco, CA`.
- Confirmed via direct DB query — two rows, both named `PLT-BASELINE-Acme Corp`, both real and live:
  ```
  id  name                     phone_number         website                                employees  email                  industry    source_crm_company_id
  1   PLT-BASELINE-Acme Corp   +44 20 7946 0958     https://acme-helpdesk.example.net      500        NULL                   NULL        NULL
  2   PLT-BASELINE-Acme Corp   +1 415 555 2671      https://acme-crm-fixture.example.com   250        acme-crm@example.com  Technology  1
  ```

**This is the exact pre-consolidation problem the ticket describes still existing after the upgrade** — the same real-world organization is still represented by two independent records, just now living in one table instead of two. The consolidation's central claim (one entity, one row) did not happen for this case.

One thing that did work correctly: `rf_crm_contacts.company_id` for the CRM Contact `PLT-BASELINE-Jane Doe` was correctly remapped from `1` to `2`, so CRM's own contact-to-company FK link survived pointing at CRM's (unmerged) row. This only papers over the FK-remapping half of the problem — the underlying entities were never actually merged.

### Root cause (confirmed from source)

`db/migrate/011_data_merge_crm_companies.rb`:
```ruby
Company.order(:id).each do |company|
  next if done.include?(company.id)

  attrs = MAPPING.each_with_object({}) do |(from, to), acc|
    acc[to] = company[from] if company.has_attribute?(from)
  end
  attrs[:active] = true
  attrs[:source_crm_company_id] = company.id
  attrs[:created_at] = company.created_at || Time.now.utc
  attrs[:updated_at] = company.updated_at || Time.now.utc
  attrs[:name] = "CRM company #{company.id}" if attrs[:name].blank?
  attrs[:id] = company.id unless Organization.exists?(company.id)   # <-- only checks ID, never NAME

  row = Organization.new(attrs)
  row.save!(validate: false)
  ...
```
The only de-duplication check this migration performs is `Organization.exists?(company.id)` — it decides whether to **reuse** CRM's own numeric id, purely based on whether that id is already taken in `rf_organizations`. It never looks up an existing Organization **by name** (or by any other identifying attribute) to decide whether this CRM company is actually the same real-world entity as an already-existing Organization row. Since Helpdesk's Organization happened to already occupy id `1` (an unrelated coincidence of both tables independently auto-incrementing from 1), the migration's `unless Organization.exists?(company.id)` check is false, so it falls through to inserting a brand-new row at the next available id (`2`) — even though an Organization with the identical name `PLT-BASELINE-Acme Corp` already exists at id `1`.

The migration's own log output at the time named this outcome plainly: `-- company #1 -> organization #2`, and `remap_references` then dutifully rewired `rf_crm_contacts`/`rf_crm_deals` foreign keys to point at the new id `2` — the migration is entirely self-consistent about **not** merging, it just never attempts to.

## Evidence

### Screenshot

N/A — the evidence here is precise field-by-field row comparison, better shown as the accessibility snapshots and DB query captured in Console/log below than a screenshot.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-006/retest-yyyy-mm-dd-pass.png)

### Console / log

`/companies/1` (Helpdesk's row, viewed through CRM's UI):
```
Email: —
Phone: +44 20 7946 0958
Website: https://acme-helpdesk.example.net
Industry: —
Employee Count: 500
Assigned To: —
Address: 42 Helpdesk Fixture Lane, London, UK
Notes: PLT-BASELINE fixture (Helpdesk side) created pre-upgrade for TC-PLT-003/TC-PLT-040 migration-integrity testing. Do not delete.
```
`/companies/2` (CRM's row, unmerged):
```
Email: acme-crm@example.com
Phone: +1 415 555 2671
Website: https://acme-crm-fixture.example.com
Industry: Technology
Employee Count: 250
Assigned To: Redmine Admin
Address: 100 CRM Fixture Ave, San Francisco, CA
Tags: PLT-BASELINE
Notes: PLT-BASELINE fixture (CRM side) created pre-upgrade for TC-PLT-003/TC-PLT-040 migration-integrity testing. Do not delete.
Contacts: PLT-BASELINE-Jane Doe (correctly still linked)
```
DB query:
```sql
SELECT id, name, phone_number, website, number_of_employees, email, industry, source_crm_company_id
FROM rf_organizations WHERE name LIKE '%Acme%';

id  name                     phone_number         website                                employees  email                  industry    source_crm_company_id
1   PLT-BASELINE-Acme Corp   +44 20 7946 0958     https://acme-helpdesk.example.net      500        NULL                   NULL        NULL
2   PLT-BASELINE-Acme Corp   +1 415 555 2671      https://acme-crm-fixture.example.com   250        acme-crm@example.com  Technology  1
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-29 as **#121543** (project `ztflux`, tracker Bug, Priority High, Defect Type Functional, Defect Severity High-severity, Defect priority High, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121475** (`Data Migration Integrity`, Feature #120043 — the testcase that actually contains TC-PLT-040) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121543 attached. (An initial `report_defect` call mistakenly linked this to testcase #121473 — "Installation & Branch Upgrade" — before being corrected to #121475 and #121473 restored to `Passed`; #121473's defect list still shows #121543 for historical reasons even though it no longer affects that testcase's Passed status.)
