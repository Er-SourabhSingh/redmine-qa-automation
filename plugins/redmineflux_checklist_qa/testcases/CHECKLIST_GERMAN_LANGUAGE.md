# Test Cases — Redmineflux Checklist Plugin — German Language Compatibility

> Scope: verify the Checklist plugin's own UI renders fully in German. Stage 1 of the multi-stage German/Lotus compatibility QA pass — Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Default (core Redmine).
- Redmine 7.0.1.stable, redmineflux_checklist 7.0.0.

---

### TC-CHK-001 — Issue detail Checklist widget (menu, add form, sub-item form, journal message) fully translated in German

**Steps**

1. Log in as admin, confirm German language + Default theme active.
2. Open any issue detail page (e.g. `/issues/230`).
3. Click the "..." actions icon next to "Checkliste" — inspect the "Neue Checkliste"/"Aus Vorlage hinzufügen" menu.
4. Click "Neue Checkliste", type a title, submit — inspect the resulting journal/activity message.
5. Inspect the sub-item add form ("Neues Checklisten-Element:" label, input, Save button) rendered inside the new checklist item (DOM present even while visually hidden pending a UI trigger).

**Expected Result**

- Every string is in German.

**Actual Result — PASS**

- Actions menu: "Neue Checkliste", "Aus Vorlage hinzufügen" — both German.
- New-checklist label: "Neue Checkliste:" — German.
- Journal/activity message on add: "Checkliste 'QA Test Checklist DE' wurde von Redmine Admin hinzugefügt." — fully German, correctly interpolates the entered title and the acting user's name.
- Sub-item form: label "Neues Checklisten-Element:", Save button value "Speichern" — both German.

**Verdict:** PASS. No bugs found in this pass.

---

### TC-CHK-002 — Admin Checklist Templates: create, edit, delete (with confirm modal) fully translated

**Steps**

1. Navigate to Administration > Plugins > Redmineflux Checklist Plugin > Checklisten-Vorlagen tab.
2. Click "Checklisten-Vorlage hinzufügen" — fill Vorgangstyp/Vorlagenname/Checklisten-Titel, test "Weitere Unter-Checkliste hinzufügen" (adds a second title row with its own "Löschen" link) and "Checkliste hinzufügen" (adds another title row), then remove the extras and submit.
3. Inspect the resulting template list table (columns, "Keine Unter-Checkliste" empty state, Bearbeiten/Löschen row actions).
4. Click "Löschen" on the template — inspect the confirmation modal and the resulting success message.

**Actual Result — PASS**

- Form: "Neue Checklisten-Vorlage" heading, "Vorgangstyp\*", "Vorlagenname\*", "Checklisten-Titel\*"/"Unter-Checklisten-Titel\*", "Weitere Unter-Checkliste hinzufügen", "Löschen", "Checkliste hinzufügen", "Vorlage erstellen", "Abbrechen" — all German.
- Success flash: "Checklisten-Vorlage erfolgreich erstellt." — German.
- Template list table: columns "Nr.", "Vorlagenname", "Vorgangstyp", "Checklisten", "Unter-Checklisten", "Aktionen"; empty-sub-checklist cell "Keine Unter-Checkliste"; row actions "Bearbeiten"/"Löschen" — all German.
- Delete confirmation modal (custom HTML): heading "Checklisten-Vorlage löschen", body "Möchten Sie diese Checklisten-Vorlage wirklich löschen?", buttons "Abbrechen"/"Löschen" — **100% German**, a stark contrast to the Tag Plugin's equivalent modal (`BUG-TAG-004`), which is 100% English.
- Delete success flash: "Checklisten-Vorlage wurde erfolgreich gelöscht." — German.

**Verdict:** PASS. No bugs found.

---

### TC-CHK-003 — Issue detail Checklist widget on an Agile-Board-enabled project: no cross-plugin overlap, item Edit/Delete, "Aus Vorlage hinzufügen", Checklisten-Verlauf tab

**Steps**

