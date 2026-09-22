# Handoff — Redmineflux Checklist Plugin

## Last Session

- Date: 2026-09-22
- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker — `redmine-docker-700-redmine-1`, `http://localhost:3010`

## Completed This Session (2026-09-22) — BUG-CHK-005 filed, closed-project checklist writes not blocked

Not a planned test pass — the user reported a console 403 on "Add from template" for a closed project and
suspected the whole checklist section should be disabled on a closed project. Investigated live on project
`checklist-perm-private` (closed) / issue #1533:

- Confirmed with real network evidence: `POST /checklists` (create) → **201**, `PATCH
  /checklists/:id/toggle_completed` (toggle) → **200**, `DELETE /checklists_delete/:id.json` (delete) → **200** —
  all succeed on a project marked "closed and read-only." Only `GET /checklists/new_from_template` is blocked
  (403), and even that gives no user-facing feedback, just a console-only error.
- This project's own Checklist History already had many successful writes from *prior* sessions after the
  project was closed, confirming this isn't a one-off — it's been consistently broken.
- Filed **`BUG-CHK-005`** (High) — the plugin should follow Redmine core's own approach and block all
  checklist-mutating actions consistently on a closed project, not just one. See `CHECKLIST_MEMORY.md` for the
  full endpoint-by-endpoint breakdown.

## Completed Previous Session (2026-09-21)

Sanity-tested production feature #120920 "Display checklists in expanded state by default" (Checklist Plugin
category, In QA at session start) against Bug #1530 in `test project` — **6/6 new TCs PASS**, no bugs found:

- TC-CHK-223 — expanded by default on a genuine fresh page load, DOM-verified (`display: block`), re-confirmed
  after a full container rebuild + asset precompile, and again under a non-admin Member role.
- TC-CHK-224 — every checklist on an issue expands by default, not just the first. Noted (not a bug) a harmless
  DOM-only quirk in the AJAX "New checklist" creation path — see `CHECKLIST_MEMORY.md`.
- TC-CHK-225 — collapse/expand toggle regression-clean against TC-CHK-212.
- TC-CHK-226 — a manually collapsed checklist survives a real reload, clears correctly on re-expand (no stuck
  state across two reload cycles).
- TC-CHK-227 — collapsed state survives an AJAX re-render triggered by mutating a *different* checklist.
- TC-CHK-228 — collapse memory is per-browser (`localStorage`), not per-account: confirmed by switching from
  Admin to a newly-created seed user (`luna.blossom`) in the same browser tab; no checklist data leaked between
  accounts, only the cosmetic view state.

Full evidence for all six is inline in `testcases/CHECKLIST_CHECKLIST_MANAGEMENT.md`.

**Regression pass required and run** (per `SENIOR_QA_STANDARDS.md` §26 — #120920 touched shared rendering/JS files)
against the rest of `CHECKLIST_CHECKLIST_MANAGEMENT.md`, TC-CHK-201–222 — **21 PASS, 1 N/A, 1 FAIL**:

- **BUG-CHK-002 (Critical, new) — a `<script>` tag in a checklist/sub-item title executes on creation.** Confirmed
  client-side-only (self-XSS on the creating user's own AJAX success handler; a normal reload renders it safely
  escaped, so not a stored XSS for other viewers). Root-caused to `checklist.js`'s two creation success handlers
  building raw HTML with unescaped interpolated title text — contrast with the *edit* handlers in the same file,
  which correctly use `.innerText`. **Not caused by #120920** (that diff didn't touch `checklist.js`'s creation
  paths at all) — pre-existing, just newly discovered by this regression pass. Filed locally; **not yet reported
  to production**, pending user direction.
- TC-CHK-222 is N/A on this instance — the Checklist plugin has no per-project module toggle to test against.
- Two pre-existing, non-blocking usability notes recorded in the suite file (not filed as bugs): the sub-item
  "Add" form closes after each item instead of staying open for consecutive adds (TC-CHK-204), and the
  whole-checklist delete confirmation doesn't explicitly warn that child items go too (TC-CHK-210).
