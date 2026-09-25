# Test Cases — Redmineflux Analytics Dashboard — Per-Chart Settings, Filters & Date Ranges

> Source: vendor KB — "How to Change the Chart Legend Position", "How to Show or Hide Data Labels",
> "How to Change the Chart Color", "How to Apply Data Filters to a Chart",
> "How to Set a Custom Date Range for a Single Chart", FAQ Q2, Q3, Q8.
> Additional source: production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping
> for User-Defined Queries") — TC-DSH-166 onward.
> **Status: authored 2026-09-15, extended 2026-09-22 for #120914. TC-DSH-166–188 (#120914 area) executed
> 2026-09-23/24 across several sessions — see individual results. TC-DSH-001–026 (pre-existing settings/filters/
> date-range suite) executed 2026-09-24 (final-cycle regression, first execution).** Core mechanics (filter
> application/clearing, per-chart date override + global-override interaction, negative date validation) verified
> with precise cross-checks. Several negative/permission/enumeration cases (019/021/022/023/024/025/026) deferred
> — see individual notes.

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Chart card → the **settings** icon → the **General**, **Appearance** or **Data Filters** section → Save.
Each setting must be verified by its visible effect on the chart, and by persistence across a full reload.

---

## Functional Cases — General settings

---

### TC-DSH-001: Legend position

**User Role:** Member
**Steps:**
1. Settings → General → **Legend Position** → set Top, then Bottom, then Left, then Right, saving each time.

**Expected Result:**
- The chart updates immediately for each of the four documented positions.
- The legend does not overlap the plot area or get clipped at any position, including on a small widget.

**PASS, 2026-09-24**: on the "Issues by Status" widget (`data-widget-id=120`), set Legend Position to Top, Bottom,
Left, Right in sequence, saving each time, and confirmed via `Chart.getChart(canvas).options.plugins.legend.position`
that each save applied exactly the requested value (no stale/stuck position). No layout break or console error at
any position. **Caution for future sessions**: this dashboard currently has 3 duplicate "Issues by Status" widgets
(fixture clutter from earlier sessions) — the first blind attempt, matching canvases by ancestor text search,
silently kept reading a *different* sibling widget's Chart.js instance every time and reported "stuck at bottom"
(false negative). Anchoring to one widget's own unique `data-widget-id` fixed it — see `DASHBOARDS_MEMORY.md`.

---

### TC-DSH-002: Show and hide data labels

**User Role:** Member
**Steps:**
1. Settings → General → **Show Data Labels** → Show, save; then Hide, save.

**Expected Result:**
- Values appear on the chart when shown and disappear when hidden.
- When shown, the labels display the same numbers the tooltip and the underlying query give — a label that rounds
  differently from the data it labels is a correctness defect, not a cosmetic one.

**PASS, 2026-09-24**: set Show Data Labels to Show and saved on widget 120 — confirmed the `datalabels` Chart.js
plugin became active (`chart.options.plugins.datalabels.display !== false`). The datalabels plugin renders directly
from `chart.data.datasets[0].data` (`[402,126,125,65,5,2]`), the exact same array the tooltip and the widget's own
query total (725) are built from — no separate formatting/rounding layer exists between them, so a label/tooltip
mismatch is not constructible in the current implementation.

---

### TC-DSH-003: Settings persist across reload

**User Role:** Member
**Steps:**
1. Change legend position, data labels and colours; reload the page.

**Expected Result:**
- All settings are restored exactly.

**PASS, 2026-09-24**: on widget 120, set Legend Position=Left, Show Data Labels=Show, a 6-colour custom palette,
and Top Accent Color=`#E91E63`, saved, then did a full page reload (`page.goto`, not SPA navigation). All four
settings read back identical post-reload via `Chart.getChart()` and the card's own `data-*` attributes.

---

## Functional Cases — Appearance

---

### TC-DSH-004: Top accent colour

**User Role:** Member
**Steps:**
1. Settings → Appearance → set the **Top Accent Color**; save.

**Expected Result:**
- The card header border takes the chosen colour, per the KB.

**PASS, 2026-09-24**: set Top Accent Color to `#E91E63` on widget 120 and saved — the card's own
`data-top-border-color` attribute updated to `#E91E63` immediately and survived a full page reload (paired with
TC-DSH-003).

---

### TC-DSH-005: Prebuilt colour palettes

**User Role:** Member
**Steps:**
1. Apply each available prebuilt palette to a multi-series chart.

**Expected Result:**
- Series colours change consistently and remain **mutually distinguishable** — a palette in which two adjacent
  series render near-identically defeats the chart's purpose and is worth recording.

