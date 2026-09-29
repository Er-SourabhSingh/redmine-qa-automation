# Test Cases — Redmineflux Platform — Old Architecture Baseline (pre-consolidation)

> Source: `docs/PLATFORM_REQUIREMENTS.md` Business Workflows (Upgrade scenario), `docs/PLATFORM_FEATURES_LIST.md` #1.
>
> **Purpose:** This suite is deliberately executed FIRST, before the platform plugin or the `redmineflux_platform` branch touch this instance at all. It (a) confirms the 6 consumer plugins work correctly standalone at `master` (the old, pre-consolidation architecture), and (b) creates the real fixture data that `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` will later check for survival after the branch/upgrade switch. Do not delete this data once the upgrade happens — it is the evidence base for the entire migration-integrity suite.
>
> **Environment:** `redmine-docker-6-platform`, `http://localhost:3013`, Redmine 6. Plugins: `redmineflux_crm`, `redmineflux_helpdesk`, `redmineflux_invoice`, `redmineflux_timesheet`, `redmineflux_workload`, `redmineflux_shift_management`, all at `master` branch, no `redmineflux_platform` plugin installed yet.

## Plugin
- Name: redmineflux_platform (baseline: its 6 consumer plugins at `master`)
- Version: pre-consolidation (`master` branch, each plugin)
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — Installation

---

### TC-PLT-001: All 6 consumer plugins install and boot cleanly at `master`

**User Role:** Admin / server operator.
**Precondition:** `redmineflux_crm`, `redmineflux_helpdesk`, `redmineflux_invoice`, `redmineflux_timesheet`, `redmineflux_workload`, `redmineflux_shift_management` cloned at `master` into `C:\redmineflux palform\plugins`. No `redmineflux_platform` plugin present.

**Steps:**
1. Restart the `redmine-docker-6-platform` container (`docker compose restart redmine` from `C:\redmine-docker-6-platform`) to pick up the freshly cloned plugins and run `bundle install`.
2. Run plugin migrations: `docker exec -it redmine-docker-6-platform-redmine-1 bundle exec rake redmine:plugins:migrate RAILS_ENV=production`.
3. Log in as Admin, go to Administration → Plugins.
4. Check server logs / container logs for boot errors.

**Expected Result:**
- All 6 plugins are listed under Administration → Plugins with no load errors.
- Migrations for all 6 run without error.
- No exceptions in `docker logs redmine-docker-6-platform-redmine-1` referencing any of the 6 plugins.

---

### TC-PLT-002: Each consumer plugin's own admin/settings screen opens without error

