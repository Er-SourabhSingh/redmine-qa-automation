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
        "X-Redmine-API-Key": "<see local .mcp.json — never put the real key in this tracked file, see §5>"
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

**Single-call creation, no attachments (updated 2026-09-15):** `redmineflux_core_create_issue` accepts `tracker_id`, `priority_id`, `assigned_to_id`, and `custom_fields` all as parameters on the *same* call — there is no need for separate `update_issue` calls afterward to set priority, assignee, or custom fields. **Do not attach the generated PDF or the local bug MD file at all** — per explicit instruction, creating a bug is now just **1 call**: `create_issue` with `project_id=ztflux`, `tracker_id=3` (Bug — see §4.3b), the prefixed `subject`, a fully self-contained Textile-formatted `description`, `priority_id`, `assigned_to_id`, and `custom_fields`. No `upload_file` calls, no `uploads` parameter.

> **⚠️ Confirmed bug in this process, found 2026-09-21:** `tracker_id` was never explicitly included in the create-bug template above until this fix. `create_issue`'s `tracker_id` defaults to `0` ("project default tracker") when omitted — and `ztflux`'s project default tracker resolves to **Task**, not **Bug**. Every bug created before this fix via this flow may have silently landed under the Task tracker instead of Bug. **`tracker_id=3` (Bug) must be passed explicitly on every bug-creation call from now on — never rely on the project default.** If you're auditing older bugs for this, check the tracker shown by `get_issue` against the intended value.

Why attachments were dropped: each `upload_file` call carries the same ~6-7 second fixed latency tax as any other redmineflux MCP call, so 2 attachments meant 2 extra calls (and extra wait) for every bug. It also turned out to be the less reliable path — see the corruption findings kept below for the record. Since the Description field is plain text sent inline with the single `create_issue` call (no separate upload, no base64, never observed to corrupt), **all bug detail now lives in the Description itself**, not in an attached file.

### 4.3b Cached reference IDs — check here before calling a list_*/get_* lookup tool

These are stable on this instance and confirmed by direct tool calls on the dates noted. Re-fetching any of these via a lookup tool wastes a call (~6-7s + tokens) for no new information — use the cached value instead, and only re-verify if something here stops matching reality.

| What | Values | Confirmed |
|---|---|---|
| Project `ztflux` | numeric ID **122** | 2026-09-16 |
| Priority (built-in) | `1=Low`, `2=Medium (default)`, `3=High`, `4=Blocker` | `list_priorities` |
| Issue Status (built-in, `status_id`) | `7=New`, `6=In Specification`, `2=In Progress`, `19=In Peer Review`, `3=In QA`, `4=In Approval`, `5=Done (closed)`, `16=Cancel (closed)`, `8=Won't Fix (closed)`, `21=On Hold`, **`9=Reopen`**, `10=Identifying`, `11=Sourcing`, `17=Test Case Fail`, `18=Test Case Pass (closed)` | `list_statuses`, 2026-09-21 |
| Case Status (`case_status_id`, testcase-management) | `1=Untested (disabled)`, `2=Passed`, `3=Failed [requires defect_ids]`, `4=Retest`, `5=Blocked [requires defect_ids]`, `6=Skipped` | `list_case_statuses`, 2026-09-18 |
| Run State (`state`, `create_run`) | `1=New`, `2=In Progress`, `3=Done`, `4=Rejected`, `5=Under Review` | tool docstring |
| Tracker (`tracker_id`) | `4=Task`, **`3=Bug`**, `6=Feature`, `5=Support`, **`7=Test Case`**, `8=Improvement`, `9=Requirement`, `12=CPP - Content`, `13=Developer - Python/NodeJS/PHP`, `14=Digital Marketing and Sales`, `15=Change Request`, `16=Quality Assurance`, `17=AWS Support`, `18=Leave`, `19=Training`, `20=Incident`, `21=Epic` | `list_trackers`, 2026-09-21 |
| Category (`category_id`, per plugin — from `list_issue_categories(122)`, 2026-09-21, full list) | `2734=Helpdesk Plugin`, `257=Agile board plugin`, `6177=Crux Plugin`, `2085=Testcase Management Plugin`, `2079=Knowledgebase Plugin`, `5782=CRM Plugin`, `5493=Invoice Plugin`, `6085=DevOps Plugin`, `258=Timesheet plugin`, `255=Workload Plugin`, `2116=Time Tracker Plugin` (also `5492=Time tracker web Plugin` — separate, near-identical name, check which one a given bug actually needs), `355=Tags Plugin`, `608=Checklist Plugin`, `2080=Inline Editor Plugin`, `353=Issue Template Plugin`, `6084=MCP Plugin`, `619=Mentions Plugin`, `2776=Notification Plugin`, `2114=Fluxshot Plugin`, `5703=Scarlet Plugin`, `5887=Lotus Plugin`, `346=FluxGantt Plugin`, `256=Custom dashboard plugin`, `360=Budget and Audit plugin`, `610=Budget & Finance Plugin`, `4574=Budget and Billing Plugin`, `614=Announcement Plugin`, `2749=AI Plugin`. Generic/non-plugin categories also exist (`611=Development - Quality Assurance & Testing`, `613=Development - Web Application - Backend`, `259=QA`, `321=UI/UX`, etc.) — pick the plugin-specific one whenever the bug is against a specific plugin. | 2026-09-21 |
| Custom fields | `43=Defect Type`, `44=Defect Severity`, `45=Defect priority`, `46=Peer Reviewer`, `51=System Component`, `57=Crux Capability` | 2026-09-15, confirmed by setting them, not by `list_custom_fields` (permission-blocked) |
| Defect Type (43) possible values | `Functional`, `Performance`, `Usability`, `Compatibility`, `Security` | screenshot of the real dropdown, 2026-09-21 |
| Defect Severity (44) possible values | `Blocker`, `Critical`, `High-severity`, `Medium-severity`, `Low-severity` | screenshot of the real dropdown, 2026-09-21 (note the inconsistent naming — Blocker/Critical have no "-severity" suffix, High/Medium/Low do; this is exactly how the field is configured, not a typo to "fix") |
| Defect priority (45) possible values | `Urgent`, `High`, `Medium`, `Low` | screenshot of the real dropdown, 2026-09-21 |
| Known assignees (`assigned_to_id`) | Vaishnavi Bhawsar **= 192**; Sheetal Sharma **= 397**; Prashant Chaurasia **= 410** | `list_project_memberships(ztflux)`, 2026-09-21 — `list_users` itself is permission-blocked, so carry these forward rather than re-looking-up. Full `ztflux` membership list also includes: Mahendra Patidar=1, Sourabh Agrawal=12, Pravesh Kumar Jain=30, Priyank Upadhyay=51, Sourabh Singh=683, Nidhi Singh=737, Ashish Patel=806, Zehntech MCP Bot=818. |