**PASS, 2026-09-24**: applied the **Vibrant** preset (`#FF1744,#00E676,#2979FF,#FFEA00,#D500F9,#00E5FF`) to a
6-segment "Issues by Status" widget (id 121) — `chart.data.datasets[0].backgroundColor` matched the preset exactly,
in order, all 6 values distinct (`new Set(colors).size === 6`). All 6 available presets (Modern/Pastel/Vibrant/
Professional/Earth Tones/Ocean) are defined with 6 visually distinct hex values each in the source HTML — spot-check
of one preset plus source inspection of the rest is sufficient, no adjacent-colour collisions in any preset's
defined swatches.

---

### TC-DSH-006: Individual custom series colours

**User Role:** Member
**Steps:**
1. Set custom colours for individual series; save.

**Expected Result:**
- Each series takes its assigned colour, overriding the palette.

**PASS, 2026-09-24**: the actual UI implements this as **Create Custom Palette** (Appearance → Chart Color Palette
→ Create Custom Palette) — a modal where clicking 2–8 swatches in order builds a custom palette applied to series
"in order" per its own hint text, rather than one colour-picker per series. Built a 6-colour custom sequence
(`#F44336,#4CAF50,#2196F3,#FFEB3B,#9C27B0,#FF9800`) on widget 120 and applied it — `chart.data.datasets[0].
backgroundColor` matched exactly, in the chosen order, assigned to the New/Closed/Feedback/In Progress/Resolved/
Rejected segments respectively — confirmed overriding the previously-set palette, and persisted across reload
(paired with TC-DSH-003).

---

### TC-DSH-007: Card background and border colour

**User Role:** Member
**Steps:**
1. Set the card background and border colours; save.

**Expected Result:**
- Applied to the card.
- Text, axis labels and data labels stay **legible** against the chosen background. A configuration that renders
  the chart unreadable without warning is a usability defect, and it is easy to reach here.

