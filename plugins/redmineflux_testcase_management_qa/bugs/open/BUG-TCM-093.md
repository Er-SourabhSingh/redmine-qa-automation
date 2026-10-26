# BUG-TCM-093

- Bug ID: BUG-TCM-093
- Production Redmine Issue ID: #124348
- Title: Stored XSS in the Requirements sidebar tree — a requirement's own title/name is interpolated into a
  raw HTML template literal with zero escaping, confirmed to genuinely execute arbitrary JavaScript for every
  user who simply opens the Requirements page
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright MCP)
- User role: `qa.limited` (Manager, `add_requirement` granted) — any role that can create a requirement
- Date: 2026-10-22 (found while executing `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-232)

## Summary

Creating a Requirement with a crafted title genuinely executes JavaScript for anyone who views the project's
Requirements page — a real, confirmed **stored XSS**, not just an unescaped-but-inert tag.

Root cause (`assets/javascripts/script.js`, both the top-level and nested-child rendering branches,
~lines 820-828 and 861-869):

```js
<a class="spaces-title ${pageId == data[i].id ? "active-title" : ""
}" id="title-${data[i].id}" data-publish="${data[i].ispublish
}" editor-tooltip="${pageName}">${pageName}</a>
```

`pageName` (the requirement's own title) is interpolated **twice** into a raw HTML template-literal string with
**zero HTML-escaping** — once into the `editor-tooltip` attribute value (where stray `<`/`>` are merely
tolerated as literal attribute text by the HTML parser, so this half is comparatively harmless) and once as the
element's actual **child content** (`>${pageName}</a>`), which is a genuine HTML-parsing context: when this
string is later assigned via `innerHTML` (or an equivalent jQuery `.html()`), any real tag syntax in `pageName`
becomes a real, live DOM element — not escaped text.

**Confirmed via two payloads:**
- `<script>alert('tcm-xss-req')</script> TC-232-probe` — created a genuine `<script>` element as a child of
  the title link (`el.querySelector('script')` returned a real node), though the script itself never
  auto-executes — this is a well-known browser behavior (script tags inserted via `innerHTML` are inert by
  design), so this payload alone is not proof of exploitability on its own.
- `<img src=x onerror="window.__tcmXssFired=true"> TC-232-onerror-probe` — **this one does execute**: `<img>`
  `onerror` handlers fire regardless of how the element was inserted into the DOM. Confirmed live:
  `window.__tcmXssFired === true` after simply loading the Requirements page — no click, no further
  interaction, just viewing the page as any user.

This is a genuine stored XSS: any user who can create a requirement (just `add_requirement`, a comparatively
low-privilege action — no admin rights needed) can plant a payload that executes in the browser of **every**
subsequent viewer of that project's Requirements page, including project admins. A real attacker payload (not
this harmless flag-setting probe) could exfiltrate the viewing admin's session cookie, silently perform
actions using their session, or redirect them to a credential-harvesting page.

## Steps to reproduce

1. As any role with `add_requirement`, open the project's Requirements page.
2. Press "r" (or click the "+" icon) to open "New Requirement".
3. Set the Title to: `<img src=x onerror="alert(document.cookie)">` (or any other payload).
4. Click Save.
5. Reload the Requirements page (or have any other user load it) — the payload executes immediately on page
   load, with no further interaction needed.

## Expected result

- The requirement's title should render as inert, HTML-escaped text everywhere it's displayed, including the
  sidebar tree — matching the already-confirmed-safe behavior for Run notes (`docs/TESTCASE_MANAGEMENT_MEMORY.md`,
  TC-TCM-183).

## Actual result

- The title is inserted as raw, unescaped HTML into the sidebar tree's DOM, and an `onerror`-based payload
  genuinely executes JavaScript for every viewer of the page.

## Evidence

### Screenshot

(Not captured — the vulnerability is a DOM-level script execution confirmed via `window.__tcmXssFired`, which
is clearer, more precise evidence than a screenshot of an otherwise-unremarkable-looking sidebar entry; the
payload used a silent flag-set rather than a visible `alert()` specifically so it wouldn't require a dialog
screenshot to prove execution — the JS-level confirmation is the primary evidence.)

### Console / log

```js
// Payload 1 (inert, but proves raw HTML injection into child content):
// Title: <script>alert('tcm-xss-req')</script> TC-232-probe
document.querySelector('#title-10').innerHTML
// => "<script>alert('tcm-xss-req')</script> TC-232-probe"
document.querySelector('#title-10').querySelector('script')  // => real <script> element, not text

