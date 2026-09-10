# Features List — Redmineflux Tags plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/tag-plugin (official knowledge base, fetched 2026-09-07)

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Tag assignment | Add tags to issues, projects, time entries | TC-TAG-001, TC-TAG-002 |
| 2 | Tag viewing | Display assigned tags on entity pages | TC-TAG-001 |
| 3 | Tag entry via Enter key | Tag input accepts "hit enter" to submit a tag | TC-TAG-002 (functional flow confirmed working; German-translation FAIL logged separately) |
| 4 | Tag display as hyperlinks | Tags render as clickable labels | TC-TAG-005 — PASS |
| 5 | Tag filtering (Issues list) | Filter issues by tag via dedicated filter interface | TC-TAG-005 — PASS |
| 6 | Tag column on Issues list | Toggleable via the list's column-options menu | TC-TAG-005 — PASS |
| 7 | Click tag to view all associated entities | Clicking a tag opens a filtered list view | TC-TAG-005 — PASS |
| 8 | Tag management (admin) | Create/edit/rename/delete tags — "Manage Tags" section | TC-TAG-003, TC-TAG-004 — FAIL |
| 9 | Tag color customization | Set the default color for tags (admin setting) | Seen ("Use colored tag" checkbox, General tab) — untranslated, folded into BUG-TAG-004; the actual color-picker control itself not yet exercised |
| 10 | Tag filter/column on Projects list & Spent Time list | Additional surfaces identified by user (not in KB) | TC-TAG-005 — PASS (Spent Time list); Projects list filter confirmed correct in an earlier pass |

## Notes

- Session 2026-09-07: full sweep across New/Edit Project, New/Edit Issue, Issue Detail, New/Edit Spent Time, Issues/Spent-Time list filters+columns, and the admin Manage Tags pages (list/tabs/Edit Tag form). 4 bugs found: BUG-TAG-001 (issue-detail widget), BUG-TAG-002 (form-field label/placeholder, 6 forms), BUG-TAG-003 (broken admin page title — code bug), BUG-TAG-004 (admin Manage Tags UI mostly untranslated). Remaining untested: the tag color-picker control itself (item #9), and a true multi-row bulk-delete confirmation dialog (only confirmed the button's own untranslated text exists in the DOM, did not complete a full bulk-delete flow).
