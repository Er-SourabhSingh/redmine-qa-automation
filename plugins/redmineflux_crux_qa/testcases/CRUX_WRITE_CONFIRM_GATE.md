# Test Cases — Redmineflux Crux — Governed Write Path & Confirm Gate (CRX-9, CRX-35, CRX-39)

> Source: `docs/CRUX_REQUIREMENTS.md` Key Features #2, #3; `docs/CRUX_FEATURES_LIST.md` #2, #3, #19; `redmineflux-crux-core/docs/API.md` `POST /api/gate`, `Frozen rules — CRX-39` section; #116773 description (CRX-9 "sacred rule").
>
> **Execution readiness:** TC-CRX-025–028 (the core "never executes on the model's word" invariant, and gate approval membership requirement) need a real LLM key to generate an actual write proposal to test against. TC-CRX-029–032 (frozen rules admin page, gate approval endpoint structure) may be partially testable without a key since they're plugin-native admin/dashboard UI, not chat-generated. Confirm per-TC during execution.

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-025: A proposed write never executes until Confirm is clicked

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** LLM key configured; a question that clearly implies a write (e.g. "create a contact named Test Contact for Acme").

**Steps:**
1. Ask the write-implying question.
2. Observe the response — do NOT click Confirm yet.
3. Independently verify (via a read-only MCP/UI check) whether the record was actually created.
4. Return to the chat and click Confirm.
5. Re-verify.

**Expected Result:**
- Step 2's response is a confirm card describing the exact proposed change — the record does NOT exist yet after step 3's check.
- Only after step 4's explicit Confirm click does the record actually get created (step 5 confirms it now exists) — this is the single most important invariant in the whole ticket ("a write NEVER happens on the model's word"). If the record exists before Confirm is clicked, this is a Critical security/correctness bug.

---

### TC-CRX-026: Cancel discards the proposal — nothing is written

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** Same as TC-CRX-025.

**Steps:**
1. Trigger a write proposal.
2. Click Cancel instead of Confirm.
3. Independently verify the record was never created.

