# Plugin Requirements — Redmineflux Knowledgebase

## Overview

Redmineflux Knowledgebase is a project-scoped documentation plugin for Redmine. It enables teams to create, organize, and share structured content within each project through a three-level hierarchy: **Spaces → Folders → Pages**. Pages support a draft/publish workflow, full version history with restore, token-based public sharing, AI-assisted content generation, WordPress sync, and user mention notifications.

---

## Key Features

1. **Spaces** — top-level containers per project; one project can have many spaces (e.g., "Engineering Docs", "Onboarding", "Product Specs").
2. **Folders** — non-leaf containers inside a space; support unlimited nesting; always visible (no draft/publish).
3. **Pages** — document nodes inside folders or directly inside a space; contain rich HTML content; follow draft → published → unpublished lifecycle.
4. **Draft / Publish / Unpublish workflow** — pages start as drafts; only published pages are visible to regular viewers; explicitly unpublished pages return to draft.
5. **Auto-save** — page content auto-saves (debounced XHR) without creating a version; if a published page is auto-saved, its status reverts to draft automatically.
6. **Version history** — a new immutable version snapshot is created only on Publish and on Restore. Auto-save does NOT create versions.
7. **Restore version** — restores an older version by creating a new published version immediately (comment: "restored:N").
8. **Rich text editor (Flux Library)** — custom WYSIWYG editor with headings, lists, tables, code blocks, links, images, emoji, `@mention`, and `#issue` support.
9. **Public URL sharing** — token-based (64-char hex) sharing of published pages with external users who have no Redmine login; rate-limited by Rack::Attack.
10. **User mention notifications** — `@username` in page content triggers email notification to mentioned project members at publish time.
11. **Issue–Page linking** — `#issue-id` in page content creates a bidirectional link between the KB page and the Redmine issue.
12. **Content templates** — admin-managed templates (Meeting Notes, PRD, API Docs, etc.) that auto-populate new page content.
13. **AI content generation** — OpenAI-compatible API integration; user enters a prompt and the editor fills with generated HTML.
14. **WordPress sync** — automatically pushes published page content to a WordPress site via REST API on publish/restore.
15. **Space inheritance** — child projects can view (read-only) spaces inherited from parent projects.
16. **Sidebar search** — live client-side filter across all spaces, folders, and pages in the KB sidebar.
17. **Admin settings** — tabbed settings panel covering mentions, public access, rate limiting, AI, WordPress, templates, and space inheritance.

---

## Business Workflows

### Workflow 1: Create and Publish a Page
1. User navigates to a project → Knowledge Base.
2. User selects a space, clicks + to add a page (or folder).
3. User enters title, selects parent folder and position.
4. User writes or generates content in the editor.
5. User clicks Publish → page becomes visible to all project members with `view_knowledgebase`. A version snapshot is created.

### Workflow 2: Edit a Published Page
1. User opens a published page and clicks Edit.
2. User edits content → auto-save fires, page status reverts to draft (existing published version still visible to readers).
3. User clicks Update (publish) → new version snapshot created, page becomes live.

### Workflow 3: Restore an Older Version
1. User opens page → Version History.
2. User selects a past version and clicks Restore.
3. A new published version is created immediately with comment "restored:N". Page is live.

### Workflow 4: Share a Page Publicly
1. User opens a published page → Toggle Public Access (enable).
2. System generates a 64-char token and returns a public URL.
3. External user opens `/kb/public/<token>` — no login required; sees latest published version.
4. User can disable public access at any time; token is cleared.

### Workflow 5: Admin Manages Templates
1. Admin → Administration → Plugins → Redmineflux Knowledgebase → Configure → Templates.
2. Admin creates / edits / deletes templates.
3. When a user creates a new page, they can select a template; content pre-fills.

---

## Permissions Matrix

| Action | Admin | Manager | Developer / Member | Viewer | Non-member |
|--------|-------|---------|--------------------|--------|------------|
| View published pages / spaces | ✓ | ✓ | ✓ (`view_knowledgebase`) | ✓ | ✗ |
| View draft pages (own) | ✓ | ✓ | ✓ (own drafts) | ✓ (own) | ✗ |
| View draft pages (all) | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |
| Create / edit / delete spaces | ✓ | ✓ (`manage_knowledgebase_spaces`) | ✗ | ✗ | ✗ |
| Create / edit / delete pages & folders | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |
| Publish / unpublish pages | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |
| Restore versions | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |
| Toggle public access | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |
| View public page (external) | ✓ | ✓ | ✓ | ✓ | ✓ (token URL) |
| Manage templates (Admin UI) | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure plugin settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| AI content generation | ✓ | ✓ | With `manage_knowledgebase_pages` | ✗ | ✗ |

---

## Data Model

### rf_knowledgebase_spaces
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| project_id | int FK | scopes space to project |
| name | string(255) | required; unique per project |
| description | text | optional |
| created_at / updated_at | datetime | |

### rf_knowledgebase_nodes
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| project_id | int FK | |
| space_id | int FK | |
| parent_id | int FK → self | nullable; folder nesting |
| node_type | string(10) | 'folder' or 'page' |
| title | string(255) | required; unique per space + parent (case-insensitive) |
| content | text | HTML; pages only |
| status | string(20) | 'draft' or 'published'; default 'draft'; pages only |
| author_id | int FK | creator / last editor |
| position | int | display order; default 0 |
| slug | string | auto-generated from title once; unique per space; never regenerated |
| public_access_enabled | boolean | default false |
| public_token | string(64) | 64-char hex; nullable; unique |
| public_url_generated_at | datetime | nullable |
| public_access_count | int | view counter for public URL; default 0 |
| explicitly_unpublished | boolean | distinguishes intentional unpublish from auto-draft |
| created_at / updated_at | datetime | |

### rf_knowledgebase_versions
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| node_id | int FK | |
| author_id | int FK | user who published or restored |
| version_number | int | sequential per page; starts at 1; unique per node |
| title | string(255) | snapshot of title at publish time |
| content | text | snapshot of content at publish time |
| status | string(20) | always 'published' |
| comment | text | e.g. "published", "restored:3" |
| created_at / updated_at | datetime | |

### rf_knowledgebase_templates
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| name | string(255) | required; unique |
| content | text | rich HTML |
| created_at / updated_at | datetime | |

---

## Known Constraints

- Slug is generated once from the title and **never regenerated** after creation — renaming a page does not change its URL slug.
- Folders are **always published** — the draft/publish lifecycle applies to pages only.
- Auto-save fires via XHR on content change (debounced); it does **not** create a version and reverts a published page to draft silently.
- Draft pages with a published version history **remain visible** to all readers at the last published version while the author edits the new draft.
- Explicitly unpublished pages are hidden from regular users (including those with only `view_knowledgebase`) and **cannot** be made public.
- Duplicate titles within the same space + parent combination are rejected (case-insensitive validation + composite DB index).
- Public tokens must be exactly 64 hex characters; the controller validates format before DB lookup.
- Rack::Attack rate limiting is **disabled in development** — only active in production and test environments.
- WordPress sync failures do **not** block publishing — the page publishes regardless; failure appears in a flash message.
- Space deletion cascades: all folders, pages, versions, and issue-page links inside the space are permanently deleted.
- The API layer mirrors all UI actions and is the target of MCP-based testing.
