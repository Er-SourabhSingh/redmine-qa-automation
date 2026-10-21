# BUG-TCM-070

- Bug ID: BUG-TCM-070
- Production Redmine Issue ID: #123985 (https://flux.zehntech.com/issues/123985) — assigned to Vaishnavi Bhawsar, priority High, Defect Type Security / Defect Severity High-severity / Defect priority High. Linked to production Testcase #123983 ("Most Failed Tests report bar chart must not execute injected HTML/script from ranked labels (XSS)") in Run #612, environment Win + Chrome + Ver6.
- Title: Most Failed Tests report's bar chart executes injected HTML/script from a test case subject — ApexCharts renders `xaxis.categories` labels as HTML, not plain SVG text, contradicting the code's own safety assumption
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-7.1.0, pre-7.2.0 — rftc-016/017/020/021/038/042/043/044 merged)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chrome (via Playwright)
- User role: Admin
- Date: 2026-10-19
- Severity: **High** (confirmed, reproducible stored/DOM XSS — `alert()` genuinely executed, not just a theoretical finding)

## Steps to reproduce

1. Create a test case whose subject is `<img src=x onerror=alert(1)>`.
2. Record a Failed execution for it (any run/environment).
3. Create a report of type **Most Failed Tests** whose run set includes that execution; open the report's `show`
   page (which renders both the ranked table and the `_most_failed_report_graph` bar chart).

## Expected result

Per the spec's own explicit security requirement (Gate 2 finding #2, "Graph partial is a second, script-context
XSS sink" — the exact class of bug this is): the chart must never execute embedded HTML/script from a
user-controlled label. The implementation comment states "ApexCharts renders labels as SVG text (no HTML sink)" —
this should hold for any subject content, including HTML-tag-shaped strings.

## Actual result

The browser genuinely executes the injected script. Opening the report triggers **real `alert()` dialogs**
(confirmed live via Playwright — the dialog had to be dismissed multiple times, once per chart
render/re-render). This is not a theoretical risk; the payload runs.

Important nuance — **the server-side output is correctly escaped on the wire**. Fetching the raw HTML response
directly (bypassing the browser's script execution) shows the data is safely encoded in the `data-mostfailed`
attribute:

```
<div id="mostFailedChart" data-mostfailed="{&quot;labels&quot;:[&quot;#2060 <img src=x onerror=alert(1)>&quot;],...
```

The `<`/`>` are JSON-unicode-escaped (`<`/`>`) and the attribute's own quotes are `&quot;`-escaped — this
is exactly the safe `data-*` pattern the spec's SEC-002 note prescribes (option (b): "stamp the values into
`data-*` attributes with normal ERB escaping and have static JS read them"). **The vulnerability is not in the
Rails view's own output** — it is in what happens next: the inline `<script>` block does
`JSON.parse(el.dataset.mostfailed)`, which correctly decodes the JSON string back to the literal text
`<img src=x onerror=alert(1)>`, and hands that string to ApexCharts as an `xaxis.categories` label. ApexCharts
then renders that category label in a way that causes the browser to parse it as live HTML and execute the
`onerror` handler — contradicting the code comment's assumption that ApexCharts' label rendering is a pure SVG
text sink.

The ranked **table** (`_most_failed_report.html.erb`) is NOT affected — it uses default ERB escaping directly
(`<%= issue.subject %>`) and the raw HTML response confirms the table's copy of the subject is properly
HTML-entity-escaped with no live tag. The vulnerability is isolated to the chart/graph partial.

## Root cause

`app/views/testcase_reports/_most_failed_report_graph.html.erb`:

```erb
<%# ... ApexCharts renders labels as SVG text (no HTML sink). %>
...
<div id="mostFailedChart" data-mostfailed="<%= chart_payload.to_json %>" ...></div>
<script>
  ...
  var payload = JSON.parse(el.dataset.mostfailed || '{"labels":[],"values":[]}');
  ...
  var options = {
    ...
    xaxis: { categories: payload.labels }
  };
  new ApexCharts(el, options).render();
</script>
```

The server-side encoding (JSON in a `data-*` attribute) is correct and not the bug. The bug is the assumption
baked into the comment and the design: that handing a `payload.labels` string straight to ApexCharts'
`xaxis.categories` is safe because "ApexCharts renders labels as SVG text." Live testing against this ApexCharts
build/configuration proves that assumption false — a label string shaped like an HTML tag with an event handler
attribute executes when the chart renders (or re-renders, e.g. on a relevant redraw/tooltip event), most likely
because ApexCharts internally sets the label's markup via `innerHTML` (or an equivalent unsafe DOM API) rather
than creating an SVG `<text>` node with the string as plain text content, for at least axis category labels.

## Suggested fix

Do not pass raw, attacker-controlled subject text to any charting library's label/category option without first
either (a) confirming — via the library's own documented API/escaping option, not an assumption — that it treats
the string as plain text with no HTML interpretation in every rendering path (axis labels, tooltips, legends,
data labels), or (b) pre-sanitizing/stripping HTML-special characters from the label string in the JavaScript
before handing it to the charting library (e.g. a minimal HTML-escape of `<`, `>`, `&`, `"` applied client-side to
each label after `JSON.parse`, independent of the already-correct server-side JSON encoding). Given this
ApexCharts version/configuration has now been shown to execute HTML in category labels, option (b) is the safer,
immediate fix; re-verify the fix doesn't just move the bug to a different ApexCharts feature (tooltips, data
labels) that might render the same string differently.

## Evidence

### Console / log

Raw HTML response (server output — correctly encoded):
```
<div id="mostFailedChart"
     data-mostfailed="{&quot;labels&quot;:[&quot;#2060 <img src=x onerror=alert(1)>&quot;],&quot;values&quot;:[1]}"
     data-series-label="Failures"></div>
```

Live browser behavior (confirmed via Playwright): opening `/testcase_reports/11?project_id=rftc-016-ci-qa`
produced real `alert(1)` dialogs that had to be dismissed repeatedly — the payload executes, not merely appears
in markup.

Code reference: `app/views/testcase_reports/_most_failed_report_graph.html.erb:1-32`, specifically the
`xaxis: { categories: payload.labels }` line and the preceding comment's incorrect safety claim.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers XSS in any chart/graph partial in
  this plugin. Not the same class as any previously-fixed SEC-002 sink (those were `raw`/`.html_safe` in ERB
  templates; this is a client-side charting-library rendering behavior, a different mechanism).

## Retest — 2026-10-21 (FIXED)

Retested against `localhost:3000` after the user pulled updated plugin code into `C:\redmine v6\plugins` and the
stack was restarted. Opened report #26 (a current Most Failed Tests report whose ranked data includes the
XSS-fixture test case `#35 <img src=x onerror=alert('export-xss')>`):

- Navigated to the report's live page — **no `alert()` dialog fired** (confirmed no dialog needed handling
  during or after navigation, and `browser_console_messages` showed zero errors/warnings).
- Inspected the chart's rendered DOM directly: `document.getElementById('mostFailedChart').querySelectorAll('text')`
  shows the payload's label as literal SVG `<text>` node content — `"#35 &lt;img src=x onerr...` — i.e. genuinely
  escaped/inert text, not live markup.
- Confirmed **zero** live `<img>` elements exist anywhere inside the chart container
  (`el.querySelector('img')` → `null`).
- **Verdict: FIXED.** ApexCharts now renders the label as safe SVG text instead of executing it as HTML. Moving
  this bug to `bugs/closed/`.