**Expected Result:**
- Cancel discards the proposal; no write occurs. Re-asking the same question afterward creates a fresh proposal (the old one isn't silently replayed).

---

### TC-CRX-027: A write executes exactly once, even if Confirm is clicked more than once

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** Same as TC-CRX-025.

**Steps:**
1. Trigger a write proposal.
2. Click Confirm.
3. Immediately click Confirm again (double-click, or re-click the same rendered card) if the UI allows it.

**Expected Result:**
- The write happens exactly once — no duplicate record from a double-confirm. If a duplicate is created, file as a High bug (replay-safety failure, explicitly claimed as a property of at least the CRX-46 write path in #116773 — "replay-safe, retryable on failure").

---

### TC-CRX-028: Suggest-only Work Package can never write, gate or no gate (the "sacred rule")

**User Role:** Any (agent-mediated write attempt).
**Precondition:** A Work Package configured as suggest-only autonomy level (per CRX-9's autonomy × gate × write-kind decision table). If suggest-only WPs aren't independently creatable via UI yet, test via the underlying `POST /api/workpackage`/`/api/gate` endpoints per `docs/API.md`.

**Steps:**
1. Set up (or identify) a suggest-only Work Package.
2. Attempt to trigger a write against it — with a gate unapproved, and separately with a gate approved.

**Expected Result:**
- In both cases (gate approved or not), the write is refused — a suggest-only WP can never write. This is stated as an inviolable rule in #116773 and is worth deliberately trying hard to break (approving the gate should NOT be sufficient to unlock a write on a suggest-only WP).

---

### TC-CRX-029: Gate approval requires project membership (cross-ref TC-CRX-005)

**User Role:** A user with `approve_crux_gates` on their role, but not a member of the target project.
**Precondition:** A pending gate exists on a Work Package in a project this user is not a member of.

**Steps:**
1. Attempt `POST /api/gate` (or the dashboard's approve action) as this user for that gate.

**Expected Result:**
- Refused — `approve_crux_gates` is `require: :member` (see `docs/CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-005). Confirm this holds specifically for the gate-approval action itself, not just page visibility.

---

### TC-CRX-030: Gate approval is always attributable

**User Role:** A project member with `approve_crux_gates`.
**Precondition:** A pending gate exists.

**Steps:**
1. Approve the gate.
2. Check the resulting record/audit trail for who approved it.

**Expected Result:**
- The approval is attributed to the real, logged-in approving user (`{wp_id, gate_id, approver}` per `docs/API.md`) — never anonymous, never the shared service account.

---

### TC-CRX-031: Frozen rules block a specific write even when otherwise gated-approved (CRX-39)

**User Role:** Administrator (frozen rules are admin-only, per `init.rb`).
**Precondition:** A frozen rule configured against a specific object/write-kind.

**Steps:**
1. As Administrator, create a frozen rule blocking a specific object-level write.
2. As a normal user, attempt that exact write through chat, including clicking Confirm on its proposal.

**Expected Result:**
- The write is blocked at execution time despite a human Confirm click — frozen rules are described as "object-level agent-write blocks," a layer above the standard gate. Confirm the user gets an honest refusal message, not a silent no-op or a fabricated success.

---

## Negative Cases

---

### TC-CRX-032: A write's failure (403/404/409/422) is reported honestly, never as a fabricated success

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A write proposal that will genuinely fail server-side — e.g. propose creating a record with a value known to be rejected (see CRM's `settings_get`/`settings_update` note: stage/status/source values outside the plugin's valid list are rejected), or target a permission the user's own Redmine account doesn't actually have.

**Steps:**
1. Trigger the proposal.
2. Click Confirm.
3. Check the reported outcome AND independently verify server-side whether anything was actually created (e.g. via a read tool call).

**Expected Result:**
- The chat reports a genuine failure/refusal with the real reason — not success. This is the exact bug class #116773 found and fixed once already (MCP tool layer formatting 403/404/409/422 as plain text, recorded as fabricated success with `id: None`).
- **UPDATE 2026-09-11 (dev reply, Q3):** dev confirmed the fix is NOT scoped to just `create_project`/`create_issue` — `proposals.py` has a dedicated `_looks_like_failure()` check that also covers the `generic_write` kind, which every one of the 9 plugin agents' tools routes through (CRM, Timesheet, Invoice, Helpdesk, Workload, KB, Testcase, Agile, Budget). Dev's own live sweep on 2026-09-10/11 demonstrated this working correctly on a real case: Timesheet's `approve` correctly **refused** a self-approval attempt with Redmine's real refusal message surfaced honestly, not faked as "approved." Treat this TC as **regression coverage** (re-confirm dev's own finding independently) rather than a from-scratch bug hunt — still worth running across a couple of different agents' write kinds for independent verification, not just trusting the dev's report.

---

### TC-CRX-033: Regression — confirm-fabrication guard is case-insensitive (newly fixed bug #1)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** LLM key configured. Per dev reply §"Two real bugs found and fixed during this sweep" (2026-09-10/11, commit `4771db6`): the guard that prevents a model from fabricating its own "Confirmed" outcome only matched a lowercase `"confirm?"` suffix — a reply ending in `"...Confirm?"` (capital C) slipped through the guard undetected.

**Steps:**
1. Attempt to reproduce a model turn whose proposal-offer text ends with capital-C `"Confirm?"` (may require several attempts/rephrasing since exact model wording isn't fully controllable — this is inherently a bit exploratory).
2. Check whether the guard still catches it (i.e. the system does not treat this as an already-fabricated confirmation).

**Expected Result:**
- Regardless of capitalization, the model's own text is never treated as if a human already confirmed — the fix (commit `4771db6`, merged to `master`, part of the "864 passing" test run per dev) should hold. If reproducible and still broken, this is a Critical regression (re-opened bug) — file immediately and reference the original fix commit.

---

### TC-CRX-034: Regression — confirm-fabrication guard catches trailing commentary (newly fixed bug #2)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** LLM key configured. Same fix commit as TC-CRX-033 (`4771db6`) — the guard previously missed cases where trailing text followed `"confirm?"` (either internal state-tracking leaking into the reply, or the model appending its own bracketed comment), since the original check required an exact suffix match.

**Steps:**
1. Attempt to reproduce a model turn where `"...confirm?"` is followed by any trailing text (a parenthetical, a bracketed note, extra commentary).
2. Check whether the guard still catches it correctly.

**Expected Result:**
- Trailing text after "confirm?" does not defeat the guard — same regression-risk profile as TC-CRX-033, same fix commit. File as Critical if reproducible and broken.

---

## Evidence Map

- Case IDs: TC-CRX-025 through TC-CRX-032
- Screenshots: bugs only.
- Log: —
- Bug reference: —
