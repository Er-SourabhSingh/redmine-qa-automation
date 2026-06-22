# Test Cases — Holiday Schema — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Holiday Schema (Admin only) |
| **TC Range** | TC-RFM-001 to TC-RFM-009 |
| **Total TCs** | 9 |
| **Execution Order** | Suite 1 — Run first (no dependencies) |
| **Feature Coverage** | RFM-F001 through RFM-F009 |

---

## Holiday Schema CRUD

---

## TC-RFM-001 — Admin creates holiday schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — CRUD |
| **Feature** | RFM-F001 Create holiday schema |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- No holiday schema named "India 2026" exists.
- MCP session authenticated as Admin.

**Test Data:**
- Schema name: India 2026

**Steps:**
1. Call MCP tool `holiday_scheme_create` with name = "India 2026".
2. Validate MCP response:
   - Response confirms successful creation.
   - Response includes schema name "India 2026" and a schema ID.
   - Note the schema ID for use in TC-RFM-002 through TC-RFM-009.
3. Using Playwright, navigate to `/rf_settings` (Holiday Schemes section).
4. Verify "India 2026" appears in the holiday schemes list.

**Expected Result:**
- MCP confirms holiday schema "India 2026" created with an ID.
- Playwright shows "India 2026" in the holiday schemes list.

---

## TC-RFM-002 — Admin reads holiday schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — CRUD |
| **Feature** | RFM-F002 Read holiday schema |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday schema "India 2026" exists (created in TC-RFM-001).

**Test Data:**
- Schema ID from TC-RFM-001.

**Steps:**
1. Call MCP tool `holiday_scheme_show` with the schema ID from TC-RFM-001.
2. Validate MCP response:
   - Response contains schema name = "India 2026".
   - Response contains schema ID.
   - Response contains holiday list (may be empty at this point).
3. Using Playwright, navigate to the holiday schemes list and click "India 2026".
4. Verify schema name and holiday count match the MCP response.

**Expected Result:**
- MCP returns schema record with name, ID, and holidays list.
- Playwright schema detail matches MCP response.

---

## TC-RFM-003 — Admin updates holiday schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — CRUD |
| **Feature** | RFM-F003 Update holiday schema |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday schema "India 2026" exists (from TC-RFM-001).

**Test Data:**
- Schema ID from TC-RFM-001.
- New name: "India Holidays 2026"

**Steps:**
1. Call MCP tool `holiday_scheme_update` with schema ID and name = "India Holidays 2026".
2. Validate MCP response:
   - Response confirms update.
   - Response shows updated name "India Holidays 2026".
3. Using Playwright, navigate to the holiday schemes list.
4. Verify the schema now shows name "India Holidays 2026".
5. Call MCP `holiday_scheme_update` to rename back to "India 2026" (restore for later tests).

**Expected Result:**
- MCP confirms schema name updated.
- Playwright shows the updated name.
- Schema is restored to "India 2026" for subsequent tests.

---

## TC-RFM-004 — Admin deletes holiday schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — CRUD |
| **Feature** | RFM-F004 Delete holiday schema |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- A holiday schema named "Delete Test Schema" exists — create fresh via MCP before this TC.

**Test Data:**
- Schema to create and delete: "Delete Test Schema"

**Steps:**
1. Call MCP `holiday_scheme_create` with name = "Delete Test Schema". Note the ID.
2. Call MCP `holiday_scheme_delete` with that schema ID.
3. Validate MCP response:
   - Response confirms successful deletion.
4. Using Playwright, navigate to the holiday schemes list.
5. Verify "Delete Test Schema" no longer appears.
6. Call MCP `holiday_scheme_show` with the deleted ID — expect not-found response.

**Expected Result:**
- MCP confirms deletion.
- Schema no longer appears in Playwright list.
- Subsequent MCP read returns not-found.

---

## Holiday CRUD Inside Schema

---

## TC-RFM-005 — Add holiday to schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — Holidays |
| **Feature** | RFM-F005 Add holiday |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday schema "India 2026" exists (from TC-RFM-001).
- No holiday named "Diwali" exists in this schema.

**Test Data:**
- Schema ID from TC-RFM-001.
- Holiday name: Diwali
- Holiday date: 2026-11-10

