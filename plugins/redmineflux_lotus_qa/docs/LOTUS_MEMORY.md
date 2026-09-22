# Plugin Memory — Redmineflux Lotus Theme

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The admin sidebar is icon-only by default; a "Seitenleiste umschalten" (toggle sidebar) button expands it into a labeled view. When labels are long, the expanded view wraps them across two lines (`white-space: normal`) rather than clipping — this is the fixed behavior as of 2026-09-09 (previously `white-space: nowrap` + ellipsis, see closed `BUG-LTS-001`).
- The issue-detail right-column tab strip ("Historie"/"Notizen"/"Eigenschaftsänderungen"/"Checklisten-Verlauf") is a **working paginated tab strip**, not a broken fixed-width container: at rest it shows a "peek" of the next tab (partially cut off, by design), and the "<"/">" controls page through it, hiding earlier tabs (`display:none`) and rendering the next one in full. Previously mischaracterized as clipping/broken in `BUG-LTS-002` — **invalidated 2026-09-10** after clicking through it confirmed every tab is fully reachable. The exact number of tabs shown (3 vs 4) varies by server/Redmine build, which just changes how much "peek" is visible at rest.
- Sprint's value (`.attribute.sprint .rf-show-display`) previously rendered in an anomalously narrow, wrapping span under Lotus at 1280×720 — **fixed as of 2026-09-10**, now renders single-line at full width (~58.6px) regardless of resolution.
- The Tags "Hinzufügen" editor widget's overlap with Sprint/Story-Points, previously reproducing against the Story-Points label (2026-09-10), is **fixed as of 2026-09-18** (server `flux-fccirp6sk49`) — confirmed via bounding-box check, no intersection.
- The issue-edit-form full-width break (Sprint/Story-Points `<select>` spanning the full grid width instead of the half-width column their siblings use) — previously fixed on server `flux-f3lnytazd49` (2026-09-10) — **reappeared on server `flux-fccirp6sk49` (2026-09-18)**, still reproducing when `BUG-LTS-003` was closed. Accepted as a minor/cosmetic gap by explicit user judgment (no overlap, fields just render wider than siblings) rather than left open — **if retested in a future session, expect it may still reproduce or may have flipped fixed again; this was a deliberate accept-as-minor decision, not a confirmed fix.** See closed `BUG-LTS-003`.

## Confirmed Working

- Sprint/Story-Points font and bullet alignment, and the Sprint/Story-Points value overlap — confirmed fixed at both 1920×1080 and 1280×720, holding across multiple servers/retests (`BUG-LTS-003`, closed).
- The Tags-widget "Hinzufügen" editor no longer overlaps Sprint/Story-Points — confirmed fixed 2026-09-18 on server `flux-fccirp6sk49` (`BUG-LTS-003`, closed).
- **Not durably confirmed, accepted as minor by user judgment:** the issue-edit-form half-width layout for Sprint/Story-Points has flipped fixed→reproducing→fixed→reproducing across different servers within this same bug's history, and was still reproducing when `BUG-LTS-003` was closed. Do not treat it as "confirmed working" if it comes up again in a future session.
- Inline Description-CKEditor Save/Cancel buttons render at matching 34px height — confirmed fixed 2026-09-09 (`BUG-LTS-004`, closed).
- The Lotus plugin's own Configure page (`/settings/plugin/redmineflux_lotus`) loads correctly with Tracker-Rahmenfarben/Prioritätssymbole/Logo tabs — confirmed fixed 2026-09-09 (`BUG-LTS-005`, closed).
- The subtask/related-tickets table on the issue detail page now scrolls within its own contained wrapper (`div.rf_issue_section_row`, `overflow-x: auto`) at 1280×720, instead of spilling into the Historie/Notizen sidebar — confirmed fixed 2026-09-10 (`BUG-LTS-006`, closed).

