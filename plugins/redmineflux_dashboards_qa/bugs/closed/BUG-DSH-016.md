# Bug Report Template

- Bug ID: BUG-DSH-016
- Production Redmine Issue ID: #121283
- Title: The global date range is not actually remembered across navigation — it silently resets to the default "Last 30 days" instead of the last-applied range
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-24

## Steps to reproduce

1. On a project's Dashboard, set the global Date Range to **This Year** and click Apply.
2. Navigate away to any other page in the same project (e.g. Issues).
3. Navigate back to the project's Dashboard tab (no query-string parameters, as a normal nav-menu click would do).

## Expected result

- Per the vendor KB (fetched directly 2026-09-25, exact quote): **"The dashboard remembers your last used date
  range and reapplies it on the next load."** The scenario tested here — leaving the Dashboard tab and returning
  to it — is squarely "the next load"; the dashboard should reapply **This Year**, not silently fall back to a
  different default.

## Actual result

- On returning to the Dashboard tab, the Date Range selector reset to **Last 30 days** (the plugin's hardcoded
  default) — confirmed both via the `#dateRange` select's own value and via the "Issues by Status" widget's total
  changing back from This Year's total to Last 30 days' total (725, the known Last-30-days baseline for this
  project).
- Checked `localStorage` for any persisted preference: only `autoRefreshEnabled` and `autoRefreshInterval` keys
  exist. **No date-range or tracker-filter preference is stored anywhere client-side**, and the behaviour is the
  same on a same-session in-app navigation, so this isn't a cross-session/cookie-expiry edge case — the "memory"
  described in the KB does not appear to be implemented for the global date range at all (auto-refresh's own
  settings, by contrast, genuinely do persist this way).
- Mitigating factor: the currently-active range **is** visibly and honestly indicated (the `#dateRange` select
  shows the real current value, e.g. correctly shows "Last 30 days" after the reset — it doesn't claim to still be
  on "This Year"), so a user is not shown stale/mismatched data silently — the failure is narrower than the TC's
  worst-case concern ("filter bar shows one thing, charts show another"). The actual gap is that the range simply
  doesn't survive navigation at all, defaulting back every time.

## Evidence

### Screenshot

![Date range reset to Last 30 days default after navigating away and back, despite This Year being applied moments earlier](../../screenshots/BUG-DSH-016/date-range-not-remembered-reset-to-default.png)

### Console / log

- Applied `date_range=this_year` via Apply Filters (real UI interaction, confirmed via URL
  `?date_range=this_year`).
- Navigated to `/projects/test-project/issues`, then back to `/projects/test-project/analytics_dashboard` (no
  query string).
- `document.getElementById('dateRange').value` read back as `"last_30_days"`, and "Issues by Status" widget's
  total was `725` (the Last-30-days figure), not This Year's larger total.
- `Object.keys(localStorage)` on the dashboard page: `autoRefreshEnabled`, `redmine-sidebar-state-*` (several,
  core Redmine UI state, unrelated), `autoRefreshInterval` — no date-range/tracker key present.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`.

## Retest — 2026-09-25

**FIXED.** Set the global Date Range to **This Year** and applied it on `redmine-docker-700` (test project),
navigated away to Issues, then back to the Dashboard tab with no query string — the `#dateRange` selector correctly
read back `"this_year"`, not reset to the default. Repeated with a full page reload for good measure — same result.
Cross-checked the underlying data, not just the selector's displayed value: the "Issues by Status" widget showed
**504** (This Year's real total), not the stale Last-30-days baseline of 725 — confirming the range is genuinely
re-applied server-side, not just cosmetically remembered. Confirmed FIXED, ready to close.