Environment labels, testsuite IDs, and testcase IDs are **not** cached here — those genuinely vary per run and must be looked up fresh each time via `get_run`/`get_run_testcases`/`list_testcases_in_suite`.

For a **bug** write specifically, the write proposal in step 2 must cover every one of these before it's shown to the user:

- **Project** — fixed at `ztflux` (§1.1 rule), never asked for.
- **Subject/Title prefix** — the production issue's Subject must start with the local bug's own ID, exactly as it appears in the MD filename (`BUG-<CODE>-<NUMBER>`, e.g. `BUG-HLP-025`), followed by a colon and the descriptive title: `BUG-HLP-025: Submitting an Internal Note on a ticket crashes with a 500 error`. Never drop this prefix or invent a different production-side numbering — it's what ties the production issue back to the local `bugs/open/<BUG-ID>.md` file and its `_index.md` row.
- **Test Run name, Environment, Test Case ID** — supplied by the user at the time of reporting, not inferred, guessed, or picked from the local bug MD file on Claude's own judgment. Ask for any that are missing.
- **Priority and Severity** — set on the production issue, mapped from the local bug MD file's own Severity classification, using this exact table (all four fields — built-in Priority, Defect Severity, Defect priority, and Defect Type — must be set per bug, never left at a default that doesn't match the actual severity):

  | Local bug Severity | `priority_id` (built-in) | Defect Severity (44) | Defect priority (45) |
  |---|---|---|---|
  | Critical | `4` (Blocker) | `Blocker` or `Critical` (pick per actual impact) | `Urgent` |
  | High | `3` (High) | `High-severity` | `High` |
  | Medium | `2` (Medium) | `Medium-severity` | `Medium` |
  | Low | `1` (Low) | `Low-severity` | `Low` |

  Defect Type (43) is set from the bug's own nature, not its severity — pick whichever of `Functional`, `Performance`, `Usability`, `Compatibility`, `Security` actually matches (default to `Functional` only when the bug genuinely is a functional defect, not as a blanket default regardless of type). State every mapped value explicitly in the proposal so the user can correct it before approval — **a known past mistake (BUG-CRX-008, a Blocker-priority bug) shipped with Defect Severity left at `Medium-severity` instead of being raised to match — don't let severity silently default instead of being actively mapped.**
- **Assignee** — always ask the user who the production issue should be assigned to. Never default, guess, or leave unassigned without asking first.
- **Attachments — retired 2026-09-15, do not attach anything.** Do not generate or attach a PDF, and do not attach the local bug MD file (`bugs/open/<BUG-ID>.md`), to the production issue. There is no per-bug PDF folder or convention anymore — every bug's full detail must be captured in the Description field itself instead (see below), with no attachment fallback for missing detail. (Dropped for speed and reliability — full history in `scripts/gen_bug_pdf.js`'s header comment if ever needed; the script itself still works standalone for other purposes.)
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

### 4.3c ⚠️ Never use these tools to build local test fixtures

**Incident (2026-09-17):** while testing `redmineflux_crux`'s QA Agent against a local Docker Redmine instance (`localhost:3014`), a session called `redmineflux_testcases_management_create_testcase` to build a throwaway fixture testcase ("TC-CRX-060 Passed Fixture") for a local test scenario. Because this MCP server is *always* connected to production (§1), that call created a real, permanent issue on `flux.zehntech.com` (`ztflux` project, issue #120780) instead of a disposable local record — even though the intent was purely local.

**The rule going forward:** every `mcp__redmineflux__*` write tool — not just the ones in §4.1's list — writes to **production**, full stop, regardless of which plugin or instance is under test. There is no "local mode" for this MCP server. If a session is testing against a local/Docker Redmine instance (a different port, e.g. `localhost:3006` or `localhost:3014`), **fixtures for that instance must be built exclusively through the local instance's own native UI (Playwright)**, never through any `redmineflux_*` MCP tool call — even ones that look like harmless test-data setup (`create_testcase`, `create_test_suite`, `create_run`, `create_environment`, etc.). The only legitimate use of these write tools in a local-testing session is reporting a confirmed bug to `ztflux` per the approval workflow above — nothing else. Before calling any `redmineflux_*` write tool, confirm the action is actually a production bug report, not a fixture for whatever instance is currently under test.

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
