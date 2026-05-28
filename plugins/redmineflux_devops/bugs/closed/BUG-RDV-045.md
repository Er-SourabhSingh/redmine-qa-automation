# BUG-RDV-045 — Release notes editor uses Quill.js instead of CKEditor as specified

- Bug ID: BUG-RDV-045
- Title: Release notes editor uses Quill.js instead of CKEditor as specified
- Redmine version: 6.0.9 (Local)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker — http://localhost:3008
- Browser: Playwright MCP
- User role: Admin
- Date: 2026-05-26

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Releases.
2. Open any release detail page (e.g., "v2.0.0 Release").
3. Click "Edit Notes" to open the release notes editor.
4. Inspect the editor DOM.

## Expected result

- CKEditor WYSIWYG editor loads (selector: `.ck-editor__editable`, `.ck.ck-toolbar`).
- Toolbar shows CKEditor formatting options (bold, italic, lists, headings, links).
- `notes_html` column is persisted via CKEditor content.

## Actual result

- Quill.js editor loads (selector: `.ql-editor`, toolbar: `.ql-toolbar.ql-snow`).
- No `.ck-editor__editable` elements exist in DOM.
- Implementation uses Quill.js instead of the CKEditor specified in rfd-112.
- Editor is functional but does not match the specification.

## Evidence

- Screenshot path: screenshots/TC-RDV-221/
- DOM evidence: `toolbar.className = "ql-toolbar ql-snow"`, `contenteditable.className = "ql-editor"`
- Confirmed via: TC-RDV-221 FAIL on 2026-05-26

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to New Release form for agileboard. Release notes editor uses CKEditor (`.ck-editor__editable`, `.ck.ck-toolbar` elements present). No Quill.js elements in DOM. Bug closed.
