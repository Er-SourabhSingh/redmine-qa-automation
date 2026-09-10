# Plugin Memory — Redmineflux Lotus Theme

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The admin sidebar is icon-only by default; a "Seitenleiste umschalten" (toggle sidebar) button expands it into a labeled view. When labels are long, the expanded view wraps them across two lines (`white-space: normal`) rather than clipping — this is the fixed behavior as of 2026-09-09 (previously `white-space: nowrap` + ellipsis, see closed `BUG-LTS-001`).
- The issue-detail right-column tab strip ("Historie"/"Notizen"/"Eigenschaftsänderungen"/"Checklisten-Verlauf") is a **working paginated tab strip**, not a broken fixed-width container: at rest it shows a "peek" of the next tab (partially cut off, by design), and the "<"/">" controls page through it, hiding earlier tabs (`display:none`) and rendering the next one in full. Previously mischaracterized as clipping/broken in `BUG-LTS-002` — **invalidated 2026-09-10** after clicking through it confirmed every tab is fully reachable. The exact number of tabs shown (3 vs 4) varies by server/Redmine build, which just changes how much "peek" is visible at rest.
- Sprint's value (`.attribute.sprint .rf-show-display`) previously rendered in an anomalously narrow, wrapping span under Lotus at 1280×720 — **fixed as of 2026-09-10**, now renders single-line at full width (~58.6px) regardless of resolution.
- The Tags "Hinzufügen" editor widget still overlaps a neighboring field when opened at 1280×720 — as of 2026-09-10 this is the **Story-Points label** specifically (not the Sprint value, which is now fixed). See open `BUG-LTS-003`.

## Confirmed Working

- Sprint/Story-Points font and bullet alignment, the issue-edit-form half-width layout, and (as of 2026-09-10) the Sprint/Story-Points value overlap — all confirmed fixed at both 1920×1080 and 1280×720 (`BUG-LTS-003`, 3 of 4 original sub-findings).
- Inline Description-CKEditor Save/Cancel buttons render at matching 34px height — confirmed fixed 2026-09-09 (`BUG-LTS-004`, closed).
- The Lotus plugin's own Configure page (`/settings/plugin/redmineflux_lotus`) loads correctly with Tracker-Rahmenfarben/Prioritätssymbole/Logo tabs — confirmed fixed 2026-09-09 (`BUG-LTS-005`, closed).
- The subtask/related-tickets table on the issue detail page now scrolls within its own contained wrapper (`div.rf_issue_section_row`, `overflow-x: auto`) at 1280×720, instead of spilling into the Historie/Notizen sidebar — confirmed fixed 2026-09-10 (`BUG-LTS-006`, closed).

## Recurring Issues

- `BUG-LTS-003`'s Tags-widget overlap sub-finding is still **resolution-dependent and unfixed** at 1280×720 — it has moved from overlapping the Sprint value (fixed) to overlapping the Story-Points label instead. When retesting, check the tag editor's bounding box against both the Sprint value AND the Story-Points label independently — a fix to one doesn't guarantee the other.

- **Before filing a "clipped/cut off" finding on any tab strip, carousel, or narrow scrollable container, check for scroll/page controls (arrows, dots) first, and click through them** — a partially-visible "peek" of adjacent content plus a working next/prev control is a deliberate, common affordance, not a defect. Comparing `scrollWidth` vs `clientWidth` alone (as originally done for `BUG-LTS-002`) cannot distinguish this from a genuine broken layout — you have to actually interact with the control.

## Environment Notes

- `browser_resize` alone can leave the SPA in a stale render state — always do a fresh `browser_navigate` reload after resizing before trusting any DOM/computed-style check (confirmed this caused a false-positive "hidden panel" reading on the tab-strip container during this cycle's testing).
- **When checking for element overlap, compare the actual rendered text/value elements (e.g. `.rf-show-display` spans, editor input/button boxes), not just the outer flex/grid container rects.** Outer containers can be correctly non-overlapping while an inner value span still wraps and spills into a neighboring field's space — this exact mistake caused `BUG-LTS-003` to be marked fixed and closed, then have to be reopened same-day after the user caught it from screenshots.
- One Forge server (`flux-fdrk6suoj49`) started returning HTTP 403 "Forbidden" on every route (including `/login`) mid-session on 2026-09-09 — a genuine infrastructure/WAF-level block, not a Redmine/session issue. Retest work moved to a replacement server (`flux-fhggkobjh49`) provided by the user.
