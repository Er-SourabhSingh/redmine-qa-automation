# Features List — Redmineflux Checklist Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ (official knowledge base, fetched 2026-09-07)

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Multiple checklists per issue | Create more than one checklist within a single issue | TC-CHK-001/003 |
| 2 | Checklist item edit | Edit an existing checklist item | TC-CHK-003 — PASS |
| 3 | Checklist item delete | Delete a checklist item, with confirmation modal | TC-CHK-003 — PASS (100% translated modal) |
| 4 | Progress bar | Visual completion percentage per checklist | TC-CHK-001 (seen, 0%, not driven to partial/complete) |
| 5 | Sub-checklist items | Add sub-items under a checklist item | TC-CHK-001 (form inspected, not submitted) |
| 6 | Checkbox complete/incomplete | Mark items done via checkbox | — (not exercised) |
| 7 | Per-item Status dropdown | "New" / "In progress" / "Done" status options — exists on **sub-checklist items**, not top-level items (why it was missed earlier) | TC-CHK-004 — PASS, all 3 options ("Neu"/"In Bearbeitung"/"Erledigt") fully translated |
| 8 | Expand/collapse checklist | Up-arrow icon toggles item visibility | — (not exercised) |
| 9 | Checklist Templates (admin) | Create/edit/delete reusable templates, tracker-based, template name field, multi-title support, "Weitere Unter-Checkliste hinzufügen"/"Checkliste hinzufügen" to add more title rows | TC-CHK-002 — PASS, fully re-verified on this server (create, list, delete + confirm modal + success message) |
| 10 | Apply template to issue | "Aus Vorlage hinzufügen" action, template-picker modal | TC-CHK-003 — PASS |
| 11 | "Block issue closing" setting | Admin toggle — prevents closing issue until checklist complete | TC-CHK-005 — PASS. Functionally enforced; full-Edit-form error message fully translated. (Inline quick-edit's toast wrapper adds an untranslated English prefix — filed as `BUG-INE-002` against the Inline Editor plugin, not this one.) |
| 12 | Auto-calculate % done from checklist | Admin toggle | Label confirmed translated; functional behavior not exercised |
| 13 | Checklisten-Verlauf (Checklist History) tab | Dedicated issue-detail tab showing checklist-specific activity | TC-CHK-003 — PASS |
| 14 | "Apply from template" journal message | Activity-log entry when a template is applied to an issue | TC-CHK-006 — untranslated, unlike every other checklist journal message. Filed as `BUG-CHK-001`, then **closed per user direction** (already independently reported by the user before this session) — not a duplicate of anything else in this repo. |

## Notes

- Session 2026-09-07 (three passes): full admin CRUD (create/edit/delete templates incl. both confirmation modals and both success messages), issue-detail widget on both a plain project and an Agile-Board-enabled project (no cross-plugin layout overlap, unlike the Tag Plugin's `BUG-TAG-006`), item-level Edit/Delete, sub-item creation with its Status dropdown, "Aus Vorlage hinzufügen", the Checklisten-Verlauf tab, and the "Block issue closing" enforcement (both functional behavior and its translated error message) — **1 bug found** (`BUG-CHK-001`, Low — untranslated "apply template" journal message). Everything else PASS. Still unconfirmed: expand/collapse (#8), and the functional behavior (not just label translation) of the auto-calculate-progress toggle (#12). Stage 2–6 (resolutions, Lotus theme) not yet run.
