# User Guide — Redmineflux Issue Template Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/issue-template-plugin/ (ingested 2026-09-15).
> Steps below are the vendor's described flow. Confirm each against the running instance during the first
> execution session and correct this file where the real UI differs.

## Getting Started

The plugin adds two entry points: an **Issue Template** section in the Administration area for global templates,
and an **Issue Template** tab inside each project for project-specific ones. Both lead to the same list-and-form
screen; what differs is the scope of what is listed and who can reach it.

## Key Screens

| Screen | Path | What it is for |
|--------|------|----------------|
| Global template list | Administration → Issue Template | Lists administrator-created templates only |
| Project template list | Project → Issue Template tab | Lists this project's templates **and** the global ones |
| Add Issue Template form | Either list → **Add Issue Template** | Create a template |
| Edit/Update Issue Template | Either list → pencil icon on a row | Modify an existing template |
| New Issue | Issues → **New Issue** | Where a template is pre-selected and applied |

## Step-by-Step Workflows

### Workflow 1: Create a global issue template

1. Log in as an administrator.
2. Click **Administration** in the top menu.
3. Open the **Issue Template** section.
4. Click **Add Issue Template**.
5. Fill in the fields:
   - **Tracker** — which tracker this template belongs to.
   - **Issue Template Name** — the template's own name.
   - **Issue Subject** — the subject text pre-filled onto new issues.
   - **Issue description** — the description body pre-filled onto new issues.
   - **Project list** — tick the projects that may use this template.
6. Click **Submit** to save.
   - **Clear** resets the form without saving.
   - **Cancel** discards the template and leaves the form.

### Workflow 2: Create a project-specific issue template

1. Log in.
2. Open the **Project** tab in the header and choose the project.
3. Click the project's **Issue Template** tab.
4. Click **Add Issue Template**.
5. Fill in the same fields as above. The **Project list** here shows only projects you are a member of.
6. Click **Submit**.

The project's Issue Template page then shows both this project's own templates and the global templates.

### Workflow 3: Edit a template

1. Open the **Issue Template** tab (or the Administration section).
2. Find the template in the list.
3. Click the **pencil** icon.
4. On the Edit/Update Issue Template page, change whichever fields are needed — including re-ticking the
   **Project list** to reassign it to different projects.
5. Submit to save.

### Workflow 4: Delete a template

1. Open the template list.
2. Click the **trash** icon on the row.
3. Confirm the deletion in the dialog.
4. The template is removed from the list.

### Workflow 5: Use a template when creating an issue

1. Click the **Issues** tab in the header.
2. Click **New Issue**.
3. The plugin automatically pre-selects the default template for the chosen tracker.
4. The subject and description are pre-filled from it.
5. Click **Create**.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Add Issue Template** button | Both template lists | Opens the creation form |
| **Tracker** field | Creation/edit form | Drives the pre-selection rule on New Issue |
| **Issue Template Name** | Creation/edit form | The template's identity in the list |
| **Issue Subject** / **Issue description** | Creation/edit form | Content copied onto the new issue |
| **Project list** | Creation/edit form | Multi-select; supports keypress auto-scroll |
| **Submit** / **Clear** / **Cancel** | Creation form | Save / reset / discard |
| Pencil icon | Template list row | Edit |
| Trash icon | Template list row | Delete, with a confirmation dialog |

## Notes & Known Behaviour

- **Project list auto-scroll:** pressing any key in the Project list scrolls the list to projects whose names begin
  with that character. This is a convenience, but it means the control reacts to typing — confirm it does not
  fight with any search box in the same field.
- **Two scopes, one list inside a project:** the Administration page shows only global templates; a project page
  shows global *plus* project-specific. Whether a project template can be edited from the Administration page, or a
  global one from inside a project, is not stated in the KB and must be established by test.
- **Applying a template is a copy, not a link** *(to confirm)*. The KB describes pre-filling a new issue, which
  implies the issue holds its own copy. If editing a template later changed already-created issues, that would be a
  serious defect — the test suites check it explicitly rather than assuming.
- **CKEditor** supplies the description editor's toolbar if the instance is configured for it; the licence is the
  customer's responsibility. Behaviour without CKEditor is a legitimate scenario to cover.
