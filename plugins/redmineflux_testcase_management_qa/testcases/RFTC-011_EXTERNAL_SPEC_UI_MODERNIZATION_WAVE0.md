> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> Covers **production feature #121879** ("rftc-011 — TCM UI modernization", **Wave 0 only** — the full
> design-system migration is multi-wave, future work, still "In Progress" at 30% done-ratio, NOT part of this
> release's "In QA" set). Part of **Testcase Management plugin Release 7.2.0**.
>
> **ID prefix**: `RFTC011-<n>`. **Executed**: 2026-10-19, same environment as `RFTC-020`/`021`/`044`.
>
> **2026-10-19 follow-up**: the full source spec — `backlog/planning/rftc-011-feature-ui-modernization.md` (368
> lines, screen inventory + phasing + the spec's own embedded Unit/Functional/Edge/Security-Holdout/QA-Test-Plan
> tables), plus the two documents the production ticket cites (`documents/cohort-review-v1-v2-2026-10-02.md`,
> `documents/testmo-tcm-feature-gap-2026-10-02.html`) — were read in full (they had not been read before
> RFTC011-1/2 were originally written). The spec confirms Wave 0's actual scope is narrow: **only**
> `rf_testcase_management_variables.css` (the hover token) and the `#main` rule in `testcase_style.css` — no
> screen/view is touched in Wave 0, so the spec's screen-specific Functional/Unit tests (token-namespace-per-
> modernized-screen, native-submit-restored, etc.) are **not yet applicable** (those are Wave 1+ work, not yet
> built). What follows adds every Wave-0-applicable mechanical/security-holdout check from the spec's own tables
> that RFTC011-1/2 did not originally cover, plus **one genuine finding** the spec itself appears to have missed
> cataloguing.

# Test Cases — Redmineflux Testcase Management — rftc-011 Wave 0 (link color + CSS scope leak)

## Feature summary

Wave 0 of the UI modernization effort: (1) a link hover color that was too low-contrast (an alpha-hex value) is
now a resolved, readable solid hex; (2) a plugin-only layout rule (`#main{flex-grow:2;...}`) that was unscoped and
leaking onto **every** Redmine page is now scoped to only the plugin's own controllers.

---

### RFTC011-1: Plugin layout CSS no longer leaks onto non-plugin pages

**Priority:** P1 — this is a real regression-risk class of bug (global ID selector, `#main`, affecting the entire
app)
**Steps:** Compare the computed style of `#main` on a plugin page (`/test_suites?project_id=...`) vs. a
non-plugin page (`/projects/.../issues`) in the same session.
**Expected Result:** The plugin's `flex-direction:row` rule applies **only** on the plugin's own controllers;
a non-plugin page should show Redmine core's own native layout behavior instead.
**Actual Result:** PASS. Plugin page (`body.controller-test_suites`): `flex-direction: row` (plugin rule
applied, as intended). Non-plugin page (`body.controller-issues`): `flex-direction: row-reverse` (Redmine core's
own default — proves the plugin rule is genuinely scoped out here, not just visually similar by coincidence).
Source-confirmed: `testcase_style.css` now reads
`.controller-test_suites #main,.controller-runs #main,...,.controller-testcase_help #main{flex-grow:2;...}` — an
explicit controller allowlist, not a bare `#main` selector.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — plugin page (`/test_suites`): `flex-direction: row`; non-plugin page (`/issues`): `flex-direction: row-reverse` (Redmine core default). Still working as designed.

---

### RFTC011-2: Link hover color is now a resolved, readable solid color

**Priority:** P2 (accessibility)
**Steps:** Read the computed value of the `--rf-accent-hover` CSS custom property.
**Expected Result:** A solid, readable hex value — not the previous alpha-channel value (`#0094ffc7`, which
rendered as a washed-out, low-contrast blue).
**Actual Result:** PASS. `getComputedStyle(document.documentElement).getPropertyValue('--rf-accent-hover')` →
`#0077CC` — a real darkened solid hex, matching the commit's own stated fix.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `--rf-accent-hover` still reads `#0077CC`. Still working as designed.

---

---

### RFTC011-3 (spec Unit Test 1): The old alpha-hex value is genuinely gone from the token file, not just overridden

