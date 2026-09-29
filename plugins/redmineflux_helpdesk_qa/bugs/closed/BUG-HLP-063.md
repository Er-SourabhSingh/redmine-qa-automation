# BUG-HLP-063

- Bug ID: BUG-HLP-063
- Production Redmine Issue ID: 121400
- Title: New/Edit Global SLA forms render inside the wrong top-level layout ("Redmine" branded header, not "Helpdesk") and drop the Helpdesk Settings sub-navigation the Global SLAs list page itself shows (HD-6, found via user observation on production issue #121289)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, includes HD-4/HD-5/HD-6/HD-7 per production issue #121289, branch `helpdesk_budget` merged, commit `74c4ed0`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Navigate Helpdesk Settings → **Global SLAs** tab (`/rf_helpdesk/setting?tab=global_slas`) — note the page's H1 reads "Helpdesk" and the left sidebar shows the full **Helpdesk Settings** sub-navigation (Holiday, Products, Email Configuration, Canned Responses, Support Packages, Global SLAs).
3. Click **New Global SLA** (`/rf_helpdesk_global_slas/new`).
4. Inspect the resulting page's H1 and left sidebar.
5. Repeat for **Edit** on an existing Global SLA (`/rf_helpdesk_global_slas/:id/edit`).

## Expected result

The New/Edit Global SLA forms should render inside the same Helpdesk-branded layout as the list page they were reached from — H1 "Helpdesk", and the Helpdesk Settings sub-navigation sidebar still visible (or at minimum, the same layout every other Helpdesk Settings sub-resource's own New/Edit form uses).

## Actual result

Both **New Global SLA** and **Edit Global SLA** render with:
- H1 heading **"Redmine"** (the generic Redmine layout header) instead of **"Helpdesk"**.
- **No Helpdesk Settings sub-navigation** at all (Holiday/Products/Email Configuration/Canned Responses/Support Packages/Global SLAs — all missing), even though the list page one click away shows it clearly.

The top-level Helpdesk plugin nav (Helpdesk Dashboard/Helpdesk Tickets/Reports/Organization/Customers/Products/Helpdesk Settings/Help) is still present on these forms, so the page isn't fully broken — but it visually and structurally breaks out of the Helpdesk Settings section a user was just in, which reads as a real inconsistency (flagged directly by the user from a screenshot of the New Global SLA form).

**Scoping check — is this specific to Global SLA, or a wider pre-existing pattern?** Checked two other Helpdesk Settings sub-resources for comparison:
- `Edit Support Package` (`/rf_helpdesk_support_packages/7/edit`) and `New Holiday` (`/rf_helpdesk_holidays/new`) **both also drop the Settings sub-navigation** on their own New/Edit forms — so the "sub-nav disappears on a sub-resource's own form" part is a **pre-existing, plugin-wide pattern**, not something HD-6 introduced.
- However, both of those forms correctly show H1 **"Helpdesk"** (the right branded layout) — **only Global SLA's New/Edit forms fall back to the wrong "Redmine" generic layout.** That specific regression is new and unique to HD-6's Global SLAs feature.

So the genuinely new, HD-6-specific defect is the wrong top-level layout/branding on Global SLA's own forms; the missing Settings sub-nav on a sub-resource's own form is a separate, broader, pre-existing UX inconsistency worth a low-priority follow-up of its own but not new to this feature.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-063/global-sla-form-wrong-layout-missing-subnav.png)

### Console / log

- New Global SLA form (`/rf_helpdesk_global_slas/new`): `heading "Redmine" [level=1]`, no Settings sub-nav links present in the accessibility snapshot.
- Edit Global SLA form (`/rf_helpdesk_global_slas/36/edit`): same — `heading "Redmine" [level=1]`, no Settings sub-nav.
- Comparison, `Edit Support Package` (`/rf_helpdesk_support_packages/7/edit`): `heading "Helpdesk" [level=1]` (correct layout), Settings sub-nav also absent.
- Comparison, `New Holiday` (`/rf_helpdesk_holidays/new`): `heading "Helpdesk" [level=1]` (correct layout), Settings sub-nav also absent.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-063/retest-yyyy-mm-dd-pass.png)

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 6611697)

**CONFIRMED FIXED.** Checked source first: `helpdesk_layout_patch.rb`'s `GLOBAL_CONTROLLERS` list now includes `rf_helpdesk_global_slas` (it was missing before). Verified live on the restarted container:

- `/rf_helpdesk_global_slas/new` — H1 reads "Helpdesk", not "Redmine"; the generic Projects/Activity/Issues/Spent time/Gantt/Calendar/News menu is gone.
- `/rf_helpdesk_global_slas/33/edit` — same: H1 "Helpdesk", generic menu gone.
- The Settings icon in the left icon rail is correctly highlighted active on both pages.

(Note: an earlier check of these same URLs, before the user asked to restart the container onto the new branch, still showed the bug — that was a stale-container false negative, not a real regression; recorded here for the session record, not as part of this bug's own history.)

Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121400** (`ztflux`), tracker Bug, Priority Low, assigned to **Vaishnavi Bhawsar** (id 192). Category was missing at first (`report_defect` doesn't set one), and Defect Severity / Defect priority were at the Medium defaults. With user approval, later on 2026-09-28 they were set to **Category Helpdesk Plugin, Defect Severity Low-severity, Defect priority Low**, confirmed via `get_issue`. Attached to the same Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289") already created for BUG-HLP-062 — `report_defect` called a second time against the same testcase/run adds a second `defect` relation without disturbing the first, matching the established multi-defect-per-testcase pattern seen elsewhere in production (e.g. the Flux Gantt sanity testcase carrying 4 defects under one result in Run #577). Confirmed via `get_run_testcases`: testcase #121398 now shows `defects:[121399, 121400]`.

**Closed on production 2026-09-28**: #121400 → Status **Done**, % Done → **100**, per explicit user instruction, with a retest-summary note. Confirmed via `get_issue`.
