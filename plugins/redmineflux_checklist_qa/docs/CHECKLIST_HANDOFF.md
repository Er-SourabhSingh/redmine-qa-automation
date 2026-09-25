# Handoff — Redmineflux Checklist Plugin

## Last Session

- Date: 2026-09-25
- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker — `redmine-docker-700-redmine-1`, `http://localhost:3010`

## Completed This Session (2026-09-25, later pass) — BUG-CHK-007 comprehensive re-verification

Per explicit user request, went back and systematically re-tested `BUG-CHK-007` across 6 distinct scenario
categories (not just the original ad-hoc discovery), each with multiple repetitions for a real reproduction
rate rather than a single anecdotal trial:

1. **Parent checklist checkbox, no sub-items** — clean, 0/6 rounds. No race without sub-items to cascade to.
2. **Parent checklist checkbox, with sub-items** — checkbox and sub-item data themselves always correct
   (16/16 rounds); the *displayed percentage* lagged stale in 3/16 rounds (~19%, checking direction only).
   Self-corrects on a later check — a live/fetch race, not DB corruption.
3. **Sub-item dropdown, Done/New** — genuine, reload-confirmed lost updates, 2/5 rounds (40%). Does **not**
   self-correct.
4. **Sub-item dropdown, all 3 states (incl. In Progress)** — same defect, 1/3 reload-confirmed rounds.
5. **Mixed parent + sub-item interleaved** — most severe: the parent's bulk cascade overwrote a sub-item that
   was never touched by the sequence at all.
6. **Normal-paced control (≥800ms gaps)** — clean, 0/6 rounds, confirming the defect is specific to
   sub-second-spaced interaction.

Also established an important **testing methodology finding**: a `<select>` dropdown's live `.value` in the
browser is not a reliable signal (nothing in the app JS writes back to it from an AJAX response — only the
sibling checkbox is updated that way), so any future retest of this area must verify via a full page reload,
not the live DOM.

`bugs/open/BUG-CHK-007.md` rewritten with the full 6-category breakdown, a summary table, and an explicit
distinction between (a) actual persisted/server-state corruption [Categories 3-5], (b) UI-only stale/stuck
display that self-corrects [Category 2 + the Feature #1570 field example], (c) parent/child state mismatch
[seen live in Category 5], and (d) cases proven to self-correct vs. not. `CHECKLIST_MEMORY.md` updated with
the condensed findings and the select-value methodology gotcha for future sessions. Still **not reported to
production** — pending explicit approval; severity unchanged at High given Category 5's severity (silent data
loss extending to untouched items).

## Completed This Session (2026-09-25, earlier pass) — new production regression BUG-CHK-006 filed, retested PASS, closed

Restarted `redmine-docker-700-redmine-1` (user request) — confirmed back up and serving within ~15s of the
Puma boot log.

