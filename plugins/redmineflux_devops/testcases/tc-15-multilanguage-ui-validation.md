# Test Cases — Multi-Language UI Validation — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Multi-Language UI Validation |
| **TC Range** | TC-RDV-561 to TC-RDV-575 |
| **Total TCs** | 15 |
| **Requirement Coverage** | SYS-003, SYS-007 (UI localisation across 11 languages) |

---

> **Testing Rule — Translation Quality Standard:**
> Do NOT file a bug for wording differences between languages (e.g., "Rebuild" translated as "Neu erstellen" vs "Neu bauen" in German). Only flag an issue when the **meaning changes** so that the user would take the **wrong action** or be **misled** (e.g., a "Destroy" button translated as "Save", or a destructive confirmation labelled as a neutral action). Stylistic or synonym-level differences between locale files are expected and acceptable.

---

### TC-RDV-561 — DevOps tab visible after enabling plugin module

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Navigation, Plugin Module Enable |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Redmine project "Test Project" does not have the DevOps module enabled.
- Admin user is logged in.
- UI language is set to English (en).

**Test Data:**
- Project: "Test Project"
- Language: English (en)

**Steps:**
1. Navigate to Project Settings → Modules.
2. Verify the "DevOps" module checkbox is present but unchecked.
3. Check the "DevOps" module checkbox and save.
4. Navigate to the "Test Project" project page.
5. Observe the project navigation tabs.

**Expected Result:**
- Before enabling: no "DevOps" tab is visible in the project navigation.
- After enabling: a "DevOps" tab appears in the project navigation bar.
- Clicking the DevOps tab navigates to the DevOps section (HTTP 200, no errors).
- No JavaScript console errors are present.
- The tab label reads "DevOps" in English (or the locale-equivalent label).

---

### TC-RDV-562 — Sub-navigation bar shows all 12 tabs without overflow

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Navigation — Sub-navigation bar |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module is enabled on the project.
- Browser window is at standard desktop resolution (1280×800).
- Language: English (en).

**Test Data:**
- Expected tabs: Builds, Commits, Pull Requests, Deployments, Environments, Releases, Alerts, Security, Incidents, Metrics, Repos, Settings

**Steps:**
1. Navigate to the project DevOps section.
2. Observe the sub-navigation bar below the main navigation.
3. Count the visible tabs.
4. Inspect the layout for any horizontal overflow, hidden tabs, or scrollbar on the navigation bar.

**Expected Result:**
- Exactly 12 tabs are visible: Builds, Commits, Pull Requests, Deployments, Environments, Releases, Alerts, Security, Incidents, Metrics, Repos, Settings.
- All 12 tabs fit within the navigation bar at 1280×800 without overflow, truncation, or a horizontal scrollbar.
- No tab label is clipped or partially hidden.
- Each tab is clickable and navigates to its respective page (HTTP 200).

---

### TC-RDV-563 — Active tab highlighted with blue underline

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Navigation — Active tab highlight |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module enabled on the project.
- Language: English (en).

**Test Data:**
- Tabs to test: Builds, Incidents, Deployments

**Steps:**
1. Navigate to DevOps → Builds tab.
2. Observe the styling of the "Builds" tab.
3. Navigate to DevOps → Incidents tab.
4. Observe the styling of the "Incidents" tab.
5. Navigate to DevOps → Deployments tab.
6. Observe the styling of the "Deployments" tab.

**Expected Result:**
- The active (currently selected) tab has a visible blue underline or equivalent active-state indicator.
- All other (inactive) tabs do not have the blue underline.
- The active indicator switches correctly when navigating between tabs (not stuck on a previous tab).
- The active state indicator is implemented via CSS class (not inline style) to support theming.

---

### TC-RDV-564 — Empty state messages shown when no data exists

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Empty States |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- A new project "Empty Project" has the DevOps module enabled but no data (no builds, commits, PRs, incidents, alerts, vulnerabilities, or deployments).
- Language: English (en).

**Test Data:**
- Project: "Empty Project" (no DevOps data)
- Tabs to verify: Builds, Incidents, Alerts, Security, Deployments

**Steps:**
1. Navigate to "Empty Project" → DevOps → Builds tab.
2. Observe the page body.
3. Repeat for Incidents, Alerts, Security, and Deployments tabs.

**Expected Result:**
- None of the tabs show a blank white screen, unformatted empty area, or JavaScript error.
- Each tab displays a descriptive empty state message, such as:
  - Builds: "No builds recorded yet. Configure your CI/CD webhook to start seeing build data."
  - Incidents: "No incidents recorded. Click 'New Incident' to create your first incident."
  - Alerts: "No alerts received. Configure your monitoring tool webhook to start seeing alerts."
  - Security: "No vulnerabilities found."
  - Deployments: "No deployments recorded yet."
