# Handoff — Redmineflux Agile Board

## Last Session

- Date: 2026-09-21
- Redmine Version: 7.0.0 (local Docker)
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010

## Completed This Session (2026-09-21, final) — both bugs retested FIXED, closed, production synced, regressed

Developer merged `feature/backlog-sprint-points` into `master` and released plugin **7.1.0**, with three fix
commits: `f3ba81b` (BUG-AGB-010's `query_id` FrozenError) and `32141ba` + `50a8a76` (BUG-AGB-011's drag-badge
desync, generalized to every board type, not just the Backlog's sprint columns).

- Restarted the Redmine 7 Docker container + Redis/Sidekiq to pick up the new branch. No plugin migrations
  were added between `288d293` and `50a8a76`, so `rake redmine:plugins:migrate` wasn't needed.
- **BUG-AGB-010 retested — FIXED.** `?query_id=1` on both `/backlog` and `/agile_board` now returns a clean
  404 (`ActiveRecord::RecordNotFound`) instead of the `FrozenError` 500. Server log confirms the condition is
  now built correctly.
- **BUG-AGB-011 retested — FIXED.** Dragged a 5-pt card between two sprint columns: both badges updated live
  and correctly, instantly, no reload (`13/18→13/13`, `5/21→5/26`). Extended the check to version columns
  (not part of the original bug repro) — same live-correct behavior (`3/8→3/13`, `23/199→23/194`), confirming
  the fix's "every board" scope. Then edited the moved card's points inline without reloading — badge updated
  correctly from the now-accurate base (`5/26→5/29`), and a reload matched exactly. Both mechanisms (drag
  desync, delta-on-stale-base compounding) are confirmed fixed.
- Both bugs moved from `bugs/open/` to `bugs/closed/` with full retest evidence (screenshots +
  before/after numbers). `bugs/open/` is now **empty**.
- **Production sync** (explicit user approval, both actions): #120986 and #120990 updated In QA → Done, 100%
  with retest summaries; production testcase #120941 in run #577 updated back to **Passed** (result ID 14287).
- **Regression on Feature #120436's own suite** (`AGILE_BACKLOG_AND_SPRINTS.md`, TC-AGB-029–553), by the
  user's explicit scope choice this session (not the full plugin): directly retested the drag/badge-update
  TCs with fresh evidence (TC-AGB-030–532, 536, 537, 539), spot-reconfirmed the setting-toggle TCs
  (538/539/542), and left TCs on code paths neither fix touched (width/API/permissions/translation/fractional
  points) as previously-passing with rationale — see the testcase file's "Post-fix regression" section for
  the full per-TC table.
- `STATUS.md` updated: 0 open bugs, but still `In Progress` — a full plugin-wide final-cycle regression
  (§27) covering every suite is still required before `Complete`, since only #120436's suite was regressed
  this session by explicit user choice.

## Completed This Session (2026-09-21, earlier) — BUG-AGB-011 found, correcting the #120436 sign-off

After Feature #120436 had already been marked Done on production earlier this same session, the user live-tested
the Backlog and reported (with a screenshot) a nonsensical negative story-points total (`13 / -74 SP`) after
dragging cards between sprint/version columns, then separately noted "after refresh it show correct value" — the
key clue that this is a live client-side display bug, not data corruption.

- Reproduced independently: dragged a 2-point card into a column whose badge read `5 / 13 SP` — badge stayed
  `5 / 13 SP` (unchanged; true total was now 15). Then edited that same card's points 2→8 (+6) via the inline
  editor — badge became `5 / 19 SP` (13+6, computed from the stale base), while the true total (confirmed on
  reload) was `5 / 21 SP`.
- Root-caused in `backlog.html.erb`'s jQuery UI Sortable `update` handler (~line 1810): it calls
  `updateSingleColumnCount()` on drop, which only maintains the `.jira-issue-count` card count — nowhere does the
  drag/drop path read or write `.backlog-column-story-points`, the badge `backlog_story_points_badge` renders only
  at initial page load. `rf_story_points.js`'s own `updateBadges()` (wired correctly to the inline-edit save
  handler) then applies its delta on top of whatever the (possibly drag-stale) badge currently shows, compounding
  the error.
- Filed **`BUG-AGB-011`** (High) — squarely inside #120436's own delivered code (the badge feature itself), unlike
  the pre-existing/unrelated `BUG-AGB-010`. Two evidence screenshots captured
  (`screenshots/BUG-AGB-011/live-wrong-badge-before-refresh.png`, `.../correct-badge-after-refresh.png`).
- **Corrected `testcases/AGILE_BACKLOG_AND_SPRINTS.md`'s regression "Result" line**, which previously (and
  incorrectly) claimed "No new defects found in Feature #120436's own code" — added a correction block pointing to
  BUG-AGB-011 and explaining why TC-by-TC execution (drag and inline-edit tested as separate, reload-separated
  scenarios) missed it.
- Updated `STATUS.md` open-bug count 1 → 2 and flagged the #120436 Done-status implication.
- **Reported to production as #120990** (ztflux, assigned Prashant Chaurasia, user id 410; Priority High,
  Defect Severity "High-severity") and **#120436 reopened** (Done/100% → In QA/90%, with a comment
  cross-referencing #120990) — both actions taken with the user's explicit, action-specific approval
  (confirmed via AskUserQuestion: "Report BUG-AGB-011 + reopen #120436", assignee "Prashant Chaurasia").
  #120436 returns to Done once #120990 is fixed and retested.

## Completed This Session (2026-09-10, continued) — BUG-AGB-001 FIXED, final cycle regression, plugin Complete

