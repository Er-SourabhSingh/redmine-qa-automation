# Bug Report Template

- Bug ID: BUG-DSH-014
- Production Redmine Issue ID: #121274
- Title: Dashboard widgets can be added on a closed project — the plugin doesn't enforce Redmine's "closed = read-only" convention
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-24

## Steps to reproduce

1. Confirm a project's status is **Closed** (e.g. the existing "QA Closed Test Project" fixture — confirmed via
   its Overview page showing a "Closed" status indicator and no "New Issue" link, the standard Redmine read-only
   signal).
2. Open that project's Dashboard tab.
3. Click **Add Chart** and add any widget.
4. Reload the page.

## Expected result

- Per `TC-DSH-106`: "Closed projects are read-only" — consistent with standard Redmine behavior, where a closed
  project blocks new issues, time entries, etc.

## Actual result

- The **Add Chart** button is present and enabled (not disabled/hidden) on the closed project.
- Adding a widget **succeeds** — the `POST .../widgets` call completes, and the new widget is still present after
  a full page reload, confirming it was genuinely persisted server-side, not just a client-side illusion.
- The Dashboard plugin does not participate in Redmine's closed-project read-only convention at all.

## Evidence

### Console / log

- Widget count on "QA Closed Test Project"'s dashboard: `0 → 1` after Add, confirmed still `1` after a full page
  reload.
- Project confirmed Closed (not merely a naming artifact): Overview page shows a "Closed" status indicator and no
  "New Issue" link is offered, the standard Redmine signal for a closed project.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`.

## Notes

- Severity assessed as Low: this does not leak restricted data (unlike `BUG-DSH-013`) and dashboard configuration
  is arguably closer to a personal/team viewing preference than project content — but it's a real, reproducible
  inconsistency with the documented "closed = read-only" contract and with how other content types behave on a
  closed project, so it's recorded rather than dismissed.

## Retest — 2026-09-25

**FIXED.** Re-opened "QA Closed Test Project"'s dashboard (still confirmed Closed via its Overview banner "This
project is closed and read-only.") on `redmine-docker-700`. The **Add Chart** trigger is no longer present in the
DOM's clickable elements at all — only the modal shell (`#addChartModal`, `#confirmAddChart`) remains, permanently
hidden (`offsetParent: null`) with no reachable trigger. The plugin now correctly participates in Redmine's
closed-project read-only convention. Confirmed FIXED, ready to close.
