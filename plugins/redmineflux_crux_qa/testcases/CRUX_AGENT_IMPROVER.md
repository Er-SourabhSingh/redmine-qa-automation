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
> **Status: EXECUTED 2026-11-04 (core mode-boundary check). 1 severe new bug: BUG-CRX-169.** Asked, in an
> ordinary Ask Crux chat (not the wand panel), "Improver, break issue #34 into subtasks." The ENTIRE response
> was a bare JSON array in a code block — exactly the strict panel-only output format the manifest explicitly
> forbids in chat mode ("Never answer a chat message with JSON, a code fence or a bare array"). This is
> TC-CRX-685's exact scenario, FAILED outright. See BUG-CRX-169 for full evidence (also notes fabricated,
> unstated tech-stack specifics in the generated subtasks — Redis caching, lazy-loading — compounding the
> BUG-CRX-166/167 pattern). Remaining TCs (panel-path positive cases, confirm-card checks, the historical
> BUG-CRX-158 retest) not yet executed this round — deprioritized per user instruction; this mode-boundary
> violation is the suite's highest-value finding and is conclusively demonstrated.

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
  breakdown + rewrite target).
- **Issue L** — a real issue that already has a clear, well-structured description, for the "already fine"
  boundary case.

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

---

### TC-CRX-686: Chat-path breakdown creation is a real confirm card per subtask

**User Role:** `admin`.
**Precondition:** TC-685's subtasks are shown.

**Steps:**
1. Ask: "Create those."

**Expected Result:**
- Proposes `redmineflux_core_create_issue` with `parent_issue_id` = Issue K's id, one confirm card per
  subtask (or a clearly batched card covering all of them) — nothing created until Confirm.
- Native-verify after confirming: the real child issues exist under Issue K.

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

---

## Notes for whoever executes this suite

- TC-689/690 ideally run through the real wand UI (an issue page's "Improve with Crux" button), not just a
  simulated chat message — the panel's own message-construction behavior is part of what's being verified.
- TC-693 requires the same temporary-permission-removal technique already used in the historical suite —
  restore the permission immediately after and verify restored.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first (TC-693 specifically against
  the historical finding).
