# Plugin Memory — Redmineflux Platform

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## ⚠️ Duplicate native UI in each consumer plugin is DELIBERATE, NOT a bug — Step 5 of the roadmap hasn't started

Every consumer plugin (CRM, Helpdesk, Invoice, Timesheet, Workload, Shift Management) still has its **own native screen** for entities the platform now owns (Organizations, Teams, Leaves, Holidays, etc.), alongside the platform's own new canonical screens. This is intentional, per `PLATFORM_PLUGIN_README.md`'s own Roadmap table:

| Step | Scope | State |
|---|---|---|
| 1–4 | Data consolidation, services, shared UI components | done |
| **5** | **Consumer migration: invoice, workload, timesheet, CRM, helpdesk** | **not started** |

And explicit for Teams specifically: "The canonical Teams screen... is **additive**: Workload's `/rf_teams` and Timesheet's `/timesheet/teams` both keep working on the same rows, so this ships without retiring either."

**So: the data layer is unified (one table, one model — confirmed extensively this cycle, editing from one plugin shows up instantly in another), but the UI layer is NOT yet consolidated — each consumer plugin's own screen is expected to coexist until Step 5, which hasn't begun.** Do not file "CRM still has its own Organizations screen instead of linking to the platform's" as a bug — that's the documented current state, not a defect.

**What IS still fair game**: behavioral *inconsistency* between those duplicate screens pointing at the same shared data — different delete-button sizes, a broken form on one screen but not another (see BUG-PLT-009/010/011/012), a wrong header/breadcrumb on the platform's own new screen (BUG-PLT-007), settings not actually syncing despite claiming to (BUG-PLT-008). The data being unified doesn't mean the surrounding UI/UX layer is finished — that's exactly where this cycle's real bugs have been found.

## ⚠️ Platform's "dedicated page vs popup" split AND its button order/alignment are both DOCUMENTED, INTENTIONAL design — not inconsistencies (2026-10-01)

User asked why Platform "makes forms" (full-page) for some entities while other plugins use popups for everything, and separately flagged the button order/alignment on Platform's modals as apparently inconsistent. Investigated both and found they're **both already specified test cases, already in the suite**, just not executed yet — `PLATFORM_VOCABULARY_AND_LABELS.md` TC-PLT-083–089:

