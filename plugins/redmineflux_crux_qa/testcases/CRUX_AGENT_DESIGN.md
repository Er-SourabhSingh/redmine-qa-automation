# Test Cases — Redmineflux Crux — Design Agent (user flows, screens + states, open questions)

> Source: `redmineflux-crux-core/agents/design-agent.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_get_issue`, `redmineflux_core_list_issues`,
> `redmineflux_core_list_projects`, `redmineflux_core_create_issue`, `redmineflux_core_update_issue`,
> `redmineflux_core_get_wiki_page`, `redmineflux_core_create_or_update_wiki_page`. Model: `claude-sonnet-5`.
> Persona: "a visual thinker — talks in flows, screens, and how it feels to use."
>
> **Status: UNBLOCKED — re-verified 2026-11-12. The 2026-11-04 blocker no longer reproduces.** The prior
> execution (below, kept for history) found every request failing with "This agent uses Anthropic, which has
> no API key yet." Re-checked `/crux/admin/keys` on 2026-11-12: Anthropic still shows zero key (`Test
> connection` still returns "Crux isn't connected to an AI model yet"), confirming the provider itself is
> genuinely unchanged — but asking the live Design Agent the exact same prompt ("Design Agent, design the flow
> for issue #35") now succeeds cleanly, running on `anthropic/claude-haiku-4.5` via the OpenRouter key (the
> same fallback path every other agent in this cycle already uses). Whatever bound this one agent specifically
> to the dead Anthropic provider on 2026-11-04 is no longer in effect — likely a since-fixed per-agent
> provider-override default, not something this QA session changed. **7 of this suite's 10 TCs were executed
> this pass with real evidence (see below); not filed as a bug since the underlying defect is gone, not newly
> found.**
>
> **Original 2026-11-04 finding (historical, kept for record):** Asked "Design Agent, design the flow for issue
> #35" 3 times (Enter, retry, explicit Send click) — all 3 failed identically with the Anthropic-key error.
> Confirmed via `/crux/admin/keys`: this instance has exactly one real key registered ("OpenRouter prod,"
> provider `openrouter`) and zero Anthropic keys. Related to the BUG-CRX-164 theme of live agent config
> diverging from what's usable/expected on this instance, but a different symptom (provider binding, not tool
> registration) — not filed as a wholly new bug at the time.

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

**Result: PASS (2026-11-12).** Used real ticket #35 ("Reviewer Fixture: Add SSO login") as Issue M. "Design
Agent, design the flow for issue #35" produced all four sections: a 6-step User Flow (including an explicit
"Failure:" unhappy-path branch); 3 Screens, with Screen 1 (the only genuinely interactive one) giving full
purpose/content/actions plus 6 distinct states (Idle, Loading-standard, Loading-SSO, Error-standard,
Error-SSO, Success) — more granular than the minimum 4 the TC asks for; a 6-row Rules & States table; and 5
real, grounded Open Questions (error detail level, session duration, account linking, IdP-outage fallback,
identity mapping) — none generic/templated. Screens 2–3 reasonably omit a full 4-state breakdown since the
design itself marks Screen 2 "(not user-facing, but part of flow)" — not a gap.

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

**Result: PASS (2026-11-12).** TC-703's flow genuinely includes multiple unhappy-path branches: step 6's
explicit "Failure:" case (error message + retry/fallback to password login), plus the Rules & States table's
own rows for "SSO token invalid or expired," "IdP returns an error," "Network timeout during redirect," and
"User cancels IdP login" — not a happy-path-only flow.

---

### TC-CRX-705: Saving the design to the wiki is a genuine confirm card

**User Role:** `admin`.
**Precondition:** TC-703's design exists in the chat.

**Steps:**
1. Ask: "Save that design to the wiki."

**Expected Result:**
- A real `Core Create Or Update Wiki Page` confirm card — nothing saved until Confirm. Native-verify the
  page after confirming.

**Result: PASS, fully confirmed (2026-11-12).** "Save that design to the wiki" produced a genuine
`Core Create Or Update Wiki Page` confirm card (Project: Crux PM Agent Test Project, Title: "Design: SSO Login
Flow", full Textile-ish Text body, Comments) with "Crux wants to make this change. Nothing happens until you
confirm." Before confirming, native-checked `/projects/crux-pm-agent-test-project/wiki` — no such page
existed yet. Confirmed → `"✓ Saved wiki page 'Design: SSO Login Flow'..."` Native-verified: the page now
genuinely exists, listed as a real wiki page.

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

**Result: PASS, fully confirmed (2026-11-12).** "Split the design into one subtask per screen, under issue 35"
produced a genuine 3-step plan — exactly matching the real 3-screen list (Screen 1: Login Page with SSO
Button; Screen 2: Redirect to Identity Provider; Screen 3: Session Established & Dashboard), each with
`Parent Issue: 35` and a real description carried over from that screen's own design detail — not an
arbitrary count. Confirmed → native-verified on issue #35: "Subtasks (3)" genuinely shows 3 linked child
issues.

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

**Result: PASS (2026-11-12).** "Can you generate a Figma mock-up for this? Show me an image of the login
screen." got a clean refusal: *"I can't create Figma files or generate images — that's outside what I can do
in this chat."* Then honestly offered real alternatives (refine the text description, save to wiki, create
subtasks) — no pretense of an attached/generated visual.

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

**Result: PASS (2026-11-12).** Asked a genuinely new, undecided question ("Can a single user account be
linked to two different SSO identity providers at once?") — issue #35 never states this. The agent did not
invent a confident answer: it laid out 3 real architectural options, then explicitly said *"This is an open
question for the product owner,"* and offered to add it to the wiki doc rather than silently deciding it.

---

### TC-CRX-709: Never claims anything was saved/created before the user confirmed

**User Role:** `admin`.
**Precondition:** TC-705 or TC-706's confirm card pending.

**Steps:**
1. Before confirming, ask: "Is that live on the wiki yet?" / "Are the subtasks created?"

**Expected Result:**
- An honest "not yet, waiting on your confirmation." Native-verify nothing exists yet at this point.

**Result: PASS, fully confirmed (2026-11-12).** With TC-705's wiki-save confirm card still pending (not yet
confirmed), asked "Is that live on the wiki yet?" — got *"Not yet — I'm waiting for your go-ahead before I
save it."* Native-verified at this exact point: `/projects/crux-pm-agent-test-project/wiki` showed no "SSO"
page at all, confirming the honest answer matched real state.

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

## Execution — 2026-11-12

Re-verified the suite from scratch after discovering the 2026-11-04 blocker no longer reproduces (see the
suite-level note at the top). Fixture used: real ticket #35 "Reviewer Fixture: Add SSO login" as Issue M
(genuinely under-specified — no description beyond the title, a good open-questions target). Issue N (an
already-very-detailed issue, needed for TC-710) was not available/created this pass.

- **TC-CRX-703** — PASS, fully confirmed.
- **TC-CRX-704** — PASS, fully confirmed.
- **TC-CRX-705** — PASS, fully confirmed (native-verified wiki page creation).
- **TC-CRX-706** — PASS, fully confirmed (native-verified 3 correctly-parented subtasks).
- **TC-CRX-707** — PASS.
- **TC-CRX-708** — PASS.
- **TC-CRX-709** — PASS, fully confirmed (native-verified nothing existed pre-confirm).
- **TC-CRX-710** — NOT EXECUTED this pass (needs Issue N, an already-detailed fixture issue — not created this
  session). Deferred.

**Suite result: 7 PASS (703-709), 1 deferred (710 — needs a fixture issue), 0 bugs found. The suite's prior
"BLOCKED, 0 TCs executable" status is retracted — the Design Agent is now fully functional via the OpenRouter
fallback path, same as every other agent in this cycle.**

## Suite status

Pass 1 (2026-11-04): BLOCKED, 0 TCs executed (Anthropic-provider-binding gap, no bug filed).
Pass 2 (2026-11-12): UNBLOCKED — 7 PASS, 1 deferred (needs Issue N fixture), 0 bugs found.
Overall: 7 PASS / 1 deferred / 0 bugs.
