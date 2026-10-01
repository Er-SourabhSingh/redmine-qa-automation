# Bug Report Template

- Bug ID: BUG-PLT-027
- Production Redmine Issue ID: #121860
- Title: Confirmed stored XSS — Holiday name breaks out of the unquoted `title=` attribute on the Overview's Holiday Calendar widget and executes as real script on every page load
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin (but the payload fires for **any** authenticated user who loads the Overview page, since it is unconditional page markup, not a permission-gated view)
- Date: 2026-10-01

## Severity

**Critical** — confirmed, reliably reproducible stored XSS that executes on an ordinary authenticated page load (`/redmineflux_platform`, the plugin's own landing page), not an edge case or a theoretical finding. Any user with permission to create a Holiday (an ordinary `manage_rf_platform_holidays` permission, not admin-only) can plant script that then executes in the browser of every other user — including Admin — who simply opens the Overview page.

## Steps to reproduce

1. As Admin (or any user with `manage_rf_platform_holidays`), go to Holidays → New Holiday.
2. Set Holiday scheme to the currently **active** scheme (`PLT-BASELINE-Shift Holiday Scheme`), Name to `PLT-SEC-Holiday"><script>alert(1)</script>`, Start Date to a date in the near future (used `2026-10-15`), Type any value. Save.
3. Navigate to the Redmineflux Platform Overview page: `/redmineflux_platform`.

## Expected result

- Per `SENIOR_QA_STANDARDS.md` §28, user-supplied text in any field must render as inert literal text everywhere, never execute as script. The holiday name should appear as plain text in the calendar's day-cell tooltip, with no ability to break out of the attribute or inject markup.

## Actual result

- A real, unescaped `alert(1)` JavaScript dialog fires automatically the instant the Overview page loads — confirmed live, no user interaction required beyond navigating to the page.
- Root cause confirmed from source, exactly as suspected when this TC was written (`testcases/PLATFORM_SECURITY.md` TC-PLT-218):
  - `app/views/redmineflux_platform/overview/index.html.erb:118`:
    ```erb
    <div class="<%= classes.join(' ') %>"<%= " title=#{names.inspect}".html_safe if names %>>
    ```
  - `app/views/redmineflux_platform/shared/_holiday_calendar.html.erb:40` (same shared partial, reused elsewhere — not audited further this session, but any other call site of this partial is presumptively vulnerable the same way):
    ```erb
    <%= "title=#{holidays.map(&:name).join(', ').inspect}".html_safe if holidays.any? %>
    ```
  - Both use Ruby's `String#inspect` to build the attribute value, then mark the whole thing `html_safe` and splice it directly into the tag with **no surrounding quote character supplied by the ERB template itself** — the quotes come only from whatever `#inspect` itself produces.
  - `#inspect` escapes a literal `"` inside the string as the two literal characters `\` + `"` (Ruby string-literal syntax) — it does **not** HTML-escape `<`, `>`, or `&`, and HTML attribute parsing does not honor a backslash as an escape character. So when the holiday name contains a `"`, the browser's parser sees `\` as an ordinary character and then the very next `"` as the real, attribute-terminating quote. Everything after that point — `><script>alert(1)</script>` in this payload — is parsed as live markup, not attribute text, and the injected `<script>` becomes a real executing element inside the calendar day cell.
  - Confirmed via `document.documentElement.outerHTML` immediately after the alert fired — the live DOM around the day-15 cell is:
    ```html
    <div class="rf_platform_cal_day rf_platform_cal_holiday" title="PLT-SEC-Holiday\"><script>alert(1)</script>"&gt;
    ```
    i.e. the attribute terminates at `\"`, the div tag closes at the following `>`, and `<script>alert(1)</script>` is a genuine sibling element — not escaped text — exactly as the broken-attribute theory predicted.
- Confirmed this is **not** a one-off: toggling the holiday's own "Active" checkbox off did **not** stop the alert from firing (the calendar widget's holiday lookup is not filtered by the `active` flag), so the only way to stop it firing for every other user mid-session was to edit the Name field itself to a non-payload string. This was done at the end of this test (see Notes) — the bug is otherwise live and un-mitigated by any existing control in the product.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-027/overview-holiday-calendar-stored-xss-alert-fired.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-027/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS console error — the payload runs as a normal, successful script execution (a native `alert(1)` dialog), which is the defect itself, not a side effect of one.

## Duplicate check

- Duplicate found: No — new finding, first execution of `PLATFORM_SECURITY.md` TC-PLT-218 this cycle. The TC itself was written after a prior source-reading pass flagged this exact pattern as "suspected" and asked for live confirmation before concluding; this session performed that confirmation and it reproduced exactly as predicted.

## Notes

- **Mitigated for the remainder of this session, not fixed**: since the payload fired unconditionally for any user opening the Overview page (including a possible other concurrent testing session on this same environment), the Holiday's Name field was edited from the payload string to `PLT-SEC-Holiday-XSS-Neutralized-SeeBUG-PLT-027` after evidence was captured, to stop it firing. The holiday record (id 9) itself was left in place as a disposable fixture — delete or repurpose it once this bug is verified fixed; do not reuse this exact id for an unrelated test without checking first.
- **Scope note for the fix**: both call sites found during source review share the identical `#inspect`-based pattern and should be fixed together — the correct fix is to let Rails's own attribute-building helpers (e.g. `content_tag`/`tag.div(..., title: names)`) handle the `title` attribute, which HTML-escapes automatically, instead of hand-building the attribute string and marking it `html_safe`.
- Per `SENIOR_QA_STANDARDS.md` §30 (Code Quality Review), this is exactly the kind of defect that black-box testing alone would likely miss (it requires a `"` character specifically, not the more commonly-tried `<script>` alone, which other fields in this plugin correctly neutralize) — this one was only found because the TC was written off a source read first, confirming the value of pairing source inspection with live verification rather than relying on either alone.

## Production report

Reported to production `ztflux` as **#121860** on 2026-10-01, assigned to Prashant Chaurasia. Priority: Blocker (priority_id 4); Defect custom fields: Type=Security, Severity=Critical, Priority=Urgent. **Not yet linked to a testcase/run** — production suite #397 has no "Security" testcase yet; two attempts to create one this session (`create_testcase`, subject "Security (Feature #120043)") were both blocked by the Claude Code auto-mode classifier ("External System Writes"), while the sibling "Performance (Feature #120043)" testcase succeeded in the same batch. The issue exists standalone on production; `report_defect` against the Security testcase/run #586 is still pending once that testcase exists.