- Empty state messages are translated (not hard-coded English strings) when the UI language is changed.

---

### TC-RDV-565 — Build status labels translated in German, French, and Spanish

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Builds — Localization |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- At least one build exists with each status: Running (blue), Passed (green), Failed (red), Cancelled (gray).
- DevOps module enabled.
- Locale files for German (de), French (fr), Spanish (es) are installed.

**Test Data:**
- Build statuses: Running, Passed, Failed, Cancelled
- Languages: German (de), French (fr), Spanish (es)

**Steps:**
1. Set UI language to German (de).
2. Navigate to DevOps → Builds tab.
3. Verify the four build status labels are displayed in German (e.g., "Läuft"/"Ausstehend", "Erfolgreich", "Fehlgeschlagen", "Abgebrochen" — or locale-equivalent terms).
4. Verify the meaning of each translated label is correct (Running→running/in-progress concept; Passed→success concept; Failed→failure concept; Cancelled→cancelled concept).
5. Set UI language to French (fr).
6. Verify labels appear in French with correct meanings.
7. Set UI language to Spanish (es).
8. Verify labels appear in Spanish with correct meanings.

**Expected Result:**
- All four build status labels are translated in each language (German, French, Spanish).
- No raw translation keys (e.g., `devops.build.status.passed`) appear in the UI.
- The translated labels convey the same meaning as the English originals.
- Color-coding (blue/green/red/gray) is language-independent and unaffected by locale changes.
- Per the testing rule: wording variations between languages are acceptable; only meaning-changing mistranslations are bugs.

---

### TC-RDV-566 — Severity labels translated in Japanese

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Incidents — Japanese Localization |
| **Requirement Ref** | INC-001, SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- At least one incident exists for each severity: SEV1 (Critical), SEV2 (Major), SEV3 (Minor), SEV4 (Low).
- Japanese locale file (ja) is installed.

**Test Data:**
- Severity levels: SEV1/Critical, SEV2/Major, SEV3/Minor, SEV4/Low
- Language: Japanese (ja)

**Steps:**
1. Set UI language to Japanese (ja).
2. Navigate to DevOps → Incidents tab.
3. Observe the severity labels in the incident list.
4. Open an individual incident detail page.
5. Observe the severity field label and value.

**Expected Result:**
- Severity labels are displayed in Japanese characters (e.g., "クリティカル" for Critical, "重大" for Major, etc. — or locale-equivalent terms).
- No raw English severity labels ("Critical", "Major", "Minor", "Low") appear when the locale is Japanese.
- No raw translation key strings (e.g., `devops.incident.severity.critical`) are visible.
- The translated labels correctly convey the relative urgency (SEV1 > SEV2 > SEV3 > SEV4).
- Page renders without layout breakage from Japanese character rendering.

---

### TC-RDV-567 — No broken layout in Russian or Japanese due to long words or wide characters

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Layout — Russian and Japanese |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module enabled with data in Builds, Incidents, and Deployments tabs.
- Russian (ru) and Japanese (ja) locale files installed.

**Test Data:**
- Languages: Russian (ru), Japanese (ja)
- UI sections: sub-navigation bar, incident list table, deployment list table, build status badges

**Steps:**
1. Set UI language to Russian (ru).
2. Navigate through DevOps sub-navigation bar (all 12 tabs).
3. Open the Incidents tab and review the table layout.
4. Open the Deployments tab and review the table layout.
5. Take note of any text overflow, overlap, or table column distortion.
6. Set UI language to Japanese (ja).
7. Repeat steps 2–5 for Japanese.

**Expected Result:**
- Russian: longer translated words do not cause tab labels to overflow the navigation bar, overlap each other, or push content off-screen. Table columns remain aligned.
- Japanese: wider CJK characters do not cause column misalignment, truncation of adjacent content, or horizontal scrollbars on the main content area.
- In both locales, text overflows (if any) are handled gracefully via CSS (`text-overflow: ellipsis` or equivalent) — not by breaking the layout.
- No element z-index or stacking context issues caused by long/wide text in either language.

---

### TC-RDV-568 — Pagination labels translated across key languages

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Pagination — Localization |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- More than 50 builds exist in the project (pagination is active; 50 per page).
- Locale files for German (de), French (fr), Spanish (es), Japanese (ja) installed.

**Test Data:**
- Languages: German (de), French (fr), Spanish (es), Japanese (ja)
- Pagination elements: Previous, Next, page number indicator (e.g., "Page 1 of 4")

**Steps:**
1. Set UI language to German (de) → navigate to DevOps → Builds tab.
2. Locate the pagination controls at the bottom of the page.
3. Verify "Previous", "Next", and the page indicator text are displayed in German.
4. Repeat for French (fr), Spanish (es), and Japanese (ja).

