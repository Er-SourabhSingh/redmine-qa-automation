# Features List — Redmineflux Knowledge Base Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Clone to `plugins/redmineflux_knowledgebase`, `bundle install`, migrate, restart | TC-RKB-101 – 103 |
| 2 | Dependencies | Redmine 5.1+, Ruby 3.0+, `rack-attack ~> 6.7` | TC-RKB-104, 105 |
| 3 | Project module | Settings → Modules → Knowledge Base | TC-RKB-106, 107 |
| 4 | Plugin settings — General tab | Mention users toggle, Mention issues toggle, inheritance toggle | TC-RKB-108 – 110 |
| 5 | Plugin settings — Public Access tab | Enable public access, requests/min (30), aggressive/hour (100), block bots, IP allowlist, IP blocklist | TC-RKB-111 – 113, 611 – 618 |
| 6 | Plugin settings — Templates tab | Admin-only template management | TC-RKB-501 – 512 |
| 7 | Spaces | Create, edit, delete; delete cascades irreversibly | TC-RKB-201 – 206 |
| 8 | Folders | Create, nest, edit, delete | TC-RKB-207 – 211 |
| 9 | Pages | Create (optionally from a template), edit, delete | TC-RKB-212 – 216 |
| 10 | Hierarchy constraints | Folders cannot have page parents; pages cannot have children | TC-RKB-217, 218 |
| 11 | Rich text editor | H2–H4, bold/italic/underline, lists, tables, code blocks, blockquotes, links, images, emoji | TC-RKB-301 – 305 |
| 12 | Auto-save | Saves draft as you type; Saving/Saved indicator; **never creates a version** | TC-RKB-306 – 309 |
| 13 | User @mentions | Dropdown of active project members; email on publish | TC-RKB-310 – 315 |
| 14 | Issue #mentions | Dropdown of open project issues; link tracked automatically | TC-RKB-316 – 319 |
| 15 | Issue → KB linking | "Related Knowledge Base Pages" section on the issue detail page | TC-RKB-320 – 322 |
| 16 | Draft / publish workflow | Publish, Update, Unpublish, with badges | TC-RKB-401 – 409 |
| 17 | Page visibility rules | Five documented states with distinct audiences | TC-RKB-410 – 414, 901 – 906 |
| 18 | Version history | Version number, title/content snapshot, author, timestamp, optional comment | TC-RKB-415 – 419 |
| 19 | Version restore | Restores and publishes immediately; logs "Restored from version N" | TC-RKB-420 – 423 |
| 20 | Six pre-built templates | Meeting Notes, Architecture Review, PRD, Annual Plan, API Documentation, Budget Proposal | TC-RKB-501 |
| 21 | Template CRUD + copy | Admin-only; "Copy of" prefix on duplication | TC-RKB-502 – 509 |
| 22 | Public URL sharing | 64-char `SecureRandom.hex(32)` token; enable/disable; read-only | TC-RKB-601 – 610 |
| 23 | Public URL constraints | Requires a published version; unpublished pages cannot be shared; 10-minute browser cache; view count | TC-RKB-605 – 609 |
| 24 | Rate limiting (Rack::Attack) | 30/min, 100/hour per IP, 429 + Retry-After, non-GET blocked, bot UAs blocked | TC-RKB-611 – 617 |
| 25 | IP allowlist / blocklist | Trusted IPs bypass throttling; blocked IPs always rejected | TC-RKB-618, 619 |
| 26 | Token security | Format validated before DB lookup (anti-enumeration); disable clears the token at once | TC-RKB-620 – 622 |
| 27 | Parent project inheritance | Parent spaces shown read-only in sub-project sidebar; on by default | TC-RKB-701 – 707 |
| 28 | Sidebar search | Client-side live filter, no page reload | TC-RKB-708 – 712 |
| 29 | REST API — Spaces | GET list/show, POST, PATCH, DELETE | TC-RKB-801 – 805 |
| 30 | REST API — Nodes | GET list/show, POST, PATCH, DELETE, publish, unpublish, versions, restore_version | TC-RKB-806 – 813 |
| 31 | API response envelope | `success`, `data`, `meta` with total_count/page/per_page/total_pages | TC-RKB-814 |
| 32 | API pagination | `page` (default 1), `per_page` (default 25, max 100) | TC-RKB-815, 816 |
| 33 | Three role permissions | `view_knowledgebase`, `manage_knowledgebase_spaces`, `manage_knowledgebase_pages` | TC-RKB-901 – 914 |
| 34 | Uninstallation | Migrate `VERSION=0` then remove the folder; **destroys all KB data** | TC-RKB-114 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **This plugin publishes a real specification**, unlike most of the set: an explicit permission table, a
  five-state visibility matrix, an API contract with a response envelope, and named security defaults. That makes
  assertions here genuinely falsifiable — a divergence is a defect against documented behaviour, not a judgement
  call.
- **The highest-risk area is public URL sharing plus its rate limiting.** It serves project documentation to
  unauthenticated visitors. Note the testing trap the KB states plainly: rate limiting is **disabled in
  development** and requires a **shared** `Rails.cache` store. Testing throttling on a dev instance, or with
  `MemoryStore`, produces a false pass — the limiter simply is not running. Record the environment and cache store
  alongside every result in TC-RKB-611 onward, or the evidence is worthless.
- **The subtlest functional rule is visibility row 3**: a draft edit of a page that *has* published versions must
  keep showing the last published version to ordinary members, while hiding the in-progress draft. TC-RKB-412 is
  written specifically for it, and it is the most likely place for an unpublished edit to leak.
- **Version creation semantics are explicit and worth defending**: auto-save must *never* create a version
  (FAQ Q4). A build that snapshots on auto-save would silently flood version history and make restore useless.
- **Deletion is irreversible and cascading** for spaces. TC-RKB-206 checks that the confirmation says so before
  the fact, not after.
