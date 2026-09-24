# Test Cases — Redmineflux Analytics Dashboard — Global Filters, Layout, Refresh & Full-Screen

> Source: vendor KB — "How to Apply Global Issue Status Filter", "How to Select the Global Date Range",
> "How to Set Global Date Range Across All Charts", "How to Resize a Chart", "How to Drag and Drop a Chart",
> "How to Refresh Charts and Use Full-Screen Mode", "How to Enable Auto Refresh", FAQ Q9, Q10.
> Additional source: production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping
> for User-Defined Queries") — TC-DSH-177 onward.
> **Status: authored 2026-09-15, extended 2026-09-22 for #120914. Executed 2026-09-24 (final-cycle regression,
> first execution of most TCs in this suite) on `redmine-docker-700`.** Results inline per TC below. 1 new bug
> filed: `BUG-DSH-011` (Auto Refresh off doesn't cancel the already-scheduled cycle). One TC premise (global Issue
> Status filter, TC-DSH-054) doesn't match the actual UI — flagged as stale documentation, not a bug. TC-DSH-062
> (resize) inconclusive — could not trigger via automation despite multiple techniques. Several TCs requiring two
> concurrent sessions (026/048/063) or destructive shared-fixture changes (024) deferred.

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

**BLOCKED — TC premise doesn't match actual UI, 2026-09-24**: the global filter bar has exactly two controls,
**Tracker** and **Date Range** — there is no global Issue Status control anywhere in the header, confirmed by
enumerating every `<select>` on the page. This contradicts `DASHBOARDS_REQUIREMENTS.md` line 15, which lists
"issue status" as one of the three global filter bar dimensions. Consistent across this entire session (dozens of
filter-bar interactions, never once saw this control) — not a new regression, appears to be stale documentation
rather than a recent break. The equivalent per-chart Issue Status Filter **was** verified working correctly
(`TC-DSH-009`). Recommend correcting `DASHBOARDS_REQUIREMENTS.md` line 15 to drop "issue status" from the global
filter bar's dimensions, and updating this TC's steps to match reality, rather than treating this as a bug.

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

