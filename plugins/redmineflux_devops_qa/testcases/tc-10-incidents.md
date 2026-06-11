# Test Cases — Incident Management — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Incident Management |
| **TC Range** | TC-RDV-421 to TC-RDV-460 |
| **Total TCs** | 40 |
| **Requirement Coverage** | INC-001, INC-002, INC-003, INC-004, INC-005, INC-006 |
| **Feature Coverage** | rfd-030, rfd-031, rfd-094, rfd-095, rfd-096, rfd-119 |

---

### TC-RDV-421 — Create incident with required fields

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_incidents` permission on project "Phoenix Platform"
- Incident tracker is configured in the project

**Test Data:**
- Title: "Database connection pool exhausted"
- Severity: SEV2
- Affected Service: "Payment API"
- Description: "Production database is rejecting new connections due to pool exhaustion"

**Steps:**
1. Log in as a DevOps engineer with `manage_incidents` permission.
2. Navigate to the project "Phoenix Platform" → DevOps → Incidents tab.
3. Click "New Incident".
4. Enter title "Database connection pool exhausted".
5. Select severity "SEV2" from the dropdown.
6. Enter affected service "Payment API".
7. Enter description "Production database is rejecting new connections due to pool exhaustion".
8. Click "Create Incident".

**Expected Result:**
- Incident is created and the detail page opens.
- Title, severity (SEV2), affected_service ("Payment API"), and description are all visible.
- Incident status is "Open".
- A row appears in `redmineflux_devops_incidents` with the correct field values.

---

### TC-RDV-422 — Create incident with SEV1 severity

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_incidents` permission.
- Incident tracker configured.

**Test Data:**
- Title: "Total service outage — checkout unavailable"
- Severity: SEV1
- Affected Service: "Checkout Service"
- Description: "100% of checkout requests are failing"

**Steps:**
1. Navigate to DevOps → Incidents → New Incident.
2. Enter title "Total service outage — checkout unavailable".
3. Select severity "SEV1".
4. Enter affected service "Checkout Service".
5. Enter description "100% of checkout requests are failing".
6. Click "Create Incident".

**Expected Result:**
- Incident is saved with severity SEV1 (Critical).
- The incident list shows SEV1 label with critical styling (e.g., red badge).
- Tracker is "Incident", priority is "Urgent" as per MON-002 auto-creation spec.

---

