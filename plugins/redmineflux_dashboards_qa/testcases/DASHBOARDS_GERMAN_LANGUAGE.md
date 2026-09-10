# Test Cases — Redmineflux Custom Dashboard Plugin — German Language Compatibility

> Scope: Stage 1 — verify the Custom Dashboard plugin's own "Dashboard" tab renders fully in German. Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch) — confirmed via `document.documentElement.lang === "de"` and fully-German core Redmine navigation on the same page.
- Redmine 7.0.1.stable, redmineflux_dashboard plugin (version not yet confirmed via Administration > Plugins).
- Active theme: Default (core Redmine).
- No project module needs enabling — the "Dashboard" tab is present on every project by default (confirmed live).

---

### TC-DSH-001 — Dashboard shell (heading, header controls, global filter bar, empty state) fully translated

**Steps**

1. Open a project's "Dashboard" tab (e.g. `/projects/fluxganttproject/analytics_dashboard`) on a project with no charts yet.
2. Inspect the page heading, header controls (Share/Auto-refresh toggle+interval), global filter bar (Tracker/Date Range/Apply/Refresh/Fullscreen), and the empty-state message.

**Actual Result — FAIL**

- Confirmed via `document.body.innerText` (with `document.documentElement.lang === "de"` and fully-German core Redmine chrome on the same page) that the following are **untranslated English**: page heading "Analytics Dashboard"; header controls "Share", "OFF", auto-refresh interval options "30 sec"/"1 min"/"2 min"/"5 min"/"10 min"; filter-bar labels "Tracker:"/"Date Range:"; "All Trackers" default option; the Date Range dropdown's own "Custom Range" option (its 7 sibling presets ARE translated); "Apply", "Refresh", "Fullscreen" buttons; "Add Chart" button; empty-state heading "No Charts Added" and its instruction text.
- Tooltip text (accessible name) also untranslated: "Generate Public Share Link", "Enable/Disable Auto Refresh".
- The only translated plugin-owned content on this page: 7 of the 8 Date Range preset options ("Heute", "die letzten 7 Tage", "die letzten 30 Tage", "die letzten 90 Tage", "aktueller Monat", "voriger Monat", "aktuelles Jahr").

**Verdict:** FAIL — filed as `BUG-DSH-001` (High).

**Evidence:** `screenshots/BUG-DSH-001/dashboard-shell-untranslated.png`

---

### TC-DSH-002 — "Add New Chart" modal fully translated

**Steps**

1. Click "Add Chart".
2. Inspect the modal heading, subheading, tabs, search field, chart-type list (all 22 "Our Queries" entries), Chart Title field, and footer buttons.

**Actual Result — FAIL (same root cause as TC-DSH-001)**

- Modal heading "Add New Chart", subheading "Core Analytics Dashboard" / "22 chart queries + 5 saved queries available", tabs "Our Queries (22)" / "Saved Queries (5)", field label "Query Type:", placeholder "Search query types...", all spot-checked chart type names ("Issues by Status", "Issues by Tracker", "Issues by Priority", "Issues by Assignee", "Issues by Assignee (Stacked by Status)"), field label "Chart Title (optional):", placeholder "Leave empty to use query name", and the "Add" button — all untranslated English.
- Notably "Abbrechen" (Cancel) IS correctly translated — this modal's one shared-core-component string, everything plugin-specific is not.

**Verdict:** FAIL — same bug, `BUG-DSH-001`, not filed separately.

---

### TC-DSH-003 — Chart card controls and resize handles fully translated

**Steps**

1. Add an "Issues by Status" chart via the modal above.
2. Inspect the chart card's icon row and resize-handle accessible names.

**Actual Result — FAIL (same root cause)**

