# Features List — Redmineflux Time Tracker Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/time-tracker/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder name unchanged, `bundle install`, migrate, restart | TC-TMT-025 – 104 |
| 2 | Require Location Permission | Blocks timer start/stop without location; empty user selection = **all users** | TC-TMT-029 – 107, 210 – 213 |
| 3 | Enable Manual Time Entry | Gates the manual log feature | TC-TMT-032, 305 |
| 4 | Google Maps API Key | Required for the map view | TC-TMT-033, 507 |
| 5 | Page design options | Modern Card / Compact Layout / Detailed Expanded, with preview | TC-TMT-034 – 112 |
| 6 | Time Tracker page | Timer, manual entry, scrollable entry list | TC-TMT-085, 202 |
| 7 | Start the timer | Project, Issue, Tag, Activity → Start | TC-TMT-087 – 206 |
| 8 | Stop the timer | Comment + required custom fields → Stop saves the entry | TC-TMT-091 – 209 |
| 9 | Timer persistence | Survives navigation, reload, and browser closure | TC-TMT-098 – 217 |
| 10 | Inline entry editing | Comment, Tag, Activity, Start Time, End Time, Date; Enter to save | TC-TMT-102 – 304 |
| 11 | Manual time log | Project, issue, start/end time, date → Add | TC-TMT-106 – 308 |
| 12 | Duplicate an entry | Context menu → Duplicate; **same-day identical entries auto-combine** | TC-TMT-110 – 311 |
| 13 | Delete an entry | Context menu → Delete → confirm | TC-TMT-113, 313 |
| 14 | Calendar — add | Calendar icon → Add Time Entry → Log Time for the selected range | TC-TMT-001, 402 |
| 15 | Calendar — resize | Drag the start or end of an entry | TC-TMT-003 |
| 16 | Calendar — edit | Double-click an entry | TC-TMT-004 |
| 17 | Calendar — move | Drag and drop between dates | TC-TMT-005 |
| 18 | Activity view | Logs for all users; filters by project, user, custom date range | TC-TMT-009 – 505 |
| 19 | Map View | User locations where location data exists | TC-TMT-014 – 510 |
| 20 | Summary Report | Group by Project/User/Activity; charts; export PDF, CSV, XML | TC-TMT-057 – 605 |
| 21 | Detailed Report | Detailed entry data; filter by project, user, activity | TC-TMT-062 |
| 22 | Weekly Report | Weekly data; filter by user and project | TC-TMT-063 |
| 23 | Tags | Create, edit, delete; filter by Used / Unused | TC-TMT-066 – 708 |
| 24 | Browser extension | Base URL + API Key, Test Connection, start/stop in background | TC-TMT-074 – 808 |
| 25 | Permissions | View Activity, View Reports, Manage Tags, plus others'-entries visibility | TC-TMT-082 – 912 |
| 26 | Licence / domain change | Update domain in the Order section, re-enter License and Security Keys | Noted, not covered — see Notes |
| 27 | Uninstallation | Migrate `VERSION=0`, remove the folder, restart | TC-TMT-037 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **The running timer is the plugin's highest-risk object.** It is server-side state that has to survive
  navigation, reloads, closed tabs, session expiry, and the browser extension acting on it concurrently. TC-TMT-098
  – 217 and TC-TMT-079 cover that surface; a timer that is lost, duplicated, or left running forever costs users
  real recorded hours, so anything found there is severe rather than cosmetic.
- **Location tracking deserves careful, deliberate testing.** Three points make it unusual:
  1. Denying browser location **prevents the timer from starting at all** — a hard block on someone's ability to
     record work.
  2. **Leaving the user selection empty applies it to everyone**, which is the opposite of the intuitive reading
     and is an easy misconfiguration.
  3. The Map View plots **where employees physically were**. Who can see that is a privacy question, not just a
     permission question — TC-TMT-016 and TC-TMT-910 exist for it, and a leak there is High severity.
  Also note that browsers refuse geolocation on insecure origins; test over HTTPS or an HTTP-only failure will be
  misread as a plugin defect.
- **Duplicate does not always add a row.** The KB states identical same-day entries are automatically combined, so
  TC-TMT-111 verifies that the combination is correct rather than silently doubling or discarding hours.
- **Exports are the reporting path most likely to be unguarded** — permission checks tend to be written against the
  HTML view and omitted on PDF/CSV/XML. TC-TMT-043 tests the export endpoints separately for that reason.
- **Licence enforcement (feature 26) is deliberately not covered.** It requires vendor account access and a domain
  change, which is outside a functional QA cycle; it is recorded here so the omission is explicit rather than an
  oversight.
