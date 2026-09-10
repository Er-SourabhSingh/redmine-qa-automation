# User Guide — Redmineflux Knowledgebase

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.

---

## Getting Started

The Knowledge Base is enabled per project. Once the plugin is installed and the `Knowledge base` module is enabled for a project, users see a **Knowledge base** tab in the project navigation.

**URL:** `https://<host>/projects/<project-identifier>/knowledgebase`

Users need at least the `view_knowledgebase` permission to access the KB. Creating or editing content requires `manage_knowledgebase_pages`. Managing spaces requires `manage_knowledgebase_spaces`.

---

## Key Screens

### 1. KB Home (Index)
- **URL:** `/projects/:id/knowledgebase`
- Left sidebar: searchable tree of all spaces, folders, and pages.
- Main area: welcome message when no space is selected, or space contents when a space is chosen.
- Action icons appear next to spaces and nodes for users with manage permissions.

### 2. Page View
- **URL:** `/projects/:id/knowledgebase/nodes/:id`
- Displays page title, author, last updated date, status badge (Draft / Published / Unpublished).
- Main content area: rendered rich HTML.
- Toolbar (manage users only): Edit, Publish/Update, Unpublish, Version History, Public Access toggle.
- Version info shown: current version number and published date.

### 3. Page Editor
- **URL:** `/projects/:id/knowledgebase/nodes/:id/edit`
- Title field at the top (editable).
- Space + parent folder dropdowns + position field.
- Full WYSIWYG editor (Flux Library) below.
- Auto-save fires on content change (debounced ~1–2 s); small indicator appears.
- Toolbar buttons: Save (draft), Publish/Update, and editor formatting controls.
- `@` triggers user mention dropdown; `#` triggers issue mention dropdown (if enabled).
- AI prompt input at the bottom of the editor (if AI is enabled).

### 4. Version History
- **URL:** `/projects/:id/knowledgebase/nodes/:id/versions`
- Lists all versions newest-first.
- Each row: version number, author avatar + name, date/time, comment ("published" or "restored:N").
- Restore button on each row (opens a confirmation).

### 5. Public Page View
- **URL:** `/kb/public/:token`
- No Redmine login required.
- Minimal layout: space name + page title + rendered content.
- Read-only; no edit or publish controls.
- Shows the latest published version snapshot.

### 6. Admin — Templates
- **URL:** `/knowledgebase_templates` (admin panel)
- List of all content templates.
- Actions: New, Edit, Delete, Copy, Preview.

### 7. Admin — Plugin Settings
- **URL:** Administration → Plugins → Redmineflux Knowledgebase Plugin → Configure
- Tabs: General, Public Access, Templates, AI Integration, WordPress Sync, Space Inheritance.

---

## Step-by-Step Workflows

### Workflow 1: Create a Space
1. Navigate to project → Knowledge base.
2. Click **+ New Space** (sidebar or main area button).
3. Enter space **Name** (required) and optional **Description**.
4. Click **Create Space**.
5. The space appears in the sidebar immediately.

> **Role required:** `manage_knowledgebase_spaces`

---

### Workflow 2: Create a Folder Inside a Space
1. In the sidebar, hover over a space name → click the **+ (add)** icon.
2. Select **Folder** in the node type dropdown.
3. Enter folder **Title** (required).
4. Set parent (space root or another folder) and position.
5. Click **Create**.
6. Folder appears in the sidebar under the selected parent.

> **Role required:** `manage_knowledgebase_pages`

---

### Workflow 3: Create a Page
1. In the sidebar, hover over a space or folder → click the **+ (add)** icon.
2. Select **Page** in the node type dropdown.
3. Enter page **Title** (required).
4. Optionally select a **Content Template** (content auto-fills).
5. Set parent (space root or a folder) and position.
6. Click **Create** → page opens in the editor.
7. Write or edit content in the Flux Library editor.
8. Click **Save** to save as draft, or **Publish** to publish immediately.

> **Role required:** `manage_knowledgebase_pages`

---

### Workflow 4: Edit and Publish a Page
1. Open a page → click **Edit**.
2. Modify title or content.
3. Auto-save fires in the background (~1–2 s after stopping typing).
   - If page was published, it **reverts to draft** automatically after auto-save.
4. When ready, click **Update** (for already-published pages) or **Publish** (for new drafts).
5. A version snapshot is created; page is now live.
6. Any `@mentioned` users receive an email notification.

---

### Workflow 5: Unpublish a Page
1. Open a published page → click **Unpublish**.
2. Confirm the action.
3. Page is hidden from all users except the author and users with `manage_knowledgebase_pages`.
4. `explicitly_unpublished` flag is set — the page cannot be made public while unpublished.

---

### Workflow 6: View and Restore a Version
1. Open a page → click **Version History** in the toolbar.
2. Browse the version timeline (newest first).
3. To restore: click **Restore** on a past version → confirm.
4. The selected version's content and title are applied and a **new published version** is created immediately.
5. Page is live and visible to all readers after restore.

