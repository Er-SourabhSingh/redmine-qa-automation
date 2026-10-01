# Bug Report Template

- Bug ID: BUG-CRX-035
- Production Redmine Issue ID: #121482
- Title: Success/error messages render as a plain inline banner above the table instead of a toast or Redmine-style flash message, across every Crux admin page
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (all admin pages — Agent fleet, Providers & keys, etc.)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP) / user's own browser
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. Go to any Crux admin page that performs a save/create/delete action, e.g. `/crux/agents` (Fleet) or `/crux/admin/keys` (Providers & keys).
2. Perform a write action — save an agent, add a provider, add a key, etc.
3. Observe how the success (or error) confirmation is displayed.

## Expected result

A save/create/update/delete confirmation should read as a deliberate piece of UI — either a toast/snackbar notification (auto-dismissing, doesn't shift page layout) or Redmine's own native flash-message style (a colored banner at the very top of the content area, consistent with the rest of Redmine). Either would look intentional and match the surrounding application's visual language.

## Actual result

The confirmation renders as a plain, unstyled line of text sitting directly above the data table it affects — reported firsthand from the Fleet (Agent list) page: `Agent "asdf" saved.` appears as plain text immediately above the IDENTITY/ENGINE table header row, with no background color, border, icon, or dismiss control distinguishing it from ordinary body text (see screenshot). This is not a one-page issue — the same bare-inline-text pattern was independently observed on the Providers & keys page in this same session: `Provider "openrouter" saved.` appeared directly above the Providers table, and `Key "OpenRouter default" added.` appeared directly above the Keys table, in the exact same unstyled-banner-above-table shape.

Because the message pushes the table down and looks like just another row of text rather than a deliberate confirmation, it's easy to miss or mistake for stale page content, and it doesn't match either the app's own React admin UI conventions or Redmine's native flash-message styling elsewhere in the same product.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CRX-035/inline-success-message-fleet-page.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-035/retest-2026-10-01-pass.png)

### Console / log

- Fleet page (`/crux/agents`): after editing and saving an agent named "asdf", the page renders `Agent "asdf" saved.` as plain text directly above the Fleet table's IDENTITY/ENGINE header row — user-reported screenshot, 2026-09-29.
- Providers & keys page (`/crux/admin/keys`), same session, independent confirmation: `Provider "openrouter" saved.` rendered directly above the Providers table after adding a new provider; `Key "OpenRouter default" added.` rendered directly above the Keys table after adding a key — both plain inline text, no toast/banner styling, same shape as the Fleet page report.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production as issue **#121482** (`ztflux`, Tracker Bug, Priority Low, Defect Severity Low-severity, Defect priority Low, Defect Type Usability, Category Crux Plugin, assigned to Prashant Chaurasia — user id 410), 2026-09-29. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase #120489 (`CRUX_AGENT_ROSTER_ADMIN.md` — closest fit, covers both the Fleet and Providers & keys admin pages), Environment "Window 11 + Chrome" — testcase marked Failed.

## 2026-10-01 retest — CONFIRMED FIXED (real browser click-through)

Dev's fix (`redmineflux_crux`, branch `master`, commit `c92c693` — new `.crux-success` CSS class, confirmed present in the local git checkout) had an "honest gap" per the dev's own journal: not independently verified via a real browser click-through (Playwright unavailable in the dev's session). Retested exactly that gap: opened the Fleet page (`/crux/agents`), clicked Edit on "Builder 1" (a non-bundled test agent), made no field changes, clicked "Save agent". Confirmed via `getComputedStyle` that the confirmation element is genuinely `class="crux-success"` with a real soft-green background (`rgb(220, 252, 231)`) and a visible border — not the old plain unstyled text. Screenshot captured. **Verdict: CONFIRMED FIXED.** Recommend closing.
