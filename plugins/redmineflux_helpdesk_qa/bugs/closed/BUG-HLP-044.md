# BUG-HLP-044

- Bug ID: BUG-HLP-044
- Title: `rake redmineflux_helpdesk:auto_close_tickets` is completely non-functional — it reads a legacy `ProjectCustomField` that no longer exists on this instance, so it can never close a ticket regardless of any project's real Auto Close Ticket Days configuration
- Production Redmine Issue ID: #120376 (ztflux)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-09)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (server-side rake task; setup done via Playwright MCP)
- User role: System Administrator (server access)
- Date: 2026-09-09

## Steps to reproduce

1. Set a project's **Auto Close Ticket (Days)** to a real value (e.g. `1`) via Helpdesk → Helpdesk Settings → Email Configuration — the current, real config path.
2. Ensure at least one eligible ticket exists (open status, silent past the threshold).
3. Run `bundle exec rake redmineflux_helpdesk:auto_close_tickets` from the Redmine root.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §23 ("`rake redmineflux_helpdesk:auto_close_tickets` — Run the auto-close pass once") and `HELPDESK_RAKE_TASKS.md` TC-HLP-217 ("The eligible ticket is closed immediately — identical outcome to the scheduled auto-close job"), the rake task should produce the same result as the real scheduled `Helpdesk::AutoCloseTicketsWorker` — closing any eligible ticket per the project's real, currently-configured Auto Close Ticket Days.

## Actual result

**The rake task never closes anything, for any project, regardless of configuration.** Confirmed live:

- Set Auto Close Ticket Days = 1 on Helpdesk QA Alpha via the real Email Configuration UI.
- Created two eligible tickets (backdated `updated_on` past the threshold — one Resolved, one New).
- Ran `bundle exec rake redmineflux_helpdesk:auto_close_tickets` — output: "Starting auto-close tickets task..." / "Auto-close tickets task completed..." with **no project processed, no ticket closed, no error**.
- Both tickets remained in their original status after the rake task ran.
- Immediately afterward, manually invoking the real worker class directly (`Helpdesk::AutoCloseTicketsWorker.new.perform`) on the exact same data **did** close both eligible tickets — proving the config and the eligible tickets were both genuinely correct; only the rake task's own code path failed to act.

Root-caused via source (`lib/tasks/auto_close_tickets.rake`):

```ruby
Project.active.has_module(:helpdesk).each do |project|
  auto_close_days_field = ProjectCustomField.find_by(name: 'helpdesk_auto_close_days')
  next unless auto_close_days_field
  auto_close_days = project.custom_value_for(auto_close_days_field)&.value&.to_i
  ...
```

This reads a **legacy** `ProjectCustomField` named `helpdesk_auto_close_days` — the old, pre-migration configuration mechanism. The real, current configuration lives in the `RfHelpdeskEmailConfig` table (read correctly by the actual scheduled worker via `RfHelpdeskEmailConfig.for_project(project)&.auto_close_days`), per `RfHelpdeskEmailConfig`'s own model-file comment: *"These used to be seventeen `is_for_all` ProjectCustomFields... A table of their own costs none of that."* Confirmed live: `ProjectCustomField.where(name: 'helpdesk_auto_close_days')` returns empty, and **zero `ProjectCustomField` rows exist on this instance at all** (`ProjectCustomField.pluck(:name) == []`). Since `auto_close_days_field` is always `nil`, `next unless auto_close_days_field` fires unconditionally for every project, on every run, regardless of what any project's real Email Configuration says.

## Evidence

### Console / log

- Rake task output, in full, on a run with 2 genuinely eligible tickets present and Auto Close Ticket Days = 1 set: `Starting auto-close tickets task at ... / Auto-close tickets task completed at ...` — no `"Processing project:"` line, no `"Closed issue"` line, nothing between the start/end banners.
- Confirmed via `rails runner`: `ProjectCustomField.where(name: 'helpdesk_auto_close_days').to_a == []` and `ProjectCustomField.pluck(:name) == []` (zero custom fields of any kind on this instance).
- Confirmed via `rails runner`, same moment: `RfHelpdeskEmailConfig.for_project(Project.find_by(identifier: 'helpdesk-qa-alpha'))&.auto_close_days == 1` — the real, current config was correctly set and readable; the rake task simply never looks at it.
- Confirmed the fix path exists and works: invoking `Helpdesk::AutoCloseTicketsWorker.new.perform` directly (the real worker, reading the real config table) against the identical data closed both eligible tickets immediately (see BUG-HLP-043 for the closely related, separate scope defect found in that same worker run).

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): None filed, but **the identical dead-code pattern was already independently observed and documented (not filed as a bug at the time) for a sibling rake task**, `check_emails`, per `HELPDESK_MEMORY.md`: *"the `check_emails` rake task is dead code — it still reads the legacy `ProjectCustomField` config the UI stopped writing to after a migration to `RfHelpdeskEmailConfig`, while the real scheduled Sidekiq `EmailPollerWorker` correctly uses the new model."* This is the same migration-cleanup gap recurring on a second rake task. Recommend auditing every rake task in `lib/tasks/` for the same legacy-`ProjectCustomField` read pattern rather than fixing this one in isolation — `check_emails` likely needs the identical fix and is not yet filed as its own bug.

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120376 checked in)

