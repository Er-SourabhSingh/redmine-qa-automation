# Bug Report Template

- Bug ID: BUG-CRX-049
- Production Redmine Issue ID: #123059
- Title: Success/error flash message on the Crux Settings page renders with its bottom border cut off / not fully visible, unlike the identical flash style on core Redmine pages
- Redmine version: 6.0-bookworm (new local Docker instance)
- Plugin name: redmineflux_crux
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (user's own browser, screenshot evidence)
- User role: `admin` (Redmine Administrator)
- Date: 2026-10-09

## Steps to reproduce

1. Go to `/crux/admin/settings`.
2. Make any change (or none) and click "Save".
3. Observe the green "Successful update." flash message that appears at the top of the content area.
4. Compare against the same flash-message style on any core Redmine page — e.g. a project's Settings tab after a save ("Successful creation."/"Successful update.").

## Expected result

- The flash message box should render with all four borders fully visible, consistent with how the identical `div.flash.notice` style renders on every core Redmine page.

## Actual result

- On `/crux/admin/settings`, the flash message's **bottom border is visibly cut off / not fully rendered** — top, left and right edges show normally, but the bottom edge is thin/near-invisible compared to the rest of the box.
- On a core Redmine page (e.g. a project's Settings tab), the exact same `div.flash.notice` style renders with a complete, even border on all sides — confirmed via side-by-side screenshots, same browser, same session.
- **Investigated but root cause not conclusively pinned down.** The authored CSS for this element is plain `border: 1px solid;` from Redmine's own core `application.css` (not Crux-authored, not overridden by Crux's own stylesheet). On the Crux Settings page, `getComputedStyle` reported the border as a fractional `0.666667px` on all four sides; no `zoom`/`transform` was found on the element or any ancestor, and `window.devicePixelRatio` (1.5) was identical across tabs/pages, ruling out a simple global display-scaling or per-tab-zoom explanation. The investigation was stopped before a definitive cause was found — this bug is filed on the strength of the reproducible visual evidence (two screenshots, same machine/browser), not a confirmed code-level root cause.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CRX-049/settings-flash-bottom-border-cut-off.png)

Comparison (core Redmine page, same style, border renders correctly):

![Comparison — core Redmine page](../../screenshots/BUG-CRX-049/core-redmine-page-border-correct-for-comparison.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-049/retest-yyyy-mm-dd-pass.png)

### Console / log

- `getComputedStyle(document.getElementById('flash_notice'))` on `/crux/admin/settings`: `border: 0.666667px solid rgb(159, 207, 159)` (all four sides equal — border-width itself isn't asymmetric, yet the bottom edge renders less visibly, suggesting a sub-pixel rendering/positioning effect rather than an asymmetric CSS rule).
- Matched CSS rule (Redmine core, `application.css`): `#errorExplanation, div.flash, .nodata, .warning, .conflict { padding: 6px 4px 6px 30px; margin-bottom: 12px; font-size: 1.1em; border: 1px solid; border-radius: 3px; }` plus `div.flash.notice { background-color: rgb(223, 255, 223); border-color: rgb(159, 207, 159); color: rgb(0, 95, 0); }` — nothing Crux-specific found overriding border-width.
- No overlapping sibling element found (the flash's `nextElementSibling` was an inert `<script>` tag, not visually overlapping).

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`; not related to BUG-CRX-035 (that was about the message rendering as plain unstyled text — this message IS properly styled/colored, just has a rendering glitch on one edge).

## Note for triage

Root cause not confirmed from the QA side — needs a developer with access to the actual rendering environment (and ideally the same display/browser combination) to reproduce and trace further, since the obvious candidates (Crux CSS override, zoom/transform, overlapping element, global display scaling) were all checked and ruled out without finding the real cause.
