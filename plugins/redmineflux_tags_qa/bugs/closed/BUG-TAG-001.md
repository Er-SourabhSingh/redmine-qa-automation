# BUG-TAG-001

- Bug ID: BUG-TAG-001
- Production Redmine Issue ID: 120104
- Severity: Low
- Title: Tag input placeholder "Add Tags" is not translated to German, while adjacent Save/Cancel buttons in the same widget are
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags)
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
3. Click "Hinzufügen" next to the "Tags:" field on the issue sidebar.
4. Observe the tag input field that appears.

## Expected result

- The tag input's placeholder text renders in German, consistent with the "Speichern"/"Abbrechen" buttons rendered in the same widget immediately next to it.

## Actual result

- The tag input's placeholder reads **"Add Tags"** — English, untranslated — confirmed via the accessibility tree (`textbox "Add Tags"`) and the DOM (`<input class="ui-widget-content ui-autocomplete-input" placeholder="Add Tags">`).
- The underlying hidden backing field for the same tag-it widget also carries a hardcoded English placeholder, `"+ add tag"` (`input.tagit-hidden-field`) — not directly visible to the user, but confirms both strings are hardcoded literals in the widget's JS initialization rather than routed through Redmine's i18n.
- By contrast, the widget's own "Speichern" (Save) and "Abbrechen" (Cancel) buttons, rendered in the same widget at the same time, ARE correctly translated — proving this is a genuine partial-i18n-coverage gap in the plugin, not a doc/expectation mismatch.

## Severity rationale

Low: cosmetic-only, does not block tagging functionality, but is user-visible on every issue every time an agent/user opens the tag editor in a German session.

## Cross-theme confirmation

Retested under the Redmineflux Lotus theme (same server, same session, theme switched via Administration > Settings > Display) — the identical untranslated "Add Tags" placeholder reproduces on Lotus's own redesigned issue-detail layout (which renders the "Hinzufügen" trigger as a styled button rather than Default theme's plain link). Confirms this bug is in the shared tag-it widget itself and is completely theme-agnostic, not specific to the Default theme.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-001/tag-input-untranslated-placeholder.png)
![Lotus theme evidence](../../screenshots/BUG-TAG-001/lotus-theme-add-tags-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Reconfirmation — 2026-09-08, new Forge server

Retested on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`, freshly provisioned — no projects existed until this session created one) after admin/admin → forced password change → German set as both system default and account language. Created a new project ("Tag Retest Project") and issue (#266), opened its Tags "Hinzufügen" widget — the "Add Tags" placeholder is still hardcoded English while the widget's own "Speichern"/"Abbrechen" buttons remain correctly German. **Reproduces identically on this new server.** Test issue/project deleted afterward (cleanup).

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated since the previous reconfirmation) under **both Standard and Lotus themes**. The issue-detail Tags "Hinzufügen" widget's placeholder now reads **"Markierungen hinzufügen"** (German) under both themes, matching the correctly-translated "Speichern"/"Abbrechen" buttons. **FIXED.** Verified via a fresh test project/issue, cleaned up afterward.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