### TC-RDV-423 — Create incident with SEV3 and SEV4 severity levels

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_incidents` permission.

**Test Data:**
- Incident A: title "Minor login page delay", severity SEV3, affected service "Auth Service"
- Incident B: title "Non-critical config warning", severity SEV4, affected service "Config Service"

**Steps:**
1. Create Incident A: title "Minor login page delay", severity SEV3, affected service "Auth Service".
2. Save and verify SEV3 label displayed.
3. Create Incident B: title "Non-critical config warning", severity SEV4, affected service "Config Service".
4. Save and verify SEV4 label displayed.
5. Open the Incidents list view.

**Expected Result:**
- Both incidents appear in the list with their respective severity labels (SEV3, SEV4).
- All four severity levels (SEV1/SEV2/SEV3/SEV4) are selectable in the creation form.

---

### TC-RDV-424 — Incident list displays required columns

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- At least 3 incidents exist in the project with varying severities and statuses.
- One incident is resolved (resolved_at set).

**Test Data:**
- Incident 1: SEV1, Open, assigned to "Alice", MTTR: N/A (unresolved)
- Incident 2: SEV2, Resolved, assigned to "Bob", MTTR: 47 minutes
- Incident 3: SEV3, Acknowledged, assigned to "Carol", MTTR: N/A

**Steps:**
1. Navigate to DevOps → Incidents tab.
2. Observe the list table columns.

**Expected Result:**
- The table shows columns: Severity, Status, MTTR, Assigned To.
- Severity column shows labels SEV1/SEV2/SEV3 with appropriate styling.
- MTTR column shows "47 minutes" for the resolved incident.
- MTTR column shows "N/A" for open and acknowledged incidents.
- Assigned To column shows user names.

---

### TC-RDV-425 — Incident detail shows affected_service and root_cause fields

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- An incident exists with affected_service="Order Service" and root_cause set to "Memory leak in v1.3.2 release".

**Test Data:**
- Incident ID: INC-007, affected_service: "Order Service", root_cause: "Memory leak in v1.3.2 release"

**Steps:**
1. Navigate to DevOps → Incidents.
2. Click on incident INC-007.
3. View the incident detail page.

**Expected Result:**
- "Affected Service" field is visible and shows "Order Service".
- "Root Cause" field is visible and shows "Memory leak in v1.3.2 release".
- Both fields are displayed in the incident detail section (not hidden or collapsed).

---

### TC-RDV-426 — Incident detail shows linked alerts

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- An alert "High error rate — Payment API" (source: Prometheus, severity: critical) was received and triggered auto-creation of incident INC-008.
- The alert is linked to incident INC-008 via the `has_many :alerts` association.

**Test Data:**
- Alert title: "High error rate — Payment API", source: Prometheus, fired_at: 2026-05-21 10:00 UTC

**Steps:**
1. Navigate to DevOps → Incidents → INC-008.
2. Scroll to the "Linked Alerts" section on the incident detail page.

**Expected Result:**
- The "Linked Alerts" section is visible and contains the alert "High error rate — Payment API".
- Alert source (Prometheus), severity (critical), and fired_at timestamp are displayed.
- The alert row links back to the alert feed entry.

---

### TC-RDV-427 — Incident timeline aggregates events from all four sources

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Timeline (rfd-031) |
| **Requirement Ref** | INC-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-009 exists with:
  - A linked alert (fired at 09:55 UTC)
  - A correlated deployment (v1.4.9, deployed at 09:40 UTC)
  - A status change (Acknowledged at 10:05 UTC)
  - A manual timeline entry added via UI ("Team notified via Slack", 10:10 UTC)

**Test Data:**
- Incident INC-009, project "Phoenix Platform"

**Steps:**
1. Navigate to DevOps → Incidents → INC-009.
2. Click the "Timeline" tab.
3. Observe all events listed.

**Expected Result:**
- Timeline shows events from all 4 sources: alert (Prometheus alert fired), deployment (v1.4.9 linked), status change (Acknowledged), and manual entry ("Team notified via Slack").
- All 4 event types are present in a single unified chronological list.
- Each event shows its source type (icon or label), timestamp, and description.

---

### TC-RDV-428 — Incident timeline events appear in chronological order

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Timeline (rfd-031) |
| **Requirement Ref** | INC-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-010 has the following events recorded in the database (not necessarily in insert order):
  1. Alert fired at 10:00 UTC
  2. Incident created at 10:02 UTC
  3. Team notified (manual) at 10:08 UTC
  4. Fix deployed (deployment event) at 10:25 UTC
  5. Incident resolved (status change) at 10:35 UTC

**Test Data:**
- Incident INC-010, 5 timeline events at timestamps above

**Steps:**
1. Navigate to DevOps → Incidents → INC-010 → Timeline tab.
2. Read the events from top to bottom.

**Expected Result:**
- Events are displayed in ascending chronological order: Alert fired (10:00) → Incident created (10:02) → Team notified (10:08) → Fix deployed (10:25) → Incident resolved (10:35).
- No event appears out of sequence.

---

### TC-RDV-429 — Add manual entry to incident timeline via UI form

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Timeline (rfd-031) |
| **Requirement Ref** | INC-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-011 is open and has `manage_incidents` permission for current user.

**Test Data:**
- Manual entry text: "Notified on-call lead via PagerDuty at 11:15 UTC"

**Steps:**
1. Navigate to DevOps → Incidents → INC-011 → Timeline tab.
2. Click "Add Entry" or "Add Manual Event" button.
3. Enter text "Notified on-call lead via PagerDuty at 11:15 UTC".
4. Click "Save".

**Expected Result:**
- The manual entry appears in the timeline immediately after saving.
- Entry type is labeled "Manual" (or similar distinguishing label).
- The entry timestamp matches the time of submission or the time entered.
- A record is inserted into `redmineflux_devops_incident_events` with source type "manual".

---

### TC-RDV-430 — Incident timeline accessible via REST API endpoint

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Timeline (rfd-031) |
| **Requirement Ref** | INC-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-012 exists with 3 timeline events.
- API key for a user with `view_devops` permission is available.

**Test Data:**
- API key: `abc123devopskey`
- Incident ID: INC-012 (Redmine issue ID 55)

**Steps:**
1. Send HTTP GET request: `GET /devops/incidents/55/timeline.json` with header `X-Redmine-API-Key: abc123devopskey`.
2. Inspect the JSON response.

**Expected Result:**
- HTTP 200 response.
- JSON body contains an array of timeline event objects, each with fields: `id`, `event_type`, `description`, `occurred_at`, `source`.
- Events are ordered chronologically.
- Without the API key, the same request returns HTTP 401 or 403.

---

### TC-RDV-431 — IncidentDeployCorrelator auto-links most recent deployment within time window

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident–Deployment Correlation (rfd-094) |
| **Requirement Ref** | INC-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployment v1.4.9 was deployed to production at 2026-05-21 09:40 UTC (status: success).
- Correlation time window configured to 60 minutes.
- Incident INC-013 is created at 2026-05-21 10:05 UTC (25 minutes after the deployment).

**Test Data:**
- Deployment: v1.4.9, environment: production, deployed_at: 09:40 UTC
- Incident created_at: 10:05 UTC, correlation window: 60 minutes

**Steps:**
1. A Prometheus alert fires at 10:05 UTC, auto-creating incident INC-013.
2. Navigate to DevOps → Incidents → INC-013.
3. Observe the "Related Deployment" section.

**Expected Result:**
- The "Related Deployment" section shows deployment v1.4.9 automatically correlated.
- The `related_deployment_id` foreign key on the incident record references the v1.4.9 deployment.
- No manual action was required to create this link.

---

### TC-RDV-432 — IncidentDeployCorrelator does not link deployment outside time window

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident–Deployment Correlation (rfd-094) |
| **Requirement Ref** | INC-003 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Deployment v1.3.0 was deployed to production at 2026-05-20 08:00 UTC (>24 hours before incident).
- Correlation time window configured to 60 minutes.
- Incident INC-014 created at 2026-05-21 10:00 UTC.

**Test Data:**
- Deployment: v1.3.0, deployed_at: 2026-05-20 08:00 UTC
- Incident created_at: 2026-05-21 10:00 UTC, correlation window: 60 minutes

**Steps:**
1. Create incident INC-014 at 2026-05-21 10:00 UTC.
2. Navigate to DevOps → Incidents → INC-014.
3. Observe the "Related Deployment" section.

**Expected Result:**
- The "Related Deployment" section shows no auto-linked deployment (or shows "None").
- `related_deployment_id` is NULL on the incident record.
- No deployment outside the configured time window is linked.

---

### TC-RDV-433 — Manual override of auto-correlated deployment

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident–Deployment Correlation (rfd-094) |
| **Requirement Ref** | INC-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-015 was auto-correlated to deployment v1.4.9.
- Deployment v1.4.8 exists (deployed 2 hours before incident, outside auto-window) and is the actual root cause.
- User has `manage_incidents` permission.

**Test Data:**
- Auto-linked deployment: v1.4.9 (ID: 88)
- Correct deployment: v1.4.8 (ID: 87)

**Steps:**
1. Navigate to DevOps → Incidents → INC-015.
2. Observe the "Related Deployment" section showing v1.4.9.
3. Click "Override" or "Change Deployment".
4. Select deployment v1.4.8 from the list.
5. Click "Save Override".

**Expected Result:**
- The "Related Deployment" section now shows v1.4.8.
- `related_deployment_id` on the incident record is updated to the ID of v1.4.8.
- A timeline event or audit entry records the manual override.

---

### TC-RDV-434 — Post-mortem creates a Redmine wiki page

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Post-Mortem Template (rfd-095) |
| **Requirement Ref** | INC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-016 is resolved (status: Resolved, resolved_at set).
- User has `manage_incidents` permission.
- Project wiki is enabled.

**Test Data:**
- Incident: INC-016, title "API gateway overload", SEV2, resolved at 2026-05-21 11:30 UTC

**Steps:**
1. Navigate to DevOps → Incidents → INC-016.
2. Click "Create Post-Mortem" button.
3. Observe the result.

**Expected Result:**
- A Redmine wiki page is created in the project wiki.
- Wiki page title follows the pattern "Incident-SEV2-2026-05-21" (or similar convention with incident ID/severity/date).
- The incident's `post_mortem_wiki_page_id` field is populated with the ID of the new wiki page.
- A success notification appears linking to the wiki page.

---

### TC-RDV-435 — Post-mortem wiki page is pre-filled with timeline, root cause, and action items

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Post-Mortem Template (rfd-095) |
| **Requirement Ref** | INC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-017 is resolved with: 4 timeline events, root_cause set to "Misconfigured rate limiter", timeline events recorded.
- Post-mortem has been generated via "Create Post-Mortem" button.

**Test Data:**
- Incident INC-017, root_cause: "Misconfigured rate limiter"

**Steps:**
1. Navigate to DevOps → Incidents → INC-017 → click "View Post-Mortem" link (or navigate to the generated wiki page).
2. Review the wiki page content.

**Expected Result:**
- Wiki page contains a section titled "Timeline" populated with the incident's timeline events in chronological order.
- Wiki page contains a section titled "Root Cause" pre-filled with "Misconfigured rate limiter".
- Wiki page contains a section titled "Action Items" (may be blank or have placeholder text).
- All three sections are present in the template.

---

### TC-RDV-436 — Versioned post-mortem regeneration appends -v2, -v3 suffix

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Post-Mortem Template (rfd-095) |
| **Requirement Ref** | INC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-018 already has a post-mortem wiki page "Incident-SEV1-2026-05-21" (v1).
- The root cause was updated after initial post-mortem creation.
- User clicks "Regenerate Post-Mortem".

**Test Data:**
- Incident INC-018, existing wiki page: "Incident-SEV1-2026-05-21"

**Steps:**
1. Navigate to DevOps → Incidents → INC-018.
2. Click "Regenerate Post-Mortem".
3. Navigate to the project wiki.
4. Repeat step 2 a second time.

**Expected Result:**
- First regeneration creates a new wiki page "Incident-SEV1-2026-05-21-v2"; original "Incident-SEV1-2026-05-21" remains unchanged.
- Second regeneration creates "Incident-SEV1-2026-05-21-v3".
- No prior version is overwritten or deleted.
- `post_mortem_wiki_page_id` is updated to point to the latest version (v3).

---

### TC-RDV-437 — post_mortem_wiki_page_id is stored on the incident record

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Post-Mortem Template (rfd-095) |
| **Requirement Ref** | INC-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-019 has had a post-mortem generated.

**Test Data:**
- Incident INC-019

**Steps:**
1. Generate a post-mortem for INC-019 via the "Create Post-Mortem" button.
2. Check the incident record via the REST API: `GET /devops/incidents/INC-019.json`.

**Expected Result:**
- The API response JSON includes a `post_mortem_wiki_page_id` field with a non-null integer value.
- Navigating to the incident detail page shows a "View Post-Mortem" link (confirming the ID is stored and used).

---

### TC-RDV-438 — Escalation timeout configured per severity in project settings

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_devops_settings` permission.
- Project "Phoenix Platform" DevOps settings page is accessible.