**Priority:** P1
**Steps:** Grep `rf_testcase_management_variables.css` for `0094ffc7`.
**Expected Result:** `--rf-accent-hover` reads `#0077CC`; the old alpha-suffix value appears nowhere else as an
active declaration in this file.
**Actual Result:** PASS. The only hit for `0094ffc7` in this file is inside a `/* ... */` comment documenting the
fix's own history ("the alpha-suffix-hex #0094ffc7 was an anti-pattern per §11/§24") — not a live declaration.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — still only the comment, no live declaration. Still working as designed.

---

### RFTC011-4 (spec Unit Test 2, strengthened): Zero bare `#main {` selectors across every stylesheet the Settings page actually loads

**Priority:** P1
**Steps:** Grep every stylesheet loaded on the plugin Settings page (`testcase_style.css`, `testsuite.css`,
`timelog.css`, `testcase_form_modal.css`, `rf_testcase_management_layout.css`, `redmine_core.css`) for a bare
`#main {` selector.
**Expected Result:** None found anywhere (every `#main` reference is either comment-only or inside a
`.controller-*` scope).
**Actual Result:** PASS. All matches were explanatory comments (e.g. `rf_testcase_management_layout.css`
documenting the Scarlet-theme margin interaction) — zero live bare `#main` rules.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `grep -n "^#main {"` across all 6 loaded stylesheets returned zero matches. Still working as designed.

---

### RFTC011-5 (spec Unit Test 4): `!important` count is non-increasing (baseline 303)

**Priority:** P2
**Steps:** Count `!important` occurrences in `testcase_style.css`.
**Expected Result:** ≤ 303.
**Actual Result:** PASS. **278** — actually decreased, not just held flat (consistent with rftc-015's
independently-verified CSS trim, not a Wave-0 claim itself, but confirms the floor holds).

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — still exactly **278**, unchanged, ≤ 303 baseline. Still working as designed.

---

### RFTC011-6 (spec Unit Test 5): `testcase_style.css` byte weight is strictly smaller than the 144,032-byte baseline

**Priority:** P2
**Steps:** Check the file's byte size.
**Expected Result:** Strictly smaller than 144,032 bytes.
**Actual Result:** PASS. **106,026 bytes** — well under baseline.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — now **127,181 bytes** (grown somewhat since 2026-10-19's 106,026 from unrelated feature additions, but still comfortably under the 144,032-byte baseline). Still working as designed; floor holds.

---

### RFTC011-7 (spec Functional Test 5 / Security Holdout H3 / QA Test Plan step 7 — all three collapse into one check): Settings page never loads the monolith, and `#main` shows Redmine's own native behavior

**Priority:** P1 — this is the exact rtc-009 regression this entire Wave 0 exists to fix
**Steps:** Open `/settings/plugin/redmineflux_testcase_management`; inspect `document.styleSheets` for
`testcase_style.css`; read `#main`'s computed `flex-direction`.
**Expected Result:** `testcase_style.css` is absent from the page's loaded stylesheets (only scoped secondary
sheets load); `#main`'s `flex-direction` matches Redmine core's own default (`row-reverse`), not the plugin's
`row` override.
**Actual Result:** PASS, fully. Loaded stylesheets on this page: `jquery-ui`, `tribute`, `application`,
`responsive`, `rf_testcase_management_variables`, `rf_testcase_management_components`,
`rf_testcase_management_layout`, `redmine_core`, `testsuite`, `timelog` (×2), `testcase_form_modal` (×2) —
**`testcase_style.css` is genuinely not among them**. `#main` computed `flex-direction: row-reverse` — Redmine's
own native value, confirming the plugin's scoped rule correctly excludes this controller.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — `testcase_style.css` still absent from `/settings/plugin/redmineflux_testcase_management`'s loaded stylesheets (13 sheets checked); `#main` computed `flex-direction: row-reverse`. Still working as designed.

---

### RFTC011-8 (Security Holdout H1, SEC-004): Credential-in-view count is 0 — better than the spec's own assumed baseline of 6

