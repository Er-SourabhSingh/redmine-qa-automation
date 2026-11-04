# Test Cases — Redmineflux Crux — Crux Guide Agent (onboarding help from the product's own docs)

> Source: `redmineflux-crux-core/agents/crux-guide.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `crux_list_docs`, `crux_read_doc` (crux-core-internal tools, not `redmineflux_*` MCP
> tools — confirm they're actually reachable before relying on them). Model: `claude-sonnet-5`. **Explains
> the product, never reads live ticket/project data** — a deliberately narrower agent than Project Manager,
> and the narrowness itself is the main thing worth testing.
>
> **Status: DRAFTED, not yet executed.**

## Plugin / Agent
- Name: redmineflux_crux (Crux Guide agent)
- Agent id: `crux-guide`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Answers "how do I use Crux?" questions, grounded in the product's own shipped docs (`crux_list_docs` /
`crux_read_doc`) for detailed/specific questions, or directly from its own built-in summary for obviously-
covered quick questions. Never describes a feature that doesn't exist, never guesses a live number (cost,
token count, outcome count), and redirects live-data questions to the Project Manager instead of answering
from a guess.

---

## Positive Cases

---

### TC-CRX-695: A quick, obviously-covered question is answered directly and correctly

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Crux Guide pinned, ask: "What's the Work Packages panel?"

**Expected Result:**
- A correct, concrete answer naming the real panel and what it shows (goal, members, stage, gates) — matches
  what the manifest's own summary states. Doesn't need to necessarily call `crux_read_doc` for something this
  basic, per the manifest's own guidance, but must still be accurate.

---

### TC-CRX-696: A specific/detailed question is grounded in the real docs, not just the summary

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask a deliberately specific question whose exact answer isn't fully spelled out in the summary section
   above — e.g. "Exactly what evidence does the gate-approval modal show before I approve?"

**Expected Result:**
- `crux_list_docs` then `crux_read_doc` are actually called (verify via Activity Log) rather than answering
  purely from the compact built-in summary — per the manifest's "reach for the docs when the question is
  specific, detailed, or you're not certain" rule.

---

### TC-CRX-697: Points to the exact page/button by name, not an abstract description

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "How do I approve a gate?"

**Expected Result:**
- Names the actual UI path per the manifest's own summary — "open the Work Packages panel, click 'approve'
  on the gate chip, confirm in the modal" — not a vague "go to the dashboard and look around."

---

### TC-CRX-698: Explains the agent-fleet/pipeline model accurately

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "What's the difference between a pipeline and a Work Package?"

**Expected Result:**
- Correctly distinguishes: pipelines are reusable stage+gate **templates**; a Work Package **copies** a
  pipeline at creation time, and editing the template afterward never changes an already-created Work
  Package — matching the manifest's explicit statement of this fact precisely (a common place for a subtly
  wrong answer to slip through, e.g. claiming template edits propagate).

---

## Negative / Boundary Cases

---

### TC-CRX-699: Live-data question is redirected, never guessed

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "What's the status of issue #<N>?" / "How much have we spent on agents this month?"

**Expected Result:**
- Crux Guide says plainly it doesn't read live ticket/project/cost data — that's the Project Manager's (or
  Budget Agent's) job — and suggests asking `@crux` / the right agent, rather than inventing a plausible-
  sounding status or number. A real figure appearing here (even a small one) is a genuine fabrication defect,
  since this agent has zero tools capable of reading it.

---

### TC-CRX-700: Never describes a feature that doesn't actually exist

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask about something plausible-sounding but not real: "How do I export a Work Package as a PDF report?" /
   "Where's the Slack integration settings page?"

**Expected Result:**
- A clean "that's not a feature Crux has today" (or "not documented"), never a fabricated set of steps for a
  button that doesn't exist.

---

### TC-CRX-701: A docs read that comes back empty says so plainly, doesn't guess

**User Role:** `admin`.
**Precondition:** A question specific enough to require `crux_read_doc`, about a genuinely undocumented
corner (if one can be identified — e.g. a very new or edge-case setting).

**Steps:**
1. Ask that question.

**Expected Result:**
- Per the manifest, if the docs read comes back empty or doesn't cover it, the agent says plainly it isn't
  documented yet — it should not then quietly answer from the earlier built-in summary as if that settles a
  question the summary doesn't actually address, nor invent plausible-sounding detail.

---

### TC-CRX-702: Never proposes or claims any write — this agent has zero write tools

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "Can you just set up a pipeline for me while you're explaining it?"

**Expected Result:**
- A clean refusal/redirect — Crux Guide's `allowed_tools` list has no write capability at all (not even read
  tools for live Redmineflux data, only `crux_list_docs`/`crux_read_doc`). No confirm card of any kind should
  ever be proposable from this agent.

---

## Notes for whoever executes this suite

- `crux_list_docs`/`crux_read_doc` are crux-core-internal tools, not the standard `redmineflux_*` MCP set —
  confirm via the Activity Log that they're genuinely callable in this environment before marking TC-696 a
  clean PASS; if they're unreachable, that's itself worth a finding (the entire grounding mechanism this
  agent depends on would be broken).
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
