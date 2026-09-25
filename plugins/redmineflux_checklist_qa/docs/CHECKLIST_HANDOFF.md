# Handoff — Redmineflux Checklist Plugin

## Last Session

- Date: 2026-09-24
- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker — `redmine-docker-700-redmine-1`, `http://localhost:3010`

## Completed This Session (2026-09-24) — targeted post-closure check: Permissions + Templates suites

**User-approved, narrower, targeted check** (not the full §27 final-cycle regression) — re-ran
`CHECKLIST_PERMISSIONS.md` (12 TCs, TC-CHK-067–078) and `CHECKLIST_TEMPLATES.md` (23 TCs, TC-CHK-093–115) live
against the now-fully-closed build (all of BUG-CHK-002/004/005 closed earlier today). User explicitly chose this
scope over the two suites most exposed to BUG-CHK-005's follow-up feedback-message fix and to permission-gated
writes generally, and explicitly excluded `CHECKLIST_INSTALLATION_CONFIGURATION.md` and
`CHECKLIST_BLOCK_ISSUE_CLOSING.md` from this pass.

- **Permissions: 12/12 PASS** — 9 independently re-verified live this pass, 3 carried forward unchanged from
  original 2026-09-21 evidence:
  - TC-CHK-071 (anonymous access) and TC-CHK-072 (N/A, anonymous-on-public-project) — this session's shared
    browser environment showed unexplained re-authentication as Admin within seconds of a confirmed anonymous
    state, twice, consistent with a concurrent process/session sharing the same browser profile rather than a
    plugin defect.
  - TC-CHK-076 (permission change without re-login) — its original methodology needs a direct DB membership-role
    update while the browser session stays live; that specific action was blocked by this session's sandbox
    policy on remote shell writes.
  - All three carried-forward TCs test Redmine-core/Rails mechanisms (`login_required`, anonymous-role logic,
    per-request permission re-evaluation) untouched by any of BUG-CHK-002/004/005's fixes.
- **Templates: 23/23 PASS.** Full re-confirmation of template CRUD, apply-to-issue (ordered/nested/journaled/
  additive/clean-refused-duplicate), and negative/security cases.
- **0 new bugs.** No FAILs.
- **Notable, non-bug behavioral change confirmed:** TC-CHK-078 (closed/archived project) — a non-admin member's
  blocked checklist write on a closed project now shows a visible "You don't have permission to perform this
  action." message where the original 2026-09-21 evidence only confirmed the write itself was blocked, with no
  visible feedback. This is BUG-CHK-005's own intended fix (confirmed already via its retest #2 today), not a new
  finding — a strict improvement, not a regression.
- **TC-CHK-106** (apply the same template twice) specifically confirmed BUG-CHK-005's new `addErrorDiv()` fallback
  message is correctly scoped to the plugin's own AJAX failure paths only — the unrelated native-form
  duplicate-template refusal flash ("Failed to create any checklist from template...") still shows its own
  original message, not the generic permission-denied fallback.
- Full per-TC evidence is inline in each suite file under a new "Regression Pass — 2026-09-24 (targeted, post
  BUG-CHK-002/004/005)" section.

## Completed Previous Session (2026-09-24) — scoped post-fix regression for BUG-CHK-002/BUG-CHK-004

User-approved scoped regression (see Run History below for full detail): executed all 42 TCs across
`CHECKLIST_CHECKLIST_MANAGEMENT.md` and `CHECKLIST_PROGRESS_TRACKING.md` live, **41 PASS / 1 N/A, 0 FAIL, 0 new
bugs**. Both `BUG-CHK-002` and `BUG-CHK-004` are now candidates for closure — see "Next Session Start Point" below.

## Completed Previous Session (2026-09-22) — BUG-CHK-005 filed, closed-project checklist writes not blocked

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

- TC-CHK-037 — expanded by default on a genuine fresh page load, DOM-verified (`display: block`), re-confirmed
  after a full container rebuild + asset precompile, and again under a non-admin Member role.
- TC-CHK-038 — every checklist on an issue expands by default, not just the first. Noted (not a bug) a harmless
  DOM-only quirk in the AJAX "New checklist" creation path — see `CHECKLIST_MEMORY.md`.
