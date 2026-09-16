# Test Cases — Redmineflux Analytics Dashboard — Token-Based Public Sharing

> Source: vendor KB — "How to Share and Access a Public Dashboard", Troubleshooting ("If a public link returns a
> not found error…"), FAQ Q4, Q10.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Why this suite matters more than the others

This feature deliberately serves **project data to unauthenticated visitors**. It is the only place in the whole
Redmineflux plugin set where a URL bypasses Redmine's login entirely. Every finding here is therefore a candidate
for High or Critical severity, and "it looks read-only" is not evidence of anything — the checks below are about
what the public endpoint actually returns.

The KB's stated contract for the public view is precise, and each clause is a testable assertion:

1. Opens read-only with **no authentication required**.
2. Shows the **same layout and chart data** as the saved dashboard.
3. **Hides** edit controls, filter inputs and settings.
4. Supports **auto-refresh**.
5. Applies saved dashboard preferences and per-chart custom dates.
6. Returns **not found** if the token is invalid or revoked.
7. Regenerating the token **immediately** stops the previous link working.

---

## Functional Cases

---

### TC-DSH-701: Generate a public link

**User Role:** Member with sharing rights
**Steps:**
1. Open the dashboard and click **Share**.
2. Copy the generated URL from the modal.

**Expected Result:**
- A unique token and URL are generated and displayed for copying.
- The token is long and random enough not to be guessable — record its length and character set. A short or
  sequential token would make every shared dashboard on the instance enumerable, which is a Critical finding in
  itself.

---

### TC-DSH-702: Public link opens without authentication

**User Role:** Unauthenticated visitor (use a private window or a separate browser with no Redmine session)
**Steps:**
1. Open the public URL.

**Expected Result:**
- The dashboard renders read-only with no login prompt, per the KB.
- Confirm there is genuinely no session — testing this while still logged in proves nothing and is the easiest way
  to get a false pass on this entire suite.

---

### TC-DSH-703: Public view shows the same layout and data

**User Role:** Unauthenticated visitor
**Steps:**
1. Compare the public view side by side with the authenticated dashboard.

**Expected Result:**
- Same widgets, same positions, same sizes, same numbers.

---

### TC-DSH-704: Saved preferences and per-chart dates are applied

**User Role:** Unauthenticated visitor
**Steps:**
1. Set a distinctive global date range and a per-chart custom range, then open the public link.

**Expected Result:**
- Both are reflected in the public view, per the KB.

---

### TC-DSH-705: Edit controls, filters and settings are hidden

**User Role:** Unauthenticated visitor
**Steps:**
1. Inspect the public view for: Add Chart, the settings icon, delete and copy icons, the global filter bar,
   Apply Filters, and drag/resize handles.

**Expected Result:**
- None are present, per the KB.
- Absence in the UI is necessary but not sufficient — TC-DSH-711 tests the endpoints behind them.

---

### TC-DSH-706: Auto-refresh works in the public view

**User Role:** Unauthenticated visitor
**Steps:**
1. Enable or observe auto-refresh in the public view and change underlying data in Redmine.

**Expected Result:**
- The public view updates at the configured interval, per the KB and FAQ Q10.

---

### TC-DSH-707: Regenerating the token revokes the old link immediately

**User Role:** Member, then unauthenticated visitor
**Steps:**
1. Note the current public URL and confirm it works.
2. Regenerate the token from the Share dialog.
3. Retry the **old** URL, then the new one.

**Expected Result:**
- The old URL returns **not found immediately** — the KB says the previous link "will stop working immediately".
- The new URL works.
- Any grace period, caching, or continued service of the old token is a real revocation defect: revocation is the
  only control the owner has once a link has been shared.

---

### TC-DSH-708: Invalid token returns not found

**User Role:** Unauthenticated visitor
**Steps:**
1. Request the public URL with a malformed token, a truncated token, and another dashboard's token altered by one
   character.

**Expected Result:**
- A not-found response in every case, per the KB.
- The response must **not** reveal whether the dashboard exists, which project it belongs to, or any project name
  — an error page that names the project already leaks.

---

## Negative Cases — the ones that matter

---

### TC-DSH-709: The public view must not leak data beyond its charts

**User Role:** Unauthenticated visitor
**Steps:**
1. With the public dashboard open, inspect the **network responses**, not just the rendered page: the payload
   feeding each chart, and any accompanying metadata.

**Expected Result:**
- Responses contain only the aggregate values needed to draw the charts.
- **They must not contain issue subjects, issue IDs, user names, email addresses, or raw record lists.** A chart
  that renders counts while its JSON payload ships the underlying issues is a Critical leak, and it is completely
  invisible from the rendered page — which is exactly why this case exists.

---

### TC-DSH-710: Drill-down must not work unauthenticated

**User Role:** Unauthenticated visitor
**Steps:**
1. Click chart segments in the public view.
2. Send the drill-down request **directly** with the public token and no session.

**Expected Result:**
- No issue list is returned. Drill-down turns a summary into full issue disclosure, so it must be unavailable or
  strictly limited here.
- A working unauthenticated drill-down is **Critical** (paired with TC-DSH-520).

---

### TC-DSH-711: The public token must not authorise writes

**User Role:** Unauthenticated visitor
**Steps:**
1. Using the public token and no session, send requests **directly** for: create widget, delete widget, update
   chart settings, save layout, change global filters, and regenerate the share token.

**Expected Result:**
- Every one refused.
- The KB promises a read-only view; this case verifies that the token confers **read** and nothing else. A public
  token that can delete a widget — or worse, regenerate its own replacement — would be Critical.

---

### TC-DSH-712: The public token must not reach other projects

**User Role:** Unauthenticated visitor
**Steps:**
1. With a valid token for project A's dashboard, attempt to request data for project B by substituting the project
   identifier in the request while keeping the token.

**Expected Result:**
- Refused. The token authorises exactly one dashboard, not "unauthenticated access" in general.
- A token that becomes a general-purpose read key for the instance would be the worst possible outcome of this
  feature and is worth testing explicitly rather than assuming.

---

### TC-DSH-713: Charts must not expose data the sharer could not see

**User Role:** Member with restricted visibility, then unauthenticated visitor
**Steps:**
1. Have a restricted-visibility member generate a public link.
2. Compare the public view's numbers against a link generated by a full-access member.

**Expected Result:**
- The public view shows no more than the dashboard's own data as scoped by the plugin's permission model.
- Establish and record which scope applies — the sharer's, or the project's full data. **If a limited user's share
  link exposes the project's complete figures, sharing becomes a privilege-escalation path**, and the KB says
  nothing about this at all.

---

### TC-DSH-714: Sharing requires permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether the **Share** button is offered.
2. Send the token-generation request **directly**.

**Expected Result:**
- Consistent with the permission model, enforced at the endpoint.
- **Any user who can generate a token can publish that project's analytics to the open internet.** If this is not
  restricted to an appropriate role, that is a High-severity finding even if every other case passes.

---

### TC-DSH-715: Token survival across project state changes

**User Role:** Member + Admin, then unauthenticated visitor
**Steps:**
1. Generate a public link, then in turn: close the project, archive the project, and make the project private if
   it was public. Retry the link after each.

**Expected Result:**
- Record the behaviour at each step. An **archived** project's data still being served publicly is a clear defect,
  since archiving is expected to remove access entirely.
- Making a project private without invalidating existing public links is a defensible design, but it must be
  documented — an administrator locking down a project would reasonably expect the public link to die with it.

---

### TC-DSH-716: Token survival after the sharer loses access

**User Role:** Admin + unauthenticated visitor
**Steps:**
1. Member A generates a public link. Remove A's membership of the project entirely.
2. Retry the public link.

**Expected Result:**
- Record whether the link still serves data.
- A link that outlives its creator's access is a real governance gap: a departing employee's share link would keep
  publishing project analytics indefinitely. Whatever the behaviour, it belongs in the plugin memory file.

---

### TC-DSH-717: Token is not discoverable from the authenticated UI by others

**User Role:** Another project member
**Steps:**
1. Check whether other members can read the existing token from the Share dialog or from any response body.

**Expected Result:**
- Record who can see an existing token. Anyone who can read it can redistribute the dashboard publicly without
  leaving a trace of having done so.

---

### TC-DSH-718: Search engine and referrer exposure

**User Role:** Unauthenticated visitor
**Steps:**
1. Inspect the public page's response headers and markup for indexing controls.

**Expected Result:**
- Record whether a `noindex` directive is present.
- A public dashboard URL with no indexing protection can be crawled and indexed, turning "anyone with the link"
  into "anyone searching" — worth recording as a finding even though it is not a code defect.

---

### TC-DSH-719: Public view under load

**User Role:** Unauthenticated visitor
**Steps:**
1. Open the public dashboard with auto-refresh at 30 seconds in several browser windows simultaneously.

**Expected Result:**
- The instance serves them without degradation, and the endpoint is rate-limited or otherwise protected.
- An unauthenticated, auto-refreshing, query-heavy endpoint is a denial-of-service surface — record whether any
  throttling exists.

---

### TC-DSH-720: Script content reaches the public view

**User Role:** Member, then unauthenticated visitor
**Steps:**
1. Set a chart title containing a script tag, then open the public link.

**Expected Result:**
- Escaped and inert. **No script executes for the unauthenticated viewer** — this is the most exposed rendering
  surface in the entire plugin set and execution here would be Critical (paired with TC-DSH-215).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