**Test Data:**
- SEV1 timeout: 10 minutes
- SEV2 timeout: 30 minutes
- SEV3 timeout: 60 minutes
- SEV4 timeout: 240 minutes

**Steps:**
1. Navigate to Project Settings → DevOps → Escalation Rules.
2. Set SEV1 timeout to 10 minutes.
3. Set SEV2 timeout to 30 minutes.
4. Set SEV3 timeout to 60 minutes.
5. Set SEV4 timeout to 240 minutes.
6. Click "Save".

**Expected Result:**
- Settings are saved successfully.
- On returning to the Escalation Rules page, all four timeout values are displayed as set.
- Configuration is persisted per-project (not globally).

---

### TC-RDV-439 — DevopsIncidentEscalatorJob fires when incident not acknowledged within timeout

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- SEV2 escalation timeout set to 30 minutes.
- Incident INC-020 (SEV2) was created 35 minutes ago and has not been acknowledged (acknowledged_at is NULL).
- `DevopsIncidentEscalatorJob` background job is running.

**Test Data:**
- Incident INC-020, severity SEV2, created 35 minutes ago, acknowledged_at: NULL

**Steps:**
1. Wait for the scheduled `DevopsIncidentEscalatorJob` to run (or trigger manually in a test environment).
2. Navigate to DevOps → Incidents → INC-020.
3. Observe escalation status.

