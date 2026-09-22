# Test Cases — Redmineflux MCP — Read & Write Tool Operations

> Source: vendor KB — "How Redmineflux MCP Works", "How To: Use MCP Tools in a Conversation" (the example command
> set), "Plugin Tools Overview", Troubleshooting, FAQ Q4 (custom fields), Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux MCP Server (hosted)
- MCP server version: (record via `redmineflux_system_version`)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mcp_qa

## Methodology — the rule that governs this suite

**Every result must be verified in Redmine itself**, not in the assistant's reply. The AI formats the server's
response into prose, so a confident, well-formatted answer is not evidence that the underlying call did what it
said. Read cases are checked against the Redmine UI; write cases are checked by opening the created or changed
record.

The two failure modes this is designed to catch:

- **A reported action that did not happen** — the assistant says an issue was created and no issue exists.
- **An action that happened differently from what was reported** — right issue, wrong project, wrong assignee, or
  a silently dropped field.

> **Never run the write cases against a production Redmine.**

---

## Functional Cases — Read operations

---

### TC-RFM-049: List projects

**User Role:** MCP user with a scoped key
**Steps:**
1. Ask *"Show me my Redmine projects"*.
2. Compare against the project list in the Redmine UI **as that same user**.

**Expected Result:**
- Exactly the projects that user can see — no more and no fewer.

---

### TC-RFM-050: List issues with a filter

**User Role:** MCP user
**Steps:**
1. Ask *"Show all open bugs in the <project> project"*.
2. Run the equivalent filter in the Redmine issue list.

**Expected Result:**
- The same set of issues. Counts and IDs match.

---

### TC-RFM-051: Critical issues query

**User Role:** MCP user
**Steps:**
1. Ask *"What are my critical issues today?"*.

**Expected Result:**
- The result is explainable — record what "critical" and "today" resolve to (priority, due date, assignee) so the
  answer can be reproduced as a Redmine query. **An unreproducible answer is not a usable one**, and this is a
  headline example in the KB.

---

### TC-RFM-052: Time entry reporting

**User Role:** MCP user
**Steps:**
1. Ask *"Show time entries for the past week in the <project> project"*.
2. Compare against Redmine's spent-time report for the same range.

**Expected Result:**
- Hours and entries match, and the date range boundaries are inclusive in the same way.

---

### TC-RFM-053: Agile board read

**User Role:** MCP user
**Preconditions:** Agile Board plugin installed.
**Steps:**
1. Ask *"Show the agile board for project <identifier>"* and *"List all sprints in the <project> project"*.

**Expected Result:**
- Columns, cards and sprints match the board in the UI.

---

### TC-RFM-054: Workload read

**User Role:** MCP user
**Preconditions:** Workload plugin installed.
**Steps:**
1. Ask *"Who is over-allocated this week?"* and *"Show capacity for the <team> team"*.

**Expected Result:**
- The figures match the Workload plugin's own capacity calculations for the same period.

---

### TC-RFM-055: Helpdesk read

**User Role:** MCP user
**Preconditions:** Helpdesk plugin installed.
**Steps:**
1. Ask *"List all open support tickets"* and *"Show SLA status for ticket #<id>"*.

**Expected Result:**
- Ticket list and SLA state match the Helpdesk UI.

---

### TC-RFM-056: Knowledge Base and checklist reads

**User Role:** MCP user
**Preconditions:** Those plugins installed.
**Steps:**
1. Ask *"List all spaces in the knowledge base"* and for an issue's checklists.

