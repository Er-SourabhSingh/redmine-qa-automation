# BUG-INE-001

- Bug ID: BUG-INE-001
- Production Redmine Issue ID: 120177
- Severity: Medium (fixed 2026-09-09, see below)
- Title: [FIXED — see below] Inline searchable-dropdown widget ("Zugewiesen an") previously showed hardcoded English "Search…" placeholder and "— None —" option — both now confirmed correctly German ("Suche"/"Keine")
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Inline Issue Editor plugin (inplace_issue_editor)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: Default viewport (not resolution-specific)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Redmine system default language and the admin account's own language both set to German (Deutsch).
- Active theme: Default.

## Steps to reproduce

1. Log in as admin (German language, Default theme active).
2. Open any issue detail page (e.g. `/issues/230`).
3. Click the Edit (pencil) icon next to the "Zugewiesen an:" (Assigned to) field.
4. Observe the searchable dropdown that opens in place of the field.

## Expected result

- Every string the widget renders should be in German, consistent with the field label "Zugewiesen an:" and the widget's own "<<ich>>" shortcut option, both of which are correctly translated.

## Actual result

Two hardcoded English strings found in the identical widget:

1. The search input's placeholder reads **"Search…"** — confirmed via DOM: `<input type="text" class="rf-ss__input" placeholder="Search…" ...>`.
2. The clear/no-assignee option in the dropdown list reads **"— None —"** — confirmed visually (screenshot) directly below the correctly-translated **"<< ich >>"** ("assign to me") option in the same list.

Because a sibling string in the exact same widget instance ("<<ich>>") is correctly localized, this proves a genuine partial-i18n-coverage gap in the `rf-ss` widget's own hardcoded strings rather than a documentation or expectation mismatch. Root cause is very likely that "Search…" and "None" are literal strings in the widget's JS initialization/template, not routed through Redmine's `l()` i18n lookup.

Since this is described as a single shared component reused across issue list, issue detail, project table, and project card views (per the plugin's own description), the same hardcoded strings likely reproduce in every other view that uses this widget — not yet individually re-verified this session (see `INLINE_EDITOR_REQUIREMENTS.md` Known Constraints).

## Additional confirmations (2026-09-08, new Forge server flux-frmka2kzh49)

- **Reconfirmed on a new server**: the original finding was on `flux-fczk00paf49`, which has since expired. Re-tested on the current active Forge instance (`flux-frmka2kzh49`) — identical "Search…"/"— None —" strings reproduce byte-for-byte, confirming this is a genuine code-level defect, not an environment/data artifact.
- **Confirmed on the Issues LIST view**: clicking the Edit icon on a row's "Zugewiesen an" cell (not just the issue detail sidebar) opens the same `rf-ss` widget with the identical untranslated "Search…"/"— None —" strings — confirming the shared-widget prediction above for at least this one additional surface.
- **Priority field does NOT share this gap**: Priority's inline edit uses a plain native `<select>`, not the `rf-ss` widget at all — so this bug's pattern cannot and does not apply there (see `TC-INE-017`).

## Severity rationale

Medium: appears on every inline-edit interaction across (likely) every field/view that uses this shared widget, is highly visible (search box is the first thing the user sees when they open the widget), though purely cosmetic with no functional blockage.

## Retest — STILL REPRODUCES — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-f04qohdte49.forge.zehntech.com/`, German (Deutsch), Default theme.
- Opened issue #106 (Agile Board Project), clicked the inline Edit icon on "Zugewiesen an:".
- The "— None —" option is still hardcoded English, sitting directly below the correctly-translated "<< ich >>" option in the same dropdown list — identical to the original finding.
- Not re-verified this pass: the "Search…" placeholder string (dropdown list was captured with the input not focused); no reason to expect it changed independently since the fix did not touch this component at all.
- No change in behavior since the original report — bug remains open as-is, title/severity unchanged.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-001/assigned-to-search-untranslated.png)

### Retest screenshot — still reproduces (2026-09-09)

![Retest — still reproduces](../../screenshots/BUG-INE-001/retest-2026-09-09-still-english.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — "Keine" now sits below "<< ich >>", both German](../../screenshots/BUG-INE-001/retest-2026-09-09-fixed.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme.
- Opened issue #106 (Agile Board Project), clicked the inline Edit icon on "Zugewiesen an:".
- The search input's `placeholder` attribute now reads **"Suche"** (was "Search…"). Confirmed via direct DOM query (`input.placeholder`), not just visual impression.
- The clear/no-assignee option in the dropdown list now reads **"Keine"** (was "— None —"), sitting directly below the correctly-translated "<< ich >>" option — both now consistently German.
- **Fixed. Closing.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
