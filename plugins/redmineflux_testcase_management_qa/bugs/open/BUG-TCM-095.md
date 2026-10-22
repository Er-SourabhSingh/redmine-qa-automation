# BUG-TCM-095

- Bug ID: BUG-TCM-095
- Production Redmine Issue ID: #124386
- Title: The Issues list's bulk-action "Requirements" context-menu submenu is shown fully clickable to every user
  regardless of `edit_requirement` permission — unlike every sibling submenu item in the same menu, it has no
  `:disabled` check at all, so a user with no `edit_requirement` grant sees a working-looking option that then
  403s
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright) + curl (session-cookie auth)
- User role: `qanonadmin` (Developer — has core `edit_issues` granted, zero Testcase Management permissions
  including `edit_requirement`)
- Date: 2026-10-22 (found while regressing `TESTCASE_MANAGEMENT_TEST_CASES.md` TC-TCM-149/150 per user request)

## Summary

Found while the user raised a specific permission-design question: from the Issues list's bulk-edit context menu
(right-click on selected test case rows → **Requirements** submenu → pick a requirement to bulk-link), a user who
can edit the issues themselves (core `edit_issues`) but lacks the plugin's own `edit_requirement` permission still
sees every requirement option rendered as a normal, fully-clickable link — then gets a bare `403 Forbidden` page
when they click one, with zero explanation.

Root cause confirmed via source (`app/views/context_menus/issues.html.erb`): every other submenu in this exact
file — Status, Tracker, Priority, Fixed Version, Assigned To, Category, Done Ratio, custom fields — consistently
passes `:disabled => !@can[:edit]` (or an equivalent permission check) to `context_menu_link`, so Redmine renders
a visibly greyed-out, inert link when the user can't use it. The **Requirements** submenu, added by this plugin,
is the one exception:

```erb
<% requirements.each do |requirement| %>
  <li>
    <%= context_menu_link requirement.title, assign_requirement_to_issues_path(:ids => @issue_ids, :issue => { 'requirements' => requirement.id }, :back_url => @back, :project_id => @project.id), method: :post, class: 'requirement_name', title: requirement.title %>
  </li>
<% end %>
```

No `:disabled` option is passed at all — the link always renders as a plain, active anchor regardless of
permission. The actual target action (`TestSuitesController#assign_requirement`) is correctly gated server-side
by `rftc_require_permission!(:edit_requirement, @project)` (confirmed via source, and this is a deliberate,
documented choice — the same permission `RequirementIssuesController#create` already requires for the
single-issue equivalent, per that method's own code comment), so **no actual data-integrity risk exists** — this
is a UI-consistency gap (visible-but-blocked), the same class of defect already found this cycle in BUG-TCM-089
(Requirements page's own Add/Edit controls).

## Steps to reproduce

1. As a user with core `edit_issues` granted but the plugin's `edit_requirement` permission denied, open the
   project's Issues list (or the Testcase Summary grid).
2. Select one or more Testcase-tracker rows, right-click to open the bulk context menu.
3. Hover **Requirements** — observe every requirement option renders as a normal, non-greyed-out link, identical
   in appearance to a permission you DO have (e.g. Status, Tracker).
4. Click a requirement option.

## Expected result

- The **Requirements** submenu options should render disabled/greyed-out (matching every other submenu in this
  same context menu) when the user lacks `edit_requirement`, the same way Status/Tracker/Priority/etc. already do
  when the user lacks `edit_issues`.

## Actual result

- The options are always rendered fully active. Clicking one sends a real `POST /requirement_issues/assign_requirement`
  request that correctly 403s server-side, but with no prior visual indication the action wasn't available.

## Evidence

### Console / log

```
# As qanonadmin (edit_issues=true, edit_requirement=false):
$ curl -b <qanonadmin session> -X POST \
  ".../requirement_issues/assign_requirement?ids[]=2118&issue[requirements]=6&project_id=2" \
  -H "X-CSRF-Token: ..."
-> HTTP/1.1 403 Forbidden

# Confirmed via rails runner: no row created
RequirementIssue.where(issue_id: 2118, requirement_id: 6).exists?  # => false

# Source confirms the view never disables this submenu (app/views/context_menus/issues.html.erb):
<%= context_menu_link requirement.title, assign_requirement_to_issues_path(...), method: :post,
    class: 'requirement_name', title: requirement.title %>
# (no :disabled key passed — contrast with every other submenu item in this same file, which all pass
# :disabled => !@can[:edit])
```

## Suggested fix

Pass `:disabled => !User.current.allowed_to?(:edit_requirement, @project)` (or equivalent) to the `Requirements`
submenu's `context_menu_link` calls, matching the existing pattern used by every sibling submenu in this file.

## Verdict

**Confirmed, Low.** No actual write happens without the real permission — the server-side gate holds correctly
and is a deliberate, consistent design choice (not itself the bug). This is purely a UI-consistency gap: the one
submenu in this context menu that doesn't grey itself out for a user who can't use it, same class of finding as
BUG-TCM-089's Requirements-page controls.

## Duplicate check

- Duplicate found: No — related in *class* to BUG-TCM-089 (visible-but-blocked UI controls on the Requirements
  feature) but a distinct location (the Issues list's bulk context menu, not the Requirements page itself).
- Existing bug reference (if duplicate): n/a — cross-referenced from BUG-TCM-089 as the same general pattern.

## Production report

Reported to production `ztflux` as **#124386** on 2026-10-22, per explicit user instruction ("okay to inhe create
kr do production pe"). Tracker Bug, Priority Low, Category "Testcase Management Plugin", Target version
"Testcase Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link. Custom fields left at project defaults — `list_custom_fields` returns a permission error for
this account, same limitation as every prior production report this session. Reported alongside BUG-TCM-096
(#124387) after confirming with the user these are related-but-distinct defects, not duplicates of each other.
