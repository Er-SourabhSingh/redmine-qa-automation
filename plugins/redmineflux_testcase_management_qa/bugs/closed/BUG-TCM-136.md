# Bug Report Template

- Bug ID: BUG-TCM-136
- Production Redmine Issue ID: #128024
- Title: `:manage_milestones` plugin permission is registered but never checked anywhere (dead permission)
- Redmine version: 6.x (Docker, localhost:3000, Postgres)
- Plugin name: Redmineflux Testcase Management
- Plugin version: branch `release/7.3.0`/`master`, commit `60fa4ae` (Milestones feature, rftc-033/034, Release 7.3.0)
- Environment: Local QA Docker instance (redmine6-redmine-1)
- Browser: N/A (code-review finding, confirmed via source read — not a UI-observable bug)
- User role: Admin (for source inspection); confirmed with `daisy.skye` / `luna.blossom` for the permissions that DO gate real actions
- Date: 2026-11-11

## Steps to reproduce

1. Read `app/services/testcase_management/milestones.rb` — it defines `Milestones.can_manage?(project, user)`,
   which checks `user.admin? || user.allowed_to?(:manage_milestones, project)`.
2. Read `app/controllers/testcase_milestones_controller.rb` — every action is gated by one of:
   - `authorize_milestones_access` (calls `Milestones.can_view?`, i.e. `:view_milestones`) — for `index`, `show`,
     `report`, `burndown`.
   - `authorize_version_management` (calls `Milestones.can_create_version?`, i.e. Redmine's own core
     `:manage_versions` — explicitly commented "Creating the Version itself is Redmine's own right, never ours")
     — for `quick_create`, `close`, `reopen`.
3. Grep the whole plugin for any caller of `Milestones.can_manage?` or a direct check of `:manage_milestones`
   outside of its own definition.

## Expected result

- Every plugin permission registered in `init.rb` (`permission :manage_milestones, {}`) should be enforced by at
  least one real, reachable code path — otherwise a role admin configuring permissions in
  Administration → Roles has a checkbox that visibly does nothing, which is confusing and misleading about what
  granting/revoking it actually controls.

## Actual result

- `:manage_milestones` is registered as a plugin permission (visible and togglable on the Roles & Permissions
  page) and has a dedicated service method (`Milestones.can_manage?`) ready to check it, but **no controller
  action, view, or any other code path in the plugin ever calls `can_manage?` or checks `:manage_milestones`
  directly.** It is dead code / a dead permission — toggling it on or off for any role has zero observable effect
  anywhere in the plugin. All three actual write-actions (`quick_create`, `close`, `reopen`) are instead gated by
  Redmine's own core `:manage_versions` permission via `can_create_version?`.
- Confirmed via source read (not reproducible as a live UI defect, since there's nothing to click that would
  reveal the difference) — grep for `manage_milestones` across the plugin only matches its own definition in
  `init.rb` and `milestones.rb`.

## Evidence

### Screenshot

N/A — this is a dead-code/unused-permission finding confirmed via source inspection, not a UI-reproducible defect.
`view_milestones` and (indirectly, via `manage_versions`) milestone write-actions were separately confirmed live
(403/404 as expected) for RFTC033-4/RFTC034-11 in `testcases/RFTC-033_EXTERNAL_SPEC_MILESTONE_SUMMARY_REPORT.md`
and `testcases/RFTC-034_EXTERNAL_SPEC_MILESTONE_BURNDOWN_FORECAST.md`.

### Retest screenshot (fill after fix is verified)

N/A

### Console / log

- `app/services/testcase_management/milestones.rb:30-34` — `can_manage?` defined, never called elsewhere.
- `app/controllers/testcase_milestones_controller.rb:142-146` — `authorize_version_management` calls
  `can_create_version?`, not `can_manage?`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest (2026-11-11, after `master` pull to commit `9785d2c`)

**CONFIRMED FIXED — `:manage_milestones` now genuinely gates real behavior**, re-verified live (not just source
read this time):

1. **With permission** (`luna.blossom`, Manager role — `manage_milestones: true`): opened the real Edit Run modal
   (via the actual edit icon on `/runs/new`, not the broken direct-URL fallback) for Run #1 — the **Milestone**
   combobox is present, listing all open milestones. Selected "Pagination Milestone 006", clicked **Update** —
   confirmed via DB (`Run.find(1).version_id` → `19`, `milestone.name` → `"Pagination Milestone 006"`) that the
   link was saved for real through the live UI flow.
2. **Without permission** (`aurora.wren`, Reporter role — `manage_milestones: false`, but `edit_run: true`):
   opened the same Edit Run modal for a different run — **no Milestone field anywhere** in the modal (confirmed by
   searching the full accessibility snapshot for "Milestone" — zero matches inside the form), and the Runs table's
   own **Milestone column is also absent** for this role (present for Manager/Admin).
3. **Server-side enforcement**: as `aurora.wren`, sent a direct authenticated `PUT /runs/41` with
   `run[milestone_id]=19` (bypassing the UI) → **403**, and the run's `version_id` was confirmed unchanged in the
   DB afterward.
4. **"Add run for this milestone" button**: present on the milestone detail page for `luna.blossom`
   (`+ Add run for this milestone` → `/runs/new?milestone_id=19&...`); `aurora.wren` can't even reach the milestone
   page at all (403 — she also lacks `:view_milestones`, consistent with her role).

Developer's production comment (#128024) matches exactly: 6 new automated tests on `master`
(`test/functional/bug_tcm_136_manage_milestones_test.rb`) plus this session's live re-verification. No code change
was needed per the developer — the permission was already wired correctly; the original finding's own source-grep
method just didn't see the checks (they live in `runs_controller.rb`'s `rftc_prepare_milestone_param`/
`rftc_authorize_run_update`, not in `testcase_milestones_controller.rb`).

**Unrelated observation (not filed as a bug — dead/unreachable code, zero user impact):** while testing, direct
navigation to `/runs/:id/edit` (format=html, bypassing the real AJAX-modal flow) renders a completely blank
`#content` for every user including admin — `app/views/runs/edit.html.erb` has `<% render partial: 'edit_form' %>`
(missing the `=` that would actually output the partial). This file has had this bug since the view was created in
March 2025 (`a3f6568`); it is never hit by the real UI (the modal always opens via `edit.js.erb`, triggered by
clicking the run's edit icon), so it causes no observed defect in day-to-day use — flagging for awareness only.
