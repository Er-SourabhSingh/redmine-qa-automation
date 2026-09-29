# BUG-HLP-062

- Bug ID: BUG-HLP-062
- Production Redmine Issue ID: 121399
- Title: Org "Add / top up hours" modal's Project dropdown is missing a second linked project — only shows one of the organization's two RfProjectCustomer-linked projects (found while verifying HD-4's fix per production issue #121289)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, includes HD-4/HD-5/HD-6/HD-7 per production issue #121289, branch `helpdesk_budget` merged, commit `74c4ed0`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Navigate Organization → **Alpha Minimal Fields Test Org** (org id 8) → **Prepaid Support Hours** tab.
3. Confirm the "Budget by project" table lists **two** projects linked to this organization: **Helpdesk QA Alpha** and **Helpdesk QA Beta** (both have their own Approved/Used/Remaining rows, both have a "Ledger" link, confirming both have an `RfProjectCustomer` row for org 8). Confirm **Helpdesk QA Beta** has the Redmineflux Helpdesk module enabled (`/projects/helpdesk-qa-beta/settings/modules` → "Redmineflux Helpdesk" checked).
4. Click **Add / top up hours**.
5. Inspect the **Project** dropdown (`select#organization_prepaid_project_id`-equivalent — verified via `document.querySelector('select[name*="project"]').options`).

## Expected result

Per **HD-4 spec** ("Org top-up modal offers every project on the instance, not just this organization's" fix, from production issue #121289), the dropdown must be a flat list of every project that is (a) helpdesk-enabled, (b) has an `RfProjectCustomer` row for this organization, and (c) the current user is allowed to manage prepaid support hours on. For org 8 with admin logged in, that is **both** Helpdesk QA Alpha and Helpdesk QA Beta — both satisfy all three conditions.

## Actual result

The Project dropdown contains **only one option: "Helpdesk QA Alpha"** (`value="1"`). **Helpdesk QA Beta is completely missing**, even though it is visibly linked to this same organization one section above (in the "Budget by project" table) and has the Helpdesk module enabled. Reproduced twice in a row (once immediately after opening the modal, once again after a full page reload + re-open) — not a one-off render glitch.

This is the opposite failure mode from the bug HD-4 was written to fix (HD-4 fixed "too many projects offered"; this is "a project that should be offered is silently missing"), but it lands in the exact same code path (`RfOrganizationsController#load_prepaid_manageable_projects` per the HD-4 spec) and blocks a real workflow: an admin cannot top up or reduce Helpdesk QA Beta's prepaid budget for this organization through this modal at all.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-062/topup-modal-project-dropdown-missing-beta.png)

### Console / log

DOM evaluation of the live `<select>` element inside the open modal, run twice (once per repro attempt, including after a full page reload):

```js
document.querySelector('select[id*="project"], select[name*="project"]')
// => <select ...> with a single <option value="1">Helpdesk QA Alpha</option>
```

Both project rows are confirmed present and helpdesk-enabled independently of this modal:
- "Budget by project" table on the same page shows both **Helpdesk QA Alpha** (21.67h / 14.92h / 6.75h, Hard mode, Ledger link to `?ledger_project_id=1`) and **Helpdesk QA Beta** (2.00h / 0.00h / 2.00h, Hard mode, Ledger link to `?ledger_project_id=2`).
- `/projects/helpdesk-qa-beta/settings/modules` shows "Redmineflux Helpdesk" checked.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-062/retest-yyyy-mm-dd-pass.png)

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 6611697)

**CONFIRMED FIXED.** Verified live on the restarted container (`docker restart` + `rake redmine:plugins:migrate` + second restart, per the standing environment procedure) after the branch switch:

- `document.querySelector('select[name*="project"]').options` on the "Add / top up hours" dialog for org 8 now returns exactly `["Helpdesk QA Alpha", "Helpdesk QA Beta"]` — both projects with real budget history for this organization, matching the dev's own union-of-linked-and-budgeted-projects fix.
- Confirmed the other half of the fix too: neither "Helpdesk QA Gamma" nor "Redmineflux Helpdesk" (no link, no budget on this organization) appears — the dropdown did not open up generally.

Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121399** (`ztflux`), tracker Bug, Priority Medium, assigned to **Vaishnavi Bhawsar** (id 192). Category was missing at first (`report_defect` doesn't set one); set to **Helpdesk Plugin** later on 2026-09-28 with user approval, and confirmed via `get_issue`. Before reporting, created a dedicated production Test Case **#121398** ("Sanity: Helpdesk Prepaid Support Hours — org top-up dialog project scoping (Feature #121289)") in suite `#19 Helpdesk`, inside a new Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") — following the same pattern used for other plugins' sanity-testing passes against a specific feature ticket (e.g. Run #577), rather than reusing the unrelated generic Test Case #119389 ("Redmine v6 compatibility") that earlier bugs this session had been linked to. `report_defect` created the defect issue, linked it to the testcase as a real `defect` relation, and recorded the testcase result as **Failed** in one call.

**Closed on production 2026-09-28**: #121399 → Status **Done**, % Done → **100**, per explicit user instruction, with a retest-summary note. Confirmed via `get_issue`.
