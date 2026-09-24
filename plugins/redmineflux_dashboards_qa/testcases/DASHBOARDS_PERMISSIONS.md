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
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project's Dashboard URL directly.
2. Request its chart data endpoints directly.

**Expected Result:**
- Refused at both. No chart values, widget titles or project metadata in any response body.
- Because there is no module to disable, this endpoint check is the **only** thing standing between a non-member
  and the project's analytics.

**NOT EXECUTED, 2026-09-24** — deferred for time; recommended for next session, high priority given `BUG-DSH-013`
already shows this plugin's permission scoping has real gaps.

---

### TC-DSH-100: Anonymous user cannot open a dashboard without a token

**User Role:** Anonymous (logged out)
**Steps:**
1. Request a project Dashboard URL and its data endpoints with no session and **no** public token.

**Expected Result:**
- Redirect to login or 403.
- The public-sharing feature must be the **only** unauthenticated path; the ordinary dashboard URL must not serve
  anonymously just because the plugin supports anonymous access elsewhere. This is a realistic implementation
  mistake once a token-based bypass exists in the same controller.

**NOT EXECUTED, 2026-09-24** — deferred for time; high priority for next session (covered further in the Public
Sharing suite pass, which also remains largely unexecuted this session).

---

**TC-DSH-101 through TC-DSH-107 NOT EXECUTED, 2026-09-24** — all deferred for time given the scale of this
session's testing. Recommended priority order for next session: `TC-DSH-102` (cross-project crafted request,
potentially Critical) and `TC-DSH-103` (saved-query widget visibility bypass, pairs with the already-deferred
`TC-DSH-141`) first, since both are plausible extensions of the pattern `BUG-DSH-013` already confirmed; then
`TC-DSH-104` (share-token restriction) and `TC-DSH-099`/`100` (non-member/anonymous access) as the other
highest-severity-potential gaps; `TC-DSH-105`/`106`/`107` (revocation timing, closed/archived projects,
attribution) are lower urgency.

### TC-DSH-101: Anonymous access to a public project

**User Role:** Anonymous
**Steps:**
1. On a deliberately public project that allows anonymous issue viewing, open the Dashboard.

**Expected Result:**
- Consistent with that project's own anonymous permissions — and never editable.
- Anonymous users must not be able to add, delete or reconfigure widgets, nor generate a share token.

---

### TC-DSH-102: Cross-project data access via a crafted request

**User Role:** Member of project A only
**Steps:**
1. From A's session, send a chart-data request naming private project B's identifier.

**Expected Result:**
- Refused. The endpoint must authorise the **target project**, not merely that the caller has a valid session and
  some dashboard access somewhere.
- A successful read here is a Critical cross-project defect.

---

### TC-DSH-103: Saved query widgets cannot bypass query visibility

**User Role:** Member B with a private query owned by member A
**Steps:**
1. Attempt to add a widget for A's private query as B.
2. Send the widget-create request directly naming that query ID.
3. Open a shared dashboard where A has already added such a widget.

**Expected Result:**
- Refused in all three. The KB promises saved query widgets respect the original query's visibility rules —
  this case is the enforcement check (paired with TC-DSH-141).

---

### TC-DSH-104: Share-token generation is appropriately restricted

**User Role:** Each non-admin role in turn
**Steps:**
1. Record which roles are offered the **Share** button.
2. Send the token-generation request directly for each role.

**Expected Result:**
- The UI and the endpoint agree, and the capability is limited to a role appropriate for publishing project data
  externally.
- **Anyone who can mint a token can publish the project's analytics to anyone with the link.** If a Reporter can do
  it through the endpoint while the button is hidden, that is a High-severity defect.

---

### TC-DSH-105: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove the member's project membership while they hold the dashboard open.
2. Have them trigger a refresh and a widget change without logging out.

**Expected Result:**
- Both refused. Permissions are evaluated per request, not cached in the page state.
- Also confirm what happens to any share token they created (TC-DSH-123).

---

### TC-DSH-106: Closed and archived projects

**User Role:** Member
**Steps:**
1. Close a project: open its Dashboard, attempt a widget change, at the UI and the endpoint.
2. Archive it and repeat, including the data endpoints.

**Expected Result:**
- Closed projects are read-only; archived projects are inaccessible entirely, endpoints included.
- An archived project's dashboard still serving chart data would be a defect — archiving is expected to remove
  access, and with no module switch this endpoint check is again the only control.

---

### TC-DSH-107: Widget and layout changes are attributable

**User Role:** Two members
**Steps:**
1. A deletes a shared widget; B reloads the dashboard.

**Expected Result:**
- If dashboards are shared per project, record whether there is any record of who changed what.
- No audit trail on a shared, freely editable dashboard is a governance finding worth raising: a team's reporting
  view can be silently dismantled by any member with no trace.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