// Payload 2 (genuinely executes):
// Title: <img src=x onerror="window.__tcmXssFired=true"> TC-232-onerror-probe
// After simply reloading/viewing the Requirements page:
window.__tcmXssFired === true   // => true
```

Both probe requirements (ids 10 and 11) were deleted immediately after confirming execution.

## Suggested fix

In `script.js`'s requirement-tree-rendering template literals (both the top-level and nested-child branches),
HTML-escape `pageName` before interpolating it into the markup string — e.g. a small `escapeHtml()` helper
applied to both the `editor-tooltip` attribute value and the element's child-content interpolation. Given this
exact "raw template literal + later `innerHTML` assignment" pattern already caused the already-reopened
BUG-TCM-072 (Tribute.js mention-popup rendering), it's worth auditing every other place in this file that
builds HTML via template literals for the same missing-escape pattern, rather than treating this as an
isolated one-off.

## Verdict

**Confirmed, Critical.** A genuine, live-reproduced stored XSS requiring only the low-privilege
`add_requirement` permission to plant, that executes against every subsequent viewer of the page including
project admins — a real session-hijacking / account-takeover vector, not a theoretical or inert finding.

## Duplicate check

- Duplicate found: No — related in *class* to BUG-TCM-072 (same raw-template-literal-into-innerHTML pattern,
  same general area of the plugin) but a **distinct sink**: BUG-TCM-072 is the issue-mention Tribute.js popup
  rendering (triggered by typing `#` inside the rich-text editor); this is the Requirements sidebar tree's own
  title rendering (triggered just by the title existing and the page being viewed, no further interaction).
  Confirmed via source that both bugs' root causes are in different code regions, not the same patched/unpatched
  function.
- Existing bug reference (if duplicate): n/a — see BUG-TCM-072 for the related-class mention-rendering finding.

## Production report

Reported to production `ztflux` as **#124348** on 2026-10-22, per explicit user instruction ("bugs report kr do
production pe"). Tracker Bug, Priority Blocker (no "Critical" option in core Priority; matches the same mapping
used for BUG-TCM-082, also a Critical-severity finding), Category "Testcase Management Plugin", Target version
"Testcase Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link (matching the BUG-TCM-087/088/089/090/091/092 pattern). Custom fields (Defect Type/Severity/
priority) left at project defaults — `list_custom_fields` returns a permission error for this account.

## Retest — 2026-10-26 (STILL BROKEN — sidebar tree fixed, a second sink found in the breadcrumb builder)

Per commit `a8a3a56` ("Escape requirement titles and mentioned-issue details before showing them"),
`escapeHtml(pageName)` was added to the sidebar tree's title-rendering template literals in `script.js`.
**Live-verified this specific fix works**: created a new requirement titled
`<img src=x onerror=alert('XSS093')> Sidebar Tree Test`, and on a full page reload the sidebar tree genuinely
shows it as safe, literal text (`document.getElementById('user-list')`-equivalent tree node has no live
`<img>` element) — no alert fires from the tree render itself.

**However, opening that same requirement (via the sidebar, a direct link, or anyone else's browser) still
fires the XSS.** Live-verified: navigating directly to `/requirements?project_id=5&page_id=115` (the created
requirement's own page) fires a genuine `alert('XSS093')` dialog — reproduced twice in a row, including once
immediately after the requirement's own creation and once on a completely fresh navigation (not a cached
state). Root-caused: `openPage(id)` → `getPageContent(id)` calls **`createPageBreadcrumb(id, spaceId)`** on
every single page-open, which builds the breadcrumb trail via:

```js
li.innerHTML = `<a class="text-deco-none">${pagePath.path[i]}</a>`;        // last segment
li.innerHTML = `<a class="path-item" id="path-${pagePath.pathId[i]}">${pagePath.path[i]}</a>`;  // other segments
```

`pagePath.path[i]` is the requirement's own raw, unescaped title — assigned directly via `.innerHTML =` with
**no `escapeHtml()` call at all**, a completely separate code path from the sidebar-tree template literals
the a8a3a56 fix actually patched. Even though the resulting `breadcrumb.append(li)` call is commented out
(so the breadcrumb never visibly renders in the UI), the `li.innerHTML =` assignment alone is enough to parse
the `<img>` tag and fire its `onerror` handler — a classic "detached-element innerHTML still executes"
behavior. Since `createPageBreadcrumb` runs on **every page-open**, this fires for literally every viewer who
ever opens this requirement, exactly matching the original bug's "fires automatically on page load" severity
— not a narrower self-XSS.

**Suggested fix (for the dev's next pass):** wrap both `pagePath.path[i]` interpolations in
`createPageBreadcrumb()` with the same `escapeHtml()` helper already used elsewhere in this file, or stop
building the (never-appended) breadcrumb `<li>` via `innerHTML` entirely.

**Verdict: STILL BROKEN, not closed.** Severity unchanged: **Critical/Blocker**. Stays in `bugs/open/`.
Screenshot: `screenshots/BUG-TCM-093/retest-2026-10-26-still-fails-breadcrumb.png`.
