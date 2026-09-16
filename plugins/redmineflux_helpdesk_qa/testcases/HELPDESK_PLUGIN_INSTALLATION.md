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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, built fresh from the official `redmine:6` image + this plugin's own source — no other plugins, no pre-existing data, isolated from `redmine-docker-6`): **PASS.** Ran the full sequence in order on a genuinely fresh DB (0 core tables beforehand): `bundle install` (111 gems installed cleanly), `rake db:migrate` (58 core tables created), `rake redmine:load_default_data` → `"Default configuration data loaded."`, `rake redmine:plugins:migrate` (all plugin migrations ran clean, no errors), installed `redis-server` via `apt-get` (confirming this is a genuinely separate manual step — the plugin's own `bundle install` only pulls the `redis-client` Ruby gem, not the Redis server binary) and started it (`PONG`), started Sidekiq and Puma. Verified via the real UI: logged in as `admin` (forced password change on first login, standard Redmine behavior), navigated to Administration → Plugins — "Redmineflux Helpdesk plugin" listed, described, enabled (its "Helpdesk Command Center" menu entry renders in the top nav, confirming it's genuinely active, not just present in the list). Redmine fully reachable throughout on `localhost:3099`.

**Side finding, filed as an addendum to BUG-HLP-060**: Sidekiq's `Scheduled::Poller` thread crash (the `sidekiq 7.3.9`/`connection_pool 3.0.2` `ArgumentError`) reproduced byte-for-byte identically on this completely fresh install — confirming it is a deterministic consequence of the plugin's own current Gemfile dependency resolution, not drift specific to `redmine-docker-6`'s history.

---

### TC-HLP-002: Plugin migration creates the "Waiting for Customer Response" issue status

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-001 completed successfully.

**Steps:**
1. Log in as Administrator
2. Navigate to Administration → Issue statuses

**Expected Result:**
- A status named **Waiting for Customer Response** exists, created by the plugin's migration

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, immediately following TC-HLP-001's fresh install on this same instance): **PASS.** Administration → Issue statuses lists "Waiting for Customer Response" as a real status row. Also confirmed via direct DB query right after the plugin migration ran (before this UI check): exactly one `issue_statuses` row existed at that point, with this exact name — genuinely created by the plugin's own migration, not present beforehand.

---

### TC-HLP-003: A tracker named "Support" is available after install

**User Role:** Administrator
**Precondition:** TC-HLP-001 completed successfully.

**Steps:**
1. Navigate to Administration → Trackers

**Expected Result:**
- A tracker named **Support** exists (created either by Redmine's default data or already present) — every helpdesk ticket depends on this tracker existing

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, immediately following TC-HLP-001's fresh install): **PASS.** Administration → Trackers lists **Support** alongside **Bug** and **Feature** — resolving the TC's own noted ambiguity: `Support` is genuinely one of Redmine core's own 3 default trackers (created by `rake redmine:load_default_data` itself, before the plugin's migration ever ran), not something the plugin creates or requires as a separate setup step.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, following TC-HLP-001): **PARTIAL — manual invocation PASS, automatic cadence FAIL, same root cause as BUG-HLP-060.** Manually ran `bundle exec rake redmineflux_helpdesk:check_sla` by hand → completed cleanly, `"SLA check completed... Notifications sent: 0, Escalations: 0, Errors: 0"` (zero counts are correct — no tickets/SLAs exist yet on this fresh instance). But Sidekiq's own log — on this same completely fresh install — shows the identical `Scheduled::Poller` `ArgumentError` crash documented in BUG-HLP-060 (`sidekiq 7.3.9`/`connection_pool 3.0.2` incompatibility), and grepping the full log for any of the 3 worker class names (`SlaMonitorWorker`/`EmailPollerWorker`/`AutoCloseTicketsWorker`) found zero execution entries — only their one-time cron registration at boot. The scheduled jobs are registered but never actually fire automatically, confirming this is a real defect present from a totally clean install, not something introduced later. See BUG-HLP-060 for full analysis.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, following TC-HLP-009 on this same instance): **PASS — mechanical steps only, no real version diff was available to test.** Using the existing fixtures from TC-009 (SLA "TC009 No-Sidekiq Test SLA", customer `tc009.customer`, ticket #1, org "TC009 Test Org"), stopped Puma, replaced the plugin folder in place with a freshly re-copied source (same directory name — no actual version difference exists to install, since only one version of this plugin is available; this exercises the exact mechanical upgrade sequence, not a genuine cross-version migration), ran `bundle install` (clean, same 111 gems) and `rake redmine:plugins:migrate` (clean no-op) again, then restarted Puma. Verified via the real UI afterward: ticket #1 still loads with its full content, the SLA still appears in the project's SLA list, the customer still appears in the Customers list — all unchanged. Confirmed via direct DB query: still exactly 1 "Waiting for Customer Response" status, not duplicated.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, following TC-HLP-001): **PASS.** Re-ran `rake redmine:load_default_data` on the already-migrated instance → refused verbatim with `"Some configuration data is already loaded."`. Confirmed no duplication via direct DB query: `trackers` = 3 (Bug/Feature/Support, unchanged), `issue_statuses` = 7 (the 6 core defaults + the plugin's own "Waiting for Customer Response", unchanged), `roles` = 5 (3 named core roles + 2 built-in Non member/Anonymous, unchanged) — identical counts before and after this refused attempt.

---

### TC-HLP-007: Renaming the plugin folder breaks plugin registration

**User Role:** System Administrator (server access)
**Precondition:** Plugin installed and working per TC-HLP-001.

**Steps:**
1. Rename the plugin's folder under `redmine/plugins/` to something other than the name it was installed as
2. Restart Redmine

**Expected Result:**
- The plugin is no longer correctly registered as `redmineflux_helpdesk` (Redmine identifies a plugin by its directory name) — expect it missing from Administration → Plugins, a startup error, or equivalent broken state; record whichever actually occurs

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`): **PASS — worse than "missing from the list," a hard startup failure.** Renamed the plugin's folder from `redmineflux_helpdesk` to `redmineflux_helpdesk_renamed` on the host (bind-mounted into the container) and restarted Puma: Redmine **fails to boot at all**, with `Redmine::Plugin.register: Plugin not found. The directory for plugin redmineflux_helpdesk should be /usr/src/redmine/plugins/redmineflux_helpdesk. (Redmine::PluginNotFound)` — Redmine's own plugin loader cross-checks the directory name against the name declared in the plugin's `init.rb` and refuses to start the entire application on a mismatch, not just silently drop the one plugin. Renamed the folder back and restarted: Redmine booted cleanly, and Administration → Plugins again lists "Redmineflux Helpdesk plugin" normally — full recovery confirmed via the real UI.

---

### TC-HLP-008: Migrating without first running `bundle install` fails

**User Role:** System Administrator (server access)
**Precondition:** Plugin folder copied into `redmine/plugins/`; gems from the plugin's Gemfile have not been installed.

**Steps:**
1. Skip `bundle install`
2. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` directly

**Expected Result:**
- The migration or subsequent Redmine startup fails with a missing-dependency / `LoadError`-style error, not a silent partial install

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, built fresh from the official `redmine:6` image + this plugin's source, entrypoint overridden with `command: tail -f /dev/null` so bundle install/db:migrate never auto-run — full manual control over the install sequence, isolated from `redmine-docker-6`): **PASS.** Confirmed the precondition first: `bundle check` genuinely fails, listing 14 missing gems from the plugin's Gemfile (`prawn`, `sidekiq`, `sidekiq-scheduler`, `redis-client`, etc.) — `bundle install` never run. Then, with `config/database.yml` written but zero schema migrated, ran `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` directly: failed immediately with `Bundler::GemNotFound: Could not find gem 'prawn' in locally installed gems`, exit code 2 — a real `Bundler`-level dependency error, not a silent partial install. Confirmed via direct DB query (`SHOW TABLES FROM redmine`) that zero tables exist — no partial schema was created before the failure.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`): **PASS on the SLA-escalation claim, live-verified in full; email/auto-close claims not independently re-tested with real infrastructure but share the identical missing execution path.** Stopped Sidekiq and Redis entirely (`pkill`/`kill -9`, confirmed both fully down — `redis-cli ping` refused the connection). Built minimal fixtures via the real UI: a project with the Helpdesk module enabled, an SLA with a 1-minute response window, a Support Level, an Organization, and a Customer — all helpdesk UI screens (Command Center, project Helpdesk Dashboard, SLA/Organization/Customer admin screens) loaded and functioned normally throughout, with no Sidekiq/Redis dependency visible anywhere in the UI. Raised a ticket as the customer, assigned it as admin to start the SLA clock (`SLA Started: 09/14/2026 05:44 AM`, `Deadline: 09/14/2026 05:45 AM`). Waited well past the deadline: the SLA Information tab's live-computed banner correctly shows **"✗ SLA Missed"** / **"⚠ Overdue 2 minutes"** (a real-time arithmetic display, not dependent on any background job), but the Activity Log still shows exactly **1 event** (only "Initial Stage" creation — no breach-detection or escalation event), and a direct DB query confirms `response_breached: 0`, `escalation_count: 0` in `rf_issue_sla_statuses` — the persisted breach/escalation state never updates without the monitor running, exactly as expected. Email polling and auto-close were not independently re-verified with real mail infrastructure on this disposable instance (no mail server configured), but both share the identical `Sidekiq::Scheduled::Poller` execution path already confirmed dead in this scenario (and separately crashed-but-registered in BUG-HLP-060) — with Sidekiq not running at all, neither can plausibly fire.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`, following TC-HLP-001): **PASS.** Re-ran `rake redmine:plugins:migrate` a second time with no schema changes pending → completed instantly with zero migration-step output (a genuine no-op, not just "no errors while doing something"). Confirmed via direct DB query: exactly 1 row for "Waiting for Customer Response" in `issue_statuses`, not duplicated.

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

