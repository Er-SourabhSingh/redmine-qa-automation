# Bug Report

- Bug ID: BUG-INE-008
- Production Redmine Issue ID: #121122 (ztflux, https://flux.zehntech.com/issues/121122) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: Inline Description save reports "Saved successfully." after the user's edit permission was revoked, although the change is silently discarded
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP) — two isolated browser contexts (Developer user + Admin)
- User role: Developer (`willow.belle`) — edit permission revoked by Admin mid-edit
- Date: 2026-09-23

## Steps to reproduce

1. Precondition: Developer role has `edit_issues` (All trackers) and `add_issue_notes`. Issue #1560 (Bug tracker,
   status Feedback) has a non-empty description.
2. As `willow.belle` (Developer), open issue #1560 and click the **Description** inline pencil. Type a new
   description. Do **not** save yet.
3. In a separate session, as Admin, go to Administration → Roles and permissions → Developer, **uncheck
   "Edit issues"**, and save. Reload the role page and confirm the checkbox is unchecked.
4. Back in Willow's still-open description editor, click **Save**.
5. Reload the issue page.

## Expected result

- The save should be refused with a visible error (e.g. "You do not have permission to edit this issue." — the
  plugin already ships a `noPermissionIssue` i18n string for this), consistent with how the same revocation is
  handled for field edits: an inline Subject save in the identical situation gets `403 {"errors":["Forbidden"]}`
  and the toast "Could not save: HTTP 403" (TC-INE-101).
- The user must never see a "saved" confirmation for a change that did not take effect.

## Actual result

- The description save is sent as a standard issue update (`POST /issues/1560`, `_method=patch`), which returns
  **`302`** → `/issues/1560`. Redmine core silently discards the `description` attribute because the user is no
  longer allowed to edit it — the underlying data is **safe** (description unchanged after reload, no new journal
  entry: 7 journals before and after).
- The plugin treats the 302 as success and shows a green **"Saved successfully."** toast. The user is told their
  change was saved when it was not, with no indication anything is wrong.
- Reproduced **3 times**: twice with `edit_issues` fully unchecked, once with `edit_issues` checked but its "All
  trackers" scope cleared. Same result every time: `302`, description unchanged, "Saved successfully.".
- Contrast: field edits (`PUT /issues/:id/update_field.json`) under the same revocation correctly return `403` and
  show an error toast. Only the description path, which goes through the standard update action instead of the
  plugin's JSON endpoint, loses the refusal signal.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-008/false-success-toast-description-after-permission-revoked.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-008/retest-yyyy-mm-dd-pass.png)

### Console / log

- Role state after revoke (reloaded role page): `edit_issues` unchecked, `permissions_all_trackers[edit_issues]` unchecked.
- `POST /issues/1560` → `302`, `Location: http://localhost:3010/issues/1560`.
- Toast: `"Saved successfully."`
- After reload: `#issue_description_wiki` = "Description written by A (willow) first" (unchanged; attempted value
  "Description written after edit_issues fully revoked" not applied). Journal count 7 → 7.
- Same session, Subject field under the same revocation (TC-INE-101): `PUT /issues/1559/update_field.json` →
  `403 {"errors":["Forbidden"]}`, toast "Could not save: HTTP 403".

## Notes

- Same user-facing symptom family as BUG-INE-006 (false "saved" toast for a dropped write) but a different
  surface (issue detail page, Description) and a different mechanism (standard update action returns 302 and
  silently filters unsafe attributes, versus `update_field.json` returning 200 with the value dropped). Filed
  separately because a fix for one would not fix the other.
- Found while executing TC-INE-056 step 2 (direct description write by a user without edit rights), using a
  mid-edit permission revocation to obtain a real description request from a user who no longer has
  `edit_issues`.
- Fixture restored after each repro: Developer role back to `edit_issues` ✓ + All trackers ✓ (verified by reload;
  Willow sees 29 inline pencils on #1560 again).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related, not duplicate: BUG-INE-006)

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121122**, 2026-09-23.
- Linked as a defect to Test Case **#121042**, Run **#577**, Test Suite **#146**, Environment "Window 11 + Chrome"
  — testcase's defect list now includes `121122` alongside the 5 other defects on this run, verified via
  `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Vaishnavi Bhawsar.