**CONFIRMED FIXED.** Preconditions: container restarted this session; Redis + Sidekiq were found NOT running after the restart (only Puma auto-restarts on this container) and were started manually before retesting.

- Note on the Email Configuration UI's real location, discovered while re-navigating for this retest: the per-project `/projects/:id/helpdesk/settings` page (`RfProjectHelpdeskController#settings`) only has 3 tabs (Holiday, Products, Support Level) — no Email Configuration tab at all. The real Email Configuration form lives on the plugin's top-level "Helpdesk Command Center" settings page, `/rf_helpdesk/setting?tab=email_configuration&config_project_id=<id>` (`RfHelpdeskController#setting`), with a Project selector — confirmed via `save_email_configuration`'s own redirect target in `rf_project_helpdesk_controller.rb`. Not itself a defect (the per-project page never claimed to host it), just a real navigation gotcha worth recording so the next session doesn't re-lose time on it — added to `HELPDESK_MEMORY.md`.
- Set Auto Close Ticket Days = 1 on Helpdesk QA Alpha via that real Email Configuration UI.
- Created a fresh eligible-setup ticket (#336), backdated `updated_on` 2 days via `rails runner` (setup only).
- Ran `bundle exec rake redmineflux_helpdesk:auto_close_tickets` for real: output now shows genuine per-project processing — `Processing project: Helpdesk QA Alpha (auto_close_days: 1)`, `Processing project: Redmineflux Helpdesk (auto_close_days: 5)` — closing 43 real eligible (Resolved + silent) tickets across both projects (e.g. `✓ Closed issue #87: TC-HLP-151 auto-close disabled test - Auto Close Ticket Days blank`), a world apart from the original "no project processed, no ticket closed, no error" silent no-op.
- Root-caused the fix via source (`lib/tasks/auto_close_tickets.rake`): now reads `RfHelpdeskEmailConfig.for_project(project)&.auto_close_days` — the real, current config table — replacing the old dead `ProjectCustomField.find_by(name: 'helpdesk_auto_close_days')` lookup (confirmed still `ProjectCustomField.count == 0` on this instance, so the old code path would still always no-op if it were still there).
- Bonus finding: the same fix pass also corrected BUG-HLP-043's scope defect in this exact rake task (now filters `.where(status_id: resolved_status.id)` instead of the old unscoped `.open`) — see BUG-HLP-043's own retest for the dedicated verification; ticket #336 (status New) was correctly left untouched by this same rake run.
- This is also the natural retest for TC-HLP-217 in `HELPDESK_RAKE_TASKS.md` ("`auto_close_tickets` run by hand closes eligible tickets") — now genuinely PASS, matching the scheduled worker's behavior as originally promised.
- Cleanup: Auto Close Ticket Days reset back to blank on Helpdesk QA Alpha afterward.
- Not retested here (separate, still-open bug, not part of this bug's scope): the sibling `check_emails` rake task's identical legacy-`ProjectCustomField` pattern — this bug's own Notes section already flagged that task as needing an audit for the same fix; it has not yet been independently confirmed fixed.

## Notes

- Found while executing `HELPDESK_EMAIL.md` TC-HLP-150/153 — the rake task was tried first (as the lower-risk way to trigger the job), found to do nothing, and that investigation led directly to this root cause before falling back to invoking the real worker class to actually test the scheduled-job behavior (TC-HLP-153/BUG-HLP-043).
- This is the natural home for TC-HLP-217 in `HELPDESK_RAKE_TASKS.md` ("`auto_close_tickets` run by hand closes eligible tickets") — that TC's own Expected Result ("identical outcome to the scheduled auto-close job") is now confirmed FAIL; see that suite for the formal TC write-up.
- Severity judged **Medium**, matching the precedent set by not-yet-filed `check_emails`: no data corruption or security impact, but a real, complete functional failure of a documented, user-facing rake task (any admin who runs it expecting it to match the real background job's behavior gets silent inaction, no error, no log line indicating why).
- Recommend: update `lib/tasks/auto_close_tickets.rake` to read `RfHelpdeskEmailConfig.for_project(project)&.auto_close_days` exactly as the real worker does (or better, have the rake task simply call `Helpdesk::AutoCloseTicketsWorker.new.perform` directly, so there is only one implementation to keep correct) — and audit `check_emails` for the identical fix at the same time, since both share the same legacy-config-source root cause.
