# Bug Report Template

- Bug ID: BUG-PLT-007
- Production Redmine Issue ID: #121548
- Title: Team screens in Redmineflux Platform don't match the rest of the product — garbled "RedmineRedmineflux Shift Management" header text, and delete-confirmation modal buttons are visibly smaller than the same buttons elsewhere
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `5db0312`
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-29

## Steps to reproduce

**Part A — header text:**
1. Log in as Admin, navigate to **Redmineflux Platform** from the top nav.
2. From the Platform's own left sidebar, navigate to **Teams** (`/redmineflux_platform/teams`) or open a team (`/redmineflux_platform/teams/1`).
3. Look at the page header, directly below the top navbar (above the breadcrumb / subnav tabs).

**Part B — delete popup button size:**
1. From the same Teams page (or any other Platform section: Holidays, Contacts, etc.), click **Delete** on a record to open the delete-confirmation modal.
2. Note the size of the "Cancel" / "Delete" buttons in the modal.
3. Compare against the equivalent delete-confirmation modal elsewhere in the product, e.g.:
   - Shift Management's own native Teams & Departments page (`/shift_management/departments?tab=teams`) → Delete on a team.
   - Helpdesk's Organizations page (`/rf_organizations`) → Delete on an organization.

## Expected result

- The page header should read "Redmineflux Platform" (or otherwise correctly identify the module being viewed), consistent with every other section of the plugin (Organizations, Holiday Schemes, Contacts, etc., which all show a clean header).
- The delete-confirmation modal's buttons should be the same size as the equivalent buttons used elsewhere in the product, since it is visually the same modal component (icon + heading + description + Cancel/Delete buttons) reused across plugins.

## Actual result

**A. Garbled header text on Team screens only.**
The header below the top navbar reads **"RedmineRedmineflux Shift Management"** — a doubled, garbled, and factually wrong string. It appears on both `/redmineflux_platform/teams` and `/redmineflux_platform/teams/1`, confirmed via accessibility snapshot:
```
heading "RedmineRedmineflux Shift Management" [level=1]
```
Root cause (observed): this exact same string also renders on Shift Management's own native pages (`/shift_management`, `/shift_management/departments`), so the Team screens are inheriting Shift Management's page-title/menu context instead of Platform's own. Every other Platform section checked (Organizations, Holiday Schemes, Contacts) shows a plain, correct "Redmine" header — only the Team-related screens carry this over.

**B. Delete-confirmation modal buttons are undersized compared to the rest of the product.**
Measured via `getComputedStyle`/`getBoundingClientRect` on the actual rendered buttons (not just visual comparison):

| Location | Button size (px) | Font size | Padding | Border radius |
|---|---|---|---|---|
| **Redmineflux Platform** — Teams delete modal | **~85–108 × 40** | 14px | 0 20px | 6px |
| Shift Management — native Teams delete modal | 201 × 44 | 15px | 0 7px | 8px |
| Helpdesk — Organization delete modal | 193–197 × 46 | 16px | 12px 24px | 8px |

Platform's Cancel/Delete buttons are roughly half the width of the equivalent buttons in Shift Management's and Helpdesk's own delete modals, with a smaller font size, smaller padding, and smaller corner radius — despite being visually the same modal component reused across the product. This holds on every Platform delete modal checked (Teams, Holidays, Contacts, "Remove from team"), not just one screen.

## Evidence

### Screenshot

![Team page header and delete modal](../../screenshots/BUG-PLT-007/team-page-header-and-delete-modal.png)

Comparison — Shift Management's native delete modal (larger buttons):
![Shift Management delete modal comparison](../../screenshots/BUG-PLT-007/shift-management-delete-modal-comparison.png)

Comparison — Helpdesk's Organization delete modal (larger buttons):
![Helpdesk delete modal comparison](../../screenshots/BUG-PLT-007/helpdesk-delete-modal-comparison.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-007/retest-yyyy-mm-dd-pass.png)

### Console / log

`browser_evaluate` measurements captured live against each modal's rendered Cancel/Delete buttons (see table in Actual result above for the consolidated figures).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-29 as **#121548** (project `ztflux`, tracker Bug, Priority Low, Defect Type Usability, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121548 attached.
