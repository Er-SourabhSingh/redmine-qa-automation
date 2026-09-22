# Features List — Redmineflux Workload Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder `redmineflux_workload`, `bundle install`, migrate, restart | TC-WKL-031 – 104 |
| 2 | Workloads top menu | Visible to logged-in users only | TC-WKL-035, 906 |
| 3 | Working Hours Per Day | Default 8.0; drives all capacity maths | TC-WKL-036, 107 |
| 4 | Allow Workload Overload | Permits planned hours to exceed capacity | TC-WKL-038, 109, 411 |
| 5 | Teams CRUD | Create, edit, delete, bulk delete | TC-WKL-118 – 206 |
| 6 | Team members | Add with a Redmine role; one membership per user per team; many teams per user | TC-WKL-124 – 211 |
| 7 | Per-team **Manage workload** flag | Team-scoped workload management right | TC-WKL-129, 903 |
| 8 | Per-team **Can approve leave** flag | Team-scoped leave approval right | TC-WKL-130, 904 |
| 9 | Skills CRUD | Create, edit, delete, bulk delete | TC-WKL-131 – 217 |
| 10 | Assign skills with proficiency | Add users to a skill at a proficiency level | TC-WKL-135 – 220 |
| 11 | Find team members by skill | Search and filter by skill | TC-WKL-138, 222 |
| 12 | Request leave | Type, start, end, reason; pending by default | TC-WKL-048 – 304 |
| 13 | Approve / reject leave | Approver queue; rejection requires a reason | TC-WKL-052 – 309 |
| 14 | Cancel leave | Cancelled leave stops reducing capacity | TC-WKL-057, 311 |
| 15 | Approved leave reduces capacity | Core capacity input | TC-WKL-059, 405 |
| 16 | Holiday schemes | Create; Active flag; activating one deactivates the other | TC-WKL-060 – 316 |
| 17 | Holidays | Name, start, optional end, type, description, recurring | TC-WKL-064 – 320 |
| 18 | Generate Recurring Holidays | Creates entries for a chosen year | TC-WKL-068, 322 |
| 19 | Only the active scheme affects capacity | Documented troubleshooting cause | TC-WKL-070, 406 |
| 20 | Workload CRUD | Team, name, dates, members, optional custom hours/day | TC-WKL-091 – 404 |
| 21 | Capacity calculation | Hours/day − weekends − holidays − approved leave | TC-WKL-095 – 409 |
| 22 | Add / remove issues | Issue search and eligible-issues list | TC-WKL-100, 412, 413 |
| 23 | Allocate planned hours | Per user per issue; utilization, remaining, overbooked | TC-WKL-101, 414 – 416 |
| 24 | Recalculate Capacity | After changing hours, dates, membership, holidays or leave | TC-WKL-107, 418 |
| 25 | Workload email | Sends workload, team, issue and allocation details | TC-WKL-109, 420 |
| 26 | Gantt timeline | Drag, resize, reorder, daily distribution, conflicts | TC-WKL-001 – 508 |
| 27 | Split an allocation | Schedule one issue across separate ranges | TC-WKL-009 – 511 |
| 28 | Cross-workload conflicts | Overlapping allocations across workloads | TC-WKL-012, 606 |
| 29 | Dashboard (admin only) | KPIs, trends, distribution, matrix, heatmap, conflicts, forecast, drilldown | TC-WKL-013 – 610 |
| 30 | Dashboard filters | Date range, team, workload, user, status, forecast toggle | TC-WKL-023 – 613 |
| 31 | Permissions | Manage teams and skills + two per-team flags + admin-only areas | TC-WKL-077 – 912 |
| 32 | Uninstallation | Migrate `VERSION=0`, remove the folder, restart | TC-WKL-040 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **Capacity arithmetic is the plugin's product.** Everything else — teams, skills, leave, holidays — exists to
  feed one number: how many hours a person actually has available. TC-WKL-095 to 409 build that number up one
  input at a time (base hours → weekends → holidays → leave → custom hours) precisely so that a wrong total can be
  attributed to a specific input rather than reported as "capacity looks off". A single blanket capacity check
  would be nearly useless for diagnosis.
- **The per-team permission flags are the most unusual part of the access model.** `Manage workload` and
  `Can approve leave` live on the **team membership**, not the role, so the same user legitimately has different
  rights in different teams. TC-WKL-079 and 904 test the negative half — the team the user does **not** hold the
  flag on — which is where a global-rather-than-per-team check would show up. That failure would let any workload
  manager approve leave and re-plan work for every team on the instance.
- **The active-holiday-scheme rule is a documented trap.** The KB lists "holidays are not reducing capacity" as a
  troubleshooting item whose cause is an inactive scheme. TC-WKL-070 verifies the rule deliberately, and
  TC-WKL-063 verifies that activating a scheme really does deactivate the previous one — if two ever end up
  active, capacity becomes non-deterministic.
- **Overload enforcement (TC-WKL-101) must be checked at the endpoint.** If the client blocks over-capacity
  allocation while the server accepts it, the setting is decorative and the plugin's core promise — detecting
  overload before it affects delivery — does not hold.
- **Recalculate Capacity is the reconciliation lever.** TC-WKL-108 changes an input and confirms the stored figures
  actually move; a recalculation that silently no-ops would leave managers planning against stale numbers.
- The KB's declared Redmine support (**5.0.x, 6.0.x, 6.1.x**) **omits 5.1.x**, which every other plugin in this
  set supports. Confirm on the instance rather than assuming it is a documentation slip.
