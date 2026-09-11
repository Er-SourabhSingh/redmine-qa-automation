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

### 4.3a Bug-report fields required at creation

For a **bug** write specifically, the write proposal in step 2 must cover every one of these before it's shown to the user:

- **Project** — fixed at `ztflux` (§1.1 rule), never asked for.
- **Subject/Title prefix** — the production issue's Subject must start with the local bug's own ID, exactly as it appears in the MD filename (`BUG-<CODE>-<NUMBER>`, e.g. `BUG-HLP-025`), followed by a colon and the descriptive title: `BUG-HLP-025: Submitting an Internal Note on a ticket crashes with a 500 error`. Never drop this prefix or invent a different production-side numbering — it's what ties the production issue back to the local `bugs/open/<BUG-ID>.md` file and its `_index.md` row.
- **Test Run name, Environment, Test Case ID** — supplied by the user at the time of reporting, not inferred, guessed, or picked from the local bug MD file on Claude's own judgment. Ask for any that are missing.
- **Priority and Severity** — set on the production issue, mapped from the local bug MD file's own Severity classification (Critical/High/Medium/Low). State the mapped value explicitly in the proposal so the user can correct it before approval.
- **Assignee** — always ask the user who the production issue should be assigned to. Never default, guess, or leave unassigned without asking first.
- **Attachments** — evidence must reach the production issue as a real, viewable attachment. **Known issue (found 2026-09-11):** embedding a raw screenshot inline into the Description field via redmineflux MCP renders as a blank/gray block on production instead of the actual image — do not rely on inline image embedding until this is confirmed fixed.
  - **Workaround — attach a generated PDF instead of a raw inline image:** generate a single-bug PDF from the local bug MD file (bug details + its screenshot(s) baked in as real rendered images, not a live embed reference) and attach that PDF as a normal file attachment. A PDF's images are flattened into the file itself, so this sidesteps the inline-embed rendering bug entirely — *provided the underlying file-upload/attach call itself works*, which should be confirmed (read-only check: does a previously-attempted screenshot attachment actually show up in that issue's Files list?) before relying on this as the standard path. If file upload itself turns out to be broken too, this workaround doesn't fix it and the MCP server bug needs fixing/reporting to `ztmcp` first.
  - Generation: `node scripts/gen_bug_pdf.js <path-to-bug-md> <out-pdf-path>` (implemented 2026-09-11, **switched to a pdfkit-based renderer the same day** — see below). Dependencies live in `scripts/package.json` (`npm install` inside `scripts/` once).
  - **Critical size constraint discovered 2026-09-11**: the `upload_file` tool requires the entire file as a literal base64 string typed into the tool call, and this has a **practical reliable ceiling well under 20KB of base64 text** (~15KB raw file) — pasting more silently truncates or produces an "invalid base64" error, even when the text is assembled correctly across multiple reads. The original implementation (Playwright/Chromium HTML-to-PDF via `page.pdf()`) always embeds a subsetted font file per distinct family/weight/style actually rendered (regular+bold+italic+monospace = up to 4 separate embedded fonts), inflating even a plain 3-page text-only bug report to 70-100KB — well past that ceiling. **Fixed by switching to `pdfkit`** (added to `scripts/package.json`), which renders using the PDF spec's Base-14 standard fonts (Helvetica/Helvetica-Bold/Courier) referenced by name and never embedded — the same bug report now comes out at 6-8KB, comfortably under the ceiling in one shot. The generator parses the bug MD with `marked.lexer()` and lays out headings/paragraphs/lists/code blocks/tables directly with pdfkit; it does not currently bake in screenshot images (most rake-task/server-side bugs have none, and re-adding images would reintroduce the same size problem — revisit if a bug with a screenshot needs this path again).
  - For any future large-file upload via this tool (a PDF, or anything else): **check the resulting `File size:` in the tool's own response matches the real source file size** before trusting the upload succeeded — a silent short-upload will still return a token and a (wrong, smaller) size with no error.
  - Output location: `bugs/pdf/<BUG-ID>.pdf` per plugin (sibling to `bugs/open/`/`bugs/closed/`), gitignored — it's a regenerable snapshot of the MD file's current state, not source of truth.
  - The local bug MD file (`bugs/open/<BUG-ID>.md`) is still attached alongside the PDF for traceability back to the plain-text source.
- **Description field structure** — the production issue's Description must carry the same structured sections as the local bug MD file, not a flattened paragraph or a bare title. At minimum, in this order:
  1. **Preconditions** (if the local bug file has any)
  2. **Steps to reproduce** (numbered list, verbatim from the local file)
  3. **Expected result**
  4. **Actual result**
  5. Environment / Redmine version / Browser / User role
  6. A note that full evidence (screenshot) is in the attached PDF — do not attempt to inline-embed the screenshot image directly into this text field (see the known issue above)
  Use the target field's native formatting (Redmine Textile/Markdown headers, numbered lists) so each section actually renders distinctly — don't collapse them into one run-on paragraph.

Do not proceed to the write proposal until all of the above are known — ask for whatever's missing (at minimum: Test Run, Environment, Test Case ID, Assignee) in one message.

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
> - Title: BUG-HLP-123: <descriptive title from the local bug file>
> - Project: ztflux
> - Environment: QA
> - Test Case: TC-123
> - Test Run: TR-456
> - Priority: High
> - Severity: High
> - Assignee: ? (please tell me who to assign this to)
> - Attachments: bugs/pdf/BUG-XXX.pdf (generated — bug detail + screenshot baked in), bugs/open/BUG-XXX.md
> - Description:
>   ```
>   h3. Preconditions
>   - ...
>
>   h3. Steps to reproduce
>   # ...
>   # ...
>
>   h3. Expected result
>   ...
>
>   h3. Actual result
>   ...
>
>   h3. Environment
>   Redmine version: ... | Environment: ... | Browser: ... | User role: ...
>
>   Full evidence (screenshot) is in the attached PDF.
>   ```
>
> I am ready to create this bug on the production Redmine server.
> **Do you approve creating it?**

Only after an explicit yes should the MCP write tool be called.

## 5. Security notes

- `.mcp.json` contains a live API key in plain text. If the folder is or becomes a git repository, add `.mcp.json` to `.gitignore` — do not commit it to a shared or public remote.
- If a key is ever exposed, revoke/regenerate it from the Redmine user's **My account** page.
