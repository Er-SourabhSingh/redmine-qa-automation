# Features List — Redmineflux Issue Template Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/issue-template-plugin/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Plugin installation | ZIP into `plugins/` (folder name unchanged), `bundle install`, migrate, restart | TC-RIT-044 – 104 |
| 2 | Asset precompile recovery | `rake assets:precompile` + restart when CSS/JS fail to load | TC-RIT-046 |
| 3 | Version compatibility | Redmine 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x | TC-RIT-047 |
| 4 | CKEditor compatibility | Integrates with the customer's own CKEditor; licence is theirs | TC-RIT-048, 106 |
| 5 | Administration → Issue Template page | Global template list and entry point | TC-RIT-025 |
| 6 | Create a global template | Add Issue Template → Tracker, Name, Subject, Description, Project list → Submit | TC-RIT-026 – 205 |
| 7 | Global page shows only admin-created templates | Administration list is scoped to global templates | TC-RIT-030 |
| 8 | Project → Issue Template tab | Project-scoped template list and entry point | TC-RIT-071 |
| 9 | Create a project template | Same form, reached from inside a project | TC-RIT-072 |
| 10 | Project page shows project **and** global templates | Combined view inside a project | TC-RIT-073 |
| 11 | Project list restricted to the user's memberships | Creation form lists only projects the user belongs to | TC-RIT-074, 905 |
| 12 | Project filter auto-scroll | Pressing a key scrolls to projects starting with that letter | TC-RIT-076, 306 |
| 13 | Bind a template to multiple projects | Project list checkboxes, multi-select | TC-RIT-078 |
| 14 | Rebind a template later | Edit → change Project list (KB FAQ Q6) | TC-RIT-004 |
| 15 | Clear button | Resets the creation form | TC-RIT-031 |
| 16 | Cancel button | Discards without saving | TC-RIT-032 |
| 17 | Edit a template (pencil icon) | Edit/Update Issue Template page | TC-RIT-001 – 403 |
| 18 | Delete a template (trash icon + confirm) | Confirmation dialog, then removal | TC-RIT-005 – 407 |
| 19 | Default template pre-selected by tracker | New Issue auto-selects the tracker's default template (FAQ Q7) | TC-RIT-010 – 504 |
| 20 | Template pre-fills Subject and Description | Issue creation form populated from the template | TC-RIT-014 – 507 |
| 21 | Template validation / mandatory fields | KB FAQ Q4 hedges: the plugin "may offer" validation rules | TC-RIT-017 — written to **determine**, not assume |
| 22 | Uninstallation | Migrate `VERSION=0`, delete the directory, restart | TC-RIT-058 |
| 23 | Permission boundaries | Who may create/edit/delete global vs. project templates | TC-RIT-059 – 912 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run. The "Covered by TC"
  column records intended coverage, not confirmed behaviour.
- **Feature 21 is explicitly uncertain.** The KB's answer to "Are there any validation options available for
  template fields?" is hedged ("the plugin **may** offer template validation options"). TC-RIT-017 is written to
  establish what exists. If no validation feature is present, that is a documentation defect on the vendor's side,
  recorded here — not a plugin bug.
- **Feature 11 is the highest-risk item.** The KB says the project list is restricted to projects the user is a
  member of. A restriction implemented only when rendering the form, while the submit endpoint accepts any project
  ID, would let a user bind a template into a project they cannot see. TC-RIT-063 tests the endpoint specifically;
  a form-only check is not sufficient evidence.
- **Feature 19's precise rule needs establishing.** The KB says the default template is pre-selected "according to
  the tracker" but never says what happens when a tracker has two eligible templates, or when a global and a
  project template both match. TC-RIT-011 and TC-RIT-012 exist to pin that down.
- **Feature 12 (auto-scroll) is a genuine usability feature with a real failure mode** — a keypress that scrolls
  the list while the user is trying to type into a search field would make the control hostile. TC-RIT-077 checks
  the interaction between typing and scrolling rather than just that scrolling happens.
