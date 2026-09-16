# Test Cases — Redmineflux Crux — Project Creation from Chat (CRX-35) & Improve with Crux (CRX-46)

> Source: `docs/CRUX_REQUIREMENTS.md` Key Features #5, #6, #7; #116773 CRX-35/CRX-46 sections; `redmineflux-crux-core/docs/API.md` `POST /api/improve`, `/api/improve/confirm`.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-15, 10/10 TCs reached a definitive verdict.** TC-CRX-043–049 executed with real chat proposals, real confirm cards, and real independently-verified writes/refusals. TC-CRX-050/052 used a temporary, restored-afterward removal of the Manager role's "Edit issues"/"Edit own issues" permissions (Administration → Roles → Manager) to construct a genuine permission-denied condition, since no UI path exists to make the underlying `update_issue` write fail any other way. **Found a new bug via TC-CRX-050**: the Improve/Apply confirm endpoint (`POST /crux/improve/confirm`) reports `"ok":true` even when the write is silently refused by Redmine's real permission check (`{"ok":true,"result":{"issue_id":6,"updated":false},"run_id":null}`) — the UI shows the user no error at all, just a silently-closing panel. No new bugs from TC-CRX-043–049, 051 (051 confirms the doc is now stale, not a product defect), or TC-CRX-052 (permission boundary correctly enforced on the real write, independent of the reporting defect above).

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — Project Creation (CRX-35)

---

### TC-CRX-043: "@crux create a project for X" produces a confirm card and a real project

**User Role:** Logged-in user with `use_ask_crux` and real Redmine permission to create projects (per CRX-12, this now runs under their own key).
**Precondition:** LLM key configured.

**Steps:**
1. Ask "@crux create a project for [distinct test name]."
2. Review the confirm card.
3. Confirm.
4. Verify the project exists in Redmine.
5. Delete the test project afterward (cleanup).

**Expected Result:**
- A confirm card renders with the exact proposed project name/identifier before any write.
- On Confirm, a real project is created — verified independently in Redmine, not just trusted from the chat reply.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- As `luna.blossom` (Manager, real Redmine project-create permission), asked Crux to create a distinctly-named test project. A confirm card rendered with the proposed name/identifier before any write occurred.
- Confirmed → independently verified via `/projects` (Administration → Projects list) that the project now existed for real, not just claimed by the chat reply.
- Deleted the test project afterward (cleanup) via Administration → Projects → Delete, confirmed removed from the list.

---

### TC-CRX-044: A user without project-creation permission cannot create one via chat either

**User Role:** A logged-in user whose real Redmine account lacks project-creation permission.
**Precondition:** `use_ask_crux` granted, but no Redmine-level project-create permission.

**Steps:**
1. Ask the same "@crux create a project for X" request.
2. Attempt to confirm if a card renders at all.

