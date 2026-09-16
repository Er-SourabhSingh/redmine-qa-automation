# User Guide — Redmineflux Knowledge Base Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

Enable the **Knowledge Base** module in Project → Settings → Modules. A **Knowledge Base** entry then appears in
the project menu. Everything else happens inside that view: a sidebar tree on the left (spaces, folders, pages,
with a live search field), and the page editor/reader on the right.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Project Knowledge Base | Project menu → Knowledge Base | The whole authoring and reading experience |
| Page editor | A page → **Edit** | WYSIWYG editing with auto-save |
| Version history | A page → **Versions** | List of published versions; restore |
| Public URL modal | A published page → **Public URL** | Enable/disable tokenised public access |
| Plugin settings — General | Administration → Plugins → Configure → General | Mention toggles, inheritance |
| Plugin settings — Public Access | …→ Public Access | Master toggle, rate limits, IP lists, bot blocking |
| Plugin settings — Templates | …→ Templates | Admin-only template management |
| Issue detail | Any issue, bottom of the details section | "Related Knowledge Base Pages" |

## Step-by-Step Workflows

### Workflow 1: Set up a knowledge base

1. Project → **Settings** → **Modules** → tick **Knowledge Base** → Save.
2. Open **Knowledge Base** from the project menu.
3. Click **New Space** in the sidebar; enter a name and optional description; Save.
4. Use the dropdown next to the space → **New Folder** to add folders; nest folders via a folder's own dropdown.

### Workflow 2: Write and publish a page

1. Sidebar → dropdown next to a space or folder → **New Page**.
2. Enter the page title; optionally pick a **content template**; Save.
3. The page opens in the editor in **draft** status.
4. Write the content — it **auto-saves as you type**; the toolbar shows *Saving* then *Saved*.
5. Type `@` to mention a project member; type `#` to reference an open issue.
6. Click **Publish**, then confirm.
   - The page becomes visible to everyone with `view_knowledgebase`.
   - A version snapshot is created.
   - Mentioned users are emailed a link and the publishing author's name.

### Workflow 3: Revise a published page

1. Open the published page → **Edit**.
2. Change the content. It auto-saves **as a draft**; the page stays published meanwhile.
3. Click **Update** to publish the new draft as a new version.

### Workflow 4: Unpublish

1. Open the published page → **Unpublish** → confirm.
2. The page returns to draft with an **Unpublished** badge, disappears for regular users and through public URLs,
   and is visible only to the author and `manage_knowledgebase_pages` holders.
3. Re-publishing creates a new version and restores visibility.

### Workflow 5: Restore an earlier version

1. Open the page → **Versions**.
2. Find the version and click **Restore this version** → confirm.
3. The content is replaced and the page is **published immediately** — no separate publish step.
4. A new version entry is created with the comment *Restored from version N*.

### Workflow 6: Share a page publicly

1. Open a **published** page → **Public URL**.
2. Click **Enable Public Access**. A URL containing a 64-character token is generated.
3. Copy and share it. Recipients need no Redmine account.
4. To revoke: **Public URL** → **Disable Public Access**. The token is cleared immediately.

### Workflow 7: Manage templates (admin)

1. Administration → Plugins → Redmineflux Knowledgebase Plugin → **Configure** → **Templates**.
2. **New Template** → name + HTML content → Save.
3. **Edit**, **Copy** (creates "Copy of …"), or **Delete** from the list.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| Sidebar tree | Knowledge Base view | Spaces → folders → pages, with per-node dropdown menus |
| Search field | Top of the sidebar | Client-side live filter, no page reload |
| Draft / Unpublished badge | Sidebar and page header | Signals page state |
| Auto-save indicator | Page toolbar | *Saving* / *Saved* |
| Publish / Update / Unpublish | Page toolbar | State-dependent; each confirms first |
| Versions | Page toolbar | Table of published versions; **Current Version** badge |
| Public URL | Page toolbar, published pages only | Enable/disable tokenised sharing |
| Inherited from [Project] | Sub-project sidebar | Parent's spaces, read-only, action menus suppressed |

## Notes & Known Behaviour

- **Auto-save ≠ version.** Auto-save only updates the draft. Versions exist only where someone clicked Publish,
  Update or Restore. This is deliberate, to keep history meaningful.
- **A page being edited stays published.** Members continue to see the last published version until Update is
  clicked — so an in-progress draft is never exposed to ordinary readers.
- **Deleting a space is catastrophic and permanent**: every folder, page and version inside it goes, with no undo.
- **Structural rules**: a folder cannot sit under a page, and a page cannot contain children.
- **Public URLs are cached in the browser for 10 minutes.** When testing revocation, use a fresh session or bypass
  the cache — otherwise a revoked link can appear to still work when it does not.
- **Rate limiting only runs in production and test environments** and needs a shared `Rails.cache` store. On a
  development instance it is off entirely.
- **Inheritance is on by default**: sub-projects show the parent's spaces read-only, and only to users who hold
  `view_knowledgebase` **on the parent project**.
- Before testing mention notifications, check Administration → Settings → General → **Host name and path**, or the
  links in the emails will be unusable.
