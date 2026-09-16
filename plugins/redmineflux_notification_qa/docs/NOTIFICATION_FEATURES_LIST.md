# Features List — Redmineflux Notification Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/notification/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder `redmineflux_notification`, `bundle install`, migrate, restart | TC-NTF-101 – 104 |
| 2 | Three configuration tabs | Redmine Notifications / Teams Notifications / Slack Notifications | TC-NTF-105 |
| 3 | Seven notification events | Added, updated, note added, status, assigned, priority, target version | TC-NTF-106, 201 – 207 |
| 4 | Actor exclusion | The user who made the change is never notified | TC-NTF-208 |
| 5 | Recipients | Notified users and watchers | TC-NTF-209, 210 |
| 6 | Per-user opt-in | My Account → Preferences → Notifications | TC-NTF-211 – 213 |
| 7 | Bell icon and red dot | Appears once enabled; dot clears when viewed | TC-NTF-214, 215 |
| 8 | Notification history | See All Notifications; New / Viewed filters | TC-NTF-216 – 219 |
| 9 | Mark all as seen | Bulk clear | TC-NTF-220 |
| 10 | Open redirects to the issue | And marks the notification viewed | TC-NTF-221 |
| 11 | Faye real-time delivery | `faye.ru` via rackup; address in settings | TC-NTF-301 – 306 |
| 12 | Faye optional | Empty address = stored-only notifications | TC-NTF-307 |
| 13 | Browser desktop notifications | Preference plus OS/browser permission | TC-NTF-308 – 312 |
| 14 | Teams global webhook | Incoming webhook URL, enable toggle | TC-NTF-401 – 404 |
| 15 | Teams options | Display watchers; Post issue updates | TC-NTF-405, 406 |
| 16 | Teams message content | Project, issue link, author, status, priority, assignee, watchers, notes, changed fields | TC-NTF-407 |
| 17 | Teams excludes private issues and notes | Stated explicitly in the KB | TC-NTF-408, 409 |
| 18 | Teams project module and webhook | Project-specific routing | TC-NTF-410 – 412 |
| 19 | Teams routing rules | Project → parent/global → none | TC-NTF-413 – 415 |
| 20 | Slack global settings | Bot token, signing secret, default channel, Verify SSL | TC-NTF-501 – 505 |
| 21 | Slack options | Display watchers; Post issue updates | TC-NTF-506 |
| 22 | Slack message content | Project link, issue link, author, status, priority, assignee, watchers, notes, fields | TC-NTF-507 |
| 23 | Slack bot channel membership | Bot must be invited to the channel | TC-NTF-508 |
| 24 | Slack project module and channel | Project-specific routing | TC-NTF-509 – 511 |
| 25 | Slack routing rules | Project → global default → none | TC-NTF-512 – 514 |
| 26 | **Slack and private issues** | **Not documented** — must be established | TC-NTF-515 |
| 27 | Disable notifications per project | Skips email **and** notifications | TC-NTF-601 – 605 |
| 28 | Permissions and visibility | Who configures what; who can receive what | TC-NTF-901 – 910 |
| 29 | Uninstallation | Migrate `VERSION=0`, remove the folder, restart | TC-NTF-113 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **The highest-value case in the whole plugin is TC-NTF-515.** The KB states plainly that *"Private issues and
  private notes are not posted to Teams"* — and says **nothing equivalent for Slack**, despite the two integrations
  being described in parallel throughout the page. Either the documentation is incomplete or the exclusion was
  only implemented on one path. If private issue content reaches a Slack channel, that is a **Critical** leak: the
  content leaves Redmine entirely, lands somewhere with a different and usually wider membership, and cannot be
  retracted. This asymmetry is exactly the kind of gap that a documentation-driven test pass is well placed to
  find, and it must be tested rather than inferred in either direction.
- **The actor-exclusion rule (feature 4) will generate false bug reports** if testing is done with one account.
  The KB names it as a troubleshooting cause for good reason. Always drive changes as user A and observe as
  user B.
- **Teams and Slack routing tables differ in the KB**: the Teams fallback mentions a **parent project**, the Slack
  fallback does not. TC-NTF-414 and TC-NTF-513 test the sub-project case on both, since an undocumented difference
  in inheritance would silently send a sub-project's activity to the wrong channel.
- **"Disable notifications" on a project also suppresses email**, which is broader than its name implies
  (TC-NTF-602). An administrator silencing a noisy project may not realise they have also stopped Redmine's own
  mail for it.
- **Faye is a separate process.** If it is not running, real-time simply does not happen while stored notifications
  still work — so a "real-time is broken" result is meaningless unless the Faye process state is recorded
  alongside it (TC-NTF-301).
- Declared support is **Redmine 5.0.x and 6.0.x only** — narrower than most of the set, omitting 5.1.x.
