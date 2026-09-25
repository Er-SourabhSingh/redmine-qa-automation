# Plugin Memory — Redmineflux Dashboards

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- "Diagramm kopieren" (Copy Chart) copies chart config to the clipboard, it does NOT create a duplicate chart card on the dashboard — no cleanup needed after clicking it.
- The "Chart Information" (ℹ) icon's popover did not open via either `browser_click` or a scripted `page.mouse.move` hover in one session (2026-09-09) — may need a slower/staged real hover sequence or a different trigger than assumed. Not a confirmed plugin bug, just a testing-tool limitation observed once.
- The "Add" chart is a genuinely separate action from "Diagramm hinzufügen" (dashboard-level) vs the modal's own primary button (was "Add"/now "Hinzufügen") — don't confuse the two when checking translation coverage.
- **`BUG-DSH-002` and `BUG-DSH-004` were retested 2026-09-23 immediately after a plugin migration (`rake redmine:plugins:migrate`) + full server restart — both still reproduce exactly as before.** Ruled out "pending migration" as the cause for either; these are genuine code gaps, not schema/data issues a migration would fix. Don't assume a migration+restart is a valid retest step for either — needs an actual code change.
- **`BUG-DSH-008` (filed 2026-09-23, High): a custom field must have Redmine core's "Used as a filter" checkbox enabled, or a #120914 grouping-selector drill-down for that field silently returns the query's FULL unfiltered result set instead of the segment's subset** — Redmine's own issue-list route drops a filter param for a non-filterable custom field without any error, and nothing in the plugin's UI (chart, drill-down URL, or result page) indicates this happened; the chart and URL both look completely correct, only the final count is wrong. Confirmed on two separate fields: `cf_68` ("QA Single Select Field") drilled into a "Not set" segment of 139 issues but returned 141 (the whole query) until "Used as a filter" was enabled; `cf_71` ("QA Boolean Field", left deliberately unfixed as the `BUG-DSH-008` repro) shows the identical 139-vs-141 mismatch. **Initially only tracked here as a testing-fixture precondition to fix before trusting a drill-down count — the user correctly reframed this as a real product bug** (a silent wrong-data failure mode, not a test-setup detail) and it's now filed. Still true as practical advice: enable "Used as a filter" on any custom field used as a *test fixture* if you need a working drill-down count for a different test — but don't silently work around it without also recognizing the underlying behavior as a bug in its own right.
- The grouping-dimension selector ("Group by:") lists project custom fields whose `format` is `list` or `bool`, but does **not** exclude a `list`-format field that also has **Multiple values** enabled (a true multi-select) — see `BUG-DSH-004`. Don't assume every field the selector offers is actually in scope per #120914; check the field's own Multiple-values setting in Administration → Custom fields before treating it as a valid list-type grouping fixture.
- **`BUG-DSH-002`'s real scope is narrower than first thought — it's about `group_by` field TYPE, not chart template.** A chart-template (Doughnut/Pie/Bar/Line) widget grouped by a **standard** field (Status, Priority, Tracker, Assignee, Target version, Author) correctly gets a full Settings panel with General → Legend Position → Show Data Labels. Only a widget grouped by a **custom field** (`cf_NN`) is missing that whole General section. Always compare a custom-field-grouped widget against a standard-field-grouped one side by side before concluding an appearance-settings gap is chart-template-wide — the panel content is conditional on the grouping field's type, not on the chart style.
- **Never trust the visible state of the Settings panel as proof of what a save actually does — always inspect the `PATCH .../widgets/:id/settings` request/response bodies.** Two dead-control findings only surfaced this way: (1) the "Legend Position"/"top border color" values sent in the request body don't match the widget's own current state (looks like a generic/default form snapshot, not this widget's real values); (2) the "Issue Status Filter" dropdown in Data Filters visibly changes on selection but is never included in the save request at all — the server's stored `issue_status_filter` never changes no matter what you pick in the UI. See `BUG-DSH-005`.
- **Clicking "Save Settings" on any chart-template (Doughnut/Pie/Bar/Line) saved-query widget breaks its live chart body to "No Data Available" immediately, even with zero changes made** — confirmed on both a custom-field-grouped Doughnut and a standard-field-grouped Bar widget. The server's own PATCH response carries fully correct `chart_data`, so this is a pure client-side re-render bug, not data loss — a plain page reload restores it every time. When testing anything that involves opening a chart-template widget's Settings panel, **never click Save Settings and assume the chart still looks right without checking** — the previous sanity pass (earlier the same day) only ever clicked Cancel, which is why this wasn't caught until the user specifically asked about it. See `BUG-DSH-005`.
- Editing an issue's multi-select custom field value via the standard `/issues/:id/edit` form did **not** persist on this instance (`redmine-docker-700`, localhost:3010) — reproduced twice with `cf_67` ("QA Multi Select Field"): selected 2 values, submitted, reloaded the edit form, selection was empty both times. Looked unrelated to this plugin (possibly Redmine core or an interaction with `redmineflux_inline_editor`, which has its own open display bugs on this instance) — not filed under `DSH`, but blocks fully verifying multi-select grouping's per-value bucketing behavior. Worth a fresh look in a future session, ideally starting from `redmineflux_inline_editor_qa`'s own docs.
- A saved-query chart-template widget's create-response embeds a fully pre-computed `drilldown` object (`field`, `query_filters`, `filter_values`) — reading the `POST .../widgets` response body via `browser_network_request` is a fast, reliable way to verify segment order/colour/drilldown-filter-shape server-side, without needing to click through the actual chart segments pixel-by-pixel (though a real click is still needed to confirm the client-side wiring — see `Chart.getChart(canvas)` technique below).
- To click a specific Chart.js doughnut/pie segment precisely (e.g. to test drill-down or hover-cursor), `Chart.getChart(canvas)` (Chart.js v3+ global registry) + `chart.getDatasetMeta(0).data[i]` gives each arc's exact `x`/`y`/`innerRadius`/`outerRadius`/`startAngle`/`endAngle` — compute the arc's mid-angle point and dispatch synthetic `mousemove`/`mousedown`/`mouseup`/`click` `MouseEvent`s there. A guessed pixel coordinate (e.g. "somewhere in the lower half of the canvas") is unreliable — it can land on the legend instead of the arc, which also shows a pointer cursor but does something different (toggles segment visibility) on click.
- Drill-down opens in a **new browser tab**, not same-page navigation and not an in-page panel — check `browser_tabs(action: "list")` after a segment click, not just the current page's URL/network log.
- **The user's own design spec for a saved-query widget's Settings panel (2026-09-23), useful as the reference baseline for any future #120914-related work**: **Display as** (template picker, changeable after creation) → **Group by** (updates to match Display as, also changeable after creation) → **Chart Color Palette** (shown only for a non-statistics-card template) — and *nothing else*. No separate Data Filters/Issue Status Filter section at all, since the saved query itself already fully determines which issues are shown; a widget-level filter on top of that is a design mistake, not a feature to fix. Confirmed live that Display-as/Group-by editing doesn't exist post-creation at all (`BUG-DSH-006`) and that Data Filters is present but should be removed (`BUG-DSH-005`, reframed same session).
- **Bar and Line chart-template widgets show the query's own name in the legend instead of the grouped category label — Doughnut and Pie are correct.** Read `Chart.getChart(canvas).legend.legendItems` (the actual rendered legend, not just `chart.data`) to check this reliably: for Doughnut/Pie it lists each category (`["Closed"]`, `["Not set"]`, etc.); for Bar/Line it's always a single entry equal to `chart.data.datasets[0].label` (the query name), regardless of how many real categories/bars exist. Confirmed independent of standard- vs custom-field grouping. Purely cosmetic — drill-down works correctly regardless (see `BUG-DSH-007`).
- **To click a Bar-chart element precisely** (extending the Doughnut/Pie `Chart.getDatasetMeta` technique above): `meta.data[i]` for a bar gives `.x`, `.y` (top of the bar) and `.base` (the axis baseline) — click at `x = rect.left + bar.x`, `y = rect.top + (bar.y + bar.base) / 2` to land in the middle of the bar's visible area, not at its very top edge. For a **Line** chart, `meta.data[i].x`/`.y` is already the plotted point's centre — click there directly, no offset needed.
- **`canvas.getBoundingClientRect()` goes stale fast when other cards on the dashboard are being added/removed/closed in tabs around it — always re-fetch the rect (and recompute the arc/bar/point position from it) immediately before every click, in the same `browser_evaluate` call.** A rect fetched even one tool-call earlier can be off by hundreds of pixels once the page reflows (confirmed: a Pie chart's canvas top shifted from y=91 to y=391 between two `browser_evaluate` calls a few seconds apart with no reload). A "drill-down doesn't work on chart type X" finding based on a stale rect is a false negative — always confirm with fresh coordinates computed and used in the same call before concluding a chart type's click handler is actually broken.
- **Pointer-cursor-on-hover testing via synthetic `mousemove` dispatch is unreliable across repeated checks — don't file a bug from cursor state alone.** Checking Doughnut/Pie/Bar/Line cursor state in the same session gave contradictory results run to run (e.g. Doughnut read "pointer" once and "default" another time, with no code change in between) — likely because Chart.js's hover-plugin cursor logic depends on synthetic-event ordering/prior-position state in ways a real mouse doesn't hit. **Drill-down itself (the actual click firing and opening the right filtered list) is the reliable signal** — confirmed working correctly on all 4 chart templates (Doughnut/Pie/Bar/Line) with exact count matches every time. If cursor-per-type needs verifying specifically, it would need a real (non-synthetic) mouse move via `browser_hover` on a computed target selector, not `dispatchEvent`. **Resolved for `TC-DSH-160` 2026-09-25**: the user performed a genuine manual hover on a live Pie-chart segment and captured a screenshot showing the real system cursor rendered as a pointer/hand icon over the segment — confirms the cursor mechanism does work correctly; the earlier contradictory results were specifically an artifact of synthetic `dispatchEvent`, not a real product inconsistency.
- **All 4 chart templates (Doughnut, Pie, Bar, Line) have working drill-down, confirmed 2026-09-23 with exact count matches on each** — closing a real gap from the original sanity pass, which had only tested Bar (3×) and Doughnut (1×), never Pie or Line. An initial "Pie drill-down doesn't fire" reading turned out to be the stale-rect issue above, not a real defect — always double-check a suspected drill-down miss with freshly-recomputed coordinates before concluding a chart type is broken.

- **All 6 open bugs (`BUG-DSH-002/004/005/006/007/008`) were retested 2026-09-24 on `redmine-docker-700` and confirmed FIXED**, each with concrete verification beyond "control is present": `BUG-DSH-002` — General section (Legend Position, Data Labels, Display as, Group by) now renders for custom-field-grouped widgets, confirmed via accessibility tree. `BUG-DSH-004`/`BUG-DSH-008` — same underlying fix: the Group by selector now requires a custom field to be both non-multi-select AND "Used as a filter"-enabled before it's offered at all, closing off the scenario both bugs depended on; confirmed `cf_67` (multi-select) still excluded even after enabling "Used as a filter" on it, and `cf_71`'s "Not set" drill-down now returns an exact 139/139 match. `BUG-DSH-005` — Save Settings no longer breaks live rendering, accent colour persists, Data Filters section removed entirely. `BUG-DSH-006` — Display as/Group by are editable in Settings; changing Group by to Priority + Save live-updated the chart in place. `BUG-DSH-007` — `chart.legend.legendItems` on a Bar widget now correctly returns category labels instead of the query name. **Key technique note carried forward: raw DOM `select.value` + dispatched `change` event became unreliable on the Add-Chart/Settings form's `<select>` controls on this build — use real Playwright `browser_select_option`/`browser_click` instead when retesting form-based settings; canvas-click drill-down via synthetic `dispatchEvent` continued to work fine, so the issue is specific to `<select>` controls, not chart interaction.**

- **A document-wide DOM query for labels/inputs (`document.querySelectorAll`) can pick up OTHER widgets' hidden Settings-panel nodes, not just the currently-open one — always scope to the actually-visible modal element first.** Mid-regression, `document.querySelectorAll('label')` after opening a saved-query widget's Settings appeared to show "Issue Status Filter"/"Assignee Filter"/etc. alongside General/Appearance, looking like `BUG-DSH-005`'s Data Filters removal had regressed. It hadn't — those labels belonged to a different, hidden DOM node (the "Our Queries" widget type's own legitimate, separate Data Filters feature, `TC-DSH-009–026`, which is unrelated and untouched). Fix: find the visible modal via `Array.from(document.querySelectorAll('[class*="modal"]')).filter(m => getComputedStyle(m).display !== 'none' && m.offsetParent !== null)` and query only within it — or better, check each specific control's own `offsetParent`/`getBoundingClientRect()` rather than trusting `textContent` on an ancestor, since `textContent` includes descendants regardless of their own visibility.
- **Statistics-card widgets (post-#120914) correctly hide Group by/Legend Position/Show Data Labels/Data Filters/Chart Color Palette — only Display as (read-only-ish, shows current type) and Top Accent Color are actually visible**, confirmed via per-control computed-style checks, matching the panel's own banner ("You can only customize the title and border color"). This is intentional, unaffected by the 6 #120914 bug fixes — don't mistake the DOM still *containing* those hidden inputs for a regression.

- **Full final-cycle regression (2026-09-24, triggered by CLAUDE.md §27 when `bugs/open/` went empty) found 6
  candidate bugs the earlier #120914-focused testing never surfaced**, since it covered suites never touched
  before (Chart Widgets, the pre-existing half of Chart Settings, Global Filters/Layout, Permissions, Public
  Sharing). **3 of the 6 were retracted, on two different grounds — a real "true positive rate" lesson for this
  session**: `BUG-DSH-009`/`BUG-DSH-012` were confirmed **intentional design** by the user (product owner) — see
  the "INTENTIONAL DESIGN" entries below. `BUG-DSH-010` was a **false positive from my own testing error**, not a
  design question — the user reported "when i test bug 10 it will not reproduce," and re-investigation found the
  original test had been typing into the wrong DOM element the whole time (`#chartTitleInput`, a hidden
  Settings-panel field, instead of the real create-time field, `#chartTitle` — see the dedicated entry below).
  **Only 3 of the 6 hold up: `BUG-DSH-011`, `013`, `014`.** Most significant: `BUG-DSH-013` — dashboard charts
  show the full unrestricted project issue count to a role restricted to 1 visible issue (a genuine
  data-visibility leak, found by actually logging in as a real restricted seed user — Summer Rain, "QA Own
  Visibility" role — rather than reasoning about permissions abstractly). **Takeaway: a bug that reproduces
  consistently across multiple automated techniques can still be a testing artifact, not a product defect, if
  every technique shares the same wrong assumption (here: the same wrong selector) — always sanity-check a
  suspicious "always fails" result by re-deriving the target element fresh (e.g. `document.querySelectorAll('input')`
  filtered to `offsetParent !== null`) rather than trusting a previously-used id/selector.**
- **`#chartTitleInput` and `#chartTitle` are two different elements that are easy to confuse — always verify which
  one is actually visible before typing.** The real, visible Chart Title field on the "Our Queries" Add Chart tab
  has `id="chartTitle"`. `#chartTitleInput` is a *different*, normally-hidden element (the Settings-panel/
  Saved-Queries-tab title field's id) that happens to exist in the DOM even when the Add Chart modal is what's
  open. Both `document.getElementById('chartTitleInput')` and a Playwright `target: '#chartTitleInput'` will
  happily resolve to this hidden element without erroring in most cases (raw JS evaluate never complains about
  writing to a hidden input; even a real Playwright `fill()` can time out with "element is not visible" if you're
  lucky enough to catch it, but plain `evaluate`-based writes won't). This produced a full, wrongly-confident bug
  report (`BUG-DSH-010`, retracted 2026-09-24) — 6 "reproductions" that were all quietly writing to the wrong
  input and then correctly observing that input's value never made it into the real submission. **Before
  concluding a form field's value "isn't being read," re-derive its live selector from the currently-visible DOM
  (`Array.from(document.querySelectorAll('input')).filter(i => i.offsetParent !== null)`) rather than reusing an
  id from memory or from a previous session — this plugin reuses similar ids across its Add Chart and Settings
  modals.**
- **Drag-and-drop works via genuine `page.mouse` down/move/up, but Playwright's `dragTo()` helper does not** —
  this app's widget-reorder handle (`cursor: move` div with grip SVG) isn't `draggable="true"`, so the native
  HTML5 DnD helper silently no-ops. Real mouse events (with `waitForTimeout` between down/move steps) work
  reliably and the result persists correctly across a reload.
- **Resize (the `.resize-handle-right`/`-bottom`/`-corner` divs) could NOT be triggered via any automation
  technique tried** — real `page.mouse` (multiple speeds/step counts, with/without hover-first or
  scroll-into-view-first), synthetic `MouseEvent`, and synthetic `PointerEvent` all left the card's
  `boundingBox()` completely unchanged, including mid-drag before mouseup. Notable because drag-and-drop worked
  cleanly with the same real-mouse technique on the same page moments earlier — treat as inconclusive (possible
  harness limitation), not a confirmed defect, consistent with the existing Chart Information tooltip caution.
- **The global filter bar has exactly two controls (Tracker, Date Range) — there is no global Issue Status
  filter**, despite `DASHBOARDS_REQUIREMENTS.md` line 15 listing "issue status" as one of the three global filter
  bar dimensions. Confirmed consistently absent across dozens of interactions this session — treat as stale
  documentation, not a bug, and update the requirements doc rather than re-flagging this each session.
- **Saved-query widgets (Add Chart → Saved Queries tab) do not respond to the global filter bar at all** — proven
  with a clean, repeated test: a saved-query widget's data was byte-for-byte identical across Date Range =
  Last 30 days / This Year / Today, and across Tracker = All / Test case, while a sibling built-in "Our Queries"
  widget correctly responded to every one of the same changes in the same test pass. See `BUG-DSH-012`. This is
  architecturally distinct from `BUG-DSH-009` (one specific built-in chart type, the Gauge) — this one affects
  the entire saved-query widget category.
- **A raw `document.querySelectorAll` scoped to `document` (not the visible modal) will pick up OTHER hidden
  widgets' Settings-panel DOM nodes** — this caused a false "Data Filters section is back" alarm mid-session
  before being traced to an unrelated widget's hidden panel. Always scope queries to
  `Array.from(document.querySelectorAll('[class*="modal"]')).find(m => getComputedStyle(m).display !== 'none' &&
  m.offsetParent !== null)` first, or check each specific control's own `offsetParent`/`getBoundingClientRect()`
  rather than trusting `textContent` on an ancestor (which includes descendants regardless of their own
  visibility). See the fuller writeup already in this file from the 2026-09-24 post-fix regression pass.
- **Changing My Account → Language via a scripted `<select>` value-set + dispatched `change` event did NOT
  actually switch the session language** — `document.documentElement.lang` stayed `"en"` and core Redmine nav
  stayed untranslated even after the form was submitted. This form control needs a genuine Playwright
  `browser_select_option` + real form submit, not a raw value-setter, consistent with the pattern already
  documented for the Saved-Query Display-as/Group-by selects. Left the planned #120914-era German i18n spot-check
  (Display as/Group by label translation) unresolved — redo properly next session.
- **A newly-created issue on this instance fails silently unless 4 specific required custom fields are filled**
  (QA Required Text Field, QA Second Required Field, QA Bug-Only Tracker Field, QA Required Readonly Field — the
  last one is editable by Admin despite its name) — the standard `input[name="commit"]` submit just re-renders
  the form with inline errors at the top; a scripted submit that doesn't check for this will silently "succeed"
  (page navigates) while creating nothing. Always verify creation by searching for the new issue afterward, not
  by trusting the redirect alone.

- **CRITICAL — the Analytics Dashboard controller performs no project-access check at all, confirmed 2026-09-24
  (`BUG-DSH-019`).** Any authenticated user can open `/projects/<any-project>/analytics_dashboard` and see real
  chart data, even with **zero membership** on a genuinely private project (Public unchecked, 0 members). Proven
  cleanly: the same user, same session, got a normal dashboard from this plugin's controller while Redmine core's
  own `/issues` controller correctly 403'd her on the identical project moments later — every other controller on
  this instance enforces membership correctly, only this plugin's dashboard route doesn't. **When testing this
  plugin's access control, always cross-check against a Redmine-core route on the same project in the same
  session** — it's the fastest way to prove "genuinely not a member" and isolate a plugin-specific gap from a
  fixture-setup mistake.
- **INTENTIONAL DESIGN — this plugin registers NO Redmine permission of its own, and that is by documented design,
  not a gap (originally misfiled as `BUG-DSH-015`, retracted 2026-09-25).** Every other installed plugin (Helpdesk,
  Invoice, Knowledgebase, Testcase Management, Shift Management, etc.) has its own module/permission section on
  `/roles/<id>/edit`; this one has none at all — confirmed by listing every `<fieldset><legend>` on the page (21
  modules, no "Custom Dashboard"/"Analytics Dashboard" entry). **This was initially treated as an oversight**, and
  a view-only role being able to create/delete/reposition/reconfigure widgets was filed as `BUG-DSH-015` (High).
  Fetching the vendor KB directly (2026-09-25) settled it: *"any user with access to the project can open the
  dashboard"*, with no mention anywhere of granular permissions for add/edit/delete/share — the KB's own words
  describe "equal dashboard capabilities" for any project member as the intended model. Every local doc already
  had this flagged as an open "?" (`DASHBOARDS_REQUIREMENTS.md`'s Permissions Matrix, `FEATURES_LIST.md`,
  `SCOPE.md`) rather than a stated restriction — the bug rested on an unstated assumption about "sensible"
  permission design, not a documented requirement. **Do not re-file this — any project member being able to fully
  manage the shared dashboard's widgets is the intended behavior.** The one narrower, still-open finding in this
  area is `BUG-DSH-020`: the creator of a public share link cannot revoke it themselves (only an Admin can) — that
  half survives because the app's own Share-modal text documents it as a real (if transparent) limitation, unlike
  the widget-CRUD claim which had no such basis. **Lesson: before filing a permission-boundary bug on this plugin,
  check whether the docs actually state a restriction should exist — "Redmine plugins conventionally restrict this
  kind of action" is not itself a requirement for this specific plugin, which explicitly documents an unusually
  flat, no-role-distinction model.**
- **This dashboard's shared "test project" has accumulated 450+ widgets from months of fixture creation across
  many sessions/plugins — this materially affects testing technique, not just page load time.** Multiple
  same-titled duplicate widgets (e.g. 3+ "Issues by Status" cards) exist simultaneously; a title-text-based DOM
  match (`document.querySelectorAll('*').find(el => el.textContent === 'Issues by Status')`) can silently resolve
  to the WRONG instance of a repeated widget name, producing a false result (caught 2026-09-24: TC-DSH-001's
  Legend Position appeared "stuck" because the verification query kept reading a different sibling widget's
  Chart.js instance than the one being edited). **Always anchor to a widget's own unique `data-widget-id`
  attribute** (set a temporary `data-qa-marker` attribute on first location if needed, or just capture and reuse
  the numeric id) rather than matching by title text, for any check spanning more than one tool call. The
  dashboard's `scrollY` on a newly-added widget's "scroll into view" behavior can also land measurably short of
  the target on a page this long (TC-DSH-179) — don't conclude a scroll-precision defect from this page's numbers
  without a sanity check on a normal-sized dashboard first.
- **A private saved query's dashboard widget correctly respects the query's own visibility — confirmed working,
  2026-09-24 (`TC-DSH-103`), a genuine positive amid several permission-model defects found the same session.**
  Created a private ("only me") query as Admin, added it as a widget on the shared project dashboard — a
  different real member (not the owner) got neither the widget in her Add-Chart dropdown, nor any trace of it in
  the DOM of the same shared dashboard she otherwise has full view of. This is a real, working access boundary,
  unlike the project-membership gap above — don't assume every access-control surface on this plugin is broken
  just because several are; check each one on its own evidence.

- **INTENTIONAL DESIGN (by consistency) — a restricted-visibility user's own public share link shows the same
  unscoped, project-wide data as everywhere else in this plugin, not the sharer's own visible scope (originally
  misfiled as `BUG-DSH-022`, retracted 2026-09-25).** Summer Rain (sees 1 issue everywhere else) generated a share
  link that showed the full 1209-issue project total to an unauthenticated visitor. The underlying mechanism is
  the same one `BUG-DSH-013` already documents (chart data isn't scoped to the viewer's issue-visibility
  permission) — **`BUG-DSH-013` remains open as its own finding**, but the *public-sharing-specific* angle of it
  was retracted rather than double-filed: since this plugin already shows project-wide data regardless of viewer
  everywhere else (confirmed, not disputed, this session), it would be inconsistent for public sharing alone to
  suddenly apply a *different*, narrower scoping rule. The vendor KB doesn't state either way what the public
  link's data scope should be, so this rests on an architectural-consistency argument, confirmed acceptable by the
  user (product owner) 2026-09-25, not a KB citation the way the Gauge/saved-query retractions had. **Do not
  re-file the "public link isn't sharer-scoped" framing** — if this data-scoping behavior is ever fixed, it should
  be fixed once at its root (`BUG-DSH-013`), which would then apply to sharing too, rather than treating sharing as
  a separate defect.
- **The public token namespace (`/public/analytics_dashboard/:token`) has no write routes mounted at all — probed
  create/delete/settings/regenerate widget endpoints under it, all 404, not 403/401.** A non-existent route is at
  least as safe as an explicitly-refused one; this is a genuinely well-built boundary, unlike the rest of the
  plugin's permission story. Similarly, drill-down has no route under `/public/` either (also 404) and a segment
  click on the public view fires no navigation at all.

- **False positive from a testing error (not a design question) — global Custom Date Range validation DOES show
  a toast error, originally misfiled as `BUG-DSH-017`, retracted 2026-09-25.** Setting an invalid range
  (end before start) and clicking Apply Filters was checked for an error message via
  `document.querySelectorAll('[class*="toast"],[class*="error"],[class*="alert"]')` both immediately after the
  click and after a 1.2s wait — found nothing either time, so it was filed as "silently rejected with no error."
  Re-tested with a `MutationObserver` attached to `document.body` **before** the triggering click (the same
  technique already on record in this file for other toasts, e.g. the "Chart copied to clipboard" toast in the
  German-language pass) — it caught a `toast-notification toast-error` div, "End date cannot be earlier than start
  date," that had already been added and removed from the DOM before either of the static checks ran. **A static
  DOM query — even one repeated at two different delays — can still miss a toast if its full show-then-auto-
  dismiss lifecycle is shorter than the gap between checks. Always use a `MutationObserver` attached before the
  triggering action for any "is there an error message" check on this plugin, never a post-hoc query.**

- **Correction: this dashboard has ~53 unique widgets (IDs 75–141 as of 2026-09-25), not "400+"/"450+" as stated
  in several earlier entries in this file.** The inflated count was an artifact of
  `document.querySelectorAll('[data-widget-id="X"]')` matching multiple duplicate DOM nodes per single logical
  widget (confirmed: widget 120 alone matched 9 DOM elements for one real widget). The "anchor to `data-widget-id`,
  not title text" guidance above is still correct and unaffected — just don't cite the widget *count* itself as
  evidence of scale; use `[...new Set(...)]` on the id list if you need an actual unique count.
- **A newly `POST`ed widget has no live Chart.js instance until a full page reload** — `Chart.getChart('chart<id>')`
  returns `undefined` immediately after an AJAX widget-add even though the canvas element exists in the DOM and
  other widgets' `Chart.instances` entries are fine. Always do a full `browser_navigate` reload after adding a
  widget, before attempting any `Chart.getChart`/segment-click interaction with it.
- **A stacked multi-dataset Bar chart (e.g. widget 99, "Issues by Assignee (Stacked by Status)") can have a
  devicePixelRatio scaling mismatch between `canvas.width` (drawing buffer) and
  `canvas.getBoundingClientRect().width` (CSS/viewport) — observed ~914 vs ~609, a ~0.667 ratio — that a
  non-stacked Doughnut chart on the same page did not show.** Four click techniques (raw `page.mouse` with
  unscaled coords, DPR-corrected coords, synthetic `MouseEvent` dispatch on the canvas, Playwright
  `locator.click({position})`) all failed to trigger drill-down on this chart's one non-zero segment. Root cause
  not confirmed — recorded as INCONCLUSIVE (`TC-DSH-138`), same category as the resize-handle and Chart
  Information tooltip cautions above, not a filed bug. Worth a real (non-synthetic) mouse click in a future
  session before ruling this in or out.
- **The "Group by" selector (both the Settings panel and Add Chart → Saved Queries) is NOT dynamically derived
  from live custom-field configuration at all — it's a fixed set of exactly two pre-existing custom fields
  (`QA Boolean Field`, `QA Single Select Field`), confirmed 2026-09-25.** Created two fresh probe fields
  (`QA Role-Hidden Grouping Field`, `QA Other-Project-Only Field`) with `is_filter=true`, List format, enabled for
  test-project and all trackers — neither ever appeared in the selector, for any user including Admin, even after
  reconfiguring one to byte-for-byte match `QA Single Select Field`'s own config (`for_all=true`,
  `visible=to any users`). This means no *new* custom field — restricted or not — can ever reach the grouping
  selector on this build, which is why `TC-DSH-165` (role-hidden/project-inapplicable field exclusion) couldn't be
  exercised as designed: there's nothing dynamic to test. Favorable side effect: nothing can leak this way either.
  If a future session adds a genuinely new grouping-selector custom field and it start appearing, this note is
  stale and the selector logic has changed — re-verify before relying on this.
- **This instance has `Administration → Settings → Authentication → Authentication required` = Yes
  (`login_required`), confirmed 2026-09-25** — a single global switch that redirects every unauthenticated request
  to `/login` before any project- or role-level permission (including a genuinely public project's own Anonymous
  role permissions) is ever evaluated. This is why `TC-DSH-100`/`TC-DSH-101` both find "anonymous access" fully
  gated regardless of the target project's own public/anonymous config — it's an instance-wide setting, not
  something either TC's target project misconfigures. It's shared with every other plugin's QA on this instance,
  so don't toggle it off for a single TC; a genuine anonymous-access test needs a dedicated instance or an
  explicit, approved, temporary toggle-and-restore.
- **This session's own auto-mode safety classifier blocked a real membership-removal click
  (`DELETE /memberships/31`, removing Daisy Skye's Reporter role from test-project) as "Modify Shared Resources,"
  2026-09-25** — correctly so: that membership is an active fixture other TCs in this same suite depend on
  (`TC-DSH-104`, `TC-DSH-124`). `TC-DSH-123` (token survival after the sharer loses access) needs this exact
  action; it's real, doable QA work, not something to route around the classifier for — get explicit user
  approval in a future session before attempting it again, same as any other destructive/shared-state action this
  file already cautions about (archiving a project, deleting a shared version/query).

- **The dashboard header's "Refresh" button is a full `location.reload()` — it never calls
  `.../widgets/:id/refresh` at all.** Confirmed 2026-09-25 via the production issue #121284 developer's own note,
  after an initial retest of `BUG-DSH-018` (failed refresh leaves stale data with no error) wrongly concluded
  "still open": blocking the per-widget refresh endpoint and clicking the header button changes nothing, because
  that button never exercises the endpoint in the first place — the page just reloads and re-renders server-side
  with genuinely current data. **The only client-side path that calls the per-widget endpoint is the auto-refresh
  cycle.** Any future test of refresh-failure/error-handling behavior on this plugin must use auto-refresh (enable
  it, block the endpoint, wait a cycle), not the header button — the two are not interchangeable despite both
  being labeled "refresh" in the UI.

- **Correction: the "Group by" selector IS dynamically derived from live custom-field configuration — the earlier
  claim that it's "a fixed set of exactly 2 hardcoded fields" was wrong.** A fresh, cleanly-configured unrestricted
  custom field (`cf_91`) appeared in the selector immediately for multiple users, proving the mechanism is
  genuinely dynamic in the general case. **The real, narrower defect (`BUG-DSH-023`) is specifically in
  role-visibility handling**: a custom field with `visible=0` (role-restricted) is excluded from the selector
  categorically, regardless of whether the current viewer's own role is actually in the field's allowed-roles
  list — confirmed by testing both Admin (holds 2 of the field's 4 checked roles) and a real Reporter (holds
  another of the checked roles), neither of whom could see it. A project-inapplicability control field stays
  correctly excluded, isolating the defect to role-visibility specifically, not project-scoping. **Lesson: when
  only 2 probe fields fail identically, don't generalize to "nothing works" — test a clean, single-variable
  control (here: an otherwise-identical but unrestricted field) before concluding the mechanism itself is broken.**
  Also caught mid-investigation: an earlier claim that `cf_89` had been "reconfigured to `visible=to any users`"
  during the original probe was itself inaccurate — the edit never actually saved (confirmed `visible=0` on
  re-check), likely from the same wrong-form-submit issue documented elsewhere in this file. Always re-verify a
  field's actual saved state via a fresh page load before trusting a remembered "I already changed this."
- **`BUG-DSH-023` (the role-visibility grouping defect above) confirmed FIXED 2026-09-25, after a container
  restart** (`docker restart redmine-docker-700-redmine-1`, per explicit user request) — worth remembering that
  a fix landing in the app's source doesn't take effect on this instance until the container restarts, same as
  the "server restart needed after any JS/CSS change" note in #120914's own delivery notes. Retested with a
  3-way per-role comparison (Admin/Daisy Skye who both qualify vs. Summer Rain who doesn't) rather than just
  re-checking Admin alone — Summer Rain's continued exclusion is what proves the fix evaluates the viewer's
  actual role rather than just unconditionally un-hiding the field for everyone. **When retesting any "field/
  option visible to role X but not role Y" bug, always include a check as a user who should still be excluded,
  not just a check as a user who should now be included** — a fix that just makes something visible to
  everyone would otherwise look identical to a correct fix if only the "should see it" side is checked.

- **A Chart.js `BarElement`'s own `.inRange(canvasX, canvasY, true)` method is the most reliable way to confirm a
  computed target point is geometrically correct — use it before assuming a click-automation failure is a real
  drill-down bug.** During a deeper `TC-DSH-138` (stacked Bar drill-down) re-investigation, `inRange()` confirmed
  the target point genuinely was inside the intended bar segment, ruling out a coordinate-math error on the
  rendering side. The actual failure was isolated one layer down: `Chart.helpers.getRelativePosition(event,
  chart)`, called with a real synthetic `MouseEvent`, returned a value essentially unchanged from the raw
  `clientX`/`clientY` input — not offset by `canvas.getBoundingClientRect()` at all — so every hit-test built on
  it (including the app's own real `{mode:'nearest', intersect:true}` interaction config, checked via both
  `chart.getElementsAtEventForMode` and the chart's own `getActiveElements()` after a real Playwright mouse move)
  consistently missed, even across a 40×200px grid search. `chart.resize()`/`chart.update('none')` (to rule out a
  stale cached offset from scrolling) made no difference. **This looks like an automation-environment-specific
  coordinate-translation quirk in this dashboard's Chart.js wrapper, confirmed not to be a rendering/data defect**
  — but still couldn't be resolved by scripting; a genuine human click remains the only way to get a PASS/FAIL
  verdict on this specific TC (same pattern as `TC-DSH-160`, resolved via a real manual hover after synthetic
  events gave contradictory results).

- **CORRECTED 2026-09-25 — the earlier "position-correlated automation artifact" theory below was wrong.** A
  same-day broad sweep of drill-down across all 22 built-in chart types initially found several chart types
  failing to click and (incorrectly) attributed this to widget position/page density. The user then provided
  authoritative ground truth: several of those types (`Issues Trend`, `User Activity`, `Estimated vs Spent Time
  by User`, `Total Spent Time by Role`, the 3 stacked-by variants) **intentionally have no drill-down at all**,
  by design (filter limitations on those chart shapes) — not an automation miss. Two others
  (`Issues by Release`, `Issues by Percentage Done`) **do** have drill-down implemented, confirmed by building
  real fixtures: a new Target Version with 2 assigned issues, and 2 issues with distinct `done_ratio` values.
  Both charts correctly picked up the new data and, when clicking a *large* segment (not the tiny new fixture
  segment), drilled down with exact count matches. **The real lesson: when a chart click doesn't register,
  check the target segment's own rendered `height` (via `chart.getDatasetMeta(i).data[idx].height`) before
  concluding anything about automation or the product** — several of these charts have one dominant outlier
  category (e.g. "No Version"=724, "0%"=715) that squashes every other segment's Y-axis height to a fraction of
  a canvas pixel (0.1–1px observed), making them effectively unclickable by *anyone*, human or automated,
  regardless of whether drill-down is implemented for that segment. Always click/verify on the *tallest* segment
  first to test the mechanism, then treat a tiny fixture segment's own unclickability as a separate rendering
  observation, not a drill-down failure.
- **`Total Remaining Time by Assignee`/`Total Remaining Time by Tracker` remain the one open question** not
  covered by the user's ground-truth list — a real hover correctly registered internally
  (`getActiveElements().length === 1`) yet neither navigated. Most likely also intentionally-not-implemented
  (same family as the confirmed "remaining"/"estimated" derived-metric charts), but not explicitly confirmed —
  flagged for a real human click if a definitive answer is ever needed, not filed as a bug.

## Confirmed Working

- As of 2026-09-09 (Forge `flux-fdrk6suoj49`), `BUG-DSH-001` — this plugin's only bug, originally covering a near-total absence of German i18n across almost the entire UI — is fully fixed and closed. A final-cycle regression across all 5 TCs passed with zero new failures.
- The public Share Link view (`/public/analytics_dashboard/<token>`) mirrors live dashboard state faithfully and is a genuinely separate i18n surface from the authenticated view — always check both when retesting a dashboard-plugin translation bug, not just the one the user mentions.
- **2026-09-23, production issue #120914 sanity pass** (`redmine-docker-700`, localhost:3010) — confirmed working correctly: template selector default (Statistics card) and options (Doughnut/Pie/Bar/Line); grouping by Status and by a list custom field with counts matching the issue list exactly; "Not set" segment using Redmine's `none` (`!*`) operator, not an empty value; drill-down expanding the saved query's own filters while excluding the grouped-on field (no double-filter validation error, even when the query already filters on the grouped field); pointer cursor on hoverable chart segments; colour-name auto-matching (a "Green" field value rendered in actual green, `#2F9E44`, with no palette configured); a new chart always appended to the end of the layout (confirmed 3× in a row) with no full page reload; the pre-existing statistics-card widget and its Settings panel (Accent Color only, no palette/legend/labels) both completely unchanged. Time-entry queries: the visible "Display as" selector is correctly hidden once a time-entry query is chosen (initial concern about this turned out to be a false alarm from testing via direct DOM manipulation rather than the real UI flow — see note above about not guessing pixel coordinates／state, the same caution applies to not scripting past UI elements that would normally gate a choice).

- **INTENTIONAL DESIGN — Project Progress (Gauge) is deliberately an all-time metric, not scoped to the global
  date-range filter.** Confirmed by the user (product owner) 2026-09-24 after this was initially misfiled as
  `BUG-DSH-009` (retracted same day). The Gauge's Closed/Open totals are expected to stay unchanged when the
  dashboard's Date Range filter changes — this is correct, not a bug. **Do not re-file this or attempt to "fix"
  the Gauge to follow the date-range filter.** Every other chart type (built-in and saved-query alike, aside from
  the next point) is still expected to respect the global date-range filter as normal.
- **INTENTIONAL DESIGN — Saved-query widgets (Add Chart → Saved Queries tab) are deliberately governed solely by
  their own saved query's own filters/criteria, not by the dashboard's global filter bar (Date Range or
  Tracker).** Confirmed by the user (product owner) 2026-09-24 after this was initially misfiled as `BUG-DSH-012`
  (retracted same day). A saved-query widget's data staying byte-for-byte identical across every global filter
  state is correct, expected behavior, not a defect — the whole point of a saved-query widget is that it tracks
  its named query's own definition. **Do not re-file this or attempt to make saved-query widgets follow the
  global filter bar.** This is a real, deliberate difference from built-in ("Our Queries") widgets, which do
  still respect the global filter bar as normal — the two widget categories have genuinely different, both-
  correct filtering models, not one bugged and one working.

## Recurring Issues

## Environment Notes

- This plugin's testing has moved across several Forge servers as they've been provisioned/expired: `flux-f6nlrqpvk49` → `flux-f04qohdte49` → `flux-fdrk6suoj49`. Always reconfirm existing (closed) bugs on a new server before assuming they're still fixed there.
- **This plugin is also tested against the shared local Docker instance `redmine-docker-700` (http://localhost:3010, admin/12345678 — same credentials as `QA_CREDENTIALS.md`'s Local Docker entry), used concurrently by several other plugins** (`redmineflux_agile_qa`, `redmineflux_checklist_qa`, `redmineflux_inline_editor_qa`). "test project" on this instance already carries fixtures from that other testing (issue subjects like `TC-CHK-...`, an intentional stored-payload issue #1557 used for a different plugin's XSS testing — leave it alone) — check what's already there before assuming a clean project. Three custom fields useful for #120914 grouping fixtures already exist here: `cf_67` "QA Multi Select Field" (List, Multiple values ON, Red/Green/Blue/Yellow), `cf_68` "QA Single Select Field" (List, Multiple values OFF, same 4 colour values), `cf_71` "QA Boolean Field".
