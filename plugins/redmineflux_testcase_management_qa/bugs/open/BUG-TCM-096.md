# BUG-TCM-096

- Bug ID: BUG-TCM-096
- Production Redmine Issue ID: #124387
- Title: A user with core `edit_issues` but no `edit_requirement` can fully add/remove a test case's Requirement
  links via the plain Issue Edit form — a genuine permission bypass, not just a UI-consistency gap (distinct from
  BUG-TCM-095)
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright)
- User role: `qanonadmin` (Developer — core `edit_issues` granted, `edit_requirement` explicitly denied,
  confirmed via `User#allowed_to?` before the test)
- Date: 2026-10-22 (found while answering a direct user follow-up on BUG-TCM-095: "if Edit lets a user add a
  requirement, shouldn't the issue list be able to too?" — the premise itself turned out to expose a real bypass)

## Summary

While investigating BUG-TCM-095 (the bulk context-menu's missing `:disabled` check), the user asked a sharp
follow-up: if editing a test case already lets a user add a Requirement link, isn't it inconsistent that the
Issues-list bulk action requires a *different*, stricter permission? Checking this precisely surfaced a more
serious problem than an inconsistency — **the Edit Issue form's own Requirement linking is not permission-gated
at all** (beyond whatever lets the user reach Issue Edit in the first place, i.e. core `edit_issues`).

Root cause (`lib/redmineflux_testcase_management/hooks/model_issue_hook.rb`,
`controller_issues_edit_after_save` — a Redmine hook fired by core `IssuesController#update` after every plain
issue save):

```ruby
def controller_issues_edit_after_save(context = {})
  issue = context[:issue]
  ...
  requirement_ids = context[:params][:issue][:requirement_ids] if context[:params][:issue].present? && context[:params][:issue][:requirement_ids]

  if requirement_ids.present?
    requirement_ids.each do |requirement_id|
      next if requirement_id.blank?
      issue.requirement_issues.find_or_create_by(project_id: issue.project_id, requirement_id: requirement_id)
      ...
    end
    removed_requirements = issue.requirement_issues.where.not(requirement_id: requirement_ids)
    removed_requirements.each { |ri| ri.destroy }
    ...
  end
end
```

There is **no `allowed_to?(:edit_requirement, ...)` check anywhere in this method, nor anywhere else in this
entire hook file** (confirmed by reading it in full — `controller_issues_bulk_edit_before_save`, which handles
the same `requirement_ids` param from the standard Redmine **Bulk Edit** form, has the identical gap). The
Requirement dropdown is injected into every Issue new/edit form by
`app/views/issues/_testcase_id_field.html.erb` (`<select id="testcase_requirement" name="issue[requirement_ids][]"
multiple="multiple">`) with no permission check on whether to render it either — it's shown to any user who can
open the form at all.

This is a genuine authorization bypass of the `edit_requirement` permission, not merely a UI-consistency issue:
every other path that creates/destroys a `RequirementIssue` link in this plugin —
`RequirementIssuesController#create`/`#destroy` (single-issue AJAX path) and
`TestSuitesController#assign_requirement` (bulk context-menu path, see BUG-TCM-095) — explicitly requires
`edit_requirement`. This third path, reached through the ordinary Issue Edit form every `edit_issues`-holding
user already has access to, requires nothing beyond that.

## Steps to reproduce

1. As a user with core `edit_issues` granted but the plugin's `edit_requirement` permission explicitly denied
   (confirm via `User#allowed_to?(:edit_requirement, project)` → `false`), open any Testcase-tracker issue for
   Edit.
2. In the **Requirements** multi-select field, select a requirement (or deselect an existing one).
3. Click Submit.

## Expected result

- The save should be rejected, or the Requirement field should not be editable at all, for a user who lacks
  `edit_requirement` — matching the permission this plugin enforces on every other path that performs the exact
  same mutation.

## Actual result

- The save succeeds in full. A genuine `RequirementIssue` row is created (or an existing one destroyed), with no
  permission check of any kind beyond core `edit_issues`.

## Evidence

### Console / log

```ruby
# Confirmed baseline via rails runner before the test:
u = User.find_by(login: 'qanonadmin')
p = Project.find_by(identifier: 'rftc-016-ci-qa')
u.allowed_to?(:edit_issues, p)       # => true
u.allowed_to?(:edit_requirement, p)  # => false

# Created a clean probe issue (#2124), confirmed zero requirement links.
# Logged in as qanonadmin via real Playwright browser, opened /issues/2124/edit,
# selected requirement id=6 in the #testcase_requirement dropdown, submitted the form.

# Confirmed via rails runner immediately after:
Issue.find(2124).requirement_issues.pluck(:requirement_id)  # => [6]
```

The link was genuinely created by a user with no `edit_requirement` permission at all, through a completely
ordinary, unprivileged-looking Issue Edit save. Probe issue deleted immediately after confirmation.

## Suggested fix

In `model_issue_hook.rb`'s `controller_issues_edit_after_save` and `controller_issues_bulk_edit_before_save`
(and the corresponding `controller_issues_new_after_save` for the Create path, which has the same gap), check
`context[:issue].project && User.current.allowed_to?(:edit_requirement, context[:issue].project)` before
processing `requirement_ids` at all — matching the gate `RequirementIssuesController` and
`TestSuitesController#assign_requirement` already enforce. Separately, `_testcase_id_field.html.erb` should only
render the editable `<select>` (vs. the existing read-only fallback it already has for the
module-disabled case) when the current user actually has `edit_requirement`.

## Verdict

**Confirmed, High.** This is a genuine, reproducible authorization bypass — not a cosmetic UI gap like
BUG-TCM-095 — that lets any user holding only the common core `edit_issues` permission fully control a test
case's Requirement links, completely defeating the purpose of the plugin's own `edit_requirement` permission for
this entire class of action (both the single-issue Edit form and the standard Bulk Edit form).

## Duplicate check

- Duplicate found: No — related to BUG-TCM-095 (same feature area, same missing-permission theme) but a
  materially more severe, distinct defect: BUG-TCM-095 is a visible-but-correctly-blocked UI gap with no actual
  bypass; this is a genuine write-path bypass with no gate at all. Found as a direct consequence of investigating
  BUG-TCM-095 per the user's own follow-up question.
- Existing bug reference (if duplicate): n/a — cross-referenced from BUG-TCM-095.

## Production report

Reported to production `ztflux` as **#124387** on 2026-10-22, per explicit user instruction ("okay to inhe create
kr do production pe"). Tracker Bug, Priority High, Category "Testcase Management Plugin", Target version
"Testcase Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link. Custom fields left at project defaults — `list_custom_fields` returns a permission error for
this account, same limitation as every prior production report this session. Reported alongside BUG-TCM-095
(#124386) after confirming with the user these are related-but-distinct defects, not duplicates of each other.
