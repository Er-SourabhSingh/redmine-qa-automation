# BUG-AGB-006

- Bug ID: BUG-AGB-006
- Production Redmine Issue ID: 120174
- Severity: Low
- Title: On the admin plugin Configure page, the "(Default: ...)" suffix label is untranslated English in all 8 icon-customization rows (5 priority rows + 3 tracker rows), while every other label/description on the same page is correctly German
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Agile Board (agile_board)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active, logged in as Admin.
- Administration → Plugins → Redmineflux Agile Board → Konfigurieren (requires re-entering the account password per Redmine's security re-auth prompt).

## Steps to reproduce

1. Navigate to Administration → Plugins.
2. Click "Konfigurieren" for "Redmineflux Agile Board".
3. Inspect the "Prioritätssymbole" (priority icons) and "Tracker-Icons konfigurieren" (tracker icons) sections — specifically the small "(Default: ...)" text next to each priority/tracker name.

## Expected result

- The "Default" word should render in German (e.g. "Standard"), consistent with every other label on this same page: "Agile-Board-Einstellungen" heading, "Story Points aktivieren" + its description, "Maximales WIP-Limit" + its description, "Prioritätssymbole"/"Tracker-Icons konfigurieren" headings + their descriptions, the hidden "Story-Point-Werte" field's own label/description/validation-error text, and the "Anwenden" submit button — all of which are correctly translated.

## Actual result

Confirmed via DOM inspection that all 8 rows on the page show the literal English word "Default" in parentheses next to the icon dropdown:

- Priority rows: "Low (Default: ↑ ●)", "Normal (Default: ↑ ●)", "High (Default: = ●)", "Urgent (Default: ↓ ●)", "Immediate (Default: ↓ ●)"
- Tracker rows: "Bug (Default: 🐞)", "Feature (Default: ⭐)", "Support (Default: 💬)"

(The priority/tracker names themselves — "Low", "Bug", etc. — are admin-configured enumeration/tracker names, i.e. data, not a translation concern, consistent with the same convention already established for status-column names in `BUG-AGB-001`'s testing. Only the "Default:" wrapper text is a genuine UI-string gap.)

This is a narrow, consistent gap — proven by every other string on the identical page being correctly translated, including a hidden/conditionally-shown field's own label, help text, and client-side validation error message ("Story Points müssen positive ganze Zahlen sein."), confirming this isn't a session/environment misconfiguration.

## Severity rationale

Low: a small parenthetical label on an admin-only configuration page most users never visit; does not affect functionality or clarity in a meaningful way.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-AGB-006/agile-configure-page-default-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-AGB-006/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. All 8 rows on the plugin's Configure page now read "(Standard: ...)" instead of "(Default: ...)" — confirmed via DOM query across both priority icons (Low/Normal/High/Urgent/Immediate) and tracker icons (Bug/Feature/Support). **FIXED.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
