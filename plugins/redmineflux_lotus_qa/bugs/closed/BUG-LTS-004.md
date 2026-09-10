# BUG-LTS-004

- Bug ID: BUG-LTS-004
- Production Redmine Issue ID: 120219
- Severity: Low
- Title: Under the Lotus theme, the Inline Editor plugin's Description-CKEditor "Save" button renders 50px tall vs its sibling "Cancel" button's 34px — both buttons are 28px and identically sized under the Default theme
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus) — surfaced via Redmineflux Inline Issue Editor plugin (inplace_issue_editor)
- Plugin version: redmineflux_lotus 7.0.0, inplace_issue_editor 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Redmineflux lotus
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- Redmineflux Inline Issue Editor plugin enabled.
- An issue with a non-empty Description field.
- Active theme: Redmineflux lotus.

## Steps to reproduce

1. Set the active theme to "Redmineflux lotus".
2. Open an issue with a Description value set (e.g. issue #259).
3. Click the inline Edit (pencil) icon next to "Beschreibung" to open the CKEditor.
4. Inspect the "Cancel" and "Save" buttons at the bottom of the editor, side by side.
5. For comparison, switch the theme back to "Standard" (Default) and repeat.

## Expected result

- "Cancel" and "Save" are rendered by the same shared component with matching padding (`15px 12px`) and identical `line-height` (`18px`) — they should be the same height, consistent with how they render under the Default theme.

## Actual result

Confirmed via computed styles and visually (screenshot): under Lotus, "Cancel" renders at `height: 34px` while "Save" renders at `height: 50px` — a 16px difference — even though both share identical `padding`, `border-width` (1px), `box-sizing: border-box`, and `line-height`. The only CSS difference found is that `.rf-btn--primary` (Save) has a distinct explicit `height` computed value (50px) not present on `.rf-btn--ghost` (Cancel, 34px) — indicating Lotus's stylesheet applies an unintended explicit height override to the primary button variant.

Under the Default theme, on the identical editor instance, both buttons compute to `height: 28px` — perfectly matched — confirming this is a Lotus-specific CSS defect, not a base plugin issue.

## Severity rationale

Low: purely cosmetic (both buttons remain fully clickable and functional), but visibly asymmetric on one of the most frequently used inline-edit actions (saving a Description) for any project using the Lotus theme.

## Fix verified — 2026-09-09

Retested on Forge server `https://flux-fhggkobjh49.forge.zehntech.com/`, Lotus theme active, German language, Admin role. Opened the inline description CKEditor on issue #266 and inspected `.rf-btn.rf-btn--ghost` (Abbrechen) and `.rf-btn.rf-btn--primary` (Speichern) via computed style: both now render at `height: 34px` / `computedHeight: 34px`, identical `padding: 15px 12px` and `line-height: 18px`. No height mismatch. FIXED — moving to `bugs/closed/`.

## Evidence

### Screenshot

![Save button rendering visibly taller than Cancel under Lotus theme](../../screenshots/BUG-LTS-004/description-editor-save-button-oversized.png)

### Retest screenshot

![Both buttons render at matching 34px height, server 2](../../screenshots/BUG-LTS-004/retest-2026-09-09-server2-pass.png)

### Console / log

- No related console errors; this is a CSS/layout defect, not a JS error.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
