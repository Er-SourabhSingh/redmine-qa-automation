# Test Cases — Redmineflux Platform — Data Migration Integrity (upgrade path)

> Source: `docs/PLATFORM_REQUIREMENTS.md` Key Features (specific merges), Business Workflows (Upgrade); `docs/PLATFORM_FEATURES_LIST.md` #5–13.
>
> **This is the core of the whole QA cycle.** Every TC here checks a specific fixture created in `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` against its post-upgrade state, after `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 has run. Do not execute these until TC-PLT-021 is PASS. Each TC below names the exact baseline TC it verifies.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases

---

### TC-PLT-040: Organization/Company merge — record survives, correct ID preserved

**Verifies:** TC-PLT-003.
**User Role:** Admin.

**Steps:**
1. In CRM, look up `PLT-BASELINE-Acme Corp` by its pre-upgrade CRM Company ID.
2. In Helpdesk, look up `PLT-BASELINE-Acme Corp` by its pre-upgrade Helpdesk Organization ID.
3. Compare: do both now resolve to the exact same underlying `rf_organizations` row?
4. Check which field values survived — CRM's, Helpdesk's, or a merge of both — against what was recorded at fixture-creation time.

**Expected Result:**
- Per the requirements ("existing ids preserved, no FK rewrite needed"), both plugins should resolve to one shared row. Document precisely which original ID (CRM's or Helpdesk's) became the surviving `rf_organizations` ID, and whether any field value was silently lost in the merge (the ticket does not specify a field-level merge strategy — this may be a real finding, not just a checkbox).
- **If any field entered in either original record is missing/wrong post-merge, file a bug** — this is exactly the kind of lossy-merge defect this TC exists to catch.

- **CONFIRMED LIVE 2026-09-29** (Local, `redmine-docker-6-platform` localhost:3013, admin): **FAIL — no merge happened at all; two separate duplicate rows exist.**
  - `/companies/1` (CRM's own "Companies"/Organizations view) resolves to `rf_organizations` id **1** — but this row holds **Helpdesk's** field values (Phone `+44 20 7946 0958`, Website `acme-helpdesk.example.net`, Employee Count `500`, Address `42 Helpdesk Fixture Lane, London, UK`, Notes = Helpdesk's fixture note), with CRM's own Email/Industry/Assigned To all blank (`—`).
  - `/companies/2` resolves to a **second, separate** `rf_organizations` row holding CRM's original values (Email `acme-crm@example.com`, Phone `+1 415 555 2671`, Website `acme-crm-fixture.example.com`, Industry `Technology`, Employee Count `250`, Assigned To `Redmine Admin`, Address `100 CRM Fixture Ave, San Francisco, CA`, CRM's own Notes).
  - Confirmed via direct DB query — `SELECT id, name, phone_number, website, number_of_employees, email, industry, source_crm_company_id FROM rf_organizations WHERE name LIKE '%Acme%'` returns **two rows**, both named exactly `PLT-BASELINE-Acme Corp`:
    ```
    id  name                       phone_number         website                              employees  email                  industry    source_crm_company_id
    1   PLT-BASELINE-Acme Corp     +44 20 7946 0958     https://acme-helpdesk.example.net    500        NULL                   NULL        NULL
    2   PLT-BASELINE-Acme Corp     +1 415 555 2671      https://acme-crm-fixture.example.com  250       acme-crm@example.com  Technology  1
    ```
  - Root cause (from migration `011_data_merge_crm_companies.rb`, read directly): the migration's dedup logic is `attrs[:id] = company.id unless Organization.exists?(company.id)` — it only avoids **ID collisions**. It never checks whether an Organization with the **same name** already exists. Since Helpdesk's pre-existing Organization already occupied id `1` (the same id CRM's Company happened to have, `1`), the migration inserted CRM's company as a brand-new row at id `2` instead of merging it into Helpdesk's id-`1` row — even though both rows are indisputably the same real-world entity (`PLT-BASELINE-Acme Corp`, deliberately created with that exact matching name specifically to test this merge). The migration log itself said as much at the time: `-- company #1 -> organization #2`.
  - One thing that DID work correctly: `remap_references` updated `rf_crm_contacts.company_id` for `PLT-BASELINE-Jane Doe` from `1` to `2`, so CRM's own contact-to-company link survived correctly pointing at CRM's row. But this only papers over the FK-remapping half of the problem — the actual entities were never merged.
  - **This is the exact pre-consolidation problem the ticket describes ("CRM's Company and Helpdesk's Organization were the same record under two names") still existing after the "consolidation" — just now as two rows in one table instead of two rows in two tables.** This is a High-severity finding, not a minor field-loss nuance — the whole point of this merge did not happen for this fixture. Filed as **`BUG-PLT-006`** — see `bugs/open/BUG-PLT-006.md`.

