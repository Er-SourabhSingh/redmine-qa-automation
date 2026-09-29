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
   {"id": "wp-crx028", "goal": "TC-CRX-164 sacred rule test", "members": [3], "autonomy": "suggest-only", "outcome_type": "software"}
   ```
2. In Ask Crux chat, ask to change that ticket, e.g. `update issue #3 to set its status to Closed`.
3. Click **Confirm** on the resulting proposal card.
4. Independently verify the issue's real state (fresh page load).
5. Approve the WP's entry gate (`POST /api/gate {"wp_id":"wp-crx028","gate_id":"requirements-approve","approver":"luna.blossom"}`) and repeat steps 2–4 with a different field (e.g. Priority), to test the "gate approved" case too.

## Expected result

- Per `redmineflux-crux-core/crux_core/engine/write_policy.py` (`if wp.get("autonomy") == "suggest-only": return False, "work package '...' is suggest-only — writes are never allowed"`, explicitly commented `HOLDOUT (sacred, CRX-9 §9/§10 P3): a suggest-only Work Package can NEVER produce a Flux write, through any endpoint, regardless of gate state. Never relax this to make a test pass.`) and TC-CRX-164's own Expected Result ("In both cases (gate approved or not), the write is refused... approving the gate should NOT be sufficient to unlock a write on a suggest-only WP"), a write against a ticket that is a member of a `suggest-only` Work Package must be refused, unconditionally, through every endpoint — including the chat confirm-gate path.

## Actual result

- **Gate unapproved:** `update issue #3 to set its status to Closed` → Project Manager proposes the change → clicking Confirm actually executes it. Verified on a fresh page load: `Bug #3 ... closed`, journal entry `Status changed from New to Closed`, and the issue's own "Work Package" panel explicitly showing `Part of wp-crx028 — stage: clarify — no gate` at the time of the write.
- **Gate approved:** after approving `wp-crx028`'s `requirements-approve` gate, `update issue #3 to set priority to High` → Confirm → executes again. Verified: journal entry `Priority changed from Normal to High`.
- **Root cause (source-confirmed):** `redmineflux-crux-core/crux_core/askcrux/proposals.py`'s `confirm()` function — the function backing the chat's Confirm button (`POST /api/chat` proposal → `/crux/ask/confirm` on the plugin side) — checks **frozen rules** for `kind == "update_issue"` (lines ~1073–1094) but contains **zero reference to Work Package autonomy or `write_policy.py` anywhere in the file** (confirmed via grep — no `suggest-only`, `autonomy`, or `write_policy` call site exists in `proposals.py` outside of a code *comment* documenting the gap). The comment at line 1063 states explicitly: *"CRX-39 — frozen rules bind chat-confirmed writes too, not just the dispatch/claim path (engine/write_policy.py): a second call site, since CRX-35's confirm gate predates write_policy and calls the MCP client directly, structurally separate from it."* This confirms the gap is structural and known-to-the-comment, but the consequence — that WP-autonomy specifically (as opposed to frozen rules) was never carried over to this second call site — does not appear to have been tested or flagged as a live gap anywhere in the codebase or release notes.
- Because the check is entirely absent (not merely misconfigured), gate state is irrelevant to the outcome — both the gate-unapproved and gate-approved attempts succeeded identically, which is a stronger and more concerning failure than TC-CRX-164 itself anticipated (it worried specifically that "approving the gate should NOT be sufficient" — but in fact *neither* gate state has any bearing at all, because the WP is never even looked up on this path).
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

## 2026-09-16 retest — FIXED (update_issue scope), confirmed live

Dev's `CHANGES.md` handoff added `write_policy.evaluate_autonomy(wp)` (factored out of `check()` so it's callable outside the 4 dispatch-path `WRITE_KINDS`) and `write_policy.wp_for_issue(db, iid)` (the same lookup `/api/workpackage_for_issue` already used). `proposals.py`'s `confirm()` now calls both, scoped to `kind == "update_issue"` (matching the existing frozen-rule check's own documented v1 scope, same limitation, explicitly commented as such — not a new gap introduced by this fix).