**Steps:**
1. Call MCP `holiday_create` with scheme_id (from TC-RFM-001), name = "Diwali", date = "2026-11-10".
2. Validate MCP response:
   - Response confirms "Diwali" added with date 2026-11-10.
   - Response includes holiday ID.
   - Note the holiday ID for TC-RFM-006 and TC-RFM-007.
3. Using Playwright, navigate to the "India 2026" schema detail page.
4. Verify "Diwali" appears in the holiday list with date 10-Nov-2026.

**Expected Result:**
- MCP confirms Diwali added with date 2026-11-10.
- Playwright shows Diwali in the India 2026 schema with correct date.

---

## TC-RFM-006 — Update holiday in schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — Holidays |
| **Feature** | RFM-F006 Update holiday |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday "Diwali" exists in schema "India 2026" with date 2026-11-10 (from TC-RFM-005).

**Test Data:**
- Holiday ID from TC-RFM-005.
- New date: 2026-10-20

**Steps:**
1. Call MCP `holiday_update` with holiday ID (from TC-RFM-005) and date = "2026-10-20".
2. Validate MCP response:
   - Response confirms holiday date updated to 2026-10-20.
3. Using Playwright, navigate to the "India 2026" schema detail.
4. Locate Diwali in the holiday list.
5. Verify the date now shows 20-Oct-2026.

**Expected Result:**
- MCP confirms Diwali date updated to 2026-10-20.
- Playwright shows the updated date for Diwali in India 2026.

---

## TC-RFM-007 — Delete holiday from schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — Holidays |
| **Feature** | RFM-F007 Delete holiday |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday "Diwali" exists in schema "India 2026" (from TC-RFM-005 / TC-RFM-006).

**Test Data:**
- Holiday ID from TC-RFM-005.

**Steps:**
1. Call MCP `holiday_delete` with the Diwali holiday ID.
2. Validate MCP response:
   - Response confirms holiday deleted.
3. Using Playwright, navigate to the "India 2026" schema detail.
4. Verify "Diwali" no longer appears in the holiday list.

**Expected Result:**
- MCP confirms Diwali deleted from the schema.
- Playwright shows Diwali is no longer in the India 2026 holiday list.

---

## TC-RFM-008 — View all holidays in schema via MCP

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — Holidays |
| **Feature** | RFM-F008 View holidays |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Holiday schema "India 2026" exists (from TC-RFM-001).

**Test Data:**
- Schema ID from TC-RFM-001.
- Add 3 holidays via MCP before calling the list:
  - Independence Day — 2026-08-15
  - Republic Day — 2026-01-26
  - Gandhi Jayanti — 2026-10-02

**Steps:**
1. Add 3 holidays to "India 2026" via MCP `holiday_create` (Independence Day, Republic Day, Gandhi Jayanti).
2. Call MCP `holidays_list` with scheme_id from TC-RFM-001.
3. Validate MCP response:
   - Response contains all 3 holidays with correct names and dates.
4. Using Playwright, navigate to the "India 2026" schema detail.
5. Verify holiday count in UI matches MCP response count.
6. Verify each holiday name and date in MCP response matches a row in the UI.

**Expected Result:**
- MCP returns all holidays in "India 2026" with correct names and dates.
- Playwright schema detail shows the same holidays with matching data.

---

## TC-RFM-009 — Non-admin user denied holiday schema operations

| Field | Value |
|-------|-------|
| **Module** | Holiday Schema — Permissions |
| **Feature** | RFM-F009 Non-admin holiday access denied |
| **Priority** | High |
| **Scenario Type** | Negative / Permission |
| **User Role** | Non-Admin User |

**Preconditions:**
- Holiday schema "India 2026" exists (from TC-RFM-001).
- MCP session is authenticated as Admin (we verify the server enforces admin-only access).

**Test Data:**
- Attempt operations that require admin: create, update, delete schema.

**Steps:**
1. From the MCP response of `holiday_scheme_create`, verify the tool requires admin access.
2. Call MCP `holiday_scheme_show` with the India 2026 scheme ID — verify read is allowed.
3. Using Playwright, navigate to `/rf_settings` as admin.
4. Verify the holiday schemas admin section is only accessible to admin users.
5. Verify "India 2026" schema remains unchanged after all tests.

**Expected Result:**
- Holiday schema read is allowed via MCP (admin API key).
- The UI admin section is restricted to admin users.
- "India 2026" schema exists intact for use in Workload tests (tc-05-workload-crud.md).
