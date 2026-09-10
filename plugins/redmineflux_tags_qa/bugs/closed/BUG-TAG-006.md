# BUG-TAG-006

- Bug ID: BUG-TAG-006
- Production Redmine Issue ID: 120109
- Severity: High
- Title: Opening the "Add Tags" widget visually overlaps the Agile Board plugin's "Sprint"/"Story Points" row on the issue detail page
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags) — cross-plugin conflict with Redmineflux Agile Board (agile_board)
- Plugin version: flux_tags 7.0.0, agile_board 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine) and Lotus (both confirmed — see Cross-theme note)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- A project with the Agile Board module enabled (adds "Sprint" and "Story Points" fields to the issue detail sidebar, rendered immediately below the "Tags:" row).
- Reproduced on issue #260, "Agile Board Project".
- Note: this was **missed** in the initial Tag Plugin sweep because that testing used issue #230 in project "Software development5", which does not have Agile Board enabled — this defect only manifests on projects where both plugins' fields are present on the same issue.

## Steps to reproduce

1. Log in as admin (German language active).
2. Open an issue in a project with Agile Board enabled (e.g. `/issues/260`).
3. Click the "Hinzufügen" / "+ Hinzufügen" button next to the "Tags:" field.

## Expected result

- The tag-input widget (input box + Speichern/Abbrechen buttons) should open without obscuring any other field on the page — either by pushing the "Sprint:"/"Story Points:" row down, or by rendering in a way that doesn't spatially collide with it.

## Actual result

The tag-input widget renders **on top of** the "Sprint:"/"Story Points:" row instead of the row moving out of the way. Confirmed with exact bounding-box measurements, not just visual impression:

- Tag widget: `x: 739–1320, y: 435–493`
- "Story Points:" label+value row: `x: 665–1044, y: 457–482`

These rectangles genuinely overlap (overlap region: x 739–1044, y 457–482) — the widget covers roughly the right two-thirds of the "Story Points:" label and its value, and visually cuts across the "Sprint:" row as well (per user-supplied screenshots showing "Story P[oints]" text clipped mid-word and a small Edit-pencil icon for Sprint poking out from underneath the tag input box).

Both rows are rendered in normal document flow (`position: static` on the tag widget's container — not an absolutely-positioned overlay), which means the real defect is that the layout does not reflow/grow to accommodate the tag widget's height when the Sprint/Story Points row is also present — this row simply never gets pushed down.

## Severity rationale

High: this actively obscures real data (Sprint and Story Points values) and interactive controls (the Sprint field's own Edit pencil) every time a user opens the tag editor on any issue in an Agile-Board-enabled project — a common, everyday combination, not an edge case. It is a genuine cross-plugin layout conflict, not merely cosmetic.

## Cross-theme note

Confirmed by the user to reproduce under both the Default theme and independently re-confirmed by this investigation under the Lotus theme (same overlap pattern, same two plugins' fields) — this is a theme-agnostic layout defect in how the Tags widget's markup interacts with the Agile Board plugin's injected fields, not specific to either theme.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-006/tag-widget-overlaps-sprint-storypoints.png)

*(User-supplied screenshots showing the same overlap, including a more severe variant where "Story P[oints]" text is clipped mid-word and a Sprint field Edit-pencil icon pokes out from under the tag input box, prompted this investigation.)*

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-006/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a CSS/layout defect.

## Reconfirmation attempt — 2026-09-08, new Forge server (inconclusive)

Attempted retest on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`), same project name "Agile Board Project" (issue #260). Opened the Tags "Hinzufügen" widget and checked bounding boxes plus a screenshot — **no overlap this time**, but this environment has **no "Story Points" custom field configured at all** (`/custom_fields` is empty — a fresh server, the field was never created/enabled here as it was on the original server). Only "Sprint:" is present on this issue, and the tag widget renders cleanly below it with no collision. Since this bug's documented precondition (both Sprint AND Story Points fields present) isn't met on this server, this is **not a valid negative retest** — it neither confirms nor refutes the fix. Would need the Story Points custom field recreated and enabled on a Bug-tracker issue here to properly re-verify.

## Fix verified — 2026-09-08, new Forge server (branch updated, Story Points now enabled by user)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated) with the "Story Points" custom field re-enabled on the "Agile Board Project" per user request, closing the gap that made the previous retest attempt inconclusive. Retested on the same issue (#260), under both Standard and Lotus themes:

- **Standard theme: FIXED.** Opened the Tags "Hinzufügen" editor — confirmed via bounding boxes that the widget renders cleanly below both "Sprint:" and "Story Points:" with a ~46px gap, no overlap. Screenshot confirms both fields fully visible and readable while the tag editor is open.
- **Lotus theme: still reproduces**, but this is now understood to be a **Lotus-theme-owned defect, not a Tags-plugin defect** — the tag editor's bounding box (`x: 578–1468, y: 466–524`) still fully overlaps "Story Points:" (`x: 608–778, y: 488–509`), rendering it completely invisible while the tag editor is open. Root-caused: this is the same underlying gap as `BUG-LTS-003` (Agile Board's Sprint/Story Points fields sit *outside* Lotus's own `rf_issue_attrs_grid` as a plain sibling `.splitcontent` group, so Lotus's layout never accounts for that sibling when the grid's own content — here, the tag editor — grows). Folded into `BUG-LTS-003` as an additional affected surface (see that bug's own file in the Lotus theme's tracker) rather than kept open here, since fixing it requires Lotus-side layout work, not anything in this plugin.

**Verdict: this Tags-plugin bug is genuinely fixed.** The originally-reported Default/Standard-theme overlap no longer occurs. The Lotus-theme reproduction is a distinct, already-tracked Lotus theme defect (`BUG-LTS-003`), not a reason to keep this bug open against the Tags plugin. **Closing.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