CONFIRMED LIVE 2026-09-14 (disposable Docker instance, `redmine-install-test:6`): **PASS.** On a genuinely fresh DB (core `db:migrate` run — 58 core tables exist — but `load_default_data` never run: confirmed 0 rows in `issue_statuses`/`trackers` beforehand), ran `RAILS_ENV=production bundle exec rake redmine:plugins:migrate` directly — succeeded, and its own migrations created exactly **one** `issue_statuses` row: "Waiting for Customer Response" (confirmed via direct DB query — the plugin's migration is a real data-seeding migration, not schema-only). Then attempted `rake redmine:load_default_data` → refused verbatim with **"Some configuration data is already loaded."**, exactly the documented symptom. Confirmed the resulting broken state: `trackers` = 0, `enumerations` (IssuePriority) = 0 — no trackers or priorities exist. `roles` = 2, but both are Redmine's own built-in pseudo-roles (`Non member`, `Anonymous`, `builtin` flags 1/2) created unconditionally by core schema migration itself, not by `load_default_data` — zero *named* roles (Manager/Developer/Reporter etc.) exist, consistent with the TC's intent.

---

### TC-HLP-012: Setup functions identically on the oldest and newest supported Redmine versions

**User Role:** System Administrator (server access)
**Precondition:** Two clean instances available — one on Redmine 5.0.x, one on 6.1.x.

**Steps:**
1. Repeat TC-HLP-001 through TC-HLP-003 on both instances

**Expected Result:**
- Installation, migration, and the resulting tracker/status setup behave identically on both versions
- No version-specific errors or missing screens on either

**SKIPPED 2026-09-14, per explicit user decision.** Would have required spinning up a second disposable Redmine 5.0.x instance (a `redmine-install-test:5.0` stack was scaffolded — `C:\redmine-docker-install-test-5x\`, Dockerfile + docker-compose.yml only, never built/started) to repeat TC-HLP-001–003 there and compare against the 6.x results already confirmed live in this same suite. User explicitly chose to skip this TC for now rather than build the second instance. Not run — no pass/fail claim being made. Revisit if cross-version parity ever needs verifying.

---

## Evidence Map

- Case ID: TC-HLP-001 – TC-HLP-012
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