- One self-correction worth flagging: my first pass at TC-CHK-218 (duplicate titles) read a false negative from
  checking the DOM before the AJAX call had completed — re-tested properly and it's a clean PASS. Documented in
  the suite file so a future session doesn't re-chase it.

Also, unrelated to this plugin but found live during this session: filed `BUG-TMS-001` (Timesheet plugin, not
Checklist) — bulk-deleting a user with a timesheet submission crashes with an unhandled 500. Reported to
production as issue #121040, assigned to Sheetal Sharma. See `plugins/redmineflux_timesheet_qa/`.

**Later in the same session**, executed the three remaining test suites that were previously "authored but not
executed" (per user instruction to complete all functional suites except German):

- **`CHECKLIST_TEMPLATES.md` — 23/23 TCs PASS, no bugs.** Full template CRUD, tracker rebinding, apply-to-issue
  (ordered/nested/additive/journaled), duplicate re-apply is a clean explicit refusal (not a silent no-op as
  first suspected), a 100-entry template applies without timeout, script-tag injection is safely escaped
  everywhere (a different, safe code path from `BUG-CHK-002`), non-admin blocked by direct URL on all
  template-management endpoints.
- **`CHECKLIST_PROGRESS_TRACKING.md` — 13/14 PASS, 1 FAIL.** Filed **BUG-CHK-004** (Medium) — toggling a
  sub-checklist item's checkbox fires two separate AJAX writes to two different endpoints for the same state
  change on every single click (not just rapid ones), duplicating Checklist History journal entries;
  root-caused to `checklist_checkbox-*.js`. A second bug hypothesis (`BUG-CHK-003`, about an empty checklist
  zeroing a manual % Done) was filed and then **retracted** after the user corrected the interpretation — that's
  the auto-calculate feature's own intended mechanism, not a defect.
- **`CHECKLIST_BLOCK_ISSUE_CLOSING.md` — 13/14 executed all PASS, 1 not executed.** Block holds across the full
  edit form, bulk edit, and the Inline Editor plugin's quick-edit (message-wrapper cosmetic issue belongs to
  that other plugin, `BUG-INE-002`). TC-CHK-511 clarified that a parent issue with an open subtask is gated by
  an unrelated, stricter Redmine core/workflow rule before this plugin's own feature ever gets a chance to act.
  TC-CHK-510 (REST API bypass) **not executed** — reading a real API key was blocked by this session's own
  credential-materialization safeguard, and an unauthenticated `.json` PUT triggers a disruptive native browser
  Basic-Auth popup.

Full evidence for every TC in all three suites is inline in the respective testcase files, with a Summary
section at the bottom of each.

## In Progress

