# BUG-TCM-023

> **CLOSED — 2026-10-07.** Production #121989 (https://flux.zehntech.com/issues/121989) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-023
- Production Redmine Issue ID: #121989
- Title: The inline pencil-icon Subject editor on a test case's detail page has no way to save a change — Enter and blur both silently discard it
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

A Test case issue's title shows an inline pencil-icon editor (an `.rf-edit-icon` span next to the Subject heading,
present when the issue's Status is "New" — it is absent for other statuses like "In Progress," e.g. confirmed
missing on issues #1522/#1523/#1524; this status-gating may be an intentional workflow restriction and is not
itself asserted as a bug here). Clicking the icon reveals a plain `<input class="rf-input" name="issue[subject]">`
with **no save button, no enclosing form, and no working commit mechanism**: pressing Enter reloads the page
without persisting the change, and clicking away (blur) silently discards it.

This is not the only way to edit Subject — the full `/issues/:id/edit` form **does** include a working Subject
field (confirmed: editing Subject there and clicking Submit genuinely persists, verified via page reload) — but
the inline pencil icon's own editor is a dead end regardless, and a user who reaches for the obviously-presented
"click the pencil on the title" affordance will see a change silently vanish with no error, no indication it
failed, and no way to tell the input even got a confirm control.

## Steps to reproduce

1. Open a Test case issue whose Status is "New" (the pencil icon only appears for this status).
2. Click the pencil icon next to the title.
3. Type a new value into the textbox that appears.
4. Press Enter, or click elsewhere to blur the field.
5. Reload the issue and check the Subject.

## Expected result

- The inline pencil-icon editor should either have a visible, working save mechanism, or not present an editable
  textbox at all if it cannot actually save.

## Actual result

- Typed a new value (`QA-TC-136-EDITED-SUBJECT`, then separately `QA-TC-136-BLUR-TEST`) into the inline editor on
  issue #456; neither Enter nor blur-by-clicking-elsewhere persisted the change — reloading the issue shows the
  original, unchanged Subject both times. The inline editor's DOM has no visible save/confirm control of any kind
  (`<div class="rf-show-editor rf-show-editor--open"><input class="rf-input" name="issue[subject]"></div>` — no
  sibling button, no enclosing `<form>`).
- By contrast, the full `/issues/:id/edit` form's own Subject field works correctly: filling it and clicking the
  page's real Submit button does persist the change (confirmed via reload) — so this is specific to the inline
  pencil affordance, not Subject editing in general.

## Evidence

### Screenshot

![Inline Subject editor open on issue #456 — a bare textbox with no visible save control](../../screenshots/BUG-TCM-023/subject-inline-edit-no-save-control.png)

### Console / log

```
Inline editor DOM (after clicking the pencil icon):
<div class="rf-show-editor rf-show-editor--open" style="width: 100%;">
  <input type="text" class="rf-input" name="issue[subject]" style="width: 100%; box-sizing: border-box;">
</div>
-- no form, no button, no onkeydown/onblur handler producing a save.

Reproduction 1: filled "QA-TC-136-EDITED-SUBJECT", pressed Enter -> page reloaded, title still shows the
original subject "Kiểm tra tìm kiếm công việc theo từ khóa".
Reproduction 2: filled "QA-TC-136-BLUR-TEST", clicked elsewhere on the page -> reloaded, subject still original.

Status-gating: .rf-edit-icon present when Status=New (issue #456, #450); absent when Status=In Progress
(issues #1522, #1523, #1524).
```

## Test case coverage

Found while investigating TC-TCM-136 (Edit an existing test case) in
`testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`. TC-136 itself still **PASSes** overall — Subject, Priority and a
step's Expected Result were all successfully edited and persisted via the full `/edit` form — but this inline
affordance found along the way is a real, separate, low-severity defect in its own right (a visible, inviting
control that silently does nothing).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Subject editability. Distinct from
  BUG-TCM-017 (Test Suite's own missing Description field — a different object entirely).

## Production report

- Reported to `ztflux` as **#121989** on 2026-10-05, assigned to Sheetal Sharma. Priority: Low | Defect Severity:
  Low-severity | Defect priority: Low | Defect Type: Functional. Linked via `report_defect` to Test Case
  **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30"), Run **#592**,
  environment **"Window 11 + Chrome"** — confirmed via `get_run_testcases` showing #121989 in the testcase's
  linked defects list.

---

## Production history (synced from #121989 on 2026-10-08)

### 2026-10-06 08:59 UTC — Vaishnavi Bhawsar

Checked this one — it isn't actually a bug in the Testcase Management plugin at all. The pencil-icon editor's markup and styling come from the Scarlet theme plugin, but the plugin that actually makes it WORK (Redmineflux's inline editor plugin) wasn't installed in the environment this was tested on. With only the styling present and no working plugin behind it, the textbox looks editable but has nothing wired up to save it — exactly matching what was reported.

I installed the actual inline editor plugin on my test instance and re-tested: pressing Enter now correctly saves the new Subject (confirmed after a full reload). Clicking away (blur) intentionally does NOT save — that's by the inline editor plugin's own documented design (blur/click-outside is meant to cancel, same as pressing Escape), not a bug.

No code change was needed in the Testcase Management plugin itself for this one.

For QA: Please confirm the inline editor plugin is actually installed and enabled wherever this is tested next (Administration → Plugins should list it). With it installed: pressing Enter on the Subject inline editor should save the change (verify with a full page reload), and clicking away/Escape should discard the change back to the original value — both are expected behavior, not bugs.

### 2026-10-06 13:33 UTC — Sourabh Singh

Reopened 2026-10-06 — retested against master 67631e0, no commit in this pull touches the inline pencil-icon Subject editor at all. Not fixed; moving back from In QA to Reopen rather than closing.

### 2026-10-06 13:37 UTC — Sourabh Singh

Evidence for the reopen — no commit in today's pull touches this code path at all (confirmed via git log -p across all 13 new commits for any reference to the inline Subject editor / rf-edit-icon / rf-show-editor). The original repro evidence stands unchanged:
```
Inline editor DOM (after clicking the pencil icon):
&lt;div class="rf-show-editor rf-show-editor--open"&gt;
  &lt;input type="text" class="rf-input" name="issue[subject]"&gt;
&lt;/div&gt;
-- no form, no button, no onkeydown/onblur handler producing a save.

Typed a new subject, pressed Enter -> page reloaded, title still shows the original subject.
Typed a new subject, clicked elsewhere (blur) -> reloaded, subject still original.
```
Not independently re-reproduced live this session (confirmed only by absence of any relevant commit) — the original finding is the operative evidence.

### 2026-10-07 04:59 UTC — Sourabh Singh

Retested on master `4b5a7a7` (inline editor provided by the separate "Redmineflux Inline Issue Editor" plugin, `inplace_issue_editor` v7.0.0). Enter now genuinely saves the edited Subject -- verified via API re-fetch of the issue after submit. Clicking away (blur) does not save, but this was confirmed to be the plugin's own documented, intended behavior ("Edits save immediately; cancel with Escape or click away" -- inplace_issue_editor/README.md), not a defect: Escape/click-away is the documented way to cancel an in-progress edit, same as GitHub's inline rename or Trello's card editing. The original defect (no working save mechanism existed at all) is fully resolved. Closing.
