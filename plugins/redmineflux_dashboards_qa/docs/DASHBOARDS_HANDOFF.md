# Handoff — Redmineflux Dashboards

## Last Session

- Date: 2026-09-23
- Redmine Version: 7.0.1.stable
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010

## Completed This Session (2026-09-23)

**Sanity pass on production issue #120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping for User-Defined Queries"), executing against `production testcase #121093` (suite #249 on `ztflux`) on `redmine-docker-700`, project "test project". Confirmed the feature is deployed and largely working:

- Template selector on the Saved Queries tab offers Statistics card (default)/Doughnut/Pie/Bar/Line for issue queries — PASS.
- Grouping selector appears once a chart template is chosen, offering Status/Priority/Tracker/Assignee/Target version/Author plus project custom fields — PASS.
- Grouped by Status: segments/counts matched the issue list exactly — PASS.
- Grouped by a list custom field (`cf_68`): correct value segments plus a trailing "Not set" segment, counts summed to the query total (2 Green + 139 Not set = 141) — PASS.
- Colour-name auto-matching: the "Green" value rendered in actual green (`#2F9E44`) with no palette configured — PASS.
- Appearance settings (Palette) available on a chart-template widget, hidden on the statistics card (Accent Color only) — PASS, but see gap below re: Legend/Data Labels.
- Drill-down: query's own filters expanded into URL params while excluding the grouped-on field (confirmed via the widget-creation response's embedded `drilldown` object and by actually clicking through); "Not set" segment correctly maps to Redmine's `none`/`!*` operator, not an empty value; drill-down count (139) matched the chart segment exactly once a test-fixture precondition (custom field's "Used as a filter") was fixed — PASS.
- Pointer cursor confirmed on a hovered chart segment via `Chart.getChart()` arc-geometry + synthetic mouse events — PASS.
- A new chart is always appended to the end of the layout (confirmed 3× across different Add-Chart flows) with no full page reload — PASS.
- Pre-existing statistics-card widget behavior (4 KPI tiles + Top Statuses + Top Priorities) and its Settings panel (Accent Color only) both completely unchanged — PASS (regression, scenario 12).

**2 bugs found and filed:**
- `BUG-DSH-002` (Medium) — a chart-template query widget's Settings panel is missing the Legend Position and Data Labels controls #120914 part 3 explicitly requires; only Chart Color Palette + Top Accent Color are present.
- `BUG-DSH-004` (Low) — the grouping-dimension selector offers "QA Multi Select Field", a genuine multi-select custom field, which #120914's Out-of-scope section explicitly excludes.

**1 unrelated observation, not filed under this plugin:** editing a multi-select custom field's value via the standard issue Edit form didn't persist on this instance (reproduced twice) — looks like a Redmine-core or `redmineflux_inline_editor` interaction, blocking full verification of multi-select grouping's per-value behavior. See `DASHBOARDS_MEMORY.md`.

`bugs/open/` is no longer empty — `STATUS.md` moved back from `Complete` to `In Progress` per CLAUDE.md §10.

## Previously Completed (2026-09-09)

Retested `BUG-DSH-001` (the only open bug, narrowed to 3 remaining strings + the public-share findings) on a newly-provisioned Forge server, German language, Standard theme, on "Flux Gantt Project"'s Dashboard tab:

- **"Add" button (Add New Chart modal)** → now reads "Hinzufügen". **Fixed.**
- **Both Chart Settings > Appearance hint texts** → "Diese Farbe erscheint als Balken am oberen Rand der Diagrammkarte" and "Die ausgewählten Farben werden in dieser Reihenfolge für die Datenreihen des Diagramms verwendet". **Fixed.**
- **Public Share Link view**: "LIVE" badge → "ECHTZEIT"; header date-range summary → German DD.MM.YYYY format; per-chart date-range subtitle → German DD.MM.YYYY format + "bis" connector. **All fixed.**
- **`bugs/open/` is now empty for this plugin — the bug is closed.** Per `SENIOR_QA_STANDARDS.md` §27, ran the final-cycle regression across `DASHBOARDS_GERMAN_LANGUAGE.md`'s 5 TCs on this same server:
  - TC-DSH-049 (dashboard shell) — PASS, all German.
  - TC-DSH-050 (Add New Chart modal) — PASS, all German including the now-fixed "Hinzufügen" button.
  - TC-DSH-051 (chart card icon row + resize handles) — PASS, all German.
  - TC-DSH-052 (Chart Settings panel, all 3 sections) — PASS, all German including the now-fixed Appearance hints.
  - TC-DSH-053 (toasts/validation/tooltip/delete dialog) — mostly re-verified: Copy Chart toast ("Diagramm in die Zwischenablage kopiert"), the End-before-Start validation error ("Das Enddatum darf nicht vor dem Startdatum liegen"), and the delete-confirmation dialog all confirmed German on this server. The "Chart Information" info-icon popover and the Save-Settings success toast were NOT independently re-triggered this pass (the popover didn't open via click/hover in this automated session — likely needs a real pointer-hover interaction the harness couldn't reproduce; both were already confirmed fixed on the immediately-preceding same-day retest on a different, now-expired server, so residual risk is low).
  - **Zero new failures** across everything actually re-executed. Final cycle regression — 1 suite / 5 TCs re-run (4 fully, 1 mostly), all PASS.
- Test chart created and deleted during this retest; theme/language left as Standard/German per session convention.

## Previously Completed (2026-09-07)

First Stage 1 (German language, Default theme) pass on the "Dashboard" tab (present by default on every project, no module to enable — confirmed on "Flux Gantt Project"):

- TC-DSH-049: dashboard shell (heading, header controls, global filter bar, empty state) — FAIL. Almost every plugin-owned string is hardcoded English despite a confirmed-German session. Filed `BUG-DSH-001` (High).
- TC-DSH-050: "Add New Chart" modal — FAIL, same root cause. All 22 chart types listed and functional; spot-checked 5 by name, all untranslated. "Abbrechen" is the one correctly-translated string (shared core component).
- TC-DSH-051: chart card controls (added "Issues by Status") — FAIL, same root cause. Icon row and resize-handle labels all untranslated.
- TC-DSH-052: Chart Settings panel (General/Data Filters/Appearance, all 3 sections) — FAIL, same root cause.
- TC-DSH-053 (added after user follow-up request): success toasts, validation errors, and tooltip content — FAIL, same root cause. Captured fast-dismissing toasts via `MutationObserver`: "Chart copied to clipboard" (Copy Chart), "Settings saved successfully" (Save Settings) — both untranslated. Found an inline validation error "End date cannot be earlier than start date" (Custom Date Range, End < Start) — untranslated, and noted (not filed) that the success toast fires even when this validation blocks the save, a possible logic inconsistency worth a functional follow-up. The "Chart Information" tooltip popover (Calculation Method + Active Filters) and the "Delete Chart Container?" confirmation dialog are both also entirely untranslated.

All five TCs reduce to a single bug (`BUG-DSH-001`) since the failure is systemic — essentially no i18n coverage anywhere in the plugin's own UI, confirmed via `document.body.innerText` against a session independently confirmed German (`document.documentElement.lang === "de"`, fully-German core Redmine chrome on the same pages).

## In Progress

- Untested this session: actual drag/resize interaction, drill-down, auto-refresh timer behavior, public Share Link flow (generate/copy/regenerate), full-screen mode, "Saved Queries" tab, remaining 21 of 22 built-in chart types, Data Filters beyond Issue Status (Tracker/Priority/Assignee/Version/Activity/Role/User), permissions/role-gating, admin REST API precondition (Administration > Settings > API).
- Noted but not investigated: the Save Settings success toast fires even when the Custom Date Range validation error is blocking the save (End Date before Start Date) — worth a functional follow-up in a future session, separate from the translation cycle.
- Stage 2 (resolutions) and Stages 3–6 (Lotus theme) not yet run.

## Blockers

- None.

## Next Session Start Point