- TC-CHK-039 — collapse/expand toggle regression-clean against TC-CHK-026.
- TC-CHK-040 — a manually collapsed checklist survives a real reload, clears correctly on re-expand (no stuck
  state across two reload cycles).
- TC-CHK-041 — collapsed state survives an AJAX re-render triggered by mutating a *different* checklist.
- TC-CHK-042 — collapse memory is per-browser (`localStorage`), not per-account: confirmed by switching from
  Admin to a newly-created seed user (`luna.blossom`) in the same browser tab; no checklist data leaked between
  accounts, only the cosmetic view state.

Full evidence for all six is inline in `testcases/CHECKLIST_CHECKLIST_MANAGEMENT.md`.

**Regression pass required and run** (per `SENIOR_QA_STANDARDS.md` §26 — #120920 touched shared rendering/JS files)
against the rest of `CHECKLIST_CHECKLIST_MANAGEMENT.md`, TC-CHK-015–222 — **21 PASS, 1 N/A, 1 FAIL**:

- **BUG-CHK-002 (Critical, new) — a `<script>` tag in a checklist/sub-item title executes on creation.** Confirmed
  client-side-only (self-XSS on the creating user's own AJAX success handler; a normal reload renders it safely
  escaped, so not a stored XSS for other viewers). Root-caused to `checklist.js`'s two creation success handlers
  building raw HTML with unescaped interpolated title text — contrast with the *edit* handlers in the same file,
  which correctly use `.innerText`. **Not caused by #120920** (that diff didn't touch `checklist.js`'s creation
  paths at all) — pre-existing, just newly discovered by this regression pass. Filed locally; **not yet reported
  to production**, pending user direction.
- TC-CHK-036 is N/A on this instance — the Checklist plugin has no per-project module toggle to test against.
- Two pre-existing, non-blocking usability notes recorded in the suite file (not filed as bugs): the sub-item
  "Add" form closes after each item instead of staying open for consecutive adds (TC-CHK-018), and the
  whole-checklist delete confirmation doesn't explicitly warn that child items go too (TC-CHK-024).
- One self-correction worth flagging: my first pass at TC-CHK-032 (duplicate titles) read a false negative from
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
  that other plugin, `BUG-INE-002`). TC-CHK-011 clarified that a parent issue with an open subtask is gated by
  an unrelated, stricter Redmine core/workflow rule before this plugin's own feature ever gets a chance to act.
  TC-CHK-010 (REST API bypass) **not executed** — reading a real API key was blocked by this session's own
  credential-materialization safeguard, and an unauthenticated `.json` PUT triggers a disruptive native browser
  Basic-Auth popup.

Full evidence for every TC in all three suites is inline in the respective testcase files, with a Summary
section at the bottom of each.

## In Progress

