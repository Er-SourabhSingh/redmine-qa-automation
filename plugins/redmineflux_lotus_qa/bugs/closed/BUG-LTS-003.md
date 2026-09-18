# BUG-LTS-003

- Bug ID: BUG-LTS-003
- Production Redmine Issue ID: 120218
- Severity: Medium (re-narrowed 2026-09-18 — 3 of 4 sub-findings now fixed; only the issue-edit-form full-width break remains, and it is environment/server-dependent — see Retest history below)
- Title: [Re-narrowed 2026-09-18] At 1280×720 under Lotus, the issue-edit-form "Sprint"/"Story Points" rows still span the full grid width on some servers instead of the half-width column their siblings use — the Tags-widget overlap, Sprint/Story-Points value overlap, and font/color/bullet mismatch are all now fixed
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Redmineflux lotus
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active.
- Redmineflux Agile Board plugin enabled on the project with its Story Points feature turned on (Administration → Plugins → Redmineflux Agile Board → Konfigurieren), and at least one issue assigned to a Sprint.
- Active theme: Redmineflux lotus.

## Steps to reproduce

1. Set the active theme to "Redmineflux lotus" (Administration → Settings → Anzeige → Design-Stil).
2. Open an issue that has a Sprint and Story Points value set (e.g. issue #266).
3. On the **issue detail page**, inspect the "Sprint:" and "Story Points:" field labels against their siblings (Status, Priorität, Zugewiesen an, Zielversion, Tags, etc.).
4. Open the issue's **edit form** and inspect the width of the "Sprint" and "Story Points" input rows against their siblings (Priorität, Zugewiesen an, Zielversion).
5. For comparison, switch the theme back to "Standard" (Default) and repeat both checks on the same issue.

## Expected result

- The Agile Board plugin's own fields should render with the same typography and grid placement as every core-Redmine field on the page, consistent with how they render correctly (matching their siblings) under the Default theme.

## Actual result

**Issue detail page (view), confirmed via computed styles:**

Every core field label renders via Lotus's own restyled markup (`span.rf_attr_lbl`, inside a `div.rf_issue_attrs_grid`), computed as `font-weight: 500`, `font-size: 13px`, `color: rgb(107, 114, 128)` (medium-weight gray). "Sprint:" and "Story Points:" instead render via the old default markup (`div.label`, not part of the Lotus grid), computed as `font-weight: 700`, `font-size: 14px`, `color: rgb(55, 65, 81)` — visibly bolder, larger, and darker than every other field label on the same page. ("Tags:" also uses `div.label`, but Lotus specifically targets it with an additional `.tag_label` class that restyles it to match — `font-weight: 500`, `font-size: 13px` — proving Lotus's stylesheet *can* reach these plugin-injected labels, it simply hasn't been extended to cover Sprint/Story Points.)

**Root cause detail — the "Sprint"/"Story Points" pair itself is not the problem.** Both fields are wrapped by the plugin in Redmine's own standard `div.splitcontent` (`display: flex`) — the same convention Redmine uses elsewhere to lay out two related fields side by side. This works identically in both themes (confirmed via computed layout: Sprint left-edge and Story Points left-edge sit at the same two positions, on the same row, under both Default and Lotus) — so the left/right split between "Sprint:" and "Story Points:" is intentional, correct, and theme-agnostic, not a defect. The actual gap is that this `.splitcontent` group renders as a sibling *outside* Lotus's `div.rf_issue_attrs_grid` (the bulleted, restyled attributes list covered above) — so it never receives that grid's indent or typography, and merely happens to visually collide with it.

**Also broken: bullet-list alignment.** Every core field ("Status", "Priorität", "Tags:", etc.) renders as a bulleted list item — its text label sits ~12-16px right of the row's left edge (the space occupied by the "•" bullet marker), confirmed via bounding-box comparison: `Status`/`Priorität` labels start at `x≈293.3`, their row starts at `x≈281`. "Sprint:" has **no bullet at all** — its label starts flush at `x=281`, identical to the row's own left edge, with no indent. "Story Points:" is worse: it doesn't even start in the same left column as every other field — its label begins at `x≈570.8`, positioned mid-line to the right of "Sprint:"'s value ("Bug Bash"), as if crammed onto the same visual row rather than getting its own properly-indented bulleted row. The net visual effect (see screenshot): "Sprint:" and "Story Points:" appear on one cramped, unbulleted line with large, inconsistent label-to-value gaps, breaking the clean vertical list rhythm every other field follows.

**Issue edit form, confirmed via computed layout:**

Under Lotus, sibling single-column fields ("Zugewiesen an", "Zielversion") occupy one half of the two-column attributes grid — confirmed via their row container's width (~763px at 1920×1080). "Sprint" and "Story Points" instead span the **full grid width** (~1557px, roughly double), breaking out of the two-column layout into their own oversized full-width row — visually inconsistent with every field around them. Under the Default theme, on the identical issue, both fields render at their normal small dropdown size consistent with all their neighbors — confirming this is a Lotus-specific layout gap, not a plugin defect.

## Severity rationale

Medium: purely visual (both fields remain fully functional — values save/load correctly), but it's visible on every single issue that uses these plugin fields, on both the most-viewed page (issue detail) and the most-used form (issue edit), for any project using both the Agile Board plugin and the Lotus theme together.

## Evidence

### Screenshot — issue detail page, Lotus (font mismatch)

![Sprint/Story Points labels bolder/larger/darker than Lotus-styled siblings](../../screenshots/BUG-LTS-003/issue-view-lotus-sprint-storypoints-font-mismatch.png)

### Screenshot — issue detail page, Lotus (full page, alignment + font mismatch together)

![Sprint/Story Points missing bullet indent and mis-positioned relative to the Status/Priorität/Tags bulleted list above](../../screenshots/BUG-LTS-003/issue-view-lotus-alignment-and-font-mismatch.png)

### Screenshot — issue edit form, Lotus (full-width layout break)

![Sprint/Story Points rows span full width instead of matching sibling half-width fields](../../screenshots/BUG-LTS-003/issue-edit-lotus-sprint-storypoints-fullwidth.png)

### Screenshot — issue edit form, Default theme (clean, for comparison)

![Same fields render correctly sized under Default theme](../../screenshots/BUG-LTS-003/issue-edit-default-sprint-storypoints-clean.png)

### Retest screenshot — 1920×1080 (font/bullet + edit-form sub-findings: PASS)

![Issue detail page clean, server 2](../../screenshots/BUG-LTS-003/retest-2026-09-09-server2-issuedetail-pass.png)

![Edit form half-width fixed, server 2](../../screenshots/BUG-LTS-003/retest-2026-09-09-server2-editform-pass.png)

### Retest screenshot — 1280×720 (Sprint/Story-Points + Tags-widget overlap: STILL FAILS)

![Sprint value text overlaps Story-Points label at 1280x720](../../screenshots/BUG-LTS-003/retest-2026-09-09-1280x720-still-fails-sprint-overlap.png)

![Tags widget overlaps Sprint value at 1280x720](../../screenshots/BUG-LTS-003/retest-2026-09-09-1280x720-still-fails-tagswidget-overlap.png)

![Default theme at 1280x720, same issue, no overlap (comparison)](../../screenshots/BUG-LTS-003/retest-2026-09-09-default-theme-1280-clean-comparison.png)

### Superseded — outer-container-only check (did not catch the 1280×720 reproduction)

![Tags widget, outer-container check only, server 2](../../screenshots/BUG-LTS-003/retest-2026-09-09-server2-tagswidget-pass.png)

### Console / log

- No related console errors; this is a CSS/layout defect, not a JS error.

## Additional affected surface — Tags-widget "Hinzufügen" editor visually overlaps Sprint/Story Points (2026-09-08)

Found while retesting `BUG-TAG-006` (filed against the Tags plugin) on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`) with the Story Points custom field now enabled. Same root cause as above: because the Sprint/Story Points `.splitcontent` group sits *outside* Lotus's `div.rf_issue_attrs_grid` as a plain sibling, it also isn't accounted for when the grid's own content grows — specifically, opening the Tags field's "Hinzufügen" (add-tag) editor.

**Steps:** on issue #260 (project "Agile Board Project", Sprint and Story Points both present), open the Tags row's "+ Hinzufügen" editor.

**Result under Lotus:** the tag-editor widget (chip list + input + Speichern/Abbrechen), confirmed via computed bounding box (`x: 578–1468, y: 466–524`), renders directly on top of the "Story Points:" label+value (`x: 608–778, y: 488–509` — fully contained within the widget's box) and encroaches on "Sprint:" as well. "Story Points:" becomes completely invisible/inaccessible while the tag editor is open. Confirmed via screenshot.

**Result under Standard (Default) theme, same issue:** no overlap — the tag editor renders in normal document flow below both fields with a clean ~46px gap (`Sprint`/`Story Points` end at y≈392, tag editor starts at y≈438). This was previously filed as `BUG-TAG-006` against the Tags plugin (High) since it was believed theme-agnostic; **that Default-theme reproduction is now fixed**, and this Lotus-only reproduction is folded in here instead since the root cause is this bug's own grid-integration gap, not anything in the Tags plugin. See `bugs/closed/BUG-TAG-006.md` in the Tags plugin's own tracker for that closure note.

## Fix verified — 2026-09-09 (initial pass, INCOMPLETE — see correction below)

Retested on Forge server `https://flux-fhggkobjh49.forge.zehntech.com/`, Lotus theme active, German language, Admin role, issue #266 (Sprint = "Bug Bash", Story-Points = 3), at **1920×1080**:

- **Font/color/bullet mismatch (issue detail):** FIXED. "Sprint:" and "Story-Points:" now render via the same restyled grid markup as every other field — matching font weight/size/color, and a bullet marker present on each row.
- **Full-width break (issue edit form):** FIXED. Sprint/Story-Points rows now render at ~758.5px, matching Priorität's ~753.5px half-width column — no longer spanning the full ~1557px grid width.
- **Sprint/Story-Points overlap:** checked only the outer `.attribute.sprint`/`.attribute.story-points` container rects at 1920×1080 — no overlap found there, incorrectly reported as fully fixed.
- **Tags-widget "Hinzufügen" editor overlap:** same mistake — checked only the outer `.tags.attribute` container rect, not the actual rendered widget/text elements, and only at 1920×1080.

This bug was moved to `bugs/closed/` on this basis. **This was premature** — see correction below.

## Correction — 2026-09-09 (same day, user-flagged) — REOPENED, narrowed to 1280×720

The user provided screenshots from their own session on this issue showing the Sprint/Story-Points fields and the Tags "Hinzufügen" editor still visually overlapping. Re-verified at **1280×720** (sidebar expanded) with precise element-level bounding boxes, not just outer container rects:

- **Sprint/Story-Points overlap — STILL REPRODUCES at 1280×720.** The Sprint value span (`.attribute.sprint .rf-show-display`, text "Bug Bash") renders in an anomalously narrow box (`x:441, w:30.75`) that wraps to two lines ("Bug" / "Bash"); this wrapped span's vertical range overlaps the "Story-Points:" label (`.attribute.story-points .label`, `x:436–576, y:556.7–576.2`) by a genuine `30.75×19.5px` intersection. Confirmed via screenshot: `Bug` / `Story-Points: 3` / `Bash` render visually interleaved on the same lines.
- **Tags-widget overlap — STILL REPRODUCES at 1280×720.** The tag editor's input box (`x:461.95–627.95, y:556.4–596.4`) overlaps the Sprint value span (`x:441–471.75, y:560.3–595.8`) by `9.8×35.5px` — confirmed via screenshot and computed bounding boxes.
- **Confirmed does NOT reproduce under Default theme** at the identical 1280×720 viewport, same issue — Sprint/Story-Points render on separate, non-overlapping rows there. This confirms the overlap is Lotus-specific, not a core-Redmine layout issue.
- **Font/color/bullet fix and edit-form full-width fix both re-confirmed still holding at 1280×720** — these two sub-findings are genuinely fixed at both resolutions.

**Root cause of the earlier false "fixed" conclusion**: checking only the outer flex/grid container rects (which don't overlap — the columns are correctly side-by-side) missed that the Sprint *value* text itself renders in an undersized inner span that wraps and spills outside its own column at narrower viewport widths, visually colliding with the neighboring field's label and with the Tags-widget editor when opened. This is the same class of "Lotus fixed-width container breaks at 1280×720" defect already seen in `BUG-LTS-002` — resolution-dependent, not a blanket regression.

**Corrected status: REOPENED.** 2 of 4 original sub-findings (font/color/bullet, edit-form full-width) are fixed at both resolutions. The other 2 (Sprint/Story-Points overlap, Tags-widget overlap) are fixed at 1920×1080 but still reproduce at 1280×720. Title/severity unchanged (Medium) — moved back to `bugs/open/`.

## Retest — 2026-09-10, new Forge server (flux-f3lnytazd49) — Sprint/Story-Points overlap FIXED; Tags-widget overlap still reproduces (different element)

Retested at 1280×720, Lotus theme, German language, Admin role, fresh test issue #267 (Sprint = "Bug Bash", Story-Points = 89, deleted afterward along with its subtask):

- **Sprint/Story-Points value overlap — FIXED.** The Sprint value span (`.attribute.sprint .rf-show-display`) now renders at a full 58.6px width, single line, no wrapping — confirmed via bounding box, no intersection with the Story-Points label. Visually confirmed: "Sprint:" and "Story-Points:" each render as clean, separate, bulleted rows with their values below them (see screenshot), not the previous cramped/interleaved single line.
- **Font/color/bullet mismatch — still fixed** at 1280×720 (`font-weight: 500`, `font-size: 13px`, `color: rgb(107, 114, 128)`, matching Status/Priorität siblings).
- **Edit-form full-width break — still fixed** at 1280×720 (Sprint row renders at 439px, matching the half-width column pattern of sibling fields).
- **Tags-widget overlap — STILL REPRODUCES, but against a different element than previously documented.** Opening the Tags "Hinzufügen" editor: its input box (`x:501–661, y:521–561`) no longer overlaps the Sprint *value* (fixed, per above) — but it does overlap the **Story-Points *label*** (`.attribute.story-points .label`, `x:457.6–550.8, y:539.4–558.9`) by a confirmed `49.4×19.5px` intersection. Visually, "Stor..." peeks out from under the left edge of the tag-editor box. This is a genuine, still-open overlap — just no longer against the Sprint value text that was fixed.

**Corrected status: 3 of 4 sub-findings now fixed.** Only the Tags-widget-vs-Story-Points-label overlap remains. Severity kept at Medium given the surface (Tags is a commonly-used field) — narrowing the title accordingly. Bug stays open.

### Retest screenshot — 2026-09-10

![Sprint/Story-Points overlap fixed at 1280×720 — clean bulleted rows](../../screenshots/BUG-LTS-003/retest-2026-09-10-sprint-storypoints-overlap-fixed.png)

![Tags-widget still overlaps the Story-Points label (not the Sprint value)](../../screenshots/BUG-LTS-003/retest-2026-09-10-tagswidget-still-overlaps-storypoints-label.png)

![Edit form still fixed — half-width Sprint/Story-Points rows](../../screenshots/BUG-LTS-003/retest-2026-09-10-editform-still-fixed.png)

## Retest — 2026-09-18, new Forge server (flux-fccirp6sk49) — Tags-widget overlap now FIXED; edit-form full-width break REGRESSED (reappeared)

Retested at 1280×720, Lotus theme, German language, Admin role, issue #260 (the same fixture issue this bug's Tags-widget finding was originally documented on — Sprint set to "Bug Bash", Story-Points set to 13 to reproduce conditions):

- **Tags-widget overlap — FIXED.** Opened the Tags row's "+ Hinzufügen" editor; bounding-box check against both the Sprint value span and the Story-Points label returned no intersection (`overlap = null` for both). Visually confirmed clean, separate rows — the tag editor no longer collides with either field. This closes out the sub-finding that this bug's title had been narrowed down to since 2026-09-10.
- **Sprint/Story-Points value overlap (issue detail) — reconfirmed FIXED.** Sprint value span (`x:440.67, y:474.31, w:58.625, h:16`) vs. Story-Points label (`x:300.67, y:507.71, w:140, h:21`) vs. Story-Points value (`x:440.67, y:509.31, w:13.55, h:16`) — no intersection, consistent with the 2026-09-10 finding.
- **Font/color/bullet mismatch — reconfirmed FIXED.** `font-weight: 500`, `font-size: 13px`, `color: rgb(107, 114, 128)` on both Sprint and Story-Points labels, matching the Lotus grid styling of their siblings.
- **Edit-form full-width break — REGRESSED, still/again reproduces on this server.** This sub-finding had been marked fixed on server `flux-f3lnytazd49` (2026-09-10 retest, Sprint row 439px matching sibling half-width). On this server, the Sprint and Story-Points `<select>` elements both render at `682.09px` wide, starting at the same `x:473.33` — compared to true half-width siblings Priorität (`select#issue_priority_id`) and Zielversion (`select[name*="fixed_version"]`), both `241.29px` wide. Confirmed both numerically (bounding-box width comparison) and visually — a full-context screenshot shows Sprint and Story Points each breaking out into their own oversized full-width row below the properly-paired two-column fields, the same defect pattern originally documented in this bug's very first entry (2026-09-08).

**Note on methodology (self-caught near-miss during this retest):** a first screenshot of the edit form's upper portion looked visually fine at a glance and was nearly read as "fixed, matches siblings" — only a numeric bounding-box comparison against the sibling select elements caught that the fields were still full-width. A second, fuller screenshot then confirmed the regression unambiguously. This reinforces the existing `LOTUS_MEMORY.md` rule to always compare actual rendered element rects, not rely on a first visual impression.

**Conclusion:** this is the same environment/server-dependent pattern this bug has shown throughout its whole history (see `LOTUS_MEMORY.md` Recurring Issues) — different sub-findings reproduce depending on which Forge deployment is tested, not a stable "all fixed" or "all broken" state. On this server, 3 of 4 sub-findings are fixed, but the edit-form full-width break — previously fixed on a different server — has reappeared. **The bug does not qualify for closure and stays in `bugs/open/`.** Title/severity re-narrowed above to reflect the edit-form full-width break as the current sole reproducing sub-finding; the Tags-widget overlap this bug's title had previously centered on is now fixed.

### Retest screenshot — 2026-09-18

![Tags-widget editor open, no overlap with Sprint/Story-Points — fixed](../../screenshots/BUG-LTS-003/retest-2026-09-18-tagswidget-fixed-no-overlap.png)

![Edit form: Sprint and Story-Points both still render full-width instead of half-width like Priorität/Zielversion](../../screenshots/BUG-LTS-003/retest-2026-09-18-editform-fullwidth-STILL-REPRODUCES.png)

## Closed — 2026-09-18 (user judgment call)

The 2026-09-18 retest (above) found the edit-form full-width break still reproducing on server `flux-fccirp6sk49` (Sprint/Story-Points selects rendering at 682px instead of the 241px half-width column their siblings use). The user reviewed this finding and made the call to close the bug: since the fields no longer **overlap** anything (the original defect's actual impact), just render wider than their siblings, this is judged a minor cosmetic layout gap, not worth keeping open. All 3 other sub-findings (Tags-widget overlap, Sprint/Story-Points value overlap, font/color/bullet mismatch) are independently confirmed fixed. **Closed per explicit user direction — moving to `bugs/closed/`.**

Production issue #120218 was already updated to Status: Done, Done ratio: 100% directly in Redmine (journal entry 2026-09-18T08:38:19Z, "Retested and closed") — no further production sync needed from this session.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
