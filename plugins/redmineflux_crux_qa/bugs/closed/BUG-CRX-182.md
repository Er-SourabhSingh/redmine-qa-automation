# Bug Report

- Bug ID: BUG-CRX-182
- Production Redmine Issue ID: #128076
- Title: Ask Crux's "Pick up where you left off" suggestion row is silently clipped (bottom ~20px cut off) on a
  fresh chat at a standard 1280×720 viewport, with no scrollbar to reveal it
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI)
- Plugin version: crux-core 1.1.0
- Environment: Local — `http://localhost:3015`
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-11

## Steps to reproduce

1. Resize the browser viewport to exactly 1280×720 (a very common laptop/small-monitor resolution).
2. Go to `/crux/ask` and click "New chat" to reach the welcome screen (with at least 3 recent chats in this
   Redmine instance, so the "Pick up where you left off" row shows 3 suggestion chips and wraps to 2 rows: 2
   chips on the first line, 1 chip on the second).
3. Look at the bottom of the "Pick up where you left off" section, where the 3rd (wrapped) suggestion chip sits.

## Expected result

All 3 "Pick up where you left off" suggestion chips should be fully visible and clickable at this viewport
size, the same way they are at a taller viewport (e.g. 1280×800) — either the welcome panel's height should
accommodate however many rows the chips wrap to, or the panel should scroll to reveal content that doesn't fit.

## Actual result

The panel holding this welcome content (`.crux-client-main.crux-is-welcome`) has a fixed CSS `height: 544px`
and `overflow: hidden` at this viewport size. The last suggestion chip (3rd chip, 2nd wrapped row) sits at
`top: 632px` / `bottom: 668px` (36px tall), but the clipping panel's own bottom edge is at `648px` —
**20px of the chip's bottom is silently cut off**, with no visible indication anything is missing.

Critically, there is **no way to scroll to see it**: `document.body.scrollHeight === window.innerHeight ===
720` and `window.scrollY` stays `0` after an explicit `scrollBy(0, 100)` — the page genuinely does not scroll
at all. The only other scrollable element on the page is the unrelated chat-history sidebar
(`.crux-session-list`). The clipped chip is simply unreachable at this viewport size, not just awkwardly
placed.

Confirmed the root cause is viewport-height-driven, not a fixed bug at all sizes: at 1280×800, the same panel
computes to `height: 624px` and the identical 3rd chip (`bottom: 686px`) fits cleanly inside it with no
clipping. So the panel's height is calculated from the viewport (e.g. something like `calc(100vh - Npx)`), but
that calculation doesn't account for the welcome content needing 2 wrapped rows of suggestion chips once 3+
recent chats exist — it assumes less content than can actually be present, and clips instead of scrolling or
growing.

## Evidence

### Screenshot

![3rd "Pick up where you left off" chip's bottom ~20px clipped at 1280x720, no scrollbar](../../screenshots/BUG-CRX-182/pickup-row-clipped-1280x720.png)

### Retest screenshot

![Retest result — panel now scrolls, 3rd chip fully reachable](../../screenshots/BUG-CRX-182/retest-2026-11-11-pass.png)

### Console / log

- At 1280×720: `.crux-client-main.crux-is-welcome` computed `height: 544px`, `overflow: hidden`, panel
  `bottom: 648px`. Last `.crux-recent-chip` (3rd chip): `top: 632.35px`, `bottom: 668.35px`, `height: 36px` —
  clipped by `668.35 - 648 = 20.35px`.
- Page-level scroll check: `document.body.scrollHeight = 720`, `window.innerHeight = 720`,
  `window.scrollY` stays `0` after `window.scrollBy(0, 100)` — page does not scroll at all.
- At 1280×800 (control, same fresh chat, same 3 chips): panel computed `height: 624px`, last chip
  `bottom: 685.68px` — fits cleanly, not clipped.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md` and `bugs/_index.md`, no prior
  finding on the Ask Crux welcome panel's viewport-height sizing or the "Pick up where you left off" row
  specifically.

## Retest — 2026-11-11 (FIXED, developer resolved)

- **Fix pulled**: `redmineflux_crux` plugin, commit `7612e559b162e5c6bc2e8ca6f5576b6b7da4da9c` — "CRP-53: the
  new-chat screen scrolls on a short window instead of cutting content off (0.95.0)", spec file
  `backlogs/specification/CRP-53-spec-new-chat-screen-scrolls-on-short-windows.md`, explicitly references
  "BUG-CRX-182 (#128076)".
- **Fix contents** (`assets/stylesheets/crux.css`): `.crux-client-main.crux-is-welcome` changed from
  `overflow: hidden` to `overflow-y: auto; overflow-x: hidden`; welcome-panel children got `flex-shrink: 0`;
  the chat title bar (`.crux-client-head`) made `position: sticky; top: 0`; a `@media (max-height: 760px)`
  block tightens padding/gaps on short windows.
- **Deploy**: pure CSS change in the live-mounted `redmineflux_crux` plugin — `docker compose restart redmine`
  only (no crux-core/mcp rebuild needed). Confirmed ready via `curl http://localhost:3015/login` → 200 after
  Puma's "Listening on http://0.0.0.0:3000" log line appeared.
- **Native verification at 1280×720** (fresh "New chat", same 3-chip "Pick up where you left off" row):
  - `.crux-client-main.crux-is-welcome` computed style is now `overflow-y: auto` (was `hidden`).
  - `panel.scrollHeight = 561` vs `panel.clientHeight = 544` — the panel genuinely has overflow content now.
  - Before scroll: `panel.scrollTop = 0`. After `panel.scrollBy(0, 100)`: `panel.scrollTop = 17.33` — the panel
    itself scrolls (not just reporting a scrollable overflow with no actual movement).
  - 3rd suggestion chip, after scroll: `top: 597.02`, `bottom: 633.02` — fully inside the panel's own bottom
    edge (`648`): `fullyVisible: true`. Previously this chip was clipped by ~20px with no way to reach it.
  - Chat title bar (`.crux-client-head`): `position: sticky`, `top: 104` (unchanged after scroll) — stays in
    place while the welcome content scrolls underneath it, per the spec's documented intent.
- **Verdict**: FIXED. The panel now scrolls instead of clipping, the previously-unreachable 3rd chip is fully
  visible and reachable via scroll, and the title bar stays sticky as designed.
