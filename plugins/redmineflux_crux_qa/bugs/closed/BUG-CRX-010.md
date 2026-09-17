# Bug Report Template

- Bug ID: BUG-CRX-010
- Production Redmine Issue ID: #120659
- Title: Keeping/saving a write-confirmed chat turn as a Session Artifact captures only the pre-execution proposal text — the actual outcome (e.g. the created record) is silently omitted from the saved artifact
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Manager, `use_ask_crux`)
- Date: 2026-09-15

## Steps to reproduce

1. In `/crux/ask`, start a new chat and ask `@crux create an issue titled "TC-CRX-054 Keep Write Test" in the Crux QA project`.
2. Click Confirm on the resulting proposal card. Verify the turn now shows the real outcome inline: `✓ Created #7` (a real, clickable link to the new issue).
3. Click **Keep** on that same turn (available well after the outcome has already rendered — not a race/timing issue).
4. Open the **Artifacts** panel (button next to Share, top of the chat thread) and click into the newly-listed entry to read it back.
5. Compare the artifact's displayed content against the live chat thread's rendering of the same turn.
6. For contrast, repeat steps 1–5 on a plain read-only turn (e.g. `@crux what is Redmine issue #6 about?`) that has no confirm/outcome step at all.

## Expected result

- Per TC-CRX-054 (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`) and #117162's acceptance criteria ("a kept chat reply from a write-enabled agent still pins/displays correctly... doesn't show 'pending' after the write already executed") and TC-CRX-055's "read it back (full content, not truncated)": a Session Artifact saved from a write-confirmed turn should preserve the turn's real, final content — including the outcome that actually happened — not just the pre-execution proposal text.

## Actual result

- **Live chat thread (both on first render and after a full page reload):** correctly shows both the proposal text ("I'll create this issue — confirm?") AND the real outcome (`✓ Created #7`, linking to the real issue) together, with a "Kept ✓" badge. This part is accurate and persists correctly (confirmed via TC-CRX-054, PASS).
- **The Artifacts panel's saved snapshot of the exact same turn**, opened via the Artifacts button → clicking the listed entry: shows **only** `→ asking the Project Manager… I'll create this issue — confirm?` — the `✓ Created #7` outcome is completely absent from the artifact content. Someone reading only the saved artifact (its stated purpose — a durable, reusable saved version of the turn) would have no way to know the write executed, what it created, or that anything happened after the proposal was made.
- **Contrast test on a plain read-only turn** (no confirm/outcome step): the Artifacts panel's saved snapshot reproduces the full live content faithfully, paragraph-for-paragraph, including all three acceptance-criteria bullet points from the original reply. This isolates the gap specifically to turns that go through the confirm→outcome flow — the artifact-save path captures the message's original text content but does not include whatever mechanism injects the post-confirm outcome into the live view.
- Root cause is not confirmed from the black box (no source access to crux-core's artifact-save endpoint from this session), but the pattern is consistent with the outcome badge being attached to the turn as separate data (populated by the `/crux/ask/confirm` response) rather than being merged into the same message-content field that Session Artifacts/Keep persists — since the live view's outcome *does* survive a full page reload (so it's genuinely stored server-side somewhere), just not wherever the artifact-save reads from.

## Evidence

### Screenshot

Not captured — text-content comparison, not a rendering defect; verified via two side-by-side Artifacts-panel readbacks (write-turn vs. read-turn) and the live chat thread's own content.

### Console / log

- Live chat (session ses-137, after full navigate-away-and-back): turn shows `I'll create this issue — confirm?` ... `Kept ✓` ... `✓ Created` `#7` (linking to `/issues/7`).
- Artifacts panel readback of the same turn (`by chat · run run-594 · 2026-09-15T10:25:31+00:00`): only `→ asking the Project Manager…` / `I'll create this issue — confirm?` — no outcome.
- Contrast: Artifacts panel readback of a plain read-only turn (`by chat · run run-593 · 2026-09-15T10:24:37+00:00`) reproduces the full reply verbatim, all paragraphs and bullet points intact.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `assets/javascripts/crux.js`: the Keep button's saved text (`btn._keepText`) is now mutable rather than a fixed closed-over string. `CruxProposal.decide()`'s success branch extends it with the real outcome (`resultText(res.result, ctx.kind)`) the moment a confirm resolves, and `renderTurns()` (session reload/replay) pre-computes the same extended text up front for any turn whose proposal is already `executed` — so both the live-then-Keep path and the reload-then-Keep path save the full outcome, not just the pre-confirm proposal text.

**Retest steps:** New chat → `@crux create an issue titled "BUG-CRX-010 retest keep artifact" in the Crux QA project` → Confirm → outcome rendered inline (`✓ Created #11`) → clicked **Keep** (after the outcome had already rendered, same as the original repro) → opened the Artifacts panel → clicked into the new entry.

**Result:** The saved artifact now reads: *"→ asking the Project Manager… I'll create this issue — confirm? ✓ Created #11"* (with a real, clickable link to `/issues/11`) — the full outcome is present, not just the pre-execution proposal text.

**Verdict: FIXED.**

## Production report

Reported to production as issue **#120659** (`ztflux`, Tracker Bug, Priority **Medium**, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120487** (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, where it was found via TC-CRX-055), Environment "Window 11 + Chrome" — testcase marked **Failed**. Attachments: `BUG-CRX-010.pdf` (5.3 KB) and this MD file (4.7 KB), both confirmed size-exact against production.