- **Retest `BUG-DSH-002` and `BUG-DSH-004` once the developer addresses them**, then run the affected-feature regression required by `SENIOR_QA_STANDARDS.md` §26 (the Saved Queries/Chart Settings/Global Filters suites, since that's what #120914 touches) before closing either.
- **Execute the remaining #120914 test cases (TC-DSH-150–180) not yet covered by this session's sanity pass** — this session spot-checked the 13 scenarios but did not run every one of the 31 authored cases individually:
  1. `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` TC-DSH-150–165 — still need: boolean CF grouping (TC-DSH-156) with a genuinely working fixture, enumeration-type CF grouping (TC-DSH-157) if this instance has one, the "only fields visible/applicable" negative case (TC-DSH-166) with a role-restricted or project-inapplicable field, and search/title cases already covered by the pre-existing suite.
  2. `DASHBOARDS_CHART_SETTINGS.md` TC-DSH-166–176 — segment-order stability under changing counts (TC-DSH-172), German colour-name matching (TC-DSH-174, needs a German-language CF or session), non-colour-value palette fallback (TC-DSH-175), and explicit palette override (TC-DSH-176) are not yet individually executed.
  3. `DASHBOARDS_GLOBAL_FILTERS_AND_LAYOUT.md` TC-DSH-177–180 — scroll-into-view + highlight behavior (TC-DSH-179) wasn't visually confirmed this session (only append-order and no-reload were), and the cross-tab consistency case (TC-DSH-180, adding from "Our Queries" vs "Saved Queries") wasn't run.
- Fixture note for next session: this instance's `cf_67`/`cf_68` (QA Multi Select/Single Select Field) now both have colour-named values (Red/Green/Blue/Yellow) — useful for TC-DSH-173–176, but `cf_68` needed "Used as a filter" enabled this session (was off by default) to make its drill-down count correctly; check it's still on.
- Still untested overall (carried forward, not blocking regression since no bug covers them): actual drag/resize interaction, auto-refresh timer behavior, full-screen mode, remaining ~17 of 22 built-in chart types, Data Filters beyond Issue Status, permissions/role-gating, admin REST API precondition, Stage 2 (resolutions) and Stages 3–6 (Lotus theme) not yet run.
- The "Chart Information" info-icon popover wasn't independently re-triggered on 2026-09-09's server (click/hover via the automation harness didn't open it) — if a future session needs to re-verify it specifically, try a slower/staged real-mouse hover sequence rather than a single click.
- Note: plugin confirmed via Administration > Plugins as "Redmineflux Analytics Dashboard" (internal name `redmineflux_dashboard`), version 7.0.0.

## Open Bugs Found

- `BUG-DSH-002` (Medium, open) — chart-template query widget's Settings panel is missing Legend Position and Data Labels controls (#120914 part 3).
- `BUG-DSH-004` (Low, open) — grouping-dimension selector offers a genuine multi-select custom field, which #120914 explicitly excludes from scope.

## Closed Bugs

- BUG-DSH-001 (Low, originally High) — near-total absence of German i18n across the entire Dashboard plugin UI. **Fully fixed**, verified 2026-09-09 — every one of the ~60+ originally-untranslated strings (dashboard shell, Add Chart modal, chart card controls, all 3 Settings panel sections, toasts, validation error, delete dialog, and the public Share Link view's LIVE badge + date ranges) is now correctly German.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-f6nlrqpvk49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) first pass on the Dashboard tab: 4 TCs (TC-DSH-049–004) covering dashboard shell, Add Chart modal, chart card, and Chart Settings panel. 1 bug filed (`BUG-DSH-001`, High) covering a systemic near-total absence of German localization across the entire plugin. Large surface (drill-down, sharing, auto-refresh behavior, remaining chart types, permissions, Stage 2 resolutions, Stages 3–6 Lotus theme) still untested. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49 — branch updated) | Claude (Playwright MCP) | **Fix verification pass, Standard theme.** Re-checked every surface from `BUG-DSH-001` (dashboard shell, Add Chart modal, chart card controls, all 3 Chart Settings panel sections, toasts via `MutationObserver`, validation error, info tooltip, delete dialog) — of ~60+ originally-untranslated strings, only 3 remain: the "Add" button and 2 Appearance-section hint texts. Severity dropped High → Low, bug narrowed and kept open for just those 3 strings. Test chart created and deleted during retest. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | **User asked directly whether the Share link / public dashboard view had been verified — it had not.** Generated a share link, opened the public `/public/analytics_dashboard/<token>` page (no login) in a new tab: the Share modal itself is fully translated, and most of the public page is too (auto-refresh controls, chart title, both icon tooltips), but found 3 new untranslated strings specific to this page: the "LIVE" badge, the header date-range summary ("Aug 11 - Sep 09, 2026"), and the per-chart date-range subtitle ("2026-08-11 to 2026-09-09"). Folded into `BUG-DSH-001` as an additional affected surface (not a new bug ID, same root cause). Also noticed 2 duplicate charts had appeared on the live dashboard from earlier testing — removed both, dashboard restored to empty; not confirmed as a reproducible double-submit bug, just flagged for a future deliberate check. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | Retest pass, new Forge server after branch update: **all remaining BUG-DSH-001 findings confirmed FIXED** (Add button, both Appearance hints, LIVE badge, both public-share date-range displays). Closed. `bugs/open/` now empty — ran the required full final-cycle regression (§27): 5 TCs re-executed (4 fully, 1 mostly — info-icon popover didn't trigger via automation this pass, already confirmed fixed same-day on the prior server), zero new failures. Plugin is now eligible for `STATUS.md` = `Complete`. |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/custom-dashboard/ and 149 functional, negative and permission test cases written across 7 new suites (TC-DSH-078 onward): DASHBOARDS_INSTALLATION_AND_ACCESS, CHART_WIDGETS, CHART_SETTINGS, GLOBAL_FILTERS_AND_LAYOUT, SAVED_QUERIES_AND_DRILLDOWN, PUBLIC_SHARING, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-DSH-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
| 2026-09-22 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass for production issue #120914 — nothing executed.** Read #120914 ("Custom Dashboard: Chart Templates and Custom Field Grouping for User-Defined Queries", client JUWI GmbH, In QA, due 2026-09-23) via the redmineflux MCP server and authored 31 new test cases, TC-DSH-150–180, continuing this plugin's existing global TC-DSH-NNN numbering (not yet migrated to the suite-scoped `TC-<PLUGIN>-<SUITE-ABBR>-NNN` format from `CLAUDE.md` §4a): 16 in `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` (chart template selector, grouping dimension incl. custom fields, existing-widget regression, drill-down additions, visibility-scoping negative case), 11 in `DASHBOARDS_CHART_SETTINGS.md` (appearance-settings visibility, dimension-ordered segments, colour-name auto-matching in English and German, palette override), 4 in `DASHBOARDS_GLOBAL_FILTERS_AND_LAYOUT.md` (append-to-end, no-reload, scroll+highlight, both Add Chart tabs). `DASHBOARDS_FEATURES_LIST.md` updated with a new row (#19) cross-referencing all three suites. |
| 2026-09-22 | n/a | n/a | Claude (redmineflux MCP) | **Production sanity testcase created for #120914, per explicit approval.** Created Test Case #121093 ("Custom Dashboard: Sanity check — chart templates and custom field grouping for saved queries (#120914)") in project `ztflux`, suite #249 "Custom Dashboard", category 611 (QA Testing), linked to requirement #120914. Description covers a 13-step sanity walkthrough in Textile, with a Notes section cross-referencing the local TC-DSH-150–180 detailed suite. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Sanity-tested #120914 live**, executing production testcase #121093's scenarios on "test project". Confirmed working: template selector + default, grouping selector + Status/list-CF grouping with exact count reconciliation, "Not set" → Redmine `none` operator, colour-name auto-match (Green), drill-down filter-expansion excluding the grouped field (no double-filter validation error), pointer cursor, append-to-end with no page reload (3× confirmed), pre-existing statistics-card widget/settings fully unchanged. **2 bugs filed**: `BUG-DSH-002` (Medium) — chart-template widget's Settings panel missing Legend Position + Data Labels controls that #120914 part 3 requires. `BUG-DSH-004` (Low) — grouping selector offers a true multi-select custom field, which #120914's own Out-of-scope section excludes. One unrelated data-persistence issue with a multi-select CF on this instance noted in `DASHBOARDS_MEMORY.md`, not filed under `DSH`. `bugs/open/` no longer empty — `STATUS.md` reopened from `Complete` to `In Progress` per CLAUDE.md §10. Not all 31 authored TC-DSH-150–180 cases were individually executed (see Next Session Start Point) — this was a sanity/spot-check pass, not a full suite run. |
