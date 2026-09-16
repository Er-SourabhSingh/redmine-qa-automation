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

**Single-call creation, no attachments (updated 2026-09-15):** `redmineflux_core_create_issue` accepts `priority_id`, `assigned_to_id`, and `custom_fields` all as parameters on the *same* call — there is no need for separate `update_issue` calls afterward to set priority, assignee, or custom fields. **Do not attach the generated PDF or the local bug MD file at all** — per explicit instruction, creating a bug is now just **1 call**: `create_issue` with `project_id=ztflux`, the prefixed `subject`, a fully self-contained Textile-formatted `description`, `priority_id`, `assigned_to_id`, and `custom_fields`. No `upload_file` calls, no `uploads` parameter.

Why attachments were dropped: each `upload_file` call carries the same ~6-7 second fixed latency tax as any other redmineflux MCP call, so 2 attachments meant 2 extra calls (and extra wait) for every bug. It also turned out to be the less reliable path — see the corruption findings kept below for the record. Since the Description field is plain text sent inline with the single `create_issue` call (no separate upload, no base64, never observed to corrupt), **all bug detail now lives in the Description itself**, not in an attached file.

**Built-in Priority IDs on this instance** (from `list_priorities`, no lookup needed each time): `1=Low`, `2=Medium (default)`, `3=High`, `4=Blocker`.

**Known gap — custom field IDs unavailable:** the "Defect Type" / "Defect Severity" / "Defect priority" fields visible on existing issues (e.g. #120477) are *custom fields*, distinct from the built-in Priority above. Setting them via `custom_fields` requires each field's numeric ID, and `list_custom_fields` currently returns "You do not have permission to view custom fields" for this API key's account. Until resolved, these three fields cannot be set in the single `create_issue` call — either:
- ask a Redmine admin to grant this account permission to view custom fields, so the IDs can be looked up once and hardcoded here permanently, or
- get the numeric IDs directly from Redmine admin (**Administration → Custom fields** → open each field → ID is in the URL, e.g. `.../custom_fields/47/edit`) and supply them for this doc.
`get_issue`'s formatted output shows these fields' *names and current values* (that's a normal issue-view permission), but never their numeric IDs — so reading an existing issue can't work around this gap.

For a **bug** write specifically, the write proposal in step 2 must cover every one of these before it's shown to the user:

- **Project** — fixed at `ztflux` (§1.1 rule), never asked for.
- **Subject/Title prefix** — the production issue's Subject must start with the local bug's own ID, exactly as it appears in the MD filename (`BUG-<CODE>-<NUMBER>`, e.g. `BUG-HLP-025`), followed by a colon and the descriptive title: `BUG-HLP-025: Submitting an Internal Note on a ticket crashes with a 500 error`. Never drop this prefix or invent a different production-side numbering — it's what ties the production issue back to the local `bugs/open/<BUG-ID>.md` file and its `_index.md` row.
- **Test Run name, Environment, Test Case ID** — supplied by the user at the time of reporting, not inferred, guessed, or picked from the local bug MD file on Claude's own judgment. Ask for any that are missing.
- **Priority and Severity** — set on the production issue, mapped from the local bug MD file's own Severity classification (Critical/High/Medium/Low). State the mapped value explicitly in the proposal so the user can correct it before approval.
- **Assignee** — always ask the user who the production issue should be assigned to. Never default, guess, or leave unassigned without asking first.
- **Attachments — retired 2026-09-15, do not attach anything.** Do not generate or attach a PDF, and do not attach the local bug MD file (`bugs/open/<BUG-ID>.md`), to the production issue. There is no per-bug PDF folder or convention anymore — Every bug's full detail must be captured in the Description field itself instead (see below), with no attachment fallback for missing detail.

  > **Historical record** (context only, not active instructions): a raw screenshot embedded inline into Description originally rendered as a blank/gray block (found 2026-09-11), so the workaround was to generate a single-bug PDF (`scripts/gen_bug_pdf.js`, pdfkit-based to stay under a base64 size ceiling, output previously kept under a per-plugin `bugs/pdf/` folder — now removed) and attach that plus the bug MD file instead of embedding an image directly. This was dropped for two reasons: **(1) Speed** — each `upload_file` call carries the same ~6-7s fixed latency tax as any other redmineflux MCP call, so 2 attachments meant 2 extra calls' worth of waiting per bug on top of the create call. **(2) Reliability** — a 12,388-byte PDF uploaded to issue #120588 reported a correct `File size: 12.1 KB` and had valid `%PDF`/`%%EOF` markers, yet still had 2 bytes silently substituted mid-file (offsets 5954-5955), corrupting 1 of 4 content streams; length-preserving corruption defeats a size check, and the only reliable verification (download + checksum) is itself more calls and more time. Measured ceiling for byte-exact uploads was only ~4KB. `scripts/gen_bug_pdf.js` itself still exists and works if a PDF is ever needed for another purpose (pass any output path explicitly) — it is simply no longer wired into the bug-creation flow.
- **Description field structure, in Textile (not Markdown)** — this Redmine instance's Description field renders **Textile**, not Markdown. The local bug MD file is Markdown-formatted, so its content must be *converted* to Textile syntax when writing the Description, not pasted as-is. Since the Description is plain text sent inline with the single `create_issue` call (no upload, no base64), this is the one part of the bug that reaches production reliably and without the attachment-latency cost — so it must be complete on its own.

  Markdown → Textile conversion cheat sheet:

  | Markdown | Textile |
  |---|---|
  | `# H1` / `## H2` / `### H3` | `h1. H1` / `h2. H2` / `h3. H3` |
  | `**bold**` | `*bold*` |
  | `*italic*` / `_italic_` | `_italic_` |
  | `- item` / `* item` (bullet) | `* item` |
  | `1. item` (numbered) | `# item` |
  | `` `code` `` | `@code@` |
  | fenced ` ```code block``` ` | `bc. code block` (own paragraph, blank line before/after) |
  | `> quote` | `bq. quote` |
  | `---` (horizontal rule) | `---` (unchanged) |
  | `[text](url)` | `"text":url` |

  Required section order, at minimum:
  1. **Preconditions** (if the local bug file has any)
  2. **Steps to reproduce** (numbered list, verbatim from the local file, converted to Textile `#` list syntax)
  3. **Expected result**
  4. **Actual result**
  5. Environment / Redmine version / Browser / User role

  Write each section as real Textile headers/lists (per the cheat sheet above) so they render distinctly on production — don't collapse them into one run-on paragraph, and don't leave any Markdown syntax (`#`, `**`, `` ` ``, etc.) untranslated in the final text.

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
> - Description (Textile):
>   ```
>   h3. Preconditions
>   * ...
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
>   ```
>
> No attachments — full detail is in the Description above.
>
> I am ready to create this bug on the production Redmine server — a single `create_issue` call with priority, assignee, and custom fields all included.
> **Do you approve creating it?**

Only after an explicit yes should the MCP write tool be called (one `create_issue` call — see §4.3a).

## 5. Security notes

- `.mcp.json` contains a live API key in plain text. If the folder is or becomes a git repository, add `.mcp.json` to `.gitignore` — do not commit it to a shared or public remote.
- If a key is ever exposed, revoke/regenerate it from the Redmine user's **My account** page.