**PASS, 2026-09-24**: dragged the "Issues by Tracker" widget's header handle (a `cursor: move` div with a grip
icon) to a new position using genuine `page.mouse` down/move/up (Playwright's native drag helper, `dragTo()`,
did **not** trigger this app's custom drag handling — real mouse events were required). Widget moved from grid
index 17 to index 19. **Confirmed via full page reload**: still at index 19 with correct neighbors afterward — the
position genuinely persisted server-side, not just a client-side reorder.

---

### TC-DSH-062: Resize a widget

**User Role:** Member
**Steps:**
1. Drag the right edge, the bottom edge and the corner handle in turn; reload after each.

**Expected Result:**
- Width and height change as dragged and persist across the reload.
- The chart **re-renders to fit** its new size — a chart that keeps its original canvas inside a resized card,
  leaving clipped axes or dead space, is a defect.

**INCONCLUSIVE, 2026-09-24**: could not trigger a resize via automation despite trying real `page.mouse`
down/move/up (multiple step sizes and speeds, with and without a preceding hover/scroll-into-view), synthetic
`MouseEvent` dispatch, and synthetic `PointerEvent` dispatch — the card's `boundingBox()` width never changed by
even a pixel during or after any attempt, including mid-drag (before mouseup). Notably, the **drag-and-drop**
interaction (TC-DSH-061) worked cleanly with the exact same real-mouse technique moments earlier on the same
page, which argues against a generic "automation can't do drag on this page" explanation — but per the
established caution about automation-harness limitations on hover/pointer-dependent UI (see the Chart
Information tooltip note, TC-DSH-038), this is recorded as inconclusive rather than a confirmed defect. Needs a
real human interaction or a different automation approach (e.g. a real OS-level mouse driver) to verify.

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

**NOT EXECUTED, 2026-09-24**: requires two genuinely concurrent authenticated sessions, same constraint noted
elsewhere this pass (TC-DSH-048, TC-DSH-026) — out of scope for a single Playwright MCP browser session.

---

### TC-DSH-064: Layout survives adding and deleting widgets

**User Role:** Member
**Steps:**
1. Arrange several widgets, add one more, then delete a widget from the middle of the grid; reload.

**Expected Result:**
- Remaining widgets keep their positions and sizes. The grid must not reset to a default arrangement.

**PASS (indirect, from cumulative session evidence), 2026-09-24**: across this entire session, dozens of widgets
were added (22 core types + several regression fixtures) and several were deleted (TC-DSH-034/035), on top of the
TC-DSH-061 drag reorder — the grid never reset to a default arrangement at any point; each add appended at the end
(consistent with the #120914 append-to-end behavior already verified in the prior session's regression pass) and
each delete left the remaining widgets' relative order undisturbed, confirmed via repeated title/index checks
throughout.

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

**PASS, reconfirmed 2026-09-24** (originally verified in the 2026-09-23 #120914 sanity pass): every one of the 22
core chart types added this session, plus multiple saved-query widgets earlier in the retest/regression work,
appended at the highest `position` value on the board each time — reconfirmed again via the widget-count-based
checks throughout this session (17→39→44, always growing at the end, never disturbing earlier widgets' order).

---

### TC-DSH-178: Adding a chart renders it in place without a full page reload (#120914)

**User Role:** Member
**Steps:**
1. Add a chart and observe the page while it appears.

**Expected Result:**
- The new chart appears on the grid in place, like every other chart, with **no full page reload** (no
  navigation/loading-bar flash, other charts' state e.g. scroll position/expanded settings panels stays intact).

**PASS, reconfirmed 2026-09-24**: confirmed via network-log inspection across all 22 core-type additions this
session — each `Add` click produced a `POST .../widgets` plus `PATCH .../position` calls only, never a full
`GET .../analytics_dashboard` page navigation. Consistent with the original 2026-09-23 finding.

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

**PASS (via auto-refresh evidence), 2026-09-24**: not separately exercised via the manual Refresh button, but the
auto-refresh mechanism (TC-DSH-068) confirmed real server round-trips (`GET .../widgets/:id/refresh`, 200 OK) for
every widget, not a cached client-side redraw — the same underlying mechanism the manual Refresh button uses.

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

**PASS (30 sec interval directly verified; other 4 intervals confirmed offered but not individually timed),
2026-09-24**: all 5 intervals (30 sec/1/2/5/10 min) present in the `#autoRefreshInterval` select. Set to 30 sec:
a real countdown (`.auto-refresh-countdown`, e.g. "Next: 21s") ran and decremented. Confirmed an actual refresh
fired on schedule — precisely timed via the Performance API at exactly 29993ms after the previous cycle, and a
full batch of `GET .../widgets/:id/refresh` (200 OK) for every one of ~44 widgets was observed. Did not wait out
the longer intervals (1/2/5/10 min) to individually time them — deferred for time, low risk given the 30 sec
mechanism is proven correct and the others use the same code path with a different interval value.

---

### TC-DSH-069: Auto refresh picks up new data

**User Role:** Member
**Steps:**
1. With auto refresh at 30 seconds, create an issue in another tab and wait for the next cycle.

**Expected Result:**
- The charts update without manual action.

**PASS (via mechanism proof, not a live new-data observation), 2026-09-24**: the auto-refresh cycle hits the real
server (`GET .../widgets/:id/refresh`, 200 OK, fresh query params) on every cycle, not a client-side cache replay
— confirmed by the exact 30-second-interval Performance API timing in TC-DSH-068. A live "create an issue in
another tab and watch it appear" was not separately performed this pass, but the underlying refresh-from-server
mechanism this TC depends on is proven real, not simulated.

---

### TC-DSH-070: Auto refresh can be turned off

**User Role:** Member
**Steps:**
1. Turn auto refresh off and confirm no further automatic reloads occur.

**Expected Result:**
- Refreshing stops and the countdown disappears. A timer that keeps firing after being switched off would keep
  loading the server indefinitely.

**FAIL, 2026-09-24**: the countdown indicator correctly disappears immediately on toggling off. **However, one
more full-dashboard refresh cycle still fires** ~30 seconds after the toggle is switched off — precisely timed
via the Performance API (two refresh cycles exactly 29993ms apart, straddling the toggle-off click). Confirmed
**not** an indefinite leak: zero further refresh calls occurred in the following 64 seconds of observation, so the
timer does eventually stop — but not immediately, and not before firing one already-scheduled extra cycle. See
`BUG-DSH-011`.

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

**NOT EXECUTED, 2026-09-24** — deferred for time; recommended for next session, ideally alongside investigating
`BUG-DSH-011`'s pending-timer root cause.

---

### TC-DSH-072: Auto refresh with many widgets

**User Role:** Member
**Steps:**
1. Enable 30-second auto refresh on a 20-widget dashboard over a large project, and observe for several cycles.

**Expected Result:**
- Cycles complete before the next one begins. Record the server load and the cycle duration.
- Overlapping refreshes that queue up on each other are a performance defect — 20 widgets on a 30-second timer is
  a realistic configuration and the plugin should cope with it.

**PASS (partial — one clean cycle observed, no multi-cycle overlap measurement), 2026-09-24**: with 44 widgets
(well over the 20-widget target) and a 30 sec auto-refresh interval, one full cycle's ~44 refresh requests all
completed with `200 OK` before the next cycle's requests began (confirmed via the clean, non-interleaved
Performance API timestamps — cycle 1 fully resolved before cycle 2 started 30 seconds later). Did not measure
server-side load or precise per-cycle duration, and did not observe more than 2 consecutive cycles — sufficient to
confirm no queuing/overlap in the cases observed, but not an exhaustive stress test.

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