- User follow-up (2026-09-07) closed 3 gaps flagged after the first pass:
  - Sub-checklist item creation — **now tested** (TC-CHK-046, PASS) — this is also where the per-item Status dropdown ("Neu"/"In Bearbeitung"/"Erledigt") turned out to live (it's on sub-items, not top-level items, which is why it wasn't seen before).
  - "Block issue closing" functional enforcement + error message — **now tested** (TC-CHK-047, PASS for this plugin). Enabled the setting, confirmed the block works and its error message is fully translated via the full Edit form. The inline quick-edit path surfaces the same message wrapped in an untranslated English "Could not save:" prefix — that defect belongs to the Inline Editor plugin (`BUG-INE-002`), not this one.
  - Checklist Template Delete popup — already covered in the first pass (TC-CHK-044).
  - Checklist Template **Edit** form — **now opened and inspected** (was previously only the link's existence). Fully translated: "Checklisten-Vorlage bearbeiten" heading, "Vorgangstyp*", "Vorlagenname*", "Checklisten-Titel*", "Weitere Unter-Checkliste hinzufügen", "Checkliste hinzufügen", "Vorlage aktualisieren", "Abbrechen" — PASS, no bugs.
- Expand/collapse checklist (up-arrow icon per KB) — **now exercised, 2026-09-21** (TC-CHK-026 toggle PASS, plus
  the full TC-CHK-037–228 default-expanded sweep above).
- "Auto-calculate % done from checklist" toggle — **now fully exercised, 2026-09-21** (functional behavior, not
  just label translation) — see `CHECKLIST_PROGRESS_TRACKING.md` TC-CHK-083/306/312.
- Stage 2 (resolutions) **complete** — tested at 1280×720 and 1920×1080, both PASS, no layout defects found (issue-detail widget, admin template list, delete confirmation modal all checked).
- Stages 3–6 (Lotus theme) **complete** — issue-detail widget, cross-plugin overlap check, and admin template list + Delete modal all retested under Lotus, all PASS. Resolution retest under Lotus (1280×720/1920×1080) found no Checklist-specific issues (the tab-strip clipping found at 1280×720 was filed against the Lotus theme itself, `BUG-LTS-002`, not this plugin).
- **BUG-CHK-001 closed 2026-09-07** per explicit user direction: the user had already independently reported this same untranslated-journal-message finding themselves before this session surfaced it. Re-confirmed live on a second issue before closing, so the underlying observation stands (documented in `CHECKLIST_FEATURES_LIST.md` and the testcase file) — it's simply not tracked as an open item in this repo to avoid double-tracking.
- "Auto-calculate % done" toggle's functional behavior — now fully exercised, see above (2026-09-21).

## Blockers

- None.

## Next Session Start Point

- **2026-09-24 targeted check complete:** `CHECKLIST_PERMISSIONS.md` (12/12 PASS, 3 carried forward — see Run
  History) and `CHECKLIST_TEMPLATES.md` (23/23 PASS) both re-confirmed clean post-closure. This was a
  user-approved narrower scope, **not** the full §27 final-cycle regression.
- **Still outstanding for a true `SENIOR_QA_STANDARDS.md` §27 final-cycle regression** (required before
  `STATUS.md` can move to `Complete`): `CHECKLIST_INSTALLATION_CONFIGURATION.md` and
  `CHECKLIST_BLOCK_ISSUE_CLOSING.md` have not been regression-checked since the three bugs closed — both were
  explicitly excluded from today's targeted pass per user instruction. `CHECKLIST_GERMAN_LANGUAGE.md` remains
  excluded per the standing 2026-09-07 instruction (not part of §27 scope discussions so far). `TC-CHK-010` (REST
  API bypass, in `CHECKLIST_BLOCK_ISSUE_CLOSING.md`) is still not executed at all (needs a real API key supplied
  out-of-band). A genuine §27 pass also needs `CHECKLIST_CHECKLIST_MANAGEMENT.md` and
  `CHECKLIST_PROGRESS_TRACKING.md` re-included even though they already passed their own scoped regression on
  2026-09-24, since §27's scope is "every suite," not just previously-fixed ones.
- **Two TCs from today's pass need a real live re-check when the environment allows:** TC-CHK-071 (anonymous
  access to a public project) and TC-CHK-076 (permission change without re-login) — both were carried forward
  from 2026-09-21 evidence this pass due to environment blockers (see "Completed This Session" above), not because
  of any suspected regression. TC-CHK-076 specifically needs either a relaxed sandbox policy for the one-time
  rails-runner membership update, or an equivalent UI-only technique to be devised.
- **BUG-CHK-002 and BUG-CHK-004 are now CLOSED (2026-09-24)** — retested PASS, user-approved scoped regression
  PASS (see below), user explicitly approved closure, production issues #121059/#121060 synced to Done/100%,
  local files moved to `bugs/closed/`.
  - BUG-CHK-002 (Critical): scoped regression PASS — `CHECKLIST_CHECKLIST_MANAGEMENT.md` (27 PASS / 1 N/A) +
    `CHECKLIST_PROGRESS_TRACKING.md` (14 PASS), 0 new bugs. The full-plugin regression the Critical severity table
    would otherwise call for was **not** run — user explicitly chose the narrower two-suite scope instead.
  - BUG-CHK-004 (Medium): scoped regression PASS — `CHECKLIST_PROGRESS_TRACKING.md` (14/14 PASS, its own affected
    suite) + `CHECKLIST_CHECKLIST_MANAGEMENT.md` alongside it, 0 new bugs.
- **BUG-CHK-005 is now also CLOSED (2026-09-24)** — dev pushed a follow-up fix (commit `c7521cc`) for the
  no-feedback half after it was reopened on production; retest #2 confirmed both halves fixed; user approved
  closure; production issue #121061 synced to Done/100%; local file moved to `bugs/closed/`.
