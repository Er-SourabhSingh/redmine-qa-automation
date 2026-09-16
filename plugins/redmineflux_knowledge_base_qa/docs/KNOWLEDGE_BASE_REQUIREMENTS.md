# Plugin Requirements — Redmineflux Knowledge Base Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/ (official vendor knowledge
> base, ingested 2026-09-15). This is the most completely documented plugin in the Redmineflux set — it publishes
> an explicit permission model, a page-visibility matrix, a REST API contract and a security design. Test cases can
> therefore assert against stated behaviour rather than inferring it.

## Overview

A project-level documentation plugin. Each project has exactly **one** knowledge base, organised hierarchically as
**Spaces → Folders → Pages**. Pages carry rich text content and move through a **draft → published** lifecycle with
version history and point-in-time restore. Content can be shared outside Redmine through a token-based public URL.

## Key Features

1. **Project-scoped knowledge base** — content is independent per project.
2. **Spaces** — top-level containers (e.g. Engineering Docs, Onboarding).
3. **Folders** — organisational containers within a space, nestable inside other folders.
4. **Pages** — the only nodes that hold content; they cannot contain children.
5. **Draft / publish workflow** with explicit visibility rules per page state.
6. **Version history** — versions created **only on publish**, never by auto-save; point-in-time restore.
7. **Rich text WYSIWYG editor** — H2–H4, bold/italic/underline, lists, tables, code blocks, blockquotes, links,
   images, emoji picker; **auto-save** with a Saving/Saved indicator.
8. **User @mentions** — dropdown of active project members; email notification **on publish**.
9. **Issue #mentions** — dropdown of open project issues; linked pages surface on the issue detail page.
10. **Content templates** — six pre-built templates; admin-managed create/edit/copy/delete.
11. **Public URL sharing** — 64-character `SecureRandom.hex(32)` token; read-only; published versions only.
12. **Rate limiting** via Rack::Attack on `/kb/public/*`.
13. **Parent project space inheritance** — sub-projects display the parent's spaces read-only; on by default.
14. **Sidebar search** — client-side live filter over spaces, folders and pages.
15. **REST API** at `/api/knowledgebase/` — JSON, authenticated, MCP-compatible, paginated.

## Business Workflows

1. **Author and publish documentation** — create a space → create folders → create a page (optionally from a
   template) → write in the editor (auto-saving as draft) → Publish → mentioned users are emailed and a version
   snapshot is created.
2. **Revise published content** — open a published page → Edit → changes auto-save as a draft while the page stays
   published → **Update** publishes the new draft as a new version.
3. **Recover from a bad edit** — Versions → Restore this version → the page is published immediately with the
   restored content and a new version entry recording the restore.
4. **Share with an external stakeholder** — open a published page → Public URL → Enable Public Access → send the
   tokenised link. Disable revokes it immediately.
5. **Retire a page** — Unpublish → it reverts to draft with an Unpublished badge, disappears for regular users and
   through public URLs, and re-publishing restores visibility as a new version.

## Permissions Matrix

Published by the vendor — this is the model to verify, not to discover:

| Permission | What it covers | Default |
|---|---|---|
| `view_knowledgebase` | View spaces, folders and published pages | Public — all project members |
| `manage_knowledgebase_spaces` | Create, edit, delete spaces | Managers |
| `manage_knowledgebase_pages` | Create, edit, publish, delete pages and folders | Members with write access |

Admin-only, outside the role system: **template management** and **plugin settings**.

### Page visibility rules (vendor-stated)

| Page state | Who can view |
|---|---|
| Published | All project members with `view_knowledgebase` |
| Draft, no published version | Author and `manage_knowledgebase_pages` holders |
| Draft, has published versions | All members see the **last published version** |
| Explicitly unpublished | Author and `manage_knowledgebase_pages` holders only |
| Folders | Always visible to all members |

The third row is the subtle one and the most likely source of a real defect: a page being edited must continue to
show its last published version to ordinary members, while the in-progress draft stays hidden from them.

## Known Constraints

- **Structural rules:** folders cannot have page-type nodes as parents; pages cannot contain children.
- **One knowledge base per project** (FAQ Q2) — Spaces are the only sub-division.
- **Versions only on publish** (FAQ Q4) — auto-save never creates one.
- **Public access requires at least one published version**, and explicitly unpublished pages cannot have it
  enabled.
- **Deleting a space permanently deletes all folders, pages and version history within it** and cannot be undone.
- **Rate limiting is active in production and test only** — disabled in development, and it requires
  `Rails.cache` to be a **shared** store, not `MemoryStore`. Testing throttling on a development instance or with
  MemoryStore will produce a false negative.
- Rate-limit setting changes take effect within **60 seconds** without a restart.
- Declared compatibility: Redmine **5.1.x and 6.0.x** only (not 4.x, not 5.0.x), Ruby 3.0+, `rack-attack ~> 6.7`.
- Public pages are browser-cached for 10 minutes via Cache-Control headers — relevant when testing revocation.

## Installation Prerequisites

1. A working Redmine 5.1+ installation on Ruby 3.0+.
2. Plugin cloned/copied to `plugins/redmineflux_knowledgebase` (folder name matters).
3. `bundle install` — must install `rack-attack ~> 6.7`.
4. `RAILS_ENV=production bundle exec rake redmine:plugins:migrate`.
5. Restart.
6. For the public-URL and rate-limiting suites: a **production-mode** instance with a shared cache store, plus a
   client on a distinct IP for throttle testing.
7. For mention-notification testing: a working outbound mail path, and a verified
   Administration → Settings → General → **Host name and path**, or the links inside notification emails will be
   wrong.
