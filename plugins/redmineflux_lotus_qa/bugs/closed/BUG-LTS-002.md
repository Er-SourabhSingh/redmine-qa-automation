# BUG-LTS-002

- Bug ID: BUG-LTS-002
- Production Redmine Issue ID: 120217
- Severity: N/A — invalidated 2026-09-10, see Correction section below
- Title: [INVALIDATED — not a bug] Issue detail's right-column tab strip appears to clip its last tab's label at 1280×720 under Lotus theme — actually a working "peek of next tab" scroll/pagination affordance; every tab renders fully once paged to via the provided "<"/">" controls
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus) — affects any issue with the Redmineflux Checklist plugin's "Checklisten-Verlauf" tab present, but the layout defect itself is in Lotus's own issue-detail card markup
- Plugin version: redmineflux_lotus 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Redmineflux lotus
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1280×720 (confirmed NOT reproducing at 1920×1080)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active (system default + account).
- Active theme: Redmineflux lotus.
- Viewport: 1280×720.
- An issue where all three tabs are present, e.g. one with a Checklist item (adds the "Checklisten-Verlauf" tab).

## Steps to reproduce

1. Set theme to Redmineflux lotus, language to German, browser viewport to 1280×720.
2. Open an issue detail page with a checklist present (e.g. `/issues/260`).
3. Look at the right-column tab strip above the activity feed: "Historie" / "Notizen" / "Checklisten-Verlauf".

## Expected result

- All three tab labels render in full, consistent with the Default theme at the identical 1280×720 resolution (confirmed clean there — see `CHECKLIST_GERMAN_LANGUAGE.md` TC-CHK-007).

## Actual result

The last tab, "Checklisten-Verlauf", is visually clipped to "Checklisten-V" with left/right chevron arrows appearing next to the tab strip (a horizontal-scroll affordance). Confirmed via computed styles, not just visual impression:

- The tab strip's own container (`div.tabs`) has `overflow-x: hidden` and a rendered width of **319.67px**, while its content (the `<ul>` of tab `<li>`s) needs **343px** — a ~23px shortfall that hides the tail of the last tab.
- The individual tab element itself is not truncated (`text-overflow: clip`, full text present in the DOM) — the defect is the parent container being too narrow for the combined width of all three German tab labels, not an ellipsis/truncation on the label itself.
- Confirmed this does NOT reproduce under the Default theme at the identical 1280×720 viewport with the identical German labels (Default theme's plain tab list has no such fixed-width container) — this is a genuine Lotus-theme-specific layout defect, and specifically a resolution+translation interaction: the combined width of "Historie"/"Notizen"/"Checklisten-Verlauf" is short enough to fit at 1920×1080 but not at 1280×720.

## Severity rationale

Medium: affects a real, commonly-visited part of the issue detail page (the notes/history tab strip) at a common resolution (1280×720 is one of the two resolutions explicitly required for this test cycle), and while a workaround (the chevron arrows) technically exists, the initial visual impression is of a broken/clipped label.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-LTS-002/tab-strip-clipped-1280x720.png)

### Retest screenshot

![Still clipped, now with a 4th tab, server 2](../../screenshots/BUG-LTS-002/retest-2026-09-09-server2-still-fails.png)

### Console / log

- No related console errors; this is a CSS/layout defect.

## Retest — 2026-09-09 — STILL REPRODUCES (worse)

Retested on Forge server `https://flux-fhggkobjh49.forge.zehntech.com/`, Lotus theme, German language, Admin role, 1280×720, issue #266 (fresh `browser_navigate` reload performed after resizing to 1280×720, per this session's established methodology for avoiding stale-SPA-render false readings).

Confirmed via computed styles on `div.tabs` (the tab-strip container whose text content includes "Historie"): `overflow-x: hidden`, `clientWidth: 313px` vs `scrollWidth: 487px` — a ~174px shortfall (worse than the originally-filed ~23px shortfall). This server's issue detail page now shows **four** tabs instead of three — "Historie" / "Notizen" / "Eigenschaftsänderungen" / "Checklisten-Verlauf" (an added "Eigenschaftsänderungen" tab not present in the original repro) — and confirmed visually via screenshot: "Eigenschaftsänderungen" clips to "Eigenschaftsänd…" and "Checklisten-Verlauf" is fully scrolled off-strip, both requiring the chevron affordance to reach. Root cause and behavior are unchanged from the original finding — the container is still too narrow for the combined tab-label width — it is simply more visible now because a fourth tab increases the total width needed. STILL OPEN, severity unchanged (Medium).

## Correction — 2026-09-10 — NOT A BUG, working as designed

The user pointed out (with a screenshot showing "Checklisten-Verlauf" rendered fully alongside the "<"/">" buttons) that these buttons exist specifically to scroll/page through the tab strip — i.e., this is an intentional affordance, not a broken layout.

Verified by actually clicking through it on `https://flux-fhhcov1xf49.forge.zehntech.com/issues/1`, Lotus theme, German, 1280×720:

1. **Initial state**: "Historie" / "Notizen" (active) / "Eigenschaftsänd…" visible, last tab partially cut off — a "peek" of the next tab, the same pattern used by many carousels/scroll strips to hint that more content exists to the side.
2. **After clicking the right arrow once**: the strip re-renders its visible subset — "Historie" and "Notizen" are removed from layout (`x:0, width:0`, i.e. `display:none`, not just scrolled out via `scrollLeft`, which stayed `0` throughout), and "Eigenschaftsänderungen" now renders **fully** (no clipping) with "Checklisten-Verlauf" peeking in at the edge.
3. **After clicking again**: "Checklisten-Verlauf" becomes the trailing tab. Precise bounding-box check: its right edge sits ~5px past the container's right edge (previously the shortfall was ~23–174px) — a negligible, essentially imperceptible residual, not the "clipped to Checklisten-V" behavior originally described.

**Conclusion**: this is a working paginated/peek-style tab strip, not a broken fixed-width container. Every tab is fully reachable and renders in full once paged to via the provided "<"/">" controls — the original finding mistook an intentional "peek of the next tab" affordance (a legitimate, common UI pattern) for a layout defect, and the 1280×720 check on the second Forge server (`flux-fhggkobjh49`, 2026-09-09) reproduced the same peek behavior on a 4-tab strip without recognizing it as such. **Invalidated — not a bug.** Moving to `bugs/closed/`.

### Correction screenshots

![Initial state — last tab peeks in, partially visible (intentional affordance)](../../screenshots/BUG-LTS-002/correction-2026-09-10-initial-state-peek.png)

![After one click — previously-peeking tab now renders in full](../../screenshots/BUG-LTS-002/correction-2026-09-10-after-scroll-full-label.png)

![Final page — last tab, ~5px residual only, effectively full](../../screenshots/BUG-LTS-002/correction-2026-09-10-final-tab-nearly-full.png)

## Duplicate check

- Duplicate found: No (related in kind to `BUG-LTS-001` — both are "longer German content overflowing a Lotus fixed-width container" — but a different container/page area, filed separately per the "same root cause" test)
- Existing bug reference (if duplicate): N/A