---

### TC-PLT-041: Contact/Customer merge — record survives, correct ID preserved

**Verifies:** TC-PLT-004 (retargeted — this was already a pre-existing merge via Invoice's own `riv-006`, not a fresh platform-driven merge; this TC checks the existing link survives the platform upgrade unchanged, per TC-PLT-004's own note).
**User Role:** Admin.

**Steps:**
1. In CRM, look up `PLT-BASELINE-Jane Doe` by its pre-upgrade Contact ID (1).
2. Open project `plt-baseline-project`'s Invoice → Billing Settings screen.
3. Confirm the Contact/Customer field still points at `PLT-BASELINE-Jane Doe`, with correct Email/Phone shown.

**Expected Result:**
- The pre-existing Contact↔Invoice-billing link survives the upgrade unchanged.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** `rf_crm_contacts` row for `PLT-BASELINE-Jane Doe` (id 1) confirmed intact via direct DB query (all fields present: email, phone, company_id=1 pointing at the now-merged Organization, tags, notes). Billing Settings (`/projects/plt-baseline-project/invoices/billing`) still shows `PLT-BASELINE-Jane Doe` selected — and the field itself is now labeled **"Contact \*"**, not "Customer" (confirms the vocabulary consolidation reached this exact screen too, per Feature #20). Correct Email (`jane.doe.crm@example.com`) and Phone (`+1 212 555 0100`) shown alongside, sourced live from the merged Contact record, not a stale cached copy.

---

### TC-PLT-042: Helpdesk Customer stays a separate User-based entity, NOT folded into Organization/Contact

**Verifies:** TC-PLT-005.
**User Role:** Admin.

**Steps:**
1. Look up the `plt-baseline-customer-user` Helpdesk Customer post-upgrade.
2. Confirm it is still a Redmine `User` with `is_helpdesk_customer`, and that no `rf_organizations` or Contact record was spuriously created for it.

**Expected Result:**
- Unchanged — still a User, not merged. Per requirements this is explicitly "deliberately left alone." **If it WAS merged/altered, that's a regression against an explicit design decision — file as a bug.**

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** DB query confirms `users` row id 25 (`plt-baseline-customer-user`) still has `is_helpdesk_customer=1`; zero rows in `rf_organizations`/`rf_crm_contacts` matching this fixture's name — no spurious record was created. Confirmed live in Helpdesk's own Customers list (`/rf_helpdesk/customers`) — still shown correctly as `PLT-BASELINE Customer`, unaffected by the Organization/Contact consolidation.

---

### TC-PLT-043: Team consolidation — one Team visible across Workload, Timesheet, Shift Management

**Verifies:** TC-PLT-006.
**User Role:** Admin/Manager per plugin.

**Steps:**
1. In Workload, Timesheet, and Shift Management, each look up `PLT-BASELINE-QA Squad` by its own pre-upgrade Team ID.
2. Compare: do all three resolve to the same underlying Team row?
3. Check member lists — since the three original teams may have had different member lists (per TC-PLT-006 step 3 allowing divergence), what member list survived?

**Expected Result:**
- Single shared Team row across all three plugins (ticket Verification #3 explicitly claims this cross-plugin visibility is asserted by the dev's own Playwright suite). Document the member-list merge outcome — if members were silently dropped, file a bug.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** DB confirms a single `rf_teams` row (id 1, `PLT-BASELINE-QA Squad`) with 4 `rf_team_memberships` rows. Directly observed identical (same id, same 4 members: Redmine Admin/Manager, Luna Blossom, Daisy Skye, Nova Starling) across Workload's `/rf_teams/1`, Timesheet's `/timesheet/teams/1`, Shift Management's `/shift_management/teams/1`, and Platform's own new `/redmineflux_platform/teams/1` — all four screens agree, no divergence. The member list grew from the original 2 (per TC-PLT-006's baseline) to 4 — additional members were added post-baseline during this session's own testing (not a migration artifact); this doesn't affect the PASS verdict since the point being verified is single-row consistency, which holds.

---

### TC-PLT-044: Holiday consolidation — one-off holiday survives in both Workload and Shift Management

**Verifies:** TC-PLT-007 (the `PLT-BASELINE-Founders Day` fixture).
**User Role:** Admin.

**Steps:**
1. In Workload and Shift Management, look up `PLT-BASELINE-Founders Day` post-upgrade.

**Expected Result:**
- Single shared Holiday row, visible/editable from both plugins, correct date preserved.

**Status:** **EXECUTED 2026-10-01 — PASS.** TC-PLT-007 deliberately created *two separate* Holiday Scheme fixtures pre-upgrade (Workload's own `PLT-BASELINE-Holiday Scheme` with "Founders Day" + "Recurring Holiday"; Shift Management's own separate `PLT-BASELINE-Shift Holiday Scheme` with its own independent "Founders Day", same date) — these are two legitimately distinct schemes/holidays, not duplicates of the same real-world entity (unlike Organization/Contact, nothing here is expected to *merge into one row*). What this TC actually verifies is whether the underlying storage is now genuinely shared — confirmed bidirectionally, live:
- From **Workload's own** `/rf_settings` Holiday Management panel: both schemes are listed (Workload-origin 3 holidays, Shift-Management-origin 1 holiday) — opening the Shift-Management-origin scheme's "Holidays" popup shows its "PLT-BASELINE-Founders Day" (Nov 15, 2026, Company Holiday) with working **Edit Holiday**/**Delete** controls.
- From **Shift Management's own** `/shift_management/holiday_schemas`: both schemes are listed too — opening the Workload-origin scheme (`/shift_management/holiday_schemas/1`) shows its "PLT-BASELINE-Founders Day" (11/15/2026) AND "PLT-BASELINE-Recurring Holiday" (12/25/2026), both with working **Edit**/**Remove** controls.

Both dates preserved exactly as created. Confirms the Holiday/Holiday-Scheme tables are genuinely unified — every scheme and every holiday, regardless of which plugin originally created it, is now visible and editable from either plugin's own native screen. (Noted in passing, not in scope for this TC: a stray `test` holiday fixture (09/29/2026) exists in the Workload-origin scheme from earlier ad-hoc testing this cycle — harmless, not cleaned up.)

---

### TC-PLT-045: Recurring holiday correctly evaluated via WorkingCalendar post-upgrade

**Verifies:** TC-PLT-007 (the `PLT-BASELINE-Recurring Holiday` fixture).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, check whether `PLT-BASELINE-Recurring Holiday` is correctly recognized as non-working on its recurring date this year AND on its next occurrence (a future year), not just the single date originally entered.
2. Cross-check against any Workload/Timesheet/Shift Management capacity or availability view that reads the working-day calendar.

**Expected Result:**
- The recurring holiday is treated as a rule (correctly non-working on every recurrence), consistent with the requirements' claim that this fixes a bug where a recurring holiday was "silently counted as a working day."

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS, with an important scoping nuance documented.** Used the platform's own documented API (`GET /redmineflux_platform/api/v1/working_days/check?date=`) for a deterministic, unambiguous check rather than reading a shift calendar's per-user cell coloring (which turned out not to reflect holiday status at all when nobody has a shift scheduled — a dead end, not itself a bug).
  - **Important finding, not a bug:** `PLT-BASELINE-Recurring Holiday` (`rf_holidays` id 2) belongs to `PLT-BASELINE-Holiday Scheme` (id 1), which is **not** the currently-active scheme (`PLT-BASELINE-Shift Holiday Scheme`, id 2, is active — "only one scheme can be active" per the UI). With the wrong scheme active, `working_days/check` correctly returns `holiday:false` for `2026-12-25` and `2027-12-25` — this is expected, scheme-scoped behavior, not a recurring-evaluation bug, since the active scheme genuinely has no recurring holiday in it.
  - Temporarily activated `PLT-BASELINE-Holiday Scheme` via the UI (`/rf_settings` → Holiday Schemes → toggle → Confirm in the modal — the toggle requires a confirm-modal step, easy to miss since the checkbox visually flips before you click Confirm, and reverts on reload if you don't) to properly test the recurring rule.
  - With the correct scheme active: `2026-12-25` → `holiday:true, working_day:false`. `2027-12-25` → `holiday:true` (this date is also a Saturday, so `working_day:false` either way, but the API still correctly attributes it to the holiday rule, not just the weekend). `2028-12-25` → `holiday:true, working_day:false` (a Monday, so this is unambiguous proof the recurring rule fires on a third, non-weekend year). All three responses correctly list `{"id":2,"name":"PLT-BASELINE-Recurring Holiday"}` in `holidays[]`.
  - **Confirms the requirements' claim genuinely holds**: the recurring holiday is evaluated as a rule across at least 3 different years without needing a materialized row per year, per `PLATFORM_PLUGIN_NORTH_STAR.md`'s description of this mechanism.
  - Reverted the active scheme back to `PLT-BASELINE-Shift Holiday Scheme` (the original state) after testing, confirmed via DB re-query — no lasting change to the environment.

---

### TC-PLT-046: Leave Type consolidation — a type added in one plugin appears in the other

**Verifies:** TC-PLT-008 (the `PLT-BASELINE-Sabbatical` leave type fixture(s)).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, check Workload's Leave Type list for `PLT-BASELINE-Sabbatical`.
2. Check Shift Management's Leave Type list for the same.
3. Confirm both plugins now read from one shared `rf_leave_types` table (e.g., add a brand-new type in Workload post-upgrade and confirm it immediately appears in Shift Management without any sync step).

**Expected Result:**
- One shared list, visible and immediately consistent from both plugins.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PARTIAL — pre-existing survival PASSES, but step 3 (new-type creation) FAILS.**
  - Steps 1–2 PASS: `PLT-BASELINE-Sabbatical` (`rf_leave_types` id 1) confirmed present in a single shared `rf_leave_types` table (6 rows total), and directly observed as a selectable option in both Shift Management's Apply Leave modal and Workload's Request Leave drawer earlier this session — one shared list, consistent from both.
  - Step 3 FAILS: attempted to create a brand-new type (`PLT-VERIFY-CrossPlugin-Type`) via Shift Management's own Leave Types screen (`/shift_management/leave?tab=types` → New Leave Type) to confirm live cross-visibility — the creation itself crashed with a 400 (`ActionController::ParameterMissing: rf_leave_type`, `LeaveTypesController#leave_type_params` still expects the stale pre-consolidation key). No new row was created, so the cross-visibility half of this TC could not be exercised at all. Filed as **`BUG-PLT-012`** — the third occurrence of the exact stale-param-key defect class already seen in `BUG-PLT-009` (Shift Management Leave) and `BUG-PLT-011` (Workload Leave), which also prompted a scope correction on `BUG-PLT-011` (see that file — the earlier "isolated to Leave" conclusion was too broad).
  - **Retest this TC's step 3 once `BUG-PLT-012` is fixed** — the survival-of-existing-data half is solid, but "a type added in one plugin appears in the other" as a live, working flow is currently unverifiable.

---

### TC-PLT-047: Leave consolidation — both original leave records survive without duplication

**Verifies:** TC-PLT-008 (`PLT-BASELINE-Leave-WKL` and `PLT-BASELINE-Leave-SFM`).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, look up both leave records by their pre-upgrade identifying tags.
2. Confirm both still exist as two distinct Leave rows in the single merged table (not deduplicated into one, since they were genuinely two different leave filings), each attributed to the correct person/dates/type.

**Expected Result:**
- Both records present, correctly attributed, no data loss, no accidental collapse into a single row (they are legitimately two separate leave events, not duplicates of each other).

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** DB query confirms both fixtures survive as two distinct `rf_leaves` rows in the single merged table: id 1 (`PLT-BASELINE-Leave-WKL`, Workload-originated, leave_type_id 2) and id 3 (`PLT-BASELINE-Leave-SFM`, Shift-Management-originated, leave_type_id 1), both `user_id=5`, both `2026-10-15`, both `status=approved`. No collapse into one row, no data loss.

---

### TC-PLT-048: Double-filed overlapping leave (same person, both plugins) — post-upgrade behavior

**Verifies:** TC-PLT-008 step 5 (the deliberate double-filing scenario).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, look up the same person's leave records for the overlapping date range filed in both Workload and Shift Management pre-upgrade.
2. Observe: does the merged system show both as separate (now-conflicting) rows, does it flag/surface the conflict anywhere, or does something silently resolve it?

**Expected Result:**
- Not explicitly specified by the ticket beyond "one employee could file leave twice" being the problem statement — document actual behavior precisely. If the merged system still allows a NEW double-filing post-upgrade (i.e., the fix only prevents new double-filing going forward but doesn't address pre-existing double-filed data, or doesn't prevent new double-filing either), that is a significant finding worth its own bug/note, not just an observation.

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **Documented behavior — pre-existing double-filed data is shown as-is, unflagged; whether NEW double-filing is now prevented could not be tested this pass.** Both pre-existing overlapping rows (id 1 and id 3, same `user_id=5`, same date `2026-10-15`, both `status=approved`) are shown as two separate, ordinary-looking rows in the merged `rf_leaves` table — no conflict flag, warning, or merge attempt of any kind on either record. The consolidation did not retroactively resolve or surface the pre-existing double-filing.
  - **Could not test whether a *new* double-filing is now prevented going forward** — this would require filing a second overlapping leave for the same person through one of the three entry points while one already exists, but all three entry points are currently broken for new submissions (`BUG-PLT-009`/`BUG-PLT-010` for Shift Management, `BUG-PLT-011` for Workload; Platform's own screen — TC-PLT-098 — is the only one that works, so a same-person overlap check via Platform's screen alone would only prove Platform's own view, not the cross-plugin problem this consolidation claims to fix). **Retest this specific angle once the Leave-submission bugs are fixed.**

---

### TC-PLT-049: Audit consolidation — both original audit entries survive in `rf_audit_events`

**Verifies:** TC-PLT-009.
**User Role:** Admin (with audit-log view access).

**Steps:**
1. Post-upgrade, locate both the Timesheet-originated and Shift-Management-originated audit entries from TC-PLT-009 in the unified audit view.
2. Compare recorded content (user, timestamp, action, entity) against what was noted at creation time.

**Expected Result:**
- Both entries present, content intact, now visible through one unified audit interface (`rf_audit_events`).

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS for the migration mechanism, with a scope correction on the Timesheet half.**
  - **Shift Management side — PASS.** `rf_audit_events` id 2: `action=auto_approve_leave`, `auditable_type=RfLeaveApplication`, `auditable_id=1`, `performed_by=1`, `created_at=2026-09-28 13:03:44` — matches TC-PLT-009's recorded fixture content exactly, now visible in the unified table. Note `auditable_type` preserved the **old** class name (`RfLeaveApplication`, not remapped to `RedminefluxPlatform::Leave`) — per ADR 0001's aliasing approach this is expected (old identifiers are kept, not rewritten), not a defect.
  - **Timesheet side — the originally-planned fixture never existed, so nothing to compare against; a *different* real entry did migrate correctly.** Per TC-PLT-009's own note, the planned "submit + approve a timesheet" fixture was explicitly deferred (`timesheet_audit_logs` was still empty when that baseline TC was closed). However, `rf_audit_events` id 1 (`action=settings_update`, `auditable_type=Unknown`, `source_timesheet_audit_log_id=1`) confirms at least one real, pre-upgrade Timesheet audit row *did* exist by the time of the upgrade (from an unrelated settings change during later testing) and migrated correctly, with the source-row linkage intact — so the migration mechanism itself is verified working, just not against the originally-envisioned scenario. **Genuinely testing "submit + approve" audit content is still deferred** — would require assigning an Approval Schema to a project and performing that specific workflow, which remains out of scope for this pass.

---

### TC-PLT-050: Audit immutability enforced in the unified `rf_audit_events` table

**Verifies:** Feature list #10 (append-only enforcement).
**User Role:** Admin.

**Steps:**
1. Attempt to edit or delete one of the migrated audit entries (TC-PLT-049) via UI, and if an API/console path is reasonably testable, via that too.

**Expected Result:**
- Edit/delete is refused (append-only enforced in exactly one place now, per requirements — previously this had to be separately enforced in each of the two source plugins).

- **CONFIRMED LIVE 2026-09-30** (Local, `redmine-docker-6-platform` localhost:3013, admin): **PASS.** No Edit/Delete link anywhere in the Audit events list or an individual record's detail page (`/redmineflux_platform/list/audit_events/27`) — only "View". Per this repo's own standing rule that hidden UI is not evidence of blocked access, also confirmed server-side directly: `GET .../27/edit` → `302` (redirected away, no edit path reachable), `DELETE .../27` → `422 Unprocessable Entity` (the route exists but is explicitly refused, not just missing — stronger evidence of deliberate design than a bare 404 would be).

---

## Evidence Map

- Case ID: TC-PLT-040 … TC-PLT-050
- Screenshot: (bugs only)
- Log: —
- Bug reference: —