**Retest steps:**
1. Recreated the exact scenario live (crux-core's WP state is in-memory, wiped by today's restart): via Ask Crux chat, created `wp-002` bound to real issue #3 (`TC-CRX-161 Write Gate Test`, a dedicated fixture from the original finding) with `autonomy: suggest-only`, gate unapproved (default `clarify` stage, no gate).
2. Sent the exact original repro message: `update issue #3 to set its status to Closed`. A real "Update issue" proposal appeared (`Issue: #3, Status: Closed`).
3. Clicked Confirm.

**Result:** The confirm was refused — `POST /crux/ask/confirm` returned `400 Bad Request`, and the UI surfaced the exact sacred-rule message: **"work package 'wp-002' is suggest-only — writes are never allowed."** Fresh reload of `/issues/3` confirms no new journal entry was added — the only "Status changed from New to Closed" and "Priority changed from Normal to High" entries are both timestamped "1 day ago" (from the *original*, pre-fix bug reproduction on 2026-09-15) — today's attempt produced zero effect.

**Verdict: FIXED**, for the confirmed original repro (`update_issue`, gate-unapproved case). Not separately re-verified: the gate-approved case (original bug's second scenario) — not re-tested live this session, but the fix's `evaluate_autonomy()` call is unconditional on gate state (checks `autonomy == "suggest-only"` before ever looking at `gates.can_advance()`), so the same refusal applies structurally regardless of gate approval. **Known, dev-documented remaining gap** (not a regression, pre-existing and explicitly scoped out): the fix is `update_issue`-only, same as the adjacent frozen-rule check — the 9 domain-plugin write kinds (CRM, Timesheet, Invoice, Helpdesk, Workload, KB, Testcase, Agile, Budget) and `create_issue` are NOT covered by this specific fix and likely still share the original gap. Recommend flagging this to the dev as a follow-up scope, not blocking this bug's closure (which was filed and fixed specifically against the `update_issue` reproduction).

## 2026-09-28 retest — generalized fix does NOT work, STILL REPRODUCES (contradicts dev's claimed live proof)

Dev's 2026-09-28 journal note claims a generalized fix (`_issue_id_for_wp_check(kind, args)`) now covers every write kind, specifically citing this exact Agile `move_issue` counter-example as fixed and live-verified (`redmineflux-crux-core master @ 445ba0f`).

**Retest, exactly reproducing the counter-example:**
1. Created a fresh suggest-only WP via the real API: `POST http://localhost:8787/api/workpackage` — `{"id":"wp-crx008-retest0928","members":[10],"autonomy":"suggest-only","outcome_type":"software"}`. Confirmed bound correctly: `GET /api/workpackage_for_issue?issue_id=10` → resolves `wp-crx008-retest0928`, `autonomy: "suggest-only"`.
2. Chat: "Scrum Agent, move issue 10 to In Progress." → "Project crux-qa." → real `Agile Move Issue` proposal (Project: Crux QA, Issue: 10, Column Name: In Progress), real Confirm/Cancel buttons. Confirmed it.
3. **Result:** `"✓ Issue #10 moved to 'In Progress' (status #2) in project crux-qa."` — a real success claim, not a refusal.

**Verified against the real record** (independent of the chat claim): reloaded `/issues/10` — Status field genuinely reads **In Progress**. Real journal entry: *"Status changed from Rejected to In Progress ... Status changed via Agile Board API"*, timestamped ~2 minutes after the confirm click. The write genuinely persisted — this is not a fabrication, it is a real, unrefused write against a suggest-only WP's member ticket, through the exact chat path (Agile Move Issue) the dev's fix claims to cover.

**Verdict: STILL REPRODUCES.** The dev's generalized fix does not actually block this write, directly contradicting the "Live end-to-end proof" in the 2026-09-28 journal entry (which showed a real `generic_write`-shaped proposal being correctly refused in an isolated test harness call, but evidently doesn't hold when driven through the real chat `Agile Move Issue` path end-to-end). Reopening again with this fully-verified, real-UI reproduction — not a source-level or isolated-harness claim this time.

