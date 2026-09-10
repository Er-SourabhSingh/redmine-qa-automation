# BUG-TAG-007

- Bug ID: BUG-TAG-007
- Production Redmine Issue ID: 120249
- Severity: Medium
- Title: Under Standard (Default) theme, the "Markierungen" (Tags) field does not follow the same inline "label: value" row layout as every sibling field — both the "+ Hinzufügen" trigger and the tag-edit widget itself render misaligned with the "Markierungen:" label
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frtsiofsm49.forge.zehntech.com/`
- Theme: Standard (Default) — confirmed NOT reproducing under Lotus, see Cross-theme note
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- Standard (Default) theme active.
- An issue with at least one existing tag (e.g. issue #260, "Agile Board Project", tags `sadfsafsdf`/`weq rqwel krjlkwqej lkrjwq`).

## Steps to reproduce

1. Log in as admin (German language, Standard theme active).
2. Open an issue detail page that has existing tags (e.g. `/issues/260`).
3. Observe the "Markierungen:" row in view mode, and compare its layout against sibling fields ("Status:", "Priorität:", "Sprint:", "Story Points:", etc.).
4. Click the "Hinzufügen" trigger next to "Markierungen:" to open the tag-edit widget, and again compare its position/alignment against the label.

## Expected result

- The "Markierungen:" field should follow the same `label: value` inline row convention every other field on the page uses, and its "Hinzufügen" (add) control should sit immediately adjacent to the tag values, consistent with how other fields present their controls.

## Actual result

**View mode:** user-reported (screenshot) and confirmed live via computed bounding boxes — the "Hinzufügen" trigger link renders far to the right and on its own separate row, disconnected from the "Markierungen:" label and its tag chips (label at `x:36–140, y:402–421`; trigger at `x:1790–1869, y:433–451` — a full row lower and at the opposite edge of the page). This is because the trigger uses Redmine's generic `.contextual` class (normally reserved for a page-level top-right action bar), not a field-adjacent control.

**Edit mode:** clicking "Hinzufügen" opens the tag-edit widget (chips + input + Speichern/Abbrechen) on a **new line below** the "Markierungen:" label, flush-left at the same x-position as the label itself — not inline with the label the way every other field's value/edit-control sits (e.g. "Sprint:" and its value render side-by-side on one line).

**Root cause, confirmed via DOM inspection:** every core field uses Redmine's standard paired markup —
```html
<div class="attribute sprint">
  <div class="label">Sprint:</div>
  <div class="value">...</div>
</div>
```
— where `.attribute` is a flex/inline container that keeps `.label` and `.value` on the same row. The Tags plugin's own markup for this field is just:
```html
<div class="label tag_label"><span>Markierungen:</span></div>
```
with **no `.attribute` wrapper and no sibling `.value` element** — the tag chips and edit widget are injected as an entirely separate block elsewhere in the layout, so nothing keeps them inline with the label. This is a structural markup gap in the Tags plugin, not a missing CSS rule alone.

## Severity rationale

Medium: purely a layout/visual inconsistency (tagging itself still works correctly), but it's visible on every issue with tags, every time under the plugin's most commonly used theme (Standard/Default), and makes the field look broken/disconnected relative to its neighbors — a real, everyday visual defect, not an edge case.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme (confirmed active via DOM — no theme stylesheet link present).
- Created test issue #266 (Agile Board Project) with one tag ("retesttagalignment").
- **View mode**: DOM inspection confirms the field now uses the standard paired markup — `<div class="tags attribute"><div class="label tag_label">Markierungen:</div>...<div class="value">...</div></div>` — with a genuine `.attribute` wrapper (previously absent). Bounding boxes confirm the label (y≈466), the tag chip, and the "Hinzufügen" trigger (y≈466) all sit on the same row, matching every sibling field.
- **Edit mode**: clicking "Hinzufügen" opens the tag-edit widget (chip + input + Speichern/Abbrechen) inline on the same row as the "Markierungen:" label — no longer dropping to a new line below it.
- Both view and edit mode now match the expected `label: value` inline convention used by every other field. Test issue's tag-edit action was cancelled (Abbrechen) after verification, no data change persisted.
- **Fixed. Closing.**

## Cross-theme note

**Does NOT reproduce under the Redmineflux Lotus theme.** Under Lotus, the same issue (#260) renders "Markierungen:" and its tag chips inline on one bulleted row, with a properly-styled "+ Hinzufügen" button on the same row — and opening the edit widget keeps it inline with the label too (chips + input + Speichern/Abbrechen all on the same row as "Markierungen:"). This means Lotus's own stylesheet independently restyles this field into its bulleted-flex convention, compensating for the Tags plugin's non-standard markup — but Standard theme's core CSS has no equivalent fallback, so the structural gap shows through only there.

## Evidence

### Screenshot — view mode, "Hinzufügen" trigger disconnected from the label/chips (Standard theme)

![View mode misalignment](../../screenshots/BUG-TAG-007/view-mode-hinzufugen-misaligned.png)

### Screenshot — edit mode, widget drops to a new line below the label instead of sitting inline (Standard theme)

![Edit mode misalignment](../../screenshots/BUG-TAG-007/edit-mode-widget-misaligned.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — view mode, now inline](../../screenshots/BUG-TAG-007/retest-2026-09-09-view-mode-pass.png)

![Retest — edit mode, now inline](../../screenshots/BUG-TAG-007/retest-2026-09-09-edit-mode-pass.png)

### Console / log

- No related console errors; this is a CSS/markup layout defect, not a JS error.

## Duplicate check

- Duplicate found: No — distinct from `BUG-TAG-006` (which was about the tag-edit widget visually overlapping the Agile Board plugin's Sprint/Story Points fields under Lotus theme, since folded into `BUG-LTS-003`). This bug is about the tag field's own internal alignment relative to its own label, under Standard theme specifically, and does not involve any other plugin's fields.
- Existing bug reference (if duplicate): N/A
