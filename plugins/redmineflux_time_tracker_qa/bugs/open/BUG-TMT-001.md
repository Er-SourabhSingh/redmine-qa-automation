# Bug Report

- Bug ID: BUG-TMT-001
- Production Redmine Issue ID: #121063
- Title: "Start Timer" / "Stop Timer & Log Time" on the issue detail page writes real time entries on a closed/read-only project, while core's own "Log time" is correctly blocked
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Time Tracker Plugin
- Plugin version: (record installed version)
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-22

## Steps to reproduce

1. Close a project (Actions → Close).
2. Open any issue in that closed project. Confirm the "This project is closed and read-only." banner is showing,
   and confirm core Redmine's own "Log time" link/action is absent (it correctly respects the closed state).
3. On the issue detail page, click **Start Timer** (top action bar, plugin-provided control,
   `.issue-start-timer-btn`).
4. Let the timer run past the plugin's own 1-minute minimum, then click **Stop Timer** and complete the
   resulting "Stop Timer & Log Time" modal (Activity, optional comment) and click **Stop & Save**.
5. Reload the issue and check the "Spent time" total.

## Expected result

- Since the project is closed and read-only, and core Redmine's own "Log time" is already correctly blocked
  there, the plugin's own timer-based logging path should follow the same rule and be blocked too — "Start
  Timer" should be disabled (with an explanatory tooltip, matching the pattern used elsewhere for
  permission-blocked controls) or its save should be rejected server-side with a clear message.

## Actual result

- Core's "Log time" link is correctly absent on the closed project's issue — confirms the project genuinely is
  treated as read-only by Redmine core.
- The plugin's own **"Start Timer"** control is fully enabled (not disabled, no tooltip) and the entire flow
  succeeds end to end:
  - `POST /time_tracker/start_timer` → **200 OK**
  - `POST /time_tracker/save_time_entry_with_custom_fields` → **200 OK**
- The issue's **Spent time total increased** (0:02 h → 0:03 h after this test), confirming a real, persisted
  `TimeEntry` record was written to a project explicitly marked "closed and read-only."
- This is the same category of gap as `BUG-CHK-005` (Checklist plugin) found in the same session: a plugin
  provides its own write path on the issue detail page that doesn't check the project's closed state, even
  though Redmine core's own equivalent action on the same page correctly does.
- This suite (`TIME_TRACKER_PERMISSIONS.md`) already had a test case for exactly this scenario, `TC-TMT-055`
  ("Closed and archived projects"), authored but not yet executed before this session — this finding is its
  first live execution (closed-project half only; archived-project half and the "edit an existing entry" /
  direct-endpoint sub-steps remain untested).

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TMT-001/closed-project-timer-start-and-save.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TMT-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- Network tab, project `checklist-perm-private` (closed), issue #1533: `POST /time_tracker/start_timer` → 200,
  `POST /time_tracker/save_time_entry_with_custom_fields` → 200.
- Issue's "Spent time" field read `0:02 h` before the test, `0:03 h` after — a real, persisted write.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked `bugs/_duplicates.md` and `bugs/_index.md` before filing
  (both empty; this is the plugin's first bug).

## Reported by

Raised by the user directly ("i have observed one issue in time tracker user able to log time from start timer
button save time to log time, spent time is disabled for closed but from issue detail page user able to perform
this action"), immediately after a very similar finding was confirmed in the Checklist plugin (`BUG-CHK-005`) in
the same session. Investigated and confirmed with live network evidence.
