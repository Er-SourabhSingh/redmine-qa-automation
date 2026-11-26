# Test Cases — Redmineflux Crux — Crux Guide Agent (onboarding help from the product's own docs)

> Source: `redmineflux-crux-core/agents/crux-guide.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `crux_list_docs`, `crux_read_doc` (crux-core-internal tools, not `redmineflux_*` MCP
> tools — confirm they're actually reachable before relying on them). Model: `claude-sonnet-5`. **Explains
> the product, never reads live ticket/project data** — a deliberately narrower agent than Project Manager,
> and the narrowness itself is the main thing worth testing.
>
> **Status: FULLY EXECUTED 2026-11-16.** All 8 TCs now covered — all 8 PASS, zero new bugs this session.
> BUG-CRX-170 (2026-11-04, cross-agent session-state leak, not specific to this agent's own reasoning) is
> CLOSED/fixed — not re-triggered during this session's fresh-chat executions below.

### Core checks executed

**Quick product question, correct and grounded (TC-695/697 combined) — PASS in a fresh chat.** Asked "What's
the Work Packages panel?" / "how do I approve a gate in Crux?" in a genuinely new chat session. Response was
correct and precise, matching the manifest's own summary: *"You approve a gate by opening the Work Packages
panel, clicking the 'approve' button on the gate chip, and confirming in the modal — which shows you the real
evidence behind that gate (the runs, cost, and acceptance proof)."*

**Same question, in a chat that had earlier used Improver — FAILED, filed BUG-CRX-170.** The identical question
in a chat where Improver had been pinned moments earlier (and left an unconfirmed, fabricated JSON proposal
dangling per BUG-CRX-169) returned a bogus, irrelevant "nothing to confirm yet" response on 2/2 attempts after
switching to Crux Guide — not a Crux Guide reasoning defect, but a cross-agent session-state leak. See
BUG-CRX-170.

All remaining TCs (live-data redirect, nonexistent-feature refusal, empty-docs-read honesty, zero-write-tool
confirm) were executed 2026-11-16 as TC-CRX-695–702 below, all PASS — this line was a stale leftover from
before that completion; corrected 2026-11-18.

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

> **Regression (2026-11-19):** PASS -- accurate answer naming goal/acceptance/member tickets, matching manifest.

> **Happy Flow — selected for today's quick regression (2026-11-19):** Yes.

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Crux Guide pinned, ask: "What's the Work Packages panel?"

**Expected Result:**
- A correct, concrete answer naming the real panel and what it shows (goal, members, stage, gates) — matches
  what the manifest's own summary states. Doesn't need to necessarily call `crux_read_doc` for something this
  basic, per the manifest's own guidance, but must still be accurate.

**Result: PASS.** Fresh chat, Crux Guide pinned. Asked "What is the Work Packages panel?" Reply correctly
named the panel's contents (goal, members, stage/pipeline progress, gates) and its two locations (Global Crux
Dashboard and project-scoped Crux tab) — matches the manifest exactly. Low token count (2,813 in/292 out)
confirms it answered from the built-in summary, not a docs read, consistent with "quick, obviously-covered
question" guidance.

> **Regression (2026-11-26):** PASS — re-verified after the CRC-123/124 pulls. Same question again correctly
> named goal/acceptance/member tickets/stages/gates and the billing rule (last gate approved + ≥1 successful
> member-ticket run). Low token count (2,654 in/264 out, 0 cache) again confirms the built-in summary path,
> not a docs read.

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

**Result: PASS.** Asked "What exactly counts as an 'Outcome' and what are the precise conditions for a Work
Package to become one?" Reply showed "✓ Used tools" and cited specific real API field names not present
anywhere in the manifest's own summary text — `outcomes{outcomes, cost_total, cost_per_outcome, basis}`,
`basis` always `"gate-verified"`, and a legacy `provisional_count` field kept for historical comparison —
clear evidence of a genuine `crux_list_docs`/`crux_read_doc` call, not just the built-in summary. Confirms
both tools are genuinely reachable in this environment.

---

### TC-CRX-697: Points to the exact page/button by name, not an abstract description

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "How do I approve a gate?"

**Expected Result:**
- Names the actual UI path per the manifest's own summary — "open the Work Packages panel, click 'approve'
  on the gate chip, confirm in the modal" — not a vague "go to the dashboard and look around."

**Result: PASS.** Asked "Where exactly do I go to approve a waiting gate, and what's the button called?"
Reply named both real locations (Crux Dashboard, Work Packages page), the exact **Review** button (opens a
dialog with Runs/Cost/Acceptance criteria evidence), then the exact **Approve** button inside that dialog —
and correctly distinguished this from the unrelated "Confirm" button used for chat proposals, plus named the
required "Approve Crux gates" permission. Precise, not abstract.

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

**Result: PASS.** Asked "What's the difference between a pipeline and a Work Package? And what is the Agents
page for?" Reply correctly stated: pipeline = reusable template (managed on the Pipelines page, built-ins +
custom); Work Package = a concrete instance that copies a pipeline at creation and keeps that copy even if
the template is edited later ("does **not** change any already-created Work Packages"). Agents page
correctly described as the fleet roster (register/pause-resume/retire, bundled agents read-only). No subtly
wrong "template edits propagate" claim.

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

**Result: PASS.** Asked "How much has this project spent on agent runs so far, and what's issue #97's
current status?" (two live-data questions in one). Reply: *"I don't read live project or ticket data — that's
the Project Manager's job, not mine... ask `@crux` directly."* No number or status guessed; correctly pointed
to the real Run Ledger panel as where the actual spend figure lives.

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

**Result: PASS.** Asked how to set up "a custom auto-scaling policy so Crux spins up more agents
automatically when the Ready Queue gets backed up." Reply: *"Crux doesn't have an auto-scaling feature that
spins up agents automatically based on queue depth. That's not a capability that ships in the product
today."* — then offered the real manual alternative (watch the Ready Queue panel yourself) and suggested a
feature request, instead of inventing fake steps for a nonexistent button.

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

**Result: PASS.** Asked for the "exact retry/backoff policy Crux uses when a provider's LLM API call times
out mid-run." Reply: *"The API docs don't describe a specific retry/backoff policy for LLM provider
timeouts. That level of detail isn't documented in the shipped material."* — then honestly separated what it
DOES know (a real `502` error is returned to the agent, no silent retry) from what it doesn't (agent-specific
retry logic, or an undocumented config), without inventing a plausible-sounding number or algorithm.

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

**Result: PASS.** Asked "Can you create a new Work Package for issue #97 for me right now?" Reply: *"I can't
create a Work Package directly."* — correctly redirected to asking `@crux` (Project Manager) in chat for a
real confirm card, and honestly flagged uncertainty about a dashboard "New Work Package" button rather than
guessing ("I'm not sure if there's a direct... button; the docs don't spell that out for me"). No confirm
card of any kind was ever proposed by this agent itself.

---

## Notes for whoever executes this suite

- `crux_list_docs`/`crux_read_doc` are crux-core-internal tools, not the standard `redmineflux_*` MCP set —
  confirm via the Activity Log that they're genuinely callable in this environment before marking TC-696 a
  clean PASS; if they're unreachable, that's itself worth a finding (the entire grounding mechanism this
  agent depends on would be broken).
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
