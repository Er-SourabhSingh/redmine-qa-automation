# Test Cases — Redmineflux Platform — Known Gaps & Edge Cases

> Source: `docs/PLATFORM_REQUIREMENTS.md` Known Constraints ("Known gaps" list); `docs/PLATFORM_FEATURES_LIST.md` #14, #25, #26.
>
> These TCs deliberately target the 3 gaps the dev's own ticket #120043 admits to (as of the 2026-09-25 update) — they may since have been fixed, so "expected result" below states what the ticket *predicts*, not an assumption it's still broken. **TC-PLT-090 is the single most important TC in this entire QA cycle** — it is precisely the scenario the user identified as the reason to test the upgrade path with real data instead of trusting the dev's "tables were empty on the dev instance" caveat.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases

---

### TC-PLT-090: Shift Management pre-platform Holiday/Scheme/Audit data — does it survive the upgrade with REAL (non-empty) data?

**User Role:** Admin.
**Precondition:** This TC requires its OWN dedicated baseline fixtures, created and verified BEFORE the branch upgrade (do this as part of `PLATFORM_OLD_ARCHITECTURE_BASELINE.md`, or as a prerequisite step here if not already covered by TC-PLT-007/009):
1. In Shift Management specifically (at `master`, pre-upgrade), create at least one Holiday, one Holiday Scheme, and enough activity to generate at least one Audit log row — all distinctly named/tagged `PLT-GAP090-*` and NOT relying on any already-empty state.

**Steps:**
1. Confirm and record these 3 fixtures' exact content pre-upgrade (IDs, names, dates, scheme rules, audit entry content).
2. Run the branch upgrade (`PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021).
3. Post-upgrade, search for each of the 3 `PLT-GAP090-*` fixtures in their new consolidated locations (Holiday in the shared Holiday table, Scheme in the shared Holiday Scheme table, Audit entry in `rf_audit_events`).

**Expected Result (per the ticket's own admitted gap):**
- The ticket explicitly states these tables had **no data migration written** and were only verified empty on the dev's own instance — predicting these 3 fixtures will likely be **lost or not carried across** on this real, non-empty test.
- **If any of the 3 fixtures is missing, wrong, or silently dropped post-upgrade: this confirms the known gap and should be filed as a bug** (Severity: High — real data loss on upgrade, not just a cosmetic issue), even though the dev ticket already "knows" about it — a filed, reproducible bug with concrete before/after evidence is more actionable than a paragraph in a feature ticket's known-gaps section, and confirms whether it's still true as of the branch HEAD actually installed.
- If all 3 fixtures DO survive correctly, that means this gap has since been fixed and quietly not mentioned in a later journal update — note this explicitly in the plugin's `PLATFORM_MEMORY.md` and update `PLATFORM_REQUIREMENTS.md`'s Known Constraints section accordingly.

---

### TC-PLT-091: `contact_type` internal value still stores `"company"` despite the "Organization" label

**User Role:** Admin (with any UI/API path that exposes the raw internal value — e.g. an export, an API response, or a filter/search that operates on the raw column rather than the translated label).
**Precondition:** TC-PLT-021 PASS, TC-PLT-040 PASS (merged Organization fixture exists).

**Steps:**
1. Find any surface where the raw `contact_type` value (not its translated label) is exposed — e.g. a CSV/JSON export of Organizations, a REST API response, or a custom-field/filter dropdown value.
2. Check whether it reads `"company"` internally while the UI-facing label reads "Organization".

**Expected Result (per the ticket's admitted gap):**
- Internal value is still `"company"` — this is a documented, accepted-as-not-yet-fixed gap requiring "a small data migration." **This is informational, not a bug to file** unless it causes an actual user-visible defect (e.g. a broken filter, a wrong value in an export a user relies on) — if it does, file that specific symptom as a bug rather than the internal value itself.

---

### TC-PLT-092: External identity mapping (`rf_external_identities`) — smoke test only

**User Role:** Admin / DB access (no consumer feature uses this yet per the ticket).
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Confirm the `rf_external_identities` table exists post-migration with the expected generic structure (entity type, entity id, external system, external id — exact columns TBD from source once inspected).
2. Confirm no plugin page errors out referencing this table (since nothing consumes it yet, it should be entirely inert from a UI perspective).

**Expected Result:**
- Table exists, no UI-visible errors anywhere related to it. This is explicitly "groundwork" per the ticket — no functional UI flow exists to test yet. Update this TC once a consumer feature is built on top of it.

---

## Negative Cases

---

### TC-PLT-093: Upgrading with a genuinely unaccounted-for row does not silently lose data (real-world version of TC-PLT-022)

**User Role:** Admin.
**Precondition:** If TC-PLT-022 was BLOCKED (no throwaway DB available), this TC is the fallback: rely on whether TC-PLT-090's real data happens to surface this exact failure mode organically, rather than deliberately engineering it.

**Steps:**
1. Cross-reference TC-PLT-090's outcome: if any Shift Management fixture WAS silently dropped rather than causing a migration failure, that is itself evidence the duplicate-table-drop guard (which is supposed to "refuse while any row is unaccounted for") did NOT catch this specific case.

**Expected Result:**
- Either the migration should have refused to run / raised a visible error (protecting the data by blocking the upgrade until resolved), or the data should have migrated correctly. **Silent, no-error data loss is the worst-case outcome and the one this TC exists to explicitly rule out** — if TC-PLT-090 shows silent loss with no migration warning at all, note that specifically in the bug filed for TC-PLT-090 as an aggravating factor (not just "data lost" but "data lost with zero warning").

---

## Evidence Map

- Case ID: TC-PLT-090 … TC-PLT-093
- Screenshot: bug evidence only, `screenshots/<BUG-ID>/` (TC-PLT-090 is the most likely candidate to actually produce a bug this cycle)
- Log: migration output/logs from the TC-PLT-021 run, cross-referenced here
- Bug reference: —
