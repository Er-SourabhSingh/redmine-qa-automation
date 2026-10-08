# BUG-TCM-051

> **CLOSED — 2026-10-07.** Production #122690 (https://flux.zehntech.com/issues/122690) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-051
- Production Redmine Issue ID: #122690 (https://flux.zehntech.com/issues/122690) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: Mentioning a test case (#id) in a Requirement's content inserts a real-looking link but never creates the backing RequirementIssue relation
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Medium
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

The Requirement page's rich-text content editor supports a `#`-triggered mention/autocomplete (`mentionIssue` in `assets/javascripts/script.js`): typing `#` opens a dropdown of the project's test cases, and selecting one is supposed to both (a) insert a real hyperlink into the editor content, and (b) fire an AJAX `POST /requirement_issues.json` to create the actual `RequirementIssue(requirement_id, issue_id)` row that the rest of the plugin treats as "this test case is linked to this requirement" (traceability matrix, requirement coverage calculations, etc.).

Only half of that happens. The link **does** get inserted into the content -- confirmed via the requirement's raw stored content, which contains genuine `<a href=".../issues/109">#109: sdfdsaf</a>` and `<a href=".../issues/112">#112: test3</a>` anchors, exactly matching the mention system's own link-building format. But the matching `RequirementIssue` rows were never created -- `RequirementIssue.where(requirement_id: 3)` returns zero rows, even though the requirement visibly displays two "linked" test cases.

## Root cause

`createKnowledgebaseIssue(page_id, issue_id, project_id, action_show)` in `assets/javascripts/script.js` is the function responsible for persisting the relation via `POST /requirement_issues.json`. This call is supposed to fire whenever the mention dropdown's insertion happens, but for this requirement it evidently never did -- or fired and failed silently (only a `console.error` on failure, no visible UI feedback either way, so a user has no way to tell success from failure). The mention-insertion code (building the `<a>` tag) and the relation-creation AJAX call are two separate, independently-triggered actions with no transactional link between them -- one can succeed while the other silently doesn't.

## Steps to reproduce

1. Open a Requirement's content/description in edit mode.
1. Type `#` followed by a test case's subject or id to trigger the mention dropdown, and select it.
1. Save the requirement.
1. Check `RequirementIssue.where(requirement_id: <this requirement's id>)` directly (or the Traceability Matrix, or the test case issue's own page) for the linked test case.

## Expected result

Selecting a test case from the mention dropdown should reliably create (or clearly, visibly fail to create) a `RequirementIssue` relation -- the rendered link and the backing relation should never be able to drift apart.

## Actual result

Requirement #3 ("test") visibly shows two "linked" test cases in its content, confirmed via its raw stored content containing genuine mention-inserted `<a>` tags for both. `RequirementIssue.where(requirement_id: 3)` returns zero rows -- neither test case has a real relation to this requirement. Checked test case #109's own issue page directly -- it shows no "Requirement" field/value anywhere, consistent with no relation existing. A user looking only at the Requirement's content would reasonably believe both test cases are tracked as covering this requirement; nothing else in the plugin agrees.

## Evidence

```
Requirement.find(3).content => contains genuine mention-inserted links:
  <a href="http://localhost:3015/issues/109" target="_blank">#109: sdfdsaf </a>
  <a href="http://localhost:3015/issues/112" target="_blank">#112: test3 </a>

RequirementIssue.where(requirement_id: 3) => []   -- zero rows, despite two visible "linked" test cases.
```

## Environment

- Redmine version: 6.x (Docker)
- Plugin version: 7.1.0
- Environment: Docker localhost:3015 (project compat-fresh-project)
- User role: Administrator

---

## Production history (synced from #122690 on 2026-10-08)

### 2026-10-07 06:36 UTC — Vaishnavi Bhawsar

Fixed, and found a second problem hiding right behind the first one.

The direct cause: the editor was trying to read which requirement you had open from the page's web address, but this page never actually puts that there — it keeps it in memory instead. So it was always reading nothing, and silently gave up without telling anyone.

Once I fixed that, a second issue showed up right away: saving the link was still being rejected because of a missing project value — one that the system is deliberately not allowed to take directly from your browser (a prior security fix). I've made it work out that value safely on its own instead, the same way it already does for the single-issue version of this feature.

Screenshots attached: one showing the requirement with a real "#277" link mentioned in its text, and a second showing that same test case's own page now listing "TCM027 test requirement" under Requirements — proving the link goes both ways now.

For QA:
1. Open any Requirement, type # and pick a test case from the dropdown.
2. Save/refresh and open that same test case's own page — confirm it now shows the Requirement under its "Requirements" field.
3. Remove a mentioned link from a requirement's text and confirm it correctly disappears from that test case's Requirements field too.

### 2026-10-07 07:25 UTC — Sourabh Singh

Retested on master `c43c588` (commit 852b127, which cites this bug by name). The mention JS now passes the real requirement id (it was reading a nonexistent "page_id" URL param instead of the file-scope variable the rest of the file already used correctly), and the server now derives project_id itself rather than relying on it being client-supplied (which it never was, so every create used to fail its own presence validation). Verified by calling the real endpoint the fixed JS now calls with no project_id from the client -- a genuine RequirementIssue row was created with the correct project_id derived server-side. Closing.
