# Bug Report Template

- Bug ID: BUG-RKB-001
- Production Redmine Issue ID: #119878 (pre-existing production bug, retested this session; not newly filed)
- Title: KB Editor toolbar: Heading/Font Family/Font Size dropdowns — FULLY FIXED as of 2026-11-26 (rkb-103, PR #12). All 7 acceptance criteria now pass.
- Redmine version: 6.0-bookworm (local Docker instance, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_knowledgebase
- Plugin version: master (originally pulled 2026-11-24 at `65f89f9`; re-pulled 2026-11-26, fast-forwarded `65f89f9..df12beb` — PR #12 "fix/rkb-103-toolbar-font-size-sync", commit `4caf859`, genuinely changes `assets/javascripts/flux_library.js`)
- Environment: Local Docker, Postgres
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-09-02 (original bug) / 2026-11-24 (first retest, 6/7 PASS) / 2026-11-26 (final retest, 7/7 PASS)

## Final retest (2026-11-26) — AC#6 (toolbar sync) CONFIRMED FIXED

Pulled `redmineflux_knowledgebase` from master (`65f89f9` → `df12beb`, PR #12 / commit `4caf859`, "rkb-103: Sync
Font Size between the sticky and floating toolbars"), restarted `redmine`, cleared the browser cache (per the
developer's own retest note, so the new `flux_library.js` loads), then followed the developer's own retest
steps exactly on a fresh KB page (`crux-kb-agent-test-project` > Engineering Docs > "BUG-RKB-001 rkb-103
retest", node 20):

| Step | Sticky toolbar | Floating toolbar | Selection kept | Result |
|---|---|---|---|---|
| Select the line (baseline) | 11 | 11 | — | PASS |
| Sticky toolbar: 24, no reselect | 24 | 24 | yes | PASS |
| Sticky toolbar: 48, no reselect | 48 | 48 | yes | PASS |
| Floating toolbar: 36, no reselect | 36 | 36 | yes | PASS |
| Sticky toolbar: Heading 1 | 20 | 20 | yes | PASS |
| Paragraph, then 24; autosave; genuine reload; reselect | 24 | 24 | — | PASS |
| Legacy `<font size="5">` content (saved + genuine reload), reselected | 24 | 24 (computed `font-size: 24px`) | — | PASS |

All 7 steps PASS — the sticky and floating/bubble toolbars now read and update together without needing to
reselect text, text selection survives a size/heading change (previously it was dropped, per the developer's
own root-cause note), and legacy `<font>` content still renders and reads correctly (no regression). **AC#6 is
now genuinely fixed — this closes the one remaining gap from the 2026-11-24 retest.** All 7 of #119878's
acceptance criteria now PASS.

## Steps to reproduce (the one still-failing item — AC#6, toolbar sync)

1. Log in as admin, open any Knowledgebase page in edit mode (`/projects/:id/knowledgebase/nodes/:id?edit=true`).
2. Type a line of text, select it (Ctrl+A).
3. In the **sticky** (main) toolbar's Font Size dropdown, pick a new numeric size (e.g. 48).
4. Without reselecting the text, check the **floating/bubble** toolbar's own Font Size dropdown for the same selection (it appears separately, lower on the page in this build).

## Expected result

- Per the ticket's own acceptance criterion #6: "Sticky toolbar and floating/bubble selection toolbar show identical, synced state (Heading/Font/Font Size) for the same cursor position or selection, verified by selecting text, applying a size from one toolbar, and confirming the other toolbar reflects it **without needing to reselect**."

## Actual result

- The sticky toolbar's dropdown correctly shows the newly applied value, but the floating/bubble toolbar's own dropdown keeps showing the **previous** value until the text is reselected — reproduced cleanly, twice, using genuine Playwright `selectOption()` UI interactions (not raw JS), reading the actual rendered DOM state each time:
  - Round 1: sticky → 24, bubble → 11 (stale, pre-test default).
  - Round 2 (after a fresh reselect first, confirming both were in sync at 24): sticky → 48, bubble → 36 (stale — the value from the *previous* round, one step behind).
- Reselecting the text (fresh Ctrl+A) does make the bubble toolbar catch up to the sticky toolbar's current value — but the acceptance criterion explicitly requires this to work *without* reselecting.

## Other acceptance criteria — retested, all PASS

1. **Heading dropdown never shows a blank/placeholder option.** `<select>`'s own option list is now `Paragraph, Heading 1–6` — no "Heading" placeholder item at all; "Paragraph" is correctly pre-selected by default. PASS.
2. **Font Family dropdown never shows a blank/placeholder option.** Option list is `Arial, Times New Roman, Georgia, Courier New, Verdana, Helvetica, Comic Sans MS` — no "Font Family" placeholder; "Arial" is the real default. PASS.
3. **Font Size dropdown never shows a blank/placeholder option.** PASS (see #4, same control).
4. **Font Size is now a numeric point-size control**, not word buckets: `8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48` — a real preset range, no more Small/Normal/Large/Huge. PASS.
5. **Font size is applied via real CSS, not the legacy `<font size="n">` tag.** Selecting text and applying 24pt produced `<span style="font-size: 24px;">...</span>` in the live editor DOM — genuine inline CSS. Backward compatibility confirmed separately: a page seeded directly with legacy `<font size="5">...</font>` markup (bypassing the editor) still renders correctly in both the published view (computed `font-size: 24px`, the browser's native legacy-scale-5 mapping) and when reopened in the editor (loads the raw `<font>` markup without crashing or corrupting it). PASS.
   - **Bonus observation, not an AC violation:** Font *Family* is still applied via the legacy `<font face="Georgia, serif">` tag, not a CSS `font-family` style/class — confirmed by inspecting the live editor DOM after applying a family. Ticket #119878's AC#5 only mandates the CSS migration for Font *Size*, not Font *Family*, so this isn't a failure of this specific ticket's scope — but it's the same class of deprecated-markup issue and may be worth a separate, smaller follow-up ticket if the team wants full consistency.
6. **Sticky/bubble toolbar sync** — see "Actual result" above. **FAIL.**
7. **Manually verified in-browser, golden path, reload persistence.** Created a page, selected text, applied Heading/Font/Size via the sticky toolbar, published (Update), reloaded the published view — the applied `font-size: 48px` CSS persisted correctly across the reload. PASS (for everything except the toolbar-sync issue carried over from #6).

## Evidence

### Screenshot

N/A this round — evidence was captured as exact DOM/HTML snapshots (quoted above) via Playwright, which is a more precise, copy-pasteable form of evidence for a toolbar-state-sync bug than a static image; a screenshot can be added on request.

### Console / log

- Exact DOM state captured via `browser_evaluate` reading `select.value` on both toolbars' live `<select>` elements, immediately after a genuine (non-synthetic) `selectOption()` UI interaction, with no intervening reselect — see "Actual result" above for the raw before/after values.

## Duplicate check

- Duplicate found: No — this is a retest of the existing production bug #119878, not a new defect. No local bug file previously existed for it in this repo (created now to track the retest and the still-open gap).
- Existing bug reference (if duplicate): #119878 (production)

## Retest summary

**7 of 7 acceptance criteria now PASS**, as of the 2026-11-26 final retest (PR #12 / rkb-103 pulled and verified
locally against the developer's own retest steps). Recommend production ticket #119878 be closed as **Done**,
100%.

**Reported to production:**
- 2026-11-24, journal entry #639541 on #119878 (6/7 PASS, full retest summary posted as a comment). Status
  changed In QA -> Reopen (per explicit user instruction, since AC#6 was not resolved).
- 2026-11-26 (final): retest result (7/7 PASS) to be posted as a production comment; status to be changed
  In QA -> Done, done_ratio -> 100, per CLAUDE.md §5 (bug closure production sync).
