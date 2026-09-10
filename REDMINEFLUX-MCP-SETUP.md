# Redmineflux MCP Server — Setup & Usage Guide

## 1. Overview

This project connects to Redmine through the **Redmineflux MCP server**, giving Claude direct read/write access to Redmine projects, issues, testcases, runs, defects, and related data via `mcp__redmineflux__*` tools.

| Item | Value |
|---|---|
| Redmine instance | `https://flux.zehntech.com` (**production**) |
| Default project | `ztflux` — used for QA / testcase-management work |
| MCP feedback project | `ztmcp` — used only for reporting bugs/feedback about the MCP server itself |
| Transport | HTTP |
| Auth | `X-Redmine-API-Key` header |

> **Note on "project":** the MCP server connection itself is not scoped to a single project — every tool call takes a `project_id` parameter. `ztflux` is simply the project this team defaults to when none is specified.

> **Rule — bug destination project:** All plugin-related production bugs (from any plugin under `plugins/`) must be created in the `ztflux` project on `flux.zehntech.com`. This is not a default that can be overridden per-plugin or per-session — every `redmineflux_testcases_management_report_defect` / bug-creation call must target `project_id` = `ztflux`, regardless of which plugin the bug was found in. `ztmcp` stays reserved for feedback about the MCP server itself, never for plugin bugs.

### 1.1 Workflow this MCP connection automates

`flux.zehntech.com` is the team's live project management / QA tool, used for the following bug lifecycle:

1. **QA creates a bug** on a feature ticket after finding a defect during testing.
2. **The developer resolves it** in the QA environment.
3. **QA retests** the resolved bug against the original feature ticket, and marks it accordingly (verified/reopened).

The Redmineflux MCP server is used to **automate this process** (searching tickets, preparing bug reports, retesting checks, status updates, etc.). Because this is a live production tool that the whole team relies on, **no step in this lifecycle may change data on the server until explicitly authorized** — see the approval policy in Section 4.

## 2. Configuration file

The server is defined in a **project-scoped** `.mcp.json` at the repository root:

```json
{
  "mcpServers": {
    "redmineflux": {
      "type": "http",
      "url": "https://flux.zehntech.com/mcp",
      "headers": {
        "X-Redmine-API-Key": "d8ff92a06082fbf9efc0adfead1616aa1ba7198d"
      }
    }
  }
}
```

Claude Code auto-detects this file when a session is opened with this folder as the working directory.

## 3. Setting this up in another project folder

1. **Create a `.mcp.json`** at the root of the new folder, using the JSON above.
2. Decide which Redmine instance it should talk to:
   - **Same production instance** (`flux.zehntech.com`) → copy the file as-is.
   - **A different instance** (e.g. a local Docker Redmine at `localhost:3010`, or another server) → change `url` to `http://<host>/mcp` and replace the API key with a key generated on *that* instance (Redmine → click your name → **My account** → **API access key** → *Show*).
3. **Open Claude Code in that folder** (`cd` there and start a session, or open it as the workspace root).
4. **Approve the server** — on first use, Claude Code prompts a one-time trust approval for the new project-scoped MCP server. Approve it.
5. **Verify the connection** — run `/mcp` and confirm `redmineflux` shows as connected, or make a simple read-only tool call (e.g., list projects).

## 4. ⚠️ Production Safety Policy — Write Approval Required

The Redmineflux MCP server here is connected to the **production** Redmine server. Because of that, a strict rule governs every session working against it:

> **No write operation is allowed without explicit user approval.**

### 4.1 Operations that require explicit approval

- Creating a Test Suite
- Creating a Test Case
- Creating a Test Run
- Selecting/assigning Test Cases to a Run
- Creating or changing an Environment association
- Assigning a Run to an Assignee
- Creating a Bug
- Updating a Bug
- Changing Bug status
- Reopening a Bug
- Closing/resolving a Bug
- Updating Bug percentage/done percentage
- Adding comments or notes to a Bug
- Updating Test Case/Test Run results
- Deleting any production record
- Any other operation that changes data on the production server

### 4.2 Read-only operations (no approval needed)

- Searching for existing Test Suites, Test Cases, Test Runs, Bugs
- Checking Bug status
- Checking Environment or Assignee information
- Reading production records
- Verifying whether a Test Suite or Test Case already exists

**Finding an existing record does not grant permission to modify it.**

### 4.3 Required approval workflow

Every production write follows this sequence:

1. **Investigate** — use read-only calls to establish current state.
2. **Prepare** — state exactly what will be created/changed, e.g.:

   > I found the existing Test Suite `XYZ`.
   > I am ready to create Test Case `TC-XXX` inside this Test Suite.
   > Shall I create it on the production server?

3. **Wait** — stop. Do not call the write tool until explicit approval is given.
4. **Execute** — only after explicit approval (e.g. "yes", "approved", "create it").
5. **Report** — after execution, state:
   - What was created/updated
   - Production ID
   - Relationship/linking information
   - Current status
   - Any important result or error

### 4.3a Bug-report fields supplied by the user

For a **bug** write specifically, the Test Run name, Environment, and Test Case ID are supplied by the user at the time of reporting — not inferred, guessed, or picked from the local bug MD file on Claude's own judgment. If the user hasn't given all three yet, ask for them before preparing the write proposal in step 2. `Project` is fixed at `ztflux` regardless (see §1.1 rule) and does not need to be supplied.

### 4.4 What does NOT count as approval

Statements like the following must **never** be treated as permission to write to production:

- "Create this testcase"
- "We need this bug"
- "This should be added"
- "Proceed with the workflow"
- "Update the status"

Only an explicit, specific confirmation after a prepared write proposal counts as approval. If there is any uncertainty, ask before writing.

### 4.5 Example

> I found a defect during TC-123 execution.
>
> I have prepared the bug details:
> - Title: ...
> - Project: ztflux
> - Environment: QA
> - Test Case: TC-123
> - Test Run: TR-456
>
> I am ready to create this bug on the production Redmine server.
> **Do you approve creating it?**

Only after an explicit yes should the MCP write tool be called.

## 5. Security notes

- `.mcp.json` contains a live API key in plain text. If the folder is or becomes a git repository, add `.mcp.json` to `.gitignore` — do not commit it to a shared or public remote.
- If a key is ever exposed, revoke/regenerate it from the Redmine user's **My account** page.
