# Test Cases — Redmineflux Analytics Dashboard — Token-Based Public Sharing

> Source: vendor KB — "How to Share and Access a Public Dashboard", Troubleshooting ("If a public link returns a
> not found error…"), FAQ Q4, Q10.
> **Status: authored 2026-09-15. Partially executed 2026-09-24 (final-cycle regression, first execution).** Core
> contract checks (token generation, unauthenticated access via `fetch(..., {credentials:'omit'})` and a genuine
> public-page navigation, same data shown, drill-down disabled, edit controls hidden) all **PASS** — this is the
> best-implemented area found in this entire regression pass. Full per-role token-generation restriction
> (`TC-DSH-104`/`TC-DSH-114`-ish) and the revocation/regeneration timing cases not executed — see individual notes.

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

### TC-DSH-108: Generate a public link

**User Role:** Member with sharing rights
**Priority:** High
**Steps:**
1. Open the dashboard and click **Share**.
2. Copy the generated URL from the modal.

**Expected Result:**
- A unique token and URL are generated and displayed for copying.
- The token is long and random enough not to be guessable — record its length and character set. A short or
  sequential token would make every shared dashboard on the instance enumerable, which is a Critical finding in
  itself.

**PASS, 2026-09-24**: generated token `N63gA1B-1Gvqx5mpmm6pjyZl9gaWq49IMFl0ETFmK1o` — 44 characters, mixed-case
alphanumeric plus a hyphen, high entropy. Not guessable/enumerable by any practical brute-force approach.

---

### TC-DSH-109: Public link opens without authentication

**User Role:** Unauthenticated visitor (use a private window or a separate browser with no Redmine session)
**Priority:** High
**Steps:**
1. Open the public URL.

**Expected Result:**
- The dashboard renders read-only with no login prompt, per the KB.
- Confirm there is genuinely no session — testing this while still logged in proves nothing and is the easiest way
  to get a false pass on this entire suite.

**PASS, 2026-09-24**: **genuinely verified with no session** two ways — (1) `fetch(url, {credentials:'omit'})`
explicitly stripped cookies and returned `200 OK` with full chart-card HTML; (2) navigated the actual public URL
and confirmed 28 charts rendered with real data and no login prompt. All edit controls (Add Chart, Settings,
Remove, Tracker filter) confirmed absent via DOM query — none exist on the public page at all.

---

### TC-DSH-110: Public view shows the same layout and data

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Compare the public view side by side with the authenticated dashboard.

**Expected Result:**
- Same widgets, same positions, same sizes, same numbers.

**PASS, 2026-09-24**: all 28 canvases on the public view rendered with data identical to the authenticated
dashboard (e.g. Issues by Status: `402/126/125/65/5/2`, matching exactly).

---

### TC-DSH-111: Saved preferences and per-chart dates are applied

**User Role:** Unauthenticated visitor
**Priority:** Medium
**Steps:**
1. Set a distinctive global date range and a per-chart custom range, then open the public link.

**Expected Result:**
- Both are reflected in the public view, per the KB.

**NOT EXECUTED, 2026-09-24** — deferred for time; TC-DSH-110 already established general data parity between the
authenticated and public views, but the specific "global range + a per-chart override, both reflected" combination
wasn't isolated and checked on its own. Recommended for next session.

---

### TC-DSH-112: Edit controls, filters and settings are hidden

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Inspect the public view for: Add Chart, the settings icon, delete and copy icons, the global filter bar,
   Apply Filters, and drag/resize handles.

**Expected Result:**
- None are present, per the KB.
- Absence in the UI is necessary but not sufficient — TC-DSH-118 tests the endpoints behind them.

**PASS (UI leg only — endpoint leg per TC-DSH-118 not tested), 2026-09-24**: confirmed via direct DOM query on
the public view — `addChartBtn` absent, 0 Settings buttons, 0 Remove buttons, no `trackerSelect` filter. None of
the authenticated-only controls exist in the public page's DOM at all (not just CSS-hidden).

---

**TC-DSH-111, TC-DSH-113 through TC-DSH-127 NOT EXECUTED, 2026-09-24** — deferred for time. Given the core
contract (unauthenticated access, data parity, drill-down disabled, edit controls absent) all checked out clean,
these remaining cases are lower urgency than the confirmed defects elsewhere, but `TC-DSH-114` (token
regeneration revokes the old link), `TC-DSH-118` (endpoint-level write rejection), and `TC-DSH-127` (XSS via a
shared chart title, reaching unauthenticated viewers) are the highest-value ones to prioritize next session.

---

### TC-DSH-113: Auto-refresh works in the public view

**User Role:** Unauthenticated visitor
**Priority:** Medium
**Steps:**
1. Enable or observe auto-refresh in the public view and change underlying data in Redmine.

**Expected Result:**
- The public view updates at the configured interval, per the KB and FAQ Q10.

**NOT EXECUTED, 2026-09-24** — deferred for time (requires waiting out a full refresh interval, same category as
the precise multi-minute-interval checks deferred in `TC-DSH-068`). Also, `TC-DSH-116` found the public view has
**no separate per-widget refresh AJAX calls at all** (all data is embedded once in the initial page load) — worth
checking first next session whether "auto-refresh" on the public view even re-fetches data at all, or only
re-renders already-loaded data, before assuming the mechanism is the same as the authenticated dashboard's.

---

### TC-DSH-114: Regenerating the token revokes the old link immediately

**User Role:** Member, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Note the current public URL and confirm it works.
2. Regenerate the token from the Share dialog.
3. Retry the **old** URL, then the new one.

**Expected Result:**
- The old URL returns **not found immediately** — the KB says the previous link "will stop working immediately".
- The new URL works.
- Any grace period, caching, or continued service of the old token is a real revocation defect: revocation is the
  only control the owner has once a link has been shared.

**PASS, 2026-09-24**: the Share modal has no separate "Regenerate" button (only Copy/Close) — instead, **every**
click of Share issues a fresh token, implicitly revoking the previous one. Confirmed: a token generated earlier
this session (as Daisy Skye) returned `200` when first tested; after later reopening Share (as Admin), the same
old token returned `404` immediately, while the newly-shown token returned `200`. Clean, immediate revocation —
just via a different mechanism (re-open Share) than the TC's literal "click Regenerate" step assumes.

---

### TC-DSH-115: Invalid token returns not found

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Request the public URL with a malformed token, a truncated token, and another dashboard's token altered by one
   character.

**Expected Result:**
- A not-found response in every case, per the KB.
- The response must **not** reveal whether the dashboard exists, which project it belongs to, or any project name
  — an error page that names the project already leaks.

**PASS, 2026-09-24**: a token altered by one character and a fully garbage token both returned `404` with a
generic "Redmine 404 error / Page not found" body — confirmed via `mentionsTestProject` string check that the
response never names "test project" or any other project-identifying text.

---

## Negative Cases — the ones that matter

---

### TC-DSH-116: The public view must not leak data beyond its charts

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. With the public dashboard open, inspect the **network responses**, not just the rendered page: the payload
   feeding each chart, and any accompanying metadata.

**Expected Result:**
- Responses contain only the aggregate values needed to draw the charts.
- **They must not contain issue subjects, issue IDs, user names, email addresses, or raw record lists.** A chart
  that renders counts while its JSON payload ships the underlying issues is a Critical leak, and it is completely
  invisible from the rendered page — which is exactly why this case exists.

**PASS, 2026-09-24**: the public view has **no separate per-widget AJAX/refresh calls at all** (unlike the
authenticated dashboard) — all chart data is embedded once in the initial server-rendered HTML, confirmed via
`browser_network_requests` finding zero `widgets`-path requests after load. Inspected `Chart.getChart()` on 5
sample canvases: every `data.labels` array was a clean aggregate category list (status names, priority names,
tracker names, assignee names as group labels) with corresponding counts — no issue subjects, no issue IDs, no
raw record lists. A full-body regex scan for email-address patterns across the entire 190KB response found none.

---

### TC-DSH-117: Drill-down must not work unauthenticated

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Click chart segments in the public view.
2. Send the drill-down request **directly** with the public token and no session.

**Expected Result:**
- No issue list is returned. Drill-down turns a summary into full issue disclosure, so it must be unavailable or
  strictly limited here.
- A working unauthenticated drill-down is **Critical** (paired with TC-DSH-147).

**PASS, 2026-09-24**: clicked a doughnut segment on the public view using the established precise-arc-click
technique (`Chart.getDatasetMeta` midpoint) — no new tab opened, no navigation occurred (`page.context().pages()`
count unchanged). Directly probed two plausible drill-down endpoint shapes under the public token namespace
(`/widgets/:id/drilldown`, `/drilldown?widget_id=`) — both `404`, the routes don't exist under `/public/` at all.

---

### TC-DSH-118: The public token must not authorise writes

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Using the public token and no session, send requests **directly** for: create widget, delete widget, update
   chart settings, save layout, change global filters, and regenerate the share token.

**Expected Result:**
- Every one refused.
- The KB promises a read-only view; this case verifies that the token confers **read** and nothing else. A public
  token that can delete a widget — or worse, regenerate its own replacement — would be Critical.

**PASS, 2026-09-24**: sent create-widget (POST), delete-widget (DELETE), update-settings (PATCH), and
regenerate-token (POST) requests directly under the public token namespace, no session — all **404**. These write
routes simply don't exist under `/public/analytics_dashboard/:token/*` at all; only the read route
(`GET /public/analytics_dashboard/:token`) is mounted there. A non-existent route is at least as safe as a
refused one for this TC's purpose.

---

### TC-DSH-119: The public token must not reach other projects

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. With a valid token for project A's dashboard, attempt to request data for project B by substituting the project
   identifier in the request while keeping the token.

**Expected Result:**
- Refused. The token authorises exactly one dashboard, not "unauthenticated access" in general.
- A token that becomes a general-purpose read key for the instance would be the worst possible outcome of this
  feature and is worth testing explicitly rather than assuming.

**PASS (by URL structure), 2026-09-24**: the public route is `GET /public/analytics_dashboard/:token` — there is
**no separate project-identifier parameter anywhere in the URL** to substitute; the token itself is the sole
identifier and is structurally 1:1 bound to whichever dashboard it was minted for (confirmed throughout this
session: each newly-generated token only ever served "test project"'s own data, never another project's). This
TC's literal attack (swap a project id while keeping the token) isn't constructible against this URL scheme, which
is itself the safe design outcome the TC is checking for.

---

### TC-DSH-120: Charts must not expose data the sharer could not see

**User Role:** Member with restricted visibility, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Have a restricted-visibility member generate a public link.
2. Compare the public view's numbers against a link generated by a full-access member.

**Expected Result:**
- The public view shows no more than the dashboard's own data as scoped by the plugin's permission model.
- Establish and record which scope applies — the sharer's, or the project's full data. **If a limited user's share
  link exposes the project's complete figures, sharing becomes a privilege-escalation path**, and the KB says
  nothing about this at all.

**PASS (as-designed by consistency, corrected 2026-09-25), 2026-09-24**: **Summer Rain** (QA Own Visibility, sees
exactly 1 issue everywhere else) generated a public share link — it shows the **full, unrestricted project total
(1209)**, not her own 1-issue scope, i.e. "the project's full data" applies, not "the sharer's own scope."
Originally filed as `BUG-DSH-022` (Critical) — **retracted 2026-09-25** on review: this plugin already shows
project-wide, unscoped data regardless of viewer everywhere else (`BUG-DSH-013`, which remains open in its own
right), so public sharing mirroring that same behavior is architecturally consistent, not a new defect layered on
top. Confirmed with the user (product owner) 2026-09-25. If `BUG-DSH-013`'s underlying data-scoping gap is ever
fixed, that fix should naturally extend to the public view too — see `DASHBOARDS_MEMORY.md`.

---

### TC-DSH-121: Sharing requires permission

**User Role:** Member with view-only project access
**Priority:** Medium
**Steps:**
1. Confirm whether the **Share** button is offered.
2. Send the token-generation request **directly**.

**Expected Result:**
- Consistent with the permission model, enforced at the endpoint.
- **Any user who can generate a token can publish that project's analytics to the open internet.** If this is not
  restricted to an appropriate role, that is a High-severity finding even if every other case passes.

**PASS (as-designed, corrected 2026-09-25), 2026-09-24**: tested with **Harmony Rose** ("QA Read Only", the most
restrictive role tested this session) — Share is fully offered and functional, generating a working public token
exactly like every other role tested (Admin, Daisy Skye/Reporter). Originally treated as evidence for `BUG-DSH-020`
(High) on the basis that this should be role-restricted — **narrowed 2026-09-25**: the vendor KB documents equal
capabilities for any project member with no sharing restriction, so this specific "any role can share" observation
is intentional design. `BUG-DSH-020` remains open, narrowed to Medium, for the separate self-revocation gap only —
see `bugs/open/BUG-DSH-020.md`.

---

**TC-DSH-122, TC-DSH-126 NOT EXECUTED, 2026-09-24** — `TC-DSH-122` needs a project close/archive/
make-private cycle on a token'd project (partially covered already: `BUG-DSH-014` established closed-project
widget-add bypass; the archive/private-specific halves need a dedicated disposable project, same caution as
`TC-DSH-106`/`TC-DSH-024`, not this shared instance). `TC-DSH-126` (load/DoS testing)
is out of scope for this environment and testing approach entirely — needs dedicated load-testing tooling, not
Playwright MCP.

