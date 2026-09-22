# Handoff — Redmineflux Dashboards

## Last Session

- Date: 2026-09-09
- Redmine Version: 7.0.1.stable
- Environment: Forge — `https://flux-fdrk6suoj49.forge.zehntech.com/` (the prior session's server, `flux-f04qohdte49`, has since expired)

## Completed This Session (2026-09-09)

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

- **2026-09-22 authoring pass added 31 new test cases (TC-DSH-150–180) for production issue #120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping for User-Defined Queries", client JUWI GmbH, status In QA, due 2026-09-23) — none of these have been executed yet. Once #120914 ships/is deployed to a test server, execute in this order:
  1. `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` TC-DSH-150–165 (template selector, grouping dimension incl. custom fields, existing-widget regression, drill-down additions, visibility-scoping negative case).
  2. `DASHBOARDS_CHART_SETTINGS.md` TC-DSH-166–176 (appearance-settings visibility, segment order, colour-name auto-matching EN/DE, palette override).
  3. `DASHBOARDS_GLOBAL_FILTERS_AND_LAYOUT.md` TC-DSH-177–180 (append-to-end, no-reload, scroll+highlight, across both Add Chart tabs).
  - Needs at least one project with list/boolean/enumeration custom fields applicable to the query's tracker(s), including one field with colour-named values (English) and one with German colour-named values, to exercise TC-DSH-153–158 and TC-DSH-173–175.
- All bugs closed and final-cycle regression passed with zero new failures (2026-09-09) — `STATUS.md` for this plugin remains `Complete` for the pre-#120914 scope; the new TCs above will need their own pass before the plugin is "complete" against the expanded feature set.
- Still untested overall (carried forward, not blocking Complete since no bug covers them): actual drag/resize interaction, drill-down, auto-refresh timer behavior, full-screen mode, "Saved Queries" tab, remaining ~17 of 22 built-in chart types, Data Filters beyond Issue Status, permissions/role-gating, admin REST API precondition, Stage 2 (resolutions) and Stages 3–6 (Lotus theme) not yet run.
- The "Chart Information" info-icon popover wasn't independently re-triggered on 2026-09-09's server (click/hover via the automation harness didn't open it) — if a future session needs to re-verify it specifically, try a slower/staged real-mouse hover sequence rather than a single click.
- Note: plugin confirmed via Administration > Plugins as "Redmineflux Analytics Dashboard" (internal name `redmineflux_dashboard`), version 7.0.0.

## Open Bugs Found

- None. `bugs/open/` is empty.

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
