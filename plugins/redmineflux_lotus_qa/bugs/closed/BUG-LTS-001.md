# BUG-LTS-001

- Bug ID: BUG-LTS-001
- Production Redmine Issue ID: 120216
- Severity: Medium
- Title: Longer German admin-sidebar labels ("Benutzerdefinierte Felder", "LDAP-Authentifizierung") are clipped with an ellipsis under the Lotus theme, while they render fully under the Default theme
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Redmineflux lotus
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080 (viewport at time of discovery — not yet confirmed at 1280×720)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Redmine system default language and the admin account's own language both set to German (Deutsch).
- Active theme: Redmineflux lotus.

## Steps to reproduce

1. Log in as admin, confirm German language active.
2. Set theme to "Redmineflux lotus" (Administration > Settings > Display).
3. Navigate to any Administration page, e.g. `/settings/plugin/flux_tags` or `/admin`.
4. Look at the left sidebar's Administration navigation list, specifically the "Benutzerdefinierte Felder" (Custom fields) and "LDAP-Authentifizierung" (LDAP authentication) entries.

## Expected result

- Full label text should be visible, consistent with the Default theme (where these same German strings render in full, unclipped, in the equivalent admin nav list) and consistent with every other, shorter label in the same Lotus sidebar list (e.g. "Projekte", "Benutzer", "Workflow", "Plugins").

## Actual result

Both labels are visibly truncated with an ellipsis (`Benutzerdefinierte F…`, `LDAP-Authentifizier…`). Confirmed via computed styles, not just visual impression:

```
"Benutzerdefinierte Felder": text-overflow: ellipsis; white-space: nowrap; scrollWidth 190px > clientWidth 171px
"LDAP-Authentifizierung":    text-overflow: ellipsis; white-space: nowrap; scrollWidth 178px > clientWidth 171px
```

The Lotus sidebar nav renders each item's container at a fixed ~171px width with `white-space: nowrap`, which is enough for shorter German labels and for the equivalent (shorter) English strings ("Custom fields", "LDAP authentication"), but not enough for these two longer German translations. This is a genuine "longer German text breaks the Lotus theme's fixed-width layout" defect — exactly the failure mode this test cycle is specifically checking for.

## Severity rationale

Medium: purely cosmetic (the links remain fully clickable — `href` unaffected — so no functional loss), but it affects two of the most commonly-used admin nav items and is visible on every single admin page for a German-language admin, unlike the on-off Tag/Checklist bugs which are scoped to specific flows.

## Additional affected surface — project sidebar (confirmed 2026-09-07, second Forge server flux-f6nlrqpvk49, Gantt plugin retest)

The same root cause also clips the **project-level** sidebar nav (not just the Administration nav covered above). On a Gantt-enabled project's own menu (Übersicht/Dashboard/Flux Gantt/Aktivität/Roadmap/Tickets/.../Konfiguration), the "Aufgewendete Zeit" (Spent time) entry renders as **"Aufgewendete ..."**.

Confirmed via computed styles: the outer nav link itself is a uniform 159px (not clipped, matching every sibling item), but the inner text span carrying the label is fixed at only **111px** with `white-space: nowrap` / `text-overflow: ellipsis`, while "Aufgewendete Zeit" needs **118px** (`scrollWidth`) — a 7px overflow, just enough to trigger the ellipsis on this one label while every shorter German label in the same list ("Übersicht", "Dashboard", "Aktivität", "Roadmap", "Tickets", "Kalender", "News", "Dokumente", "Wiki", "Dateien", "Konfiguration") fits and renders fully.

Same theme-wide defect as the admin-nav finding above (a fixed-width text container too narrow for some longer German nav labels) — documented here as an additional affected surface rather than a separate bug, since it reproduces on any project using this theme, not something specific to the Gantt plugin.

## Additional confirmation — third Forge server, Agile Board Project (confirmed 2026-09-08, flux-frmka2kzh49)

Reproduces identically on a third, independent Forge instance and a different project ("Agile Board Project", Agile Board plugin enabled instead of Gantt). Confirmed via computed styles — exact same numbers as the original finding:

```
"Aufgewendete Zeit": text-overflow: ellipsis; white-space: nowrap; scrollWidth 118px > clientWidth 111px
```

This further confirms the defect is purely theme-owned (same fixed ~111px inner-text-span width regardless of which plugin's project menu is showing it), not tied to any specific plugin or server.

## Fix verified — 2026-09-09

Retested on a second Forge server (`https://flux-fhggkobjh49.forge.zehntech.com/`), Lotus theme active, German language, Admin role.

- **Admin sidebar** ("Benutzerdefinierte Felder", "LDAP-Authentifizierung"): confirmed via computed styles — `white-space: normal` (was `nowrap`), `text-overflow: clip` (was `ellipsis`), `scrollWidth === clientWidth` for both labels (158px/158px and 147px/147px). The sidebar now wraps long labels across two lines instead of clipping — same redesigned sidebar noted in `docs/LOTUS_MEMORY.md`.
- **Project sidebar** ("Aufgewendete Zeit"): confirmed via computed styles on the expanded sidebar — text span `clientWidth 131px === scrollWidth 131px`, no longer clipped (previously 111px container vs 118px needed).

Both sub-findings are FIXED. Moving to `bugs/closed/`.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-LTS-001/admin-sidebar-truncated-german-labels.png)

### Screenshot — project sidebar variant

![Project sidebar "Aufgewendete Zeit" clipped](../../screenshots/BUG-LTS-001/project-sidebar-aufgewendete-zeit-clipped.png)

### Screenshot — third-server confirmation (Agile Board Project)

![Agile Board Project sidebar clipped, third server](../../screenshots/BUG-LTS-001/agile-board-project-sidebar-clipped-server3.png)

### Retest screenshot

![Admin sidebar fixed, server 2](../../screenshots/BUG-LTS-001/retest-2026-09-09-server2-pass.png)

![Project sidebar fixed, server 2](../../screenshots/BUG-LTS-001/retest-2026-09-09-server2-project-sidebar-pass.png)

### Console / log

- No related console errors; this is a CSS/layout defect, not a JS error.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
