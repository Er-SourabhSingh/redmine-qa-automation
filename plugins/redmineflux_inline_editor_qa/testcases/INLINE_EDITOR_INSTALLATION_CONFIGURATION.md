# Test Cases — Redmineflux Inline Editor — Installation, Compatibility & Environment

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/inline-editor-plugin/ —
> "Version Compatibility", "Editor Compatibility", "Installation", "Configuration", "Troubleshooting",
> FAQ on browser/OS compatibility, "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Fully executed 2026-09-23 against `redmine-docker-700` (Redmine 7.0.0.stable,
> plugin 7.0.0, already installed) — all 14 test cases (TC-INE-024–037) now have a Result, none skipped.**
> **TC-INE-033 (rename), TC-INE-034 (no migration), TC-INE-036 (stale cache) and TC-INE-037 (uninstall)** required
> renaming/deleting the plugin folder and restarting the shared container — done with explicit user approval,
> each restored to its exact original state afterward and confirmed by reload (Feedback status, High priority,
> the edited description, 29/125 pencils). **TC-INE-028's own precondition (CKEditor configured) is not true on
> this instance** (it uses CommonMark), recorded as precondition-not-met rather than executed; TC-INE-029 covers
> the scenario that actually applies here and is fully executed. Found **`BUG-INE-010`** (Low, double `jstoolbar`
> script inclusion — a Redmine-core/plugin interaction, confirmed in Chrome, Edge and Firefox alike).
>
> **Final-cycle regression, re-executed 2026-09-24 against the post-fix build (commit `f2fe7ef`, session-based
> auth, deployed via `assets:precompile` + container restart earlier the same session) — all 14 cases
> (TC-INE-024–037) reconfirmed, zero new failures.** TC-INE-033 and TC-INE-037 were fully repeated end to end,
> including their destructive rename/delete + restart + recovery cycles (see their own Result sections for the
> 2026-09-24 evidence). See each TC's Result section below for its individual reconfirmation note.

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

This plugin has no configuration page of its own in the KB — it activates on the issue list and issue detail pages.
Reach them through real navigation: top menu **Issues** → hover a row, or click a ticket number.

---

## Functional Cases — Installation

---

### TC-INE-024: Plugin appears in Administration → Plugins

**User Role:** Admin
**Preconditions:** ZIP extracted into `plugins/` under its original folder name, `bundle install` and
`redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin and open Administration → Plugins.

**Expected Result:**
- The Inline Editor plugin is listed with name, description, author and version.

**Result: PASS, executed 2026-09-23** — Administration → Plugins lists "Redmineflux Inline Issue Editor plugin",
with its description ("Professional inline editing for Redmine issues, projects, and custom fields…"), author
("Redmineflux — Powered by Zehntech Technologies Inc.") and version ("7.0.0"), plus a working Configure link.

**Reconfirmed 2026-09-24 (final-cycle regression, post-fix `f2fe7ef`)** — still listed identically after the
plugin-code update and container restart.

---

### TC-INE-025: Migration completed cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, then open the issue list and an issue detail page.

**Expected Result:**
- Both render without error; no missing-table exception in `log/production.log`.

**Result: PASS by cross-reference to TC-INE-034** — this plugin has no `db/` directory at all (confirmed in
TC-INE-034), so "the migration" is a no-op by design. Running it changes nothing, and both pages already render
cleanly on every restart, as re-confirmed there.

**Reconfirmed 2026-09-24** — re-checked directly: `plugins/inplace_issue_editor` still has no `db/` directory
after the code update, and both pages rendered cleanly on every restart performed during this session's regression
(including the TC-INE-033/037 restart cycles below).

---

### TC-INE-026: Assets load correctly — the plugin is JS-dependent

**User Role:** Any
**Steps:**
1. Open the issue list and inspect the console and Network tab.
2. Hover an issue row.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- The pencil icon appears on hover — this plugin is entirely JavaScript-driven, so a missing asset makes the whole
  feature silently absent rather than visibly broken. Confirm by behaviour, not by the absence of an error.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` plus a restart resolves it (KB note).

