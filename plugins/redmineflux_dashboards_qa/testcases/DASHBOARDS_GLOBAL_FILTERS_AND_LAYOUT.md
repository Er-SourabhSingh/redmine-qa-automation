# Test Cases — Redmineflux Analytics Dashboard — Global Filters, Layout, Refresh & Full-Screen

> Source: vendor KB — "How to Apply Global Issue Status Filter", "How to Select the Global Date Range",
> "How to Set Global Date Range Across All Charts", "How to Resize a Chart", "How to Drag and Drop a Chart",
> "How to Refresh Charts and Use Full-Screen Mode", "How to Enable Auto Refresh", FAQ Q9, Q10.
> Additional source: production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping
> for User-Defined Queries") — TC-DSH-177 onward.
> **Status: authored 2026-09-15, extended 2026-09-22 for #120914. Not yet executed.**

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Project → **Dashboard** → the top filter bar and the widget grid. Layout changes are saved automatically, so every
drag and resize must be verified by a **full page reload**, not by what the grid shows immediately afterwards.

---

## Functional Cases — Global filters

---

### TC-DSH-054: Global issue status filter

**User Role:** Member
**Steps:**
1. Set **Issue Status** to **All Issues**, click Apply Filters and record the totals.
2. Repeat for **Open Issues Only** and **Closed Issues Only**.

**Expected Result:**
- All charts refresh for each setting.
- Open + Closed totals equal the All total on a count-based chart. If they do not, one of the three is
  mis-classifying issues — a correctness defect that only arithmetic across the three settings reveals.

---

### TC-DSH-055: Global tracker filter

**User Role:** Member
**Steps:**
1. Select a tracker in the global filter bar and Apply Filters.

**Expected Result:**
- All charts show data for that tracker only; the sum across all trackers equals the unfiltered total.

---

### TC-DSH-056: Each global date range preset

**User Role:** Member
**Steps:**
1. Apply each documented preset in turn — Today, Last 7 Days, Last 30 Days, Last 90 Days, This Month, Last Month,
   This Year — clicking Apply Filters each time.

**Expected Result:**
- All seven are offered and each produces the correct window.
- Verify the boundaries deliberately: "This Month" must start on the first of the month, "Last Month" must be the
  whole previous month and exclude the current one, and "Last 7 Days" must be unambiguous about whether today is
  included. Off-by-one boundaries here silently misreport every chart.

---

### TC-DSH-057: Custom global date range

**User Role:** Member
**Steps:**
1. Choose **Custom**, enter a start and end date, Apply Filters.

**Expected Result:**
- All charts without a per-chart override use that range.

---

### TC-DSH-058: The last used date range is remembered

**User Role:** Member
**Steps:**
1. Apply a distinctive range, leave the dashboard, and return later in a new session.

**Expected Result:**
- The dashboard reapplies the remembered range, per the KB.
- **The active range must be visibly indicated.** A remembered filter that is applied silently makes the dashboard
  appear to show current data when it does not — the most consequential usability risk in this feature.

---

### TC-DSH-059: Global filters combine

**User Role:** Member
**Steps:**
1. Apply a tracker, a status and a date range together.

**Expected Result:**
- All three constrain the data simultaneously; the result is a subset of each applied alone.

---

### TC-DSH-060: Apply Filters is required

**User Role:** Member
**Steps:**
1. Change a global filter but do **not** click Apply Filters.

**Expected Result:**
- The behaviour is consistent — either nothing changes until Apply is clicked, or filters apply live and the
  button is redundant.
- A state where the filter bar shows one thing and the charts show another, with no cue that Apply is pending, is
  a usability defect.

---

## Functional Cases — Layout

---

### TC-DSH-061: Drag a widget to a new position

**User Role:** Member
**Steps:**
1. Drag a card by its header drag area to a new grid position and release.
2. **Reload the page.**

**Expected Result:**
- The widget stays in its new position after the reload — the KB states the layout saves automatically.
- Other widgets reflow predictably rather than jumping to arbitrary positions.

---

### TC-DSH-062: Resize a widget

**User Role:** Member
**Steps:**
1. Drag the right edge, the bottom edge and the corner handle in turn; reload after each.

**Expected Result:**
- Width and height change as dragged and persist across the reload.
- The chart **re-renders to fit** its new size — a chart that keeps its original canvas inside a resized card,
  leaving clipped axes or dead space, is a defect.

---

### TC-DSH-063: Layout persists per project and per user

**User Role:** Two members
**Steps:**
1. A rearranges project X's dashboard; B opens project X's dashboard.
2. A opens project Y's dashboard.

**Expected Result:**
- Record whether the layout is shared per project or stored per user.
- Whichever it is must be consistent with the settings-scope finding in TC-DSH-026, and project Y must keep its own
  separate layout either way.

---

### TC-DSH-064: Layout survives adding and deleting widgets

**User Role:** Member
**Steps:**
1. Arrange several widgets, add one more, then delete a widget from the middle of the grid; reload.

**Expected Result:**
- Remaining widgets keep their positions and sizes. The grid must not reset to a default arrangement.

---

### TC-DSH-177: A new chart is appended to the end of the dashboard (#120914)

**User Role:** Member
**Preconditions:** At least one existing chart already on the grid, in a deliberately-arranged (non-default)
order.
**Steps:**
1. Add another chart (any template/type).

**Expected Result:**
- The new chart is added **after** every existing chart, at the end of the layout — not inserted at the front, per
  #120914 ("a dashboard is a layout its owner arranges, and inserting at the front would push their chosen first
  chart down on every add").
- The existing charts' order and positions are undisturbed.

---

### TC-DSH-178: Adding a chart renders it in place without a full page reload (#120914)