Retested the sole remaining sub-finding (the board-config form's "Tags" checkbox) on a third Forge server, German language (account + system default) + **Standard theme** (environment defaulted to Redmineflux Scarlet — switched to Standard):

- **Board-config form's "Tags" checkbox** (`c[]=tags_relations`) now reads **"Markierungen"** — FIXED, confirmed via `input.name`/`value` cross-check. Every other checkbox on this form is also correctly German.
- Reconfirmed Board-Einstellungen, Global Board, My Page block, New Issue form, issue detail page, and issue edit form all still show "Story-Points" correctly (test issue #266, deleted afterward).
- **`BUG-AGB-001` closed — every sub-finding across its entire history is now fixed.** `bugs/open/` is now **empty**.
- **Final-cycle regression (`SENIOR_QA_STANDARDS.md` §27)** run across all 18 TCs (TC-AGB-104–018) on this server, Standard theme:
  - TC-AGB-104 (header/filter/columns): PASS.
  - TC-AGB-105/TC-AGB-107 (Insights panel): PASS — "Board-Einblicke" fully German, singular "1 Ticket" confirmed (no plural-English regression).
  - TC-AGB-106 (More Filters): PASS — "Weitere Filter" button present.
  - TC-AGB-108 (double-click inline edit modal): PASS — "Vorgang bearbeiten #258".
  - TC-AGB-109 (quick-add): PASS — "+ Ticket erstellen" placeholder confirmed German.
  - TC-AGB-110/008 (Backlog Sprints/Versionen tabs): PASS — German date format (DD.MM.YYYY), no English month strings.
  - TC-AGB-112 (Global Board): PASS — full checkbox-list dump confirmed German.
  - TC-AGB-113 (My Page block): PASS.
  - TC-AGB-114 (custom board create→edit→delete lifecycle): PASS — created a test config, verified "Board bearbeiten"/"Board löschen" labels, "Erfolgreich aktualisiert." update flash, and the delete-confirmation modal's dynamically-interpolated German text, then deleted it cleanly.
  - TC-AGB-115 (Sprint create form): PASS — all labels German including "Beschreibung"/"Enddatum"/"Freigabe".
  - TC-AGB-116 (admin Configure page): PASS — "(Standard: ...)" confirmed, no "(Default: ...)" regression.
  - TC-AGB-117 (resolution testing, 1280×720): PASS — no layout regressions, board summary bar fully German.
  - TC-AGB-121 (Sprints settings tab): PASS — "Nicht geteilt" shown correctly, no raw "not_shared" enum.
  - Drag-and-drop (`BUG-AGB-008`): PASS — real mouse-drag sequence captured "Ticket #258 wurde nach IN PROGRESS verschoben", fully German; card moved back to its original column afterward.
  - **All TCs PASS, zero new failures.**
- `STATUS.md` updated to **Complete** for this plugin.

## Previously Completed (2026-09-10, earlier this day)

Retested the sole open bug (`BUG-AGB-001`, narrowed to the "Sichtbare Kartenfelder" list's own "Story Points" checkbox) on a new Forge server, project "Agile Board Project", German language (account + system default):

- Story Points was disabled on this fresh server — enabled it via Administration → Plugins → Redmineflux Agile Board (plugin-level toggle, not a data-model change).
- **The previously-open Story-Points checkbox is now FIXED everywhere**: Board-Einstellungen (project + global), My Page block (added fresh then removed again), New Issue form, issue detail page, issue edit form — all correctly read "Story-Points". Full label-dump + `input.name`/`value` cross-checks used throughout, not just visual impression.
- **While re-verifying the custom/saved board-config form** (where the bug also previously documented "Last comment"/"Comments" as untranslated): both of those are now fixed, but discovered a **new, previously-undocumented instance** of the same gap — the form's own **"Tags"** checkbox (`c[]` value `tags_relations`) renders in plain English, confirmed via its `input.name`/`value` attributes. No config was saved (cancelled after confirming).
- **`BUG-AGB-001` stays open**, narrowed to just this new "Tags" finding — every previously-documented sub-finding (checkbox-list gap, Story Points on all surfaces) is now fixed. Severity unchanged (Low).
- `bugs/open/` still has 1 bug — final-cycle regression (§27) not yet triggered.

## Previously Completed (2026-09-09)

Retested all 3 open bugs on a newly-provisioned Forge server, German language, Standard theme:

- **BUG-AGB-007** — Settings → Sprints tab: "UI Polish" and "Bug Bash" (the exact two sprints that previously showed raw "not_shared") now correctly show "Nicht geteilt". **Fixed — closed.**
- **BUG-AGB-008** — dragged issue #259 from "IN PROGRESS" to "RESOLVED" (real mouse drag sequence): `MutationObserver` captured "Ticket #259 verschoben nach RESOLVED" — fully German (was "Issue #106 moved to Resolved"). Dragged back to confirm functionality. **Fixed — closed.**
- **BUG-AGB-001** — the Board-Settings checkbox-list gap (the bulk of this bug) reconfirmed fixed on this second consecutive server: project Board-Einstellungen (20/20 labels German), Global Board (same), and My Page block (added fresh since it wasn't present on this account, confirmed all-German, then removed again to restore prior state). The Story Points sub-finding could **not** be retested this pass — this fresh server has no "Story Points" custom field at all (confirmed via `/custom_fields`), and creating one is a data-model change beyond what this retest scope covers unprompted. Bug stays open, narrowed to just that untestable sub-finding.
- `bugs/open/` now contains only `BUG-AGB-001` (narrowed) — not empty, so the plugin-wide final-cycle regression trigger (`SENIOR_QA_STANDARDS.md` §27) does not yet apply.

### Follow-up same day — BUG-AGB-001's Story Points sub-finding retested

The user enabled Story Points via the Agile Board plugin's own Administration → Plugins configuration page ("Story Points aktivieren" checkbox — this is a plugin-level feature toggle, not a core-Redmine custom field, which is why `/custom_fields` didn't show it earlier). Retested with a fresh test issue (#267, Story-Points=3, deleted afterward):

- Board-Einstellungen "Summen anzeigen" group's Story Points toggle → **"Story-Points"** (German hyphenated form). **Fixed.**
- New Issue form field label → **"Story-Points"**. **Fixed.**
- Issue detail page label → **"Story-Points:"**. **Fixed.**
- Issue edit form label → **"Story-Points"**. **Fixed.**
- Board summary bar → **"STORY-POINTS: 3"**. **Fixed.**
- Board-Einstellungen "Sichtbare Kartenfelder" list's own Story Points checkbox → still plain **"Story Points"** (no hyphen). **Still reproduces** — this one checkbox is now the only remaining untranslated string in the entire bug.

Severity narrowed further (not closed) — one single checkbox label remains. Story Points feature left enabled as a standing fixture for future sessions.

## Previously Completed (2026-09-08)

First Stage 1 (German language, Default theme) pass on the Agile Board plugin, using the pre-built "Agile Board Project" (module already enabled):

- TC-AGB-104: Project Agile Board header/filter bar/columns — PASS, fully translated.
- TC-AGB-105: Board Settings panel — mostly PASS. Board-Type, Status-columns, Totals, Column-order all translated; 6 of 19 "Sichtbare Kartenfelder" checkboxes untranslated ("Spent hours", "Parent", "Children count", "Last comment", "Journals count", "Attachments count"). Filed `BUG-AGB-001` (Low).
- TC-AGB-106: "Weitere Filter" panel — PASS, fully translated.
- TC-AGB-107: "Einblicke" (Insights) panel — mostly PASS. All section headings/labels translated; found a pluralization gap (plural counts show English "Issues", singular correctly shows German "Ticket"). Filed `BUG-AGB-002` (Low).
- TC-AGB-108: Double-click inline "Vorgang bearbeiten" edit modal — PASS, fully translated.
- TC-AGB-109: Quick-add issue via column input — PASS, functional.
- TC-AGB-110: Backlog view (Sprints tab) — mostly PASS. Found the unassigned-avatar tooltip reads "Unassigned" (English) instead of "Nicht zugewiesen". Filed `BUG-AGB-003` (Low).
- TC-AGB-111: Backlog view (Versionen tab) — PASS, fully translated.

Overall this plugin shows substantially more thorough i18n coverage than several others tested this cycle (contrast with the Dashboards plugin's near-total absence of translation) — the 3 bugs found are all narrow, Low-severity gaps in an otherwise well-localized plugin.

Second pass this session: tested the Global Agile Board (`/agile_board/global`) and the My Page Agile Board block (`/my/page`), both explicitly requested as follow-up.

- TC-AGB-112: Global Agile Board — mostly PASS. Header/filter bar/summary/tooltip strings all translated; card project-name badges are project display-name data (not a translation concern, same convention as sprint/version names). Both `BUG-AGB-001` (6 of 19 card-field checkboxes) and `BUG-AGB-003` (unassigned-avatar tooltip) reproduce identically here — folded into the existing bugs as additional affected surfaces rather than filed separately.
- TC-AGB-113: My Page Agile Board block — present by default, no manual block-add needed. Block heading/count/empty-states/settings-panel section headings all translated. Found a **broader variant** of `BUG-AGB-001`: this block's own settings panel shows **all 19** "Sichtbare Kartenfelder" checkboxes untranslated (not just the same 6 as the project/global board) — folded into `BUG-AGB-001` as a more-severe affected surface, same root defect.

Third pass this session: tested the full custom/saved board lifecycle (explicitly asked "did you test custom agile board" — it had only been spot-checked for a button label before).

- TC-AGB-114: Custom/saved board create → edit → delete flow. **PASS overall** — this is the best-localized feature tested on this plugin: the "Board-Konfiguration speichern"/"bearbeiten" form (visibility/role options, board-type, swimlane grouping, full ~44-option filter-field dropdown), all three flash messages ("Erfolgreich angelegt.", "Erfolgreich aktualisiert.", "Erfolgreich gelöscht."), the sidebar saved-boards list ("Board bearbeiten"/"Board löschen"), and the delete-confirmation modal (including the dynamically-interpolated board name) are all fully and correctly translated. Found only a narrow third variant of `BUG-AGB-001`: this form's own card-fields list leaves just "Last comment" and "Comments" untranslated (2 of ~19) — actually a *more complete* translation than the quick-panel variant, since it correctly translates several fields ("Spent hours", "Parent", "Children count", "Attachments count") that the quick panel does not. Folded into `BUG-AGB-001` as a third affected surface rather than filed separately.

Fourth pass this session: tested the Sprint create form and the admin plugin Configure page (explicitly asked "did you test backlog and agile board plugin configuration" — Backlog itself was already covered via TC-AGB-110/008, but the sprint-creation form and the plugin's admin config page had not been opened).

- TC-AGB-115: Sprint create form ("Neuer Sprint") — mostly PASS. Found `BUG-AGB-004` (3 of 6 field labels untranslated: "Description"/"End date"/"Sharing") and `BUG-AGB-005` (sprint date ranges + version due-dates render in hardcoded English month format — e.g. "Sep 08 - Sep 21, 2026" — instead of German format, proven against the same date correctly formatted as "30.09.2026" on the project's own Roadmap page). Also noted: no UI entry point for sprint edit/delete could be found anywhere in the Backlog view or project nav, despite the User Guide's KB research describing a "Sprint management screen — create/edit/delete sprints" — flagged as a functional-completeness gap for a future pass, not filed as a translation bug. Left one test sprint ("QA German Sprint", id 3) on the Forge instance as a result.
- TC-AGB-116: Admin plugin Configure page (Administration → Plugins → Redmineflux Agile Board, behind Redmine's password re-auth prompt) — mostly PASS. Both settings fields, both icon-customization section headings/descriptions, and even the conditionally-hidden Story Points value field's own label/help/validation-error text are all correctly translated. Found `BUG-AGB-006`: the "(Default: ...)" parenthetical next to every priority/tracker icon selector (8 rows total) is untranslated English.

Fifth pass this session: ran Stage 2 (resolution testing), explicitly asked ("did you tested in all both resolution").

- TC-AGB-117: 1280×720 and 1920×1080, Default theme. **PASS at both** — no resolution-specific layout defects. At 1280×720 the toolbar, Board-Einstellungen panel (an inline expanding panel, not a floating modal — scrolls naturally with the page, all sections and footer buttons reachable), Weitere Filter panel, and Backlog view all render cleanly with no overlap or clipping; columns beyond the 4th scroll horizontally as expected Kanban behavior. At 1920×1080 all 6 status columns fit without horizontal scroll.

Sixth pass this session: ran Stages 3/6 (Lotus theme retest, default + 1280×720), explicitly asked ("now test in theme").

- TC-AGB-118: Switched theme to Redmineflux lotus via Administration → Settings → Anzeige. Re-tested the project Agile Board, Board-Einstellungen panel, Weitere Filter panel, and Backlog view at both 1920×1080 and 1280×720. **PASS overall** — no new Agile-Board-owned translation or layout bugs from the theme itself or the Lotus+1280×720 combination (the card-fields grid reflows cleanly from 6 to 3 columns at the narrower width). Confirmed the project sidebar's "Aufgewendete Zeit" clips under Lotus (`BUG-LTS-001`, the theme's own bug — identical scrollWidth/clientWidth numbers, now confirmed on a third independent Forge server). Also discovered the project's Story Points feature has since become enabled (was off during the original Stage 1 pass) and its "Story Points" checkbox is untranslated in both the card-fields list and the Summen-anzeigen toggle group — folded into `BUG-AGB-001` as a 7th affected field (reproduces under Default theme too, so not Lotus-specific — just not visible until Story Points was turned on).

**All resolution/theme combinations for this plugin (Stage 2 + Stages 3/6) are now covered.** Only Stages 4/5 in the strict numbering (Lotus at the *other* resolution not yet spot-checked, i.e. Lotus+1920×1080 was covered as the "default" Lotus pass; Lotus+1280×720 covered in TC-AGB-118) — following the same practical collapsed pattern used for the Gantt plugin, no further resolution×theme combination remains outstanding.

Seventh pass this session: explicitly asked whether the Story Points field was tested on the core issue detail page and issue edit form, under both themes.

- TC-AGB-119: Confirmed the same "Story Points" translation gap (previously only seen inside the Board-Einstellungen panel) also appears as a field label on the issue detail page (`div.label` → "Story Points:") and the issue edit form (`<label>Story Points</label>`) — under **both** Lotus and Default theme, identically, proving it's theme-agnostic. Every sibling field label in both places is correctly German. Folded into `BUG-AGB-001` rather than filed separately, but this surface's far greater everyday visibility (every user viewing/editing any issue, vs. an admin settings panel) is why `BUG-AGB-001`'s severity was **raised from Low to Medium**.

Eighth pass this session: user directly spotted, from screenshots, visual defects I had not caught with DOM/translation-focused checks — different font style and a misaligned/missing bullet on the issue view page, and a different box size on the issue edit form, for the Sprint/Story Points fields specifically under Lotus theme ("did you noticed this in edit form size is different size of sprint and story point in lotus theme, also did you noticed the font style", then "also did you mention alignment issue?? sprint and story point in issue detail page").

- TC-AGB-120: Confirmed all three, via computed styles/layout. Issue detail page: (1) Sprint/Story Points labels use old default `div.label` markup (bold, 14px, dark gray) instead of Lotus's own `span.rf_attr_lbl` restyling that every core field gets (medium-weight, 13px, lighter gray) — Lotus specifically re-styles `Tags:` (also `div.label`) via an extra class, proving the gap is Sprint/Story Points simply being missed, not a structural limitation; (2) alignment — every core field is a bulleted list item indented ~12-16px past the row's left edge, but "Sprint:" has no bullet/indent at all, and "Story Points:" doesn't even share the left column, starting far to the right on the same crammed line as Sprint's value. Issue edit form: Sprint/Story Points rows span the full attributes-grid width (~1557px) instead of the half-width (~763px) their sibling fields occupy, breaking Lotus's two-column layout. All three confirmed absent under Default theme on the identical issue. Filed as `BUG-LTS-003` (Medium) against the Lotus theme plugin (root cause is the theme's incomplete grid/typography coverage, not an Agile Board defect), cross-referenced here.

Ninth pass this session (found during the Lotus theme's own "full core-Redmine sweep"): the project Settings ("Konfiguration") tab bar has its own "Sprints" sub-tab (`/projects/:id/settings/sprints`) — this is the sprint edit/delete entry point TC-AGB-115 had reported as unfindable; that note is now corrected (it's reachable via Settings, not the Backlog view). Found `BUG-AGB-007` (Low) there: the "Freigabe" (Sharing) column shows the raw untranslated enum value "not_shared" for pre-existing fixture sprints, while a sprint created via the UI form correctly shows "Nicht geteilt" — opening Edit on an affected sprint confirms the underlying value is identical (the Edit form's dropdown resolves it correctly), proving this is a list-view-only rendering gap, not a data issue. Confirmed theme-agnostic (reproduces under both Lotus and Default).

## In Progress

- Untested overall (not blocking, no bug covers them): column reordering, Scrum mode/sprint filtering, other grouping options, permissions/role-gating, My Page block's "load more".

## Blockers

- None.

## Next Session Start Point

- Both bugs are closed and production-synced. **`bugs/open/` is empty.** Next priority: a **full plugin-wide
  final-cycle regression** (SENIOR_QA_STANDARDS.md §27, every suite — not just #120436) is what's needed to
  move `STATUS.md` to `Complete`. This is a large scope (the core TC-AGB-104–018 suite plus the 208 largely
  unexecuted TCs across 7 suites authored 2026-09-15) — confirm scope/priority with the user before starting.
- #120436 moved back to **Done / 100%** on production (2026-09-21, per explicit user approval) now that its
  regression has passed following the BUG-AGB-010/BUG-AGB-011 fixes.
- Older note (translation cycle): plugin was marked `Complete` for translation coverage on 2026-09-10 — the
  untested surfaces below (column reordering, Scrum mode, grouping options, permissions) remain candidates for
  the full final-cycle regression above.
- Note: this plugin's own bug-code prefix is AGB per `CLAUDE.md` §4; internal plugin name confirmed as `agile_board`, display name "Redmineflux Agile Board", version 7.0.0.
- Note: "Story Points aktivieren" is a plugin-level feature toggle (Administration → Plugins → Redmineflux Agile Board), NOT a core-Redmine custom field — don't check `/custom_fields` to determine whether it's available; check the plugin's own configuration page instead.
- Note: the custom/saved board-config form (`board_configs/new`/`edit`) maintains its own separate `c[]`-keyed checkbox list, distinct from the quick-panel/My-Page-block `board[visible_card_fields][]` list — a translation fix to one does not automatically apply to the other; check both independently if this area is ever revisited.

## Open Bugs Found (this plugin)

- **None. `bugs/open/` is empty as of 2026-09-21** (second time — first was 2026-09-10 for the translation
  cycle). Both `BUG-AGB-010` and `BUG-AGB-011` retested FIXED and closed this session; see Closed Bugs below.

## Closed Bugs

- BUG-AGB-001 (was Medium, closed 2026-09-10) — card-field checkbox labels and the "Story Points"/"Story-Points" field name were partially untranslated across Board-Einstellungen, Global Board, My Page block, New Issue form, issue detail page, issue edit form, and the custom/saved board-config form. **Fixed** in stages across multiple sessions — the last remaining sub-finding (the board-config form's own "Tags" checkbox) confirmed fixed 2026-09-10.
- BUG-AGB-002 (Low) — Board Insights plural "Issues"/"Ticket" gap. **Fixed**, verified 2026-09-09 on a new Forge server — now shows "Tickets" correctly.
- BUG-AGB-003 (Low) — unassigned-avatar tooltip "Unassigned". **Fixed**, verified 2026-09-09 — now "Nicht zugewiesen".
- BUG-AGB-004 (Low) — Sprint create form untranslated labels. **Fixed**, verified 2026-09-09 — "Beschreibung"/"Enddatum"/"Freigabe" all correct.
- BUG-AGB-005 (Low) — Backlog dates in English format. **Fixed**, verified 2026-09-09 — now German DD.MM.YYYY format.
- BUG-AGB-006 (Low) — admin Configure page "(Default: ...)" untranslated. **Fixed**, verified 2026-09-09 — now "(Standard: ...)".
- BUG-AGB-007 (Low) — Sprints settings-tab "Freigabe" column showed raw "not_shared" for some sprints. **Fixed**, verified 2026-09-09 on a new Forge server — both previously-affected sprints ("UI Polish", "Bug Bash") now correctly show "Nicht geteilt".
- BUG-AGB-008 (Low) — drag-and-drop status-change toast entirely hardcoded English. **Fixed**, verified 2026-09-09 on a new Forge server — now reads "Ticket #259 verschoben nach RESOLVED", fully German.
- BUG-AGB-009 (Medium) — toggling Enable Story Points off/on silently wiped Story Point Values. **Fixed**, verified 2026-09-21 (commit `288d293`) — value survives the full off/on cycle.
- BUG-AGB-010 (Medium, production #120986) — `query_id` parameter FrozenError crash on the Backlog/Agile Board controller, not reachable via any UI link. **Fixed**, verified 2026-09-21 (commit `f3ba81b`) — now returns a clean 404 instead of a 500.
- BUG-AGB-011 (High, production #120990) — Backlog story-points badge went wrong (including negative) after dragging a card between sprint/version columns without reloading; within Feature #120436's own delivered code. **Fixed**, verified 2026-09-21 (commits `32141ba` + `50a8a76`) — badge now updates live and correctly on both sprint and version columns, and stays correct through a subsequent inline edit without reloading.

## Related Bug Found Against Another Plugin

- BUG-LTS-003 (Medium, filed against Redmineflux Lotus Theme) — this plugin's own "Sprint"/"Story Points" issue fields aren't integrated into the Lotus theme's attributes grid/typography: font mismatch AND broken bullet-list alignment on the issue detail page, full-width layout break on the issue edit form. Not counted in this plugin's own open-bug total since the root cause and fix live in the Lotus theme plugin.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) first pass on Agile Board: 8 TCs (TC-AGB-104–008) covering board header/filters, Board Settings, More Filters, Insights, inline edit, quick-add, and Backlog (Sprints + Versionen tabs). 3 bugs filed, all Low severity (`BUG-AGB-001/002/003`) — plugin overall shows strong i18n coverage. Large surface (Global board, My Page, drag-and-drop, Scrum mode, sprints, Story Points, permissions, Stage 2 resolutions, Stages 3–6 Lotus theme) still untested. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 second pass: Global Agile Board and My Page Agile Board block (TC-AGB-112/010). Both well-translated; no new bugs filed — `BUG-AGB-001` and `BUG-AGB-003` confirmed to reproduce on the Global Board, and a broader all-19-untranslated variant of `BUG-AGB-001` found on the My Page block's own settings panel, folded into the existing bug. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 third pass: full custom/saved board create→edit→delete lifecycle (TC-AGB-114), including the delete-confirmation modal and all flash messages. PASS overall — best-localized feature tested so far on this plugin. Only a narrow third variant of `BUG-AGB-001` found (2 of ~19 card fields untranslated on this form specifically), folded into the existing bug. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 fourth pass: Sprint create form and admin plugin Configure page (TC-AGB-115/013). 3 new bugs filed, all Low: `BUG-AGB-004` (3 of 6 sprint-form labels untranslated), `BUG-AGB-005` (sprint/version dates render in English month format instead of German), `BUG-AGB-006` (Configure page "(Default: ...)" untranslated in 8 rows). Noted a functional gap (no sprint edit/delete UI found) for a future non-translation pass. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-121 (found during the Lotus theme's own core-Redmine sweep): the project Settings → Sprints tab is the sprint edit/delete entry point earlier reported as unfindable — corrected. Found `BUG-AGB-007` (Low) — "Freigabe" column shows raw untranslated "not_shared" for some sprints, confirmed theme-agnostic. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 2 (resolution testing, Default theme): 1280×720 and 1920×1080 (TC-AGB-117). PASS at both — no resolution-specific layout defects found across the main board, Board-Einstellungen panel, Weitere Filter panel, and Backlog view. No new bugs filed. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stages 3/6 (Lotus theme retest, default + 1280×720) (TC-AGB-118). PASS overall, no new Agile-Board-owned bugs. `BUG-LTS-001` confirmed on a third server via this plugin's project sidebar; `BUG-AGB-001` expanded to 7 fields after discovering Story Points had become enabled. All resolution/theme testing for this plugin now complete. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-119: Story Points field on the core issue detail page + edit form, checked under both Lotus and Default theme. Same gap as `BUG-AGB-001` reproduces theme-agnostically on both pages — folded in, severity raised Low → Medium given the much higher everyday visibility of this surface vs. the original admin settings panel. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-120: user-spotted visual defects on Sprint/Story Points fields under Lotus theme — font-style mismatch AND broken bullet-list alignment on the issue view page, full-width layout break on the issue edit form. All confirmed via computed styles, absent under Default theme. Filed as new `BUG-LTS-003` (Medium) against the Lotus theme plugin. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49 — branch updated) | Claude (Playwright MCP) | **Fix verification pass, Standard theme, per explicit user instruction to retest bugs 1–6 only** (BUG-AGB-007 left untouched). BUG-AGB-002 (Insights plural), BUG-AGB-003 (unassigned tooltip), BUG-AGB-004 (Sprint create form), BUG-AGB-005 (Backlog date format), and BUG-AGB-006 (Configure page "Default"→"Standard") all confirmed **FIXED** and closed. BUG-AGB-001's Board-Settings checkbox-list gap (project board, Global board, My Page block) also confirmed **FIXED**; narrowed and kept open only for its Story Points-on-issue-page sub-finding, initially inconclusive since this fresh server had no Story Points custom field configured. Open bug count: 7 → 2 (BUG-AGB-001 narrowed, BUG-AGB-007 untouched). |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | User enabled the "Story Points" custom field from the plugin's own configuration specifically to close the gap above. Retested: **Story Points label still untranslated** on the Board-Einstellungen panel (both groups), the New Issue form, the issue detail page, and the issue edit form (test issue #267, deleted afterward) — confirmed reproducing, this sub-finding of `BUG-AGB-001` is genuinely still open. Story Points field left enabled per user request as a standing fixture. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | **User reported (screenshot) an untranslated drag-and-drop toast — not previously tested.** Reproduced via a real mouse-drag sequence (`page.mouse` primitives, since this board's cards aren't natively `draggable` and need a full mousedown→move→up sequence to trigger the library's drag handler): dragging card #106 between status columns produces "Issue #106 moved to Resolved"/"...to In Progress" — entirely hardcoded English, confirmed via live `MutationObserver` capture. Filed `BUG-AGB-008` (Low). Card restored to its original column afterward. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | Retest pass, new Forge server after branch update: **BUG-AGB-007 and BUG-AGB-008 both confirmed FIXED** and closed. **BUG-AGB-001's checkbox-list gap reconfirmed fixed** on all 3 surfaces (project/global/My Page block, block added fresh then removed again); its Story Points sub-finding could not be retested (no custom field on this server) — bug stays open, narrowed to just that. Open bug count: 3 → 1. `bugs/open/` not yet empty (BUG-AGB-001 remains), so the plugin-wide final-cycle regression is not yet triggered. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | **Follow-up same day: user enabled Story Points via the plugin's own Administration → Plugins configuration page (a plugin-level toggle, not a core custom field) to retest BUG-AGB-001's remaining sub-finding.** Created test issue #267 (Story-Points=3, deleted afterward). Confirmed FIXED: Summen-anzeigen toggle, New Issue form, issue detail page, issue edit form, and board summary bar all now read "Story-Points". Confirmed STILL REPRODUCING: the "Sichtbare Kartenfelder" list's own checkbox still reads plain "Story Points" — the only remaining untranslated string in the whole bug. Severity narrowed further, bug stays open. |
| 2026-09-10 | 7.0.1.stable | Forge (flux-fhhcov1xf49) | Claude (Playwright MCP) | Retest pass, new Forge server, project "Agile Board Project". Enabled Story Points (was off) via the plugin's own config page. **The "Sichtbare Kartenfelder" checkbox — the last remaining gap — is now FIXED**, confirmed on Board-Einstellungen (project + global), My Page block, New Issue form, issue detail page, and issue edit form (test issue #267, deleted afterward). While re-checking the custom/saved board-config form, confirmed its previously-known "Last comment"/"Comments" gaps are also fixed, but found a **new, previously-undocumented "Tags" checkbox** (`c[]=tags_relations`) still untranslated there — confirmed via `input.name`/`value`, no config saved. `BUG-AGB-001` narrowed to just this new finding, stays open. `bugs/open/` still has 1 bug; final-cycle regression not yet triggered. |
| 2026-09-10 | 7.0.1.stable | Forge (flux-f3lnytazd49) | Claude (Playwright MCP) | Third retest pass, new Forge server (theme defaulted to Scarlet — switched to Standard). **BUG-AGB-001's last remaining gap — the board-config form's "Tags" checkbox — confirmed FIXED** ("Markierungen"), closing the bug. `bugs/open/` now empty. **Final cycle regression — 18 TCs (TC-AGB-104–018) re-run, all PASS**, including the full custom-board create→edit→delete lifecycle (with flash messages), drag-and-drop (real mouse-drag, German toast confirmed), and 1280×720 resolution testing. `STATUS.md` set to `Complete`. |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/agile-board/ and 208 functional, negative and permission test cases written across 7 new suites (TC-AGB-148 onward): AGILE_INSTALLATION_MODULE_CONFIG, PROJECT_BOARD, BOARD_SETTINGS, SEARCH_FILTER_GROUPING, BACKLOG_AND_SPRINTS, GLOBAL_AND_MY_PAGE_BOARDS, CUSTOM_BOARDS_AND_STORY_POINTS, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-AGB-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
| 2026-09-18 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`66ae25f`) | Claude (Playwright MCP) | **Sanity pass on production Feature #120436** (Agile Board Story Points in the Backlog), per production testcase #120941 in run #577, environment Window 11 + Chrome. Wrote TC-AGB-029 to TC-AGB-053 into `AGILE_BACKLOG_AND_SPRINTS.md` first, then executed the 6-case sanity subset: **TC-AGB-029, 530, 533, 535, 539, 545 - all PASS, 0 defects in the feature itself.** One separate defect found en route and filed as **`BUG-AGB-009`** (Medium, open): toggling Enable Story Points off and on again silently wipes the configured Story Point Values, after which the issue form falls back to the built-in default list. It is in the pre-existing Story Points configuration handling, not in the #120436 Backlog code. All four requirements of #120436 verified: sprint points in the Backlog, `closed / total SP` badge, completed stories staying visible and counting as closed points, and the widened unassigned column (284 -> 444px, both tabs, drag still working). Incidentally confirmed TC-AGB-032/534/538/544 as well. Fixtures built on "test project": Agile Board module enabled, sprint "SP Sanity Sprint 120436", issues #1530/#1529/#1528/#1527/#1526. Remaining 19 TCs (regression scope) not yet executed. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`288d293`) | Claude (Playwright MCP) | **Retested BUG-AGB-009 - FIXED, confirmed and closed.** Fix commit `288d293` ("Keep the story point scale when the feature is toggled off") renders the Story Point Values field always, hiding it with CSS instead of removing it, so a save while the feature is off no longer wipes the stored value. Followed the bug's exact repro steps: configured `1, 2, 3`, toggled Enable Story Points off then on, saved each time - the scale survived intact on both the Configure page and the issue form's dropdown (`--, 1, 2, 3`, no fallback to the built-in default). No regression in Feature #120436's Backlog badge (`5 / 21 SP` unchanged). One non-reproducible 500 on the first Apply attempt noted but not blocking (write succeeded underneath it; a clean repeat had no error; server logs in this environment weren't capturing recent output to investigate further). Moved `bugs/open/BUG-AGB-009.md` -> `bugs/closed/`, and updated production #120947: In QA -> Done, 100% (approved by user). `bugs/open/` is now empty for this plugin - **a full final-cycle regression (SENIOR_QA_STANDARDS.md s27) is required before STATUS.md can move to Complete**, and the Feature #120436 regression pass (19 remaining TCs) is separately still outstanding. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`288d293`) | Claude (Playwright MCP) | **Regression pass on Feature #120436** - executed the remaining TC-AGB-031 to TC-AGB-053 (19 TCs). **23 PASS**, confirming all four #120436 requirements hold under a full sweep: version/unassigned badges, empty-column no-badge, totals-before-load, filter/saved-query/toggle precedence for the completed-issues setting, load-more consistency, width breakpoint, cross-project scope, issue-visibility scoping, non-admin 403, German translation, and a bare-project sanity check. Fractional story points confirmed integer-only by design (TC-AGB-049), not a gap. **1 new bug found and filed: `BUG-AGB-010`** (Medium, downgraded from an initial High) - a `query_id` parameter on the Agile Board/Backlog controller crashes with a 500 FrozenError in the pre-existing `retrieve_rf_agile_query` method, unrelated to #120436's own code. Checked every view in the plugin afterward and found **no button or link anywhere generates a `query_id`-carrying URL for the Backlog or Agile Board pages** - the crash requires manually editing the URL, which is why severity was revised down from the initial filing. TC-AGB-041 itself was re-examined per the user's own call and marked **N/A rather than blocked** - "open the Backlog through a saved query" isn't a feature the product built (no button or link anywhere generates such a URL), so there's nothing to test, not a gap. BUG-AGB-010 is an independent side-finding surfaced while checking that TC's premise, not something blocking it. **TC-AGB-037 corrected from "blocked" to PASS** after the user pointed out the Board Settings panel's own "Apply Settings" button (distinct from the adjacent filter panel's "Apply", which was clicked by mistake the first time) does persist `visible_card_fields`; re-ran the full 3-step live badge create/update/remove sequence cleanly on a fresh sprint, matching a real reload throughout. **1 TC left inconclusive**, not filed as a bug: TC-AGB-048 (the plugin's REST API required an API key that still 403'd before the plugin's own auth filter ran; root cause not isolated in the time available). Full detail and per-TC evidence in `AGILE_BACKLOG_AND_SPRINTS.md` under "Regression execution - Feature #120436 - 2026-09-21". |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`288d293`) | Claude (Playwright MCP) | **Feature #120436 closed on production.** Per user request, updated production #120436: In QA -> Done, 90% -> 100%, with a full QA sign-off comment (requirement-by-requirement results, sanity+regression coverage, both bugs found this cycle). Final tally: sanity (6/6 PASS) + regression (23/25 PASS, 1 N/A - TC-AGB-041 feature not built, 1 inconclusive - TC-AGB-048 API auth). All four requirements verified PASS, zero defects in the feature's own code. Noted in the sign-off that the ticket's own Business Context (purchase-conditional for client Innoval) means a sales/account-owner confirmation may still be needed before communicating delivery - that step is outside QA's scope and was not assumed complete. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`288d293`) | Claude (Playwright MCP) | **BUG-AGB-011 found and filed (High) - correction to the sign-off above.** Minutes after Feature #120436 was marked Done on production, the user live-tested the Backlog and reported a screenshot showing a nonsensical negative story-points total (`13 / -74 SP`) after dragging cards between sprint/version columns; separately confirmed "after refresh it show correct value." Reproduced independently (drag a 2-pt card in - badge stays stale at the pre-drag total; then edit another card's points - the edit's delta applies on top of the stale badge, compounding the error) and root-caused to `backlog.html.erb`'s sortable `update` handler only maintaining the card count (`updateSingleColumnCount`), never the `.backlog-column-story-points` badge - confirmed via grep, no live-update call site for the badge exists anywhere in the drag/drop path. Purely a client-side display bug: no stored `story_points` data is corrupted, a reload always shows the true value. Squarely inside #120436's own delivered code (the badge display it introduced), unlike the pre-existing/unrelated BUG-AGB-010. Not caught during the regression pass because TC-AGB-045 (drag) and TC-AGB-037 (inline edit) were each tested as isolated, reload-separated scenarios rather than back-to-back in one page load - the actual real-world planning workflow. Corrected `AGILE_BACKLOG_AND_SPRINTS.md`'s regression Result line accordingly and updated `STATUS.md` (open bugs 1 -> 2). **Not yet reported to production; no action taken on #120436's Done status** - both await the user's explicit direction. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0, branch `feature/backlog-sprint-points` (`288d293`) | Claude (Playwright MCP + redmineflux MCP) | **BUG-AGB-011 reported to production; #120436 reopened - per explicit user approval** ("Report BUG-AGB-011 + reopen #120436", assignee "Prashant Chaurasia" confirmed via AskUserQuestion). Created production issue **#120990** on ztflux (Priority High, Defect Severity "High-severity", Defect priority "High", category "Agile board plugin", assigned to Prashant Chaurasia/user id 410) with the full root-cause writeup in Textile. Updated production **#120436**: Done/100% -> In QA/90%, with a comment cross-referencing #120990 and explaining the client-side-only nature of the defect; will return to Done once #120990 is fixed and retested. Local `bugs/open/BUG-AGB-011.md` updated with the production issue ID header and a new "Production report" section; `bugs/_index.md`, `STATUS.md`, this handoff file, and `docs/AGILE_MEMORY.md` all updated to match. Follow-up same session: corrected #120990's tracker (had defaulted to "Task" since `create_issue` was called without `tracker_id`) to "Bug" - this reset the Defect Severity/priority custom fields to their tracker defaults, re-set them back to High/High-severity immediately after, confirmed via `get_issue`. Then, per user request, linked #120990 to production **testcase #120941 in run #577** (the sanity testcase this feature was originally tested under) via `report_defect` with `defect_issue_id=120990` - run #577's result for #120941 is now **Failed** with the defect attached, while the local per-TC sanity verdicts stay PASS (isolated-execution scope, not touched) - noted in `AGILE_BACKLOG_AND_SPRINTS.md`. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0 -> **7.1.0**, branch `master` (merged from `feature/backlog-sprint-points`, commit `50a8a76`) | Claude (Playwright MCP + redmineflux MCP) | **Production #120436 moved back In QA/90% -> Done/100%**, per explicit user approval, now that BUG-AGB-010/BUG-AGB-011 are fixed and the Feature #120436 suite regression has passed. |
| 2026-09-21 | 7.0.0 (local Docker `redmine-docker-700`, http://localhost:3010) | Local Docker - Agile Board plugin 7.0.0 -> **7.1.0**, branch `master` (merged from `feature/backlog-sprint-points`, commit `50a8a76`) | Claude (Playwright MCP + redmineflux MCP) | **Both BUG-AGB-010 and BUG-AGB-011 retested FIXED, closed, production synced, Feature #120436 suite regressed - per explicit user approval throughout.** Developer merged the feature branch to master and released 7.1.0 with fix commits `f3ba81b` (query_id crash), `32141ba` and `50a8a76` (drag-badge desync, generalized to every board). Restarted container + Redis/Sidekiq (no plugin migrations needed). Retested both bugs against their exact original repro steps - both confirmed fixed with fresh evidence, moved to `bugs/closed/`. Production #120986 and #120990 updated In QA -> Done/100%; production testcase #120941/run #577 updated back to Passed (result ID 14287). Regressed the Feature #120436 suite (TC-AGB-029-553) per the user's explicit scope choice (not the full plugin): drag/badge-update TCs (530-532, 536, 537, 539) directly retested with fresh evidence including an extension to version columns not covered by the original bug repro; setting-toggle TCs (538/539/542) spot-reconfirmed; TCs on code paths neither fix touched left as previously-passing with rationale recorded in the testcase file's "Post-fix regression" section. `bugs/open/` is now empty; `STATUS.md` stays `In Progress` pending a full plugin-wide final-cycle regression (SENIOR_QA_STANDARDS.md s27, every suite) before `Complete`. |
