# Test Cases — System Settings & Notifications — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | System Settings & Notifications |
| **TC Range** | TC-RDV-496 to TC-RDV-520 |
| **Total TCs** | 25 |
| **Requirement Coverage** | SYS-006, SYS-007 |
| **Feature Coverage** | rfd-101, rfd-102 |

---

## SYS-006 — Notification Configuration (rfd-101)

---

### TC-RDV-496 — User accesses the DevOps notification preferences matrix page

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User "alice@example.com" is logged in to Redmine.
- The DevOps plugin is installed and active.
- The notification preferences route `/my/devops_notifications` is available.

**Test Data:**
- User: alice@example.com (Developer role)

**Steps:**
1. Log in as alice@example.com.
2. Navigate to `/my/devops_notifications` (or via My Account → DevOps Notifications link).
3. Observe the page content.

**Expected Result:**
- Page loads with HTTP 200.
- A matrix UI is displayed showing DevOps event types as rows (e.g., build_failure, deployment_success, incident_created, alert_fired, release_published) and notification channels as columns (Email, Slack, Teams).
- Each cell has a checkbox or toggle.
- The page title or heading reads "DevOps Notification Preferences" or equivalent.

---

### TC-RDV-497 — User saves notification preferences and settings are persisted

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User "alice@example.com" is on the `/my/devops_notifications` page.
- No existing preference record exists in `redmineflux_devops_notification_prefs` for alice.

**Test Data:**
- Enable: build_failure → Email (ON), build_failure → Slack (OFF)
- Enable: deployment_success → Email (OFF), deployment_success → Teams (ON)
- Enable: incident_created → Email (ON), incident_created → Slack (ON)

**Steps:**
1. Navigate to `/my/devops_notifications`.
2. Set: build_failure / Email = checked; build_failure / Slack = unchecked.
3. Set: deployment_success / Email = unchecked; deployment_success / Teams = checked.
4. Set: incident_created / Email = checked; incident_created / Slack = checked.
5. Click "Save".
6. Reload the page and observe the saved state.

**Expected Result:**
- After save: HTTP 200 or redirect with a success flash message.
- After reload: All checkbox states match the saved configuration exactly.
- Database table `redmineflux_devops_notification_prefs` contains records for alice matching the saved selections.
- Other users' preferences are not affected.

---

### TC-RDV-498 — Lazy defaults: no record exists in the database before a user first saves

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- User "bob@example.com" has never visited the DevOps notification preferences page.
- No records for bob exist in `redmineflux_devops_notification_prefs`.

**Test Data:**
- User: bob@example.com (never saved preferences)

**Steps:**
1. Verify via database query that no rows exist in `redmineflux_devops_notification_prefs` for bob's user_id.
2. Log in as bob@example.com and navigate to `/my/devops_notifications`.
3. Observe the page renders without error (even with no existing records).
4. Do NOT click Save; navigate away.
5. Re-check the database.

**Expected Result:**
- Page renders without error even when no preference record exists (lazy default behavior).
- All checkboxes show default state (unchecked or system default).
- No database record is created for bob until he explicitly saves.
- The `upsert_matrix_for` helper is not called on page view; only on save.

---

### TC-RDV-499 — Bulk-upsert on save: saving preferences updates existing records rather than inserting duplicates

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- User "carol@example.com" already has preferences saved (some checkboxes are checked).
- Existing record count in `redmineflux_devops_notification_prefs` for carol: N rows.

**Test Data:**
- Initial state: build_failure / Email = ON
- Updated state: build_failure / Email = OFF

**Steps:**
1. Log in as carol@example.com and navigate to `/my/devops_notifications`.
2. Toggle build_failure / Email from ON to OFF.
3. Click "Save".
4. Count records in `redmineflux_devops_notification_prefs` for carol's user_id before and after.

**Expected Result:**
- Record count remains the same after save (upsert, not insert).
- The `build_failure / Email` preference is updated from ON to OFF.
- No duplicate rows are created for carol.
- The `upsert_matrix_for` bulk-upsert helper handles the update correctly.

---

### TC-RDV-500 — Self-service only: user cannot view or modify another user's notification preferences

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "alice@example.com" and user "bob@example.com" both exist in Redmine.
- Alice is logged in.

**Test Data:**
- Bob's user_id: 42 (for example)
- Attempt URL: `/users/42/devops_notifications` or any admin path to view bob's preferences

**Steps:**
1. Log in as alice@example.com.
2. Attempt to navigate to `/my/devops_notifications` — confirm this works and shows Alice's preferences.
3. Attempt to access bob's preferences by guessing a URL such as `/users/42/devops_notifications` or `/my/devops_notifications?user_id=42`.