**Expected Result:**
- The incident's `escalated_at` timestamp is set.
- `escalation_level` is incremented to 1.
- A notification or assignment is triggered as per escalation configuration.
- A timeline event is added: "Incident escalated to level 1".

---

### TC-RDV-440 — Escalation does not fire when incident is acknowledged within timeout

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- SEV2 escalation timeout set to 30 minutes.
- Incident INC-021 (SEV2) was acknowledged 10 minutes after creation (acknowledged_at set within timeout window).

**Test Data:**
- Incident INC-021, severity SEV2, acknowledged_at set 10 minutes after creation

**Steps:**
1. Allow the `DevopsIncidentEscalatorJob` to run past the 30-minute mark.
2. Navigate to DevOps → Incidents → INC-021.

**Expected Result:**
- `escalation_level` remains 0 (no escalation occurred).
- `escalated_at` is NULL.
- No escalation timeline event is added.
- The incident is NOT auto-assigned via the escalation path.

---

### TC-RDV-441 — Escalation level increments monotonically

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- SEV1 escalation configured for multiple levels (timeout 10 min each level).
- Incident INC-022 (SEV1) remains unacknowledged through multiple escalation cycles.

**Test Data:**
- Incident INC-022, severity SEV1

**Steps:**
1. Create incident INC-022 (SEV1) and do not acknowledge it.
2. After 10 minutes: first `DevopsIncidentEscalatorJob` run.
3. After 20 minutes: second job run.
4. After 30 minutes: third job run.
5. Check `escalation_level` after each run.

