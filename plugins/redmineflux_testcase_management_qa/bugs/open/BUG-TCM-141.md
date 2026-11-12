# Bug Report

- Bug ID: BUG-TCM-141
- Production Redmine Issue ID:
- Title: Inline and bulk TC reassignment sends no email notification to the new assignee
- Redmine version: 6.0.11 (Docker)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (Release 7.4.0)
- Environment: localhost:3000
- Browser: Chrome (admin)
- User role: Admin
- Date: 2026-11-12

## Steps to reproduce

1. Open any Run with at least one TC assigned to User A.
2. Reassign one or more TCs to User B — either via inline click (TC Assignee dropdown) or via bulk Reassign modal.
3. Check whether User B receives any email notification about the new assignment.

## Expected result

- User B (new assignee) should receive an email notification that test cases have been assigned to them in the run, so they know what testing work they are responsible for.
- This is consistent with how env-level assignee changes on Edit Run work: `RunMailer.run_updated` is called with `assignee_changes` data and an email is sent.

## Actual result

- **No email is sent** when TCs are reassigned via inline or bulk reassignment.
- The `reassign_testcases` controller action (runs_controller.rb line 876–895) updates `RunIssue.assignee_id` records and returns a JSON success response — but contains **no `RunMailer` call or any other notification mechanism**.
- The new assignee has no way to know they have been assigned testing responsibility unless they manually check the run.

## Root cause (source-verified)

`runs_controller.rb` line 876–895 (`reassign_testcases` action):

```ruby
def reassign_testcases
  ...
  count = RunIssue.reassign!(run: @run, issue_ids: in_run, assignee_id: assignee&.id)
  name = assignee ? assignee.name : l(:label_unassigned)
  render json: { count: count, assignee_id: assignee&.id, assignee_name: name,
                 message: l(:notice_testcases_reassigned, count: count, name: name) }, status: :ok
end
```

No `RunMailer` call. Compare with `update` action (line 591–596) which DOES send email on env-level assignee changes:

```ruby
RunMailer.run_updated(@run, User.current, environment_changes, assignee_changes, new_environments).deliver_later
```

## Comparison — email behavior by action

| Action | Email sent? |
|--------|------------|
| Run created (new assignees) | YES — `send_notification_on_create` after_commit |
| Edit Run — env-level assignee changed | YES — `RunMailer.run_updated` with `assignee_changes` |
| Inline TC reassign (`reassign_testcases`) | **NO** |
| Bulk TC reassign (`reassign_testcases`) | **NO** |

## Impact

- Assignees are silently given testing responsibilities with no notification.
- In a team environment with multiple environments and assignees (the exact use case Release 7.4.0 was built for), this means testers may miss their assigned work entirely.
- Severity: Medium — feature works correctly otherwise, but the notification gap makes it unreliable in production team workflows.

## Evidence

- Source read: `runs_controller.rb` lines 876–895 (no `RunMailer` call in `reassign_testcases`).
- Source read: `run.rb` lines 15 (`after_commit :send_notification_on_create`) and `runs_controller.rb` line 593 (`RunMailer.run_updated` on Edit Run).

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-141/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console errors — notification gap is a missing feature call, not a crash.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` — no existing bug for missing reassignment notification.