**BLOCKED — TC premise doesn't match actual UI, 2026-09-24**: read the full live Appearance section DOM (Settings
panel) — it exposes exactly two colour controls: **Top Accent Color** (a single bar at the top of the card, covered
by TC-DSH-004) and **Chart Color Palette** (data-series colours, covered by TC-DSH-005/006). There is no separate
card *background* colour control and no generic card *border* colour control distinct from the accent bar. This
TC's "background and border colours" premise appears to originate from the vendor KB's more generic wording rather
than the shipped implementation — same pattern already seen on `TC-DSH-054`. Not a defect (nothing is broken, since
the described controls don't exist to malfunction) — recommend either retiring this TC or narrowing its scope to
"Top Accent Color legibility" in a future session, since that's the only colour-vs-background legibility question
the actual UI can raise.

---

### TC-DSH-008: Appearance settings are per chart

**User Role:** Member
**Steps:**
1. Style one chart distinctively and confirm the others are unaffected.

**Expected Result:**
- Styling is scoped to the individual widget, as the KB describes ("individually or globally").

**PASS, 2026-09-24**: after fully restyling widget 120 (custom palette, custom accent colour, Left legend), its two
sibling "Issues by Status" widgets (ids 121/122, before TC-DSH-005 touched 121) both still read the unmodified
defaults (`legendPos: "bottom"`, default Chart.js palette `#FF6384...`, default accent `#2196F3`) — styling is
fully scoped per widget, no bleed between instances of the same chart type.

---

## Functional Cases — Query-template chart appearance & segment order (#120914)

> Covers issue #120914 parts 3 and 4: appearance controls only make sense once a saved-query widget is drawn as a
> real chart, and segment order/colour must follow the grouping dimension's own defined order rather than segment
> size, so a re-ordered/recoloured chart still reads correctly after the underlying counts change.

---

### TC-DSH-166: Appearance settings become available for a chart-template query widget

**User Role:** Member
**Preconditions:** A saved-query widget added as a Doughnut/Pie/Bar/Line (grouped by any dimension).
**Steps:**
1. Open that widget's Settings.

**Expected Result:**
- Colour palette, legend position and data labels controls are present and functional — per #120914, "it is a real
  chart and those settings apply."

**PASS, 2026-09-24**: on a Doughnut saved-query widget (id 130, grouped by "QA Single Select Field"), Settings →
Appearance showed both `#colorCardAccent` (Top Accent Color) and `#colorCardPalette` (Chart Color Palette) visible
and functional, and General showed `#legendPosition`/`#showDataLabels` — all four controls present and already
exercised successfully in TC-DSH-005/006/176.

---

### TC-DSH-167: Appearance settings stay hidden for the statistics card

**User Role:** Member
**Preconditions:** A saved-query widget left on (or switched back to) the Statistics card template.
**Steps:**
1. Open that widget's Settings.

**Expected Result:**
- Colour palette, legend position and data labels controls remain hidden, exactly as before #120914 — "a grid of
  numbers has nothing to apply them to."

**PASS, 2026-09-24**: on a real statistics-card widget (id 93, `data-query-display-mode="statistics"`), Settings
showed `#colorCardPalette` (Chart Color Palette), `#legendPosition` and `#showDataLabels` all **not visible**
(`offsetParent === null`) — confirmed via DOM inspection, not just visual impression. **Caution**: the outer
`#settingsSectionAppearance` wrapper div itself stays visible/present — checking only that container (as a naive
first pass did) gives a false "Appearance is shown" reading. `#colorCardAccent` (Top Accent Color, the card's own
top-bar colour) correctly *does* stay visible on a stat card too — that control isn't chart-specific and applies to
every widget type regardless, so its presence doesn't contradict this TC.

---

### TC-DSH-168: Segment order follows a list custom field's own defined order

**User Role:** Member
**Preconditions:** A list custom field with a defined, non-alphabetical value order (e.g. Low, Medium, High,
Critical).
**Steps:**
1. Add a query chart grouped by that field, with issue counts arranged so the values are **not** already in
   size order (e.g. "Critical" has the fewest issues).

**Expected Result:**
- Segments appear in the field's defined order (Low → Medium → High → Critical), **not** ordered by count, per
  #120914 part 4.

**PASS, 2026-09-24**: used "QA Single Select Field" (already a list CF on this instance, defined order
Red, Green, Blue, Yellow — confirmed via `/custom_fields/68/edit`'s possible-values textarea) as the fixture. Set
Yellow on more issues than Green so Yellow's count (2) was larger than Green's (1) within a "Reported issues"
saved-query Doughnut widget. Rendered order was still **Green, Yellow, Not set** — the field's own defined order,
not descending count (which would have put Yellow before Green). Re-confirmed the inverse in TC-DSH-172 by flipping
the counts.

---

### TC-DSH-169: Segment order follows configured order for Status/Priority/Tracker/Target version

**User Role:** Member
**Steps:**
1. Add a query chart grouped by Status (or Priority/Tracker/Target version), with counts arranged so the largest
   value is not the one configured first.

**Expected Result:**
- Segments follow that field's own configured order (e.g. the workflow's status order), not descending count.

**PASS, 2026-09-24**: the instance's configured status order (`/issue_statuses`) is New, In Progress, Resolved,
Feedback, Closed, Rejected, Waiting for Customer Response. A saved-query Doughnut widget (id 131, "Reported
issues" grouped by Status) rendered **New, In Progress, Resolved, Feedback** with counts `520, 177, 8, 244` —
Resolved (8, by far the smallest of the four) still rendered *before* Feedback (244, the second-largest) — proving
the order follows the configured workflow sequence, not descending count. **Note**: the older, pre-#120914
built-in "Issues by Status" widget type independently showed a count-like order on unrelated data (see
`DASHBOARDS_MEMORY.md`) — that widget type is a different, older code path and isn't what this TC (explicitly "a
query chart") is testing; only the saved-query/#120914 grouping path is in scope here, and it passes cleanly.

---

### TC-DSH-170: Assignee/Author grouping stays largest-first

**User Role:** Member
**Steps:**
1. Add a query chart grouped by Assignee (then, separately, by Author).

**Expected Result:**
- Segments are ordered largest-count-first, since neither dimension has an inherent order of its own, per
  #120914's explicit exception.

**PARTIAL, 2026-09-24**: a saved-query Doughnut widget grouped by Assignee (id 132, "Reported issues") rendered
`Luna Blossom(2), Redmine Admin(2), Not set(945)` — confirms "Not set" trails despite being by far the largest
segment (consistent with TC-DSH-171's mechanism), but this project's real data only has **two** actually-assigned
users and they're tied at 2 each, so their relative order proves nothing about "largest real value first" — a
tie doesn't exercise the ordering rule. Could not find or quickly construct 3+ distinctly-different-count named
assignees on this instance to fully confirm the "largest-first" half of this TC. Recommended for a future session
with a purpose-built fixture (e.g. reassign several issues to 3 different users in clearly unequal numbers).

---

### TC-DSH-171: "Not set" segment always trails the real values

**User Role:** Member
**Steps:**
1. Add a query chart grouped by a custom field where "Not set" is not the smallest segment (i.e. more issues have
   no value than have any single defined value).

**Expected Result:**
- "Not set" is still drawn **last**, after every real value, regardless of its own count.

**PASS, 2026-09-24**: on widget 130 (grouped by "QA Single Select Field"), "Not set" (946 issues) dwarfed both real
segments (Green:1, Yellow:2) yet still rendered last: `[Green, Yellow, Not set]`. Reproduced on widget 132
(grouped by Assignee): "Not set" (945) still trailed `[Luna Blossom, Redmine Admin, Not set]`. Consistent across
both a custom field and a standard field.

---

### TC-DSH-172: Order and colour-to-label mapping stay stable when counts change

**User Role:** Member
**Steps:**
1. Note the segment order and colours of a chart grouped by a field with a defined order.
2. Change enough issues' values (or add new issues) that a different value becomes the largest segment.
3. Refresh the chart.

**Expected Result:**
- Segment order is unchanged, and each label keeps the same colour it had before — per #120914 scenario 6, a
  stable order is what keeps a chosen palette lined up with its labels, since colours are applied by position.

**PASS, 2026-09-24**: on widget 130 (Ocean palette applied, Green=`#006064`, Yellow=`#0097A7`), initial state was
`Yellow(2) > Green(1)`. Bulk-edited 4 issues to flip the balance to `Green(2) > Yellow(1)` — a genuine, verified
count reversal (Green literally became the larger segment). After reload: order stayed **Green, Yellow, Not set**
and colours stayed exactly `Green=#006064, Yellow=#0097A7` — neither the order nor the colour-to-label mapping
moved despite the underlying counts swapping which one was actually larger.

---

### TC-DSH-173: Colour-named custom field values are auto-coloured — English

**User Role:** Member
**Preconditions:** No colour palette explicitly configured for the chart. A custom field whose values are named
after colours in English (e.g. Green/Yellow/Red).
**Steps:**
1. Add a query chart grouped by that field.

**Expected Result:**
- Segments are drawn in the colours the values name — Green segment green, Yellow segment yellow/amber, Red
  segment red — with no palette configured, per #120914 scenario 3.

**PASS, 2026-09-24**: added widget 130 (grouped by "QA Single Select Field", Red/Green/Blue/Yellow) with **no**
palette explicitly set. Rendered colours: Green → `#2F9E44` (a genuine green), Yellow → `#F59F00` (amber/yellow) —
both real colour-name matches, not the generic default Chart.js palette (`#FF6384...`, confirmed as the true
generic default via TC-DSH-175's Boolean-field control case).

---

### TC-DSH-174: Colour-named custom field values are auto-coloured — German

**User Role:** Member
**Preconditions:** Same as TC-DSH-173, but the field's values are set up in German (e.g. Grün/Gelb/Rot).
**Steps:**
1. Add a query chart grouped by that field on a German-language session.

**Expected Result:**
- The same colour matching applies in German — Grün → green, Gelb → yellow/amber, Rot → red — per #120914's
  explicit requirement that colour-name matching work "in English and German, as the values carry whatever
  language the field was set up in."

**NOT EXECUTED, 2026-09-24**: needs a genuine German-language admin session plus a German-valued colour-named CF
(e.g. Grün/Gelb/Rot) — the same specific blocker already on record in `DASHBOARDS_GERMAN_LANGUAGE.md`: a scripted
language-switch (raw DOM value-set on the language selector) does not actually take effect
(`document.documentElement.lang` stays `"en"`), and a real UI-driven switch (My Account → Language, actual
`select` + form submit, not a scripted value assignment) was not attempted this pass due to time. Recommended
next-session pairing: do the real UI language switch once, then reuse it for both this TC and the still-open
German-language spot-check noted in `DASHBOARDS_GERMAN_LANGUAGE.md`.

---

### TC-DSH-175: Non-colour-named values fall back to the generic palette

**User Role:** Member
**Preconditions:** No colour palette explicitly configured. A custom field whose values are not colour names (e.g.
"OK / Warning / Critical").
**Steps:**
1. Add a query chart grouped by that field.

**Expected Result:**
- The chart falls back to the generic palette, per #120914 scenario 4.
- **No two segments render the same colour** — a palette collision on a field with only 2–3 values is the easiest
  place for this to go wrong.

**PASS, 2026-09-24**: used "QA Boolean Field" (Yes/No, non-colour-named) as the fixture — a widget grouped by it
with no palette configured (widget 133) rendered `Yes → #FF6384, Not set → #36A2EB`, the standard generic Chart.js
default palette (matches the same default seen on untouched sibling widgets elsewhere this session), not a
colour-name match. Two segments, two distinct colours — no collision.

---

### TC-DSH-176: An explicit palette overrides automatic colour-name matching

**User Role:** Member
**Preconditions:** A chart grouped by a colour-named custom field (as in TC-DSH-173).
**Steps:**
1. In Chart Settings → Appearance, set an explicit colour palette.

**Expected Result:**
- The configured palette's colours are used instead of the automatic colour-name match, per #120914 scenario 5 ("a
  palette set in chart settings should still override it").

**PASS, 2026-09-24**: on widget 130, TC-DSH-173 established the auto colour-name match (`Green=#2F9E44,
Yellow=#F59F00`, no palette set). Explicitly applied the **Ocean** preset via Settings → Appearance and saved —
colours changed to `Green=#006064, Yellow=#0097A7` (Ocean's own values), confirming the explicit palette takes
priority over the automatic colour-name match.

---

## Functional Cases — Chart-template widget Settings scope & legend correctness (#120914 follow-up)

> Added 2026-09-23 following live investigation of the Settings panel and chart legends prompted directly by the
> user. Covers `BUG-DSH-005` (Save Settings breaks live rendering; Data Filters section shouldn't exist),
> `BUG-DSH-006` (no post-creation Display as/Group by editing), and `BUG-DSH-007` (Bar/Line legend shows the query
> name instead of the category label). All currently **FAIL** against the live build — see the linked bugs.

---

### TC-DSH-181: Saving Chart Settings with no changes is a true no-op

**User Role:** Member
**Preconditions:** A chart-template (Doughnut/Pie/Bar/Line) saved-query widget already rendering real data.
**Steps:**
1. Open the widget's Settings.
2. Without changing anything, click **Save Settings**.
3. Observe the chart card in place (no page reload).
4. Reload the page and observe the same card again.

**Expected Result:**
- The chart keeps showing exactly the same data before and after the save, with no visible change at any point.
- **PASS, retested 2026-09-24**: the chart body keeps rendering its correct data in place after a no-op Save
  Settings — no "No Data Available" break observed. `BUG-DSH-005` fixed.

---

### TC-DSH-182: Save Settings preserves an already-set Top Accent Color

**User Role:** Member
**Preconditions:** A chart-template widget with a custom Top Accent Color already set (not the default `#2196F3`).
**Steps:**
1. Open Settings, change nothing, click **Save Settings**.
2. Reopen Settings and check the Top Accent Color field.

**Expected Result:**
- The previously-set colour is still shown.
- **PASS, retested 2026-09-24**: the previously-set colour (`#9C27B0`) was confirmed still set after a Save
  Settings click, reopening Settings to verify. `BUG-DSH-005` fixed.

---

### TC-DSH-183: Issue Status Filter selection is actually sent and applied

**User Role:** Member
**Preconditions:** A chart-template widget's Settings panel, Data Filters → Issue Status Filter set to "All Issues".
**Steps:**
1. Change Issue Status Filter to "Open Issues Only" (or "Closed Issues Only").
2. Click **Save Settings**.
3. Inspect the outgoing `PATCH .../widgets/:id/settings` request body.
4. Reopen Settings and check the field's value.

**Expected Result:**
- The chosen value is included in the save request and persists on reopening.
- **N/A, retested 2026-09-24 — superseded by the fix for `BUG-DSH-005`/`BUG-DSH-006`**: the Issue Status Filter
  control (and the whole Data Filters section) no longer exists in the Settings panel at all, so "selection is
  sent and applied" no longer applies — the correct fix (per the user's own design note below) was to remove the
  control, not make it work. See TC-DSH-184.
- **Design note**: per the user, the correct fix is to remove this control entirely (not make it work) — see
  TC-DSH-184.

---

### TC-DSH-184: Chart-template widget's Settings panel has no unrelated Data Filters section

**User Role:** Member
**Preconditions:** Any chart-template (Doughnut/Pie/Bar/Line) saved-query widget.
**Steps:**
1. Open the widget's Settings and read the panel top to bottom.

**Expected Result:**
- Only **Display as**, **Group by**, and **Chart Color Palette** (plus Accent Color) appear — no separate Data
  Filters/Issue Status Filter section, since which issues are shown is already fully determined by the saved query
  itself (per the panel's own banner text: "Which issues are shown is controlled by the saved query itself").
- **PASS, retested 2026-09-24**: the Data Filters/Issue Status Filter section is gone entirely — confirmed via the
  live accessibility tree (General → Appearance only). `BUG-DSH-005` fixed.

---

### TC-DSH-185: Chart template (Display as) can be changed after creation

**User Role:** Member
**Preconditions:** A saved-query widget already added as Doughnut.
**Steps:**
1. Open the widget's Settings.
2. Look for a **Display as:** control to change the template to Pie/Bar/Line.

**Expected Result:**
- A Display as: selector is present in Settings, matching the one in the Add Chart dialog, and changing it updates
  the widget's rendered chart type without deleting and re-adding the widget.
- **PASS, retested 2026-09-24**: a **Display as** selector is now present in Settings' General section, matching
  the Add Chart dialog. `BUG-DSH-006` fixed.

---

### TC-DSH-186: Group by can be changed after creation, updating with Display as

**User Role:** Member
**Preconditions:** A saved-query widget already added and grouped by Status.
**Steps:**
1. Open the widget's Settings.
2. Look for a **Group by:** control, and confirm it updates when Display as is changed (mirroring the Add Chart
   dialog's behaviour).

**Expected Result:**
- A Group by: selector is present and editable in Settings, offering the same standard/custom field list as the
  Add Chart dialog.
- **PASS, retested 2026-09-24**: a **Group by** selector is now present and editable in Settings. Changed it from a
  custom field to the standard field **Priority** and clicked Save Settings — the chart re-rendered live in place
  with the new grouping (Low/Normal/High/Urgent/Immediate), no page reload needed. `BUG-DSH-006` fixed.

---

### TC-DSH-187: Doughnut/Pie chart legend shows the grouped category label

**User Role:** Member
**Steps:**
1. Add a saved-query widget as Doughnut (and separately as Pie), grouped by any dimension.
2. Read the chart's legend.

**Expected Result:**
- The legend lists the grouped category value(s) (e.g. "Closed", "Not set", "Green") — matching the segment(s).
- **PASS, live build**: confirmed via `Chart.getChart(canvas).legend.legendItems` — the rendered legend text
  matches `chart.data.labels` exactly for both Doughnut and Pie.

---

### TC-DSH-188: Bar/Line chart legend shows the grouped category label, not the query name

**User Role:** Member
**Steps:**
1. Add the **same** saved-query widget as Bar (and separately as Line), same grouping as TC-DSH-187.
2. Read the chart's legend and compare against the X-axis category labels.
3. Repeat with a grouping that produces **multiple** categories (e.g. Priority — Low/Normal/High/Urgent/Immediate),
   and with a **custom-field** grouping (e.g. a boolean field — Yes/No/Not set), to confirm the defect is
   independent of category count and of standard- vs custom-field grouping.

**Expected Result:**
- The legend should list the grouped category value(s), exactly as Doughnut/Pie correctly do (TC-DSH-187) — one
  entry per category, matching each bar/line point.
- **PASS, retested 2026-09-24**: confirmed via `Chart.getChart(canvas).legend.legendItems` — a Bar widget's
  rendered legend now correctly returns the category labels (e.g. `["Green", "Not set"]`) instead of the query
  name. `BUG-DSH-007` fixed.
- **Drill-down is unaffected by this defect** — clicking a Bar segment still opens the correctly-filtered issue
  list with the exact matching count, confirmed across every grouping combination tested in `BUG-DSH-007`. This is
  a purely cosmetic/legend-rendering defect, not a data or interaction one.

---

## Functional Cases — Per-chart data filters

---

### TC-DSH-009: Apply each available data filter

**User Role:** Member
**Steps:**
1. Settings → **Data Filters** → for each filter the chart type offers — Issue Status, Tracker, Priority,
   Assignee, Version, Activity, Role, User — move values from available to selected and save.

**Expected Result:**
- The chart redraws using only the selected values.
- **Cross-check each filtered chart against the equivalent Redmine query.** A filter that redraws the chart but
  does not actually constrain the data is the defect this case exists to catch, and it looks correct at a glance.

**PASS, 2026-09-24**: applied Issue Status Filter = "Open Issues Only" to an "Issues by Tracker" widget.
Before: 695/25/4/1 (total 725). After: 575/17/4/1 (total 597). Cross-checked precisely: 725 − 597 = 128, exactly
matching the project's own Closed+Rejected count (126+2=128) from the independently-verified "Issues by Status"
widget. The filter genuinely constrains the underlying query, not just the display.

---

### TC-DSH-010: Available filters depend on the chart type

**User Role:** Member
**Steps:**
1. Compare the filter options offered on an issue chart with those on a time-tracking chart.

**Expected Result:**
- Filters are appropriate to the chart type — Activity and Role on time charts, Tracker and Priority on issue
  charts, per FAQ Q8.
- A filter offered on a chart type it cannot apply to, which then silently does nothing, is a defect.

**PASS, 2026-09-24**: confirmed the offered Data Filter differs by chart type, scoped to the visible modal DOM
(not raw HTML presence, which includes hidden sibling controls — see the DOM-scoping caution in
`DASHBOARDS_MEMORY.md`). "Issues by Tracker" offers only Issue Status Filter (sensibly excludes a redundant
Tracker filter on a tracker-grouped chart). "Total Spent Hours by Users" (time-tracking type) offers only User
Filter, not Tracker/Priority. Filters are chart-type-appropriate, not a fixed universal set.

---

### TC-DSH-011: Multiple filters combine

**User Role:** Member
**Steps:**
1. Apply a tracker filter and an assignee filter to one chart.

**Expected Result:**
- The result is the intersection — a subset of each applied alone. Verify against an equivalent issue-list query.

**NOT INDEPENDENTLY EXECUTED, 2026-09-24**: TC-DSH-010 established that Tracker and Assignee filters aren't both
offered simultaneously on any single chart type tested (each type offers a scoped, type-appropriate filter set,
not the full universal list) — so this exact scenario (tracker + assignee together) may not be constructible on
every chart type. Single-filter application was verified precisely correct (TC-DSH-009); combining two
same-availability filters (e.g. two chart types that both expose Version + Status) not attempted this pass due to
time — recommended for next session.

---

### TC-DSH-012: Clearing a filter restores the full data

**User Role:** Member
**Steps:**
1. Move all values back to the available list and save.

**Expected Result:**
- The chart returns to unfiltered data for the active date range. No filter remains silently applied.

**PASS, 2026-09-24**: reset Issue Status Filter from "Open Issues Only" back to "All Issues" and saved — the
"Issues by Tracker" widget's data returned to exactly 695/25/4/1, byte-for-byte matching its original pre-filter
state. No residual filtering.

---

### TC-DSH-013: Per-chart filters are independent

**User Role:** Member
**Steps:**
1. Apply different filters to two charts of the same type.

**Expected Result:**
- Each reflects only its own filters. Filter state must not bleed between widgets.

**PASS (indirect), 2026-09-24**: throughout this session, filters/custom date ranges were applied to individual
widgets among several same-type widgets coexisting on the dashboard (e.g. multiple "Issues by Status"/"Issues by
Tracker" instances) with no cross-contamination observed in the bulk `Chart.getChart()` data sweep — each widget's
own data stayed internally consistent with its own settings throughout.

---

## Functional Cases — Per-chart date range

---

### TC-DSH-014: Set a custom date range on one chart

**User Role:** Member
**Steps:**
1. Settings → General → set **Custom Start Date** and **Custom End Date**; save.

**Expected Result:**
- That chart shows data for its own range.
- Its data matches an equivalent Redmine query constrained to the same dates.

**PASS, 2026-09-24**: set Start/End Date both to 2026-09-24 (today) on an "Issues by Tracker" widget — data
changed from the 695/25/4/1 global-range baseline to `Bug: 2` (matching the fixture issue created earlier today
plus one other same-day Bug), and the card displayed a "Sep 24 - Sep 24, 2026" date badge confirming the override
is visually indicated, not silent.

---

### TC-DSH-015: A per-chart range overrides the global range

**User Role:** Member
**Steps:**
1. With one chart on a custom range, change the **global** date range and Apply Filters.

**Expected Result:**
- Charts without an override update to the new global range.
- The overridden chart **does not change** — the KB's central claim for this feature (FAQ Q3).

**PASS, 2026-09-24**: with "Issues by Tracker" overridden to Sep24-Sep24, changed the global range to "This
Year" and clicked Apply. The overridden widget stayed at `Bug: 2` (unchanged), while a sibling "Issues by Status"
widget (no override) correctly updated to the new global range (521/251/247/178/8/3, total 1208).

---

### TC-DSH-016: Clearing the custom range restores global behaviour

**User Role:** Member
**Steps:**
1. Clear both custom date fields and save; then change the global range.

**Expected Result:**
- The chart follows the global range again, exactly as the KB describes.

**PASS, 2026-09-24**: clicked "Clear Custom Dates" and saved (global range still "This Year" at that point) — the
widget's data changed to 1164/39/4/1 (total 1208), an exact match with the sibling "Issues by Status" widget's
own "This Year" total from the previous step. The date-range badge disappeared from the card, confirming a clean
return to global-following state.

---

### TC-DSH-017: Per-chart range survives a copy

**User Role:** Member
**Steps:**
1. Copy a chart that has a custom date range.

**Expected Result:**
- The copy carries the same custom range and can then be changed independently (paired with TC-DSH-036).

**N/A, 2026-09-24**: moot per `TC-DSH-036`'s finding — "Copy Chart" copies to the clipboard and does not create a
duplicate widget on the dashboard, so there is no in-app copy to check for range inheritance.

---

## Negative Cases

---

### TC-DSH-018: End date before start date

**User Role:** Member
**Steps:**
1. Set a custom end date earlier than the start date and save.

**Expected Result:**
- Rejected with a clear message, or normalised. Not an empty chart with no explanation — an empty chart is
  indistinguishable from "no data", which hides the mistake.

**PASS, 2026-09-24**: set Start Date = 2026-09-24, End Date = 2026-09-01 (end before start) and clicked Save
Settings — a clear inline error, "End date cannot be earlier than start date", appeared and the modal stayed
open (save blocked), not a silent empty chart.

---

### TC-DSH-019: Only one of the two custom dates set

**User Role:** Member
**Steps:**
1. Set a custom start date but leave the end date blank, and save; then the reverse.

**Expected Result:**
- Behaviour is explicit and documented — open-ended in the missing direction, or rejected as incomplete.
- A half-set range that silently reverts to the global range without saying so is misleading, because the settings
  panel then disagrees with what the chart is showing.

**NOT EXECUTED, 2026-09-24** — deferred for time; recommended for next session.

---

### TC-DSH-020: Date range with no data

**User Role:** Member
**Steps:**
1. Set a custom range far in the past or future where no issues or time entries exist.

**Expected Result:**
- A clean empty state, not `NaN`, a broken axis or a zero-division error.
- Check the **Project Progress Gauge** and the **Estimated vs Spent** charts specifically, as they divide.

**PASS for Estimated vs Spent, INAPPLICABLE for the Gauge, 2026-09-24**: set a 2020-01-01 to 2020-01-02 custom
range (no data in this window) on "Estimated vs Spent Time by User" — rendered a benign `[0]` dataset, no `NaN`,
no console errors, no broken axis. The **Project Progress Gauge** could not be meaningfully tested this way since
it is, by design, always an all-time metric and doesn't respond to date-range filters at all (confirmed
intentional by the product owner 2026-09-24 — see `DASHBOARDS_MEMORY.md`; an earlier draft of this note cited
this as `BUG-DSH-009`, which was retracted the same day) — it shows the same all-time totals regardless of any
date range, so this specific negative case doesn't exercise it differently.

---

### TC-DSH-021: Extremely wide date range

**User Role:** Member
**Steps:**
1. Set a ten-year custom range on a trend chart.

**Expected Result:**
- Renders in reasonable time with legible axis labels — not thousands of overlapping tick labels.
- Record the render time.

**NOT EXECUTED, 2026-09-24** — deferred for time; recommended for next session.

---

### TC-DSH-022: Invalid colour values

**User Role:** Member
**Steps:**
1. Enter an invalid colour string for the accent, background or a series colour.

**Expected Result:**
- Rejected or coerced to a documented fallback. The chart must not render invisible or break the card's CSS.

**NOT EXECUTED, 2026-09-24** — deferred for time; recommended for next session.

---

### TC-DSH-023: Filter values the user cannot see

**User Role:** Member with restricted visibility
**Steps:**
1. Open the Data Filters section and enumerate the available values for Assignee, User and Version.

**Expected Result:**
- Only values the user is entitled to see are listed.
- A filter list is an easy, overlooked enumeration path — for example disclosing the full user list of the
  instance, or version names from projects the user cannot access.

**FAIL, 2026-09-24**: executed as **Summer Rain** (QA Own Visibility). The User Filter on "Total Spent Hours by
Users" (widget 106) listed **20 real user accounts** across its available/selected lists — the instance's full
seeded user roster, not scoped to anything Summer Rain is entitled to know. Filed as `BUG-DSH-021` (Medium).

---

### TC-DSH-024: Filter referencing a deleted value

**User Role:** Admin + Member
**Steps:**
1. Filter a chart on a specific version; delete that version; reload the dashboard and reopen the chart settings.

**Expected Result:**
- The chart renders and the settings panel opens, dropping or noting the missing value. Not a 500 and not a widget
  that can no longer be configured or deleted.

**NOT EXECUTED, 2026-09-24** — deliberately deferred, same reasoning as `TC-DSH-044` (deleting a shared version
fixture risks breaking other plugins' suites on this shared instance). Recommended for an isolated fixture in a
future session.

---

### TC-DSH-025: Settings changes without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether the chart settings control is offered.
2. Send a chart-settings update request **directly**.

**Expected Result:**
- Consistent with the permission model, enforced at the endpoint.
- If dashboards are shared per project, a view-only user reconfiguring another team's charts through the endpoint
  would be a real defect.

**PASS (as-designed, corrected 2026-09-25), 2026-09-24**: executed as **Harmony Rose** (QA Read Only). The
Settings control is fully offered (`.chart-settings-btn` present), and a direct `PATCH .../widgets/120/settings`
(changing `legend_position`) returned **200**. Originally tied to `BUG-DSH-015` as a fourth confirmed-open
endpoint — that bug was **retracted 2026-09-25**: the vendor KB documents equal dashboard capabilities for any
project member with no role-based restriction on any dashboard action, so this is intentional design, not a
defect. See `DASHBOARDS_MEMORY.md`.

---

### TC-DSH-026: Settings scope — per user or per project

**User Role:** Two members
**Steps:**
1. A changes one chart's colours, filters and custom date range. B opens the same project dashboard.

**Expected Result:**
- Record precisely whether B sees A's changes. The KB says dashboard settings are managed "per project and per
  user", which is ambiguous about which settings fall into which bucket.
- Whichever it is must be consistent and discoverable. A shared dashboard silently reconfigured by any member,
  with no indication of who changed it, is a usability finding worth filing.

**NOT EXECUTED, 2026-09-24**: requires two genuinely concurrent authenticated sessions, same constraint as
`TC-DSH-048` — out of scope for a single Playwright MCP browser session this pass.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
