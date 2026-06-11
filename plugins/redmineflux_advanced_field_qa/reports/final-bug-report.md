# Final Bug Report — Redmineflux Advanced Field

> Updated after fix verification. All bugs resolved.

## Summary

| Total | Critical | High | Medium | Low | Open | Closed | Retest Status |
|-------|----------|------|--------|-----|------|--------|---------------|
| 2 | 0 | 2 | 0 | 0 | 0 | 2 | Both fixed & confirmed 2026-05-21 |

---

## Closed Bugs

### BUG-RAF-001 ✅ FIXED

- **Title:** Plugin blocks multiple dependency rules for same parent and child field combination even with different parent values
- **Severity:** High
- **Status:** Closed — Fixed
- **Fix Date:** 2026-05-21
- **Retest Date:** 2026-05-21
- **Retest Result:** PASS
- **File:** bugs/closed/BUG-RAF-001.md

**Original issue:** JavaScript duplicate check in `dependencies.html.erb` compared only `parent_field_id + child_field_id`, missing `parent_value`. Any second rule for the same field pair fired an alert immediately, regardless of which parent value was selected.

**Fix:** Added `parent_value` to both the `existingDependencyPairs` Ruby data and the JS `hasDuplicate` check. Alert message updated to match the model error.

**Retest results (Forge: flux-f3txguimh49, 2026-05-21):**

| TC | Description | Result |
|----|-------------|--------|
| TC-RAF-022 | Add HR → Location (Branch Office) alongside existing IT rule | **PASS** |
| TC-RAF-023 | Add Finance → Location (Branch Office, CRM) scoped to Advanced Fields Demo | **PASS** |
| TC-RAF-024 | Add Operations → Location (WAN, LAN, VPN) globally | **PASS** |
| TC-RAF-036 | Location dropdown updates live when Department switches IT→HR | **PASS** |

---

### BUG-RAF-002 ✅ FIXED

- **Title:** Issue edit blocked by validation error on integer formula field receiving float value
- **Severity:** High
- **Status:** Closed — Fixed
- **Fix Date:** 2026-05-21
- **Retest Date:** 2026-05-21
- **Retest Result:** PASS
- **File:** bugs/closed/BUG-RAF-002.md

**Original issue:** `field_calculator.rb` stored float results (e.g., `"3.33"`) directly into Integer-type custom fields via `save(validate: false)`. On next edit, Rails rejected `"3.33"` as not a valid integer, permanently blocking the save.

**Fix:** In `calculate_and_store`, look up `target_field.field_format` after computing the result. If `'int'`, round to nearest integer before storing. `10 ÷ 3` now stores `3` instead of `"3.33"`.

**Retest results (Forge: flux-f3txguimh49, Issue #274, 2026-05-21):**

| Step | Observation | Result |
|------|-------------|--------|
| Create Integer field `Bug002 Repro` + Divide formula (Estimate ÷ Extra Hours) | Formula saved | ✅ |
| Create issue with Estimate=10, Extra Hours=3 | Bug002 Repro = **3** (rounded correctly) | ✅ |
| Open issue edit — check Bug002 Repro field value | Shows **3**, not 3.33 | ✅ |
| Change Priority to High, click Submit | **"Successful update."** — no validation error | ✅ |

---

## Environment

| Field | Value |
|-------|-------|
| Redmine Version | 6.0.9.stable |
| Plugin Version | redmineflux_advanced_fields 0.1.0 |
| Original test environment | flux-f6ezm2x8v49.forge.zehntech.com |
| Retest environment | flux-f3txguimh49.forge.zehntech.com |
| Test Date | 2026-05-21 |
| Retest Date | 2026-05-21 |
| Tested By | Admin (Playwright / Claude) |
