# Test Cases — Redmineflux Crux — Keep, Session Artifacts, Share (regression coverage per #117162)

> Source: #117162 "Regression coverage for existing chat capabilities"; #116773 journal entry 2026-07-18 (Keep + Share completed); `docs/CRUX_FEATURES_LIST.md` #8, #9, #10.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-15.** TC-CRX-053/054/055/058/059/060 all reached a definitive verdict; TC-CRX-056/057 remain out of scope per the 2026-09-11 scope correction below. **Found BUG-CRX-011 (Critical) via TC-CRX-059**: a shared read-only session's viewer can click Confirm on the owner's still-pending write proposal and genuinely execute it, attributed to the viewer's own identity — the exact "ownership-only confirm" invariant #117162 calls out as the most important thing to try to break. **Found BUG-CRX-010 (Medium) via TC-CRX-055**: a write-confirmed turn's Session Artifact/Keep snapshot captures only the pre-execution proposal text, omitting the real outcome — contrasted against a plain read-turn, whose artifact snapshot is faithful and complete.
>
> **UPDATE 2026-09-11 — dev reply received (`REPLY-TO-QA-2026-09-11.md`, Q2):** Session Artifacts is **intentionally v1-scoped, not half-built by accident.** Core leg (save a chat reply as an artifact, list it, read it back, version history) is fully shipped. **Attach-to-Flux (attaching an artifact to a Redmine project/ticket) was a deliberate scope cut for this release — it does not exist yet, no committed date.** Per dev's explicit instruction: **test only the core-leg behavior (save/list/read/version). Do NOT write or run test cases against attach-to-Flux.** TC-CRX-056 and TC-CRX-057 below (both attach-to-project/ticket scenarios) are now **out of scope** — left in place struck through for traceability, do not execute them; do not file their absence as a bug.

## Scope correction (2026-09-11)

~~TC-CRX-056: An agent-produced artifact saves and attaches to a project/ticket (if implemented)~~
~~TC-CRX-057: A write-turn's artifact still saves/attaches correctly (per #117162 acceptance criteria)~~

Both **retired — out of scope for this release** per dev confirmation (attach-to-Flux is a deliberate v1 cut, no ETA). Replaced by TC-CRX-055 below, rescoped to core-leg only.

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — Keep

---

### TC-CRX-053: Keep pins a plain read-turn reply

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None (executable even under echo fallback, if Keep operates on whatever reply is rendered).

**Steps:**
1. Ask a question, get a reply.
2. Click Keep on that reply.
3. Navigate away and back to the session.

**Expected Result:**
- The kept reply is pinned/displayed distinctly and persists across navigation.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- As `luna.blossom`, started a new chat, asked `@crux what is Redmine issue #6 about?`. Got a real grounded reply with sourced content.
- In the full chat view (`/crux/ask?session=ses-136`), clicked **Keep** on the reply — button changed to disabled `Kept ✓`.
- Navigated away (`/crux`) and back (fresh page load, not client-side state) — `Kept ✓` still shown, disabled, pinned distinctly under the reply.

---

### TC-CRX-054: Keep on a write-enabled turn (per #117162 acceptance criteria)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** LLM key configured; a real write-proposal turn (e.g. from one of the 9 agents).