**User Role:** Member
**Steps:**
1. Add a chart and observe the page while it appears.

**Expected Result:**
- The new chart appears on the grid in place, like every other chart, with **no full page reload** (no
  navigation/loading-bar flash, other charts' state e.g. scroll position/expanded settings panels stays intact).

---

### TC-DSH-179: A newly added chart is scrolled into view and briefly highlighted (#120914)

**User Role:** Member
**Preconditions:** A dashboard with enough existing charts that the grid is taller than the viewport, so a chart
appended at the end would otherwise be off-screen.
**Steps:**
1. Add a new chart.

**Expected Result:**
- The page scrolls so the newly added chart is visible, and the chart is briefly visually highlighted (e.g. a
  border flash/glow) so it is obvious which one was just added, per #120914 ("adding a chart still shows the
  chart").

---

### TC-DSH-180: Append/scroll/highlight applies whichever Add Chart tab was used (#120914)

**User Role:** Member
**Steps:**
1. Add a chart from the **Our Queries** tab; confirm append-to-end, no-reload and scroll+highlight.
2. Add a chart from the **Saved Queries** tab (any template, including Statistics card); confirm the same three
   behaviours.

**Expected Result:**
- Behaviour is identical regardless of which tab the chart was created from, per #120914 ("This should apply to
  every chart, whichever tab it was created from").

---

## Functional Cases — Refresh and full-screen

---

### TC-DSH-065: Manual refresh reloads all widgets

**User Role:** Member
**Steps:**
1. Change some issue data in another tab, then click **Refresh** on the dashboard.

**Expected Result:**
- All widgets reload from the server and reflect the new data — not a cached redraw of the same numbers.

---

### TC-DSH-066: Dashboard full-screen mode

**User Role:** Member
**Steps:**
1. Click the Fullscreen icon in the toolbar; then exit with Escape, and again with the toggle icon.

**Expected Result:**
- The dashboard fills the window and both exit routes work, per the KB.
- Widget positions and sizes are preserved on entering and leaving.

---

### TC-DSH-067: Single-chart full-screen mode

**User Role:** Member
**Steps:**
1. Click the full-screen button on one chart card; exit with Escape and with the toggle.

**Expected Result:**
- The chart expands and shows date and tracker context information, per the KB.
- The context shown matches the filters actually applied to that chart, including a per-chart date override.

---

### TC-DSH-068: Auto refresh at each interval

**User Role:** Member
**Steps:**
1. Enable **Auto Refresh** and select each documented interval in turn — 30 seconds, 1, 2, 5 and 10 minutes.

**Expected Result:**
- All five are offered; a countdown indicator shows the time to the next refresh; refreshes actually occur at the
  chosen interval.

---

### TC-DSH-069: Auto refresh picks up new data

**User Role:** Member
**Steps:**
1. With auto refresh at 30 seconds, create an issue in another tab and wait for the next cycle.

**Expected Result:**
- The charts update without manual action.

---

### TC-DSH-070: Auto refresh can be turned off

**User Role:** Member
**Steps:**
1. Turn auto refresh off and confirm no further automatic reloads occur.

**Expected Result:**
- Refreshing stops and the countdown disappears. A timer that keeps firing after being switched off would keep
  loading the server indefinitely.

---

## Negative Cases

---

### TC-DSH-071: Auto refresh while interacting

**User Role:** Member
**Steps:**
1. With auto refresh at 30 seconds, begin dragging a widget, and separately hold a chart settings panel open,
   across a refresh cycle.

**Expected Result:**
- The refresh must not cancel an in-progress drag, discard unsaved settings, or reset the layout.
- This is the most likely real defect in the auto-refresh feature and it is easy to miss, because it only appears
  when a refresh lands during interaction.

---

### TC-DSH-072: Auto refresh with many widgets

**User Role:** Member
**Steps:**
1. Enable 30-second auto refresh on a 20-widget dashboard over a large project, and observe for several cycles.

**Expected Result:**
- Cycles complete before the next one begins. Record the server load and the cycle duration.
- Overlapping refreshes that queue up on each other are a performance defect — 20 widgets on a 30-second timer is
  a realistic configuration and the plugin should cope with it.

---

### TC-DSH-073: Invalid custom global date range

**User Role:** Member
**Steps:**
1. Enter an end date before the start date, then a malformed date, and Apply.

**Expected Result:**
- Rejected with a clear message. Not an empty dashboard with no explanation.

---

### TC-DSH-074: Filters and layout under a session expiry

**User Role:** Member
**Steps:**
1. Let the session expire, then drag a widget and click Apply Filters.

**Expected Result:**
- A clear message or a redirect to login. **Not** a silent failure that leaves the user rearranging a layout which
  is never saved.

---

### TC-DSH-075: Network failure during refresh

**User Role:** Member
**Steps:**
1. Take the network offline and trigger a manual refresh; then leave auto refresh running while offline.

**Expected Result:**
- A visible error rather than charts silently showing stale data as if current.
- Auto refresh recovers when the network returns instead of stopping permanently.

---

### TC-DSH-076: Global filters do not widen visibility

**User Role:** Member with restricted issue visibility
**Steps:**
1. Set the global filter to All Issues and the widest date range.

**Expected Result:**
- Totals still count only issues this user may see. A global filter must never become a path to aggregate data
  from restricted areas (paired with TC-DSH-045).

---

### TC-DSH-077: Layout changes without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether drag and resize handles are offered.
2. Send a layout-save request **directly**.

**Expected Result:**
- Consistent with the permission model and enforced at the endpoint.
- If the dashboard layout is shared per project, a view-only user must not be able to rearrange or destroy another
  team's dashboard through the endpoint.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
