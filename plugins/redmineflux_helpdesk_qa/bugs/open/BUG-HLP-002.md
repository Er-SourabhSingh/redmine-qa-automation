# Bug Report Template

- Bug ID: BUG-HLP-002
- Title: Support Level "Escalation To" dropdown is unscoped (lists every project's levels) ONLY when the form is reached via the unlinked global route — CAUSED BY BUG-HLP-005, not an independent defect
- Redmine version: (see QA_CREDENTIALS_FORGE.md — originally Forge flux-fnwchpuwl49; re-verified and corrected 2026-08-24 on Forge flux-fudbk2hlu49)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Forge (https://flux-fudbk2hlu49.forge.zehntech.com/, re-verification)
- Browser: Chromium (Playwright MCP)
- User role: Administrator (admin)
- Date: 2026-08-24 (corrected/re-scoped; originally filed 2026-08-24 on a prior Forge rotation)

## Steps to reproduce

**Correction (2026-08-24):** the original filing tested this exclusively via the bare/global route without realizing that route is itself a separate defect (BUG-HLP-005). Re-verified on `flux-fudbk2hlu49` with a controlled comparison:

1. Log in as admin. Ensure Support Levels exist on more than one project — this environment has "L1" (order 1) on "Helpdesk Service Desk"/project_id=9 and "AB-L1" (order 1) on "Agile Board Project"/project_id=7.
2. **Path A (proper navigation):** go to a project's Helpdesk → Settings → Support Level tab (`/projects/helpdesk/helpdesk/settings?tab=support_levels`) and click "New Support Level". This lands on `/rf_support_levels/new?project_id=9`. Inspect the DOM: `support_level[project_id]` is a **locked hidden `<input>`** (value `9`), not a dropdown. Inspect `select[name="support_level[escalation_to_id]"]`.
3. **Path B (the bypass route — see BUG-HLP-005):** go directly to the bare, unlinked `/rf_support_levels/new` (or reach it via the global `/rf_support_levels` list's own "New Support Level" button). Here `support_level[project_id]` is a **free-choice visible `<select>`**. Select "Helpdesk Service Desk" from it. Inspect `select[name="support_level[escalation_to_id]"]` again.

## Expected result

- The "Escalation To" dropdown should only offer support levels belonging to the same project, regardless of which route was used to reach the form.

## Actual result

- **Path A (proper navigation, `?project_id=9` pre-set, Project field locked):** `select[name="support_level[escalation_to_id]"]` correctly contains only `None (Last Level)` and `L1 (Order: 1)` — "AB-L1" (Agile Board Project) is correctly excluded. **No bug here.**
- **Path B (bypass route, Project chosen via the visible dropdown after page load):** `select[name="support_level[escalation_to_id]"]` contains `None (Last Level)`, `AB-L1 (Order: 1)`, **and** `L1 (Order: 1)` — unfiltered, even after "Helpdesk Service Desk" is explicitly selected. Same result when selecting a project with zero support levels of its own (e.g. "Education and training3").
- **Root cause, now understood:** the Escalation To options are filtered correctly only at initial server-side render, based on the `project_id` baked into the URL by the proper navigation link. The bare-route form's live "Project" `<select>` has no client-side handler that re-filters/re-fetches Escalation To options when the user changes project — so on that form the field is simply never scoped, regardless of which project ends up selected.
- **This means BUG-HLP-002 is not an independent defect.** It only manifests through the same unlinked, unscoped route that BUG-HLP-005 already reports. If BUG-HLP-005 is fixed by removing/blocking that bypass route (or by making it always carry/lock a valid `project_id` the way the proper link does), this bug's symptom disappears as a side effect — there would be no remaining way to reach a Support Level form where Project is a live, unscoped dropdown.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-002/bug-hlp-002-escalation-cross-project.png)

### Console / log

- No console errors observed; this is a data-scoping bug in the options rendered for the field, not a JS exception.

## Duplicate check

- Duplicate found: Effectively yes, but kept as a separate tracked item since it documents a distinct visible symptom.
- Existing bug reference (if duplicate): **BUG-HLP-005** (root cause — see `bugs/open/BUG-HLP-005.md`). Recommend closing this bug when BUG-HLP-005 is fixed and confirmed not to reproduce, rather than fixing it independently.

## Related

- **BUG-HLP-005** is the root cause of this bug's symptom, confirmed 2026-08-24 by a controlled comparison (see Steps/Actual result above). Fixing BUG-HLP-005 should resolve this bug as a side effect — re-test this TC as part of BUG-HLP-005's retest, not separately.
