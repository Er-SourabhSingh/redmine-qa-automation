# Test Scope — Redmineflux Lotus Theme

## In Scope

- [x] UI validation
- [x] Multi-language testing (German)
- [ ] Functional testing (beyond what's incidentally exercised while checking translation)
- [ ] Permission testing
- [ ] Workflow testing
- [ ] Negative testing

## Out of Scope

- Functional correctness of plugins reused under this theme (covered by each plugin's own test cycle) — this cycle only checks that Lotus renders their UI without introducing new translation/layout defects.

## Redmine Version

- 7.0.1.stable

## Environment

- Forge — `https://flux-frmka2kzh49.forge.zehntech.com/` (current; earlier sessions used `flux-fczk00paf49` and `flux-f6nlrqpvk49`, both since expired/replaced)

## Test Cycle

- German + Lotus theme, Stage 1 (Default theme baseline established by other plugins' own cycles) through Stage 6 (Lotus + resolution combined). See `LOTUS_GERMAN_LANGUAGE.md` for full TC-by-TC detail; this section is the running Pages/Forms coverage checklist.

## Pages & Forms Coverage Checklist

> Updated 2026-09-08 in response to: "have you tested all pages can you make list of pages and forms". ✅ = tested under Lotus + German this cycle. ⬜ = not yet tested.

### Core Redmine — general
- [x] Home page (`/`) — hero widget, stat tiles
- [x] My Page (`/my/page`) — existing blocks, "Hinzufügen:" add-block dropdown (all 11 options)
- [x] Search (`/search`)
- [x] My Account (`/my/account`)
- [ ] Password-change form (linked from My Account, not opened — deliberately deferred)
- [ ] Login page (pre-authentication — deliberately deferred, would require logging out of the active admin session)
- [ ] Registration / "forgot password" pages (deliberately deferred, same reason as Login)
- [x] Custom queries — create/save a query from the issue list (TC-LTS-011)
- [ ] Issue context (right-click) menu (one attempt made, no menu appeared — not a native browser context-menu override in this app; deliberately not pursued further)

### Projects
- [x] Projects list — card view (Default theme) and card+list/table view toggle (Lotus-only feature, `?display_type=list`)
- [x] Project Overview (Übersicht)
- [x] Project Wiki (new-page form only — project has no existing wiki content)
- [x] An actual populated Wiki content page (view/edit an existing page) (TC-LTS-011 — created page, viewed history + index/sitemap)
- [x] Project Roadmap
- [x] A specific Version's own detail page (TC-LTS-011 — Version 5 detail page)
- [x] Project Calendar
- [x] Project News (list; empty)
- [x] A News item's own detail page + comments (TC-LTS-011 — created, viewed, deleted)
- [x] Project Documents (list; empty)
- [x] A Document's own detail page (TC-LTS-011 — created, viewed, deleted)
- [x] Project Files (list; empty)
- [ ] File download/preview (no file exists on this project to download; deliberately deferred)
- [x] Project Activity
- [x] Project Settings — all 9 tabs opened: Projekt, Mitglieder, Tickets, Versionen, Ticket-Kategorien, Repositories (list only), Foren (list; empty), Zeiterfassung, Sprints (Agile Board's own tab)
- [x] Repositories tab's own "new repository"/SCM-configuration form content (TC-LTS-011 — form viewed, never submitted, no repo created)
- [x] Forums — creating an actual topic/message (TC-LTS-011 — "QA Test Forum" + topic created, viewed, replied, deleted)
- [ ] Project copy / archive / close / delete flows (deliberately deferred — destructive/irreversible flows on a shared Forge project, not exercised)

### Issues
- [x] Issue detail page (view) — including tab strip (Historie/Notizen/Checklisten-Verlauf) at both 1920×1080 and 1280×720
- [x] Issue edit (inline, via multiple plugin widgets: Assignee `rf-ss`, Status/Priority native selects, Description CKEditor, Subject)
- [x] New Issue form (full field set)
- [x] Copy Issue form
- [x] Bulk-edit issues form
- [x] Issue relations — add (all 8 relation types)
- [x] Issue watchers — add
- [x] Move issue (to another project/tracker) — confirmed merged into the bulk-edit form's "Projekt" dropdown; `/issues/move` route itself returns 404, no separate page exists (TC-LTS-011)
- [x] Issues list — project-level and global, incl. inline-edit entry points
- [x] Global Gantt (`/issues/gantt`, core Redmine's own — distinct from the Flux Gantt plugin)
- [x] Global Calendar (`/issues/calendar`)
- [x] Time entries / Spent time global list and report (TC-LTS-011)

### Administration
- [x] Projects list (admin)
- [x] Users list
- [x] Groups list
- [x] Roles and permissions list
- [x] Trackers list
- [x] Issue statuses list
- [x] Workflow (summary/role+tracker selection screen)
- [x] Custom fields list
- [x] Enumerations (Document categories, Issue priorities, Time-tracking activities)
- [x] Settings → Allgemein (General) tab
- [x] Settings → Anzeige (Display) tab (used throughout to switch themes)
- [x] Settings → Integrations tab
- [x] Settings → Authentifizierung, Projekte, Benutzer, Tickets, Zeiterfassung, Dateien, Mailbenachrichtigung, Eingehende E-Mails, Repositories tabs — own field content opened (TC-LTS-011; found 8 core-Redmine i18n gaps, see Notes)
- [x] LDAP-Authentifizierung — list + full "new auth source" form
- [x] Applikationen (OAuth applications)
- [x] Plugins list
- [x] Informationen (system info)
- [x] **Redmineflux Lotus plugin's own "Konfigurieren" (Configure) page** — 404, filed as `BUG-LTS-005`
- [ ] Outgoing-email test page (no SMTP configured on this Forge instance to safely trigger; deliberately deferred)

### Cross-plugin surfaces retested under Lotus (own test cycles have full detail)
- [x] Tag Plugin — issue-detail tag widget, admin Manage Tags page
- [x] Checklist Plugin — issue-detail widget, admin template list + delete modal
- [x] Flux Gantt Plugin — main view, Add Issue dialog, Settings panel, Edit Version modal, delete confirmation
- [x] Agile Board Plugin — project board, Board-Einstellungen, Weitere Filter, Backlog, issue-detail Sprint/Story Points fields, Sprints settings tab
- [x] Inline Editor Plugin — Assignee widget, Description CKEditor, Issues-list inline edit, Projects card/list view
- [ ] Dashboards Plugin — not yet retested under Lotus (last item on this theme's own to-do list)

## Edit-form + resolution coverage (TC-LTS-012)

Explicitly confirmed per the user's direct question ("did you tested edit and create form of each sections... also did you tested in both resolution") — both the Create AND Edit form were opened and checked under Lotus for: Wiki (Sidebar + content page), News, Document, Forum, Forum Topic, Version, Issue Category, Member (add-member modal + inline role-edit), Custom Query (actual Edit form page, not just link presence). Resolution spot-checked at 1280×720 via `scrollWidth`/`clientWidth` overflow scans on the News create form, Version edit form, Members table, and Query edit form — no clipping found on any. See `LOTUS_GERMAN_LANGUAGE.md` TC-LTS-012 for full detail.

## Notes

### Core-Redmine i18n gaps (not Lotus/Redmineflux-owned — informational only, not filed as bugs)

Confirmed theme-agnostic (reproduce under Default too) and not covered by any installed Redmineflux plugin. Documented for completeness since fixing these is outside Redmineflux's control (upstream Redmine 7.0.1 core translation gaps):

- "Apply issues filter" link (Search page)
- "Integrations" tab label, "Enable webhooks", "Enable reactions", "Pandoc available (optional)", "Default queue adapter which is well suited only for dev/test changed" (Settings → Integrations)
- "Last activity" (Projects list available-columns picker, value `last_activity_date`)
- "Only for things I watch" (notification option, value `only_my_watches`)
- "Assignee drop-down display format" + its 3 options ("Users then groups" / "Groups then users" / "Users by group")
- "Enable default due date for new issues" + "days relative to today"
- Done-ratio options interval label
- "Accept time logs on closed issues"
- "Attachment added" (notification event checkbox)
- "has been" / "has never been" / "changed from" (Custom Query Status-filter operators)

### Deliberately deferred (not pursued this cycle, explicit)

- Password-change form, pre-auth Login page, Registration/forgot-password pages — would require disrupting the active authenticated admin session.
- Project copy/archive/close/delete — destructive/irreversible on a shared Forge project.
- File download/preview — no file exists on this project's Files tab to exercise.
- Outgoing-email test page — no SMTP configured on this Forge instance.
- Issue right-click context menu — one attempt produced no custom menu; not a native override in this app, not pursued further.