**Expected Result:**
- `/my/devops_notifications` shows only Alice's own preferences.
- Any attempt to access another user's preferences returns HTTP 403 or redirects to Alice's own page.
- No other user's preference data is exposed.

---

### TC-RDV-501 — Notification matrix UI renders all DevOps event types as rows

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- User is on the `/my/devops_notifications` page.

**Test Data:**
- Expected event types (minimum): build_failure, build_recovered, deployment_success, deployment_failed, incident_created, incident_escalated, incident_resolved, release_published, alert_fired, security_gate_blocked

**Steps:**
1. Navigate to `/my/devops_notifications`.
2. Count and list the event type rows in the matrix.

**Expected Result:**
- All expected event type rows are present in the matrix.
- Each row has a human-readable label (not just a raw event_type key).
- Each row has columns for Email, Slack, and Teams notification channels.
- No duplicate rows exist for any event type.

---

### TC-RDV-502 — Notification matrix UI renders Email, Slack, and Teams as columns

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- User is on the `/my/devops_notifications` page.

**Test Data:**
- N/A

**Steps:**
1. Navigate to `/my/devops_notifications`.
2. Inspect the table header row.

**Expected Result:**
- Column headers include at minimum: "Email", "Slack", "Teams".
- Column count matches the three notification channels defined in rfd-101.
- No column header is blank or unlabeled.

---

### TC-RDV-503 — Saving notification preferences with a missing CSRF token is rejected

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- User is logged in.
- CSRF protection is enabled in Redmine (standard behavior).

**Test Data:**
- POST request to `/my/devops_notifications` with valid preferences but missing or invalid `authenticity_token`.

**Steps:**
1. Craft a POST request to `/my/devops_notifications` without a valid CSRF token.
2. Submit the request.

**Expected Result:**
- HTTP 422 Unprocessable Entity (or 403 Forbidden) is returned.
- No preference records are written to the database.
- Standard Redmine CSRF protection prevents the update.

---

### TC-RDV-504 — Notification preferences page is accessible without Admin role

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- User "dev-user" has only the Developer role in one project — not Admin.

**Test Data:**
- User: dev-user (non-admin, Developer role)

**Steps:**
1. Log in as dev-user.
2. Navigate to `/my/devops_notifications`.

**Expected Result:**
- Page loads successfully (HTTP 200).
- Non-admin users can manage their own notification preferences.
- No "Access Denied" or 403 is shown for self-service notification management.

---

### TC-RDV-505 — Notification preferences are not shared across users (isolation check)

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- alice@example.com has saved: build_failure / Email = ON.
- bob@example.com has never saved any preferences.

**Test Data:**
- alice's pref: build_failure / Email = ON
- bob's pref: no saved records

**Steps:**
1. Log in as bob@example.com.
2. Navigate to `/my/devops_notifications`.
3. Observe the build_failure / Email checkbox state.

**Expected Result:**
- Bob's page shows build_failure / Email = OFF (default).
- Alice's setting of ON does not carry over to Bob.
- Preferences are strictly per-user and never shared.

---

## SYS-007 — Plugin Settings (rfd-102)

---

### TC-RDV-506 — Admin accesses plugin settings page via Admin → Plugins → Configure

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User is logged in as Redmine Administrator.
- The DevOps plugin is installed.

**Test Data:**
- N/A

**Steps:**
1. Log in as Admin.
2. Navigate to Admin → Plugins.
3. Locate "Redmineflux DevOps" in the plugin list.
4. Click the "Configure" link.

**Expected Result:**
- Plugin settings page loads with HTTP 200.
- The page displays the `settings_partial` for the DevOps plugin configuration form.
- Fields visible include: Encryption Key, Jenkins Webhook Token, Monitoring Webhook Token, System User for automated comments, Rate Limit (incoming events), Health sample retention period, Webhook event retention period.

---

### TC-RDV-507 — Encryption key field is rendered as a password input

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Encryption key field name in HTML: check for `type="password"` attribute

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Inspect the Encryption Key input field in the browser (View Source or DevTools).

**Expected Result:**
- The Encryption Key input field has `type="password"`, causing the browser to mask the value.
- The field value is not rendered in plaintext in the HTML source.
- API token fields (Jenkins webhook token, monitoring webhook token) are similarly rendered as password inputs.

---