**Expected Result:**
- In all four languages, pagination controls show translated labels for "Previous" and "Next" (or equivalent directional symbols).
- The page count indicator (e.g., "Page 1 of 4" / "Seite 1 von 4" / "Page 1 sur 4") is translated correctly.
- No raw English pagination text ("Previous", "Next", "Page", "of") appears when a non-English locale is active.
- Pagination functionality (navigating pages) is unaffected by language changes.

---

### TC-RDV-569 — Action button labels translated in all supported languages

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Action Buttons — Localization |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Build with `trigger_builds` permission visible (for "Rebuild" button).
- Deployment pending approval visible (for "Approve" button).
- Environment with lock/unlock capability visible (for "Lock" button).
- Locale files installed for: German (de), French (fr), Spanish (es), Japanese (ja), Russian (ru), Dutch (nl), Polish (pl), Portuguese (pt), Brazilian Portuguese (pt-BR), Simplified Chinese (zh-CN).

**Test Data:**
- Buttons: "Rebuild", "Approve", "Lock"
- Languages: de, fr, es, ja, ru, nl, pl, pt, pt-BR, zh-CN

**Steps:**
1. For each of the 10 languages listed, set the UI language to that locale.
2. Navigate to the Builds tab → verify the "Rebuild" button label is translated (not English).
3. Navigate to a pending deployment → verify the "Approve" button label is translated.
4. Navigate to the Environments tab → verify the "Lock" button label is translated.
5. In each language, verify the button meaning is preserved: "Rebuild" = triggering a new build; "Approve" = granting approval; "Lock" = preventing deployments.

**Expected Result:**
- In all 10 languages, the three button labels are translated into the target language.
- No raw English labels ("Rebuild", "Approve", "Lock") appear when a non-English locale is active.
- No raw translation key strings are visible.
- The translated labels are semantically correct — the action conveyed is the same as the English original.
- Per testing rule: flag only translations where the meaning changes to something incorrect or misleading.

---

### TC-RDV-570 — No layout overflow in Simplified Chinese

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | UI Layout — Simplified Chinese |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module enabled with data across all tabs.
- Simplified Chinese (zh-CN) locale file installed.

**Test Data:**
- Language: Simplified Chinese (zh-CN)
- UI sections: navigation bar, incident table, build list, deployment list, release page

**Steps:**
1. Set UI language to Simplified Chinese (zh-CN).
2. Navigate through each of the 12 DevOps sub-navigation tabs.
3. On each page, scroll vertically and check for horizontal scrollbars.
4. Open the Incidents list table and verify column alignment.
5. Open the Releases list and verify the page layout.
6. Open the Environments dashboard and verify environment cards render correctly.

**Expected Result:**
- No horizontal overflow occurs on any page when the UI is set to Simplified Chinese.
- CJK characters in navigation tabs and table column headers do not exceed their container bounds.
- No layout element overlaps any other element.
- All UI components (cards, badges, tables, buttons) render within their expected boundaries.
- No JavaScript console errors related to rendering or locale loading are present.

---

### TC-RDV-571 — Plugin loads in Dutch, Polish, and Portuguese without console errors

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Locale File Integrity — Dutch, Polish, Portuguese |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- Dutch (nl), Polish (pl), and Portuguese/European (pt) locale files are installed for the plugin.

**Test Data:**
- Languages: Dutch (nl), Polish (pl), Portuguese (pt)

**Steps:**
1. Set UI language to Dutch (nl).
2. Open the browser developer console (F12 → Console tab).
3. Navigate to DevOps → Builds, Incidents, Deployments, Settings tabs.
4. Verify no JavaScript console errors appear related to missing translations, undefined locale keys, or locale file load failures.
5. Repeat steps 1–4 for Polish (pl).
6. Repeat steps 1–4 for Portuguese (pt).

**Expected Result:**
- In all three locales (Dutch, Polish, Portuguese), the DevOps plugin loads without console errors.
- No "Missing translation" warnings appear in the console.
- No locale file 404 errors appear in the Network tab.
- UI text in each locale is displayed in the target language (not falling back to English or showing raw keys).
- Page functionality (navigation, data display, button clicks) operates correctly in all three locales.

---

### TC-RDV-572 — Brazilian Portuguese and European Portuguese use separate locale files

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Locale File Separation — pt vs pt-BR |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- Both European Portuguese (pt) and Brazilian Portuguese (pt-BR) locale files are installed.

**Test Data:**
- Language A: Portuguese (pt) — European
- Language B: Brazilian Portuguese (pt-BR)
- Key phrases to compare: build status labels, button labels, navigation tab names