**Expected Result:**
- After first run: `escalation_level` = 1.
- After second run: `escalation_level` = 2.
- After third run: `escalation_level` = 3.
- Escalation level only ever increases; it never decreases or resets unexpectedly.

---

### TC-RDV-442 — Escalation auto-assigns linked issue

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- SEV2 escalation configured with target user "on-call-lead@company.com" (Redmine user: Carol).
- Incident INC-023 (SEV2) is unacknowledged after the timeout.

**Test Data:**
- Incident INC-023, escalation target user: Carol (ID: 42)

**Steps:**
1. Allow `DevopsIncidentEscalatorJob` to fire for incident INC-023.
2. Navigate to DevOps → Incidents → INC-023.
3. Check the incident's "Assigned To" field.

**Expected Result:**
- The incident is auto-assigned to Carol after escalation.
- A journal entry appears on the linked Redmine issue: "Assigned to Carol via escalation (level 1)".
- Carol receives a Redmine notification about the assignment.

---

### TC-RDV-443 — Four default communication templates are seeded at installation

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Plugin freshly installed or templates seeded via rake task.

**Test Data:**
- N/A (seeded data)

**Steps:**
1. Navigate to DevOps → Incidents → Communication Templates (or Settings → Communication Templates).
2. List all available templates.

**Expected Result:**
- Exactly 4 default templates are present: "Initial detection", "Investigating", "Mitigated", "Resolved".
- Each template has a name, subject, and body pre-filled.
- Templates are listed and accessible without any manual creation.

---

### TC-RDV-444 — Communication template variable substitution works correctly

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-024 exists with: title="Payment API Down", severity=SEV1, started_at=2026-05-21 14:00 UTC, status=Open, affected_service="Payment API", eta="2026-05-21 15:00 UTC".
- "Initial detection" template body: "Incident: {{title}}. Severity: {{severity}}. Started: {{started_at}}. Service: {{affected_service}}. ETA: {{eta}}."

**Test Data:**
- Template variables: `{{title}}`, `{{severity}}`, `{{started_at}}`, `{{status}}`, `{{affected_service}}`, `{{eta}}`

**Steps:**
1. Navigate to DevOps → Incidents → INC-024.
2. Click "Send Update" and select "Initial detection" template.
3. Review the preview before sending.

**Expected Result:**
- Preview shows: "Incident: Payment API Down. Severity: SEV1. Started: 2026-05-21 14:00 UTC. Service: Payment API. ETA: 2026-05-21 15:00 UTC."
- All six variables (`{{title}}`, `{{severity}}`, `{{started_at}}`, `{{status}}`, `{{affected_service}}`, `{{eta}}`) are substituted with actual incident values.
- No raw `{{variable}}` placeholders remain in the preview.