1. Open issue #260 in "Agile Board Project" (has Sprint/Story Points fields — chosen specifically to check for the same kind of overlap found with the Tag Plugin, `BUG-TAG-006`).
2. Add a checklist item via "Neue Checkliste"; inspect layout for any overlap with the Sprint/Story Points row above it.
3. Open the item's "..." (Aktionen) dropdown — inspect "Hinzufügen"/"Bearbeiten"/"Löschen"; test inline edit and the Delete confirmation modal.
4. Create a template ("QA Template Two"), then use "Aus Vorlage hinzufügen" on the issue — inspect the template-picker modal and resulting success message.
5. Open the "Checklisten-Verlauf" tab and inspect its content.

**Actual Result — PASS**

- No layout overlap: the Checklist widget renders in its own row well below Sprint/Story Points, unlike the Tag Plugin's widget (`BUG-TAG-006`).
- Item dropdown: "Hinzufügen", "Bearbeiten", "Löschen" — all German. Inline edit works cleanly (plain editable text field, no extra strings). Delete confirmation modal: heading "Checkliste löschen", body "Möchten Sie diese Checkliste wirklich löschen?", buttons "Abbrechen"/"Löschen" — **100% German**.
- "Aus Vorlage hinzufügen" template-picker modal: title "Checklisten-Vorlagen" — German (template names are user data). Success flash after applying: "Checkliste und zugehörige Elemente wurden erfolgreich aus der Vorlage erstellt." — fully German.
- "Checklisten-Verlauf" tab: "Aktualisiert von Redmine Admin 1 Minute vor", "Checkliste hinzugefügt: <title>" — fully German, correctly interpolated.

**Aside (out of scope, not a plugin bug):** a core Redmine "Remove" watcher icon-link (`title="Remove"`, core `/issues/:id/watchers/:id` route, not part of any Redmineflux plugin) was observed untranslated in the sidebar. Flagged for awareness only — out of scope for this plugin-focused QA cycle.

**Verdict:** PASS. No bugs found. The Checklist Plugin is the cleanest plugin tested so far in this cycle — full admin CRUD, both delete confirmation modals, and both success-message flows are completely and correctly localized.

---

### TC-CHK-004 — Sub-checklist item creation, including its per-item Status dropdown

**Steps**

1. On an issue with an existing checklist item, open the item's "..." (Aktionen) dropdown → "Hinzufügen" (add sub-item).
2. Fill and submit the "Neues Checklisten-Element:" field.
3. Inspect the resulting sub-item's own Status dropdown and the journal message.

**Actual Result — PASS**

- Sub-item created successfully; its Status dropdown options are **"Neu", "In Bearbeitung", "Erledigt"** — all fully translated. This confirms KB feature #7 (previously unconfirmed) does exist, and is correctly localized.
- Journal message: "Checklisten-Element 'QA Sub Item DE' in Checkliste 'QA Checklist Item DE' von Redmine Admin erstellt" — fully German, correctly interpolated.

**Verdict:** PASS.

---

### TC-CHK-005 — "Block issue closing" enforcement and its error message (functional test, not just label translation)

**Steps**

1. Enable "Ticket-Schließung blockieren" in Administration > Plugins > Redmineflux Checklist Plugin.
2. On an issue with an incomplete checklist item, attempt to change Status to "Closed" via **(a)** the inline quick-edit dropdown and **(b)** the full Edit form.
3. Inspect what feedback (if any) is shown to the user in each case.

**Actual Result — mixed**

- **(b) Full Edit form — PASS.** Submission is correctly rejected and redisplays the form with a validation error banner: "Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind." — fully, correctly translated. The block itself is functionally correct.
- **(a) Inline quick-edit — FAIL, but the bug is in the Inline Editor plugin, not here.** The dropdown silently reverts with no visible feedback via the accessibility tree, but a `MutationObserver` capture proved a toast *does* briefly appear (auto-dismisses too fast to catch by normal means): `Could not save: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.` — the Checklist plugin's own message content is still correctly German; the English **"Could not save:"** prefix is added by the Inline Editor plugin's toast wrapper. Filed as `BUG-INE-002` (Inline Editor plugin), not a Checklist Plugin defect.

**Verdict:** PASS for the Checklist Plugin specifically — its validation logic and message content are both functionally correct and fully translated in every path tested.

---

### TC-CHK-006 — "Aus Vorlage hinzufügen" journal message

**Steps**