## 2026-09-25 (continued) — reopened on production (#120613 → Reopen status)

Reported the domain-plugin gap confirmation plus the Agile counter-example below to production as a journal note, and set the issue's status to **Reopen** (id 9) — the dev had left it at "In QA" pending a broader fix per his own 2026-09-16 note; since our retest confirms that broader fix still hasn't landed, Reopen is the correct status to kick it back to him rather than leaving it in QA limbo.

## 2026-09-25 (continued) — dev's own scope argument does not hold for the Agile plugin

The dev's first journal entry (#120613, 2026-09-15) argues the 9 domain-plugin write kinds structurally can't be vulnerable, since Work Package membership (`wp["members"]`) is a list of **Redmine issue ids**, and plugin-domain writes (a CRM contact id, an invoice id, ...) have no relationship to a Redmine issue id — so there's no `iid` to look a WP up against.

**This argument doesn't hold for the Agile plugin.** `Agile Move Issue` (the exact tool BUG-CRX-031 exercises, confirmed FIXED 2026-09-25) targets a real Redmine issue by its real issue ID — moving card #10 is `move_issue(issue_id=10, ...)`. A suggest-only WP bound to issue #10 would have a real `iid` to look up, exactly like `update_issue` does — but `proposals.py`'s `confirm()` only checks `wp_for_issue`/`evaluate_autonomy` when `kind == "update_issue"`, so an Agile board-column move against a suggest-only WP's member ticket would still bypass the sacred-rule holdout entirely, contrary to the dev's blanket claim that only `update_issue`/`create_issue` were ever at risk.

Not independently live-tested this session (would require creating a fresh suggest-only WP bound to a real issue via the raw API, same precondition constraint the original bug documents). Recommend raising this specific counter-example (Agile `move_issue`) back to the dev rather than accepting the "structurally can't apply" framing as final — it's likely also true for other plugin write kinds that target real Redmine issues (e.g. Checklist, Tags, or any plugin whose writes reference `issue_id` directly rather than a plugin-internal record id).

## 2026-09-25 retest — update_issue scope still fixed; domain-plugin gap still NOT fixed, source-verified

Re-checked `proposals.py`'s `confirm()` directly (source, not live UI) rather than re-running the full live repro, since the 2026-09-16 retest already live-confirmed the `update_issue` refusal and the open question was specifically whether the known remaining gap (the 9 domain-plugin write kinds + `create_issue`) had since been closed.

The `write_policy.wp_for_issue()` / `evaluate_autonomy()` call (lines ~1169–1182) is still nested **inside `if kind == "update_issue":`** (line 1139) — unchanged since the 2026-09-16 fix. No equivalent check exists anywhere else in the file for CRM, Timesheet, Invoice, Helpdesk, Workload, KB, Testcase, Agile, or Budget write kinds, nor for `create_issue`.

**Verdict: No change.** `update_issue` remains correctly fixed (per the 2026-09-16 live retest). The documented remaining gap — a `suggest-only` Work Package's member ticket is still writable via any of the 9 domain-plugin agents' chat-confirm path — remains open and unaddressed. Recommend keeping this bug open (or filing the domain-plugin gap as its own follow-up) until that scope is covered.

## 2026-09-28 post-restart retest — FIXED, reverses same-day "still reproduces" finding (stale code confirmed as root cause)

Both `crux-core` and `crux-redmine` containers had been running since 2026-09-28T05:04:51Z — **before** all of the dev's fix-commit journal timestamps (05:39–06:44 UTC that day). The "STILL REPRODUCES" retest earlier today was run against those same stale, pre-fix containers. Per the user's explicit instruction, properly restarted the stack (`docker compose build mcp` — cached, no mcp-side changes; `docker restart crux-core`; `docker restart crux-redmine`) and re-ran the exact same repro from scratch.

