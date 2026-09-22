# Bug Report

- Bug ID: BUG-LTS-007
- Production Redmine Issue ID: #121062
- Title: Project Overview page shows the "closed and read-only" warning twice under the Lotus theme
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Lotus Theme
- Plugin version: (record installed version)
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-22

## Steps to reproduce

1. Close any project (Actions → Close, or the project's contextual Actions menu).
2. Open that project's Overview page (`/projects/<identifier>`).
3. Observe the "This project is closed and read-only." banner near the top of the page.

## Expected result

- The closed-project warning appears exactly once, as it does on every other project sub-page (Issues, Activity,
  Wiki, etc. — confirmed only one copy there).

## Actual result

- The warning renders **twice** on the Overview page specifically: once above the project's contextual
  Actions/bookmark controls, and again immediately below the "Overview" heading.
- Confirmed via DOM inspection: two separate, identical `<p class="warning">` elements, each independently
  wrapping `<span class="icon icon-lock">This project is closed and read-only.</span>`.
- Confirmed this is **not tied to the active theme setting** — Administration → Settings → Display → Theme is
  currently set to "Default" (not "redmineflux_lotus"), yet the duplicate still renders. Once the Lotus plugin is
  installed, its `app/views/projects/show.html.erb` participates in Rails' view lookup and overrides Redmine
  core's own Overview template regardless of which theme string is actually selected in Settings.
- **Root cause, found by reading `redmineflux_lotus/app/views/projects/show.html.erb`:** the file's very first
  line is `<% unless Setting.ui_theme == 'redmineflux_lotus' %>` — a fallback branch that renders when Lotus is
  *not* the selected theme, followed at line 161 by `<% else %>` for when Lotus *is* selected. **Both branches
  independently reimplement the exact same closed-project check** (`<% unless @project.active? %> <p
  class="warning">...` — at line 27 in the fallback branch, line 195 in the Lotus-active branch), each rendering
  its own "Overview" heading + warning pair. This duplicates the warning Redmine core *already* renders once,
  globally, via the base layout (confirmed: exactly 1 copy on the Issues page for the same closed project, where
  Lotus does not override the view) — Lotus's own view file adds a second, redundant copy, but only on Overview.
- Confirmed the bug reproduces regardless of which of the two Lotus branches (fallback vs Lotus-active) is
  active, since both contain the same redundant check — so this is not resolved by changing the Theme setting.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-LTS-007/duplicate-closed-project-warning-overview.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-LTS-007/retest-yyyy-mm-dd-pass.png)

### Console / log

- Verified via `browser_evaluate`: exactly 2 elements matching "closed and read-only" text on
  `/projects/checklist-perm-private` (Overview), vs. exactly 1 on `/projects/checklist-perm-private/issues`
  (same closed project, Issues tab) — isolating the duplicate to the Overview page / Lotus's own view override.
- Source: `plugins/redmineflux_lotus/app/views/projects/show.html.erb` lines 1, 25-29, 161, 195-197 (local Docker
  mount at `C:\redmine-docker-7.0.0\plugins\redmineflux_lotus\...`).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked `bugs/_duplicates.md` and `bugs/_index.md` before filing.
  Not the same as `BUG-LTS-001`/`BUG-LTS-002`/`BUG-LTS-003`/`BUG-LTS-004`/`BUG-LTS-005`/`BUG-LTS-006` (all closed,
  all different symptoms — sidebar label clipping, tab-strip scroll affordance, Sprint/Story-Points overlap,
  CKEditor button height mismatch, a 404 Configure link, and a subtask-table overflow, respectively).

## Reported by

Found incidentally by the user while reviewing a Checklist-plugin permission-test fixture project
("Checklist Perm Private", closed for `TC-CHK-078` testing) — not part of a planned Lotus test pass. Investigated
and root-caused in this session at the user's request.