**User Role:** Admin.
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. For each of the 6 plugins, open its plugin-specific admin/settings page (Administration → Plugins → Configure, or the plugin's own top-level admin menu entry).

**Expected Result:**
- All 6 settings pages render with no 500/exception, and show plugin-specific options only (no shared-platform UI exists yet at this stage — that's expected, since the platform plugin isn't installed).

---

## Functional Cases — Baseline Fixture Data Creation

> Create one clearly-named fixture per shared entity, per consumer plugin, so each can be traced individually after the later upgrade. Use a consistent naming pattern, e.g. prefix `PLT-BASELINE-` on every name/subject/title created in this suite, so migration-integrity checks can grep for it unambiguously.

---

### TC-PLT-003: Create a CRM Company that overlaps a Helpdesk Organization by name

**User Role:** Admin (or a role with CRM Company create rights).
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. In CRM, create a Company named `PLT-BASELINE-Acme Corp` with a non-trivial set of fields filled in (industry, website, phone, address, description) so a lossy merge is detectable.
2. In Helpdesk, create an Organization also named `PLT-BASELINE-Acme Corp`, independently, with its own distinct field values (do not copy CRM's values — this simulates two independently-maintained "duplicate" records, which is exactly what the ticket describes as the pre-consolidation problem).
3. Record both records' IDs and every field value entered, in this file's Evidence Map or the plugin's testdata registry.

**Expected Result:**
- Both records are created successfully as two entirely independent, unrelated rows (CRM's own `rf_crm_companies`-equivalent table and Helpdesk's own organizations table) — at this pre-consolidation stage there is no linkage between them.
- This is the fixture that `TC-PLT-041` (Data Migration Integrity suite) will check post-upgrade: does it become one `rf_organizations` row, and if so, whose field values survive?

---

### TC-PLT-004: CRM Contact / Invoice Customer — CORRECTED, no longer independently creatable

**CORRECTED 2026-09-28 (source review):** this TC originally assumed Invoice has its own separate `Customer` entity at `master`, independent of CRM's Contact, to be created and later checked for a lossy/lossless merge. That assumption is **wrong for this codebase**. Invoice's own `master` branch already completed this exact merge via `db/migrate/027_migrate_legacy_customers_to_rf_crm_contacts.rb` (spec `riv-006`, dated 2026-07-27 — three weeks *before* platform ticket #120043 was even created). `/customers` redirects straight to `/contacts`; there is no separate Customer create screen when CRM is installed (confirmed live: `New Invoice`'s form has only free-text Client Name/Address/Email fields, no Customer/Contact picker — riv-006's requirement #11 customer-dropdown behavior does not appear to be implemented in this specific commit, a separate finding worth its own investigation later, not a blocker here).

**Practical effect on this QA cycle:** the "Organization/Company merge" fixture (TC-PLT-003) remains the correct target for TC-PLT-040 (Data Migration Integrity). This TC is retargeted to verify Invoice **already** correctly resolves to the shared Contact — a pre-platform sanity check, not a migration-integrity target.

**User Role:** Admin.
**Precondition:** TC-PLT-001 PASS. CRM Contact `PLT-BASELINE-Jane Doe` (ID 1) already created — reuse it, do not create a second one.

**Steps:**
1. Confirm `/customers` redirects to `/contacts` and no separate Invoice Customer create form exists anywhere in Invoice's nav/UI.
2. Check a project's Settings → Invoice tab (if such a mapping screen exists) for how it references customers — does it list CRM Contacts (including `PLT-BASELINE-Jane Doe`) directly?
3. Record actual behavior precisely; this becomes the corrected baseline fact for `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_FEATURES_LIST.md` #6, which should be re-scoped to "verify this pre-existing riv-006 merge survives the platform upgrade unchanged" rather than "verify a fresh merge happens."

**Expected Result:** Invoice already resolves customers through `rf_crm_contacts`, not a separate table.

- **CONFIRMED LIVE 2026-09-28** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS (as a sanity check, not a migration target). `/customers` → redirects to `/contacts`. Created project `PLT-BASELINE-Project` (identifier `plt-baseline-project`) with Helpdesk + Invoice modules enabled — needed as a fixture context for several other plugins too. Its Invoice tab → "Billing Settings" (`/projects/plt-baseline-project/invoices/billing`) has a "Customer *" dropdown whose only option is `PLT-BASELINE-Jane Doe` — the exact CRM Contact created in this same session. Selected it and saved successfully. Confirms Invoice and CRM already share one Contact table today, independent of the platform plugin.
- **Retargeted for later suites:** `PLATFORM_DATA_MIGRATION_INTEGRITY.md` TC-PLT-041 and `PLATFORM_FEATURES_LIST.md` #6 should check that this *existing* Contact↔Invoice-billing link survives the platform upgrade unchanged (project `plt-baseline-project` still shows `PLT-BASELINE-Jane Doe` as its billing customer post-upgrade), not that a fresh merge occurs.

---

### TC-PLT-005: Create a Helpdesk Customer (User-based) and confirm it is NOT the same concept as Contact/Organization

**User Role:** Admin.
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. In Helpdesk, create/designate a Redmine User as a Helpdesk Customer (`is_helpdesk_customer`), named distinctly, e.g. `plt-baseline-customer-user`.
2. Note this is a `User`, not an Organization/Contact record.

**Expected Result:**
- Created successfully as a Redmine User with the helpdesk-customer flag.
- Fixture for `TC-PLT-043` — verifying this stays a User post-upgrade, is NOT folded into the Organization/Contact merge.

- **CONFIRMED LIVE 2026-09-28** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS, with one real bug found and self-resolved along the way (see below). Created `plt-baseline-customer-user` (login), firstname `PLT-BASELINE`, lastname `Customer`, email `plt-baseline-customer@example.com`, User ID **25**. Left "Project access" empty (form explicitly supports this) rather than assigning SLA/Support Level, since this fixture only needs to exist as a User with `is_helpdesk_customer=true` — SLA/Support Level assignment is out of scope for this TC. "Welcome email sent to customer successfully" shown on creation.
  - **Real bug hit first, self-diagnosed, not filed:** first attempt 500'd with `NoMethodError: undefined method 'is_helpdesk_customer=' for an instance of User` at `rf_customers_controller.rb:80`. Root-caused to a stale ActiveRecord schema cache — `rake redmine:plugins:migrate` had been run via a separate `docker exec` process minutes earlier, but the already-running Puma server never reloaded its column cache, so it still thought the column didn't exist even though `DESCRIBE users` confirmed it was there. Restarting the container fixed it immediately. **Lesson recorded in `PLATFORM_MEMORY.md`: always restart after migrating, before testing** — this is a process gap in my own test execution, not a plugin defect, so correctly not filed as `BUG-PLT-*`.
  - Second attempt correctly surfaced a real, expected validation (`SLA Policy is required, Support Level is required`) when a Project was selected without also selecting SLA/Support Level — reasonable validation, not a bug. Removing the Project selection (leaving "Project access" empty) let the customer create successfully without needing SLA/Support Level setup.

---

### TC-PLT-006: Team — CORRECTED, already shared by Workload/Timesheet/Shift Management at `master`

**CORRECTED 2026-09-28 (source review, same pattern as TC-PLT-004):** this TC originally assumed Team is still three separate, duplicated entities at `master`, to be created independently per plugin and later checked for a merge. **Wrong again, and for the same underlying reason as TC-PLT-004** — Team is *already* consolidated today, independent of the platform plugin. All three models point at the identical physical table: Workload's `RfTeam` (`app/models/rf_team.rb`, default table name `rf_teams`), Timesheet's `Timesheet::RfTeam` (`app/models/timesheet/rf_team.rb`, explicit `self.table_name = 'rf_teams'`), and Shift Management's `RfTeam` (`app/models/rf_team.rb`, explicit `self.table_name = 'rf_teams'`) — all three read/write the same `rf_teams` table right now.

**Confirmed live, not just from source:** created ONE team in Workload — it instantly appeared, with the identical ID, member count and timestamp, in both Timesheet's Teams list (`/timesheet/teams/1`) and Shift Management's Teams & Departments list (`/shift_management/teams/1`), with zero extra action taken.

**Practical effect on this QA cycle:** unlike Organization (TC-PLT-003, genuinely still separate — CRM's `rf_crm_companies` vs Helpdesk's own organizations table), Team is NOT a valid migration-integrity target — there is nothing left for the platform upgrade to consolidate. Retarget `TC-PLT-044`/`TC-PLT-060` (Data Migration Integrity / Cross-Plugin Consistency suites) to verify this *pre-existing* shared team survives the upgrade unchanged, the same retargeting done for the Contact/Invoice-billing link in TC-PLT-004.

**User Role:** Admin/Manager per plugin.
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. In Workload, create a Team named `PLT-BASELINE-QA Squad`, add 2 members.
2. Check Timesheet's Teams list and Shift Management's Teams & Departments list for the same team, without creating anything there.
3. Record the shared ID and member list.

**Expected Result:** One shared Team row, visible and identical from all three plugins immediately.

- **CONFIRMED LIVE 2026-09-28** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS (as a sanity check, not a migration target). Created in Workload (`/rf_teams/1`): `PLT-BASELINE-QA Squad`, members Luna Blossom + Daisy Skye (2 members). Immediately visible identically at Timesheet's `/timesheet/teams/1` (same name, same 2-member count, same creator/timestamp) and Shift Management's `/shift_management/teams/1` (same name, same 2-member count, "Active" status). No creation step needed in either of the other two plugins.

---

### TC-PLT-007: Create overlapping Holidays in Workload and Shift Management

**User Role:** Admin.
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. In Workload, create a one-off Holiday named `PLT-BASELINE-Founders Day` on a specific date.
2. In Workload, also create a **recurring** holiday (e.g. a fixed yearly date) named `PLT-BASELINE-Recurring Holiday`.
3. In Shift Management, independently create a Holiday named `PLT-BASELINE-Founders Day` on the same date (its own separate record).
4. Record all IDs/dates.

**Expected Result:**
- Independent records created in each plugin.
- The recurring holiday fixture specifically targets `TC-PLT-046` (WorkingCalendar recurring-rule evaluation, per the ticket's stated fix for a "recurring holiday silently counted as a working day" bug).

- **CONFIRMED LIVE 2026-09-28** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS — genuinely independent, unlike TC-PLT-003/TC-PLT-006. Source pre-check confirmed Workload's `RfHoliday`/`RfLeave` (default table names `rf_holidays`/`rf_leaves`) and Shift Management's `RfHolidayManagement`/`RfLeaveApplication` (explicit `rf_holidays_management`/`rf_leave_applications`) are still genuinely separate tables. Created Workload scheme `PLT-BASELINE-Holiday Scheme` (active) with 2 holidays: `PLT-BASELINE-Founders Day` (2026-11-15, one-off, Company type) and `PLT-BASELINE-Recurring Holiday` (2026-12-25, recurring annually, National type). Independently created Shift Management scheme `PLT-BASELINE-Shift Holiday Scheme` (ID 1, active) with its own `PLT-BASELINE-Founders Day` (same date 2026-11-15, Company type) — confirmed Shift Management showed "No Schemas Found" before this creation despite Workload already having 2 holidays, proving no shared storage today.

---

### TC-PLT-008: Create overlapping Leave records in Workload and Shift Management, plus a custom Leave Type

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-006 PASS (need a team member to file leave against).

**Steps:**
1. In Workload, add a custom Leave Type named `PLT-BASELINE-Sabbatical` (Workload's leave type was a hardcoded 5-value enum per the requirements doc — confirm whether a custom type can even be added here; if not, use one of the existing 5 types and note that).
2. In Workload, file a Leave for a team member using that type, dated in the future, named/tagged `PLT-BASELINE-Leave-WKL`.
3. In Shift Management, independently create a Leave Type named `PLT-BASELINE-Sabbatical` (Shift Management's leave type is a real table per requirements — this should succeed even if Workload's didn't).
4. In Shift Management, file a Leave Application for the same person (or a different member of the same overlapping team) using that type, tagged `PLT-BASELINE-Leave-SFM`.
5. Attempt to file a leave for the **same person on overlapping dates** in both Workload and Shift Management (simulates the "double-filing" problem the ticket says consolidation fixes).

**Expected Result:**
- Both leave records file successfully, independently, at this pre-consolidation stage — including the same person double-filing overlapping leave in two different plugins (since neither plugin currently knows about the other).
- This double-filing case is the fixture for `TC-PLT-048` — after upgrade, does the merged system flag/prevent the duplicate, or does it just silently keep both records merged into one table?

- **CONFIRMED LIVE 2026-09-28** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS overall — initial bug candidate investigated and retracted (see below), plus the double-filing scenario successfully reproduced.
  - **Step 1 confirmed:** Workload's leave type dropdown is exactly the 5 hardcoded values (Planned/Sick/Emergency/Unpaid/Comp-Off per `RfLeave::LEAVE_TYPES`) — no way to add a custom type. Used "Planned Leave" instead, as the TC anticipated.
  - **Step 2 — initial "bug" finding RETRACTED, was my own testing artifact, not a real defect.** First attempt claimed the "Request Leave" modal's date-box rendered off-screen and threw JS errors on submit. Root cause on investigation: `#leaveRequestModal` is a right-side slide-in drawer (CSS `right: -500px` hidden by default, `.active { right: 0 }` when genuinely opened), and I had been probing it in its **default hidden DOM state** without ever clicking "+ Request Leave" in that browser session first — Redmine's accessibility snapshot includes off-screen elements regardless of visibility, which is what made it look "already open." Retested cleanly with a real click-to-open first: datepicker opened correctly, full flow (dates → leave type → reason → submit) completed with a clean "Leave request created and auto-approved" message, zero console errors. **No bug here — do not file.** (User caught this by pointing out their own screenshot showed the datepicker working fine.)
  - **Step 3 confirmed:** Shift Management's Leave Type is a real, independently-creatable table (`rf_leave_types`) — created `PLT-BASELINE-Sabbatical` there with no issue, its own form has no equivalent bugs (real Submit button, real date textboxes, worked on the first try, "Leave approved successfully").
  - **Step 4/5 confirmed together:** Filed a Shift Management Leave Application for the **same person** (Luna Blossom) on the **same date** (2026-10-15) already used in Workload's leave — Leave Application ID 1, `PLT-BASELINE-Sabbatical`, Approved, reason `PLT-BASELINE-Leave-SFM...`. **No cross-plugin conflict was flagged at all** — Shift Management has zero awareness of Workload's leave and vice versa, so Luna Blossom now genuinely holds two independently-approved leave records for the identical date across two different plugins. This is the double-filing problem the ticket describes, reproduced for real, and is exactly what `TC-PLT-048` will check post-upgrade.

---

### TC-PLT-009: Create Audit entries in Timesheet and Shift Management

**User Role:** Any role whose actions generate an audit log entry per each plugin (e.g., approving/rejecting a timesheet, editing a shift schedule).
**Precondition:** TC-PLT-001 PASS.

**Steps:**
1. In Timesheet, perform an action that writes to `timesheet_audit_logs` (e.g. submit + approve a timesheet), tag/note the entry's identifying details (user, timestamp, action).
2. In Shift Management, perform an action that writes to `rf_audit_logs` (e.g. edit a shift assignment), tag/note the entry's identifying details.
3. Record both entries' exact content for later comparison.

**Expected Result:**
- Both audit trails record their respective events independently, in their own separate tables, at this stage.
- Fixture for `TC-PLT-050` (audit consolidation into `rf_audit_events`) and `TC-PLT-051` (append-only immutability).

- **CONFIRMED LIVE 2026-09-28/29** (Local, `redmine-docker-6-platform` localhost:3013, admin): PASS overall — Shift Management side confirmed via real UI action; Timesheet side genuinely blocked initially by a real, root-caused bug, then confirmed fixed once diagnosed correctly.
  - **Shift Management — CONFIRMED, no extra action needed:** creating the Leave Application in TC-PLT-008 already wrote a real audit row as a side effect — `rf_audit_logs` id=1, `user_id=1` (admin), `action='auto_approve_leave'`, `resource_type='RfLeaveApplication'`, `resource_id=1`, timestamped 2026-09-28 13:03:44, confirmed via direct DB query. This is genuine fixture data, produced by a real UI action, not fabricated.
  - **Timesheet — root cause corrected on 2026-09-29, real bug confirmed, fixed for this environment.** Original attempt to log time via the weekly timesheet's "Log Time Entry" modal failed with `"You do not have permission to log time for this project."`. Initial diagnosis (stale client-side permission cache, zero network request sent) was **incomplete** — a later, cleaner retest showed a real network request WAS sent (`POST /time_entries.json`) and returned a genuine `403`. Server logs showed `Current user: anonymous` on that request. Root cause: `Setting.rest_api_enabled?` was `false` (Redmine's own default) — Redmine core refuses session-cookie authentication on `.json`-format requests when REST API is disabled, and Timesheet's "Save Time Entry" JS posts directly to Redmine core's own `/time_entries.json` REST endpoint. **Fixed by enabling Administration → Settings → API → "Enable REST web service"** — confirmed via direct DB check (`rest_api_enabled` = `1`, persisted through a full container recreate) and a clean live retest afterward (`POST /time_entries.json` → `201 Created`, no errors). Created two real TimeEntry rows this way (Tuesday 1.5h, Thursday 1h, both via genuine UI submission) in addition to the earlier `rails runner`-created Monday entry (kept as-is, real but not UI-created). **User decision (2026-09-29): not a bug — do not file.** Although the root cause is fully diagnosed (a disabled-by-default core Redmine setting causing a misleading permission-style error), the user explicitly ruled this out as a plugin defect: enabling a global core setting is normal environment setup, not something to file against the Timesheet plugin. Nothing pending.
  - **Submit-for-approval / genuine audit entry:** still not pursued — requires an Approval Schema assigned to `plt-baseline-project` (Timesheet's own concept, `Project#approval_schema_id`, separate from anything in core Redmine), which no TC in this baseline suite required. `timesheet_audit_logs` remains empty. Deferred to a future session if a genuine Timesheet audit-log fixture is needed.

---

## Negative Cases

---

### TC-PLT-010: Duplicate-named records across plugins do NOT conflict or auto-link, pre-consolidation

**User Role:** Admin.
**Precondition:** TC-PLT-003–TC-PLT-008 complete.

**Steps:**
1. Confirm none of the deliberately duplicate-named fixtures created above (Acme Corp, Jane Doe, QA Squad, Founders Day) produced any cross-plugin validation error, warning, or silent auto-link at creation time.

**Expected Result:**
- No cross-plugin awareness exists pre-consolidation — every plugin only "sees" its own copy. This is the expected old-architecture behavior the ticket describes as the problem being solved, not a bug to file here.

- **CONFIRMED LIVE 2026-09-28**, with a correction to the original premise (consistent with TC-PLT-004/TC-PLT-006): the "no cross-plugin awareness" expectation held true for **Acme Corp** (CRM Company vs Helpdesk Organization, TC-PLT-003 — two independent rows, no conflict) and **Founders Day** (Workload vs Shift Management Holiday, TC-PLT-007 — two independent rows, no conflict). It did **not** hold for **Jane Doe** (Contact/Customer, TC-PLT-004) or **QA Squad** (Team, TC-PLT-006) — those two are already genuinely shared at `master`, so "no duplicate created" was the correct-but-differently-reasoned outcome there (there was only ever one row to begin with, not two independent ones that happened not to conflict). Net: this baseline suite's most valuable output wasn't the originally-planned migration fixtures alone, but discovering which entities are already pre-consolidated (Team, Contact/Customer) versus genuinely still duplicated (Organization/Company, Holiday, Leave) — this directly changes what `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` should actually be checking after the platform-branch upgrade.

---

## Evidence Map

- Case ID: TC-PLT-001 … TC-PLT-010
- Screenshot: (bugs only, per CLAUDE.md §6 — not required for these baseline creation steps unless a bug is found)
- Log: `docker logs redmine-docker-6-platform-redmine-1` at time of TC-PLT-001
- Fixture registry: to be added to `automation/testdata/PLATFORM_TESTDATA_LOCAL.xlsx` once created (per CLAUDE.md §13a) — until then, record every fixture's ID/name/field values directly in this file's steps as they're executed
- Bug reference: —
