# Test Cases — Redmineflux Crux — KB Agent (Knowledge Base) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/knowledge-base.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added.

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

---

### TC-CRX-136: Restore an earlier version

**User Role:** Same as TC-CRX-133.
**Precondition:** A page with at least two versions (from TC-CRX-135's update).

**Steps:**
1. "Restore page [Y] to version [N]."
2. Confirm; verify content matches the named earlier version exactly.

**Expected Result:**
- The exact named version is restored — the agent names the exact version to restore per its own spec (never "an earlier version," always a specific one).

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

---

### TC-CRX-138: A question about a nonexistent space/page is answered honestly

**User Role:** Same as TC-CRX-133.
**Precondition:** A deliberately made-up space/page name.

**Steps:**
1. "What does the [made-up space name] space say about X?"

**Expected Result:**
- The agent says the space/page doesn't exist or isn't reachable — it does not fabricate plausible-sounding content for a space that doesn't exist.

---

## Evidence Map

- Case IDs: TC-CRX-133 through TC-CRX-138
- Screenshots: bugs only.
- Log: —
- Bug reference: —
