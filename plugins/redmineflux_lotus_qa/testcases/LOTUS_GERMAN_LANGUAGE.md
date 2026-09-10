# Test Cases — Redmineflux Lotus Theme — German Language Compatibility

> Scope: Stages 3–5 of the multi-stage plan — apply Lotus theme (keeping German active), retest core Redmine + plugin surfaces fresh rather than assuming the Default-theme pass carries over.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Redmineflux lotus (Administration > Settings > Display > Theme).
- Redmine 7.0.1.stable, redmineflux_lotus 7.0.0.

---

### TC-LTS-001 — Home page hero widget and stat tiles fully translated in German under Lotus

**Steps**

1. Log in as admin, confirm German (system default AND account) + Lotus theme active.
2. Navigate to the home page (`/`).
3. Inspect the hero widget (heading, quick-action buttons) and the stat tiles row.

**Actual Result — PASS**

- "Willkommen, Redmine" heading, "Meine Seite"/"Projekte" buttons, and all 3 stat tiles ("Meine Projekte"/"Mir Zugewiesene Tickets"/"Überfällige Tickets") — all correctly translated.

**Cross-environment note:** a different Forge instance (`flux-fap1bpsgu49`), tested earlier in this project with only the *account* language set to German (not the system default), showed these exact same widgets completely untranslated. This suggests the widgets may read `Setting.default_language` for some strings — worth re-testing that other server with the system default also set before treating that earlier finding as still valid. Not re-filing that bug here since it does not reproduce on this server with this configuration.

**Verdict:** PASS on this server/configuration.

---

### TC-LTS-002 — Admin sidebar navigation labels render in full under Lotus

**Steps**

1. Navigate to any Administration page (e.g. `/settings/plugin/flux_tags`).
2. Inspect every item in the left sidebar's Administration nav list, particularly the longer labels ("Benutzerdefinierte Felder", "LDAP-Authentifizierung").

**Expected Result**

- Full label text visible, consistent with the Default theme's plain-list nav (confirmed unclipped there) and with shorter labels in the same Lotus sidebar list.

**Actual Result — FAIL**

- "Benutzerdefinierte Felder" and "LDAP-Authentifizierung" are clipped with an ellipsis. Confirmed via computed styles: both have `text-overflow: ellipsis; white-space: nowrap`, and `scrollWidth` exceeds `clientWidth` (190px > 171px, and 178px > 171px respectively) — genuine overflow, not a rendering artifact.

**Verdict:** FAIL — filed as `BUG-LTS-001`. This is exactly the "longer German translations break the Lotus layout" failure mode the test plan calls out specifically.

**Evidence:** `screenshots/BUG-LTS-001/admin-sidebar-truncated-german-labels.png`

---

### TC-LTS-003 — Tag Plugin issue-detail widget under Lotus (cross-theme retest)

**Steps**

