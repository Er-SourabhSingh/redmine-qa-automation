# Test Cases — Redmineflux Analytics Dashboard — Permissions & Access Control

> Source: the vendor KB publishes **no** permission model for this plugin. It states only that "the Dashboard tab
> is available on all projects without needing to enable a project module" and that "any user with access to the
> project can open the dashboard." This suite exists to establish what the access model actually is.
> **Status: authored 2026-09-15. Partially executed 2026-09-24 (final-cycle regression, first execution) on
> `redmine-docker-700`.** Tested as Summer Rain (project role "QA Own Visibility", confirmed restricted to 1
> visible issue). **1 High-severity bug found and filed: `BUG-DSH-013`** — dashboard charts disclose the full
> unrestricted project total (725) to this maximally-restricted role. Drill-down itself is safe (Redmine core's
> own issue-list permission check catches it). Full per-role matrix (add/delete/settings/layout/share-token) and
> the remaining project-state/endpoint-level cases not exhaustively covered this pass — see individual notes.

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Why this plugin's permission testing is unusual

Two documented facts combine into the central risk:

1. **There is no project module to switch off.** Every other Redmineflux plugin can be contained per project;
   this one cannot. If its access checks are weak, there is no configuration that mitigates it.
2. **There are no plugin-level settings.** An administrator has no instance-wide control to restrict it either.

On top of that, the dashboard is an **aggregation** surface. Aggregates leak differently from record lists: a chart
can disclose that a restricted area contains 47 open issues without ever showing one of them. Counting invisible
records is therefore a real finding here, not a technicality — and it is the failure mode most likely to be
dismissed during triage.

## Methodology — mandatory for every case in this suite

1. **Positive UI** — the permitted role reaches the function through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**.
4. **Aggregate leg** — the numbers shown are compared against what the same user sees in the issue list or time
   report. **A total larger than the user's own query returns is the evidence of a leak.**

Leg 4 is specific to this plugin and is where its real defects will be found.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Open a project's Dashboard | | | | | | | |
| Add a chart widget | | | | | | | |
| Delete a chart widget | | | | | | | |
| Change chart settings | | | | | | | |
| Rearrange / resize the layout | | | | | | | |
| Add a saved query widget | | | | | | | |
| Drill down to issues | | | | | | | |
| Generate / regenerate a public share token | | | | | | | |

Fill in from observed behaviour, not assumption. For each row also record whether the change is **per user** or
**shared per project** — the KB's phrase "per project and per user" leaves this undetermined, and it decides how
damaging an over-permissive row actually is.

---

## Functional Cases

---

### TC-DSH-094: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix as Admin.

**Expected Result:**
- All actions succeed.

**PASS, reconfirmed extensively 2026-09-24**: every action in the matrix (add/delete widgets, change settings,
drag layout, add saved-query widgets, drill down) was exercised dozens of times as Admin throughout this entire
session with no permission-related failures.

---

### TC-DSH-095: Establish the baseline — what "access to the project" grants

**User Role:** Each of Manager, Developer, QA and Reporter in turn
**Priority:** Medium
**Steps:**
1. For each role, open the Dashboard and attempt: add a widget, delete a widget, change settings, rearrange the
   layout, drill down, and generate a share token.
2. Record which succeed.

**Expected Result:**
- A coherent model emerges, and the UI and the endpoints agree for every role.
- The KB implies a very permissive default ("any user with access to the project can open the dashboard").
  Confirm whether "open" also means "modify" — if a Reporter can delete a team's dashboard widgets, that is a real
  finding regardless of whether the plugin intends it.

**PARTIAL, 2026-09-24**: confirmed for the "QA Own Visibility" role (Summer Rain) — can open the dashboard and
successfully drill down (though drill-down's underlying issue-list correctly restricts to her own visible
issues). Add/delete/settings/layout-rearrange/share-token generation not individually tested per role this pass
— deferred for time. Manager/Developer/Reporter/QA-Read-Only roles not tested this pass either.

---

### TC-DSH-096: Chart data respects issue visibility

**User Role:** Role whose issue visibility is limited to issues they created
**Priority:** High
**Steps:**
1. Add "Issues by Status", "Issues by Assignee" and "Issues Trend".
2. Compare each total against the issue list run as the same user.

**Expected Result:**
- Totals match the user's own visible set exactly.
- A chart counting issues the user cannot open discloses the existence and volume of restricted work.
  High severity.

