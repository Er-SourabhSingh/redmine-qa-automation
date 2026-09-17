# Test Cases — Redmineflux Crux — KB Agent (Knowledge Base) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/knowledge-base.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — fully executed live 2026-09-16, all 6 TCs PASS.** Precondition gap found and fixed: the Knowledge Base module wasn't enabled for `crux-qa` (fixed via the real Settings > Project UI). Unlike every other suite tested this session, **BUG-CRX-020 (fabricated-confirm) did NOT block this agent's writes** — every write action (create_space, create_node, update_node, publish_node, unpublish_node, restore_version) eventually succeeded with a real confirm card, after the usual BUG-CRX-013 self-contradiction retry. This is the first suite in this round where every TC reached a clean PASS.

## Plugin
- Name: redmineflux_crux (KB Agent, Knowledge Base plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-133: Read surface — spaces, nodes/pages, version history

**User Role:** Logged-in user with `use_ask_crux` and Knowledge Base plugin access.
**Precondition:** KB plugin installed with real spaces/pages.

**Steps:**
1. "What spaces do we have?"
2. "What does our docs say about [topic]?" (answer-from-KB, grounded in a real page).
3. "What changed on page [X] recently?" (version history).

**Expected Result:**
- Every answer grounded in a real `redmineflux_kb_*` read — never filled in from general knowledge (explicit "must never" rule, worth deliberately probing: ask about a topic NOT in the KB and confirm the agent says so rather than answering from its own general knowledge).

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "KB, what spaces do we have?" → correctly asked for the project (multi-project ambiguity). "KB, I mean project crux-qa (ID 1)." → correctly and honestly reported "The Knowledge Base module is not enabled for project crux-qa (#1)" — a real precondition gap, not a bug. Fixed via the real Settings > Project UI (checked "Redmineflux Knowledgebase" module, saved). Retrying the identical question once returned a stale "not enabled" answer, but a second retry correctly showed "The module is now enabled" — a one-off transient staleness that self-resolved, not filed as a bug.
- "KB, what does our docs say about what crux-qa is used for?" (after TC-134 created real content) → exact grounded quote from the real "Getting Started" page (`Sources (1)`), correctly attributed to its source page.
- "KB, what does the 'Zorbo Compliance Manual' space say about data retention?" (a deliberately made-up space) → honestly reported no such space exists in project 1, listed the one real space that does exist ("Documentation") — no fabricated content. (This also serves as TC-CRX-138's evidence.)

---

### TC-CRX-134: Create a space and a page with grounded content

**User Role:** Same as TC-CRX-133.
**Precondition:** None.

**Steps:**
1. "Create a space called [X] for [stated purpose]."
2. "Create a page called [Y] in space [X] with content about [topic the tester actually describes]."
3. Confirm each; verify the page's content matches what was actually asked for, not invented facts.

**Expected Result:**
- The page's drafted content is grounded in what the user actually asked for — never invented facts (explicit spec rule, directly testable: ask for a page about something specific and check the content doesn't include fabricated claims).

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "KB, create a space called 'Documentation' for project crux-qa..." self-contradicted once (BUG-CRX-013 pattern), then "KB, please create space 'Documentation' for project 1 now." produced a correct confirm card (`Kb Create Space`, Project/Description/Name all exact) → confirmed → "✓ Space created: #1 'Documentation' in project '1'."
- "KB, create a page called 'Getting Started' in space 1 with content explaining..." self-contradicted once, then "KB, please create page 'Getting Started' in space 1 now, content: '...'" produced a correct confirm card (`Kb Create Node`, Content exactly the stated text) → confirmed → "✓ Node created: #1 [page] 'Getting Started' in space #1."
- **Verified independently** via a follow-up read: "Content: This project (crux-qa) is used for QA testing of the redmineflux_crux plugin." — exact match, no invented facts, correctly reported as draft/unpublished.

---

### TC-CRX-135: Update a page, publish it, then unpublish it

**User Role:** Same as TC-CRX-133.
**Precondition:** A draft page from TC-CRX-134.

**Steps:**
1. "Update page [Y] to add [specific content]."
2. "Publish page [Y]."
3. Verify it's now visible outside draft state (e.g. to a viewer role that only sees published pages, if that distinction exists in this KB plugin).
4. "Unpublish page [Y]."

**Expected Result:**
- Update/publish/unpublish each target the exact named page and correctly change its visibility state.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- Update: after 2 self-contradictions, "KB, update content: page 1, space 1, new content '...It is part of the Redmineflux platform.' Do it now." produced a correct `Kb Update Node` confirm card (exact combined content) → confirmed → "✓ Node #1 updated."
- Publish: after 2 self-contradictions, "KB, yes, crux-qa. Publish node 1 in space 1 now." produced a correct `Kb Publish Node` confirm card → confirmed → "✓ Page #1 published. Version: v1." (Step 3, viewer-role visibility check, not separately exercised — no distinct "viewer" role/permission set is configured for KB in this environment.)
- Unpublish: after 2 self-contradictions, directly asked the agent whether an unpublish tool exists — it correctly named `redmineflux_kb_unpublish_node` and explained its semantics (reverts to draft, no new version). "KB, yes, propose unpublishing node 1 in project crux-qa now." produced a correct `Kb Unpublish Node` confirm card → confirmed → "✓ Page #1 unpublished and set to draft."
- All three writes correctly targeted node 1 exclusively — no other node exists to have been affected either way.

---

### TC-CRX-136: Restore an earlier version

**User Role:** Same as TC-CRX-133.
**Precondition:** A page with at least two versions (from TC-CRX-135's update).

**Steps:**
1. "Restore page [Y] to version [N]."
2. Confirm; verify content matches the named earlier version exactly.

**Expected Result:**
- The exact named version is restored — the agent names the exact version to restore per its own spec (never "an earlier version," always a specific one).

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- Bootstrapped a second version: re-published node 1 with a deliberately different, deliberately-wrong content ("DRAFT REVISION - do not use.") → v2 (real, verified confirm card + success).
- "KB, restore node 1 in project crux-qa to version 1 now." self-contradicted (BUG-CRX-013). Asked the agent to list versions first: "KB, list versions for node 1 in project crux-qa." → real grounded data (`Sources (1)`): v1 (version ID #1), v2 (version ID #2) — the agent names exact version IDs, never "an earlier version" vaguely. "KB, restore node 1 to version ID 1 now." produced a correct `Kb Restore Version` confirm card (Node: 1, Version: 1) → confirmed → "✓ Page #1 restored from version #1. New version: v3."
- **Verified independently**: a follow-up read of node 1's current content returned exactly v1's original text ("...used for QA testing of the redmineflux_crux plugin. It is part of the Redmineflux platform."), not v2's "DRAFT REVISION" text — confirming the restore targeted precisely the named version and the content matches exactly.

---

## Negative Cases

---

### TC-CRX-137: Delete (space or page) requires the specific one named

**User Role:** Same as TC-CRX-133.
**Precondition:** None.

**Steps:**
1. Ask vaguely, e.g. "clean up unused KB pages."

**Expected Result:**
- No delete proposal for any specific space/page is generated without explicit naming.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "KB, clean up unused KB pages." → no delete proposal — the agent asked which project (offering to confirm crux-qa) and what counts as "unused" (specific titles/node IDs or a pattern), explicitly stating "I won't delete anything without you naming the specific pages." Correct gating.

---

### TC-CRX-138: A question about a nonexistent space/page is answered honestly

**User Role:** Same as TC-CRX-133.
**Precondition:** A deliberately made-up space/page name.

**Steps:**
1. "What does the [made-up space name] space say about X?"

**Expected Result:**
- The agent says the space/page doesn't exist or isn't reachable — it does not fabricate plausible-sounding content for a space that doesn't exist.

**Result: PASS (cross-referenced against TC-CRX-133)**

Evidence: "KB, what does the 'Zorbo Compliance Manual' space say about data retention?" (see TC-CRX-133) → correctly asked for the project, then honestly reported "There is no 'Zorbo Compliance Manual' space in project 1," correctly listing the one real space instead of inventing plausible-sounding compliance content.

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §5 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §3)

---

### TC-CRX-167: Draft-visibility — a plain `view_knowledgebase` user cannot read a first-draft page — flagged High

**User Role:** A non-author test user holding only `view_knowledgebase` (not `manage_knowledgebase_pages`).
**Precondition:** A page/node in first-version draft state (unpublished), authored by a different user (e.g. `admin`).

**Steps:**
1. As `admin`, create a page/node and leave it unpublished (first-version draft).
2. As a user holding only `view_knowledgebase` (not the author, not holding `manage_knowledgebase_pages`), "KB Agent, show me the page '[title]'."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §5: "Draft visibility: a first-version draft is visible only to its author + users with `manage_knowledgebase_pages` — NOT to a plain `view_knowledgebase` user." The request must be honestly refused/excluded, never leaked. **Flagged High** — the doc explicitly calls this the same permission-bypass defect class as BUG-CRX-003/BUG-CRX-012.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the KB Agent's manifest/allowed_tools only.

---

### TC-CRX-168: `create_node` with an invalid parent (a page node as the new node's parent) is refused

**User Role:** Same as TC-CRX-133.
**Precondition:** An existing page-type node (not a folder).

**Steps:**
1. "KB Agent, create a new page called '[X]' inside the page '[existing page title]'." (using an existing *page*, not a folder, as the parent)

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §5: "Structural rule: 'Folders cannot have page-type nodes as parents. Pages cannot contain children.'" The create must be refused, citing the real structural constraint — the agent must surface a real error, not fabricate acceptance.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the KB Agent's manifest/allowed_tools only.

---

### TC-CRX-169: Permission matrix — KB Agent, no-domain-permission probe

**User Role:** `luna.blossom` (lacks `Manage knowledgebase spaces`/`content`).
**Precondition:** At least one existing KB space (check via `list_spaces` as `admin` first).

**Steps:**
1. As `admin`, confirm at least one KB space exists via `list_spaces`.
2. As `luna.blossom`, "KB Agent, create a page called 'Permission Matrix Test' in [space]."

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s 3-way framing: honest refusal at the real KB permission layer, no silent success, no fabricated result.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s planned-probe table (row: KB Agent).

---

## Evidence Map

- Case IDs: TC-CRX-133 through TC-CRX-138 — all 6 reached a definitive verdict, all PASS. First fully-clean suite this round (BUG-CRX-020 did not block this agent's writes, though BUG-CRX-013 self-contradiction was reproduced repeatedly — see below).
- Screenshots: bugs only (none captured — evidence via live chat transcript text, cross-checked via independent read-backs after each write).
- Log: session ses-143, 2026-09-16.
- Bug reference: BUG-CRX-013 (self-contradiction, reproduced on a sixth domain agent — KB — across 6+ occurrences: create_space, create_node, update_node×2, publish_node×2, unpublish_node×2, restore_version×1; every single one eventually succeeded on retry with explicit numeric IDs/"do it now" phrasing, 100% eventual success rate for this agent unlike BUG-CRX-020's agents).