**TC-DSH-123 PARTIALLY ATTEMPTED, blocked mid-step, 2026-09-25**: generated a fresh public token as **Daisy Skye**
(Reporter on test-project) — `http://localhost:3010/public/analytics_dashboard/hdHR_...GLXs` — and confirmed it
serves the dashboard (`200`, "test project - Dashboard") from a genuinely cookie-free context. Logged in as
**Admin** and located Daisy Skye's membership row (`Reporter`, `/memberships/31`) on test-project's Members
settings page, ready to remove it and retry the same token. **Stopped here**: the membership-removal click was
blocked by this session's own auto-mode safety classifier as "Modify Shared Resources" — removing a real
member's project role on this shared, multi-plugin QA instance is exactly the kind of state change other
suites' fixtures could depend on (Daisy Skye's Reporter membership on test-project is itself an active fixture
for `TC-DSH-104`/`TC-DSH-124` and others in this session). Did not attempt to work around the block. The token
above is still live and untested against a post-removal state — recommended for a future session with explicit
approval to temporarily remove and restore a membership, given `BUG-DSH-020` already shows this general area
(link lifecycle vs. the creator's own standing) has a real, if narrower, governance finding.

### TC-DSH-122: Token survival across project state changes

**User Role:** Member + Admin, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Generate a public link, then in turn: close the project, archive the project, and make the project private if
   it was public. Retry the link after each.

**Expected Result:**
- Record the behaviour at each step. An **archived** project's data still being served publicly is a clear defect,
  since archiving is expected to remove access entirely.
- Making a project private without invalidating existing public links is a defensible design, but it must be
  documented — an administrator locking down a project would reasonably expect the public link to die with it.

---

### TC-DSH-123: Token survival after the sharer loses access

**User Role:** Admin + unauthenticated visitor
**Priority:** High
**Steps:**
1. Member A generates a public link. Remove A's membership of the project entirely.
2. Retry the public link.

**Expected Result:**
- Record whether the link still serves data.
- A link that outlives its creator's access is a real governance gap: a departing employee's share link would keep
  publishing project analytics indefinitely. Whatever the behaviour, it belongs in the plugin memory file.

---

### TC-DSH-124: Token is not discoverable from the authenticated UI by others

**User Role:** Another project member
**Priority:** Medium
**Steps:**
1. Check whether other members can read the existing token from the Share dialog or from any response body.

**Expected Result:**
- Record who can see an existing token. Anyone who can read it can redistribute the dashboard publicly without
  leaving a trace of having done so.

**FAIL, 2026-09-24**: **any** project member who opens Share sees the currently-active token — confirmed Harmony
Rose (QA Read Only) could read the live token URL directly from the modal's input field, the same token any other
member (including Admin) would see. There is no per-user token scoping or restriction on who can view/read the
existing link; combined with `TC-DSH-121`/`BUG-DSH-020`, any member can both read and freely regenerate the one
shared token, with no record of who did either.

---

### TC-DSH-125: Search engine and referrer exposure

**User Role:** Unauthenticated visitor
**Priority:** Low
**Steps:**
1. Inspect the public page's response headers and markup for indexing controls.

**Expected Result:**
- Record whether a `noindex` directive is present.
- A public dashboard URL with no indexing protection can be crawled and indexed, turning "anyone with the link"
  into "anyone searching" — worth recording as a finding even though it is not a code defect.

**FAIL (informational, per the TC's own framing — not filed as a numbered bug), 2026-09-24**: no `noindex`
protection of any kind — checked both `<meta name="robots">` (absent from the page entirely) and the
`X-Robots-Tag` HTTP response header (absent). A shared dashboard link, if ever posted anywhere crawlable, has
nothing stopping it from being indexed and becoming searchable rather than staying link-only.

---

### TC-DSH-126: Public view under load

**User Role:** Unauthenticated visitor
**Priority:** Low
**Steps:**
1. Open the public dashboard with auto-refresh at 30 seconds in several browser windows simultaneously.

**Expected Result:**
- The instance serves them without degradation, and the endpoint is rate-limited or otherwise protected.
- An unauthenticated, auto-refreshing, query-heavy endpoint is a denial-of-service surface — record whether any
  throttling exists.

---

### TC-DSH-127: Script content reaches the public view

**User Role:** Member, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Set a chart title containing a script tag, then open the public link.

**Expected Result:**
- Escaped and inert. **No script executes for the unauthenticated viewer** — this is the most exposed rendering
  surface in the entire plugin set and execution here would be Critical (paired with TC-DSH-041).

**PASS, 2026-09-24**: reused the existing `<script>window.__qaXSSDashboardChartTitle2=true</script>XSSViaSettings`
fixture widget (already on the shared dashboard from earlier XSS testing) — on the public view, `window.
__qaXSSDashboardChartTitle2` was `undefined` (script did **not** execute), the literal title text rendered as
inert text, and the HTML source showed the script tag properly escaped (`&lt;script&gt;...`), not raw markup.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
