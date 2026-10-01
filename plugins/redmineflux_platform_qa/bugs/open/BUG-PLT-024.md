# Bug Report Template

- Bug ID: BUG-PLT-024
- Production Redmine Issue ID: #121857
- Title: Leftover "Company" wording still appears throughout CRM's Organization detail page and in its own API controller response messages, contradicting the stated Company→Organization vocabulary consolidation
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_crm (consolidated vocabulary verified via redmineflux_platform)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Open any Organization's detail page in CRM, e.g. `/companies/1` (fixture `PLT-BASELINE-Acme Corp`).
2. Scroll through the Deals, Related Leads, and Linked Redmine Issues sections (with no linked records, so their empty-state text is visible).
3. Scroll to the Recent Activities log and look for an entry logged after an edit/update to the record (e.g. a Tags change).
4. Separately: update an Organization via the CRM API (`PUT/PATCH` to the companies endpoint) and inspect the JSON response `message` field.

## Expected result

- Per the plugin's own consolidation goal ("Company wording no longer appears anywhere in CRM" — `PLATFORM_VOCABULARY_AND_LABELS.md` TC-PLT-080), every one of these should read "Organization", not "Company".

## Actual result

Confirmed live via full-page snapshot of `/companies/1`, three distinct empty-state messages still say "company":
- Deals section: "No deals associated with this **company**"
- Related Leads section: "No leads currently mapped to this **company** name"
- Linked Redmine Issues section: "No Redmine issues linked to this **company's** contacts"

The Recent Activities log is internally inconsistent for the *same* record: the "created" entry correctly says "Organization created by Redmine Admin", but a later "updated" entry says **"Company updated by Redmine Admin Tags: \"\" → \"PLT-BASELINE\""** — i.e. two activity log entries on the same timeline, for the same entity, disagree on which noun to use.

### Root cause (confirmed from source)

Two independent leftover sources, not one:

**1. View-layer, `companies/show.html.erb`** — four locale keys still named/worded with `company`, confirmed via `config/locales/en.yml`:
```
label_no_deals_for_company:        "No deals associated with this company"
label_no_leads_for_company:        "No leads currently mapped to this company name"
label_no_linked_issues_company:    "No Redmine issues linked to this company's contacts"
```
There is also a duplicate/conflicting key pair for an unrelated string, confirming the locale file was never fully swept after the rename:
```
label_crm_new_company_subtitle: "Add a new organization to your CRM"   # correct, currently used
label_new_company_subtitle:     "Add a new company to your CRM"        # stale leftover, unused but still present
```

**2. API-layer, `app/controllers/api/companies_controller.rb`** — the create/update/destroy actions return a hardcoded literal English string in the JSON response's `message` field, independent of any locale file:
```ruby
def create
  ...
  render_success(company.as_json, status: :created, message: 'Company created')
end

def update
  ...
  render_success(@company.as_json, message: 'Company updated')
end

def destroy
  ...
  render_success({}, message: 'Company deleted')
end
```
This `message` value is what the frontend echoes into the Activity Log as "Company updated by <actor> ..." — the activity-log wording is not a separate copy-paste miss in a view template, it is being generated directly from this controller response. This explains why the "created" entry (driven by `RedminefluxPlatform::Organization`'s own `CrmAutoActivity#crm_log_created`, which correctly derives `"Organization"` from `self.class.name.sub('Crm', '')`) and the "updated" entry (driven by this controller's hardcoded string) disagree within the same timeline — they come from two completely different code paths, only one of which was updated for the consolidation.

Not yet swept: CRM's list page (`/companies`), create form (`/companies/new`), edit form (`/companies/1/edit`), and Settings — this bug is filed on the confirmed instances found so far; a broader sweep may surface more.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-024/company-wording-leftover-organization-detail.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-024/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS error — this is leftover server-rendered/API-returned text, not a client-side defect.

## Duplicate check

- Duplicate found: No — distinct from all prior BUG-PLT bugs; this is the first filed against leftover CRM vocabulary.

## Production report

Reported to production `ztflux` as **#121857** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121477 ("Vocabulary & Labels", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Low (priority_id 1); Defect custom fields: Type=Usability, Severity=Low-severity, Priority=Low.