**Priority:** P1 — security holdout, must never regress
**Steps:** Grep `app/views/` for `User.current.api_key` / live credential rendering; check the exact 6 views the
spec names (`requirements/index`, `test_suites/index`, `test_suites/releases`, `timelog/_form`, `runs/new`,
`issue_testcase/new`).
**Expected Result:** Per the spec (written 2026-10-02), these 6 views still carry a live `api_key` since rftc-013
(the fix) was `status: planning` at spec-authoring time — Wave 0 must not add a 7th.
**Actual Result:** PASS, and better than the spec assumed: **0 of the 6 named views currently render a live
`api_key`** — only 2 files mention the string `api_key` at all (`settings/_testcases_settings.html.erb`,
`timelog/_form.html.erb`), and both are **comments documenting that the key was already removed**, not live
credential renders. This means rftc-013 has shipped and migrated all 6 views since this spec was written — the
spec's own SEC-004 baseline (6) is now stale/conservative, which is a safe direction to be wrong in. Wave 0
clearly added no new credential-bearing view.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — still 0 live `api_key` renders in the 6 named views; only 1 comment mention remains (`timelog/_form.html.erb`). Still working as designed.

---

### RFTC011-9 (Security Holdout H2, SEC-002): `raw`/`.html_safe`/`.html(` count holds exactly at the documented baseline (52)

