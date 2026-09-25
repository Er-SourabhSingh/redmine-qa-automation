# Bug Report Template

- Bug ID: BUG-DSH-013
- Production Redmine Issue ID: #121273
- Title: Dashboard chart widgets disclose the full, unrestricted project issue count to a role with maximally restricted issue visibility — a 725x aggregate data leak
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: **Summer Rain**, project role **"QA Own Visibility"** (a role restricted to only the issues she
  authored/is assigned to — confirmed via her own issue list)
- Date: 2026-09-24

## Steps to reproduce

1. As Admin, confirm the "test project" has 725 issues total (Last 30 days filter) and that member **Summer
   Rain** holds the role **"QA Own Visibility"** (Project → Settings → Members).
2. Log in as `summer.rain` / `12345678`.
3. As Summer Rain, open `Issues` on "test project" (no special filters, or explicitly `status=*` for all
   statuses) and note the pagination count.
4. As Summer Rain, open the project's **Dashboard** tab and note the totals shown by **Issues by Status**,
   **Issues by Assignee**, and **Issues Trend** (the exact three chart types `TC-DSH-096` specifies).
5. Compare the two counts.

## Expected result

- Per `TC-DSH-096` ("Totals match the user's own visible set exactly. A chart counting issues the user cannot open
  discloses the existence and volume of restricted work. High severity.") and the suite's own stated methodology
  ("Aggregate leg... A total larger than the user's own query returns is the evidence of a leak"), every dashboard
  chart's total should equal Summer Rain's own visible issue count.

## Actual result

- **Summer Rain's own issue list shows exactly `(1-1/1)` — 1 issue total**, across all statuses, with no special
  filter applied (confirmed both on the default Issues view and with an explicit `status_id=*` all-statuses
  filter). Her one visible issue is `#1558`, an issue she authored.
- **All three dashboard chart types tested show `725`** — the project's full, unrestricted issue count (identical
  to what Admin sees under the same "Last 30 days" filter) — not `1`:
  - **Issues by Status**: `New: 402, Closed: 126, Feedback: 125, In Progress: 65, Resolved: 5, Rejected: 2` (sum 725).
  - **Issues by Assignee**: `Redmine Admin: 2, Luna Blossom: 2, Unassigned: 721` (sum 725).
  - **Issues Trend**: sums to 725.
- This is a **725x aggregate over-disclosure** — Summer Rain, who can see exactly 1 issue in this project through
  every normal Redmine surface, is told via the dashboard that the project actually contains 725 issues, broken
  down by status and by assignee (including that "Redmine Admin" and "Luna Blossom" each have 2 assigned and 721
  are unassigned) — none of which she is otherwise entitled to know exists.
- **Mitigating factor found**: the **drill-down itself does not compound this into full record disclosure.**
  Clicking the "New" segment (402) opened a standard Redmine issue-list drill-down, which correctly enforced her
  real visibility and showed only her own 1 issue (`(1-1/1)`, issue `#1558`) — Redmine core's own issue-list
  permission check catches it at that layer. So the leak is the **aggregate counts and breakdowns only** — real
  issue subjects/IDs beyond her own are not exposed through this specific path — but the counts and per-assignee/
  per-status breakdown are themselves genuine restricted information being disclosed.
- **Positive-access check (`TC-DSH-095`) also confirmed in the same session**: Summer Rain can open the Dashboard
  tab at all (per the KB's documented "any user with access to the project can open the dashboard" — this part is
  working as documented; the defect is specifically in what the charts then show her).

## Evidence

### Screenshot

![Summer Rain (QA Own Visibility role) viewing the "Issues by Status" chart showing 725 total issues, while her own issue list shows exactly 1](../../screenshots/BUG-DSH-013/summer-rain-sees-full-725-total.png)

### Console / log

- As Summer Rain, `GET /projects/test-project/issues` (default view) and `GET
  /projects/test-project/issues?set_filter=1&f[]=status_id&op[status_id]=*` (explicit all-statuses): both
  `(1-1/1)`.
- As Summer Rain, dashboard `Chart.getChart()` reads: Issues by Status → `[402,126,125,65,5,2]` (sum 725);
  Issues by Assignee → `[2,2,721]` (sum 725); Issues Trend → sum 725.
- Drill-down on the "New" segment (402): opened `/projects/5/issues?...&f[]=created_on&...&f[]=status_id&
  op[status_id]=&v[status_id][]=1`, resulting page showed `(1-1/1)`, issue `#1558` — correctly restricted at the
  Redmine-core issue-list layer, confirming the leak is isolated to the chart aggregates themselves.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`.
  Superficially adjacent to `BUG-DSH-009`/`BUG-DSH-012` (both about the global *filter bar* not constraining a
  widget's data) but not the same defect class, and both of those were retracted 2026-09-24 as intentional design
  — see `bugs/_duplicates.md`. This bug is unrelated to filter-bar behavior: it's about the underlying query not
  being scoped to the viewer's issue-visibility permissions at all — a security defect, not a filtering-UX one.

## Retest — 2026-09-25

**FIXED.** Logged in as Summer Rain (QA Own Visibility role) on `redmine-docker-700`: her own issue list still
shows exactly `(1-1/1)`. Checked the dashboard's "Issues by Status" chart across all 4 duplicate instances of that
widget present on this heavily-reused dashboard (ids 121/122/135/139, each with a live Chart.js instance) — every
one now shows `total: 1`, `labels: ["New"]`, `data: [1]`, matching her real visible scope exactly, not the
project's full 725. Cross-checked "Issues by Assignee" (widget 98) the same way — `total: 1`, `["Unassigned"]:
[1]` — also correctly scoped now. The 725x aggregate over-disclosure no longer reproduces on any chart type
checked. Confirmed FIXED, ready to close.