- User follow-up (2026-09-07) closed 3 gaps flagged after the first pass:
  - Sub-checklist item creation — **now tested** (TC-CHK-004, PASS) — this is also where the per-item Status dropdown ("Neu"/"In Bearbeitung"/"Erledigt") turned out to live (it's on sub-items, not top-level items, which is why it wasn't seen before).
  - "Block issue closing" functional enforcement + error message — **now tested** (TC-CHK-005, PASS for this plugin). Enabled the setting, confirmed the block works and its error message is fully translated via the full Edit form. The inline quick-edit path surfaces the same message wrapped in an untranslated English "Could not save:" prefix — that defect belongs to the Inline Editor plugin (`BUG-INE-002`), not this one.
  - Checklist Template Delete popup — already covered in the first pass (TC-CHK-002).
  - Checklist Template **Edit** form — **now opened and inspected** (was previously only the link's existence). Fully translated: "Checklisten-Vorlage bearbeiten" heading, "Vorgangstyp*", "Vorlagenname*", "Checklisten-Titel*", "Weitere Unter-Checkliste hinzufügen", "Checkliste hinzufügen", "Vorlage aktualisieren", "Abbrechen" — PASS, no bugs.
- Expand/collapse checklist (up-arrow icon per KB) — **now exercised, 2026-09-21** (TC-CHK-212 toggle PASS, plus
  the full TC-CHK-223–228 default-expanded sweep above).
- "Auto-calculate % done from checklist" toggle — **now fully exercised, 2026-09-21** (functional behavior, not
  just label translation) — see `CHECKLIST_PROGRESS_TRACKING.md` TC-CHK-305/306/312.
- Stage 2 (resolutions) **complete** — tested at 1280×720 and 1920×1080, both PASS, no layout defects found (issue-detail widget, admin template list, delete confirmation modal all checked).
- Stages 3–6 (Lotus theme) **complete** — issue-detail widget, cross-plugin overlap check, and admin template list + Delete modal all retested under Lotus, all PASS. Resolution retest under Lotus (1280×720/1920×1080) found no Checklist-specific issues (the tab-strip clipping found at 1280×720 was filed against the Lotus theme itself, `BUG-LTS-002`, not this plugin).
- **BUG-CHK-001 closed 2026-09-07** per explicit user direction: the user had already independently reported this same untranslated-journal-message finding themselves before this session surfaced it. Re-confirmed live on a second issue before closing, so the underlying observation stands (documented in `CHECKLIST_FEATURES_LIST.md` and the testcase file) — it's simply not tracked as an open item in this repo to avoid double-tracking.
- "Auto-calculate % done" toggle's functional behavior — now fully exercised, see above (2026-09-21).

## Blockers

- None.

## Next Session Start Point

- All functional test suites for this plugin are now executed except German (`CHECKLIST_GERMAN_LANGUAGE.md`,
  explicitly excluded per user instruction this session).
- **TC-CHK-510** (`CHECKLIST_BLOCK_ISSUE_CLOSING.md`, REST API bypass check) still needs to be run — requires a
  real API key supplied out-of-band by the user (browser-automation credential reads are blocked by this
  session's own safeguard, and an unauthenticated request triggers a disruptive native Basic-Auth popup).
- Three open bugs need fixes before this plugin can move to `Complete` in `STATUS.md` (see CLAUDE.md §10): once
  fixed, retest per `SENIOR_QA_STANDARDS.md` §26, and when `bugs/open/` is empty run the full final-cycle
  regression per §27. **When retesting BUG-CHK-005, check every checklist-mutating endpoint** (create checklist,
  create item, toggle, delete, update_state), not just "Add from template" — the fix needs applying uniformly.
- **Update:** the earlier "do not touch production" instruction was superseded later in the same session — the
  user explicitly asked for all 3 open bugs to be reported (assigned to Vaishnavi Bhawsar), done, see below.
  Standing rule still applies for *future* sessions: no production write without fresh, explicit approval each
  time.

## Open Bugs Found

- **BUG-CHK-002 (Critical)** — checklist/sub-item title `<script>` tag self-XSS on creation. Reported to
  production as **#121059**, assigned to Vaishnavi Bhawsar. `plugins/redmineflux_checklist_qa/bugs/open/BUG-CHK-002.md`.
- **BUG-CHK-004 (Medium)** — toggling a sub-checklist item's checkbox writes duplicate Checklist History journal
  entries (cascading double-AJAX-write on every click). Reported to production as **#121060**, assigned to
  Vaishnavi Bhawsar. `plugins/redmineflux_checklist_qa/bugs/open/BUG-CHK-004.md`.
- **BUG-CHK-005 (High)** — checklist create/toggle/delete are not blocked on a closed/read-only project; only
  "Add from template" is, with no user-facing feedback. Reported to production as **#121061**, assigned to
  Vaishnavi Bhawsar. `plugins/redmineflux_checklist_qa/bugs/open/BUG-CHK-005.md`.
- (BUG-CHK-001 closed — already reported by the user independently, unrelated.) `BUG-TMS-001` was found this
  session but belongs to the Timesheet plugin, not Checklist — tracked in
  `plugins/redmineflux_timesheet_qa/bugs/`, not here.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-fczk00paf49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) full sweep, 8 TCs (TC-CHK-001–008), 7 PASS / 1 FAIL, 1 bug found (BUG-CHK-001). Includes full admin template CRUD (create/edit/delete), cross-plugin overlap check against an Agile-Board project (clean), sub-item creation with Status dropdown, functional "block issue closing" enforcement with its translated error message, and Stage 2 resolution testing at 1280×720 + 1920×1080 (both clean, no layout defects). |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ and 108 functional, negative and permission test cases written across 5 new suites (TC-CHK-101 onward): CHECKLIST_INSTALLATION_CONFIGURATION, CHECKLIST_MANAGEMENT, PROGRESS_TRACKING, TEMPLATES, BLOCK_ISSUE_CLOSING, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-CHK-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
| 2026-09-21 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Sanity-tested production feature #120920 (expand-by-default). 6 new TCs authored and executed (TC-CHK-223–228), all PASS, no bugs. Covered fresh-load default, multi-checklist, toggle regression, reload persistence, AJAX re-render survival, and per-browser (not per-account) scoping — the last confirmed by switching Redmine accounts in the same browser after importing this instance's missing `QA_CREDENTIALS.md` seed-user pool (19 of 20 users; `aurora.wren` skipped, already a real identity here). **Full regression pass on `CHECKLIST_CHECKLIST_MANAGEMENT.md` (TC-CHK-201–222, first-ever execution, triggered by #120920 touching shared rendering/JS files per SENIOR_QA_STANDARDS.md §26): 21 PASS, 1 N/A, 1 FAIL.** Filed `BUG-CHK-002` (Critical, not caused by #120920) — a `<script>` tag in a checklist/sub-item title self-executes on creation via an unescaped client-side AJAX render, confined to the creating user's own session (not stored-XSS for other viewers). Also found and reported an unrelated Timesheet-plugin bug (`BUG-TMS-001` / production #121040) while investigating a live 500 error report. **Same-day, later pass: executed all three remaining previously-authored suites** — `CHECKLIST_TEMPLATES.md` (23/23 PASS, no bugs), `CHECKLIST_PROGRESS_TRACKING.md` (13/14 PASS, 1 FAIL → filed `BUG-CHK-004` Medium, a cascading double-AJAX-write causing duplicate Checklist History journal entries on every checkbox click), `CHECKLIST_BLOCK_ISSUE_CLOSING.md` (13/14 executed all PASS, TC-CHK-510 REST-API-bypass not executed — blocked by a credential-materialization safeguard). Every functional suite except German is now complete. |
| 2026-09-22 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Ad-hoc investigation, not a planned pass — user reported a console 403 on "Add from template" for a closed project and suspected checklist writes should be fully disabled there. Confirmed with live network evidence on project `checklist-perm-private` (closed): checklist create (`POST /checklists` → 201), toggle (`PATCH .../toggle_completed` → 200), and delete (`DELETE .../checklists_delete/:id.json` → 200) all succeed on a closed/read-only project; only "Add from template" is blocked (403), with no user-facing feedback even then. Filed `BUG-CHK-005` (High) — the plugin should follow Redmine core's own consistent closed-project read-only enforcement. **Same day, user explicitly approved reporting all 3 open bugs to production**: `BUG-CHK-002` → #121059, `BUG-CHK-004` → #121060, `BUG-CHK-005` → #121061, all assigned to Vaishnavi Bhawsar. **Then linked all 3 as defects on testcase #121037** ("Sanity: Checklists display expanded by default (#120920)") in Run #577, environment "Window 11 + Chrome" — took 3 attempts to get right (see `feedback_defect_ids_needs_issue_relation_too.md` in memory for full detail): (1) `create_status_result` with `defect_ids` saved the data internally but created no visible relation — user reported "bugs are not related"; (2) manual `create_issue_relation(relation_type="relates")` made the relation visible on the issue but still didn't show in the run's testcase-matrix `defects:[...]` badge — user reported it again ("you failed this testcase but bugs are not related"); (3) **the actual fix**: `redmineflux_testcases_management_report_defect` with `defect_issue_id` per existing bug, which creates the relation with the correct type `defect` (not `relates`) — had to first delete the 3 wrong-typed `relates` relations (Redmine only allows one relation per issue pair). Confirmed correct via both `get_run_testcases` (now shows `#121037 [Failed] ... | defects:[121059, 121060, 121061]`, matching the working `#120941 | defects:[120990]` example) and `get_issue(121037, include=relations)` (now shows `defect → #121059/060/061`). Run #577's other 45 testcases were untouched throughout — only `create_status_result`/`report_defect`/`create_issue_relation`/`delete_issue_relation` were used, never `update_run` (the tool that caused this same run's prior data-loss incident). |