**Steps:**
1. Set UI language to European Portuguese (pt).
2. Navigate to DevOps → Builds and record the translated labels for: "Rebuild", "Passed", "Failed", "Running".
3. Set UI language to Brazilian Portuguese (pt-BR).
4. Navigate to DevOps → Builds and record the same translated labels.
5. Compare the two sets of labels side by side.
6. Verify each locale uses a distinct translation file (not the same file symlinked or copied).

**Expected Result:**
- Both pt and pt-BR locale files exist as separate files in the plugin's locales directory.
- At least some labels differ between pt and pt-BR (e.g., Brazilian Portuguese uses different vocabulary or spelling conventions — "corrido" vs "a correr", or "Falhou" vs "Falhou" with different phrasing elsewhere).
- Both locales load without errors and render translated content.
- Neither locale falls back to the other or to English for any DevOps-specific translation key.
- The existence of two separate files confirms the plugin treats pt and pt-BR as distinct locales.

---

### TC-RDV-573 — Form validation error messages translated in the user's active language

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Form Validation — Localization |
| **Requirement Ref** | INC-001, SYS-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module enabled.
- German (de), French (fr), and Spanish (es) locale files installed.

**Test Data:**
- Languages: German (de), French (fr), Spanish (es)
- Form: New Incident form
- Validation trigger: submitting the form with the Title field blank

**Steps:**
1. Set UI language to German (de).
2. Navigate to DevOps → Incidents → New Incident.
3. Leave the "Title" field blank.
4. Submit the form.
5. Verify the validation error message language.
6. Repeat steps 1–5 for French (fr).
7. Repeat steps 1–5 for Spanish (es).

**Expected Result:**
- In German (de): the validation error "Title can't be blank" appears in German (e.g., "Titel kann nicht leer sein" or equivalent).
- In French (fr): the error appears in French (e.g., "Le titre ne peut pas être vide" or equivalent).
- In Spanish (es): the error appears in Spanish (e.g., "El título no puede estar en blanco" or equivalent).
- No English error text appears when the UI is set to a non-English locale.
- The error message accurately conveys "Title is required" in all three languages — any translation that changes the meaning to something misleading is a bug.

---

### TC-RDV-574 — Tooltip translations present on action buttons

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Tooltips — Localization |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- DevOps module enabled with a build, an incident, and an environment visible.
- German (de) and French (fr) locale files installed.

**Test Data:**
- Action buttons with tooltips: "Rebuild" (on build), "Create Post-Mortem" (on incident), "Lock" (on environment)
- Languages: German (de), French (fr)

**Steps:**
1. Set UI language to German (de).
2. Navigate to DevOps → Builds → hover over the "Rebuild" button.
3. Verify a tooltip appears and is displayed in German.
4. Navigate to DevOps → Incidents → an incident detail page → hover over "Create Post-Mortem".
5. Verify the tooltip is in German.
6. Navigate to DevOps → Environments → hover over the "Lock" button.
7. Verify the tooltip is in German.
8. Repeat steps 2–7 with UI language set to French (fr).

**Expected Result:**
- Tooltips on the "Rebuild", "Create Post-Mortem", and "Lock" buttons are translated and appear in German (de) when the locale is German.
- Tooltips appear in French (fr) when the locale is French.
- No English tooltip text is shown when a non-English locale is active.
- Tooltips are present (not absent) — missing tooltips in any language are flagged as a missing translation, not as acceptable.
- The tooltip text accurately describes the button's action in the target language.

---

### TC-RDV-575 — Language switching does not require page reload to take effect on DevOps pages

| Field | Value |
|-------|-------|
| **Module** | Multi-Language UI Validation |
| **Feature** | Locale Switching Behavior |
| **Requirement Ref** | SYS-003 |
| **Priority** | Low |
| **Scenario Type** | Validation |

**Preconditions:**
- User is logged in and currently viewing DevOps → Incidents in English (en).
- At least one incident exists.

**Test Data:**
- Source language: English (en)
- Target language: French (fr)

**Steps:**
1. While on the DevOps → Incidents page (language: English), navigate to user profile → language settings.
2. Change language to French (fr) and save.
3. Observe whether the Incidents page is re-rendered after the language change.
4. If a full page reload occurs, verify the Incidents page is shown in French after the reload.
5. Verify the incident list columns (Severity, Status, MTTR, Assigned To) are shown with French labels.
6. Verify the sub-navigation tabs are shown in French.
7. Verify the "New Incident" button label is in French.
8. Switch back to English (en) and verify the page returns to English labels.

**Expected Result:**
- After changing to French (fr), the DevOps Incidents page renders with French labels for all UI elements.
- The transition to French does not require a manual cache clear or browser restart.
- All three label categories are in French: column headers, navigation tabs, and action buttons.
- No English labels remain visible after the language change (no partial translation — either fully translated or falls back gracefully with a clear fallback indicator).
- Switching back to English restores all English labels correctly.