### TC-RDV-508 — Save valid plugin settings: all fields accepted and persisted

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Jenkins Webhook Token: `jenkins-token-abc123`
- Monitoring Webhook Token: `prometheus-token-xyz789`
- System User for automated comments: `devops-bot` (a valid Redmine user login)
- Rate limit for incoming events: `100` (events per minute)
- Health sample retention: `30` (days)
- Webhook event retention: `90` (days)

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Fill in all fields with the test data above.
3. Click "Apply" or "Save".

**Expected Result:**
- HTTP 200 or redirect back to the settings page with a success flash message.
- Settings are persisted to Redmine's plugin settings store.
- Reloading the page shows the saved values (non-sensitive fields displayed; sensitive fields show masked or empty placeholder per security best practice).

---

### TC-RDV-509 — SettingsValidator rejects invalid rate limit value

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Invalid rate limit: `-5` (negative number)
- Invalid rate limit: `abc` (non-numeric string)
- Invalid rate limit: `0` (if zero is disallowed by SettingsValidator)

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Enter rate limit value: `-5`.
3. Click "Save".
4. Observe the response.
5. Repeat with `abc` as the rate limit value.

**Expected Result:**
- `SettingsValidator` rejects the invalid value.
- A validation error message is displayed on the settings page (e.g., "Rate limit must be a positive integer").
- The settings are NOT saved to the store.
- HTTP 200 is returned with the form re-displayed including the error message (no 500).

---

### TC-RDV-510 — SettingsValidator rejects invalid retention period values

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Invalid health sample retention: `0` days
- Invalid health sample retention: `99999` days (if maximum is enforced)
- Invalid webhook event retention: `-1` days

**Steps:**
1. Set health sample retention to `0`.
2. Click "Save".
3. Observe the error response.
4. Set webhook event retention to `-1`.
5. Click "Save".

**Expected Result:**
- Both invalid values trigger `SettingsValidator` validation errors.
- Clear error messages are displayed explaining the constraint (e.g., "Retention period must be at least 1 day").
- No invalid values are persisted.

---

### TC-RDV-511 — Non-admin user cannot access the plugin settings page

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role — not Admin.

**Test Data:**
- User: dev-user
- Attempt URL: `/settings/plugin/redmineflux_devops`

**Steps:**
1. Log in as dev-user.
2. Navigate to `/settings/plugin/redmineflux_devops` directly.

**Expected Result:**
- HTTP 403 Forbidden is returned.
- The plugin settings form is not displayed.
- The user is not shown any sensitive configuration data such as encryption keys or webhook tokens.

---

### TC-RDV-512 — DevOps Engineer (manage_devops_settings) cannot access Admin plugin settings

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has DevOps Engineer role with `manage_devops_settings` permission (project-level).
- devops-eng is NOT a Redmine Admin (no global admin access).

**Test Data:**
- User: devops-eng

**Steps:**
1. Log in as devops-eng.
2. Navigate to `/settings/plugin/redmineflux_devops` (Admin-level plugin configure).

**Expected Result:**
- HTTP 403 Forbidden is returned.
- `manage_devops_settings` is a project-level permission; Admin → Plugins → Configure requires global Admin status.
- The plugin settings page is not accessible to devops-eng.

---

### TC-RDV-513 — Jenkins webhook token is saved and retrievable (masked on re-display)

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Jenkins Webhook Token: `secret-jenkins-webhook-token-9876`

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Enter Jenkins Webhook Token: `secret-jenkins-webhook-token-9876`.
3. Click "Save".
4. Reload the Plugin Settings page.
5. Observe the Jenkins Webhook Token field.

**Expected Result:**
- Token is saved successfully (POST 200, success flash message).
- On reload, the field shows a masked placeholder (e.g., `••••••••`) or is blank per security best practice, NOT the plaintext token.
- The raw token is not rendered in the HTML source of the settings page.

---

### TC-RDV-514 — System user for automated comments must be a valid Redmine user

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Invalid system user: `nonexistent-user-login-xyz` (does not exist in Redmine)

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Enter system user field: `nonexistent-user-login-xyz`.
3. Click "Save".

**Expected Result:**
- `SettingsValidator` detects that the user does not exist in Redmine.
- A validation error is displayed: "System user 'nonexistent-user-login-xyz' not found."
- Settings are not saved with the invalid user reference.

---

### TC-RDV-515 — Retention period for health samples configures data pruning correctly

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin has saved health sample retention = 7 days.
- `redmineflux_devops_health_samples` contains records older than 7 days.
- The retention rake task `rake redmineflux_devops:prune_health_samples` (or equivalent) is available.

