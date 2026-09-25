# Plugin Memory — Redmineflux Timesheet Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- **Team mode: top-menu "Timesheet" visibility comes from the *team membership* role, not the project role.** A team member added with Role "None" can't see the Timesheet menu even when their project role has `view_timesheets`. Set a team role (e.g. Developer) on the member. (2026-09-25)
- Weekly **Submit Timesheet** (team mode) creates a `timesheet_submissions` row, a `timesheet_approval_instances` row (`pending`) and a `timesheet_entry_locks` row for the week.

## Confirmed Working

- Bulk user delete (Administration → Users → Delete) of a user with a submitted timesheet: cascades cleanly, no 500 (BUG-TMS-001 retest PASS, 2026-09-25).

## Recurring Issues

- (none recorded yet)

## Environment Notes

- **Docker 7 (localhost:3010): plugin migrations don't run on container restart.** After any timesheet plugin source update, run `docker exec redmine-docker-700-redmine-1 bash -lc 'cd /usr/src/redmine && RAILS_ENV=production bundle exec rake redmine:plugins:migrate NAME=redmineflux_timesheet'`, then restart again. (Migration 019 was missing on 2026-09-25 until this was run.)
- Timesheet fixtures on localhost:3010: team 6 "Artificial Intelligence Team" (schema "three level schema": L1 Manager, L2 Reporter). Members are admin (Reporter) and aurora.wren #5, who owns submissions #1 (approved) and #2 (rejected). Don't delete #5; it looks like a real working account.

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/timesheet/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
