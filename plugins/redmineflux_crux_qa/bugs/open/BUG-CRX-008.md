# Bug Report Template

- Bug ID: BUG-CRX-008
- Production Redmine Issue ID: #120613
- Title: The chat write-confirm gate (CRX-35) never checks a target ticket's Work Package autonomy — a `suggest-only` WP's member tickets can be written to via chat, violating the documented "sacred rule," with or without gate approval
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Manager, `use_ask_crux`)
- Date: 2026-09-15

## Steps to reproduce

1. Create a Work Package with `"autonomy": "suggest-only"` bound to a real Redmine issue, via `POST /api/workpackage` (no UI path currently exists to set autonomy at creation — see Note for triage):
   ```json
   {"id": "wp-crx028", "goal": "TC-CRX-028 sacred rule test", "members": [3], "autonomy": "suggest-only", "outcome_type": "software"}
   ```
2. In Ask Crux chat, ask to change that ticket, e.g. `update issue #3 to set its status to Closed`.
3. Click **Confirm** on the resulting proposal card.
4. Independently verify the issue's real state (fresh page load).
5. Approve the WP's entry gate (`POST /api/gate {"wp_id":"wp-crx028","gate_id":"requirements-approve","approver":"luna.blossom"}`) and repeat steps 2–4 with a different field (e.g. Priority), to test the "gate approved" case too.

## Expected result

- Per `redmineflux-crux-core/crux_core/engine/write_policy.py` (`if wp.get("autonomy") == "suggest-only": return False, "work package '...' is suggest-only — writes are never allowed"`, explicitly commented `HOLDOUT (sacred, CRX-9 §9/§10 P3): a suggest-only Work Package can NEVER produce a Flux write, through any endpoint, regardless of gate state. Never relax this to make a test pass.`) and TC-CRX-028's own Expected Result ("In both cases (gate approved or not), the write is refused... approving the gate should NOT be sufficient to unlock a write on a suggest-only WP"), a write against a ticket that is a member of a `suggest-only` Work Package must be refused, unconditionally, through every endpoint — including the chat confirm-gate path.

## Actual result

- **Gate unapproved:** `update issue #3 to set its status to Closed` → Project Manager proposes the change → clicking Confirm actually executes it. Verified on a fresh page load: `Bug #3 ... closed`, journal entry `Status changed from New to Closed`, and the issue's own "Work Package" panel explicitly showing `Part of wp-crx028 — stage: clarify — no gate` at the time of the write.
- **Gate approved:** after approving `wp-crx028`'s `requirements-approve` gate, `update issue #3 to set priority to High` → Confirm → executes again. Verified: journal entry `Priority changed from Normal to High`.
- **Root cause (source-confirmed):** `redmineflux-crux-core/crux_core/askcrux/proposals.py`'s `confirm()` function — the function backing the chat's Confirm button (`POST /api/chat` proposal → `/crux/ask/confirm` on the plugin side) — checks **frozen rules** for `kind == "update_issue"` (lines ~1073–1094) but contains **zero reference to Work Package autonomy or `write_policy.py` anywhere in the file** (confirmed via grep — no `suggest-only`, `autonomy`, or `write_policy` call site exists in `proposals.py` outside of a code *comment* documenting the gap). The comment at line 1063 states explicitly: *"CRX-39 — frozen rules bind chat-confirmed writes too, not just the dispatch/claim path (engine/write_policy.py): a second call site, since CRX-35's confirm gate predates write_policy and calls the MCP client directly, structurally separate from it."* This confirms the gap is structural and known-to-the-comment, but the consequence — that WP-autonomy specifically (as opposed to frozen rules) was never carried over to this second call site — does not appear to have been tested or flagged as a live gap anywhere in the codebase or release notes.
- Because the check is entirely absent (not merely misconfigured), gate state is irrelevant to the outcome — both the gate-unapproved and gate-approved attempts succeeded identically, which is a stronger and more concerning failure than TC-CRX-028 itself anticipated (it worried specifically that "approving the gate should NOT be sufficient" — but in fact *neither* gate state has any bearing at all, because the WP is never even looked up on this path).
- Every one of the 9 domain-agent write proposals (CRM, Timesheet, Invoice, Helpdesk, Workload, KB, Testcase, Agile, Budget), and the core `update_issue`/`create_issue` kinds, route through this same `confirm()` function — so this gap is not limited to core Redmine issue writes; it applies to any chat-confirmed write against a ticket bound to a `suggest-only` Work Package, across every plugin domain.

## Evidence

### Screenshot

Not captured — behavioral finding confirmed via the real Redmine issue journal (Property changes tab) and source code, not a rendering defect.

### Console / log

- `POST /api/workpackage` → `{"ok": true, "work_package": {"id": "wp-crx028", ..., "autonomy": "suggest-only", ..., "stage": "clarify", ...}}`
- Chat: `@crux update issue #3 to set its status to Closed` → `→ asking the Project Manager…I'll change #3 — confirm?` → Confirm → `✓ #3 updated: Status: Closed`.
- Fresh reload of `/issues/3`: `Bug #3 ... closed`, journal `Status changed from New to Closed`, Work Package panel: `Part of wp-crx028 — stage: clarify — no gate`.
- `POST /api/gate {"wp_id":"wp-crx028","gate_id":"requirements-approve","approver":"luna.blossom"}` → `{"ok": true, "message": "gate 'requirements-approve' approved by luna.blossom"}`.
- Chat: `@crux update issue #3 to set priority to High` → Confirm → `✓ #3 updated: Priority: High`.
- Fresh reload of `/issues/3`: journal `Priority changed from Normal to High`.
- Source: `crux_core/engine/write_policy.py` lines 93–98 (the real sacred-rule check, only reachable from the dispatch/claim/complete path). `crux_core/askcrux/proposals.py` lines 1063–1094 (the chat confirm path's only governance check — frozen rules, no WP/autonomy check at all).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Note for triage

- No UI path was found for setting a Work Package's autonomy to `suggest-only` at creation (tested via the API directly, per the same limitation noted in TC-CRX-069/TC-CRX-028's own precondition text: "If suggest-only WPs aren't independently creatable via UI yet, test via the underlying endpoints"). This doesn't reduce the severity of the finding — any WP created via the documented `POST /api/workpackage` API with `autonomy: "suggest-only"` is vulnerable the moment a user reaches it through chat, regardless of how it was created.
- Suggested fix: `proposals.py`'s `confirm()` should call the same target-resolution + `write_policy.evaluate_write()` (or equivalent) that `write_policy.py`'s dispatch path already uses, for every write kind that names an existing issue — not just frozen rules — so a ticket's Work Package binding and autonomy level are enforced identically regardless of which of the two structurally-separate write paths (dispatch/claim vs. chat-confirm) executes the write.
- Suggest checking whether `create_issue` (which does bind a fresh ticket to no WP yet, so is lower-risk) and any other write kind beyond `update_issue` share this same gap — this investigation only exercised `update_issue`, but the `confirm()` function's structure (frozen-rule check scoped to `kind == "update_issue"` only, no WP check anywhere) suggests the gap is uniform across all write kinds, not unique to this one.

## Production report

Reported to production as issue **#120613** (`ztflux`, Tracker Bug, Priority **Blocker** — mapped from local Critical severity, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120484** (`CRUX_WRITE_CONFIRM_GATE.md`, where it was found via TC-CRX-028), Environment "Window 11 + Chrome" — testcase marked **Failed**, defect relation `#120484 defect #120613` confirmed. Attachments: `BUG-CRX-008.pdf` (7.3 KB) and this MD file (7.6 KB), both confirmed size-exact against production.