**Test Data:**
- Retention setting: 7 days
- Old records: health samples created 10 days ago

**Steps:**
1. Set health sample retention to 7 days via Plugin Settings.
2. Run the retention pruning task (via rake or scheduled job).
3. Check the `redmineflux_devops_health_samples` table.

**Expected Result:**
- Records older than 7 days are deleted from `redmineflux_devops_health_samples`.
- Records from the last 7 days are retained.
- The task completes without error.

---

### TC-RDV-516 — Retention period for webhook events limits audit table size

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin has saved webhook event retention = 14 days.
- `redmineflux_devops_webhook_events` contains events older than 14 days.

**Test Data:**
- Retention setting: 14 days
- Old records: webhook events created 20 days ago

**Steps:**
1. Set webhook event retention to 14 days via Plugin Settings.
2. Run the pruning rake task.
3. Check the `redmineflux_devops_webhook_events` table.

**Expected Result:**
- Events older than 14 days are purged.
- Events from the last 14 days are preserved.
- Only the last 100 events are visible in the admin webhook event log UI (per SYS-001 constraint), regardless of table size.

---

### TC-RDV-517 — Settings page displays all required configuration sections

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- Admin is on the Plugin Settings page.

**Test Data:**
- Expected configuration sections: Security (encryption key), Integrations (webhook tokens), Automation (system user), Limits (rate limits), Retention (health samples, webhook events)

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Inspect all form sections and field labels.

**Expected Result:**
- The settings page contains fields/sections for:
  - Encryption key (sensitive — rendered as password input)
  - Jenkins webhook token (sensitive)
  - Monitoring tools webhook token (sensitive)
  - System user for automated comments
  - Rate limit for incoming webhook events
  - Health sample retention period (days)
  - Webhook event retention period (days)
- All fields have clear labels.
- No field is orphaned without a label.

---

### TC-RDV-518 — Plugin settings page loads correctly after a fresh plugin install (no prior settings)

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Plugin has just been installed (no settings ever saved).
- No rows exist in Redmine's `settings` table for `redmineflux_devops`.

**Test Data:**
- Fresh install state — no prior settings

**Steps:**
1. Log in as Admin immediately after plugin install (before any settings have been configured).
2. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.

**Expected Result:**
- Page loads without error (HTTP 200).
- All fields render with empty or sensible default values (e.g., rate limit defaults to 100, retention defaults to 30 days).
- No nil reference errors or 500 errors are raised when settings are nil/absent.

---

### TC-RDV-519 — Negative: save notification preferences with an unrecognized event type is rejected

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Notification Configuration (rfd-101) |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- User is logged in with a valid session.

**Test Data:**
- Crafted POST payload with event_type: `unknown_event_xyz` (not a recognized DevOps event type)

**Steps:**
1. Craft a POST request to `/my/devops_notifications` with:
   - `preferences[unknown_event_xyz][email]` = `1`
2. Submit the request.

**Expected Result:**
- The invalid event type is rejected (not saved).
- The `upsert_matrix_for` helper does not create a record for `unknown_event_xyz`.
- If the application silently ignores unknown keys: no record is created and the response is 200 with no error.
- If the application validates known event types: a 422 validation error is returned.
- In neither case is the database written with an invalid event_type value.

---

### TC-RDV-520 — Full plugin settings form is submitted and persisted correctly (regression check)

| Field | Value |
|-------|-------|
| **Module** | System Settings & Notifications |
| **Feature** | Plugin Settings (rfd-102) |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin is logged in.
- All prior settings are cleared/reset.

**Test Data:**
- Encryption key: (a 32-character random string — admin-provided)
- Jenkins token: `j-token-2026-prod-001`
- Monitoring token: `prom-token-2026-prod-001`
- System user: `devops-bot` (exists in Redmine)
- Rate limit: `200` events per minute
- Health sample retention: `14` days
- Webhook event retention: `60` days

**Steps:**
1. Navigate to Admin → Plugins → Redmineflux DevOps → Configure.
2. Fill all fields with the test data above.
3. Click "Apply" / "Save".
4. Reload the page.
5. Verify non-sensitive fields retain their values.

**Expected Result:**
- All fields pass `SettingsValidator` validation.
- Save succeeds with HTTP 200 and a success flash message.
- On reload: rate limit shows `200`, health retention shows `14`, webhook retention shows `60`, system user shows `devops-bot`.
- Sensitive token/key fields show masked values (not plaintext).
- Test suite passes: per rfd-102, the full suite runs 990 runs, 2401 assertions, 0 failures.
