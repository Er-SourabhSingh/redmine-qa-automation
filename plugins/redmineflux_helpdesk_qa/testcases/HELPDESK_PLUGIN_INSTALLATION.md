# Test Cases — Redmineflux Helpdesk — Feature 1: Plugin Installation

> Source: `docs/HELPDESK_FEATURES_LIST.md` #1 (Plugin installation), `docs/HELPDESK_REQUIREMENTS.md` Known Constraints, `docs/HELPDESK_USER_GUIDE.md` §2 (Before you begin) and §24 (Troubleshooting).

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment — supported: 5.0.x, 5.1.x, 6.0.x, 6.1.x)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-001: Fresh install completes end-to-end on a supported Redmine version

**User Role:** System Administrator (server access)
**Precondition:** A clean Redmine instance on a supported version (5.0.x, 5.1.x, 6.0.x or 6.1.x). Redmine's default data has **not** yet been loaded.

**Steps:**
1. Unzip the plugin archive and copy the folder into `redmine/plugins/` without renaming it
2. Run `bundle install`
3. Run `RAILS_ENV=production bundle exec rake redmine:load_default_data`
4. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate`
5. Install and start Redis, then start Sidekiq (`bundle exec sidekiq`)
6. Restart Redmine

**Expected Result:**
- Each command completes with no errors
- Plugin is listed under Administration → Plugins as `redmineflux_helpdesk`, enabled
- Redmine starts normally and is reachable

---

### TC-HLP-002: Plugin migration creates the "Waiting for Customer Response" issue status

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-001 completed successfully.

**Steps:**
1. Log in as Administrator
2. Navigate to Administration → Issue statuses

**Expected Result:**
- A status named **Waiting for Customer Response** exists, created by the plugin's migration

---

### TC-HLP-003: A tracker named "Support" is available after install

**User Role:** Administrator
**Precondition:** TC-HLP-001 completed successfully.

**Steps:**
1. Navigate to Administration → Trackers

**Expected Result:**
- A tracker named **Support** exists (created either by Redmine's default data or already present) — every helpdesk ticket depends on this tracker existing

---

### TC-HLP-004: Background jobs run once Redis and Sidekiq are up

**User Role:** System Administrator (server access)
**Precondition:** Plugin installed per TC-HLP-001; Redis and Sidekiq running.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_sla` by hand (or wait for the scheduled run)
2. Check the Sidekiq log/console for job activity

**Expected Result:**
- The SLA monitor job runs without error
- Sidekiq log shows the scheduled jobs firing on their intervals (SLA monitor every 2 min, email poller every 5 min, auto-close every 2 min) once left running

---

### TC-HLP-005: Upgrade path preserves existing data

**User Role:** System Administrator (server access)
**Precondition:** An existing install with at least one SLA, one customer, and one ticket already created.

**Steps:**
1. Replace the plugin folder with the new version (same directory name)
2. Run `bundle install`
3. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate`
4. Restart Redmine

**Expected Result:**
- Upgrade completes with no migration errors
- Previously created SLAs, customers, organizations, and tickets are all still present and unchanged
- No duplicate "Waiting for Customer Response" status is created

---

## Negative Cases

---

### TC-HLP-006: Loading Redmine's default data after the plugin migration is refused

**User Role:** System Administrator (server access)
**Precondition:** The plugin migration (`rake redmine:plugins:migrate`) has already been run on this instance.

**Steps:**
1. Run `RAILS_ENV=production bundle exec rake redmine:load_default_data`

**Expected Result:**
- The command refuses with an error to the effect of "Some configuration data is already loaded"
- No default trackers, statuses, priorities, or roles are created by this run

---

### TC-HLP-007: Renaming the plugin folder breaks plugin registration

**User Role:** System Administrator (server access)
**Precondition:** Plugin installed and working per TC-HLP-001.

**Steps:**
1. Rename the plugin's folder under `redmine/plugins/` to something other than the name it was installed as
2. Restart Redmine

**Expected Result:**
- The plugin is no longer correctly registered as `redmineflux_helpdesk` (Redmine identifies a plugin by its directory name) — expect it missing from Administration → Plugins, a startup error, or equivalent broken state; record whichever actually occurs

---

### TC-HLP-008: Migrating without first running `bundle install` fails

**User Role:** System Administrator (server access)
**Precondition:** Plugin folder copied into `redmine/plugins/`; gems from the plugin's Gemfile have not been installed.

**Steps:**
1. Skip `bundle install`
2. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` directly

**Expected Result:**
- The migration or subsequent Redmine startup fails with a missing-dependency / `LoadError`-style error, not a silent partial install

---

### TC-HLP-009: Without Redis/Sidekiq running, the desk loads but nothing automated happens

**User Role:** Agent
**Precondition:** Plugin installed per TC-HLP-001; Redis and/or Sidekiq deliberately stopped.

**Steps:**
1. Log in and open the Helpdesk Command Center and a project's Helpdesk tab
2. Raise a ticket that would breach its SLA, and send a qualifying email to a configured mailbox
3. Wait past the SLA deadline and past the email poller's normal interval

**Expected Result:**
- All helpdesk UI screens still load normally (tickets, SLAs, customers, etc.)
- The ticket's SLA breaches but does **not** escalate (no background monitor running)
- The emailed ticket is never created (no mail poller running)
- No auto-close occurs on eligible resolved tickets

---

## Edge Cases

---

### TC-HLP-010: Re-running the plugin migration a second time is idempotent

**User Role:** System Administrator (server access)
**Precondition:** Plugin already installed and migrated successfully once (TC-HLP-001).

**Steps:**
1. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` again with no schema changes pending

**Expected Result:**
- Command completes with no errors (no-op — nothing left to migrate)
- Exactly one "Waiting for Customer Response" status exists, not duplicated
- No existing SLA, support level, customer, or ticket data is altered

---

### TC-HLP-011: Running the plugin migration before Redmine's default data produces the documented broken state

**User Role:** System Administrator (server access)
**Precondition:** A completely fresh Redmine instance with no data loaded at all.

**Steps:**
1. Skip `rake redmine:load_default_data`
2. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` directly
3. Attempt to load default data afterward: `RAILS_ENV=production bundle exec rake redmine:load_default_data`

**Expected Result:**
- Step 3 is refused (Redmine's loader only runs when there are no statuses at all; the plugin's migration already created one)
- The instance is left with no trackers, priorities, or roles — matching the documented troubleshooting symptom in §24 of `HELPDESK_USER_GUIDE.md`
- Recovery requires reloading default data before the plugin migration on a fresh database, per the documented setup order

---

### TC-HLP-012: Setup functions identically on the oldest and newest supported Redmine versions

**User Role:** System Administrator (server access)
**Precondition:** Two clean instances available — one on Redmine 5.0.x, one on 6.1.x.

**Steps:**
1. Repeat TC-HLP-001 through TC-HLP-003 on both instances

**Expected Result:**
- Installation, migration, and the resulting tracker/status setup behave identically on both versions
- No version-specific errors or missing screens on either

---

## Evidence Map

- Case ID: TC-HLP-001 – TC-HLP-012
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
