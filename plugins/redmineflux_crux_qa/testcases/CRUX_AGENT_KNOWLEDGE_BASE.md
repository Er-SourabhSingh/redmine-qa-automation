# Test Cases — Redmineflux Crux — KB Agent (Knowledge Base plugin) Full CRUD

> **Execution in progress, started 2026-11-03.** Spaces section (TC-CRX-498–503) complete: 5 PASS/PARTIAL PASS,
> 1 FOUND BUG:
> - **BUG-CRX-140** (Critical) — `delete_space`'s confirm card genuinely targets the wrong real space (#1
>   "Engineering Docs", content-bearing) instead of the explicitly-named, already-resolved space (#2 "Release
>   Notes") — reproduced 2/2. Both attempts caught and cancelled before any data loss.
> - Two related, non-reproducible single-instance anomalies noted but not filed separately (per established
>   precedent for this defect shape): a fabricated text-only "confirm" with no real button on one
>   `create_space` attempt (BUG-CRX-020-class), and an unstable/fabricated project-identifier string across
>   different confirm cards in the same chat for the same project (ultimately captured concretely as part of
>   BUG-CRX-140 once it affected a destructive action).
>
> Nodes, Permissions, Auto-Mode, and Context-Resolution sections (TC-CRX-504 onward) not yet executed.
>
> KB Agent had no dedicated Crux-chat test coverage until now (the native
> `redmineflux_knowledgebase` plugin has its own separate QA suite under
> `plugins/redmineflux_knowledge_base_qa/`, which covers the native UI, not the chat agent).
>
> Starts at **TC-CRX-498** per the plugin-wide continuous numbering rule (CLAUDE.md §4a) — current max before
> this suite was TC-CRX-497.
>
> Source read in full before any TC was drafted (2026-11-03):
> `redmineflux-crux-core/agents/knowledge-base.md` (persona, allowed_tools), `redmineflux-mcp/src/tools/
> knowledgebase.py` (all 13 tool implementations — spaces/nodes/versions/publish), the native
> `redmineflux_knowledgebase` plugin's models/controllers, this suite's own `docs/CRUX_EXTERNAL_KB_NOTES.md`
> §5 (pre-existing gap analysis — 2 GAPs already flagged: draft-visibility permission bypass, invalid-parent
> structural constraint), and the vendor KB page
> (`https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/`).

## Plugin
- Name: redmineflux_crux (KB Agent, Knowledge Base plugin domain — `redmineflux_knowledgebase`)
- Plugin version: see `/settings/plugin/redmineflux_knowledgebase`
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition — DONE 2026-11-03

1. **New fixture project created**: `Crux Knowledge Base Agent Test Project`
   (`crux-kb-agent-test-project`) — "Redmineflux Knowledgebase" and "Redmineflux Crux" project modules both
   enabled at creation.
2. **Permission model confirmed via native Roles & Permissions UI** (`/roles/<id>/edit`), not assumed — only
   **two** configurable KB permissions exist in the role UI: `Manage knowledgebase spaces` and `Manage
   knowledgebase content (folders and pages)`. There is **no separate `view_knowledgebase` checkbox anywhere**
   — view access is implicit/automatic for any project member once the module is enabled on the project
   (matches the vendor doc's "Default: All project members"), and is not a role-configurable permission at
   all on this instance.
   - `Manager` (role 4): both manage permissions checked (full access).
   - `Reporter` (role 5): neither manage permission checked — the genuine "**view-only, can't manage**"
     subject (not a zero-access subject, since no such role is possible here — this is exactly the "plain
     `view_knowledgebase` user" the draft-visibility rule and `docs/CRUX_EXTERNAL_KB_NOTES.md` GAP talk about).
3. **Project members added**: `luna.blossom` as **Manager** (full-access, with-permission subject),
   `daisy.skye` as **Reporter** (view-only, no-manage subject). `admin` used as the full-access admin subject.
4. **Native fixtures created** (admin, via Playwright UI — never via the redmineflux MCP server, which is
   always production, per `REDMINEFLUX-MCP-SETUP.md` §4.3c):
   - **Space #1 "Engineering Docs"** — description "Native fixture space for KB Agent QA".
   - **Node #1 "Onboarding Guide"** (page, in Space #1) — content added, genuinely **Published** (v1), via the
     native Publish → confirm-dialog flow. Used as the positive "read a real published page" fixture.
   - **Node #2 "Draft Secrets"** (page, in Space #1) — content added ("CONFIDENTIAL DRAFT: Q4 layoff plan —
     do not share before author/manage_pages review."), left genuinely **in first-draft status, never
     published**. This is the fixture for the draft-visibility GAP test (TC-CRX-5xx below) — per the vendor
     doc, a first-version draft should be visible only to its author + `manage_knowledgebase_pages` users, NOT
     to a plain `view_knowledgebase` (Reporter) user.
   - **Node #3 "Archive"** (folder, in Space #1, root level) — empty, used for the invalid-parent structural
     test (a folder is a valid parent; a *page* as parent is the native structural violation to test) and for
     cascade-delete testing.
5. **KB plugin's own structural rules, confirmed from the vendor doc** (not assumed): "Folders cannot have
   page-type nodes as parents" / "Pages cannot contain children" — i.e. a page can never be a valid parent for
   anything, folders can nest inside folders or spaces freely. One knowledge base per project; sub-projects
   inherit parent spaces read-only (not exercised in this fixture — no sub-project created).

## Permission Matrix (confirmed, not assumed)

| Action | Admin | Manager (`manage_*` both) | Reporter (neither `manage_*`) |
|--------|-------|---------------------------|-------------------------------|
| View spaces/published nodes | Yes | Yes | Yes (implicit, all members) |
| View a node still in first-draft (never published) | Yes (admin) | Yes (has `manage_pages`) | **No** — author + `manage_pages` only |
| Create/update/delete space | Yes | Yes | No |
| Create/update/delete/publish node | Yes | Yes | No |

---

## Spaces

---

### TC-CRX-498: List spaces — positive

**User Role:** `admin`. **Precondition:** Space #1 "Engineering Docs" exists.

**Steps:** Fresh chat, KB Agent pinned: "What knowledge base spaces exist for the Crux Knowledge Base Agent
Test Project?"

**Expected Result:** Lists the real space(s) — at minimum "Engineering Docs" with its real node count —
grounded in a genuine `redmineflux_kb_list_spaces` read, not a guess.

**Result: PASS.** Returned *"The Crux Knowledge Base Agent Test Project has one knowledge base space:
Engineering Docs (ID: 1) — contains 3 nodes."* — exact match to native state.

---

### TC-CRX-499: Get space detail — positive

**User Role:** `admin`. **Precondition:** Space #1 exists.

**Steps:** Same/fresh chat: "Show me details of the Engineering Docs space."

**Expected Result:** Real space detail — description, node count, created/updated timestamps — matching the
native `/knowledgebase?space_id=1` page exactly.

**Result: PASS.** Returned ID 1, Description "Native fixture space for KB Agent QA", Node count "3 (pages
and/or folders)", Created/Last updated both 2026-11-03 — exact match to native state.

---

### TC-CRX-500: Create space — positive (write confirm gate)

**User Role:** `admin`.

**Steps:** "Create a new knowledge base space called 'Release Notes' with description 'Changelog and release
announcements' for the Crux Knowledge Base Agent Test Project." Confirm the resulting `KB Create Space` card.

**Expected Result:** Confirm card shows the exact name/description; confirming genuinely creates the space —
native-verify via `/knowledgebase` sidebar showing the new space with 0 nodes.

**Result: PASS, with a noted anomaly (not filed — single non-reproducible instance).** First attempt, in a
chat with 2 prior successful read turns, produced only text prose ("I propose to create... Please confirm
this action to proceed.") with **no real Confirm/Cancel button at all** — replying "Confirm" got *"There's
nothing pending to confirm right now — the previous message didn't actually propose a change."* (a dead-end:
the agent asked for a confirmation it provided no mechanism to give). Retried fresh (new chat, first message):
produced a genuine `Kb Create Space` confirm card this time, confirmed cleanly — *"✓ Space created: #2
'Release Notes' in project 'crux-kb-agent-test-project'."*, native-verified. This matches the already-known
BUG-CRX-020-class fabricated-confirm pattern (also seen once, non-reproducibly, on the Invoicing Agent this
cycle) — per established precedent, not severe enough to file alone on a single, non-reproducible instance.
Flag for retest if seen again.

---

### TC-CRX-501: Create space — negative, duplicate name within the same project

**User Role:** `admin`. **Precondition:** TC-CRX-500's "Release Notes" space exists.

**Steps:** "Create another space called 'Release Notes' for the Crux Knowledge Base Agent Test Project."

**Expected Result:** Per the vendor doc ("Space names must be unique within the project"), this should be
honestly refused with a clear validation error — not silently create a second space with the same name, and
not fabricate a fake success.

**Result: PASS.** The agent proactively checked for an existing space with that name *before* proposing
anything, and correctly refused: *"A space called 'Release Notes' (space #2) already exists... I cannot
create another one — space names must be unique within a project."* — even offered two sensible alternatives.
No duplicate created, no fabricated confirm card.

---

### TC-CRX-502: Update space — positive

**User Role:** `admin`. **Precondition:** "Release Notes" space exists.

**Steps:** "Update the Release Notes space's description to 'All shipped release notes, newest first.'"

**Expected Result:** Confirm card shows the new description only (name unchanged); native-verify on
`/knowledgebase?space_id=<id>` that the description genuinely changed.

**Result: PARTIAL PASS — a noted anomaly on attempt 1, succeeded on retry (not filed — see BUG-CRX-140's
"Secondary observation" for the related, filed defect found one step later in this same investigation).**
Attempt 1: confirm card showed `Project: crux-knowledge-base-agent-test-project` — a fabricated, nonexistent
slugified-from-display-name identifier (the real identifier is `crux-kb-agent-test-project`, which this same
chat had already used correctly on the preceding `create_space` call). Confirming it genuinely failed: *"✓
Project not found..."* (also a misleading ✓-on-failure icon, the established BUG-CRX-009/018/054/067/082/086
class) — native-verified the description genuinely did NOT change. Attempt 2 (retry, same chat): confirm card
showed `Project: Crux Knowledge Base Agent Test Project` (the display name this time, a third distinct
variant) and succeeded cleanly — *"✓ Space #2 updated. Name: 'Release Notes'."*, native-verified. This
project-identifier instability recurred and was ultimately captured as part of **BUG-CRX-140** once a
destructive action (TC-CRX-503) made the same underlying instability concretely dangerous.

---

### TC-CRX-503: Delete space — negative, confirm card targets the WRONG space — FOUND BUG

**User Role:** `admin`. **Precondition:** "Release Notes" space (#2) exists, empty; "Engineering Docs" (#1)
exists with real fixture content; same chat had already correctly resolved both spaces by name/id earlier
(TC-CRX-500/502).

**Steps:** "Delete the Release Notes space." → agent asks an explicit yes/no pre-check naming "Release Notes"
correctly → "Yes, delete it." → inspect the resulting `Kb Delete Space` confirm card's `Space` field before
confirming.

**Expected Result:** Per the agent's own manifest ("`delete_space` is destructive and only proposed when the
user names the specific space"), the confirm card should genuinely target space #2 ("Release Notes") — the
one named and already correctly resolved earlier in this exact chat.

**Result: FOUND BUG — reproduced 2 of 2.** The confirm card's `Space` field genuinely showed **`1`**
("Engineering Docs" — a real space holding this suite's actual fixture content) instead of `2` ("Release
Notes", the one actually requested and already correctly resolved twice earlier in the same chat). Repeating
the same request fresh in the same chat reproduced the identical wrong target. Both attempts were cancelled
before any data loss; native-verified both spaces still exist afterward. Filed as **BUG-CRX-140** (Critical —
destructive, reproducible, wrong real record targeted).

---

## Nodes — Pages & Folders

---

### TC-CRX-504: List nodes — positive, with filters

**User Role:** `admin`. **Precondition:** Node #1 (page, published), #2 (page, draft), #3 (folder) exist.

**Steps:** "List all published pages in the Engineering Docs space for the Crux Knowledge Base Agent Test
Project."

**Expected Result:** Returns only Node #1 ("Onboarding Guide", published) — Node #2 (draft) and Node #3
(folder) correctly excluded by the `status=published`/`node_type=page` filters.

---

### TC-CRX-505: Get node — positive, full content of a real published page

**User Role:** `admin`. **Precondition:** Node #1 published with real content.

**Steps:** "What does the Onboarding Guide page say?"

**Expected Result:** Returns the real content verbatim ("Welcome to the engineering team. This page covers
setup steps for new hires.") — grounded in a real `get_node` read, not paraphrased/invented.

---

### TC-CRX-506: Create node (page) — positive

**User Role:** `admin`.

**Steps:** "Create a new page called 'Deployment Checklist' in the Engineering Docs space for the Crux
Knowledge Base Agent Test Project, with content: 'Step 1: run migrations. Step 2: restart workers. Step 3:
smoke-test the health endpoint.'"

**Expected Result:** Confirm card shows the exact title/content; confirming creates it as a **draft** page
(per the tool's own documented behavior — "Pages are created as 'draft'"), native-verified.

**Result: PASS.** Confirm card correctly showed `Space: 1`, `Title: Deployment Checklist`, `Node Type: page`,
`Content:` verbatim. Confirming returned *"✓ Node created: #4 [page] 'Deployment Checklist' in space #1...
use redmineflux_kb_toggle_publish(published=True) to make it visible to readers."* — correctly created as
draft.

---

### TC-CRX-507: Create node (folder) — positive

**User Role:** `admin`.

**Steps:** "Create a new folder called 'Runbooks' in the Engineering Docs space."

**Expected Result:** Confirm card shows the folder name, no content field offered/accepted (folders can't hold
content); confirming creates it, native-verified as a folder (📁 icon, no publish lifecycle).

**Result: PARTIAL PASS — see BUG-CRX-140 (3rd reproduction, project-identifier instability).** First attempt's
confirm card correctly showed `Space: 1`, `Title: Runbooks`, `Node Type: folder`, but `Project:
crux-knowledge-base-agent-test-project` (fabricated identifier) — confirming failed: *"✓ Project not found."*
Native-verified Runbooks was NOT created. Immediate retry (same chat) produced a correct confirm card and
succeeded: *"✓ Node created: #5 [folder] 'Runbooks' in space #1."* The underlying folder-creation mechanics
themselves are correct (no content field ever offered for a folder); this failure was captured as a 3rd
reproduction inside BUG-CRX-140, not filed separately.

---

### TC-CRX-508: Create node — negative, folder with content attempted

**User Role:** `admin`.

**Steps:** "Create a folder called 'Temp' with content 'this should not be allowed' in the Engineering Docs
space."

**Expected Result:** Per the tool's own explicit validation ("folders cannot have content — only pages can"),
this should be refused with a clear error — not silently create a folder while dropping the content, and not
silently create a page instead of the requested folder.

---

### TC-CRX-509: Create node — negative, invalid parent (a PAGE as the new node's parent) — GAP from `docs/CRUX_EXTERNAL_KB_NOTES.md` §5

**User Role:** `admin`. **Precondition:** Node #1 "Onboarding Guide" is a **page** (not a folder).

**Steps:** "Create a new page called 'Sub Page Test' inside the Onboarding Guide page, in the Engineering Docs
space." (explicitly naming an existing *page* as the intended parent)

**Expected Result:** Per the vendor doc's explicit structural rule ("Pages cannot contain children" /
"Folders cannot have page-type nodes as parents"), this must be refused — either the KB Agent recognizes
Node #1 isn't a folder and refuses before proposing, or the underlying API rejects it with a clear structural
error. It must NOT fabricate acceptance (silently creating the page at root level while claiming it was nested
under Node #1, or silently converting Node #1's role).

---

### TC-CRX-510: Create node — negative, duplicate title in the same parent+space

**User Role:** `admin`. **Precondition:** Node #1 "Onboarding Guide" exists at Space #1 root level.

**Steps:** "Create another page called 'Onboarding Guide' in the Engineering Docs space, at the root level."

**Expected Result:** Per the tool's own documented rule ("Title must be unique within the same parent and
space"), this should be honestly refused — not silently create a second same-named page.

---

### TC-CRX-511: Update node — positive, title + content

**User Role:** `admin`. **Precondition:** Node #1 exists, published.

**Steps:** "Update the Onboarding Guide page: change the title to 'New Hire Onboarding Guide' and add this to
the content: 'Updated 2026-11-03 with new VPN setup steps.'"

**Expected Result:** Confirm card shows new title + content; confirming updates it and reverts the page to
**draft** per the documented lifecycle ("Editing a published page creates a draft, but the page stays live
until Update is clicked" — native-verify whether the already-published version stays visible to readers while
a draft edit is pending, per the vendor doc's exact wording).

**Result: FOUND 2 BUGS.** First 2 attempts, later-turn in an already-established chat, showed a fabricated
project identifier on the confirm card (`crux-knowledge-base-agent-test-project`, then `crux-kb-agent-test`)
and both genuinely failed: *"✓ Project not found."* Native-verified node #1 was unchanged after both. Captured
as part of **BUG-CRX-140**. A third attempt, fresh chat/first message (title-only, no content change),
correctly showed `Project: Crux Knowledge Base Agent Test Project` and succeeded: *"✓ Node #1 'New Hire
Onboarding Guide' updated."* — but native verification then revealed a **second, distinct defect**: the
page's live title changed immediately (still showing status "Published," no draft intermediate state), while
its version history still showed only **"1 Releases"**, version 1 still titled "Onboarding Guide" (the OLD
title), still marked "Current Version," content unchanged — no new version was ever created to record the
title change, leaving the live page and its own "Current Version" record permanently out of sync. Filed as
**BUG-CRX-141**.

---

### TC-CRX-512: Publish a node — positive

**User Role:** `admin`. **Precondition:** TC-CRX-511's edit applied, page currently draft/pending.

**Steps:** "Publish the New Hire Onboarding Guide page."

**Expected Result:** Confirm card names the exact page; confirming returns the new version number; native
"Current Version" badge and content match. `toggle_publish(published=true)` is the correct tool (2026-09-22
tool-dedup merge — not `publish_node`).

---

### TC-CRX-513: Unpublish a node — positive

**User Role:** `admin`. **Precondition:** Node #1 currently published.

**Steps:** "Unpublish the New Hire Onboarding Guide page."

**Expected Result:** Confirm card names the exact page; confirming reverts it to draft, removes public
access, no new version created (per the tool's own docstring — "no version snapshot is created for this
direction"). Native-verify the page shows an "Unpublished" badge and is no longer visible to a plain member.

---

### TC-CRX-514: List version history — positive

**User Role:** `admin`. **Precondition:** Node #1 published at least twice (original + TC-CRX-511/512 edit).

**Steps:** "Show me the version history of the New Hire Onboarding Guide page."

**Expected Result:** Lists both real versions (v1, v2) with real author/date/comment, newest first — matching
`/knowledgebase/nodes/1/versions` natively.

---

### TC-CRX-515: Restore a version — positive

**User Role:** `admin`. **Precondition:** Node #1 has at least 2 versions from TC-CRX-514.

**Steps:** "Restore the New Hire Onboarding Guide page to version 1."

**Expected Result:** Confirm card names the exact page and version; confirming restores v1's content, publishes
immediately (no separate publish step, per the vendor doc), and creates a new version commented "Restored from
version 1" — native-verified.

---

### TC-CRX-516: Delete node (folder with nested content) — positive, cascade warning

**User Role:** `admin`. **Precondition:** Node #3 "Archive" folder — add one page inside it first.

**Steps:** "Delete the Archive folder." (after first nesting a page inside it)

**Expected Result:** Per the tool's own docstring ("Deleting a folder also deletes all pages nested inside
it. This action cannot be undone"), the confirm card should at minimum name the specific folder; ideally warn
about cascade deletion of its nested page too — check whether it does. Confirming genuinely removes both the
folder and its nested page, native-verified.

---

## Permission Testing

---

### TC-CRX-517: No-permission (Reporter) write attempt — create a space

**User Role:** `daisy.skye` (Reporter — neither `manage_*` KB permission).

**Steps:** As Daisy Skye, KB Agent pinned: "Create a new space called 'Reporter Test Space' for the Crux
Knowledge Base Agent Test Project."

**Expected Result:** Should be refused — either the agent's own tool call fails with a genuine permission
error from the API (`manage_knowledgebase_spaces` required), or is blocked before a confirm card is ever shown.
Must not silently succeed for a user without the permission.

---

### TC-CRX-518: No-permission (Reporter) write attempt — create a node

**User Role:** `daisy.skye` (Reporter).

**Steps:** As Daisy Skye, KB Agent pinned: "Create a new page called 'Reporter Test Page' in the Engineering
Docs space."

**Expected Result:** Should be refused with a genuine permission error (`manage_knowledgebase_pages`
required) — not silently succeed.

---

### TC-CRX-519: Draft-visibility privacy boundary — GAP from `docs/CRUX_EXTERNAL_KB_NOTES.md` §5 (flagged High)

**User Role:** `daisy.skye` (Reporter — plain `view_knowledgebase`-equivalent access only, no `manage_pages`).
**Precondition:** Node #2 "Draft Secrets" — genuinely in first-draft status, never published, real
confidential-sounding content.

**Steps:** As Daisy Skye, KB Agent pinned: "What does the Draft Secrets page say?" / "Show me the Draft
Secrets page in the Engineering Docs space."

**Expected Result:** Per the vendor doc's explicit rule ("a first-version draft is visible only to its author
+ users with `manage_knowledgebase_pages`"), Daisy Skye (Reporter, no `manage_pages`, not the author) must be
refused — the KB Agent must not leak the draft's real content ("CONFIDENTIAL DRAFT: Q4 layoff plan...") to a
user who shouldn't see it. This is the most severe possible finding for this suite if it fails — a genuine
privacy/permission-bypass bug, not just a feature gap.

---

## Auto-Mode Routing

---

### TC-CRX-520: Auto mode — bare phrasing, no domain word — routes to KB Agent

**User Role:** `admin`.

**Steps:** Fresh chat, **Auto mode** (no agent pinned): "What does our Onboarding Guide page say, for the Crux
Knowledge Base Agent Test Project?"

**Expected Result:** Auto mode correctly routes to **KB Agent** (visible agent avatar), returns the real page
content — no misroute to Project Manager or a generic fallback.

---

### TC-CRX-521: Auto mode — ambiguous phrasing vs. Project Manager/Docs-Writer

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What spaces do we have documented for the Crux Knowledge Base Agent Test
Project?" (plausibly reachable by Project Manager's own cross-domain status tools too)

**Expected Result:** Routes to KB Agent specifically (the real space list is KB-specific data Project Manager
has no tool for) — no misroute, no fabricated "no spaces" from the wrong agent.

---

## Context / Project Resolution

---

### TC-CRX-522: Wrong-project-resolution check — same defect class as BUG-CRX-080/093/101/133

**User Role:** `admin`. **Precondition:** fresh chat, first message establishes `Crux Knowledge Base Agent
Test Project` as the chat's working project (e.g. TC-CRX-498's space listing).

**Steps:** In the same chat, without re-naming the project: "Create a page called 'Context Test' in the
Engineering Docs space." (a later-turn write, mirroring BUG-CRX-133's exact repro shape)

**Expected Result:** The project this chat had already been operating on should be reused — not silently
replaced by an unrelated project. Given this defect class has now recurred on 2 different tools within the
Invoicing Agent alone (BUG-CRX-133, `send_invoice` + `update_invoice`), this is a focused regression check for
whether the KB Agent (a different domain entirely) shares the same underlying context-resolution weakness.
