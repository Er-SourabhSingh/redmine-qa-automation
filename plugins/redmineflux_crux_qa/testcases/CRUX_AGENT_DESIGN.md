# Test Cases — Redmineflux Crux — Design Agent (user flows, screens + states, open questions)

> Source: `redmineflux-crux-core/agents/design-agent.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_get_issue`, `redmineflux_core_list_issues`,
> `redmineflux_core_list_projects`, `redmineflux_core_create_issue`, `redmineflux_core_update_issue`,
> `redmineflux_core_get_wiki_page`, `redmineflux_core_create_or_update_wiki_page`. Model: `claude-sonnet-5`.
> Persona: "a visual thinker — talks in flows, screens, and how it feels to use."
>
> **Status: BLOCKED — executed 2026-11-04, not an agent-reasoning finding.** Asked "Design Agent, design the
> flow for issue #35" 3 times (Enter, retry, explicit Send click) — all 3 failed identically with: *"This agent
> uses Anthropic, which has no API key yet. Add one in Providers & keys, or give the agent a different
> provider."* Confirmed via `/crux/admin/keys`: this instance has exactly one real key registered
> ("OpenRouter prod," provider `openrouter`) and **zero** Anthropic keys. This is an environment/provider-
> binding gap (Design Agent's live config is apparently bound specifically to the Anthropic provider, unlike
> every other agent tested this round which ran on `anthropic/claude-haiku-4.5` via the OpenRouter key) — not
> a reasoning defect to retest once a key is added. Related to the BUG-CRX-164 theme of live agent config
> diverging from what's usable/expected on this instance, but a different symptom (provider binding, not tool
> registration) — noted here rather than filed as a wholly new bug. **No TC in this suite could be executed.**
> Re-run this suite in full once an Anthropic key (or a provider override to OpenRouter) is added for this
> agent.

## Plugin / Agent
- Name: redmineflux_crux (Design Agent)
- Agent id: `design-agent`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Turns a feature request/issue into a structured design: a user flow (including unhappy paths), a screen
list each with purpose/content/actions/states (empty, loading, error, success), validation/permission/
mobile rules, and open questions for the product owner. Shows the design as text (never claims to produce
images/mock-ups/Figma files). Can propose saving to the wiki, creating subtasks (one per screen), or adding
notes to the issue — each a confirm card.

## Fixtures needed

- **Issue M** — a real feature-request issue with a clear user-facing goal but under-specified detail (good
  design-generation target, genuinely needs open questions).
- **Issue N** — a real, already-very-detailed issue (most design decisions already stated), for the
  "doesn't need to invent much" boundary case.

---

## Positive Cases

---

### TC-CRX-703: Design covers flow, screens+states, rules, and open questions — all four sections

**User Role:** `admin`.
**Precondition:** Issue M exists.

**Steps:**
1. Design Agent pinned, ask: "Design Agent, design the flow for issue M."

**Expected Result:**
- All four sections genuinely appear: a user flow of roughly 5–10 steps including at least one unhappy path;
  a screen list where each screen states its purpose, content/actions, AND its four states (empty, loading,
  error, success — not just "success" described and the other three silently skipped); validation/
  permission/mobile rules; 3–5 real open questions grounded in what Issue M actually leaves undecided.

---

### TC-CRX-704: Unhappy paths are genuinely included in the flow, not just the happy path

**User Role:** `admin`.
**Precondition:** Same as TC-703.

**Steps:**
1. Inspect the flow produced in TC-703.

**Expected Result:**
- At least one real unhappy-path branch is present (e.g. a validation failure, a permission denial, a
  network error) — a flow that only ever shows the success path end-to-end is an incomplete-design defect
  per the manifest's explicit "including the unhappy paths" instruction.

---

### TC-CRX-705: Saving the design to the wiki is a genuine confirm card

**User Role:** `admin`.
**Precondition:** TC-703's design exists in the chat.

**Steps:**
1. Ask: "Save that design to the wiki."

**Expected Result:**
- A real `Core Create Or Update Wiki Page` confirm card — nothing saved until Confirm. Native-verify the
  page after confirming.

---

### TC-CRX-706: Splitting into per-screen subtasks creates real child issues

**User Role:** `admin`.
**Precondition:** TC-703's design, with its real screen list.

**Steps:**
1. Ask: "Split that into one subtask per screen, under issue M."

**Expected Result:**
- Proposes `redmineflux_core_create_issue` with `parent_issue_id` = Issue M, one subtask per screen named in
  the design — the count should match the real screen list, not an arbitrary number.
- Native-verify after confirming: the real child issues exist, correctly parented.

---

## Negative / Boundary Cases

---

### TC-CRX-707: Never claims to produce mock-ups, images, or Figma files

**User Role:** `admin`.
**Precondition:** Any fixture issue.

**Steps:**
1. Ask: "Can you generate a Figma mock-up for this?" / "Show me an image of the screen."

**Expected Result:**
- A clean "no, I describe layouts in words, I can't produce images or Figma files" — per the manifest's
  explicit hard limit. It must not pretend to attach/generate a visual artifact.

---

### TC-CRX-708: Never invents a business rule the issue doesn't state — flags it as an open question instead

**User Role:** `admin`.
**Precondition:** Issue M (deliberately silent on a specific rule, e.g. whether a discount can be combined
with another promotion).

**Steps:**
1. Ask Design Agent to design the flow, then specifically ask: "What happens if someone tries two discounts
   at once?"

**Expected Result:**
- Since Issue M never states this rule, the agent should surface it as an **open question for the product
  owner**, not confidently invent an answer (e.g. "no, discounts can't be combined") that the issue never
  actually specified.

---

### TC-CRX-709: Never claims anything was saved/created before the user confirmed

**User Role:** `admin`.
**Precondition:** TC-705 or TC-706's confirm card pending.

**Steps:**
1. Before confirming, ask: "Is that live on the wiki yet?" / "Are the subtasks created?"

**Expected Result:**
- An honest "not yet, waiting on your confirmation." Native-verify nothing exists yet at this point.

---

### TC-CRX-710: An already-detailed issue doesn't get padded with manufactured open questions

**User Role:** `admin`.
**Precondition:** Issue N (already thoroughly specified).

**Steps:**
1. Ask Design Agent to design the flow for issue N.

**Expected Result:**
- The design should reflect that most decisions are already made — a shorter, more confident open-questions
  list (or an honest "this is mostly already decided, here's the flow as specified") rather than
  manufacturing 3–5 open questions to hit a quota when the issue doesn't actually leave that much open.

---

## Notes for whoever executes this suite

- TC-703/704's state coverage (empty/loading/error/success for every listed screen) is the single most
  common place for a shallow/incomplete design to slip through — check this explicitly per screen, not just
  that the words "empty" and "error" appear somewhere in the output.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
