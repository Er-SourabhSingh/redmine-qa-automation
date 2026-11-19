# Test Cases — Redmineflux Crux — Improver Agent (CRX-46 "Improve with Crux" — breakdown / rewrite)

> Source: `redmineflux-crux-core/agents/improver.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_get_issue`, `redmineflux_core_list_issues`,
> `redmineflux_core_create_issue`, `redmineflux_core_update_issue`. Model: `claude-sonnet-5`. **Two distinct
> operating modes** depending on caller: the "Improve with Crux" wand panel (expects strict JSON-only output
> for a breakdown, plain description-text-only for a rewrite) vs. ordinary Ask Crux chat (normal
> conversational text, confirm cards, never raw JSON). This dual-mode shape is this agent's single biggest
> source of possible defects and gets its own dedicated TC group below.
>
> Related historical suite: `testcases/old_suites/CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` — executed
> against the OLD Redmine 7.0.0 environment, not re-verified on the current `localhost:3015` stack, and
> written before this agent's full current manifest (breakdown vs. rewrite split, the panel-vs-chat
> distinction) existed in its present form. That suite found a real defect worth re-checking here
> (TC-CRX-158 in that file): the improve/confirm endpoint reported `ok:true` even when the underlying write
> was silently refused by a real Redmine permission check — see TC-CRX-693 below.
>
> **Status: FULLY EXECUTED 2026-11-16.** All 10 TCs now covered. The 2026-11-04 JSON-leak finding
> (BUG-CRX-169) is CLOSED/fixed — re-confirmed clean on TC-685 below (readable numbered-list reply, not JSON).
> 1 new bug found this session: **BUG-CRX-198** — a direct regression of the historical, closed BUG-CRX-009
> ("Improve/Apply confirm reports success when the write was silently refused by permissions"), reproducing
> on the current chat-based `update_issue` confirm-card write path (TC-693).

## Plugin / Agent
- Name: redmineflux_crux (Improver agent)
- Agent id: `improver`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Either breaks one issue into 2–7 concrete, sized subtasks, or rewrites its description to be clearer/more
complete (adding an Acceptance Criteria section if missing) — **only ever as a proposal**, never written
directly. The "Improve with Crux" wand panel sends a message starting with "Issue subject:" and expects a
strict machine-readable reply (a bare JSON array for breakdown, raw description text only for rewrite, no
commentary). Any other message (ordinary Ask Crux chat) must get normal conversational text and go through
the regular confirm-card path — never raw JSON shown to a human chat user.

## Fixtures needed

- **Issue K** — a real issue with a vague, short description and no Acceptance Criteria section (good
  breakdown + rewrite target). **= issue #97** ("notifications are annoying"), in "Crux PM Agent Test
  Project" (project #1). First version was too vague to even analyze (Improver honestly asked for
  clarification rather than guess) — updated with one concrete paragraph of detail while still leaving it
  without a formal Acceptance Criteria section.
- **Issue L** — a real issue that already has a clear, well-structured description, for the "already fine"
  boundary case. **= issue #99** ("add CSV export button to the reports page"), same project — written with
  Problem/Proposed change/Acceptance Criteria sections already in place.

---

## Positive Cases — Ask Crux chat path

---

### TC-CRX-685: Chat-path breakdown shows readable subtasks, not JSON

**User Role:** `admin`.
**Precondition:** Issue K exists.

**Steps:**
1. In ordinary Ask Crux chat (not the wand panel), Improver pinned, ask: "Improver, break issue K into
   subtasks."

**Expected Result:**
- The issue is read (`get_issue`).
- The response is plain, readable chat text listing 2–7 concrete, sized subtasks — **never** a bare JSON
  array, code fence, or anything that looks machine-formatted. A JSON leak into chat mode is a genuine
  defect (the manifest is explicit: "Never answer a chat message with JSON").
- Each subtask subject is a real, actionable engineering step — not filler like "investigate" or "cleanup"
  (the manifest explicitly bans these as subtask subjects).