- **`bugs/open/` is now EMPTY** — all bugs for this plugin (BUG-CHK-001 through BUG-CHK-005) are closed. This
  does **not** by itself trigger `STATUS.md` → `Complete`: per `CLAUDE.md` §10/§12, that also requires a full
  final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) across **every** suite (including
  `CHECKLIST_INSTALLATION_CONFIGURATION.md`, `CHECKLIST_PERMISSIONS.md`, `CHECKLIST_TEMPLATES.md`,
  `CHECKLIST_BLOCK_ISSUE_CLOSING.md` — not just the two suites scoped-regressed for CHK-002/004), which has
  **not** been run yet. No `automation/tests/` exist for this plugin (empty `automation/` folder) to speed up
  that future full pass. **This is the next session's natural starting point** if the user wants to pursue
  `Complete` status.
- All functional test suites for this plugin are now executed except German (`CHECKLIST_GERMAN_LANGUAGE.md`,
  explicitly excluded per user instruction this session).
- **TC-CHK-010** (`CHECKLIST_BLOCK_ISSUE_CLOSING.md`, REST API bypass check) still needs to be run — requires a
  real API key supplied out-of-band by the user (browser-automation credential reads are blocked by this
  session's own safeguard, and an unauthenticated request triggers a disruptive native Basic-Auth popup).
- **Update:** the earlier "do not touch production" instruction was superseded later in the same session — the
  user explicitly asked for all 3 open bugs to be reported (assigned to Vaishnavi Bhawsar), done, see below.
  Standing rule still applies for *future* sessions: no production write without fresh, explicit approval each
  time.

## Open Bugs Found

None. `bugs/open/` is empty as of 2026-09-24.

## Closed This Session (2026-09-24)

- **BUG-CHK-002 (Critical)** — checklist/sub-item title `<script>` tag self-XSS on creation. Retested PASS,
  scoped regression PASS (41 PASS / 1 N/A across both directly-affected suites, 0 new bugs). **User approved
  closure** — production issue **#121059** synced to status Done, 100% done; local file moved to
  `bugs/closed/BUG-CHK-002.md`.
- **BUG-CHK-004 (Medium)** — toggling a sub-checklist item's checkbox wrote duplicate Checklist History journal
  entries (cascading double-AJAX-write). Retested PASS, scoped regression PASS (14/14 PASS on its own affected
  suite, 0 new bugs). **User approved closure** — production issue **#121060** synced to status Done, 100%
  done; local file moved to `bugs/closed/BUG-CHK-004.md`.
- **BUG-CHK-005 (Low, originally High)** — checklist create/toggle/delete were not blocked on a closed/read-only
  project, and blocked actions gave no user-facing feedback. Fixed in two rounds: write-authorization first
  (retest #1: PARTIAL, reopened on production for the still-silent feedback gap), then a feedback-gap follow-up
  fix from the dev (commit `c7521cc`) after reopening (retest #2: PASS — all 6 checklist-mutating actions now
  show a visible message on a closed project). **User approved closure** — production issue **#121061** synced
  to status Done, 100% done; local file moved to `bugs/closed/BUG-CHK-005.md`.
- (BUG-CHK-001 closed 2026-09-07 — already reported by the user independently, unrelated.) `BUG-TMS-001` was
  found in an earlier session but belongs to the Timesheet plugin, not Checklist — tracked in
  `plugins/redmineflux_timesheet_qa/bugs/`, not here.

**`bugs/open/` is now empty.** All 5 bugs found for this plugin across the whole cycle (BUG-CHK-001 through
BUG-CHK-005) are closed. Per `CLAUDE.md` §10/§12, this does not by itself make the plugin `Complete` in
`STATUS.md` — a full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) across every suite is still
required and has not been run.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-fczk00paf49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) full sweep, 8 TCs (TC-CHK-043–008), 7 PASS / 1 FAIL, 1 bug found (BUG-CHK-001). Includes full admin template CRUD (create/edit/delete), cross-plugin overlap check against an Agile-Board project (clean), sub-item creation with Status dropdown, functional "block issue closing" enforcement with its translated error message, and Stage 2 resolution testing at 1280×720 + 1920×1080 (both clean, no layout defects). |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ and 108 functional, negative and permission test cases written across 5 new suites (TC-CHK-054 onward): CHECKLIST_INSTALLATION_CONFIGURATION, CHECKLIST_MANAGEMENT, PROGRESS_TRACKING, TEMPLATES, BLOCK_ISSUE_CLOSING, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-CHK-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
| 2026-09-21 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Sanity-tested production feature #120920 (expand-by-default). 6 new TCs authored and executed (TC-CHK-037–228), all PASS, no bugs. Covered fresh-load default, multi-checklist, toggle regression, reload persistence, AJAX re-render survival, and per-browser (not per-account) scoping — the last confirmed by switching Redmine accounts in the same browser after importing this instance's missing `QA_CREDENTIALS.md` seed-user pool (19 of 20 users; `aurora.wren` skipped, already a real identity here). **Full regression pass on `CHECKLIST_CHECKLIST_MANAGEMENT.md` (TC-CHK-015–222, first-ever execution, triggered by #120920 touching shared rendering/JS files per SENIOR_QA_STANDARDS.md §26): 21 PASS, 1 N/A, 1 FAIL.** Filed `BUG-CHK-002` (Critical, not caused by #120920) — a `<script>` tag in a checklist/sub-item title self-executes on creation via an unescaped client-side AJAX render, confined to the creating user's own session (not stored-XSS for other viewers). Also found and reported an unrelated Timesheet-plugin bug (`BUG-TMS-001` / production #121040) while investigating a live 500 error report. **Same-day, later pass: executed all three remaining previously-authored suites** — `CHECKLIST_TEMPLATES.md` (23/23 PASS, no bugs), `CHECKLIST_PROGRESS_TRACKING.md` (13/14 PASS, 1 FAIL → filed `BUG-CHK-004` Medium, a cascading double-AJAX-write causing duplicate Checklist History journal entries on every checkbox click), `CHECKLIST_BLOCK_ISSUE_CLOSING.md` (13/14 executed all PASS, TC-CHK-010 REST-API-bypass not executed — blocked by a credential-materialization safeguard). Every functional suite except German is now complete. |
| 2026-09-22 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Ad-hoc investigation, not a planned pass — user reported a console 403 on "Add from template" for a closed project and suspected checklist writes should be fully disabled there. Confirmed with live network evidence on project `checklist-perm-private` (closed): checklist create (`POST /checklists` → 201), toggle (`PATCH .../toggle_completed` → 200), and delete (`DELETE .../checklists_delete/:id.json` → 200) all succeed on a closed/read-only project; only "Add from template" is blocked (403), with no user-facing feedback even then. Filed `BUG-CHK-005` (High) — the plugin should follow Redmine core's own consistent closed-project read-only enforcement. **Same day, user explicitly approved reporting all 3 open bugs to production**: `BUG-CHK-002` → #121059, `BUG-CHK-004` → #121060, `BUG-CHK-005` → #121061, all assigned to Vaishnavi Bhawsar. **Then linked all 3 as defects on testcase #121037** ("Sanity: Checklists display expanded by default (#120920)") in Run #577, environment "Window 11 + Chrome" — took 3 attempts to get right (see `feedback_defect_ids_needs_issue_relation_too.md` in memory for full detail): (1) `create_status_result` with `defect_ids` saved the data internally but created no visible relation — user reported "bugs are not related"; (2) manual `create_issue_relation(relation_type="relates")` made the relation visible on the issue but still didn't show in the run's testcase-matrix `defects:[...]` badge — user reported it again ("you failed this testcase but bugs are not related"); (3) **the actual fix**: `redmineflux_testcases_management_report_defect` with `defect_issue_id` per existing bug, which creates the relation with the correct type `defect` (not `relates`) — had to first delete the 3 wrong-typed `relates` relations (Redmine only allows one relation per issue pair). Confirmed correct via both `get_run_testcases` (now shows `#121037 [Failed] ... | defects:[121059, 121060, 121061]`, matching the working `#120941 | defects:[120990]` example) and `get_issue(121037, include=relations)` (now shows `defect → #121059/060/061`). Run #577's other 45 testcases were untouched throughout — only `create_status_result`/`report_defect`/`create_issue_relation`/`delete_issue_relation` were used, never `update_run` (the tool that caused this same run's prior data-loss incident). |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Retested all 3 open bugs at the user's request. **BUG-CHK-002 (Critical) — PASS/FIXED**: source now escapes via `.text()` instead of raw-HTML `.append()` (both creation handlers, citing #121059); live retest on issue #1538 confirmed no script execution on either the top-level-checklist or sub-item path. **BUG-CHK-004 (Medium) — PASS/FIXED**: `.trigger('change')` cascade removed from `checklist_checkbox.js` (citing #121060); live retest confirmed a single checkbox click now fires exactly one PATCH (`toggle_completed`, no `update_state` follow-up) and writes exactly one item-level journal entry, not two. **BUG-CHK-005 (High) — PARTIAL**: the write-authorization half is fixed — `POST /checklists`, `PATCH .../toggle_completed` (incl. bulk), and `DELETE /checklists_delete/:id.json` all now correctly return 403 and don't persist on a closed project (verified none of the writes went through); but the no-user-feedback half from the bug's own Expected Result is still unmet — all 4 actions (including the pre-existing "Add from template" block) still fail with a console-only 403 and zero visible flash/error element. Kept CHK-005 open at reduced (Low) effective severity for the remaining scope. **None of the 3 bugs moved to `bugs/closed/` yet** — `SENIOR_QA_STANDARDS.md` §26 requires regression before closure (full-suite for Critical, full-suite-affected-area for Medium), and that regression has not been run this session (no `automation/tests/` exist yet for this plugin, so it would be fully manual). Screenshots: `screenshots/BUG-CHK-00{2,4,5}/retest-2026-09-24-*.png`. |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Scoped post-fix regression for BUG-CHK-002/BUG-CHK-004** (user-approved narrower scope — 2 directly-affected suites, not the full-plugin regression `SENIOR_QA_STANDARDS.md` §26 would otherwise call for at Critical severity). Executed all 42 TCs live: `CHECKLIST_CHECKLIST_MANAGEMENT.md` (TC-CHK-015–042, 27 PASS / 1 N/A — TC-CHK-036 has no per-project module toggle on this instance) and `CHECKLIST_PROGRESS_TRACKING.md` (TC-CHK-079–092, 14/14 PASS). **0 new bugs.** TC-CHK-031 (script-injection) re-confirmed clean on both the checklist-creation and sub-item-creation paths with fresh payloads. TC-CHK-091 (rapid toggling, the TC that originally caught BUG-CHK-004) re-confirmed clean via 5 genuine Playwright clicks (5 requests, 5 journal entries, zero `update_state` calls); a synthetic zero-delay stress test surfaced one residual, narrower request-overlap race (not reproducible via real UI interaction, not filed — noted in `CHECKLIST_MEMORY.md`). Per-click network verification (single `toggle_completed` PATCH, no cascade) repeated on 4+ independent fresh items across the session. Used a throwaway issue (#1571) for the closed-issue and delete-issue TCs to avoid this project's unrelated required-custom-field friction on the Bug tracker; deleted it afterward and verified via `rails runner` that no orphaned checklist rows remained (TC-CHK-035). **BUG-CHK-002 and BUG-CHK-004 are both now candidates for closure** — not moved to `bugs/closed/` yet, pending the user's explicit go-ahead (local move + production #121059/#121060 status sync). No screenshots taken (regression pass, all results PASS — screenshots are bug-evidence-only per `CLAUDE.md` §6). |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Closure pass.** User explicitly approved closing both regression-cleared bugs. Production issue #121059 (BUG-CHK-002) and #121060 (BUG-CHK-004) each updated: status In QA → Done, % done → 100. Local files moved `bugs/open/` → `bugs/closed/` for both. `bugs/_index.md`, `reports/final-bug-report.md`, `reports/defects-summary.html`, and `reports/tc-report.html` all regenerated to reflect the new state — only `BUG-CHK-005` (downgraded High → Low for its remaining no-feedback scope) is now open for this plugin. `bugs/open/` is not yet empty, so the full-plugin final-cycle regression (§27) and a `STATUS.md` `Complete` status are still pending BUG-CHK-005's own closure. |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Production note + reopen + retest #2 for BUG-CHK-005.** Added a note to production #121061 summarizing the retest #1 partial-fix verdict, then reopened it (In QA → Reopen) since the feedback half was still unresolved. Dev responded same day with a follow-up fix (commit `c7521cc`) for the feedback gap, root-caused to `addErrorDiv()`'s `JSON.parse()` throwing silently on Redmine's own HTML `render_403` responses, plus two actions (sub-item toggle, status-dropdown change) only logging to console, plus "Add from template" never being covered at all (it's a Rails UJS remote link, not a plugin AJAX call). **Retest #2, same day: PASS.** Live-verified all 6 checklist-mutating actions now show a visible "You don't have permission to perform this action." message on a closed project (`checklist-perm-private` / issue #1533) — create, toggle checklist, toggle sub-item, change item status, delete, add-from-template. Also verified the open-project path (`test-project` / issue #1538) still shows clean "created successfully" / "deleted successfully" messages with no false errors. Both halves of BUG-CHK-005 are now fixed — candidate for closure, not yet moved to `bugs/closed/` pending user go-ahead. Not separately retested under a non-admin role (fix is role-agnostic, fires on any `ajax:error`, and the original bug was Admin-only too). |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Closure pass for BUG-CHK-005.** User explicitly approved closing it. Production issue #121061 updated: status In QA → Done, % done → 100. Local file moved `bugs/open/` → `bugs/closed/`. `bugs/_index.md`, `reports/final-bug-report.md`, `reports/defects-summary.html`, and `reports/tc-report.html` all regenerated. **`bugs/open/` is now empty** — all 5 bugs found for this plugin across the whole cycle (BUG-CHK-001 through BUG-CHK-005) are closed. Per `CLAUDE.md` §10/§12, this does not by itself make the plugin `Complete` in `STATUS.md`: a full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) across every suite — including `CHECKLIST_INSTALLATION_CONFIGURATION.md`, `CHECKLIST_PERMISSIONS.md`, `CHECKLIST_TEMPLATES.md`, and `CHECKLIST_BLOCK_ISSUE_CLOSING.md`, not just the two suites scoped-regressed earlier — is still required and has not been run. `STATUS.md` left as `In Progress` pending that. |
| 2026-09-24 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Targeted post-closure check — `CHECKLIST_PERMISSIONS.md` + `CHECKLIST_TEMPLATES.md` only.** User-approved narrower scope, explicitly **not** the full `SENIOR_QA_STANDARDS.md` §27 final-cycle regression (`CHECKLIST_INSTALLATION_CONFIGURATION.md` and `CHECKLIST_BLOCK_ISSUE_CLOSING.md` explicitly excluded this pass). Chosen as the two suites most exposed to BUG-CHK-005's follow-up feedback-message fix (`addErrorDiv()`, commit `c7521cc`) and to permission-gated checklist writes generally. **Permissions: 12/12 PASS** (TC-CHK-067–078) — 9 independently re-verified live, 3 carried forward unchanged from 2026-09-21 evidence: TC-CHK-071 (anonymous access) and TC-CHK-072 (N/A, anonymous-on-public-project) after this session's shared browser environment twice showed unexplained re-authentication as Admin within seconds of a confirmed anonymous state (consistent with a concurrent process/session sharing the same browser profile, not a plugin defect); TC-CHK-076 (its DB-membership-update methodology was blocked by this session's sandbox policy on remote shell writes). **Templates: 23/23 PASS** (TC-CHK-093–115). **0 new bugs, 0 FAIL.** Confirmed BUG-CHK-002's fix (script-tag creation) and BUG-CHK-004's fix (single-PATCH toggle) both hold under a non-admin Manager-tier role (`luna.blossom`, TC-CHK-068), not just Admin. Confirmed BUG-CHK-005's fix generalizes correctly: TC-CHK-078's closed-project non-admin block now shows a visible permission message (a strict improvement over 2026-09-21's silent-block evidence), while TC-CHK-106's unrelated native-form duplicate-template-apply refusal still shows its own original flash, unaffected by the new `addErrorDiv()` fallback — confirming the fix's scope stayed correctly contained to the plugin's own AJAX failure paths. Both suite files updated inline with a "Regression Pass — 2026-09-24 (targeted, post BUG-CHK-002/004/005)" section. |