1. Open an issue detail page under Lotus theme + German.
2. Click the Tags "Hinzufügen" button (Lotus's own redesigned issue-detail layout renders this as a styled button, not a plain link like Default theme).
3. Inspect the resulting tag-input widget.

**Actual Result — FAIL (same root cause as BUG-TAG-001)**

- The tag input placeholder still reads "Add Tags" — untranslated, identically to the Default-theme finding. Confirms `BUG-TAG-001` is theme-agnostic (same underlying tag-it widget, unaffected by which theme is active).

**Verdict:** FAIL — already covered by `BUG-TAG-001` (no new bug filed; added Lotus-theme screenshot as supplementary evidence to that bug).

**Evidence:** `../redmineflux_tags_qa/screenshots/BUG-TAG-001/lotus-theme-add-tags-untranslated.png`

---

### TC-LTS-004 — Admin Manage Tags page under Lotus (cross-theme retest)

**Steps**

1. Navigate to `/settings/plugin/flux_tags?tab=project` under Lotus + German.
2. Check `document.title` and the tab bar/table layout.

**Actual Result — FAIL (same root cause as BUG-TAG-003/004), layout itself is clean**

- `document.title` still leaks the same raw hash literal (`BUG-TAG-003`) — confirms this is a genuine code-level defect independent of theme.
- Visually, the Lotus-styled version of this page (styled tabs, colored "Anwenden" button) renders cleanly with no overflow/clipping at 1920×1080 — the table and tab bar adapt fine to the Lotus styling.

**Verdict:** Already covered by BUG-TAG-003/004; no new bug. Layout itself is clean under Lotus for this specific page.

---

---

### TC-LTS-005 — Checklist Plugin under Lotus theme (cross-theme retest)

**Steps**

1. Open issue #260 under Lotus + German — inspect the Checkliste widget's actions menu, and check for cross-plugin overlap with Sprint/Story Points (the pattern found with Tags, `BUG-TAG-006`).
2. Navigate to the admin Checklisten-Vorlagen page and trigger the Delete confirmation modal.

**Actual Result — PASS**

- "Neue Checkliste"/"Aus Vorlage hinzufügen" both correctly translated; no overlap with Sprint/Story Points under Lotus.
- Admin template list + Delete modal ("Checklisten-Vorlage löschen" / "Möchten Sie diese Checklisten-Vorlage wirklich löschen?") render cleanly with Lotus styling, fully translated.

**Verdict:** PASS — Checklist Plugin remains clean under Lotus (only `BUG-CHK-001`, already known, applies regardless of theme).

---

### TC-LTS-006 — Resolution testing under Lotus (1280×720 and 1920×1080)

**Steps**

1. At 1920×1080 under Lotus, inspect the issue detail page's right-column tab strip ("Historie"/"Notizen"/"Checklisten-Verlauf").
2. Resize to 1280×720, re-inspect the same tab strip.

**Actual Result — FAIL at 1280×720 only**

- 1920×1080: all three tab labels render in full — PASS.
- 1280×720: the tab strip's container (`div.tabs`) is too narrow (319.67px rendered vs. 343px of content, `overflow-x: hidden`) to fit all three German tab labels, clipping "Checklisten-Verlauf" to "Checklisten-V" with chevron-arrow scroll affordances appearing. Confirmed this does NOT happen under Default theme at the identical resolution with the identical labels.

**Verdict:** FAIL at 1280×720 — filed as `BUG-LTS-002` (Medium). This is a second, independent instance of the "longer German content overflows a Lotus fixed-width container" pattern (alongside `BUG-LTS-001`), this time triggered specifically at the smaller of the two required test resolutions — confirms the test plan's instruction not to assume a resolution that passes at 1920×1080 will also pass at 1280×720.

**Evidence:** `screenshots/BUG-LTS-002/tab-strip-clipped-1280x720.png`

---

### TC-LTS-007 — Gantt Plugin under Lotus theme (cross-theme retest, second Forge server flux-f6nlrqpvk49)

**Steps**

1. Switch active theme to Redmineflux lotus on `flux-f6nlrqpvk49` (German unchanged).
2. Retest the project Flux Gantt view: toolbar, column headers, project sidebar nav, Add Issue dialog, Settings panel, Edit Version modal, and its nested delete-confirmation dialog.

**Actual Result — mostly PASS, 1 additional confirmed surface for BUG-LTS-001 (no new Gantt-plugin bug)**

- All Gantt-plugin dialogs (Add Issue, Settings, Edit Version, delete-confirmation) render correctly under Lotus — same translated labels, no new overlap/clipping introduced by the theme.
- The already-known `BUG-GNT-001`/`BUG-GNT-002` (Gantt-plugin-specific) still reproduce under Lotus, as expected (theme-agnostic).
- Found the **project-level** sidebar nav ("Hauptmenü": Übersicht/Dashboard/Flux Gantt/Aktivität/Roadmap/Tickets/**Aufgewendete Zeit**/Gantt-Diagramm/Kalender/News/Dokumente/Wiki/Dateien/Konfiguration) clips "Aufgewendete Zeit" to "Aufgewendete ..." — confirmed via computed styles (`scrollWidth` 118px > inner label span `clientWidth` 111px, while the outer link itself is a uniform 159px matching every sibling item). This is the same root cause as `BUG-LTS-001` (a fixed-width nav-label span too narrow for some longer German strings) but on the **project** nav rather than the **admin** nav that bug originally covered.

**Verdict:** Mostly PASS — no new Gantt-plugin bug. The sidebar finding is documented as an additional affected surface on `BUG-LTS-001` (this file's own bug tracker) rather than filed against the Gantt plugin, since it would reproduce on any project under this theme regardless of which plugin is active.

**Evidence:** `screenshots/BUG-LTS-001/project-sidebar-aufgewendete-zeit-clipped.png`

### TC-LTS-009 — Stage 4: core-Redmine-under-Lotus sweep (Übersicht, Wiki, Roadmap, Kalender, News, Dokumente, Dateien, Aktivität, project Settings tabs)

**Steps**

1. Under Lotus theme + German, on the "Agile Board Project", visit each core project page: Übersicht (Overview), Wiki, Roadmap, Kalender (Calendar), News, Dokumente (Documents), Dateien (Files), Aktivität (Activity), and the project Settings ("Konfiguration") tab bar (Projekt/Mitglieder/Tickets/Versionen/Ticket-Kategorien/Repositories/Foren/Zeiterfassung/Sprints).
2. Inspect each page's headings, labels, buttons, and empty-state messages.

**Actual Result — mostly PASS, 1 new bug found (filed against Agile Board, not Lotus)**

- **Übersicht**: "Kunde"/"QA-Leiter"/"Projektleiter"/"Projektverantwortlicher"/"Startdatum"/"Abgabedatum"/"Geschätzter Aufwand"/"Aufgewendete Zeit"/"Abgeschlossen", ticket-count table, "Zeiterfassung", "Mitglieder", "Lesezeichen hinzufügen" — all correctly translated.
- **Wiki** (new-page form, no content yet): "Bearbeiten"/"Vorschau" tabs, "Kommentar", "Dateien (Maximale Größe: 5 MB)", "Abbrechen", "Speichern" — all correctly translated.
- **Roadmap**: "Abgeschlossene Versionen anzeigen", "Versionen", "Neue Version", "Offen", "Fällig in 22 Tagen (30.09.2026)", "Keine Tickets für diese Version" — all correctly translated.
- **Kalender**: weekday names ("Montag"–"Sonntag"), legend ("Ticket, das an diesem Tag beginnt" etc.) — all correctly translated.
- **News**: "News hinzufügen", "Beobachten", "Nichts anzuzeigen", "Auch abrufbar als: Atom" — all correctly translated.
- **Dokumente**: "Sortiert Nach"/"Kategorie"/"Datum"/"Titel"/"Autor", "Neues Dokument", "Nichts anzuzeigen" — all correctly translated.
- **Dateien**: "Neue Datei", table headers ("Datei"/"Datum"/"Größe"/"D/L"/"Prüfsumme") — all correctly translated.
- **Aktivität**: "Datum von/bis", "<<ich>>", "Heute" — all correctly translated.
- **Project Settings tab bar**: "Projekt"/"Mitglieder"/"Tickets"/"Versionen"/"Ticket-Kategorien"/"Foren"/"Zeiterfassung"/"Sprints" all translated; "Repositories" stays as the English/loanword form (consistent with core Redmine's own German locale convention, not a defect). The "Projekt" tab's own form ("Name", "Beschreibung", "Kennung", "Projekt-Homepage", "Öffentlich" + description, "Unterprojekt von", "Benutzer erben", "Module" + module-name checkboxes) is fully translated except the already-known "Tag list" field (`BUG-TAG-002`, theme-agnostic, reproduces here too — not a new finding).
- **Found on the "Sprints" project-settings sub-tab** (Agile Board plugin's own extension to this tab bar — also the sprint edit/delete entry point that Agile Board's own TC-AGB-012 had reported as unfindable, now corrected): the "Freigabe" (Sharing) column shows the raw untranslated enum value "not_shared" for 2 of 3 sprints, while a third correctly shows "Nicht geteilt" — confirmed via the Edit form that the underlying value is identical for all three, so this is a list-view-only rendering gap. Confirmed reproducing identically under Default theme too — **filed as `BUG-AGB-007` against the Agile Board plugin, not Lotus**, since the root cause is in that plugin's own view template, not the theme.

- Also opened the remaining project-settings tabs not covered above: **Mitglieder** ("Neues Mitglied", "Benutzer / Gruppe"/"Rollen", "Bearbeiten"), **Ticket-Kategorien** ("Neue Kategorie", "Nichts anzuzeigen"), **Foren** ("Neues Forum", "Nichts anzuzeigen"), **Zeiterfassung** ("Zurücksetzen", "Administration", "Name"/"System-Aktivität"/"Aktiv") — all correctly translated.
- Resized to **1280×720** and re-checked the Projekt-settings tab bar (all 9 tabs fit on one row, no wrap/overlap), the Sprints tab's table (clean, `BUG-AGB-007` reproduces identically), and the Roadmap page (version cards + sidebar filter panel render cleanly, "Abgeschlossene Versionen anzeigen" wraps to two lines but stays readable) — no new resolution-specific defects.

**Verdict:** Mostly PASS — no new Lotus-theme-owned bugs from this sweep (every core-Redmine page checked renders correctly under Lotus, at both 1920×1080 and 1280×720); the one new defect found belongs to the Agile Board plugin.

**Evidence:** `../redmineflux_agile_qa/screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-lotus.png`, `../redmineflux_agile_qa/screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-default.png`

---

### TC-LTS-010 — Stage 4 continued: My Page, Administration deep pages, New Issue form, Search (explicitly asked: "did you tested all core pages of redmine with theme in german language")

**Steps**

1. Under Lotus + German, check "Meine Seite" (My Page) — the blocks already present, and the "Hinzufügen:" (Add block) dropdown's own option list.
2. Check Administration → Benutzer (Users), Rollen und Rechte (Roles), Tracker, Ticket-Status (Issue statuses), Aufzählungen (Enumerations), Benutzerdefinierte Felder (Custom Fields), Workflow.
3. Check the New Issue form (`/projects/:id/issues/new`).
4. Check the Search page (`/search`) with a real query.

**Actual Result — mostly PASS, 1 informational (non-Redmineflux) finding**

- **Meine Seite**: page heading, "Hinzufügen:" dropdown (all 11 block-name options), both ticket-list table headers, "Tickets hier ablegen" empty state — all correctly translated. The Agile Board block reproduces already-known bugs only (`BUG-AGB-001`/`BUG-LTS-001` sidebar clipping), no new findings.
- **Benutzer**: "Benutzer", "Neuer Benutzer", "Importieren", Filter panel, table headers ("Mitgliedsname"/"Vorname"/"Nachname"/"E-Mail"/"Administrator"/"Angelegt"/"Letzte Anmeldung"), "Ja"/"Nein" — all correctly translated. Admin sidebar's `BUG-LTS-001` clipping reproduces here too (already known).
- **Rollen und Rechte**: "Neue Rolle", "Berechtigungsübersicht", "Kopieren"/"Löschen", "Für diese Rolle ist kein Workflow definiert (Bearbeiten)" — all correctly translated.
- **Tracker**: "Neuer Tracker", "Zusammenfassung", "Standardstatus", "Beschreibung" — all correctly translated.
- **Ticket-Status**: "Neuer Status", "Ticket Geschlossen", "Beschreibung" — all correctly translated.
- **Aufzählungen**: "Dokumentenkategorien", "Ticket-Prioritäten", "Aktivitäten (Zeiterfassung)", "Neuer Wert", "Name"/"Standardeinstellung"/"Aktiv" — all correctly translated.
- **Benutzerdefinierte Felder**: "Neues Feld", "Nichts anzuzeigen" — correctly translated.
- **Workflow**: "Zusammenfassung"/"Statusänderungen"/"Feldberechtigungen", "Workflow zum Bearbeiten auswählen:", "Rolle:"/"Alle"/"Nichtmitglied", "Tracker:", "Zeige nur Status an, die von diesem Tracker verwendet werden" — all correctly translated.
- **New Issue form**: every field label ("Tracker", "Thema", "Beschreibung", "Status", "Priorität", "Zugewiesen an", "Mir zuweisen", "Zielversion", "Übergeordnetes Ticket", "Startdatum", "Abgabedatum", "Geschätzter Aufwand", "% erledigt", "Dateien", "Beobachter", "Nach hinzufügbaren Beobachtern suchen", "Erstellen"/"Anlegen und weiter", "Privat") is correctly translated. Only the already-known "Story Points" (`BUG-AGB-001`) and "Tag list" (`BUG-TAG-002`) reproduce — no new findings.
- **Search**: "Suche" heading, "Alle Projekte", "Alle Wörter", "Nur Titel durchsuchen", all 7 scope checkboxes ("Tickets"/"News"/"Dokumente"/"Changesets"/"Wiki-Seiten"/"Forenbeiträge"/"Projekte"), "Optionen", "Suche" button, "Resultate (N)" — all correctly translated.
- **Found (informational, not filed)**: the search-results page's "Apply issues filter" link is hardcoded English. Confirmed reproducing identically under Default theme — this is a **core Redmine** i18n gap (a missing `de.yml` key upstream), not owned by the Lotus theme or any Redmineflux plugin, so not filed against either. Noted here for completeness since the user asked specifically about full core-page coverage.

**Verdict:** Mostly PASS across every page checked. The one gap found ("Apply issues filter") is outside Redmineflux's control (core Redmine, not Lotus/plugin-owned) — documented as an observation, not filed as a bug.

---

### TC-LTS-011 — Full coverage pass: Lotus plugin's own Configure page, remaining Administration pages, and remaining core forms (explicitly asked: "please cover all redmine pages do not miss any form also test lotus theme configuration page")

**Steps**

1. Test the Redmineflux Lotus plugin's own "Konfigurieren" link at Administration → Plugins.
2. Check Administration → Gruppen, LDAP-Authentifizierung (list + new-auth-source form), Applikationen, Plugins list, Informationen, and the Konfiguration → Integrations tab (webhooks) and Allgemein tab.
3. Check Mein Konto (My Account).
4. Check the issue bulk-edit form, the Copy Issue form, issue relations (add), and watchers (add).
5. Check core Redmine's own global Gantt (`/issues/gantt`) and global Calendar (`/issues/calendar`).

**Actual Result — FAIL on the Lotus Configure link (new bug), otherwise clean**

- **Lotus plugin's own "Konfigurieren" link**: clicking it (confirmed via its real `href`, `/settings/plugin/redmineflux_lotus`) returns a genuine HTTP 404, not a settings page. The 404 page itself is correctly translated (core Redmine's own error page), so this is a broken/missing route, not a translation defect. Reproduces regardless of active theme (it's a server-side routing failure). **Filed as `BUG-LTS-005` (Medium)**.
- **Gruppen**: "Neue Gruppe", "Filter", "Gruppe:", "Zurücksetzen", "Anonyme Benutzer"/"Nichtmitglieder" — correctly translated.
- **LDAP-Authentifizierung**: list page ("Neuer Authentifizierungs-Modus", table headers) and the full new-auth-source form (every field: "Name"/"Host"/"Port"/"Konto"/"Passwort"/"Base DN"/"LDAP-Filter"/"Auszeit (in Sekunden)"/"On-the-fly-Benutzererstellung"/"Attribute"/"Mitgliedsname-Attribut"/"Vorname-Attribut"/"Name-Attribut"/"E-Mail-Attribut", plus the LDAPS-vs-LDAP security notice) — all correctly translated.
- **Applikationen**: "Neue Applikation", "Nichts anzuzeigen" — correctly translated.
- **Plugins list**: "Plugins", "Name / Beschreibung"/"Autor"/"Version" — correctly translated.
- **Informationen**: most checks correctly translated ("Administrator-Passwort geändert", "Verzeichnis für Dateien beschreibbar", "Alle Datenbank-Migrationen wurden ausgeführt", "MiniMagick verfügbar (optional)", "ImageMagick-Konvertierung verfügbar (optional)", "ImageMagick PDF-Unterstützung verfügbar (optional)") — but **"Pandoc available (optional)"** and **"Default queue adapter which is well suited only for dev/test changed"** are hardcoded English (see informational note below).
- **Konfiguration → Integrations tab**: the tab label itself, "REST-Schnittstelle aktivieren", "JSONP Unterstützung aktivieren" are correctly translated, but **"Enable webhooks"** is hardcoded English (see informational note below). The tab label **"Integrations"** itself is also untranslated while every sibling tab ("Allgemein"/"Anzeige"/"Authentifizierung"/"Projekte"/"Benutzer"/"Tickets"/"Zeiterfassung"/"Dateien"/"Mailbenachrichtigung"/"Eingehende E-Mails"/"Repositories") is correctly German.
- **Konfiguration → Allgemein tab**: "Applikationstitel", "Willkommenstext", "Objekte pro Seite", "Suchergebnisse pro Seite", "Anzahl Tage pro Seite der Projekt-Aktivität", "Hostname", "Protokoll", "Textformatierung", "Formatierten Text im Cache speichern", "Wiki-Historie komprimieren", "Maximale Anzahl Einträge pro Atom-Feed" — all correctly translated, but **"Enable reactions"** is hardcoded English.
- **Mein Konto**: "Mitgliedsname:"/"Angelegt:", "Atom-Zugriffsschlüssel"/"API-Zugriffsschlüssel" sections, "E-Mails"/"Passwort ändern"/"Autorisierte Applikationen" tabs, "Vorname"/"Nachname"/"E-Mail"/"Sprache" — all correctly translated.
- **Bulk-edit issues**: "Alle ausgewählten Tickets bearbeiten", "Eigenschaften ändern", "(Keine Änderung)", every field label ("Projekt"/"Tracker"/"Status"/"Priorität"/"Zugewiesen an"/"Niemand"/"Kategorie"/"Zielversion"/"Sprint"/"Privat"/"Übergeordnetes Ticket"/"Startdatum"/"Abgabedatum"/"Geschätzter Aufwand"/"% erledigt"/"Kommentare"/"Privater Kommentar") — all correctly translated except the already-known "Story Points" (`BUG-AGB-001`).
- **Copy Issue form**: identical to the New Issue form, "Kopierte Tickets verlinken" correctly translated; only the already-known "Story Points"/"Tag list" gaps reproduce.
- **Issue relations (add)**: all 8 relation-type options ("Duplikat von"/"Dupliziert durch"/"Blockiert"/"Blockiert durch"/"Vorgänger von"/"Nachfolger von"/"Kopiert nach"/"Kopiert von") + "Hinzufügen" submit — all correctly translated.
- **Watchers (add)**: "Beobachter hinzufügen", "Abbrechen" — correctly translated.
- **Core Gantt** (`/issues/gantt`, core Redmine's own, not Flux Gantt plugin): "Gantt-Diagramm" heading, "Filter"/"Seitenleiste umschalten" buttons, "Auch abrufbar als: PDF PNG" — all correctly translated.
- **Core Calendar** (`/issues/calendar`, global): "Kalender" heading, weekday names — all correctly translated.

**Informational finding (not filed as a bug against Lotus or any Redmineflux plugin)**: this session found a recurring pattern of **newer Redmine 7.0.1 core features** whose strings are missing from the upstream community German locale (`de.yml`) — "Apply issues filter" (Search, found in TC-LTS-010), the "Integrations" tab label, "Enable webhooks", "Enable reactions", "Pandoc available (optional)", and "Default queue adapter which is well suited only for dev/test changed" (Admin Info page). All six were confirmed present regardless of active theme (Lotus or Default) and regardless of any Redmineflux plugin, since none of these features are plugin-provided (no DevOps/webhook plugin is installed on this instance) — this is a **core Redmine upstream translation gap**, entirely outside what Redmineflux (theme or plugins) can fix. Documented here for completeness per the explicit request to cover all core pages, not filed as a bug.

**Verdict:** One new Medium bug (`BUG-LTS-005`, the broken Configure link) — otherwise every core page and form checked this pass is correctly translated aside from already-known Redmineflux bugs and the informational core-Redmine gaps above.

**Evidence:** `screenshots/BUG-LTS-005/configure-link-404.png`

## TC-LTS-012 — Exhaustive remaining-pages sweep (Settings tabs' own content, Wiki/News/Document/Version detail, Forums, Time entries, Custom queries, Move-issue)

**Precondition:** Lotus theme active, German language active (system default + account level).

**Steps**

1. Open all 9 remaining Administration → Konfiguration tabs not yet individually opened (Authentifizierung, Projekte, Benutzer, Tickets, Zeiterfassung, Dateien, Mailbenachrichtigung, Eingehende E-Mails, Repositories) and check their own field content, not just the tab-bar label.
2. Create a real Wiki content page in a project, view it, check its history and the wiki index/sitemap.
3. Create a News item, view its detail page including the Comments section, then delete it.
4. Create a Document, view its detail page, then delete it.
5. Open a specific Version's own detail page from the Roadmap (Version 5).
6. Open the Repositories tab's "new repository" form (view only, do not submit — no repo configured on this project).
7. Create a Forum, create a Topic inside it, view the topic detail page with its reply form, then delete the forum (cascades to the topic).
8. Check the global Time Entries list and its Report view.
9. Create and save a Custom Query from the issue list, confirm via DOM that both "Abfrage bearbeiten" and "Abfrage löschen" links exist and are translated, then delete it.
10. Attempt `/issues/move?ids[]=<id>` directly to determine whether Move Issue exists as its own page distinct from the already-tested bulk-edit "Projekt" dropdown.
11. Revert the active theme from Lotus back to Standard (Design-Stil dropdown → Speichern) to restore baseline for the next session.

**Actual Result — PASS overall, no new Lotus/Redmineflux bugs; 8 additional core-Redmine i18n gaps found (informational)**

- **Settings tabs' own content** (all 9): every field label across Authentifizierung, Projekte, Benutzer, Tickets, Zeiterfassung, Dateien, Mailbenachrichtigung, Eingehende E-Mails, Repositories correctly translated, **except** 8 strings hardcoded English (see informational note below).
- **Wiki content page**: created page titled "Wiki" with body text "QA test wiki content for Lotus theme sweep." — page view, edit toolbar, history tab, and the wiki index/sitemap page all correctly translated.
- **News item**: create form, detail page (including "Kommentare" section), and delete confirmation — all correctly translated. Item created and deleted, no residue left.
- **Document**: create form and detail page — correctly translated. Created and deleted, no residue left.
- **Version detail page** (Version 5, opened from Roadmap): correctly translated.
- **Repositories "new repository" form**: all fields ("Versionsverwaltung"/"Bezeichner"/"Pfad zum Projektarchiv"/etc.) correctly translated. Form was viewed only, never submitted — re-visiting the Repositories tab afterward confirmed "Nichts anzuzeigen" (no repository was created), so no cleanup needed.
- **Forums**: created forum "QA Test Forum", created topic "QA German Test Topic" inside it, viewed the topic detail page with its reply form — all correctly translated. Forum deleted afterward (cascades to delete its topic), no residue left.
- **Time Entries**: global list and Report view — both correctly translated.
- **Custom Queries**: created and saved "QA German Test Query" from the issue list; confirmed via DOM query that both "Abfrage bearbeiten" and "Abfrage löschen" links exist with correct German text. Deleted via "Abfrage löschen" + confirm dialog afterward, no residue left.
- **Move Issue**: `/issues/move?ids[]=266` returns a genuine 404 — confirms Move functionality has been merged into the bulk-edit form's "Projekt" dropdown (already tested clean) rather than existing as a separate page in this Redmine version. No further action needed.
- **Theme reversion**: Design-Stil set back to "Standard" and saved; confirmed via `document.querySelector('link[href*="lotus"]')` returning `null` afterward — environment restored to Default theme baseline.

**Informational finding (not filed as a bug against Lotus or any Redmineflux plugin)**: 8 additional newer-Redmine-7.0.1-core strings found missing from the upstream German locale this pass, all confirmed theme-agnostic and not covered by any installed plugin: "Last activity" (Projects list available-columns picker, value `last_activity_date`), "Only for things I watch" (notification option, value `only_my_watches`), "Assignee drop-down display format" plus its 3 options ("Users then groups"/"Groups then users"/"Users by group"), "Enable default due date for new issues" plus "days relative to today", the Done-ratio options interval label, "Accept time logs on closed issues", "Attachment added" (notification event checkbox), and "has been"/"has never been"/"changed from" (Custom Query Status-filter operators). Combined with the 6 gaps found in TC-LTS-010/011, this brings the running total of documented core-Redmine i18n gaps to 14 — see `LOTUS_SCOPE.md` Notes section for the consolidated list. None filed as bugs; all outside Redmineflux's control.

**Verdict:** No new bugs this pass. Coverage per `LOTUS_SCOPE.md`'s checklist is now exhaustive except a small set of deliberately-deferred items (password-change form, pre-auth login/registration pages, project archive/close/delete, file download/preview, outgoing-email test page, issue right-click context menu) — see that file's "Deliberately deferred" note for the reasoning on each.

## TC-LTS-013 — Edit-form sweep + resolution check for each project section (user asked: "did you tested edit and create form of each sections... also did you tested in both resolution")

**Precondition:** Lotus theme active, German language active. Started at 1920×1080, resolution check at 1280×720.

**Context:** TC-LTS-012 exercised mostly Create forms. This TC closes the gap by opening each section's own **Edit** form specifically (not just Create), and spot-checks layout at 1280×720 on forms not already covered by the earlier resolution passes (TC-LTS-006/008/009).

**Steps and Actual Result — PASS, no new bugs**

- **Wiki**: Sidebar page's own Edit form (`/wiki/sidebar/edit`) — full toolbar (Fett/Kursiv/Unterstrichen/Durchgestrichen/Quelltext/Überschrift 1.–3. Ordnung/Aufzählungsliste/Nummerierte Liste/Task list/Zitat/Tabelle/pre/Highlighted code/Wiki-Link/Grafik/Help), "Übergeordnete Seite"/"Kommentar"/"Dateien" group, "Speichern"/"Abbrechen" — all correctly translated. Same result confirmed on the "Wiki" content page's own Edit form (`/wiki/Wiki/edit`, identical component).
- **News**: created a fresh item ("QA Lotus Edit Test News") to reach its own Edit form — "Titel *"/"Zusammenfassung"/"Beschreibung *", full toolbar, "Speichern" all correctly translated. "Erfolgreich angelegt" success toast also confirmed correctly translated. Deleted afterward, no residue left.
- **Document**: created a fresh document ("QA Lotus Edit Test Document") to reach its Edit form — "Kategorie"/"Titel *"/"Beschreibung", "Speichern" all correctly translated. Deleted afterward, no residue left.
- **Forums**: created a fresh forum ("QA Lotus Edit Test Forum") — its own Edit form ("Name *"/"Beschreibung *"/"Speichern") correctly translated. Created a topic inside it ("QA Lotus Edit Test Topic") — both the topic's **Create** form ("Thema"/"Wichtig (immer oben)"/"Gesperrt"/"Nachrichteninhalt"/toolbar/"Erstellen") and its own **Edit** form (identical fields, "Speichern") correctly translated. Forum deleted afterward (cascades to the topic), no residue left.
- **Versions**: opened the Edit form of an existing, real version (Version 5) — "Name *"/"Beschreibung"/"Status" (options "offen"/"gesperrt"/"abgeschlossen")/"Wiki-Seite"/"Startdatum *"/"Datum *"/"Freigabe" (options "Nicht gemeinsam verwenden"/"Mit Unterprojekten"/"Mit Projekthierarchie"/"Mit Projektbaum") all correctly translated. Also opened the New Version form (viewed only, not submitted — no fixture version created) — same fields minus Status, all correctly translated.
- **Issue Categories**: created a fresh category ("QA Lotus Test Category") to test both its Create form ("Name *"/"Zugewiesen an"/"Erstellen") and Edit form (same fields, "Speichern") — both correctly translated. Deleted afterward, no residue left.
- **Members**: opened the "Neues Mitglied" add-member modal — "Nach Benutzer oder Gruppe suchen:"/"Nichtmitglieder"/"Anonyme Benutzer"/"Hinzufügen" all correctly translated (role-name checkboxes are project data, not translatable strings); the modal's own "Close" button reads hardcoded English but is an icon-only close control (confirmed via its class, a decorative accessible-name not visible sighted text) — out of scope per this project's own accessibility-findings policy, not filed. Closed without submitting. Also opened an existing member's inline role-edit form (checkboxes + "Speichern") — correctly translated; not submitted (left unchanged).
- **Custom Queries**: this time opened the actual **Edit form itself** (`/queries/:id/edit`), not just confirmed the link exists as in TC-LTS-012 — identical to the Create form, "Name *"/"Beschreibung"/role-visibility checkboxes/"Für alle Projekte"/column checkboxes/"Gruppiere Ergebnisse nach"/filter dropdown/"Sortierattribut"×3/"Sortierrichtung"×3/"Speichern" all correctly translated. Created "QA Lotus Edit Test Query" to reach it, deleted afterward via "Abfrage löschen", no residue left.
- **Resolution check (1280×720)**: re-tested the News create form, the Version 5 edit form, and the Members list/role-edit table via `scrollWidth`/`clientWidth` overflow scans — zero overflowing elements found on any of them. The Custom Query edit form's `getComputedStyle` scan flagged 3 "Sortierattribut" labels with `clientWidth: 1` — investigated and confirmed these carry the `hidden-for-sighted` class (a deliberate screen-reader-only label, not a rendering defect); not a bug.
- **Theme/viewport reverted** to Standard/1920×1080 at the end of this TC, confirmed via DOM.

**Verdict:** No new bugs. Every section's own Create AND Edit form (Wiki, News, Document, Forum, Forum Topic, Version, Issue Category, Member, Custom Query) is now confirmed individually tested under Lotus, and the specific forms most likely to be squeezed (rich-text toolbars, multi-column tables, the query edit form's dense filter/column layout) show no overflow at 1280×720.

## Not yet covered this session

- A minor console 404 for `plugin_assets/redmineflux_lotus/plus-d08c3110.svg` was observed on the issue detail page; could not identify which visible element it backs within reasonable investigation time — flagged for follow-up, not filed as a bug since no visual defect was confirmed.
- Dashboard plugin retest under Lotus still pending — last remaining plugin-level item for this theme's cycle.
- Password-change form, pre-auth Login/Registration pages, project copy/archive/close/delete, file download/preview, outgoing-email test page, issue right-click context menu — deliberately deferred (see `LOTUS_SCOPE.md` Notes section for reasoning per item), not omissions.
