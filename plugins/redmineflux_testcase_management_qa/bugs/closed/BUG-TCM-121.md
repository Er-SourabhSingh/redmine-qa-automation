# BUG-TCM-121

- Bug ID: BUG-TCM-121
- Production Redmine Issue ID: #125358 (https://flux.zehntech.com/issues/125358) — assigned Vaishnavi Bhawsar, Priority Low, Defect Type Functional / Defect Severity Low-severity / Defect priority Low
- Title: Regression from the BUG-TCM-072 XSS fix — the "#"/"@" mention dropdown's character-highlight `<span>` markup (Tribute.js's own, trusted) is now escaped and shown as literal text instead of rendering, breaking the matched-character highlight for every search
- Severity: Low
- Redmine version: 6.x (Docker `localhost:3000`)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-pull, pre-7.2.0 — includes commit c9d35ca, the "BUG-TCM-072 for real" fix)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chrome (via Playwright)
- User role: Admin
- Date: 2026-10-26

## Steps to reproduce

1. Open any Requirement's content editor in a project with several test case issues.
2. Type `#` to trigger the issue-mention dropdown, then type digits that match several issue IDs (e.g. `571`).
3. Observe each dropdown row.

## Expected result

The digits that matched the typed search text should render as visually highlighted (bold/colored via a real
`<span>` element), exactly as Tribute.js's built-in fuzzy-search highlighting is designed to show — e.g. "**5**7
: RFTC021-5-dedup-fixture" with `5` and `7` genuinely wrapped in live `<span>` tags.

## Actual result

**Confirmed live, reported by the user with a screenshot.** Every dropdown row shows the literal, escaped text
`<span>5</span><span>7</span>09 : RFTC021-5-dedup-fixture` instead of rendering any highlight — the `<`/`>`
characters of Tribute's own injected `<span>` tags are shown as plain text (HTML-entity-escaped), not parsed as
real elements. This reproduces for every single row in the dropdown, confirmed via a live `#`+`5`+`7` keystroke
sequence and a screenshot.

## Root cause (confirmed via source read)

This is a **direct regression from the BUG-TCM-072 "for real" fix** (commit `c9d35ca`), which added:

```js
menuItemTemplate: function (item) {
  return escapeHtml(item.string);
},
```

`item.string` is **not** the raw, unescaped issue subject by the time `menuItemTemplate` runs — Tribute.js's own
internal search filter (`editorMention.js`, the vendored Tribute build) wraps every character of `key` that
matched the typed search text in `pre`/`post` markup, defaulting to literal `<span>`/`</span>` tags (confirmed
in source: `pre: n.current.collection.searchOpts.pre || "<span>", post: ... || "</span>"`), **before** handing
the result to `menuItemTemplate`. So `item.string` already contains real, Tribute-generated structural HTML
(the highlight spans) mixed in with the issue's `key` text (`"${id} : ${subject} "`, built in
`getAllIssues()`). Calling `escapeHtml()` on the combined string escapes **both** the untrusted subject content
**and** Tribute's own trusted highlight markup indiscriminately, since by this point there's no way to tell them
apart — the highlight tags are already baked into the plain string.

This is the same general lesson as BUG-TCM-072's own history (sanitizing in the wrong place/at the wrong layer):
the correct fix should escape the **raw subject** at the point it's built into `key`/`issueId` in `getAllIssues()`
(`assets/javascripts/script.js`, the `let issue = { key: ... }` block), *before* it's ever handed to Tribute for
searching/highlighting — not escape the final `item.string` after Tribute has already injected its own real
`<span>` markup into it. Escaping at the source makes any attacker-controlled `<`/`>` characters permanently
inert text from the moment Tribute's search even sees them, while leaving Tribute's own later-injected highlight
spans untouched and renderable, since `menuItemTemplate` would then no longer need to (and should not) re-escape
`item.string` at all.

## Evidence

### Screenshot (user-provided, reproduced independently here)

![Mention dropdown showing literal `<span>` text instead of highlighted matched characters](../../screenshots/BUG-TCM-072/retest-2026-10-26-highlight-span-escaped.png)

### Source (Tribute's own highlight injection, `editorMention.js`)

```js
var r = function (e) {
  if (n.isActive) {
    var r = n.search.filter(n.current.mentionText, e, {
      pre: n.current.collection.searchOpts.pre || "<span>",
      post: n.current.collection.searchOpts.post || "</span>",
      ...
```

### Source (the over-broad escape, `script.js`, from commit `c9d35ca`)

```js
menuItemTemplate: function (item) {
  return escapeHtml(item.string);
},
```

### Source (where the raw, not-yet-escaped subject enters Tribute's data, `script.js#getAllIssues`)

```js
let issue = {
  key: `${data[i]?.id} : ${data[i]?.subject} `,
  issue: true,
  issueId: `${data[i]?.id}: ${data[i]?.subject} `,
  value: `${url}/issues/${data[i]?.id}`,
};
```

## Duplicate check

- Duplicate found: No
- Related to BUG-TCM-072 (same commit, same file, same feature) but a **distinct defect** — BUG-TCM-072 is about
  a security vulnerability (unescaped subject executing as live HTML); this is a cosmetic/UX regression
  introduced by that security fix (Tribute's own legitimate highlight markup now shown as literal text). Fixing
  one does not fix the other — in fact the correct fix for BUG-TCM-072's remaining `selectTemplate` gap and this
  bug's `menuItemTemplate` over-escaping should likely be solved together, by moving the escaping to the
  `getAllIssues()`/`key`-building step instead of either Tribute callback.
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Tribute's highlight markup being
  escaped.

## Retest — 2026-10-27 (FIXED)

Retested live against `localhost:3000` after a fresh `docker restart redmine6-redmine-1 redmine6-sidekiq-1`.
Project `RFTC-016 CI Ingest QA`, requirement #3, real keyboard-driven `#`+`5`+`7` sequence (matching the bug's own
repro steps). Inspected the live dropdown DOM directly (`document.querySelector('.tribute-container ul')`):

```html
<li data-index="0" class="highlight"><span>5</span><span>7</span>10 : RFTC021-5-dedup-fixture </li>
<li data-index="1" class=""><span>5</span><span>7</span>09 : RFTC021-7-private-fixture </li>
...
```

`ul.querySelectorAll('li span').length` → **26** genuine, live `<span>` DOM elements wrapping the matched `5`/`7`
characters across the dropdown rows — not escaped `&lt;span&gt;` text. The highlight markup renders correctly
again, while the earlier-fixed subject-escaping (confirmed separately under BUG-TCM-072's own 2026-10-27 retest)
remains intact for payload rows in the same dropdown — both the security fix and the cosmetic regression it had
introduced are now correctly resolved together.

Dropdown dismissed via Escape (no selection made, nothing inserted into the editor) — no cleanup needed beyond
reverting an unrelated stray edit from the same session's BUG-TCM-072 retest.

**Verdict: FIXED.** Moving to `bugs/closed/`.

## Production sync — 2026-10-27

Production issue #125358 updated to Status: Done, % done: 100, per explicit user approval ("bug tumne closed kr
diye jo fixed he production pe bhi").