**Steps:**
1. Trigger a write proposal from any of the 9 agents (e.g. CRM's create_contact).
2. Confirm it.
3. Click Keep on that turn (the proposal, the confirm card, or the outcome message — confirm exactly what's kept).

**Expected Result:**
- Per #117162's acceptance criteria: "a kept chat reply from a write-enabled agent still pins/displays correctly" — verify specifically that the pinned version still shows accurate outcome info (e.g. doesn't show "pending" after the write already executed).

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- As `luna.blossom`, asked `@crux create an issue titled "TC-CRX-054 Keep Write Test" in the Crux QA project`. Confirm card rendered, clicked Confirm → turn updated to `✓ Created` `#7` (real issue, independently verified).
- Clicked **Keep** on that same turn (well after the outcome had already rendered — not a timing/race scenario). Button changed to disabled `Kept ✓`, shown alongside the accurate `✓ Created #7` outcome, not "pending".
- Navigated away and back (fresh page load) — `Kept ✓` and the accurate `✓ Created #7` outcome both persisted correctly.
- Note: while the **live chat view's** pinned display is accurate (this TC's PASS), a **separate** defect exists in how this same turn is captured for the Session Artifacts feature — see TC-CRX-055 / BUG-CRX-010.

---

## Positive Cases — Session Artifacts

---

### TC-CRX-055: Session Artifacts — core-leg only (save, list, read, version)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** LLM key configured (a real turn worth saving as an artifact).
**Scope (per dev confirmation, `REPLY-TO-QA-2026-09-11.md` Q2):** core-leg only — save/list/read/version. Do NOT attempt to attach an artifact to a project/ticket; that surface doesn't exist yet (deliberate v1 cut).

**Steps:**
1. Produce an agent turn worth saving (e.g. a generated report/summary).
2. Save it as a Session Artifact.
3. List the session's artifacts and confirm the new one appears.
4. Read it back (full content, not truncated).
5. If the artifact is edited/re-saved, confirm version history reflects the change.

**Expected Result:**
- Save/list/read/version all work correctly for the core-leg surface.
- No attach-to-project/ticket control should be expected or tested — its absence is correct, by design, not a bug (see scope correction above).

**Result: FAIL (partial) — CONFIRMED LIVE 2026-09-15 — new bug, see BUG-CRX-010**
- Discovered that clicking **Keep** on a turn automatically produces a Session Artifact entry (the "Artifacts" panel next to Share) — Keep and Session Artifacts share the same underlying save mechanism on this build; no separate explicit "Save as Artifact" action exists.
- **List**: opened the Artifacts panel for a session with a kept plain-read turn — the new artifact correctly appears, labeled `chat · <timestamp>`.
- **Read (plain read-turn, TC-CRX-053's turn)**: clicked into the artifact — full content reproduced faithfully, every paragraph and all three acceptance-criteria bullets present, matching the live chat verbatim. PASS for this case.
- **Read (write-confirmed turn, TC-CRX-054's turn)**: clicked into that artifact — content was `→ asking the Project Manager… I'll create this issue — confirm?` **only**. The `✓ Created #7` outcome, present and accurate in the live chat view, is completely absent from the saved artifact. Confirmed via the raw session JSON (`GET /crux/ask/session/<id>`) that the underlying `turns[].text` field itself never includes the outcome — it's injected into the live view from elsewhere, and the artifact-save path reads only this field.
- **Version**: no edit/re-save control was found anywhere in the Artifacts UI for either artifact — untested; no UI path found to exercise version history on this build.
- Filed as **BUG-CRX-010** (Medium) — see `bugs/open/BUG-CRX-010.md`. Not filed against TC-CRX-054 (whose own live-view pinned display is accurate) — this is specifically an Artifacts-panel defect.

---

### TC-CRX-056: An agent-produced artifact saves and attaches to a project/ticket (if implemented)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** Only run if TC-CRX-055 confirms the feature exists; LLM key configured.

**Steps:**
1. Trigger an agent turn that produces a durable output (e.g. a generated report).
2. Save it as a Session Artifact.
3. Attach it to a specific project/ticket.
4. Verify the artifact is actually visible from that project/ticket, not just from the chat session.

**Expected Result:**
- The artifact saves and is genuinely retrievable from the attached project/ticket — not just referenced in the chat transcript.

---

### TC-CRX-057: A write-turn's artifact still saves/attaches correctly (per #117162 acceptance criteria)

**User Role:** Same as TC-CRX-056.
**Precondition:** Only run if TC-CRX-055 confirms the feature exists.

**Steps:**
1. Trigger a write-enabled turn from one of the 9 agents that also produces an artifact-worthy output.
2. Save and attach the artifact.

**Expected Result:**
- Works the same as a non-write turn's artifact — no regression from adding CRUD to the agents.

---

## Positive Cases — Share

---

### TC-CRX-058: A shared session is visible read-only to the invited viewer

**User Role:** Session owner (any logged-in user with `use_ask_crux`) + a second logged-in user (the viewer).
**Precondition:** An active chat session.

**Steps:**
1. Owner shares the session with the viewer.
2. Viewer opens the shared session and watches live as the owner continues chatting.

**Expected Result:**
- Viewer sees the conversation update live, including any confirm cards and their outcomes as they happen.

**Result: PASS (visibility/read-only confirmed; true real-time push not separately exercised) — CONFIRMED LIVE 2026-09-15**
- As `luna.blossom`, shared a session (with a pending proposal) with `daisy.skye` via the Share dialog — confirmed "Shared with daisy.skye."
- `daisy.skye` (Reporter role — note: does not have `Use Ask Crux` by default; temporarily granted for this test only, see TC-CRX-059's note) opened the same session URL: the sidebar correctly labeled it "shared with you, read-only" / "shared by luna.blossom", and the thread banner read "Shared by luna.blossom — read-only, you can't send or change anything here." The full existing conversation (including the still-pending confirm card) rendered correctly for the viewer.
- The composer textbox and Send button were correctly disabled for the viewer ("Read-only — shared session").
- Live-push-while-owner-is-actively-typing was not separately exercised (would need two simultaneous live sessions); the core visibility/read-only-labeling behavior this TC cares about is confirmed.

---

### TC-CRX-059: A shared viewer can never trigger the write themselves (per #117162 acceptance criteria — critical)

**User Role:** Same as TC-CRX-058.
**Precondition:** LLM key configured; the owner triggers a write proposal in the shared session.

**Steps:**
1. While the owner's write-proposal confirm card is pending, have the viewer attempt to click Confirm/Cancel on it from their own (read-only) view.
2. Also attempt any direct API call the viewer's session could make to confirm the same proposal id.

**Expected Result:**
- The viewer has no functional Confirm/Cancel control — UI-level (no button rendered or button disabled) AND server-level (a direct API attempt is refused, ownership-only). **This is explicitly the constraint called out in #117162** ("A shared (read-only) session must never be able to trigger a write — ownership-only confirm stays intact") — if a viewer CAN trigger the write, this is a Critical security bug, the single most important thing this suite should try hardest to break.

**Result: FAIL — CONFIRMED LIVE 2026-09-15 — CRITICAL new bug, see BUG-CRX-011**
- As `luna.blossom`, triggered a write proposal (`create an issue titled "TC-CRX-059 Share Viewer Confirm Test"`) and left it **unconfirmed**. Shared the session with `daisy.skye`.
- Note: `daisy.skye` (Reporter) lacks `Use Ask Crux` by default — a bare attempt to open `/crux/ask?session=...` correctly 403'd. Temporarily granted `Use Ask Crux` to the Reporter role to reach the viewer UI at all (reverted immediately after this test) — this means the gap below is **not** gated behind that 403 for any two real users who both hold `Use Ask Crux`, which is the normal permission for using the feature at all.
- As `daisy.skye`, opened the shared session: composer correctly disabled, banner correctly read "read-only, you can't send or change anything here" — but the **pending proposal's Confirm/Cancel buttons rendered fully enabled, not disabled**.
- Clicked **Confirm** as `daisy.skye` → the write **executed**: turn updated to `✓ Created #8`.
- Independently verified via a fresh direct navigation to `/issues/8`: the issue genuinely exists, and critically **"Added by Crux Reporter"** (`daisy.skye`, user id 6) — attributed to the viewer's own identity, not the session owner.
- This is a full server-side failure of the "ownership-only confirm" invariant, not a UI-only cosmetic gap. Filed as **BUG-CRX-011 (Critical)** — see `bugs/open/BUG-CRX-011.md`.

---

## Negative Cases

---

### TC-CRX-060: Share does not leak data the viewer wouldn't otherwise have access to

**User Role:** Session owner + a viewer whose own Redmine permissions are narrower than the owner's.
**Precondition:** CRUX_REQUIRE_USER_KEY=1 ideally (ties to CRX-12), or note as a caveat if tested under shared-key mode.

**Steps:**
1. Owner (broad permissions) asks a question that returns data the viewer's own account couldn't access directly.
2. Viewer watches the shared session.

**Expected Result:**
- Exploratory — determine and record whether Share exposes the *owner's* permission-scoped data to a *viewer* with narrower permissions. If so, this is a genuine access-control question worth flagging (even if "by design" for a collaboration feature, it should be an explicit, documented decision, not an unconsidered side effect) — check with the dev team before filing as a bug outright.

**Result: FAIL — CONFIRMED LIVE 2026-09-15 — new bug, see BUG-CRX-012 (broader than Share itself)**
- As `luna.blossom` (Manager, has "View Crux dashboard"), asked `@crux what are the agents working on?` — got real fleet/dashboard-scoped data (27 agents online, 14 WP gates, per-WP goals and blocking stages). Shared the session with `daisy.skye` (Reporter — confirmed "View Crux dashboard" unchecked for this role).
- Before even checking the shared session, tested the more direct question: can `daisy.skye` reach this same class of data on her own, with zero Crux permissions, via plain navigation? **Yes** — `/crux` (the dashboard root) renders completely for her: fleet cost/spend figures, Work Package pipeline internals, and the full Run Ledger, with no permission check applied at all. This makes the Share-leak question moot in the worst way: the underlying dashboard data was never actually protected by the permission checkbox in the first place, share or no share.
- Filed the root cause as **BUG-CRX-012** (see `bugs/open/BUG-CRX-012.md`) rather than narrowly as a Share-specific bug, since `/crux` access requires no sharing step at all — any two real users, share feature or not, are affected.
- This is a genuine, un-considered access-control gap, not a documented design decision — worth the dev team's attention regardless of whether Share itself is ever fixed.

---

## Evidence Map

- Case IDs: TC-CRX-053 through TC-CRX-060 — all reached a definitive verdict, executed live 2026-09-15. TC-CRX-056/057 remain out of scope (2026-09-11 scope correction).
- Screenshots: bugs only.
- Log: —
- Bug reference: BUG-CRX-010 #120659 (TC-CRX-055), BUG-CRX-011 #120660 Critical (TC-CRX-059), BUG-CRX-012 #120661 Critical (TC-CRX-060) — all reported to production, assigned to Prashant Chaurasia
