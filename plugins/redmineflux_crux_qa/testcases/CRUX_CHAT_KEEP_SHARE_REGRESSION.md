# Test Cases — Redmineflux Crux — Keep & Share Regression on a Write-Enabled Turn (#117162 criterion 3)

> Source: production ticket #117162 ("Extend all 9 bundled Crux agents with full CRUD... plus Keep, Session
> Artifacts, and Share regression coverage"), acceptance criterion 3: *"Keep, Session Artifacts, and Share
> all verified working on at least one write-enabled turn, per agent category."* Written because the
> original dedicated suite (`testcases/old_suites/CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`) was
> executed entirely against the OLD Redmine 7.0.0 stack (2026-09-15) and explicitly flagged "NOT re-verified
> against Redmine 6" — including a **Critical** security-boundary finding (BUG-CRX-011: a shared read-only
> viewer could click Confirm on the owner's pending write and genuinely execute it, attributed to the
> viewer's own identity) that had never been re-checked on the current stack before this suite.
>
> **Correction carried over from `CRUX_FEATURES_LIST.md` #25:** "Session Artifacts," as #117162 describes it
> ("agent output saved, attachable to a project/ticket"), **does not exist as a separate feature** — per the
> dev reference, Keep only saves an answer to the per-chat "Kept answers" panel; there is no
> attach-to-project/ticket mechanism. This suite tests Keep/Kept-answers in place of the non-existent
> Session Artifacts, consistent with that correction — this is a scope-reality mismatch in the original
> ticket, not a QA gap to chase further.
>
> **Status: EXECUTED 2026-11-19 — 3/3 PASS.** Fixture: DevOps Agent, project "Crux DevOps Agent Test
> Project" (id 20), a fresh real write-confirmed turn (incident creation), and a second real Share recipient
> (`daisy.skye`, already a real Redmine user/login).

## Plugin / Agent
- Name: redmineflux_crux (Keep / Share, platform chat layer — agent-agnostic)
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Methodology

Keep and Share are platform-level chat mechanisms, not agent-specific code — the write-confirm gate, the
Kept-answers panel, and the Share viewer restriction all operate on a chat turn/session regardless of which
agent produced it. This suite demonstrates the regression check on one real write-enabled agent category
(DevOps Agent) as a representative proof of the mechanism; a future pass can spot-check 1–2 further
categories for additional confidence, but the risk profile is low since none of this logic branches on agent
identity.

---

## Functional Cases

---

### TC-CRX-1087: Keep on a write-confirmed turn captures the real post-execution outcome, not just the pre-execution proposal (BUG-CRX-010 regression check)

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. DevOps Agent pinned, ask: "In the Crux DevOps Agent Test Project, open a sev4 incident for the
   auth-service, titled 'Keep/Share regression fixture'."
2. Inspect the confirm card, click Confirm.
3. Click **Keep** on that same message (the one containing both the confirm card and the real execution
   result).
4. Open the "Kept answers" panel and inspect the saved entry's full content.

**Expected Result:** The Kept entry should show the real post-execution outcome (the actual incident id,
status, timestamp) — not just the pre-execution "confirm?" proposal text, which was BUG-CRX-010's original
finding (closed on the old 7.0.0 stack, 2026-09-16; never re-checked on Redmine 6 until now).

**Result: PASS — executed 2026-11-19.** Confirmed: *"✓ Incident 4 opened [sev4] id: 4 title: Keep/Share
regression fixture severity: sev4 status: investigating affected service: auth-service started at:
2026-11-19T10:14:05.200Z"*. Opened the "Kept answers" panel and the saved entry showed this exact full real
outcome — id, severity, status, affected service, and timestamp all present — plus the original "confirm?"
proposal text above it. BUG-CRX-010 does not reproduce on the current stack.

---

### TC-CRX-1088: A shared read-only viewer correctly sees a write-enabled turn's confirm card and real outcome, without being able to send a message

**User Role:** `daisy.skye` (shared viewer), session owned by `admin`.
**Precondition:** The session from TC-1087 shared with `daisy.skye` via the chat's own Share dialog
("Username to add").

