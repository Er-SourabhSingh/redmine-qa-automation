# Plugin Flow — Redmineflux MCP

## Flow 1: Workload Lifecycle

1. Admin or Workload Manager issues MCP prompt to create a workload with name, team, and date range.
2. MCP responds with workload ID and confirmation.
3. Issues are added to the workload one by one or in batch via MCP prompts.
4. Each issue is optionally assigned to a user with planned hours, allocation %, start date, end date.
5. Workload state is verified through Playwright: navigate to workload detail, confirm all assignments.
6. Hours or allocation are updated via MCP as scope changes; verified again via Playwright.
7. Issues are removed from workload via MCP when no longer needed.
8. Workload is deleted via MCP at end of cycle; Playwright confirms it no longer appears in the list.

## Flow 2: Workload Dashboard Read

1. User issues MCP prompt to retrieve dashboard for a team, user, project, or date range.
2. MCP returns dashboard data: allocation percentages, utilization summaries, issue counts.
3. Playwright navigates to the Workload Dashboard page.
4. Values shown in the UI (charts, counts, percentages) are compared against MCP response data.

## Flow 3: Team Management Lifecycle

1. Team Manager creates team via MCP; Playwright confirms team appears in Teams list.
2. Members are added with roles and permissions via MCP; Playwright verifies in team detail.
3. Permissions are updated (granted/revoked) via MCP; Playwright verifies permission checkboxes.
4. Members are removed via MCP; Playwright confirms they no longer appear.
5. Team is deleted via MCP; Playwright confirms it no longer appears in Teams list.

## Flow 4: Skill Assignment and Matrix

1. Admin creates skill via MCP; Playwright confirms skill appears in Skills list.
2. Skill is assigned to a user with a level via MCP; Playwright confirms in Skill Matrix.
3. Skill level is updated via MCP; Playwright verifies updated level in matrix.
4. Skill is removed from user via MCP; Playwright confirms cell is now empty.
5. Skill is deleted via MCP; Playwright confirms it no longer appears in Skills list or matrix column.

## Flow 5: Leave Request and Approval

1. User applies for leave via MCP with leave type, from date, to date.
2. MCP returns leave request ID and status = "Pending".
3. Playwright navigates to Leave Requests; verifies entry with Pending status.
4. Leave Approver issues MCP prompt to view pending approvals; confirms the request appears.
5. Leave Approver approves (or rejects) via MCP; Playwright verifies status badge updates.
6. User cancels their own leave via MCP (only if Pending); Playwright confirms Cancelled status.

## Flow 6: Holiday Schema Lifecycle

1. Admin creates holiday schema (region + year) via MCP; Playwright confirms in Administration > Holiday Schemas.
2. Individual holidays are added to the schema via MCP; Playwright verifies each holiday in schema detail.
3. A holiday is updated (name or date) via MCP; Playwright confirms the change.
4. A holiday is deleted via MCP; Playwright confirms it no longer appears.
5. Schema is deleted via MCP; Playwright confirms it no longer appears in the schemas list.

## Flow 7: Settings Management

1. Admin reads current plugin settings via MCP; response contains current configuration values.
2. Admin updates a specific setting via MCP; MCP response confirms the change.
3. Playwright navigates to Administration > Plugins > Configure (Redmineflux MCP).
4. Verifies the updated setting value is displayed correctly in the UI.
5. Admin resets settings to defaults via MCP; Playwright confirms default values are restored.

## Flow 8: Permission Enforcement

1. An operation is attempted via MCP by a user without the required permission.
2. MCP response contains an error message indicating access denied or insufficient permissions.
3. Playwright navigates to the relevant module.
4. Confirms no data was created, modified, or deleted as a result of the unauthorized attempt.