---

### TC-RDV-445 — Communication template dispatches via email, Slack, and Teams

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-025 exists.
- Email, Slack, and Teams integrations are configured in plugin settings.
- "Investigating" template is available.

**Test Data:**
- Incident INC-025, template: "Investigating"

**Steps:**
1. Navigate to DevOps → Incidents → INC-025.
2. Click "Send Update" → select "Investigating" template.
3. Click "Send".
4. Check email inbox, Slack channel, and Teams channel.

**Expected Result:**
- Email is delivered to the configured incident notification recipients.
- Slack message appears in the configured Slack channel.
- Microsoft Teams message appears in the configured Teams channel.
- All three channels receive the same (substituted) message content.

---

### TC-RDV-446 — Sending communication template appends journal entry to incident

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-026 exists.
- "Mitigated" template is available.

**Test Data:**
- Incident INC-026, template: "Mitigated"

**Steps:**
1. Navigate to DevOps → Incidents → INC-026.
2. Click "Send Update" → select "Mitigated" template.
3. Click "Send".
4. Navigate to the incident's activity/journal section.

**Expected Result:**
- A journal entry is added to the incident immediately after sending.
- Journal entry content indicates: "Status update sent via 'Mitigated' template" (or similar).
- The journal entry includes the timestamp of the send action.
- The `IncidentCommunicator` service's journal append behavior is confirmed.

---

### TC-RDV-447 — Duplicate template name within same project is rejected

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A communication template named "Initial detection" already exists in project "Phoenix Platform".

**Test Data:**
- Duplicate template name: "Initial detection", project: "Phoenix Platform"

**Steps:**
1. Navigate to DevOps → Incidents → Communication Templates → New Template.
2. Enter name "Initial detection" (exact duplicate).
3. Enter any body text.
4. Click "Save".

**Expected Result:**
- Save is rejected with a validation error: "Name has already been taken" (or equivalent).
- No duplicate record is created in `redmineflux_devops_incident_comm_templates`.
- The unique index on `(project_id, name)` prevents the duplicate at the database level.

---

### TC-RDV-448 — Creating duplicate template name across different projects succeeds

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Template "Initial detection" exists in project "Phoenix Platform" (ID: 1).
- Project "Backend Services" (ID: 2) has no templates.

**Test Data:**
- Template name: "Initial detection", project: "Backend Services"

**Steps:**
1. Navigate to project "Backend Services" → DevOps → Communication Templates → New Template.
2. Enter name "Initial detection".
3. Save.

**Expected Result:**
- Template is created successfully in "Backend Services".
- No validation error is shown.
- The unique constraint is scoped per-project; same name in different projects is allowed.

---

### TC-RDV-449 — Negative: create incident without title shows validation error

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- User has `manage_incidents` permission.

**Test Data:**
- Title: (blank), Severity: SEV2, Affected Service: "API Gateway"

**Steps:**
1. Navigate to DevOps → Incidents → New Incident.
2. Leave the "Title" field blank.
3. Select severity SEV2.
4. Enter affected service "API Gateway".
5. Click "Create Incident".

**Expected Result:**
- Incident is not created.
- Validation error is shown on the form: "Title can't be blank" (or equivalent).
- User remains on the new incident form with other fields still populated.

---

### TC-RDV-450 — Negative: close incident without resolved_at results in MTTR showing N/A

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Incident INC-027 exists in "Resolved" status but the `resolved_at` timestamp was not set (e.g., manually forced via direct status change without setting resolution time).

**Test Data:**
- Incident INC-027, status: Resolved, resolved_at: NULL

**Steps:**
1. Navigate to DevOps → Incidents tab.
2. Locate incident INC-027 in the list.
3. Observe the MTTR column for INC-027.

**Expected Result:**
- MTTR column shows "N/A" (not a calculated value, not a zero, not an error).
- No exception is raised in the application.
- The incident still appears in the list; only MTTR is undefined.

---

### TC-RDV-451 — Negative: unknown template variable passed through literally without error

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- A custom template named "Custom Alert" contains the body: "Alert: {{title}} — Contact: {{unknown_var}} for details."
- Incident INC-028 exists.

**Test Data:**
- Template body with `{{unknown_var}}` variable, incident INC-028

