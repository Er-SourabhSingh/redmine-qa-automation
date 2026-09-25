# Bug Report Template

- Bug ID: BUG-DSH-018
- Production Redmine Issue ID: #121284
- Title: A failed widget refresh leaves the chart silently showing stale data, with no visible error to the user
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-24

## Steps to reproduce

1. On a project's Dashboard with widgets already rendered, intercept and fail all
   `GET .../widgets/:id/refresh*` requests (simulated here via Playwright route interception,
   `route.abort('failed')` — equivalent to the browser going offline mid-request).
2. Click the **Refresh** button in the dashboard header.
3. Observe the chart card and the page for any error indication.

## Expected result

- Per the TC's own documented expectation: "A visible error rather than charts silently showing stale data as if
  current."

## Actual result

- After the refresh request fails, the "Issues by Status" widget keeps showing its previous data (total 725,
  unchanged) with **no visual indication anything went wrong** — no error text on the card, no toast, no alert
  element anywhere in the DOM (`document.querySelectorAll('[class*="error"], [class*="toast"], [class*="alert"]')`
  found nothing visible after the failed refresh).
- The chart looks exactly as if the refresh had succeeded and there was simply nothing new to show — a user has
  no way to know the data on screen might be out of date because the last refresh attempt actually failed.
- Did not conclusively verify the auto-refresh recovery half of this TC ("recovers when network returns instead of
  stopping permanently") — after restoring the network (removing the route interception) and clicking Refresh
  again, no `.../refresh` network request was observed at all within the 2s window checked, which may indicate the
  manual Refresh button uses a different mechanism than the per-widget auto-refresh cycle (already proven to hit
  the server correctly in `BUG-DSH-011`'s investigation) — recommend a future session verify recovery specifically
  via the auto-refresh cycle rather than the manual button.

## Evidence

### Console / log

- Route interception: `page.route('**/widgets/**/refresh*', route => route.abort('failed'))`, then Refresh button
  clicked.
- Post-failure state: "Issues by Status" widget total unchanged at `725`; `noDataOrErrorShown` check (searching
  card text for "No Data"/"Error"/"Failed") returned `false`; no toast/alert/error element present in the DOM.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`.

## Retest — 2026-09-25 (superseded, see below)

**Initial retest via the header Refresh button found no change and was marked "still open."** This was a testing
error, not an accurate retest — see the corrected retest below.

## Retest correction — 2026-09-25

Before re-attempting, checked the production issue (#121284) for the developer's note. **Prashant Chaurasia's
fix comment explained the original retest method was invalid**: the header **Refresh button performs a full page
reload (`location.reload()`)** — it never calls `.../widgets/:id/refresh` at all, so blocking that endpoint and
clicking the header button doesn't exercise the failing path; the page just reloads and re-renders server-side
with genuinely current data. The actual failure path — and the one the fix targets — is the **auto-refresh
cycle**, which does call the per-widget endpoint.

**Retested correctly via auto-refresh, FIXED.** Blocked `.../widgets/:id/refresh*` again, this time left
auto-refresh running (30s interval) instead of clicking the header button, and waited a full cycle (35s):
- Every widget card now gets marked `chart-card--stale` with an amber-toned border
  (`rgb(240, 195, 109)` on two edges) and a badge reading **"Could not refresh — data may be out of date"** —
  confirmed across all ~53 unique widgets on the dashboard.
- Toast notifications appeared (`toast-notification toast-error`, "Could not refresh the dashboard. The data
  shown may be out of date.") — several were caught this pass (4, vs. the developer's own retest noting "one
  per burst"), but the core complaint (zero indication at all) is unambiguously resolved either way.
- **Recovery confirmed**: unblocked the endpoint, waited another cycle — stale markers progressively cleared as
  each widget's own refresh succeeded (dropped from ~53 to 15 mid-cycle, then to **0** after the next full cycle/
  page reload), with no leftover stale state and no action required from the user.

Matches the developer's own fix description and retest exactly. Confirmed FIXED, ready to close.
