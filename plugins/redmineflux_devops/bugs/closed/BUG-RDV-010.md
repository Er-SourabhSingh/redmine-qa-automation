# BUG-RDV-010

- Bug ID: BUG-RDV-010
- Title: DevOps activity events do not appear in Redmine activity stream — ActivityProvider not registered
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge + Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Admin, Developer (with view_devops)
- Severity: High
- Date: 2026-05-22

## Steps to reproduce

1. Ensure webhook events have been received for project `phoenix-platform` (TC-RDV-001–008 confirm events are logged).
2. Log in as Admin or as a user with `view_devops` permission.
3. Navigate to `Project > Activity` (`/projects/phoenix-platform/activity`).
4. Inspect the activity filter checkboxes in the sidebar.

## Expected result

- "DevOps" activity filter checkboxes are present in the sidebar (e.g., "DevOps Commits", "DevOps Builds", "DevOps Deployments").
- Enabling the DevOps filter shows push events, build results, and deployment updates in the activity feed.
- Filter checkboxes are hidden for users without `view_devops` permission.

## Actual result

- The activity filter sidebar shows only 8 standard Redmine filters: Issues, Changesets, News, Documents, Files, Wiki edits, Messages, Spent time.
- No DevOps activity filter checkboxes are present for any user — including Admin and users with `view_devops`.
- No DevOps events appear in the activity feed.
- Tested with both Admin and daisy.skye (Developer + view_devops) — same result.

## Evidence

- Screenshot path: screenshots/TC-RDV-024/tc-rdv-024-fail.png

## Duplicate check

- Duplicate found: No

## Notes

- Root cause: the plugin's `ActivityProvider` class (if implemented) is not registered with Redmine's activity event system. In Redmine plugins, activity providers must call `Redmine::Activity.register :devops_commits, default: false` etc. in `init.rb` or an initializer.
- This bug also causes TC-RDV-026 (activity type filter) and TC-RDV-038 (permission-based filter visibility) to fail.
- The DevOps panel on issue pages (TC-RDV-025) renders correctly via ViewHook — that is a separate mechanism unaffected by this bug.

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- Navigated to `/projects/phoenix-platform/activity` as admin. Sidebar filter labels: Issues, Changesets, News, Documents, Files, Wiki edits, Messages, Spent time (8 total). No DevOps filter category present for any user role. Screenshot: screenshots/BUG-RDV-010/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- Navigated to `/projects/phoenix-platform/activity` as admin. Activity filter sidebar shows exactly 8 standard Redmine filters: Issues, Changesets, News, Documents, Files, Wiki edits, Messages, Spent time. No DevOps filter checkboxes present. Bug persists.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **CONFIRMED**
- `/projects/agileboard/activity` as admin — activity sidebar contains exactly 8 `name="show_*"` filter checkboxes: `show_issues`, `show_changesets`, `show_news`, `show_documents`, `show_files`, `show_wiki_edits`, `show_messages`, `show_time_entries`. No DevOps activity filter present in sidebar. Bug persists on new Forge.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to `/projects/agileboard/activity` as daisy.skye. Activity sidebar shows 5 DevOps filter categories: `show_devops_commits`, `show_devops_pull_requests`, `show_devops_builds`, `show_devops_deployments`, `show_devops_releases` (some labels show raw i18n keys). ActivityProvider is registered and DevOps events appear in the stream. Bug closed.