**Expected Result:**
- Either no card renders, or confirming it fails honestly (refused by Redmine's own permission check) — chat must not grant a capability the user's real Redmine account doesn't have (same invariant as CRX-12).

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- As `daisy.skye` (Reporter role — confirmed via Administration → Roles → Reporter that "Create project" is unchecked, a genuine per-role permission gap), asked Crux to create a project the same way as TC-CRX-043.
- The attempt was refused by Redmine's own permission check — chat did not grant `daisy.skye` a capability her real Redmine account lacks. No project was created (verified against `/projects`).

---

### TC-CRX-045: Increment-2 gaps are NOT built — do not file as bugs

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask for a batched multi-step proposal in one confirm, e.g. "create a project for X, add members A and B, and create 3 starter tickets, all in one go."

**Expected Result:**
- This is explicitly NOT built per #116773 ("NOT built (increment 2, open): ... batched multi-step proposals"). Expect either a graceful "I can only do one step at a time" style response, or separate sequential proposals — not a single combined confirm card. **Do not file the absence of batching as a bug** — but DO file a bug if the attempt instead produces a broken/partial/silently-fabricated result instead of a clean single-capability response.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Asked for the batched request (project + members + starter tickets, "all in one go"). As expected per #116773, no single combined confirm card was produced — the rendered confirm card covered exactly one capability (project creation) at a time, matching the documented increment-2 gap.
- Not filed as a bug (per this TC's own instruction). No broken/partial/fabricated result was observed — the single-capability response was clean.

---

## Positive Cases — Improve with Crux (CRX-46)

---

### TC-CRX-046: Improve the description — suggest, preview, apply

**User Role:** Logged-in user with `use_ask_crux` and edit permission on the target issue.
**Precondition:** LLM key configured; an issue with a description worth rewriting.

**Steps:**
1. Open the issue, click the wand, choose "Improve the description."
2. Review the before/after preview (this step should be free — no write yet).
3. Click Apply.
4. Reload the issue and verify the description actually changed.

**Expected Result:**
- Step 2 produces a real before/after preview with no write occurring yet (verify by reloading the issue before clicking Apply — description unchanged).
- Step 3/4: Apply performs exactly one write, and the new description persists after a genuine reload.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- As `luna.blossom` (edit permission on the target issue), opened issue #4, clicked "Improve with Crux" → "Improve the description →". A real Before/After preview rendered.
- Reloaded issue #4 before clicking Apply — description unchanged, confirming step 2 is genuinely free/no-write.
- Clicked Apply → reloaded issue #4 again — the new (rewritten) description now persisted for real, with exactly one journal entry ("Description updated").

---

### TC-CRX-047: Improve — work breakdown (subtasks), only selected ones created

**User Role:** Same as TC-CRX-046.
**Precondition:** An issue suitable for breakdown into subtasks.

**Steps:**
1. Open the wand, choose the breakdown/checklist action.
2. Review the suggested subtasks (free, no write).
3. Select only some of the suggested subtasks (not all).
4. Apply.

**Expected Result:**
- Only the explicitly selected subtasks are created as real child issues — unselected suggestions are not silently created too.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- On issue #4, opened the wand's breakdown/checklist action. A suggested-subtasks checklist rendered (default all checked), free/no-write.
- Unchecked some of the suggested items, leaving only two selected, then clicked "Create selected".
- Verified independently via issue #4's Subtasks panel: exactly the two selected subtasks were created as real child issues (#5, #6) — the unselected suggestions were not silently created.

---

### TC-CRX-048: Improve write is replay-safe and retryable on failure

**User Role:** Same as TC-CRX-046.
**Precondition:** A way to induce a transient failure on Apply (e.g. a race, or a value that would 409/422) — exploratory; if not reproducible, note as untested rather than skipped silently.

**Steps:**
1. Trigger an Apply that fails server-side.
2. Retry the same Apply.

**Expected Result:**
- The retry succeeds cleanly with no duplicate/partial write left over from the failed attempt — per #116773's claim ("replay-safe, retryable on failure").

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- No UI path exists to induce a transient 409/422 directly, so a genuine failure was constructed instead: as admin, temporarily unchecked "Edit issues" and "Edit own issues" on the Manager role (Administration → Roles → Manager), which `luna.blossom` holds on Crux QA.
- As `luna.blossom`, on issue #6, triggered "Improve the description" → Apply. The underlying `update_issue` write was refused (confirmed via fresh reload: description unchanged — see also TC-CRX-050's finding that the endpoint's own response is misleading here).
- As admin, restored "Edit issues"/"Edit own issues" on the Manager role.
- As `luna.blossom`, retried the exact same Improve → Apply flow on issue #6. This time the write succeeded cleanly: fresh reload showed the new description persisted, with exactly **one** journal entry ("Description updated") — no duplicate or partial write left over from the earlier failed attempt.

---

### TC-CRX-049: Cancel on the Improve preview writes nothing

**User Role:** Same as TC-CRX-046.
**Precondition:** None.

**Steps:**
1. Trigger either Improve action.
2. Click Cancel on the preview instead of Apply.
3. Reload the issue.

**Expected Result:**
- No change to the issue's description or subtasks — Cancel is a true no-op.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- On issue #5 (one of TC-CRX-047's two selected subtasks), clicked "Improve with Crux" → "Improve the description →". A real Before/After preview rendered.
- Clicked Cancel (not Apply).
- Navigated fresh to `/issues/5` (full reload, not just closing the panel) — description was unchanged: "Identify where form state is held (component state, store, or both) and trace what happens when Cancel is clicked." Cancel was a true no-op.

---

## Negative Cases

---

### TC-CRX-050: Improve's own known-fixed bug class — re-verify honest failure reporting

**User Role:** Same as TC-CRX-046.
**Precondition:** A scenario that would make the underlying `update_issue` write fail (e.g. a permission removed between suggest and apply, or a field value the server rejects).

**Steps:**
1. Trigger suggest, then break the condition needed for a successful apply, then Apply.

**Expected Result:**
- Reports an honest failure with the real reason — never records success with no parseable id (per #116773's fixed bug, worth re-confirming specifically on this path since it was one of the two paths originally fixed).

**Result: FAIL — CONFIRMED LIVE 2026-09-15 — new bug, see BUG-CRX-009**
- Broke the condition needed for a successful apply the same way as TC-CRX-048: as admin, temporarily unchecked "Edit issues"/"Edit own issues" on the Manager role, which `luna.blossom` holds.
- As `luna.blossom`, on issue #6, triggered suggest ("Improve the description") — rendered fine (read-only). Clicked Apply.
- The UI gave **no error at all** — the Improve panel just silently closed, exactly as it does on a real success, and independently confirmed (fresh reload) that no write occurred.
- Captured the actual `POST /crux/improve/confirm` response body directly (via `fetch` replay with the real CSRF token and the same `proposal_id`, since the browser MCP's own network-body inspector returned empty for this call): `{"ok":true,"result":{"issue_id":6,"updated":false},"run_id":null}`.
- This is a dishonest-success response: `"ok":true` on a call that silently did NOT write (`"updated":false"`), with no error/reason surfaced anywhere the user can see. This is the same bug class #116773 says was fixed on two paths — it has resurfaced (or was never covered) on this specific "permission removed between suggest and apply" path. Filed as **BUG-CRX-009** (see `bugs/open/BUG-CRX-009.md`).
- Restored the Manager role's permissions afterward (see TC-CRX-048, which reused this same before/after state to also confirm clean retry behavior).

---

### TC-CRX-051: No feedback (thumbs up/down) control exists yet

**User Role:** Same as TC-CRX-046.
**Precondition:** None.

**Steps:**
1. Look for a thumbs up/down or rating control on an Improve suggestion.

**Expected Result:**
- Not present — explicitly called out as NOT built in #116773. Do not file as a bug; this TC exists to confirm the doc is still accurate, not to find a defect.

**Result: FAIL (doc is stale, not a product defect) — CONFIRMED LIVE 2026-09-15**
- A "Was this suggestion helpful? 👍 👎" (Helpful / Not helpful) control is present on every Improve suggestion observed this session (TC-CRX-046, 047, 048, 049, 050) — it renders directly under the Before/After preview, next to the Apply/Cancel buttons.
- This contradicts #116773's "NOT built" claim. Per this TC's own instruction, **not filed as a bug** — the finding is that `docs/CRUX_FEATURES_LIST.md` / #116773 need their "no feedback control" note updated to reflect that the control now exists. Flagged in `docs/CRUX_HANDOFF.md` for doc owners.

---

### TC-CRX-052: A user without edit permission on the issue cannot Apply an Improve suggestion

**User Role:** A logged-in user with `use_ask_crux` but no Edit permission on the specific issue/project.
**Precondition:** None.

**Steps:**
1. Attempt the Improve flow (suggest is free/read — may still work) through to Apply.

**Expected Result:**
- Suggest/preview may still render (read-only), but Apply is refused by the real Redmine edit permission check — chat must not bypass real issue-edit permissions.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Reused TC-CRX-050's constructed state: `luna.blossom`'s Manager role with "Edit issues"/"Edit own issues" temporarily unchecked (no Edit permission on issue #6).
- Suggest/preview ("Improve the description") rendered fine — read-only access was not blocked.
- Apply did not perform the real write: independently confirmed via fresh reload of `/issues/6` that the description was unchanged. Chat did not bypass the real Redmine issue-edit permission check.
- Note: while the *write itself* was correctly refused (this TC's core invariant), the endpoint's response reporting is dishonest about that refusal — see **BUG-CRX-009** under TC-CRX-050. The two are separate concerns: permission enforcement (this TC, PASS) vs. honest failure reporting (TC-CRX-050, FAIL).

---

## Evidence Map

- Case IDs: TC-CRX-043 through TC-CRX-052 — all 10 reached a definitive verdict, executed live 2026-09-15.
- Screenshots: bugs only.
- Log: —
- Bug reference: BUG-CRX-009 (TC-CRX-050)
