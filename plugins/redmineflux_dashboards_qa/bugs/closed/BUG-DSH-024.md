# Bug Report Template

- Bug ID: BUG-DSH-024
- Production Redmine Issue ID: #121318
- Title: Dashboard grid's own computed column widths exceed the grid container's actual width, cutting off the rightmost card(s) in every row with no right-side margin — reproducible across 1280×720 to 1920×1080
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium), confirmed at 3 viewport widths; also independently observed by the user in
  a live Chrome session
- User role: Administrator
- Date: 2026-09-25 (root-caused and corrected same day — see Revision note)

## Revision note (2026-09-25)

Originally filed from a user screenshot showing two duplicate "Issues assigned to me" Pie widgets rendered
oversized/overflowing their card, which I could not reproduce live at the time. The user then clarified the
actual visible symptom with a second, annotated screenshot: the dashboard grid has visibly asymmetric spacing —
a clear left-side margin matching the filter bar's own left border, but **no equivalent margin on the right
side**, with the rightmost card(s) in each row cut off. That version **was** reproduced live, cleanly, at three
different viewport widths, and root-caused precisely (see Evidence). The original "oversized Pie chart" framing
and its unreproduced screenshot are kept below as a secondary data point — a card whose canvas is being drawn
inside a grid track that is itself miscalculated is a very plausible way for that chart's own responsive sizing
to also go wrong, so the two observations may well share the same root cause, though this file's confirmed
evidence is specifically about the grid-column overflow.

## Steps to reproduce

1. Open a project's Analytics Dashboard with at least 4 widgets in the first row (enough to fill the row at wide
   viewports).
2. At each of the following viewport widths, compare the grid's left-edge spacing against its right-edge
   spacing, and check whether the last card in a row is fully visible: 1280×720, 1440×900, 1920×1080.

## Expected result

- The grid should have symmetric left/right spacing from the page edge at every supported viewport width, and
  every card — including the last one in a row — should render fully within the visible page, matching the
  clean, fully-visible rendering of every other card.

## Actual result

- **Confirmed via direct DOM measurement that the grid's own `grid-template-columns` computed pixel widths sum
  to more than the grid container's actual rendered width**, at every viewport width tested:
  - 1280×720: grid container width 1193px; 3 columns + 2×16px gaps require 1418.5px — **225.5px overflow**.
  - 1440×900: grid container width 1353px; 3 columns + 2×16px gaps require ~1588px — **235px overflow**.
  - 1920×1080: grid container width 1833px; 4 columns + 3×16px gaps require ~1862px — **29px overflow**.
- Since CSS Grid lays out columns left-to-right starting at the container's own left edge, and the first card's
  left edge aligns exactly with the grid container's left edge (confirmed: 0px offset) in every case, **100% of
  the overflow manifests on the right side only** — explaining why the left margin looks clean and consistent
  while the right side has little-to-no margin and the last card is visibly clipped.
- **Visually confirmed** at 1280×720 and 1440×900 (screenshots below): the rightmost card's title text is cut off
  mid-word ("Issues assigned..." with no closing text visible), and its chart body (a Bar chart, "New"/"Resolved")
  is only partially visible — the "Resolved" bar and its legend entry are cut off entirely at 1280×720, and
  partially cut off at 1440×900. No horizontal page scrollbar appears (`document.documentElement.scrollWidth ===
  clientWidth` in both cases) — the overflow is absorbed by the grid content being clipped/hidden rather than by
  making it scrollable, so the missing content is not reachable by scrolling either.
- **At 1920×1080** the effect is smaller (29px) but still measurable and visible: left margin 36px vs. right
  margin ~23px, a ~13px asymmetry — matching the user's own annotated screenshot showing a visibly wider red-
  boxed gap on the left than on the right.
- The container chain immediately above the grid (`.analytics-dashboard-container`, its own parent) has
  perfectly symmetric CSS padding (16px/16px, then 20px/20px) at every width tested — **the asymmetry is not
  coming from any explicit CSS padding/margin rule**, it's specifically the JS-computed `grid-template-columns`
  pixel values not correctly accounting for the container's actual available width (their sum exceeds it), most
  likely from a stale/incorrect width measurement at the point those column widths are calculated.

