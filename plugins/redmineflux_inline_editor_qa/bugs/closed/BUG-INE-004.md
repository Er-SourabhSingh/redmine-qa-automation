# BUG-INE-004

- Bug ID: BUG-INE-004
- Production Redmine Issue ID: 120302
- Severity: Low
- Title: The interim "Saving…" loading-state indicator shown during every inline-edit save is hardcoded English, while the final success/error toasts it precedes are correctly German
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Inline Issue Editor plugin (inplace_issue_editor)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fdrk6suoj49.forge.zehntech.com/`
- Theme: Standard (Default)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-09

## Preconditions

- German language active (system default and account).

## Steps to reproduce

1. Open any issue detail page with German language active (e.g. `/issues/106`).
2. Click the inline Edit (pencil) icon next to any field with a native `<select>` (e.g. "Priorität:") and change its value.
3. Observe the brief loading indicator that replaces the field's value the instant the change is submitted, before the final result (success toast, or the field settling on its new value) appears.

## Expected result

- The loading-state indicator should render in German, consistent with the "Erfolgreich gespeichert." success toast and "Konnte nicht gespeichert werden:" error-toast prefix that immediately follow it (both confirmed correctly translated as of this session's retest of `BUG-INE-002`/`BUG-INE-003`).

## Actual result

Confirmed via a `MutationObserver` capturing every node inserted into `document.body` during an inline-edit save (necessary since this indicator is visible for well under a second):

- Changing "Priorität:" from Urgent → Normal produces an interim toast reading **"Saving…"** — hardcoded English — immediately followed by the correctly-German "Erfolgreich gespeichert." success toast.
- The identical **"Saving…"** string was also captured while retesting `BUG-INE-002` (Status change blocked by an incomplete checklist) and `BUG-INE-003` (Description save) in this same session — confirming this is a single shared loading-state component reused across every inline-edit field, not isolated to Priority.
- This time the indicator was also captured in a still screenshot (via a tight polling loop checking `document.body.innerText` every ~30ms and firing the screenshot the instant "Saving" appeared) — see evidence below: a spinner icon plus the literal text "Saving…" sits in the Priorität field's value slot, while every other visible string on the page (labels, buttons, history entries) is correctly German.

This was not part of any previously-filed bug in this plugin — `BUG-INE-002` and `BUG-INE-003` both document the *final* toast text (error-prefix and success message respectively), neither mentions this earlier, separate loading-state string. Found incidentally while re-verifying those two bugs' fixes this session.

## Severity rationale

Low: purely cosmetic (the underlying save still completes correctly and quickly), and visible for well under a second on each inline-edit save — but it is technically visible on every single inline-edit interaction across the whole plugin, the same frequency class as the toasts in `BUG-INE-002`/`BUG-INE-003`, which is why it's tracked as its own finding rather than dismissed.

## Fix verified — 2026-09-10

Retested on Forge server `https://flux-fhhcov1xf49.forge.zehntech.com/`, German language (account + system default), Admin role, issue #1 (project "Software development5").

Attached a `MutationObserver` to `document.body` and triggered inline-edit saves on two different fields:
- **Priority change** (Low → High): interim indicator now reads **"Wird gespeichert…"** (correct German for "Saving…"), immediately followed by "Erfolgreich gespeichert." — confirmed via captured mutation text, not just visual impression.
- **Status change**: same result — "Wird gespeichert…" then "Erfolgreich gespeichert." — confirms the fix applies to the shared loading-state component across fields, not just Priority.

Also captured a still screenshot via a tight polling loop (checking `document.body.innerText` every ~25ms and firing `page.screenshot()` the instant "Wird gespeichert" appeared): shows a spinner icon plus "Wird gespeichert…" in the Status field's value slot, with the rest of the page correctly German.

FIXED — moving to `bugs/closed/`.

## Evidence

### Screenshot

![Bug evidence — "Saving…" indicator in the Priorität field, otherwise fully German page](../../screenshots/BUG-INE-004/saving-toast-untranslated.png)

### Retest screenshot

![Retest result — "Wird gespeichert…" now shown correctly in German](../../screenshots/BUG-INE-004/retest-2026-09-10-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error. Confirmed via a `MutationObserver` attached to `document.body`, since the indicator is visible for under a second.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
