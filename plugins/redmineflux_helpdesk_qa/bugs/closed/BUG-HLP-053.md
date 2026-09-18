# BUG-HLP-053

- Bug ID: BUG-HLP-053
- Production Redmine Issue ID: #120504 (ztflux)
- Title: `seed_demo_data` silently renames and repurposes ANY project whose identifier happens to be the legacy `helpdesk-support` slug, with no check that it's actually old demo data
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (server-side rake task; investigated via source review, per the same rule applied to BUG-HLP-044)
- User role: System Administrator (server access)
- Date: 2026-09-11

## Steps to reproduce

1. On any Redmine instance, have an admin create a real, unrelated project whose identifier is exactly `helpdesk-support` (e.g. a project literally named "Helpdesk Support" — Redmine's default slugification gives it exactly this identifier) — nothing to do with the helpdesk demo seeder.
2. As long as no project with identifier `redmineflux-helpdesk` exists yet on that instance, run `bundle exec rake redmineflux_helpdesk:seed_demo_data`.

## Expected result

A rake task explicitly meant to create/populate its own isolated demo project should never silently take over an admin's unrelated, real project just because of an identifier coincidence — at minimum it should verify the matched project actually looks like prior demo data (e.g. already has the Support tracker, or some marker of having been seeded before) before reusing/renaming it, or should refuse and warn instead of proceeding silently.

## Actual result

Source (`lib/tasks/seed_demo_data.rake`, `seed_project`, lines 368-390):

```ruby
def seed_project
  @project = Project.find_by(identifier: PROJECT_IDENTIFIER)
  @project ||= Project.find_by(identifier: LEGACY_PROJECT_IDENTIFIER)

  if @project
    if @project.identifier != PROJECT_IDENTIFIER || @project.name != PROJECT_NAME
      @project.update_columns(identifier: PROJECT_IDENTIFIER, name: PROJECT_NAME)
      say "  renamed existing project ##{@project.id} to \"#{PROJECT_NAME}\" (#{PROJECT_IDENTIFIER})"
    else
      say "  reusing existing project ##{@project.id}"
    end
  else
    ...
  end
```

The lookup is **purely by identifier** (`redmineflux-helpdesk`, falling back to the legacy `helpdesk-support`) — there is no check anywhere in this method for whether the matched project actually is (or ever was) helpdesk demo data: no check for the Support tracker, no check for existing helpdesk tickets, no marker custom field, nothing. If the legacy-identifier branch matches, the project is renamed via `@project.update_columns(identifier:, name:)` — a direct column write that bypasses ActiveRecord validations and callbacks — and then immediately has 25 fake NovaCrest Technologies support tickets, organizations, customers, SLAs, etc. seeded into it (`seed_tickets` et al., same method, run unconditionally afterward on `@project`).

Concretely: any admin who happens to have created a real project with the identifier `helpdesk-support` (which is exactly what Redmine's own default slug rules produce for a project literally named "Helpdesk Support" — a perfectly ordinary, plausible real project name for an unrelated internal support desk) would have that project **silently renamed to "Redmineflux Helpdesk" and populated with fake demo tickets** the next time anyone runs this task, with zero confirmation prompt and no warning in the task's own output beyond a one-line "renamed existing project #N" message that gives no indication anything unusual or risky just happened.

This was found while investigating `HELPDESK_RAKE_TASKS.md` TC-HLP-224, which originally assumed the collision risk was **name**-based ("a project already named 'Helpdesk Support'"). That's not quite accurate — the real trigger is **identifier**-based — but for the single most natural real-world way to get that identifier (naming a project exactly "Helpdesk Support" and letting Redmine auto-generate the slug), the practical risk TC-224 was pointing at is real and confirmed via source.

## Evidence

### Console / log

- Source excerpt above (`seed_demo_data.rake` lines 368-390), read directly from the installed plugin copy in `redmine-docker-6-redmine-1` via `docker exec`.
- Not reproduced end-to-end live this session: the `redmineflux-helpdesk` project already created for TC-HLP-218/219/220 now wins the primary-identifier lookup on this instance, making the legacy-identifier branch unreachable without destroying those already-established fixtures. The defect is confirmed by direct reading of the shipped code path rather than by triggering it end-to-end.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` / `bugs/_duplicates.md` — no prior coverage of `seed_demo_data`'s project-matching logic; distinct from BUG-HLP-044's dead-code `check_emails`/`auto_close_tickets` legacy-custom-field pattern, though both trace back to the same historical "pre-migration to dedicated tables" cleanup debt)
- Existing bug reference (if duplicate): —

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120504 checked in)

**CONFIRMED FIXED, source-verified — matching this bug's own original methodology (not live-reproducible either way).** `lib/tasks/seed_demo_data.rake`'s `seed_project` now adds exactly the safeguard this bug's own Recommend section asked for:

```ruby
@project ||= Project.find_by(identifier: LEGACY_PROJECT_IDENTIFIER)
                    &.then { |p| p.description.to_s.include?(SEED_DESCRIPTION_MARKER) ? p : nil }
```

`SEED_DESCRIPTION_MARKER = 'redmineflux_demo_data NovaCrest dataset'` — the exact substring the seeder itself writes into a genuinely-seeded project's description at creation time. A legacy-identifier match is now only reused/renamed if its description already carries this marker; otherwise `@project` becomes `nil` and the method falls through to creating a brand-new project instead, leaving any unrelated real project (e.g. one an admin happens to have named "Helpdesk Support") completely untouched. As with the original filing, the legacy branch remains unreachable live on this instance (the primary-identifier project "Redmineflux Helpdesk" already exists, so the primary lookup always wins first) — confirmed via direct source reading, not an end-to-end trigger, consistent with how this bug was originally investigated.

## Notes

- Found while executing `HELPDESK_RAKE_TASKS.md` TC-HLP-224 (project-name-collision scenario) — see that TC's evidence for the full investigation and the corrected (identifier-based, not name-based) understanding of the actual collision condition.
- Severity judged **Medium**: low likelihood (requires a specific identifier coincidence, and only admins run this task), but real, silent, hard-to-notice impact if triggered — an unrelated project gets renamed and polluted with fake data, bypassing normal Rails validations via `update_columns`.
- Recommend: before reusing a legacy-identifier match, verify it actually looks like old demo data (e.g. `@project.trackers.exists?(name: 'Support')` or a small marker custom field/description string the seeder itself writes and can check for) — refuse and warn instead of silently renaming when that check fails.
- This TC/finding is source-verified, not live-UI-verified, per the standing project rule that only actual rake-task *invocations* are exempt from Playwright-only verification — reading shipped source code to understand a code path (as done throughout this suite for TC-217/218/219/220 root-causing) is a different activity from checking live *state*, and no live-state claim is made here beyond "this code path exists as quoted."
