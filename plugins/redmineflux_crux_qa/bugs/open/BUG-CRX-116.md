# Bug Report Template

- Bug ID: BUG-CRX-116
- Production Redmine Issue ID: #126686
- Title: Time Agent can create a Timesheet approval schema with zero approval levels (no role at all) via chat, while the native UI hard-blocks the same action
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, open a fresh chat pinned to the Time Agent (`/crux/ask`).
2. Ask: "Create a new approval schema named 'Crux No-Level Schema' with no approval levels at all (zero levels, no roles)."
3. Confirm the proposed `Timesheet Schema Create` write when prompted (the confirm table shows an empty `Level Roles` cell with no warning).
4. Separately, as `admin`, open the native UI "New Schema" modal at `/approval_schemas` → New Schema, fill in a name, and try to remove the only pre-populated level row via its "Remove level" button.

## Expected result

- Both paths should enforce the same business rule. Either a schema must always have at least one approval level (matching the native UI), or the native UI's validation is wrong — but the two must not diverge.

## Actual result

- **Via Crux (Time Agent)**: the write succeeds cleanly. The server created "Crux No-Level Schema" (schema ID 3) with 0 approval levels. Confirmed on `/approval_schemas/3`: "Approval Flow — 0 levels", "No approval levels defined." The agent never warned that a 0-level schema is unusual or non-functional.
- **Via native UI**: attempting to remove the last/only level row in the "New Schema" modal triggers a blocking JS `alert()`: **"You must have at least one approval level."** The native UI will not allow a schema to be saved with 0 levels.
- This is a confirmed client/server (native UI vs. MCP tool) validation mismatch — the same defect class as BUG-CRX-111 (identifier-regex mismatch for project creation). A 0-level schema is meaningless (it can never gate anything, since it has no approver roles), yet Crux lets an admin silently create one with no feedback that something is wrong.

## Evidence

### Console / log

- Schema created via chat: "✓ Approval schema 'Crux No-Level Schema' created (ID: 3)." — confirmed on `/approval_schemas` list: row shows "No levels", 0 "In Use".
- Native UI modal: JS `alert()` fired with exact text "You must have at least one approval level." when attempting to remove the last level row, confirming server/UI-side enforcement exists but is bypassed by the Crux tool path.

## Duplicate check

- Duplicate found: No new root cause — this is the **same defect class as BUG-CRX-111** (MCP tool validation looser than native Redmine/plugin validation), applied to a new entity (Timesheet approval schema levels instead of project identifiers). Filed as a separate bug per this repo's convention of filing recurrences of an already-identified defect class on a new trigger path (see BUG-CRX-027, BUG-CRX-056/077, BUG-CRX-082, BUG-CRX-112, BUG-CRX-115 for the same pattern on other defect classes).