**Steps:**
1. Navigate to DevOps → Incidents → INC-028.
2. Click "Send Update" → select "Custom Alert" template.
3. Review the preview.

**Expected Result:**
- `{{title}}` is substituted with the incident title.
- `{{unknown_var}}` is passed through literally: the preview shows "Contact: {{unknown_var}} for details."
- No error, exception, or warning is shown.
- The message can be sent as-is (with the literal placeholder text remaining).

---

### TC-RDV-452 — Permission: Developer without manage_incidents cannot create incident

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "David" has the "Developer" role in project "Phoenix Platform".
- The Developer role does NOT have the `manage_incidents` permission enabled.

**Test Data:**
- User: David (Developer role, no manage_incidents permission)

**Steps:**
1. Log in as David.
2. Navigate to DevOps → Incidents tab.
3. Attempt to find and click "New Incident" button.

**Expected Result:**
- The "New Incident" button is not visible to David.
- If David navigates directly to the new incident URL, a 403 Forbidden response is returned.
- David can still view the Incidents list (view_devops permission is granted to Developer role).

---

### TC-RDV-453 — MTTR is auto-calculated when incident is resolved

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-029 was created (started_at) at 2026-05-21 10:00 UTC.
- User resolves the incident at 2026-05-21 11:35 UTC (setting resolved_at).

**Test Data:**
- started_at: 10:00 UTC, resolved_at: 11:35 UTC, expected MTTR: 95 minutes

**Steps:**
1. Navigate to DevOps → Incidents → INC-029.
2. Change status to "Resolved" and set resolved_at to 11:35 UTC.
3. Save the incident.
4. Return to the Incidents list.

**Expected Result:**
- MTTR column for INC-029 shows "95 minutes" (or "1 hour 35 minutes").
- MTTR is calculated as: resolved_at − started_at.
- The calculated MTTR feeds into the DORA MET-004 dashboard widget.

---

### TC-RDV-454 — Incident list empty state shows informative message

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030) |
| **Requirement Ref** | INC-001 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Project "New Project" has the DevOps module enabled but no incidents have been created.

**Test Data:**
- N/A

**Steps:**
1. Navigate to the "New Project" → DevOps → Incidents tab.

**Expected Result:**
- The page does not show a blank screen or unformatted empty space.
- An empty state message is displayed, such as "No incidents recorded. Click 'New Incident' to create your first incident."
- The "New Incident" button is still accessible (for users with the correct permission).

---

### TC-RDV-455 — Alert auto-creates incident with correct tracker and priority

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Tracker (rfd-030), Alert Auto-Create (rfd-027) |
| **Requirement Ref** | INC-001, MON-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Prometheus AlertManager is configured with the Redmine DevOps webhook URL.
- Alert severity threshold for auto-incident creation is set to "critical".
- Project "Phoenix Platform" has Incident tracker configured.

**Test Data:**
- Alert: title="High CPU on prod-db-01", severity=critical, source=Prometheus

**Steps:**
1. Simulate a Prometheus alert POST to `/devops/webhook/prometheus/phoenix-platform` with severity "critical".
2. Navigate to DevOps → Incidents tab.

**Expected Result:**
- A new incident is automatically created with:
  - Tracker: "Incident"
  - Priority: "Urgent"
  - Title: "High CPU on prod-db-01" (or similar from alert title)
  - Severity: SEV1 (mapped from "critical" alert severity)
- The linked alert appears in the incident's "Linked Alerts" section.

---

### TC-RDV-456 — Incident timeline REST API requires authentication

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Timeline (rfd-031) |
| **Requirement Ref** | INC-002 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Incident INC-030 exists.

**Test Data:**
- Incident ID: INC-030 (Redmine issue ID: 60)

**Steps:**
1. Send HTTP GET request `GET /devops/incidents/60/timeline.json` with no authentication header.
2. Observe the response.

**Expected Result:**
- HTTP 401 or 403 response is returned.
- No timeline data is exposed in the response body.
- Unauthenticated access is blocked for all DevOps REST API endpoints.

---

### TC-RDV-457 — Incident communication template sends all six supported variables

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Incident Communication Templates (rfd-119) |
| **Requirement Ref** | INC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Incident INC-031 has all fields populated: title, severity, started_at, status, affected_service, eta.
- A custom template uses all six variables in its body.

