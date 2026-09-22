# Bug Report Template

- Bug ID: BUG-CHK-002
- Production Redmine Issue ID: #121059
- Title: Checklist/sub-item title containing a `<script>` tag executes on creation (client-side self-XSS, unescaped AJAX render)
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Checklist
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-700-redmine-1, http://localhost:3010)
- Browser: Chrome
- User role: Member (issue-edit rights)
- Date: 2026-09-21

## Steps to reproduce

1. Open an issue with a Checklist section.
2. Actions → New checklist.
3. Enter a title containing a script tag, e.g. `<script>alert(document.cookie)</script>`, and press Enter.

Also reproducible via the sub-item "Add" flow (same anti-pattern, different field):

1. Open the action menu on an existing checklist → **Add**.
2. Enter a sub-item title containing a script tag and press Enter.

## Expected result

- The markup is stored and rendered as literal text. No script executes at any point (creation or later viewing) —
  per this suite's own TC-CHK-217, script execution here is a Critical security defect.

## Actual result

- The script **executes immediately**, in the browser of whoever creates the checklist/item, the moment the
  "create checklist" or "create sub-item" AJAX call succeeds. Confirmed by injecting
  `<script>window.__xss_fired=true;<\/script>` and observing `window.__xss_fired === true` immediately after
  creation, with no reload.
- DOM evidence at the moment of creation: `#checklist-item-text-<id>` `innerHTML` contained the **raw, unescaped**
  `<script>` tag (`<script>window.__xss_fired=true;</script>`), not the HTML-entity-escaped form.
- **Important nuance confirmed via a follow-up reload:** on a normal fresh page load, the same checklist renders
  **safely** — `innerHTML` becomes `&lt;script&gt;window.__xss_fired=true;&lt;/script&gt;` and the script does not
  re-execute. So the server-side ERB template (`_checklist.html.erb`) *is* correctly auto-escaping via Rails —
  this is a purely **client-side, DOM-based** vulnerability confined to the two AJAX-creation success handlers,
  not a stored XSS that fires for every later viewer. It still executes in the creating user's own session the
  instant they submit the malicious title (self-XSS on creation), and — since the exact same unescaped pattern
  exists in two separate places — is a systemic anti-pattern in this file, not a one-off typo.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CHK-002/xss-script-injected-checklist-title.png)

### Console / log

Root-caused via source, `assets/javascripts/checklist.js`:

```js
// Line 128 — new-checklist creation success handler:
<span class="checklist-item-text" id="checklist-item-text-${response.id}">${response.title}</span>
// ... $('#checklist-list').append(newItemHTML);

// Line 337 — new-sub-item creation success handler:
<span class="sub-checklist-item-text" id="sub-checklist-item-text-${response.id}">${response.description}</span>
// ... $('#sub-checklist-item-ul-' + itemId).append(`...`);
```

Both build the new row as a raw HTML string via template literal, interpolating the server's own echoed-back
`response.title` / `response.description` **without any escaping**, then insert it with jQuery `.append()` — which
parses and executes any `<script>` tags in the string, exactly like `innerHTML =` would.

Contrast with the **edit** flow in the same file (line ~200), which is correctly safe:

```js
// Edit-checklist success handler — SAFE, uses .innerText (no HTML parsing):
itemTextElement.innerText = newItemValue;
```

The fix should mirror this: either use `.text()`/`.innerText` for the new item's title node instead of building
raw HTML with the value inline, or explicitly HTML-escape `response.title` / `response.description` before
interpolating them into the template string.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — `BUG-CHK-001` (closed) was an unrelated untranslated-string finding.