**Expected Result:**
- Both match the UI — **and respect page-visibility rules**: an unpublished KB draft must not be returned to a
  user who cannot see it in the UI (see the Knowledge Base suite's visibility matrix).

---

### TC-RFM-057: Responses are formatted, not raw JSON

**User Role:** MCP user
**Steps:**
1. Inspect several responses.

**Expected Result:**
- Readable formatted output, per the documented flow — not a raw API dump the user has to interpret.

---

### TC-RFM-058: Large result sets

**User Role:** MCP user
**Steps:**
1. Ask for a list with hundreds of matches.

**Expected Result:**
- Results are paginated or summarised rather than truncated silently.
- **A truncated list presented as complete is worse than an error**, because the user acts on it believing it is
  the whole answer. Record whether any truncation is disclosed.

---

## Functional Cases — Write operations

---

### TC-RFM-059: Create an issue

**User Role:** MCP user with `add_issues`
**Steps:**
1. Ask *"Create a new issue: 'Fix login timeout' in the <project> project, assign to <user>"*.
2. **Open the issue in Redmine.**

**Expected Result:**
- It exists with exactly the subject, project and assignee requested, authored by the key's user.
- The issue appears in the normal issue list and is journaled as a normal creation.

---

### TC-RFM-060: Update an issue

**User Role:** MCP user with `edit_issues`
**Steps:**
1. Ask *"Update issue #<id> status to In Progress"*.
2. Open the issue.

**Expected Result:**
- The status changed and a journal entry records it with the key's user as the actor — **attribution matters**,
  since an AI-performed change must still be traceable to a person.

---

### TC-RFM-061: Workflow rules are honoured on write

**User Role:** MCP user on a restricted-workflow role
**Steps:**
1. Ask for a status transition the workflow forbids for that user.

**Expected Result:**
- Refused, with the reason reported clearly.
- **The MCP path must not bypass the workflow.** It calls the REST API, so this should hold — but it is the
  cheapest way to find out whether writes go through Redmine's own validation or around it.

---

### TC-RFM-062: Required fields are enforced

**User Role:** MCP user
**Steps:**
1. Ask to create an issue on a tracker with required custom fields, without supplying them.

**Expected Result:**
- Either the assistant is told which fields are required, or creation is refused.
- **An issue created through MCP that Redmine's own form would reject is a data-integrity defect** — such records
  surface later as unsaveable issues.

---

### TC-RFM-063: Log time

**User Role:** MCP user with `log_time`
**Steps:**
1. Ask *"Log 2.5 hours on issue #<id> for development"*.
2. Check the issue's spent time and the user's time entries.

**Expected Result:**
- A time entry of exactly 2.5 hours, on the right issue, activity and user, dated as expected.
- **Confirm the hours precisely** — a rounding or unit error here silently corrupts billing and timesheet data
  downstream (see the Invoice and Timesheet suites).

---

### TC-RFM-064: Agile board write

**User Role:** MCP user with the board permissions
**Steps:**
1. Ask *"Move issue #<id> to Done column"* and *"Create a sprint named 'Sprint 5' for 2 weeks"*.
2. Verify on the board and in Sprint management.

**Expected Result:**
- The card moved and the issue's status actually changed; the sprint exists with correct dates.
- A card that moves on the board while the issue's status did not change is the Agile plugin's central defect
  class, and MCP is another path into it.

---

### TC-RFM-065: Timesheet approval

**User Role:** MCP user with `approve_timesheets`
**Preconditions:** A submitted timesheet awaiting the user's approval level.
**Steps:**
1. Ask *"Approve timesheet for user <name>"*.
2. Verify in the Timesheet plugin's approval records and audit log.

**Expected Result:**
- The approval is recorded at the correct level, attributed to the key's user, and **the sequential approval rules
  still apply** — the approver cannot skip a level or approve out of order via MCP.
- **This is the highest-stakes write in the tool set.** Approving a timesheet is a governance action with
  financial consequence; if MCP can perform it outside the schema's rules, the entire multi-level approval design
  is bypassable by asking for it in plain English.

---

### TC-RFM-066: Helpdesk write

**User Role:** MCP user with `manage_helpdesk`
**Steps:**
1. Ask *"Create a new ticket from customer@example.com"*.
2. Verify the ticket, its customer association and whether an SLA attached.

**Expected Result:**
- Created correctly. Note that in this repo's experience only a customer-raised ticket attaches an SLA, so record
  what MCP-created tickets actually do rather than assuming.

---

### TC-RFM-067: Knowledge Base write

**User Role:** MCP user with the KB permissions
**Steps:**
1. Ask *"Create a new KB page titled 'API Setup Guide' in the Dev space"*.

**Expected Result:**
- The page is created in **draft**, matching the plugin's own lifecycle — an MCP-created page must not arrive
  published, since publishing notifies users and changes visibility.

---

### TC-RFM-068: Checklist write

**User Role:** MCP user with `edit_issues`
**Steps:**
1. Ask to add a checklist to an issue and to mark its items done.

**Expected Result:**
- Both reflected on the issue and in its checklist history.

---

### TC-RFM-069: Custom fields on write

**User Role:** MCP user
**Steps:**
1. Create and then update an issue supplying `custom_fields`, e.g. `[{"id": 5, "value": "Production"}]`.
2. Verify the stored values.

**Expected Result:**
- Values are stored correctly and validated — an invalid value for a list field is rejected rather than stored raw.
- FAQ Q4 states custom fields are fully supported, so a silently dropped custom field is a defect against a stated
  capability.

---

## Negative Cases

---

### TC-RFM-070: Permission errors are intelligible

**User Role:** MCP user lacking a permission
**Steps:**
1. Attempt an action the key's user cannot perform.

**Expected Result:**
- The documented *"You do not have permission"* style message, naming what is missing clearly enough to act on —
  the KB's troubleshooting tells the user to go and enable the specific permission, which only works if the
  message identifies it.

---

### TC-RFM-071: Non-existent records

**User Role:** MCP user
**Steps:**
1. Ask about issue #999999 and a non-existent project.

**Expected Result:**
- A clear not-found response.
- **The assistant must not invent an answer.** A fabricated issue summary for a non-existent ID is the most
  damaging possible failure of an AI integration, because it is indistinguishable from a real answer.

---

### TC-RFM-072: Ambiguous requests

**User Role:** MCP user
**Steps:**
1. Ask *"Update the login issue"* where several issues match.

**Expected Result:**
- The assistant asks for clarification or lists the candidates.
- **It must not silently pick one and write to it** — an ambiguous write that guesses is a data-integrity hazard,
  and the KB's own examples encourage exactly this loose phrasing.

---

### TC-RFM-073: Destructive operations

**User Role:** MCP user with `delete_issues`
**Steps:**
1. Ask to delete an issue.

**Expected Result:**
- Record whether any confirmation is sought before an irreversible deletion.
- **Deletion through a conversational interface has no undo and no confirmation dialog by default.** If a
  misheard or over-broad request can delete real issues in one step, that is a usability and safety finding worth
  raising — especially for a bulk phrasing such as "delete the closed issues in this project".

---

### TC-RFM-074: Transient error retry is bounded

**User Role:** MCP user
**Steps:**
1. Make Redmine intermittently unavailable and issue a request.

**Expected Result:**
- The retry the KB describes occurs, and then the call **fails cleanly** rather than hanging indefinitely.
- **Confirm a retried write is not applied twice.** An automatic retry on a create or a time-log entry that
  actually succeeded server-side would produce duplicate records — the classic retry hazard, and it applies
  directly to TC-RFM-059 and TC-RFM-063.

---

### TC-RFM-075: Concurrent writes

**User Role:** Two MCP users
**Steps:**
1. Both update the same issue at nearly the same moment through the assistant.

**Expected Result:**
- No lost update, or a clear conflict. Both changes are traceable in the issue journal.

---

### TC-RFM-076: Malformed or hostile content through MCP

**User Role:** MCP user
**Steps:**
1. Create an issue whose subject and description contain a script tag and markup.
2. View the issue in Redmine as another user.

**Expected Result:**
- Rendered as literal text by Redmine's own sanitiser. **No script executes.**
- Confirm MCP does not bypass Redmine's normal content handling — it calls the REST API, so this should hold, but
  it is worth establishing that the AI path is not a route around sanitisation.

---

### TC-RFM-077: Bulk operations

**User Role:** MCP user
**Steps:**
1. Ask for a broad multi-record change, e.g. *"Close all issues older than a year in this project"*.

**Expected Result:**
- Record exactly what happens. The scope is confirmed or reported before execution, and the result matches what
  was intended.
- **A single sentence can modify hundreds of records here.** Whether the assistant states the scope before acting
  is a real safety property of the integration, not a cosmetic one — and the absence of any such check belongs in
  the plugin memory file.

---

### TC-RFM-078: Data attribution and audit

**User Role:** MCP user
**Steps:**
1. After a set of MCP-driven changes, review the issue journals and any plugin audit logs.

**Expected Result:**
- Every change is attributed to the key's Redmine user.
- Record whether anything distinguishes an **MCP-originated** change from a UI one. If nothing does, an
  organisation cannot tell which of its records were written by an AI assistant — worth noting as a governance
  observation even though the KB does not promise it.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