## Evidence

### Screenshot

![User's annotated screenshot: red boxes highlighting the left margin (wide, consistent) vs. the right margin (thin/absent) at 1920×1080](../../screenshots/BUG-DSH-024/user-annotated-left-vs-right-margin-1920x1080.png)

![Reproduced at 1280×720: third card's title and chart clipped at the right edge, no right margin at all](../../screenshots/BUG-DSH-024/repro-1280x720-third-card-cutoff.png)

![Reproduced at 1440×900: third card's Bar chart ("Resolved" bar/legend) clipped at the right edge](../../screenshots/BUG-DSH-024/repro-1440x900-third-card-cutoff.png)

![Original report: two duplicate Pie-chart widgets rendered oversized within their cards (secondary/unreproduced data point, possibly related root cause)](../../screenshots/BUG-DSH-024/user-reported-oversized-pie-charts-overflowing-card.png)

### Console / log

- `.charts-grid` computed style at 1280×720: `gridTemplateColumns: "643.5px 380.547px 362.469px"`,
  `columnGap: 16px`, container `width: 1193px` — columns + gaps sum to `1418.516px`, **225.5px** over.
- Same at 1440×900: `gridTemplateColumns: "643.5px 471.625px 440.562px"`, container `width: 1353px` — sum
  `~1588px`, **235px** over.
- Same at 1920×1080: 4-column row, container `width: 1833px`, columns+gaps sum `~1862px`, **29px** over; first
  card's left edge offset from grid container = `0px`; last card's right edge offset from grid container =
  `-29.14px` (i.e. extending 29px past the container's own right boundary).
- Parent container padding confirmed symmetric at every width: `.analytics-dashboard-container` `paddingLeft:
  16px` / `paddingRight: 16px`; its own parent `paddingLeft: 20px` / `paddingRight: 20px`.
- `document.documentElement.scrollWidth === document.documentElement.clientWidth` at 1280×720 (`1265px` both) —
  no page-level horizontal scrollbar; the overflow is clipped, not scrollable.

## Production report

Reported to production `ztflux` as issue #121318, per explicit user approval, 2026-09-25. Priority=Medium(2),
Defect Type=Functional, Defect Severity=Medium-severity, Defect priority=Medium, category="Custom dashboard
plugin", assigned to Prashant Chaurasia. Linked via `report_defect` to Test Case #121093 ("Custom Dashboard:
Sanity check — chart templates and custom field grouping for saved queries (#120914)"), Run #577, Test Suite
#249, Environment "Window 11 + Chrome" — the same testcase every other #120914-scoped bug this session was
linked to. Post-write verification: `#121093 [Failed] ... defects:[...,121311,121318]` — 16 total, 14 closed
plus this and `BUG-DSH-023`, both genuinely open.

## Retest — 2026-09-25

**FIXED.** Per explicit user request, restarted the `redmine-docker-700-redmine-1` container a second time
(clean boot confirmed via `docker logs`, no errors) and retested the exact original repro at all three original
viewport widths.

| Viewport | Columns (`grid-template-columns`) | Container width | Overflow |
|---|---|---|---|
| 1280×720 | `387px 387px 387px` (perfectly even) | 1193px | **0px** (was 225.5px) |
| 1440×900 | `440.33px 440.33px 440.34px` (perfectly even) | 1353px | **0px** (was 235px) |
| 1920×1080 | `446.25px × 4` (perfectly even) | 1833px | **0px** (was 29px) |

At every width, the grid's computed column widths now sum exactly to the container's own width — no overflow,
no clipped card, symmetric left/right margins confirmed visually (screenshot below). The previous fixed/uneven
column-width values are gone; columns are now evenly and correctly distributed across the available width.
Confirmed FIXED, ready to close.

### Retest screenshot

![Retest 2026-09-25, 1920×1080: all 4 cards render fully within the grid with clean, symmetric margins on both sides](../../screenshots/BUG-DSH-024/retest-2026-09-25-pass-1920x1080.png)

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`.
