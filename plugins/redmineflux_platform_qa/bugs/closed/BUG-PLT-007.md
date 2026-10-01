# Bug Report Template

- Bug ID: BUG-PLT-007
- Production Redmine Issue ID: #121548
- Title: Platform/Shift Management header text is wrong or missing across pages, an unwanted breadcrumb persists below it, and delete-confirmation modal buttons are still undersized vs. the rest of the product
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform / redmineflux_shift_management
- Plugin version: `redmineflux_platform` branch, commit `6706a1e` (platform), `5874fa0` (shift_management)
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-29, corrected/expanded 2026-09-30

## Steps to reproduce

**Part A — Shift Management's own header text:**
1. Log in as Admin, navigate to **Shift Management** from the top nav (or any of its native pages: Dashboard, Leave, Teams & Departments, etc.).
2. Look at the page header banner directly below the top navbar.

**Part B — Platform's own header text (Overview vs. every other section):**
1. Navigate to **Redmineflux Platform** from the top nav — this is the Overview page.
2. Look at the header banner below the top navbar.
3. From the Platform's own left sidebar, navigate to any other section (Teams, Holidays, Leave Types, Organizations, Contacts, Audit events, etc.).
4. Look at the same header banner on this page.

**Part C — breadcrumb below the header:**
1. On any Platform section other than Overview (e.g. Teams, `/redmineflux_platform/teams`), look directly below the header banner, above the page's own content card.

**Part D — delete popup button size:**
1. From any Platform section, click **Delete** on a record to open the delete-confirmation modal (`#rf_platform_confirm_modal`).
2. Measure the "Cancel" / "Delete" buttons' rendered size.
3. Compare against the equivalent delete-confirmation modal elsewhere in the product, e.g.:
   - Shift Management's own native Teams & Departments page (`/shift_management/departments?tab=teams`) → Delete on a team.
   - Helpdesk's Organizations page (`/rf_organizations`) → Delete on an organization.

## Expected result

- **A.** Shift Management's own header should read **"Shift Management"** only.
- **B.** Platform's header banner should consistently read **"Redmineflux Platform"** on every one of its own pages, including Overview.
- **C.** The breadcrumb line below the header (the `rf_platform_crumb` block, e.g. "Redmineflux Platform › Teams") should not be shown at all — the sidebar already provides navigation, so it is redundant.
- **D.** The delete-confirmation modal's buttons should be the same size as the equivalent buttons used elsewhere in the product, since it is visually the same modal component (icon + heading + description + Cancel/Delete buttons) reused across plugins.

## Actual result

**A. Shift Management's header still reads "Redmineflux Shift Management".**
Confirmed live on `/shift_management` (Dashboard) via accessibility snapshot: `heading "Redmineflux Shift Management" [level=1]`. The garbled doubling ("RedmineRedmineflux...") from the first report is gone, but "Redmineflux" was never meant to be there at all — only "Shift Management" should show.

**B. Platform's own header banner is wrong on Overview and blank everywhere else.**
- Overview (`/redmineflux_platform`): banner shows plain **"Redmine"** — screenshot `overview-banner-shows-redmine.png`.
- Every other Platform section checked (confirmed on Teams, `/redmineflux_platform/teams`): banner is **completely blank**, no text rendered at all — screenshot `teams-banner-blank-and-breadcrumb.png`.
- Expected "Redmineflux Platform" appears on neither.

**C. Breadcrumb below the header is still fully present, unremoved.**
Confirmed live on both `/redmineflux_platform/teams` (list) and `/redmineflux_platform/teams/1` (detail) — the exact block flagged in the original report is untouched:
```html
<div class="rf_platform_crumb">
  <a class="rf_platform_link" href="/redmineflux_platform">Redmineflux Platform</a>
  <span class="rf_platform_crumb_sep">›</span>
  <span>Teams</span>
</div>
```
Visible in `teams-banner-blank-and-breadcrumb.png`, directly below the (blank) header banner. Confirmed present on every Platform section except Overview.

**D. Delete-confirmation modal buttons are closer in height/font but still undersized on width.**
Re-measured on the Teams list page's delete modal (`#rf_platform_confirm_modal`) via `getComputedStyle`/`getBoundingClientRect`:

