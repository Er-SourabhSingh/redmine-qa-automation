# Bug Report

- Bug ID: BUG-HLP-030
- Production Redmine Issue ID: 119958
- Title: Creating an SLA, Support Level, Holiday, or Product (Name or Code) over 255 characters crashes with an unhandled 500 error instead of a validation message
- Redmine version: 6.1.3.stable
- Plugin name: redmineflux_helpdesk
- Plugin version: (see plugin registry — not independently re-checked this session)
- Environment: Local (redmine-docker-6, localhost:3012)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-02

## Steps to reproduce

1. Log in as Admin. Go to Project (Helpdesk QA Alpha) › Helpdesk › Helpdesk SLA › New SLA (`/projects/1/rf_slas/new`).
2. Fill SLA Name with a 255-character string, First Response Time = 30 Minutes, Resolution Time = 60 Minutes, Save — succeeds normally ("Successful creation.").
3. Repeat with a 256-character SLA Name, same First Response/Resolution Time, Save.
4. **Broadened 2026-09-02**: the identical crash reproduces on a second, unrelated model. Go to Project › Helpdesk › Settings › Support Level › New Support Level (`/projects/1/rf_support_levels/new`). Fill Support Level Name with a 256-character string, Level Order, and a Support Assignee, Save.
5. **Broadened 2026-09-02 (again)**: reproduces on a third model too. Go to Project › Helpdesk › Settings › Holiday › New Holiday (`/rf_helpdesk_holidays/new?project_id=1`). Fill Holiday Name with a 256-character string, Start Date and End Date, Save.
6. **Broadened 2026-09-03**: reproduces on a fourth model, and on a SECOND column of that model. Go to New Product (`/rf_products/new`). Fill Name with a 256-character string, a valid Code, Save — crashes. Separately, fill a valid Name with a 256-character Code, Save — crashes identically, this time on the `code` column.

## Expected result

