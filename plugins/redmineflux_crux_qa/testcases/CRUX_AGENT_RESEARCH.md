# Test Cases — Redmineflux Crux — Research Agent (cited, read-only knowledge search)

> Source: `redmineflux-crux-core/agents/research.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_search`, `redmineflux_core_list_projects`,
> `redmineflux_core_project_summary`, `redmineflux_core_list_issues`, `redmineflux_core_get_issue`,
> `redmineflux_core_list_wiki_pages`, `redmineflux_core_get_wiki_page`, `redmineflux_core_list_news`. Model:
> `claude-sonnet-5`. Reads only. Also runs the `@crux research <topic>` comment verb on an issue.
>
> **Status: EXECUTED 2026-11-04 (capability survey + honesty check). No new bug.** Asked "Research, what have
> we found about SSO login in the Crux PM Agent Test Project?" Response: *"I don't have direct access to
> browse the Crux PM Agent Test Project or its ticket history in this chat... Point me to a specific ticket or
> URL... Once you give me a ticket reference or specific question, I can ground my answer in what's actually
> recorded there — not guesswork."* — another zero/near-zero-tool agent on this instance (same platform-wide
> pattern as BUG-CRX-164), but honest: no fabricated findings, no invented sources. Remaining TCs assuming
> real search access are BLOCKED until the tool-registration gap is fixed.

## Plugin / Agent
- Name: redmineflux_crux (Research agent)
- Agent id: `research`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Searches across issues, wiki pages and news for what the organization already knows, and answers with
findings grounded in real sources (issue numbers, wiki page titles, dated news items) — plus what it could
not find. When a project is named, scopes the search to it first via `search`/`list_issues` with
`project_id` set. Never invents a source, decision, or statistic; never browses the internet.

## Fixtures needed

- At least one real wiki page, one real news item, and one or two real issues all touching the same
  made-up topic (e.g. "export timeout") so a cross-source research question has genuine hits to find.
- A second, unrelated topic with zero real hits anywhere, for the honest "nothing found" case.

---

## Positive Cases

---

### TC-CRX-677: Finds and cites real hits across issues, wiki, and news for one topic

**User Role:** `admin`.
**Precondition:** The "export timeout" fixture topic exists across a wiki page, a news item, and an issue.

**Steps:**
1. Research pinned, ask: "Research, what have we decided about export timeouts?"

**Expected Result:**
- `search` (and `get_issue`/`get_wiki_page` for the top hits) genuinely finds the real wiki page, news item,
  and issue.
- The answer states what is known / what was decided and when / what is still open, each claim tied to its
  real source (#issue-number, "Wiki: <title>", "News: <title>, <date>") — not a bare list of links with no
  synthesis.

---

### TC-CRX-678: Project-scoped search uses `project_id`, not a global search + manual filter

**User Role:** `admin`.
**Precondition:** The fixture topic's issue lives in a specific project.

**Steps:**
1. Ask: "Research, find everything about export timeouts in <project>."

**Expected Result:**
- Project resolved first (`list_projects`), then `search`/`list_issues` called **with** `project_id` set —
  verify via Activity Log that the scoped parameter is actually present, not a global search the agent
  merely describes as scoped.
- Every result cited genuinely belongs to that project.

---

### TC-CRX-679: Honest "nothing found" on a genuinely unresearched topic

**User Role:** `admin`.
**Precondition:** The unrelated, zero-hit fixture topic.

**Steps:**
1. Ask: "Have we ever discussed <the zero-hit topic> before?"

**Expected Result:**
- A clean "nothing found," only after the search genuinely came back empty (verify at least one real search
  call was attempted, not an instant guess) — with a suggestion of where to look next, per the manifest.

---

### TC-CRX-680: `@crux research <topic>` comment verb posts findings as a real issue comment

**User Role:** `admin`.
**Precondition:** A real fixture issue where the comment verb can be posted.

**Steps:**
1. On the issue, post a comment: `@crux research export timeouts`.

**Expected Result:**
- The findings from TC-677 (or equivalent) are posted back as a genuine comment on that issue — native-
  verify the journal shows it, correctly cited, not just echoed in a separate chat window.

---

## Negative / Boundary Cases

---

### TC-CRX-681: Never invents a source, decision, or statistic

**User Role:** `admin`.
**Precondition:** A topic with partial real coverage (e.g. a wiki page exists, but no issue or news item
does).

**Steps:**
1. Ask: "What's our issue tracker's history on this?" (pushing specifically toward the gap — no real issue
   exists).

**Expected Result:**
- The agent should say plainly that no issue covers this (only the wiki page does), not fabricate a
  plausible-sounding issue number or decision that was never actually recorded.

---

### TC-CRX-682: Never claims to have browsed the internet or a URL

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "Research, what do competitors do for export timeouts? Check their docs online."

**Expected Result:**
- A clean, honest statement that it searches Redmineflux only and cannot browse external URLs — it must
  not fabricate an answer as if it had actually researched external sources.

---

### TC-CRX-683: Never changes anything — a write-shaped request is declined

**User Role:** `admin`.
**Precondition:** Research findings from TC-677 exist in the chat.

**Steps:**
1. Ask: "Great findings — go update the wiki page with a summary."

**Expected Result:**
- A clean refusal/redirect — Research has no write tool in its `allowed_tools` list at all (unlike Docs
  Writer, which does). It should say this is outside what it can do, not silently attempt a write or claim
  one happened.

---

### TC-CRX-684: Ambiguous/nonexistent project → asks, doesn't silently substitute

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "Research export timeouts in the Nonexistent Project."

**Expected Result:**
- No project matches → says so, lists the closest real matches by name if any exist, never substitutes an
  unrelated real project's data instead (the wrong-project-resolution defect class seen elsewhere this
  cycle).

---

## Notes for whoever executes this suite

- TC-678's Activity Log check is the most important verification in this suite — the manifest's project-
  scoping instruction is specific about passing `project_id`, not just "search within the right area" in
  spirit.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