1. Apply a checklist template to an issue via "Aus Vorlage hinzufügen".
2. Inspect the resulting journal/activity message.

**Actual Result — FAIL**

- Journal message reads entirely in English: "Applied checklist template 'QA Template Two' — 1 checklist(s) created by Redmine Admin." — the only untranslated checklist journal message found (all others are fully German).

**Verdict:** FAIL — filed as `BUG-CHK-001` (Low). Re-confirmed live on a second issue (#230) after the initial finding. **Closed per user direction** — the user had already independently reported this same finding themselves prior to this session; closed to avoid double-tracking, not because the finding was invalid.

**Follow-up (per user guidance):** checked the same event in the dedicated **Checklisten-Verlauf** tab instead of the generic Notizen/journal tab — that record is fully German: "Checkliste hinzugefügt: From Template Item" / "Checkliste 'From Template Item' wurde aus Vorlage erstellt." The untranslated string is confined to the redundant journal-note duplicate only; the canonical Checklist History feature is unaffected.

**Evidence:** `screenshots/BUG-CHK-001/apply-template-journal-untranslated.png`

---

---

## Stage 2 — Resolution testing (1280×720 and 1920×1080), German + Default theme

### TC-CHK-007 — Layout integrity at 1280×720

**Pages checked:** Issue detail (Checklist widget, journal/notes tab), admin Checklisten-Vorlagen list, template Delete confirmation modal.

**Result — PASS.** No horizontal overflow, no clipped text, no overlapping elements; modal renders centered and fully visible; table columns fit without wrapping.

### TC-CHK-008 — Layout integrity at 1920×1080

**Pages checked:** Same as above.

**Result — PASS.** Layout scales cleanly with the wider viewport, no new issues.

**Conclusion:** no resolution-dependent layout defects found for the Checklist Plugin at either tested resolution.

---

## Stages 3–6 — Lotus theme retest (German active), both resolutions

### TC-CHK-009 — Issue detail Checklist widget under Lotus theme

**Steps**

1. Switch theme to Redmineflux lotus (German stays active).
2. Open issue #260, inspect the Checkliste widget's actions menu ("Neue Checkliste"/"Aus Vorlage hinzufügen"), and check for the cross-plugin overlap pattern seen with Tags (`BUG-TAG-006`).

**Actual Result — PASS**

- No overlap with Sprint/Story Points under Lotus either (Lotus's redesigned key-value layout keeps them in their own row).
- "Neue Checkliste", "Aus Vorlage hinzufügen" — both still correctly translated under Lotus.

**Verdict:** PASS.

---

### TC-CHK-010 — Admin Checklisten-Vorlagen page + Delete modal under Lotus theme

**Steps**

1. Navigate to `/settings/plugin/redmineflux_checklist?tab=checklist_template` under Lotus.
2. Trigger the Delete confirmation modal.

**Actual Result — PASS**

- Page and modal both render cleanly with Lotus styling (styled buttons, red "Löschen" delete button), fully translated, no layout issues.
- Confirms the already-known `BUG-LTS-001` (admin sidebar label truncation) reproduces here too — not a new Checklist-specific issue.

**Verdict:** PASS for the Checklist Plugin's own content.

---

### TC-CHK-011 — Resolution testing under Lotus (1280×720 and 1920×1080)

**Steps**

1. At 1920×1080 under Lotus: inspect the issue detail page's right-column tab strip ("Historie"/"Notizen"/"Checklisten-Verlauf").
2. Resize to 1280×720, re-inspect the same tab strip.

**Actual Result**

- **1920×1080 — PASS.** All three tab labels render in full.
- **1280×720 — FAIL, but the defect is in the Lotus theme, not the Checklist Plugin.** The tab strip's container clips the "Checklisten-Verlauf" label (confirmed via computed styles: container `319.67px` wide, `overflow-x: hidden`, content needs `343px`). Confirmed this does NOT happen under Default theme at the identical resolution with the identical German label. Filed as `BUG-LTS-002` against the Lotus theme.

**Verdict:** The Checklist Plugin's own translated string ("Checklisten-Verlauf") is correct and unchanged; the container sizing defect belongs to Lotus.

**Not yet covered this session:** drag-reorder (if any), expand/collapse icon behavior.