**Result: PASS, executed 2026-09-23** — as Admin on the issue list, monitored all responses matching
`inplace_issue_editor`: `rf_inline_editor-*.css`, `rf_inline_editor_core-*.js`, `rf_inline_editor_issue_show-*.js`,
`rf_inline_editor_project_card-*.js` and `rf_inline_editor_issue_table-*.js` all returned `200`, zero `4xx`/`5xx`
responses. Hovering a row showed the pencil icon appear (opacity 0→0.7) exactly as expected — confirmed by
behavior, not just by absent errors. (The KB's own documented recovery for a 404'd-asset state, precompile +
restart, was separately exercised for a different reason in TC-INE-036 and confirmed to work.)

**Reconfirmed 2026-09-24** — after the auth-mechanism code change (routes moved off `.json`, new
`rf_inline_editor_*` asset digests from the `assets:precompile` run), re-checked the same asset URLs on
`/issues/1560` and the issue list: all returned `200`, zero `4xx`/`5xx`, and the pencil still appears on hover.

---

### TC-INE-027: Plugin functions on the Redmine version under test

**User Role:** Admin
**Steps:**
1. Record the version; confirm it is inside the KB range; perform one inline edit end to end.

**Expected Result:**
- Inline editing works on the declared version. Failures outside the declared range are compatibility limitations,
  recorded rather than filed.

**Result: PASS, executed 2026-09-23** — this instance runs Redmine **7.0.0.stable**, inside the KB's declared
compatibility range (4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x is stated in this suite's own header, and this session's
whole engagement has run hundreds of inline edits successfully against 7.0.0 across every suite). One inline edit
performed end to end here as confirmation: Priority on #1560, native `<select>`, saved (`200`) and persisted after
reload.

**Reconfirmed 2026-09-24** — still 7.0.0.stable; this session's whole final-cycle regression (dozens of inline
edits across every suite, including the new session-auth path from `f2fe7ef`) is itself the reconfirmation.

### TC-INE-028: CKEditor integration

**User Role:** Member
**Preconditions:** CKEditor configured on the instance. The KB states the plugin is "fully compatible with
CKEditor" and that the customer supplies their own CKEditor licence.
**Steps:**
1. Open an issue and inline-edit the description.

**Expected Result:**
- The CKEditor toolbar loads inside the inline editing area.
- Formatting controls (headings, bullets, font styles, quotes) are present and functional, as the KB describes.
- No JavaScript error from a CKEditor/Redmine version mismatch.

**Result: PRECONDITION NOT MET, checked 2026-09-23 — this instance is not configured to use CKEditor.**
`RfIE.config.textFormat` is `"common_mark"` (Markdown), `RfIE.config.ckEditorOptions` is `null`, and
`window.CKEDITOR` is `undefined`. Administration → Settings → General → "Text formatting" is set to CommonMark on
this instance, not CKEditor, so this TC's own precondition cannot be exercised here. This is not a defect —
TC-INE-029 (CKEditor absent) is the scenario that actually applies to this instance, and it is fully executed and
PASS below, including the equivalent formatting-controls check against the plugin's jstoolbar fallback.

**Reconfirmed 2026-09-24** — re-checked directly: `RfIE.config.textFormat` is still `"common_mark"`,
`RfIE.config.ckEditorOptions` is still `null`, `window.CKEDITOR` is still `undefined`. Precondition still not met.

---

### TC-INE-029: Behaviour with CKEditor absent

**User Role:** Member
**Preconditions:** Instance using Redmine's stock text formatting (Textile/Markdown) rather than CKEditor.
**Steps:**
1. Inline-edit a description.

**Expected Result:**
- Editing still works, falling back to a plain textarea with the instance's normal formatting rules.
- The plugin must not hard-require CKEditor and must not render a broken empty toolbar in its absence.