| Location | Button size (px) | Font size | Padding | Border radius |
|---|---|---|---|---|
| **Redmineflux Platform** — delete modal (post-fix) | **~104–108 × 44** | 15px | 0 28px | 10px |
| Shift Management — native Teams delete modal | 201 × 44 | 15px | 0 7px | 8px |
| Helpdesk — Organization delete modal | 193–197 × 46 | 16px | 12px 24px | 8px |

Height and font size now roughly match both references. Width is still only about half of either reference (~105px vs. ~195–200px), and the border-radius (10px) overshoots both references (8px) instead of landing on either — so this button size, while improved, still doesn't actually match the rest of the product.

## Evidence

### Screenshot

![Team page header and delete modal](../../screenshots/BUG-PLT-007/team-page-header-and-delete-modal.png)

Comparison — Shift Management's native delete modal (larger buttons):
![Shift Management delete modal comparison](../../screenshots/BUG-PLT-007/shift-management-delete-modal-comparison.png)

Comparison — Helpdesk's Organization delete modal (larger buttons):
![Helpdesk delete modal comparison](../../screenshots/BUG-PLT-007/helpdesk-delete-modal-comparison.png)

Overview's header banner shows "Redmine" instead of "Redmineflux Platform":
![Overview banner shows Redmine](../../screenshots/BUG-PLT-007/overview-banner-shows-redmine.png)

Teams page's header banner is blank, and the breadcrumb below it is still present:
![Teams banner blank and breadcrumb still present](../../screenshots/BUG-PLT-007/teams-banner-blank-and-breadcrumb.png)

### Retest screenshot

![Retest — Team detail page header and delete modal, post first fix round](../../screenshots/BUG-PLT-007/retest-2026-09-30-team-detail-page-header-and-modal.png)

### Console / log

`browser_evaluate` measurements captured live against the delete modal's rendered Cancel/Delete buttons (see table in Actual result, part D, above).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-29 as **#121548** (project `ztflux`, tracker Bug, Priority Low, Defect Type Usability, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121548 attached.

## Retest 2026-09-30 — first fix round (commit `8bbf25a` platform / a separate shift_management commit)

The dev's first fix round (journal, 2026-09-29 14:38:20) addressed the garbled-doubling symptom exactly as originally (mis-scoped) reported, but the actual, fuller intent behind the report was not fully captured in that first write-up. Retest against the corrected scope above finds:

- **A — NOT fixed as intended.** "Redmineflux" prefix is still shown; only the doubling was removed.
- **B — NOT addressed at all.** This exact defect (Platform's own header banner wrong/blank) was never part of the original report's Part A description, so the fix naturally didn't touch it. Newly documented here.
- **C — NOT addressed at all.** The breadcrumb removal was never part of the original report's wording either (it was described as part of the garbled header text). Newly documented here as its own, explicit item.
- **D — Partially fixed.** Height/font size now match; width and border-radius still don't.

Reopening — none of the four items are fully resolved to the corrected scope above.

## Retest 2026-10-01 — second fix round (commits `bb4d6d5` platform, `8ee8cdc` shift_management) — CONFIRMED FIXED, closed

Pulled both commits (already on disk, confirmed via `git log`), ran pending plugin migrations (platform now at migration 40, all applied), restarted the container, retested all four parts live via `browser_evaluate` against the real DOM/CSS (not just a visual read):

- **A — FIXED.** `/shift_management`: `getComputedStyle(h1, '::after').content` → `"Shift Management"` only; core `<h1>` computed `font-size: 0px` (genuinely hidden, not just visually overlapped). No "Redmineflux" prefix anywhere.
- **B — FIXED.** Confirmed on both Overview (`/redmineflux_platform`) and Teams (`/redmineflux_platform/teams`): `::after` content is `"Redmineflux Platform"` on both, consistently.
- **C — FIXED.** `document.querySelector('.rf_platform_crumb')` → `null` on the Teams page (and Overview, which never had one). Breadcrumb fully removed.
- **D — FIXED.** Measured Cancel/Delete buttons on the real `#rf_platform_confirm_modal` (Platform's own Teams delete confirmation): **190 × 45.8px**, 15px font, 8px border-radius, 14px 24px padding — within the 193–201px reference band the dev cited (CRM/Shift Management/Helpdesk's own modals), confirmed via `getBoundingClientRect()`/`getComputedStyle()` directly on the rendered buttons, not estimated.

All four parts genuinely fixed. Closed — moving to `bugs/closed/`.
