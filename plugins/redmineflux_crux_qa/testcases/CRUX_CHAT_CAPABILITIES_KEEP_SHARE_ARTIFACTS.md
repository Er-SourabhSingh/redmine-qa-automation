# Test Cases — Redmineflux Crux — Keep, Session Artifacts, Share (regression coverage per #117162)

> Source: #117162 "Regression coverage for existing chat capabilities"; #116773 journal entry 2026-07-18 (Keep + Share completed); `docs/CRUX_FEATURES_LIST.md` #8, #9, #10.
>
> **Execution readiness: BLOCKED for Keep/Share regression on a *write-enabled* turn** (needs LLM key to generate a real write turn to Keep/Share against) — but Keep and Share on a plain *read* turn may be testable now if the echo fallback still produces a repliable message.
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

---

### TC-CRX-059: A shared viewer can never trigger the write themselves (per #117162 acceptance criteria — critical)

**User Role:** Same as TC-CRX-058.
**Precondition:** LLM key configured; the owner triggers a write proposal in the shared session.

**Steps:**
1. While the owner's write-proposal confirm card is pending, have the viewer attempt to click Confirm/Cancel on it from their own (read-only) view.
2. Also attempt any direct API call the viewer's session could make to confirm the same proposal id.

**Expected Result:**
- The viewer has no functional Confirm/Cancel control — UI-level (no button rendered or button disabled) AND server-level (a direct API attempt is refused, ownership-only). **This is explicitly the constraint called out in #117162** ("A shared (read-only) session must never be able to trigger a write — ownership-only confirm stays intact") — if a viewer CAN trigger the write, this is a Critical security bug, the single most important thing this suite should try hardest to break.

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

---

## Evidence Map

- Case IDs: TC-CRX-053 through TC-CRX-060
- Screenshots: bugs only.
- Log: —
- Bug reference: —
