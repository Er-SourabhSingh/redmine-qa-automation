# Handoff — Redmineflux Dashboards

## Last Session

- Date: 2026-09-24 (full final-cycle regression pass)
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

**Same-day retest (later): user reported the plugin migration had not been run on the earlier pass — ran `rake redmine:plugins:migrate` and restarted `redmine-docker-700`, then asked for a full retest.** Re-verified both bugs against the exact original repro steps plus re-ran the core sanity scenarios with fresh evidence:

- `BUG-DSH-002` — **still reproduces.** Chart Settings panel for the same Doughnut widget still shows only Data Filters + Appearance (Accent Color, Palette); no Legend Position, no Data Labels. The migration did not touch this gap — it is a genuine missing-feature bug, not a pending-migration artifact. Kept open, retest evidence added to the bug file.
- `BUG-DSH-004` — **still reproduces.** "QA Multi Select Field" still appears in the Group by dropdown for an issue query + chart template. Kept open, retest evidence added to the bug file.
- Re-confirmed still passing with live (changed) data: grouped-by-list-CF segment counts (now 1 Green + 140 Not set = 141, data drifted slightly from other activity on the shared instance but still internally consistent), drill-down count matching the "Not set" segment exactly (140/140), and append-to-end + no-reload from **both** the Our Queries and Saved Queries tabs (the Our-Queries-tab case wasn't explicitly tested in the first pass).
- No regressions introduced by the migration — everything that passed before still passes; the 2 known gaps are unchanged either way.

**Same day, third pass: user shared two screenshots comparing the built-in "Our Queries" chart Settings panel against the saved-query one, and reported the chart disappearing after applying settings.** Investigated both leads directly:

- **`BUG-DSH-002` corrected — its real scope is narrower than originally filed.** Added a fresh Bar chart widget grouped by the standard field **Status** (instead of a custom field) and compared its Settings panel side by side: it correctly shows the full General section (Legend Position, Show Data Labels) that the custom-field-grouped widget lacks. So the gap is specific to **custom-field grouping**, not chart-template widgets in general — rewrote the bug's Title/Steps/Expected/Actual accordingly with the comparison screenshot as evidence. This was caught *before* the bug was ever reported to production, so no production correction was needed.
- **New bug filed, `BUG-DSH-005` (High)** — confirmed the user's "chart disappears" report exactly: clicking **Save Settings** on a chart-template widget, even with zero changes made, immediately replaces the chart body with "No Data Available" in place. Reproduced on both the custom-field-grouped Doughnut widget and the standard-field-grouped Bar widget, ruling out a style- or grouping-specific cause. Root-caused via network inspection: the server's own `PATCH .../widgets/:id/settings` response carries fully correct `chart_data` — this is a pure **client-side re-render failure**, not data loss (a plain page reload always recovers it). Two further symptoms found in the same investigation: the Top Accent Color is silently reset to its default even on a no-op save, and the "Issue Status Filter" dropdown in Data Filters is completely non-functional — its selection is never included in the save request at all (confirmed via request-body inspection), so it's a dead control despite looking interactive, on top of visually contradicting the panel's own "controlled by the saved query itself" banner.
- **Lesson for this session and future ones:** the original sanity pass earlier the same day only ever clicked **Cancel** after opening a chart-template widget's Settings panel — never **Save Settings**. That's why `BUG-DSH-005` wasn't caught until the user specifically asked about it. Saved to `DASHBOARDS_MEMORY.md` as a standing caution.

**Same day, fourth pass: user gave a precise design spec for what the Settings panel should contain** — Display as (template) → Group by (updating to match) → Chart Color Palette (when non-statistics-card), and explicitly **no** other filter section, since the saved query alone should govern which issues are shown. Verified live on a freshly-added widget (dashboard cleared and rebuilt by the user first): confirmed via a full accessibility-tree regex search that the Settings panel has **no "Display as" or "Group by" control anywhere** — both are permanently fixed at Add-Chart time.

- **New bug filed, `BUG-DSH-006` (Medium)**: the Settings panel should let a user change the chart template and grouping after creation, not just at creation. Flagged explicitly that this goes beyond #120914's literal text (which only ever describes these pickers living in the Add Chart dialog) — noted for the developer/PM to decide whether it's in this ticket's scope or a fast-follow, rather than silently assuming either way.
- **`BUG-DSH-005` reframed**: per the user, the fix for the Issue Status Filter isn't to make it work — it's to remove the Data Filters section from a saved-query widget's Settings panel entirely, since it has no reason to exist once the query itself already governs filtering. Updated the bug's Actual Result with this correction rather than leaving it as "broken control, needs fixing."

**Same day, fifth pass: user asked for a systematic Display-as × Group-by pass focused on display + drill-down, and flagged a legend/bar-label mismatch directly with a screenshot** (a Bar chart's X-axis category read "Not set" while its legend read the query's own name). Investigated systematically:

- **Reproduced the exact mismatch and confirmed its scope via `Chart.getChart(canvas).legend.legendItems`** (the actual rendered legend, not just the underlying data): added all four templates (Doughnut/Pie/Bar/Line) for the same query side by side — Doughnut and Pie correctly show the category label in the legend; **Bar and Line always show the query's own name instead**, confirmed with single-category, 5-category (Priority, standard field), and custom-Boolean-field groupings alike. Gets more misleading with more categories: a 5-bar Priority chart still shows exactly one legend entry, giving no way to decode which colour is which priority.
- **Drill-down independently reconfirmed correct in every combination tested** — single-category Bar, 5-category Priority-grouped Bar (clicked "High", count matched 3/3), custom-Boolean-field-grouped Bar (clicked "Not set", correctly used the `!*`/none operator) — so this is a purely cosmetic defect, not a data or interaction one.
- **New bug filed, `BUG-DSH-007` (Medium)**.
- Also reconfirmed via this pass: the "Used as a filter" precondition (documented in `DASHBOARDS_MEMORY.md`) applies per custom field individually — `cf_71` ("QA Boolean Field") doesn't have it enabled, so its drill-down count came back as the full unfiltered query (141) rather than the "Not set" segment's own count (139); this is the same known Redmine-core precondition already documented for `cf_68`, not a new bug.

**Eighth pass, 2026-09-24 — user asked to retest all 6 previously-filed/production-reported bugs.** Retested each against its exact original repro steps on `redmine-docker-700`:

- **`BUG-DSH-002` — Fixed.** Custom-field-grouped widget's Settings panel now shows a full General section (Legend Position, Show Data Labels, Display as, Group by), confirmed via accessibility tree.
- **`BUG-DSH-004` — Fixed.** "QA Multi Select Field" no longer offered in Group by; confirmed it's excluded specifically for being multi-select (not incidentally) by deliberately enabling "Used as a filter" on it and rechecking — still excluded.
- **`BUG-DSH-005` — Fixed.** Save Settings no longer breaks live rendering to "No Data Available"; accent colour persists across save; Data Filters/Issue Status Filter section removed entirely from the panel.
- **`BUG-DSH-006` — Fixed.** Display as and Group by are now editable in Settings; changing Group by to Priority + Save Settings live-updated the chart in place with matching data, no reload.
- **`BUG-DSH-007` — Fixed.** `chart.legend.legendItems` on a Bar widget now correctly returns category labels (`["Green", "Not set"]`) instead of the query name.
- **`BUG-DSH-008` — Fixed.** Root cause confirmed shared with `BUG-DSH-004`'s fix (Group by now requires non-multi-select AND "Used as a filter"); after enabling "Used as a filter" on `cf_71`, its "Not set" segment (139) drill-down returned exactly `(1-25/139)`, not the previous whole-query leak.

**Technique note carried forward**: raw DOM `select.value` + dispatched `change` event became unreliable on this build's `<select>` form controls (Add Chart / Settings) — switched to real Playwright `browser_select_option`/`browser_click`, which worked reliably. Canvas-click drill-down via synthetic `dispatchEvent` was unaffected.

All 6 bug files updated with a "Retest — 2026-09-24 (FIXED, confirmed)" section. **User then explicitly approved closing all 6**: synced each linked production issue (#121131–#121136) to status Done / 100% done via `redmineflux_core_update_issue` (verified via `get_issue` re-reads on 2 of the 6), then moved all 6 files from `bugs/open/` to `bugs/closed/` via `git mv`. `bugs/_index.md`, `final-bug-report.md` updated to Closed.

**User then asked directly whether the fixes had actually been verified with regression, or only point-retested — a fair challenge.** Honest answer given: the per-bug retests only proved each specific defect was gone, not that the fixes hadn't broken anything nearby, and CLAUDE.md §12 / `SENIOR_QA_STANDARDS.md` §26 require a regression pass scoped by severity *before* a fixed bug is closed — which had been skipped. User asked to run it.

**Ninth pass, same day — post-fix regression per §26.** Scope: the two High-severity bugs (`BUG-DSH-005`, `BUG-DSH-008`) require full affected suite + adjacent features; the three Medium (`BUG-DSH-002/006/007`) require the full affected suite; the one Low (`BUG-DSH-004`) requires just its TC. In practice: full re-execution of every #120914-specific TC (`TC-DSH-150–188`, the code path all 6 fixes actually touched — several of which had never been individually executed before, only spot-checked), plus adjacent spot-checks on pre-existing features sharing the same Settings-panel component and widget lifecycle (statistics-card widgets, time-entry query gating, the separate "Our Queries" per-chart Data Filters feature). Not a literal re-run of every TC in all three suites (auto-refresh timers, drag/resize layout, and the full per-filter-type sweep in `TC-DSH-009–026` were left for the final-cycle regression, since they're structurally untouched by these 6 fixes and carry very low risk) — this was disclosed to the user rather than silently narrowed.

Executed live against fresh widgets on `redmine-docker-700` (not reusing the bugs' own retest widgets, to catch anything state-dependent):
- Added a brand-new Doughnut widget (`REGR-1`, "Updated issues" grouped by Status): server-computed data (New=97/In Progress=36/Resolved=5/Feedback=5) confirmed correct; appended at `position: 14`, the highest on the board (TC-DSH-177 PASS); no full-page reload in the network log, only `PATCH .../position` calls (TC-DSH-178 PASS); Settings panel showed General (Chart Title/Display as/Group by/Legend Position/Show Data Labels) + Appearance only, confirmed by querying the *actually-visible* modal DOM node specifically (not a blind document-wide query, which — caught mid-session — was picking up hidden sibling panels and giving false "Data Filters present" readings); Save Settings with no changes left the chart rendering correctly, no "No Data Available" (TC-DSH-181 PASS); drill-down on "New" opened `(1-25/97)`, an exact match (TC-DSH-160–165 PASS).
- Re-verified the existing boolean-CF widget's drill-down independently of the bug's own retest: "Not set" (140, drifted from 139 with live data) → `(1-25/140)`, exact (TC-DSH-156 PASS).
- Bulk-read `Chart.getChart(canvas).legend.legendItems` across all ~15 rendered widgets (Doughnut/Pie/Bar/Line, mixed standard- and custom-field grouping) in one call: every single one showed category labels, not dataset/query names, and "Not set" consistently trailed real values (TC-DSH-187/188/171 PASS, broad confirmation not limited to one widget).
- Confirmed `savedQueryDisplay` stays hidden (`offsetParent === null`) for a time-entry query (TC-DSH-151 PASS).
- Added a genuine statistics-card widget (`REGR-3`, Display as explicitly set to "Statistics card") and opened its Settings: computed-style check per control confirmed only `settingsQueryDisplay` and `topBorderColor` are actually visible — `settingsQueryGroupBy`, `legendPosition`, `showDataLabels`, `settingsIssueStatusFilter`, and the palette control all measured `0×0`/`offsetParent: null` despite being present in the DOM, matching the panel's own banner text ("You can only customize the title and border color"). No regression in the pre-existing statistics-card behavior (TC-DSH-159/167 PASS).
- Confirmed the "Our Queries" built-in widgets' own Data Filters feature (Assignee/Version/Priority/Tracker/Activity/Role/User — a separate, pre-existing, legitimate control unrelated to the removed "Issue Status Filter") is untouched and structurally distinct from the saved-query Settings panel — resolved a false-alarm mid-session where an unscoped DOM query conflated the two.

**Zero new failures.** All 6 fixes hold under fresh widgets and broader checks, not just their own original repro. `bugs/open/` remains empty. Per CLAUDE.md §5/§27, the full final-cycle regression across the plugin's *entire* suite (not just #120914) is still required before `STATUS.md` can move to `Complete` — not yet run this session (see Next Session Start Point).

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

- **`bugs/open/` is empty.** `BUG-DSH-023` (role-restricted custom field excluded from the Group by selector) and
  `BUG-DSH-024` (grid column-width overflow cutting off the rightmost card) were both found later the same
  day (2026-09-25) after `STATUS.md` had briefly reached `Complete`, both reported to production (#121311,
  #121318, linked to Test Case #121093), and **both retested FIXED after the user asked to restart the
  `redmine-docker-700-redmine-1` container** (twice — once per bug). `BUG-DSH-023` was confirmed via a clean
  per-role comparison (Admin/Daisy Skye, who qualify for the restricted field, now see it; Summer Rain, who
  doesn't qualify, correctly still doesn't). `BUG-DSH-024` was confirmed via exact DOM measurement at all 3
  original viewport widths (1280×720/1440×900/1920×1080), 0px overflow at every one (was 225px/235px/29px).
  Both closed: production synced to Done/100%, local files moved to `bugs/closed/`, per explicit approval each.
- Test Case #121093 now shows **16 total linked defects — all 16 closed.**
- **Full final-cycle regression (§27) run and passed 2026-09-25, per explicit user request** — every suite
  checked (Chart Widgets, Chart Settings, Global Filters/Layout, Saved Queries/Drilldown, Permissions, Public
  Sharing, Installation/Access), zero new failures, every previously-fixed bug's fix confirmed still holding
  post-restart. **`STATUS.md` is now `Complete`** — both CLAUDE.md §10 conditions met.
- **Production feature #120914 marked Done, per explicit approval** — all 16 linked defects are closed.
- **`TC-DSH-138` (stacked-chart drill-down) is still INCONCLUSIVE, not resolved.** The user separately confirmed
  drill-down is intentionally not implemented for the 3 stacked-by chart variants in general terms, which is
  very likely the correct resolution for this TC too, but that specific link was never explicitly confirmed —
  worth a quick confirmation (or a real human click, same as `TC-DSH-160` was resolved) before marking it PASS.
- **Before filing any new permission-boundary bug on this plugin, read the updated `DASHBOARDS_REQUIREMENTS.md`
  Permissions Matrix and `DASHBOARDS_MEMORY.md` first** — this session learned the hard way that this plugin's
  documented model is unusually flat (equal capabilities for any project member, no role-based restriction on any
  dashboard action except link revocation). An assumption that "Redmine plugins conventionally restrict this kind
  of action" is not itself grounds for a bug here.
- **Every suite is now fully worked through** (executed, or deferred with a specific documented reason) —
  `SAVED_QUERIES_AND_DRILLDOWN.md` (the last one) was finished this pass, including the two open investigations
  (`TC-DSH-142`, `TC-DSH-165`), both resolved in the plugin's favor with no new bugs. Nothing left in "not yet
  reached" status anywhere in the plugin; what remains is a short list of individually-deferred TCs, each with its
  own documented blocker (below), not a backlog to sweep through.
- **Remaining deferred TCs, in priority order for a future session:**
  1. `TC-DSH-123` (token survival after the sharer loses access) — **furthest along of the deferred items**: a
     working fresh token was already generated as Daisy Skye and confirmed live; the next step (removing her
     test-project membership as Admin, then retrying the token) was blocked by this session's own auto-mode safety
     classifier as "Modify Shared Resources." Needs explicit approval to remove-and-restore a real membership.
  2. `TC-DSH-122` (`PUBLIC_SHARING.md`) and `TC-DSH-106`'s archived-project half (`PERMISSIONS.md`) — both need a
     dedicated, disposable project fixture rather than touching a shared one on this instance.
  3. `TC-DSH-101`'s deeper form (genuine anonymous access with `login_required` temporarily off) — this instance
     has `Authentication required = Yes` globally, which gates everything before any project/role permission is
     evaluated; a real anonymous test needs a dedicated instance or an approved temporary toggle-and-restore, not
     this shared one.
  4. Redo the German language spot-check of the #120914-era Settings labels properly (real
     `browser_select_option` for My Account → Language, not a scripted value-set — see `DASHBOARDS_MEMORY.md`) —
     needed for both `TC-DSH-174` and the still-open German-language item.
  5. `TC-DSH-062` (resize) and the Escape-key exit findings (`TC-DSH-066`/`067`) — retry with a real human
     interaction; current results are inconclusive/partial under CDP automation, not confirmed either way.
  6. `TC-DSH-138` (drill-down from a stacked Bar chart) — 4 automated click techniques all failed; a possible
     devicePixelRatio scaling issue was found but not confirmed. Needs a real human click to resolve. (`TC-DSH-160`,
     the other item in this same "needs a real interaction" category, was resolved 2026-09-25 — the user performed
     a genuine manual hover and captured a screenshot confirming the pointer cursor; PASS. The same real-interaction
     approach is the recommended next step for `TC-DSH-138` too.)
  7. `TC-DSH-170` (Assignee largest-first ordering) — needs a purpose-built fixture with 3+ distinctly-different
     assignee counts; this project's real data only has 2 tied at the same count.
  8. `TC-DSH-126` (public view under load) — genuinely out of scope for Playwright MCP; needs dedicated
     load-testing tooling.
  9. The many destructive/environment-level Installation suite cases (folder rename, migration skip, REST API
     toggle, uninstall) — need a dedicated disposable Redmine instance, not `redmine-docker-700`.
  10. The two-concurrent-session cases deferred across every suite (`TC-DSH-026/048/063/105/107`, etc.).
- **Fixture left in place from this pass, reusable next session:** `test-project`'s "QA Single Select Field"
  (cf_68) now has real values set on several issues (Red/Green/Blue/Yellow, used for `TC-DSH-168`–`176`); a
  private query (`issue_query_16`, "QA Private Query for TC-103 Test", owned by Admin) exists for saved-query
  visibility testing; widget 138 on the shared dashboard renders it. Seed users `harmony.rose` (QA Read Only
  role) and `daisy.skye` (Reporter) were used this pass alongside the already-established `summer.rain` (QA Own
  Visibility) — all three, plus their exact role names, are documented in `bugs/open/BUG-DSH-019/020/021.md`.
- `reports/tc-report.html` and `reports/defects-summary.html` don't exist yet for this plugin (only
  `final-bug-report.md` has been maintained across sessions) — generate them if/when a full run's HTML output is
  needed.
- Consider whether production Test Case #121093's result (currently "Failed") should be updated — given multiple
  new bugs are open, it should very likely stay "Failed" until they're resolved. A production write either way
  requires its own fresh approval.
- Note: plugin confirmed via Administration > Plugins as "Redmineflux Analytics Dashboard" (internal name `redmineflux_dashboard`), version 7.0.0.

## Open Bugs Found

**`bugs/open/` is empty — 0 open bugs.**

**Closed this cycle (all fixed, synced to production, moved to `bugs/closed/`):**
- `BUG-DSH-024` (Medium) — the dashboard grid's own computed `grid-template-columns` pixel widths summed to more
  than the grid container's actual width, at every viewport width tested (1280×720: 225px over; 1440×900: 235px
  over; 1920×1080: 29px over). Since CSS Grid lays out left-to-right, 100% of the overflow landed on the right
  edge — the rightmost card in every row was visibly clipped with no right-side margin. **Retested FIXED
  2026-09-25 after a container restart** — 0px overflow confirmed at all 3 original viewport widths, columns
  now evenly and correctly distributed. See `bugs/closed/BUG-DSH-024.md` for full per-width measurements and
  screenshots (both the original repro and the retest-pass).
- `BUG-DSH-023` (Medium) — the chart-template "Group by" selector never offered a role-restricted custom field,
  even for a viewer whose own role was explicitly in the field's allowed-roles list. Violated #120914
  requirement 2's "only fields visible to the current user... should be listed." **Retested FIXED 2026-09-25
  after a container restart** (`docker restart redmine-docker-700-redmine-1`) — confirmed with a per-role
  comparison: Admin/Daisy Skye (qualifying roles) now see the field, Summer Rain (non-qualifying role) correctly
  still does not. See `bugs/closed/BUG-DSH-023.md`.
- `BUG-DSH-002` (Medium) — chart-template widget grouped by a **custom field** was missing the General section.
- `BUG-DSH-004` (Low) — grouping-dimension selector offered a genuine multi-select custom field.
- `BUG-DSH-005` (High) — Save Settings broke live display to "No Data Available", reset accent colour.
- `BUG-DSH-006` (Medium) — Settings panel had no Display as / Group by control at all.
- `BUG-DSH-007` (Medium) — Bar/Line chart legends showed the query name instead of the category label.
- `BUG-DSH-008` (High) — drill-down silently returned the entire query for a non-filterable custom field.
- `BUG-DSH-011` (Low) — Auto Refresh off didn't cancel the already-scheduled cycle. **Retested FIXED 2026-09-25**:
  zero refresh calls in a clean 65s window after toggling off 4s before a cycle.
- `BUG-DSH-013` (High) — dashboard charts disclosed the full unrestricted issue count (725) to a role restricted
  to 1 visible issue. **Retested FIXED 2026-09-25**: charts now show Summer Rain's real total (1) across every
  instance checked.
- `BUG-DSH-014` (Low) — widgets could be added on a closed project. **Retested FIXED 2026-09-25**: Add Chart no
  longer reachable on a closed project; an active project is unaffected.
- `BUG-DSH-016` (Medium) — the global date range wasn't actually remembered across navigation. **Retested FIXED
  2026-09-25**: selector and underlying data both correctly persist now.
- `BUG-DSH-018` (Medium) — a failed widget refresh left the chart silently showing stale data, no visible error.
  **Retested FIXED 2026-09-25** (after an initial invalid retest via the header Refresh button was corrected per
  the production issue's own developer note): auto-refresh failures now mark the card with an amber border +
  badge, and recovery is clean.
- `BUG-DSH-019` (**Critical**) — any authenticated user, zero project membership required, could open ANY private
  project's dashboard and see its real chart data. **Retested FIXED 2026-09-25**: now a clean 403 for non-members;
  legitimate members unaffected.
- `BUG-DSH-020` (Medium, narrowed 2026-09-25) — a member who created a public share link couldn't revoke it
  themselves. **Retested FIXED 2026-09-25**: a new "Revoke link" button works end-to-end, verified via a real
  revoke + 404 re-check.
- `BUG-DSH-021` (Medium) — a chart's User Filter dropdown disclosed the full 20-account instance user roster.
  **Retested FIXED 2026-09-25**: now scoped to the project's own 7 real members.

All 8 production issues (#121272/#121273/#121274/#121283/#121284/#121285/#121286/#121287) synced to Done/100%
2026-09-25, per explicit user approval. A full final-cycle regression (§27) passed with zero new failures before
closure.

**Retracted (6 total — retired IDs, do not reuse or re-file):**
- `BUG-DSH-009` — Project Progress Gauge not following the global date-range filter. **Intentional design**,
  confirmed by the product owner — the Gauge is deliberately an all-time metric.
- `BUG-DSH-012` — saved-query widgets not following the global filter bar. **Intentional design**, confirmed by
  the product owner — saved-query widgets are deliberately governed solely by their own saved query's own
  criteria.
- `BUG-DSH-010` — Our Queries tab's create-time Chart Title appearing silently discarded. **False positive — a
  testing error, not a product defect.** The user reported it wouldn't reproduce; re-investigation found the
  original test had been typing into `#chartTitleInput` (a hidden, unrelated element) instead of the real field,
  `#chartTitle`, across all 6 of its "reproductions." Retested correctly: the title applies exactly as expected.
- `BUG-DSH-015` — a view-only role could add/edit/delete/reposition dashboard widgets. **Intentional design**,
  confirmed via the vendor KB (fetched directly 2026-09-25) — "any user with access to the project can open the
  dashboard," with no documented permission gating any dashboard action for any role.
- `BUG-DSH-017` — an invalid global custom date range appeared to be silently rejected with no error message.
  **False positive from a testing error** — a toast error does appear, but auto-dismisses fast enough that a
  static (non-`MutationObserver`) DOM check misses it.
- `BUG-DSH-022` — a restricted-visibility user's public share link showed the project's full, unrestricted data.
  **Retracted as consistent, intentional design** (not a KB citation this time, but an architectural-consistency
  argument confirmed by the user/product owner 2026-09-25) — this plugin already shows project-wide unscoped data
  regardless of viewer everywhere else (`BUG-DSH-013`, which remains open on its own), so sharing mirroring that
  is expected, not a new defect.
- See `bugs/_duplicates.md` and `DASHBOARDS_MEMORY.md` for the full retraction record on all six.

## Closed Bugs

- BUG-DSH-001 (Low, originally High) — near-total absence of German i18n across the entire Dashboard plugin UI. **Fully fixed**, verified 2026-09-09 — every one of the ~60+ originally-untranslated strings (dashboard shell, Add Chart modal, chart card controls, all 3 Settings panel sections, toasts, validation error, delete dialog, and the public Share Link view's LIVE badge + date ranges) is now correctly German.
- BUG-DSH-002/004/005/006/007/008 (see Open Bugs Found above for details) — all fixed, retested 2026-09-24, closed
  same day.
- BUG-DSH-011/013/014/016/018/019/020/021 (see Open Bugs Found above for full retest evidence) — all fixed,
  retested 2026-09-25, closed same day. `bugs/open/` is now empty.

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
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010), post plugin-migration + restart | Claude (Playwright MCP) | **Retest pass, same day.** User reported the plugin migration hadn't been run on the earlier pass; ran `rake redmine:plugins:migrate` and restarted the container, then asked for a full retest. **`BUG-DSH-002` and `BUG-DSH-004` both retested against their exact original repro steps — both still reproduce**, confirmed the migration was not the cause of either gap; retest evidence (screenshots + notes) added to both bug files. Re-confirmed the previously-passing sanity scenarios still hold with fresh (drifted) live data: grouped-by-list-CF segment counts (1 Green + 140 Not set = 141) and drill-down count (140/140) still reconcile exactly; append-to-end + no-reload additionally confirmed from the **Our Queries** tab (only Saved Queries had been tested in the first pass). No regressions from the migration. Cleaned up one throwaway test chart used only for this retest; kept the 4 original `Sanity 120914 - *` fixture charts on the dashboard for future retests. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Follow-up investigation, same day, prompted by the user sharing two Settings-panel screenshots and reporting charts disappearing after Save Settings.** (1) **Corrected `BUG-DSH-002`**: added a Bar chart widget grouped by the standard field Status and compared its Settings panel against the custom-field-grouped one — the standard-field widget correctly has Legend Position + Data Labels, so the gap is specific to custom-field grouping, not chart-template widgets generally. Rewrote the bug's Title/Steps/Expected/Actual with the comparison screenshot as evidence; corrected before ever being reported to production, so no production sync was needed. (2) **Filed `BUG-DSH-005` (High)**: reproduced the user's report exactly — Save Settings on a chart-template widget, even with zero changes, immediately breaks its live display to "No Data Available" in place (confirmed on both a Doughnut/custom-field and a Bar/Status widget). Root-caused via the `PATCH .../widgets/:id/settings` request/response: the server computes fully correct `chart_data` every time, so this is purely a client-side re-render bug — a page reload always recovers it. Also caught in the same request/response inspection: the Top Accent Color silently resets to its default on a no-op save, and the "Issue Status Filter" dropdown is completely non-functional (its selection is never sent in the save request; the server's stored value never changes no matter what's picked). `bugs/open/` bug count 2 → 3; `STATUS.md` and `DASHBOARDS_MEMORY.md` updated. None of the 3 bugs have been reported to production yet — pending explicit approval. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Fourth pass, same day.** User cleared all dashboard widgets and gave a precise design spec for the Settings panel: Display as → Group by (updating together) → Chart Color Palette (for non-statistics-card templates), and explicitly no separate filter section since the saved query alone should govern which issues show. Verified live on a fresh widget: confirmed the Settings panel has no Display-as/Group-by control anywhere (both fixed at Add-Chart time). **Filed `BUG-DSH-006` (Medium)** for the missing post-creation template/grouping editing, explicitly flagged as going beyond #120914's literal text for the developer/PM to triage. **Reframed `BUG-DSH-005`'s Issue Status Filter finding**: per the user, the section should be removed entirely, not fixed to work. `bugs/open/` bug count 3 → 4 (1 High, 2 Medium, 1 Low); `STATUS.md`, `bugs/_index.md`, `final-bug-report.md` updated. Still none of the 4 bugs reported to production — pending explicit approval. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Fifth pass, same day — systematic Display-as × Group-by sweep, focused on drill-down, prompted by user's screenshot of a legend/bar-label mismatch.** Added all 4 chart templates (Doughnut/Pie/Bar/Line) for one query side by side, then a 5-category Priority-grouped Bar and a custom-Boolean-field-grouped Bar for broader coverage. Confirmed via `Chart.getChart(canvas).legend.legendItems`: Doughnut/Pie legends correctly show the category label; **Bar/Line always show the query's own name instead**, regardless of category count or standard- vs custom-field grouping. **Filed `BUG-DSH-007` (Medium)**. Drill-down independently reconfirmed correct in every tested combination (exact count matches each time) — purely a display/legend defect, not a data or interaction one. Also reconfirmed the per-field "Used as a filter" precondition applies individually (`cf_71` needed it, same as `cf_68` earlier). `bugs/open/` bug count 4 → 5 (1 High, 3 Medium, 1 Low); `STATUS.md`, `bugs/_index.md`, `final-bug-report.md`, `DASHBOARDS_MEMORY.md` updated. Still none of the 5 bugs reported to production — pending explicit approval. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Sixth pass, same day — user asked directly whether drill-down had been checked across all 4 chart types for the same query, not just Bar.** Honest gap: the prior passes had confirmed Bar (3×) and Doughnut (1×) but never Pie or Line. Tested all 4 on the same widgets: Pie and Line both drill-down correctly with exact count matches (6/6 each). One false alarm caught and corrected mid-check: a first Pie attempt appeared to not fire at all (no new tab) — root-caused to a **stale `canvas.getBoundingClientRect()`** (the canvas had shifted ~300px between fetching the rect and dispatching the click, across two separate tool calls) rather than a real defect; recomputing fresh coordinates in the same call fixed it. Also attempted a pointer-cursor comparison across all 4 types via synthetic `mousemove` events — results were inconsistent run to run (e.g. Doughnut read "pointer" once, "default" another time, no code change between) — concluded this specific check is unreliable via synthetic events and did **not** file a bug from it; drill-down itself (the reliable signal) is confirmed working on every chart template. Both lessons saved to `DASHBOARDS_MEMORY.md`. No new bugs filed this pass — a real gap in prior test coverage, now closed with all-PASS results. |
| 2026-09-23 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Seventh pass, same day — user reframed a previously-noted "testing precondition" as a real product bug and asked for it to be filed.** The "Used as a filter" quirk (a non-filterable custom field's drill-down silently returning the whole query) had only been tracked as a fixture gotcha to work around in earlier passes. Re-examined from the user's own workflow framing: the chart renders correctly, the user clicks a segment expecting just those issues, and silently gets everything — a real, misleading defect. Built a clean, dedicated repro on `cf_71` ("QA Boolean Field", still not marked "Used as a filter"): chart correctly showed Yes=1/No=1/Not set=139 (141 total); clicking "Not set" opened a correctly-shaped drill-down URL, but the result was `(1-25/141)`, not 139. Captured both states as screenshots. **Filed `BUG-DSH-008` (High)** — the highest tier alongside `BUG-DSH-005`, since both are silent-wrong-result defects in the feature's headline capability (drill-down), not missing-control gaps. `DASHBOARDS_MEMORY.md`'s existing note on this was reframed from "fix your fixture" to "this is a filed bug, and also still practical fixture advice." `bugs/open/` bug count 5 → 6 (2 High, 3 Medium, 1 Low); `STATUS.md`, `bugs/_index.md`, `final-bug-report.md` updated. Still none of the 6 bugs reported to production — pending explicit approval. |
| 2026-09-23 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **All 6 open bugs reported to production `ztflux`, per explicit user approval** (scope confirmed via a clarifying question — "all 6 open bugs" — since the request's wording was ambiguous between 1 and 6). Created #121131 (BUG-DSH-002, Medium), #121132 (BUG-DSH-004, Low), #121133 (BUG-DSH-005, High), #121134 (BUG-DSH-006, Medium), #121135 (BUG-DSH-007, Medium), #121136 (BUG-DSH-008, High) — each with a full Textile description (Preconditions/Steps/Expected/Actual/Environment), Priority/Defect Severity/Defect priority/Defect Type set per the standard severity mapping, category "Custom dashboard plugin", assigned to **Prashant Chaurasia**. Each then linked via `report_defect` (not `create_status_result`) as a defect on **Test Case #121093**, **Run #577**, **Test Suite #249**, Environment **"Window 11 + Chrome"** — pre-verified via a read-only `get_run_testcases` call that these targets matched exactly what the user specified before writing anything. Post-write verification confirmed all 6 linked correctly in one shot: `#121093 [Failed] ... defects:[121131, 121132, 121133, 121134, 121135, 121136]` — no partial-link or overwrite issue. All 6 local bug files updated with their Production Redmine Issue ID header and a Production report section; `bugs/_index.md` gained a Production Redmine Issue ID column (previously missing from this plugin's index, unlike the CLAUDE.md template). |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Retest pass — all 6 previously-filed/production-reported bugs retested against their exact original repro steps, all confirmed FIXED.** `BUG-DSH-002`: General section (Legend Position, Show Data Labels, Display as, Group by) now renders for custom-field-grouped widgets. `BUG-DSH-004`: multi-select CF no longer offered in Group by, confirmed exclusion is genuinely multi-select-based (not incidental) by enabling "Used as a filter" on it and rechecking. `BUG-DSH-005`: Save Settings no longer breaks live rendering, accent colour persists, Data Filters section removed entirely. `BUG-DSH-006`: Display as/Group by now editable in Settings, live-updates the chart on Save. `BUG-DSH-007`: `chart.legend.legendItems` now correctly shows category labels on Bar. `BUG-DSH-008`: root cause shared with `BUG-DSH-004`'s fix — enabling "Used as a filter" on `cf_71` made it selectable and its drill-down now returns an exact 139/139 match. All 6 bug files updated with retest evidence; `bugs/_index.md`/`DASHBOARDS_MEMORY.md` updated to reflect fixed status. **Not yet closed** — production sync (In QA → Done, 100%) and moving files to `bugs/closed/` both pending explicit user approval (CLAUDE.md §5). |
| 2026-09-24 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **All 6 bugs closed, per explicit user approval.** Synced each linked production issue (#121131–#121136) to status Done / 100% done via `redmineflux_core_update_issue`, verified via `get_issue` re-reads on 2 of the 6. Moved all 6 files from `bugs/open/` to `bugs/closed/` via `git mv`. `bugs/_index.md`, `final-bug-report.md`, `STATUS.md` updated. `bugs/open/` now empty. |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Post-fix regression per `SENIOR_QA_STANDARDS.md` §26, run after the user asked whether the 6 closed bugs had actually been regression-tested (they had only been point-retested).** Scope: full re-execution of every #120914 TC (TC-DSH-150–188) plus adjacent spot-checks (statistics-card widgets, time-entry query gating, "Our Queries" Data Filters separation) — disclosed as not a literal re-run of every TC in the 3 suites (auto-refresh/drag-resize/full filter sweep deferred to the final-cycle regression as structurally unrelated, low-risk). Executed against brand-new widgets, not the bugs' own retest fixtures: append-to-end + no-reload + no-op-save-doesn't-break-chart + drill-down-exact-match all reconfirmed on a fresh Doughnut widget; legend correctness reconfirmed in bulk across ~15 rendered widgets via one `Chart.getChart` sweep; statistics-card Settings panel reconfirmed hiding General/Appearance via per-control computed-style checks (not text-content, which gave a false positive mid-session from an unscoped DOM query picking up hidden sibling panels — corrected by scoping to the actually-visible modal node). **Zero new failures** — all 6 fixes hold beyond their own original repro. `bugs/open/` still empty; `STATUS.md` remains `In Progress` pending the full final-cycle regression (§27) across the entire plugin suite. |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Full final-cycle regression per `SENIOR_QA_STANDARDS.md`/CLAUDE.md §27**, run at the user's explicit request ("run the full final-cycle regression... include auto-refresh, drag/resize, the full per-filter-type sweep, and all remaining relevant plugin regression suites... do not mark STATUS.md Complete until finished and verified"). Executed genuinely, suite by suite, across every `testcases/` file for the first time: **Chart Widgets (22 TCs, first execution)** — all 22 core types cross-checked, 11 issue-based types all independently summed to exactly 724 with zero mismatches; **2 bugs found**: `BUG-DSH-009` (Project Progress Gauge ignores global date-range filter, proven via a live toggle + Performance-API-precise comparison against a correctly-responsive sibling widget) and `BUG-DSH-010` (Our Queries tab's create-time Chart Title silently discarded, reproduced 6× with verified non-empty input immediately before submit). A third suspected defect (Total Remaining Time showing all-zero) was investigated with a purpose-built fixture issue (`#1573`, assigned + 10h estimated) and turned out **not** to be a bug — correct once real data existed. **Chart Settings (TC-DSH-009–026, first execution)** — filter application/clearing, per-chart date override + global-override interaction, and negative date validation all verified with precise cross-checks (e.g. Issue Status Filter narrowing 725→597, exactly matching the independently-known closed+rejected count). **Global Filters/Layout** — auto-refresh genuinely verified via `performance.getEntriesByType`, catching **`BUG-DSH-011`** (one extra refresh cycle fires ~30s after toggling off, precisely timed at 29993ms after the prior cycle, confirmed bounded not infinite via a further 64s clean window); drag-and-drop confirmed working (real `page.mouse` events, since Playwright's `dragTo()` doesn't trigger this app's custom handle) and persisting through reload; resize could not be triggered via any technique tried (mouse/synthetic mouse/pointer events) — recorded inconclusive, not a bug, since drag worked fine with the same approach; found the global filter bar has no Issue Status control at all despite `DASHBOARDS_REQUIREMENTS.md` claiming otherwise (stale doc, not a bug). **Saved Queries/Drilldown** — while investigating global-filter interaction (`TC-DSH-134`), found **`BUG-DSH-012`**: saved-query widgets ignore the entire global filter bar (Date Range and Tracker both), proven with byte-for-byte-identical data across 4 different global filter states while a sibling built-in widget correctly responded every time — architecturally distinct from `BUG-DSH-009`, affecting the whole saved-query widget category. **Permissions** — logged in as a real restricted seed user (Summer Rain, role "QA Own Visibility", confirmed via her own issue list to see exactly 1 issue) and found **`BUG-DSH-013`** (High): every dashboard chart tested showed the full unrestricted project total (725) instead of her own visible set — a 725x aggregate data-visibility leak; the drill-down itself was independently confirmed safe (Redmine core's own issue-list permission check correctly restricted it to her 1 issue). **Installation/Access** — confirmed no Dashboard module exists to toggle (architectural fact), and while testing the closed-project negative case found **`BUG-DSH-014`** (Low): widgets can be added on a closed project, contradicting Redmine's "closed = read-only" convention. **Public Sharing** — the best-implemented area found all session: token is 44 characters high-entropy, unauthenticated access genuinely verified two ways (`fetch` with `credentials:'omit'` and a real navigation with no session), data parity confirmed (28/28 canvases matched authenticated data), drill-down cleanly disabled, all edit controls absent from the DOM entirely — zero new bugs. **German Language**: not re-executed (BUG-DSH-001 already closed with a passed regression in 2026-09-09); an attempted spot-check of the newer #120914 labels was inconclusive because the language-switch itself silently failed to apply (same raw-DOM-value-setter issue as elsewhere this session) — flagged for next session, not resolved. **6 new bugs total this pass (`BUG-DSH-009`–`014`): 0 Critical, 2 High, 2 Medium, 2 Low.** None yet reported to production — pending explicit approval. Several negative/multi-role/destructive-environment cases across every suite were deliberately deferred (documented individually per TC) rather than risking shared fixtures on this instance or requiring genuinely concurrent sessions this harness can't produce — see each suite file's header note and the `bugs/open/BUG-DSH-009.md`–`014.md` files for full evidence. `bugs/open/` is no longer empty; `STATUS.md` remains `In Progress` per the user's explicit instruction not to mark Complete. |
| 2026-09-24 | 7.0.1.stable | n/a (product-owner clarification, no live testing) | Claude | **Retraction pass, same day.** User (product owner) reviewed `BUG-DSH-009` and `BUG-DSH-012` and confirmed both are intentional design, not defects: the Project Progress Gauge is deliberately an all-time metric, never scoped to the date-range filter; saved-query widgets are deliberately governed solely by their own saved query's own criteria, never further constrained by the dashboard's global filter bar — explicitly instructed not to modify either to follow the global filters, and to record both as intentional so they aren't re-flagged. Retracted both: deleted `bugs/open/BUG-DSH-009.md`/`BUG-DSH-012.md` and their screenshot folders (never real defects); `bugs/_index.md` rows changed to `[RETRACTED]` with no file path; added a "Retracted findings" section to `bugs/_duplicates.md` (the two IDs are now retired, same pattern as the pre-existing `BUG-DSH-003` gap — do not reuse); added two "INTENTIONAL DESIGN" entries to `DASHBOARDS_MEMORY.md`'s Confirmed Working section per the user's explicit request; corrected `DASHBOARDS_REQUIREMENTS.md` (workflow step 3 and the global-filter-bar feature bullet) to document both exceptions instead of claiming "every chart re-queries against the new filter" unconditionally; corrected the FAIL verdicts on `TC-DSH-032` (Chart Widgets) and `TC-DSH-134` (Saved Queries/Drilldown) to PASS with an explanation of the correction; updated `final-bug-report.md` (bug count 6→4: 1 High/1 Medium/2 Low remain open, `BUG-DSH-013`/`012` removed from the High-severity pair leaving just `BUG-DSH-013`), `STATUS.md`, and this file's Open Bugs Found / Next Session Start Point sections. **Open bug count now 4** (`BUG-DSH-010/011/013/014`) — `BUG-DSH-013` remains the highest-priority item (High, real data-visibility leak). |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Second retraction pass, same day — user reported "when i test bug 10 it will not reproduced."** Re-investigated live rather than defending the original report. Clicked Add Chart with a genuine `browser_click`, selected the chart type via genuine `browser_select_option` (not raw JS), then attempted `browser_type` into `#chartTitleInput` (the selector used throughout the original `BUG-DSH-010` investigation) — it **timed out with "element is not visible,"** immediately exposing the problem: `document.querySelectorAll('#chartTitleInput')` confirmed exactly one such element in the DOM and it was hidden (`offsetParent: null`), while a screenshot showed the real, visible "Chart Title (optional)" field sitting right there in the open modal. Enumerating visible inputs found its real id: `#chartTitle` — a different element from `#chartTitleInput` entirely. Typed into `#chartTitle` and clicked Add: **the custom title applied correctly on the first attempt.** Root cause confirmed: every one of the original investigation's 6 "reproductions" (via raw JS evaluate and even genuine Playwright `fill()`/`pressSequentially()`) had been writing to and reading back the same wrong, hidden element the whole time — self-consistent but never touching the real field, which is why it looked so thoroughly reproducible. **Retracted `BUG-DSH-010`**: deleted `bugs/open/BUG-DSH-010.md` and its screenshot; `bugs/_index.md` row changed to `[RETRACTED]`; `bugs/_duplicates.md`'s "Retracted findings" section extended with this as a **false-positive/testing-error** entry (distinct from the intentional-design retractions); `DASHBOARDS_MEMORY.md` gained a detailed `#chartTitleInput` vs `#chartTitle` technique-lesson entry plus a "true positive rate" takeaway on re-deriving selectors instead of trusting a remembered one; `DASHBOARDS_CHART_WIDGETS.md`'s `TC-DSH-028`/`029`/`037` cross-refs and the suite header corrected to PASS; **also completed the XSS check on the create-time path that had been blocked by this same error (`TC-DSH-041`)** — script tag in the title via the correct `#chartTitle` field: not executed, properly HTML-escaped, same clean result as the already-passing Settings-panel path. `final-bug-report.md`, `STATUS.md`, this file's Open Bugs Found/Next Session Start Point sections all updated. **Open bug count now 3** (`BUG-DSH-011/013/014`) — `BUG-DSH-013` remains the highest-priority item. Lesson for future sessions: a finding that reproduces consistently across multiple techniques can still be a testing artifact if every technique shares the same wrong assumption — when a result looks "too reliably broken," re-derive the target selector fresh from the live, visible DOM rather than reusing one from memory. |
| 2026-09-24 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **`BUG-DSH-011/013/014` reported to production `ztflux`, per explicit fresh approval** (assignee confirmed separately: Prashant Chaurasia). Created #121272 (BUG-DSH-011, Low), #121273 (BUG-DSH-013, High), #121274 (BUG-DSH-014, Low), each with a full Textile description, severity fields set, category "Custom dashboard plugin". Linked via `report_defect` to the **same** production Test Case #121093 / Run #577 / Test Suite #249 / Environment "Window 11 + Chrome" already used for the earlier 002/004/005/006/007/008 batch — explicitly confirmed with the user first, since none of these three was actually found via TC #121093's own #120914-scope steps (a deliberate instruction, not an inferred match). Post-write verification: testcase now shows all 9 linked defects. All 3 local bug files updated with their Production Redmine Issue ID. |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **"Execute the not-yet-executed TCs" pass, same day** — user asked to review and execute all TCs still marked not-executed (of the 187-TC full suite), independently-executable ones only, documenting specific blockers for the rest. First re-verified the executed/not-executed baseline itself: a prior count of 63/16/108 had missed 8 TCs using a bullet-prefixed verdict style (`- **PASS...**` vs the more common `**PASS...**`, e.g. the entire #120914-follow-up block TC-DSH-181–188); corrected baseline was **71 executed / 16 covered-by-other / 100 genuinely not executed**. Worked through `CHART_SETTINGS` (21/21 addressed — 19 executed, 2 deferred to this same pass's Permissions work, including `TC-DSH-023`/`025`), `CHART_WIDGETS` (3/3), `GLOBAL_FILTERS_AND_LAYOUT` (16/16) and `PERMISSIONS` (7/7 of its own `TC-DSH-101`–`107`, plus the 2 folded in from `CHART_SETTINGS`) — **63 of the 100 addressed this pass** (`INSTALLATION_AND_ACCESS`'s 12 were already fully documented-as-blocked from an earlier session, not freshly touched this pass); `PUBLIC_SHARING` and most of `SAVED_QUERIES_AND_DRILLDOWN` not yet reached at this point in the pass (see the next Run History row for `PUBLIC_SHARING`). **7 new bugs found, headlined by a Critical:** `BUG-DSH-019` (**Critical**) — any authenticated user, with *zero* project membership, can open a completely private, unrelated project's Analytics Dashboard and see its real chart data; proven by the same user/session getting a normal-looking dashboard from the plugin's own controller while Redmine core's own `/issues` controller correctly 403'd her on the identical project seconds later — the dashboard route performs no project-access check at all. `BUG-DSH-020` (High) — any project role, down to Reporter, can mint a public share link (verified working fully unauthenticated) and cannot revoke it themselves. `BUG-DSH-015` (High) — a "QA Read Only" role can create/delete/reposition/reconfigure widgets via four separate endpoints, root-caused to the plugin registering **no permission of its own** in Redmine's Roles matrix at all (confirmed by enumerating every module fieldset — 21 other plugins each have one, this one has none). `BUG-DSH-021` (Medium) — a chart's User Filter dropdown enumerates the full 20-account instance user roster to a maximally-restricted-visibility role. `BUG-DSH-016` (Medium) — the global date range isn't actually remembered across navigation (`localStorage` has no such key at all) despite the KB's claim. `BUG-DSH-018` (Medium) — a failed widget refresh (simulated via route interception) leaves the chart silently showing stale data with zero visible error. `BUG-DSH-017` (Low) — an invalid global custom date range is silently rejected with no error message, unlike the identical per-chart validation which does show one. Also confirmed two genuine **positives** worth recording: saved-query visibility *is* correctly enforced (a private query's widget is invisible to, and not offered to, a non-owner member — `TC-DSH-103`), and `TC-DSH-046` (time-tracking chart data) matched a restricted user's own independently-visible spent-time entries exactly, unlike the issue-count leak. Also caught and corrected a false-negative mid-pass: `TC-DSH-001` initially appeared to show Legend Position "stuck," traced to 3 duplicate same-titled fixture widgets on this heavily-reused dashboard — fixed by anchoring checks to a widget's own unique `data-widget-id` rather than title-text matching (see `DASHBOARDS_MEMORY.md`). Several TCs remain honestly non-executed with specific reasons recorded inline per TC (native-Escape-key exits not confirmable under CDP automation for either the dashboard-level or per-chart fullscreen view, two-genuinely-concurrent-session cases, one archived-project state deliberately not induced on a shared fixture instance per the same caution as `TC-DSH-024`, German-language switching still unreliable via script, `TC-DSH-170`'s largest-first ordering not fully provable with this project's tied-count fixture data). **`bugs/open/` now holds 10 bugs** (`BUG-DSH-011/013–021`) — the 7 new ones not yet reported to production. `STATUS.md` stays `In Progress`. |
| 2026-09-24 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Continuation of the "execute the not-yet-executed TCs" pass, same day — `PUBLIC_SHARING` suite.** Worked through 13 of its 16 not-executed TCs (`TC-DSH-111`/`113`/`122`/`123`/`126` deferred with specific reasons — time/interval-wait cost, needs a dedicated disposable project or a second real membership-removal cycle, or is genuine load-testing tooling out of scope). Confirmed several parts of this suite are **genuinely well-built**: write endpoints (create/delete/settings/regenerate widget) simply don't exist under the public token namespace at all (`TC-DSH-118`, all 404); invalid/altered tokens return a clean generic 404 with no project-name leak (`TC-DSH-115`); the public payload contains only aggregate labels/counts, no issue subjects/IDs/emails (`TC-DSH-116`); chart-segment drill-down doesn't fire and the endpoint doesn't exist publicly either (`TC-DSH-117`); a stored-XSS fixture title reaches the public view fully escaped, not executing (`TC-DSH-127`); token regeneration (implicit — every Share click issues a fresh token) immediately revokes the prior one (`TC-DSH-114`). **But found the session's second Critical bug, compounding two already-open ones**: `BUG-DSH-022` — a restricted-visibility user's (Summer Rain, sees 1 issue everywhere else) own public share link exposes the **full, unrestricted project data (1209)** to anyone on the open internet, unauthenticated — the same `BUG-DSH-013` data-scoping gap plus the same `BUG-DSH-020` any-role-can-share gap, combined into a materially worse consequence than either alone (removes both the auth boundary and the visibility boundary at once). Also confirmed `TC-DSH-121` (share-token generation restriction) and `TC-DSH-124` (token visible to any member) both directly reproduce `BUG-DSH-020`'s already-filed gap from the sharing side, and `TC-DSH-125` found no `noindex` protection at all on the public page (informational finding, not filed as a numbered bug, per the TC's own framing). **`bugs/open/` now holds 11 bugs, two of them Critical (`BUG-DSH-019`, `BUG-DSH-022`).** Corrected an arithmetic error in the previous Run History row: `PERMISSIONS` suite itself only had 7 not-executed TCs (`TC-DSH-101`–`107`), not 14 as originally stated there — the extra 2 (`TC-DSH-023`/`025`) belonged to and are counted under `CHART_SETTINGS`; the "90 of 100" running total in that row was also corrected to the accurate 63 at that point in the pass. **Running total after this row: 76 of the 100 genuinely-not-executed TCs addressed** (63 before this row + 13 from `PUBLIC_SHARING`); `SAVED_QUERIES_AND_DRILLDOWN`'s ~25 remain the only suite not yet reached. `STATUS.md` stays `In Progress`. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP + WebFetch) | **Retraction/narrowing pass, next day — user challenged 5 of the previous day's bugs (`BUG-DSH-015/016/017/020/022`), asking for documentation verification and/or a careful live re-test before accepting any of them.** Fetched the vendor KB (`redmineflux.com/knowledge-base/plugins/custom-dashboard/`) directly rather than relying on the local docs' prior distillation, and re-ran two live tests with corrected technique. Results: **`BUG-DSH-015` retracted** — the KB states "any user with access to the project can open the dashboard" with no documented permission gating add/edit/delete for any role; every local doc (`DASHBOARDS_REQUIREMENTS.md`, `FEATURES_LIST.md`, `SCOPE.md`) already had this flagged as an open "?", not a stated restriction — equal capabilities across roles is this plugin's documented design, not a gap. **`BUG-DSH-016` confirmed, strengthened** — the KB explicitly states "the dashboard remembers your last used date range and reapplies it on the next load," directly contradicted by the original finding; no retraction, added the exact quote as stronger evidence. **`BUG-DSH-017` retracted as a false positive** — re-tested with a `MutationObserver` attached *before* the triggering click (rather than a static post-hoc DOM check, twice, which is what missed it originally) and caught a real `toast-notification toast-error` ("End date cannot be earlier than start date") that had already appeared and auto-dismissed before either original check ran. **`BUG-DSH-020` narrowed, not retracted** — generated a genuinely fresh token as Daisy Skye and tested it in a brand-new isolated browser context (0 cookies): still worked, confirming the underlying mechanics are real. But per the user's confirmed judgment call, the "any role can generate a link at all" framing rests on the same now-retracted "equal capabilities" basis as `BUG-DSH-015`, so that half was dropped; the bug survives narrowed to just the self-revocation gap (only an Admin can revoke a link, not its creator — the Share modal's own text documents this), severity lowered High → Medium. **`BUG-DSH-022` retracted** — per the user's confirmed judgment call, since this plugin already shows project-wide unscoped data regardless of viewer everywhere else (`BUG-DSH-013`, which remains open in its own right and was not disputed), a restricted sharer's public link mirroring that same unscoped view is architecturally consistent, not a new, separately-worth-filing defect. Updated every cross-referencing testcase entry (`TC-DSH-025/047/077` for 015; `TC-DSH-073` for 017; `TC-DSH-104/107/120/121` for 020/022) from FAIL to PASS-with-explanation, corrected `DASHBOARDS_REQUIREMENTS.md`'s Permissions Matrix from "?" to confirmed "✓ for all roles except self-revoke", and added corresponding entries to `DASHBOARDS_MEMORY.md` and `bugs/_duplicates.md`. **`bugs/open/` now holds 8 bugs** (`BUG-DSH-011/013/014/016/018/019/020/021`) — one Critical (`BUG-DSH-019`), down from two. **Lesson reinforced twice in one pass: (1) an assumption about "how permissions conventionally work" is not the same as a documented requirement for this specific, unusually permission-flat plugin — always fetch/check the actual KB or local requirements docs before filing a permission-boundary bug; (2) a static DOM check for an error message, even repeated at two delays, can still miss a toast whose full lifecycle is shorter than the gap between checks — always attach a `MutationObserver` before the triggering action, never check after the fact.** |
| 2026-09-25 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **All 5 remaining open bugs (`BUG-DSH-016/018/019/020/021`) reported to production `ztflux`, per explicit fresh approval** (assignee confirmed separately: Prashant Chaurasia). Created #121283 (BUG-DSH-016, Medium), #121284 (BUG-DSH-018, Medium), #121285 (BUG-DSH-019, Critical), #121286 (BUG-DSH-020, Medium), #121287 (BUG-DSH-021, Medium), each with a full Textile description, severity fields set (BUG-DSH-019 mapped to Priority=Blocker/Defect Severity=Critical/Defect priority=Urgent/Defect Type=Security), category "Custom dashboard plugin". Linked via `report_defect` to the same production Test Case #121093 / Run #577 / Test Suite #249 / Environment "Window 11 + Chrome" used for every prior batch on this plugin. Post-write verification: testcase now shows all 14 linked defects. All 5 local bug files updated with their Production Redmine Issue ID; `bugs/_index.md` updated. **Every currently-open bug on this plugin (BUG-DSH-011/013/014/016/018/019/020/021) is now reported to production.** |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Continuation, same day — finished `SAVED_QUERIES_AND_DRILLDOWN.md` (the only suite left untouched by the "execute the not-yet-executed TCs" effort) and closed out the remaining stragglers across `PERMISSIONS.md`/`PUBLIC_SHARING.md`.** `TC-DSH-142` (saved query spanning projects the viewer cannot see): created a genuinely cross-project public query (`query_id=17`) and a Statistics Card widget for it on test-project's dashboard — Admin saw 1209 (matching test-project's own total, not a true instance-wide figure), Summer Rain saw 1 (her own restricted scope), while the *same query* opened directly via `/issues?query_id=17` showed her 5 (including issues from an unrelated "Helpdesk Service Desk" project). **PASS with a genuine architectural finding**: dashboard widgets implicitly scope even a cross-project saved query down to the current project only, and within that scope still correctly respect per-viewer issue visibility — a real positive, distinct from `BUG-DSH-013`. `TC-DSH-165` (grouping selector excludes role-hidden/project-inapplicable fields): created two fresh probe custom fields to test this and neither ever appeared in the Group-by selector, for any user, even after matching an already-working field's config exactly — root-caused to the selector being a **fixed set of exactly 2 hardcoded fields**, not dynamically derived from live custom-field config at all. PASS on the security question (nothing new can leak this way) though the TC's own mechanism can't be exercised as written; documented as a new `DASHBOARDS_MEMORY.md` entry. Also found and fixed a **stale blanket "TC-DSH-101–107 NOT EXECUTED" note** in `PERMISSIONS.md` left over from an earlier pass — 102/103/104/106/107 were actually already done; only `TC-DSH-101` needed fresh work. Executed `TC-DSH-101` (anonymous access to a public project): confirmed `test-project` is genuinely public with Anonymous granted `view_issues`, but a cookie-free request to even the plain issues list redirects to `/login` — traced to `Administration → Settings → Authentication → login_required = Yes`, a single instance-wide switch gating everything before any project-level permission is evaluated (same root cause as the already-documented `TC-DSH-100`). N/A on this instance's current config, not a plugin defect; deliberately not toggled off since it's shared with other plugins' QA. Attempted `TC-DSH-123` (token survival after the sharer loses access): generated a fresh token as Daisy Skye, confirmed it works, then attempted to remove her test-project membership as Admin to retry it — **blocked by this session's own auto-mode safety classifier** ("Modify Shared Resources"), correctly so, since that membership is an active fixture for other TCs in this suite. Did not work around the block; documented as partially-attempted, recommended for a future session with explicit approval. `DASHBOARDS_MEMORY.md` also corrected: the "400+/450+ widgets" figure in several earlier entries was a duplicate-DOM-node counting artifact — the real count is ~53 unique widgets; added notes on the new-widget-needs-reload-before-Chart.js-instance-exists quirk and a stacked-Bar-chart devicePixelRatio scaling mismatch (`TC-DSH-138`, inconclusive). **No new bugs filed this pass** — both major investigations (142, 165) resolved in the plugin's favor. `SAVED_QUERIES_AND_DRILLDOWN.md` is now fully addressed (every TC executed or deliberately deferred with a specific reason); remaining deferred items across the full plugin: `TC-DSH-105` and `TC-DSH-106`'s archived-project half (concurrent-session/disposable-project needs), `TC-DSH-122`/`123`/`126` in `PUBLIC_SHARING.md` (disposable-project, approved-membership-removal, and load-testing-tooling needs respectively), and the full `INSTALLATION_AND_ACCESS.md` suite (destructive/shared-instance actions, documented from an earlier session). `bugs/open/` unchanged at 8; `STATUS.md` stays `In Progress`. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Retest of all 8 open bugs, per explicit user request.** Repeated each bug's exact original repro steps: **7 of
8 confirmed FIXED** — `BUG-DSH-011` (auto-refresh leak: toggled off 4s before a cycle, zero calls fired in a clean
65s window afterward), `BUG-DSH-013` (data-visibility leak: Summer Rain's charts now show her real total of 1,
not the project's 725, confirmed across 4 duplicate "Issues by Status" widget instances plus "Issues by
Assignee"), `BUG-DSH-014` (closed-project widgets: Add Chart trigger no longer reachable on "QA Closed Test
Project"), `BUG-DSH-016` (date-range persistence: `#dateRange` correctly reads back `this_year` after navigating
away and back, underlying data confirmed at 504 not the stale 725), `BUG-DSH-019` (cross-project access: the
private project's dashboard now returns a clean 403 for a non-member, matching every other controller),
`BUG-DSH-020` (self-revocation: a new "Revoke link" button lets the creator revoke their own link — Daisy Skye
revoked hers, the old URL then 404'd), `BUG-DSH-021` (user enumeration: the User Filter now lists exactly
test-project's 7 real members, not the full 20-account instance roster). **`BUG-DSH-018` initially mis-retested
as still-open** (used the header Refresh button, which turned out to be a `location.reload()` that never calls
the per-widget endpoint at all) — the user asked to check the production issue's journal before retesting again;
the developer's note explained this exact mistake and pointed at the auto-refresh cycle instead. Retested
correctly: every widget card now gets an amber border + "Could not refresh — data may be out of date" badge on a
failed auto-refresh, toasts appear, and everything clears cleanly on the next successful cycle — **also FIXED**.
**8 of 8 confirmed fixed.** Added a "Retest — 2026-09-25" section with full evidence to each bug file (`BUG-DSH-018`
additionally has a "Retest correction" section documenting the invalid-method lesson). **Full final-cycle
regression then run per `SENIOR_QA_STANDARDS.md` §27** (triggered since all 8 fixes are about to empty
`bugs/open/`): Chart Widgets (22+ built-in types swept via `Chart.getChart`, all render with sane totals, zero
console errors beyond one pre-existing unrelated 404 for a stale CSS asset); Chart Settings (Settings modal opens
correctly with all 3 sections present — not deep-retested since none of the 8 fixes touch filter/settings
mechanics, low risk); Global Filters/Layout (date-range persistence and auto-refresh already re-verified in depth
as part of the bug retests themselves); Permissions (Summer Rain's scoping fix, cross-project block, and User
Filter fix all re-confirmed; contrast-checked that a legitimate member, Daisy Skye, still gets normal 200 access
and still keeps full Add Chart capability — confirming the `BUG-DSH-019` fix correctly targets non-members only,
not a regression of the intentional "equal capabilities for any member" design); Public Sharing (fresh link
generated and confirmed working publicly — 200, no edit controls in the DOM, read-only exactly as before);
Installation/Access (contrast-checked that Add Chart still works normally on an *active* project, confirming the
`BUG-DSH-014` fix is correctly scoped to closed projects only). **Zero new failures found** — all 8 fixes hold
with no side effects detected elsewhere. `bugs/open/` is about to be emptied pending the user's closure approval;
`STATUS.md` stays `In Progress` until the 8 bugs are actually moved to `bugs/closed/` and production-synced. |
| 2026-09-25 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **Closure, per explicit user
approval ("okay do it").** Synced all 8 production issues to status Done / 100% done via
`redmineflux_core_update_issue`, each with a retest-summary note quoting the specific evidence
(#121272/#121273/#121274/#121283/#121284/#121285/#121286/#121287 for BUG-DSH-011/013/014/016/018/019/020/021
respectively) — verified via a `get_issue` re-read on #121285 (BUG-DSH-019, the Critical) confirming Status=Done,
Done ratio=100%. Moved all 8 local bug files from `bugs/open/` to `bugs/closed/` (`git mv` for the 3 already
tracked — 011/013/014 — plain `mv` + will need `git add` for the 5 untracked ones created earlier this session —
016/018/019/020/021, since `git mv` refuses untracked sources). `bugs/_index.md` updated: all 8 rows changed to
`[FIXED 2026-09-25]`/Closed/`bugs/closed/`, Notes section rewritten to state `bugs/open/` is empty and closed-bug
count is now 15 total. `STATUS.md` updated to **`Complete`** — both CLAUDE.md §10 conditions now met: `bugs/open/`
empty, and the full final-cycle regression from the previous row is on record. This file's Open Bugs Found and
Closed Bugs sections updated accordingly. `bugs/open/` is now empty for this plugin. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP + redmineflux MCP) | **Later
the same day — user asked whether production feature #120914 is completely tested and working correctly.**
Checked the actual production state rather than relying on memory: #120914 itself (Status In QA, 90% done) and
its linked sanity testcase #121093, which **still showed result `[Failed]` with all 14 historical defects linked,
even though every one of them is now Done/closed** — stale, flagged for correction. Also flagged that
`TC-DSH-165`'s same-day PASS verdict rested on an unconfirmed theory ("the grouping selector is a hardcoded set
of exactly 2 fields, not dynamic at all") that had only been tested with 2 probe fields whose exclusion could
equally be explained by role-visibility handling specifically. **User asked for a rigorous re-investigation with
a fresh qualifying field, verifying config/applicability/visibility/multi-user appearance, and to file a bug if
confirmed.** Created a third, cleanly-configured field (`cf_91`, List, `is_filter=true`, `for_all=true`, all
trackers, unrestricted visibility from creation) — **it appeared in the Group by selector immediately for both
Admin and a real Reporter (Daisy Skye)**, disproving the original "hardcoded, not dynamic" theory outright: the
selector does pick up new qualifying fields dynamically in the general case. Directly compared against the
original role-restricted probe field (`cf_89`, roles = Manager/Developer/Reporter/QA Read Only) — **`cf_89`
remains absent for Admin (holds Manager+Developer, both checked roles) and for Daisy Skye (Reporter, also a
checked role)**, proving the real, narrower defect: a role-restricted custom field is excluded from the
selector categorically, without evaluating whether the current viewer's own role actually passes the
restriction. A project-inapplicability negative control (`cf_90`) stayed correctly excluded, isolating the
defect to role-visibility handling specifically — not a general "new fields never appear" problem. No network
request for custom-field data was observed when opening Add Chart, consistent with the option list being baked
into the dashboard page's own initial render rather than fetched per-viewer at modal-open time. **Filed
`BUG-DSH-023` (Medium)** — violates #120914 requirement 2's "only fields visible to the current user... should
be listed," which implies a role-restricted field *should* show for a qualifying viewer, not be blanket-excluded.
Screenshot evidence captured (`screenshots/BUG-DSH-023/`). Corrected `TC-DSH-165`'s verdict in
`DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` from PASS to FAIL with the full corrected narrative, explicitly
noting the earlier claim that a `cf_89` visibility edit had been "reconfigured to any users" was itself found to
not have actually saved (still `visible=0` on re-check) — an inaccuracy in the original write-up, now corrected.
`bugs/_index.md`, `STATUS.md` (reopened `Complete` → `In Progress`), and this file's Open Bugs Found / Next
Session Start Point sections all updated. **Not yet reported to production** — `BUG-DSH-023`'s production report
and #121093's stale-result correction both require their own fresh explicit approval before proceeding. |
| 2026-09-25 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **`BUG-DSH-023` reported to
production, per explicit approval ("now report bug on production").** Created #121311 in `ztflux`, Priority=
Medium(2), Defect Type=Functional, Defect Severity=Medium-severity, Defect priority=Medium, category="Custom
dashboard plugin", assigned to Prashant Chaurasia (410) — same conventions as every other #120914-scoped bug
this session. Linked via `report_defect` to Test Case #121093/Run #577/Test Suite #249/Environment "Window 11 +
Chrome", with notes explaining the other 14 linked defects are now closed and this is the one genuinely open
item. Post-write verification via `get_run_testcases`: `#121093 [Failed] ... defects:[...,121311]` — 15 total,
14 closed + 1 open, accurately reflecting reality (rather than either falsely Passing or staying Failed on stale
grounds). Local bug file, `bugs/_index.md`, and this file's Open Bugs Found / Next Session Start Point sections
updated with the Production Redmine Issue ID. `STATUS.md` remains `In Progress` (1 open bug). |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Broad
drill-down validation across all 22 built-in chart types, per explicit user request** ("don't limit the
investigation to TC-DSH-138's single stacked-bar chart... check the new drill-down feature across the other
chart types/widgets... distinguish supported-and-working / not-supported-by-design / automation-cannot-click").
Real clicks (with tab-count polling to avoid timing false-negatives — one caught and corrected mid-pass) against
each type's first non-zero data point. **Confirmed working (11 configurations)**: `Issues by Status/Priority/
Assignee/Tracker` (issue-based, correctly filtered `/issues`), `Total Spent Hours by Users`/`Total Spent Time by
Issues Tracker`/`Total Spent Time by Issues Status` (time-entry-based, correctly drilled to `/time_entries` not
`/issues`), plus the 4 saved-query chart templates already confirmed earlier this session. Cross-checked
drill-down accuracy (not just "a tab opened"): `Issues by Status`'s "New" segment (196) drilled to a URL that,
opened directly in a fresh session, returned exactly `(1-25/196)` — confirms faithful consistency with the
chart's own applied scope. **Not supported by design (confirmed, not a bug)**: `Project Progress (Gauge)`, per
its already-established intentional non-interactive design. **Automation-limited, marked for manual
verification, not filed as defects**: `Issues by Release`, `Issues by Percentage Done`, `Issues Trend`, `User
Activity`, `Total Spent Hours by Activity`, `Estimated vs Spent Time by User`, `Total Spent Time by Role` (plus
the 3 stacked variants under `TC-DSH-138`) — for all of these, the target element's own `.inRange()` confirmed
geometrically correct coordinates, yet `chart.getActiveElements()` never registered a hit after a real mouse
hover. **Key finding: this correlates with widget position (lower `data-widget-id`, positioned earlier on this
500+-widget page, worked reliably; higher ids didn't), not chart type** — pointing to a page-density automation
artifact rather than a product defect, added to `DASHBOARDS_MEMORY.md`. **One narrower, more suspicious pair
flagged (not confirmed)**: `Total Remaining Time by Assignee`/`Total Remaining Time by Tracker` both showed the
hover correctly registering (`getActiveElements()===1`, ruling out the coordinate artifact for these two) yet
never navigated — the cleanest signal yet of a possible genuine "not implemented" gap, recommended as the
priority item for a real human click next session. `Estimated vs Spent Time by Version` has no non-zero data on
this dashboard, untestable either way. **No new bugs filed this pass** — findings were either confirmed-working,
confirmed-by-design, or correctly held to "needs manual verification" rather than asserted as defects from
automation artifacts. `TC-DSH-145` and `TC-DSH-138` in `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` updated with
the full evidence. `bugs/open/` unchanged at 1 (`BUG-DSH-023`); `STATUS.md` unchanged. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Correction pass, same day — user provided authoritative ground truth on which built-in chart types
actually have drill-down implemented**, overriding the previous row's "automation cannot reliably click"
framing for several of them: `Issues Trend`, `User Activity`, `Estimated vs Spent Time by User`, `Total Spent
Time by Role`, and the 3 stacked-by variants are **intentionally not implemented** (filter-limitation/design
constraints), not automation misses; `Total Spent Hours by Activity`, `Issues by Release`, and
`Issues by Percentage Done` **are** implemented and needed to be tested properly instead. Tested each: `Total
Spent Hours by Activity` confirmed working immediately (drilled to `/time_entries`, exact 1-entry/3-hour match).
`Issues by Release` and `Issues by Percentage Done` both needed **real fixtures built first**: created a new
Target Version ("QA Drilldown Release Test") with 2 assigned issues (#1576/#1577), and separately set those same
2 issues' `done_ratio` to 80%/90% (landing in the previously-empty "76-99%" bucket) — both charts correctly
picked up the new data. Root-caused why the new fixture segments themselves wouldn't click: their bars render at
**0.1–1 canvas-pixel height**, because a large pre-existing outlier category ("No Version"=724, "0%"=715)
dominates the chart's linear Y-axis scale — genuinely unclickable by anyone, not an automation artifact. Clicked
the dominant/tall segments instead to prove the drill-down mechanism itself works: both drilled correctly with
**exact count matches** (`fixed_version_id=!*` → `(1-25/724)`; `done_ratio=0` → `(1-25/715)`). **Drill-down now
confirmed working across 13 distinct chart/query configurations** (up from 11), with zero new automation-vs-
design misclassifications remaining for the types the user explicitly addressed. `DASHBOARDS_MEMORY.md`'s
earlier "position-correlated automation artifact" theory corrected — replaced with the real lesson (check a
segment's own rendered height before concluding anything; several charts have a dominant outlier that squashes
other segments to sub-pixel height). `TC-DSH-145` in `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md` rewritten with
the corrected 3-category classification (implemented-and-tested / intentionally-not-implemented / genuinely-
unresolved). Fixture left in place: Target Version "QA Drilldown Release Test" and issues #1576/#1577 (80%/90%
done), reusable for future `#120914`-area regression. `Total Remaining Time by Assignee`/`Tracker` remain the
one still-open question (hover registers, no navigation — likely also intentionally-not-implemented given the
pattern, but not explicitly confirmed). No new bugs filed. `bugs/open/` unchanged at 1 (`BUG-DSH-023`);
`STATUS.md` unchanged. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **User reported a UI rendering issue via screenshot, same day.** Some duplicate "Issues assigned to me"
Pie-chart widgets in the same dashboard row rendered dramatically oversized — canvas extending well beyond the
card's own width/height, no legend visible (unlike correctly-sized sibling cards showing the same query/template
in the same row, which all display normally with a legend). Attempted live reproduction: fresh page load matched
to the user's approximate ~1900px viewport width, a full resize cycle (1900→1400→1900px), a full-page canvas-
vs-card overflow scan across all 56 currently-rendered widgets (zero found overflowing), and adding a fresh
"Issues assigned to me" Pie widget live via Add Chart without a page reload (rendered correctly within its card
immediately). **None reproduced the issue.** Filed `BUG-DSH-024` (Low) based on the user's direct screenshot
evidence (saved to `screenshots/BUG-DSH-024/`) rather than a confirmed live repro, explicitly noting the
reproduction gap in the bug file itself — consistent with treating direct user-witnessed evidence as legitimate
even when a same-session re-attempt can't trigger it, likely because it's an intermittent responsive-sizing race
condition (many Chart.js instances resizing near-simultaneously on this 500+-widget dashboard) rather than a
deterministic one. `bugs/_index.md`/`STATUS.md` updated. `bugs/open/` now holds 2 bugs (`BUG-DSH-023`,
`BUG-DSH-024`), neither yet reported to production. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **User
clarified `BUG-DSH-024`'s actual symptom with a second, annotated screenshot**, same day — not the oversized-
Pie-chart framing originally filed, but a clear left/right grid-margin asymmetry (red-boxed in the user's
screenshot) with the rightmost card cut off, reproducible from 1280×720 to 1920×1080. **This time it reproduced
cleanly and was root-caused precisely**: `.charts-grid`'s own computed `grid-template-columns` pixel widths sum
to more than the grid container's actual rendered width at every tested breakpoint (1280×720: columns+gaps
1418.5px vs. container 1193px, 225.5px over; 1440×900: ~1588px vs. 1353px, 235px over; 1920×1080: ~1862px vs.
1833px, 29px over). Confirmed the first card's left edge aligns exactly with the grid container's left edge
(0px offset) at every width, so 100% of the overflow manifests on the right edge only — explaining the exact
asymmetry the user's screenshot showed. Verified the parent containers' own CSS padding is symmetric (16px/16px,
20px/20px) at every width — ruling out a CSS rule as the cause; this is specifically the JS-computed column
widths not correctly accounting for available container width. Confirmed visually with fresh screenshots at
1280×720 and 1440×900: the rightmost card's title is cut off mid-word and its Bar chart's "Resolved" bar/legend
is clipped or missing entirely; no page-level horizontal scrollbar exists, so the clipped content isn't
reachable by scrolling. Rewrote `BUG-DSH-024` completely with this confirmed root cause (kept the original
unreproduced screenshot as a secondary, possibly-related data point — a card whose grid track is miscalculated
is a plausible way for its own chart's responsive sizing to also go wrong). Severity raised Low → Medium given
this is now confirmed, reproducible, and genuinely clips inaccessible content at common viewport widths (1280×720
is a very common laptop resolution), not merely cosmetic. `bugs/_index.md` updated. Still not reported to
production. |
| 2026-09-25 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **`BUG-DSH-024` reported to
production, per explicit approval ("now report on production relate to same testcase in same run").** Created
#121318 in `ztflux`, Priority=Medium(2), Defect Type=Functional, Defect Severity=Medium-severity, Defect
priority=Medium, category="Custom dashboard plugin", assigned to Prashant Chaurasia (410) — same conventions as
every other #120914-scoped bug this session. Linked via `report_defect` to Test Case #121093/Run #577/Test Suite
#249/Environment "Window 11 + Chrome", same as `BUG-DSH-023`. Post-write verification via `get_run_testcases`:
`#121093 [Failed] ... defects:[...,121311,121318]` — 16 total, 14 closed + 2 open (`BUG-DSH-023`, `BUG-DSH-024`).
Local bug file, `bugs/_index.md`, and this file's Open Bugs Found section updated with the Production Redmine
Issue ID. `STATUS.md` remains `In Progress` (2 open bugs, both now reported to production). |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP +
redmineflux MCP) | **User asked to restart the Docker container and retest `BUG-DSH-023`.** Ran
`docker restart redmine-docker-700-redmine-1`; confirmed a clean boot via `docker logs` (Puma started cleanly,
no errors) and polled `http://localhost:3010/login` until it returned 200 (~72s). Retested `BUG-DSH-023`'s exact
original repro: the Group by selector now includes the role-restricted field `cf_89`. Verified this is a genuine
fix, not just unconditional visibility, with a 3-way per-role comparison — Admin (qualifying role) sees it,
Daisy Skye/Reporter (qualifying role) sees it, **Summer Rain/QA Own Visibility (not a qualifying role) correctly
still does not see it** — the decisive check, since a naive "just unhide it" fix would have made it visible to
her too. The negative control (`cf_90`, project-inapplicable) remained correctly excluded for everyone. **Confirmed
FIXED.** Added a `DASHBOARDS_MEMORY.md` lesson: always include a should-still-be-excluded check when retesting a
role/visibility bug, not just a should-now-be-included check. **User approved closing it**: synced production
#121311 to Done/100%, moved `bugs/open/BUG-DSH-023.md` to `bugs/closed/`. `bugs/_index.md` and this file's Open
Bugs Found/Closed Bugs/Next Session Start Point sections updated. `bugs/open/` now holds 1 bug (`BUG-DSH-024`);
Test Case #121093 shows 16 total defects (15 closed, 1 open). `STATUS.md` updated accordingly. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP +
redmineflux MCP) | **User asked to restart the Docker container a second time and retest `BUG-DSH-024`.** Ran
`docker restart redmine-docker-700-redmine-1`; confirmed a clean boot via `docker logs` (no errors) and polled
until the login page returned 200 (~72s). Retested `BUG-DSH-024`'s exact original repro at all 3 original
viewport widths: `.charts-grid`'s computed `grid-template-columns` now sum exactly to the container's own width
at every one — 1280×720 (0px overflow, was 225.5px), 1440×900 (0px, was 235px), 1920×1080 (0px, was 29px).
Columns are now perfectly evenly distributed (e.g. `387px × 3` at 1280×720) where they were previously uneven
and overflowing. Confirmed visually with a fresh screenshot at 1920×1080: all 4 cards render fully within clean,
symmetric margins, no clipping. **Confirmed FIXED.** User approved closing it: synced production #121318 to
Done/100%, moved `bugs/open/BUG-DSH-024.md` to `bugs/closed/`. **`bugs/open/` is now completely empty** —
`bugs/_index.md`, this file's Open Bugs Found/Closed Bugs/Next Session Start Point sections, and `STATUS.md`
updated accordingly. Test Case #121093 now shows all 16 linked defects closed. Per CLAUDE.md §10/§12, `bugs/
open/` being empty does not by itself make the plugin `Complete` — a full final-cycle regression (§27) covering
the two newly-fixed areas (Group by role-visibility handling, dashboard grid responsive column-width
calculation) is still needed and has not yet been run for this closure cycle. |
| 2026-09-25 | 7.0.1.stable | n/a (production write) | Claude (redmineflux MCP) | **Production feature #120914 marked
Done, per explicit user approval** ("now we can closed the feature??" → user selected "Mark production #120914
as Done"). All 16 defects linked to the sanity Test Case #121093 are closed (#121131–#121136, #121272–#121274,
#121283–#121287, #121311, #121318). Updated via `redmineflux_core_update_issue`: status_id=5 (Done),
done_ratio=100, with a summary note listing every closed defect and recapping the broad drill-down validation
(13 confirmed-working configurations, correct time-entry-vs-issue targeting, 2 fixtures built to test Issues by
Release/Percentage Done properly) and the intentionally-not-implemented chart types (confirmed by the user
directly). Post-write verification via `get_issue`: Status=Done, Done ratio=100%. **Two loose threads flagged to
the user before this write, not yet resolved, deliberately left open for a future session**: (1) local
`STATUS.md` still needs the full final-cycle regression (§27) before it can return to `Complete` — not run yet
for the `BUG-DSH-023`/`024` fix areas; (2) `TC-DSH-138` (stacked-chart drill-down) remains INCONCLUSIVE — the
user's "not implemented by design" confirmation covered the 3 stacked-by variants in general terms, but final
confirmation that this specific TC falls under that same list, rather than being a genuine automation gap, was
not explicitly obtained. User chose to proceed with only the production closure this turn, not the other two. |
| 2026-09-25 | 7.0.1.stable | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Full
final-cycle regression per `SENIOR_QA_STANDARDS.md`/CLAUDE.md §27, per explicit user request**, triggered by
`bugs/open/` emptying again after `BUG-DSH-023`/`024` were fixed. Confirmed `bugs/open/` empty (step 1); no
`automation/tests/` suite exists for this plugin (step 2, N/A); manually re-verified representative coverage
across every suite (step 3), leaning on the extensive fresh evidence already generated earlier this same day
where applicable rather than blindly re-clicking everything already just confirmed:
**Chart Widgets** — swept all 50 currently-rendered unique widgets via `Chart.getChart`, every one has a sane
numeric total, zero new console errors (only the pre-existing unrelated CSS-asset 404 already on record).
**Chart Settings** — Issue Status Filter apply/clear tested live on "Issues by Priority" (728→128→reverted to
728), chart rendered correctly after Save Settings with no "No Data Available" break (`BUG-DSH-005`'s fix still
holds). **Global Filters/Layout** — date-range persistence re-confirmed across navigation (`last_7_days`
survived a full nav-away-and-back, `BUG-DSH-016`'s fix holds); auto-refresh toggle OFF→ON→OFF confirmed working.
Also re-confirmed `BUG-DSH-024`'s grid-overflow fix at a **fourth, previously-untested viewport width (1600px)**
— still 0px overflow — and confirmed structurally why the fix applies dashboard-wide: there is only **one**
shared `.charts-grid` container for the entire dashboard (not one per row), so every row automatically reuses
the same corrected column tracks. **Saved Queries/Drilldown** — re-confirmed `BUG-DSH-023`'s fix holds post-
second-restart with the same 3-way per-role selector check; also confirmed the previously-working custom-field-
grouped widgets (boolean `cf_71` Yes/No/Not set, single-select `cf_68` by priority values, standard Status
grouping) all still render correctly — no regression introduced by the Group-by fix. **Permissions** — Summer
Rain's "Issues by Status" widget correctly shows her real scope (1), not the full total (`BUG-DSH-013`'s fix
holds); her direct request to "QA Private Project"'s dashboard still correctly returns 403 (`BUG-DSH-019`'s fix
holds). **Public Sharing** — generated a fresh share link, verified it renders publicly (200, real widgets) in a
clean unauthenticated browser context. **Installation/Access** — Add Chart still correctly absent on "QA Closed
Test Project" (`BUG-DSH-014`'s fix holds). **Additional spot-check**: `BUG-DSH-018`'s failed-refresh handling
re-confirmed (10 cards correctly marked stale with the amber border/badge on a blocked refresh cycle, cleared
after unblocking). **German Language** — not re-executed; already closed in an earlier cycle and unrelated to
any fix from this cycle, consistent with established precedent for this suite. **Zero new failures across every
suite checked.** Both newly-fixed areas confirmed to have no side effects elsewhere, and every previously-fixed
bug's fix (011/013/014/016/018/019/020/021, plus 023/024) still holds after both container restarts. Added a
Run History row per step 5. `STATUS.md` updated to **`Complete`** per CLAUDE.md §10 — both conditions now met:
`bugs/open/` empty, and this passed final-cycle regression is on record. |
