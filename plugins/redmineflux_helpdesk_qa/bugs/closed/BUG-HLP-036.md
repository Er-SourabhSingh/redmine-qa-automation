# BUG-HLP-036

- Bug ID: BUG-HLP-036
- Production Redmine Issue ID: 120075
- Title: Creating a Support Package with a duplicate Name is correctly refused, but shows zero error message — only the input border changes color, no text anywhere explains why
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-03)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-03

## Steps to reproduce

1. A Support Package named "Premium Support" already exists.
2. Command Center → Helpdesk Settings → Support Packages → New Support Package.
3. Enter the exact same Name, "Premium Support". Click Create.

## Expected result

The duplicate should be refused (correctly, it is — see Actual result) **with a clear message identifying the problem**, e.g. "Name has already been taken" — the standard Rails uniqueness-validation message shown elsewhere in this plugin (Organization, SLA, Support Level, Canned Response, Product all show an equivalent message for their own duplicate-name checks).

## Actual result

The duplicate is genuinely refused — confirmed via the Support Packages list before and after the attempt: still exactly 3 packages, no 4th "Premium Support" row created. Data integrity is correctly preserved. **However, no error text is shown anywhere on the page.** The form simply re-renders with the submitted Name still in the box and its border changed to orange/red — no message text near the field, no page-level flash/alert banner, nothing in the DOM matching any `.error`/`.alert`/`[class*="error"]` selector. A real user would see the page reload, their input untouched, and have no way to know *why* nothing happened — they could reasonably assume the click didn't register at all and simply click Create again.

## Evidence

### Screenshot

![New Support Package form after a duplicate-name Create attempt — Name field border is orange/red but no error text is visible anywhere on the page](../../screenshots/BUG-HLP-036/bug-hlp-036-no-error-message-shown.png)

### Console / log

- `document.querySelectorAll('.flash, .error, [class*="error"], [class*="alert"]')` returned an empty array on the re-rendered form — no error-carrying element exists in the DOM at all, not just a hidden/unstyled one.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_PREPAID_HOURS.md` TC-HLP-208 (2026-09-03), on the same newly-discovered Support Packages entity as BUG-HLP-035.
- Severity judged **Low**: unlike BUG-HLP-035, there is no functional/data defect here at all — the uniqueness constraint works exactly as intended. This is purely a missing user-feedback gap, but still worth fixing since a user has no way to self-correct without guessing the problem is a duplicate name.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #120075 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Existing Support Package "Premium Support (Renamed)" (id 1). Submitted New Support Package with the exact same Name. **Result: blocked with a clear error message** — a list item at the top of the form reading *"Name has already been taken"*, standard Rails uniqueness-validation styling. No record created (list still shows only the original 2 packages).
- Production issue #120075 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
