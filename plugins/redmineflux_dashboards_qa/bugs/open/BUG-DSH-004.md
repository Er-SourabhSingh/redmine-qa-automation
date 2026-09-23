# Bug Report Template

- Bug ID: BUG-DSH-004
- Production Redmine Issue ID: <!-- fill after MCP report_defect/create_issue is approved and executed -->
- Title: Grouping-dimension selector offers a true multi-select custom field, which #120914 explicitly excludes from scope
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

## Steps to reproduce

1. Confirm a project has a **List**-format custom field with **Multiple values** enabled (a genuine multi-select field) applicable to the tracker(s) a saved query covers. On this instance: "QA Multi Select Field" (`cf_67`), verified via Administration → Custom fields → edit → **Multiple values** checkbox is **checked**, with possible values Red/Green/Blue/Yellow.
2. Open a project's Dashboard tab → **Add Chart** → **Saved Queries** tab → select a saved **issue** query.
3. Set **Display as:** to **Doughnut chart** (or Pie/Bar/Line).
4. Open the **Group by:** dropdown.

## Expected result

- Per production issue **#120914**, "Out of scope" section: "Custom fields of type user, version or **multi-select** as grouping dimensions" is explicitly listed as **not** part of this feature's scope.
- Per part 2 of the same issue: only custom fields "of type list, boolean and enumeration" should be supported as grouping dimensions — a *list* field is explicitly distinguished from a *multi-select* field in the ticket's own wording (list/boolean/enumeration are in scope; multi-select is called out separately as out of scope).
- The **Group by:** dropdown should therefore **not** list a custom field that has Multiple values enabled.

## Actual result

- The **Group by:** dropdown lists **"QA Multi Select Field"** — a genuine multi-select List custom field — alongside the standard fields and the two genuinely single-value custom fields (QA Boolean Field, QA Single Select Field).
- It is fully selectable through the normal UI (not just reachable via a scripted workaround) and can be used to create a chart widget grouped by this field without any warning or block.
- Selecting it and adding the chart succeeds (`POST .../widgets` → `200 OK`), producing a chart — the selector does not distinguish a single-select list field from a multi-select one anywhere in the flow.
- Independently, an attempt to verify the actual per-value bucketing behavior (e.g. whether an issue carrying two selected values like "Red, Green" appears in both segments, in neither, or crashes the grouping) was inconclusive on this instance: setting `cf_67` to two values on a test issue via the standard issue Edit form did not persist (reproduced twice — the field reverts to empty on reload). That save failure looks unrelated to the Dashboard plugin (possibly a Redmine-core/multi-select custom field interaction, or an interaction with the `redmineflux_inline_editor` plugin also active on this shared instance, which already has open display-related bugs of its own). It is **not** filed under this plugin's code (`DSH`) and is called out here only so the exposure finding above isn't confused with a data-corruption claim — the confirmed defect is strictly that the field is offered as a grouping option at all, which by itself contradicts #120914's documented scope.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-DSH-004/multiselect-cf-offered-as-grouping-dimension.png)

The "Add New Chart" dialog, Saved Queries tab, an issue query, **Display as: Doughnut chart**, with **Group by: QA Multi Select Field** selected — a real, normally-reachable selection in the dropdown.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-DSH-004/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS console errors; the widget creation call returns `200 OK` regardless of the field's multi-select status.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md` (only prior bug is `BUG-DSH-001`, closed, unrelated).