- Chart title "Issues by Status" (the query's own name, untranslated — expected, since chart titles are user/query-named, not fixed UI strings, though the "Chart Title" field label itself is also untranslated per TC-DSH-002).
- Icon row: "Copy Chart", "Fullscreen", "Chart Information", "Settings", "Remove" — all untranslated.
- Resize handles: "Drag to resize width", "Drag to resize height", "Drag to resize both" — all untranslated.
- Chart legend values ("New", "Feedback", "In Progress", "Resolved") are actual issue-status data records, not plugin UI strings — correctly not a translation concern.

**Verdict:** FAIL — same bug, `BUG-DSH-001`, not filed separately.

---

### TC-DSH-004 — Chart Settings panel (General / Data Filters / Appearance) fully translated

**Steps**

1. Click the Settings icon on the "Issues by Status" chart card.
2. Inspect all three sections: General, Data Filters, Appearance.

**Actual Result — FAIL (same root cause)**

- Modal heading "Chart Settings"; section headers "General", "Data Filters", "Appearance".
- General: "Chart Title", "Legend Position" (+ value "Bottom"), "Show Data Labels" (+ value "Hide"), "Custom Date Range" (+ hint "Leave empty to use global date filter", shown twice), "Start Date", "End Date", "Clear Custom Dates".
- Data Filters: "Issue Status" (+ hint "Select up to 15 statuses"), "Available Statuses", "Selected Statuses".
- Appearance: "Top Accent Color", "Pick Color", "Hex Code", hint "This color appears as a bar at the top of the chart card", "Chart Color Palette", "Select a Pre-built Palette", hint "Select a palette above or create custom", "Create Custom Palette", "Clear Colors", hint "Selected colors will be used for chart data series in order". (Palette names "Modern"/"Pastel"/"Vibrant"/"Professional"/"Earth Tones"/"Ocean" are proper-noun-style labels, not counted as defects.)
- Footer: "Cancel", "Save Settings" — untranslated.

**Verdict:** FAIL — same bug, `BUG-DSH-001`, not filed separately. Cancelled without saving to leave the fixture chart's settings unchanged.

---

### TC-DSH-005 — Success toasts, validation errors, and info tooltip content fully translated

**Steps**

1. Click "Copy Chart" on the "Issues by Status" chart card; capture any toast via `MutationObserver` (toasts auto-dismiss too fast for a screenshot round-trip).
2. Open Chart Settings, clear the Chart Title, click "Save Settings"; capture any toast.
3. Reopen Chart Settings, set Custom Date Range with an End Date earlier than the Start Date, click "Save Settings"; inspect any inline validation error.
4. Click the "Chart Information" (ℹ) icon on the chart card; inspect the tooltip popover content.
5. Click "Remove" on the chart card; inspect the confirmation dialog.

**Actual Result — FAIL (same root cause as BUG-DSH-001)**

- Success toast on Copy Chart: **"Chart copied to clipboard"** — untranslated.
- Success toast on Save Settings (valid form, empty title accepted since it falls back to the query name): **"Settings saved successfully"** — untranslated.
- Inline validation error (End Date before Start Date): **"End date cannot be earlier than start date"** — untranslated. Noted separately: the same click also fired the "Settings saved successfully" toast despite this validation error, a possible success/error logic inconsistency — flagged for a functional follow-up, not counted as a translation defect.
- "Chart Information" tooltip popover: heading "Calculation Method", 5 explanatory bullet points, "Active Filters" section with "Tracker:"/"Period:"/"Issue Status:" labels and "All Issues" value — all untranslated except the "Period:" value itself ("die letzten 30 Tage", inherited from the global filter).
- "Delete Chart Container?" confirmation dialog: heading, body text, "Cancel"/"Delete" buttons — all untranslated. Cancelled without confirming to preserve the fixture chart.

**Verdict:** FAIL — same bug, `BUG-DSH-001`, not filed separately. Confirms the systemic gap extends to every category of user-facing feedback (toasts, inline errors, tooltips, confirmation dialogs), not just static labels.

## Not yet covered this session

- Actual chart data rendering/drill-down behavior, drag-and-drop repositioning, resize functionality itself (only accessible-name labels checked, not the interaction).
- Auto-refresh actual timer behavior (only the toggle/dropdown UI checked).
- Public Share Link generation, copy, and regeneration flow.
- Full-screen mode (dashboard-wide and per-chart).
- "Saved Queries" tab content and Time Entry Query charts.
- Remaining ~17 of 22 built-in chart types not individually added/inspected.
- Data Filters beyond Issue Status (Tracker/Priority/Assignee/Version/Activity/Role/User) not yet exercised per-chart.
- Permission/role-gated access (which roles can view/add/edit/share) not yet confirmed.
- Admin REST API precondition (Administration > Settings > API) not yet checked.
- Stage 2 (resolutions) and Stages 3–6 (Lotus theme) not yet run.
