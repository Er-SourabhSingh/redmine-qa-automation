# Plugin Requirements — Redmineflux Issue Template Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/issue-template-plugin/ (official vendor knowledge
> base, ingested 2026-09-15). Anything marked *(to confirm)* is an inference that must be verified against the
> running instance before a test case depends on it.

## Overview

The Issue Template plugin defines standardised templates for creating issues, so that every issue follows a
consistent structure and carries the information needed for effective communication. Templates exist at two
levels — **global** (created by an administrator, in the Administration area) and **project-specific** (created
inside a project, on its own Issue Template tab).

## Key Features

1. **Global issue templates** — Administration → Issue Template. Add, edit, delete, list.
2. **Project issue templates** — Project → Issue Template tab. Add, edit, delete, list.
3. **Template fields** — Tracker, Issue Template Name, Issue Subject, Issue description, Project list.
4. **Project list assignment** — a template is bound to one or more projects by checking them in the Project list
   field; this can also be changed later by editing the template (KB FAQ Q6).
5. **Membership-restricted project list** — on the project-level creation form the Project list shows only
   projects the user is a member of.
6. **Combined project view** — a project's Issue Template page shows both its own project-specific templates and
   the global templates; the Administration page shows only administrator-created (global) ones.
7. **Form controls** — Submit to save, **Clear** to reset the form, **Cancel** to discard without saving.
8. **Edit via pencil icon**, **delete via trash icon** with a confirmation dialog.
9. **Default template pre-selection by tracker** — on the New Issue page the plugin automatically pre-selects the
   default template matching the chosen tracker (KB FAQ Q7).
10. **Project filter auto-scroll** — pressing a key in the Project list scrolls to and renders projects whose names
    begin with that key (KB FAQ Q8).
11. **Template validation options** — the KB FAQ Q4 says the plugin "may offer" mandatory fields and validation
    rules. *(to confirm — the KB hedges, so the suites must determine what actually exists rather than assume it.)*
12. **CKEditor compatibility** — the plugin integrates with the customer's own CKEditor setup and licence.

## Business Workflows

1. **Standardise a tracker organisation-wide** — Admin creates a global template for the Bug tracker with a
   required subject skeleton and description checklist; every project that the template is bound to sees it, and
   New Issue pre-fills it when Bug is chosen.
2. **Project-local convention** — a project manager creates a project-specific template on the project's Issue
   Template tab for a workflow unique to that project.
3. **Create an issue from a template** — Issues → New Issue → the tracker's default template is pre-selected →
   the subject and description are pre-filled → Create.
4. **Rebind a template to different projects** — edit the template and change the Project list checkboxes.

## Permissions Matrix

The KB does not publish one. The matrix below is what the suites must **establish empirically**.

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| View the Administration → Issue Template page | | | | | | | |
| Create / edit / delete a global template | | | | | | | |
| View a project's Issue Template tab | | | | | | | |
| Create / edit / delete a project template | | | | | | | |
| See global templates inside a project | | | | | | | |
| Use a template when creating an issue | | | | | | | |
| See projects in the Project list they are not a member of | | | | | | | |

The two questions the suites must answer, because the KB implies but never states them:
- Can a **non-admin** create project templates, and if so which role gates it?
- Does the membership restriction on the Project list hold at the **endpoint**, or only in the rendered form?

## Known Constraints

- Declared Redmine compatibility: 4.0.x, 4.1.x, 4.2.x, 5.0.x, 5.1.x, 6.0.x.
- CKEditor is the customer's own responsibility — its licence and setup are out of the plugin's scope, which makes
  "behaves acceptably when CKEditor is absent" a real case rather than a hypothetical.
- Asset issues after install are resolved with `RAILS_ENV=production bundle exec rake assets:precompile` plus a
  restart.
- The KB's Q4 answer about validation is hedged ("may offer"); treat the observed behaviour as authoritative and
  record it in the features list.

## Installation Prerequisites

1. A working Redmine installation.
2. Plugin ZIP extracted to `/path/to/redmine/plugins`, **folder name unchanged**.
3. `bundle install`.
4. `RAILS_ENV=production bundle exec rails redmine:plugins:migrate` (or `development`).
5. Server restart.
6. Several trackers and at least three projects — including one private project the test user is not a member of —
   so the project-list restriction and the tracker pre-selection can both be exercised meaningfully.
