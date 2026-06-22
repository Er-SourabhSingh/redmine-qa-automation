# Features List — Redmineflux Knowledgebase

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | **Space — Create** | Create a new space in a project with name + optional description | |
| 2 | **Space — Edit** | Update space name or description | |
| 3 | **Space — Delete** | Delete a space and cascade-delete all child folders, pages, and versions | |
| 4 | **Space — Unique name** | Duplicate space names within same project are rejected | |
| 5 | **Folder — Create** | Create a folder inside a space or nested inside another folder | |
| 6 | **Folder — Edit** | Rename a folder or change its parent/position | |
| 7 | **Folder — Delete** | Delete a folder and cascade-delete all child folders and pages | |
| 8 | **Folder — Always published** | Folders have no draft state; they are always visible | |
| 9 | **Page — Create (blank)** | Create a new page with title, space, parent folder, and position | |
| 10 | **Page — Create (from template)** | Create a page pre-populated with a content template | |
| 11 | **Page — View** | View a page; shows last published version if page has one | |
| 12 | **Page — Edit** | Open page editor; full WYSIWYG (Flux Library) with title and content fields | |
| 13 | **Page — Auto-save** | Content changes trigger XHR auto-save; no version created; published page reverts to draft | |
| 14 | **Page — Publish (first time)** | Publish a draft page; creates version 1; page visible to all | |
| 15 | **Page — Update (re-publish)** | Publish an edited draft; creates next version; page live | |
| 16 | **Page — Unpublish** | Revert a published page to draft; sets explicitly_unpublished flag; hides from regular users | |
| 17 | **Page — Delete** | Delete a page; removes issue-KB links; removes all version history | |
| 18 | **Page — Duplicate title rejected** | Same title in same space + parent combination is rejected | |
| 19 | **Page — Slug stability** | Slug generated once from title; renaming page does not change slug | |
| 20 | **Draft visibility (no version)** | Draft pages with no published version are visible only to author and `manage_knowledgebase_pages` users | |
| 21 | **Draft visibility (with version)** | Draft pages with published history show last published version to all readers | |
| 22 | **Explicitly unpublished visibility** | Explicitly unpublished pages hidden from all users except author and `manage_knowledgebase_pages` users | |
| 23 | **Version history — View** | List all versions of a page (newest first) with author, date, comment, title, content | |
| 24 | **Version history — Restore** | Restore a past version; creates a new published version immediately with comment "restored:N" | |
| 25 | **Version — Created on publish only** | Verify versions are created only on publish/restore, not on auto-save | |
| 26 | **Rich text editor — Formatting** | Bold, italic, underline, strikethrough, headings h1–h4 | |
| 27 | **Rich text editor — Lists** | Ordered and unordered lists | |
| 28 | **Rich text editor — Tables** | Insert tables with colspan/rowspan | |
| 29 | **Rich text editor — Code blocks** | Code blocks with syntax highlighting | |
| 30 | **Rich text editor — Links** | Insert links with URL validation | |
| 31 | **Rich text editor — Images** | Upload or embed images | |
| 32 | **Rich text editor — Emoji** | Emoji picker | |
| 33 | **@mention — Autocomplete** | `@username` triggers dropdown of project members in editor | |
| 34 | **@mention — Notification on publish** | Mentioned users receive email notification when page is published | |
| 35 | **@mention — No self-notification** | Author does not receive mention notification for own mentions | |
| 36 | **@mention — Active members only** | Only active project members can be mentioned | |
| 37 | **#issue mention** | `#issue-id` in content creates bidirectional link between KB page and issue | |
| 38 | **Issue link — Auto-sync** | On page save, plugin computes diff of issue mentions and updates issue's `rf_knowledgebase_page_ids` | |
| 39 | **Issue link — Cleanup on delete** | Deleting a page removes it from all linked issues' `rf_knowledgebase_page_ids` | |
| 40 | **Public URL — Enable** | Generate 64-char hex token; return public URL for a published page | |
| 41 | **Public URL — Disable** | Clear token; invalidate public URL immediately | |
| 42 | **Public URL — Access (no login)** | External user accesses `/kb/public/<token>` without Redmine login | |
| 43 | **Public URL — Shows published version** | Public view shows latest published version (not live draft) | |
| 44 | **Public URL — View counter** | `public_access_count` increments on each public page view | |
| 45 | **Public URL — Invalid token rejected** | Token not exactly 64 hex chars returns 404/403 before DB lookup | |
| 46 | **Public URL — Unpublished page cannot be made public** | Explicitly unpublished pages cannot have public access enabled | |
| 47 | **Public URL — Rate limiting** | Rack::Attack throttles `/kb/public/*` at 30 req/min and 100 req/hr per IP | |
| 48 | **Sidebar — Space + tree display** | Sidebar shows all spaces with nested folders and pages | |
| 49 | **Sidebar — Search / filter** | Live search filters spaces, folders, pages by name; parents auto-expand on match | |
| 50 | **Sidebar — Clear search** | Clear button resets the search filter | |
| 51 | **Space inheritance — View inherited** | Child projects see spaces from parent project (read-only) under "Inherited from: {Project}" header | |
| 52 | **Space inheritance — No edit on inherited** | Inherited spaces and nodes show no action menus in child project | |
| 53 | **Space inheritance — Toggle** | Admin can disable space inheritance globally | |
| 54 | **Content templates — Create** | Admin creates a named template with rich HTML content | |
| 55 | **Content templates — Edit** | Admin edits an existing template | |
| 56 | **Content templates — Delete** | Admin deletes a template | |
| 57 | **Content templates — Copy** | Admin copies a template; name appended with "(Copy)" | |
| 58 | **Content templates — Preview** | Admin previews rendered template content | |
| 59 | **Content templates — Use on page create** | User selects template when creating a page; content auto-populates | |
| 60 | **AI generation — Generate content** | User enters prompt; AI returns HTML content that fills the editor | |
| 61 | **AI generation — Config required** | AI endpoint returns error if base_url, model, or API key not configured | |
| 62 | **AI generation — No auto-save** | Generated content is not saved until user clicks save/publish | |
| 63 | **WordPress sync — Publish triggers sync** | Publishing a page sends HTML, Markdown, plain text, and JSON to WordPress REST API | |
| 64 | **WordPress sync — Restore triggers sync** | Restoring a version also triggers WordPress sync if enabled | |
| 65 | **WordPress sync — Failure does not block publish** | If sync fails, page publishes successfully; failure shown in flash message | |
| 66 | **Permission — view_knowledgebase** | Users without this permission cannot access KB pages | |
| 67 | **Permission — manage_knowledgebase_spaces** | Users without this permission cannot create/edit/delete spaces | |
| 68 | **Permission — manage_knowledgebase_pages** | Users without this permission cannot create/edit/publish/delete pages or folders | |
| 69 | **Admin settings — Mentions toggle** | Admin can enable/disable @mention email notifications | |
| 70 | **Admin settings — Public access config** | Admin can set rate limit per minute, hourly limit, IP allowlist, IP blocklist, user-agent blocklist | |
| 71 | **Admin settings — AI config** | Admin can set API endpoint, key, model, max tokens; enable/disable AI feature | |
| 72 | **Admin settings — WordPress config** | Admin can set WP URL, username, app password; enable/disable sync | |
| 73 | **API — ping** | `GET /api/knowledgebase/ping` returns 200 for plugin detection | |
| 74 | **API — Spaces CRUD** | `GET/POST /api/knowledgebase/spaces`, `GET/PATCH/DELETE /api/knowledgebase/spaces/:id` | |
| 75 | **API — Nodes CRUD** | `GET/POST /api/knowledgebase/nodes`, `GET/PATCH/DELETE /api/knowledgebase/nodes/:id` | |
| 76 | **API — Publish / Unpublish** | `POST /api/knowledgebase/nodes/:id/publish` and `/unpublish` | |
| 77 | **API — Version list** | `GET /api/knowledgebase/nodes/:id/versions` | |
| 78 | **API — Restore version** | `POST /api/knowledgebase/nodes/:id/restore_version` | |
| 79 | **API — project_id scoping** | All API endpoints require `project_id` param; nodes scoped to project | |
| 80 | **API — Authentication** | API endpoints reject unauthenticated requests | |
| 81 | **API — Permission enforcement** | API respects same permission model as UI (view/manage spaces/pages) | |

## Notes

- Features 1–72 cover the UI/browser layer.
- Features 73–81 cover the MCP/API layer (primary focus of this test cycle).
- Rate limiting (Feature 47) is only active in production/test environments — confirm environment before testing.
- AI generation (Features 60–62) requires admin settings to be configured first.
- WordPress sync (Features 63–65) requires admin settings with valid WP credentials.
