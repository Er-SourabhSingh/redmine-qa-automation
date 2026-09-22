# Handoff — Redmineflux Time Tracker Plugin

## Last Session

- Date: 2026-09-22
- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker — `redmine-docker-700-redmine-1`, `http://localhost:3010`

## Completed This Session (2026-09-22, continued) — ad-hoc, BUG-TMT-002 filed

Second ad-hoc user report in the same session: "i found one bug in time tracker when time tracking module
disable in project user still able to start time for because start time button avaiable on issue detail page"
(on `localhost:3010`).

Investigated live on project `test-project` / issue #1553: disabled core Redmine's **Time tracking** module via
Project Settings → Modules → Save (this plugin registers no module of its own — confirmed only the core
checkbox exists). Confirmed:
- Core's own "Log time" link correctly disappears from the issue detail page.
- The plugin's own **Start Timer** control stays fully visible and clickable.
- Clicking it (through the usual unassigned-issue "Assignment Notice" interstitial) sends
  `POST /time_tracker/start_timer` → **422**, body `{"status":"error","message":"Time tracking is disabled for
  this project"}` — so, unlike `BUG-TMT-001`, the backend **does** enforce the module correctly and no time
  entry is actually written.
- The real defect: **no error is surfaced to the user anywhere in the UI** — the button silently reverts to idle
  with zero feedback, which reads to a user exactly like "the button is there and does nothing," matching the
  original report.

Recorded as `TC-TMT-924` in `testcases/TIME_TRACKER_PERMISSIONS.md`. Filed **`BUG-TMT-002`** (Medium — misleading
dead control + silent failure, not a data-integrity bypass). Restored the module setting on `test-project`
afterward (re-checked "Time tracking", saved). **User explicitly approved reporting it to production** — created
as **#121076**, assigned to Sheetal Sharma (category "Time tracker web Plugin", matching BUG-TMT-001).

## Completed This Session (2026-09-22) — ad-hoc, BUG-TMT-001 filed (first live finding for this plugin)

Not a planned test pass on this plugin — the user directly reported (immediately after a very similar finding
was confirmed in the Checklist plugin, `BUG-CHK-005`, in the same session): "i have observed one issue in time
tracker user able to log time from start timer button save time to log time, spent time is disabled for closed
but from issue detail page user able to perform this action."

Investigated live on project `checklist-perm-private` (closed) / issue #1533 — this is `TC-TMT-923` ("Closed and
archived projects"), previously authored but not executed:

- Confirmed core Redmine's own "Log time" link is correctly absent on the closed project's issue.
- Confirmed the plugin's own "Start Timer" control is fully enabled and its entire flow succeeds:
  `POST /time_tracker/start_timer` → 200, `POST /time_tracker/save_time_entry_with_custom_fields` → 200 — and
  the issue's Spent time total genuinely increased (0:02 h → 0:03 h), a real persisted write.
- Filed **`BUG-TMT-001`** (High). Recorded as the closed-project half of `TC-TMT-923` in
  `testcases/TIME_TRACKER_PERMISSIONS.md` — the archived-project half and the "edit an existing entry" /
  direct-endpoint sub-steps of that TC are still not executed.

**Nothing else in this plugin's suites has been executed** — this remains effectively an unstarted plugin cycle
with one incidental finding. See `TIME_TRACKER_MEMORY.md` for the two quirks discovered along the way (timer's
1-minute save floor, unassigned-issue interstitial modal).

## Completed Previous Session (2026-09-15) — authoring only

- Folder structure scaffolded per CLAUDE.md §3.
- Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/time-tracker/
- `TIME_TRACKER_REQUIREMENTS.md`, `TIME_TRACKER_FEATURES_LIST.md` and `TIME_TRACKER_USER_GUIDE.md` populated from the KB, clearing the
  §11 pre-test blocker.
- Functional, negative and permission test suites authored in `testcases/`.

## In Progress

- Nothing formally executed yet — only the one ad-hoc `TC-TMT-923` (closed-project half) finding above.

## Blockers

- None. Execution requires a running instance with the plugin installed and the roles named in the permissions
  suite provisioned (already true on the local Docker instance used this session).

## Next Session Start Point

- Start with the installation/configuration suite, then the rest of the permissions suite (it provisions the
  roles the other suites assume — note `TC-TMT-923`'s closed-project half is already done, pick up from its
  archived-project half and direct-endpoint sub-steps), then the functional suites in file order.
- `BUG-TMT-001` needs a fix before this plugin can move toward `Complete` in `STATUS.md`. It was reported to
  production this session (as #121063, assigned to Sheetal Sharma) after explicit user approval — any further
  production action on it (status changes, closure sync) still needs its own fresh approval per session.

## Open Bugs Found

- **BUG-TMT-001 (High)** — "Start Timer" / "Stop Timer & Log Time" writes real time entries on a closed/
  read-only project; core's own "Log time" is correctly blocked there. Reported to production as **#121063**,
  assigned to Sheetal Sharma. `plugins/redmineflux_time_tracker_qa/bugs/open/BUG-TMT-001.md`.
- **BUG-TMT-002 (Medium)** — "Start Timer" stays visible on the issue detail page when the project's core "Time
  tracking" module is disabled; the write is correctly refused server-side (422) but the failure is completely
  silent to the user. Reported to production as **#121076**, assigned to Sheetal Sharma.
  `plugins/redmineflux_time_tracker_qa/bugs/open/BUG-TMT-002.md`.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-09-22 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Ad-hoc, user-reported — not a planned pass. Confirmed `TC-TMT-923` (closed-project half): the plugin's "Start Timer" control writes real time entries on a closed/read-only project via `start_timer` (200) and `save_time_entry_with_custom_fields` (200), while core's own "Log time" is correctly blocked. Filed `BUG-TMT-001` (High) — this plugin's first bug. **User explicitly approved reporting it to production** — created as #121063, assigned to Sheetal Sharma. |
| 2026-09-22 | 7.0.0 (Docker) | Local (redmine-docker-700, localhost:3010) | Claude (Playwright MCP) | Ad-hoc, second user report same session. Confirmed `TC-TMT-924`: with core's "Time tracking" module disabled for a project, the plugin's "Start Timer" control stays visible on the issue detail page (core's "Log time" correctly disappears); clicking it is refused server-side (`start_timer` → 422, "Time tracking is disabled for this project") so no time entry is actually written, but the failure is not surfaced to the user at all. Filed `BUG-TMT-002` (Medium). **User explicitly approved reporting it to production** — created as #121076, assigned to Sheetal Sharma. |