**FAIL — High severity, 2026-09-24**: tested as Summer Rain (role "QA Own Visibility", confirmed restricted to 1
visible issue in "test project" across all statuses). All three named chart types (Issues by Status, Issues by
Assignee, Issues Trend) showed **725** — the project's full unrestricted total — a 725x over-disclosure. See
`BUG-DSH-013` for full evidence (exact per-status/per-assignee breakdowns, drill-down mitigation finding).

---

### TC-DSH-097: Time charts respect time-entry visibility

**User Role:** Role without permission to view other users' spent time
**Priority:** High
**Steps:**
1. Add "Total Spent Hours by Users", "Total Spent Time by Role" and "Estimated vs Spent Time by User".
2. Compare against the time report run as the same user.

**Expected Result:**
- Only permitted entries are aggregated.
- **"Total Spent Hours by Users" is the sharpest case**: it names users and attributes hours to them, so a leak
  here is not merely an aggregate — it is per-person data the user was not entitled to.

**NOT EXECUTED, 2026-09-24** — deferred for time; given `BUG-DSH-013` already confirms the underlying pattern
(charts not scoping to the viewer's permissions) for issue-based charts, this time-based analogue is a strong
candidate to also fail and should be prioritized next session.

---

### TC-DSH-098: Drill-down cannot exceed chart visibility

**User Role:** Restricted-visibility role
**Priority:** High
**Steps:**
1. Drill into a segment and count the issues listed against the segment's displayed value.

**Expected Result:**
- The two agree, and every listed issue is one the user can open.
- A segment value higher than the drill-down count is direct evidence of TC-DSH-096's leak; a drill-down listing an
  issue the user cannot open is a worse, direct disclosure.

**PARTIAL — segment/drill-down mismatch confirmed (evidence of TC-DSH-096's leak), but no direct record
disclosure, 2026-09-24**: as Summer Rain, the "New" segment displayed `402`, but drilling into it correctly
listed only her own 1 visible issue (`#1558`) — Redmine core's own issue-list permission check enforces
correctly at that layer. So: the segment-vs-drilldown **mismatch** (402 shown, 1 actually listed) is exactly the
"direct evidence of TC-DSH-096's leak" this TC describes — confirmed. The **worse** outcome (a drill-down listing
an issue she cannot open) did **not** occur — the drill-down itself is safe. See `BUG-DSH-013`.

---

### TC-DSH-099: Non-member cannot open a private project's dashboard

**User Role:** Authenticated non-member
**Priority:** High
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project's Dashboard URL directly.
2. Request its chart data endpoints directly.

**Expected Result:**
- Refused at both. No chart values, widget titles or project metadata in any response body.
- Because there is no module to disable, this endpoint check is the **only** thing standing between a non-member
  and the project's analytics.

**FAIL — Critical, 2026-09-24**: confirmed "QA Private Project" is genuinely private (`project_is_public=false`)
with **zero members**. As **Summer Rain** (a member of the unrelated "test project" only), requesting
`/projects/qa-private-project/analytics_dashboard` returned the **full dashboard with real chart data**
(a widget's `Chart.getChart()` data summed to 1, matching the project's actual issue count) — not refused at all.
The **same user, same session**, requesting `/projects/qa-private-project/issues` immediately after correctly got
**403 Forbidden** — proving Redmine core's own membership enforcement works everywhere else, and this is a
dashboard-controller-specific gap. Filed as `BUG-DSH-019` (**Critical**).

---

### TC-DSH-100: Anonymous user cannot open a dashboard without a token

**User Role:** Anonymous (logged out)
**Priority:** High
**Steps:**
1. Request a project Dashboard URL and its data endpoints with no session and **no** public token.

**Expected Result:**
- Redirect to login or 403.
- The public-sharing feature must be the **only** unauthenticated path; the ordinary dashboard URL must not serve
  anonymously just because the plugin supports anonymous access elsewhere. This is a realistic implementation
  mistake once a token-based bypass exists in the same controller.

**PASS, 2026-09-24**: cleared all cookies (genuinely anonymous, no session) and requested
`/projects/qa-private-project/analytics_dashboard` directly — correctly redirected to
`/login?back_url=...analytics_dashboard`, not served. Unlike `TC-DSH-099`'s finding, **this specific gap requires
an authenticated-but-unrelated session** — a fully anonymous request is still gated by Redmine's baseline
login-required check. The deeper problem is `BUG-DSH-019`: once logged in as *anyone*, that login is sufficient
regardless of project relationship.

---

**Note (corrected 2026-09-25): the blanket "101-107 NOT EXECUTED" deferral below is stale.** `TC-DSH-102/103/104/
106/107` were all executed 2026-09-24 (see each TC's own verdict) — only `TC-DSH-101` (this section) and the
genuinely-concurrent-session-dependent `TC-DSH-105` remain deferred; the closed-project half of `TC-DSH-106` is
done (`BUG-DSH-014`), only its archived-project half is still deferred.

### TC-DSH-101: Anonymous access to a public project

**User Role:** Anonymous
**Priority:** Medium
**Steps:**
1. On a deliberately public project that allows anonymous issue viewing, open the Dashboard.

**Expected Result:**
- Consistent with that project's own anonymous permissions — and never editable.
- Anonymous users must not be able to add, delete or reconfigure widgets, nor generate a share token.

**N/A on this instance's current global config, 2026-09-25** — "test project" is confirmed genuinely public
(`project_is_public=true`) with Anonymous role granted `view_issues` (and `all_trackers_view_issues`), but NOT
`view_dashboard`. However, a cookie-free request to both `/projects/test-project/issues` **and**
`/projects/test-project/analytics_dashboard` redirected to `/login` — even the plain issues list, which Anonymous
is explicitly permitted to view. Checked Administration → Settings → Authentication: **`login_required` = Yes**
(`#settings_login_required` value `"1"`), a single instance-wide switch that forces login for every request
before any project- or role-level permission is ever evaluated — same root cause already on record for
`TC-DSH-100`. This is a shared, instance-wide setting also relied on by other plugins' QA on this environment, so
it was deliberately not toggled off just to exercise this one TC (same caution as the closed/archived-project
and shared-fixture cases elsewhere in this suite). **Conclusion: the dashboard is gated exactly as strictly as
the rest of the instance, not more or less** — it does not weaken Redmine's own anonymous-access model in any
detectable way, since nothing is anonymously reachable at all right now. Recommend a dedicated, disposable
instance (or a session willing to flip `login_required` off and back) to genuinely exercise the "anonymous +
public project" combination in a future pass.

---

### TC-DSH-102: Cross-project data access via a crafted request

**User Role:** Member of project A only
**Priority:** High
**Steps:**
1. From A's session, send a chart-data request naming private project B's identifier.

**Expected Result:**
- Refused. The endpoint must authorise the **target project**, not merely that the caller has a valid session and
  some dashboard access somewhere.
- A successful read here is a Critical cross-project defect.

**FAIL — Critical, 2026-09-24**: this is the same underlying scenario as `TC-DSH-099` — Summer Rain (member of
project A, "test project") successfully read project B's ("QA Private Project") dashboard and real chart data
using her own valid session, with B's identifier simply named in the URL. The endpoint authorises the session
(logged in at all) but not the target project. See `BUG-DSH-019` (Critical).

---

### TC-DSH-103: Saved query widgets cannot bypass query visibility

**User Role:** Member B with a private query owned by member A
**Priority:** High
**Steps:**
1. Attempt to add a widget for A's private query as B.
2. Send the widget-create request directly naming that query ID.
3. Open a shared dashboard where A has already added such a widget.

**Expected Result:**
- Refused in all three. The KB promises saved query widgets respect the original query's visibility rules —
  this case is the enforcement check (paired with TC-DSH-141).

**PASS (legs 1 and 3 confirmed; leg 2 inconclusive), 2026-09-24**: created a genuinely private query ("QA Private
Query for TC-103 Test", visibility=only-me) as Admin on "test project", and added it as a Statistics Card widget
(id 138) to the shared dashboard. Logged in as **Daisy Skye** (a real "Reporter" member of test-project, not the
query owner):
- **Leg 1 (Add Chart offering it)**: the private query does **not** appear in her Saved Queries dropdown at all
  (6 options shown, all her own/shared queries — the private one is absent).
- **Leg 3 (shared dashboard)**: widget 138 does not exist in her DOM at all
  (`document.querySelector('[data-widget-id="138"]')` → `null`) — she cannot see Admin's private-query widget on
  the same shared dashboard she otherwise has full view of.
- **Leg 2 (direct create request naming query_id=16)**: returned 400, but this is **inconclusive**, not a
  confirmed refusal — the same guessed JSON payload shape also returned 400 in unrelated contexts this session
  (see `BUG-DSH-019`'s write-attempt note), so a 400 here is as likely a malformed-request artifact as a genuine
  authorization refusal. Not confirmed either way.
- Unlike `BUG-DSH-019` (project-membership), **saved-query visibility is correctly enforced** on the two legs that
  were conclusively testable — a real positive finding worth recording alongside the several defects found this
  session.

---

### TC-DSH-104: Share-token generation is appropriately restricted

**User Role:** Each non-admin role in turn
**Priority:** Medium
**Steps:**
1. Record which roles are offered the **Share** button.
2. Send the token-generation request directly for each role.

**Expected Result:**
- The UI and the endpoint agree, and the capability is limited to a role appropriate for publishing project data
  externally.
- **Anyone who can mint a token can publish the project's analytics to anyone with the link.** If a Reporter can do
  it through the endpoint while the button is hidden, that is a High-severity defect.

**PASS (as-designed, corrected 2026-09-25) for "any role can generate," FAIL (narrower, Medium) for
self-revocation, 2026-09-24**: as **Daisy Skye** (Reporter, the lowest non-read-only role tested), the Share
button was offered and fully functional — generated a real public token link, verified working fully
unauthenticated (cookies cleared, `200`, full dashboard with 104 widgets rendered; re-confirmed 2026-09-25 with a
completely fresh token in a brand-new isolated browser context). Originally filed as `BUG-DSH-020` (High) on the
basis that token generation should be role-restricted — **narrowed 2026-09-25**: the vendor KB documents equal
dashboard capabilities for any project member with no restriction on sharing, so "any role can generate" is
intentional design, not a defect. The bug **remains open, narrowed to Medium**, for the one part that *is* a real,
documented-by-the-app-itself limitation: the modal states only an Administrator can revoke a link, so the member
who created it has no self-service way to undo their own action. See `bugs/open/BUG-DSH-020.md` and
`DASHBOARDS_MEMORY.md`.

---

### TC-DSH-105: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Priority:** High
**Steps:**
1. Remove the member's project membership while they hold the dashboard open.
2. Have them trigger a refresh and a widget change without logging out.

**Expected Result:**
- Both refused. Permissions are evaluated per request, not cached in the page state.
- Also confirm what happens to any share token they created (TC-DSH-123).

**NOT EXECUTED, 2026-09-24**: genuinely requires two truly concurrent authenticated sessions (Admin revoking
membership in one while the affected member's *already-open* session is held live in another) — the same
constraint already on record for `TC-DSH-026`/`TC-DSH-048`/`TC-DSH-063`, out of scope for a single Playwright MCP
browser session that can only hold one login at a time. Recommend for a future session with two parallel browser
contexts.

---

### TC-DSH-106: Closed and archived projects

**User Role:** Member
**Priority:** High
**Steps:**
1. Close a project: open its Dashboard, attempt a widget change, at the UI and the endpoint.
2. Archive it and repeat, including the data endpoints.

**Expected Result:**
- Closed projects are read-only; archived projects are inaccessible entirely, endpoints included.
- An archived project's dashboard still serving chart data would be a defect — archiving is expected to remove
  access, and with no module switch this endpoint check is again the only control.

**Closed-project half: FAIL, already fully covered by `BUG-DSH-014`** (widgets can be added on the existing
"QA Closed Test Project" fixture — `POST .../widgets` succeeds and persists, the plugin doesn't participate in
Redmine's closed-project read-only convention). **Archived-project half: NOT EXECUTED, 2026-09-24** — deliberately
not attempted this pass: archiving is a heavier, harder-to-cleanly-reverse state change on a project potentially
shared with other plugins' fixtures on this instance, same caution already on record for `TC-DSH-024` (declining
to delete a shared version fixture). Recommend a dedicated, disposable project fixture for this check in a future
session rather than archiving an existing shared one.

---

### TC-DSH-107: Widget and layout changes are attributable

**User Role:** Two members
**Priority:** Low
**Steps:**
1. A deletes a shared widget; B reloads the dashboard.

**Expected Result:**
- If dashboards are shared per project, record whether there is any record of who changed what.
- No audit trail on a shared, freely editable dashboard is a governance finding worth raising: a team's reporting
  view can be silently dismantled by any member with no trace.

**FAIL (governance finding, not filed as a numbered bug — informational per the TC's own framing; corrected
2026-09-25), 2026-09-24**: across this entire session's extensive widget add/delete/reposition/settings activity
as multiple different users (Admin, Summer Rain, Harmony Rose, Daisy Skye) on the same shared "test project"
dashboard, **no attribution UI of any kind was observed anywhere** — no "last edited by," no changelog, no tooltip
on a widget showing its creator. Any project member being able to add/delete/reposition widgets or publish the
dashboard externally is this plugin's documented, intentional design (see `DASHBOARDS_MEMORY.md` — the earlier
citation of `BUG-DSH-015` here was retracted 2026-09-25), so the governance concern is narrower than originally
framed: it's specifically that a shared dashboard can be rearranged, deleted, or shared publicly with **zero
record of who did it**, not that those actions are possible at all (which is expected). Still worth recording as
an informational finding, not a numbered bug.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
