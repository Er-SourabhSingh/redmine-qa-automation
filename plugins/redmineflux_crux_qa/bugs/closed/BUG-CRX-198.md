# Bug Report

- Bug ID: BUG-CRX-198
- Production Redmine Issue ID: #128754 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127781 (CRUX_AGENT_IMPROVER), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Improver's description-update confirm reports "✓ updated" with the new text shown, but the real issue description never changes when the acting user lacks Edit permission — regression of the historical BUG-CRX-009 shape, on a new write path
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Improver agent, `redmineflux_core_update_issue` governed write)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: `luna.blossom` (Manager role, temporarily stripped of `Edit issues`/`Edit own issues`, restored after this TC — same construction pattern as the historical suite's TC-CRX-158)
- Date: 2026-11-16

## Steps to reproduce

1. On `Administration → Roles → Manager`, temporarily uncheck `Edit issues` and `Edit own issues` (restored
   immediately after this test).
2. Log in as `luna.blossom` (Manager role on the target project, no other role grants Edit).
3. Improver pinned, on issue #99 (already has a well-structured description with Acceptance Criteria): ask
   "Improver, improve the description of issue 99." It proposes a minor rewrite.
4. Confirm the proposal ("Yes, apply this.") — triggers an `Update issue` confirm card showing the full new
   description text.
5. Confirm the card.
6. Native-verify: `redmineflux_core_get_issue(99)` and the real `/issues/99` page.

## Expected result

Since `luna.blossom` genuinely lacks `Edit issues`/`Edit own issues` on this project, Redmine's own permission
check should refuse the write. The confirm response must say so honestly — a real error, not a claimed success
— per the historical finding in `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-158 / closed BUG-CRX-009
(fixed 2026-09-25). This TC was run specifically to confirm whether that fix still holds on the current
architecture's write path.

## Actual result

The chat response read: *"✓ #99 updated: Description: **Problem** Users currently have to manually copy
report data... **Solution** Add an 'Export CSV' button..."* — displaying the proposed NEW text as if it had
been successfully written.

Native-verified via both the MCP tool and a fresh navigation to `/issues/99`: **the description is completely
unchanged** — still the original text verbatim (`**Problem:**... **Proposed change:**...` — note the real
stored text still says "Proposed change:", while the chat's "✓ updated" message showed "**Solution**", the
NEW wording — proving the chat displayed the proposed write as applied when it demonstrably was not).

Oddly, `updated_on` **did** advance (from `12:53:16Z` to `13:34:31Z`), and the issue page's own "Updated X
minutes ago" byline changed — but the real `/issues/99` page shows **zero visible history/journal entries**
and the description field itself never changed. This suggests some partial effect occurred at the Redmine
side (a touch or a save attempt that failed validation after touching `updated_on`), not a fully clean
refusal — the write is neither a clean no-op nor a real success, and the chat's "✓ updated" claim is false
either way.

Confirmed the permission strip was genuinely in effect throughout (re-checked `/roles/4/edit` immediately
after, both checkboxes still unchecked, before restoring them).

## Evidence

### Console / log

- Chat reply (verbatim, final message): *"✓ #99 updated: Description: **Problem** Users currently have to
  manually copy report data out of the UI table to analyze it in a spreadsheet, which is slow and
  error-prone for large reports. **Solution** Add an 'Export CSV' button to the top-right of the reports page
  toolbar. Clicking it downloads the currently-filtered report view as a UTF-8 CSV file, matching the columns
  currently visible on screen and respecting the ac..."*
- Native state before: `redmineflux_core_get_issue(99)` → `Updated: 2026-11-16T12:53:16Z`, description
  contains `**Proposed change:**`.
- Native state after: `redmineflux_core_get_issue(99)` → `Updated: 2026-11-16T13:34:31Z` (changed), description
  **still** contains `**Proposed change:**` verbatim (unchanged from before — not the "Solution" wording the
  chat claimed to have written).
- `/issues/99` native page (admin session, after restoring permissions): description section renders the
  original `Problem:`/`Proposed change:`/`Acceptance Criteria:` text exactly as before; no visible History/
  journal section with any entries.

## Duplicate check

- Duplicate found: No, but closely related — this is a **regression of the historical, closed BUG-CRX-009**
  (fixed 2026-09-25, `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-158), reproducing the identical
  misleading-success shape on the Improver agent's current chat-based confirm-card write path rather than the
  old dedicated `/crux/improve/confirm` panel endpoint. Filed as a fresh bug per TC-CRX-693's own instruction
  ("file it as a fresh bug, cross-reference the historical TC, don't assume it's already known"), since the
  underlying endpoint clearly changed architecture since 2026-09-25 and this specific path was never
  independently retested until now.

## Retest — 2026-11-17 (CONFIRMED FIXED)

Developer moved this to "In QA" on production. Pulled latest code — `redmineflux-crux-core` picked up CRC-111
"update-not-saved-is-not-success," confirming the exact root cause. Rebuilt/restarted the stack, verified
healthy.

Re-ran the exact original repro: stripped `Edit issues`/`Edit own issues` from the Manager role again
(restored immediately after). As `luna.blossom`, proposed and confirmed a description rewrite on issue #99.
This time the confirm card's own result text read: *"Redmineflux did not save the description of #99: it is
unchanged. You may not have permission to edit this issue (Edit issues or Edit own issues). Ask your
administrator for that permission, then confirm again."* — an honest, explicit error, no false "✓ updated"
claim. Native-verified via `get_issue(99)`: description genuinely unchanged, matching the honest error.
**Confirmed FIXED.** Permissions restored and re-verified immediately after.
