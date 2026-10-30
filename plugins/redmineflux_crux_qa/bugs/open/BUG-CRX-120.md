# Bug Report Template

- Bug ID: BUG-CRX-120
- Production Redmine Issue ID: #126690
- Title: Approval schemas created via the Time Agent always default to Inactive, while the native UI's "New Schema" form has no Active/Inactive field at all and always creates schemas Active — inconsistent default behavior between the two creation paths
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, open the native "New Schema" modal at `/approval_schemas` → New Schema. Observe its fields: Schema Name, Description, Approval Levels table (Level/Approver Role/Description/Actions), Add Level, Create Schema/Cancel — there is no Active/Inactive checkbox or field anywhere in this form.
2. Note the one pre-existing schema on this instance, "Standard Manager Approval", was created natively and shows Status = Active, with no separate activation step ever performed on it.
3. As `admin`, in a chat pinned to the Time Agent, create three separate approval schemas with varying phrasing:
   - "Create a new approval schema named 'Crux QA Schema'..." (no mention of active/inactive)
   - "Create a new approval schema named 'Crux No-Level Schema'..." (no mention of active/inactive)
   - "Create an approval schema named 'Crux Active Test Schema' with one level, approver role Manager." (no mention of active/inactive)
4. Check each created schema's Status column on `/approval_schemas`.

## Expected result

- Since the native UI gives no way to create a schema as Inactive (no field exists for it, and its one real-world example schema came out Active), a schema created via Crux with equivalent information should also default to Active, matching the only observable native behavior. At minimum, if Crux's tool is deliberately designed to always create Inactive schemas, the agent should proactively tell the user the new schema is not yet usable and needs a separate activation step — not stay silent about it.

## Actual result

- All 3 schemas created via the Time Agent in this session came out **Inactive** by default, with zero mention of active/inactive required to trigger this — it happened consistently across 3/3 attempts regardless of phrasing.
- The agent never disclosed in any of the 3 "created" confirmations that the new schema would be unusable (cannot be assigned to a team) until separately activated via a follow-up `Timesheet Toggle Schema Active` call.
- A user relying on Crux to set up a new approval schema — matching the only workflow the native UI actually supports (always-active) — ends up with a schema that silently does nothing until they notice it's Inactive and ask for a second step to activate it.

## Evidence

### Console / log

- Native "New Schema" modal snapshot: confirmed no Active/Inactive field present.
- "Standard Manager Approval" (pre-existing, natively created): Status = Active (no toggle ever applied by any tester this session).
- Three Crux-created schemas ("Crux QA Schema" ID 2, "Crux No-Level Schema" ID 3, "Crux Active Test Schema" ID 4) all confirmed Inactive on `/approval_schemas` immediately after creation, each requiring a separate `Timesheet Toggle Schema Active` call to become usable.

## Duplicate check

- Duplicate found: No — related to BUG-CRX-116 (both touch schema-create defaults/validation) but distinct in mechanism: BUG-CRX-116 is about a missing *validation* (0 levels allowed), this is about a mismatched *default field value* (Active) between the native and Crux creation paths.