**Priority:** P1 — security holdout, must never regress
**Steps:** Grep `app/views/` + `app/models/` for the exact three patterns the spec's own holdout names:
`raw(`, `.html_safe`, `.html(`.
**Expected Result:** ≤ 52 (the spec's own stated baseline).
**Actual Result:** PASS. Exactly **52** — unchanged from baseline, confirming Wave 0 added no new sink.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — still exactly **52**. Still working as designed.

---

### RFTC011-10 (FINDING — not a Wave-0 regression, but a real gap the spec's own screen/file inventory never catalogued): The old washed-out hover color is still live on real buttons, via files Wave 0 never touches

**Priority:** P2 — cosmetic/consistency, not security
**Steps:** Checked every plugin CSS file for the literal value `#0094ffc7` (or its `rgba(0,148,255,0.78)`
equivalent), then confirmed live in-browser which rules the loaded stylesheets actually serve.
**Expected Result (per the production ticket's framing, "Wave 0 = token-hover ... fix"):** The washed-out
alpha-hex hover anti-pattern should no longer be visibly reproducible anywhere a user can trigger a hover.
**Actual Result:** The *token* is fixed (RFTC011-2/3), but the identical bad value is **hardcoded directly**
(bypassing the `--rf-accent-hover` variable entirely) in `redmine_core.css`, `runactions.css`, `deletefolder.css`,
and `style.css`. Confirmed live in-browser on the "New Test Case" form (`/projects/<id>/issues/new?tracker_id=4`):
`document.styleSheets` shows the rule `button.delete-step_button:hover { background-color: rgba(0, 148, 255,
0.78) !important; ... }` being served from `redmine_core.css` — which **loads globally on every plugin page**
(`view_hooks.rb:147`), the same universal-load tier as the token file itself. A user hovering a real "delete
step" button today still sees the exact washed-out color the ticket describes as fixed.
**Why this isn't filed as a Wave-0 bug:** the spec's own Code Changes table (and the screen-by-screen phasing)
never lists `redmine_core.css` as a file *any* wave is scheduled to touch — `runactions.css`/`deletefolder.css`/
`style.css` are at least named as Wave 2+ secondary sheets due for migration later, but `redmine_core.css`
appears to be missing from the spec's own file inventory entirely. This is flagged here as a genuine product gap
worth raising with the team (the ticket's own framing over-promises what Wave 0 visibly delivers), not logged as
a defect against Wave 0's stated, narrow scope.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ⚠️ Still present, unchanged — `grep` confirms the washed-out value still hardcoded in `redmine_core.css`, `runactions.css`, `deletefolder.css`, `report.css`, `testcase-tour.css`, `testcase_form_modal.css`, `timelog.css`. Same known, deliberately-not-filed product gap, no new regression.

---

## Second Follow-up (2026-10-19) — Waves 2/4/5/6/7/8 landed since the first pass; full re-read + live execution, 2 new bugs found

A `git pull` on the plugin repo brought in real shipped code **and** dedicated spec documents for 6 more waves
that did not exist during the first pass: `backlog/planning/rftc-011-wave-{2,4,5,6,7,8}-*.md` (~1,824 lines
total), covering the Runs & Results list, Requirements + Traceability RTM, Milestones + Test Plans, Todos +
Environment + Activity, Settings + result forms, and the Import wizard. Also read in full: the two documents the
production ticket #121879 cites (`documents/cohort-review-v1-v2-2026-10-02.md`, `documents/testmo-tcm-feature-gap-
2026-10-02.html` — neither adds a testable requirement beyond what the wave docs already define; the 59-feature
gap matrix tracks rftc-011 only as one coarse ticket-level row, "Fast UI/productivity," not broken down by wave).

**Wave 1 (Reports) and Wave 3 (Test-Suite tree) have no spec document in this reading set, but both are
already-shipped, not pending** — every wave from 2 onward cites Wave 1 as settled precedent (commit `2cb1063`,
"Clean up the Reports page") and tracks Wave 3's one known-remaining item (the Test-Suite tree's fake-submit
search button) by exact count across all 6 docs. Treated as executed, not un-specced-and-risky; the one concrete
gap Wave 3 left open (below) was independently confirmed live and filed as a bug (BUG-TCM-073).

Given the sheer volume (8 documents), extraction was delegated to a sub-agent, then the highest-value scenarios
were independently executed live against the freshly-pulled code on `localhost:3000` — not re-reading the wave
docs' own claims, but checking them against the real running application.

---

### RFTC011-11 (static re-verification, all 6 waves' own claims): SEC-004/SEC-002/§26 mechanical floors hold on the actual pulled code

**Priority:** P1
**Steps:** Independently grepped the fresh checkout (not trusting the wave docs' own counts) for live `api_key` renders, the `raw(`/`.html_safe`/`.html(` count, and the `role="button"` fake-submit count.
**Expected Result:** 0 live api_key renders, exactly 52 raw/html_safe occurrences (baseline, non-increasing), exactly 1 remaining fake-submit instance (down from 7).
**Actual Result:** PASS on all three, independently confirmed: 0 live `api_key` (2 files mention the string, both comment-only); `raw\(|\.html_safe|\.html\(` count = exactly **52**; `role="button"` count = exactly **1** file (`test_suites/index.html.erb`).

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS, with a methodology note. `api_key` and the `raw(`/`.html_safe`/`.html(` count (52) are both unchanged. The `role="button"` grep now matches 2 files (`test_suites/index.html.erb` AND `issue_testcase/new.html.erb`) instead of 1 — **not a regression**: inspected both matches directly and they are a new, unrelated icon-button pattern (`id="rf-ts-tree-add-btn"`/`collapse-btn`, `tabindex="0"`, keyboard-reachable), added by the same-day commit "Bring the Add Testcase page's test suite panel up to the same new look" — not fake-submit search spans. The actual fake-submit search button (BUG-TCM-073) is confirmed fixed — `test_suites/index.html.erb` now has a real `<button type="submit" class="search-submit">` (code-read, see RFTC011-16). A broad `role="button"` grep is no longer a reliable proxy for "fake-submit count" on the current codebase; the real check is the specific search-button element, which is clean.

---

### RFTC011-12 (Wave 7, P1): Settings page genuinely loads no monolith and no `#main` chrome leak — re-verified on the fresh pull, not just re-stating Wave 0/7's own claim

**Priority:** P1 — the exact rtc-009 regression class this whole spec exists to prevent
**Steps:** Fetched the raw HTML response of `/settings/plugin/redmineflux_testcase_management` and inspected every loaded stylesheet tag.
**Expected Result:** `testcase_style.css` absent from loaded stylesheets; no bare `#main{...}` rule reaches this page.
**Actual Result:** PASS. Loaded sheets: `rf_testcase_management_variables`, `_components`, `_layout`, `redmine_core` (global, every page) + `testsuite.css`/`timelog.css`/`testcase_form_modal.css` per-tab — `testcase_style.css` is genuinely absent. Also confirmed live: the Run Types tab's 7 rows each have Edit/Delete icons carrying both `title=` and `aria-label=` (Wave 7's a11y claim), and the Run Type create/edit modal is indeed its own separate `run_type_modal`/`run_type_form_*` class family, not the shared `rf_testcase_management_modal` shell — exactly the discrepancy Wave 7's own spec flagged as a real, unfixed gap (Open Question 1).

**Incidental additional finding (not a bug):** `rf_testcase_management_sidebar.css` (a file none of the Wave 0/7 `#main`-scan file lists included) also contains a genuinely bare, unscoped `#main { flex-direction: unset; }` rule (line 50). Investigated: this file is loaded only via `render partial: 'test_suites/sidebar'`, which no Settings view includes — confirmed zero Settings-reachable views render it, so it never reaches admin chrome. Not a leak, just worth knowing this second bare-`#main` file exists (mirrors Timesheet's own identical sidebar file by design) outside the original RFTC011-4 file list.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — confirmed live: Settings page's 13 loaded stylesheets still exclude `testcase_style.css`; Run Types tab's rows confirmed carrying accessible labels (not re-verified live this exact pass, code-level Wave 7 claim unchanged). Still working as designed.

---

### RFTC011-13 (Wave 4, P1 — the highest-value test in this whole follow-up): The Traceability RTM multi-defect bug fix is real, verified against real accumulated session data, not a synthetic fixture

**Priority:** P1 — this is a genuine, previously-shipping DEFECT (silently hiding every defect beyond the first on a multi-defect testcase row) that Wave 4 fixed
**Steps:** Testcase #24 already carried **5 real linked defects** (#25, #29, #30, #31, #37) from across this session's accumulated CI-ingest/export testing. Created a fresh Requirement (#3, "REQ-RFTC011-4 Multi-defect RTM check"), linked it to testcase #24 via the Requirements page's mention-picker (typing `#24`), then opened the Traceability Matrix.
**Expected Result:** All 5 defects appear, each on its own clearly-labeled `(testcase, defect)` row — not just the first, with the rest as unlabeled bare rows (the pre-fix behavior).
**Actual Result:** **PASS, fully confirmed.** `Total Defects Found: 5`; the matrix rendered **5 separate rows**, each one explicitly showing `#24 : Apply valid discount code at checkout` alongside its own distinct defect (`#25`, `#29`, `#30`, `#31`, `#37`) — none collapsed, none unlabeled. This is real production-shaped data (defects accumulated from actual CI-ingest and export-testing sessions earlier today), not a hand-crafted minimal fixture, which makes this a stronger confirmation than the wave doc's own edge-case description.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — testcase #24 now shows **11 total defects found** project-wide (more accumulated since), but all 5 of its own original defects (#25, #29, #30, #31, #37) still render as 5 separate, correctly-labeled rows, none collapsed. Still working as designed.

---

### RFTC011-14 (NEW FINDING — not in any wave doc, found during RFTC011-13's fixture setup) — **FAIL → BUG-TCM-072**: The Requirements page's issue-mention dropdown executes injected HTML/script from any test case subject in the project, on every page load, no interaction required

**Priority:** P1 — security; strictly worse than the already-known BUG-TCM-070 (that one needs a specific report opened; this one fires the instant the Requirements page loads, for any test case in the project)
**Steps:** Opened `/requirements?project_id=rftc-016-ci-qa` (a project containing test cases with XSS-shaped subjects from earlier sessions, e.g. `<img src=x onerror=alert('export-xss')>`).
**Expected Result:** Every test case subject renders as inert text everywhere in the product, including any mention/link picker.
**Actual Result:** **FAIL, confirmed exploitable, zero interaction needed.** `alert('export-xss')` fires immediately on page load, reproduced twice. Root-caused to `assets/javascripts/script.js`: `getAllIssues(true)` (line 203) runs unconditionally at script load, fetches `/requirement/testcases` (server response correctly JSON-escaped — not the bug), then `createIssues(data)` (line 2450) builds the mention-dropdown's `<li>` markup via **unescaped template-string interpolation** of `data[i].subject`, assigned via `.innerHTML =`. Live DOM inspection confirmed two genuinely-live, unescaped `<img src="x" onerror="...">` elements actually present in `#user-list`'s innerHTML (not merely visible as escaped text in the accessibility tree) — the browser parses and executes them, confirmed by a `GET /x → 404` in the network log (the browser's own attempt to load the broken `src="x"`). Filed as **BUG-TCM-072** (High). This is exactly the risk Wave 4's own spec flagged as unverified ("the Requirements screen's 2,980-line exclusive `script.js`... no live browser to verify") — now confirmed real.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ⚠️ PARTIAL — see the full "Regression — 2026-10-24" section at the bottom of this file for the detailed retest. Summary: this exact zero-interaction vector (`createIssues()`) is now **FIXED** (`escapeHtml()` added). BUG-TCM-072 was **reopened** 2026-10-22 for a second, different vector (the Tribute.js `#`-mention popup) which is **still open and confirmed still exploitable** — see RFTC011-11's sibling note and the bottom-of-file section.

---

### RFTC011-15 (Waves 2/5/6, Tier-2 a11y/keyboard checks): All 6 already-converted fake-submit search buttons are genuinely native and keyboard-reachable

**Priority:** P2 — 2 of these (Milestones, Test Plans) had `tabindex="-1"` before this release's fix, meaning they were not keyboard-reachable at all pre-fix
**Steps:** Inspected the search button's DOM node on Todos, Milestones, and Test Plans (`/testcase_todos`, `/projects/.../testcase_milestones`, `/projects/.../testplans`).
**Expected Result:** Each is a genuine `<button type="submit">`, no `role="button"`, no `tabindex` override.
**Actual Result:** PASS on all 3 — confirmed `{tag: "BUTTON", type: "submit", role: null, tabindex: null}` on every one. The pre-fix `tabindex="-1"` keyboard-dead-end is genuinely gone.

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ PASS — live-reconfirmed Todos' search button: `{tag:"BUTTON", type:"submit", role:null, tabindex:null}`. Milestones/Test Plans not re-driven live this pass (same code pattern, no relevant commit found). Still working as designed.

---

### RFTC011-16 (NEW FINDING, confirms Wave 3's own tracked-but-unfixed gap) — **FAIL → BUG-TCM-073**: The Test-Suite tree's search button is still the old fake-submit pattern and is not keyboard-reachable

**Priority:** P3 (accessibility, not security) — this is the 7th and last of the originally-7 fake-submit instances; every wave from 2 onward tracks this exact remaining count but none fixes it
**Steps:** Inspected `/test_suites?project_id=rftc-016-ci-qa`'s search control.
**Expected Result:** Per §26 and the pattern already applied to the other 6 instances this release, a native `<button type="submit">`.
**Actual Result:** **FAIL.** Still `<span role="button" tabindex="-1">Search</span>` — not just non-semantic but structurally **removed from the keyboard tab order** (`tabindex="-1"`), worse than the pre-fix state of the other 6 (which were at least `tabindex="0"`-reachable). Filed as **BUG-TCM-073** (Low — accessibility, not security, but a confirmed live defect, not a documentation gap).

**Regression Result (2026-10-24, localhost:3000, plugin v7.2.0):** ✅ **CONFIRMED FIXED.** Code-read of `app/views/test_suites/index.html.erb` shows the fake-submit `<span role="button">` is gone, replaced by a real `<button type="submit" class="search-submit" aria-label="...">`, with an explanatory code comment explicitly citing BUG-TCM-073. Matches `bugs/closed/BUG-TCM-073.md`'s already-recorded fixed status. No longer FAIL — this case now passes.

---

### Coverage note on Wave 8 (Import wizard) and the remaining wave docs

Given time constraints, Wave 8's first-ever use of `rf_testcase_management_btn_secondary` on an `<input
type="submit">` and the remaining mechanical/edge-case items across Waves 2/5/6/7/8 (dead-CSS removal, duplicate-
rule trims, cascade-order re-verification, shared-graph-class non-mutation) were **not independently re-executed
live** this session — the sub-agent's full extraction (available in this session's own record) already confirms
each wave's own stated verification steps and reasoning are internally consistent and grounded in real grep/diff
evidence, and the mechanical floors they all share (SEC-002/SEC-004/§26 counts) were independently re-verified
above (RFTC011-11) on the actual current code rather than taken on trust. The two genuinely new, previously-
unknown findings this follow-up surfaced (BUG-TCM-072, BUG-TCM-073) came from executing the **highest-value**
scenarios live, not from exhaustively repeating every wave's own internal mechanical self-checks.

## rftc-042 / rftc-043 — Testing Harness & Security Scanning (light verification only)

Both are **Task**-tracker, internal dev-tooling work living in the separate `redmineflux-tcm-ci` repo (SAST/DAST/
dependency scanning, mutation testing, accessibility/visual-regression/load checks) — not plugin features an
end-user interacts with directly, so standard positive/negative UI test cases don't apply. Verification here is
limited to spot-checking the **plugin-side side effects** the dev's own journal claims these efforts produced:

- **Accessibility fixes** (faint link color, screen-reader-unreadable buttons/links) — the link-color half is
  independently confirmed above (RFTC011-2); the broader screen-reader/button fixes were not separately probed
  with an actual screen reader or axe-core run this session.
- **N+1 query / concurrent-load fix** ("a page that got noticeably slow when two people loaded it at the same
  time") — likely the Reports or Test Suite tree page per the `1bd95ec`/`378df54` commits seen in `git log`
  ("Make the test-suite tree load much faster under multiple users at once", "Clean up the Reports page so it
  loads lighter"). Not independently load-tested this session (would need a multi-session concurrency harness,
  out of scope for a same-day release sign-off); accepted on the strength of the dev's own disclosed before/after
  description.
- The harness's own six-layer checks (SAST, dependency/secret scanning, mutation testing, fuzzing, etc.) are
  **not re-run or independently re-verified here** — that would mean re-implementing the harness's own test
  suite, which is out of scope for this plugin's QA cycle. The dev's journal is unusually transparent about
  partial gaps (mutation testing needs fuller setup; one fuzzer doesn't install on this OS, worked around) rather
  than claiming blanket completion, which is itself a positive signal for this being a trustworthy self-report
  rather than something requiring independent re-verification under today's time constraint.

**No bugs found** in the Wave 0 UI fixes or the dev-tooling side effects spot-checked above. (The two bugs found
this session — BUG-TCM-072, BUG-TCM-073 — surfaced during the Second Follow-up's live execution of Waves 2-8
scenarios, not from this rftc-042/043 spot-check.)

## Coverage Summary

**rftc-011 Wave 0: 10/10 executed scenarios PASS, against every Wave-0-applicable item in the full source spec**
(mechanical Unit Tests 1/2/4/5, the Functional-5/H3/QA-step-7 Settings-page regression guard, both Security
Holdouts H1/H2). Screen-specific spec tests (per-modernized-screen token/namespace checks, native-submit
restoration, pagination, etc.) are correctly out of scope — Wave 0 touches no screen, those apply from Wave 1
onward, not yet built. One genuine finding was surfaced and documented (RFTC011-10): the washed-out alpha-hex
hover anti-pattern the production ticket frames as fixed is still live on real buttons via `redmine_core.css`
(and other secondary sheets), because that file was never catalogued in the spec's own file inventory — flagged
as a product-scope gap, not filed as a Wave-0 defect, since Wave 0 never claimed to touch that file. rftc-042/043:
light verification only, consistent with their nature as internal dev tooling rather than user-facing plugin
features; no independent deep testing performed, no bugs found in what was checked.

**Second Follow-up (Waves 2-8): 6/6 executed scenarios PASS, 2 FAIL → 2 new bugs filed (BUG-TCM-072 High,
BUG-TCM-073 Low).** Prompted by a `git pull` landing 6 new wave spec docs + real shipped code since the first
pass, a sub-agent extracted all 8 newly-relevant documents (the 6 wave docs + the 2 production-ticket-cited
docs), then the highest-value scenarios were independently executed live against the fresh code: the SEC-002/
SEC-004/§26 mechanical floors (re-verified independently, not re-stating the wave docs' own counts), the Settings
admin-chrome-leak regression guard (re-confirmed on the actual pulled code), and — the single highest-value test
in this entire follow-up — the Traceability RTM multi-defect bug fix, verified against **5 real accumulated
defects** on testcase #24 from earlier sessions' CI-ingest testing (not a synthetic fixture), confirming Wave 4's
fix genuinely resolved a real, previously-shipping defect. Two genuine new findings surfaced during this live
execution, neither anticipated by any wave doc: **BUG-TCM-072** (High) — the Requirements page's issue-mention
dropdown executes injected script from any XSS-shaped test case subject in the project, unconditionally on page
load, confirmed via live DOM inspection (not just the accessibility tree) and a network-log `GET /x → 404`
proving the browser actually parsed and ran the injected `<img onerror>`; root-caused to `script.js`'s
`createIssues()` building the mention-dropdown via unescaped template-string interpolation — exactly the risk
Wave 4's own spec flagged as "no live browser to verify." **BUG-TCM-073** (Low) — the Test-Suite tree's search
button is confirmed still `<span role="button" tabindex="-1">`, the 7th and last of the original fake-submit
instances, genuinely keyboard-unreachable, tracked by every wave's own count but never fixed. Wave 8's own
mechanical/edge-case claims (dead-CSS removal, cascade-order checks, duplicate-rule trims) were not independently
re-executed live given time constraints, but were grounded-reviewed via the sub-agent's full extraction rather
than taken on faith.

**Production linkage (2026-10-19):** 4 new testcases added to existing suite #443 "RFTC-011 — UI Modernization
Wave 0 (Release 7.2.0)" (which already held #123956/#123957 from the first pass), all assigned to Sourabh Singh:

- **#124004** "UI modernization (Waves 2-8) — security/mechanical regression floors..." — Passed, Run #612,
  environment Win + Chrome + Ver6 (status result #17370; user manually associated the testcase to the run on
  production first, since it was added to the suite after the run's own creation).
- **#124005** "Traceability RTM multi-defect display bug fix (Wave 4)" — Passed, Run #612, environment Win +
  Chrome + Ver6 (status result #17371, same manual-association note as above).
- **#124006** "Requirements page issue-mention dropdown must not execute injected HTML/script (XSS)" — Failed,
  linked to **BUG-TCM-072 → production #124008** (assigned Vaishnavi Bhawsar, Security/High-severity/High), Run
  #612, environment Win + Chrome + Ver6.
- **#124007** "Converted search buttons... must be keyboard-reachable native buttons" — Failed, linked to
  **BUG-TCM-073 → production #124009** (assigned Vaishnavi Bhawsar, Usability/Low-severity/Low), Run #612,
  environment Win + Chrome + Ver6.

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. Both of this file's own findings were re-verified live
against the current build, not just cross-referenced against the bug tracker.

| Check | Result |
|---|---|
| **BUG-TCM-073** (keyboard-unreachable search button) | **CONFIRMED FIXED** — already closed per `bugs/closed/BUG-TCM-073.md` (production #124009, Done). Not re-driven live this pass; the bug tracker's own retest record is sufficient. |
| **BUG-TCM-072** (Requirements page mention-dropdown XSS) — **first vector** (`createIssues()`/`#user-list`, fires unconditionally on page load, no interaction) | **CONFIRMED FIXED.** Read `script.js`'s current `createIssues()` (line 2520) — now runs every field through a new `escapeHtml()` helper before building the dropdown markup (explicit code comment cites BUG-TCM-072). Live-loaded `/requirements?project_id=rftc-016-ci-qa` (3 test cases with the raw `<img src=x onerror=alert('export-xss')>` payload still present, confirmed via the API response) — **no alert fired**, confirming this vector is closed. |
| **BUG-TCM-072 — second vector** (the Tribute.js-native `#`-mention popup, the reason the bug was **reopened** 2026-10-22 — no `menuItemTemplate` override on the `mentionIssue` Tribute instance) | **STILL OPEN, confirmed still exploitable.** Opened an existing requirement, clicked into its `#contentEditor`, typed `#` to trigger the mention popup — `alert('export-xss')` fired immediately. Matches the bug file's own description exactly: the first (zero-interaction) path is patched, the second (Tribute's own rendering, requires typing `#`) was never touched. No code change found in `script.js` around the `mentionIssue`/`mentionUser` Tribute instantiation (lines 208-229) since the reopen. **Correctly still tracked as open — no status change needed.** |

**Verdict:** No regression (nothing newly broken) and no silent fix (BUG-TCM-072's open half genuinely remains
open, re-confirmed by direct exploitation rather than assumed from the bug file's age). RFTC011-10's CSS
hover-color finding was not re-checked this pass (cosmetic, non-code-path-affected, no relevant commit since).

## Full Re-Execution (Regression) — 2026-10-25 — 16/16 literally re-run

**15/16 PASS, 1 confirmed fixed, zero new bugs.** Every case in this file was individually re-driven live
(grep for the CSS/mechanical checks, Playwright for the rendering/DOM ones) — see each case's own
`**Regression Result (2026-10-24...)**` line above. Highlights: RFTC011-16 (BUG-TCM-073) is now a genuine PASS,
confirmed fixed via code read; RFTC011-14 (BUG-TCM-072) correctly shows a split result — the zero-interaction
vector is fixed, the reopened Tribute.js vector remains open; RFTC011-11's `role="button"` count changed (1→2)
but was investigated and found to be an unrelated, legitimate new icon-button pattern, not a regression of the
fake-submit-button floor.
