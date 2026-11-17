# Bug Report Template

- Bug ID: BUG-TCM-150
- Production Redmine Issue ID: #128782
- Title: `PUT /runs/update_run/:id.json` never sends the "Run Updated" notification email — `send_notification_on_update` is defined in the `Run` model but never wired to any Rails callback
- Redmine version: 6.0.0 (bookworm)
- Plugin name: redmineflux_testcase_management
- Plugin version: dev (0.0.0-dev, fresh happy-flow cross-DB instance)
- Environment: PostgreSQL (isolated Docker instance, `redmine6-happyflow-pg`, `localhost:3020`)
- Browser: N/A — found via direct REST API call (curl) + Mailpit inspection, not browser UI
- User role: Admin
- Date: 2026-11-17

## Steps to reproduce

1. Create a run via the API assigned to a user with `mail_notification = "only_assigned"` (confirms they'd receive a notification if one were sent).
2. Confirm the "Run Added" email arrives correctly (it does — see TC-TCM-011).
3. `PUT /runs/update_run/:id.json` with a changed field, e.g. `{"run":{"name":"<new name>"}}`.
4. Check the mailbox / Mailpit.

```
curl -X PUT "http://localhost:3020/runs/update_run/15.json" -H "X-Redmine-API-Key: <key>" -H "Content-Type: application/json" \
  -d '{"run":{"name":"Email-Notification-Check-Run-2-Renamed"}}'
→ HTTP 200, {"run":{"id":15,"name":"Email-Notification-Check-Run-2-Renamed", ...}}   -- the rename itself succeeds
```

## Expected result

- A "Run Updated" notification email is sent to the run's assignee/watchers, consistent with how the web UI's own Edit Run action behaves for the identical change (rename), and consistent with TC-TCM-012's documented expected behavior.

## Actual result

- No email is sent at all for this update path. The rename itself succeeds (HTTP 200, data correctly persisted) — this is a silent notification gap, not a data-correctness bug.
- Root cause (confirmed by reading `app/models/run.rb`): the method `send_notification_on_update` (which would call `RunMailer.run_updated(self, User.current).deliver_now if saved_changes?`) exists in the model, but is **never registered as an `after_update`/`after_save`/`after_commit` callback** — the model's only registered `after_update` callback is `track_activity_on_update`. `send_notification_on_update` is dead code, unreachable from any normal save.
- By contrast, the **web UI's** Edit Run action (`runs_controller.rb#update`, a *different* controller action than the JSON API's `update_run`) calls `RunMailer.run_updated(@run, User.current, environment_changes, assignee_changes, new_environments).deliver_later` **explicitly**, inline in the controller — which is why "Run Updated" notifications have historically worked when tested through the browser (see this file's own TC-TCM-012 history, and BUG-TCM-088 which is about *content* staleness in that same working web-UI email, not non-delivery).
- Net effect: a run renamed/reassigned/changed via the JSON API (`update_run`) — the path any CI/automation client or the `redmineflux-tcm-ci` tool's own direct API usage would take — never notifies anyone, while the identical change made through the browser does.

## Evidence

### Screenshot

N/A — reproduced via direct REST API call + Mailpit message listing, not browser UI.

### Console / log

Mailpit confirms exactly 2 messages total after (1) run creation (`"Run #15 Added"`) and (2) a later Passed-result submission (`"Test Case Result Added: ..."`) — no third message ever appears after the `update_run` rename in between:
```
{"total":2, ... "messages":[
  {"Subject":"Test Case Result Added: HF-PG-TC-001: Verify login page loads", "Created":"2026-11-17T06:33:00.965Z", ...},
  {"Subject":"Run #15 Added", "Created":"2026-11-17T06:31:41.77Z", ...}
]}
```
(The rename happened at `06:32:06`, strictly between these two timestamps — no corresponding email exists for it.)

Relevant source (`app/models/run.rb`):
```ruby
after_create :track_activity_on_create, :create_issue_status_results
after_commit :send_notification_on_create, on: :create
after_update :track_activity_on_update   # <-- send_notification_on_update is NOT listed here

def send_notification_on_update
  RunMailer.run_updated(self, User.current).deliver_now if saved_changes?
end
```

## Severity / impact note

- Medium: the data change itself is correct and this is notification-only, but it's a genuine, silent behavioral inconsistency between two supported paths (web UI vs JSON API) for an identically-named feature — anyone automating run updates via the API (which this plugin explicitly supports and documents) gets no watcher/assignee notification at all, with no error or warning that this is happening.
- Found while re-verifying TC-TCM-011/012/013 (email notifications) on a cross-DB happy-flow pass, after retracting an earlier BLOCKED verdict that turned out to be a missing `Setting.notified_events` configuration step (not a bug) on a fresh instance.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — related but distinct from BUG-TCM-088 (which is about the web-UI email's *content* being stale by one edit, not about the API path never sending an email at all) and BUG-TCM-087 (web UI run-ADD notification being suppressed by a hardcoded `from=API` flag — the inverse problem, a notification wrongly suppressed vs. here, one that's simply never wired up for this specific action).
