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

---

### TC-PLT-041: Contact/Customer merge — record survives, correct ID preserved

**Verifies:** TC-PLT-004.
**User Role:** Admin.

**Steps:**
1. In CRM, look up `PLT-BASELINE-Jane Doe` by its pre-upgrade Contact ID.
2. In Invoice, look up `PLT-BASELINE-Jane Doe` by its pre-upgrade Customer ID.
3. Compare resolution and field-value survival, same method as TC-PLT-040.

**Expected Result:**
- Both resolve to one shared record; document ID/field-survival outcome. File a bug if any field data was silently lost.

---

### TC-PLT-042: Helpdesk Customer stays a separate User-based entity, NOT folded into Organization/Contact

**Verifies:** TC-PLT-005.
**User Role:** Admin.

**Steps:**
1. Look up the `plt-baseline-customer-user` Helpdesk Customer post-upgrade.
2. Confirm it is still a Redmine `User` with `is_helpdesk_customer`, and that no `rf_organizations` or Contact record was spuriously created for it.

**Expected Result:**
- Unchanged — still a User, not merged. Per requirements this is explicitly "deliberately left alone." **If it WAS merged/altered, that's a regression against an explicit design decision — file as a bug.**

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

---

### TC-PLT-044: Holiday consolidation — one-off holiday survives in both Workload and Shift Management

**Verifies:** TC-PLT-007 (the `PLT-BASELINE-Founders Day` fixture).
**User Role:** Admin.

**Steps:**
1. In Workload and Shift Management, look up `PLT-BASELINE-Founders Day` post-upgrade.

**Expected Result:**
- Single shared Holiday row, visible/editable from both plugins, correct date preserved.

---

### TC-PLT-045: Recurring holiday correctly evaluated via WorkingCalendar post-upgrade

**Verifies:** TC-PLT-007 (the `PLT-BASELINE-Recurring Holiday` fixture).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, check whether `PLT-BASELINE-Recurring Holiday` is correctly recognized as non-working on its recurring date this year AND on its next occurrence (a future year), not just the single date originally entered.
2. Cross-check against any Workload/Timesheet/Shift Management capacity or availability view that reads the working-day calendar.

**Expected Result:**
- The recurring holiday is treated as a rule (correctly non-working on every recurrence), consistent with the requirements' claim that this fixes a bug where a recurring holiday was "silently counted as a working day."

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

---

### TC-PLT-047: Leave consolidation — both original leave records survive without duplication

**Verifies:** TC-PLT-008 (`PLT-BASELINE-Leave-WKL` and `PLT-BASELINE-Leave-SFM`).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, look up both leave records by their pre-upgrade identifying tags.
2. Confirm both still exist as two distinct Leave rows in the single merged table (not deduplicated into one, since they were genuinely two different leave filings), each attributed to the correct person/dates/type.

**Expected Result:**
- Both records present, correctly attributed, no data loss, no accidental collapse into a single row (they are legitimately two separate leave events, not duplicates of each other).

---

### TC-PLT-048: Double-filed overlapping leave (same person, both plugins) — post-upgrade behavior

**Verifies:** TC-PLT-008 step 5 (the deliberate double-filing scenario).
**User Role:** Admin.

**Steps:**
1. Post-upgrade, look up the same person's leave records for the overlapping date range filed in both Workload and Shift Management pre-upgrade.
2. Observe: does the merged system show both as separate (now-conflicting) rows, does it flag/surface the conflict anywhere, or does something silently resolve it?

**Expected Result:**
- Not explicitly specified by the ticket beyond "one employee could file leave twice" being the problem statement — document actual behavior precisely. If the merged system still allows a NEW double-filing post-upgrade (i.e., the fix only prevents new double-filing going forward but doesn't address pre-existing double-filed data, or doesn't prevent new double-filing either), that is a significant finding worth its own bug/note, not just an observation.

---

### TC-PLT-049: Audit consolidation — both original audit entries survive in `rf_audit_events`

**Verifies:** TC-PLT-009.
**User Role:** Admin (with audit-log view access).

**Steps:**
1. Post-upgrade, locate both the Timesheet-originated and Shift-Management-originated audit entries from TC-PLT-009 in the unified audit view.
2. Compare recorded content (user, timestamp, action, entity) against what was noted at creation time.

**Expected Result:**
- Both entries present, content intact, now visible through one unified audit interface (`rf_audit_events`).

---

### TC-PLT-050: Audit immutability enforced in the unified `rf_audit_events` table

**Verifies:** Feature list #10 (append-only enforcement).
**User Role:** Admin.

**Steps:**
1. Attempt to edit or delete one of the migrated audit entries (TC-PLT-049) via UI, and if an API/console path is reasonably testable, via that too.

**Expected Result:**
- Edit/delete is refused (append-only enforced in exactly one place now, per requirements — previously this had to be separately enforced in each of the two source plugins).

---

## Evidence Map

- Case ID: TC-PLT-040 … TC-PLT-050
- Screenshot: (bugs only)
- Log: —
- Bug reference: —
