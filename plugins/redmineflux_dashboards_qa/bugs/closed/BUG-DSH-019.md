# Bug Report Template

- Bug ID: BUG-DSH-019
- Production Redmine Issue ID: #121285
- Title: Any authenticated user can open ANY private project's Analytics Dashboard and see its real chart data, even with zero project membership — the dashboard controller performs no project-access check at all
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: **Summer Rain** — a member of **"test project" only**; confirmed **zero membership** of
  "QA Private Project" (its Members tab shows "No data" — no members at all, not even Admin listed explicitly)
- Date: 2026-09-24

## Steps to reproduce

1. Confirm "QA Private Project" (`/projects/qa-private-project`) is genuinely private: Settings → General →
   "Public" checkbox unchecked (`project_is_public` = false), and its Members tab shows no members.
2. As Admin, add an "Issues by Status" widget to that project's dashboard so there is real data to disclose
   (widget id 137, 1 issue).
3. Log in as `summer.rain` / `12345678`, a user who is **only** a member of the unrelated "test project" — never
   added to "QA Private Project" in any role.
4. As Summer Rain, request `http://localhost:3010/projects/qa-private-project/analytics_dashboard` directly.
5. For comparison, as the same user, request `http://localhost:3010/projects/qa-private-project/issues`.

## Expected result

- Per `TC-DSH-099`/`TC-DSH-102`: a non-member must be refused access to a private project's dashboard and its
  data endpoints, with no chart values, widget titles, or project metadata in the response — exactly as every
  other project controller already enforces.

## Actual result

- **The Dashboard route serves the full page with no access check whatsoever.** As Summer Rain, requesting
  `/projects/qa-private-project/analytics_dashboard` returned the complete, normally-rendered dashboard: the real
  project name in the header/breadcrumb, the full project navigation menu, and the "Issues by Status" widget
  **rendering real data** (`Chart.getChart(canvas).data.datasets[0].data` summed to `1`, matching the actual
  issue count on that private project) — not an empty shell, not a permission page.
- **Direct proof this is a dashboard-specific gap, not a membership mixup**: the *same session, same user*,
  requesting `/projects/qa-private-project/issues` immediately afterward correctly received **403 Forbidden**
  (standard Redmine core enforcement). Every other controller on this private project correctly blocks her; only
  the Analytics Dashboard controller does not.
- This is distinct from, and more severe than, the equal-capabilities-for-any-member design confirmed elsewhere
  in this plugin (originally misfiled as `BUG-DSH-015`, retracted 2026-09-25 once the vendor KB confirmed that
  "any user with access to the project" having equal dashboard capabilities is intentional): that design question
  is about role-permission *within* a project the user is already a member of. This bug is about **project
  membership itself not being checked at all** — a user needs no relationship to the project whatsoever, which
  the KB's own "any user with access to the project" language does not extend to cover.
- A write attempt (`POST .../widgets` with a guessed payload) returned 400, which is inconclusive (likely a
  malformed request body rather than a genuine permission block) — not confirmed either way, but irrelevant to
  the severity here: the **read** disclosure alone (real aggregate data from a project the user has zero
  relationship to) is a complete, unambiguous cross-project data leak on its own.

## Evidence

### Screenshot

![Summer Rain, not a member of QA Private Project, viewing its full dashboard with real widget data](../../screenshots/BUG-DSH-019/summer-rain-non-member-full-private-dashboard-access.png)

### Console / log

- `/projects/qa-private-project/settings/members` (as Admin): page body shows "No data" — zero members.
- `/projects/qa-private-project/settings` (as Admin): `#project_is_public` checkbox `checked = false`.
- As `summer.rain`: `GET /projects/qa-private-project/analytics_dashboard` → 200, full dashboard rendered, widget
  137 ("Issues by Status") chart data `[1]` (sum 1), matching the real project data.
- As `summer.rain`, immediately after: `GET /projects/qa-private-project/issues` → **403 Forbidden** (confirms she
  is genuinely unauthorized for this project via every normal Redmine control).

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Not the same finding as the retracted
  `BUG-DSH-015` (see note above) — this bug is specifically about project membership never being checked at all,
  not about which capabilities a member has once inside a project they do belong to.

## Retest — 2026-09-25

**FIXED.** Logged in as Summer Rain (still confirmed a member of "test project" only, zero relationship to "QA
Private Project") and repeated the exact original request on `redmine-docker-700`:
`GET /projects/qa-private-project/analytics_dashboard` now returns **403 Forbidden**, with a clean, generic
access-denied page — no project name, no chart data, no widget content anywhere in the response body. The
dashboard controller now enforces project membership the same way every other controller on this instance already
did. Confirmed FIXED, ready to close.