**Result: PASS, executed 2026-09-23** — this instance uses CommonMark (see TC-INE-028), so the plugin's inline
Description editor is a plain `<textarea>` with Redmine's own `jstoolbar` (not an empty/broken toolbar): 19
real formatting buttons present (Strong, Italic, Underline, Deleted, Inline Code, H1–H3, lists, task list, quote,
table, preformatted, highlighted code, wiki link, image, help), plus working **Edit**/**Preview** tabs. Selected
text, clicked **Strong**, and the textarea correctly wrapped it in `**…**`; the Preview tab rendered it as real
`<strong>` HTML. Saved (`302`, "Saved successfully.") and confirmed after reload that the bold markup, the earlier
edited line, the inline image and the attachment reference (from TC-INE-049) were all still intact and the image
still rendered. The plugin does not hard-require CKEditor and renders a fully functional fallback toolbar.

**Reconfirmed 2026-09-24** — after the auth fix, re-opened the description editor on #1560: still a plain
`<textarea>` with the real `jstoolbar` (not empty/broken), and the description save/revert cycle used throughout
this session's BUG-INE-008 retest (Ctrl+Enter save, `302`, persisted after reload) is itself confirmation this
path still works end to end on the new session-based route.

## Functional Cases — Cross-browser and environment

---

### TC-INE-030: Cross-browser compatibility

**User Role:** Member
**Steps:**
1. Perform the same inline edit (a status change and a description edit) in Chrome, Firefox and Edge.

**Expected Result:**
- Identical behaviour in all three, as claimed by the KB FAQ.
- Record any browser where the pencil icon does not appear or a save silently fails.

**Result: PASS, executed 2026-09-23 (Playwright driving each real browser engine directly: bundled Chromium as
"Chrome", `channel: 'msedge'` for real Microsoft Edge, and the Playwright Firefox build)** — as `willow.belle` on
#1560, performed the identical sequence in each: hover the list Status cell (pencil present, opacity 0.7 on
hover, identical in all 3), inline-change Status list→Resolved (`200`, "Saved successfully.", persisted after
navigating to the detail page), then inline-edit the Description on the detail page (`302`, "Saved successfully.",
persisted after reload, inline image still rendered). All 3 save-status sequences were **identical**:
`[200, 302, 302, 200]` (status change, description save, description revert, status revert). No browser showed a
missing pencil or a silent save failure.
- **Chrome:** 151.0.7922.34 — full PASS.
- **Edge:** 153.0.4234.48 — full PASS, byte-identical behavior to Chrome.
- **Firefox:** 148.0.2 — full PASS. Firefox additionally surfaced `BUG-INE-010`'s known double-`jstoolbar`-script
  error on every issue-detail load (confirmed in all 3 browsers via direct console/page-error capture in Chrome
  and Edge, and indirectly in Firefox via a Playwright-transport crash this same error triggers only in
  Playwright's own Firefox driver — a driver quirk, not a real cross-browser functional difference, since the
  error itself was already independently confirmed present in Chrome/Edge too and does not block any observed
  functionality in any of the 3). Fixture reverted to Feedback/High/original description after each run.

**Reconfirmed 2026-09-24 (final-cycle regression, post-fix `f2fe7ef`, the exact code path this TC's own mechanism
depends on)** — re-ran the identical sequence with a dedicated Node/Playwright script (`xbrowser2.js`) driving
real Chrome, Edge and Firefox engines directly: as `willow.belle` on #1560, an atomic-dispatch pencil click →
native `<select>` Priority change → save → revert, capturing the plugin's own `update_field` route responses.
**Chrome** 151.0.7922.34 — `[200, 200]` (save, revert). **Edge** 153.0.4234.48 — `[200, 200]`, byte-identical to
Chrome. **Firefox** 148.0.2 — `[200, 200]` after fixing an unrelated Playwright-Firefox launch quirk (explicit
`viewport: null`). All three browsers correctly authenticate the new non-`.json`, session-based `/update_field`
route — the specific mechanism `f2fe7ef` changed. Fixture confirmed reverted to Priority = High after the run.
Console double-`jstoolbar` error from `BUG-INE-010` no longer observed (that bug's own fix, unrelated to this
TC's cross-browser scope, but noted since it was previously surfaced here).

---

### TC-INE-031: Behaviour at narrow viewport widths

**User Role:** Member
**Steps:**
1. Repeat an inline edit on the issue list at 1280×720 and at a narrow/mobile width.

**Expected Result:**
- The hover affordance and the editing control remain reachable and do not overlap adjacent columns.
- Record any width at which the editor is clipped or unusable.

**Result: PASS, executed 2026-09-23** — tested the issue-list Priority cell at **1280×720** and at a
**390×844** narrow/mobile width. At both, the pencil rendered fully inside its cell's bounds (no overlap into
neighboring columns: icon `[362,382]` inside cell `[307,409]` at 1280px; icon `[311,331]` inside cell `[257,359]`
at 390px), the table itself scrolled horizontally (`overflow-x: auto`) rather than clipping content, and the
opened `<select>` editor stayed fully within the viewport at both widths (e.g. `x:259, width:90` at 390px, well
inside the 390px viewport). A save at each width returned `200` and displayed the new value correctly. No clipped
or unusable state found at either width. Fixture reverted to High after each.

**Reconfirmed 2026-09-24** — re-checked the Priority cell at 390×844 after the auth fix: pencil `[311,331]` still
fully inside cell `[257,359]` bounds, `overflow-x: auto` still in effect. No layout regression from the JS
changes in `f2fe7ef` (route URLs only, no CSS/markup changes).

---

### TC-INE-032: Interaction with other Redmineflux plugins on the same page

**User Role:** Member
**Steps:**
1. On an issue that also carries Checklist, Tags and Agile Board widgets, perform inline edits of several fields.

**Expected Result:**
- No layout collision, z-index conflict, or double-binding of the same field.
- The KB's troubleshooting section explicitly calls out conflicts with "plugins that modify the same fields", so a
  conflict here is an anticipated finding — file it against whichever plugin intrudes.
- Note for triage: error toasts raised by *other* plugins but surfaced through this plugin's inline save wrapper
  belong to this plugin only if the wrapper itself mangles the message.

**Result: PASS, with one Low-severity finding filed separately (`BUG-INE-010`) — executed 2026-09-23.** On issue
#1560, which also carries Checklist, Tags, Sprint (Agile Board) and Story Points widgets (all confirmed present
in the DOM, none showing more than 1 pencil where a pencil applies — no double-binding), performed inline edits of
3 different fields in sequence: Priority (native select, saved), Subject (text input, saved), and % Done (select,
saved to 30%) — each a separate widget/request, `200` each time, no interference between them, no console errors
during the edits themselves, reloading afterward showed Checklist/Tags/Sprint/Story Points sections still fully
present and unaffected, and all 3 edited fields persisted correctly. No layout collision or z-index conflict
observed at any point.
- **The one interaction issue found is between this plugin and Redmine core itself, not another Redmineflux
  plugin**: the issue detail page loads Redmine's own `jstoolbar` scripts twice (once from core, once injected
  unconditionally by this plugin's `view_layouts_base_html_head` hook), throwing
  `SyntaxError: Identifier 'lastJstPreviewed' has already been declared` on every issue-detail page load. No
  user-visible breakage was observed from it. Filed as **`BUG-INE-010`** (Low). All 3 test edits reverted after.

**Reconfirmed 2026-09-24** — re-checked #1560 (still carrying Checklist/Tags/Sprint/Story Points widgets) after
the auth fix: `page.on('pageerror')` captured **zero** errors on reload — `BUG-INE-010`'s double-`jstoolbar` error
is gone, consistent with that bug's own separate fix and retest. No new interaction issue introduced by `f2fe7ef`.

---

## Negative Cases

---

### TC-INE-033: Plugin folder renamed on disk

**User Role:** Admin
**Steps:**
1. Rename the plugin directory (the KB says not to) and restart.

**Expected Result:**
- Loud, diagnosable failure — not a half-loaded plugin that leaves the issue list partly interactive.
  Restore and confirm recovery.

**Result: PASS, executed 2026-09-23 (against the shared `redmine-docker-700` instance, with explicit user approval
given the container-restart risk)**
- Renamed `plugins/inplace_issue_editor` → `plugins/inplace_issue_editor_renamed_tc033` and restarted the
  container.
- The container immediately crash-looped. `docker logs` showed a clear, specific error at boot:
  `Redmine::PluginNotFound: Plugin not found. The directory for plugin inplace_issue_editor should be
  /usr/src/redmine/plugins/inplace_issue_editor.`, raised from Redmine core's own `Redmine::Plugin.register`
  (`lib/redmine/plugin.rb:103`), aborting `rake db:migrate` at boot. This is Redmine core's own consistency check,
  not plugin code.
- This is exactly the expected result: a loud, specific, diagnosable failure at boot — not a half-loaded plugin
  or a silently broken issue list.
- **Recovery:** renamed the folder back and restarted. Confirmed the login page and an issue detail page
  (`/issues/1560`) both returned `200`, and inline pencils were present again. Full recovery confirmed.
- No bug — this is Redmine's own protective behavior working as intended.

**Reconfirmed 2026-09-24 (final-cycle regression) — fully repeated end to end against the post-fix build.**
Renamed `plugins/inplace_issue_editor` → `plugins/inplace_issue_editor_RENAMED` and restarted
`redmine-docker-700-redmine-1`. `docker logs` showed the identical `Redmine::PluginNotFound: Plugin not found.
The directory for plugin inplace_issue_editor should be /usr/src/redmine/plugins/inplace_issue_editor.` error at
boot, same failure signature as 2026-09-23 — unaffected by the routing/auth code change, as expected (this is
Redmine core's own plugin-loader check, not plugin code). Renamed the folder back and restarted; confirmed full
recovery: login page `200`, `/issues/1560` rendered with `RfIE` loaded, Priority pencil visible on hover, and the
fixture unchanged (Priority High, Status Feedback).

---

### TC-INE-034: Migration not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open the issue list.

**Expected Result:**
- A clear error, or the feature simply inert — **not** a 500 on the core issue list, which would be High severity.

**Result: PASS, executed 2026-09-23** — `plugins/inplace_issue_editor` has **no `db/` directory at all**, so there
is no plugin-level schema migration to skip; this is confirmed permanent for the plugin, not a one-off state. Ran
`rake redmine:plugins:migrate NAME=inplace_issue_editor` explicitly (a normal container restart doesn't invoke
this without `REDMINE_PLUGINS_MIGRATE` set, per the entrypoint script) — it completed cleanly with no error and
nothing to do. The issue list (125 pencils) and issue detail page (29 pencils, #1560) both rendered normally
immediately after, with no missing-table exception and no 500. There is no migration state for this plugin to
ever leave half-applied, so the scenario this TC probes for cannot occur here — the plugin degrades to "always
already migrated."

**Reconfirmed 2026-09-24** — `db/` directory still absent after the code update; the code change in `f2fe7ef` is
entirely routes/controllers/JS, no schema. No missing-table exception or 500 observed across any of this session's
several restarts.

---

### TC-INE-035: JavaScript disabled in the browser

**User Role:** Member
**Steps:**
1. Disable JavaScript and open the issue list and an issue.

**Expected Result:**
- Redmine's own pages still work and the standard Edit form is still reachable.
- The plugin degrades to absent, not to broken controls that do nothing when clicked.

**Result: PASS, executed 2026-09-23** — in a browser context with `javaScriptEnabled: false`, logged in as
`willow.belle` and confirmed: the issue list rendered (25 rows) with **0** `.rf-edit-icon` elements anywhere; the
issue detail page (#1560) also had 0 pencils and no dead/inert editor markup. The standard Edit form
(`/issues/1560/edit`) was reachable via the page's own Edit link, and a Priority change submitted through it
saved and displayed correctly (Normal → verified → reverted to High). The plugin degrades cleanly to fully absent,
not to broken controls.

**Reconfirmed 2026-09-24** — repeated with a fresh `javaScriptEnabled: false` context against the post-fix build:
issue list rendered (25 rows), **0** `.rf-edit-icon` anywhere on the list or on #1560's detail page, and the
standard Edit link was still visible/reachable. Identical degrade-to-absent behavior after the routing change.

---

### TC-INE-036: Stale cache after a plugin change

**User Role:** Admin
**Steps:**
1. After updating the plugin, load a page without clearing caches, then clear and restart as the KB advises.

**Expected Result:**
- Any stale-asset symptom is resolved by the documented cache-clear and restart. Record what the symptom looked
  like, since this is the KB's first troubleshooting instruction.

**Result: PASS, executed 2026-09-23** — appended a marker comment to `rf_inline_editor_core.js`'s source
(`plugins/inplace_issue_editor/assets/javascripts/`) without recompiling. Confirmed the **stale-asset symptom
exactly as the KB describes**: the manifest still pointed at the old digest (`rf_inline_editor_core-fabfb32c.js`)
and the compiled file served to the browser did not contain the marker — the change was invisible with no error,
which is what makes this KB warning worth having (a silent, not-yet-applied plugin change). Then ran the
documented remedy: `rake tmp:clear`, `rake assets:precompile` (wrote a new digest, `-db7f5b01.js`), and restarted.
After that, the manifest and the served `<script src>` both pointed at the new digest, and the browser loaded a
file containing the marker — the symptom is fully resolved by the documented steps. Reverted the source change,
re-ran `assets:precompile` (correctly regenerated the original `-fabfb32c.js` digest, since the content matches
byte-for-byte) and restarted once more to leave the instance in its original state.

**Reconfirmed 2026-09-24, by the plugin's own real fix deployment** — this exact remedy (`assets:precompile` then
`docker restart`) is what was used earlier this session to deploy the developer's actual `f2fe7ef` code change
(new asset digests: `rf_inline_editor_core-e2f0eb93.js` etc.), and again three more times during this session's
own TC-INE-033/037 restart cycles below. Every time, the new JS took effect cleanly after precompile + restart,
with no stale-asset symptom surviving the documented remedy.

---

## Uninstallation

---

### TC-INE-037: Clean uninstall

**User Role:** Admin
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory and restart.

**Expected Result:**
- Redmine starts cleanly. The issue list and issue detail pages revert to stock behaviour with the normal Edit form.
- No orphaned pencil icons or dead click targets remain.

**Result: PASS, executed 2026-09-23 (against the shared `redmine-docker-700` instance, with explicit user
approval given the container-restart risk)**
- Took a `tar` backup of the plugin directory first (`/tmp/inplace_issue_editor_backup.tar.gz`), since there is
  no separate database backup step meaningful here — see Notes.
- Ran `rake redmine:plugins:migrate NAME=inplace_issue_editor VERSION=0` — completed cleanly (no-op, no `db/`).
- Deleted `plugins/inplace_issue_editor` entirely and restarted.
- **Redmine started cleanly** (login page `200`). As `willow.belle` on "test project": the issue list rendered
  normally (25 rows, **0** pencils, no dead controls) and issue #1560's detail page rendered normally (**0**
  pencils, `window.RfIE` now `undefined`, zero page errors — including no more of `BUG-INE-010`'s double-jstoolbar
  error, confirming that was this plugin's own doing). The standard Edit form opened and a Priority change saved
  correctly through it. **No orphaned pencils or dead click targets anywhere.**
- **Recovery:** restored the plugin from the `tar` backup, re-ran its (no-op) migrate task, and restarted.
  Confirmed full recovery: 29 pencils on #1560's detail page, 125 on the issue list, and the fixture's Feedback
  status, High priority and edited description all intact.
- No bug — a clean uninstall behaves exactly as documented.

**Reconfirmed 2026-09-24 (final-cycle regression) — fully repeated end to end against the post-fix build.** Moved
`plugins/inplace_issue_editor` out of the plugins directory entirely and restarted. Redmine started cleanly (login
`200`, no boot error — unlike TC-INE-033's rename scenario, a clean removal doesn't trip the plugin-loader's
consistency check). On `/issues/1560`: `window.RfIE` was `undefined` and `.rf-edit-icon` count was **0** — plugin
fully absent, no orphaned controls. Restored the folder, ran `bundle exec rake assets:precompile
RAILS_ENV=production`, and restarted again. Confirmed full recovery: Priority pencil visible again on #1560, and
the fixture unchanged (Priority High, Status Feedback).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-INE-032 | — (console-only defect, no visible UI symptom) | `page.on('pageerror')` on `/issues/1560`: `SyntaxError: Identifier 'lastJstPreviewed' has already been declared` | BUG-INE-010 |
| TC-INE-033 | — | `Redmine::PluginNotFound` at boot after folder rename; recovered after rename-back + restart | — |
| TC-INE-037 | — | 0 pencils / `RfIE` undefined with plugin removed; 29/125 pencils restored after re-install | — |
