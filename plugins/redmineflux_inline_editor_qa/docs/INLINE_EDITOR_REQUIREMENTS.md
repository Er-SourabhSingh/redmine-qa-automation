# Plugin Requirements — Redmineflux Inline Issue Editor plugin

## Overview

Redmineflux Inline Issue Editor (confirmed installed at Administration > Plugins, `inplace_issue_editor` v7.0.0). Per its own plugin description: "Professional inline editing for Redmine issues, projects, and custom fields. Supports issue list, issue detail, project table, and project card views with clean searchable dropdowns, permission-aware controls, and zero layout disruption."

Replaces the plain Redmine "Edit" pencil-icon behavior on issue detail fields (Assigned to, Status, Priority, custom fields, etc.) with its own custom searchable-dropdown widget, class-prefixed `rf-ss` (Redmineflux Search-Select), rendered inline in place of a plain `<select>`.

## Key Features

- Inline "Edit" pencil icon on issue detail sidebar fields opens a custom searchable dropdown (`rf-ss` widget) instead of navigating to the full Edit form.
- The `rf-ss` widget: a text search box to filter options, a special "<<me>>" shortcut option (for user-reference fields like Assigned to), a "None" clear option, and the live option list (e.g. project members for Assigned to).
- Same widget pattern reused across issue list, issue detail, project table, and project card views per the plugin's own description (not yet all individually verified — see Known Constraints).

## Business Workflows

- Inline-edit a field on the issue detail page without navigating to `/issues/:id/edit`.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| Inline-edit issue fields | ✓ | ✓ | ✓ (per field permission) | ✓ (per field permission) | ✗ | ✗ |

## Known Constraints

- The `rf-ss` widget is a single shared component reused across multiple field types (confirmed on Assigned to, on both the issue detail sidebar and the Issues list view) — its own hardcoded strings (search placeholder, "None" option) are a single root cause affecting every field that uses it, not per-field bugs.
- Confirmed 2026-09-08: the plugin's own "project table"/"project card view" description both resolve to the single `/projects` card-tile listing on this instance (no separate table-view toggle exists) — its Name field is inline-editable there. A single project's own Overview page and the Administration → Projects admin table both have **zero** inline-edit icons — this plugin does not extend either of those.
- The post-save "Saved successfully." toast is a single shared component reused across every inline-edit field (confirmed on Status, Priority, and Description) — its hardcoded-English text is a single root cause, not a per-field bug.
- Testing environment: `https://flux-frmka2kzh49.forge.zehntech.com/` (Forge) — the original `flux-fczk00paf49.forge.zehntech.com/` has since expired.