- Either the 256-char Name is accepted (if 255 isn't the intended limit), or it is refused with a clean, user-facing validation message such as "Name is too long (maximum is 255 characters)" — the same pattern this plugin already uses correctly for Organization Name (TC-HLP-092), Customer Login (TC-HLP-102), and Customer Last name (TC-HLP-113), all of which return a friendly `ActiveRecord::RecordInvalid`-style message instead of crashing.

## Actual result

- The request crashes with an unhandled Rails 500 "Internal error" page. Server log (`docker logs redmine-docker-6-redmine-1`) shows the real exception:
  ```
  ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1):
  Causes:
  Mysql2::Error (Data too long for column 'name' at row 1)
  ```
  This confirms the `Sla` model has no `validates :name, length: { maximum: 255 }` (or equivalent) — the raw MySQL column-width violation propagates straight to the user as a generic error page, with no indication of what went wrong or how to fix it. The 255-char boundary itself is correctly enforced by the DB column width, but the plugin never validates for it before attempting the `INSERT`, so exceeding it produces a crash rather than a graceful rejection.
- **Broadened 2026-09-02**: the identical crash and identical root cause reproduce on `SupportLevel#name` — server log confirms the exact same exception class:
  ```
  ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1):
  Causes:
  Mysql2::Error (Data too long for column 'name' at row 1)
  ```
  This is a systemic pattern, not a one-off: at least two of the plugin's models (`Sla`, `SupportLevel`) are missing a `name` length validation, both correctly capped at 255 by the DB column but both crashing instead of gracefully rejecting past it. Worth checking the plugin's other Name-bearing models (Organization, Customer, Product, Canned Response) for the same gap even where not yet independently confirmed by a TC — Organization Name (TC-HLP-092) and Customer Login/Last name (TC-HLP-102/335) were already confirmed to handle this correctly, so the gap is not universal across the plugin, just present on these two.
- **Broadened 2026-09-03**: reproduces identically on a third model, `RfHelpdeskHoliday#name` — same exact exception:
  ```
  ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1):
  Causes:
  Mysql2::Error (Data too long for column 'name' at row 1)
  ```
  Now confirmed on three separate models (`Sla`, `SupportLevel`, `RfHelpdeskHoliday`). Given the consistent pattern and identical exception across all three, this looks like a shared validation helper/concern that got applied to some models but not others, rather than three independent oversights — worth a targeted code review of every plugin model's `name` column for a missing `length: {maximum: 255}` validation, rather than continuing to find these one TC at a time.
- **Broadened 2026-09-03 (again)**: reproduces on a fourth model, `RfProduct`, and — new this time — on a SECOND distinct column of the same model, not just `name`:
  ```
  ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1):     -- Product Name, 256 chars
  ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'code' at row 1):     -- Product Code, 256 chars
  ```
  Now confirmed on four models (`Sla`, `SupportLevel`, `RfHelpdeskHoliday`, `RfProduct`) and two distinct columns (`name`, `code`) with the identical exception every time. This strongly suggests an install-wide gap — every string column across this plugin's own models likely lacks a matching `length: {maximum: ...}` validation for its DB column width, not just a couple of forgotten `name` fields. Recommend the dev team audit every `validates` block across all `Rf*`/`Sla`/`SupportLevel` models against their actual migration column widths, rather than this QA suite continuing to discover them one TC at a time — Organization Name/Website/Phone, Customer Login/Email/First+Last name, and Canned Response Name (TC-HLP-092/236-244/268) are the only fields *confirmed* handled correctly so far; everything else is unverified.

## Evidence

### Screenshot

![Bug evidence — SLA Name 256 chars triggers 500 error](../../screenshots/BUG-HLP-030/BUG-HLP-030-sla-name-256-chars-500-error.png)

![Bug evidence — Support Level Name 256 chars triggers the identical 500 error](../../screenshots/BUG-HLP-030/BUG-HLP-030-support-level-name-256-chars-500-error.png)

![Bug evidence — Holiday Name 256 chars triggers the identical 500 error](../../screenshots/BUG-HLP-030/BUG-HLP-030-holiday-name-256-chars-500-error.png)

![Bug evidence — Product Name 256 chars triggers the identical 500 error](../../screenshots/BUG-HLP-030/BUG-HLP-030-product-name-256-chars-500-error.png)

![Bug evidence — Product Code 256 chars triggers the identical 500 error on a different column](../../screenshots/BUG-HLP-030/BUG-HLP-030-product-code-256-chars-500-error.png)

### Console / log

```
I, [...] Started POST "/projects/1/rf_slas" for ... at 2026-09-02 13:26:31 +0000
I, [...] Processing by RfSlasController#create as HTML
I, [...]   Parameters: {..., "sla" => {"name" => "TTTT...TTTT" (256 chars), "first_response_time" => "30", "response_time_unit" => "minutes", "resolution_time" => "60", "resolution_time_unit" => "minutes", ...}}
I, [...] Completed 500 Internal Server Error in 20ms (ActiveRecord: 9.5ms (5 queries, 0 cached) | GC: 0.9ms)
F, [...] FATAL -- : ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1):
Causes:
Mysql2::Error (Data too long for column 'name' at row 1)
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119958 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- **SLA** (live UI retest): submitted New SLA with a 256-char Name (First Response 30 min, Resolution 60 min). **Result: no crash** — clean validation error *"Name is too long (maximum is 255 characters)"*, form re-rendered, no record created.
- **Support Level, Holiday, Product** (source verification via `docker exec`, since the Support Level form's multiselect Support Assignees widget wasn't reliably drivable via the MCP accessibility tree): confirmed each model's source now carries an explicit `length: { maximum: 255 }` validation, each with an inline comment referencing this bug ID:
  - `rf_support_level.rb`: `validates :name, presence: true, uniqueness: { scope: :project_id }, length: { maximum: 255 }`
  - `rf_helpdesk_holiday.rb`: `validates :name, presence: true, uniqueness: true, length: { maximum: 255 }`
  - `rf_product.rb`: `validates :name, ..., length: { maximum: 255 }` AND `validates :code, ..., length: { maximum: 255 }` (both columns fixed, matching the original bug's finding that both `name` and `code` crashed)
- All four models (and both affected `RfProduct` columns) now have the missing length validation, closing the systemic gap identified in this bug.
- Production issue #119958 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