- **Page vs. popup split is deliberate**, per the ticket: Organizations/Contacts/Holidays/Leave Types/Leaves get **dedicated full pages** (matching CRM's/Helpdesk's older, more-fields-heavy forms); Teams and Holiday Schemes **stay popups** because they're "short enough not to need a page" (TC-PLT-087). Confirmed live: Team's and Holiday Scheme's "New"/"Edit" open a `dialog` with the list URL unchanged; Organizations/Holidays/Leave Types/Leaves all navigate to a genuinely distinct `/new` or `/edit` URL.
- **Button order (Primary-first) and alignment (left) are ALSO the documented standard** (TC-PLT-088) — matching CRM's and Helpdesk's own pre-existing forms (and, it turns out, plain Redmine core's own native form convention too). I had initially filed **BUG-PLT-023** claiming Platform's layout was wrong, comparing it against Workload's/Timesheet's own "Add Member" modals (right-aligned, Cancel-first) — **the wrong reference**. Confirmed live on 3 plugins before retracting: Platform (`.rf_platform_form_footer`), CRM (`/companies/new`, `.rf_crm_form_actions`), and Helpdesk (`/rf_organizations/new`, plain unstyled Redmine form) all independently agree on Primary-first/left-aligned. Workload/Timesheet's convention is their own separate, internal pattern — not the standard this ticket targets, and not evidence Platform is wrong.

**Lesson: when a UI-consistency question involves "is Platform's new screen consistent with the rest of the product," the right comparison set is the entities the ticket is actually consolidating FROM (CRM, Helpdesk — the older, pre-platform native screens) — not an arbitrary other consumer plugin (Workload, Timesheet) that may have its own unrelated UI conventions.** Always check `PLATFORM_VOCABULARY_AND_LABELS.md` and the plugin's own ticket/ADR docs for an explicit documented-standard answer before concluding a UI difference is a bug — this plugin's test suite had already anticipated and specified the correct comparison, it just hadn't been executed yet.

## ⚠️ Always check production for bugs sitting "In QA" before assuming all retests are up to date — 8 were missed this session until the user asked (2026-10-01)

Spent a large chunk of this session filing new bugs (024-030) without once checking whether the dev had moved any *older* bugs to "In QA" on production in the meantime. The user caught this ("i think on production plt bug are in qa did you test them") — querying production directly (`list_issues subject=BUG-PLT status=*`) found **8 bugs already "In QA"** (007, 009-015) that this session had never retested, with fix commits that had been sitting on disk, un-pulled-into-awareness, since 2026-09-30. All 8 retested and **confirmed genuinely fixed** (see the dedicated memory entry below and each bug's own Retest 2026-10-01 section).

**Lesson: query production status (`list_issues subject=BUG-PLT status=*` or similar) at the START of any session resuming work on a plugin with open production bugs, not just when the user prompts it** — a bug can move to "In QA" between sessions without any local signal, and local `bugs/_index.md` only reflects what THIS repo's sessions have already retested, not what's actually happened on the tracker since.

**Also found while querying**: a second, completely unrelated bug exists on production also titled "BUG-PLT-017" (#121652, "A Redmine user who has filed or approved anything cannot be deleted") — filed directly by the developer (not QA), reproduced on a different environment (`redmine-700`, Rails 8.1/Postgres) entirely. This is a genuine subject-text collision with QA's own local `BUG-PLT-017` (#121707, "Contacts search returns 'No record matches'") — two different real defects sharing a number by coincidence of independent numbering schemes. Not QA's bug to retest or track; noted here only so a future session doesn't conflate the two by title alone — always check the issue number, not just the "BUG-PLT-NNN" text, when there's any doubt.

## ⚠️ 8 bugs confirmed genuinely fixed 2026-10-01 — all retested against their exact original repro, not just the dev's claims

Retested `BUG-PLT-007, 009, 010, 011, 012, 013, 014, 015` live (Playwright + direct DB query, not just reading journals) after pulling their fix commits (already on disk) and running pending migrations (`rake redmine:plugins:migrate`: platform 9→40, timesheet 9→20, both now fully current). All 8 confirmed fixed and moved to `bugs/closed/`:

- **007** (header/breadcrumb/modal-button, 4 parts) — all 4 confirmed via `getComputedStyle`/`getBoundingClientRect` directly on the rendered DOM, not a visual read.
- **009/010** (Shift Management Apply Leave 400→crash chain) — a single shared fix: `AuditEvent.log` moved off both plugins' monkey-patches onto the platform model itself (dispatches on keyword shape), so load order can no longer take the method away from either plugin. `POST /shift_management/leave` now 200, audit row writes with the correct call-site shape.
- **011** (Workload Request Leave) — same param-key-derivation fix pattern (`model_name.param_key`, not a literal) as 009. One harmless, non-blocking client-side `rails-ujs` console `SyntaxError` observed during retest, not filed — the server-side request still completed 200 and the record was created correctly regardless.
- **012** (Shift Management Leave Type) — third occurrence of the same stale-key defect class; dev's fix this round included a full form-to-view instance-variable trace across all 6 consumer plugins to confirm no 4th instance remains.
- **013/014/015** — one shared platform commit (`7012219`). Team-membership auditing now lives on the `TeamMembership` model itself (`after_commit` hooks), origin-independent — confirmed a Workload-originated add *and* a Platform-originated remove both now write audit rows, where previously only Platform's own screen was ever audited. The "two disconnected role columns" (014) are now both shown side-by-side with real distinct values, and a working per-member Edit dialog (015) now exists on Platform's own Teams screen.

**Common pattern across 009/011/012**: the fix is explicitly *not* a hardcoded param-key literal — it's `SomeModel.model_name.param_key`, falling back to the legacy key only if that's what actually arrived. The dev's own journals flag this as deliberate: a literal fixes today's symptom and leaves the same trap set for the next time the model behind a form changes (which is exactly how BUG-PLT-009 broke a second time after its first "fix").

## ⚠️ A Workload's team-member list is a point-in-time snapshot, not a live view of the team — and deleting a Team cascade-deletes its Workloads unconditionally (2026-10-01)

Finishing `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md`'s remaining TCs (105/106/111) required building real dependent-record fixtures (a Shift Assignment, a TimeEntry, a Workload allocation) since none existed in this environment before. That work surfaced two related, confirmed-via-DB findings:

- **`RfWorkloadUser` (table `rf_workload_users`) is populated once when a Workload is created and never re-synced.** Removing a member from the Team afterward does *not* remove them from any Workload already built for that team — the Workload keeps showing their full original capacity indefinitely, and the org-wide Workload Intelligence Dashboard's Team filter sums the same stale rows. Filed `BUG-PLT-029` (TC-PLT-104 FAIL). Confirmed via direct DB query, not just a UI read: `team.team_memberships.exists?(user_id: x)` → `false` while `workload.rf_workload_users.exists?(user_id: x)` → `true`.
- **Deleting a Team has `dependent: :destroy` on `has_many :rf_workloads`** (`redmineflux_workload/lib/redmineflux_workload/patches/platform_team_patch.rb`) — a deliberate cascade, confirmed in source, not an accident. There is no guard (unlike Organization's `register_destroy_guard`, TC-PLT-110) and the generic delete-confirmation text never specifically warns that Workload planning data will be destroyed. Filed `BUG-PLT-030` (TC-PLT-111).
- **These two are NOT contradictory with `BUG-PLT-013`'s "historical records survive" finding (TC-PLT-105, PASS)** — a member's Shift Assignment and TimeEntry correctly survive their removal from the team (no FK to the team row), and that's still true. It's specifically the Workload's own membership-capacity view (while the team still exists) and the Workload's own existence (once the team is deleted) that don't behave consistently with that same "historical data persists" principle.

**Lesson for any future Workload testing on this plugin**: a Workload is a snapshot taken at creation time, not a live join against the Team — don't assume "team member count" and "workload member count" stay in sync after the fact. And when testing destructive team-level actions, always check source for `dependent: :destroy`/`register_destroy_guard` before assuming a generic confirmation dialog means a generic (harmless) consequence.

## ⚠️ Platform Settings' inherit-from-source-plugin model (BUG-PLT-008's original architecture) has been REPLACED, not just fixed — re-read TC-PLT-094–097 before testing Settings again (2026-10-01)

`BUG-PLT-008` was originally about Platform Settings failing to read Workload's/Invoice's real values ("Currently inherited from X" hint broken). As of today, that entire read-fallback mechanism is **gone** — Platform Settings (`/redmineflux_platform/settings`) is now a single, flatly-authoritative "Working hours per day" field ("Whatever you set here is what the other RedmineFlux plugins use — this is the only place these values can be changed"), and Workload's own `/rf_settings` field is now **read-only**, linking back to Platform Settings instead of holding its own value. There is **no Company Identity / Company Name section on Platform Settings at all anymore** — Invoice's own "Company Details" tab (`/settings/plugin/redmineflux_invoice?tab=company_details`) remains fully independent, simply never wired into Platform's (now working-hours-only) scope.

**This means TC-PLT-094/095/096/097 as currently written test a design that no longer exists** — not a regression, a cleaner single-source-of-truth replacement. Written up as "superseded/N-A" rather than forced PASS/FAIL 2026-10-01. **Before testing Platform Settings again, re-read the live page first** rather than trusting these TCs' literal steps — if the architecture has moved again, update the TCs rather than testing stale assumptions a second time.

## ⚠️ CRM/Platform "Company" wording leak is TWO separate root causes, not one — always check both locale AND hardcoded API strings (2026-10-01)

Investigating TC-PLT-080 found leftover "Company" wording isn't just a locale-file miss. `redmineflux_crm`'s `api/companies_controller.rb` has **hardcoded literal strings** (`message: 'Company updated'`, `'Company created'`, `'Company deleted'`) independent of any locale key — and the frontend echoes these verbatim into the Activity Log, which is why "Organization created by..." (driven by the model's own `CrmAutoActivity` concern, correctly derived) and "Company updated by..." (driven by this controller's hardcoded string) disagree **within the same record's own activity timeline**. Filed as `BUG-PLT-024`. A second, Platform-side instance (Contact edit form's "Company"/"Company Identity" section heading, and a fully separate `rf_organization_contact_links` feature gap) was found on the same investigation, filed as `BUG-PLT-026`. **Lesson: a vocabulary-consolidation sweep must grep hardcoded controller string literals (`message:`, `render_success(...)`), not just `config/locales/*.yml` — a rename that only touches the locale file will still leak through any direct string.**

## ⚠️ Platform can contradict its OWN documented vocabulary standard — don't assume "found in this plugin's own locale file" means "actually used" (2026-10-01)

TC-PLT-081 found `redmineflux_platform`'s own `config/locales/en.yml` explicitly documents "Private / Visible to all" as the intended status-vocabulary pairing (with a comment and a dedicated `label_rf_platform_visible_to_all` key), but the live "Visibility" filter instead renders "Private / Public" from a different, separately-added `label_rf_platform_public` key — the documented, correct key is never referenced anywhere in app code (dead/orphaned). Filed as `BUG-PLT-025`. **Lesson: when checking a plugin against its own documented standard, grep for actual *usages* of the key the comment points to, not just the key's existence** — a locale file can define the right string and still not use it anywhere live.

## ⚠️ "Update (membership)" ≠ just Add — always test Add-with-fields, Edit, AND Remove separately (2026-09-30)

While executing `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`'s Team section, the user caught two real coverage gaps by asking pointed follow-up questions rather than accepting "membership CRUD tested":

1. **"did you test edit/remove member?"** — TC-PLT-147/148/149 only ever tested *adding* a member (with default Role/flags); a separate "editing an existing member's role" and "removing a single member" action existed in the UI but had no TC at all. Added TC-PLT-199–202, executed them, and found **BUG-PLT-013**: Workload/Timesheet/Shift Management's own add/edit/remove-member controllers all bypass the shared `RedminefluxPlatform::TeamService`, so none of their team-membership mutations ever produce an Audit Event — only Platform's own screen does (because `Team` includes the `Auditable` concern at the model level, but `TeamMembership` does not, and only Platform's controller explicitly calls the service that logs it manually).
2. **"did you test the Role/other fields at add time, not just via edit?"** — every "Add member" TC had left Role/flags at their form defaults; the only place non-default values were ever set was in a later, separate Edit action. Added TC-PLT-203, executed it, and found **BUG-PLT-014**: `rf_team_memberships` has TWO disconnected role columns — `role` (varchar, Shift Management's Member/Lead) and `role_id` (int FK, Platform/Workload/Timesheet's None/Manager/Developer/Reporter). A Role set through either one is invisible on every other plugin's screen — confirmed bidirectionally.

**Lesson: for any shared multi-field form (not just Team membership), test Create/Add with EVERY field set to a non-default value in the SAME submission, separately test Edit of an existing record, and separately test Remove/Delete of a sub-record — don't let a later Edit test stand in for "the Add form's own fields were verified."** This plugin's "single source of truth" claim specifically depends on every field of every form actually reaching the shared table the same way, not just the record's existence.

## ✅ Environment healthy — full upgrade path completes end to end (as of 2026-09-29, after 4 dev fix rounds)

`redmine-docker-6-platform` boots cleanly and `rake redmine:plugins:migrate RAILS_ENV=production` now completes with **exit code 0** through the final migration (38), with zero errors — on this same environment, no DB reset ever needed. All 3 bugs found during the TC-PLT-020/021 branch-upgrade attempt (`BUG-PLT-003`, `BUG-PLT-004`, `BUG-PLT-005`) are closed. `bugs/open/` is empty. **This does not mean the plugin is done testing** — most suites past TC-PLT-010 haven't had a first execution pass against this now-upgraded state yet (see `PLATFORM_HANDOFF.md`'s Next Session Start Point).

- All 7 plugins are on the `redmineflux_platform` branch, currently at commit `5db0312` (confirmed via `git log` in each of the 7 `plugins/` folders).
- **BUG-PLT-004 — CLOSED.** `init.rb` now calls `Rails.autoloaders.main.ignore` on `pagination_renderer.rb`'s path before its guarded `require`, removing the file from Zeitwerk's tracking entirely. Confirmed live: Puma reaches "Listening on...", `GET /` → `200 OK`. Production `#121480` → `Done`, 100%.
- **BUG-PLT-003 — CLOSED (took 3 fix rounds).**
  - Round 1 (`133ebf5`): migration `004`'s crash fixed, but `011` then crashed on `unknown attribute 'is_private'` (migration `010`'s `COLUMNS` hash never actually listed it, only a dead `DEFAULTS` entry).
  - Round 2 (`4fb3f22`): `010`'s `COLUMNS` hash fix was correct, but this environment already had `10-redmineflux_platform` recorded as applied from round 1's retest — Redmine's migrator tracks by version number, not content, so the fix never executed here. Same crash persisted.
  - Round 3 (`01b987b`) — **the one that stuck**: migration `011` now does its own `if_not_exists`-guarded `add_column` for `is_private`/`active` directly in its own `up`, independent of migration 010's state, reasoning that 011 can never have been recorded as already-applied on any install that hit this bug (it always aborted before completing). Confirmed live, no manual DB repair needed. Production `#121479` → `Done`, 100%.
  - **General lesson for retesting this plugin's migrations**: if a fix edits an *already-applied* migration's content, it will not take effect on an environment that already recorded that version — check `SELECT version FROM schema_migrations WHERE version LIKE '%redmineflux_platform%'` before concluding a fix "doesn't work." A fix to a migration that has never yet completed on this environment does not have this problem — this is exactly why BUG-PLT-005's fix (below) worked first try.
- **BUG-PLT-005 — CLOSED.** Migration `019_align_organizations_active_not_null.rb` called `execute(...).cmd_tuples` — PostgreSQL-only (`PG::Result`); this environment's `mysql2` adapter returns `nil` from `execute()` on an `UPDATE`, raising `NoMethodError` and canceling everything after it. Dev audited every migration for the same pattern (rather than patching just line 18) and found it in **12 places across 6 files** (019, 026, 027, 030, 032, 033) — fixed all at once with `update(sql)`, ActiveRecord's adapter-agnostic path. Confirmed live: full migration chain now reaches migration 38 with zero errors; duplicate-table drops (migration 34) clean; `rf_organizations.active`/`is_private` and `rf_leave_types.code` all present; the previously-500ing `GET /redmineflux_platform` now loads. Production `#121512` → `Done`, 100%.
- **Why this kept happening across 4 rounds, in short**: every fix so far had been scoped to exactly the one reported symptom. Round 3 and the BUG-PLT-005 fix both broke this pattern by auditing *every* migration for the same defect *shape* once it recurred a second/third time — worth remembering as a signal: if the same category of migration bug surfaces twice, ask for (or do) a full audit rather than another single-line patch, since a fresh Postgres-vs-MySQL environment tends to surface these one at a time, in migration order, as each earlier one gets fixed.
- **Dev now has a real MySQL-backed test environment of their own** (per BUG-PLT-005's journal, stood up specifically because their whole existing stack was Postgres-only) — future migration fixes from them should be pre-validated against MySQL going forward, so this class of bug is less likely to recur.
- **Next time a new dev fix lands** (for the next suite's findings, not this upgrade): `git log` on each plugin folder for a commit after `5db0312` before assuming anything changed; repeat the same pull → restart → retest-via-exact-repro-steps process.

## Production reference: one testcase per local suite file (2026-09-29)

Unlike the "single Sanity testcase per ticket" pattern used for other plugins (see root `MEMORY.md`), the user explicitly asked for **one production testcase per local suite `.md` file** for this plugin. All 6 live in one new Test Suite, `ztflux` project #122:

| Local suite file | Production Testcase |
|---|---|
| `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` | #121474 — "Old Architecture Baseline (Feature #120043)" |
| `PLATFORM_INSTALLATION_AND_UPGRADE.md` | #121473 — "Installation & Branch Upgrade (Feature #120043)" |
| `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | #121475 — "Data Migration Integrity (Feature #120043)" |
| `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | #121476 — "Cross-Plugin Consistency (Feature #120043)" |
| `PLATFORM_VOCABULARY_AND_LABELS.md` | #121477 — "Vocabulary & Labels (Feature #120043)" |
| `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` | #121478 — "Known Gaps & Edge Cases (Feature #120043)" |

- **Test Suite #397** ("Redmineflux Platform") holds all 6, confirmed via `list_testcases_in_suite(397)`.
- **Run #586** ("Redmineflux Platform QA - Feature #120043", environment `Win + Chrome + Ver6`, assignee Sourabh Singh=683) has all 6 testcases attached from the start, confirmed via `get_run_testcases`. (An earlier `Run #585` — "Sanity Testing - Feature #120043", assignee Vaishnavi Bhawsar=192, only 1 testcase attached — was deleted and replaced by this one per user correction, since nothing had been logged against it yet.)
- **Never use `update_run`** to add/change a run's suite/testcase links after creation — its `run_assignments` param wipes the run's existing links before validating (see root `MEMORY.md`, "update_run Wipes Assignments", real incident on Run #577). If a run needs restructuring later and already has real results logged against it (so delete+recreate is no longer safe), do it via the real UI (Playwright) instead of this tool.
- **When `report_defect`-ing a bug found while testing this plugin, link it to the testcase matching the local suite file the finding's TC actually lives in — not automatically to #121473.** Real incident: `BUG-PLT-006` (found by TC-PLT-040, which lives in `PLATFORM_DATA_MIGRATION_INTEGRITY.md`) was first mistakenly `report_defect`-ed against #121473 ("Installation & Branch Upgrade") out of habit from the prior 3 bugs, which flipped that already-`Passed` testcase back to `Failed`. Corrected by re-`report_defect`-ing against the right testcase (#121475) and restoring #121473 to `Passed` via `create_status_result` — but #121473's defect list still shows the mis-linked defect id for historical reasons (no "unlink defect" tool available). Check the table above for the right testcase before calling `report_defect`.
- Any bug found against a given local suite file should be reported (`report_defect`) against that file's matching testcase above — e.g. `BUG-PLT-003`/`BUG-PLT-004` (both from `PLATFORM_INSTALLATION_AND_UPGRADE.md`'s TC-PLT-020/021) belong on **#121473**, inside Run #586.
- Next session: check whether a dev fix has landed (`git log` on `redmineflux_platform` for new commits) before re-attempting anything. If not, ask the user how they want to proceed before touching the environment further.

## Known Quirks

- **Dedicated container, not the shared `redmine-docker-6`.** This plugin gets its own instance (`redmine-docker-6-platform`, port 3013, `C:\redmine-docker-6-platform`) instead of joining the shared docker-6 used by Checklist/Helpdesk/Gantt/Scarlet/Testcase Management/Timesheet/Workload/etc. (port 3012). Reason: it's a new "common entities" consolidation architecture (customers, holidays, teams, etc. centralized instead of plugin-specific) — isolating it avoids any risk to the other plugins' shared DB/fixtures while it's still new.
- **Plugin source location changed 2026-09-28 (evening): moved from external `C:\redmineflux palform\plugins` to `C:\redmine-docker-6-platform\plugins`** (inside the docker project folder itself). `docker-compose.yml`'s volume mount was updated from the absolute external path to the standard relative `./plugins`, matching every other docker-* project's convention in this repo. The old `C:\redmineflux palform` folder still exists but is now empty — don't confuse it with the current source location.
- **`bundle install` runs at container boot, not at image build time** — unlike `redmine-docker-6`, this container's Dockerfile does NOT `COPY plugins` + `bundle install` at build. Windows directory junctions aren't visible to Docker Desktop's build-context tar streamer (tried, failed: "COPY plugins ... not found" even though the junction resolved fine from PowerShell), and the plugin source path also isn't inside this build context anyway. Trade-off: first boot (and every boot) re-resolves gems, which is slower than the baked-image pattern used elsewhere in this repo — acceptable for now since this is a low-traffic dedicated test container, revisit if it becomes annoying once the plugin ships and gems stabilize.
- **No Sidekiq auto-start configured yet** (unlike `redmine-docker-6`, which hardcodes `redmineflux_helpdesk`'s `sidekiq.yml`). Redis does start automatically. Add a Sidekiq block to `docker-entrypoint-with-jobs.sh` once the plugin's actual `config/sidekiq.yml` path (if any) is known.

## Confirmed Working

- **Redmine 6 core has a built-in Users bulk-import wizard** (Administration → Users → Actions dropdown → "Import", `/users/imports/new`) — not obvious from the main Users page, the "Import" link only appears inside the "Actions" dropdown next to "New user". It's a generic CSV importer (upload → options → field mapping → run), same pattern as Redmine's Issue importer.
- **The user importer DOES support mapping a `password` column** — without it, imported users get a random generated password (breaking this repo's shared `12345678` convention). Confirmed live: mapped `password` → all 20 seed users logged in successfully with `12345678`, no forced password-change prompt. `scripts/qa_seed_users_import.csv` (login, firstname, lastname, mail, language, password — generated from the canonical `scripts/seeds 1.rb` values, matching `QA_CREDENTIALS.md`'s Seed Users table exactly) is the reusable import file for onboarding the shared seed-user pool into any fresh Redmine instance via this UI path, as an alternative to running the Ruby seed script directly.
- Container restart note: `docker exec -it ...` fails with "cannot attach stdin to a TTY-enabled container because stdin is not a terminal" in this shell — drop `-it`, use plain `docker exec <container> <cmd>`.
- **Restart the container after every `rake redmine:plugins:migrate` run, before testing.** The already-running Puma process's ActiveRecord schema cache predates a migration run via a separate `docker exec` rake process — a newly-added column exists in the DB but the live server still throws `NoMethodError` on its accessor until restarted. Hit this for real: `is_helpdesk_customer=` (Helpdesk's `rf_customers_controller.rb:80`) 500'd right after migrating, looked like a plugin bug, was actually just a stale schema cache — confirmed by checking `DESCRIBE users` directly (column present) then restarting, which fixed it. Don't file a bug from a fresh-migration session without restarting first.

- **Two "consolidated" entities are already merged at `master`, independent of the platform plugin — don't assume the ticket's consolidation list is all still-pending.** Contact/Customer (CRM↔Invoice, via Invoice's own pre-existing `riv-006` spec, dated 2026-07-27 — three weeks before platform ticket #120043) and Team (Workload↔Timesheet↔Shift Management, one shared `rf_teams` table) both turned out to be already single-sourced when checked. Organization (CRM Company vs Helpdesk Organization) and Holiday (Workload vs Shift Management) are still genuinely duplicated as expected. **Always verify a "duplicated entity" assumption against the actual model source (`self.table_name`) before designing a migration-integrity fixture for it** — grep `grep -rn "table_name" app/models` in each plugin pair before assuming two plugins don't already share storage.
- **BUG-PLT-001 candidate RETRACTED — was my own testing artifact, not a real bug.** Original finding claimed Workload's `/rf_leaves` "Request Leave" modal has a broken off-screen datepicker. Root cause was that the modal (`#leaveRequestModal`, a right-side slide-in drawer, CSS `right: -500px` by default → `.active { right: 0 }` on open) was being interacted with in its **default hidden DOM state**, because Redmine's accessibility snapshot includes off-screen elements regardless of visibility, and I never actually triggered a genuine "+ Request Leave" click in that browser session before probing it. With a real click-to-open first, the datepicker opens correctly and the whole flow (date selection → leave type → reason → submit) works flawlessly with a clean "Leave request created and auto-approved" message, no console errors. **Lesson: before concluding an element is mis-positioned/broken, verify the triggering action was actually performed in this session** — check for a state-toggle class (`.active`, `.open`, `.show`) rather than trusting that snapshot presence means "actually opened."
- **BUG-PLT-002 confirmed real, root cause fully verified: `Setting.rest_api_enabled?` was `false` (Redmine's own out-of-the-box default) — not a plugin permission bug.** Timesheet's `/timesheets/weekly` "Log Time Entry" modal POSTs directly to Redmine core's own `/time_entries.json` REST endpoint. Redmine core refuses session-cookie authentication on `.json`/`.xml`-format requests when REST API is disabled in Settings (only a real API key or Basic auth works then) — so the request arrives as `Current user: anonymous` and gets a genuine `403`, surfaced by the plugin as a misleading "no permission for this project" message. **Fixed for this environment** by enabling Administration → Settings → API → "Enable REST web service" (confirmed via direct DB check `SELECT value FROM settings WHERE name='rest_api_enabled'` = `1`, persisted through a full container recreate) — retested live afterward, `POST /time_entries.json` now returns `201 Created` cleanly. **This means the Timesheet plugin's core time-logging feature is broken out of the box on any Redmine instance that hasn't manually enabled REST API** — worth filing as a real bug (the fix should probably not *require* REST API at all, e.g. by using a plain HTML-format form post or checking/enabling the setting itself, not expecting every admin to separately discover and flip this global setting).
- **Diagnostic technique that cracked BUG-PLT-002**: when a UI action fails with a permission-looking error, don't trust the message — check `browser_network_requests` immediately after the failed attempt, and check `docker logs` for the exact controller/action and `Current user:` line. `docker exec ... bundle exec rails runner "puts Setting.rest_api_enabled?"` (and toggling it the same way) let me test the real root cause directly in seconds, then re-verify live through the actual UI afterward to be sure the DB-level check reflects a real fix — don't stop at the rails-runner confirmation alone.
- **Timesheet's Submit-for-approval flow requires a `Project#approval_schema_id` to be set** (Timesheet's own Approval Schema concept, separate from anything in core Redmine) — a project with Time Tracking enabled and real logged time still shows no Submit control at all until a schema is assigned via Timesheet → Approval Schemas.
- **Plugin source location changed again 2026-09-29 (moved by user):** now at `C:\redmine-docker-6-platform\plugins` (inside the docker project folder), `docker-compose.yml` back to the standard `./plugins` relative mount. The `C:\redmineflux palform` external-mount phase (see above) was superseded within the same day — if referencing that note, check current `docker-compose.yml` for the live mount path rather than assuming either historical location.

- **2026-09-29: all PLT-BASELINE fixtures enriched with optional fields, plus new supporting fixtures created along the way** (per user request, "create all data with all fields ... do not miss any field"). New entities created that didn't exist before, purely to let existing fixtures' optional relation fields be filled in: Helpdesk Product `PLT-BASELINE-Product` (project `plt-baseline-project`), Helpdesk SLA `PLT-BASELINE-SLA` and Support Level `PLT-BASELINE-L1` (both on `plt-baseline-project`, needed before the Customer's Project-access row could have a real SLA/Support Level selected instead of "None"), and Workload Skill `PLT-BASELINE-Skill` (assigned to Redmine Admin on the QA Squad team, Advanced/Expert proficiency). The CRM Contact (`PLT-BASELINE-Jane Doe`) now also has Mobile, Assigned To, Helpdesk Customer link, and a Tag filled in. The Helpdesk Customer (`plt-baseline-customer-user`, ID 25) now has a full Project-access row (Project + SLA + Support Level + Organization all linked) instead of the deliberately-empty one from TC-PLT-005. Two Timesheet time entries that were missing Issue/Comment now have both. Helpdesk Organization, both Holiday records, and both Leave records were already fully populated — verified, no changes needed.
- **CRM Contact's "Products Purchased" multiselect widget doesn't persist a selection across Save — UI quirk, not filed as a bug.** On `/contacts/<id>/edit`, clicking a product in the "Select Products" dropdown visibly shows "1 selected" in the widget, but after Save and a fresh page reload the field reverts to "Select products..." (0 selected) every time, across two separate attempts. Not investigated further (network request / hidden-input inspection) since this is incidental to the platform migration-integrity testing, not something this cycle is scoped to file bugs against — flagging here in case a future CRM-focused cycle wants to check it as a real defect.

## Testcase coverage gap-fill (2026-09-30, per `docs/testing-promt.md`)

Cross-checked all 6 existing suites (93 TCs) against `testing-promt.md`'s comprehensive scope and the plugin's own `PLATFORM_PLUGIN_TESTER_GUIDE.md` §5/§7. Confirmed real gaps — none of the following had a written TC before today, despite two of them (Settings sync, Leave-entry-point submission) being exactly what surfaced `BUG-PLT-007/008/009/010/011`:

- Platform Settings sync (read + write direction) — added TC-PLT-094–097 to `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md`.
- New Leave submission via all 3 entry points (Platform/Shift Management/Workload) — added TC-PLT-098–101, same file.
- Team → Shift Management/Timesheet/Workload deep workflows (not just membership-visible, but actually usable) — added TC-PLT-102–106, same file.
- Delete-dependency handling for shared entities — added TC-PLT-110–112, same file.
- Header/breadcrumb/delete-modal-button UI consistency — added TC-PLT-107–109 to `PLATFORM_VOCABULARY_AND_LABELS.md`.
- Per-entity CRUD/field validation (search, sort, pagination, duplicate-name refusal, Team members, Leave approve/reject rules, Audit trail correctness, tags, responsive layout) — new suite `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`, TC-PLT-113–135.
- Platform's own permission model (`view_rf_platform`/`manage_rf_platform_<entity>`, admin-only Audit/Settings, hidden-UI-vs-blocked-URL) — new suite `PLATFORM_PERMISSIONS_AND_ACCESS.md`, TC-PLT-136–141. `PLATFORM_REQUIREMENTS.md`'s own Permissions Matrix is still blank — this suite is what will fill it in once executed.

Plugin-wide TC-PLT sequence now runs through TC-PLT-141, no duplicates (checked via the standard `grep -rhoE` dedup sweep). `PLATFORM_FEATURES_LIST.md` got features #28–34 added so the coverage column stays traceable. **None of TC-PLT-094–141 have been executed yet** except where the table above already marks a result from bugs found earlier this session (094/095/099/100/107/108/109 already have outcomes noted inline, since those bugs were found before the TCs were written down — the TC text was added retroactively to give them a durable home, not from fresh execution).

## Security suite executed 2026-10-01 — one confirmed Critical XSS, one role-drift lesson

`PLATFORM_SECURITY.md` (TC-PLT-210–222) executed in full except TC-PLT-221 (blocked — see its own Status note, needs two independent browser sessions, not achievable with a single shared-cookie-jar Playwright MCP context; HttpOnly session cookies also can't be read/replayed via `browser_evaluate`). One confirmed **Critical** stored XSS (`BUG-PLT-027`) and one Low documentation gap (`BUG-PLT-028`).

- **`BUG-PLT-027` — genuinely exploitable, not theoretical.** Both `overview/index.html.erb:118` and the shared `_holiday_calendar.html.erb:40` build a `title=` HTML attribute via `"title=#{value.inspect}".html_safe`, splicing it into a tag with no surrounding quote from the template itself. Ruby's `#inspect` only escapes for Ruby string-literal syntax (`"` → `\"`) — it does **not** HTML-escape `<`/`>`, and HTML attribute parsing doesn't honor a backslash as an escape character, so a literal `"` in the value terminates the attribute early at the real parser level and everything after becomes live markup. A Holiday name of `foo"><script>alert(1)</script>` fires on every single load of the Overview page, for any authenticated user, zero clicks needed. **Toggling the holiday's own Active flag off did NOT stop it firing** — the calendar's holiday lookup isn't active-filtered — the only way to stop it mid-session was editing the Name field itself. If retesting this fix, confirm the dev switched to Rails's own attribute-building helpers (`tag.div(title: ...)` or equivalent) rather than another hand-rolled escaping attempt, since a partial fix (e.g. escaping `<`/`>` but not re-checking `"` placement) could still leave the same class of bug.
- **Lesson for future sessions on this suite: role names drift from their original scope.** `PLT-QA-TeamsViewOnly` and `PLT-QA-SchemesOnly` were both created genuinely view-only, then had `manage_*` added to them later by a different TC in the same suite (the TC-138→TC-139 "now also grant manage" pattern), and were never re-split. A later TC (TC-PLT-211) that assumed the original name still meant "view-only" would have been testing the wrong thing. **Before reusing any named test role from this suite's "Test infrastructure created this run" list, re-check its actual current permissions at `/roles/<id>/edit` — don't trust the name or an older TC's own description of it.** `PLT-QA-ViewOnlyNoManage` (opal.sparrow) is the one role in the current set confirmed still genuinely view-only-on-Teams-only as of 2026-10-01.
- **Session-cookie testing (TC-PLT-221-style) is not practically achievable with a single Playwright MCP browser connection.** All tabs opened via `browser_tabs` share one cookie jar (one browser context) — logging in as a second user/role in a new tab overwrites the *same* session identity used by every other open tab, it does not create an independent second session. Session cookies are also `HttpOnly`, invisible to `document.cookie` / `browser_evaluate`. Any future TC needing "user A's session stays open while Admin revokes it elsewhere" needs either two separate Playwright MCP server connections (different browser profiles) or a manual two-window pass — flag this limitation rather than silently skipping or fabricating a result.

## ✅ All 3 of the ticket's own admitted "Known Gaps" are FIXED, undocumented — `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` suite complete (2026-10-01)

Ticket #120043 explicitly admitted 3 gaps as of its 2026-09-25 update. Re-tested all 3 against the current branch HEAD; none are still open, and none of the fixes are mentioned in any later journal update:

- **TC-PLT-090 (the single most important TC in this cycle) — Shift Management pre-platform data genuinely survives the upgrade.** Used the pre-upgrade (2026-09-28) `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-007/009 fixtures rather than new ones (explicitly allowed by TC-090's own precondition). All 3 — Holiday Scheme, Holiday, Audit entry — confirmed migrated via explicit source-tracking FK columns (`source_shift_schema_id`, `source_shift_holiday_id`, `source_shift_audit_log_id`) pointing at the exact original Shift Management row IDs, **and** all 3 preserve their original pre-upgrade `created_at` timestamps (not freshly created post-upgrade rows that merely share a name). This is the strongest possible evidence short of reading the merge migration itself — the ticket's "no data migration written, verified empty only on the dev's own instance" caveat no longer holds.
- **TC-PLT-091 — `contact_type` no longer stores the stale `'company'` value.** `db/migrate/032_data_rename_company_contact_type.rb` explicitly rewrites every `rf_crm_contacts.contact_type = 'company'` row to `'organization'`, confirmed applied (zero `'company'` rows remain in a live query) while the model still accepts the old spelling on input via `CONTACT_TYPE_ALIASES` so no API client breaks.
- **TC-PLT-092 — `rf_external_identities` is confirmed-present inert groundwork**, no UI errors anywhere referencing it, exactly as the ticket describes (no consumer feature built on it yet).
- **TC-PLT-093 — no silent-data-loss scenario was encountered** (TC-022's throwaway-DB test remains BLOCKED, but TC-090's real-data result is the fallback the TC itself names, and it was clean).

**Lesson: a dev ticket's own "known gaps" section can go stale just like a bug's journal — always re-verify against the current branch HEAD via direct DB/source evidence rather than assuming an admitted gap is still open.** `PLATFORM_REQUIREMENTS.md`'s Known Constraints section should be updated to drop these 3 as resolved.

## ⚠️ Audit Events search-by-name is broken for every LIVE record, not just the already-known "label regresses after deletion" case — `PLATFORM_PERFORMANCE.md` suite complete, one new bug (2026-10-01)

Executing `PLATFORM_PERFORMANCE.md` (TC-PLT-223–232, all 10 PASS on load-time) incidentally surfaced a correctness defect while checking TC-PLT-227's "confirm search-by-name still performs acceptably... not just correctly" instruction. Searching Audit Events for the name of a genuinely live, never-deleted record (`PLT-PERF-Org-150`, `PLT-PERF-Team-100` — both confirmed to exist, both confirmed to have a real `created` audit row) returns **"No record matches"** every time. Root cause: the `audit_events` entity's `search` lambda (`shared_entities.rb`) only matches `action`/`auditable_type`/`metadata` — never a live record's name — and `metadata` is `NULL` for every `created`/`updated` row (confirmed via direct query), since only the `destroy` hook ever populates it (the same root cause already documented for `BUG-PLT-021`). Filed as **`BUG-PLT-031`** (High) — a distinct, broader defect from `BUG-PLT-021` (display-label fallback after deletion) since this one means search-by-name **never works for any still-existing record**, which is the overwhelming majority of real audit rows and the single most common real-world use of an audit-search box. `TC-PLT-132` (prior session, PASS) only tested the one narrow case where this happens to half-work (searching for an already-deleted record's name) and concluded "not a separate defect in the search itself" — that conclusion didn't hold once the live-record case was actually tried.

**Lesson: a passing search TC that was only ever exercised against one specific record state (here, "already deleted") doesn't establish the feature works in general — re-test the same search against a record in its OTHER likely states (here, "still exists") before trusting the passing result generalizes.**

**Performance methodology note for future large-N suites on this plugin**: bulk fixtures (150 Teams, 200 Holiday Schemes, 500 Holidays, 15 Leave Types, ~264 Leaves, 300 Organizations, 500 Contacts) were created via `rails runner` model-layer `.create!` loops rather than literal Playwright UI clicks — this is NOT the same prohibition as `feedback_redmineflux_mcp_never_for_local_fixtures` (that rule is about the *production* redmineflux MCP server specifically; a local `rails runner` against this dedicated test container is the standard, correct way to seed volume for a pure list-rendering load test once the creation form's own correctness is already covered by other suites). No list screen showed a performance problem up to 2,423 rows; the single 2000ms cold-start outlier (Holiday Schemes' first hit after idle) did not reproduce on an immediate reload — don't mistake a first-request warmup cost for a scaling problem.

## ⚠️ The transactional outbox (`rf_outbox_events`) is fully built but has ZERO real callers anywhere in the codebase (2026-10-01)

Executing `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-024 required finding a real action that publishes an outbox event — the TC's own precondition flags this as unknown ("the ticket doesn't specify which user actions enqueue outbox events"). After this whole cycle's hundreds of create/update/delete actions across all 7 entities, `rf_outbox_events` has **zero rows**. Source audit (`grep -rn "OutboxEvent.publish!"` across the entire plugin) found exactly one match — a comment/example inside `outbox_event.rb` itself, never an actual call site anywhere in application code. **The `OutboxEvent` model, `OutboxDispatchJob`, and the `redmineflux_platform:outbox:dispatch_pending` rake task are all fully implemented, but nothing in the current codebase ever triggers them.** This is the same category as `rf_external_identities` (TC-092) — pure forward-looking groundwork, not a defect. The rake task itself was confirmed to behave correctly as a no-op against the empty table.

**Lesson: before spending time hunting for "a real action that triggers X," grep for the actual publish/trigger call site first** — if a feature's own model-layer API is never invoked anywhere in the codebase, no amount of UI exploration will find a triggering action, because none exists yet.

## ⚠️ Shift Management's own "Apply Leave" date fields silently reject any date past 2026-12-31 — HTML5 `max` attribute blocks submission with ZERO network request and ZERO console error (2026-10-01)

Cost a large amount of investigation time during `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-176: tried creating a leave dated in 2032 (matching this session's other disposable fixtures) via Shift Management's own "Apply Leave" modal — the Submit button produced **no network request at all**, no console error, no visible error message, across many retry variations (mouse click, keyboard Tab+Enter, direct `.click()` on the DOM element). Root cause, found only by calling `form.checkValidity()` / inspecting `el.validationMessage` directly: the `From Date`/`To Date` `<input type="date">` fields carry a hardcoded `max="2026-12-31"` attribute, and the browser's own native HTML5 constraint validation silently blocks `form.submit()`/click-triggered submission for any later date — this happens **before** any JS handler or network call, so there is nothing to see in the console or network tab. Switching to a 2026 date immediately fixed it.

**Lesson: when a form submission produces literally zero observable effect (no request, no error, no console message), check `document.getElementById('formId').checkValidity()` and each field's `.validationMessage` before assuming a JS/backend bug** — native browser-level HTML5 validation (`max`/`min`/`required`/`pattern`) fails completely silently from DevTools' perspective. **For any future TC on this plugin that needs a far-future date, check this field's `max` attribute first** (or just default to dates within the current year) rather than reusing a date far in the future that works fine on Platform's/Workload's own forms (neither of which has this cap).

A second, unrelated false alarm during the same investigation: `document.querySelector('input[type=submit]')` on this page matches the **page's own top filter-bar "Apply" button**, not the modal's "Submit" button — both are `input[type=submit]`, and the filter one appears earlier in DOM order. Scope any such query to the actual form (`document.getElementById('leaveApplicationForm')` or similar) rather than a bare tag/type selector when a page has multiple same-typed submit controls.

## ✅ `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` FULLY EXECUTED 2026-10-01 — the last unexecuted suite in the plugin, 4 new bugs found, 4 old bugs independently re-confirmed fixed

Resumed this file per the user's instruction to execute every remaining Platform testcase, after it had been paused 2026-09-30 pending an architectural decision that never ended up blocking further execution. Completed Holiday Scheme, Holiday, Leave Type, Leaves, Organizations, Contacts, and Audit Events sections (Team's section and TC-152 were the only pieces already done/resolvable) — roughly 46 TCs executed in one pass, each with live cross-plugin verification + DB confirmation, not just one leg.

**Genuinely useful side effect**: re-running Leaves/Leave Type's previously-FAIL scenarios (originally blocked by `BUG-PLT-009`/`010`/`011`/`012`) confirmed all 4 bugs are still fixed, independently of the retest already done earlier the same day — the matrix's own "test every origin's actual screen" design caught this for free rather than needing a separate regression pass.

**Four new bugs, all found by the matrix's own discipline of testing every origin, not just one**:
- `BUG-PLT-031` — Audit Events search-by-name structurally broken for any live record (see its own memory entry above).
- `BUG-PLT-032` — Holiday Scheme deletion cascades to its Holidays unguarded, same pattern as `BUG-PLT-030` on a different entity pair.
- `BUG-PLT-033` — Shift Management's own Edit Holiday form can never successfully change a date in either direction (a hidden `end_date` field it never touches goes stale). See the dedicated memory entry above for the investigation that found this — it cost significant time because the symptom (zero network request, zero console error) looked exactly like a JS/backend bug but was native HTML5 `max` attribute validation.
- `BUG-PLT-034` — CRM's own Contact detail view 500s for any Contact created via Platform's screen, because Platform's shared create path never sets `author_id` and CRM's `show.html.erb` has no nil guard on `@contact.author.name`. Found purely because TC-190 insists on checking the *other* plugin's own native screen after an edit, not just the DB/Platform's own view.

**Lesson this reinforces**: a cross-plugin CRUD matrix earns its cost specifically by checking every origin's own screen for every lifecycle stage — `BUG-PLT-034` would never have surfaced from testing Platform's screen alone (DB and Platform's own view both looked completely fine); it only showed up because the TC's own design insists on opening CRM's native detail page too.

One TC (152, team deletion with real cross-plugin dependents) was resolved by cross-referencing `BUG-PLT-030`'s own repro rather than building a third identical fixture — `BUG-PLT-030`'s investigation had already built exactly this scenario (disposable team + Workload + Shift Assignment, team deleted) and found Workload cascades while Shift Assignment survives (no FK to team); TimeSheet's independent confirmation (TC-105, same architecture) extends the same guarantee to TimeEntry.

With this suite done, **every suite in `redmineflux_platform_qa` has now had a first full execution pass** — `PLATFORM_PERMISSIONS_AND_ACCESS.md`, `PLATFORM_VOCABULARY_AND_LABELS.md`, `PLATFORM_SECURITY.md`, `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md`, `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`, `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md`, `PLATFORM_PERFORMANCE.md`, `PLATFORM_INSTALLATION_AND_UPGRADE.md`, `PLATFORM_OLD_ARCHITECTURE_BASELINE.md`, and now `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`. **This does NOT mean `STATUS.md` can be set to `Complete`** — per CLAUDE.md §10, that also requires `bugs/open/` to be empty (currently has 4 fresh bugs from today alone, plus any carried over) and a full-plugin regression pass once it is.

## ⚠️ Two parallel permission systems coexist for Team/Department/Policy-Band/Leave-Type — and Shift Management's own role-permission list still exposes 4 that should now be Platform's job (FILED as `BUG-PLT-047` 2026-10-13, see below — count corrected to 5)

User flagged confusion from Shift Management's own Role-edit screen (screenshot), which still lists `Manage Teams & Members`, `Manage Departments`, `Manage Policy Bands & Assignments`, and `Manage Leave Types` as its own project-level permissions, alongside genuinely Shift-Management-exclusive ones (`View Dashboard`, `Manage Attendance`, `Approve/Reject Shift Change Requests`, etc.). Asked for the flow to be explained: does a permission apply at Project level or Team level, and should these specific ones even still exist here.

**The two systems, and how they actually differ:**

1. **Redmine's own Role + Project-membership permissions** (what the screenshot shows) — assigned to a Role in Administration → Roles, then that Role is given to a user via Project → Settings → Members. Checked via `user.allowed_to?(:permission, project)`. This is **project-scoped**, has nothing to do with Team membership at all.
2. **`rf_team_memberships`' own per-row custom columns** — `role` (Member/Lead, confirmed dead per `BUG-PLT-037`), `can_approve_leave`, `manage_workload`. These are plain data columns on one specific team-membership row, checked directly by plugin business logic for "does this user have this flag, for this one team" — not a Redmine permission at all.

Per the user-supplied `Shift-Management-Knowledgebase.md` (read in full this session, see `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md` TC-PLT-272–280's header), the plugin's own original design deliberately layers both: project-level permissions (`approve_leave`, etc. — Manager/HR/Admin) grant **broad** capability across every team, while the team-membership `role: 'lead'` column grants **automatic, scoped-to-this-team-only** capability with no separate permission needed. That two-tier design isn't inherently wrong — but it predates Team/Department/Policy-Band/Leave-Type moving to Platform, and 4 of Shift Management's own project-permissions now plainly duplicate entities Platform is supposed to own:

| Shift Management's own permission | Overlaps with |
|---|---|
| `Manage Teams & Members` | Platform's "Create, edit and delete teams" — Team is now Platform's (`BUG-PLT-040`/`041`) |
| `Manage Departments` | Should be Platform's per `BUG-PLT-044`'s recommendation |
| `Manage Policy Bands & Assignments` | Should be Platform's per `BUG-PLT-044` |
| `Manage Leave Types` | Already partially Platform's (Leave Types mostly consolidated, `PLATFORM_LEAVE_CROSS_PLUGIN_FLOW.md` TC-PLT-264) |

Given `BUG-PLT-042` already found Workload's analogous legacy permission (`Manage teams and skills`) to be **completely dead** — toggling it has zero effect, Platform's own permission silently does the real gating instead — there's a real chance `Manage Teams & Members` is in the exact same orphaned state. `TC-PLT-280` (already written, not yet executed) exists specifically to test this live rather than assume it.

**Filed as `BUG-PLT-047` 2026-10-13**, per the user's own follow-up instruction to re-check every permission group live before filing ("manage holiday tum sari permission check kar lo... jo chize shared honi chahiye") — a full re-scan of every permission group on the role-edit page (not just the 4 already suspected) found a **5th**: `Manage Holidays`, missed in this note's original pass. All 5 filed together in one bug (same root cause/recommendation: retire each once its entity's own Platform-consolidation bug — `040`/`041`/`044`/`046` — lands), cross-referenced with `BUG-PLT-042`'s already-established pattern. The same scan also confirmed CRM's own `Manage Contacts`/`Manage Organizations` and Timesheet's/Helpdesk's own permission groups are NOT additional instances of this — see `BUG-PLT-047` for the full scope reasoning.

## ✅ Team/Leave/Holiday consolidation direction fully landed as of the 2026-10-15 retest — only `BUG-PLT-047` remains open

The entire Team/Department/Leave/Holiday consolidation audit from 2026-10-13 (`BUG-PLT-037` through `BUG-PLT-046` — 10 bugs) was retested live against a freshly rebuilt `redmine-docker-6-platform` (`localhost:3013`) on 2026-10-15 and **all 10 confirmed fixed**: the per-member "Team role" dead field and team-level "Team Lead" field are both gone (replaced by a working "Approve leave" checkbox); the Timesheet/Workload redirect buttons are now inline sections / a pure read-only view; Shift Management's duplicate Teams list now redirects to Platform; Platform now owns genuine Departments and unified Leave (Policy Bands + Assign Leave Band) screens; Workload's Apply Leave now enforces the Policy Band gate server-side; both Workload's and Shift Management's own Apply/Approve Leave UIs now redirect to Platform's one canonical screen; Platform's Holiday nav is unified and the SLA Holiday picker now correctly excludes inactive-scheme holidays. All 10 moved to `bugs/closed/`, production synced Done/100%.

**Only `BUG-PLT-047` remains open** — the 5 leftover Shift Management permissions (`Manage Teams & Members`, `Manage Departments`, `Manage Policy Bands & Assignments`, `Manage Leave Types`, `Manage Holidays`) are still present, unretired, confirmed via `/roles/permissions`, even though every entity they overlap with is now fixed on Platform's side. The permission-retirement step (and the role-migration it requires) hasn't landed yet — `TC-PLT-280` is the TC that should finally test this live, the same method `BUG-PLT-042` used.

## ⚠️ False-positive "no authorization scoping" finding on Attendance Corrections — both "control" accounts actually held a legitimate broad permission via a shared test role (`BUG-PLT-048`, filed then retracted, 2026-10-15)

While executing `TC-PLT-296` (checking whether a Department's "Manager" field grants any functional capability — expected inert, per the recurring "label field" pattern already seen in `BUG-PLT-037`), the live test appeared to surface a much bigger, unrelated defect. Set Department-Testing's Manager to a Team-Retest member with no approver/lead status, had another team member file a pending attendance correction, then checked whether the Department Manager could see/approve it. She could — and so, apparently, could a "control user" (`briar.sunset`) picked for having no obvious relationship to the team, department, or requester. Both users saw the pending request in `/shift_management/attendance_corrections` with working Approve/Reject buttons, and clicking Approve as the control user succeeded server-side — reproduced twice independently. This was briefly filed as `BUG-PLT-048` (High — broken access control).

**The user asked the right question before accepting the finding: "agar user ko project me permission he means uske role ko shift approve krne ki tab to nhi ho raha he na ye" — i.e., did either account actually hold a real permission that would legitimately explain this?** Checking directly via `rails runner` (`u.allowed_to_globally?(:approve_attendance_corrections)` and each user's role/membership) found **both `autumn.grace` and `briar.sunset` held the exact permission that explains everything** — a shared "QA Full Access" test role (assigned to most seed users on `PLT-DelCheck-Project` for unrelated earlier testing) includes `approve_attendance_corrections`. Reading `attendance_corrections_controller.rb` confirmed the code is correct: both the index and the approve/reject gate explicitly check `User.current.admin? || User.current.allowed_to_globally?(:approve_attendance_corrections)` before falling back to `TeamMembership.approvers`/`lead_team_ids` scoping — exactly matching the Shift Management KB's own documented tier ("Approvers: HR/Admin see all; team leads see only their team's requests"). Neither account was an "unrelated non-approver" at all; both were the broad-permission tier working exactly as designed.

**Retested properly** with a genuinely zero-permission, non-team-approver user (`willow.belle` — confirmed via the same `rails runner` check to have zero project memberships anywhere): correctly redirected away from the pending queue to her own empty "My Corrections" page, and a direct backend `fetch()` PATCH to the approve endpoint (bypassing the UI entirely) correctly returned **403**. The scoping is genuinely correct. `BUG-PLT-048` retracted — local file and screenshot removed, `bugs/_index.md` moved it to the Retracted section, and every testcase/matrix/handoff reference corrected from FAIL/Open back to PASS.

**Also discovered: TC-PLT-297 cannot be executed as written** — Shift Management's Reports page (`/shift_management/reports`, all 5 tabs: Summary/Attendance/Leave/Shift/Holiday) has **no "Department" filter anywhere**, only Employee/Team/Leave-Type/Status/date-range depending on the tab — contradicting the Shift Management KB's claim of a department filter. Logged as a KB/implementation mismatch (Not Covered), not a scoping defect, since there's no existing filter to test the scoping of. (This part of the original finding was unaffected by the retraction above.)

**Lesson, corrected from the original write-up of this entry: before trusting an account as a "control"/"unrelated user" negative case, check its actual permissions directly (`allowed_to_globally?`, role/membership listing) — never infer "unrelated" from the account's name, its role in an earlier unrelated test, or the absence of an obvious relationship to the current test setup.** This plugin's shared seed-user pool accumulates test roles across sessions (`PLT-DelCheck-Project`'s "QA Full Access" role, created for earlier Skills-permission testing, was still assigned to multiple users used as "control" accounts here) — a user who looks unrelated to *this* test's setup can still hold a broad permission left over from a *different* test's setup.

## ✅ Department and Team CRUD independently confirmed correctly gated by BOTH the Platform permission pair AND the legacy door, zero-permission users correctly blocked (2026-10-15)

Directly prompted by the user asking whether Department CRUD (and separately, Team CRUD) had actually been tested **with its permissions**, not just exercised as Admin or as a user who already held broad access. All earlier Department/Team CRUD testing this cycle (TC-PLT-279/296/298, the original Team walkthrough from `BUG-PLT-037`–`039`) was done with a user already holding multiple roles — never isolated to exactly one permission at a time.

Built 4 dedicated, single-permission test roles and assigned each to a genuinely zero-permission seed user (confirmed via `rails runner` before assignment — the direct lesson from the same-session `BUG-PLT-048` false positive, where a "control" user turned out to hold a broad permission from unrelated earlier test setup):

- `PLT-DeptCRUD-PlatformOnly` → `harmony.rose`: Platform's `view_rf_platform_departments` + `manage_rf_platform_departments` only.
- `PLT-DeptCRUD-LegacyOnly` → `summer.rain`: Shift Management's legacy `manage_departments` only.
- `Platform-Team-Permission-Test` (pre-existing, from `BUG-PLT-042`) → `violet.ember`: Platform's `view_rf_platform_teams` + `manage_rf_platform_teams` only.
- `PLT-TeamCRUD-LegacyOnly` → `celeste.dawn`: Shift Management's legacy `manage_teams` only.

**Result: all 4 roles independently got full Create/Edit/Delete on their respective entity** — both the Platform-only pair and the legacy-only permission work on their own, confirming `BUG-PLT-047`'s `register_permission_door` migration-safety net genuinely covers the full CRUD lifecycle (not just a generic index/manage check). A fifth user (`serenity.bloom`, zero project membership anywhere) was correctly blocked with a real 403 on both `/redmineflux_platform/teams/new` and `/redmineflux_platform/list/departments/new` — confirming the door is additive to the two registered permissions, not a blanket authenticated-user bypass. See `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md` TC-PLT-306–309 for full detail. Zero defects found. All 4 test roles and their assigned users left in place on `PLT-DelCheck-Project` as reproduction fixtures.

**Lesson, reinforcing the one from `BUG-PLT-048`:** this kind of "is permission X alone sufficient" test is only trustworthy if the test account is built from a genuinely clean user and verified via `rails runner` before the test, not assumed clean because the role name says so or because the user wasn't the focus of a different test.

## ✅ `BUG-PLT-047`'s "later release" landed same-day, and `BUG-WKL-001` fixed within hours of filing — `git pull` + restart + migrate retest, 2026-10-15

At the user's request, pulled `git pull` on all 7 consumer plugin repos under `plugins/` (skipping `flux_tags` per instruction), restarted the `redmine6platform-redmine-1`/`-sidekiq-1` containers, and ran `rake redmine:plugins:migrate RAILS_ENV=production`. All 7 pulls were clean fast-forwards, no conflicts, working trees confirmed clean on `redmineflux_platform` branch beforehand. Two new migrations landed and applied: `redmineflux_shift_management`'s `20261015120000_move_shared_permissions_onto_the_platform_again.rb` and `redmineflux_workload`'s `20261015000001_recalculate_planned_hours_without_split_parents.rb`, plus a new `setting_patch.rb` in Workload.

**`BUG-PLT-047` fully closed out.** The new Shift Management migration does exactly what the developer's own earlier journal note (read during this bug's correction saga, see above) promised: it unregisters all 5 legacy permissions from `Redmine::AccessControl` (the `register_permission_door` calls are removed from `platform_team_patch.rb` entirely) and, as its own migration-safety net, auto-grants the Platform equivalent to any role that still held a legacy one — including this session's own `PLT-DeptCRUD-LegacyOnly`/`PLT-TeamCRUD-LegacyOnly` test roles, confirmed via `rails runner` to have been silently upgraded with zero access lost. `/roles/permissions` (the exact screen the bug was filed from) now shows zero trace of any of the 5 names.

**`BUG-WKL-001` fixed within the same working session it was filed in.** The new `setting_patch.rb` hooks `Setting.after_commit` and calls `RfWorkloadCapacityCalculator.recalculate_all` whenever Platform's `working_hours_per_day` (or its legacy Workload/Timesheet fallbacks, or Redmine's own `non_working_week_days`) actually changes — mirroring the existing Holiday/Leave patch pattern this bug's own Recommendation asked for. Live-verified: an existing workload jumped from 110h to 176h total the moment the setting was saved, with zero manual action (no Edit, no button, no console call). The bug's second ask (a visible manual "Recalculate Capacity" button) was not added, but that was always framed as an independent fallback, not a blocker — the automatic hook is the actual fix for the reported symptom.

**Lesson: when a dev fix references a "later release" or promises a specific follow-up, a `git pull` across the affected plugins is worth doing proactively** rather than waiting for the dev to announce it on the production ticket — both of today's fixes (one explicitly promised in a journal note read hours earlier, one filed and fixed same-day) were sitting in the remote the moment they were checked for.

## ✅ Contact→Customer ticket surfacing works, but only via a SEPARATE manual link — not automatically from "Support portal login" alone (TC-PLT-303, 2026-10-15)

Setting a Contact's "Support portal login" field to a Helpdesk Customer user links the Contact to that customer for **organization/SLA details only** — the Contact page's "Helpdesk Customer Information" panel correctly shows Organization/SLA Level/Response Time/Resolution Time/Support Level immediately from that field alone. It does **not** automatically surface that customer's tickets.

To get a ticket to show under the Contact's "Linked Redmine Issues", you must separately open the ticket itself and use its own "CRM Links" panel → Contact → "Add Link" → select the Contact → Link. This is a per-ticket manual action, not a consequence of the customer-login link. Initially mis-read this as a bug (two-part KB promise with only half built) and filed `BUG-PLT-049`; the user caught it by pointing at the issue page's own CRM Links panel screenshot, and linking the specific ticket there did make it appear — retracted same session, never reported to production.

**Lesson: before filing a "promised feature doesn't render" bug, check every related screen's own linking UI (not just the record's own edit form) for a manual action that might be the actual intended mechanism.**

## ⚠️ Invoice DOES consume Platform's Contact data — via a per-project "Billing Settings" tab, not the global `/invoices/new` form alone (TC-PLT-305, 2026-10-15, second false-positive of the day)

Checked `/invoices/new` (reached via the top-nav "Invoices" link, with no project context) and found Client Name/Address/Email as plain empty free-text fields regardless of which project was selected — concluded Invoice had zero integration with Platform's Organization/Contact despite Platform's own Overview page claiming "Customers ... Read by CRM, Helpdesk, Invoice", and filed `BUG-PLT-050`.

The actual mechanism is a **project-scoped** screen only visible once you're inside a project's own Invoice section: `Invoice → Billing Settings` (`/projects/<id>/invoices/billing`), with its own "Contact *" dropdown — *"Select the contact for this project. Contact details will be used in invoices."* Setting a Contact there, then opening `/projects/<id>/invoices/new` (not the global `/invoices/new`), correctly auto-populated Client Name and Client Email from that Contact. The user caught this by screenshotting the Billing Configuration panel directly. Retracted same session, never reported to production.

**Lesson: this is the SAME root cause as the TC-PLT-303 false positive above — twice in one day. Before concluding a cross-plugin integration "doesn't work" or "doesn't exist," check for a project-scoped settings/config screen (reached only via a project's own nav, not the plugin's top-level nav) in addition to the record's own edit form and any related record's linking UI. A plugin's global top-nav screen and its per-project screen can have completely different field sets and behavior.**

## ✅ Contact Links, Deal creation, and Invoice creation all confirmed fully working with Platform's Contact/Organization (TC-PLT-310–312, 2026-10-15)

At the user's direct request to close out remaining untested Contact consumption points: `BUG-PLT-026`'s original finding ("the `rf_organization_contact_links` feature has a fully built data model but zero UI") is now fully resolved — `/redmineflux_platform/list/organization_contact_links/new` exists, works end to end (Organization, Contact, Role, From/Until, Primary contact all persist), and correctly surfaces on the Contact's own page under "Other organizations". CRM's Deal creation from a Contact (`/deals/new?contact_id=<id>`) correctly pre-fills and locks the Contact field, auto-selects the Contact's own Organization, and both fields on the created Deal are real hyperlinks back to Platform's screens — not copied data — with Forecasted Value correctly auto-calculating as Amount × Probability. Full Invoice creation (not just the New Invoice form's field auto-population already covered by TC-PLT-305) was also carried through to a real submitted invoice, confirming Bill To/line items/Subtotal/Total all work correctly end to end. Zero defects found across all three.

**One false-alarm moment worth flagging for future sessions:** mid-test, a project's Billing Settings Contact appeared to change on its own between two page loads. Before concluding this was a bug, checked with the user directly — they had made the change themselves concurrently. Lesson: an unexplained state change on a screen you didn't touch is a prompt to ask before filing, not just a prompt to investigate further — especially late in a session with multiple tabs/background navigations open, where it's easy to lose track of exactly what you yourself did.

## ✅ Contact Links, Deal creation, and Invoice creation permissions all isolated-tested, zero leaks (TC-PLT-313–315, 2026-10-15)

At the user's direct request ("ab permission wise testing bhi kr lo"), closed the one remaining permission gap in this area: `rf_platform_organization_contact_links` (view/manage) had never been isolated-tested since the feature was built (it didn't exist when `PLATFORM_PERMISSIONS_AND_ACCESS.md`'s "all 15 permissions" pass was done 2026-09-30). Built 3 dedicated single-permission test roles (`PLT-ContactLinksOnly`, `PLT-DealsOnly`, `PLT-InvoiceOnly`), assigned each to a genuinely zero-permission seed user (`willow.belle`, `daisy.skye`, `serenity.bloom` — all confirmed clean via the project membership list first, per the lesson from this session's own `BUG-PLT-048` false positive). All three PASS, fully isolated (403 on Teams/every unrelated screen in each case).

**One genuine design finding worth remembering, not a bug:** CRM's own `View CRM` permission grants *view-only* access to Platform's Contacts/Organizations screens (200 OK, full list) even for a user with zero `rf_platform` permissions at all — confirmed this is strictly view-only (manage actions still correctly 403 without the dedicated Platform permission). This is a deliberate OR-permission pattern (CRM users can see the shared data CRM itself displays), not a leak. Separately, a Deal's own "Delete" action requires CRM's `Delete CRM Data` specifically — neither `View CRM` nor `Manage Deals` alone shows the Delete link, a third independently-gated action worth remembering if this area gets audited again.

**One more false alarm caught before being misdiagnosed as a permission bug:** while testing Contact Links' manage permission, the "Create" button appeared completely non-functional for two attempts (zero network requests sent). A screenshot revealed the real cause — a native HTML5 "Please select an item in the list" validation popup, because the Organization dropdown had silently reverted to its blank placeholder option. Not a permission issue at all; explicitly re-selecting the Organization fixed it immediately. **Lesson: when a button "does nothing" with zero network activity and no console error, take a screenshot before suspecting the permission system — a native browser validation tooltip is invisible in the accessibility-tree snapshot alone.**

## ⚠️ `BUG-PLT-052`: "View holiday schemes"/"View holidays" permission checkboxes have no effect — a regression against 2026-09-30's own PASS results (2026-10-16)

At the user's direct request ("user ko ke roles and permission check kr lo ek bar" — go check the user's roles
and permissions once), retested `PLATFORM_PERMISSIONS_AND_ACCESS.md`'s TC-PLT-137/204/205 on this environment
(`redmine6platform`), which originally PASSed 2026-09-30 on a different Docker instance
(`redmine-docker-6-platform`). The result is no longer the same: a genuinely zero-permission user
(`marigold.rayne`, no project membership, confirmed via her own nav missing "Redmineflux Platform" entirely) can
open both `/redmineflux_platform/list/holiday_schemes` and `/redmineflux_platform/list/holidays` directly and see
the full real list. A dedicated single-permission test role (`PLT-SchemesOnly-20261016`, only
`view_rf_platform_holiday_schemes` granted) leaks the same way into Holidays too. Teams/Leave Types/Organizations/
Contacts all still correctly 403 for both accounts — the regression is isolated to these two entities.

**Root cause (confirmed from source):** `lib/redmineflux_platform/shared_entities.rb` declares both
`holiday_schemes` and `holidays` with `open_to_all: :view`, which makes `Entry#visible_to?` return `true`
unconditionally for any logged-in user, before the entity's own `view_permission` is ever consulted. The
Permissions report (`/roles/permissions`) still shows "View holiday schemes"/"View holidays" as ordinary,
unchecked, role-scoped checkboxes for roles that don't have them — nothing on that screen hints they're
non-functional. An administrator unchecking either believes they've restricted access; they haven't.

**Checked Leave too, before assuming it was the same bug — it isn't.** `leaves` is also `open_to_all` (`: true`
this time), but the user specifically asked whether Leave even has/needs a view permission, which led to
checking the actual *scope* of what opens, not just whether it opens. `marigold.rayne`'s own Leaves list shows
"0 — No Leaves yet", hardcoded to her own requests only, with no "Whose" filter to broaden it (unlike an
approver's view, which offers "Everything I can see"). This exactly matches the entity's own documented design
intent (the code comment: "every employee files their own leave" — mirroring redmineflux_shift_management's and
redmineflux_workload's pre-consolidation behavior, which required no permission for this either). Holiday
Schemes/Holidays have no equivalent per-record scoping — they're shared, unscoped reference data — so the same
`open_to_all` mechanism produces a real over-exposure there that it does not produce for Leave.

**Lesson: when the same code mechanism (`open_to_all`) governs multiple entities, don't assume they all behave
identically** — one may be a correct, scoped design and an adjacent one may be a genuine gap, depending entirely
on whether the underlying data is per-user or shared. Checking the actual rendered *content*, not just the
HTTP status, is what told them apart here. Filed as `BUG-PLT-052`.

## ✅ `PLATFORM_HOLIDAY_CROSS_PLUGIN_FLOW.md` fully executed — last 9 TCs (TC-PLT-287–295), 0 bugs, admin + non-admin confirmed (2026-10-16)

At the user's direct request ("execute them from starting test with admin and non admin user"), closed out this
suite's last gap. All 9 PASS. Workload's capacity engine (TC-287–289) correctly reduces capacity for an
active-scheme holiday and ignores an inactive-scheme one — confirmed identically from an admin session and a
genuine non-admin team-member session (`aurora.wren`, user #15), no role-based discrepancy anywhere this suite
touches a view screen. Helpdesk's SLA clock nuances (TC-290–291) didn't need fresh execution — they're the exact
same scenarios already proven by `BUG-HLP-071`'s own retest the same day, so cross-referenced rather than
re-run. TC-292 (escalation-on-holiday, the one point no vendor KB documents) was answered with a full
source-level trace rather than a live Sidekiq-cycle wait: every deadline-setting call site in Helpdesk — ticket
creation, first response, reopening — funnels through the one `SlaCalculator`, and the escalation worker itself
has zero independent holiday logic, just a `deadline < Time.current` comparison against the already-correct
stored value. Escalation structurally cannot fire against a holiday date.

**One documentation correction worth remembering, not a bug:** the Workload KB's instruction to "run Recalculate
Capacity from the workload detail page" doesn't match the real UI — no such button exists anywhere on that page.
Capacity recalculates automatically on any holiday change, which is strictly better than what's documented, not
a regression.

**Lesson for future TC execution:** when a fresh TC's scenario turns out to be identical to one already proven
by a same-day bug retest, cross-reference it explicitly rather than re-running the exact same check — but still
write up the cross-reference as the TC's own result, don't leave it silently "not yet executed" just because the
underlying work was done under a different heading.

## ✅ Recurring-holiday bugs (`BUG-SFM-002`/`BUG-HLP-071`/`BUG-WKL-002`) — found, filed, and CONFIRMED FIXED (2026-10-15/16)

Found 2026-10-15 while testing `PLATFORM_HOLIDAY_CROSS_PLUGIN_FLOW.md` (TC-PLT-316–318), at the user's direct request to check whether a Holiday marked Recurring actually applies in the *current* year (not just the year it was created), across every plugin that reads Holiday data. It did not in any of the three: Shift Management's Calendar, Helpdesk's SLA clock, and Workload's Gantt chart each had their own independent, naive literal-date-match re-implementation that ignored the `recurring` flag entirely, even though Platform's own `WorkingCalendar`/`HolidayEngine` already handled it correctly and some *other* screen in each plugin (Shift Management's Dashboard, Workload's own capacity-aggregation figures) already consumed that correct shared logic. Filed as 3 separate bugs (same root-cause *class*, three unrelated code paths), reported to production, assigned to Prashant Chaurasia.

**CONFIRMED FIXED 2026-10-16**, same day as the developer's turnaround: per the user's instruction, pulled all 4 affected plugins (`redmineflux_platform`, `redmineflux_shift_management`, `redmineflux_helpdesk`, `redmineflux_workload`, branch `redmineflux_platform`, `flux_tags` excluded) and restarted the container + Sidekiq. All 3 fixes landed in the shared `working_calendar.rb`/`holiday.rb` plus each plugin's own previously-naive consumer. Retested all 3 live (Shift Calendar highlighting, Workload Gantt label, and a direct `rails runner` check of Helpdesk's `SlaCalculator` for precision) — all PASS, 0 regressions across all three plugins. Closed locally, all 3 production issues synced to Done/100%.

**Lesson, worth remembering for any future shared-service audit on this codebase**: when one plugin builds a correct, shared calculation service (`WorkingCalendar`), don't assume every *consumer* of the data it models actually calls into it — three separate screens across three separate plugins each quietly reinvented the same "is this date a holiday" logic, badly, while sitting right next to a correct implementation the whole time. Worth spot-checking every known consumer of a shared data type when auditing one of them, not just the type's own service.

## ✅ Prepaid Support Hours (Helpdesk, Organization-scoped) fully exercised live, 0 confirmed bugs — one caught false-positive draft (2026-10-15)

At the user's direct request ("helpesk ka prepaid hours test kiya baki chize bhi test kr liya kya"), tested Prepaid Support Hours end to end on `TC-PLT-302-Test-Org` / `PLT-DelCheck-Project`: Top-up/Reduction (ledger accurate), automatic deduction on time logging against a billable activity, Hard-stop enforcement (blocks over-budget entries with a precise error, blocks entirely at zero), and Soft-overage enforcement (correctly allows a negative Remaining balance — this is itself the documented behavior for Soft mode, not a bug). All PASS.

**One caught false-positive, worth the lesson:** tested the Deduction rules dialog's own "Minimum time per ticket" setting (30 min configured) by logging 10 minutes against a fresh ticket and closing it, expecting the shortfall (20 min) to auto-log per the dialog's help text ("the difference is logged automatically so the budget always reflects at least this much per ticket"). No change occurred — drafted as `BUG-PLT-051`. The user caught that the only source for this expectation was the dialog's own UI copy, not a confirmed separate requirement, and had it retracted before filing to production. Checked Sidekiq's cron schedule on this container (`redmine6platform-sidekiq-1`) first to rule out a missed-background-job explanation — only `email_checker`/`sla_monitor`/`auto_close_tickets` are registered, so if this feature exists it would need to fire synchronously, not async — but that alone doesn't establish the UI copy as a binding requirement. **Lesson: an in-app tooltip/help-text string is evidence of intended behavior, not proof of a requirement — treat it the same as a developer's "For QA" journal note (see `HELPDESK_MEMORY.md`'s own general lesson on this): verify it traces to something firmer before asserting a defect, and when the user directly disputes the premise, retract rather than argue from the UI text alone.** Logged as TC-HLP-434 in `HELPDESK_PREPAID_HOURS.md` (the actual home of this feature's test suite — Prepaid Support Hours is a Helpdesk feature surfaced on Platform's Organization detail page, not a Platform-owned feature) as observed-but-unconfirmed, pending clarification of the actual intended behavior.

## ⚠️ `BUG-PLT-053`: consolidating duplicate UI (`BUG-PLT-045`) silently dropped a business rule (`BUG-PLT-036`/`BUG-PLT-043`'s Policy Band gate) that each of the old duplicate forms enforced independently (2026-10-16)

At the user's request, re-tested `PLATFORM_LEAVE_CROSS_PLUGIN_FLOW.md`'s TC-PLT-270/271 live against the now-consolidated Leave flow (`BUG-PLT-045`, closed 2026-10-15 — Shift Management's and Workload's own Apply Leave screens now both redirect to Platform's single `/redmineflux_platform/list/leaves/new`). Confirmed the environment has **zero** Leave band assignments at all (`/redmineflux_platform/list/user_band_assignments` → "0"), then submitted as `aurora.wren` (zero band): the Leave Type dropdown listed every Active Leave Type unfiltered despite its own helper text ("Only the types their band allows are listed"), and the submission succeeded outright (Leave #9, Status Pending). Filed as `BUG-PLT-053` (TC-PLT-319).

**Root cause pattern, not yet source-confirmed but strongly implied by the fix history:** `BUG-PLT-036` and `BUG-PLT-043` each added the Policy Band gate independently, inside the two old plugin-specific forms/controllers. `BUG-PLT-045`'s consolidation replaced both of those forms with one new canonical path under Platform's own `EntitiesController`/Leave view — but neither old form's gate logic appears to have been ported into the new shared path, so the single remaining form regressed back to the pre-`BUG-PLT-036`/pre-`BUG-PLT-043` behavior for every caller at once, not just one plugin.

**A mid-investigation complication, resolved, not a flaw in the finding:** while re-verifying the created Leave #7 (an earlier attempt, before this clean reproduction), the record appeared to vanish (404 on direct URL, absent from list filters, `rails runner` showed `Leave.maximum(:id)` = 6 at the time). Server logs (a `Mailer::DeliveryJob` with a real `GlobalID` reference to `Leave/7`) proved it had genuinely been created, and the user then clarified they had deleted it (plus a second manual test leave #8 and several Leave Types) in a parallel admin session while this investigation was in progress. The "disappearance" was purely an artifact of that concurrent cleanup — re-reproduced cleanly afterward as Leave #9, left in place this time as the evidence record.

**Lesson, generalizing the one already written for `BUG-PLT-013`/`014`/`015` ("duplicate UI pointing at shared data drifts")**: the inverse direction is just as real a risk. **Collapsing N duplicate forms into one (the correct fix for a `BUG-PLT-045`-style finding) must separately re-verify that every per-form business rule each of the N old forms enforced independently survived the merge** — consolidation fixes the duplication defect but can silently reopen whatever enforcement gap had already been separately, individually fixed on each of the forms being merged away. A "the UI is now unified" retest is not the same test as "the old form's specific validation still fires on the new one" — both need their own pass.

## ⚠️ `BUG-PLT-053` corrected (not retracted) after testing the opposite edge of the same condition — and a genuinely new bug found doing it (2026-10-16, same day)

At the user's explicit request, ran a full live pass over every area of the Leave module in one session
(`PLATFORM_LEAVE_CROSS_PLUGIN_FLOW.md` TC-PLT-320–327): Policy Band CRUD, Band Assignment CRUD, and — critically
— **the assigned-band case**, which no prior session (including the one that filed `BUG-PLT-053` itself earlier
the same day) had ever actually tried. Only the zero-band case had been tested.

Created Policy Band `QA-Band-EmergencyOnly` (allows only "Emergency Leave"), assigned it to `aurora.wren`, then
submitted both a disallowed type and an allowed type as that now-banded user. Result: the disallowed type was
correctly rejected server-side with an explicit error, and the allowed type succeeded — **the Policy Band gate
genuinely works for a banded user.** `BUG-PLT-053`'s own title ("zero Leave Policy Band enforcement") had
overstated the defect to the whole feature, when only two narrower things are actually broken: (1) a user with
**no** band assigned at all bypasses validation entirely (the real, still-valid defect), and (2) the Leave Type
dropdown never pre-filters on initial page load for *anyone*, zero-band or banded (a separate, more cosmetic UX
gap, since the server-side check still catches a banded user's wrong choice at submit time). Corrected the local
bug file with a dated "Correction" section and added a clarifying comment to production #123786 rather than
closing/reopening — the core finding (zero-band bypass) was never wrong, just the stated scope.

**The same pass, checking the natural next question ("does the resulting Leave calculate correctly in
Workload/Shift Management"), surfaced an unrelated, genuinely new bug — this time in `redmineflux_workload`, not
Platform.** Comparing a still-Pending leave against an Approved one on the same Workload's own Gantt chart,
both showed identically as "on leave" with no visual distinction. A direct `rails runner` call into
`RfWorkloadGanttDataService#count_working_days` proved this isn't just a display quirk: the Pending leave was
already being excluded from the member's available working days (10 vs. 11, a full day/8h), weeks before any
approver had acted. Shift Management's own calendar, given the exact same two records, correctly distinguished
Approved-only. Filed as `BUG-WKL-003` (see `WORKLOAD_MEMORY.md` for the full write-up) — a second, independent
instance of the same file's `BUG-WKL-002` pattern (reimplementing a shared concept, here leave-approval-status
scoping, instead of delegating to the already-correct `CapacityAggregator`).

**Lesson, stacking directly on the one above about consolidation**: **testing only one edge of a two-sided
condition (zero-band / pending) can go wrong in either direction** — it can make an existing bug look broader
than it is (here, overstating `BUG-PLT-053` to "zero enforcement" when enforcement works for the other edge), or
it can hide a completely different bug sitting on the untested edge (here, `BUG-WKL-003`, invisible if only the
zero-band Leave had ever been checked against Workload's capacity math). **Whenever a finding is framed around
one specific state of a toggle/flag/assignment ("has none", "is pending"), explicitly test the opposite state
too before either scoping or closing the investigation** — both directions here needed their own pass, and
neither could be inferred from the other.

## ⚠️ Not every "two similar-looking permissions in two plugins" is `BUG-PLT-047`'s pattern — Leave's global `approve_leave` is a deliberately-preserved alternate path, confirmed via a dedicated ADR (2026-10-16)

At the user's explicit request to check Leave together with its permission model, tested whether Shift
Management's own "Approve / Reject Leave" permission (listed separately on the Permissions report, under Shift
Management, alongside Platform's own "File and decide leave requests") is another leftover duplicate like
`BUG-PLT-047`'s five retired ones. It is not — it is live and intentional.

**Live proof**: created role `PLT-LeaveApprovalLegacyOnly` holding *only* that one Shift Management permission
(no Platform Leave permission, no team relationship whatsoever to the leave's owner), assigned it to
`willow.belle` on a project unrelated to the leave owner's own team, and had her successfully approve
`aurora.wren`'s Pending leave (`Decided By: Willow Belle` recorded, status → Approved).

**Confirmed deliberate in source**: `RedminefluxPlatform::Leave#can_be_approved_by?`/`#visible?` and
`TeamService.approves_leave_globally?` explicitly call `user.allowed_to?(:approve_leave, nil, global: true)` —
Shift Management's own permission symbol — as a second, equally-valid authorization path alongside the
team-approver mechanism. This isn't an oversight: it has its own architecture decision record,
`redmineflux_platform/doc/adr/0002-union-not-narrowest-permission.md`, and the model's own comment states the
reasoning directly: *"A user can hold the global permission with no approver membership, or the reverse, and
each grants access somebody relies on today — so both are honoured. Dropping either here would silently revoke
live access."*

**Worth flagging, not filing**: the permission is a true Redmine *global* check (`global: true`), so granting it
via a role on any single project gives that user approval authority over every employee's leave company-wide —
not scoped to that project, not scoped to a team. The Permissions report's own checkbox carries no hint of that
scope. An admin reading "Approve / Reject Leave" under a Shift-Management-grouped role could reasonably assume
project/team scoping that doesn't exist. Not a functional defect (everything works as the ADR intends), but a
real trap for an administrator configuring roles without having read the ADR.

**The other two Shift Management Leave-adjacent permissions were checked the same way and are both genuinely
fine, for two different reasons**: `:manage_leave_balances` correctly gates a still-active, genuinely
Shift-Management-owned Leave Balances feature Platform has never claimed (seen as the, currently-empty, "Leave
Balance" widget on Shift Management's Dashboard); `:view_leave` gates a controller whose `index`/`show`/`my_leaves`
actions are now pure one-line redirects to Platform's own screen (a `BUG-PLT-045` leftover) — gating it has no
real security effect since Platform's own Leave screen is itself `open_to_all` regardless (see `BUG-PLT-052`),
so it's a redundant speed bump on one old URL, not a duplicate worth retiring.

**Lesson, as a direct counterpoint to the `BUG-PLT-047` pattern this plugin keeps surfacing**: seeing two
similarly-named permissions split across two plugins' sections of the Permissions report is not, by itself,
evidence of a leftover duplicate needing retirement. The only reliable way to tell a genuine `BUG-PLT-047`-style
dead duplicate apart from a deliberately-preserved alternate path (like this one) or a still-legitimately-owned
feature (like Leave Balances) is to read the model/service source directly — and specifically to check whether
there's a dedicated ADR or code comment explaining *why* a second path exists, since a team that deliberately
keeps dual authorization paths usually also documents the reason, the way this one did.

## ⚠️ `BUG-PLT-054`: "the permission model is fine" after checking ONE auth path on an entity doesn't mean every path is — caught because the user asked directly (2026-10-16, same session)

Right after the entry above concluded the Leave permission model was fully checked and fine, the user asked
directly: "did you check platform leave permission are working or not??" That question exposed a real gap —
the investigation above (now TC-PLT-328/329) had only exercised `can_be_approved_by?` (deciding someone else's
leave); it never touched `manage?` (filing your own leave at all), which is what Platform's own "File and decide
leave requests" permission (`manage_rf_platform_leaves`) is supposed to gate.

Checking it (TC-PLT-330) found the exact same defect shape as `BUG-PLT-052`: `Entry#manage?` in
`shared_entities.rb` returns `true` unconditionally the moment `@open_to_all == true` — which `leaves` is —
**before `manage_permission` is ever consulted**. A genuinely zero-permission user (`marigold.rayne`, same
account `BUG-PLT-052` used) opened `/redmineflux_platform/list/leaves/new` with no 403 and created a real leave
record. Confirmed via direct service call too: `entry.manage?(marigold_rayne)` → `true` while
`marigold_rayne.allowed_to?(:manage_rf_platform_leaves, ...)` → `false`. Filed as `BUG-PLT-054`.

**This is a different gate from the one `BUG-PLT-048`'s investigation taught a similar lesson about** (that one
was about *scope* — team vs. global — not about whether a permission did anything at all), but the shape of the
mistake is the same family: an entity can have **multiple independent permission checks** gating different
actions (here: `manage?` for filing, `can_be_approved_by?` for deciding, `visible_to?`/`visible` for viewing),
and confirming one of them works correctly says nothing about the others. `BUG-PLT-052` already established that
`visible_to?` for Holiday Schemes/Holidays was broken; this session separately had to re-discover that `manage?`
for Leave has the identical defect shape, on a different entity, because testing `can_be_approved_by?` first
didn't surface it.

**Lesson, stated plainly for next time**: when asked "does permission X work," identify the exact
method/action X is supposed to gate and test THAT path specifically — don't let a nearby, successfully-tested
permission on the same screen or the same entity stand in for it. For any `shared_entities.rb` entity with
`open_to_all` set to anything other than `false`, check **both** `visible_to?`/`visible` (view permission) and
`manage?` (manage permission) independently before concluding either one's checkbox has real effect — a `true`
value for `open_to_all` bypasses `manage?` entirely (as found here), while `:view` only bypasses `visible_to?`
(as found in `BUG-PLT-052`) — the two are not interchangeable guarantees.

## ✅ Overview page audited widget-by-widget against the permission model, 0 new defects — `PLATFORM_OVERVIEW.md` created (2026-10-16)

At the user's explicit request ("platform ka overview ek bar admin se test kr lo or then ek user lo usko bari
bari permission de ke check kro... kuch bhi miss mat krna kiu ki yaha pe data show hota he"), built a new suite
testing the Overview page (`/redmineflux_platform`) against the permission model directly — a gap that existed
even after the extensive `BUG-PLT-052`/`053`/`054` investigations this session, since all of those checked
individual entity list screens, never this specific landing page's own widgets.

**Method**: one dedicated role (`PLT-OverviewIncremental`), one test user (`marigold.rayne`, the repo's standing
zero-permission reference account, temporarily given a project membership for this suite and **removed again
afterward**), permissions toggled directly via `rails runner` between checks (no re-login needed — Redmine
re-evaluates `allowed_to?` per request) for speed across ~9 single-permission combinations.

**Result: the page's own claim to be fully permission-aware held up.** Every "Your records" card
(Teams/Departments/Leave Types/Leave Policy Bands/Leave Band Assignments/Organizations/Contacts/Contact Links)
tracked exactly its own `view_rf_platform_<key>` permission with zero cross-entity leakage. The attention
band's view-vs-manage distinction held too — the "duplicate organizations" tile correctly stayed hidden for a
view-only Organizations permission (confirmed from source: `manage?` gates it before the duplicate scan even
runs). The Create dropdown's `manage?`-only filter correctly excluded "New Organization" for a view-only grant.
Leave's own pending-count widget, despite `leaves` being `open_to_all`, correctly showed only the viewer's own
leave (`Leave.visible` scoping is untouched by `BUG-PLT-054`'s separate `manage?` bug) — confirmed this is NOT a
third leak, just the same two known bugs (`BUG-PLT-052`/`054`) reaching this page too, which TC-PLT-338 records
explicitly so a future fix-retest knows to check here as well as each entity's own list URL.

**One genuinely new, but not-a-bug finding**: `audit_events` carries `admin_only: true`, so granting its view
permission to a non-admin role has **zero effect** under any circumstance — `Entry#visible_to?` refuses a
non-admin unconditionally for this one entity, before the permission is even read. If it's the *only* permission
a role holds, the entire Overview page 403s (no entity ends up visible, so the section gate itself fails). This
is the **safe-direction** counterpart to `BUG-PLT-052`/`054` (denies access that might have been intended, rather
than granting access that shouldn't exist) — confirmed intentional via source, not filed as a defect, but logged
as a "this checkbox can never do anything for a non-admin" trap worth remembering if a future admin complains
"I gave this role View Audit Events and it still can't see anything."

**Lesson for any future "test page X with a permission matrix" request**: toggling permissions via
`Role#add_permission!`/`#remove_permission!` directly (rather than clicking through `/roles/<id>/edit` each
time) and reloading the already-logged-in test user's page is dramatically faster for an N-permission sweep than
a UI click + logout/login cycle per combination, and is equally valid evidence since the live page still renders
through the real controller/view — reserve the UI-click method for the one or two combinations worth a
screenshot, not for the whole sweep.

**Addendum (same day): the user caught that two specific UI elements hadn't been explicitly named as their own
check** — the "+" (New X) icon beside each "Your records" row, and the redirect links themselves (attention
cards, calendar/holiday links, "Away next" user links, row links). The underlying logic (`manage?` for the "+"
icon, same method the Create dropdown already used) had technically been exercised by TC-PLT-333/336, but never
called out by name or confirmed with an explicit href-level check. Added TC-PLT-339: confirmed the "+" icon
tracks `manage?` identically to the Create dropdown (absent for a view-only Organizations grant, present for
Leaves due to the already-known `BUG-PLT-054`), and confirmed every redirect link on the page loads a real,
working page rather than erroring. **Lesson: when a user names a specific UI element directly ("+ icon",
"redirect link"), it's worth adding an explicit, separately-labeled test for that exact element even if a
broader existing test already exercises the same underlying logic** — "the logic is covered" and "that specific
element is confirmed" read as the same claim but aren't, and the user's phrasing is a signal about what they
actually want documented as checked, not just what's technically true.

## ⚠️⚠️ `BUG-PLT-055`: filed, then retracted the same session — two real lessons, in the opposite direction from each other (2026-10-16)

**Part 1 — a "representative sample" of permissions passed cleanly, and the untested half held what looked like
a bug.** Right after the Overview permission audit concluded 9/9 PASS, the user pushed back directly: "tume one
by one platform ki sari permission de kar overview page test nhi kiya he" — correctly identifying that the
original sweep tested only the 9 `view_rf_platform_<key>` permissions, never the matching
`manage_rf_platform_<key>` ones. Platform registers **24 permissions in total**
(`Redmine::AccessControl.permissions`, confirmed by name): `view_rf_platform`, the legacy `manage_rf_teams`
(Timesheet-facing), and 11 `view_*`/`manage_*` pairs. Completing the sweep found that 7 of the 11 manage
permissions produce a full 403 when granted without their matching view permission — `Entry#manage?` requires
`visible_to?(user)` as a precondition, and the manage permission is never itself one of the ways `visible_to?`
can become true for Departments, Organizations, Contacts, Contact Links, Leave Types, Leave Policy Bands, or
Leave Band Assignments. This was filed as `BUG-PLT-055`.

**Part 2 — the bug was wrong, and the user caught it with a single direct question: "tumne document read kiya
tha na issue bana se phle?"** (did you read the document before creating the issue?). Re-reading
`shared_entities.rb` found the answer sitting in the comment **directly above** the very `manage?` method body
already quoted in the bug report — not a separate doc, not an ADR, the comment immediately preceding the code
that had already been read and pasted into the bug:

> "Managing implies seeing: a role given manage without view could save a record on a tab it cannot open, which
> is not a state worth supporting."

This is explicit, deliberate design. The 403 is the system correctly *refusing* to support an inherently broken
state (edit rights with no way to see what's being edited) — not an accidental gap. `BUG-PLT-055` was retracted
same-session, local file removed, never reported to production. Teams' `holder:` door
(`register_permission_door('teams', :rf_team_membership, holder: ->(user) { TeamService.can_manage?(user) })`)
and Holiday Schemes/Holidays/Leaves' `open_to_all` exemption are additional mechanisms layered on top of this
same "manage requires view" rule (giving those 4 entities a second way past it) — not evidence the rule itself
was meant to differ for the other 7.

A note on process: a background subagent was separately asked to verify whether any doc described this as
intentional, and it found nothing — but it explicitly had no Docker exec access and could not read the live
plugin source at all, only the QA repo's own copied docs. Its "not found" was a scope limitation, not
counter-evidence; the comment was read directly from the live container by this session, with the full file
path and surrounding line numbers, which is the authoritative source here.

**A testing-methodology trap hit along the way, worth keeping regardless of the retraction**: midway through the
sweep, one batch of `rails runner` checks ran inside a single process with a `User` object fetched once and
reused across a loop of role-permission changes — this produced a false `manage?=false` result for Holiday
Schemes (contradicted by a clean, freshly-run single check moments later). Redmine memoizes a `User`'s resolved
permissions in-process; a role change made *after* the user object was first used for a permission check does not
retroactively invalidate that memoization within the same loop. **Always fetch a fresh `User.find_by` (or run as
a separate process) after every `Role#save!` during a permission sweep.**

**Two lessons, both correct, both from the same investigation**:
1. A sampled subset of a permission matrix (9 of 24) can look exhaustive and pass cleanly right up until the
   untested remainder turns out to hold something real — when asked for "every permission, one by one," treat it
   literally.
2. An unexpected result (a 403 that looks like a gap) is not automatically a bug the moment the code explains
   *how* it happens — the code was quoted correctly here, but the comment stating *why*, sitting in the exact
   same block, was skipped. **Before filing a bug from source code, read the comment immediately surrounding the
   exact lines already being quoted, not just those lines** — the "why" is very often written right next to the
   "what," and skipping it is how a correct technical observation turns into a wrong bug report.

## ✅ Overview's displayed counts independently verified against the live database — permission-visibility and data-accuracy are two separate claims (2026-10-16)

User's direct follow-up after the full 24-permission sweep ("jo details or count show hote he vo correct he vo
check kiya kya tumne" — did you check the shown details/counts are actually correct) surfaced a real gap: every
TC-PLT-331–340 in `PLATFORM_OVERVIEW.md` tested whether a widget correctly *appears or disappears* for a given
permission, never whether the *number it displays* is factually true. Added TC-PLT-341 to close this specifically
for the admin baseline — ran three independent `rails runner` queries directly against the live container and
compared against what the page actually rendered:

- All 12 "Your records" card counts (Teams, Departments, Leave Types, Leave Policy Bands, Leave Band Assignments,
  Leaves, Organizations, Contacts, Contact Links, Holiday Schemes, Holidays, Audit Events) matched their model's
  own `.count` exactly.
- All 3 "Needs you" attention-band counts (pending leaves, empty team, organization with no e-mail) matched
  independently-run versions of the controller's own queries exactly.
- The October 2026 calendar's working/weekend/holiday day split (21/9/1) was independently recomputed via
  `WorkingCalendar.for` and confirmed to both match the display and sum to the month's real 31 days.

Zero discrepancies found — no new defect.

**Lesson: "the widget shows for the right permission" and "the number on the widget is true" are two independent
claims, and a suite that only tests the first can pass completely clean while silently never checking the
second.** A dashboard-style page (counts, aggregates, computed figures) earns a dedicated data-accuracy pass
against the real DB/model layer, separate from and in addition to however thorough the permission-visibility sweep
already was — this is the third distinct gap this one Overview investigation surfaced (see the 24-permission-sweep
entry above for the other two), each only found because the user asked a pointed follow-up rather than accepting
"tested" at face value.

## ✅ Full filter sweep (32 filters, 12 entities) — zero defects, 8 fixture gaps filled (2026-10-16)

User asked for every dropdown filter on every Platform list screen to be tested one by one, plus every
combination of filters, not just single filters in isolation ("jitne filters he platform pages pe unhe test kr
lena kuch bhi chodna mat please / filter wise pura test krlena or filter ke combination wise bhi"). Grepped
`shared_entities.rb` for every `filters: [` block first (rather than clicking through the UI to discover what
exists) and found **32 filters across 12 entities** — only `search`/sort/pagination had any TC coverage before
this (`PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md` TC-PLT-113–116); the actual `:select` filters had zero.

**Real, recurring coverage problem found along the way**: on roughly a third of these entities, the existing
fixture data only had ONE value for a given filter — e.g. only one Department (no manager), both Organizations
without a second tag/assignee pairing, both Leave Types Paid+Active, one Leave Policy Band, one Band Assignment,
all 8 Holidays Active, both Organization Contact Links "Current". A filter whose other value has nothing to match
against is not actually tested by selecting it and seeing an empty result — that's indistinguishable from the
filter being broken and matching nothing. **Created 8 disposable `PLT-FilterTest-*` fixtures** specifically to
give each such filter's missing value something real to match (an Inactive holiday, an Ended contact link, an
Unpaid leave type, a Department with a manager, etc.) — each logged in its own TC in `PLATFORM_FILTERS.md` rather
than silently assumed to already exist.

**Result: 12/12 TCs PASS, 0 new bugs.** Every filter's individual values, every AND-combination (confirmed
2-way through the full 5-way on Holidays), and every deliberately-constructed contradictory combination (two
filters that can't both be true for any record) behaved exactly right — contradictions returned a clean empty
state, never an error or a silently-wrong unfiltered list. `Entry#apply_filters`'s "plain data, one generic method"
design (filters are declared as `{name, label, type, choices, apply}` hashes, applied by reducing a lambda over
the relation — see the big comment block above `Entry#filters` in `shared_entities.rb`) meant there was
structurally very little per-entity filter logic to get wrong in the first place; this is a genuinely clean sweep,
not a thin one.

**One filter verified by source read instead of live data**: Audit Events' `period` filter (Last 7/30/90/365 days)
couldn't be live-tested for its boundary because every one of this environment's 175 audit rows happens to be
less than 7 days old — `period=7` and no-filter both returned the same 175. Rather than mark it untested, read
`SharedEntities.in_period` directly (`scope.where(column => days.days.ago..)`, backed by a plain `PERIODS` hash) —
confirmed correct. **Lesson: when live data can't exercise a filter's actual boundary, say so explicitly and
verify the mechanism from source — don't silently skip it, and don't claim a live PASS you didn't actually see.**

**Lesson for future filter/fixture-gap sweeps on this or any plugin**: before testing a multi-value filter,
check that the environment actually HAS a record for every value the dropdown offers — a dropdown with 3 options
and only 1 real matching record means 2 of those 3 options are structurally untestable until a fixture is built
for them. This is the same category of gap as the Overview "9 of 24 permissions" sampling miss (see above) and
the TC-PLT-341 data-accuracy gap: a test that only exercises the data that happens to already exist, rather than
every value the UI actually offers, can look complete while quietly skipping real coverage.

## ✅ 3 of 4 open bugs fixed in one dev pull — `open_to_all` removed entirely, backward-compatibility handled via a backfill migration, not a feature flag (2026-10-16)

`git pull` on `redmineflux_platform` (branch `redmineflux_platform`) brought in commit `d8a224d`, which removes
the `open_to_all`/`open_to_all?` mechanism from `shared_entities.rb` entirely — the exact root cause behind
`BUG-PLT-052` (Holidays/Holiday Schemes always-visible) and `BUG-PLT-054` (Leave filing always-permitted), both
cited by bug number in the commit's own code comments. `Leave#leave_type_is_one_the_band_permits` was also fixed
to refuse a zero-band submission with a named error, closing `BUG-PLT-053`'s core finding. All 3 retested live
and confirmed fixed same session (see each bug's own Retest section).

**The interesting part isn't the fix itself — it's how the dev handled "removing an over-permissive bypass could
silently under-permission everyone who relied on it."** A naive fix (just delete `open_to_all`) would have taken
the holiday calendar and leave filing away from every real employee whose role was never explicitly granted
`view_rf_platform_holidays`/`manage_rf_platform_leaves`, because nobody ever had to grant it while the bypass
existed. Instead of a feature flag, a gradual rollout, or asking every customer to re-grant permissions manually,
the fix ships with migration `048_grant_calendar_and_leave_permissions_to_working_roles.rb` — a one-time,
idempotent, ADD-ONLY backfill that grants the two new calendar permissions to any role already holding a Shift
Management/Workload/Timesheet/Helpdesk/Platform permission (i.e., any role actually in use), and the two new leave
permissions to any role already holding a Shift Management/Workload permission or any Platform leave/band
permission. Roles with zero related permissions (QA test fixtures built specifically to be zero-permission, in
this environment's case) correctly get nothing. Confirmed by directly checking `Role#allowed_to?` across all 14
non-builtin roles on this environment and finding the grant pattern matches the migration's own documented
criteria exactly, then independently confirmed live: a zero-permission user still correctly 403s everywhere, and
a role the migration did backfill (`Platform-Team-Permission-Test`) correctly gained calendar access without
anyone touching it by hand.

**Lesson for retesting any future "close a permission bypass" fix on this plugin**: check whether the fix shipped
its own backward-compatible migration before assuming a tighter permission check is purely a win — a correct
security fix that silently breaks every existing user's access is its own regression, just a different one. The
right way to verify this is NOT to just retest the originally-reported zero-permission case (that only proves the
bug is fixed) — it's to also check that a role which legitimately relied on the old, looser behavior still works,
which here meant reading the migration's own grant criteria and spot-checking real roles against it, not just
re-running the original bug's own repro steps.

**One residual, already-known issue was NOT touched by this fix and correctly wasn't expected to be**: the Leave
Type dropdown's lack of initial-load pre-filtering to the viewer's band (documented as a separate, lower-severity
item in `BUG-PLT-053`'s own 2026-10-16 Correction section) is still present. It was initially split out as its own
local bug (`BUG-PLT-056`), but the user explicitly asked for whichever bug wasn't fully resolved to be **reopened
on production with a note**, rather than closed and split into a new issue — so `BUG-PLT-056` was folded back
into `BUG-PLT-053` and deleted, and `BUG-PLT-053` itself was synced to production as `Reopen` (not `Done`), with
a note distinguishing the now-fixed core finding from the still-open gap. **Lesson: when retesting a bug whose
fix is only partial, ask (or infer from standing instruction) whether the production record should stay one
reopened issue carrying both the fix history and the remaining gap, or split cleanly into a new issue — don't
default to splitting just because that's the locally tidier option; it can leave the local tracker and the
production tracker telling different stories about the same defect.**

## ⚠️ A web-form permission fix proved nothing about its REST API siblings — always test every entry point into the same model, not just the one the bug report used (2026-10-16)

User asked for a fresh Security/Performance/Code-Quality pass immediately after `BUG-PLT-052`/`053`/`054` were
confirmed fixed and closed on production the same day. Rather than re-deriving the already-fixed web-form
behavior, applied `SENIOR_QA_STANDARDS.md` §28's own rule literally: "always send the request directly too" —
checked every other known way to create a `Leave` record, not just Platform's own web form.

**Found a real, live gap within minutes**: both `redmineflux_workload`'s `/api/workload/leaves` and
`redmineflux_shift_management`'s `/shift_management/api/v1/leave` POST endpoints build and save a
`RedminefluxPlatform::Leave` directly, with zero check of `manage_rf_platform_leaves` anywhere in either
controller — only `before_action :require_login`. Proved it live with `curl` + a zero-permission user's own API
key: the request failed only on the already-fixed Policy Band check (confirming that part is genuinely
model-level and entry-point-independent), and succeeded outright, `201 Created`, once a band was temporarily
assigned — with `manage_rf_platform_leaves` still confirmed `false` at the time. Filed `BUG-WKL-004`/`BUG-SFM-003`
against the two consumer plugins whose controllers actually skip the check, not against Platform itself (whose
model-level enforcement is correct — the permission check was simply never added to these two independent
controllers in the first place).

**This is the second time this exact lesson has surfaced on this plugin** (the first being the 9-of-24-permission
sampling gap on Overview, and the data-accuracy-vs-visibility gap on TC-PLT-341) — a fix or a test that only
covers the one surface a bug report happened to use can look completely resolved while an equally-reachable
sibling surface still has the identical defect. **Lesson, sharpened: whenever a permission/authorization fix
lands, before calling it closed, grep for every other controller action that can create/update/delete the same
model** (`grep -rn "ModelName.new\|ModelName.create" app/controllers` across every plugin, not just the one the
fix shipped in) **and test each one directly, with a real request, not just by re-reading the already-fixed UI
path.** A model-level validation (like the Policy Band check) being correct everywhere does not mean a
controller-level permission check is too — they are enforced at different layers and have to be verified
separately, at every entry point, every time.

## ⚠️ "Are you sure?" led to a real audit technique: count TC headers vs. recorded results per file, don't trust a keyword grep (2026-10-16)

User pushed back on a "only 5 TCs remain unexecuted" answer that was based on grepping for keywords like `NOT
EXECUTED`/`BLOCKED`/`Not Covered`. That search missed two real categories of gap because they don't use those
words at all:

1. **Zero-result TCs** — `TC-PLT-001`/`TC-PLT-002` in `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` had Steps and an
   Expected Result but genuinely never got a PASS/FAIL/anything written after them — not even a placeholder. A
   plain `grep -c "^### TC-PLT"` vs `grep -c "result marker"` per file surfaced the mismatch immediately; the
   keyword search alone never would have, since there was no keyword to find.
2. **Stale-but-present results** — `TC-PLT-098/099/100/101` in `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` all have a
   confident, specific 2026-09-30 result (`CONFIRMED FAIL`, citing `BUG-PLT-009/010/011`) — but those bugs are now
   closed, *and* the whole 3-entry-point scenario those TCs tested was later retired by `BUG-PLT-045`'s
   consolidation. A result that looks complete and specific can still be describing an architecture that no longer
   exists.

**The reusable technique, worth repeating on any suite file going forward**: `awk` (or equivalent) walking the
file, tracking "have I seen a TC header since the last result marker," flags every TC with literally nothing
after it — a mechanical check a keyword grep for known failure-words cannot do, since it doesn't require guessing
which word a gap would use. Running it across *every* suite file in one pass (not just the ones already suspected)
is what turned up `TC-PLT-001`/`002` — neither was on anyone's radar as a suspected gap beforehand.

**Resolution, not re-testing**: all 6 flagged TCs were marked `Superseded` rather than executed fresh, since in
every case the original scenario (a pre-platform-plugin environment state, or three independent leave-filing
screens) no longer exists to test — re-creating it would cost real setup effort for zero remaining signal. The
right response to "this was never properly recorded" is not always "go test it now" — sometimes it's "confirm the
scenario is gone and say so," which is itself a real, completed piece of work, not a shortcut.

## ✅ All 3 remaining open bugs fixed same day, confirmed via the same "test every entry point" discipline that found them (2026-10-16)

Within the same session as the Security pass that found `BUG-PLT-053`'s residual dropdown gap, `BUG-WKL-004`, and
`BUG-SFM-003`, a `git pull` landed fixes for all 3. The dropdown fix (`76cfecc`) makes the Leave Type list respect
the requester's band on first render, not just at validation time. Both API fixes (`c2c8e79` for Workload,
`59cd3af` for Shift Management) route their respective `create`/`update`/`cancel` actions through the Platform
leaves entry's own `create?`/`manage_record?` checks — exactly the fix direction this repo's own Code Quality
report recommended (`reports/PLT-Code-Quality-2026-10-16.md`), rather than each plugin hand-rolling its own
duplicate permission logic. Retested all 3 the same way they were found — live, direct requests/UI checks against
the exact repro, not just re-reading the diff — and all 3 confirmed. `bugs/open/` is empty across Platform,
Workload, and Shift Management simultaneously for the first time this cycle.

## Recurring Issues

## Reference — plugin's own design docs (copied 2026-09-30)

The dev keeps real architecture docs inside the plugin source itself (`C:\redmine-docker-6-platform\plugins\redmineflux_platform\`) — `CLAUDE.md`, `NORTH_STAR.md`, `README.md`, `doc/TESTER_GUIDE.md`, `doc/adr/0001-0005`, `db/migrate/README.md`. Copied verbatim into `docs/plugin-source/` (and `docs/plugin-source/adr/`) in this QA repo so future sessions don't have to go read the plugin source cold. **Read `PLATFORM_PLUGIN_TESTER_GUIDE.md` at the start of any future testing session on this plugin** — it has a real known-issues list (§8), a suggested-test-areas list (§7) and a "fixed in this build, worth regression cases" list (§9).

Several of these docs directly explain root causes already confirmed this cycle — worth reading before investigating a *new* finding on this plugin, since the same architectural pattern keeps recurring:

- **`PLATFORM_PLUGIN_README.md`** already documents the *exact same collision shape* as BUG-PLT-010, just for a different pair of plugins: "`flux_tags` and `redmineflux_testcase_management` each define a top-level class named `CustomWillPaginateRenderer`, differing only in indentation; whichever loads last silently wins." (This is also the historical cause of BUG-PLT-004.) So "two plugins independently patch the same shared thing, last-loaded wins silently" is a **recurring pattern in this codebase**, not a one-off — worth specifically checking for on any new cross-plugin integration point.
- **`PLATFORM_PLUGIN_ADR_0004...md`** states the platform's own design principle that an audit-logging failure must *never* break the operation being audited (`Auditable` wraps every callback in `rf_audit_safely`) — but Leave's audit calls are manual, direct `AuditEvent.log(...)` calls in the controller, not routed through `Auditable`, so they aren't covered by that guarantee. This is *why* BUG-PLT-010 surfaces as a 500 instead of being silently swallowed — worth citing if the dev's fix for BUG-PLT-010 doesn't also add a rescue at the call site.
- **`PLATFORM_PLUGIN_MIGRATIONS_README.md`**'s index confirms migration `027 data_merge_shift_leave_applications` moved `rf_leave_applications -> rf_leaves` — this is the historical origin of the stale `rf_leave_application` param key BUG-PLT-009 was about (Shift Management's old table/model name, never fully scrubbed from the controller).
- **`PLATFORM_PLUGIN_ADR_0003...md`** explains why every other entity (Team, Holiday, Organization, etc.) correctly keeps its own distinct permit-list param key instead of the Rails-auto-derived one — "`holiday_params` has five different permit lists for the same model — a direct consequence of ADR 0001" — confirming BUG-PLT-009/011's stale-key bug is an anomaly specific to Leave's controllers, not a wider pattern (which was independently verified live this cycle by testing Team/Holiday creation).
- **`PLATFORM_PLUGIN_CLAUDE.md`** documents the exact `Setting.plugin_<id>` symbol-vs-string double-key gotcha that `SettingsService` exists to solve — relevant background for BUG-PLT-008.

## ⚠️ All 20 seed-user emails on this environment were `@zehntech.com` (the real company domain) — fixed to `@test.local` 2026-10-01

This instance has real SMTP delivery configured (`config/configuration.yml`: `smtp_settings` → host `mail`, domain `test.local`) — so any triggered notification would have genuinely attempted delivery toward whatever domain a user's email used. All 20 seed users (`luna.blossom` through `isla.moon`) had `@zehntech.com` emails, sourced from `scripts/seeds 1.rb` and `scripts/qa_seed_users_import.csv`, both of which hardcode that domain for every seed user. Per explicit user instruction ("i do not want to send any email on zehntech domain"), bulk-updated all 20 via `EmailAddress#update_column` to `@test.local` (matching the SMTP domain and this repo's existing local-mail-server convention). Confirmed zero `%zehntech%` addresses remain on this instance. **Root cause not yet fixed at the source** — `scripts/seeds 1.rb`/`scripts/qa_seed_users_import.csv` still hardcode `@zehntech.com`, so any *other* environment seeded from those files (or this one, if re-seeded) will reintroduce the same issue. Flag this to the user before assuming it's fixed repo-wide.

## Environment Notes

- Container: `redmine-docker-6-platform-redmine-1` + `redmine-docker-6-platform-db-1` (MySQL 8), `docker compose` project at `C:\redmine-docker-6-platform`.
- URL: `http://localhost:3013`
- Plugin drop-in path: `C:\redmineflux palform\plugins\<plugin_folder>`
- After dropping/updating plugin source: `docker compose restart redmine` (from `C:\redmine-docker-6-platform`) to re-run `bundle install`, then `docker exec -it redmine-docker-6-platform-redmine-1 bundle exec rake redmine:plugins:migrate RAILS_ENV=production` (migrations are manual, never automatic — see root MEMORY.md).
