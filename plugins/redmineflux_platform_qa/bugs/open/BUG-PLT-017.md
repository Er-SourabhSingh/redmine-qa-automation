# Bug Report Template

- Bug ID: BUG-PLT-017
- Production Redmine Issue ID: #121707
- Title: Contacts search returns "No record matches" for the exact full name shown in the list, because search checks First Name and Last Name as separate fields, never the concatenated display name
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to Redmineflux Platform → Contacts (`/redmineflux_platform/list/contacts`).
2. Note the "Name" column shows a contact as, e.g., "PLT-BASELINE-Jane Doe" (a first name + last name, space-joined).
3. In the Search box, type that exact name exactly as displayed: `PLT-BASELINE-Jane Doe`. Click Apply.

## Expected result

- Per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s own testing guidance and this cycle's TC-PLT-113 ("Search finds a record by name on every list screen"), searching for a record's exact displayed name should return that record.

## Actual result

Searching the exact full name shown in the list returns **"No record matches"** — the record is right there in the unfiltered list, but a search for its own displayed name fails.

Confirmed by narrowing down the exact boundary:
- `Jane` alone → matches (1 result).
- `Doe` alone → matches (1 result).
- `PLT-BASELINE` alone → matches (1 result).
- `PLT-BASELINE-Jane` alone (first name only) → matches (1 result).
- `PLT-BASELINE-Jane Doe` (first name + last name together, i.e. the actual displayed Name) → **0 results, "No record matches."**

### Root cause (confirmed from source)

`RedminefluxPlatform::Contact` declares:

```ruby
rf_searchable_on :first_name, :last_name, :company_name, :email
```

The shared `Searchable` concern (`lib/redmineflux_platform/concerns/searchable.rb`) builds this into:

```ruby
where("LOWER(first_name) LIKE :term OR LOWER(last_name) LIKE :term OR LOWER(company_name) LIKE :term OR LOWER(email) LIKE :term", term: pattern)
```

— an OR across each column **independently**. A search term is only ever compared against one column value at a time; it is never compared against `first_name || ' ' || last_name` (the concatenated string the "Name" column actually displays). So any search term that only matches when it spans two of these columns — most obviously, the full displayed name — matches none of them and the search fails, even though the exact text is visible in the very next row of the unfiltered list.

This is a Contact-specific gap: every other entity currently using this same `Searchable` concern (Team, Holiday, HolidayScheme, LeaveType, Organization) searches on a single `:name` column that matches its own single displayed Name column exactly, so none of them can hit this failure mode. Contact is the only entity in this set whose displayed "Name" is a concatenation of two separately-searched columns.

## Evidence

### Screenshot

![Contacts search for the exact displayed name "PLT-BASELINE-Jane Doe" returns "No record matches"](../../screenshots/BUG-PLT-017/contacts-search-full-name-fails.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-017/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — a normal 200 response with zero matching rows, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-30 as **#121707** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121707 attached.