**Retest steps (identical repro to the "still reproduces" entry above):**
1. crux-core's in-memory WP store was wiped by its restart (expected, undocumented-persistence behavior, previously observed). Recreated the fixture: `POST http://localhost:8787/api/workpackage` — `{"id":"wp-crx008-restart-retest","goal":"BUG-CRX-008 retest 2026-09-28 - Agile move_issue counter-example","members":[10],"autonomy":"suggest-only","outcome_type":"software"}`, bound to the same real issue #10.
2. crux-core's OpenRouter provider/key (needed for a real, non-echo chat response) was also wiped by the restart — re-added via `/crux/admin/keys` (provider `openrouter`, openai-compatible, cloud, `https://openrouter.ai/api/v1`, default model `anthropic/claude-haiku-4.5`) and verified genuinely working via "Check remaining credit" ($4.70 of $5.00 remaining — a real, non-fabricated API response).
3. New chat session. Sent: "Scrum Agent, move issue 10 to Feedback in project crux-qa." → real `Agile Move Issue` proposal appeared (Project: Crux QA, Issue: 10, Column Name: Feedback), with the proposal card additionally showing the line **"work package 'wp-crx008-restart-retest' is suggest-only — writes are never allowed"** directly under the proposal table, before any Confirm click.
4. Clicked Confirm anyway to verify the refusal actually holds through to the backend, not just as UI copy.

**Result:** No new write occurred. Fresh reload of `/issues/10`: Status field still reads **In Progress** (unchanged from the prior retest's state), and the journal shows only the two pre-existing entries (`Rejected → In Progress`, timestamped ~3 hours earlier) — no new `In Progress → Feedback` entry was added.

**Verdict: FIXED.** This exactly reverses the "STILL REPRODUCES" verdict recorded earlier the same day. The dev's generalized fix (`_issue_id_for_wp_check`, `master @ 445ba0f`) does correctly block the Agile `move_issue` counter-example — the earlier failure was a stale-code artifact (containers never restarted after the fix commit landed), not a real regression. **Recommend correcting the production issue** (#120613, currently at Reopen/status_id=9 from the stale-code finding) back to a status reflecting this confirmed fix, with a note explaining the stale-container correction — pending user approval before any further production write.

## Note for triage

- No UI path was found for setting a Work Package's autonomy to `suggest-only` at creation (tested via the API directly, per the same limitation noted in TC-CRX-128/TC-CRX-164's own precondition text: "If suggest-only WPs aren't independently creatable via UI yet, test via the underlying endpoints"). This doesn't reduce the severity of the finding — any WP created via the documented `POST /api/workpackage` API with `autonomy: "suggest-only"` is vulnerable the moment a user reaches it through chat, regardless of how it was created.
- Suggested fix: `proposals.py`'s `confirm()` should call the same target-resolution + `write_policy.evaluate_write()` (or equivalent) that `write_policy.py`'s dispatch path already uses, for every write kind that names an existing issue — not just frozen rules — so a ticket's Work Package binding and autonomy level are enforced identically regardless of which of the two structurally-separate write paths (dispatch/claim vs. chat-confirm) executes the write.
- Suggest checking whether `create_issue` (which does bind a fresh ticket to no WP yet, so is lower-risk) and any other write kind beyond `update_issue` share this same gap — this investigation only exercised `update_issue`, but the `confirm()` function's structure (frozen-rule check scoped to `kind == "update_issue"` only, no WP check anywhere) suggests the gap is uniform across all write kinds, not unique to this one.

## Closed 2026-09-28 — production issue #120613 updated to Done/100%

Production corrected with a note explaining the stale-container correction (see notes on the issue). Closed locally per the confirmed post-restart FIXED verdict.

## Production report

Reported to production as issue **#120613** (`ztflux`, Tracker Bug, Priority **Blocker** — mapped from local Critical severity, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120484** (`CRUX_WRITE_CONFIRM_GATE.md`, where it was found via TC-CRX-164), Environment "Window 11 + Chrome" — testcase marked **Failed**, defect relation `#120484 defect #120613` confirmed. Attachments: `BUG-CRX-008.pdf` (7.3 KB) and this MD file (7.6 KB), both confirmed size-exact against production.