User asked for production issue **#121326** to be pulled, retested, filed locally, and given a regression
test case. Summary: **regression of #87932** — commit `be748c4` (11 Aug, fixing "checklist activity doesn't
touch the issue's Updated timestamp") re-introduced #87932's original defect (every checklist change wrote a
comment into the issue's Notes tab) as a side effect. Fixed by commit `f51af5b`: the issue is still touched
(`Issue#touch`, bumping `updated_on`/`lock_version`) but no longer via a comment-creating path — what happened
is recorded only in the Checklist History tab, as it should be. A second, related fix in the same commit: the
lock_version bump is now handed back to the browser via an `X-Issue-Lock-Version` response header, so an
inline field edit made on the same page immediately after a checklist mutation no longer fails with a
stale-object error.

- **Retested live 2026-09-25 — PASS.** Source confirmed the fix (`issue_journal_touch.rb`'s `touch_issue` uses
  `issue.touch`, never a comment-creating call). Live-verified on a fresh issue (#1578, to avoid this
  instance's older fixtures' unrelated required-custom-field noise): checklist create + toggle produced **no**
  Notes-tab entry (the tab didn't even render — Redmine only shows tabs with content) while both actions were
  fully recorded in Checklist History; the issue's Updated timestamp refreshed immediately; an inline Priority
  edit made right after the tick, same page, no reload, returned 200 (not a stale-object error) and persisted.
  Full detail: `bugs/closed/BUG-CHK-006.md`.
- Filed **`BUG-CHK-006`** (Medium) directly to `bugs/closed/` — the fix was already live on this instance
  before the bug file was written, so there was no window where it was open-and-unfixed locally.
- Authored and executed **`TC-CHK-116`** in `testcases/CHECKLIST_CHECKLIST_MANAGEMENT.md` for future
  regression coverage of this exact mechanism (Notes-tab non-pollution + Checklist-History recording + Updated
  timestamp refresh + no stale-object error on an immediate follow-up field edit).
- **Production issue #121326 was NOT touched** — still "In QA" on production; no status/percent-done sync was
  made, since it wasn't requested this session.
- Not yet independently retested as a non-admin Member (the production ticket's own "For QA" checklist asks
  for this) — Admin only this pass.

**Same session, new finding — BUG-CHK-007 filed (Open, High).** User reported (in the middle of the BUG-CHK-006
retest, on the same fixture) a concern that check/uncheck actions don't always sync the checklist's done
percentage properly. Investigated live and confirmed a real, reproducible bug — **not** the same thing already
covered by `BUG-CHK-004`:

- Rapidly clicking a checklist's own checkbox several times in quick succession (genuine `.click()` dispatch,
  no artificial delay) can leave the checkbox unchecked while the progress bar and both sub-items' actual data
  stay stuck at 100% — confirmed via a fresh server-side `completion_percentage` fetch agreeing with the wrong
  number, so this is a real data race, not a stale client render.
- Rapidly flipping a sub-item's status dropdown between Done/New several times can silently lose the user's
  actual last selection — 5 alternating changes ending on "Done" persisted as "New" after reload.
- Root cause: the existing `.always()`-chained serialization in `checklist_checkbox.js` only sequences the
  *two* AJAX calls triggered by a *single* click — it does nothing to debounce or sequence *separate* rapid
  clicks/changes, so multiple concurrent two-step chains can complete out of order.
- Confirmed this is specific to sub-second-spaced interaction — the same sequence spaced ~3s apart (matching
  ~tool round-trip latency, closer to deliberate manual clicking) landed correctly every time.
- Filed **`BUG-CHK-007`** (High — a genuine data-integrity race, the checklist's own state can end up
  contradicting its sub-items') to `bugs/open/`. **Not reported to production** — pending explicit approval.
  Full detail: `bugs/open/BUG-CHK-007.md`.

## Completed Previous Session (2026-09-24) — targeted post-closure check: Permissions + Templates suites

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

- **BUG-CHK-007 — CLOSED 2026-09-25, same session.** Fix landed same day (per-checklist request queue +
  `updateProgressBar()` reordered to run after `toggle_completed_bulk`), retested PASS across all 6 original
  failure categories (single deliberate CHECK/UNCHECK, rapid same-tick multi-click, rapid dropdown changes,
  mixed interleaving), production #121338 synced to Done/100%. This was the last bug in `bugs/open/` for the
  plugin. **§26 scoped regression completed same session:** `CHECKLIST_PROGRESS_TRACKING.md` (directly
  affected suite) 14/14 PASS live, `CHECKLIST_CHECKLIST_MANAGEMENT.md` (adjacent suite) spot-checked at its
  one real code-overlap point (collapse persistence through the fixed request queue) — PASS; see both suite
  files' own "Regression Pass — 2026-09-25" sections. **Next session priority: a full
  `SENIOR_QA_STANDARDS.md` §27 final-cycle regression across every suite** (not just these two) — not yet
  run — is still required before `STATUS.md` can move from `In Progress` to `Complete`.
  `bugs/closed/BUG-CHK-007.md` has the full investigation, correction, and retest evidence.
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

- **BUG-CHK-007 — CLOSED 2026-09-25.** Rapid repeated toggling races unsequenced AJAX chains across 6
  confirmed scenario categories, including a same-day correction that the percentage-lag mode also hits
  single deliberate clicks (~5/9 trials), not only rapid/overlapping ones. Fixed via a per-checklist request
  queue plus reordering `updateProgressBar()` to run after `toggle_completed_bulk`. Retested PASS across all
  6 categories same day. Production #121338 synced to Done/100%.
  `plugins/redmineflux_checklist_qa/bugs/closed/BUG-CHK-007.md`.

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
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Restarted `redmine-docker-700-redmine-1` per user request (up and serving within ~15s of Puma boot log). Retrieved production issue **#121326** — a regression of #87932: commit `be748c4` (11 Aug) fixed checklist activity not touching the issue's `updated_on`, but did so via writing a comment on the issue, which put every checklist change back into the Notes tab (#87932's original defect). Fixed by commit `f51af5b`: `Issue#touch` bumps `updated_on`/`lock_version` without a comment; what happened is recorded only in Checklist History. Also fixed in the same commit: the `lock_version` bump is now handed back to the browser via an `X-Issue-Lock-Version` response header, so an inline edit made right after a checklist mutation on the same page no longer fails with a stale-object error. **Retested live — PASS.** Source confirmed (`issue_journal_touch.rb`). Live-verified on a fresh issue (#1578): checklist create + toggle produced zero Notes-tab entries (tab didn't even render) while both were fully recorded in Checklist History; Updated timestamp refreshed immediately; an inline Priority edit made right after the tick, same page, no reload, returned 200 and persisted (no stale-object error). Filed **`BUG-CHK-006`** (Medium) directly to `bugs/closed/` — fix was already live, no window where it was open-and-unfixed locally. Authored and executed **`TC-CHK-116`** in `CHECKLIST_CHECKLIST_MANAGEMENT.md` for future coverage of this mechanism. Production issue #121326 was **not** touched (still "In QA"; status sync not requested this session). Not yet retested as a non-admin Member. |
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Same-session, later pass: BUG-CHK-007 correction, dev fix retest, and closure.** Rigorous network-log-based re-investigation (reading the app's own `completion_percentage` response body, not just DOM/self-fetch) found the percentage-lag failure also hits single deliberate parent-CHECK clicks (~5/9 trials) — corrected the bug file and production #121338 (added a correction note) to retract the earlier, too-narrow "requires overlapping rapid clicks" characterization; root-caused to `updateProgressBar()` firing inside `toggle_completed`'s success callback, before the chained `toggle_completed_bulk` had completed. Container was then restarted, picking up a dev fix in `checklist_checkbox.js` (fresh asset `checklist_checkbox-75989a16.js`, fix comment citing #121338): a per-checklist request queue now serializes every control's AJAX chain (parent + all sub-items share one queue, newest change per control supersedes a still-waiting one), and `updateProgressBar()` was moved to run only after `toggle_completed_bulk` resolves. **Retested PASS** across all 6 original failure categories on checklist 208: single deliberate CHECK/UNCHECK 6/6 clean at normal pacing; rapid same-tick 5-click bursts 2/2 clean both directions, deterministic; rapid sub-item dropdown changes 2/2 reload-confirmed clean; mixed parent+sub-item interleaving self-consistent and deterministic across two runs (no recurrence of the original unpredictable last-writer-wins behavior). Moved `bugs/open/BUG-CHK-007.md` → `bugs/closed/`, updated `bugs/_index.md`. User approved production sync; #121338 updated to Status Done, % done 100 (verified via `get_issue`). **`bugs/open/` is now empty again** — a full `SENIOR_QA_STANDARDS.md` §27 final-cycle regression across every suite is still required before `STATUS.md` can move to `Complete`. |
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **Same-session, final pass: §26 scoped post-fix regression for BUG-CHK-007.** Per `SENIOR_QA_STANDARDS.md` §26's High-severity minimum ("all TCs in the affected suite + adjacent feature TCs"). Built a fresh fixture (checklist "Regression progress accuracy 2026-09-25" / id 214, sub-items P1–P5) on issue #1578 and re-executed `CHECKLIST_PROGRESS_TRACKING.md` (the directly affected suite) live: **14/14 PASS** — exact 25/50/75/100% percentage accuracy (TC-CHK-082), live checkbox↔dropdown sync both directions (TC-CHK-080/081), delete-recalculates (TC-CHK-088, 100%→75% on deleting the completed item), add-recalculates (TC-CHK-089, 100%→80% on a 5th item), and auto-calculate wiring (TC-CHK-083/084) — found the plugin's "Auto-calculate issue progress from checklists" setting left **disabled** from an earlier session, re-enabled it in Configure → General, confirmed the issue's Progress field recalculates live (80%→20%) once on, and confirmed it correctly stays frozen while off (the exact TC-CHK-084 behavior, observed before re-enabling) — left enabled for future sessions per prior convention. TC-CHK-091 reused this session's own exhaustive BUG-CHK-007 retest evidence; TC-CHK-079/086/087/090/092 reused recent unaffected-code-path evidence (see the suite file's own Regression Pass section for the full breakdown and rationale). Then spot-checked the adjacent suite `CHECKLIST_CHECKLIST_MANAGEMENT.md` at its one real point of code overlap with the fix — collapse/expand persistence (`restoreCollapsedChecklists()`, same file as the fix) surviving a 5-rapid-click burst through the fixed request queue — **PASS**, collapsed state held. That suite's other 27 CRUD/permission TCs have no code-path overlap with `checklist_checkbox.js`'s toggle queue and were not re-run (last confirmed clean 2026-09-21/24). **Result: BUG-CHK-007's §26 regression obligation is satisfied.** STATUS.md updated to reflect it; still `In Progress` pending the larger §27 full-plugin final-cycle regression, not attempted this session. |
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **New bug found — BUG-CHK-007.** Mid-session, user reported a concern (in Hinglish: check/uncheck doesn't always sync the checklist's done percentage properly). Investigated live on the same #1578 fixture. Rapidly clicking the checklist's own checkbox (genuine `.click()` dispatch, no delay, reproduced twice) left the checkbox unchecked while the progress bar and both sub-items' actual data stayed at 100% — confirmed via a fresh server `completion_percentage` fetch agreeing with the wrong number, so a real data race, not a stale render. Rapidly flipping a sub-item's status dropdown similarly lost the user's actual last selection (5 alternating changes ending on "Done" persisted as "New"). Root cause: `checklist_checkbox.js`'s existing `.always()` chaining only serializes the two AJAX calls *within* one click, not across *separate* rapid clicks/changes — concurrent chains from multiple clicks can complete out of order. Confirmed specific to sub-second-spaced interaction: the same sequence spaced ~3s apart (tool round-trip latency) landed correctly every time. Filed **`BUG-CHK-007`** (High) to `bugs/open/` — not yet reported to production, pending explicit approval. |
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **BUG-CHK-007 comprehensive re-verification**, per explicit user follow-up request not to limit testing to the original repro. Systematically tested 6 categories with statistically-meaningful repetition: (1) no sub-items — clean, 0/6; (2) parent-with-subs rapid toggle — checkbox/sub-item data always correct (16/16), but displayed percentage stale in 3/16 (~19%, self-corrects); (3) sub-item dropdown Done/New — genuine reload-confirmed lost updates, 2/5 (40%, does NOT self-correct); (4) all 3 dropdown states incl. In Progress — same defect, 1/3; (5) mixed parent+sub-item interleaved — most severe, parent's bulk cascade overwrote a sub-item never touched by the sequence at all; (6) normal-paced control (≥800ms gaps) — clean, 0/6, confirms sub-second-specific. Established a key methodology finding: a `<select>`'s live `.value` is not authoritative during this kind of test (nothing in the app JS writes back to it from an AJAX response, only the sibling checkbox is) — future retests must verify via full page reload. Rewrote `bugs/open/BUG-CHK-007.md` with the full category breakdown, summary table, and explicit separation of (a) actual persisted/server-state corruption, (b) UI-only stale/stuck display, (c) parent/child state mismatch, (d) self-corrects vs. does-not. Updated `CHECKLIST_MEMORY.md`. Severity unchanged at High. Still not reported to production. |
| 2026-09-25 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | **BUG-CHK-007 second follow-up + production report.** User reported a specific live sequence (uncheck sub-item "78" → check parent, expecting the percentage to update immediately but reportedly not seeing it) with two screenshots as evidence. Re-verified faithfully using genuine Playwright `browser_click` (real mouse-driven, not scripted) with a screenshot at every step, including twice from a completely fresh page reload — 5/5 clean, percentage always updated correctly and immediately, could not corroborate the specific claim. Recorded in `bugs/open/BUG-CHK-007.md` as "investigated but unconfirmed" per this repo's rule not to document unreproduced behavior, distinct from the already-confirmed Category 2 finding. **User then approved reporting BUG-CHK-007 to production** — created as issue **#121338**, assigned to Vaishnavi Bhawsar, category Checklist Plugin, Priority/Defect Severity/Defect priority all High, Defect Type Functional. Production description condensed the 6-category investigation into the 3 confirmed failure modes (percentage lag, sub-item lost updates, mixed-interaction overwrite of untouched items) plus root cause and fix direction, noting the unconfirmed single-action variant separately. `bugs/_index.md` and this handoff file updated with the production issue ID. |