**Test Data:**
- Template body: "{{title}} | {{severity}} | {{started_at}} | {{status}} | {{affected_service}} | {{eta}}"
- Incident values: title="Cache Miss Storm", severity=SEV2, started_at="14:00 UTC", status=Investigating, affected_service="Cache Layer", eta="15:30 UTC"

**Steps:**
1. Navigate to DevOps → Incidents → INC-031.
2. Click "Send Update" and select the custom template.
3. Review the preview output.

**Expected Result:**
- Preview shows: "Cache Miss Storm | SEV2 | 14:00 UTC | Investigating | Cache Layer | 15:30 UTC"
- All 6 variables are substituted; none remain as raw placeholders.

---

### TC-RDV-458 — Post-mortem not created for unresolved incident

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Post-Mortem Template (rfd-095) |
| **Requirement Ref** | INC-004 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Incident INC-032 is in "Open" status (not resolved).

**Test Data:**
- Incident INC-032, status: Open

**Steps:**
1. Navigate to DevOps → Incidents → INC-032.
2. Observe whether the "Create Post-Mortem" button is available or disabled.
3. If available, attempt to click it.

**Expected Result:**
- "Create Post-Mortem" button is either not visible or is disabled/grayed out while the incident is unresolved.
- If the button is clicked, an error message appears: "Post-mortem cannot be created for an unresolved incident" (or similar).
- No wiki page is created.

---

### TC-RDV-459 — Full incident lifecycle workflow end-to-end

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | rfd-030, rfd-031, rfd-094, rfd-095, rfd-096, rfd-119 |
| **Requirement Ref** | INC-001, INC-002, INC-003, INC-004, INC-005, INC-006 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Prometheus AlertManager webhook configured.
- Deployment v1.4.9 deployed to production 15 minutes before the alert fires.
- SEV1 escalation timeout: 10 minutes.
- On-call user configured: "Alice".
- Project wiki enabled.

**Test Data:**
- Alert: "API error rate > 10%", severity: critical
- Deployment v1.4.9, deployed at T-15 minutes
- Template: "Initial detection"

**Steps:**
1. Prometheus alert fires → webhook received → alert appears in Alerts feed.
2. Verify auto-incident INC-033 (SEV1) is created with tracker "Incident" and priority "Urgent".
3. Verify deployment v1.4.9 is auto-correlated to INC-033 (within 60-minute window).
4. Wait 10 minutes without acknowledging → `DevopsIncidentEscalatorJob` fires → verify escalation_level = 1, Alice auto-assigned.
5. Alice acknowledges the incident (sets acknowledged_at) → escalation timer stops.
6. Send "Initial detection" communication template → verify email + Slack delivered + journal entry added.
7. Deploy hotfix v1.4.10 → timeline event "Fix deployed" appears.
8. Set incident status to Resolved, set resolved_at.
9. Verify MTTR is calculated and displayed in the Incidents list.
10. Click "Create Post-Mortem" → verify wiki page created with timeline, root cause, and action items sections.

**Expected Result:**
- Each step produces the expected system response as described.
- The incident progresses through the full lifecycle: alert → auto-incident → escalation → acknowledgement → communication → fix → resolution → MTTR → post-mortem.
- All six INC requirements (INC-001 through INC-006) are exercised in a single flow.

---

### TC-RDV-460 — Escalation level cannot be reset or decremented

| Field | Value |
|-------|-------|
| **Module** | Incident Management |
| **Feature** | Escalation Rules (rfd-096) |
| **Requirement Ref** | INC-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Incident INC-034 (SEV1) has escalation_level = 2 after two escalation rounds.
- A user with `manage_incidents` permission attempts to manually update the incident.

**Test Data:**
- Incident INC-034, current escalation_level: 2

**Steps:**
1. Navigate to DevOps → Incidents → INC-034.
2. Attempt to edit the incident record and set escalation_level to 0 or 1 via the UI or API.
3. Save the change.

**Expected Result:**
- Escalation level cannot be set to a lower value via the UI (field is read-only or auto-managed).
- If attempted via the REST API with a lower value, the system either rejects it with a validation error or silently ignores the downgrade.
- `escalation_level` in the database remains at 2 (monotonically non-decreasing behavior enforced).