- **The Lotus plugin overrides Redmine's `projects/show.html.erb` view unconditionally, regardless of the
  Administration → Settings → Display → Theme selection.** `Setting.ui_theme` being "Default" (not
  `redmineflux_lotus`) does NOT stop this plugin's own view file from participating in Rails' view lookup and
  winning over core's version for the Project Overview page specifically — only the *branch inside* the file
  changes (there's a top-level `<% unless Setting.ui_theme == 'redmineflux_lotus' %> ... <% else %> ... <% end %>`
  split at lines 1/161 of `show.html.erb`, a "fallback" render vs. a "Lotus-active" render, but either branch
  still comes from this plugin's file, not core's). Confirmed 2026-09-22 (`BUG-LTS-007`) — the duplicate
  closed-project warning reproduces on Overview even with the Default theme selected. Don't assume switching the
  Theme setting away from Lotus removes this plugin's view influence on pages it overrides.

## Recurring Issues

- **Both branches of `show.html.erb`'s top-level `Setting.ui_theme` split independently reimplement the
  closed-project warning** (`<% unless @project.active? %> <p class="warning">...` at line 27 in the fallback
  branch, line 195 in the Lotus-active branch) — duplicating the same warning Redmine core already renders once,
  globally, via the base layout (visible on every project page, e.g. Issues, Wiki, Activity — confirmed only 1
  copy there). The result: exactly 2 copies of the warning on Overview specifically, 1 everywhere else. Filed as
  `BUG-LTS-007` (Medium), open. If re-verifying, check both `Setting.ui_theme` values (blank/Default and
  `redmineflux_lotus`) since the bug is present in both branches — fixing only one branch would leave the other
  still broken.

- `BUG-LTS-003`'s sub-findings are **environment/server-dependent, not resolution-dependent alone** — across retests on different Forge servers, which sub-finding reproduces has kept shifting (Tags-widget overlap: Sprint value → Story-Points label → fixed; edit-form full-width break: fixed → reappeared). Never assume a prior retest's "fixed" verdict carries over to a new server — re-verify all 4 original sub-findings (font/bullet, value overlap, Tags-widget overlap, edit-form full-width) independently every time, with numeric bounding-box checks, not just a visual glance.

- **Before filing a "clipped/cut off" finding on any tab strip, carousel, or narrow scrollable container, check for scroll/page controls (arrows, dots) first, and click through them** — a partially-visible "peek" of adjacent content plus a working next/prev control is a deliberate, common affordance, not a defect. Comparing `scrollWidth` vs `clientWidth` alone (as originally done for `BUG-LTS-002`) cannot distinguish this from a genuine broken layout — you have to actually interact with the control.

## Environment Notes

- `browser_resize` alone can leave the SPA in a stale render state — always do a fresh `browser_navigate` reload after resizing before trusting any DOM/computed-style check (confirmed this caused a false-positive "hidden panel" reading on the tab-strip container during this cycle's testing).
- **When checking for element overlap, compare the actual rendered text/value elements (e.g. `.rf-show-display` spans, editor input/button boxes), not just the outer flex/grid container rects.** Outer containers can be correctly non-overlapping while an inner value span still wraps and spills into a neighboring field's space — this exact mistake caused `BUG-LTS-003` to be marked fixed and closed, then have to be reopened same-day after the user caught it from screenshots.
- One Forge server (`flux-fdrk6suoj49`) started returning HTTP 403 "Forbidden" on every route (including `/login`) mid-session on 2026-09-09 — a genuine infrastructure/WAF-level block, not a Redmine/session issue. Retest work moved to a replacement server (`flux-fhggkobjh49`) provided by the user.
- **A screenshot can look "fine" at a glance and still mask a real regression.** During the 2026-09-18 `BUG-LTS-003` retest, a first screenshot of the edit form's upper portion looked like it matched sibling half-width fields — only a numeric bounding-box width comparison against true siblings (Priorität, Zielversion) revealed the Sprint/Story-Points selects were still full-width. Always run the numeric sibling-width/position comparison before trusting a visual read, especially when re-verifying a bug with a documented history of flipping fixed/unfixed across servers.
