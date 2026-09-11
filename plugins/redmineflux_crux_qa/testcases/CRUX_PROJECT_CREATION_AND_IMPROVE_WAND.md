# Test Cases — Redmineflux Crux — Project Creation from Chat (CRX-35) & Improve with Crux (CRX-46)

> Source: `docs/CRUX_REQUIREMENTS.md` Key Features #5, #6, #7; #116773 CRX-35/CRX-46 sections; `redmineflux-crux-core/docs/API.md` `POST /api/improve`, `/api/improve/confirm`.
>
> **Execution readiness: BLOCKED** — both features require a real LLM to generate the proposed project fields / suggested content. Write now, execute once an LLM key is added.

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

---

### TC-CRX-044: A user without project-creation permission cannot create one via chat either

**User Role:** A logged-in user whose real Redmine account lacks project-creation permission.
**Precondition:** `use_ask_crux` granted, but no Redmine-level project-create permission.

**Steps:**
1. Ask the same "@crux create a project for X" request.
2. Attempt to confirm if a card renders at all.

**Expected Result:**
- Either no card renders, or confirming it fails honestly (refused by Redmine's own permission check) — chat must not grant a capability the user's real Redmine account doesn't have (same invariant as CRX-12).

---

### TC-CRX-045: Increment-2 gaps are NOT built — do not file as bugs

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask for a batched multi-step proposal in one confirm, e.g. "create a project for X, add members A and B, and create 3 starter tickets, all in one go."

**Expected Result:**
- This is explicitly NOT built per #116773 ("NOT built (increment 2, open): ... batched multi-step proposals"). Expect either a graceful "I can only do one step at a time" style response, or separate sequential proposals — not a single combined confirm card. **Do not file the absence of batching as a bug** — but DO file a bug if the attempt instead produces a broken/partial/silently-fabricated result instead of a clean single-capability response.

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

---

### TC-CRX-048: Improve write is replay-safe and retryable on failure

**User Role:** Same as TC-CRX-046.
**Precondition:** A way to induce a transient failure on Apply (e.g. a race, or a value that would 409/422) — exploratory; if not reproducible, note as untested rather than skipped silently.

**Steps:**
1. Trigger an Apply that fails server-side.
2. Retry the same Apply.

**Expected Result:**
- The retry succeeds cleanly with no duplicate/partial write left over from the failed attempt — per #116773's claim ("replay-safe, retryable on failure").

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

---

### TC-CRX-051: No feedback (thumbs up/down) control exists yet

**User Role:** Same as TC-CRX-046.
**Precondition:** None.

**Steps:**
1. Look for a thumbs up/down or rating control on an Improve suggestion.

**Expected Result:**
- Not present — explicitly called out as NOT built in #116773. Do not file as a bug; this TC exists to confirm the doc is still accurate, not to find a defect.

---

### TC-CRX-052: A user without edit permission on the issue cannot Apply an Improve suggestion

**User Role:** A logged-in user with `use_ask_crux` but no Edit permission on the specific issue/project.
**Precondition:** None.

**Steps:**
1. Attempt the Improve flow (suggest is free/read — may still work) through to Apply.

**Expected Result:**
- Suggest/preview may still render (read-only), but Apply is refused by the real Redmine edit permission check — chat must not bypass real issue-edit permissions.

---

## Evidence Map

- Case IDs: TC-CRX-043 through TC-CRX-052
- Screenshots: bugs only.
- Log: —
- Bug reference: —
