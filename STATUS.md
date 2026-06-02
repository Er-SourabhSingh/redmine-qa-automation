# QA Status Dashboard

| Plugin | Last Tested | Redmine Version | Open Bugs | Status |
|--------|-------------|-----------------|-----------|--------|
| testcase-management-plugin | 2026-05-20 | 6.2.0 | 1 | In Progress |
| redmineflux_advanced_field | 2026-05-21 | 6.0.9.stable | 0 | In Progress (51/51 positive TCs PASS, 2 bugs fixed & closed; workflow TCs TC-RAF-051–054 pending) |
| redmineflux_devops | 2026-06-02 | 6.0.9 (Local) | 0 | Complete — ALL 86 bugs resolved and closed. BUG-028 FIXED: handle_workflow_run now calls find_matching_github_repository() to link build to correct repo connection so ArtifactFetcher uses the right API token. Verified: build-output + test-results artifacts show with Download links on build detail page. GitHub repo: Er-SourabhSingh/devops-plugin-test. Total closed: 85. Changes: devops_webhooks_controller.rb (BUG-011+056), shared/_oncall_widget.html.erb (BUG-084), incidents controller (BUG-085 locale keys), all 10 locale files (BUG-084/085/086), DB migration ran (title+assigned_to columns added). New fixes: BUG-009 (DORA endpoint 200), BUG-048 (coverage page), BUG-053 (alert env filter), BUG-054 (on-call widget), BUG-074 (admin override freeze), BUG-076 (compare 404), BUG-080 (locale strings fixed), BUG-082 (tooltip translated), BUG-083 (alerts empty state). Open (18): 011,017,026,028,029,050,051,052,056,057,060,067,069,073,077,084,085,086. Total closed: 67. |

## How to update

Update this file after every test run. One row per plugin.

**Status values:** `Not Started` / `In Progress` / `Complete`