**Steps:**
1. As admin, click Share, add `daisy.skye`, confirm "✓ Shared with daisy.skye."
2. Log in as `daisy.skye` (real login, not admin) and open the exact same session URL.
3. Inspect the page banner, the message composer, and the already-confirmed turn's content.

**Expected Result:** A clear read-only banner; the composer textbox and Send button disabled; the real
executed outcome (not the proposal alone) renders correctly for the viewer.

**Result: PASS — executed 2026-11-19.** Banner: *"Shared by admin — read-only, you can't send or change
anything here."* Composer textbox labeled "Read-only — shared session" and disabled; Send button disabled.
The already-confirmed incident-creation turn rendered its full real outcome identically to what the owner
saw (`✓ Incident 4 opened [sev4]...`), proving visibility works correctly for a write-enabled turn.

---

## Negative / Security Boundary Case

---

### TC-CRX-1089 (CRITICAL security re-verification): A shared read-only viewer CANNOT execute the owner's still-pending write by clicking Confirm (BUG-CRX-011 regression check)

**User Role:** `daisy.skye` (shared viewer), session owned by `admin`.
**Precondition:** A fresh, genuinely **unconfirmed** write proposal exists in the shared session (a second
incident-creation request, left pending — not yet clicked by the owner).

**Steps:**
1. As admin, ask DevOps Agent: "In the Crux DevOps Agent Test Project, open a sev2 incident for the
   share-bypass-test service, titled 'Share ownership bypass check'." Leave the resulting confirm card
   **unconfirmed**.
2. Re-share (or confirm the existing share) with `daisy.skye`.
3. Log in as `daisy.skye`, open the same session.
4. Inspect the Confirm/Cancel buttons on the owner's still-pending proposal — are they rendered, and are they
   disabled for the viewer?
5. Click **Confirm** as `daisy.skye`.
6. Native-verify via `redmineflux_devops_list_incidents(project_id=20)` whether a new incident titled "Share
   ownership bypass check" was actually created.

**Expected Result:** Per #117162's own explicit constraint ("A shared (read-only) session must never be able
to trigger a write — ownership-only confirm stays intact"), the write must not execute, regardless of what
the UI shows.

**Result: PASS (the critical invariant holds) — executed 2026-11-19, with one minor UX finding.**
- The Confirm/Cancel buttons were **not disabled** for the shared viewer — a cosmetic/defense-in-depth gap
  (a non-owner shouldn't be offered a clickable control that will only fail), but not itself an exploit.
- Clicking Confirm as `daisy.skye` produced a browser console error: `Failed to load resource: the server
  responded with a status of 404 (Not Found) @ /crux/ask/confirm`. The request reached the server and was
  genuinely refused — no silent client-side no-op.
- Native-verify: `list_incidents` still showed only the original 4 incidents — **no "Share ownership bypass
  check" incident was created.** The write genuinely did not execute, and nothing was attributed to
  `daisy.skye`.
- **Minor finding, not filed as a bug this pass:** the server's refusal is a bare 404, not a clean 403 with
  an explicit "you don't own this chat" message — functionally safe, but a worse error message than the
  owner-mismatch deserves. Worth a follow-up polish ticket, not a security defect.
- Cleaned up afterward: logged back in as admin and cancelled the still-pending proposal (no real incident
  was ever created by this test).

---

## Notes for whoever executes this suite

- "Session Artifacts" as #117162 literally describes it does not exist (see header note) — do not write a
  TC trying to test an attach-to-project/ticket mechanism; it isn't there to test.
- This pass demonstrated the mechanism on one agent category (DevOps). A future pass could repeat
  TC-CRX-1087/1088 on 1–2 more categories (e.g. CRM/Sales, Timesheet) for additional confidence, though the
  underlying Keep/Share code is agent-agnostic so the marginal risk is low.
- The 404-vs-403 minor finding (TC-1089) is worth raising informally to the dev if a future session is
  already touching this code path, but doesn't warrant its own bug file on the strength of this one
  observation alone.