> **Role required:** `manage_knowledgebase_pages`

---

### Workflow 7: Share a Page Publicly
1. Open a published page → click **Share** (or the public access toggle icon).
2. Toggle **Enable Public Access** → system generates a 64-char hex token.
3. Copy the public URL displayed (format: `https://<host>/kb/public/<token>`).
4. Send the URL to external users — no Redmine login required to view.
5. To revoke access: toggle **Disable Public Access** → token is cleared, URL no longer works.

> **Constraints:**
> - Page must have at least one published version.
> - Explicitly unpublished pages cannot be made public.
> - Public view shows only the last published version (not live draft).

---

### Workflow 8: Use a Content Template
1. Click + to create a new page.
2. In the new page dialog, select a **Template** from the dropdown.
3. Click **Create** → editor opens with the template HTML pre-filled.
4. Edit the pre-filled content as needed and publish.

---

### Workflow 9: Generate Content with AI
1. Open or create a page → click Edit.
2. In the AI input field (bottom of editor), type a prompt (e.g., "Write an architecture review for our new auth service").
3. Click **Generate**.
4. AI returns HTML content that fills (or replaces) the editor content.
5. Review and edit the generated content.
6. Click Save or Publish — AI content is not auto-saved automatically.

> **Prerequisite:** Admin must configure AI endpoint, API key, and model in plugin settings.

---

### Workflow 10: Admin — Create and Manage Templates
1. Go to Administration → Plugins → Redmineflux Knowledgebase → Templates (or direct URL `/knowledgebase_templates`).
2. Click **New Template** → enter name and write HTML content → **Save**.
3. **Edit:** click Edit on any template row → modify → Save.
4. **Copy:** click Copy → a new template "(Copy)" is created immediately.
5. **Preview:** click Preview → rendered content shown in a modal.
6. **Delete:** click Delete → confirm.

---

### Workflow 11: View Inherited Spaces (Child Project)
1. Navigate to a child project → Knowledge base.
2. Sidebar shows own spaces at top, and a section **"Inherited from: {Parent Project Name}"** below.
3. Inherited spaces and their folders/pages are read-only — no + or edit/delete icons.
4. Clicking a node in an inherited space opens the page in the same view.

> **Prerequisite:** Space inheritance must be enabled in admin settings. User must have `view_knowledgebase` on the parent project.

---

## UI Elements Reference

| Element | Location | Purpose |
|---------|----------|---------|
| Sidebar tree | Left panel on KB index | Navigate spaces, folders, pages |
| Search bar | Top of sidebar | Live filter of all tree items |
| Clear button | Search bar | Resets filter |
| + (add) icon | Hover over space/folder | Opens new space, folder, or page dialog |
| ⋮ (action menu) | Next to space or node | Edit / Delete options |
| Status badge | Page view toolbar | Shows Draft / Published / Unpublished |
| Auto-save indicator | Page editor | Small spinner or "Saved" text |
| Publish button | Page editor | Publishes draft; creates version |
| Update button | Page editor (for re-publish) | Re-publishes edited draft |
| Unpublish button | Page toolbar | Reverts published page to draft |
| Version History link | Page toolbar | Opens version timeline |
| Restore button | Version History row | Restores that version; publishes immediately |
| Public Access toggle | Page toolbar | Enable / disable token-based public sharing |
| @mention dropdown | In editor, type @ | Autocompletes project member names |
| #issue dropdown | In editor, type # | Autocompletes issue numbers |
| AI prompt input | Bottom of editor | Enter prompt → Generate content |
| Template selector | New page dialog | Pre-fill page with a template |
| Inherited label | Sidebar section | "Inherited from: {ProjectName}" — read-only |

---

## Notes & Known Behavior

- **Slug stability:** Renaming a page does not change its URL slug (slug generated once at creation).
- **Folders are always visible:** They have no draft state. Only pages follow draft/publish.
- **Auto-save reverts published pages to draft silently** — the page shows draft status in the toolbar while readers still see the last published version.
- **Version created only on Publish/Restore** — auto-save does not create a version.
- **Draft pages with no published version** are invisible to users who only have `view_knowledgebase`.
- **Explicitly unpublished pages** show an "Unpublished" badge and are hidden from regular viewers. This is distinct from a page that was auto-reverted to draft.
- **Public view counter** (`public_access_count`) is internal — not shown to the public viewer.
- **Rack::Attack rate limiting** applies only in production/test environments. In development it is disabled.
- **WordPress sync errors** appear as a flash message but do not block publishing.
- **Cascade deletes:** Deleting a space or folder deletes all children permanently, including all page versions.
- **API layer** mirrors all UI operations at `/api/knowledgebase/...` — all MCP test cases target this layer.
