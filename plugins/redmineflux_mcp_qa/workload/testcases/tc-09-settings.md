# Test Cases — Settings — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Settings (Admin only) |
| **TC Range** | TC-RFM-078 to TC-RFM-081 |
| **Total TCs** | 4 |
| **Execution Order** | Suite 9 — Run after Workload Dashboard (tc-08) |
| **Feature Coverage** | RFM-F078 through RFM-F081 |

---

## TC-RFM-078 — Admin reads plugin settings via MCP

| Field | Value |
|-------|-------|
| **Module** | Settings |
| **Feature** | RFM-F078 Read settings |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- MCP session authenticated as Admin.
- Plugin settings page is accessible.

**Test Data:**
- MCP Prompt: `"Show Redmineflux plugin settings"`

**Steps:**
1. Issue MCP prompt: `"Show Redmineflux plugin settings"`.
2. Capture and validate the MCP response:
   - Response contains the current plugin configuration values.
   - Response includes all available settings (confirm the list from the first run).
   - Sensitive fields (API tokens, secrets) are masked or absent from the response.
3. Using Playwright, navigate to Administration > Plugins > Configure (Redmineflux MCP).
4. Compare the settings values displayed in the UI with the MCP response values.
5. Verify no sensitive values are exposed in the MCP response.

**Expected Result:**
- MCP returns all plugin settings with their current values.
- UI settings values match the MCP response.
- Sensitive fields (if any) are not exposed in plain text in the MCP response.

---

## TC-RFM-079 — Admin updates plugin settings via MCP

| Field | Value |
|-------|-------|
| **Module** | Settings |
| **Feature** | RFM-F079 Update settings |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- MCP session authenticated as Admin.
- At least one configurable, non-sensitive setting exists (confirm setting name and valid values from TC-RFM-078 output).

**Test Data:**
- MCP Prompt: Update a known setting (e.g., `"Update Redmineflux setting [setting_name] to [new_value]"`)
- Note: Exact prompt format and setting names to be confirmed during first test run.

**Steps:**
1. First run TC-RFM-078 to identify available settings and their current values.
2. Choose one non-sensitive setting and a valid new value (different from the current value).
3. Issue MCP prompt to update the chosen setting (e.g., `"Update Redmineflux setting default_allocation_percent to 50"`).
4. Capture and validate the MCP response:
   - Response confirms the setting was updated.
   - Response shows the new value.
5. Using Playwright, navigate to Administration > Plugins > Configure (Redmineflux MCP).
6. Verify the updated setting shows the new value.
7. After verification, restore the original value via MCP: `"Update Redmineflux setting [setting_name] to [original_value]"`.

**Expected Result:**
- MCP confirms setting updated with the new value.
- Playwright shows the new value in the plugin settings UI.
- Setting is restorable to its original value via MCP.

---

## TC-RFM-080 — Admin resets plugin settings via MCP

| Field | Value |
|-------|-------|
| **Module** | Settings |
| **Feature** | RFM-F080 Reset settings |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- MCP session authenticated as Admin.
- At least one setting has been changed from its default value (from TC-RFM-079).

**Test Data:**
- MCP Prompt: `"Reset Redmineflux plugin settings to defaults"`

**Steps:**
1. Confirm at least one setting is at a non-default value (from TC-RFM-079).
2. Issue MCP prompt: `"Reset Redmineflux plugin settings to defaults"`.
3. Capture and validate the MCP response:
   - Response confirms settings reset to defaults.
4. Issue MCP prompt: `"Show Redmineflux plugin settings"` to read current values.
5. Verify the previously changed setting is back to its default value.
6. Using Playwright, navigate to Administration > Plugins > Configure (Redmineflux MCP).
7. Verify the UI shows default values for all settings.

**Expected Result:**
- MCP confirms settings reset.
- Subsequent MCP read confirms settings are at default values.
- Playwright UI shows default values for all settings.
- Note: If reset functionality is not supported, document in memory.md and mark TC as N/A.

---

## TC-RFM-081 — Non-admin user cannot access settings via MCP

| Field | Value |
|-------|-------|
| **Module** | Settings |
| **Feature** | RFM-F081 Non-admin settings denied |
| **Priority** | High |
| **Scenario Type** | Negative / Permission |
| **User Role** | Non-Admin User |

**Preconditions:**
- User john.doe exists without Admin role.
- MCP session authenticated as john.doe.

**Test Data:**
- MCP Prompt (read): `"Show Redmineflux plugin settings"`
- MCP Prompt (update): `"Update Redmineflux setting [any_setting] to [any_value]"`

**Steps:**
1. (As john.doe, non-admin) Issue MCP prompt: `"Show Redmineflux plugin settings"`.
2. Capture MCP response — expect access denied error or no settings returned.
3. Issue MCP prompt: `"Update Redmineflux setting default_allocation_percent to 99"`.
4. Capture MCP response — expect access denied error.
5. Using Playwright, navigate to Administration > Plugins as john.doe.
6. Verify the admin plugins configuration page is not accessible (403 or redirected).
7. Verify no settings were changed by reading them as Admin (issue admin MCP prompt to confirm).

**Expected Result:**
- Both MCP operations return access denied / permission error for john.doe.
- No plugin settings are modified.
- Playwright confirms the admin plugins page is inaccessible to non-admin users.