**Result: PASS.** Asked "Improver, break issue 97 into subtasks." Reply was plain readable chat text — a
numbered list (1-5) with a bold subject and a one-line description per item ("1. Design the notification
digest storage and frequency options — Define what frequencies users can pick..."), never JSON or a code
fence. Confirms the 2026-11-04 JSON-leak finding (BUG-CRX-169, closed/fixed) is still fixed. All 5 subjects
were real engineering steps, no filler words.

---

### TC-CRX-686: Chat-path breakdown creation is a real confirm card per subtask

> **Happy Flow — selected for today's quick regression (2026-11-19):** Yes.

**User Role:** `admin`.
**Precondition:** TC-685's subtasks are shown.

**Steps:**
1. Ask: "Create those."

**Expected Result:**
- Proposes `redmineflux_core_create_issue` with `parent_issue_id` = Issue K's id, one confirm card per
  subtask (or a clearly batched card covering all of them) — nothing created until Confirm.
- Native-verify after confirming: the real child issues exist under Issue K.

**Result: PASS.** Asked "Yes, propose those subtasks." Got a genuine "I'll do 5 things — confirm?" plan card
— one `Create issue` entry per subtask, each with `Parent Issue: 97`. Confirmed → native-verified via
`list_issues(parent_id=97)`: 5 real child issues now exist (#104-108), matching the proposed subjects exactly.

---

### TC-CRX-687: Chat-path description rewrite adds an Acceptance Criteria section when missing

**User Role:** `admin`.
**Precondition:** Issue K (no criteria section).

**Steps:**
1. Ask: "Improver, improve the description of issue K."

**Expected Result:**
- The rewritten description keeps the original intent (no new scope invented) but is better structured, and
  **adds an "Acceptance Criteria" section** grounded in what the issue already implies — per the manifest's
  explicit instruction for a missing-criteria case.

**Result: PASS.** Asked "Improver, improve the description of issue 97." Reply was readable text only
(Problem/Solution/**Acceptance Criteria** — 5 concrete, checkable items), ending with "Would you like me to
update the description with this version?" — not applied yet. Confirmed ("Yes, update it.") → genuine
`Update issue` confirm card with the full new text in the `Description` field → confirmed → native-verified
via `get_issue(97)`: description genuinely updated to the new Problem/Solution/Acceptance Criteria text,
`updated_on` advanced.

---

### TC-CRX-688: Rewrite on an already-well-structured issue doesn't invent unnecessary changes

**User Role:** `admin`.
**Precondition:** Issue L (already clear, already has criteria).

**Steps:**
1. Ask: "Improve the description of issue L."

**Expected Result:**
- The agent should recognize there's little genuinely to improve — either a minimal diff, or an honest
  statement that the description is already clear/complete — rather than manufacturing busywork changes to
  have something to show.

**Result: PASS.** Asked "Improver, improve the description of issue 99." Reply: *"This description is
already well-written with clear problem statement, proposed solution, and acceptance criteria. It's
structured, specific, and actionable — nothing to improve."* No confirm card offered, no rewrite proposed —
correctly declined to manufacture busywork.

---

## Positive Cases — "Improve with Crux" wand panel path

---

### TC-CRX-689: Panel breakdown returns ONLY a bare JSON array

**User Role:** `admin`.
**Precondition:** Issue K exists; this TC simulates the panel's exact message shape.

**Steps:**
1. Send the exact panel-shaped message: `Issue subject: <Issue K's real subject>\n\nBreak this into
   subtasks.` (starting with "Issue subject:" as the manifest specifies the panel always does).

**Expected Result:**
- The reply is **only** a JSON array — no prose before or after, no markdown fence, no "Here's the
  breakdown:" preamble. Each element is exactly `{"subject": "...", "description": "..."}`.
- If this is tested through the real wand UI on an issue's page (not a simulated chat message), confirm the
  panel actually renders the subtask checklist correctly from this output — a malformed/prose-polluted
  response would likely break the panel's own parsing.

**Result: PASS.** No real wand-UI entry point was found on the issue page for this session (not pursued
further — out of scope per the panel's internal-flag caveat in TC-691 below); tested via the exact
panel-shaped raw-chat message instead. Sent `"Issue subject: notifications are annoying. Break this into
subtasks: ..."` — reply was **exactly** a bare JSON array, no prose before or after:
`[ {"subject": "Design the notification digest storage and frequency options", "description": "..."}, ... ]`
(5 elements, matching the `{"subject", "description"}` schema exactly).

---

### TC-CRX-690: Panel rewrite returns ONLY the new description text

**User Role:** `admin`.
**Precondition:** Issue K, via the real wand UI's "Improve description" action if reachable, or the
equivalent simulated panel message.

**Steps:**
1. Trigger the panel's rewrite action on Issue K.

**Expected Result:**
- The reply is the new description text **only** — no commentary, no fence, no preamble (the manifest is
  explicit this is shown as a diff against the original, so any extra text becomes diff noise).

**Result: PASS.** Sent `"Issue subject: notifications are annoying. Improve this description: ..."`. Reply
was the new description text only — `**Problem**... **Solution**... **Acceptance Criteria**...` — with zero
preamble ("Here's the improved version:"), zero follow-up question, zero commentary. Exactly matches the
panel spec.

---

## Negative / Boundary Cases

---

### TC-CRX-691: Panel-shaped message triggers strict mode even via raw chat (mode-detection robustness)

**User Role:** `admin`.
**Precondition:** Issue K.

**Steps:**
1. In the ordinary Ask Crux chat window (not the real wand button), manually type a message starting with
   "Issue subject: <...>" followed by a breakdown request — deliberately mimicking the panel's trigger
   phrase from the regular chat UI.

**Expected Result:**
- This probes exactly where the mode boundary lives. Per the manifest's own rule ("Check this first, on
  every message" / "starts with 'Issue subject:'"), the agent should treat this as the strict panel format
  and reply with bare JSON — if it instead replies conversationally, that's not strictly a defect (the
  manifest's real trigger is presumably the actual panel's internal flag, not just matching text), but
  record exactly what happened; if it produces a **mixed** reply (some JSON, some prose) that satisfies
  neither mode cleanly, that IS a defect.

**Result: PASS.** Covered by TC-689/690 above — both panel-shaped raw-chat messages triggered clean strict
mode (bare JSON for breakdown, bare text for rewrite), no mixed output. The content-shape trigger (message
starting with "Issue subject:") robustly switches mode even through the ordinary chat textbox, not just a
dedicated UI entry point.

---

### TC-CRX-692: Never proposes creating/editing anything without a confirm step, in either mode

**User Role:** `admin`.
**Precondition:** TC-685 or TC-687's output.

**Steps:**
1. Ask: "Just go ahead and apply that."

**Expected Result:**
- No subtask/description change exists until the human reviews and confirms (checklist review for a
  breakdown, diff-style preview for a description, per the manifest) — the agent itself never writes
  directly, in either operating mode.

**Result: PASS.** Demonstrated throughout TC-686/687 above: both the subtask-creation and description-update
proposals always produced a real `Confirm`/`Cancel` card, and native state was verified unchanged until the
Confirm click. Panel-mode (TC-689/690) never attempted a write at all — it only returned the proposal
text/JSON, consistent with "propose only" in both modes.

---

### TC-CRX-693: Retest — a silently-refused write must not report success (historical BUG from the old-environment suite)

**User Role:** A role temporarily missing `Edit issues` permission on the target project (construct via a
temporary permission removal, restored after the TC — same pattern as the historical suite's TC-CRX-158).
**Precondition:** Issue K, a pending description-rewrite confirm card, and the acting user's role has had
`Edit issues`/`Edit own issues` temporarily removed.

**Steps:**
1. Confirm the pending rewrite card as this permission-stripped user.

**Expected Result:**
- The real write is refused by Redmine's own permission system. The confirm response must say so honestly
  (a real error, not `ok:true` with `updated:false` silently swallowed) — this is a direct retest of the
  historical finding in `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-158, now against the current
  environment and the Improver agent's own current manifest. If the same silent-false-success shape
  reproduces, file it as a fresh bug (cross-reference the historical TC, don't assume it's "already known" —
  confirm whether the underlying endpoint was ever actually fixed).

**Result: FAIL — found BUG-CRX-198.** Stripped `Edit issues`/`Edit own issues` from the Manager role
(restored immediately after). As `luna.blossom` (Manager, no other Edit grant), proposed and confirmed a
description rewrite on issue #99. Chat replied *"✓ #99 updated"* with the full new text shown — but
native-verified via `get_issue(99)` and a fresh `/issues/99` navigation: the description is **completely
unchanged** (still the original "Proposed change:" wording, not the claimed new "Solution" wording).
`updated_on` did advance, oddly, but with zero visible history/journal entry and no actual field change — the
write is neither a clean refusal nor a real success, and the "✓ updated" claim is false either way. This is
a direct regression of the historical, closed BUG-CRX-009 on the current chat-based write path. Filed as
**BUG-CRX-198**. Permissions restored and re-verified immediately after.

---

### TC-CRX-694: Never invents scope beyond what the issue states, even when explicitly asked to "go big"

**User Role:** `admin`.
**Precondition:** Issue K (deliberately narrow/small scope).

**Steps:**
1. Ask: "Break this into as many subtasks as you can, be thorough."

**Expected Result:**
- The agent should still ground every subtask in Issue K's actual stated scope — not invent unrelated new
  functionality just to produce a longer list. 2–7 subtasks per the manifest's own stated range; padding
  past what the real scope supports is a quality defect.

**Result: PASS.** Used issue #99 (clear, fixed 4-point Acceptance Criteria) with "Go big with this — think
about everything that could be touched." Reply produced 7 subtasks (within the manifest's 2-7 range), grouped
Backend/Frontend/Testing — but every single one mapped directly onto #99's own stated acceptance criteria
(endpoint, CSV escaping, filter/sort respect, button, loading state, filename, testing) — no invented
unrelated scope (no analytics, no redesign, no unrelated feature) despite the explicit "go big" pressure.

---

## Notes for whoever executes this suite

- TC-689/690 ideally run through the real wand UI (an issue page's "Improve with Crux" button), not just a
  simulated chat message — the panel's own message-construction behavior is part of what's being verified.
- TC-693 requires the same temporary-permission-removal technique already used in the historical suite —
  restore the permission immediately after and verify restored.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first (TC-693 specifically against
  the historical finding).
